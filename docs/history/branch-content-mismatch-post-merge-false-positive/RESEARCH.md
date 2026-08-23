# Research — tsk-107

## Round 1 — 2026-08-11T06:06Z

**Asked:** Is `branchContentMismatch` in `src/runner/merge.mjs` still comparing
`introducedPaths` against the current `HEAD` (causing a false positive when an
unrelated, later-merged branch touches the same path), as tsk-107's
description claims? Is the proposed fix (compare against
`firstMerge`/`firstMerge^1` instead of current `HEAD`) still needed, or
already done?

**Checked (repo, primary source):**
- `rg -n "branchContentMismatch|firstMerge|introducedPaths" src/runner/merge.mjs`
  → function defined at `src/runner/merge.mjs:771-805`, called from
  `mergeRunnerItemLocked` at `src/runner/merge.mjs:865`.
- Read `src/runner/merge.mjs:771-805` directly. The function ALREADY compares
  `introducedPaths` (branch's diff since its true fork point) against
  `changedByMerge` — the diff between `firstMerge^1` and `firstMerge` itself
  (`src/runner/merge.mjs:799-803`) — not against `ref`'s (HEAD's) current
  tree. This is exactly the fix tsk-107 asks for.
- `src/runner/merge.mjs:791-798` carries an inline comment literally citing
  `tsk-107`, explaining the same false-positive scenario the item describes
  (an unrelated later-merged branch touching the same path).
- `git log --all --oneline | grep -i tsk-107` → `42eef0fa fix(tsk-107):
  compare branchContentMismatch against the merge commit, not current HEAD`
  (2026-08-02T13:02:04+07:00, author Van Tran).
- `git merge-base --is-ancestor 42eef0fa8 725c292a` → true. `725c292a` is
  this item's own `branchHeadAtTake` (the commit `fgw/tsk-107`'s worktree
  branched from) — the fix commit is already an ancestor of the branch this
  item is being worked on.
- `git blame -L 791,804 -- src/runner/merge.mjs` confirms every line of the
  fixed comparison logic belongs to `42eef0fa8`, not a later or different
  commit.

**Found:** The bug tsk-107 describes was already fixed by commit `42eef0fa8`
on 2026-08-02, which is already present in `main` and in this item's own
branch base. The backlog item itself was left open — a bookkeeping gap
between the code fix landing and the fgOS work item being closed, not a
remaining code defect. There is no `introducedPaths`-vs-current-`HEAD`
comparison left in `branchContentMismatch` for this item to fix.

**Still open:** Whether `npm test` passes clean on this branch as-is (no
new code change expected) — that's `fgos-coding-implement`'s own verify step,
not this skill's job to run definitively at the discovery stage.
