# Controller death follow-ups: review findings 3-6 and the pruned-host adopt case

Branch `worktree-agent-a2405e5c58972d229`, base `308c878f3`. Prior art read: the P07A report ("Independent review", "Concerns"), the landing report "Open", `docs/specs/runner.md` D-ADR0060, `docs/platform/run-supervisor/spec.md` 9.1. `git log -S` on `installCancelOnSignal`, `holdCancelOnSignal` and `cancelWaitMs` shows one introducing change (6.4) and nothing removed earlier, so there is no older mechanism to reuse.

## Outcome per item

| # | Item | Decision | Why |
|---|---|---|---|
| 1 | Finding 3: run continues into a commit or reviewer after the first signal | **Fixed, tested** | The registry keeps the cancel request for the life of the process. `assertNotCancelled()` runs before every new step of `runUnit`: unit start, every role (`runRole`), each dispatch attempt, each runner commit (also the commit-only resume), the verify command, the sync merge, and the supervisor launch (`beginLaunch`). It throws `RunCancelledError`; the unit settlement is skipped for that error, so the unit stays as a dead controller leaves it (`awaiting-resume`), and a pass whose commit never started is picked up by the resume as a pending commit. |
| 2 | Finding 4: signal before the supervisor binds cancels nothing | **Fixed, tested** | The attempt being handed over is now tracked from before the supervisor spawn until its binding is known (`beginLaunch` / `endLaunch`, registered with the binding before the launch ends, so no gap). The handler waits for it, cancels it once bound, and prints the resume line for every unit it saw; a signal that came before the hand-over refuses the launch. A launch that fails before any binding ends the wait. |
| 3 | Finding 5: malformed `dispatch.cancelWaitMs` threw a bare Error | **Fixed, tested** | `readCancelWaitMs` (and `readGateKillGraceMs`, same file, same defect) throw `RunnerConfigError` (category `validation`) with codes `invalid-cancel-wait` / `invalid-gate-kill-grace`; the message is the one `cancelWaitProblem` gives, which the `cancel-wait` doctor check prints. |
| 4 | Finding 6: process-wide SIGINT/SIGTERM handlers in `runUnit` | **Fixed, tested** | Handlers are installed only when the process asked: `bin/fgos.mjs` calls `enableCancelOnSignal()` at `main()`. The flag lives in its own leaf (`src/run-supervisor/cancel-opt-in.mjs`) so the CLI does not load the registry (about 11 ms cold) on every verb. An in-process caller keeps its handlers; a test pins that the listener counts do not change during a run. |
| 5 | `adopt` fallback when the envelope's `hostBin` release was pruned | **Fallback closed with reason; named diagnosis added** | The envelope binds every step to the host that wrote it: `host_bin_is_current` in the supervisor and in `attempt-step`, and the envelope digest. Running the steps with the active host would relax a settled safety check and need a Rust change, which is bigger than the risk (the steps after a receipt are settle/cleanup, and the attempt's result is already published by the active host's own receipt). Smallest safe behaviour: `run-attempts-stuck` (check and fix output) says the release was removed, names the path, and gives the remedy: restore that release directory, then run `fgos doctor --fix` again. No Rust change. |

Not changed: gate-lost fail-closed, receipt CAS, the recover door, the second-signal-exits-at-once rule.

## Tests (red first where a behaviour changed)
- `test/runner/execution/run.test.mjs`: signal during unit set-up stops before any seat and leaves `unit.json` unsettled (`execution: running`, no bindings); a unit started after a signal is refused before anything is created; `runUnit` leaves SIGINT/SIGTERM listener counts unchanged without the opt-in. Red-first caveat: the old sources were put back and the new tests failed to load (they import the new cancel API), which shows the missing capability but not each assertion failing alone; the three behaviours were each asserted with the new code and the old code has none of them by construction (no flag, no guard, handlers always installed).
- `test/run-supervisor/cancel-registry.test.mjs`: handover waits for the binding then cancels and names the unit; a failed launch ends the wait and prints the resume line; after a signal `beginLaunch` and `assertNotCancelled` throw `RunCancelledError`; the real-process cases (SIGINT, double SIGINT, SIGTERM) now run the real `bin/fgos.mjs`, whose own opt-in installs the handler (the old fixture installed a second handler itself and is deleted).
- `test/setup/run-supervisor-checks.test.mjs`: both readers throw the named error; the doctor check prints the same words; an attempt with a removed release is named with the remedy by check and fix, one whose release exists is not blamed.

## Verification
Private host built from this tree into `.fgos/runtime/verify-target-cd64` (`cargo build --release --workspace`), env `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID` unset, no real model rounds.
- Touched-module tests: `cancel-registry` + `run.test.mjs` + `run-supervisor-checks`: 116 tests, 116 pass (the bwrap real-process cancel cases ran, none skipped). `test/architecture.test.mjs`: 29 of 29 (the new leaf needed its manifest row; the import-direction guard accepts `gate-kill-grace` importing `RunnerConfigError`).
- Full `npm test` on the tip with the private host: 8302 tests, 8127 pass, 79 fail, 31 skipped. The 79 split as follows, each proved not to come from this change:
  - 72 in `test/rust-host/fgctl-*`, `release-*` and `fences-rust-locks`: the run had no `fgctl` binary or node addon at the worktree's build path. After building the workspace into the private dir and linking the worktree build path to it, those files (159 tests with the two fences files) gave 157 pass, 1 fail, 1 skipped.
  - `fences-v1-tombstone` (known failure in worktrees) and `skill-wrappers` (known): same on a pristine export of the base commit (`fences-v1-tombstone` 0 of 7 pass there, `skill-wrappers` 125 of 127).
  - `active-release-drift-check` (1 fail) and `release-targets` (1 fail): identical on the pristine base export.
  - `spawn-worker`, `operation-choice` (one test each, idle timeout and validate-plan warning), `event-store-checks`, `hot-lock-multiprocess`: fail only inside the full run (load); run alone they pass (18/18, 154/154, 11/11, 6/6) on this tree.
- `crash-matrix-adopt-resume` (known load-sensitive) was not among the failures.

## Docs
`docs/platform/run-supervisor/spec.md` (9.1 row, `cancelWaitMs` key, history), `docs/specs/runner.md` (D-ADR0060 decision 6), `docs/io-contract.md`, `CHANGELOG.md` `[Unreleased]`, `docs/architecture-manifest.json` (new leaf). No component-boundary change.

## Ideas not done (owner's choice)
- Rust `adopt` could report a removed host as its own verdict code (`host-gone`) instead of the step error text; doctor would then not need to read the envelope. Real problem: the doctor reads envelope.json itself, a second reader of that file next to the Rust one. Not done: touches the route contract.

## Unresolved
- The host binary named in the brief (`landing-git01-cargo`) predates `lock-fd --predecessor-kinds` and fails custody tests in this tree; a private host was built from this tree into `verify-target-cd64` and used for every run.
