# Red-team review: provider credential rotation safety plan

Target: `plan.md` and `phase-01-refresh-ahead-and-write-back.md` (worktree at main `97ca636f9` plus plan commit `a1d4bdce8`).
Mode: advisory, read-only. No CLI, test suite or credential store was run or read.

## Verdict

**Not ready to build.** One factual error makes the write-back unreachable on the main dispatch path. Three design gaps can make the bug worse than it is today: a failed renewal leaves the source marked due, an orphaned probe outlives its lock, and a WAL copy can carry a refresh token that is already used up. One locking gap can freeze the event loop when two seats run in the same process. The Codex trigger is measured on the wrong field. Fix findings 1–7 in the plan before Phase 01 starts.

## Findings (ranked)

### 1. Critical: write-back never runs on the cli-spawn path, because `finalizeConfinementResources` does not call `cleanupConfinementResource`

- Evidence: `src/runner/dispatch/confinement/authority.mjs:1810-1840`. `finalizeConfinementResources` reads the marker, checks the digest, then calls `fs.rmSync(targetPath, …)` and `removeEmptyDispatchParent` directly. It never calls `cleanupConfinementResource`, and it does not call `stopProcessesInside` either. The cli-spawn path (`assignment-runner.mjs:2134`, `useSupervisorRecovery`, the default headless adapter) has no driver `cleanup()` call. Its private home goes away only through `finalizeConfinementResources` (`assignment-runner.mjs:2743`, `settlement.mjs:850/933`), or later through the reaper when finalize marked it `retained`. Only herdr-spawn reaches the driver cleanup (`authority.mjs:1278-1286`).
- Failure: the plan says `cleanupConfinementResource` is "the one removal path used by the driver cleanup, `finalizeConfinementResources` and the reaper" (phase-01 line 46, plan.md "Code read"). That claim is false. On every normal cli-spawn omp, pi or Codex dispatch the home is removed without a write-back. Tests built on that claim would still pass, because they would only exercise `cleanupConfinementResource`.
- Plan change: name a single owned-home removal function, for example `removeOwnedPrivateHome(dir, {dispatchId, expectedMarkerDigest?})`. It does the write-back, then `stopProcessesInside`, then `rm`. Route all three paths through it, keeping finalize's digest check. Add a test that runs `finalizeConfinementResources` against a marker that carries the new field. Also state the order: stop the processes first, then read the copy, then write back, then remove. Read before the stop and the pane can renew after the read.

### 2. High: a failed renewal leaves the source marked due, so every later pane renews inside its throwaway copy

- Evidence: phase-01 lines 28 and 98: "the store keeps its refresh token … the CLI renews from it on the next call". `copyHomeFiles` (`bwrap.mjs:40-69`) copies the store exactly as it is.
- Failure: the mark-due write succeeds and the probe then fails (a network error, the 90 s timeout, a quota answer). The source now holds `expires` in the past with P1. The "next call" the plan relies on is the next confined pane, and its copy renews P1 at startup and loses P2 when its home is removed. That is the exact bug, now set off on purpose and on every pane, where today it happens only inside the CLI's own 5 min window. Each later dispatch also sees the source "inside the window", marks it again and runs another probe of up to 90 s while holding the account lock. All dispatches on that account then queue behind each other.
- Plan change: on any outcome other than "expiry moved forward", restore the original `expires` or `last_refresh` value, but only if the store still holds the value we wrote (compare-and-restore under the lock). Record a per-account refresh failure with a cooldown, using the same `probe.attemptedAt` shape as `probeQuarantinedAccounts`, so a dead login does not cost each dispatch a 90 s wait. Fix the Risk row.

### 3. High: the probe is spawned `detached: true`, so it outlives a dead runner whose lock is then reclaimed, and a second forced renewal uses the same refresh token

