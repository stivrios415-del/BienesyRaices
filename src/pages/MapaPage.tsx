import { useState } from 'react'
import MapaLotes from '../components/MapaLotes'
import LoteDetallePanel from '../components/LoteDetallePanel'
import type { Lote } from '../types/lote'

export default function MapaPage() {
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null)

  return (
    <div className="flex-1 relative overflow-hidden">
      <MapaLotes onSelect={setLoteSeleccionado} />
      <LoteDetallePanel lote={loteSeleccionado} onClose={() => setLoteSeleccionado(null)} />
    </div>
  )
}
