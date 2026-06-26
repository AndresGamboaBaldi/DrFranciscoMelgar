import { useState, useEffect } from 'react'
import Reveal from '../Reveal'
import ServiceSelector from './ServiceSelector'
import CalendarPicker from './CalendarPicker'
import ContactForm from './ContactForm'
import { createAppointment, getScheduleSettings } from '../../lib/supabase'
import { notifyDoctor } from '../../lib/whatsapp'
import { useProfessional } from '../../context/ProfessionalContext'
import type { BookingStep, BookingFormData, Service, SelectedDate } from '../../types/booking'

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatDate(d: SelectedDate) {
  const dt   = new Date(d.y, d.m, d.d)
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  return `${days[dt.getDay()]}, ${d.d} de ${MONTHS_ES[d.m]} de ${d.y}`
}

const EMPTY_FORM: BookingFormData = { name: '', phone: '', notes: '', consent: false }

export default function BookingSection() {
  const pro = useProfessional()

  const [step, setStep]       = useState<BookingStep>(1)
  const [service, setService] = useState<Service | null>(null)
  const [date, setDate]       = useState<SelectedDate | null>(null)
  const [time, setTime]       = useState('')
  const [form, setForm]       = useState<BookingFormData>(EMPTY_FORM)
  const [errors, setErrors]   = useState<Partial<Record<keyof BookingFormData, string>>>({})
  const [slotDuration, setSlotDuration] = useState(30)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getScheduleSettings(pro.businessId).then(s => { if (s) setSlotDuration(s.slot_duration) })
  }, [pro.businessId])

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
        service:          service.name,
        appointment_date: isoDate,
        appointment_time: time,
        name:  form.name.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim() || 'Sin comentarios especiales',
        duration_mins: service?.durationMins ?? slotDuration,
        business_id: pro.businessId,
        setup_url: `/${pro.slug}/setup`,
      })
      // Build the calendar sync URL dynamically (works in dev and production)
      const calendarPageUrl = pro.calendarFeedUrl
        ? `${window.location.origin}/${pro.slug}/calendar`
        : undefined

      await notifyDoctor({
        patientName:     form.name.trim(),
        service:         service.name,
        date:            formatDate(date),
        time,
        phone:           form.phone.trim(),
        doctorPhone:     pro.phone,
        calendarPageUrl,
      })
      setSuccess(true)
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error al guardar tu cita. Por favor intenta de nuevo o contáctanos directamente.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1); setService(null); setDate(null); setTime('')
    setForm(EMPTY_FORM); setErrors({}); setSuccess(false)
  }

  return (
    <section id="citas" className="s-pad" style={{ background: 'var(--color-surface)' }}>
      <div className="s-header">
        <div>
<Reveal delay={100}><h2 className="s-title">Agenda tu<br /><em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Cita</em></h2></Reveal>
        </div>
        <Reveal delay={200}><p style={{ maxWidth: '26rem', fontSize: '.93rem', lineHeight: 1.9, color: 'var(--color-ink-dim)', fontWeight: 300 }}>Selecciona tu servicio, elige fecha y hora, y completa tus datos. Confirmamos en menos de 24 horas.</p></Reveal>
      </div>

      <Reveal>
        <div style={{ maxWidth: '62rem', margin: '0 auto' }}>
          {success ? <SuccessState onReset={reset} /> : (
            <>
              <StepNav step={step} />
              {step === 1 && <ServiceSelector services={pro.services} selected={service} onSelect={setService} slotDuration={slotDuration} />}
              {step === 2 && <CalendarPicker selectedDate={date} selectedTime={time} onDateChange={d => { setDate(d); setTime('') }} onTimeChange={setTime} businessId={pro.businessId} timeSlots={pro.timeSlots} satTimeSlots={pro.satTimeSlots} />}
              {step === 3 && service && date && time && <ContactForm summary={{ service, date, time, slotDuration }} data={form} onChange={updateForm} errors={errors} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2rem', borderTop: '1px solid var(--color-rim)' }}>
                {step > 1 ? <BackBtn onClick={() => setStep(s => Math.max(s-1,1) as BookingStep)} /> : <span />}
                {step < 3
                  ? <NextBtn disabled={(step===1 && !service)||(step===2 && (!date||!time))} onClick={() => setStep(s => Math.min(s+1,3) as BookingStep)}>Continuar</NextBtn>
                  : <NextBtn disabled={loading} onClick={submit}>{loading ? 'Enviando…' : 'Confirmar Cita'}</NextBtn>
                }
              </div>
            </>
          )}
        </div>
      </Reveal>
    </section>
  )
}

function StepNav({ step }: { step: BookingStep }) {
  const steps = ['Servicio', 'Fecha & Hora', 'Datos']
  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--color-rim)', marginBottom: '1.25rem', borderRadius: 1 }}>
        <div style={{ height: '100%', background: 'var(--color-gold)', width: `${((step - 1) / 2) * 100}%`, transition: 'width .4s cubic-bezier(0.16,1,0.3,1)', borderRadius: 1 }} />
      </div>
      {/* Steps */}
      <div style={{ display: 'flex', gap: 0 }}>
        {steps.map((label, i) => {
          const n      = i + 1
          const active = n === step
          const done   = n < step
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', paddingRight: '1.5rem', opacity: active ? 1 : done ? .6 : .35, transition: 'opacity .3s' }}>
              <div style={{ width: '1.6rem', height: '1.6rem', border: `1.5px solid ${active ? 'var(--color-gold)' : done ? 'var(--color-ink-ghost)' : 'var(--color-rim-l)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', flexShrink: 0, background: active ? 'var(--color-gold)' : done ? 'var(--color-ink-ghost)' : 'transparent', color: (active || done) ? 'var(--color-bg)' : 'var(--color-ink-dim)', transition: 'all .3s', borderRadius: '50%' }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: '.75rem', letterSpacing: '.1em', textTransform: 'uppercase', color: active ? 'var(--color-ink)' : 'var(--color-ink-dim)', whiteSpace: 'nowrap' }} className="hidden sm:inline">
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NextBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '.7rem', padding: '.85rem 2rem', background: disabled ? 'var(--color-rim-l)' : 'var(--color-gold)', color: disabled ? 'var(--color-ink-ghost)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.84rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background .3s' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--color-gold-l)' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'var(--color-gold)' }}
    >
      {children}
      <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M7.5 1l3.5 3.5L7.5 8M1 4.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: 'none', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.84rem', fontWeight: 300, letterSpacing: '.1em', textTransform: 'uppercase', padding: '.75rem 1.5rem', cursor: 'pointer', transition: 'all .3s' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
    >← Atrás</button>
  )
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
      <div style={{ width: '4rem', height: '4rem', border: '1px solid var(--color-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--color-gold)', fontSize: '1.4rem' }}>✓</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2.2rem', fontWeight: 300, marginBottom: '.75rem' }}>¡Cita Solicitada!</h3>
      <p style={{ fontSize: '.93rem', color: 'var(--color-ink-dim)', maxWidth: '28rem', margin: '0 auto 2rem', lineHeight: 1.9 }}>
        Hemos recibido tu solicitud. Te contactaremos pronto para confirmar.<br /><br />
        <span style={{ color: 'var(--color-gold)' }}>¡Te esperamos!</span>
      </p>
      <button onClick={onReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '.7rem', padding: '.85rem 2rem', background: 'transparent', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.84rem', fontWeight: 300, letterSpacing: '.14em', textTransform: 'uppercase', border: '1px solid var(--color-rim-l)', cursor: 'pointer', transition: 'all .3s' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
      >Nueva Cita</button>
    </div>
  )
}
