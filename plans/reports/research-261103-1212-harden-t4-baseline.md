# HARDEN T4 baseline: Run Supervisor and Launch gate

Main SHA `e078ca201` (branch main, activated release `sha256:dad6536d…`), measured 2026-11-03 12:12 to 12:35 (Asia/Saigon) on the second machine fg-server2. Load average was 0.5 to 2.2 for the Rust and batch runs and rose to 4.9 near the end of the per-file Node loop, always below the 12 limit. Read-only work except this report. Other sessions were running on the same checkout during the measurement (see section 2, leak notes).

## Summary

| Item | Value |
|---|---|
| Rust crate `packages/run-supervisor/rust` | src 4 677 lines (17 files), tests 4 757 lines (19 test files plus `support/`, `portable/`, one example); total 9 434 (phase file said 9 353) |
| Rust tests | 134 pass (17 unit, 117 integration), about 128 s of test time, 126 to 128 s wall; two files are 57 s and 36 s |
| Node around it | `src/run-supervisor` 1 493 lines (15 files); attempt supervision in `src/runner/dispatch` 3 998 lines (5 files named in the phase) |
| Node tests for it | 171 tests in 20 files (`test/run-supervisor`), 170 pass, 1 skipped (Windows only); 159 s in one batch, 561 s when run one file at a time |
| Doctor rows | 8 rows; 7 pass, 1 fails (`run-attempts-stuck`, one stuck attempt); `fgos doctor --json` takes 51 s whole |
| Host wiring | 1 call site in `apps/fgos/src/main.rs:203-209`; the crate owns 4 internal routes |
| Windows and macOS warnings | msvc: 2 warnings (6 dead fields); darwin: 1 warning (unused `sandboxed`); Linux: 0 |
| Open backlog rows | 2 proposed rows touch the layer (`p-d2dc4f2e`, `p-4bkfiw7d3j`); `p-e6425aa9` is a stale follow-up list |

The facts that matter most for the council:

1. The `attempt-step` Rust route already exists and is used, but it only starts a Node child (`node src/run-supervisor/attempt-step.mjs`); the step logic itself (settle, finalize-home, cleanup-trust, release slot) is Node. So R5's "Rust already exists" means the launcher exists, not the steps. One seat attempt runs up to four such steps (section 5).
2. The Node run-supervisor tests are 171 against 134 Rust tests, and three Node files (`crash-matrix-adopt-resume`, `terminal-cutover`, `direct-crash-matrix`) are 159 s, 122 s and 91 s alone. They are real end-to-end crash matrices, not mirrors, but several of their rows also have a Rust proof (section 3).
3. `legacy-sweep.mjs` has exactly one production caller, the doctor fix for `legacy-attempts-stuck`. The row passes today. The machine holds 90 `asgn_*` run directories; 48 lack a v3 envelope (section 6).

## 1. Lines of code

Counted with `wc -l`.

Rust src (`packages/run-supervisor/rust/src`):

| File | Lines |
|---|---|
| `supervise/terminal.rs` | 790 |
| `gate/unix.rs` | 746 |
| `supervise.rs` | 568 |
| `gate.rs` | 398 |
| `steps.rs` | 345 |
| `adopt.rs` | 337 |
| `gate/windows.rs` | 248 |
| `supervise/windows.rs` | 238 |
| `supervise/unix.rs` | 205 |
| `route.rs` | 168 |
| `terminal_slot.rs` | 149 |
| `go_channel.rs` 118, `publish.rs` 103, `envelope.rs` 81, `attempt_step.rs` 75, `go_pipe.rs` 68, `lib.rs` 40 | 485 |
| Total | 4 677 |

Windows-only files (`gate/windows.rs`, `supervise/windows.rs`) are 486 lines of this.

Rust tests (4 757 lines): largest `supervise_terminal_fake_herdr.rs` 361, `portable/mod.rs` 309, `gate_terminal_socket.rs` 299, `support/mod.rs` 281, `supervise_portable.rs` 277, `portable/supervisor.rs` 262, `gate_pid1.rs` 258, `support/terminal.rs` 246, `adopt_matrix.rs` 238, `support/supervisor.rs` 228, `gate_portable.rs` 211, `support/adopt_fixture.rs` 198, `supervise_lifecycle.rs` 196, `release_slot_step.rs` 190, `examples/gate_agent.rs` 167. Helper code (`support/`, `portable/`) is about 1 400 lines, near a third of the test lines; `support/mod.rs` and `portable/mod.rs` both define `wait_for`, and `support/supervisor.rs` and `portable/supervisor.rs` both define `wait_until`.

