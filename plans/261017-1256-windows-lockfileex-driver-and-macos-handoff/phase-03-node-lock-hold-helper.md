# Phase 03: `fgos internal lock-hold` and the Node facade on Windows

- **Wave:** 2.
- **Branch:** `win-driver/p03-lock-hold`, worktree `.claude/worktrees/wd-p03`.
- **Depends on:** P01 (in-process driver).
- P02 is merged before this wave starts (merge order), so `admit` already judges `windows-job` records.

## Read first
- plan.md D7, D8.
- r6 §6.0 (the Windows row: one lock-holding process per lock, waiting on the parent handle and stdin) and §6.3 (the facade, B8 timeouts).
- The contract `internal-route.lock-hold.v1.json` (P00).
- [`route.rs`](../../packages/holder-lock/rust/src/route.rs) (`lock_fd`, `emit`, exit codes).
- [`src/holder-lock/index.mjs`](../../src/holder-lock/index.mjs): `acquireSync` `:207`, `acquire` `:241`, `probe` `:299`, `LockHandle` `:61`, release.
- [`driver.mjs`](../../src/holder-lock/driver.mjs): `runLockRouteSync`, `assertDriverUsable`, `guaranteeFor`.

## Requirements

**Route `fgos internal lock-hold`** (`route.rs`, new verb) — follow the contract:

1. **Parent handle first:** the parent pid comes from Toolhelp (`th32ParentProcessID` of self). `OpenProcess(SYNCHRONIZE)` it at start. If that fails, emit `unavailable` (`parent-unopenable`) and exit. The parent is blocked waiting for the ready file, so the pid cannot be reused yet.
2. **Acquire in-process:** `port::acquire(resource, mode, wait, kill_wait)`.
3. **Ready file:** write the result JSON to `<ready>.tmp`, then rename it to `<ready>`. `acquired` adds `helperPid`.
4. **Not acquired:** exit right after writing (same exit codes as `lock-fd`).
5. **Acquired:** one thread reads stdin lines (P04 adds `op: borrow`; an unknown `op` writes an error to `resultFile`). The main thread waits on `[parent handle, stdin-closed event]`.
   - On either: release rule step 0. There is no domain open unless a borrow is in flight; P04 makes a borrow in flight finish its own release rule first, bounded by kill wait.
   - Then `release(handle)` (unlock + close), then exit 0.
6. No `--protocol` mismatch handling beyond `lock-fd`'s: the same `host-version-mismatch` rule.

**Route `lock-fd --probe <path>`**: open the path fresh, run `port::probe`, emit `free` or `held`. Used by Node on Windows. POSIX keeps `--shared-try` with an fd.

**Node facade (Windows branch)** — `process.platform === 'win32'` is allowed **only** inside `driver.mjs`. `index.mjs` asks `driver.lockTransport()`, which returns `'fd'` or `'hold'`, so the facade does not branch on the OS (r6 §6.0, 4.2 P03 rule).

- **`acquireSync`, transport `hold`:**
  - `spawn(bin, ['internal','lock-hold', ...], { stdio: ['pipe','ignore','pipe'], windowsHide: true })`;
  - the ready path is `path.join(os.tmpdir(), 'fgos-lock-hold-<pid>-<seq>-<rand>.json')`;
  - poll `fs.existsSync(ready)` with `Atomics.wait(int32, 0, 0, 2)`, bounded by `wait + killWait + ROUTE_SLACK_MS`;
  - read the ready file, then delete it;
  - past the bound: `child.kill()` (`TerminateProcess`), delete the ready file if present, result `timeout`. B8 holds: a killed helper holds nothing.
  - `acquired` → `LockHandle` whose private entry is `{ kind: 'hold', child, pid }`;
  - every other result → `settleNotAcquired` as today.
- **`acquire` (async):** the same spawn; poll the ready file with `setTimeout(pollMs)`; the same bounds. Keep the existing `--try`-per-poll loop semantics for `waitMs` (each `held` → retry until `waitMs`) by spawning a helper per try with `--try`. A `--wait-ms` helper is allowed when that is simpler; the executor picks one and records why.
- **`release`, transport `hold`:**
  - `child.stdin.end()` (sync close of the pipe fd);
  - poll `process.kill(pid, 0)` with `Atomics.wait(…, 1)` until it throws `ESRCH`, bounded by `killWaitMs + ROUTE_SLACK_MS`;
  - past the bound: `child.kill()`, then poll again for up to 1 s;
  - still alive → throw `lock-release-stuck` (new named error, contract P00 — add it there if missing; P03 may append to `holder-lock.port.v1.json` errors only).
- **`probe`, transport `hold`:** `runLockRouteSync({ args: ['--probe', path] })` with no fd.
- **`assertDriverUsable`:** on `win32` it now gets `lockfileex`/`kernel` from `--guarantee` and passes. Delete the `unsupported-platform` path only when no driver reports it any more. FreeBSD and others still do, so keep the branch: it reads the guarantee, not the OS.
- **`lockHolders`:** `unlistable` on win32 (already true off Linux).

## Owned files

| Action | File |
|---|---|
| edit | `packages/holder-lock/rust/src/route.rs` (`lock-hold` verb, `--probe`) |
| edit | `src/holder-lock/driver.mjs`, `src/holder-lock/index.mjs` |
| create | `test/holder-lock/windows-facade.test.mjs` (skips with a named reason when `process.platform !== 'win32'`) |
| create | `packages/holder-lock/rust/tests/lock_hold_route.rs` (`cfg(windows)`: the route as a black box) |
| edit | `test/test-ownership.mjs` only if the new Node test needs a row |

## Tests

**Windows** (CI `windows-latest`, `FGOS_HOST_BIN` = the debug `fgos.exe`):
1. `acquireSync` `runner` → `acquired`. A second Node process → `held`. The first process exits without `release` (`process.exit`) → the helper sees the parent die → the second process acquires within 100 ms.
2. `release` then an immediate `acquireSync` in the same process → `acquired` (not `held`).
3. `acquireSync` with `waitMs: 300` while another process holds → `timeout` at ≥ 300 ms and < 300 + killWait + slack. No `fgos.exe lock-hold` process is left (Toolhelp listing through `tasklist /FI`).
4. The Node process is killed with `TerminateProcess` while holding → the lock is free within 100 ms.
5. `probe` → `held` / `free`.
6. Rust and Node exclude each other: a Rust test binary holds `activation` in-process, and Node `acquireSync` → `held`.
7. Latency: 50 cold acquire+release pairs; report p50/p95 in the phase report. There is no hard threshold; r6 expects around 3–10 ms.

**Linux:** the full `test/holder-lock/*.test.mjs` is unchanged and green (the `fd` transport). `npm test` subset: `node --test test/holder-lock test/setup/holder-lock-checks.test.mjs`.

**Windows proof:** ask `forgentx-95` to push the branch; record the run id.

## Acceptance
- Windows tests 1–6 are green; the p50/p95 from test 7 are reported.
- Linux holder-lock tests are green.
- `rg "process.platform" src/holder-lock/index.mjs` is empty.

## Risk / rollback
- **`Atomics.wait` on the main thread:** allowed in Node, but it blocks the loop for the cold-path wait, as `spawnSync` did before. The same bound applies.
- **The temp ready file is left behind when Node is killed mid-acquire:** one small file in `%TEMP%`. Delete files with the `fgos-lock-hold-` prefix older than 1 h at the next acquire (cheap glob, bounded to 50 entries).
- **Rollback:** revert. The Windows facade goes back to `lock-driver-unavailable`.
