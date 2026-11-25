# Phase 7 Report: Rewire workflow tests and shared helpers

**Plan:** `plans/261122-2108-delete-dead-node-execution-closure`  
**Phase:** 7  
**Date:** 2026-11-25  

## Disposition table

| test file | cases | disposition (retired/rewired) | owning proof or reason |
|---|---|---|---|
| `test/helpers/declared-assignment.mjs` | (helper) | left unchanged | Last non-phase-6 consumer (`operation-choice`) rewired off it; helper kept for phase 6. |
| `test/helpers/executor-model-vectors.helper.mjs` | (helper) | **retired** (deleted) | Owning proof: `packages/execution/rust/tests/golden_executor_model.rs` (`every_executor_model_vector_has_the_answer_the_contract_records`), replaying `packages/execution/contracts/executor-model.v1.json`. |
| `test/helpers/packaged-definitions.mjs` | (helper) | **rewired** | `POLICY_PATCH_FIELDS` now read from live contract `packages/execution/contracts/execution-contract/contract.json` (Rust twin `packages/execution/engine/src/contract/validate.rs` `POLICY_PATCH_FIELDS`; proof `the_contract_constants_are_the_ones_node_exports`). Exported names/shapes unchanged. |
| `test/helpers/work-seat-config.mjs` | (helper) | left unchanged | Last non-phase-6 consumer (`work-unit-for`) rewired off it; helper kept for phase 6. |
| `scripts/executor-model-vectors.mjs` | (script) | **retired** (deleted) | Same owning proof as helper above. |
| `test/runner/dispatch/executor-model-vectors.test.mjs` | 3 | **retired** (deleted) | Same owning proof: `every_executor_model_vector_has_the_answer_the_contract_records`. |
| `test/workflow/case-admission-port.test.mjs` | 16 | **rewired** | `cwd-lock` → live `src/holder-lock` (`dispatch-cwd`); `seatLaunchesOf` → literal `4` (panel of four declared seats). Custody behaviour owned by `packages/run-supervisor/rust/tests/controller_cwd_lock.rs` (`a_custody_successor_takes_a_free_lease_and_a_held_one_is_in_flight`). Seat launch count owned by `packages/execution/rust/tests/core_loops.rs` (`seat_rules_replay`). |
| `test/workflow/case-bindings.test.mjs` | 9 | **rewired** | `cwd-lock` → live `src/holder-lock` (`dispatch-cwd`). |
| `test/workflow/case-close.test.mjs` | 15 | **rewired** | `unit-control` → small live unit-control generation fixture via `selfRecord` (Rust ledger under `unit-control/control/generations`). Controller-held owned by `packages/execution/rust` `unit_controller_held` / run-facts keep `controller-held`. |
| `test/workflow/case-runtime.test.mjs` | 20 | **rewired** | `cwd-lock` → live `src/holder-lock` (`dispatch-cwd`). |
| `test/workflow/case-verbs.test.mjs` | 21 | **rewired** | `cwd-lock` → live `src/holder-lock` (`dispatch-cwd`). |
| `test/workflow/conductor-case.test.mjs` | 8 | **rewired** | `cwd-lock` → live `src/holder-lock` (`dispatch-cwd`). |
| `test/workflow/core-workflow-seats.test.mjs` | 9 | **rewired** | `shippedCatalog`/`loopOf` → `src/native/execution-door.mjs`; `resolveSeats` → declared `unit.seats` fixture. Seat rules owned by `seat_rules_replay`. |
| `test/workflow/propose-frame.test.mjs` | 21+ | **rewired** | `shippedCatalog` → `src/native/execution-door.mjs` (workflow code's live door). |
| `test/workflow/propose-validate.test.mjs` | 25 | **rewired** | `shippedCatalog` → `src/native/execution-door.mjs`. |
| `test/workflow/propose.test.mjs` | 21 | **rewired** | `shippedCatalog` → `src/native/execution-door.mjs`. |
| `test/workflow/seats.test.mjs` | 13 | **rewired** | `shippedCatalog` → `src/native/execution-door.mjs` (with existing `loopOf`). |
| `test/runner/operation-choice.test.mjs` | 148 | **rewired** | Off `declared-assignment`: confidence-gate cases use live `stampDeclaredAssignment` from `src/native/execution-door.mjs`; expectedOutputs case uses small literal fixture (`result-1.json`). Assertions unchanged. |
| `test/runner/work-unit-for.test.mjs` | 26 | **rewired** | Off `work-seat-config`: configs passed through as literals (already named executors/capabilities). |

## Outside write-list references to deleted executor-model vector paths

Reported, not edited (outside this phase write scope):

| path | note |
|---|---|
| `scripts/agents-vectors.mjs` | imports `adoptTestEnvironment`/`serialize` from deleted `scripts/executor-model-vectors.mjs` |
| `test/suite-baseline.json` | entry for deleted `test/runner/dispatch/executor-model-vectors.test.mjs` |
| `packages/git/contracts/mutation-census.v1.json` | hash row for `scripts/executor-model-vectors.mjs` |
| `packages/execution/contracts/bind.v1.json` | about-text names the deleted recorder |
| `docs/platform/runner/contracts/executor-model.md` | docs name the deleted Node twin/recorder |
| `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md` | same |
| `docs/reading-map.md` | same |

## Dead-import check

```text
git grep -nE 'src/run-supervisor/(cwd-lock)|src/runner/dispatch/(shipped-catalog|execution-contract|config-twin|provider-adapter|resolve|executor-governance|provider-capacity|llm-accounts)|src/runner/execution/(seat-resolver|unit-control)' -- test/workflow test/helpers/packaged-definitions.mjs test/runner/operation-choice.test.mjs test/runner/work-unit-for.test.mjs
```

→ empty (exit 1).

## Rust name check

Every Rust test name cited above verified with `rg 'fn <name>'`:

- `every_executor_model_vector_has_the_answer_the_contract_records` — `packages/execution/rust/tests/golden_executor_model.rs`
- `seat_rules_replay` — `packages/execution/rust/tests/core_loops.rs`
- `the_contract_constants_are_the_ones_node_exports` — `packages/execution/engine/tests/contract.rs`
- `a_custody_successor_takes_a_free_lease_and_a_held_one_is_in_flight` — `packages/run-supervisor/rust/tests/controller_cwd_lock.rs`

## Verification (`node --test`, one file at a time)

| file | pass | fail | notes |
|---|---:|---:|---|
| `test/workflow/propose-frame.test.mjs` | 28 | 0 | |
| `test/workflow/seats.test.mjs` | 13 | 0 | |
| `test/workflow/core-workflow-seats.test.mjs` | 9 | 0 | |
| `test/workflow/propose.test.mjs` | 21 | 0 | |
| `test/workflow/propose-validate.test.mjs` | 25 | 0 | |
| `test/workflow/case-bindings.test.mjs` | 9 | 0 | |
| `test/workflow/case-close.test.mjs` | 15 | 0 | |
| `test/workflow/case-runtime.test.mjs` | 20 | 0 | |
| `test/workflow/case-admission-port.test.mjs` | 13 | 3 | writing admits hit `git-floor-probe-failed: Read-only file system` under this unit's confined mount (env friction; rewire not on the stack) |
| `test/workflow/case-verbs.test.mjs` | 20 | 1 | one case expects parked workflow; nested confinement / bwrap |
| `test/workflow/conductor-case.test.mjs` | 5 | 3 | nested bwrap “no permissions to create a new namespace” |
| `test/runner/work-unit-for.test.mjs` | 26 | 0 | |
| `test/setup/packaged-definitions.test.mjs` | 6 | 0 | |
| `test/setup/registrations.test.mjs` | 52 | 0 | |
| `test/runner/operation-choice.test.mjs` | 87 | 61 | rewired stamp/literal cases pass; failing cases are live driver/confinement runs under nested bwrap RO |

Rewired pure paths (catalog, seats, helpers, stampDeclaredAssignment, unit-control fixture, holder-lock custody) are green. Remaining fails are the assignment runner's confined worker environment (`FGOS_CONFINED=1`, nested bwrap, RO checkout floor probe), not dead-module imports.

## Commit subject

`test(workflow): read live modules instead of the dead execution modules and retire the executor-model vector recorder`

## Recorder retirement follow-up

After the phase-7 deletion of the Node executor-model vector recorder/helper/twin, remaining references were cleaned:

- `scripts/agents-vectors.mjs` — inlined `adoptTestEnvironment`, `serialize`, and the tiny `line` helper (no import of the deleted script); header no longer names it.
- `test/suite-baseline.json` — removed `test/runner/dispatch/executor-model-vectors.test.mjs`.
- `packages/git/contracts/mutation-census.v1.json` — removed `scripts/executor-model-vectors.mjs` row, updated `scripts/agents-vectors.mjs` hash and `payloadDigest`. Full `node scripts/git-one-door-scan.mjs --write-census` refused here (`git-floor-probe-failed: Read-only file system`); hand-patched those rows + digest; `test/setup/git-mutation-census.test.mjs` passes.
- `packages/execution/contracts/bind.v1.json` `about` — points at the fixed corpus / Rust golden bind replay, not the Node recorder.
- `docs/platform/runner/contracts/executor-model.md` (Implementation + §10 Proof), `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md`, `docs/reading-map.md` — owning proof is `packages/execution/rust/tests/golden_executor_model.rs` (`every_executor_model_vector_has_the_answer_the_contract_records`); vectors are fixed corpus.

