# Phase 17: doctor rows, executor, accounts, run supervisor, terminal

Wave 5. Depends on: 5, 9, 10, 11, 13, 15. Effort 2.5d.

## Context

The other 21 `bridge:S6a` rows plus `seat-binding-route` (S5 D15). Executor and accounts (12):
`executor-family-unique`, `executor-skills-installed`, `tier-fallback`, `model-policy-pools`, `llm-accounts-shape`,
`agent-type-names-unique`, `provider-capacity-state`, `executor-profile-warnings`, `session-keep-declared`,
`confined-pane-accounts`, `operation-prompt-templates-valid`, `herdr-executor-kinds`. Run supervisor, trust, terminal
(9): `run-supervisor-route`, `runtime-socket-dir` (fix), `run-attempts-stuck`, `run-supervisor-config`,
`terminal-control`, `terminal-allocations`, `trust-store-readable`, `non-claude-trust-stores-readable`,
`agent-cli-project-trusted`. Node judges: `src/setup/{registrations,run-supervisor-checks,model-pool-checks,
executor-profile-warnings,session-keep-declared,agent-cli-trust,terminal-control-checks}.mjs` and the row parts of
`src/runner/agent-definitions.mjs`. Door rows closed by this move (phase 22 edits `doors`): "person's agent config
writes" (agent CLI trust rows), "agent definition tier directories" (`agent-type-names-unique`, Node listing deleted).

## Requirements

- Rust judges in `apps/fgos/src/wiring/doctor/{execution,run_supervisor,terminal}.rs` (extend S5's `execution.rs`)
  over `fgos-execution` (executor model), engine `accounts`, `credentials`, `transport`, `assignment` (prompt templates),
  `fgos-run-supervisor::controller` (runtime dir, trust store, config), `fgos-terminal-control`; registry rows to
  `inRust`.
- `agent-type-names-unique`: the host's agent listing (S5 `agents.rs` + `wiring/agents.rs`) judges it; the Node
  listing in `src/runner/agent-definitions.mjs` is deleted where its only caller was the row; other callers
  (`src/workflow/case-start.mjs`, `src/session-host/head-start.mjs`, `src/runner/agent-roster.mjs`,
  `scripts/project-agents.mjs`) keep the functions they use (phase 00 census decides; nothing they use is deleted).
- `seat-binding-route` (P11): if phase 00 shows a Node caller of `src/seat-binding/client.mjs` remaining after phase
  20, the row is judged in Rust by probing the route the client calls; else it is deleted with a "behaviour removed"
  note and phase 20 deletes the client.
- Delete the Node row modules and bodies; their tests retire to Rust owners; parity table grows to these rows.
- `src/setup/seat-binding-checks.mjs` and `blind-steps-proven-pools.mjs` import tier-5 modules: if they judge rows
  already in Rust after S5, their remaining imports switch here to the host route or are deleted with them (census).

## Steps

As phase 15: red Rust tests and parity rows, wire, flip registry, delete Node, retire tests.

## Validation

`cargo test -p fgos` (doctor); parity (integration only); `test/setup/*` tests touched; `rg -n '"bridge:S6a"'
packages/distribution/contracts/doctor-registry.v1.json` empty; lead-rules gates.

## Risk and rollback

Risk: `agent-cli-project-trusted` reads a person's agent config; it must stay read-only (RUL111, door row "person's
agent config writes"). Rust test asserts no write. Rollback: revert.
