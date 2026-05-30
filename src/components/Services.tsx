import { useState } from 'react'
import Reveal from './Reveal'
import { useProfessional } from '../context/ProfessionalContext'

const IS_HOVER_DEVICE =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

export default function Services() {
  const pro = useProfessional()
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

interface Svc { id: string; tag: string; name: string; description: string; duration: string; price: string; image?: string }

function ServiceCard({ svc, num, expanded, onToggle }: { svc: Svc; num: string; expanded: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false)
  const open = IS_HOVER_DEVICE ? hovered : expanded

  const handleClick = () => { if (!IS_HOVER_DEVICE) onToggle() }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => IS_HOVER_DEVICE && setHovered(true)}
      onMouseLeave={() => IS_HOVER_DEVICE && setHovered(false)}
      style={{
        // Without image: whole card changes on open. With image: handled per-section below.
        background: !svc.image ? (open ? 'var(--color-surface2)' : 'var(--color-surface)') : 'var(--color-surface)',
        position: 'relative', overflow: 'hidden',
        cursor: IS_HOVER_DEVICE ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'background .3s',
      }}
    >
      {/* ── Image area (or number area if no image) ── */}
      {svc.image ? (
        /* With image */
        <div style={{ position: 'relative', overflow: 'hidden', height: '220px', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${svc.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            transition: 'transform .6s cubic-bezier(0.16,1,0.3,1)',
            transform: open ? 'scale(1.05)' : 'scale(1)',
          }} />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.55))' }} />
          {/* Number badge */}
          <div style={{ position: 'absolute', top: '1rem', left: '1.25rem', fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 300, color: 'rgba(255,255,255,.75)', lineHeight: 1 }}>{num}</div>
          {/* Top gold line on hover */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--color-gold)', transform: `scaleX(${open ? 1 : 0})`, transformOrigin: 'left', transition: 'transform .38s cubic-bezier(0.16,1,0.3,1)' }} />
          {/* Tag overlay on image bottom */}
          <span style={{ position: 'absolute', bottom: '.85rem', left: '1.25rem', fontSize: '.65rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.8)', fontWeight: 400 }}>{svc.tag}</span>
        </div>
      ) : (
        /* No image — content centered vertically */
        <div style={{ position: 'relative', padding: '2rem 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--color-gold)', transform: `scaleX(${open ? 1 : 0})`, transformOrigin: 'left', transition: 'transform .38s cubic-bezier(0.16,1,0.3,1)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 300, color: open ? 'var(--color-gold)' : 'var(--color-ink-ghost)', lineHeight: 1, opacity: open ? .25 : 1, transition: 'color .25s, opacity .25s' }}>{num}</div>
          <span style={{ fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-gold)', display: 'block', marginTop: '.75rem' }}>{svc.tag}</span>
        </div>
      )}

      {/* ── Text content ── */}
      {/* Text content — only image cards change bg here; no-image cards change on the outer wrapper */}
      <div style={{ padding: svc.image ? '1.5rem 1.75rem 2rem' : '1rem 2rem 2rem', flex: 1, background: svc.image ? (open ? 'var(--color-surface2)' : 'var(--color-surface)') : 'transparent', transition: 'background .3s', position: 'relative' }}>
        {/* Tag (only shown here if has image — if no image, tag is in the number area) */}
        {svc.image && (
          <span style={{ fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-gold)', display: 'block', marginBottom: '.5rem' }}>{svc.tag}</span>
        )}

        {/* Title — bigger and bolder */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.45rem, 2.5vw, 1.75rem)',
          fontWeight: 400,
          lineHeight: 1.15,
          color: 'var(--color-ink)',
          paddingRight: IS_HOVER_DEVICE ? '0' : '2.5rem',
          marginBottom: svc.image ? '.1rem' : '0',
          minHeight: '3.5rem',  // reserva espacio para 2 líneas → títulos siempre del mismo alto
        }}>
          {svc.name}
        </h3>

        {/* Expandable: description + price */}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '.75rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-gold)', fontWeight: 400 }}>{svc.price}</span>
          </div>
        </div>

        {/* Toggle icon — mobile only */}
        {!IS_HOVER_DEVICE && (
          <div style={{
            position: 'absolute', top: svc.image ? '1.5rem' : '1.5rem', right: '1.5rem',
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
    </div>
  )
}
