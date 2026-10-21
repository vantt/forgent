# Phase lead report: test governance phase 3, runner group

Date: 2026-10-21 (Asia/Saigon). Branch `chore/test-governance-p3-runner`, commit `bed6405dd` on origin/main `af9f4b109`. Written by the controller (`forgent-f8`) from the lead's final reply; the lead's tool refused report files.

## 1. Outcome

Each file was run alone with the suite's env; seconds are node's `duration_ms`. The host was shared, so the load column matters.

| File | Alone before (load) | Alone after (load) | Tests |
|---|---:|---:|---:|
| test/runner/loop.test.mjs | 327 s (8.7), 1 fail ("real concurrency") | 182 s (≈10), 0 fail | 104 → 98 |
| test/runner/loop-rununit.test.mjs | 59 s (22) | 49 s (15) | 12 → 12 |
| test/e2e/runner-loop.test.mjs | 165 s (34) | 45 s (11) | 22 → 13 |
| test/runner/spawn-worker.test.mjs | 50 s | unchanged | 18 |
| test/runner/worktree-admin-multiprocess.test.mjs | 74 s | unchanged | 7 |
| test/runner/worktree.test.mjs | 24 s | unchanged | 69 |
| test/runner/merge.test.mjs | 25 s | unchanged (a change made it slower and was reverted) | 91 |

Net −15 `test()` calls; every behaviour they proved is owned by a module-level test (§3).

## 2. Gates

