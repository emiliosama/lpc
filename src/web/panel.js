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
