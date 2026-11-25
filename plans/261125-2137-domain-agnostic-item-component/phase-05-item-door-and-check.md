# Phase 5: Item write door and check

Status: draft. Decisions: A4, A5, A8.

## Inputs
- Discussion §6 "Who records what" and "Initiative fields".
- The crate from phase 4; `create_item`/`edit_item` moved there.
- `resolveWorkflow` and `domains/<domain>/registry.yaml` (`workflowFor`, `defaultWorkflow`); the project override key in `core/config-standard`.
- `fgos identity mint backlog`.

## Footprint
- `packages/portfolio/rust/**`, `apps/fgos/**`
- `packages/host-runtime/contracts/command-manifest.json`

## Steps
1. Add the door in the crate: `record(fact)` for the three fact kinds (coordination, progress, life) with the caller identity resolved through the Rust host; each kind accepts only its own facts.
2. Run the A8 checks on every fact: domain known; kind in the domain's list; pinned workflow belongs to the domain; `dependsOn` ids exist and stay acyclic; `mergedInto` exists; `priority` in its enum; stage never written by hand.
3. Derive the stage from the pinned workflow's stage list and the recorded facts, including the skippable Clarify.
4. On leaving Init, pin the workflow with its definition digest and move the file from `plans/backlog/` to `plans/initiatives/` in one durable write; do the same on drop or merge before start.
5. Mint `p-` ids for initiatives the door creates; never rename an existing id.
6. Expose `fgos portfolio record <fact>` and `fgos portfolio check` (the same checks, read-only, exit non-zero with reasons) in the CLI and the command manifest.
7. Write one door unit test per check and per derived stage.

## Verify
`cargo test -p fgos-portfolio door` passes; `fgos portfolio check` on a fixture with each broken rule reports that rule by name.

## Rollback
`git revert` the phase commit.
