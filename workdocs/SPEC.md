# SPEC.md

Uno por equipo. Un extraño tiene que poder entenderlo sin el ticket abierto. Complétalo en M1. Grílalo en M2: el entregable es un diff en este archivo.

Tickets: [`tickets/T-01.md`](../tickets/T-01.md) (export CSV por CLI, cerrado salvo la revisión en Excel) y [`tickets/T-02.md`](../tickets/T-02.md) (panel web local). Los dos los pide María (tesorería, Andes Lab). T-02 se apoya en T-01: el botón del panel descarga el mismo CSV.

## Problema

Tesorería arma a mano, cada cierre de mes, el CSV de facturas que manda al banco: copia el listado de la CLI a una planilla. Le toma cerca de una hora y se cuelan facturas que no deberían ir. Las únicas identificadas son las anuladas (`void`).

El archivo que produce esta spec es para que tesorería lo abra en Excel, lo revise y decida qué manda al banco. No es el archivo del banco.

Con el CSV ya resuelto (T-01), María todavía revisa las facturas en la terminal antes de descargarlo, y no le gusta. T-02 le da una página local en el navegador para ver, filtrar y sumar las facturas, y descargar el CSV de lo que está viendo.

## Alcance

### T-01: comando `export-csv`

Al cerrar existe un comando nuevo en la CLI:

```
node src/cli.js export-csv [--month AAAA-MM] [--include-void] [--out <ruta>]
```

- **Columnas, en este orden:** `id;cliente;fecha;monto;estado`. Primera fila de encabezado con esos nombres.
- **Origen:** las mismas facturas que devuelve `listInvoices()` (`src/data/invoices.json`), en el mismo orden.
- **Formato para Excel en Windows (configuración regional es-CL):**
  - Codificación UTF-8 con BOM (`EF BB BF` al inicio), para que los acentos se vean bien.
  - Separador `;`, porque Excel en español usa la coma como separador decimal.
  - Fin de línea `\r\n`.
  - Un campo que contenga `;`, `"` o un salto de línea va entre comillas dobles, y sus `"` internas se duplican.
  - **Fórmulas:** si `id` o `cliente` empiezan con `=`, `+`, `-`, `@`, tabulador o retorno de carro (`\r`), se les antepone un apóstrofo (`'`) para que Excel los muestre como texto y no los ejecute como fórmula. Primero se antepone el apóstrofo y después se aplica la regla de comillas. `fecha`, `monto` y `estado` no se modifican.
  - **Campos vacíos:** un campo `null`, `undefined` o ausente sale como celda vacía, no como el texto `null` o `undefined`.
- **Campos:**
  - `fecha`: `issuedAt` tal cual, `AAAA-MM-DD`.
  - `monto`: entero sin separadores de miles ni símbolo. `1250000`, no `$1.250.000`. Si trae decimales, usa coma decimal (`1250000,5`), que es lo que Excel es-CL lee como número.
  - `estado`: el valor del JSON tal cual (`paid`, `open`, `void`), igual que en `node src/cli.js list`, que es lo que tesorería copia hoy.
- **Anuladas:** las facturas con `status: "void"` quedan fuera por defecto. Con `--include-void` entran en el mismo archivo con estado `void`, para que tesorería pueda cuadrar filtrándolas en Excel. No hay archivo aparte de anuladas.
- **Filtro por mes (opcional):** `--month 2026-08` deja solo las facturas cuyo `issuedAt` empieza con `2026-08`. Sin `--month` se exportan todos los meses.
- **Archivo:** por defecto `facturas.csv` en el directorio actual. `--out <ruta>` lo cambia (por ejemplo `--out export-tesoreria-agosto.csv`). Si el archivo existe, se sobrescribe.
- **Salida en consola:** al terminar, una sola línea en stdout: `Facturas exportadas: <N> -> <ruta>`, donde `<ruta>` es el valor de `--out` tal como se escribió, o `facturas.csv` si no se pasó. Por ejemplo `Facturas exportadas: 2 -> facturas.csv`. Código de salida 0.
- **Errores:** un `--month` que no sea `AAAA-MM` con mes `01` a `12`, un `--month` o `--out` sin valor, un `--out` vacío o hecho solo de espacios, una opción repetida o una opción desconocida, termina con código 1, un mensaje de uso en stderr que contiene `export-csv` y sin escribir archivo.
- **Si no se puede escribir el archivo** (por ejemplo, está abierto en Excel o la carpeta no existe): código 1, un mensaje en stderr que nombra la ruta tal como se escribió en `--out` (o `facturas.csv`) y sin stack trace.
- El mensaje de uso general de la CLI incluye `export-csv`.
- **Contrato del formato:** `src/invoices-csv.js` exporta `toCsv(invoices)`, que recibe un arreglo de facturas con la forma de `invoices.json` y devuelve el texto CSV (encabezado y filas, con `\r\n`) sin BOM. No filtra: el filtro por mes y por anuladas lo hace el comando antes de llamarla. Es un contrato que fija la spec, porque los criterios 8 y 11 a 14 lo necesitan; el resto del diseño va en `PLAN.md`.

