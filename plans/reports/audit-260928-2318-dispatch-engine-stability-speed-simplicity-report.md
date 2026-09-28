# Dispatch Engine Audit — Stability, Speed, Simplicity

- Date: 2026-09-28 23:18, `main@c2096374b`
- Scope: dispatch only (`src/runner/dispatch/*`, `src/runner/main-checkout-lock.mjs`, `src/verbs/dispatch/*`, the dispatch-claim touchpoints in `src/runner/coordination/session-engine.mjs`, and `packages/host-runtime/rust`). Coordination protocol logic is out of scope.
- Method: read the source directly, then ran live probes that import the real modules. Probe scripts are in the session scratchpad and were not committed. No repo file was edited.

## Summary

| # | Sev | Finding | Evidence type |
|---|-----|---------|---------------|
| S1 | HIGH | Fresh admission lets a second worker start while an orphaned supervisor/worker from the prior attempt is still running | live probe + source |
| S2 | HIGH | The per-cwd dispatch lock has no heartbeat, so a live run loses it after `timeoutMs`. A dead holder blocks for the full TTL | live probe + source |
| S3 | MEDIUM | Provider-capacity `withFileLock` stale-reclaim race loses lease writes (17/25 trials) | live probe (with control) |
| S4 | MEDIUM | Assignment cli-spawn dispatch path never takes the per-cwd lock, so cwd exclusivity depends on which door is used | source |
| S5 | MEDIUM | `dispatch.claim` is always 0 bytes. No door can clear a session-owned claim. `clear-assignment-claim` is effectively unreachable in production | source |
| S6 | MEDIUM | `assignment.json` is still written non-atomically in 2 places, and the runner hard-fails permanently on a torn file | source |
| S7 | LOW | The runner's poll deadline settles the Run as failed without killing a still-live detached supervisor, and logs the wrong reason | source |
| S8 | LOW | Settlement publishes the `settled` control generation before `result.json`, so a crash between the two strands the Run | source |
| S9 | LOW | main-checkout-lock compare-then-unlink reclaim window | source; probe did **not** reproduce (0/30) |
| P1 | LOW | Execute overhead is about 0.3s: 9 git spawns, `git rev-parse HEAD` 3x, 1 config read | live strace |
| P2 | LOW | Every dispatch computes model/redirect/provider-args twice (legacy + PlacementPolicy "self-verifying" shadow) | source |
| C1 | MEDIUM | Five "self-verifying" shadow binders are a permanent second implementation with no retirement entry | source |
| C2 | MEDIUM | Nine or more independent process-liveness judges with different fail-open/fail-closed semantics | source |
| C3 | LOW | `resolveAssignmentDispatchPolicy` is called on the direct execute door only for its throw; its result is discarded | source |
| C4 | INFO | The Rust host does not duplicate dispatch decisions. It carries an unused second process supervisor | source + route table |

The prior hardening claims mostly hold. Run-lock uses bootId + startTime holder identity (`run-lock.mjs:74-85`). Control/admission generations are published with fsync + exclusive link (`run-lock.mjs:227-251`). `result.json` is published immutably and CAS-fenced (`settlement.mjs:309-337`). What they did not cover is the gap *between* locks: the process that holds a lock is not the process that does the work.

## Stability findings

### S1 — HIGH: fresh admission ignores a live orphaned worker

