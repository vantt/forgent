# tsk-1cp — plan.md

Mode: tiny

0 mode-gate flags apply (no auth, authorization, data model, audit/
security, external systems, public contracts, cross-platform, existing
covered behavior touched, weak proof area, or multi-domain concern) — this
is a couple of doc files, one direct task, matching the tiny bucket per
`fgos-routing`'s own Mode-gate table.

## Approach

Honor D1-D3 from `CONTEXT.md`. tsk-1cp writes and finalizes a standalone
record (`CONTEXT.md` + `RESEARCH.md`, both already committed this pass) at
`docs/history/tsk-1cp-sync-root-unrecognized-outcome-guard/` — no source
or test changes belong to this item; the guard and its test are already
committed on `fgw/tsk-4hj` (`bin/fgos.mjs:3404`, commit `fc59e7d9`;
`test/cli/fgos.test.mjs:6374`).

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| Traceability record itself (this doc + RESEARCH.md) | low — pure docs, no code path | already written and reviewable in this commit |
| Verify command (`node --test test/cli/fgos.test.mjs`) | medium — will FAIL until tsk-4hj's commits are present on this branch's ancestry (D2) | `fgos-coding-validating`'s reality check must confirm this is an accepted, expected-to-fail-until-merge state, not a plan defect |

impact-analysis: `full` (GitNexus present) — not applicable in practice;
this item's own footprint touches no code symbols.

Files touched by this item: only
`docs/history/tsk-1cp-sync-root-unrecognized-outcome-guard/CONTEXT.md` and
`.../RESEARCH.md` (already committed). No further files are in scope.

## Shape

Single piece, no split — one coherent, already-mostly-done documentation
task; splitting it further would be pure ceremony over two files.

Concrete cases this plan is proven against:
- **Record exists and cites real, checkable evidence** — done: every
  citation in `CONTEXT.md`/`RESEARCH.md` points at a real `fgw/tsk-4hj`
  commit/line, verified via `git show`/`git diff` in the discovery round.
- **This item's own worktree does not yet carry the fix** — confirmed via
  `rg -- "sync-root-unhandled-outcome"` on `fgw/tsk-1cp`, matching nothing
  but this item's own new docs. Expected, not a defect (D2).
- **tsk-4hj later merges to `main`** — out of this item's own execution
  scope to force; when it happens, a follow-up pass (this item re-entering
  `executing`, or a fresh small item) updates the record with the real
  merge commit SHA and confirms `node --test test/cli/fgos.test.mjs`
  passes. This plan does not need to wait inline for that merge to be
  written and approved now.

## Outstanding questions

None
