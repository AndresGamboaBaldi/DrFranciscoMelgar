import type { BookingFormData, Service, SelectedDate } from '../../types/booking'

interface SummaryProps { service: Service; date: SelectedDate; time: string }
interface Props {
  summary: SummaryProps
  data: BookingFormData
  onChange: (field: keyof BookingFormData, value: string | boolean) => void
  errors: Partial<Record<keyof BookingFormData, string>>
}

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatDate(d: SelectedDate) {
  const dt   = new Date(d.y, d.m, d.d)
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  return `${days[dt.getDay()]}, ${d.d} de ${MONTHS_ES[d.m]} de ${d.y}`
}

export default function ContactForm({ summary, data, onChange, errors }: Props) {
  return (
    <div>
      {/* Summary card */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <p style={{ fontSize: '.72rem', letterSpacing: '.17em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.85rem' }}>Resumen de tu Cita</p>
        {[
          { k: 'Servicio', v: summary.service.name },
          { k: 'Fecha',    v: formatDate(summary.date) },
          { k: 'Hora',     v: summary.time },
        ].map(row => (
          <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '.5rem 0', borderBottom: '1px solid var(--color-rim)', fontSize: '.9rem', gap: '1rem' }}>
            <span style={{ color: 'var(--color-ink-ghost)', fontSize: '.84rem', flexShrink: 0 }}>{row.k}</span>
            <span style={{ color: 'var(--color-ink)', textAlign: 'right' }}>{row.v}</span>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1.1rem 1.5rem', marginBottom: '1.75rem' }}>
        <Field label="Nombre Completo *" error={errors.name}>
          <input type="text" placeholder="Ej: María González" value={data.name} onChange={e => onChange('name', e.target.value)} style={{ borderColor: errors.name ? '#c47070' : undefined }} />
        </Field>
        <Field label="Teléfono / WhatsApp *" error={errors.phone}>
          <input type="tel" placeholder="+591 700 00000" value={data.phone} onChange={e => onChange('phone', e.target.value)} style={{ borderColor: errors.phone ? '#c47070' : undefined }} />
        </Field>
        <Field label="Edad">
          <input type="number" placeholder="Ej: 35" min={18} max={90} value={data.age} onChange={e => onChange('age', e.target.value)} />
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Comentarios o consulta previa (opcional)">
            <textarea placeholder="Cuéntanos sobre tus objetivos, alergias conocidas o cualquier información relevante..." value={data.notes} onChange={e => onChange('notes', e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
      <label style={{ fontSize: '.72rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: '.76rem', color: '#c47070' }}>{error}</span>}
    </div>
  )
}
