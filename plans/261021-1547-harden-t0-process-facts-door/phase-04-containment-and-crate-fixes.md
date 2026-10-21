---
phase: 04
title: "Containment and process-crate fixes: subreaper, Unknown folding, one observer read, one stat parser, one pgroup module, bounded loops, absolute cwd"
status: pending
depends_on: [01]
parallel: "may run in parallel with phases 02 and 03 (only packages/process/rust/** changes here); phase 06 starts after it (facts.rs is shared)"
effort: ~1.5d
net_size: "Node 0 / Rust −175 / tests 0 (estimate)"
---

# Phase 04 — Containment and crate fixes

## Context

[plan.md](plan.md) Facts ("Rust fix sites"); arbitration §3 rows RT-M1, RT-M2, S1, S-E2/S4, S-E6, S-C1, RT-M8; red-team "unsafe deletion 6" (zombies must stay filtered in `members()`); process spec `docs/platform/process/spec.md:40` (subreaper belongs to the run supervisor) and `:128` (unknown never empty); contract `packages/process/contracts/containment.port.v1.json:39`. Phase 1's RT-M1 and RT-M2 red tests flip green here. No public API of `fgos-process` changes shape (MAIL/OPC constraint); `containment.port.v1.json` is not edited here (phase 6, S-F2).

## Requirements

- **RT-M1.** `LinuxPgroup::spawn_in` (`containment/linux.rs:238-266`) never calls `become_subreaper()` in the calling process (`:243`). The subreaper, if kept for the domain, is set in the child's `pre_exec` (`:249-253`) beside `setsid`, so orphans reparent to the leader while it lives and the caller is never mutated. `become_subreaper` (`:476-482`) is deleted. `tests/containment_pgroup.rs:101` (the manual `libc::kill(escape_pid, SIGKILL)`) is re-examined: with the leader as subreaper, the escaped descendant reparents to the leader and `members()` sees it; keep the manual kill only if the test still needs it and say why in the commit.
- **RT-M2.** In `pgroup_state` (`linux.rs:408-421`) and `tree_state` (`macos.rs:175-188`) the fold over `seen` becomes three-valued: any `Alive` → `NotEmpty`; else any `Unknown` → `Unknown`; else `Empty`. In `pgroup_kill` (`linux.rs:440-442`) and `tree_kill` (`macos.rs:223-226`) a target that judges `Unknown` sets `refused = true` instead of being skipped. `live_rows` (`linux.rs:328-338`) returns an error (or `Option::None`) when `/proc` cannot be listed, and `members()`/`pgroup_state` turn that into `DomainState::Unknown`, never `Empty`.
- **S1.** Boot id and pid namespace are read once per process (`OnceLock`) in `platform/linux.rs:26-42` (`boot_id`, `pid_ns`); the hostname stays live. `judge_here` (`facts.rs:242-245`) and `identity_of` (`platform/mod.rs:69-74`) use the cached observer. Expected: judge 5.2 → ~2.8 µs, whole-table scans −25% (speed S1). No new type: `Observer` and `judge(record, &observer, &table)` already exist.
- **S-E2 / S4.** One `/proc/<pid>/stat` parser in `facts` (`parse_relation`, `facts.rs:455-464`, extended to keep `state: char`); `containment/linux.rs:306-325` (`StatRow`, `read_stat`) and `live_rows` use it; `members()` keeps filtering `state != 'Z' && state != 'X'` (red-team unsafe deletion 6). `single_load.rs:24-28` in the addon keeps its own two-line read (it must not depend on `fgos-process` for a marker computed before `check()`; say so in the commit) unless the lead shows `facts::self_identity` is callable there without a dependency cycle — then use it.
- **S-E6.** `members`, `remember_tree`, `*_state`, `*_kill`, `signal_group`, `wait_until`, `apply_stdio` (`linux.rs:355-501` vs `macos.rs:141-277`) become one `containment/pgroup.rs` generic over a small listing port (`fn list(root) -> Result<Vec<Row>>`: `/proc` rows on Linux, `proc_listpids` on macOS), with two ~30-line drivers. Behaviour unchanged; the four `containment_*.rs` test files own it.
- **S-C1.** The three `for i in 0..1000` loops (`tests/containment_bwrap.rs:247`, `tests/containment_pgroup.rs:135`, `tests/containment_macos.rs:133`) become `0..100`. The commit message says what 100 still proves: the 2026-10-18 fast-exit decision was that a child reaped before its identity is read is a normal spawn, and the race shows within the first few dozen iterations on a loaded machine; 100 keeps a 10× margin over the observed first occurrence and cuts ~2 700 spawns from every `cargo test`.
- **RT-M8.** `mapped.rs:237-238`: when `request.cwd` is `Some(p)` and `p.is_absolute()`, use it without calling `current_dir()`; otherwise as today. Zero net lines.

