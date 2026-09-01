import jsPDF from 'jspdf'
import type { Lote, Pago } from '../types/lote'
import type { ConfigFacturacion } from '../types/facturacion'
import { formatMoneda, formatFecha } from './format'

function pad(numero: number, longitud = 8) {
  return String(numero).padStart(longitud, '0')
}

interface ParametrosRecibo {
  lote: Lote
  pago: Pago
  correlativo: number
  config: ConfigFacturacion
}

/**
 * Genera y descarga un recibo de pago en PDF, con el encabezado de la app
 * y la caja de datos del CAI requerida en Honduras. Se dibuja en un tamaño
 * media carta (148 × 210 mm), típico de un recibo/factura pequeña.
 */
export function generarReciboPDF({ lote, pago, correlativo, config }: ParametrosRecibo) {
  const doc = new jsPDF({ unit: 'mm', format: [148, 210] })
  const ANCHO = 148
  const margen = 14
  let y = 16

  // --- Encabezado con la marca de la app ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('CATASTRO', margen, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('GESTIÓN DE LOTES', margen, y + 4)
  doc.setTextColor(0)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('RECIBO DE PAGO', ANCHO - margen, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`No. ${pad(correlativo)}`, ANCHO - margen, y + 5, { align: 'right' })

  y += 12
  doc.setDrawColor(180)
  doc.line(margen, y, ANCHO - margen, y)
  y += 6

  // --- Datos del emisor (empresa) ---
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(config.razon_social || 'Razón social no configurada', margen, y)
  doc.setFont('helvetica', 'normal')
  y += 4.5
  doc.setFontSize(8)
  doc.setTextColor(90)
  doc.text(`RTN: ${config.rtn || '—'}`, margen, y)
  y += 4
  if (config.direccion) {
    doc.text(config.direccion, margen, y)
    y += 4
  }
  if (config.telefono) {
    doc.text(`Tel: ${config.telefono}`, margen, y)
    y += 4
  }
  doc.setTextColor(0)
  y += 1

  // --- Caja del CAI ---
  doc.setDrawColor(200)
  doc.setFillColor(246, 244, 239)
  doc.roundedRect(margen, y, ANCHO - margen * 2, 16, 1, 1, 'FD')

  doc.setFontSize(7.5)
  doc.setTextColor(90)
  doc.text('CAI:', margen + 3, y + 5)
  doc.setTextColor(0)
  doc.text(config.cai || '—', margen + 15, y + 5)

  doc.setTextColor(90)
  doc.text('Rango autorizado:', margen + 3, y + 10)
  doc.setTextColor(0)
  doc.text(`${config.rango_autorizado_inicio || '—'}  al  ${config.rango_autorizado_fin || '—'}`, margen + 32, y + 10)

  doc.setTextColor(90)
  doc.text('Fecha límite de emisión:', margen + 3, y + 14.5)
  doc.setTextColor(0)
  doc.text(config.fecha_limite_emision ? formatFecha(config.fecha_limite_emision) : '—', margen + 42, y + 14.5)

  y += 24

  // --- Fecha de emisión del recibo ---
  doc.setFontSize(8.5)
  doc.setTextColor(0)
  doc.text(`Fecha de emisión: ${formatFecha(new Date().toISOString())}`, margen, y)
  y += 8

  doc.setDrawColor(200)
  doc.line(margen, y, ANCHO - margen, y)
  y += 6

  // --- Datos del cliente / concepto ---
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Recibí de:', margen, y)
  doc.setFont('helvetica', 'normal')
  doc.text(lote.comprador || 'Consumidor final', margen + 22, y)
  y += 6.5

  doc.setFont('helvetica', 'bold')
  doc.text('Concepto:', margen, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`Abono a lote ${lote.numero_lote}${lote.proyecto ? `  —  ${lote.proyecto}` : ''}`, margen + 22, y)
  y += 10

  // --- Detalle del pago ---
  doc.setFillColor(246, 244, 239)
  doc.rect(margen, y, ANCHO - margen * 2, 22, 'F')
  const colDer = ANCHO - margen - 3

  doc.setFontSize(8.5)
  doc.setTextColor(90)
  doc.text('Monto recibido', margen + 3, y + 6)
  doc.text('Método de pago', margen + 3, y + 13)
  doc.text('Saldo restante', margen + 3, y + 20)

  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text(formatMoneda(pago.monto), colDer, y + 6, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(pago.metodo.charAt(0).toUpperCase() + pago.metodo.slice(1), colDer, y + 13, { align: 'right' })
  doc.text(formatMoneda(lote.saldo_restante), colDer, y + 20, { align: 'right' })

  y += 32

  // --- Firma ---
  doc.setDrawColor(120)
  doc.line(margen, y + 14, margen + 60, y + 14)
  doc.setFontSize(7.5)
  doc.setTextColor(90)
  doc.text('Firma de quien recibe', margen, y + 18)

  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text('Original: Cliente  ·  Copia: Archivo', ANCHO - margen, y + 18, { align: 'right' })

  doc.save(`recibo-${pad(correlativo)}-${lote.numero_lote}.pdf`)
}