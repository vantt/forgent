# Phase report: run supervisor P08, bwrap driver pid namespace

Status: DONE_WITH_CONCERNS. Branch `run-supervisor/p08-bwrap` (7d80544e3) merged into integration.

## Built
- `bwrap.mjs`: every launch gets `--unshare-pid --as-pid-1` (after `--proc /proc --tmpfs /tmp`). `--die-with-parent` plus `--bind <socketDir> <socketDir>` only when `request.launchMode === 'terminal'`; direct never has it.
- Request with `attemptId`: prepared result carries `bwrapPrefix` (ends with `--`), `agentArgv`, and `launchDigest` (when `request.gateCommand` given); `invocation.args` is the prefix, no worker command. `computeLaunchDigest` hashes prefix + gate command + agent argv. Request without `attemptId` keeps the old bash fd-closer wrapper.
- Home marker: with `attemptId` calls `writeOwnershipMarkerV2(dir, {attemptId, runDir, dispatchId, resource})`; without keeps v1.
- `src/run-supervisor/runtime-dir.mjs`: `resolveRuntimeSocketDir`, `ensureRuntimeSocketDir` (0700, owner, sun_path fit check).

## Tests
- New: `test/run-supervisor/runtime-dir.test.mjs`, `bwrap-driver.test.mjs` (argv direct/terminal, digest, real bwrap pid 1).
- Updated expectations: blind test (non-blind argv has pid ns; peer process now ENOENT blind or not).
- Phase files + `test/run-supervisor/*` + `dispatch-confinement-*` on integration: 243 tests, 229 pass, 0 fail, 4 skipped (pre-existing named skips).
- Wider: `test/runner/execution/*`, assignment-dispatch, herdr-spawn-adapter, dispatch, spawn-worker, 3 setup confinement checks: 836 tests, 834 pass, 1 skipped, 1 fail: `assignment-dispatch` "SIGKILLed runner's detached cli-spawn worker" (S1 probe) times out; fails identically with `bwrap.mjs` reverted to HEAD, so pre-existing/in-session env, not this change.

## Decisions
- Request field names (`launchMode`, `attemptId`, `gateCommand`, `context.runDir`) chosen here; P09/6.3 must pass them.
- Digest returned from the driver; `authority.mjs` still computes its own `attestationPlanDigest` (P09 wires `launchDigest` in).

## Concerns
- `writeOwnershipMarkerV2` does not exist until P10 (owns `cleanup.mjs`). An attempt launch with a temporary home throws `marker-v2-writer-missing` until P10 merges; not exercised by tests.
- Pid namespace for all launches (incl. herdr/legacy) hides peer processes; herdr reaper pid checks run host-side so unaffected in tests run.
- GitNexus impact: grep cross-check only (index stale). `prepareBwrapSync` callers: authority driver registry + probes/harness.mjs. Not HIGH.

## Unresolved
- None blocking.
