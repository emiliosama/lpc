# AGENTS.md

Protocolo permanente de este repo. Sobrevive a la sesión: una sesión nueva reconstruye el trabajo leyendo git, no el chat.

Repositorio: **workshop-devs-template** (lab brownfield Tesseron). Los equipos que usan el template trabajan sobre un fork privado de este repo: una persona del equipo hace el fork a su cuenta e invita al resto.

## Reglas

1. **El estado vive en git, no en el hilo.** No uses `claude -c`, `/resume` ni pegues el chat para continuar. Si el agente no reconstruye el trabajo, arregla el markdown, no el prompt.
2. **Fuentes de verdad, en este orden:** `workdocs/SPEC.md` (qué construir), `workdocs/PLAN.md` (stories y diseño técnico), `workdocs/status.md` (bitácora y seguimiento; no sustituye la spec), `tickets/*.md` (input).
3. **Un SPEC y un PLAN por equipo.** No hay cuatro specs ni cuatro repos.
4. **Antes de codear,** lee la spec (aceptación y fuera de alcance) y tu story en el plan. El diff que no está en la spec no entra.
5. **Código de producto desde M4,** contra un criterio de la spec y después de un test de aceptación en rojo.
6. **Sin secretos.** Ningún token, password, API key ni dato de clientes reales en código, fixtures, logs o docs.
7. **El humano hace el merge.** El agente abre el PR y para.

## Sesión nueva

1. Cierra Claude Code.
2. Ábrelo de cero en el directorio del repo o del worktree. No uses `-c`, `/resume` ni pegues el chat.
3. Lee en este orden: este archivo, `README.md`, `tickets/`, `workdocs/SPEC.md`, `workdocs/PLAN.md` y `workdocs/status.md`.
4. Responde: ¿en qué story estoy, según la rama `feat/<ticket-id>-story-<n>`? ¿Cuál es el criterio de aceptación?

## Archivos

| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | Una línea: `@AGENTS.md`. Hace que Claude Code lea este protocolo. |
| `tickets/*.md` | Input. Dispara el trabajo. No es la spec. |
| `workdocs/SPEC.md` | Problema, alcance, aceptación observable y fuera de alcance. Uno por equipo. |
| `workdocs/PLAN.md` | Una story por persona, con su diseño técnico: qué toca, contratos y orden. Cada story cabe en un PR. |
| `workdocs/status.md` | Seguimiento y bitácora: roles, grill, test rojo y verde, workers y gaps. Al cerrar el Día 3, los links a los PRs. |
| `.claude/skills/` | `grill-me` (M2), el catálogo de skills (`plan-worktree`, `test-rojo`, `pr-tesseron`) y la skill de tu dominio, que escribe el equipo. |

El diseño técnico de cada story va dentro de `PLAN.md`. No hay `DESIGN.md`.

## Seguimiento en status.md

1. Edita `workdocs/status.md` en tu rama.
2. Cambia solo tu fila, para que el merge del Día 3 no tenga conflictos.
3. El estado de cada story vive en la tabla "Tests de aceptación".

## Dónde van las skills

Claude Code carga las skills desde el directorio donde lo abres. Probado el 12-10: abierto en una carpeta padre, no ve `<padre>/<repo>/.claude/skills/` ni lee el `CLAUDE.md` del repo hijo.

| Dónde abres Claude Code | Dónde van las skills | Qué más hace falta |
|---|---|---|
| Dentro del repo | `.claude/skills/` del repo | Nada. `CLAUDE.md` ya apunta a `AGENTS.md`. |
| En la carpeta padre de varios repos | `<padre>/.claude/skills/` | Un `<padre>/CLAUDE.md` que importe el del repo: `@<repo>/CLAUDE.md`. |
| En un worktree | `.claude/skills/` del repo, con commit en `main` antes de crear el worktree | O `~/.claude/skills/`, que funciona en todos los casos. |

Un worktree no hereda las skills de la carpeta padre.

## Grill

La skill `grill-me` está en `.claude/skills/grill-me`. Prompt: `/grill-me workdocs/SPEC.md`. Ataca ambigüedad, alcance inflado y aceptación no testeable. El entregable es un diff commiteado en `SPEC.md`, no un grill oral.

## Catálogo de skills

Tres skills para M3 a M6. Mira `CATALOG.md`. A las 18:00 del Día 1, en el LAB de catálogo de 5 min, el relator apunta ahí.

## Ramas y worktrees

Haz commit de los contratos (`SPEC.md`, `PLAN.md`, la skill del equipo) a `main` antes de partir ramas.

Cada persona tiene una rama en su worktree:

```
git pull origin main
git worktree add -b feat/<ticket-id>-story-<n> ../<equipo>-story-<n> main
cd ../<equipo>-story-<n>
git push -u origin feat/<ticket-id>-story-<n>
```

Abre Claude Code en ese directorio.

## Commits y PRs

Los commits siguen Conventional Commits: `<type>(optional-scope): <description>`.

Cada persona abre un PR. Nadie hace merge hasta que un humano lo decide. El body linkea el ticket y `workdocs/SPEC.md`.

Elige la vía según `git remote get-url origin`:

| Remoto | Vía | Draft |
|---|---|---|
| GitHub (equipos con el repo template) | `gh pr create --draft --title "<type>: <description>" --body-file /tmp/pr-body.md` | Sí, con `--draft` |
| CodeCommit (equipos con el repo de la empresa) | `aws codecommit create-pull-request --title "WIP: <type>: <description>" --description "$(cat /tmp/pr-body.md)" --targets repositoryName=<repo>,sourceReference=<rama>,destinationReference=main` | No: usa el prefijo `WIP:` en el título |

1. Llena `.github/pull_request_template.md`: Contexto, Tipo, Cambios y Notas de migración en español, y `For automated reviewers` en inglés.
2. Con CodeCommit, pasa el body como texto: no lee el template.
3. Con CodeCommit, hacen falta credenciales AWS que lleguen al repo.

Veto en el diff: secretos, auth, contratos y migraciones.

## Tests

```
npm test
```

Los tests de `main` pasan. El test de aceptación de cada story se escribe antes del código y falla, porque el criterio todavía no se cumple. Pega el comando y el resultado en `status.md`. Si sigue rojo, escribe un gap honesto en `status.md`: eso no es ciclo cerrado.

## Workers

Un worker (subagente) por story o test, con una tarea acotada. Anota la tarea y el resumen en `status.md`. Explore y Plan built-in cuentan como worker de investigación. No hay flota de workers.

## Modelos

Opus escribe la spec y el plan. Sonnet codea el Día 2.
