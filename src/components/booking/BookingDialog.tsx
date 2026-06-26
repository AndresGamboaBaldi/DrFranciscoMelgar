import { useState, useEffect, useRef } from 'react'
import ServiceSelector from './ServiceSelector'
import CalendarPicker from './CalendarPicker'
import ContactForm from './ContactForm'
import { createAppointment, getScheduleSettings, prefetchMonthBlocks } from '../../lib/supabase'
import { useProfessional } from '../../context/ProfessionalContext'
import type { BookingFormData, Service, SelectedDate } from '../../types/booking'
import type { StaffMember } from '../../types/professional'

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

function buildWhatsAppMessage({
  patientName,
  service,
  duration,
  date,
  time,
  phone,
}: {
  patientName: string
  service: string
  duration: string
  date: string
  time: string
  phone: string
}): string {
  const lines = [
    `*Nueva Cita*\n`,
    `*Nombre:* ${patientName}`,
    `*Servicio:* ${service}`,
    `*Duración:* ${duration}`,
    `*Fecha:* ${date}`,
    `*Hora:* ${time}`,
    `*Telefono:* ${phone}`,
  ]
  return lines.join('\n')
}

function formatTime12h(time: string): string {
  const [h, min] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(min).padStart(2, '0')} ${period}`
}

function formatTimeRange(time: string, durationMins: number): string {
  const [h, min] = time.split(':').map(Number)
  const startTotal = h * 60 + min
  const endTotal = startTotal + durationMins
  const endH = Math.floor(endTotal / 60) % 24
  const endM = endTotal % 60
  const start = formatTime12h(time)
  const end = formatTime12h(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`)
  return `${start} - ${end}`
}

function formatDate(d: SelectedDate) {
  const dt = new Date(d.y, d.m, d.d)
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  return `${days[dt.getDay()]}, ${d.d} de ${MONTHS_ES[d.m]} de ${d.y}`
}

const EMPTY_FORM: BookingFormData = { name: '', phone: '', notes: '', consent: false }

// steps: [profesional →] service → date → time → contact
type Step = number

interface Props {
  onClose: () => void
  initialStaff?: StaffMember
}