Node `src/run-supervisor` (1 493 lines): `direct-launch.mjs` 399, `settle-attempt.mjs` 255, `legacy-sweep.mjs` 154, `cancel-registry.mjs` 141, `client.mjs` 109, `attempt-step.mjs` 102, `gate-kill-grace.mjs` 94, `runtime-dir.mjs` 58, `payload-root.mjs` 52, `step-support.mjs` 46, `cleanup-trust.mjs` 30, `sweep.mjs` 24, `finalize-home.mjs` 13, `cancel-opt-in.mjs` 12, `protocol.mjs` 4. The phase file said 1 491 lines.

Attempt supervision in `src/runner/dispatch`: `assignment-runner.mjs` 2 308 (phase file said 2 672), `transport.mjs` 708, `herdr-round.mjs` 495, `run-lock.mjs` 384 (said 452), `terminal-slot.mjs` 103. Total 3 998. Setup-side: `src/setup/run-supervisor-checks.mjs` (reads `/proc/net/unix` at the T0 hand-over) and the registrations at `src/setup/registrations.mjs:2059-2100`.

Host wiring in `apps/fgos/src`: only `main.rs:203-209` (7 lines): after the seat-binding route it calls `fgos_run_supervisor::route::main(route, args)` and falls through to `fgos_holder_lock::route::main`. The crate's `route.rs:128-142` matches `supervise | gate | adopt | attempt-step`.

## 2. Tests

### 2.1 Rust (`cargo build -q --examples && cargo test -q`, private target dir)

Build with a cold private target dir took about 3.4 s wall (dependencies compiled earlier in the build step). Whole `cargo test` wall 2:07.9 (first run), 2:06 (second run).

| Test binary | Tests | Test time (s) |
|---|---|---|
| `gate_pid1` | 9 | 57.2 |
| `supervise_terminal_fake_herdr` | 10 | 35.5 |
| `gate_portable` | 10 | 6.5 |
| `supervise_portable` | 10 | 4.4 |
| `supervise_lifecycle` | 9 | 3.4 |
| `gate_orphan` | 4 | 3.0 |
| `supervise_guard` | 1 | 2.6 |
| `supervise_crash` | 1 | 2.6 |
| `gate_ceiling` | 4 | 2.5 |
| `release_slot_step` | 9 | 2.2 |
| `gate_terminal_socket` | 13 | 1.9 |
| `adopt_concurrency` | 2 | 1.5 |
| `steps_portable` | 3 | 1.5 |
| `steps_runner` | 5 | 0.6 |
| `unix_lease_record`, `adopt_matrix`, `adopt_scan_perf`, `gate_go`, `envelope_digest_vectors`, lib unit | 3, 13, 2, 5, 4, 17 | 0.2 or less each |

Total 134 passing, about 128 s of test time. Two files are 72 percent of it. Both are dominated by fixed sleeps and polling (section 3.2).

### 2.2 Node (`test/run-supervisor/*.test.mjs`)

One batch of all 20 files through `scripts/run-tests.mjs` (with `HERDR*` and `CLAUDE*` variables unset): 171 tests, 170 pass, 0 fail, 1 skipped, 158.9 s of test time, 2:45 wall. Then the same files one at a time (each run is one `run-tests` call, so the times include about 1.5 s of startup):

| File | Tests | Test time (s) |
|---|---|---|
| `crash-matrix-adopt-resume` | 30 | 158.4 |
| `terminal-cutover` | 9 | 120.2 |
| `direct-crash-matrix` | 13 | 89.4 |
| `resume-adopts` | 9 | 49.9 |
| `terminal-fallback` | 4 | 29.2 |
| `terminal-crash-matrix` | 3 | 28.0 |
| `terminal-groups` | 15 | 11.0 |
| `cancel-registry` | 11 | 7.5 |
| `direct-cutover` | 10 | 3.4 |
| `sweep` | 6 | 1.9 |
| `inspect-recover-adopt` | 10 | 1.4 |
| `attempt-steps` | 11 | 0.8 |
| `legacy-sweep` | 6 | 0.4 |
| `adopt-client` 3, `bwrap-driver` 8 | 11 | 0.3 each |
| `contracts*` (3 files, 18 tests), `runtime-dir` 4, `windows-custody` 1 (skipped) | 23 | 0.2 each |

