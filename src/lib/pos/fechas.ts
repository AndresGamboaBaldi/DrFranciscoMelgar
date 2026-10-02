/**
 * Fechas de la caja.
 *
 * `pos_ventas.created_at` es `timestamptz`. Un literal sin offset lo interpreta
 * Postgres en la zona de la sesión, que en Supabase es UTC — así que filtrar
 * con 'YYYY-MM-DDT00:00:00' pide el día UTC, no el día del local.
 *
 * En Bolivia (UTC−4) eso corre la ventana cuatro horas: lo cobrado después de
 * las 20:00 cae fuera del día consultado y desaparece de la lista. Acá se
 * construyen los límites como instantes UTC reales de la medianoche local.
 */

/** Date → 'YYYY-MM-DD' en hora local. */
export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function hoyISO(): string {
  return iso(new Date())
}

export function ayerISO(): string {
  return correrDias(hoyISO(), -1)
}

/** Mueve una fecha 'YYYY-MM-DD' la cantidad de días indicada. */
export function correrDias(fechaISO: string, dias: number): string {
  const [a, m, d] = fechaISO.split('-').map(Number)
  const x = new Date(a, m - 1, d)
  x.setDate(x.getDate() + dias)
  return iso(x)
}

/** 'jueves 2 de octubre', o 'Hoy' / 'Ayer' cuando corresponde. */
export function etiquetaDia(fechaISO: string): string {
  if (fechaISO === hoyISO()) return 'Hoy'
  if (fechaISO === ayerISO()) return 'Ayer'
  const [a, m, d] = fechaISO.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-BO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

/**
 * Límites para comparar contra una columna `timestamptz`.
 *
 * Devuelve los instantes UTC que corresponden a las 00:00 y 23:59:59.999
 * locales de las fechas dadas. Funciona en cualquier zona porque el navegador
 * resuelve el offset; no hay −4 escrito en ningún lado.
 */
export function rangoUtc(desdeISO: string, hastaISO: string): { desde: string; hasta: string } {
  const [ad, md, dd] = desdeISO.split('-').map(Number)
  const [ah, mh, dh] = hastaISO.split('-').map(Number)
  return {
    desde: new Date(ad, md - 1, dd, 0, 0, 0, 0).toISOString(),
    hasta: new Date(ah, mh - 1, dh, 23, 59, 59, 999).toISOString(),
  }
}
