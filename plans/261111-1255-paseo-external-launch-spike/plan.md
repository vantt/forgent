---
status: in-progress
branch: spike/paseo-external
origin: plans/reports/research-261110-2318-paseo-agent-message-delivery.md
---

# Spike: launch mode `external` (paseo as the carrier)

## Outcome

An external agent host (paseo first) starts the agent CLI through `fgos exec <cli>`. With
`FGOS_ATTEMPT_DIR` set, the agent runs as an attempt of the run supervisor: the gate is its process
root, the supervisor holds the attempt lock, the deadlines and the receipt. The host keeps the agent's
stdio and speaks the CLI's protocol directly; fgOS never copies a byte (owner choice 1, 2026-11-11).

## Acceptance

1. `fgos exec codex --version` with no `FGOS_ATTEMPT_DIR` runs codex unchanged (paseo's probes).
2. An external attempt started by the harness, then `paseo run --provider fgos-codex --env FGOS_ATTEMPT_DIR=…`:
   the agent's parent chain is gate under `fgos exec`'s exec; `supervisor-binding.json` is published.
3. `paseo send --behavior steer` mid-command still lands (same behaviour as the stock provider).
4. Closing the paseo agent ends the attempt with `receipt.json` outcome `exited`, `captureDigests` null,
   `outboxPresent` per the outbox.
5. A second spawn with the same `FGOS_ATTEMPT_DIR` (paseo reopening the agent) is refused and runs nothing.
6. `cargo test -p fgos-run-supervisor` green.

## Names (owner-approved)

`fgos exec <cli>`; env `FGOS_ATTEMPT_DIR`; envelope mode `external`; paseo provider ids `fgos-<cli>`;
runner adapter `paseo-spawn` (not built in this spike); daemon loss reuses `carrier-lost`.

## Design

- Envelope: `mode: "external"`, `agentProtocol.mode: "external"`, `external: {socketPath, orphanSettleMs, helloLimitMs}`.
  `launch.command` is the absolute CLI path the controller resolved; the host's arguments replace `launch.args`.
  `launch.capture` stays in the shape but nothing is written to it.
- Gate (`fgos internal gate --go-socket <p> --agent-argv <json>`): GO over the socket with the lock fds, as in
  terminal mode; the agent inherits the gate's stdio (the host's pipes) and the host's environment, with the
  envelope env and the side-file env laid over it; own session; PDEATHSIG (the host is the carrier); the
  orphan branch treats the brief as delivered.
- Supervisor (`supervise/external.rs`): bind the socket, wait `helloLimitMs` for HELLO, take the gate's tuple
  from the peer credentials, bind, GO with the lock fds, watch cancel, soft deadline and gate exit. No idle
  timer and no output budget (no capture bytes to read).
- `fgos exec`: dispatched in `main.rs` before the route table, like `internal`; module `exec.rs` in the
  run-supervisor crate. Containment in the spike: `linux-pgroup` (no bwrap); bwrap through the confinement
  driver's terminal variant is the next step.

## Result (2026-11-11, paseo 0.15.4, Codex app-server, `linux-pgroup`)

Evidence: `live.sh` + `start-external-attempt.py` in this directory; attempt dirs under
`.fgos/runtime/tmp/paseo-run/state/` of the main checkout (scratch, not committed).

| # | Result |
|---|---|
| 1 | Met. Paseo probed `fgos-codex` through `fgos exec codex` without an attempt and listed it available |
| 2 | Met. `supervisor-binding.json` and `agent-binding.json` published; tree: `Paseo Daemon` → `fgos internal gate` (own session) → `codex app-server` (own session) |
| 3 | Met. Steer during `sleep 40` answered "BANANA — I'm still waiting…" at Codex's 30 s exec yield; the command was not killed |
| 4 | Met. `paseo agent archive` closed the pipes, codex exited 0: receipt `exited`, `captureDigests` null, `closed.json` with `steps: []`. (`paseo stop` only interrupts a turn and leaves the process.) |
| 5 | Met. A second `fgos exec` for the same attempt: `go-socket-refused`, exit 64, nothing ran |
| 6 | Met. `cargo test -p fgos-run-supervisor` green (existing suites plus 4 new `exec` unit tests) |
| extra | `cancel-requested.json` from fgOS: receipt `cancelled`, `stoppedBy: cancel`; paseo marks the agent `error` ("Codex app-server exited") |

Impact analysis: inactive (no provider present); callers checked with `rg`.

Feature gates (found and fixed): with `command: [fgos, exec, codex]` paseo listed only `Default Permissions,
Full Access` and started `codex app-server` without `--enable goals`. Cause: paseo gates Codex features by
version and probes `<command[0]> --version` without the rest of the prefix
(`resolveBinaryVersion(launchPrefix.command)`, `providers/diagnostic-utils.ts`), so it read fgOS's version.
Fix: the host binary started as `fgos-exec-<cli>` is `fgos exec <cli>`; paseo's command is a link
`fgos-exec-codex` to the host (`live.sh link`). After it: `fgos-exec-codex --version` prints `codex-cli 0.161.0`,
`fgos-codex` lists the same modes as `codex` (with `Auto-review`), codex starts with `--enable goals`, and an
archived agent still ends as receipt `exited`. Who creates the link (setup, a doctor row) belongs to the adapter.

## Result behind bwrap (2026-11-11, `linux-gate`)

`live.sh sandbox` writes the envelope with `containment: linux-gate` and the prefix the bwrap driver builds for
a terminal attempt (read-only root, private `/tmp`, own PID namespace with the gate as pid 1, workspace, outbox
and private home writable, the socket bound read-only under the masked runtime dir, `~/.fgos/private` and
`~/.config/herdr` masked, an empty `gate-exit.json` bound in). `live.sh probe` runs the agent. No Rust change.

| Check | Result |
|---|---|
| Bind | `supervisor-binding.json` domain `linux-gate`, guarantee `kernel`; agent pid 2 in its own namespace, gate pid 1 |
| Steer | "BANANA" during `sleep 40`; the command ran on and printed `step1` |
| Writes | inside the workspace: written; in the paseo state dir: `read-only file system` |
| Masks | `~/.fgos/private` reads empty; `/run/user/<uid>` holds only the attempt's socket |
| Close | archive: gate fills `gate-exit.json` in place, receipt `exited` |
| Cancel | `cancel-requested.json` during `sleep 40`: receipt `cancelled` within 1 s, `sleep` gone |

Two things the adapter must do, both found live:

1. **Path variables of the host's environment.** The gate keeps the host's environment under the envelope's. The
   paseo daemon's `TMPDIR` pointed into the read-only root, and every Codex shell command panicked on its sandbox
   lock there. The harness sets `TMPDIR=/tmp` in the envelope env; the adapter must override every host path
   variable that points outside the grants (at least `TMPDIR`, and `HOME`/`CODEX_HOME` to the private home).
2. **The CLI's own sandbox off.** Codex's sandbox is a second bwrap and cannot create a namespace inside fgOS's
   ("No permissions to create a new namespace"). fgOS's own confined Codex invocations already pass
   `-s danger-full-access`; through paseo that is the agent mode `full-access`, so the adapter starts the agent in
   that mode (or the provider pins it).

## Not in the spike

Runner adapter `paseo-spawn` in `bind()`, the settle and finalize-home steps (the harness writes `steps: []`),
spec and contract edits, doctor rows.
