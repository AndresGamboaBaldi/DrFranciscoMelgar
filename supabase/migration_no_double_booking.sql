-- ============================================================
--  Evitar doble reserva del mismo horario (race condition)
--  Ejecutar una vez en: Supabase → SQL Editor
--
--  Dos clientes pueden estar llenando el formulario para el mismo
--  slot al mismo tiempo. Verificar disponibilidad desde el cliente
--  NO alcanza: ambos leen "libre" y ambos insertan. Este índice
--  hace que Postgres rechace el segundo INSERT de forma atómica.
-- ============================================================

-- ── 1. Revisar si ya hay choques ────────────────────────────
--  Debe devolver 0 filas antes de crear el índice.
--
-- SELECT business_id, appointment_date, left(appointment_time,5) AS hora,
--        count(*), string_agg(name, ' | ')
-- FROM appointments
-- WHERE status <> 'cancelled'
-- GROUP BY 1,2,3
-- HAVING count(*) > 1
-- ORDER BY appointment_date DESC;


-- ── 2. Índice único sobre la hora de inicio ─────────────────
--  left(...,5) normaliza 'HH:MM:SS' → 'HH:MM' por si algún registro
--  viejo trae segundos.
--  Las canceladas quedan fuera para poder reusar el horario.
--
--  NOTA — por qué no una restricción de exclusión por rangos:
--  se probó y falla contra una regla de negocio real. Jhoel tiene
--  slots manuales irregulares (…18:00, 18:30) y quiere poder tomar
--  ambos aunque el corte de 60 min se solape. Una restricción de
--  solapamiento se lo prohibiría. Este índice sólo bloquea la
--  colisión exacta, que es el problema que se quería resolver.
--  Contrapartida: un choque parcial por duración (ej. dos clientes
--  compitiendo por 14:00 con tinte de 120 min y por 15:00) no queda
--  cubierto.

CREATE UNIQUE INDEX IF NOT EXISTS appointments_no_double_booking
  ON appointments (business_id, appointment_date, left(appointment_time, 5))
  WHERE status <> 'cancelled';


-- ── 3. Limpieza ─────────────────────────────────────────────
--  Si llegaste a crear la función del intento anterior, ya no se usa:
--
-- DROP FUNCTION IF EXISTS appointment_span(date, text, integer);
