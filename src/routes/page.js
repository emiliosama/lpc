import { readFileSync } from 'node:fs'

const indexPath = new URL('../web/index.html', import.meta.url)
const panelPath = new URL('../web/panel.js', import.meta.url)

export function handlePage(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(readFileSync(indexPath))
}

export function handlePanelJs(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
  res.end(readFileSync(panelPath))
}
