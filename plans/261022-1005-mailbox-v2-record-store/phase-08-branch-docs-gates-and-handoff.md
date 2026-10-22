---
phase: 8
title: "Branch docs, full gates, review, hand-off"
status: completed
depends_on: [7]
---

# Phase 8: Branch docs, full gates, review, hand-off

## Requirements

1. **Branch spec `docs/platform/agent-mailbox/spec.md`:**
   - header `Implementation status`: V2 built on the branch;
   - §4.1 table and "Source" line: `src/record/` and its files;
   - §6.4: the layout (`<fgosDir>/runtime/mailbox/record/snapshot.json`, `record/bodies/<id>.body`, and `runtime/mailbox/` itself left for files written without the mutex), named as owned by `record/paths.rs`; the commit-point rule (an error only before the rename); the per-hold directory check and the `O_NONBLOCK` regular-file reads; the lock row as added; "Mutual exclusion" sentence "V2 proves this on the mailbox's own path" becomes the proof reference (`tests/record_crash.rs`); body-before-snapshot and the two-part garbage collection; the rule that any new file in the record directory must be added to `Paths::is_known`; version 1 frozen by the fixture;
   - §10: the two crash rows point at `tests/record_crash.rs`; a row "A body file is replaced by a symlink or a larger file" -> "read refused, framed as body-missing";
   - §11: mark the V2 Core-suite items with their owning test files;
   - §14 V2 row: "Built on branch" with the proof command and the cost report link;
   - §16/§17: plan decisions 1-13 as agent decisions; owner questions Q1 and Q2 of this plan in §16 with their provisional defaults.
2. **Holder-lock spec** already edited in phase 1; verify it.
3. **Full gates on a fresh main merge:**
   - `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --all --check`;
   - `npm test`;
   - `fgos doctor` check `git-mutation-one-door` green (census current);
   - `fgos convention check --all --json`: no violation names a file the plan added under `plans/` or `docs/`.
4. **Review:** an `ak-code-review` of the branch diff since V3's close. Report path from `fgos convention path --kind report --type review --slug mailbox-v2-final-review --json`. Fix Critical/High before closing; Medium either fixed or listed with a reason.
5. **Close:** `plan.md` `status: completed`, every phase `status: done`; push; report to the controller (board row `MAIL`, which the controller updates).

## Gates

The list in requirement 3. Long commands follow the plan's "exit must be observable" rule.

## Done when

All gates green on a fresh main merge, the review has no open Critical/High, and the controller has the hand-off: proof command, cost report path, owner questions Q1/Q2 and their current defaults, and what V4 inherits (the hold API, `Record::body`, `hook.lockWaitMs`).

## Done on the branch (2026-10-22)

The review step was skipped at the coordinator's instruction: the coordinator runs an independent review.

### Docs

Branch spec `docs/platform/agent-mailbox/spec.md`:
- Implementation status and §4.1 layout table.
- §6.4 "Built at V2": the layout owned by `record/paths.rs`, the commit point, the directory check and regular-file reads, the change-report write rule, the two-part collection, `Paths::is_known`, the frozen fixture.
- §10: crash rows plus a planted-body row. §11: owning test files. §14: the V2 row.
- §16: items 20 (Q1, answered B) and 21 (Q2, answered B).
- §17: implementation decisions 1–13, decision 3 reversed, owner Q1 and Q2, M2-A, self-send-B, self-send counting.
- The holder-lock spec lines from phase 1 are present.

### Gates (final tree, main `1aca9e83e` merged)

Run under the coordinator's memory limits: one heavy gate at a time, `CARGO_BUILD_JOBS=4`, `--test-threads=4`, `npm test -- --test-concurrency=4`, and `free -g` checked before each heavy gate (16 to 21 GB available).

| Gate | Result |
|---|---|
| `cargo test --locked -p fgos-mailbox -p fgos-mailbox-core -p fgos-holder-lock` | 253 passed, 0 failed |
| `cargo test --locked --workspace` | 1446 passed, 0 failed, 11 ignored |
| `cargo clippy --locked --workspace --all-targets -- -D warnings` | clean |
| `cargo fmt -p fgos-mailbox -p fgos-mailbox-core -- --check` | clean |
| `cargo fmt --all -- --check` | fails only outside `packages/mailbox`, in files this branch does not touch (workspace drift, item `tsk-hls`) |
| `npm test` (branch) | 8853 tests, 8739 passed, 18 failed: `fgctl-upgrade` 15, `fgctl-init-download-sources` 2, `dispatch` 1 |
| `npm test` on a clean `origin/main` worktree (sibling directory, same limits) | 8847 tests, 8733 passed, 18 failed: the same 18 titles. With C-locale sorted lists, there is no title that fails only on the branch and none that fails only on main |
| `node scripts/git-one-door-scan.mjs --check` (the census behind doctor's `git-mutation-one-door`, which compares an activated release; this branch is never activated) | exit 0, 0 undeclared sites on the tree with main `1aca9e83e`. After the last merge (main `9e487b3d9`) it exits 1 with 5 undeclared sites (`unresolved-binary` in `bin/fgos.mjs`, `src/runner/merge.mjs`, `src/runner/worktree.mjs`). A clean `origin/main` worktree gives the same 5 and the same exit 1, and main's own board records them (`9e487b3d9`), so the failure is inherited and none of the sites is in a branch file. The census was regenerated: it lists every branch file |
| `fgos convention check --dir . -- <48 files this rung added or changed>` | 0 violations |

A first attempt at the main comparison, from a worktree under the session scratch directory in `/tmp`, was discarded: its run lost its own test helpers mid-run (`ERR_MODULE_NOT_FOUND`), and its 382 failures were caused by the location, not by main. Both temporary worktrees were removed.

### Hand-off (what V4 and V5 inherit)

- Proof command: `cargo test -p fgos-mailbox`.
- Cost report: `plans/reports/research-261022-1145-mailbox-v2-record-costs.md`, three runs.
- The hold API: `Record::open(fgos_dir)`, `hold` / `hold_observed(wait, now, limits, [observe,] mutate)` with `ReportsChange`, `send` / `send_observed`, `Record::body(id, expected_bytes, limits)`, `RecordError::code()`, `Held { value, wrote, warning, collected }`.
- `mailbox.hook.lockWaitMs`: V4/V5 pass `Wait::Ms(hook.lock_wait_ms)`.
- The `.fgos` directory is a parameter.
- `LockScope::seeded(vec![])` checks no rank against locks the caller holds: V5 must take the mailbox lock with nothing else held, or seed the scope.
- Owner questions: Q1 answered B (one-day retention, applied); Q2 answered B (dead names skipped, applied). None open.

### Final merge (main `9e487b3d9`; Node-only changes since `1aca9e83e`)

- `npm test -- --test-concurrency=4` on the final tree: 8850 tests, 8736 passed, 18 failed. The 18 titles are exactly those that fail on clean main, compared above.
- The Rust gates are unaffected, because main changed no Rust file since they ran.

