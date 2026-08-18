---
type: explanation
title: Why ppidOf bounds its ps call with a 200ms timeout
tags: [state, session-identity, events-lock, concurrency]
source_capture_ids: [tsk-13m]
---
# Why `ppidOf` bounds its `ps` call with a 200ms timeout

`resolveWriterIdentity` (`src/util/session-identity.mjs`) walks up to
`MAX_HOPS=3` parent processes via `ppidOf`, which shells out to
`execFileSync('ps', ...)` to resolve each hop. All 3 call sites that use
this writer identity (`src/state/store.mjs:362`, `:524`, `:765`) run
inside `withEventsLockAndRefresh` — the single cross-process write lock
every `fgos` verb serializes through. Before this fix, that `ps` call
carried no `timeout`: a hung or slow `ps` binary would block the one
shared write door for every process on the machine, indefinitely,
contradicting the "never blocks the mutation" invariant `store.mjs`'s own
call sites already documented (D18).

Measured cost of the walk: 0.2ms when a session environment variable is
already present (the common case), but 31.7ms for the full non-hung
3-hop walk when it is absent — a bare terminal, a git hook, or CI.

## Why a timeout, not a relocation

The fix bounds `ppidOf`'s existing `execFileSync` call with
`timeout: PPID_TIMEOUT_MS` rather than moving `resolveWriterIdentity`
outside the lock. Moving the call would help other waiters queued behind
the lock, but would not itself bound `ps` — only a timeout does that, and
it makes the "never blocks" claim literally true regardless of where the
call sits. `ppidOf`'s existing catch-all already treats a timeout-induced
throw exactly like every other `ps` failure (missing binary, non-zero
exit, unparsable output), so this added zero new branching.

## Why 200ms

`resolveWriterIdentity`'s hop loop stops on the first `ppidOf` failure,
so a hang costs at most one timeout period, never `MAX_HOPS` × timeout.
200ms is roughly 6x the measured normal-case worst case (31.7ms for the
full 3-hop walk with no session env var), while staying a full order of
magnitude under `events.lock`'s own 2s acquire-timeout
(`src/state/events.mjs:41-51`, sized for "sub-millisecond to low-ms"
holders). A genuinely hung `ps` now degrades one caller by 200ms instead
of hanging the shared write door indefinitely — the value only needs to
stay a bounded, small fraction of the lock's own budget, not match it
exactly.

## What was deliberately left out of scope

`events.lock`'s own hold-time budget — whether its 2s timeout, or the
65-88ms measured lock-body hold time this item's own scan surfaced, need
rethinking on their own — stayed out of scope. That is a separate, wider
question the item's own description pointed at `tsk-r87` for, not
something this fix attempts to resolve.

## Related

- `docs/history/tsk-13m-ps-timeout-under-write-lock/CONTEXT.md` — the
  full decision record (D1: timeout not relocation; D2: 200ms sizing;
  D3: events.lock's own budget stays with tsk-r87) and research trail.
- `docs/explanation/why-claimworks-cas-reread-stays-while-its-redundant-full-log-read-was-deduped.md` —
  another fix out of the same instability scan
  (`plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`).
