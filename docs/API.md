# API y módulos del panel de facturas

Referencia de los endpoints HTTP de `src/server.js` y de las funciones exportadas en `src/`. Lo que debe cumplirse está en [`workdocs/SPEC.md`](../workdocs/SPEC.md) (criterios C1 a C34); este documento explica cómo usarlo. Si los dos no coinciden, manda la spec.

## Levantar el servidor

```
node src/server.js
```

Escucha en `127.0.0.1:3000` (solo la máquina local) e imprime `Panel de facturas: http://localhost:3000`. No tiene login ni dependencias npm.

## Endpoints HTTP

Todos son `GET`. Cualquier otro método o ruta responde `404` con el texto `not found`.

| Ruta | Respuesta | Criterios |
|---|---|---|
| `/` | Página del panel (HTML) | C22, C31 |
| `/panel.js` | Módulo JS que importa la página | C23 |
| `/api/invoices` | Facturas filtradas (JSON) | C15 a C19 |
| `/api/export.csv` | CSV de tesorería con los filtros | C19 a C21, C28, C29 |

### Parámetros de filtro

`/api/invoices` y `/api/export.csv` aceptan los mismos filtros, que se combinan con Y:

| Parámetro | Valores | Vacío o ausente |
|---|---|---|
| `status` | `paid`, `open` o `void`, en minúsculas | Todos los estados, **incluidas las anuladas** |
| `month` | `AAAA-MM`, con mes `01` a `12` | Todos los meses |

Otro valor responde `400` con un JSON `{ "error": "<texto>" }`. Los demás parámetros se ignoran.

### `GET /api/invoices`

Devuelve las facturas de `src/data/invoices.json` que cumplen los filtros, en el orden del archivo y con la misma forma.

- `200`, `Content-Type: application/json; charset=utf-8`.

```
GET /api/invoices?status=open&month=2026-08

[{"id":"F-1002","client":"Servicios Andes","issuedAt":"2026-08-15","amount":890000,"status":"open"}]
```

```
GET /api/invoices?status=anulada

400 {"error":"status inválido: anulada. Usa paid, open o void."}
```

```
GET /api/invoices?month=agosto

400 {"error":"month inválido: agosto. Usa AAAA-MM, con mes 01 a 12."}
```

### `GET /api/export.csv`

Descarga el mismo CSV que `node src/cli.js export-csv`, con los filtros aplicados.

- `200`, `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="facturas.csv"`.
- Cuerpo: BOM UTF-8 (`EF BB BF`) más `toCsv(facturas)`. Separador `;`, fin de línea `\r\n`, fecha `AAAA-MM-DD` y estado `paid`, `open` o `void` (sin traducir).
- A diferencia de la CLI, sin `status` incluye las anuladas: el CSV trae lo mismo que se ve en la tabla.
- Parámetro opcional `by`: el nombre de quien descarga. No cambia el archivo. Con `200`, el servidor escribe en su consola una línea como esta (ver `downloadLogLine`):

```
GET /api/export.csv?status=open&by=Ana

Descarga CSV: Ana · status=open · 2026-10-19T21:41:08.448Z
```

El nombre lo declara la persona; no se verifica. Con `400` no se registra nada y no se guarda nada en disco.

### `GET /` y `GET /panel.js`

`/` devuelve `src/web/index.html` (`text/html; charset=utf-8`). La página:

1. Carga `/panel.js` como módulo.
2. Al abrir y al cambiar `#status` o `#month`, pide `/api/invoices` con `queryString(...)` y arma la tabla con `textContent`, nunca con `innerHTML`.
3. Muestra la fecha con `formatDate`, el monto con `formatAmount`, el estado con `statusLabel`, la cantidad de facturas y el total con `formatAmount(totalAmount(...))`.
4. Deja `#download` deshabilitado (`aria-disabled="true"`, sin `href`) mientras el campo `#by` ("Tu nombre") esté vacío. Con nombre, el enlace apunta a `/api/export.csv` con los filtros y `by`. Después de cada clic en "Descargar CSV", el campo `#by` se vacía y el botón vuelve a quedar deshabilitado. El nombre no se guarda en el navegador.

`/panel.js` devuelve `src/web/panel.js` (`text/javascript; charset=utf-8`).

## Módulos

### `src/server.js`

#### `createServer({ log } = {})`

Crea el servidor sin escucharlo. Devuelve un `http.Server`.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `log` | `(line: string) => void` | Recibe la línea de cada descarga `200` de `/api/export.csv`. Por defecto no hace nada. `node src/server.js` pasa `console.log`. |

En los tests se levanta en un puerto libre:

