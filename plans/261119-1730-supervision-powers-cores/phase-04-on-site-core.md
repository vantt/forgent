# Phase 4: Bounded recent read and pane typing in terminal control

## Inputs
`packages/terminal-control/contracts/terminal-control.port.v1.json`, `driver-capabilities.v1.json` (`read.screen`,
`send.text`, `send.keys`); `packages/terminal-control/rust/src/core.rs`, `src/driver/herdr.rs`, `tests/herdr_driver_fake.rs`;
decisions SP-D5 (read-only door), SP-D6 (typing for a stuck session only).

## Files it may write
`packages/terminal-control/rust/**`, `packages/terminal-control/contracts/**`.

## Steps
1. Read how the port exposes `read.screen` and `send.text` today. Where an operation is missing on the port itself, add
   `read_recent(target, lines)` (trailing `lines` lines, `lines` capped at a constant in the contract) and `type_text(target, text)`
   through the capabilities; do not reach herdr from outside the driver (principle 3).
2. A driver without the capability returns the existing capability refusal, never an empty read.
3. Tests with the fake herdr driver: the cap on `lines`, ordering, missing capability, text typed exactly once.

## Verify
`cargo test -p fgos-terminal-control` passes; clippy clean; contract JSON is valid (the package's contract test).

## Rollback
Revert the commit; no verb uses these yet.
