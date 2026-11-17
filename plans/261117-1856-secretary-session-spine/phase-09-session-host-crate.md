# Phase 9: Session Host crate, route, client and the shared opening-text delivery

<!-- Updated: Validation Session 1 - delivery is reused from fgos-agent-protocol, not moved; internal route wired in main.rs -->

## Inputs (read first)
- `docs/platform/session-host/spec.md`, `packages/session-host/contracts/host-port.v1.json`, and the facts report
  `reports/facts-host-port.md` (cut lines) from phase 1.
- `packages/terminal-control/rust/src/{core.rs,port.rs,route.rs}` incl. `focus` from phase 5 and `launch_line` (core.rs:1258,
  shell-quotes each argument: never call raw `herdr pane run`).
- The shared delivery step already is one door: `fgos-agent-protocol` (`packages/agent-protocol/rust/src/terminal/mod.rs`:
  `adapter_for(cli)`, `Terminal::await_ready` l.435, `Terminal::deliver_brief` l.554) over the `AgentIo` port
  (`packages/agent-protocol/rust/src/port.rs:34`). `supervise/terminal.rs` only drives it (`drive` l.908, ready-wait l.929,
  delivery l.947) through `TermIo` (l.645-720), an `AgentIo` over Terminal Control's core that also ticks the supervisor's
  watch. The brief delivery rule: `src/runner/dispatch/herdr-round.mjs:316-327` (`inline` default; `file-pointer`).
- How an internal route is wired: `apps/fgos/src/main.rs:159-166` (`fgos internal terminal-control` calls
  `fgos_terminal_control::route::main`), and `src/terminal-control/client.mjs`.

## Files this phase may write
`packages/session-host/rust/**` (new crate `fgos-session-host`), `Cargo.toml` (workspace member), `Cargo.lock`,
`apps/fgos/Cargo.toml`, `apps/fgos/src/main.rs` (internal route `session-host`, beside `terminal-control`; if wiring
needs another `apps/fgos` file, stop and report `NEEDS_CONTEXT`), `src/session-host/client.mjs`, `test/session-host/client.test.mjs`,
`docs/architecture-manifest.json`. `supervise/terminal.rs` is not touched here (phase 11 owns it).

## Steps
1. Crate with the port trait and the request/answer types of the contract; adapter `terminal` over Terminal Control's
   core (start = allocate, optionally beside a given placement in the same group; launch; when `opening` is given,
   ready-wait and deliver it; alive = inspect; front = focus; retire = release close|retain). `opening` is optional: a
   worker attempt is started without it, because the run supervisor delivers the brief inside its own watched `drive`
   (phase 11); a head session passes it with the CLI id that selects the agent-protocol adapter and adapter `direct` (start a prepared command
   without a screen, alive by the process door, retire = SIGTERM then the existing grace rule; never SIGKILL first).
   A `start` of a head session on `direct` returns `unsupported` with the reason from the spec.
2. Opening delivery reuses the agent-protocol door, nothing is moved: the crate has one `PaneIo` (an `AgentIo` over
   Terminal Control's core by key: `send`, `screen`, `inspect`) and calls `adapter_for(cli)`, `await_ready` and
   `deliver_brief` on it, so a head session's opening text is typed exactly as a worker brief is (inline full text;
   `file-pointer` only when asked). Export `PaneIo` so phase 11 can make `TermIo` wrap it (adding the supervisor's
   tick and finish checks) instead of keeping its own copy of the core calls.
3. Internal route `fgos internal session-host` in `apps/fgos/src/main.rs` (one JSON line in, one out, like terminal-control), and the thin Node
   client `src/session-host/client.mjs` (`start`, `alive`, `front`, `retire`); add `src/session-host/` to the manifest.
4. Owning tests: crate tests with a fake terminal core (start/alive/front/retire, beside placement, head-on-direct
   refusal, opening delivered through agent-protocol as full text, no opening for a worker start); one client wiring proof in `test/session-host/client.test.mjs`.

Note: `docs/architecture-manifest.json` is also in the ready plan `261117-1524-windows-plain-path-fold`; your edit is one
appended layer entry, resolved by rebasing onto it if it lands first.

## Verify
- `cargo test -p fgos-session-host -p fgos-run-supervisor`; clippy `-D warnings` and aarch64-apple-darwin check for both.
- `node --test test/session-host/client.test.mjs test/architecture.test.mjs test/run-supervisor/terminal-groups.test.mjs`.
- `rg -n "fn deliver_brief|fn await_ready" packages` finds only `packages/agent-protocol` (no second delivery copy).

## Rollback
`git revert` the phase commit (new crate, route and client only).
