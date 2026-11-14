---
phase: 8
title: "fgos-process answers every process fact other crates read themselves"
status: pending
effort: 1d
leak: "census rank 8 (the crate side)"
startAfter: ["F0 wave A on main"]
landAfter: []
---

# Phase 08: The process crate answers the missing facts

Rules: `phase-lead-rules.md`. pNN = `p08`; report slug `odd-p08-process-crate-facts`; crate `fgos-process`.
Facts: `phase-00-facts.md` "Leak 8".

## Outcome

Before phases 09-11 move nine readers onto `fgos-process`, the crate exposes every fact they read, so the move copies no
logic. This phase adds the facts (moving the reading code into the crate, never copying it) and the "process start time"
`doors` row with today's readers as debt. Phases 09-11 remove that debt.

## Requirements

1. For each reader in phase 00 "Leak 8", decide whether an existing function answers it exactly (`identity_of`,
   `self_identity`, `relation_of`, `command_name_of`, `effective_uid`); write the table in the report. Known gaps to close:
   - owner uid of a process as the kernel reports it on `/proc/<pid>` metadata (works for non-dumpable processes, the reason in
     `packages/holder-lock/rust/src/route.rs:648-651`), unless `effective_uid` already reads exactly that (check `platform/linux.rs`);
   - the controlling terminal path of a process's fd 0 (`packages/terminal-control/rust/src/driver/herdr.rs:990-993`);
   - Windows: the start time in the exact string form that `holder-lock` `helper.rs`/`route/hold.rs`/`borrow_vectors.rs` and
     `packages/git/node-addon/src/single_load.rs` compare (decimal FILETIME?), so their comparisons keep working across releases.
     If the crate's `identity_of` start time differs in form, add the conversion in the crate, not in each caller.
   Each new function lives in `facts.rs` and the per-platform modules, unsupported platforms return `None` as the others do.
2. `doors` row (new, `kind: door`): `{ job: "process identity: start time of a process", patterns: ["GetProcessTimes", "\\bOpenProcess\\(", "ns_last_pid", "pbi_start"], allowed: ["packages/process/rust/src/platform/linux.rs", "packages/process/rust/src/platform/macos.rs", "packages/process/rust/src/platform/windows.rs", "packages/process/rust/src/platform/windows_job.rs"], debt: [helper.rs, route/hold.rs, borrow_vectors.rs, single_load.rs, each with reason "moves onto fgos-process"], reason: "one reader of a process start time per platform" }` (adjust `allowed` to what the check finds in the crate).
   `OpenProcess` used only to hold a `SYNCHRONIZE` handle for waiting is a different job: if a file keeps it after phase 09,
   name it in `allowed` with that reason in phase 09.

## Files

- Modify: `packages/process/rust/src/facts.rs`, `packages/process/rust/src/platform/{mod,linux,macos,windows}.rs` (as needed),
  `packages/process/rust/src/lib.rs` (exports), `docs/architecture-manifest.json` (row).
- Tests: unit tests per new function in the crate's own test modules (self process: uid equals `geteuid`; fd-0 tty of a child
  with a pipe is `None`; Windows start-time form equals what `single_load.rs` builds today, compiled under msvc check).
- Delete: none. Cargo.lock: unchanged.
- Net size: Rust about +80 (half tests).

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-process --all-targets -- -D warnings`; `cargo test -p fgos-process`;
`cargo check -p fgos-process --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- Windows start-time form mismatch breaks lock-holder matching across a release boundary (M x H): the form is fixed by test
  against today's string; machines upgrade together (owner rule), so no mixed-release window.
- Rollback: revert the phase (phases 09-11 must be reverted first).