### T-02: panel web local

Al cerrar, `node src/server.js` levanta un servidor HTTP local en el puerto 3000 e imprime en stdout `Panel de facturas: http://localhost:3000`. María abre esa dirección en el navegador.

- **Sin dependencias nuevas:** solo módulos de Node 20 (`node:http`, `node:fs`, `node:test`, `fetch`). Nada de `npm install`.
- **Datos:** las facturas salen de `listInvoices()` (`src/invoices.js`), en el mismo orden. No se cambia `src/invoices.js` ni el fixture.
- **Filtros (iguales en la API, la tabla y la descarga):**
  - `status`: `paid`, `open` o `void`, el valor del JSON en minúsculas. Vacío o ausente: todos los estados, **incluidas las anuladas**. Es distinto de la CLI, que saca las anuladas por defecto: en el panel, el filtro "Todas" muestra todo lo que hay.
  - `month`: `AAAA-MM` con mes `01` a `12`, la misma regla que `--month`. Deja las facturas cuyo `issuedAt` empieza con ese valor. Vacío o ausente: todos los meses.
  - Los dos se combinan con Y. Otros parámetros de la URL se ignoran.
  - Un `status` o `month` con otro valor (por ejemplo `anulada`, `VOID`, `2026-13` o `agosto`) responde `400` con JSON `{ "error": "<texto>" }`, con un texto no vacío.
- **`GET /api/invoices?status=&month=`:** `200`, `Content-Type: application/json; charset=utf-8`, y el cuerpo es el arreglo de facturas filtradas, con los mismos objetos de `invoices.json`.
- **`GET /api/export.csv?status=&month=`:** `200`, `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="facturas.csv"`. El cuerpo es BOM UTF-8 más `toCsv(filtradas)`: los mismos bytes que escribe `export-csv` para las mismas facturas, con todas las reglas de formato de T-01.
- **`GET /`:** `200`, `Content-Type: text/html; charset=utf-8`. Un solo HTML con:
  - un `<select id="status">` con las opciones `""` (Todas), `paid` (Pagada), `open` (Abierta) y `void` (Anulada). Solo las etiquetas del filtro van en español;
  - un `<input id="month" type="month">`;
  - una `<table>` con las columnas id, cliente, fecha, monto y estado, con los valores tal como en el CSV (`monto` como número sin separadores y `estado` como `paid`, `open` o `void`);
  - un elemento `id="total"` con la suma de `amount` de las filas que se ven en la tabla, anuladas incluidas si se ven;
  - un enlace `id="download"` con el texto `Descargar CSV`, que apunta a `/api/export.csv` con los filtros que están elegidos.
  Al cambiar un filtro, la tabla, el total y el enlace se actualizan sin recargar la página.
- **`GET /panel.js`:** `200`, `Content-Type: text/javascript; charset=utf-8`. Es el módulo JS que importa la página. Exporta dos funciones puras, que se prueban con `node:test` sin navegador:
  - `totalAmount(invoices)`: la suma de `amount`. `0` para un arreglo vacío.
  - `queryString({ status, month })`: `''` si los dos están vacíos; si no, `?` más los no vacíos, en ese orden (`?status=open&month=2026-08`, `?month=2026-08`).
- Cualquier otra ruta responde `404`.
- **Contrato del servidor:** `src/server.js` exporta `createServer()`, que devuelve un `http.Server` sin escuchar. Solo cuando se ejecuta con `node src/server.js` escucha en el 3000. Los tests lo levantan en un puerto libre (`listen(0)`).

## Aceptación observable

### T-01

Con el fixture actual (`F-1001` y `F-1002` de agosto 2026; `F-1003` anulada y `F-1004` de septiembre 2026). Todos se prueban con `npm test` y pasan en la CI (Ubuntu, Node 20), no solo en la máquina local. En los ejemplos, `\r\n` son los dos bytes CR LF, no texto literal.

1. `export-csv --month 2026-08 --out <tmp>/a.csv` escribe un archivo cuyos 3 primeros bytes son `EF BB BF` y cuyo contenido, sin el BOM, es exactamente:
   ```
   id;cliente;fecha;monto;estado\r\n
   F-1001;Constructora Sur;2026-08-02;1250000;paid\r\n
   F-1002;Servicios Andes;2026-08-15;890000;open\r\n
   ```
   y stdout es `Facturas exportadas: 2 -> <tmp>/a.csv`.
