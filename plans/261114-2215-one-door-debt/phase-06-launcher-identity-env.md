---
phase: 6
title: "Launcher identity environment comes from fgos-identity"
status: pending
effort: 1d
leak: "census rank 6"
startAfter: ["F0 wave A on main"]
landAfter: []
---

# Phase 06: Launcher identity environment from fgos-identity

Rules: `phase-lead-rules.md`. pNN = `p06`; report slug `odd-p06-launcher-identity-env`; crates `fgos-identity`, `fgos-node-addon`.
Facts: `phase-00-facts.md` "Leak 6".

## Outcome

Which session variables a launched agent loses and which writer variables it gets is decided once, in
`packages/identity/rust/src/launcher.rs` (today dead code). Node asks it through the addon; the Node copy
(`withIdentityEnv`) and the hand-spelled codex policy string derive from that one answer. The child env now matches the
contract (`packages/identity/contracts/attempt-writer-id.v1.json:20`): the four other session variables are scrubbed too.

## Requirements

1. `launcher.rs`: expose the decision as data the addon can return without an `std::env` mutation, for example
   `launcher_env(writer_id, parent) -> { set: [(name, value)], unset: [name] }`, and keep `scrub_and_set` as its one applier
   (or delete it if no Rust caller remains after this phase; its tests then test `launcher_env`). No new crate edge.
2. Addon `packages/git/node-addon/src/session_identity.rs`: one export (`launcherEnv`) in the existing namespace, the same
   pattern as `mintAttempt`. Facade `src/util/session-identity.mjs`: one export `launcherEnv(writerId, parent)`.
3. `src/run-supervisor/direct-launch.mjs:149-153` `withIdentityEnv` applies the facade's answer (delete `unset`, set `set`) and
   holds no variable names of its own. Callers (:222, `src/runner/dispatch/assignment-runner.mjs:1063`) unchanged.
4. `assignment-runner.mjs:421`: build codex's `shell_environment_policy.set` entries from the same answer's `set` list.
5. `src/setup/agent-hooks.mjs:484` (`startsWith('att-')` inside the generated pi/omp extension): leave the template, add one test
   that the template's prefix equals the prefix of `mintAttemptWriterId()` from the facade (the generated text cannot import the
   addon; the test keeps the twin honest). `src/setup/registrations.mjs:425` (harness detection) is not writer resolution: allowed with reason.
6. `doors` row (new, `kind: door`):
   `{ job: "writer and session id environment", patterns: ["FGOS_SESSION_ID", "FGOS_PARENT_WRITER_ID", "CODEX_THREAD_ID", "PI_SESSION_ID", "CLAUDE_CODE_SESSION_ID"], allowed: [...], retiredBy?: no, reason: "only fgos-identity resolves a writer and builds the launcher environment" }`.
   Allowed core: `packages/identity/rust/src/{launcher,resolve,session,directory}.rs` (as the check finds them),
   `src/util/session-identity.mjs`, `src/cli/command-registry.mjs` (help text) with reasons; mailbox heads
   (`packages/mailbox/rust/store/src/hook/resolve.rs` etc.) with reason "process-boundary read, then fgos-identity resolves";
   `src/setup/agent-hooks.mjs` (generated extension text, prefix pinned by test); `src/setup/registrations.mjs` (harness
   detection); `scripts/*` files that set or clear these for a test or bench run, each with a reason. A row allowing `.mjs` and
   `.rs` needs `retiredBy` only for a twin; these are a facade over a crate, not twins: if the check insists, split into a
   Node row and a Rust row rather than inventing a `retiredBy`. Nothing may remain in `direct-launch.mjs` or `assignment-runner.mjs`.

## Files

- Modify: `packages/identity/rust/src/launcher.rs` (+ `lib.rs` re-export if needed), `packages/identity/rust/tests/attempt_writer_id.rs`,
  `packages/git/node-addon/src/session_identity.rs`, `src/util/session-identity.mjs`, `src/run-supervisor/direct-launch.mjs`,
  `src/runner/dispatch/assignment-runner.mjs` (the policy hunk only), `docs/architecture-manifest.json` (row), `test/setup/agent-hooks.test.mjs`.
- Tests: owner of the scrub list stays `attempt_writer_id.rs` (moved to `launcher_env`); one Node wiring case in
  `test/run-supervisor/terminal-cutover.test.mjs` that the child env lacks `CLAUDE_CODE_SESSION_ID` and has `FGOS_SESSION_ID`
  (why new: the Node copy never scrubbed it, so no test could); `test/run-supervisor/contracts-terminal.test.mjs:87` unchanged.
- Net size: Node about -10, Rust about +20, tests +20.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-identity -p fgos-node-addon --all-targets -- -D warnings`; `cargo test -p fgos-identity`;
`cargo check -p fgos-identity -p fgos-node-addon --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/run-supervisor/terminal-cutover.test.mjs test/run-supervisor/direct-cutover.test.mjs test/run-supervisor/contracts-terminal.test.mjs test/runner/dispatch/worker-env-case-context.test.mjs test/session-identity/attempt-writer-id.test.mjs test/setup/agent-hooks.test.mjs test/setup/checks-doctor-config.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
plus `rg -l "withIdentityEnv|session-identity" test`.

## Risk and rollback

- An agent CLI that needs the parent's session variable loses it (L x M): the contract says it must not have it; the mailbox
  resolves `FGOS_SESSION_ID` first. Propose the `## [Unreleased]` line.
- Rollback: revert the phase.
