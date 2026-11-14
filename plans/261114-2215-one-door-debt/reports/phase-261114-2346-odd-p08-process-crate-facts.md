# Phase 08 report: fgos-process answers the missing process facts

## Reader table (phase 00 "Leak 8")

| Reader | Answered by | Status |
|---|---|---|
| `same_user` (`holder-lock route.rs:652`) | existing `ProcView.effective_uid` (status Uid field 2), already in the scan loop | no new function |
| `comm` (`origin.rs:118`, `git worktree.rs:578`) | existing `command_name_of` | exact |
| parent, group (`driver/flock.rs:694`) | existing `relation_of` | exact |
| pty size of a shell's stdin (`terminal-control herdr.rs:990`) | new `facts::stdin_window_size(pid) -> Option<(u16,u16)>`: open `/proc/<pid>/fd/0` with `O_NOCTTY|O_NONBLOCK`, `isatty`, `TIOCGWINSZ` | added; `/dev/null` and pipes answer `None` |
| Windows holder open+verify+wait (`helper.rs`, `route/hold.rs`) | `open_verified(&ProcTuple)`, a thin wrapper over `WaitHandle::open(pid)` + `start_time()` | added |
| `borrow_vectors.rs` "has this pid ended" | `WaitHandle::open(pid)` + `ended()` (87 = gone) or `observe(pid)` | phase 09 |
| self start time for the single-load marker | new `facts::StartTime`, `start_time_of`, `self_start_time` | added |

`StartTime`'s `Display` is the crate's string form; macOS and Windows `observe` format through it, and a test per platform pins
typed == string for self. `identity_of` on Linux, `containment/linux.rs` and Windows `signal_by_identity` still format their own
strings, so the claim is only "`Display` equals the existing form", not a single source.
`WaitHandle` is built on the crate's `ProcessHandle` (`windows.rs`); `windows_job.rs` keeps its own `open_for_wait` /
`creation_time`, not merged here (a separate item if wanted). `ended` and `wait` return `io::Result<bool>`.

## Finding that corrects the plan

The premise "`/proc/<pid>` is owned by root for a non-dumpable process" is false for the directory (kernel 7.0 measured with a
`prctl(PR_SET_DUMPABLE, 0)` child; only entries inside, such as `stat` and `environ`, turn root-owned). The owner of `/proc/<pid>`
is the process's status Uid field 2, so no separate function exists; phase 09 compares `effective_uid` and fixes the wrong
comment in `same_user`.

## Doors row

New row "process identity: start time of a process", patterns as in the phase file, `allowed`: the four crate platform files
(`linux.rs`, `macos.rs`, `windows.rs`, `windows_job.rs`), `debt`: `helper.rs`, `route/hold.rs`, `borrow_vectors.rs`, `single_load.rs`
(each "moves onto fgos-process"; `borrow_vectors.rs` reads no start time, it only matches `OpenProcess(`). The check passed with exactly these (a stale or missing entry fails it). Phases 09-11 delete the debt
entries.

## Gates

fmt, `clippy -p fgos-process --all-targets -D warnings`, `cargo test -p fgos-process` (48 lib tests plus the suites), `cargo check` for
x86_64-pc-windows-msvc and aarch64-apple-darwin: green. `architecture`, `doc-health`, `git-mutation-census` tests: 65 pass.
`check-decision-citation-drift`: no new findings. `git-one-door-scan`: 0 undeclared; census regenerated (line shifts only).
Windows tests (`open_verified`, child-ends wait, typed start time) compile under `cargo check --all-targets` for msvc but were not run here; the macOS test is not compiled by the check.
Windows clippy with `-D warnings` fails in untouched `windows_job.rs` and `windows_spawn.rs` (not a required gate). Not done: Linux stat-field-22 door patterns (`scripts/lib/mailbox-live-confined.mjs:364`, `scripts/record-mailbox-hook-fixtures.mjs:437,:897` read it themselves) are left for OPC to file as an item.

## Changelog

None: no user-visible change.

## Lessons

- A plan fact about OS behaviour (non-dumpable `/proc` owner) was wrong; measure it with the real child before building on it.
- Format platform strings from one typed value so the string form and the typed parts cannot drift.
- Verify-and-wait must be one handle on Windows; the function returns the handle, never a boolean.
- A new Rust test shifts the mutation census; regenerate it, do not hand-edit.

## Authority

`fgos-process` is the one reader of a process start time per platform (doors row).

Status: DONE_WITH_CONCERNS
