import { useEffect } from 'react'
import { useFacturacionStore } from '../store/useFacturacionStore'
import { formatMoneda, formatFecha } from '../utils/format'
import { exportarRecibosExcel } from '../utils/exportarExcel'

interface Props {
  onCerrar: () => void
}

export default function RecibosEmitidos({ onCerrar }: Props) {
  const recibos = useFacturacionStore((s) => s.recibos)
  const loadingRecibos = useFacturacionStore((s) => s.loadingRecibos)
  const fetchRecibos = useFacturacionStore((s) => s.fetchRecibos)

  useEffect(() => {
    fetchRecibos()
  }, [fetchRecibos])

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4 md:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">Bitácora</div>
          <h1 className="font-display text-xl md:text-2xl text-ink-900">Recibos emitidos</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportarRecibosExcel(recibos)}
            disabled={recibos.length === 0}
            className="btn-secondary disabled:opacity-40"
          >
            ⬇ Exportar
          </button>
          <button onClick={onCerrar} className="btn-secondary">
            ← Volver
          </button>
        </div>
      </div>

      {loadingRecibos ? (
        <p className="text-sm text-ink-500 font-mono">Cargando…</p>
      ) : recibos.length === 0 ? (
        <div className="card px-4 py-10 text-center text-ink-500 text-sm">
          Todavía no se ha emitido ningún recibo. Se registran solos aquí la primera vez que imprimes uno desde el
          detalle de un lote.
        </div>
      ) : (
        <>
          {/* Tabla — desktop */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-900 text-paper/80 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">No.</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">N.º Lote</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Comprador</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Monto</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Emitido</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Por</th>
                </tr>
              </thead>
              <tbody>
                {recibos.map((r) => (
                  <tr key={r.id} className="border-t border-paper-line">
                    <td className="px-4 py-3 font-mono font-semibold text-ink-900">
                      {String(r.correlativo).padStart(8, '0')}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-700">{r.numero_lote ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-700">{r.comprador ?? '—'}</td>
                    <td className="px-4 py-3 font-mono tabular text-ink-900">{formatMoneda(r.monto)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">{formatFecha(r.fecha_emision)}</td>
                    <td className="px-4 py-3 text-xs text-ink-500">{r.emitido_por ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas — móvil */}
          <div className="md:hidden space-y-2.5">
            {recibos.map((r) => (
              <div key={r.id} className="card px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="font-mono font-semibold text-ink-900 text-[15px]">
                    No. {String(r.correlativo).padStart(8, '0')}
                  </p>
                  <p className="font-mono tabular text-ink-700 text-sm">{formatMoneda(r.monto)}</p>
                </div>
                <p className="text-xs text-ink-500 mt-1">
                  Lote {r.numero_lote ?? '—'} · {r.comprador ?? 'Sin comprador'}
                </p>
                <p className="text-[11px] text-ink-500 font-mono mt-1">
                  {formatFecha(r.fecha_emision)} · {r.emitido_por ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}