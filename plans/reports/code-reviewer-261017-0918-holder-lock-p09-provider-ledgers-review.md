# Review: holder-lock P09, provider state and account locks (commit 97a8c95cb)

Scope: `git show HEAD` on branch holder-lock/p09-cutover-provider-ledgers. Read-only. Ran only `dispatch-reconciliation-import-graph.test.mjs` and `provider-credential-probe.test.mjs` (38 pass).

## Verdict
Acceptance items are met in substance: v1 code, `isPidAlive` export, `lockDir` and `recordChild` are gone; names, error code, 30 s defaults and the null-when-busy contract are kept; D6 is wired through `spawnHolding`. `pidExists` is byte-equivalent to the removed `isPidAlive`. No caller of the 14 listed symbols in src/ or bin/ breaks at the API level. There is one real lock-leak path and two scope or test-isolation gaps.

## Critical
None.

## High

### H1. Kernel handle leaks if `fs.mkdirSync` throws after acquire
`src/runner/dispatch/provider-capacity.mjs:391-396` (`accountLockHandle`), called from `tryAcquireAccountLock` (:430) and `acquireAccountLock` (:439).

`accountLockHandle(dir, res.handle)` runs `fs.mkdirSync(dir, { recursive: true })` after the kernel lock is already held. If mkdir throws (EACCES, EROFS, ENOSPC, a path component that is a file), the exception propagates and `res.handle` is never released. The runner process keeps the fd open, so the machine-wide account lock stays held until that process exits. The runner is long-lived, so every other process and dispatch on that account is blocked, which v1 never did: v1 created the directory first and only then took the lock.

The new code also calls `mkdirSync` on a path the kernel lock does not need, because the lock file lives under `<lockRoot>`. Fix: create `dir` before `acquire*` (the failure then holds nothing), or wrap `accountLockHandle` in try/catch that calls `res.handle.release()` before rethrowing.

## Medium

### M1. Tests outside the two files that set a temp `FGOS_STATE_ROOT` now contend on the machine's real lock
Only `provider-capacity.test.mjs` and `provider-credential-renewal.test.mjs` set `FGOS_STATE_ROOT`. These also exercise lease, quarantine, probe or account-lock paths and do not set it:
- `test/runner/assignment-dispatch.test.mjs`
- `test/runner/execution/account-rotation.test.mjs`
- `test/runner/execution/run-provider-failover.test.mjs`
- `test/runner/dispatch-reconcile-operation.test.mjs`
- `test/runner/provider-quarantine-probe.test.mjs`
- `test/runner/provider-per-cli-credential-sources.test.mjs`

`scripts/run-tests.mjs:124` deliberately strips `FGOS_STATE_ROOT`. Every such test therefore resolves the real machine state root through the host route, and takes `<realRoot>/locks/provider-state.lock` and `provider-account/...`.

Consequences:
1. Test files run in parallel processes and now serialize on one real lock, so a slow holder can reach the 30 s wait and produce a flake.
2. A running developer fgOS and the test suite block each other. A `tryAcquireAccountLock` in a test can return null because a real dispatch holds that account.
3. Where no host binary is reachable, these tests fail with `lock-driver-unavailable` instead of testing the behavior.

The phase text says "Test đặt `FGOS_STATE_ROOT` tạm cho mỗi ca". The phase's owned-file list names `provider-per-cli-credential-sources.test.mjs`, and the other four are the same kind of caller. Fix: set a private `FGOS_STATE_ROOT` at the top of each file. This could not be confirmed by running the files, as instructed. It follows from the grep and the run-tests code.

### M2. `acquireAccountLock` and `withProviderStateLock` do not map `lock-predecessor-domain-not-empty` to `ProviderCapacityLockError`
`provider-capacity.mjs:345-358` and `:436-445`. Only `tryAcquireAccountLock` catches this (:426). In `acquire()` the answer is not retried: `stillHeld` excludes this reason (`holder-lock/index.mjs:280`), so it throws at once. `acquireSync` also throws it immediately, without waiting.

The error contract says callers see `ProviderCapacityLockError` with code `provider-capacity-lock-stale`. A raw `HolderLockError` is thrown instead, and the "wait up to waitMs" semantics are lost for this case.

