import { posSupabase } from './client'

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

  const { data: sesion } = await posSupabase.auth.getSession()
  if (!sesion.session) return null

  const { data, error } = await posSupabase
    .from('pos_usuarios')
    .select('user_id, business_id, rol, nombre, activo')
    .eq('user_id', sesion.session.user.id)
    .maybeSingle()

  // Sin fila, o RLS la filtró: en ambos casos esta cuenta no tiene caja.
  if (error || !data) return { error: 'sin-cuenta' }

  const usuario = data as PosUsuario
  if (!usuario.activo) return { error: 'inactiva' }
  if (usuario.business_id !== businessId) return { error: 'otro-negocio' }

  return { usuario }
}

/** Avisa cuando la sesión cambia (login, logout, refresh vencido). */
export function onAuthChange(cb: () => void): () => void {
  if (!posSupabase) return () => {}
  const { data } = posSupabase.auth.onAuthStateChange(() => cb())
  return () => data.subscription.unsubscribe()
}
