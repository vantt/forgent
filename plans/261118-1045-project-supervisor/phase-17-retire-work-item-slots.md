# Phase 17 — Retire the work-item slot count

Deletion only. `workerSlots.ceiling` now counts worker seats per machine and is enforced where a seat starts (phase 6), so the Work-item count and its three gates go (L10, PS-12). Nothing is added to Work. The seat-start gate is the one owner of "is there room"; retired tests name it or say the behaviour was removed.

## Inputs
Step 0: re-grep after phase 16 landed. `rg -n "countWorkerSlots|hasWorkerSlotRoom|readWorkerSlotCeiling" src bin test apps` must show only the files below. A user in `bin/fgos.mjs` means phase 16 left `case 'slots'` behind: stop with `NEEDS_CONTEXT`. Any user outside this footprint also stops the phase.
- `src/state/worker-slots.mjs`: exports `ADMIN_LANE_RESERVATION` (:59), `DEFAULT_WORKER_SLOT_CEILING` (:81, value 8), `countWorkerSlots` (:106), `hasWorkerSlotRoom` (:150). The count is a fold over Work items at `doing`.
- `src/runner/claim-port.mjs`: `readWorkerSlotCeiling` (:29), its call in `claimWork` (:145), the gate (:236-246, code `worker-slot-ceiling`), the category map entry (:67), import (:20).
- `src/runner/loop.mjs`: import (:93-94); drain-run ceiling read and gate (:1632-1665, `roomRefused`, `idle` reason `worker-slot-ceiling` at :1724); discovery sweep gate (:1380-1386); claim-error branch (:1250).
- `src/runner/fanout-batch.mjs`: import (:6), gate and trim (:52-60, `slotsFull`, `deferred`).
- `src/setup/registrations.mjs`: imports `DEFAULT_WORKER_SLOT_CEILING` (:84); check `worker-slots-ceiling-usable` (:1333-1352, a doctor row kept by the registry).
- `docs/architecture-manifest.json:1444` and `test/architecture.test.mjs:1712` list the module.
- Tests: `test/state/worker-slots.test.mjs` (28 tests: slot unit tests, claim gate tests :228-290, `fgos slots` tests :292-310, `fgos report` tests :311-334, config-parse test :336, standard test :354, admin constant :372); `test/runner/claim-port.test.mjs:335-380`; `test/runner/claim-capacity-race.test.mjs`; `test/runner/loop.test.mjs:755-895` (`occupySlots`, `writeCeiling`); `test/runner/dispatch.test.mjs:2668-2700`; `test/setup/checks-doctor-config.test.mjs:28,119-150`.

**In this footprint:** `test/event-store/v-auth-01.test.mjs:64-90` runs a race in `slot` mode that expects code `worker-slot-ceiling`. It is outside this footprint and must lose its `slot` mode (the `move` mode keeps proving the claim race) in this same change.

## Footprint
`src/state/worker-slots.mjs`, `src/runner/claim-port.mjs`, `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`, `src/setup/**`, `test/state/worker-slots.test.mjs`, `test/state/report-verb.test.mjs` (the `fgos report` proofs move here), `test/event-store/v-auth-01.test.mjs` (drops its `slot` mode), `test/runner/claim-port.test.mjs`, `test/runner/claim-capacity-race.test.mjs`, `test/runner/loop.test.mjs`, `test/runner/dispatch.test.mjs`, `test/setup/checks-doctor-config.test.mjs`, `test/architecture.test.mjs`, `docs/architecture-manifest.json`.

## Steps
1. `claim-port.mjs`: delete `readWorkerSlotCeiling`, the ceiling read, the `!isPotentialStaleClaimReclaim` room block and the `worker-slot-ceiling` map entry. If `isPotentialStaleClaimReclaim` has no other reader, delete it with its inputs.
2. `loop.mjs`: delete the drain-run room gate (wave is no longer trimmed by items), `roomRefused` and the `worker-slot-ceiling` idle return (keep `frontier-empty`), the discovery-sweep gate, and the `worker-slot-ceiling` clause in the claim-error branch (keep `conflict`). A seat refused by the lane pool surfaces as the run's own `lane-pool-full` result, not here.
3. `fanout-batch.mjs`: delete the room check and trim; every candidate goes on to the mechanism check. Drop the `slotsFull` key (the fgos-fanout skill drops it in phase 18).
4. `registrations.mjs`: the row `worker-slots-ceiling-usable` stays. It no longer says "unarmed": it fails on a non-positive-integer or null ceiling and passes with `workerSlots.ceiling = N worker seat(s) per machine`. Remove the import and the "recommended: 8" text.
5. Delete `src/state/worker-slots.mjs`, its manifest line and its entry in `test/architecture.test.mjs`.
6. Tests. Each retired test names its owner:
   - slot unit tests, claim gate tests, `fgos slots` tests, standard test, admin-constant test, `claim-port.test.mjs` ceiling cases, `claim-capacity-race.test.mjs` (delete the file), the ceiling tests of `loop.test.mjs` and the two fanout tests of `dispatch.test.mjs`: behaviour moved to the seat-start gate; owner is `cargo test -p fgos-run-supervisor --test lanes` (ceiling refusal, session takes no lane, killed supervisor frees its lane) plus `apps/fgos/tests/supervision_verbs.rs` (`slots --json` shape).
   - config-parse claim refusal (`worker-slots.test.mjs:336`): behaviour removed (a claim no longer reads config); the config door's own parse refusal is owned by the config crate tests.
   - Move the `fgos report` tests to `test/state/report-verb.test.mjs` unchanged (they own that verb), then delete `worker-slots.test.mjs` if nothing else remains. Keep `occupySlots` only if a remaining loop test uses it.
   - `checks-doctor-config.test.mjs`: replace the three `worker-slots-ceiling-usable` cases to match step 4.
7. Record the retired test list and owners in the commit body, in plain words.

## Verify
- `rg -n "countWorkerSlots|hasWorkerSlotRoom|readWorkerSlotCeiling|worker-slot-ceiling" src bin test apps` finds nothing.
- `node scripts/run-tests.mjs test/state/worker-slots.test.mjs test/runner/claim-port.test.mjs test/runner/loop.test.mjs test/runner/dispatch.test.mjs test/setup/checks-doctor-config.test.mjs test/architecture.test.mjs` passes.
- `cargo test -p fgos-run-supervisor lanes` still passes.

## Rollback
Revert the merge commit. Phase 16 stays valid alone (it already moved `slots` to the lane view). Revert order: 17 before 16.
