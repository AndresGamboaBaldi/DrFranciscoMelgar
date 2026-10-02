-- ============================================================
--  Arreglo: ventas huérfanas bloqueando el cobro de una cita
--  Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
--  1. DIAGNÓSTICO — correr esto PRIMERO y mirar el resultado
-- ─────────────────────────────────────────────────────────────

-- 1a. Ventas sin ningún item: quedaron a medias.
--     Son las que bloquean el reintento sobre su cita.
select v.id, v.created_at, v.appointment_id, v.cliente_nombre,
       v.total, v.metodo_pago, v.anulada
from pos_ventas v
where not exists (select 1 from pos_venta_items i where i.venta_id = v.id)
order by v.created_at desc;

-- 1b. Citas con más de una venta viva (no debería devolver nada:
--     el índice único lo impide, pero sirve para confirmar).
-- select appointment_id, count(*)
-- from pos_ventas
-- where appointment_id is not null and not anulada
-- group by appointment_id having count(*) > 1;

-- 1c. Todas las ventas registradas hoy, para ver si realmente no entró ninguna.
-- select id, created_at, barbero_business_id, cliente_nombre, subtotal, total, anulada
-- from pos_ventas
-- where created_at >= current_date
-- order by created_at desc;


-- ─────────────────────────────────────────────────────────────
--  2. LA CAUSA — faltaba poder borrar
--     Con RLS activo y sin política de DELETE, el borrado no falla:
--     simplemente no afecta ninguna fila. El rollback de la app
--     creía haber deshecho la venta y no deshizo nada.
-- ─────────────────────────────────────────────────────────────

drop policy if exists pos_ventas_delete on pos_ventas;

create policy pos_ventas_delete on pos_ventas
  for delete
  using (business_id = pos_mi_negocio() and pos_mi_rol() = 'dueno');


-- ─────────────────────────────────────────────────────────────
--  3. LIMPIEZA — solo después de mirar el punto 1a
--     Borra las ventas que quedaron sin items. Libera sus citas
--     para que se puedan volver a cobrar.
-- ─────────────────────────────────────────────────────────────

-- delete from pos_ventas v
-- where not exists (select 1 from pos_venta_items i where i.venta_id = v.id);
