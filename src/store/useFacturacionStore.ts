import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { ConfigFacturacion } from '../types/facturacion'

interface FacturacionState {
  config: ConfigFacturacion | null
  loading: boolean
  fetchConfig: () => Promise<void>
  siguienteCorrelativo: () => Promise<number | null>
}


export const useFacturacionStore = create<FacturacionState>((set, get) => ({
  config: null,
  loading: false,

  fetchConfig: async () => {
    set({ loading: true })
    const { data, error } = await supabase.from('config_facturacion').select('*').eq('id', 'default').single()
    if (!error && data) {
      set({ config: data as ConfigFacturacion, loading: false })
    } else {
      set({ loading: false })
    }
  },

  siguienteCorrelativo: async () => {
    const { data, error } = await supabase.rpc('siguiente_correlativo')
    if (error) return null
    return data as number
  },
}))
