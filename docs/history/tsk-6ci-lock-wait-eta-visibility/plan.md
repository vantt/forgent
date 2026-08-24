# tsk-6ci — plan.md

Mode: tiny

Flags counted (per `fgos-routing`'s Mode gate): only "existing covered
behavior" applies (`lock-wait.mjs` has a real test, `test/runner/
lock-wait.test.mjs`, whose assertions on the printed progress line this
change touches). None of auth / authorization / data model / audit-
security / external systems / public contracts / cross-platform / weak
proof / multi-domain apply — a stderr diagnostic string in a CLI retry
loop, single file, no state/behavior change. 1 flag → tiny.

## Approach

**Chosen path:** In `src/runner/lock-wait.mjs`'s `withLockRetry`, extend
the existing progress-line print (line 104-106) to also surface
`err.remainingTtlMs` and `err.lockAgeMs` — both already computed and
attached to the `lock-held` error object by every current caller
(`claimWork` in `claim-port.mjs`, `mergeRunnerItem`'s two call sites in
`merge.mjs`), per `tsk-5z2`'s landed `lock-status-visibility` work. No new
lock inspection call, no new field on the lock file, no cadence change —
this is reading two fields that are already sitting on `err` unused.
Format with the same `formatLockDurationMs` helper `claim-port.mjs`/
`merge.mjs` already use (imported from `main-checkout-lock.mjs`), so the
wording matches the one-shot failure messages this same loop eventually
throws if the wait budget is exhausted.

Add a "may be stale, consider fgos-unlock" hint once `remainingTtlMs`
reads `0` (or is absent because the caller never populated it) — that is
the exact condition under which the lock would already be reclaimable, the
same signal `inspectMainCheckoutLock`'s `stale` outcome is built from,
without calling that function separately.

**Alternatives rejected:**
- Calling `fgos lock-status` / `inspectMainCheckoutLock` directly from
  inside the retry loop — rejected: it would re-read and re-parse the
  lock file a second time per poll tick for data the caught error object
  already carries for free (D-cite: RESEARCH.md Round 1 finding).
- Changing the backoff schedule/cadence itself (`BACKOFF_SCHEDULE_MS`) —
  out of scope; the item's own ambiguity list separated "poll cadence"
  from "what's shown," and RESEARCH.md Round 1 found the cadence itself
  is not the reported gap — the missing ETA/staleness signal is.

**Risk map:**
| Component | Risk | Proof point |
|---|---|---|
| `withLockRetry`'s progress-line print | light | existing `test/runner/lock-wait.test.mjs` extended to assert the new fields appear in the printed line under a `lock-held` err carrying `remainingTtlMs`/`lockAgeMs`, and that the line still renders sanely when they're absent (a caller that never sets them, if any exists) |

No medium/high-risk component — no proof point beyond the one test file
above is needed.

**impact-analysis posture:** `degraded` — GitNexus is `present` for this
repo's scan root (`/home/vantt/projects/forgentX`) but flagged 1749
commits behind HEAD (stale index; `fgos tool query --capability
impact-analysis --status present`, cross-checked live). Cross-checked with
`rg -rln "withLockRetry" src bin test`: 4 call sites (`merge.mjs`,
`verbs/merge/approve.mjs`, `verbs/merge/sync-root.mjs`, `bin/fgos.mjs`),
all just invoking `withLockRetry(fn, opts)` — none read or depend on the
printed diagnostic text itself, so none need touching. Blast radius
confirmed narrow by direct grep, not by the (stale) graph index.

**Files touched, in order:**
1. `src/runner/lock-wait.mjs` — extend the progress-line print.
2. `test/runner/lock-wait.test.mjs` — extend coverage for the new fields.

No `fgos graph --json` critical-path/topUnblock ordering needed beyond
this — single self-contained file plus its own test, no cross-item
dependency.

## Shape

Direct, tiny-mode note (no split): the fix is a small addition to one
`process.stderr.write` template string inside `withLockRetry`, reusing
`formatLockDurationMs` (already imported transitively via
`main-checkout-lock.mjs`, or imported fresh — implementer's call) — e.g.
appending `, remaining TTL <formatted remainingTtlMs>` when
`remainingTtlMs` is a number `> 0`, and `— TTL EXPIRED, may be stale:
consider fgos-unlock` when it reads `0`. No change to `err`'s shape, no
change to what triggers a print (`delayMs > 0`, unchanged), no change to
`withLockRetry`'s return/throw contract.

Concrete cases to prove in the extended test:
- A `lock-held` err with `remainingTtlMs > 0` and a numeric `holderPid` →
  printed line includes both the existing holder qualifier and a
  remaining-TTL phrase.
- A `lock-held` err with `remainingTtlMs === 0` → printed line includes
  the stale/`fgos-unlock` hint.
- A `lock-held` err with `remainingTtlMs` absent (`undefined`) — the shape
  `withLockRetry`'s own catch block already tolerates for `holderPid`
  today (defensive, in case a future caller omits it) — printed line
  still renders without throwing, no bogus "0s" claim.

No split. One item, one piece.

## Outstanding questions

None