The sum of the per-file runs is 561 s; the batch is 159 s because `run-tests` runs files concurrently, and one file (`crash-matrix-adopt-resume`, 158 s) sets the floor. `crash-matrix-adopt-resume` runs 3 test bodies over a mode and row matrix (30 tests).

Leak notes: the batch run ended with `run-tests: ERROR: test suite leaked ... into .fgos store` listing added files under `.fgos/assignments/unit-run-1793682937947-6e6e6187` and `unit-run-1793682850509-def2cef2`. Those ids decode to 12:15:37 and 12:14:10, before my batch finished, and a `timeout 1500 fgos run Independent code review...` process from another session was alive then (pid 1534134). I treat this as another session's real run in the shared checkout, not a leak of these tests; I could not prove it per file. The per-file loop showed the same ERROR on 8 files (`cancel-registry`, `crash-matrix-adopt-resume`, `direct-crash-matrix`, `direct-cutover`, `resume-adopts`, `sweep`, `terminal-crash-matrix`, `terminal-cutover`), which also overlapped other sessions' runs. All tests still passed. A clean attribution needs a run on a quiet checkout.

## 3. Duplicate proofs and time-based waits

### 3.1 Behaviours proven in both Node and Rust

Rust owns the lowest layer for each row below; the Node row is an end-to-end or wiring proof unless noted. This is a list for the council, not a verdict.

| Behaviour | Node proof | Rust proof |
|---|---|---|
| A soft deadline stops the agent and its descendants | `direct-crash-matrix` "4. the soft deadline passes after the controller died..." | `supervise_lifecycle::a_soft_deadline_stops_the_agent_and_every_descendant`, `supervise_portable::a_soft_deadline_stops_the_agent_and_its_children` |
| A cancel request ends the attempt as cancelled | `direct-crash-matrix` 2 and 2b; `cancel-registry` 1, 3 | `supervise_lifecycle::a_cancel_request_ends_the_attempt_as_cancelled`, `supervise_portable::a_cancel_request_ends_the_attempt_as_cancelled` |
| A supervisor killed midway leaves the agent running and the lock held | `direct-crash-matrix` 3 | `supervise_crash`, `supervise_portable::a_supervisor_killed_midway_...` |
| The hard ceiling is enforced with no supervisor | `direct-crash-matrix` 5 | `gate_ceiling::the_hard_ceiling_is_enforced_with_no_supervisor_left`, `gate_portable` same title |
| Two adopters over one attempt: one adopts, steps run once | `direct-crash-matrix` 6; `crash-matrix-adopt-resume` "two adopters at once"; `sweep` "two adopters over one dead attempt remove its home once" | `adopt_concurrency::adopt_racing_adopters_leave_exactly_one_winner_and_one_run_of_each_step` |
| A dead controller before spawn: adopt closes it abandoned-not-started | `direct-crash-matrix` 7c | `adopt_matrix::adopt_no_binding_and_no_receipt_is_abandoned_not_started_and_the_steps_run_once` |
| No lock descriptor reaches the agent or a step | `direct-crash-matrix` 8; `direct-cutover` "the step environment carries ... never a lock description" | `gate_terminal_socket::neither_the_agent_nor_its_child_holds_a_lock_description`, `supervise_portable::neither_the_agent_nor_a_step_holds_a_handle_on_the_attempt_lock`, `steps_runner::a_step_holds_no_lock_description`, `gate_pid1::no_process_of_the_attempt_but_the_gate_holds_the_lock` |
| The gate is pid 1 of a fresh namespace | `bwrap-driver` "a direct launch has its own pid namespace as pid 1", "the prefix really puts the command at pid 1" | `gate_pid1::the_gate_is_pid_1_runs_the_agent_and_publishes_gate_exit_once` |
| A terminal attempt: supervisor killed after the brief, adopt releases the slot | `terminal-crash-matrix` 3 | `supervise_terminal_fake_herdr::a_supervisor_killed_after_the_brief_leaves_the_gate_running_and_adopt_releases_the_slot` |
| A terminal attempt: soft deadline stops the agent, pane closes | `terminal-crash-matrix` 2 | `supervise_terminal_fake_herdr::a_full_lifecycle_...` (pane closed once) |
| Clean attempt closes the pane once, a failed one keeps it | `terminal-cutover` first test; `attempt-steps` (release slot) | `release_slot_step::a_clean_attempt_closes_the_pane_once...`, `a_failed_attempt_keeps_the_pane` |
| A run from before the supervisor reads as legacy and nothing changes | `inspect-recover-adopt` "a run from before the supervisor reads legacy-run" | `adopt_matrix::adopt_a_run_dir_without_the_v3_layout_is_legacy_and_nothing_changes` |
| Envelope digest vectors | `contracts` "envelope digest vectors reproduce through the Node canonical JSON" | `envelope_digest_vectors` (4 tests) over the same golden vectors; this is a cross-language contract, keep both sides |

