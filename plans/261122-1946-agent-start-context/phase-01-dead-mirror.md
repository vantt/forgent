# Phase 1: The dead Node dispatch mirror is gone

Slice 0 (ASC-D7). It lands alone, before any producer moves.

## Inputs

- The discussion, "Deep scan, round 3" ("Dead code") and the `#task-delete-dead-mirror` section:
  `plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md`.
- Backlog row `plans/backlog/p-24xw2cwdvo-delete-the-dead-tier-5-node-execution-modules-and-their-tests.md`. It
  deletes the whole dead closure (78 files), and this phase's set is part of it.
- `docs/architecture-manifest.json` (every file on disk must be declared, and a deleted file loses its row).

## Footprint

`src/runner/dispatch/{session-attempt,assignment-runner,herdr-round,brief,assignment,transport}.mjs`,
`src/run-supervisor/direct-launch.mjs`, `test/runner/**`, `test/run-supervisor/**`, `test/golden-recorders/**`,
`test/architecture.test.mjs`, `docs/architecture-manifest.json`.

## Steps

1. Check whether `p-24xw2cwdvo` has landed: `git log --oneline -- src/runner/dispatch/assignment-runner.mjs`, and
   check whether the file still exists. If it is gone, skip to step 5.
2. Prove that nothing in production imports the set:
   `rg -l "dispatch/(session-attempt|assignment-runner|herdr-round|brief)\.mjs|run-supervisor/direct-launch" src bin scripts`.
   This may list only the set's own files. If anything else is listed, stop and report it as `BLOCKED`.
3. Delete `session-attempt.mjs`, `assignment-runner.mjs`, `herdr-round.mjs`, `brief.mjs` and `direct-launch.mjs`.
   Then delete `renderAssignmentPrompt` from `src/runner/dispatch/assignment.mjs` (delete the whole file if no product
   importer remains), and the two functions in `transport.mjs` that no product code calls.
4. Delete or trim the tests that import only these files, and remove the recorder fixtures and comments that name
   them. Design principle 8 applies: each retired test names the Rust test that owns its behaviour now (look under
   `packages/execution/engine/tests/` and `packages/run-supervisor/rust/tests/`), or says that the behaviour was
   removed. Record this list in the commit body. `test/session-host/head-start.test.mjs` is out of this phase's
   footprint. If it imports the set, leave it to phase 5 and say so.
5. Remove the manifest rows of the deleted files and update any `test/architecture.test.mjs` case that names them.

## Verify

- `rg -l "assignment-runner|herdr-round|direct-launch|dispatch/session-attempt|dispatch/brief" src test bin scripts`
  prints nothing, apart from the phase-5 test named in step 4.
- `node scripts/run-tests.mjs test/architecture.test.mjs test/runner test/run-supervisor` passes.
- `npm test` passes.

## Rollback

Revert the phase's commit. It only deletes code that nothing in production imports.
