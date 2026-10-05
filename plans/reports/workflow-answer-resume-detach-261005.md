# workflow answer / resume: detach from the caller

## Change
- `fgos workflow answer` records the gate answer synchronously (a missing run or missing step/answer still fails at once), then hands advancing to a detached process and returns the run state plus `detached: { pid, logPath, statusCommand }`.
- `fgos workflow resume` returns the same way without recording anything.
- ONE mechanism: the detached process is `fgos workflow resume <id> --dir <root> [--worktree <p>] --foreground`. `start` now spawns that same command (the previous child command had no `--foreground`, which would have recursed once resume detaches). `--foreground` on any of start/answer/resume keeps today's in-process behaviour.
- Spawning is one helper (`spawnDetachedAdvance`) shared by `startWorkflowDetached`, new `answerWorkflowDetached`, new `resumeWorkflowDetached` (src/workflow/runner.mjs, exported from src/workflow/index.mjs). The code that builds unit objectives and inputs is untouched.
- Guard: before this change nothing stopped two processes advancing one run (the event store only appends). Added `<runDir>/advance.lock` holding the advancing pid: taken with an exclusive create around every foreground advance (`startWorkflow`, `answerWorkflow`, `resumeWorkflow`), a lock whose pid is dead is taken over, a live holder makes the second advance fail with `Workflow run "<id>" is already being advanced by process <pid>; read progress with "fgos workflow status <id>" ...`. The detached variants check before spawning and `answer` checks before recording, so a refused answer is not written to the log while another advance is live.
- Help: `foreground` param text and two examples in src/cli/command-registry.mjs. Spec: start-detach paragraph in docs/specs/runner.md extended (answer/resume, single mechanism, lock). CHANGELOG [Unreleased] line. Skills (core/skills only, then `npm run build:skills`): fgos-architecture-panel, fgos-group-thinking, fgos-panel, fgos-run; the build touched only those four skills' .agents/ and plugins/ copies.

## Decision sources
- Detach pattern and `--foreground` reuse: commit 1508a7d49 and its report; `fgos gateway start` (spawn detached, unref, log file).
- Lock/guard: no existing guard found in src/workflow/store.mjs (append-only, no lock); added the smallest one in runner.mjs to leave store.mjs alone for the concurrent change there.
- CLI output is wrapped in the `fgos.v1` envelope, run state is under `data` (verified by running the CLI).

## Tests
- Added in test/workflow/workflow-runner.test.mjs: CLI `answer` returns at once with the answer recorded and a detached process completes the run; CLI `resume` returns at once and the run completes with exactly one `workflow.complete` (no recursive advance); a live lock makes detached/foreground `resume` and `answer` refuse, records no gate answer, leaves the holder's lock alone; a lock of a dead pid is taken over and released afterwards.
- Updated test/workflow/discussion-workflows.test.mjs CLI `answer` call to pass `--foreground`.
- `env -u CLAUDE_CODE_SESSION_ID node --test` on workflow-runner, discussion-workflows, architecture-advisory-workflow, business-discussion-workflow (30 pass, 0 fail) and test/cli/{command-registry,fgos-help,fgos-manifest}.test.mjs + test/rust-host/command-routes.test.mjs (38 pass, 0 fail).
- Full suite NOT run: `free -m` showed 1389 MB free (below the 3000 MB bar; 10 GB available only as cache). Directory/glob test invocations were refused by the worktree guard, so test/workflow and test/cli were not run wholesale either.

## Concerns
- Pid-liveness lock: a recycled pid could make a stale lock look live; the message names the pid so it can be removed by hand. Check-then-spawn between the parent's pre-check and the child's lock is a tiny window; the child's exclusive create is authoritative and logs the refusal to advance.log.
- Skills/other callers that call `workflow answer`/`resume` and read a finished state right away must poll status or pass `--foreground`; none found in tests besides the one updated.
- node_modules/target symlinks were not needed for the tests run here.
