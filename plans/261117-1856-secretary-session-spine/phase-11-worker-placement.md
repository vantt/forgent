# Phase 11: Worker attempts placed through the host port

Highest-risk phase: it changes how every worker attempt is placed. Rust and Node move together so no tree carries a
half-moved envelope.

## Inputs (read first)
- `reports/facts-host-port.md` (phase 1: every hit and the cut lines) and `docs/platform/session-host/spec.md`.
- Node: `src/run-supervisor/direct-launch.mjs` (`writeAttemptIntent` 178, `buildEnvelope` 204, `terminalSocketPath` 120),
  `src/runner/dispatch/herdr-round.mjs:400-520` (allocate/attach/release), `src/runner/dispatch/terminal-slot.mjs`,
  `src/runner/dispatch/cli.mjs:240-265`, `src/run-supervisor/steps/settle-attempt.mjs:60-100`,
  `src/runner/dispatch/assignment-runner.mjs` (77-87, 714, 896, 1016: callers, read only).
- Rust: `packages/run-supervisor/rust/src/{supervise.rs:289,569, gate.rs:201, supervise/terminal.rs, terminal_slot.rs, adopt.rs:511}`.
- `docs/platform/run-supervisor/spec.md` §5.3, §16. Memory rules in plan "Leader rules".

## Files this phase may write
`packages/run-supervisor/**`, `Cargo.lock`, `src/run-supervisor/**`, `test/run-supervisor/**`,
`src/runner/dispatch/herdr-round.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/terminal-slot.mjs`,
`test/runner/dispatch-terminal-slot.test.mjs`.
The run-supervisor spec is shared with the ready plan `261117-1553`: write the spec change (placement through the Session
Host, one decision-history line) into `reports/phase-11-worker-placement.md`; phase 18 applies it.
`assignment-runner.mjs` is read only: if it must change, stop and report `NEEDS_CONTEXT`.

## Steps
1. Envelope and intent carry a host placement (`host: terminal|direct`, `key`, `groupKey`) instead of `mode`; the Rust
   supervisor reads it and calls `fgos-session-host` for start, alive (carrier ping) and retire (`release-slot` step
   becomes the port's retire). Readers of old records (adopt, recover) accept the old `mode` field only where a record
   written before this change can still be on disk; say so in a comment and in the spec.
2. Node dispatch allocates and releases through `src/session-host/client.mjs`; `createRoundTerminalControl` remains only
   if a non-placement caller still needs a Terminal Control read (e.g. `settle-attempt` reading the screen); otherwise delete it.
3. Delete every placement path the facts report listed outside the port; `rg` must prove it (Verify).
4. Move tests with the behaviour: placement cases live in the session-host crate (phase 9); the supervisor and dispatch
   tests keep one wiring proof each and retire the cases the crate now owns (name the owning test in the commit body).
5. Spec text into the phase report (see above).

## Verify
- `cargo test -p fgos-run-supervisor -p fgos-session-host`; clippy and aarch64-apple-darwin check.
- `node --test test/run-supervisor/*.test.mjs test/runner/dispatch-terminal-slot.test.mjs test/runner/dispatch-runtime-inspect.test.mjs test/cli/run-verb.test.mjs`.
- `rg -n "allocateAsync|releaseAsync|mode: terminal|mode === 'terminal'|\"mode\"" src/runner src/run-supervisor packages/run-supervisor/rust/src`
  shows no placement outside the session-host client/crate (only the documented old-record reader).
- One live worker run in a pane (`npm run fgos:dev -- run "say ok" --json` on this machine with herdr) completes and closes its pane.

## Rollback
`git revert` the phase commit as a whole (Rust and Node together); regenerate the census.
