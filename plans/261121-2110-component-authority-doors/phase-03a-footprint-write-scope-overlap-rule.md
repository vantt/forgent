# Phase 3a: Move the live write-scope callers onto the Rust rule (door row `footprint-write-scope-overlap-rule`)

## Waits
None beyond phase 1b. This phase does not touch the dead dispatch modules or the JS port itself.

## Inputs
- Row `packages/component-authority/model/doors/footprint-write-scope-overlap-rule.yaml`. Survivor: `packages/write-scope/src/lib.rs`, reached from Node through the addon's `writeScope` namespace (`packages/git/node-addon/src/git/write_scope.rs`: `canonicalize`, `canonicalizeAll`, `matches`, `globsMeet`, `overlaps`, `collidingPairs`), as `src/state/store.mjs` already does. Debt: `src/runner/dispatch/write-scope.mjs`.
- Live callers: `src/session-host/head-request.mjs:26` (`canonicalizeWriteEntry`, `matchesWriteScope`), `src/workflow/definition.mjs:8` (`canonicalizeWrites`).
- Why the four dead files are not touched here (owner decision D6, plan.md "Re-cut per owner decision D6"): `dispatch/config-twin.mjs`, `evidence-attribution.mjs`, `settlement.mjs` and `execution/unit.mjs` have no live product importer, but other dead closure modules and 35 tests import them. `261122-2108-delete-dead-node-execution-closure` phase 8 deletes them with the rest of the closure. Nobody rewires them.

## Files it may write
src/session-host/head-request.mjs, src/workflow/definition.mjs

## Execution
Every writing unit runs with `--provider claude`. If claude is unavailable the unit parks and reports. It never falls back to another provider.

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Re-read both callers at the current tree. Move each call onto the addon's `writeScope` operations. The existing operations cover every function the callers use, so no binding changes.
2. Name each caller's owning test (`rg -l 'head-request|definition.mjs' test/`) and run it. If an owning test pins the JS port itself rather than the behaviour, stop and report. Do not edit tests outside this footprint.
3. Leave `src/runner/dispatch/write-scope.mjs`, its tests and the door row's `debt` as they are. Phase 3a2 removes them.

## Verify
`rg -n "dispatch/write-scope" src/session-host src/workflow` prints nothing. The owning tests of `head-request.mjs` and `definition.mjs` are green and named in the report. `node --test test/architecture.test.mjs` is green.

## Rollback
Revert the phase commit. The two callers go back to the JS port, which still exists.
