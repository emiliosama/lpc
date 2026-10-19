import http from 'node:http'
import { pathToFileURL } from 'node:url'
import { sendJson } from './http-send.js'
import { listInvoices } from './invoices.js'
import { handlePage } from './routes/page.js'

function handleInvoices(req, res) {
  sendJson(res, 200, listInvoices())
}

const routes = {
  '/': handlePage,
  '/api/invoices': handleInvoices,
}

export function createServer() {
  return http.createServer((req, res) => {
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
  createServer().listen(3000, '127.0.0.1', () => {
    console.log('Panel de facturas: http://localhost:3000')
  })
}
