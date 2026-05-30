import { useState } from 'react'
import Reveal from './Reveal'
import { useProfessional } from '../context/ProfessionalContext'

// Detect once: does this device support hover (mouse/trackpad)?
// If true → desktop behavior (hover expands, no click state needed)
// If false → touch behavior (tap to expand/collapse)
const IS_HOVER_DEVICE =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

export default function Services() {
  const pro = useProfessional()
  // expandedId only used on touch devices
  const [expandedId, setExpanded] = useState<string | null>(null)

  return (
    <section id="servicios" className="s-pad" style={{ background: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-12rem', right: '-6rem', width: '40rem', height: '40rem', background: `radial-gradient(circle, var(--color-gold-glow, rgba(196,153,90,.06)) 0%, transparent 68%)`, pointerEvents: 'none' }} />

      <div className="s-header">
        <div>
          <Reveal delay={100}><h2 className="s-title">Nuestros<br /><em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Servicios</em></h2></Reveal>
        </div>
        <Reveal delay={200}>
          <p style={{ maxWidth: '26rem', fontSize: '.96rem', lineHeight: 1.9, color: 'var(--color-ink-dim)', fontWeight: 300 }}>
            Cada servicio se diseña de forma personalizada, con técnica y atención al detalle.
          </p>
        </Reveal>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 1, background: 'var(--color-rim)' }}>
        {pro.services.map((svc, i) => (
          <Reveal key={svc.id} delay={i * 60}>
            <ServiceCard
              svc={svc}
              num={String(i + 1).padStart(2, '0')}
              expanded={expandedId === svc.id}
              onToggle={() => setExpanded(expandedId === svc.id ? null : svc.id)}
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ── ServiceCard ── */

interface Svc { id: string; tag: string; name: string; description: string; duration: string; price: string }

function ServiceCard({ svc, num, expanded, onToggle }: { svc: Svc; num: string; expanded: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false)

  /**
   * Desktop (hover device): only hover controls the open state.
   *   — multiple cards can't be open at once (cursor is only on one)
   *   — clicking does nothing (no need to click to see info)
   * Mobile (touch): only the parent's expandedId controls open state.
   *   — tap opens, tap again (the ×) closes
   */
  const open = IS_HOVER_DEVICE ? hovered : expanded

  const handleClick = () => {
    if (!IS_HOVER_DEVICE) onToggle()
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => IS_HOVER_DEVICE && setHovered(true)}
      onMouseLeave={() => IS_HOVER_DEVICE && setHovered(false)}
      style={{
        background: open ? 'var(--color-surface2)' : 'var(--color-surface)',
        padding: '2.25rem 2rem 2rem',
        position: 'relative', overflow: 'hidden',
        cursor: IS_HOVER_DEVICE ? 'default' : 'pointer',
        transition: 'background .3s',
      }}
    >
      {/* Top gold line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--color-gold)', transform: `scaleX(${open ? 1 : 0})`, transformOrigin: 'left', transition: 'transform .38s cubic-bezier(0.16,1,0.3,1)' }} />

      {/* Number */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 300, color: open ? 'var(--color-gold)' : 'var(--color-ink-ghost)', lineHeight: 1, marginBottom: '1.25rem', opacity: open ? .28 : 1, transition: 'color .25s, opacity .25s' }}>{num}</div>

      {/* Tag */}
      <span style={{ fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-gold)', display: 'block', marginBottom: '.35rem' }}>{svc.tag}</span>

      {/* Name — padded right on mobile so it doesn't go under the × */}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 400, lineHeight: 1.2, color: 'var(--color-ink)', paddingRight: IS_HOVER_DEVICE ? '0' : '2.5rem' }}>{svc.name}</h3>

      {/* Expandable content — smooth opacity + translate, no max-height jank */}
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '200px' : '0px',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(-6px)',
        transition: open
          ? 'max-height .38s cubic-bezier(0.16,1,0.3,1), opacity .3s .05s, transform .3s .05s'
          : 'max-height .3s ease, opacity .2s, transform .2s',
      }}>
        <p style={{ fontSize: '.9rem', lineHeight: 1.85, color: 'var(--color-ink-dim)', fontWeight: 300, marginTop: '1rem' }}>
          {svc.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.75rem' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--color-ink-ghost)', letterSpacing: '.06em' }}>{svc.duration}</span>
          <span style={{ fontSize: '.8rem', color: 'var(--color-gold)', fontWeight: 400 }}>{svc.price}</span>
        </div>
      </div>

      {/* Toggle icon — only shown on touch devices */}
      {!IS_HOVER_DEVICE && (
        <div style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          width: '1.65rem', height: '1.65rem',
          border: `1px solid ${open ? 'var(--color-gold)' : 'var(--color-rim-l)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? 'var(--color-bg)' : 'var(--color-ink-ghost)',
          background: open ? 'var(--color-gold)' : 'transparent',
          fontSize: '.75rem',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'all .28s cubic-bezier(0.16,1,0.3,1)',
        }}>+</div>
      )}
    </div>
  )
}
