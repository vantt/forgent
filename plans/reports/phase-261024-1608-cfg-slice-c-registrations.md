# Slice C, landing C wave 2: registrations (phase 14 and Slice D's moved phase 12)

Branch `cfg/slice-c-c-registrations`, two commits on `cfg/slice-c-c` (wave 1 merged): `47f3b07ab` (D-12, config rows) and `e8809d2af` (phase 14). Not pushed or merged. Impact analysis inactive; callers checked with `rg`.

## What moved

- D-12: `src/setup/config-checks.mjs` (new, 77 lines, cap 140) builds one check per row and one fix per fix id of `packages/config/contracts/doctor-rows.v1.json`; registrations registers both lists. Findings map to `{ passed, message }` (fail fails, warn passes with `warning:`, message `file:line:column row path (detail)`, never a value). One door call (about 70 ms) serves a doctor run; a row asked twice, another project/home/class, or a memo older than 1 s reads afresh. `config-machine-files` is registered as `gateway-token-configured` (same id, same fix id); old token check, fix and the `gateway` default are gone. `registerCheck` now turns a refused file or a missing addon into a failed row with the door's message (the addon message says `fgctl init`) instead of ending the doctor run. `packages/config/contracts/doctor-rows.v1.json` added to `package.json#files` (without it a release payload crashes at import).
- Phase 14: 45 reader sites read through `effectiveSection(cwd, section)` (facade, JSON round trip to ordinary objects) or `machineRunner()`; `loadRunnerConfigFromDir` renamed `loadRunnerConfigForDir`. Deleted: `registerConfigDefault`, `CONFIG_DEFAULT_REGISTRATIONS`, `assembleRegistryDefaults`, `ensureSharedConfigDefaults`, the config-not-stale scan, three writers, the orgPolicy `JSON.stringify` fix, `PI_EXECUTOR_DEFAULT`, `config-awareness`. `rg` for the phase's grep list over `registrations.mjs` finds nothing.
- Wave-1 leftovers removed: `checkSeatBindingConfig` (byte-identical to the bin lane's `seat-binding-checks.mjs`), `loadRunnerConfigFromDir` and `ensureRunnerConfigForDir` (config.mjs, barrel), `DEFAULT_RUNNER_CONFIG` from the `dispatch.mjs` barrel, `export` on `SEAT_BINDING_SCHEMA_VERSION` and `DEFAULT_COORDINATION_ORG_DISCHARGE_ON`, `DEFAULT_CLEANUP_*`, `DEFAULT_HERDR_*`, `DEFAULT_DOC_REGISTRY_SETTINGS`. The `model-pool-checks`, `executor-posture-coverage`, `executor-profile-warnings` imports moved to `loadRunnerConfigForDir` and `readLlmAccounts` lost its dropped `projectConfig` argument (wave 1B deferral).

## Row table (also in the commit message)

| Row or default | Disposition |
|---|---|
| config-not-stale | deleted: the standard fills a missing key |
| config-awareness | deleted (C13): `fgos config show` provenance, `config-legacy-shadowed`, `config-format-legacy-json` |
| gate-bypass-configured, iron-law-configured (check, fix, default) | covered by `config-schema` (enums) |
| herdr-launcher-configured, herdr-web-dashboard-configured, doc-registry-enforce | covered by `config-schema` (booleans) |
| invariant-checks-configured, worktree-setup-configured | covered by `config-schema` (non-empty strings) |
| advise-execute-capabilities-configured | deleted: the standard declares every curated slot |
| runner-coordination-orgPolicy-shape (check, fix) | covered by `config-schema` (`dischargeOn`); the fix wrote JSON |
| seat-binding-config | deleted: doc lines replace the ladder comment |
| gateway default and token row | D-12 (above) |
| defaults of cleanup, workerSlots, invariantChecks, checkpoint, worktreeSetup, terminal, eventStore, herdr*, docRegistry, runner | deleted: the standard |
| kept over the effective value | worker-slots-ceiling-usable (schema admits 0 and -1), runner-generated-paths and runner-patterns-config (owner validators), tier-vocabulary-dead-keys (one `effective` level now), workflow-capabilities-configured, capability-serves-valid (the `review` clause dropped, the standard supplies it), tool-registry-configured, confinement rows, provider-capacity-state, credential and confined-pane rows (`readDoctorProviderInventory()` takes no argument, reads the machine view) |

## Numbers

Node source (`git diff --numstat 3e6c5bec3..HEAD -- src bin scripts`): **221 added, 1013 removed, net -792** (this lane only). `registrations.mjs` +130 / -958; `config-checks.mjs` +77. Tests: +329 / -1073. Cap note: the shared row "D-12 and D-13 reader and registration edits" is 120 lines and registrations alone added 130 (helpers 40, rewritten checks, a shorter header); D-13 has not started, so that row is over by 10 before it does. Reported, not trimmed further.

## Tests

Run with an isolated HOME through `scripts/run-tests.mjs`: config-checks (6, new), registrations 45/45, checks 49/49, confinement-doctor-checks and credential-copies-retained-check green, capability-catalog-doctrine green, checks-doctor-config 36 of 42.
- Moved, not weakened: tool-registry (three tests now write the local status overlay; `inactive` cannot occur, see decision), workflow-capabilities (a project Workflow stands in for the capability the standard no longer lacks), worker-slots (standard-alone, 0 and -1), runner-generated-paths and runner-patterns-config (standard alone plus the owner rules), confinement strict readiness (anchors every capability, the standard's included), credential rows (accounts file, door message).
- Retired with the behaviour: config-not-stale (4), invariant/worktree-setup/herdr/doc-registry/gate-bypass/iron-law/advise-execute/config-awareness row tests, `test/setup/doctor-coordination-checks.test.mjs` (orgPolicy row), the registerConfigDefault and ensureSharedConfigDefaults mechanism tests, the gateway default test, the Event Store default test, the terminal default merge test, the worker-slot registration shape test (its consequence test now reads the standard), the setup fill-missing envelope test (covered by the bin lane's "leaves an existing legacy config.json alone").
- Red and not mine: `node-version-and-git` (reads this repository's refused config until phase 21); 5 `model-pool-checks` cases (fail identically at `3e6c5bec3`, phase 13 fixtures). Red until the bin lane merges: CLI cases that spawn `bin/fgos.mjs` (it still imports `ensureSharedConfigDefaults`): 5 in checks-doctor-config, 4 in `test/state/worker-slots.test.mjs`. Verified in a scratch worktree of my HEAD plus the bin lane's working-tree patch of that moment (Rust `bundle.rs` left out): checks-doctor-config, all `checks-setup-*`, `test/cli/fgos-setup.test.mjs` 67 of 69, the two failures `node-version-and-git` and the non-git copy test; the copy test then needed `doctor-rows.v1.json` in its package copy list, fixed in `checks-setup-rc-line.test.mjs` and green (2/2).
- Impact on the doctor probe: running every registered check on a bare git directory throws nothing.

## Tool executors leave the standard (coordinator decision B)

A tool executor is a project's own choice. `gitnexus` and `herdr` (both `kind: tool`) and `impact-analysis`'s `prefer: gitnexus` are removed from `core/config-standard/runner.yaml`; the capability stays in the standard as a description-only entry (name, aliases) like `pane-labeling`. No other standard capability `prefer`s a tool executor (`rg` over the standard: only `impact-analysis` did). The schema is unchanged and still describes `kind: tool` entries. They are now three recorded differences in `packages/config/contracts/fixtures/repo-differences.v1.json` (`runner.executors.gitnexus`, `runner.executors.herdr`, `runner.capabilities.impact-analysis.prefer`, each with a reason).

- Proof of the AGENTS.md gate: new test `impact_analysis_resolves_to_gitnexus_here_and_to_no_provider_in_a_fresh_project` (authoring_equivalence.rs): standard plus this repository's differences resolves `impact-analysis` to the `gitnexus` tool executor (`for: [impact-analysis]`), a project with no files has no `kind: tool` executor and no `prefer` on it. `fgos tool query --capability impact-analysis` reads `runner.executors` through the same snapshot, so this repository keeps finding gitnexus once its file is migrated (the live run is phase 21's).
- `cargo test -p fgos-config` green. Counts in `golden_migrate.rs` moved with the differences: kept values 16 to 28, redundant dropped 256 to 244 (total conserved).
- `tool-registry-configured`: a fresh project reports `inactive` (pass); tests now cover inactive, full and degraded (declared tool, status overlay written directly). This replaces my earlier recommendation to accept `degraded 0/2`.
- Node: checks-doctor-config, registrations, checks, tool-registry, capability-plan-lint, seat-policy, capability-doctrine, skill-wrappers, terminal-skill-attach, dispatch, replay: only bin-lane CLI cases and `node-version-and-git` fail.

## Overlap with the bin lane (for the merge)

`seat-binding-checks.mjs` is a copy of their version; the `seat-binding-config` removals in `registrations.mjs` and `checks.test.mjs` are identical; `checks-setup-{config,idempotent,rc-line}.test.mjs` start from their versions plus my import-list edits (named imports I removed from the harness); the `checks-setup-rc-line` package-copy list is mine. Expected conflicts: the import blocks of those tests, `package.json#files`. `bin/fgos.mjs` must stop importing `ensureSharedConfigDefaults` and the `DEFAULT_CLEANUP_*` constants (their diff does). The Git one-door census was regenerated in both commits (`--write-census`); regenerate after the merge, never hand-merge. Two scan artefacts avoided: an identifier named `fix` returned from an arrow made the scanner flag `fixGit*` as escaping.

## Left for others

- Docs (phase 23): `docs/specs/distribution.md` row 7, CHANGELOG lines for the retired rows; I edited the test-enforced `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` (lists and the config-default prose).
- Phase 18: `DEFAULT_CAPABILITY_SLOTS` (three tests pin the doctrine table against it; the standard is the real source) and `IRON_LAW_LEVELS`/`DEFAULT_IRON_LAW_LEVEL` (`src/verbs/merge/iron-law-level.mjs` imports them from registrations, a layering oddity); `DEFAULT_RUNNER_CONFIG` stays exported from config.mjs for `test/runner/*`; comments naming `registerConfigDefault` remain in `src/config/shared-config-file.mjs` (deleted in 18) and `bin/fgos.mjs`.
- Files outside ownership row 14 that I touched: `package.json`, `src/runner/dispatch.mjs`, `src/runner/dispatch/config.mjs`, `src/setup/{model-pool-checks,executor-posture-coverage,executor-profile-warnings,seat-binding-checks,config-merge}.mjs`, `src/terminal-control/config.mjs` (comment), tests `capability-catalog-doctrine`, `confinement-doctor-checks`, `credential-copies-retained-check`, `seat-binding-dry-bind`, `terminal-control-checks`, `test/state/worker-slots`, `test/cli/fgos-setup`, the retired `doctor-coordination-checks`. Each moved because it imported a deleted symbol or tested a deleted row.
- The `runner loop code:implement has no prefer pool` branch of `workflow-capabilities-configured` is unreachable through config (the standard declares a pool, the schema refuses an empty one); kept, untested.

Status: DONE_WITH_CONCERNS
