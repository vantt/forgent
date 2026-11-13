---
phase: 2
title: "The receipt carries `providerSignal`"
status: pending
depends_on: [1]
parallel: "after P01; file-disjoint with P03, P06; touches only packages/run-supervisor/** and its spec"
branch: harden/acct-b-p02
---

# P02 - run-supervisor: `receipt.providerSignal`

**Authority:** the supervisor publishes what the protocol named; it never classifies.

## Context (verified)

- Direct: `direct_reason` (`packages/run-supervisor/rust/src/supervise.rs:159-189`) reads the stderr/stdout capture tails and returns only `classify(...).receipt_reason()`; `publish_receipt_with` (`:236-300`) writes `reason`. Adopt reaches the same function through `publish_receipt_as` (`:220-234`), so a synthesized receipt gets the signal too.
- Terminal: `TerminalEnd { carrier_lost, reason }` (`supervise.rs:211-216`). Reasons are set by `begin_stop` (`supervise/terminal.rs:510-519`) from (a) `provider_stop_reason` on a soft-deadline/idle stop (`:565-570`, `:582-590`) and (b) `end_early` (`:979-985`) after `detect_completed` (`:958`), the ready gate (`:934`) and delivery (`:942`).

## Requirements

1. `receipt.providerSignal` is present only when `reason` is `direct|terminal:blocked:usage-limit|provider-error|login` and P01's extractor found at least one field. Shape and bounds are P01's.
2. Direct: compute it from the same tails `direct_reason` read (one read).
3. Terminal: `TerminalEnd` gains `provider_signal: Option<Value>`; set it at the place the reason is set: `provider_stop_reason` returns `(reason, signal)` from the one screen it reads; `end_early` takes the signal, read once from the screen with `adapter.stop_signal` only for a `Blocked(Login|UsageLimit|ProviderError)` outcome. `begin_stop` keeps "first reason wins" for the signal too.
4. `receipt.v1.json` documents the optional field; `v` stays 1.

## Files

- Modify: `packages/run-supervisor/rust/src/supervise.rs`, `rust/src/supervise/terminal.rs`, `contracts/receipt.v1.json`, `rust/tests/supervise_lifecycle.rs`, `rust/tests/supervise_terminal_fake_herdr.rs`, `docs/platform/run-supervisor/spec.md` (receipt fields near `:192`; section 16 entry).
- Create / Delete: none.

## Owning proofs

- Direct wiring: extend `a_direct_agent_that_exits_on_a_provider_stop_names_it_in_the_receipt_unless_it_left_a_result` (`supervise_lifecycle.rs:107`): the `dapi` case prints the incident #7 last event (429) and asserts `reason = direct:blocked:usage-limit` and `providerSignal.status = 429`; the clean-exit and outbox-wins cases assert no `providerSignal`.
- Terminal wiring: extend the case asserting `receipts[0]["reason"] == "terminal:blocked:usage-limit"` (`supervise_terminal_fake_herdr.rs:561`) with its `providerSignal`.
- Classification cases stay P01's vectors (no copy here). Tests retired: none. Net size: about +40 Rust lines, +6 assertion lines.

## Steps

1. Red: extend the two tests. 2. Implement direct, then terminal. 3. Contract and spec text.

## Validation

`cargo build -p fgos-run-supervisor --examples && cargo test -p fgos-run-supervisor --test supervise_lifecycle --test supervise_terminal_fake_herdr`; `node scripts/run-tests.mjs test/run-supervisor/contracts.test.mjs test/run-supervisor/terminal-fallback.test.mjs`; clippy `-D warnings`; msvc + `aarch64-apple-darwin` `cargo check -p fgos-run-supervisor`.

## Risk / rollback

Risk: an extra screen read at `end_early` on a vanished pane - `io.screen()` failing yields no signal, never an error. Rollback: revert; Node ignores an absent field.
