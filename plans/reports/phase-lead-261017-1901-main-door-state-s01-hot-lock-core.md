# Wave S, S1: hot-lock contract and core

Status: DONE_WITH_CONCERNS. Branch `main-door-state/s01-hot-lock` merged into `main-door-state/integration` (`a2c72569b`, feature commit `4a4e8446e`). Based on main `eab4d617b` (main had not moved).

## What landed

- `packages/holder-lock/contracts/hot-lock.v1.json` + `test/holder-lock/hot-lock-contract.test.mjs`: record tuple, cleanup rules, wait, critical-section rules, six error codes with exit categories.
- `src/state/hot-lock.mjs` (infra): link-created record `<fgosDir>/locks/<resource>.hot` = `{v,pid,startTime,bootId,pidNs,writer}`; cleanup of a dead holder only under the kernel lock `<resource>.reclaim` via the holder-lock facade (judge `dead`, bytes re-read equal, then unlink); unreadable and `unknown` records never cleaned (timeout carries `reason: lock-record-unreadable`); `withStateTx(fgosDir, fn, {resource, prefetched})` with revocable `tx` (`append`, `writeJson`, `readJson`, `unlink`, paths confined to the `.fgos`); `state-tx-async`, `hot-lock-reentry` (thrown at once, any hot resource), `exec-under-hot-lock` (wraps all seven `child_process` exports + `ChildProcess.prototype.spawn`, then `syncBuiltinESMExports`, so named ESM imports are covered; `util.promisify.custom` kept). 5 s wait, `FGOS_EVENTS_LOCK_TIMEOUT_MS` removed (nobody else read it).
- `src/state/event-log.mjs` (kernel, new): read/parse functions, `EventLogError`, `appendEventCore` (takes optional `tx`; inside a tx the writer is `tx.writer`, never resolved under the lock). `src/state/events.mjs` re-exports all of it and keeps `withEventsLock(logPath, fn, fgosDir)` as a thin wrapper over `withStateTx` (`.fgos/porting/` logs take `porting-events`), `appendEvent`, `repairTruncatedLastLine`. P02 deletes the wrapper name.
- Registry: `state` / `porting-events` `v3Path` now name the reclaim kernel lock (`state.reclaim.lock`, `porting-events.reclaim.lock`); the hot record path is in the contract.
- Layering: `events.mjs` and `events-compaction.mjs` moved kernel/domain → infra in `docs/architecture-manifest.json`; `replay.mjs` and `attestation-guard.mjs` (domain) now import `event-log.mjs`. Needed because the facade is infra and a kernel file may not import up.

## Decisions (mine)

1. Split `event-log.mjs` out of `events.mjs` (reason above) instead of reclassifying domain files or injecting the facade.
2. Registry `v3Path` of the two hot rows = reclaim lock, so the facade's `acquireSync('state', …)` is the reclaim door; the hot record is not a facade lock.
3. `withStateTx` resolves the writer identity before the lock when `prefetched.writer` is absent (keeps the identity-before-lock invariant).
4. Windows / no `/proc`: record is `{v,pid}`; a live pid judges `unknown`, never cleaned. A pid that is gone judges `dead` and the cleanup then needs the facade driver, which errors (`lock-driver-unavailable`) until 4.4b P05 — fail loud, no fallback. Not built here.

## Tests (host built from this branch, private target dir; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`)

New files, all green: `hot-lock-contract` (4), `hot-lock-tx` (6), `hot-lock-guard` (4), `hot-lock-multiprocess` (6: cleanup schedule with R1 holding the reclaim lock while R2 waits; stress 8 procs × 60 rounds + 10 SIGKILLed holders, 0 overlaps; zombie holder cleaned; garbage / no-pid / unjudgeable record never cleaned, 5 s timeout, bytes intact; foreign pid namespace via `unshare --user --pid` judges `unknown`, outside judges `dead`; fast path p50 ratio vs old lock 1.04–1.09 over 5 runs), `hot-lock-known-exec-sites` (1: baseline code of the three old sites run against the new lock: `currentHead`, `getMainFgosDir` (swallowed by its own catch, call observed at depth), `assertPlanEvidence` (swallowed, reads as "no plan")).
Changed tests (lock now a different process, because a second acquire in one process is a reentry): `scripts/migrate-actor-to-role`, `scripts/backfill-status-category`, `runner/lock`, `state/identity-before-lock` (stand-in host now reads `state.hot` JSON). New helper `test/helpers/hold-state-lock-in-child.mjs`.
Ran also green: `test/state/**`, `test/holder-lock/**`, `test/util/**`, `test/scripts/**` minus the red below (2006 cases, 12 red before fixes; after fixes the red are the ones listed), `test/architecture.test.mjs` (27/27). Re-run on the integration worktree after merge: 154 cases, 151 pass, 3 red (below).

## Red, by design (guard hits the three known sites; owners S2/S3)

- Full `npm test`: ~150 failing cases, all downstream of `fgos take`/`claimWork` (`currentHead` inside the lock, `claim-port.mjs`, S3) plus `assertPlanEvidence` (`store.mjs`, S2: `store.test` tsk-2p6 ×3) and `getMainFgosDir` (S2).
- Evidence they are only those: a throw-away patch (not committed) prefetching HEAD before the lock took 11 claim/loop/cli/e2e files from many red to 376/380 green; the 4 left were `getMainFgosDir` swallowed (subdirectory / linked-worktree `take`) and the identity test of the same shape. **No fourth exec site found** in those suites.
- Still red in `identity-before-lock` (3 write-path cases): they call `claimWork`; they go green with S3.

## Pre-existing on integration, not from this phase

`check-decision-citation-drift` (ADR0055/ADR0003 cited without gloss in `docs/specs/platform-foundations.md:66`, `work-state.md:1200`); `setup/skill-wrappers` (2: render drift guard, projection). `test/rust-host/fgctl-upgrade.test.mjs` hit the 600 s per-file limit in the full run (not examined; the fgctl-uses-main-target trap).

## Impact (GitNexus, index stale, grep cross-checked)

`withEventsLock`: CRITICAL (78 upstream symbols, 9 direct, 13 flows). Signature kept, behaviour changed on purpose (guard + reentry). `appendEvent`: LOW. `detect_changes`: medium, only the moved `parseEventLines`/`readEvents`.

## Hand-off notes

- S2: remove `withEventsLock` wrapper; prefetch `mainFgosDir` (the swallowing `getMainFgosDir` catch must go, or the guard error is hidden); take `assertPlanEvidence` out of the lock (its try/catch hides the guard); identity test stand-in already understands `state.hot`.
- S3: prefetch HEAD in `claim-port.mjs` (3 call sites use `currentHead` after/in the lock).
- S4: doctor `lock-record-unreadable`, fences for `events.lock` / `claims.lock` / `porting/events.lock`; lock-holders check must treat `state` row's `v3Path` as the reclaim lock, not the hot record. CHANGELOG/docs untouched here.

## Unresolved questions

None blocking.
