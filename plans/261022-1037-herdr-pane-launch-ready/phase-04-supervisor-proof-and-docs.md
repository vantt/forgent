# Phase 4: Supervisor wiring proof, spec, changelog

Capability: `execute`. Depends on: phases 1, 2, 3. Effort 2.5h. Plan: [plan.md](plan.md).

## Context

After phase 1 every fake-pane supervisor and Node flow already launches through the handshake (the fakes serve probe output by default), so the default path is wired and proven by the existing suites. This phase adds exactly one boundary proof that is not a copy of a core case: how the supervisor maps a handshake that never succeeds (`terminal.rs:564-577`, `not_started` at `:549-557`). The swallowed-key, typed-ahead, line-mode, non-shell-foreground and marker cases are owned by `core_failures.rs` (phase 1) and are not repeated here.

## Requirements

<!-- Updated: Red Team 2026-10-22 -->
- Fake pane CLI (`fake-herdr-pane.py`): a flag file (like `no-process` / `unreadable`) makes the pane shell never run commands (probe output never appears). Fixture code only; no production switch.
- One new test in `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs`, beside the lifecycle test (`:87`): with that flag, the attempt ends with the `terminal-launch-not-started` code in `start-refused.json`, the steps (`release-slot`) still run, no gate binding exists, and nothing was typed into the pane beyond probes (assert the fake's launch bookkeeping is absent). Title states the behaviour: a pane whose shell never becomes ready ends as not started and the steps still run.
- Existing foreground test (`:149-166`) and lifecycle test stay green and unchanged: the `foreground-not-agent` gate is untouched.
- Specs: `docs/platform/run-supervisor/spec.md` §5.3 step 2 (the launch first proves the pane's shell runs commands and holds the foreground, then records the launch request and types the launcher; panes start with `DISABLE_AUTO_UPDATE=true`; timing budget: handshake up to 10 s, then identify 5 s, then `HELLO_LIMIT` 15 s, all before the supervisor loop, heartbeat display-only) and step 5 (the adapter dismisses a known start banner before typing the brief). Cross-link terminal-control spec §3 and agent-protocol spec §5.1; do not copy their rules.
- `CHANGELOG.md` `[Unreleased]`: one line: a herdr pane run no longer dies when the user's shell shows a start prompt (oh-my-zsh update question) or agy shows its start banner; the launcher is typed only after the pane's shell has run a command and holds the foreground, panes start with `DISABLE_AUTO_UPDATE=true` (reaches the pane's process tree), and the banner is dismissed before the brief.
- Cleanup check (RUL104/L10): `rg -n "pane.run" packages/terminal-control/rust/tests` has no assertion assuming a single `pane.run` per launch; no leftover helper; the old marker-before-driver wording is gone from specs (`rg -n "before the driver is asked to run anything" docs packages`).

## Files (write paths)

- `packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py` (the flag only)
- `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs`
- `packages/run-supervisor/rust/tests/support/herdr.rs` (only for a helper to switch the flag on)
- `docs/platform/run-supervisor/spec.md`
- `CHANGELOG.md`

## Verify

- `cargo test -p fgos-run-supervisor --test supervise_terminal_fake_herdr`
- Full gates: `cargo test --workspace --no-fail-fast` and `npm test`
- `git diff --stat` shows no change to the gate files named in plan.md Non-goals

## Risks and rollback

The fake never-ready shell differs from a real one: it is a boundary mapping proof only; behaviour is owned by phase 1. Revert the commit: tests and docs only.
