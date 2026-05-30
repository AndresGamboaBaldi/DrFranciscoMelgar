import type { BookingFormData } from '../../types/booking'
import type { Service, SelectedDate } from '../../types/booking'

interface SummaryProps {
  service: Service
  date: SelectedDate
  time: string
}

interface Props {
  summary: SummaryProps
  data: BookingFormData
  onChange: (field: keyof BookingFormData, value: string | boolean) => void
  errors: Partial<Record<keyof BookingFormData, string>>
}

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatDate(d: SelectedDate) {
  const dt = new Date(d.y, d.m, d.d)
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  return `${days[dt.getDay()]}, ${d.d} de ${MONTHS_ES[d.m]} de ${d.y}`
}

export default function ContactForm({ summary, data, onChange, errors }: Props) {
  return (
    <div>
      {/* Booking summary */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.5rem', marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '.63rem', letterSpacing: '.17em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1rem' }}>Resumen de tu Cita</h4>
        {[
          { k: 'Tratamiento', v: summary.service.name },
          { k: 'Fecha',       v: formatDate(summary.date) },
          { k: 'Hora',        v: summary.time },
        ].map(row => (
          <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '.55rem 0', borderBottom: '1px solid var(--color-rim)', fontSize: '.82rem' }}>
            <span style={{ color: 'var(--color-ink-ghost)', fontSize: '.74rem' }}>{row.k}</span>
            <span style={{ color: 'var(--color-ink)', textAlign: 'right', maxWidth: '60%' }}>{row.v}</span>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem 1.75rem', marginBottom: '2rem' }}>
        <Field label="Nombre Completo *" error={errors.name}>
          <input type="text" placeholder="Ej: María González" value={data.name} onChange={e => onChange('name', e.target.value)} style={{ borderColor: errors.name ? '#c47070' : undefined }} />
        </Field>
        <Field label="Teléfono / WhatsApp *" error={errors.phone}>
          <input type="tel" placeholder="+57 300 000 0000" value={data.phone} onChange={e => onChange('phone', e.target.value)} style={{ borderColor: errors.phone ? '#c47070' : undefined }} />
        </Field>
        <Field label="Correo Electrónico *" error={errors.email}>
          <input type="email" placeholder="tu@correo.com" value={data.email} onChange={e => onChange('email', e.target.value)} style={{ borderColor: errors.email ? '#c47070' : undefined }} />
        </Field>
        <Field label="Edad">
          <input type="number" placeholder="Ej: 35" min={18} max={90} value={data.age} onChange={e => onChange('age', e.target.value)} />
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Comentarios o Consulta Previa">
            <textarea placeholder="Cuéntanos sobre tus objetivos, alergias conocidas o cualquier información relevante..." value={data.notes} onChange={e => onChange('notes', e.target.value)} />
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', cursor: 'pointer', fontSize: '.78rem', color: errors.consent ? '#c47070' : 'var(--color-ink-dim)', textTransform: 'none', letterSpacing: 0 }}>
            <input type="checkbox" checked={data.consent} onChange={e => onChange('consent', e.target.checked)}
              style={{ width: '1rem', height: '1rem', flexShrink: 0, marginTop: '.1rem', accentColor: 'var(--color-gold)', cursor: 'pointer' }} />
            <span>Acepto los términos y condiciones y la política de privacidad de la clínica.</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
      <label style={{ fontSize: '.63rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: '.7rem', color: '#c47070' }}>{error}</span>}
    </div>
  )
}
