---
title: "WORK lane: delete the temporary Work adapter and the legacy event duties"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-cutover (from 2b4683016)
status: DONE_WITH_CONCERNS
---

# Delete the legacy event duties

## Commits (two, so the Git reviewer reads the Git diff alone)

| Commit | Content |
|---|---|
| **`790616298` (Git side)** | `packages/git` (rust, node-addon, contracts), Git spec paragraph, `scripts/git/e3-bench.mjs`, regenerated `mutation-census.v1.json` |
| `9f23f7438` (Node side) | everything else: deletions, callers, doctor rows, hook, tests, docs, CHANGELOG |

Node commit first on purpose: it stops using `legacyEvents`, so the Git commit that removes it leaves no broken state between the two.

## Git side (`790616298`)
- Removed `LegacyEventLayout`, `legacy_events` on `CommitRequest`/`CheckpointRequest`, its validation in `commit_scoped`, the dirty-path selection, and the `checkpoint_tracked_files` allowance (`scoped_commit.rs`, `lib.rs` re-export).
- `grant.rs`: the hook grant-check branch for event deletions is gone; no grant now means `cutover-grant-missing`. `cutoverGrant` untouched.
- `node-addon/src/git/scoped_commit.rs`: `legacyEvents` route arg dropped. `ports.v1.json` `legacyEvents` block and the `internal-route.git-grant-check.v1.json` check line updated.
- Git spec: store-exclusion paragraph, ordering paragraph and the Node-sites table rows now say removed; the `legacyEvents` paragraph is "removed at Work cutover (2026-10-22)".
- Rust tests: the only `legacy_events` uses were `legacy_events: None` fields (no real legacy cases existed), removed. Checkpoint's `.fgos/events.jsonl` refusal stays in `scoped_commit_sync.rs`.
- e3-bench fixture: `make()` sets `fgos.machineId` on its repo (same config `activateGitFixture` writes). `test/git/scoped-commit.test.mjs` "probes config and formats once per loan" is green again.
- Census regenerated with `--write-census`; `--check` shows only main's 5 `unresolved-binary` sites (`bin/fgos.mjs:3475,3619`, `merge.mjs:1215,1245`, `worktree.mjs:146`). None added by us.
- `cargo test --locked -p fgos-git` green (61 unit + all integration files); `-p fgos-node-addon` has 0 tests; `cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings` clean.

## Node side (`9f23f7438`)
Deleted: `legacy-event-git-adapter.mjs`, `main-fgos-checkpoint.mjs`, `events-compaction.mjs`, `events-jsonl-truncation-guard.mjs`, `scripts/events-jsonl-truncation-guard.mjs`.
- `claim-port.mjs`: the prepare+checkpoint call and the main-checkout hold around it are gone (that hold existed only for the checkpoint); `waitMs` param, `lock-held` ClaimError path and its category removed. `bin/fgos.mjs` no longer passes `waitMs` to claim.
- `merge.mjs` `landRunnerItem`: checkpoint gone; the no-wait "main is busy" precheck stays as an empty hold.
- Doctor rows `events-jsonl-not-truncated`, `events-compaction-verified` removed with their imports; the `checkpoint` config default (`fallbackIntervalSec`, only the guard read it) removed with them.
- `.githooks/pre-commit`: the staged-`.fgos`-jsonl line-count regression refusal (`countLines`, its function, call site) removed. The retired-event-path refusal stays.
- `FGOS_DISABLE_OPPORTUNISTIC_CHECKS` removed from `run-tests.mjs`, `stress-test-files.mjs`, `test-proof-inventory.mjs`, the test helper and tests. `GUARD_MARK` removed from `fgos-file-registry.mjs`, the leak-guard derived-file list, and the `bin/fgos.mjs` noise regex (`events-jsonl.truncation-guard.*`).
- Docs: `architecture-manifest.json` (4 entries), doctor how-to (2 rows), setup-doctor-registry contract list, CHANGELOG `[Unreleased]` (two lines: the two doctor rows; the truncation/compaction/checkpoint duties).
- Acceptance grep `rg "legacyEvents|legacy_events|legacy-event-git-adapter|main-fgos-checkpoint|events-compaction|truncation-guard" src bin scripts packages apps .githooks`: empty.

