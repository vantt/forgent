# erd-p16: `runner.providers.<p>.accounts` reader deleted; accounts read from `runner.llmAccounts` alone

Status: DONE_WITH_CONCERNS
Summary: Rust refuses a non-empty `runner.providers.<p>.accounts` by name (`config-key-retired`, in `check_runner_config`); an empty shell still loads and a new Config repair `remove-empty-provider-accounts` removes it. The Node reader, `compareWithLegacyInventory`, the schema entry and the agy settings.json demand are gone; the agy row reads the `gemini` pool of `runner.llmAccounts`.
Concerns: the tree needs the follow-up writes below (outside my scope) before Node loads: `src/runner/dispatch/config.mjs` still imports the deleted `validateProviderAccountInventory`.

Gate line that opened the phase (design-lap board line, quoted):
`2026-11-17 23:32 DESIGN-LAP: every machine's accounts are on runner.llmAccounts (design-lap, fg-server, fg-server2); design-lap check 0 fails, probes healthy, real runs ok; empty runner.providers.<p>.accounts shells remain (door cannot unset them), phase 16 may proceed (also move agy-permissions.mjs:160)`

## What changed

- Rust, `packages/execution`: `accounts.rs` `refuse_retired_provider_accounts` replaces `validate_provider_account_inventory` and its normalizer/constants; `provider_account_inventory` is now infallible and derives from `llmAccounts` only; `runner_check.rs` calls the refusal; `explain.rs` lost its `inventory-invalid` branch; `ModelError::provider_capacity` deleted (no caller left). Vectors: `executor-model.v1.json` converted every `accountQuarantine`/`accountInventory` vector to `llmAccounts`, added `validate: a provider that still lists accounts is refused by name` and `validate: a provider with an empty accounts list is a leftover shell that loads`; `bind.v1.json` lost the two vectors that fed `providers`.
- Rust, `packages/config`: finding `config-empty-provider-accounts` (warn/warn, accounts file only) with fix `remove-empty-provider-accounts` (`doctor.rs`, `repair.rs`, `doctor-rows.v1.json`); it unsets each empty `accounts`, the provider entry when that was all it held, `runner.providers` and `runner` when nothing else is in them; a provider that lists accounts is left alone. Four fixture cases in `doctor.v1.json`; `golden_doctor.rs` maps the Accounts target.
- Schema: `providers.<p>.accounts` stays loadable (empty shell; a non-empty list reaches the named refusal instead of a schema error), its per-account properties and the `accountSource` def are gone.
- Node: `provider-capacity.mjs` `validateProviderAccountInventory` + helpers deleted, `providerAccountInventory` = `deriveLegacyInventory` only (kept name, so no caller moves); `llm-accounts.mjs` lost `compareWithLegacyInventory` and the `runner.providers` loop of `machineLoginStores`; the file stays (reader of llmAccounts). `agy-permissions.mjs`: sub-HOMEs come from `runner.llmAccounts.gemini.*.credentialStore.agy`; the row now demands only that each sub-HOME directory exists (my reading: dropping the settings.json demand left nothing else to check; cut it if you want the row vacuous); `readAgySettings`/`agySettingsPath` deleted (no caller).
- Docs: `docs/platform/runner/spec.md` row 1b and `contracts/executor-model.md` account-inventory row.

## Retired test -> owner now

| Retired | Owner now |
|---|---|
| `dispatch.test`: validateProviderAccountInventory accepts keyed accounts; rejects array; rejects placement policy | behaviour removed; refusal by name is owned by Rust `executor-model.v1.json` `validate` vectors (`golden_executor_model`) |
| `provider-capacity.test`: home-files source lists relative files / refused by name | removed with the reader; store files come from invocations (`provider-pool-lease` derived-account tests) |
| `provider-pool-lease.test`: llmAccounts replaces providers / config without llmAccounts reads providers / digits-only via providers | replaced by "inventory is llmAccounts alone" and "no llmAccounts has no accounts"; digits-only stays in `llm-accounts.test` + `llmAccounts` vectors |
| `llm-accounts.test`: two `compareWithLegacyInventory` tests | comparison removed |
| `model-pool-checks.test`: `llm-accounts-vs-legacy` row | row retired (src registration is a needsWrite) |
| `provider-per-cli-credential-sources.test`: exactly one of source/sources; single-source lease | removed; per-CLI cases converted to `llmAccounts` |
| `credential-copies-retained-check.test`: "refused by the provider inventory validator" case | validator gone |
| `agy-permissions.test`: missing settings.json, misconfigured toolPermission | removed (run passes session-only `--settings`); replaced by sub-HOME-exists pass/fail tests |
| Rust vectors: seven `accountInventory` reader-shape vectors, `validate` non-object providers, two bind vectors | schema door owns shape; reader removed |

