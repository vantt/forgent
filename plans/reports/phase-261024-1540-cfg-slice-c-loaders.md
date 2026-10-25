# Slice C, landing C wave 1A: schema fixes, phases 10 and 11

Branch `cfg/slice-c-c-loaders` (from `cfg/slice-c-c`). Commits: `2e636be57` schema bounds, `fd30f9d4f` runner loader (phase 10), `9eb8a915c` callers (phase 11). Impact analysis inactive; callers checked with `rg` (lists below).

## Schema fixes (coordinator decisions)

| Key | Before | Now | Code that reads it |
|---|---|---|---|
| `runner.timeoutMs` (S1) | integer, 60000..14400000 | number, `exclusiveMinimum: 0`, `maximum: 14400000` | `config.mjs` `validateRunnerConfigShape`: any finite positive number, **and refuses above `RUN_TIMEOUT_MAX_MS` (4h)**, so the maximum stays: it is enforced, not invented |
| `runner.idleTimeoutMs` | integer, min 1 | number, `exclusiveMinimum: 0` | same function, "positive number" |
| `checkpoint.fallbackIntervalSec` (S2) | integer, min 1 | number, min 0 | `events-jsonl-truncation-guard.mjs:476` |
| `workerSlots.ceiling` | min 1 | no minimum | `hasWorkerSlotRoom`: any value that is not a positive integer means no ceiling |
| `cleanup.ttlDays`, `leafTtlDays` | min 0 | no minimum | `cleanup-harness.mjs`, no check |
| `gateway.port` | 1..65535 | 0..65535 | `gateway.rs` types it `u16` |

