import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const cliPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'cli.js')
const BOM = Buffer.from([0xef, 0xbb, 0xbf])

function tmp() {
  return mkdtempSync(join(tmpdir(), 'lpc-'))
}

function run(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], { cwd, encoding: 'utf8' })
}

function exportCsv(args, cwd = tmp()) {
  return run(['export-csv', ...args], cwd)
}

function readCsv(path) {
  const bytes = readFileSync(path)
  assert.deepEqual(bytes.subarray(0, 3), BOM, 'el archivo empieza con BOM UTF-8')
  return bytes.subarray(3).toString('utf8')
}

function ids(csv) {
  return csv
    .split('\r\n')
    .slice(1)
    .filter((line) => line !== '')
    .map((line) => line.split(';')[0])
}

test('C1: --month 2026-08 escribe BOM, contenido exacto y resumen en stdout', () => {
  const out = join(tmp(), 'a.csv')
  const result = exportCsv(['--month', '2026-08', '--out', out])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(
    readCsv(out),
    'id;cliente;fecha;monto;estado\r\n' +
      'F-1001;Constructora Sur;2026-08-02;1250000;paid\r\n' +
      'F-1002;Servicios Andes;2026-08-15;890000;open\r\n',
  )
  assert.equal(result.stdout.trim(), `Facturas exportadas: 2 -> ${out}`)
})

test('C2: sin --month exporta todos los meses sin las anuladas', () => {
  const out = join(tmp(), 'b.csv')
  const result = exportCsv(['--out', out])
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(ids(readCsv(out)), ['F-1001', 'F-1002', 'F-1004'])
})

test('C3: --include-void trae las 4 facturas con F-1003 en estado void', () => {
  const out = join(tmp(), 'c.csv')
  const result = exportCsv(['--include-void', '--out', out])
  assert.equal(result.status, 0, result.stderr)
  const csv = readCsv(out)
  assert.deepEqual(ids(csv), ['F-1001', 'F-1002', 'F-1003', 'F-1004'])
  const f1003 = csv.split('\r\n').find((line) => line.startsWith('F-1003;'))
  assert.equal(f1003.split(';')[4], 'void')
})

test('C4: --month 2026-09 trae solo F-1004 y con --include-void agrega F-1003', () => {
  const dir = tmp()
  const out = join(dir, 'd.csv')
  let result = exportCsv(['--month', '2026-09', '--out', out], dir)
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(ids(readCsv(out)), ['F-1004'])

  result = exportCsv(['--month', '2026-09', '--include-void', '--out', out], dir)
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(ids(readCsv(out)), ['F-1003', 'F-1004'])
})

test('C5: un mes sin facturas escribe solo el encabezado y sale con 0', () => {
  const out = join(tmp(), 'e.csv')
  const result = exportCsv(['--month', '2026-12', '--out', out])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(readCsv(out), 'id;cliente;fecha;monto;estado\r\n')
  assert.equal(result.stdout.trim(), `Facturas exportadas: 0 -> ${out}`)
})

const invalidArgs = [
  ['--month', '2026-13'],
  ['--month', 'agosto'],
  ['--month', '2026-8'],
  ['--month'],
  ['--month', '2026-08', '--month', '2026-09'],
  ['--formato', 'x'],
  ['--month=2026-08'],
]

for (const bad of invalidArgs) {
  test(`C6: ${bad.join(' ')} termina con 1, uso en stderr y sin archivo`, () => {
    const dir = tmp()
    const out = join(dir, 'f.csv')
    const result = exportCsv(['--out', out, ...bad], dir)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /export-csv/)
    assert.equal(existsSync(out), false)
    assert.equal(existsSync(join(dir, 'facturas.csv')), false)
  })
}

test('C6: --out sin valor termina con 1, uso en stderr y sin archivo', () => {
  const dir = tmp()
  const result = exportCsv(['--out'], dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /export-csv/)
  assert.equal(existsSync(join(dir, 'facturas.csv')), false)
})

for (const blank of ['', '   ']) {
  test(`C6: --out ${JSON.stringify(blank)} termina con 1, uso en stderr y sin archivo`, () => {
    const dir = tmp()
    const result = exportCsv(['--out', blank], dir)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /export-csv/)
    assert.deepEqual(readdirSync(dir), [])
  })
}

test('C7: sin --out crea facturas.csv en el directorio actual', () => {
  const dir = tmp()
  const result = exportCsv([], dir)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), 'Facturas exportadas: 3 -> facturas.csv')
  assert.deepEqual(ids(readCsv(join(dir, 'facturas.csv'))), ['F-1001', 'F-1002', 'F-1004'])
})

test('C7: sin --out sobrescribe un facturas.csv previo', () => {
  const dir = tmp()
  writeFileSync(join(dir, 'facturas.csv'), 'contenido viejo')
  const result = exportCsv([], dir)
  assert.equal(result.status, 0, result.stderr)
  const csv = readCsv(join(dir, 'facturas.csv'))
  assert.ok(csv.startsWith('id;cliente;fecha;monto;estado\r\n'))
  assert.doesNotMatch(csv, /contenido viejo/)
})

test('C10: si no se puede escribir, sale con 1, nombra la ruta y no muestra stack', () => {
  const out = join(tmp(), 'no-existe', 'g.csv')
  const result = exportCsv(['--out', out])
  assert.equal(result.status, 1)
  assert.ok(result.stderr.includes(out), result.stderr)
  assert.equal(result.stderr.includes('    at '), false, result.stderr)
})

test('el uso general de la CLI menciona export-csv', () => {
  const result = run([], tmp())
  assert.equal(result.status, 1)
  assert.match(result.stderr, /export-csv/)
})
