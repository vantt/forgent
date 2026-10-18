# Phase report: controller-death p05, crash matrix tests

Status: DONE_WITH_CONCERNS. Test-only change (no `src/**`, no manifest row).

## Delivered
- `test/run-supervisor/crash-matrix-adopt-resume.test.mjs` (30 cases), helpers `helpers/kill-on-file.mjs`, `helpers/envelope-fixture.mjs`.
- direct (bwrap, real supervisor/gate/steps): 7 rows. terminal (fake herdr pane, real host): 8 rows incl. `release-slot` pending. Each row: crash from outside, `fgos run --resume`, unit reaches `unit-summary.json`, agent runs once (terminal: one `pane run`), pane closes once.
- Per mode: two concurrent adopters on every row with a side effect; resume after adopt already closed (nothing re-adopted, files byte-identical, no new attempt).

## Evidence
- Final bundle: 5 consecutive full runs, 30/30 each. An earlier set had 1 flake (direct no-binding: gate child still held the lock); fixed in the test (freeze via controller children, confirm requires free attempt lock), then 5/5 green.
- `test/architecture.test.mjs` + 12 test files naming client/direct-launch/sweep/legacy-sweep/settleRunControl: 197 pass, 0 fail.
- GitNexus impact: not applicable (no existing symbol edited).

## Decisions / deviations
- Host refuses an envelope whose hostBin is not the running host (`host-version-mismatch`), so a step cannot be swapped for a fifo command. Steps are held by freezing (SIGSTOP) the process the supervisor started, then killing it with controller/supervisor/gate. `fifo-step.mjs` dropped as unused.
- Row "run control settled, no result.json": window is microseconds in one sync path, unreachable by an external kill. State is built by calling the production `settleRunControl` with the attempt's own token after the settle step was killed.
- Row "binding, gate dead": adopt settles `gate-lost`, unit ends `execution-failure` (exit 11), no second attempt. Matches r6 9.7 but resume can never rescue such a unit when the agent never started. Test asserts this behaviour.
- Credential write-back "exactly once" not exercised (fixtures have no credential account); covered here only as one `finalize-home` receipt per attempt + home removed. Idempotency lives in provider-credential-renewal / attempt-steps tests.
- Waiting for the attempt lock to be free before adopt/resume (gate publishes `gate-exit` before releasing it) is test-side only.
- A kill during receipt publish can leave a dot-named temp file in `steps/`; tests ignore it.

## Unresolved
- Should `binding present, agent never started` settle as `abandoned-not-started` (resume relaunches) instead of `gate-lost`? Owner call.
