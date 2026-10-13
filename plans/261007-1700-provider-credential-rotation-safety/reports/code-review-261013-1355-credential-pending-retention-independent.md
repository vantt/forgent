# Independent review: fix/credential-pending-retention (0d9e9d00d vs 903d447d7)

## Scope

- Commits: 26772073e, 3d89087a0, 6b20418fc, 0d9e9d00d. 12 files, +332/-27.
- Code: `provider-credential-renewal.mjs`, `confinement/cleanup.mjs`, `confinement/authority.mjs`, `setup/registrations.mjs`; docs runner.md RUL75, confinement-authority.md §13.2, distribution.md row 7, CHANGELOG.
- Read-only. Repros used fake tokens in a scratchpad and ran as uid 1000 (real EACCES).

## Verdict

**Merge-ready: no.** The fix is small (M1). The three points the author flagged hold up under real repros. The branch adds one new path that can delete a home (M1). One stated behaviour does not hold in the order production runs things (M2). A held home has no way out (M3).

## Author-flagged points

1. **OS read errors: OK.** `readJsonFile` (`provider-credential-renewal.mjs:84-86`) and omp `read` (`:401-406`) split the cases on `err.code === 'ENOENT'`. ENOENT becomes `missing-file`. Every other error becomes `unreadable-file`. `missing-file` sits in `COPY_UNUSABLE_CODES` (`:519`) and `COPY_MALFORMED_CODES` (`:562`). `unreadable-file` is in neither. Real EACCES repro:
   - file at mode 000 → `apply-deferred/unreadable-file`
   - home dir at mode 000 → `apply-deferred/unreadable-file`
   - private home whose `auth.json` is at mode 000 → `copyIsNewer` = undetermined → `stage` copyFileSync EACCES → `stage-failed`, `keepHome`. The home is kept.

   Grep found no other consumer of the old `unreadable-file` meaning. omp at mode 000 passes `statSync`, then fails with `unreadable-db`, so it is kept too.
2. **Held home and the reaper: mostly OK.** Repro of 7 removals gave `kept×4, held×3`. The marker shows `attempts:5`, and there were exactly 5 stderr lines. After the bound, `removeConfinementDir` throws `credential-home-held` before any write-back or stderr (`cleanup.mjs:178-181`). The reaper records `removal-failed` and does not delete. `countDeadOwnedConfinementDirs` skips held homes (`registrations.mjs:5368`). Doctor reports the home. Lost updates: two removers reading the same `attempts` can only undercount (one extra retry), which is benign. The real counter risk is M1.
3. **One-day age heuristic: acceptable.** Leftovers are applied by the next refresh-ahead or removal on that account whatever their content. "Older than a day" therefore means "no dispatch on that account has cleared it", which is what the owner needs to know. Reading entries would mean opening secret stores, and needing `node:sqlite`, from doctor for little gain. False positives: an account used less than daily, and the advice ("run a dispatch") is right for those. Output is `provider/account: N …, oldest Xh|Xd`: no path, no value. The production `runtimeDir` matches the dispatch default (`assignment-runner.mjs:2202`).

## Findings

### M1 (Medium, regression vector): the marker is now rewritten non-atomically at removal time

`extendOwnershipMarker` (`cleanup.mjs:119-127`) uses `fs.writeFileSync`, which truncates and then writes. Before this branch it ran only once, at provisioning, in the owning process. It now runs on every failed removal (`cleanup.mjs:189-191`), from the driver cleanup, the finalizer or the reaper of any process (`execution/run.mjs:159`, `loop.mjs:1430`, doctor --fix).

- **Torn read:** `readOwnershipMarker` returns `null` on bad JSON (`cleanup.mjs:144-147`). In `removeConfinementDir`, `marker?.credentialWriteBack === undefined` then falls through to `fs.rmSync` (`:176`, `:199`). Two concurrent reapers on the same dead-owner home can make this happen. Process B passes the marker check in `cleanupConfinementResource`, then runs `stopProcessesInside`, then re-reads the marker while process A is mid-write. B then deletes a home that may hold the only refresh token. The window is small, but the outcome breaks the invariant.
- **Crash mid-write:** the marker is left empty. The reaper then treats the home as "not created by us" (`cleanup.mjs:377-380`), and `listKeptCredentialHomes` skips it. The result is a silent, unreported orphan holding a token.

