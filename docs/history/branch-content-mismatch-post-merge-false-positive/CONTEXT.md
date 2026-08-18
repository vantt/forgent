# CONTEXT — tsk-107

## Feature boundary

tsk-107 reported that `branchContentMismatch` in `src/runner/merge.mjs`
false-flags an already-merged branch as `verify-fail-post-merge` when a
LATER, unrelated already-merged branch also touches the same path — because
the function used to compare `introducedPaths` against `ref`'s (HEAD's)
current tree instead of the state right at the original merge.

Scout evidence (see `RESEARCH.md` round 1) established the fix — and a
dedicated regression test for it — are ALREADY on this item's own branch:

- `src/runner/merge.mjs:771-805` (`branchContentMismatch`) already compares
  `introducedPaths` against `changedByMerge` (the diff between `firstMerge^1`
  and `firstMerge` itself), not against `ref`'s current tree. The inline
  comment at `src/runner/merge.mjs:791-798` cites `tsk-107` directly.
- `test/runner/merge.test.mjs:871-911` ("mergeRunnerItem does not
  false-flag an already-merged branch just because a later unrelated
  already-merged branch also touched the same file") reproduces exactly
  the scenario tsk-107 describes and asserts the correct `merged` outcome.
- Both landed via commit `42eef0fa8` (`fix(tsk-107): compare
  branchContentMismatch against the merge commit, not current HEAD`,
  2026-08-02), already an ancestor of this item's own `branchHeadAtTake`
  (`725c292a`).

So this item's boundary is: confirm the fix and its test are real and
green, then close the item — no further code change in scope.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | No new code change is in scope for tsk-107 — the described fix (`branchContentMismatch` comparing against `firstMerge`/`firstMerge^1`) and its regression test are already committed and present on this item's branch. The item proceeds to `executing` to run the real verify (`npm test`) and confirm green, then return — not to author a duplicate fix. |

## Pinned terms

- **"the fix"** — commit `42eef0fa8`, already on `main` and on `fgw/tsk-107`'s
  base (`725c292a`): the `branchContentMismatch` comparison against
  `firstMerge`/`firstMerge^1` instead of current `HEAD`.

## Scout evidence

- `rg -n "branchContentMismatch" src docs test --glob "*.{mjs,cjs,md}"` →
  hits in `src/runner/merge.mjs` (definition + call site),
  `test/runner/merge.test.mjs` (regression test citing tsk-107),
  `docs/history/backlog-execution-reconciliation/RECONCILIATION.md`,
  `docs/history/review-diff-enobufs-stale-branch/plan.md`,
  `docs/explanation/why-mergerunneritems-already-merged-fast-path-checks-content-not-just-ancestry.md`.
- `git log --all --oneline | grep -i tsk-107` → `42eef0fa fix(tsk-107):
  compare branchContentMismatch against the merge commit, not current
  HEAD`.
- `git merge-base --is-ancestor 42eef0fa8 725c292a` → true.
- `git blame -L 791,804 -- src/runner/merge.mjs` → every line of the fixed
  comparison logic belongs to `42eef0fa8`.
- GitNexus (`mcp__gitnexus__*`, capability `impact-analysis`, status
  `present`) confirms `branchContentMismatch`'s only caller is
  `mergeRunnerItemLocked`, and its only callee is `git` (the local shell-out
  helper) — matches the read above with no additional blast radius.
  `fgos tool query --capability impact-analysis --status present` →
  1 provider (`gitnexus`), `status: present` → `impact-analysis: full`
  per `CLAUDE.md`'s capability gate. No edit is planned this item, so this
  is recorded for the audit trail only, not as a gate on a change.

## Canonical references

- `docs/explanation/why-mergerunneritems-already-merged-fast-path-checks-content-not-just-ancestry.md`
  — the design doc for `branchContentMismatch` itself (pre-dates this
  item's own narrower fix, still the right background reading).
- `docs/history/merge-verify-only-false-done/plan.md` — tsk-15k, the item
  that originally added `branchContentMismatch`.

## Outstanding questions

None
