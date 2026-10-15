# SPEC.md

Uno por equipo. Un extraño tiene que poder entenderlo sin el ticket abierto. Complétalo en M1. Grílalo en M2: el entregable es un diff en este archivo.

Ticket: [`tickets/T-01.md`](../tickets/T-01.md). Pedido por María (tesorería, Andes Lab).

## Problema

Tesorería de Andes Lab arma a mano, cada cierre de mes, el CSV de facturas que envía al banco: le toma cerca de una hora y se cuelan facturas anuladas.

## Alcance

Un comando nuevo en la CLI que genera ese CSV:

```
node src/cli.js export-csv [--out <archivo>] [--month YYYY-MM]
```

- Lee las facturas de `src/data/invoices.json` (mismo origen que `list`).
- Omite siempre las facturas anuladas (`status` = `void`).
- Las filas salen en el mismo orden que en el JSON (el mismo de `list`). No se reordenan.
- `--out <archivo>`: ruta del archivo de salida. Por defecto `facturas.csv` en el directorio actual. Acepta cualquier nombre, por ejemplo `export-tesoreria-agosto.csv`. Si el archivo ya existe, se sobrescribe. Si la carpeta de destino no existe, no se crea: es un error.
- `--month YYYY-MM`: opcional. Deja solo las facturas cuyo `issuedAt` cae en ese mes. Sin el flag, exporta todos los meses.
- Formato del archivo, pensado para Excel en Windows con configuración regional de Chile:
  - Codificación UTF-8 con BOM, para que los acentos se vean bien.
  - Separador `;` (supuesto: se confirma en la validación manual).
  - Primera fila con encabezados: `id;cliente;fecha;monto;estado`.
  - `fecha` tal como viene (`YYYY-MM-DD`).
  - `monto` como entero sin símbolo ni separador de miles (`1250000`, no `$1.250.000`).
  - `estado` con el valor crudo del JSON (`paid`, `open`), igual que hoy en `list`. No se traduce.
  - Un campo que contenga `;`, comillas o salto de línea va entre comillas dobles, con las comillas internas duplicadas.
- Al terminar imprime en stdout `<n> facturas exportadas a <ruta>`.
- Ante un error (argumentos inválidos o carpeta inexistente) sale con código distinto de 0, explica el problema en stderr y no crea ni modifica el archivo.

## Aceptación observable

Con el fixture actual (`F-1001` a `F-1004`, donde `F-1003` está anulada):

1. `export-csv --out <tmp>/facturas.csv` sale con código 0 y el archivo tiene el encabezado más `F-1001`, `F-1002` y `F-1004`, en ese orden. `F-1003` no aparece.
2. `export-csv` sin `--out` escribe `facturas.csv` en el directorio de trabajo.
3. `export-csv --out <tmp>/export-tesoreria-agosto.csv` escribe exactamente en esa ruta.
4. Los primeros tres bytes del archivo son el BOM UTF-8 (`EF BB BF`).
5. La primera línea (sin BOM) es `id;cliente;fecha;monto;estado`.
6. La fila de `F-1001` es `F-1001;Constructora Sur;2026-08-02;1250000;paid`.
7. `export-csv --month 2026-08` exporta solo `F-1001` y `F-1002`.
8. `export-csv --month 2026-09` exporta solo `F-1004` (la anulada `F-1003` no sale aunque sea de septiembre).
9. `export-csv --month 2026-01` (mes sin facturas) sale con código 0 y deja un archivo con solo el encabezado.
10. Cada uno de estos casos sale con código distinto de 0, escribe en stderr y no crea el archivo:
    - `--month agosto`
    - `--month 2026-13`
    - `--out` sin valor
    - un flag desconocido, por ejemplo `--mes 2026-08`
    - `--out <tmp>/no-existe/facturas.csv` (carpeta inexistente)
11. La función que arma una fila escapa los campos así:
    - el cliente `Sur; Norte` sale como `"Sur; Norte"`
    - el cliente `Taller "El Sol"` sale como `"Taller ""El Sol"""`
    - un campo sin `;`, comillas ni salto de línea sale sin comillas.
12. `list` y `get` siguen igual: los tests actuales de `test/invoices.test.js` pasan.
13. Si `<tmp>/facturas.csv` ya existe con otro contenido, `export-csv --out <tmp>/facturas.csv` lo reemplaza por el export nuevo.
14. `export-csv --out <tmp>/facturas.csv` imprime en stdout exactamente `3 facturas exportadas a <tmp>/facturas.csv`.

### Validación manual (antes de cerrar el ticket)

No es un test automático. Se anota el resultado en `workdocs/status.md`.

- María corre `node src/cli.js export-csv --month 2026-08 --out export-tesoreria-agosto.csv`, abre el archivo con doble clic en su Excel y ve 5 columnas separadas, con los acentos bien. Si no se ve así, el supuesto del separador `;` se revisa antes de mergear.

## Fuera de alcance

- Incluir anuladas en el export (no hay flag para eso).
- Endpoint HTTP, login o despliegue.
- Otros formatos (XLSX, JSON) o columnas configurables.
- Filtros por rango de fechas, cliente o estado distintos de `--month`.
- Formatear montos con `$` o separador de miles, o cambiar la fecha a `DD-MM-YYYY`.
- Traducir los valores de `estado`.
- Reordenar las filas.
- Proteger un archivo existente (`--force` o confirmación) o crear carpetas de destino.
- Cambios a `list`, `get` o a `src/data/invoices.json`.
- Envío del archivo al banco.
