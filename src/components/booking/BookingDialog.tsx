import { useState, useEffect } from 'react'
import ServiceSelector from './ServiceSelector'
import CalendarPicker  from './CalendarPicker'
import ContactForm     from './ContactForm'
import { createAppointment } from '../../lib/supabase'
import { useProfessional }   from '../../context/ProfessionalContext'
import type { BookingFormData, Service, SelectedDate } from '../../types/booking'

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function buildWhatsAppMessage({ patientName, service, date, time, phone }: {
  patientName: string; service: string; date: string; time: string; phone: string
}): string {
  const lines = [
    `*Nueva Cita*\n`,
    `*Paciente:* ${patientName}`,
    `*Servicio:* ${service}`,
    `*Fecha:* ${date}`,
    `*Hora:* ${time}`,
    `*Telefono:* ${phone}`,
  ]
  return lines.join('\n')
}

function formatDate(d: SelectedDate) {
  const dt   = new Date(d.y, d.m, d.d)
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  return `${days[dt.getDay()]}, ${d.d} de ${MONTHS_ES[d.m]} de ${d.y}`
}

const EMPTY_FORM: BookingFormData = { name: '', phone: '', age: '', notes: '', consent: false }

// 4 steps: service → date → time → contact
type Step = 1 | 2 | 3 | 4

const STEP_LABELS = ['Servicio', 'Fecha', 'Hora', 'Datos']

interface Props { onClose: () => void }

