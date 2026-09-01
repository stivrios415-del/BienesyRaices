import { useEffect, useState } from 'react'
import { useLotesStore } from '../store/useLotesStore'
import { formatMoneda, formatFecha } from '../utils/format'

interface Props {
  onCerrar: () => void
}

export default function Papelera({ onCerrar }: Props) {
  const lotesArchivados = useLotesStore((s) => s.lotesArchivados)
  const loadingArchivados = useLotesStore((s) => s.loadingArchivados)
  const fetchLotesArchivados = useLotesStore((s) => s.fetchLotesArchivados)
  const restaurarLote = useLotesStore((s) => s.restaurarLote)
  const eliminarLotePermanente = useLotesStore((s) => s.eliminarLotePermanente)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)

  useEffect(() => {
    fetchLotesArchivados()
  }, [fetchLotesArchivados])

  const handleEliminarDefinitivo = async (id: string) => {
    await eliminarLotePermanente(id)
    setConfirmandoId(null)
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow mb-1">Lotes archivados</div>
          <h1 className="font-display text-xl md:text-2xl text-ink-900">Papelera</h1>
        </div>
        <button onClick={onCerrar} className="btn-secondary">
          ← Volver
        </button>
      </div>

      {loadingArchivados ? (
        <p className="text-sm text-ink-500 font-mono">Cargando…</p>
      ) : lotesArchivados.length === 0 ? (
        <div className="card px-4 py-10 text-center text-ink-500 text-sm">
          La papelera está vacía. Los lotes que archives desde Administración aparecerán aquí.
        </div>
      ) : (
        <>
          {/* Tabla — desktop */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-900 text-paper/80 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">N.º Lote</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Comprador</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Precio</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Archivado</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lotesArchivados.map((lote) => (
                  <tr key={lote.id} className="border-t border-paper-line">
                    <td className="px-4 py-3 font-mono font-semibold text-ink-900">{lote.numero_lote}</td>
                    <td className="px-4 py-3 text-ink-700">{lote.comprador ?? '—'}</td>
                    <td className="px-4 py-3 font-mono tabular text-ink-700">{formatMoneda(lote.precio_total)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">{formatFecha(lote.updated_at)}</td>
                    <td className="px-4 py-3 space-x-4">
                      <button
                        className="text-brass-600 text-xs font-medium hover:underline"
                        onClick={() => restaurarLote(lote.id)}
                      >
                        Restaurar
                      </button>
                      {confirmandoId === lote.id ? (
                        <>
                          <span className="text-ink-500 text-xs">¿Borrar para siempre?</span>
                          <button className="btn-danger-ghost" onClick={() => handleEliminarDefinitivo(lote.id)}>
                            Sí, borrar
                          </button>
                          <button className="text-ink-500 text-xs hover:underline" onClick={() => setConfirmandoId(null)}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button className="btn-danger-ghost" onClick={() => setConfirmandoId(lote.id)}>
                          Eliminar definitivamente
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas — móvil */}
          <div className="md:hidden space-y-2.5">
            {lotesArchivados.map((lote) => (
              <div key={lote.id} className="card px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="font-mono font-semibold text-ink-900 text-[15px]">{lote.numero_lote}</p>
                  <p className="font-mono tabular text-ink-700 text-sm">{formatMoneda(lote.precio_total)}</p>
                </div>
                <p className="text-xs text-ink-500 mt-1">
                  {lote.comprador ?? 'Sin comprador'} · archivado {formatFecha(lote.updated_at)}
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-paper-line">
                  <button className="text-brass-600 text-xs font-medium" onClick={() => restaurarLote(lote.id)}>
                    Restaurar
                  </button>
                  {confirmandoId === lote.id ? (
                    <>
                      <span className="text-ink-500 text-xs">¿Seguro?</span>
                      <button className="btn-danger-ghost" onClick={() => handleEliminarDefinitivo(lote.id)}>
                        Sí, borrar
                      </button>
                      <button className="text-ink-500 text-xs" onClick={() => setConfirmandoId(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="btn-danger-ghost" onClick={() => setConfirmandoId(lote.id)}>
                      Eliminar definitivamente
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}