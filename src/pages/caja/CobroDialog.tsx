import { useState, useEffect, useMemo } from 'react'
import { bs } from './cajaTheme'
import { METODOS, registrarCobro, CitaYaCobradaError, type MetodoPago, type VentaItem } from '../../lib/pos/cobros'
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
  /** Barberos del negocio. Si está vacío, se cobra al negocio mismo. */
  barberos: StaffMember[]
  /** Catálogo de nombres — los precios los pone la cajera. */
  servicios: ProService[]
  prefill: CobroPrefill
  onCerrar: () => void
  onCobrado: () => void
}

export default function CobroDialog({
  businessId, arqueoId, userId, barberos, servicios, prefill, onCerrar, onCobrado,
}: Props) {
  const [cliente, setCliente] = useState(prefill.clienteNombre ?? '')
  const [barbero, setBarbero] = useState(
    prefill.barberoBusinessId ?? barberos[0]?.businessId ?? businessId,
  )
  const [items, setItems] = useState<VentaItem[]>(() =>
    prefill.servicioNombre
      ? [{ service_id: prefill.servicioId ?? null, nombre: prefill.servicioNombre, precio: 0, cantidad: 1 }]
      : [{ service_id: null, nombre: '', precio: 0, cantidad: 1 }],
  )
  const [propina, setPropina] = useState(0)
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.precio * i.cantidad, 0), [items])
  const total = subtotal + propina

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !guardando) onCerrar() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onCerrar, guardando])

  const setItem = (i: number, patch: Partial<VentaItem>) =>
    setItems(prev => prev.map((it, n) => (n === i ? { ...it, ...patch } : it)))

  const guardar = async () => {
    const validos = items.filter(i => i.nombre.trim() && i.precio > 0)
    if (!validos.length) { setError('Cargá al menos un servicio con su monto'); return }

    setGuardando(true)
    setError('')
    try {
      await registrarCobro({
        businessId,
        arqueoId,
        barberoBusinessId: barbero,
        appointmentId: prefill.appointmentId ?? null,
        clienteNombre: cliente.trim() || null,
        items: validos,
        propina,
        metodoPago: metodo,
        cobradoPor: userId,
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

  return (
    <div
      onClick={() => !guardando && onCerrar()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.72)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '30rem', maxHeight: '92vh',
          background: 'var(--caja-surface)', border: '1px solid var(--caja-rim)',
          borderRadius: '14px 14px 0 0', display: 'flex', flexDirection: 'column',
        }}
      >
        <header style={{
          padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--caja-rim)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Nuevo cobro</h2>
          <button onClick={onCerrar} disabled={guardando} aria-label="Cerrar" style={{
            background: 'none', border: 'none', color: 'var(--caja-ink-ghost)',
            cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '0 .2rem',
          }}>×</button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <Campo label="Cliente">
            <input value={cliente} onChange={e => setCliente(e.target.value)}
              placeholder="Opcional" style={input} />
          </Campo>

          {barberos.length > 0 && (
            <Campo label="Atendió">
              <select value={barbero} onChange={e => setBarbero(e.target.value)} style={input}>
                {barberos.map(b => (
                  <option key={b.businessId} value={b.businessId}>{b.shortName ?? b.name}</option>
                ))}
              </select>
            </Campo>
          )}

          <Campo label="Servicios">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: '.4rem' }}>
                  <input
                    list="caja-servicios"
                    value={it.nombre}
                    onChange={e => setItem(i, { nombre: e.target.value })}
                    placeholder="Servicio"
                    style={{ ...input, flex: 1, minWidth: 0 }}
                  />
                  <input
                    type="number" inputMode="decimal" min="0" step="1"
                    value={it.precio || ''}
                    onChange={e => setItem(i, { precio: Number(e.target.value) || 0 })}
                    placeholder="Bs"
                    style={{ ...input, width: '5.5rem', textAlign: 'right' }}
                  />
                  {items.length > 1 && (
                    <button onClick={() => setItems(prev => prev.filter((_, n) => n !== i))}
                      aria-label="Quitar" style={{
                        background: 'none', border: '1px solid var(--caja-rim-l)', borderRadius: '6px',
                        color: 'var(--caja-ink-ghost)', cursor: 'pointer', width: '2.4rem', flexShrink: 0,
                      }}>×</button>
                  )}
                </div>
              ))}
              <datalist id="caja-servicios">
                {servicios.map(s => <option key={s.id} value={s.name} />)}
              </datalist>
              <button
                onClick={() => setItems(prev => [...prev, { service_id: null, nombre: '', precio: 0, cantidad: 1 }])}
                style={{
                  alignSelf: 'flex-start', background: 'none', border: 'none',
                  color: 'var(--caja-accent-l)', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '.8rem', padding: '.2rem 0',
                }}
              >+ Agregar otro servicio</button>
            </div>
          </Campo>

          <Campo label="Propina">
            <input type="number" inputMode="decimal" min="0" step="1"
              value={propina || ''} onChange={e => setPropina(Number(e.target.value) || 0)}
              placeholder="0" style={{ ...input, width: '7rem', textAlign: 'right' }} />
          </Campo>

          <Campo label="Método de pago">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem' }}>
              {METODOS.map(m => {
                const on = m.id === metodo
                return (
                  <button key={m.id} onClick={() => setMetodo(m.id)} style={{
                    padding: '.7rem .4rem', borderRadius: '8px', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '.74rem', fontWeight: on ? 600 : 500,
                    background: on ? 'var(--caja-accent)' : 'transparent',
                    color: on ? '#fff' : 'var(--caja-ink-dim)',
                    border: `1px solid ${on ? 'var(--caja-accent)' : 'var(--caja-rim-l)'}`,
                  }}>{m.label}</button>
                )
              })}
            </div>
          </Campo>

          {error && (
            <p role="alert" style={{
              margin: 0, fontSize: '.8rem', lineHeight: 1.5, color: 'var(--caja-danger)',
              background: 'rgba(216,106,82,.08)', border: '1px solid rgba(216,106,82,.3)',
              borderRadius: '6px', padding: '.7rem .85rem',
            }}>{error}</p>
          )}
        </div>

        <footer style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--caja-rim)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.85rem' }}>
            <span style={{ fontSize: '.72rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--caja-ink-ghost)' }}>Total</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{bs(total)}</span>
          </div>
          <button onClick={guardar} disabled={guardando} style={{
            width: '100%', padding: '.95rem', borderRadius: '8px', border: 'none',
            background: guardando ? 'var(--caja-accent-d)' : 'var(--caja-accent)',
            color: '#fff', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 600,
            letterSpacing: '.06em', textTransform: 'uppercase',
            cursor: guardando ? 'not-allowed' : 'pointer',
          }}>{guardando ? 'Registrando…' : 'Registrar cobro'}</button>
        </footer>
      </div>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
      <span style={{
        fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em',
        textTransform: 'uppercase', color: 'var(--caja-ink-ghost)',
      }}>{label}</span>
      {children}
    </div>
  )
}

const input: React.CSSProperties = {
  padding: '.75rem .85rem',
  background: 'var(--caja-bg)',
  border: '1px solid var(--caja-rim-l)',
  borderRadius: '7px',
  color: 'var(--caja-ink)',
  fontSize: '16px', // evita el zoom de iOS al enfocar
  fontFamily: 'inherit',
  width: '100%',
}
