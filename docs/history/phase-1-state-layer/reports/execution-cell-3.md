# phase-1-state-layer-3 — Execution Report

**Status:** DONE

**Outcome:** `src/state/fsm.mjs` — explicit transition table for `work.status` (todo/doing/blocked/done per D4): any (from, to) pair not in the table is refused with category `precondition` and no event is returned; `done` is terminal single-door — the only edge into it is `doing -> done`, and no edge leaves it, so every further transition attempt on a done item is refused. CAS: an `expectedStatus` that does not match the item's actual current status is refused with a distinct `conflict` category (checked before the table lookup), never a blind overwrite. `transitionWork` is pure — it decides and returns the validated `{ type: 'work.move', payload: { id, from, to } }` event; it never touches the filesystem (no `fs` import at all), matching D3 (writes belong solely to cell 4's store.mjs). `src/state/replay.mjs` — `foldEvents` folds an ordered event array into `{ work, decisions }` (work.add seeds an item, work.move updates its status, decision entries collect with their original event `ts`; unknown types are skipped for forward-compatibility); `rebuildView` reads the log through `events.mjs`'s `readEvents` and folds it. No `Date.now()` anywhere in the fold path — every timestamp comes from the event itself. 25 new tests in `test/state/fsm.test.mjs` and `test/state/replay.test.mjs`, including a determinism test (`rebuildView` twice from the same log is deep-equal) and a historical-ts test proving replay never substitutes wall-clock time.

**Verification:** `node --test 'test/state/*.test.mjs'` → 50 pass (25 pre-existing + 25 new), 0 fail, exit 0 (recorded on trace with output). `npm test` also green.

**Files touched:** `src/state/fsm.mjs`, `src/state/replay.mjs`, `test/state/fsm.test.mjs`, `test/state/replay.test.mjs`

**Reservations:** released (all 4 paths).

**Full trace/evidence:** `.bee/cells/phase-1-state-layer-3.json`

**Commit:** `7828cd5` — `feat(phase-1-state-layer-3): FSM transition table with precondition + CAS, and pure event-log replay`
