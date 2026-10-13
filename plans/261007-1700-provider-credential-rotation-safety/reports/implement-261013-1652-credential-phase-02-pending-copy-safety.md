# Phase 02: pending-copy safety (branch one)

Branch `fix/credential-phase-02-safety`, cut from origin/main 4e3ea0e9b. Plan: [plan.md](../plan.md), phase file [phase-02-pending-copy-safety.md](../phase-02-pending-copy-safety.md).

Invariant kept: a login copy that may hold the only valid refresh token is dropped only when proven broken, when the source is readable and proves it is not newer, or when an identical copy is retained (staged durably); never by age or count. No token value is printed or logged; the duplicate fingerprint exists in memory only; fixtures are `FAKE-*` strings.

## What changed

- **Pending limit (questions 5 and 10).** `provider-credential-renewal.mjs`: `capPendingCopies` runs only at the end of `applyLeftovers` (under the account lock, after the apply attempt) and in the scratch-deferral path (also under the lock). It drops a pending copy only when its logins (entry key, refresh token, expiry, compared as a hash in memory) equal another pending copy's, oldest first, while over five, keeping the newest of each group. The unconditional drop right after staging is gone, and so is the held-home guard that refused staging when full. When still over five and nothing is redundant, nothing is dropped; `inspectPendingCopiesOverLimit` and a new line in `credential-copies-retained` (warning) name the account.
- **Sync test (question 12).** The test stubs the account lock (so no lock fsyncs mix in) and records the path behind each synced descriptor: staged file, staging directory, pending directory, each exactly once. Removing any one of the three sync calls (staged-file loop, staging-directory sync, pending-directory sync) turns it red.
- **Single read (question 13).** No decision between two reads remains, because nothing is dropped to make room. The test flips the source from readable to torn between two reads with five pending copies, the only valid one oldest, and a held home: the valid copy survives (red before the change).
- **Half-written stores (question 4).** Research below. A pi scratch copy left unreadable (`unreadable-json`) after a probe is moved to `torn/` under the account directory instead of deleted; `torn/` is outside the copies applied or dropped, and the doctor check reports it ("half-written login copy(ies) kept for hand recovery").
- **Questions 1 and 11** recorded as decided in the plan (not tested on a real account; accepted lock cost). Questions 8 and 9 untouched.
- Docs: RUL75 (`docs/specs/runner.md`), section 13.2 (`docs/specs/confinement-authority.md`), CHANGELOG `[Unreleased]` Fixed. `docs/specs/distribution.md` not touched (no new check id). No new source file.

## Research: do pi and omp write their store atomically (question 4)

- pi (`@earendil-works/pi-coding-agent`, built output `core/auth-storage.js`): `writeFileSync(this.authPath, next, ...)` at lines 66 and 140. That truncates and rewrites in place, under a `proper-lockfile` lock (fgOS does not take it). Not atomic: a kill mid-write can leave a partial file.
- omp (an ELF binary, source not installed): its strings contain `INSERT INTO auth_credentials`, `UPDATE auth_credentials`, `PRAGMA journal_mode`, `PRAGMA synchronous`, `PRAGMA wal_checkpoint`. Row updates go through SQLite transactions, so a cut-off leaves the old row, never a torn one. Only strings of the program were read; no credential file of pi, omp or codex was opened.
- Codex was not researched (not asked).

## Tests and proof

- New or rewritten tests in `test/runner/provider-credential-renewal.test.mjs` (lock busy never drops; duplicates dropped first under the lock; normal write-back into five pending with the only valid one oldest keeps it; flipping source; half-written copy kept; per-path sync) and `test/setup/credential-copies-retained-check.test.mjs` (over the limit; half-written copy). Run against 4e3ea0e9b's `src`, seven tests fail (the sync test passes there because the old code also synced; it is a strengthened test, shown red by removing each sync in turn).
- Guard tests run: registrations, checks, architecture, the decision-citation guard and the dispatch import-graph test, all green.
- Full suite on the last code commit 8c4d1b285: 7288 tests, 7213 pass, 0 fail, 0 cancelled, 10 skipped (`env -u CLAUDE_CODE_SESSION_ID npm test`, exit 0). The commits after it change only plans and reports.

## Not verified

- No real account, no real kill-mid-write of pi (the half-written case is simulated by writing a truncated file).
- The fingerprint ignores everything but key, refresh token and expiry; two copies equal on those but different elsewhere are treated as identical (apply only merges those fields).
- Doctor reports a half-written copy only after it is a day old, like the other copies.
- An account whose copies cannot be read (no `node:sqlite`, torn files) has no fingerprints, so nothing is ever dropped there, by design.
