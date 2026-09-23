# CI red tests on main — root cause and fix

Branch `fix/ci-test-hermeticity`. Evidence: CI run 35836953124 (main @ cc687d92) junit artifacts. Before the fix: ubuntu 147 failures, macOS 157.

## 1. Confinement registry (`not found in machine registry`) — product regression, not only hermeticity

- **Root cause:** commit 041bb190 (2026-09-21, "H10/D2") changed `executeThroughConfinement` from "resolve the backend only when `backendId` was given" to "`backendId ?? 'bwrap'` for every direct dispatch". So every dispatch that does not require confinement looked up `bwrap` in `~/.fgos/confinement-backends.json` and refused when it was missing. That covers every macOS machine and any Linux machine that never ran `fgos setup`, which means real users too, not just CI.
- The ~35 loop/e2e failures (`halted` vs `awaiting-approval`, `--once failed`, and so on) came from the same refusal further down the call chain.
- **Fix:** `src/runner/dispatch/confinement/authority.mjs`: the `bwrap` default now applies to `required` mode only. An explicit `backendId` is still resolved, and still refused when it is missing or disabled, in every mode. This matches the assignment door, which already gates on `reqMode !== 'unconfined'`.
- **Test hermeticity:** `dispatch-confinement-backend-p03` and `herdr-reconciliation` both have required-mode tests guarded by `HAS_WORKING_BWRAP`, and both read the machine registry. They now seed a file-local registry through the new `test/runner/confinement-registry-fixture.helper.mjs`.
- Impact: `executeThroughConfinement` upstream = CRITICAL (45 direct callers). The change keeps `required` behavior as it was and restores the pre-09-21 behavior for every other mode.

## 2. `NO_ASSISTANT_CLI_FOUND` — test hermeticity

- **Root cause:** 3 tests in `coordination-stale-action-proof.test.mjs` passed no `runnerConfig`, so dispatch bootstrapped a config by scanning PATH for `claude`/`codex`. On CI neither exists, so the config ended up with a placeholder executor, and the egress check refused it.
- **Fix:** these tests now pass `runnerConfig: makeCohortRunnerConfig(tempDir)`, the deterministic fake executor that the fan-out test in the same file already uses.
- The "L3 RunnerConfigError" CI failure was really cause 1 (the backend refusal fired before the config error). It passes after fix 1.
- The originally estimated "~11 ubuntu / ~49 macOS" were mostly loop failures belonging to cause 1. Only 4 per OS were really this class.

## 3. tsk-598 D2/D3 (`fgos-approve.test.mjs`) — product regression

- **Root cause:** commit 7e682516 (CAS merge, D-ADR0042) removed the own-file-set clean-tree gate before the root→main merge, and no reason was recorded. The CAS path still runs `update-ref` on the branch that repoRoot has checked out, then `read-tree -m -u HEAD`. When a path in the item's own file set was dirty, that sync failed silently. The ref had moved, but the main checkout's index was left on the old tree, so a later `git commit` would silently revert the merge.
- **Fix:** `src/verbs/merge/approve.mjs` restores the gate in its old place: `isMainTreeClean(repoRoot, ownFileSet)` runs before `mergeRootIntoMainCas`. The `merge` verb (`merge.mjs:145`) still handles the `is not clean` error.
- Spec `docs/specs/runner.md` D-ADR0042: corrected the claim "working tree luôn sạch".

## Verification

- CI-like environment (`env -i`, empty HOME so no registry, no claude/codex on PATH), full suite: 147 → 53 failures. All 53 are `test/rust-host/*` (Rust binary not built in the worktree; CI builds it on Linux and macOS) plus the 2 herdr-reconciliation tests, which were fixed afterwards. The touched files were re-run in both the CI-like and dev environments: 0 failures.
- Normal dev environment, full suite: see the commit / PR note.

## Second pass (the items that were still open)

- **rust-host (50 local failures):** after `cargo build --release --workspace`, all 102/102 tests in `test/rust-host/*` pass. The failures were only a missing binary in the worktree. No code change.
- **`run-lock-identity` on macOS (3 tests):** `process-identity.mjs` only reads `/proc`. On macOS `getBootId()` is always `'unknown-boot'` and `getProcessStartTime()` is always `null`, so `resolveHolderLiveness` fails closed to `'held'`, as the code documents. The tests asserted the Linux-only behavior. They now assert the behavior each platform is supposed to have: `'dead'`/reclaim when `/proc` exists, `'held'` otherwise. Nothing was skipped or loosened.
- **`herdr-spawn-adapter` on CI:** the CI failure was the bwrap registry bug (fixed in section 1). Separately, there is a real flake in "a herdr that stops answering…" (1/12 under 4-way parallel load). It is a product bug: `pollForOutcome` only counted blind time up to the *start* of the tick, so a slow failing `agentGet`/`readLiveness` was charged as idle and a healthy round ended `timed-out-idle`. Fix: one `observedAt` taken after all reads, used both for the blind span and as `now`. 18/18 green under 6-way load. GitNexus impact: HIGH (stale index); grep finds 1 direct caller.
- **R5 concurrency in `coordination-research-fan-out`:** not reproduced in 30 runs under load, and not in the current CI failure list.

