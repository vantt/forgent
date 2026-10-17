# Phase lead report: holder-lock P06 — cutover gateway, sessions, runner

- Plan: `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`, phase file `phase-06-cutover-gateway-sessions-runner.md`
- Branch `holder-lock/p06-cutover-gateway-sessions-runner` (worktree `.claude/worktrees/hl-p06`, from integration `2dd54deb1`), merged into `holder-lock/integration` as `f14bdbf15` (`--no-ff`).
- Impact analysis (GitNexus, index stale at `b334695`, cross-checked with grep): `acquireGatewayLock` LOW (callers `startGateway`/`stopGateway`); `acquireSessionsLock` LOW (4 direct, flows `approveUseCase`, `reclaimOrphanedSessions`); `acquireRunnerLock` index says 0 callers, grep finds `runOnce` (`loop.mjs`), i.e. every runner tick — MEDIUM by hand. No HIGH/CRITICAL.

## Commits

| Commit | Change |
|---|---|
| `2bd5d51ae` | gateway: `acquireGatewayLock` → `acquireSync(scope,'gateway',{fgosDir},{waitMs:120000})`; deleted `tryAcquireLockOnce`, `LOCK_FILE`, `isPidAlive` (→ `pidExists` at 4 sites) |
| `0c68a85f3` | sessions: `acquireSessionsLock` → `acquireSync(…,'sessions',…,{waitMs:10000})`; deleted `tryAcquireOnce`, `SESSIONS_LOCK`, `lockTmpCounter`, `sleepSync`, `isPidAlive` (→ `pidExists` in `reclaimOrphanedSessions`) |
| `6b1bc6f3e` | runner: `acquireRunnerLock` → two `--try`, then `{acquired:false, holderPid, lockPath}`; deleted link/temp block, exported `LOCK_FILE`, `isPidAlive`, `reclaimedStale` (busy result and log line) |
| `cad1938e7` | **fix found by full suite:** `package.json` `files` ships `packages/holder-lock/contracts/lock-registry.v1.json`. Without it the npm package and the staged `libexec/legacy-node` payload had no registry, so `fgos doctor` in an installed/staged release died with ENOENT once these locks went through the facade (32 fgctl/release-tree/doctor-fresh-run failures). Assertions added in `release-tree.test.mjs` and `install-packaging.test.mjs` |
| `9d9643c67` | review fixes: steadier stress assertions + fixture cleanup in `lock.test.mjs`; stale comment in `gateway-control.mjs` |

Behaviour kept for callers: same export names, same error classes and messages (`timed out acquiring gateway.lock|sessions.lock at "<path>" after Nms (held by pid P)`), same default waits, runner busy = exit 6. `holderPid` now comes from `lockHolders()` (kernel `/proc` scan; `null` where unlistable). Dropped options `pid`/`retryMs` (only tests passed them). Lock files: `.fgos/locks/{gateway,sessions,runner}.lock`.

## Tests (real host binary, phase-private `CARGO_TARGET_DIR=.fgos/runtime/tmp/cargo-p06`)

| Phase test | Where | Result |
|---|---|---|
| Two concurrent `startGateway` processes → one cargo call, one spawn, other refuses "already running" | `gateway-control.test.mjs` | pass; **negative control**: with the lock stubbed out both start (`[{started:true},{started:true}]`) |
| Gateway holder SIGKILL → next acquire < 1 s | same | pass |
| Sessions: in-process second holder times out naming `process.pid`; other-process holder SIGKILL → free at once; existing 50-process `createSession` → no lost record | `session.test.mjs` | 19/19 |
| Runner: busy with live holder (no store writes, lock still held); holder SIGKILL → next `runOnce` idle; 16-process stress, every 4th dies while holding, 0 overlaps | `lock.test.mjs` | 7/7, ×3 runs |
| e2e crash test: killed runner → the next `--once` acquires at once and reaps (was: one busy round to clean the stale file) | `runner-loop.test.mjs` | pass |

Commands (`env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<phase build>`):
- Full `npm test` on the phase branch, run 1: 7929 tests, 37 fail — 32 from the missing registry in the staged payload (fixed in `cad1938e7`) plus the shared `target/release/fgos` being older than the `internal` route (env, see below), 1 `fences-stop-check` (other suite fgOS processes appear between scans).
- After the fix, the 11 failing files: 77 tests, 76 pass, 0 fail, 1 skip.
- Full `npm test` run 2: **7929 tests, 7838 pass, 3 fail, 13 skipped**. The 3 (`dir-resolution` tsk-2xj, `porting-store` tsk-1q5 concurrent movePorting, `retrospective-doors` freshness CLI) pass 37/37 when run alone: load flakes, outside this phase's files.
- Integration `f14bdbf15`: 10 files (phase files + release-tree, doctor-fresh-run, install-packaging, fences-v1-tombstone, architecture): **118/118**.
- `scripts/test-ownership-lint.mjs`: exit 0. "S1 live probe" not seen.
- Acquire+release cost measured: ~4 ms (debug host).

## Decisions (lead)

1. One fresh `createLockScope(<name>)` per acquire. These call sites never hold two 4.2 locks in one transaction; threading a caller scope through `runOnce`/sessions is 6.2 work (attempt/cwd scopes).
2. `holderPid` = first pid of `lockHolders()`; diagnostic only.
3. `reclaimedStale` removed from `runOnce`'s busy result (no reader; single user, no compat).
4. Shipping the registry via `package.json` `files` (same pattern as `convention.rules.v1.json`). Not in the plan's file list, but every cutover phase needs it; P11/P12 should know it landed here.
5. Phase worktree's `target` symlink repointed to the phase-private target (release `fgos`+`fgctl` built there), because the staged-release tests read `<repo>/target/release` and the shared one predates the `internal` route. Shared target untouched.
6. Facade errors (`lock-driver-unavailable`, …) now surface from `runOnce`/session/gateway as `HolderLockError` (plan: named facade error). One-shot `fgos-runner --once` prints it and exits non-zero; `--watch` already catches per cycle.

## Concerns

- **P12/landing:** any payload whose host lacks `internal lock-fd` now fails `fgos doctor` and session/runner/gateway verbs by name (`… has no "internal" route …`). The shared `target/release` must be rebuilt from the integration tree before the fgctl/release-tree tests run there, and activation must ship a matching host.
- `timeoutMs: 0` is now refused (`lock-wait-invalid`); no caller passes it.
- Stale v1 descriptions left for P11 (docs owner): `docs/specs/runner.md:811,856,906,1005,1265`, `docs/specs/reading-map.md:42`, `docs/specs/work-state.md:1200`; comments in `src/runner/main-checkout-lock.mjs:9,448`, `src/state/events.mjs:33-48` (4.3 files) still call the deleted algorithm "proven".
- CHANGELOG line (for P11), as in the phase file: "Changed: gateway, sessions và runner lock là kernel lock ở `.fgos/locks/`; holder chết nhả ngay. Release cũ gặp thư mục `TOMBSTONE` ở `.fgos/{gateway,sessions,runner}.lock` và báo `EISDIR`. Trên Windows các lock này báo `unsupported` tới khi có driver." Add: the npm package now ships `packages/holder-lock/contracts/lock-registry.v1.json`.
- Plan/journal/docs sync skipped: controller owns `plan.md`; docs belong to P11.

## Unresolved questions

None.
