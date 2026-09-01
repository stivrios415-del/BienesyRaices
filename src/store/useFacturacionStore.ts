import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { ConfigFacturacion } from '../types/facturacion'

interface FacturacionState {
  config: ConfigFacturacion | null
  loading: boolean
  fetchConfig: () => Promise<void>
  actualizarConfig: (cambios: Partial<ConfigFacturacion>) => Promise<{ error: string | null }>
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

  actualizarConfig: async (cambios) => {
    const { error } = await supabase.from('config_facturacion').update(cambios as any).eq('id', 'default')
    if (error) return { error: error.message }
    await get().fetchConfig()
    return { error: null }
  },

  // Llama a la función de Postgres que incrementa el correlativo de forma
  // atómica — así dos administradores imprimiendo recibos al mismo tiempo
  // nunca terminan con el mismo número.
  siguienteCorrelativo: async () => {
    const { data, error } = await supabase.rpc('siguiente_correlativo')
    if (error) return null
    return data as number
  },
}))