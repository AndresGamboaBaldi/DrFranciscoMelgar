-- ============================================================
--  Fecha de negocio en las ventas
--  Ejecutar en: Supabase → SQL Editor
--
--  `created_at` dice cuándo se insertó la fila. No sirve para
--  saber a qué día pertenece el cobro: si el lunes se cobra una
--  cita del sábado, la venta queda con fecha del lunes y la cita
--  del sábado sigue apareciendo pendiente para siempre.
--
--  Además, comparar un timestamptz contra 'YYYY-MM-DD' depende de
--  la zona de la sesión (UTC en Supabase), y en Bolivia eso corre
--  la ventana cuatro horas. Con una columna `date` no hay ambigüedad.
-- ============================================================

-- ── 1. La columna ───────────────────────────────────────────
alter table pos_ventas
  add column if not exists fecha date not null default current_date;

alter table pos_gastos
  add column if not exists fecha date not null default current_date;


-- ── 2. Rellenar lo que ya existe ────────────────────────────
--  Las filas viejas toman el día LOCAL de su created_at, no el UTC:
--  un cobro de las 21:00 en Bolivia pertenece a ese día, no al siguiente.
update pos_ventas
set fecha = (created_at at time zone 'America/La_Paz')::date
where fecha is distinct from (created_at at time zone 'America/La_Paz')::date;

update pos_gastos
set fecha = (created_at at time zone 'America/La_Paz')::date
where fecha is distinct from (created_at at time zone 'America/La_Paz')::date;


-- ── 3. Índices para las consultas por día ───────────────────
create index if not exists idx_pos_ventas_business_fecha
  on pos_ventas (business_id, fecha);

create index if not exists idx_pos_gastos_business_fecha
  on pos_gastos (business_id, fecha);


-- ── 4. Comprobación ─────────────────────────────────────────
-- select id, created_at, fecha, cliente_nombre, total, appointment_id
-- from pos_ventas
-- order by created_at desc
-- limit 20;
