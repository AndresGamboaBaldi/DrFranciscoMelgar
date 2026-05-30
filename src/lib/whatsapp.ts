/**
 * WhatsApp notification utilities
 *
 * Two modes:
 *  1. wa.me link  — opens WhatsApp with a pre-filled message (works with zero setup)
 *  2. CallMeBot   — sends an automated message to the doctor (requires one-time setup)
 *
 * Set VITE_DOCTOR_WHATSAPP in .env (international format, no +, no spaces: 573001234567)
 * Set VITE_CALLMEBOT_KEY in .env to enable automated notifications.
 */

const DOCTOR_PHONE = import.meta.env.VITE_DOCTOR_WHATSAPP as string ?? '573001234567'
const CALLMEBOT_KEY = import.meta.env.VITE_CALLMEBOT_KEY  as string ?? ''

interface NotificationData {
  patientName: string
  service: string
  date: string
  time: string
  phone: string
  email: string
}

/** Builds the pre-filled WhatsApp message text */
function buildMessage(d: NotificationData): string {
  return (
    `*Nueva Cita*\n\n` +
    `*Paciente:* ${d.patientName}\n` +
    `*Tratamiento:* ${d.service}\n` +
    `*Fecha:* ${d.date}\n` +
    `*Hora:* ${d.time}\n` +
    `*Telefono:* ${d.phone}\n` +
    `*Email:* ${d.email}`
  )
}

/**
 * MODE 1 — wa.me link
 * Opens WhatsApp in a new tab with the message pre-filled.
 * The patient sends it manually — no API required.
 */
export function openWhatsAppConfirmation(data: NotificationData) {
  const text = encodeURIComponent(buildMessage(data))
  window.open(`https://wa.me/${DOCTOR_PHONE}?text=${text}`, '_blank')
}

/**
 * MODE 2 — CallMeBot (automated, no patient action needed)
 * Doctor must activate their number once at: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 * Then set VITE_CALLMEBOT_KEY in .env
 */
export async function sendCallMeBot(data: NotificationData): Promise<boolean> {
  if (!CALLMEBOT_KEY) return false

  const text = encodeURIComponent(buildMessage(data))
  const url  = `https://api.callmebot.com/whatsapp.php?phone=${DOCTOR_PHONE}&text=${text}&apikey=${CALLMEBOT_KEY}`

  try {
    await fetch(url)
    return true
  } catch {
    console.warn('[CallMeBot] Notification failed')
    return false
  }
}

/**
 * Main notification dispatcher.
 * Uses CallMeBot if configured, falls back to wa.me link.
 */
export async function notifyDoctor(data: NotificationData) {
  if (CALLMEBOT_KEY) {
    await sendCallMeBot(data)
  } else {
    openWhatsAppConfirmation(data)
  }
}
