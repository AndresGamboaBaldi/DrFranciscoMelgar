import { useProfessional } from '../context/ProfessionalContext'
import { useOpenBooking }  from '../context/BookingDialogContext'

export default function Hero() {
  const pro = useProfessional()
  const openBooking = useOpenBooking()
  const hasPhoto = !!pro.heroPhoto

  const parts = pro.name.split(' ')
  const first = parts.slice(0, -1).join(' ')
  const last  = parts[parts.length - 1]

  return (
    <section
      id="inicio"
      className={hasPhoto ? 'hero-has-photo' : ''}
      style={{
        display: 'grid',
        gridTemplateColumns: hasPhoto ? 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' : '1fr',
        position: 'relative',
      }}
    >
      {/* ── LEFT: content (untouched) ── */}
      <div
        className="hero-pad hero-content-col flex flex-col justify-end md:justify-center"
        style={{ position: 'relative', zIndex: 2 }}
      >
        {/* Vertical line — only when no photo */}
        {!hasPhoto && (
          <div className="hidden lg:block" style={{
            position: 'absolute', top: 0, right: '22%', width: 1, height: '100%',
            background: 'linear-gradient(to bottom, transparent, var(--color-rim) 25%, var(--color-rim) 75%, transparent)',
          }} />
        )}

        {/* Mobile background image + overlay — hidden on desktop */}
        {hasPhoto && (
          <div className="block md:hidden" style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
            <img src={pro.heroPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.90) 0%, rgba(0,0,0,.60) 55%, rgba(0,0,0,.40) 100%)' }} />
          </div>
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '52rem' }}>
          <div className="animate-fade-up" style={{ animationDelay: '.2s', display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '2rem', height: 1, background: 'var(--color-gold)', opacity: .6, flexShrink: 0 }} />
            <span style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-gold)', textShadow: '0 1px 8px rgba(0,0,0,.8)' }}>
              {pro.title} — {pro.location}
            </span>
          </div>

          <h1 className="animate-fade-up" style={{
            animationDelay: '.4s',
            fontSize: 'clamp(2.75rem, 7.5vw, 6.5rem)',
            fontWeight: 300, letterSpacing: '-.025em', lineHeight: .92,
            marginBottom: '.25em',
            color: 'var(--color-ink)',
          }}>
            {first}<br />
            <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>{last}</em>
          </h1>

          <p className="animate-fade-up" style={{ animationDelay: '.6s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.1rem,2.2vw,1.55rem)', fontWeight: 300, color: 'var(--color-ink)', marginBottom: '2rem' }}>
            {pro.specialty}
          </p>

          <p className="animate-fade-up" style={{ animationDelay: '.75s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.4rem,3vw,2.5rem)', fontWeight: 300, lineHeight: 1.4, maxWidth: '30rem', marginBottom: '2.5rem', color: 'var(--color-ink)' }}>
            {pro.tagline}
            <span style={{ display: 'block', color: 'var(--color-ink-dim)', fontSize: '90%' }}>{pro.taglineSub}</span>
          </p>

          <div className="animate-fade-up" style={{ animationDelay: '.9s', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={openBooking}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.65rem', padding: '.85rem 1.75rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.84rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s, transform .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-gold-l)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-gold)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Reservar Cita
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M7 1l3 3.5L7 8M1 4.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
            <a
              href={pro.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pro.address.replace(/\n/g, ', '))}`}
              target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.85rem 1.75rem', background: 'transparent', color: 'var(--color-ink)', fontFamily: 'var(--font-body)', fontSize: '.84rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', border: '1.5px solid var(--color-ink-dim)', transition: 'border-color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-ink)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-ink-dim)')}
            >
              <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
                <path d="M5.5 0C2.74 0 .5 2.24.5 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/>
              </svg>
              Ubicación
            </a>
          </div>
        </div>

        {/* Stats — only when no photo (otherwise stats are on the photo) */}
        {!hasPhoto && (
          <div className="animate-fade-in hidden lg:flex" style={{ animationDelay: '1.2s', position: 'absolute', right: '4.5rem', bottom: '6rem', flexDirection: 'column', gap: '2rem', zIndex: 2 }}>
            {pro.stats.map(s => (
              <div key={s.label} style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem,4vw,4rem)', fontWeight: 300, color: 'var(--color-gold)', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: '.82rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink)', fontWeight: 400, marginTop: '.35rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── RIGHT: photo contained + cards floating outside ── */}
      {hasPhoto && (
        <div
          className="animate-fade-in hero-photo-col"
          style={{
            animationDelay: '.4s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(1.5rem,5vh,3.5rem) clamp(1.5rem,3vw,3rem)',
            position: 'relative',
          }}
        >
          {/* Photo container — 80% width, cards bleed outside */}
          <div style={{ position: 'relative', width: '80%' }}>
            <img
              src={pro.heroPhoto}
              alt={pro.name}
              style={{
                width: '100%', display: 'block',
                objectFit: 'cover', objectPosition: 'center top',
                maxHeight: '100%',
              }}
            />

            {/* Card 1 — bleeds LEFT, top area */}
            {pro.stats[0] && (
              <div style={{
                position: 'absolute', top: '18%',
                left: 'clamp(-1.25rem, -3vw, -2.25rem)',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-rim-l)',
                boxShadow: '0 4px 20px rgba(0,0,0,.12)',
                padding: 'clamp(.5rem,1.5vw,1.1rem) clamp(.65rem,2vw,1.4rem)',
                minWidth: 'clamp(5rem,22vw,10rem)',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,4vw,2.8rem)', fontWeight: 300, color: 'var(--color-gold)', lineHeight: 1, marginBottom: '.2rem' }}>
                  {pro.stats[0].n}
                </div>
                <div style={{ fontSize: 'clamp(.5rem,.9vw,.65rem)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', fontWeight: 500, lineHeight: 1.3 }}>
                  {pro.stats[0].label}
                </div>
              </div>
            )}

            {/* Card 2 — bleeds RIGHT, bottom area */}
            {pro.stats[1] && (
              <div style={{
                position: 'absolute', bottom: '18%',
                right: 'clamp(-1.25rem, -3vw, -2.25rem)',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-rim-l)',
                boxShadow: '0 4px 20px rgba(0,0,0,.12)',
                padding: 'clamp(.5rem,1.5vw,1.1rem) clamp(.65rem,2vw,1.4rem)',
                textAlign: 'right',
                minWidth: 'clamp(5rem,22vw,10rem)',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,4vw,2.8rem)', fontWeight: 300, color: 'var(--color-gold)', lineHeight: 1, marginBottom: '.2rem' }}>
                  {pro.stats[1].n}
                </div>
                <div style={{ fontSize: 'clamp(.5rem,.9vw,.65rem)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', fontWeight: 500, lineHeight: 1.3 }}>
                  {pro.stats[1].label}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
