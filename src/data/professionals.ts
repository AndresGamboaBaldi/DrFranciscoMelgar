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
  photos: ['/doctor_melgar/photos/drmelgar_1.jpeg', '/doctor_melgar/photos/drmelgar_ofi2.jpeg', '/doctor_melgar/photos/drmelgar_ofi3.jpeg', '/doctor_melgar/photos/drmelgar_ofi.jpeg'],
  slug:      'doctor_melgar',
  category:  'estetica',
  heroPhoto: '/doctor_melgar/photos/drmelgar.jpeg',
  name:      'Dr. Francisco Melgar',
  shortName: 'Dr. Melgar',
  title:     'Médico Estético',
  specialty: 'Especialista en Medicina Estetica y Tricologia',
  location:  'Cochabamba, Bolivia',
  tagline:    'La confianza',
  taglineSub: 'comienza aquí.',
  stats: [
    { n: '+1.000', label: 'Pacientes atendidos' },
    { n: '5+',    label: 'Años de experiencia' },
  ],

  aboutTitle: 'del Doctor',
  finalQuote: 'La mejor inversión es en ti mismo.',
  bio: 'Después de años de formación en España y Brasil, dos referentes mundiales en medicina estética, y con experiencia en congresos internacionales junto a los mejores especialistas del mundo, llego a Bolivia para brindarte lo último en estética y salud capilar. Mi consulta nace con la visión de que la medicina estética no debe cambiar quien eres, sino resaltar tu mejor versión con elegancia, naturalidad y confianza. Cada detalle de mi práctica esta pensada para ofrecerte una experiencia personalizada y cercana, porque la verdadera transformación se refleja no solo en tu imagen, sino en la seguridad con la que eliges presentarte al mundo.',
  credentials: [
    { label: 'Formación',       value: 'Universidad Privada del Valle' },
    { label: 'Fellowship',      value: 'Madrid · Medicina Estetica' },
    { label: 'Especialización', value: 'Medicina Estetica y Tricologia' },
    { label: 'Certificaciones', value: 'ISAPS · AMAE · SEME' },
  ],

  services: [
    { id: 'botox',       name: 'Toxina Botulínica', tag: 'Neuromodulador',  durationMins: 120, price: 'Desde Bs. 350', icon: '◈', description: 'Suaviza líneas de expresión y previene el envejecimiento prematuro. Resultados completamente naturales que preservan la expresividad del rostro.',  image: '/doctor_melgar/services/toxina.jpg' },
    { id: 'hialuronico', name: 'Ácido Hialurónico', tag: 'Voluminizador',   price: 'Desde Bs. 550', icon: '◉', description: 'Restaura el volumen perdido y define los contornos del rostro. Resultados inmediatos y duraderos de hasta 18 meses.',                image: '/doctor_melgar/services/acido.jpeg' },
    { id: 'labios',      name: 'Diseño de Labios',  tag: 'Diseño',          price: 'Desde Bs. 450', icon: '◈', description: 'Perfilado y volumización natural y armónico. Técnica de microcánula para mayor confort.',                                             image: '/doctor_melgar/services/labios.jpg' },
    { id: 'colageno',    name: 'Colágeno & PRP',    tag: 'Bioestimulación', price: 'Desde Bs. 480', icon: '◇', description: 'Estimula la producción natural de colágeno. Rejuvenecimiento profundo con resultados progresivos.' },
    { id: 'peeling',     name: 'Peeling Médico',    tag: 'Renovación',      price: 'Desde Bs. 280', icon: '◫', description: 'Renueva la textura y luminosidad de la piel. Trata manchas, poros y marcas desde la primera sesión.' },
    { id: 'radio',       name: 'Radiofrecuencia',   tag: 'Reafirmación',    price: 'Desde Bs. 320', icon: '◎', description: 'Reafirma y tensa la piel sin cirugía. Efecto lifting completamente natural.' },
  ],

  phone:   '59172235604',
  email:   'melgarbaldi.hf@gmail.com',
  address: 'Parque Fidel Anze #2345, Of. 8B\nCochabamba, Bolivia',
  schedule: ['Lun — Vie: 8:00 — 18:00', 'Sábados: 9:00 — 14:00'],

  theme: {
    mode:        'light',
    accent:      '#b07c35',
    accentLight: '#c48c45',
    fonts: {
      display:        'Playfair Display',
      body:           'DM Sans',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap',
    },
  },

  mapUrl: 'https://maps.app.goo.gl/eMHRUCNk4ji62wC99?g_st=ic',
  doctorId:        'doctor_melgar',
  calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=cdebf6a18fc4c3be2c64acffa23b946165c8c5c1ba50981dee6ad5d70df5c5c7',
}