Failure scenario: a holder dies, its probe call was killed or is dying, and the next waiter in `probeQuarantinedAccounts` (:723) gets the raw error. That error is caught and recorded as `probe.status:'failed'` with the cooldown, so one transient predecessor-domain race burns an unlock attempt. `refreshAhead` swallows it as `lock-busy`. `assignment-runner.mjs:1134` and `:1695` branch on `err.code === 'provider-capacity-lock-stale'`, so the state lock path reports `acquire-failed` instead of `lock-stale`.

The spec's check (e) is met for `tryAcquireAccountLock` only. Fix: treat this code as "held" in the two waiting paths, either by polling until `waitMs` or by converting it to `ProviderCapacityLockError`.

### M3. The reconcile import-graph exemption: scope is tight by path, but its honesty claim is not enforced
`test/runner/dispatch-reconciliation-import-graph.test.mjs` (LOCK_DOOR_FILES and the walk change).

What is good: only `src/holder-lock/index.mjs` and `driver.mjs` skip the `bannedCalls` scan. Only they may import `node:child_process`. Every other closure file, including the new `protocol`, `registry`, `lock-scope`, `state-root` and `host-bin-path`, is still scanned. The closure list is pinned exactly.

Gaps:
- The comment says "Reconcile never calls runBorrowed", but nothing checks it. `provider-capacity.mjs` imports `runBorrowed` (SIGKILL sweep of description holders, `process.kill(-pid)`), and the reconcile closure reaches it through `accountLockHandle`. The invariant "reconcile does not use spawn/kill" now rests on convention.
- The exemption is whole-file: any future spawn or kill added to those two files passes. That is acceptable for the lock door, but it is wider than "the helper, the kill of a hung helper, runBorrowed's sweep".
- The runtime-load assertion now allows `node:child_process` for any loaded module, which the test comment admits. Only the static walk pins it.

Since `bin/fgos.mjs` cannot be edited, the exemption is a reasonable choice. To make it honest, add one test line that pins provider-capacity's imports from `holder-lock/index.mjs` to the named set, and assert that `reconcile.mjs` and `verbs/dispatch/*` do not reference `acquireAccountLock`, `tryAcquireAccountLock` or `spawnHolding`.

### M4. `runCredentialProbe` turns a successful probe into failure when the sweep rejects
`provider-credential-probe.mjs:124-128`: `borrowed` rejects (`borrow-leftover-not-killed`) and the result becomes `{ ok:false }`, discarding `judged`.

- `probeQuarantinedAccounts` then records a login that actually worked as `failed`.
- The renewal path applies the renewed copy anyway, so it is unaffected.
- The lock is still correctly held by the leftover process, because release only closes the holder's fd.

Conservative but lossy. Consider returning `judged` with an appended detail, or keeping `ok` and logging the leftover.

## Low

### L1. A swallowed `release()` can leak a handle in-process
`provider-capacity.mjs:728-730` and `provider-credential-renewal.mjs` (`finally { try { lock.release() } catch {} }`, and the `held` branch near :1027).

`release()` throws `lock-release-while-borrowed` when `entry.borrows > 0`. I traced every path through the in-tree code and found none that reaches this:
- the `close` handler awaits `child.borrowed`;
- the `error` handler resolves after runBorrowed's own `once('error')` listener has already decremented borrows, because runBorrowed registers its listener at spawn, before the probe's;
- a spawn that throws synchronously does so before borrows is incremented;
- on the `timeout` path, `kill(-pid)` needs the child to lead a group, which `detached` now guarantees.

So today there is no leak path. But the catch hides the failure completely. A custom `probe` passed to `probeQuarantinedAccounts` that starts a child via `spawnHolding` and returns early would leave the handle open and the lock held machine-wide, with no signal. Suggest not swallowing blindly: log or surface `lock-release-while-borrowed`.

### L2. Timeout kill path through the real `spawnHolding` is untested
`process.kill(-child.pid)` only works because `index.mjs` now honors `spec.detached` on Linux. All probe tests use fakes. The new renewal tests cover the D6 SIGKILL case and the fd-3 inheritance case, but not the timeout kill, an error-after-spawn, or `probeQuarantinedAccounts` holding the lock through `spawnHolding`. The phase's `bwrap --unshare-pid` test is absent.

