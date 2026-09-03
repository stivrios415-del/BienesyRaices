export interface ConfigFacturacion {
  empresa_id: string
  razon_social: string
  rtn: string
  direccion: string
  telefono: string
  cai: string
  rango_autorizado_inicio: string
  rango_autorizado_fin: string
  correlativo_actual: number
  fecha_limite_emision: string | null
  updated_at: string
}

export interface Recibo {
  id: string
  pago_id: string
  lote_id: string
  correlativo: number
  monto: number
  emitido_por: string | null
  fecha_emision: string
}

// Recibo "enriquecido" con datos del lote — usado para el listado y la
// exportación (no se guarda así en la base).
export interface ReciboConLote extends Recibo {
  numero_lote?: string
  proyecto?: string | null
  comprador?: string | null
}
