# Phase report: windows-job domain (4.4b P02)

Status: DONE_WITH_CONCERNS. Branch `win-driver/p02-windows-job` (efe346c7e) merged into `win-driver/integration`.

## Delivered
- `packages/process/rust/src/platform/windows_job.rs`: pure core (`decide`, `tree_from`, `read_id_list`, job-name format) compiled on every platform; Windows half: `JobView`, `ContenderView`, `create_kill_job`, `open_job`, `job_name`, `assign_and_resume`, `filetime_now`.
- `lib.rs`: `WindowsJob` record, `DomainWatch` (`is_empty`, `kill_all`, `reason`), `domain_watch`, `job_view` (Windows); `domain_is_empty`/`domain_kill_all` are one-shot wrappers.
- `predecessor.rs`: reads/writes the D4 shape; one `domain_watch` per `admit`.

## Evidence
- Windows CI run 39032046426 (windows-latest + macos-latest): green. All 9 real-process scenarios in `tests/windows_job_domain.rs` x50 repeats passed, 0 violations.
- Linux: `cargo test -p fgos-process -p fgos-holder-lock` on integration `e8bb48e16`: 63 passed, 0 failed (incl. 10 unit tests for tests 1-5, 4 in `predecessor_record_shape.rs`).
- `cargo check --tests` for fgos-process, fgos-holder-lock, fgos-distribution, fgos, fgctl: green on windows-msvc and aarch64-apple-darwin.
- GitNexus index does not know these Rust symbols; grep shows callers only in `predecessor.rs` and `tests/signal_identity.rs`. No HIGH/CRITICAL.

## Decisions (open points of the phase file)
- `windows_job.rs` is not `#[cfg(windows)]` as a whole: the pure part compiles everywhere so tests 1-5 run on Linux; OS part is under `mod os`.
- Record JSON: `sessionId`/`declaredAt` are decimal strings (contract file), struct holds `u32`/`u64`. Numeric values are an unknown shape.
- Tree walk stops at a node created before `declaredAt` (a real member's whole parent chain is newer).
- Holder liveness unreadable => treated as not alive (union is the stricter side).
- Holder alive and job unopenable => `Empty` (nothing visible; holder released by rule).
- `declaredAt` for P04: use `filetime_now()` (coarse kernel clock, same as process creation stamps); a precise clock can be ahead of creation times and drop a member from the tree.
- Reason `predecessor-other-session` is exposed by `DomainWatch::reason()`; `Admit::NotEmpty` shape is unchanged.
- `tests/signal_identity.rs` (not owned) updated for the new `WindowsJob` type.

## Concerns
- Extra wait p50/p95 and whether the CI runner runs inside a job were not measured; add to P06's stress run.
- Test role children started by roles (`spawn_plain`) are not killed with their parent; the runner reaped them ("Terminate orphan process") and a 120 s watchdog bounds them.
- `jobOpened` ratio of the dying-job-open test is printed with `eprintln!` (not captured without `--nocapture`).

## Unresolved questions
- None.
