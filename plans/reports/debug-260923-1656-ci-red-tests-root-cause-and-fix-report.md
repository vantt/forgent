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

## Not in scope

- Windows rust-host: needs a decision on whether to build Rust on Windows.

## Unresolved questions

- Should the CAS merge also re-check own-file-set cleanliness under the lock, right before `update-ref`, to close the race between the gate and the ref move? Should a failed `read-tree` become loud instead of being swallowed?
