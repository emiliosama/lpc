import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toCsv } from '../src/invoices-csv.js'
import { getInvoice } from '../src/invoices.js'

test('toCsv writes the August invoices with CRLF and no BOM (C1)', () => {
  const csv = toCsv([getInvoice('F-1001'), getInvoice('F-1002')])
  assert.equal(
    csv,
    'id;cliente;fecha;monto;estado\r\n' +
      'F-1001;Constructora Sur;2026-08-02;1250000;paid\r\n' +
      'F-1002;Servicios Andes;2026-08-15;890000;open\r\n',
  )
  assert.equal(csv.startsWith('\uFEFF'), false)
})

test('toCsv quotes fields with ; or " and doubles inner quotes (C8)', () => {
  const csv = toCsv([
    { id: 'F-9', client: 'Comercial "El Sol"; Ltda', issuedAt: '2026-08-01', amount: 1000, status: 'open' },
  ])
  assert.equal(
    csv,
    'id;cliente;fecha;monto;estado\r\nF-9;"Comercial ""El Sol""; Ltda";2026-08-01;1000;open\r\n',
  )
})

test('toCsv returns only the header for an empty list (C5)', () => {
  assert.equal(toCsv([]), 'id;cliente;fecha;monto;estado\r\n')
})

test('toCsv quotes fields with a line break', () => {
  const csv = toCsv([
    { id: 'F-9', client: 'Linea1\nLinea2', issuedAt: '2026-08-01', amount: 1000, status: 'open' },
    { id: 'F-10', client: 'A\rB', issuedAt: '2026-08-01', amount: 1000, status: 'open' },
  ])
  assert.equal(
    csv,
    'id;cliente;fecha;monto;estado\r\n' +
      'F-9;"Linea1\nLinea2";2026-08-01;1000;open\r\n' +
      'F-10;"A\rB";2026-08-01;1000;open\r\n',
  )
})

test('toCsv doubles quotes in a field made only of quotes', () => {
  const csv = toCsv([{ id: 'F-9', client: '""', issuedAt: '2026-08-01', amount: 1000, status: 'open' }])
  assert.equal(csv, 'id;cliente;fecha;monto;estado\r\nF-9;"""""";2026-08-01;1000;open\r\n')
})

test('toCsv prefixes id and cliente that look like formulas with an apostrophe (C11)', () => {
  const csv = toCsv([
    { id: 'F-9', client: '=HYPERLINK("http://x")', issuedAt: '2026-08-01', amount: 1000, status: 'open' },
    { id: '+F-8', client: '@Sur', issuedAt: '2026-08-01', amount: -500, status: 'open' },
  ])
  assert.equal(
    csv,
    'id;cliente;fecha;monto;estado\r\n' +
      'F-9;"\'=HYPERLINK(""http://x"")";2026-08-01;1000;open\r\n' +
      "'+F-8;'@Sur;2026-08-01;-500;open\r\n",
  )
})

test('toCsv prefixes a client that starts with a minus sign (C11)', () => {
  const csv = toCsv([{ id: 'F-7', client: '-Sur', issuedAt: '2026-08-01', amount: 1000, status: 'open' }])
  assert.equal(csv, "id;cliente;fecha;monto;estado\r\nF-7;'-Sur;2026-08-01;1000;open\r\n")
})
