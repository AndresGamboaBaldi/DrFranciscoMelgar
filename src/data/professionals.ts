/**
 * ════════════════════════════════════════════════════════════════
 *  CONFIGURACIÓN DE PROFESIONALES
 *  Agrega o edita profesionales aquí.
 *  La URL será:  pro.bo/<slug>
 * ════════════════════════════════════════════════════════════════
 */

import type { Professional } from '../types/professional'

// ────────────────────────────────────────────────────────────────
//  1. DR. FRANCISCO MELGAR — Medicina Estética
// ────────────────────────────────────────────────────────────────
const doctor_melgar: Professional = {
  photos: ['/photos/drmelgar_1.jpeg', '/photos/drmelgar.jpeg'],
  slug:      'doctor_melgar',
  name:      'Dr. Francisco Melgar',
  shortName: 'Dr. Melgar',
  title:     'Médico Estético',
  specialty: 'Especialista en estética avanzada y medicina antienvejecimiento',
  location:  'Cochabamba, Bolivia',
  tagline:    'La belleza no se crea,',
  taglineSub: 'se revela con precisión.',
  stats: [
    { n: '+3.000', label: 'Pacientes atendidos' },
    { n: '15+',    label: 'Años de experiencia' },
  ],

  aboutTitle: 'el Doctor',
  quote: 'Cada rostro tiene su propia historia. Mi trabajo es escucharla y realzar su belleza natural.',
  bio: 'El Dr. Francisco Melgar es especialista en Medicina Estética y Antienvejecimiento, egresado de la Universidad Mayor de San Andrés con fellowship en estética avanzada en Barcelona. Con más de 15 años de experiencia, ha atendido a más de 3.000 pacientes aplicando protocolos de clase mundial, siempre adaptados al tipo de piel y los objetivos individuales de cada persona.',
  credentials: [
    { label: 'Formación',       value: 'Univ. Mayor de San Andrés' },
    { label: 'Fellowship',      value: 'Barcelona · Est. Avanzada' },
    { label: 'Especialización', value: 'Medicina Antienvejecimiento' },
    { label: 'Certificaciones', value: 'ISAPS · AMAE · SEME' },
  ],

  services: [
    { id: 'botox',       name: 'Toxina Botulínica', tag: 'Neuromodulador',  duration: '45 min', price: 'Desde Bs. 350', icon: '◈', description: 'Suaviza líneas de expresión y previene el envejecimiento prematuro. Resultados completamente naturales que preservan la expresividad del rostro.' ,  image: '/services/toxina.jpg' },
    { id: 'hialuronico', name: 'Ácido Hialurónico', tag: 'Voluminizador',   duration: '60 min', price: 'Desde Bs. 550', icon: '◉', description: 'Restaura el volumen perdido y define los contornos del rostro. Resultados inmediatos y duraderos de hasta 18 meses.', image: '/services/acido.jpeg' },
    { id: 'labios',      name: 'Diseño de Labios',  tag: 'Diseño',          duration: '45 min', price: 'Desde Bs. 450', icon: '◈', description: 'Perfilado y volumización natural y armónico. Técnica de microcánula para mayor confort.',  image: '/services/labios.jpg'  },
    { id: 'colageno',    name: 'Colágeno & PRP',    tag: 'Bioestimulación', duration: '75 min', price: 'Desde Bs. 480', icon: '◇', description: 'Estimula la producción natural de colágeno. Rejuvenecimiento profundo con resultados progresivos.' },
    { id: 'peeling',     name: 'Peeling Médico',    tag: 'Renovación',      duration: '50 min', price: 'Desde Bs. 280', icon: '◫', description: 'Renueva la textura y luminosidad de la piel. Trata manchas, poros y marcas desde la primera sesión.' },
    { id: 'radio',       name: 'Radiofrecuencia',   tag: 'Reafirmación',    duration: '60 min', price: 'Desde Bs. 320', icon: '◎', description: 'Reafirma y tensa la piel sin cirugía. Efecto lifting completamente natural.' },
  ],

  phone:   '59172235605',
  email:   'citas@drmelgar.bo',
  address: 'Parque Fidel Anze #2345, Of. 8B\nCochabamba, Bolivia',
  schedule: ['Lun — Vie: 8:00 — 18:00', 'Sábados: 9:00 — 14:00'],

  // ── Tema: luz cálida / clínica de lujo ──
  theme: {
    mode:        'light',
    accent:      '#b07c35',   // dorado más profundo — mejor contraste sobre blanco
    accentLight: '#c48c45',
  },

  // ── Reservas: slots de 60 min, 24h de anticipación, Lun-Sáb ──
  bookingConfig: {
    slotDuration:    60,
    minAdvanceHours: 24,
    workDays:        [1, 2, 3, 4, 5, 6],          // Lun a Sáb
    workHours:       { start: '08:00', end: '18:00' },
    satHours:        { start: '09:00', end: '14:00' },
  },

  doctorId:        'doctor_melgar',
  calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=cdebf6a18fc4c3be2c64acffa23b946165c8c5c1ba50981dee6ad5d70df5c5c7',
}

