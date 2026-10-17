# Phase report: run-supervisor p04w, supervise + step runner on Windows and macOS

Status: DONE_WITH_CONCERNS. Branch `run-supervisor/p04w-supervise-win-mac` merged into integration (`478c64ec6`, `--no-ff`).

## Built
- `supervise.rs`: one flow for every OS (envelope checks, driver, gate spawn, declare + binding, GO, watch, receipt, steps, closed). Platform parts behind small functions in `supervise/unix.rs` (inherited locks fd 3/4, socketpair GO, SIGTERM nudge) and `supervise/windows.rs` (self-taken locks, named-pipe GO, no signal, keeper record). Linux flow unchanged (reviewed ordering point by point).
- Windows: supervisor takes `attempt.lock` itself (`LockFileEx` is never inherited) and, when mutating, the lease named by optional `cwdLeaseFile`; `create` job, `spawn_in(gate)` with `--go-socket`/`--job-name`, supervisor = keeper in the declared record, stop = `stop-requested.json` (gate polls). The same domain record is declared on the cwd lease file (both locks die with the supervisor while the agent lives on in the job).
- macOS: same flow, `macos-tree` driver; no code beyond the shared flow was needed.
- `steps.rs`: shared `StepSpec`/`interpret`; Windows path = handle-list spawn (stdio only), env exactly `step.env`, own kill-on-close job per step, timeout terminates the job.
- AGENT frame drain when the gate leaves within a tick; `attempt_step` finds `node.exe` on Windows.
- adopt: start grace on Windows (60 s, from envelope `createdAt {bootId, boottimeNs}`, same boot only, never file times) so a lock-free unbound attempt is `running/starting`, not `abandoned-not-started`; `domain_of` re-polls ONE watch (bounded 1.5 s, Windows) because a closed job is judged by the tree, which needs consecutive quiet polls.
- Contracts: `optionalFields` (`cwdLeaseFile`, `createdAt`) in envelope v3; Windows notes in the supervise and adopt route entries.

## Tests
- Local, integration worktree after merge: `cargo test -p fgos-run-supervisor -p fgos-process -p fgos-holder-lock` exit 0, 164 passed 0 failed (includes supervise_portable 10, steps_portable 3, supervise_lifecycle 8, supervise_crash 1, steps_runner 5, adopt_matrix 11, adopt_concurrency 2, adopt_scan_perf 2, gate_* 9+9+5+4, lib 8). `node --test test/run-supervisor/contracts.test.mjs` 6/6. `cargo check --tests --examples` clean for x86_64-pc-windows-msvc and aarch64-apple-darwin.
- CI `process-containment`, run 39065942544, head `6f5a8dd37`: ubuntu, macos, windows all success. Earlier runs found and fixed: Windows crash+adopt red (one-shot domain judge, real cause above), other-boot test (Windows has no boot id), ubuntu unit test that subtracted from boot time.
- Cases on every OS: lifecycle (binding, receipt, steps in order, closed, lock free), supervisor killed -> agent finishes (exit 0) -> adopt settles from gate-exit (adopt probe-only says running while the domain lives), soft deadline -> `timeout` + child dead, cancel, no handle on the attempt lock in agent and step, hostBin mismatch exit 3, step exit 75 / hang, mutating lease freed when the gate is gone and guarded while the agent lives, instant agent still bound.
- Not run: `internal-routes.test.mjs` / `help-routes.test.mjs` with a phase-built host (no route change in `apps/fgos`; crate route dispatch signature unchanged).

## Review (Sonnet)
No Linux regression. Fixed: Windows lease not guarded after supervisor death (record declared on the lease), missing mutating tests, missing instant-agent test, crash test diagnostics. Not changed: accept thread stays blocked in `ConnectNamedPipe` if the gate never connects (process exits right after); `set_var` in `steps_portable` env test.

## Decisions
- Windows lock handover: supervisor acquires, controller must not hold. Window covered by adopt's `starting` grace (needs `createdAt`; P09 brief updated by the big lead).
- Windows GO channel is the named pipe chosen in the gate phase, not a handle-list inherited channel as the brief said.
- Windows keeper = supervisor; gate/agent unchanged from the gate phase.
- GitNexus impact: index stale, grep used. `supervise::run`/`route::main` signatures unchanged; `adopt::domain_of` is private. No HIGH/CRITICAL.

## Concerns
- A duplicate supervisor start for an attempt whose first supervisor died uses `acquire`, whose predecessor rule would end the live domain: intended by the lock design, untested here.
- Supervisor exits 70 `lock-held` after 10 s when the controller still holds the lock on Windows; adopt shows `starting` for 60 s then `abandoned-not-started` with the reason only in `supervisor.log`.
- macOS `macos-tree` keeps its named escape (setsid/double fork), unchanged.
- Windows console-break polite stop untested on CI (no console).

## Unresolved questions
- Should a step's `hostBin` be verified against the manifest (carried over from the supervise phase)?
- P09: where does the Windows controller write `cwdLeaseFile` from (dispatch-cwd lock path), and should it release `attempt.lock` only after spawning the supervisor?
