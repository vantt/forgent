# Debug: per-process temp root helper turns signals into exit(130/143)

## Cause
`test/helpers/process-tmp-root.mjs` installed SIGINT/SIGTERM/SIGHUP listeners that called `process.exit(code)`.
Tests that `process.emit('SIGINT'|'SIGTERM')` to drive `installCancelOnSignal` (test/runner/execution/run.test.mjs,
test/run-supervisor/cancel-registry.test.mjs) invoke every listener, so the helper's one ran too and the test process
exited 130/143 after all subtests passed. `listenerCount === 0` at install time did not help: later listeners and `emit` still reach it.
`test/helpers/fixture-dir.mjs` imports the helper as well, so removing only the import from a test file proves nothing.

## Evidence
- `node test/runner/execution/run.test.mjs` before fix: exit 130, 78/79 pass (file-level "test failed"); after: 82/82, exit 0.
- Same behaviour with the import removed but fixture-dir still loading the helper (still 130).

## Fix
The helper's handler acts only when it is the sole listener of that signal; otherwise it returns and the other owner decides.
When it acts it removes its handlers, deletes the root, and re-raises the signal (default disposition, status stays "killed by signal").
Cleanup stays on `exit`. Regression tests in test/scripts/run-tests.test.mjs: own SIGINT handler (emit + real kill) continues and exits 0 with the root removed; SIGTERM kill reports signal SIGTERM, not an exit code.

## Not caused by the helper (fail identically with the helper neutered or need host binary)
- cancel-registry tests 1-2: "timed out waiting for the agent to start" (bwrap sandbox on this machine).
- assignment-dispatch, fgos-read-3, run-supervisor-checks, fgos-gateway: need `FGOS_HOST_BIN` (set by `npm test`).
