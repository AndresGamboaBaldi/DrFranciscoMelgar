import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react'
import {
  Lock, LockOpen, Banknote, QrCode, CreditCard, Plus, Minus, X,
  RotateCcw, CircleUser, CircleCheck, TriangleAlert, Trash2, Clock,
} from 'lucide-react'
import type { Professional } from '../../types/professional'
import type { PosUsuario } from '../../lib/pos/auth'
import { getEfectivoEsperado, getNombresUsuarios, type MetodoPago } from '../../lib/pos/cobros'
import {
  getArqueoAbierto, getUltimoCerrado, abrirArqueo, setFondoInicial,
  getMovimiento, getGastos, registrarGasto, borrarGasto, cerrarArqueo,
  CajaYaAbiertaError, CATEGORIAS,
  type ArqueoDetalle, type Gasto, type MovimientoTurno, type CategoriaGasto,
} from '../../lib/pos/arqueo'
import { bs, bsCorto } from './cajaTheme'
import { btnPrimario, btnSecundario, chip } from '../../lib/panelUI'
import { hoyISO } from '../../lib/pos/fechas'

/** Rojo de alerta: el mismo que usa la variación negativa en Reportes. */
const ROJO = '#c47070'

const ICONO_METODO = { efectivo: Banknote, qr: QrCode, tarjeta: CreditCard } as const
const ETIQUETA_METODO = { efectivo: 'Efectivo', qr: 'QR', tarjeta: 'Tarjeta' } as const

/**
 * Denominaciones en circulación en Bolivia.
 *
 * Los Bs 10 son billete y moneda a la vez; va una sola fila porque lo que
 * importa es cuántas piezas de ese valor hay, no de qué material son.
 */
const DENOMINACIONES = [200, 100, 50, 20, 10, 5, 2, 1] as const
const CORTE_BILLETE = 10   // de 10 para arriba se cuentan como billetes

type Conteo = Record<number, number>

const CONTEO_VACIO: Conteo = Object.fromEntries(DENOMINACIONES.map(d => [d, 0]))

export default function TabCaja({ pro, usuario }: { pro: Professional; usuario: PosUsuario }) {
  const [arqueo, setArqueo] = useState<ArqueoDetalle | null>(null)
  const [ultimo, setUltimo] = useState<ArqueoDetalle | null>(null)
  const [mov, setMov] = useState<MovimientoTurno | null>(null)
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [esperado, setEsperado] = useState(0)
  const [nombres, setNombres] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(true)
  const [fallo, setFallo] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const [a, u, n] = await Promise.all([
        getArqueoAbierto(pro.businessId),
        getUltimoCerrado(pro.businessId),
        getNombresUsuarios(pro.businessId),
      ])
      setArqueo(a); setUltimo(u); setNombres(n)

      if (a) {
        const [m, g, e] = await Promise.all([
          getMovimiento(a.id), getGastos(a.id), getEfectivoEsperado(a.id),
        ])
        setMov(m); setGastos(g); setEsperado(e)
      } else {
        setMov(null); setGastos([]); setEsperado(0)
      }
      setFallo(false)
    } catch {
      setFallo(true)
    } finally {
      setCargando(false)
    }
  }, [pro.businessId])

  useEffect(() => { setCargando(true); cargar() }, [cargar])

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <div className="skeleton" style={{ height: '2.8rem', width: '8rem', marginBottom: '.75rem' }} />
        <div className="skeleton" style={{ height: '6rem' }} />
        <div className="skeleton" style={{ height: '9rem', animationDelay: '60ms' }} />
        <div className="skeleton" style={{ height: '14rem', animationDelay: '120ms' }} />
      </div>
    )
  }

  if (fallo) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-lg)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.95rem', fontWeight: 500, color: 'var(--color-ink)' }}>No se pudo cargar la caja</p>
        <p style={{ fontSize: '.82rem', color: 'var(--color-ink-ghost)', margin: '.4rem 0 1.25rem' }}>Revisá la conexión e intentá de nuevo.</p>
        <button onClick={() => { setCargando(true); cargar() }} style={btnPrimario('md')}>Reintentar</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)' }}>
          Caja
        </h2>
      </div>

      {arqueo
        ? <TurnoAbierto
            arqueo={arqueo} mov={mov} gastos={gastos} esperado={esperado}
            nombres={nombres} pro={pro} usuario={usuario} onCambio={cargar}
          />
        : <CajaCerrada ultimo={ultimo} nombres={nombres} pro={pro} usuario={usuario} onAbierta={cargar} />}
    </div>
  )
}

