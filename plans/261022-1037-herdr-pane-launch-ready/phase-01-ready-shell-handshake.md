# Phase 1: Ready-shell handshake, fakes and contracts

Capability: `execute`. Depends on: none. Effort 5h. Plan: [plan.md](plan.md) (Design Decisions 1-5).

## Context

`Core::launch` (`packages/terminal-control/rust/src/core.rs:389-423`) publishes `launch-requested`, then types the launch line at once; a shell showing a start prompt (omz `read -r -k 1`) can eat the first key. The fake pane CLIs used by the supervisor and Node suites never show typed-line output on `pane read`, so the handshake needs the fakes changed in the same phase to keep the tree green.

## Requirements

<!-- Updated: Red Team 2026-10-22 -->
Core (`core.rs`, plain `pane.run` path only; the `activity` path is unchanged):
- Order: `need("pane.run")`, `need("read.screen")`, `need("process.info")` (before anything typed or recorded) -> if `store.has_marker(key, LaunchRequested)` return `NotStarted` with zero driver calls -> `wait_for_shell` -> foreground re-check -> `publish_marker` (false -> `NotStarted`) -> `pane_run(launch_line)` -> `identify_root`. `launch_line` unchanged (no `exec`).
- `wait_for_shell(pane, deadline = now + shell_ready_timeout_ms)` on the injectable clock (`self.now()`/`with_clock`):
  - each round `process_info`; type nothing unless `identity::is_bare_shell(info)`; a non-shell foreground keeps waiting until the deadline (`NotStarted("pane foreground is not the shell")`). `process_info` error: if `pane_liveness == Gone` return `Err(unknown("pane is gone"))` at once, else keep waiting.
  - probe `printf '%s%s\n' fgos-ok- <nonce>`, nonce = fresh random hex per probe (OS RNG; use an existing dependency or `/dev/urandom` read, no new crate unless already in `Cargo.toml`); the whole probe text contains no `y`/`Y`.
  - success = `read_screen(pane, Some(40), Some("recent-unwrapped"))` contains `fgos-ok-<nonce>` joined, for a nonce typed by this launch (scrollback of a reused pane cannot satisfy it; one `Vec` of nonces typed so far).
  - retype only when the previous probe was consumed without the token (its nonce visible in an echo, or a "not found" line) or after backoff = `shell_ready_timeout_ms / 3`; at most 3 probes in total; deadline -> `NotStarted("pane shell did not become ready in time")`, no marker written.
  - poll step 100 ms; all waiting through one helper so tests with a tiny timeout finish in milliseconds.
- `CoreConfig.shell_ready_timeout_ms` + `DEFAULT_SHELL_READY_TIMEOUT_MS = 10_000` (next to `DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS`); `route.rs:139-144` reads optional `shellReadyTimeoutMs`; `terminal_slot.rs:52-56` sets the default.
- Do not touch `send`, `foreground_of`, or the `foreground-not-agent` path.

Fakes (so every existing flow launches through the handshake):
- `packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py`: a `pane run` line that is a probe (starts with `printf '%s%s\n' fgos-ok-`) is executed with `sh -c`, its stdout appended to the screen `pane read` serves (after any scripted `screen`), and it does NOT write `script.pid`/`typescript.log`, does NOT bump `runs_started()` (`:66-69`: per-command `screen.run<N>.txt` indexes launch lines only), and does not change `pane process-info`. Launch lines run as today.
- `test/helpers/fake-herdr-pane.mjs` (`:143-157` run, `:216-223` read): same rule (probe does not overwrite `pane.pid`/`pane.runCommand`; its output is served on `pane read`). Check `test/helpers/herdr-pane-model.mjs` and `test/helpers/fake-herdr-session.mjs` and `test/run-supervisor/support/terminal-harness.mjs` for the same assumption; change only what the Node suites below need.
- `packages/run-supervisor/rust/tests/support/herdr.rs:84` and `packages/terminal-control/rust/tests/common/mod.rs:232`, `tests/herdr_driver_fake.rs:401`: add the new `CoreConfig` field.

## Files (write paths)

