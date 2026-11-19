# Phase 09: provider accounts and capacity

Wave 3. Depends on: 3. Effort 2d. Library only (engine module `accounts`).

## Context

`src/runner/dispatch/`: `provider-capacity.mjs` (1 040: lease, release, quarantine, `providerAccountInventory`,
`credentialStoreOf`, `inspectProviderCapacity`), `llm-accounts.mjs` (286: `readLlmAccounts`, `deriveLegacyInventory`,
`legacyStateKey`, `defaultLoginHomeStores` `:231` (added by `aafe1b601`, account lease plan), `machineLoginStores`
`:257`), `provider-account-probe.mjs` (406), `provider-credential-probe.mjs` (182), `provider-session-probe.mjs` (151),
and from `src/runner/execution/`: `account-rotation.mjs` (148), `account-pin.mjs` (52). `usage-parsers.mjs` is gone:
`725522d1e` moved token-usage parsing to `fgos-run-result` (`packages/run-result/rust/src/usage/`, fixtures under
`packages/run-result/rust/tests/fixtures/usage/`); this phase ports no usage parser. Already in Rust since S5 and reused,
never ported a second time: `fgos-execution::accounts` (`packages/execution/rust/src/accounts.rs`: `read_llm_accounts`
`:208`, `legacy_state_key` `:16`, `provider_account_inventory` `:429`, `account_view` `:535`; persona pool key of the
account lease plan, `31c0bf5a9`, `02ad6eaed`, `88dc6a190`) and `executor_model::credential_store_of`; door row "derive
executor facts" (`retiredBy: S6a`) lists `llm-accounts.mjs` and `provider-capacity.mjs` as Node twins of those.
S5 D4: account state is a port Seat Binding owns; its adapter is this module (account view read
outside the provider lock; the lease takes exactly the account the crate named; no host exec under that lock). The
`dispatch probe-account` and `probe-session` subs (phase 21) and rows `provider-capacity-state`, `llm-accounts-shape`,
`llm-accounts-default-login-home` (new, `bridge:S6a`, judge `defaultLoginHomeStores`), `model-policy-pools`,
`confined-pane-accounts`, `session-keep-declared` (phase 17) use it. Door row "global fgOS directory" lists
`llm-accounts.mjs` (`machineLoginStores`) as debt; door row "record a malformed call (twin)" names
`provider-capacity.mjs`'s capped append (`appendFaultRecord`, `:13`).

## Requirements

- `packages/execution/engine/src/accounts/` ports them; implements `fgos-execution`'s account-state port (S5 D4).
- Global directory through the F0 global-directory door (`fgos-config`), never a private path.
- Locks through `fgos-holder-lock`; same lock names and scopes as Node (lock registry unchanged).
- Golden vectors under `packages/execution/contracts/accounts/` recorded by
  `test/golden-recorders/accounts.recorder.mjs` (committed); probe outcome vectors from the probe modules (usage
  parsing is `fgos-run-result`'s, already proven there); the lease state file read accepts every generation in the
  phase 00 corpus.
- Account inventory, legacy state key, credential store and account view come from `fgos-execution::accounts` /
  `executor_model` (no second copy); the engine module adds only the effectful lease, quarantine, probes, rotation and
  pin.
- The `llm-accounts.mjs` debt of door row "global fgOS directory", its and `provider-capacity.mjs`'s debt entries of
  "derive executor facts", and the `provider-credential-probe.mjs` entry of "process control: signal a process or
  group" are dropped by phase 21, which deletes those files.

## Steps

Commit the recorder; record vectors; red `engine/tests/accounts.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test accounts`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: lease state file shape drifts and a Node lease and a Rust lease meet on one machine during rollout. Landing
precondition "nothing in flight" (plan.md); vectors include the state file bytes. Rollback: revert.
