import { useEffect, useState } from 'react'
import { useLotesStore } from '../store/useLotesStore'
import type { Lote } from '../types/lote'
import { formatMoneda } from '../utils/format'
import { exportarPagosExcel } from '../utils/exportarExcel'
import FormularioLote from './FormularioLote'
import GeneradorCuadricula from './GeneradorCuadricula'
import Papelera from './Papelera'
import ConfiguracionFacturacion from './ConfiguracionFacturacion'
import RecibosEmitidos from './RecibosEmitidos'

type Modo = 'lista' | 'generar' | 'crear-manual' | 'editar' | 'papelera' | 'facturacion' | 'recibos'

export default function AdminPanel() {
  const lotes = useLotesStore((s) => s.lotes)
  const lotesArchivados = useLotesStore((s) => s.lotesArchivados)
  const fetchLotesArchivados = useLotesStore((s) => s.fetchLotesArchivados)
  const fetchTodosPagosParaExportar = useLotesStore((s) => s.fetchTodosPagosParaExportar)
  const archivarLote = useLotesStore((s) => s.archivarLote)
  const [modo, setModo] = useState<Modo>('lista')
  const [loteEditando, setLoteEditando] = useState<Lote | null>(null)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [exportandoPagos, setExportandoPagos] = useState(false)

  useEffect(() => {
    fetchLotesArchivados()
  }, [fetchLotesArchivados])

  const cerrarFormulario = () => {
    setModo('lista')
    setLoteEditando(null)
  }

  const handleArchivar = async (id: string) => {
    await archivarLote(id)
    setConfirmandoId(null)
  }

  const handleExportarPagos = async () => {
    setExportandoPagos(true)
    const pagos = await fetchTodosPagosParaExportar()
    setExportandoPagos(false)
    if (pagos.length === 0) {
      alert('Todavía no hay pagos registrados para exportar.')
      return
    }
    exportarPagosExcel(pagos)
  }

  if (modo === 'recibos') {
    return <RecibosEmitidos onCerrar={() => setModo('lista')} />
  }

  if (modo === 'papelera') {
    return <Papelera onCerrar={() => setModo('lista')} />
  }

  if (modo === 'facturacion') {
    return <ConfiguracionFacturacion onCerrar={() => setModo('lista')} />
  }

  if (modo === 'generar') {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="eyebrow mb-1">Subdivisión automática</div>
        <h1 className="font-display text-xl md:text-2xl text-ink-900 mb-5 md:mb-6">Generar cuadrícula de solares</h1>
        <div className="card p-4 md:p-6">
          <GeneradorCuadricula onDone={cerrarFormulario} onCancel={cerrarFormulario} />
        </div>
      </div>
    )
  }

  if (modo === 'crear-manual' || (modo === 'editar' && loteEditando)) {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <div className="eyebrow mb-1">{modo === 'crear-manual' ? 'Lote individual' : 'Editar parcela'}</div>
        <h1 className="font-display text-xl md:text-2xl text-ink-900 mb-5 md:mb-6">
          {modo === 'crear-manual' ? 'Agregar un solo lote' : `Lote ${loteEditando?.numero_lote}`}
        </h1>
        <div className="card p-4 md:p-6">
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
    <div className="p-4 md:p-8 space-y-4 md:space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">Administración</div>
          <h1 className="font-display text-xl md:text-2xl text-ink-900">Parcelas registradas</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModo('facturacion')} className="btn-secondary">
            ⚙ Facturación
          </button>
          <button onClick={() => setModo('recibos')} className="btn-secondary">
            🧾 Recibos emitidos
          </button>
          <button
            onClick={handleExportarPagos}
            disabled={exportandoPagos}
            className="btn-secondary disabled:opacity-40"
          >
            {exportandoPagos ? 'Preparando…' : '⬇ Exportar pagos'}
          </button>
          <button onClick={() => setModo('papelera')} className="btn-secondary relative">
            🗑 Papelera
            {lotesArchivados.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-estado-vendido text-white text-[10px] font-semibold">
                {lotesArchivados.length}
              </span>
            )}
          </button>
          <button onClick={() => setModo('crear-manual')} className="btn-secondary flex-1 sm:flex-none">
            + Lote individual
          </button>
          <button onClick={() => setModo('generar')} className="btn-primary flex-1 sm:flex-none">
            ⊞ Generar cuadrícula
          </button>
        </div>
      </div>

      {/* Tabla completa — desktop */}
      <div className="hidden md:block card overflow-x-auto">
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
                      <span className="text-ink-500 text-xs">¿Enviar a la papelera?</span>
                      <button className="btn-danger-ghost" onClick={() => handleArchivar(lote.id)}>
                        Sí, archivar
                      </button>
                      <button className="text-ink-500 text-xs hover:underline" onClick={() => setConfirmandoId(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="btn-danger-ghost" onClick={() => setConfirmandoId(lote.id)}>
                      Archivar
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

      {/* Tarjetas apilables — móvil */}
      <div className="md:hidden space-y-2.5">
        {lotes.map((lote) => (
          <div key={lote.id} className="card px-4 py-3.5">
            <div className="flex items-center justify-between">
              <p className="font-mono font-semibold text-ink-900 text-[15px]">{lote.numero_lote}</p>
              <p className="font-mono tabular text-ink-700 text-sm">{formatMoneda(lote.precio_total)}</p>
            </div>
            <p className="text-xs text-ink-500 capitalize mt-1">{lote.estado.replace('_', ' ')}</p>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-paper-line">
              <button
                className="text-brass-600 text-xs font-medium"
                onClick={() => {
                  setLoteEditando(lote)
                  setModo('editar')
                }}
              >
                Editar
              </button>
              {confirmandoId === lote.id ? (
                <>
                  <span className="text-ink-500 text-xs">¿Archivar?</span>
                  <button className="btn-danger-ghost" onClick={() => handleArchivar(lote.id)}>
                    Sí, archivar
                  </button>
                  <button className="text-ink-500 text-xs" onClick={() => setConfirmandoId(null)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button className="btn-danger-ghost" onClick={() => setConfirmandoId(lote.id)}>
                  Archivar
                </button>
              )}
            </div>
          </div>
        ))}
        {lotes.length === 0 && (
          <div className="card px-4 py-10 text-center text-ink-500 text-sm">
            Todavía no hay lotes registrados. Usa "Generar cuadrícula" para crear varios de una vez.
          </div>
        )}
      </div>
    </div>
  )
}
