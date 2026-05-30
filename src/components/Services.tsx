import { useState } from 'react'
import Reveal from './Reveal'
import { useProfessional } from '../context/ProfessionalContext'

export default function Services() {
  const pro = useProfessional()
  const [expandedId, setExpanded] = useState<string | null>(null)

  return (
    <section id="servicios" className="s-pad" style={{ background: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '-12rem', right: '-6rem', width: '40rem', height: '40rem', background: `radial-gradient(circle, var(--color-gold-glow, rgba(196,153,90,.06)) 0%, transparent 68%)`, pointerEvents: 'none' }} />

      <div className="s-header">
        <div>
<Reveal delay={100}><h2 className="s-title">Nuestros<br /><em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Servicios</em></h2></Reveal>
        </div>
        <Reveal delay={200}>
          <p style={{ maxWidth: '26rem', fontSize: '.86rem', lineHeight: 1.9, color: 'var(--color-ink-dim)', fontWeight: 300 }}>
            Cada servicio se diseña de forma personalizada, con técnica y atención al detalle.
          </p>
        </Reveal>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 1, background: 'var(--color-rim)' }}>
        {pro.services.map((svc, i) => {
          const expanded = expandedId === svc.id
          return (
            <Reveal key={svc.id} delay={i * 60}>
              <div
                onClick={() => setExpanded(expanded ? null : svc.id)}
                style={{ background: expanded ? 'var(--color-surface2)' : 'var(--color-surface)', padding: '2.25rem 2rem', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'background .35s' }}
                onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'var(--color-surface2)' }}
                onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'var(--color-surface)' }}
              >
                {/* Top accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--color-gold)', transform: `scaleX(${expanded ? 1 : 0})`, transformOrigin: 'left', transition: 'transform .4s cubic-bezier(0.16,1,0.3,1)' }} />

                <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 300, color: expanded ? 'var(--color-gold)' : 'var(--color-ink-ghost)', lineHeight: 1, marginBottom: '1.5rem', opacity: expanded ? .3 : 1, transition: 'color .3s, opacity .3s' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <span style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-gold)', display: 'block', marginBottom: '.4rem' }}>{svc.tag}</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '1rem', lineHeight: 1.2, color: 'var(--color-ink)' }}>{svc.name}</h3>

                {/* Description — always visible on mobile when expanded */}
                <p style={{ fontSize: '.82rem', lineHeight: 1.85, color: 'var(--color-ink-dim)', fontWeight: 300, maxHeight: expanded ? '10rem' : 0, overflow: 'hidden', opacity: expanded ? 1 : 0, transition: 'max-height .4s cubic-bezier(0.16,1,0.3,1), opacity .3s' }}>
                  {svc.description}
                </p>

                {/* Duration + Price row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: expanded ? '.75rem' : 0, height: expanded ? 'auto' : 0, overflow: 'hidden', opacity: expanded ? 1 : 0, transition: 'opacity .3s, margin .3s' }}>
                  <span style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)', letterSpacing: '.06em' }}>{svc.duration}</span>
                  <span style={{ fontSize: '.75rem', color: 'var(--color-gold)', fontWeight: 400 }}>{svc.price}</span>
                </div>

                {/* Expand/collapse arrow */}
                <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.75rem', width: '1.75rem', height: '1.75rem', border: `1px solid ${expanded ? 'var(--color-gold)' : 'var(--color-rim-l)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: expanded ? 'var(--color-bg)' : 'var(--color-ink-ghost)', background: expanded ? 'var(--color-gold)' : 'transparent', fontSize: '.75rem', transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'all .3s' }}>+</div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
