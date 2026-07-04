/**
 * Supabase Edge Function — Verify Setup Key
 *
 * Validates a business setup password against the hashed value in DB.
 * Returns a signed token valid for 30 days if correct.
 *
 * Deploy:
 *   supabase functions deploy verify-setup-key --no-verify-jwt
 *
 * Env vars:
 *   TOKEN_SECRET  — random string used to sign tokens (set in Supabase secrets)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const ok  = (data: unknown)      => new Response(JSON.stringify(data),          { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
const err = (msg: string, s = 400) => new Response(JSON.stringify({ error: msg }), { status: s,   headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST')    return err('Method not allowed', 405)

  let body: { business_id?: string; password?: string }
  try { body = await req.json() } catch { return err('Invalid JSON') }

  const { business_id, password } = body
  if (!business_id || !password) return err('Missing fields')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Verify password against hash using pgcrypto
  const { data, error } = await supabase
    .rpc('verify_business_password', { p_business_id: business_id, p_password: password })

  if (error) return err('Error verifying password', 500)
  if (!data) return err('Invalid password', 401)

  // Generate a simple signed token: base64(business_id + expiry + secret)
  const TOKEN_SECRET = Deno.env.get('TOKEN_SECRET') ?? 'changeme'
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  const payload = `${business_id}:${expiry}`
  const signature = await sign(payload, TOKEN_SECRET)
  const token = btoa(`${payload}:${signature}`)

  return ok({ token })
})

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}