```js
const lines = []
const server = createServer({ log: (line) => lines.push(line) })
server.listen(0, '127.0.0.1', () => {
  const base = `http://127.0.0.1:${server.address().port}`
})
```

Las rutas viven en un objeto `routes` dentro de `createServer`. Cada handler recibe `(req, res, url)`, con `url` como `URL`.

### `src/invoice-query.js`

#### `parseInvoiceQuery(searchParams)`

Lee `status` y `month` de un `URLSearchParams` y los valida.

- Devuelve `{ status, month }`. Un valor vacío o ausente es `null`.
- Lanza `QueryError` si `status` no es `paid`, `open` ni `void`, o si `month` no cumple `AAAA-MM` con mes `01` a `12`.

```js
parseInvoiceQuery(new URLSearchParams('status=open&month='))
// { status: 'open', month: null }
```

#### `filterInvoices(invoices, { status, month })`

Devuelve un arreglo nuevo con las facturas que cumplen los filtros, en el mismo orden. `null` en un filtro es no filtrar por él. No saca las anuladas por defecto.

#### `class QueryError extends Error`

Error de parámetros inválidos. Su `message` dice qué parámetro está mal y qué valores acepta.

### `src/http-send.js`

#### `sendJson(res, statusCode, body)`

Responde `JSON.stringify(body)` con `Content-Type: application/json; charset=utf-8`.

### `src/routes/page.js`

#### `handlePage(req, res)`

Sirve `src/web/index.html` con `text/html; charset=utf-8`.

#### `handlePanelJs(req, res)`

Sirve `src/web/panel.js` con `text/javascript; charset=utf-8`.

### `src/routes/export-csv.js`

#### `handleExportCsv(req, res, url)`

Valida la query con `parseInvoiceQuery`, filtra `listInvoices()` con `filterInvoices` y responde `'﻿' + toCsv(...)` con los headers de descarga. Con `QueryError` responde `400` con `sendJson`. El registro de `by` lo agrega `server.js` alrededor de este handler; esta función no lo conoce.

### `src/download-log.js`

#### `downloadLogLine({ by, status, month }, date)`

Arma la línea de registro de una descarga, sin salto de línea final:

```
Descarga CSV: <nombre> · <filtros> · <fecha ISO>
```

- `<nombre>`: `by` sin caracteres de control (evita que un nombre con `\n` o códigos ANSI ensucie la consola), sin espacios al inicio ni al final y con 80 caracteres como máximo. Si queda vacío, `(sin nombre)`.
- `<filtros>`: `status=<s> month=<m>` con los que vengan, o `sin filtros`.
- `<fecha ISO>`: `date.toISOString()`.

```js
downloadLogLine({ by: '  Ana\n', status: 'open', month: '2026-08' }, new Date('2026-10-19T12:00:00Z'))
// 'Descarga CSV: Ana · status=open month=2026-08 · 2026-10-19T12:00:00.000Z'
```

### `src/web/panel.js`

Funciones puras que usa la página. No tocan el DOM, así que `node:test` las importa sin navegador.

#### `totalAmount(invoices)`

Suma `amount` y devuelve un número. `0` para un arreglo vacío. La página lo muestra con `formatAmount`.

```js
totalAmount(listInvoices()) // 4690000
```

#### `queryString({ status, month, by })`

Arma la query string con los filtros no vacíos, en el orden `status`, `month`, `by`. A `by` le quita los espacios del inicio y del final. Devuelve `''` si no queda ninguno.

```js
queryString({ status: 'open', month: '', by: ' Ana ' }) // '?status=open&by=Ana'
queryString({ status: '', month: '' })                  // ''
```

#### `statusLabel(status)`

Etiqueta en español para la tabla: `paid` → `Pagada`, `open` → `Abierta`, `void` → `Anulada`. Otro valor sale tal cual.

#### `formatAmount(amount)`

Monto en pesos chilenos para la tabla y el total: `$` y punto como separador de miles. Los negativos llevan `-` antes del `$` y los decimales van con coma.

```js
formatAmount(1250000)   // '$1.250.000'
formatAmount(-500)      // '-$500'
formatAmount(1250000.5) // '$1.250.000,5'
```

#### `formatDate(isoDate)`

Pasa `AAAA-MM-DD` a `DD-MM-AAAA` para la tabla. Otro valor sale tal cual.

```js
formatDate('2026-08-02') // '02-08-2026'
formatDate('2026-8-2')   // '2026-8-2'
```

### Módulos de T-01 que reusa el panel

#### `src/invoices.js`: `listInvoices()` y `getInvoice(id)`

`listInvoices()` lee `src/data/invoices.json` y devuelve todas las facturas, anuladas incluidas. `getInvoice(id)` devuelve una o `null`.

#### `src/invoices-csv.js`: `toCsv(invoices)`

Devuelve el texto CSV sin BOM: encabezado `id;cliente;fecha;monto;estado` y una fila por factura, cada línea con `\r\n`. No filtra. Reglas de formato (C8, C11 a C14):

- Un campo con `;`, `"` o salto de línea va entre comillas y sus `"` se duplican.
- `id` y `cliente` que empiezan con `=`, `+`, `-`, `@`, tabulador o CR llevan `'` delante, para que Excel no los ejecute como fórmula.
- `monto` usa coma decimal (`1250000,5`).
- `null` o `undefined` salen como celda vacía.

#### `src/export-options.js`: `parseExportArgs(args)`, `selectInvoices(invoices, opts)` y `UsageError`

Opciones y filtro del comando `node src/cli.js export-csv`. `selectInvoices` saca las anuladas salvo con `includeVoid`, a diferencia de `filterInvoices`.

## Tests

```
npm test
```

| Archivo | Cubre |
|---|---|
| `test/invoices-api.test.js` | `/api/invoices`, `parseInvoiceQuery`, `filterInvoices`, 404 |
| `test/export-csv.http.test.js` | `/api/export.csv` |
| `test/panel.test.js` | `/`, `/panel.js`, `totalAmount`, `queryString`, `statusLabel`, `formatDate`, `formatAmount` |
| `test/download-log.test.js` | `by`, `createServer({ log })`, `downloadLogLine` |
| `test/invoices-csv.test.js`, `test/export-options.test.js`, `test/export-csv.cli.test.js`, `test/invoices.test.js` | T-01: CSV y CLI |
