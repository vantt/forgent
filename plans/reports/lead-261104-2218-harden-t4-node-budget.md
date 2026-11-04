# Run Supervisor Node budget: 1 057 to 1 000 lines

Worktree: forgent-worktrees/harden-t4-node-budget, branch harden/t4-node-budget. No file added, no export renamed, no behaviour change.

| file | before | after |
|---|---|---|
| attempt-step.mjs | 92 | 89 |
| cancel-opt-in.mjs | 12 | 11 |
| cancel-registry.mjs | 139 | 135 |
| client.mjs | 132 | 123 |
| direct-launch.mjs | 424 | 396 |
| gate-kill-grace.mjs | 94 | 87 |
| payload-root.mjs | 52 | 52 |
| protocol.mjs | 10 | 8 |
| runtime-dir.mjs | 58 | 55 |
| step-support.mjs | 44 | 44 |
| total | 1 057 | 1 000 |

## What was cut (code, behaviour-neutral)
- direct-launch.mjs: unused local `readJson` (no caller in the file); dead re-export `export { HolderLockError }` and its import (no importer of direct-launch uses it, grepped src, bin, scripts, apps, packages, test); alias `STEP_TIMEOUT_MS` replaced by `ATTEMPT_STEP_TIMEOUT_MS`; `buildEnvelope` returns the body directly and no longer copies `paths.sideFile` into a local.
- cancel-registry.mjs: alias `selfTuple = selfRecord` removed, `selfRecord()` called directly.

## What was cut (comments only)
Comments restating the code or narrating are condensed in all ten files (module headers, JSDoc `@param`/`@returns` that repeat the signature, the stale `p.capture` param). Comments stating an invariant or a non-obvious reason are kept.

## Tests (all green, 0 fail, 1 pre-existing skip: 274 tests, 273 pass)
architecture.test.mjs, event-store/consumers, runner/assignment-enumerator-guard, custody-successor-admission, dispatch-confinement-reaper-fence, dispatch-reconciliation-import-graph, dispatch-runtime-inspect, runner/execution/run, run-supervisor/{adopt-client, attempt-steps, cancel-registry, direct-crash-matrix, direct-cutover, runtime-dir, sweep, windows-custody}, setup/run-supervisor-checks.

Note: the target was reached with 8 lines of code and the rest comment condensation; the remaining code has no further dead exports (every other export has a src caller or is covered only by tests, which were kept).