## Files

**Create**: `packages/process/rust/src/containment/pgroup.rs` (shared process-group module, ~150 lines moved, not written new).

**Modify**: `packages/process/rust/src/containment/linux.rs`, `containment/macos.rs`, `containment/mod.rs` (module list), `facts.rs` (`parse_relation` with state; `judge_here`), `platform/linux.rs` (`OnceLock` for boot id and pid ns), `platform/mod.rs` (`observer`), `mapped.rs:237-238`, `tests/containment_bwrap.rs:247`, `tests/containment_pgroup.rs:101, :135`, `tests/containment_macos.rs:133`. `packages/git/node-addon/src/single_load.rs` only if the cycle check allows it.

**Delete**: `become_subreaper` (`linux.rs:476-482`); `StatRow`/`read_stat` (`linux.rs:306-325`); the duplicated helpers in `linux.rs` and `macos.rs` once `pgroup.rs` owns them. (`facts::start_time` and `kcmp_same_file` are phase 6's deletions, in the same file: this phase does not touch them.)

**Tests to retire**: none. The two phase-1 red tests flip green; no proof is weakened.

## Steps

1. RT-M1 (flip `spawn_in_never_makes_the_caller_a_subreaper`), then RT-M2 (flip `pgroup_state_reports_unknown…` on Linux and macOS), each its own commit.
2. S1 observer cache; run `cargo test -p fgos-process` and the speed seat's bench shape (a release-profile binary linking `fgos-process`, 300 warm calls of `judge_here`) to record the µs for phase 8.
3. S-E2/S4 one parser; then S-E6 one module; `cargo test -p fgos-process` after each.
4. S-C1 loop bound, RT-M8 cwd; `cargo test -p fgos-process`; `cargo test --workspace` once.
5. Report: measured judge p50/p95 before and after S1; Δ-lines; what 100 iterations still proves.

## Verification (exact)

- `cargo test -p fgos-process --test containment_pgroup` (subreaper and escape cases), `cargo test -p fgos-process --lib` (the two `*_state` unit cases), `cargo test -p fgos-process --test judge_vectors --test signal_identity --test holders_multiprocess --test file_users`.
- `cargo test -p fgos-process --test containment_bwrap` on a host with bwrap, in the fast-exit case under `time`, before and after S-C1.
- `cargo test --workspace` (holder-lock, run-supervisor, git and terminal-control consume `facts`).
- `rg -n "PR_SET_CHILD_SUBREAPER" packages/process` → only inside the child `pre_exec` (if kept) and nowhere in the caller path.
- `rg -n "read_to_string\(.*\/stat" packages/process/rust/src` → one site (`facts`), plus `single_load.rs` if the cycle rule kept it.

## Net size

Rust: RT-M1 −7 +6; RT-M2 +10; S1 −10; S-E2/S4 −40; S-E6 −130; S-C1 0; RT-M8 0 → ≈ −175. Node 0. Tests 0 (loop bounds change a number, not lines).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Setting the subreaper in the leader changes who adopts a double-forked descendant, and `containment_pgroup.rs:65-101` encodes today's shape | M × M | Re-run the escape case first; the spec `:137` already names `setsid` descendants as an escape, so the proof asserts the named escape, not a reparent target. |
| S-E6 refactor changes a Linux-only subtlety (`live_rows` zombie filter, `pgid` compare) | M × H | The listing port returns `state` and `pgrp`; `members()` keeps both filters; the four `containment_*.rs` files run on each OS before merge. |
| `OnceLock` for pid namespace caches a value across a later `unshare` in the same process | L × M | fgOS never unshares after start in a process that judges (the gate is a separate process); state the invariant in a comment and in the spec (phase 6). |
| macOS is not a release target, so the macOS half cannot be run here | H × L | Keep the macOS changes mechanical (shared module); mark "compiled, not run on macOS" in the report. |

## Rollback

Revert the phase's commits; no on-disk format changes.

## Done when

RT-M1 and RT-M2 tests green; `cargo test --workspace` green; one stat parser, one pgroup module, cached observer; loops at 100 with the reason recorded; measured judge µs in the report.

## Lead brief essentials

Delete list: `become_subreaper`, `StatRow`/`read_stat`, the duplicated pgroup helpers. Find the owning test before writing a new one (the `containment_*.rs` files own the drivers; `judge_vectors.rs` owns the judge). Δ-lines per language. Report only what you saw yourself (paste `cargo test` and the bench output). Do not edit `containment.port.v1.json`, `facts::start_time`, `kcmp_same_file` (phase 6). Announce the (shape-preserving) changes on the board for MAIL/OPC. Report name from `fgos convention name --json`.
