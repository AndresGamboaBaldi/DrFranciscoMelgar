/**
 * Genera el reporte como documento PDF.
 *
 * No es una impresión de la pantalla: se dibuja el documento con jsPDF, con
 * sus propias secciones, tablas y paginación. La librería pesa ~110 KB gzip,
 * así que se importa dentro de la función — quien no exporta no la descarga.
 */

export interface FilaServicio { nombre: string; cantidad: number; total: number }
export interface FilaBarbero { nombre: string; nServicios: number; facturado: number; comision: number }

export interface DatosReporte {
  negocio: string
  periodoLabel: string
  desde: string
  hasta: string
  facturado: number
  propinas: number
  comisiones: number
  gastos: number
  neto: number
  nVentas: number
  servicios: FilaServicio[]
  barberos: FilaBarbero[]
  /** Acento del negocio en hex, para los títulos y las bandas. */
  acento: string
}

const MARGEN = 15
const ANCHO_PAGINA = 210
const ALTO_PAGINA = 297
const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2

const TINTA = [26, 24, 22] as const
const TINTA_SUAVE = [110, 106, 100] as const
const LINEA = [205, 201, 195] as const
const BANDA = [244, 242, 239] as const

function hexARgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const monto = (n: number) =>
  n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' */
function fecha(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export async function generarReportePdf(d: DatosReporte): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const acento = hexARgb(d.acento)

  let y = 0
  let pagina = 1

  const nuevaPagina = () => {
    doc.addPage()
    pagina++
    y = MARGEN
  }

  /** Pide `alto` mm; si no entran, salta de página. */
  const reservar = (alto: number) => {
    if (y + alto > ALTO_PAGINA - MARGEN - 12) nuevaPagina()
  }

  // ── Encabezado ──────────────────────────────────────────
  doc.setFillColor(acento[0], acento[1], acento[2])
  doc.rect(0, 0, ANCHO_PAGINA, 32, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(d.negocio, MARGEN, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Reporte ${d.periodoLabel.toLowerCase()}`, MARGEN, 22)
  doc.setFontSize(9)
  doc.text(
    d.desde === d.hasta ? fecha(d.desde) : `${fecha(d.desde)} — ${fecha(d.hasta)}`,
    MARGEN, 27,
  )

  doc.setFontSize(8)
  doc.text(
    `Generado ${new Date().toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}`,
    ANCHO_PAGINA - MARGEN, 27, { align: 'right' },
  )

  y = 44

  // ── Título de sección ───────────────────────────────────
  const seccion = (texto: string) => {
    reservar(16)
    doc.setTextColor(acento[0], acento[1], acento[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(texto.toUpperCase(), MARGEN, y)
    doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2])
    doc.setLineWidth(0.3)
    doc.line(MARGEN, y + 1.8, ANCHO_PAGINA - MARGEN, y + 1.8)
    y += 8
  }

  /** Fila etiqueta/valor del resumen. */
  const fila = (label: string, valor: string, opts?: { fuerte?: boolean; negativo?: boolean }) => {
    reservar(7)
    doc.setFont('helvetica', opts?.fuerte ? 'bold' : 'normal')
    doc.setFontSize(opts?.fuerte ? 11 : 10)
    const tinta = opts?.fuerte ? TINTA : TINTA_SUAVE
    doc.setTextColor(tinta[0], tinta[1], tinta[2])
    doc.text(label, MARGEN, y)
    if (opts?.negativo) doc.setTextColor(168, 70, 55)
    else if (opts?.fuerte) doc.setTextColor(acento[0], acento[1], acento[2])
    else doc.setTextColor(TINTA[0], TINTA[1], TINTA[2])
    doc.text(valor, ANCHO_PAGINA - MARGEN, y, { align: 'right' })
    y += opts?.fuerte ? 8 : 6
  }

  // ── Resumen ─────────────────────────────────────────────
  seccion('Resumen')
  fila('Facturación de servicios', `Bs ${monto(d.facturado)}`)
  fila('Comisiones de barberos', `− Bs ${monto(d.comisiones)}`, { negativo: true })
  fila('Gastos operativos', `− Bs ${monto(d.gastos)}`, { negativo: true })

  doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2])
  doc.line(MARGEN, y - 2, ANCHO_PAGINA - MARGEN, y - 2)
  y += 3

  fila('Queda al local', `Bs ${monto(d.neto)}`, { fuerte: true })

  const margen = d.facturado > 0 ? (d.neto / d.facturado) * 100 : 0
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(TINTA_SUAVE[0], TINTA_SUAVE[1], TINTA_SUAVE[2])
  doc.text(
    `${d.nVentas} ${d.nVentas === 1 ? 'cobro' : 'cobros'} · margen ${margen.toFixed(1)}%` +
    (d.propinas > 0 ? ` · Bs ${monto(d.propinas)} de propinas, que van enteras a los barberos` : ''),
    MARGEN, y,
  )
  y += 12

  // ── Tabla genérica ──────────────────────────────────────
  const tabla = (
    titulo: string,
    cols: { titulo: string; ancho: number; alinear?: 'left' | 'right' }[],
    filas: string[][],
    vacio: string,
  ) => {
    seccion(titulo)

    if (filas.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(TINTA_SUAVE[0], TINTA_SUAVE[1], TINTA_SUAVE[2])
      doc.text(vacio, MARGEN, y)
      y += 12
      return
    }

    const xs: number[] = []
    let acc = MARGEN
    for (const c of cols) { xs.push(acc); acc += c.ancho }

    const cabecera = () => {
      doc.setFillColor(BANDA[0], BANDA[1], BANDA[2])
      doc.rect(MARGEN, y - 4.5, ANCHO_UTIL, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(TINTA_SUAVE[0], TINTA_SUAVE[1], TINTA_SUAVE[2])
      cols.forEach((c, i) => {
        const x = c.alinear === 'right' ? xs[i] + c.ancho : xs[i]
        doc.text(c.titulo.toUpperCase(), x, y, { align: c.alinear ?? 'left' })
      })
      y += 7
    }

    cabecera()

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    for (const f of filas) {
      if (y + 6 > ALTO_PAGINA - MARGEN - 12) {
        nuevaPagina()
        // La cabecera se repite en cada hoja: una tabla sin títulos no se lee.
        y += 4
        cabecera()
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
      }
      doc.setTextColor(TINTA[0], TINTA[1], TINTA[2])
      cols.forEach((c, i) => {
        const x = c.alinear === 'right' ? xs[i] + c.ancho : xs[i]
        // Recorta para que una columna larga no pise la siguiente
        const texto = c.alinear === 'right' ? f[i] : doc.splitTextToSize(f[i], c.ancho - 2)[0]
        doc.text(texto, x, y, { align: c.alinear ?? 'left' })
      })
      doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2])
      doc.setLineWidth(0.1)
      doc.line(MARGEN, y + 1.8, ANCHO_PAGINA - MARGEN, y + 1.8)
      y += 6.5
    }
    y += 8
  }

  // ── Servicios ───────────────────────────────────────────
  tabla(
    'Servicios vendidos',
    [
      { titulo: 'Servicio', ancho: 95 },
      { titulo: 'Cant.', ancho: 20, alinear: 'right' },
      { titulo: 'Total', ancho: 35, alinear: 'right' },
      { titulo: '%', ancho: 30, alinear: 'right' },
    ],
    d.servicios.map(s => [
      s.nombre,
      String(s.cantidad),
      `Bs ${monto(s.total)}`,
      d.facturado > 0 ? `${((s.total / d.facturado) * 100).toFixed(1)}%` : '—',
    ]),
    'Sin servicios cobrados en el período.',
  )

  // ── Barberos ────────────────────────────────────────────
  tabla(
    'Producción por barbero',
    [
      { titulo: 'Barbero', ancho: 75 },
      { titulo: 'Serv.', ancho: 20, alinear: 'right' },
      { titulo: 'Facturado', ancho: 42, alinear: 'right' },
      { titulo: 'Comisión', ancho: 43, alinear: 'right' },
    ],
    d.barberos.filter(b => b.nServicios > 0).map(b => [
      b.nombre,
      String(b.nServicios),
      `Bs ${monto(b.facturado)}`,
      `Bs ${monto(b.comision)}`,
    ]),
    'Sin producción registrada en el período.',
  )

  // ── Pie en todas las hojas ──────────────────────────────
  const total = pagina
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(TINTA_SUAVE[0], TINTA_SUAVE[1], TINTA_SUAVE[2])
    doc.text(d.negocio, MARGEN, ALTO_PAGINA - 10)
    doc.text(`Página ${i} de ${total}`, ANCHO_PAGINA - MARGEN, ALTO_PAGINA - 10, { align: 'right' })
  }

  const nombre = `reporte-${d.desde}${d.desde === d.hasta ? '' : `-a-${d.hasta}`}.pdf`
  doc.save(nombre)
}
