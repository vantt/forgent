# Phase 10: Runner loaders in `src/runner/dispatch/config.mjs`

Depends on 07 and 09. Suggested executor: sonnet; **independent sonnet review before landing** (the outcomes of the loader); opus only after a failed attempt. Shared file with SEAT lanes: post first, merge `origin/main` at start and end. Impact analysis on `loadRunnerConfig`, `loadRunnerConfigFromDir`, `ensureRunnerConfigForDir`, `withDefaultExecutor`, `stripConfigComments`, `readLlmAccounts`, `rejectProjectProviderAccountInventory` (record every caller).

## Context

`src/runner/dispatch/config.mjs` (1,938 lines) holds the runner section's own validation (`validateRunnerConfigShape`, which stays: section owners keep their cross-field rules, spec section 12) and the whole old read path around it: `loadRunnerConfig(path)` (`:148`), `detectAssistantCli` (`:194`), `DEFAULT_RUNNER_CONFIG` (`:206`), `SUPPORTED_EXECUTOR_TEMPLATES` (`:271`), `stripConfigComments` (`:280`), `FRESH_PROJECT_RUNNER_CONFIG` (`:298`), `sanitizeGlobalLayer` and its helpers (`:342`), `loadRunnerConfigFromDir` (`:389`), `bootstrapDefaultExecutor` (`:417`), `ensureRunnerConfigForDir` (`:442`, the write-on-read and its two `JSON.stringify` writers at `:453` and `:468`). All of it exists to do what the snapshot now does: merge, drop stale global keys, fill defaults, create the file.

## Files it may touch

`src/runner/dispatch/config.mjs`, `src/runner/dispatch.mjs` (the re-export list), `src/runner/dispatch/{llm-accounts,provider-capacity,resolve}.mjs`, `src/runner/execution/{seat-policy,run}.mjs` (the `stripConfigComments` uses at `seat-policy.mjs:63` and `run.mjs:154`, the `ensureRunnerConfigForDir` calls at `run.mjs:150,586`), `src/state/tool-registry.mjs` (only if it imports a deleted symbol, phase 00), `test/helpers/committed-config.mjs`, `test/runner/{dispatch,dispatch-config-patterns,config-seat-binding-layers,tier-fallback-config}.test.mjs` (and any other test phase 00 lists as importing a deleted name).

## Design

- **One read-only loader** `loadRunnerConfigForDir(dir)` (C9): `readConfig({ projectRoot: dir, sections: ['runner'] })` -> `value.runner`; `withDefaultExecutor` and `normalizeConfigConfinement` as today; `validateRunnerConfigShape(cfg, <file label from provenance>)`. A directory with no config file gets the standard plus the detected executor. If the result has no `executor` (nothing detected, nothing set) throw `RunnerConfigError` whose text names the fix: `no runner.executor: none set and no assistant CLI found on PATH; set one with fgos config set runner.executor ... --reason ...`. **Nothing is written, nothing is printed to stderr about a created file.**
- A `ConfigDoorError` from the facade propagates as is, or is wrapped in `RunnerConfigError` carrying `.code` (`config-parse`, `config-schema`, `config-key-out-of-scope`, ...) and the refusals; the callers that branch on `RunnerConfigError` keep working (phase 00's table lists them). The message never contains a value.
- **`loadRunnerConfig(configPath)` keeps its signature** and reads the named file through `parseYaml` (JSON is YAML) then `validateRunnerConfigShape` (C6). No layer is applied. The error texts "cannot read runner config" and "not valid" stay in spirit but name the YAML parse refusal with line and column.
- **Accounts:** the runner config now carries `llmAccounts` and `providers.*.accounts` from the snapshot's accounts layer; `withMachineAccounts` and the assembly-point calls D added are deleted here. `rejectProjectProviderAccountInventory` (`provider-capacity.mjs:54`) and the `projectConfig` parameter of `readLlmAccounts` (`llm-accounts.mjs:55-60`) are deleted: a project file holding an inventory is refused by the snapshot (`config-key-in-wrong-file`, naming `~/.fgos/private/accounts.yaml`). The two error texts D rewrote stay.
- **Deleted:** `detectAssistantCli`, `KNOWN_ASSISTANT_CLI_NAMES` (if phase 00 shows no other user), `DEFAULT_RUNNER_CONFIG`, `DEFAULT_COORDINATION_ORG_DISCHARGE_ON` if only the default used it, `SUPPORTED_EXECUTOR_TEMPLATES`, `FRESH_PROJECT_RUNNER_CONFIG` and `SEAT_BINDING_SCHEMA_VERSION` if unused elsewhere, `bootstrapDefaultExecutor`, `sanitizeGlobalLayer`, `dropRetiredGlobalKeys`, the two `warnedGlobal*` sets, `stripConfigComments` and its two outside uses, `loadRunnerConfigFromDir`, `ensureRunnerConfigForDir`, the `mergeWithGlobalConfig` and `mergeConfigDefaults` imports. The template data lives in `packages/config/contracts/detected.v1.json` (phase 05); phase 05's pin test that compared it to `DEFAULT_RUNNER_CONFIG.executor` is replaced by the one that compares it to the standard.
- `src/runner/dispatch.mjs` re-exports lose the deleted names and gain `loadRunnerConfigForDir`.

## Steps

1. Merge `origin/main`; `impact` and caller lists as above; confirm with `rg` which tests import each deleted name (phase 00 list).
2. Edit `config.mjs`; run `node --test` for the dispatch config tests through the launcher; move each test: fixtures that wrote a runner section by hand keep the helper; tests that asserted the **bootstrap write** ("added missing default config keys", "wrote a default") are retired with the behaviour (commit message: "behaviour removed, spec section 5 rule 1; the read-never-writes case is `test/runner/dispatch.test.mjs` `<new case>`"), replaced by one case: a project with no config reads the standard, creates nothing, and a detected `claude` on a temp `PATH` becomes the executor.
3. Delete `withMachineAccounts` from the facade (C16) once its last caller here is gone; `rg -n "withMachineAccounts" src test` must be empty after phase 13 as well.
4. Cases that stay owned by existing tests: `validateRunnerConfigShape` (unchanged), `detectAssistantCli` cases move to phase 05's `detect_path.rs` (named in the commit), sanitise cases (`rigorToTier`, extended cells) become: the snapshot refuses them by name (owner: B's scope goldens; one wiring case here that a global file holding `rigorToTier` makes the loader throw `config-key-out-of-scope` naming the global file).
5. `rg -n "ensureRunnerConfigForDir|loadRunnerConfigFromDir" src bin test --glob '*.mjs'` lists what phase 11 and the others still must move; commit with that list.

## Owning proofs

Runner shape: the existing `dispatch*.test.mjs` (moved). Loader wiring: one case for each outcome (standard with no file, project over standard, global refusal, no executor message, explicit path). Snapshot behaviours: B and D.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A caller relied on the file being created by the first run | M x M | phase 00 table; the error and the doctor row say what to do; CHANGELOG |
| `validateRunnerConfigShape` now sees the standard's whole catalog, not only the project's | M x M | the standard was authored to satisfy it (B authoring equivalence); the loader test runs it over the bare standard |
| Callers branch on `RunnerConfigError` text | L x M | phase 00 greps `message` matches; only `.code` is stable |
| `fgos discover` / `plan` with `--config` change behaviour | L x M | same shape check, JSON or YAML; `test/cli/fgos-stage.test.mjs:301` stays |

## Rollback

Revert: the old loaders return; valid only while phases 11-18 are reverted with it (they call the new name).
