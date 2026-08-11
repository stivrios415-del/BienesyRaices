import type { Punto } from '../types/lote'

// 1 metro = 6 píxeles en el plano. El mapa principal tiene zoom/pan,
// así que un terreno grande no es problema aunque el lienzo crezca.
export const ESCALA_PX_POR_M = 6
export const ORIGEN_PX = { x: 40, y: 40 }

export interface ParametrosCuadricula {
  prefijo: string
  proyecto: string // Nombre del terreno completo (ej. "El Naranjal") — agrupa los solares en el mapa
  anchoTotal: number // m, del terreno completo (ej. "El Naranjal")
  largoTotal: number // m
  anchoSolar: number // m, de cada solar individual
  largoSolar: number // m
  calle: number // m, separación entre solares (0 = sin calle)
  precioM2: number // precio por metro cuadrado
  plazosTotales: number
}

export interface LoteGenerado {
  numero_lote: string
  proyecto: string
  ancho: number
  largo: number
  area: number
  precio_total: number
  plazos_totales: number
  coordenadas_poligono: Punto[]
}

export interface ResultadoCuadricula {
  lotes: LoteGenerado[]
  columnas: number
  filas: number
  anchoTotalPx: number
  altoTotalPx: number
  areaUtilizadaM2: number
  areaTotalM2: number
}

export function generarCuadricula(p: ParametrosCuadricula): ResultadoCuadricula {
  const columnas = Math.max(0, Math.floor((p.anchoTotal + p.calle) / (p.anchoSolar + p.calle)))
  const filas = Math.max(0, Math.floor((p.largoTotal + p.calle) / (p.largoSolar + p.calle)))

  const anchoSolarPx = p.anchoSolar * ESCALA_PX_POR_M
  const largoSolarPx = p.largoSolar * ESCALA_PX_POR_M
  const pasoXpx = (p.anchoSolar + p.calle) * ESCALA_PX_POR_M
  const pasoYpx = (p.largoSolar + p.calle) * ESCALA_PX_POR_M

  const areaSolar = p.anchoSolar * p.largoSolar
  const precioLote = Math.round(areaSolar * p.precioM2)

  const lotes: LoteGenerado[] = []
  let n = 1
  for (let r = 0; r < filas; r++) {
    for (let c = 0; c < columnas; c++) {
      const x0 = ORIGEN_PX.x + c * pasoXpx
      const y0 = ORIGEN_PX.y + r * pasoYpx
      lotes.push({
        numero_lote: `${p.prefijo}-${String(n).padStart(3, '0')}`,
        proyecto: p.proyecto,
        ancho: p.anchoSolar,
        largo: p.largoSolar,
        area: areaSolar,
        precio_total: precioLote,
        plazos_totales: p.plazosTotales,
        coordenadas_poligono: [
          { x: x0, y: y0 },
          { x: x0 + anchoSolarPx, y: y0 },
          { x: x0 + anchoSolarPx, y: y0 + largoSolarPx },
          { x: x0, y: y0 + largoSolarPx },
        ],
      })
      n++
    }
  }

  return {
    lotes,
    columnas,
    filas,
    anchoTotalPx: ORIGEN_PX.x * 2 + columnas * pasoXpx,
    altoTotalPx: ORIGEN_PX.y * 2 + filas * pasoYpx,
    areaUtilizadaM2: columnas * filas * areaSolar,
    areaTotalM2: p.anchoTotal * p.largoTotal,
  }
}
