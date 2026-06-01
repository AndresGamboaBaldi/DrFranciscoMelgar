import { Helmet } from 'react-helmet-async'
import type { Professional } from '../types/professional'

const SITE_URL  = 'https://probo.pro'
const SITE_NAME = 'Probo.pro'

/* ── Schema type per category ── */
const SCHEMA_TYPE: Record<string, string[]> = {
  medico:    ['LocalBusiness', 'Physician'],
  dentista:  ['LocalBusiness', 'Dentist'],
  barbero:   ['LocalBusiness', 'BarberShop'],
  estetica:  ['LocalBusiness', 'HealthAndBeautyBusiness'],
  psicologo: ['LocalBusiness', 'Physician'],
  otro:      ['LocalBusiness'],
}

/* ── Parse address into parts ── */
function parseAddress(raw: string) {
  const lines = raw.split('\n')
  const street = lines[0] ?? ''
  const cityLine = lines[1] ?? ''
  const parts = cityLine.split(',')
  return {
    street,
    city: parts[0]?.trim() ?? '',
    country: parts[1]?.trim() ?? 'Bolivia',
  }
}

/* ── Parse schedule into openingHoursSpecification ── */
function parseHours(schedule: string[]) {
  const DAY_MAP: Record<string, string[]> = {
    'Lun': ['Monday'], 'Mar': ['Tuesday'], 'Mié': ['Wednesday'],
    'Jue': ['Thursday'], 'Vie': ['Friday'],
    'Sáb': ['Saturday'], 'Dom': ['Sunday'],
  }
  return schedule.map(s => {
    const [days, hours] = s.split(':').map(p => p.trim())
    const [open, close] = (hours ?? '').split('—').map(p => p.trim())
    const dayRange = days.split('—').map(p => p.trim())
    const dayKeys = dayRange.length === 2
      ? Object.keys(DAY_MAP).slice(
          Object.keys(DAY_MAP).indexOf(dayRange[0]),
          Object.keys(DAY_MAP).indexOf(dayRange[1]) + 1
        ).flatMap(k => DAY_MAP[k] ?? [])
      : DAY_MAP[dayRange[0]] ?? []
    return dayKeys.map(d => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${d}`,
      opens: open,
      closes: close,
    }))
  }).flat()
}

/* ── Professional page SEO ── */
interface ProSEOProps { pro: Professional }

export function ProSEOHead({ pro }: ProSEOProps) {
  const addr    = parseAddress(pro.address)
  const types   = SCHEMA_TYPE[pro.category ?? 'otro'] ?? ['LocalBusiness']
  const pageUrl = `${SITE_URL}/${pro.slug}`
  const image   = pro.heroPhoto ?? pro.photos?.[0]
  const imageUrl = image ? `${SITE_URL}${image}` : `${SITE_URL}/og-default.jpg`

  const title = `${pro.name} — ${pro.title} en ${addr.city} | ${SITE_NAME}`
  const description = `${pro.name}, ${pro.specialty} en ${addr.city}. Reserva tu cita online en segundos. ${pro.services.slice(0, 3).map(s => s.name).join(', ')} y más.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': types,
    name: pro.name,
    description: pro.specialty,
    url: pageUrl,
    telephone: `+${pro.phone}`,
    email: pro.email,
    image: imageUrl,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: addr.street,
      addressLocality: addr.city,
      addressCountry: 'BO',
    },
    areaServed: {
      '@type': 'City',
      name: addr.city,
    },
    openingHoursSpecification: parseHours(pro.schedule),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios',
      itemListElement: pro.services.map((s, i) => ({
        '@type': 'Offer',
        position: i + 1,
        name: s.name,
        description: s.description,
      })),
    },
    sameAs: pro.mapUrl ? [pro.mapUrl] : [],
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:type"        content="website" />
      <meta property="og:url"         content={pageUrl} />
      <meta property="og:title"       content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={imageUrl} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="es_BO" />

      {/* Twitter / X */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={imageUrl} />

      {/* Geo */}
      <meta name="geo.region"   content="BO" />
      <meta name="geo.placename" content={addr.city} />

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  )
}

/* ── Home page SEO ── */
export function HomeSEOHead() {
  const title = `Probo.pro — Reserva citas con profesionales en Bolivia`
  const description = `Encuentra médicos, dentistas, barberos y más en Cochabamba y toda Bolivia. Agenda tu cita online en segundos con Probo.pro.`
  const url = SITE_URL

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url,
    description,
    inLanguage: 'es-BO',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type"        content="website" />
      <meta property="og:url"         content={url} />
      <meta property="og:title"       content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="es_BO" />
      <meta name="twitter:card"        content="summary" />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  )
}
