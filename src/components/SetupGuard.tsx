/**
 * SetupGuard — protege el panel /setup.
 *
 * Pide la contraseña configurada (del profesional, o del miembro del staff
 * cuando se accede a /:slug/setup/:staffId) y guarda un flag en localStorage
 * para no pedirla de nuevo en esta sesión.
 */
import { useState, useEffect } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { useStaff } from '../context/StaffContext'

const SESSION_KEY_PREFIX = 'probo_setup_unlocked_'

export default function SetupGuard({ children }: { children: React.ReactNode }) {
  const pro = useProfessional()
  const staff = useStaff()
  const businessId    = staff?.businessId    ?? pro.businessId
  const setupPassword = staff?.setupPassword ?? pro.setupPassword
  const displayName   = staff?.shortName ?? staff?.name ?? pro.shortName ?? pro.name
  const sessionKey = SESSION_KEY_PREFIX + businessId

  const [checking, setChecking]   = useState(true)
  const [unlocked, setUnlocked]   = useState(false)
  const [password, setPassword]   = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]         = useState('')

  // PWA — use the professional's name for the home screen icon title instead of "Probo.pro"
  useEffect(() => {
    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }
    document.title = displayName
    setMeta('apple-mobile-web-app-title', displayName)
  }, [displayName])

  // 1. Check existing unlock (password session) or magic-link key on mount
  useEffect(() => {
    let active = true
    function check() {
      if (localStorage.getItem(sessionKey) === '1') {
        if (active) { setUnlocked(true); setChecking(false) }
        return
      }
      // Magic link: ?key=<setupPassword> auto-unlocks and persists
      const urlKey = new URLSearchParams(window.location.search).get('key')
      if (urlKey && setupPassword && urlKey === setupPassword) {
        localStorage.setItem(sessionKey, '1')
        // NOTE: we deliberately keep ?key=... in the URL (don't strip it).
        // If the professional adds this page to their home screen, the saved
        // shortcut keeps the key, so the app can re-auth on every launch even
        // if iOS clears localStorage for the standalone PWA.
        if (active) { setUnlocked(true); setChecking(false) }
        return
      }
      if (active) setChecking(false)
    }
    check()
    return () => { active = false }
  }, [sessionKey, setupPassword])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!setupPassword) {
      setError('Este profesional no tiene contraseña configurada.')
      return
    }
    if (password === setupPassword) {
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
          {displayName}
        </h1>
        <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Inicia sesión para administrar tu pagina.
        </p>

        {(
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} autoFocus
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                style={{ width: '100%', padding: '.85rem 2.75rem .85rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink)', fontFamily: 'var(--font-body)', fontSize: '16px', textAlign: 'center' }}
                className="no-native-reveal" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: '2.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--color-ink-ghost)', cursor: 'pointer' }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="21" x2="21" y2="3"/></svg>
                )}
              </button>
            </div>
            {error && <p style={{ fontSize: '.78rem', color: '#c47070', margin: 0 }}>{error}</p>}
            <button type="submit"
              style={{ padding: '.85rem 1.5rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
              Entrar
            </button>
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
