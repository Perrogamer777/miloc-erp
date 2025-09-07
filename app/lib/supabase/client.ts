import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types/database'

// Cliente para uso en componentes del lado del cliente
export const crearClienteSupabase = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const supabase = crearClienteSupabase()