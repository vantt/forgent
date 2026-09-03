---
framework: diataxis
mode: explanation
---
# Why `fgos approve` distinguishes a pre-existing `MERGE_HEAD` from its own conflict

`mergeRunnerItemLocked` (`src/runner/merge.mjs`) attempts `git merge
--no-commit --no-ff <branch>` to stage an item's merge. Before this fix,
if that call failed, the code read `mergeHeadExists(repoRoot)` exactly
once — *after* the call — to decide whether it was a genuine conflict.
That single post-call read could not tell two very different situations
apart:

1. **genuine conflict** — `MERGE_HEAD` did not exist before this call,
   and exists after it, because *this call itself* created it while
   staging a real conflict.
2. **pre-existing `MERGE_HEAD`** — `MERGE_HEAD` already existed *before*
   this call ever ran, left behind by a *different* item's in-progress or
   abandoned merge on the same shared main checkout. Git refuses to even
   start a new merge in this state ("You have not concluded your merge"),
   so this call's own attempt never happened at all.

Both cases produce the exact same observable signal at the point the old
code checked: `mergeHeadExists(repoRoot) === true`. The code could not
distinguish "I created this conflict" from "someone else's merge is
already sitting here."

## The bug this caused (tsk-4hj)

Caught live: `fgos approve tsk-55h` reported `merge-conflict` twice in a
row despite the branch being provably clean — a disposable clone plus
`git merge-tree`, run both times, found no conflict either time. The real
cause: the main checkout already carried a `MERGE_HEAD` left by a
*different* item's merge (`tsk-4qu`, then `tsk-5td`) from a concurrent
session. The old code misclassified that pre-existing state as
`tsk-55h`'s own conflict, then called `git merge --abort` — **discarding
the other item's real merge state** — before reporting the wrong reason
against the innocent item.

No data was actually lost in the case that surfaced this (`tsk-4qu`'s
content stayed safe on its own branch, redoable), but the mechanism is a
real safety gap: if the colliding item had a manually-resolved conflict
that was fixed but not yet committed, an unrelated `approve` call for a
different item could silently discard that resolved-but-uncommitted work
— with no warning to anyone, while the truly innocent item gets blocked
for the wrong reason.

`acquireMainCheckoutLock` (`src/runner/main-checkout-lock.mjs`) does not
close this gap: it serializes concurrent `approve` calls, but a crashed
or exited holder can still leave a real, uncleaned `MERGE_HEAD` behind
for the next holder — `MERGE_HEAD` is git-level state, not an fgOS lock
file.

## The fix: read `mergeHeadExists` before the call too

```js
if (mergeHeadExists(repoRoot)) {
  return { outcome: 'merge-blocked-other-item', branch };
}
```

Inserted immediately before the `git merge --no-commit --no-ff branch`
call, after the main-checkout lock is already held. If `MERGE_HEAD`
already exists at that point, this item's own merge attempt never runs
at all — the code returns the new `merge-blocked-other-item` outcome
directly, and critically, **never calls `abortMergeIfPossible`** on this
path: that abort is exactly the destructive step that discards another
item's real merge state, the actual data-loss risk this fix closes.

`merge-blocked-other-item` is deliberately a new, distinct outcome — not
folded into `conflict` (that means *this* call's own attempt found real
conflicting content) and not folded into `merge-failed-unclassified`
(`tsk-18a`'s sibling case — that means this call's own attempt failed in
an unrecognized way). This case means this call's attempt never got a
chance to happen at all. It follows `tsk-18a`'s own precedent exactly:
retryable via `fgos catchup`, since the blocking item's own merge will
eventually finish or get aborted by a person, clearing `MERGE_HEAD`.

## The regression this fix could have introduced, and its own guard

`mergeRunnerItem` is shared by three call sites in `bin/fgos.mjs`: two
`approve` paths, and `fgos sync-root`'s own `runAndReport`. The two
`approve` paths already had a `conflict` branch to extend. `sync-root`
did not — it had exactly three named outcome branches
(`conflict`/`fgos-write-rejected`/`verify-fail`); any outcome outside
those three fell straight through to its success block, reporting
`synced` even when nothing actually merged.

Before this fix, a pre-existing `MERGE_HEAD` hitting `sync-root` at least
surfaced as a wrong-but-visible `conflict`. After this fix, the same
condition would return `merge-blocked-other-item` — an outcome
`sync-root` still had no branch for — so it would have silently reported
false success instead, a worse regression than the bug being fixed.
`sync-root` now has a defensive `else` after its `verify-fail` branch
that treats *any* outcome other than `'merged'` as an error, rather than
listing `merge-blocked-other-item` by name — future-proofed against
whatever outcome a later fix adds too.

## Scope

Landed as one coherent piece: the pre-call `mergeHeadExists` check, its
two `approve` call sites, `sync-root`'s defensive guard, and the matching
`CATCHUP_REASONS`/`docs/specs/runner.md` updates. Explicitly out of
scope: `tsk-2j9`'s already-delivered abort-crash guard (a *missing*
`MERGE_HEAD`) and `tsk-18a`'s already-delivered conflict/unclassified
split (a `MERGE_HEAD` this call itself created or never created) — both
orthogonal, already-shipped fixes for different classification gaps in
the same function.

## Update (`tsk-1cp`): the `sync-root` guard's own independent traceability record

`sync-root`'s defensive guard (D4 above) was significant enough on its
own — a pre-existing bug (`tsk-18a` had already missed this same call
site once, when it added `merge-failed-unclassified`) that this fix's
own D1 would otherwise have made worse, not better — that it was given
its own separate, independently-traceable documentation record
(`docs/history/tsk-1cp-sync-root-unrecognized-outcome-guard/`), distinct
from `tsk-4hj`'s own decision log, even though the guard's actual code
and test landed as part of `tsk-4hj`'s own commit (`fc59e7d9`) and no
separate code change belongs to this second item.

The guard itself, precisely: `bin/fgos.mjs:3404`, `if (result.outcome
!== 'merged')` before `sync-root`'s success block, tagged with
`errorClass: 'sync-root-unhandled-outcome'` — a defensive `else` that
treats *any* outcome other than `'merged'` as an error, never listing
`merge-blocked-other-item` (or any other specific outcome name) in the
condition itself, so it also future-proofs against whatever outcome a
later fix adds. Regression test: `test/cli/fgos.test.mjs:6374`.
Fail-before/pass-after proof: `docs/history/
tsk-4hj-stale-merge-head-misclassified-as-conflict/iron-law-evidence.md`.
