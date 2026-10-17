# Phase report: run supervisor P03, route `fgos internal gate`

Status: DONE_WITH_CONCERNS. Branch `run-supervisor/p03-gate` merged into `run-supervisor/integration` (merge `82a40e1d0`).

## Delivered
- `packages/run-supervisor/rust/src/{gate,go_channel,publish}.rs`: `gate::run(&[String]) -> i32` for P04 to call; framed GO channel; `publish_once` (temp file created exclusively, no symlink follow, fsync, `link(2)`, `EEXIST` keeps the first copy) and `iso_utc_now`.
- Gate: CLOEXEC on lock fds + GO fd before any other syscall; self-pipe handlers for SIGTERM/SIGINT/SIGCHLD; HELLO, wait for GO (EOF, bad frame or stop signal before GO: exit 64, agent never starts); attemptId + envelope digest check (exit 65); capture files append 0600 dup2'd to 1/2; stdin from brief or /dev/null; env = envelope env + side file env + `FGOS_PIDNS_ANCHOR` from GO; agent spawned by `spawn_with_fds` with empty map, own session; AGENT frame; stop cause from `stop-requested.json` (else cancel/`signal`); SIGTERM to agent group, SIGKILL `kill(-1)` after `gateKillGraceMs`; hard ceiling on CLOCK_BOOTTIME (other bootId = already over: agent never starts, gate-exit `hard-ceiling`); agent exit -> `kill(-1)` + reap to ECHILD -> gate-exit publish once -> exit 0. Lock fds are held until after the reap.
- Not pid 1 (`linux-pgroup`): gate becomes subreaper, sweeps its own /proc tree repeatedly until empty and ECHILD. `kill(-1)` is armed only when pid 1 AND envelope driver is `linux-gate`.
- macOS: agent group kill + `domain_kill_all(MacosTree)`, best effort, `cargo check` only. Windows: named `unsupported-platform` stub.
- `examples/gate_harness.rs` (runs `gate::run` as a process for the tests; not in the plan's file list, inside the owned crate).

## Carry-over from P01 (fixed)
`BwrapPidns::spawn_in` timeout/identity-failure paths killed only the bwrap monitor; the gate (pid 1, no `--die-with-parent`) kept running. Now `end_failed_spawn` kills every descendant of the monitor (the namespace init, which takes the namespace down) then the monitor. Test `containment_spawn_timeout.rs`: real bwrap through a wrapper script that drops `--info-fd`, so the namespace runs but the pid report never comes; 10 s timeout; asserts the gate command was alive during the wait and no process with its unique argument survives. Verified red without the fix (survivor pid), green with it.

## Decisions
- Exit codes follow the contract (64 no GO, 65 envelope/GO mismatch, 70 internal), not "3" in the phase file; 3 is host-version-mismatch.
- Anchor comes from GO (`gateHostTuple`), not argv.
- Agent AGENT-frame tuple is the namespace-side tuple (host pid unknowable inside the namespace).
- Windows gate deferred (needs a Windows host; `fgos run` on Windows is refused until the 4.4b lock driver, plan D7).

## Tests (Linux, real bwrap, real processes)
`cargo test -p fgos-run-supervisor -p fgos-process` on the phase branch and again on the integration worktree: all green.
- run-supervisor: lib 4, envelope_digest_vectors 2, gate_go 5, gate_ceiling 4, gate_pid1 9 (57 s) = 24 pass, 0 fail.
- fgos-process: lib 26, containment_bwrap 7, containment_pgroup 3, containment_spawn_timeout 1, holders_multiprocess 4, judge_vectors 2, signal_identity 7, spawn_fds_leak 6 (platform-gated files 0 tests) = all pass.
- Phase cases: 1 EOF before GO (gate_go), 2 wrong digest/attempt/tampered envelope (gate_go), 3 SIGTERM + stop-requested cause (gate_pid1), 4 ignore-SIGTERM -> SIGKILL after grace + ceiling without supervisor (gate_ceiling), 5 setsid grandchild dies with the gate (gate_pid1), 6 60 s attempt with 200 orphans, no persistent `Z` (gate_pid1), 7 no lock inode in agent/grandchild fds, gate holds it (gate_pid1), 8 gate-exit published once (gate_pid1 + publish unit).
- `cargo check -p fgos-run-supervisor --target x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: ok.
- Run the whole crate: a filtered `cargo test ... gate` does not build the example harness and fails with a missing binary.
- GitNexus impact: index stale; grep shows no non-test caller of `spawn_in`, so blast radius of the linux.rs change is nil today (P04 will add the first caller). No HIGH/CRITICAL.
- `node_modules` is absent in the phase worktree; not needed for these crate tests (full `npm test` is P12).

## Review (Sonnet code-reviewer)
Fixed: non-pid-1 sweep could hang on an orphan adopted after the first scan (M1); predictable, symlink-following publish temp file (M2); SIGTERM ignored while a GO frame is partial (L1); `kill(-1)` also tied to driver (L2); report() panic on closed stdout (L6); boot id read once (L10). Test added for the non-pid-1 path.
Open, for later phases: P04 must accept "gate exit without AGENT frame" (ceiling already passed) and "exit 70 with no gate-exit" (agent failed to start); `boottime_ns` duplicates a clock the supervisor must also use (candidate shared primitive in `fgos_process::facts`); no SIGINT test; no malformed stop-requested test; macOS sweep is weak (no subreaper); bwrap-dependent tests print a named skip when bwrap is missing, so CI must assert bwrap exists.

## Unresolved questions
None blocking.
