export function formatMoneda(valor: number): string {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    maximumFractionDigits: 2,
  }).format(valor)
}

export function formatFecha(fecha: string | null): string {
  if (!fecha) return '—'
  return new Intl.DateTimeFormat('es-HN', { dateStyle: 'medium' }).format(new Date(fecha))
}
