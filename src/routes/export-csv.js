import { listInvoices } from '../invoices.js'
import { toCsv } from '../invoices-csv.js'
import { filterInvoices, parseInvoiceQuery, QueryError } from '../invoice-query.js'
import { sendJson } from '../http-send.js'

export function handleExportCsv(req, res, url) {
  let query
  try {
    query = parseInvoiceQuery(url.searchParams)
  } catch (err) {
    if (err instanceof QueryError) {
      sendJson(res, 400, { error: err.message })
      return
    }
    throw err
  }
  const rows = filterInvoices(listInvoices(), query)
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="facturas.csv"',
  })
  res.end('\uFEFF' + toCsv(rows))
}
