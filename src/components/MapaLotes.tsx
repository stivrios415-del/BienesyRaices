import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Line, Text, Group, Rect } from 'react-konva'
import type Konva from 'konva'
import { useLotesStore } from '../store/useLotesStore'
import { ESTADO_COLOR, ESTADO_LABEL } from '../types/lote'
import type { EstadoLote, Lote, Punto } from '../types/lote'

interface Props {
  onSelect: (lote: Lote) => void
}

function centroide(puntos: Punto[]) {
  const n = puntos.length || 1
  const x = puntos.reduce((s, p) => s + p.x, 0) / n
  const y = puntos.reduce((s, p) => s + p.y, 0) / n
  return { x, y }
}

function distancia(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
}

function centro(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

// --- Forma de un solar, memoizada -------------------------------------
// Cada fetch trae objetos "Lote" nuevos aunque el dato no haya cambiado
// (el store reemplaza el arreglo completo). Comparando por VALOR de los
// campos que realmente afectan el dibujo (no por referencia del objeto),
// React puede saltarse el re-render de los ~170+ solares que no cambiaron
// cuando solo se actualizó uno (ej. tras un pago).
interface SolarShapeProps {
  id: string
  numeroLote: string
  estado: EstadoLote
  puntos: Punto[]
  hover: boolean
  onSelect: () => void
  onHover: (hover: boolean) => void
}

const SolarShape = memo(
  function SolarShape({ numeroLote, estado, puntos, hover, onSelect, onHover }: SolarShapeProps) {
    const plano = puntos.flatMap((p) => [p.x, p.y])
    const c = centroide(puntos)
    return (
      <Group
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={(e) => {
          onHover(true)
          const stage = e.target.getStage()
          if (stage) stage.container().style.cursor = 'pointer'
        }}
        onMouseLeave={(e) => {
          onHover(false)
          const stage = e.target.getStage()
          if (stage) stage.container().style.cursor = 'default'
        }}
      >
        <Line
          points={plano}
          closed
          fill={ESTADO_COLOR[estado]}
          opacity={hover ? 0.82 : 0.58}
          stroke="#131C2E"
          strokeWidth={hover ? 2 : 1}
          perfectDrawEnabled={false}
        />
        <Text
          text={numeroLote}
          x={c.x - 26}
          y={c.y - 7}
          fontSize={12}
          fontFamily="JetBrains Mono, monospace"
          fontStyle="600"
          fill="#131C2E"
          align="center"
          width={52}
          listening={false}
        />
      </Group>
    )
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.numeroLote === next.numeroLote &&
    prev.estado === next.estado &&
    prev.hover === next.hover &&
    prev.puntos.length === next.puntos.length &&
    prev.puntos.every((p, i) => p.x === next.puntos[i].x && p.y === next.puntos[i].y)
)

export default function MapaLotes({ onSelect }: Props) {
  const lotes = useLotesStore((s) => s.lotes)
  const stageRef = useRef<Konva.Stage>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  // Se mide el contenedor real (no window.innerHeight con offsets fijos),
  // así el lienzo encaja sin importar el alto del navbar o la barra inferior.
  const contenedorRef = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(1000)
  const [alto, setAlto] = useState(600)

  useEffect(() => {
    const el = contenedorRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      setAncho(Math.floor(rect.width))
      setAlto(Math.floor(rect.height))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Referencias para el gesto de pellizco (pinch-to-zoom) en pantallas táctiles
  const lastDist = useRef(0)
  const lastCenter = useRef<{ x: number; y: number } | null>(null)

  // Pan/zoom 100% imperativo: se manipula el nodo de Konva directamente
  // (stage.scale/position + batchDraw) y NUNCA se pasa por React state
  // durante el gesto. Antes, cada evento de wheel/touchmove llamaba a
  // setState, lo que forzaba un re-render de React (y su reconciliación
  // con Konva) en cada frame — con 100+ solares eso es lo que se sentía
  // "trabado" al hacer zoom o arrastrar en el celular.
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = Math.max(0.2, Math.min(4, oldScale * (direction > 0 ? 1.05 : 0.95)))

    stage.scale({ x: newScale, y: newScale })
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
    stage.batchDraw()
  }

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]
    const stage = stageRef.current
    if (!touch1 || !touch2 || !stage) return
    e.evt.preventDefault()

    if (stage.isDragging()) stage.stopDrag()

    const p1 = { x: touch1.clientX, y: touch1.clientY }
    const p2 = { x: touch2.clientX, y: touch2.clientY }
    const nuevoCentro = centro(p1, p2)
    const dist = distancia(p1, p2)

    if (!lastCenter.current) {
      lastCenter.current = nuevoCentro
      lastDist.current = dist
      return
    }

    const oldScale = stage.scaleX()
    const puntoRelativo = {
      x: (nuevoCentro.x - stage.x()) / oldScale,
      y: (nuevoCentro.y - stage.y()) / oldScale,
    }

    const nuevaEscala = Math.max(0.2, Math.min(4, oldScale * (dist / (lastDist.current || dist))))

    const dx = nuevoCentro.x - lastCenter.current.x
    const dy = nuevoCentro.y - lastCenter.current.y

    stage.scale({ x: nuevaEscala, y: nuevaEscala })
    stage.position({
      x: nuevoCentro.x - puntoRelativo.x * nuevaEscala + dx,
      y: nuevoCentro.y - puntoRelativo.y * nuevaEscala + dy,
    })
    stage.batchDraw()

    lastDist.current = dist
    lastCenter.current = nuevoCentro
  }

  const handleTouchEnd = () => {
    lastDist.current = 0
    lastCenter.current = null
  }

  const lotesRenderizables = useMemo(() => lotes.filter((l) => l.coordenadas_poligono?.length >= 3), [lotes])

  const conteo = useMemo(() => {
    return {
      disponible: lotes.filter((l) => l.estado === 'disponible').length,
      en_proceso: lotes.filter((l) => l.estado === 'en_proceso').length,
      vendido: lotes.filter((l) => l.estado === 'vendido').length,
    }
  }, [lotes])

  // Agrupa los solares que comparten "proyecto" (ej. "El Naranjal") para dibujar
  // un único contorno contenedor con todos los solares trazados adentro.
  const contenedores = useMemo(() => {
    const grupos = new Map<string, typeof lotesRenderizables>()
    lotesRenderizables.forEach((l) => {
      const nombre = l.proyecto?.trim()
      if (!nombre) return
      if (!grupos.has(nombre)) grupos.set(nombre, [])
      grupos.get(nombre)!.push(l)
    })
    return Array.from(grupos.entries()).map(([nombre, lotesGrupo]) => {
      const puntos = lotesGrupo.flatMap((l) => l.coordenadas_poligono)
      const minX = Math.min(...puntos.map((p) => p.x))
      const minY = Math.min(...puntos.map((p) => p.y))
      const maxX = Math.max(...puntos.map((p) => p.x))
      const maxY = Math.max(...puntos.map((p) => p.y))
      const pad = 16
      return {
        nombre,
        x: minX - pad,
        y: minY - pad,
        width: maxX - minX + pad * 2,
        height: maxY - minY + pad * 2,
        cantidad: lotesGrupo.length,
      }
    })
  }, [lotesRenderizables])

  return (
    <div ref={contenedorRef} className="w-full h-full relative bg-paper bg-blueprint bg-grid">
      <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 card px-3 py-2.5 md:px-4 md:py-3.5 w-40 md:w-52">
        <div className="eyebrow mb-2 text-[10px] md:text-[11px]">Estado</div>
        <div className="space-y-1.5 md:space-y-2">
          <LeyendaItem color={ESTADO_COLOR.disponible} label={ESTADO_LABEL.disponible} cantidad={conteo.disponible} />
          <LeyendaItem color={ESTADO_COLOR.en_proceso} label={ESTADO_LABEL.en_proceso} cantidad={conteo.en_proceso} />
          <LeyendaItem color={ESTADO_COLOR.vendido} label={ESTADO_LABEL.vendido} cantidad={conteo.vendido} />
        </div>
        <div className="mt-2.5 pt-2 border-t border-paper-line text-[10px] md:text-[11px] text-ink-500 tabular font-mono">
          {lotes.length} lote{lotes.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="hidden md:block absolute bottom-4 right-4 z-10 text-[11px] text-ink-500 font-mono tracking-wide bg-paper/70 px-2 py-1 rounded-[3px]">
        rueda: zoom · arrastrar: desplazar
      </div>
      <div className="md:hidden absolute top-3 right-3 z-10 text-[10px] text-ink-500 font-mono tracking-wide bg-paper/70 px-2 py-1 rounded-[3px]">
        pellizca: zoom
      </div>

      <Stage
        ref={stageRef}
        width={ancho}
        height={alto}
        draggable
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Layer>
          {contenedores.map((c) => (
            <Group key={c.nombre}>
              <Rect
                x={c.x}
                y={c.y}
                width={c.width}
                height={c.height}
                stroke="#A8823D"
                strokeWidth={1.5}
                dash={[9, 6]}
                cornerRadius={2}
                listening={false}
                perfectDrawEnabled={false}
              />
              <Text
                text={`${c.nombre.toUpperCase()}  ·  ${c.cantidad} SOLARES`}
                x={c.x + 4}
                y={c.y - 20}
                fontSize={12}
                fontFamily="JetBrains Mono, monospace"
                fontStyle="600"
                fill="#8C6A2E"
                listening={false}
              />
            </Group>
          ))}

          {lotesRenderizables.map((lote) => (
            <SolarShape
              key={lote.id}
              id={lote.id}
              numeroLote={lote.numero_lote}
              estado={lote.estado}
              puntos={lote.coordenadas_poligono}
              hover={hoverId === lote.id}
              onSelect={() => onSelect(lote)}
              onHover={(h) => setHoverId(h ? lote.id : null)}
            />
          ))}
        </Layer>
      </Stage>

      {lotesRenderizables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="card px-5 py-4 md:px-6 md:py-5 max-w-sm text-center">
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
    <div className="flex items-center justify-between text-xs md:text-sm">
      <div className="flex items-center gap-1.5 md:gap-2">
        <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-ink-700">{label}</span>
      </div>
      <span className="font-mono text-ink-500 tabular text-[11px] md:text-xs">{cantidad}</span>
    </div>
  )
}
