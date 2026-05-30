-- ============================================================
-- Blocked Slots — run in Supabase → SQL Editor
-- Permite bloquear días completos o rangos de horas específicos
-- ============================================================

CREATE TABLE IF NOT EXISTS blocked_slots (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id   TEXT        NOT NULL,
  date        DATE        NOT NULL,
  start_time  TEXT,                    -- 'HH:MM' — NULL = bloquea todo el día
  end_time    TEXT,                    -- 'HH:MM' — NULL = bloquea todo el día
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocks_doctor_date
  ON blocked_slots (doctor_id, date);

-- RLS
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer (el calendario necesita verificar disponibilidad)
CREATE POLICY "public_read_blocks" ON blocked_slots
  FOR SELECT USING (true);

-- Cualquiera puede insertar y borrar (proteger con auth en producción)
CREATE POLICY "public_write_blocks" ON blocked_slots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_delete_blocks" ON blocked_slots
  FOR DELETE USING (true);
