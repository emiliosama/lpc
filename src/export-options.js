const usage = 'usage: node src/cli.js export-csv [--month AAAA-MM] [--include-void] [--out <ruta>]'
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/

export class UsageError extends Error {
  constructor() {
    super(usage)
    this.name = 'UsageError'
  }
}

export function parseExportArgs(args) {
  const options = { month: null, includeVoid: false, out: 'facturas.csv' }
  const seen = new Set()

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg !== '--month' && arg !== '--include-void' && arg !== '--out') throw new UsageError()
    if (seen.has(arg)) throw new UsageError()
    seen.add(arg)

    if (arg === '--include-void') {
      options.includeVoid = true
      continue
    }

    const value = args[++i]
    if (value === undefined || value.startsWith('--')) throw new UsageError()
    if (arg === '--month') {
      if (!monthPattern.test(value)) throw new UsageError()
      options.month = value
    } else {
      options.out = value
    }
  }

  return options
}

export function selectInvoices(invoices, { month, includeVoid }) {
  return invoices.filter(
    (invoice) =>
      (includeVoid || invoice.status !== 'void') && (month == null || invoice.issuedAt.startsWith(month)),
  )
}
