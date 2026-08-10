import { useState } from 'react'
import { Stage, Layer, Line, Circle, Rect } from 'react-konva'
import type Konva from 'konva'
import type { Punto } from '../types/lote'

interface Props {
  puntos: Punto[]
  onChange: (puntos: Punto[]) => void
}

export default function DibujarPoligono({ puntos, onChange }: Props) {
  const [ancho] = useState(376)
  const [alto] = useState(280)

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return
    onChange([...puntos, { x: Math.round(pos.x), y: Math.round(pos.y) }])
  }

  const puntosPlanos = puntos.flatMap((p) => [p.x, p.y])

  return (
    <div>
      <div className="border border-paper-line rounded-[4px] overflow-hidden bg-paper bg-blueprint bg-grid">
        <Stage width={ancho} height={alto} onClick={handleClick}>
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
              <Circle key={i} x={p.x} y={p.y} radius={3.5} fill="#A8823D" />
            ))}
          </Layer>
        </Stage>
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-ink-500 font-mono">
          {puntos.length} punto{puntos.length === 1 ? '' : 's'} · mínimo 3
        </p>
        <button type="button" onClick={() => onChange([])} className="btn-danger-ghost">
          Reiniciar
        </button>
      </div>
    </div>
  )
}