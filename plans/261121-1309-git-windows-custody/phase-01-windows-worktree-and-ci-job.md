# Phase 1: Linked worktree trust and plain paths on Windows, CI job

## Inputs
- plan.md (Facts); backlog rows p-nk6xf5laob and p-w4cxqq2sbw in docs/backlog.md.
- packages/git/rust/src/driver.rs (`topology_on_disk` ~535, `text_path`), packages/git/rust/src/worktree.rs (`text()`,
  `worktree add|remove|move` argument building), `fgos_process::path::plain_path`.
- packages/distribution/rust/src/release_rows.rs and workspace.rs: their linked-worktree tests are gated on Unix.
- .github/workflows/release-assets-check.yml, job `windows-cwd-lease-owner` (pattern for a native Windows job).

## Files it may write
packages/git/rust/src/driver.rs, packages/git/rust/src/worktree.rs, packages/git/rust/tests/worktree.rs,
packages/distribution/rust/src/release_rows.rs, packages/distribution/rust/src/workspace.rs,
.github/workflows/release-assets-check.yml

## Steps
1. Resolve the `gitdir` backlink against the admin directory (relative backlinks too, for
   `worktree.useRelativePaths`) and compare both sides in one canonical spelling, so a linked worktree is trusted on
   Windows and with relative paths on Linux.
2. Every path handed to a child git goes through the driver's `text_path` door (plain spelling, never `\\?\D:\`);
   `worktree.rs` calls it instead of its own twin.
3. Un-gate the linked-worktree tests in packages/git/rust/tests/worktree.rs and the distribution `release_rows` and
   `workspace` tests that were gated only for this reason. Add one Linux case for a relative backlink.
4. Add job `windows-git-custody` (name: `windows git custody`, runs-on windows-latest, same toolchain and rust-cache
   steps as `windows-cwd-lease-owner`) with steps: `cargo test --release -p fgos-git --test worktree`, and
   `cargo test --release -p fgos-distribution --lib release_rows workspace`.

## Verify
- Linux: `cargo test -p fgos-git -p fgos-distribution`, `cargo clippy -p fgos-git -p fgos-distribution --all-targets -- -D warnings`,
  `cargo fmt --check`, `cargo check -p fgos-git -p fgos-distribution --all-targets --target x86_64-pc-windows-msvc`.
- Windows: the branch's `release-assets-check` run (workflow_dispatch) has `windows git custody` green.

## Rollback
Revert the phase's land commit.
