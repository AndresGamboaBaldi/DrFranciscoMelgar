import { useEffect, useState } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { useOpenBooking }  from '../context/BookingDialogContext'

export default function Navbar() {
  const pro = useProfessional()
  const openBooking = useOpenBooking()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isLight = pro.theme?.mode === 'light'

  const navBg = scrolled
    ? 'var(--color-nav-scrolled, rgba(10,9,7,.93))'
    : isLight ? 'rgba(250,250,248,0.82)' : 'transparent'

  const parts = pro.shortName.split(' ')
  const first = parts.slice(0, -1).join(' ')
  const last  = parts[parts.length - 1]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      /* Desktop: generous padding. Mobile: tighter */
      padding: scrolled
        ? 'clamp(.8rem, 1.5vw, 1rem) clamp(1.25rem, 4vw, 3.5rem)'
        : 'clamp(1rem, 2vw, 1.5rem) clamp(1.25rem, 4vw, 3.5rem)',
      background: navBg,
      backdropFilter: (scrolled || isLight) ? 'blur(16px)' : 'none',
      borderBottom: scrolled
        ? isLight ? '1px solid var(--color-rim)' : '1px solid rgba(255,255,255,.1)'
        : isLight ? '1px solid rgba(229,224,213,.4)' : '1px solid transparent',
      transition: 'padding .4s cubic-bezier(0.16,1,0.3,1), background .4s, border-color .4s',
    }}>

      {/* ── Logo / Name ── */}
      <a href="#inicio" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
        {/* Logo — shown if available, alongside the name */}
        {pro.logo && (
          <img
            src={pro.logo}
            alt={pro.shortName}
            style={{ height: 'clamp(26px, 3.5vw, 38px)', width: 'auto', objectFit: 'contain', display: 'block', flexShrink: 0 }}
          />
        )}
        {/* Name — always shown */}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.6rem, 4vw, 1.85rem)',
          fontWeight: 400,
          letterSpacing: '.04em',
          color: 'var(--color-ink)',
          lineHeight: 1,
          textShadow: !scrolled && !isLight ? '0 1px 12px rgba(0,0,0,.7)' : 'none',
        }}>
          {first}{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>{last}</em>
        </span>
      </a>

      {/* ── CTA Button — more generous on desktop ── */}
      <button onClick={openBooking}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(.7rem, 1.2vw, .82rem)',
          fontWeight: 400,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: 'var(--color-bg)',
          background: 'var(--color-gold)',
          padding: 'clamp(.5rem, 1vw, .65rem) clamp(1rem, 2.5vw, 1.75rem)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background .3s, transform .2s',
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-gold-l)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-gold)'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        Reservar Cita
      </button>
    </nav>
  )
}
