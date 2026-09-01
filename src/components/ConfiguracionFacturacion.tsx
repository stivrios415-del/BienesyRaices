import { useEffect } from 'react'
import { useFacturacionStore } from '../store/useFacturacionStore'
import { formatFecha } from '../utils/format'

interface Props {
  onCerrar: () => void
}

/**
 * Vista de SOLO LECTURA. Los datos de facturación (RTN, CAI, rango
 * autorizado) ya no se pueden editar desde la app — solo entrando
 * directamente a la tabla "config_facturacion" en Supabase. Esta
 * pantalla existe únicamente para que el administrador pueda verificar
 * qué datos está usando la app para imprimir los recibos.
 */
export default function ConfiguracionFacturacion({ onCerrar }: Props) {
  const config = useFacturacionStore((s) => s.config)
  const loading = useFacturacionStore((s) => s.loading)
  const fetchConfig = useFacturacionStore((s) => s.fetchConfig)

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div className="eyebrow">Facturación</div>
        <button onClick={onCerrar} className="btn-secondary">
          ← Volver
        </button>
      </div>
      <h1 className="font-display text-xl md:text-2xl text-ink-900 mb-2">Datos usados en los recibos con CAI</h1>
      <p className="text-sm text-ink-500 mb-6">
        Estos datos son de solo lectura aquí. Para cambiarlos, hazlo directamente en Supabase — tabla{' '}
        <code className="font-mono text-ink-700 bg-paper-dim px-1 rounded-[3px]">config_facturacion</code>.
      </p>

      <div className="card p-4 md:p-6">
        {loading ? (
          <p className="text-sm text-ink-500 font-mono">Cargando…</p>
        ) : !config ? (
          <p className="text-sm text-ink-500">No se pudo cargar la configuración.</p>
        ) : (
          <div className="space-y-4">
            <Dato label="Razón social" valor={config.razon_social || '—'} />
            <div className="grid grid-cols-2 gap-4">
              <Dato label="RTN" valor={config.rtn || '—'} mono />
              <Dato label="Teléfono" valor={config.telefono || '—'} mono />
            </div>
            <Dato label="Dirección" valor={config.direccion || '—'} />

            <div className="perforated pt-5">
              <div className="eyebrow mb-3">Datos del CAI</div>
              <Dato label="CAI" valor={config.cai || '—'} mono />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Dato label="Rango autorizado — desde" valor={config.rango_autorizado_inicio || '—'} mono />
                <Dato label="Rango autorizado — hasta" valor={config.rango_autorizado_fin || '—'} mono />
              </div>
              <div className="mt-4">
                <Dato
                  label="Fecha límite de emisión"
                  valor={config.fecha_limite_emision ? formatFecha(config.fecha_limite_emision) : '—'}
                  mono
                />
              </div>
            </div>

            <p className="text-xs text-ink-500 font-mono pt-1 border-t border-paper-line">
              Van {config.correlativo_actual} recibo{config.correlativo_actual === 1 ? '' : 's'} emitido
              {config.correlativo_actual === 1 ? '' : 's'} con este rango.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Dato({ label, valor, mono }: { label: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-ink-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm text-ink-900 ${mono ? 'font-mono' : ''}`}>{valor}</p>
    </div>
  )
}
