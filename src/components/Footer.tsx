import { useProfessional } from '../context/ProfessionalContext'
import { useOpenBooking }  from '../context/BookingDialogContext'

export default function Footer() {
  const pro = useProfessional()
  const openBooking = useOpenBooking()

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
          <a href={`tel:+${pro.phone}`} style={{ display: 'block', fontSize: '.84rem', color: 'var(--color-ink-dim)', textDecoration: 'none', lineHeight: 1.8 }}>+{pro.phone}</a>
          <a href={`mailto:${pro.email}`} style={{ display: 'block', fontSize: '.84rem', color: 'var(--color-ink-dim)', textDecoration: 'none' }}>{pro.email}</a>
        </div>

        {/* Schedule */}
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.35rem' }}>Horario</p>
          {pro.schedule.map(s => <p key={s} style={{ fontSize: '.84rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>{s}</p>)}
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
      <div style={{ borderTop: '1px solid var(--color-rim)', paddingTop: '1.1rem' }}>
        <p style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)' }}>© 2026 {pro.name} — {pro.location}</p>
      </div>

    </footer>
  )
}
