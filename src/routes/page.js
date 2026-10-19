import { readFileSync } from 'node:fs'

const indexPath = new URL('../web/index.html', import.meta.url)

export function handlePage(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(readFileSync(indexPath))
}
