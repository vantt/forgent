# HARDEN T4 council: correctness seat (Run Supervisor + Launch gate)

Main `a1e903f39` at start, `d5b6c74ae` at the end (only mailbox and board docs changed in between, nothing in this layer). Written 2026-11-03 12:33 to 12:55 (Asia/Saigon) on fg-server2. Lens: correctness and stability (axes A, B, with F where a contract names an outcome wrongly). Read-only. The only repository file written is this report.

## What I ran

- I read every line of `packages/run-supervisor/rust/src/**`, `src/run-supervisor/**`, `src/setup/run-supervisor-checks.mjs` and the eight registrations (`registrations.mjs:2055-2100`). I read the attempt parts of `assignment-runner.mjs` (1590-1620, 1730-1810, 1990-2160), `herdr-round.mjs:280-495` and `transport.mjs:360-470,670-708`. I read the holder-lock admission path (`port.rs:712-773`, `predecessor.rs:143-290`), the Windows custody test and `supervise_portable.rs:58-102`. I skimmed `run-lock.mjs`, `terminal-slot.mjs` and `worker-session-boot.mjs` (exports only, plus the server judge).
- **One reproduction**, run outside the repository. I extracted the tree with `git archive HEAD` into the session scratchpad, added a test file `tests/repro_correctness.rs` next to `supervise_lifecycle.rs`, and ran it with the private target dir. It passed (receipt shown under B-1). I deleted the target dir and the extracted tree afterwards.
- **Timings**, all at load average 31 (other sessions were running): the host's `internal attempt-step --protocol 1 --probe` took 9 to 17 ms. A full `import()` of `attempt-step.mjs` took 73 to 99 ms. Importing `finalize-home.mjs` alone took 39 to 51 ms.
- **Live state:** I read the stuck attempt that the baseline doctor named (`unit-run-1792482363495-797e4401/producer/1/runs/01`).

## Part A: target shape

**Run Supervisor** (`fgos-run-supervisor`, L4)
- **Authority.** One process per attempt owns the attempt from the binding to `closed.json`. It owns the attempt directory layout and the one-time publication of its files, the receipt outcome, the step runner, and the soft and idle deadlines. It also owns the start of the attempt clock.
- **Contract.** Envelope v3, `receipt.v1`, `step-receipt.v1`, `gate-go.v1` and the four internal routes.
- **Ports.** Containment and facts (L0), the attempt lock and its predecessor record (L1), terminal-control by key (L2), agent-protocol adapters (L3).
- **Node after the move.**
  - The controller builds the envelope and hands over the locks (`direct-launch.mjs`).
  - It does the controller's Ctrl-C policy (`cancel-registry.mjs`).
  - It runs a thin adopt client (`client.mjs`, with `sweep.mjs` folded into it).
  - Node budget: about 560 lines and 14 exports in `src/run-supervisor` outside `steps/`. That is down from 1 493 lines, once the legacy sweep and the screen judging go.
  - Node must decide nothing about the receipt outcome or the attempt lifecycle.
- **Separate components or parts?** The adopt door, the sweep and `attempt-step` are parts of the Run Supervisor, not separate components. Adopt runs the same step runner and the same `publish_receipt_with` (`adopt.rs:217`, `supervise.rs:117`). The sweep is a 24-line wrapper over adopt. `attempt-step` is a 75-line launcher.
- **Rust/Node boundary.**
  - The step *bodies* (`settle-attempt`, `finalize-home`, `cleanup-trust`) are Execution Core and confinement logic. They stay Node until T5 and are not T4 Node budget.
  - Two decisions still sit in Node and belong to this component: the deadline arithmetic (`direct-launch.mjs:131-139,207-213`) and the binding-wait budget (`:26`). See the migration table.
- **Doctor rows it keeps.** `run-supervisor-route` (absorbing `process-containment`), `runtime-socket-dir` and `run-attempts-stuck` (absorbing the `units-awaiting-resume` warning).
- **Size target.**
  - Rust about +20 for the B-1/B-2 fixes, with no new mechanism.
  - Node about −250: the legacy sweep, the screen judging and a smaller cancel registry.

**Launch gate** (part of the same crate; `fgos internal gate`)
- **Authority.** It is the process root of the agent. It owns the agent's IO, the hard ceiling, emptying the domain, `gate-exit.json` and the orphan branch.
- **Contract.** `gate-go.v1` and `gate-exit.v1`.
- **Node.** None, and it stays at 0.
- **Spec disagreements:** see B-1 (Windows lock custody) and the spec drift row in Part B.

