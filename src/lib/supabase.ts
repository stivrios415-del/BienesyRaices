import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y complétalo.'
  )
}

// Se tipa explícitamente como SupabaseClient<any, any, any> a propósito:
// el genérico <Database> estricto de supabase-js hacía que TypeScript
// infiriera "never" en .insert()/.update() durante el build de Vercel.
export const supabase: SupabaseClient<any, any, any> = createClient(supabaseUrl, supabaseAnonKey)
