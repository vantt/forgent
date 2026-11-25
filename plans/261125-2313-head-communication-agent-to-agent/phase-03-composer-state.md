# Phase 3: Composer state per CLI

A pure predicate that says whether a CLI's input box is empty, so the typed wake never merges with a person's
half-typed text (spec §15.8 "Empty-composer predicate", HC-D5). Capability: `code:implement`.

## Inputs

- `docs/platform/agent-mailbox/spec.md` §15.8 (rules 1 and 6, the predicate paragraph).
- `packages/agent-protocol/rust/src/port.rs` (`Inspection.prompt_text`), `src/terminal/mod.rs`
  (`draft_still_in_composer`, the per-CLI profiles), `src/terminal/{claude,codex,agy}.rs`.
- `packages/agent-protocol/rust/tests/terminal_vectors.rs` and `packages/agent-protocol/contracts/fixtures/terminal/`.

## Footprint

`packages/agent-protocol/rust/src/terminal/**`, `packages/agent-protocol/rust/tests/terminal_vectors.rs`,
`packages/agent-protocol/contracts/fixtures/terminal/**`.

## Steps

1. Add `composer_state(screen, inspection) -> Empty | NotEmpty | Unknown` to the CLI profile, named without any
   reference to the mailbox. Reuse the profile's prompt reading and `draft_still_in_composer`; do not add a second
   prompt parser.
2. Capture fixtures from the real Claude Code, Codex and agy panes in herdr: idle and empty, idle with a half-typed
   line, a dialog open, busy. Record the CLI version beside each fixture.
3. Anything the profile cannot read with confidence is `Unknown` (the caller falls back).
4. Extend `terminal_vectors.rs` with the cases; no new test file.

## Verify

`cargo test -p fgos-agent-protocol --test terminal_vectors`. Pass: every fixture gives the expected state for the
three CLIs, and a fixture whose version differs from the pinned one is reported, not silently matched.

## Rollback

Revert the phase commit; nothing calls the predicate until phase 5.