- Before (controller's shared run on clean `406a81f98`): `suite: 582 files, 8078 test() calls, 530 s wall`; npm 8724 tests, 8626 pass, 2 fail (land admission budget, session concurrency: both pass alone, 40/0); cargo 1243/0.
- After, npm (on `7a5b6b0f1`): 8709 tests, 8613 pass, 0 fail; `suite: 582 files, 8063 test() calls, 519 s wall`; `suite: this change against 7a5b6b0f1: +5 -20 test() calls, 0 new CLI/host spawn site(s), 0 without a reason`. The run exited 1 on the `.fgos` leak check only (§5), which main shares.
- Controller rerun (23:10–23:19, alone in the worktree): 8709 tests, 3 fail in files this branch does not touch (merge.test wait-budget, fgctl-init concurrent init, crash-matrix two adopters); the three pass alone on main, 129/0.
- Cargo after: 1243 passed, 0 failed (`--no-fail-fast` rerun; the first run stopped on a `fgos-distribution` lock flake that passed alone, 59/0). A controller rerun hit `bwrap: Can't bind mount … /var/tmp/fgos-e1/mnt`, a transient mount from another lane's power-cut fixture.
- Coverage (against the shared main map): 332 sources before and after, 0 lost their last covering test, 0 lost any covering file.

## 3. What moved where

**The concurrency test.** Each worker slept 1 000 ms and the test required the two run intervals to intersect. `runOnce` starts a wave with `Promise.allSettled` (`src/runner/loop.mjs:1692`), but each item's setup (worktree add under the worktree-admin lock, Unit bind, contained git) is synchronous, so item b's setup ran after a's worker had started; once setup exceeded 1 s, a finished before b started (seen alone at load 8.7: b started 59 ms after a ended). Now each worker marks its own worktree `.running` and waits, up to 20 s, until a sibling worktree shows a mark for a different item before writing its proof; the test asserts that a saw b and b saw a. Load only lengthens the wait. Forcing sequential dispatch (`parallel: { maxRoots: 1, maxLeavesPerRoot: 1 }`) fails it.

**Retired e2e tests** (each spawned `fgos init`, `fgos add`, `fgos-runner --once`, `fgos list` twice around one `runOnce` a module test owns):

| Retired e2e test | Born in | Now owned by (what moved in) |
|---|---|---|
| verify-red | `06df4970f` (feat) | loop.test `verify-miss: …` (+ exit code 0, the `parked "<id>" (verify-miss, 2 attempt(s))` line, the branch left, the event order) |
| no result claim: commit subject is the goal line | `acf2a7696` (test) | loop.test `runOnce full circle …` (exact subject, one commit) |
| a worker cannot commit itself (read-only git dir) | `84fe38b2f` (feat) | `fanout-batch-runner-commit` "a worker cannot commit itself …" (read-only git dir under the same confinement); loop-rununit `a worker round that fails after writing files …` (+ `worker-failed for "<id>"` line, outcome class) |
| a worker that changes nothing → verify-miss | `e507440c1` (feat) | loop.test `verify passes but the worker changed nothing …` (+ exit 0, `commit for "<id>": none`, zero commits, outcome `verify-miss`) |
| failing commit (rejecting pre-commit hook) | `e507440c1` (feat) | loop-rununit `a failed runner commit keeps the checkout …` (+ exit 0, `worktree-fail for "<id>"` with `rejected-by-hook`, outcome `worktree-fail`) |
| stage-discovery clear verdict | `687abfb8f` (**fix**) | loop.test clear-verdict test (+ one runner commit on the item's branch, subject `chore(work-<id>-discovery):`, file `RESEARCH.md`); the fixed bug stays owned by the no-verdict-fence test |
| stage-discovery: worker only writes RESEARCH.md | `e507440c1` (feat) | the same clear-verdict test |
| stage-discovery unclear verdict | `ee0cc0215` (feat) | loop.test unclear-verdict test |
| stage-discovery fail-safe: crashing worker | `0f6a26f3c` (feat) | loop.test no-verdict-fence test, a second item whose worker exits 1 in the same dispatch |

The runner binary keeps one wiring proof per boundary in the e2e file: the trailing `fgos.v1` envelope, the full journey, the edit-only commit with a Result summary, crash idempotency, `--watch`, and the three exit-4 validations.

**Merged inside loop.test.** The edit-only commit and "stamps role runner" cases fold into `runOnce full circle` (one attempt, exact subject, `role`/`actor` = `runner` on every move and attempt). The four discovered-block fallback cases (from fix `816b835e1`) share one dispatch with one block per case, each keeping its assertions (each title still classifies `bug/standard`). The two duplicate-block cases (from fix `13ca78666`) are one test with `[A, A, B]` asserting titles `{A, B}`.

## 4. Files not improved, and why

- **spawn-worker, worktree, merge, worktree-admin-multiprocess:** they already call module functions with plain `git init` fixtures. The time is in the Rust git port, which runs every git command inside `bwrap --unshare-pid --as-pid-1 --dev-bind / /`: strace on 10 `addWorktreeSync` calls showed 218 bwrap and 249 git execs, about 0.5 s per worktree add against about 20 ms for a plain `git worktree add`. Handed to HARDEN as ledger R2 (T2 Git council with the GIT lane's OPC design; days away).
- spawn-worker's 1.5/2.5/3 s waits are the timeout budgets under test.
- merge.test: replacing a 1.5 s verify sleep with a release file measured 3.9 s against 1.0 s and was reverted.
- worktree-admin-multiprocess: 160 serialized adds × 0.5 s; the only test lever is the round count (owner question, §6).
- loop.test's other 98: each runs one real confined dispatch at the lowest layer that observes it; `captureDiscoveredWork` is not exported, so those cases cannot move lower without a seam.
- Five e2e cross-verb journeys use verbs from the CLI area and stay.

## 5. The `.fgos` leak flag

Every full `npm test` since the HARDEN T0 merge exits 1 on `run-tests: ERROR: test suite leaked … Modified: .fgos/runtime/git-addon/<hash>/manifest.json`, including the controller's clean-main run (`p3base.npm.log:12082`); the pre-T0 baseline on `470f21c32` did not. The bytes never change, only the mtime: `scripts/run-rust-dev-host.mjs` `stageLauncherDoor` (lines 102–106, since `ab5a5fdf6`) rewrites `manifest.json` unconditionally, reached by `test/scripts/run-rust-dev-host-staging.test.mjs` and help-routes' dev-door case. Proposed fix: write only when the bytes differ, the guard `scripts/lib/git-addon-stage.mjs:64` uses. Sent to HARDEN (T0 owns the script).

## 6. Unresolved questions

- worktree-admin-multiprocess: keep 8 processes × 20 rounds (71–90 s), or 8 × 5 rounds (about 20 s, still 8 real processes contending)? A cheaper contained git call is days away (HARDEN R2).
