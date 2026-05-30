import { useState, useEffect, useCallback } from 'react'
import Reveal from './Reveal'
import { useProfessional } from '../context/ProfessionalContext'
import { useOpenBooking }  from '../context/BookingDialogContext'

const CAROUSEL_INTERVAL = 4500  // ms between auto-advances

export default function About() {
  const pro = useProfessional()
  const openBooking = useOpenBooking()
  const photos = pro.photos ?? []

  return (
    <section id="nosotros" className="s-pad" style={{ position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '4rem', alignItems: 'center' }}>

        {/* ── Image / Carousel column ── */}
        <Reveal>
          <div style={{ position: 'relative' }}>
            <PhotoArea photos={photos} />

            {/* Decorative borders — desktop only */}
            <div className="hidden md:block" style={{ position: 'absolute', bottom: '-1.5rem', right: '-1.5rem', width: '8rem', height: '8rem', border: '1px solid var(--color-rim)', zIndex: -1 }} />
            <div className="hidden md:block" style={{ position: 'absolute', top: '-1rem', left: '-1rem', width: '4.5rem', height: '4.5rem', background: 'var(--color-gold)', opacity: .07, zIndex: -1 }} />

            {/* Stats badge */}
            <div style={{ position: 'absolute', bottom: '2rem', right: 'clamp(0px, 5vw, -3rem)', background: 'var(--color-bg)', border: '1px solid var(--color-rim-l)', padding: '1rem 1.5rem', zIndex: 2, boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--color-gold)', lineHeight: 1, marginBottom: '.2rem' }}>{pro.stats[0]?.n}</div>
              <div style={{ fontSize: '.7rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', fontWeight: 400 }}>{pro.stats[0]?.label}</div>
            </div>
          </div>
        </Reveal>

        {/* ── Content column ── */}
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
            <p style={{ fontSize: '.93rem', lineHeight: 1.95, color: 'var(--color-ink-dim)', marginBottom: '2rem' }}>{pro.bio}</p>
          </Reveal>

          <Reveal delay={400}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))', gap: 1, background: 'var(--color-rim)', marginBottom: '2rem' }}>
              {pro.credentials.map(c => (
                <div key={c.label} style={{ background: 'var(--color-bg)', padding: '1.1rem 1.4rem' }}>
                  <div style={{ fontSize: '.76rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-gold)', fontWeight: 500, marginBottom: '.4rem' }}>{c.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.2 }}>{c.value}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={500}>
            <button onClick={openBooking}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.65rem', padding: '.85rem 1.75rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.84rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-l)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
            >
              Agendar Consulta
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M7 1l3 3.5L7 8M1 4.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ── Photo area: static if 1 photo, carousel if 2+ ── */

function PhotoArea({ photos }: { photos: string[] }) {
  const [current, setCurrent] = useState(0)
  const [prev,    setPrev]    = useState<number | null>(null)
  const [fading,  setFading]  = useState(false)

  const advance = useCallback((next: number) => {
    if (fading) return
    setPrev(current)
    setCurrent(next)
    setFading(true)
    setTimeout(() => { setPrev(null); setFading(false) }, 700)
  }, [current, fading])

  // Auto-advance only if multiple photos
  useEffect(() => {
    if (photos.length <= 1) return
    const id = setInterval(() => {
      advance((current + 1) % photos.length)
    }, CAROUSEL_INTERVAL)
    return () => clearInterval(id)
  }, [photos.length, current, advance])

  const FRAME: React.CSSProperties = {
    width: '100%',
    paddingBottom: '115%',
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--color-surface2)',
  }

  // No photos — placeholder
  if (photos.length === 0) {
    return (
      <div style={FRAME}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(140deg, transparent 55%, var(--color-gold-glow, rgba(196,153,90,.09)))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.75rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-ink-ghost)', opacity: .35 }}>◇</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.9rem', color: 'var(--color-ink-ghost)', opacity: .4 }}>Foto</span>
        </div>
      </div>
    )
  }

  return (
    <div style={FRAME}>
      {/* Previous image — fades out */}
      {prev !== null && (
        <img
          src={photos[prev]}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0, transition: 'opacity .7s ease', zIndex: 1 }}
        />
      )}

      {/* Current image — fades in */}
      {photos.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            opacity: i === current ? 1 : 0,
            transition: 'opacity .7s ease',
            zIndex: i === current ? 2 : 0,
          }}
        />
      ))}

      {/* Prev / Next arrows + dots — only if multiple photos */}
      {photos.length > 1 && (
        <>
          {/* Prev arrow */}
          <button
            onClick={() => advance((current - 1 + photos.length) % photos.length)}
            style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background .2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,.6)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,.35)')}
            aria-label="Foto anterior"
          >
            <svg width="9" height="14" viewBox="0 0 9 14" fill="none"><path d="M7.5 1L1.5 7l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>

          {/* Next arrow */}
          <button
            onClick={() => advance((current + 1) % photos.length)}
            style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background .2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,.6)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,.35)')}
            aria-label="Foto siguiente"
          >
            <svg width="9" height="14" viewBox="0 0 9 14" fill="none"><path d="M1.5 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>

          {/* Dot indicators */}
          <div style={{ position: 'absolute', bottom: '1.1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '.45rem', zIndex: 10 }}>
            {photos.map((_, i) => (
              <button key={i} onClick={() => advance(i)}
                style={{ width: i === current ? '1.5rem' : '.45rem', height: '.45rem', borderRadius: '999px', background: i === current ? 'var(--color-gold)' : 'rgba(255,255,255,.5)', border: 'none', cursor: 'pointer', transition: 'width .4s cubic-bezier(0.16,1,0.3,1), background .3s', padding: 0 }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
