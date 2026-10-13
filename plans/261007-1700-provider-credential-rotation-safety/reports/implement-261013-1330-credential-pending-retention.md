# Credential copy retention: error codes, bounded retry, doctor check

Branch `fix/credential-pending-retention`, rebased onto origin/main 903d447d7. Three commits, one per task.

Invariant preserved throughout: a login copy that may hold the only valid refresh token is deleted only when proven broken, or when the source is readable and proves the copy is not newer. No token value appears in code output, tests, or this report (fixtures are `FAKE-*` strings; output is counts, provider/account ids and ages).

## Task 6: split the unreadable code

- `src/runner/dispatch/provider-credential-renewal.mjs:86` (`readJsonFile`) and `:405` (omp layout read): ENOENT gives `missing-file`; every other read error gives `unreadable-file`.
- `:519` `COPY_UNUSABLE_CODES` and `:562` `COPY_MALFORMED_CODES` contain `missing-file` and no longer `unreadable-file`, so an OS read error on a copy yields `apply-deferred` / `undetermined` (kept or staged). `:520` `SOURCE_SIDE_THROWS` lists both. The old `existsSync` special case in `copyIsNewer` is gone.
- Test: `test/runner/provider-credential-renewal.test.mjs`, "a copy whose store hits an operating-system read error is kept; only a copy with no store is unusable" (EISDIR as the deterministic non-ENOENT error). Run against the old source it fails (3 tests failed on old code: this one plus the two existing assertions whose expected code changed to `missing-file`).
- Docs: `docs/specs/runner.md` (RUL75 item 3, "open follow-up" sentence replaced) and `docs/specs/confinement-authority.md` section 13.2.

## Task 7: bounded retry, finalizer continues

- `src/runner/dispatch/confinement/cleanup.mjs`: `CREDENTIAL_KEEP_MAX_ATTEMPTS = 5`; each keep-home failure increments `credentialKept {attempts, since}` in the marker; at the bound `removeConfinementDir` throws `credential-home-held` without retrying write-back or deleting. Age never deletes it (the reaper goes through the same removal).
- `src/runner/dispatch/confinement/authority.mjs:1842`: a failed removal now records the first reason and `continue`s, so the dispatch's other resources are removed; the dispatch is recorded `retained`.
- Tests: "a home kept because staging failed is retried a bounded number of times, then held and never deleted for age" (also asserts the reaper with `maxAgeMs: 1` leaves it and the renewed login is intact), and "a home that cannot be removed does not stop the finalizer from removing the dispatch's other resources". Verified failing on old behaviour: the finalizer test against old `authority.mjs`; the bound test against old `cleanup.mjs` (with only the constant added so the file loads).
- Docs: RUL75 item 4 and section 13.2.

## Task 3: doctor check `credential-copies-retained`

- `provider-credential-renewal.mjs:611` `inspectRetainedCredentialCopies` (pending and scratch copies at least a day old, by provider/account/age); `cleanup.mjs:235` `listKeptCredentialHomes` (homes with `credentialKept`, `held` flag); `src/setup/registrations.mjs:5391` `checkCredentialCopiesRetained`, registered at the `id: 'credential-copies-retained'` entry. Read-only, no fix registered, output is counts/provider/account/age only. Fails on pending copies or held homes; homes still being retried are noted but pass.
- `countDeadOwnedConfinementDirs` now skips held homes, otherwise `confinement-orphaned-resources-reaped` would tell the owner to run `--fix` forever for something `--fix` will not remove.
- Tests: `test/setup/credential-copies-retained-check.test.mjs` (clean pass; pending age reporting and young copy ignored; held fails, retrying passes, no token/path in message); `test/setup/checks.test.mjs` DOCTOR_CHECKS list; Data Dictionary #7 test passes with the new id in `docs/specs/distribution.md` row 7.
- `CHANGELOG.md` `[Unreleased]`: two Fixed lines, one Added line. Plan open questions 3, 6, 7 marked answered. No new src file, so no architecture-manifest row.

