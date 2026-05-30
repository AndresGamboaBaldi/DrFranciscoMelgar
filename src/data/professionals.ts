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
  slug:      'doctor_melgar',
  name:      'Dr. Francisco Melgar',
  shortName: 'Dr. Melgar',
  title:     'Médico Estético',
  specialty: 'Especialista en estética avanzada y medicina antienvejecimiento',
  location:  'La Paz, Bolivia',
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
    { id: 'botox',       name: 'Toxina Botulínica', tag: 'Neuromodulador',  duration: '45 min', price: 'Desde Bs. 350', icon: '◈', description: 'Suaviza líneas de expresión y previene el envejecimiento prematuro. Resultados completamente naturales que preservan la expresividad del rostro.' },
    { id: 'hialuronico', name: 'Ácido Hialurónico', tag: 'Voluminizador',   duration: '60 min', price: 'Desde Bs. 550', icon: '◉', description: 'Restaura el volumen perdido y define los contornos del rostro. Resultados inmediatos y duraderos de hasta 18 meses.' },
    { id: 'colageno',    name: 'Colágeno & PRP',    tag: 'Bioestimulación', duration: '75 min', price: 'Desde Bs. 480', icon: '◇', description: 'Estimula la producción natural de colágeno. Rejuvenecimiento profundo con resultados progresivos.' },
    { id: 'peeling',     name: 'Peeling Médico',    tag: 'Renovación',      duration: '50 min', price: 'Desde Bs. 280', icon: '◫', description: 'Renueva la textura y luminosidad de la piel. Trata manchas, poros y marcas desde la primera sesión.' },
    { id: 'radio',       name: 'Radiofrecuencia',   tag: 'Reafirmación',    duration: '60 min', price: 'Desde Bs. 320', icon: '◎', description: 'Reafirma y tensa la piel sin cirugía. Efecto lifting completamente natural.' },
    { id: 'labios',      name: 'Diseño de Labios',  tag: 'Diseño',          duration: '45 min', price: 'Desde Bs. 450', icon: '◈', description: 'Perfilado y volumización natural y armónico. Técnica de microcánula para mayor confort.' },
  ],

  testimonials: [
    { initial: 'S', name: 'Sofía M.',    detail: 'Ácido Hialurónico · La Paz',  text: '"Llevaba años con inseguridades. El Dr. Melgar me escuchó con calma y el resultado fue completamente natural. ¡Me encantó!"' },
    { initial: 'C', name: 'Carla H.',    detail: 'Radiofrecuencia · La Paz',    text: '"Después de mi primera sesión noté la piel más firme y luminosa. El consultorio es impecable y la atención de primer nivel."' },
    { initial: 'V', name: 'Valeria C.',  detail: 'Diseño de Labios · La Paz',   text: `"Siempre tuve miedo de quedar 'rara'. El Dr. Melgar tiene un ojo artístico increíble. El resultado fue perfecto."` },
  ],

  phone:   '59172235605',
  email:   'citas@drmelgar.bo',
  address: 'Av. Arce #2345, Of. 8B\nLa Paz, Bolivia',
  schedule: ['Lun — Vie: 8:00 — 18:00', 'Sábados: 9:00 — 14:00'],

  doctorId:        'doctor_melgar',
  calendarFeedUrl: import.meta.env.VITE_CALENDAR_FEED_URL ?? '',
}

