# Code review: final pre-merge review of the credential doctor branch

- Branch: `fix/credential-phase-02-doctor-scan` at `ee1865d81`, base local main `59934a2d6`
- Worktree: `~/projects/forgentX-worktrees/credential-phase-02-doctor-scan`
- Commits: `04c6859af`, `480581d05`, `5e353a0d6` (branch two), merge `00193712d` (brings in `51c8394e0`), `ee1865d81`
- Previous reviews: [0935](code-review-261014-0935-doctor-tmp-staging-and-private-home-scan.md), [0945](code-review-261014-0945-doctor-tmp-staging-fix-round.md), [1000](code-review-261014-1000-doctor-stranded-copies-fix-round.md)
- Diff against main: 13 files, +922/-87. Source changes are in `provider-credential-renewal.mjs`, `confinement/cleanup.mjs`, `confinement/backend-registry.mjs` and `setup/registrations.mjs`.
- Focused tests: `env -u CLAUDE_CODE_SESSION_ID node --test` on the three named files gave **160/160 pass, exit 0**. The full suite was not run.
- Probes ran from a session scratchpad script with a throwaway `HOME`, using placeholder bytes. No token value was printed, `~/.fgos/config.json` was not touched, and nothing was committed.

## Verdict per scope

| Scope | Result |
|---|---|
| 1. `5e353a0d6` (homes under unretried roots) | Correct and safe. Settling goes through `settleHeldCredentialHome`, the same function used for held homes (probe P3). The dedupe works only on lexical spellings, not symlinks (L2) |
| 2. Merge `00193712d` | Clean. Nothing was dropped from either side textually, and every listed item is present. One **semantic** merge miss: a test from 51c still passes `runtimeDir`, so it now sweeps the real `~/.fgos` runtime (M1) |
| 3. `ee1865d81` (unreadable inventory) | Correct. It FAILs with the reason, gives no dispatch promise, lists copies at any age, and the reason holds only an error class/code and a path. One leftover promise in the staging row (L3) |
| 4. Whole branch | Dependency direction holds, and the boundary test passes. The no-loss invariant holds at every delete site. The fix row in distribution.md is one clause behind (L4) |

## Critical

None.

## High

None.

## Medium

### M1. A test runs the doctor fix's staging sweep on the developer's real `~/.fgos/runtime/provider-capacity`

`test/setup/credential-copies-retained-check.test.mjs:487`:
`fixCredentialCopiesRetained({ roots: [w.tempRoot], runtimeDir: w.runtimeDir })`.

**Cause: a semantic conflict in the merge.** 51c8394e0 wrote this call when `runtimeDir` was still the staging dir. 5e353a0d6 split that parameter into `stagingRuntimeDir` (`registrations.mjs:5536`). After the merge, `runtimeDir` reaches only `settleHeldCredentialHomes` as a filter. `stagingRuntimeDir` falls back to `defaultProviderCapacityRuntimeDir()` = `os.homedir()/.fgos/runtime/provider-capacity`, and this test does not override `HOME`. `git log -S` shows the line unchanged through 51c, 5e3 and the merge. Every other `fixCredentialCopiesRetained` call in the tests was moved to `stagingRuntimeDir`; this one was missed.

**Proof (probe).** I made a throwaway `HOME` containing `account-locks/xai/acct/pending/.tmp-4194400-z`: empty, dead pid, mtime 2h old. Running only this test with that `HOME` → pass 1, and the staging was **gone** afterwards.

**Failure scenario.** Every `npm test` on an owner machine claims (renames) and judges real interrupted stagings in the live runtime, and removes those that are empty or identical to a kept copy. No login is lost, because only the empty and identical proofs apply (no inventory, no source judgement). But the suite:
- mutates real credential state outside any fixture;
- can race a real `fgos doctor --fix` on the same store;
- breaks the "only the owner's `--fix` touches these" contract the docs state.

The test also proves less than its title says. It never passes an inventory, so the fix never sees the copy as stranded, and the pending copy would stay with or without the stranded logic.

**Fix.** Change it to `fixCredentialCopiesRetained({ roots: [w.tempRoot], retriedRoots: [w.tempRoot], stagingRuntimeDir: w.runtimeDir, inventory: { openai: { accounts: { acct: perCliAccount } } } })`. Optionally make `fixCredentialCopiesRetained` reject a `runtimeDir` option, or rename the settle filter to `homeRuntimeDir`, so the old spelling cannot silently fall through to the real dir again.

