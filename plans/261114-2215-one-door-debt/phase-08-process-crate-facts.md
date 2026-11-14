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

<!-- Red team 2026-11-14: non-dumpable owner uid is its own function; Windows verify-and-wait is one handle (open_verified); typed start-time parts, no third string form. -->

Rules: `phase-lead-rules.md`. pNN = `p08`; report slug `odd-p08-process-crate-facts`; crate `fgos-process`.
Facts: `phase-00-facts.md` "Leak 8".

## Outcome

Before phases 09-11 move nine readers onto `fgos-process`, the crate exposes every fact they read, so the move copies no
logic. This phase adds the facts (moving the reading code into the crate, never copying it) and the "process start time"
`doors` row with today's readers as debt. Phases 09-11 remove that debt.

## Requirements

1. For each reader in phase 00 "Leak 8", decide whether an existing function answers it exactly (`identity_of`,
   `self_identity`, `relation_of`, `command_name_of`, `effective_uid`); write the table in the report. Known gaps to close:
   - owner uid of `/proc/<pid>` metadata as `same_user` reads it (`packages/holder-lock/rust/src/route.rs:648-660`). This is not
     `effective_uid` (`facts.rs:593`, from `status`): for a non-dumpable process `/proc/<pid>` is owned by root. Add a separate
     function with that exact meaning and a test against a child made non-dumpable with `prctl(PR_SET_DUMPABLE, 0)`;
   - the controlling terminal path of a process's fd 0 (`packages/terminal-control/rust/src/driver/herdr.rs:990-993`);
   - Windows: holder-lock's `helper.rs:137-153` `open_holder` and `route/hold.rs` `watch_parent` open one handle with
     `SYNCHRONIZE | PROCESS_QUERY_LIMITED_INFORMATION`, check the start time on that handle, then wait on it: the check and the
     wait are one step, so a reused pid can never be waited on. Add a handle-based function (for example
     `open_verified(tuple) -> Option<WaitHandle>` on Windows: open, verify start time on the same handle, return it) and keep
     `identity_of` as is. A pid-based check followed by a second `OpenProcess` is forbidden.
   - Start-time forms: the crate gives Windows a decimal FILETIME u64 and macOS `"{sec}.{usec:06}"`
     (`platform/windows.rs:139`, `platform/macos.rs:64`), while the single-load marker builds `{pid}-{high}-{low}` (Windows) and
     `{pid}-{sec}-{usec}` unpadded (macOS) (`packages/git/node-addon/src/single_load.rs:62-68,125-127`). Expose typed start-time
     parts (FILETIME u64; sec and usec) so the marker can be built from them without parsing a string and without a third form.
   Each new function lives in `facts.rs` and the per-platform modules, unsupported platforms return `None` as the others do.
2. `doors` row (new, `kind: door`): `{ job: "process identity: start time of a process", patterns: ["GetProcessTimes", "\\bOpenProcess\\(", "ns_last_pid", "pbi_start"], allowed: ["packages/process/rust/src/platform/linux.rs", "packages/process/rust/src/platform/macos.rs", "packages/process/rust/src/platform/windows.rs", "packages/process/rust/src/platform/windows_job.rs"], debt: [helper.rs, route/hold.rs, borrow_vectors.rs, single_load.rs, each with reason "moves onto fgos-process"], reason: "one reader of a process start time per platform" }` (adjust `allowed` to what the check finds in the crate).
   After phase 09 no holder-lock file opens a process handle itself (it uses `open_verified`), so no such `allowed` entry is expected.

## Files

- Modify: `packages/process/rust/src/facts.rs`, `packages/process/rust/src/platform/{mod,linux,macos,windows}.rs` (as needed),
  `packages/process/rust/src/lib.rs` (exports), `docs/architecture-manifest.json` (row).
- Tests: unit tests per new function in the crate's own test modules (`/proc` owner of a non-dumpable child is root while its
  `effective_uid` is the user; fd-0 tty of a child with a pipe is `None`; `open_verified` refuses a tuple with a wrong start time
  and returns a waitable handle for a matching one, under the msvc check; typed start-time parts equal the string form for self).
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
