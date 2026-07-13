# phase-1-state-layer-4 — Execution Report

**Status:** DONE

**Outcome:** `src/state/store.mjs` — the sole module in the state layer that resolves `.fgos/` paths and writes to disk. Every mutation follows the same shared tail: append the event to `events.jsonl` FIRST (via `events.mjs`'s `appendEvent`), then rebuild the view fresh from the log and overwrite `state.json` SECOND (via `replay.mjs`'s `rebuildView`) — so a crash between the two leaves the log (truth) intact and the view merely stale, recoverable by `rebuild()`. `addWork` validates shape + dep-existence against the log's own current ids (never a possibly-stale view) before writing anything; `moveWork` looks the item up fresh and delegates the precondition/CAS decision to `fsm.mjs` (pure, unchanged) before appending the event it returns; `addDecision`, `listWork`, `rebuild` round out the six operations the CLI needs. `bin/fgos.mjs` — the single-door CLI with six verbs (`init`, `add`, `move`, `decision`, `list`, `rebuild`); every mutation goes through `store.mjs` only. Exit codes map error categories to the R4 contract: 0 ok, 1 unexpected, 2 precondition (`FsmError`), 3 conflict (`FsmError` CAS), 4 validation/not-found (`WorkValidationError`, `StoreError`), 5 corrupt-log (`EventLogError`) — callers branch on the code, never the message. Also fixed `package.json`'s `test` script (unquoted glob was silently dropping `test/smoke.test.mjs` under `npm test`/sh expansion — quoted it so `node --test` does its own glob) and added the `bin.fgos` entry. 17 new tests in `test/cli/fgos.test.mjs`, each spawning the real CLI (`node bin/fgos.mjs ...`) in its own `mkdtemp` cwd — covering every verb, every exit-code category, exactly-one-event-per-mutation, corrupt-log detection, and `rebuild` reconstructing `state.json` after the view file is deleted.

**Verification:** `node --test 'test/cli/*.test.mjs'` → 17 pass, 0 fail (recorded on trace with full output). Full suite `npm test` → 68 pass, 0 fail (51 pre-existing + 17 new; the glob fix means `npm test` now runs the same set as the direct quoted command).

**Files touched:** `bin/fgos.mjs`, `src/state/store.mjs`, `test/cli/fgos.test.mjs`, `package.json`

**Reservations:** released (all 4 paths).

**Full trace/evidence:** `.bee/cells/phase-1-state-layer-4.json`

**Commit:** `2777ee9` — `feat(phase-1-state-layer-4): fgos CLI single door + store.mjs write owner`
