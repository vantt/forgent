# Final standard Node suite — 2026-10-06

## Invocation and scope

- Checkout: `/home/vantt/projects/worktrees/forgentX-single-door-execution`.
- Exact command: `env -u CLAUDE_CODE_SESSION_ID npm test`.
- Unmodified package command: `node scripts/run-tests.mjs`; recursive discovery of every `test/**/*.test.mjs`, without a selector, forwarded narrowing arguments, or added environment flags. No inherited `FGOS_TEST*` or `FGOS_FULL_SUITE*` flags were present.
- Durable stdout/stderr: [`final-npm-test.log`](final-npm-test.log), opened before spawning and written unbuffered throughout execution, including queue wait. Executed once; no reruns, source/test edits, repinning, lint, or formatting.
- Supervisor deadline: 3,600 seconds; process launched in its own session/process group, PID/PGID `3023610`. Deadline did not fire.

## Results

| Category | Count |
|---|---:|
| Tests | 6,948 |
| Suites | 22 |
| Passed | 6,875 |
| Failed | 0 |
| Cancelled | 0 |
| Skipped | 8 |
| TODO | 65 |

- Command exit: **0**.
- Wall elapsed including machine-wide queue: **584.358 seconds**.
- Runner-reported test duration: **372,666.506 ms**.
- Existing main-checkout suite held the queue (PID `2921914`); this run waited **210 seconds**, then acquired it normally. No bypass or interference with that owner.
- Full runner discovered the new behavioral tests through its existing recursive discovery; it was not narrowed to the new files or directories.
- No failing tests, watchdog timeout, or `.fgos` leakage error was reported. No failure diagnosis or assertion removal was needed.

## Recognized non-proof cases

New-file inclusion is confirmed by actual passing output, not discovery alone:

- `test/e2e/root-file-guard-hook.test.mjs`: log lines 1419–1427 (9 cases).
- `test/rust-host/dev-host.test.mjs`: log lines 5676–5685 (10 cases).
- `test/setup/active-release-drift-check.test.mjs`: log lines 6658–6712 (including explicit-dir equality and real-builder payload agreement).

Eight skipped cases remain unverified by this run:

1. Five bee coexistence canaries: real bee write-guard verdict map; git-less fixture without onboarding; same fixture with onboarding control; init detects/leaves bee untouched; real round footprint. All report **bee installation not found in this checkout** (log lines 1352–1356).
2. Live OpenAI executor self-identification: opt-in real codex CLI proof not enabled.
3. Live GLM executor self-identification: opt-in real Claude/GLM credential proof not enabled.
4. Live agy-herdr adapter: opt-in real interactive adapter proof not enabled.

The **65 TODO cases are not counted as executed behavioral proof**. They are marked migrated to existing direct test files: 24 `fgos-edit`, 28 `fgos-read`, and 13 `fgos-stage`. Their exact names and destination paths remain in the durable log. This report does not independently certify equivalence of those migrated tests.

Coverage instrumentation was not requested or run. Full npm success does not replace actual CLI/hook/signal/shim smokes or establish global release readiness. Previously recorded phase-02 native handoff, phase-04 live/signal/digest, phase-05 git-hook, and readiness-failure evidence remains unchanged; no prior failures or timeouts were overwritten. Actual main integration and the Plan B activation barrier are outside this run and remain unproven by it.

## Cargo lane exception

No Cargo command was explicitly launched by this worker. However, the standard unmodified suite automatically emitted `Finished dev profile [unoptimized + debuginfo] target(s) in 0.04s` at log line 7. Thus **an automatic Cargo invocation occurred inside the standard test path**, contrary to the desired exclusive lane contract; this exception was immediately reported to Main after observing the completed log. It was not hidden by changing the runner, environment, or test scope, and was not rerun.

## Owned cleanup

- Normal runner lifecycle releases its own machine-wide queue lease and removes its per-run temp directory in `finally`; no keep-temp flag was supplied.
- Post-run process-table observation found **no surviving process in owned PGID `3023610`**.
- Both `/tmp/fgos-full-suite.lock` and `/var/tmp/fgos-full-suite.lock` were absent after completion.
- No forced kill was needed. No user process, unrelated lock, main-checkout state, or preserved phase evidence root was deleted.
- This worker created no test scaffold or source modifications; the two durable report artifacts are intentional outputs. Individual temporary paths were not exposed by the normal runner, so their independent per-path deletion is not asserted beyond its normal cleanup lifecycle.

Main subsequently reported its exclusive Rust lane had completed **176/176** before this automatic standard-suite Cargo invocation; mutual serialization was observed by Main. That is coordination evidence, not an independently executed Rust verification by this worker.
