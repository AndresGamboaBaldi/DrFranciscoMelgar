-- ============================================================
-- Dra. Valentina Ramos — Appointments Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS appointments (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  service          TEXT        NOT NULL,
  appointment_date DATE        NOT NULL,
  appointment_time TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  phone            TEXT        NOT NULL,
  email            TEXT        NOT NULL,
  age              INTEGER,
  notes            TEXT,
  status           TEXT        DEFAULT 'pending'
                               CHECK (status IN ('pending','confirmed','cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can INSERT a booking
CREATE POLICY "public_insert" ON appointments
  FOR INSERT WITH CHECK (true);

-- Only authenticated users (the doctor / admin) can SELECT
CREATE POLICY "admin_select" ON appointments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can UPDATE (e.g. confirm / cancel)
CREATE POLICY "admin_update" ON appointments
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ── Index for fast date lookups ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appointments_date
  ON appointments (appointment_date);

-- ── Helper view for the doctor's dashboard ──────────────────
CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT
  id,
  name,
  phone,
  email,
  service,
  appointment_date,
  appointment_time,
  status,
  notes,
  created_at
FROM appointments
WHERE appointment_date >= CURRENT_DATE
  AND status != 'cancelled'
ORDER BY appointment_date, appointment_time;
