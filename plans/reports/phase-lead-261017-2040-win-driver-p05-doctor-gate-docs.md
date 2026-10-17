# Phase 05 report: doctor, fgctl gate, docs, CHANGELOG

Status: DONE_WITH_CONCERNS. Branch `win-driver/p05-doctor-gate-docs`, merged into `win-driver/integration`.

## Done
- Doctor (`src/setup/holder-lock-checks.mjs`):
  - `unsupported` guarantee now fails by name (`guaranteeRefusal`, exported, unit-tested); the warn branch is gone.
  - `checkLockBorrowVectors`: win32 early return and the `platform` option deleted.
  - `windows-job` records judged by the host via `lock-fd --predecessor-state` (`windowsJobProblem`); `empty`/`absent` no problem, else warning with domain + reason. `linux-gate`/`macos-tree` keep Node `judge()`.
  - Windows two-process probe: `twoProcessProbe` goes through the hold transport (`lock-hold` helper + path `--probe`) when `lockTransport() === 'hold'`. The POSIX probe (fd 3 + `sleep`) cannot run on Windows, so the check needed this.
- Route `lock-fd --predecessor-state <lockFile>` (`route.rs`): one `is_empty()` reading, never kills, always exit 0, result `predecessor` with `state`, `domain`, `reason`. Contract `internal-route.lock-fd.v1.json` documents `reason`, `detail`, bounded `raw`.
- fgctl gate (`init.rs`): `HolderLockGate::Unsupported`, the early return and the `eprintln!` deleted; no driver -> `LockKernelSemanticsFailed("no holder-lock driver on <os>")`. `holder_lock_gate` takes `&HelperExe` (production passes `HelperExe::current()` in `publish_and_tail`).
- Full-suite queue: Windows "unqueued" branch and its test deleted.
- Docs: `docs/platform/holder-lock/spec.md` (driver row, new §8.1, routes, doctor, limits, decision history), `docs/specs/distribution.md`, `docs/specs/reading-map.md`, `docs/architect/.../runtime-identity-and-activation.md`, `docs/platform/event-store/spec.md`; CHANGELOG `[Unreleased]` entry plus rewording of 5 older "until the Windows driver" lines.
- Root `Cargo.lock` gained `windows-sys` for `fgos` (stale from an earlier phase).

## Remaining-branch verdicts (grep list)
- `adapters.mjs:127` and `driver.mjs:63,81,235`: kept; generic `lock-driver-unavailable` handling.
- `driver.mjs:31,47` (`win32` -> hold transport, no group sweep): correct, part of the driver.
- `hold-transport.mjs`, `index.mjs:10`, `driver.mjs:27` comments: describe the real design.
- `bin/fgos.mjs` `npm.cmd`/shell, `run-tests.mjs`, `run-rust-dev-host.mjs`, `test-select-coverage-map.mjs`, `bin-discovery.mjs`, `project-launcher.mjs`, `git-hooks.mjs`, `events.mjs`: unrelated Windows portability, untouched.
- `route.rs:316` lock-hold off Windows `unavailable`: intended.
- `fetch.rs`/`lock.rs`/`store.rs` `lock-driver-unavailable`: generic error variants, kept.
- Done criterion 6 `rg` pattern: empty in src, packages, scripts, apps, docs, CHANGELOG.

## Evidence
- Linux, phase and integration worktrees: `cargo test --no-fail-fast -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl`: 212 passed, 0 failed (incl. `holder_lock_gate` 2/2, `internal_lock_routes` 13/13 with new `predecessor_state_reads_the_record_once_and_never_kills`).
- Node on integration (`env -u CLAUDE_CODE_SESSION_ID`, host built from the branch): `test/holder-lock/*.test.mjs`, `test/setup/{holder-lock-checks,registrations,checks}.test.mjs`, `test/scripts/full-suite-queue.test.mjs`: 302 tests, 286 pass, 16 skipped (win32-only or flock/tmpfs), 0 fail.
- Cross target: `cargo check --target x86_64-pc-windows-msvc` and `aarch64-apple-darwin` for fgos-process, fgos-holder-lock, fgos-distribution, fgos, fgctl with `--tests`: green.
- CI: run 39037570466 on `024d7ce48` (`holder-lock-cross-platform`): crates windows-latest success, crates macos-latest success, stress artifact skipped (manual). It includes `windows_holder_lock_gate.rs` and `windows-doctor.test.mjs`. The follow-up commit `88a702f6f` (docs + raw truncation to 120 chars) was not re-run on CI; windows-msvc check is green.
- Review: Sonnet code-reviewer, 3 stale doc claims + route JSON beyond contract; all fixed in `88a702f6f`.
- GitNexus impact: not run through MCP (index stale); callers checked by grep: `holder_lock_gate` (only `publish_and_tail` + tests), `checkLockBorrowVectors` (only `registrations.mjs`, passes cwd only), `predecessorProblem` (only `checkLockHolders`). Blast radius small, no HIGH/CRITICAL found.

## Decisions
- `holder_lock_gate` got a `helper` parameter (plan test needs `HelperExe(CARGO_BIN_EXE_fgctl)`; a libtest binary knows no roles).
- Route reports `reason` beyond the contract's earlier shape; `no-judge-on-this-platform` for a record the platform has no judge for.
- `guaranteeRefusal` extracted so the `unsupported` -> fail path is tested on Linux without a stub host.

## Concerns
- Skipped (per phase file): Windows `judge` branch for the hot `state` lock. Wave S (`src/state/hot-lock.mjs`) is not on main or integration yet. Follow-up: give Node `judge` a Windows branch from `fgos-process` creation time, test killed holder inside `withStateTx` on Windows CI.
- Flaky pre-existing `packages/holder-lock/rust/tests/stress.rs` (`eight_processes_with_sigkills...`): 1 mutual-exclusion violation in ~2 of 6 early runs on this branch, then 0/12; baseline integration 0/8. Code under test untouched by this phase. Worth a look by whoever owns port.rs.
- `windows-doctor.test.mjs` passed on windows-latest in CI, but `lock-holders` with a live Windows `windows-job` predecessor is covered only by Linux (unknown path) and the Rust route; no Windows CI test kills a holder mid-borrow through doctor.

## Unresolved questions
- Re-run Windows CI on `88a702f6f`/integration head in P06? Probably yes.
