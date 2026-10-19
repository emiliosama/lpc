const header = ['id', 'cliente', 'fecha', 'monto', 'estado']

function textField(value) {
  return value == null ? '' : String(value)
}

function neutralizeFormula(value) {
  const text = textField(value)
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

function amountField(value) {
  return textField(value).replace('.', ',')
}

function escapeField(text) {
  if (/[;"\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function toCsv(invoices) {
  const rows = invoices.map((invoice) => [
    neutralizeFormula(invoice.id),
    neutralizeFormula(invoice.client),
    textField(invoice.issuedAt),
    amountField(invoice.amount),
    textField(invoice.status),
  ])
  return [header, ...rows].map((row) => row.map(escapeField).join(';') + '\r\n').join('')
}
