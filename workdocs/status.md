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
| T-01-story-1 | `npm test` (`test/invoices-csv.test.js`) | Rojo (2026-10-15): `ERR_MODULE_NOT_FOUND: Cannot find module 'src/invoices-csv.js'`. tests 5, pass 4, fail 1. Verde (2026-10-19): `src/invoices-csv.js` con `toCsv` y `escapeField`. tests 6, pass 6, fail 0. Rojo (2026-10-19, casos borde C11 a C13 y `TypeError` del contrato): tests 32, pass 28, fail 4; sale `=1+1` sin `'`, `1250000.5` con punto, `null` como texto y `Cannot read properties of null` sin nombrar `toCsv`. Verde (2026-10-19): `textField`, `amountField` y validación de arreglo en `toCsv`. tests 32, pass 32, fail 0 | |
| T-01-story-2 | | | |
| T-01-story-2 | `npm test` | Rojo (15-10): `✖ test\export-options.test.js` con `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\src\export-options.js'`; `tests 5, pass 4, fail 1` (los 4 de `invoices.test.js` siguen verdes). Verde (15-10, tras crear `src/export-options.js`): `tests 22, pass 22, fail 0`, local con Node 26; falta confirmar en la CI (Ubuntu, Node 20). | |
| T-01-story-3 | | | |

## Workers

Una tarea acotada y su resumen. Si hubo implementación y falta esta línea, M4 no pasa.

| Story | Tarea | Resumen |
|---|---|---|
| T-01-story-1 | Explore (solo lectura): revisar `test/invoices-csv.test.js` contra C1 (sin BOM) y C8 de la SPEC y la Story 1 del PLAN | Sin gaps: asserta los strings exactos con CRLF y sin BOM, y nada fuera de la spec. Señaló un BOM literal invisible en el `startsWith`, que se cambió por el escape `'﻿'`. |
| T-01-story-2 | Explore (solo lectura): revisar `test/export-options.test.js` contra C2 a C6 de la spec y la Story 2 del plan. | Sin contradicciones con spec ni fixture. Faltaban `--include-void` repetido, `--out` repetido, `--out` seguido de `--...` y el estado `void` de F-1003 en C3; se agregaron. |
| | | |

## Día 3

**Mergeó:**

**Quedó fuera (gap, no vendido como merge):**

**PRs:**
- T-01-story-1 (Gerardo): https://github.com/emiliosama/lpc/pull/8
