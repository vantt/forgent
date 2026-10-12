---
title: "Provider credential rotation safety: refresh once at the source, write back what a pane renewed"
description: "A pane that renews a rotating login inside its throwaway home strands the source login; design for a forced refresh-ahead under an account lock plus a compare-before-write write-back at private-home removal."
status: pending
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
| Gemini (agy homes) | **Unknown**: no expiry field or renewal behaviour read; left as today |
| OpenRouter (`z-ai`, pi `auth.json`) | An API key, no `expires`: left as today |

Code read (main @ `97ca636f9`): fgOS provisions credentials in `src/runner/dispatch/confinement/drivers/bwrap.mjs` (`provisionSelectedCodexCredential`, `copyHomeFiles`), only the listed files. The private home is removed by `cleanupConfinementResource` (`confinement/cleanup.mjs`), reached from the driver `cleanup`, from `finalizeConfinementResources` (assignment-runner and `settlement.mjs`, possibly in a later process) and from the orphan reaper; all of these run **before** `releaseSelectedProviderLease`. `credentialProbeCommand` (`provider-credential-probe.mjs`) knows Codex and pi `auth.json` only, so the lazy-probe unlock cannot probe the omp xai account today.

## Scope

In: make the source login due and renew it once in the real home, under an account lock, before a private home is created from it; write a renewed login back when the private home is removed, only when it is newer; teach the probe command the omp layout; tests; the spec text in its owning documents.

Out: changing which files are copied (the allow list stays), binding the real home into the confinement, any change to executor, model or policy selection, calling a provider's OAuth endpoint directly, editing `~/.fgos/config.json`.

## Phases

| # | Phase | Depends on | Exit |
|---|---|---|---|
| 01 | [Refresh-ahead and write-back](phase-01-refresh-ahead-and-write-back.md) | none open (see Constraints) | Behaviour proven by tests and one real forced renewal; spec moved to its owners |

## Constraints

- (2026-10-12) The advisory capability work no longer blocks: path M is on main, and `feat/advisory-capability-completion` holds only a frozen pre-M snapshot commit (`0e8433c0c`, 2026-10-08). The dispatch hygiene plan (261009-1400) is archived. Re-check `git log main -- src/runner/dispatch` before editing shared files.
- A parallel session edits the distribution area and merges first. Only `CHANGELOG.md` `[Unreleased]` and `docs/specs/distribution.md` can collide: rebase and resolve there.
- Spec text belongs in `docs/specs/runner.md` (provider capacity) and `docs/specs/confinement-authority.md` (credential provisioning into the private home), not `docs/specs/distribution.md`. The gloss rule of the citation guard applies to every id cited.
- Never print a token value in a log, a test, an event or a report: fingerprints and booleans only.
- Never reuse an old refresh token on a real account. Never edit `~/.fgos/config.json`.

## Acceptance criteria

- Two dispatches that start together on an account inside the refresh-ahead window cause exactly one renewal, and both runs start with a login that is good for hours.
- A renewed login written back never replaces a newer one, and a failed, unreadable or malformed copy never touches the source.
- With no renewal function passed, behaviour is byte-identical to today (the same opt-in shape as the lazy probe), including private-home removal.
- One real forced renewal (omp xai) leaves the source usable for a second call; evidence is fingerprints.
- Spec text sits in `runner.md` and `confinement-authority.md`; the unlock rule moves from `distribution.md` to `runner.md` in the same change.

## Open questions

1. Does xAI, or OpenAI for Codex, revoke the whole token chain on reuse of an old refresh token? Decides how bad a lost race is, not whether the design is needed. Not to be tested on a real account.
2. Does the agy (Gemini) login rotate at all? Left as today until read.

## Validation Log

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
- **Forced refresh-ahead**: under the account lock, if the source has less than the threshold left, rewrite only the expiry marker in the real store so the CLI sees it as due (pi/omp `expires` set in the past; Codex `last_refresh` set past its interval), then run the probe command in the real home, then re-read. Rejected: threshold equal to the CLI's own window (leaves the concurrent-pane race for any pane started in the last pane-length before expiry); calling OAuth endpoints directly (owns other projects' client contracts).
- **Threshold**: 60 min by default, injectable. omp/pi tokens live 6 h, Codex 240 h; panes run minutes to tens of minutes.
- **Write-back placement**: inside the single private-home removal path, driven by a field written into the ownership marker at provisioning time only when the dispatch opted in. Covers the normal cleanup, `finalizeConfinementResources` in a later process, and the reaper.
- **omp store access**: `node:sqlite` loaded lazily; when the module is not available the layout counts as unreadable and is left as today.

### Red Team Review
Pending (session 1, step 2).