Kept (the code enforces them): eventStore seal/sync/rebuild minimums (`event-store/config.mjs`), terminal layout floors and `retainFailedPaneMs` (route.rs floors, `terminalConfigProblems`), `allocationGraceMs` min 1 (looser than the code's dynamic floor), runner `parallel.*` and `patterns.reviewed.maxRounds` minimums. `core/config-standard/*` doc lines edited to match (the "Minimum: N" text). `cargo test -p fgos-config` green.

O1: the crate already behaves so; fixtures `migrate-drops-a-global-only-value-equal-to-the-standard-or-null` (gateway.port 4170 dropped) and `migrate-refuses-a-global-only-value-that-differs` (9999 aborts, `config-key-out-of-scope`) in `migrate.v1.json` own it. No fixture added.

## Phase 10: `src/runner/dispatch/config.mjs`

- New `loadRunnerConfigForDir(dir)`: `readConfig({projectRoot, sections:['runner']})`, JSON round trip to ordinary objects (the facade's null-prototype objects broke `Array.join` on config arrays), `validateRunnerConfigShape` on the snapshot, `normalizeConfigConfinement`. Door refusal -> `RunnerConfigError` with `.code` = failure id and the door's message (file, line, column, path, keyword; no value). No executor (none set, none detected) -> `RunnerConfigError` code `runner-executor-missing`, text names `fgos config set runner.executor ... --reason ...`. Writes nothing, prints nothing. It does **not** apply `withDefaultExecutor` (callers do, as before; applying it before validation broke `executors.claude` kind).
- `loadRunnerConfig(path)` keeps its signature, reads the named file with `parseYaml` (JSON is YAML), error names line and column.
- Deleted: `detectAssistantCli`, `KNOWN_ASSISTANT_CLI_NAMES`, `SUPPORTED_EXECUTOR_TEMPLATES`, `FRESH_PROJECT_RUNNER_CONFIG`, `bootstrapDefaultExecutor`, `sanitizeGlobalLayer` (+ `warnedGlobalExtendedCells`), `stripConfigComments` and its uses in `seat-policy.mjs`, `run.mjs`, `rejectProjectProviderAccountInventory`, the `projectConfig` parameter of `readLlmAccounts` and the unused options of `compareWithLegacyInventory`, the imports of `mergeConfigDefaults`, `sharedConfigFilePath`, `mergeWithGlobalConfig`, `findExecutableOnPath`. `withMachineAccounts` was never built in this branch (decision C16): nothing to delete.
- **Kept on purpose, to delete with the owner of the importer** (an unowned file still imports them, deleting would break `fgos` and every doctor row in this branch): `DEFAULT_RUNNER_CONFIG`, `DEFAULT_COORDINATION_ORG_DISCHARGE_ON`, `SEAT_BINDING_SCHEMA_VERSION` (`src/setup/registrations.mjs`, phase 14); the two aliases `loadRunnerConfigFromDir` and `ensureRunnerConfigForDir` (= the new loader; importers: `bin/fgos.mjs` phase 15, `src/setup/{registrations,model-pool-checks,executor-posture-coverage,executor-profile-warnings}.mjs` phases 13-14, `test/setup/seat-binding-dry-bind.test.mjs`). `rg -n "loadRunnerConfigFromDir|ensureRunnerConfigForDir" src bin test` lists exactly those.
- `src/runner/dispatch.mjs` barrel: gains `loadRunnerConfigForDir`, loses the deleted names.

## Phase 11: callers

`bin/fgos-runner.mjs`, `operation-choice`, `fanout-batch`, `workflow/{runner,case-start}`, `assignment-runner`, `dispatch/cli` renamed. The two `fs.existsSync(.../.fgos/config.json)` checks in `cli.mjs` are one helper `configRootFor` over `projectConfigPresent`; only "no repository for cwd" falls back to the main root, a refused worktree file now surfaces (it was swallowed by the old `try {} catch {}` only because `existsSync` cannot refuse). `fanout-batch` reads `workerSlots.ceiling` through `readConfig` (propagates). Callers of `loadRunnerConfigFromDir`/`ensureRunnerConfigForDir` checked with `rg`: 7 src/bin files above, `run.mjs`, plus the tests.

## Tests (moved, not weakened)

- Loader wiring in `test/runner/dispatch.test.mjs`, one case per outcome: project file, no file (standard, nothing created, detected `claude` on a temp PATH), no executor (message), unparseable file (`config-parse`), project over global, global tier fill, global `rigorToTier`, project inventory refused (`providers` and `llmAccounts`, `config-key-in-wrong-file`), explicit YAML path with line and column. `test/helpers/committed-config.mjs`: `committedConfigDir()` writes the committed `runner` section only (the repository's own file is refused today for `gateway`, until its live migration).
- Retired with the behaviour: bootstrap-write cases (3 in dispatch.test, 2 in config-seat-binding-layers; the read-never-writes case is dispatch.test "no config file"), the `detectAssistantCli` cases (now `packages/config/rust/tests/detect_path.rs`), stale global tier key and global list/object cell filtering (6 cases, `sanitizeGlobalLayer` is gone; replaced by one case that the global layer is read as written), 3 `$comment` cases (key gone, doc lines replace it), `project-llm-accounts` in llm-accounts.test (snapshot refusal, covered by the dispatch.test inventory case), the two old-loader stand-ins in `tombstone-older-reader.test.mjs` (the old `readSharedConfig` stand-in stays).
- Refusals the schemas now own (type, enum, minItems, uniqueItems, const, oneOf, maximum) assert the door's failure `runner.<path> (<keyword>)`: tier-fallback-config, tier-cell, dispatch-run-timeout.
- Fixtures adjusted because the standard now fills the project: planning-stage items and `fgos-coding-planning` where a test needs a capability the standard does not register (dispatch.test), executor id `glmbridge` for a fixture that collided with the standard's `glm`, account pools written to `private/accounts.yaml` (provider-pool-lease), an empty HOME for one assignment-dispatch case (an earlier test's child process leaves `~/.fgos/config.json` with a gateway token, written by the old Node writer), plan-lint fixture trimmed to executor plus marker.

Green (run with `HOME` = a fresh empty directory, `node scripts/run-tests.mjs <files>`): dispatch.test 320/320, tier-fallback-config 11, tier-cell 20, dispatch-config-patterns, config-seat-binding-layers, llm-accounts, default-executor-merge, assignment-dispatch 48, provider-pool-lease 14, provider-adapter, dispatch-policy-baseline-snapshot, dispatch-confinement-policies, dispatch-execute-for-capability, dispatch-production-call-sites, dispatch-run-timeout, explain, dispatch-executor-profile, dispatch-confinement-authority, tombstone-older-reader, plan-lint 12, fgos-merge-next-no-config-write; `cargo test -p fgos-config` green.

## Red, by the standard filling the project (strictness, decision "Strictness" item 2; fixtures are phase 18)

- `test/runner/execution/run.test.mjs`: 6 cases expecting `policy-refusal` for capability `not-configured:answer` (unit fixtures `setupGitRepo`): with the standard the capability binds to the standard's executors (`gemini`, real herdr-spawn) and the run ends `execution-failure`. An unknown capability is no longer unconfigured once a standard exists: a fixture needs a different way to be "refused" (phase 18 decides).
- `test/workflow/workflow-runner.test.mjs`: 14 cases (`tier-cell-missing`, `policy-refusal` instead of parked/completed), same cause.
- Not run: `test/e2e/*`, `test/runner/loop*.test.mjs`, the rest of `test/runner`, `test/workflow` beyond the four files I ran. An accidental whole-suite run (my launcher call with many files) showed 362 failures out of 8605 against a machine HOME-less setup; I did not triage them (many are the same class); not claimed as caused or uncaused.

## Numbers

- Node source (`git diff --numstat 2e636be57~1..HEAD -- src bin scripts`): **117 added, 328 removed, net -211** (phase 10: 72 added / 284 removed; phase 11: 45 / 44). New loader code in `config.mjs` is about 50 lines (cap for loaders 70). Tests: 229 added, 427 removed. Schema and standard files: 13 / 16.
- Rust lines added: **0** (schemas and standard YAML only; the crate's source untouched).
- `packages/git/contracts/mutation-census.v1.json` regenerated twice (the pre-commit one-door check demands it); it is a merge conflict magnet across the three C worktrees: regenerate after the merge, never hand-merge.

## Deviations from the plan text, for the coordinator

1. `config-key-out-of-scope` for a **global** `runner.rigorToTier` does not happen: the snapshot lets it through and `validateRunnerConfigShape` refuses it ("declares retired rigorToTier"), naming the project directory, not the global file. The case asserts the retired-key message; B's scope goldens do not own this key as phase 10 step 4 assumed.
2. Global extended tier cells (list, `model@pool`, object) are **no longer dropped**: they load as written. An older release on the machine that reads the global file still cannot read them; this was the `sanitizeGlobalLayer` job and B's D10 "owner's global-file cleanup" blocker. Needs an owner call (refuse them in the global scope in the schema, or accept).
3. A `$comment` key in a legacy JSON project file is not refused and not stripped; it reaches the loaded config. Migration (D) converts it to doc lines, so only an unmigrated file is affected.
4. `plan-lint` on a project with no config used to exit 2; it now reads the standard (spec section 5 rule 1). Test changed to the invariant that survives: a read-only lint creates nothing.
5. Not merged `origin/main` at start or end (instruction: no merge); the branch point equals `origin/main`.

Unresolved: items 1 and 2 above (owner/B); phase 18 owner for the 20 red cases.