- Evidence: `provider-credential-probe.mjs:69` (`detached: true`). In `provider-capacity.mjs:441-452,488-500`, `isGenerationHeld` judges only the holder pid (the runner) and reclaims at once when that pid is dead. My memory notes record the same gap for dispatch locks: the lock records the runner, not the worker.
- Failure: runner A holds the account lock, marks the store due and spawns the probe, then dies (SIGKILL or OOM). The probe keeps renewing in the real home. Runner B reclaims the lock immediately, re-reads, still sees the expiry A marked, marks again and spawns a second probe. Two CLIs now redeem P1 against the same store, one gets `invalid_grant`, and the plan's Open Question 1 (chain revocation) becomes the live case.
- Plan change: do not spawn the renewal detached, or record the child pid and start time in the lock holder record so `isGenerationHeld` treats a live probe as a live holder. Alternatively write an "in flight since" note next to the store under the lock, and have a newcomer that sees a fresh note wait up to the probe timeout instead of marking again. Add a test: holder pid dead, child alive, so no second spawn.

### 4. High: the generation lock blocks with `Atomics.wait`, so mixing it with an async holder in one process freezes or deadlocks

- Evidence: `provider-capacity.mjs:499` busy-waits with `Atomics.wait(…, 20)` inside `acquireGenerationLock`. `withFileLock` is synchronous. `cleanupConfinementResource` and the reaper are synchronous (`cleanup.mjs:144`, `204`; reaper calls at `run.mjs:158`, `loop.mjs:1430`). Panel seats run `executeAssignment` in parallel in one process (`execution/patterns/panel.mjs:57-77`), and the 2026-10-11 owner decision lets seats share a provider family, so they can share an account.
- Failure: (a) if the "async helper built on the same acquire/release generation functions" (phase-01 line 33) reuses `acquireGenerationLock`, a second in-process contender blocks the whole event loop, and the holder's spawn `close` and timeout callbacks can never fire. The result is a deadlock until the deadline (more than 90 s), then `ProviderCapacityLockError`. (b) Even with a correct async helper, a synchronous `withFileLock` write-back in the same process as an async holder blocks in the same way. The plan's "two callers, one spawn" acceptance case is exactly the in-process panel case.
- Plan change: split out a non-blocking `tryAcquireGenerationLock(lockDir, holder)` (one attempt, no wait). Build the async helper on it with a `setTimeout` back-off, and never call the `Atomics.wait` loop from code that can share a process with an async holder. Make the write-back non-blocking: try once, and if the account lock is busy, either leave the home for the reaper with a marker note or wait with an async wait (which makes removal async; `cleanup` and `finalize` already are async). Add an in-process concurrency test that uses the real lock.

### 5. High: the omp copy can be stale or torn and can carry an already-used refresh token, and `wal_checkpoint(PASSIVE)` does not fix it

- Evidence: `bwrap.mjs:63` copies only `agent.db` with `copyFileSync`, not `-wal`. Phase-01 line 100 relies on `PRAGMA wal_checkpoint(PASSIVE)` and says changing the copy is out of scope.
- Failure: a PASSIVE checkpoint stops at the oldest reader's snapshot, and the user's interactive omp or an unconfined `omp-cli-vantt` dispatch can hold that reader. When the renewal frame stays in the WAL, the copied main file holds either (a) the old expiry with P1, which the probe has just used, or (b) our mark-due frame without the renewal frame, so the pane renews P1 at once. Both give `invalid_grant` or chain revocation in the pane, and an `auth-token` quarantine, which is worse than today. `copyFileSync` running alongside a checkpoint that writes pages can also copy a torn file. Acceptance criterion 1 ("both runs start with a login good for hours") depends on the copy, so it cannot be out of scope.
- Plan change: for SQLite layouts, provision the copy with `node:sqlite`'s `backup()` (available on Node 24 here) or `VACUUM INTO`, under the account lock, instead of `copyFileSync`. Keep the allow-list unchanged. If that is refused, use `wal_checkpoint(TRUNCATE)` with a `busy_timeout` and skip refresh-ahead when it returns busy. Set `busy_timeout` on every connection fgOS opens, including the mark-due UPDATE.

### 6. High: marking the store due makes every other real-home CLI renew at the same time, and none of them honour the fgOS account lock

