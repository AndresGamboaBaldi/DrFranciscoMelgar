import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAppointmentsByDate } from '../../lib/supabase'
import type { Appointment } from '../../types/booking'
import type { Professional, StaffMember } from '../../types/professional'
import type { PosUsuario } from '../../lib/pos/auth'
import { getOAbrirArqueo, getVentasDelDia, getTotalDelDia, type Venta, type Arqueo } from '../../lib/pos/cobros'
import { bs, bsCorto, hoyISO } from './cajaTheme'
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
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [prefill, setPrefill] = useState<CobroPrefill | null>(null)

  const cargar = useCallback(async () => {
    const hoy = hoyISO()
    const [cs, vs, ayer, arq] = await Promise.all([
      getAppointmentsByDate(businessIds, hoy),
      getVentasDelDia(pro.businessId, hoy),
      getTotalDelDia(pro.businessId, ayerISO()),
      getOAbrirArqueo(pro.businessId, usuario.user_id),
    ])
    setCitas(cs)
    setVentas(vs)
    setTotalAyer(ayer)
    setArqueo(arq)
    setCargando(false)
  }, [businessIds, pro.businessId, usuario.user_id])

  useEffect(() => { cargar() }, [cargar])

  const hoyCobrado = ventas.reduce((s, v) => s + Number(v.total), 0)
  const variacion = totalAyer > 0 ? ((hoyCobrado - totalAyer) / totalAyer) * 100 : null

  const cobradasIds = useMemo(
    () => new Set(ventas.map(v => v.appointment_id).filter(Boolean) as string[]),
    [ventas],
  )

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
      hora: new Date(v.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      cliente: v.cliente_nombre ?? 'Sin nombre',
      servicio: v.items.map(i => i.nombre).join(' + '),
      barberoId: v.barbero_business_id,
      venta: v,
    }))

    return [...pendientes, ...hechas].sort((a, b) => b.hora.localeCompare(a.hora))
  }, [citas, ventas, cobradasIds, pro.businessId])

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
        style={{
          width: '100%', padding: '1rem 2rem', marginBottom: '1.5rem',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem',
          background: arqueo ? 'var(--color-gold)' : 'var(--color-rim-l)',
          color: arqueo ? 'var(--color-bg)' : 'var(--color-ink-ghost)',
          border: 'none', fontFamily: 'var(--font-body)', fontSize: '.78rem',
          fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase',
          cursor: arqueo ? 'pointer' : 'not-allowed',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nuevo cobro
      </button>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: '.4rem', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '.15rem' }}>
        {([
          ['todos', `Todos (${filas.length})`],
          ['por-cobrar', `Por cobrar (${nPendientes})`],
          ['cobrados', `Cobrados (${ventas.length})`],
        ] as [Filtro, string][]).map(([id, label]) => {
          const on = id === filtro
          return (
            <button key={id} onClick={() => setFiltro(id)} style={{
              padding: '.45rem .9rem', whiteSpace: 'nowrap',
              background: on ? 'var(--color-gold-glow)' : 'none',
              border: `1px solid ${on ? 'var(--color-gold)' : 'var(--color-rim-l)'}`,
              color: on ? 'var(--color-gold)' : 'var(--color-ink-dim)',
              fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 500,
              letterSpacing: '.1em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all .2s',
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
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '.85rem 1rem' }}>
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

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '.85rem 1rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-rim)',
      borderLeft: `2px solid ${pendiente ? 'var(--color-gold)' : 'var(--color-rim)'}`,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: '10rem' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 500, color: 'var(--color-ink)' }}>
          {fila.cliente}
        </p>
        <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', marginTop: '.1rem' }}>
          {fila.servicio || '—'}
        </p>
        <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', marginTop: '.1rem' }}>
          {barbero} · {fila.hora}
        </p>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {!pendiente && (
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {bs(Number(fila.venta.total))}
          </p>
        )}
        <p style={{ fontSize: '.68rem', marginTop: '.15rem', color: pendiente ? 'var(--color-gold)' : 'var(--color-ink-ghost)' }}>
          {pendiente
            ? 'Por cobrar'
            : `${METODO_LABEL[fila.venta.metodo_pago] ?? fila.venta.metodo_pago}${Number(fila.venta.propina) > 0 ? ` · propina ${bs(Number(fila.venta.propina))}` : ''}`}
        </p>
      </div>

      {pendiente && (
        <button
          onClick={onCobrar}
          style={{
            padding: '.45rem .9rem', flexShrink: 0,
            background: 'var(--color-gold-glow)', border: '1px solid var(--color-gold)',
            color: 'var(--color-gold)', fontFamily: 'var(--font-body)', fontSize: '.68rem',
            fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all .2s',
          }}
        >Cobrar</button>
      )}
    </div>
  )
}

function Vacio({ filtro }: { filtro: Filtro }) {
  const msg =
    filtro === 'por-cobrar' ? 'No queda nada por cobrar.'
    : filtro === 'cobrados' ? 'Todavía no se cobró nada hoy.'
    : 'No hay citas ni cobros hoy.'
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
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
