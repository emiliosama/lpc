# status.md

Seguimiento y bitácora. No sustituye a la spec.

Edita este archivo en tu rama y cambia solo tu fila, para que el merge del Día 3 no tenga conflictos.

## Roles

El merge del equipo no aprueba a quien no rotó. Cada persona anota su nombre en al menos 2 roles.

| Persona | Roles (por ejemplo: redacción o grill de la spec, dueña de test, comentario de review) |
|---|---|
| Gerardo | |
| dzumelzu | |
| Emilio | |
| | |
| | |

## Grill

| Fecha | Quién | Archivo | Notas |
|---|---|---|---|
| | | `workdocs/SPEC.md` | |

## Tests de aceptación

Anota el comando y el resultado. Primero rojo. Después verde, o un gap citado.

| Story | Comando | Resultado | Gap (si sigue rojo) |
|---|---|---|---|
| T-01-story-1 | `npm test` (`test/invoices-csv.test.js`) | Rojo (2026-10-15): `ERR_MODULE_NOT_FOUND: Cannot find module 'src/invoices-csv.js'`. tests 5, pass 4, fail 1. Verde (2026-10-19): `src/invoices-csv.js` con `toCsv` y `escapeField`. tests 6, pass 6, fail 0. Rojo C11 (2026-10-19, rama `feat/T-01-story-1-c11`): tests 45, pass 43, fail 2; sale `=HYPERLINK(...)`, `+F-8`, `@Sur` y `-Sur` sin `'`. Verde C11 (2026-10-19): `neutralizeFormula` en `id` y `cliente`. tests 45, pass 45, fail 0. Rojo C12 a C14 (2026-10-19, rama `feat/T-01-story-1-c12-c14`, spec del PR #14): tests 52, pass 49, fail 3; sale `\tSur` y `\rSur` sin `'`, `1250000.5` con punto y `null` como texto. Verde C12 a C14 (2026-10-19): tabulador y CR en `neutralizeFormula`, `amountField` con coma decimal y `textField` para nulos. tests 52, pass 52, fail 0; el CSV real de agosto sale idéntico | |
| T-01-story-2 | `npm test` | Rojo (15-10): `✖ test\export-options.test.js` con `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\src\export-options.js'`; `tests 5, pass 4, fail 1` (los 4 de `invoices.test.js` siguen verdes). Verde (15-10, tras crear `src/export-options.js`): `tests 22, pass 22, fail 0`, local con Node 26; falta confirmar en la CI (Ubuntu, Node 20). **Caso de borde `--out` vacío o solo espacios (19-10, agregado a C6):** antes la CLI salía con 1 y `no se pudo escribir : ENOENT` con `--out ""`, y con `--out "   "` salía con 0 y creaba un archivo de nombre en blanco. Rojo: `tests 44, pass 40, fail 4` (2 en `export-options.test.js`, 2 en `export-csv.cli.test.js`). Verde tras validar `trim()` en `parseExportArgs`: `tests 44, pass 44, fail 0`, local con Node 26. | Falta confirmar en la CI (Ubuntu, Node 20). |
| T-01-story-3 | `npm test` (Node v20.20.2, Windows, `test/export-csv.cli.test.js`) | **Rojo (2026-10-15):** `# tests 20`, `# pass 4`, `# fail 16`. Fallan los 16 nuevos (C1–C7, C10 y uso general): la CLI responde `usage: node src/cli.js <list\|get> [id]` con código 1, sin `export-csv` en stderr y sin archivo. Los 4 de `test/invoices.test.js` siguen en verde (C9). **Verde contra contratos (2026-10-19):** con `src/export-options.js` de `origin/feat/T-01-story-2` y un `toCsv` provisional según el contrato de la Story 1, copiados sin commitear, `# tests 20`, `# pass 20`, `# fail 0`. **Verde con `main` integrado (2026-10-19, Stories 1 y 2 mergeadas):** `# tests 40`, `# pass 40`, `# fail 0`. | Falta confirmar en la CI (Ubuntu, Node 20). |
| T-02-story-1 | `npm test` (`test/invoices-api.test.js`, Node v20.20.2, Windows) | **Rojo (2026-10-19):** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\src\invoice-query.js'`; `# tests 54`, `# pass 53`, `# fail 1` (los 53 de T-01 siguen verdes). **Verde (2026-10-19):** `src/invoice-query.js`, `src/http-send.js` y `src/server.js` con `/api/invoices`. `# tests 62`, `# pass 62`, `# fail 0`. Smoke manual: `node src/server.js` imprime `Panel de facturas: http://localhost:3000`, `?status=open&month=2026-08` trae solo `F-1002` y `?month=agosto` da `400` con `error`. **CI verde (2026-10-19):** el check `test` (Ubuntu, Node 20) del PR #19 pasó, y el PR se mergeó a `main` (`ba0511b`). | |
| T-02-story-2 | `npm test` (`test/panel.test.js`) | **Rojo (2026-10-19):** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\src\server.js'`; `tests 54, pass 53, fail 1`. **Verde (2026-10-19, primer corte: tabla):** `src/server.js` con `createServer()`, `/` y `/api/invoices` sin filtros; `tests 56, pass 56, fail 0`. **Rojo C22 a C25 (2026-10-19):** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\src\web\panel.js'`; `tests 54, pass 53, fail 1`. **Verde C22 a C25 (2026-10-19):** `src/web/panel.js` con `totalAmount` y `queryString`, `/panel.js` y la página con filtros, `#total` y `#download`; `tests 59, pass 59, fail 0`, local con Node 26. **Merge con `main` (2026-10-19, con la Story 1 de Emilio, PR #19):** `src/server.js` queda con la versión de la Story 1 más las rutas `/` y `/panel.js`. `tests 68, pass 68, fail 0`, local con Node 26; la tabla ya filtra por estado y mes. | Falta confirmar en la CI. |
| T-02-story-3 | `npm test` (`test/export-csv.http.test.js`) | Rojo (2026-10-19): `ERR_MODULE_NOT_FOUND: Cannot find module 'src/server.js'`, el esperado del PLAN mientras la Story 1 no esté en `main`. tests 54, pass 53, fail 1. Contra un `createServer()` provisional que responde `404`, sin commitear: tests 8, pass 0, fail 8, los 8 por aserción (C19 ×4, C20 y C21 ×3). **Verde con `main` integrado (2026-10-19, Story 1 mergeada, PR #19):** `src/routes/export-csv.js` y la ruta `/api/export.csv` en `src/server.js`. tests 70, pass 70, fail 0, local. CI (Ubuntu, Node 20) en verde en el PR #21. | |

## Workers

Una tarea acotada y su resumen. Si hubo implementación y falta esta línea, M4 no pasa.

| Story | Tarea | Resumen |
|---|---|---|
| T-01-story-1 | Explore (solo lectura): revisar `test/invoices-csv.test.js` contra C1 (sin BOM) y C8 de la SPEC y la Story 1 del PLAN | Sin gaps: asserta los strings exactos con CRLF y sin BOM, y nada fuera de la spec. Señaló un BOM literal invisible en el `startsWith`, que se cambió por el escape `'﻿'`. |
| T-01-story-2 | Explore (solo lectura): revisar `test/export-options.test.js` contra C2 a C6 de la spec y la Story 2 del plan. | Sin contradicciones con spec ni fixture. Faltaban `--include-void` repetido, `--out` repetido, `--out` seguido de `--...` y el estado `void` de F-1003 en C3; se agregaron. |
| T-01-story-3 | Worker general-purpose (Sonnet), solo lectura: revisar `test/export-csv.cli.test.js` contra C1 a C7, C10 y el uso general de la spec, contra el `src/cli.js` actual y por portabilidad Ubuntu/Windows. | Cubre los criterios de la story con fidelidad. Todos los tests fallan contra la CLI actual; los casos C6 fallan porque exigen `export-csv` en stderr. Sin problemas de rutas ni de fin de línea. Nota para el código: escribir el BOM como `﻿`, no como carácter invisible. |
| T-02-story-1 | Explore (Sonnet, solo lectura): revisar `test/invoices-api.test.js` y `src/server.js`, `src/invoice-query.js` y `src/http-send.js` contra C15 a C19 y C26 de la spec y los contratos de la Story 1 del plan. | Sin desvíos de contrato ni código fuera de la spec. C15 y C19 no exigían `charset=utf-8`; se cambió a igualdad exacta. Quedan sin test, por estar fuera de alcance o de la story: métodos distintos de `GET`, el arranque en el 3000 y C19 sobre `/api/export.csv` (Story 3). |
| T-02-story-3 | Explore (solo lectura): revisar `test/export-csv.http.test.js` y `src/routes/export-csv.js` contra C19 a C21 de la spec y la Story 3 del plan, y por portabilidad Ubuntu/Windows. | Cubre C19 (4 valores), C20 (bytes exactos, `Content-Type` y `Content-Disposition`) y C21 (3 casos); sin contradicciones con spec ni fixture. Señaló un BOM literal invisible en el handler, que se cambió por el escape `\uFEFF`. Matiz: los casos de C21 no verifican el BOM (lo hace C20). |
| | | |

## Día 3

**Mergeó (2026-10-19, en el orden del plan: 2, 1 y 3 al final):**

- T-01-story-2, PR #6 (dzumelzu): `src/export-options.js` con `parseExportArgs`, `selectInvoices` y `UsageError` (C2–C6).
- T-01-story-1, PR #8 (Gerardo): `src/invoices-csv.js` con `toCsv` y el escape de campos (C1 sin BOM y C8).
- T-01-story-3, PR #7 (Emilio): comando `export-csv` en `src/cli.js`, con BOM, escritura del archivo y errores (C1–C7, C10). La CI (Ubuntu, Node 20) pasó en verde. En un checkout limpio de `main` tras el merge: `npm test` da `# tests 40`, `# pass 40`, `# fail 0`, y `export-csv --month 2026-08` escribe `EF BB BF` más las 3 líneas exactas de C1. C9 sigue en verde.

**Quedó fuera (gap, no vendido como merge):**

- Revisión manual en Excel: María (tesorería) todavía no abre el CSV de agosto (`node src/cli.js export-csv --month 2026-08`) para confirmar columnas y acentos, según los Supuestos de la spec. Es la única verificación que no se puede automatizar. El ticket T-01 no se cierra hasta que confirme.

**PRs:**
- T-01-story-1 (Gerardo): https://github.com/emiliosama/lpc/pull/8
- T-01-story-1, C11 (Gerardo): https://github.com/emiliosama/lpc/pull/13
- T-01-story-1, C12 a C14 (Gerardo): https://github.com/emiliosama/lpc/pull/15
- T-01-story-2 (dzumelzu): https://github.com/emiliosama/lpc/pull/6
- T-01-story-3 (Emilio): https://github.com/emiliosama/lpc/pull/7
- T-02-story-1 (Emilio): https://github.com/emiliosama/lpc/pull/19
