/**
 * Supabase Edge Function — Usuarios de la caja
 *
 * Crear una cuenta de Auth necesita la service_role key, que nunca puede
 * viajar al navegador. Por eso el alta, el cambio de clave y el listado con
 * correos viven acá.
 *
 * Lo que SÍ se hace desde el cliente, porque RLS ya lo cubre (política
 * pos_usuarios_admin): cambiar el rol y activar/desactivar.
 *
 * Deploy:
 *   supabase functions deploy pos-usuarios
 *
 * Sin --no-verify-jwt a propósito: la plataforma exige un JWT válido antes de
 * llegar acá. Igual NO alcanza — la anon key también es un JWT válido —, así
 * que adentro se vuelve a comprobar quién llama y con qué rol.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// A diferencia de las otras funciones, a esta se la llama con
// supabase.functions.invoke(), que agrega `x-client-info` y `apikey`. Si no
// están en la lista, el preflight falla con un error de CORS y no se ve nada.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ok  = (data: unknown)        => new Response(JSON.stringify(data),          { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
const err = (msg: string, s = 400) => new Response(JSON.stringify({ error: msg }), { status: s,   headers: { ...CORS, 'Content-Type': 'application/json' } })

type Accion = 'listar' | 'crear' | 'clave'

interface Cuerpo {
  accion?: Accion
  business_id?: string
  email?: string
  password?: string
  nombre?: string
  rol?: 'dueno' | 'cajera'
  user_id?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST')    return err('Method not allowed', 405)

  let body: Cuerpo
  try { body = await req.json() } catch { return err('JSON inválido') }

  const { accion, business_id } = body
  if (!accion || !business_id) return err('Faltan datos')

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── Quién llama ───────────────────────────────────────────
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return err('Falta la sesión', 401)

  const { data: auth, error: errAuth } = await admin.auth.getUser(jwt)
  if (errAuth || !auth.user) return err('Sesión inválida', 401)

  // El rol se lee de la base, nunca del cuerpo del pedido: si viniera del
  // cliente, cualquiera con una sesión de cajera se declararía dueño.
  const { data: quien } = await admin
    .from('pos_usuarios')
    .select('business_id, rol, activo')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (!quien || !quien.activo)                 return err('Cuenta sin acceso', 403)
  if (quien.rol !== 'dueno')                   return err('Solo el dueño administra usuarios', 403)
  if (quien.business_id !== business_id)       return err('Ese negocio no es tuyo', 403)

  // ── Acciones ──────────────────────────────────────────────
  if (accion === 'listar') {
    const { data: filas, error } = await admin
      .from('pos_usuarios')
      .select('user_id, nombre, rol, activo, created_at')
      .eq('business_id', business_id)
      .order('created_at', { ascending: true })

    if (error) return err('No se pudo leer el equipo', 500)

    // Los correos viven en auth.users, no en pos_usuarios. Una barbería tiene
    // un puñado de cuentas, así que una página alcanza.
    const { data: cuentas } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const correo = new Map(cuentas.users.map(u => [u.id, u.email ?? '']))

    return ok({
      usuarios: (filas ?? []).map(f => ({ ...f, email: correo.get(f.user_id) ?? '' })),
    })
  }

  if (accion === 'crear') {
    const { email, password, nombre, rol } = body
    if (!email || !password || !nombre || !rol) return err('Faltan datos de la cuenta')
    if (password.length < 8)                    return err('La clave necesita al menos 8 caracteres')
    if (rol !== 'dueno' && rol !== 'cajera')    return err('Rol inválido')

    const { data: creada, error: errCrear } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      // Confirmado de entrada: la cuenta la crea el dueño en el mostrador, no
      // hay un correo que alguien vaya a abrir para activarla.
      email_confirm: true,
    })

    if (errCrear || !creada.user) {
      const m = errCrear?.message ?? ''
      if (m.includes('already') || m.includes('registered')) return err('Ya existe una cuenta con ese correo', 409)
      return err(m || 'No se pudo crear la cuenta', 400)
    }

    const { error: errPerfil } = await admin
      .from('pos_usuarios')
      .insert([{ user_id: creada.user.id, business_id, rol, nombre: nombre.trim() }])

    if (errPerfil) {
      // Sin perfil la cuenta de Auth existe pero no entra a ninguna caja, y el
      // correo queda tomado para siempre. Se deshace.
      await admin.auth.admin.deleteUser(creada.user.id)
      return err('No se pudo guardar el perfil', 500)
    }

    return ok({ user_id: creada.user.id })
  }

  if (accion === 'clave') {
    const { user_id, password } = body
    if (!user_id || !password) return err('Faltan datos')
    if (password.length < 8)   return err('La clave necesita al menos 8 caracteres')

    // Solo cuentas del mismo negocio: sin esto, un dueño cambiaría la clave
    // de cualquier usuario del sistema pasando su uuid.
    const { data: destino } = await admin
      .from('pos_usuarios')
      .select('user_id')
      .eq('user_id', user_id)
      .eq('business_id', business_id)
      .maybeSingle()

    if (!destino) return err('Esa cuenta no es de este negocio', 403)

    const { error } = await admin.auth.admin.updateUserById(user_id, { password })
    if (error) return err('No se pudo cambiar la clave', 500)

    return ok({ ok: true })
  }

  return err('Acción desconocida')
})
