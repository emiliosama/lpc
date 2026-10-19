import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from '../src/server.js'

let server
let baseUrl

before(async () => {
  server = createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(() => new Promise((resolve) => server.close(resolve)))

const header = 'id;cliente;fecha;monto;estado\r\n'

async function getCsv(query = '') {
  const res = await fetch(`${baseUrl}/api/export.csv${query}`)
  const body = Buffer.from(await res.arrayBuffer())
  return { res, body, text: body.subarray(3).toString('utf8') }
}

function ids(text) {
  return text
    .split('\r\n')
    .slice(1, -1)
    .map((line) => line.split(';')[0])
}

for (const query of ['?status=anulada', '?status=VOID', '?month=2026-13', '?month=agosto']) {
  test(`criterio 19: /api/export.csv${query} responde 400 con un error en JSON`, async () => {
    const res = await fetch(`${baseUrl}/api/export.csv${query}`)
    assert.equal(res.status, 400)
    assert.match(res.headers.get('content-type'), /^application\/json/)
    const { error } = await res.json()
    assert.equal(typeof error, 'string')
    assert.notEqual(error.trim(), '')
  })
}

test('criterio 20: /api/export.csv?month=2026-08 devuelve los bytes del criterio 1 como descarga', async () => {
  const { res, body } = await getCsv('?month=2026-08')
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('content-type'), 'text/csv; charset=utf-8')
  assert.equal(res.headers.get('content-disposition'), 'attachment; filename="facturas.csv"')
  const expected = Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from(
      header +
        'F-1001;Constructora Sur;2026-08-02;1250000;paid\r\n' +
        'F-1002;Servicios Andes;2026-08-15;890000;open\r\n',
      'utf8',
    ),
  ])
  assert.deepEqual(body, expected)
})

test('criterio 21: /api/export.csv sin filtros trae las 4 facturas, F-1003 con estado void', async () => {
  const { res, text } = await getCsv()
  assert.equal(res.status, 200)
  assert.deepEqual(ids(text), ['F-1001', 'F-1002', 'F-1003', 'F-1004'])
  assert.match(text, /\r\nF-1003;[^\r\n]*;void\r\n/)
})

test('criterio 21: /api/export.csv?status=void trae el encabezado y solo F-1003', async () => {
  const { res, text } = await getCsv('?status=void')
  assert.equal(res.status, 200)
  assert.ok(text.startsWith(header))
  assert.deepEqual(ids(text), ['F-1003'])
})

test('criterio 21: /api/export.csv?month=2026-12 trae solo el encabezado', async () => {
  const { res, text } = await getCsv('?month=2026-12')
  assert.equal(res.status, 200)
  assert.equal(text, header)
})
