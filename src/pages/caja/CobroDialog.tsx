import { useState, useEffect, useMemo } from 'react'
import { bs } from './cajaTheme'
import { btnPrimario, chip } from '../../lib/panelUI'
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
  /** Catálogo de nombres — los montos los pone la cajera. */
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
    if (!validos.length) { setError('Carga al menos un servicio con su monto'); return }

    setGuardando(true)
    setError('')
    try {
      await registrarCobro({
        businessId, arqueoId,
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
          ? 'Esta cita ya fue cobrada. Actualiza la lista para ver el cobro.'
          : 'No se pudo registrar el cobro. Revisa la conexión e intenta de nuevo.',
      )
      setGuardando(false)
    }
  }

  return (
    <div
      onClick={() => !guardando && onCerrar()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '26rem', maxHeight: '92dvh',
          background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
          borderRadius: 'var(--r-xl)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <header style={{
          padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-rim)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1 }}>
            Nuevo cobro
          </h2>
          <button onClick={onCerrar} disabled={guardando} aria-label="Cerrar" style={{
            background: 'none', border: 'none', color: 'var(--color-ink-ghost)',
            cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, padding: '0 .2rem',
          }}>×</button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Campo label="Cliente">
            <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Opcional" style={input} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: '.35rem' }}>
                  <input
                    list="caja-servicios" value={it.nombre}
                    onChange={e => setItem(i, { nombre: e.target.value })}
                    placeholder="Servicio" style={{ ...input, flex: 1, minWidth: 0 }}
                  />
                  <input
                    type="number" inputMode="decimal" min="0" step="1"
                    value={it.precio || ''} onChange={e => setItem(i, { precio: Number(e.target.value) || 0 })}
                    placeholder="Bs" style={{ ...input, width: '5.5rem', textAlign: 'right' }}
                  />
                  {items.length > 1 && (
                    <button onClick={() => setItems(prev => prev.filter((_, n) => n !== i))} aria-label="Quitar" style={{
                      background: 'none', border: '1px solid var(--color-rim-l)',
                      color: 'var(--color-ink-ghost)', cursor: 'pointer', width: '2.4rem', flexShrink: 0,
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
                  alignSelf: 'flex-start', background: 'none', border: 'none', padding: '.2rem 0',
                  color: 'var(--color-gold)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  fontSize: '.68rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase',
                }}
              >+ Agregar servicio</button>
            </div>
          </Campo>

          <Campo label="Propina">
            <input type="number" inputMode="decimal" min="0" step="1"
              value={propina || ''} onChange={e => setPropina(Number(e.target.value) || 0)}
              placeholder="0" style={{ ...input, width: '7rem', textAlign: 'right' }} />
          </Campo>

          <Campo label="Método de pago">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.35rem' }}>
              {METODOS.map(m => {
                const on = m.id === metodo
                return (
                  <button key={m.id} onClick={() => setMetodo(m.id)} style={{
                    ...chip(on), padding: '.6rem .3rem', fontSize: '.64rem',
                    letterSpacing: '.06em', whiteSpace: 'normal', lineHeight: 1.25,
                  }}>{m.label}</button>
                )
              })}
            </div>
          </Campo>

          {error && (
            <p role="alert" style={{ fontSize: '.78rem', lineHeight: 1.5, color: '#c47070', margin: 0 }}>{error}</p>
          )}
        </div>

        <footer style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-rim)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.85rem' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>
              Total
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {bs(total)}
            </span>
          </div>
          <button onClick={guardar} disabled={guardando}
            style={{ ...btnPrimario('lg', guardando), width: '100%' }}>
            {guardando ? 'Registrando…' : 'Registrar cobro'}
          </button>
        </footer>
      </div>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: '.62rem', fontWeight: 500,
        letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)',
      }}>{label}</span>
      {children}
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '.75rem .9rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rim-l)',
  borderRadius: 'var(--r-md)',
  color: 'var(--color-ink)',
  fontFamily: 'var(--font-body)',
  fontSize: '16px', // evita el zoom de iOS al enfocar
}
