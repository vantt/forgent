---
title: "Provider credential rotation safety: refresh once at the source, write back what a pane renewed"
description: "A pane that renews a rotating login inside its throwaway home strands the source login; design for a refresh-ahead done in an fgOS-held scratch copy under an account lock, plus a compare-before-write write-back of copies renewed inside panes."
status: in-progress
priority: P1
branch: feat/provider-credential-rotation-safety
tags: [dispatch, provider-capacity, credentials, concurrency, confinement]
created: 2026-10-07
revalidated: 2026-10-12
---

# Provider credential rotation safety

## Why

Dispatch copies an account's credential files into a private home that is thrown away after the run. A renewal inside that copy uses up the source's refresh token on the provider's side and the new pair is lost with the home. The next renewal anywhere fails with `invalid_grant`, which is what the old pi xai login showed on 2026-10-07 03:18 UTC.

What is proven and what is not (re-measured 2026-10-12, fingerprints only):

| Claim | State |
|---|---|
| pi: a renewal replaces the refresh token | **Measured** 2026-10-07 on the old pi account `grok-vantt` (no longer in the inventory) |
| omp (xai, account `vantt`, profile `${HOME}/.omp/profiles/xai-vantt/agent`): a renewal replaces the refresh token | **Measured** 2026-10-12: access expired 216 min, one `omp -p` call in the real profile, access and refresh fingerprints both changed, new expiry +6 h, call answered OK |
| Codex (account `tetcu72`): a renewal replaces the refresh token | **Measured** 2026-10-12: access JWT expired 7.2 h, `last_refresh` 10 days old, one `codex exec` in the real home, both fingerprints changed, new JWT `exp` +240 h, `last_refresh` updated |
| Where each layout keeps its expiry | pi `auth.json`: `<provider>.expires` (ms). omp `agent.db`: table `auth_credentials`, column `data` (JSON) field `expires` (ms), one row per credential. Codex `auth.json`: `exp` claim of the `tokens.access_token` JWT; Codex also renews when `last_refresh` is older than its interval |
| When the CLI itself renews | pi: only when less than **5 min** is left (`DEFAULT_OAUTH_MINIMUM_VALIDITY_MS = 300*1e3` in the pi bundle). omp: at or near expiry (`Date.now() >= expires` in the binary). Codex: after `last_refresh` ages past its interval or on expiry. **So a plain call made with 30 min left renews nothing**; refresh-ahead must make the source look due first (see phase 01) |
| The old refresh token is rejected after a renewal | **Not tested on purpose**: reuse may make a provider revoke the whole chain |
| Gemini (agy homes, e.g. `~/.agy-homes/tetcu72`) | **Measured** 2026-10-13: store `.gemini/antigravity-cli/antigravity-oauth-token` (JSON `token.access_token`, `token.refresh_token`, `token.expiry` ISO, 1 h access). Access expired 4.5 days, one `agy -p` in the real home: access and id token fingerprints changed, new expiry +1 h, **refresh token fingerprint unchanged**, call answered OK. agy does not rotate its refresh token, so a renewal inside a copy strands nothing; left as today (no refresh-ahead, no write-back needed) |
| OpenRouter (`z-ai`, pi `auth.json`) | An API key, no `expires`: left as today |

Code read (main @ `97ca636f9`): fgOS provisions credentials in `src/runner/dispatch/confinement/drivers/bwrap.mjs` (`provisionSelectedCodexCredential`, `copyHomeFiles`), only the listed files, `agent.db` without its WAL. The private home is removed on three paths: the herdr driver `cleanup` (`cleanupConfinementResource`), `finalizeConfinementResources` (`authority.mjs`, its own `fs.rmSync`, the only removal on the cli-spawn path; also reached from `settlement.mjs`, possibly in a later process) and the orphan reaper; all before `releaseSelectedProviderLease`. `withFileLock` waits with `Atomics.wait`, blocking the event loop. `credentialProbeCommand` (`provider-credential-probe.mjs`) knows Codex and pi `auth.json` only, so the lazy-probe unlock cannot probe the omp xai account today.

## Scope

In: renew the login once in an fgOS-held scratch copy, under an account lock, and apply the newer entry to the real store before a private home is created from it; stage and apply a login renewed inside a pane when its private home is removed, only when newer; copy `agent.db` as a consistent SQLite snapshot; teach the probe command the omp layout; tests; the spec text in its owning documents.

