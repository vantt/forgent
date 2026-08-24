# plan.md — tsk-2qp

Mode: small
Flags: 1 (existing covered behavior — `mergeRunnerItem` is the shared,
heavily-tested lock/merge/commit path for `approve` × 2 call sites,
`sync-root`, and `promote-engine`). 0 hard-gate flags (no auth,
authorization, data model, audit/security, external provider, or
validation removal). Below the 2–3 threshold for `standard`.

## Approach

**What the item's own "Worth investigating" already asked is already
answered and already fixed** (see `RESEARCH.md` round 1, citations
included) — closed by `tsk-4l8`/`tsk-22c`/`tsk-4hj`/`tsk-50i7`/`tsk-70l`,
all landed 2026-08-11 through 2026-08-13:

- The lock is acquired before the first git call and held across the
  whole merge/verify/commit sequence (`e01f637d`, `merge.mjs:897-935`).
- A heartbeat renews it every `DEFAULT_TTL_MS/3` so a long verify run
  doesn't make a live holder's lock read as stale (`merge.mjs:713-725`,
  `:913-927`).
- The release side only unlinks when still the recorded owner
  (`releaseMainCheckoutLockIfOwn`), closing the blind-unlink-on-exit gap.
- A pre-existing `MERGE_HEAD` (another item's in-flight/abandoned merge)
  is detected BEFORE this call's own merge attempt and returned as a
  distinct, named outcome, `merge-blocked-other-item` — never folded into
  a generic error, never triggers `git merge --abort` on someone else's
  state (`merge.mjs:1186-1200`).
- `git commit`'s real stderr/status now surfaces on failure.

**What is genuinely still open, and is this plan's real scope:**
`renewMainCheckoutLockIfOwn`'s return value is discarded at both call
sites in `mergeRunnerItem` (`merge.mjs:791`, `merge.mjs:925` — confirmed
still true in the current tree). The doc that shipped the heartbeat names
this itself as unclosed
(`docs/explanation/why-the-main-checkout-lock-needs-a-heartbeat-during-merge-verify.md`,
"What stayed open" §2): if a renewal tick genuinely fails
(`not-owner`/`ambiguous`/`no-lock` — the TTL lapses despite the heartbeat,
letting a second session legitimately reclaim mid-hold), the first
session's own remaining git operations keep running with no lock
protection any more, and today nothing surfaces this — no
`checkout-busy`-style category exists for it. The item's own reproduced
incident (tsk-zl5 vs tsk-bc7, 2026-08-16) postdates every fix above,
consistent with this being the live, still-open cause.

**Chosen path.** Node is single-threaded: the `setInterval` heartbeat can
only actually run between the `await`ed steps inside
`mergeRunnerItemLocked` (`runGoalCheck`, `runInvariantChecks`) — the `git
merge --no-commit`/`git commit` calls themselves are synchronous and fast,
so true mid-call preemption is not how this lock model works, and this
plan does not pretend otherwise. The fix is a cooperative checkpoint, the
same shape the pre-existing-`MERGE_HEAD` check already uses:

1. Track the last heartbeat tick's outcome in a variable the interval
   callback writes to (owned inside `mergeRunnerItem`, not a new module).
   Once a renewal fails, this flag never resets on its own (nothing in
   this code path re-acquires the lock mid-flight) — it is monotonic.
2. Check it exactly once: immediately before the `git commit` call, the
   one write operation whose protection actually matters (everything
   before it — `git merge --no-commit`, `runGoalCheck`, `runInvariantChecks`
   — is either read-only or already-undoable via `git merge --abort`). A
   second checkpoint right after `runGoalCheck` was considered and
   dropped: since the flag is monotonic, it would only fail a little
   sooner, never catch anything the pre-commit check wouldn't already
   catch — smaller path, same correctness. If the last renewal was
   `not-owner`/`ambiguous`/`no-lock`, stop before `git commit` runs —
   return a new, distinct outcome (`lock-lost-mid-merge`) rather than
   proceeding into it unprotected.
3. This new outcome follows `merge-blocked-other-item`'s own precedent
   exactly: never call `abortMergeIfPossible` casually — the tree's own
   state (whose lock now legitimately belongs to someone else) is exactly
   what must not be torn up by this now-evicted session; report and let
   the item park.

**Alternative rejected:** raising `HEARTBEAT_INTERVAL_MS` or `DEFAULT_TTL_MS`
further. Rejected for the same reason the original heartbeat doc rejected
a longer flat TTL — a moving target, and orthogonal to this gap: the TTL
already gets renewed on a live holder; the open problem is what happens
the rare time a renewal itself fails, not how often it's attempted.

**Files touched, in order:**
1. `src/runner/main-checkout-lock.mjs` — none (no change; the primitive
   whose return value goes unused is already correct: `renewMainCheckoutLockIfOwn`
   already returns `{status:...}` distinguishing every case this fix needs).
2. `src/runner/merge.mjs` — add the tracked-heartbeat-status variable and
   the single pre-commit checkpoint inside `mergeRunnerItemLocked`/
   `mergeRunnerItem`; new `lock-lost-mid-merge` outcome.
3. `src/verbs/merge/approve.mjs` — **both** call sites (leaf→parent
   `:533-583` region, root→main `:690-749` region) need an explicit
   `result.outcome === 'lock-lost-mid-merge'` branch mirroring
   `merge-blocked-other-item`'s shape exactly (`moveWork` to `blocked`,
   `addFriction`, return). Confirmed by direct read: unlike `sync-root.mjs`,
   `approve.mjs` has **no defensive catch-all** for an unrecognized
   `result.outcome` — it falls straight through every `if` to the
   "merged" success path, the exact regression class `tsk-4hj`'s own doc
   already flagged for `sync-root` before `tsk-1cp`'s guard closed it
   there. Skipping this file would report `awaiting-approval`/success on
   an item that was actually parked unprotected.