- The control holder is always the **runner** process: `buildRunControlHolder(`${runId}:${process.pid}:…`)`, `assignment-runner.mjs:2022-2023`.
- The supervisor is spawned `detached: true` (`assignment-runner.mjs:2328-2332`, `cli-spawn-supervisor.mjs:836-841`). It deliberately ignores parent death: `process.on('disconnect', () => {})` (`cli-spawn-supervisor.mjs:293`). The worker is also `detached: true` (`cli-spawn-supervisor.mjs:585-590`).
- The in-flight check for a fresh dispatch is only `inspectRunControl(priorRunDir)` (`assignment-runner.mjs:873-887`). It reads the control holder and never reads the supervisor/worker bindings (`protected/bindings/*/supervisor.json`, `worker.json`) that the supervisor publishes (`cli-spawn-supervisor.mjs:176-227`). The only reader of those bindings is the resume-time reconciler.
- **Live probe** (real `run-lock.mjs`): a child process acquired control via `acquireRunControl` + `buildRunControlHolder`, spawned a detached long-lived child, and was then SIGKILLed. Result: `supervisor-stand-in alive: true | inspectRunControl: {"held":false,"controlEpoch":1}`. The admission guard would therefore admit a new attempt, which means two workers on the same Assignment and cwd. This is exactly the double-materialization M1 was meant to close.
- The provider-capacity lease has the same holder mismatch: `lease.pid = process.pid` of the runner (`provider-capacity.mjs:402`). When the runner dies, `reclaimDeadLeases` frees the account while the worker is still using its credential.
- **Coverage:** `admission-run-in-flight` has no dedicated test. It only appears inside a permissive allowed-codes list (`test/runner/assignment-dispatch.test.mjs:2849`). No test calls `inspectRunControl`, and none exercises `forceNewAttempt`.
- **Fix:** make the admission in-flight check (and lease reclaim) also consult the supervisor/worker bindings using the existing `isBoundProcessAlive` identity check. Alternatively, record the supervisor as the control holder once it binds. Add a test that SIGKILLs the runner while a real supervisor is still alive.

### S2 — HIGH: per-cwd dispatch lock is TTL-only, without a heartbeat or liveness check

- `executeExecutorCli` acquires `dispatch--<cwd>.lock` with `ttlMs: timeoutMs` and a composite **string** identity `${pid}:${Date.now()}:${rand}` (`cli.mjs:879-887`).
- A string identity is judged **only** by TTL freshness and is never liveness-probed, even though a pid is embedded (`main-checkout-lock.mjs:281-292`).
- `cli.mjs` contains no renewal call. `renewMainCheckoutLockIfOwn` exists (`main-checkout-lock.mjs:513+`) but only `merge.mjs` uses it.
- **Live probe:**
  - `A: acquired  B while A live: acquired`: holder A was still alive and mid-run, the TTL elapsed, and B acquired the same cwd lock.
  - `C vs dead-pid holder within TTL: held-by-live-other-pid 2100000`: a holder whose pid is dead (999999) blocks for the full 35 minutes, and the status label wrongly says "live".
- A run's total hold time is pre-spawn prep (git status/snapshots, confinement prep, credential provisioning) plus up to `timeoutMs` plus settlement. So any run that uses close to its full timeout loses exclusivity before it finishes.
- **Fix:** heartbeat via `renewMainCheckoutLockIfOwn` during the run, and parse the embedded pid+ts. `reconciliation-planner.mjs:131-156` (`cwdLockHolder`) already has this logic, but in the reconcile door rather than the acquire path. Also correct the misleading `HELD` label.

### S3 — MEDIUM: provider-capacity lock reclaim loses updates (reproduced)

- `withFileLock` (`provider-capacity.mjs:262-301`) reads the holder pid, sees it dead, and unlinks with no re-check of the content. Contender B, working from the same stale read, can unlink A's *fresh* lock, and then both enter the critical section. Its `open(wx)` + separate `writeFileSync` also leaves a window where the file is empty (that case is handled correctly as "unknown").
- **Live probe:** 12 concurrent processes, each alive for the whole trial, called the real `acquireProviderAccountLease` against a pre-seeded `state.lock` holding dead pid 999999.
  - `trials=25 trialsWithLostLeases=17`: for example, `selected=12 leasesPersisted=10`.
  - **Control** without the stale lock: `trials=25 trialsWithLostLeases=0`.
