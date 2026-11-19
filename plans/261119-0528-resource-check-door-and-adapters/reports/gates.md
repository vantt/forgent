# Phase 10 gates — resource-check door and adapters

Date: 2026-11-19 10:19 | Commit: bcaa0936e (rd/p10) | CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rd-p10-target
Memory before: 30G total, 19G free (swap 7G used).

## 1. cargo
- `cargo build --workspace --locked`: exit 0.
- `cargo test --workspace --locked -j4` (log /dev/shm/rd-p10-cargo.log): exit 101, stops at first failing crate.
- Rerun `--no-fail-fast` (/dev/shm/rd-p10-cargo-nff.log): 3465 passed, 2 failed, 12 ignored.
  - FAIL fgos-distribution `tests::test_vector_parity_version` (packages/distribution/rust/src/lib.rs:559): frozen fixture test/rust-host/vectors/envelope/version.json `verbs` is stale; live verb list adds land, request, resource-check, supervisor, watcher. Real, deterministic. Same drift fails the 3 npm R4 drift-guard tests.
  - FAIL fgos-supervision `land::two_concurrent_lands_into_one_target_serialize` (tests/land.rs:578): got resource-recovery-required instead of land-slot-already-held. Passes alone (re-run ok) -> flaky under load / resource contention.

## 2. door edges (`cargo tree -p fgos --locked -e normal --depth 1`)
fgos-graph, fgos-resource-referee, fgos-supervision, fgos-write-scope all present.

## 3. npm test (/dev/shm/rd-p10-npm.log): exit 1
tests 8373, pass 8301, fail 44, skipped 28, cancelled 0. No lines starting with ERROR (leak/clone): none.
Many failures are "Unknown system error -122" (EDQUOT) on copyfile/write into /tmp during the run (/tmp tmpfs 68% used now, shared) -> environmental. Passed when rerun alone: test-shards (and likely the other test-select/timing/marker files that failed at 1:1 load), fgos-read stale.
Failing (title / file):
- Deterministic, plan-relevant: envelope-contract.test.mjs R4 drift guard x3 (version.json drift, see gate 1).
- Env/not-this-plan (FGOS_HOST_BIN unset when run alone, or -122 in suite): seat-binding/client.test.mjs x5 in suite; state/worker-slots.test.mjs x2 (slots needs native host); rust-host/help-routes.test.mjs (--help --json manifest, copyfile -122); mailbox-live-confined.test.mjs x7; scripts test-select*, test-shards, test-timing, write-test-marker, run-tests CPU, test-select-mutate (load/-122); fgctl-init*/fgctl-stage/fgctl-upgrade/closing-block/dev-host/native-addon (download/network + -122); fgos-claim x2, fgos-merge sync-root x2, fgos-read stale, pr-gate e2e (GitHub HTTP 401 / worktree env).
- Not individually re-proven on a clean baseline (no main comparison run).

## 4. plan-contract-check --all (/dev/shm/rd-p10-plancheck.log): exit 1
`plans 128: under contract 15 (failing 1), legacy 113 ...`. Only erroring plan: 261118-1117-external-ui-integration-multica (7 errors: source list, outcome, acceptance criteria, non-goals, phases, owner questions, risks and rollback). No error for 261119-0528 or 261119-0030.

## 5. one-door census
scan: `0 undeclared site(s)`. `--write-census` produced no change: git status clean, /dev/shm/rd-p10-census.diff is empty (0 lines). Census matches the tree.

## 6. resource-check timing (debug binary, `--json`)
- plans/261118-1045-project-supervisor: exit 0, 0.024s
- plans/261119-0030-resource-referee-graph-write-scope-stack (largest contract plan, 124 phase rows): exit 0, 0.013s
- plans/261119-0528-resource-check-door-and-adapters: exit 0, 0.011s

## 7. acceptance criterion 1
rg hits only packages/write-scope/src/lib.rs:149 (`pub fn overlaps`). No `pathsOverlap` / `longestChain` definitions elsewhere. docs/architecture-manifest.json has door entry job "the footprint and write-scope overlap rule" (kind door, allowed packages/write-scope/src/lib.rs; dispatch JS port src/runner/dispatch/write-scope.mjs allowed, retiredBy "dispatch moves onto the write-scope package").

## Open
- Regenerate version.json envelope vector (generate-vectors.mjs) to fix cargo parity + 3 npm drift tests.
- Flaky: two_concurrent_lands... under load.
- npm 44 failures need a quiet rerun with free /tmp to separate -122 noise.

## npm failures rerun
Run at 93cc5bebc, CARGO_TARGET_DIR=rd-p10-target. /tmp is a 16G tmpfs with a per-user quota: -122 / "Disk quota exceeded" hit even at 68% used. Rerun 1 with TMPDIR on /tmp: 45 fails, all -122 noise. Rerun 2 with TMPDIR=/var/tmp/rd-p10-tmp (ext4; a dir under /home/vantt is refused by run-tests because /home/vantt/.fgos sits above it): 496 tests, 493 pass, 2 fail.

| file | first run | rerun | cause |
|---|---|---|---|
| test/cli/fgos-claim, direct/fgos-merge, direct/fgos-read, e2e/pr-gate | 8 fail | pass | -122 on /tmp |
| distribution/native-addon, rust-host/dev-host, closing-block, fgctl-init*, fgctl-stage, fgctl-upgrade, help-routes | 17 fail | pass | -122 on /tmp (help-routes also fixed by 93cc5bebc) |
| rust-host/envelope-contract (3) | 3 fail | pass | fixed on main 93cc5bebc |
| scripts/mailbox-live-confined (7), test-select-mutate, test-select-promote(-report), test-select, test-shards (file), test-timing, write-test-marker, run-tests, seat-binding/client | 15 fail | pass | -122 on /tmp (import crash in process-tmp-root) |
| scripts/mailbox-live-confined "two heads in two sandboxes" | fail | fail once, pass when file rerun alone | flaky under load: head registration timed out (23s); hook logged "cargo ENOENT" host-binary warnings. Not plan related |
| scripts/test-shards "every discovered test file lands in exactly one shard" | fail | fail (deterministic) | 19 test files have no entry in test/suite-baseline.json; their weight is the mean, and the mean sums floats in input order, so the shuffled-order partition differs for 6-8 shards. Passes with all weights known and passes at e5ea2c754. 3 of the 19 files are from this plan (resource-check-door, graph-adapter, report-verb tests); the rest are other lanes. Fix: refresh the baseline (or sum in sorted order in scripts/lib/test-shards.mjs weigh) |

Verdict: no failure traces to resource-check, write-scope, graph, footprint, conflicts, plan-lint or portfolio logic. Only test-shards is attributable in part (missing baseline entries), and it is a latent order-dependence in weigh().
