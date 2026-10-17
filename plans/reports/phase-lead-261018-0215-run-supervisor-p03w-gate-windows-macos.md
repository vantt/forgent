# Phase report: run supervisor P03w, gate on Windows and macOS

Status: DONE. Branch `run-supervisor/p03w-gate-win-mac` merged into `run-supervisor/integration` (merge `92b67e14d`, report commit follows).

## Delivered
- `gate.rs` split: shared part (argv, envelope, GO check, ceiling, stop cause, `gate-exit.json`), `gate/unix.rs` (Linux logic unchanged, diffed by reviewer), `gate/windows.rs` (new).
- Windows gate: member of the attempt job, opens it by name (`open_job`, second holder) and checks membership; agent spawned suspended with the inherited-handle list (`windows_spawn::spawn`, stdio only) into a nested kill-on-close job of the gate's own, so ending the agent tree never ends the gate (the gate is a member of the outer job, `TerminateJobObject` on it would kill the gate). Stop = polled `stop-requested.json` (20 ms), console break then terminate nested job after `gateKillGraceMs`; hard ceiling; agent exit -> terminate nested job -> wait (10 s bound) until `job_view.live_pids` holds only the gate -> `gate-exit.json` once.
- `go_pipe.rs` (Windows): named pipe `listen/accept/connect` for `--go-socket`; the gate takes `--job-name`. `--lock-fds` refused on Windows (lock is job-scoped).
- macOS: sweep after agent exit now judges `domain_is_empty(MacosTree)` and is bounded (10 s) instead of `tree_empty = true`.
- `gate::boottime_ns` is public (Windows: `GetTickCount64` ms * 1e6; no boot id on Windows, not compared).
- Tests on every OS: `tests/gate_portable.rs` + `tests/portable/mod.rs` + `examples/gate_agent.rs` (plain Rust agent: say/sleep/stubborn/tree/orphan). Cases: GO before agent and capture files, gate-exit once, wrong digest -> 65, EOF before GO -> 64, stop ends agent + child inside grace and names cause, stubborn agent killed after grace, ceiling with no supervisor, orphaned child dies with gate; Linux also a `setsid` child.
- Contract `internal-route.run-supervisor.v1.json`: `go-socket`, `windows-job`, `macos-tree` entries.
- Pre-existing macOS failure fixed: `steps_runner::a_step_holds_no_lock_description` reads `/proc`, now Linux-only; `tests/support` boottime clock portable.

## Evidence
- CI run 39061644227, head `5b7feae4f`, workflow process-containment: ubuntu, macos, windows all success. gate_portable: windows 8/8, macos 8/8, ubuntu 9/9.
- First run 39061211384: windows+ubuntu green, macos red only on the `/proc` step test (fixed above).
- Integration worktree after merge: `cargo test -p fgos-run-supervisor -p fgos-process` exit 0, 105 passed, 0 failed (includes gate_go 5, gate_ceiling 4, gate_pid1 9, gate_portable 9, steps_runner 5, supervise_* 9); `node --test test/run-supervisor/contracts.test.mjs` 6/6. `cargo check --tests --examples` clean for x86_64-pc-windows-msvc and aarch64-apple-darwin.
- GitNexus impact: index stale, MCP not loaded; grep: callers of `gate::run` are `route.rs` and the example harness, signature unchanged. No HIGH/CRITICAL.

## Review (Sonnet code-reviewer)
No defect in Linux path or Windows crash class. Fixed: escalation not retried when `TerminateJobObject` refused; stop file parsed twice; undeclared windows-sys features; macOS bound overshoot; ceiling test slack too tight (now 6 s ceiling, 5.5 s assert); contract JSON reformat noise (restored). Contract wording for macOS corrected (tree scan only while the agent identity resolves).

## Decisions
- Windows stop signal = `stop-requested.json` polling, no new frame on GO (no contract change to GO).
- Windows exit record: `exitCode` = OS code, `signal` null; agent ended by the gate shows exit code 1.
- Polite stop is best effort (`GenerateConsoleCtrlEvent` only works with a console); the guarantee is terminate after grace; tests cover that path only.
- Workflow already ran `cargo test -p fgos-process -p fgos-run-supervisor` on three OS, so gate tests need no workflow edit.

## Open / for later phases
- No Windows supervisor yet (`supervise.rs` is unix-only): the Windows supervisor must create the pipe before spawning, pass `--job-name` from `WindowsJobDriver::job_name`, write `stop-requested.json` to stop, and compute `boottimeNs` with `gate::boottime_ns`.
- macOS keeps the named escape: a descendant that left the group via setsid/double fork is not found after the agent dies.
- Console-break path untested on CI (no console on runners).

## Unresolved questions
None blocking.
