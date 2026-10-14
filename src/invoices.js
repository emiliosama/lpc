import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dataPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'invoices.json')

export function listInvoices() {
  return JSON.parse(readFileSync(dataPath, 'utf8'))
}

export function getInvoice(id) {
  return listInvoices().find((invoice) => invoice.id === id) ?? null
}