Fix: write the marker with temp + rename. `writeFileAtomic` already exists in the renewal module.

### M2 (Medium): "the finalizer carries on" does not hold in production order; the recorded reason is misleading

The driver cleanup (`authority.mjs:1281-1288`) runs before the finalizer (`assignment-runner.mjs:2776`). Its failed attempt writes `credentialKept` into the marker. The finalizer then sees a digest mismatch against `ownershipMarkerDigest`, which was captured at prepare (`authority.mjs:1428-1445`). It records `retained/ownership-marker-mismatch` and **breaks** (`authority.mjs:1831-1835`), so the new `continue` at `:1839-1843` is never reached.

Repro: attempt 1 by `cleanupConfinementResource`, then `finalizeConfinementResources` with digests → `{"kind":"retained","reason":"ownership-marker-mismatch"}`. The sibling resource still exists.

Impact is limited, because the driver cleanup already looped over all of `allocatedPaths`. But the claim in RUL75 / §13.2 / CHANGELOG does not hold here. The attestation also records something that reads as tampering. The new test (`provider-credential-renewal.test.mjs`, "does not stop the finalizer") passes a descriptor without `ownershipMarkerDigest`, so it does not model this.

Fix: exclude `credentialKept` from the digest comparison, or recompute the digest without it. Then add a test with digests in which the driver cleanup runs first.

### M3 (Medium): a held home has no exit

- The held check comes before `copyIsNewer` (`cleanup.mjs:178`). A held home is therefore never re-evaluated, even after the owner logs in again and the source proves the copy is not newer.
- The doctor check fails permanently (`registrations.mjs:5452`).
- Its advice, "run a dispatch for that account so the next renewal applies it" (`:5449-5451`), is shown when `held.length > 0`. It is wrong for held homes: nothing in refresh-ahead scans temp roots, and removal refuses held homes.
- No command resets `credentialKept`, and no location hint is given. The owner must find `<tempRoot>/<dispatchId>/<home>` alone.

Suggested fix:
- For held homes, still run a read-only `copyIsNewer`, and delete when the source proves the copy is `not-newer`.
- Make the advice depend on the kind of item.
- Name the temp root, not the home, or offer a reset or retry door.

### L1 (Low): wrong stderr wording on the fifth attempt

The attempt that reaches the bound still prints "private home kept for a later retry" (`cleanup.mjs:192`), even though it throws `credential-home-held` and no retry will follow.

### L2 (Low, design): the retry budget has no spacing

The 5 attempts are made up of the driver cleanup plus one per reaper pass on a dead owner. Four `fgos run` invocations (`run.mjs:159`) can use them up within minutes. A transient cause (ENOSPC, EMFILE) then turns into a permanent hold that needs a manual fix, which makes M3 matter more. Consider a minimum interval (`since`/last-attempt time) next to the count.

### L3 (Low, pre-existing): leftover staging dirs are not reported

`.tmp-*` staging dirs left by a crash during `stage` are filtered out of `listLeftovers` (`:597`), so doctor does not report them and nothing removes them. They may hold a partial token copy.

## Other checks

- Lease and run-control release: the finalizer is inside try/catch, then the lease and run-control are released (`assignment-runner.mjs:2774-2782`). Unaffected.
- Doctor gate: `registerCheck` is present (`registrations.mjs:5463`). The `checks.test.mjs` list and distribution.md row 7 are updated. Row 7b is net-unchanged versus base (restored by 0d9e9d00d). No config default, so no config-merge entry is needed.
- CHANGELOG: user-facing, under `[Unreleased]` (Fixed ×2, Added ×1).
- Spec vs code: matches, except the "finalizer carries on" claim (M2).
- Tests:
  - `provider-credential-renewal`, `credential-copies-retained-check`, `check-decision-citation-drift`: 99/99 pass.
  - `cli-spawn-reconciliation`, `dispatch-confinement-backend-p03`, `dispatch-confinement-credential-hygiene`, `confinement-doctor-checks`, `checks`: 205/205 pass.
- No token values found in stderr, doctor output or the new tests.

## Addendum: the coordinator's challenges (a)-(c) and the author's invariant read

Commit 29b628383 changes only a report, so the review of 0d9e9d00d stands.

