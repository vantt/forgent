# tsk-4hj — research

## Round 1 — 2026-08-11

**Asked:** Is `fgos approve`'s misclassification of a pre-existing
`MERGE_HEAD` (left by another item's in-progress/crashed merge) as this
item's own conflict a real, still-reproducible gap in the current code, or
already closed by prior fixes (`tsk-2j9`, `tsk-18a`)? What is the concrete
fix point?

**Checked (repo, all internal — no external lookup needed):**

- `src/runner/merge.mjs:853-966` (`mergeRunnerItemLocked`) — read in full.
  At line 886, `git(repoRoot, ['merge', '--no-commit', '--no-ff', branch])`
  is attempted with no prior check of whether `MERGE_HEAD` already exists.
  Git itself refuses this call outright ("You have not concluded your
  merge (MERGE_HEAD exists)") whenever a MERGE_HEAD is already on disk —
  whether from THIS branch or a completely different one.
- `src/runner/merge.mjs:807-825` (`mergeHeadExists`, tsk-2j9 D1/D2) —
  computes existence via `git rev-parse --verify MERGE_HEAD`. Used at two
  points in the catch block (line 905, line 846 inside
  `abortMergeIfPossible`). Neither call site distinguishes "MERGE_HEAD
  existed before this `git merge` call ran" from "MERGE_HEAD was created
  BY this call" — both read the same boolean at the same post-failure
  moment.
- `src/runner/merge.mjs:894-919` — the catch block. On any merge failure:
  checks for a self-resolvable decision-index collision (tsk-3mv-1, not
  relevant here) then falls through to `genuineConflict =
  mergeHeadExists(repoRoot)` (line 905) → **true** when a stale MERGE_HEAD
  from another item is present → `abortMergeIfPossible(repoRoot)` (line
  907) actually runs `git merge --abort`, discarding that OTHER item's
  merge state → returns `{outcome: 'conflict', branch}` (line 912),
  misreporting the item being approved right now as the one with the
  conflict.
- `docs/history/tsk-2j9-merge-abort-missing-merge-head/CONTEXT.md` +
  current code (`abortMergeIfPossible`, lines 827-851) — tsk-2j9's fix
  (delivered) guards every `git merge --abort` call against a MISSING
  `MERGE_HEAD` (so abort never crashes on a no-op). This fix is orthogonal
  to tsk-4hj: it prevents a crash on a MISSING MERGE_HEAD, it does not
  address a stale/PRE-EXISTING one from a different item.
- `docs/history/tsk-18a-merge-conflict-misclassification/CONTEXT.md` +
  current code (lines 898-918) — tsk-18a's fix (delivered) distinguishes a
  genuine conflict (MERGE_HEAD created by THIS call, git exits nonzero)
  from an unclassified failure (git exits nonzero, MERGE_HEAD never
  created at all → new outcome `merge-failed-unclassified`, line 914-918).
  This closes a different gap: it assumes any MERGE_HEAD found at line 905
  was created by the current call. tsk-4hj's bug is the case tsk-18a's own
  binary split cannot see: MERGE_HEAD existing FOR A REASON UNRELATED TO
  THIS CALL (pre-dates it). tsk-18a's fix does not regress or duplicate
  this — it is a real prior gap in the SAME classification boundary,
  narrower than what tsk-4hj now names.
- `src/runner/merge.mjs:664-724` (`mergeRunnerItem`, tsk-2eq) —
  `acquireMainCheckoutLock` is held for the whole merge window before any
  git call. This serializes concurrent `approve` calls against each other,
  but does NOT prevent a stale `MERGE_HEAD` from surviving across lock
  holders: if a prior holder's process staged a merge (`git merge
  --no-commit`, no exception) and then exited before reaching `git commit`
  or an abort — `releaseOnExit: true` on the lock (line 705) releases the
  LOCK on crash/SIGINT/SIGTERM, but `MERGE_HEAD` is real git repository
  state, not something the lock or its exit hook touches or cleans up —
  the next lock holder inherits a real, uncommitted MERGE_HEAD from
  someone else's abandoned merge. This matches the item's own reported
  context exactly (`tsk-4qu`, then `tsk-5td`, both left MERGE_HEAD behind
  from a separate concurrent process).
- `src/runner/main-checkout-lock.mjs:321` (`acquireMainCheckoutLock`) —
  confirms the lock is fgOS-internal state (`.fgos/main-checkout.lock`),
  entirely separate from git's own `MERGE_HEAD` file — the item's own
  description already states this correctly ("MERGE_HEAD la git-level
  state, khong phai lock file cua fgOS"); confirmed by reading the lock
  implementation, it never reads or writes MERGE_HEAD.
- `test/runner/merge.test.mjs` — existing test file for this module (tests
  for tsk-2j9/tsk-18a's own guards already live here, e.g. the
  already-merged/idempotent block around line 622-650). Natural home for
  a new regression test: simulate a stale MERGE_HEAD (start a real `git
  merge --no-commit --no-ff` for one branch, don't finish it, then call
  `mergeRunnerItemLocked`/`mergeRunnerItem` for an UNRELATED branch) and
  assert the unrelated call refuses with a distinct outcome/error instead
  of returning `{outcome: 'conflict'}` and silently aborting the first
  merge.

**Found:** The bug is real and still present in current `main` — neither
`tsk-2j9` nor `tsk-18a` (both delivered) closes it; they fix adjacent but
distinct classification gaps at the same call site. Fix point is precise:
add a `mergeHeadExists(repoRoot)` check immediately before the `git merge
--no-commit --no-ff branch` call at `merge.mjs:886` (inside
`mergeRunnerItemLocked`, after the lock is already held). If MERGE_HEAD
already exists at that point — before this call ever ran — refuse with a
new, distinct outcome/error naming that the main checkout has another
item's merge in progress, and do NOT call `abortMergeIfPossible` on it.
This is a third, disjoint case from tsk-18a's existing two-way split
(genuine conflict / unclassified failure): "pre-existing MERGE_HEAD, this
call never ran."

**Open:** None — no external library/concept involved, the goal is fully
resolvable from repo evidence. Implementation-level choices (exact new
outcome name, whether to also guard `isAlreadyMerged`'s no-op path at line
860, message wording) are deferred to planning/implementation, not a
clarity gap.

**Verdict:** clear. `verify: node --test test/runner/merge.test.mjs`
(existing suite for this module; a new regression test proving the
pre-existing-MERGE_HEAD case is added to this same file and this same
command exercises it).
