# B6 gate and lock-table fixes

B6a: the Linux terminal gate now arms `PR_SET_PDEATHSIG(SIGKILL)` itself before GO and before spawning the agent. The process-control primitive checks syscall failure and rechecks the visible parent; direct gates remain unchanged. No external tool, configuration, or setup/doctor dependency was added. The containment fixture uses the same primitive before exec; cleanup guards kill its namespace even on assertion failure. A separate production-gate regression kills the monitor, checks the gate identity is dead, and checks that a heartbeat stops; its agent ignores terminal HUP so a tty hangup alone cannot satisfy the assertion.

B6b: the existing reader now reads one open `/proc/locks` seq_file through EOF. Release still confirms absence with the independent shared-lock probe. The holder-lock spec and one stale release comment describe the non-atomic EOF read. The real multi-page regression holds 256 disjoint ranges and waits for one complete observation, since unrelated concurrent changes can move rows between pages. The old reader returned only 75/256 and failed this assertion; the fixed reader passes. Reused the existing parser, fixture, signal-by-identity cleanup and release probe.

Prior art: `c9c378839` introduced the prefix reader and probe; `6a3cdee84` introduced terminal containment. The probe is deliberately preserved. One triage source claim needs correction: [upstream bubblewrap v0.11.1](https://raw.githubusercontent.com/containers/bubblewrap/v0.11.1/bubblewrap.c) calls `handle_die_with_parent()` in the launcher, reaper, and before exec (lines 2970, 591, 3354), rather than only in the reaper. Our source did rely on bwrap instead of arming the gate. Owning the signal follows the coordinator decision, but this sandbox cannot independently reproduce the reported host failure or identify why that host loses the signal.

Validation:

- `cargo test -p fgos-process -p fgos-holder-lock -p fgos-run-supervisor -- --test-threads=4`: passed.
- Same command with default parallelism: passed.
- `cargo clippy -p fgos-process -p fgos-holder-lock -p fgos-run-supervisor --all-targets -- -D warnings`: passed.
- Focused lock-page regression: original reader fails, EOF reader passes. Focused containment and production gate binaries compile and pass their available tests.
- `git diff --check`: passed. Impact-analysis: inactive (zero registered providers).

Limits: bwrap explicitly reports “No permissions to create a new namespace”; namespace tests take their existing capability skips. The coordinator must rerun the host gate, including both parent-death regressions. `getppid()` is zero for a parent outside the namespace: its recheck cannot prove a monitor did not die before signal registration; the existing GO channel detects supervisor loss but does not close that distinct monitor-startup race. No npm or cross-platform host gate was run. MDView preview failed because its database is read-only.

Scope: CHANGELOG updated; ancillary one-line change is the stale holder-lock release comment. No out-of-scope file edits, staging, or commits. Coordinator follow-up writes: `docs/platform/process/spec.md`, `docs/platform/run-supervisor/spec.md`, and the program-board row (`plans/261017-1313-fgos-platform-program-board/plan.md`) are outside the permitted write scope.

Status: DONE_WITH_CONCERNS
Summary: Implemented the dependency-free gate signal and EOF lock-table fixes with real regressions; both requested test modes and clippy pass in this sandbox.
Concerns/Blockers: Host namespace verification, upstream-source discrepancy, hidden-parent startup race, and out-of-scope spec/board updates remain for the coordinator.
Context refs:
- (none)
