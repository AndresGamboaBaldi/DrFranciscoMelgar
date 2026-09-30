import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * Cliente propio para el sistema de caja.
 *
 * Es una instancia distinta de la de `lib/supabase.ts` a propósito. El lado
 * de reservas funciona con el rol `anon` y sus políticas asumen eso; si la
 * cajera inicia sesión sobre el cliente compartido, esas páginas pasarían a
 * pedir con un JWT autenticado. Con un storageKey aparte, las dos sesiones
 * no se tocan.
 */
export const posSupabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storageKey: 'probo-pos-auth',
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null
