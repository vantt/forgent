# Research — tsk-2qp

## Round 1 (2026-08-23) — does `approve`/`sync-root` hold `.fgos/main-checkout.lock` across the full merge/commit sequence, and does a named error category exist for a mid-merge collision?

**Asked:** the item's own "Worth investigating" paragraph — does `approve`/`sync-root`
acquire `.fgos/main-checkout.lock` for the full span of their git work (merge,
verify, commit), or only around the `.fgos` state write? Is there already a
named `checkout-busy`-style error category for a pre-existing `MERGE_HEAD`
collision?

**Checked (repo search, `rg` + direct reads):**

- `src/runner/merge.mjs:846-935` (`mergeRunnerItem`, non-`targetSlot` path —
  the path `approve`'s root→main merge and `sync-root` both use). The lock
  is acquired at `merge.mjs:897`, **before the first git call**, and held
  across the entire `mergeRunnerItemLocked` call (merge, verify, commit) via
  a `try/finally` at `merge.mjs:929-935`. Landed `e01f637d` (2026-07-29,
  "fix(merge): hold the main-checkout lock for the whole merge sequence"),
  well before the item's own cited incident (2026-08-16).
- `docs/explanation/why-the-main-checkout-lock-needs-a-heartbeat-during-merge-verify.md`
  — a real verify run (~185s) can outrun `DEFAULT_TTL_MS` (180s,
  `src/runner/main-checkout-lock.mjs:80`), making a still-live holder's lock
  read as stale. Fixed by `renewMainCheckoutLockIfOwn` heartbeat, ticking
  every `HEARTBEAT_INTERVAL_MS = DEFAULT_TTL_MS/3` (`merge.mjs:725`,
  `merge.mjs:924-926`) — landed `4730ecf8` (tsk-4l8, 2026-08-11).
- Same doc, "The heartbeat closes the read side; the release side had its
  own gap" — the release closure used to unconditionally unlink whatever
  lock file was present, letting a first session's stale release destroy a
  second, legitimate reclaimer's live lock. Fixed via
  `releaseMainCheckoutLockIfOwn` (ownership-checked release) — landed
  `1c60a75f` (tsk-22c, 2026-08-13). Named as one plausible (not proven)
  explanation for `tsk-22c`'s own original unexplained `exit 9` incident.
- `docs/explanation/why-fgos-approve-distinguishes-a-pre-existing-merge-head-from-its-own-conflict.md`
  — a pre-existing `MERGE_HEAD` left by a *different* item's in-progress or
  abandoned merge used to be misclassified as *this* call's own conflict
  (and its `git merge --abort` would discard the other item's real state).
  Fixed: `mergeHeadExists(repoRoot)` is now checked immediately before the
  `git merge --no-commit --no-ff` call, after the lock is already held —
  returns a **new, distinct outcome `merge-blocked-other-item`** (not
  folded into `conflict`/`merge-failed-unclassified`), and critically never
  calls `abortMergeIfPossible` on this path. Also covers `sync-root`'s own
  call site with a defensive `else` (`bin/fgos.mjs:3404`) that treats any
  non-`'merged'` outcome as an error. Landed `fc59e7d9` (tsk-4hj,
  2026-08-11).
- `git commit`'s real stderr/status now surfaces on failure instead of an
  opaque message — landed `d547a08a` (tsk-50i7, 2026-08-11).
- `c871cdcf` (tsk-70l, 2026-08-13) — closed the sibling self-recognition gap
  on the root→main merge path (two OS processes sharing one inherited
  session id no longer misread each other as "the same writer" on this lock).
- Searched the live backlog (`fgos list --all --json`) for any already-open
  item covering the remaining gap below (`renewal`, `checkout-busy`,
  `double-writer`) — none found. `tsk-18k`/`tsk-1mn` are adjacent but cover
  the merge-target-slot lock and `claimWork`'s own npm-ci hold, not this one.

**Finding: the item's literal questions are answered — and already fixed —
but a distinct, still-open residual gap remains, named in the fix's own
doc as unclosed.** `renewMainCheckoutLockIfOwn`'s return value is discarded
at both call sites (`merge.mjs:791`, `merge.mjs:925`, confirmed still true in
the current tree). If a renewal tick genuinely fails (`not-owner`/
`ambiguous`/`no-lock` — e.g. the TTL lapses despite the heartbeat, letting a
second session legitimately reclaim mid-hold), the first session's own
in-flight git operations (including its own eventual `git commit`) keep
running with **no lock protection any more**, and nothing surfaces this to
the caller — no `checkout-busy`-style category exists for it today. This is
exactly the shape of a two-writer collision that would still surface as a
raw, uncategorized git failure (or worse, a silent bad merge) despite every
fix above. The doc's own "What stayed open" section names this exactly:
"the heartbeat's own renewal-failure return value is still discarded... does
not stop the underlying double-writer window once the TTL has already
lapsed."

The item's own reproduced incident (tsk-zl5 vs tsk-bc7, 2026-08-16) postdates
every fix above (all landed 2026-08-11 through 2026-08-13) — consistent with
this residual gap being the live cause, not a re-occurrence of any of the
four already-closed bugs.

**Verdict: clear.** Real scope for `planning`: stop discarding
`renewMainCheckoutLockIfOwn`'s return value in `mergeRunnerItem` — on a
renewal failure (`not-owner`/`ambiguous`/`no-lock`), fail the in-flight merge
closed with a distinct, named error category (e.g. `checkout-busy` or
`lock-lost-mid-merge`) instead of continuing unprotected, mirroring the
already-established pattern of `lock-held`/`lock-ambiguous` at acquire time
and `merge-blocked-other-item` at the pre-merge `MERGE_HEAD` check.
`tier`/`kind`/`risk` unchanged from the item's current values (`light`/
`bug`/`light`) — the real remaining fix is a small, localized addition to an
existing, well-understood call path, not a rearchitecture.

**Verify (real, runnable):** `node --test test/runner/main-checkout-lock.test.mjs
test/runner/merge.test.mjs` (both already the test files
covering `mergeRunnerItem`'s lock lifecycle per the fixes cited above); a
new regression test for the renewal-failure-surfaces-as-`checkout-busy` case
belongs in `test/runner/merge.test.mjs` alongside the existing `tsk-4l8`/
`tsk-22c` coverage.
