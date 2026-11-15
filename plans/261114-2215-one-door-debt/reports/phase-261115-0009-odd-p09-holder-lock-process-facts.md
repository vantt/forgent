# Phase 09 report: holder-lock reads process facts only through fgos-process

## Changes (`packages/holder-lock/rust/src`)

| Site | Now |
|---|---|
| `route.rs` `same_user` | takes the scan's `ProcView`, compares `effective_uid == Some(geteuid())`; comment fixed (a non-dumpable process keeps its `/proc/<pid>` directory and status uid) |
| `origin.rs` `comm_of` | `facts::command_name_of` |
| `driver/flock.rs` `parent_and_group` | `facts::relation_of` (no own `/proc/<pid>/stat` read or parse) |
| `helper.rs` (Windows) | `open_verified(&domain.holder)`: one handle verifies and waits; `Owned`, `OpenProcess`, `GetProcessTimes` gone |
| `route/hold.rs` `watch_parent` (Windows) | `WaitHandle::open(ppid)`, parent creation vs `self_start_time()` compared as typed `FileTime`, wait through the same handle. It compares with this process, not a recorded tuple, so it uses the handle API rather than `open_verified`. A handle that cannot read the creation time (query access refused) is refused with a named error, never waved through; a parent that already ended (`Ok(None)`) passes and the wait reports it gone |
| `borrow_vectors.rs` (Windows) | `WaitHandle::open(pid)` + `ended()`; error 87 means gone, other errors are named (a failed wait is now named too) |

`driver/flock.rs` keeps its holder discovery (`/proc/self/fd`, fdinfo, scan) and stays `allowed` in the `/proc` row.

## Behaviour notes

- `watch_parent` open failure text changed from "OpenProcess on parent pid N failed: X" to "cannot open parent pid N: X"; no test matches either string.
- `job_keeper`: a holder that already exited before `K` is read gives "the recorded holder is not running", exit 1. The old `open_holder` also returned `None` for an unopenable holder, so that case is unchanged; the differences are that a handle opened without query access is now refused too (it could not be verified before either, as `OpenProcess` asked for query access). A holder that exited while some handle still held its object now makes the keeper exit 1, where before it exited 0 once the job emptied (the old `GetProcessTimes` succeeds on an exited process whose object is still referenced; `creation_time` returns `Ok(None)` once `wait(0)` reports it signalled); the keeper ends either way.

## Doors rows

- Start-time row: debt entries `helper.rs`, `route/hold.rs`, `borrow_vectors.rs` removed. The row now has no debt (`single_load.rs` left it on main). Allowed list unchanged.
- `/proc` row: debt entries `route.rs`, `origin.rs` removed. `borrow_vectors.rs` stays in debt: the vector's shell snippet (`/proc/$!/winpid`, Git for Windows) still matches the pattern; it is a sh string, not a Rust read. Other debt untouched.

## Gates

fmt; `clippy -p fgos-holder-lock --all-targets -D warnings`; `cargo test -p fgos-holder-lock` (all suites, 26 in `borrow_io`); `cargo check --all-targets` for x86_64-pc-windows-msvc and `cargo check` for aarch64-apple-darwin: green, no warnings. Windows code is compiled, not run, here.
`run-tests`: `test/holder-lock/*`, architecture, doc-health, git-mutation-census: 123 pass, 20 skipped, 0 fail. Citation drift: no new findings. One-door scan: 0 undeclared. Census unchanged.

Note: `borrow_io::adopted_direct_child_is_drained_on_borrow_and_release` failed once in a run that overlapped other builds, then passed 20/20 on this branch and 20/20 on the base (and in the full re-run). It asserts a timing-dependent post-release state through `observe`; the code it exercises is untouched. Flaky under load, not caused here.

## Changelog

None: no user-visible change.

## Lessons

- A reader moves onto the crate by passing the value the caller already holds (`ProcView`) instead of a pid, which removes the second read.
- The crate's handle returns `io::Result`; map "no such process" to gone and name every other error, never fold it into false.
- `watch_parent` compares against its own start time, so it needs the typed `StartTime`, not the tuple string.
- A door pattern still matches a shell string in a vector module; keep its debt entry rather than widening the phase.

## Authority

`fgos-process` is the one reader of command name, parent/group, owner uid and Windows process open/wait for holder-lock.

Status: DONE
