---
framework: diataxis
mode: explanation
---
# Why `abortMergeIfPossible` checks `MERGE_HEAD` before aborting

`fgos approve`/`mergeRunnerItem` used to crash when a runner item's
branch was already fully merged into `main`: `git merge --no-ff` on an
already-ancestor branch is a genuine no-op — it exits 0 with "Already up
to date." and creates no `MERGE_HEAD`. If the subsequent post-merge
`npm test` verify then failed (e.g. due to concurrent activity on a
shared main checkout), `mergeRunnerItem` unconditionally called
`git merge --abort` and crashed with `"fatal: There is no merge to abort
(MERGE_HEAD missing)"` — instead of returning the verify-fail outcome
the code was already about to return.

## The fix

`src/runner/merge.mjs`'s abort path now checks `MERGE_HEAD` exists
before calling `--abort`:

```js
// tsk-2j9 D1/D2: a genuine `git merge --no-commit --no-ff branch` no-op
// (branch already an ancestor of HEAD by the time this call runs -- the
// TOCTOU window between `isAlreadyMerged`'s pre-check above and this call,
// e.g. a main-checkout writer that bypasses `acquireMainCheckoutLock`)
// exits 0 with "Already up to date." and creates no `MERGE_HEAD`. Every
// abort call below used to run unconditionally on that path and crash with
// "fatal: There is no merge to abort (MERGE_HEAD missing)" instead of
// returning the outcome the code was already about to return. Guarding on
// `MERGE_HEAD`'s existence closes that gap without changing any call
// site's own error message or returned outcome on every already-covered
// case -- this only ever changes behavior when there was nothing to abort.
function mergeHeadExists(repoRoot) {
  try {
    git(repoRoot, ['rev-parse', '--verify', 'MERGE_HEAD']);
    return true;
  } catch {
    return false;
  }
}

export function abortMergeIfPossible(repoRoot) {
  if (!mergeHeadExists(repoRoot)) {
    return;
  }
  try {
    git(repoRoot, ['merge', '--abort']);
  } catch (err) {
    if (!mergeHeadExists(repoRoot)) {
      return;
    }
    throw err;
  }
}
```

This closes the gap without changing any call site's own error message
or returned outcome on every already-covered case — it only ever changes
behavior on the path where there was genuinely nothing to abort.

## Why the abort's own failure is re-checked too, not just guarded up front

A second, narrower race can still happen even after the up-front
`mergeHeadExists` check passes: a concurrent process resolving the
*same* writer identity (`main-checkout-lock.mjs`'s D6 self-recognition
"refresh" path treats it as this call's own session, so `tsk-2eq`'s lock
never contends against it) can clear `MERGE_HEAD` in the window between
the up-front check and the actual `git merge --abort` call. This was
empirically reproduced — two genuinely separate processes forced to
share one resolved identity, real git operations racing on one shared
checkout, hitting "no merge to abort" on that exact line.

If `MERGE_HEAD` is gone *now*, the abort's own goal — no merge left in
progress — is already satisfied, whatever cleared it; the code treats
this exactly like the up-front no-op case, never as a fatal failure. Any
*other* abort failure (where `MERGE_HEAD` is still present) is a real one
and still propagates unchanged.

## Scope of the fix

Single file (`src/runner/merge.mjs`), scoped to guarding the existing
`git merge --abort` call sites in `mergeRunnerItemLocked` with a
`MERGE_HEAD`-exists check — one cohesive change, no independent
sub-parts (`judgeDecompose` returned `pass-through` on exactly this
reasoning). The existing `test/runner/merge.test.mjs` already covered
this function and served as verify.
