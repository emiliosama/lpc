import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listInvoices } from '../src/invoices.js'
import { createServer } from '../src/server.js'
import { formatAmount, formatDate, queryString, statusLabel, totalAmount } from '../src/web/panel.js'

let server
let base

before(async () => {
  server = createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(() => new Promise((resolve) => server.close(resolve)))

test('C22: GET / sirve el HTML con la tabla de facturas', async () => {
  const res = await fetch(`${base}/`)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8')
  const html = await res.text()
  assert.match(html, /<table/)
  for (const column of ['id', 'cliente', 'fecha', 'monto', 'estado']) {
    assert.match(html, new RegExp(`<th>${column}</th>`))
  }
  assert.match(html, /<select id="status"/)
  for (const value of ['', 'paid', 'open', 'void']) {
    assert.match(html, new RegExp(`<option value="${value}"`))
  }
  assert.match(html, /<input id="month" type="month"/)
  assert.match(html, /id="total"/)
  assert.match(html, /id="download"/)
  assert.match(html, /Descargar CSV/)
})

test('C23: GET /panel.js sirve el módulo JS de la página', async () => {
  const res = await fetch(`${base}/panel.js`)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('content-type'), 'text/javascript; charset=utf-8')
  assert.match(await res.text(), /export function totalAmount/)
})

test('C24: totalAmount suma amount', () => {
  const [f1001, f1002] = listInvoices()
  assert.equal(totalAmount(listInvoices()), 4690000)
  assert.equal(totalAmount([f1001, f1002]), 2140000)
  assert.equal(totalAmount([]), 0)
})

test('C25: queryString arma la query solo con los filtros no vacíos', () => {
  assert.equal(queryString({ status: '', month: '' }), '')
  assert.equal(queryString({ status: 'open', month: '2026-08' }), '?status=open&month=2026-08')
  assert.equal(queryString({ status: '', month: '2026-08' }), '?month=2026-08')
  assert.equal(queryString({ status: 'void', month: '' }), '?status=void')
})

test('C15: GET /api/invoices devuelve las 4 facturas, anuladas incluidas', async () => {
  const res = await fetch(`${base}/api/invoices`)
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /^application\/json/)
  assert.deepEqual(await res.json(), listInvoices())
})

test('C26: una ruta desconocida responde 404', async () => {
  const res = await fetch(`${base}/no-existe`)
  assert.equal(res.status, 404)
  await res.arrayBuffer()
})

test('C32: statusLabel muestra los estados en español, como el filtro', () => {
  assert.equal(statusLabel('paid'), 'Pagada')
  assert.equal(statusLabel('open'), 'Abierta')
  assert.equal(statusLabel('void'), 'Anulada')
  assert.equal(statusLabel('VOID'), 'VOID')
})

test('C33: formatDate muestra la fecha como DD-MM-AAAA', () => {
  assert.equal(formatDate('2026-08-02'), '02-08-2026')
  assert.equal(formatDate('2026-8-2'), '2026-8-2')
  assert.equal(formatDate(''), '')
})

test('C34: formatAmount muestra el monto con $ y punto de miles', () => {
  assert.equal(formatAmount(1250000), '$1.250.000')
  assert.equal(formatAmount(890000), '$890.000')
  assert.equal(formatAmount(0), '$0')
  assert.equal(formatAmount(-500), '-$500')
  assert.equal(formatAmount(1250000.5), '$1.250.000,5')
})
