import { writeFileSync } from 'node:fs'
import { parseExportArgs, selectInvoices, UsageError } from './export-options.js'
import { getInvoice, listInvoices } from './invoices.js'
import { toCsv } from './invoices-csv.js'

function printInvoice(invoice) {
  console.log(
    [invoice.id, invoice.client, invoice.issuedAt, invoice.amount, invoice.status].join('\t'),
  )
}

const [, , command, arg] = process.argv

if (command === 'list') {
  for (const invoice of listInvoices()) {
    printInvoice(invoice)
  }
  process.exit(0)
}

if (command === 'get') {
  if (!arg) {
    console.error('usage: node src/cli.js get <id>')
    process.exit(1)
  }
  const invoice = getInvoice(arg)
  if (!invoice) {
    console.error(`not found: ${arg}`)
    process.exit(1)
  }
  printInvoice(invoice)
  process.exit(0)
}

if (command === 'export-csv') {
  let opts
  try {
    opts = parseExportArgs(process.argv.slice(3))
  } catch (err) {
    if (!(err instanceof UsageError)) throw err
    console.error(err.message)
    process.exit(1)
  }
  const rows = selectInvoices(listInvoices(), opts)
  try {
    writeFileSync(opts.out, '﻿' + toCsv(rows))
  } catch (err) {
    console.error(`no se pudo escribir ${opts.out}: ${err.code}`)
    process.exit(1)
  }
  console.log(`Facturas exportadas: ${rows.length} -> ${opts.out}`)
  process.exit(0)
}

console.error('usage: node src/cli.js <list|get|export-csv> [args]')
process.exit(1)
