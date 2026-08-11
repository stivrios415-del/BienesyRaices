import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stage, Layer, Line, Text, Rect, Group } from 'react-konva'
import { useLotesStore } from '../store/useLotesStore'
import { generarCuadricula, ORIGEN_PX } from '../utils/generarCuadricula'
import { formatMoneda } from '../utils/format'

const schema = z.object({
  nombreTerreno: z.string().min(1, 'Requerido'),
  prefijo: z
    .string()
    .min(1, 'Requerido')
    .max(6, 'Máximo 6 caracteres')
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '')),
  anchoTotal: z.coerce.number().positive('Debe ser mayor a 0'),
  largoTotal: z.coerce.number().positive('Debe ser mayor a 0'),
  anchoSolar: z.coerce.number().positive('Debe ser mayor a 0'),
  largoSolar: z.coerce.number().positive('Debe ser mayor a 0'),
  calle: z.coerce.number().min(0, 'No puede ser negativo'),
  precioM2: z.coerce.number().positive('Debe ser mayor a 0'),
  plazosTotales: z.coerce.number().int().positive('Debe ser mayor a 0'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onDone: () => void
  onCancel: () => void
}

const DEFAULTS: FormValues = {
  nombreTerreno: 'El Naranjal',
  prefijo: 'NAR',
  anchoTotal: 60,
  largoTotal: 40,
  anchoSolar: 10,
  largoSolar: 15,
  calle: 4,
  precioM2: 350,
  plazosTotales: 24,
}

