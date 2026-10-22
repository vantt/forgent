# Scout: herdr pane launch and brief delivery (p-a178ca5c)

Scouted 2026-10-22 10:40 by the COOK lead's Explore agent. Read-only.

## Launch path
- `packages/run-supervisor/rust/src/supervise/terminal.rs:222-248` `launch_spec()`: writes `<runDir>/launcher.sh` (0700, `exec <bwrap … gate>`), returns `LaunchSpec{command, cwd: runDir, expect}`; `:564-567` calls `core.launch`.
- `packages/terminal-control/rust/src/core.rs:393-424` `launch()`: publishes `launch-requested` marker (never retried; relaunch refused by design), then `driver.pane_run(pane, &line)`, then `identify_root()` (`:426`, matches expected argv; a garbled line ends `terminal-launch-not-started`).
- `core.rs:730-752` `launch_line()`: `cd '<cwd>' && [env K=V…] '<command>' 'args…'`, deliberately no `exec` (retained pane keeps its shell; `--die-with-parent` relies on the shell as parent). Asserted at `tests/core_failures.rs:62,90-92`.
- `driver/herdr.rs:506-509` `pane_run` = `herdr pane run <pane> <line>` (types into the interactive shell). `herdr.rs:458-474` `pane_split` already passes `--cwd` and `--env` at creation. Capabilities `driver/mod.rs:13-25`, `herdr.rs:381-388`. herdr has no "spawn pane with argv" option (`pane split`/`tab create` take only `--cwd`/`--env`).
- No prior mechanism for waiting for a ready shell or disabling shell update prompts (`git log -S` DISABLE_AUTO_UPDATE / oh-my-zsh / wait_for_ready: none). Old Node path (`ec9d41c23` removed `herdr-round.mjs`) also typed into a shell.

## Brief delivery
- `terminal.rs:671-679` `adapter.await_ready(&mut io, READY_MS=30s)` then `deliver_brief`; `terminal.rs:462-482` `TermIo::send` maps `ForegroundNotAgent` to cancel `terminal:foreground-not-agent`.
- `packages/agent-protocol/rust/src/terminal/mod.rs:300-350` `await_ready`: trusts detector idle only with `matched_rule || visible_idle`; unruled CLIs (agy, pi, omp) wait for screen change then stillness `PROMPT_SETTLE_MS`, after `UNRULED_READY_MS` (15s, `common.rs:16`) return `Unverified` and type anyway. `classify_blocked` (`:236`) knows only trust markers and login wording.
- `terminal/agy.rs`: `trust_markers: ["do you trust the contents of this project"]`, `enter_gap_ms: 300`, exit `/exit`. No banner/dismiss field in `Profile` (`mod.rs:~190`). Fixture `packages/agent-protocol/contracts/fixtures/terminal/agy/vectors.json:427` already notes a turn "refused by the start-up announcement banner" (2026-10-18), never handled.
- Spec: `docs/platform/agent-protocol/spec.md` §5.1 lines 85-97.

## Safety gate (do not touch)
`core.rs:465,473` (`send`), `core.rs:529` `foreground_of`, `port.rs:151`, `route.rs:203`, `packages/terminal-control/contracts/terminal-control.port.v1.json:58,103`, `terminal.rs:53,474-477`. Tests: `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs:149-166`, `packages/terminal-control/rust/tests/herdr_driver_fake.rs:390`.

## Tests to extend
- `packages/terminal-control/rust/tests/core_failures.rs` (launch line), `herdr_driver_fake.rs:89-118` (`each_capability_runs_the_expected_command`), fake herdr `tests/fixtures/herdr/fake-herdr.sh`.
- `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs:87` (full lifecycle), `:149` (foreground case); `tests/fixtures/fake-herdr-pane.py:144-158` fake `pane run` = `setsid script -qefc "<line>"` (no interactive shell; cannot reproduce a start prompt — needs a fixture shell that prints `Would you like to update? [Y/n]` and reads one key). Helpers `tests/support/{herdr,terminal,supervisor}.rs`.
- `packages/agent-protocol/rust/tests/terminal_vectors.rs` replays `packages/agent-protocol/contracts/fixtures/terminal/agy/` (add a banner vector).

## Specs
- `docs/platform/terminal-control/spec.md` §3 (51-52) launch types `cd <cwd> && <command>`, shell stays parent; `send` only while a non-shell holds foreground. §6 (75-79) capabilities.
- `docs/platform/run-supervisor/spec.md` §5.3 (137-146) terminal start sequence.

## Gates
AGENTS.md install/setup/doctor gate if a config key or env var is added (`src/setup/checks.mjs`); CHANGELOG `[Unreleased]` line (user-visible).
