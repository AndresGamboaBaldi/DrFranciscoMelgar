import { posSupabase } from './client'
import { withTimeout } from '../supabase'

export type PosRol = 'dueno' | 'cajera'

export interface PosUsuario {
  user_id: string
  business_id: string
  rol: PosRol
  nombre: string
  activo: boolean
}

/** Razones por las que alguien con sesión válida igual no puede entrar a una caja. */
export type PosAccesoError =
  | 'sin-cuenta'      // hay sesión, pero ningún registro en pos_usuarios
  | 'otro-negocio'    // la cuenta existe pero pertenece a otra barbería
  | 'inactiva'        // el dueño la desactivó
  | 'error-red'       // no se pudo averiguar: timeout o conexión caída

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!posSupabase) return 'Supabase no está configurado'
  const { error } = await posSupabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (!error) return null
  // Supabase devuelve el mismo error para usuario inexistente y clave mala,
  // a propósito — no conviene revelar qué correos existen.
  if (error.message.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos'
  if (error.message.includes('Email not confirmed')) return 'Falta confirmar el correo de esta cuenta'
  return error.message
}

export async function signOut(): Promise<void> {
  await posSupabase?.auth.signOut()
}

/**
 * Trae el perfil del usuario con sesión activa y comprueba que pertenezca
 * a `businessId`. Devuelve el usuario, o el motivo por el que no puede pasar.
 */
export async function getAcceso(
  businessId: string,
): Promise<{ usuario: PosUsuario } | { error: PosAccesoError } | null> {
  if (!posSupabase) return null

  try {
    const { data: sesion } = await withTimeout(posSupabase.auth.getSession(), 8000)
    if (!sesion.session) return null

    // Promise.resolve porque el query builder es un thenable, no una Promise:
    // withTimeout necesita una promesa de verdad para la carrera.
    const { data, error } = await withTimeout(
      Promise.resolve(
        posSupabase
          .from('pos_usuarios')
          .select('user_id, business_id, rol, nombre, activo')
          .eq('user_id', sesion.session.user.id)
          .maybeSingle(),
      ),
      8000,
    )

    // Sin fila, o RLS la filtró: en ambos casos esta cuenta no tiene caja.
    if (error || !data) return { error: 'sin-cuenta' }

    const usuario = data as PosUsuario
    if (!usuario.activo) return { error: 'inactiva' }
    if (usuario.business_id !== businessId) return { error: 'otro-negocio' }

    return { usuario }
  } catch {
    // Timeout o red caída. Se distingue de 'sin-cuenta' a propósito: una cosa
    // es que no tengas permiso y otra que no se haya podido averiguar.
    return { error: 'error-red' }
  }
}

/**
 * Avisa cuando la sesión cambia (login, logout, refresh vencido).
 *
 * El callback se difiere con setTimeout a propósito: supabase-js mantiene un
 * lock interno mientras lo ejecuta, y si adentro se llama a getSession() o a
 * otra operación de auth, se traba esperando ese mismo lock. Salir del tick
 * libera el lock antes de que el callback haga su trabajo.
 */
export function onAuthChange(cb: () => void): () => void {
  if (!posSupabase) return () => {}
  const { data } = posSupabase.auth.onAuthStateChange(() => {
    setTimeout(cb, 0)
  })
  return () => data.subscription.unsubscribe()
}
