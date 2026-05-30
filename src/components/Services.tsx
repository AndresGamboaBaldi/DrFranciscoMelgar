import { useState } from 'react'
import Reveal from './Reveal'
import { useProfessional } from '../context/ProfessionalContext'

export default function Services() {
  const pro = useProfessional()
  return (
    <section id="servicios" style={{ padding: '8rem 4.5rem', background: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-15rem', right: '-8rem', width: '45rem', height: '45rem', background: 'radial-gradient(circle, rgba(196,153,90,.06) 0%, transparent 68%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '5rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <Reveal><p style={{ fontSize: '.62rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', opacity: .7, marginBottom: '.7rem' }}>01 — Tratamientos</p></Reveal>
          <Reveal delay={100}><h2 style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 300, letterSpacing: '-.02em', lineHeight: 1 }}>Nuestros<br /><em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Servicios</em></h2></Reveal>
        </div>
        <Reveal delay={200}><p style={{ maxWidth: '28rem', fontSize: '.88rem', lineHeight: 1.9, color: 'var(--color-ink-dim)', fontWeight: 300 }}>Cada servicio se diseña de forma personalizada, con técnica y atención al detalle.</p></Reveal>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, background: 'var(--color-rim)' }}>
        {pro.services.map((svc, i) => (
          <Reveal key={svc.id} delay={i * 70}>
            <ServiceCard num={String(i + 1).padStart(2,'0')} {...svc} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function ServiceCard({ num, tag, name, description }: { num: string; tag: string; name: string; description: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? 'var(--color-surface2)' : 'var(--color-surface)', padding: '3rem 2.5rem', position: 'relative', overflow: 'hidden', transition: 'background .4s' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--color-gold)', transform: `scaleX(${hovered ? 1 : 0})`, transformOrigin: 'left', transition: 'transform .45s cubic-bezier(0.16,1,0.3,1)' }} />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 300, color: hovered ? 'var(--color-gold)' : 'var(--color-ink-ghost)', lineHeight: 1, marginBottom: '1.75rem', opacity: hovered ? .28 : 1, transition: 'color .3s, opacity .3s' }}>{num}</div>
      <span style={{ fontSize: '.63rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-gold)', display: 'block', marginBottom: '.5rem' }}>{tag}</span>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '1.25rem', lineHeight: 1.2 }}>{name}</h3>
      <p style={{ fontSize: '.83rem', lineHeight: 1.85, color: 'var(--color-ink-dim)', fontWeight: 300, maxHeight: hovered ? '10rem' : 0, overflow: 'hidden', opacity: hovered ? 1 : 0, transition: 'max-height .45s cubic-bezier(0.16,1,0.3,1), opacity .35s' }}>{description}</p>
      <div style={{ position: 'absolute', bottom: '1.75rem', right: '2rem', width: '1.9rem', height: '1.9rem', border: `1px solid ${hovered ? 'var(--color-gold)' : 'var(--color-rim-l)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: hovered ? 'var(--color-bg)' : 'var(--color-ink-ghost)', background: hovered ? 'var(--color-gold)' : 'transparent', fontSize: '.8rem', transform: hovered ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'all .3s' }}>→</div>
    </div>
  )
}