## Not verified / unresolved

- The skip of held homes in the orphan-reap count has no direct test (the counting function is not exported); covered only by reading.
- Real accounts and real read errors (EACCES/EIO) were not exercised; EISDIR stands in for "not ENOENT".
- Pending copies "with no identifiable entry" are approximated by age (a day) rather than by re-reading the entry, since the check is read-only and does not open stores.
- Pre-rebase full suite: 7251 tests, 7176 pass, 1 fail, 9 skip; the failure ("codex's cli-bypass invocation consumes model placeholder") is a test fixed on origin/main by 903d447d7 and is outside these changes. Post-rebase result below.

## Post-rebase full suite

The builder's own post-rebase run did not finish: it queued behind another run and produced no totals. The first run
it did get showed one failure, a registry test, caused by the builder collapsing rows 7 and 7b of
`docs/specs/distribution.md` while resolving the rebase conflict. The lead restored row 7b in a separate commit.

Run by the lead on the branch tip after that fix (`npm test`, session variable unset): 7258 tests, 7183 pass, 0 fail,
10 skipped, exit 0.

## Lead's own read of the diff against the invariant

- A held home (five failed stagings) throws before any write-back or delete, so age alone never removes it. The
  reaper goes through the same removal. The finalizer's `continue` only moves on to sibling resources; the dispatch
  parent is removed with `rmdir`, which refuses a non-empty directory, so a held home keeps its parent.
- Only ENOENT on the store file proves a copy empty. Any other read error stays undetermined and is kept or staged.
- The pending copy name is the zero-padded epoch in milliseconds, so the age the check derives from it is right.
- Open for the reviewer: a pending copy older than a day makes the doctor check fail although waiting for the next
  renewal is a normal state, so the check can be noisy; the one-day threshold is fixed, not configurable.

## Round two: independent review findings

Source: [code-review-261013-1355-credential-pending-retention-independent.md](code-review-261013-1355-credential-pending-retention-independent.md). Each fix below has a test shown red with that one change reverted (the new tests for M3 exercise functions that did not exist).

- **M1, marker written atomically.** `extendOwnershipMarker` (`confinement/cleanup.mjs`) now writes through `writeFileAtomic` (exported from the renewal module). A marker that exists but cannot be parsed makes `removeConfinementDir` throw `ownership-marker-unreadable` instead of deleting the home. Test: "the marker is rewritten through a rename, and a marker that cannot be read stops the removal".
- **M2, digest ignores `credentialKept`.** `finalizeConfinementResources` (`confinement/authority.mjs`) compares the marker digest without that field. Test: "after the driver cleanup kept a home, the finalizer with the prepared digests still removes the other resources and says why" uses real digests in production order; the reason is `cleanup-failed: credential-home-kept`.
- **M3, a way out of held.** `settleHeldCredentialHome` (renewal module) and `settleHeldCredentialHomes` (cleanup module): under the account lock, a held home is removed only if the source proves its login is not newer, or the login is staged and applied; otherwise it stays held. Called by refresh-ahead of that account (also when the login is still fresh) and by the new fix registered for `credential-copies-retained`. Tests: not-newer removes; stageable stages, applies, then removes; unjudgeable source plus blocked staging, or a busy lock, keeps; refresh-ahead settles a held home; the fix removes one and keeps one.
  - Nuance: with an unreadable source but working staging, the login is safe in the pending copies, so the home is removed. The reviewer's "keep" case is covered with staging blocked.
- **Doctor severity.** Pending or scratch copies older than a day give `passed: true` with a `warning:` prefix; a held home fails, names its home directory and says what `fgos doctor --fix` does; advice differs by kind.
- **L1.** The attempt that reaches the bound prints "held for the owner".
- **L2.** Failures less than 15 minutes after the last counted one do not increase the count (`lastCountedAt` in the marker; injected clock in tests).
- **L3.** Not fixed; recorded as plan open question 8.
- **(b).** Test through `checkConfinementOrphanedResourcesReaped` with a dead-owner held home (not counted) versus a retrying home (counted).
- Docs: RUL75, section 13.2, CHANGELOG, distribution.md rows 7 and 7b (only the new id and glosses were inserted; both rows kept).

