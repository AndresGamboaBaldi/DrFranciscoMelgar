import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { btnPrimario, btnSecundario } from '../../lib/panelUI'
import { getAcceso, signIn, signOut, onAuthChange, type PosUsuario, type PosAccesoError } from '../../lib/pos/auth'

const MENSAJES: Record<PosAccesoError, { titulo: string; detalle: string }> = {
  'sin-cuenta': {
    titulo: 'Sin acceso a la caja',
    detalle: 'Tu cuenta existe pero no está habilitada para ningún negocio. Pídele al dueño que te dé de alta.',
  },
  'otro-negocio': {
    titulo: 'Caja equivocada',
    detalle: 'Tu cuenta pertenece a otro negocio. Entra por el enlace de tu propia caja.',
  },
  inactiva: {
    titulo: 'Cuenta desactivada',
    detalle: 'El dueño desactivó este acceso. Si crees que es un error, habla con él.',
  },
  'error-red': {
    titulo: 'No se pudo verificar tu acceso',
    detalle: 'La conexión tardó demasiado. Revisa el internet del local y volvé a intentar.',
  },
}

interface Props {
  businessId: string
  nombreNegocio: string
  slug: string
  children: (usuario: PosUsuario) => ReactNode
}

export default function CajaGuard({ businessId, nombreNegocio, slug, children }: Props) {
  const [verificando, setVerificando] = useState(true)
  const [usuario, setUsuario] = useState<PosUsuario | null>(null)
  const [rechazo, setRechazo] = useState<PosAccesoError | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const revisar = useCallback(async () => {
    try {
      const r = await getAcceso(businessId)
      if (!r) { setUsuario(null); setRechazo(null) }
      else if ('error' in r) { setUsuario(null); setRechazo(r.error) }
      else { setUsuario(r.usuario); setRechazo(null) }
    } catch {
      setUsuario(null)
      setRechazo('error-red')
    } finally {
      // En finally sí o sí: si esto no corre, la pantalla queda cargando para siempre.
      setVerificando(false)
    }
  }, [businessId])

  useEffect(() => { revisar() }, [revisar])
  useEffect(() => onAuthChange(revisar), [revisar])

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Completa correo y contraseña'); return }
    setEnviando(true)
    setError('')
    const err = await signIn(email, password)
    if (err) { setError(err); setEnviando(false) }
    // Si salió bien, onAuthChange dispara revisar() y el guard se abre solo.
  }

  // Skeleton con la forma real de la caja (cabecera, pestañas, tarjetas):
  // da idea de lo que viene en vez de un spinner que no dice nada.
  if (verificando) {
    return (
      <div className="panel-shell" style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-rim)', padding: '.85rem clamp(1rem,4vw,2.5rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '2rem', width: '7rem' }} />
          <div className="skeleton" style={{ height: '2rem', width: '5rem', animationDelay: '80ms' }} />
        </header>

        <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-rim)', padding: '0 clamp(1rem,4vw,2.5rem)', display: 'flex', gap: '1.5rem', height: '2.9rem', alignItems: 'center' }}>
          {['4rem', '5.5rem', '4.5rem'].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: '.75rem', width: w, animationDelay: `${i * 60}ms` }} />
          ))}
        </div>

        <main style={{ flex: 1, padding: 'clamp(1.5rem,3vw,2.5rem) clamp(1rem,4vw,2.5rem)' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <div className="skeleton" style={{ height: '2.8rem', width: '12rem', marginBottom: '.75rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.5rem', marginBottom: '.75rem' }}>
              <div className="skeleton" style={{ height: '5rem' }} />
              <div className="skeleton" style={{ height: '5rem', animationDelay: '60ms' }} />
            </div>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton" style={{ height: '5rem', animationDelay: `${120 + i * 80}ms` }} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (usuario) return <>{children(usuario)}</>

  const msg = rechazo ? MENSAJES[rechazo] : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '380px', width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-rim)', borderRadius: 'var(--r-lg)', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 500, fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.5rem' }}>
          Caja
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.5rem' }}>
          {nombreNegocio}
        </h1>

        {msg ? (
          <>
            <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '.4rem', marginTop: '1.25rem', fontWeight: 500 }}>
              {msg.titulo}
            </p>
            <p style={{ fontSize: '.8rem', color: 'var(--color-ink-ghost)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              {msg.detalle}
            </p>
            {rechazo === 'error-red' ? (
              // Es un fallo de red, no de permisos: cerrar sesión no arregla nada.
              <button onClick={() => { setRechazo(null); setVerificando(true); revisar() }}
                style={{ ...btnPrimario('md'), width: '100%' }}>
                Reintentar
              </button>
            ) : (
              <button onClick={async () => { await signOut(); setRechazo(null) }}
                style={{ ...btnSecundario('md'), width: '100%' }}>
                Entrar con otra cuenta
              </button>
            )}
          </>
        ) : (
          <>
            <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '2rem' }}>
              Inicia sesión para registrar cobros.
            </p>
            <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
              <input
                type="email" value={email} autoFocus autoComplete="username"
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="Correo" style={input}
              />
              <div style={{ position: 'relative' }}>
                <input
                  type={verClave ? 'text' : 'password'} value={password} autoComplete="current-password"
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Contraseña"
                  style={{ ...input, padding: '.85rem 2.75rem .85rem 1rem' }}
                  className="no-native-reveal"
                />
                <button
                  type="button" onClick={() => setVerClave(v => !v)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{
                    position: 'absolute', top: 0, right: 0, height: '100%', width: '2.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: 'none', color: 'var(--color-ink-ghost)', cursor: 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
                    {!verClave && <line x1="3" y1="21" x2="21" y2="3" />}
                  </svg>
                </button>
              </div>

              {error && <p role="alert" style={{ fontSize: '.78rem', color: '#c47070', margin: 0 }}>{error}</p>}

              <button type="submit" disabled={enviando}
                style={{ ...btnPrimario('md', enviando), width: '100%' }}>
                {enviando ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </>
        )}

        <a href={`/${slug}`} style={{
          display: 'inline-block', marginTop: '1.75rem', fontSize: '.72rem',
          letterSpacing: '.08em', textTransform: 'uppercase',
          color: 'var(--color-ink-ghost)', textDecoration: 'none',
        }}>← Volver a la página</a>
      </div>
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '.85rem 1rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rim-l)',
  borderRadius: 'var(--r-md)',
  color: 'var(--color-ink)',
  fontFamily: 'var(--font-body)',
  fontSize: '16px', // evita el zoom de iOS al enfocar
  textAlign: 'center',
}


