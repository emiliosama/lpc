---
name: grill-me
description: Stress-test a spec or plan until ambiguities, inflated scope, and untestable acceptance are resolved. Use when the user says grill me, grill this file, or asks to attack SPEC.md or PLAN.md.
---

Haz el grill al archivo que indique el usuario. Si no indica ninguno, usa `workdocs/SPEC.md`.

1. Lee el archivo completo antes de preguntar.
2. Si el repo responde la pregunta (`tickets/`, código, tests), explora en vez de preguntar.

Ataca en este orden:

1. **Ambigüedad**: palabras que un extraño no entiende sin el ticket abierto.
2. **Alcance inflado**: trabajo que no cabe en las stories del lab.
3. **Aceptación no testeable**: ningún test que falle puede salir del criterio.

Reglas:

- Haz una pregunta a la vez y recomienda una respuesta, para que el equipo decida rápido.
- Recorre cada rama de decisión y resuelve las dependencias una por una.
- El entregable es un **diff commiteado** en ese archivo. Un grill oral o un resumen en el chat no cuentan.
- No escribas código de producto, no crees un segundo `SPEC.md` y no pegues el ticket en la spec.

Cuando el archivo tenga problema en una frase, alcance, aceptación observable y fuera de alcance, para y pide al equipo que haga commit del diff.
