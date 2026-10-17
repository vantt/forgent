# Phase lead report: holder-lock P03 — Node facade `LockScope`

- Plan: `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`, phase file `phase-03-node-facade-lockscope.md`
- Branch `holder-lock/p03-node-facade` (worktree `.claude/worktrees/hl-p03`); merged into `holder-lock/integration` as `dd64cca47` (`--no-ff`).
- Starting point: `84b1776a5` (facade written against the expected P02 binary, never executed — see `implementation-261016-1308-holder-lock-p03-node-facade.md`, which this report supersedes). First step: merged `holder-lock/integration` (`42b464788`, P02) into the phase branch, built `cargo build -p fgos` into a phase-private target dir (`.fgos/runtime/tmp/cargo-p03`), ran every phase test against that real binary.
- Impact analysis: GitNexus index stale (`b334695`), `workerBaseEnv`/facade symbols not found → grep. `workerBaseEnv` has 3 production callers (`src/runner/dispatch/transport.mjs:553`, `:880`, `src/runner/dispatch/confinement/authority.mjs:1412`), i.e. every worker spawn: **MEDIUM**. Facade modules: no production caller until P06–P10. No HIGH/CRITICAL.

## What changed in this round (on top of `84b1776a5`)

| Commit | Change |
|---|---|
| `b281a83e1` | merge integration (P02 crate + routes) into the phase branch |
| `3c490a74e` | `checkBorrowedDescription` tells the route `FGOS_LOCK_FD=<name>:3` (the route checks the env names its own slot 3; the caller's slot number was passed before → every sibling check answered `fd-missing`); `lock-predecessor-domain-not-empty` error carries `killWaitMs`; 6 rows `infra` in `docs/architecture-manifest.json` (`test/architecture.test.mjs` "đủ sổ" was red); 2 test bugs fixed (`node -e` argv is `slice(1)`; pid-1 test assumed the route waits out the bound — P02 answers a refused kill at once, so only the upper bound + `killWaitMs` reaching the route are asserted) |
| `9e9deb974` | review fixes: H1, H2, M1, M2 below + tests |

## Review (code-reviewer, Sonnet) and what was done

| # | Finding | Action |
|---|---|---|
| H1 | `workerBaseEnv` throws `lock-driver-unavailable` when no pin and no host with the route (reproduced) → every dispatch spawn would fail on a stale activation via `node bin/fgos.mjs` | Fixed: on `lock-driver-unavailable` the worker gets no pin (the inherited `FGOS_STATE_ROOT` is still dropped). Reason: that worker cannot take a kernel lock either (same host, facade fails by name), so no lock can land in another root. Test in `driver-unavailable.test.mjs` |
| H1b | "honour `baseEnv`" | **Rejected**: r6 §6.9 pins the *parent process's* root, not what the caller's env carries; the existing `herdr-spawn-adapter` test asserts exactly that |
| H2 | leftover sweep in `runBorrowed` killed any process with the lock file open (waiting contender, probe, its helper) | Fixed like the Rust side (`fgos-process` `holds_lock_on`): a pid counts only if its fdinfo has a `lock:` line for the inode (the kernel lists a lock only under descriptors of the owning description). New bystander assertion; **negative control**: with the old driver the test fails (`exactly the hook's background process was killed`), with the new one it passes |
| M1 | async `acquire` checked rank before the first `await` but tracked after → two concurrent acquires on one scope bypassed A3 | Fixed: `LockScope.reserve()` holds the rank across the await, dropped in `finally`. Test: `Promise.allSettled` of main-checkout(50)+gateway(10) → gateway `lock-order-violation`, no reservation left |
| M2 | `probe()` could return `timeout` when its helper was killed | Fixed: throws `lock-route-error` |
| M3 | async `acquire` had no real-route test | Added: held at once, polls to `timeout` (200 ms bound), acquires after the holder releases |
| M4 | tests skip when no host binary is found | Kept: `scripts/run-tests.mjs` `ensureHostBin` builds one for `npm test`; an activated pre-P02 binary makes them fail loudly (`host-version-mismatch`), not skip |
| Low | `release()` when `closeSync` throws; `hostBin` cached for the process lifetime | Not changed (close of an owned fd only fails on EBADF = bug elsewhere; restage mid-process is out of scope). Noted |

## P02 lead constraints — checked

- Caller closes fd 3 on every non-acquired answer: every path of `acquireSync`/`acquire`/`probe` closes before returning/throwing (reviewer confirmed, incl. inode mismatch, `killed`, predecessor-not-empty).
- Predecessor path derived from fd 3: facade never passes `--predecessor` (`modeArgs`: `--try|--wait-ms N --kill-wait-ms N`).
- Protocol mismatch exit 3: real binary `internal lock-fd --protocol 2` → exit 3 + JSON `host-version-mismatch`; facade maps it to `lock-driver-unavailable (host-version-mismatch)`.

## Acceptance evidence

- No export returns an fd: `grep '^export' src/holder-lock/*.mjs` — handles keep the fd in a module-private WeakMap; `driver.mjs` takes an fd as an argument (internal), never returns one.
- All phase tests green with the real binary, no mocked route:

| Run | Where | Result |
|---|---|---|
| `node --test test/holder-lock/*.test.mjs test/runner/herdr-spawn-adapter.test.mjs test/architecture.test.mjs` (`env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<P02 build>`) | phase branch | 126 tests, 123 pass, 0 fail, 3 skipped |
| same, twice | integration `dd64cca47` (independent tester) | 126/123/0/3, both runs |
| 35 dispatch/runner test files touching `transport`/`authority`/`adapters`/`dispatch.mjs`, `-u FGOS_STATE_ROOT` | phase branch, before and after review fixes | 1444 tests, 1431 pass, 0 fail |
| same | integration (tester) | 1445 tests, 1431 pass, 0 fail, 4 skipped |
| `scripts/test-ownership-lint.mjs` | integration | exit 0 (pre-existing warning: orphan `test/direct/merge-gate.test.mjs`) |

Phase test map: 1 → `facade-multiprocess` (helper exits/holds, two scopes, SIGKILL, timeout + fd count, async acquire); 2/3 → `run-borrowed-git` (real git, `gc.auto=1` + loose objects, hook leftover killed, bystander survives, sibling `not-borrower/lock-not-held-by-description`, plain child has no inode); 4 → `lock-scope-order` (+ concurrent async); 4b → `facade-multiprocess` (live `node` predecessor killed, acquired < 1 s; pid-1 domain with `predecessorKillWaitMs: 200` → `lock-predecessor-domain-not-empty`, `killWaitMs: 200`, lock free after); 5 → `state-root` (all non-Windows vectors via Node); 6a → `driver-unavailable` (no binary → named error on every door, no lock dir, worker env without pin).

Skipped, environmental: 6b NFS/SMB — **not measured** (no writable network mount on this machine; not simulated); Windows state-root vector; live herdr/executor tests.

Full `npm test` not run (P12 gate). The brief's known "S1 live probe" failure was not hit in the suites run here.

## Decisions taken by the lead

1. Manifest rows for `src/holder-lock/*.mjs` added in this phase (layer `infra`, forced by `protocol.mjs` → `src/config/global-config.mjs`), although docs belong to P11: `architecture.test.mjs` is the return invariant and would be red otherwise. One-line additions; P11 may see a trivial merge.
2. `workerBaseEnv` without a resolvable root → no pin (H1 above), not a throw.
3. `baseEnv` does not choose the pinned root (H1b above).
4. Leftover = descriptor whose fdinfo lists the flock for the inode, mirroring Rust (H2).
5. Tests run against a phase-private build (`CARGO_TARGET_DIR=.fgos/runtime/tmp/cargo-p03`), not the P02 target shared by other worktrees.

## Concerns

- `workerBaseEnv` now spawns `fgos internal state-root` once per process when no pin is set (cached on success only). Under the Rust host the pin is always present (P02 `legacy_exec`), so this only costs the compatibility channel.
- Off-Linux leftover sweep (process group) and the NFS branch are unmeasured here.
- The phase branch carries `93c3b2503 wip: partial work from an interrupted round` from round 1 (history not rewritten).

## Unresolved questions

None.
