const maxNameLength = 80

function cleanName(by) {
  const name = String(by ?? '')
    .replace(/\p{Cc}/gu, '')
    .trim()
    .slice(0, maxNameLength)
  return name === '' ? '(sin nombre)' : name
}

function describeFilters({ status, month }) {
  const parts = []
  if (status) parts.push(`status=${status}`)
  if (month) parts.push(`month=${month}`)
  return parts.length === 0 ? 'sin filtros' : parts.join(' ')
}

export function downloadLogLine({ by, status, month }, date) {
  return `Descarga CSV: ${cleanName(by)} · ${describeFilters({ status, month })} · ${date.toISOString()}`
}
