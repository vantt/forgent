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

## Not in scope

- Windows rust-host: needs a decision on whether to build Rust on Windows.
- Timing flakes (`herdr-spawn-adapter`, the R5 concurrency test in `coordination-research-fan-out`).
- `run-lock-identity.test.mjs` on macOS (`'held' !== 'dead'`, 2 tests): not in the original list and not reproducible on Linux. Needs a separate look.

## Unresolved questions

- Should the CAS merge also re-check own-file-set cleanliness under the lock, right before `update-ref`, to close the race between the gate and the ref move? Should a failed `read-tree` become loud instead of being swallowed?
