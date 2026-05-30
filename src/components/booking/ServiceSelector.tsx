import { useState } from 'react'
import type { Service } from '../../types/booking'

export const SERVICES: Service[] = [
  { id: 'botox',        name: 'Toxina Botulínica', tag: 'Neuromodulador', duration: '45 min', price: 'Desde $350.000', icon: '◈' },
  { id: 'hialuronico',  name: 'Ácido Hialurónico', tag: 'Voluminizador',  duration: '60 min', price: 'Desde $550.000', icon: '◉' },
  { id: 'colageno',     name: 'Colágeno & PRP',    tag: 'Bioestimulación',duration: '75 min', price: 'Desde $480.000', icon: '◇' },
  { id: 'peeling',      name: 'Peeling Médico',    tag: 'Renovación',     duration: '50 min', price: 'Desde $280.000', icon: '◫' },
  { id: 'radio',        name: 'Radiofrecuencia',   tag: 'Reafirmación',   duration: '60 min', price: 'Desde $320.000', icon: '◎' },
  { id: 'labios',       name: 'Diseño de Labios',  tag: 'Diseño',         duration: '45 min', price: 'Desde $450.000', icon: '◈' },
]

interface Props {
  selected: Service | null
  onSelect: (svc: Service) => void
}

export default function ServiceSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <p style={{ fontSize: '.84rem', color: 'var(--color-ink-dim)', marginBottom: '1.5rem' }}>
        Selecciona el tratamiento de tu interés para comenzar.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1, background: 'var(--color-rim)', marginBottom: '2.5rem' }}>
        {SERVICES.map(svc => (
          <ServiceCard key={svc.id} svc={svc} isSelected={selected?.id === svc.id} onSelect={onSelect} />
        ))}
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
        padding: '1.75rem 2rem', cursor: 'pointer', position: 'relative',
        boxShadow: isSelected ? 'inset 0 0 0 1px var(--color-gold)' : 'none',
        transition: 'background .3s',
      }}
    >
      {/* Checkmark */}
      {isSelected && (
        <div style={{ position: 'absolute', top: '.9rem', right: '.9rem', width: '1.2rem', height: '1.2rem', background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg)', fontSize: '.6rem' }}>✓</div>
      )}
      <div style={{ fontSize: '1.2rem', marginBottom: '.7rem', color: active ? 'var(--color-gold)' : 'var(--color-ink-ghost)', transition: 'color .2s' }}>{svc.icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, marginBottom: '.3rem', color: isSelected ? 'var(--color-gold)' : 'var(--color-ink)', transition: 'color .2s' }}>{svc.name}</div>
      <div style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)', letterSpacing: '.08em' }}>{svc.duration} · {svc.price}</div>
    </div>
  )
}
