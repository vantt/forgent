# Heads rotate: full-suite judgment on the host run

The phase 4 gate (acceptance criterion 6) is met for this plan. The host run on main `4951cf3da`, which contains
every phase of this plan (`7717d9a05` and earlier), went red, but none of the reds is in this plan's footprint, and
every owning proof this plan names passed.

## Evidence

- `npm test`: `/home/vantt/projects/forgent-worktrees/main-npm-test-4951cf3da.log`. The run took 525 s, covered 584
  files, and ended with exit 1.
- `cargo test --workspace`: `/home/vantt/projects/forgent-worktrees/main-cargo-test-4951cf3da.log`. It ended with
  exit 101 and one failing target.

## This plan's owning proofs

All of them passed.

- `rotation::decide`, `rotation::measure` and `wiring::session_rotation_hook::tests`: 35 tests passed, and none
  failed. The `decide` line at log line 6617 has stderr output mixed into it, but the test ends `ok`.
- `transcript_records_test` (observe) passed.
- `test/session-rotation/rotate.test.mjs`, `handoff-store.test.mjs` and `test/session-host/head-start.test.mjs`
  passed. None of them is in the failing list.
- Criterion 7: `plan-contract-check` passed with exit 0, as recorded in `lead-261123-0214-heads-rotate-wave-run.md`.
  It cannot run in this sandbox again, because its addon build needs a writable `target/` lock.

## Reds outside the footprint

| Test | Cause (owner) |
|---|---|
| `test/cli/subcommand-flag-drift.test.mjs` (2 tests) | The new `migrate` verb is not in the drift scan's expected list (`d5a414be6`). |
| `packages/run-supervisor/rust/tests/head_request.rs:883` | The `config patch` verb is not in the head-request contract (`31dcaab69`). |
| `test/workflow/guide-schema.test.mjs` (2 tests) | There are 10 workflows instead of 9, and `coding/bugfix` uses the guide form. |
| `test/run-supervisor/terminal-groups.test.mjs:310` | The title separator is `:`, not `·`. |
| `test/scripts/convention-conformance.test.mjs` | 1 naming violation after the cutoff. |
| `test/setup/instruction-projections.test.mjs` | The repo's effective instructions are stale. The fix is `npm run build:skills`. |
| `test/git/one-door.test.mjs:58` | `inspect-cursor-stale` |
| `test/install-packaging.test.mjs:71` | `EISDIR` |
| `run-tests` store-leak check | Live heads wrote into the main checkout's `.fgos` while the suite ran. |

None of these paths is in this plan's footprint. I handed them to the supervisor with `supervisor raise` so it can
route them to their owners.