## Test retirements (reason on each)
Behaviour removed: legacy tracked event files (D-ADR0055), unless a successor is named.
- Files: `test/git/legacy-event-adapter.test.mjs`, `test/state/events-compaction.test.mjs`, `test/state/events-jsonl-truncation-guard.test.mjs`.
- `test/setup/checks.test.mjs`: 3 `events-jsonl-not-truncated` tests and both ids in the expected list; `registrations.test.mjs`: the per-writer truncation test and 3 compaction-verified tests (with helpers).
- `test/runner/concurrent-claim-eventlog-loss.test.mjs`: 2 of 3 retired (retired-log contiguity, guard-mark race). The cross-process concurrent-claim test stays, trimmed of its legacy-file assertions, and now gets a machine id (it already failed with `machine id missing` before this unit; it was outside the focused lists).
- `test/runner/claim-port.test.mjs`: retired the legacy-log read-count test (got 0 reads of retired files), the claim-refused-while-main-held test, the `waitMs` test, the checkpoint-under-hook test, the guard-break test, and the "releases main around worktree" test (successors for failed-worktree release: the two `createClaimWorktree fails` revert tests, which already own it).
- `test/runner/merge.test.mjs` checkpoint-before-Land test retired. `test/runner/land-vs-manual-commit.test.mjs` "checkpoint holds main while a land waits" rewritten to a plain holder (the land waits and merges once main is released; the checkpoint half is gone).
- `test/e2e/main-checkout-borrow-hook.test.mjs`: 3 checkpoint tests retired (borrow itself stays owned by the remaining hook tests). `main-checkout-lock-hook-worktree-commit.test.mjs`: the 4 line-count guard tests retired with the guard.
- `test/cli/fgos-claim-2.test.mjs`: take/pick `--no-wait`, default-wait and `--wait <ms>` budget tests retired (they held main to block a claim; a claim no longer takes it). `--wait` value validation and the manifest test stay.
- `test/cli/fgos-return.test.mjs`: the noise-regex test now covers only the warnings log.
- `test/scripts/run-tests.test.mjs`: dropped the two env assertions.

## Reader census (`test/event-store/door.test.mjs`)
11 dormant sites on 10 entries before; removed the 5 entries whose code is gone (registrations x2 entries = 3 sites, compaction x2, guard x1). **Remaining for U7 (5 sites):**
- `bin/fgos.mjs: repairTruncatedLastLine` (the `repair` verb), 1
- `src/state/events.mjs`: import `readEvents`, import `readEventsFromByte`, 1 each
- `src/state/replay.mjs`: import `readEvents`, import `readEventsFromByte`, 1 each

## Counts (focused runs, nothing concurrent)
| Set | Before (U5/sweep) | Now |
|---|---|---|
| `test/state test/event-store test/cli test/intake` | 16 fail (replay x13, compaction x3) | 2654 tests, 13 fail, all `test/state/replay.test.mjs` (U7) |
| `test/setup` | 1 fail | 988 tests, 0 fail |
| runner list (`u5-runner-list.txt`) | 4 claim-port (+1 load flake) | 1187 tests, 0 real fail (see note) |
| `test/git` + `test/architecture.test.mjs` | 1 (scoped-commit) | 196 tests, 0 fail, 1 skipped |
| touched e2e + concurrent-claim | n/a | 20 tests, 0 fail; claim-port + land-vs-manual-commit + concurrent-claim 31/31 |

Note: the runner list's one failure was a quote I put in a test title (`test/scripts/run-tests.test.mjs`); fixed, file 50/50. An earlier big run showed 7 `git-addon-unavailable: digest mismatch` failures: I ran `run-tests.test.mjs` while that run was live and it restaged the addon. A clean re-run has none. The harness ERROR line "product code started git ... (272x)" from `fgos-cli` fixtures is the same one present in the U5 logs, not new.

## Impact analysis
`fgos tool query --capability impact-analysis --status present`: 0 providers (inactive). Checked by `rg`: callers of `checkpointMainFgos`/`prepareMainFgosCheckpoint` were `claim-port.mjs`, `merge.mjs` and tests; users of the guard module were `registrations.mjs`, the deleted script and tests; `legacyEvents` users were the adapter and Git itself. All moved or removed.

## Concerns for the owner
1. **`fgos take --wait` / `pick --wait` / `--no-wait` are now no-ops.** The claim's only contention point was the main-checkout lock held for the checkpoint. I kept the flags accepted (validation and manifest unchanged) rather than change a CLI contract unasked; CHANGELOG says so. Decision: remove the flags (and `withLockRetry` for take/pick) in a follow-up, or keep as accepted no-ops.
2. **`main-checkout-guard-warnings` has no writer left.** `recordMainCheckoutGuardWarning`, the `MAIN_CHECKOUT_GUARD_WARNINGS` file kind and the doctor row `main-checkout-guard-warnings` only read old logs now. Not in this unit's list; should be its own item.
3. **`Checkpoint` (`checkpointTrackedFiles`) has no Node caller now.** Kept (the brief keeps its `.fgos` refusal under its Rust test); candidate for removal by Git.
4. `docs/platform/event-store/spec.md` §"retired at cutover" table (rows for the guard and compaction) still describes them as "today"; ES-owned, not edited.
5. The census diff in the Git commit also carries line shifts and removed rows for the deleted Node sites, because it is regenerated from the whole tree.

Status: DONE_WITH_CONCERNS