- **(a) Severity: downgrade the stale pending copy to a warning.**
  - A pending or scratch copy older than a day is normal waiting on an account that is used less than daily. The fix is "dispatch once", not a repair, so it should not FAIL `fgos doctor`. The repo's convention for a warning is `passed: true` with a `warning:` message prefix (`registrations.mjs:510`, `:575`).
  - A held home should stay FAIL: no automatic path clears it (M3).
  - A fixed one-day threshold is fine. Waiting for a renewal has no natural shorter bound, and a configurable threshold would be YAGNI.
  - Today `passed = held.length === 0 && copies.length === 0` (`:5452`). Change it to `held.length === 0`, and prefix `warning:` when only copies or retrying homes are present.
- **(b) Held-home skip in the orphan reap: correct by trace and repro, but untested.**
  - `reapOrphanedConfinementResources` goes through `cleanupConfinementResource` → `removeConfinementDir`. That call throws `credential-home-held` before any write-back or rm (`cleanup.mjs:178-181`), and the result becomes `removal-failed`. My repro (`checkLiveness: () => false`) confirmed the home stays and nothing is reaped.
  - The doctor-side skip (`registrations.mjs:5368`) is a single line with no test.
  - Required before merge: no. Safety does not depend on it: even without the skip, `--fix` would only call the reaper, which refuses the held home. The skip only stops `confinement-orphaned-resources-reaped` from failing forever.
  - Recommended: one test with a marker at `credentialKept.attempts: 5` and a dead pid, asserting that the count excludes it and the reaper leaves it. Bundle it with the M1/M2 tests.
- **(c) ENOENT treated as `missing-file`, so the copy is dropped: no new token-loss case.** Paths checked:
  - **Staging rename:** `.tmp-*` dirs are excluded from `listLeftovers` (`:597`), so a copy that is mid-rename is never read. `final` exists only after an atomic `renameSync`.
  - **Pending/scratch apply:** this runs under the account lock. A dead holder whose child is still alive keeps the lock (RUL75 §1), so no second applier can see a scratch home vanish under it. The one other remover is `capPendingCopies`, which runs outside the lock (`:883`). It deletes deliberately, so an ENOENT seen after it adds no loss beyond the cap (that loss is the known open question 5).
  - **Private home at removal:** another remover deletes a home only after staging it to `pending/` or after proving it not newer, so an ENOENT there means the token is already safe in `pending/`. A scratch home whose runner died between mkdir and copy holds nothing.
  - **Residual risk, pre-existing:** the finalizer calls `removeConfinementDir(targetPath)` without `stopProcesses` (`authority.mjs:1837`). A CLI still running inside the home could be rewriting `auth.json` non-atomically (unlink, then write, or write to a sibling temp file, then rename) when the read happens. That reads as `missing-file`, and the home is rm'd with the new token in the sibling file. The base had the same outcome (`unreadable-file && !existsSync`), so this is not a regression. It depends on plan open question 4 (whether pi/omp write atomically).
- **The author's invariant read, checked:**
  - A held home throws before write-back or delete: confirmed (`cleanup.mjs:178-181`, repro).
  - The reaper goes through `removeConfinementDir`: confirmed.
  - The finalizer `continue`s past a failed home: true only when the marker digest still matches. In production the driver cleanup runs first and changes the marker, so the finalizer hits `ownership-marker-mismatch` and `break`s first (M2).
  - The parent dir is removed with `rmdirSync`: confirmed for `removeEmptyDispatchParent` (`cleanup.mjs:158`). The reaper's own `rmSync(recursive)` of the dispatch dir (`:404-407`) is guarded by `readdirSync(...).length === 0`, so a held home keeps its parent.
  - Only ENOENT proves a copy absent: confirmed (`:86`, `:405`).
  - Zero-padded pending names: confirmed. `padStart(15, '0')` (`:874`) matches `/^(\d{15})-/` (`:621`).
- **Verdict unchanged:** not merge-ready until M1 (atomic marker write) is fixed. Doing M2, M3 and the (a) severity change in the same round is cheap.

## Unresolved questions

- Should a held home be cleared automatically once the source proves it obsolete (M3)? Or does the owner intend "held" to mean "only by hand"? If the latter, doctor needs a door, or at least a location.
- Is the attempt bound meant to count removals or elapsed time? This decides the L2 fix.
