import { useState, useEffect, useCallback, useMemo } from 'react'
import { TrendingUp, TrendingDown, Scissors, Receipt, Wallet, Banknote, QrCode, CreditCard } from 'lucide-react'
import type { Professional, StaffMember } from '../../types/professional'
import {
  calcularPeriodoReporte, getReporte, getCurvaDiaria,
  type Reporte, type PuntoDia, type TotalPorHora,
} from '../../lib/pos/reportes'
import { bs, bsCorto } from './cajaTheme'
import { btnPrimario, chip } from '../../lib/panelUI'
import { useEsMobile } from '../../lib/useHideOnScroll'

type Rango = 'hoy' | 'semana' | 'mes' | 'anio'

const RANGOS: { id: Rango; label: string }[] = [
  { id: 'hoy',    label: 'Hoy' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mes' },
  { id: 'anio',   label: 'Año' },
]

/**
 * 7 días en celular y 14 en pantallas anchas.
 *
 * Con 14 puntos a 343px de ancho, cada zona de toque queda en 24px — menos
 * del mínimo de 44px para el dedo. Con 7 sube a ~49px.
 */
const DIAS_MOVIL = 7
const DIAS_ESCRITORIO = 14

const ICONO_METODO = { efectivo: Banknote, qr: QrCode, tarjeta: CreditCard } as const
const ETIQUETA_METODO = { efectivo: 'Efectivo', qr: 'QR', tarjeta: 'Tarjeta' } as const

export default function TabReportes({ pro }: { pro: Professional }) {
  const esMobile = useEsMobile()
  const diasCurva = esMobile ? DIAS_MOVIL : DIAS_ESCRITORIO
  const barberos: StaffMember[] = useMemo(() => pro.staff ?? [], [pro.staff])
  const barberoIds = useMemo(
    () => (barberos.length ? barberos.map(b => b.businessId) : [pro.businessId]),
    [barberos, pro.businessId],
  )

  const [rango, setRango] = useState<Rango>('mes')
  const periodo = useMemo(() => calcularPeriodoReporte(rango), [rango])

  const [rep, setRep] = useState<Reporte | null>(null)
  const [curva, setCurva] = useState<PuntoDia[]>([])
  const [cargando, setCargando] = useState(true)
  const [fallo, setFallo] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        getReporte(pro.businessId, periodo, barberoIds),
        getCurvaDiaria(pro.businessId, diasCurva),
      ])
      setRep(r); setCurva(c); setFallo(false)
    } catch {
      setFallo(true)
    } finally {
      setCargando(false)
    }
  }, [pro.businessId, periodo, barberoIds, diasCurva])

  useEffect(() => { setCargando(true); cargar() }, [cargar])

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <div className="skeleton" style={{ height: '2.8rem', width: '11rem', marginBottom: '.75rem' }} />
        <div className="skeleton" style={{ height: '7rem' }} />
        <div className="skeleton" style={{ height: '5rem', animationDelay: '60ms' }} />
        <div className="skeleton" style={{ height: '12rem', animationDelay: '120ms' }} />
      </div>
    )
  }

  if (fallo || !rep) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-lg)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.95rem', fontWeight: 500, color: 'var(--color-ink)' }}>No se pudieron cargar los reportes</p>
        <p style={{ fontSize: '.82rem', color: 'var(--color-ink-ghost)', margin: '.4rem 0 1.25rem' }}>Revisá la conexión e intentá de nuevo.</p>
        <button onClick={() => { setCargando(true); cargar() }} style={btnPrimario('md')}>Reintentar</button>
      </div>
    )
  }

  const variacion = rep.facturadoPrevio > 0
    ? ((rep.facturado - rep.facturadoPrevio) / rep.facturadoPrevio) * 100
    : null
  const margen = rep.facturado > 0 ? (rep.neto / rep.facturado) * 100 : 0

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)' }}>
          Reportes
        </h2>
      </div>

      {/* ── Período ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.35rem', marginBottom: '1rem' }}>
        {RANGOS.map(r => (
          <button key={r.id} onClick={() => setRango(r.id)} style={{
            ...chip(r.id === rango), padding: '.55rem .25rem', fontSize: '.64rem', letterSpacing: '.06em',
          }}>{r.label}</button>
        ))}
      </div>

      {/* ── Facturación del período ── */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
        borderRadius: 'var(--r-lg)', padding: '1.1rem', marginBottom: '.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
            Ingresos totales brutos
          </span>
          {variacion !== null && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '.25rem', flexShrink: 0,
              padding: '.2rem .5rem', borderRadius: 'var(--r-sm)',
              background: 'var(--color-surface2)',
              fontSize: '.7rem', fontWeight: 600,
              color: variacion >= 0 ? 'var(--color-gold)' : '#c47070',
            }}>
              {variacion >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {variacion >= 0 ? '+' : ''}{variacion.toFixed(1)}%
            </span>
          )}
        </div>
        {/* "Bs." entra en el display, al mismo tamaño que el número */}
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem,9vw,3rem)', fontWeight: 400,
          lineHeight: 1.05, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums',
          marginTop: '.35rem',
        }}>
          Bs. {bsCorto(rep.facturado)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.75rem', marginTop: '.6rem' }}>
          <span style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)' }}>
            Período anterior: Bs. {bsCorto(rep.facturadoPrevio)}
          </span>
          <span style={{
            fontSize: '.68rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
            color: 'var(--color-gold)', flexShrink: 0,
          }}>
            {rep.nVentas} {rep.nVentas === 1 ? 'servicio' : 'servicios'}
          </span>
        </div>

        {/* Desglose por forma de cobro. Suma el facturado de arriba, no lo
            recibido: las propinas van aparte y no son ingreso del local. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem', marginTop: '.9rem' }}>
          {rep.porMetodo.map(m => {
            const Icono = ICONO_METODO[m.metodo]
            return (
              <div key={m.metodo} style={{
                background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
                borderRadius: 'var(--r-md)', padding: '.6rem .55rem',
                opacity: m.n === 0 ? .55 : 1,
              }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '.3rem', minWidth: 0 }}>
                  <Icono size={13} color="var(--color-gold)" style={{ flexShrink: 0 }} />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: '.58rem', fontWeight: 600,
                    letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-dim)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{ETIQUETA_METODO[m.metodo]}</span>
                </p>
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400,
                  color: 'var(--color-ink)', lineHeight: 1.1, marginTop: '.25rem',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  Bs. {bsCorto(m.total)}
                </p>
                <p style={{ fontSize: '.6rem', color: 'var(--color-ink-ghost)', marginTop: '.1rem' }}>
                  {m.n === 0 ? 'Sin cobros' : `${m.n} ${m.n === 1 ? 'cobro' : 'cobros'}`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Resultado ── */}
      {/* minmax 14rem: en celular quedan apiladas a ancho completo, como en el
          diseño, y en pantalla ancha se acomodan en fila. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '.5rem', marginBottom: '1.25rem' }}>
        <Tile
          icono={Wallet} label="Ganancia neta"
          valor={`Bs. ${bsCorto(rep.neto)}`}
          pie={`Margen neto: ${margen.toFixed(1)}%`}
          resaltado
        />
        <Tile
          icono={Scissors} label="Comisiones + propinas"
          valor={`Bs. ${bsCorto(rep.comisionesMasPropinas)}`}
          // Sin esta aclaración no se entiende por qué no coincide con el
          // "a pagar" de la pestaña Comisiones, que sí incluye las propinas.
          pie={`${barberoIds.length} ${barberoIds.length === 1 ? 'barbero' : 'barberos'}`}
          pieAcento resaltado
        />
        <Tile
          icono={Receipt} label="Gastos operativos"
          valor={`Bs. ${bsCorto(rep.gastos)}`}
          pie={rep.gastos > 0 ? 'Insumos, servicios, otros' : 'Sin gastos cargados'}
        />
      </div>

      {/* ── Curva ── */}
      <Seccion titulo="Facturación diaria" sub={`Últimos ${diasCurva} días`}>
        <Curva puntos={curva} />
      </Seccion>

      {/* ── Horas ── */}
      <Seccion
        titulo="Horas más llenas"
        sub={rep.porHora.length ? `Pico: ${String(rep.porHora.reduce((a, b) => (b.n > a.n ? b : a)).hora).padStart(2, '0')}:00` : undefined}
      >
        {rep.porHora.length === 0 ? (
          <Vacio texto="Sin cobros en este período." />
        ) : (
          <Horas datos={rep.porHora} />
        )}
      </Seccion>

      {/* ── Servicios ── */}
      <Seccion titulo="Servicios más vendidos" sub={rep.porServicio.length ? `${rep.porServicio.length} distintos` : undefined}>
        {rep.porServicio.length === 0 ? (
          <Vacio texto="Todavía no hay servicios cobrados en este período." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {rep.porServicio.slice(0, 6).map(s => {
              const pct = rep.facturadoServicios > 0 ? (s.total / rep.facturadoServicios) * 100 : 0
              return (
                <div key={s.nombre}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.75rem', fontSize: '.76rem', marginBottom: '.3rem' }}>
                    <span style={{ color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.nombre} <span style={{ color: 'var(--color-ink-ghost)' }}>· {s.cantidad}</span>
                    </span>
                    <span style={{ color: 'var(--color-ink)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {bs(s.total)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div style={{ flex: 1, height: '.4rem', background: 'var(--color-surface2)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-gold)', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '.66rem', color: 'var(--color-ink-ghost)', width: '2.4rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Seccion>

      {/* ── Ranking ── */}
      <Seccion titulo="Quién produjo más" sub={undefined}>
        {rep.topBarberos.every(b => b.nServicios === 0) ? (
          <Vacio texto="Sin cobros registrados en este período." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {rep.topBarberos.filter(b => b.nServicios > 0).map((b, i) => {
              const staff = barberos.find(x => x.businessId === b.barberoBusinessId) ?? null
              return (
                <div key={b.barberoBusinessId} style={{
                  display: 'flex', alignItems: 'center', gap: '.7rem',
                  padding: '.6rem .7rem', background: 'var(--color-surface2)',
                  border: '1px solid var(--color-rim)', borderRadius: 'var(--r-md)',
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {staff?.photo ? (
                      <img src={staff.photo} alt="" style={{ width: '2.3rem', height: '2.3rem', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--color-rim-l)' }} />
                    ) : (
                      <div style={{ width: '2.3rem', height: '2.3rem', borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-rim-l)', display: 'grid', placeItems: 'center', color: 'var(--color-ink-ghost)', fontWeight: 600, fontSize: '.8rem' }}>
                        {(staff?.shortName ?? pro.shortName ?? pro.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{
                      position: 'absolute', bottom: '-.15rem', right: '-.15rem',
                      minWidth: '1rem', height: '1rem', borderRadius: '999px',
                      background: 'var(--color-gold)', color: 'var(--color-on-gold)',
                      fontSize: '.55rem', fontWeight: 700, display: 'grid', placeItems: 'center',
                      border: '2px solid var(--color-surface2)',
                    }}>{i + 1}</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '.84rem', fontWeight: 500, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {staff?.shortName ?? staff?.name ?? pro.shortName ?? pro.name}
                    </p>
                    <p style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)' }}>
                      {b.nServicios} {b.nServicios === 1 ? 'servicio' : 'servicios'}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                      {bs(b.facturado)}
                    </p>
                    <p style={{ fontSize: '.66rem', color: 'var(--color-ink-ghost)' }}>
                      comisión {bs(b.comision)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Seccion>
    </div>
  )
}

/* ── Curva ────────────────────────────────────────────────── */

function Curva({ puntos }: { puntos: PuntoDia[] }) {
  const [sel, setSel] = useState<number | null>(null)

  if (puntos.length === 0) return <Vacio texto="Sin datos todavía." />

  const max = Math.max(...puntos.map(p => p.total), 1)
  const W = 320, H = 110
  // Margen superior para que el punto y su anillo no se corten en el borde.
  const PAD_T = 10, PAD_B = 16

  const x = (i: number) => (i / Math.max(puntos.length - 1, 1)) * W
  const y = (v: number) => PAD_T + (1 - v / max) * (H - PAD_T - PAD_B)

  const linea = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(' ')
  const area = `${linea} L ${W},${H - PAD_B} L 0,${H - PAD_B} Z`

  const pico = puntos.reduce((mejor, p, i) => (p.total > puntos[mejor].total ? i : mejor), 0)
  const activo = sel ?? pico
  const p = puntos[activo]

  const fechaCorta = (f: string) => {
    const [, m, d] = f.split('-')
    return `${d}/${m}`
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.5rem' }}>
        <span style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)' }}>
          {fechaCorta(p.fecha)}{activo === pico && sel === null ? ' · máximo' : ''}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
          {bs(p.total)}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '8rem', display: 'block', overflow: 'visible' }} role="img" aria-label="Facturación por día">
        {/* Grilla discreta: tres referencias, nada más */}
        {[0, 0.5, 1].map(f => (
          <line key={f} x1="0" x2={W} y1={y(max * f)} y2={y(max * f)}
            stroke="var(--color-rim)" strokeWidth="0.8" strokeDasharray={f === 0 ? undefined : '3,3'} fill="none" />
        ))}

        <path d={area} fill="var(--color-gold-glow)" />
        <path d={linea} fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {puntos.map((pt, i) => (
          <g key={pt.fecha}>
            {/* Área de toque mucho mayor que el punto, para el dedo */}
            <rect x={x(i) - W / puntos.length / 2} y="0" width={W / puntos.length} height={H}
              fill="transparent" style={{ cursor: 'pointer' }}
              onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} />
            {i === activo && (
              <circle cx={x(i)} cy={y(pt.total)} r="4.5"
                fill="var(--color-gold)" stroke="var(--color-surface)" strokeWidth="2" />
            )}
          </g>
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.64rem', color: 'var(--color-ink-ghost)', marginTop: '.3rem' }}>
        <span>{fechaCorta(puntos[0].fecha)}</span>
        <span>Hoy</span>
      </div>
    </div>
  )
}

/* ── Horas ────────────────────────────────────────────────── */

/**
 * Barras verticales por hora. El alto codifica la cantidad de servicios, que
 * es lo que dice cuándo hay gente — el monto depende de qué se vendió.
 */
function Horas({ datos }: { datos: TotalPorHora[] }) {
  const [sel, setSel] = useState<number | null>(null)

  const max = Math.max(...datos.map(h => h.n), 1)
  const pico = datos.reduce((a, b) => (b.n > a.n ? b : a))
  const activa = datos.find(h => h.hora === sel) ?? pico

  // Con muchas horas no entran todas las etiquetas: se muestra una de cada
  // dos, siempre incluyendo los extremos y el pico.
  const salto = datos.length > 10 ? 2 : 1
  const etiquetar = (h: TotalPorHora, i: number) =>
    i === 0 || i === datos.length - 1 || h.hora === pico.hora || i % salto === 0

  return (
    <div>
      {/* Lectura de la barra activa, como en la curva diaria */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.5rem' }}>
        <span style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', fontVariantNumeric: 'tabular-nums' }}>
          {String(activa.hora).padStart(2, '0')}:00–{String(activa.hora + 1).padStart(2, '0')}:00
          {activa.hora === pico.hora && sel === null ? ' · hora pico' : ''}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
          {activa.n} {activa.n === 1 ? 'cobro' : 'cobros'}
        </span>
      </div>

      <div style={{ position: 'relative', height: '7rem' }}>
        {/* Grilla: la misma referencia de tres líneas que usa la curva */}
        {[0, 0.5, 1].map(f => (
          <div key={f} style={{
            position: 'absolute', left: 0, right: 0, bottom: `${f * 100}%`,
            borderTop: `1px ${f === 0 ? 'solid' : 'dashed'} var(--color-rim)`,
          }} />
        ))}

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
          {datos.map(h => {
            const esActiva = h.hora === activa.hora
            return (
              <div
                key={h.hora}
                onClick={() => setSel(h.hora)}
                onMouseEnter={() => setSel(h.hora)}
                title={`${String(h.hora).padStart(2, '0')}:00 · ${h.n} ${h.n === 1 ? 'cobro' : 'cobros'} · ${bs(h.total)}`}
                style={{
                  flex: 1, minWidth: 0, height: '100%', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-end',
                }}
              >
                <div style={{
                  width: '100%',
                  // Una hora sin movimiento queda en cero de verdad: es lo que
                  // le da forma a la distribución.
                  height: h.n === 0 ? '2px' : `${(h.n / max) * 100}%`,
                  background: h.n === 0
                    ? 'var(--color-rim)'
                    : esActiva ? 'var(--color-gold)' : 'var(--color-gold-glow)',
                  borderTop: h.n > 0 && !esActiva ? '2px solid var(--color-gold)' : undefined,
                  borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
                }} />
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2px', marginTop: '.35rem' }}>
        {datos.map((h, i) => (
          <span key={h.hora} style={{
            flex: 1, textAlign: 'center', fontSize: '.58rem', minWidth: 0,
            color: h.hora === activa.hora ? 'var(--color-gold)' : 'var(--color-ink-ghost)',
            fontWeight: h.hora === activa.hora ? 600 : 400,
            fontVariantNumeric: 'tabular-nums',
          }}>{etiquetar(h, i) ? String(h.hora).padStart(2, '0') : ''}</span>
        ))}
      </div>
    </div>
  )
}

/* ── Piezas ───────────────────────────────────────────────── */

function Seccion({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
      borderRadius: 'var(--r-lg)', padding: '1rem', marginBottom: '.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem', marginBottom: '.85rem' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
          {titulo}
        </span>
        {sub && <span style={{ fontSize: '.64rem', color: 'var(--color-ink-ghost)' }}>{sub}</span>}
      </div>
      {children}
    </div>
  )
}

function Tile({ icono: Icono, label, valor, pie, pieAcento, resaltado }: {
  icono: typeof Wallet
  label: string
  valor: string
  pie: string
  /** El pie en color de acento, para el dato que vale la pena mirar. */
  pieAcento?: boolean
  /** Placa del icono teñida con el acento en vez de neutra. */
  resaltado?: boolean
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
      borderRadius: 'var(--r-lg)', padding: '1rem 1.1rem',
      display: 'flex', flexDirection: 'column', gap: '.45rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.75rem' }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: '.66rem', fontWeight: 600,
          letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)',
        }}>
          {label}
        </span>
        <span style={{
          width: '2.1rem', height: '2.1rem', flexShrink: 0, borderRadius: '50%',
          display: 'grid', placeItems: 'center',
          background: resaltado ? 'var(--color-gold-glow)' : 'var(--color-surface2)',
          border: `1px solid ${resaltado ? 'var(--color-gold)' : 'var(--color-rim)'}`,
          color: resaltado ? 'var(--color-gold)' : 'var(--color-ink-ghost)',
        }}>
          <Icono size={16} />
        </span>
      </div>

      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, lineHeight: 1.05,
        color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums',
      }}>{valor}</p>

      <p style={{
        fontSize: '.78rem',
        color: pieAcento ? 'var(--color-gold)' : 'var(--color-ink-ghost)',
      }}>{pie}</p>
    </div>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.9rem', color: 'var(--color-ink-ghost)', textAlign: 'center', padding: '1.5rem 0' }}>
      {texto}
    </p>
  )
}