export default function GeneradorCuadricula({ onDone, onCancel }: Props) {
  const crearLotesMasivo = useLotesStore((s) => s.crearLotesMasivo)
  const lotesExistentes = useLotesStore((s) => s.lotes)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Coloca la nueva cuadrícula al lado (a la derecha) de todo lo que ya
  // existe en el mapa, en vez de siempre arrancar desde el mismo punto
  // (lo que hacía que dos proyectos generados por separado quedaran
  // encimados uno sobre el otro).
  const origenSugerido = useMemo(() => {
    const puntos = lotesExistentes.flatMap((l) => l.coordenadas_poligono ?? [])
    if (puntos.length === 0) return ORIGEN_PX
    const maxX = Math.max(...puntos.map((p) => p.x))
    const minY = Math.min(...puntos.map((p) => p.y))
    const SEPARACION_PX = 90
    return { x: maxX + SEPARACION_PX, y: minY }
  }, [lotesExistentes])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  })

  const valores = watch()

  const resultado = useMemo(() => {
    const v = { ...valores }
    if (!v.anchoTotal || !v.largoTotal || !v.anchoSolar || !v.largoSolar || !v.precioM2 || !v.plazosTotales) {
      return null
    }
    try {
      return generarCuadricula({
        prefijo: (v.prefijo || 'LT').toUpperCase(),
        proyecto: v.nombreTerreno || 'Sin nombre',
        anchoTotal: Number(v.anchoTotal),
        largoTotal: Number(v.largoTotal),
        anchoSolar: Number(v.anchoSolar),
        largoSolar: Number(v.largoSolar),
        calle: Number(v.calle) || 0,
        precioM2: Number(v.precioM2),
        plazosTotales: Number(v.plazosTotales),
        // La vista previa siempre se dibuja desde el origen por defecto para
        // que se vea centrada y a buen zoom; el desplazamiento real (para no
        // encimarse con lo ya existente) se aplica solo al guardar.
      })
    } catch {
      return null
    }
  }, [valores])

  const previewBoxW = 400
  const previewBoxH = 300
  const previewScale = resultado
    ? Math.min(previewBoxW / resultado.anchoTotalPx, previewBoxH / resultado.altoTotalPx, 1)
    : 1

  const onSubmit = async (values: FormValues) => {
    const r = generarCuadricula({
      prefijo: values.prefijo,
      proyecto: values.nombreTerreno,
      anchoTotal: values.anchoTotal,
      largoTotal: values.largoTotal,
      anchoSolar: values.anchoSolar,
      largoSolar: values.largoSolar,
      calle: values.calle,
      precioM2: values.precioM2,
      plazosTotales: values.plazosTotales,
      origen: origenSugerido,
    })

    if (r.lotes.length === 0) {
      setError('Con estas medidas no cabe ni un solar. Revisa las dimensiones del terreno y del solar.')
      return
    }

    setEnviando(true)
    setError(null)

    const payload = r.lotes.map((l) => ({
      numero_lote: l.numero_lote,
      proyecto: l.proyecto,
      ancho: l.ancho,
      largo: l.largo,
      precio_total: l.precio_total,
      plazos_totales: l.plazos_totales,
      coordenadas_poligono: l.coordenadas_poligono,
      comprador: null,
    }))

    const res = await crearLotesMasivo(payload)
    setEnviando(false)

    if (res.error) {
      setError(
        res.error.includes('duplicate') || res.error.includes('unique')
          ? `Ya existen lotes con ese prefijo (${values.prefijo}-XXX). Cambia el prefijo e inténtalo de nuevo.`
          : res.error
      )
      return
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-[1fr_400px] gap-6">
      <div className="space-y-5">
        <div>
          <label className="label-field">Nombre del terreno</label>
          <input {...register('nombreTerreno')} className="input-field" placeholder="El Naranjal" />
          {errors.nombreTerreno && <p className="text-estado-vendido text-xs mt-1">{errors.nombreTerreno.message}</p>}
        </div>

        <div>
          <label className="label-field">Prefijo de numeración</label>
          <input {...register('prefijo')} className="input-field font-mono uppercase" placeholder="NAR" />
          <p className="text-[11px] text-ink-500 mt-1">Los solares se numerarán {watch('prefijo') || 'NAR'}-001, {watch('prefijo') || 'NAR'}-002…</p>
          {errors.prefijo && <p className="text-estado-vendido text-xs mt-1">{errors.prefijo.message}</p>}
        </div>

        <div className="perforated pt-5">
          <div className="eyebrow mb-3">Medidas del terreno completo</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Ancho total (m)</label>
              <input type="number" step="0.01" {...register('anchoTotal')} className="input-field font-mono" />
              {errors.anchoTotal && <p className="text-estado-vendido text-xs mt-1">{errors.anchoTotal.message}</p>}
            </div>
            <div>
              <label className="label-field">Largo total (m)</label>
              <input type="number" step="0.01" {...register('largoTotal')} className="input-field font-mono" />
              {errors.largoTotal && <p className="text-estado-vendido text-xs mt-1">{errors.largoTotal.message}</p>}
            </div>
          </div>
        </div>

        <div className="perforated pt-5">
          <div className="eyebrow mb-3">Medidas de cada solar</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Ancho del solar (m)</label>
              <input type="number" step="0.01" {...register('anchoSolar')} className="input-field font-mono" />
              {errors.anchoSolar && <p className="text-estado-vendido text-xs mt-1">{errors.anchoSolar.message}</p>}
            </div>
            <div>
              <label className="label-field">Largo del solar (m)</label>
              <input type="number" step="0.01" {...register('largoSolar')} className="input-field font-mono" />
              {errors.largoSolar && <p className="text-estado-vendido text-xs mt-1">{errors.largoSolar.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label-field">Separación / calle entre solares (m)</label>
              <input type="number" step="0.01" {...register('calle')} className="input-field font-mono" />
              {errors.calle && <p className="text-estado-vendido text-xs mt-1">{errors.calle.message}</p>}
            </div>
          </div>
        </div>

        <div className="perforated pt-5">
          <div className="eyebrow mb-3">Precio y plazos (aplica a todos los solares)</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Precio por m²</label>
              <input type="number" step="0.01" {...register('precioM2')} className="input-field font-mono" />
              {errors.precioM2 && <p className="text-estado-vendido text-xs mt-1">{errors.precioM2.message}</p>}
            </div>
            <div>
              <label className="label-field">Plazos (cuotas)</label>
              <input type="number" {...register('plazosTotales')} className="input-field font-mono" />
              {errors.plazosTotales && <p className="text-estado-vendido text-xs mt-1">{errors.plazosTotales.message}</p>}
            </div>
          </div>
        </div>

        {error && <p className="text-estado-vendido text-sm">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={enviando || !resultado || resultado.lotes.length === 0} className="btn-primary flex-1">
            {enviando
              ? 'Generando…'
              : resultado && resultado.lotes.length > 0
                ? `Generar ${resultado.lotes.length} lotes`
                : 'Generar lotes'}
          </button>
        </div>
      </div>

      {/* Vista previa en vivo */}
      <div className="space-y-3">
        <div className="eyebrow">Vista previa</div>
        <div className="card overflow-hidden bg-paper bg-blueprint bg-grid" style={{ width: previewBoxW, height: previewBoxH }}>
          {resultado && resultado.lotes.length > 0 ? (
            <Stage width={previewBoxW} height={previewBoxH} scaleX={previewScale} scaleY={previewScale}>
              <Layer>
                <Rect
                  x={0}
                  y={0}
                  width={resultado.anchoTotalPx}
                  height={resultado.altoTotalPx}
                  stroke="#131C2E"
                  strokeWidth={1.5}
                  dash={[6, 4]}
                  opacity={0.4}
                />
                {resultado.lotes.map((l) => {
                  const pts = l.coordenadas_poligono.flatMap((p) => [p.x, p.y])
                  const cx = l.coordenadas_poligono[0].x + 4
                  const cy = l.coordenadas_poligono[0].y + 4
                  return (
                    <Group key={l.numero_lote}>
                      <Line points={pts} closed fill="#2F6B4F" opacity={0.35} stroke="#2F6B4F" strokeWidth={1} />
                      <Text
                        text={l.numero_lote.split('-')[1]}
                        x={cx}
                        y={cy}
                        fontSize={9}
                        fontFamily="JetBrains Mono, monospace"
                        fill="#131C2E"
                      />
                    </Group>
                  )
                })}
              </Layer>
            </Stage>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-ink-500 px-6 text-center">
              Completa las medidas para ver la subdivisión.
            </div>
          )}
        </div>

        {resultado && (
          <div className="card px-4 py-3.5 space-y-2 text-sm">
            <Fila label="Cuadrícula" valor={`${resultado.columnas} col × ${resultado.filas} fil`} />
            <Fila label="Total de solares" valor={String(resultado.lotes.length)} destacado />
            <Fila
              label="Precio por solar"
              valor={resultado.lotes[0] ? formatMoneda(resultado.lotes[0].precio_total) : '—'}
            />
            <Fila
              label="Área utilizada"
              valor={`${resultado.areaUtilizadaM2.toLocaleString('es-HN')} m² de ${resultado.areaTotalM2.toLocaleString('es-HN')} m²`}
            />
            {lotesExistentes.length > 0 && (
              <p className="text-[11px] text-ink-500 pt-1 border-t border-paper-line mt-1">
                Se colocará al lado de lo que ya existe en el mapa, no encima.
              </p>
            )}
            {resultado.lotes.length === 0 && (
              <p className="text-estado-vendido text-xs pt-1">No cabe ningún solar con estas medidas.</p>
            )}
          </div>
        )}
      </div>
    </form>
  )
}

function Fila({ label, valor, destacado }: { label: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500 text-xs">{label}</span>
      <span className={`font-mono tabular ${destacado ? 'text-brass-600 font-semibold' : 'text-ink-900'}`}>{valor}</span>
    </div>
  )
}