Node-only behaviours (no Rust twin): settle step and outbox judging (`attempt-steps`), finalize-home and cleanup-trust, `direct-launch` spawn and `waitForBinding`, cancel registry and signal handling, runtime dir, doctor-side sweep, resume (`--resume`), recover and inspect states, terminal placement and groups, brief rendering, fallback chain. Rust-only: the gate (go channel, ceiling, orphan, tty), steps runner, lease record, `adopt` matrix and scan performance.

### 3.2 Time-based waits

| Side | Count (grep over the folders) | Where |
|---|---|---|
| Node `test/run-supervisor` | 40 lines with `setTimeout` or promise sleeps; 79 lines naming `waitFor` / `waitUntil` / `poll` | `support/direct-harness.mjs:13-21` and `support/terminal-harness.mjs:19-27` each define `sleep` plus a polling loop; `helpers/kill-on-file.mjs:22` polls every 10 ms |
| Rust tests | 24 `thread::sleep` lines; 47 `wait_until` / `wait_for` calls | `gate_pid1.rs` (24 Duration lines, fixed 150 to 300 ms sleeps), `gate_portable.rs` (29), `gate_ceiling.rs` (11), `gate_orphan.rs` (9), `supervise_terminal_fake_herdr.rs` (7) |
| Rust src | 14 `thread::sleep` lines | in `supervise.rs`, `supervise/terminal.rs`, `steps.rs`, `adopt.rs`, `gate/*` polling loops |

The slowest binaries are exactly the ones with real deadlines under test (`gate_pid1` 57 s, the 36 s fake-herdr file); the sleeps there are the deadlines themselves, not padding. I did not read each sleep to classify padding versus bound.

## 4. Routes the layer owns

Internal routes, from `packages/run-supervisor/rust/src/route.rs:128-142`: `fgos internal supervise`, `gate`, `adopt`, `attempt-step`, each also answering `--probe --protocol 1`. They are internal; no user verb ends in this crate. Node reaches them through `src/run-supervisor/client.mjs`, `direct-launch.mjs` (spawn and envelope), `sweep.mjs` and `src/setup/run-supervisor-checks.mjs` (`ROUTES` list at line 30). Not timed individually: they need an attempt directory, and the task forbids starting runs or seats.

Doctor rows, from one `fgos doctor --json </dev/null` (51.2 s for the whole 150-row doctor; no per-row timing exists in the output):

| Row | Registration line | Status | Message |
|---|---|---|---|
| `process-containment` | 2059 | pass | `bwrap-pidns, level kernel` |
| `run-supervisor-route` | 2064 | pass | host serves supervise, gate, adopt, attempt-step at protocol 1 |
| `runtime-socket-dir` | 2069 | pass | `/run/user/1000/fgos` is 0700 and owned by uid 1000 |
| `run-attempts-stuck` | 2074 | **fail** | 1 attempt with no holder and no `closed.json`: `unit-run-1792482363495-797e4401/producer/1/run…` |
| `gate-kill-grace` | 2079 | pass | 10000 ms (default) |
| `legacy-attempts-stuck` | 2084 | pass | no run from before the supervisor left running |
| `units-awaiting-resume` | 2089 | pass (warning text) | 4 unit runs await resume |
| `cancel-wait` | 2094 | pass | 15000 ms (default) |

