# Round-2 verification: fix/credential-pending-retention (06e4e1596 vs 0d9e9d00d)

## Scope

- Commits: b2edd562c, 806d8946b, dd3fd3656, cf537bad8, 06e4e1596 (src +163/-35, tests +219/-23, docs/CHANGELOG/plan).
- This review was read-only. Repros used fake tokens and ran in the scratchpad: `r2new` is HEAD's src, `r2old` is 0d9e9d00d's src with HEAD's tests and stub exports, and `r2scripts/repro.mjs` holds scenarios A-D.
- Tests run:
  - Focused files (renewal, retained check, citation guard): 110/110 pass.
  - Neighbours (`cli-spawn-reconciliation`, `dispatch-confinement-backend-p03`, `dispatch-confinement-credential-hygiene`, `dispatch-reconciliation-import-graph`, `confinement-doctor-checks`, `checks`): 261/261 pass.

## Verdict

**Merge-ready: no.** One small change is needed (N1), or the owner explicitly accepts it under Open question 5.

- Every previous finding is fixed, and each has a test that fails on 0d9e9d00d.
- The new held-home settle feeds the pending cap. That cap can now drop the only valid pending copy in a case where the base kept both copies (repro A).

## Previous findings: status

| Finding | Status | Proof |
|---|---|---|
| M1 non-atomic marker | Fixed. `extendOwnershipMarker` uses `writeFileAtomic` (fsync + rename), at `cleanup.mjs:126`. A torn (non-JSON) marker makes the removal stop at `cleanup.mjs:184`. | Test "marker is rewritten through a rename…" fails on old src. |
| M2 finalizer stops on digest mismatch | Fixed. The digest leaves out `credentialKept` (`authority.mjs:1825-1827`). | Test "after the driver cleanup kept a home, the finalizer with the prepared digests…" uses the real prepare digests in production order and fails on old src. |
| M3 held home has no exit | Fixed. `settleHeldCredentialHome` (`provider-credential-renewal.mjs:868`) runs from refresh-ahead under the lock (`:746`, `:765`) and from `doctor --fix` (`registrations.mjs:5463`). | 4 settle tests fail on old src. |
| Doctor severity | Fixed. Pending/scratch copies and retrying homes return `passed:true` with a `warning:` prefix. A held home is a FAIL that names `home.dir`. `registerFix` returns `{changed,message}`, which is the `runFixes` contract (`registrations.mjs:211-215`). | Doctor tests fail on old src. No token in the output. |
| L1 fifth-attempt wording | Fixed (`cleanup.mjs:210`). | Covered by the spacing test. |
| L2 spacing | Fixed. `CREDENTIAL_KEEP_MIN_INTERVAL_MS` is 15 min, and `lastCountedAt` is written only when an attempt counts. | Test fails on old src. |
| Orphan-reap held-home skip test | Added. It passes on old src, which is expected because the skip already existed. | I deleted the skip line in a HEAD copy and the new test failed, so the test does guard the skip. |

## New findings

### N1 (Medium, regression vector): held-home settle can push the only valid pending copy out through the cap

`settleHeldCredentialHome` relies on `writeBackRenewedCredential`. When the copy is undetermined (source unreadable, or its entry cannot be identified), write-back stages the copy and then calls `capPendingCopies` (`provider-credential-renewal.mjs:926`). The cap drops the oldest-named copy. A held home is often days old, but its copy is staged under a fresh name, so it ranks as the newest.

Repro A (HEAD):
- Setup: torn source, 5 pending copies with the only valid token in the oldest one, and 1 held home with stale content.
- Result: `settle {"settled":1}`, then `credential-pending-dropped (1)`. Pending now holds `STALE-1..4, HELD-STALE`, so `FAKE-ONLY-VALID` is gone.
- On 0d9e9d00d, the held home was never staged, so all 6 candidates survived.

This runs on every dispatch of that account (`:740-746`) and on every `doctor --fix`, not only on a rare path.

Fix (a few lines): in `settleHeldCredentialHome`, before calling write-back, return `{status:'held', code:'pending-full'}` when the account's `pending/` already holds `MAX_PENDING_COPIES` and the copy would be staged rather than proven `not-newer`. Simpler alternative: settle only on `unchanged` or `applied`, and never stage. Either way, extend Open question 5 to name this feeder.

