---
type: explanation
title: Why claimWork's CAS reread stays while its one redundant full-log read was deduped
tags: [state, replay, claim-port, performance]
source_capture_ids: [tsk-3jh]
framework: diataxis
mode: explanation
---
# Why `claimWork`'s CAS reread stays while its one redundant full-log read was deduped

`.fgos/events.jsonl` has no snapshot and no incremental fold: every
read or write helper in `src/state/store.mjs` independently calls
`rebuildView(logPath)` — a full `readEvents` (parse the whole file) plus
`foldEvents` (replay every event) — with no caching, even within a single
synchronous call chain. Measured on a real, unwritten copy of this repo's
own store: one `moveWork` (`todo`→`doing`) cost 166ms and 3 full log
reads (13.1MB parsed); the state-layer portion of `claimWork` cost 274ms
and 7 full log reads (30.6MB parsed) plus 2 `state.json` rewrites
(7.32MB). This is a fixed tax on every verb that grows monotonically with
the project's own age, since `events.jsonl` only ever grows.

`tsk-3jh` set out to reduce that tax and found the honest answer is:
mostly not, not without a structurally different design. Only one of
`claimWork`'s 7 full-log reads turned out to be safely removable.

## Why the safe fix is narrow

`claim-port.mjs`'s `claimWork` calls `listWork(dir)` → `readRawEvents(dir)`
→ `moveWork(...)` → `addOutcome(...)` in sequence. The first two both
parse the identical file for two different projections of the same
data — `listWork` does a full `readEvents` + `foldEvents`, and
`readRawEvents` is literally `readEvents(logPath)` again, the same first
step `rebuildView` already performs — with nothing mutating the file in
between. Since `foldEvents` (`src/state/replay.mjs:30`) is already
exported and pure, `claimWork` can read raw events once and derive both
the raw array and the folded view from that single read, with zero
signature changes anywhere in `store.mjs`. That closes exactly 1 of the 7
reads (7→6) — real, but modest.

## Why the other reads are not the same kind of redundant

The temptation, once one duplicate read is found, is to look for more —
and `moveWork`'s and `registerTool`'s own internal
`before = rebuildView(logPath)` looks like the same pattern at a glance:
another full read of a file that was presumably just read by the caller
a moment ago. It is not. That read happens *inside*
`withEventsLockAndRefresh`'s locked callback, and it is the CAS
(compare-and-set) mechanism itself: reading the log fresh, under the
lock, is what catches a concurrent write from another process that
landed between the caller's earlier (unlocked) read and this write
attempt. Removing it would be a real correctness regression — a
lost-update risk — not an optimization, and not a theoretical one either:
this project's own sessions have repeatedly hit real multi-process lock
contention on this exact file (see
`docs/explanation/main-checkout-lock-toctou-race.md` and the
`main-checkout-lock` history). `addOutcome` has no such pre-read at all,
for a different reason — it is a pure additive append with no "from"
state to CAS against, so there is nothing to reread.

The rule this leaves for future reads of `store.mjs`: a full-log read
right before a *write* that checks or transitions state is very likely
load-bearing CAS, not redundancy — the giveaway is whether it happens
inside the same lock scope as the write. A full-log read that duplicates
an *earlier, already-committed* read with nothing mutating in between
(the `claimWork` shape above) is the only kind that's safe to fold away.

## What was deliberately left out of scope

The fixed per-verb replay tax itself — every verb across the whole CLI
independently re-parsing and re-folding the entire event log, with no
cross-call cache — was not attempted here. A structurally different fix
(a single-writer daemon or similar) was discussed live with the user and
captured as a separate, undecided, unscheduled proposal:
`plans/260810-2004-fgos-state-daemon-mcp-proposal/plan.md`. This item
does not block on it and does not attempt any part of it — the dedup
above is the one safe, narrow win available without that larger
redesign.

## Related

- `docs/history/tsk-3jh-dedupe-redundant-state-reads/CONTEXT.md` — the
  full decision record (D1: scope is exactly this one duplicate; D2: the
  broader daemon proposal stays separate) and research trail.
- `docs/explanation/main-checkout-lock-toctou-race.md` — the same class
  of real concurrent-write hazard this CAS reread exists to catch.
