/**
 * Equipo de la caja: quién entra y con qué permisos.
 *
 * El alta, el cambio de clave y el listado con correos pasan por la Edge
 * Function `pos-usuarios`, que es la única que tiene la service_role key.
 * El cambio de rol y el activar/desactivar van directo contra la tabla:
 * la política pos_usuarios_admin ya los restringe al dueño.
 */

import { posSupabase } from './client'
import { usuarioAEmail, type PosRol } from './auth'

export interface UsuarioCaja {
  user_id: string
  nombre: string
  rol: PosRol
  activo: boolean
  /** Correo guardado en Auth. Para mostrarlo, pasarlo por emailAUsuario(). */
  email: string
  created_at: string
}

// El id 'cajera' es el que acepta el check de pos_usuarios en la base: lo que
// cambia acá es solo cómo se lee en pantalla.
export const ROLES: { id: PosRol; label: string }[] = [
  { id: 'dueno',  label: 'Dueño' },
  { id: 'cajera', label: 'Caja' },
]

/** Error con el mensaje que devolvió la función, para poder mostrarlo tal cual. */
export class ErrorUsuarios extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorUsuarios'
  }
}

async function llamar<T>(cuerpo: Record<string, unknown>): Promise<T> {
  if (!posSupabase) throw new ErrorUsuarios('Supabase no está configurado')

  const { data, error } = await posSupabase.functions.invoke('pos-usuarios', { body: cuerpo })

  if (error) {
    console.error('[pos-usuarios]', error.name, error.message, error)
    const res = (error as { context?: unknown }).context

    // Con Response: la función contestó, pero con un status de error. El
    // motivo viene en el cuerpo y hay que leerlo, o todos los fallos se ven
    // igual: clave corta, rol equivocado y función caída serían el mismo texto.
    if (res instanceof Response) {
      let texto = ''
      try { texto = await res.text() } catch { /* cuerpo ya consumido */ }

      let detalle = texto.trim()
      try {
        const j = JSON.parse(texto) as { error?: string; message?: string; msg?: string }
        detalle = j.error ?? j.message ?? j.msg ?? detalle
      } catch { /* no era JSON: queda el texto crudo */ }

      if (res.status === 404) {
        throw new ErrorUsuarios('La función pos-usuarios no está desplegada. Corré: supabase functions deploy pos-usuarios')
      }
      if (res.status === 401) {
        throw new ErrorUsuarios(`Sesión rechazada (401). ${detalle || 'Cerrá sesión y volvé a entrar.'}`)
      }
      throw new ErrorUsuarios(detalle ? `${detalle} (HTTP ${res.status})` : `La función respondió ${res.status}`)
    }

    // Sin Response no se llegó a la función: no está desplegada, el preflight
    // de CORS la rechazó, o no hay red.
    throw new ErrorUsuarios(
      `No se pudo contactar a pos-usuarios (${error.name}: ${error.message}). ` +
      'Revisá que esté desplegada y mirá la consola del navegador.',
    )
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new ErrorUsuarios(String((data as { error: string }).error))
  }
  return data as T
}

export async function getUsuarios(businessId: string): Promise<UsuarioCaja[]> {
  const r = await llamar<{ usuarios: UsuarioCaja[] }>({ accion: 'listar', business_id: businessId })
  return r.usuarios ?? []
}

export async function crearUsuario(u: {
  businessId: string
  /** Nombre de usuario a secas: el correo interno se arma acá. */
  usuario: string
  password: string
  nombre: string
  rol: PosRol
}): Promise<void> {
  await llamar({
    accion: 'crear',
    business_id: u.businessId,
    email: usuarioAEmail(u.usuario, u.businessId),
    password: u.password,
    nombre: u.nombre,
    rol: u.rol,
  })
}

export async function cambiarClave(businessId: string, userId: string, password: string): Promise<void> {
  await llamar({ accion: 'clave', business_id: businessId, user_id: userId, password })
}

/**
 * Rol y estado se escriben directo contra la tabla.
 *
 * Si la política rechaza el UPDATE no devuelve error, devuelve cero filas:
 * por eso se pide `select` y se comprueba que haya vuelto algo.
 */
async function actualizarPerfil(userId: string, cambios: { rol?: PosRol; activo?: boolean }) {
  if (!posSupabase) throw new ErrorUsuarios('Supabase no está configurado')

  const { data, error } = await posSupabase
    .from('pos_usuarios')
    .update(cambios)
    .eq('user_id', userId)
    .select('user_id')

  if (error) throw new ErrorUsuarios(error.message)
  if (!data || data.length === 0) throw new ErrorUsuarios('Tu cuenta no puede administrar usuarios')
}

export const cambiarRol    = (userId: string, rol: PosRol)   => actualizarPerfil(userId, { rol })
export const cambiarEstado = (userId: string, activo: boolean) => actualizarPerfil(userId, { activo })
