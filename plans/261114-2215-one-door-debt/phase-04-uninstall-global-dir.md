---
phase: 4
title: "Uninstall finds the global directory through Config"
status: pending
effort: 0.5d
leak: "census rank 4, the uninstall.rs part (F0 phase 08 records it as debt for step S4)"
startAfter: ["F0 wave A on main", "F0 phase 06 on main (the Config global-directory function exists)"]
landAfter: []
cargoLock: "one line: fgos-distribution gains fgos-config; needs the big lead's approval before starting"
---

# Phase 04: Uninstall through Config's global directory

Rules: `phase-lead-rules.md`. pNN = `p04`; report slug `odd-p04-uninstall-global-dir`; crates `fgos-distribution`, `fgctl`.
Facts: `phase-00-facts.md` "Leak 4 remainder".

Split with the other plans: F0 phase 04 moves the work-state root walk; F0 phase 06 builds the Config function, `globalFgosDir()`
in Node and moves five Node choosers; phase 16 here moves `src/setup/registrations.mjs:517`. This phase moves the last Rust
chooser, `packages/distribution/rust/src/uninstall.rs:445-449`, which F0 assigned to S4 only because of the crate edge. S4 then
has nothing left to move for it; the big lead tells the F0 lead.

## Requirements

1. Add `fgos-config` to `packages/distribution/rust/Cargo.toml` (path dependency, the same feature set other crates use for
   `fgos-config`; cycle-free, phase 00). Update `Cargo.lock` by `cargo` itself (expect exactly one added line in the
   `fgos-distribution` entry); show the lock diff to the big lead before committing.
2. Delete `uninstall.rs` `home_dir()` and call the Config function F0 phase 06 named for the global directory (read its name
   from F0's phase 06 report or `packages/config/rust/src/machine.rs`). Uninstall now uses Config's home rule (HOME on unix,
   USERPROFILE on Windows, whitespace rejected) instead of "HOME then USERPROFILE everywhere": user-visible only on Windows
   with `HOME` set (Git Bash); propose the `## [Unreleased]` line.
3. `doors`: if F0's "global fgOS directory" row is on your base, remove its `uninstall.rs` debt entry. If not, follow the
   rules file (fix only, report it).

## Files

- Modify: `packages/distribution/rust/Cargo.toml`, `Cargo.lock` (approved, one line), `packages/distribution/rust/src/uninstall.rs`,
  `docs/architecture-manifest.json` (debt entry removal, if the row exists).
- Tests: the uninstall tests that build a fake home (`rg -n "HOME|USERPROFILE" packages/distribution/rust apps/fgctl/tests`) keep
  passing; add one case only if none sets `HOME` for uninstall (owner: Config's home rule tests in `machine.rs`).
- Net size: src about -8, manifest -1.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-distribution -p fgctl --all-targets -- -D warnings`; `cargo test -p fgos-distribution -p fgctl`;
`cargo check -p fgos-distribution -p fgctl --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- Windows home differs for Git Bash users (L x M): documented change, Config's rule is the product rule.
- Rollback: revert the phase (including the lock line).
