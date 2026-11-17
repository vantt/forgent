# Phase 07 report: decide, the runner config check, the tool probe and the hook in Rust

Branch `execution-read-door/p07`, based on `origin/main` after the agents listing landed. Status: every part that
does not need Seat Binding's bind is done and pushed; the purpose-with-a-prefer-pool path and the assignment-record
path wait for phase 06's `bind` on main (three vectors listed by name, see "Left").

## What changed

- `packages/execution/rust/src/runner_check.rs`: `check_runner_config(runner, label)`, the port of
  `validateRunnerConfigShape` and every helper it calls (retired runner keys and executor fields, persona names,
  capability and policy confinement shapes, tool `for` entries and mcp `tools` keys, bypass confinement,
  `credentialStore`, invocation ids, `prefer` targets, the provider inventory, retired pattern keys and declared
  seats, loop bounds, `generatedPaths`, the machine backend registry, strict confinement). Same texts, classes and
  codes; a refusal carries `path`/`paths`/`detail` for attribution; the advisory provider-family warning is
  returned for the caller to print. Reuses `capability_confinement`, `validate_provider_account_inventory` (now
  takes the source label) and Convention's seat-id and agent-file rules (`fgos-convention`).
- `src/tools.rs`: `ToolProbe` port (`present`, `scan_target_exists`, `index_commit`, `head`), `tool_providers`
  with the live status, `tool_posture` (inactive, full, degraded; one tool executor counts once) for phase 11.
- `src/decide.rs`: `decide_over` (selectors in `compileDispatchPlan`'s precedence, the purpose door, the
  out-of-process resolution refusals of `resolveExecutorConfig`, the answer `decide` prints), `config_root_for`,
  `guard_cwd_repo_root`, `run_door_hint`, `attribute_runner_refusal` / `origin_locations`,
  `refuse_global_rigor_to_tier`, `load_checked_runner` (door section, global `rigorToTier`, semantic check under
  `<root>/.fgos runner`, attribution), ports `Workspace` and `SeatBinder`. Usage text names `fgos dispatch decide`
  (D13).
- `src/hook.rs`: `normalize_hook_payload`, `dispatch_verdict` (Node's texts), `hook_answer` (exit 2 standard, agy
  JSON exit 0), `serve_hook` (a payload that does not normalize allows in the flag's format; a panicking verdict
  allows in the call's format).
- Vectors: `packages/execution/contracts/decide.v1.json` (89 vectors, facts `decide`, `configRoot`,
  `repoRootGuard`, `hookPayload`, `hookVerdict`, `hookAnswer`, `attribute`, `globalRigorToTier`), recorded by the
  committed hermetic `scripts/decide-vectors.mjs` (`--check`; buildTestEnv like the executor-model script, whose
  `serialize` and `adoptTestEnvironment` it reuses) through `test/helpers/decide-vectors.helper.mjs`.
  `executor-model.v1.json` gains 110 `validate` vectors (one per rule no vector covered), recorded by its script;
  `decide.v1.json` re-records none of them.
- `tests/golden_decide.rs` replays decide.v1.json; `tests/golden_executor_model.rs` replays `validate` and the
  `status` of `toolProviders` (both `REPLAYED_LATER` entries removed); `tests/common/mod.rs` is the shared vector
  tool probe.
- Node: `decideOver` extracted from `decideExecutorCli` (the one function the CLI and the vectors call);
  `configRootFor`, `refuseGlobalRigorToTier`, the hook `answer` and the test `withMachine` exported.
  `test/runner/dispatch.test.mjs` gains the Node twin test (all decide.v1.json vectors) and the script's `--check`
  test.

## Retired test -> owner now

| Retired test | Owner now |
|---|---|
| none (Node arms retire in phase 10, binding selectors in 09) | - |

## Gates (on the rebased head)

| Gate | Result |
|---|---|
| `cargo fmt -p fgos-execution --check` | clean (`--all --check` fails only on `packages/run-result/rust/tests/unit_summary.rs`, already on main) |
| `cargo clippy -p fgos-execution --all-targets -- -D warnings` | clean |
| `cargo test -p fgos-execution` | green (golden_decide, golden_executor_model, golden_agents, unit tests) |
| `cargo check -p fgos-execution --all-targets --target x86_64-pc-windows-msvc` / `aarch64-apple-darwin` | green |
| `node scripts/decide-vectors.mjs --check` | 89 match |
| `node scripts/executor-model-vectors.mjs --check` | 348 match |
| `test/runner/dispatch.test.mjs` | 216/0 |
| `test/runner/assignment-dispatch.test.mjs`, `test/scripts/dispatch-decide-hook.test.mjs`, `test/scripts/decision-question-hook.test.mjs`, `test/runner/dispatch/executor-model-vectors.test.mjs` | 50/0, 20/0, 11/0, 2/0 |
| `test/setup/git-mutation-census.test.mjs`, `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/scripts/check-decision-citation-drift.test.mjs` | 1/0, 71/0, 8/0, 33/0 |
| `node scripts/git-one-door-scan.mjs --root .` | 0 undeclared sites |

## Left

- After 06 lands: implement `SeatBinder` over 06's `bind` (`bind_purpose`: the `bindWorkSeat` ask, headless,
  `postureAtLaunch`, no writes; `assignment_executor`: the executor of the effective dispatch policy of a record),
  then remove the three names in `WAIT_FOR_BIND` of `golden_decide.rs` (the test fails if a listed vector stops
  asking the binder or an unlisted one starts).
- The policy of a synthesized assignment is not computed in Rust: it never reaches the decide answer (a pinned
  synthetic either binds to the pin or is swallowed) except a Seat Binding route failure, which an in-process bind
  does not have. The `planForUnconfiguredWork` governance-gate branch is unreachable (vector "a work hint naming an
  unregistered executor under a default executor still dispatches native-first") and is not ported.
- Phase 10: compose decide in the adapter (guard, invocation-root door, `config_root_for`, `load_checked_runner`,
  Work hint bridge, assignment record via the no-follow reader, `decide_over`); the `Workspace` adapter must name the
  file of every project and global origin (the crate never spells a config file name: the "locate and read a project
  config file" door row); print the check's warnings; `caller` is not a decide input (it never reaches the answer).

## Behaviour kept as it is (backlog candidates, not fixed)

1. A runner refusal without a `config-*` code makes the hook allow (p-lqjyc7umub; vector "a runner refusal without
   a code allows, as today").
2. A tool's index reads stale in a directory that is not a repository: Node's `commitAt` returns
   `{ notARepository: true }` instead of throwing, which never equals the recorded commit. The executor-model vector
   "toolProviders: an mcp tool with no repository reads as not stale" records `stale`; its name says the opposite.
3. The semantic check writes the canonical CIDR back into the config in Node; the Rust check is pure (the refusal
   texts agree). An executor or policy named after an `Object.prototype` key counts as registered in Node, not in Rust.
4. `fgos-write-scope` (Rust) and Node `canonicalizeWriteEntry` state the same grammar with different refusal texts;
   the check ports Node's texts locally.

## Unresolved questions

- None blocking. The landing comes after 06's.

Status: DONE_WITH_CONCERNS
Summary: Runner check, tools, hook and decide are in Rust with 89 decide vectors and the validate and tool-status
vectors replayed; the bind-dependent purpose and assignment paths wait for phase 06.
