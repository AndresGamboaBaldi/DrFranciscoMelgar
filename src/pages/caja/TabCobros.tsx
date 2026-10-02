import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAppointmentsByDate, getScheduleSettings } from '../../lib/supabase'
import type { Appointment } from '../../types/booking'
import type { Professional, StaffMember } from '../../types/professional'
import type { PosUsuario } from '../../lib/pos/auth'
import { getOAbrirArqueo, getVentasDelDia, getTotalDelDia, type Venta, type Arqueo } from '../../lib/pos/cobros'
import { bs, bsCorto, hoyISO } from './cajaTheme'
import { btnPrimario, chip } from '../../lib/panelUI'
import { Scissors, Clock, Check } from 'lucide-react'
import CobroDialog, { type CobroPrefill } from './CobroDialog'

type Filtro = 'todos' | 'por-cobrar' | 'cobrados'

/** Una fila de la lista: o una cita pendiente de cobro, o una venta ya hecha. */
type Fila =
  | { tipo: 'pendiente'; key: string; hora: string; cliente: string; servicio: string; barberoId: string; appointmentId: string }
  | { tipo: 'cobrado';   key: string; hora: string; cliente: string; servicio: string; barberoId: string; venta: Venta }

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  qr: 'QR / Transferencia',
  tarjeta: 'Tarjeta',
}

function ayerISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TabCobros({ pro, usuario }: { pro: Professional; usuario: PosUsuario }) {
  const barberos: StaffMember[] = useMemo(() => pro.staff ?? [], [pro.staff])
  const businessIds = useMemo(
    () => (barberos.length ? barberos.map(b => b.businessId) : [pro.businessId]),
    [barberos, pro.businessId],
  )
  const nombrePorId = useMemo(() => {
    const m = new Map<string, string>()
    barberos.forEach(b => m.set(b.businessId, b.shortName ?? b.name))
    m.set(pro.businessId, pro.shortName ?? pro.name)
    return m
  }, [barberos, pro])

  const [citas, setCitas] = useState<Appointment[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [totalAyer, setTotalAyer] = useState(0)
  const [arqueo, setArqueo] = useState<Arqueo | null>(null)
  // El mismo QR que ya usa el flujo de pago de reservas; se sube desde Setup → Pagos
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [prefill, setPrefill] = useState<CobroPrefill | null>(null)

  const cargar = useCallback(async () => {
    const hoy = hoyISO()
    const [cs, vs, ayer, arq, cfg] = await Promise.all([
      getAppointmentsByDate(businessIds, hoy),
      getVentasDelDia(pro.businessId, hoy),
      getTotalDelDia(pro.businessId, ayerISO()),
      getOAbrirArqueo(pro.businessId, usuario.user_id),
      getScheduleSettings(pro.businessId),
    ])
    setCitas(cs)
    setVentas(vs)
    setTotalAyer(ayer)
    setArqueo(arq)
    setQrUrl(cfg?.qr_image_url ?? null)
    setCargando(false)
  }, [businessIds, pro.businessId, usuario.user_id])

  useEffect(() => { cargar() }, [cargar])

  const hoyCobrado = ventas.reduce((s, v) => s + Number(v.total), 0)
  const variacion = totalAyer > 0 ? ((hoyCobrado - totalAyer) / totalAyer) * 100 : null

  const cobradasIds = useMemo(
    () => new Set(ventas.map(v => v.appointment_id).filter(Boolean) as string[]),
    [ventas],
  )

  // Hora de cada cita, para que al cobrarla la fila no salte al final de la
  // lista: lo que ordena es el turno, no el momento en que se registró el pago.
  const horaDeCita = useMemo(() => {
    const m = new Map<string, string>()
    citas.forEach(c => { if (c.id) m.set(c.id, (c.appointment_time ?? '').substring(0, 5)) })
    return m
  }, [citas])

  const filas: Fila[] = useMemo(() => {
    const pendientes: Fila[] = citas
      .filter(c => c.id && !cobradasIds.has(c.id) && c.status !== 'cancelled')
      .map(c => ({
        tipo: 'pendiente' as const,
        key: `c-${c.id}`,
        hora: (c.appointment_time ?? '').substring(0, 5),
        cliente: c.name ?? 'Sin nombre',
        servicio: c.service ?? '',
        barberoId: c.business_id ?? pro.businessId,
        appointmentId: c.id as string,
      }))

    const hechas: Fila[] = ventas.map(v => ({
      tipo: 'cobrado' as const,
      key: `v-${v.id}`,
      // La hora de la cita manda; solo los walk-in caen en la hora del cobro.
      // hour12:false mantiene el formato HH:MM que usa el orden alfabético.
      hora: (v.appointment_id ? horaDeCita.get(v.appointment_id) : null)
        ?? new Date(v.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false }),
      cliente: v.cliente_nombre ?? 'Sin nombre',
      servicio: v.items.map(i => i.nombre).join(' + '),
      barberoId: v.barbero_business_id,
      venta: v,
    }))

    // De la hora más temprana a la más tardía: sigue el orden del día.
    return [...pendientes, ...hechas].sort((a, b) => a.hora.localeCompare(b.hora))
  }, [citas, ventas, cobradasIds, horaDeCita, pro.businessId])

  const visibles = filas.filter(f =>
    filtro === 'todos' ? true : filtro === 'por-cobrar' ? f.tipo === 'pendiente' : f.tipo === 'cobrado',
  )
  const nPendientes = filas.filter(f => f.tipo === 'pendiente').length

  if (cargando) return <Cargando />

  return (
    <div>
      {/* ── Encabezado ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)' }}>
          Cobros del día
        </h2>
      </div>

      {/* ── Resumen ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.5rem', marginBottom: '1.25rem' }}>
        <Tile
          label="Hoy cobrado" valor={bsCorto(hoyCobrado)} unidad="Bs"
          pie={variacion === null
            ? `Ayer: ${bs(totalAyer)}`
            : `${variacion >= 0 ? '↗' : '↘'} ${variacion >= 0 ? '+' : ''}${variacion.toFixed(1)}% vs ayer`}
          destacado={variacion !== null && variacion >= 0}
        />
        <Tile label="Cobros" valor={String(ventas.length)} unidad="hoy" pie={`${nPendientes} por cobrar`} />
      </div>

      {/* ── Nuevo cobro ── */}
      <button
        onClick={() => setPrefill({})}
        disabled={!arqueo}
        style={{ ...btnPrimario('lg', !arqueo), width: '100%', marginBottom: '1.5rem' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nuevo cobro
      </button>

      {/* ── Filtros ── */}
      {/* Grid de 3 columnas iguales para que ocupen todo el ancho — con flex
          quedaba un hueco a la derecha. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem', marginBottom: '1rem' }}>
        {([
          ['todos', `Todos (${filas.length})`],
          ['por-cobrar', `Por cobrar (${nPendientes})`],
          ['cobrados', `Cobrados (${ventas.length})`],
        ] as [Filtro, string][]).map(([id, label]) => {
          const on = id === filtro
          return (
            <button key={id} onClick={() => setFiltro(id)} style={{
              // Deja envolver: "Por cobrar (2)" no entra en una línea a 375px
              ...chip(on), padding: '.5rem .35rem', fontSize: '.64rem',
              letterSpacing: '.05em', whiteSpace: 'normal', lineHeight: 1.25,
            }}>{label}</button>
          )
        })}
      </div>

      {/* ── Lista ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.6rem' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
          Movimiento
        </span>
        <button onClick={cargar} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 500,
          letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)',
        }}>Actualizar</button>
      </div>

      {visibles.length === 0 ? (
        <Vacio filtro={filtro} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {visibles.map(f => (
            <FilaCard
              key={f.key} fila={f}
              barbero={nombrePorId.get(f.barberoId) ?? f.barberoId}
              onCobrar={() => setPrefill({
                appointmentId: f.tipo === 'pendiente' ? f.appointmentId : null,
                clienteNombre: f.cliente,
                barberoBusinessId: f.barberoId,
                servicioNombre: f.servicio,
              })}
            />
          ))}
        </div>
      )}

      {prefill && arqueo && (
        <CobroDialog
          businessId={pro.businessId}
          arqueoId={arqueo.id}
          userId={usuario.user_id}
          barberos={barberos}
          servicios={pro.services}
          qrUrl={qrUrl}
          slug={pro.slug}
          prefill={prefill}
          onCerrar={() => setPrefill(null)}
          onCobrado={() => { setPrefill(null); cargar() }}
        />
      )}
    </div>
  )
}

/* ── Piezas ───────────────────────────────────────────────── */

function Tile({ label, valor, unidad, pie, destacado }: {
  label: string; valor: string; unidad: string; pie: string; destacado?: boolean
}) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-lg)', padding: '.85rem 1rem' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '.62rem', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
        {label}
      </p>
      <p style={{ display: 'flex', alignItems: 'baseline', gap: '.3rem', marginTop: '.3rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, lineHeight: 1, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>{valor}</span>
        <span style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)' }}>{unidad}</span>
      </p>
      <p style={{ fontSize: '.68rem', marginTop: '.3rem', color: destacado ? 'var(--color-gold)' : 'var(--color-ink-ghost)' }}>{pie}</p>
    </div>
  )
}

function FilaCard({ fila, barbero, onCobrar }: { fila: Fila; barbero: string; onCobrar: () => void }) {
  const pendiente = fila.tipo === 'pendiente'
  const Icono = pendiente ? Clock : Check
  const acento = pendiente ? 'var(--color-gold)' : 'var(--color-ink-ghost)'

  return (
    <div style={{
      display: 'flex', gap: '.85rem',
      padding: '.95rem 1rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-rim)',
      // Riel más grueso en las pendientes: es lo que hay que mirar primero
      borderLeft: `3px solid ${pendiente ? 'var(--color-gold)' : 'var(--color-rim)'}`,
    }}>
      {/* Placa del icono */}
      <div style={{
        width: '2.6rem', height: '2.6rem', flexShrink: 0,
        background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
        borderRadius: 'var(--r-md)',
        display: 'grid', placeItems: 'center', color: acento,
      }}>
        <Icono size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
        {/* Nombre y monto */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.75rem', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 400,
              color: 'var(--color-ink)', lineHeight: 1.1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{fila.cliente}</p>
            <p style={{ fontSize: '.78rem', color: 'var(--color-ink-dim)', lineHeight: 1.4, marginTop: '.1rem' }}>
              {fila.servicio || '—'}
            </p>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {!pendiente && (
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400,
                color: 'var(--color-ink)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums',
              }}>{bs(Number(fila.venta.total))}</p>
            )}
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: '.35rem',
              marginTop: pendiente ? 0 : '.15rem',
              fontSize: '.66rem', fontWeight: 600, letterSpacing: '.1em',
              textTransform: 'uppercase', color: acento,
            }}>
              <span style={{ width: '.4rem', height: '.4rem', borderRadius: '50%', background: acento, flexShrink: 0 }} />
              {pendiente ? 'Por cobrar' : 'Pagado'}
            </p>
          </div>
        </div>

        {/* Barbero y acción */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '.35rem', minWidth: 0,
            fontSize: '.74rem', color: 'var(--color-ink-ghost)',
          }}>
            <Scissors size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {barbero} · {fila.hora}
            </span>
          </span>

          {pendiente ? (
            <button onClick={onCobrar} style={{ ...btnPrimario('sm'), flexShrink: 0 }}>
              Cobrar ahora
            </button>
          ) : (
            <span style={{
              padding: '.3rem .6rem', flexShrink: 0,
              background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
              borderRadius: 'var(--r-sm)',
              fontSize: '.66rem', color: 'var(--color-ink-dim)',
            }}>
              {METODO_LABEL[fila.venta.metodo_pago] ?? fila.venta.metodo_pago}
              {Number(fila.venta.propina) > 0 && ` · propina ${bs(Number(fila.venta.propina))}`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Vacio({ filtro }: { filtro: Filtro }) {
  const msg =
    filtro === 'por-cobrar' ? 'No queda nada por cobrar.'
    : filtro === 'cobrados' ? 'Todavía no se cobró nada hoy.'
    : 'No hay citas ni cobros hoy.'
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-lg)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.95rem', color: 'var(--color-ink-ghost)' }}>{msg}</p>
    </div>
  )
}

function Cargando() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: '5rem', animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )
}
