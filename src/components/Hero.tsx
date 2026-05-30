import { useProfessional } from '../context/ProfessionalContext'

export default function Hero() {
  const pro = useProfessional()
  const parts = pro.name.split(' ')
  const first = parts.slice(0, -1).join(' ')
  const last  = parts[parts.length - 1]

  return (
    <section id="inicio" className="hero-pad"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' }}
    >
      {/* Watermark — hidden on mobile */}
      <div className="hidden md:block" style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 'clamp(8rem,18vw,18rem)', fontWeight: 300, lineHeight: 1,
        color: 'transparent',
        WebkitTextStroke: '1px var(--watermark-stroke, rgba(196,153,90,.07))',
        whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
        letterSpacing: '-.02em',
      }}>{pro.title}</div>

      {/* Vertical line — desktop only */}
      <div className="hidden lg:block" style={{
        position: 'absolute', top: 0, right: '22%', width: 1, height: '100%',
        background: 'linear-gradient(to bottom, transparent, var(--color-rim) 25%, var(--color-rim) 75%, transparent)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '52rem' }}>
        {/* Eyebrow */}
        <div className="animate-fade-up" style={{ animationDelay: '.2s', display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '2rem', height: 1, background: 'var(--color-gold)', opacity: .6, flexShrink: 0 }} />
          <span style={{ fontSize: '.65rem', fontWeight: 300, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)' }}>
            {pro.title} — {pro.location}
          </span>
        </div>

        {/* Name */}
        <h1 className="animate-fade-up" style={{
          animationDelay: '.4s',
          fontSize: 'clamp(2.75rem, 8vw, 6.5rem)',
          fontWeight: 300, letterSpacing: '-.025em', lineHeight: .92,
          marginBottom: '.2em',
        }}>
          {first}<br />
          <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>{last}</em>
        </h1>

        {/* Specialty */}
        <p className="animate-fade-up" style={{ animationDelay: '.6s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(.9rem, 2vw, 1.35rem)', fontWeight: 300, color: 'var(--color-ink-dim)', marginBottom: '2rem' }}>
          {pro.specialty}
        </p>

        {/* Quote */}
        <p className="animate-fade-up" style={{ animationDelay: '.75s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.2rem, 2.5vw, 2.2rem)', fontWeight: 300, lineHeight: 1.45, maxWidth: '28rem', marginBottom: '2.5rem' }}>
          {pro.tagline}
          <span style={{ display: 'block', color: 'var(--color-ink-dim)', fontSize: '88%' }}>{pro.taglineSub}</span>
        </p>

        {/* CTAs */}
        <div className="animate-fade-up" style={{ animationDelay: '.9s', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#citas"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.65rem', padding: '.85rem 1.75rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background .3s, transform .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-gold-l)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-gold)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Reservar Cita
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M7 1l3 3.5L7 8M1 4.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </a>
          <a href="#servicios"
            style={{ display: 'inline-flex', alignItems: 'center', padding: '.85rem 1.75rem', background: 'transparent', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 300, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', border: '1px solid var(--color-rim-l)', transition: 'color .3s, border-color .3s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
          >Ver Servicios</a>
        </div>
      </div>

      {/* Stats — lg only */}
      <div className="animate-fade-in hidden lg:flex" style={{ animationDelay: '1.2s', position: 'absolute', right: '4.5rem', bottom: '7rem', flexDirection: 'column', gap: '2rem', zIndex: 2 }}>
        {pro.stats.map(s => (
          <div key={s.label} style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 300, color: 'var(--color-gold)', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', marginTop: '.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scroll hint — hidden on mobile */}
      <div className="animate-fade-in hidden md:flex" style={{ animationDelay: '1.4s', position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', flexDirection: 'column', alignItems: 'center', gap: '.4rem' }}>
        <div className="animate-scroll-bob" style={{ width: 1, height: '3rem', background: 'linear-gradient(to bottom, var(--color-gold), transparent)' }} />
        <span style={{ fontSize: '.58rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>Scroll</span>
      </div>
    </section>
  )
}
