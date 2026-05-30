import { useProfessional } from '../context/ProfessionalContext'

export default function Hero() {
  const pro = useProfessional()
  const parts = pro.name.split(' ')
  const first = parts.slice(0, -1).join(' ')
  const last  = parts[parts.length - 1]

  return (
    <section id="inicio" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 4.5rem 7rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(10rem,22vw,20rem)', fontWeight: 300, lineHeight: 1, color: 'transparent', WebkitTextStroke: '1px rgba(196,153,90,.07)', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', letterSpacing: '-.02em' }}>
        {pro.title}
      </div>
      <div style={{ position: 'absolute', top: 0, right: '22%', width: 1, height: '100%', background: 'linear-gradient(to bottom, transparent, var(--color-rim) 25%, var(--color-rim) 75%, transparent)' }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="animate-fade-up" style={{ animationDelay: '.2s', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{ width: '2.5rem', height: 1, background: 'var(--color-gold)', opacity: .5, flexShrink: 0 }} />
          <span style={{ fontSize: '.68rem', fontWeight: 300, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)' }}>
            {pro.title} — {pro.location}
          </span>
        </div>

        <h1 className="animate-fade-up" style={{ animationDelay: '.4s', fontSize: 'clamp(3.5rem,7.5vw,7rem)', fontWeight: 300, letterSpacing: '-.025em', lineHeight: .95, marginBottom: '.25em' }}>
          {first}<br />
          <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>{last}</em>
        </h1>

        <p className="animate-fade-up" style={{ animationDelay: '.6s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1rem,2vw,1.5rem)', fontWeight: 300, color: 'var(--color-ink-dim)', marginBottom: '3rem' }}>
          {pro.specialty}
        </p>

        <p className="animate-fade-up" style={{ animationDelay: '.8s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 300, lineHeight: 1.4, maxWidth: '30rem', marginBottom: '3.5rem' }}>
          {pro.tagline}
          <span style={{ display: 'block', color: 'var(--color-ink-dim)', fontSize: '85%' }}>{pro.taglineSub}</span>
        </p>

        <div className="animate-fade-up" style={{ animationDelay: '1s', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#citas" style={{ display: 'inline-flex', alignItems: 'center', gap: '.7rem', padding: '.85rem 2rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background .3s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-l)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
          >Reservar Cita <Arrow /></a>
          <a href="#servicios" style={{ display: 'inline-flex', alignItems: 'center', gap: '.7rem', padding: '.85rem 2rem', background: 'transparent', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 300, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', border: '1px solid var(--color-rim-l)', transition: 'color .3s, border-color .3s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
          >Ver Servicios</a>
        </div>
      </div>

      <div className="animate-fade-in hidden md:flex" style={{ animationDelay: '1.3s', position: 'absolute', right: '4.5rem', bottom: '7rem', flexDirection: 'column', gap: '2rem', zIndex: 2 }}>
        {pro.stats.map(s => (
          <div key={s.label} style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--color-gold)', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', marginTop: '.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '1.5s', position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem' }}>
        <div className="animate-scroll-bob" style={{ width: 1, height: '3.5rem', background: 'linear-gradient(to bottom, var(--color-gold), transparent)' }} />
        <span style={{ fontSize: '.62rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>Scroll</span>
      </div>
    </section>
  )
}

function Arrow() {
  return <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M7.5 1l3.5 3.5L7.5 8M1 4.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
}
