# Phase lead report: MP-B1 phases 00, 01, 02

Branch `worktree-agent-ad64523dab216c3ea`, cut from main `c65cbf643`. Plan: [plan.md](../261019-2312-model-pool-b1-fallback-and-account-order/plan.md). Phases 03 and later not started.

## Phase 00 facts

1. **Landing state.** AGENT-WF 07-08 are not on main: the last commits of `src/runner/execution/run.mjs` on main are `7eeb02892`, `06d122caa` (custody lease and signal work, not AGENT-WF). Phase 04 still waits for them. The lock block of `provider-capacity.mjs` on main is the kernel-mutex form (`97a8c95cb`, `a83514dd7`, `137538ce6`); no later rewrite is on main, and my edits stay outside it (state-lock and account-lock functions untouched).
2. **Second walker.** `attemptProviderCapacityFallback` (`assignment-runner.mjs:1012`) walks `compiledPlan.policy.executorPreference.slice(1)`, which holds only a declared `fallbackExecutors` list (`assignment-policy.mjs:403`, from an operation policy or `cliOverride`). `rg fallbackExecutors src/runner/execution` finds nothing: `runUnit` / `fgos run` never set it, so under `fgos run` the walk is empty. It stays reachable from the legacy dispatch path and from workflow operations that declare `policy.fallbackExecutors` (`registrations.mjs:1186-1228` validates them). Phase 04: leave it, it is not the `tried` walk.
3. **Reliers on the missing-cell fallthrough (`bind.mjs:453-464`).** Count: **0 configs rely on `executor.model` or `default`.** Method: `loadRunnerConfigFromDir` on each project config with the real global config merged, then `resolveTierModel` for every executor and tier (script kept in the scratchpad, not in the repo). Result for the three loadable configs (forgentX, mdview, mcp-skill-hub):

   | Config | Executors | Cells missing | Reachable by `rigorToTier` | `executor.model` declared |
   |---|---|---|---|---|
   | `~/projects/forgentX` | 9 (7 agent) | `mini` for every family | none (maps nano, standard, flagship, frontier) | none |
   | `~/projects/mdview` | 11 | `mini` for every family | none | none |
   | `~/projects/mcp-skill-hub` | 9 | `mini` for every family | none | none |

   Every family has cells for nano, standard, advanced, flagship and frontier. `mini` is reachable only through a capability or workflow `tier` override, and no config declares one. `fgos-test-drive` (retired `rigorOverrides`) and `herdr-gateway` (retired `models` map) already fail to load, so they rely on nothing. No capability sets `tier`; only the forgentX architecture capabilities set `rigor` (high, critical). Consequence for phase 03: refusing a missing cell by name changes behaviour for no configuration on this machine; the first affected binding would be an explicit `mini` request. Tests: the fallthrough is exercised only through `bind.test.mjs` fixtures without `modelPolicies`; phase 03 finds them by running the test matrix.
