---
phase: 6
title: "Launcher identity environment decided once, in fgos-identity"
status: pending
effort: 0.75d
leak: "census rank 6"
startAfter: ["F0 wave A on main"]
landAfter: []
---

# Phase 06: Launcher identity environment decided once

<!-- Red team 2026-11-14: recast. The child env is already allowlisted (adapters.mjs:108-128) and env_clear'ed by the gate
(gate/unix.rs:654-657); terminal-cutover.test.mjs:74 already proves CLAUDE_CODE_SESSION_ID does not reach the agent. This is a
one-door refactor with no behaviour change, not a security fix. -->

Rules: `phase-lead-rules.md`. pNN = `p06`; report slug `odd-p06-launcher-identity-env`; crates `fgos-identity`, `fgos-node-addon`.
Facts: `phase-00-facts.md` "Leak 6".

## Outcome

Which writer variables a launched agent gets, and which session variables it must not carry, is decided in one place,
`packages/identity/rust/src/launcher.rs` (today dead code). Node asks it through the addon; `withIdentityEnv` and the codex
policy string derive from that answer and hold no variable names. Behaviour does not change: the child env is still built from
the worker allowlist and cleared by the gate; this phase removes the second decision, it does not add protection.

## Requirements

1. `launcher.rs`: expose the decision as data, for example `launcher_env(writer_id, parent) -> { set: [(name, value)], unset: [name] }`;
   `scrub_and_set` becomes its applier, or is deleted with its tests moved to `launcher_env` if no Rust caller remains. No new crate edge.
2. Addon `packages/git/node-addon/src/session_identity.rs`: one export `launcherEnv`, same pattern as `mintAttempt`. Facade
   `src/util/session-identity.mjs`: one export `launcherEnv(writerId, parent)`.
3. `src/run-supervisor/direct-launch.mjs:149-153` `withIdentityEnv` applies the answer and names no variable. Callers (:222,
   `src/runner/dispatch/assignment-runner.mjs:1063`) unchanged.
4. `assignment-runner.mjs:421`: codex's `shell_environment_policy.set` entries come from the answer's `set`.
5. `src/setup/agent-hooks.mjs:484` (`startsWith('att-')` in the generated pi/omp extension, which cannot import the addon):
   leave it; one test in `test/setup/agent-hooks.test.mjs` that the template's prefix equals the prefix of `mintAttemptWriterId()`.
   `src/setup/registrations.mjs:425` detects a harness shell, not a writer: allowed with that reason.
6. `doors` row (new, `kind: door`): `{ job: "writer and session id environment", patterns: ["FGOS_SESSION_ID", "FGOS_PARENT_WRITER_ID", "CODEX_THREAD_ID", "PI_SESSION_ID", "CLAUDE_CODE_SESSION_ID"], allowed: [...], retiredBy: "S7: the Node facade and its Node readers retire with the Node payload", reason: "only fgos-identity resolves a writer and decides the launcher environment" }`.
   The check applies every row to every file and refuses a row that allows `.mjs` and `.rs` without `retiredBy`; a Node facade
   over a crate does retire with the Node payload, so the `retiredBy` is true, not a workaround. `allowed` exactly as the check
   finds it (expected about 21 files): the identity crate files, `src/util/session-identity.mjs`, `src/cli/command-registry.mjs`
   (help text), the mailbox heads (process-boundary read, then fgos-identity resolves), `src/runner/dispatch/adapters.mjs` and the
   worker allowlist readers if they name these variables (the allowlist decides what may pass, a different job: reason),
   `src/setup/agent-hooks.mjs` (generated extension, prefix pinned by test), `src/setup/registrations.mjs` (harness detection),
   and each `scripts/` file with its reason. `direct-launch.mjs` and `assignment-runner.mjs` must not match.

## Files

- Modify: `packages/identity/rust/src/launcher.rs` (+ `lib.rs` re-export if needed), `packages/identity/rust/tests/attempt_writer_id.rs`,
  `packages/git/node-addon/src/session_identity.rs`, `src/util/session-identity.mjs`, `src/run-supervisor/direct-launch.mjs`,
  `src/runner/dispatch/assignment-runner.mjs` (policy hunk only), `docs/architecture-manifest.json` (row), `test/setup/agent-hooks.test.mjs`.
- Tests: the scrub list stays owned by `attempt_writer_id.rs` (moved to `launcher_env`); the child-env behaviour stays owned by
  `test/run-supervisor/terminal-cutover.test.mjs:62,74` (no new copy); codex policy by `test/runner/dispatch/worker-env-case-context.test.mjs`.
- Net size: Node about -10, Rust about +15.
- No `## [Unreleased]` line (no user-visible change).

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-identity -p fgos-node-addon --all-targets -- -D warnings`; `cargo test -p fgos-identity`;
`cargo check -p fgos-identity -p fgos-node-addon --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/run-supervisor/terminal-cutover.test.mjs test/run-supervisor/direct-cutover.test.mjs test/run-supervisor/contracts-terminal.test.mjs test/runner/dispatch/worker-env-case-context.test.mjs test/session-identity/attempt-writer-id.test.mjs test/setup/agent-hooks.test.mjs test/setup/checks-doctor-config.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
plus `rg -l "withIdentityEnv|session-identity" test`.

## Risk and rollback

- Env drift between the crate's answer and today's Node set (L x M): the existing tests above must pass unchanged.
- Rollback: revert the phase (revert phase 12 first only if it later edits `session-identity.mjs`; it does not after the red-team rewrite).