### Not verified in round two

- Refresh-ahead looks only under the default confinement temp root (injected in tests); homes under a backend-configured temp root are re-checked by the doctor fix only (plan open question 9).
- No real accounts or real OS read errors.

### Round two, addendum: dependency direction and test 16

- A guard that refused removal for any marker `readOwnershipMarker` rejected broke the existing finalizer test whose marker parses but is not ours. Production code fixed: only a marker that is not valid JSON stops the removal. Test unchanged; a new test shows a really changed marker still gives `ownership-marker-mismatch`.
- Refresh-ahead no longer imports confinement. It takes an injected `heldHomes` hook (`has`, `settle`) and calls `settle` only while holding the account lock. `createConfinementCredentialRenewal` (`confinement/cleanup.mjs`) builds that hook and is what `dispatch/cli.mjs`, `operation-choice.mjs` and `execution/run.mjs` now pass (they no longer call `createCredentialRenewal` directly). Tests: the hook is called under the lock; no `src/runner/dispatch/provider-*.mjs` has a static or dynamic import of `confinement/` (the pre-change renewal file had 2 matches, so the test is red there).
- Component boundary: No component-boundary change. The row in `docs/platform/component-boundary.md` (confinement depends on credential renewal, which depends on provider capacity for the account lock) is again exactly true.

### Final suite

Full suite on the commit that inverts the dependency (cf537bad8): 7269 tests, 7194 pass, 0 fail, 0 cancelled, 10 skipped (`env -u CLAUDE_CODE_SESSION_ID npm test`, exit 0).

## Round three

Source: [code-review-261013-1511-credential-pending-retention-round-2-verification.md](code-review-261013-1511-credential-pending-retention-round-2-verification.md). Run against the code of 06e4e1596, six of the new tests failed (the one that checks the boundary regex is test-side and was red only by the old pattern lacking the backtick).

- **Pending cap loss.** `settleHeldCredentialHome` returns held (`pending-full`) when the account's pending copies are at the cap and the home's login is not proven not-newer, so the cap cannot push out an older copy. Test: five pending copies, the only valid one oldest, a held home with an unreadable source: nothing pushed out, home stays.
- **fsync.** The staged files and staging directory are synced before the rename, the pending directory after it, before the home may go. Test counts syncs.
- **Runtime directory.** The hook and `settleHeldCredentialHomes` match the marker's runtime directory. Test with another runtime directory.
- **Unrecognisable marker.** `{}`, `null`, `[]`, `{"dispatchId":"x"}` and empty content stop the removal. A marker that names a contract (the existing finalizer test's shape) still goes through to the caller's own ownership check; no existing test was changed.
- **Temp roots.** `defaultConfinementTempRoots` moved to `confinement/backend-registry.mjs` (re-exported from registrations); the three dispatch callers pass it to `createConfinementCredentialRenewal`, read at each use. Test reads the callers' sources. The renewal module still imports nothing from confinement. Plan question 9 was closed here and later reopened for homes under a backend's separate `privateHomeRoot`, which no search covers; questions 10 (duplicate staging after a crash) and 11 (lock taken by every dispatch of an account with an unsettleable held home) recorded, not fixed.
- Comments that claimed "no path" corrected; the boundary test's pattern now includes the backtick quote.
- Component boundary: no change.

Full suite on f7fd8ae49 (the report commits after it change no code): 7274 tests, 7199 pass, 0 fail, 0 cancelled, 10 skipped (exit 0).

### Follow-up notes from the round-three review

- The runner.md rule and section 13.2 now both state the round-three rules and that `privateHomeRoot` homes are outside the searched roots. Plan questions 12 (the fsync test counts every sync, including the lock's) and 13 (guard and write-back read the source twice) are recorded, not fixed.
