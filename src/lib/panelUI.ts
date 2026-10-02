import type { CSSProperties } from 'react'

/**
 * Botones compartidos por el panel de setup y la caja.
 *
 * Un primario = relleno con el acento y texto en --color-on-gold, que se
 * calcula según la luminancia del acento (blanco sobre el azul de Barber VIP,
 * oscuro sobre un dorado claro). Esquinas rectas, como el resto de los paneles.
 */

const base: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '.5rem',
  fontFamily: 'var(--font-body)',
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  border: '1px solid transparent',
  borderRadius: 'var(--r-md)',
  cursor: 'pointer',
  transition: 'background .2s, border-color .2s, color .2s, opacity .2s',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

type Tamano = 'sm' | 'md' | 'lg'

const medidas: Record<Tamano, CSSProperties> = {
  sm: { padding: '.5rem .9rem',  fontSize: '.68rem', fontWeight: 600 },
  md: { padding: '.75rem 1.4rem', fontSize: '.74rem', fontWeight: 600 },
  lg: { padding: '1rem 2rem',     fontSize: '.8rem',  fontWeight: 700 },
}

/** Acción principal: relleno con el acento. Uno por pantalla, idealmente. */
export function btnPrimario(tamano: Tamano = 'md', deshabilitado = false): CSSProperties {
  return {
    ...base,
    ...medidas[tamano],
    background: deshabilitado ? 'var(--color-rim-l)' : 'var(--color-gold)',
    color: deshabilitado ? 'var(--color-ink-ghost)' : 'var(--color-on-gold)',
    borderColor: deshabilitado ? 'var(--color-rim-l)' : 'var(--color-gold)',
    cursor: deshabilitado ? 'not-allowed' : 'pointer',
  }
}

/** Acción secundaria: fondo sólido de superficie, no transparente. */
export function btnSecundario(tamano: Tamano = 'md'): CSSProperties {
  return {
    ...base,
    ...medidas[tamano],
    background: 'var(--color-surface2)',
    color: 'var(--color-ink)',
    borderColor: 'var(--color-rim-l)',
    fontWeight: 500,
  }
}

/** Acción destructiva o de salida: solo contorno. */
export function btnFantasma(tamano: Tamano = 'sm'): CSSProperties {
  return {
    ...base,
    ...medidas[tamano],
    background: 'none',
    color: 'var(--color-ink-dim)',
    borderColor: 'var(--color-rim-l)',
    fontWeight: 500,
  }
}

/** Filtro o selector: relleno con el acento cuando está activo. */
export function chip(activo: boolean): CSSProperties {
  return {
    ...base,
    ...medidas.sm,
    background: activo ? 'var(--color-gold)' : 'var(--color-surface2)',
    color: activo ? 'var(--color-on-gold)' : 'var(--color-ink-dim)',
    borderColor: activo ? 'var(--color-gold)' : 'var(--color-rim-l)',
  }
}
