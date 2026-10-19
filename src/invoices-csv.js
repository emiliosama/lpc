const header = ['id', 'cliente', 'fecha', 'monto', 'estado']

function escapeField(value) {
  const text = String(value)
  if (/[;"\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function toCsv(invoices) {
  const rows = invoices.map((invoice) => [
    invoice.id,
    invoice.client,
    invoice.issuedAt,
    String(invoice.amount),
    invoice.status,
  ])
  return [header, ...rows].map((row) => row.map(escapeField).join(';') + '\r\n').join('')
}