### N2 (Low): crash between stage and rm re-stages a duplicate

Repro B: write-back stages, the home stays (simulated crash), then settle runs. The home is staged again and pending holds 2 identical copies. No direct loss, but the duplicate feeds N1 and Q5. The fingerprint idea in Q5 would cover it.

### N3 (Low, pre-existing pattern): staged copy is not fsynced before the home is deleted (author Q2)

- `layout.stage` uses `copyFileSync` or `VACUUM INTO` (`:292`, `:358`, `:458`), then `renameSync` (`:920`), with no file or directory fsync. Settle then `rmSync`s the home (`cleanup.mjs:300`).
- Same filesystem: yes. `.tmp-*` and `final` are both in `pending/`, and the home is copied, never renamed across filesystems.
- Process crash at any point: no loss. Either the home survives, or the pending copy is complete, because `.tmp-*` is never listed and `final` exists only after the rename.
- Power loss: with delayed allocation, the rename and unlink can commit before the new file's data reaches disk. The removal path at 0d9e9d00d had the same order.

Fix: fsync each staged file and `pendingDir` before returning `staged`. `writeFileAtomic` already does this for single files.

### N4 (Low, not reachable in production): settle filter ignores `runtimeDir`, so the lock scope can mismatch

- `settleHeldCredentialHomes` matches on provider and account only (`cleanup.mjs:296`, `:455`), then sets `lockHeld:true`. The lock refresh-ahead holds is on its own `runtimeDir`, but write-back and apply act on the marker's `runtimeDir`.
- Repro D: a marker on R1 whose R1 lock is held by another holder, and refresh-ahead on R2. The home is settled and applied to the source while the R1 lock is held elsewhere.
- In production every caller uses `defaultProviderCapacityRuntimeDir()` (`assignment-runner.mjs:2202`), and no src caller overrides it, so this cannot happen today.

Fix: pass `runtimeDir` in the hook and filter on `marker.credentialWriteBack.runtimeDir`.

### N5 (Low): the dd3fd3656 guard does not catch a marker that parses but is not fgOS's

Repro C: markers `{}`, `null` and `{"dispatchId":"x"}` were all removed by `removeConfinementDir`, auth.json included. `""` threw `ownership-marker-unreadable`.

Reachability is low:
- `cleanupConfinementResource` refuses an invalid marker first, leaving only a small check-then-act window across `stopProcessesInside`.
- The finalizer refuses on a digest mismatch whenever `ownershipMarkerDigest` was recorded.
- No fgOS writer produces such content: all write full objects, and the provisioning and extend writes are now atomic.

What remains: a finalizer descriptor that has no digest. Optional hardening: in `removeConfinementDir`, refuse whenever the marker file exists but `readOwnershipMarker` returns null.

### N6 (Low): stale comments

- `registrations.mjs:5419-5421` says "no path, no value".
- The `listKeptCredentialHomes` docstring (`cleanup.mjs:250`) says "never a path".

Both now print or return `dir`.

### N7 (Low): boundary test does not match template-literal imports

The regex in the "no provider module reaches into confinement" test does not match a backtick string, for example ``import(`./confinement/x.mjs`)``. It does scan `from`, `import(` and bare `import` with quotes. Grep today: no `provider-*.mjs` mentions confinement in any import, and `provider-capacity.mjs` imports only adapter, auth-failure and process-identity.

