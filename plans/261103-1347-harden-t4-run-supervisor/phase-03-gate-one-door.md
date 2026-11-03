---
phase: 03
title: "Gate one door: argv through route::Flags (S2), envelope through read_verified (S3), process relations through T0 facts (S5 gate half), one writer-id path (S9), spawn error by ErrorKind (B-8), group kill before reap (B-10), gate_pid1 without its fixed 57 s loop"
status: pending
depends_on: []
parallel: "wave 1, with phases 01 and 02 (disjoint files)"
effort: ~1.5d
net_size: "Node +1 / Rust −78 / tests +10 (estimate)"
---

# Phase 03 — Gate one door

## Context

[plan.md](plan.md) target shape "Launch gate … one door"; arbitration §3 rows S2, S3 = RT4-12, S5, S9, B-8, B-10, speed B-6. Simplicity S2, S3, S5, S9; correctness B-8, B-10; speed B-6.

Code read on `fcd42ecdc`:
- `packages/run-supervisor/rust/src/gate.rs:46-146`: own `ArgsError`, `parse_args` loop, `parse_fd`, `report`, `EXIT_USAGE`/`EXIT_VERSION_MISMATCH`/`EXIT_ENVELOPE_INVALID`/`EXIT_INTERNAL` next to the same items in `route.rs:6-99`. `gate/unix.rs:20,39` and `gate/windows.rs:25,37-97` use them. `EXIT_NO_GO` (64) is the gate's own.
- `gate.rs:189-200` (`load_config`) checks `v`, digest, but not `protocolId`; `envelope.rs:226-241` (`read_verified`) checks all three.
- `gate/unix.rs:640-664` `descendants_of_self` reads `/proc/<pid>/stat` itself (ppid, state). T0 has `facts::relations()` (`process facts.rs:443-445`) and `parse_stat` with `state` (`facts.rs:470-495`), but `Relation` (`facts.rs:356-370`) carries no state; it is built at `facts.rs:505`, `:621` (test) and `platform/macos.rs:62`.
- Writer id travels in `launch.env` (`direct-launch.mjs:200`), in the side-file env (`assignment-runner.mjs:2093`) and in `envelope.identity`; only the Unix gate re-applies the last and removes a stale `FGOS_PARENT_WRITER_ID` (`gate/unix.rs:548-553`, `Config.identity` at `gate.rs:179-180`). `identityEnv` (`direct-launch.mjs:153-159`) adds the parent only when there is one and never removes an inherited one.
- `gate/unix.rs:414` and `gate/windows.rs:141` pick 127/126 from English error text.
- `steps.rs:262`: `killpg(pid)` after `try_wait` reaped the step.
- `tests/gate_pid1.rs:161-189`: `while begin.elapsed() < 57 s` sampling every 150 ms; the proof needs > 150 processes seen and no zombie older than 600 ms.

## Requirements

- **S2.** The gate parses its argv with `route::Flags::parse(args, &["envelope", "go-fd", "go-socket", "lock-fds", "job-name"], 0)`; exactly-one-of `--go-fd`/`--go-socket` and the descriptor rule (`>= 3`) stay in `gate.rs`; refusals go through `route::refuse("gate", …)` and `route::report("gate", …)`. `gate::ArgsError`, the hand loop, `gate::report`, and the four duplicated exit constants go; `EXIT_NO_GO` stays. Output lines and exit codes stay byte-equal (the existing argv unit test `gate.rs:400-` `argv_parses_and_refuses` owns it and moves onto the new parser).
- **S3.** `load_config` starts from `envelope::read_verified`; the gate gains the `protocolId == 1` check.
- **S5 (gate half).** `descendants_of_self` becomes a walk over `facts::relations()`, skipping zombies. T0's `Relation` gains the process state it already parses (`state`), filled on Linux from `parse_stat` and on macOS with the value the platform gives or a value that means "not a zombie, unknown" (lead's choice, stated in the commit). `relations()` returning `None` keeps today's behaviour of finding nothing. Zero `/proc` reads left in `gate/unix.rs`.
- **S9.** One path for the writer id: one Node helper sets `FGOS_SESSION_ID`, and sets or **removes** `FGOS_PARENT_WRITER_ID`, used for both `launch.env` (`direct-launch.mjs:200`) and the side-file env (`assignment-runner.mjs:2093`); the gate drops `Config.identity` and its re-apply. Invariant and its owning proof: an agent's `FGOS_SESSION_ID` and `FGOS_PARENT_WRITER_ID` equal `envelope.identity` on every OS, whatever the controller's own environment held. The Rust owner is `tests/gate_terminal_socket.rs` (it already asserts `FGOS_PARENT_WRITER_ID`); extend it there, and add the direct-mode twin in the gate test file that owns direct env (`rg -n FGOS_SESSION_ID packages/run-supervisor/rust/tests`). Do not edit `test/run-supervisor/terminal-cutover.test.mjs` or `contracts-terminal.test.mjs` here (phases 02 and 01 own them in wave 1). Extend it with the "controller had a stale parent id" case, red on Windows by reasoning and on Unix after the gate change without the Node change.
- **B-8.** `spawn_agent` returns the spawn `io::Error`; 127 only for `ErrorKind::NotFound` of the program itself, 126 otherwise, on both OSes; a missing brief or capture file is not 127.
- **B-10.** A step's group is signalled while its pid is still reserved: observe the exit without reaping (`waitid(P_PID, pid, …, WEXITED | WNOWAIT | WNOHANG)`), `killpg`, then reap. Or kill only the group members found by identity, as the timeout path does. Lead's choice; the comment states the invariant.
- **Speed B-6 (gate).** `a_long_attempt_with_many_orphans_accumulates_no_zombies` ends when more than 150 distinct processes were seen (cap 30 s) instead of a fixed 57 s; churn may be faster (`--orphan-life`), the zombie assertion is unchanged. Before/after wall time in the report.

