export type EstadoLote = 'disponible' | 'vendido' | 'en_proceso'
export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta'

export interface Punto {
  x: number
  y: number
}

export interface Lote {
  id: string
  numero_lote: string
  ancho: number
  largo: number
  area: number
  estado: EstadoLote
  proyecto: string | null
  comprador: string | null
  fecha_compra: string | null
  precio_total: number
  plazos_totales: number
  plazos_pagados: number
  cuota_mensual: number
  saldo_restante: number
  coordenadas_poligono: Punto[]
  created_at: string
  updated_at: string
}

export interface Pago {
  id: string
  lote_id: string
  monto: number
  fecha_pago: string
  metodo: MetodoPago
  numero_recibo: string | null
  created_at: string
}

// Colores usados en el canvas del mapa (react-konva no lee CSS vars de Tailwind)
export const ESTADO_COLOR: Record<EstadoLote, string> = {
  disponible: '#2F6B4F',
  vendido: '#9C3B2C',
  en_proceso: '#B9791E',
}

export const ESTADO_COLOR_BG: Record<EstadoLote, string> = {
  disponible: '#E6EEE8',
  vendido: '#F1E2DD',
  en_proceso: '#F5EADB',
}

export const ESTADO_LABEL: Record<EstadoLote, string> = {
  disponible: 'Disponible',
  vendido: 'Vendido',
  en_proceso: 'En proceso',
}

export const ESTADO_INICIAL: Record<EstadoLote, string> = {
  disponible: 'D',
  vendido: 'V',
  en_proceso: 'P',
}
