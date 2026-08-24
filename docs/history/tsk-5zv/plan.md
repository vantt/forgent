# plan.md — tsk-5zv

Mode: standard

Flags applied (2): existing covered behavior (all three edits touch code
paths already covered by `test/runner/main-checkout-lock.test.mjs`,
`test/runner/lock-wait.test.mjs`, `test/runner/promote-engine.test.mjs`,
`test/cli/fgos-merge.test.mjs`); weak proof around the area (concurrent
lock-timing behavior is inherently hard to prove deterministically — the
item's own `verify` was still undetermined at discovery). Not high-risk: no
auth/authorization/data-model/audit-security/external-provider/public-contract
flag applies, and nothing here removes a validation — purely additive lock
hygiene mirroring an already-shipped pattern (D1/D2, `docs/history/tsk-5zv/CONTEXT.md`).

`fgos graph --what-if tsk-5zv`: `unblocksTransitive: 0`, `newlyReady: []` —
this item sits on no critical path and blocks no other work, so ordering
across the three fix points is free to follow local convenience rather than
any external unblock pressure.

Impact-analysis posture (`fgos tool query --capability impact-analysis
--status present`): `full` (GitNexus present) — but `bin/fgos.mjs` is a
known zero-indexed-`Function`-symbol file even on a fresh reindex (CLAUDE.md's
gate note, reconfirmed again this planning pass: the same `withLockRetry`
query that surfaced 4 real call sites via `rg` returned only the unrelated
test-file caller via GitNexus). Every citation below was cross-checked with a
direct `rg`/`Read` pass, never trusted from a GitNexus result on this file.

## Approach

Chosen path: three narrow, mechanical edits, no new abstraction — each one
mirrors an already-proven, already-shipped pattern elsewhere in the same
file/verb family (honors D1/D2, `docs/history/tsk-5zv/CONTEXT.md`).

1. **`case 'compound'`** (bin/fgos.mjs:1601-1640) — add
   `releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id)`
   immediately after the `addOutcome` call (bin/fgos.mjs:1638), before the
   `return`. Mirrors `case 'return'`'s own two call sites
   (bin/fgos.mjs:3385, 3414) verbatim — same two-argument call, same
   identity-checked release discipline, no change to
   `releaseMainCheckoutLockIfOwn`'s own internals.
2. **`case 'cleanup'`** (bin/fgos.mjs:1527-1577) — add the same call at
   both its settling points: right before the `return` in the
   `moveWork(...to:'blocked')` branch (bin/fgos.mjs:1559-1560) and right
   before the `return` in the `moveWork(...to:'done')` branch
   (bin/fgos.mjs:1575-1576). Same pattern as #1.
3. **`promote-engine.mjs:73`** (`retargetMember`) — wrap the existing
   `mergeRunnerItem(ephemeral.path, memberItem, { ...lockRoot: repoRoot })`
   call in `withLockRetry`, mirroring the exact `runMerge` wrapper already
   proven in `src/verbs/merge/approve.mjs:129` and
   `src/verbs/merge/sync-root.mjs:105`:
   `withLockRetry(() => mergeRunnerItem(...), { waitMs: undefined })`.
   `promote-to-component` (bin/fgos.mjs:3495) exposes no `--no-wait`/`--wait`
   flags today (confirmed by reading the full case block — unlike
   approve/sync-root it never calls `parseMergeClusterOptions`), so there is
   no flag surface to add or thread through; `withLockRetry`'s own documented
   default (`waitMs === undefined` bounds the wait to the lock's own
   remaining TTL, `src/runner/lock-wait.mjs:58`) is applied unconditionally —
   the same default-ON behavior approve/sync-root fall back to when their own
   `--no-wait` is omitted, just without a flag to opt out of it (no existing
   caller of `promote-to-component` has ever had that option, so this adds
   retry-on-contention without removing any existing opt-out).

Order: #1 and #2 first (same file, same one-line pattern, zero ambiguity),
then #3 (different file, small wrapper). No dependency between them — safe
to do in any order, or in one pass.

### Risk map

| Component | Risk | What proves it |
|---|---|---|
| `case 'compound'` release-early | low | `test/runner/main-checkout-lock.test.mjs`'s existing release-path assertions extended to cover this call site (mirrors however `case 'return'` is already covered there); `npm test` green with no new failures. |
| `case 'cleanup'` release-early (both branches) | low | Same file, same extension — cover both the `blocked` and `done` settling points. |
| `promote-engine.mjs` retry wrap | low-medium | `test/runner/promote-engine.test.mjs` and `test/runner/lock-wait.test.mjs` already cover the two halves (`retargetMember`'s merge call, `withLockRetry`'s retry/backoff) separately — extend one of them to assert the wrap is actually applied (a lock-held throw from the wrapped call is retried, not raised immediately). Medium only because this is the one edit not already an exact byte-for-byte mirror of an existing call site (approve/sync-root additionally thread `--no-wait`/`--wait` flags this verb doesn't have) — the proof point above is what closes that gap. |

None of the three risk entries is medium/high enough to need a dedicated
proof point beyond "extend the existing precedent test + full suite green" —
flagged here per Approach's own rule, not escalated further because the
precedent coverage already exists for every piece being touched.

## Shape

One honest piece — no split (D2 already locked this). All three edits are
the same bug class (a settling point or merge call that never
releases/retries the shared main-checkout lock), touched together, verified
together.

Cases worth proving against, at `standard` depth:
- **Existing behavior must not regress**: `case 'compound'`/`case 'cleanup'`
  still write the exact same `addOutcome`/`moveWork` events they do today —
  the release call is a pure addition after the settling write, never a
  replacement or reorder of it. `promote-to-component`'s merge outcome
  (`merged`/anything else) is unchanged by wrapping it — `withLockRetry`
  only retries on `code:'lock-held'`, every other outcome/throw passes
  through exactly as `mergeRunnerItem` already returns/throws it today
  (confirmed via `src/runner/merge.mjs:747-748`'s own documented
  compatibility comment, CONTEXT.md's scout evidence).
- **Concurrent access**: the actual bug this item exists to close — two
  sessions racing `take`/`pick`/`approve`/`promote-to-component` while a
  retro-loop/cleanup-loop sweep holds the lock. The precedent tests already
  simulate this shape (a held lock, a contending caller) for
  `case 'return'`/`take`/`pick`; the new tests for #1/#2/#3 follow the same
  simulation shape rather than inventing a new one.
- **Partial failure**: `releaseMainCheckoutLockIfOwn` is already
  identity-checked and TOCTOU-safe (untouched by this item — CONTEXT.md's
  "out of scope" note) — no new partial-failure surface is introduced by
  calling it from two more sites. `withLockRetry` wrapping a call that
  itself throws a non-lock error (a real merge conflict, a verify failure)
  must still propagate that error unchanged, not swallow it into a retry
  loop — this is exactly what the existing `lock-wait.test.mjs` coverage
  already asserts for its other callers, extended to cover this one.

## Outstanding questions

None
