import { useState } from 'react'
import type { Service } from '../../types/booking'
import type { ProService } from '../../types/professional'

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
      <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
        Selecciona el servicio de tu interés para comenzar.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: 1, background: 'var(--color-rim)', marginBottom: '2rem' }}>
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
    <div
      onClick={() => onSelect(svc)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? 'var(--color-bg)' : hovered ? 'var(--color-surface2)' : 'var(--color-surface)',
        padding: '1.5rem 1.25rem',
        cursor: 'pointer', position: 'relative',
        boxShadow: isSelected ? 'inset 0 0 0 1.5px var(--color-gold)' : 'none',
        transition: 'background .25s',
        minHeight: '100px',
      }}
    >
      {isSelected && (
        <div style={{ position: 'absolute', top: '.75rem', right: '.75rem', width: '1.15rem', height: '1.15rem', background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg)', fontSize: '.55rem', borderRadius: '50%' }}>✓</div>
      )}
      <div style={{ fontSize: '1.1rem', marginBottom: '.6rem', color: active ? 'var(--color-gold)' : 'var(--color-ink-ghost)', transition: 'color .2s' }}>{svc.icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, marginBottom: '.25rem', color: isSelected ? 'var(--color-gold)' : 'var(--color-ink)', transition: 'color .2s', lineHeight: 1.2 }}>{svc.name}</div>
      <div style={{ fontSize: '.75rem', color: 'var(--color-ink-ghost)', letterSpacing: '.06em' }}>{svc.duration}</div>
      <div style={{ fontSize: '.7rem', color: 'var(--color-gold)', fontWeight: 400, marginTop: '.2rem' }}>{svc.price}</div>
    </div>
  )
}
