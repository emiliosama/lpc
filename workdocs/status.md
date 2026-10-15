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
| T-01-story-1 | | | |
| T-01-story-2 | `npm test` | Rojo (15-10): `✖ test\export-options.test.js` con `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\src\export-options.js'`; `tests 5, pass 4, fail 1` (los 4 de `invoices.test.js` siguen verdes). | Falta implementar `src/export-options.js` (`UsageError`, `parseExportArgs`, `selectInvoices`). |
| T-01-story-3 | | | |

## Workers

Una tarea acotada y su resumen. Si hubo implementación y falta esta línea, M4 no pasa.

| Story | Tarea | Resumen |
|---|---|---|
| T-01-story-2 | Explore (solo lectura): revisar `test/export-options.test.js` contra C2 a C6 de la spec y la Story 2 del plan. | Sin contradicciones con spec ni fixture. Faltaban `--include-void` repetido, `--out` repetido, `--out` seguido de `--...` y el estado `void` de F-1003 en C3; se agregaron. |
| | | |

## Día 3

**Mergeó:**

**Quedó fuera (gap, no vendido como merge):**

**PRs:**
