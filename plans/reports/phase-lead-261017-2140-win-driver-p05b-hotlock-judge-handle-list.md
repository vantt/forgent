# Windows driver follow-up: hot-lock judge and spawn handle list

Status: DONE_WITH_CONCERNS (Windows CI result pending, see end). Branch `win-driver/p05b-hotlock-judge-handle-list`, merged `--no-ff` into `win-driver/integration`.

## Step 1: main into integration
Merged main (`c2cadb082`, state hot-lock, `186c257a5`). Conflicts in `CHANGELOG.md`, `docs/specs/distribution.md`, `docs/specs/reading-map.md`: kept both sides (Windows wording from integration plus the `lock-record-unreadable` check and `hot-lock.mjs` entry from main). Re-ran holder-lock, state and setup lock tests there: 156 tests, 140 pass, 0 fail, 16 skipped (Windows-only).

## 1. Hot-lock judge on Windows
- New host route `fgos internal process-observe --pid N` (`packages/holder-lock/rust/src/route.rs`, contract `internal-route.process-observe.v1.json`): the process-facts reading (`live` + creation FILETIME, `zombie`, `absent`, `unreadable`). Reused, not a new judge: the Rust `fgos-process` Windows driver already reads the creation time.
- `src/state/hot-lock.mjs`: `observeViaHost`, `hotObserver`, `judgeHotRecord`. On win32 the self record carries `startTime` = creation time (asked once per process, outside the critical section); the judge answers absent without a spawn when `kill(pid,0)` says so, otherwise asks the host. Host missing, unopenable, bad answer: `unknown` (fail closed). The doctor check and `fgos lock fence` use the same judge. Linux path unchanged (`observeProcess`).
- Live readings are cached 250 ms for polling waiters; the reclaim judges with `cache: false` (review finding 3: a cached reading could survive a reused pid).
- Tests: `test/state/hot-lock-host-judge.test.mjs` (runs on Linux against the real host, Windows branch via `platform: 'win32'`), `test/holder-lock/windows-hot-lock.test.mjs` (Windows CI: record carries creation time; holder SIGKILLed inside `withStateTx` is reclaimed by a second process within the wait; live holder never reclaimed, waiter gets `hot-lock-timeout`), Rust route test in `apps/fgos/tests/internal_lock_routes.rs`.
- `hot-lock-known-exec-sites.test.mjs`: baseline tree now copies the whole `src/holder-lock` so it agrees with the hot lock.

## 2. Review finding 2: explicit handle list
- `packages/process/rust/src/platform/windows_spawn.rs`: `CreateProcessW` + `STARTUPINFOEXW` + `PROC_THREAD_ATTRIBUTE_HANDLE_LIST`; the child inherits only inheritable copies of its three stream handles (pipe, NUL, file, caller's stream); `bInheritHandles` is FALSE when there is none. `Spawned` gives wait/try_wait/kill and `assign_and_resume` (shared `assign_and_resume_handles` in `windows_job.rs`).
- `borrow_windows.rs`: both the borrowed child and the job keeper start through it.
- Tests (Windows CI): `packages/process/rust/tests/windows_spawn.rs` (parent-owned inheritable handle closed in child; file stdout; pipes; cwd and env; missing program), `apps/fgos/tests/windows_borrow.rs::a_handle_the_holder_owns_is_not_open_in_the_borrowed_child`.
- Decision: a batch file (`.bat`/`.cmd`) as the borrowed program is refused (cmd.exe quoting); no borrowed command is one (git, node).

## Review (Sonnet code-reviewer) and fixes
1. Env names were case-sensitive (std's were not): now keyed uppercase, caller overrides parent's `Path`. Fixed.
2. `clear_env` with a bare program lost PATH lookup: falls back to the parent's PATH. Fixed.
3. Stale cache could judge a live holder dead: reclaim bypasses the cache. Fixed.
No defect found in handle list, attribute list, quoting, handle ownership, exit codes.

## Evidence
- Linux: `cargo test -p fgos --test internal_lock_routes` 14 pass; `cargo test -p fgos-holder-lock -p fgos-process` 67 pass; `cargo check --tests --target x86_64-pc-windows-msvc` clean for process, holder-lock, fgos.
- Node on integration after merge: holder-lock, state, setup lock checks, architecture, lock-fence CLI: 1530 tests, 1511 pass, 0 fail, 19 skipped (Windows-only). Host built in a private target (`.fgos/runtime/phase-target`), `FGOS_HOST_BIN` set.
- Wider run (state, setup, holder-lock, docs tests: 2420 tests) had one failure, `skill-wrappers` "Claude wrapper projection must exist ... instruction-audit": reproduced on the integration tip without these changes (generated `.claude/skills/instruction-audit` wrapper missing from main), not caused here.
- GitNexus: index stale, `impact` found no symbol; cross-checked by grep: `reclaimDeadHolder` is called only by `acquireRecord`; `assign_and_resume` by `borrow_windows` (now the new method) and `windows_job_domain.rs` (unchanged signature). No HIGH/CRITICAL known.

## Concerns / decisions
- The Windows code and tests have only been typechecked (cargo check on the msvc target), not run: Windows CI is the proof.
- Windows hot-lock now spawns the host once per process (self start time) and on contention; cost accepted, cache bounds it.
- Docs: holder-lock spec sections 8.1, 10, 15, 17, `CHANGELOG.md`, reading-map.

## Unresolved questions
- Windows CI run ids and the stress artifact: see below once the runs finish.
