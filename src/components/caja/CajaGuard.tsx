import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { getAcceso, signIn, signOut, onAuthChange, type PosUsuario, type PosAccesoError } from '../../lib/pos/auth'
import { CAJA_VARS } from '../../pages/caja/cajaTheme'

const MENSAJES: Record<PosAccesoError, { titulo: string; detalle: string }> = {
  'sin-cuenta': {
    titulo: 'Sin acceso a la caja',
    detalle: 'Tu cuenta existe pero no está habilitada para ningún negocio. Pedile al dueño que te dé de alta.',
  },
  'otro-negocio': {
    titulo: 'Caja equivocada',
    detalle: 'Tu cuenta pertenece a otro negocio. Entrá por el enlace de tu propia caja.',
  },
  inactiva: {
    titulo: 'Cuenta desactivada',
    detalle: 'El dueño desactivó este acceso. Si creés que es un error, hablá con él.',
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
    const r = await getAcceso(businessId)
    if (!r) {
      setUsuario(null)
      setRechazo(null)
    } else if ('error' in r) {
      setUsuario(null)
      setRechazo(r.error)
    } else {
      setUsuario(r.usuario)
      setRechazo(null)
    }
    setVerificando(false)
  }, [businessId])

  useEffect(() => { revisar() }, [revisar])
  useEffect(() => onAuthChange(revisar), [revisar])

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Completá correo y contraseña'); return }
    setEnviando(true)
    setError('')
    const err = await signIn(email, password)
    if (err) setError(err)
    // Si salió bien, onAuthChange dispara revisar() y el guard se abre solo.
    setEnviando(false)
  }

  if (verificando) {
    return (
      <div style={{ ...CAJA_VARS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '2rem', height: '2rem', borderRadius: '50%',
          border: '2px solid var(--caja-rim)', borderTopColor: 'var(--caja-accent)',
          animation: 'caja-spin .7s linear infinite',
        }} />
        <style>{'@keyframes caja-spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    )
  }

  if (usuario) return <>{children(usuario)}</>

  const msg = rechazo ? MENSAJES[rechazo] : null

  return (
    <div style={{ ...CAJA_VARS, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '22rem' }}>
        <div style={{
          background: 'var(--caja-surface)', border: '1px solid var(--caja-rim)',
          borderRadius: '10px', padding: '2rem 1.6rem',
        }}>
          <p style={{
            margin: 0, fontSize: '.68rem', fontWeight: 600, letterSpacing: '.18em',
            textTransform: 'uppercase', color: 'var(--caja-accent)', textAlign: 'center',
          }}>Caja</p>
          <h1 style={{
            margin: '.45rem 0 1.6rem', fontSize: '1.35rem', fontWeight: 600,
            color: 'var(--caja-ink)', textAlign: 'center', lineHeight: 1.2,
          }}>{nombreNegocio}</h1>

          {msg ? (
            <>
              <div style={{
                border: '1px solid var(--caja-rim-l)', borderLeft: '3px solid var(--caja-warn)',
                background: 'rgba(224,163,65,.07)', borderRadius: '6px',
                padding: '.9rem 1rem', marginBottom: '1.2rem',
              }}>
                <p style={{ margin: 0, fontSize: '.85rem', fontWeight: 600, color: 'var(--caja-ink)' }}>{msg.titulo}</p>
                <p style={{ margin: '.35rem 0 0', fontSize: '.8rem', lineHeight: 1.55, color: 'var(--caja-ink-dim)' }}>{msg.detalle}</p>
              </div>
              <button onClick={async () => { await signOut(); setRechazo(null) }} style={botonSecundario}>
                Entrar con otra cuenta
              </button>
            </>
          ) : (
            <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              <input
                type="email" value={email} autoFocus autoComplete="username"
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="Correo" style={input}
              />
              <div style={{ position: 'relative' }}>
                <input
                  type={verClave ? 'text' : 'password'} value={password} autoComplete="current-password"
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Contraseña" style={{ ...input, paddingRight: '2.9rem' }}
                  className="no-native-reveal"
                />
                <button
                  type="button" onClick={() => setVerClave(v => !v)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{
                    position: 'absolute', top: 0, right: 0, height: '100%', width: '2.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: 'none', color: 'var(--caja-ink-ghost)', cursor: 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
                    {!verClave && <line x1="3" y1="21" x2="21" y2="3" />}
                  </svg>
                </button>
              </div>

              {error && (
                <p role="alert" style={{ margin: 0, fontSize: '.78rem', color: 'var(--caja-danger)' }}>{error}</p>
              )}

              <button type="submit" disabled={enviando} style={{ ...botonPrimario, opacity: enviando ? .6 : 1 }}>
                {enviando ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.4rem' }}>
          <a href={`/${slug}`} style={{
            fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase',
            color: 'var(--caja-ink-ghost)', textDecoration: 'none',
          }}>← Volver a la página</a>
        </div>
      </div>
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '.85rem 1rem',
  background: 'var(--caja-bg)',
  border: '1px solid var(--caja-rim-l)',
  borderRadius: '6px',
  color: 'var(--caja-ink)',
  // 16px evita que iOS haga zoom al enfocar el campo
  fontSize: '16px',
  fontFamily: 'inherit',
}

const botonPrimario: React.CSSProperties = {
  padding: '.9rem 1.5rem',
  background: 'var(--caja-accent)',
  color: '#06231a',
  border: 'none',
  borderRadius: '6px',
  fontFamily: 'inherit',
  fontSize: '.8rem',
  fontWeight: 600,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const botonSecundario: React.CSSProperties = {
  width: '100%',
  padding: '.85rem 1.5rem',
  background: 'none',
  color: 'var(--caja-ink-dim)',
  border: '1px solid var(--caja-rim-l)',
  borderRadius: '6px',
  fontFamily: 'inherit',
  fontSize: '.78rem',
  cursor: 'pointer',
}
