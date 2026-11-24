# Phase 12c: Close the Node-twin debt once the dead Node Execution closure is deleted

## Why now, and what it waits for
This phase folds phases 3a2, 3b, 3c, 3d and the Node part of 3e (all withdrawn into it). They were held by one wait:
phase 8 of `261122-2108-delete-dead-node-execution-closure` deletes `src/runner/dispatch/**` and
`src/runner/execution/**`, and its footprint closes the model rows it empties. Deleting those files here as well would
make a second deleter for the same files. So this phase starts only when that phase is `done` on main. It then closes
what that phase does not reach. Owner answer B to q-aanvfxaopa (2026-11-24): all debt is handled right after the
release. Phase 12 overview: `plan.md`, note "Phase 12 cut".

## Inputs
- Door rows `decide-a-dispatch.yaml`, `derive-executor-facts.yaml`, `tool-lookup-by-capability.yaml`,
  `list-run-directories.yaml`, `footprint-write-scope-overlap-rule.yaml` and `global-fgos-directory.yaml` under
  `packages/component-authority/model/doors/`.
- The withdrawn phase files, kept for their detail: `phase-03a2-delete-write-scope-port.md`,
  `phase-03b-tool-lookup-by-capability.md`, `phase-03c-derive-executor-facts.md`,
  `phase-03d-decide-a-dispatch.md` and `phase-03e-global-fgos-directory.md`.
- `plans/261122-2108-delete-dead-node-execution-closure/phase-08-delete-source.md`, and its landing commit.

## Files it may write
src/runner/dispatch/write-scope.mjs, test/runner/write-scope.test.mjs, test/git/write-scope-parity.test.mjs,
test/state/domain-registry-compiled.test.mjs, packages/write-scope/, src/runner/capability-config.mjs,
test/runner/capability-config.test.mjs, src/runner/agent-listing.mjs, test/runner/agent-listing.test.mjs,
scripts/agents-vectors.mjs, test/helpers/agents-vectors.helper.mjs, test/helpers/executor-model-vectors.helper.mjs,
test/setup/packaged-definitions.test.mjs, test/rust-host/fixtures/run-dirs-vectors.json, test/suite-baseline.json,
packages/git/contracts/mutation-census.v1.json,
packages/component-authority/model/doors/decide-a-dispatch.yaml,
packages/component-authority/model/doors/derive-executor-facts.yaml,
packages/component-authority/model/doors/tool-lookup-by-capability.yaml,
packages/component-authority/model/doors/list-run-directories.yaml,
packages/component-authority/model/doors/footprint-write-scope-overlap-rule.yaml,
packages/component-authority/model/doors/global-fgos-directory.yaml, test/architecture.test.mjs,
docs/platform/write-scope/spec.md, docs/platform/runner/spec.md

## Execution
`--provider claude` (owner order, D6 step 0). Run one unit per step.

## Steps
1. List what `261122-2108` phase 8 left. For each row above, record which `debt` entries point at files that no
   longer exist, and remove them. A row that 2108 already closed needs nothing more.
2. **Write-scope port** (from 3a2). If `src/runner/dispatch/write-scope.mjs` survived 2108, run 3a2's steps 1-3:
   confirm `rg -l "write-scope\.mjs" src bin scripts` lists only the port, move any case that
   `packages/write-scope`'s tests lack into them, then delete the port, its test and the parity test. Clear the
   `footprint-write-scope-overlap-rule` debt.
3. **Executor facts** (from 3c). Remove `capabilityConfinementOf` from `src/runner/capability-config.mjs` once no
   product caller is left; the executor-model vectors already replay it on `executor_model.rs`. Move the release-tier
   judgement in `test/setup/packaged-definitions.test.mjs` and the vector recorder onto the Rust
   `agent-type-names-unique` judgement. Then delete `agent-listing.mjs`, its test, the recorder and its helper.
4. **Run directories** (Node listers only). Prune the Node-only `openAttempts` rows of
   `test/rust-host/fixtures/run-dirs-vectors.json` (p-24xw2cwdvo). Two Rust walks stay as named debt:
   `packages/run-result/rust/src/lib.rs` and `packages/run-supervisor/rust/src/controller/adopt_scan.rs`. Their
   survivor (the engine's assignment layout) needs a crate move first, so set their `retiredBy` to a backlog row
   minted with `fgos identity mint backlog` and written by the secretary. Do not write the backlog yourself; name the
   row in the report.
5. For every row left with no debt, remove it from `NAMED_DOOR_DEBT`. Regenerate the census and update
   `test/suite-baseline.json`. Write one decision-history line per area spec (`write-scope`, `runner`) naming each
   deleted path and its last SHA (CA-D2).

## Verify
- `node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/runner/capability-config.test.mjs test/setup/packaged-definitions.test.mjs`
  passes except A4, which is red on main too.
- `cargo test -p fgos-execution -p fgos-write-scope` is green. Take the exact package names from each `Cargo.toml`.
- `NAMED_DOOR_DEBT` holds none of `decide a dispatch`, `derive executor facts`, `tool lookup by capability` or
  `the footprint and write-scope overlap rule`.

## Rollback
Revert the step's commit. The deleted twin and its debt entry come back together.
