import { useEffect } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { useOpenBooking }  from '../context/BookingDialogContext'

export default function Footer() {
  const pro = useProfessional()
  const openBooking = useOpenBooking()

  const GOLD   = '#c4995a'

  // Load Playfair Display for the Probo.pro brand mark
  useEffect(() => {
    const id = 'gf-playfair-display'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&display=swap'
    document.head.appendChild(link)
  }, [])

  return (
    <footer id="contacto" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-rim)', padding: 'clamp(2rem,4vw,3rem) clamp(1.25rem,4vw,4.5rem)' }}>

      {/* ── Single row on desktop, stacked on mobile ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem 3rem',
        marginBottom: '1.5rem',
      }}>

        {/* Identity */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1 }}>
            {pro.name}
          </div>
          <div style={{ fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', marginTop: '.25rem' }}>
            {pro.title}
          </div>
        </div>

        {/* Address */}
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.35rem' }}>Dirección</p>
          <p style={{ fontSize: '.84rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{pro.address}</p>
        </div>

        {/* Contact */}
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.35rem' }}>Contacto</p>
          <a href={`tel:+${pro.phone}`} style={{ display: 'block', fontSize: '.84rem', color: 'var(--color-ink-dim)', textDecoration: 'none' }}>+{pro.phone}</a>
        </div>

        {/* CTA */}
        <div style={{ flexShrink: 0 }}>
          <button onClick={openBooking}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.7rem 1.4rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-l)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
          >Reservar Cita</button>
        </div>

      </div>

      {/* Copyright */}
      <div style={{ borderTop: '1px solid var(--color-rim)', paddingTop: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <p style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)' }}>© 2026 Probo.pro — Reservas online para profesionales en Bolivia</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--color-ink-ghost)' }}>
          Pro<em style={{ fontStyle: 'italic', color: GOLD }}>bo</em>.pro
        </p>
      </div>

    </footer>
  )
}
