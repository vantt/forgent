---
phase: 1
title: "Agent wiring modules in Rust: hook table, agent-config readers and plan, launcher"
status: pending
effort: 3.5d
wave: A
blockedBy: []
q3: "(a) or (b)"
---

# Phase 01: Agent wiring modules

Builds the Rust owner of the packaging layer that touches agent CLIs, before any verb flips: the hook table for
five CLIs, the readers of the person's own agent config (and the `wire-agents` plan built from them), and the
project launcher. Nothing flips here; the doctor rows (07), `wire-agents` (08) and `uninstall` (09) switch to these
modules and delete the Node ones. The output bytes equal Node's, proved by vectors generated from the Node code.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p01`. Report slug `s4-p01-agent-wiring`.

## Context

- `src/setup/agent-hooks.mjs` (777 lines): one table that renders, checks and removes the hook entries of Claude Code
  (`.claude/settings.json`), Codex (`.codex/hooks.json`), agy (`.agents/hooks.json`) and the generated omp and pi
  extensions; the delete-guard prefilter (`deleteGuardPrefilter`, rendered as a `case` for Claude Code, as
  `/bin/sh -c` for Codex and agy, as a regular expression in the omp/pi extension; `spec.md:175, 807`); fill-only,
  "commands of the earlier form are recognised as ours and replaced in place" (`spec.md:807`); a malformed JSON file
  is skipped (`agent-hooks.mjs:35-37, 358, 404`). Users: `registrations.mjs` (import ending at 55; rows and fixes
  `dispatch-decide-hook-wired`, `codex-`, `agy-`, `omp-`, `pi-hook-wired` at 1131-1193),
  `claude-code-hooks.mjs` (`dispatch-decide-hook-wired`, `setup`), `uninstall-project.mjs:20` (`uninstallAgentHooks`),
  `scripts/lib/mailbox-live-confined.mjs:39`, tests `test/setup/agent-hooks.test.mjs`,
  `test/git/main-checkout-delete-guard.test.mjs:8`, `test/live/mailbox-*.live.mjs`. The generated pi/omp extension's
  attempt-id prefix is pinned to the identity crate's by a test (`doors` row "writer and session id environment").
- Agent-config readers: `src/setup/agent-wiring.mjs` (242; `checkClaudePluginMarketplace`, `wireAgentsUseCase`),
  `agy-permissions.mjs` (292), `mailbox-claude-accept.mjs` (50), `mailbox-limits.mjs` (59), used by doctor rows
  (`claude-plugin-marketplace`, `agy-permissions-configured`, `agy-sub-homes-configured`, `mailbox-claude-accept`) and
  by `wire-agents`. RUL111: only `wire-agents` writes a person's agent config; rows only report.
- Launcher: `src/setup/project-launcher.mjs` (223): the `fgos` launcher beside `fgctl` (`spec.md:41`, RUL17), row
  `project-fgos-launcher` and its fix (`registrations.mjs:1039, 1045`). `packages/distribution/rust/src/shim.rs`
  already writes the workspace shims.

## Requirements

1. `packages/distribution/rust/src/agent_hooks.rs`: render, check (wired / not wired / ours in an earlier form /
   foreign) and remove, per CLI, with Node's rules (fill-only; replace our earlier forms in place; skip and report a
   malformed file; keep a foreign entry and name it). Writes go through Durable File; the omp/pi extension text is
   produced byte-equal to Node's (the run supervisor's trust store hashes hook bytes, `src/run-supervisor/trust-store.mjs:498`).
   The extension's attempt-id prefix is data in `agent-hooks.v1.json`, read by the identity crate's existing test
   (no crate edge, D15). Config values (`mailbox.enabled` and the rest) are read through `fgos-config` (D15 edge).
2. `packages/distribution/contracts/agent-hooks.v1.json` with vectors per CLI (input file, after install, after
   uninstall, check verdict), generated once from the Node module and read by the Rust tests and by
   `test/setup/agent-hooks.test.mjs` until 07 deletes the Node module.
3. `packages/distribution/contracts/delete-guard-prefilter.v1.json` (D9): the keyword list as data. `agent-hooks.mjs`
   reads it now (its literal list deleted); `test/git/main-checkout-delete-guard.test.mjs` reads it (one list from this
   phase on). If S1 has moved the guard and its test first, edit S1's reader instead.
