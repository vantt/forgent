# Phase 4 result: full release checks at main

- Tip: `27ac7604044b77ed771003de45b4b678138f578c` (`tip.txt`), worktree `261127-0829-red-tests-before-release-p04`,
  run by lead:SUPERVISOR unconfined on 2026-11-27.

| Run | Log | Exit | Failing |
|---|---|---|---|
| listed files + `help-routes.test.mjs` (`node scripts/run-tests.mjs …`) | `listed-files.log` | 1 | 42 of 42 tests pass; the store-leak guard fails the run (below) |
| `npm test` | `npm-test.log` | 1 | 2 tests (start-context, environment) and the store-leak guard (below) |
| `cargo test --workspace` | `cargo-test.log` | 101 | 1 test (start-context, environment) |
| rerun of the 3 start-context tests, `.fgos/project.json` restored | `rerun-start-context.log` | 0 and 0 | none |

## Environment failures (not reds at main)

`fgos worktree create` marks every tracked `.fgos/**` file skip-worktree and leaves it out of the checkout.

- `test/docs/run-doors-doctrine.test.mjs:25` and `test/scripts/project-agents.test.mjs:183`: the start-context door
  reads `.fgos/instructions/effective/rules.json` with `unwrap_or_default` (`apps/fgos/src/wiring/start_context.rs:131`),
  so a missing file is refused as `rule-set-malformed: … EOF at line 1 column 0`. A test compiled the file into the
  worktree at 08:59:45, after these two had run.
- `session_rotation_hook.rs:1357` `a_session_opened_by_hand_gets_the_rules_scoped_…`: the name comes from the tracked
  `.fgos/project.json`. The fallback, `file_name()` of `apps/fgos/../..`, is `None`, so it fails with "the project
  has no name".

With `.fgos/project.json` restored from HEAD, all three pass (`rerun-start-context.log`: 27 of 27, and 1 passed).

## Real red: the suite deletes a dev-host run directory from the real store

Both suite runs fail run-tests' `.fgos` write guard (`scripts/run-tests.mjs:690`), which attributes the write to the
test processes:

- `npm-test.log:9781`: `Deleted (1): .fgos/runtime/dev-host/run-E8fKMc`
- `listed-files.log`: `Deleted (1): .fgos/runtime/dev-host/run-JNio0a` (a directory left by the `npm test` run just
  before it)

Tests that spawn the `fgos:dev` door against the repository root (`scripts/run-rust-dev-host.mjs`; called by
`test/rust-host/help-routes.test.mjs:67`, `test/rust-host/dev-host.test.mjs`,
`test/scripts/run-rust-dev-host-staging.test.mjs`, `test/distribution/native-addon.test.mjs`) run `pruneRunDirs` on
the real `.fgos/runtime/dev-host/`. That deletes any run directory older than 10 minutes. A suite run also leaves a
run directory behind, which the next run then deletes. So `npm test` goes red whenever the tree holds a stale
dev-host run directory when the suite starts, for example after any `npm run fgos:dev` use or after an earlier
suite run. This is the 0832 finding. Its files are outside this plan's footprint.

## Verdict

Phase 4 did not pass on its own: acceptance criteria 1 and 2 failed on the dev-host leak. On lead:SUPERVISOR's decision
(option A, event 2efcb8636c99ecf9) phase 5 fixed it inside the widened footprint, and phase 5's gate reran the full
`npm test` on the combined tree (`reports/phase-05/`).
