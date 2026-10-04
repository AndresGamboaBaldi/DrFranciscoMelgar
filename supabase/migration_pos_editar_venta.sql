-- ============================================================
--  Rastro de edición en las ventas
--  Ejecutar en: Supabase → SQL Editor
--
--  Un cobro registrado se puede corregir (monto mal tipeado,
--  método equivocado, barbero equivocado). Sin estas dos
--  columnas, la corrección no deja huella: el reporte cambia y
--  no hay forma de saber quién lo cambió ni cuándo.
--
--  Quién PUEDE editar ya está resuelto por la política
--  pos_ventas_update del esquema base: solo el dueño.
-- ============================================================

alter table pos_ventas
  add column if not exists editada_at  timestamptz,
  add column if not exists editada_por uuid references auth.users(id);


-- ── Comprobación ────────────────────────────────────────────
-- select id, cliente_nombre, total, editada_at, editada_por
-- from pos_ventas
-- where editada_at is not null
-- order by editada_at desc;
