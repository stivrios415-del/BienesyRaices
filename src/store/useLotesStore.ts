import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Lote, Pago } from '../types/lote'

interface LotesState {
  lotes: Lote[]
  loading: boolean
  error: string | null
  selectedLoteId: string | null
  pagosPorLote: Record<string, Pago[]>

  fetchLotes: () => Promise<void>
  selectLote: (id: string | null) => void
  fetchPagos: (loteId: string) => Promise<void>
  registrarPago: (pago: Omit<Pago, 'id' | 'created_at'>) => Promise<{ error: string | null }>
  crearLote: (lote: Partial<Lote>) => Promise<{ error: string | null }>
  crearLotesMasivo: (lotes: Partial<Lote>[]) => Promise<{ error: string | null }>
  actualizarLote: (id: string, cambios: Partial<Lote>) => Promise<{ error: string | null }>
  eliminarLote: (id: string) => Promise<{ error: string | null }>
  subscribeRealtime: () => () => void
}

export const useLotesStore = create<LotesState>((set, get) => ({
  lotes: [],
  loading: false,
  error: null,
  selectedLoteId: null,
  pagosPorLote: {},

  fetchLotes: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .order('numero_lote', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ lotes: (data ?? []) as unknown as Lote[], loading: false })
  },

  selectLote: (id) => set({ selectedLoteId: id }),

  fetchPagos: async (loteId) => {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha_pago', { ascending: false })

    if (!error && data) {
      set((state) => ({
        pagosPorLote: { ...state.pagosPorLote, [loteId]: data as unknown as Pago[] },
      }))
    }
  },

  registrarPago: async (pago) => {
    const { error } = await supabase.from('pagos').insert(pago as any)
    if (error) return { error: error.message }

    await get().fetchLotes()
    await get().fetchPagos(pago.lote_id)
    return { error: null }
  },

  crearLote: async (lote) => {
    const { error } = await supabase.from('lotes').insert(lote as any)
    if (error) return { error: error.message }
    await get().fetchLotes()
    return { error: null }
  },

  crearLotesMasivo: async (lotes) => {
    const { error } = await supabase.from('lotes').insert(lotes as any)
    if (error) return { error: error.message }
    await get().fetchLotes()
    return { error: null }
  },

  actualizarLote: async (id, cambios) => {
    const { error } = await supabase.from('lotes').update(cambios as any).eq('id', id)
    if (error) return { error: error.message }
    await get().fetchLotes()
    return { error: null }
  },

  eliminarLote: async (id) => {
    const { error } = await supabase.from('lotes').delete().eq('id', id)
    if (error) return { error: error.message }
    await get().fetchLotes()
    return { error: null }
  },

  subscribeRealtime: () => {
    // Al generar una cuadrícula grande (ej. 173 lotes de golpe), Supabase
    // dispara un evento de "postgres_changes" POR CADA FILA insertada.
    // Sin agrupar, eso eran ~173 recargas completas y re-renderizados del
    // mapa en cadena — la causa principal de la traba en móvil.
    // Se agrupan (debounce) todos los eventos que lleguen en una ráfaga y
    // solo se recarga una vez, cuando la ráfaga se calma.
    let timeoutLotes: ReturnType<typeof setTimeout> | null = null
    const recargarLotesAgrupado = () => {
      if (timeoutLotes) clearTimeout(timeoutLotes)
      timeoutLotes = setTimeout(() => {
        get().fetchLotes()
      }, 400)
    }

    const channel = supabase
      .channel('lotes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotes' }, () => {
        recargarLotesAgrupado()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos' }, () => {
        const id = get().selectedLoteId
        if (id) get().fetchPagos(id)
      })
      .subscribe()

    return () => {
      if (timeoutLotes) clearTimeout(timeoutLotes)
      supabase.removeChannel(channel)
    }
  },
}))
