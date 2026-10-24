---
phase: 01
title: "Red-test intake: route the committed red tests to the phases that turn them green"
status: pending
depends_on: []
parallel: "first; minutes of work, then phases 02 and 03 start"
effort: ~0.25d
net_size: "Node 0 / Rust 0 / tests 0 in this phase (the red tests are counted in the phase that lands them)"
---

# Phase 01 — Red-test intake

## Context

Arbitration §4.1: red tests come first, and a red test never lands on main alone. They already exist on `origin/harden/t3a-red-tests` (5 commits on main `359ef9bc1`; report `plans/reports/lead-261024-1953-harden-t3a-red-tests.md` on that branch). This phase only routes them. No test is written or changed here.

## Routing table

| Commit | Content | Goes to | Turns green in |
|---|---|---|---|
| `dd09aadcd` | Observe red tests: `friction.rs` 1a, 1b, 2, 3, 4, 5a; `case_journal.rs` 5b; `metrics_cli/snapshot.rs` 5c; census hunk | phase 02 worktree (cherry-pick, census hunk dropped) | 02 |
| `e28cf4f9b` | Agent-protocol red tests: `terminal_vectors.rs` 6a (FIFO), 6b (oversized); the five `terminal/<cli>/vectors.json` usage-limit vectors (7); census hunk | phase 03 worktree (cherry-pick, census hunk dropped) | 03 |
| `129230049`, `30cb75484` | RT-01 settle half: `test/run-supervisor/attempt-steps.test.mjs` (test 8 + `paneShows` helper) | **not merged in 04a.** Handed to T4 with its fix (D-T3A-1 in plan.md). Branch `harden/t3a-red-tests` stays on origin until T4 takes the two commits | T4 |
| `3761a5b71` | The red-test report (docs only) | track branch, any time (docs) | n/a |

## Steps

1. Create the track branch `harden/t3a-agent-protocol-observe` from main at or after `42c5a0a55` (the Work cutover code merged there on 2026-10-24 20:50 while this plan was written; it rewrote `src/setup/registrations.mjs`, `scripts/regenerate-observe-fixtures.mjs`, `test/setup/observe-doctor-checks.test.mjs`, `test/observe/observe-contracts-fixtures.test.mjs`, `packages/work-state/rust/src/legacy_friction.rs`, `Cargo.lock`, the census and `CHANGELOG.md`). Every `file:line` in this plan is pinned on `42c5a0a55`. Phase worktrees branch from the track branch.
2. Phase 02 worktree: `git cherry-pick dd09aadcd`, then `git checkout HEAD~1 -- packages/git/contracts/mutation-census.v1.json` and amend (the census is regenerated in the fix commit, never hand-merged).
3. Phase 03 worktree: same with `e28cf4f9b`.
4. In each worktree, run the red tests alone and confirm each fails on the assertion the report names (table "Per test" of the report). A test that passes on the new base is recorded "not reproduced on `<sha>`" and its fix slice is re-checked before coding.
5. Record in the phase report: commit → worktree → red/green → failing assertion text.

## Validation

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3a-p02-target   # p03: …-p03-target
cargo test -p fgos-observe --lib -- friction:: case_journal:: metrics_cli::snapshot::   # phase 02 worktree
cargo test -p fgos-agent-protocol --test terminal_vectors                               # phase 03 worktree
```

Expected: exactly the routed red tests fail, each on its stated assertion; every other test passes, except `friction::tests::test_friction_record_resolve_lifecycle`, which is already flaky on main (same-millisecond B-O4, report "Found on the way") and turns green in phase 02.

## Risk

| Risk | L × I | Mitigation |
|---|---|---|
| Cherry-pick conflicts after the cutover rebase | L × L | The red commits touch only crate test code and fixtures; the census hunk is dropped and regenerated |
| The RT-01 red test is forgotten on its branch | M × M | Hand-off row in plan.md and in the parent plan's T4 "Received" section, written the same turn (memory rule "record every handoff") |

## Rollback

Nothing lands in this phase. Deleting the worktree branches undoes it.