- Impact: lost leases skew the ranking toward accounts that are already busy. Quarantine writes go through the same lock and can be lost too. Triggering it needs a crash inside a millisecond-long critical section plus contention, which is why this is MEDIUM rather than HIGH.
- **Fix:** reuse `main-checkout-lock`'s re-read-before-unlink, or better, the link-publish + generation pattern from `run-lock.mjs`. Also add pid start-time to the lock and lease records.

### S4 — MEDIUM: cwd exclusivity depends on the door

`acquireMainCheckoutLock(…dispatchLockFile(cwd))` is called only in `executeExecutorCli` (`cli.mjs:880`). The Assignment cli-spawn path (`useSupervisorRecovery`, `assignment-runner.mjs:2057`, the default adapter) skips `executeExecutorCli` completely. As a result, two Assignments sharing a cwd, or an Assignment plus an ad-hoc `dispatch execute`, run concurrently with no cwd guard. Both then take dirty/git baselines against the same tree (`assignment-runner.mjs:1993-2004`), so each run's evidence attribution can absorb the other's writes.

This may be intentional for parallel read-only panels, but I found no rule that excludes concurrent *mutating* Assignments on one cwd. This is a product decision, so it is flagged rather than asserted as a bug.

### S5 — MEDIUM: `dispatch.claim` is confirmed empty, and session claims have no clearing door

- Both writers create a 0-byte file: `fs.closeSync(fs.openSync(path,'wx'))` (`session-engine.mjs:509`, and `retry-N.claim` at `session-engine.mjs:~4494`). The memory note is still true.
- `planClearAssignmentClaim` (`reconciliation-planner.mjs:371-434`) refuses session-owned claims first (`:384-387`). A non-session claim has no production writer (the source comment at `:220-227` says so). For a real claim, `holder()` can never return `dead`. The action can only return `refused`, `blocked`, or `needs-input`, so it is dead code in production.
- `dispatch recover` refuses `resume-driver` for session-owned Runs (`src/verbs/dispatch/recover.mjs:280-289`). Its own claim clear (`:226-236`) is therefore reachable only for non-session Runs, which never have a claim.
- Every refusal names `fgos coordination recover <id>` as the right door. However, `src/verbs/coordination/recover.mjs:195-273` only records a recovery command (`RECOVERY_ACTIONS = observe|collect|settle|close|park`, `coordination/schema.mjs:632`) and **never removes `dispatch.claim`**.
- Net effect: if a session dispatch is SIGKILLed before `result.json` exists, the claim stays wedged. Re-entering `createAndExecuteSessionTask` throws "a dispatch is already in progress" (`session-engine.mjs:511-515`) with no repair guidance. The only escape is `retrySessionTask`, which uses a *different* claim file. The retry claim's error text at least names the manual `rm` (`session-engine.mjs:~4501`); the primary claim's does not.
- Code comments already mark the file as deprecated (`session-engine.mjs:497-506`, "slated for removal") because `admitRunAttempt` supersedes it. But S1 shows that `admitRunAttempt`'s check is itself incomplete.
- **Fix:** either remove `dispatch.claim` together with `clear-assignment-claim` once S1 is fixed, or write `{pid, startTime, bootId}` into it so the existing `holder()` proof works. Right now it is two half-mechanisms.

### S6 — MEDIUM: non-atomic `assignment.json`

`fs.writeFileSync(assignmentJsonPath, …)` appears at `assignment-runner.mjs:1264` and `coordination/store.mjs:1052`, both guarded by `!existsSync`. A reader then **fails hard forever** on unreadable/corrupt content (`assignment-runner.mjs:1265-1275`). A crash mid-write therefore permanently bricks the Assignment id. The prior review (H3) flagged `assignment.json` among its atomic-write targets. `result.json` and `run.json` are fixed (`publishImmutableProof`, `writeJsonAtomic` in `markRunSettled`, `visibility-session.mjs:335-345`), but these two writers were missed. There are also two separate writers for one file.

