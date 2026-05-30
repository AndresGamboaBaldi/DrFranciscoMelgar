const C = {
  bg:       'var(--color-bg)',
  gold:     'var(--color-gold)',
  ink:      'var(--color-ink)',
  inkDim:   'var(--color-ink-dim)',
  inkGhost: 'var(--color-ink-ghost)',
  rim:      'var(--color-rim)',
} as const

export default function Hero() {
  return (
    <section
      id="inicio"
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '0 4.5rem 7rem',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Background watermark */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 'clamp(10rem,22vw,20rem)', fontWeight: 300, lineHeight: 1,
        color: 'transparent', WebkitTextStroke: '1px rgba(196,153,90,.07)',
        whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
        letterSpacing: '-.02em',
      }}>
        Estética
      </div>

      {/* Vertical line */}
      <div style={{
        position: 'absolute', top: 0, right: '22%', width: 1, height: '100%',
        background: `linear-gradient(to bottom, transparent, ${C.rim} 25%, ${C.rim} 75%, transparent)`,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Eyebrow */}
        <div className="animate-fade-up" style={{ animationDelay: '.2s', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{ width: '2.5rem', height: 1, background: C.gold, opacity: .5, flexShrink: 0 }} />
          <span style={{ fontSize: '.68rem', fontWeight: 300, letterSpacing: '.22em', textTransform: 'uppercase', color: C.gold }}>
            Medicina &amp; Cirugía Estética — Bogotá
          </span>
        </div>

        {/* Title */}
        <h1
          className="animate-fade-up"
          style={{
            animationDelay: '.4s',
            fontSize: 'clamp(3.5rem,7.5vw,7rem)',
            fontWeight: 300, letterSpacing: '-.025em', lineHeight: .95,
            marginBottom: '.25em',
          }}
        >
          Dr. Melgar
          <br />
          <em style={{ fontStyle: 'italic', color: C.gold }}>Baldi</em>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up" style={{ animationDelay: '.6s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1rem,2vw,1.5rem)', fontWeight: 300, color: C.inkDim, marginBottom: '3rem' }}>
          Especialista en estética avanzada y medicina antienvejecimiento
        </p>

        {/* Quote */}
        <p className="animate-fade-up" style={{ animationDelay: '.8s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 300, lineHeight: 1.4, maxWidth: '30rem', marginBottom: '3.5rem' }}>
          La belleza no se crea,
          <span style={{ display: 'block', color: C.inkDim, fontSize: '85%' }}>se revela con precisión.</span>
        </p>

        {/* CTAs */}
        <div className="animate-fade-up" style={{ animationDelay: '1s', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <BtnGold href="#citas">
            Reservar Cita <Arrow />
          </BtnGold>
          <BtnOutline href="#servicios">Ver Servicios</BtnOutline>
        </div>
      </div>

      {/* Stats (desktop) */}
      <div className="animate-fade-in hidden md:flex" style={{ animationDelay: '1.3s', position: 'absolute', right: '4.5rem', bottom: '7rem', flexDirection: 'column', gap: '2rem', zIndex: 2 }}>
        {[{ n: '+3.000', l: 'Pacientes atendidas' }, { n: '15+', l: 'Años de experiencia' }].map(s => (
          <div key={s.l} style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 300, color: C.gold, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase', color: C.inkGhost, marginTop: '.2rem' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="animate-fade-in" style={{ animationDelay: '1.5s', position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem' }}>
        <div className="animate-scroll-bob" style={{ width: 1, height: '3.5rem', background: `linear-gradient(to bottom, ${C.gold}, transparent)` }} />
        <span style={{ fontSize: '.62rem', letterSpacing: '.18em', textTransform: 'uppercase', color: C.inkGhost }}>Scroll</span>
      </div>
    </section>
  )
}

/* ── Reusable micro-components ── */
function BtnGold({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '.7rem', padding: '.85rem 2rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background .3s, transform .2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-gold-l)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-gold)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >{children}</a>
  )
}

function BtnOutline({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '.7rem', padding: '.85rem 2rem', background: 'transparent', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 300, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', border: '1px solid var(--color-rim-l)', transition: 'color .3s, border-color .3s' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
    >{children}</a>
  )
}

function Arrow() {
  return (
    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
      <path d="M7.5 1l3.5 3.5L7.5 8M1 4.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