## Files

**Create:** none.

**Modify:**
- `packages/run-supervisor/rust/src/gate.rs`, `gate/unix.rs`, `gate/windows.rs`, `steps.rs` (`route.rs` only if a helper must become `pub(crate)`)
- `packages/process/rust/src/facts.rs` (`Relation.state`, `parse_relation`), `platform/linux.rs` (`relations`), `platform/macos.rs:62`
- `src/run-supervisor/direct-launch.mjs` (`identityEnv` → the one helper), `src/runner/dispatch/assignment-runner.mjs:2093` (uses it; one line)
- Tests: `tests/gate_pid1.rs`, the gate test that owns the spawn-error exit code (`rg -n "127|126" packages/run-supervisor/rust/tests`), `tests/steps_runner.rs` (B-10 case: a step's descendant in its group does not outlive the chain, if not already owned), the S3 refusal case in the test that owns envelope refusals (`rg -n "envelope-invalid" packages/run-supervisor/rust/tests/gate_*.rs`), `packages/process/rust` relation tests (`facts.rs:621`), the S9 owner
- `CHANGELOG.md` (S9 only if visible: Windows agents no longer inherit a stale parent writer id), census

**Delete:** in `gate.rs`, `ArgsError`, the `parse_args` loop body, `report`, `EXIT_USAGE`, `EXIT_VERSION_MISMATCH`, `EXIT_ENVELOPE_INVALID`, `EXIT_INTERNAL`, the digest block of `load_config`, `Config.identity`; in `gate/unix.rs`, the `/proc` walk of `descendants_of_self` and the identity re-apply (`:548-553`).

**Tests to retire:** none. The gate argv unit test moves onto the new parser with the same cases; `gate_pid1`'s zombie test is shortened, not retired.

## Net size

Rust: S2 −50, S3 −10, S5 −20 (+6 in T0), S9 −12, B-8 +4, B-10 +4 → about −78. Node: S9 +1. Tests: S3, B-8, B-10 and S9 cases +10 (the zombie loop changes a bound, not lines).

## Steps

1. Find the owning tests for each item (argv unit test, envelope refusal, spawn exit code, step group kill, writer id, zombies); write a red case only where none exists.
2. S2 + S3 in one commit (`gate.rs` only); `cargo test -p fgos-run-supervisor --lib --test gate_go --test gate_portable`.
3. S5: `Relation.state` in T0 first (`cargo test -p fgos-process`), then the gate walk.
4. S9 Node + Rust in one commit.
5. B-8, B-10.
6. `gate_pid1` bound; time it before and after (same load band; state the load average).
7. msvc and darwin checks for `fgos-process` and `fgos-run-supervisor`; clippy; census.

## Validation (focused)

- `cargo test -p fgos-run-supervisor --lib --test gate_go --test gate_portable --test gate_ceiling --test gate_orphan --test gate_pid1 --test gate_terminal_socket --test steps_runner --test steps_portable`
- `cargo test -p fgos-process`
- `cargo check -p fgos-process -p fgos-run-supervisor --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`; clippy `-D warnings`
- FR `test/run-supervisor/direct-cutover.test.mjs test/run-supervisor/terminal-cutover.test.mjs test/process/process-facts-vectors.test.mjs`
- `rg -n '"/proc' packages/run-supervisor/rust/src/gate` → nothing; `rg -n "fn parse_args|fn report|EXIT_USAGE" packages/run-supervisor/rust/src/gate.rs` → nothing
- census not higher.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A gate refusal line changes shape and a Node parser of gate output breaks | L × M | Byte-equal requirement; the argv unit test owns it; `rg -n "internal gate" src` for parsers. |
| `Relation.state` changes the struct for MAIL/OPC consumers of `fgos-process` | L × M | Additive field; the three literal sites are inside the crate; announce on the board. |
| S9 removes a protection the Unix gate gave | M × M | One commit for Node and Rust; the invariant test covers both env sources. |
| `waitid` with `WNOWAIT` is not on macOS in the same form | L × M | Use the identity path there if needed; darwin `cargo check`. |
| The shortened zombie loop stops proving reaping under load | L × M | The count condition (> 150 seen) is what proves churn; the 600 ms zombie bound is unchanged. |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format changes.

## Done when

No duplicate parser, reporter, verifier or `/proc` walk in the gate; the writer-id invariant test green; spawn exit codes typed; step group signalled before reap; `gate_pid1` well under 57 s; checks clean; landed with a guide section.

## Lead brief essentials

Delete list above. Find the owning test before writing a new one. Byte-equal gate output. Announce the `Relation` field on the board for MAIL/OPC. Δ-lines per language and the `gate_pid1` time before/after. All plan.md lead rules apply.
