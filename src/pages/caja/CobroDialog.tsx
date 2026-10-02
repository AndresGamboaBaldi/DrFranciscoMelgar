import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Plus, QrCode, Banknote, CreditCard, ChevronDown } from 'lucide-react'
import { bs } from './cajaTheme'
import { btnPrimario } from '../../lib/panelUI'
import { registrarCobro, CitaYaCobradaError, ErrorCobro, type MetodoPago, type VentaItem } from '../../lib/pos/cobros'
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
  businessId, arqueoId, userId, barberos, servicios, qrUrl, prefill, onCerrar, onCobrado,
}: Props) {
  const [verQr, setVerQr] = useState(false)
  const [barbero, setBarbero] = useState(
    prefill.barberoBusinessId ?? barberos[0]?.businessId ?? businessId,
  )
  const [cambiandoBarbero, setCambiandoBarbero] = useState(false)
  const [eligiendo, setEligiendo] = useState(false)
  const [cliente, setCliente] = useState(prefill.clienteNombre ?? '')

  const barberoSel = barberos.find(b => b.businessId === barbero) ?? null
  // Un barbero puede tener catálogo propio; si no, usa el del negocio.
  const catalogo = barberoSel?.services ?? servicios

  // El servicio principal: viene de la cita si coincide con el catálogo.
  const [servicioId, setServicioId] = useState<string>(() => {
    const base = barberos.find(b => b.businessId === (prefill.barberoBusinessId ?? ''))?.services ?? servicios
    const coincide = prefill.servicioNombre
      ? base.find(s => s.name.toLowerCase() === prefill.servicioNombre!.toLowerCase())
      : null
    return coincide?.id ?? ''
  })
  const [servicioPrecio, setServicioPrecio] = useState(() => {
    const base = barberos.find(b => b.businessId === (prefill.barberoBusinessId ?? ''))?.services ?? servicios
    const coincide = prefill.servicioNombre
      ? base.find(s => s.name.toLowerCase() === prefill.servicioNombre!.toLowerCase())
      : null
    return coincide ? precioSugerido(coincide.price) : 0
  })

  // Extras: lo que se suma al servicio principal, o el servicio de la cita
  // cuando no figura en el catálogo.
  const [libres, setLibres] = useState<Linea[]>(() =>
    prefill.servicioNombre && !servicios.some(s => s.name.toLowerCase() === prefill.servicioNombre!.toLowerCase())
      ? [{ id: 'libre-0', service_id: null, nombre: prefill.servicioNombre, precio: 0, cantidad: 1, libre: true }]
      : [],
  )

  const [propina, setPropina] = useState(0)
  const [propinaLibre, setPropinaLibre] = useState(false)
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Al revelarse, el campo de propina libre nace fuera de vista. Lo acercamos
  // en vez de obligar a scrollear. 'nearest' mueve lo mínimo necesario.
  //
  // Sin 'smooth' a propósito: una animación de ~300ms mueve los botones debajo
  // del dedo entre el toque y el clic, y terminás activando el de al lado.
  const propinaRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (!propinaLibre) return
    const id = requestAnimationFrame(() => {
      propinaRef.current?.scrollIntoView({ block: 'nearest' })
    })
    return () => cancelAnimationFrame(id)
  }, [propinaLibre])

  const subtotal = useMemo(
    () => servicioPrecio + libres.reduce((s, l) => s + l.precio, 0),
    [servicioPrecio, libres],
  )
  const total = subtotal + propina

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !guardando) onCerrar() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onCerrar, guardando])

  /** Al elegir del picker se precarga el precio de lista; la cajera lo ajusta. */
  const elegirServicio = (id: string) => {
    setError('')
    setServicioId(id)
    const s = catalogo.find(x => x.id === id)
    setServicioPrecio(s ? precioSugerido(s.price) : 0)
  }

  const servicioSel = catalogo.find(s => s.id === servicioId) ?? null

  const guardar = async () => {
    const items: VentaItem[] = [
      ...(servicioSel
        ? [{ service_id: servicioSel.id, nombre: servicioSel.name, precio: servicioPrecio, cantidad: 1 }]
        : []),
      ...libres.filter(l => l.nombre.trim()).map(l => ({
        service_id: null, nombre: l.nombre.trim(), precio: l.precio, cantidad: 1,
      })),
    ].filter(i => i.precio > 0)

    if (!items.length) { setError('Elegí un servicio y poné su monto'); return }

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
          : e instanceof ErrorCobro
            ? e.explicacion
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
          width: '100%', maxWidth: '26rem',
          // Alto FIJO, no maxHeight: el diálogo está centrado, así que si crece
          // o se encoge se desplaza media diferencia. Eso movía los botones
          // entre el toque y el clic — al colapsar la lista de servicios o al
          // aparecer el botón de QR — y terminabas activando el de arriba.
          // Con alto fijo, todo cambio lo absorbe el área que scrollea.
          height: 'min(94dvh, 42rem)',
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

        {/* minHeight:0 es necesario: el mínimo por defecto de un flex item es
            el de su contenido, y sin esto el área desborda en vez de scrollear. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

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
                      onClick={() => {
                        setBarbero(b.businessId)
                        setCambiandoBarbero(false)
                        // Si el barbero nuevo tiene catálogo propio, el servicio
                        // elegido puede no existir ahí: se limpia la selección.
                        const nuevoCat = b.services ?? servicios
                        if (servicioId && !nuevoCat.some(s => s.id === servicioId)) {
                          setServicioId('')
                          setServicioPrecio(0)
                        }
                      }}
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
            <Rotulo extra={servicioSel?.tag}>Servicio</Rotulo>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>

              {/* Un solo servicio. Mismo patrón que el bloque del barbero:
                  la fila elegida, y "Cambiar" despliega el catálogo debajo. */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.6rem',
                padding: '.65rem .75rem', background: 'var(--color-surface)',
                border: '1px solid var(--color-rim)',
                borderLeft: `3px solid ${servicioSel ? 'var(--color-gold)' : 'var(--color-rim)'}`,
                borderRadius: 'var(--r-md)',
              }}>
                <button onClick={() => setEligiendo(v => !v)} style={{
                  flex: 1, minWidth: 0, textAlign: 'left', background: 'none',
                  border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>
                  <p style={{
                    fontSize: '.86rem', fontWeight: servicioSel ? 600 : 400,
                    color: servicioSel ? 'var(--color-ink)' : 'var(--color-ink-ghost)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {servicioSel?.name ?? 'Elegí un servicio'}
                  </p>
                  <p style={{
                    fontSize: '.64rem', letterSpacing: '.1em', textTransform: 'uppercase',
                    color: 'var(--color-ink-ghost)', marginTop: '.1rem',
                  }}>
                    {servicioSel?.tag ?? 'Tocá para elegir'}
                  </p>
                </button>

                {/* Sin chevron: tocar la fila ya abre y cierra la lista. */}
                {servicioSel && (
                  <button
                    onClick={() => { setServicioId(''); setServicioPrecio(0); setEligiendo(false) }}
                    aria-label="Quitar servicio" title="Quitar servicio"
                    style={{ ...btnIcono, color: 'var(--color-ink-ghost)' }}
                  >
                    <X size={14} />
                  </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '.7rem', color: 'var(--color-ink-ghost)' }}>Bs</span>
                  <input
                    type="number" inputMode="decimal" min="0" step="1"
                    value={servicioPrecio || ''}
                    onChange={e => setServicioPrecio(Number(e.target.value) || 0)}
                    disabled={!servicioSel}
                    placeholder="0"
                    style={{
                      ...input, width: '4.2rem', padding: '.45rem .5rem',
                      textAlign: 'right', fontWeight: 600, opacity: servicioSel ? 1 : .45,
                    }}
                  />
                </div>
              </div>

              {eligiendo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', marginBottom: '.2rem' }}>
                  {catalogo.map(s => {
                    const on = s.id === servicioId
                    return (
                      <button key={s.id}
                        onClick={() => { elegirServicio(s.id); setEligiendo(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '.7rem', width: '100%',
                          padding: '.55rem .7rem', textAlign: 'left', cursor: 'pointer',
                          background: on ? 'var(--color-gold-glow)' : 'var(--color-surface)',
                          border: `1px solid ${on ? 'var(--color-gold)' : 'var(--color-rim)'}`,
                          borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)',
                        }}>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{
                            display: 'block', fontSize: '.82rem',
                            color: on ? 'var(--color-gold)' : 'var(--color-ink-dim)',
                            fontWeight: on ? 600 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{s.name}</span>
                          {s.tag && (
                            <span style={{ display: 'block', fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
                              {s.tag}
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', flexShrink: 0 }}>
                          {s.price ?? ''}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

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
              ><Plus size={13} /> Agregar extra</button>
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
              <input ref={propinaRef} type="number" inputMode="decimal" min="0" step="1" autoFocus
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

            {metodo === 'qr' && !qrUrl && (
              <p style={{
                marginTop: '.5rem', padding: '.7rem .85rem', borderRadius: 'var(--r-md)',
                background: 'var(--color-surface)', border: '1px dashed var(--color-rim-l)',
                fontSize: '.72rem', lineHeight: 1.5, color: 'var(--color-ink-ghost)',
              }}>
                Todavía no hay un QR cargado. El dueño puede subirlo desde la
                pestaña <strong style={{ color: 'var(--color-ink-dim)' }}>Ajustes</strong>.
              </p>
            )}
          </section>

          {error && (
            <p role="alert" style={{ fontSize: '.78rem', lineHeight: 1.5, color: '#c47070', margin: 0 }}>{error}</p>
          )}
        </div>

        {/* ── Total y acción ── */}
        <footer style={{ padding: '1rem 1.15rem', borderTop: '1px solid var(--color-rim)', background: 'var(--color-surface)' }}>
          {/* El QR vive en el pie y no en la sección de pago: ahí quedaba
              debajo del pliegue y había que volver a scrollear para verlo. */}
          {metodo === 'qr' && qrUrl && (
            <button onClick={() => setVerQr(true)} style={{
              width: '100%', marginBottom: '.75rem',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              padding: '.75rem', borderRadius: 'var(--r-md)',
              background: 'var(--color-surface2)', border: '1px solid var(--color-rim-l)',
              color: 'var(--color-ink)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 600,
              letterSpacing: '.1em', textTransform: 'uppercase',
            }}>
              <QrCode size={15} /> Mostrar QR al cliente
            </button>
          )}
          {/* Siempre presente, aunque la propina sea 0: si apareciera al elegir
              propina, el pie crecería y empujaría los botones de arriba justo
              mientras los estás tocando. */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.74rem', color: 'var(--color-ink-ghost)', marginBottom: '.3rem', minHeight: '1.1rem' }}>
            <span>Servicios {bs(subtotal)}</span>
            <span>{propina > 0 ? `Propina + ${bs(propina)}` : ''}</span>
          </div>
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

const btnIcono: React.CSSProperties = {
  width: '1.8rem',
  height: '1.8rem',
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  background: 'var(--color-surface2)',
  border: '1px solid var(--color-rim-l)',
  color: 'var(--color-ink-dim)',
  cursor: 'pointer',
  padding: 0,
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
