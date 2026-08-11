# tsk-15k — verify-only merge short-circuit can mark done without real merge

## Feature boundary

`mergeRunnerItemLocked` (`src/runner/merge.mjs:694-707`) has a fast path:
when `isAlreadyMerged(repoRoot, branch, 'HEAD')` — implemented as `git
merge-base --is-ancestor <branch> HEAD` — returns true, the function skips
`git merge --no-commit --no-ff` entirely, reruns the item's own goal-check
against the *current* tree, and returns `{ outcome: 'merged', ... }` on a
pass. This path trusts is-ancestor alone as proof the branch's content is
correctly incorporated into HEAD.

The short-circuit was added deliberately (tsk-3yl D1, see comment at
merge.mjs:672-681): a prior `approve` run can land the merge commit and
then die at a *later* step (any failure after commit, before the
status-move to `done`). Retrying naively would find `git merge --no-commit
--no-ff` a no-op and crash on `git commit --no-edit` ("nothing to
commit"). The is-ancestor check exists to recognize that already-merged
state before attempting a redundant merge.

tsk-15k's bug report: this same short-circuit can fire and mark an item
`done` in a case where the branch's actually-diverged content was not
correctly merged — the bare is-ancestor signal is not sufficient proof by
itself. No specific reproduction was on file before this session; the item
description is the only record ("brief but real... đã note").

This item's scope is fixing this specific fast path in `merge.mjs` only —
not the wider merge-harness-v2 design (drift detection / `sync-root`,
`plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`),
which is separate, not-yet-built work.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The fix keeps the `isAlreadyMerged` short-circuit (needed for tsk-3yl's retry-after-partial-failure case) but adds an explicit integrity check before trusting it — never bare `is-ancestor` alone as sufficient proof the merge is real and complete. The exact shape of that check (e.g., confirming the existing merge commit's second parent is genuinely branch's tip) is left to `fgos-coding-planning`/implementation, not locked here. |
| D2 | Acceptance/verify for this item requires a regression test that constructs the `isAlreadyMerged` false-trust scenario and asserts the fixed code now catches/rejects it — not just "existing suite still green." Fills the item's previously-unset `verify` field. |
| D3 | Scope is a standalone fix to `merge.mjs`'s `isAlreadyMerged` path today, independent of merge-harness-v2's `driftStatus`/`sync-root` design timeline — matches yesterday's research report calling this fix "independent, mechanical, can proceed in parallel." Not folded into or blocked on harness v2 landing. |

## Pinned terms

- **"verify-only merge mode"** (item title's own phrase) = the
  `isAlreadyMerged` fast path in `mergeRunnerItemLocked` — reruns
  goal-check only, does not attempt `git merge --no-commit --no-ff`.
- **"divergent content"** = branch content that differs from what HEAD's
  current tree actually holds, which the bare `is-ancestor` check does not
  itself prove is correctly incorporated.

## Scout evidence

- `src/runner/merge.mjs:694-707` (`mergeRunnerItemLocked`) — the
  short-circuit itself.
- `src/runner/merge.mjs:682-692` (`isAlreadyMerged`) — the is-ancestor
  check, no other corroborating signal.
- `src/runner/merge.mjs:672-681` — tsk-3yl D1 comment, the original reason
  this fast path exists.
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md:68`
  — original bug framing ("brief but real...").
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md:260`
  — sequencing: independent, mechanical, parallelizable once foundation
  items stabilize.
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md:176-178`
  — tsk-15k listed among 8 prerequisite bug fixes, unchanged scope, kept
  separate from new Layer 1 harness design.
- No prior `view.discovery["tsk-15k"]` verdict, no `docsRef`, no
  tsk-15k-specific decision-log entry existed before this session
  (checked via `fgos list --id tsk-15k --json`).
- Impact-analysis capability: **full** — GitNexus registered and
  `present` (`fgos tool query --capability impact-analysis --status
  present` returned the `gitnexus` provider). `fgos-coding-planning`/
  `fgos-coding-validating`/`fgos-coding-implement` should run real impact analysis on
  `mergeRunnerItemLocked`/`isAlreadyMerged` before editing, per the
  project's impact-analysis gate.

## Canonical references

- `src/runner/merge.mjs`
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`

## Outstanding questions deferred to planning

- Exact shape of the "integrity check" in D1 (e.g., verifying the existing
  merge commit's second parent matches branch's tip, vs. some other
  signal) — implementation choice, not a product decision.
- Whether a real historical false-positive incident needs auditing (no
  known incident was found on file for this item) — not raised as a
  material question since no evidence of one exists; planning should flag
  it if code archaeology turns one up.