/* ── Caja cerrada: el cierre anterior y el botón de apertura ─── */

function CajaCerrada({ ultimo, nombres, pro, usuario, onAbierta }: {
  ultimo: ArqueoDetalle | null
  nombres: Record<string, string>
  pro: Professional
  usuario: PosUsuario
  onAbierta: () => void
}) {
  const [fondo, setFondo] = useState('')
  const [abriendo, setAbriendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abrir = async () => {
    setAbriendo(true); setError(null)
    try {
      await abrirArqueo(pro.businessId, usuario.user_id, Number(fondo) || 0)
      onAbierta()
    } catch (e) {
      setError(e instanceof CajaYaAbiertaError
        ? 'Ya hay un turno abierto. Actualizá la pantalla.'
        : 'No se pudo abrir la caja. Intentá de nuevo.')
      setAbriendo(false)
    }
  }

  return (
    <div>
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
        borderRadius: 'var(--r-lg)', padding: '1.5rem 1.25rem', textAlign: 'center', marginBottom: '.75rem',
      }}>
        <span style={{
          width: '3rem', height: '3rem', margin: '0 auto .75rem', borderRadius: '50%',
          display: 'grid', placeItems: 'center',
          background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
          color: 'var(--color-ink-ghost)',
        }}>
          <Lock size={20} />
        </span>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.15 }}>
          Caja cerrada
        </p>
        <p style={{ fontSize: '.8rem', color: 'var(--color-ink-ghost)', marginTop: '.3rem', lineHeight: 1.6 }}>
          Abrí el turno con el fondo que dejes en la gaveta.
          Los cobros del día se registran dentro de ese turno.
        </p>
      </div>

      {/* ── Fondo inicial ── */}
      <Seccion titulo="Fondo inicial en gaveta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-ink-ghost)', flexShrink: 0 }}>Bs.</span>
          <input
            type="number" inputMode="decimal" min="0" step="10"
            value={fondo} onChange={e => setFondo(e.target.value)}
            placeholder="0"
            style={{
              ...estiloInput, flex: 1, minWidth: 0, textAlign: 'right',
              fontFamily: 'var(--font-display)', fontSize: '1.5rem', padding: '.55rem .75rem',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '.35rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
          {[0, 100, 200, 300, 500].map(v => (
            <button key={v} onClick={() => setFondo(String(v))}
              style={{ ...chip(Number(fondo) === v && fondo !== ''), flex: 1, minWidth: '3.4rem', padding: '.45rem .3rem', fontSize: '.64rem' }}>
              {v === 0 ? 'Sin fondo' : `Bs ${v}`}
            </button>
          ))}
        </div>
      </Seccion>

      {error && <Alerta texto={error} />}

      <button
        onClick={abrir} disabled={abriendo}
        style={{ ...btnPrimario('lg', abriendo), width: '100%', marginTop: '.5rem' }}
      >
        <LockOpen size={16} /> {abriendo ? 'Abriendo…' : 'Abrir caja del día'}
      </button>

      {ultimo && <ResumenCierre arqueo={ultimo} nombres={nombres} />}
    </div>
  )
}

/** Cómo quedó el último turno cerrado. */
function ResumenCierre({ arqueo, nombres }: { arqueo: ArqueoDetalle; nombres: Record<string, string> }) {
  const dif = Number(arqueo.diferencia ?? 0)
  const v = veredicto(dif)

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <Seccion titulo="Último cierre" sub={fechaLarga(arqueo.fecha)}>
        <Fila label="Efectivo esperado" valor={bs(Number(arqueo.efectivo_esperado ?? 0))} />
        <Fila label="Efectivo contado" valor={bs(Number(arqueo.efectivo_contado ?? 0))} />
        <Fila label={v.label} valor={v.monto(dif)} color={v.color} fuerte />
        {arqueo.cerrado_at && (
          <p style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.68rem', color: 'var(--color-ink-ghost)', marginTop: '.6rem' }}>
            <CircleUser size={11} style={{ flexShrink: 0 }} />
            {nombres[arqueo.cerrado_por ?? ''] ?? 'Usuario desconocido'} · {hora(arqueo.cerrado_at)}
          </p>
        )}
        {arqueo.nota_cierre && (
          <p style={{ fontSize: '.74rem', color: 'var(--color-ink-dim)', marginTop: '.5rem', lineHeight: 1.6, fontStyle: 'italic' }}>
            «{arqueo.nota_cierre}»
          </p>
        )}
      </Seccion>
    </div>
  )
}

