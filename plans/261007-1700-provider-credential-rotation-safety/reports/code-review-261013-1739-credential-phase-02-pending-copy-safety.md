# Code review: credential phase 02, pending-copy safety (branch one)

Independent review of `fix/credential-phase-02-safety` at 7c266c3ed (code 8c4d1b285), base origin/main 4e3ea0e9b. Read-only. Worktree `/home/vantt/projects/forgentX-worktrees/phase02-review`. Scratch trees (git archive of HEAD, HEAD tests + base `src`, four single-sync mutants) and the repro script are in the session scratchpad (`p02r/`). Only fake tokens were used. No real credential file was opened.

## Verdict

Merge-ready: **yes, with concerns.** No finding loses a token that base kept. Scenario E is fixed. The sync, single-read and doctor claims hold. One Medium is a disk-growth regression on hosts without `node:sqlite` (M1). It follows the invariant, but nothing bounds it. Record it in the plan as an open question, or fix it before merge if the owner wants it bounded.

## Checks run

| Check | Result |
|---|---|
| Focused tests at HEAD (renewal + retained check) | 89/89 pass |
| HEAD tests on base `src` | 7 fail, the 7 new tests. The sync test passes on base, as the author says |
| Sync test mutants: drop `syncTree(staging)` (:990) / `syncPath(pendingDir)` (:992) / only the file loop in `syncTree` (:662) / only its dir sync (:663) | each mutant **red** ("the staged file", "the pending directory", "the staged file", "the staging directory") |
| Scenario E repro (torn source, 5 pending, only valid oldest, write-back with the real lock) | HEAD: `staged`, 6 pending, valid kept. Base: 5 pending, valid **dropped** |
| architecture + decision-citation guard tests | 47/47; `check-decision-citation-drift.mjs` exit 0 |
| checks/registrations tests in scratch tree | 7 shell-integration failures. They fail the same way on base: the scratch tree is not a git checkout, so the cause is the environment |
| Plan | `status: in-progress`. Q1 and Q11 are recorded as owner-decided. Q4, Q5, Q10, Q12 and Q13 are struck through with answers. RUL75, §13.2 and CHANGELOG `[Unreleased]` match the code |

## Findings

### M1 (Medium, regression in boundedness, follows the invariant): without `node:sqlite`, every omp dispatch adds a full `agent.db` copy, forever

- `copyIsNewer` returns `undetermined` when the copy read fails with `sqlite-unavailable` (`provider-credential-renewal.mjs:571-574`). The pane home is staged even if the pane renewed nothing.
- Apply then defers (`:539`, `:718-719`). `copyFingerprint` returns null, so `capPendingCopies` skips the copy (`:695-696`).
- Repro G: 12 write-backs of pane homes byte-identical to the source, with `loadSqlite: () => null`:
  - HEAD: 12 pending, all `staged`; doctor reports the account over the limit.
  - Base: capped at 5.
- `package.json` has `engines.node >=18`, so Node 18/20 hosts reach this, and so do Node 22.5-22.12 hosts started without `--experimental-sqlite`. This machine (Node 24) does not.
- Cost:
  - Disk: one `agent.db` per dispatch, not per renewal. The omp binary's schema strings show mostly auth tables, so each copy is probably small, but the size was not measured on a real store.
  - Time: an O(N) `applyLeftovers` per dispatch.
- Answer to (b): when copies are readable, growth is one copy per renewal. It only happens while the source entry is unidentified or torn, and the doctor warns. That case is acceptable. The no-sqlite case is not, because it grows with dispatch count.
- Fix: a staged copy whose store files are byte-identical to the source's provably holds the same credential. Make `copyIsNewer` return `not-newer` in that case. Also, when parsing fails, let `capPendingCopies` fall back to a hash of the raw file bytes. Either way nothing is dropped by count.

### L1 (Low, pre-existing, gap in the Q4 rule): a torn copy outside the probe path is still deleted as malformed

- The `torn/` rule exists only in `renewInScratch` (`:878`). Two other paths still delete a half-written copy:
  - **T1:** a dead runner's `scratch-*` leftover with half-written JSON is deleted by `applyLeftovers`, because `unreadable-json` is in `COPY_UNUSABLE_CODES` (`:520`, `:539`, `:725-726`). Repro: the scratch copy is gone and `torn/` is empty.
  - **T2:** a pane home whose `auth.json` was cut off gets `unchanged` (`:573`, `:981`), and its home is removed.
- Both behave identically on base.
- Both pi and Codex rewrite in place:
  - pi: `dist/core/auth-storage.js:66` and `:140`, `writeFileSync` under `proper-lockfile`; checked in the installed package.
  - Codex upstream: `codex-rs/login/src/auth/storage.rs` `FileAuthStorage::save` opens with `truncate(true)`, then `write_all` + `flush`, with no rename and no fsync.
- Why Low: the file is a few KB, so it is written in a single `write()` after `O_TRUNC`. SIGKILL almost always leaves it empty or complete. A torn file therefore rarely holds anything to recover, and a complete one is applied normally. The same reasoning limits what `torn/` itself can recover.
- Recommendation: apply one rule to all three paths, or write in RUL75 that `torn/` covers only probe scratch copies.

### L2 (Low, new): the doctor's over-limit line can be untrue