Fixes registered at lines 2098-2100: `runtime-socket-dir`, `run-attempts-stuck`, `legacy-attempts-stuck`. The phase file's line numbers (2340-2381) are stale; the rows moved to 2059-2100. I did not run `doctor --fix` (it would adopt the stuck attempt, a write). The failing `run-attempts-stuck` row is a real orphan on this machine from 2026-10-19 (unit-run id 1792482363); the council may want a decision on whether doctor should keep failing for an attempt that old.

## 5. Seat launch cost (received item R5)

Existing TEST evidence (not re-measured here): about 1.2 s per real seat launch, two Node child processes for `attempt-step` at 150 to 250 ms each, about 15 confined git calls; 466 launches across six test files; evidence in `plans/reports/phase-lead-261021-2137-test-governance-p3-exec.md`, main `b9e354f15`.

Read-only facts on main now:

- Where it is spawned: `src/run-supervisor/direct-launch.mjs:177` builds each step as `argv: ['internal', 'attempt-step', stepId, '--protocol', PROTOCOL, '--run-dir', runDir]` with `hostBin`, `payloadRoot` and `stepTimeoutMs` in the envelope. The Rust supervisor (`supervise.rs`, `steps.rs`) runs each envelope step in order after the receipt, skips a step that already has a receipt, and a step answering exit 75 asks for a retry.
- What the Rust route does: `packages/run-supervisor/rust/src/attempt_step.rs` (75 lines) checks the envelope, the host-bin match and `payloadRoot`, then spawns `node <payloadRoot>/src/run-supervisor/attempt-step.mjs <stepId> --run-dir <dir>` and returns its exit code. So each step is host process, then Node process. The route exists and is the only path in use; there is no direct-Node fallback (`run-supervisor-checks.mjs:263` says so).
- The Node entry then runs one of three step modules: `settle-attempt.mjs` (255 lines), `finalize-home.mjs` (13), `cleanup-trust.mjs` (30); the pane slot release is Rust (`steps.rs`, `terminal_slot.rs`, proven by `release_slot_step.rs`).
- Count of steps per attempt: whatever the envelope's `extraSteps` and the mode add (the envelope builder, `direct-launch.mjs:174-200`); I did not enumerate them per mode, so the "two Node children per seat" figure is TEST's and is not re-derived here. Moving the settle step into the host would remove its Node start, but `settle-attempt.mjs` also holds the screen judging the 04a hand-over deletes, so the order of the two changes matters.

## 6. Delete-candidate facts

### 6.1 `legacy-sweep.mjs` and `legacy-attempts-stuck`

