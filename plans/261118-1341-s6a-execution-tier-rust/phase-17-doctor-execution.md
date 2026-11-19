# Phase 17: doctor rows, executor, accounts, run supervisor, terminal

Wave 6. Depends on: 5, 9, 10, 11, 13b, 15. Effort 2.5d. Cut-over phase: run the re-sync step of the phase-lead rules
first (`src/setup`, `src/runner/agent-definitions.mjs`).

## Context

The other 22 `bridge:S6a` rows plus `seat-binding-route` (S5 D15; owner `bridge:S6a` since S5 phase 11). Registry
on `f031ab0c8`: 32 rows with owner `bridge:S6a` = these 23 + phase 15's nine (the plan counted 30 + the route; the 31st
row `llm-accounts-default-login-home` landed in `aafe1b601`). Executor and accounts (13):
`executor-family-unique`, `executor-skills-installed`, `tier-fallback`, `model-policy-pools`, `llm-accounts-shape`,
`llm-accounts-default-login-home` (warn only, no fix), `agent-type-names-unique`, `provider-capacity-state`,
`executor-profile-warnings`, `session-keep-declared`, `confined-pane-accounts`, `operation-prompt-templates-valid`,
`herdr-executor-kinds`. Run supervisor, trust, terminal (9): `run-supervisor-route`, `runtime-socket-dir` (fix),
`run-attempts-stuck`, `run-supervisor-config`, `terminal-control`, `terminal-allocations`, `trust-store-readable`,
`non-claude-trust-stores-readable`, `agent-cli-project-trusted`. Node judges (re-read on `f031ab0c8`):
`src/setup/model-pool-checks.mjs:26,73,116,137,161`, `run-supervisor-checks.mjs:102,145,156,188,215`,
`terminal-control-checks.mjs:37,88`, `executor-profile-warnings.mjs:109`, `session-keep-declared.mjs:20`,
`agent-cli-trust.mjs:86`, and bodies inside `src/setup/registrations.mjs` (`checkAgentTypeNamesUnique` `:702`,
`checkLlmAccountsDefaultLoginHome` `:783` over `defaultLoginHomeStores` of `src/runner/dispatch/llm-accounts.mjs`,
`checkProviderCapacityState` `:1111`, `checkOperationPromptTemplatesValid` `:1252`, `checkTrustStoreWritable` `:1288`,
`checkTrustStoresReadable` `:1315`, `checkConfinedPaneAccounts` `:1359`, `checkHerdrExecutorKinds` `:1442`,
`checkSeatBindingRoute` `:2253`; registrations `:757-828`, `:1141-1165`, `:1268`, `:1490-1580`, `:2274`). The agent
listing the `agent-type-names-unique` row uses is `src/runner/agent-listing.mjs` (`listAgents`, `agentRenderWarnings`,
imported `registrations.mjs:36`) over `src/runner/agent-definitions.mjs` (`registrations.mjs:33`). Measured-count proofs:
`test/setup/registrations.test.mjs:1177-1185`, `apps/fgos/src/wiring/doctor/mod.rs:546-558`. Door rows edited by this
move, in the same change (V4): "derive executor facts" (`docs/architecture-manifest.json:1206-1208`: the
`src/runner/agent-listing.mjs` twin debt whose reason is this row's Node bridge), "agent definition tier directories"
(`:867`; its `src/runner/agent-definitions.mjs` allowed entry stays while other callers read the tiers), "the Node bind
facade has only its named callers" (its `src/setup/seat-binding-checks.mjs` reason still names `seat-binding-route`
and `bridge:S6a`; the route's body is in `registrations.mjs` and `seat-binding-dry-bind` is `bridge:S6b`: rewrite the
reason), the `files` map entries (`:1837-1848`) of every deleted row module, and any `allowed`/`debt` entry naming a
deleted row module. "person's agent config writes" (`:173`) has no Node reader debt left on `main` (its only debt is
`src/cli/command-registry.mjs`): nothing to edit here, phase 22 closes it.

## Requirements

