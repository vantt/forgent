# Phase 9: Retire the remaining bounded-child copies

## Inputs
- The door rows to retire, by slug, in `packages/component-authority/model/doors/`: the rest of `run-bounded-child`: apps/fgos-gateway/src/gateway.rs, apps/fgos/src/wiring/run.rs, packages/config/rust/src/detect.rs, packages/distribution/rust/src/init.rs, packages/holder-lock/rust/src/borrow_windows.rs, packages/mailbox/rust/store/src/adapters/version.rs, packages/mailbox/rust/store/src/nudge.rs, packages/terminal-control/rust/src/driver/herdr.rs; plus the apps/fgos-gateway/src/gateway.rs entry of `global-fgos-directory`. Re-read each row first; a running plan may already have retired some debt. A row with no `debt` left needs no work.
- For each debt file: its callers (`rg` on its exported names and import path; GitNexus `impact` upstream when the impact-analysis gate is `full`), and the row's `allowed` door (the survivor).
- Discussion §3 row 3d and CA-D2: no twin, move every caller, delete the copy in the same change, and put the deleted path and its last SHA in the commit message and in the owning area spec's decision history.
- The survivor is the `packages/process` entry point that phase 8 settled. Read phase 8's report first.

## Files it may write
the files named in plan.md row 9, and packages/component-authority/model/doors/global-fgos-directory.yaml only for the gateway entry

## Execution
Every writing unit runs with `--provider claude` (owner order, D6 step 0). If claude is unavailable the unit parks and reports. It never falls back to another provider.

## Steps
1. For each row and each debt file, find the behaviour the copy gives its callers. Find the test that owns that behaviour; if none does, record vectors from the copy and add a replay test on the survivor, in the survivor's own test file (design principle 8).
2. Move every caller to the survivor door. If a caller is outside this phase's footprint, stop and report it (Status BLOCKED, naming the file); do not widen the footprint.
3. Delete the copy, or the copied lines when the file stays for other reasons. Remove the debt entry from the door row. Write the commit message with the survivor, the deleted path and its last SHA.
4. Add one line to the owning area spec's "Lịch sử quyết định" with the two SHAs, only if that spec is inside this phase's footprint; otherwise list the line in the phase report for phase 11 to place.


## Verify
`node --test test/architecture.test.mjs` is green, with no `debt` left in the phase's rows. The owning tests of every moved caller are green (named in the phase report), and so is `cargo test -p <crate>` for each Rust crate touched.

## Rollback
Revert the phase commit. That restores each copy and its debt entry together.