Out: changing which files are copied (the allow list stays), binding the real home into the confinement, any change to executor, model or policy selection, calling a provider's OAuth endpoint directly, editing `~/.fgos/config.json`.

## Phases

| # | Phase | Depends on | Exit |
|---|---|---|---|
| 01 | [Refresh-ahead and write-back](phase-01-refresh-ahead-and-write-back.md) | none open (see Constraints) | Behaviour proven by tests and one real scratch renewal; spec moved to its owners |
| 02 | [Pending-copy safety and read-only follow-ups](phase-02-pending-copy-safety.md) | 01 | Pending copies never lost to the limit; sync, single-read and half-written-copy rules proven by tests; open questions 1, 4, 5, 10-13 answered |

## Constraints

- (2026-10-12) The advisory capability work no longer blocks: path M is on main, and `feat/advisory-capability-completion` holds only a frozen pre-M snapshot commit (`0e8433c0c`, 2026-10-08). The dispatch hygiene plan (261009-1400) is archived. Re-check `git log main -- src/runner/dispatch` before editing shared files.
- A parallel session edits the distribution area and merges first. Only `CHANGELOG.md` `[Unreleased]` and `docs/specs/distribution.md` can collide: rebase and resolve there.
- Spec text belongs in `docs/specs/runner.md` (provider capacity) and `docs/specs/confinement-authority.md` (credential provisioning into the private home), not `docs/specs/distribution.md`. The gloss rule of the citation guard applies to every id cited.
- Never print a token value in a log, a test, an event or a report: fingerprints and booleans only.
- Never reuse an old refresh token on a real account. Never edit `~/.fgos/config.json`.

## Acceptance criteria

- Two dispatches that start together on an account inside the refresh-ahead window cause exactly one renewal, and both runs start with a login that is good for hours. The real store is never written with a past expiry.
- A renewed login written back never replaces a newer one, and a failed, unreadable or malformed copy never touches the source.
- With no renewal function passed, refresh-ahead and write-back are off and private-home removal is byte-identical to today (the same opt-in shape as the lazy probe). The SQLite snapshot copy and the omp probe branch apply regardless.
- One real scratch renewal (omp xai) leaves the source usable for a second call; evidence is fingerprints.
- Spec text sits in `runner.md` and `confinement-authority.md`; the unlock rule moves from `distribution.md` to `runner.md` in the same change.

## Open questions

