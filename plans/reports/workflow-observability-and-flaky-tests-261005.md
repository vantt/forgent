# Detached workflow observability and two load-flaky tests

## Task 1: detached run observable (commit 8d89f238a)

Change (src/workflow/runner.mjs):
- `statusWorkflow` now returns the projected state plus `advance: { running, pid, logPath, lastLines?, hint? }`. `running`/`pid` come from the existing `liveAdvanceHolder` (no second liveness check; a holder still writing its pid is `running: true, pid: null`). `lastLines` is the last 20 lines of `advance.log`, each capped at 300 chars, present only when the run is not `completed` and the log is non-empty (reads at most the last 64 KiB). `hint` is set when status is `running`, no live holder, and the last event is older than 30 s; it says the advance is not running and names `fgos workflow resume <id>`.
- `advanceWorkflowRun` records every event through a small wrapper that also hands step start, complete, fail and gate park to `onLog` as one line (`[ts] step <id> started|completed|failed: <reason>|parked, waiting for an answer`). The lines are derived from the events being appended; no second store.
- The detached child gets env `FGOS_WORKFLOW_ADVANCE_DETACHED=1`; only then is the default `onLog` stderr (which is advance.log). A foreground advance prints nothing extra (its stdout stays the JSON result); an explicit `onLog` still works.
- Docs: docs/specs/runner.md (start-detach paragraph), CHANGELOG [Unreleased], `workflow` help text in src/cli/command-registry.mjs.

Tests (test/workflow/workflow-runner.test.mjs, written first and seen red): live holder + 20-line/300-char tail; no hint while recent or parked; dead-pid lock + old last event gives `running: false` + resume hint + readable log; live holder suppresses hint; completed run has no tail; CLI detached child logs exactly one start and one end line per step and `workflow status` prints the block; foreground writes no log file and an explicit `onLog` gets the lines.
Run: workflow-runner, discussion-workflows, architecture-advisory-workflow, command-registry, fgos-help, fgos-manifest, rust-host command-routes: all pass (43 + 38).

## Task 2: flaky tests

### runWatch catches a runOnce throw (fixed)
Cause (reproduced deterministically): the test threw on "the first log call". The first log call in a cycle is machine-dependent: the startup reap logs `reaped N orphaned confinement resource dir(s)` when other processes left old empty dirs in `<tmpdir>/fgos-confinement`; that log sits inside the reap's own try/catch, so the throw was swallowed and the cycle ended `idle` instead of `error` (`'idle' !== 'error'`). Under a full suite other tests leave such dirs. Reproduced by pointing TMPDIR at a dir with one old empty orphan: original test fails with exactly that message, fixed test passes.
Fix: throw once on the idle line (`frontier empty`), which every empty cycle reaches outside any catch. Assertions unchanged. No sleep or number changed.
Stability: 10/10 alone; 5 rounds x 2 parallel copies under a CPU hog (64 busy node processes on 16 cores): 10/10 pass; also passes with the orphan dir present.

### dispatch CLI execute ... genuinely concurrent invocations under the same --work id (NOT fixed, could not reproduce)
Read the test and the path it drives (`claimAssignmentId`, per-cwd dispatch lock, assignment runner). The test has no sleep and no deadline of its own; the id claim is an atomic `mkdir`; read-only inline contracts pass `sharedCwd` so the per-cwd lock does not apply. The only wall-clock input, config `timeoutMs: 5000`, makes no difference (test still passes with 1 ms and 50 ms). Also passes with `CLAUDE_CODE_SESSION_ID` set.
Evidence gathered: 10/10 alone; about 190 runs under the CPU hog at parallelism 2, 8 and 12 (plus 6 parallel copies of the whole 75-test file): 0 failures, and a temporary probe that dumped exit code/stdout/stderr of a rejected child never fired. I made no change to this test rather than guess at a cause or raise a number. If it fails again, the failing child's stderr (error message) is the missing evidence; the likely candidates are a child exiting non-zero from a shared-state race (work event log, confinement temp reaper removing a young empty dispatch dir, grace 600 s) rather than the test's timing.

## Concerns
- Task 2 second test is unresolved for lack of a reproduction; the lead's failure message would settle it.
- `hint` uses a 30 s staleness threshold (constant `ADVANCE_STALE_MS`); a child that is alive but between slow events never trips it because a live lock holder suppresses the hint.
- Temporary probes and scripts lived in /tmp only; no background processes left.

Status: DONE_WITH_CONCERNS
