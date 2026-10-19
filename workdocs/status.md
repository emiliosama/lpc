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
| T-01-story-2 | | | |
| T-01-story-3 | `npm test` (Node v20.20.2, Windows, `test/export-csv.cli.test.js`) | **Rojo (2026-10-15):** `# tests 20`, `# pass 4`, `# fail 16`. Fallan los 16 nuevos (C1–C7, C10 y uso general): la CLI responde `usage: node src/cli.js <list\|get> [id]` con código 1, sin `export-csv` en stderr y sin archivo. Los 4 de `test/invoices.test.js` siguen en verde (C9). | Sigue rojo hasta implementar la rama `export-csv` en `src/cli.js` (y que las Stories 1 y 2 estén en `main`). |

## Workers

Una tarea acotada y su resumen. Si hubo implementación y falta esta línea, M4 no pasa.

| Story | Tarea | Resumen |
|---|---|---|
| T-01-story-3 | Worker general-purpose (Sonnet), solo lectura: revisar `test/export-csv.cli.test.js` contra C1 a C7, C10 y el uso general de la spec, contra el `src/cli.js` actual y por portabilidad Ubuntu/Windows. | Cubre los criterios de la story con fidelidad. Todos los tests fallan contra la CLI actual; los casos C6 fallan porque exigen `export-csv` en stderr. Sin problemas de rutas ni de fin de línea. Nota para el código: escribir el BOM como `﻿`, no como carácter invisible. |

## Día 3

**Mergeó:**

**Quedó fuera (gap, no vendido como merge):**

**PRs:**
