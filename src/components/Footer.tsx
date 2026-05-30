import { useProfessional } from '../context/ProfessionalContext'
import { useOpenBooking }  from '../context/BookingDialogContext'

export default function Footer() {
  const pro = useProfessional()
  const openBooking = useOpenBooking()

  return (
    <footer id="contacto" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-rim)', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '52rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Identity */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.3rem' }}>
              {pro.name}
            </div>
            <div style={{ fontSize: '.84rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>
              {pro.title}
            </div>
          </div>

          {/* Reservar CTA */}
          <button onClick={openBooking}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.75rem 1.5rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s', alignSelf: 'flex-start' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-l)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
          >Reservar Cita</button>
        </div>

        {/* Contact info */}
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '.72rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.5rem' }}>Dirección</p>
            <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{pro.address}</p>
          </div>
          <div>
            <p style={{ fontSize: '.72rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.5rem' }}>Contacto</p>
            <a href={`tel:+${pro.phone}`} style={{ display: 'block', fontSize: '.9rem', color: 'var(--color-ink-dim)', textDecoration: 'none', lineHeight: 1.9 }}>+{pro.phone}</a>
            <a href={`mailto:${pro.email}`} style={{ display: 'block', fontSize: '.9rem', color: 'var(--color-ink-dim)', textDecoration: 'none' }}>{pro.email}</a>
          </div>
          <div>
            <p style={{ fontSize: '.72rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.5rem' }}>Horario</p>
            {pro.schedule.map(s => <p key={s} style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>{s}</p>)}
          </div>
        </div>

        {/* Copyright */}
        <div style={{ borderTop: '1px solid var(--color-rim)', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: '.7rem', color: 'var(--color-ink-ghost)' }}>© 2026 {pro.name} — {pro.location}</p>
        </div>
      </div>
    </footer>
  )
}
