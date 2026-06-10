/**
 * SetupGuard — protege el panel ?setup.
 *
 * Dos formas de entrar:
 *   1. "Continuar con Google" → Supabase Auth OAuth, valida que el email
 *      coincida con `pro.ownerEmail`.
 *   2. "Contraseña" → pide la contraseña configurada en `pro.setupPassword`
 *      y guarda un flag en localStorage para no pedirla de nuevo en esta sesión.
 */
import { useState, useEffect } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { supabase } from '../lib/supabase'

const SESSION_KEY_PREFIX = 'probo_setup_unlocked_'

export default function SetupGuard({ children }: { children: React.ReactNode }) {
  const pro = useProfessional()
  const sessionKey = SESSION_KEY_PREFIX + pro.businessId

  const [checking, setChecking]   = useState(true)
  const [unlocked, setUnlocked]   = useState(false)
  const SHOW_GOOGLE = false
  const [mode, setMode]           = useState<'choose' | 'password'>(SHOW_GOOGLE ? 'choose' : 'password')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [googleBusy, setGoogleBusy] = useState(false)

  // 1. Check existing unlock (password session) or Google session on mount
  useEffect(() => {
    let active = true
    async function check() {
      if (localStorage.getItem(sessionKey) === '1') {
        if (active) { setUnlocked(true); setChecking(false) }
        return
      }
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        const email = data.session?.user?.email
        if (email && pro.ownerEmail && email.toLowerCase() === pro.ownerEmail.toLowerCase()) {
          if (active) { setUnlocked(true); setChecking(false) }
          return
        }
      }
      if (active) setChecking(false)
    }
    check()
    return () => { active = false }
  }, [sessionKey, pro.ownerEmail])

  const handleGoogle = async () => {
    if (!supabase) return
    setGoogleBusy(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
    // browser redirects away — nothing else to do here
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!pro.setupPassword) {
      setError('Este profesional no tiene contraseña configurada.')
      return
    }
    if (password === pro.setupPassword) {
      localStorage.setItem(sessionKey, '1')
      // Reset iOS zoom after input focus
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1')
        setTimeout(() => viewport.setAttribute('content', 'width=device-width, initial-scale=1'), 100)
      }
      setUnlocked(true)
    } else {
      setError('Contraseña incorrecta')
    }
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
        Verificando acceso…
      </div>
    )
  }

  if (unlocked) return <>{children}</>

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '380px', width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontWeight:500, fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.5rem' }}>Panel Admin</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.5rem' }}>
          {pro.shortName ?? pro.name}
        </h1>
        <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Inicia sesión para administrar tu pagina.
        </p>

        {SHOW_GOOGLE && mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
            <button onClick={handleGoogle} disabled={googleBusy}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem', padding: '.85rem 1.5rem', background: '#fff', color: '#333', fontFamily: 'var(--font-body)', fontSize: '.8rem', fontWeight: 500, border: '1px solid var(--color-rim-l)', cursor: googleBusy ? 'not-allowed' : 'pointer', opacity: googleBusy ? .6 : 1 }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.69 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
              Continuar con Google
            </button>
            <button onClick={() => { setMode('password'); setError('') }}
              style={{ padding: '.85rem 1.5rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
              Contraseña
            </button>
          </div>
        )}

        {(!SHOW_GOOGLE || mode === 'password') && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
            <input type="password" value={password} autoFocus
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              style={{ padding: '.85rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink)', fontFamily: 'var(--font-body)', fontSize: '16px', textAlign: 'center' }} />
            {error && <p style={{ fontSize: '.78rem', color: '#c47070', margin: 0 }}>{error}</p>}
            <button type="submit"
              style={{ padding: '.85rem 1.5rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
              Entrar
            </button>
            {SHOW_GOOGLE && (
              <button type="button" onClick={() => { setMode('choose'); setError(''); setPassword('') }}
                style={{ padding: '.6rem', background: 'none', color: 'var(--color-ink-ghost)', fontFamily: 'var(--font-body)', fontSize: '.72rem', border: 'none', cursor: 'pointer' }}>
                ← Volver
              </button>
            )}
          </form>
        )}

        <a href={`/${pro.slug}`}
          style={{ display: 'inline-block', marginTop: '1.75rem', fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink-dim)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-ghost)')}
        >
          ← Volver a la página
        </a>
      </div>
    </div>
  )
}
