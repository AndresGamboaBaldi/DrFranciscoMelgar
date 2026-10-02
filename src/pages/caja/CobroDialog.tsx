import { useState, useEffect, useMemo } from 'react'
import { X, Plus, Check, QrCode, Banknote, CreditCard, ChevronDown } from 'lucide-react'
import { bs } from './cajaTheme'
import { btnPrimario } from '../../lib/panelUI'
import { registrarCobro, CitaYaCobradaError, type MetodoPago, type VentaItem } from '../../lib/pos/cobros'
import type { ProService, StaffMember } from '../../types/professional'

export interface CobroPrefill {
  appointmentId?: string | null
  clienteNombre?: string
  barberoBusinessId?: string
  servicioNombre?: string
  servicioId?: string | null
}

interface Props {
  businessId: string
  arqueoId: string
  userId: string
  barberos: StaffMember[]
  servicios: ProService[]
  /** QR de cobro del negocio (schedule_settings.qr_image_url), para mostrárselo al cliente. */
  qrUrl?: string | null
  slug: string
  prefill: CobroPrefill
  onCerrar: () => void
  onCobrado: () => void
}

const METODOS: { id: MetodoPago; label: string; icono: typeof QrCode }[] = [
  { id: 'qr',       label: 'QR / Transf.', icono: QrCode },
  { id: 'efectivo', label: 'Efectivo',     icono: Banknote },
  { id: 'tarjeta',  label: 'Tarjeta',      icono: CreditCard },
]

const PROPINAS_RAPIDAS = [0, 10, 20]

/** 'Desde Bs. 350' → 350. Sirve como punto de partida; la cajera lo ajusta. */
function precioSugerido(price?: string): number {
  if (!price) return 0
  const m = price.replace(/\./g, '').match(/(\d+)/)
  return m ? Number(m[1]) : 0
}

interface Linea extends VentaItem { id: string; libre?: boolean }

