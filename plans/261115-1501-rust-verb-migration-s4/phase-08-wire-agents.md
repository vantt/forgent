---
phase: 8
title: "`wire-agents` native"
status: pending
effort: 1.5d
wave: B
blockedBy: [0, 1, 2]
q3: "answered (a)"
---

# Phase 08: `wire-agents` native

The opt-in verb that alone may change a person's own agent config (RUL111, `spec.md:803`) moves to the host over
`agent_config.rs` (01). No Node process; same plan, same backups, same output.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p08`. Report slug `s4-p08-wire-agents`.

## Context

- Registry `src/cli/command-registry.mjs:2365-2382` (`--yes`, `--json`; `store: 'none'`, `touchesState: false`,
  `externalEffect: true`); arm `bin/fgos.mjs:3531-3534` (`wireAgentsUseCase`, `src/setup/agent-wiring.mjs`); text
  renderer imported at `bin/fgos.mjs:3917` (skipped with `--json`); exit 1 when `failed` is non-empty
  (`src/cli/verb-exit.mjs:10`). It calls `mainCheckoutRootOf({})`, so `--dir` is ignored: kept (parity).
- Behaviour (F13): acts only on agents present, prints every file, backs each up as `<file>.pre-wire-agents-<time>`
  before writing, runs `claude plugin marketplace add vantt/forgent` and `claude plugin install fgOS@fgos-plugins`,
  never writes a permission that widens what an agent may do (`crossSessionInbound`, agy `toolPermission` are shown,
  never written), a failed backup stops that change, a failed `claude` step goes to `failed[]`.

## Requirements

1. `apps/fgos/src/wiring/wire_agents.rs`: plan and apply over `agent_config.rs`; backups through Durable File; the
   `claude` calls through the process door with the same argv and environment; the text render in the presenter;
   the D11 answer type for exit 1 on `failed`.
2. Host wiring per the recipe (operation `wire-agents.run`, no sub-command, `native: true`).
3. Parity `wire-agents.cases.mjs` (fake HOME per entry, `fs-delta` of HOME, a fake `claude` on PATH that logs its
   argv): plan only; `--yes` with Claude present and absent; agy present; a backup that cannot be written; a failing
   `claude`; `--json`; `--dir` ignored; an unknown flag; `--yes=1`.
4. Delete: the arm, the renderer, `wireAgentsUseCase` (the file goes in 07 with its last doctor row),
   `EXIT_OF['wire-agents']`, the Node tests whose behaviour moved; `test/setup/agent-wiring.test.mjs:132` (init,
   doctor --fix and setup leave HOME alone) keeps its `init` and `doctor --fix` halves on the host (setup half goes in 11).
5. `doors`: "person's agent config writes" allows `wire_agents.rs`; the `agent-wiring.mjs` debt entry stays until 07.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| plan, backups, no widening, absent agents, failing claude step | `test/setup/agent-wiring.test.mjs:142-268` | `agent_config.rs` and `wire_agents.rs` tests |
| exit 1 on failed | `test/cli/verb-exit.test.mjs:13` | `wire_agents.rs` test through the answer type |
| HOME untouched by init and doctor --fix | `agent-wiring.test.mjs:130-134` | the same case in the same file, `init` and `doctor --fix` only (the CLI harness now drives the host; 11 drops `setup` from its list) |
| `claude.cmd` on Windows | none (Node's `shell: WINDOWS`) | `agent_config.rs` msvc unit case (01) |

## Files

- Create: `apps/fgos/src/wiring/wire_agents.rs`, `test/rust-host/parity-cases/wire-agents.cases.mjs` (deleted by 12).
- Modify: host files per the recipe, `bin/fgos.mjs`, `src/setup/agent-wiring.mjs` (use case out), `src/cli/verb-exit.mjs`,
  `src/cli/command-registry.mjs`, tests, baseline, manifest, census.

## Gates

- fmt; clippy `-D warnings` on `fgos`, `fgos-distribution`; `cargo test -p fgos`; msvc and darwin.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/setup/agent-wiring.test.mjs test/cli/verb-exit.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/cli/unknown-flag-rejection.test.mjs test/architecture.test.mjs`.

## Risk and rollback

- A write that widens a permission slips in (L x H): the RUL111 `doors` row and a vector asserting nothing widens.
- Rollback: revert the phase; the Node arm returns; files it wrote are the same files Node would write.
