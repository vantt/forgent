# Owner machine: shared durable-file and canonical-JSON moves are on main

Written 2026-10-18 22:50 (Asia/Saigon) by the big lead of the GIT and ES lanes (session `ac420727`, second machine). Follows [the 20:05 guide](guide-261018-2005-owner-machine-after-git-lane-b.md).

## What is on main now

`035c3a0aa` finishes the moves deferred until 6.3 landed ([phase report](phase-lead-261018-2155-shared-durable-canonical-moves.md)):

- `packages/run-supervisor/rust/src/publish.rs` and `packages/terminal-control/rust/src/store.rs` write through `fgos-durable-file`; their private write/fsync/link/rename code is deleted. File modes are unchanged (terminal files keep `0666 & ~umask`, supervisor files `0600 & ~umask`). Terminal writes now also sync the parent directory; their success mapping is unchanged.
- `packages/run-supervisor/rust/src/envelope.rs` serializes through `fgos-canonical-json`; the private serializer is deleted. All five envelope golden vectors keep their exact bytes and SHA-256.
- `fgos-canonical-json` enables serde_json `float_roundtrip`, which fixes a pre-existing decimal parsing error in the leaf (`333333333.33333329` read as `...25`).

No user-visible format, config default, environment variable or dependency outside the workspace changed.

## Gate on the second machine

Rust (nine affected crates): 551 pass, 1 known failure (`fgos-process` `containment_terminal_gate_dies_with_a_killed_supervisor`); clippy `-D warnings` clean. `npm test`: 8091 pass, 3 fail: the two known ones (fences-v1-tombstone real v1 acquire, holder-lock-checks monitor/supervisor membership) and `test/run-supervisor/crash-matrix-adopt-resume.test.mjs` "direct: no-binding: --resume", which fails the same way on clean main `b54842799` (the crash helper never freezes the supervisor in 8 tries, about 8 minutes). It is not caused by the moves; it is recorded on the board as an open item.

## Nothing to activate yet

Plain `fgos` keeps running the activated release. These changes reach runtime with the Git phase 01 landing, whose release is built from main and therefore also carries 6.4.

## For sessions on the owner machine

1. Merge main before editing `packages/run-supervisor/rust/src/{publish,envelope}.rs` or `packages/terminal-control/rust/src/store.rs`.
2. If you own the crash-matrix test, the failing row is the direct-mode `no-binding` resume row; its terminal-mode twin passes.
