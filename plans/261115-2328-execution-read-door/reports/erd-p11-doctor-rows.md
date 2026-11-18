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

## Seat B: parity, Node deletions, doctor comparison

### Parity per row (Req 6)

Table `test/rust-host/parity-cases/doctor.cases.mjs`: S4's 82 doctor cases plus 20 new cases that put each moved row in the
state it judges (bypass confined, git grant, agy sub-HOME missing/present/gemini account store, omp absent/no addon/addon/XDG,
tool missing/present/two capabilities, identical and distinct `serves`, four `generatedPaths` shapes). Base = origin/main
`940272e10` staged in a throwaway worktree (host serves doctor there, so entry A is the base's host via a `release:` entry;
`verb-parity.test.mjs` edited for the run only). Result 101/101 cases green; rows compared (id, status, passed, fix, message,
detail) per call, the base against the host:

| row | row answers compared | differ |
|---|---|---|
| runner-generated-paths | 120 | 0 |
| executor-confinement | 120 | 0 |
| invocation-git-write-grants | 120 | 0 |
| capability-serves-valid | 120 | 0 |
| omp-natives-present | 120 | 0 |
| agy-sub-homes-configured | 119 | 0 (1 case excluded, see below) |
| tool-registry-configured | 120 | 0 |

Accepted differences, each pinned in the table: (a) descriptions of the five hook rows (`dispatch.mjs decide` -> `fgos dispatch decide`)
and `seat-binding-route` (protocol 2) changed on purpose (Req 2), also in the pretty text; (b) `doctor --dir /nonexistent`: the base
`agy-sub-homes-configured` re-read the config from the missing directory and failed with `config-request-invalid (projectRoot)`;
the host judges the executor model it already read and says "nothing to check" (same class as the identity rows' spawn artefact).
Two fixtures the config door refuses (bypass without controls: loader refuses it) still agree on the refusal message on both sides.
Table committed first (`6ea87d1e6`, `e72ac344a`, restorable with `git show e72ac344a:test/rust-host/parity-cases/doctor.cases.mjs`),
then deleted (`f6281d298`) with `verb-parity.test.mjs` back to its form on main. Base worktree and target removed.

### Why `dispatch_decide.rs` was on the needs list

Seat A's `doctor/execution.rs` carries its own `effective_runner` + `LoadedDoor` (a second path to the config snapshot and a
`Workspace` stub) because `HostWorkspace`/`read_snapshot` in `wiring/dispatch_decide.rs` are private. Reusing them would add the
file-and-line origins to a refused-config message and delete ~70 lines of the duplicate. Parity above shows the refused-config
messages already match the base byte for byte, so this is a DRY/one-door cleanup, not a behaviour gap. Not done: the file is
outside this phase's ownership. Proposed follow-up item: make `HostWorkspace` + `read_snapshot` `pub(crate)`, drop `LoadedDoor`.

### Deleted (Req 5)

Node bodies and registrations: `checkRunnerGeneratedPathsConfig`, `checkToolRegistryConfigured`, `checkCapabilityServesValid`,
`checkExecutorConfinement`, `checkInvocationGitWriteGrants`, the `omp-natives-present` and `agy-sub-homes-configured`
registrations, `checkAgySubHomesConfigured` (+ its re-exports), `src/setup/omp-natives-checks.mjs`, `capabilityServesOf`
(no user left), imports `toolProvidersOf`, `validateGeneratedPathsShape` (still in `dispatch/config.mjs`, declared twin), `os`-free
`fs` import of `agy-permissions.mjs`. The vector recorder `scripts/checks-vectors.mjs` and `test/helpers/checks-vectors.helper.mjs`
went too: they called the deleted Node judges; `checks.v1.json` is now plainly owned by the Rust judges. `STEP_ORDER` loses `S5`.

### Retired test -> owner now

| retired test | owner now |
|---|---|
| `test/setup/omp-natives-check.test.mjs` (whole file) | `golden_checks.rs` vectors `omp:*` |
| `checkAgySubHomesConfigured` x3 in `agy-permissions.test.mjs` | `golden_checks.rs` vectors `agy:*` |
| `checkExecutorConfinement` x6 in `visibility-checks.test.mjs` | `golden_checks.rs` vectors `confinement:*` |
| `checkInvocationGitWriteGrants` x2 in `visibility-checks.test.mjs` | `golden_checks.rs` vectors `grants:*` |
| `tool-registry-configured` x4 in `checks-doctor-config.test.mjs` | `golden_checks.rs` vectors `tools:*` |
| `capability-serves-valid` x4 in `checks.test.mjs` | `golden_checks.rs` vectors `serves:*`; a malformed `serves` is the config schema's refusal (row echoes it, as parity cases show) |
| `runner-generated-paths` in `registrations.test.mjs` | `golden_checks.rs` vectors `generated paths:*` |
| `capabilityServesOf` assertions in `capability-config.test.mjs` | behaviour removed with the export |
| exact-id list entries of the seven rows in `checks.test.mjs`; registry counts in `registrations.test.mjs` (65 Rust rows, `[31,6,8]` bridged) | the registry exact-set tests (wiring) |

`test/seat-binding/route-doctor-check.test.mjs` stays (row stays Node, `bridge:S6a`).

### `fgos doctor` on this repo

`npm run fgos:dev -- doctor --json` (working tree) vs the activated release's `fgos doctor --json`: all seven rows have the same
status, passed and message. Six `ok`; `tool-registry-configured` is `fail` (degraded, a declared tool is missing) on both.

### Gates

fmt, clippy `-D warnings` (fgos, fgos-execution, fgos-distribution), `cargo test -p fgos-execution -p fgos-distribution`
(299 pass, 0 fail; the 5 `git-floor-probe-failed` of seat A's sandbox do not occur here), `cargo test -p fgos --test cli_tests`
88/88, `cargo check -p fgos` for x86_64-pc-windows-msvc and aarch64-apple-darwin clean. Census scan: one new site (the `omp`
spawn used `OsStr::new`) fixed by passing the name as the other tool probes do; 0 undeclared. Node: 28 files (the grep list +
census + architecture + doc-health + citation-drift + capability-config) in two batches: 592 tests, 3 fail (release-tree, known).
- Review fixes: omp command names match on both separators, `cleaned` drops `..` above a root, doctor execution rows read the config through the decide door (`HostWorkspace`, once per run, origins kept) so a global rigorToTier is refused.