- Evidence: phase-01 line 99 accepts a "live CLI in the real home", but the mitigation it names (re-read inside the fgOS lock) does not bind omp, pi or Codex. Unconfined dispatches still take a lease (`assignment-runner.mjs:1665-1668`) but never run refresh-ahead (phase-01 line 39: "only when the dispatch is confined").
- Failure: from the mark-due write until the probe commits, any omp, pi or Codex process using the real home sees "expired" and renews P1 alongside our probe. That includes the user's interactive session and a concurrent unconfined dispatch on the same account. omp has a `disabled_cause` column, which suggests a failed renewal can disable the user's own credential row. Without the mark-due these processes would not renew for another 55+ minutes, so the plan creates this race. For pi and Codex, a CLI that read `auth.json` before our rename and writes the whole file afterwards clobbers either the mark or the write-back.
- Plan change: (a) find out whether each CLI takes its own cross-process lock around its refresh (pi `auth.json.lock`/proper-lockfile? omp a `BEGIN IMMEDIATE`?), and take that same lock while marking and writing. (b) Run refresh-ahead for every leased dispatch on an inventory account, not only confined ones, or refuse it while an unconfined lease on the same account is live. (c) State the residual race honestly in the Risk section.

### 7. High: for Codex the plan measures the JWT `exp`, but Codex renews by `last_refresh` age, so refresh-ahead will rarely or never fire

- Evidence: plan.md table: "Codex also renews when `last_refresh` is older than its interval". Phase-01 line 37 reads only the `exp` of `tokens.access_token`. The plan's own measurement shows a 240 h JWT next to a 10-day-old `last_refresh`, which fits an interval shorter than the JWT life (8 days in codex-rs `auth.rs` as I recall it; the plan should verify this from the binary, as it did for pi).
- Failure: Codex renews itself, inside a pane copy, once `last_refresh` crosses its interval, roughly 2 days before `exp`. The check "exp < 60 min" never becomes true before that, so the Codex refresh-ahead is dead code and the multi-pane race remains for every pane started in that window.
- Plan change: define the Codex "due at" time as `min(exp, last_refresh + interval)`, take the interval from the measured constant, and test it. The write-back comparison can stay on `exp` or move to `last_refresh`, but state which one.

### 8. Medium: the copy is made outside the account lock, so a dispatch can copy a store that another dispatch has just marked due

- Evidence: refresh-ahead takes the lock and releases it before `prepareConfinementForLaunch` (`assignment-runner.mjs:2417`) or the herdr-path prepare runs `copyHomeFiles`, which takes no lock. Hundreds of lines and a possible cwd-lock wait sit between the two.
- Failure: dispatch C's check sees 60:01 left and skips. Dispatch A sees 59:59, marks the store due and is probing. C then copies the store with a past expiry and P1, and C's pane renews P1 at the same moment as A's probe. More generally, any copy taken while a mark is in flight is poisoned.
- Plan change: take the account lock around the copy itself (the `backup()` copy in finding 5 needs it anyway), and make the "outside the window" pre-check advisory only.

### 9. Medium: pi `auth.json` and omp `agent.db` can hold several credentials, and whole-file replacement or unscoped row selection corrupts them

- Evidence: phase-01 line 35 reads "any top-level entry with `type: "oauth"`", and line 47 writes pi and Codex back by "temp file + rename", replacing the whole file. The omp read (line 36) takes every oauth row that is not disabled, with no `provider` filter, while the mark-due uses `WHERE id = ?` without saying which id.
- Failure: a pi `auth.json` with two OAuth providers takes the minimum or first expiry and marks or renews the wrong entry. A write-back of the whole copied file rolls back the other provider's entry if the source renewed it since the copy. An omp profile with more than one oauth row has the same problem.
- Plan change: map the fgOS provider name to the layout key (the pi top-level key, the omp `provider` column) and read, mark and write back only that entry or row. Merge one entry into the source JSON instead of replacing the file.

### 10. Medium: secrets can leak through `JSON.parse` error text

- Evidence: on Node 24 here, `JSON.parse` messages quote input text, for example `Unexpected token '}', ...", "b": tru}" is not valid JSON` (checked with fake data). Phase-01 line 46: "A write-back error is reported on stderr". `probeQuarantinedAccounts` stores `err.message` in state (`provider-capacity.mjs:812-815`).
- Failure: a torn or truncated copy (pane killed mid-write, see finding 5) produces a parse error that quotes about 10 characters of token next to the error position, and that text reaches stderr, run logs or `state.json`.
- Plan change: never put `err.message` from a parse or read of credential content into any output. Map such errors to fixed codes (`copy-unreadable`, `copy-malformed`, `source-busy`). Add a test that feeds a malformed fixture containing a sentinel string and asserts the sentinel never appears in stderr, the marker or recorded state.

