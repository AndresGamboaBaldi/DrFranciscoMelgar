import type { CSSProperties } from 'react'

/**
 * Paleta fija de la caja.
 *
 * A diferencia de las páginas públicas, acá NO se lee el tema del profesional:
 * es una herramienta interna y conviene que se vea igual en todos los negocios.
 * El azul es el mismo acento de VIP Barber Studio (#2855c2 / #3d6edc), pero
 * aclarado para que tenga contraste suficiente sobre fondo oscuro.
 *
 * El verde queda reservado para "pagado" y el ámbar para "por cobrar": son
 * estados, no marca, y por eso no comparten color con el acento.
 */
export const CAJA_VARS = {
  '--caja-bg': '#0b0d10',
  '--caja-surface': '#14181d',
  '--caja-surface2': '#1c2229',
  '--caja-rim': '#28303a',
  '--caja-rim-l': '#38434f',
  '--caja-ink': '#eef1f5',
  '--caja-ink-dim': '#aeb8c4',
  '--caja-ink-ghost': '#7a8592',
  '--caja-accent': '#3d6edc',
  '--caja-accent-l': '#5c89f0',
  '--caja-accent-d': '#2855c2',
  '--caja-ok': '#3fb27f',
  '--caja-warn': '#e0a341',
  '--caja-danger': '#d86a52',
  background: 'var(--caja-bg)',
  color: 'var(--caja-ink)',
  colorScheme: 'dark',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  minHeight: '100vh',
} as CSSProperties

export const CAJA_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'

/** Bs 1.234,50 — separador de miles con punto, decimales con coma. */
export function bs(monto: number): string {
  return `Bs ${monto.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** 2.840 — sin decimales, para los números grandes de las tarjetas de resumen. */
export function bsCorto(monto: number): string {
  return monto.toLocaleString('es-BO', { maximumFractionDigits: 0 })
}

/** 'YYYY-MM-DD' de hoy en hora local (no UTC: a las 20:00 en Bolivia UTC ya es mañana). */
export function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
