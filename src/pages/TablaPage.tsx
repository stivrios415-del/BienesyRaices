import { useState } from 'react'
import TablaLotes from '../components/TablaLotes'
import LoteDetallePanel from '../components/LoteDetallePanel'
import type { Lote } from '../types/lote'

export default function TablaPage() {
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState<string | null>(null)

  return (
    <div className="flex-1 overflow-y-auto">
      <TablaLotes onSelect={(lote: Lote) => setLoteSeleccionadoId(lote.id)} />
      <LoteDetallePanel loteId={loteSeleccionadoId} onClose={() => setLoteSeleccionadoId(null)} />
    </div>
  )
}
