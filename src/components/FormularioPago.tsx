import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLotesStore } from '../store/useLotesStore'
import type { Lote, MetodoPago } from '../types/lote'

const schema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  fecha_pago: z.string().min(1, 'La fecha es requerida'),
  metodo: z.enum(['efectivo', 'transferencia', 'tarjeta']),
  numero_recibo: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  lote: Lote
  onSuccess: () => void
  onCancel: () => void
}

export default function FormularioPago({ lote, onSuccess, onCancel }: Props) {
  const registrarPago = useLotesStore((s) => s.registrarPago)
  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha_pago: new Date().toISOString().slice(0, 10),
      metodo: 'efectivo',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setEnviando(true)
    setErrorGeneral(null)
    const { error } = await registrarPago({
      lote_id: lote.id,
      monto: values.monto,
      fecha_pago: values.fecha_pago,
      metodo: values.metodo as MetodoPago,
      numero_recibo: values.numero_recibo || null,
    })
    setEnviando(false)
    if (error) {
      setErrorGeneral(error)
      return
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="eyebrow">Nuevo pago</div>
      <div>
        <label className="label-field">Monto pagado</label>
        <input
          type="number"
          step="0.01"
          {...register('monto')}
          className="input-field font-mono tabular"
          placeholder={`Saldo restante: ${lote.saldo_restante}`}
        />
        {errors.monto && <p className="text-estado-vendido text-xs mt-1">{errors.monto.message}</p>}
      </div>

      <div>
        <label className="label-field">Fecha de pago</label>
        <input type="date" {...register('fecha_pago')} className="input-field font-mono" />
        {errors.fecha_pago && <p className="text-estado-vendido text-xs mt-1">{errors.fecha_pago.message}</p>}
      </div>

      <div>
        <label className="label-field">Método de pago</label>
        <select {...register('metodo')} className="input-field">
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
      </div>

      <div>
        <label className="label-field">N.º de recibo (opcional)</label>
        <input type="text" {...register('numero_recibo')} className="input-field font-mono" />
      </div>

      {errorGeneral && <p className="text-estado-vendido text-sm">{errorGeneral}</p>}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="btn-primary flex-1">
          {enviando ? 'Guardando…' : 'Guardar pago'}
        </button>
      </div>
    </form>
  )
}