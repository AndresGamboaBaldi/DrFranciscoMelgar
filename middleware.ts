import { PROFESSIONALS } from './src/data/professionals'

export const config = {
  matcher: '/:slug',
}

const SITE_URL = 'https://probo.pro'

const BOT_UA =
  /facebookexternalhit|whatsapp|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|WhatsApp|vkShare|W3C_Validator|redditbot|Pinterest|Applebot/i

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

export default function middleware(req: Request) {
  const ua = req.headers.get('user-agent') ?? ''
  if (!BOT_UA.test(ua)) return

  const url = new URL(req.url)
  const slug = url.pathname.replace(/^\//, '')
  const pro = PROFESSIONALS[slug]
  if (!pro) return

  const pageUrl = `${SITE_URL}/${pro.slug}`
  const image = pro.heroPhoto ?? pro.photos?.[0]
  const imageUrl = image ? `${SITE_URL}${image}` : `${SITE_URL}/LogoProbo.png`
  const title = `${pro.name} — ${pro.title}`
  const description = `${pro.specialty}. Reserva tu cita online en segundos con Probo.pro.`

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${pageUrl}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${pageUrl}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="og:site_name" content="Probo.pro" />
<meta property="og:locale" content="es_BO" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${imageUrl}" />
</head>
<body></body>
</html>`

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
