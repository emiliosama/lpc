import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getInvoice, listInvoices } from '../src/invoices.js'

test('listInvoices returns the fixture invoices', () => {
  const invoices = listInvoices()
  assert.equal(invoices.length, 4)
  assert.deepEqual(
    invoices.map((invoice) => invoice.id),
    ['F-1001', 'F-1002', 'F-1003', 'F-1004'],
  )
})

test('getInvoice returns a known invoice', () => {
  const invoice = getInvoice('F-1001')
  assert.equal(invoice.client, 'Constructora Sur')
  assert.equal(invoice.status, 'paid')
  assert.equal(invoice.amount, 1250000)
})

test('getInvoice returns null when missing', () => {
  assert.equal(getInvoice('F-9999'), null)
})

test('the listing still includes voided invoices', () => {
  const voided = getInvoice('F-1003')
  assert.equal(voided.status, 'void')
})
