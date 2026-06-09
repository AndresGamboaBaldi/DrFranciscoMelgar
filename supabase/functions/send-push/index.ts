/**
 * Supabase Edge Function — Send Web Push Notification
 *
 * Deploy:
 *   supabase functions deploy send-push --no-verify-jwt
 *
 * Env vars (Supabase Dashboard → Settings → Edge Functions → Secrets):
 *   VAPID_SUBJECT     mailto:admin@probo.pro
 *   VAPID_PUBLIC_KEY  (from npx web-push generate-vapid-keys)
 *   VAPID_PRIVATE_KEY (from npx web-push generate-vapid-keys)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  const { business_id, title, body, url } = await req.json() as {
    business_id: string; title: string; body: string; url?: string
  }

  if (!business_id || !title) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('business_id', business_id)

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  const payload = JSON.stringify({ title, body, url: url ?? '/' })
  let sent = 0
  const expired: string[] = []

  for (const row of subs) {
    try {
      await webpush.sendNotification(row.subscription, payload)
      sent++
    } catch (e: unknown) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        expired.push(row.id) // subscription expired — clean up
      }
      console.error('Push failed:', e)
    }
  }

  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expired)
  }

  return new Response(JSON.stringify({ sent }), { status: 200 })
})