// ────────────────────────────────────────────────────────────────
//  2. BARBER VIP — Barbería de lujo
// ────────────────────────────────────────────────────────────────
const barber_vip: Professional = {
  photos: ['/photos/vip.jpeg'],
  slug:      'barber_vip',
  name:      'Barber VIP',
  shortName: 'Barber VIP',
  title:     'Barbería de Lujo',
  specialty: 'Corte, barba y grooming de primera clase en La Paz',
  location:  'Cochabamba, Bolivia',
  tagline:   'El estilo no es accidental,',
  taglineSub: 'es una decisión.',
  stats: [
    { n: '+500', label: 'Clientes satisfechos' },
    { n: '8+',   label: 'Años de experiencia' },
  ],

  aboutTitle: 'la Barbería',
  quote: 'Cada cliente merece salir con más confianza de la que entró.',
  bio: 'Barber VIP nació con la visión de traer a La Paz una experiencia de barbería de lujo: ambiente premium, técnicas modernas y atención personalizada. Nuestro equipo de barberos certificados se especializa en cortes clásicos, fade, diseño de barba y tratamientos capilares.',
  credentials: [
    { label: 'Certificación', value: 'Barbería Profesional' },
    { label: 'Ambiente',      value: 'Premium & Exclusivo' },
  ],

  services: [
    { id: 'corte',    name: 'Corte Clásico',    tag: 'Clásico',  duration: '30 min', price: 'Desde Bs. 60',  icon: '◈', description: 'Corte tradicional con tijera o máquina. Acabado impecable con productos premium.',             image: '/services/clasico.jpeg' },
    { id: 'fade',     name: 'Fade & Degradado', tag: 'Moderno',  duration: '45 min', price: 'Desde Bs. 80',  icon: '◉', description: 'Low fade, mid fade o high fade. Técnica de precisión para un resultado perfecto.',             image: '/services/fade.jpeg' },
    { id: 'diseno',   name: 'Diseño Capilar',   tag: 'Artístico',duration: '30 min', price: 'Desde Bs. 60',  icon: '◇', description: 'Líneas, figuras y patrones personalizados rasados con máquina de precisión. Cada diseño es único y refleja tu estilo.',  image: '/services/diseno.jpeg' },
    { id: 'tinte',    name: 'Tinte & Color',    tag: 'Color',    duration: '90 min', price: 'Desde Bs. 150', icon: '◎', description: 'Coloración profesional con productos de alta calidad. Desde colores naturales hasta transformaciones radicales, con cuidado total del cabello.' ,  image: '/services/tinte.jpeg'},
  ],

  phone:   '59171234567',
  email:   'citas@barbervip.bo',
  address: 'Av Uyuni #1234\nCochabamba, Bolivia',
  schedule: ['Mar — Sáb: 9:00 — 20:00', 'Domingos: 10:00 — 15:00'],

  // ── Tema: azul acero (diferente al médico) ──
  theme: {
    accent:      '#b07c35',   // dorado más profundo — mejor contraste sobre blanco
    accentLight: '#c48c45',
  },

  // ── Reservas: slots de 30 min, sin anticipación mínima, Mar-Dom ──
  bookingConfig: {
    slotDuration:    30,
    minAdvanceHours: 0,
    workDays:        [2, 3, 4, 5, 6, 0],           // Mar a Dom
    workHours:       { start: '09:00', end: '20:00' },
    sunHours:        { start: '10:00', end: '15:00' },
  },

  doctorId:        'barber_vip',
  calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=12d9f83cca937e8db7996811bfafff18bb0e725efacce7c76cad8029bf96fb3e',
}

