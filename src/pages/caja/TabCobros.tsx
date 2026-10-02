import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAppointmentsByDate, getScheduleSettings } from '../../lib/supabase'
import type { Appointment } from '../../types/booking'
import type { Professional, StaffMember } from '../../types/professional'
import type { PosUsuario } from '../../lib/pos/auth'
import { getOAbrirArqueo, getVentasDelDia, getTotalDelDia, getNombresUsuarios, type Venta, type Arqueo } from '../../lib/pos/cobros'
import { bs, bsCorto } from './cajaTheme'
import { hoyISO, correrDias, etiquetaDia } from '../../lib/pos/fechas'
import { btnPrimario, chip } from '../../lib/panelUI'
import { Scissors, Clock, Check, Info, X, ChevronLeft, ChevronRight, QrCode, Banknote, CreditCard } from 'lucide-react'
import CobroDialog, { type CobroPrefill } from './CobroDialog'

type Filtro = 'todos' | 'por-cobrar' | 'cobrados'

/** Una fila de la lista: o una cita pendiente de cobro, o una venta ya hecha. */
type Fila =
  | { tipo: 'pendiente'; key: string; hora: string; cliente: string; servicio: string; barberoId: string; appointmentId: string }
  | { tipo: 'cobrado';   key: string; hora: string; cliente: string; servicio: string; barberoId: string; venta: Venta }

const ICONO_METODO: Record<string, typeof Banknote> = {
  efectivo: Banknote,
  qr: QrCode,
  tarjeta: CreditCard,
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  qr: 'QR / Transferencia',
  tarjeta: 'Tarjeta',
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
  const [falloCarga, setFalloCarga] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [prefill, setPrefill] = useState<CobroPrefill | null>(null)
  /** Día que se está mirando. Arranca en hoy y se puede retroceder. */
  const [fecha, setFecha] = useState(hoyISO())
  const esHoy = fecha === hoyISO()
  const [detalle, setDetalle] = useState<Venta | null>(null)
  const [nombres, setNombres] = useState<Record<string, string>>({})

  const cargar = useCallback(async () => {
    try {
      const [cs, vs, ayer, arq, cfg, noms] = await Promise.all([
        getAppointmentsByDate(businessIds, fecha),
        getVentasDelDia(pro.businessId, fecha),
        getTotalDelDia(pro.businessId, correrDias(fecha, -1)),
        getOAbrirArqueo(pro.businessId, usuario.user_id),
        getScheduleSettings(pro.businessId),
        getNombresUsuarios(pro.businessId),
      ])
      setCitas(cs)
      setVentas(vs)
      setTotalAyer(ayer)
      setArqueo(arq)
      setQrUrl(cfg?.qr_image_url ?? null)
      setNombres(noms)
      setFalloCarga(false)
    } catch {
      setFalloCarga(true)
    } finally {
      // En finally: sin esto, un fallo deja la pantalla cargando para siempre.
      setCargando(false)
    }
  }, [businessIds, pro.businessId, usuario.user_id, fecha])

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

  if (falloCarga) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-lg)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.95rem', fontWeight: 500, color: 'var(--color-ink)' }}>
          No se pudieron cargar los datos del día
        </p>
        <p style={{ fontSize: '.82rem', color: 'var(--color-ink-ghost)', lineHeight: 1.6, margin: '.4rem 0 1.25rem' }}>
          Revisá la conexión del local y volvé a intentar.
        </p>
        <button onClick={() => { setCargando(true); cargar() }} style={btnPrimario('md')}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* ── Encabezado ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)' }}>
          Cobros
        </h2>
      </div>

      {/* ── Día ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem',
        background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
        borderRadius: 'var(--r-lg)', padding: '.4rem .5rem', marginBottom: '1rem',
      }}>
        <button onClick={() => setFecha(f => correrDias(f, -1))} aria-label="Día anterior" style={btnDia}>
          <ChevronLeft size={16} />
        </button>

        <div style={{ textAlign: 'center', minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '.84rem', fontWeight: 600,
            color: 'var(--color-ink)', textTransform: 'capitalize',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {etiquetaDia(fecha)}
          </p>
          {!esHoy && (
            <button onClick={() => setFecha(hoyISO())} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600,
              letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-gold)',
            }}>Volver a hoy</button>
          )}
        </div>

        {/* No se navega al futuro: no puede haber cobros que todavía no pasaron */}
        <button
          onClick={() => setFecha(f => correrDias(f, 1))}
          disabled={esHoy}
          aria-label="Día siguiente"
          style={{ ...btnDia, opacity: esHoy ? .3 : 1, cursor: esHoy ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Resumen ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.5rem', marginBottom: '1.25rem' }}>
        <Tile
          label="Cobrado" valor={bsCorto(hoyCobrado)} unidad="Bs"
          pie={variacion === null
            ? `Día anterior: ${bs(totalAyer)}`
            : `${variacion >= 0 ? '↗' : '↘'} ${variacion >= 0 ? '+' : ''}${variacion.toFixed(1)}% vs. día anterior`}
          destacado={variacion !== null && variacion >= 0}
        />
        <Tile
          label="Cobros" valor={String(ventas.length)}
          unidad={ventas.length === 1 ? 'cobro' : 'cobros'}
          pie={`${nPendientes} por cobrar`}
        />
      </div>

      {/* ── Nuevo cobro ── */}
      {/* El cobro se imputa al día que se está mirando, no al de hoy: por eso
          también se puede cobrar una cita de un día pasado. */}
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
              onVerDetalle={() => { if (f.tipo === 'cobrado') setDetalle(f.venta) }}
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
          fecha={fecha}
          prefill={prefill}
          onCerrar={() => setPrefill(null)}
          onCobrado={() => { setPrefill(null); cargar() }}
        />
      )}

      {detalle && (
        <DetalleCobro
          venta={detalle}
          cobradoPor={nombres[detalle.cobrado_por] ?? 'Usuario desconocido'}
          barbero={nombrePorId.get(detalle.barbero_business_id) ?? detalle.barbero_business_id}
          onCerrar={() => setDetalle(null)}
        />
      )}
    </div>
  )
}

