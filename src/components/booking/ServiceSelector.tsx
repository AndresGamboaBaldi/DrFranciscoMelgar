import { useState } from 'react'
import type { Service } from '../../types/booking'
import type { ProService } from '../../types/professional'

export function toBookingService(ps: ProService): Service {
  return { id: ps.id, name: ps.name, tag: ps.tag, durationMins: ps.durationMins, price: ps.price }
}

interface Props {
  services: ProService[]
  selected: Service | null
  onSelect: (svc: Service) => void
  slotDuration: number
}

export default function ServiceSelector({ services, selected, onSelect, slotDuration }: Props) {
  return (
    <div>
      <p
        style={{
          fontSize: '1rem',
          color: 'var(--color-ink)',
          marginBottom: '1.25rem',
          lineHeight: 1.7,
          fontWeight: 400,
        }}
      >
        Selecciona el servicio de tu interés para comenzar.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
          gap: 1,
          background: 'var(--color-rim)',
          marginBottom: '2rem',
        }}
      >
        {services.map((svc) => {
          const bs = toBookingService(svc)
          return (
            <ServiceCard
              key={svc.id}
              svc={bs}
              slotDuration={slotDuration}
              isSelected={selected?.id === svc.id}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}

function ServiceCard({
  svc,
  slotDuration,
  isSelected,
  onSelect,
}: {
  svc: Service
  slotDuration: number
  isSelected: boolean
  onSelect: (s: Service) => void
}) {
  const [hovered, setHovered] = useState(false)
  const active = isSelected || hovered
  const displayMins = svc.durationMins ?? slotDuration

  return (
    <div
      onClick={() => onSelect(svc)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected
          ? 'var(--color-bg)'
          : hovered
            ? 'var(--color-surface2)'
            : 'var(--color-surface)',
        padding: '1.5rem 1.25rem',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: isSelected ? 'inset 0 0 0 1.5px var(--color-gold)' : 'none',
        transition: 'background .25s',
        minHeight: '100px',
      }}
    >
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '.75rem',
            right: '.75rem',
            width: '1.15rem',
            height: '1.15rem',
            background: 'var(--color-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-bg)',
            fontSize: '.55rem',
            borderRadius: '50%',
          }}
        >
          ✓
        </div>
      )}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          fontWeight: 400,
          marginBottom: '.3rem',
          color: isSelected ? 'var(--color-gold)' : 'var(--color-ink)',
          transition: 'color .2s',
          lineHeight: 1.15,
        }}
      >
        {svc.name}
      </div>
      {svc.price && (
        <div style={{ fontSize: '.76rem', color: 'var(--color-gold)', fontWeight: 400 }}>
          {svc.price}
        </div>
      )}
      <div
        style={{
          fontSize: '.8rem',
          color: 'var(--color-ink-dim)',
          fontWeight: 500,
          marginTop: '.4rem',
        }}
      >
        ⏱ {displayMins} min
      </div>
    </div>
  )
}
