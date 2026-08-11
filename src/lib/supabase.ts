import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y complétalo.'
  )
}

// Nota: se tipa explícitamente como SupabaseClient<any, any, any> a propósito.
// El genérico <Database> estricto que exige supabase-js internamente (con el
// campo "Relationships" en cada tabla) hacía que TypeScript infiriera "never"
// en los métodos .insert()/.update() durante "tsc -b" en el build de Vercel.
// El tipado de dominio real (Lote, Pago en src/types/lote.ts) sigue validando
// los datos donde importa: en los formularios (zod) y en el store.
export const supabase: SupabaseClient<any, any, any> = createClient(supabaseUrl, supabaseAnonKey)
