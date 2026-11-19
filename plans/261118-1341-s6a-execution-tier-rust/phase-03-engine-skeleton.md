# Phase 03: crate skeletons (engine crate, pure-core modules)

Wave 2. Depends on: 0 (port map). Effort 0.75d.

## Context

P2: effectful Execution code goes to `fgos-execution-engine` at `packages/execution/engine`; the pure half joins
`fgos-execution` (`packages/execution/rust`). Many module phases run in parallel in waves 3-6 (6, 6b, 6c in the pure
crate; 7-18 in the engine); if each added its own `pub mod` line and dependencies they would all edit `lib.rs` and
`Cargo.toml`. This phase fixes both crates' shape once so each module phase writes only its own directory.

## Requirements

- `packages/execution/engine/Cargo.toml`: name `fgos-execution-engine`; every dependency the port map (phase 00 §1)
  needs, within the layering of the phase-lead rules (incl. `fgos-checkout`, landed at `packages/execution/checkout` by
  the worktree-door plan, `a987e4f0f`, root `Cargo.toml:35`); no dependent crate yet.
- Engine `src/lib.rs`: crate doc (what the engine owns, what it does not: pure rules stay in `fgos-execution`, the
  attempt process stays in `fgos-run-supervisor`), `pub mod confinement { pub mod policy; pub mod request; pub mod driver; pub mod cleanup; }`,
  `accounts`, `credentials`, `transport`, `run_result`, `assignment`, `contract`, `settlement`, `steps`, `planning`,
  `assignment_runner`, `unit_run`; each a directory with a `mod.rs` holding only a module doc and, where phase 00 found
  cross-module types, the shared type declarations (the confinement request type, the account lease handle).
- `fgos-execution` `src/lib.rs`: `pub mod` lines and `mod.rs` stubs for `unit`, `run_request`, `patterns` (phase 6),
  `outcome`, `loops`, `seat_resolver`, `case_paths`, `handoff`, `unit_record`, `admission` (6b), `runner_config`,
  `run_facts` (6c); shared types (`Unit`, `Outcome`) declared in the stubs; `packages/execution/rust/Cargo.toml` gains
  `fgos-write-scope` (now `packages/write-scope`, moved by `3ee940891`; root `Cargo.toml:3`). On `f031ab0c8` the crate
  already has `accounts`, `agents`, `bind`, `checks` (S5 doctor judgements), `decide`, `executor_model`, `explain`,
  `hook`, `ports`, `runner_check`, `tools` (`packages/execution/rust/src/lib.rs:14-24`); the new module names do not
  collide with them.
- Root `Cargo.toml` member line for the engine.
- No behaviour, no tests beyond `cargo check`.

## Steps

1. Read phase 00 §1; list cross-module types; agree names with the leads of 6-18 on the board line.
2. Write both skeletons; `cargo check -p fgos-execution -p fgos-execution-engine` on Linux, msvc and
   aarch64-apple-darwin.

## Validation

`cargo check`/`clippy -D warnings` for both crates; `cargo tree -p fgos-node-addon` (package name per
`packages/git/node-addon/Cargo.toml:2`, V15) does not list `fgos-execution-engine`; `cargo tree -p fgos-execution` has
no process or fs crate.

## Risk and rollback

Risk: a shared type guessed wrong forces a later lib edit. Mitigation: a module phase that needs a new shared type
adds it inside its own `mod.rs`, never in `lib.rs`; the plan lead merges skeleton fixes between waves. Rollback:
revert (nothing depends on it before wave 3).
