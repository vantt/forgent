# Phase 4 — Door row, census, changelog, integration gate

Wave 2, after phases 1, 2 and 3. Runs on the branch that merges the three wave-1 branches (base `e8621a54826408a539af371ffc6a81b3ac16d76a`).

## Inputs

- `docs/history/windows-plain-path-fold/DISCUSSION.md` D4 and acceptance list.
- `docs/architecture-manifest.json` `doors` array (line ~95; copy the shape of an existing `kind: "door"` row).
- `test/architecture.test.mjs:1761` (`DOOR_ROOTS`), `:1792` (`doorText` blanks Rust test code and comments), `:1816` (`checkDoors`), `:1878` (the test "every door row holds").
- `CHANGELOG.md` `## [Unreleased]` (line 8); `docs/backlog.md` row p-2r54ft6njh (line ~287).

## Footprint

- `docs/architecture-manifest.json`
- `packages/git/contracts/mutation-census.v1.json` (generated)
- `CHANGELOG.md`
- `docs/backlog.md`

## Steps

1. Merge the phase 1, 2, 3 branches into the integration branch (no conflicts expected: footprints disjoint).
2. Append one row to `doors`:
   ```json
   {
     "job": "write a Windows verbatim path plainly",
     "kind": "door",
     "patterns": ["r#*\"\\\\\\\\\\?\\\\"],
     "allowed": ["packages/process/rust/src/path.rs"],
     "debt": [],
     "reason": "only fgos_process::path turns a Windows verbatim path (\\\\?\\D:\\x, \\\\?\\UNC\\host\\share) into the plain spelling Git, cmd.exe, shells and Node accept; a hand strip names the prefix as a Rust raw-string literal. Rust test code and comments are blanked and tests/ dirs are pruned, so test literals do not match; a prefix built without a raw-string literal is not seen"
   }
   ```
   The pattern (JSON-decoded `r#*"\\\\\?\\`) matches `r"\\?\` and `r"\\?\UNC\` and `r#"\\?\`, and does not match the Node copy (`'\\\\?\\'`). If any wave-1 phase did not merge, list each remaining site file under `debt` with a reason instead of leaving the row red.
3. Seed check (by hand, not committed): add `let _ = "x".strip_prefix(r"\\?\");` to a product file such as `packages/distribution/rust/src/shim.rs`, run the architecture test, confirm the row fails naming that file, then revert.
4. Regenerate the census: `node scripts/git-one-door-scan.mjs --root . --write-census`. Never hand-edit. Confirm the scan count is not higher than at base (`git stash`-free: run `node scripts/git-one-door-scan.mjs --root .` on base in another worktree or read the count from the base census).
5. CHANGELOG `## [Unreleased]`: one line, e.g. "Windows: a project on a UNC share (`\\host\share`) now gets an absolute agent-hook command, workspace root and payload path instead of a relative `UNC\...` path."
6. `docs/backlog.md`: mark row p-2r54ft6njh done per the backlog's own done convention (read the file's header for it), citing the landing commit.
7. Stage explicit paths only; `git diff --stat` before commit and check for unexpected deletions.

## Verify (integration gate)

```bash
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/trial-pathfold-target
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --all --check
cargo check --target x86_64-pc-windows-msvc -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl --tests
cargo check --target aarch64-apple-darwin -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl --tests
node scripts/run-tests.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs
rg -n -F 'r"\\?\' --type rust | grep -v '^packages/process/rust/src/path.rs'
```

Pass: every command green; the last grep shows only uninstall.rs test literals and comments; the seed check in step 3 failed as expected and was reverted.

## Rollback

`git revert` the phase commit (row, census, changelog, backlog together). To roll back the whole item, revert the merge commit on main.
