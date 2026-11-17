# Facts: host port, placement blast radius and cut lines

Read on branch `sec/p01` (base b704fdd08). Impact analysis: `fgos dispatch decide --for impact-analysis` answered `unavailable / tool.missing` when the plan was written (plan.md "Prior art"); not re-run here. **impact-analysis degraded (GitNexus missing), blast radius from rg** (weak proof). `git log -S'placement' -- src/run-supervisor` is empty (plan.md): no earlier host abstraction existed.

## 1. Blast radius (rg, file:line)

Tests listed per row are the files that drive the hit.

| Symbol | Hits | Driven by |
|---|---|---|
| `writeAttemptIntent` | `src/run-supervisor/direct-launch.mjs:178` (def, writes `mode: terminal\|direct`, `terminal.{slot,endpointEnv}`); `src/runner/dispatch/assignment-runner.mjs:87,714` | `test/run-supervisor/direct-cutover.test.mjs`, `packages/run-supervisor/rust/tests/adopt_matrix.rs` (reads intent) |
| `buildEnvelope` | `direct-launch.mjs:204` (def; `mode` at :218, `slot`/`terminal` block at the end); `assignment-runner.mjs:80,1016`; tests import it | `test/run-supervisor/direct-cutover.test.mjs:15,106,123,141`, `test/run-supervisor/windows-custody.test.mjs:11,27` |
| `terminalSocketPath` | `direct-launch.mjs:120`; `assignment-runner.mjs:77,896` (`attempt.terminal ? terminalSocketPath(attemptId) : null`) | `direct-cutover.test.mjs` |
| envelope `mode` readers | `packages/run-supervisor/rust/src/supervise.rs:289` (`== "direct"`), `:568` (match direct/terminal, else refuse); `gate.rs:199-201` (match terminal/direct); `adopt.rs:462` (reads intent `mode == "terminal"`), `adopt.rs:511` (writes `"mode": "direct"` into the adopt-not-started envelope); `src/run-supervisor/steps/settle-attempt.mjs` (`paneScreenOf` returns early unless `envelope.mode === 'terminal'`) | `packages/run-supervisor/rust/tests/{adopt_matrix,adopt_concurrency,supervise_terminal_fake_herdr}.rs`, `test/run-supervisor/direct-cutover.test.mjs` |
| `allocateAsync` / `releaseAsync` | placement callers: `src/runner/dispatch/herdr-round.mjs:425` (release in `abandon`), `:448` (allocate). Definitions: `src/terminal-control/client.mjs:213,222`. Other hits are tests only | `test/terminal-control/group-queue.test.mjs` (owns the queue), `test/run-supervisor/terminal-groups.test.mjs` |
| `.allocate(` / `.release(` on a terminal client (Rust) | no `.allocate(` in the run supervisor; release: `packages/run-supervisor/rust/src/terminal_slot.rs:193` (`backend.core().release`), builtin step at `steps.rs:118-121` | `packages/run-supervisor/rust/tests/steps_runner.rs`, `supervise_terminal_fake_herdr.rs` |
| `Core::launch` / `core.launch(` | `packages/run-supervisor/rust/src/supervise/terminal.rs:763` | `supervise_terminal_fake_herdr.rs` |
| `createRoundTerminalControl` | def `src/runner/dispatch/terminal-slot.mjs:63`; `herdr-round.mjs:27,431`; `cli.mjs:27,252` (the recover/probe `closePane`: inspect then release by `terminalKey`); `worker-session-boot.mjs:24,128` | `test/runner/dispatch-terminal-slot.test.mjs`, `test/verbs/dispatch-observe.test.mjs:86` (name list guard) |
| `terminal_slot` (Rust) | `adopt.rs:478` (`ENDPOINT_FILE` publish); `supervise/terminal.rs:47,756,758`; `steps.rs:121`; `lib.rs:40`; census rows | `adopt_matrix.rs`, `steps_runner.rs` |
| `StartMode::` | `supervise/unix.rs:282`, `supervise/windows.rs:307` (both `Direct`); `packages/process/rust/src/containment/linux.rs:124` (`Terminal` branch); `packages/git/rust/src/driver.rs:1362`; process tests. These are Process Facts' containment modes, not the envelope mode: they stay | `packages/process/rust/tests/containment_bwrap.rs` |
| readers of `intent.json` / `envelope.json` | `assignment-runner.mjs:746,1180,1333`; `src/runner/dispatch/run-admission.mjs:39`; `src/runner/execution/unit-run-start.mjs:68`; Rust `attempt_step.rs:29`, `adopt.rs:180,356,361,427-540`, `supervise/{terminal,unix,windows}.rs`. `src/verbs/dispatch` has no reader of either file; it reads the pane only through `tick.visibility.paneId` (`watch.mjs:75`) and `inspect.mjs:35-45`. `src/runner/dispatch/recover*` is `recovery-planner.mjs` and holds no `terminalKey`/pane read | `adopt_matrix.rs`, `adopt_concurrency.rs`, `unix_lease_record.rs`, `test/run-supervisor/direct-cutover.test.mjs` |
| Windows custody | `supervise/windows.rs:280,307`; Windows declares no pane capability (terminal-control spec §6), so `terminal` is `unsupported` there and only `direct` places | `test/run-supervisor/windows-custody.test.mjs` (skips off Windows) |
| non-placement Terminal Control caller that stays | `src/runner/dispatch/worker-session-boot.mjs:128` asks whether a herdr session answers (`ensureWorkerSession`); it neither allocates nor releases a pane | `test/runner/dispatch-worker-session-boot.test.mjs` |

