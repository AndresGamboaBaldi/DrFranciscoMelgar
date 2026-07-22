import { useState, useEffect, useRef } from 'react'
import ServiceSelector from './ServiceSelector'
import CalendarPicker from './CalendarPicker'
import ContactForm from './ContactForm'
import { createAppointment, getScheduleSettings, prefetchMonthBlocks, getHiddenStaffIds } from '../../lib/supabase'
import type { ScheduleSettings } from '../../lib/supabase'
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
  const [hiddenStaffIds, setHiddenStaffIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (pro.staff?.length) {
      getHiddenStaffIds(pro.staff.map(s => s.businessId)).then(setHiddenStaffIds)
    }
  }, [pro.staff])

  const visibleStaff = pro.staff?.filter(s => !hiddenStaffIds.has(s.businessId))
  const hasStaff = !!visibleStaff?.length

  const BASE_LABELS = hasStaff
    ? ['Profesional', 'Servicio', 'Fecha', 'Hora', 'Datos']
    : ['Servicio', 'Fecha', 'Hora', 'Datos']
  const TOTAL_STEPS = BASE_LABELS.length

  const [step, setStep] = useState<Step>(initialStaff ? 2 : 1)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(initialStaff ?? null)
  const [service, setService] = useState<Service | null>(null)
  const [date, setDate] = useState<SelectedDate | null>(null)
  const [time, setTime] = useState('')
  const [form, setForm] = useState<BookingFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({})
  const [slotDuration, setSlotDuration] = useState(30)
  const [paymentSettings, setPaymentSettings] = useState<Pick<ScheduleSettings, 'require_payment' | 'qr_image_url' | 'payment_percentage'> | null>(null)
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
      if (s) {
        setSlotDuration(s.slot_duration)
        setPaymentSettings({
          require_payment: s.require_payment,
          qr_image_url: s.qr_image_url,
          payment_percentage: s.payment_percentage,
        })
      }
    })
    const now = new Date()
    prefetchMonthBlocks(businessId, now.getFullYear(), now.getMonth())
  }, [businessId])

  // Preload staff photos immediately so the carousel doesn't show blank/loading images
  useEffect(() => {
    visibleStaff?.forEach((s) => {
      if (s.photo) {
        const img = new Image()
        img.src = s.photo
      }
    })
  }, [pro.staff])
  const [success, setSuccess] = useState(false)
  const [showQrStep, setShowQrStep] = useState(false)
  const [paidByQr, setPaidByQr] = useState(false)

  // Restore pending QR payment if user left the page mid-flow
  useEffect(() => {
    const raw = sessionStorage.getItem('pendingQrPayment')
    if (!raw) return
    try {
      const saved = JSON.parse(raw)
      if (saved.businessId !== businessId) return
      setForm((f) => ({ ...f, name: saved.name, phone: saved.phone }))
      setService(saved.service)
      setDate(saved.date)
      setTime(saved.time)
      setPaymentSettings({
        require_payment: true,
        qr_image_url: saved.qrImageUrl,
        payment_percentage: saved.pct,
      })
      setSlotDuration(saved.slotDuration)
      setShowQrStep(true)
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
      if (e.key === 'Escape' && !loading && !showQrStep) onClose()
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

  const requirePayment = !!(paymentSettings?.require_payment && paymentSettings.qr_image_url)

  const submit = async () => {
    if (!validate() || !service || !date || !time) return

    if (requirePayment) {
      sessionStorage.setItem('pendingQrPayment', JSON.stringify({
        businessId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        service: { name: service.name, durationMins: service.durationMins },
        date,
        time,
        pct: paymentSettings?.payment_percentage ?? 50,
        qrImageUrl: paymentSettings?.qr_image_url ?? '',
        proPhone: phone,
        slotDuration,
      }))
      setShowQrStep(true)
      return
    }

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
        initialStatus: 'pending',
      })
      const waMessage = buildWhatsAppMessage({
        patientName: form.name.trim(),
        service: service.name,
        duration: `${service.durationMins ?? slotDuration} min`,
        date: formatDate(date),
        time,
        phone: form.phone.trim(),
      })
      setWaUrl(`https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`)
      setSuccess(true)
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error. Por favor intenta de nuevo o contáctanos directamente.')
    } finally {
      setLoading(false)
    }
  }

  const confirmAndSend = async () => {
    if (!service || !date || !time) return

    // Open WA window immediately (in the click handler) before any await,
    // so browsers don't treat it as a blocked popup.
    const proPhoneClean = phone.replace(/\D/g, '')
    const dur = service.durationMins ?? slotDuration
    const durationLabel = dur >= 60
      ? `${Math.floor(dur / 60)}h${dur % 60 ? ` ${dur % 60}min` : ''}`
      : `${dur}min`
    const waLines = [
      `*Hola! Soy ${form.name.trim()} reserve una cita:*`,
      `*Servicio:* ${service.name}`,
      `*Duración:* ${durationLabel}`,
      `*Fecha:* ${formatDate(date)}`,
      `*Hora:* ${time}`,
      `*Telefono:* ${form.phone.trim()}`,
      `Te envio el comprobante de pago (${paymentSettings?.payment_percentage ?? 50}%) 📎`,
    ]
    const waUrl = `https://wa.me/${proPhoneClean}?text=${encodeURIComponent(waLines.join('\n'))}`
    window.open(waUrl, '_blank')

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
        initialStatus: 'pending_payment',
      })
      sessionStorage.removeItem('pendingQrPayment')
      setPaidByQr(true)
      setShowQrStep(false)
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
    sessionStorage.removeItem('pendingQrPayment')
    setStep(1)
    setSelectedStaff(null)
    setService(null)
    setDate(null)
    setTime('')
    setForm(EMPTY_FORM)
    setErrors({})
    setSuccess(false)
    setShowQrStep(false)
    setPaidByQr(false)
    setWaUrl('')
  }

  const STEP_LABELS = requirePayment ? [...BASE_LABELS, 'Pago'] : BASE_LABELS
  const ALL_STEPS = STEP_LABELS.length
  const displayStep = showQrStep ? ALL_STEPS : step
  const stepKind = BASE_LABELS[step - 1]
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
    <div className="booking-dialog-overlay" onClick={() => !loading && !showQrStep && onClose()}>
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
              onClick={() => {
                if (loading) return
                if (showQrStep) {
                  const ok = window.confirm('¿Estás seguro que deseas cancelar? Aún no se ha reservado tu espacio.')
                  if (!ok) return
                  sessionStorage.removeItem('pendingQrPayment')
                }
                onClose()
              }}
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
                  width: `${((displayStep - 1) / (ALL_STEPS - 1)) * 100}%`,
                  transition: 'width .4s cubic-bezier(0.16,1,0.3,1)',
                  borderRadius: 1,
                }}
              />
            </div>
            {/* Labels */}
            <div style={{ display: 'flex' }}>
              {STEP_LABELS.map((label, i) => {
                const n = (i + 1) as Step
                const active = n === displayStep
                const done = n < displayStep
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
        <div style={{ flex: 1, overflowY: 'auto', padding: success ? 0 : '1.25rem', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
              pendingPayment={paidByQr}
              onClose={onClose}
              onReset={reset}
            />
          ) : showQrStep ? (
            <QRPaymentState
              name={form.name}
              pct={paymentSettings?.payment_percentage ?? 50}
              qrImageUrl={paymentSettings?.qr_image_url ?? ''}
            />
          ) : (
            <>
              {stepKind === 'Profesional' && visibleStaff && (
                <StaffSelector
                  staff={visibleStaff}
                  selected={selectedStaff}
                  onSelect={setSelectedStaff}
                />
              )}

              {stepKind === 'Servicio' && (
                <ServiceSelector
                  services={selectedStaff?.services ?? pro.services}
                  selected={service}
                  onSelect={(s) => {
                    setService(s)
                    goNext()
                  }}
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
                    goNext()
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
                  onTimeChange={(t) => {
                    setTime(t)
                    goNext()
                  }}
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
                  businessId={businessId}
                  paymentNotice={requirePayment ? { pct: paymentSettings?.payment_percentage ?? 50 } : undefined}
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
            {showQrStep ? (
              <>
                <span />
                <button
                  onClick={confirmAndSend}
                  disabled={loading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.6rem',
                    padding: '.85rem 1.5rem',
                    background: loading ? '#1ea854' : '#25D366',
                    border: 'none', color: '#fff',
                    fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 500,
                    letterSpacing: '.08em', textTransform: 'uppercase',
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2.05 22l5.36-1.4a9.9 9.9 0 0 0 4.63 1.18h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7C17.16 3.03 14.69 2 12.04 2zm0 18.13a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.18.83.85-3.1-.2-.32a8.18 8.18 0 0 1-1.26-4.4c0-4.54 3.7-8.24 8.27-8.24 2.21 0 4.28.86 5.84 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.55-3.7 8.25-8.26 8.25zm4.53-6.18c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.13-.17.25-.64.8-.78.96-.14.17-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.22-.74-.65-1.23-1.46-1.38-1.7-.14-.25-.02-.39.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01s-.43.06-.66.31c-.23.25-.86.84-.86 2.04s.88 2.37 1 2.53c.12.17 1.74 2.65 4.21 3.72.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/>
                  </svg>
                  {loading ? 'Reservando…' : 'Enviar comprobante'}
                </button>
              </>
            ) : (
              <>
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
              </>
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

function QRPaymentState({
  name,
  pct,
  qrImageUrl,
}: {
  name: string
  pct: number
  qrImageUrl: string
}) {
  const firstName = name.split(' ')[0]
  const pctLabel = pct === 100 ? 'el total' : `el ${pct}%`

  const downloadQr = async () => {
    try {
      const res = await fetch(qrImageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'qr-pago.png'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(qrImageUrl, '_blank')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1 }}>
          ¡Casi listo, {firstName}!
        </h2>
        <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, maxWidth: '26rem' }}>
          Escanea el QR y paga {pctLabel}.
        </p>
      </div>

      {/* QR with download overlay */}
      <div style={{ position: 'relative', display: 'inline-block', padding: '1rem', background: '#fff', border: '1px solid var(--color-rim)' }}>
        <img src={qrImageUrl} alt="QR de cobro" style={{ width: 'min(14rem, 70vw)', height: 'min(14rem, 70vw)', objectFit: 'contain', display: 'block' }} />
        <button
          onClick={downloadQr}
          title="Guardar imagen"
          style={{
            position: 'absolute', bottom: '0.4rem', right: '0.4rem',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '2.2rem', height: '2.2rem',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            color: '#fff', border: 'none', borderRadius: '6px',
            cursor: 'pointer', padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v13M7 11l5 5 5-5M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <p style={{ fontSize: '.9rem', color: 'var(--color-ink-ghost)', lineHeight: 1.6, maxWidth: '22rem' }}>
       Luego toca <strong style={{ color: 'var(--color-ink)' }}>Enviar Comprobante</strong> y envíanos el comprobante de tu pago.
      </p>
    </div>
  )
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
  pendingPayment,
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
  pendingPayment?: boolean
  onClose: () => void
  onReset: () => void
}) {
  const pro = useProfessional()
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
          {pendingPayment ? 'Reserva enviada!' : '¡Cita confirmada!'}
        </h3>
      </div>

      {/* ── Greeting ── */}
      <div>
        <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>
          {pendingPayment
            ? `Gracias, ${name ? name.split(' ')[0] : ''}. Tu cita está reservada y el profesional la confirmará cuando verifique tu pago.`
            : `Listo, ${name ? name.split(' ')[0] : ''}. Te pedimos llegar 10 minutos antes de tu cita. Contarás con hasta 10 minutos de tolerancia`}
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

      {/* ── WhatsApp button ── */}
      {!pendingPayment && waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '.6rem',
            padding: '.85rem 1rem',
            background: 'none',
            border: '1.5px solid #25D366',
            color: '#25D366',
            fontFamily: 'var(--font-body)',
            fontSize: '.75rem',
            fontWeight: 500,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'all .3s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,211,102,.1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 2.83.738 5.485 2.027 7.793L0 32l8.418-2.007A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.77-1.847l-.485-.288-5.003 1.193 1.215-4.871-.317-.5A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.873c-.398-.2-2.355-1.163-2.72-1.295-.365-.133-.631-.2-.896.2-.265.398-1.029 1.295-1.261 1.56-.232.265-.465.299-.863.1-.398-.2-1.682-.62-3.203-1.979-1.184-1.057-1.984-2.363-2.217-2.762-.232-.398-.025-.614.175-.812.18-.179.398-.465.598-.698.199-.232.265-.398.398-.664.133-.265.066-.498-.033-.698-.1-.2-.896-2.163-1.228-2.962-.323-.777-.651-.672-.896-.684l-.763-.013c-.265 0-.697.1-.1063.498-.365.398-1.394 1.362-1.394 3.323 0 1.96 1.428 3.855 1.627 4.12.2.265 2.808 4.287 6.804 6.014.951.41 1.693.655 2.272.839.954.303 1.823.26 2.509.158.765-.114 2.355-.963 2.688-1.893.332-.93.332-1.728.232-1.893-.099-.166-.365-.265-.763-.465z"/>
          </svg>
          Contactar a {pro.shortName ?? pro.name}
        </a>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
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

      {/* ── Footer brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem', marginTop: '.5rem', width: '100%' }}>
        <span style={{ fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', opacity: 0.6 }}>powered by</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--color-ink-ghost)', letterSpacing: '.02em' }}>Probo</span>
      </div>
    </div>
  )
}
