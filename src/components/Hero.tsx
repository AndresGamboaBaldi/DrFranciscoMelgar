import { useProfessional } from '../context/ProfessionalContext'
import { useOpenBooking }  from '../context/BookingDialogContext'

export default function Hero() {
  const pro = useProfessional()
  const openBooking = useOpenBooking()

  const parts = pro.name.split(' ')
  const first = parts.slice(0, -1).join(' ')
  const last  = parts[parts.length - 1]

  return (
    <section id="inicio" className="hero-pad"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' }}
    >
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
          <span style={{ fontSize: '.75rem', fontWeight: 500, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-gold)' }}>
            {pro.title} — {pro.location}
          </span>
        </div>

        {/* Name */}
        <h1 className="animate-fade-up" style={{
          animationDelay: '.4s',
          fontSize: 'clamp(2.75rem, 7.5vw, 6.5rem)',
          fontWeight: 300, letterSpacing: '-.025em', lineHeight: .92,
          marginBottom: '.25em',
        }}>
          {first}<br />
          <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>{last}</em>
        </h1>

        {/* Specialty */}
        <p className="animate-fade-up" style={{ animationDelay: '.6s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.1rem,2.2vw,1.55rem)', fontWeight: 300, color: 'var(--color-ink)', marginBottom: '2rem' }}>
          {pro.specialty}
        </p>

        {/* Quote */}
        <p className="animate-fade-up" style={{ animationDelay: '.75s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.4rem,3vw,2.5rem)', fontWeight: 300, lineHeight: 1.4, maxWidth: '30rem', marginBottom: '2.5rem', color: 'var(--color-ink)' }}>
          {pro.tagline}
          <span style={{ display: 'block', color: 'var(--color-ink-dim)', fontSize: '90%' }}>{pro.taglineSub}</span>
        </p>

        {/* CTAs */}
        <div className="animate-fade-up" style={{ animationDelay: '.9s', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={openBooking}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.65rem', padding: '.85rem 1.75rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.84rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s, transform .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-gold-l)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-gold)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Reservar Cita
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M7 1l3 3.5L7 8M1 4.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </button>
          <a href="#servicios"
            style={{ display: 'inline-flex', alignItems: 'center', padding: '.85rem 1.75rem', background: 'transparent', color: 'var(--color-ink)', fontFamily: 'var(--font-body)', fontSize: '.84rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', border: '1.5px solid var(--color-ink-dim)', transition: 'border-color .3s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-ink)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-ink-dim)')}
          >Ver Servicios</a>
        </div>
      </div>

      {/* Stats — desktop only */}
      <div className="animate-fade-in hidden lg:flex" style={{ animationDelay: '1.2s', position: 'absolute', right: '4.5rem', bottom: '6rem', flexDirection: 'column', gap: '2rem', zIndex: 2 }}>
        {pro.stats.map(s => (
          <div key={s.label} style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem,4vw,4rem)', fontWeight: 300, color: 'var(--color-gold)', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: '.82rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink)', fontWeight: 400, marginTop: '.35rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="animate-fade-in hidden md:flex" style={{ animationDelay: '1.4s', position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', flexDirection: 'column', alignItems: 'center', gap: '.4rem' }}>
        <div className="animate-scroll-bob" style={{ width: 1, height: '3rem', background: 'linear-gradient(to bottom, var(--color-gold), transparent)' }} />
        <span style={{ fontSize: '.58rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>Scroll</span>
      </div>
    </section>
  )
}
