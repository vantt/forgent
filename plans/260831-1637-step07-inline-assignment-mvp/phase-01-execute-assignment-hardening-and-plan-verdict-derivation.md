# Phase 01 — executeAssignment Hardening And Plan-Verdict Derivation

Context: Cell 6.7 gaps G1, G6 live inside `executeAssignment()`, the function
Phase 02 will change; G5 is a real Assignment-path planning gap (checkpoint §19).
Land these first so the provenance change edits a clean function and does not
paper over a timing bug.

## Requirements

- R1 (G1) `src/runner/dispatch/assignment-runner.mjs` no longer imports
  `src/intake/plan.mjs` (`resolveContentRoot`, import ~line 30, use ~line 676).
  Move the path helper to a neutral module (candidate: `src/runner/paths.mjs`,
  which already owns `resolveMainCheckoutRoot`) or pass the resolved root in
  via `opts`. Intake must not be a runtime dependency of dispatch.
- R2 (G6) Post-crash fallback in `executeAssignment()` (~lines 740–952)
  captures `gitBefore` and `gitAfter` at the same instant. Capture `gitBefore`
  before launch unconditionally; on crash, `gitAfter` is captured post-crash
  and the RunResult marks `evidence.gitBeforeSource: 'pre-launch'` vs
  `'post-crash-fallback'` so provenance is explicit rather than silently equal.
- R3 (G5) Add pure `planVerdictFromPlanMd(planContent)` in `src/intake/`
  (beside the tiny/small regex at `plan.mjs:479`) returning
  `{ verdict: 'pass-through' }` for one-piece plans or
  `{ verdict: 'decompose', children }` from plan.md's split-children JSON block
  (the same block `fgos-coding-validating` passes verbatim in compat mode;
  see `domains/coding/skills/fgos-coding-validating/SKILL.md:165` and
  `references/gate-auto-approve-mechanics.md`). Returns `null` when the block
  is absent/malformed so `resolvePlan` can reject as `invalid`.
- R4 Wire the planning sweep in `src/runner/loop.mjs` (~1519–1541): on
  `outcome.canAdvanceEdge` for `validate-plan`, read plan.md via
  `resolveContentRoot`, derive the verdict with R3, pass it to
  `resolvePlan(dir, id, config, 'runner', verdict)`. Remove the dead reads
  `item.verdictPayload ?? item.callerVerdict` (no writer exists in `src/`).
- R5 Keep `verdictPayload = undefined` for `validate-plan` in
  `executeDriverOperationChoice` for now; Phase 02 replaces the op-id branch
  with `resultKind`/`onAdvance`.

## Files

Modify: `src/runner/dispatch/assignment-runner.mjs`, `src/runner/paths.mjs`
(or chosen neutral module), `src/intake/plan.mjs` (export only; do not touch
`resolvePlan` internals beyond accepting the derived verdict), `src/runner/loop.mjs`.
Create: `src/intake/plan-verdict-from-plan-md.mjs` if `plan.mjs` is too large
to host cleanly (it is 55K; prefer the new file), plus its test.

## Tests

- `test/runner/`: G1 — an import-boundary test asserting `assignment-runner.mjs`
  has no `../intake/` import (string check on the module source is acceptable
  given repo precedent for architecture manifests).
- G6 — simulate worker crash after a commit; assert `gitBefore != gitAfter`
  and `gitBeforeSource === 'pre-launch'`.
- `test/intake/`: R3 unit tests — one-piece plan, split-children block,
  malformed block, tiny/small mode precedence.
- `test/runner/`: R4 — reviewer READY on an item whose plan.md declares split
  children materializes children through `resolvePlan` and moves the root to
  `executing`; READY on a tiny-mode plan still skip-advances; NOT READY leaves
  Work untouched.
- Run: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/**/*.test.mjs' 'test/intake/**/*.test.mjs'`.
  Baseline: 4 pre-existing failures in `test/intake/plan.test.mjs` (G2) may remain; no new failures.

## Risks / Rollback

- R4 changes lifecycle-adjacent behavior: children can now materialize from
  the Assignment path. Every downstream `resolvePlan` gate (D-ID citation,
  heavy-risk, footprint overlap) still applies; add a test proving a child
  without a cited D-ID is rejected on this path too.
- Rollback: revert PR; compat-mode skill path is unaffected throughout.
