# T5 P04 half B: executor commands and confinement keys become global-only

Branch `harden/t5-p04b` (from `0c12a10ea`). Not pushed. Must not land before the owner-made move below.

## What changed

Schema (`core/config-schema/runner.schema.yaml`, 12 lines, `x-fgos-scope: global-only` only; no Rust source change, no new mechanism: the scope judge already refuses a key, or a list or scalar above one, in the project file by name `config-key-out-of-scope`):
- `runner.executor.command`, `runner.executor.args`
- executor entry `command`, `args`, `permissionMode`; invocation `command`, `args`, `permissionMode` (so a project `invocations` list is refused whole)
- `launchConfinement.backend`, `privateHome`, `isolatedSession` (one def, so executor entry and invocation both)
- capability `aliases`

Decided by the coordinator after the CFG review: capability `prefer` stays `both`; `contract`, `controls`, `grants`, `networkFilter` of a launch confinement stay `both` (CFG follow-up below).

Docs: `docs/platform/config/spec.md` (section 3 rule 4 and a decision-history line), `CHANGELOG.md` `[Unreleased]`.

## Prefer cannot lower confinement: existing check, plus one new proof

Executor entries and invocations are now machine-owned, so a project `prefer` can only name an executor or invocation the machine's file defines. Binding refuses a preferred invocation that cannot carry the posture:
- `src/runner/execution/bind.mjs:129-141` `executorFacts` sets `carriesPosture` per invocation from `canApplyPosture` (`src/runner/dispatch/confinement/policies.mjs:728-745`, `resolvePostureInvocation`: the effective confinement must declare a bwrap backend that is enabled and executable in the machine registry).
- `packages/seat-binding/rust/src/rank.rs:714-724`: a pinned invocation that does not carry the posture is `pin-unsatisfiable`, never swapped.
- Proofs that existed: `test/runner/execution/run-posture.test.mjs` (`resolvePostureInvocation selects ...`, `canApplyPosture needs a declared backend ...`, `an unavailable backend refuses with posture-unavailable and never runs unconfined`). They proved the facts layer and the launch, not the pinned-prefer join.
- Added the missing join proof: `test/runner/execution/bind.test.mjs` "a capability that prefers an invocation with no confinement backend is refused, never swapped for another invocation" (refused `pin-unsatisfiable`; the confined invocation of the same executor binds).

## Refusal proofs

`packages/config/rust/tests/golden_snapshot.rs` `a_project_file_cannot_set_what_runs_or_loosen_how_it_is_confined` (red first commit, green now). 10 cases, each refused in the project file with `config-key-out-of-scope`, the path and the line, and accepted in the global file: executor `command`, executor `args`, executor-entry `command`, executor-entry `args`, invocation list, `permissionMode`, confinement `backend`, `privateHome`, `isolatedSession`, capability `aliases`. `authoring_equivalence.rs` pins the 14 real schema paths as `global-only` through the bundled schema.

## Tests moved or rewritten (new owners)

- Rust: `authoring_equivalence.rs` and `golden_migrate.rs` now lay the machine-only differences in a global file (`common::machine_differences`); migrate expects 24 kept, 250 redundant, standard copies of global-only values dropped. No test retired.
- Node: fixtures wrote executors into a project file (617 failures at first). One door fixed it: `test/helpers/config-fixture.mjs` `writeProjectConfig` sends `runner.executor`, `runner.executors` and capability `aliases` to the machine home (a scratch HOME, never the operator's); `readProjectConfig` puts them back per project directory; `machineHome()` and `moveMachineKeysTo(dir, home)` serve tests that run under a HOME of their own. Hand-fixed: `dispatch-executor-profile`, `run-verb`, `execution-outcome-exit-codes`, `failover-fixture`, `direct-harness`, `units-runner`, `run`, `dispatch`, `agent-cli-trust-check`, `model-pool-checks`. Owner of the helper behaviour: `test/helpers/config-fixture.test.mjs` (one new test).
- The eight tests that read this repo's committed config now read a frozen copy `test/fixtures/committed-config.yaml` (today's project file) through `test/helpers/committed-config.mjs`, so they keep their subject after the removal commit.

