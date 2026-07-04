export interface ProService {
  id: string
  name: string
  tag: string
  /** Only set for services with a non-default duration (e.g. tinte=120). Otherwise derived from DB slotDuration. */
  durationMins?: number
  price?: string
  description: string
  /** Optional image URL shown at the top of the card (e.g. '/services/botox.jpg') */
  image?: string
}

export interface ProCredential {
  label: string
  value: string
}

/** Color theme — solo necesitas cambiar el acento y el modo */
export interface ProfessionalTheme {
  mode?: 'light' | 'dark' // 'dark' por defecto
  accent: string // color principal: botones, highlights, títulos em
  accentLight?: string // hover del acento (si no se pone, se calcula solo)
  /**
   * Tipografías personalizadas. Si no se especifica, usa Cormorant Garamond + Jost.
   *
   * display → títulos grandes (h1, h2, h3, quotes)
   * body    → texto corriente, botones, labels
   * googleFontsUrl → URL de Google Fonts para cargar las fuentes (opcional si ya están instaladas)
   *
   * Ejemplo:
   *   display: 'Playfair Display'
   *   body: 'DM Sans'
   *   googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap'
   */
  fonts?: {
    display: string
    body: string
    googleFontsUrl?: string
  }
}

/** Miembro del staff dentro de una agencia (varios profesionales bajo un mismo slug) */
export interface StaffMember {
  /** Usado en la URL: /:slug/setup/:id */
  id: string
  name: string
  shortName?: string
  title?: string
  photo?: string
  phone?: string

  /** Su propio negocio en Supabase — citas, horarios y notificaciones independientes */
  businessId: string
  calendarFeedUrl?: string

  /** Contraseña propia para entrar a /:slug/setup/:id */
  setupPassword?: string

  /** Array manual de horarios disponibles. Si se define, sobreescribe la generación automática desde Supabase. */
  timeSlots?: string[]
  /** Slots del sábado. Si se define, reemplaza timeSlots solo los sábados. */
  satTimeSlots?: string[]

  /** Servicios propios del staff. Si se define, reemplaza los servicios del profesional en el booking. */
  services?: ProService[]
}

/** Configuración del sistema de reservas */
export interface BookingConfig {
  /** Duración de cada slot en minutos (15 | 30 | 45 | 60) */
  slotDuration: number

  /**
   * Horas mínimas de anticipación para reservar.
   * 0 = sin restricción (puede reservar hoy mismo)
   * 24 = debe reservar con al menos 24 horas de antelación
   */
  minAdvanceHours: number

  /**
   * Días laborables. 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
   * Ej: [1,2,3,4,5] = Lunes a Viernes
   *     [1,2,3,4,5,6] = Lunes a Sábado
   */
  workDays: number[]

  /** Horario general de trabajo */
  workHours: { start: string; end: string } // 'HH:MM'

  /** Horario especial del sábado (null = cerrado ese día aunque esté en workDays) */
  satHours?: { start: string; end: string } | null

  /** Horario especial del domingo */
  sunHours?: { start: string; end: string } | null

  /** Pausa del mediodía u otro break (null = sin pausa) */
  breakHours?: { start: string; end: string } | null
}

export interface Professional {
  // ── URL ─────────────────────────────────────────────────────
  slug: string

  /** Category shown in the home page filters */
  category?: 'medico' | 'dentista' | 'barbero' | 'psicologo' | 'estetica' | 'otro'

  /** Optional logo image path (e.g. '/logos/doctor_melgar.png').
   *  If provided, the Navbar shows it alongside the text name. */
  logo?: string

  /** Hero section photo — shown on the right side of the hero on desktop,
   *  above the content on mobile. No padding/border, full bleed. */
  heroPhoto?: string

  /**
   * Photos for the About section.
   * - 1 photo  → shows as static image
   * - 2+ photos → auto-rotating carousel (changes every 4.5s)
   * Paths relative to /public  e.g. ['/photos/dr1.jpg', '/photos/dr2.jpg']
   */
  photos?: string[]

  // ── Identidad ───────────────────────────────────────────────
  name: string
  shortName: string
  title: string
  specialty: string

  // ── Hero ────────────────────────────────────────────────────
  location: string
  tagline: string
  taglineSub: string
  stats: { n: string; label: string }[]

  // ── Acerca de ───────────────────────────────────────────────
  aboutTitle: string
  bio: string
  credentials: ProCredential[]

  /** Frase final que aparece debajo del Acerca de — centrada y destacada */
  finalQuote?: string

  // ── Servicios ───────────────────────────────────────────────
  services: ProService[]

  /** Google Maps link — shown in hero as "Ubicación" button */
  mapUrl?: string

  /**
   * Array manual de horarios disponibles (e.g. ['09:00','09:30','10:00']).
   * Si se define, CalendarPicker usa estos slots en lugar de generarlos
   * automáticamente desde workHours + slotDuration en Supabase.
   */
  timeSlots?: string[]
  /** Slots del sábado. Si se define, reemplaza timeSlots solo los sábados. */
  satTimeSlots?: string[]

  // ── Contacto ────────────────────────────────────────────────
  phone: string
  email: string
  address: string
  /** Short location hint shown only in the booking confirmation (e.g. "Piso 1, Of. 8B") */
  addressDetail?: string
  schedule: string[]

  // ── Tema visual ─────────────────────────────────────────────
  theme?: ProfessionalTheme

  // ── Supabase / Calendario ────────────────────────────────────
  businessId: string
  calendarFeedUrl: string

  // ── Acceso al panel ?setup ───────────────────────────────────
  /** Contraseña simple para entrar al panel sin Google (opcional, modo rápido) */
  setupPassword?: string

  // ── Agencia: varios profesionales bajo el mismo slug ──────────
  /** Si está presente, el booking dialog pide elegir profesional,
   *  y cada uno tiene su propio panel en /:slug/setup/:staffId */
  staff?: StaffMember[]
}
