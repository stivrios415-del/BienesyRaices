import { useState } from 'react'
import TablaLotes from '../components/TablaLotes'
import LoteDetallePanel from '../components/LoteDetallePanel'
import type { Lote } from '../types/lote'

export default function TablaPage() {
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null)

  return (
    <div className="flex-1 overflow-y-auto">
      <TablaLotes onSelect={setLoteSeleccionado} />
      <LoteDetallePanel lote={loteSeleccionado} onClose={() => setLoteSeleccionado(null)} />
    </div>
  )
}