## 2. Where a binding becomes a pane command, env, account home and trust

`prepareTerminalAttempt` (`src/runner/dispatch/herdr-round.mjs:354`): opens the round and writes the typed brief (`:392-401`), `establishConfinement` (private worker home, `:403`), builds the display and the endpoint env (`herdrEndpointEnv`), `beforeAllocate` (records key and endpoint before the pane exists), `tc.allocateAsync` (`:448`), then `seedAttemptTrust` only when there is no private home (`:466`). It returns `{slot, paneId, workerHomePath, endpointEnv, tc, display, abandon}`. The pane command itself is built later by the supervisor (`terminal.rs launch_spec :270`) from the envelope launch block. Phase 11 exports the binding-to-command-and-trust step (everything except the allocate call) for phase 12.

## 3. The delivery door the port reuses

`fgos-agent-protocol`: `adapter_for` (per-CLI adapter), `await_ready(io, ready_ms)` (`packages/agent-protocol/rust/src/terminal/mod.rs:435`), `deliver_brief(io, message, outbox)` (`:554`) over the `AgentIo` trait (`packages/agent-protocol/rust/src/port.rs:34`: `send`, `screen`, `inspect`, `now_ms`, `pause`). Driven today by `supervise/terminal.rs drive :909` through `TermIo` (`:651-735`). `deliver_brief` needs an `Outbox`; the Session Host passes a no-result outbox for a head (a head has no result claim). The Session Host gets its own `PaneIo` over Terminal Control `send/read/inspect`; `TermIo` later wraps it.

## 4. Cut lines (phases 9 and 11)

Moves into `fgos-session-host`:
- terminal start = `Core::allocate` + `Core::launch` (quoted `launch_line`, `core.rs:1258`) [+ `await_ready` + `deliver_brief` through `PaneIo` only when `opening` is given]. Today allocate is Node (`herdr-round.mjs:448`) and launch is `terminal.rs:763`.
- retire = `Core::release` with close/retain (today `terminal_slot.rs:180-193`, `steps.rs:118`, Node `cli.mjs:252-257`, `herdr-round.mjs:425`).
- alive = `Core::inspect` for a terminal placement (the pane is `live`/`gone`/`unknown`); for a head also Identity's liveness (Identity stays the authority for who is alive; the port answers only whether the placement exists).
- direct start = start a prepared command without a screen, handed in by the caller.

Stays in the run supervisor (never moves): the attempt lock and cwd lease, the containment domain (create, spawn_in, is_empty, kill), the deadline and idle clocks, the watched `drive` loop that types a worker's brief and detects completion (`terminal.rs:909`, a worker's brief stays in the supervisor's watched drive), `carrier_check`, receipts, settle, adopt, the attempt socket and the GO/BRIEF_DELIVERED frames (`AttemptSocket`, `terminal.rs:152`). Containment never moves: the `direct` adapter receives an already-contained prepared command (gate argv from `attemptGateCommand`, `direct-launch.mjs:112`); it never builds a domain.

Verdict: the cut holds. One fact to carry into phase 9: for a worker the supervisor launches a *gate* into the pane and the gate dials the attempt socket, so `start` for a worker takes the gate command as `command/args` and `opening` absent; the supervisor, not the port, then drives `await_ready`/`deliver_brief` on a `TermIo` wrapping the port's `PaneIo`. No `NEEDS_CONTEXT` is raised.

## 5. Not verified

GitNexus index (absent); no tests were run (docs-and-contract phase). Windows `direct` placement was read, not run.
