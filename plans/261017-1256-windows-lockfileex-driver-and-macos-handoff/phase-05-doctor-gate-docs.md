# Phase 05: doctor, `fgctl` gate, docs and CHANGELOG

- **Wave:** 4.
- **Branch:** `win-driver/p05-doctor-gate`, worktree `.claude/worktrees/wd-p05`.
- **Depends on:** P01–P04.

## Read first
- plan.md D10, D11, D13, D14.
- [`src/setup/holder-lock-checks.mjs`](../../src/setup/holder-lock-checks.mjs): `checkLockKernelSemantics` `:176`, `checkLockBorrowVectors` `:234`, `predecessorProblem` `:361`, `checkLockHolders` `:390`.
- [`init.rs:1030-1088`](../../packages/distribution/rust/src/init.rs): `HolderLockGate`, `holder_lock_gate`, `publish_and_tail`.
- [`docs/platform/holder-lock/spec.md`](../../docs/platform/holder-lock/spec.md).
- `CHANGELOG.md` lines 11, 14, 39 and 40: the Windows "unsupported" wording.

## Requirements

**Doctor (D10):**
- **`checkLockKernelSemantics`:** delete the `exclusion === 'unsupported'` warning branch. The guarantee is read as before. `kernel` plus a green two-process probe passes on every OS; the shape string shows `lockfileex`. A guarantee still reporting `unsupported` (a platform with no driver) becomes a **failure** that names the platform: no shipped target reports it any more.
- **`checkLockBorrowVectors`:** delete the `win32` early return. Windows runs `fgos internal lock-borrow-vectors` like the other platforms.
- **`predecessorProblem`:** replace the `windows-job` "cannot be judged" line. For every record, call `fgos internal lock-fd --predecessor-state <lockFile>` (one spawn per record file; records are few). `empty` and `absent` → no problem; `not-empty` → the existing warning text; `unknown` → a warning naming the record. The Node-side `judge()` for `linux-gate` goes away: one judge, in Rust.
- **Route `lock-fd --predecessor-state`** (`route.rs`): read and parse the record, `domain_watch(...).is_empty()` **once**, never kill. Emit per the contract.

**`fgctl` gate (D11)** in `init.rs`:
- Delete `HolderLockGate::Unsupported`, the `supported()` early return and the `eprintln!` in `publish_and_tail`.
- When the driver reports `supported() == false` (a future platform), `holder_lock_gate` returns `Err(LockKernelSemanticsFailed("no holder-lock driver on <platform>"))`. Activation refuses; there is no silent pass.
- Update `init.rs` tests that match `Unsupported` (`rg HolderLockGate packages/distribution`).

**Remaining Windows branches** (grep, then fix or justify each):
```
rg -n "win32|unsupported on Windows|no holder-lock driver|not applicable on Windows|lock-driver-unavailable" src scripts packages/holder-lock packages/distribution bin
```
- The full-suite queue (`scripts/run-tests.mjs` or wherever CHANGELOG line 40's "On Windows ... runs unqueued" lives): delete the Windows unqueued branch.
- `src/runner/dispatch/adapters.mjs:127`: keep it. It handles `lock-driver-unavailable` generically, not Windows.
- Every other hit gets a one-line verdict in the phase report.

**Docs:**
- `docs/platform/holder-lock/spec.md`:
  - the Windows driver row and the guarantee;
  - the borrow mechanism (job, keeper, env, four-part check);
  - the amended empty rule (union, fail-closed, fallback) with links to the probe report;
  - the `lock-hold` route;
  - the helper roles;
  - the Windows vector assertion;
  - macOS unchanged (D13);
  - Windows `scan` unsupported → attested fences (D14).
- Add one row to its "decision history" section citing this plan, D1–D15.
- `docs/specs/reading-map.md`: add the new contract file `internal-route.lock-hold.v1.json` if the map lists contracts.

**CHANGELOG** `[Unreleased]`: one entry.
- Windows now has a holder-lock driver, so the gateway, sessions, runner, dispatch, advance, recovery, provider locks, `fgctl` activation and observe work there.
- Doctor reports `lockfileex`/`kernel`; the borrow vectors and the activation gate run on Windows.
- A crash during a borrowed git commit costs about 120–170 ms at the next acquire.
- Reword the older lines that promise "until the Windows driver" so they no longer contradict.

## Owned files

| Action | File |
|---|---|
| edit | `src/setup/holder-lock-checks.mjs`, `test/setup/holder-lock-checks.test.mjs` |
| edit | `packages/distribution/rust/src/init.rs` (gate only) |
| edit | `packages/holder-lock/rust/src/route.rs` (`--predecessor-state`) |
| edit | the full-suite queue script, if the grep finds a Windows branch |
| edit | `docs/platform/holder-lock/spec.md`, `docs/specs/reading-map.md` (if needed), `CHANGELOG.md` |

## Tests
- `test/setup/holder-lock-checks.test.mjs`:
  - a guarantee of `unsupported` → `passed: false`;
  - a `windows-job` record on Linux → the route answers `unknown` (`domain_watch` on Linux gives `Unknown`) → a warning naming the record;
  - a `linux-gate` record with a dead gate → no problem.
  - These run on Linux with real routes.
- `cargo test -p fgos-distribution holder_lock_gate` (Linux: `Passed`).
- Windows CI: add `test/holder-lock/windows-doctor.test.mjs` running `checkLockKernelSemantics`, `checkLockBorrowVectors` and `checkLockHolders` against a temp workspace with `FGOS_HOST_BIN` → all `passed: true`, message shows `lockfileex`. Add a cargo test on Windows: `holder_lock_gate(tmp, tmp/locks, "git")` → `Passed`.
- **Windows proof:** push request to `forgentx-95`; record the run id.

## Acceptance
- The tests above are green on Linux and `windows-latest`.
- The grep in plan done criterion 6 is empty.
- The CHANGELOG entry is present.

## Risk / rollback
- **Doctor fails on any platform with no driver:** intended (no shipped target lacks one).
- **Rollback:** revert this phase alone. Doctor goes back to warning on Windows, which is harmless.