/* ── Detalle del cobro ────────────────────────────────────── */

function DetalleCobro({ venta, cobradoPor, barbero, onCerrar }: {
  venta: Venta; cobradoPor: string; barbero: string; onCerrar: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onCerrar])

  const momento = new Date(venta.created_at)

  return (
    <div
      onClick={onCerrar}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '22rem', maxHeight: '90dvh',
          background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
          borderRadius: 'var(--r-xl)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <header style={{
          padding: '1rem 1.15rem', borderBottom: '1px solid var(--color-rim)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem',
          flexShrink: 0,
        }}>
          <h2 style={{
            display: 'inline-flex', alignItems: 'center', gap: '.45rem', minWidth: 0,
            fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400,
            color: 'var(--color-ink)', lineHeight: 1.1,
          }}>
            <Check size={16} color="var(--color-gold)" style={{ flexShrink: 0 }} />
            Detalle del cobro
          </h2>
          <button onClick={onCerrar} aria-label="Cerrar" style={{
            background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
            color: 'var(--color-ink-dim)', cursor: 'pointer',
            width: '2rem', height: '2rem', flexShrink: 0, display: 'grid', placeItems: 'center',
          }}><X size={15} /></button>
        </header>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>

          {/* Quién y cuándo */}
          <div style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-md)', padding: '.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
              <Campo rotulo="Cobrado por" valor={cobradoPor} />
              <Campo
                rotulo="Hora del cobro"
                valor={momento.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false })}
              />
            </div>
            <div style={{ marginTop: '.9rem' }}>
              <Campo rotulo="Fecha" valor={momento.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })} />
            </div>
          </div>

          {/* Datos del cobro */}
          <div style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-md)', padding: '.9rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            <Dato etiqueta="Cliente" valor={venta.cliente_nombre ?? 'Sin nombre'} />
            <Dato etiqueta="Atendió" valor={barbero} icono={Scissors} acento />
            <Dato
              etiqueta="Método"
              valor={METODO_LABEL[venta.metodo_pago] ?? venta.metodo_pago}
              icono={ICONO_METODO[venta.metodo_pago] ?? Banknote}
              acento
            />
          </div>

          {/* Concepto */}
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '.62rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', marginBottom: '.4rem' }}>
              Concepto
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
              {venta.items.map((it, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem',
                  background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
                  borderRadius: 'var(--r-md)', padding: '.65rem .8rem',
                }}>
                  <span style={{ fontSize: '.82rem', color: 'var(--color-ink)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.nombre}
                    {Number(it.cantidad) > 1 && <span style={{ color: 'var(--color-ink-ghost)' }}> ×{it.cantidad}</span>}
                  </span>
                  <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--color-gold)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {bs(Number(it.precio) * Number(it.cantidad))}
                  </span>
                </div>
              ))}
              {Number(venta.propina) > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem',
                  background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
                  borderRadius: 'var(--r-md)', padding: '.65rem .8rem',
                }}>
                  <span style={{ fontSize: '.82rem', color: 'var(--color-ink-dim)' }}>Propina</span>
                  <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--color-gold)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {bs(Number(venta.propina))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem',
            background: 'var(--color-gold-glow)', border: '1px solid var(--color-gold)',
            borderRadius: 'var(--r-md)', padding: '.85rem 1rem',
          }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '.66rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-gold)' }}>
              Total cobrado
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, color: 'var(--color-gold)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {bs(Number(venta.total))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Rótulo arriba y valor debajo, para la cuadrícula de quién/cuándo. */
function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '.6rem', fontWeight: 600,
        letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)',
        lineHeight: 1.35,
      }}>{rotulo}</p>
      <p style={{
        fontSize: '.84rem', fontWeight: 600, color: 'var(--color-ink)', marginTop: '.2rem',
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{valor}</p>
    </div>
  )
}

