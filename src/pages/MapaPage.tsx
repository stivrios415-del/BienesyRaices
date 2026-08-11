import { useState } from 'react'
import MapaLotes from '../components/MapaLotes'
import LoteDetallePanel from '../components/LoteDetallePanel'
import type { Lote } from '../types/lote'

export default function MapaPage() {
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState<string | null>(null)

  return (
    <div className="flex-1 relative overflow-hidden">
      <MapaLotes onSelect={(lote: Lote) => setLoteSeleccionadoId(lote.id)} />
      <LoteDetallePanel loteId={loteSeleccionadoId} onClose={() => setLoteSeleccionadoId(null)} />
    </div>
  )
}