### S7 — LOW: poll-deadline expiry leaves a live supervisor behind

When `pollDeadline = timeoutMs + 10s` expires with no receipt while the supervisor is still running, the loop exits, and the else-branch records `'supervisor exited before adapter receipt was published'` (wrong: it did not exit). The runner then settles the Run as failed (`assignment-runner.mjs:2366-2431`) and never signals `supervisorProc`. The detached worker can keep mutating the cwd after the Run is `failed`. Once `result.json` exists, admission then allows a new attempt. This needs a supervisor that is itself stuck past its own timeout, so it is LOW.

### S8 — LOW: settlement ordering

`settleRunControl` publishes the `settled` generation (`settlement.mjs:321`) *before* `publishImmutableProof(result.json)` (`:330`). A crash between them leaves control `settled` with no `result.json`. After that, `acquireRunControl` returns `settled` (`run-lock.mjs:332-334`) and `repair-projection` requires a result, so the Run can neither be resumed nor repaired. The window is two sync fs calls wide.

### S9 — LOW (not reproduced): main-checkout-lock reclaim window

`tryAcquireOnce` re-reads and compares content before `unlinkSync` (`main-checkout-lock.mjs:308-319`), but compare and unlink are still two steps. The probe used 30 trials × 12 contenders on the real `acquireMainCheckoutLock` with an expired lock: `trialsWithMultipleHolders=0`. It is theoretically open and practically narrow. Contrast S3, which has no re-check and reproduces 68% of the time.

### Refuted hypothesis (recorded to prevent a re-audit)

"The supervisor stdout pipe is never consumed, so it blocks at 64KB." The supervisor is spawned with `stdio: ['ignore','pipe','pipe','ipc']` and the parent never attaches stdout listeners (`cli-spawn-supervisor.mjs:838-857`). A probe with identical spawn options pushed 32MB through without blocking (`exitCode 0 progress DONE 33554432`): Node buffers the unconsumed pipe in parent memory. The only cost is parent memory up to `maxBuffer`. No finding.

## Speed findings

- **P1 (live).** `fgos dispatch decide --for …` takes 0.22s wall, reads each config file once (project + global), and loads 209 modules. A real `fgos dispatch execute` with a trivial `sh -c 'echo DONE'` executor takes 0.30–0.32s wall, reads config once, and spawns git 8 times plus the worker once:
  - `rev-parse --show-toplevel`
  - `rev-parse --verify HEAD`
  - `--git-common-dir`
  - `rev-parse HEAD` ×3
  - `symbolic-ref`
  - `status --porcelain` ×2

  The duplicate `rev-parse HEAD` calls could be merged, but this overhead is negligible next to executor runtimes of minutes.
- **P2.** Every dispatch computes the model, the redirect executor, and the provider args twice (see C1). These are pure in-memory costs, so they are cheap. The cost is complexity, not speed.
- The receipt wait loop is `fs.watch` plus a 20ms `existsSync` fallback (`assignment-runner.mjs:2355-2388`). That is fine.
- **I32 re-check:** confirmed layered, not duplicated. `capabilities.<name>.prefer` is resolved once at bind time (`src/verbs/coordination/binding.mjs:241-280`). `readOnlyRedirects` applies only when the resolved default is `claude`, the Assignment is read-only, and no invocation pin was supplied (`assignment-runner.mjs:1387-1390`). They answer different questions. I agree with I32.

**Speed verdict: fast.** No blocking hot spots were found, and dispatch overhead is about 0.3s.

## Simplicity findings

### C1 — MEDIUM: five permanent "self-verifying" shadow binders

`resolveVerifiedPlacementModel`, `resolveVerifiedRedirectExecutor`, `resolveVerifiedAssignmentModel` (`placement-policy.mjs:280, 453, 502`) and `resolveVerifiedProviderArgs` run at 6 call sites:
- `cli.mjs:312`
- `cli.mjs:827`
- `assignment-policy.mjs:472`
- `assignment-runner.mjs:309`
- `assignment-runner.mjs:355`
- `transport.mjs:185`

