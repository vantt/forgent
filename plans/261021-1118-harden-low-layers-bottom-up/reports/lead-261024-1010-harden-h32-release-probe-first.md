# H32 release probe first

Branch harden/h32-release-probe-first (pushed). Files: packages/holder-lock/rust/src/driver/flock.rs, docs/platform/holder-lock/spec.md (5, one "Update, 2026-10-24" sentence).

## Change
`settle_release` now tries the private inode-checked `LOCK_SH|LOCK_NB` probe first each pass. Granted: unlock_private, close, Released. Refused/absent: straight to the existing tagged scan (locked_fds reads the table itself), kill rules, killWaitMs bound, lock-release-stuck unchanged.
The old `lock_table_entries()` read only gated whether to probe (tagged==Some(false)); it never fed the scan, so it is removed from this path rather than moved after the probe. A leaked EX copy refuses the probe anyway, so skipping the probe on a positive record was redundant. Import of lock_table_entries dropped; the fgos-process function stays (own tests use it).

## Proof
No counter seam exists; no test-only hook added. Correctness proof = existing owning tests in packages/holder-lock/rust/tests/borrow_io.rs (leaked copy / pre-existing recipient with multi-page table / replaced resource) and port.rs tests, all green: the leaked-copy path is probe refused -> scan -> kill/stuck. "Table not read" is by construction (no call remains in the function). Timing: a standalone `cat /proc/locks` here is ~0-10 ms with 54 records; the 22 ms WORK figure is from its loaded machine, not re-measured.

## Gates
- cargo test -p fgos-holder-lock: all green (26 + 20 + ... suites ok)
- cargo test -p fgos-process: all green
- clippy -p fgos-holder-lock --all-targets -D warnings: clean
- cargo check windows-msvc: ok; aarch64-apple-darwin: ok (18 warnings, same count before and after; function is cfg(linux) only)
- git-one-door-scan: 5 undeclared unresolved-binary sites, unchanged
- Net: flock.rs +12/-17 (-5 lines)

## Follow-up commit (L10: delete the old path)
Removed `lock_table_entries` (platform/linux.rs), its facts.rs re-export, and two tests that proved only the removed read (multi-page seq_file; table/fdinfo stamp agreement). Behaviour removed: release no longer reads /proc/locks. LockEntry/parse_lock stay (fdinfo). No other workspace caller (rg packages apps). Spec §5: 2026-10-24 sentence rewritten (probe first, fdinfo scan, no /proc/locks), "table/probe/scan" -> "probe/scan".
Gates rerun: test fgos-process + fgos-holder-lock green; clippy -D warnings both crates clean; msvc + darwin check OK; one-door scan 5 unchanged.
Net Rust over both commits: see `git diff --stat origin/main` (second commit removes roughly 70 lines).
