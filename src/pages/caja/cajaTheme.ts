import type { CSSProperties } from 'react'

/**
 * Paleta fija de la caja.
 *
 * A diferencia de las páginas públicas, acá NO se usa el tema del profesional:
 * es una herramienta interna y conviene que se vea igual en todos los negocios.
 * El acento verde también sirve para que nadie confunda la caja con el panel
 * de reservas, que es dorado.
 */
export const CAJA_VARS = {
  '--caja-bg': '#0d0f0e',
  '--caja-surface': '#161a18',
  '--caja-surface2': '#1e2422',
  '--caja-rim': '#2a322e',
  '--caja-rim-l': '#3a443f',
  '--caja-ink': '#eef2f0',
  '--caja-ink-dim': '#b0bab5',
  '--caja-ink-ghost': '#7c8781',
  '--caja-accent': '#3fb27f',
  '--caja-accent-d': '#2f8f65',
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
