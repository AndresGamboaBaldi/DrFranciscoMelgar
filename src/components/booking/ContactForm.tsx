import type { BookingFormData, Service, SelectedDate } from '../../types/booking'

interface SummaryProps {
  service: Service
  date: SelectedDate
  time: string
  slotDuration: number
}
interface Props {
  summary: SummaryProps
  data: BookingFormData
  onChange: (field: keyof BookingFormData, value: string | boolean) => void
  errors: Partial<Record<keyof BookingFormData, string>>
  businessId: string
  paymentNotice?: { pct: number }
}

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function formatDate(d: SelectedDate) {
  return `${d.d} de ${MONTHS_ES[d.m]}`
}

function formatTimeStart(time: string): string {
  const [h, min] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(min).padStart(2, '0')} ${period}`
}

export default function ContactForm({ summary, data, onChange, errors, paymentNotice }: Props) {
  return (
    <div style={{ paddingTop: '.25rem' }}>
      {/* ── Summary ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        {/* Tab / orejita */}
        <div style={{
          display: 'inline-block',
          padding: '.28rem .75rem',
          background: 'var(--color-gold)',
          fontSize: '.68rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase',
          color: 'var(--color-bg)',
        }}>
          Resumen de tu cita
        </div>
        {/* Body */}
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '.25rem .4rem',
          padding: '.6rem .85rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-gold)',
          fontSize: '1rem',
        }}>
          {[
            summary.service.name,
            formatDate(summary.date),
            formatTimeStart(summary.time),
          ].map((v, i) => (
            <>
              {i > 0 && <span key={`sep-${i}`} style={{ color: 'var(--color-ink-ghost)', flexShrink: 0 }}>·</span>}
              <span key={v} style={{ color: 'var(--color-ink-dim)' }}>{v}</span>
            </>
          ))}
        </div>
      </div>

      {/* ── Payment notice ── */}
      {paymentNotice && (
        <div style={{
          marginBottom: '1rem',
          padding: '.65rem .85rem',
          background: 'rgba(196,160,48,0.08)',
          border: '1px solid rgba(196,160,48,0.3)',
          display: 'flex', alignItems: 'flex-start', gap: '.5rem',
        }}>
          <svg style={{ flexShrink: 0, marginTop: '.1rem' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c4a030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize: '.78rem', color: 'var(--color-ink-dim)', lineHeight: 1.5, margin: 0 }}>
            Para confirmar se requerirá un pago del <strong style={{ color: 'var(--color-ink)' }}>{paymentNotice.pct}%</strong> vía QR al finalizar.
          </p>
        </div>
      )}

      {/* ── Fields ── */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' }}
      >
        <Field label="Nombre Completo" required error={errors.name}>
          <input
            type="text"
            autoComplete="name"
            placeholder="Ej: María González"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            style={{ borderColor: errors.name ? '#c47070' : undefined, fontSize: '1rem' }}
          />
        </Field>
        <Field label="Teléfono / WhatsApp" required error={errors.phone}>
          <input
            type="tel"
            autoComplete="tel"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            style={{ borderColor: errors.phone ? '#c47070' : undefined, fontSize: '1rem' }}
          />
        </Field>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  error,
  required,
}: {
  label: string
  children: React.ReactNode
  error?: string
  required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
      <label
        style={{
          fontSize: '.76rem',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: 'var(--color-ink)',
          fontWeight: 500,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--color-gold)', marginLeft: '.2rem' }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: '.78rem', color: '#c47070', fontWeight: 400 }}>{error}</span>
      )}
    </div>
  )
}
