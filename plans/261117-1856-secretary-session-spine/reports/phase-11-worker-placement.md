# Phase 11: worker attempts placed through the host port (report and spec text for phase 18)

Status: DONE. The envelope and intent carry `host`, release-slot is the port's `retire`, the supervisor's pane I/O
wraps the crate's `PaneIo`, Node gives panes back through the Session Host client, and one seat-preparation door is exported.
Allocation and the gate launch moved to the port in a second round (see "Cut closed after the first round").

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

1. **Test placement.** `herdr-private-home-trust.test.mjs` is outside the write scope, so the seat-door test is `test/run-supervisor/prepare-seat.test.mjs` and the retire test is `test/run-supervisor/pane-host.test.mjs` (the plan listed `dispatch-terminal-slot.test.mjs`, but the retire helpers are in `herdr-round.mjs`, not `terminal-slot.mjs`).
2. `test/suite-baseline.json` still lists `test/terminal-control/group-queue.test.mjs` (retired, see below) and has no row for `test/session-host/group-queue.test.mjs`; the file is outside this phase's footprint.

## Cut closed after the first round (open, launch, queue)

**A. Session Host crate** (`packages/session-host`). Two operations beside `start`, because the supervisor's gate command exists only after the controller has a slot, so `start` (allocate + launch of one command) cannot carry it and cannot return the launched identity the supervisor needs before `GO`:
- `open(OpenRequest) -> OpenAnswer`: terminal only, Terminal Control allocate and nothing else (`groupKey`, `beside`, `groupSize`, `cwd`, `env`, `display`). Answers the placement plus, when this call allocated it, the `slot` (`tabId`, `paneId`) for the diagnostic line; a key whose pane is already live answers its placement with no slot and allocates nothing.
- `launch(placement, LaunchSpec) -> LaunchAnswer`: terminal only, Terminal Control launch into the key's slot; `Launched(ProcessIdentity)`, `NotStarted { reason }` (slot kept, never launched into again) or a refusal. A direct placement is refused `unsupported / host-unsupported-here`.
- `start` is now `open_slot` + `launch` (+ opening), one door; its observable behaviour is unchanged. Contract `host-port.v1.json` carries `open` and `launch` (`openRequest`, `launchSpec`, `processIdentity`); route ops `open` and `launch`; owning proofs in `packages/session-host/rust/tests/host.rs` (two tests: open/launch happy path with slot, group size and idempotent re-open; refusals for a screenless placement and a bad key).
- Node `src/session-host/client.mjs`: `open`, `launch`, `openAsync`, `retireAsync`, option `config` (the route's core settings) and the `terminal-config-*` route codes kept by name. The per-group promise queue and the async spawn moved here from `src/terminal-control/client.mjs` (moved, not copied; `allocateAsync`, `releaseAsync` and their group map are deleted there, `allocate`/`release` stay as plain calls). `retireAsync(close)` waits behind earlier opens of its group (group from this client's `openAsync` or `{ groupKey }`, else rejected `session-host-unknown-group`).

**B. Node placement.** `herdr-round.mjs` opens through `createPaneHost(...).openAsync` (same `config` as the control, shared per endpoint+config so rounds side by side share one queue) and `abandon` closes through `retireAsync(..., { groupKey })`. `round.paneId` comes from the answer's `slot`. `terminal-slot.mjs` `driverCodeOf` reads the Session Host's `detail` as well as Terminal Control's `reason`. Test moved with the behaviour: `test/terminal-control/group-queue.test.mjs` is retired; `test/session-host/group-queue.test.mjs` owns the same four cases over `openAsync` / `retireAsync` (ordering, other group runs alongside, failed call does not stall, unknown-group close rejected, route error). `test/session-host/client.test.mjs` gains the one wiring proof for `open` / `launch`.

**C. Supervisor.** `supervise/terminal.rs` launches through `SessionHost::launch` over its own core; refusals keep their receipt codes (`terminal-mode-unsupported` for `unsupported`, `terminal-launch-unknown` for `unknown`, `terminal-launch-not-started`), with the same text (`capability: detail`).