4. **Derived account vs its readers (phase 02 rule).** `kind` and `files` are read at: `provider-account-probe.mjs:38-41` (layout: `agent.db` means omp, `auth.json` means pi), `provider-credential-probe.mjs:59-75` (same two markers), `provider-credential-renewal.mjs:499-502,1077` (layout and files copied), `drivers/bwrap.mjs:68-77` (`home-files` needs a non-empty `files`; the invocation's own `credentialStore.files` wins at `:80`), `registrations.mjs:4491` (doctor, `store.files ?? source.files`). `herdr-round.mjs:283-289` reads only `kind` and `home`. The rule gives each of them what it reads today: `use: codex` is `codex-home`; any other `use` is `home-files` with the files the invocations of that store declare, and pi files contain `auth.json`, omp files contain `agent.db`. For the pool `openrouter` (pi): the project config's pi invocations declare `auth.json, models-store.json, settings.json, trust.json, bin/fd`, equal to the files the old `z-ai.openrouter` and `deepseek.openrouter` accounts carry. **Gap for phase 06:** the global config's agy and pi invocations declare no `credentialStore` (they rely on the `resourceBindings` inference, which carries no files), and the project config declares files only for pi and omp. A pool moved to `llmAccounts` whose store has no declared files (today: `agy` of pool `gemini`) is unusable on that CLI until an invocation declares `credentialStore.files` for it. The unusable accounts are shown by `inspect` (`unusableFor`) and by doctor row `llm-accounts-shape` (warning).
5. **Config merge level.** `mergeConfigDefaults` (`src/setup/config-merge.mjs`) deep-merges plain objects key by key and treats arrays as leaves: a project `modelPolicies.<family>` merges per tier with the global family (project wins a tier it names, global fills the rest); a list cell is a leaf. `runner.tierFallback` therefore merges per tier too, a project list replacing the global list of that tier whole (covered by a test). The global sanitizer drops list and `@` cells of `modelPolicies` only, not `tierFallback`.
6. **Old-release safety.** The activated release (`~/.local/state/fgos/releases/sha256:1443...`, legacy-node payload) loads a copy of the forgentX project config carrying `runner.tierFallback` for `advanced` and `flagship` without error (`loadRunnerConfigFromDir` of that release, run from the scratchpad). That release already contains `tier-cell.mjs`, `llm-accounts.mjs` and `explain.mjs` (MP-A), so lists and `model@pool` load there too.
7. **`--account` callers (12 sites).** Readers/writers of the pin: `account-pin.mjs:30` (`resolveAccountPin`) called from `bind.mjs:414`; `run.mjs:343`; `bin/fgos.mjs:2306,2354,2880-2885`; `src/workflow/case-start.mjs:186,252` (existence check, error text names `runner.providers.*.accounts`); `src/workflow/runner.mjs:55,431` (unpinned event); `src/cli/command-registry.mjs:1366,1387` (flag text); `src/verbs/dispatch/reconcile.mjs:73` (quarantine verbs); `src/runner/dispatch/cli.mjs:1015` (a different `--account`: `probe-account`); docs in `docs/specs/runner.md`. `provider-account-probe.mjs configPinnedToAccount` is the narrowing door (changed in phase 02, see below).
8. **Old unit records.** Walk state lives in `unit.json` attempts: `skipCandidateIndex` and `candidateIndex` (`run.mjs:920-923`), read back by `assignment-runner.mjs:465,1191` (`fallbackSkipIndex`, `previous.binding.candidateIndex`) and `blind-steps-proven-pools.mjs:74-78`. Read rule for phase 03/04: a record without the new `tried` field restarts the walk at the primary.
9. **Frontier critique seat.** Seat tier follows the capability rigor; a single seat's rigor is set by the workflow step: `core/workflows/architecture-advisory.yaml` (`rigor: high` at the synthesize step, line 62; the critique step uses `capability: architecture:critique`, whose rigor is set in the project config). So the one frontier seat is a `rigor: critical` on that step (phase 06 diff, separate).
10. **Integer-like account ids.** None in `~/.fgos/config.json`, the forgentX, mdview or mcp-skill-hub configs.

### Baseline and impact

- Baseline (before any change): the 52 test files importing the modules phase 01 and 02 touch plus `test/architecture.test.mjs`: 1405 tests, all pass. (An earlier run of 53 files failed only on a fixture `.jsonl` my file list wrongly included; the script was fixed.)
- GitNexus present (`fgos tool query --capability impact-analysis --status present`); the index is the main checkout's and stale (`b334695`). Upstream impact: `providerAccountInventory` CRITICAL (15 symbols: `hasProviderAccounts`, `acquireProviderAccountLease`, `clearProviderAccountQuarantine`, `inspectProviderCapacity`, doctor `checkConfinedPaneAccounts`; processes `check`, `inspectDispatchUseCase`, `dispatchBound`, `executeAssignment`, `runDispatchCli`), signature unchanged; `acquireProviderAccountLease` CRITICAL (`attemptProviderCapacityFallback`, `executeAssignment`, then `dispatchBound`, `runRole`, `dispatchClaimedItem`, `planUseCase`), one named argument removed; `validateModelPoliciesShape` CRITICAL (config load for every caller), shape check added after it; `rankProviderAccounts` reported 0 callers, cross-checked with `rg`: callers are `acquireProviderAccountLease` and `provider-capacity.test.mjs`. `resolveTierCandidates` is not in the index (`rg`: `explain.mjs`, `resolve.mjs`, `tier-cell.test.mjs`). The other phase 03 symbols were not queried (phase 03 owns them).

## What was built

### Phase 01 (commits `5a1608682`, `3d1e391d4`)

- `runner.tierFallback`: tier to non-empty list of distinct family names, validated at load by `validateTierFallbackShape` (`config.mjs`): a key outside `MODEL_POLICY_TIERS`, a non-object, an empty or non-list value, a non-string or blank entry and a repeated family each throw `RunnerConfigError` naming the key path.
- One reader `tierFallbackOf(cfg, tier)` in `resolve.mjs`: returns a copy of the list or `null` (no list means the walk keeps `prefer` order, so a config without the key behaves as before).
- Doctor row `tier-fallback` (`model-pool-checks.mjs` `checkTierFallback`, one registry row in `registrations.mjs`, one row in the doctor how-to table): warns about a listed family with no `modelPolicies` cell at that tier or no agent executor; never fails.

### Phase 02 (commits `bc57e8550`, `67cc6e9d3` doctor registry docs for phase 01, `9d15589c7` test import)

- `providerAccountInventory` (`provider-capacity.mjs`) is the one inventory door: pools declared in `runner.llmAccounts` supply their accounts, derived by the new `deriveLegacyInventory` (`llm-accounts.mjs`) into the per-CLI `credentialSources` shape every reader already uses; a pool not declared keeps the `runner.providers` read, marked in code as the transition read with its removal condition (MP-C). State keys are `legacyStateKey(pool)`, so pool `openai` stays `openai-codex` and existing state, sticky records and quarantines keep applying.
- `rankProviderAccounts`: sticky account while usable, else `Object.keys` order skipping quarantined and `disabled` accounts. Least-lease and least-recently-used are deleted from the sort. `lastSelectedAt` is still written (evidence for `inspect`).
- Digits-only account ids are refused in the legacy validator and in `readLlmAccounts` with the reason.
- `inspect` rows carry `disabled` and `unusableFor`; the unlock probe skips disabled accounts; doctor `llm-accounts-shape` warns about stores without declared files.
- `configPinnedToAccount` (`provider-account-probe.mjs`) narrows `llmAccounts` as well as `providers`, so a pinned account is still the one leased once its pool is declared in `llmAccounts`.

## Decision to test mapping

| Decision | Test |
|---|---|
| 1 tier order, absent list = legacy walk (config half) | `test/runner/tier-fallback-config.test.mjs`: list loads and is returned in order, absent key reads `null`, copy returned, each shape error, project list replaces a global tier list; walk behaviour is phase 03 |
| 1 doctor | `test/setup/model-pool-checks.test.mjs` `tier-fallback ...`; row list in `test/setup/checks.test.mjs` |
| 3 declared order, sticky kept, quarantined/disabled skipped | `provider-capacity.test.mjs`: `selector ranks accounts in the order the config declares them`, `selector skips a quarantined or disabled account`, `sticky assignment ...`, `lease acquire/release ...` (two leases on `a`), reclaim tests |
| 3 no store for the CLI skipped | `provider-per-cli-credential-sources.test.mjs` (existing, passing) and `provider-pool-lease.test.mjs` `a store no invocation declares files for ...` |
| 3 integer id refused | `provider-pool-lease.test.mjs` `a digits-only account id is refused by both inventories` |
| 4 separate state per pool, one pool quarantined | `provider-pool-lease.test.mjs` `pools keep separate leases and quarantine`, `the pool openai keeps its legacy state key` |
| 4 pool source and precedence | `provider-pool-lease.test.mjs`: declared pool wins, undeclared pool reads `runner.providers`, no `llmAccounts` equals the old inventory, derived shape, files per family, JSON key order survives the config merge |
| pin on a declared pool | `provider-pool-lease.test.mjs` `a pinned account narrows the llmAccounts pool ...` |
| doctor, unusable store | `provider-pool-lease.test.mjs` `doctor warns about a store no invocation declares files for` |

Decision 4's `pool/account` pin and the missing-cell refusal are phases 03 and 04.

## Test runs

All with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<private target>/release/fgos`, binaries built with `cargo build --release --workspace` into the private target dir.

| Run | Files | Tests | Result |
|---|---|---|---|
| Baseline (before changes), files importing the phase 01/02 modules + `architecture.test.mjs` | 52 | 1405 | all pass |
| After phase 01 (`tier-fallback-config`, `model-pool-checks`, `checks`) | 3 | 122 | all pass |
| After phase 02, first sweep (`git grep -l` over `provider-capacity.mjs`, `llm-accounts.mjs`, `dispatch/config.mjs`, `dispatch/resolve.mjs`, `model-pool-checks.mjs`, `setup/registrations.mjs`, `runner/dispatch.mjs`, `assignment-runner.mjs`, `execution/explain.mjs` + architecture, file count checked) | 94 | 2351 | 4 failures, all real and fixed: import-closure allowlist of reconcile, SCC cycle check (my first design imported `provider-credential-probe` from `llm-accounts`; `expandCredentialHome` moved to `provider-capacity.mjs` and its five importers updated), Data Dictionary doctor-row list |
| Same sweep plus `provider-credential-probe.mjs`, `provider-credential-renewal.mjs`, `herdr-round.mjs`, `drivers/bwrap.mjs`, `provider-account-probe.mjs` | 104 | 2448 | all pass except one test file importing the moved function; fixed (commit `9d15589c7`), file rerun 13/13 |
| Full `npm test -- --test-concurrency=4` at `9d15589c7` | all | 8539 (8434 pass, 31 skipped) | 9 fail, all outside this change, see below |

The 9 failures of the full run, each checked alone:

- `fences-v1-tombstone` (1): known, fails alone too.
- `skill-wrappers` projection test (1): worktree-only, `.claude/skills/instruction-audit/SKILL.md` projection absent.
- `hot-lock-multiprocess` "uncontended acquire ... not more than 10% slower" (1): load-sensitive, passes alone 6/6.
- `spawn-worker` `idleTimeoutMs` (1): load-sensitive, passes alone with its file (24 tests, only fences fails in that pair).
- `dev-host` distinct Cargo targets (1): load-sensitive, passes alone 10/10.
- `run-supervisor-checks` `runtime-socket-dir` (4 rows): socket-path length, pass alone 24/24.

No failure touches the lease, config, doctor registry or bind code. Another lead ran a suite on the machine at the same time.

## Reused code

`legacyStateKey`, `readLlmAccounts`, `parseTierCell`, `credentialStoreOf`, `credentialSourceForCli`, `inventoryServingCli` (store filter before ranking, unchanged), `validateModelPoliciesShape`'s shape (copied pattern for the new check), doctor helpers `loadOrExplain` / `deriveProviderFamily`, `seedFileLocalBwrapRegistry` and the setup-checks harness in tests. Prior art: the plan's table was re-verified; nothing earlier existed for a tier order or a declared account order.

## Deviations from the phase files

1. **`seed` and `stableHash` deleted (L10).** Declared order makes the hash tiebreak and the `seed` argument dead. Removed from `rankProviderAccounts`, `acquireProviderAccountLease`, the `dispatch.mjs` barrel and the two `acquireProviderAccountLease` calls in `assignment-runner.mjs` (two argument lines; no other change there). Phase 04 owns the rest of that file.
2. **Two small edits in phase 03/04 files so nothing breaks now.** `explain.mjs` reads the legacy inventory through `validateProviderAccountInventory` (it printed the merged inventory as "legacy" otherwise, defeating its own comparison); `configPinnedToAccount` narrows `llmAccounts` (above). Phase 03 should keep both.
3. **Phase 02 lists `provider-capacity.mjs` and `llm-accounts.mjs` as owned files.** Also edited: `provider-account-probe.mjs` (pin narrowing), `model-pool-checks.mjs` (one warning), `dispatch.mjs` (barrel), and the importers of `expandCredentialHome` (`provider-credential-probe.mjs`, `provider-credential-renewal.mjs`, `herdr-round.mjs`, `drivers/bwrap.mjs`, one test). `expandCredentialHome` moved into `provider-capacity.mjs` next to the other credential-source facts, because `provider-capacity` now imports `llm-accounts` (a two-file cycle through functions only, which the SCC check allows) and `llm-accounts` must not reach the credential probe (process control would enter the reconcile import closure). The reconcile closure test allowlists `llm-accounts.mjs`.
6. **GitNexus `detect_changes` could not be used:** the MCP index is of the main checkout (`/home/vantt/projects/forgentX`), stale at `b334695`, and reports no change for this worktree. The blast radius above comes from `impact` on main plus `rg` and the test sweeps.
4. **CHANGELOG** has one `[Unreleased]` line for both phases; it says no run reads `tierFallback` yet, to be reworded when phase 03/04 land.
5. **Phase 01 doctor how-to row** added now (not in phase 05) because the registry row and the doctor docs table must agree.

## RUL104 ideas (not done)

- `compareWithLegacyInventory` and doctor row `llm-accounts-vs-legacy` have no use once `runner.providers` is gone (MP-C); delete them with it.
- `validateProviderAccountInventory` is called by `loadRunnerConfig` for the legacy key and again inside `providerAccountInventory` on every lease; caching per config object would make the lease lighter. No evidence of a problem yet.
- The global agy and pi invocations could declare `credentialStore` (with files) so derivation needs no project config: phase 06.

## Open questions

1. **Files for a derived store come only from invocations** (plan rule). Phase 06 must give every CLI store a pool uses an invocation that declares its `files`, or keep that pool in `runner.providers`. Concretely today: pool `gemini` store `agy` has none; `openai` pi, `z-ai`/`deepseek` pi and `xai`/`gemini` omp are covered by the project config only. Alternative: fall back to the files of the same account in `runner.providers` during the transition. Recommendation: keep the plan's rule (no empty homes) and fix it in the phase 06 config diff.
2. Declared order puts every parallel seat on the first account (owner decision, reversal trigger 3). `inspect` shows `openLeases` per account, which is the signal to watch.
