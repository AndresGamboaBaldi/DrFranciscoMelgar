import { useState } from 'react'
import Reveal from './Reveal'
import { useProfessional } from '../context/ProfessionalContext'

const IS_HOVER_DEVICE =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

export default function Services() {
  const pro = useProfessional()
  const [expandedId, setExpanded] = useState<string | null>(pro.services[0]?.id ?? null)

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

      <Reveal>
        <div className="service-accordion">
          {pro.services.map((svc, i) => {
            const expanded = expandedId === svc.id
            return (
              <ServicePanel
                key={svc.id}
                svc={svc}
                num={String(i + 1).padStart(2, '0')}
                expanded={expanded}
                onExpand={() => setExpanded(svc.id)}
                onCollapse={() => setExpanded(null)}
              />
            )
          })}
        </div>
      </Reveal>
    </section>
  )
}

/* ── Service Panel ── */

interface Svc { id: string; tag: string; name: string; description: string; duration: string; price: string; image?: string }

function ServicePanel({ svc, num, expanded, onExpand, onCollapse }: {
  svc: Svc; num: string; expanded: boolean
  onExpand: () => void; onCollapse: () => void
}) {
  const FALLBACK_COLORS = [
    'linear-gradient(135deg, #1a1815 0%, #2d2820 100%)',
    'linear-gradient(135deg, #181a1d 0%, #202530 100%)',
    'linear-gradient(135deg, #1a1810 0%, #2a2418 100%)',
    'linear-gradient(135deg, #16181a 0%, #242830 100%)',
  ]
  const fallback = FALLBACK_COLORS[parseInt(num) % FALLBACK_COLORS.length]

  return (
    <div
      onMouseEnter={() => IS_HOVER_DEVICE && onExpand()}
      onMouseLeave={() => IS_HOVER_DEVICE && onCollapse()}
      onClick={() => !IS_HOVER_DEVICE && (expanded ? onCollapse() : onExpand())}
      style={{
        /* Desktop: flex ratio controls width. Mobile: height ratio controls height */
        flex: expanded ? '4 1 0' : '1 1 0',
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'flex 0.55s cubic-bezier(0.16,1,0.3,1)',
        background: fallback,
        /* Mobile fixed heights */
        minHeight: expanded ? '260px' : '80px',
      }}
    >
      {/* Background image */}
      {svc.image && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${svc.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
          transform: expanded ? 'scale(1.04)' : 'scale(1)',
        }} />
      )}

      {/* Dark overlay — stronger on collapsed */}
      <div style={{
        position: 'absolute', inset: 0,
        background: expanded
          ? 'linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.15) 60%, transparent 100%)'
          : 'rgba(0,0,0,.52)',
        transition: 'background 0.4s',
      }} />

      {/* Gold top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'var(--color-gold)',
        transform: `scaleX(${expanded ? 1 : 0})`,
        transformOrigin: 'left',
        transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
      }} />

      {/* Number — hidden on mobile when collapsed */}
      <div style={{
        position: 'absolute', top: '1rem', left: '1.25rem',
        fontFamily: 'var(--font-display)',
        fontSize: expanded ? '1.5rem' : '1.1rem',
        fontWeight: 300,
        color: expanded ? 'var(--color-gold)' : 'rgba(255,255,255,.5)',
        lineHeight: 1,
        transition: 'font-size 0.4s, color 0.3s, opacity 0.3s',
        opacity: (!IS_HOVER_DEVICE && !expanded) ? 0 : 1,
      }}>{num}</div>

      {/* Bottom content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: expanded ? '1.75rem 1.5rem' : '1.25rem 1.25rem',
        transition: 'padding 0.4s',
      }}>
        {/* Tag */}
        <span style={{
          display: 'block',
          fontSize: '.62rem', letterSpacing: '.18em', textTransform: 'uppercase',
          color: 'var(--color-gold)',
          marginBottom: '.4rem',
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.3s 0.1s, transform 0.3s 0.1s',
        }}>{svc.tag}</span>

        {/* Title — hidden on mobile when collapsed (no space in 80px strip) */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: expanded ? 'clamp(1.4rem,2.5vw,1.9rem)' : 'clamp(1rem,1.5vw,1.3rem)',
          fontWeight: 400,
          color: '#ffffff',
          lineHeight: 1.1,
          whiteSpace: expanded ? 'normal' : 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: expanded ? '.85rem' : 0,
          transition: 'font-size 0.4s, margin 0.3s, opacity 0.3s',
            opacity: 1,
        }}>{svc.name}</h3>

        {/* Description */}
        <p style={{
          fontSize: '.85rem', lineHeight: 1.75,
          color: 'rgba(255,255,255,.82)',
          fontWeight: 300,
          maxHeight: expanded ? '8rem' : 0,
          overflow: 'hidden',
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(8px)',
          transition: 'max-height 0.4s, opacity 0.35s 0.15s, transform 0.35s 0.15s',
          marginBottom: expanded ? '.75rem' : 0,
        }}>{svc.description}</p>

        {/* Price */}
        <span style={{
          fontSize: '.8rem',
          color: 'var(--color-gold)',
          fontWeight: 400,
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(6px)',
          display: 'block',
          transition: 'opacity 0.3s 0.2s, transform 0.3s 0.2s',
        }}>{svc.price}</span>
      </div>
    </div>
  )
}
