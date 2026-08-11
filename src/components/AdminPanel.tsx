import { useState } from 'react'
import { useLotesStore } from '../store/useLotesStore'
import type { Lote } from '../types/lote'
import { formatMoneda } from '../utils/format'
import FormularioLote from './FormularioLote'
import GeneradorCuadricula from './GeneradorCuadricula'

type Modo = 'lista' | 'generar' | 'crear-manual' | 'editar'

export default function AdminPanel() {
  const lotes = useLotesStore((s) => s.lotes)
  const eliminarLote = useLotesStore((s) => s.eliminarLote)
  const [modo, setModo] = useState<Modo>('lista')
  const [loteEditando, setLoteEditando] = useState<Lote | null>(null)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)

  const cerrarFormulario = () => {
    setModo('lista')
    setLoteEditando(null)
  }

  const handleEliminar = async (id: string) => {
    await eliminarLote(id)
    setConfirmandoId(null)
  }

  if (modo === 'generar') {
    return (
      <div className="p-5 md:p-8 max-w-4xl mx-auto">
        <div className="eyebrow mb-1">Subdivisión automática</div>
        <h1 className="font-display text-2xl text-ink-900 mb-6">Generar cuadrícula de solares</h1>
        <div className="card p-6">
          <GeneradorCuadricula onDone={cerrarFormulario} onCancel={cerrarFormulario} />
        </div>
      </div>
    )
  }

  if (modo === 'crear-manual' || (modo === 'editar' && loteEditando)) {
    return (
      <div className="p-5 md:p-8 max-w-xl mx-auto">
        <div className="eyebrow mb-1">{modo === 'crear-manual' ? 'Lote individual' : 'Editar parcela'}</div>
        <h1 className="font-display text-2xl text-ink-900 mb-6">
          {modo === 'crear-manual' ? 'Agregar un solo lote' : `Lote ${loteEditando?.numero_lote}`}
        </h1>
        <div className="card p-6">
          <FormularioLote
            loteExistente={modo === 'editar' ? loteEditando : null}
            onDone={cerrarFormulario}
            onCancel={cerrarFormulario}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">Administración</div>
          <h1 className="font-display text-2xl text-ink-900">Parcelas registradas</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModo('crear-manual')} className="btn-secondary">
            + Lote individual
          </button>
          <button onClick={() => setModo('generar')} className="btn-primary">
            ⊞ Generar cuadrícula automática
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-900 text-paper/80 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">N.º Lote</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Precio</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lotes.map((lote) => (
              <tr key={lote.id} className="border-t border-paper-line">
                <td className="px-4 py-3 font-mono font-semibold text-ink-900">{lote.numero_lote}</td>
                <td className="px-4 py-3 font-mono tabular text-ink-700">{formatMoneda(lote.precio_total)}</td>
                <td className="px-4 py-3 capitalize text-ink-700">{lote.estado.replace('_', ' ')}</td>
                <td className="px-4 py-3 space-x-4">
                  <button
                    className="text-brass-600 text-xs font-medium hover:underline"
                    onClick={() => {
                      setLoteEditando(lote)
                      setModo('editar')
                    }}
                  >
                    Editar
                  </button>
                  {confirmandoId === lote.id ? (
                    <>
                      <span className="text-ink-500 text-xs">¿Confirmar?</span>
                      <button className="btn-danger-ghost" onClick={() => handleEliminar(lote.id)}>
                        Sí, eliminar
                      </button>
                      <button className="text-ink-500 text-xs hover:underline" onClick={() => setConfirmandoId(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="btn-danger-ghost" onClick={() => setConfirmandoId(lote.id)}>
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {lotes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-500 text-sm">
                  Todavía no hay lotes registrados. Usa "Generar cuadrícula automática" para crear varios de una vez.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
