# Phase lead report: terminal mode P06, cutover of `herdr-spawn` to the supervisor

Status: see the done file. Branch `terminal-mode/p06-cutover`.

## What landed
- **One door.** `executeAssignment` runs a `herdr-spawn` seat the way it runs a `cli-spawn` one: attempt lock, prepare, envelope (`mode: terminal`, `slot`, `terminal.socketPath`, `identity`, `launch.briefPath`, steps `settle-attempt, finalize-home, cleanup-trust, release-slot`), `fgos internal supervise`, wait for the binding, then only read. `herdr-round.mjs` is now the herdr half of the controller: `prepareTerminalAttempt` (stale-result refusal, brief + typed-brief file, legacy confinement home/session, `allocate(key = attempt id, groupKey)`, trust seed + record) with `abandon()` for a controller that fails before the handover, and `followPaneScreen` (display only).
- **Deleted:** `pollForOutcome`, `settleRound`, `concludeFailure`, `killPaneForegroundAndClose`, the liveness probe, launcher script and its process checks, `startAgent`, the brief delivery/confirm/regex code, `groupDeadlines`, `driveRound`, `runHerdrRound`; `herdr-reconcile.mjs`, `liveness.mjs`, `herdr-diagnosis.mjs`; the legacy-command resume branch (now `legacy-run` refusal), the herdr liveness pre-check in admission (the adopt probe covers both modes), `visibility-session` reconcile of the herdr door, `createSlotIo`. `transport.mjs`: `herdr-spawn` stays registered but refuses direct execution (`herdr-spawn-supervised-only`); `FGOS_SESSION_ID: resolveWriterIdentity` removed from `cliSpawnAdapter`.
- **New step** `src/run-supervisor/steps/cleanup-trust.mjs` (+ manifest row, contract enum): removes the trust entry from `controller/trust-context.json`, written only when the controller wrote the entry.
- **Identity (carry-over):** envelope `identity` + `launch.env`/side file carry `FGOS_SESSION_ID=att-<attempt>` and `FGOS_PARENT_WRITER_ID` for **both** modes; codex gets `-c shell_environment_policy.set={FGOS_SESSION_ID="…"}`; confined and herdr launches get the id through the gate.
- **Settle (carry-over):** `settle-attempt.mjs` names `abandoned-before-brief`/`abandoned-not-started` as a failed attempt; a result the gate ended the agent after (`orphan-result`) is judged by the claim; terminal early stops carry the screen tail + repair text; the screen is read (best effort) into stdout/stderr evidence so quota/login wording still classifies as `provider-limit` (generic limit patterns ported from the deleted ladder), else `blocked`.
- `recovery-planner`: `result-<N>.json` counts as a worker result (no park for the herdr outbox name).
- **Defects found by the tests and fixed:**
  1. gate `env_clear` removed `TERM` and the pane's `HERDR_*`, and the controller's own `HERDR_SOCKET_PATH` would have reached a confined seat. Gate now keeps the pane's own `TERM*`/`HERDR_*` in terminal mode; the controller strips them from env and side file. Rust test added.
  2. terminal-control `place_measured` failed with `pane_not_found` when another process released a pane between the liveness check and the geometry read (the D3 race). A vanished pane is now skipped, an empty group opens a new tab. Rust tests (`core_rules.rs`) + Node race test (red first).
  3. `terminal.retainFailedPaneMs` (validated config key) stopped being honored when the round loop went away. It now travels as `envelope.terminal.retainFailedPaneMs` (absent = 24 h, null = until a person closes it); `release-slot` reads it.

## Tests (private `CARGO_TARGET_DIR`, `FGOS_HOST_BIN` = own build, `env -u CLAUDE_CODE_SESSION_ID …`)
- `test/run-supervisor/terminal-crash-matrix.test.mjs` (3, real host + python fake pane with a pty): controller SIGKILL after binding -> brief, `completed`, all four steps, `release(close)`; deadline after controller death -> `timeout`, pane retained, agent gone; supervisor SIGKILL after the brief -> gate orphan-result, adopt settles and closes.
- `terminal-cutover.test.mjs` (10): lifecycle, identity/scrub, codex argv, never-started attempt, limit screen -> `provider-limit`, trust prompt -> `blocked` with repair text, `invocations[]` shape, brief contract/claim path, **confined `fgos run` in a pane (bwrap, gate inside, socket bound, pid namespace)**.
- `terminal-groups.test.mjs` (13): shared tab, closed first pane, anchor/dead anchor, 4-seat release-vs-allocate race (4 rounds), delivery modes, contract in brief, reviewer verdict, trust cleanup (claude, agy, vouched entry kept), abandon, orphaned allocation.
- Rust: `gate_terminal_socket` 11, `terminal_slot` unit, `fgos-terminal-control` full (new `core_rules` tests). Full cargo result below.
- Old suites: deleted `herdr-launcher-env, herdr-prompt-ready, herdr-read-agent-state, herdr-reconciliation, herdr-round-reconcile, herdr-round-terminal-control, herdr-spawn-assignment-dispatch, dispatch-liveness`; rewritten `herdr-spawn-adapter`, `execution/run-herdr` (kept only what runUnit still decides); edited `i08b`, import-graph, enumerator guard, reaper-fence (three S2(8) tests that pinned the herdr bind-before-launch removed; P07 owns the rest of S2), `herdr-claude-invocations`, `contracts-terminal`.
- Architecture guard green. `rg` for the herdr-round names of criterion 6 is empty in `src`; the rest of that pattern (`bindOwnershipMarker`, …) is P07's and still in `confinement/*`, `bwrap.mjs`, `authority.mjs` (its `herdr-spawn` branch still writes a `herdr-launch-command.v1` record nobody reads: P07 deletes it).

## Decisions
1. Terminal attempts are always `supervised`; `herdr-spawn` direct execution is refused rather than kept as a second path.
2. Brief file: inline = `brief-1.md`; file-pointer = `brief-1.pointer.txt` holding the one line.
3. Default idle limit `DEFAULT_IDLE_TIMEOUT_MS` (5 min) is put in the terminal envelope when the config sets none (as the old round did).
4. Pane-managed variables are the gate's own; the controller strips `TERM*`/`HERDR_*` for terminal mode.
5. The two multi-pane `runUnit` fallback tests (limit -> next candidate in a new pane, chain of three) were not ported: they need a multi-pane fake with a pty and test `nextCandidate`, which is transport-independent. The classification they depend on (`provider-limit`) and the retained pane are tested. Flag if the owner wants them anyway.
6. Windows/macOS CI push not requested: this phase adds Node code, one unix-only gate branch (`#[cfg(unix)]` file) and a platform-neutral core change.

## Impact (GitNexus index is stale; grepped)
`runHerdrRound`/`driveRound`/`herdrSpawnAdapter`: callers only `executeAssignment`'s else-branch via `executeExecutorCli` and tests; HIGH in the sense that every herdr seat changed door, covered by the three suites above. `workerBaseEnv` untouched. `place_measured`: callers `allocate` only.

## Unresolved
- Another session ran a full-suite `node --test` concurrently (load ~20): earlier flakes of my timing-sensitive tests came from that plus two test-harness races (staging dir picked as the attempt dir; adopt while the gate still held the lock), both fixed.
- `authority.mjs` still sets `FGOS_SESSION_ID: writerId` in the dispatcher env (P07); the gate overrides it.
- Real-herdr proof with the five CLIs and T8 rerun is P09.