Fix: add `` ` `` to the quote class.

### N8 (Low, cost): a held home that cannot be settled makes every dispatch of its account take the account lock

`has()` is true, so the fresh fast path at `:755` is skipped. The lock is waited for asynchronously (`acquireAccountLock` polls with `setTimeout`, so the event loop is not blocked), and every dispatch scans the markers. This is acceptable while doctor FAILs on the held home. Worth a line in Q9.

### Pre-existing, not changed by this round

`markResourceRetained` (`cleanup.mjs:77`) still uses `writeFileSync`. A torn result now refuses removal, which is safe, but it is also invisible to the reaper and to `listKeptCredentialHomes`, so nothing reports it. This matters only on a crash of the owning process mid-retain.

## Author's questions

1. **Return values when settling a held home.**
   - `none`: unreachable, because `validWriteBack` is checked first (`:870`).
   - `failed/invalid-marker`: held.
   - `unchanged`: copy proven malformed (`COPY_MALFORMED_CODES`), or source read and proving it not newer, so deleting is safe.
   - `staged`: the copy was renamed into `pending/` before the return. Safe from a process crash; see N3 for power loss and N1 for the cap.
   - `applied` / end-of-function `unchanged`: unreachable here, because `tryLock: () => null` always returns `staged`.
   - `failed` with `keepHome`, or after `safe`: held.
   - A throw: caught, held.

   No branch deletes a copy that has not been staged and is not proven obsolete. The one exception is the sibling copy that the cap evicts (N1).
2. **Durability of the staged copy.** Same filesystem: yes. The order is: stage, then rename, then `rmSync` the home. A process crash at any point loses nothing (it can duplicate, N2). There is no fsync, so power-loss durability is not guaranteed (N3).
3. **Configured temp roots.** Acceptable as documented in Q9, because doctor FAILs on the held home and `--fix` covers those roots. It is also cheap to close:
   - `loadMachineBackendRegistry` lives on the confinement side, so `createConfinementCredentialRenewal` can default `roots()` to the same union that `defaultConfinementTempRoots` builds (`registrations.mjs:5271`). Moving that helper into `cleanup.mjs` costs one small JSON read per dispatch.
   - Recommend doing it; it also removes Q9.
4. **Cap risk.** Yes, it rises: repro A. Recommend the guard in N1, or at least an amendment to Q5 that names the held-home settle and post-crash re-staging (N2) as feeders.

## Other checks

- **Dependency inversion (cf537bad8).**
  - `cleanup.mjs` imports renewal, and renewal no longer reaches into confinement. `heldHomes` defaults to a no-op (`:718`).
  - All 4 former `createCredentialRenewal()` callers now use `createConfinementCredentialRenewal()`: `cli.mjs:1191` and `:1370`, `operation-choice.mjs:2219`, `execution/run.mjs:377`.
  - No other src caller passes `providerCredentialRenew`. `assignment-runner.mjs:2201` only consumes it.
  - The import-graph test passes with `operation-choice.mjs` now importing `cleanup.mjs`.
- **Doctor.**
  - FAIL/warning semantics match the brief.
  - The held line names the home dir and never prints a token (asserted).
  - `registerCheck` and `registerFix` share the id. No new config default or env var, so no config-merge entry is needed. `fix` cannot throw.
- **Docs.** RUL75 (runner.md), §13.2, distribution.md, CHANGELOG `[Unreleased]` (Fixed + Added) and plan Q9 all match the code. One nuance: "re-checked when that account is next renewed" is true only for the default root, and Q9 says so. The citation guard passes.
- **Concurrency.**
  - Two `doctor --fix` runs on the same home are serialized by `tryLock`. The second sees `missing-file`, so `unchanged`, and the `rmSync` with `force` is a no-op. Harmless.
  - The reaper and the driver throw `credential-home-held` before touching a held home.

## Recommended actions

1. N1 guard: keep the home held when pending is full and the copy would only be staged. Add a repro-A test.
2. Optional, same round: pass `runtimeDir` through the hook and filter on it (N4); default `roots()` to backend-configured roots (Q3/Q9); fsync staged files and `pendingDir` (N3); fix the stale comments (N6); add the backtick to the regex (N7).

## Unresolved questions

- Is the owner willing to extend Q5's accepted cap risk to held-home settles, instead of adding the N1 guard?
- Should `removeConfinementDir` refuse any present-but-unowned marker (N5)? Or is the caller-owned ownership check plus the finalizer digest the intended boundary?

Status: DONE_WITH_CONCERNS
Summary: Every round-1 finding (M1-M3, severity, L1, L2, reap-skip test) is fixed, and each has a test that fails on 0d9e9d00d. The held-home settle adds one new way to drop the only valid pending copy through the cap (N1, reproduced).
Concerns/Blockers: N1 needs a small guard, or explicit owner acceptance under Q5, before merge. N2-N8 are Low.
