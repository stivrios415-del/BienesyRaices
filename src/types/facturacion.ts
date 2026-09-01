export interface ConfigFacturacion {
  id: string
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