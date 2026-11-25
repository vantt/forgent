# Phase 4: The shaper start creates its worktree

Capability: `code:implement`.

## Inputs

- `src/session-host/head-start.mjs` `placeHead` (task resolution, the launch request) and `startHeadSession`.
- `src/session-host/head-plan.mjs` `discussionBranchOf`, `discussionWorktreeOf` (phase 3).
- `src/session-host/head-request.mjs` `worktreeCreate` (how the host verb `fgos worktree create` is called and its path rule); read only.
- The `workdir` launch field (phase 1).

## Footprint

- `src/session-host/head-start.mjs`
- `test/session-host/head-start.test.mjs`

## Steps

1. Add a port `ensureWorktree({ projectRoot, path, branch })` to `placeHead` with a default that runs the host's
   `fgos worktree create <path> --branch <branch> --base <trunk> --json` when the path is not a registered worktree,
   and reuses it when it is registered on that branch; registered on another branch refuses
   `shaper-worktree-mismatch`. Read the worktree list through the Git inspect door, not by parsing `git worktree list`.
2. In `placeHead`, for persona `shaper` only: after the task resolves, ensure the worktree for the discussion and put
   `workdir` on the launch request. The rotation executor calls `placeHead` too, so a successor reuses the same
   worktree by step 1.
3. Planner, lead, secretary and supervisor build the same request as before (no `workdir`).
4. Tests in `head-start.test.mjs` (ports, no real launch): a shaper start creates the worktree on `discussion/<dir>`
   and launches with `workdir`; a second placement reuses it without a create call; a mismatched branch is refused by
   name; a planner start carries no `workdir`.

## Verify

`node --test test/session-host/head-start.test.mjs` passes.

## Rollback

Revert the phase's squash commit; shapers launch in the main checkout again (revert phase 5's skill text with it).
