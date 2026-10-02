import { useState, useEffect, useCallback, useMemo } from 'react'
import { Check, Percent, Scissors } from 'lucide-react'
import type { Professional, StaffMember } from '../../types/professional'
import type { PosUsuario } from '../../lib/pos/auth'
import {
  calcularPeriodo, getResumen, liquidar, guardarPorcentaje, YaLiquidadoError,
  type ResumenBarbero, type Periodo,
} from '../../lib/pos/comisiones'
import { bs, bsCorto } from './cajaTheme'
import { btnPrimario, chip } from '../../lib/panelUI'

type Rango = 'hoy' | 'semana' | 'mes'

const RANGOS: { id: Rango; label: string }[] = [
  { id: 'hoy',    label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes',    label: 'Este mes' },
]

export default function TabComisiones({ pro, usuario }: { pro: Professional; usuario: PosUsuario }) {
  const barberos: StaffMember[] = useMemo(() => pro.staff ?? [], [pro.staff])
  const barberoIds = useMemo(
    () => (barberos.length ? barberos.map(b => b.businessId) : [pro.businessId]),
    [barberos, pro.businessId],
  )

  const [rango, setRango] = useState<Rango>('hoy')
  const periodo: Periodo = useMemo(() => calcularPeriodo(rango), [rango])

  const [resumen, setResumen] = useState<ResumenBarbero[]>([])
  const [cargando, setCargando] = useState(true)
  const [fallo, setFallo] = useState(false)
  const [liquidando, setLiquidando] = useState<string | null>(null)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      setResumen(await getResumen(pro.businessId, periodo, barberoIds))
      setFallo(false)
    } catch {
      setFallo(true)
    } finally {
      setCargando(false)
    }
  }, [pro.businessId, periodo, barberoIds])

  useEffect(() => { setCargando(true); cargar() }, [cargar])

  // ── Totales del período ──
  const facturado = resumen.reduce((s, r) => s + r.facturado, 0)
  const comisiones = resumen.reduce((s, r) => s + r.comision, 0)
  const paraElSalon = facturado - comisiones
  const splitStaff = facturado > 0 ? (comisiones / facturado) * 100 : 0
  const totalPropinas = resumen.reduce((s, r) => s + r.propinas, 0)
  const totalAdelantos = resumen.reduce((s, r) => s + r.adelantos, 0)
  const totalAPagar = resumen.reduce((s, r) => s + r.aPagar, 0)

  const onLiquidar = async (r: ResumenBarbero) => {
    setLiquidando(r.barberoBusinessId)
    setError('')
    try {
      await liquidar(pro.businessId, periodo, r, usuario.user_id)
      await cargar()
    } catch (e) {
      setError(e instanceof YaLiquidadoError
        ? 'Ese período ya estaba liquidado. Actualizá para ver el detalle.'
        : 'No se pudo liquidar. Revisá la conexión e intentá de nuevo.')
    } finally {
      setLiquidando(null)
    }
  }

  const cambiarPorcentaje = async (id: string, pct: number) => {
    await guardarPorcentaje(pro.businessId, id, pct)
    await cargar()
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <div className="skeleton" style={{ height: '2.8rem', width: '14rem', marginBottom: '.75rem' }} />
        <div className="skeleton" style={{ height: '7rem', marginBottom: '.5rem' }} />
        {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: '9rem', animationDelay: `${i * 80}ms` }} />)}
      </div>
    )
  }

  if (fallo) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-lg)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.95rem', fontWeight: 500, color: 'var(--color-ink)' }}>No se pudieron cargar las comisiones</p>
        <p style={{ fontSize: '.82rem', color: 'var(--color-ink-ghost)', margin: '.4rem 0 1.25rem' }}>Revisá la conexión e intentá de nuevo.</p>
        <button onClick={() => { setCargando(true); cargar() }} style={btnPrimario('md')}>Reintentar</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)' }}>
          Comisiones
        </h2>
      </div>

      {/* ── Período ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem', marginBottom: '1rem' }}>
        {RANGOS.map(r => (
          <button key={r.id} onClick={() => setRango(r.id)} style={{
            ...chip(r.id === rango), padding: '.55rem .35rem', fontSize: '.66rem',
            letterSpacing: '.06em', whiteSpace: 'normal', lineHeight: 1.25,
          }}>{r.label}</button>
        ))}
      </div>

      {/* ── Reparto del período ── */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
        borderRadius: 'var(--r-lg)', padding: '1rem 1.1rem', marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '.62rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
              Total comisiones
            </p>
            <p style={{ display: 'flex', alignItems: 'baseline', gap: '.3rem', marginTop: '.25rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, lineHeight: 1, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {bsCorto(comisiones)}
              </span>
              <span style={{ fontSize: '.75rem', color: 'var(--color-ink-ghost)' }}>Bs</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '.62rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
              Facturado
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, lineHeight: 1.1, color: 'var(--color-ink-dim)', marginTop: '.25rem', fontVariantNumeric: 'tabular-nums' }}>
              {bs(facturado)}
            </p>
          </div>
        </div>

        {facturado > 0 && (
          <>
            <div style={{ display: 'flex', height: '.45rem', marginTop: '.9rem', borderRadius: '999px', overflow: 'hidden', background: 'var(--color-surface2)' }}>
              <div style={{ width: `${splitStaff}%`, background: 'var(--color-gold)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.45rem', fontSize: '.68rem' }}>
              <span style={{ color: 'var(--color-gold)' }}>
                Barberos {splitStaff.toFixed(0)}% · {bs(comisiones)}
              </span>
              <span style={{ color: 'var(--color-ink-ghost)' }}>
                Local {(100 - splitStaff).toFixed(0)}% · {bs(paraElSalon)}
              </span>
            </div>
            {/* El total a pagar casi nunca coincide con las comisiones, y sin
                mostrar la cuenta parece un error. Acá queda a la vista. */}
            <div style={{ borderTop: '1px solid var(--color-rim)', marginTop: '.85rem', paddingTop: '.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.75rem' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
                  Total a entregar
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {bs(totalAPagar)}
                </span>
              </div>
              <p style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)', marginTop: '.35rem', lineHeight: 1.5 }}>
                {bs(comisiones)} de comisión
                {totalPropinas > 0 && ` + ${bs(totalPropinas)} de propinas`}
                {totalAdelantos > 0 && ` − ${bs(totalAdelantos)} ya adelantados`}.
                Las propinas no entran en el reparto.
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p role="alert" style={{ fontSize: '.78rem', color: '#c47070', marginBottom: '.9rem' }}>{error}</p>
      )}

      {/* ── Por barbero ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
        {[...resumen]
          .sort((a, b) => b.facturado - a.facturado)
          .map((r, i) => (
            <TarjetaBarbero
              key={r.barberoBusinessId}
              r={r} puesto={i + 1}
              staff={barberos.find(b => b.businessId === r.barberoBusinessId) ?? null}
              nombreFallback={pro.shortName ?? pro.name}
              liquidando={liquidando === r.barberoBusinessId}
              onLiquidar={() => onLiquidar(r)}
              onPorcentaje={pct => cambiarPorcentaje(r.barberoBusinessId, pct)}
            />
          ))}
      </div>
    </div>
  )
}

/* ── Tarjeta ──────────────────────────────────────────────── */

function TarjetaBarbero({ r, puesto, staff, nombreFallback, liquidando, onLiquidar, onPorcentaje }: {
  r: ResumenBarbero
  puesto: number
  staff: StaffMember | null
  nombreFallback: string
  liquidando: boolean
  onLiquidar: () => void
  onPorcentaje: (pct: number) => Promise<void>
}) {
  const [editandoPct, setEditandoPct] = useState(false)
  const [pct, setPct] = useState(String(r.porcentaje))
  const [guardandoPct, setGuardandoPct] = useState(false)

  const cerrada = !!r.liquidacion
  const sinActividad = r.nServicios === 0

  const guardarPct = async () => {
    const n = Number(pct)
    if (!Number.isFinite(n) || n < 0 || n > 100) { setPct(String(r.porcentaje)); setEditandoPct(false); return }
    setGuardandoPct(true)
    try { await onPorcentaje(n) } finally { setGuardandoPct(false); setEditandoPct(false) }
  }

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
      borderLeft: `3px solid ${cerrada ? 'var(--color-rim)' : sinActividad ? 'var(--color-rim)' : 'var(--color-gold)'}`,
      borderRadius: 'var(--r-lg)', padding: '.9rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '.75rem',
      opacity: sinActividad ? .65 : 1,
    }}>
      {/* Identidad y total */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {staff?.photo ? (
            <img src={staff.photo} alt="" style={{ width: '2.6rem', height: '2.6rem', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--color-rim-l)' }} />
          ) : (
            <div style={{ width: '2.6rem', height: '2.6rem', borderRadius: '50%', background: 'var(--color-surface2)', border: '1px solid var(--color-rim-l)', display: 'grid', placeItems: 'center', color: 'var(--color-ink-ghost)', fontWeight: 600 }}>
              {(staff?.shortName ?? nombreFallback).charAt(0).toUpperCase()}
            </div>
          )}
          {!sinActividad && (
            <span style={{
              position: 'absolute', bottom: '-.2rem', right: '-.2rem',
              minWidth: '1.1rem', height: '1.1rem', padding: '0 .2rem',
              borderRadius: '999px', background: 'var(--color-gold)', color: 'var(--color-on-gold)',
              fontSize: '.58rem', fontWeight: 700, display: 'grid', placeItems: 'center',
              border: '2px solid var(--color-surface)',
            }}>{puesto}</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {staff?.shortName ?? staff?.name ?? nombreFallback}
          </p>
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.7rem', color: 'var(--color-ink-ghost)', marginTop: '.1rem' }}>
            <Scissors size={11} style={{ flexShrink: 0 }} />
            {sinActividad ? 'Sin servicios en el período' : `${r.nServicios} ${r.nServicios === 1 ? 'servicio' : 'servicios'}`}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '.6rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
            {cerrada ? 'Pagado' : 'A pagar'}
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {bs(cerrada ? Number(r.liquidacion!.a_pagar) : r.aPagar)}
          </p>
        </div>
      </div>

      {/* Desglose */}
      {!sinActividad && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', paddingTop: '.65rem', borderTop: '1px solid var(--color-rim)' }}>
          <Linea label={`Facturación servicios (${r.nServicios})`} valor={bs(r.facturado)} />
          <Linea
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
                Comisión
                {editandoPct ? (
                  <input
                    type="number" min="0" max="100" value={pct} autoFocus
                    onChange={e => setPct(e.target.value)}
                    onBlur={guardarPct}
                    onKeyDown={e => { if (e.key === 'Enter') guardarPct() }}
                    disabled={guardandoPct}
                    style={{
                      width: '3.2rem', padding: '.1rem .3rem', textAlign: 'right',
                      background: 'var(--color-bg)', border: '1px solid var(--color-gold)',
                      color: 'var(--color-ink)', fontFamily: 'var(--font-body)', fontSize: '16px',
                    }}
                  />
                ) : (
                  <button
                    onClick={() => { setPct(String(r.porcentaje)); setEditandoPct(true) }}
                    disabled={cerrada}
                    title={cerrada ? 'Ya liquidado' : 'Cambiar porcentaje'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '.15rem',
                      padding: '.1rem .35rem', background: 'var(--color-surface2)',
                      border: '1px solid var(--color-rim-l)', color: cerrada ? 'var(--color-ink-ghost)' : 'var(--color-gold)',
                      fontFamily: 'var(--font-body)', fontSize: '.66rem', fontWeight: 600,
                      cursor: cerrada ? 'default' : 'pointer',
                    }}
                  >
                    {cerrada ? Number(r.liquidacion!.porcentaje) : r.porcentaje}
                    <Percent size={9} />
                  </button>
                )}
              </span>
            }
            valor={bs(cerrada ? Number(r.liquidacion!.comision) : r.comision)}
          />
          {r.propinas > 0 && <Linea label="Propinas" valor={`+ ${bs(r.propinas)}`} destacado />}
          {r.adelantos > 0 && <Linea label="Adelantos entregados" valor={`− ${bs(r.adelantos)}`} negativo />}
        </div>
      )}

      {/* Estado y acción */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '.35rem',
          fontSize: '.66rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
          color: cerrada ? 'var(--color-ink-ghost)' : sinActividad ? 'var(--color-ink-ghost)' : 'var(--color-gold)',
        }}>
          {cerrada ? (
            <><Check size={12} /> Liquidado {new Date(r.liquidacion!.cerrada_at).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' })}</>
          ) : sinActividad ? 'Sin movimiento' : (
            <><span style={{ width: '.4rem', height: '.4rem', borderRadius: '50%', background: 'var(--color-gold)' }} /> Pendiente de pago</>
          )}
        </span>

        {!cerrada && !sinActividad && (
          <button onClick={onLiquidar} disabled={liquidando} style={{ ...btnPrimario('sm', liquidando), flexShrink: 0 }}>
            {liquidando ? 'Liquidando…' : 'Liquidar'}
          </button>
        )}
      </div>
    </div>
  )
}

function Linea({ label, valor, destacado, negativo }: {
  label: React.ReactNode; valor: string; destacado?: boolean; negativo?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', fontSize: '.76rem' }}>
      <span style={{ color: 'var(--color-ink-ghost)', minWidth: 0 }}>{label}</span>
      <span style={{
        flexShrink: 0, fontVariantNumeric: 'tabular-nums',
        color: negativo ? '#c47070' : destacado ? 'var(--color-gold)' : 'var(--color-ink-dim)',
      }}>{valor}</span>
    </div>
  )
}