/** Etiqueta a la izquierda, valor a la derecha, con icono opcional. */
function Dato({ etiqueta, valor, icono: Icono, acento }: {
  etiqueta: string
  valor: string
  icono?: typeof Scissors
  acento?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.9rem' }}>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: '.62rem', fontWeight: 600,
        letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)',
        flexShrink: 0,
      }}>{etiqueta}</span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '.35rem', minWidth: 0,
        fontSize: '.84rem', fontWeight: 600, textAlign: 'right',
        color: acento ? 'var(--color-gold)' : 'var(--color-ink)',
      }}>
        {Icono && <Icono size={13} style={{ flexShrink: 0 }} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{valor}</span>
      </span>
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

function FilaCard({ fila, barbero, onCobrar, onVerDetalle }: {
  fila: Fila; barbero: string; onCobrar: () => void; onVerDetalle: () => void
}) {
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
              {!pendiente && (
                <button
                  onClick={onVerDetalle}
                  aria-label="Ver detalle del cobro" title="Ver detalle del cobro"
                  style={{
                    display: 'grid', placeItems: 'center', width: '1.15rem', height: '1.15rem',
                    padding: 0, background: 'none', border: 'none', borderRadius: '50%',
                    cursor: 'pointer', color: 'var(--color-ink-ghost)', flexShrink: 0,
                  }}
                >
                  <Info size={13} />
                </button>
              )}
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

const btnDia: React.CSSProperties = {
  width: '2.2rem',
  height: '2.2rem',
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  background: 'var(--color-surface2)',
  border: '1px solid var(--color-rim-l)',
  color: 'var(--color-ink-dim)',
  cursor: 'pointer',
  padding: 0,
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
