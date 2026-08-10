import { useMemo, useRef, useState } from 'react'
import { Stage, Layer, Line, Text, Group, Circle } from 'react-konva'
import type Konva from 'konva'
import { useLotesStore } from '../store/useLotesStore'
import { ESTADO_COLOR, ESTADO_LABEL } from '../types/lote'
import type { Lote } from '../types/lote'

interface Props {
  onSelect: (lote: Lote) => void
}

function aPlano(puntos: { x: number; y: number }[]): number[] {
  return puntos.flatMap((p) => [p.x, p.y])
}

function centroide(puntos: { x: number; y: number }[]) {
  const n = puntos.length || 1
  const x = puntos.reduce((s, p) => s + p.x, 0) / n
  const y = puntos.reduce((s, p) => s + p.y, 0) / n
  return { x, y }
}

export default function MapaLotes({ onSelect }: Props) {
  const lotes = useLotesStore((s) => s.lotes)
  const stageRef = useRef<Konva.Stage>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })

  const width = typeof window !== 'undefined' ? window.innerWidth : 1000
  const height = typeof window !== 'undefined' ? window.innerHeight - 64 : 600

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const oldScale = scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = Math.max(0.2, Math.min(4, oldScale * (direction > 0 ? 1.05 : 0.95)))

    setScale(newScale)
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }

  const lotesRenderizables = useMemo(() => lotes.filter((l) => l.coordenadas_poligono?.length >= 3), [lotes])

  const conteo = useMemo(() => {
    return {
      disponible: lotes.filter((l) => l.estado === 'disponible').length,
      en_proceso: lotes.filter((l) => l.estado === 'en_proceso').length,
      vendido: lotes.filter((l) => l.estado === 'vendido').length,
    }
  }, [lotes])

  return (
    <div className="w-full h-full relative bg-paper bg-blueprint bg-grid">
      {/* Leyenda / resumen — tarjeta tipo ficha catastral */}
      <div className="absolute top-4 left-4 z-10 card px-4 py-3.5 w-52">
        <div className="eyebrow mb-2.5">Estado del terreno</div>
        <div className="space-y-2">
          <LeyendaItem color={ESTADO_COLOR.disponible} label={ESTADO_LABEL.disponible} cantidad={conteo.disponible} />
          <LeyendaItem color={ESTADO_COLOR.en_proceso} label={ESTADO_LABEL.en_proceso} cantidad={conteo.en_proceso} />
          <LeyendaItem color={ESTADO_COLOR.vendido} label={ESTADO_LABEL.vendido} cantidad={conteo.vendido} />
        </div>
        <div className="mt-3 pt-2.5 border-t border-paper-line text-[11px] text-ink-500 tabular font-mono">
          {lotes.length} lote{lotes.length === 1 ? '' : 's'} registrado{lotes.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 text-[11px] text-ink-500 font-mono tracking-wide bg-paper/70 px-2 py-1 rounded-[3px]">
        rueda: zoom · arrastrar: desplazar
      </div>

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
      >
        <Layer>
          {lotesRenderizables.map((lote) => {
            const puntos = aPlano(lote.coordenadas_poligono)
            const c = centroide(lote.coordenadas_poligono)
            const isHover = hoverId === lote.id
            return (
              <Group
                key={lote.id}
                onClick={() => onSelect(lote)}
                onTap={() => onSelect(lote)}
                onMouseEnter={(e) => {
                  setHoverId(lote.id)
                  const stage = e.target.getStage()
                  if (stage) stage.container().style.cursor = 'pointer'
                }}
                onMouseLeave={(e) => {
                  setHoverId(null)
                  const stage = e.target.getStage()
                  if (stage) stage.container().style.cursor = 'default'
                }}
              >
                <Line
                  points={puntos}
                  closed
                  fill={ESTADO_COLOR[lote.estado]}
                  opacity={isHover ? 0.82 : 0.58}
                  stroke="#131C2E"
                  strokeWidth={isHover ? 2 : 1}
                />
                {lote.coordenadas_poligono.map((p, i) => (
                  <Circle key={i} x={p.x} y={p.y} radius={2} fill="#131C2E" opacity={0.5} />
                ))}
                <Text
                  text={lote.numero_lote}
                  x={c.x - 26}
                  y={c.y - 7}
                  fontSize={12}
                  fontFamily="JetBrains Mono, monospace"
                  fontStyle="600"
                  fill="#131C2E"
                  align="center"
                  width={52}
                />
              </Group>
            )
          })}
        </Layer>
      </Stage>

      {lotesRenderizables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="card px-6 py-5 max-w-sm text-center">
            <div className="font-display text-lg text-ink-900 mb-1">Sin parcelas trazadas</div>
            <p className="text-sm text-ink-500">
              Todavía no hay lotes con polígono definido. Agrega uno desde el panel de administración.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function LeyendaItem({ color, label, cantidad }: { color: string; label: string; cantidad: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-ink-700">{label}</span>
      </div>
      <span className="font-mono text-ink-500 tabular text-xs">{cantidad}</span>
    </div>
  )
}