// ────────────────────────────────────────────────────────────────
//  2. BARBER VIP — Barbería de lujo
// ────────────────────────────────────────────────────────────────
const barber_vip: Professional = {
  photos: ['/barber_vip/photos/vip2.avif'],
  slug:      'barber_vip',
  category:  'barbero',
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

  aboutTitle: 'de la Barbería',
  finalQuote: 'Un buen corte no cambia cómo te ves. Cambia cómo te sientes al salir por esa puerta.',
  bio: 'Barber VIP nació con la visión de traer a La Paz una experiencia de barbería de lujo: ambiente premium, técnicas modernas y atención personalizada. Nuestro equipo de barberos certificados se especializa en cortes clásicos, fade, diseño de barba y tratamientos capilares.',
  credentials: [
    { label: 'Certificación', value: 'Barbería Profesional' },
    { label: 'Ambiente',      value: 'Premium & Exclusivo' },
  ],

  services: [
    { id: 'corte',  name: 'Corte Clásico',    tag: 'Clásico',   price: 'Desde Bs. 60',  icon: '◈', description: 'Corte tradicional con tijera o máquina. Acabado impecable con productos premium.',                                                                                   image: '/barber_vip/services/clasico.jpeg' },
    { id: 'fade',   name: 'Fade & Degradado', tag: 'Moderno',   price: 'Desde Bs. 80',  icon: '◉', description: 'Low fade, mid fade o high fade. Técnica de precisión para un resultado perfecto.',                                                                             image: '/barber_vip/services/fade.jpeg' },
    { id: 'diseno', name: 'Diseño Capilar',   tag: 'Artístico', price: 'Desde Bs. 60',  icon: '◇', description: 'Líneas, figuras y patrones personalizados rasados con máquina de precisión. Cada diseño es único y refleja tu estilo.',                                     image: '/barber_vip/services/diseno.jpeg' },
    { id: 'tinte',  name: 'Tinte & Color',    tag: 'Color',     price: 'Desde Bs. 150', icon: '◎', description: 'Coloración profesional con productos de alta calidad. Desde colores naturales hasta transformaciones radicales, con cuidado total del cabello.',             image: '/barber_vip/services/tinte.jpeg' },
  ],

  phone:   '59171234567',
  email:   'citas@barbervip.bo',
  address: 'Av Uyuni #1234\nCochabamba, Bolivia',
  schedule: ['Mar — Sáb: 9:00 — 20:00', 'Domingos: 10:00 — 15:00'],

  theme: {
    mode:        'dark',
    accent:      '#4a8fa8',
    accentLight: '#5ca3bf',
    fonts: {
      display:        'Bebas Neue',
      body:           'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap',
    },
  },

  doctorId:        'barber_vip',
  calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=12d9f83cca937e8db7996811bfafff18bb0e725efacce7c76cad8029bf96fb3e',
}

// ────────────────────────────────────────────────────────────────
//  3. DR. IVAN SEIFERT — Endodoncia
// ────────────────────────────────────────────────────────────────
const dr_seifert: Professional = {
  photos: ['/dr_seifert/photos/dr_seifert_3.jpeg', '/dr_seifert/photos/dr_seifert_1.jpeg'],
  heroPhoto: '/dr_seifert/photos/dr_seifert_2.jpeg',
  slug:      'dr_seifert',
  category:  'dentista',
  name:      'Dr. Ivan Seifert',
  shortName: 'Dr. Seifert',
  title:     'Especialista en Endodoncia',
  specialty: 'Especialista en endodoncia y tratamiento de conductos',
  location:  'Cochabamba, Bolivia',
  tagline:   'Una sonrisa perfecta no es suerte,',
  taglineSub: 'es diseño.',
  stats: [
    { n: '+2.000', label: 'Pacientes atendidos' },
    { n: '12+',    label: 'Años de experiencia' },
  ],

  aboutTitle: 'del Doctor',
  finalQuote: 'Una sonrisa saludable y hermosa es la inversión más visible que puedes hacer en ti mismo.',
  bio: 'El Dr. Ivan Seifert es especialista en Endodoncia, egresado de la Universidad Mayor de San Andrés con especialización en tratamiento de conductos y patología pulpar. Con más de 12 años de experiencia, combina tecnología de vanguardia con precisión clínica para preservar la salud dental de sus pacientes, siempre priorizando el bienestar y la comodidad durante cada procedimiento.',
  credentials: [
    { label: 'Formación',       value: 'Univ. Mayor de San Simon' },
    { label: 'Especialización', value: 'Endodoncia' },
    { label: 'Área principal',  value: 'Tratamiento de Conductos' },
    { label: 'Certificaciones', value: 'ADA · LAOBO · SOB' },
  ],

  services: [
    { id: 'limpieza',       name: 'Limpieza & Profilaxis',  tag: 'Preventivo', price: 'Desde Bs. 180', icon: '◈', description: 'Limpieza profunda que elimina sarro, placa bacteriana y manchas. Incluye pulido y fluorización para una protección duradera.', image: '/dr_seifert//services/limpieza.jpg'  },
    { id: 'blanqueamiento', name: 'Blanqueamiento Dental',  tag: 'Estético',   price: 'Desde Bs. 450', icon: '◉', description: 'Sistema de blanqueamiento profesional en consultorio. Resultados visibles desde la primera sesión, hasta 8 tonos más claro.', image: '/dr_seifert//services/blanqueamiento.jpg'  },
    { id: 'carillas',       name: 'Carillas de Porcelana',  tag: 'Diseño',     price: 'Desde Bs. 650', icon: '◇', description: 'Finas láminas de porcelana que transforman la forma, color y alineación de los dientes. Resultado natural y duradero por más de 15 años.', image: '/dr_seifert//services/carillas.jpg'  },
  ],

  phone:   '59170788218',
  email:   'citas@drseifert.bo',
  address: 'Av. Salamanca #1234\nCochabamba, Bolivia',
  schedule: ['Lun — Vie: 8:00 — 18:00', 'Sábados: 9:00 — 13:00'],

  theme: {
    mode:        'light',
    accent:      '#2b7a9e',
    accentLight: '#3a8fb5',
    fonts: {
      display:        'Playfair Display',
      body:           'DM Sans',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap',
    },
  },

  doctorId:        'dr_seifert',
  calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=260c5ffb85568bb46747195dee3d3abb4b8a09775b835d1d268fbe47fa8cfa4f',
}

