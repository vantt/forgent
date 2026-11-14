---
phase: 4
title: "Uninstall's purge guard uses the state root's own home rule"
status: pending
effort: 0.5d
leak: "census rank 4, the uninstall.rs part (F0 phase 08 records it as debt for step S4)"
startAfter: ["F0 wave A on main"]
landAfter: []
---

# Phase 04: Uninstall's purge guard through the state-root home rule

<!-- Red team 2026-11-14: rewritten. uninstall.rs home_dir() is not a global-directory chooser; it feeds the purge guard,
which must use the same home rule as the state root it protects. No fgos-config edge, no Cargo.lock change. -->

Rules: `phase-lead-rules.md`. pNN = `p04`; report slug `odd-p04-uninstall-home-guard`; crates `fgos-holder-lock`, `fgos-distribution`, `fgctl`.
Facts: `phase-00-facts.md` "Leak 4 remainder".

Split with the other plans: F0 phase 04 moves the work-state root walk; F0 phase 06 builds Config's global-directory function and
moves five Node choosers; phase 16 here moves `src/setup/registrations.mjs:517`. This phase removes the last private home reader,
`packages/distribution/rust/src/uninstall.rs:445-449`, which F0 left as debt for S4. S4 then has nothing left to move for it.

## Context

- `home_dir()` (HOME, then USERPROFILE, on every platform) has one caller: `guard_store_root(store_root, home_dir().as_deref(), ...)`
  at `uninstall.rs:517`, which refuses `--purge` when the store root equals or contains home (`uninstall.rs:133-161`).
- The store root comes from `resolve_machine_release_store_root()` -> `fgos_holder_lock::state_root::state_root()`
  (`packages/distribution/rust/src/store.rs:66-70`), whose rule is HOME, then USERPROFILE, on every platform
  (`packages/holder-lock/rust/src/state_root.rs:70-90`). The guard must use that same rule; Config's rule
  (`packages/config/rust/src/machine.rs:95-106`, USERPROFILE only on Windows) would let a Git Bash `HOME` under the store root pass.
- `fgos-distribution` already depends on `fgos-holder-lock`: no new edge, no `Cargo.lock` change.

## Requirements

1. `state_root.rs`: expose the home rule it already applies as one public function (for example `home_for_state_root()`),
   and make `state_root_from` call it. Nothing is copied: the reading code moves into the function.
2. `uninstall.rs`: delete `home_dir()`; the guard calls the holder-lock function.
3. `doors`: if F0's "global fgOS directory" row is on your base and lists `uninstall.rs` as debt, remove the entry (its pattern
   `fn home_dir\(` no longer matches). If the row's pattern would match the new holder-lock function name, name it in `allowed`
   with the reason "the state root's home rule; Config's global directory is a different rule". If the row is not on your base,
   follow the rules file.
4. Record in the report, as an item for the big lead (not fixed here): two home rules exist on purpose or by accident
   (`state_root.rs` HOME-first everywhere; `machine.rs` USERPROFILE on Windows). Which one is right is a separate question.

## Files

- Modify: `packages/holder-lock/rust/src/state_root.rs`, `packages/distribution/rust/src/uninstall.rs`, `docs/architecture-manifest.json` (if the row exists).
- Tests: one uninstall test that sets the state root equal to `HOME` while `USERPROFILE` differs and asserts `--purge` is refused
  (why new: no test pins the guard to the state root's rule); the home-rule cases stay owned by `state_root.rs` tests.
- Delete: none. Cargo.lock: unchanged.
- Net size: Rust about -5, tests +20.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-holder-lock -p fgos-distribution -p fgctl --all-targets -- -D warnings`;
`cargo test -p fgos-holder-lock -p fgos-distribution -p fgctl`; `cargo check -p fgos-holder-lock -p fgos-distribution -p fgctl --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs test/holder-lock/*.test.mjs`.

## Risk and rollback

- The purge guard weakens (L x H): the guard keeps the exact rule of the root it protects; the new test pins it.
- Rollback: revert the phase; if F0's row has landed without the debt entry by then, the revert adds the entry back in the same commit.
