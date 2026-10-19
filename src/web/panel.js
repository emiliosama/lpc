export function totalAmount(invoices) {
  return invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
}

export function queryString({ status, month }) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (month) params.set('month', month)
  const query = params.toString()
  return query === '' ? '' : `?${query}`
}