- Production callers: one. `src/setup/run-supervisor-checks.mjs:24,377` imports `findLegacyStuck`, `judgeLegacyHolders` and `sweepLegacy` for the doctor check and its fix. Nothing else under `src`, `bin`, `apps` or `packages` imports it. `src/runner/dispatch/recovery-planner.mjs:98-240` has the separate `abandon-legacy` intent (which reads `legacy-run` states through the door, not this file).
- Tests: `test/run-supervisor/legacy-sweep.test.mjs` (6 tests, 0.4 s), the five legacy tests in `inspect-recover-adopt` and `resume-adopts` test 9, plus a guard line in `test/runner/assignment-enumerator-guard.test.mjs:85`.
- Last commit touching the file: `508d70005` (2026-10-18, `feat(run-supervisor): settle runs from before the supervisor ...`). Last touch to the doctor row group is the same family. Docs naming the row: `docs/platform/run-supervisor/spec.md`, `docs/specs/runner.md`, `docs/specs/distribution.md`, `docs/specs/reading-map.md`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`.
- Pre-supervisor run directories on this machine (count only, `.fgos/assignments`): 90 `asgn_*` directories, each with a `run.json` (88 `settled`, 2 `died`); 42 carry a v3 `envelope.json` and 48 do not. The 410 `unit*` directories hold 686 `run.json`, 455 `envelope.json`. The row passes today, so no run of the pre-supervisor kind is stuck running; the 2 `died` runs are the only ones the sweep could still touch and it already kept them or settled them.

### 6.2 `hold-transport.mjs` (Windows)

`src/holder-lock/hold-transport.mjs` (498 lines per the phase file) is imported by `src/holder-lock/index.mjs:55` (`startHold`, `waitReady`, `releaseHold`, `borrowSync`, `borrowAsync`, `clearDomainHold`, used at lines 292 and 324) and by three tests (`test/holder-lock/hold-transport-borrow.test.mjs`, `windows-facade.test.mjs`, `windows-borrow.test.mjs`), plus two import-graph lists in `test/runner/dispatch-reconciliation-import-graph.test.mjs:124,228`. The supervisor-side dependency the T1 red team named is still present: `cwdLeaseOwner` appears in `packages/run-supervisor/rust/src/supervise.rs`, `supervise/windows.rs`, `supervise/terminal.rs`, in `assignment-runner.mjs`, and in `packages/holder-lock/rust/src/{borrow_windows,route/hold,port}.rs`. Last commit on the file: `205f8a584` (2026-10-21, process-facts move). I did not check whether the supervisor could receive the domain another way.

### 6.3 Dead-field warnings from cross-target `cargo check`

Same private target dir, crate `packages/run-supervisor/rust`. Linux native: 0 warnings (the earlier test build compiled clean).

| Target | Warning | Location |
|---|---|---|
| `x86_64-pc-windows-msvc` | fields `terminal`, `mutating`, `outbox_dir`, `orphan_settle`, `identity` never read | `src/gate.rs:149-168`, struct `Config` |
| `x86_64-pc-windows-msvc` | field `outbox` never read | `src/supervise.rs:176-185`, struct `Watch` |
| `aarch64-apple-darwin` | unused variable `sandboxed` | `src/supervise/terminal.rs:251`, `gate_tuple` |

This matches the T3-04a hand-over exactly; nothing new appeared. The fix route named in the phase file (gate with the users' cfg, no `allow`) still applies. The `gate.rs` fields are read only by `gate/unix.rs`, which suggests they are Unix-only inputs of the shared `Config`.

## 7. Open backlog rows (`docs/backlog.md`, match on run-supervisor, supervisor, gate, adopt, attempt)

Most `gate` hits are Vietnamese STR rows about human gates or the merge gate and have nothing to do with this layer. The relevant rows:

| Row | Status | Relevance |
|---|---|---|
| `p-d2dc4f2e` (line 14) | proposed | An xai seat through herdr sometimes never starts, and the brief is typed into the shell (`terminal-launch-not-started`); same family as the pane-foreground fault; terminal launch path in `supervise/terminal.rs` and Node `herdr-round.mjs` |
| `p-4bkfiw7d3j` (line 64) | proposed | After a clean launch the agent sometimes loses the terminal foreground about 7 s in, and `foreground-not-agent` cancels the run; the gate and terminal supervisor |
| `p-e6425aa9` (line 57) | proposed | Five dispatch-liveness follow-ups from 2026-09-29 (`--force-new-attempt`, a SIGKILL probe test, lease reclaim); the names predate the supervisor, so the council should check which are already solved or obsolete |
| `p-f97bb935` (line 60) | done (main `82903e710`) | `foreground-not-agent` refuse-a-send; listed because it owns the fix the open row `p-4bkfiw7d3j` builds on |
| `p-6f17c807` (line 61) | closed, not reproduced | A pane agent starting in its runDir; no action |

No open row mentions adopt, `attempt-step`, `legacy-sweep` or the doctor rows by name.

## Things to know before the council

- Nothing was started: no seat, no run, no daemon. The private cargo target dir (`/home/vantt/projects/forgent-worktrees/harden-t4-baseline-cargo`) was deleted at the end (checked: not present). Node tests were run with `scripts/run-tests.mjs` on `test/run-supervisor/*.test.mjs` only.
- The working tree shows modified files under `packages/git/` that I did not touch (another session's work); `AGENTS.md` and `.claude/settings.json` were already modified at session start.
- Not measured: per-route cold/warm timings for the four internal routes (they need a real attempt), and the per-step count of `attempt-step` spawns per seat.
