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
