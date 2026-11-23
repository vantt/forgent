# Phase 3a2: Delete the JS write-scope port (door row `footprint-write-scope-overlap-rule`)

## Waits
Phase 3a, and phase 8 of `261122-2108-delete-dead-node-execution-closure`. That phase deletes the four dead modules that are the port's last importers (`dispatch/config-twin.mjs`, `evidence-attribution.mjs`, `settlement.mjs`, `execution/unit.mjs`), together with their dead importers and tests. The phase stays `draft` until that phase lands.

## Inputs
- Row `packages/component-authority/model/doors/footprint-write-scope-overlap-rule.yaml`. Survivor: `packages/write-scope/src/lib.rs` through the addon's `writeScope` namespace. Debt: `src/runner/dispatch/write-scope.mjs`.
- Tests: `test/runner/write-scope.test.mjs`, `test/git/write-scope-parity.test.mjs` (pins the JS port to the Rust rule, so it goes with the port), `test/state/domain-registry-compiled.test.mjs` (lists the path).
- The closure plan's `reports/closure.md`, for any importer it left alive.

## Files it may write
src/runner/dispatch/write-scope.mjs, test/runner/write-scope.test.mjs, test/git/write-scope-parity.test.mjs, test/state/domain-registry-compiled.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/footprint-write-scope-overlap-rule.yaml

## Execution
Every writing unit runs with `--provider claude`. If claude is unavailable the unit parks and reports. It never falls back to another provider.

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Confirm `rg -l "write-scope\.mjs" src bin scripts` lists only the port itself. If a dead module is still there, stop and report: `261122-2108` owns it.
2. Check that `packages/write-scope`'s tests own every case of `test/runner/write-scope.test.mjs`, and move the rest there. Delete the port, its test and the parity test, and drop the path from `test/state/domain-registry-compiled.test.mjs`.
3. Remove the debt entry, regenerate the census, and update `test/suite-baseline.json`.

## Verify
`node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/state/domain-registry-compiled.test.mjs` is green, the row has no `debt`, and `cargo test -p fgos-write-scope` is green.

## Rollback
Revert the phase commit.
