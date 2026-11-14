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

<!-- Red team 2026-11-14: installed-but-unsynced keeps writing the pin; the durable temp sweep moves into the crate instead of a second copy. -->

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
   function's `io::Error`, but by its `installed` field: if the rename has happened and only the directory fsync failed, the
   record is in place, so init continues (writes the pin, `init.rs:1623-1639`) and prints one warning naming the fsync failure;
   any earlier failure is an error as today. Never leave a new `activation.json` beside an old pin because of a late fsync error.
2. Stale temps: Durable File keeps its temp on a failure (`lib.rs:294-295`) and exports no sweep, while event-store sweeps
   `.durable-file-*.tmp` with its own copy (`packages/event-store/rust/src/identity.rs:~71-100`). Move that sweep into the crate
   as one function (for example `sweep_stale_temps(dir)`; the code moves, the event-store copy is deleted and event-store calls
   the crate). `cleanup_stale_activation_tmp_files` (:279-290) keeps removing `activation.json.tmp.*` (left by older releases)
   and calls the crate's sweep for the installation directory.
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

- Modify: `packages/distribution/rust/src/init.rs`, `packages/durable-file/rust/src/lib.rs` (the moved sweep), `packages/event-store/rust/src/identity.rs`
  (its sweep replaced by the call), `docs/platform/component-boundary.md` (row :88 only), `docs/architecture-manifest.json` (the row).
- Tests: in `init.rs`'s test module (:2363), one test that `publish_activation_file` installs the bytes with today's mode and
  leaves no temp, one that an installed-but-unsynced result still writes the pin (fault injected through the door's existing
  test seam if it has one; if not, say so and rely on the mapping's unit test), and the sweep's cases move with it from event-store
  to the durable-file tests (owner moves, no copy); the crash/recovery behaviour stays owned by `packages/distribution/rust/tests/activation_lock_multiprocess.rs`,
  `pin_drift.rs`, `schema_golden.rs` and `apps/fgctl/tests/cli_surface.rs` (run them, do not copy them).
- Delete: none. Cargo.lock: unchanged (distribution already depends on durable-file).
- Net size: src about -25, tests about +25, manifest about +20.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-distribution -p fgctl -p fgos-durable-file -p fgos-event-store --all-targets -- -D warnings`;
`cargo test -p fgos-distribution -p fgctl -p fgos-durable-file -p fgos-event-store`; `cargo check -p fgos-distribution -p fgctl -p fgos-durable-file -p fgos-event-store --target x86_64-pc-windows-msvc` and
`--target aarch64-apple-darwin`; `node scripts/run-tests.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
plus `rg -l "activation.json" test` (the Node readers' tests must still pass).

## Risk and rollback

- Mode of `activation.json` changes (M x H: every `fgos` call reads it): requirement 1's test.
- Windows directory fsync now real and may report errors (L x M): msvc check; the door already does this for the shim.
- Rollback: revert the phase.
