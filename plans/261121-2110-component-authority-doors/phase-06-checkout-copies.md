# Phase 6: Retire the checkout copies

## Inputs
- The door rows to retire, by slug, in `packages/component-authority/model/doors/`: `checkout-make-provision-remove` (src/cli/command-registry.mjs, src/runner/repo-locks.mjs, src/workflow/unit-handoff.mjs, src/runner/merge.mjs, scripts/lib/git-ports.mjs). Re-read each row first; a running plan may already have retired some debt. A row with no `debt` left needs no work.
- For each debt file: its callers (`rg` on its exported names and import path; GitNexus `impact` upstream when the impact-analysis gate is `full`), and the row's `allowed` door (the survivor).
- Discussion §3 row 3d and CA-D2: no twin, move every caller, delete the copy in the same change, and put the deleted path and its last SHA in the commit message and in the owning area spec's decision history.
- Discussion §3 row 3e(1): two native worktree doors live side by side (the `GitWorktree` port and the `fgos-checkout` crate, both used in src/runner/merge.mjs). This row's `allowed` names the survivor. If the row does not settle which of the two survives, stop and report (Status NEEDS_CONTEXT) with both call-site counts. That choice moves a decision kind, so it needs a plan that names the survivor.

## Files it may write
src/cli/command-registry.mjs, src/runner/repo-locks.mjs, src/workflow/unit-handoff.mjs, src/runner/merge.mjs, scripts/lib/git-ports.mjs, test/runner/repo-locks*, test/workflow/unit-handoff*, test/runner/merge*, packages/component-authority/model/doors/checkout-make-provision-remove.json

## Steps
1. For each row and each debt file, find the behaviour the copy gives its callers. Find the test that owns that behaviour; if none does, record vectors from the copy and add a replay test on the survivor, in the survivor's own test file (design principle 8).
2. Move every caller to the survivor door. If a caller is outside this phase's footprint, stop and report it (Status BLOCKED, naming the file); do not widen the footprint.
3. Delete the copy, or the copied lines when the file stays for other reasons. Remove the debt entry from the door row. Write the commit message with the survivor, the deleted path and its last SHA.
4. Add one line to the owning area spec's "Lịch sử quyết định" with the two SHAs, only if that spec is inside this phase's footprint; otherwise list the line in the phase report for phase 11 to place.


## Verify
`node --test test/architecture.test.mjs` is green, with no `debt` left in the phase's rows. The owning tests of every moved caller are green (named in the phase report), and so is `cargo test -p <crate>` for each Rust crate touched.

## Rollback
Revert the phase commit. That restores each copy and its debt entry together.
