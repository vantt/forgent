# Phase 2f: Close the Node doctor body map (door row `doctor-readiness-registry`)

## Waits
The Rust migration steps S6b (Workflow) and S7 (Work) of `261114-2051-rust-verb-migration-program`, which move the last Node-owned doctor rows and fixes (`bridge:S6b`, `bridge:S7`) to Rust and remove their bodies from the Node map, each step its own (the row's `retiredBy`). Neither step has a detailed plan yet. Moving those bodies is their work, not this phase's: the unit report (reports/unit-261123-0819-p02-result.md) found seven outside importers that only go with the bodies. The phase stays `draft` until both steps land.

This phase does not block phase 10 or 11 (owner decision D6, option a). Doors closes with this row as named debt: phase 10 keeps its `debt` and gives it `retiredBy` naming the Workflow/Work port (S6b/S7). If both steps have not landed when phase 10 starts, this phase is not run in this plan. The port removes the debt in the change that deletes the last body, and phase 11 records the hand-off.

## Inputs
- Row `packages/component-authority/model/doors/doctor-readiness-registry.yaml`. Survivors: `packages/distribution/rust/src/doctor.rs`, `apps/fgos/src/wiring/doctor/**`. Debt: `src/setup/registrations.mjs`, `src/setup/checks.mjs`.

## Files it may write
packages/component-authority/model/doors/doctor-readiness-registry.yaml

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Execution
Every writing unit runs with `--provider claude` (owner order, D6 step 0). If claude is unavailable the unit parks and reports. It never falls back to another provider.

## Steps
1. Confirm both debt files are gone and no `bridge:` row is left in `packages/distribution/contracts/doctor-registry.v1.json`.
2. Remove the debt entries. If a file is still there, stop and report which step still owns it.

## Verify
`node --test test/architecture.test.mjs` green, no `debt` in the row.

## Rollback
Revert the phase commit.
