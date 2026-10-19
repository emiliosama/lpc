import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listInvoices } from '../src/invoices.js'
import { createServer } from '../src/server.js'

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
