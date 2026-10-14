# Workshop Devs: template brownfield Tesseron

Respaldo del lab **Técnicas aplicadas de IA generativa en desarrollo de software**. Úsalo si no tienes escritura en el repo de tu empresa (CodeCommit).

Es un producto de mentira: un listado de facturas de **Andes Lab**. El pedido de tesorería está en `tickets/T-01.md`. El equipo escribe la spec.

## Pre-flight

```bash
git clone git@github.com:Tesseron-Chile/<repo-del-equipo>.git
cd <repo-del-equipo>
npm test
```

Necesitas Node 20, git, `gh` y Claude Code con sesión iniciada (CLI o escritorio). Abre Claude Code en este directorio.

## Loop

`Ticket → SPEC.md → PLAN.md → test de aceptación (rojo) → story → PR → review → merge`

El protocolo está en `AGENTS.md`. El equipo tiene un `SPEC.md` y un `PLAN.md`. Cada persona tiene una rama `feat/<ticket-id>-story-<n>`.

## Qué trae este repo

- Código y tests que pasan en `main` (`npm test`).
- El ticket `tickets/T-01.md`.
- `CLAUDE.md` de una línea (`@AGENTS.md`) y `AGENTS.md`.
- Plantillas vacías: `workdocs/SPEC.md`, `workdocs/PLAN.md` y `workdocs/status.md`. En `status.md` cada persona edita su fila en su rama.
- Las skills `grill-me`, `plan-worktree`, `test-rojo` y `pr-tesseron`.
- El PR template Tesseron.
- CI mínima en `main` y en los PRs.

No trae la spec llena: eso es M1.

## Catálogo de skills (18:00)

Tres skills para M3 a M6. El relator apunta a [`CATALOG.md`](./CATALOG.md), que explica dónde van según la carpeta donde abres Claude Code y cómo abrir el PR en GitHub o en CodeCommit. `grill-me` ya está en el repo.