Each one computes the legacy answer, computes the PlacementPolicy answer, and **keeps legacy on divergence** while warning on stderr (for example `assignment-runner.mjs:300-320`). They were introduced 2026-09-16 (commits `aecf7d0ad`, `c579ef618`) and have no retirement entry in `docs/backlog.md` or `docs/specs/runner.md`.

Unlike the I32 pair, this is **not** safe layering. It is two implementations of the same decision, with the new one effectively inert whenever it disagrees. `cli.mjs:802-815` admits a further conflict in its own comment: `cfg.models` is keyed by *work* tier in one reader and *policy* tier in another, "two genuinely incompatible legacy shapes under one config key … out of scope". This is RUL11 in its purest form.

**Fix:** set a retirement date. Once divergence telemetry reads zero, delete the legacy path; otherwise, make PlacementPolicy authoritative.

### C2 — MEDIUM: liveness is judged nine-plus ways

Implementations of pid liveness:
- `run-lock.mjs:34`
- `cli-spawn-supervisor.mjs:68`
- `confinement/cleanup.mjs:86`
- `provider-capacity.mjs:332`
- `main-checkout-lock.mjs:157`
- `gateway-control.mjs:59`
- `loop.mjs:205`
- `session.mjs:69`
- `state/events.mjs:262`
- `state/runtime-coordination.mjs:36`

On top of those sit four *holder* judges with different semantics:

| Judge | Unreadable start time | Pid reuse check |
|-------|-----------------------|-----------------|
| `resolveHolderLiveness` (`run-lock.mjs:74`) | held | yes |
| `isBoundProcessAlive` (`cli-spawn-supervisor.mjs:84`) | alive | yes |
| `holder()` (`reconciliation-planner.mjs:247`) | ambiguous | yes |
| `cwdLockHolder` (`reconciliation-planner.mjs:131`) | btime math | yes |

Two lock writers do not probe at all: `tryAcquireOnce` string identities (TTL only) and provider-capacity (pid only, no start time). `readRealControlEpoch` is also deliberately byte-copied (`reconciliation-planner.mjs:168`, `recover.mjs:62`) because of an import-graph ban.

S1, S2 and S3 all come from this scatter. Each lock picked its own identity shape, and the one well-built judge (`resolveHolderLiveness` over `process-identity.mjs`) is not reused. **Fix:** make `process-identity.mjs` the single record+judge, `{pid, bootId, startTime}` → `live | dead | ambiguous`, and migrate every lock/lease/claim onto it.

### C3 — LOW: discarded policy call

`cli.mjs:842-861` calls `resolveAssignmentDispatchPolicy(...)` and throws away the return value. The surrounding comment (`:793-800`) says governance and provenance "now resolve through" it, but only its validation throws take effect. The model still comes from `modelForTier` + the shadow binder (`:818-833`). The mechanism is also decided a third time by `decideExecutorDispatchMechanism` (`:702`). One door therefore runs three resolvers, and only one of them feeds the output.

### Module boundary

Dispatch is 44 files and about 26K LOC under `src/runner/dispatch/`, plus locks in `src/runner/main-checkout-lock.mjs` and doors in `src/verbs/dispatch/`. Three files dominate: `assignment-runner.mjs` (118KB), `operation-choice.mjs` (91KB), and `herdr-round.mjs` (81KB). There is one directory, but not one boundary. The session engine owns a dispatch-exclusivity file (`dispatch.claim`) that dispatch's own reconcile door cannot clear. Exclusivity is split across four mechanisms with no single owner:
- per-cwd lock (`cli.mjs` only)
- per-Run control ledger
- per-Assignment admission ledger
- session claim files

### C4 — Rust host verdict: one dispatch system, not two

