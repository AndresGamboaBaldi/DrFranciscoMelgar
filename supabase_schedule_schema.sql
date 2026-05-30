-- ============================================================
-- Schedule Settings + Blocked Slots — run BOTH in SQL Editor
-- ============================================================

-- ── 1. Blocked Slots (if not already created) ────────────────
CREATE TABLE IF NOT EXISTS blocked_slots (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id   TEXT        NOT NULL,
  date        DATE        NOT NULL,
  start_time  TEXT,                    -- 'HH:MM' — NULL = todo el día
  end_time    TEXT,                    -- 'HH:MM' — NULL = todo el día
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blocks_doctor_date ON blocked_slots (doctor_id, date);
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_blocks"   ON blocked_slots;
DROP POLICY IF EXISTS "public_write_blocks"  ON blocked_slots;
DROP POLICY IF EXISTS "public_delete_blocks" ON blocked_slots;
CREATE POLICY "public_read_blocks"   ON blocked_slots FOR SELECT USING (true);
CREATE POLICY "public_write_blocks"  ON blocked_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_blocks" ON blocked_slots FOR DELETE USING (true);

-- ── 2. Schedule Settings ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_settings (
  doctor_id     TEXT        PRIMARY KEY,
  work_days     INTEGER[]   NOT NULL DEFAULT '{1,2,3,4,5}',
  work_start    TEXT        NOT NULL DEFAULT '08:00',
  work_end      TEXT        NOT NULL DEFAULT '18:00',
  sat_start     TEXT,       -- NULL = sábado cerrado
  sat_end       TEXT,
  sun_start     TEXT,       -- NULL = domingo cerrado
  sun_end       TEXT,
  slot_duration INTEGER     NOT NULL DEFAULT 60,
  min_advance   INTEGER     NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE schedule_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_schedule"  ON schedule_settings;
DROP POLICY IF EXISTS "public_write_schedule" ON schedule_settings;
CREATE POLICY "public_read_schedule"  ON schedule_settings FOR SELECT USING (true);
CREATE POLICY "public_write_schedule" ON schedule_settings FOR ALL USING (true) WITH CHECK (true);
