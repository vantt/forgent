---
phase: 9
title: "Holder-lock reads process facts only through fgos-process"
status: pending
effort: 1d
leak: "census rank 8 (holder-lock files)"
startAfter: ["phase 08 on main"]
landAfter: []
---

# Phase 09: Holder-lock through fgos-process

<!-- Red team 2026-11-14: verify-and-wait on one handle via open_verified; same_user keeps the /proc owner meaning. -->

Rules: `phase-lead-rules.md`. pNN = `p09`; report slug `odd-p09-holder-lock-process-facts`; crate `fgos-holder-lock`.
Facts: `phase-00-facts.md` "Leak 8"; phase 08's report (which function answers which read).

## Requirements

1. Replace the reads with the crate's functions named in phase 08's table: `route.rs:652-660` (`same_user`), `origin.rs:118-119`
   (`comm`), `driver/flock.rs:694-700` (parent and group; it already parses with `fgos_process::facts::parse_relation` but reads
   `/proc/<pid>/stat` itself), and the Windows start-time reads in `helper.rs:101-149`, `route/hold.rs:459-548`,
   `borrow_vectors.rs:440-449`: each opens, verifies and waits through `open_verified` from phase 08 (one handle; never a
   pid-based check followed by a second `OpenProcess`). `same_user` uses the `/proc` owner function, not `effective_uid`.
2. `driver/flock.rs` keeps its holder discovery (`/proc/self/fd`, `/proc/<pid>/fdinfo`, the `/proc` scan): the holder-lock
   spec makes "who holds it as the kernel reports" its own job; it stays `allowed` in the `/proc` row.
3. `doors`: remove the debt entries of these files from the start-time row (phase 08) and, if F0's `/proc` row is on your base,
   from that row (`route.rs`, `origin.rs`); else follow the rules file.

## Files

- Modify: `packages/holder-lock/rust/src/{route.rs, origin.rs, driver/flock.rs, helper.rs, route/hold.rs, borrow_vectors.rs}`,
  `docs/architecture-manifest.json` (debt entries).
- Tests: existing holder-lock tests stay owners (`cargo test -p fgos-holder-lock`, `test/holder-lock/*.test.mjs`); the facts are
  proven in `fgos-process`. No new test unless a behaviour has no owner (then say which).
- Net size: Rust about -60.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-holder-lock --all-targets -- -D warnings`; `cargo test -p fgos-holder-lock`;
`cargo check -p fgos-holder-lock --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/holder-lock/*.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- `same_user` semantics for non-dumpable processes (M x H): phase 08 proves the crate reads the same metadata.
- Rollback: revert the phase.
