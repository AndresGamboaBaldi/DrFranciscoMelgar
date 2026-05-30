import { useState } from 'react'
import type { Service } from '../../types/booking'
import type { ProService } from '../../types/professional'

// Convert ProService → booking Service shape
export function toBookingService(ps: ProService): Service {
  return { id: ps.id, name: ps.name, tag: ps.tag, duration: ps.duration, price: ps.price, icon: ps.icon }
}

interface Props {
  services: ProService[]
  selected: Service | null
  onSelect: (svc: Service) => void
}

export default function ServiceSelector({ services, selected, onSelect }: Props) {
  return (
    <div>
      <p style={{ fontSize: '.84rem', color: 'var(--color-ink-dim)', marginBottom: '1.5rem' }}>
        Selecciona el servicio de tu interés para comenzar.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1, background: 'var(--color-rim)', marginBottom: '2.5rem' }}>
        {services.map(svc => {
          const bs = toBookingService(svc)
          return <ServiceCard key={svc.id} svc={bs} isSelected={selected?.id === svc.id} onSelect={onSelect} />
        })}
      </div>
    </div>
  )
}

function ServiceCard({ svc, isSelected, onSelect }: { svc: Service; isSelected: boolean; onSelect: (s: Service) => void }) {
  const [hovered, setHovered] = useState(false)
  const active = isSelected || hovered
  return (
    <div onClick={() => onSelect(svc)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: isSelected ? 'var(--color-bg)' : hovered ? 'var(--color-surface2)' : 'var(--color-surface)', padding: '1.75rem 2rem', cursor: 'pointer', position: 'relative', boxShadow: isSelected ? 'inset 0 0 0 1px var(--color-gold)' : 'none', transition: 'background .3s' }}>
      {isSelected && <div style={{ position: 'absolute', top: '.9rem', right: '.9rem', width: '1.2rem', height: '1.2rem', background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg)', fontSize: '.6rem' }}>✓</div>}
      <div style={{ fontSize: '1.2rem', marginBottom: '.7rem', color: active ? 'var(--color-gold)' : 'var(--color-ink-ghost)', transition: 'color .2s' }}>{svc.icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, marginBottom: '.3rem', color: isSelected ? 'var(--color-gold)' : 'var(--color-ink)', transition: 'color .2s' }}>{svc.name}</div>
      <div style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)', letterSpacing: '.08em' }}>{svc.duration} · {svc.price}</div>
    </div>
  )
}
