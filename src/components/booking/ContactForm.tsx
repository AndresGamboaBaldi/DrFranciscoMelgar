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
      {/* ── Summary ── */}
      <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-gold)', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <p style={{ fontSize: '.88rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', fontWeight: 500, marginBottom: '1rem' }}>
          Resumen de tu Cita
        </p>
        {[
          { k: 'Servicio', v: summary.service.name },
          { k: 'Fecha',    v: formatDate(summary.date) },
          { k: 'Hora',     v: summary.time },
        ].map((row, i, arr) => (
          <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '.6rem 0', borderBottom: i < arr.length - 1 ? '1px solid var(--color-rim)' : 'none', gap: '1rem' }}>
            <span style={{ fontSize: '.88rem', fontWeight: 400, letterSpacing: '.05em', color: 'var(--color-ink-dim)', flexShrink: 0 }}>{row.k}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, color: 'var(--color-ink)', textAlign: 'right', lineHeight: 1.3 }}>{row.v}</span>
          </div>
        ))}
      </div>



      {/* ── Fields ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' }}>
        <Field label="Nombre Completo *" error={errors.name}>
          <input type="text" placeholder="Ej: María González" value={data.name} onChange={e => onChange('name', e.target.value)}
            style={{ borderColor: errors.name ? '#c47070' : undefined, fontSize: '1rem' }} />
        </Field>
        <Field label="Teléfono / WhatsApp *" error={errors.phone}>
          <input type="tel" placeholder="+591 700 00000" value={data.phone} onChange={e => onChange('phone', e.target.value)}
            style={{ borderColor: errors.phone ? '#c47070' : undefined, fontSize: '1rem' }} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Edad">
            <input type="number" placeholder="35" min={18} max={90} value={data.age} onChange={e => onChange('age', e.target.value)}
              style={{ fontSize: '1rem' }} />
          </Field>
        </div>
        <Field label="Comentarios (opcional)">
          <textarea placeholder="Cuéntanos sobre tus objetivos, alergias o cualquier información relevante..." value={data.notes} onChange={e => onChange('notes', e.target.value)}
            style={{ fontSize: '.95rem', minHeight: '80px' }} />
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
      <label style={{ fontSize: '.76rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink)', fontWeight: 500 }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: '.78rem', color: '#c47070', fontWeight: 400 }}>{error}</span>}
    </div>
  )
}