- `packages/host-runtime/contracts/command-routes.json` has 75 routes: **73 `legacy-cli`, 2 `native`** (`gate-bypass`, `version`). `dispatch` is `{"route_kind":"legacy-cli","legacy_payload":"legacy-node"}`.
- `apps/fgos/src/main.rs` sends `legacy-cli` routes to `legacy_exec::execute_legacy_cli`, which execs `bin/fgos.mjs`.
- `InvocationService` (`invocation_service.rs`) routes *operation ids* to `OperationProvider`s. `operation_provider_router::select` (`:81-111`) is an exact-binding lookup by operation id plus a contract-version check. It has no executor, capability, tier, confinement, or mechanism logic. Only 3 providers are registered (echo fixture, `distribution.build.show`, `work.gate-bypass.show`).

**Verdict: the Rust host is a thin wrapper for dispatch.** Every decide/execute/log call goes through the Node engine, and the two decision engines cannot diverge today.

**Caveat — latent duplication.** `packages/host-runtime/rust/src/providers/external_process/supervisor.rs` (855 lines) is a second process supervisor that covers the same ground as `cli-spawn-supervisor.mjs` (1208 lines): bounded capture, deadlines, crash-before/after-dispatch mapping, cancellation grace. Grep finds no consumer outside the crate's own tests. It will become a real second implementation the moment an operation such as dispatch is routed `native`. The ownership boundary between the two supervisors should be written down *before* that happens.

## Verdicts

1. **Stable? No — not under crashes or concurrency.** Happy-path serial dispatch is solid, and the hardening's own primitives (run-lock generations, identity, immutable result publication) hold. Two HIGH gaps are reproducible today with the real modules. The per-cwd lock is TTL-only and gets stolen from live long runs (S2). Admission cannot see an orphaned live worker after a runner crash (S1). The lease lock loses writes under stale-lock contention (S3, 17/25). Confidence: high for S1–S3 (live probes against real modules). I did not run a full end-to-end SIGKILL of a real Assignment dispatch with a real supervisor; S1's end-to-end consequence is inferred from the admission code path plus the primitive probe.
2. **Fast? Yes.** About 0.3s of overhead per execute, one config load, 8 git spawns, and no blocking I/O hot spots. The duplicated resolution passes cost complexity, not time. Confidence: high for the direct execute door. The Assignment and supervisor path was reviewed statically only.
3. **Simple? No.** This is scattered in the RUL11 sense ("tùm lum") rather than inherently large. There are nine-plus liveness implementations, four uncoordinated exclusivity mechanisms, five shadow "self-verifying" binders with no retirement plan, a claim file that no door can clear, and a deprecated mechanism kept alive because its replacement is incomplete. The Rust/Node question comes out clean for now (one engine plus a thin host), with one latent duplicate supervisor. Confidence: high (source-grounded).

## Recommended actions (priority order)

1. S1: add supervisor/worker binding liveness to the admission in-flight check and lease reclaim, plus a real-supervisor SIGKILL test.
2. S2: heartbeat the per-cwd lock during the run and liveness-parse the composite identity at acquire time. Fix the `held-by-live-other-pid` label.
3. S3: add re-check-before-unlink (or link-publish) to `withFileLock`, and add start time to the lock and lease records.
4. C2: consolidate liveness on `process-identity.mjs`. This is the root cause of S1–S3.
5. S5: decide whether to delete `dispatch.claim` + `clear-assignment-claim` or give the claim an identity. Either way, point the refusal text at a door that actually works.
6. S6: switch both `assignment.json` writers to an atomic publish and merge them into one writer.
7. C1: add a backlog row that retires the legacy side of the five shadow binders.
8. S4: record the product decision on whether mutating Assignments may share a cwd.

## Unresolved questions

- S4: are concurrent mutating Assignments on one cwd intended, given that only read-only panels are documented as parallel?
- C4: is there a settled owner for "process supervision" now that the Rust host has its own supervisor? The R1 kernel track notes may answer this; I did not find it in the specs.