- The text "none could be shown redundant or obsolete, so none was dropped" (`registrations.mjs:5445`) comes from a plain count (`inspectPendingCopiesOverLimit`, `:610-624`).
- The cap runs only under the lock, so when the lock was busy it may never have run. The new test "staging while the account lock is busy…" builds 7 identical copies, and the doctor would print this line for them.
- Fix: "over the limit; a dispatch that gets the account lock drops identical copies, others are kept".

### L3 (Low, new): a half-written copy is reported only after a day

- `torn/` entries go through `inspectRetainedCredentialCopies` with `minAgeMs = RETAINED_COPY_REPORT_AFTER_MS` (`registrations.mjs:5433`, renewal `:649`).
- A torn copy is an anomaly, not a copy waiting for a renewal. Meanwhile the account sits in `torn-copy` cooldown and the source's refresh token may already be spent.
- Fix: report `kind: 'torn'` at any age, as the over-limit line already is.

## Answers to the author's questions

**(a) Fingerprint = key + refresh + expiry.** Merge-safe; widening is optional (L4 below).

What apply writes, per layout:

| Layout | Apply writes (code) | Fields apply never writes |
|---|---|---|
| pi | the whole entry object, `source.doc[key] = entry.value` (`:284`) | API-key entries and non-oauth entries are not in the fingerprint |
| Codex | `tokens` (access, refresh, `id_token`, `account_id`) and `last_refresh` (`:353-354`) | `OPENAI_API_KEY`, `agent_identity` and the rest of the file |
| omp | `data` plus the copy's `updated_at` (`:440-444`) | `identity_key`, `created_at` (in the omp binary's schema) and `disabled_cause`; disabled rows are excluded from both read and apply |

- So the only fields that can differ between two "duplicates" are inside the applied payload:
  - pi: the access token and other entry fields.
  - Codex: `access_token`, `id_token`, `account_id`.
  - omp: other keys inside `data`.
- Equal refresh token plus equal expiry means the same token response, so the dropped copy carries nothing the kept one lacks.
- Edge cases:
  - Codex `exp` has one-second resolution. Two refreshes of a non-rotating refresh token in the same second yield two valid access tokens; either one works.
  - If a store's refresh field is not recognised, `refreshOf` returns null and the key degenerates to key + expiry. Apply degenerates the same way (`isReplacement`), and this was already so before the branch.
- **L4 (optional, free):** hash what apply would write instead:
  - pi: `entry.value`
  - Codex: `tokens` + `last_refresh`
  - omp: `data` + `updated_at`

  With this, "identical" is provable rather than argued from token-endpoint behaviour. It still dedupes the Q10 case: a re-staged copy of the same home is byte-identical.

**(b)** See M1.

**(c) The `torn/` directory.**
- Nothing applies or deletes from `torn/` automatically:
  - `listLeftovers` reads only `scratch-*` and `pending/` (`:592-601`).
  - The cap reads only `pending/`.
  - `fixCredentialCopiesRetained` only settles held homes.
  - No other code under `src` walks `account-locks/`.
- What goes there: only a probe scratch copy whose own read gave `unreadable-json`. The copy is read first (`:538-539`), so a torn *source* defers and does not go to `torn/`.
- A valid but unrecognised shape gives `unexpected-shape` and is deleted (`:890`). That path is unchanged from base. It could only lose a login if the CLI changed its file format during the call.
- A valid copy cannot land in `torn/` through a read that races the CLI's write. The probe SIGKILLs the process group and resolves only on `close` (`provider-credential-probe.mjs:100-120`).
- Keeping copies forever is acceptable given the invariant, subject to L3.

**(d)** Re-proved: each of the four single-sync removals turns the test red (table above).

**(e) Q4 evidence.**
- pi: confirmed (`auth-storage.js:30`, `:66`, `:140`).
- omp: a Bun-compiled ELF whose embedded JS is readable through `strings`. It shows:
  - `PRAGMA journal_mode=WAL` and `PRAGMA synchronous=NORMAL`;
  - `BEGIN IMMEDIATE`;
  - the `auth_credentials` schema with `identity_key`.

  Row updates are therefore transactional. A kill leaves the previous committed state, not a torn row. NORMAL can lose the last commit on power loss only.
- Codex: not atomic (upstream main, see L1). Because the torn rule keys on `unreadable-json` and not on layout, it already covers Codex scratch copies. The author's report says Codex was not researched; that can now be updated.

**Q13 (single read).** Correct.
- `settleHeldCredentialHome` makes one `writeBackRenewedCredential` call. Its one `copyIsNewer` read decides whether the copy is staged or the home is let go (`:951`, `:981`).
- Each later drop in `applyLeftovers` is decided by that copy's own fresh source read inside apply.
- The cap no longer reads the source.

## Unresolved questions

1. M1: does the owner want growth on hosts without `node:sqlite` bounded by a byte-identity proof before merge, or recorded as an open question?
2. L1: should `torn/` cover a dead runner's scratch copies and pane homes, or should RUL75 state that it covers probe scratch copies only?
3. Size of a real omp `agent.db` (not measured; the real store was not opened).

Status: DONE_WITH_CONCERNS
Summary: Merge-ready. Scenario E is fixed and re-proved, each sync is guarded alone, the single-read decision is correct, nothing touches `torn/` automatically, and the fingerprint is lossless for all three layouts. One Medium: without `node:sqlite`, omp pending copies grow by one per dispatch with no bound.
Concerns/Blockers: M1 (unbounded growth without `node:sqlite`, a regression from base's cap of 5); L1-L3 are Low.
