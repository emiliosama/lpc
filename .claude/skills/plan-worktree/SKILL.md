---
name: plan-worktree
description: Derive a team PLAN.md with a technical design (diseño técnico) per story and mount one git worktree per person. Use when writing PLAN.md, splitting stories, creating feat/<ticket-id>-story-<n> branches, opening Claude in a worktree, or the user says arma el plan / crea el worktree.
---

Lee `workdocs/SPEC.md` (aceptación y fuera de alcance) antes de partir stories.

El equipo tiene un `workdocs/PLAN.md`. Cada persona tiene una story, y cada story cabe en un PR. El diseño técnico va dentro del plan: qué toca, contratos y orden. No hay `DESIGN.md`.

1. Escribe el plan con Plan Mode (`opusplan`, con Opus).
2. Haz commit de `PLAN.md` a `main` y push. Si las ramas se parten antes, aparecen dos planes.
3. Con `main` actualizado, crea un worktree por persona. No codees el feature. Corre exactamente:

```
git pull origin main
git worktree add -b feat/<ticket-id>-story-<n> ../<equipo>-story-<n> main
cd ../<equipo>-story-<n>
git push -u origin feat/<ticket-id>-story-<n>
```

4. Reemplaza `<ticket-id>`, `<equipo>` y `<n>` con los valores de `PLAN.md`.
5. Cierra Claude Code y ábrelo de cero en ese directorio. No uses `claude -c`, `/resume` ni pegues el chat.

Un worktree hereda `.claude/skills/` de `main`: haz commit de las skills antes de crearlo. No hereda las skills de la carpeta padre. Si faltan, cópialas a `~/.claude/skills/`.

Los commits siguen Conventional Commits.
