/**
 * SetupGuard — protege el panel /setup.
 *
 * El ?key= de la URL se valida contra la Edge Function verify-setup-key,
 * que compara contra el hash en DB. Nunca se compara en el cliente.
 * El token resultante se guarda en localStorage para no pedir la clave de nuevo.
 */
import { useState, useEffect } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { useStaff } from '../context/StaffContext'

const TOKEN_PREFIX = 'probo_setup_token_'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const FUNCTIONS_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:54321/functions/v1'
  : `${SUPABASE_URL}/functions/v1`

async function verifyKey(businessId: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/verify-setup-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId, password }),
    })
    if (!res.ok) return null
    const { token } = await res.json()
    return token ?? null
  } catch {
    return null
  }
}

function isTokenValid(token: string, businessId: string): boolean {
  try {
    const decoded = atob(token)
    const [id, expiry] = decoded.split(':')
    return id === businessId && Number(expiry) > Date.now()
  } catch {
    return false
  }
}

export default function SetupGuard({ children }: { children: React.ReactNode }) {
  const pro   = useProfessional()
  const staff = useStaff()
  const businessId  = staff?.businessId ?? pro.businessId
  const displayName = staff?.shortName ?? staff?.name ?? pro.shortName ?? pro.name
  const tokenKey    = TOKEN_PREFIX + businessId

  const [checking, setChecking]         = useState(true)
  const [unlocked, setUnlocked]         = useState(false)
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  // PWA — use the professional's name for the home screen icon title
  useEffect(() => {
    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', name); document.head.appendChild(tag) }
      tag.setAttribute('content', content)
    }
    document.title = displayName
    setMeta('apple-mobile-web-app-title', displayName)
  }, [displayName])

  // Check existing token or ?key= magic link on mount
  useEffect(() => {
    let active = true
    async function check() {
      // 1. Valid token already saved?
      const saved = localStorage.getItem(tokenKey)
      if (saved && isTokenValid(saved, businessId)) {
        if (active) { setUnlocked(true); setChecking(false) }
        return
      }
      // 2. Magic link ?key= in URL — validate server-side
      const urlKey = new URLSearchParams(window.location.search).get('key')
      if (urlKey) {
        const token = await verifyKey(businessId, urlKey)
        if (active && token) {
          localStorage.setItem(tokenKey, token)
          setUnlocked(true)
          setChecking(false)
          return
        }
      }
      if (active) setChecking(false)
    }
    check()
    return () => { active = false }
  }, [businessId, tokenKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const token = await verifyKey(businessId, password)
    setLoading(false)
    if (token) {
      localStorage.setItem(tokenKey, token)
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
        <p style={{ fontWeight: 500, fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.5rem' }}>Panel Admin</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.5rem' }}>
          {displayName}
        </h1>
        <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Inicia sesión para administrar tu página.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
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
          <button type="submit" disabled={loading}
            style={{ padding: '.85rem 1.5rem', background: loading ? 'var(--color-rim-l)' : 'var(--color-gold)', color: loading ? 'var(--color-ink-ghost)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </form>

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
