# Round-3 verification: fix/credential-pending-retention (34a33f051 vs 06e4e1596)

## Scope

- Code commit: f7fd8ae49. The docs/report commits d00e0527e and 34a33f051 were also read.
- Read-only review. All repros used fake tokens in the scratchpad:
  - `r3v/old` holds the 06e4e1596 `src`.
  - `r3v/oldtree` is the full 06e4e1596 tree with HEAD's renewal test copied in.
  - `r3v/mut` is a HEAD copy used for mutations.
  - `r3v/scripts/r3.mjs` holds the new scenarios E-I.
- Tests run at HEAD, with `CLAUDE_CODE_SESSION_ID` unset:
  - renewal, retained-check, hygiene and `checks`: 204/204 pass.
  - cli-spawn-reconciliation, backend-p03, import-graph, confinement-doctor-checks and credential-probe: 123/123 pass.
  - citation-drift test plus `test/docs`: 44/44 pass. `check-decision-citation-drift`: no findings.

## Verdict

**Merge-ready: yes.**

- Every round-2 finding that was in scope is fixed and reproduced fixed.
- No delete path changed in f7fd8ae49 can remove a copy that may hold the only valid token.
- The findings below are Low: one test that is weaker than it looks, one narrow residual race that is still strictly better than base, and doc and scope accuracy.
- Q5 (the cap on the normal write-back path) is still pre-existing and was not made worse. It remains an owner-accepted risk, not a blocker for this round.

## Must-do results

1. **Repro A-D (r2scripts/repro.mjs) against HEAD.**
   - A: `{"settled":0,"held":1}`. Pending still holds `FAKE-ONLY-VALID,STALE-1..4`, with no `credential-pending-dropped`. On 06e4e1596 the same run drops `FAKE-ONLY-VALID`. **Fixed.**
   - B: still 2 identical pending copies. This is N2, recorded as plan Q10.
   - C: `{}`, `null`, `{"dispatchId":"x"}` and `""` all throw `ownership-marker-unreadable`, and the home is kept. On the old code the first three were removed.
   - D: refresh-ahead on R2 does not see the R1 held home (`has()` filters on runtimeDir), so the home and the source stay untouched. On the old code the home was applied while another holder held the R1 lock.
2. **New tests fail on 06e4e1596.**
   - Six tests fail: the 5 new ones, plus the held-home refresh-ahead test whose `tempRoots` is now a function.
   - The boundary test passes on the old code. That is expected: its regex lives in the test file.
3. **Invariant hunt.** Every delete path touched by f7fd8ae49:
   - The settle guard (`provider-credential-renewal.mjs:897`) only adds a `held` return.
   - `markerIsUnrecognisable` (`cleanup.mjs:169`) only adds refusals.
   - The runtimeDir filter (`cleanup.mjs:300`, `:460-461`) only narrows which homes are settled.
   - The extra roots let refresh-ahead settle homes that `doctor --fix` could already settle, under the same rules.
   - A sync failure gives `stage-failed` and `keepHome` (repros G and H below).
   - `capPendingCopies` callers:
     - The normal removal write-back at `:949` is unchanged. Repro E (torn source, 5 pending with the oldest the only valid copy, ordinary home removed): `FAKE-ONLY-VALID` is dropped, **identically on 06e4e1596 and HEAD**.
     - `renewInScratch` apply-deferred at `:830` is unchanged.
   - **Q5 is still pre-existing and not worsened.** This round adds no new feeder, and the held-home settle feeder from round 2 is closed.
4. **Author's questions:** see below.
5. **Boundary.**
   - No `src/runner/dispatch/provider-*.mjs` imports `confinement/` (grep is empty).
   - Mutation in `r3v/mut`: I appended each of the following forms to `provider-capacity.mjs`, and the test failed for every one:
     - `from './confinement/…'`
     - `import('./confinement/…')`
     - ``import(`./confinement/…`)``
     - `export * from "./confinement/…"`
   - Evasions it does not catch: `require()`, `createRequire`, and string concatenation (`import(dir + '/confinement/x')`). None of these exist in the code today. Accept.
6. **Docs.**
   - RUL75 (`runner.md`), the CHANGELOG and plan Q9-Q11 match the code, except for R3-3 and R3-4 below.
   - The citation guard passes.

## Findings

### R3-1 (Low, test quality): the fsync test does not guard either sync on its own

`provider-credential-renewal.test.mjs:1442` asserts `syncs >= 3`. The default `tryLock` (account-lock acquire, `provider-capacity.mjs:252/340`) already adds 2 fsyncs.

Mutations in `r3v/mut`:
- Removing only `syncPath(pendingDir)` (`:943`): the test still passes.
- Removing only `syncTree(staging)` (`:941`): the test still passes.
- Removing both: it fails, with a count of 2.

The production code is correct; only the test is loose.

Fix: pass `tryLock: () => null` and record the paths `fs.openSync` opens. Then assert that the staged file and the staging dir are synced before the rename, and that `pending/` is synced after it.

### R3-2 (Low, residual race, strictly better than base): the guard and the write-back read the source separately

