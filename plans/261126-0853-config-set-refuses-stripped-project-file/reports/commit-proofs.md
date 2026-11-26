# Owning Commit Proofs

Report for Phase 2 of `plans/261126-0853-config-set-refuses-stripped-project-file/plan.md`.

## Commit Guard Proofs

| Guard | Location | Owning Test File | Owning Test Name | What it asserts |
|---|---|---|---|---|
| Scoped commit store-path drop and skip-worktree drop | `packages/git/rust/src/scoped_commit.rs:371,1574` | `packages/git/rust/tests/scoped_commit_sync.rs` | `scoped_commit_drops_store_paths_and_ignores_absent_skip_worktree_paths` | Asserts that `scoped_commit` excludes store paths (`.fgos/*`) from the committed HEAD tree even when matching the requested write scope, and ignores absent `--skip-worktree` paths during snapshotting so they neither abort the commit nor get committed. |
| Pre-commit staged `.fgos/` deletion guard | `.githooks/pre-commit:661-664` (`stagedFgosDeletions`) | `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` | `tsk-56u: a worktree commit staging a .fgos/ deletion (git add -A after the ADR0020 strip) is refused` (line 298), and `tsk-56u: the same staged .fgos/ deletion is refused in the main checkout too, not gated by hookRunsAtHome` (line 315) | Asserts that running `git commit` with staged deletions under `.fgos/` (such as after `git add -A` in a stripped worktree or in the main checkout) is unconditionally refused. |
| Pre-commit worker-branch `.fgos/` change guard | `.githooks/pre-commit:669-672` (`stagedFgosChangesOnWorkerBranch`) | `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` | `tsk-5pb: a worktree commit staging a .fgos/ modification on a worker branch is refused` (line 351) | Asserts that any commit staging modifications under `.fgos/` on a `fgw/*` worker branch is refused. |
| Land candidate `.fgos` target restoration | `packages/git/rust/src/land.rs:578-605` | `[Gap]` (owning file `packages/git/rust/tests/land.rs` is outside footprint) | `[None]` | Gap: `packages/git/rust/src/land.rs:578-605` resets `--skip-worktree` and restores tracked `.fgos` entries from `req.target` onto the candidate worktree, but no test in `packages/git/rust/tests/land*.rs` currently asserts this behaviour; recorded for Phase 3 to raise as a follow-up via `fgos supervisor raise`. |

## Notes on Tests Read

1. **Store-path rule and skip-worktree drop in scoped commit (`packages/git/rust/src/scoped_commit.rs:371, 1574`):**
   - Prior to this phase, `packages/git/rust/tests/scoped_commit_sync.rs` only tested store-path declarations in `sync.rs` (`prepare_sync`/`continue_sync`).
   - Extended `packages/git/rust/tests/scoped_commit_sync.rs` with `scoped_commit_drops_store_paths_and_ignores_absent_skip_worktree_paths`, which directly exercises `is_store_path` (line 371 / 1480) and `!skipped.contains(p)` (line 1574).

2. **Pre-commit guards (`.githooks/pre-commit`):**
   - Read `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:298-370`.
   - The owning tests already exist and pass for both the staged deletion guard (`tsk-56u`) and worker branch `.fgos` change guard (`tsk-5pb`). No duplicate cases added.

3. **Land candidate `.fgos` target restoration (`packages/git/rust/src/land.rs:578`):**
   - Read `packages/git/rust/src/land.rs:578-605`, `packages/git/rust/tests/land.rs`, `packages/git/rust/tests/land_push_catch_up.rs`, and `packages/git/rust/tests/land_crash_matrix.rs`.
   - No test in `packages/git/rust/tests/land*.rs` tests the candidate worktree `.fgos` target restoration.
   - The owning test file `packages/git/rust/tests/land.rs` is outside Phase 2's write footprint (`plans/261126-0853-config-set-refuses-stripped-project-file/reports/commit-proofs.md`, `packages/git/rust/tests/scoped_commit_sync.rs`, `packages/git/rust/tests/land_push_catch_up.rs`, `test/e2e/root-file-guard-hook.test.mjs`). Per Phase 2 Step 3 and Phase 3 Step 4, this gap is recorded here for Phase 3 to raise as a follow-up.
