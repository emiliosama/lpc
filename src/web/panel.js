const statusLabels = { paid: 'Pagada', open: 'Abierta', void: 'Anulada' }

export function statusLabel(status) {
  return Object.hasOwn(statusLabels, status) ? statusLabels[status] : status
}

export function formatDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : isoDate
}

export function totalAmount(invoices) {
  return invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
}

export function queryString({ status, month, by }) {
  const params = new URLSearchParams()
  const name = (by ?? '').trim()
  if (status) params.set('status', status)
  if (month) params.set('month', month)
  if (name) params.set('by', name)
  const query = params.toString()
  return query === '' ? '' : `?${query}`
}
