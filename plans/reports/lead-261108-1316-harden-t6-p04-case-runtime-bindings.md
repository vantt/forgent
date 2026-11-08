# HARDEN T6 P04 lead report: case runtime and bindings

Branch `harden/t6-p04-case-runtime-bindings` (rebased on `116d14545`, after the execution core seams landed). Commits: red tests `10defc9d1` then the fix. Not pushed: the coordinator put a hold on pushes to main (main checkout restored by another party).

## What changed
- Every hold of a case's advance (`drainCaseInbox`) now: repairs this case's binding records, folds pending settles, then gives back as `not-started` each live writing reservation proven dead (worktree exists, custody free, Unit run has no `unit.json` or a settled one with no controller; gate runs have no record), then folds gate answer rounds. Independent of an inbox directory.
- `port.settle` takes `advance` with `drain: false`: a settle appends before any release. Without this the settle of every writing Unit would have been replaced by its own `not-started` release (found by the focused run).
- Reservation files are gone. `applySettle` unbinds the binding the ledger shows for the reservation's worktree. A Unit asked again leaves no binding after its settle.
- Gate: custody lease (`admitSuccessor`) taken before admission, command run with `{ custody }`, lease released before settle.
- One reader `inspectCaseBindings` in `case-bindings.mjs` for the doctor row; `repairCaseBindings` walks records and runs only under the owning case's hold; doctor fix = sentinel only. Binding refusal names the owning case and `fgos workflow resume`/`close`.
- Inbox: `readAgentFileSync` (cap 256 KiB; largest real file seen 763 B), pipes/links/garbage named in `skipped`, a settle naming no reservation refused and kept.
- `case-advance-busy` code; `advance.log` progress only (`spawnDetachedCli` got `logStdout`, default true; `src/cli/detached-child.mjs` is outside the phase file list, one option).
- Dead names un-exported, double import and `'.root'` literal gone, holder-list twin merged, one bind block (`admitUnderHold`), `createCaseAdmissionPort` 96 lines.

## Red to green
Red commit `10defc9d1`: B-2 (no inbox dir, positive evidence), inbox FIFO (the run hung until the runner's 600 s timeout), no-reservation settle, re-admit leaves binding, record with no binding event, record with ledger `unbound`, unsettled-record refusal text. All green in the fix commit. The log-progress test was written with the fix, not shown red.

## Retired tests and owners
See the commit body: doctor fix rebuild/settle cases -> `case-bindings.test.mjs` repair cases and the port unsettled-record case; reservation-file assertions -> ledger events in the same files.

## Deviations and concerns
- The phase says a killed gate's child dies with it. Measured: the borrowed command inherits the lease descriptor and keeps running after the gate is killed; the lease stays held until it exits. Result is safe (reservation not released while the command lives, released after); the doors test asserts exactly that.
- Race left: a Unit whose record is `settled` and controller released, between that and its settle call, could meet another process's hold and be released as `not-started`. Window is the gap between two adjacent statements in `runUnit`; the other order (settle first) is closed.
- Tests that admit writing reservations by hand without custody now need `acquireDispatchCwdLock` (a reservation nobody holds custody of is dead): `conductor-case.test.mjs` (not in the phase list), `case-admission-port.test.mjs`. `playbook-proposer.test.mjs` read reservation files; now reads the ledger.
- Rebuild of a missing record stayed (moved into `repairCaseBindings`), otherwise a bound worktree could read free.
- Co-author trailer uses the true model name (Claude Sonnet 5.5) per the session's attribution rule, not the brief's Opus line.

## Size (phase estimate: Node -75, tests +70)
src: setup -80, workflow +121 (bindings +77: reader moved in and rebuild kept; runtime +36; gate +13), net Node +41; tests +71/-9 in edited files plus the red commit +205/-41. Over budget on Node: the safety pieces (positive-evidence release, input reading) cost more than the deletions gave.

## Gate
Focused list + architecture + doc-health + citation drift: 339 tests, 2 failures fixed (custody in two fixtures), rerun green. One-door census regenerated, 0 undeclared. Full `npm test` (before the last comment move): 8609 tests, 1 fail = the known V7n addendum; suite warning about a spawn without a boundary reason fixed afterwards. Rust untouched. Baseline file (`test/suite-baseline.json`) to regenerate at landing.