- `packages/terminal-control/rust/src/core.rs`, `packages/terminal-control/rust/src/route.rs`
- `packages/run-supervisor/rust/src/terminal_slot.rs`
- `packages/terminal-control/contracts/internal-route.terminal-control.v1.json` (config text, line 15)
- `packages/terminal-control/contracts/terminal-control.port.v1.json` (launch block `:37-56`: probe typed before the marker; `read.screen` and `process.info` needed; `not-started` reasons; marker published after the handshake)
- `packages/terminal-control/rust/tests/common/mod.rs`, `core_failures.rs`, `herdr_driver_fake.rs`
- `packages/run-supervisor/rust/tests/support/herdr.rs`, `packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py`
- `test/helpers/fake-herdr-pane.mjs` (and the sibling helpers only if the Node suites below need them)
- `docs/platform/terminal-control/spec.md`: §4 (line 59 "before the driver is asked to run anything" now reads: after the shell handshake, before the launch line) <!-- Updated: Validation 2026-10-22 -->, §3 launch bullet (handshake, foreground precondition, marker after handshake, residual risk: a line-mode `read` in the user's rc inside the shell takes one probe line as its answer, and Enter on a default-yes helper counts as yes; the proof is anti-accident, not anti-hostile-rc), §6 (plain launch needs `read.screen`, `process.info`), §11 table row "Supervisor dies / handshake times out before the launch line: no marker, plain allocated slot, adopt concludes `abandoned`, scan reports the bare shell after grace".

## Steps

1. Config field, default, route field, supervisor default, contracts.
2. `wait_for_shell` and the reordered `launch`.
3. MemDriver shell scripts (test support, no production switch): `Ready`; `PromptReadsFirstKey` (a line typed while the prompt waits loses its first char and shows no token; echo of the garbled line with the nonce visible); `TypedAheadSkipsPrompt` (omz `has_typed_input` branch: a line typed before the prompt draws runs intact); `LineModeRead` (consumes whole probe lines as answers, never prints a token); `NonShellForeground` (foreground is a child, e.g. `sudo`); a pane whose scrollback already holds an old `fgos-ok-<other>`.
4. Fakes as above.
5. `core_failures.rs`, plain-words titles (deadlines via tiny `shell_ready_timeout_ms`, e.g. 300 ms, or the injected clock; no real-time sleeps in assertions):
   - the launcher is typed only after the shell has run a probe (token seen first);
   - a shell whose start prompt eats the first key still gets an intact launch line (probe retyped on consumed-evidence);
   - a line typed before the start prompt draws is not swallowed and launches once;
   - a shell reading whole lines gets at most three probes and ends not-started;
   - a pane whose foreground is a child process gets nothing typed (`pane.run` delta 0) and ends not-started;
   - a shell that never becomes ready ends not-started with no launch-requested marker, can be launched again, and `reconcile_scan` after the grace reports the plain bare-shell slot;
   - a launch refused because a launch was already requested types nothing (`pane.run` count equal before and after) and keeps the existing `Unknown` scan finding for `launch-requested` without `launched` (`core_failures.rs:~66-69`);
   - every probe differs from the previous one, contains no `y`/`Y`, and an old token in scrollback does not satisfy the wait;
   - a vanished pane ends the handshake at once with `unknown`;
   - the two existing assertions that count `pane.run == 1` (`:62`, `:90-92`) become: launch line is the last `pane.run`, and exact equality of the count before/after the refused second launch.
6. Spec and contract edits.
7. Live smoke (evidence, recorded in the phase result): if `herdr` is running, allocate a real pane, launch `sleep 30` through the core, `herdr pane read --source recent-unwrapped --lines 40` shows the joined token then the launch. Required evidence before phase 2 when herdr is available; if not, record "not run".

## Verify (mechanical)

- `cargo test -p fgos-terminal-control --test core_failures` then `cargo test -p fgos-terminal-control`
- `cargo test -p fgos-run-supervisor` (all targets, includes `supervise_terminal_fake_herdr`)
- `node scripts/run-tests.mjs test/run-supervisor/terminal-crash-matrix.test.mjs test/run-supervisor/terminal-cutover.test.mjs test/run-supervisor/terminal-fallback.test.mjs test/run-supervisor/terminal-groups.test.mjs test/run-supervisor/crash-matrix-adopt-resume.test.mjs test/run-supervisor/contracts-terminal.test.mjs test/plugins/terminal-skill-attach.test.mjs` (if the runner takes patterns differently, use `node --test` with the same files)
- `cargo test --workspace --no-run`
- `rg -n shellReadyTimeoutMs packages docs` lists only route, supervisor default, contracts, tests, spec (no user config surface).

## Risks and rollback

Token not observed on a real herdr (mitigated by evidence-gated retype, smoke); probe into a non-shell foreground (precondition + test); line-mode prompt (cap 3, spec). Revert the commit: restores direct typing, old marker order, old fakes. Failure mode named: slot is relaunchable after a handshake timeout (no marker), so no burned slot.
