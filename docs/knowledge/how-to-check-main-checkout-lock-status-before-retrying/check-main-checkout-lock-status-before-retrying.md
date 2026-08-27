---
type: how-to
title: How to check main-checkout-lock status before retrying
tags: []
timestamp: 2026-08-05T11:55:50.000Z
source_capture_ids: [tsk-5z2]
framework: diataxis
mode: how-to
---

# How to check main-checkout-lock status before retrying

Use this when `fgos take`/`fgos pick` refuses with `lock-held` or
`lock-ambiguous`, or `fgos unlock`/`fgos merge` refuses because the main
checkout lock is held — and you need to know whether the holder is still
genuinely live, and how long before the lock is eligible for reclaim,
before deciding whether to wait or retry.

## Before you start

This applies to `.fgos/main-checkout.lock` only. The other three locks in
the same lineage — `runner.lock`, `sessions.lock`, `events.lock` — write a
bare PID with no timestamp and no TTL concept at all, so age and
remaining-TTL are not computable for them (`tsk-5z2` CONTEXT.md D5, after
confirming this against each lock's own acquire function: `runner.lock`
in `src/runner/loop.mjs:204-276`, `sessions.lock` in
`src/runner/session.mjs:191-219`, `events.lock` in
`src/state/events.mjs:211-227`). If a refusal names one of those three
instead, this doc does not apply.

## Steps

1. **Run the read-only status verb.** It never blocks and never mutates
   the lock:

   ```
   fgos lock-status --json
   ```

   A real run against a currently-held lock (this session, 2026-08-05)
   returned:

   ```json
   {
     "outcome": "live",
     "holderPid": "01c09aa4-0ebd-48bf-8ae9-ae204baad61b",
     "lockAgeMs": 152121,
     "remainingTtlMs": 27879,
     "lockAge": "2m32s",
     "remainingTtl": "27s"
   }
   ```

2. **Read `outcome`.** It is one of four values
   (`src/runner/main-checkout-lock.mjs`'s `inspectMainCheckoutLock`):
   - **`free`** — no lock file exists. `holderPid`/`lockAgeMs`/
     `remainingTtlMs` are all `null`. Retry now; whatever refused you a
     moment ago has already cleared.
   - **`live`** — a real, running process still holds it within its TTL
     window. `remainingTtl` tells you how long until it becomes eligible
     for reclaim on its own. Wait that long, or address the holder
     directly, rather than retrying immediately.
   - **`stale`** — the recorded holder is either no longer running or has
     exceeded the TTL window. The next `take`/`pick`/`unlock` attempt
     reclaims it automatically as a side effect of trying — you do not
     need to clear it by hand first.
   - **`ambiguous`** — the lock file's content does not parse (D5's
     fail-closed case). No `record.ts` exists to compute age from, so
     `lockAgeMs`/`remainingTtlMs` may be `null` even though something is
     technically held. `fgos unlock` handles this case specifically via a
     force-reclaim path — see `docs/history/lock-status-visibility/CONTEXT.md`
     if you need the detail.

3. **Or read the age/TTL already folded into the refusal itself** — you do
   not have to run `lock-status` separately if you already hit a refusal;
   the three call sites that acquire this lock all surface the same two
   numbers inline now (`tsk-5z2` D1/D2/D3/D6):
   - `fgos take`/`fgos pick` (`src/runner/claim-port.mjs`):
     `` claimWork: main checkout locked by pid <holderPid> (held <lockAge>, expires in <remainingTtl>) ``
   - `fgos unlock` (`bin/fgos.mjs`, `case 'unlock'`):
     `` unlock: main checkout lock is held by a live session (<holderPid>, held <lockAge>, expires in <remainingTtl>) -- refusing to clear it. ``
   - `fgos merge` (`src/runner/merge.mjs`, `MergeError`):
     the same holder/age/remaining-TTL shape, added because the merge verb
     turned out to be a third caller of the same lock-acquire function
     that D2 had not originally accounted for (D6).

4. **Decide from `remainingTtl`, not from a guess.** A `live` lock with a
   `remainingTtl` of a few seconds is usually faster to wait out than to
   investigate; a `live` lock with several minutes left, or a holder you
   do not recognize, is worth checking on directly before waiting. A
   `stale` lock needs no decision at all — just retry the verb that
   refused you.

## Why this exists

Before this, every refusal path printed the holder's identity only
(`locked by pid <id>`) — the caller had no way to tell a legitimately-live
hold apart from a stale one without manually reading the raw lock file
and hand-computing `now - ts` against the TTL. `tsk-5z2` closed that gap
by widening `acquireMainCheckoutLock`'s `HELD`/`AMBIGUOUS` return with
`lockAgeMs`/`remainingTtlMs` (computed from data already in scope inside
the lock check, no new file read), folding both into the three existing
refusal messages, and adding this read-only status verb for inspection
outside a failed call (`tsk-5z2` CONTEXT.md D1–D3, D6).
