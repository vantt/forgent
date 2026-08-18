# tsk-2j9 — mergeRunnerItem crashes calling `git merge --abort` with no MERGE_HEAD

## Feature boundary

`mergeRunnerItem` / `mergeRunnerItemLocked` (`src/runner/merge.mjs`) must
never call `git merge --abort` when there is no `MERGE_HEAD` to abort. Every
`git merge --abort` call site in `mergeRunnerItemLocked` gets a
MERGE_HEAD-exists guard before calling abort; a missing MERGE_HEAD at that
point returns the same outcome the code was already about to return
(`verify-fail`, `fgos-write-rejected`, `conflict`, or the commit-fail throw)
without attempting the abort. Scope is this guard only — not a redesign of
the merge sequence, not the broader main-checkout-writer lock audit (see D3).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Residual gap confirmed via empirical test — `mergeRunnerItem`'s abort-on-missing-MERGE_HEAD crash is still reproducible today despite tsk-3yl's pre-check fix (`4dc4f8f`), via a TOCTOU window between `isAlreadyMerged`'s check (`merge.mjs:701`) and the actual `git merge --no-commit --no-ff` attempt (`merge.mjs:711`). |
| D2 | Fix scope: guard all 4 `git merge --abort` call sites in `mergeRunnerItemLocked` (conflict-catch ~723-728, fgos-write-rejected ~737-746, verify-fail ~750-753, commit-fail ~761-769) with a MERGE_HEAD-exists check before calling abort — applied uniformly, not only the 2 sites empirically reachable by the confirmed race. |
| D3 | Auditing every main-checkout writer for `acquireMainCheckoutLock` discipline (the still-open note in `tsk-18a`'s decision log) stays out of `tsk-2j9`'s scope — `tsk-18a` already exists as the dependent item for that investigation. |

## Pinned terms

- **"Residual gap"** — the TOCTOU window between `isAlreadyMerged`'s
  pre-check and the actual `git merge --no-commit --no-ff` call, not a
  logic error in `isAlreadyMerged` itself.
- **"Reachable abort site"** — an abort call site that can execute after a
  genuine no-op merge (`git merge --no-commit --no-ff` exits 0, no
  exception, no `MERGE_HEAD`). Only verify-fail and commit-fail are
  reachable that way; conflict-catch and fgos-write-rejected require staged
  changes a no-op merge won't produce. D2 guards all 4 anyway, for
  uniformity against future code changes, not because the other 2 are
  currently reachable.

## Scout evidence

- Original bug description (item title/description, and
  `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md:64`)
  describes the crash against an older version of `merge.mjs` (line numbers
  ~335-341 no longer match current file structure — that region is now the
  decision-index-collision comment block).
- `tsk-3yl` (`4dc4f8f`, 2026-07-29, "mergeRunnerItem idempotent on
  already-merged branch") already added the `isAlreadyMerged` pre-check at
  `merge.mjs:701-707` and is an ancestor of current HEAD (`6daef60`,
  confirmed via `git merge-base --is-ancestor 4dc4f8f HEAD`).
- Existing test coverage for the pre-check path:
  `test/runner/merge.test.mjs:643` — "mergeRunnerItem on an already-merged
  branch still re-runs verify and returns 'verify-fail' if HEAD has since
  regressed" — asserts no abort attempted in that case.
- Empirical reproduction of the residual gap (throwaway repo, this
  session): merged a branch into main, then re-ran
  `git merge --no-commit --no-ff <same-branch>` — result: `Already up to
  date.`, exit 0, and `git rev-parse --verify MERGE_HEAD` failed with
  `fatal: Needed a single revision`. This is exactly the state that would
  hit `git merge --abort` unguarded in `mergeRunnerItemLocked`'s
  verify-fail (`merge.mjs:750-753`) and commit-fail
  (`merge.mjs:761-769`) branches if reached via the TOCTOU window in D1.
- `acquireMainCheckoutLock` usage audit: only two call sites in
  `src/runner/` acquire it — `claim-port.mjs:103` (`take`) and
  `merge.mjs:651` (`mergeRunnerItem`). `session.mjs`'s own git write calls
  (`git checkout -- .fgos`) operate on a worker's own worktree, not the
  main checkout's HEAD, so they are not a candidate source for the TOCTOU
  window. No other writer of the main checkout's git state was found to
  hold this lock — matches `tsk-18a`'s own still-open audit note, deferred
  per D3.
- Impact-analysis capability gate (`CLAUDE.md`): queried
  `fgos tool query --capability impact-analysis --status present` — one
  provider (`gitnexus`) registered and `present` → posture is **full**.
  The `fgos-coding-implement`/`fgos-coding-planning`/`fgos-coding-validating` MUST rules apply
  as written once this item reaches implementation: run `impact()` on
  `mergeRunnerItemLocked` before editing it, and `detect_changes()` before
  committing.

## Canonical references

- `src/runner/merge.mjs` — `mergeRunnerItem` / `mergeRunnerItemLocked`
  (target of the fix).
- `test/runner/merge.test.mjs:622-650` — existing idempotent-merge test
  block (`tsk-3yl`), the pattern the new regression test should extend.
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
  — original bug write-up (pre-dates this session's residual-gap finding;
  its `tsk-2j9` entry describes the already-fixed pre-tsk-3yl crash, not
  the narrower TOCTOU gap this item now actually fixes).
- `tsk-3yl` (commit `4dc4f8f`) — the pre-check fix this item's guard is
  defense-in-depth on top of.
- `tsk-18a` — dependent item tracking the broader main-checkout-writer
  lock-discipline audit, out of this item's scope per D3.

## Outstanding questions deferred to planning

- None — D2 already fixes the fix's shape (guard all 4 sites uniformly).
  Planning's job is the concrete guard implementation (a shared helper vs.
  inline checks at each site) and the regression test(s) proving the
  TOCTOU-window crash no longer occurs.