4. `src/verbs/merge/sync-root.mjs` — no change needed. Its existing
   defensive guard, `if (result.outcome !== 'merged')` at
   `sync-root.mjs:147-167` (verified by direct read — the code has since
   moved out of `bin/fgos.mjs`; the explanation doc's own `bin/fgos.mjs:3404`
   citation for this guard is stale post-refactor), already treats any
   non-`'merged'` outcome as an error by design, future-proofed for
   exactly this case.
5. `test/runner/merge.test.mjs` — new regression test: force a renewal
   failure between the verify step and the commit step (a second
   `mergeRunnerItem`/lock call taking over the lock via its own legitimate
   TTL-lapse path, or a direct unit test against the tracked-status
   variable's wiring) and assert the outcome is `lock-lost-mid-merge`, no
   commit lands, and `abortMergeIfPossible` is never invoked.
6. `docs/specs/runner.md` — the `catchup` precondition line already
   enumerates `merge-blocked-other-item` by name among retryable blocked
   reasons (`docs/specs/runner.md:1094`); confirm during `validating`
   whether `lock-lost-mid-merge` belongs in that same retryable set (the
   underlying cause — the other session's own merge — will itself
   eventually finish or get reclaimed, the same argument `merge-blocked-
   other-item` already used) and update the doc line if so.

Order follows the dependency chain directly (the lock primitive needs no
change → `merge.mjs` produces the new outcome → both `approve.mjs` sites
consume it → the test proves it); `fgos graph --json` was not consulted
for ordering since this is a single, non-split fix with no cross-item
scheduling question — its `criticalPath`/`topUnblock` fields answer "which
work item unblocks the most other work," not "which file to edit first"
within one item.

**Impact-analysis posture:** `degraded` — GitNexus is `present` for this
repo (`fgos tool query --capability impact-analysis --status present`)
but its `forgentX` index is 1232 commits behind `HEAD`
(`gitnexus list_repos`, `indexedAt: 2026-08-14`, current work is
2026-08-23) — too stale to trust for blast radius here. Used a direct
`rg` cross-check instead (the gate's own required fallback for a
suspicious/untrustworthy impact-analysis answer): `mergeRunnerItem` has
exactly 4 real call sites — `approve.mjs:533` (leaf→parent),
`approve.mjs:690` (root→main), `sync-root.mjs:108`, and
`promote-engine.mjs:73` — confirmed by grep, not assumed. Only the two
`approve.mjs` sites need a new branch (rule above); `sync-root.mjs` and
`promote-engine.mjs` are unaffected (the latter never reaches the
new-outcome-consuming call site at all — it uses `mergeRunnerItem`'s
`targetSlot`/ephemeral-worktree path for cross-item promotion, a
different code shape that does not touch `approve.mjs`'s outcome
dispatch).

## Risk map

| Component | Risk | Proof point (validating) |
|---|---|---|
| `mergeRunnerItem`'s new checkpoint logic | light — additive branch in an already-`try/finally`-wrapped, heavily-tested function; no existing behavior path changes shape | New regression test (files list, item 5) green; full existing `merge.test.mjs`/`main-checkout-lock.test.mjs` suite (156 tests, confirmed green pre-change in `RESEARCH.md`) stays green post-change |
| `approve.mjs`'s two new outcome branches | light — mirrors an already-shipped pattern (`merge-blocked-other-item`) verbatim, same file, same shape | Same regression test exercises at least one `approve.mjs` call site end-to-end, not just `mergeRunnerItem` in isolation |
| `sync-root.mjs` (unchanged) | none — defensive catch-all already covers a new outcome name by design | No code change, so no new proof needed here. Note (repo-fit correction): the citation in `tsk-1cp`'s own doc (`test/cli/fgos.test.mjs:6374`) is stale — that file does not exist in the current tree, and `grep -rl "sync-root-unhandled-outcome" test/` finds no dedicated regression test anywhere today. Pre-existing gap, unrelated to this item's own scope (this plan touches neither `sync-root.mjs` nor its test coverage) — named here rather than silently assumed covered |

## Outstanding questions

None
