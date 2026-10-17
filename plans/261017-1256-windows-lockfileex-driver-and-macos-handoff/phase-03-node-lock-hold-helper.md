# Phase 03: `fgos internal lock-hold` and the Node facade on Windows

- **Wave:** 2.
- **Branch:** `win-driver/p03-lock-hold`, worktree `.claude/worktrees/wd-p03`.
- **Depends on:** P01. P02 is merged first by merge order, so `admit` judges `windows-job` records.

## Read first
- plan.md D7, D8 and D9.
- Red-team findings 4, 8 and 18.6–18.7.
- r6 §6.0 (Windows row) and §6.3 (facade, B8).
- Contract `internal-route.lock-hold.v1.json` (P00).
- [`route.rs`](../../packages/holder-lock/rust/src/route.rs).
- [`index.mjs`](../../src/holder-lock/index.mjs): `LockHandle` `:61`, release `:85`, `acquireSync` `:207`, `acquire` `:241`, `probe` `:299`.
- [`driver.mjs`](../../src/holder-lock/driver.mjs).

## Requirements

**Route `fgos internal lock-hold`** (`route.rs`), as the contract says:
1. At start:
   - mark the helper's own std handles non-inheritable (`SetHandleInformation`), so nothing leaks into a later git child;
   - find the parent pid through Toolhelp and `OpenProcess(SYNCHRONIZE)` it. The parent is blocked waiting, so its pid cannot be reused. If this fails → `ready.json` = `unavailable` (`parent-unopenable`).
2. Run `port::acquire` in-process.
3. Write `ready.json` (tmp + rename). If not acquired, exit right away with the `lock-fd` exit codes.
4. Loop while acquired:
   - wait on the parent handle with a 5 ms timeout;
   - on each tick, pick up new `req-*.json` files in name order (P04 handles `borrow` and `cancel`; this phase answers any request with `result-<n>.json {error: "borrow-unsupported"}`);
   - when the parent is signaled: release rule step 0 (no domain exists in this phase), unlock, close, exit 0.

**Route `lock-fd --probe <path>`:** a fresh open plus `port::probe`, emitting `free` or `held`.

**Node facade, transport `hold`.** `driver.mjs` owns the platform choice: `lockTransport()` returns `'fd'` or `'hold'`. `index.mjs` uses no `process.platform` in acquire, release or probe; the borrow sweep is P04.
- **`acquireSync`:**
  - `mkdtempSync(os.tmpdir()/fgos-lock-hold-)` → `W`;
  - `spawn(bin, ['internal','lock-hold', …, '--work', W], { stdio: 'ignore', windowsHide: true })`, then `child.unref()`;
  - poll `W/ready.json` with `Atomics.wait(i32, 0, 0, 2)`, bounded by `wait + killWait + ROUTE_SLACK_MS`;
  - past the bound: `child.kill()` (TerminateProcess; B8: a dead helper holds nothing), wait for the exit as in release, `rm -r W`, result `timeout`;
  - `acquired` → `LockHandle` with private entry `{ kind: 'hold', child, pid, work: W }`;
  - every other result → `rm -r W`, then `settleNotAcquired`.
- **`acquire`** (async): the same, polling with `setTimeout(pollMs)`. Each `held` with `waitMs` left respawns a `--try` helper, keeping today's try-per-poll semantics.
- **`release`:**
  - `child.kill()`;
  - sync: poll `process.kill(pid, 0)` with `Atomics.wait(…, 1)` until `ESRCH`. Safe from pid reuse, because libuv keeps the unreaped child handle until the loop turns. Bound: 2 s, else throw `lock-release-stuck`;
  - async callers can also `await` the `'exit'` event;
  - then `rm -r W`.
  - `release` already refuses while a borrow runs (`index.mjs:85`), so the helper's domain is empty.
- **`probe`:** `runLockRouteSync({ args: ['--probe', path] })`, with no fd.
- **`assertDriverUsable`:** unchanged code. It reads the guarantee (`lockfileex`/`kernel` passes); an `unsupported` guarantee from another platform still throws.
- **Leftover work dirs** (Node killed mid-acquire): at each acquire, delete `fgos-lock-hold-*` dirs in tmp older than 1 h (at most 50 per call).

## Owned files

| Action | File |
|---|---|
| edit | `packages/holder-lock/rust/src/route.rs` (`lock-hold`, `--probe`) |
| edit | `src/holder-lock/driver.mjs`, `src/holder-lock/index.mjs` (acquire, release, probe) |
| create | `test/holder-lock/windows-facade.test.mjs` (skips with a named reason off win32), `apps/fgos/tests/windows_lock_hold_route.rs` |
| edit | `test/test-ownership.mjs` only if the new Node test needs a row |

## Tests

**Windows** (CI; `FGOS_HOST_BIN` = the debug `fgos.exe`):
1. `acquireSync('runner')` → `acquired`. A second Node process → `held`. The first process calls `process.exit()` without release; libuv's job kills the helper → the second process acquires within 100 ms. This tests the libuv path.
2. **Parent-handle path** (`apps/fgos/tests/windows_lock_hold_route.rs`): a Rust test parent, not a libuv job, spawns `fgos.exe internal lock-hold` and is terminated → the helper exits and the lock is free within 100 ms.
3. `release` then an immediate `acquireSync` in the same process → `acquired`, and `release` itself takes < 50 ms (it never waits out a bound).
4. `acquireSync` with `waitMs: 300` against a holder → `timeout` at ≥ 300 ms and < 300 + killWait + slack; no `fgos.exe` helper is left (`tasklist`); `W` is removed.
5. A Node script holds a lock and does nothing else → it exits by itself (the helper is unref'd); the lock is free afterwards.
6. `probe` → `held` / `free`.
7. A Rust in-process holder and Node exclude each other.
8. Latency: 50 cold acquire+release pairs; p50/p95 go in the report.

**Linux:** `test/holder-lock/*.test.mjs` and `test/setup/holder-lock-checks.test.mjs` are unchanged and green (`fd` transport).

**Windows proof:** ask `forgentx-95` to push the branch; record the run id.

## Acceptance
- Tests 1–7 are green on `windows-latest`, and 8 is reported.
- Linux is green.
- No `process.platform` in `index.mjs` outside the borrow sweep (P04 removes that too).

## Risk / rollback
- **`Atomics.wait` blocks the loop during a cold acquire:** the same as `spawnSync` today, with the same bound.
- **Rollback:** revert.
