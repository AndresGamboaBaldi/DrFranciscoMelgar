/**
 * Helpers de formato de la caja.
 *
 * No hay paleta propia: la caja usa las mismas variables CSS del tema del
 * profesional que usa el panel de setup (--color-gold, --color-surface…),
 * generadas por lib/theme.ts. Lo único que se fija son las fuentes.
 */

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
