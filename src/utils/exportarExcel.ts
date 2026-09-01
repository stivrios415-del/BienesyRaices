import * as XLSX from 'xlsx'
import type { Lote, PagoConLote } from '../types/lote'
import { ESTADO_LABEL } from '../types/lote'

function descargarLibro(libro: XLSX.WorkBook, nombreArchivo: string) {
  XLSX.writeFile(libro, nombreArchivo)
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10)
}

function aplicarFormatoMoneda(hoja: XLSX.WorkSheet, columnas: string[]) {
  const rango = XLSX.utils.decode_range(hoja['!ref'] || 'A1')
  columnas.forEach((col) => {
    for (let fila = rango.s.r + 1; fila <= rango.e.r; fila++) {
      const celda = hoja[`${col}${fila + 1}`]
      if (celda && typeof celda.v === 'number') celda.z = '#,##0.00'
    }
  })
}

/**
 * Exporta la lista de lotes (respeta lo que esté filtrado/visible en la
 * tabla al momento de exportar) a un archivo .xlsx descargable.
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
  aplicarFormatoMoneda(hoja, ['I', 'J', 'M']) // Precio total, Cuota mensual, Saldo restante

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

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Lotes')
  descargarLibro(libro, `lotes-${fechaHoy()}.xlsx`)
}

/**
 * Exporta un libro contable con todos los pagos (de todos los lotes),
 * con el número de lote/proyecto/comprador de contexto y una fila de
 * total al final — pensado para conciliar con contabilidad.
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
  aplicarFormatoMoneda(hoja, ['E']) // columna Monto

  hoja['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }]

  const totalMonto = pagos.reduce((s, p) => s + p.monto, 0)
  XLSX.utils.sheet_add_aoa(hoja, [['', '', '', 'TOTAL', totalMonto]], { origin: -1 })

  // Le da formato de moneda también a la celda de total recién agregada
  const rangoFinal = XLSX.utils.decode_range(hoja['!ref'] || 'A1')
  const celdaTotal = hoja[XLSX.utils.encode_cell({ r: rangoFinal.e.r, c: 4 })]
  if (celdaTotal) celdaTotal.z = '#,##0.00'

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Pagos')
  descargarLibro(libro, `pagos-${fechaHoy()}.xlsx`)
}