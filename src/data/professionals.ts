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
  photos: [
    '/doctor_melgar/photos/drmelgar.jpeg',
    '/doctor_melgar/photos/drmelgar_ofi2.jpeg',
    '/doctor_melgar/photos/drmelgar_ofi3.jpeg',
    '/doctor_melgar/photos/drmelgar_ofi.jpeg',
  ],
  slug: 'doctor_melgar',
  category: 'estetica',
  heroPhoto: '/doctor_melgar/photos/drmelgar_1.jpeg',
  name: 'Dr. Francisco Melgar',
  shortName: 'Dr. Melgar',
  title: 'Médico Estético',
  specialty: 'Especialista en Medicina Estetica y Tricologia',
  location: 'Cochabamba, Bolivia',
  tagline: 'La confianza',
  taglineSub: 'comienza aquí.',
  stats: [
    { n: '+500', label: 'Pacientes satisfechos' },
    { n: '5+', label: 'Años de experiencia' },
  ],

  aboutTitle: 'del Doctor',
  finalQuote: 'La mejor inversión es en ti mismo.',
  bio: 'Después de años de formación en España y Brasil, dos referentes mundiales en medicina estética, y con experiencia en congresos internacionales junto a los mejores especialistas del mundo, llego a Bolivia para brindarte lo último en estética y salud capilar. Mi consulta nace con la visión de que la medicina estética no debe cambiar quien eres, sino resaltar tu mejor versión con elegancia, naturalidad y confianza. Cada detalle de mi práctica esta pensada para ofrecerte una experiencia personalizada y cercana, porque la verdadera transformación se refleja no solo en tu imagen, sino en la seguridad con la que eliges presentarte al mundo.',
  credentials: [
    { label: 'Formación', value: 'Médico Cirujano · Universidad Privada del Valle' },
    { label: 'Máster', value: 'Tricología y Transpante Capilar · Madrid, España' },
    { label: 'Máster', value: 'Medicina Estética y Antienvejecimiento · Madrid, España' },
    { label: 'Máster', value: 'Armonización Facial · São Paulo, Brasil' },
  ],

  services: [
    {
      id: 'consulta',
      name: 'Consulta de Valoración',
      tag: 'Diagnóstico',
      durationMins: 30,
      image: '/doctor_melgar/services/consulta.jpeg',
      description:
        'Evaluación personalizada para identificar qué tratamientos se adaptan mejor a tu rostro y objetivos. Ideal si aún no sabes qué necesitas.',
    },
    {
      id: 'botox-facial',
      name: 'Toxina Botulínica · Rostro',
      tag: 'Neuromodulador',
      durationMins: 30,
      description:
        'Suaviza líneas de expresión en entrecejo, frente y patas de gallo, previniendo el envejecimiento prematuro con resultados completamente naturales.',
      image: '/doctor_melgar/services/toxina.jpg',
    },
    {
      id: 'botox-terapeutico',
      name: 'Toxina Botulínica · Terapéutica',
      tag: 'Neuromodulador',
      durationMins: 30,
      description:
        'Tratamiento para bruxismo, bandas del cuello e hiperhidrosis (sudoración excesiva) en axilas.',
      image: '/doctor_melgar/services/bruxismo.jpg',
    },
    {
      id: 'hialuronico-labios',
      name: 'Ácido Hialurónico · Labios y Contorno',
      tag: 'Voluminizador',
      durationMins: 60,
      description:
        'Volumiza y define labios, surcos nasogenianos y ojeras con resultados inmediatos y naturales.',
      image: '/doctor_melgar/services/labios.jpg',
    },
    {
      id: 'hialuronico-rino',
      name: 'Ácido Hialurónico · Rinomodelación',
      tag: 'Voluminizador',
      durationMins: 60,
      description:
        'Define el perfil nasal sin cirugía, corrigiendo joroba, punta y proporciones de la nariz.',
      image: '/doctor_melgar/services/nariz.jpg',
    },
    {
      id: 'hialuronico-mandibula',
      name: 'Ácido Hialurónico · Definición Mandibular',
      tag: 'Voluminizador',
      durationMins: 60,
      image: '/doctor_melgar/services/menton.avif',
      description:
        'Marca la mandíbula, define el mentón y refuerza los puntos de anclaje facial para un perfil más anguloso y masculino.',
    },
    {
      id: 'capilar',
      name: 'Salud Capilar',
      tag: 'Mesoterapia',
      durationMins: 30,
      image: '/doctor_melgar/services/capilar.jpg',
      description:
        'Fortalece, revitaliza y estimula el crecimiento del cabello mediante mesoterapia capilar, en sesiones individuales o packs.',
    },
    {
      id: 'bioestimuladores',
      name: 'Bioestimuladores',
      tag: 'Colágeno',
      durationMins: 60,
      image: '/doctor_melgar/services/bioestimuladores.jpg',
      description:
        'Estimulan la producción natural de colágeno para una piel más firme y joven, con resultados progresivos y duraderos.',
    },
    {
      id: 'skinboosters',
      name: 'Calidad de Piel',
      tag: 'Skinboosters',
      durationMins: 30,
      image: '/doctor_melgar/services/piel.jpg',
      description:
        'Skinboosters y bioestimulación dérmica para mejorar hidratación, luminosidad y textura de la piel.',
    },
  ],

  phone: '59172235604',
  email: 'melgarbaldi.hf@gmail.com',
  address: 'Edif. Central Park Collection 2',
  addressDetail: 'Piso 1, Oficina 2',
  schedule: ['Lun — Vie: 9:00 — 21:00', 'Sábados: 9:00 — 14:00'],

  theme: {
    mode: 'light',
    accent: '#b07c35',
    accentLight: '#c48c45',
    fonts: {
      display: 'Playfair Display',
      body: 'DM Sans',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap',
    },
  },

  mapUrl: 'https://maps.app.goo.gl/eMHRUCNk4ji62wC99?g_st=ic',
  businessId: 'doctor_melgar',
  calendarFeedUrl:
    'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=cdebf6a18fc4c3be2c64acffa23b946165c8c5c1ba50981dee6ad5d70df5c5c7',
  setupPassword: 'melgar2026',
}

