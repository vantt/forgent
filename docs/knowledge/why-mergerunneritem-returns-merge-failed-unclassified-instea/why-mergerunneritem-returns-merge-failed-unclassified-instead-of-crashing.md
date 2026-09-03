---
framework: diataxis
mode: explanation
---
# Why `mergeRunnerItem` returns `merge-failed-unclassified` instead of crashing

`fgos merge next` picking a branch used to crash outright on a class of
failure that wasn't a real textual git conflict. Real incident: picking
`fgw/tsk-3tk` "conflicted," then its own recovery `git merge --abort`
failed — `"fatal: There is no merge to abort (MERGE_HEAD missing)"` —
exit 9, an unstructured crash (no `fgos.v1` envelope) instead of a normal
`blocked{reason:merge-conflict}` outcome. Deterministic on retry.
`tsk-3tk`'s own fgOS state was untouched both times — the bug was in the
git-level race/recovery path, not fgOS state corruption.

## The real repro disproved the obvious explanation

A manual repro isolated a fresh detached worktree at the exact HEAD the
crash happened on and ran the same `git merge --no-commit --no-ff
fgw/tsk-3tk` by hand: `"Automatic merge went well; stopped before
committing as requested"` — zero conflict, a clean 4-file diff staged.
So the real checkout's crash was **not** a genuine textual git
conflict — `merge.mjs`'s initial `git merge --no-commit --no-ff` call
was failing for some *other* reason that the code broadly classified as
"conflicted," and the recovery `git merge --abort` then legitimately
found nothing to abort.

## The fix — a distinct blocked reason, never folded into `merge-conflict`

`src/runner/merge.mjs` now checks whether `MERGE_HEAD` genuinely existed
*before* attempting the abort, and returns a different outcome depending
on the answer:

```js
} else {
  // tsk-18a D1: MERGE_HEAD only exists when git actually staged a real
  // conflict -- captured BEFORE the abort below, which deletes it as a
  // side effect of succeeding. Any OTHER failure of this merge call
  // (e.g. an untracked file colliding with a path `branch` introduces)
  // never creates MERGE_HEAD at all; blindly reporting 'conflict' on
  // every failure would misclassify that case and discard the real
  // git error entirely.
  const genuineConflict = mergeHeadExists(repoRoot);
  try {
    abortMergeIfPossible(repoRoot);
  } catch (abortErr) {
    throw new MergeError(`merge of "${branch}" failed and "git merge --abort" itself failed: ${abortErr.message}`, { branch });
  }
  if (genuineConflict) {
    return { outcome: 'conflict', branch };
  }
  return {
    outcome: 'merge-failed-unclassified',
    branch,
    error: { message: err.message, stderr: err.stderr ?? null, status: err.status ?? null },
  };
}
```

A genuine conflict (real `MERGE_HEAD` existed) still returns the normal
`conflict` outcome. Anything else now returns `merge-failed-unclassified`
carrying the real captured `stderr`/exit `status` from the original git
failure — never silently discarded, never mislabeled as a textual
conflict it wasn't. That new reason was wired into
`bin/fgos.mjs`'s `CATCHUP_REASONS` alongside `merge-conflict`,
`verify-fail-post-merge`, and `integration-drift`, and documented in
`docs/specs/runner.md` — a blocked item with this reason is now
catchup-eligible like the others, not a dead end.

## A residual bug found while proving the fix, in the same function

Proof of done (D2) required an actual live/simulated concurrency
reproduction, not a unit test alone. Two genuinely separate OS processes
(`child_process.spawn`, not two async tasks) called `mergeRunnerItem`
against the same real scratch checkout, matching the root→main `approve`
call site's own shape (no ephemeral worktree — two concurrent root
approvals really do share one checkout).

**Attempt 1** (an accidental confound, kept because it surfaced a real
bug): both workers inherited the same `CLAUDE_CODE_SESSION_ID`, so
`resolveWriterIdentity` resolved them to the identical writer identity —
`main-checkout-lock.mjs`'s D6 self-recognition then let the second
worker "refresh" the first's lock instead of contending, so both ran
real git operations on the same checkout with zero serialization.
Result (1/1): the second worker crashed with the item's exact original
symptom, even against this item's own D1-fixed code — a genuine, separate
bug: `abortMergeIfPossible` had its own TOCTOU between checking
`mergeHeadExists()` and calling `git merge --abort` — a concurrent
process sharing the *same* resolved identity can clear `MERGE_HEAD` in
that exact window.

**Attempt 2** — the real question, two genuinely different identities
(`fake-session-AAAA…` / `fake-session-BBBB…`, matching the original
incident's actual shape): 5/5 runs. One worker always won the lock
cleanly and merged; the other always got a clean, structured
`MergeError` (`"cannot merge ... main checkout is locked by another live
session"`, `code: 'lock-held'`) thrown *before* any `git merge` call
even started. Zero misclassifications, zero crashes, zero corrupted
checkout state across all 5 runs — `tsk-2eq`'s already-delivered
lock-scope fix genuinely closes the race for two separate
sessions/identities, the scenario the original incident actually named.

## D3 — fixed in the same function, found along the way

Attempt 1's crash, while not the primary scenario, was real and
reproducible, and sat in the exact function D1 already touched. Fixed
here: `abortMergeIfPossible` now re-checks `mergeHeadExists()` if its
own `git merge --abort` call itself fails — if `MERGE_HEAD` is gone by
then (whatever cleared it), the abort's own goal is already satisfied,
so this is treated as a no-op success instead of a fatal, uncaught
crash. Any *other* abort failure (`MERGE_HEAD` still present) still
propagates exactly as before. Re-running attempt 1's same-identity
confound 5 more times against this second fix: zero crashes, down from
1/1 reproducing every time before. `test/runner/merge.test.mjs` and
`test/cli/fgos.test.mjs` both stayed green (521 tests, 0 fail).

## What's still explicitly open

Two processes that resolve to the *same* writer identity — e.g. a
background retry-loop sharing environment with a live session, matching
the original incident's own correlated timing ("a background take
`tsk-3wr-1` retry-loop") — can still bypass `tsk-2eq`'s lock entirely via
D6's self-recognition "refresh" logic and race real git operations
against each other. This item's fix makes that race fail *safely* (a
structured outcome or a typed `MergeError`, never an uncaught crash), but
doesn't close the underlying same-identity bypass itself — left open,
explicitly out of this item's scope.
