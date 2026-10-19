# PLAN.md

Uno por equipo. Derívalo en M3 con Plan Mode (`opusplan`, con Opus), después de grillar la spec. Haz commit a `main` antes de partir los worktrees.

El diseño técnico de cada story va aquí. No hay `DESIGN.md`.

Cada story tiene una persona, un worktree, una rama `feat/<ticket-id>-story-<n>` y un PR.

Spec: [`workdocs/SPEC.md`](./SPEC.md). Ticket: [`tickets/T-01.md`](../tickets/T-01.md). Los números de criterio (C1 a C10) son los de "Aceptación observable" de la spec.

## Contratos entre stories

Los fija este plan para que las tres stories avancen en paralelo. Nadie los cambia sin editar este archivo primero.

| Módulo | Export | Firma y comportamiento | Dueña |
|---|---|---|---|
| `src/invoices-csv.js` | `toCsv(invoices)` | Recibe un arreglo de facturas con la forma de `invoices.json`. Devuelve `string`: encabezado `id;cliente;fecha;monto;estado` y una fila por factura, cada línea terminada en `\r\n`, sin BOM. No filtra. Fijado por la spec. | Story 1 |
| `src/export-options.js` | `parseExportArgs(args)` | Recibe los argumentos después de `export-csv` (`string[]`). Devuelve `{ month: string \| null, includeVoid: boolean, out: string }`, con `out` en `'facturas.csv'` si no viene. Ante cualquier error de C6 lanza `UsageError`. No toca el disco. | Story 2 |
| `src/export-options.js` | `class UsageError extends Error` | Su `message` es el texto de uso y contiene `export-csv`. | Story 2 |
| `src/export-options.js` | `selectInvoices(invoices, { month, includeVoid })` | Devuelve un arreglo nuevo, en el mismo orden. Sin `includeVoid` saca `status === 'void'`. Con `month` deja solo las facturas cuyo `issuedAt` empieza con `month`. | Story 2 |
| `src/cli.js` | `export-csv` | Une todo: parsea, filtra, escribe `'﻿' + toCsv(...)` en `out` e imprime `Facturas exportadas: <N> -> <out>`. | Story 3 |

Sin dependencias npm nuevas: solo `node:fs`, `node:path`, `node:os`, `node:child_process` y `node:test`.

## Stories

### Story 1: `feat/T-01-story-1`

**Persona:** Gerardo

**Qué entra:** el formato CSV puro. Es la función `toCsv`, con el escape de campos.

**Diseño técnico (qué toca, contratos, orden):**

1. Crea `src/invoices-csv.js` con `toCsv(invoices)`, según el contrato de arriba. El orden de columnas sale de los campos `id`, `client`, `issuedAt`, `amount` y `status`.
2. Escapa cada campo con una función interna `escapeField(value)`: convierte el valor a `String` y, si contiene `;`, `"`, `\r` o `\n`, lo envuelve en comillas dobles y duplica las `"` internas. `amount` sale como `String(amount)`, sin separadores de miles.
3. No toca `src/cli.js`, `src/invoices.js` ni el fixture.

**Test de aceptación (falla antes de codear):** `test/invoices-csv.test.js`. Cubre C8 tal cual y el contenido de C1 sin BOM: `toCsv` sobre `F-1001` y `F-1002` devuelve las 3 líneas exactas con `\r\n`, y el resultado no empieza con `﻿`. Comando: `npm test`. Rojo esperado: `ERR_MODULE_NOT_FOUND` de `src/invoices-csv.js`.

### Story 2: `feat/T-01-story-2`

**Persona:** dzumelzu

**Qué entra:** las opciones del comando y el filtro de facturas, sin E/S.

**Diseño técnico (qué toca, contratos, orden):**

1. Crea `src/export-options.js` con `UsageError` y un texto de uso:
   `usage: node src/cli.js export-csv [--month AAAA-MM] [--include-void] [--out <ruta>]`.