// ────────────────────────────────────────────────────────────────
//  2. BARBER VIP — Barbería de lujo
// ────────────────────────────────────────────────────────────────
const barber_vip: Professional = {
  heroPhoto: '/barber_vip/photos/barberia.webp',
  photos: ['/barber_vip/photos/jhoel.jpeg'],
  slug: 'barber_vip',
  category: 'barbero',
  name: 'Barber VIP',
  shortName: 'Barber VIP',
  title: 'Barbería de Lujo',
  specialty: 'Corte, barba y grooming de primera clase en Cochabamba',
  location: 'Cochabamba, Bolivia',
  tagline: 'El estilo no es accidental,',
  taglineSub: 'es una decisión.',

  stats: [
    { n: '+500', label: 'Clientes satisfechos' },
    { n: '8+', label: 'Años de experiencia' },
  ],

  aboutTitle: 'de la Barbería',
  finalQuote:
    'Un buen corte no cambia cómo te ves. Cambia cómo te sientes al salir por esa puerta.',
  bio: 'Barber VIP nació con la visión de traer a Cochabamba una experiencia de barbería de lujo: ambiente premium, técnicas modernas y atención personalizada. Nuestro equipo de barberos certificados se especializa en cortes clásicos, fade, diseño de barba y tratamientos capilares.',
  credentials: [
    { label: 'Certificación', value: 'Barbería Profesional' },
    { label: 'Ambiente', value: 'Premium & Exclusivo' },
  ],

  services: [
    {
      id: 'corte',
      name: 'Corte',
      tag: 'Esencial',
      price: 'Bs. 70',
      durationMins: 45,
      description:
        'Low fade, mid fade o high fade. Técnica de precisión para un acabado limpio y moderno.',
      image: '/barber_vip/services/corte.jpeg',
    },
    {
      id: 'barba',
      name: 'Corte y Barba',
      tag: 'Clásico',
      price: 'Bs. 100',
      durationMins: 45,
      description:
        'Corte a tu estilo más perfilado de barba con navaja. El combo completo para un look impecable de pies a cabeza.',
      image: '/barber_vip/services/fade.jpeg',
    },
    {
      id: 'tinte',
      name: 'Tinte & Color',
      tag: 'Color',
      price: 'Bs. 350',
      durationMins: 180,
      description:
        'Coloración profesional con productos de alta calidad. Desde colores naturales hasta transformaciones radicales, con cuidado total del cabello.',
      image: '/barber_vip/services/tinte.jpeg',
    },
    {
      id: 'ritual',
      name: 'Ritual de Barba',
      tag: 'Premium',
      price: 'Bs. 140',
      durationMins: 60,
      description:
        'Incluye corte y barba, más toalla caliente y masaje facial. La experiencia completa para relajarte y salir con un estilo impecable.',
      image: '/barber_vip/services/toallaritual.jpg',
    },
    {
      id: 'ondulacion',
      name: 'Ondulación',
      tag: 'Estilo',
      price: 'Bs. 250',
      durationMins: 120,
      description:
        'Incluye corte y barba más tratamiento de ondulación, para un cabello con textura, volumen y rizo definido.',
      image: '/barber_vip/services/ondulacion.jpeg',
    },
    {
      id: 'limpieza',
      name: 'Limpieza Facial',
      tag: 'Premium',
      price: 'Bs. 160',
      durationMins: 120,
      description:
        'Incluye corte y barba más limpieza facial profunda: exfoliación, vapor y mascarilla para renovar tu piel.',
      image: '/barber_vip/services/limpiezafacial2.webp',
    },
  ],

  phone: '59177933737',
  email: 'citas@barbervip.bo',
  address: 'Av Uyuni #1234',
  schedule: ['Lun — Sáb: 9:00 — 20:00'],

  theme: {
    mode: 'dark',
    accent: '#2855c2',
    accentLight: '#3d6edc',
    fonts: {
      display: 'Bebas Neue',
      body: 'Inter',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap',
    },
  },

  mapUrl: 'https://maps.app.goo.gl/qcWfFwZqksNu2iFYA?g_st=ic',
  businessId: 'barber_vip',
  calendarFeedUrl:
    'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=12d9f83cca937e8db7996811bfafff18bb0e725efacce7c76cad8029bf96fb3e',
  setupPassword: 'barbervip2026',
  staff: [
    {
      id: 'jhoel',
      name: 'Jhoel',
      shortName: 'Jhoel',
      title: 'Barbero y Especialista en Colorimetría',
      photo: '/barber_vip/photos/jhoel.jpeg',
      phone: '59177933737',
      businessId: 'jhoel_cuts',
      calendarFeedUrl:
        'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=48878751185480866b8822fd28a7e6da2618541ae38a5c8e61596856145b5be8',
      setupPassword: 'jhoel2026',
    },
    /*{
      id: 'andres',
      name: 'Andres',
      shortName: 'Andres',
      title: 'Barbero & Estilista',
      photo: '/barber_vip/photos/andres.jpeg',
      phone: '59172235605',
      businessId: 'andres',
      calendarFeedUrl:
        'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=fb0f68548b06253112812fb0f6847c983711f15fb849b83bd7a8f6e3c9b8d90a',
      setupPassword: 'andres2026',
    },
     {
      id:       'jheison',
      name:     'jheison',
      shortName:'jheison',
      title:    'Barbero & Estilista',
      photo:    '/barber_vip/photos/jheison.jpeg',
      phone:    '59177933737',
      businessId:      'jheison',
      calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=ec7c7937994c8f1c8c506afb809432318770a2f382a190bd61575fffa1a736ed',
      setupPassword:   'jheison2026',
    },*/
  ],
}

