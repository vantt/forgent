# Phase 11: Worker attempts placed through the host port

<!-- Updated: Validation Session 1 - TermIo wraps the session-host PaneIo; createRoundTerminalControl keeps a non-placement caller; corrected line numbers -->
Highest-risk phase: it changes how every worker attempt is placed. Rust and Node move together so no tree carries a
half-moved envelope.

## Inputs (read first)
- `reports/facts-host-port.md` (phase 1: every hit and the cut lines) and `docs/platform/session-host/spec.md`.
- Node: `src/run-supervisor/direct-launch.mjs` (`writeAttemptIntent` 178, `buildEnvelope` 204, `terminalSocketPath` 120),
  `src/runner/dispatch/herdr-round.mjs:400-520` (allocate/attach/release), `src/runner/dispatch/terminal-slot.mjs`,
  `src/runner/dispatch/cli.mjs:240-265`, `src/run-supervisor/steps/settle-attempt.mjs:60-100`,
  `src/runner/dispatch/assignment-runner.mjs` (77-87, 714, 896, 1016: callers, read only).
- Rust: `packages/run-supervisor/rust/src/{supervise.rs:289,568, gate.rs:199, supervise/terminal.rs, terminal_slot.rs, adopt.rs:462,511}`
  (`adopt.rs:462` reads `intent["mode"]`, `:511` writes `"mode": "direct"` into an adopted envelope).
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
2. Node dispatch allocates and releases through `src/session-host/client.mjs`. `createRoundTerminalControl` stays: it has a
   non-placement caller outside this footprint, `src/runner/dispatch/worker-session-boot.mjs:128` (pings the worker herdr
   server), plus the screen read in `settle-attempt`; only its placement uses (`herdr-round.mjs:431,448`, `cli.mjs:252-257`)
   move to the client.
2b. `supervise/terminal.rs`: the brief is still delivered inside `drive` (it must tick the supervisor's watch), through the
   agent-protocol door as today; `TermIo` wraps the session-host `PaneIo` (phase 9) for its core calls and adds only the
   supervisor's checks, so the crate and the supervisor do not each hold a copy of the pane I/O.
3. Delete every placement path the facts report listed outside the port; `rg` must prove it (Verify).
4. Move tests with the behaviour: placement cases live in the session-host crate (phase 9); the supervisor and dispatch
   tests keep one wiring proof each and retire the cases the crate now owns (name the owning test in the commit body).
5. Seat preparation door for head sessions (validation session 1): the binding becomes a pane command, env, account
   home and folder trust inside `prepareTerminalAttempt` (`herdr-round.mjs:354`, trust `:222,334`, confinement `:130`).
   Export one function from `herdr-round.mjs` that turns a binding into `{command, args, env, trust}` for an interactive
   seat; `prepareTerminalAttempt` calls it with its signature unchanged (so `assignment-runner.mjs:977` stays read only).
   Phase 12 calls the same function. If the step cannot be cut without editing `assignment-runner.mjs`, stop and report
   `NEEDS_CONTEXT`. One owning test beside the existing `herdr-round` tests.
6. Spec text into the phase report (see above).

## Verify
- `cargo test -p fgos-run-supervisor -p fgos-session-host`; clippy and aarch64-apple-darwin check.
- `node --test test/run-supervisor/*.test.mjs test/runner/dispatch-terminal-slot.test.mjs test/runner/dispatch-runtime-inspect.test.mjs test/cli/run-verb.test.mjs`.
- `rg -n "\.allocateAsync\(|\.releaseAsync\(|\.allocate\(|\.release\(\{" src/runner src/run-supervisor` and
  `rg -n "Core::launch|\.allocate\(|\.launch\(" packages/run-supervisor/rust/src` show no placement call outside the
  session-host client/crate; the allowed old-record `mode` readers are listed by file:line in the commit body. Read-only
  Terminal Control users that stay: `worker-session-boot.mjs`, `settle-attempt.mjs`, `src/verbs/dispatch/inspect.mjs`,
  `src/setup/terminal-control-checks.mjs`, `src/setup/registrations.mjs`.
- One live worker run in a pane (`npm run fgos:dev -- run "say ok" --json` on this machine with herdr) completes and closes its pane.

## Rollback
`git revert` the phase commit as a whole (Rust and Node together); regenerate the census.