### 11. Low: smaller factual errors in the plan

- Order: the plan's diagram says "copy listed files ─ writeOwnershipMarker". The real order is the marker first (`bwrap.mjs:493`), then the copy (`496`), and the finalization digest is taken from the marker after prepare (`authority.mjs:1428-1438`). The new field must therefore go into the first `writeOwnershipMarker` call, not into a later rewrite, or finalize returns `ownership-marker-mismatch` and keeps the home. The rollback after a failed copy (`bwrap.mjs:584-590`) then runs write-back against a partial copy; test that it does nothing.
- Fail-over: inside one `executeAssignment`, the selection switch is the executor fallback (`attemptProviderCapacityFallback`, `assignment-runner.mjs:1763-1820`), which may be a different provider. The account rotation from `1de852877` happens across calls in `run.mjs:520-524`. The call must take `provider`, `accountId` and `credentialSource` from the final `providerCapacitySelection`, never from `providerCapacityProvider`.
- "All before `releaseSelectedProviderLease`" is true only in the runner's own `finally`. `settlement.mjs` in a later process and the reaper run after the lease is released, which is why the account lock is needed there.
- The lazy probe (`probeQuarantinedAccounts`) also renews in the real home but would not take the new account lock. A manual quarantine clear while a probe runs lets refresh-ahead run alongside it. Take the account lock in the lazy probe too.
- In `credentialProbeCommand` the pi branch (`files.includes('auth.json')`) is tested before the planned omp branch. An omp source that also lists `auth.json` would run `pi`. Test for `agent.db` first.

### 12. Low (scope): write-back carries most of the risk for a rare case, and the real check has no way to set the threshold

- With a 60 min threshold, 6 h omp tokens and panes bounded by the dispatch timeout (around 35 min in this repo), the only panes write-back saves are retained homes (left-open herdr panes) and failed refreshes (finding 2 addresses those better). Write-back also brings in findings 1, 4(b), 9 and 10 and SQLite row merging inside the reaper and doctor. Options: (a) keep it but scope it to retained homes plus the corrected removal function, or (b) defer it to a phase 02 and make the threshold `max(60 min, timeoutMs + margin)` so a pane started after refresh-ahead cannot outlive its login. I lean to (b) for Ship Faster; the owner decides.
- Step 6 of the real check needs a threshold larger than the remaining validity, but `createCredentialRenewal` is reachable only from code, and AGENTS.md forbids a test-only env switch. Either wait for the natural window (≤60 min left on a 6 h token) or run a small script that calls `executeAssignment` with an injected renewal. Say which in the plan.
- The `account-locks/` generation directories grow by one record per acquisition and are never pruned (`provider-capacity.mjs:476-485`). With a lock taken at every write-back that becomes one or more records per dispatch. Mention it in the install/doctor gate, or pre-check outside the lock and lock only when a write is likely.

## Checked and not raised

- The four callers that pass `providerCredentialProbe` are exactly `dispatch/cli.mjs:1189,1367`, `operation-choice.mjs:2217` and `execution/run.mjs:376`. Correct.
- `provider-capacity.mjs` sits in the reconcile import closure (`test/runner/dispatch-reconciliation-import-graph.test.mjs:179`). The plan keeps spawn in the new module, which is correct; the async lock helper must add no imports or banned calls there.
- `node:sqlite` loads on this host's Node v24.18.0 with `DatabaseSync` and `backup`, and printed no warning. `engines >=18` means older Node versions take the "unreadable" route, which the plan already covers.
- The ownership marker holds only paths and ids. Expanding `home` into it is not a secret.

## Unresolved questions

1. Do pi, omp and Codex take their own cross-process lock during a refresh? Finding 6's fix depends on the answer, which can be read from the bundles and binaries without running them.
2. What is Codex's exact `last_refresh` interval constant (finding 7)?
3. Owner choice for finding 12: keep write-back in Phase 01, or defer it and tie the threshold to the dispatch timeout?
