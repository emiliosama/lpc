# Catálogo de skills (M3 a M6)

A las 18:00 del Día 1, en el LAB de catálogo de 5 min, el relator apunta aquí.

Son tres skills: plan-worktree, test-rojo y pr-tesseron. `grill-me` ya está en el repo, no la copies de nuevo. Las skills se copian del Drive, no se instalan.

No es tesseron-tools. Quedan afuera: ralph, writing, journey y sprint.

| Skill | Módulo | Prompt |
|---|---|---|
| `plan-worktree` | M3 | *Con `main` actualizado, arma `PLAN.md` y el worktree de MI story. No codees el feature.* |
| `test-rojo` | M4 | *Antes de codear: el test de aceptación de mi story. Córrelo. Tiene que fallar.* |
| `pr-tesseron` | M5 | *Abre el PR con el template Tesseron. Links al ticket y a `SPEC.md`. No mergees.* |

## Dónde van las carpetas

1. **Equipos con el repo template:** las skills ya están en `.claude/skills/`. Abre Claude Code dentro del repo.
2. **Equipos con el repo de la empresa, Claude Code en la carpeta padre:** copia las carpetas a `<padre>/.claude/skills/`. Crea también `<padre>/CLAUDE.md` con una línea: `@<repo>/CLAUDE.md`.
3. **Worktrees:** copia las carpetas a `.claude/skills/` del repo y haz commit en `main` antes de crear el worktree. O cópialas a `~/.claude/skills/`, que funciona en todos los casos.

Probado el 12-10: abierto en la carpeta padre, Claude Code no ve las skills de `<padre>/<repo>/.claude/skills/` ni lee el `CLAUDE.md` del repo hijo. Un worktree tampoco hereda las skills de la carpeta padre.

## Vía del PR

`pr-tesseron` elige la vía según `git remote get-url origin`:

1. **GitHub (repo template):** `gh pr create --draft`.
2. **CodeCommit (repo de la empresa):** `aws codecommit create-pull-request`, con el prefijo `WIP:` en el título porque CodeCommit no tiene draft. Necesitas credenciales AWS que lleguen al repo.

## Si no cargan

Si Claude Code no carga una skill, anota el gap en `workdocs/status.md` y sigue con `grill-me` y la skill de tu dominio. Nadie debuggea las skills en plenaria.

Las carpetas quedan en git. Cuando termine el workshop, salen con el clone.
