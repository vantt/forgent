# Phase 3a: Retire the JS write-scope port (door row `footprint-write-scope-overlap-rule`)

## Waits
Phase 8 of `261122-2108-delete-dead-node-execution-closure`, which deletes the dead dispatch modules that import `src/runner/dispatch/write-scope.mjs` (`config-twin.mjs`, `evidence-attribution.mjs`, `settlement.mjs`, `src/runner/execution/unit.mjs` where its closure report marks them dead). Editing them here would collide with that plan. The phase stays `draft` until that phase lands.

## Inputs
- Row `packages/component-authority/model/doors/footprint-write-scope-overlap-rule.json`. Survivor: `packages/write-scope/src/lib.rs`, reached from Node through the addon's `writeScope` namespace (`packages/git/node-addon/src/git/write_scope.rs`: `canonicalize`, `canonicalizeAll`, `matches`, `globsMeet`, `overlaps`, `collidingPairs`), as `src/state/store.mjs` already does. Debt: `src/runner/dispatch/write-scope.mjs`.
- Live callers: `src/session-host/head-request.mjs:26` (`canonicalizeWriteEntry`, `matchesWriteScope`), `src/workflow/definition.mjs:8` (`canonicalizeWrites`). Tests: `test/runner/write-scope.test.mjs`, `test/git/write-scope-parity.test.mjs` (pins the JS port to the Rust rule; goes with the port), `test/state/domain-registry-compiled.test.mjs` (lists the path). Any dispatch importer the closure plan left alive is listed in its `reports/closure.md`.

## Files it may write
src/runner/dispatch/write-scope.mjs, src/runner/dispatch/config-twin.mjs, src/runner/dispatch/evidence-attribution.mjs, src/runner/dispatch/settlement.mjs, src/runner/execution/unit.mjs, src/session-host/head-request.mjs, src/workflow/definition.mjs, test/runner/write-scope.test.mjs, test/git/write-scope-parity.test.mjs, test/state/domain-registry-compiled.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/footprint-write-scope-overlap-rule.json

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Move every remaining caller onto the addon's `writeScope` operations; the existing ones cover every function the callers use, so no binding changes.
2. Check that `packages/write-scope`'s tests own every case of `test/runner/write-scope.test.mjs`; move the rest there. Delete the port, its test and the parity test.
3. Remove the debt entry, regenerate the census, update `test/suite-baseline.json`.

## Verify
`node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs` green, no `debt` in the row; the owning tests of `head-request.mjs` and `definition.mjs` green (named in the report); `cargo test -p fgos-write-scope` green.

## Rollback
Revert the phase commit.
