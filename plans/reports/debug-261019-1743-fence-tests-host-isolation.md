# Fence tests depend on what other sessions run

## Cause
- `lock-fences` and `payload registry` tests in `test/setup/holder-lock-checks.test.mjs` call `fixLockFences`, which runs `fgos internal quiesce-scan` (`packages/holder-lock/rust/src/route.rs`, `quiesce::scan`). Default scan is machine-wide by design: any argv naming a fgOS payload, any process carrying the pinned `FGOS_STATE_ROOT` in environ (spec holder-lock §12: "any fgOS process on the machine is a blocker"; activation-binding.md: "default stop-everything scan remains machine-wide"). Production is correct; not a bug.
- The tests tried to cope by snapshotting other sessions' pids (`otherSessionPids`) and passing `excludePids`, retrying 20 times. A snapshot cannot cover processes that start after it, nor ones that start between the fix's first scan and its after-placement scan (`placed-then-blocked`). Whole-file result then depends on host process churn.
- A PID namespace (bwrap) is not an option: the scan refuses inside a non-initial pidns (`unavailable`, "run it from the host").

## Proof
- Foreign long-lived fgOS-like process started before the run: file passes (snapshot excludes it). Not the failure mode.
- 12 shell loops spawning short-lived `node .../bin/fgos.mjs` (stand-in for another suite): 40 runs of the three fence tests before the fix: 5 failed ("fences not placed: fgOS processes still running, stop them first: pid ... environ/cmdline"). After the fix: 0 of 40.

## Fix (test only)
- `workspaceScopedHost()` fixture: a shim script that execs the real host and appends the host's own `--workspace-only` to `quiesce-scan` (mode already used by the Git gate): only processes with cwd or execution-root arguments inside the fixture workspace count. Passed as `hostBin`. Removed `otherSessionPids`, the retry loops and `excludePids`. Assertions unchanged (still `placed 13 fence(s)`, refusal names the in-workspace payload pid).
- Whole-host scan semantics remain covered by `test/holder-lock/fences-stop-check.test.mjs`, which still uses the real scan (same snapshot pattern; not changed, not in the reported failures).

## Verification
- `node --test test/setup/holder-lock-checks.test.mjs`: 17/17 quiet, with a long-lived foreign process, and under 12-way churn (40 runs, 0 failures). Fresh host built from this checkout in a private cargo dir.
- `test/setup/*.test.mjs`: 941/943 -> one failure `projection tests for Codex/OpenAI and Claude surfaces` (known skill-wrappers baseline failure, unrelated), identical with and without a foreign process.

## Unresolved
- `fences-stop-check.test.mjs` keeps the same snapshot-exclusion pattern; if it flakes under churn it needs a fixture of its own (it tests the machine-wide scan, so a workspace-only shim would defeat it).
