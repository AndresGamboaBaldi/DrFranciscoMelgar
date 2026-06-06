import { useState, useEffect } from 'react'
import Reveal from './Reveal'
import { useProfessional } from '../context/ProfessionalContext'
import { getScheduleSettings } from '../lib/supabase'

const IS_HOVER_DEVICE =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

export default function Services() {
  const pro = useProfessional()
  const [expandedId, setExpanded] = useState<string | null>(pro.services[0]?.id ?? null)
  const [slotDuration, setSlotDuration] = useState(30)

  useEffect(() => {
    getScheduleSettings(pro.doctorId).then(s => { if (s) setSlotDuration(s.slot_duration) })
  }, [pro.doctorId])

  return (
    <section id="servicios" className="s-pad" style={{ background: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-12rem', right: '-6rem', width: '40rem', height: '40rem', background: `radial-gradient(circle, var(--color-gold-glow, rgba(196,153,90,.06)) 0%, transparent 68%)`, pointerEvents: 'none' }} />

      <div className="s-header">
        <div>
          <Reveal delay={100}><h2 className="s-title">Nuestros<br /><em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Servicios</em></h2></Reveal>
        </div>
        <Reveal delay={200}>
          <p style={{ maxWidth: '44rem', fontSize: '1.2em', lineHeight: 1.9, color: 'var(--color-ink-dim)', fontWeight: 300 }}>
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
                slotDuration={slotDuration}
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

interface Svc { id: string; tag: string; name: string; description: string; durationMins?: number; price: string; image?: string }

function ServicePanel({ svc, slotDuration, num, expanded, onExpand, onCollapse }: {
  svc: Svc; slotDuration: number; num: string; expanded: boolean
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

      {/* Dark overlay — always a bottom gradient + dimmer on collapsed */}
      <div style={{
        position: 'absolute', inset: 0,
        background: expanded
          ? 'linear-gradient(to top, rgba(0,0,0,.78) 0%, rgba(0,0,0,.18) 55%, transparent 100%)'
          : 'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.35) 50%, rgba(0,0,0,.25) 100%)',
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


      {/* Bottom content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: expanded ? '1.75rem 1.5rem' : '1.25rem 1.25rem',
        transition: 'padding 0.4s',
      }}>
        {/* Tag — pill with backdrop */}
        <span style={{
          display: 'inline-block',
          fontSize: '.6rem', letterSpacing: '.16em', textTransform: 'uppercase',
          color: '#111',
          background: 'rgba(255,255,255,.88)',
          backdropFilter: 'blur(6px)',
          padding: '.2rem .6rem',
          marginBottom: '.6rem',
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
          textShadow: '0 1px 8px rgba(0,0,0,.9), 0 2px 16px rgba(0,0,0,.6)',
        }}>{svc.name}</h3>

        {/* Description */}
        <p style={{
          fontSize: '.85rem', lineHeight: 1.75,
          color: 'rgba(255,255,255,.82)',
          fontWeight: 300,
          textShadow: '0 1px 6px rgba(0,0,0,.8)',
          maxHeight: expanded ? '8rem' : 0,
          overflow: 'hidden',
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(8px)',
          transition: 'max-height 0.4s, opacity 0.35s 0.15s, transform 0.35s 0.15s',
          marginBottom: expanded ? '.75rem' : 0,
        }}>{svc.description}</p>

        {/* Price + duration row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', opacity: expanded ? 1 : 0, transform: expanded ? 'translateY(0)' : 'translateY(6px)', transition: 'opacity 0.3s 0.2s, transform 0.3s 0.2s' }}>
          <span style={{ display: 'inline-block', fontSize: '.78rem', color: '#fff', fontWeight: 500, background: 'var(--color-gold)', padding: '.25rem .75rem' }}>{svc.price}</span>
          <span style={{ display: 'inline-block', fontSize: '.78rem', color: '#fff', fontWeight: 500, background: 'rgba(255,255,255,.15)', padding: '.25rem .75rem' }}>⏱ {svc.durationMins ?? slotDuration} min</span>
        </div>
      </div>
    </div>
  )
}
