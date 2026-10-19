# Git phase 04, unit 3: review fixes

Base `6c09254e3`, branch `git/p04-custody`. No staging, commit, activation or lifecycle operation. Impact-analysis: inactive (zero providers). The report path was resolved with `fgos convention path --kind report --type phase-lead --slug git-p04-u3-review-fixes --at 2026-10-19T00:59:00+07:00 --json`.

## Findings

| Finding | Disposition |
| --- | --- |
| H1 | Removed the unlocked predecessor precheck. The existing policy under the kernel lock remains the admission door. Restored `dispatch-in-flight` on every platform and Linux holder attribution to the live controller/supervisor/gate. Both real Assignment concurrency tests pass. |
| H2 | Behavior and spec claims unchanged; owner decision remains pending. A real-process **best-effort handoff limitation** vector has a live controller, successful `linux-pgroup` producer, surviving `setsid` escapee, cleared record and admitted successor. This tests the predecessor/handoff primitive, not a supervised Assignment. Counterevidence: the full portable Linux supervisor vector kills that same `setsid` escapee before successful receipt/handoff because the live gate is a subreaper and drains adopted descendants. An exact surviving-escapee supervised Linux vector was therefore not reproduced; both distinct tests remain. No claim of complete V-CUSTODY. |
| M1 | Both Unit and standalone Assignment use one existing-module handoff helper: clear failure preserves the record and settled outcome and attaches `custody-handoff-not-recorded` to the returned result. Assignment copies the normalized frozen result before warning attachment, then freezes it again. Real live-domain refusal, standalone settled-result and committed-Unit vectors pass. The Unit vector uses a real sync-only merge commit, corrupting the record from its hook. Warnings are returned to the caller; existing on-disk settlement is not rewritten. |
| M2 | Documented intended Windows fail-closed difference in run-supervisor §4. `LockFileEx` belongs to its acquiring process; the current port cannot acquire a second exclusive copy beside the controller helper. Retained the declare-domain acknowledgement rather than changing ownership/GO protocol. Controller death can free the lease and let successor admission terminate the producer job; Unix copies retain adoption behavior. Windows host validation remains outstanding. |
| M3 | Deliberately left the verification `execSync` code untouched. Coordinator must carry the borrowed verification child fix in COOK phase 02. |
| M4 | Extended the existing realpath/dev/inode key with nanosecond cwd birth time; symlink aliases still share a key. Legacy inode-only record isolation passes. The real recreate loop saw no inode reuse in 1,024 creations; it asserts distinct keys if reuse occurs. Holder-lock §19 now documents quiesced manual predecessor-record recovery until phase 03. This key change requires the already mandated stop-everything cutover. |
| M5 | Commit git/hook children request the previous 64 MiB per-stream capture limit. Both synchronous transports reject overflow; hold transport no longer returns a partial list, and fd capture failures still sweep leftovers. Real 17 MiB captures and an actual runner commit with a 17 MiB hook pass. Both overflow vectors pass. |
| L1 | Corrected holder-lock §19 to describe the implemented Workflow fresh-worktree redispatch. |
| L2 | Replaced the generic Rust clear route's `dispatch-cwd:3` label with neutral `lease:3`. |
| L3 | Unix declaration compares fd 4 metadata to the named cwd lease's dev/inode before writing the record. Real mismatched-path refusal test passes without starting the producer or declaring on the wrong record. |
| L4 | Fresh writing Unit admission precedes run directory creation and announcement. A real held-lock vector proves no Unit run or callback is created on refusal. |
| L5 | Borrowed both preflight calls and the post-admission `commitPending`/`commitOnBranch` checks. Remaining early reads: resume's `assertNoStrayCommit` and `assertSyncResumable`, and initial `seedSync` ref resolution, occur during validation before custody acquisition. They remain listed for the Git caller migration; moving their admission/validation order was not needed for these fixes. |
| L6 | Runner history explicitly records intended generic read-only executor behavior; supervised read-only Assignments retain mutation detection. |
| L7 | No merge changes. Coordinator must reconcile publication/perf branch conflicts and rerun Rust/custody checks after merging. |

