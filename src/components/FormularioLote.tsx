import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLotesStore } from '../store/useLotesStore'
import type { Lote } from '../types/lote'
import DibujarPoligono from './DibujarPoligono'

const schema = z.object({
  numero_lote: z.string().min(1, 'Requerido'),
  ancho: z.coerce.number().positive('Debe ser mayor a 0'),
  largo: z.coerce.number().positive('Debe ser mayor a 0'),
  precio_total: z.coerce.number().positive('Debe ser mayor a 0'),
  plazos_totales: z.coerce.number().int().positive('Debe ser mayor a 0'),
  comprador: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  loteExistente?: Lote | null
  onDone: () => void
  onCancel: () => void
}

export default function FormularioLote({ loteExistente, onDone, onCancel }: Props) {
  const crearLote = useLotesStore((s) => s.crearLote)
  const actualizarLote = useLotesStore((s) => s.actualizarLote)
  const [poligono, setPoligono] = useState(loteExistente?.coordenadas_poligono ?? [])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: loteExistente
      ? {
          numero_lote: loteExistente.numero_lote,
          ancho: loteExistente.ancho,
          largo: loteExistente.largo,
          precio_total: loteExistente.precio_total,
          plazos_totales: loteExistente.plazos_totales,
          comprador: loteExistente.comprador ?? '',
        }
      : undefined,
  })

  const onSubmit = async (values: FormValues) => {
    if (poligono.length < 3) {
      setError('Dibuja el polígono del lote (mínimo 3 puntos).')
      return
    }
    setEnviando(true)
    setError(null)

    const payload = {
      numero_lote: values.numero_lote,
      ancho: values.ancho,
      largo: values.largo,
      precio_total: values.precio_total,
      plazos_totales: values.plazos_totales,
      comprador: values.comprador || null,
      coordenadas_poligono: poligono,
    }

    const resultado = loteExistente
      ? await actualizarLote(loteExistente.id, payload)
      : await crearLote(payload)

    setEnviando(false)
    if (resultado.error) {
      setError(resultado.error)
      return
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label-field">Número de lote</label>
          <input {...register('numero_lote')} className="input-field font-mono" placeholder="LT-014" />
          {errors.numero_lote && <p className="text-estado-vendido text-xs mt-1">{errors.numero_lote.message}</p>}
        </div>
        <div>
          <label className="label-field">Ancho (m)</label>
          <input type="number" step="0.01" {...register('ancho')} className="input-field font-mono" />
          {errors.ancho && <p className="text-estado-vendido text-xs mt-1">{errors.ancho.message}</p>}
        </div>
        <div>
          <label className="label-field">Largo (m)</label>
          <input type="number" step="0.01" {...register('largo')} className="input-field font-mono" />
          {errors.largo && <p className="text-estado-vendido text-xs mt-1">{errors.largo.message}</p>}
        </div>
        <div>
          <label className="label-field">Precio total</label>
          <input type="number" step="0.01" {...register('precio_total')} className="input-field font-mono" />
          {errors.precio_total && <p className="text-estado-vendido text-xs mt-1">{errors.precio_total.message}</p>}
        </div>
        <div>
          <label className="label-field">Plazos (cuotas)</label>
          <input type="number" {...register('plazos_totales')} className="input-field font-mono" />
          {errors.plazos_totales && <p className="text-estado-vendido text-xs mt-1">{errors.plazos_totales.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="label-field">Comprador (opcional)</label>
          <input {...register('comprador')} className="input-field" />
        </div>
      </div>

      <div>
        <label className="label-field">Polígono del lote</label>
        <DibujarPoligono puntos={poligono} onChange={setPoligono} />
      </div>

      {error && <p className="text-estado-vendido text-sm">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="btn-primary flex-1">
          {enviando ? 'Guardando…' : loteExistente ? 'Guardar cambios' : 'Crear lote'}
        </button>
      </div>
    </form>
  )
}