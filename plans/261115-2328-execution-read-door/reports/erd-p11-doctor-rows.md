# Phase 11 seat A (Rust side): the `bridge:S5` doctor rows

Status: DONE_WITH_CONCERNS
Summary: seven rows are judged in Rust (`fgos-execution` `checks.rs`, adapter `doctor/execution.rs`, vectors `checks.v1.json`); `seat-binding-route` is `bridge:S6a`; no `bridge:S5` owner or `S5` layer is left. Node bodies and registrations are untouched (Req 5 is the next step).

## Where each row lived before this change

All eight were Node bodies on the bridge; none was in Rust. The brief's premise that `agy-sub-homes-configured` was already
judged in `agent_config.rs` is wrong: that file holds only `agy-permissions-configured` (the person's `settings.json`) and never
reads `llmAccounts.gemini`; the sub-HOME body is `checkAgySubHomesConfigured` in `src/setup/agy-permissions.mjs` and reads
`llmAccounts.gemini`. It was ported once, into `checks.rs`.

| row | Node body (still there) | now judged by |
|---|---|---|
| `runner-generated-paths` | `registrations.mjs:321` over `validateGeneratedPathsShape` | `checks::runner_generated_paths` over the existing `runner_check::validate_generated_paths_shape` (now `pub`) |
| `executor-confinement` | `registrations.mjs:1520` | `checks::executor_confinement` |
| `invocation-git-write-grants` | `registrations.mjs:1555` | `checks::invocation_git_write_grants` |
| `capability-serves-valid` | `registrations.mjs:1296` | `checks::capability_serves_valid` |
| `omp-natives-present` | `src/setup/omp-natives-checks.mjs` | `checks::omp_natives_present` through port `OmpHost` |
| `agy-sub-homes-configured` | `src/setup/agy-permissions.mjs:158` | `checks::agy_sub_homes_configured` through port `SubHomes` |
| `tool-registry-configured` | `registrations.mjs:768` | `checks::tool_registry_configured` over 07's `tools::tool_posture` |
| `seat-binding-route` | `registrations.mjs` (`checkSeatBindingRoute`) | stays Node, now `bridge:S6a`, description says protocol 2 |

## Layers

`agent-listing.mjs`, `dispatch/config.mjs`, `shipped-catalog.mjs`, `tool-providers.mjs`, `execution/bind.mjs`,
`execution/capability-config.mjs`, `patterns/retired-keys.mjs`, `seat-binding/client.mjs` -> all `S6a`. Importer check
(`rg`): every one is imported from `src/runner/dispatch`, `src/run-supervisor`, `src/session-host` or `src/verbs/dispatch`
(Dispatch, S6a), none is Workflow-only, so no `S6b`. The five hook-row descriptions now name `fgos dispatch decide`.

## agent-type-names-unique: kept, `bridge:S6a`

Its closure is not only the listing: the judge reads `INSTALL_ROOT`, `scanAgentTiers`, `findAgentDuplicates`,
`agentShapeProblem` from `agent-definitions.mjs` and `isWithinDir` from `dispatch/assignment-layout.mjs`, both S6a (Dispatch
renders agent files from them), and `agent-listing.mjs` is imported by nothing else under `src/` but `registrations.mjs`. So
it, `agent-listing.mjs` and its twin test stay; they go with S6a.

## Vectors and recorder

`packages/execution/contracts/checks.v1.json`: 55 vectors over 7 rows, replayed by `tests/golden_checks.rs`. Recorded from the
Node judges by `scripts/checks-vectors.mjs` (ran here; `--check` reports all 55 match) through
`test/helpers/checks-vectors.helper.mjs`: the exported judges are called directly (`checkExecutorConfinement`,
`checkInvocationGitWriteGrants`, `checkOmpNativesPresent` with a fake `omp` on a private PATH, `checkAgySubHomesConfigured`
over temp dirs). Not recorded from Node: `runner-generated-paths` and `capability-serves-valid` (their bodies are private and
read the live config, so the helper repeats the 6- and 15-line body over the exported functions), and the 3
`tool-registry-configured` vectors (`handRecorded`: the Node body probes the live machine; messages written from reading it).

## Retired test -> owner now

None retired in this seat. After Req 5 deletes the Node bodies, the rows' cases in `test/setup/checks-doctor-config.test.mjs`,
`visibility-checks.test.mjs` and the omp/agy tests are owned by `golden_checks.rs` (judgment) and the registry exact-set tests (wiring).

## Gates (CARGO_TARGET_DIR was `scratchpad/target`: the sandbox cannot write `s5-p11-target`, a sibling of the worktree)

`cargo fmt --all --check` ok; `cargo clippy -p fgos -p fgos-execution -p fgos-distribution --all-targets -D warnings` ok;
`cargo test -p fgos-execution` ok (incl. `golden_checks`); `cargo test -p fgos --test cli_tests doctor` 4/4 (new
`doctor_judges_the_execution_rows_in_the_host_without_node`); `cargo test -p fgos --bin fgos wiring::doctor` 109/109;
`test/architecture.test.mjs` 71/71, `git-mutation-census` ok.

## Concerns

- `cargo test -p fgos-distribution`: 5 failures, all `git-floor-probe-failed ... Read-only file system` (the sandbox cannot write
  the Git state root); not caused by this change. `git-one-door-scan` and `cargo check --target ...` could not run here.
- Node tests this change makes fail until Req 5 (outside my write scope): `test/setup/registrations.test.mjs:1209` pins
  `[8,30,6,8]` (now `[0,31,6,8]`); `test/setup/checks-doctor-config.test.mjs` (3 tests: bodies vs registry, registration order,
  58/52 counts, now 65 Rust rows) pass once the Node bodies and registrations go. Also for Req 5: `src/setup/registrations.mjs`,
  `src/setup/omp-natives-checks.mjs`, `docs/architecture-manifest.json`, `test/suite-baseline.json`.
- Two rows judge the config as the runner loads it. `doctor/execution.rs` reads the effective section through the config door
  and runs 06's `load_checked_runner` over a small `Workspace`, without the file-and-line origins `HostWorkspace`
  (`dispatch_decide.rs`, outside my scope) attaches. Only the message of a refused config differs (still passes with
  "runner config not loadable here"). Making `HostWorkspace`/`read_snapshot` `pub(crate)` and deleting `LoadedDoor` and
  `effective_runner` closes it.
- Parity per row against 09's runner (Req 6) is not run here. Behaviour differences to watch: `omp` home is the config door's
  HOME rule (Node also fell back to the passwd home); `serves` keys sort case-insensitively (Node `localeCompare`).
- Proposed `## [Unreleased]` line: none (no user-visible change: same rows, same messages).
