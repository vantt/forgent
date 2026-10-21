---
phase: 04
title: "Containment and process-crate fixes: subreaper, Unknown folding, one observer read, one stat parser, one pgroup module, bounded loops, absolute cwd"
status: done
depends_on: [01]
parallel: "may run in parallel with phases 02 and 03 (only packages/process/rust/** changes here); phase 06 starts after it (facts.rs is shared)"
effort: ~1.5d
net_size: "Node 0 / Rust −57 / tests +8 (estimate)"
---

# Phase 04 — Containment and crate fixes

## Context

[plan.md](plan.md) Facts ("Rust fix sites"); arbitration §3 rows RT-M1, RT-M2, S1, S-E2/S4, S-E6, S-C1, RT-M8; red-team "unsafe deletion 6" (zombies must stay filtered in `members()`); process spec `docs/platform/process/spec.md:40` (subreaper belongs to the run supervisor) and `:128` (unknown never empty); contract `packages/process/contracts/containment.port.v1.json:39`. Phase 1's RT-M1 and RT-M2 red tests flip green here. No public API of `fgos-process` changes shape (MAIL/OPC constraint); `containment.port.v1.json` is not edited here (phase 6, S-F2).

## Requirements

- **RT-M1.** `become_subreaper()` (`containment/linux.rs:476-482`) and its call in `LinuxPgroup::spawn_in` (`:243`) are **deleted outright**, not moved into the child (red-team Sec-F8 corrected the first draft: the process spec `docs/platform/process/spec.md:40` says the subreaper is the run supervisor's, and the gate already sets it for itself, `packages/run-supervisor/rust/src/gate/unix.rs:81`; a leader-side subreaper would also turn every non-gate child spawned through `LinuxPgroup`, such as git under `packages/git/rust/src/driver.rs:1194`, into a subreaper). Orphans of the group then reparent to pid 1 and stay in the process group, where `members(root, walk_tree, pgid)` and `killpg` still reach them; a `setsid` descendant is the named escape (spec `:137`). `tests/containment_pgroup.rs:101` (the manual `libc::kill(escape_pid, SIGKILL)`) stays, with its reason restated in the commit.
- **RT-M2.** In `pgroup_state` (`linux.rs:408-421`) and `tree_state` (`macos.rs:175-188`) the fold over `seen` becomes three-valued: any `Alive` → `NotEmpty`; else any `Unknown` → `Unknown`; else `Empty`. In `pgroup_kill` (`linux.rs:440-442`) and `tree_kill` (`macos.rs:223-226`) a target that judges `Unknown` sets `refused = true` instead of being skipped. **Membership never loses an unreadable member** (red-team AD-09/Sec-F8): `live_rows` (`linux.rs:328-338`) returns `Err` when `/proc` cannot be listed, and `members()` returns `{rows, unreadable: usize}` where `.filter_map(read_stat)` (`:335`), `.filter_map(tuple_of_row)` (`:433`) and `.filter_map(live_tuple)` (`macos.rs:161`) count what they dropped instead of hiding it; `pgroup_state`/`tree_state` answer `Unknown` and `pgroup_kill`/`tree_kill` set `refused` whenever `unreadable > 0` or the listing failed; `kill_all` (`linux.rs:283-286`) does not `signal_group` when `remember_tree` could not list `/proc` (the tree links would be lost before they were recorded). The phase-1 RT-M2 unit test gains one case "an unreadable candidate absent from `seen` makes the domain unknown".
- **S1.** Boot id and pid namespace are read once per process (`OnceLock`) in `platform/linux.rs:26-42` (`boot_id`, `pid_ns`); the hostname stays live. `judge_here` (`facts.rs:242-245`) and `identity_of` (`platform/mod.rs:69-74`) use the cached observer. Expected: judge 5.2 → ~2.8 µs, whole-table scans −25% (speed S1). No new type: `Observer` and `judge(record, &observer, &table)` already exist.
- **S-E2 / S4.** One `/proc/<pid>/stat` parser in `facts` (`parse_relation`, `facts.rs:455-464`, extended to keep `state: char`); `containment/linux.rs:306-325` (`StatRow`, `read_stat`) and `live_rows` use it; `members()` keeps filtering `state != 'Z' && state != 'X'` (red-team unsafe deletion 6). `single_load.rs:24-28` in the addon keeps its own two-line read (it must not depend on `fgos-process` for a marker computed before `check()`; say so in the commit) unless the lead shows `facts::self_identity` is callable there without a dependency cycle — then use it.
- **S-E6.** `remember_tree`, `*_state`, `*_kill`, `signal_group`, `wait_until`, `apply_stdio` (`linux.rs:372-501` vs `macos.rs:165-277`) become one `containment/pgroup.rs` generic over a small listing port (`fn list(root, pgid) -> Result<Listing>` with `rows` and `unreadable`: `/proc` rows on Linux, `proc_listpids` on macOS); `members` itself stays per driver (the Linux BFS over `/proc` rows and the macOS `PROC_PPID_ONLY`/`PROC_PGRP_ONLY` walk differ, `macos.rs:141-162`), as do `prune_dead`/`tree_state_adopt` (`macos.rs:190-205`, macOS-only). The honest saving is ~45 lines, not the first draft's 130 (red-team Scope-F8 measured ~98 shared lines). Behaviour unchanged; the four `containment_*.rs` test files own it.
- **S-C1.** The three `for i in 0..1000` loops (`tests/containment_bwrap.rs:247`, `tests/containment_pgroup.rs:135`, `tests/containment_macos.rs:133`) become `0..100`. The commit message says what 100 still proves: the 2026-10-18 fast-exit decision was that a child reaped before its identity is read is a normal spawn, and the race shows within the first few dozen iterations on a loaded machine; 100 keeps a 10× margin over the observed first occurrence and cuts ~2 700 spawns from every `cargo test`.
- **RT-M8.** `mapped.rs:237-238`: when `request.cwd` is `Some(p)` and `p.is_absolute()`, use it without calling `current_dir()`; otherwise as today. Zero net lines.

## Files

**Create**: `packages/process/rust/src/containment/pgroup.rs` (shared process-group module, ~150 lines moved, not written new).

**Modify**: `packages/process/rust/src/containment/linux.rs`, `containment/macos.rs`, `containment/mod.rs` (module list), `facts.rs` (`parse_relation` with state; `judge_here`), `platform/linux.rs` (`OnceLock` for boot id and pid ns), `platform/mod.rs` (`observer`), `mapped.rs:237-238`, `tests/containment_bwrap.rs:247`, `tests/containment_pgroup.rs:101, :135`, `tests/containment_macos.rs:133`. `packages/git/node-addon/src/single_load.rs` only if the cycle check allows it.

**Delete**: `become_subreaper` (`linux.rs:476-482`) and its call (`:243`); `StatRow`/`read_stat` (`linux.rs:306-325`); the duplicated helpers in `linux.rs` and `macos.rs` once `pgroup.rs` owns them. (`facts::start_time` and `kcmp_same_file` are phase 6's deletions, in the same file: this phase does not touch them.)

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
- `rg -n "PR_SET_CHILD_SUBREAPER" packages/process` → nothing (the only remaining site in the workspace is `packages/run-supervisor/rust/src/gate/unix.rs:81`).
- `rg -n "read_to_string\(.*\/stat" packages/process/rust/src` → one site (`facts`), plus `single_load.rs` if the cycle rule kept it.

## Net size

Rust (recomputed on `d95e0783f` after red-team Scope-F8): RT-M1 −8; RT-M2 +15 (three-valued folds, `unreadable` counts); S1 +6 (`OnceLock` in `platform/linux.rs:26-42`, 17 lines today); S-E2/S4 −25 (`StatRow`/`read_stat` are 21 lines, `:305-325`); S-E6 −45; S-C1 0; RT-M8 0 → ≈ −57. Node 0. Tests +8 (one RT-M2 case; loop bounds change a number, not lines).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Removing the caller-side subreaper changes who adopts an orphan of the group (pid 1 instead of the test runner), and `containment_pgroup.rs:65-101` encodes today's shape | M × M | Re-run the escape case first; the spec `:137` already names `setsid` descendants as an escape, so the proof asserts the named escape, not a reparent target; the group scan by `pgid` still reaches a reparented member that did not `setsid`. |
| S-E6 refactor changes a Linux-only subtlety (`live_rows` zombie filter, `pgid` compare) | M × H | The listing port returns `state` and `pgrp`; `members()` keeps both filters; the four `containment_*.rs` files run on each OS before merge. |
| `OnceLock` for pid namespace caches a value across a later `unshare` in the same process | L × M | fgOS never unshares after start in a process that judges (the gate is a separate process); state the invariant in a comment and in the spec (phase 6). |
| macOS is not a release target, so the macOS half cannot be run here | H × L | Keep the macOS changes mechanical (shared module); mark "compiled, not run on macOS" in the report. |

## Rollback

Revert the phase's commits; no on-disk format changes.

## Done when

RT-M1 and RT-M2 tests green; `cargo test --workspace` green; one stat parser, one pgroup module, cached observer; loops at 100 with the reason recorded; measured judge µs in the report.

## Lead brief essentials

Delete list: `become_subreaper`, `StatRow`/`read_stat`, the duplicated pgroup helpers. Find the owning test before writing a new one (the `containment_*.rs` files own the drivers; `judge_vectors.rs` owns the judge). Δ-lines per language. Report only what you saw yourself (paste `cargo test` and the bench output). Do not edit `containment.port.v1.json`, `facts::start_time`, `kcmp_same_file` (phase 6). Announce the (shape-preserving) changes on the board for MAIL/OPC. Report name from `fgos convention name --json`.