## Tests that run against this repo's own `.fgos/config.yaml` (red until the move)

Kept as they are (they fail with `config-key-out-of-scope` on the real file until the removal commit):
- `test/cli/dispatch-operability.test.mjs` (2)
- `test/runner/dispatch-governance-operability.test.mjs` (1)
- `test/report/capability-plan-lint.test.mjs` (1)
- `test/scripts/dispatch-decide-hook.test.mjs` (1)
- `test/setup/checks-doctor-config.test.mjs` `node-version-and-git passes under the current process` (1)

Known pre-existing red: `test/scripts/mailbox-behaviour-v7n.test.mjs` (frozen V7n addendum).

## Results

- `cargo test -p fgos-config` green; fmt clean; msvc and darwin `cargo check` clean. Clippy `-D warnings` has 2 errors in `golden_validate.rs`, identical on the base commit (not mine).
- `git-one-door-scan`: 0 undeclared. `architecture`, `doc-health`, `check-decision-citation-drift`, `config-fixture` tests: green.
- Full suite (once, after the fixes): 8649 tests, 8608 pass, 9 fail: the 6 real-repo tests above, v7n, `config-fixture` (a wrong assertion, fixed and re-run green with the others) and `mailbox-live-confined` (process-leak assertion, re-run green alone). 594 s wall.
- Net size: 428 added, 143 removed across 22 files (schema 12, Rust tests ~+210/-80, Node test fixtures ~+180, docs 4, plus the 276-line frozen fixture).

## Move guide for the owner machines (insert in the owner-machine guide)

Do not edit any file before step 1. Decision 64: values move first, the schema lands after.

1. Census, read-only, on each machine and each project that uses fgOS (prints key paths, never values): from the project root run `npm --prefix <fgos checkout on this branch> run fgos:dev -- config check` and read the rows with `severity: fail` and a `runner.*` path. On this repo it lists exactly these 4 paths (after capability `prefer` stayed project-settable):
   - `runner.executor.command`
   - `runner.executor.args`
   - `runner.executors.gitnexus.invocations`
   - `runner.executors.herdr.invocations`
   (the census report `plans/reports/research-261106-1202-project-executor-commands-census.md` lists the same.)
2. Copy into `~/.fgos/config.yaml` on each machine (merge into any existing `runner:` block):
   - the whole `runner.executor` mapping (command and args together; the project's args differ from fg-server2's global, decide which the machine wants)
   - the whole `runner.executors.gitnexus` and `runner.executors.herdr` entries from `.fgos/config.yaml` (each needs its `kind`, and gitnexus its `for`, `scanTarget`; the global file is validated alone)
   Capability `prefer` lists stay in the project file.
3. One commit in this repo removes from `.fgos/config.yaml`: `runner.executor`, the `invocations` lists of `runner.executors.gitnexus` and `runner.executors.herdr`. (An entry that keeps `kind`, `for` and no command may stay.)
4. Verify on each machine: `npm --prefix <checkout> run fgos:dev -- config check` shows no `fail` row, the six real-repo tests above go green.
5. Only then land this branch, in one announced window.

## For the CFG follow-up

`launchConfinement.contract`, `controls`, `grants`, `networkFilter` stay project-settable. They describe the policy of a launch and are not tightened by any rule; a project could name a weaker contract or wider grants there. Worth a CFG look.

## Deviations

- Capability `prefer` scope change reverted at the coordinator's decision (the added bind proof replaces it).
- The committed-config helper uses a frozen fixture instead of `git show HEAD:.fgos/config.yaml`.

Status: DONE_WITH_CONCERNS