- Rust judges in `apps/fgos/src/wiring/doctor/{execution,run_supervisor,terminal}.rs` (extend S5's `execution.rs`)
  over `fgos-execution` (executor model), engine `accounts`, `credentials`, `transport`, `contract` (prompt templates),
  `fgos-run-supervisor::controller` (runtime dir, trust store, config), `fgos-terminal-control`; registry rows to
  `inRust`.
- `agent-type-names-unique`: the host's agent listing (S5 `packages/execution/rust/src/agents.rs` +
  `apps/fgos/src/wiring/agents.rs`) judges it; the Node listing (`src/runner/agent-listing.mjs`, and the parts of
  `src/runner/agent-definitions.mjs` only the row used: `agentShapeProblem`, `findAgentDuplicates`) is deleted where its
  only caller was the row; other callers (`src/workflow/case-start.mjs:19`, `src/session-host/head-start.mjs:94,152`,
  `src/runner/agent-roster.mjs:13`, `scripts/project-agents.mjs:37`, and the tier-5 `run-request.mjs:12`,
  `unit-run-start.mjs:22`, `dispatch/assignment.mjs:48` until 20/21) keep the functions they use (phase 00 census
  decides; nothing they use is deleted).
- `seat-binding-route` (P11): if phase 00 shows a Node caller of `src/seat-binding/client.mjs` remaining after phase
  20, the row is judged in Rust by probing the route the client calls; else it is deleted with a "behaviour removed"
  note and phase 20 deletes the client.
- Delete the Node row modules and bodies; their tests retire to Rust owners; parity table grows to these rows.
- The Node listing in `agent-definitions.mjs` imports `RunnerConfigError` from `src/runner/dispatch/runner-config-error.mjs`
  (`:21`); if the file survives this phase, that import switches in phase 20 with the other config callers.
- `src/setup/seat-binding-checks.mjs` (`:3-7`) and `blind-steps-proven-pools.mjs` (`:13-14`) import tier-5 modules
  (`bind.mjs`, `dry-bind.mjs`, `capability-config.mjs`, `patterns/catalog.mjs`, `shipped-catalog.mjs`), but their rows
  (`seat-binding-dry-bind`, `blind-steps-use-proven-pools`) are `bridge:S6b` on `main`, not S6a: they stay Node and
  are not touched here; their imports switch in phase 20 with the other Workflow-layer callers.
- The measured-count proofs move by the 22 rows, `runtime-socket-dir`'s fix and `seat-binding-route` (moved or
  deleted per P11).

## Steps

As phase 15: re-sync, red Rust tests and parity rows, wire, flip registry, delete Node and edit doors, retire tests.
Row tests outside `test/setup/` that import or look up these rows: `test/seat-binding/route-doctor-check.test.mjs`
(`checkSeatBindingRoute`, `:11`), `test/runner/provider-pool-lease.test.mjs:264` (`llm-accounts-shape`),
`test/runner/operation-prompt-templates.test.mjs:689` (`operation-prompt-templates-valid`). `run_supervisor.rs` is a new
file beside the supervisor plan's `wiring/doctor/supervision.rs` (different rows; not edited here).

## Footprint

`apps/fgos/src/wiring/doctor/**`, `packages/distribution/contracts/doctor-registry.v1.json`, `src/setup/**`,
`src/runner/agent-definitions.mjs`, `src/runner/agent-listing.mjs`, `test/setup/**`,
`test/seat-binding/route-doctor-check.test.mjs`, `test/runner/provider-pool-lease.test.mjs`,
`test/runner/operation-prompt-templates.test.mjs`, `test/rust-host/parity-cases/**`, `docs/architecture-manifest.json`.

## Validation

`cargo test -p fgos` (doctor); parity (integration only); `test/setup/*` tests touched; `rg -n '"bridge:S6a"'
packages/distribution/contracts/doctor-registry.v1.json` empty; lead-rules gates.

## Risk and rollback

Risk: `agent-cli-project-trusted` reads a person's agent config; it must stay read-only (RUL111, door row "person's
agent config writes"). Rust test asserts no write. Rollback: revert.
