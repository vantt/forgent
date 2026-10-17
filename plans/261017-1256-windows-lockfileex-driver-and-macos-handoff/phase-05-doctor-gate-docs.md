# Phase 05: doctor, `fgctl` gate, docs and CHANGELOG

- **Wave:** 4.
- **Branch:** `win-driver/p05-doctor-gate`, worktree `.claude/worktrees/wd-p05`.
- **Depends on:** P01–P04.

## Read first
- plan.md D10, D11, D13 and D14.
- [`src/setup/holder-lock-checks.mjs`](../../src/setup/holder-lock-checks.mjs):
  - `checkLockKernelSemantics` `:176`;
  - `checkLockBorrowVectors` `:234`;
  - `predecessorProblem` `:361`;
  - `checkLockHolders` `:390`.
- [`init.rs:1030-1088`](../../packages/distribution/rust/src/init.rs).
- [`docs/platform/holder-lock/spec.md`](../../docs/platform/holder-lock/spec.md).
- `CHANGELOG.md` lines 11, 14, 39 and 40: the Windows "unsupported" wording.

## Requirements

**Doctor (D10)**
- **`checkLockKernelSemantics`:** delete the `exclusion === 'unsupported'` warning. A guarantee of `unsupported` now **fails**, naming the platform. `kernel` plus a green two-process probe passes.
- **`checkLockBorrowVectors`:** delete the `win32` early return.
- **`predecessorProblem`:** change the `windows-job` line only. Run `fgos internal lock-fd --predecessor-state <lockFile>`:
  - `empty` or `absent` → no problem;
  - `not-empty` or `unknown` → a warning that names the domain and its reason (e.g. `predecessor-other-session`).
  - `linux-gate` and `macos-tree` records keep the Node `judge()` path unchanged.
- **Route `lock-fd --predecessor-state`** (`route.rs`): parse the record, take one `domain_watch(..).is_empty()` reading, never kill, emit per the contract.

**`fgctl` gate (D11)** (`init.rs`)
- Delete `HolderLockGate::Unsupported`, the `supported()` early return and the `eprintln!`.
- A driver with `supported() == false` → `Err(LockKernelSemanticsFailed("no holder-lock driver on <platform>"))`.
- Pass `HelperExe::current()` to `semantics::two_process_probe` and `borrow_vectors::run`. P01 and P04 changed those signatures, so check every caller compiles.
- Update the tests that match `Unsupported` (`rg HolderLockGate packages/distribution`).

**Remaining branches**
```
rg -n "win32|unsupported on Windows|no holder-lock driver|not applicable on Windows|lock-driver-unavailable" src scripts packages/holder-lock packages/distribution bin
```
- Delete the full-suite queue's Windows "unqueued" branch (CHANGELOG line 40).
- Keep `adapters.mjs:127`: it handles `lock-driver-unavailable` generically.
- For every other hit, give a one-line verdict in the report.

**Docs**
- `docs/platform/holder-lock/spec.md` covers:
  - the Windows driver row and the guarantee (D1);
  - the borrow mechanism (D2);
  - the two domain views and the record shape (D4, D5), linking the probe report and the red-team;
  - the keeper (D6);
  - the `lock-hold` route (D7);
  - the helper roles (D9);
  - the Windows vector assertion;
  - macOS unchanged (D13);
  - attested fences on Windows (D14).
- Add a "decision history" row citing this plan.
- `docs/specs/reading-map.md`: list `internal-route.lock-hold.v1.json` if the map lists contracts.

**CHANGELOG `[Unreleased]`**
- Windows now has a holder-lock driver: gateway, sessions, runner, dispatch, advance, recovery, the provider locks, `fgctl` activation and observe work there.
- Doctor reports `lockfileex`/`kernel`. The borrow vectors and the activation gate run on Windows.
- A crash during a borrowed git commit costs about 120–170 ms at the next acquire.
- Reword the older lines that promise "until the Windows driver".

**Hot records of `state` and `porting-events` on Windows** (added 2026-10-17 18:50 by the 4.3 lane; plan 4.3 re-cut block):
- Plan 4.3 wave S ships `src/state/hot-lock.mjs`, whose dead-holder reclaim uses `judge(tuple)` from `/proc`. On Windows the record has no `startTime`/`pidNs`, `judge` returns `unknown`, and the hot lock fails closed: a holder that crashed blocks `state` until `fgos lock fence state`.
- Give the Node `judge` a Windows branch that decides dead or alive for a hot record from this plan's process identity (`fgos-process` on Windows: creation time from the process handle), so a crashed holder is reclaimed under `<resource>.reclaim` exactly as on Linux. Unknown or unopenable stays `unknown` (fail closed, must-have 2 of the probe).
- Test on the Windows CI job: holder killed inside `withStateTx`, a second process reclaims within the 5 s wait; a live holder is never reclaimed.
- If wave S has not landed when this phase starts, skip this item and record it in the report; it then moves to a follow-up.

## Owned files

| Action | File |
|---|---|
| edit | `src/setup/holder-lock-checks.mjs`, `test/setup/holder-lock-checks.test.mjs` |
| edit | `packages/distribution/rust/src/init.rs` (gate only) |
| edit | `packages/holder-lock/rust/src/route.rs` (`--predecessor-state`) |
| edit | the full-suite queue script, if the grep finds a Windows branch |
| edit | `docs/platform/holder-lock/spec.md`, `docs/specs/reading-map.md` (if needed), `CHANGELOG.md` |
| create | `apps/fgctl/tests/windows_holder_lock_gate.rs`, `test/holder-lock/windows-doctor.test.mjs` |

## Tests

**Linux** (real routes):
- an `unsupported` guarantee → `passed: false`;
- a `windows-job` record on Linux → the route answers `unknown` → a warning;
- a `linux-gate` record with a dead gate → no problem.
- `cargo test -p fgos-distribution holder_lock_gate` → `Passed`.

**Windows** (CI):
- `apps/fgctl/tests/windows_holder_lock_gate.rs`: `holder_lock_gate(tmp, tmp/locks, "git")` with `HelperExe(env!("CARGO_BIN_EXE_fgctl"))` → `Passed`.
- `test/holder-lock/windows-doctor.test.mjs`: the three checks against a temp workspace → all `passed: true`, and the message shows `lockfileex`.
- Ask `forgentx-95` to push; record the run id.

## Acceptance
- The tests above are green on Linux and on `windows-latest`.
- plan.md done criterion 6 holds.
- The CHANGELOG entry is present.

## Risk / rollback
- A platform with no driver now fails doctor and activation. That is intended: no shipped target lacks a driver.
- Rollback: revert.
