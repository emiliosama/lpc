---
name: test-rojo
description: Write the acceptance test before product code and run it until it fails on purpose. Use when starting a story, before implementing, recording evidence in status.md, or the user says test rojo / test de aceptación.
---

Antes de tocar código de producto, lee el criterio de tu story en `workdocs/SPEC.md` y el diseño técnico en `workdocs/PLAN.md`.

1. Escribe (o toma del template) el test de aceptación que asserta ese criterio.
2. Corre el test con el comando de tests del repo, el que dice `AGENTS.md`: por ejemplo `npm test` en el template o `./mvnw -q test` en un repo Maven.

3. Confirma que falla. Si pasa, el test no prueba el criterio: reescribe la aserción.
4. Pega el comando y el resultado en tu fila de `workdocs/status.md`, sección "Tests de aceptación". Edita solo tu fila, en tu rama.
5. Lanza un worker (subagente) acotado a la story o al test. Anota en `workdocs/status.md`, sección "Workers", la tarea y el resumen. Explore y Plan built-in cuentan.

Reglas:

- El diff que no está en la spec no entra, porque el PR se revisa contra `SPEC.md`.
- Deja las credenciales fuera de los fixtures.
- Si el test sigue rojo al cierre, escribe el trabajo que falta en `workdocs/status.md`. M4 pasa, el ciclo no se cierra y no hay merge.