// ────────────────────────────────────────────────────────────────
//  2. BARBER VIP — Barbería de lujo
//  (ejemplo de cómo agregar un negocio diferente)
// ────────────────────────────────────────────────────────────────
const barber_vip: Professional = {
  slug:      'barber_vip',
  name:      'Barber VIP',
  shortName: 'Barber VIP',
  title:     'Barbería de Lujo',
  specialty: 'Corte, barba y grooming de primera clase en La Paz',
  location:  'La Paz, Bolivia',
  tagline:   'El estilo no es accidental,',
  taglineSub: 'es una decisión.',
  stats: [
    { n: '+500',  label: 'Clientes satisfechos' },
    { n: '8+',    label: 'Años de experiencia' },
  ],

  aboutTitle: 'la Barbería',
  quote: 'Cada cliente merece salir con más confianza de la que entró.',
  bio: 'Barber VIP nació con la visión de traer a La Paz una experiencia de barbería de lujo: ambiente premium, técnicas modernas y atención personalizada. Nuestro equipo de barberos certificados se especializa en cortes clásicos, fade, diseño de barba y tratamientos capilares.',
  credentials: [
    { label: 'Especialidad',   value: 'Fade & Cortes Clásicos' },
    { label: 'Certificación',  value: 'Barbería Profesional' },
    { label: 'Servicio',       value: 'Corte + Barba + Grooming' },
    { label: 'Ambiente',       value: 'Premium & Exclusivo' },
  ],

  services: [
    { id: 'corte',       name: 'Corte Clásico',     tag: 'Clásico',    duration: '30 min', price: 'Desde Bs. 60',  icon: '◈', description: 'Corte tradicional con tijera o máquina. Acabado impecable con productos premium.' },
    { id: 'fade',        name: 'Fade & Degradado',  tag: 'Moderno',    duration: '45 min', price: 'Desde Bs. 80',  icon: '◉', description: 'Low fade, mid fade o high fade. Técnica de precisión para un resultado perfecto.' },
    { id: 'barba',       name: 'Diseño de Barba',   tag: 'Grooming',   duration: '30 min', price: 'Desde Bs. 50',  icon: '◇', description: 'Definición, contorno y acabado de barba con navaja y toalla caliente.' },
    { id: 'combo',       name: 'Corte + Barba',     tag: 'Combo',      duration: '60 min', price: 'Desde Bs. 120', icon: '◫', description: 'El servicio completo: corte a elección más diseño y arreglo de barba.' },
    { id: 'tratamiento', name: 'Tratamiento Capilar',tag: 'Premium',   duration: '45 min', price: 'Desde Bs. 90',  icon: '◎', description: 'Hidratación y nutrición profunda del cabello con productos de alta gama.' },
    { id: 'nino',        name: 'Corte Niños',       tag: 'Familiar',   duration: '25 min', price: 'Desde Bs. 40',  icon: '◈', description: 'Corte especializado para niños, con paciencia y técnica adaptada.' },
  ],

  testimonials: [
    { initial: 'R', name: 'Roberto L.',  detail: 'Fade · La Paz',      text: '"El mejor fade que me han hecho en La Paz. Ambiente de primera, trato excelente y el resultado superó mis expectativas."' },
    { initial: 'M', name: 'Miguel A.',   detail: 'Corte + Barba · LP', text: '"Vine por primera vez y ya no voy a otro lugar. El combo de corte y barba quedó perfecto, muy profesionales."' },
    { initial: 'D', name: 'Daniel F.',   detail: 'Grooming · La Paz',  text: '"Finalmente una barbería en La Paz que cumple los estándares internacionales. Muy recomendado."' },
  ],

  phone:   '59171234567',
  email:   'citas@barbervip.bo',
  address: 'Calle 21 de Calacoto #1234\nLa Paz, Bolivia',
  schedule: ['Mar — Sáb: 9:00 — 20:00', 'Domingos: 10:00 — 15:00'],

  doctorId:        'barber_vip',
  calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=0222570cde55eccd22b87076f8fa4e2ca58558425c2951dba051098354b493d5', // agregar cuando tengas el token de Supabase
}

// ────────────────────────────────────────────────────────────────
//  REGISTRO — agrega aquí cada nuevo profesional
// ────────────────────────────────────────────────────────────────
export const PROFESSIONALS: Record<string, Professional> = {
  doctor_melgar,
  barber_vip,
}

export function getProfessional(slug: string): Professional | null {
  return PROFESSIONALS[slug] ?? null
}
