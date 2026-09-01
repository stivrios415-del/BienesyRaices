import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFacturacionStore } from '../store/useFacturacionStore'

const schema = z.object({
  razon_social: z.string().min(1, 'Requerido'),
  rtn: z.string().min(1, 'Requerido'),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  cai: z.string().min(1, 'Requerido'),
  rango_autorizado_inicio: z.string().min(1, 'Requerido'),
  rango_autorizado_fin: z.string().min(1, 'Requerido'),
  fecha_limite_emision: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onCerrar: () => void
}

export default function ConfiguracionFacturacion({ onCerrar }: Props) {
  const config = useFacturacionStore((s) => s.config)
  const loading = useFacturacionStore((s) => s.loading)
  const fetchConfig = useFacturacionStore((s) => s.fetchConfig)
  const actualizarConfig = useFacturacionStore((s) => s.actualizarConfig)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (config) {
      reset({
        razon_social: config.razon_social,
        rtn: config.rtn,
        direccion: config.direccion,
        telefono: config.telefono,
        cai: config.cai,
        rango_autorizado_inicio: config.rango_autorizado_inicio,
        rango_autorizado_fin: config.rango_autorizado_fin,
        fecha_limite_emision: config.fecha_limite_emision ?? '',
      })
    }
  }, [config, reset])

  const onSubmit = async (values: FormValues) => {
    setGuardando(true)
    setGuardado(false)
    const { error } = await actualizarConfig({
      ...values,
      fecha_limite_emision: values.fecha_limite_emision || null,
    })
    setGuardando(false)
    if (!error) {
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div className="eyebrow">Facturación</div>
        <button onClick={onCerrar} className="btn-secondary">
          ← Volver
        </button>
      </div>
      <h1 className="font-display text-xl md:text-2xl text-ink-900 mb-2">Datos para los recibos con CAI</h1>
      <p className="text-sm text-ink-500 mb-6">
        Estos datos aparecen en el encabezado de cada recibo en PDF. El correlativo de recibo se asigna solo, en
        orden, la primera vez que imprimes cada pago.
      </p>

      <div className="card p-4 md:p-6">
        {loading ? (
          <p className="text-sm text-ink-500 font-mono">Cargando…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label-field">Razón social</label>
              <input {...register('razon_social')} className="input-field" placeholder="Bienes Raíces S. de R.L." />
              {errors.razon_social && <p className="text-estado-vendido text-xs mt-1">{errors.razon_social.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="label-field">RTN</label>
                <input {...register('rtn')} className="input-field font-mono" placeholder="0801-1990-123456" />
                {errors.rtn && <p className="text-estado-vendido text-xs mt-1">{errors.rtn.message}</p>}
              </div>
              <div>
                <label className="label-field">Teléfono</label>
                <input {...register('telefono')} className="input-field font-mono" />
              </div>
            </div>

            <div>
              <label className="label-field">Dirección</label>
              <input {...register('direccion')} className="input-field" />
            </div>

            <div className="perforated pt-5">
              <div className="eyebrow mb-3">Datos del CAI</div>
              <div>
                <label className="label-field">CAI</label>
                <input {...register('cai')} className="input-field font-mono" placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX" />
                {errors.cai && <p className="text-estado-vendido text-xs mt-1">{errors.cai.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4">
                <div>
                  <label className="label-field">Rango autorizado — desde</label>
                  <input
                    {...register('rango_autorizado_inicio')}
                    className="input-field font-mono"
                    placeholder="000-001-01-00000001"
                  />
                  {errors.rango_autorizado_inicio && (
                    <p className="text-estado-vendido text-xs mt-1">{errors.rango_autorizado_inicio.message}</p>
                  )}
                </div>
                <div>
                  <label className="label-field">Rango autorizado — hasta</label>
                  <input
                    {...register('rango_autorizado_fin')}
                    className="input-field font-mono"
                    placeholder="000-001-01-00050000"
                  />
                  {errors.rango_autorizado_fin && (
                    <p className="text-estado-vendido text-xs mt-1">{errors.rango_autorizado_fin.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="label-field">Fecha límite de emisión</label>
                <input type="date" {...register('fecha_limite_emision')} className="input-field font-mono w-auto" />
              </div>
            </div>

            {config && config.correlativo_actual > 0 && (
              <p className="text-xs text-ink-500 font-mono pt-1">
                Van {config.correlativo_actual} recibo{config.correlativo_actual === 1 ? '' : 's'} emitido
                {config.correlativo_actual === 1 ? '' : 's'} con este rango.
              </p>
            )}

            {guardado && (
              <div className="bg-estado-disponibleBg text-estado-disponible text-sm rounded-[4px] px-3 py-2.5">
                Datos guardados ✓
              </div>
            )}

            <button type="submit" disabled={guardando} className="btn-primary w-full">
              {guardando ? 'Guardando…' : 'Guardar datos de facturación'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}