2. `export-csv --out <tmp>/b.csv` (sin mes) trae `F-1001`, `F-1002` y `F-1004`, en ese orden, y no trae `F-1003`.
3. `export-csv --include-void --out <tmp>/c.csv` trae las 4 facturas, con `F-1003` y estado `void`.
4. `export-csv --month 2026-09 --out <tmp>/d.csv` trae solo `F-1004`. Con `--include-void` agrega `F-1003`.
5. `export-csv --month 2026-12 --out <tmp>/e.csv` escribe solo el encabezado, stdout es `Facturas exportadas: 0 -> <tmp>/e.csv` y el código de salida es 0.
6. `export-csv --month 2026-13`, `--month agosto`, `--month 2026-8`, `--month` sin valor, `--month 2026-08 --month 2026-09`, `--formato x` y `--month=2026-08`, cada uno con `--out <tmp>/f.csv`, y `export-csv --out` sin valor, `export-csv --out ""` y `export-csv --out " "` ejecutados en `<tmp>`, terminan con código 1, escriben en stderr un texto que contiene `export-csv` y no crean `<tmp>/f.csv` ni `<tmp>/facturas.csv`.
7. Ejecutado en un directorio temporal sin `--out`, crea `facturas.csv` en ese directorio y stdout es `Facturas exportadas: 3 -> facturas.csv`. Si `facturas.csv` ya existía con otro contenido, queda reemplazado.
8. `toCsv([{ id: 'F-9', client: 'Comercial "El Sol"; Ltda', issuedAt: '2026-08-01', amount: 1000, status: 'open' }])` devuelve exactamente `id;cliente;fecha;monto;estado\r\nF-9;"Comercial ""El Sol""; Ltda";2026-08-01;1000;open\r\n`. El fixture no se toca.
9. `list` y `get` se comportan igual que hoy: los tests actuales siguen en verde, incluido que el listado trae las anuladas.
10. `export-csv --out <tmp>/no-existe/g.csv` termina con código 1, stderr contiene `<tmp>/no-existe/g.csv` y no contiene `    at ` (sin stack trace).
11. `toCsv([{ id: 'F-9', client: '=HYPERLINK("http://x")', issuedAt: '2026-08-01', amount: 1000, status: 'open' }, { id: '+F-8', client: '@Sur', issuedAt: '2026-08-01', amount: -500, status: 'open' }])` devuelve exactamente `id;cliente;fecha;monto;estado\r\nF-9;"'=HYPERLINK(""http://x"")";2026-08-01;1000;open\r\n'+F-8;'@Sur;2026-08-01;-500;open\r\n`. El `monto` negativo no lleva apóstrofo.
12. `toCsv([{ id: 'F-9', client: '\tSur', issuedAt: '2026-08-01', amount: 1000, status: 'open' }, { id: 'F-8', client: '\rSur', issuedAt: '2026-08-01', amount: 1000, status: 'open' }])` devuelve exactamente `id;cliente;fecha;monto;estado\r\nF-9;'\tSur;2026-08-01;1000;open\r\nF-8;"'\rSur";2026-08-01;1000;open\r\n`. En el ejemplo, `\t` y `\r` dentro de los valores son un byte TAB y un byte CR.
13. `toCsv([{ id: 'F-9', client: 'Sur', issuedAt: '2026-08-01', amount: 1250000.5, status: 'open' }])` devuelve exactamente `id;cliente;fecha;monto;estado\r\nF-9;Sur;2026-08-01;1250000,5;open\r\n`.
14. `toCsv` con `client: null`, con `client: undefined` o sin la propiedad `client` devuelve, en la fila, exactamente `F-9;;2026-08-01;1000;open`.

### T-02

Con el mismo fixture. Cada test levanta `createServer()` en un puerto libre y consulta con `fetch`. Todos se prueban con `npm test` y pasan en la CI (Ubuntu, Node 20).