export default function BookingDialog({ onClose, initialStaff }: Props) {
  const pro = useProfessional()
  const hasStaff = !!pro.staff?.length

  const STEP_LABELS = hasStaff
    ? ['Profesional', 'Servicio', 'Fecha', 'Hora', 'Datos']
    : ['Servicio', 'Fecha', 'Hora', 'Datos']
  const TOTAL_STEPS = STEP_LABELS.length

  const [step, setStep] = useState<Step>(initialStaff ? 2 : 1)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(initialStaff ?? null)
  const [service, setService] = useState<Service | null>(null)
  const [date, setDate] = useState<SelectedDate | null>(null)
  const [time, setTime] = useState('')
  const [form, setForm] = useState<BookingFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({})
  const [slotDuration, setSlotDuration] = useState(30)
  const [loading, setLoading] = useState(false)

  const businessId = selectedStaff?.businessId ?? pro.businessId
  const phone = selectedStaff?.phone ?? pro.phone
  const timeSlots = selectedStaff?.timeSlots ?? pro.timeSlots
  const satTimeSlots = selectedStaff?.satTimeSlots ?? pro.satTimeSlots

  // Lock background scroll while the dialog is open so the overlay sits
  // fixed over everything (incl. fixed tab bars) without page scroll bleeding through.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    getScheduleSettings(businessId).then((s) => {
      if (s) setSlotDuration(s.slot_duration)
    })
    const now = new Date()
    prefetchMonthBlocks(businessId, now.getFullYear(), now.getMonth())
  }, [businessId])

  // Preload staff photos immediately so the carousel doesn't show blank/loading images
  useEffect(() => {
    pro.staff?.forEach((s) => {
      if (s.photo) {
        const img = new Image()
        img.src = s.photo
      }
    })
  }, [pro.staff])
  const [success, setSuccess] = useState(false)
  const [waUrl, setWaUrl] = useState('') // WhatsApp URL shown after success

  // Load Playfair Display for the footer brand mark
  useEffect(() => {
    const id = 'gf-playfair-display'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&display=swap'
    document.head.appendChild(link)
  }, [])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  const updateForm = (field: keyof BookingFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Campo requerido'
    if (!form.phone.trim()) e.phone = 'Campo requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate() || !service || !date || !time) return

    setLoading(true)
    try {
      const isoDate = `${date.y}-${String(date.m + 1).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
      await createAppointment({
        service: service.name,
        appointment_date: isoDate,
        appointment_time: time,
        name: form.name.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim() || 'Sin comentarios especiales',
        business_id: businessId,
        duration_mins: service.durationMins ?? slotDuration,
        setup_url: selectedStaff ? `/${pro.slug}/setup/${selectedStaff.id}` : `/${pro.slug}/setup`,
      })
      const waMessage = buildWhatsAppMessage({
        patientName: form.name.trim(),
        service: service.name,
        duration: `${service.durationMins ?? slotDuration} min`,
        date: formatDate(date),
        time,
        phone: form.phone.trim(),
      })
      const waFinalUrl = `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`
      setWaUrl(waFinalUrl)
      setSuccess(true)
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error. Por favor intenta de nuevo o contáctanos directamente.')
    } finally {
      setLoading(false)
    }
  }

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  const goBack = () => setStep((s) => Math.max(s - 1, 1))
  const reset = () => {
    setStep(1)
    setSelectedStaff(null)
    setService(null)
    setDate(null)
    setTime('')
    setForm(EMPTY_FORM)
    setErrors({})
    setSuccess(false)
    setWaUrl('')
  }

  const stepKind = STEP_LABELS[step - 1]
  const canNext =
    stepKind === 'Profesional'
      ? !!selectedStaff
      : stepKind === 'Servicio'
        ? !!service
        : stepKind === 'Fecha'
          ? !!date
          : stepKind === 'Hora'
            ? !!time
            : true

  return (
    /* Backdrop — click to close */
    <div className="booking-dialog-overlay" onClick={() => !loading && onClose()}>
      {/* Panel — stop propagation so clicking inside doesn't close */}
      <div className="booking-dialog-panel" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        {!success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--color-rim)',
              flexShrink: 0,
              gap: '1rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                fontWeight: 400,
                color: 'var(--color-ink)',
                lineHeight: 1,
              }}
            >
              Reservar <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Cita</em>
            </h2>

            {/* Cancel — only shown before success */}
            <button
              onClick={() => !loading && onClose()}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.4rem',
                background: 'var(--color-surface2)',
                border: '1px solid var(--color-rim-l)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-body)',
                fontSize: '.7rem',
                fontWeight: 400,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                padding: '.45rem 1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.4 : 1,
                transition: 'all .2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--color-rim)'
                  e.currentTarget.style.borderColor = 'var(--color-ink-ghost)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-surface2)'
                e.currentTarget.style.borderColor = 'var(--color-rim-l)'
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1 1l8 8M9 1L1 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Cancelar
            </button>
          </div>
        )}

        {/* ── Progress ── */}
        {!success && (
          <div
            style={{
              padding: '.9rem 1.25rem .75rem',
              borderBottom: '1px solid var(--color-rim)',
              flexShrink: 0,
            }}
          >
            {/* Bar */}
            <div
              style={{
                height: 2,
                background: 'var(--color-rim)',
                borderRadius: 1,
                marginBottom: '.85rem',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'var(--color-gold)',
                  width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`,
                  transition: 'width .4s cubic-bezier(0.16,1,0.3,1)',
                  borderRadius: 1,
                }}
              />
            </div>
            {/* Labels */}
            <div style={{ display: 'flex' }}>
              {STEP_LABELS.map((label, i) => {
                const n = (i + 1) as Step
                const active = n === step
                const done = n < step
                return (
                  <div
                    key={n}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.4rem',
                      paddingRight: '1rem',
                      opacity: active ? 1 : done ? 0.75 : 0.5,
                    }}
                  >
                    <div
                      style={{
                        width: '1.4rem',
                        height: '1.4rem',
                        border: `1.5px solid ${active ? 'var(--color-gold)' : done ? 'var(--color-ink-ghost)' : 'var(--color-rim-l)'}`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '.76rem',
                        flexShrink: 0,
                        background: active
                          ? 'var(--color-gold)'
                          : done
                            ? 'var(--color-ink-ghost)'
                            : 'transparent',
                        color: active || done ? 'var(--color-bg)' : 'var(--color-ink-dim)',
                        transition: 'all .3s',
                      }}
                    >
                      {done ? '✓' : n}
                    </div>
                    <span
                      style={{
                        fontSize: '.76rem',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: 'var(--color-ink)',
                        whiteSpace: 'nowrap',
                        fontWeight: active ? 400 : 300,
                      }}
                      className="hidden sm:inline"
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: success ? 0 : '1.25rem', minHeight: 0 }}>
          {success ? (
            <SuccessState
              name={form.name}
              waUrl={waUrl}
              service={service}
              date={date}
              time={time}
              durationMins={service?.durationMins ?? slotDuration}
              address={pro.address}
              addressDetail={pro.addressDetail}
              mapUrl={pro.mapUrl}
              onClose={onClose}
              onReset={reset}
            />
          ) : (
            <>
              {stepKind === 'Profesional' && pro.staff && (
                <StaffSelector
                  staff={pro.staff}
                  selected={selectedStaff}
                  onSelect={setSelectedStaff}
                />
              )}

              {stepKind === 'Servicio' && (
                <ServiceSelector
                  services={pro.services}
                  selected={service}
                  onSelect={setService}
                  slotDuration={slotDuration}
                />
              )}

              {stepKind === 'Fecha' && (
                <CalendarPicker
                  selectedDate={date}
                  selectedTime={time}
                  onDateChange={(d) => {
                    setDate(d)
                    setTime('')
                  }}
                  onTimeChange={setTime}
                  businessId={businessId}
                  serviceDurationMins={service?.durationMins}
                  view="calendar"
                  timeSlots={timeSlots}
                  satTimeSlots={satTimeSlots}
                />
              )}

              {stepKind === 'Hora' && date && (
                <CalendarPicker
                  selectedDate={date}
                  selectedTime={time}
                  onDateChange={(d) => {
                    setDate(d)
                    setTime('')
                  }}
                  onTimeChange={setTime}
                  businessId={businessId}
                  serviceDurationMins={service?.durationMins}
                  view="times"
                  timeSlots={timeSlots}
                  satTimeSlots={satTimeSlots}
                />
              )}

              {stepKind === 'Datos' && service && date && time && (
                <ContactForm
                  summary={{ service, date, time, slotDuration }}
                  data={form}
                  onChange={updateForm}
                  errors={errors}
                />
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!success && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '.9rem 1.25rem',
              borderTop: '1px solid var(--color-rim)',
              flexShrink: 0,
              gap: '1rem',
            }}
          >
            {step > 1 ? <BackBtn onClick={goBack} /> : <span />}
            {step < TOTAL_STEPS ? (
              <NextBtn disabled={!canNext} onClick={goNext}>
                Continuar
              </NextBtn>
            ) : (
              <NextBtn disabled={loading} onClick={submit}>
                {loading ? 'Enviando…' : 'Confirmar Cita'}
              </NextBtn>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Staff selector (step 1, agencies only) — carousel ── */
function StaffSelector({
  staff,
  selected,
  onSelect,
}: {
  staff: StaffMember[]
  selected: StaffMember | null
  onSelect: (s: StaffMember) => void
}) {
  const activeIndex = Math.max(
    0,
    staff.findIndex((s) => s.id === selected?.id),
  )
  const [index, setIndex] = useState(selected ? activeIndex : 0)

  useEffect(() => {
    if (!selected && staff.length) onSelect(staff[0])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (dir: 1 | -1) => {
    const next = (index + dir + staff.length) % staff.length
    setIndex(next)
    onSelect(staff[next])
  }

  const current = staff[index]

  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    go(delta < 0 ? 1 : -1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.1rem' }}>
      <p style={{ fontSize: '1rem', color: 'var(--color-ink)', textAlign: 'center' }}>
        ¿Con quién quieres tu cita?
      </p>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '17rem',
        }}
      >
        {/* prev arrow */}
        {staff.length > 1 && (
          <button
            onClick={() => go(-1)}
            aria-label="Anterior"
            style={{
              position: 'absolute',
              left: 0,
              zIndex: 3,
              width: '2.2rem',
              height: '2.2rem',
              borderRadius: '50%',
              border: '1px solid var(--color-rim)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            ‹
          </button>
        )}

        {/* cards */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'pan-y',
          }}
        >
          {staff.map((s, i) => {
            const offset = i - index
            const isCenter = offset === 0
            // wrap-around offset for nicer looping with >2 staff
            let pos = offset
            if (pos > staff.length / 2) pos -= staff.length
            if (pos < -staff.length / 2) pos += staff.length

            if (Math.abs(pos) > 1) return null

            return (
              <div
                key={s.id}
                onClick={() => {
                  setIndex(i)
                  onSelect(s)
                }}
                style={{
                  position: 'absolute',
                  width: isCenter ? '11rem' : '8.5rem',
                  height: isCenter ? '15.5rem' : '12.5rem',
                  transform: `translateX(${pos * 85}%) scale(${isCenter ? 1 : 0.85})`,
                  zIndex: isCenter ? 2 : 1,
                  opacity: isCenter ? 1 : 0.4,
                  cursor: 'pointer',
                  border: `1.5px solid ${isCenter ? 'var(--color-gold)' : 'var(--color-rim)'}`,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  transition: 'all .35s ease',
                  boxShadow: isCenter ? '0 8px 30px rgba(0,0,0,.35)' : 'none',
                }}
              >
                {s.photo ? (
                  <img
                    src={s.photo}
                    alt=""
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: '3rem',
                      color: 'var(--color-gold)',
                    }}
                  >
                    {s.name.charAt(0)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* next arrow */}
        {staff.length > 1 && (
          <button
            onClick={() => go(1)}
            aria-label="Siguiente"
            style={{
              position: 'absolute',
              right: 0,
              zIndex: 3,
              width: '2.2rem',
              height: '2.2rem',
              borderRadius: '50%',
              border: '1px solid var(--color-rim)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            ›
          </button>
        )}
      </div>

      {/* name + title */}
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            letterSpacing: '.04em',
            color: 'var(--color-ink)',
            textTransform: 'uppercase',
            fontWeight: 400,
          }}
        >
          {current.shortName ?? current.name}
        </p>
        {current.title && (
          <p
            style={{
              fontSize: '.72rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
              marginTop: '.25rem',
            }}
          >
            {current.title}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Shared buttons ── */

function NextBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '.6rem',
        padding: '.75rem 1.6rem',
        background: disabled ? 'var(--color-rim-l)' : 'var(--color-gold)',
        color: disabled ? 'var(--color-ink-ghost)' : 'var(--color-bg)',
        fontFamily: 'var(--font-body)',
        fontSize: '.7rem',
        fontWeight: 400,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background .3s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'var(--color-gold-l)'
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = 'var(--color-gold)'
      }}
    >
      {children}
      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
        <path
          d="M7 1l3 3.5L7 8M1 4.5h9"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: '1px solid var(--color-rim-l)',
        color: 'var(--color-ink-dim)',
        fontFamily: 'var(--font-body)',
        fontSize: '.7rem',
        fontWeight: 300,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        padding: '.75rem 1.4rem',
        cursor: 'pointer',
        transition: 'all .2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--color-ink)'
        e.currentTarget.style.borderColor = 'var(--color-ink-ghost)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--color-ink-dim)'
        e.currentTarget.style.borderColor = 'var(--color-rim-l)'
      }}
    >
      ← Atrás
    </button>
  )
}

function buildICS(
  service: Service,
  date: SelectedDate,
  time: string,
  durationMins: number,
): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const [h, min] = time.split(':').map(Number)
  const dtStart = `${date.y}${pad(date.m + 1)}${pad(date.d)}T${pad(h)}${pad(min)}00`
  const endDate = new Date(date.y, date.m, date.d, h, min + durationMins)
  const dtEnd = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`
  const stamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pro.bo//Citas//ES',
    'BEGIN:VEVENT',
    `UID:${stamp}@pro.bo`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${service.name}`,
    `DTSTAMP:${stamp}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function SuccessState({
  name,
  waUrl,
  service,
  date,
  time,
  durationMins,
  address,
  addressDetail,
  mapUrl,
  onClose,
  onReset,
}: {
  name: string
  waUrl: string
  service: Service | null
  date: SelectedDate | null
  time: string
  durationMins: number
  address?: string
  addressDetail?: string
  mapUrl?: string
  onClose: () => void
  onReset: () => void
}) {
  const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
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
  const dayLabel = date
    ? `${DAYS_ES[new Date(date.y, date.m, date.d).getDay()]} ${date.d} de ${MONTHS_ES[date.m]}`
    : ''

  const downloadICS = () => {
    if (!service || !date) return
    const ics = buildICS(service, date, time, durationMins)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cita.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const summaryRows = [
    { label: 'Servicio', value: service?.name ?? '' },
    { label: 'Fecha', value: dayLabel },
    { label: 'Hora', value: formatTimeRange(time, durationMins) },
  ]

  const addressLine = address?.split('\n')[0] ?? ''

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
        padding: '2rem 1.5rem',
        background: 'var(--color-bg)',
        textAlign: 'center',
      }}
    >
      {/* ── Check icon ── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: '3rem',
            height: '3rem',
            border: '1.5px solid var(--color-gold)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gold)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
        </div>
      </div>

      {/* ── Title ── */}
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2rem',
            fontWeight: 700,
            lineHeight: 1.05,
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            letterSpacing: '.04em',
          }}
        >
          ¡Cita confirmada!
        </h3>
      </div>

      {/* ── Greeting ── */}
      <div>
        <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>
          Gracias, {name ? `${name.split(' ')[0]}` : ''}. Tu espacio ha sido reservado con éxito.
        </p>
      </div>

      {/* ── Summary table ── */}
      <div style={{ borderTop: '1px solid var(--color-rim)' }}>
        {summaryRows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '.8rem 0',
              borderBottom: '1px solid var(--color-rim)',
            }}
          >
            <span
              style={{
                fontSize: '.68rem',
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--color-ink-ghost)',
              }}
            >
              {row.label}
            </span>
            <span style={{ fontSize: '.92rem', color: 'var(--color-ink)', fontWeight: 600 }}>
              {row.value}
            </span>
          </div>
        ))}

        {/* ── Location row ── */}
        {addressLine && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '.8rem 0',
              borderBottom: '1px solid var(--color-rim)',
            }}
          >
            <span
              style={{
                fontSize: '.68rem',
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--color-ink-ghost)',
              }}
            >
              Ubicación
            </span>
            <div style={{ textAlign: 'right' }}>
              {mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '.35rem',
                    fontSize: '.92rem',
                    fontWeight: 600,
                    color: 'var(--color-gold)',
                    textDecoration: 'none',
                  }}
                >
                  {addressLine}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </a>
              ) : (
                <span style={{ fontSize: '.92rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                  {addressLine}
                </span>
              )}
              {addressDetail && (
                <p style={{ fontSize: '1rem', color: 'var(--color-ink-dim)', marginTop: '.15rem' }}>
                  {addressDetail}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Save reminder ── */}
      <p
        style={{
          fontSize: '.7rem',
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: 'var(--color-ink)',
        }}
      >
        Guarda tu cita para no olvidarla (opcional)
      </p>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '.6rem',
              padding: '.85rem 1rem',
              background: 'none',
              border: '1.5px solid var(--color-gold)',
              color: 'var(--color-gold)',
              fontFamily: 'var(--font-body)',
              fontSize: '.75rem',
              fontWeight: 500,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all .3s',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(196,153,90,.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.057 23.5l5.799-1.52A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.659-.493-5.19-1.355l-.371-.221-3.845 1.008 1.025-3.741-.242-.385A9.947 9.947 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            Enviar por WhatsApp
          </a>
        )}
        {window.matchMedia('(pointer: coarse)').matches && (
          <button
            onClick={downloadICS}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '.6rem',
              padding: '.85rem 1rem',
              background: 'none',
              border: '1.5px solid var(--color-gold)',
              color: 'var(--color-gold)',
              fontFamily: 'var(--font-body)',
              fontSize: '.75rem',
              fontWeight: 500,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all .3s',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(196,153,90,.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Añadir a Calendario
          </button>
        )}
        {window.matchMedia('(pointer: coarse)').matches && (
          <p
            style={{
              fontSize: '.72rem',
              color: 'var(--color-ink-ghost)',
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            En iPhone, toca{' '}
            <strong style={{ color: 'var(--color-ink-dim)' }}>"Agregar al calendario"</strong> — no
            el ✓ de arriba.
          </p>
        )}
        <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem' }}>
          <button
            onClick={onReset}
            style={{
              flex: 1,
              padding: '.85rem .5rem',
              background: 'var(--color-gold)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-body)',
              fontSize: '.72rem',
              fontWeight: 600,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              transition: 'background .3s',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-gold-l)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-gold)')}
          >
            Nueva cita
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '.85rem .5rem',
              background: 'none',
              border: '1px solid var(--color-rim-l)',
              color: 'var(--color-ink-dim)',
              fontFamily: 'var(--font-body)',
              fontSize: '.72rem',
              fontWeight: 600,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all .2s',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-ink)'
              e.currentTarget.style.borderColor = 'var(--color-ink-ghost)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-ink-dim)'
              e.currentTarget.style.borderColor = 'var(--color-rim-l)'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* ── Footer brand (always gold, regardless of professional theme) ── */}
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.1rem',
          letterSpacing: '.08em',
          color: 'var(--color-ink-ghost)',
          marginTop: '.5rem',
        }}
      >
        Pro<em style={{ fontStyle: 'italic', color: '#c4995a' }}>bo</em>.pro
      </p>
    </div>
  )
}
