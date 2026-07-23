import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { CalendarDays, Clock, Settings, Smartphone, Bell, BellOff, ChevronRight, Check, MessageCircle, AlertTriangle, QrCode, Upload, Briefcase } from 'lucide-react'
import { useProfessional } from '../context/ProfessionalContext'
import { useStaff } from '../context/StaffContext'
import ScheduleEditor from '../components/ScheduleEditor'
import BlockScheduler from '../components/BlockScheduler'
import AppointmentsPanel from '../components/AppointmentsPanel'
import { getWebcalUrl, getGoogleCalendarUrl } from '../lib/calendar'
import { subscribeToPush, getPushStatus, getScheduleSettings, saveAllowCancel, savePaymentSettings, uploadQrImage, saveStaffHidden, getHiddenStaffIds, saveScheduleLocked, getScheduleLockedMap } from '../lib/supabase'
import type { StaffMember } from '../types/professional'

type Section = 'citas' | 'schedule' | 'config' | 'profesionales'
type CalTab  = 'iphone'   | 'google'  | 'outlook'

const NAV: { id: Section; label: string; desc: string; icon: typeof CalendarDays }[] = [
  { id: 'citas',    label: 'Citas',                 desc: 'Agenda del día',                  icon: CalendarDays },
  { id: 'schedule', label: 'Horarios',              desc: 'Días y horas de atención',         icon: Clock },
  { id: 'config',   label: 'Configuración inicial', desc: 'Calendario y notificaciones',      icon: Settings },
]

const NAV_AGENCY: { id: Section; label: string; desc: string; icon: typeof CalendarDays }[] = [
  { id: 'citas',          label: 'Citas',           desc: 'Agenda combinada',  icon: CalendarDays },
  { id: 'profesionales',  label: 'Profesionales',   desc: 'Gestión del equipo', icon: Briefcase },
]

const STEPS_IPHONE = [
  { n:1, title:'Abre Configuración',    desc:'En tu iPhone, entra a la app Configuración.' },
  { n:2, title:'Calendar → Cuentas',   desc:'Baja hasta "Calendario" → toca "Cuentas".' },
  { n:3, title:'Añadir cuenta → Otra', desc:'Toca "Añadir cuenta" y selecciona "Otra".' },
  { n:4, title:'Calendario suscrito',  desc:'Toca "Añadir calendario suscrito".' },
  { n:5, title:'Pega el link',         desc:'Pega el link en el campo Server y toca Siguiente.' },
  { n:6, title:'¡Listo!',             desc:'Tus citas aparecerán automáticamente.' },
]
const STEPS_GOOGLE = [
  { n:1, title:'Abre Google Calendar', desc:'En el navegador, entra a calendar.google.com.' },
  { n:2, title:'Otros calendarios',   desc:'Toca el "+" junto a "Otros calendarios".' },
  { n:3, title:'Desde URL',           desc:'Selecciona "Desde URL".' },
  { n:4, title:'Pega el link',        desc:'Pega el link y toca "Añadir calendario".' },
  { n:5, title:'¡Listo!',            desc:'Google Calendar sincronizará las citas automáticamente.' },
]
const STEPS_OUTLOOK = [
  { n:1, title:'Abre Outlook',          desc:'Entra a outlook.com o abre la app de escritorio.' },
  { n:2, title:'Agregar calendario',    desc:'Clic en el ícono de calendario → "Agregar calendario".' },
  { n:3, title:'Suscribirse desde web', desc:'Selecciona "Suscribirse desde la web".' },
  { n:4, title:'Pega el link',          desc:'Pega el link y haz clic en "Importar".' },
  { n:5, title:'¡Listo!',              desc:'Las citas aparecerán en tu Outlook.' },
]
const STEPS_PUSH_IOS = [
  { n:1, title:'Abre en Safari',       desc:'En iPhone, esta página debe abrirse en el navegador Safari, no en Chrome ni en otra app.' },
  { n:2, title:'Botón Compartir',      desc:'Toca el botón Compartir (el cuadrado con una flecha hacia arriba) en la barra inferior.' },
  { n:3, title:'Agregar a inicio',     desc:'Desplázate y toca "Ver más", luego selecciona "Agregar a inicio".' },
  { n:4, title:'Abre desde el ícono',  desc:'Cierra Safari y abre la app desde el ícono que se creó en tu pantalla de inicio.' },
  { n:5, title:'Activa notificaciones', desc:'Desde esa app de tu inicio, vuelve a esta pantalla y toca "Activar notificaciones".' },
  { n:6, title:'¡Listo!', desc:'Recibiras notificaciones instantáneas cada que un cliente haga una reserva.' },
]