### L3. Scope drift in files outside the phase's owned-file list
The commit edits `src/holder-lock/index.mjs` (new `detached` spec field) and `provider-credential-probe.mjs`. Neither is in the phase's file table. The `detached` change is justified and small. It alters `runBorrowed` for every future caller, and no holder-lock test covers it. Move the `detached` coverage into `test/holder-lock/` or note the exception.

### L4. Phase text and registry disagree on the account lock path
The phase file says `<lockRoot>/provider-account--<p>--<a>.lock`. The registry (unchanged, as required) says `<lockRoot>/provider-account/<provider>/<account>.lock`. The code follows the registry via `resolveLock`. This is harmless, but P11 doctor or fence documentation must use the registry form.

## Per-point answers

(a) All acceptance items are met, with these gaps: the test-state-root isolation in M1, the missing bwrap test (L2), and the file-list scope drift (L3). `inspectProviderCapacityLock` was reimplemented on `lockHolders` and reports `holderAlive` as true or null. `checks.test.mjs` only lists the check id, so it is unaffected.

(b) Callers: `assignment-runner.mjs` (:1123, :1224, :1669, :1679), `settlement.mjs:676`, `verbs/dispatch/reconcile.mjs`, `dispatch.mjs` re-exports, `execution/run.mjs:613` (`createCredentialProbe()` with no arg now relies on `spawnHolding` from `probeQuarantinedAccounts`; fine), `confinement/cleanup.mjs` (default `tryLock` is `tryAcquireAccountLock`) and `registrations.mjs:5602`.
- No removed symbol is still imported.
- `tryAcquireAccountLock` can now throw `lock-driver-unavailable` and similar errors that v1 could not. `writeBackRenewedCredential` catches them with the copy already safe, so the result is `failed/write-back-failed` without `keepHome`. Correct.
- Cost: each `withProviderStateLock` and each try now spawns the `lock-fd` helper process. This is acceptable but is a hot-path change for lease, release and quarantine.

(c) No leak path found other than H1. L1 covers the silent-catch risk. In `runCredentialProbe`:
- `close` waits for `borrowed`, so release never races the sweep.
- `error` resolves after runBorrowed has finished its borrow accounting.
- The timeout kill is reached through `detached`.
- On borrowed rejection the lock correctly stays held by the leftover process.

(d) No production caller passes a non-default `runtimeDir`. `providerCapacityRuntimeDir` is set only by tests: `run.mjs:630` forwards it, and only from options. Two risks remain:
- Over-exclusion: different runtimeDirs now share one lock, which is intended. This is also what drives M1.
- Under-exclusion: the same runtimeDir (derived from HOME) combined with a different state root would produce two lock files for one `state.json`. A sandboxed worker with a different HOME already gets its own `runtimeDir` and `state.json`, so the lock does not protect anything it should not. Document that the lock keys the machine, not the state file.

(e) `tryAcquireAccountLock` converts `lock-predecessor-domain-not-empty` to null correctly. The waiting paths do not (M2).

(f) Patterns match P07 (`session.mjs:163-171`): a per-call `createLockScope`, `acquireSync` with `waitMs`, `lockHolders` for the holder pid, and `resolveLock(...).v3Path` for the message. `acquireAccountLock` uses the async `acquire` correctly. The differences are the missing predecessor handling (M2) and the post-acquire mkdir (H1).

## Unresolved questions
- Should `acquireAccountLock` and `withProviderStateLock` wait through a predecessor-domain hold (matching the 30 s contract) or fail fast with `ProviderCapacityLockError`?
- Is `probeQuarantinedAccounts` meant to record `failed` on a leftover-sweep failure after a successful call (M4)?

Status: DONE_WITH_CONCERNS
Summary: The cutover is correct for the documented paths and meets the main acceptance items. One real leak exists (H1: post-acquire mkdir can leave the account lock held machine-wide). The waiting acquire paths drop the predecessor-domain mapping (M2), six test files still contend on the real machine lock (M1), and the reconcile exemption is path-tight but not enforced (M3).
