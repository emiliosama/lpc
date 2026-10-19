# PLAN.md

Uno por equipo. Derívalo en M3 con Plan Mode (`opusplan`, con Opus), después de grillar la spec. Haz commit a `main` antes de partir los worktrees.

El diseño técnico de cada story va aquí. No hay `DESIGN.md`.

Cada story tiene una persona, un worktree, una rama `feat/<ticket-id>-story-<n>` y un PR.

Spec: [`workdocs/SPEC.md`](./SPEC.md). Tickets: [`tickets/T-01.md`](../tickets/T-01.md) y [`tickets/T-02.md`](../tickets/T-02.md). Los números de criterio (C1 a C14 para T-01, C15 a C27 para T-02) son los de "Aceptación observable" de la spec.

# T-01: comando `export-csv` (mergeado)

Las Stories 1 a 3 están en `main` (PRs #6, #7 y #8), igual que C11 (PR #13) y C12 a C14 (PR #15). Lo único pendiente de T-01 es la revisión de María en Excel. La rama `origin/feat/T-01-story-4` quedó obsoleta: C11 y `--out` vacío entraron por otros PRs, y su diff borraría tests que hoy están en `main`. No se mergea.

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
4. C11 (agregado tras el grill, PR #10): antes de escapar, `neutralizeFormula(value)` antepone `'` a `id` y `cliente` si empiezan con `=`, `+`, `-` o `@`. `fecha`, `monto` y `estado` no pasan por ella, así que un `monto` negativo sigue siendo número.
5. C12 a C14 (propuestos en el PR #14): `neutralizeFormula` suma tabulador y CR (C12). `amountField(value)` escribe `monto` con coma decimal (C13). `textField(value)` convierte `null` y `undefined` en celda vacía, en los cinco campos (C14).

**Casos borde (revisados el 2026-10-19 contra la spec):**

- Dentro de la spec, con test: lista vacía (solo encabezado, respaldo de C5), salto de línea `\n` o `\r` en un campo (va entre comillas), campo de solo comillas y C11 a C14.
- Sin acción: coma en un campo, acentos y espacios al inicio o al final salen tal cual.
- Fuera de alcance según la spec: fórmulas en `fecha` o `estado` y un argumento que no es arreglo. Con datos fuera de la forma de los Supuestos, el comportamiento no está definido.
- Lo revisa María a mano: que Excel muestre como texto un cliente con `'` delante, y cómo muestra `AAAA-MM-DD`.

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

# T-02: panel web local

Tres stories, una por persona, como sugiere el ticket (S1 API, S2 página, S3 descarga). La S4 del ticket queda fuera de alcance: el equipo es de 3. Las personas son una propuesta que rota respecto de T-01; el equipo la confirma antes de partir ramas.

## Contratos entre stories

Los fija este plan para que las tres stories avancen en paralelo. Nadie los cambia sin editar este archivo primero.

| Módulo | Export | Firma y comportamiento | Dueña |
|---|---|---|---|
| `src/invoice-query.js` | `class QueryError extends Error` | Su `message` explica qué parámetro está mal. | Story 1 |
| `src/invoice-query.js` | `parseInvoiceQuery(searchParams)` | Recibe un `URLSearchParams`. Devuelve `{ status: 'paid' \| 'open' \| 'void' \| null, month: string \| null }`; un valor vacío o ausente es `null`. Con un `status` fuera de esos tres o un `month` que no cumple la regex de `AAAA-MM` de `src/export-options.js`, lanza `QueryError`. | Story 1 |
| `src/invoice-query.js` | `filterInvoices(invoices, { status, month })` | Devuelve un arreglo nuevo, en el mismo orden. `null` en un filtro es no filtrar por él. No saca las anuladas por defecto. | Story 1 |
| `src/http-send.js` | `sendJson(res, statusCode, body)` | Escribe `JSON.stringify(body)` con `Content-Type: application/json; charset=utf-8`. | Story 1 |
| `src/server.js` | `createServer()` | Devuelve un `http.Server` sin escuchar. Resuelve la ruta con `new URL(req.url, 'http://localhost')` y busca `routes[pathname]` (solo `GET`). Llama al handler como `handler(req, res, url)`. Sin handler: `404`. | Story 1 |
| `src/server.js` | `routes` (no exportado) | Objeto `{ '<pathname>': handler }`. La Story 1 trae `/api/invoices`; la 2 agrega `/` y `/panel.js`; la 3 agrega `/api/export.csv`. Cada story suma solo sus líneas. | Story 1 |
| `src/web/panel.js` | `totalAmount(invoices)`, `queryString({ status, month })` | Funciones puras según la spec. Sin código de DOM, para que `node:test` las importe sin navegador. | Story 2 |
| `src/routes/page.js` | `handlePage(req, res)`, `handlePanelJs(req, res)` | Sirven `src/web/index.html` y `src/web/panel.js` con su `Content-Type`. | Story 2 |
| `src/routes/export-csv.js` | `handleExportCsv(req, res, url)` | Parsea con `parseInvoiceQuery`, filtra `listInvoices()` con `filterInvoices` y responde `'﻿' + toCsv(...)` con los headers de la spec. Con `QueryError`: `sendJson(res, 400, { error })`. | Story 3 |

Sin dependencias npm nuevas: `node:http`, `node:fs`, `node:path`, `node:url`, `node:test` y `fetch`. No cambia `src/cli.js`, `src/export-options.js`, `src/invoices-csv.js`, `src/invoices.js` ni el fixture.

Helper de test: cada test HTTP levanta `createServer()` con `listen(0)`, lee `server.address().port`, consulta `http://127.0.0.1:<port>` con `fetch` y cierra el server en `after()`. Cada story lo escribe en su propio archivo de test, sin módulo compartido, para no pisarse.

## Stories

### Story 1: `feat/T-02-story-1` (API)

**Persona (propuesta):** Emilio

**Qué entra:** el servidor, el parseo y filtro de la query y `GET /api/invoices`.

**Diseño técnico (qué toca, contratos, orden):**

1. Crea `src/invoice-query.js` con `QueryError`, `parseInvoiceQuery` y `filterInvoices`. La regex de `month` es la misma de `src/export-options.js`; se copia, no se importa, para no tocar ese módulo.
2. Crea `src/http-send.js` con `sendJson`.
3. Crea `src/server.js` con `createServer()` y `routes`. El handler de `/api/invoices` vive en el mismo archivo: parsea, filtra `listInvoices()` y responde `sendJson(res, 200, rows)`; con `QueryError`, `sendJson(res, 400, { error: err.message })`.
4. Al final de `src/server.js`, solo si es el archivo que se ejecuta (`import.meta.url === pathToFileURL(process.argv[1]).href`): `createServer().listen(3000, '127.0.0.1', ...)` e imprime `Panel de facturas: http://localhost:3000`. Escuchar en `127.0.0.1` cumple el supuesto de máquina local.

**Test de aceptación (falla antes de codear):** `test/invoices-api.test.js`. Cubre C15 a C18, C19 para `/api/invoices` y C26. Agrega tests unitarios de `parseInvoiceQuery` (valores válidos, vacíos y los inválidos de C19) y de `filterInvoices` sobre `listInvoices()`.

Comando: `npm test`. Rojo esperado: `ERR_MODULE_NOT_FOUND` de `src/server.js`.

### Story 2: `feat/T-02-story-2` (página)

**Persona (propuesta):** dzumelzu

**Qué entra:** el HTML, su JS y el cálculo del total.

**Diseño técnico (qué toca, contratos, orden):**

1. Crea `src/web/panel.js` con `totalAmount` y `queryString`, según la spec. `queryString` arma el texto con `URLSearchParams`, agregando primero `status` y después `month`, solo si no están vacíos.
2. Crea `src/web/index.html` con los elementos de C22 y un `<script type="module">` que importa `/panel.js`. Al cargar y en cada `change` de `#status` o `#month`:
   1. `fetch('/api/invoices' + queryString(filtros))`;
   2. arma las filas de la tabla con `textContent`, nunca con `innerHTML`, porque `client` es texto libre;
   3. escribe `totalAmount(filas)` en `#total`;
   4. pone `href = '/api/export.csv' + queryString(filtros)` en `#download`.
3. Crea `src/routes/page.js` con `handlePage` y `handlePanelJs`, que leen los archivos con `readFileSync` relativo a `import.meta.url`.
4. En `src/server.js`, agrega a `routes` las entradas `'/'` y `'/panel.js'`. Es el único cambio fuera de sus archivos.

Mientras la Story 1 no esté en `main`, codea contra los contratos. `panel.js`, `index.html` y `page.js` no dependen de ella; solo el test de C22 y C23 necesita `createServer()`.

**Test de aceptación (falla antes de codear):** `test/panel.test.js`. Cubre C24 y C25 importando `src/web/panel.js`, y C22 y C23 levantando el server.

Comando: `npm test`. Rojo esperado: `ERR_MODULE_NOT_FOUND` de `src/web/panel.js`.

### Story 3: `feat/T-02-story-3` (descarga)

**Persona (propuesta):** Gerardo

**Qué entra:** `GET /api/export.csv`, que reusa `toCsv` de T-01.

**Diseño técnico (qué toca, contratos, orden):**

1. Crea `src/routes/export-csv.js` con `handleExportCsv`, según el contrato. Responde `200` con `Content-Type: text/csv; charset=utf-8` y `Content-Disposition: attachment; filename="facturas.csv"`, y el cuerpo `'﻿' + toCsv(rows)`. Escribe el BOM como escape, no como carácter invisible.
2. En `src/server.js`, agrega a `routes` la entrada `'/api/export.csv'`. Es el único cambio fuera de su archivo.
3. No toca `src/invoices-csv.js`: el formato es el de T-01 (C1 a C14).

Mientras la Story 1 no esté en `main`, codea contra los contratos de `invoice-query.js` y `http-send.js`.

**Test de aceptación (falla antes de codear):** `test/export-csv.http.test.js`. Cubre C19 para `/api/export.csv`, C20 comparando los bytes de la respuesta (`Buffer.from(await res.arrayBuffer())`) con `EF BB BF` más las 3 líneas de C1, y C21.

Comando: `npm test`. Rojo esperado: `ERR_MODULE_NOT_FOUND` de `src/server.js` (o `404` en `/api/export.csv` si la Story 1 ya está en `main`).

## Orden

1. Este `PLAN.md` y el `SPEC.md` con T-02 van a `main` antes de crear los worktrees.
2. Las tres stories escriben su test rojo en paralelo y codean contra los contratos.
3. La Story 1 se mergea primero: trae `src/server.js`, que las otras dos necesitan.
4. Las Stories 2 y 3 rebasan sobre `main` y se mergean en cualquier orden. Si chocan, es solo en el objeto `routes` de `src/server.js`: se quedan las dos líneas.
5. C27 (T-01 sigue verde) lo cubren los tests de T-01 en cada PR.
6. Al cerrar, María revisa el panel a mano en el navegador, según los Supuestos de la spec.

Worktrees (`<equipo>` = `lpc`):

```
git pull origin main
git worktree add -b feat/T-02-story-<n> ../lpc-t02-story-<n> main
cd ../lpc-t02-story-<n>
git push -u origin feat/T-02-story-<n>
```
