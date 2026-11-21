# Phase 5: Git ports take custody on Windows

## Inputs
- plan.md (Facts); phases 1-3 landed. docs/platform/git/spec.md sections 5, 6 (custody), 18 (Q6).
- packages/git/rust/src/lib.rs `require_lock_scope_platform` and its callers: repository_config.rs:146,
  refs.rs:629/982/1014/1214, remote.rs:110, scoped_commit.rs:288, land.rs:397/818/1184/1255/1518/1859.
- scoped_commit.rs `binding()` (~329-331), `checkout_resources` custody path and `checkout-custody-stale` (~355-366);
  native_lock.rs `native-lock-identity-unavailable` (~175) and its Linux-only gates; restore.rs `cfg(unix)` gates;
  publication.rs:94 (Linux-only event-seal borrow); recovery.rs; sync.rs.
- packages/supervision/rust/src/land.rs `push_local`; packages/execution/checkout/src/{admin,git,resync}.rs.

## Files it may write
packages/git/rust/src/{lib,scoped_commit,sync,land,refs,remote,restore,recovery,repository_config,native_lock,publication}.rs,
the git tests named in the plan's phase table, packages/git/contracts/mutation-census.v1.json,
packages/supervision/rust/tests/land.rs, packages/execution/checkout/tests/**,
.github/workflows/release-assets-check.yml

## Steps
1. Delete `require_lock_scope_platform` and every call; delete the `git-lockscope-unavailable-windows` code.
2. Give each Unix-only arm its Windows answer through existing doors: custody path and staleness via the holder-lock
   handle's resource and `same_file`; native lock identity via the Windows file id the holder-lock driver already
   reads; restore and publication borrows through `run_borrowed(_io)`. A gate that stays (true Linux-only semantics)
   names its reason.
3. Un-gate the scoped commit, sync, land, restore, refs, recovery and repository-config tests on Windows; the land
   test in packages/supervision and the checkout tests too.
4. Add steps to `windows git custody`: `cargo test --release -p fgos-git`, `cargo test --release -p fgos-supervision --test land`,
   `cargo test --release -p fgos-checkout`.

## Verify
- Linux: `cargo test -p fgos-git -p fgos-supervision -p fgos-checkout`, clippy -D warnings, fmt, msvc check of those
  crates plus `-p fgos`; `rg -n "git-lockscope-unavailable-windows" packages apps` is empty except the S6A-owned
  engine refusal text if any (report it).
- Windows: `windows git custody` green.

## Rollback
Revert the phase's land commit.
