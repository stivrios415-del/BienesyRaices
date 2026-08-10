// Tipado mínimo de la base de datos de Supabase para autocompletado.
// Puedes regenerarlo con: npx supabase gen types typescript --project-id TU_PROYECTO
export interface Database {
  public: {
    Tables: {
      lotes: {
        Row: {
          id: string
          numero_lote: string
          ancho: number
          largo: number
          area: number
          estado: 'disponible' | 'vendido' | 'en_proceso'
          comprador: string | null
          fecha_compra: string | null
          precio_total: number
          plazos_totales: number
          plazos_pagados: number
          cuota_mensual: number
          saldo_restante: number
          coordenadas_poligono: { x: number; y: number }[]
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['lotes']['Row']> & {
          numero_lote: string
          ancho: number
          largo: number
          precio_total: number
          plazos_totales: number
          coordenadas_poligono: { x: number; y: number }[]
        }
        Update: Partial<Database['public']['Tables']['lotes']['Row']>
      }
      pagos: {
        Row: {
          id: string
          lote_id: string
          monto: number
          fecha_pago: string
          metodo: 'efectivo' | 'transferencia' | 'tarjeta'
          numero_recibo: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['pagos']['Row']> & {
          lote_id: string
          monto: number
          metodo: 'efectivo' | 'transferencia' | 'tarjeta'
        }
        Update: Partial<Database['public']['Tables']['pagos']['Row']>
      }
    }
  }
}
