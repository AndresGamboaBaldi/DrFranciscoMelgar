import { useEffect, useState } from 'react'
import { useProfessional } from '../context/ProfessionalContext'

export default function Navbar() {
  const pro = useProfessional()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isLight = pro.theme?.mode === 'light'
  const parts = pro.shortName.split(' ')
  const first = parts.slice(0, -1).join(' ')
  const last  = parts[parts.length - 1]

  // Light mode: always show a soft background so the logo is readable against the light hero
  const navBg = scrolled
    ? 'var(--color-nav-scrolled, rgba(10,9,7,.93))'
    : isLight
      ? 'rgba(250,250,248,0.82)'
      : 'transparent'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: scrolled ? '0.85rem 1.25rem' : '1.25rem 1.25rem',
      background: navBg,
      backdropFilter: (scrolled || isLight) ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--color-rim)' : isLight ? '1px solid rgba(229,224,213,0.4)' : '1px solid transparent',
      transition: 'padding .4s cubic-bezier(0.16,1,0.3,1), background .4s, border-color .4s',
    }}>
      <a href="#inicio" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '.06em', color: 'var(--color-ink)', textDecoration: 'none', lineHeight: 1 }}>
        {first} <span style={{ color: 'var(--color-gold)' }}>{last}</span>
      </a>

      <a href="#citas"
        style={{ fontSize: '.68rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-bg)', background: 'var(--color-gold)', padding: '.5rem 1.1rem', textDecoration: 'none', transition: 'background .3s', whiteSpace: 'nowrap', lineHeight: 1 }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-l)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
      >Reservar</a>
    </nav>
  )
}