1. Does xAI, or OpenAI for Codex, revoke the whole token chain on reuse of an old refresh token? Decides how bad a lost race is, not whether the design is needed. Not to be tested on a real account. Docs research 2026-10-13 ([report](reports/research-261013-1221-refresh-token-reuse-revocation.md)): neither provider documents family revocation. OpenAI (maintainer, openai/codex#10332): an old refresh token still works for about an hour, then fails permanently with 401 `refresh_token_reused`; Codex re-reads `auth.json` before refreshing and adopts a newer pair. xAI: single use, `invalid_grant: Refresh token has been revoked`, no grace window seen, nothing documented. Whether a replay also kills the newer token stays unknown for both, so the design keeps assuming the worst case (a lost race can force a full re-login). Decided 2026-10-13 (owner): not tested on a real account; stays open as a documented risk.
2. ~~Does the agy (Gemini) login rotate at all?~~ Answered 2026-10-13: no, the refresh token stays the same across a renewal (see the measurement table). Nothing to do.
3. ~~Should `fgos doctor` report a pending copy that stays unidentified (its entry cannot be matched to the source), since it holds a refresh token silently?~~ Answered 2026-10-13: yes, check `credential-copies-retained` (pending/scratch copies older than a day, and held homes; counts and ages only).
4. ~~Should a torn scratch copy (a probe killed at its time limit mid-write) be kept for hand recovery instead of deleted as unreadable?~~ Answered 2026-10-13 by reading the installed CLIs: pi does NOT write its store atomically (the `@earendil-works/pi-coding-agent` package, `core/auth-storage.js:66` and `:140` in its built output: `writeFileSync(this.authPath, next, ...)` truncates and rewrites in place, under a `proper-lockfile` lock that fgOS does not take); omp commits row updates through SQLite (the `omp` binary holds `INSERT INTO auth_credentials` and `UPDATE auth_credentials` statements and `PRAGMA journal_mode` / `wal_checkpoint`, so a cut-off leaves the old row, never a torn one). So a pi scratch copy cut off mid-write can be half a login: such a copy is now kept under `torn/` for hand recovery (never applied or dropped automatically, reported by the doctor check). Phase 02.
5. ~~Pending cap keeps the 5 newest copies.~~ Answered 2026-10-13 (phase 02): the cap now runs only under the account lock after the apply attempt and drops only copies whose logins are identical to another pending copy's (fingerprint compared in memory); when it still cannot get under five it drops nothing and `fgos doctor` reports the account.
6. A pending copy whose apply hits an operating-system read error (EACCES, EIO, EMFILE) is deleted as malformed, because `unreadable-file` covers both a missing file and a read error. Split the code. Done 2026-10-13: `missing-file` (proven empty) versus `unreadable-file` (kept).
7. A home kept because staging failed (`credential-home-kept`) is retried by the reaper without a time or attempt limit, outlives the reaper's age limit, and `fgos doctor --fix` cannot clear it; the finalizer's early stop also leaves that dispatch's other resources on disk. Needs a limit and a doctor check. Done 2026-10-13: five attempts counted in the marker, then held (never deleted by age), the finalizer continues, doctor reports it.
8. Not fixed, left from before: a `.tmp-*` staging directory left by a crash during staging is skipped by the leftover listing, so nothing reports or removes it, and it may hold a partial copy of a login. Needs a doctor line or a sweep.
9. Reopened 2026-10-13 with a narrower scope: refresh-ahead, doctor, `--fix` and the reaper now search the default temp root plus each registered backend's own `tempRoot`, but a home allocated under a backend's separate `privateHomeRoot` (`resources.mjs`: `privateHomeRoot || tempRoot || default`) is in none of them, so a held home there is never reported or re-checked (it is never deleted either). This machine configures no `privateHomeRoot`. Not fixed.
10. ~~A crash between staging a copy and removing its home leaves both; a later settle stages the same login again.~~ Answered 2026-10-13 (phase 02): the duplicates are the first thing the cap drops.
11. Decided 2026-10-13 (owner): accepted as is. A held home that cannot be settled costs every dispatch of its account one lock attempt; `fgos doctor` already fails on such a home.
12. ~~The staged-copy sync test counted all syncs.~~ Answered 2026-10-13 (phase 02): the test stubs the lock and checks the staged file, the staging directory and the pending directory each; removing any one sync turns it red.
13. ~~The held-home guard and the write-back each read the source.~~ Answered 2026-10-13 (phase 02): the guard is gone; nothing is dropped to make room, so no read decides a drop. Test: the source flips between two reads and the only valid pending copy survives.
14. A scratch home a dead runner left, and a pane home whose store was cut off mid-write, are still removed when their JSON cannot be read; only the probe's own scratch copy goes to `torn/`. Small risk, not fixed.
15. The real size of an omp `agent.db` was not measured (no real store was opened), so the disk cost of copies kept without `node:sqlite` is unknown.
16. What omp writes next to `agent.db` on each run (write-ahead log, or a rollback journal) and how large a real `agent.db` is were not measured (no real store was opened). The tests use fake bytes for the log and journal, not a real hot journal.

## Validation Log

- Component boundary: confinement now calls the credential renewal module when removing a private home (dependency confinement → provider capacity, for the account lock only); `docs/platform/component-boundary.md` and `docs/specs/confinement-authority.md` §13.2 updated.

### Session 1 — 2026-10-12 (re-validation against main @ `97ca636f9`)

#### Verification Results
- Claims checked: 14
- Verified: 7 | Failed: 7 | Unverified: 0
- Tier: Light (1 phase), widened because the plan was five days and ~50 commits old
- Failures (all corrected in this session):
  1. xai runs through omp, not pi; account `vantt` with `agent.db` (SQLite, WAL), not `grok-vantt` with `auth.json` (`.fgos/config.json` executor `xai`, `~/.fgos/config.json` providers.xai).
  2. "One real call when less than 30 min is left" renews nothing: pi renews only inside 5 min, omp at expiry.
  3. Write-back "at the lease-release placement" is too late: the private home is already removed by `cleanupConfinementResource` (driver cleanup, `finalizeConfinementResources`, reaper), sometimes in another process.
  4. `credentialProbeCommand` cannot run omp (`agent.db` layout), so reusing it as-is gives no renewal call for xai.
  5. A file-rename write-back is unsafe for `agent.db` (live SQLite WAL database the real omp may hold open); it must be a row update in a transaction.
  6. Codex accounts are now only `tetcu72` (fgovn, tetnu are gone); its expiry is the JWT `exp` claim (open question 3 answered).
  7. Account fail-over (`1de852877`) can switch the selected account after the first lease; refresh-ahead must run for the account actually provisioned.

#### Decisions (taken by the planner from evidence; no option was close)
- **Forced refresh-ahead** (superseded by the red team: now done in a scratch copy, see below): under the account lock, rewrite the expiry marker in the real store, run the probe in the real home, re-read. Rejected: threshold equal to the CLI's own window (leaves the concurrent-pane race for any pane started in the last pane-length before expiry); calling OAuth endpoints directly (owns other projects' client contracts).
- **Threshold**: 60 min by default, injectable. omp/pi tokens live 6 h, Codex 240 h; panes run minutes to tens of minutes.
- **Write-back placement**: at private-home removal, driven by a field written into the ownership marker at provisioning time only when the dispatch opted in (red team: through one shared removal function).
- **omp store access**: `node:sqlite` loaded lazily; when the module is not available the layout counts as unreadable and is left as today.