**D. Checks.** `rg -n "\.allocateAsync\(|\.releaseAsync\(|\.allocate\(|\.release\(\{" src/runner src/run-supervisor`: no hit. `rg -n "Core::launch|\.allocate\(|\.launch\(" packages/run-supervisor/rust/src`: one hit, `supervise/terminal.rs:738 session_host.launch(...)`, which is the Session Host door. `cargo test`, `clippy --all-targets -D warnings`, `fmt --check` for `fgos-run-supervisor`, `fgos-session-host`, `fgos-terminal-control` green; `cargo check` for `aarch64-apple-darwin` and `x86_64-pc-windows-msvc` green. Node with `FGOS_HOST_BIN` of a host built from this tree (the shared `devhost-target` binary predates `open`/`launch`): `test/run-supervisor/*`, `dispatch-terminal-slot`, `dispatch-runtime-inspect`, `cli/run-verb`, `session-host/*`, `terminal-control/client-route`, `architecture` all pass, 0 fail.

**Live proof.** `npm run -s fgos:dev -- run "say ok" --json` on this machine (herdr running): exit 0, envelope `host: terminal`, claim `done`, closed steps ended with `release-slot`, `herdr pane list` before and after identical (no pane left).

## Spec text, new operations (for `docs/platform/session-host/spec.md`, phase 14 folds it in)

"`open` and `launch` are the two halves of `start` for a controller that learns its command only after the slot exists (the run supervisor's gate). `open` allocates the terminal slot of a key (group, beside, group size, working directory, display) and starts nothing; it answers the placement and, when it allocated, the slot's pane, and a key whose pane is already live answers that placement and allocates nothing. `launch` starts a prepared command in that slot through Terminal Control's durable `launched` marker and answers the process identity of the launched root (or `not-started`, the slot kept and never launched into again, or a refusal). Both are terminal-only: a screenless placement is refused `unsupported / host-unsupported-here`. A Node caller that opens many placements serialises per group (`openAsync`, `retireAsync(close)`), one queue per coordinating process. Decision-history line: 'The Session Host gained `open` and `launch` so the supervisor's gate launch and Node's pane allocation both go through the port; `start` is their composition.'"

## Spec text for `docs/platform/run-supervisor/spec.md` (phase 18 applies it; shared with plan 261117-1553)

Section 5.3 (envelope): replace the `mode` field by `host` (`terminal` or `direct`). "`host` says where the Session Host places the
attempt; with `slot.key` (the attempt id) and `slot.groupKey` it is the attempt's placement. A record written before placement went
through the Session Host names the same fact `mode`; readers (adopt, recover, settle) accept it where `host` is absent, writers never emit it."

Section 16 (release): "The `release-slot` step is the Session Host's `retire` for the attempt's terminal placement, `close` for a
recognised end with captured output, `retain` otherwise (with the configured retain window). A refusal that is `unsupported` fails the
step; an `unknown` refusal leaves it without a receipt so adopt retries, except that no record of the key anywhere is `noRecord`
(read as released only for an adopt-not-started envelope)."

Decision-history line: "Worker attempts are placed through the Session Host port: the envelope carries `host` in place of `mode`,
release is the port's `retire`, and the supervisor's pane I/O is the crate's `PaneIo` plus the supervisor's watch. Allocation is the port's `open` and the gate
launch its `launch`; `start` is their composition."

## Verification

- `cargo test -p fgos-run-supervisor -p fgos-session-host`: all green (includes the re-signed envelope digest vectors, the release-slot step and the fake-herdr terminal supervise tests, which still carry `mode` in some fixtures: that is the old-record reader). `host_of` has one unit test.
- `cargo clippy ... --all-targets` clean; `cargo fmt --check` clean; `cargo check --target aarch64-apple-darwin` for both crates passes.
- Node (with the staged addon from `scripts/lib/git-addon-stage.mjs`): `test/run-supervisor/*.test.mjs`, `dispatch-terminal-slot`, `dispatch-runtime-inspect`, `architecture`: pass except tests that need a writable machine state, git worktree or `/var/tmp` in this sandbox (`attempt-steps` two pane-seat quarantine cases: `EROFS ... provider-state.lock`; `run-verb`: `EROFS /var/tmp`; three trust cases and one `attention` case that read a linked worktree). None of them touches code changed here; a baseline comparison was not possible (`.git` is read-only in this round).
- The first design put the retire helpers in `terminal-slot.mjs`; `dispatch-runtime-inspect` caught that this pulled `child_process` into the read-only inspect import graph, so they moved to `herdr-round.mjs`.
- `rg` for placement calls: superseded by the second round (see D below). Read-only Terminal Control users that stay: `worker-session-boot.mjs`, `settle-attempt.mjs`, `inspect.mjs`, `terminal-control-checks.mjs`, `registrations.mjs`.
