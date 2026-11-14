---
phase: 11
title: "Terminal control asks fgos-process for a pane's tty"
status: pending
effort: 0.25d
leak: "census rank 8 (terminal-control)"
startAfter: ["phase 08 on main"]
landAfter: []
---

# Phase 11: Terminal control through fgos-process

Rules: `phase-lead-rules.md`. pNN = `p11`; report slug `odd-p11-terminal-control-tty`; crate `fgos-terminal-control`.
Facts: `phase-00-facts.md` "Leak 8"; phase 08's report (`stdin_window_size`).

## Requirements

1. `packages/terminal-control/rust/src/driver/herdr.rs:990-993` (opens `/proc/<shell_pid>/fd/0`): call `fgos_process::facts::stdin_window_size`, which opens
   `/proc/<pid>/fd/0` with `O_NOCTTY|O_NONBLOCK`, checks `isatty` and runs `TIOCGWINSZ`, and returns `(cols, rows)`.
   Same answer for a pane shell (its pty size) and the same `None`/error path when the process is gone.
2. `doors`: remove the file's debt entry from F0's `/proc` row if present; else follow the rules file.

## Files

- Modify: `packages/terminal-control/rust/src/driver/herdr.rs` (that read only), `docs/architecture-manifest.json`.
- Tests: existing herdr driver tests stay owners; none new.
- Net size: Rust about -8.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-terminal-control --all-targets -- -D warnings`; `cargo test -p fgos-terminal-control`;
`cargo check -p fgos-terminal-control --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/terminal-control/*.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- Rollback: revert the phase.
