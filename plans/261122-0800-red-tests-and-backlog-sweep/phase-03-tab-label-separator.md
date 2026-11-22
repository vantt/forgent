# Phase 3: The terminal skill test asserts the colon tab label

Capability: `code:implement`.

## Inputs

- 483193f2a "tab labels read role: subject with ': ' between their parts". It changed the separator in
  `packages/terminal-control/rust/src/port.rs`, its port contract and the Rust tests, but not the Node tests.
- `test/plugins/terminal-skill-attach.test.mjs` (about line 120: `'tsk-1lvx · fix terminal layout | fg.ssid:sess-ski'`).
- The same red in `test/run-supervisor/terminal-groups.test.mjs` (about lines 326-327) is handed to plan S6a, which
  owns `test/run-supervisor/**`. It is not edited here.
- `packages/terminal-control/contracts/terminal-control.port.v1.json` (read only), the label shape that landed.

## Footprint

`test/plugins/terminal-skill-attach.test.mjs`.

## Steps

1. Read the port contract for the exact landed label form, including whether the `| fg.ssid:` suffix still applies.
2. Replace each expected label with the landed form, keeping the full-string equality. Do not loosen it to a
   regex or a substring.

## Verify

`node scripts/run-tests.mjs test/plugins/terminal-skill-attach.test.mjs` passes, and no expected label in it uses
the `\u00b7` separator.

## Rollback

Revert the phase commit.
