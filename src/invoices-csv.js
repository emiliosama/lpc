const header = ['id', 'cliente', 'fecha', 'monto', 'estado']

function textField(value) {
  const text = value == null ? '' : String(value)
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

function amountField(value) {
  return value == null ? '' : String(value).replace('.', ',')
}

function escapeField(text) {
  if (/[;"\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function toCsv(invoices) {
  if (!Array.isArray(invoices)) {
    throw new TypeError('toCsv espera un arreglo de facturas')
  }
  const rows = invoices.map((invoice) => [
    textField(invoice.id),
    textField(invoice.client),
    textField(invoice.issuedAt),
    amountField(invoice.amount),
    textField(invoice.status),
  ])
  return [header, ...rows].map((row) => row.map(escapeField).join(';') + '\r\n').join('')
}