- The guard calls `copyIsNewer` (`:897`), then `writeBackRenewedCredential` (`:902`) calls it again.
- The owner's own CLI writes the source without the account lock. If the source proves `not-newer` at the first read and is torn at the second, the copy is staged and the cap drops the oldest copy.
- Repro I (source reads patched so that read #2 onward is torn): `settled:1`, `credential-pending-dropped (1)`, and `FAKE-ONLY-VALID` is gone.
- Base evicts whenever a single read is torn (round-2 N1). HEAD needs a flip inside a window of a few milliseconds, so this is an improvement, not a regression.
- Fix (a few lines): decide once. Either pass the guard's verdict into write-back, or give write-back an option such as `refuseStageWhenFull` that it checks immediately before `mkdirSync(staging)`.

### R3-3 (Low, pre-existing): `privateHomeRoot` homes are outside every searched root

- Private homes are allocated under `privateHomeRoot || tempRoot || default` (`resources.mjs:166`).
- `defaultConfinementTempRoots` (`backend-registry.mjs:348-356`) adds only `tempRoot`.
- So a backend configured with `privateHomeRoot` has held homes that no doctor check, `--fix`, reaper or refresh-ahead ever sees. Such a home is never deleted (so no loss), but its token is stranded and nothing reports it.
- This predates the branch: the helper was copied verbatim from `registrations.mjs`.
- RUL75 ("each registered backend's own") and the plan's Q9 closure claim more than the code does. Either add `privateHomeRoot` to the set, or record it as a known gap.

### R3-4 (Low, doc drift): confinement-authority §13.2 not updated this round

- `runner.md` RUL75 gained the round-3 rules: the pending-full hold, sync to disk, roots, runtimeDir, and what counts as an unrecognisable marker.
- §13.2 (`confinement-authority.md:1370`) still says only "marker có mặt nhưng đọc không được thì việc xoá dừng lại" ("a marker that is present but cannot be read stops the removal") and has none of the round-3 rules above.
- The CHANGELOG's Unreleased entries are general enough to remain true.

### Note (liveness, not safety)

- `doctor --fix` settles without draining `pending/` first.
- Refresh-ahead returns `skipped` before settling when the source is unreadable (`:752`).
- So a held home whose login is provably newer can stay held for as long as `pending/` holds 5 deferred copies. It is safe, and doctor keeps reporting FAIL.

## Author's questions

**(a) N5: a marker that has a string `contract` but is not fgOS's.** Accept. Concretely:

- Repro F: the markers `{"contract":"other",credentialWriteBack}` and `{"contract":"confinement-resource-ownership.v1","dispatchId":"x",credentialWriteBack}` (no `creator`) are both `rmSync`'d by `removeConfinementDir` with no write-back. So yes, such a marker deletes a home that holds a credential. The behaviour is identical on 06e4e1596.
- Reachability:
  - `cleanupConfinementResource` refuses it first (`missing-or-invalid-marker`), and it is the path the driver cleanup and the reaper use.
  - The finalizer refuses on a digest mismatch whenever the digest was recorded at prepare. The bwrap driver writes the marker at materialize, before the digest is taken.
  - What remains: a finalizer descriptor with a null digest, or tampering, or the check-then-act window across `stopProcessesInside`.
- No fgOS writer can produce it:
  - `writeOwnershipMarker` writes the full object.
  - `extendOwnershipMarker` and `markResourceRetained` spread a marker that `readOwnershipMarker` has already validated.
  - A torn write of pretty-printed JSON never parses as a smaller object.
- Optional one-line hardening, with no test churn: also refuse when the unowned marker parses and has a `credentialWriteBack` key.

**(b) `syncPath` on a directory on non-Linux.** The failure path is safe, and the code is Linux-only in practice.

- Repro G simulates Windows by making `openSync` on a directory throw EISDIR. Result: `credential-home-kept` with `stage-failed`, the home is kept with its token, the staging directory is removed, and `pending/` is empty.
- Repro H: when only the post-rename `syncPath(pendingDir)` fails, the home is kept and the renamed copy stays in `pending/`. That is a duplicate (plan Q10 class), not a loss.
- `credentialWriteBack` is written only by `drivers/bwrap.mjs:74-80`, and bwrap is the only driver. So write-back, and with it `syncPath`, never runs where bwrap does not.

## Recommended actions (none blocking)

1. Tighten the fsync test (R3-1).
2. Make the stage decision once (R3-2), or name it in Q5.
3. Either add `privateHomeRoot` to `defaultConfinementTempRoots`, or reword RUL75 and Q9 (R3-3).
4. Bring §13.2 in line with RUL75 (R3-4).

## Unresolved questions

- Does the owner accept Q5 (the normal write-back cap, repro E) as it stands for merge, or should the fingerprint/dedupe candidate land first?
- Is `privateHomeRoot` used on any real machine? If so, R3-3 is a stranded-token visibility gap, not a theoretical one.

Status: DONE
Summary: Round-3 fixes verified. Repro A now keeps FAKE-ONLY-VALID, all 5 new tests fail on 06e4e1596, and no changed delete path can remove a maybe-only-valid copy. Q5 (normal write-back cap) is still pre-existing and not worsened. Merge-ready: yes.
Concerns/Blockers: Low only. The fsync test does not catch removal of either sync on its own (R3-1). A narrow two-read race remains in the settle guard (R3-2). `privateHomeRoot` homes are invisible everywhere (R3-3, pre-existing). §13.2 has not been updated (R3-4).
