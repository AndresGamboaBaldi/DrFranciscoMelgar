import { useProfessional } from '../context/ProfessionalContext'
import Reveal from './Reveal'

export default function QuoteSection() {
  const pro = useProfessional()
  if (!pro.finalQuote) return null

  return (
    <section style={{ padding: 'clamp(4rem,8vw,7rem) clamp(1.5rem,8vw,12rem)', background: 'var(--color-bg)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>

      {/* Decorative large quote mark behind */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -55%)',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(12rem, 25vw, 22rem)',
        fontWeight: 400,
        color: 'transparent',
        WebkitTextStroke: '1px var(--color-rim)',
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: .5,
      }}>"</div>

      <Reveal>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '52rem', margin: '0 auto' }}>

          {/* Icon */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', fontSize: '1rem' }}>◇</div>
          </div>

          {/* Quote */}
          <blockquote style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(1.4rem, 3.5vw, 2.4rem)',
            fontWeight: 300,
            lineHeight: 1.5,
            color: 'var(--color-ink)',
            marginBottom: '2.5rem',
            letterSpacing: '-.01em',
          }}>
            "{pro.finalQuote}"
          </blockquote>

          {/* Attribution */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <div style={{ width: '2rem', height: '1px', background: 'var(--color-gold)', opacity: .6 }} />
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '.68rem',
              fontWeight: 500,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-dim)',
            }}>
              {pro.name} — {pro.title}
            </p>
            <div style={{ width: '2rem', height: '1px', background: 'var(--color-gold)', opacity: .6 }} />
          </div>

        </div>
      </Reveal>
    </section>
  )
}
