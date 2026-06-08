-- ════════════════════════════════════════════════════════════════
--  Rename doctor_id → business_id across all tables
--  Run this once in the Supabase SQL editor.
--  (RLS policies referencing the column are automatically preserved
--   by ALTER TABLE ... RENAME COLUMN — Postgres updates them.)
-- ════════════════════════════════════════════════════════════════

alter table appointments        rename column doctor_id to business_id;
alter table schedule_settings   rename column doctor_id to business_id;
alter table blocked_slots       rename column doctor_id to business_id;
alter table push_subscriptions  rename column doctor_id to business_id;
alter table calendar_tokens     rename column doctor_id to business_id;

-- If any of the above tables don't exist or don't have this column,
-- comment out that line before running.