Prior art: `git log -S cwdDevIno` locates `42da56e68`; `git log -S cwdLeaseOwner` locates `e11c4299f`. Reused existing registry resolution, predecessor policy under exclusion, borrowed children, helper log protocol and result normalization. No new lock row, config, environment switch, tool dependency or service.

## Verification

Commands ran from this checkout with `FGOS_HOST_BIN="$PWD/target/debug/fgos"`, `FGOS_STATE_ROOT=/tmp/fgos-work/p04-u3-state`, `XDG_STATE_HOME=/tmp/fgos-work/p04-u3-xdg`, and `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/p04-u3-fixtures`. These relocate writable state/fixtures and do not bypass production checks. No script sets `CARGO_TARGET_DIR`.

- `cargo test -p fgos-run-supervisor -p fgos-holder-lock`: **168 reported passes, 0 failures**, including all three Unix lease-record tests (`/tmp/p04-u3-rust-final.log`). Existing namespace-dependent vectors may return early when pidns is unavailable; harness green does not prove those host vectors.
- `cargo clippy -p fgos-run-supervisor -p fgos-holder-lock --all-targets -- -D warnings`: pass (`/tmp/p04-u3-clippy-final.log`).
- Rebuilt the host with `cargo build --locked -p fgos` (pass, `/tmp/p04-u3-host-build.log`). Architecture + real Git borrow + custody + hold transport + commit + registry contracts + entire Assignment concurrency file against that host: **107 pass, 0 fail** (`/tmp/p04-u3-built-host-final.log`). The two new Unit vectors against the rebuilt host: **2 pass, 0 fail** (`/tmp/p04-u3-built-unit-final.log`).
- Entire changed Assignment concurrency file: **3 pass, 0 fail**, including real standalone handoff failure and immutable result (`/tmp/p04-u3-assignment-final4.log`).
- Entire changed Unit-run file: **37 pass, 32 fail** (`/tmp/p04-u3-run-final2.log`). Thirty-one are explicit required-confinement namespace-probe refusals; one existing sibling-summary assertion fails after its sibling cannot launch. The new admission-before-announcement vector passes. Both new Unit vectors pass; the committed-result test uses a sync-only Unit and a real hook (**2 pass** alone, `/tmp/p04-u3-unit-vectors-final.log`).
- Full `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID npm test`: **7,596 pass, 418 fail, 133 skip, 65 todo**, 8,212 reported tests, 336 seconds (`/tmp/p04-u3-npm.log`). Not green. It overlapped the final Assignment result/fixture refinement, sync-only Unit fixture refinement and host rebuild; the final focused reruns above supersede its failures for those two new vectors. Other failures include namespace probes, terminal/crash timeouts and host/release-fixture restrictions; no clean baseline was measured.
- `git diff --check`: clean. MDView previews were attempted; its database is read-only, so no preview URL is available.

The sandbox cannot create bwrap user/PID namespaces, cannot validate the host terminal/pidns crash matrix, and is not a Windows/macOS host. No baseline comparison was measured. Do not infer that all broad-suite failures are pre-existing or that phase acceptance/landing is complete.

The platform program-board row requires an update outside this Assignment's write scope; coordinator must update `plans/261017-1313-fgos-platform-program-board/plan.md`. No new feature proposal was implemented.

Status: DONE_WITH_CONCERNS
Summary: Applied the authorized custody review fixes and added real boundary/failure vectors; Rust, clippy and focused custody/Assignment checks pass. H2 remains an owner decision and host-only/full-suite acceptance remains outstanding.
Concerns/Blockers: Windows/macOS/pidns acceptance, M3 in COOK phase 02, remaining early Git reads, coordinator merge/board update.
Context refs:
- (none)
