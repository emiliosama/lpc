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

test('toCsv neutralizes formulas in id and cliente, not in monto (C11)', () => {
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
