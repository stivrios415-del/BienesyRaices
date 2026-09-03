import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { ConfigFacturacion, ReciboConLote } from '../types/facturacion'

interface FacturacionState {
  config: ConfigFacturacion | null
  loading: boolean
  recibos: ReciboConLote[]
  loadingRecibos: boolean

  fetchConfig: () => Promise<void>
  // Incrementa el correlativo, deja el registro en "recibos" y marca el
  // pago — las tres cosas en una sola transacción del lado de la base de
  // datos (función emitir_recibo, migración 0006). Devuelve null si falla.
  emitirRecibo: (pagoId: string, loteId: string, monto: number) => Promise<number | null>
  fetchRecibos: () => Promise<void>
}

export const useFacturacionStore = create<FacturacionState>((set) => ({
  config: null,
  loading: false,
  recibos: [],
  loadingRecibos: false,

  fetchConfig: async () => {
    set({ loading: true })
    const { data, error } = await supabase.from('config_facturacion').select('*').eq('id', 'default').single()
    if (!error && data) {
      set({ config: data as ConfigFacturacion, loading: false })
    } else {
      set({ loading: false })
    }
  },

  emitirRecibo: async (pagoId, loteId, monto) => {
    const { data, error } = await supabase.rpc('emitir_recibo', {
      p_pago_id: pagoId,
      p_lote_id: loteId,
      p_monto: monto,
    })
    if (error) {
      console.error('emitir_recibo:', error.message)
      return null
    }
    return data as number
  },

  fetchRecibos: async () => {
    set({ loadingRecibos: true })
    const { data, error } = await supabase
      .from('recibos')
      .select('*, lote:lotes(numero_lote, proyecto, comprador)')
      .order('correlativo', { ascending: false })

    if (!error && data) {
      const recibos = (data as any[]).map((r) => ({
        id: r.id,
        pago_id: r.pago_id,
        lote_id: r.lote_id,
        correlativo: r.correlativo,
        monto: r.monto,
        emitido_por: r.emitido_por,
        fecha_emision: r.fecha_emision,
        numero_lote: r.lote?.numero_lote,
        proyecto: r.lote?.proyecto,
        comprador: r.lote?.comprador,
      })) as ReciboConLote[]
      set({ recibos, loadingRecibos: false })
    } else {
      set({ loadingRecibos: false })
    }
  },
}))
