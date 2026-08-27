---
type: how-to
title: How to wait out a genuinely active main-checkout lock holder
tags: []
timestamp: 2026-08-04T08:50:44.000Z
source_capture_ids: [tsk-2rf, tsk-mgb]
framework: diataxis
mode: how-to
---
# How to wait out a genuinely active main-checkout lock holder

Use this when `fgos take`/`fgos pick`/`fgos approve`/`fgos merge` keeps
failing with exit 7 `lock-held`, and — unlike
`docs/how-to/clear-a-stuck-main-checkout-lock.md`'s case — the holder is
genuinely alive and actively refreshing the lock, not stale or dead. That
doc's remedy (`fgos unlock`) correctly refuses in this situation; this doc
covers what to do instead.

## Why the default retry gives up too early against a live holder

`withLockRetry` (`src/runner/lock-wait.mjs`) normally bounds its retry
budget by the `remainingTtlMs` read off the *first* `lock-held` error. A
genuinely active holder keeps self-refreshing the lock (self-recognition,
`src/runner/main-checkout-lock.mjs`), so that `remainingTtlMs` snapshot
never meaningfully decreases — no amount of default retrying can ever
outlast it. Real example that motivated this fix (tsk-2rf): `fgos pick
tsk-27y` failing exit 7 on 2026-08-03 with `"held 0s (expires in
2m59s)... waited 141528ms before giving up"` — `"held 0s"` repeating on
every check meant the holder was actively refreshing, not orphaned.

## Steps

1. **Confirm the holder is actually live**, not stuck — same check as
   `docs/how-to/clear-a-stuck-main-checkout-lock.md` step 3. If it turns
   out stale/orphaned instead, use `fgos unlock` there, not this doc.

2. **Pass an explicit `--wait <ms>`** on the failing verb (`take`, `pick`,
   `approve`, or `merge` — the four call sites that carry it,
   `bin/fgos.mjs`):

   ```
   fgos pick tsk-27y --wait 300000
   ```

   An *explicit* `--wait` value is now a true wall-clock ceiling,
   independent of the lock's own `remainingTtlMs` snapshot — it keeps
   retrying on the same backoff schedule (500ms → 1s → 2s cap) until
   either the claim succeeds, the `--wait` value elapses, or a
   non-`lock-held` error is thrown (`AMBIGUOUS` still fails immediately,
   unchanged). This is the opposite of the *default*, no-flag retry
   behavior, which is untouched and still bounded by `remainingTtlMs`.

3. **Cap `--wait` at 900000ms (15 minutes).** A larger value is rejected
   at parse time:

   ```
   fgos pick tsk-27y --wait 999999999
   # error: pick --wait must be at most 900000ms (15 min) (got "999999999").
   ```

   Long enough to outlast a normal active-holder execution burst; short
   enough that a mistyped value can't hang a CLI call near-indefinitely.

4. **Watch stderr once the wait runs past where the old behavior would
   already have given up.** Past that point, each backoff tick prints a
   status line so an extended wait never looks like a silent hang:

   ```
   still waiting on main-checkout lock (holder pid 2919808, 187s elapsed)
   ```

   Before that point, output is unchanged (no line printed mid-retry).

## Update (`tsk-mgb`): step 4's progress line used to never print at all on the default path

Step 4 above describes the *intended* behavior. Until `tsk-mgb` fixed it,
the *default* (no `--wait`) path never printed the progress line at
all, even after a long wait — the print guard (`delayMs > 0 &&
elapsedMs >= originalRemainingTtlMs`) was two mutually-exclusive
conditions on that path: once `elapsedMs >= originalRemainingTtlMs`
(`budgetMs` on the default path), the remaining budget `budgetMs -
elapsedMs` could never still be positive, so `delayMs > 0` could never
also hold. A `pick`/`take`/`approve` blocked on lock contention with no
`--wait` printed nothing but Node's own `TimeoutNegativeWarning` —
looking exactly like a silent hang, not a bounded wait:

