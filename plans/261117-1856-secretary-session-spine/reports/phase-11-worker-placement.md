# Phase 11: worker attempts placed through the host port (report and spec text for phase 18)

Status: DONE_WITH_CONCERNS. The envelope and intent carry `host`, release-slot is the port's `retire`, the supervisor's pane I/O
wraps the crate's `PaneIo`, Node gives panes back through the Session Host client, and one seat-preparation door is exported.
Two cuts the plan asks for are **not** possible inside this footprint; they are named under "Not done" with the exact reason.

## What changed

| Area | Change |
|---|---|
| Envelope v3 / attempt intent | `mode` is replaced by `host: terminal \| direct`. Together with `slot.key` and `slot.groupKey` that is the placement. `agentProtocol.mode` is dropped (it only repeated `mode`; no reader). Contracts `envelope.v3.json`, `attempt-intent.v1.json` and the digest vectors follow. |
| Rust readers | One reader, `envelope::host_of`, used by `supervise.rs`, `gate.rs`, `adopt.rs` (intent). Adopt writes `"host": "direct"` into the adopt-not-started envelope. |
| Rust release | `terminal_slot::release` calls `SessionHost::retire` (terminal placement). `SlotPanes` is the crate's `Panes` over the supervisor's core and adds only the retain window (`until`) the crate's own wrapper cannot carry. The failure kinds adopt branches on (`Retry`, `NoRecord`, `Unsupported`) are derived from the port's refusal. |
| Rust pane I/O | `TermIo` holds a `PaneIo` for `send`, `screen` and `inspect`, and adds only the supervisor's watch (tick, finished, `note_screen`, foreground-not-agent stop). The inspect mapping copy is gone. |
| Node | `herdr-round.mjs`: `createPaneHost`, `retirePane`, `closeLivePane` (not in `terminal-slot.mjs`: read-only inspection imports that module and the host client spawns a process). `abandon` and `cli.mjs` `closePane` give panes back through them. `prepareSeat` (exported from `herdr-round.mjs`) is the seat door; `prepareTerminalAttempt` calls it, signature unchanged, `assignment-runner.mjs` untouched. |

## Old-record readers of `mode` (file:line, to list in the commit body)

- `packages/run-supervisor/rust/src/envelope.rs` `host_of`: the only Rust reader of `mode`; callers `supervise.rs` (two sites), `gate.rs` (envelope), `adopt.rs` (intent).
- `src/run-supervisor/steps/settle-attempt.mjs` `paneScreenOf` and the `adapter` label: `envelope.host ?? envelope.mode`.

Both exist because an attempt whose envelope or intent was written before this change can still be on disk when adopt, recover or settle reads it after the upgrade. Nothing writes `mode` any more.

## Not done, and why

1. **Allocation is still Node's `allocateAsync`, and the gate launch is still the supervisor's `Core::launch`.**
   The port's `start` is allocate plus launch of one command. For a worker the command is the gate, which the supervisor builds after the
   controller has allocated, and the supervisor needs the launch's `ProcessIdentity` (the gate's root) before it may send `GO`.
   `start` answers a `Placement` only, and the Node client has no per-group serialisation queue (`allocateAsync` keeps one so two rounds
   of a batch do not both open the batch's tab). Closing the cut needs a crate change in `packages/session-host/**` (outside this
   phase's write scope): a launch-into-an-allocated-slot call that returns the identity, and group serialisation in the Node client.
   Until then the verify `rg` for `.allocateAsync(` and `Core::launch` still shows those two sites.
2. **`retire` from Node is no longer queued behind allocates of the same group.** `releaseAsync(close)` waited behind earlier
   allocate/close calls of its group; `retirePane` is a synchronous port call. The route serialises on the store, but a close racing a
   sibling allocate of the same batch has lost that Node-side ordering. Decide with the owner whether the client should carry the queue.
3. **Test placement.** `herdr-private-home-trust.test.mjs` is outside the write scope, so the seat-door test is `test/run-supervisor/prepare-seat.test.mjs` and the retire test is `test/run-supervisor/pane-host.test.mjs` (the plan listed `dispatch-terminal-slot.test.mjs`, but the retire helpers are in `herdr-round.mjs`, not `terminal-slot.mjs`).
4. **Live proof not run** (`npm run fgos:dev -- run "say ok" --json` in a pane): this round had no herdr session.

## Spec text for `docs/platform/run-supervisor/spec.md` (phase 18 applies it; shared with plan 261117-1553)

Section 5.3 (envelope): replace the `mode` field by `host` (`terminal` or `direct`). "`host` says where the Session Host places the
attempt; with `slot.key` (the attempt id) and `slot.groupKey` it is the attempt's placement. A record written before placement went
through the Session Host names the same fact `mode`; readers (adopt, recover, settle) accept it where `host` is absent, writers never emit it."

Section 16 (release): "The `release-slot` step is the Session Host's `retire` for the attempt's terminal placement, `close` for a
recognised end with captured output, `retain` otherwise (with the configured retain window). A refusal that is `unsupported` fails the
step; an `unknown` refusal leaves it without a receipt so adopt retries, except that no record of the key anywhere is `noRecord`
(read as released only for an adopt-not-started envelope)."

Decision-history line: "Worker attempts are placed through the Session Host port: the envelope carries `host` in place of `mode`,
release is the port's `retire`, and the supervisor's pane I/O is the crate's `PaneIo` plus the supervisor's watch. Allocation and the gate
launch stay with the controller and the supervisor until the port can launch into an allocated slot and return its identity."

## Verification

- `cargo test -p fgos-run-supervisor -p fgos-session-host`: all green (includes the re-signed envelope digest vectors, the release-slot step and the fake-herdr terminal supervise tests, which still carry `mode` in some fixtures: that is the old-record reader). `host_of` has one unit test.
- `cargo clippy ... --all-targets` clean; `cargo fmt --check` clean; `cargo check --target aarch64-apple-darwin` for both crates passes.
- Node (with the staged addon from `scripts/lib/git-addon-stage.mjs`): `test/run-supervisor/*.test.mjs`, `dispatch-terminal-slot`, `dispatch-runtime-inspect`, `architecture`: pass except tests that need a writable machine state, git worktree or `/var/tmp` in this sandbox (`attempt-steps` two pane-seat quarantine cases: `EROFS ... provider-state.lock`; `run-verb`: `EROFS /var/tmp`; three trust cases and one `attention` case that read a linked worktree). None of them touches code changed here; a baseline comparison was not possible (`.git` is read-only in this round).
- The first design put the retire helpers in `terminal-slot.mjs`; `dispatch-runtime-inspect` caught that this pulled `child_process` into the read-only inspect import graph, so they moved to `herdr-round.mjs`.
- `rg` for placement calls: `src/runner/dispatch/herdr-round.mjs:520 tc.allocateAsync` and `packages/run-supervisor/rust/src/supervise/terminal.rs:726 core.launch` remain (see "Not done" 1); nothing else places or releases a pane in `src/runner` or `src/run-supervisor`. Read-only Terminal Control users that stay: `worker-session-boot.mjs`, `settle-attempt.mjs`, `inspect.mjs`, `terminal-control-checks.mjs`, `registrations.mjs`.
