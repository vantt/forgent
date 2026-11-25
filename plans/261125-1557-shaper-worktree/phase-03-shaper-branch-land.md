# Phase 3: A shaper lands its own discussion branch

Capability: `code:implement`.

## Inputs

- `src/session-host/head-request.mjs` `landVerb` (branch land is lead-only; `planOfCaller` supplies the footprint).
- `src/session-host/head-plan.mjs` `discussionOfHead`, `taskOfHead`.
- `test/session-host/head-request.test.mjs` (existing land cases).

## Footprint

- `src/session-host/head-plan.mjs`
- `src/session-host/head-request.mjs`
- `test/session-host/head-request.test.mjs`

## Steps

1. In `head-plan.mjs`, export the one naming rule of a discussion's checkout: `discussionBranchOf(dir)` ->
   `discussion/<dir>` and `discussionWorktreeOf(projectRoot, dir)` -> `<parent>/<project dir name>-worktrees/<dir>`.
   Phase 4 imports both; nothing else builds these names.
2. In `landVerb`, accept `branch` from a `shaper`: resolve its discussion with `discussionOfHead` from the envelope's
   head name; the branch must equal `discussionBranchOf(dir)`, else refuse `land-branch-not-own`; pass
   `--footprint plans/discussions/<dir>`. Every other non-lead persona keeps `land-branch-lead-only`.
3. Tests in `head-request.test.mjs`: a shaper lands its own branch with its discussion footprint; another branch is
   refused `land-branch-not-own`; a planner branch land is still `land-branch-lead-only`.

## Verify

`node --test test/session-host/head-request.test.mjs` passes.

## Rollback

Revert the phase's squash commit; shapers go back to `--paths` lands only.
