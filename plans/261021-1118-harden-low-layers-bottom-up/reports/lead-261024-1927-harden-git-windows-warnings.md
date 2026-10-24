# fgos-git: windows-only dead-code warnings removed

## Warnings (fgos-git, `--all-targets`)
| target | before | after |
|---|---|---|
| x86_64-pc-windows-msvc | 20 lib / 22 lib-test | 0 |
| aarch64-apple-darwin | 2 lib / 3 lib-test | 0 |
| linux clippy -D warnings | 0 | 0 |

The darwin warnings were found while gating: `pid_named_by` and `InterruptExchange` were linux-only users too.

## Changes per item (cfg moved to the users' cfg; no allow attributes, no stubs, no deletions)
- grant.rs: wal/fs imports moved into the `cfg(unix)` block of `check_cutover_grant`.
- driver.rs: `hook_deletions` and test struct `UnemptiedDriver` (+ impl) gated `cfg(unix)` (only unix tests/grant use them).
- native_lock.rs: `record_owned_index_lock` `cfg(all(test, unix))` (test module is unix-only); test struct `InterruptExchange` `cfg(target_os = "linux")` (linux tests only).
- worktree.rs: `pid_named_by` `cfg(target_os = "linux")` (only linux `lock_names_live_process`); `worktree_custody` now returns the unix block / non-unix block as tail expressions (no unreachable `Ok(())`); `existing` + mutable `resource_set` built inside a `cfg(unix)` block; `repo` added to the non-unix `let _ = (...)` list of `create_detached_worktree`.
- restore.rs: `io::Write` import moved into the unix block of `extract_restore_path`; its unix/non-unix blocks are tail expressions, non-unix consumes `bytes, filename`; `collision_metadata` declared `cfg(unix)`, `indexed` consumed on non-unix; `clean_modes` mutable only on unix; mode merge rewritten as shadowing `let mode = if ... else { mode }` on unix (no `mut`).
- sync.rs, objects.rs: `mut` only on unix (`files`, `clean_modes`), non-unix binding immutable.
- wal.rs: `common` consumed in the non-linux branch of `open_trusted`.
- scoped_commit.rs: `lease` still required (missing-handle error unchanged); consumed on non-unix.
- packages/git/contracts/mutation-census.v1.json: regenerated (line numbers shifted, 15 lines).

Behaviour unchanged on every platform: unix/linux code is textually the same logic; non-unix paths return the same errors in the same order.

## Delta
Rust: 60 insertions, 32 deletions in 9 src files (net +28, all cfg lines / block braces). Tests: none added or removed (only two test helper types gated).

## Not fixed (other crates, out of scope for fgos-git)
fgos-process: `ORPHAN_SETTLE` unused import (windows_job.rs:268), `Stat::is_gone` unused (facts.rs:482, windows and darwin); fgos-holder-lock: 12 dead items in driver/flock.rs on darwin. They appear only in dependency crates, not in fgos-git output.

## Commands
- `cargo check -p fgos-git --all-targets --target x86_64-pc-windows-msvc`: 0 fgos-git warnings
- `cargo check -p fgos-git --all-targets --target aarch64-apple-darwin`: 0 fgos-git warnings
- `cargo clippy -p fgos-git --all-targets -- -D warnings`: pass
- `cargo test -p fgos-git --lib`: 73 passed, 0 failed (22 s)
- `node scripts/git-one-door-scan.mjs --root .`: 5 undeclared (unchanged); census regenerated with `--write-census`
