interface NotificationData {
  patientName: string
  service: string
  date: string
  time: string
  phone: string
  doctorPhone: string
  calendarPageUrl?: string
}

const CALLMEBOT_KEY = import.meta.env.VITE_CALLMEBOT_KEY as string ?? ''

function buildMessage(d: NotificationData): string {
  // Convierte https:// → webcal:// para que iOS abra el Calendar directo
  const lines = [
    `*Nueva Cita*\n`,
    `*Paciente:* ${d.patientName}`,
    `*Servicio:* ${d.service}`,
    `*Fecha:* ${d.date}`,
    `*Hora:* ${d.time}`,
    `*Telefono:* ${d.phone}`,
  ]

  // El link del calendario se envía manualmente la primera vez
  // Para enviarlo: notifyDoctor({ ..., sendCalendarLink: true })

  return lines.join('\n')
}

function openWhatsApp(data: NotificationData) {
  const text = encodeURIComponent(buildMessage(data))
  window.open(`https://wa.me/${data.doctorPhone}?text=${text}`, '_blank')
}

async function sendCallMeBot(data: NotificationData): Promise<boolean> {
  if (!CALLMEBOT_KEY) return false
  const text = encodeURIComponent(buildMessage(data))
  const url  = `https://api.callmebot.com/whatsapp.php?phone=${data.doctorPhone}&text=${text}&apikey=${CALLMEBOT_KEY}`
  try { await fetch(url); return true } catch { return false }
}

export async function notifyDoctor(data: NotificationData) {
  if (CALLMEBOT_KEY) {
    await sendCallMeBot(data)
  } else {
    openWhatsApp(data)
  }
}