/* ── Turno abierto ────────────────────────────────────────── */

function TurnoAbierto({ arqueo, mov, gastos, esperado, nombres, pro, usuario, onCambio }: {
  arqueo: ArqueoDetalle
  mov: MovimientoTurno | null
  gastos: Gasto[]
  esperado: number
  nombres: Record<string, string>
  pro: Professional
  usuario: PosUsuario
  onCambio: () => void
}) {
  const [conteo, setConteo] = useState<Conteo>(CONTEO_VACIO)
  const [sueltos, setSueltos] = useState('')
  const [editandoFondo, setEditandoFondo] = useState(false)
  const [nuevoGasto, setNuevoGasto] = useState(false)
  const [cerrando, setCerrando] = useState(false)

  const contado = useMemo(
    () => DENOMINACIONES.reduce((s, d) => s + d * (conteo[d] ?? 0), 0) + (Number(sueltos) || 0),
    [conteo, sueltos],
  )
  const hayConteo = DENOMINACIONES.some(d => (conteo[d] ?? 0) > 0) || Number(sueltos) > 0

  const totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0)
  const diferencia = Math.round((contado - esperado) * 100) / 100
  const v = veredicto(diferencia)
  const desactualizado = arqueo.fecha !== hoyISO()

  return (
    <div>
      {/* ── Estado del turno ── */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
        borderRadius: 'var(--r-lg)', padding: '1rem 1.1rem', marginBottom: '.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            padding: '.3rem .6rem', borderRadius: 'var(--r-sm)',
            background: 'var(--color-gold-glow)', border: '1px solid var(--color-gold)',
            fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600,
            letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-gold)',
          }}>
            <LockOpen size={12} /> Turno abierto
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.7rem', color: 'var(--color-ink-ghost)' }}>
            <Clock size={11} /> Apertura {hora(arqueo.abierto_at)}
          </span>
        </div>

        <p style={{ fontSize: '.74rem', color: 'var(--color-ink-dim)', marginTop: '.55rem' }}>
          {fechaLarga(arqueo.fecha)} · abierta por {nombres[arqueo.abierto_por] ?? 'usuario desconocido'}
        </p>

        {/* Un turno que quedó abierto de otro día mete los cobros de hoy en la
            caja de ayer: hay que avisarlo, no esconderlo. */}
        {desactualizado && (
          <div style={{
            display: 'flex', gap: '.5rem', marginTop: '.7rem', padding: '.65rem .75rem',
            background: 'var(--color-surface2)', border: `1px solid ${ROJO}`,
            borderRadius: 'var(--r-md)',
          }}>
            <TriangleAlert size={14} color={ROJO} style={{ flexShrink: 0, marginTop: '.1rem' }} />
            <p style={{ fontSize: '.72rem', color: 'var(--color-ink-dim)', lineHeight: 1.55 }}>
              Este turno quedó abierto desde el {fechaCorta(arqueo.fecha)}. Todo lo que se cobre
              hoy entra a esta caja hasta que la cierres.
            </p>
          </div>
        )}

        {/* ── Fondo inicial ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem',
          marginTop: '.8rem', paddingTop: '.8rem', borderTop: '1px solid var(--color-rim)',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
            Fondo inicial
          </span>
          {editandoFondo ? (
            <EditarFondo
              valor={Number(arqueo.fondo_inicial)}
              onGuardar={async m => { await setFondoInicial(arqueo.id, m); setEditandoFondo(false); onCambio() }}
              onCancelar={() => setEditandoFondo(false)}
            />
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {bs(Number(arqueo.fondo_inicial))}
              </span>
              <button onClick={() => setEditandoFondo(true)} style={{ ...btnSecundario('sm'), padding: '.35rem .65rem', fontSize: '.6rem' }}>
                Cambiar
              </button>
            </span>
          )}
        </div>
      </div>

      {/* ── Cobrado en el turno ── */}
      {mov && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
          borderRadius: 'var(--r-lg)', padding: '1.1rem', marginBottom: '.5rem',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
            Cobrado en el turno
          </span>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem,9vw,3rem)', fontWeight: 400,
            lineHeight: 1.05, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums', marginTop: '.35rem',
          }}>
            Bs. {bsCorto(mov.total)}
          </p>
          <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', marginTop: '.3rem' }}>
            {mov.nVentas === 0 ? 'Todavía sin cobros' : `${mov.nVentas} ${mov.nVentas === 1 ? 'cobro' : 'cobros'} registrados`}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem', marginTop: '.9rem' }}>
            {(['efectivo', 'qr', 'tarjeta'] as MetodoPago[]).map(m => {
              const Icono = ICONO_METODO[m]
              const d = mov.porMetodo[m]
              return (
                <div key={m} style={{
                  background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
                  borderRadius: 'var(--r-md)', padding: '.6rem .55rem', opacity: d.n === 0 ? .55 : 1,
                }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '.3rem', minWidth: 0 }}>
                    <Icono size={13} color="var(--color-gold)" style={{ flexShrink: 0 }} />
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: '.58rem', fontWeight: 600,
                      letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-dim)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{ETIQUETA_METODO[m]}</span>
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400,
                    color: 'var(--color-ink)', lineHeight: 1.1, marginTop: '.25rem', fontVariantNumeric: 'tabular-nums',
                  }}>
                    Bs. {bsCorto(d.total)}
                  </p>
                  <p style={{ fontSize: '.6rem', color: 'var(--color-ink-ghost)', marginTop: '.1rem' }}>
                    {m === 'efectivo' ? 'A la gaveta' : d.n === 0 ? 'Sin cobros' : `${d.n} ${d.n === 1 ? 'cobro' : 'cobros'}`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Gastos del turno ── */}
      <Seccion
        titulo="Gastos del turno"
        sub={totalGastos > 0 ? `− ${bs(totalGastos)}` : undefined}
      >
        {gastos.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.88rem', color: 'var(--color-ink-ghost)', textAlign: 'center', padding: '.9rem 0' }}>
            Sin gastos en este turno.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
            {gastos.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: '.7rem',
                background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
                borderLeft: `3px solid ${ROJO}`, borderRadius: 'var(--r-md)', padding: '.65rem .8rem',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {g.concepto}
                  </p>
                  <p style={{ fontSize: '.66rem', color: 'var(--color-ink-ghost)', marginTop: '.12rem' }}>
                    {hora(g.created_at)} · {CATEGORIAS.find(c => c.id === g.categoria)?.label ?? g.categoria}
                    {' · '}{nombres[g.registrado_por] ?? 'usuario desconocido'}
                  </p>
                </div>
                <span style={{ fontSize: '.84rem', fontWeight: 600, color: ROJO, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  − {bs(Number(g.monto))}
                </span>
                <button
                  onClick={async () => { await borrarGasto(g.id); onCambio() }}
                  aria-label="Quitar gasto"
                  style={{
                    width: '1.9rem', height: '1.9rem', flexShrink: 0, display: 'grid', placeItems: 'center',
                    background: 'none', border: '1px solid var(--color-rim-l)', borderRadius: 'var(--r-sm)',
                    color: 'var(--color-ink-ghost)', cursor: 'pointer', padding: 0,
                  }}
                ><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setNuevoGasto(true)} style={{ ...btnSecundario('sm'), width: '100%', marginTop: '.6rem' }}>
          <Plus size={14} /> Registrar gasto
        </button>
      </Seccion>

      {/* ── Conteo físico ── */}
      <Seccion
        titulo="Conteo físico de gaveta"
        accion={hayConteo ? (
          <button
            onClick={() => { setConteo(CONTEO_VACIO); setSueltos('') }}
            style={{ ...btnSecundario('sm'), padding: '.3rem .6rem', fontSize: '.58rem' }}
          >
            <RotateCcw size={11} /> Limpiar
          </button>
        ) : undefined}
      >
        <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', lineHeight: 1.6, marginBottom: '.8rem' }}>
          Contá la gaveta antes de mirar la diferencia: aparece recién cuando cargás el conteo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
          {DENOMINACIONES.map(d => (
            <FilaDenominacion
              key={d} valor={d} cantidad={conteo[d] ?? 0}
              onCambio={n => setConteo(c => ({ ...c, [d]: Math.max(0, n) }))}
            />
          ))}

          {/* Monedas chicas: contarlas una por una no vale la pena, se pesa
              el puñado y se escribe el monto. */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '.6rem',
            background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
            borderRadius: 'var(--r-md)', padding: '.5rem .6rem',
          }}>
            <span style={{
              width: '2.4rem', flexShrink: 0, textAlign: 'center',
              fontFamily: 'var(--font-body)', fontSize: '.6rem', fontWeight: 700,
              color: 'var(--color-ink-ghost)', letterSpacing: '.04em',
            }}>¢</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: '.75rem', color: 'var(--color-ink-dim)' }}>
              Monedas sueltas
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', flexShrink: 0 }}>
              <span style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)' }}>Bs</span>
              <input
                type="number" inputMode="decimal" min="0" step="0.1"
                value={sueltos} onChange={e => setSueltos(e.target.value)} placeholder="0"
                style={{ ...estiloInput, width: '5rem', padding: '.4rem .5rem', textAlign: 'right', fontWeight: 600 }}
              />
            </span>
          </div>
        </div>

        {/* ── Total contado ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.75rem',
          marginTop: '.9rem', paddingTop: '.8rem', borderTop: '1px solid var(--color-rim)',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '.66rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
            Total contado
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {bs(contado)}
          </span>
        </div>

        {/* El esperado y la diferencia salen recién con el conteo cargado: si
            se vieran antes, el conteo deja de ser una comprobación. */}
        {hayConteo && (
          <div style={{
            marginTop: '.75rem', padding: '.85rem 1rem', borderRadius: 'var(--r-md)',
            background: v.ok ? 'var(--color-gold-glow)' : 'var(--color-surface2)',
            border: `1px solid ${v.color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', minWidth: 0 }}>
                {v.ok ? <CircleCheck size={15} color={v.color} style={{ flexShrink: 0 }} />
                      : <TriangleAlert size={15} color={v.color} style={{ flexShrink: 0 }} />}
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: '.66rem', fontWeight: 600,
                  letterSpacing: '.1em', textTransform: 'uppercase', color: v.color,
                }}>{v.label}</span>
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: v.color, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {v.monto(diferencia)}
              </span>
            </div>
            <p style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)', marginTop: '.5rem', lineHeight: 1.55 }}>
              Esperado {bs(esperado)} = fondo {bs(Number(arqueo.fondo_inicial))}
              {' + '}efectivo {bs(mov?.porMetodo.efectivo.total ?? 0)}
              {totalGastos > 0 ? ` − gastos ${bs(totalGastos)}` : ''}
            </p>
          </div>
        )}
      </Seccion>

      <button
        onClick={() => setCerrando(true)}
        disabled={!hayConteo}
        style={{ ...btnPrimario('lg', !hayConteo), width: '100%', marginTop: '.5rem' }}
      >
        <Lock size={16} /> Cerrar turno y arquear
      </button>
      {!hayConteo && (
        <p style={{ fontSize: '.7rem', color: 'var(--color-ink-ghost)', textAlign: 'center', marginTop: '.5rem' }}>
          Cargá el conteo de la gaveta para poder cerrar.
        </p>
      )}

      {nuevoGasto && (
        <DialogoGasto
          businessId={pro.businessId} arqueoId={arqueo.id} userId={usuario.user_id}
          onCerrar={() => setNuevoGasto(false)}
          onGuardado={() => { setNuevoGasto(false); onCambio() }}
        />
      )}

      {cerrando && (
        <DialogoCierre
          arqueo={arqueo} contado={contado} esperado={esperado} userId={usuario.user_id}
          onCerrar={() => setCerrando(false)}
          onCerrado={() => { setCerrando(false); onCambio() }}
        />
      )}
    </div>
  )
}

/* ── Fila de denominación ─────────────────────────────────── */

function FilaDenominacion({ valor, cantidad, onCambio }: {
  valor: number
  cantidad: number
  onCambio: (n: number) => void
}) {
  const activa = cantidad > 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '.6rem',
      background: activa ? 'var(--color-surface2)' : 'transparent',
      border: `1px solid ${activa ? 'var(--color-rim-l)' : 'var(--color-rim)'}`,
      borderRadius: 'var(--r-md)', padding: '.5rem .6rem',
      transition: 'background .15s, border-color .15s',
    }}>
      {/* Placa con el corte: se reconoce el billete sin leer la etiqueta */}
      <span style={{
        width: '2.4rem', flexShrink: 0, textAlign: 'center', padding: '.2rem 0',
        borderRadius: 'var(--r-sm)',
        background: activa ? 'var(--color-gold)' : 'var(--color-surface2)',
        color: activa ? 'var(--color-on-gold)' : 'var(--color-ink-ghost)',
        fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}>{valor}</span>

      <span style={{ flex: 1, minWidth: 0, fontSize: '.75rem', color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {valor >= CORTE_BILLETE ? 'Billetes' : 'Monedas'} de Bs {valor}
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: '.2rem', flexShrink: 0 }}>
        <button onClick={() => onCambio(cantidad - 1)} disabled={cantidad === 0}
          aria-label={`Quitar un Bs ${valor}`}
          style={{ ...btnPaso, opacity: cantidad === 0 ? .4 : 1, cursor: cantidad === 0 ? 'default' : 'pointer' }}>
          <Minus size={13} />
        </button>
        <input
          type="number" inputMode="numeric" min="0" step="1"
          value={cantidad || ''} onChange={e => onCambio(Number(e.target.value) || 0)}
          placeholder="0" aria-label={`Cantidad de Bs ${valor}`}
          style={{ ...estiloInput, width: '2.9rem', padding: '.35rem .25rem', textAlign: 'center', fontWeight: 700 }}
        />
        <button onClick={() => onCambio(cantidad + 1)} aria-label={`Sumar un Bs ${valor}`} style={btnPaso}>
          <Plus size={13} />
        </button>
      </span>

      {/* Subtotal: ancho fijo para que la columna no baile al tipear */}
      <span style={{
        width: '4.6rem', flexShrink: 0, textAlign: 'right',
        fontSize: '.78rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
        color: activa ? 'var(--color-ink)' : 'var(--color-ink-ghost)',
      }}>
        {activa ? `Bs ${(valor * cantidad).toLocaleString('es-BO')}` : '—'}
      </span>
    </div>
  )
}

/* ── Editar el fondo en línea ─────────────────────────────── */

function EditarFondo({ valor, onGuardar, onCancelar }: {
  valor: number
  onGuardar: (m: number) => Promise<void>
  onCancelar: () => void
}) {
  const [txt, setTxt] = useState(String(valor))
  const [guardando, setGuardando] = useState(false)

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', flexShrink: 0 }}>
      <input
        type="number" inputMode="decimal" min="0" step="10" autoFocus
        value={txt} onChange={e => setTxt(e.target.value)}
        style={{ ...estiloInput, width: '5.5rem', padding: '.4rem .5rem', textAlign: 'right', fontWeight: 600 }}
      />
      <button
        onClick={async () => { setGuardando(true); await onGuardar(Number(txt) || 0) }}
        disabled={guardando}
        style={{ ...btnPrimario('sm', guardando), padding: '.4rem .7rem', fontSize: '.6rem' }}
      >OK</button>
      <button onClick={onCancelar} aria-label="Cancelar" style={{ ...btnPaso, width: '2rem', height: '2rem' }}>
        <X size={13} />
      </button>
    </span>
  )
}

/* ── Diálogo: registrar gasto ─────────────────────────────── */

function DialogoGasto({ businessId, arqueoId, userId, onCerrar, onGuardado }: {
  businessId: string
  arqueoId: string
  userId: string
  onCerrar: () => void
  onGuardado: () => void
}) {
  const [concepto, setConcepto] = useState('')
  const [categoria, setCategoria] = useState<CategoriaGasto>('insumos')
  const [monto, setMonto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onCerrar])

  const valido = concepto.trim().length > 0 && Number(monto) > 0

  const guardar = async () => {
    setGuardando(true); setError(null)
    try {
      await registrarGasto({ businessId, arqueoId, concepto, categoria, monto: Number(monto), userId })
      onGuardado()
    } catch {
      setError('No se pudo guardar el gasto. Intentá de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Registrar gasto" sub="Sale de la gaveta" onCerrar={onCerrar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <section>
          <Rotulo>Concepto</Rotulo>
          <input value={concepto} onChange={e => setConcepto(e.target.value)} autoFocus
            placeholder="Shampoo, luz, delivery…" style={estiloInput} />
        </section>

        <section>
          <Rotulo>Categoría</Rotulo>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.35rem' }}>
            {CATEGORIAS.map(c => (
              <button key={c.id} onClick={() => setCategoria(c.id)}
                style={{ ...chip(c.id === categoria), padding: '.5rem .25rem', fontSize: '.6rem', letterSpacing: '.04em' }}>
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <Rotulo>Monto</Rotulo>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-ink-ghost)' }}>Bs.</span>
            <input type="number" inputMode="decimal" min="0" step="1"
              value={monto} onChange={e => setMonto(e.target.value)} placeholder="0"
              style={{ ...estiloInput, flex: 1, minWidth: 0, textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '1.3rem', padding: '.5rem .7rem' }} />
          </div>
        </section>

        {error && <Alerta texto={error} />}
      </div>

      <div style={{ display: 'flex', gap: '.5rem', marginTop: '1.25rem' }}>
        <button onClick={onCerrar} style={{ ...btnSecundario('md'), flex: 1 }}>Cancelar</button>
        <button onClick={guardar} disabled={!valido || guardando} style={{ ...btnPrimario('md', !valido || guardando), flex: 1 }}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </Modal>
  )
}

/* ── Diálogo: cerrar el turno ─────────────────────────────── */

function DialogoCierre({ arqueo, contado, esperado, userId, onCerrar, onCerrado }: {
  arqueo: ArqueoDetalle
  contado: number
  esperado: number
  userId: string
  onCerrar: () => void
  onCerrado: () => void
}) {
  const [nota, setNota] = useState('')
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onCerrar])

  const diferencia = Math.round((contado - esperado) * 100) / 100
  const v = veredicto(diferencia)
  // Una caja descuadrada sin explicación no sirve de nada al día siguiente.
  const notaObligatoria = !v.ok && nota.trim().length === 0

  const confirmar = async () => {
    setCerrando(true); setError(null)
    try {
      await cerrarArqueo({ arqueoId: arqueo.id, contado, esperado, nota, userId })
      onCerrado()
    } catch {
      setError('No se pudo cerrar el turno. Intentá de nuevo.')
      setCerrando(false)
    }
  }

  return (
    <Modal titulo="Cerrar turno" sub={fechaLarga(arqueo.fecha)} onCerrar={onCerrar}>
      <div style={{
        background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
        borderRadius: 'var(--r-md)', padding: '.9rem 1rem', marginBottom: '1rem',
      }}>
        <Fila label="Efectivo esperado" valor={bs(esperado)} />
        <Fila label="Efectivo contado" valor={bs(contado)} />
        <div style={{ borderTop: '1px solid var(--color-rim)', marginTop: '.5rem', paddingTop: '.5rem' }}>
          <Fila label={v.label} valor={v.monto(diferencia)} color={v.color} fuerte />
        </div>
      </div>

      <section>
        <Rotulo extra={v.ok ? 'opcional' : 'obligatoria'}>Nota de cierre</Rotulo>
        <textarea
          value={nota} onChange={e => setNota(e.target.value)} rows={3}
          placeholder={v.ok ? 'Observaciones del turno…' : 'Explicá a qué se debe la diferencia'}
          style={{ ...estiloInput, resize: 'vertical', lineHeight: 1.5 }}
        />
      </section>

      <p style={{ fontSize: '.7rem', color: 'var(--color-ink-ghost)', marginTop: '.6rem', lineHeight: 1.55 }}>
        Al cerrar, el esperado y la diferencia quedan congelados. Los cobros siguientes
        necesitan un turno nuevo.
      </p>

      {error && <Alerta texto={error} />}

      <div style={{ display: 'flex', gap: '.5rem', marginTop: '1.25rem' }}>
        <button onClick={onCerrar} style={{ ...btnSecundario('md'), flex: 1 }}>Cancelar</button>
        <button
          onClick={confirmar} disabled={cerrando || notaObligatoria}
          style={{ ...btnPrimario('md', cerrando || notaObligatoria), flex: 1 }}
        >
          {cerrando ? 'Cerrando…' : 'Cerrar turno'}
        </button>
      </div>
    </Modal>
  )
}

/* ── Piezas ───────────────────────────────────────────────── */

function Modal({ titulo, sub, children, onCerrar }: {
  titulo: string
  sub?: string
  children: React.ReactNode
  onCerrar: () => void
}) {
  return (
    <div onClick={onCerrar} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '24rem', maxHeight: '88dvh',
        background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
        borderRadius: 'var(--r-xl)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <header style={{
          padding: '1rem 1.15rem', borderBottom: '1px solid var(--color-rim)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem',
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1 }}>
              {titulo}
            </h2>
            {sub && <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', marginTop: '.15rem' }}>{sub}</p>}
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" style={{
            background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
            borderRadius: 'var(--r-sm)', color: 'var(--color-ink-dim)', cursor: 'pointer',
            width: '2rem', height: '2rem', flexShrink: 0, display: 'grid', placeItems: 'center', padding: 0,
          }}><X size={15} /></button>
        </header>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.15rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Seccion({ titulo, sub, accion, children }: {
  titulo: string
  sub?: string
  accion?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
      borderRadius: 'var(--r-lg)', padding: '1rem', marginBottom: '.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
          {titulo}
        </span>
        {accion ?? (sub && <span style={{ fontSize: '.68rem', fontWeight: 600, color: 'var(--color-ink-ghost)', fontVariantNumeric: 'tabular-nums' }}>{sub}</span>)}
      </div>
      {children}
    </div>
  )
}

function Fila({ label, valor, color, fuerte }: {
  label: string
  valor: string
  color?: string
  fuerte?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.75rem', padding: '.22rem 0' }}>
      <span style={{ fontSize: fuerte ? '.74rem' : '.78rem', fontWeight: fuerte ? 600 : 400, color: color ?? 'var(--color-ink-dim)', letterSpacing: fuerte ? '.06em' : undefined, textTransform: fuerte ? 'uppercase' : undefined }}>
        {label}
      </span>
      <span style={{ fontSize: fuerte ? '.95rem' : '.82rem', fontWeight: fuerte ? 700 : 500, color: color ?? 'var(--color-ink)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {valor}
      </span>
    </div>
  )
}

function Rotulo({ children, extra }: { children: React.ReactNode; extra?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem', marginBottom: '.45rem' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '.62rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
        {children}
      </span>
      {extra && <span style={{ fontSize: '.64rem', color: 'var(--color-ink-ghost)' }}>{extra}</span>}
    </div>
  )
}

function Alerta({ texto }: { texto: string }) {
  return (
    <div style={{
      display: 'flex', gap: '.5rem', marginTop: '.75rem', padding: '.7rem .8rem',
      background: 'var(--color-surface2)', border: `1px solid ${ROJO}`, borderRadius: 'var(--r-md)',
    }}>
      <TriangleAlert size={14} color={ROJO} style={{ flexShrink: 0, marginTop: '.1rem' }} />
      <p style={{ fontSize: '.74rem', color: 'var(--color-ink-dim)', lineHeight: 1.55 }}>{texto}</p>
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────────────── */

/** Cómo se llama y de qué color va una diferencia de caja. */
function veredicto(dif: number) {
  if (Math.abs(dif) < 0.005) {
    return { ok: true, label: 'Caja cuadrada', color: 'var(--color-gold)', monto: () => bs(0) }
  }
  if (dif > 0) {
    return { ok: false, label: 'Sobrante', color: 'var(--color-gold)', monto: (d: number) => `+ ${bs(d)}` }
  }
  return { ok: false, label: 'Faltante', color: ROJO, monto: (d: number) => `− ${bs(Math.abs(d))}` }
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}

/** 'YYYY-MM-DD' → 'viernes 3 de octubre' */
function fechaLarga(f: string): string {
  return new Date(`${f}T00:00:00`).toLocaleDateString('es-BO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

/** 'YYYY-MM-DD' → 'DD/MM' */
function fechaCorta(f: string): string {
  const [, m, d] = f.split('-')
  return `${d}/${m}`
}

const btnPaso: CSSProperties = {
  width: '2.2rem',
  height: '2.2rem',
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  background: 'var(--color-surface2)',
  border: '1px solid var(--color-rim-l)',
  borderRadius: 'var(--r-sm)',
  color: 'var(--color-ink-dim)',
  cursor: 'pointer',
  padding: 0,
}

const estiloInput: CSSProperties = {
  width: '100%',
  padding: '.7rem .85rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rim-l)',
  borderRadius: 'var(--r-md)',
  color: 'var(--color-ink)',
  fontFamily: 'var(--font-body)',
  fontSize: '16px', // evita el zoom de iOS al enfocar
}
