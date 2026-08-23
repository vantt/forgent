# fgOS `repo/` path prefix fix — CONTEXT

## Feature boundary

`tsk-3fb`. Every fgOS plugin skill (`plugins/fgOS/skills/*/SKILL.md`) shells
out to `bin/fgos.mjs` using a hardcoded path template of the form
`${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs`. That template is only correct
when this repo (forgentX) is checked out nested one level inside a `bee`
workshop, at `<workshop-root>/repo/`. When forgentX is the project root
itself (standalone, no outer workshop), `bin/fgos.mjs` lives directly at
`${CLAUDE_PROJECT_DIR}/bin/fgos.mjs` — the `repo/` segment does not exist,
and every wrapped verb fails with `MODULE_NOT_FOUND`.

This item locks the decisions needed to make the 20 plugin skills (and the
2 specs that document their path convention) resolve the right path in
either context, instead of assuming one.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Path resolution goes through an environment variable that a `bee` workshop sets for itself when it nests fgOS underneath it (naming left to planning). When that variable is **not** set, the default is standalone: `${CLAUDE_PROJECT_DIR}/bin/fgos.mjs` — no `repo/` segment. The variable, when set, supplies whatever nested-prefix segment the workshop actually uses. |
| D2 | Fix scope is the 20 `plugins/fgOS/skills/*/SKILL.md` files plus the 2 spec docs that document the path convention (`docs/specs/fgos-plugin.md:167-168`, `docs/specs/distribution.md`). `docs/backlog.md`'s STR88 entry is explicitly **out of scope** — it is a closed historical log entry that correctly reflects the convention as it stood at the time; it is not rewritten. |

## Pinned terms

- **"xưởng" / workshop / `bee`** — the outer framework forgentX was
  originally developed inside; when active, it checks this repo out at
  `<workshop-root>/repo/` rather than at its own root.
- **Standalone** — forgentX running as the project root directly (no
  outer workshop), the layout this repo is in today.

## Scout evidence

- `git log --all --diff-filter=A --name-only | grep '^repo/'` — empty.
  `repo/` has never existed as a real directory inside this git repo's
  history; it is the name of a directory *containing* this checkout when
  nested inside a workshop, not a subdirectory of it.
- `git log --oneline --follow -- plugins/fgOS/skills/list/SKILL.md` — one
  commit only (`94f314e`), meaning the wrong prefix was baked in from the
  plugin's creation, not introduced by a later rename/move regression.
- `grep -rn "repo/bin/fgos.mjs" plugins/fgOS/skills/*/SKILL.md` — 20 files
  hit (list, submit, pick, move, return, ask, answer, ready, stale, check,
  graph, conflicts, rollup, discover, cook, goal, and others).
- `grep -n "repo/bin/fgos.mjs" docs/specs/fgos-plugin.md docs/specs/distribution.md`
  — both specs document the same `repo/`-prefixed convention the skills
  copied.
- `grep -rn "repo/bin/fgos.mjs\|CLAUDE_PROJECT_DIR" .claude/skills/fgos/*/SKILL.md`
  — no hits. The internal dev-session skills (`fgos-routing`,
  `fgos-coding-exploring`, etc.) never hardcode this path; they assume the
  session is already `cd`'d into the repo and call `fgos`/`./bin/fgos.mjs`
  directly. Out of scope for this item — they don't have the bug.

## Canonical references

- `plugins/fgOS/skills/*/SKILL.md` (20 files) — the broken templates.
- `docs/specs/fgos-plugin.md:167-168` — spec documenting the convention.
- `docs/specs/distribution.md` — spec documenting the same convention
  (also used for many unrelated file paths as a general "this repo, path
  X" notation — only the `bin/fgos.mjs` line is in scope here, not every
  `repo/`-prefixed path in that doc).
- `docs/backlog.md` STR88 — historical log entry, explicitly not touched.

## Outstanding questions deferred to planning

- Exact environment variable name for D1 (e.g. `FGOS_BIN_DIR` was floated
  during clarify as an example only, not locked).
- Exact probe/resolution code shape (a shared helper each SKILL.md's step
  references vs. inlining the same few lines in all 20 files) — an
  implementation choice, not a product decision.
- Whether `docs/specs/distribution.md`'s other `repo/`-prefixed paths
  (unrelated to `bin/fgos.mjs`) need any adjustment — out of scope per D2,
  flagged here only so planning doesn't accidentally widen scope back in.
