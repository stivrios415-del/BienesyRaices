import { useEffect, useState } from 'react'
import { useLotesStore } from '../store/useLotesStore'
import { useAuthStore } from '../store/useAuthStore'
import { ESTADO_COLOR, ESTADO_COLOR_BG, ESTADO_LABEL, ESTADO_INICIAL } from '../types/lote'
import { formatMoneda, formatFecha } from '../utils/format'
import FormularioPago from './FormularioPago'

interface Props {
  loteId: string | null
  onClose: () => void
}

export default function LoteDetallePanel({ loteId, onClose }: Props) {
  const { session } = useAuthStore()
  const fetchPagos = useLotesStore((s) => s.fetchPagos)
  const pagosPorLote = useLotesStore((s) => s.pagosPorLote)

  // Se lee el lote SIEMPRE desde el store (no desde una prop "congelada"),
  // así que cuando registrarPago() actualiza el store, este componente
  // se re-renderiza solo con el saldo/plazos/estado nuevos — en tiempo real.
  const lote = useLotesStore((s) => s.lotes.find((l) => l.id === loteId) ?? null)

  const [mostrarFormPago, setMostrarFormPago] = useState(false)
  const [mensajeExito, setMensajeExito] = useState(false)

  // Depende de loteId (no del objeto lote), para no resetear el formulario
  // cada vez que el store se actualiza tras un pago.
  useEffect(() => {
    if (loteId) {
      fetchPagos(loteId)
      setMostrarFormPago(false)
      setMensajeExito(false)
    }
  }, [loteId, fetchPagos])

  if (!lote) return null

  const pagos = pagosPorLote[lote.id] ?? []
  const plazosPagados = lote.plazos_pagados ?? 0
  const progreso = lote.plazos_totales > 0 ? Math.min(100, Math.round((plazosPagados / lote.plazos_totales) * 100)) : 0

  return (
    <>
      <div className="fixed inset-0 bg-ink-950/50 z-30 md:hidden" onClick={onClose} />

      <aside className="fixed inset-y-0 right-0 z-40 w-full md:w-[440px] bg-paper shadow-2xl overflow-y-auto border-l border-paper-line">
        <div className="sticky top-0 bg-paper/95 backdrop-blur border-b border-paper-line px-6 pt-6 pb-5 survey-corners">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow mb-1.5">Parcela N.º</div>
              <h2 className="font-display text-[32px] leading-none text-ink-900 tracking-tight">
                {lote.numero_lote}
              </h2>
              <p className="text-ink-500 text-sm mt-2 font-mono tabular">
                {lote.ancho} × {lote.largo} m &nbsp;·&nbsp; {lote.area} m²
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="text-ink-300 hover:text-ink-700 text-2xl leading-none transition-colors -mt-1"
            >
              ×
            </button>
          </div>

          <div className="absolute top-5 right-14 hidden sm:flex">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-seal -rotate-6"
              style={{ borderColor: ESTADO_COLOR[lote.estado], background: ESTADO_COLOR_BG[lote.estado] }}
            >
              <span className="font-display text-lg" style={{ color: ESTADO_COLOR[lote.estado] }}>
                {ESTADO_INICIAL[lote.estado]}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <span className="estado-badge" style={{ background: ESTADO_COLOR_BG[lote.estado], color: ESTADO_COLOR[lote.estado] }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ESTADO_COLOR[lote.estado] }} />
            {ESTADO_LABEL[lote.estado]}
          </span>

          {lote.comprador && (
            <div className="card px-4 py-3.5">
              <div className="eyebrow mb-1">Comprador</div>
              <p className="font-display text-lg text-ink-900">{lote.comprador}</p>
              <p className="text-xs text-ink-500 mt-1.5 font-mono">Compra: {formatFecha(lote.fecha_compra)}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">Avance de pago</span>
              <span className="text-xs font-mono text-ink-500 tabular">{progreso}%</span>
            </div>
            <div className="h-1.5 bg-paper-dim rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progreso}%`, background: ESTADO_COLOR[lote.estado] }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Dato label="Precio total" valor={formatMoneda(lote.precio_total)} />
            <Dato label="Cuota mensual" valor={formatMoneda(lote.cuota_mensual)} />
            <Dato label="Plazos" valor={`${plazosPagados} / ${lote.plazos_totales}`} />
            <Dato label="Saldo restante" valor={formatMoneda(lote.saldo_restante)} destacado />
          </div>

          <div className="perforated pt-6">
            {session ? (
              !mostrarFormPago ? (
                <button onClick={() => setMostrarFormPago(true)} className="btn-primary w-full">
                  Registrar pago
                </button>
              ) : (
                <div className="card p-4">
                  <FormularioPago
                    lote={lote}
                    onCancel={() => setMostrarFormPago(false)}
                    onSuccess={() => {
                      setMostrarFormPago(false)
                      setMensajeExito(true)
                      setTimeout(() => setMensajeExito(false), 3000)
                    }}
                  />
                </div>
              )
            ) : (
              <p className="text-xs text-ink-500 italic">Inicia sesión como administrador para registrar pagos.</p>
            )}

            {mensajeExito && (
              <div className="mt-3 bg-estado-disponibleBg text-estado-disponible text-sm rounded-[4px] px-3 py-2.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-estado-disponible" />
                Pago registrado con éxito
              </div>
            )}
          </div>

          <div>
            <div className="eyebrow mb-3">Historial de pagos</div>
            {pagos.length === 0 ? (
              <p className="text-sm text-ink-500">Sin pagos registrados todavía.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-paper-line text-[11px] uppercase tracking-wide">
                    <th className="py-1.5 font-medium">Fecha</th>
                    <th className="py-1.5 font-medium">Monto</th>
                    <th className="py-1.5 font-medium">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => (
                    <tr key={p.id} className="border-b border-paper-line/70 last:border-0">
                      <td className="py-2 font-mono text-xs text-ink-700">{formatFecha(p.fecha_pago)}</td>
                      <td className="py-2 font-mono text-xs tabular text-ink-900">{formatMoneda(p.monto)}</td>
                      <td className="py-2 capitalize text-ink-700">{p.metodo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

function Dato({ label, valor, destacado }: { label: string; valor: string; destacado?: boolean }) {
  return (
    <div className="card px-3.5 py-3">
      <p className="text-[11px] text-ink-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-mono tabular font-semibold ${destacado ? 'text-brass-600 text-base' : 'text-ink-900 text-[15px]'}`}>
        {valor}
      </p>
    </div>
  )
}
