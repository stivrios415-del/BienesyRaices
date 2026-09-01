import { useMemo, useState } from 'react'
import { useLotesStore } from '../store/useLotesStore'
import { ESTADO_COLOR, ESTADO_COLOR_BG, ESTADO_LABEL } from '../types/lote'
import type { EstadoLote, Lote } from '../types/lote'
import { formatMoneda } from '../utils/format'
import { exportarLotesExcel } from '../utils/exportarExcel'

interface Props {
  onSelect: (lote: Lote) => void
}

export default function TablaLotes({ onSelect }: Props) {
  const lotes = useLotesStore((s) => s.lotes)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoLote | 'todos'>('todos')
  const [precioMin, setPrecioMin] = useState('')
  const [precioMax, setPrecioMax] = useState('')

  const filtrados = useMemo(() => {
    return lotes.filter((l) => {
      const coincideBusqueda =
        busqueda.trim() === '' ||
        l.numero_lote.toLowerCase().includes(busqueda.toLowerCase()) ||
        (l.comprador ?? '').toLowerCase().includes(busqueda.toLowerCase())

      const coincideEstado = filtroEstado === 'todos' || l.estado === filtroEstado
      const coincideMin = precioMin === '' || l.precio_total >= Number(precioMin)
      const coincideMax = precioMax === '' || l.precio_total <= Number(precioMax)

      return coincideBusqueda && coincideEstado && coincideMin && coincideMax
    })
  }, [lotes, busqueda, filtroEstado, precioMin, precioMax])

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">Registro</div>
          <h1 className="font-display text-xl md:text-2xl text-ink-900">Todos los lotes</h1>
        </div>
        <button
          onClick={() => exportarLotesExcel(filtrados)}
          disabled={filtrados.length === 0}
          className="btn-secondary disabled:opacity-40"
        >
          ⬇ Exportar a Excel {filtrados.length > 0 && `(${filtrados.length})`}
        </button>
      </div>

      <div className="card p-3.5 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar por lote o comprador…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-field flex-1 min-w-[160px]"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoLote | 'todos')}
          className="input-field w-auto"
        >
          <option value="todos">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="en_proceso">En proceso</option>
          <option value="vendido">Vendido</option>
        </select>
        <input
          type="number"
          placeholder="Precio mín."
          value={precioMin}
          onChange={(e) => setPrecioMin(e.target.value)}
          className="input-field w-[45%] sm:w-32 font-mono"
        />
        <input
          type="number"
          placeholder="Precio máx."
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
          className="input-field w-[45%] sm:w-32 font-mono"
        />
      </div>

      {/* Tabla completa — solo en pantallas medianas en adelante */}
      <div className="hidden md:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-900 text-paper/80 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">N.º Lote</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Medidas</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Comprador</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Precio</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Saldo</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((lote) => (
              <tr
                key={lote.id}
                className="border-t border-paper-line hover:bg-brass-50/60 cursor-pointer transition-colors"
                onClick={() => onSelect(lote)}
              >
                <td className="px-4 py-3 font-mono font-semibold text-ink-900">{lote.numero_lote}</td>
                <td className="px-4 py-3 font-mono text-ink-700 tabular">
                  {lote.ancho} × {lote.largo} m
                </td>
                <td className="px-4 py-3">
                  <span
                    className="estado-badge"
                    style={{ background: ESTADO_COLOR_BG[lote.estado], color: ESTADO_COLOR[lote.estado] }}
                  >
                    {ESTADO_LABEL[lote.estado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-700">{lote.comprador ?? '—'}</td>
                <td className="px-4 py-3 font-mono tabular text-ink-900">{formatMoneda(lote.precio_total)}</td>
                <td className="px-4 py-3 font-mono tabular text-ink-700">{formatMoneda(lote.saldo_restante)}</td>
                <td className="px-4 py-3 text-brass-600 text-xs font-medium hover:underline">Ver detalle →</td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-500 text-sm">
                  No hay lotes que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas apilables — solo en móvil */}
      <div className="md:hidden space-y-2.5">
        {filtrados.map((lote) => (
          <button
            key={lote.id}
            onClick={() => onSelect(lote)}
            className="card w-full text-left px-4 py-3.5 active:bg-brass-50/60 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono font-semibold text-ink-900 text-[15px]">{lote.numero_lote}</p>
                <p className="text-xs text-ink-500 font-mono mt-0.5">
                  {lote.ancho} × {lote.largo} m
                </p>
              </div>
              <span
                className="estado-badge shrink-0"
                style={{ background: ESTADO_COLOR_BG[lote.estado], color: ESTADO_COLOR[lote.estado] }}
              >
                {ESTADO_LABEL[lote.estado]}
              </span>
            </div>
            <div className="flex items-end justify-between mt-3 pt-3 border-t border-paper-line">
              <div>
                <p className="text-[10px] text-ink-500 uppercase tracking-wide">Comprador</p>
                <p className="text-sm text-ink-700">{lote.comprador ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-ink-500 uppercase tracking-wide">Saldo</p>
                <p className="text-sm font-mono tabular text-ink-900">{formatMoneda(lote.saldo_restante)}</p>
              </div>
            </div>
          </button>
        ))}
        {filtrados.length === 0 && (
          <div className="card px-4 py-10 text-center text-ink-500 text-sm">
            No hay lotes que coincidan con los filtros.
          </div>
        )}
      </div>
    </div>
  )
}
