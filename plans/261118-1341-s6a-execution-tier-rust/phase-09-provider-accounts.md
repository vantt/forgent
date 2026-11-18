# Phase 09: provider accounts and capacity

Wave 3. Depends on: 3. Effort 2d. Library only (engine module `accounts`).

## Context

`src/runner/dispatch/`: `provider-capacity.mjs` (1 040: lease, release, quarantine, `providerAccountInventory`,
`credentialStoreOf`, `inspectProviderCapacity`), `llm-accounts.mjs` (261: `readLlmAccounts`, `deriveLegacyInventory`,
`legacyStateKey`), `provider-account-probe.mjs` (406), `provider-credential-probe.mjs` (182),
`provider-session-probe.mjs` (151), `usage-parsers.mjs` (180), and from `src/runner/execution/`: `account-rotation.mjs`,
`account-pin.mjs`. S5 D4: account state is a port Seat Binding owns; its adapter is this module (account view read
outside the provider lock; the lease takes exactly the account the crate named; no host exec under that lock). The
`dispatch probe-account` and `probe-session` subs (phase 21) and rows `provider-capacity-state`, `llm-accounts-shape`,
`model-policy-pools`, `confined-pane-accounts`, `session-keep-declared` (phase 17) use it. Door row "global fgOS
directory" lists `llm-accounts.mjs` as debt.

## Requirements

- `packages/execution/engine/src/accounts/` ports them; implements `fgos-execution`'s account-state port (S5 D4).
- Global directory through the F0 global-directory door (`fgos-config`), never a private path.
- Locks through `fgos-holder-lock`; same lock names and scopes as Node (lock registry unchanged).
- Golden vectors under `packages/execution/contracts/accounts/` recorded by
  `test/golden-recorders/accounts.recorder.mjs` (committed); probe parsing vectors from the usage-parser fixtures; the
  lease state file read accepts every generation in the phase 00 corpus.
- The `llm-accounts.mjs` debt of door row "global fgOS directory" and the `provider-credential-probe.mjs` entry of
  "process control: signal a process or group" are dropped by phase 21, which deletes those files.

## Steps

Commit the recorder; record vectors; red `engine/tests/accounts.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test accounts`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: lease state file shape drifts and a Node lease and a Rust lease meet on one machine during rollout. Landing
precondition "nothing in flight" (plan.md); vectors include the state file bytes. Rollback: revert.
