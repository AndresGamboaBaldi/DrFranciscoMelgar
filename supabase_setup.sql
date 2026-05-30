-- ============================================================
--  Pro.bo — Script maestro de base de datos
--  Ejecutar en: Supabase → SQL Editor → New query → Run
--
--  Borra todo y recrea las tablas desde cero.
--  Solo necesitas correr ESTE archivo.
-- ============================================================


-- ── 0. Limpiar todo ─────────────────────────────────────────
DROP TABLE IF EXISTS schedule_settings  CASCADE;
DROP TABLE IF EXISTS blocked_slots      CASCADE;
DROP TABLE IF EXISTS calendar_tokens    CASCADE;
DROP TABLE IF EXISTS appointments       CASCADE;


-- ── 1. Citas de pacientes ────────────────────────────────────
CREATE TABLE appointments (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  service          TEXT        NOT NULL,
  appointment_date DATE        NOT NULL,
  appointment_time TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  phone            TEXT        NOT NULL,
  age              INTEGER,
  notes            TEXT,
  doctor_id        TEXT        NOT NULL DEFAULT 'default',
  status           TEXT        DEFAULT 'pending'
                               CHECK (status IN ('pending','confirmed','cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_date   ON appointments (appointment_date);
CREATE INDEX idx_appointments_doctor ON appointments (doctor_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Pacientes pueden crear citas (INSERT público)
CREATE POLICY "public_insert_appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Solo usuarios autenticados (admin/doctor) pueden leer
CREATE POLICY "admin_select_appointments" ON appointments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Solo autenticados pueden actualizar (confirmar/cancelar)
CREATE POLICY "admin_update_appointments" ON appointments
  FOR UPDATE USING (auth.role() = 'authenticated');


-- ── 2. Tokens del calendario (Link Mágico) ──────────────────
CREATE TABLE calendar_tokens (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  token       TEXT        NOT NULL UNIQUE
                          DEFAULT encode(gen_random_bytes(32), 'hex'),
  doctor_id   TEXT        NOT NULL DEFAULT 'default',
  doctor_name TEXT        NOT NULL,
  timezone    TEXT        NOT NULL DEFAULT 'America/La_Paz',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Solo la Edge Function (service role) puede leer tokens
-- El anon key (frontend) no tiene acceso directo
CREATE POLICY "service_only_calendar_tokens" ON calendar_tokens
  FOR ALL USING (false);


-- ── 3. Horarios bloqueados ────────────────────────────────────
CREATE TABLE blocked_slots (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id   TEXT        NOT NULL,
  date        DATE        NOT NULL,
  start_time  TEXT,                    -- 'HH:MM' — NULL = todo el día
  end_time    TEXT,                    -- 'HH:MM' — NULL = todo el día
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocks_doctor_date ON blocked_slots (doctor_id, date);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Lectura pública (calendario necesita verificar disponibilidad)
CREATE POLICY "public_read_blocks" ON blocked_slots
  FOR SELECT USING (true);

-- Escritura pública (el panel ?setup lo usa desde el frontend)
CREATE POLICY "public_write_blocks" ON blocked_slots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_delete_blocks" ON blocked_slots
  FOR DELETE USING (true);


-- ── 4. Configuración de horarios ─────────────────────────────
CREATE TABLE schedule_settings (
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

-- Lectura pública (el calendario la usa para mostrar slots correctos)
CREATE POLICY "public_read_schedule" ON schedule_settings
  FOR SELECT USING (true);

-- Escritura pública (el panel ?setup guarda desde el frontend)
CREATE POLICY "public_write_schedule" ON schedule_settings
  FOR ALL USING (true) WITH CHECK (true);


-- ── 5. Seed: token del calendario para doctor_melgar ─────────
INSERT INTO calendar_tokens (doctor_id, doctor_name, timezone)
VALUES ('doctor_melgar', 'Dr. Francisco Melgar', 'America/La_Paz');


-- ── 6. Ver los tokens generados ──────────────────────────────
SELECT
  doctor_id,
  doctor_name,
  token,
  'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=' || token AS magic_url
FROM calendar_tokens;