export default function SetupPage() {
  const pro = useProfessional()
  const staff = useStaff()
  const isAgency = !staff && !!pro.staff?.length
  const businessId  = staff?.businessId ?? pro.businessId
  const displayName = staff?.name ?? pro.name
  const activeNav = isAgency ? NAV_AGENCY : NAV
  const [section, setSection]       = useState<Section>('citas')
  const [staffHidden, setStaffHidden] = useState<Record<string, boolean>>({})
  const [staffHiddenSaving, setStaffHiddenSaving] = useState<string | null>(null)
  const [staffLocked, setStaffLocked] = useState<Record<string, boolean>>({})
  const [staffLockedSaving, setStaffLockedSaving] = useState<string | null>(null)
  const [scheduleStaff, setScheduleStaff] = useState<StaffMember | null>(null)
  const [ownLocked, setOwnLocked] = useState(false)
  const [pushStatus, setPushStatus] = useState<'active' | 'inactive' | 'unsupported' | 'loading'>('loading')
  const [showIosSteps, setShowIosSteps] = useState(false)
  const [pushWorking, setPushWorking] = useState(false)
  const [allowCancel, setAllowCancel] = useState(true)
  const [cancelSaving, setCancelSaving] = useState(false)
  const [requirePayment, setRequirePayment] = useState(false)
  const [paymentPct, setPaymentPct] = useState(50)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [qrSaving, setQrSaving] = useState(false)
  const [qrUploading, setQrUploading] = useState(false)
  const qrFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getPushStatus(businessId).then(setPushStatus)
    getScheduleSettings(businessId).then(s => {
      if (s) {
        setAllowCancel(s.allow_cancel ?? true)
        setRequirePayment(s.require_payment ?? false)
        setPaymentPct(s.payment_percentage ?? 50)
        setQrImageUrl(s.qr_image_url ?? null)
      }
    })
    if (isAgency && pro.staff?.length) {
      const ids = pro.staff.map(s => s.businessId)
      getHiddenStaffIds(ids).then(hiddenSet => {
        const map: Record<string, boolean> = {}
        pro.staff!.forEach(s => { map[s.businessId] = hiddenSet.has(s.businessId) })
        setStaffHidden(map)
      })
      getScheduleLockedMap(ids).then(setStaffLocked)
    }
    // Barbero dentro de una agencia: leer si su horario está bloqueado
    if (staff) {
      getScheduleLockedMap([businessId]).then(m => setOwnLocked(m[businessId] ?? true))
    }
  }, [businessId])

  const toggleAllowCancel = async (val: boolean) => {
    setAllowCancel(val)
    setCancelSaving(true)
    try { await saveAllowCancel(businessId, val) } finally { setCancelSaving(false) }
  }

  const toggleStaffHidden = async (staffBusinessId: string, hidden: boolean) => {
    setStaffHidden(prev => ({ ...prev, [staffBusinessId]: hidden }))
    setStaffHiddenSaving(staffBusinessId)
    try { await saveStaffHidden(staffBusinessId, hidden) } catch { /* ignore */ }
    finally { setStaffHiddenSaving(null) }
  }

  const toggleStaffLocked = async (staffBusinessId: string, locked: boolean) => {
    setStaffLocked(prev => ({ ...prev, [staffBusinessId]: locked }))
    setStaffLockedSaving(staffBusinessId)
    try {
      await saveScheduleLocked(staffBusinessId, locked)
    } catch {
      // Revertir si falla el guardado para no mostrar un estado falso
      setStaffLocked(prev => ({ ...prev, [staffBusinessId]: !locked }))
      alert('No se pudo guardar el cambio. Verifica que la función admin-write esté desplegada y que exista la columna schedule_locked.')
    } finally { setStaffLockedSaving(null) }
  }

  // Setup page always uses the Bebas Neue / Inter typography, regardless of professional theme
  useEffect(() => {
    const id = 'gf-setup-bebas-inter'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])

  const saveQr = async (overrides?: { require_payment?: boolean; payment_percentage?: number; qr_image_url?: string | null }) => {
    setQrSaving(true)
    try {
      await savePaymentSettings(
        businessId,
        overrides?.require_payment ?? requirePayment,
        overrides?.payment_percentage ?? paymentPct,
        overrides?.qr_image_url !== undefined ? overrides.qr_image_url : qrImageUrl,
      )
    } finally { setQrSaving(false) }
  }

  const handleQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrUploading(true)
    try {
      const url = await uploadQrImage(businessId, file)
      setQrImageUrl(`${url}?t=${Date.now()}`)
      await saveQr({ qr_image_url: url })
    } catch { alert('Error al subir la imagen. Intenta de nuevo.') }
    finally { setQrUploading(false) }
  }

  const handleSubscribe = async () => {
    setPushWorking(true)
    const result = await subscribeToPush(businessId)
    if (result === 'subscribed' || result === 'already') setPushStatus('active')
    else if (result === 'denied') alert('Permisos de notificación denegados. Actívalos en la configuración del navegador.')
    else if (result === 'unsupported') alert('Tu navegador no soporta notificaciones push.')
    setPushWorking(false)
  }

  const handleUnsubscribe = async () => {
    setPushWorking(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) await sub.unsubscribe()
      setPushStatus('inactive')
    } catch (e) {
      console.error('[Push] unsubscribe failed:', e)
    }
    setPushWorking(false)
  }

  return (
    <div style={{ height: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', colorScheme: 'inherit', '--font-display': "'Bebas Neue', serif", '--font-body': "'Inter', sans-serif" } as CSSProperties}>

      {/* ── Sticky header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--color-nav-scrolled, var(--color-surface))',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--color-rim)',
        padding: '.85rem clamp(1rem, 4vw, 2.5rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', minWidth: 0 }}>
          <a href={`/${pro.slug}`} aria-label="Volver a mi página"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2.1rem', height: '2.1rem', flexShrink: 0, color: 'var(--color-gold)', background: 'transparent', textDecoration: 'none', border: 'none', transition: 'opacity .2s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.7' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            <svg width="16" height="14" viewBox="0 0 12 10" fill="none"><path d="M4.5 1L1 5l3.5 4M1 5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </a>
          {pro.logo && <img src={pro.logo} alt="" style={{ height: 28, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,3.8vw,2.1rem)', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </h1>
          </div>
        </div>
      </header>

      {/* ── Tab bar (desktop/tablet) ── */}
      <div className="setup-tabbar-top" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-rim)', padding: '0 clamp(1rem,4vw,2.5rem)', overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
          {activeNav.map(n => {
            const active = section === n.id
            return (
              <button key={n.id} onClick={() => { setSection(n.id); setScheduleStaff(null) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '.85rem 1.25rem',
                  borderBottom: `2px solid ${active ? 'var(--color-gold)' : 'transparent'}`,
                  marginBottom: -1,
                  fontFamily: 'var(--font-body)', fontSize: '.78rem',
                  fontWeight: active ? 500 : 300,
                  letterSpacing: '.08em', textTransform: 'uppercase',
                  color: active ? 'var(--color-ink)' : 'var(--color-ink-dim)',
                  transition: 'color .2s, border-color .2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--color-ink)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--color-ink-dim)' }}
              >
                {n.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="setup-main-mobile-pad" style={{ flex: 1, overflowY: 'auto', padding: 'clamp(1.5rem,3vw,2.5rem) clamp(1rem,4vw,2.5rem)' }}>
        <div style={{ maxWidth: (section === 'schedule' || section === 'config') ? '100rem' : '48rem', margin: '0 auto' }}>

          {section === 'citas' && (
            <div style={{ paddingBottom: '3rem' }}>
              <AppointmentsPanel
                businessId={businessId}
                businessName={displayName}
                staffMember={staff ?? undefined}
                staffMembers={isAgency ? pro.staff : undefined}
                disablePullToRefresh
              />
            </div>
          )}

          {section === 'profesionales' && isAgency && !scheduleStaff && (
            <div style={{ maxWidth: '38rem' }}>
              <Panel title="Profesionales" desc="Activa o desactiva cada profesional y gestiona su horario. Los desactivados no aparecerán como opción al reservar.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {pro.staff!.map(s => {
                    const hidden = staffHidden[s.businessId] ?? false
                    const locked = staffLocked[s.businessId] ?? true
                    const saving = staffHiddenSaving === s.businessId
                    return (
                      <div key={s.businessId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.85rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-rim)', opacity: saving ? 0.6 : 1, transition: 'opacity .2s' }}>
                        {s.photo && <img src={s.photo} alt="" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '1px solid var(--color-rim-l)' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 500, color: 'var(--color-ink)' }}>{s.name}</p>
                          <p style={{ fontSize: '.72rem', color: locked ? 'var(--color-ink-ghost)' : 'var(--color-gold)', marginTop: '.1rem' }}>
                            {locked ? 'Horario gestionado por la agencia' : 'El profesional edita su horario'}
                          </p>
                        </div>
                        <button
                          onClick={() => setScheduleStaff(s)}
                          title="Ver / editar horario"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.45rem .9rem', background: 'none', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim-l)'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
                        >
                          <Clock size={14} />
                          Horario
                        </button>
                        <button
                          onClick={() => toggleStaffHidden(s.businessId, !hidden)}
                          disabled={saving}
                          title={hidden ? 'Activar' : 'Desactivar'}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.45rem .9rem', background: hidden ? 'none' : 'rgba(196,153,90,.12)', border: `1px solid ${hidden ? 'var(--color-rim-l)' : 'var(--color-gold)'}`, color: hidden ? 'var(--color-ink-ghost)' : 'var(--color-gold)', fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer', transition: 'all .2s', flexShrink: 0 }}
                        >
                          {hidden ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                          {hidden ? 'Oculto' : 'Visible'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </Panel>
            </div>
          )}

          {section === 'profesionales' && isAgency && scheduleStaff && (() => {
            const s = scheduleStaff
            const locked = staffLocked[s.businessId] ?? true
            const lockSaving = staffLockedSaving === s.businessId
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: '3rem', alignItems: 'start' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <button
                    onClick={() => setScheduleStaff(null)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.75rem', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', padding: 0, marginBottom: '1rem' }}
                  >
                    <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                    Profesionales
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    {s.photo && <img src={s.photo} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '1px solid var(--color-rim-l)' }} />}
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1 }}>{s.name}</h2>
                      {s.title && <p style={{ fontSize: '.78rem', color: 'var(--color-ink-ghost)' }}>{s.title}</p>}
                    </div>
                  </div>
                  {/* Candado: permitir que el profesional edite su propio horario */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-rim)', opacity: lockSaving ? 0.6 : 1, transition: 'opacity .2s' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '.85rem', fontWeight: 500, color: 'var(--color-ink)' }}>Permitir que el profesional edite su horario</p>
                      <p style={{ fontSize: '.74rem', color: 'var(--color-ink-ghost)', marginTop: '.15rem' }}>
                        {locked ? 'Bloqueado — solo la agencia puede cambiarlo.' : 'Activado — el profesional puede editar desde su panel.'}
                      </p>
                    </div>
                    <Toggle checked={!locked} onChange={v => toggleStaffLocked(s.businessId, !v)} disabled={lockSaving} />
                  </div>
                </div>

                {s.timeSlots ? (
                  <Panel title="Horarios de atención" desc="">
                    <div style={{ padding: '1rem', border: '1px solid var(--color-rim)', background: 'var(--color-surface)', fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>
                      <span style={{ color: 'var(--color-gold)', fontWeight: 500 }}>Horarios configurados manualmente.</span>
                      <br />
                      Los slots de este profesional están definidos directamente en el sistema y no se editan aquí.
                    </div>
                  </Panel>
                ) : (
                  <Panel title="Horarios de atención" desc="">
                    <ScheduleEditor businessId={s.businessId} />
                  </Panel>
                )}

                <Panel title="Vacaciones/Feriados (opcional)" desc="Marca días completos o rangos de horas en que este profesional no estará disponible.">
                  <BlockScheduler businessId={s.businessId} />
                </Panel>
              </div>
            )
          })()}

          {section === 'schedule' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: '3rem', alignItems: 'start' }}>
              {(staff?.timeSlots ?? pro.timeSlots) ? (
                <Panel title="Horarios de atención" desc="">
                  <div style={{ padding: '1rem', border: '1px solid var(--color-rim)', background: 'var(--color-surface)', fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 500 }}>Horarios configurados manualmente.</span>
                    <br />
                    Los slots de atención están definidos directamente en el sistema y no requieren configuración aquí.
                  </div>
                </Panel>
              ) : (
                <Panel title="Horarios de atención" desc="">
                  <ScheduleEditor readOnly={!!staff && ownLocked} />
                </Panel>
              )}

              <Panel title="Vacaciones/Feriados (opcional)" desc="Cuando lo necesites, marca días completos o rangos de horas en que no estarás disponible — vacaciones, conferencias, feriados.">
                <BlockScheduler readOnly={!!staff && ownLocked} />
              </Panel>
            </div>
          )}

          {section === 'config' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: '3rem', alignItems: 'start', paddingBottom: '3rem' }}>
              <Panel title="Sincroniza tu calendario" desc="Conecta tu calendario una sola vez y todas las citas aparecerán automáticamente, sin que tengas que hacer nada más.">
                <MagicLinkPanel />
              </Panel>

              <Panel title="Notificaciones push" desc="Recibe una notificación en este dispositivo cada vez que un paciente reserve una cita — sin WhatsApp.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem 1.25rem', background: 'var(--color-surface)', border: `1px solid ${pushStatus === 'active' ? 'var(--color-gold)' : 'var(--color-rim)'}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: pushStatus === 'active' ? '#4caf50' : pushStatus === 'loading' ? 'var(--color-ink-ghost)' : '#888', flexShrink: 0 }} />
                  <span style={{ fontSize: '.95rem', color: 'var(--color-ink-dim)' }}>
                    {pushStatus === 'loading'      && 'Verificando…'}
                    {pushStatus === 'active'       && <>Estado de notificaciones: <strong style={{ color: 'var(--color-ink)' }}>Activadas</strong></>}
                    {pushStatus === 'inactive'     && <>Estado de notificaciones: <strong style={{ color: 'var(--color-ink)' }}>Desactivadas</strong></>}
                    {pushStatus === 'unsupported'  && <>Estado de notificaciones: <strong style={{ color: 'var(--color-ink)' }}>No disponibles en este navegador</strong> — sigue las instrucciones abajo</>}
                  </span>
                </div>

                {pushStatus !== 'active' && pushStatus !== 'unsupported' && (
                  <button onClick={handleSubscribe} disabled={pushWorking}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '1rem 2rem', background: pushWorking ? 'var(--color-rim-l)' : 'var(--color-gold)', color: pushWorking ? 'var(--color-ink-ghost)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', border: 'none', cursor: pushWorking ? 'not-allowed' : 'pointer', transition: 'background .3s', alignSelf: 'flex-start', borderRadius: '4px' }}
                    onMouseEnter={e => { if (!pushWorking) e.currentTarget.style.background = 'var(--color-gold-l)' }}
                    onMouseLeave={e => { if (!pushWorking) e.currentTarget.style.background = 'var(--color-gold)' }}
                  >
                    <Bell size={15} /> {pushWorking ? 'Activando…' : 'Activar notificaciones'}
                  </button>
                )}

                {pushStatus === 'active' && (
                  <button onClick={handleUnsubscribe} disabled={pushWorking}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.8rem 2rem', background: 'none', border: '1px solid var(--color-rim-l)', color: pushWorking ? 'var(--color-ink-ghost)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 300, letterSpacing: '.12em', textTransform: 'uppercase', cursor: pushWorking ? 'not-allowed' : 'pointer', transition: 'all .3s', alignSelf: 'flex-start' }}
                    onMouseEnter={e => { if (!pushWorking) { e.currentTarget.style.color = '#c47070'; e.currentTarget.style.borderColor = '#c47070' } }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
                  >
                    <BellOff size={14} /> {pushWorking ? 'Desactivando…' : 'Desactivar notificaciones'}
                  </button>
                )}

                {/* iOS instructions (collapsible) */}
                {pushStatus !== 'active' && (
                <div>
                  <button onClick={() => setShowIosSteps(s => !s)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(196,153,90,.08)', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', padding: '.5rem 1rem', cursor: 'pointer', transition: 'background .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,153,90,.14)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(196,153,90,.08)')}
                  >
                    <ChevronRight size={12} style={{ transform: showIosSteps ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .25s' }} />
                    {showIosSteps ? 'Ocultar pasos adicionales' : <><Smartphone size={13} style={{ verticalAlign: '-2px' }} /> ¿Usas iPhone? Ver pasos adicionales</>}
                  </button>

                  {showIosSteps && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-rim)' }}>
                      {STEPS_PUSH_IOS.map((step, i) => (
                        <div key={step.n} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'var(--color-surface)', padding: '.9rem 1.25rem' }}>
                          <div style={{ width: '1.5rem', height: '1.5rem', border: `1.5px solid ${i===STEPS_PUSH_IOS.length-1?'var(--color-gold)':'var(--color-rim-l)'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.62rem', flexShrink: 0, color: i===STEPS_PUSH_IOS.length-1?'var(--color-gold)':'var(--color-ink-dim)', background: i===STEPS_PUSH_IOS.length-1?'rgba(196,153,90,.08)':'transparent' }}>
                            {i===STEPS_PUSH_IOS.length-1?<Check size={12} />:step.n}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.15rem' }}>{step.title}</div>
                            <div style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.6 }}>{step.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )}

                <p style={{ fontSize: '.85rem', color: 'var(--color-ink-ghost)', lineHeight: 1.7 }}>
                  Las notificaciones se activan por dispositivo. Si usas varios, actívalas en cada uno.
                </p>
              </div>
              </Panel>

              <Panel title="Cobro por QR" desc="Solicita un pago parcial o total al momento de reservar. El cliente paga escaneando tu QR y envía el comprobante por WhatsApp.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* Toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '.95rem', color: 'var(--color-ink)', marginBottom: '.2rem' }}>Activar cobro por QR</p>
                      <p style={{ fontSize: '.8rem', color: 'var(--color-ink-ghost)', lineHeight: 1.5 }}>
                        {requirePayment ? 'Los clientes deben pagar para confirmar su cita.' : 'Los clientes reservan sin pago previo.'}
                      </p>
                    </div>
                    <div onClick={async () => { const v = !requirePayment; setRequirePayment(v); await saveQr({ require_payment: v }) }}
                      style={{ position: 'relative', width: '2.8rem', height: '1.6rem', borderRadius: '999px', background: requirePayment ? 'var(--color-gold)' : 'var(--color-rim-l)', transition: 'background .2s', flexShrink: 0, cursor: qrSaving ? 'wait' : 'pointer' }}
                    >
                      <div style={{ position: 'absolute', top: '3px', left: requirePayment ? 'calc(100% - 1.3rem)' : '3px', width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
                    </div>
                  </label>

                  {requirePayment && (<>
                    {/* Percentage */}
                    <div>
                      <p style={{ fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', marginBottom: '.75rem' }}>Porcentaje a cobrar</p>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        {[25, 50, 100].map(pct => (
                          <button key={pct}
                            onClick={async () => { setPaymentPct(pct); await saveQr({ payment_percentage: pct }) }}
                            style={{
                              flex: 1, padding: '.75rem', border: `1px solid ${paymentPct === pct ? 'var(--color-gold)' : 'var(--color-rim)'}`,
                              background: paymentPct === pct ? 'rgba(196,153,90,.1)' : 'transparent',
                              color: paymentPct === pct ? 'var(--color-gold)' : 'var(--color-ink-dim)',
                              fontFamily: 'var(--font-display)', fontSize: '1.4rem', cursor: 'pointer', transition: 'all .2s',
                            }}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* QR Upload */}
                    <div>
                      <p style={{ fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', marginBottom: '.75rem' }}>Imagen de tu QR</p>
                      <input ref={qrFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleQrFileChange} />
                      {qrImageUrl ? (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <img src={qrImageUrl} alt="QR de cobro" style={{ width: '8rem', height: '8rem', objectFit: 'contain', border: '1px solid var(--color-rim)', background: '#fff', padding: '.5rem' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            <button onClick={() => qrFileRef.current?.click()} disabled={qrUploading}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'none', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                            >
                              <Upload size={13} /> {qrUploading ? 'Subiendo…' : 'Cambiar imagen'}
                            </button>
                            <p style={{ fontSize: '.75rem', color: 'var(--color-ink-ghost)' }}>Sube una imagen clara del QR de tu billetera digital.</p>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => qrFileRef.current?.click()} disabled={qrUploading}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.75rem', width: '100%', padding: '2rem', border: '1px dashed var(--color-rim-l)', background: 'transparent', cursor: 'pointer', color: 'var(--color-ink-ghost)', transition: 'border-color .2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-rim-l)'}
                        >
                          <QrCode size={28} color="var(--color-gold)" />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '.78rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                            {qrUploading ? 'Subiendo…' : 'Subir imagen del QR'}
                          </span>
                        </button>
                      )}
                    </div>

                    {qrSaving && <p style={{ fontSize: '.75rem', color: 'var(--color-ink-ghost)' }}>Guardando…</p>}
                  </>)}
                </div>
              </Panel>

              <Panel title="Cancelación de citas" desc="Controla si los clientes pueden cancelar su cita desde el mensaje de WhatsApp que les envías.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '.95rem', color: 'var(--color-ink)', marginBottom: '.2rem' }}>
                        Permitir cancelaciones
                      </p>
                      <p style={{ fontSize: '.8rem', color: 'var(--color-ink-ghost)', lineHeight: 1.5 }}>
                        {allowCancel
                          ? 'El mensaje incluye un link para que el cliente cancele su cita.'
                          : 'El mensaje no incluye opción de cancelar.'}
                      </p>
                    </div>
                    {/* Toggle switch */}
                    <div onClick={() => toggleAllowCancel(!allowCancel)}
                      style={{ position: 'relative', width: '2.8rem', height: '1.6rem', borderRadius: '999px', background: allowCancel ? 'var(--color-gold)' : 'var(--color-rim-l)', transition: 'background .2s', flexShrink: 0, cursor: cancelSaving ? 'wait' : 'pointer' }}
                    >
                      <div style={{ position: 'absolute', top: '3px', left: allowCancel ? 'calc(100% - 1.3rem)' : '3px', width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
                    </div>
                  </label>
                  {cancelSaving && <p style={{ fontSize: '.75rem', color: 'var(--color-ink-ghost)' }}>Guardando…</p>}
                </div>
              </Panel>
            </div>
          )}

          {section === 'config' && <SupportFooter />}
        </div>
      </main>

      {/* ── Tab bar (mobile, fixed bottom) ── */}
      <nav className="setup-tabbar-bottom">
        {activeNav.map(n => {
          const active = section === n.id
          const Icon = n.icon
          return (
            <button key={n.id} onClick={() => { setSection(n.id); setScheduleStaff(null) }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '.3rem', padding: '.7rem .25rem .35rem', minHeight: '3.75rem', background: 'none', border: 'none',
                borderTop: `2px solid ${active ? 'var(--color-gold)' : 'transparent'}`,
                marginTop: -1, cursor: 'pointer',
                color: active ? 'var(--color-gold)' : 'var(--color-ink-dim)',
                fontFamily: 'var(--font-body)', fontSize: '.68rem',
                fontWeight: active ? 500 : 300, letterSpacing: '.04em', textTransform: 'uppercase',
                transition: 'color .2s, border-color .2s',
              }}
            >
              <Icon size={22} color={active ? 'var(--color-gold)' : 'var(--color-ink-dim)'}/>
              {n.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/* ── Panel wrapper ── */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div onClick={() => !disabled && onChange(!checked)}
      style={{ position: 'relative', width: '2.8rem', height: '1.6rem', borderRadius: '999px', background: checked ? 'var(--color-gold)' : 'var(--color-rim-l)', transition: 'background .2s', flexShrink: 0, cursor: disabled ? 'wait' : 'pointer' }}
    >
      <div style={{ position: 'absolute', top: '3px', left: checked ? 'calc(100% - 1.3rem)' : '3px', width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
    </div>
  )
}

function Panel({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)', marginBottom: desc ? '.45rem' : 0, textTransform: 'capitalize' }}>
          {title}
        </h2>
        {desc && <p style={{ fontSize: '1rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

/* ── Support footer (shown at bottom of every tab) ── */
function SupportFooter() {
  const phone = '59172235605'
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent('Hola, tengo una consulta sobre mi configuración en Probo.pro')}`
  return (
    <div className="support-footer" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-rim)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
      <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.7, margin: 0 }}>
        ¿Tienes algún problema o no encuentras lo que buscas?<br />Contáctanos por WhatsApp y te ayudamos.
      </p>
      <a href={waUrl} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.75rem 1.5rem', background: '#25D366', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        <MessageCircle size={15} /> Escribir por WhatsApp
      </a>
    </div>
  )
}

/* ── Magic Link panel ── */
function MagicLinkPanel() {
  const pro = useProfessional()
  const staff = useStaff()
  const [copied, setCopied]       = useState(false)
  const [calTab, setCalTab]       = useState<CalTab>('iphone')
  const [showSteps, setShowSteps] = useState(false)

  const feedUrl   = staff?.calendarFeedUrl ?? pro.calendarFeedUrl
  const webcalUrl = getWebcalUrl(feedUrl)
  const googleUrl = getGoogleCalendarUrl(feedUrl)
  const steps     = calTab === 'iphone' ? STEPS_IPHONE : calTab === 'google' ? STEPS_GOOGLE : STEPS_OUTLOOK

  const copy = async () => {
    if (!feedUrl) return
    await navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (!feedUrl) return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-ink-ghost)', fontSize: '.9rem' }}>
        <AlertTriangle size={14} style={{ verticalAlign: '-2px' }} /> Configura <code style={{ background: 'var(--color-surface2)', padding: '.1rem .4rem', color: 'var(--color-gold)', fontSize: '.8rem' }}>calendarFeedUrl</code> en{' '}
        <code style={{ background: 'var(--color-surface2)', padding: '.1rem .4rem', fontSize: '.8rem' }}>src/data/professionals.ts</code>
      </p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Quick sync buttons */}
      <div>
        <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '.85rem' }}>
          Primero, prueba sincronizar con un toque:
        </p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <a href={webcalUrl}
            style={{ ...SOLID_BTN }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-gold-l)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-gold)' }}
          ><Smartphone size={15} /> Sincronizar en iPhone</a>
          <a href={googleUrl} target="_blank" rel="noreferrer"
            style={{ ...SOLID_BTN }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-gold-l)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-gold)' }}
          ><CalendarDays size={15} /> Sincronizar con Google Calendar</a>
        </div>
      </div>

      {/* Fallback: link + instructions */}
      <div>
        <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '.85rem' }}>
          ¿No funcionó? Copia este link y agrégalo manualmente siguiendo las instrucciones:
        </p>
        <div style={{ display: 'flex', gap: 1, background: 'var(--color-rim)' }}>
          <div style={{ flex: 1, background: 'var(--color-surface)', padding: '.85rem 1.25rem', fontFamily: 'monospace', fontSize: '.72rem', color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {feedUrl}
          </div>
          <button onClick={copy}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', padding: '1rem 1.5rem', background: copied ? 'var(--color-surface2)' : 'var(--color-gold)', color: copied ? 'var(--color-ink-dim)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s', flexShrink: 0, borderRadius: '4px' }}>
            {copied ? <><Check size={14} /> Copiado</> : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Collapsible instructions */}
      <div>
        <button onClick={() => setShowSteps(s => !s)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(196,153,90,.08)', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', padding: '.5rem 1rem', cursor: 'pointer', transition: 'background .2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,153,90,.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(196,153,90,.08)')}
        >
          <ChevronRight size={12} style={{ transform: showSteps ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .25s' }} />
          {showSteps ? 'Ocultar instrucciones' : 'Ver instrucciones paso a paso'}
        </button>

        {showSteps && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-rim)', marginBottom: '1.25rem' }}>
              {([['iphone',Smartphone,'iPhone'],['google',CalendarDays,'Google'],['outlook',Briefcase,'Outlook']] as [CalTab, typeof Smartphone, string][]).map(([id,Icon,label]) => (
                <button key={id} onClick={() => setCalTab(id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.6rem 1.1rem', background: 'none', border: 'none', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: calTab===id?500:300, letterSpacing: '.08em', textTransform: 'uppercase', color: calTab===id?'var(--color-ink)':'var(--color-ink-dim)', borderBottom: `2px solid ${calTab===id?'var(--color-gold)':'transparent'}`, cursor: 'pointer', marginBottom: -1, transition: 'color .2s' }}
                ><Icon size={13} /> {label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-rim)' }}>
              {steps.map((step, i) => (
                <div key={step.n} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'var(--color-surface)', padding: '.9rem 1.25rem' }}>
                  <div style={{ width: '1.5rem', height: '1.5rem', border: `1.5px solid ${i===steps.length-1?'var(--color-gold)':'var(--color-rim-l)'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.62rem', flexShrink: 0, color: i===steps.length-1?'var(--color-gold)':'var(--color-ink-dim)', background: i===steps.length-1?'rgba(196,153,90,.08)':'transparent' }}>
                    {i===steps.length-1?<Check size={12} />:step.n}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.15rem' }}>{step.title}</div>
                    <div style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const SOLID_BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
  padding: '.85rem 1.5rem',
  background: 'var(--color-gold)', border: 'none',
  color: 'var(--color-bg)', fontFamily: 'var(--font-body)',
  fontSize: '.78rem', fontWeight: 600, letterSpacing: '.15em',
  textTransform: 'uppercase', textDecoration: 'none', transition: 'background .3s',
  borderRadius: '4px',
}
