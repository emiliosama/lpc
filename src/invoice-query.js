const statuses = ['paid', 'open', 'void']
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/

export class QueryError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QueryError'
  }
}

export function parseInvoiceQuery(searchParams) {
  const status = searchParams.get('status') || null
  const month = searchParams.get('month') || null

  if (status !== null && !statuses.includes(status)) {
    throw new QueryError(`status inválido: ${status}. Usa paid, open o void.`)
  }
  if (month !== null && !monthPattern.test(month)) {
    throw new QueryError(`month inválido: ${month}. Usa AAAA-MM, con mes 01 a 12.`)
  }

  return { status, month }
}

export function filterInvoices(invoices, { status, month }) {
  return invoices.filter(
    (invoice) =>
      (status == null || invoice.status === status) && (month == null || invoice.issuedAt.startsWith(month)),
  )
}
