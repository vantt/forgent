# Phase 17 — Retire the work-item slot count, arm the lane pool

`workerSlots.ceiling` now counts worker seats per machine and is enforced where a top-level seat starts (phase 6), so the Work-item count and its three gates go (L10, PS-12). In the same change the key becomes `global-only` and its standard turns `4`, so no window ever arms the old work-item gate. Nothing is added to Work. The seat-start gate is the one owner of "is there room"; retired tests name it or say the behaviour was removed.

## Inputs
Step 0: re-grep after phase 16 landed. `rg -n "countWorkerSlots|hasWorkerSlotRoom|readWorkerSlotCeiling" src bin test apps` must show only the files below. A user in `bin/fgos.mjs` means phase 16 left `case 'slots'` behind: stop with `NEEDS_CONTEXT`. Any user outside this footprint also stops the phase.
- `src/state/worker-slots.mjs`: exports `ADMIN_LANE_RESERVATION` (:59), `DEFAULT_WORKER_SLOT_CEILING` (:81, value 8), `countWorkerSlots` (:106), `hasWorkerSlotRoom` (:150). The count is a fold over Work items at `doing`.
- `src/runner/claim-port.mjs`: `readWorkerSlotCeiling` (:29), its call in `claimWork` (:145), the gate (:236-246, code `worker-slot-ceiling`), the category map entry (:67), import (:20).
- `src/runner/loop.mjs`: import (:93-94); drain-run ceiling read and gate (:1632-1665, `roomRefused`, `idle` reason `worker-slot-ceiling` at :1724); discovery sweep gate (:1380-1386); claim-error branch (:1250).
- `src/runner/fanout-batch.mjs`: import (:6), gate and trim (:52-60, `slotsFull`, `deferred`).
- `src/setup/registrations.mjs`: imports `DEFAULT_WORKER_SLOT_CEILING` (:84); check `worker-slots-ceiling-usable` (:1333-1352, a doctor row kept by the registry).
- `docs/architecture-manifest.json:1444` and `test/architecture.test.mjs:1712` list the module.
- Other files naming the module or its row: `packages/distribution/contracts/doctor-registry.v1.json:140` (owner map) and `:474-479` (row `worker-slots-ceiling-usable`: judge file, description "or explicitly null"); `test/suite-baseline.json:226,557`; `docs/platform/component-boundary.md:1056`; the row text in `docs/platform/packaging-distribution/spec.md:586`.
- Config: `core/config-standard/workerSlots.yaml`, `core/config-schema/workerSlots.schema.yaml` (`ceiling: null`, owner `work-state`, doc "work items"); fixtures `packages/config/contracts/fixtures/registry-defaults.v1.json:14`, `authoring-source.config.json:1086` (hand-edited in the case format, fixtures README); a project-file write of the key in `test/state/gate-bypass.test.mjs:146` (fails once the key is global-only).
- Tests: `test/state/worker-slots.test.mjs` (28 tests: slot unit tests, claim gate tests :228-290, `fgos slots` tests :292-310, `fgos report` tests :311-334, config-parse test :336, standard test :354, admin constant :372); `test/runner/claim-port.test.mjs:335-380`; `test/runner/claim-capacity-race.test.mjs`; `test/runner/loop.test.mjs:755-895` (`occupySlots`, `writeCeiling`); `test/runner/dispatch.test.mjs:2668-2700`; `test/setup/checks-doctor-config.test.mjs:28,119-150`.

**In this footprint:** `test/event-store/v-auth-01.test.mjs:64-90` runs a race in `slot` mode that expects code `worker-slot-ceiling`. It must lose its `slot` mode (the `move` mode keeps proving the claim race) in this same change.

## Footprint
`src/state/worker-slots.mjs`, `src/runner/claim-port.mjs`, `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`, `src/setup/**`, `test/state/worker-slots.test.mjs`, `test/state/report-verb.test.mjs` (the `fgos report` proofs move here), `test/event-store/v-auth-01.test.mjs` (drops its `slot` mode), `test/runner/claim-port.test.mjs`, `test/runner/claim-capacity-race.test.mjs`, `test/runner/loop.test.mjs`, `test/runner/dispatch.test.mjs`, `test/setup/checks-doctor-config.test.mjs`, `test/architecture.test.mjs`, `docs/architecture-manifest.json`, `core/config-standard/workerSlots.yaml`, `core/config-schema/workerSlots.schema.yaml`, `packages/config/contracts/fixtures/**`, `packages/distribution/contracts/doctor-registry.v1.json`, `docs/platform/component-boundary.md`, `docs/platform/packaging-distribution/spec.md`, `test/suite-baseline.json`, `test/state/gate-bypass.test.mjs`. (`test/state/report-verb.test.mjs` is new: the `fgos report` proofs move there unchanged.)

