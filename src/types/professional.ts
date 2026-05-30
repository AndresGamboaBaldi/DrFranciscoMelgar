export interface ProService {
  id: string
  name: string
  tag: string
  duration: string
  price: string
  icon: string
  description: string
}

export interface ProCredential {
  label: string
  value: string
}

/** Color theme — solo necesitas cambiar el acento y el modo */
export interface ProfessionalTheme {
  mode?: 'light' | 'dark'  // 'dark' por defecto
  accent: string            // color principal: botones, highlights, títulos em
  accentLight?: string      // hover del acento (si no se pone, se calcula solo)
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
  workHours: { start: string; end: string }  // 'HH:MM'

  /** Horario especial del sábado (null = cerrado ese día aunque esté en workDays) */
  satHours?: { start: string; end: string } | null

  /** Horario especial del domingo */
  sunHours?: { start: string; end: string } | null
}

export interface Professional {
  // ── URL ─────────────────────────────────────────────────────
  slug: string

  /** Optional logo image path (e.g. '/logos/doctor_melgar.png').
   *  If provided, the Navbar shows the image instead of the text name. */
  logo?: string

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
  quote: string
  bio: string
  credentials: ProCredential[]

  // ── Servicios ───────────────────────────────────────────────
  services: ProService[]

  // ── Contacto ────────────────────────────────────────────────
  phone: string
  email: string
  address: string
  schedule: string[]

  // ── Tema visual ─────────────────────────────────────────────
  theme?: ProfessionalTheme

  // ── Reservas ────────────────────────────────────────────────
  bookingConfig: BookingConfig

  // ── Supabase / Calendario ────────────────────────────────────
  doctorId: string
  calendarFeedUrl: string
}