export default function CobroDialog({
  businessId, arqueoId, userId, barberos, servicios, qrUrl, slug, prefill, onCerrar, onCobrado,
}: Props) {
  const [verQr, setVerQr] = useState(false)
  const [barbero, setBarbero] = useState(
    prefill.barberoBusinessId ?? barberos[0]?.businessId ?? businessId,
  )
  const [cambiandoBarbero, setCambiandoBarbero] = useState(false)
  const [cliente, setCliente] = useState(prefill.clienteNombre ?? '')

  const barberoSel = barberos.find(b => b.businessId === barbero) ?? null
  // Un barbero puede tener catálogo propio; si no, usa el del negocio.
  const catalogo = barberoSel?.services ?? servicios

  const [seleccion, setSeleccion] = useState<Record<string, number>>(() => {
    // Precarga el servicio de la cita si coincide con alguno del catálogo
    const base = barberos.find(b => b.businessId === (prefill.barberoBusinessId ?? ''))?.services ?? servicios
    const coincide = prefill.servicioNombre
      ? base.find(s => s.name.toLowerCase() === prefill.servicioNombre!.toLowerCase())
      : null
    return coincide ? { [coincide.id]: precioSugerido(coincide.price) } : {}
  })
  const [libres, setLibres] = useState<Linea[]>(() =>
    // El servicio de la cita que no está en el catálogo entra como ítem libre
    prefill.servicioNombre && !servicios.some(s => s.name.toLowerCase() === prefill.servicioNombre!.toLowerCase())
      ? [{ id: 'libre-0', service_id: null, nombre: prefill.servicioNombre, precio: 0, cantidad: 1, libre: true }]
      : [],
  )

  const [propina, setPropina] = useState(0)
  const [propinaLibre, setPropinaLibre] = useState(false)
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const subtotal = useMemo(
    () => Object.values(seleccion).reduce((s, p) => s + p, 0) + libres.reduce((s, l) => s + l.precio, 0),
    [seleccion, libres],
  )
  const total = subtotal + propina
  const nSeleccionados = Object.keys(seleccion).length + libres.length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !guardando) onCerrar() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onCerrar, guardando])

  const alternar = (s: ProService) => {
    setError('')
    setSeleccion(prev => {
      const copia = { ...prev }
      if (s.id in copia) delete copia[s.id]
      else copia[s.id] = precioSugerido(s.price)
      return copia
    })
  }

  const guardar = async () => {
    const items: VentaItem[] = [
      ...Object.entries(seleccion).map(([id, precio]) => {
        const s = catalogo.find(x => x.id === id)
        return { service_id: id, nombre: s?.name ?? id, precio, cantidad: 1 }
      }),
      ...libres.filter(l => l.nombre.trim()).map(l => ({
        service_id: null, nombre: l.nombre.trim(), precio: l.precio, cantidad: 1,
      })),
    ].filter(i => i.precio > 0)

    if (!items.length) { setError('Elegí al menos un servicio y poné su monto'); return }

    setGuardando(true)
    setError('')
    try {
      await registrarCobro({
        businessId, arqueoId,
        barberoBusinessId: barbero,
        appointmentId: prefill.appointmentId ?? null,
        clienteNombre: cliente.trim() || null,
        items, propina, metodoPago: metodo, cobradoPor: userId,
      })
      onCobrado()
    } catch (e) {
      setError(
        e instanceof CitaYaCobradaError
          ? 'Esta cita ya fue cobrada. Actualizá la lista para ver el cobro.'
          : 'No se pudo registrar el cobro. Revisá la conexión e intentá de nuevo.',
      )
      setGuardando(false)
    }
  }

  const nombreCorto = (barberoSel?.shortName ?? barberoSel?.name ?? '').split(' ')[0]

  return (
    <div
      onClick={() => !guardando && onCerrar()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '26rem', maxHeight: '94dvh',
          background: 'var(--color-bg)', border: '1px solid var(--color-rim)',
          borderRadius: 'var(--r-xl)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Cabecera ── */}
        <header style={{
          padding: '1rem 1.15rem', borderBottom: '1px solid var(--color-rim)',
          background: 'var(--color-surface)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem',
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
              <span style={{ width: '.45rem', height: '.45rem', borderRadius: '50%', background: 'var(--color-gold)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1 }}>
                Nuevo cobro
              </span>
            </p>
            <p style={{ fontSize: '.64rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', marginTop: '.35rem' }}>
              {prefill.appointmentId ? 'Cita agendada' : 'Sin cita previa'}
            </p>
          </div>
          <button onClick={onCerrar} disabled={guardando} aria-label="Cerrar" style={{
            background: 'var(--color-surface2)', border: '1px solid var(--color-rim)',
            color: 'var(--color-ink-dim)', cursor: 'pointer',
            width: '2.1rem', height: '2.1rem', flexShrink: 0,
            display: 'grid', placeItems: 'center',
          }}><X size={16} /></button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

          {/* ── Barbero ── */}
          {barberos.length > 0 && (
            <section>
              <Rotulo>Barbero</Rotulo>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                padding: '.7rem .8rem', background: 'var(--color-surface)',
                border: '1px solid var(--color-rim)', borderRadius: 'var(--r-lg)',
              }}>
                <Avatar staff={barberoSel} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '.92rem', fontWeight: 600, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {barberoSel?.shortName ?? barberoSel?.name ?? 'Sin asignar'}
                  </p>
                  {barberoSel?.title && (
                    <p style={{ fontSize: '.68rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {barberoSel.title}
                    </p>
                  )}
                </div>
                {barberos.length > 1 && (
                  <button onClick={() => setCambiandoBarbero(v => !v)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.3rem', flexShrink: 0,
                    padding: '.4rem .7rem', background: 'var(--color-surface2)',
                    border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)',
                    fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    Cambiar
                    <ChevronDown size={12} style={{ transform: cambiandoBarbero ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                  </button>
                )}
              </div>

              {cambiandoBarbero && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.4rem', marginTop: '.4rem' }}>
                  {barberos.filter(b => b.businessId !== barbero).map(b => (
                    <button key={b.businessId}
                      onClick={() => { setBarbero(b.businessId); setCambiandoBarbero(false); setSeleccion({}) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '.5rem', textAlign: 'left',
                        padding: '.5rem .6rem', background: 'var(--color-surface)',
                        border: '1px solid var(--color-rim)', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', minWidth: 0,
                      }}>
                      <Avatar staff={b} chico />
                      <span style={{ fontSize: '.74rem', color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.shortName ?? b.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Cliente ── */}
          <section>
            <Rotulo extra="opcional">Cliente</Rotulo>
            <input value={cliente} onChange={e => setCliente(e.target.value)}
              placeholder="Nombre del cliente" style={input} />
          </section>

          {/* ── Servicios ── */}
          <section>
            <Rotulo extra={nSeleccionados ? `${nSeleccionados} seleccionado${nSeleccionados > 1 ? 's' : ''}` : undefined}>
              Servicios
            </Rotulo>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {catalogo.map(s => {
                const activo = s.id in seleccion
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: '.7rem',
                    padding: '.6rem .7rem',
                    background: activo ? 'var(--color-surface)' : 'transparent',
                    border: '1px solid var(--color-rim)',
                    borderLeft: `3px solid ${activo ? 'var(--color-gold)' : 'var(--color-rim)'}`,
                    borderRadius: 'var(--r-md)',
                  }}>
                    <button onClick={() => alternar(s)} aria-label={activo ? 'Quitar' : 'Agregar'} style={{
                      width: '1.5rem', height: '1.5rem', flexShrink: 0, display: 'grid', placeItems: 'center',
                      background: activo ? 'var(--color-gold)' : 'var(--color-surface2)',
                      border: `1px solid ${activo ? 'var(--color-gold)' : 'var(--color-rim-l)'}`,
                      color: activo ? 'var(--color-on-gold)' : 'var(--color-ink-ghost)',
                      cursor: 'pointer', padding: 0,
                    }}>
                      {activo ? <Check size={13} /> : <Plus size={13} />}
                    </button>

                    <button onClick={() => alternar(s)} style={{
                      flex: 1, minWidth: 0, textAlign: 'left', background: 'none',
                      border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>
                      <p style={{
                        fontSize: '.84rem', fontWeight: activo ? 600 : 400,
                        color: activo ? 'var(--color-ink)' : 'var(--color-ink-dim)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{s.name}</p>
                      {s.tag && (
                        <p style={{ fontSize: '.64rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
                          {s.tag}
                        </p>
                      )}
                    </button>

                    {activo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '.7rem', color: 'var(--color-ink-ghost)' }}>Bs</span>
                        <input
                          type="number" inputMode="decimal" min="0" step="1"
                          value={seleccion[s.id] || ''}
                          onChange={e => setSeleccion(p => ({ ...p, [s.id]: Number(e.target.value) || 0 }))}
                          style={{ ...input, width: '4.4rem', padding: '.4rem .5rem', textAlign: 'right', fontWeight: 600 }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', flexShrink: 0 }}>
                        {s.price ?? ''}
                      </span>
                    )}
                  </div>
                )
              })}

              {libres.map((l, i) => (
                <div key={l.id} style={{
                  display: 'flex', alignItems: 'center', gap: '.5rem',
                  padding: '.6rem .7rem', background: 'var(--color-surface)',
                  border: '1px solid var(--color-rim)',
                  borderLeft: '3px solid var(--color-gold)', borderRadius: 'var(--r-md)',
                }}>
                  <input value={l.nombre} placeholder="Concepto"
                    onChange={e => setLibres(p => p.map((x, n) => n === i ? { ...x, nombre: e.target.value } : x))}
                    style={{ ...input, flex: 1, minWidth: 0, padding: '.4rem .5rem' }} />
                  <input type="number" inputMode="decimal" min="0" step="1" placeholder="Bs"
                    value={l.precio || ''}
                    onChange={e => setLibres(p => p.map((x, n) => n === i ? { ...x, precio: Number(e.target.value) || 0 } : x))}
                    style={{ ...input, width: '4.4rem', padding: '.4rem .5rem', textAlign: 'right', fontWeight: 600 }} />
                  <button onClick={() => setLibres(p => p.filter((_, n) => n !== i))} aria-label="Quitar" style={{
                    background: 'none', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-ghost)',
                    cursor: 'pointer', width: '1.9rem', height: '1.9rem', flexShrink: 0, display: 'grid', placeItems: 'center',
                  }}><X size={13} /></button>
                </div>
              ))}

              <button
                onClick={() => setLibres(p => [...p, { id: `libre-${Date.now()}`, service_id: null, nombre: '', precio: 0, cantidad: 1, libre: true }])}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
                  padding: '.6rem', background: 'none', border: '1px dashed var(--color-rim-l)',
                  borderRadius: 'var(--r-md)', color: 'var(--color-gold)', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 600,
                  letterSpacing: '.1em', textTransform: 'uppercase',
                }}
              ><Plus size={13} /> Agregar ítem</button>
            </div>
          </section>

          {/* ── Propina ── */}
          <section>
            <Rotulo extra={nombreCorto ? `para ${nombreCorto}` : undefined}>Propina</Rotulo>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.35rem' }}>
              {PROPINAS_RAPIDAS.map(p => {
                const on = !propinaLibre && propina === p
                return (
                  <button key={p} onClick={() => { setPropina(p); setPropinaLibre(false) }} style={{
                    padding: '.6rem .3rem', borderRadius: 'var(--r-md)',
                    background: on ? 'var(--color-gold)' : 'var(--color-surface2)',
                    border: `1px solid ${on ? 'var(--color-gold)' : 'var(--color-rim-l)'}`,
                    color: on ? 'var(--color-on-gold)' : 'var(--color-ink-dim)',
                    fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 600,
                    cursor: 'pointer',
                  }}>{p === 0 ? 'Sin' : `Bs ${p}`}</button>
                )
              })}
              <button onClick={() => { setPropinaLibre(true); setPropina(0) }} style={{
                padding: '.6rem .3rem', borderRadius: 'var(--r-md)',
                background: propinaLibre ? 'var(--color-gold)' : 'var(--color-surface2)',
                border: `1px solid ${propinaLibre ? 'var(--color-gold)' : 'var(--color-rim-l)'}`,
                color: propinaLibre ? 'var(--color-on-gold)' : 'var(--color-ink-dim)',
                fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 600, cursor: 'pointer',
              }}>Otro</button>
            </div>
            {propinaLibre && (
              <input type="number" inputMode="decimal" min="0" step="1" autoFocus
                value={propina || ''} onChange={e => setPropina(Number(e.target.value) || 0)}
                placeholder="Monto de la propina"
                style={{ ...input, marginTop: '.4rem', textAlign: 'right' }} />
            )}
          </section>

          {/* ── Método de pago ── */}
          <section>
            <Rotulo>Método de pago</Rotulo>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem' }}>
              {METODOS.map(m => {
                const on = m.id === metodo
                const Icono = m.icono
                return (
                  <button key={m.id} onClick={() => setMetodo(m.id)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem',
                    padding: '.8rem .3rem', borderRadius: 'var(--r-md)',
                    background: on ? 'var(--color-gold-glow)' : 'var(--color-surface)',
                    border: `1px solid ${on ? 'var(--color-gold)' : 'var(--color-rim)'}`,
                    color: on ? 'var(--color-gold)' : 'var(--color-ink-dim)',
                    fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600,
                    letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
                    lineHeight: 1.3,
                  }}>
                    <Icono size={20} />
                    {m.label}
                  </button>
                )
              })}
            </div>

            {metodo === 'qr' && (
              qrUrl ? (
                <button onClick={() => setVerQr(true)} style={{
                  width: '100%', marginTop: '.5rem',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                  padding: '.8rem', borderRadius: 'var(--r-md)',
                  background: 'var(--color-surface2)', border: '1px solid var(--color-rim-l)',
                  color: 'var(--color-ink)', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 600,
                  letterSpacing: '.1em', textTransform: 'uppercase',
                }}>
                  <QrCode size={16} /> Mostrar QR de la barbería
                </button>
              ) : (
                <p style={{
                  marginTop: '.5rem', padding: '.7rem .85rem', borderRadius: 'var(--r-md)',
                  background: 'var(--color-surface)', border: '1px dashed var(--color-rim-l)',
                  fontSize: '.72rem', lineHeight: 1.5, color: 'var(--color-ink-ghost)',
                }}>
                  Todavía no hay un QR cargado. Se sube desde{' '}
                  <a href={`/${slug}/setup`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-gold)' }}>
                    Panel → Pagos
                  </a>.
                </p>
              )
            )}
          </section>

          {error && (
            <p role="alert" style={{ fontSize: '.78rem', lineHeight: 1.5, color: '#c47070', margin: 0 }}>{error}</p>
          )}
        </div>

        {/* ── Total y acción ── */}
        <footer style={{ padding: '1rem 1.15rem', borderTop: '1px solid var(--color-rim)', background: 'var(--color-surface)' }}>
          {propina > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.74rem', color: 'var(--color-ink-ghost)', marginBottom: '.3rem' }}>
              <span>Servicios {bs(subtotal)}</span>
              <span>Propina + {bs(propina)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.85rem' }}>
            <span style={{ fontSize: '.66rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
              Total a cobrar
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {bs(total)}
            </span>
          </div>
          <button onClick={guardar} disabled={guardando}
            style={{ ...btnPrimario('lg', guardando), width: '100%' }}>
            {guardando ? 'Registrando…' : 'Registrar cobro'}
          </button>
        </footer>
      </div>

      {verQr && qrUrl && <VisorQr url={qrUrl} total={total} onCerrar={() => setVerQr(false)} />}
    </div>
  )
}

/**
 * QR a pantalla completa para que el cliente lo escanee.
 * Fondo blanco sólido: sobre el tema oscuro los lectores fallan.
 */
function VisorQr({ url, total, onCerrar }: { url: string; total: number; onCerrar: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCerrar])

  return (
    <div
      onClick={e => { e.stopPropagation(); onCerrar() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300, background: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '1.5rem', padding: '1.5rem',
      }}
    >
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#555' }}>
        Escaneá para pagar
      </p>
      <img src={url} alt="QR de pago" style={{ width: 'min(78vw, 22rem)', height: 'auto', aspectRatio: '1', objectFit: 'contain' }} />
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 400, color: '#111', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {bs(total)}
      </p>
      <button onClick={e => { e.stopPropagation(); onCerrar() }} style={{
        display: 'inline-flex', alignItems: 'center', gap: '.5rem',
        padding: '.75rem 1.5rem', borderRadius: 'var(--r-md)',
        background: 'none', border: '1px solid #ccc', color: '#555', cursor: 'pointer',
        fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 600,
        letterSpacing: '.1em', textTransform: 'uppercase',
      }}>
        <X size={14} /> Cerrar
      </button>
    </div>
  )
}

/* ── Piezas ───────────────────────────────────────────────── */

function Rotulo({ children, extra }: { children: React.ReactNode; extra?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem', marginBottom: '.5rem' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '.64rem', fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
        {children}
      </span>
      {extra && (
        <span style={{ fontSize: '.64rem', color: 'var(--color-ink-ghost)' }}>{extra}</span>
      )}
    </div>
  )
}

function Avatar({ staff, chico }: { staff: StaffMember | null; chico?: boolean }) {
  const lado = chico ? '1.6rem' : '2.4rem'
  if (staff?.photo) {
    return <img src={staff.photo} alt="" style={{ width: lado, height: lado, flexShrink: 0, objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--color-rim-l)' }} />
  }
  return (
    <div style={{
      width: lado, height: lado, flexShrink: 0, borderRadius: '50%',
      background: 'var(--color-surface2)', border: '1px solid var(--color-rim-l)',
      display: 'grid', placeItems: 'center',
      fontSize: chico ? '.6rem' : '.8rem', color: 'var(--color-ink-ghost)', fontWeight: 600,
    }}>
      {(staff?.shortName ?? staff?.name ?? '?').charAt(0).toUpperCase()}
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '.7rem .85rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rim-l)',
  borderRadius: 'var(--r-md)',
  color: 'var(--color-ink)',
  fontFamily: 'var(--font-body)',
  fontSize: '16px', // evita el zoom de iOS al enfocar
}
