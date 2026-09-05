import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLotesStore } from '../store/useLotesStore'
import { ESTADO_COLOR } from '../types/lote'
import type { PagoConLote } from '../types/lote'
import { formatMoneda } from '../utils/format'

interface Props {
  onCerrar: () => void
}

function claveMes(fechaISO: string) {
  return fechaISO.slice(0, 7) // "YYYY-MM"
}

function etiquetaMes(clave: string) {
  const [anio, mes] = clave.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, 1)
  const texto = fecha.toLocaleDateString('es-HN', { month: 'short', year: '2-digit' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export default function ReportesFinancieros({ onCerrar }: Props) {
  const lotes = useLotesStore((s) => s.lotes)
  const fetchTodosPagosParaExportar = useLotesStore((s) => s.fetchTodosPagosParaExportar)
  const [pagos, setPagos] = useState<PagoConLote[]>([])
  const [cargandoPagos, setCargandoPagos] = useState(true)

  useEffect(() => {
    fetchTodosPagosParaExportar()
      .then(setPagos)
      .finally(() => setCargandoPagos(false))
  }, [fetchTodosPagosParaExportar])

  const kpis = useMemo(() => {
    const disponibles = lotes.filter((l) => l.estado === 'disponible')
    const enProceso = lotes.filter((l) => l.estado === 'en_proceso')
    const vendidos = lotes.filter((l) => l.estado === 'vendido')

    const valorTotal = lotes.reduce((s, l) => s + l.precio_total, 0)
    const valorDisponible = disponibles.reduce((s, l) => s + l.precio_total, 0)
    const valorEnProceso = enProceso.reduce((s, l) => s + l.precio_total, 0)
    const valorVendido = vendidos.reduce((s, l) => s + l.precio_total, 0)

    const totalCobrado = lotes.reduce((s, l) => s + (l.precio_total - l.saldo_restante), 0)
    const totalPendiente = lotes.reduce((s, l) => s + l.saldo_restante, 0)
    const flujoEstimadoMensual = enProceso.reduce((s, l) => s + l.cuota_mensual, 0)
    const porcentajeCobranza = valorTotal > 0 ? Math.round((totalCobrado / valorTotal) * 100) : 0

    return {
      disponibles: disponibles.length,
      enProceso: enProceso.length,
      vendidos: vendidos.length,
      valorTotal,
      valorDisponible,
      valorEnProceso,
      valorVendido,
      totalCobrado,
      totalPendiente,
      flujoEstimadoMensual,
      porcentajeCobranza,
    }
  }, [lotes])

  const datosPorMes = useMemo(() => {
    const mapa = new Map<string, number>()
    pagos.forEach((p) => {
      const clave = claveMes(p.fecha_pago)
      mapa.set(clave, (mapa.get(clave) ?? 0) + p.monto)
    })
    return Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([clave, total]) => ({ mes: etiquetaMes(clave), total }))
  }, [pagos])

  const porProyecto = useMemo(() => {
    const mapa = new Map<
      string,
      { disponible: number; enProceso: number; vendido: number; valorTotal: number; cobrado: number; pendiente: number }
    >()
    lotes.forEach((l) => {
      const clave = l.proyecto?.trim() || 'Sin terreno asignado'
      if (!mapa.has(clave)) {
        mapa.set(clave, { disponible: 0, enProceso: 0, vendido: 0, valorTotal: 0, cobrado: 0, pendiente: 0 })
      }
      const g = mapa.get(clave)!
      if (l.estado === 'disponible') g.disponible += 1
      if (l.estado === 'en_proceso') g.enProceso += 1
      if (l.estado === 'vendido') g.vendido += 1
      g.valorTotal += l.precio_total
      g.cobrado += l.precio_total - l.saldo_restante
      g.pendiente += l.saldo_restante
    })
    return Array.from(mapa.entries()).map(([nombre, datos]) => ({ nombre, ...datos }))
  }, [lotes])

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow mb-1">Reportes</div>
          <h1 className="font-display text-xl md:text-2xl text-ink-900">Panel financiero</h1>
        </div>
        <button onClick={onCerrar} className="btn-secondary">
          ← Volver
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Valor del inventario" valor={formatMoneda(kpis.valorTotal)} />
        <Kpi label="Total cobrado" valor={formatMoneda(kpis.totalCobrado)} destacado />
        <Kpi label="Por cobrar" valor={formatMoneda(kpis.totalPendiente)} />
        <Kpi label="% de cobranza" valor={`${kpis.porcentajeCobranza}%`} />
      </div>

      {/* Desglose por estado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TarjetaEstado
          color={ESTADO_COLOR.disponible}
          titulo="Disponible"
          cantidad={kpis.disponibles}
          valor={kpis.valorDisponible}
        />
        <TarjetaEstado
          color={ESTADO_COLOR.en_proceso}
          titulo="En proceso"
          cantidad={kpis.enProceso}
          valor={kpis.valorEnProceso}
        />
        <TarjetaEstado color={ESTADO_COLOR.vendido} titulo="Vendido" cantidad={kpis.vendidos} valor={kpis.valorVendido} />
      </div>

      {/* Flujo de caja estimado */}
      <div className="card px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="eyebrow mb-1">Flujo de caja — estimado</p>
          <p className="text-sm text-ink-500">
            Suma de la cuota mensual de todos los lotes "en proceso". Es un estimado: asume que cada quien paga su
            cuota completa este mes.
          </p>
        </div>
        <p className="font-mono tabular text-2xl font-semibold text-brass-600 shrink-0">
          {formatMoneda(kpis.flujoEstimadoMensual)}
          <span className="text-xs text-ink-500 font-sans font-normal"> / mes</span>
        </p>
      </div>

      {/* Cobros por mes */}
      <div className="card p-4 md:p-5">
        <div className="eyebrow mb-3">Cobros por mes</div>
        {cargandoPagos ? (
          <p className="text-sm text-ink-500 font-mono py-10 text-center">Cargando…</p>
        ) : datosPorMes.length === 0 ? (
          <p className="text-sm text-ink-500 py-10 text-center">Todavía no hay pagos registrados.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={datosPorMes} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DAD3BC" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#5A6B85', fontFamily: 'Inter' }} axisLine={{ stroke: '#DAD3BC' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#5A6B85', fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatMoneda(value), 'Cobrado']}
                contentStyle={{ borderRadius: 4, borderColor: '#DAD3BC', fontFamily: 'Inter', fontSize: 13 }}
                labelStyle={{ color: '#131C2E', fontWeight: 600 }}
                cursor={{ fill: '#F2EFE6' }}
              />
              <Bar dataKey="total" fill="#A8823D" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Desglose por terreno / proyecto */}
      <div className="card overflow-x-auto">
        <div className="eyebrow px-4 md:px-5 pt-4 md:pt-5">Por terreno / proyecto</div>
        <table className="w-full text-sm mt-3">
          <thead className="bg-ink-900 text-paper/80 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Terreno</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Disp.</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Proceso</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Vendido</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Valor total</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Cobrado</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide">Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {porProyecto.map((p) => (
              <tr key={p.nombre} className="border-t border-paper-line">
                <td className="px-4 py-3 font-medium text-ink-900">{p.nombre}</td>
                <td className="px-4 py-3 font-mono tabular text-ink-700">{p.disponible}</td>
                <td className="px-4 py-3 font-mono tabular text-ink-700">{p.enProceso}</td>
                <td className="px-4 py-3 font-mono tabular text-ink-700">{p.vendido}</td>
                <td className="px-4 py-3 font-mono tabular text-ink-900">{formatMoneda(p.valorTotal)}</td>
                <td className="px-4 py-3 font-mono tabular text-estado-disponible">{formatMoneda(p.cobrado)}</td>
                <td className="px-4 py-3 font-mono tabular text-ink-700">{formatMoneda(p.pendiente)}</td>
              </tr>
            ))}
            {porProyecto.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-500 text-sm">
                  Todavía no hay lotes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({ label, valor, destacado }: { label: string; valor: string; destacado?: boolean }) {
  return (
    <div className="card px-3.5 py-3.5">
      <p className="text-[11px] text-ink-500 uppercase tracking-wide mb-1.5">{label}</p>
      <p className={`font-mono tabular font-semibold ${destacado ? 'text-brass-600 text-lg' : 'text-ink-900 text-base'}`}>
        {valor}
      </p>
    </div>
  )
}

function TarjetaEstado({
  color,
  titulo,
  cantidad,
  valor,
}: {
  color: string
  titulo: string
  cantidad: number
  valor: number
}) {
  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-sm font-medium text-ink-700">{titulo}</span>
        <span className="ml-auto font-mono text-xs text-ink-500 tabular">{cantidad} lote{cantidad === 1 ? '' : 's'}</span>
      </div>
      <p className="font-mono tabular text-lg font-semibold text-ink-900">{formatMoneda(valor)}</p>
    </div>
  )
}