> "Root cause confirmed by reading `src/runner/lock-wait.mjs:76` in full:
> the print guard is `delayMs > 0 && elapsedMs >=
> originalRemainingTtlMs`. On the default (no explicit `waitMs`) path,
> `budgetMs === originalRemainingTtlMs` ... The two conjuncts are
> mutually exclusive by construction on this path."
> — real `docs/history/tsk-mgb-lock-wait-progress-line-and-busy-spin/CONTEXT.md`

A second bug shared the same root: once `elapsedMs` exceeded `budgetMs`
but stayed inside the intentional 250ms landing grace window, the
schedule-derived delay went negative, `setTimeout` clamped it to ~1ms,
and the retry loop busy-spun full `claimWork` attempts back-to-back —
measured at 233 full attempts for a single 3-second wait.

**The fix**: once the remaining budget is no longer positive, sleep out
exactly what's left of the 250ms grace window instead of the
(possibly-negative) schedule-derived delay — guaranteeing exactly one
more bounded sleep, never a busy-spin — then simplify the print guard to
just `delayMs > 0`, which now correctly covers every real sleep on both
the default and explicit-`--wait` paths. Since this fix, the progress
line described in step 4 prints on the default (no-`--wait`) path too,
not only once an explicit `--wait` extends past the old TTL-snapshot
boundary.

## What doesn't change

- Omitting `--wait` entirely keeps today's exact default-ON behavior:
  bounded by the first HELD error's `remainingTtlMs`. No automated caller
  in this repo (`/fgOS:cleanup-loop`, `/fgOS:merge-loop`, etc.) passes
  `--wait` today, so none of them are affected.
- `AMBIGUOUS` (unparseable lock content) still fails immediately on the
  first attempt — use `fgos unlock` for that case, per
  `docs/how-to/clear-a-stuck-main-checkout-lock.md`.
- No fairness/queueing between multiple waiters — this only lets one
  waiter outlast one active holder's TTL snapshot.

## Update (`tsk-328`): `/fgOS:merge-next` and `/fgOS:merge-loop` now forward `--wait`/`--no-wait`/`--timeout` too

The "no automated caller... passes `--wait` today" bullet above no longer
covers every skill-level caller. `fgos merge next` (the CLI verb) already
recursed into `approve` and already forwarded `--wait <ms>`/`--no-wait`/
`--timeout <ms>` to it — the capability already existed at the CLI layer;
only the `/fgOS:merge-next` and `/fgOS:merge-loop` skill wrappers never
exposed it, silently ignoring any such flags in `$ARGUMENTS`.

Both wrappers now parse `$ARGUMENTS` for exactly these three flags and
forward whichever were present, verbatim, onto the underlying `merge
next` call:

```
/fgOS:merge-next --wait 300000
```

Omitting all three keeps today's default lock-wait behavior byte-
identical — this is additive, not a behavior change for a caller passing
nothing. `fgos catchup` is explicitly unaffected: it never acquires
`.fgos/main-checkout.lock` in current code, so it was never in scope for
this passthrough.

Use this when an unattended `/fgOS:merge-loop` run (or a person driving
`/fgOS:merge-next` by hand) hits sustained lock contention and needs to
widen the retry budget without dropping to the raw `fgos merge next
--wait <ms>` CLI call directly.

## Related

- `docs/how-to/clear-a-stuck-main-checkout-lock.md` — the stale/dead-lock
  case, and how to tell it apart from a genuinely live holder.
- `docs/history/main-checkout-lock-wait-decouple-ttl-snapshot/CONTEXT.md`
  (tsk-2rf) — the locked decisions (D1-D5) this doc reflects.
- `docs/history/fgos-wait-retry-main-checkout-lock/CONTEXT.md` (tsk-6c2) —
  the original `--wait` mechanism this item reopened a scoped part of.
