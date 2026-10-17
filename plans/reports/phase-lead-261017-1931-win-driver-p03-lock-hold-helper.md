# Phase 03: lock-hold helper and the Node hold transport

Status: DONE_WITH_CONCERNS. Integration head: see done file (merge `2c7f0249b` + this report).

## Built
- `packages/holder-lock/rust/src/route/hold.rs` (new child module of `route.rs`): helper loop. Parent opened through Toolhelp + `OpenProcess(SYNCHRONIZE|QUERY_LIMITED)`, creation-time check against pid reuse, own std handles made non-inheritable, `port::acquire`, `ready.json` (tmp + rename, `helperPid`), 5 ms tick: request pickup in number order (answered `{error:"borrow-unsupported"}`), parent signaled -> `port::release` (unlock, close), exit 0. Exit codes 10/11/12/70 per contract. Loop is generic over a "parent gone" wait, so it is unit-tested on Linux; the Windows part is only the handle wait.
- `route.rs`: `lock-hold` route (non-Windows: `unavailable/unsupported-platform`), `lock-fd --probe <path>` (fresh open, `port::probe`, `free`/`held`).
- `src/holder-lock/driver.mjs`: `lockTransport()` (`hold` on win32, else `fd`), `routeLineOrThrow` shared by both transports.
- `src/holder-lock/hold-transport.mjs` (new): `startHold`, `waitReadySync`/`waitReady`, `terminateSync`/`releaseHold`, `sweepStaleWorkDirs`.
- `src/holder-lock/index.mjs`: `acquireSync`, `acquire` (try-per-poll, `attemptFd`/`attemptHold`), `release`, `probe` branch on `lockTransport()`; `LockHandle` takes `claim` (`{fd}`|`{hold}`); `runBorrowed` on a hold handle throws `borrow-unsupported` (P04). No new `process.platform` in `index.mjs`.
- `docs/architecture-manifest.json`: row for `hold-transport.mjs` (`infra`), required by `test/architecture.test.mjs`.

## Decisions (plan left open)
- New files beyond the ownership table: `route/hold.rs`, `hold-transport.mjs` (real boundaries; keeps P04's route/facade edits apart). Also one added row in `docs/architecture-manifest.json`.
- Stale work-dir sweep deletes a dir only when older than 1 h **and** its owner pid (in the name) is dead; a lock held >1 h keeps its dir (a plain age rule would delete a live lock's dir).
- Release/ready polling trust libuv's reaped state (`exitCode`/`signalCode`) before `process.kill(pid,0)`, since pid reuse is possible after libuv frees the handle (review finding).
- `lock-fd --probe` is also available on POSIX (shared code); the Node facade uses it on the `hold` transport only.
- Usage errors in `lock-hold` print on stdout, not in `ready.json` (facade passes valid args; not reachable today).

## Evidence
- Windows CI run **39033067154** (head `b2fd10c0f`): windows-latest success, macos-latest success. Includes `cargo test -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl`, `apps/fgos/tests/windows_lock_hold_route.rs` (3 tests: parent terminated frees lock <100 ms, held/timeout exit codes, request refusal + probe), and `node --test test/holder-lock/windows-*.test.mjs`: 8 tests, 8 pass, 0 skipped (libuv-job path, release <50 ms + immediate reacquire, bounded wait with no leftover helper/work dir, idle holder exits, probe, Rust holder vs Node exclusion, latency).
- First CI run 39032876537 failed on my bug (closure captured the raw parent handle, `Owned` dropped, handle closed); fixed in `b2fd10c0f`.
- Latency, 50 cold acquire+release pairs on windows-latest: p50 31.7 ms, p95 32.1 ms, max 45.3 ms.
- Linux, on the integration worktree after merge, `FGOS_HOST_BIN` = phase-private build, `env -u CLAUDE_CODE_SESSION_ID ...`: `node --test test/holder-lock/*.test.mjs test/setup/holder-lock-checks.test.mjs test/architecture.test.mjs` 141 tests, 132 pass, 0 fail, 9 skipped (Windows-only or platform vectors); `cargo test -p fgos --test internal_lock_routes` 12/12 (incl. new `--probe` and `lock-hold` usage tests); `cargo test -p fgos-holder-lock -p fgos-process` all green on the phase branch (holder-lock lib 6 incl. 4 new hold-loop tests).
- `cargo check --target x86_64-pc-windows-msvc` clean for `fgos-holder-lock` and `fgos` (`--tests`).
- Not run: full `npm test` (shared contract unchanged on POSIX; left to the integration gate).
- Acceptance check "test 1 within 100 ms": the Node test asserts <300 ms because the measured time includes starting the new helper (CI run: 302 ms for the whole test); the 100 ms bound is asserted precisely in the Rust parent-handle test.

## Impact (GitNexus)
Index stale and `LockHandle`/`acquire*` symbols edited without an impact run available for this fresh index; cross-checked by grep: `new LockHandle` is only in `index.mjs`; `acquireSync`/`acquire`/`probe` signatures and results unchanged. No HIGH/CRITICAL finding raised by review.

## Review (Sonnet code-reviewer, one round)
Fixed: pid reuse false `lock-release-stuck`; work-dir leak on error answers. Open, accepted: (a) helper does not watch its parent while still waiting in `--wait-ms` (libuv job kills it for Node parents; a non-Node parent that dies mid-wait could make the helper briefly take and drop the lock); (b) usage error not reported via `ready.json`.

## Unresolved
- (a) above: decide in P04/P06 whether to poll the parent inside `port::acquire` waits.
