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

          </div>
        </Reveal>

        {/* ── Content column ── */}
        <div>
          <Reveal delay={100}>
            <h2 className="s-title" style={{ marginBottom: '1.75rem' }}>
              Acerca<br /><em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>{pro.aboutTitle}</em>
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p style={{ fontSize: '1rem', lineHeight: 1.95, color: 'var(--color-ink-dim)', marginBottom: '2rem' }}>{pro.bio}</p>
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
              Agendar
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const imgs = e.currentTarget.querySelectorAll('img')
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 10
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 10
    imgs.forEach(img => {
      ;(img as HTMLElement).style.transform = `scale(1.07) translate(${x}px, ${y}px)`
    })
  }
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const imgs = e.currentTarget.querySelectorAll('img')
    imgs.forEach(img => { ;(img as HTMLElement).style.transform = 'scale(1) translate(0,0)' })
  }

  return (
    <div>
      <div
        style={FRAME}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
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
            transition: 'opacity .7s ease, transform .35s cubic-bezier(0.16,1,0.3,1)',
            zIndex: i === current ? 2 : 0,
            willChange: 'transform',
          }}
        />
      ))}

      </div>

      {/* ── Bar navigation below the image ── */}
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => advance(i)}
              style={{
                flex: 1, height: '2px', minHeight: '2px',
                background: i === current ? 'var(--color-gold)' : 'var(--color-rim-l)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'background .4s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