## Low

### L1. A store named after an `Object.prototype` key: the check calls it stranded, the fix sweeps it

`registrations.mjs:5530`: `account.credentialSources?.[store]` is a plain property read.

`inventoryAccount` fixed the provider and account levels, but not the store level (the third part of 0945 Low-2). Probe P1: an account with `credentialSources: { pi }` and an empty dead staging at `stores/constructor/pending/.tmp-…`.
- The check FAILs it in the stranded row ("never applied or dropped automatically"), because `layoutStoreDirs` uses `Object.keys`.
- `--fix` gets `Object` for `credentialSources.constructor`, so the marker is null and the resolver returns `null` (not `'stranded'`). The fix then **removed** the staging.

No login can be lost: only the empty and identical proofs run when the resolver returns `null`. It is still a contradiction between the check and the fix.

Fix: `const source = store ? (account.credentialSources && Object.hasOwn(account.credentialSources, store) ? account.credentialSources[store] : undefined) : …`.

### L2. Dedupe is lexical only: a symlink alias of a retried root double-counts the home and falsely says nothing retries it

`registrations.mjs:5451-5453`, `cleanup.mjs:303-306`, `backend-registry.mjs:373`. `path.resolve` does not resolve symlinks.

Probe P2: a registry root that is a symlink to the default temp root, and a kept home with `attempts: 1`. The check printed the home twice: once "retried by the reaper", and once FAIL with "under a root that nothing retries by itself". `--fix` would then settle it at attempt 1. That is safe, because it goes through the same settle rule, but the FAIL claim is false.

The 5e3 test only covers a trailing `/`. Nested roots, the other case, are handled correctly: default roots come first in `credentialScanRoots`, the first listing wins, and a home the reaper sees at depth 2 is correctly labelled as retried.

Fix: compare roots and home dirs with `fs.realpathSync` (falling back to `path.resolve`) in `credentialScanRoots`, the `retried` set and both dedupe sets.

### L3. Without an inventory, the staging row still promises a source-login proof the fix cannot use

`registrations.mjs:5480`. Probe P4, with an unreadable config and one dead staging:
> login store layout not checked: x; xai/acct: 1 interrupted staging(s) … "fgos doctor --fix" removes one that is empty, identical to a copy already kept, or shown by the source login of the account to be no newer …

With `inventory === undefined`, `stagingStoreResolver` returns `undefined`, so `--fix` never judges against the source. This is not a dispatch promise, so the brief's criterion is met. But the row overstates what `--fix` does in this state. Drop the "shown by the source login" clause when `unjudged`.

### L4. Docs: the fix row in distribution.md does not mention unretried-root homes

`docs/specs/distribution.md` row 7b says the fix "re-checks private homes held after repeated staging failures". Since 5e3, the fix also settles a kept home under a scan-only root at any attempt count. The CHANGELOG and runner.md RUL80 already say this ("`--fix` settles it by the same rule as any held home"); row 7 says it too. Add the same clause to row 7b.

### L5. The unretried-root fix test proves deletion only on an empty home

`credential-copies-retained-check.test.mjs` ("a kept home under a root nothing retries…") settles a home that holds no login file. No test shows that an unretried-root home with a **newer** login gets that login written back before deletion, or stays when staging fails.

I probed both (P3):
- newer login: source updated, home removed;
- `pending/` read-only: "1 still held", home kept, source unchanged.

The behaviour is right, because it goes through the same `settleHeldCredentialHome`. Pinning P3 as a test would lock it in.

## Scope 1: `5e353a0d6` checks