## needsWrites (outside scope, required)

- `src/runner/dispatch/config.mjs` :26 import and :760 call (module does not load without it); the Node twin of the new `validate` refusal vector lives there too.
- `src/runner/dispatch/provider-account-probe.mjs` :95-106 (`providers` branch of `configPinnedToAccount`) and :322 message.
- `src/runner/execution/explain.mjs` :25-37 (`inventoryProblem`, `source: 'providers'`; the Rust twin still says `providers` for an undeclared pool, so change both or neither).
- `src/setup/model-pool-checks.mjs` (:10 import, :168, :178-191 `checkLlmAccountsVsLegacy`), `src/setup/registrations.mjs` (:44, :827 row, :1187-1190, :1504, dead catch :2141-2144), `src/setup/executor-profile-warnings.mjs` :19, :92.
- `packages/distribution/rust/src/agent_config.rs` :486-505 (Rust twin of the agy `providers.gemini.accounts` reader; test :1262).
- `apps/fgos/src/wiring/doctor/config.rs` (ROW_IDS, FIX_IDS, fix id map), `packages/distribution/contracts/doctor-registry.v1.json` (row + fix `config-remove-empty-provider-accounts`), `docs/platform/config/spec.md`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`.
- Tests: `test/helpers/failover-fixture.mjs` :136/:172, `test/workflow/units-runner.test.mjs` :360/:433/:582, `test/cli/dispatch-inspect.test.mjs` :38 still build `providers` accounts; `test/runner/execution/config-snapshot-hash.test.mjs` :69/:75 still passes but mentions it.

## Verification

Rust (target `.../scratchpad/target`; `/home/vantt/projects/forgent-worktrees/s5-p16-target` is not creatable from this sandbox): `cargo fmt --all --check`, `cargo clippy -p fgos-config -p fgos-execution --all-targets -- -D warnings`, `cargo test -p fgos-config -p fgos-execution` all green. Node: run with a temporary loader that strips the two out-of-scope lines (config.mjs, model-pool-checks.mjs) through `scripts/run-tests.mjs`: green: provider-pool-lease, provider-capacity (except the pid-reuse test), dispatch, llm-accounts, model-pool-checks, provider-per-cli-credential-sources, provider-account-probe, account-pin, account-rotation, explain, config-snapshot-hash, bind, dispatch-reconcile-operation, checks, visibility-checks, provider-quarantine-probe, provider-credential-probe, executor-model-vectors, dispatch-confinement-{machine-private,backend-p03,credential-hygiene,authority}, reconciliation-import-graph, agy-permissions (but its doctor-wiring test needs FGOS_HOST_BIN). Not provable here (dead-pid or supervisor behaviour of this sandbox, independent of inventory): provider-capacity C2, credential-copies-retained-check (6), provider-credential-renewal (10), assignment-dispatch (32, "no settled result after its supervisor ended"). Lead must run all of the above for real, plus `test/setup/git-mutation-census.test.mjs`, `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/scripts/check-decision-citation-drift.test.mjs`, `node scripts/git-one-door-scan.mjs --root .`; census not regenerated (as asked). Windows/macOS `cargo check` not run.

## Proposed `## [Unreleased]` line

- `runner.providers.<provider>.accounts` is no longer read: declare accounts in `runner.llmAccounts`. A config that still lists accounts there is refused by name; `fgos doctor --fix` removes the empty `accounts: {}` leftovers.
