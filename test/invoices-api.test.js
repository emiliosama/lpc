import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { filterInvoices, parseInvoiceQuery, QueryError } from '../src/invoice-query.js'
import { listInvoices } from '../src/invoices.js'
import { createServer } from '../src/server.js'

let server
let baseUrl

before(async () => {
  server = createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(() => new Promise((resolve) => server.close(resolve)))

async function getInvoices(query = '') {
  const res = await fetch(`${baseUrl}/api/invoices${query}`)
  assert.equal(res.status, 200)
  return (await res.json()).map((invoice) => invoice.id)
}

test('C15: GET /api/invoices responde 200, JSON y las 4 facturas de listInvoices()', async () => {
  const res = await fetch(`${baseUrl}/api/invoices`)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8')
  assert.deepEqual(await res.json(), listInvoices())
})

test('C16: ?status filtra por estado, en el mismo orden', async () => {
  assert.deepEqual(await getInvoices('?status=open'), ['F-1002', 'F-1004'])
  assert.deepEqual(await getInvoices('?status=paid'), ['F-1001'])
  assert.deepEqual(await getInvoices('?status=void'), ['F-1003'])
})

test('C17: ?month filtra por mes, se combina con status y un mes sin facturas da []', async () => {
  assert.deepEqual(await getInvoices('?month=2026-09'), ['F-1003', 'F-1004'])
  assert.deepEqual(await getInvoices('?status=open&month=2026-08'), ['F-1002'])
  assert.deepEqual(await getInvoices('?month=2026-12'), [])
})

test('C18: ?status=&month= vacíos trae lo mismo que sin filtros', async () => {
  const res = await fetch(`${baseUrl}/api/invoices?status=&month=`)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), listInvoices())
})

test('C19 (/api/invoices): status o month inválidos responden 400 con error no vacío', async () => {
  for (const query of ['?status=anulada', '?status=VOID', '?month=2026-13', '?month=agosto']) {
    const res = await fetch(`${baseUrl}/api/invoices${query}`)
    assert.equal(res.status, 400, query)
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8', query)
    const body = await res.json()
    assert.equal(typeof body.error, 'string', query)
    assert.notEqual(body.error.trim(), '', query)
  }
})

test('C26: una ruta desconocida responde 404', async () => {
  const res = await fetch(`${baseUrl}/no-existe`)
  assert.equal(res.status, 404)
  await res.body?.cancel()
})

test('parseInvoiceQuery: valores válidos, vacíos y ausentes', () => {
  assert.deepEqual(parseInvoiceQuery(new URLSearchParams('')), { status: null, month: null })
  assert.deepEqual(parseInvoiceQuery(new URLSearchParams('status=&month=')), { status: null, month: null })
  assert.deepEqual(parseInvoiceQuery(new URLSearchParams('status=void&month=2026-08')), {
    status: 'void',
    month: '2026-08',
  })
  assert.deepEqual(parseInvoiceQuery(new URLSearchParams('otro=1')), { status: null, month: null })
})

test('parseInvoiceQuery: los inválidos de C19 lanzan QueryError con mensaje', () => {
  for (const query of ['status=anulada', 'status=VOID', 'month=2026-13', 'month=agosto', 'month=2026-8']) {
    assert.throws(
      () => parseInvoiceQuery(new URLSearchParams(query)),
      (err) => err instanceof QueryError && err.message.trim() !== '',
      query,
    )
  }
})

test('filterInvoices: null no filtra, no saca anuladas por defecto y no muta la entrada', () => {
  const invoices = listInvoices()
  const ids = (rows) => rows.map((invoice) => invoice.id)
  const all = filterInvoices(invoices, { status: null, month: null })
  assert.deepEqual(ids(all), ['F-1001', 'F-1002', 'F-1003', 'F-1004'])
  assert.notEqual(all, invoices)
  assert.deepEqual(ids(filterInvoices(invoices, { status: 'void', month: null })), ['F-1003'])
  assert.deepEqual(ids(filterInvoices(invoices, { status: null, month: '2026-08' })), ['F-1001', 'F-1002'])
  assert.deepEqual(ids(filterInvoices(invoices, { status: 'open', month: '2026-09' })), ['F-1004'])
  assert.equal(invoices.length, 4)
})
