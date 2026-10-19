import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { downloadLogLine } from '../src/download-log.js'
import { createServer } from '../src/server.js'
import { queryString } from '../src/web/panel.js'

const BOM = Buffer.from([0xef, 0xbb, 0xbf])
const august =
  'id;cliente;fecha;monto;estado\r\n' +
  'F-1001;Constructora Sur;2026-08-02;1250000;paid\r\n' +
  'F-1002;Servicios Andes;2026-08-15;890000;open\r\n'

let server
let base
let lines

before(async () => {
  server = createServer({ log: (line) => lines.push(line) })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

beforeEach(() => {
  lines = []
})

after(() => new Promise((resolve) => server.close(resolve)))

function endsWithIsoDate(line) {
  const date = line.split(' · ').at(-1)
  return new Date(date).toISOString() === date
}

test('C28: by no cambia los bytes y registra una línea con nombre y filtros', async () => {
  const res = await fetch(`${base}/api/export.csv?month=2026-08&by=${encodeURIComponent('María')}`)
  assert.equal(res.status, 200)
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), Buffer.concat([BOM, Buffer.from(august)]))
  assert.equal(lines.length, 1)
  assert.ok(lines[0].startsWith('Descarga CSV: María · month=2026-08 · '), lines[0])
  assert.ok(endsWithIsoDate(lines[0]), lines[0])
})

test('C29: sin by ni filtros registra (sin nombre) y sin filtros', async () => {
  const res = await fetch(`${base}/api/export.csv`)
  await res.arrayBuffer()
  assert.equal(lines.length, 1)
  assert.ok(lines[0].startsWith('Descarga CSV: (sin nombre) · sin filtros · '), lines[0])
})

test('C29: un 400 en la descarga y /api/invoices no registran nada', async () => {
  const bad = await fetch(`${base}/api/export.csv?status=anulada&by=Ana`)
  assert.equal(bad.status, 400)
  await bad.arrayBuffer()
  const list = await fetch(`${base}/api/invoices?by=Ana`)
  await list.arrayBuffer()
  assert.deepEqual(lines, [])
})

test('C30: downloadLogLine limpia caracteres de control y espacios', () => {
  assert.equal(
    downloadLogLine(
      { by: '  Ana\n\u001b[31mX  ', status: 'open', month: '2026-08' },
      new Date('2026-10-19T12:00:00Z'),
    ),
    'Descarga CSV: Ana[31mX · status=open month=2026-08 · 2026-10-19T12:00:00.000Z',
  )
})

test('C30: downloadLogLine corta el nombre en 80 caracteres', () => {
  const line = downloadLogLine({ by: 'a'.repeat(100), status: null, month: null }, new Date(0))
  assert.equal(line, `Descarga CSV: ${'a'.repeat(80)} · sin filtros · 1970-01-01T00:00:00.000Z`)
})

test('C31: queryString agrega by al final, sin espacios, solo si no queda vacío', () => {
  assert.equal(queryString({ status: 'open', month: '', by: ' Ana ' }), '?status=open&by=Ana')
  assert.equal(queryString({ status: '', month: '', by: '   ' }), '')
})

test('C31: la página trae el campo Tu nombre', async () => {
  const html = await (await fetch(`${base}/`)).text()
  assert.match(html, /id="by"/)
  assert.match(html, /Tu nombre/)
})
