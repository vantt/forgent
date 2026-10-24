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

## Second pass: fgos-process and fgos-holder-lock (same branch, new commit)
Before (--all-targets): windows fgos-process 2 lib + 2 conformance-test warnings; darwin fgos-process 1, fgos-holder-lock 12 lib + 2 multiprocess-test. After: 0 on both targets for fgos-process, fgos-holder-lock, fgos-git.
- facts.rs: `Stat::is_gone` gated `cfg(target_os = "linux")` (only linux modules call it).
- windows_job.rs: unused `ORPHAN_SETTLE` dropped from the `os` module import (the tests reach it through `super::*`).
- flock.rs: `Reach`, `Tree`, `Cleanup`, `cleanup_loop`, `drain_description`, `parent_and_group`, `in_borrow_domain`, `in_domain` and the HashMap/HashSet import gated `cfg(target_os = "linux")` (their only users are linux functions). The non-linux `has_borrowed_copy` returning false was dead on macOS too (all callers are linux-only), so it is deleted.
- tests/multiprocess.rs: `declare`, `observe`, `Observed` imports gated linux like their tests.
- tests/containment_conformance.rs: `Props.double_fork_escapee_survives` exists only on unix (read only there; windows initializer removed); windows `TermProbe` arm reads `handler`.
- Refinement: the three `cfg(unix)`/`cfg(not(unix))` binding pairs (objects.rs `files`, restore.rs and sync.rs `clean_modes`) are now one binding each with `#[cfg_attr(not(unix), allow(unused_mut))]`. No other allow anywhere.
- Census regenerated again (10 lines).

Δ (second commit): 9 package files, +36/-31 lines (Rust and tests +26/-21, census +10/-10); net -5 Rust lines. No tests added or removed.

## Commands
- `cargo check -p fgos-git --all-targets --target x86_64-pc-windows-msvc`: 0 fgos-git warnings
- `cargo check -p fgos-git --all-targets --target aarch64-apple-darwin`: 0 fgos-git warnings
- `cargo clippy -p fgos-git --all-targets -- -D warnings`: pass (second pass: `-p fgos-process -p fgos-holder-lock -p fgos-git`, pass)
- second pass: windows and darwin `cargo check` of all three crates `--all-targets`: 0 warnings; `cargo test -p fgos-process -p fgos-holder-lock --lib`: 20 + 40 passed; fgos-git lib 73 passed
- `cargo test -p fgos-git --lib`: 73 passed, 0 failed (22 s)
- `node scripts/git-one-door-scan.mjs --root .`: 5 undeclared (unchanged); census regenerated with `--write-census`