// ────────────────────────────────────────────────────────────────
//  4. JHOEL CUTS — Barbería & Estilismo
// ────────────────────────────────────────────────────────────────
const jhoel_cuts: Professional = {
  slug:      'jhoel_cuts',
  category:  'barbero',
  name:      'Jhoel Cuts',
  shortName: 'Jhoel Cuts',
  title:     'Barbero & Estilista',
  specialty: 'Cortes de autor, fade artístico y estilismo personalizado',
  location:  'Cochabamba, Bolivia',
  tagline:   'Tu imagen,',
  taglineSub: 'tu identidad.',
  stats: [
    { n: '+800', label: 'Clientes satisfechos' },
    { n: '6+',   label: 'Años de experiencia' },
  ],

  aboutTitle: 'del Barbero',
  finalQuote: 'No solo cortamos cabello — construimos confianza, un corte a la vez.',
  bio: 'Jhoel es un barbero y estilista con más de 6 años de trayectoria en el arte del corte masculino. Especializado en fades de precisión, cortes de autor y diseño de barba, su enfoque combina técnica depurada con un estilo propio que lo distingue. Cada cliente recibe una atención completamente personalizada: desde la consulta inicial hasta el acabado final, porque para Jhoel cada corte es una obra única.',
  credentials: [
    { label: 'Especialidad',  value: 'Fade & Cortes de Autor' },
    { label: 'Formación',     value: 'Escuela de Barbería Profesional' },
    { label: 'Técnica',       value: 'Navaja · Tijera · Máquina' },
    { label: 'Ambiente',      value: 'Moderno & Exclusivo' },
  ],

  services: [
    { id: 'corte',  name: 'Corte Clásico',    tag: 'Clásico',   price: 'Desde Bs. 60',  icon: '◈', description: 'Corte tradicional con tijera o máquina. Acabado impecable con productos premium.',                                                                                   image: '/barber_vip/services/clasico.jpeg' },
    { id: 'fade',   name: 'Fade & Degradado', tag: 'Moderno',   price: 'Desde Bs. 80',  icon: '◉', description: 'Low fade, mid fade o high fade. Técnica de precisión para un resultado perfecto.',                                                                             image: '/barber_vip/services/fade.jpeg' },
    { id: 'diseno', name: 'Diseño Capilar',   tag: 'Artístico', price: 'Desde Bs. 60',  icon: '◇', description: 'Líneas, figuras y patrones personalizados rasados con máquina de precisión. Cada diseño es único y refleja tu estilo.',                                     image: '/barber_vip/services/diseno.jpeg' },
    { id: 'tinte',  name: 'Tinte & Color',    tag: 'Color',     price: 'Desde Bs. 150', icon: '◎', durationMins: 120, description: 'Coloración profesional con productos de alta calidad. Desde colores naturales hasta transformaciones radicales, con cuidado total del cabello.', image: '/barber_vip/services/tinte.jpeg' },
  ],

  photos: ['/jhoel_cuts/photos/jhoel.jpeg','/jhoel_cuts/photos/barberia.webp'],
  heroPhoto: '/jhoel_cuts/photos/barberia.webp',

  phone:   '59177933737',
  email:   'citas@jhoelcuts.bo',
  address: 'Av. Uyuni #567\nCochabamba, Bolivia',
  schedule: ['Lun — Sáb: 9:00 — 20:00', 'Domingos: 10:00 — 16:00'],

  theme: {
    mode:        'dark',
    accent:      '#2855c2',
    accentLight: '#3d6edc',
    fonts: {
      display:        'Bebas Neue',
      body:           'Inter',
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap',
    },
  },

  mapUrl: 'https://maps.app.goo.gl/qcWfFwZqksNu2iFYA?g_st=ic',
  doctorId:        'jhoel_cuts',
  calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=48878751185480866b8822fd28a7e6da2618541ae38a5c8e61596856145b5be8',
}

// ────────────────────────────────────────────────────────────────
//  REGISTRO
// ────────────────────────────────────────────────────────────────
export const PROFESSIONALS: Record<string, Professional> = {
  doctor_melgar,
  barber_vip,
  dr_seifert,
  jhoel_cuts,
}

export function getProfessional(slug: string): Professional | null {
  return PROFESSIONALS[slug] ?? null
}
