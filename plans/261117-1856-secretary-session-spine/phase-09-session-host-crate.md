# Phase 9: Session Host crate, route, client and the shared opening-text delivery

## Inputs (read first)
- `docs/platform/session-host/spec.md`, `packages/session-host/contracts/host-port.v1.json`, and the facts report
  `reports/facts-host-port.md` (cut lines) from phase 1.
- `packages/terminal-control/rust/src/{core.rs,port.rs,route.rs}` incl. `focus` from phase 5 and `launch_line` (core.rs:1258,
  shell-quotes each argument: never call raw `herdr pane run`).
- `packages/run-supervisor/rust/src/supervise/terminal.rs` (ready-wait l.929 and the typed-brief step), the brief
  delivery rule in `src/runner/dispatch/herdr-round.mjs:316-327` (`inline` default types the full text; `file-pointer`).
- How an internal route is wired: `apps/fgos/src/routing.rs`, the `terminal-control` internal verb and `src/terminal-control/client.mjs`.

## Files this phase may write
`packages/session-host/rust/**` (new crate `fgos-session-host`), `Cargo.toml` (workspace member), `Cargo.lock`,
`apps/fgos/Cargo.toml`, `apps/fgos/src/routing.rs`, `apps/fgos/src/wiring/session_host.rs` (internal route `session-host`;
if wiring an internal route needs another `apps/fgos` file, stop and report `NEEDS_CONTEXT`), `src/session-host/client.mjs`, `test/session-host/client.test.mjs`,
`packages/run-supervisor/rust/src/supervise/terminal.rs` (only to call the moved delivery step), `docs/architecture-manifest.json`.

## Steps
1. Crate with the port trait and the request/answer types of the contract; adapter `terminal` over Terminal Control's
   core (start = allocate, optionally beside a given placement in the same group; launch; ready-wait; deliver opening
   text; alive = inspect; front = focus; retire = release close|retain) and adapter `direct` (start a prepared command
   without a screen, alive by the process door, retire = SIGTERM then the existing grace rule; never SIGKILL first).
   A `start` of a head session on `direct` returns `unsupported` with the reason from the spec.
2. Move the ready-wait + typed opening-text step from `supervise/terminal.rs` into the crate (`deliver_opening`), keep
   its behaviour byte for byte (inline full text typed into the composer; file-pointer only when asked), and make
   `supervise/terminal.rs` call it in the same commit. No second copy at any commit.
3. Internal route `fgos internal session-host` (one JSON line in, one out, like terminal-control), and the thin Node
   client `src/session-host/client.mjs` (`start`, `alive`, `front`, `retire`); add `src/session-host/` to the manifest.
4. Owning tests: crate tests with a fake terminal core (start/alive/front/retire, beside placement, head-on-direct
   refusal, delivery types full text); one client wiring proof in `test/session-host/client.test.mjs`.

Note: `docs/architecture-manifest.json` is also in the ready plan `261117-1524-windows-plain-path-fold`; your edit is one
appended layer entry, resolved by rebasing onto it if it lands first.

## Verify
- `cargo test -p fgos-session-host -p fgos-run-supervisor`; clippy `-D warnings` and aarch64-apple-darwin check for both.
- `node --test test/session-host/client.test.mjs test/architecture.test.mjs test/run-supervisor/terminal-groups.test.mjs`.

## Rollback
`git revert` the phase commit (the delivery step returns to `supervise/terminal.rs` with it).