// ────────────────────────────────────────────────────────────────
//  2.1 ANDRES — Desarrollador Frontend & Data Science (página de pruebas, standalone)
// ────────────────────────────────────────────────────────────────
const andres: Professional = {
  heroPhoto: '/barber_vip/photos/andres.jpeg',
  photos: ['/barber_vip/photos/andres.jpeg'],
  slug: 'andres',
  category: 'otro',
  name: 'Andres Gamboa',
  shortName: 'Andres',
  title: 'Desarrollador Frontend & Data Science',
  specialty: 'Desarrollo web a medida, dashboards y análisis de datos',
  location: 'Cochabamba, Bolivia',
  tagline: 'El código no es magia,',
  taglineSub: 'es una decisión bien diseñada.',

  stats: [
    { n: '+10', label: 'Proyectos entregados' },
    { n: '3+', label: 'Años de experiencia' },
  ],

  aboutTitle: 'de Andres',
  finalQuote:
    'Un buen producto no se nota en el código. Se nota en lo simple que se vuelve para quien lo usa.',
  bio: 'Andres es desarrollador frontend especializado en React, TypeScript y experiencias de usuario pulidas — esta misma página es un ejemplo de su trabajo. Combina ese perfil con data science: limpieza de datos, automatización y dashboards que convierten información cruda en decisiones claras para negocios pequeños y medianos.',
  credentials: [
    { label: 'Stack principal', value: 'React · TypeScript · Python' },
    { label: 'Enfoque', value: 'Frontend & Análisis de Datos' },
  ],

  services: [
    {
      id: 'landing',
      name: 'Landing Page',
      tag: 'Web',
      durationMins: 60,
      description:
        'Sitio de una sola página, rápido y responsivo, listo para mostrar tu negocio y captar clientes.',
    },
    {
      id: 'web-app',
      name: 'Aplicación Web a Medida',
      tag: 'Desarrollo',
      durationMins: 30,
      description:
        'Sistemas a medida en React + TypeScript: reservas, paneles internos, integraciones con bases de datos.',
    },
    {
      id: 'dashboard',
      name: 'Dashboard de Datos',
      tag: 'Data Science',
      durationMins: 60,
      description:
        'Visualización interactiva de tus datos de negocio — ventas, clientes, operaciones — para tomar decisiones con claridad.',
    },
    {
      id: 'automatizacion',
      name: 'Automatización & Análisis',
      tag: 'Data Science',
      price: 'Cotización',
      durationMins: 60,
      description:
        'Limpieza, procesamiento y análisis de datos con Python. Automatiza tareas repetitivas y obtén reportes recurrentes.',
    },
    {
      id: 'consultoria',
      name: 'Consultoría Técnica',
      tag: 'Asesoría',
      durationMins: 30,
      description:
        'Sesión de asesoría para definir arquitectura, elegir tecnologías o resolver problemas puntuales de tu proyecto.',
    },
  ],

  mapUrl: 'https://maps.app.goo.gl/eMHRUCNk4ji62wC99?g_st=ic',
  phone: '59172235605',
  email: 'andresgamboabaldi@gmail.com',
  address: 'Edif. Central Park Collection 2',
  addressDetail: 'Piso 1, Oficina 2',
  schedule: ['Lun — Vie: 9:00 — 18:00'],

  theme: {
    mode: 'light',
    accent: '#b07c35',
    accentLight: '#c48c45',
    fonts: {
      display: 'Bebas Neue',
      body: 'Inter',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap',
    },
  },

  businessId: 'andres',
  calendarFeedUrl:
    'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=fb0f68548b06253112812fb0f6847c983711f15fb849b83bd7a8f6e3c9b8d90a',
  setupPassword: 'andres2026',
}

