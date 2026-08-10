# Plan: wrap porting-store's read-check-append in one lock scope

Item: `tsk-1jp`. Mode: **small** — one file, mirrors an already-proven
pattern (`store.mjs`) byte-for-byte in shape, plus a real cross-process
race test mirroring an already-proven test technique. No design question,
no split.

## Approach

1. `src/state/porting-store.mjs`: import `withEventsLock`,
   `appendEventLocked` from `./events.mjs` alongside the existing
   `appendEvent`/`readEvents`. Wrap `addPorting`'s read-check-append
   (:112-118) in `withEventsLock(logPath, () => { ... return
   appendEventLocked(...); })`; same for `movePorting`'s CAS
   (:130-137). `refreshView(dir)` stays outside both scopes, matching
   `store.mjs:229`'s own placement. Correct the `:103-104` comment to
   state the guarantee accurately post-fix.
2. Tests (`test/state/porting-store.test.mjs`): add a
   `raceAcrossProcesses`-style helper (copied in shape from
   `test/state/store.test.mjs:34-75`, pointed at
   `src/state/porting-store.mjs`'s exports instead) and two real
   cross-process race tests: `addPorting` racing the same id (exactly one
   winner, log has exactly one `porting.add`), `movePorting` racing the
   same CAS `expectedStatus` (exactly one winner, log has exactly one
   matching `porting.move`).

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Lock-wrapping change | low — mirrors `store.mjs:140-231`'s own already-proven structure exactly, no new locking primitive | `store.mjs` read in full; `appendEventLocked` vs `appendEvent` distinction confirmed (`store.mjs`'s own 5 call sites of `appendEventLocked`, all inside a `withEventsLock` scope) |
| No existing test breaks | low | `test/state/porting-store.test.mjs` read in full — no test asserts on lock internals or timing, only outcomes (success/failure, view contents) |
| Race tests actually prove the bug | medium — the whole point of this item | Will be proven failing-test-first (Iron Law evidence) against the pre-fix file, using the same cross-process technique `store.mjs`'s own equivalent race tests already use successfully |

Impact-analysis posture: `degraded` — GitNexus `present` (checked via
`fgos tool query --capability impact-analysis --status present`), index
stale. `src/state/porting-store.mjs` is a real state-layer module, so
Iron Law evidence with a real failing-test-first transcript is the proof
surface, not a skip.

## Outstanding questions

None