15. `GET /api/invoices` responde `200`, `Content-Type` empieza con `application/json`, y el cuerpo es igual (`deepEqual`) a `listInvoices()`: las 4 facturas, `F-1003` incluida.
16. `GET /api/invoices?status=open` trae `F-1002` y `F-1004`, en ese orden. `?status=paid` trae solo `F-1001`. `?status=void` trae solo `F-1003`.
17. `GET /api/invoices?month=2026-09` trae `F-1003` y `F-1004`. `?status=open&month=2026-08` trae solo `F-1002`. `?month=2026-12` trae `[]` con `200`.
18. `GET /api/invoices?status=&month=` (vacíos) trae lo mismo que el criterio 15.
19. `?status=anulada`, `?status=VOID`, `?month=2026-13` y `?month=agosto`, cada uno en `/api/invoices` y en `/api/export.csv`, responden `400` con un JSON cuyo `error` es un texto no vacío.
20. `GET /api/export.csv?month=2026-08` responde `200`, con `Content-Type: text/csv; charset=utf-8` y `Content-Disposition: attachment; filename="facturas.csv"`, y su cuerpo son exactamente los bytes del criterio 1 (`EF BB BF` más las 3 líneas).
21. `GET /api/export.csv` sin filtros trae las 4 facturas, con `F-1003` y estado `void`. `?status=void` trae el encabezado y solo `F-1003`. `?month=2026-12` trae solo el encabezado.
22. `GET /` responde `200` con `Content-Type: text/html; charset=utf-8`, y el HTML contiene `<table`, `id="status"` con las opciones `value=""`, `value="paid"`, `value="open"` y `value="void"`, `id="month"`, `id="total"`, `id="download"` y el texto `Descargar CSV`.
23. `GET /panel.js` responde `200` con `Content-Type: text/javascript; charset=utf-8`.
24. `totalAmount(listInvoices())` es `4690000`. `totalAmount([F-1001, F-1002])` es `2140000`. `totalAmount([])` es `0`.
25. `queryString({ status: '', month: '' })` es `''`. `queryString({ status: 'open', month: '2026-08' })` es `'?status=open&month=2026-08'`. `queryString({ status: '', month: '2026-08' })` es `'?month=2026-08'`.
26. `GET /no-existe` responde `404`.
27. Los criterios 1 a 14 siguen en verde: el panel no cambia la CLI.

## Fuera de alcance

- Formato específico del banco (columnas, orden o separador distintos) y el envío al banco.
- Archivos `.xlsx` u otros formatos que no sean CSV.
- Traducir los estados al español (`pagada`, `abierta`, `anulada`) en el CSV o en la tabla. En el panel solo van en español las etiquetas del filtro de estado.
- En la CLI, filtros fuera de `--month` y `--include-void`. En el panel, filtros fuera de estado y mes: búsqueda por cliente, rango de fechas, varios estados a la vez.
- Elegir el mes con palabras (`--month agosto`) o nombrar el archivo automáticamente según el mes. La descarga del panel siempre se llama `facturas.csv`.
- Login, base de datos, despliegue y frameworks de front.
- La Story 4 sugerida en T-02 (monto en pesos chilenos, anuladas en gris, búsqueda por cliente): es para equipos de 4 y este equipo es de 3.
- Métodos distintos de `GET`, puerto configurable y qué pasa si el 3000 está ocupado.
- Tests de la página en un navegador: no hay dependencias para eso. El comportamiento en el navegador se revisa a mano (ver Supuestos).
- Cambiar `list`, `get`, `listInvoices()` o los datos de `src/data/invoices.json`.
- Agregar dependencias npm.
- Validar o normalizar `src/data/invoices.json`. Con datos fuera de la forma de los Supuestos (falta `issuedAt`, JSON inválido o `status` con otra capitalización), el comportamiento del comando no está definido y puede terminar con stack trace. Un `"VOID"` en mayúsculas no cuenta como anulada.
- Neutralizar fórmulas en campos que no sean `id` y `cliente`. `fecha` y `estado` tienen forma fija según los Supuestos y `monto` es número.

## Supuestos

- Los Excel de tesorería usan configuración regional en español, así que separan por `;` al abrir con doble clic. Un Excel en inglés vería una sola columna. Como "abre bien en Excel" no se puede automatizar, antes de cerrar el ticket María abre a mano el CSV de agosto (`--month 2026-08`) y confirma columnas y acentos.
- `src/data/invoices.json` es JSON válido y cada factura trae `id` y `client` como texto, `issuedAt` como `AAAA-MM-DD`, `amount` como número en pesos, normalmente entero (puede ser negativo; si trae decimales, aplica el criterio 13) y `status` en minúsculas (`paid`, `open` o `void`).
- El panel corre en el computador de María y nadie más lo usa: escucha solo en la máquina local, sin login.
- Lo que hace la página en el navegador no se automatiza. Antes de cerrar T-02, María corre `node src/server.js`, abre http://localhost:3000 y confirma: sin filtros ve las 4 facturas y el total `4690000`; con Abierta ve `F-1002` y `F-1004` y el total `1340000`; con Abierta y agosto 2026 ve solo `F-1002`, y "Descargar CSV" baja un `facturas.csv` con esa fila que abre bien en Excel.
