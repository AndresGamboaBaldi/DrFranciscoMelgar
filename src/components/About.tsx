import Reveal from './Reveal'
import { useProfessional } from '../context/ProfessionalContext'

export default function About() {
  const pro = useProfessional()

  return (
    <section id="nosotros" className="s-pad" style={{ position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '4rem', alignItems: 'center' }}>

        {/* Image */}
        <Reveal>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '100%', paddingBottom: '110%', background: 'var(--color-surface2)', position: 'relative', overflow: 'hidden', maxHeight: '520px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(140deg, transparent 55%, var(--color-gold-glow, rgba(196,153,90,.09)))' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.75rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-ink-ghost)', opacity: .4 }}>◇</span>
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.9rem', color: 'var(--color-ink-ghost)', opacity: .5 }}>Foto</span>
              </div>
            </div>

            {/* Decorative borders — desktop only */}
            <div className="hidden md:block" style={{ position: 'absolute', bottom: '-1.5rem', right: '-1.5rem', width: '8rem', height: '8rem', border: '1px solid var(--color-rim)', zIndex: -1 }} />
            <div className="hidden md:block" style={{ position: 'absolute', top: '-1rem', left: '-1rem', width: '4.5rem', height: '4.5rem', background: 'var(--color-gold)', opacity: .07, zIndex: -1 }} />

            {/* Badge */}
            <div style={{
              position: 'absolute', bottom: '2rem',
              right: 'clamp(0px, 5vw, -3rem)',
              // On mobile stays inside, on desktop floats right
              background: 'var(--color-bg)', border: '1px solid var(--color-rim-l)',
              padding: '1rem 1.5rem', zIndex: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--color-gold)', lineHeight: 1, marginBottom: '.2rem' }}>{pro.stats[0]?.n}</div>
              <div style={{ fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>{pro.stats[0]?.label}</div>
            </div>
          </div>
        </Reveal>

        {/* Content */}
        <div>
<Reveal delay={100}>
            <h2 className="s-title" style={{ marginBottom: '1.75rem' }}>
              Acerca de<br /><em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>{pro.aboutTitle}</em>
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.15rem,2vw,1.6rem)', fontWeight: 300, lineHeight: 1.55, color: 'var(--color-ink)', marginBottom: '1.5rem' }}>
              "{pro.quote}"
            </p>
          </Reveal>

          <Reveal delay={300}>
            <p style={{ fontSize: '.86rem', lineHeight: 1.95, color: 'var(--color-ink-dim)', marginBottom: '2rem' }}>{pro.bio}</p>
          </Reveal>

          <Reveal delay={400}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))', gap: 1, background: 'var(--color-rim)', marginBottom: '2rem' }}>
              {pro.credentials.map(c => (
                <div key={c.label} style={{ background: 'var(--color-bg)', padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.3rem' }}>{c.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', color: 'var(--color-ink)' }}>{c.value}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={500}>
            <a href="#citas"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.65rem', padding: '.85rem 1.75rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background .3s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-l)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
            >
              Agendar Consulta
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M7 1l3 3.5L7 8M1 4.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
