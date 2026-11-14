---
phase: 3
title: "Activation record written through Durable File; one row for Rust durable syncs"
status: pending
effort: 1d
leak: "census rank 3, plus the Rust half of rank 9 (classification only)"
startAfter: ["F0 wave A on main"]
landAfter: []
---

# Phase 03: Activation record through Durable File

Rules: `phase-lead-rules.md`. pNN = `p03`; report slug `odd-p03-activation-durable`; Rust crates `fgos-distribution`.
Facts: `phase-00-facts.md` "Leak 3" and "Leak 9" (Rust list). Census Q3 is answered there: a missed migration.

## Outcome

`activation.json` is written by `fgos_durable_file`, like the shim and fgctl refresh in the same crate. A `doors` row makes
`fgos-durable-file` the only Rust code that fsyncs a file it writes; every other Rust match is named with its reason.

## Requirements

1. `packages/distribution/rust/src/init.rs` `publish_activation_file` (:526-558): replace the body with
   `fgos_durable_file::replace_durably_with_mode(dir, "activation.json", bytes, mode)`, choosing `mode` so the installed file's
   permission equals today's (default 0o666 under the process umask). Read `packages/durable-file/rust/tests/creation_modes.rs`
   to learn whether the door applies the umask; prove the result with a test, not by reasoning. Map `InstallError` to the
   function's `io::Error` the way `shim.rs:~190` does. Behaviour change, accepted: a parent-directory fsync failure is now an
   error (the door's rule; today it is ignored), same as the shim.
2. Stale temps: `cleanup_stale_activation_tmp_files` (:279-290) keeps removing `activation.json.tmp.*` (left by older releases)
   and also removes the door's own leftover temp names for this directory if Durable File does not clean them itself (check
   the crate first: if it exports a sweep, call it; do not copy `packages/event-store/rust/src/identity.rs:~85-100`).
3. `doors` row (new, `kind: door`), no debt:
   `{ job: "fsync a file or directory from Rust", patterns: ["\\.sync_all\\(\\)", "\\.sync_data\\(\\)", "RENAME_EXCHANGE"], allowed: [...], reason: "fgos-durable-file orders temp, fsync, install and directory fsync; each other file does a different job, named below" }`
   with `allowed` exactly as the check finds it on your base, each with a reason, starting from:
   `packages/durable-file/rust/src/lib.rs` (the door); `packages/git/rust/src/{restore,native_lock,sequence,repository_config}.rs`
   (Git writes its own files with Git's own durability, Git door); `packages/event-store/rust/src/rotate.rs` (renames an existing
   segment; Durable File has no move primitive; directory sync goes through the door); `packages/event-store/rust/src/identity.rs`
   (ancestor fsync before `install_once`, which the door leaves to its caller); `packages/event-store/rust/src/fsio.rs` (trait
   default `sync_file`, an injectable seam over the door); `packages/holder-lock/rust/src/tombstone.rs` (exchanges two
   directories with `RENAME_EXCHANGE`; holder-lock is not a Durable File client and the door has no exchange); `packages/observe/rust/src/shard.rs`
   and `packages/run-supervisor/rust/src/gate.rs` (read each and write the true reason; if either is a plain write-then-rename
   of new bytes, stop and ask the big lead before widening scope). `init.rs` must no longer match.
4. `docs/platform/component-boundary.md:88` (Durable file row): name the accepted Rust exceptions above in one sentence with
   their reasons (the row today names only the no-fsync helpers), so the doc and the row say the same.

## Files

- Modify: `packages/distribution/rust/src/init.rs`, `docs/platform/component-boundary.md` (row :88 only), `docs/architecture-manifest.json` (the row).
- Tests: in `init.rs`'s test module (:2363), one test that `publish_activation_file` installs the bytes with today's mode and
  leaves no temp; the crash/recovery behaviour stays owned by `packages/distribution/rust/tests/activation_lock_multiprocess.rs`,
  `pin_drift.rs`, `schema_golden.rs` and `apps/fgctl/tests/cli_surface.rs` (run them, do not copy them).
- Delete: none. Cargo.lock: unchanged (distribution already depends on durable-file).
- Net size: src about -25, tests about +25, manifest about +20.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-distribution -p fgctl --all-targets -- -D warnings`;
`cargo test -p fgos-distribution -p fgctl`; `cargo check -p fgos-distribution -p fgctl --target x86_64-pc-windows-msvc` and
`--target aarch64-apple-darwin`; `node scripts/run-tests.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
plus `rg -l "activation.json" test` (the Node readers' tests must still pass).

## Risk and rollback

- Mode of `activation.json` changes (M x H: every `fgos` call reads it): requirement 1's test.
- Windows directory fsync now real and may report errors (L x M): msvc check; the door already does this for the shim.
- Rollback: revert the phase.
