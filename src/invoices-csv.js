const header = ['id', 'cliente', 'fecha', 'monto', 'estado']

function neutralizeFormula(value) {
  const text = String(value)
  return /^[=+\-@]/.test(text) ? `'${text}` : text
}

function escapeField(value) {
  const text = String(value)
  if (/[;"\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function toCsv(invoices) {
  const rows = invoices.map((invoice) => [
    neutralizeFormula(invoice.id),
    neutralizeFormula(invoice.client),
    invoice.issuedAt,
    String(invoice.amount),
    invoice.status,
  ])
  return [header, ...rows].map((row) => row.map(escapeField).join(';') + '\r\n').join('')
}
