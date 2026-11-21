# Phase 2: Retire the setup and CLI twins

## Inputs
- The door rows to retire, by slug, in `packages/component-authority/model/doors/`: `agent-hook-table` (src/setup/agent-hooks.mjs, scripts/lib/mailbox-live-confined.mjs), `delete-guard-keyword-list` (src/setup/agent-hooks.mjs), `person-agent-config-writes` (src/cli/command-registry.mjs), `shell-rc-fgos-lines` (src/setup/shell-rc.mjs), `execution-doctor-judgments` (src/setup/agy-permissions.mjs), `doctor-readiness-registry` (src/setup/registrations.mjs, src/setup/checks.mjs), `installation-shim-location` (packages/herdr-fgos-common/rust/src/fgos.rs). Re-read each row first; a running plan may already have retired some debt. A row with no `debt` left needs no work.
- For each debt file: its callers (`rg` on its exported names and import path; GitNexus `impact` upstream when the impact-analysis gate is `full`), and the row's `allowed` door (the survivor).
- Discussion §3 row 3d and CA-D2: no twin, move every caller, delete the copy in the same change, and put the deleted path and its last SHA in the commit message and in the owning area spec's decision history.
- The survivors are mostly Rust doors in `packages/distribution/rust/src/` (agent hooks, wire-agents, doctor registry `packages/distribution/contracts/doctor-registry.v1.json`); read each row's `allowed`.

## Files it may write
src/setup/agent-hooks.mjs, src/setup/shell-rc.mjs, src/setup/agy-permissions.mjs, src/setup/registrations.mjs, src/setup/checks.mjs, src/cli/command-registry.mjs, scripts/lib/mailbox-live-confined.mjs, packages/herdr-fgos-common/rust/src/fgos.rs, test/setup/, and the seven door files named in plan.md row 2

## Steps
1. For each row and each debt file, find the behaviour the copy gives its callers. Find the test that owns that behaviour; if none does, record vectors from the copy and add a replay test on the survivor, in the survivor's own test file (design principle 8).
2. Move every caller to the survivor door. If a caller is outside this phase's footprint, stop and report it (Status BLOCKED, naming the file); do not widen the footprint.
3. Delete the copy, or the copied lines when the file stays for other reasons. Remove the debt entry from the door row. Write the commit message with the survivor, the deleted path and its last SHA.
4. Add one line to the owning area spec's "Lịch sử quyết định" with the two SHAs, only if that spec is inside this phase's footprint; otherwise list the line in the phase report for phase 11 to place.


## Verify
`node --test test/architecture.test.mjs` is green, with no `debt` left in the phase's rows. The owning tests of every moved caller are green (named in the phase report), and so is `cargo test -p <crate>` for each Rust crate touched.

## Rollback
Revert the phase commit. That restores each copy and its debt entry together.
