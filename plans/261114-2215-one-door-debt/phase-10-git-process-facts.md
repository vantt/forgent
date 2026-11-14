---
phase: 10
title: "Git crate and addon read process facts only through fgos-process"
status: pending
effort: 0.5d
leak: "census rank 8 (git files)"
startAfter: ["phase 08 on main"]
landAfter: []
---

# Phase 10: Git and the addon through fgos-process

<!-- Red team 2026-11-14: marker built from typed parts with per-platform golden tests. -->

Rules: `phase-lead-rules.md`. pNN = `p10`; report slug `odd-p10-git-process-facts`; crates `fgos-git`, `fgos-node-addon`.
Facts: `phase-00-facts.md` "Leak 8"; phase 08's report.

## Requirements

1. `packages/git/rust/src/worktree.rs:578-582` (`/proc/<pid>/comm` after `observe(pid)`): use `command_name_of`.
2. `packages/git/node-addon/src/single_load.rs:21-35,43-70,~125-135` (start time of this process on three platforms, for the
   single-load marker name): build the marker from the typed start-time parts phase 08 exposes, so the name keeps today's exact
   form per platform (`{pid}-{high}-{low}` Windows, `{pid}-{sec}-{usec}` macOS, Linux ticks) without parsing a string. Two addon
   copies loaded into one process must still collide on the marker: golden test per platform (Linux run, msvc and darwin checks).
3. Out of scope, recorded: `single_load.rs:73,146` takes a kernel lock outside holder-lock (census 4.3, F0's kernel-lock row
   debt). Not one of the ten; leave it and its debt entry.
4. `doors`: remove the debt entries of both files from the start-time row and (if present) F0's `/proc` row.

## Files

- Modify: `packages/git/rust/src/worktree.rs` (that read only), `packages/git/node-addon/src/single_load.rs`, `docs/architecture-manifest.json`.
- Tests: existing owners (`cargo test -p fgos-git`, `test/git/native-load.test.mjs` for single load); golden marker-name tests per platform
  (why new: the start-time source changes underneath it).
- Net size: Rust about -50.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`; `cargo test -p fgos-git`;
`cargo check -p fgos-git -p fgos-node-addon --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/git/native-load.test.mjs test/git/one-door.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`;
Git one-door scan count not above base.

## Risk and rollback

- Single-load marker no longer matches a live process (L x H): form test. Rollback: revert the phase.
