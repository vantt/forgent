# Phase 2: Name the owning commit proofs

Capability: `code:test`. Depends on: none. Wave 1.

## Inputs

- `plans/discussions/ds-gszx4utkr4-config-set-dir-never-overwrites/DISCUSSION.md`, D4 and section 3 row 3.
- `packages/git/rust/src/scoped_commit.rs:371` (`is_store_path`) and `:1574` (skip-worktree paths dropped).
- `.githooks/pre-commit`: the staged `.fgos` deletion guard and the `fgw/*` `.fgos` guard.
- `packages/git/rust/src/land.rs:578`, where land restores `.fgos` from the target.

## Files this phase may write

`plans/261126-0853-config-set-refuses-stripped-project-file/reports/commit-proofs.md`,
`packages/git/rust/tests/scoped_commit_sync.rs`, `packages/git/rust/tests/land_push_catch_up.rs`,
`test/e2e/root-file-guard-hook.test.mjs`.

## Steps

1. For each guard, find its owning test:
   - store-path rule and skip-worktree drop:
     `rg -n "is_store_path|skip.worktree|store_path" packages/git/rust/tests packages/git/rust/src --glob '*.rs'`;
   - pre-commit guards: `rg -n "\.fgos" test/e2e test/githooks test/runner --glob '*.test.mjs' | rg -i "delet|fgw"`;
   - land restore: `rg -n "fgos" packages/git/rust/tests/land*.rs`.
2. Write `reports/commit-proofs.md`: one row per guard with the test file, the test name, and one sentence on
   what it asserts. Cite only tests you read.
3. A guard with no owning test: extend the owning test file with one case (a test in a file outside this phase's
   footprint means: stop, write the gap into the report, and leave it for phase 3 to raise as a follow-up). Never
   add a second copy of an existing case.

## Verify

```bash
test -s plans/261126-0853-config-set-refuses-stripped-project-file/reports/commit-proofs.md
cargo test -p fgos-git --test scoped_commit_sync   # only if a case was added there
```

Pass: the report names a test for each of the three guards, or names the gap. Any test added passes.

## Rollback

Delete the report and revert any added case.