## Part B: findings

| Id | Axis | Severity | Repro | file:line | What goes wrong | Fix shape |
|---|---|---|---|---|---|---|
| B-1 | A, B | **High** | **unreproduced** (Windows; reasoned from code and an existing test) | `supervise/windows.rs:47-61` (the lock is held in the supervisor process); `gate/windows.rs:43-46` (the gate holds no lock); `supervise_portable.rs:72-75` (the test asserts the lock is free after a supervisor kill and uses only `--probe-only`); `adopt.rs:144-147` (a run-dir adopt does not stop at a non-empty domain); `holder-lock port.rs:764`, `predecessor.rs:272-281` (admission calls `kill_all` on the declared domain); callers that adopt without `--probe-only`: `direct-launch.mjs:381-386`, `assignment-runner.mjs:1598,2120`, `cli.mjs:1074`, `recover.mjs:276` | **On Windows a dead supervisor gets its live agent killed by the next adopt.** Spec §9 and §11 say the gate still holds the attempt lock, so the agent runs on and adopt settles it. On Windows the `LockFileEx` attempt lock dies with the supervisor, so the lock reads free while the agent runs. In that state every non-probe `adopt --run-dir` acquires the lock, and the predecessor rule calls `kill_all` on the job.<br>The first such caller is the controller itself: `awaitSettledResult` sees the supervisor gone and calls `adoptRun` at once.<br>Scenario: a seat runs on Windows and its supervisor crashes or is killed. The controller's next 25 ms poll ends the agent and its gate. The receipt is `gate-lost`, the work is lost, and `--resume` refuses to relaunch (spec §9.1). | Adopt ends a domain only when its keeper is provably gone. When a binding exists and `judge(binding.gate) != dead`, a run-dir adopt answers `running` / `gate-alive`, as a scan already does with `domain-not-empty`. This uses the existing judge and adds no mechanism.<br>The owning proof is in the portable crash test (`supervise_portable.rs:74`): one more call there, a non-probe `adopt` while the agent runs, must answer `running`.<br>Spec §11, Supervisor row: say "Windows: the lock is free; the job (held open by the gate) keeps the attempt". |
| B-2 | A, F | Medium | **reproduced** | `supervise.rs:344-347` (the binding is published before HELLO), `:359-373` (no GO is sent, yet `finish(..., not_started=false)`), `outcome_for:61-72` (no gate-exit gives `gate-lost`); terminal: `supervise/terminal.rs:563-572` (GO fails after the binding, `Err` and no receipt, then adopt gives `gate-lost`) | **An attempt the supervisor provably never started is receipted `gate-lost`, which resume treats as "may have run, never relaunch" (spec §9.1).**<br>Repro: an envelope that the supervisor accepts and the gate refuses before HELLO (`stdinPolicy: brief-file` with no `briefPath`). Gate stderr shows `envelope-invalid: stdinPolicy brief-file needs briefPath`. The receipt is `{"outcome":"gate-lost","synthesizedBy":"supervisor"}`, there is no agent marker, and a binding exists. The existing test `a_gate_that_dies_without_gate_exit_gives_a_gate_lost_receipt` (`supervise_lifecycle.rs:163-176`) asserts "no agent ever ran" and still expects `gate-lost`.<br>Common real causes: bwrap fails to start (the mount-refused case `checkProcessContainment` already names), or the gate takes longer than `HELLO_LIMIT` (15 s) under load. | When GO was never written, the supervisor knows the agent never started: call `finish` with `not_started = true` (the receipt says `abandoned-not-started`, reason `start-refused:gate-silent`). The terminal GO-send failure goes through the same `finish`. About +4 Rust lines.<br>The repro becomes a new case in `supervise_lifecycle.rs`. The existing test keeps `gate-lost`, because GO was sent there. |
| B-3 | A, F | Medium | inferred | `supervise.rs:378-401` vs `steps.rs:80` (the gate on `earlier_done`); live: `.fgos/assignments/unit-run-1792482363495-797e4401/producer/1/runs/01` (hostBin `.claude/worktrees/pane-close/.fgos/runtime/dev-host/…`, now gone; `steps/release-slot.json` exists, `settle-attempt` left open with exit 66); `run-supervisor-checks.mjs:267-279` | **`run-attempts-stuck` fails for ever on fg-server2, and its remedy cannot be done.** The envelope binds steps to a dev-door host whose worktree was removed. The row says "restore them at those paths", and nobody can.<br>The attempt also shows `release-slot` receipted while `settle-attempt` was pending. Today's runner forbids that (`steps.rs:77-80`), so this is old code from 10-20 and not a live bug. | When the release is gone, the row warns instead of failing and names the attempt. A person decides, because no existing door closes it. Closing it is proposed addition P1. This keeps the condition visible without a permanent red row. |
| B-4 | A | Medium | inferred | `cancel-registry.mjs:117-129` (a launching attempt is only waited for, with `requestCancel` only for `delivered`), `:123` (deadline `cancelWaitMs`, default 15 s); `direct-launch.mjs:26` (`BINDING_WAIT_MS` 30 s); spec §5.3 terminal start budget (handshake 10 s + identify 5 s + HELLO 15 s) | **A Ctrl-C during a slow terminal launch can leave the agent running uncancelled.**<br>Scenario: the pane shell takes 8 s to prove ready, identification takes 4 s and HELLO 4 s, so the binding lands at about 16 s. The controller's wait ended at 15 s, it printed the resume line and exited. The supervisor binds, nobody writes `cancel-requested.json`, and the agent works through its whole brief (35 min here). | Write `cancel-requested.json` for launching attempts too. The file needs only the envelope's `attemptId`, which exists before spawn (`assignment-runner.mjs:2087` comes before `:2106`). The supervisor's first watch tick then stops the agent. This deletes the "wait for binding then cancel" branch (Node −10). The owning proof is `cancel-registry` test 5, changed to "the request is on disk before the binding". |
| B-5 | B, F | Medium | inferred | `direct-launch.mjs:26,322-334`; `terminal_slot.rs:18` + `supervise.rs:171` + spec §5.3 | **The controller's binding wait (30 s) is not larger than the supervisor's own worst-case start (10 + 5 + 15 s, plus process start).** A terminal attempt that binds at 30.5 s is reported `launch-unknown`: the unit fails while its agent runs. Exclusion holds on Unix, because the gate keeps the lease copy, so this is a false failure, not a double writer. | Derive the wait from the Rust bounds plus slack (for example 45 s). One number, written once in the spec next to the terminal budget. Zero net lines. |
| B-6 | A | Medium | inferred | `steps/cleanup-trust.mjs:187-189` → `trust-store.mjs:231-237` (read, modify, rename, no lock); `herdr-round.mjs:293-294` (claude's target is the real `~/.claude.json`) | **Two kinds of lost update, both inferred.** `cleanup-trust` rewrites the operator's real `~/.claude.json` by read-modify-rename. A live claude in another pane, or the operator's own session, rewrites that file all the time. A write that lands between our read and our rename is lost, and `~/.claude.json` holds the user's account and project state. Two seats of one unit that end together also drop each other's removals. | The owner is confinement/trust (T5), and the fix should land in `trust-store.mjs` for seed and removal together. T4 records it; no T4 code change. |
| B-7 | A | Low | inferred | `run-supervisor-checks.mjs:207-219` (reads `/proc/net/unix` first, `readdir` after) | A socket bound between the table read and the directory listing is judged an orphan. `doctor --fix` running at the same moment as a terminal launch unlinks the live socket, and the attempt ends `terminal-gate-silent`. | List the directory first, then read the table. Zero lines. |
| B-8 | A | Low | reproduced (reading) | `gate/unix.rs:414`, `gate/windows.rs:141` | The 127 / 126 choice matches English error *text* ("No such file or directory"). A missing brief or capture file also reads 127, which `spawnWorker` maps to `worker-spawn-fail` ("program not found"). | Decide from `io::ErrorKind::NotFound` of the spawn error only, and return a typed error from `spawn_agent`. |
| B-9 | B | Low | inferred | `supervise.rs:519-523`, `terminal.rs:418-421,597-600` | `kill_all` is tried once after grace + 5 s, and its result is dropped. If it fails, the supervisor spins forever and only the gate's ceiling remains. In terminal mode, `while !gate_gone` never ends when `domain_is_empty` stays `Unknown`. | Retry `kill_all` on every tick after the grace (the Windows gate already retries, `gate/windows.rs:172-175`). |
| B-10 | A | Low | inferred | `steps.rs:262` | After a normal exit the step's pid has been reaped, and the step then gets `killpg(pid)`. A recycled pid that leads its own group would be signalled. | Kill the group before `wait` reaps the step (the group id stays reserved while it has members), or signal by identity as the timeout path does. |
| B-11 | A | Low | inferred | `terminal_slot.rs:126-128` → `steps.rs:110-113` | `release-slot` stays `Retry` while herdr answers `unknown`, and fails `Unsupported` when herdr is uninstalled. Either way the attempt never closes, and `run-attempts-stuck` fails for ever (same family as B-3). | Covered by B-3's warn rule, with the reason `terminal-unavailable`. |
| B-12 | F | Low | reproduced (reading) | spec §5.3 l.148 and decision l.352 vs `terminal.rs:441-449` (`16150dca1`); spec §15 l.333 and contract `internal-route…v1.json:90` (`lock-scan`); spec §11 Supervisor row vs B-1 | **Spec drift.** Three places disagree with the code:<br>1. The spec says a `working` status counts as pane activity; it no longer does.<br>2. The contract still lists a `lock-scan` route that does not exist.<br>3. The Windows lock row is wrong (B-1). | Fix the text, drop `lock-scan` from the contract, and record a decision line for the idle change. |
| B-13 | F | Low | reproduced (reading) | `herdr-round.mjs:58` (pane idle 1 200 000), `assignment-runner.mjs:1263` (default `timeoutMs` 900 000) | With the default timeout, a pane's soft deadline (15 min) always comes before its idle limit (20 min). Pane idle then never fires. Here it works only because `runner.timeoutMs` is 35 min. | Write it in the spec as a known limit, or have the doctor warn when `timeoutMs` is not above the pane idle. The owner decides. |

**Rejected hypotheses (checked, not findings).**
1. Legacy-sweep could settle a new attempt still being prepared, when the lock exists but the envelope does not. It cannot: the live controller in `control/generations` judges alive and the run is kept (`legacy-sweep.mjs:86-88`).
2. Node's and Rust's boot ids could disagree. They cannot: both read the same crate (`process-identity.mjs:20` through the door).
3. Windows boot id `None` against `'unknown-boot'` could force an instant soft deadline. It does not: `is_some_and` gives false.
4. Two supervisors could run for one attempt. They cannot: `supervise.rs:324` refuses before any lock is taken, and on Unix the lock is inherited.
5. A step could inherit a lock. It cannot: every spawn goes through `spawn_with_fds(cmd, &[])` with the descriptors CLOEXEC first.
6. A terminal `launch-unknown` could release the pane under a live agent. It cannot: abandon runs only if `!attemptHandedOver` (`assignment-runner.mjs:2300`).
7. Node's `os.uptime()` on Linux and Rust's `CLOCK_BOOTTIME` use the same clock. The macOS (libuv `kern.boottime` against `CLOCK_MONOTONIC`) and Windows pairs could drift by seconds. **Unreproduced**; this is handled by migration row 2.

## Migration table

| Node part | What it decides | Move? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `direct-launch.mjs` `buildEnvelope` deadlines (`:131-139,207-213`) | Absolute soft and ceiling instants, from `os.uptime()` | Move the clock read only | One clock source: the instants must be on the gate's clock, and Rust is the authority. Use the door's facts, not libuv. | 2 | Same lines; one door call replaces `os.uptime` |
| `direct-launch.mjs:26` `BINDING_WAIT_MS` | How long a launch may take | No (a constant) | B-5: derive it from the Rust bounds | 1 | 0 |
| `direct-launch.mjs` `awaitSettledResult` / `waitForClosed` | When to call adopt | No | A thin waiter; the adopt verdict decides (after the B-1 fix) | — | ~120 |
| `cancel-registry.mjs` | The controller's signal policy | No | The controller's own process | 1 (B-4, −10) | ~130 |
| `legacy-sweep.mjs` + the row | Liveness of runs from before the supervisor | Delete (R4) | No legacy run is left running here; the owner confirms on the other machines | 3 | 0 (−154) |
| `steps/settle-attempt.mjs:84-133` | Provider stop judged from the screen | Delete after the 04a wiring | The agent protocol is the outcome authority | after 04a | −50 |
| `run-supervisor-checks.mjs` socket table (`:160-219`) | Orphaned sockets, from `/proc/net/unix` | Yes, into the existing `supervise --probe` answer | An OS fact read in the setup layer (T0 hand-over) | 4 | −60 |
| `runtime-dir.mjs` | Socket dir path and mode | Keep `resolve` / `ensure`; the Rust bind already re-checks | Node needs the path before the envelope exists | — | 58 |
| `assignment-runner.mjs` launch, supervise and settle parts | The order of the handover | No (SEAT-scheduled) | Orchestration of the controller | — | — |
| `transport.mjs` `cliSpawnAdapter` | Timeouts and group kills for short calls | Not T4 | A second supervision path for probes and judges; T5 decides | — | — |
| `run-lock.mjs`, `herdr-round.mjs`, `terminal-slot.mjs` | Run-control CAS, pane preparation, client builder | Not T4 | Execution Core and terminal-control | — | — |

## Delete list

1. `src/run-supervisor/legacy-sweep.mjs`, the `legacy-attempts-stuck` row and fix, and `test/run-supervisor/legacy-sweep.test.mjs` (R4; owner confirms all machines). The legacy cases in `inspect-recover-adopt` stay as long as the `legacy-run` verdict exists in Rust (`adopt.rs:111`).
2. The `settle-attempt.mjs` screen judging (`paneScreenOf`, `SCREEN_LIMIT_PATTERNS`, `screenSaysProviderStop`, `terminalAdapterOutcome`) once the receipt carries the names. Also the screen fallbacks on `:202,205`, because the evidence text then comes from the receipt reason. Retire the screen cases in `attempt-steps.test.mjs`.
3. The "wait for the binding, then cancel" branch of `cancel-registry.mjs` (B-4).
4. `lock-scan` in `internal-route.run-supervisor.v1.json` and spec §15's first bullet (B-12).
5. `sweep.mjs` folded into `client.mjs` (a 24-line wrapper).

## Doctor table

| Fail / warn condition today | Row today | Row that keeps it |
|---|---|---|
| The host does not serve a route at protocol 1 (fail) | `run-supervisor-route` | `run-supervisor-route` |
| No containment driver (fail); best-effort (warn on Linux, info elsewhere) | `process-containment` | `run-supervisor-route` (same `--probe` answer, one call instead of five) |
| Socket dir missing (warn); wrong type, owner or mode, or an orphaned socket (fail) | `runtime-socket-dir` | `runtime-socket-dir` (B-7 order fix) |
| Open attempt, lock free (fail); release gone (fail today, warn per B-3) | `run-attempts-stuck` | `run-attempts-stuck` |
| Units await resume (warn) | `units-awaiting-resume` | `run-attempts-stuck` (one adopt scan serves both) |
| Grace < 1000 or not an integer (fail); cancel wait < 1000, not an integer, or < grace (fail) | `gate-kill-grace`, `cancel-wait` | one row `dispatch-stop-timings` (replaces both) |
| Settleable legacy run (fail); a kept one (warn) | `legacy-attempts-stuck` | deleted with the mechanism (R4) |

8 rows → 4. No condition is lost except the legacy ones, which go with their mechanism.

## Tests table

| Behaviour | Owning proof (lowest layer) | Duplicate above it | Note |
|---|---|---|---|
| Supervisor death on Windows leaves the agent running | `supervise_portable::a_supervisor_killed_midway…` | — | Missing case: a non-probe adopt while it runs (B-1); extend this test |
| No GO sent gives not-started | none today | — | New case in `supervise_lifecycle.rs` (B-2); it is a new behaviour |
| Soft deadline, cancel, hard ceiling, supervisor crash, two adopters | Rust: `supervise_lifecycle`, `supervise_portable`, `gate_ceiling`, `adopt_concurrency` | `direct-crash-matrix` 2, 3, 4, 5, 6, 7c | Keep one Node wiring row (the controller path); retire the rest (the baseline lists them) |
| A cancel request written before the binding stops the attempt | `cancel-registry` 5 | — | Re-point it (B-4) |
| Pane idle counts letters only | `terminal-cutover` (envelope idle) + `supervise_terminal_fake_herdr` | — | Fine |
| Time-based waits | `gate_pid1.rs` fixed 150-300 ms sleeps; `support/mod.rs` and `portable/mod.rs` each define `wait_for` and `wait_until` | — | One helper (simplicity seat); the sleeps that are deadlines under test stay |

## Received items

1. **Worker session server (T2 §2.3).** The run supervisor should not own it. It is one process per attempt, and a herdr session server outlives every attempt and is shared by them. Owning it would make L4 know sessions, which it addresses today only by key (spec §12). The lifecycle belongs to terminal-control's driver, so T2's named exception stands. T4 takes nothing.
2. **R5, seat launch cost.**
   - On Unix each step is one process: the host `exec`s node (`attempt_step.rs:404-409`). A direct seat runs 2 Node steps; a terminal seat runs 3 plus the Rust `release-slot`.
   - Measured at load 31: the host part costs 9-17 ms, a full Node import 73-99 ms, and a lone `finalize-home` import 39-51 ms. The rest of TEST's 150-250 ms is the step's own work (the evaluator, git).
   - Putting `attempt-step` in Rust would mean porting the settle step, which is Execution Core: that is T5, not T4.
   - From the correctness lens, keep one process per step. Per-step receipts and idempotent retry depend on it, and a merged step would turn a crash in `finalize-home` into a re-settle.
   - A cheap win, without moving anything: a lazy `import()` of the step module in `attempt-step.mjs:14-16` (speed seat to measure).
3. **Windows hold transport (RT-M3).** I found no way around the helper that adds no mechanism. Its `declared` answer is the proof that the lease is still held when the domain is recorded (`supervise/windows.rs:81-107`). Writing the record without that proof would race a successor. The other route, the controller recording the domain after the binding, needs a new handshake before GO. Keep the helper. Its removal depends on an in-process Windows lock door (T1's area). B-1 shows the real Windows custody gap is the attempt lock, not the lease.
4. **Agent outcome wiring and `settle-attempt` screen judging.** I agree, with one order constraint. Terminal attempts have no capture files, so `stdoutText` / `stderrText` fall back to the screen (`:202,205`), and the evaluator's login and quota tail reads that. The receipt must name `blocked:login|usage-limit` before the screen read is deleted; otherwise a dead login settles as a plain failure, and no account is rotated. The deletion and the 04a contract change should land in one change.
5. **Windows and macOS dead fields.**
   - Put `#[cfg(unix)]` on `gate.rs` `Config.{terminal, mutating, outbox_dir, orphan_settle, identity}` and their initializers. The Windows supervisor already refuses terminal mode, so their validation is not needed there.
   - Put `#[cfg(unix)]` on `supervise.rs` `Watch.outbox`, which only the Unix-only `terminal.rs` reads.
   - On darwin, `gate_tuple`'s non-Linux branch consumes `sandboxed` the way it already consumes `stream` (`terminal.rs:262`).
   - No `allow` anywhere. Then check msvc and aarch64-apple-darwin.

## Proposed additions (owner picks)

- **P1. Close an attempt whose release is gone.** Problem: B-3. An attempt bound to a removed dev host never closes; `run-attempts-stuck` stays red on fg-server2, and the remedy it prints is impossible. Benefit: doctor returns to green with an audit trail.
  - Shape: the existing `fgos dispatch recover` gets one intent, `abandon-attempt`. It publishes the receipt `abandoned-release-gone` and `closed.json` under the attempt lock, only when the lock is free, the domain is empty and the release paths are gone.
  - Cost: Rust +30, Node +15 and one test.
  - Without P1, B-3's warn rule is the whole fix.

## Net size estimate (my proposals only)

| | Node | Rust | Tests |
|---|---|---|---|
| B-1, B-2, B-4, B-5, B-7, B-8, B-9, B-10, dead fields | −10 | +25 | +20 (extended cases in existing files) |
| Delete list items 1-5 (when accepted) | about −270 | 0 | about −120 (`legacy-sweep.test`, screen cases) |
| Doctor fold 8 → 4 | about −40 | 0 | about −20 |
| P1 (only if picked) | +15 | +30 | +15 |

Layer total without P1: about −380 lines.

## Unresolved questions

- B-1 needs a Windows run to reproduce. Is a Windows machine available before T4 lands, or does the fix land on the reasoning above with the extended portable test as its proof?
- B-6 belongs to T5. Should it be recorded as a backlog row now (trust-store read-modify-write against `~/.claude.json`)?
