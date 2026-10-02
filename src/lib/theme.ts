import type { CSSProperties } from 'react'
import type { Professional } from '../types/professional'

function lightenHex(hex: string, amount = 20): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (n >> 16) + amount)
  const g = Math.min(255, ((n >> 8) & 0xff) + amount)
  const b = Math.min(255, (n & 0xff) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/** Luminancia relativa (WCAG), para decidir qué texto se lee sobre un color. */
function luminancia(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const canal = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255)
}

const TINTA_OSCURA = '#17140e'
const TINTA_CLARA = '#ffffff'

/** Razón de contraste WCAG entre dos colores. */
function contraste(a: string, b: string): number {
  const [alta, baja] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (alta + 0.05) / (baja + 0.05)
}

/**
 * Color de texto que mejor se lee sobre el acento.
 *
 * No se puede fijar en blanco: da 6,6:1 sobre el azul de Barber VIP pero solo
 * 3,6:1 sobre el dorado de Melgar, por debajo del mínimo legible. Tampoco
 * sirve var(--color-bg), que cambia con el modo claro/oscuro.
 *
 * En vez de un umbral, se comparan las dos opciones y gana la de más contraste.
 */
export function textoSobreAcento(hex: string): string {
  return contraste(hex, TINTA_OSCURA) >= contraste(hex, TINTA_CLARA) ? TINTA_OSCURA : TINTA_CLARA
}

/**
 * Variables CSS del tema de un profesional.
 *
 * Vive acá y no en ProfessionalPage porque la caja también las necesita,
 * y vive fuera de ese árbol de rutas.
 */
export function buildThemeVars(pro: Professional): CSSProperties {
  const accent = pro.theme?.accent ?? '#c4995a'
  const accentL = pro.theme?.accentLight ?? lightenHex(accent, 18)
  const mode = pro.theme?.mode ?? 'dark'
  const fonts = pro.theme?.fonts

  const shared: Record<string, string> = {
    '--color-gold': accent,
    '--color-gold-l': accentL,
    '--color-gold-glow': hexToRgba(accent, 0.1),
    // Texto legible encima del acento, para los botones rellenos
    '--color-on-gold': textoSobreAcento(accent),
  }

  if (fonts) {
    shared['--font-display'] = `'${fonts.display}', serif`
    shared['--font-body'] = `'${fonts.body}', sans-serif`
  }

  if (mode === 'light') {
    return {
      ...shared,
      '--color-bg': '#fafaf8',
      '--color-surface': '#ffffff',
      '--color-surface2': '#f0ece3',
      '--color-rim': '#c7c0b2',
      '--color-rim-l': '#b0a896',
      '--color-ink': '#18160f',
      '--color-ink-dim': '#2e2a23',
      '--color-ink-ghost': '#464036',
      '--color-nav-scrolled': 'rgba(250,250,248,.96)',
      '--watermark-stroke': hexToRgba(accent, 0.22),
      '--grain-opacity': '0.04',
    } as CSSProperties
  }

  return {
    ...shared,
    '--color-bg': '#0a0907',
    '--color-surface': '#131110',
    '--color-surface2': '#1d1a16',
    '--color-rim': '#272320',
    '--color-rim-l': '#37322c',
    '--color-ink': '#f5f2ee',
    '--color-ink-dim': '#d4cdc5',
    '--color-ink-ghost': '#a09890',
    '--color-nav-scrolled': 'rgba(10,9,7,.93)',
    '--watermark-stroke': hexToRgba(accent, 0.07),
    '--grain-opacity': '0.025',
  } as CSSProperties
}

/**
 * Tipografía fija de los paneles internos (setup y caja): Bebas Neue + Inter,
 * sin importar el tema del profesional.
 */
export const PANEL_FONT_VARS = {
  '--font-display': "'Bebas Neue', serif",
  '--font-body': "'Inter', sans-serif",
} as CSSProperties

export const PANEL_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap'