// ────────────────────────────────────────────────────────────────
//  3. DR. IVAN SEIFERT — Odontología Estética
// ────────────────────────────────────────────────────────────────
const dr_seifert: Professional = {
  photos: ['/photos/drseifert.jpeg'],
  slug:      'dr_seifert',
  name:      'Dr. Ivan Seifert',
  shortName: 'Dr. Seifert',
  title:     'Odontólogo Estético',
  specialty: 'Especialista en odontología estética, restauradora e implantología',
  location:  'Cochabamba, Bolivia',
  tagline:   'Una sonrisa perfecta no es suerte,',
  taglineSub: 'es diseño.',
  stats: [
    { n: '+2.000', label: 'Pacientes atendidos' },
    { n: '12+',    label: 'Años de experiencia' },
  ],

  aboutTitle: 'el Doctor',
  quote: 'Cada sonrisa es única. Mi trabajo es revelar la mejor versión de la tuya.',
  bio: 'El Dr. Ivan Seifert es especialista en Odontología Estética y Restauradora, egresado de la Universidad Mayor de San Andrés con especialización en Implantología Oral en São Paulo, Brasil. Con más de 12 años de experiencia, combina tecnología de vanguardia con un enfoque artístico para crear sonrisas naturales y duraderas, siempre priorizando la salud bucal y el bienestar del paciente.',
  credentials: [
    { label: 'Formación',       value: 'Univ. Mayor de San Simon' },
    { label: 'Especialización', value: 'Implantología · São Paulo' },
    { label: 'Área principal',  value: 'Odontología Estética' },
    { label: 'Certificaciones', value: 'ADA · LAOBO · SOB' },
  ],

  services: [
    { id: 'limpieza',      name: 'Limpieza & Profilaxis',  tag: 'Preventivo',   duration: '60 min', price: 'Desde Bs. 180', icon: '◈', description: 'Limpieza profunda que elimina sarro, placa bacteriana y manchas. Incluye pulido y fluorización para una protección duradera.', image: '/services/limpieza.jpg'  },
    { id: 'blanqueamiento',name: 'Blanqueamiento Dental',  tag: 'Estético',     duration: '90 min', price: 'Desde Bs. 450', icon: '◉', description: 'Sistema de blanqueamiento profesional en consultorio. Resultados visibles desde la primera sesión, hasta 8 tonos más claro.', image: '/services/blanqueamiento.jpg'  },
    { id: 'carillas',      name: 'Carillas de Porcelana',  tag: 'Diseño',       duration: 'Variable', price: 'Desde Bs. 650', icon: '◇', description: 'Finas láminas de porcelana que transforman la forma, color y alineación de los dientes. Resultado natural y duradero por más de 15 años.', image: '/services/carillas.jpg'  },
  ],


  phone:   '59170788218',          // ← reemplaza con el número real
  email:   'citas@drseifert.bo',   // ← reemplaza con el email real
  address: 'Av. Salamanca #1234\nCochabamba, Bolivia',
  schedule: ['Lun — Vie: 8:00 — 18:00', 'Sábados: 9:00 — 13:00'],

  // ── Tema: azul dental / clínico ──
  theme: {
    mode:        'light',
    accent:      '#2b7a9e',   // azul teal médico — buen contraste sobre blanco
    accentLight: '#3a8fb5',
  },

  // ── Reservas: 60 min, 24h anticipación, Lun-Sáb ──
  bookingConfig: {
    slotDuration:    60,
    minAdvanceHours: 24,
    workDays:        [1, 2, 3, 4, 5, 6],
    workHours:       { start: '08:00', end: '18:00' },
    satHours:        { start: '09:00', end: '13:00' },
  },

  doctorId:        'dr_seifert',
  calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=bd94b90f5a0d0e6669314ee25b1ef27fdbc439ea787935a4afd150fd37fc6fb6',  // ← completa después del paso 2 abajo
}

// ────────────────────────────────────────────────────────────────
//  REGISTRO
// ────────────────────────────────────────────────────────────────
export const PROFESSIONALS: Record<string, Professional> = {
  doctor_melgar,
  barber_vip,
  dr_seifert,
}

export function getProfessional(slug: string): Professional | null {
  return PROFESSIONALS[slug] ?? null
}