// ────────────────────────────────────────────────────────────────
//  3. DR. IVAN SEIFERT — Endodoncia
// ────────────────────────────────────────────────────────────────
const dr_seifert: Professional = {
  photos: ['/dr_seifert/photos/dr_seifert_3.jpeg', '/dr_seifert/photos/dr_seifert_1.jpeg'],
  heroPhoto: '/dr_seifert/photos/dr_seifert_2.jpeg',
  slug: 'dr_seifert',
  category: 'dentista',
  name: 'Dr. Ivan Seifert',
  shortName: 'Dr. Seifert',
  title: 'Especialista en Endodoncia',
  specialty: 'Especialista en endodoncia y tratamiento de conductos',
  location: 'Cochabamba, Bolivia',
  tagline: 'Una sonrisa perfecta no es suerte,',
  taglineSub: 'es diseño.',
  stats: [
    { n: '+2.000', label: 'Pacientes atendidos' },
    { n: '22+', label: 'Años de experiencia' },
  ],

  aboutTitle: 'del Doctor',
  finalQuote:
    'Una sonrisa saludable y hermosa es la inversión más visible que puedes hacer en ti mismo.',
  bio: 'El Dr. Ivan Seifert es especialista en Endodoncia, egresado de la Universidad Mayor de San Andrés con especialización en tratamiento de conductos y patología pulpar. Con más de 12 años de experiencia, combina tecnología de vanguardia con precisión clínica para preservar la salud dental de sus pacientes, siempre priorizando el bienestar y la comodidad durante cada procedimiento.',
  credentials: [
    { label: 'Formación', value: 'Univ. Mayor de San Simon' },
    { label: 'Especialización', value: 'Endodoncia' },
    { label: 'Área principal', value: 'Tratamiento de Conductos' },
    { label: 'Certificaciones', value: 'ADA · LAOBO · SOB' },
  ],

  services: [
    {
      id: 'limpieza',
      name: 'Limpieza & Profilaxis',
      tag: 'Preventivo',
      durationMins: 60,
      price: 'Desde Bs. 180',
      description:
        'Limpieza profunda que elimina sarro, placa bacteriana y manchas. Incluye pulido y fluorización para una protección duradera.',
      image: '/dr_seifert//services/limpieza.jpg',
    },
    {
      id: 'blanqueamiento',
      name: 'Blanqueamiento Dental',
      tag: 'Estético',
      durationMins: 120,
      price: 'Desde Bs. 450',
      description:
        'Sistema de blanqueamiento profesional en consultorio. Resultados visibles desde la primera sesión, hasta 8 tonos más claro.',
      image: '/dr_seifert//services/blanqueamiento.jpg',
    },
    {
      id: 'carillas',
      name: 'Carillas de Porcelana',
      tag: 'Diseño',
      durationMins: 120,
      price: 'Desde Bs. 650',
      description:
        'Finas láminas de porcelana que transforman la forma, color y alineación de los dientes. Resultado natural y duradero por más de 15 años.',
      image: '/dr_seifert//services/carillas.jpg',
    },
  ],

  phone: '59170788218',
  email: 'citas@drseifert.bo',
  address: 'Av. Salamanca #1234',
  schedule: ['Lun — Vie: 8:00 — 18:00', 'Sábados: 9:00 — 13:00'],

  theme: {
    mode: 'light',
    accent: '#2b7a9e',
    accentLight: '#3a8fb5',
    fonts: {
      display: 'Playfair Display',
      body: 'DM Sans',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap',
    },
  },

  businessId: 'dr_seifert',
  calendarFeedUrl:
    'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=260c5ffb85568bb46747195dee3d3abb4b8a09775b835d1d268fbe47fa8cfa4f',
  setupPassword: 'seifert2026',
}

// ────────────────────────────────────────────────────────────────
//  4. JHOEL CUTS — Barbería & Estilismo
// ────────────────────────────────────────────────────────────────
/*const jhoel_cuts: Professional = {
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
  businessId:        'jhoel_cuts',
  calendarFeedUrl: 'https://ghsecmooxmmodsgnwbvh.supabase.co/functions/v1/calendar-feed?token=48878751185480866b8822fd28a7e6da2618541ae38a5c8e61596856145b5be8',
  setupPassword:   'jhoel2026',
}*/

// ────────────────────────────────────────────────────────────────
//  REGISTRO
// ────────────────────────────────────────────────────────────────
export const PROFESSIONALS: Record<string, Professional> = {
  doctor_melgar,
  barber_vip,
  andres,
  dr_seifert,
  //jhoel_cuts,
}

export function getProfessional(slug: string): Professional | null {
  return PROFESSIONALS[slug] ?? null
}
