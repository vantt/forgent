# plan.md — tsk-3rg

Mode: small

No `CONTEXT.md` — discovery returned `clear` directly. Every claim traces
to `RESEARCH.md` round 1.

## Approach

Two independent frictions sharing one root cause (skill prose written
without accounting for the exact worktree environment the skill itself
runs in). Both fixes are prose-only, no logic touched.

| Site | Risk | Proof point |
|---|---|---|
| `plugins/fgOS/skills/pick/SKILL.md` (single copy, not mirrored — a launcher skill) | none | manual read-back |
| 4 dev-skills × 3 mirrors (12 files: implement, planning, validating, exploring) | low | `fgos-mirror.test.mjs` |

No proof point leans on blast-radius/impact-analysis evidence — no
symbol renamed or removed.

## Shape

One piece, no split — both frictions are small, same root cause, too
small to honestly divide.

Concrete edits:
1. `pick/SKILL.md`'s `awaiting-approval` branch (step 6) — add: `fgos
   approve` refuses from inside a worktree; leave it first
   (`ExitWorktree` `action: "keep"`), then run from main checkout.
2. `fgos-coding-implement`/`fgos-coding-planning`/`fgos-coding-validating`/
   `fgos-coding-exploring` SKILL.md (3 mirrors each) — add one guidance
   note per file, at the first `root=$(...)` occurrence, stating the
   resolve-then-call pair must be two separate tool calls with a literal
   path substituted, never `$root` carried across calls.

## Outstanding questions

None
