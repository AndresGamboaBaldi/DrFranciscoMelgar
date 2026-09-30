-- ============================================================
--  SISTEMA DE COBROS Y ARQUEO  ·  esquema base
--  Ejecutar una vez en: Supabase → SQL Editor
--
--  Todo lleva prefijo pos_ para que se lea de un vistazo qué es
--  dinero y qué es agenda. Multi-negocio desde el arranque:
--  business_id está en todas las tablas.
--
--  A diferencia del resto del proyecto, acá la protección NO
--  depende de una Edge Function: es RLS atada a Supabase Auth.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  1. USUARIOS Y ROLES
-- ─────────────────────────────────────────────────────────────

create table if not exists pos_usuarios (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  business_id text        not null,
  rol         text        not null check (rol in ('dueno', 'cajera')),
  nombre      text        not null,
  activo      boolean     not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_pos_usuarios_business on pos_usuarios (business_id);

-- Helpers SECURITY DEFINER: leen pos_usuarios saltándose RLS.
-- Sin esto las políticas se llamarían a sí mismas (recursión infinita).
create or replace function pos_mi_negocio()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select business_id from pos_usuarios
  where user_id = auth.uid() and activo
  limit 1
$$;

create or replace function pos_mi_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from pos_usuarios
  where user_id = auth.uid() and activo
  limit 1
$$;

alter table pos_usuarios enable row level security;

-- Los drop van antes de cada create porque CREATE POLICY no acepta
-- IF NOT EXISTS: sin esto, re-correr el archivo falla.
drop policy if exists pos_usuarios_select on pos_usuarios;
drop policy if exists pos_usuarios_admin  on pos_usuarios;

-- Cada uno ve a los usuarios de su negocio; solo el dueño los administra.
create policy pos_usuarios_select on pos_usuarios
  for select using (business_id = pos_mi_negocio());

create policy pos_usuarios_admin on pos_usuarios
  for all
  using      (business_id = pos_mi_negocio() and pos_mi_rol() = 'dueno')
  with check (business_id = pos_mi_negocio() and pos_mi_rol() = 'dueno');


-- ─────────────────────────────────────────────────────────────
--  NOTA · no hay tabla de catálogo
--  Los nombres de servicio salen de professionals.ts, que ya viaja
--  en el bundle. El monto lo tipea la cajera al cobrar, porque la
--  mayoría de los precios son 'Desde Bs. X' y varían por cliente.
--  Lo cobrado queda copiado en pos_venta_items.
-- ─────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────
--  2. ARQUEO DE CAJA
--     Una sesión por día: se abre con fondo, se cierra contando.
-- ─────────────────────────────────────────────────────────────

create table if not exists pos_arqueos (
  id                uuid primary key default gen_random_uuid(),
  business_id       text          not null,
  fecha             date          not null default current_date,
  estado            text          not null default 'abierto' check (estado in ('abierto', 'cerrado')),

  fondo_inicial     numeric(10,2) not null default 0 check (fondo_inicial >= 0),
  abierto_por       uuid          not null references auth.users(id),
  abierto_at        timestamptz   not null default now(),

  -- Se llenan al cerrar
  efectivo_contado  numeric(10,2),
  efectivo_esperado numeric(10,2),   -- congelado al cerrar, no recalculado después
  diferencia        numeric(10,2),   -- contado - esperado: negativo = falta plata
  nota_cierre       text,
  cerrado_por       uuid references auth.users(id),
  cerrado_at        timestamptz
);

create index if not exists idx_pos_arqueos_business_fecha on pos_arqueos (business_id, fecha desc);

-- Una sola caja abierta por negocio a la vez.
create unique index if not exists idx_pos_arqueos_uno_abierto
  on pos_arqueos (business_id) where estado = 'abierto';

alter table pos_arqueos enable row level security;

drop policy if exists pos_arqueos_rw on pos_arqueos;

create policy pos_arqueos_rw on pos_arqueos
  for all
  using      (business_id = pos_mi_negocio())
  with check (business_id = pos_mi_negocio());


-- ─────────────────────────────────────────────────────────────
--  3. VENTAS
-- ─────────────────────────────────────────────────────────────

create table if not exists pos_ventas (
  id                  uuid primary key default gen_random_uuid(),
  business_id         text          not null,
  arqueo_id           uuid          not null references pos_arqueos(id) on delete restrict,

  -- Quién atendió. En una agencia es el businessId del staff (jhoel_cuts,
  -- saul_barber…); en un profesional solo, es el mismo business_id.
  barbero_business_id text          not null,

  -- La cita que se cobró. NULL = atención sin cita previa.
  appointment_id      uuid          references appointments(id) on delete set null,

  cliente_nombre      text,
  subtotal            numeric(10,2) not null check (subtotal >= 0),
  propina             numeric(10,2) not null default 0 check (propina >= 0),
  total               numeric(10,2) not null check (total >= 0),
  metodo_pago         text          not null check (metodo_pago in ('efectivo', 'qr', 'tarjeta')),

  cobrado_por         uuid          not null references auth.users(id),
  created_at          timestamptz   not null default now(),

  -- Anulación: nunca se borra una venta, se marca
  anulada             boolean       not null default false,
  anulada_por         uuid          references auth.users(id),
  anulada_at          timestamptz,
  motivo_anulacion    text
);

create index if not exists idx_pos_ventas_arqueo   on pos_ventas (arqueo_id);
create index if not exists idx_pos_ventas_barbero  on pos_ventas (barbero_business_id, created_at);
create index if not exists idx_pos_ventas_business on pos_ventas (business_id, created_at desc);

-- Una cita no se puede cobrar dos veces (ignora las anuladas).
create unique index if not exists idx_pos_ventas_una_por_cita
  on pos_ventas (appointment_id) where appointment_id is not null and not anulada;

alter table pos_ventas enable row level security;

drop policy if exists pos_ventas_select on pos_ventas;
drop policy if exists pos_ventas_insert on pos_ventas;
drop policy if exists pos_ventas_update on pos_ventas;

create policy pos_ventas_select on pos_ventas
  for select using (business_id = pos_mi_negocio());

create policy pos_ventas_insert on pos_ventas
  for insert with check (business_id = pos_mi_negocio() and cobrado_por = auth.uid());

-- Corregir o anular una venta ya registrada es cosa del dueño.
create policy pos_ventas_update on pos_ventas
  for update
  using      (business_id = pos_mi_negocio() and pos_mi_rol() = 'dueno')
  with check (business_id = pos_mi_negocio());


create table if not exists pos_venta_items (
  id          uuid primary key default gen_random_uuid(),
  venta_id    uuid          not null references pos_ventas(id) on delete cascade,
  business_id text          not null,
  -- El id del servicio en professionals.ts ('corte', 'tinte'…). NULL si
  -- la cajera escribió un concepto libre.
  service_id  text,
  nombre      text          not null,   -- copiado al cobrar: el histórico no cambia si cambia el catálogo
  precio      numeric(10,2) not null check (precio >= 0),
  cantidad    integer       not null default 1 check (cantidad > 0)
);

create index if not exists idx_pos_venta_items_venta on pos_venta_items (venta_id);

alter table pos_venta_items enable row level security;

drop policy if exists pos_venta_items_rw on pos_venta_items;

create policy pos_venta_items_rw on pos_venta_items
  for all
  using      (business_id = pos_mi_negocio())
  with check (business_id = pos_mi_negocio());


-- ─────────────────────────────────────────────────────────────
--  4. GASTOS
-- ─────────────────────────────────────────────────────────────

create table if not exists pos_gastos (
  id                  uuid primary key default gen_random_uuid(),
  business_id         text          not null,
  arqueo_id           uuid          not null references pos_arqueos(id) on delete restrict,
  concepto            text          not null,
  categoria           text          not null default 'otro'
                      check (categoria in ('insumos', 'adelanto', 'servicios', 'delivery', 'otro')),
  monto               numeric(10,2) not null check (monto > 0),
  -- Solo para categoria='adelanto': a quién se le adelantó, para
  -- descontarlo después en su liquidación
  barbero_business_id text,
  registrado_por      uuid          not null references auth.users(id),
  created_at          timestamptz   not null default now()
);

create index if not exists idx_pos_gastos_arqueo on pos_gastos (arqueo_id);
create index if not exists idx_pos_gastos_adelanto on pos_gastos (barbero_business_id, created_at)
  where categoria = 'adelanto';

alter table pos_gastos enable row level security;

drop policy if exists pos_gastos_rw on pos_gastos;

create policy pos_gastos_rw on pos_gastos
  for all
  using      (business_id = pos_mi_negocio())
  with check (business_id = pos_mi_negocio());


-- ─────────────────────────────────────────────────────────────
--  5. COMISIONES
-- ─────────────────────────────────────────────────────────────

create table if not exists pos_comision_config (
  business_id         text          not null,
  barbero_business_id text          not null,
  porcentaje          numeric(5,2)  not null check (porcentaje >= 0 and porcentaje <= 100),
  updated_at          timestamptz   not null default now(),
  primary key (business_id, barbero_business_id)
);

alter table pos_comision_config enable row level security;

drop policy if exists pos_comision_select on pos_comision_config;
drop policy if exists pos_comision_admin  on pos_comision_config;

create policy pos_comision_select on pos_comision_config
  for select using (business_id = pos_mi_negocio());

create policy pos_comision_admin on pos_comision_config
  for all
  using      (business_id = pos_mi_negocio() and pos_mi_rol() = 'dueno')
  with check (business_id = pos_mi_negocio() and pos_mi_rol() = 'dueno');


create table if not exists pos_liquidaciones (
  id                  uuid primary key default gen_random_uuid(),
  business_id         text          not null,
  barbero_business_id text          not null,
  desde               date          not null,
  hasta               date          not null,

  -- Congelados al cerrar: si después cambia el porcentaje o se
  -- corrige una venta vieja, la liquidación pagada no se mueve.
  producido           numeric(10,2) not null,
  porcentaje          numeric(5,2)  not null,
  comision            numeric(10,2) not null,
  adelantos           numeric(10,2) not null default 0,
  a_pagar             numeric(10,2) not null,

  cerrada_por         uuid          not null references auth.users(id),
  cerrada_at          timestamptz   not null default now(),
  check (hasta >= desde)
);

create index if not exists idx_pos_liquidaciones_barbero
  on pos_liquidaciones (barbero_business_id, hasta desc);

-- No se liquida dos veces el mismo período al mismo barbero.
create unique index if not exists idx_pos_liquidaciones_periodo
  on pos_liquidaciones (business_id, barbero_business_id, desde, hasta);

alter table pos_liquidaciones enable row level security;

drop policy if exists pos_liquidaciones_select on pos_liquidaciones;
drop policy if exists pos_liquidaciones_admin  on pos_liquidaciones;

create policy pos_liquidaciones_select on pos_liquidaciones
  for select using (business_id = pos_mi_negocio());

create policy pos_liquidaciones_admin on pos_liquidaciones
  for all
  using      (business_id = pos_mi_negocio() and pos_mi_rol() = 'dueno')
  with check (business_id = pos_mi_negocio() and pos_mi_rol() = 'dueno');


-- ─────────────────────────────────────────────────────────────
--  6. EFECTIVO ESPERADO EN CAJA
--     fondo + ventas en efectivo (con propina) − gastos.
--     Las ventas por QR o tarjeta no tocan el efectivo.
-- ─────────────────────────────────────────────────────────────

create or replace function pos_efectivo_esperado(p_arqueo_id uuid)
returns numeric
language sql
stable
as $$
  select
      coalesce((select fondo_inicial from pos_arqueos where id = p_arqueo_id), 0)
    + coalesce((select sum(total) from pos_ventas
                where arqueo_id = p_arqueo_id and metodo_pago = 'efectivo' and not anulada), 0)
    - coalesce((select sum(monto) from pos_gastos where arqueo_id = p_arqueo_id), 0)
$$;