## Steps
1. `claim-port.mjs`: delete `readWorkerSlotCeiling`, the ceiling read, the `!isPotentialStaleClaimReclaim` room block and the `worker-slot-ceiling` map entry. If `isPotentialStaleClaimReclaim` has no other reader, delete it with its inputs.
2. `loop.mjs`: delete the drain-run room gate (wave is no longer trimmed by items), `roomRefused` and the `worker-slot-ceiling` idle return (keep `frontier-empty`), the discovery-sweep gate, and the `worker-slot-ceiling` clause in the claim-error branch (keep `conflict`). A seat refused by the lane pool surfaces as the run's own `lane-pool-full` result, not here.
3. `fanout-batch.mjs`: delete the room check and trim; every candidate goes on to the mechanism check; a seat past the pool waits up to `workerSlots.laneWaitSec` at seat start (phase 6) instead of being trimmed here, so a 6-way fanout on 4 lanes runs 4, then 2 as lanes free. Drop the `slotsFull` key (the fgos-fanout skill drops it in phase 18).
4. `registrations.mjs`: the row `worker-slots-ceiling-usable` stays. It no longer says "unarmed": it fails on a non-positive-integer or null ceiling and passes with `workerSlots.ceiling = N worker seat(s) per machine`. Remove the import and the "recommended: 8" text.
5. Delete `src/state/worker-slots.mjs`, its manifest line, its entry in `test/architecture.test.mjs`, its owner-map line in `doctor-registry.v1.json:140`, its baseline lines in `test/suite-baseline.json`, and its mention in `component-boundary.md:1056`. Update the `worker-slots-ceiling-usable` registry row (judge file `src/setup/registrations.mjs`, description without "or explicitly null") and its text in `packaging-distribution/spec.md:586`.
5a. Arm: `workerSlots.yaml` standard `ceiling: 4`, doc "worker seats on this machine (a lead and a nested dispatch take none)"; schema `x-fgos-scope: global-only` (a machine pool, config spec §3), type `integer` minimum 1 (no null: unarmed is gone), owner comment `run-supervisor`. Fix the two config fixtures and `gate-bypass.test.mjs:146` (use another project key there).
6. Tests. Each retired test names its owner:
   - slot unit tests, claim gate tests, `fgos slots` tests, standard test, admin-constant test, `claim-port.test.mjs` ceiling cases, `claim-capacity-race.test.mjs` (delete the file), the ceiling tests of `loop.test.mjs` and the two fanout tests of `dispatch.test.mjs`: behaviour moved to the seat-start gate; owner is `cargo test -p fgos-run-supervisor --test lanes` (ceiling refusal, session takes no lane, killed supervisor frees its lane) plus `apps/fgos/tests/supervision_verbs.rs` (`slots --json` shape).
   - config-parse claim refusal (`worker-slots.test.mjs:336`): behaviour removed (a claim no longer reads config); the config door's own parse refusal is owned by the config crate tests.
   - Move the `fgos report` tests to `test/state/report-verb.test.mjs` unchanged (they own that verb), then delete `worker-slots.test.mjs` if nothing else remains. Keep `occupySlots` only if a remaining loop test uses it.
   - `checks-doctor-config.test.mjs`: replace the three `worker-slots-ceiling-usable` cases to match step 4.
7. Record the retired test list and owners in the commit body, in plain words.

## Verify
- `rg -n "countWorkerSlots|hasWorkerSlotRoom|readWorkerSlotCeiling|worker-slot-ceiling" src bin test apps` finds nothing.
- `node scripts/run-tests.mjs test/state/worker-slots.test.mjs test/runner/claim-port.test.mjs test/runner/loop.test.mjs test/runner/dispatch.test.mjs test/setup/checks-doctor-config.test.mjs test/architecture.test.mjs` passes.
- `cargo test -p fgos-run-supervisor --test lanes` and `cargo test -p fgos-config` pass; `node scripts/run-tests.mjs test/state/gate-bypass.test.mjs test/state/report-verb.test.mjs test/event-store/v-auth-01.test.mjs` passes.
- `npm run fgos:dev -- config show --json` shows `workerSlots.ceiling: 4`; `rg -n "worker-slots.mjs" packages docs test src` finds nothing.

## Rollback
Revert the merge commit: the old gate returns with `ceiling: null` (unarmed), so nothing is refused until someone sets it. Phase 16 stays valid alone (it already moved `slots` to the lane view). Revert order: 17 before 16.
