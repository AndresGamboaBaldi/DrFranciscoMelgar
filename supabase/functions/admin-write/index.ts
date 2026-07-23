/**
 * Supabase Edge Function — Admin Write Operations
 *
 * Handles all write operations that require bypassing RLS (schedule settings,
 * blocked slots). Uses service role key — never exposed to the client.
 *
 * Protection: validates business_id against a known whitelist.
 *
 * Deploy:
 *   supabase functions deploy admin-write --no-verify-jwt
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const KNOWN_BUSINESS_IDS = new Set([
  'barber_vip',
  'jhoel_cuts',
  'andres',
  'dr_seifert',
  'doctor_melgar',
  'jheison_barber',
  'lgsus_barber',
  'erick_barber',
  'rey_barber',
])

const ok  = (data: unknown)  => new Response(JSON.stringify(data),          { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
const err = (msg: string, s = 400) => new Response(JSON.stringify({ error: msg }), { status: s,   headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST')    return err('Method not allowed', 405)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return err('Invalid JSON') }

  const { action, business_id } = body

  if (!business_id || typeof business_id !== 'string') return err('Missing business_id')
  if (!KNOWN_BUSINESS_IDS.has(business_id))            return err('Unknown business', 403)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── save-schedule ─────────────────────────────────────────────
  if (action === 'save-schedule') {
    const settings = body.settings as Record<string, unknown>
    if (!settings) return err('Missing settings')
    const { error } = await supabase
      .from('schedule_settings')
      .upsert([{ ...settings, business_id, updated_at: new Date().toISOString() }], { onConflict: 'business_id' })
    if (error) return err(error.message, 500)
    return ok({ success: true })
  }

  // ── save-allow-cancel ─────────────────────────────────────────
  if (action === 'save-allow-cancel') {
    const { allow_cancel } = body
    if (typeof allow_cancel !== 'boolean') return err('Missing allow_cancel')
    const { error } = await supabase
      .from('schedule_settings')
      .upsert([{ business_id, allow_cancel, updated_at: new Date().toISOString() }], { onConflict: 'business_id' })
    if (error) return err(error.message, 500)
    return ok({ success: true })
  }

  // ── add-block ─────────────────────────────────────────────────
  if (action === 'add-block') {
    const { block } = body as { block: Record<string, unknown> }
    if (!block) return err('Missing block')
    const { error } = await supabase.from('blocked_slots').insert([{ ...block, business_id }])
    if (error) return err(error.message, 500)
    return ok({ success: true })
  }

  // ── add-blocks ────────────────────────────────────────────────
  if (action === 'add-blocks') {
    const { blocks } = body as { blocks: Record<string, unknown>[] }
    if (!blocks || !Array.isArray(blocks)) return err('Missing blocks')
    const rows = blocks.map(b => ({ ...b, business_id }))
    const { error } = await supabase.from('blocked_slots').insert(rows)
    if (error) return err(error.message, 500)
    return ok({ success: true })
  }

  // ── delete-block ──────────────────────────────────────────────
  if (action === 'delete-block') {
    const { id } = body
    if (!id || typeof id !== 'string') return err('Missing id')
    const { error } = await supabase
      .from('blocked_slots')
      .delete()
      .eq('id', id)
      .eq('business_id', business_id) // extra safety: can only delete own blocks
    if (error) return err(error.message, 500)
    return ok({ success: true })
  }

  // ── upload-qr ─────────────────────────────────────────────────
  if (action === 'upload-qr') {
    const { file_base64, content_type, ext } = body
    if (!file_base64 || typeof file_base64 !== 'string') return err('Missing file_base64')
    const bytes = Uint8Array.from(atob(file_base64 as string), c => c.charCodeAt(0))
    const path = `${business_id}/qr.${ext ?? 'png'}`
    const { error } = await supabase.storage
      .from('qr-images')
      .upload(path, bytes, { upsert: true, contentType: (content_type as string) ?? 'image/png' })
    if (error) return err(error.message, 500)
    const { data } = supabase.storage.from('qr-images').getPublicUrl(path)
    return ok({ url: data.publicUrl })
  }

  // ── save-payment-settings ────────────────────────────────────
  if (action === 'save-payment-settings') {
    const { require_payment, payment_percentage, qr_image_url } = body
    const { error } = await supabase
      .from('schedule_settings')
      .upsert([{ business_id, require_payment, payment_percentage, qr_image_url, updated_at: new Date().toISOString() }], { onConflict: 'business_id' })
    if (error) return err(error.message, 500)
    return ok({ success: true })
  }

  // ── confirm-appointment ───────────────────────────────────────
  if (action === 'confirm-appointment') {
    const { id } = body
    if (!id || typeof id !== 'string') return err('Missing id')
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', id)
    if (error) return err(error.message, 500)
    return ok({ success: true })
  }

  // ── save-hidden ───────────────────────────────────────────────
  if (action === 'save-hidden') {
    const { hidden } = body
    if (typeof hidden !== 'boolean') return err('Missing hidden')
    const { error } = await supabase
      .from('schedule_settings')
      .upsert([{ business_id, hidden, updated_at: new Date().toISOString() }], { onConflict: 'business_id' })
    if (error) return err(error.message, 500)
    return ok({ success: true })
  }

  // ── save-schedule-locked ──────────────────────────────────────
  if (action === 'save-schedule-locked') {
    const { locked } = body
    if (typeof locked !== 'boolean') return err('Missing locked')
    const { error } = await supabase
      .from('schedule_settings')
      .upsert([{ business_id, schedule_locked: locked, updated_at: new Date().toISOString() }], { onConflict: 'business_id' })
    if (error) return err(error.message, 500)
    return ok({ success: true })
  }

  return err('Unknown action')
})
