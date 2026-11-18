# Phase 03: engine crate skeleton

Wave 2. Depends on: 0 (port map), 1 (root `Cargo.toml` writer of wave 1). Effort 0.5d.

## Context

P2: effectful Execution code goes to `fgos-execution-engine` at `packages/execution/engine`. Seven module phases
(7-12, 13, 14, 16, 18) run in parallel; if each added its own `pub mod` line and dependencies they would all edit
`lib.rs` and `Cargo.toml`. This phase fixes the crate shape once so each module phase writes only its own directory.

## Requirements

- `packages/execution/engine/Cargo.toml`: name `fgos-execution-engine`; every dependency the port map (phase 00
  section 1) needs, within the layering of the phase-lead rules; no dependent crate yet.
- `src/lib.rs`: crate doc (what the engine owns, what it does not: pure rules stay in `fgos-execution`, the attempt
  process stays in `fgos-run-supervisor`), `pub mod confinement { pub mod policy; pub mod driver; }`, `accounts`,
  `credentials`, `transport`, `run_result`, `assignment`, `settlement`, `steps`, `assignment_runner`, `unit_run`; each a
  directory with a `mod.rs` holding only a module doc and, where phase 00 found cross-module types, the shared type
  declarations (e.g. the confinement request type both confinement halves use, the account lease handle).
- Root `Cargo.toml` member line.
- No behaviour, no tests beyond `cargo check`.

## Steps

1. Read phase 00 section 1; list cross-module types; agree names with the leads of 7-18 on the board line.
2. Write the skeleton; `cargo check -p fgos-execution-engine` on Linux, msvc and aarch64-apple-darwin.

## Validation

`cargo check`/`clippy -D warnings` for the crate; `cargo tree -p fgos-git-node-addon` (the addon package name per its
`Cargo.toml`) does not list `fgos-execution-engine`.

## Risk and rollback

Risk: a shared type guessed wrong forces a later lib edit. Mitigation: a module phase that needs a new shared type
adds it inside its own `mod.rs`, never in `lib.rs`; the plan lead merges skeleton fixes between waves. Rollback:
revert (nothing depends on it before wave 3).
