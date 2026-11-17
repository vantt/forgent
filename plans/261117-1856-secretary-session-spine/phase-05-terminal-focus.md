# Phase 5: Terminal Control focus operation

The host port's `front` on the pane host needs a focus operation; Terminal Control has none (every create passes
`--no-focus`, `driver/herdr.rs:640,696`). herdr has `herdr tab focus` and `herdr pane focus`.

## Inputs (read first)
- `docs/platform/session-host/spec.md` (phase 1: what `front` must do).
- `packages/terminal-control/rust/src/{route.rs (verbs 291-422),driver/mod.rs (trait 155-201),driver/herdr.rs,port.rs,core.rs}`;
  `packages/terminal-control/contracts/`; `src/terminal-control/client.mjs`; `docs/platform/terminal-control/spec.md`.
- Tests: `packages/terminal-control/rust/tests/`, `test/terminal-control/{client-route,contracts}.test.mjs`, `test/helpers/herdr-pane-model.mjs`.

## Files this phase may write
`packages/terminal-control/**`, `src/terminal-control/**`, `test/terminal-control/**`, `docs/platform/terminal-control/**`.

## Steps
1. Add driver method `focus(pane)` (herdr: focus the pane's tab, then the pane) with a capability flag; drivers without
   it answer `unsupported`. Windows declares none, like every pane operation.
2. Add route verb `focus {key}`: only a key the store holds; answer `focused | unsupported | unknown`. Never focus a pane
   the route did not allocate or attach.
3. Contract schema and the Node client method `focus({key})`.
4. One owning Rust test (route + fake driver) and one client wiring proof in `test/terminal-control/client-route.test.mjs`.
5. Spec: add `focus` to the verb list and one decision-history line.

## Verify
- `cargo test -p fgos-terminal-control`; clippy and the aarch64-apple-darwin check (plan "Leader rules").
- `node --test test/terminal-control/client-route.test.mjs test/terminal-control/contracts.test.mjs`.

## Rollback
`git revert` the phase commit.