4. `packages/distribution/rust/src/agent_config.rs`: the readers behind the four agent-config rows (one `claude`
   invocation for its three plugin questions, as T9 P10 settled) and the `wire-agents` plan (`agents`, `absent`,
   `files`, `permissions` shown but never written), with Node's message texts (tests assert them: F13). `claude` is
   started through the process door (D15 edge); on Windows it resolves `claude.cmd` as Node's `shell: WINDOWS` does
   (`agent-wiring.mjs:30, 40, 69`), with an msvc unit case.
5. `packages/distribution/rust/src/launcher.rs`: the launcher writer and checker with Node's rules (a different `fgos`
   first on `PATH` is reported, never overwritten; Windows `fgos.cmd`; `project-launcher.mjs:37, 155-219`), next to
   `shim.rs` (share its helpers; no copy). The source-checkout test it makes uses the payload's
   `scripts/fgos-shell-integration.sh` path from `components.legacyNode.root` (D18).
6. The mailbox hook rows follow `mailbox.enabled`, whose contract names its reader `"setup"`
   (`packages/mailbox/contracts/limits.v1.json:34`, test `packages/mailbox/rust/core/tests/limits_contract.rs`): the
   reader becomes `agent_hooks.rs` and the contract's reader value and meaning text say so (no `setup`), in the same
   change; a MAIL-lane file (plan collision table).
7. F11: `scripts/lib/mailbox-live-confined.mjs` gets its hooks from the host (`fgos doctor --fix` in its scratch
   workspace, or the narrowest existing call F11 names); it never keeps a third copy of the table.
8. `doors` rows (debt names the Node files that 07, 08, 09 delete; the stale check then forces their removal):
   "agent hook table" (patterns match the hook file names whole and built in parts, and the extension marker;
   allowed `agent_hooks.rs`, the two contracts, and with reasons the readers that only read or hash hook files:
   `src/run-supervisor/trust-store.mjs:498`, `scripts/check-hook-registrations-guarded.mjs:26`,
   `scripts/record-mailbox-hook-fixtures.mjs:230`; `src/runner/dispatch/worker-home.mjs:145` writes a worker's own
   `settings.json`, not a project hook file: allowed with that reason; debt `src/setup/agent-hooks.mjs`,
   `src/setup/claude-code-hooks.mjs`), "person's agent config writes" (RUL111; patterns from F19; allowed
   `agent_config.rs` and, from 08, `apps/fgos/src/wiring/wire_agents.rs`; debt `src/setup/agent-wiring.mjs`,
   `agy-permissions.mjs`, `mailbox-claude-accept.mjs` with reasons). The launcher joins the existing row
   "installation shim and activation record location" (allowed `launcher.rs`; its `src/setup/project-launcher.mjs`
   entry leaves in 07) instead of a second row. The row "writer and session id environment" gains `agent_hooks.rs`
   (allowed, the same reason as the Node module). Each new row with a negative case.

## Files

- Create: `packages/distribution/rust/src/{agent_hooks.rs,agent_config.rs,launcher.rs}`, the two contracts.
- Modify: `packages/distribution/rust/src/lib.rs` (module lines), `src/setup/agent-hooks.mjs` (prefilter from data),
  `test/git/main-checkout-delete-guard.test.mjs`, `test/setup/agent-hooks.test.mjs` (reads the vectors),
  `scripts/lib/mailbox-live-confined.mjs` (F11), `packages/mailbox/contracts/limits.v1.json` and
  `packages/mailbox/rust/core/tests/limits_contract.rs` (the `mailbox.enabled` reader), `docs/architecture-manifest.json` (rows), census.
- Delete: none (Node modules go in 07, 08, 09).

## Tests

| Behaviour | Owner after this phase |
|---|---|
| hook render/check/remove per CLI, earlier forms, malformed files, foreign entries | `agent_hooks.rs` unit tests over `agent-hooks.v1.json` |
| prefilter list | the data file, read by `agent_hooks.rs` tests and the guard test |
| agent-config readers and the `wire-agents` plan | `agent_config.rs` tests (fake HOME, fake `claude` on PATH) |
| launcher writer and checker | `launcher.rs` tests |

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-distribution --all-targets -- -D warnings`; `cargo test -p fgos-distribution`;
  msvc and darwin `cargo check -p fgos-distribution`.
- `node scripts/run-tests.mjs test/setup/agent-hooks.test.mjs test/git/main-checkout-delete-guard.test.mjs test/setup/claude-code-hooks.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- Rust bytes differ from Node's (M x M): vectors generated from Node before any Rust code; a byte diff fails a test.
- Two tables live on the integration branch until 07 (certain, bounded): the vector file is the shared truth; nothing
  reaches `main` before 07 deletes the Node table.
- Rollback: revert the phase; no flip, no data change.
