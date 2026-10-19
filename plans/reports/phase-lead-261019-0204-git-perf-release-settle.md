Date: 2026-10-19, Asia/Saigon. Baseline: counsel commit `f6521aefd`.

Implemented one Linux exclusive `settle_release` door for both explicit `release() -> Release` and `Handle::drop`, without `#[must_use]`. Borrow return and admission use one lagged `Since` pass; missing marks refuse rather than restoring a full scan. Release and borrow reuse one bounded kill/wait loop. Process facts own the shared fdinfo parser, kernel-table prefix read, descriptor/locker identities and kcmp. Holder identities are captured before descriptor observation and pinned when signalled. Current own handles and positive later-acquirer records spare legitimate acquirers; direct pre-exec children are waited, never killed.

Kernel verification corrected the counsel: 256 real flocks plus a 1 MiB read produced only 4,045 bytes/76 records; another read returned 4,050 bytes. A short `seq_read_iter` result need not be EOF ([kernel source](https://raw.githubusercontent.com/torvalds/linux/master/fs/seq_file.c)); the lock iterator holds its table lock only for each iteration session ([locks source](https://raw.githubusercontent.com/torvalds/linux/master/fs/locks.c)). The coordinator explicitly approved positive table evidence followed, on absence, by an inode-checked shared try-lock probe. Blocked/uncertain probes enter the full tagged scan; an empty scan alone never means clean. The independent probe description is opened without creation through `/proc/self/fd` before original close, so it also verifies unlinked old inodes; it is not a dup and never keeps the original flock alive. Its brief SH hold can make a concurrent exclusive Try report held. Specs §5/§20 and the contract record this supersession.

The counsel's Publication ownership references were stale: the actual addon `GitPublication::close` dropped an optional handle. It now consumes release and returns `{released, leftoversKilled}`, or `lock-release-stuck` with counts/pids. Guards still enter the same Drop door. The GC negative control now uses the existing raw-description lock door, preserving its intentional lack of Handle cleanup.

C5 now shares the existing durable-file temporary-name rule across WAL readers and skips compaction temporaries before counting the scan bound. Its regression also verifies malformed installed entries still refuse.

Verification:
- `cargo test --locked --no-fail-fast -p fgos-git -p fgos-holder-lock -p fgos-process -p fgos-durable-file -p fgos-event-store -p fgos-distribution -p fgos-observe -- --test-threads=1`: 517 passed, zero failed, two ignored across 89 targets.
- Final holder-lock/process real-process run: 130 passed, zero failed. Includes 1,000 legitimate-contender rounds, 100 same-process reacquisitions with a normal borrow, SCM_RIGHTS release/Drop/unlinked-inode cases, a multi-page lock-table recipient, pre-exec wait/stuck/shared-close behavior, parser/kcmp tests and a real seq_file short-read regression.
- Seven-crate `cargo clippy --locked … --all-targets -- -D warnings`: pass. Windows `cargo check --locked --target x86_64-pc-windows-msvc -p fgos-holder-lock -p fgos-process -p fgos-git`: pass, with the pre-existing unused-import/variable warnings. Addon `cargo check --locked -p fgos-node-addon`: pass.
- Borrow vectors and sibling check pass; impact-analysis: inactive (zero registered providers). No E3, npm test, git add or commit. bwrap PID-namespace variants skip because this sandbox cannot create the required user namespace; Windows/macOS execution was not available. mdview preview failed because its database is read-only.

Scope blocker: `cargo check --locked -p fgos --test internal_lock_routes` confirms E0308 at `apps/fgos/tests/internal_lock_routes.rs:120`: the match arm still returns `release(h)` where unit is required. Replace that arm with an assertion matching `Release::Released { .. }`; migrate its other calls and the remaining calls in `apps/fgos/tests/windows_borrow.rs` and `apps/fgos/tests/windows_predecessor_stress.rs` likewise. These three files and the required GIT row update in `plans/261017-1313-fgos-platform-program-board/plan.md` are outside this assignment's write scope and remain untouched; all four are listed in `needsWrites`. The permitted crate gates do not cover that app-test compile failure.

Status: BLOCKED
Summary: fix(holder-lock): settle release and ignore WAL ledger temporaries
Implementation within scope is verified; completing the required caller migration needs the excluded app-test files.
Concerns/Blockers: External caller migration and program-board update require the listed additional write paths.
Context refs:
- (none)
