-- ============================================================
-- Calendar Tokens — run in Supabase → SQL Editor
-- (Requires the base appointments table from supabase_schema.sql)
-- ============================================================

-- ── 1. Add doctor_id to appointments ────────────────────────
--  (skip if already added)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS doctor_id TEXT DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_appointments_doctor
  ON appointments (doctor_id);

-- ── 2. Calendar tokens table ─────────────────────────────────
--  Each doctor gets a unique, secret token for their ICS feed.
--  The URL looks like:
--    https://<project>.supabase.co/functions/v1/calendar-feed?token=<token>

CREATE TABLE IF NOT EXISTS calendar_tokens (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  token       TEXT        NOT NULL UNIQUE
                          DEFAULT encode(gen_random_bytes(32), 'hex'),
  doctor_id   TEXT        NOT NULL DEFAULT 'default',
  doctor_name TEXT        NOT NULL,
  timezone    TEXT        NOT NULL DEFAULT 'America/La_Paz',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. RLS: only the Edge Function (service role) can read tokens ─────────
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Block all access from the anon key (frontend)
-- The Edge Function uses the service role key, which bypasses RLS
CREATE POLICY "deny_all_public" ON calendar_tokens
  FOR ALL USING (false);

-- ── 4. Seed: insert the initial doctor token ─────────────────
-- After running this, copy the generated token from:
--   SELECT token FROM calendar_tokens;
INSERT INTO calendar_tokens (doctor_id, doctor_name, timezone)
VALUES ('default', 'Dra. Valentina Ramos', 'America/La_Paz')
ON CONFLICT DO NOTHING;

-- ── 5. View your magic token ─────────────────────────────────
-- Run this to see the URL you need to give to the doctor:
-- SELECT
--   doctor_name,
--   'https://' || '<YOUR_PROJECT_REF>' || '.supabase.co/functions/v1/calendar-feed?token=' || token AS magic_url
-- FROM calendar_tokens;