2. `parseExportArgs(args)` recorre los argumentos en orden. Lanza `UsageError` si encuentra:
   - una opción desconocida;
   - una opción repetida (también `--include-void` dos veces);
   - un `--month` o `--out` sin valor, incluido el caso en que lo que sigue empieza con `--`;
   - un `--out` cuyo valor queda vacío después de `trim()` (`""` o solo espacios);
   - un `--month` que no cumple `/^\d{4}-(0[1-9]|1[0-2])$/`.
3. Escribe `selectInvoices(invoices, { month, includeVoid })` según el contrato.
4. No toca `src/cli.js`.

**Test de aceptación (falla antes de codear):** `test/export-options.test.js`.
- `parseExportArgs`: cada caso de error de C6 (`2026-13`, `agosto`, `2026-8`, `--month` sin valor, `--month` repetido, `--formato x`, `--out` sin valor, `--out ""` y `--out "   "`) lanza `UsageError` con `export-csv` en el mensaje. `[]` devuelve `{ month: null, includeVoid: false, out: 'facturas.csv' }`.
- `selectInvoices` sobre `listInvoices()` da los ids de C2, C3, C4 y C5.

Comando: `npm test`. Rojo esperado: `ERR_MODULE_NOT_FOUND` de `src/export-options.js`.

### Story 3: `feat/T-01-story-3`

**Persona:** Emilio

**Qué entra:** el comando `export-csv` en la CLI, con la escritura del archivo y el manejo de errores.

**Diseño técnico (qué toca, contratos, orden):**

1. En `src/cli.js`, cambia la lectura de argumentos para que `export-csv` reciba `process.argv.slice(3)`. `list` y `get` quedan iguales (C9).
2. Agrega la rama `export-csv`:
   1. Llama a `parseExportArgs`. Si lanza `UsageError`, escribe su `message` en stderr y sale con código 1 antes de tocar el disco (C6).
   2. Filtra con `selectInvoices(listInvoices(), opts)`.
   3. Escribe con `writeFileSync(opts.out, '﻿' + toCsv(rows))`.
   4. Imprime `Facturas exportadas: ${rows.length} -> ${opts.out}` y sale con 0.
3. Envuelve `writeFileSync` en `try/catch`. Ante el error, escribe `no se pudo escribir ${opts.out}: ${err.code}` en stderr, sin stack, y sale con 1 (C10).
4. Cambia el uso general a `usage: node src/cli.js <list|get|export-csv> [args]`.

Mientras las Stories 1 y 2 no estén en `main`, codea contra los contratos de arriba. El PR se mergea después de las dos.

**Test de aceptación (falla antes de codear):** `test/export-csv.cli.test.js`.
- Corre la CLI de punta a punta con `spawnSync(process.execPath, [cliPath, 'export-csv', ...])`, con `cwd` en un directorio de `mkdtempSync(join(tmpdir(), 'lpc-'))`. `cliPath` es absoluto.
- Cubre C1 (bytes `EF BB BF`, contenido exacto y stdout), C2, C3, C4, C5, C6 a nivel de proceso (código 1, stderr con `export-csv` y sin archivo creado), C7 (sin `--out` y con un `facturas.csv` previo) y C10 (código 1, ruta en stderr y sin `    at `).
- Agrega que el uso general menciona `export-csv`. C9 lo cubren los tests actuales de `test/invoices.test.js`.

Comando: `npm test`. Rojo esperado: código 1 con `usage: node src/cli.js <list|get> [id]` y sin archivo.

## Orden

1. Este `PLAN.md` va a `main` antes de crear los worktrees.
2. Las Stories 1 y 2 son independientes: archivos distintos y sin imports entre sí. Se hacen en paralelo y se mergean en cualquier orden.
3. La Story 3 escribe su test rojo desde el día 1 y codea contra los contratos, pero se mergea al final, después de 1 y 2, rebasando sobre `main`. Su test de punta a punta es el que cierra la spec en la CI (Ubuntu, Node 20).
4. Al cerrar, María abre a mano el CSV de agosto (`--month 2026-08`) en Excel, según los Supuestos de la spec.

Worktrees (`<equipo>` = `lpc`):

```
git pull origin main
git worktree add -b feat/T-01-story-<n> ../lpc-story-<n> main
cd ../lpc-story-<n>
git push -u origin feat/T-01-story-<n>
```
