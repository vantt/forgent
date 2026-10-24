# HARDEN lead — contained children start without forking the caller

- Branch `harden/containment-spawn-no-fork` (from origin/main 35db93bc4), commit `3894ff956`, pushed. Not merged.
- Worktree `/home/vantt/projects/forgent-worktrees/harden-spawn-mapped-containment`; target `/home/vantt/projects/forgent-worktrees/harden-spawn-target`.

## What changed

- `packages/process/rust/src/mapped.rs` (the one no-fork door, reused): added `MappedChild::try_wait` (shares a `reap` helper with `wait`, EINTR retry kept); `MappedStdio::File(&File)` (caller-given file, dup'd close-on-exec above every slot like the slot sources, then `dup2` file action; `try_clone` in the Command fallback); `MappedLead { Caller, Group, Session }` replaces `process_group: bool` (Session = `POSIX_SPAWN_SETSID` on glibc; `setsid` pre-exec in the off-glibc Command fallback). `MappedSpawn`/`MappedStdio` gained a lifetime (borrowed stdio files, like `fd_map`).
- `containment/mod.rs`: `Spawned.child` is `GateChild` = `MappedChild` on unix, `std::process::Child` elsewhere (mapped is unix-only).
- `containment/pgroup.rs`: `apply_stdio` deleted; `gate_request` (spec -> MappedSpawn, exact env, cwd, stdio or /dev/null) and `spawn_leader` (session-leading spawn + identity read + kill/reap on failure) shared by linux-pgroup and macos-tree.
- `containment/linux.rs`: `BwrapPidns::spawn_in` builds the same argv (`prefix --info-fd N -- gate argv`) on the request, same info slot (max slot+1, >=3) in the fd map, same `read_child_pid` handshake, tombstone, `end_failed_spawn`, error names. `LinuxPgroup::spawn_in` -> `spawn_leader`. The setsid pre-exec closure deleted.
- `containment/macos.rs`: -> `spawn_leader` (setsid closure deleted; unused imports dropped).
- Callers moved (L10): holder-lock `port.rs` (`lead: MappedLead::Caller`, `MappedSpawn<'static>`), `driver/flock.rs` (`MappedLead::Group`), run-supervisor `supervise/unix.rs` (`open(_gate: &mut GateChild)`). git `driver.rs` and `supervise.rs` needed no edit (`id/kill/wait/try_wait` match).
- `docs/platform/process/spec.md`: section 10 `spawn_in` row now says `spawn_mapped`; one dated sentence (2026-10-24). `CHANGELOG.md` Unreleased line. Census regenerated.

Not deleted: `control::spawn_with_fds` still has non-containment callers (run-supervisor `gate/unix.rs:605`, `steps.rs:230`, terminal-control `herdr.rs:306`, many tests) and is the mapped door's off-glibc fallback. Only the containment route through it is gone.

## Platform notes

- Linux glibc: posix_spawn (no fork). Linux musl/other unix: Command fallback (forks, as before).
- macOS: moved onto the same door, but still forks via the fallback (`spawn_mapped` posix path is glibc-only; extending it to macOS posix_spawn is untestable here, left as is).
- Windows: unchanged (`cmd.spawn()` + CREATE_SUSPENDED job assignment; mapped module is unix-only); `GateChild` = `Child` there.

## Proofs

- `cargo test -p fgos-process -p fgos-run-supervisor -p fgos-git -p fgos-holder-lock`: 603 passed, 0 failed, 9 ignored (pre-existing ignore markers). Git calls ran contained under `bwrap-pidns` (selected on this machine). Ignored bwrap test `borrow_deadline real_read_tree_deadline_as_namespace_init_cleans_its_native_lock --ignored`: pass.
- Owning proof extended in `packages/process/rust/tests/spawn_mapped.rs`: process-group test now also proves Session (sid==pgid==pid) and Group-stays-in-caller-session; new `given_files_are_the_childs_stdio_and_try_wait_reports_the_exit_once_it_happens` (given stdin/stdout/stderr files, no parent ends, try_wait None then Some(5), repeated status after reap, caller file keeps CLOEXEC). 7/7 pass.
- clippy `-D warnings --all-targets` on the four crates: clean.
- Cross checks `cargo check -p fgos-process -p fgos-run-supervisor -p fgos-git`: aarch64-apple-darwin OK, warnings 23 -> 20 (three macos.rs unused imports removed). x86_64-pc-windows-msvc: warnings 25 -> 25, but **fgos-git fails to compile on Windows on origin/main already** (`refs.rs:1073 custody_lock_path` missing, `worktree.rs:405 libc::geteuid` unconditional; verified identical with my change stashed). Also pre-existing cross-target test-target errors with `--all-targets`: process `containment_conformance`/`containment_windows` (WindowsJobDriver trait methods not in scope), run-supervisor `steps_runner` on darwin (`libc::ptsname_r`). Not touched; outside this lane.
- One-door scan: 5 undeclared unresolved-binary sites (same 5 Node sites as before). The first shape produced a 6th (`pgroup.rs` argv via `argv.iter()`); the request builder was shaped so the scanner resolves it (pgroup -> SpawnSpec constructions; bwrap -> `self.prefix()` bwrap paths, now `argv-runner` 10 -> 13). Census regenerated and staged; pre-commit hook passed.

## strace (`strace -f -e clone,clone3,vfork,fork`, one contained `git rev-parse HEAD`)

Before (bwrap-pidns): first line is the bwrap probe (std posix_spawn), second is the contained spawn:
```
563497 clone3({flags=CLONE_VM|CLONE_VFORK|CLONE_CLEAR_SIGHAND, ...}) = 563498      # probe
563497 clone(child_stack=NULL, flags=CLONE_CHILD_CLEARTID|CLONE_CHILD_SETTID|SIGCHLD) = 563500   # fork of the caller
```
Before (linux-pgroup): `clone(child_stack=NULL, flags=CLONE_CHILD_CLEARTID|CLONE_CHILD_SETTID|SIGCHLD)`.
After (bwrap-pidns):
```
1621389 clone3({flags=CLONE_VM|CLONE_VFORK|CLONE_CLEAR_SIGHAND, ...}) = 1621390    # probe
1621389 clone3({flags=CLONE_VM|CLONE_VFORK|CLONE_CLEAR_SIGHAND, ...}) = 1621392    # contained spawn
```
After (linux-pgroup): `clone3({flags=CLONE_VM|CLONE_VFORK|CLONE_CLEAR_SIGHAND,...})`. (The `clone(CLONE_NEWNS|CLONE_NEWUSER|CLONE_NEWPID)` lines are bwrap's own, inside the child.)

## Timing

Harness: scratch crate (`spawn-bench`, path dep on fgos-process, release, private target), touches N MB of heap, 40 x `spawn_in` of `/usr/bin/git rev-parse HEAD` then `wait`; binaries `spawn-bench-before`/`-after` kept in the target dir. `spawn_in` time = caller-side start (+ bwrap's info-fd report for bwrap). Medians in ms, two interleaved rounds:

| RSS | driver | before | after |
|---|---|---|---|
| 500 MB | bwrap-pidns | 15.1 / 19.9 / 25.2 / 21.7 (p90 ~25-28) | 2.7 / 0.7 / 2.7 / 1.8 (p90 ~3.4) |
| 500 MB | linux-pgroup | 10.3 / 14.8 / 18.3 / 12.3 | 0.10 / 0.12 / 0.10 / 0.18 |
| 100 MB | bwrap-pidns | 8.7 | 2.7 |
| 100 MB | linux-pgroup | 6.7 | 0.42 |
| 13 MB | bwrap-pidns | 1.0 | 0.7 |

Spawn+wait medians at 500 MB: bwrap 18.7-29.4 -> 2.6-9.5 ms; pgroup 11.3-19.2 -> 0.86-1.1 ms. After is flat in RSS. Load: 10:45 3.6-4.2, 10:55 8.8 (after the test run), 11:05 1.4-1.6 (1-min avg).

## Net lines

Production Rust (`packages/*/rust/src`): +157 / -123, net +34 (estimate +60/-25 = net +35). Tests +51/-10 (spawn_mapped.rs). Totals incl. census/docs: 12 files, +251/-175.

## Ideas (not done, owner choice)

- holder-lock `BorrowStdio::Files` is refused on unix ("file stdio is only available on Windows"); `MappedStdio::File` now makes it possible on unix with no new mechanism. Benefit: one borrow stdio contract across OSes. Evidence: `packages/holder-lock/rust/src/port.rs:951`.
- The remaining forking `spawn_with_fds` callers (gate agent spawn, steps runner, herdr driver) could move to `spawn_mapped` the same way, then `spawn_with_fds` becomes fallback-only. Benefit: same fork cost win in the gate (small RSS there, so lower value).

## Unresolved

- Windows compile break of fgos-git on main (above) belongs to the Git lane; needs an item.
