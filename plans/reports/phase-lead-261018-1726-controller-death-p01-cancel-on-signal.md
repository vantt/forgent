# Phase report: controller Ctrl-C sends cancel (6.4 P01)

Status: DONE. Branch `controller-death/p01-cancel`.

## Delivered
- `src/run-supervisor/cancel-registry.mjs`: `register/unregister/registeredRuns`, `requestCancel(runDir, signal)` (link-once `cancel-requested.json` with `attemptId` from `envelope.json`, `requestedBy`, `by: signal:<SIG>`, `requester` process tuple, `at`), `readCancelWaitMs` (project over global, default `gateKillGraceMs + 5000`, floor 1000, throws on unusable value), `installCancelOnSignal({cancelWaitMs})` (first SIGINT/SIGTERM: request cancel for every registered run, poll `receipt.json` up to the wait, print `unit <id> chờ resume: fgos run --resume <id>` to stderr, exit 130/143; second signal: exit at once with the first code; returns an uninstall function).
- `assignment-runner.mjs`: registers the run dir right after the binding is seen, unregisters in the `finally` around `awaitSettledResult`. Nothing registered before the binding, so an early Ctrl-C only dies (controller holds the attempt lock; adopt judges `abandoned-not-started`). SIGKILL behaviour unchanged.
- Manifest row for the new file in `docs/architecture-manifest.json`.
- `installCancelOnSignal` is NOT wired into `runUnit` (P02 owns `run.mjs`).

## Tests (host = release build in phase-private target dir, env -u session ids)
- `test/run-supervisor/cancel-registry.test.mjs`: 7/7 pass (3 unit: registry, wait key, request content; 1 SIGINT -> 130 + receipt `cancelled` + resume line; 2 double SIGINT -> exit 130, attempt still `cancelled`; 3 SIGTERM -> 143; 4 signal with nothing registered -> no cancel file). Controller is a real process (`fixtures/cancel-controller.mjs`: handler installed, then the real `bin/fgos.mjs run`), real supervisor, bwrap, `direct-agent.mjs`.
- Also run: `test/architecture.test.mjs`, `direct-crash-matrix`, `direct-cutover`, `contracts-unit-state`: 56/56 pass, 0 fail, 0 skipped.
- Re-run on the integration branch after the merge: cancel-registry + architecture, 34/34 pass.

## Decisions
- Cases 4 of the phase file (signal before binding then adopt `abandoned-not-started`): the window between envelope and supervisor start is milliseconds and cannot be hit deterministically with a real run; tested as "nothing registered -> no cancel file". `abandoned-not-started` itself is covered by the existing adopt tests.
- Real-run tests signal after `agent-binding.json`, not at `supervisor-binding.json`: the controller registers up to one 25 ms poll after the binding; a signal inside that gap writes no cancel (same as "before binding", safe).
- Resume line uses `unitRunId` from the envelope, once per unit.
- `dispatch.cancelWaitMs` reader lives in `cancel-registry.mjs` (same pattern as `gate-kill-grace.mjs`); setup/doctor registration is deferred to the stuck-attempt doctor check per the contract.

## Impact
`executeAssignment` upstream: CRITICAL by graph (11 callers, 7 flows). Change is 4 additive lines around existing calls; crash matrix and cutover suites green.

## Notes for later phases
- `direct-crash-matrix` case 2 ("controller catches no signal") still holds only because P02 has not wired the handler; P02/P05 must update it.

## Unresolved
None.
