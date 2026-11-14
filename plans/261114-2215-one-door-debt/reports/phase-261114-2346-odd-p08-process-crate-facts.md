# Phase 08 report: fgos-process answers the missing process facts

## Reader table (phase 00 "Leak 8")

| Reader | Answered by | Status |
|---|---|---|
| `same_user` (`holder-lock route.rs:652`) | new `facts::proc_dir_owner_uid` | added |
| `comm` (`origin.rs:118`, `git worktree.rs:578`) | existing `command_name_of` | exact |
| parent, group (`driver/flock.rs:694`) | existing `relation_of` | exact |
| fd-0 tty (`terminal-control herdr.rs:990`) | new `facts::stdin_tty_of` (Linux; target of `/proc/<pid>/fd/0` under `/dev/`) | added; herdr opens the proc path itself for ioctl, phase 11 may open the returned device path |
| Windows holder open+verify+wait (`helper.rs open_holder`, `hold.rs watch_parent`) | new `open_verified(&ProcTuple) -> Option<WaitHandle>` (`ended`, `wait`) in `platform/windows.rs`, one handle: open, creation time on it, return | added |
| self start time for the single-load marker | new `facts::StartTime` (`Ticks`, `FileTime`, `Timeval{sec,usec}`), `start_time_of`, `self_start_time` | added |
| `borrow_vectors.rs` creation times | `start_time_of` / `open_verified` | phase 09-11 |

`StartTime`'s `Display` is the crate's existing string form (decimal ticks, decimal FILETIME, `"{sec}.{usec:06}"`); macOS and Windows
`observe` now format through it, so the typed and string forms share one source. A test per platform pins typed == string for self.

## Finding that corrects the plan

The premise "`/proc/<pid>` is owned by root for a non-dumpable process" is false for the directory. Measured here (kernel 7.0, child with
`prctl(PR_SET_DUMPABLE, 0)`): `/proc/<pid>` stays owned by the user (mode 0555), while `/proc/<pid>/stat`, `status`, `environ`,
`cmdline` turn root-owned. The kernel applies the dumpable owner only to entries that are not world-readable-and-searchable directories.
So today's `same_user` never excludes ssh-agent/gpg-agent; its comment is wrong. `proc_dir_owner_uid` keeps today's exact meaning (no
behaviour change for phases 09-11) and its doc and test state the measured fact. If the scan should exclude non-dumpable processes, the
reader must look at a file inside (for example `environ`), a behaviour change for the owner to decide.

## Doors row

New row "process identity: start time of a process", patterns as in the phase file, `allowed`: the four crate platform files
(`linux.rs`, `macos.rs`, `windows.rs`, `windows_job.rs`), `debt`: `helper.rs`, `route/hold.rs`, `borrow_vectors.rs`, `single_load.rs`
(each "moves onto fgos-process"). The check passed with exactly these (a stale or missing entry fails it). Phases 09-11 delete the debt
entries.

## Gates

fmt, `clippy -p fgos-process --all-targets -D warnings`, `cargo test -p fgos-process` (48 lib tests plus the suites), `cargo check` for
x86_64-pc-windows-msvc and aarch64-apple-darwin: green. `architecture`, `doc-health`, `git-mutation-census` tests: 65 pass.
`check-decision-citation-drift`: no new findings. `git-one-door-scan`: 0 undeclared; census regenerated (line shifts only).
Windows tests (`open_verified`, typed start time) and the macOS test compile under the check targets but were not run here.
Windows clippy with `-D warnings` fails in untouched `windows_job.rs` and `windows_spawn.rs` (not a required gate; not in this phase).

## Changelog

None: no user-visible change.

## Lessons

- A plan fact about OS behaviour (non-dumpable `/proc` owner) was wrong; measure it with the real child before building on it.
- Format platform strings from one typed value so the string form and the typed parts cannot drift.
- Verify-and-wait must be one handle on Windows; the function returns the handle, never a boolean.
- A new Rust test shifts the mutation census; regenerate it, do not hand-edit.

## Authority

`fgos-process` is the one reader of a process start time per platform (doors row), and the one source of the start-time string form
(`StartTime`).

Status: DONE_WITH_CONCERNS
