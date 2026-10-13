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
