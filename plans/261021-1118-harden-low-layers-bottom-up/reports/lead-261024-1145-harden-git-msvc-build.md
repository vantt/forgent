# HARDEN git msvc build — report

Branch harden/git-msvc-build, commit 70c82c420 (pushed, not merged). COMPILE-CHECKED ONLY for Windows; never run on Windows.

## Changes
- refs.rs recover_ref_operation: custody_lock_path check cfg(unix); cfg(not(unix)) calls require_lock_scope_platform() (named refusal `git-lockscope-unavailable-windows`, same refusal acquire_worktree_admin already raises first; spec section 19 item 5 "Windows driver not activated"; same pattern as worktree_custody). Not a silent skip.
- worktree.rs: libc::geteuid replaced by current_euid() (unix = geteuid, else None); cwd_owner_requires_judgment takes Option current; unknown owner or no uid notion = needs judgment (conservative, warning raised). Test extended with the None-current case. Windows scan is Scan::Unsupported anyway.
- process tests/common/mod.rs: import ContainmentDriver trait (msvc E0599 x2).
- run-supervisor tests/support/terminal.rs: ptsname instead of ptsname_r (absent on macOS libc).
- mutation-census.v1.json regenerated (12 lines) and staged.

## Results
- check --all-targets for the 4 crates: windows-msvc OK, aarch64-apple-darwin OK.
- Warnings (before -> after): darwin identical (process 1, holder-lock 12+2, run-supervisor 1, git 2/3) ; before on darwin run-supervisor steps_runner test failed to compile (ptsname_r). Windows before: process 2, run-supervisor 2, git did not compile (18 emitted before abort); after: process 2+2, run-supervisor 2, git 20 (lib). None introduced by this change; git's Windows warnings are dead code behind the Windows lock-scope refusal (restore.rs, grant.rs, worktree.rs, driver.rs, native_lock.rs...), left alone as outside scope; candidate follow-up item.
- Linux: cargo test 4 crates exit 0 (99 result lines ok); clippy --all-targets -D warnings clean.
- one-door scan: 5 undeclared unresolved-binary sites, unchanged.