- **Same write-back/keep rules.** `settleHeldCredentialHomes` (`cleanup.mjs:298-325`) changed only its filter: `!home.held && !unretried.has(root)`. Each home that passes still goes through `settleHeldCredentialHome` → `writeBackRenewedCredential` under the account lock. The home is `rmSync`'d only on `settled`, which comes from `unchanged` (the source proves it is not newer), `applied`, or `staged` (fsync'd and renamed into `pending/`). Any `failed` result keeps the home. Probe P3 confirms both directions.
- **Dispatch-side settling is unchanged.** `createConfinementCredentialRenewal` (`cleanup.mjs:470-477`) passes no `unretriedRoots`, so refresh-ahead still settles only homes that are really held, under `defaultConfinementTempRoots`.
- **Concurrency with the dispatch's own finalizer on an unretried-root home** (attempts < 5, so `removeConfinementDir` does not short-circuit). If the fix settles the home and removes it while the finalizer is still copying from it, the finalizer's stage fails, `keepHome` is set, and its marker update fails on the missing dir. No login is lost: the fix removes the home only after a durable proof.
- **`stagingRuntimeDir` split.** The production fix (`registrations.mjs:5560`) passes neither `runtimeDir` nor `stagingRuntimeDir`. Before the split, the staging dir was `options.runtimeDir ?? default` = default, and the settle filter was `undefined`. After the split, the staging dir is the default and the filter is `undefined`. **The production path is unchanged.** Only a test call site regressed (M1).
- **Check wording.** "under a root that nothing retries by itself" applies only when `attempts < CREDENTIAL_KEEP_MAX_ATTEMPTS`; otherwise the old wording stays. The path is named, and the check FAILs.
- **New tests:**
  - the `.sweep-*` leftover test and the rename-back failure test both exercise real behaviour;
  - the claimed-writer test does discriminate: without the claim, the no-SQLite fallback would stage successfully and return `staged`, not `keepHome`;
  - the "store with no source stays" assertion is real (a `home-files` source with an unknown file, so the resolver returns `null`).

## Scope 2: the merge `00193712d`

`git show --cc` shows the conflicts only in CHANGELOG, distribution.md, runner.md, `provider-credential-renewal.mjs` (3 hunks) and `registrations.mjs` (4 hunks). Checked against the brief:

| Item | Status |
|---|---|
| Nothing dropped | Every `test(` title from both parents is present in the merge (0 missing in each of the two test files). The source hunks combine both sides |
| The fix closure uses `readDoctorProviderInventory()` | Yes, `registrations.mjs:5560` (the 51c side's `loadRunnerConfigFromDir(cwd)` variant was discarded) |
| `stagingStoreResolver` uses `inventoryAccount()` | Yes, `:5527`. `inventoryAccount` is now exported from the renewal module. The store-level lookup is still a plain read (L1) |
| `listCredentialStoreDirs` returns `store` | Yes, `provider-credential-renewal.mjs:845`, and `inspectPendingCopiesOverLimit` forwards it |
| A staging in a stranded store gives only the stranded row | Yes. `stranded` includes kind `staging` (`strandedByStore(… kind !== 'torn')`), and the staging row filters `!c.stranded`. `sweepInterruptedStagings` skips `'stranded'` |
| `inspectRetainedCredentialCopies` keeps the `.tmp-` and `.sweep-` stagings | Yes. `STAGING_NAME = /^\.(?:tmp|sweep)-(\d+)-/`, with the `interrupted` list merged into the loop at `:815-816` |

The semantic miss is M1.

## Scope 3: `ee1865d81`

- **Unreadable or refused config → FAIL.** `unjudgedCopies` is in the FAIL condition (`:5487`), and the first line is `login store layout not checked: <reason>`. The over-limit and kept-copy rows use neutral wording. The "applies them" and "re-checks them" rows are suppressed when `unjudged` (`:5470-5481`).
- **Any age.** `minAgeMs: unjudged ? 0 : minAgeMs` (`:5446`). The test covers a 1-minute copy.
- **No copies → PASS.** This is tested. A held home alone still FAILs, as before.
- **The reason is free of file content.** `readDoctorProviderInventory` (`:5506-5519`) prints `err.code` or a fixed phrase for a parse failure (the wrapped parse `Error` has no code), and `err.code ?? err.name` for the validator: `ProviderCapacityConfigError` has no `code`, so the reason is just its name. Probe P5: EACCES → `global config unreadable (EACCES) at <path>`; bad JSON → the fixed phrase. The default path matches `loadGlobalConfig`'s own `defaultGlobalConfigPath()`, so doctor reads the same file dispatch reads.
- **`inventory === undefined` callers.** A repo-wide grep finds `inspectRetainedCredentialCopies`, `inspectPendingCopiesOverLimit`, `sweepInterruptedStagings`, `checkCredentialCopiesRetained` and `fixCredentialCopiesRetained` called only from `registrations.mjs` (the doctor check and fix) and from tests. There is **no dispatch-side caller**, so nothing at dispatch time changes. A missing global config gives `{}` from `validateProviderAccountInventory` (`provider-capacity.mjs:71`), not `undefined`, so a machine without a config still gets the "all stranded" judgement and not "unjudged".
- **`inventoryOfDisk`.** It declares every on-disk account directory using its own layout, so nothing is stranded under `run()`. That is the same effective judgement the old `inventory: undefined` gave those tests, minus the new unjudged FAIL. The stranded logic keeps its own tests through `runWith` with explicit inventories (dropped CLI, single↔per-CLI, unlisted account, constructor/toString, torn, over-limit). I found no gap that it hides.
- **The registered-check test now proves the inventory was actually read** (closes 1000 L-T1). A copy in the declared `stores/codex` gets the waiting wording, which is impossible with an empty inventory.
- **Docs.** The CHANGELOG, distribution.md row 7 and RUL80 all say: fail, the reason (error class plus config path, never parser text), any age, no dispatch promise. This matches the code. For the fix row, see L4.

## Scope 4: whole branch against main

**Dependency direction.** The branch adds no imports.
- `cleanup.mjs` → `provider-credential-renewal.mjs` → `provider-capacity.mjs`, and `backend-registry.mjs` → `cleanup.mjs`.
- No `provider-*.mjs` imports `confinement/`. The test "no provider module reaches into confinement, by a static or a dynamic import" (`provider-credential-renewal.test.mjs:1537`) passes in the focused run.

**Delete and rename sites added by the branch.** All are in `src/`:

| Site | Operation | What allows it |
|---|---|---|
| `provider-credential-renewal.mjs:732` | `renameSync(staging → .sweep-<pid>-<rand>)` | The claim. It runs only when the writer's pid is ESRCH and the staging has not changed for 10 min. A failure leaves the staging untouched |
| `:733` (`restore`) | `renameSync(claimed → original)` | Undo. If it fails, the staging stays under its `.sweep-` name and is still reported and re-judged |
| `:751` | `rmSync(claimed, recursive)` | Only when `removable`: the staging is an empty dir; **or** the digest (minus `-shm`) is identical to a kept `pending/` or `torn/` copy; **or**, under the account lock, `judgeCopy` says `not-newer` (the source proves it is not newer, or the copy is malformed). If `rmSync` fails, the staging is restored |
| `cleanup.mjs:316` | `rmSync(home.dir)` | Existing site. It is now also reached for kept homes under unretried roots, still only on `settled` (source not newer, applied, or durably staged) |

The age floor (10 min) and the dead pid are **preconditions to look at** a staging, never a reason to delete it. No site deletes on age. Stranded stores are never swept (resolver returns `'stranded'`, then `continue`). Torn copies are compared against, but never removed. So the invariant holds: a copy is removed only when it is malformed, the source proves it is not newer, it is durably staged or applied, or it is provably identical (empty or byte-equal to a kept copy).

**The reaper and the 0700 tightening** still use `defaultConfinementTempRoots()`, unchanged against main apart from a comment (re-checked: `registrations.mjs:5300, 5380`, and the five dispatch doors).

## Recommended actions

1. **M1 (before merge):** pass `stagingRuntimeDir: w.runtimeDir` (and the per-CLI inventory) at `credential-copies-retained-check.test.mjs:487`. Consider rejecting a bare `runtimeDir` in `fixCredentialCopiesRetained`.
2. L1: use `Object.hasOwn` for the store-level lookup in `stagingStoreResolver`.
3. L2: realpath the roots and home dirs before comparing and deduping.
4. L3/L4: fix the staging-row wording when the layout is unjudged, and update distribution.md row 7b.
5. L5: turn probe P3 into a test.

## Unresolved questions

- Should a registry root that resolves (by realpath) to a default root be accepted at all, or refused when the registry is validated? This decides whether L2 needs a realpath dedupe or a validation error.

Status: DONE_WITH_CONCERNS
Verdict: Not merge-ready until M1 is fixed. It is a one-line test fix: the test currently sweeps the owner's real `~/.fgos` runtime on every test run. The source code itself is sound and keeps the no-login-loss invariant; L1-L5 can follow.
