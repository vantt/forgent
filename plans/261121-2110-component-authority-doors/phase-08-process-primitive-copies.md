# Phase 8: Retire process-control, /proc, kernel-lock and bounded-child copies in the process tier

## Inputs
- The door rows to retire, by slug, in `packages/component-authority/model/doors/`: `process-control-signal` (packages/git/rust/src/driver.rs, scripts/lib/mailbox-live-confined.mjs), `process-facts-proc` (packages/holder-lock/rust/src/borrow_vectors.rs, scripts/lib/mailbox-live-confined.mjs), `kernel-lock-primitive` (packages/git/node-addon/src/single_load.rs), and the part of `run-bounded-child` in packages/git/rust/src/driver.rs, packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs, packages/process/rust/src/containment/linux.rs, mapped.rs, platform/windows_spawn.rs, and packages/run-supervisor/rust/src/{attempt_step,controller/launch,gate/windows,steps,supervise,supervise/windows}.rs. Re-read each row first; a running plan may already have retired some debt. A row with no `debt` left needs no work.
- For each debt file: its callers (`rg` on its exported names and import path; GitNexus `impact` upstream when the impact-analysis gate is `full`), and the row's `allowed` door (the survivor).
- Discussion §3 row 3d and CA-D2: no twin, move every caller, delete the copy in the same change, and put the deleted path and its last SHA in the commit message and in the owning area spec's decision history.
- The survivor is `packages/process` (the process door), and `holder-lock` for the kernel lock. Copies inside `packages/process` itself are folded into its one entry point. Stop at two days; list what is left in the report for a new phase.

## Files it may write
the files named in plan.md row 8

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
