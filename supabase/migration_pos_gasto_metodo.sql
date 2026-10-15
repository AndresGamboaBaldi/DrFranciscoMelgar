-- ============================================================
--  Forma de pago en los gastos
--  Ejecutar en: Supabase → SQL Editor
--
--  Hasta ahora TODO gasto se descontaba del efectivo esperado en
--  la gaveta. Eso es falso para un gasto pagado por QR: la plata
--  no salió del cajón, así que el arqueo daba faltante.
--
--  El default 'efectivo' deja los gastos ya cargados exactamente
--  como se venían calculando, así que nada cambia hacia atrás.
-- ============================================================

alter table pos_gastos
  add column if not exists metodo_pago text not null default 'efectivo'
    check (metodo_pago in ('efectivo', 'qr'));


-- ── Efectivo esperado: solo descuenta lo pagado en efectivo ──
create or replace function pos_efectivo_esperado(p_arqueo_id uuid)
returns numeric
language sql
stable
as $$
  select
      coalesce((select fondo_inicial from pos_arqueos where id = p_arqueo_id), 0)
    + coalesce((select sum(total) from pos_ventas
                where arqueo_id = p_arqueo_id and metodo_pago = 'efectivo' and not anulada), 0)
    - coalesce((select sum(monto) from pos_gastos
                where arqueo_id = p_arqueo_id and metodo_pago = 'efectivo'), 0)
$$;


-- ── Comprobación ────────────────────────────────────────────
-- select concepto, monto, metodo_pago, categoria, fecha
-- from pos_gastos order by created_at desc limit 20;
