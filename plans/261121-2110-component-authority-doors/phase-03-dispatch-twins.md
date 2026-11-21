# Phase 3: Retire the dispatch twins and the global-directory copies

## Inputs
- The door rows to retire, by slug, in `packages/component-authority/model/doors/`: `footprint-write-scope-overlap-rule` (src/runner/dispatch/write-scope.mjs), `tool-lookup-by-capability` (src/runner/dispatch/tool-providers.mjs, the twin that 5a7045242 created), `derive-executor-facts` (12 files under src/runner/dispatch/, src/runner/execution/, src/runner/capability-config.mjs, src/runner/agent-listing.mjs), `decide-a-dispatch` (src/runner/dispatch/plan.mjs), `global-fgos-directory` (src/runner/dispatch/llm-accounts.mjs, src/runner/dispatch/confinement/probes/harness.mjs, packages/holder-lock/rust/src/state_root.rs; its apps/fgos-gateway/src/gateway.rs entry goes to phase 9). Re-read each row first; a running plan may already have retired some debt. A row with no `debt` left needs no work.
- For each debt file: its callers (`rg` on its exported names and import path; GitNexus `impact` upstream when the impact-analysis gate is `full`), and the row's `allowed` door (the survivor).
- Discussion §3 row 3d and CA-D2: no twin, move every caller, delete the copy in the same change, and put the deleted path and its last SHA in the commit message and in the owning area spec's decision history.
- Survivors: `packages/write-scope` (matchesWriteScope), the Rust `bind` and decider (`fgos dispatch decide`), and the Rust global-directory resolver named in the row's `allowed`. If s6a (execution tier to Rust) has landed, most of these are already gone.

## Files it may write
src/runner/dispatch/, src/runner/execution/, src/runner/capability-config.mjs, src/runner/agent-listing.mjs, packages/holder-lock/rust/src/state_root.rs, test/runner/dispatch/, test/runner/dispatch-*, test/runner/capability-config.test.mjs, test/runner/agent-listing.test.mjs, and the five door files named in plan.md row 3

## Steps
1. For each row and each debt file, find the behaviour the copy gives its callers. Find the test that owns that behaviour; if none does, record vectors from the copy and add a replay test on the survivor, in the survivor's own test file (design principle 8).
2. Move every caller to the survivor door. If a caller is outside this phase's footprint, stop and report it (Status BLOCKED, naming the file); do not widen the footprint.
3. Delete the copy, or the copied lines when the file stays for other reasons. Remove the debt entry from the door row. Write the commit message with the survivor, the deleted path and its last SHA.
4. Add one line to the owning area spec's "Lịch sử quyết định" with the two SHAs, only if that spec is inside this phase's footprint; otherwise list the line in the phase report for phase 11 to place.


## Verify
`node --test test/architecture.test.mjs` is green, with no `debt` left in the phase's rows. The owning tests of every moved caller are green (named in the phase report), and so is `cargo test -p <crate>` for each Rust crate touched.

## Rollback
Revert the phase commit. That restores each copy and its debt entry together.