export default function BookingDialog({ onClose }: Props) {
  const pro = useProfessional()

  const [step, setStep]       = useState<Step>(1)
  const [service, setService] = useState<Service | null>(null)
  const [date, setDate]       = useState<SelectedDate | null>(null)
  const [time, setTime]       = useState('')
  const [form, setForm]       = useState<BookingFormData>(EMPTY_FORM)
  const [errors, setErrors]   = useState<Partial<Record<keyof BookingFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [waUrl,   setWaUrl]   = useState('')   // WhatsApp URL shown after success

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  const updateForm = (field: keyof BookingFormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.name.trim())  e.name  = 'Campo requerido'
    if (!form.phone.trim()) e.phone = 'Campo requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate() || !service || !date || !time) return

    setLoading(true)
    try {
      const isoDate = `${date.y}-${String(date.m + 1).padStart(2,'0')}-${String(date.d).padStart(2,'0')}`
      await createAppointment({
        service: service.name, appointment_date: isoDate, appointment_time: time,
        name:  form.name.trim(), phone: form.phone.trim(),
        age:   form.age ? parseInt(form.age) : null,
        notes: form.notes.trim() || undefined,
        doctor_id: pro.doctorId,
      })
      const waMessage = buildWhatsAppMessage({ patientName: form.name.trim(), service: service.name, date: formatDate(date), time, phone: form.phone.trim() })
      const waFinalUrl = `https://wa.me/${pro.phone}?text=${encodeURIComponent(waMessage)}`
      setWaUrl(waFinalUrl)
      setSuccess(true)
      window.open(waFinalUrl, '_blank')
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error. Por favor intenta de nuevo o contáctanos directamente.')
    } finally {
      setLoading(false)
    }
  }

  const goNext = () => setStep(s => Math.min(s + 1, 4) as Step)
  const goBack = () => setStep(s => Math.max(s - 1, 1) as Step)
  const reset  = () => { setStep(1); setService(null); setDate(null); setTime(''); setForm(EMPTY_FORM); setErrors({}); setSuccess(false); setWaUrl('') }

  const canNext =
    step === 1 ? !!service :
    step === 2 ? !!date :
    step === 3 ? !!time : true

  return (
    /* Backdrop — click to close */
    <div className="booking-dialog-overlay" onClick={() => !loading && onClose()}>

      {/* Panel — stop propagation so clicking inside doesn't close */}
      <div className="booking-dialog-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-rim)', flexShrink: 0, gap: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1 }}>
            {success
              ? <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>¡Reserva confirmada!</em>
              : <>Reservar <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Cita</em></>
            }
          </h2>

          {/* Cancel — only shown before success */}
          {!success && <button onClick={() => !loading && onClose()} disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '.4rem',
              background: 'var(--color-surface2)',
              border: '1px solid var(--color-rim-l)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-body)', fontSize: '.7rem',
              fontWeight: 400, letterSpacing: '.08em', textTransform: 'uppercase',
              padding: '.45rem 1rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? .4 : 1, transition: 'all .2s', flexShrink: 0,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--color-rim)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface2)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Cancelar
          </button>}
        </div>

        {/* ── Progress ── */}
        {!success && (
          <div style={{ padding: '.9rem 1.25rem .75rem', borderBottom: '1px solid var(--color-rim)', flexShrink: 0 }}>
            {/* Bar */}
            <div style={{ height: 2, background: 'var(--color-rim)', borderRadius: 1, marginBottom: '.85rem' }}>
              <div style={{ height: '100%', background: 'var(--color-gold)', width: `${((step - 1) / 3) * 100}%`, transition: 'width .4s cubic-bezier(0.16,1,0.3,1)', borderRadius: 1 }} />
            </div>
            {/* Labels */}
            <div style={{ display: 'flex' }}>
              {STEP_LABELS.map((label, i) => {
                const n = i + 1 as Step
                const active = n === step
                const done   = n < step
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', paddingRight: '1rem', opacity: active ? 1 : done ? .75 : .5 }}>
                    <div style={{ width: '1.4rem', height: '1.4rem', border: `1.5px solid ${active ? 'var(--color-gold)' : done ? 'var(--color-ink-ghost)' : 'var(--color-rim-l)'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.76rem', flexShrink: 0, background: active ? 'var(--color-gold)' : done ? 'var(--color-ink-ghost)' : 'transparent', color: (active || done) ? 'var(--color-bg)' : 'var(--color-ink-dim)', transition: 'all .3s' }}>
                      {done ? '✓' : n}
                    </div>
                    <span style={{ fontSize: '.76rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-ink)', whiteSpace: 'nowrap', fontWeight: active ? 400 : 300 }} className="hidden sm:inline">
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', minHeight: 0 }}>
          {success ? (
            <SuccessState name={form.name} waUrl={waUrl} onClose={onClose} onReset={reset} />
          ) : (
            <>
              {step === 1 && <ServiceSelector services={pro.services} selected={service} onSelect={setService} />}

              {step === 2 && (
                <CalendarPicker
                  selectedDate={date} selectedTime={time}
                  onDateChange={d => { setDate(d); setTime('') }}
                  onTimeChange={setTime}
                  doctorId={pro.doctorId} bookingConfig={pro.bookingConfig}
                  view="calendar"
                />
              )}

              {step === 3 && date && (
                <CalendarPicker
                  selectedDate={date} selectedTime={time}
                  onDateChange={d => { setDate(d); setTime('') }}
                  onTimeChange={setTime}
                  doctorId={pro.doctorId} bookingConfig={pro.bookingConfig}
                  view="times"
                />
              )}

              {step === 4 && service && date && time && (
                <ContactForm summary={{ service, date, time }} data={form} onChange={updateForm} errors={errors} />
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!success && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.9rem 1.25rem', borderTop: '1px solid var(--color-rim)', flexShrink: 0, gap: '1rem' }}>
            {step > 1 ? <BackBtn onClick={goBack} /> : <span />}
            {step < 4
              ? <NextBtn disabled={!canNext} onClick={goNext}>Continuar</NextBtn>
              : <NextBtn disabled={loading} onClick={submit}>{loading ? 'Enviando…' : 'Confirmar Cita'}</NextBtn>
            }
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Shared buttons ── */

function NextBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.75rem 1.6rem', background: disabled ? 'var(--color-rim-l)' : 'var(--color-gold)', color: disabled ? 'var(--color-ink-ghost)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background .3s' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--color-gold-l)' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'var(--color-gold)' }}
    >
      {children}
      <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M7 1l3 3.5L7 8M1 4.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: 'none', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 300, letterSpacing: '.1em', textTransform: 'uppercase', padding: '.75rem 1.4rem', cursor: 'pointer', transition: 'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
    >← Atrás</button>
  )
}

function SuccessState({ name, waUrl, onClose, onReset }: { name: string; waUrl: string; onClose: () => void; onReset: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <div style={{ width: '3.5rem', height: '3.5rem', border: '1.5px solid var(--color-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--color-gold)', fontSize: '1.2rem' }}>✓</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.9rem', fontWeight: 300, marginBottom: '.4rem' }}>¡Cita Solicitada!</h3>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--color-ink-dim)', marginBottom: '1.25rem' }}>
        Gracias{name ? `, ${name.split(' ')[0]}` : ''}. Te contactaremos pronto para confirmar.
      </p>
      <p style={{ fontSize: '.9rem', color: 'var(--color-gold)', marginBottom: '2rem' }}>¡Te esperamos!</p>
      {/* All buttons same width, stacked */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
        {/* WhatsApp */}
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem', padding: '.85rem 1rem', background: '#25D366', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '.75rem', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background .3s', width: '100%' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1fb855')}
            onMouseLeave={e => (e.currentTarget.style.background = '#25D366')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.057 23.5l5.799-1.52A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.659-.493-5.19-1.355l-.371-.221-3.845 1.008 1.025-3.741-.242-.385A9.947 9.947 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            Enviar por WhatsApp
          </a>
        )}
        {/* Cerrar + Nueva Cita — same combined width as WhatsApp */}
        <div style={{ display: 'flex', gap: '.65rem', width: '100%' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '.85rem .5rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-l)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
          >Cerrar</button>
          <button onClick={onReset}
            style={{ flex: 1, padding: '.85rem .5rem', background: 'none', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 300, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
          >Nueva Cita</button>
        </div>
      </div>
    </div>
  )
}
