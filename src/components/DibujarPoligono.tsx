import { Stage, Layer, Line, Circle, Rect } from 'react-konva'
import type Konva from 'konva'
import type { Punto } from '../types/lote'
import { useAnchoContenedor } from '../hooks/useAnchoContenedor'

interface Props {
  puntos: Punto[]
  onChange: (puntos: Punto[]) => void
}

export default function DibujarPoligono({ puntos, onChange }: Props) {
  const [contenedorRef, ancho] = useAnchoContenedor<HTMLDivElement>(376)
  const alto = Math.round(ancho * 0.74) // proporción 376×280 original

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return
    onChange([...puntos, { x: Math.round(pos.x), y: Math.round(pos.y) }])
  }

  const puntosPlanos = puntos.flatMap((p) => [p.x, p.y])

  return (
    <div>
      <div ref={contenedorRef} className="border border-paper-line rounded-[4px] overflow-hidden bg-paper bg-blueprint bg-grid">
        <Stage width={ancho} height={alto} onClick={handleClick} onTap={handleClick}>
          <Layer>
            <Rect x={0} y={0} width={ancho} height={alto} stroke="#DAD3BC" strokeWidth={1} />
            {puntos.length >= 2 && (
              <Line
                points={puntosPlanos}
                closed={puntos.length >= 3}
                stroke="#A8823D"
                fill="#A8823D22"
                strokeWidth={1.5}
              />
            )}
            {puntos.map((p, i) => (
              <Circle key={i} x={p.x} y={p.y} radius={5} fill="#A8823D" />
            ))}
          </Layer>
        </Stage>
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-ink-500 font-mono">
          {puntos.length} punto{puntos.length === 1 ? '' : 's'} · mínimo 3 · toca para agregar
        </p>
        <button type="button" onClick={() => onChange([])} className="btn-danger-ghost">
          Reiniciar
        </button>
      </div>
    </div>
  )
}
