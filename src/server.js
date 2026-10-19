import { createServer as createHttpServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { downloadLogLine } from './download-log.js'
import { sendJson } from './http-send.js'
import { filterInvoices, parseInvoiceQuery, QueryError } from './invoice-query.js'
import { listInvoices } from './invoices.js'
import { handleExportCsv } from './routes/export-csv.js'
import { handlePage, handlePanelJs } from './routes/page.js'

function handleInvoices(req, res, url) {
  let query
  try {
    query = parseInvoiceQuery(url.searchParams)
  } catch (err) {
    if (!(err instanceof QueryError)) throw err
    sendJson(res, 400, { error: err.message })
    return
  }
  sendJson(res, 200, filterInvoices(listInvoices(), query))
}

function exportWithLog(log) {
  return (req, res, url) => {
    handleExportCsv(req, res, url)
    if (res.statusCode !== 200) return
    const { searchParams } = url
    log(
      downloadLogLine(
        { by: searchParams.get('by'), status: searchParams.get('status'), month: searchParams.get('month') },
        new Date(),
      ),
    )
  }
}

export function createServer({ log = () => {} } = {}) {
  const routes = {
    '/': handlePage,
    '/panel.js': handlePanelJs,
    '/api/invoices': handleInvoices,
    '/api/export.csv': exportWithLog(log),
  }

  return createHttpServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const handler = req.method === 'GET' ? routes[url.pathname] : undefined
    if (!handler) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('not found')
      return
    }
    handler(req, res, url)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createServer({ log: console.log }).listen(3000, '127.0.0.1', () => {
    console.log('Panel de facturas: http://localhost:3000')
  })
}
