# Phase 7: Retire the Rust argument-parser, run-dirs and packaging copies

## Inputs
- The door rows to retire, by slug, in `packages/component-authority/model/doors/`: `parse-cli-arguments` (packages/holder-lock/rust/src/route.rs, packages/run-supervisor/rust/src/route.rs, adopt.rs, supervise.rs, packages/terminal-control/rust/src/route.rs, packages/session-host/rust/src/route.rs, apps/fgctl/src/help.rs, scripts/write-test-marker.mjs), `list-run-directories` (apps/fgos/src/wiring/run_dirs.rs, packages/run-result/rust/src/lib.rs), `no-node-from-native-packaging` (packages/distribution/rust/src/init.rs). Re-read each row first; a running plan may already have retired some debt. A row with no `debt` left needs no work.
- For each debt file: its callers (`rg` on its exported names and import path; GitNexus `impact` upstream when the impact-analysis gate is `full`), and the row's `allowed` door (the survivor).
- Discussion §3 row 3d and CA-D2: no twin, move every caller, delete the copy in the same change, and put the deleted path and its last SHA in the commit message and in the owning area spec's decision history.
- Survivors are the crates named in each row's `allowed`. A new crate dependency edge changes `Cargo.lock`; this phase is the wave's only writer of it.

## Files it may write
the files named in plan.md row 7

## Steps
1. For each row and each debt file, find the behaviour the copy gives its callers. Find the test that owns that behaviour; if none does, record vectors from the copy and add a replay test on the survivor, in the survivor's own test file (design principle 8).
2. Move every caller to the survivor door. If a caller is outside this phase's footprint, stop and report it (Status BLOCKED, naming the file); do not widen the footprint.
3. Delete the copy, or the copied lines when the file stays for other reasons. Remove the debt entry from the door row. Write the commit message with the survivor, the deleted path and its last SHA.
4. Add one line to the owning area spec's "Lịch sử quyết định" with the two SHAs, only if that spec is inside this phase's footprint; otherwise list the line in the phase report for phase 11 to place.


## Verify
`node --test test/architecture.test.mjs` is green, with no `debt` left in the phase's rows. The owning tests of every moved caller are green (named in the phase report), and so is `cargo test -p <crate>` for each Rust crate touched.

## Rollback
Revert the phase commit. That restores each copy and its debt entry together.