### Red Team Review

Report: [reports/red-team-261012-2345-credential-rotation-plan-review.md](reports/red-team-261012-2345-credential-rotation-plan-review.md) (Opus reviewer, code read only). 12 findings; all accepted, decided by the planner:

| # | Sev | Finding | Disposition |
|---|---|---|---|
| 1 | Critical | Write-back unreachable on cli-spawn: `finalizeConfinementResources` removes the home with its own `fs.rmSync` | Accepted: one shared removal function for driver cleanup, finalize and reaper |
| 2 | High | A failed renewal leaves the real store marked due, so every later pane renews in its copy | Accepted, redesigned: the due marker is set only in an fgOS scratch copy; the real store is never marked due; failure cooldown |
| 3 | High | Detached probe survives a dead runner; lock reclaim lets a second renewal redeem the same token | Accepted: child pid in the lock holder; leftover scratch copy applied by the next holder |
| 4 | High | `Atomics.wait` lock blocks the event loop; seats in one process deadlock | Accepted: async acquire for waiting callers; sync callers try once and stage |
| 5 | High | Copy of `agent.db` omits the WAL; checkpoint PASSIVE is not a guarantee | Accepted: copy `agent.db` with `VACUUM INTO` |
| 6 | High | Marking the real store due makes the owner's own CLIs renew concurrently | Accepted: resolved by the scratch-copy design |
| 7 | High | Codex renews on `last_refresh` interval, not only JWT `exp` | Accepted: due time = min(exp, last_refresh + interval), interval cited from Codex source |
| 8 | Medium | Copy made outside the lock could catch a store marked due | Moot: the real store is never marked due; apply is atomic |
| 9 | Medium | Several credentials per store; whole-file replace can roll back other entries | Accepted: apply merges only the matching entry/row |
| 10 | Medium | `JSON.parse` messages quote input (token fragments) | Accepted: fixed error codes only |
| 11 | Low | Factual slips (marker order, fallback vs rotation site, lazy probe lock, probe branch order) | Accepted: corrected in phase 01 |
| 12 | Low | Defer write-back; threshold ≥ timeout | Threshold accepted (`max(60 min, timeout + 5 min)`). Deferral rejected: the owner asked for full scope and write-back reuses the same apply function |

Superseded from validation session 1: "rewrite the expiry marker in the real store" (replaced by the scratch copy), "write-back inside `cleanupConfinementResource`" (now the shared removal function), "`PRAGMA wal_checkpoint` after renewal as the WAL answer" (now `VACUUM INTO` for the copy).

### Whole-Plan Consistency Sweep
- Re-read `plan.md` and phase 01 after the red-team edits. Searched for: `grok-vantt`, `30 min`, `lease-release`, `mark due` on the real store, `wal_checkpoint`, `forced renewal`. Remaining mentions are historical (measurement table, superseded list) or intentional (checkpoint as best effort after an omp row update).
- Unresolved contradictions: 0.
