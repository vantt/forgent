# Wave S, S2: claims into state, every caller on withStateTx

Status: DONE_WITH_CONCERNS. Branch `main-door-state/s02-claims-into-state` (`64de0de56`, `0de440773`) merged into `main-door-state/integration` (`5adf427f3`). Main had not moved.

## What landed

- `runtime-coordination.mjs`: `withClaimsLock`, `isPidAlive`, the 30 s steal removed. `acquireClaimTx` / `releaseClaimTx` run in the transaction; `acquireClaim` / `releaseClaim` / `readClaim(s)` keep their signatures (public ones open their own transaction). `getMainFgosDir`: no broad `try/catch`, cached per process and dir (a real answer is final; a fallback is re-resolved outside a transaction). New `withMainState(dir, fn)`: locks the `state` mutex of the main checkout's `.fgos`, resolves main root + writer identities before the lock, lets the tx write under `dir` too (`extraRoots`).
- `store.mjs`: 16 callers on `withStateAndRefresh` (`tx.append`, state view written through `tx.writeText`). `settleClaim` is one transaction including `releaseClaimTx`. `moveWork` to `delivered`: plan evidence is a snapshot taken before the lock (item revision + branch tip read from ref files, linked worktrees via commondir); inside the lock only those are compared; mismatch retries, 3 times, then `conflict`. `assertPlanEvidence` keeps its export and message.
- `events.mjs` / `event-log.mjs`: `withEventsLock`, `appendEventLocked` removed; `appendEvent`, `repairTruncatedLastLine` on `withStateTx`; `lockOfLog` exported (porting logs take `porting-events`). `events-compaction.mjs`: moves via `tx.rename`, git staging after the lock (it used to start git under the lock). `porting-store.mjs`, three scripts, `claim-port.mjs` (one call; HEAD for a main-source claim read before the lock, S3 rewrites the body) moved. `CLAIMS_LOCK` removed from the file registry. `hot-lock.mjs` tx gained `writeText`, `rename`, `extraRoots`.
- Tests: new `state-cutover` (live holder never taken over; nested tx refused; plan-evidence retry, real processes), `state-tx-static`; settle race rewritten on the real lock (holder child reclaims claim A for B while the stale settle waits); claim-port race and baseline-exec-site test adapted. Acceptance grep `withClaimsLock|withEventsLock|claims\.lock|CLAIMS_LOCK` in `src scripts`: empty.

## Decisions (mine)

1. One lock root per main checkout for every store operation (not per `dir`), so claims and events of a linked worktree exclude each other; the tx may write under `dir`.
2. Plan-evidence staleness = item revision + branch tip from ref files (no exec in the lock).
3. Compaction staging moved after the lock (`git add -A` new path, `git rm --cached --ignore-unmatch` old).
4. Bare `appendEvent` still locks the dir it is given (as before); only store/claims use the main root.

## Tests (host from the S1 phase build; Rust untouched; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`)

- `test/state/*`, `test/scripts/*`, `test/holder-lock/*`, `test/util/*`, `test/architecture.test.mjs`: 2038 cases, 2033 pass, 4 skipped, 1 red (below).
- Wide run (cli, e2e, verbs, intake, workflow, runner, setup, observe, config, convention, direct, docs, evolve, install, parity, process, report, skills): 5942 cases, 5857 pass, 9 skipped, 1 red (below). `rust-host` not run (fgctl main-target trap).
- After review fixes: state + scripts + holder-lock + architecture + claim-port + loop + cli: 3172 cases, 3103 pass, 1 red. Integration worktree after merge: state + scripts + claim-port 1882 cases, 1881 pass, 1 red.
- Red, not from this phase: `check-decision-citation-drift` (ADR0055/ADR0003 cited without gloss in `docs/specs/platform-foundations.md:66`, `work-state.md:1200`); `setup/skill-wrappers` projection test (wide run).

## Review (Sonnet code-reviewer): no exec reachable under the lock; four findings fixed

Branch tip blind in linked worktrees; fallback cached forever (and guard error swallowed); scripts locked `state` for porting logs; stale claim-port race test held a dead file. Left: docs still name the old locks (`docs/platform/event-store/spec.md`, `session-identity/spec.md`, `docs/specs/runner.md`, `holder-lock/spec.md`): S4 owns docs.

## Impact

`withEventsLock` CRITICAL (78 upstream, from S1), `readClaims`/`acquireClaim`/`releaseClaim`/`settleClaim`/`moveWork`: signatures unchanged. GitNexus index stale; cross-checked by rg and the wide run.

## Hand-off

- S3: `claim-port.mjs` still reads HEAD inside `claimWork` for reclaim/branch paths (`:306`, `:321` area) outside the claim tx: check; rewrite body with `acquireClaimTx` + prefetch; `withMainState` is the door.
- S4: fences/doctor for `events.lock`, `runtime/claims.lock`, `porting/events.lock`; docs above; CHANGELOG.

## Unresolved questions

None blocking.
