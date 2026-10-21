# Phase lead report: containment and crate fixes (branch harden/t0-p04-containment)

Base f23c091a8. Commits: e6b9c034a (loops), 6cb12f836 (cwd), d33e6c9e0 (everything else, with the regenerated census).
RT-M1, RT-M2, S1, S-E2/S4 and S-E6 touch the same lines of linux.rs, macos.rs and facts.rs, so they are one commit, not five.

## Per item

- RT-M1: `become_subreaper` and its call deleted (containment/linux.rs). Proof: `spawn_in_never_makes_the_caller_a_subreaper` (tests/containment_pgroup.rs) now green; `containment_pgroup_ends_a_tree_of_twenty_including_a_setsid_child` still green, its manual kill of the setsid escape stays because that process is the spec's named escape. `rg PR_SET_CHILD_SUBREAPER packages/process` finds nothing.
- RT-M2: pgroup.rs `state` folds Alive, then Unknown, then Empty; `kill` refuses on an Unknown target, on `unreadable > 0`, or when the table cannot be listed. `members()` returns `Result<Members{tuples, unreadable}, Unlistable>` on Linux and macOS. `kill_all` skips the SIGTERM `signal_group` when `remember_tree` could not list. Proof: `containment::linux::tests::pgroup_state_reports_unknown_when_a_seen_member_cannot_be_judged` green; new `containment::pgroup::tests::a_candidate_that_cannot_be_read_makes_the_domain_unknown_not_empty` (unreadable candidate absent from `seen`, unlistable table) and `a_kill_that_could_not_read_every_candidate_is_refused`. These are in pgroup.rs because that is where the shared fold lives, so they own both drivers. macOS `tree_state_reports_unknown...` now runs through the same code; compiled by construction only, no macOS toolchain here.
  Vanishing mid-listing (NotFound) is gone, not unreadable; any other read or parse failure is counted.
- S1: boot id and pid namespace cached in `OnceLock` inside `platform/linux.rs` (`boot_id`, `pid_ns`), so `judge_here`, `observer()` and `identity_of` all use the cache with no change to facts.rs/mod.rs; hostname stays live. Invariant (no unshare in a judging process) is in the comment. NOT MEASURED: I did not run the 300-call bench; no µs figures to report.
- S-E2/S4: `facts::parse_stat` -> `Stat{state,parent,group,start_ticks}` is the one parser; `parse_relation` and the (still public) `parse_proc_stat` are thin wrappers; `platform::linux::read_stat` is the one file reader, used by `observe`, containment and `environment_marked`. `StatRow`/`read_stat`/`live_rows` deleted. `members()` still drops state Z/X. `rg 'read_to_string\(.*/stat'` finds one site (platform/linux.rs); the relations pass reads through an fd and still uses `parse_relation`. `single_load.rs` left alone (phase 2 owns that dir; it must not depend on fgos-process before `check()`).
- S-E6: new containment/pgroup.rs (`remember_tree`, `state`, `kill`, `signal_group`, `wait_until`, `apply_stdio`, `POLL`) generic over `ListFn`; `members` stays per driver; `prune_dead`/`tree_state_adopt` stay in macos.rs. `signal_group` now uses `as_pid_t` on both OSes (pid 0 refused).
- S-C1: three loops 1000 -> 100 and tests renamed `a_hundred_fast_exits_are_normal_spawns`. 100 still proves: a child reaped before its identity is read is a normal spawn (the 2026-10-18 decision) with a tenfold margin over the first observed occurrence; it drops about 2700 spawns per cargo test.
- RT-M8: mapped.rs uses an absolute `cwd` without `current_dir()`.

## Results seen

- `cargo test -p fgos-process`: all pass (lib 39 incl. new cases, containment_bwrap 10, containment_pgroup 6, others green).
- `cargo test --no-fail-fast -p fgos-process -p fgos-holder-lock -p fgos-run-supervisor -p fgos-git`: every result line "ok", no failures. (An earlier attempt hit "Disk quota exceeded" on the shared /tmp; rerun after space freed, build with debuginfo off.)
- `cargo clippy -p fgos-process`: clean. Census regenerated: 0 undeclared sites.

## Delta vs f23c091a8

Rust src: +345 / -298 = +47 net (pgroup.rs is 193 lines, about 38 of them its two tests; plan estimated -57, the difference is the Unknown/unreadable handling and tests). Rust tests: +6 / -6 (loop bound and rename only).

## Not done

S1 bench numbers; macOS run; `list_pids` on macOS cannot tell a failed listing from an empty one, so macOS `members` never returns `Unlistable`. Board announcement for MAIL/OPC not written (public API shape unchanged: `parse_proc_stat`, `parse_relation`, `Relation` kept).
