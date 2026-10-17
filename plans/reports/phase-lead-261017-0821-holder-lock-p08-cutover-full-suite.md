# Phase lead report: holder-lock, full-suite queue cutover

Status: DONE_WITH_CONCERNS. Branch `holder-lock/p08-cutover-full-suite` (commits `eda3bd990`, `27a6dd74b`), merged into `holder-lock/integration` as `219571ac9` (`--no-ff`).

## What changed

- `scripts/lib/full-suite-queue.mjs`: `acquireFullSuiteQueue` now takes the `full-suite` kernel lock (lease, machine scope, rank 80) at `<state root>/locks/full-suite.lock` through the holder-lock facade (`acquireSync` one `--try` each `POLL_MS` = 2 s, unbounded). The wait message names the holder from `lockHolders()`: `pid N`, or `holder not listable: <reason>` where the kernel cannot list holders. `FGOS_FULL_SUITE_QUEUE=off` and `FGOS_FULL_SUITE_QUEUE_HELD` keep their behaviour. The description is close-on-exec, so suite children never hold it.
- Removed v1: `DEFAULT_LOCK_PATH`, the `isPidAlive` export, `readHolder`, the `open('wx')`/`unlinkSync` loop and stale reclaim. No tombstone at `/tmp/fgos-full-suite.lock`, as the plan's fence table says.
- No host binary (no `FGOS_HOST_BIN`, no activation above the checkout) → `HolderLockError` `lock-driver-unavailable`, message extended with `set FGOS_FULL_SUITE_QUEUE=off to run without queuing`.
- New export `POLL_MS` (tests use it). New option `lockRoot` (default: `resolveLockRoot({ env })`); tests always pass their own, because the running suite holds the machine queue itself.
- `test/scripts/run-tests.test.mjs`: the mirrored repo symlinks `src/` and `packages/` so the copied lib loads the real facade and registry. No binary is needed there: the empty-test-dir run returns before it queues.

## Evidence

- Host binary: phase-private `.fgos/runtime/tmp/cargo-p08` (hardlinked from the P06 build; the Rust tree is identical between P06's tip `9d9643c67` and this base: `git diff --stat 9d9643c67 HEAD -- apps packages crates Cargo.lock` empty). Worktree `target` symlink points at it.
- Narrow (`env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p08 debug fgos> node --test test/scripts/full-suite-queue.test.mjs test/scripts/run-tests.test.mjs`): 41/41 on the phase branch, 41/41 on integration after the merge.
- New multi-process cases (real processes, real route): a free queue is held (probe `held`) and freed on release; a second run waits, announces the holder pid once over 2+ polls, the holder SIGKILLed lets it in within the bound, while the holder's own child is still alive (so the child never held the lock); off/held never take the lock while another process holds it; no host → `lock-driver-unavailable` with the off hint.
- Full `npm test` (same env, through the new queue): 7911 tests, 7820 pass, 2 fail, 1 cancelled, 13 skipped. Failures: `fences-stop-check.test.mjs` two cases, where the scan found other fgOS processes running at the same time (another worktree's suite, `forgentX-phase00-...`, plus fixture processes of this suite); cancelled: `rust-host/fgctl-upgrade.test.mjs`, which ran 294 s under load. Run alone, both files pass 25/25. Load/concurrency effects, not this change. The npm process exited 143. S1 live probe not seen.
- `rg 'fgos-full-suite.lock|DEFAULT_LOCK_PATH|full-suite-queue' src scripts test docs bin` shows only the lib, its caller and its tests.
- Impact: GitNexus `impact(acquireFullSuiteQueue, upstream)` LOW, 0 callers. The index is stale and misses the value pass. grep finds the one caller, `scripts/run-tests.mjs:436`. The removed exports have no users.
- Review: one Sonnet code-reviewer pass found all criteria met. Its main flake risk was a 1 s timing slack. I widened the kill → acquire bound to `2 * POLL_MS` and made the announce-once count match the holder pid (`27a6dd74b`).

## Decisions

- The kill → acquire bound in the test is `2 * POLL_MS` instead of a strict 2 s. The `--try` loop's worst case is one poll plus a helper spawn, and a loaded suite needs the headroom.
- The P06 host build is reused through hardlinks instead of rebuilding, because the Rust tree is identical and RAM is short.
- A `lockRoot` option is exposed for tests, so they never touch the machine queue the running suite holds. It is a real parameter of the lock path, not a skip switch.
- An exit-path `release()` is left unwrapped: a plain lease has no borrow, so `release` only closes a valid fd.

## Concerns / handoff

- **Old branches now queue separately.** The CHANGELOG line in the phase file says so. In this run another worktree's old-queue suite overlapped this one, and that is what made `fences-stop-check` fail: it scans the whole machine for fgOS processes, so any concurrent fgOS process blocks it. P12 should run the final suite with no other suite running.
- **For P11:**
  - CHANGELOG `:399` still describes the reclaim of the v1 queue. Replace it with the phase line, and note that a run from a checkout needs a host binary or `FGOS_FULL_SUITE_QUEUE=off`.
  - The doctor check for the host-binary dependency belongs to the general holder-lock checks.
- `run-tests` prints "failed to ensure host binary: spawnSync cargo ENOENT" when cargo is not on PATH. This was already the case and is outside this change.

## Unresolved questions

None.
