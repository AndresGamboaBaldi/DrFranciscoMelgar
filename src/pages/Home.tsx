import { Link } from 'react-router-dom'
import { PROFESSIONALS } from '../data/professionals'

/**
 * Simple home page that lists all registered professionals.
 * Replace this with a real landing page when ready.
 */
export default function Home() {
  const pros = Object.values(PROFESSIONALS)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
      <p style={{ fontSize: '.65rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1rem' }}>Plaza</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,6vw,5rem)', fontWeight: 300, color: 'var(--color-ink)', marginBottom: '.5rem', letterSpacing: '-.02em' }}>
        Reserva tu <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>cita</em>
      </h1>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--color-ink-dim)', marginBottom: '4rem' }}>
        Selecciona un profesional
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 1, background: 'var(--color-rim)', width: '100%', maxWidth: '56rem' }}>
        {pros.map(pro => (
          <Link key={pro.slug} to={`/${pro.slug}`} style={{ textDecoration: 'none' }}>
            <div
              style={{ background: 'var(--color-surface)', padding: '2.5rem 2rem', transition: 'background .3s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface)')}
            >
              <p style={{ fontSize: '.62rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.6rem' }}>{pro.title}</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.5rem' }}>{pro.name}</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--color-ink-dim)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{pro.specialty}</p>
              <p style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)', letterSpacing: '.05em' }}>{pro.location}</p>
              <div style={{ marginTop: '1.5rem', fontSize: '.7rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-gold)' }}>
                Ver perfil →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
