import * as XLSX from 'xlsx-js-style'
import type { Lote, PagoConLote } from '../types/lote'
import type { ReciboConLote } from '../types/facturacion'
import { ESTADO_LABEL } from '../types/lote'

// --- Paleta compartida con el resto de la app (ver tailwind.config.js) ---
const COLOR_INK = '131C2E' // encabezados
const COLOR_PAPER = 'F2EFE6' // franja clara
const COLOR_PAPER_LINE = 'DAD3BC' // bordes
const COLOR_BRASS_BG = 'F5EADB' // fondo de la fila de total
const COLOR_BRASS_TEXT = '8C6A2E'
const COLOR_BLANCO = 'FFFFFF'
const COLOR_DISPONIBLE = '2F6B4F'
const COLOR_PROCESO = 'B9791E'
const COLOR_VENDIDO = '9C3B2C'

const bordeFino = {
  top: { style: 'thin', color: { rgb: COLOR_PAPER_LINE } },
  bottom: { style: 'thin', color: { rgb: COLOR_PAPER_LINE } },
  left: { style: 'thin', color: { rgb: COLOR_PAPER_LINE } },
  right: { style: 'thin', color: { rgb: COLOR_PAPER_LINE } },
} as const

function estiloEncabezado() {
  return {
    font: { bold: true, color: { rgb: COLOR_BLANCO }, sz: 10 },
    fill: { fgColor: { rgb: COLOR_INK } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: bordeFino,
  }
}

function estiloCelda(opts: { zebra: boolean; alinear?: 'left' | 'right' | 'center'; color?: string; negrita?: boolean }) {
  return {
    font: { color: { rgb: opts.color ?? '1E2B42' }, bold: !!opts.negrita, sz: 10 },
    fill: { fgColor: { rgb: opts.zebra ? COLOR_PAPER : COLOR_BLANCO } },
    alignment: { horizontal: opts.alinear ?? 'left', vertical: 'center' },
    border: bordeFino,
  }
}

function estiloTotal() {
  return {
    font: { bold: true, color: { rgb: COLOR_BRASS_TEXT }, sz: 10 },
    fill: { fgColor: { rgb: COLOR_BRASS_BG } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: bordeFino,
  }
}

function colorPorEstado(estado: string) {
  if (estado === ESTADO_LABEL.disponible) return COLOR_DISPONIBLE
  if (estado === ESTADO_LABEL.en_proceso) return COLOR_PROCESO
  if (estado === ESTADO_LABEL.vendido) return COLOR_VENDIDO
  return '1E2B42'
}

function aplicarEstilos(
  hoja: XLSX.WorkSheet,
  opciones: {
    columnasMoneda: number[] // índice de columna (0-based)
    columnasCentradas?: number[]
    columnaEstado?: number
  }
) {
  const rango = XLSX.utils.decode_range(hoja['!ref'] || 'A1')

  // Encabezado (fila 0)
  for (let c = rango.s.c; c <= rango.e.c; c++) {
    const dir = XLSX.utils.encode_cell({ r: 0, c })
    if (hoja[dir]) hoja[dir].s = estiloEncabezado()
  }

  // Filas de datos, con franja zebra cada dos filas
  for (let r = 1; r <= rango.e.r; r++) {
    const zebra = r % 2 === 0
    for (let c = rango.s.c; c <= rango.e.c; c++) {
      const dir = XLSX.utils.encode_cell({ r, c })
      const celda = hoja[dir]
      if (!celda) continue

      const esMoneda = opciones.columnasMoneda.includes(c)
      const esCentrada = opciones.columnasCentradas?.includes(c)
      const esEstado = opciones.columnaEstado === c

      if (esMoneda) celda.z = '#,##0.00'

      celda.s = estiloCelda({
        zebra,
        alinear: esMoneda ? 'right' : esCentrada ? 'center' : 'left',
        color: esEstado && typeof celda.v === 'string' ? colorPorEstado(celda.v) : undefined,
        negrita: esEstado,
      })
    }
  }

  hoja['!autofilter'] = { ref: hoja['!ref'] as string }
}

function descargarLibro(libro: XLSX.WorkBook, nombreArchivo: string) {
  XLSX.writeFile(libro, nombreArchivo)
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Exporta la lista de lotes (respeta lo que esté filtrado/visible en la
 * tabla al momento de exportar) a un archivo .xlsx con estilo.
 */
export function exportarLotesExcel(lotes: Lote[]) {
  const filas = lotes.map((l) => ({
    'N.º Lote': l.numero_lote,
    'Terreno / proyecto': l.proyecto ?? '',
    'Ancho (m)': l.ancho,
    'Largo (m)': l.largo,
    'Área (m²)': l.area,
    Estado: ESTADO_LABEL[l.estado],
    Comprador: l.comprador ?? '',
    'Fecha de compra': l.fecha_compra ?? '',
    'Precio total': l.precio_total,
    'Cuota mensual': l.cuota_mensual,
    'Plazos pagados': l.plazos_pagados,
    'Plazos totales': l.plazos_totales,
    'Saldo restante': l.saldo_restante,
  }))

  const hoja = XLSX.utils.json_to_sheet(filas)

  hoja['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 9 },
    { wch: 9 },
    { wch: 10 },
    { wch: 12 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ]

  aplicarEstilos(hoja, {
    columnasMoneda: [8, 9, 12], // Precio total, Cuota mensual, Saldo restante
    columnasCentradas: [2, 3, 4, 10, 11],
    columnaEstado: 5,
  })

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Lotes')
  descargarLibro(libro, `lotes-${fechaHoy()}.xlsx`)
}

/**
 * Exporta un libro contable con todos los pagos, con estilo y una fila
 * de total resaltada al final — pensado para conciliar con contabilidad.
 */
export function exportarPagosExcel(pagos: PagoConLote[]) {
  const filas = pagos.map((p) => ({
    'N.º Lote': p.numero_lote ?? '',
    'Terreno / proyecto': p.proyecto ?? '',
    Comprador: p.comprador ?? '',
    'Fecha de pago': p.fecha_pago,
    Monto: p.monto,
    Método: p.metodo,
    'N.º de recibo': p.numero_recibo ?? '',
  }))

  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }]

  aplicarEstilos(hoja, { columnasMoneda: [4], columnasCentradas: [3, 5] })

  const totalMonto = pagos.reduce((s, p) => s + p.monto, 0)
  XLSX.utils.sheet_add_aoa(hoja, [['', '', '', 'TOTAL', totalMonto]], { origin: -1 })

  const rangoFinal = XLSX.utils.decode_range(hoja['!ref'] || 'A1')
  const filaTotal = rangoFinal.e.r
  for (let c = 0; c <= rangoFinal.e.c; c++) {
    const dir = XLSX.utils.encode_cell({ r: filaTotal, c })
    const celda = hoja[dir]
    if (!celda) continue
    if (c === 4) celda.z = '#,##0.00'
    celda.s = estiloTotal()
  }

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Pagos')
  descargarLibro(libro, `pagos-${fechaHoy()}.xlsx`)
}

/**
 * Exporta la bitácora de recibos emitidos (con CAI): correlativo, lote,
 * comprador, monto, fecha y quién lo emitió.
 */
export function exportarRecibosExcel(recibos: ReciboConLote[]) {
  const filas = recibos.map((r) => ({
    'No. Recibo': r.correlativo,
    'N.º Lote': r.numero_lote ?? '',
    'Terreno / proyecto': r.proyecto ?? '',
    Comprador: r.comprador ?? '',
    Monto: r.monto,
    'Fecha de emisión': r.fecha_emision,
    'Emitido por': r.emitido_por ?? '',
  }))

  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 24 }]

  aplicarEstilos(hoja, { columnasMoneda: [4], columnasCentradas: [0, 5] })

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Recibos')
  descargarLibro(libro, `recibos-${fechaHoy()}.xlsx`)
}