## Third pass (PR #5 CI on 3 real OSes)

Each finding below was confirmed on real CI or reproduced locally before it was fixed.

- **Temp-file name collisions between threads** (product bug): the events lock, `session.json`, trust-store, reconciliation-planner and visibility-session built temp names from `pid+Date.now()` (plus a per-module counter). Worker threads share one pid and each thread has its own counter. CI hit `ENOENT link .events.lock.tmp-<pid>-<ms>-1` on both ubuntu and macOS. Fix: `src/util/unique-tmp-tag.mjs` (pid + threadId + time + random bytes). Impact: HIGH, 20 callers of the events lock; only the temp name changes.
- **Writer identity unstable under load** (product bug): `resolveWriterIdentity` re-walks the ancestor pids with `ps` (200 ms per hop) on every call. On a loaded host a slow hop stops the walk at a different ancestor, so one process claims as one id and settles as another (`settleClaim: writer identity mismatch`, exit 3). This was `loop.test.mjs` "overshooting batch": 15/16 red at 8-way parallelism. Fix: resolve once per process and reuse. Regression test forces a slow `ps` (red without the fix). After the fix: 16/16 green. Impact: HIGH (20 callers); the env-session path is unchanged.
- **bwrap tests gated on `--version`**: Ubuntu 24.04 ships bwrap but AppArmor blocks unprivileged userns ("setting up uid map"). The guards now check that bwrap can actually build a sandbox, and CI plus the nightly set `kernel.apparmor_restrict_unprivileged_userns=0` so confinement is really exercised.
- **Two-process race test with no runnerConfig**: whenever the dispatch worker won the race on a machine with no assistant CLI, it failed validation. Same class as #2.
- **Windows hang (6h on every run)**: the spec reporter holds back each file's output until the file exits. The log stops right after `loop.test.mjs`, but the file that never exits is the next one, `main-checkout-lock.test.mjs`: the SIGSTOP test's `child.kill('SIGSTOP'/'SIGCONT')` throws on Windows, so the `SIGKILL` in `finally` never runs, and a child blocked with `setInterval` holds the stdout pipe. Fix: every holder child is killed in `after`, and the SIGSTOP test skips on win32. The diagnostic step is kept for one more CI round to confirm.
- **Inode exhaustion, machine-wide**: tests leave temp fixtures in `/tmp` (`fgos-cli-*` alone had 160k), 800k+ entries in total, 100% of inodes used. Every `mkdtemp` failed with ENOSPC. Fix at the choke point: `runSelectedTests` and the coverage collector give each run its own TMPDIR and delete it afterwards. Stale fixtures older than 2h matching test prefixes were removed from `/tmp` (excluding `fgos-worktrees` and `fgos-gateway*`).
- **Nightly environment ≠ CI**: the nightly did not install zsh, set no git identity and did not build Rust, so `fgos-shell-integration`, `loop` and `rust-host` were red there for environmental reasons. It now mirrors the CI `test` job.
- **Mutation ledger false `confirmed-miss`**: the full suite had no baseline. Fixed: a failure only counts as a miss when it is new relative to a full-suite baseline on the clean HEAD.
- **`NODE_TEST_CONTEXT` leaked into nested `node --test` runs**: a nested run exits 0 without running any test, which made the mutate integration test pass vacuously. Fixed: `buildTestEnv` is the shared env for every spawned test run.

## Windows: known failures remaining (separate item)

When `loop.test.mjs` runs alone on Windows, 2/103 tests fail:
- `resolveRepoRoot` returns the forward-slash long path (`C:/Users/runneradmin/...`), while the test expects the 8.3 short path from `os.tmpdir()` (`RUNNER~1`).
- "cli-spawn cwd selection for planning.validate-plan": the executor is never called on Windows.

These are Windows path/shell support gaps, not hermeticity. They are out of scope for this PR. The full list will be visible once the Windows job runs to completion.

## Not in scope

- Windows rust-host: needs a decision on whether to build Rust on Windows.

## Unresolved questions

- Should the CAS merge also re-check own-file-set cleanliness under the lock, right before `update-ref`, to close the race between the gate and the ref move? Should a failed `read-tree` become loud instead of being swallowed?
