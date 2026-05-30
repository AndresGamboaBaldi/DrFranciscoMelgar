export interface ProService {
  id: string
  name: string
  tag: string
  duration: string
  price: string
  icon: string
  description: string
}

export interface ProTestimonial {
  initial: string
  name: string
  detail: string
  text: string
}

export interface ProCredential {
  label: string
  value: string
}

export interface Professional {
  // ── URL ─────────────────────────────────────────────────────
  slug: string             // 'doctor_melgar'  →  pro.bo/doctor_melgar

  // ── Identidad ───────────────────────────────────────────────
  name: string             // 'Dr. Francisco Melgar'
  shortName: string        // 'Dr. Melgar'  (navbar)
  title: string            // 'Médico Estético'
  specialty: string        // subtítulo debajo del nombre en el hero

  // ── Hero ────────────────────────────────────────────────────
  location: string         // 'La Paz, Bolivia'
  tagline: string          // frase principal
  taglineSub: string       // segunda línea de la frase
  stats: { n: string; label: string }[]

  // ── Acerca de ───────────────────────────────────────────────
  aboutTitle: string       // 'el Doctor' | 'la Barbería' | etc.
  quote: string
  bio: string
  credentials: ProCredential[]

  // ── Servicios ───────────────────────────────────────────────
  services: ProService[]

  // ── Testimonios ─────────────────────────────────────────────
  testimonials: ProTestimonial[]

  // ── Contacto ────────────────────────────────────────────────
  phone: string            // sin + ni espacios: '59172235605'
  email: string
  address: string
  schedule: string[]       // ['Lun — Vie: 9:00 — 18:00', 'Sáb: 9:00 — 14:00']

  // ── Supabase / Calendario ────────────────────────────────────
  doctorId: string         // filtra citas en la DB  →  'doctor_melgar'
  calendarFeedUrl: string  // URL del link mágico .ics
}
