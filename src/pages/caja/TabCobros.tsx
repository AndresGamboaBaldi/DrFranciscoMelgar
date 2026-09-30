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

  // ── Resumen del día ──
  const hoyCobrado = ventas.reduce((s, v) => s + Number(v.total), 0)
  const ticketProm = ventas.length ? hoyCobrado / ventas.length : 0
  const variacion = totalAyer > 0 ? ((hoyCobrado - totalAyer) / totalAyer) * 100 : null

  // ── Filas ──
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

      {/* ── Resumen ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(8.5rem, 1fr))', gap: '.6rem' }}>
        <Tile
          label="Hoy cobrado"
          valor={bsCorto(hoyCobrado)}
          unidad="Bs."
          pie={
            variacion === null
              ? `Ayer: ${bs(totalAyer)}`
              : `${variacion >= 0 ? '↗' : '↘'} ${variacion >= 0 ? '+' : ''}${variacion.toFixed(1)}% vs ayer`
          }
          pieColor={variacion === null ? undefined : variacion >= 0 ? 'var(--caja-ok)' : 'var(--caja-danger)'}
        />
        <Tile label="Servicios" valor={String(ventas.length)} unidad="cobros" pie={`${nPendientes} por cobrar`} />
        <Tile label="Ticket prom." valor={bsCorto(ticketProm)} unidad="Bs." pie={ventas.length ? 'Del día' : 'Sin cobros aún'} />
      </div>

      {/* ── Nuevo cobro ── */}
      <button
        onClick={() => setPrefill({})}
        disabled={!arqueo}
        style={{
          width: '100%', padding: '1.05rem', borderRadius: '10px', border: 'none',
          background: arqueo ? 'var(--caja-accent)' : 'var(--caja-rim)',
          color: arqueo ? '#fff' : 'var(--caja-ink-ghost)',
          fontFamily: 'inherit', fontSize: '.88rem', fontWeight: 700,
          letterSpacing: '.06em', textTransform: 'uppercase',
          cursor: arqueo ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem',
        }}
      >
        <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>＋</span>
        Nuevo cobro
      </button>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: '.45rem', overflowX: 'auto', paddingBottom: '.15rem' }}>
        {([
          ['todos', `Todos (${filas.length})`],
          ['por-cobrar', `Por cobrar (${nPendientes})`],
          ['cobrados', `Cobrados (${ventas.length})`],
        ] as [Filtro, string][]).map(([id, label]) => {
          const on = id === filtro
          return (
            <button key={id} onClick={() => setFiltro(id)} style={{
              padding: '.5rem .9rem', borderRadius: '999px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '.76rem', fontWeight: on ? 600 : 500, whiteSpace: 'nowrap',
              background: on ? 'var(--caja-accent)' : 'transparent',
              color: on ? '#fff' : 'var(--caja-ink-dim)',
              border: `1px solid ${on ? 'var(--caja-accent)' : 'var(--caja-rim-l)'}`,
            }}>{label}</button>
          )
        })}
      </div>

      {/* ── Lista ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.7rem' }}>
          <h2 style={{
            margin: 0, fontSize: '.72rem', fontWeight: 700, letterSpacing: '.16em',
            textTransform: 'uppercase', color: 'var(--caja-ink-dim)',
          }}>Movimiento del día</h2>
          <button onClick={cargar} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '.72rem', color: 'var(--caja-ink-ghost)', padding: 0,
          }}>Actualizar</button>
        </div>

        {visibles.length === 0 ? (
          <Vacio filtro={filtro} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
            {visibles.map(f => (
              <FilaCard
                key={f.key}
                fila={f}
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
      </div>

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

function Tile({ label, valor, unidad, pie, pieColor }: {
  label: string; valor: string; unidad: string; pie: string; pieColor?: string
}) {
  return (
    <div style={{
      background: 'var(--caja-surface)', border: '1px solid var(--caja-rim)',
      borderRadius: '10px', padding: '.85rem .9rem',
    }}>
      <p style={{
        margin: 0, fontSize: '.62rem', fontWeight: 600, letterSpacing: '.14em',
        textTransform: 'uppercase', color: 'var(--caja-ink-ghost)',
      }}>{label}</p>
      <p style={{ margin: '.35rem 0 0', display: 'flex', alignItems: 'baseline', gap: '.3rem' }}>
        <span style={{ fontSize: '1.55rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{valor}</span>
        <span style={{ fontSize: '.72rem', color: 'var(--caja-ink-ghost)' }}>{unidad}</span>
      </p>
      <p style={{ margin: '.3rem 0 0', fontSize: '.68rem', color: pieColor ?? 'var(--caja-ink-ghost)' }}>{pie}</p>
    </div>
  )
}

function FilaCard({ fila, barbero, onCobrar }: { fila: Fila; barbero: string; onCobrar: () => void }) {
  const pendiente = fila.tipo === 'pendiente'
  const monto = pendiente ? null : Number(fila.venta.total)

  return (
    <div style={{
      background: 'var(--caja-surface)',
      border: '1px solid var(--caja-rim)',
      borderLeft: `3px solid ${pendiente ? 'var(--caja-accent)' : 'var(--caja-rim)'}`,
      borderRadius: '10px', padding: '.85rem .95rem',
      display: 'flex', flexDirection: 'column', gap: '.55rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.75rem' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '.92rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fila.cliente}
          </p>
          <p style={{ margin: '.15rem 0 0', fontSize: '.78rem', color: 'var(--caja-ink-dim)', lineHeight: 1.4 }}>
            {fila.servicio || '—'}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {monto !== null && (
            <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {bs(monto)}
            </p>
          )}
          <p style={{
            margin: monto !== null ? '.15rem 0 0' : 0, fontSize: '.68rem', fontWeight: 600,
            color: pendiente ? 'var(--caja-warn)' : 'var(--caja-ok)',
          }}>
            {pendiente ? '● Por cobrar' : '✓ Pagado'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '.72rem', color: 'var(--caja-ink-ghost)' }}>
          {barbero} · {fila.hora}
        </span>
        {pendiente ? (
          <button onClick={onCobrar} style={{
            padding: '.5rem .95rem', borderRadius: '7px', border: 'none',
            background: 'var(--caja-accent)', color: '#fff', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '.74rem', fontWeight: 600,
          }}>Cobrar ahora</button>
        ) : (
          <span style={{
            padding: '.3rem .6rem', borderRadius: '5px', fontSize: '.68rem',
            background: 'var(--caja-surface2)', color: 'var(--caja-ink-dim)',
            border: '1px solid var(--caja-rim)',
          }}>
            {METODO_LABEL[fila.venta.metodo_pago] ?? fila.venta.metodo_pago}
            {Number(fila.venta.propina) > 0 && ` · propina ${bs(Number(fila.venta.propina))}`}
          </span>
        )}
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
    <div style={{
      border: '1px dashed var(--caja-rim-l)', borderRadius: '10px',
      padding: '2.5rem 1.5rem', textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--caja-ink-ghost)' }}>{msg}</p>
    </div>
  )
}

function Cargando() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          height: '4.5rem', borderRadius: '10px', background: 'var(--caja-surface)',
          border: '1px solid var(--caja-rim)', opacity: 1 - i * 0.18,
        }} />
      ))}
    </div>
  )
}
