interface NotificationData {
  patientName: string
  service: string
  date: string
  time: string
  phone: string
  email: string
  doctorPhone: string   // per-professional phone from config
}

const CALLMEBOT_KEY = import.meta.env.VITE_CALLMEBOT_KEY as string ?? ''

function buildMessage(d: NotificationData): string {
  return (
    `*Nueva Cita*\n\n` +
    `*Paciente:* ${d.patientName}\n` +
    `*Servicio:* ${d.service}\n` +
    `*Fecha:* ${d.date}\n` +
    `*Hora:* ${d.time}\n` +
    `*Telefono:* ${d.phone}\n` +
    `*Email:* ${d.email}`
  )
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
