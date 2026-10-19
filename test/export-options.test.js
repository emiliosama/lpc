import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseExportArgs, selectInvoices, UsageError } from '../src/export-options.js'
import { listInvoices } from '../src/invoices.js'

const ids = (invoices) => invoices.map((invoice) => invoice.id)

const usageErrorCases = [
  ['--month 2026-13', ['--month', '2026-13', '--out', 'f.csv']],
  ['--month agosto', ['--month', 'agosto', '--out', 'f.csv']],
  ['--month 2026-8', ['--month', '2026-8', '--out', 'f.csv']],
  ['--month sin valor', ['--month', '--out', 'f.csv']],
  ['--month sin valor al final', ['--out', 'f.csv', '--month']],
  ['--month repetido', ['--month', '2026-08', '--month', '2026-09', '--out', 'f.csv']],
  ['--formato x', ['--formato', 'x', '--out', 'f.csv']],
  ['--out sin valor', ['--out']],
  ['--out seguido de otra opción', ['--out', '--month', '2026-08']],
  ['--out repetido', ['--out', 'a.csv', '--out', 'b.csv']],
  ['--include-void repetido', ['--include-void', '--include-void', '--out', 'f.csv']],
]

for (const [name, args] of usageErrorCases) {
  test(`C6: parseExportArgs lanza UsageError con ${name}`, () => {
    assert.throws(
      () => parseExportArgs(args),
      (err) => err instanceof UsageError && err.message.includes('export-csv'),
    )
  })
}

test('parseExportArgs sin argumentos devuelve los valores por defecto', () => {
  assert.deepEqual(parseExportArgs([]), { month: null, includeVoid: false, out: 'facturas.csv' })
})

test('parseExportArgs lee --month, --include-void y --out', () => {
  assert.deepEqual(
    parseExportArgs(['--month', '2026-08', '--include-void', '--out', 'a.csv']),
    { month: '2026-08', includeVoid: true, out: 'a.csv' },
  )
})

test('C2: selectInvoices sin mes saca las anuladas y mantiene el orden', () => {
  assert.deepEqual(
    ids(selectInvoices(listInvoices(), { month: null, includeVoid: false })),
    ['F-1001', 'F-1002', 'F-1004'],
  )
})

test('C3: selectInvoices con includeVoid trae las 4 facturas, F-1003 con estado void', () => {
  const selected = selectInvoices(listInvoices(), { month: null, includeVoid: true })
  assert.deepEqual(ids(selected), ['F-1001', 'F-1002', 'F-1003', 'F-1004'])
  assert.equal(selected.find((invoice) => invoice.id === 'F-1003').status, 'void')
})

test('C4: selectInvoices con --month 2026-09 trae F-1004 y agrega F-1003 con includeVoid', () => {
  assert.deepEqual(ids(selectInvoices(listInvoices(), { month: '2026-09', includeVoid: false })), ['F-1004'])
  assert.deepEqual(
    ids(selectInvoices(listInvoices(), { month: '2026-09', includeVoid: true })),
    ['F-1003', 'F-1004'],
  )
})

test('C5: selectInvoices con un mes sin facturas devuelve vacío', () => {
  assert.deepEqual(selectInvoices(listInvoices(), { month: '2026-12', includeVoid: false }), [])
})

test('selectInvoices devuelve un arreglo nuevo', () => {
  const invoices = listInvoices()
  assert.notEqual(selectInvoices(invoices, { month: null, includeVoid: true }), invoices)
})
