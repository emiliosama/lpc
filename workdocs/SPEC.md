# SPEC.md

Uno por equipo. Un extraño tiene que poder entenderlo sin el ticket abierto. Complétalo en M1. Grílalo en M2: el entregable es un diff en este archivo.

Ticket: [`tickets/T-01.md`](../tickets/T-01.md). Pedido por María (tesorería, Andes Lab).

## Problema

Tesorería arma a mano, cada cierre de mes, el CSV de facturas que manda al banco: copia el listado de la CLI a una planilla. Le toma cerca de una hora y se cuelan facturas anuladas que no deberían ir.

El archivo que produce esta spec es para que tesorería lo abra en Excel, lo revise y decida qué manda al banco. No es el archivo del banco.

## Alcance

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
- **Campos:**
  - `fecha`: `issuedAt` tal cual, `AAAA-MM-DD`.
  - `monto`: entero sin separadores de miles ni símbolo. `1250000`, no `$1.250.000`.
  - `estado`: el valor del JSON tal cual (`paid`, `open`, `void`), igual que en `node src/cli.js list`, que es lo que tesorería copia hoy.
- **Anuladas:** las facturas con `status: "void"` quedan fuera por defecto. Con `--include-void` entran en el mismo archivo con estado `void`, para que tesorería pueda cuadrar filtrándolas en Excel. No hay archivo aparte de anuladas.
- **Filtro por mes (opcional):** `--month 2026-08` deja solo las facturas cuyo `issuedAt` empieza con `2026-08`. Sin `--month` se exportan todos los meses.
- **Archivo:** por defecto `facturas.csv` en el directorio actual. `--out <ruta>` lo cambia (por ejemplo `--out export-tesoreria-agosto.csv`). Si el archivo existe, se sobrescribe.
- **Salida en consola:** al terminar, una sola línea en stdout: `Facturas exportadas: <N> -> <ruta>`, donde `<ruta>` es el valor de `--out` tal como se escribió, o `facturas.csv` si no se pasó. Por ejemplo `Facturas exportadas: 2 -> facturas.csv`. Código de salida 0.
- **Errores:** un `--month` que no sea `AAAA-MM` con mes `01` a `12`, un `--month` o `--out` sin valor, o una opción desconocida, termina con código 1, un mensaje de uso en stderr que contiene `export-csv` y sin escribir archivo.
- **Si no se puede escribir el archivo** (por ejemplo, está abierto en Excel o la carpeta no existe): código 1, un mensaje en stderr que nombra la ruta y sin stack trace.
- El mensaje de uso general de la CLI incluye `export-csv`.
- **Contrato del formato:** `src/invoices-csv.js` exporta `toCsv(invoices)`, que recibe un arreglo de facturas con la forma de `invoices.json` y devuelve el texto CSV (encabezado y filas, con `\r\n`) sin BOM. No filtra: el filtro por mes y por anuladas lo hace el comando antes de llamarla.

## Aceptación observable

Con el fixture actual (`F-1001` y `F-1002` de agosto 2026; `F-1003` anulada y `F-1004` de septiembre 2026):

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
6. `export-csv --month 2026-13`, `--month agosto`, `--month 2026-8`, `--month` sin valor y `--formato x`, cada uno con `--out <tmp>/f.csv`, y `export-csv --out` sin valor ejecutado en `<tmp>`, terminan con código 1, escriben en stderr un texto que contiene `export-csv` y no crean `<tmp>/f.csv` ni `<tmp>/facturas.csv`.
7. Ejecutado en un directorio temporal sin `--out`, crea `facturas.csv` en ese directorio y stdout es `Facturas exportadas: 3 -> facturas.csv`. Si `facturas.csv` ya existía con otro contenido, queda reemplazado.
8. `toCsv([{ id: 'F-9', client: 'Comercial "El Sol"; Ltda', issuedAt: '2026-08-01', amount: 1000, status: 'open' }])` devuelve exactamente `id;cliente;fecha;monto;estado\r\nF-9;"Comercial ""El Sol""; Ltda";2026-08-01;1000;open\r\n`. El fixture no se toca.
9. `list` y `get` se comportan igual que hoy: los tests actuales siguen en verde, incluido que el listado trae las anuladas.
10. `export-csv --out <tmp>/no-existe/g.csv` termina con código 1, stderr contiene `<tmp>/no-existe/g.csv` y no contiene `    at ` (sin stack trace).

## Fuera de alcance

- Formato específico del banco (columnas, orden o separador distintos) y el envío al banco.
- Archivos `.xlsx` u otros formatos que no sean CSV.
- Traducir los estados al español (`pagada`, `abierta`, `anulada`).
- Filtros por cliente, estado, rango de fechas u otros fuera de `--month`.
- Elegir el mes con palabras (`--month agosto`) o nombrar el archivo automáticamente según el mes.
- Endpoint HTTP, login, interfaz web o despliegue.
- Cambiar `list`, `get`, `listInvoices()` o los datos de `src/data/invoices.json`.
- Agregar dependencias npm.

## Supuestos

- Los Excel de tesorería usan configuración regional en español, así que separan por `;` al abrir con doble clic. Un Excel en inglés vería una sola columna. Como "abre bien en Excel" no se puede automatizar, antes de cerrar el ticket María abre a mano el CSV de agosto (`--month 2026-08`) y confirma columnas y acentos.
