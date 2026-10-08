---
title: "Provider credential rotation safety: refresh once at the source, write back what a pane renewed"
description: "A pane that renews a rotating login inside its throwaway home strands the source login; design for refresh-ahead under an account lock plus a compare-before-write write-back."
status: pending
priority: P1
branch: main
tags: [dispatch, provider-capacity, credentials, concurrency, confinement]
created: 2026-10-07
---

# Provider credential rotation safety

## Why

Measured 2026-10-07 on the xai login (pi account `grok-vantt`): renewing an expired access token also **replaces the refresh token** (both values changed, the new expiry was six hours out). Dispatch copies the account's credential files into a private home that is thrown away after the run, so a renewal inside that copy uses up the source's refresh token and the new pair is lost with the home. The next renewal anywhere fails with `invalid_grant: Invalid or unknown refresh token`, which is what the account showed on 2026-10-07 03:18 UTC.

What is proven and what is not:

| Claim | State |
|---|---|
| A renewal replaces the xai refresh token | **Measured** (copy made to look expired, one `pi -p` call, fingerprints compared) |
| Copying the renewed `auth.json` back to the source keeps the login usable | **Measured** (a call from the source after the write-back succeeded; no re-login needed) |
| The old refresh token is rejected after a renewal | **Not tested on purpose**: reuse may make a provider revoke the whole chain and force a re-login |
| This caused the two earlier `invalid_grant` incidents | **Fits, not proven**: no xai pane has a clear success after an access token expiry to compare against |
| Codex has the same problem | **Unverified**. Codex `last_refresh` of fgovn, tetcu72 and tetnu is 2026-10-02, so a first renewal inside a copy may come around 2026-10-10 |
| Gemini (agy homes) | **Unknown**: no expiry field or renewal behaviour was read |

Code read: the pi bundle renews through `refreshStoredOAuthCredential`, a read-modify-write under a store lock, a design that only makes sense for single-use refresh tokens. fgOS provisions credentials in `src/runner/dispatch/confinement/drivers/bwrap.mjs` (`provisionSelectedCodexCredential`, `copyHomeFiles`): only the listed files, never the whole home (confinement spec, private home).

## Scope

In: refresh the source login once, under an account lock, before a private home is created from it; write a renewed login back after a pane settles, only when it is newer; tests; the spec text in its owning documents.

Out: changing what is copied (the allow list stays), binding the real home into the confinement, any change to executor, model or policy selection, the lazy-probe unlock (already on main; it calls with the real home, so it already renews in place).

## Phases

| # | Phase | Depends on | Exit |
|---|---|---|---|
| 01 | [Refresh-ahead and write-back](phase-01-refresh-ahead-and-write-back.md) | the advisory capability agent finishing (shared dispatch and confinement writer) | Behaviour proven by tests and one real renewal; spec moved to its owners |

## Constraints

- The advisory capability plan (`feat/advisory-capability-completion`) states no provider, transport or confinement change and keeps one writer for shared runtime and `docs/specs/runner.md`. Do not start phase 01 until it has landed, or until its owner agrees.
- Spec text belongs in `docs/specs/runner.md` (provider capacity) and `docs/specs/confinement-authority.md` (credential provisioning into the private home), not `docs/specs/distribution.md`. The gloss rule of the citation guard applies to every id cited.
- Never print a token value in a log, a test or a report: fingerprints and booleans only.

## Acceptance criteria

- Two dispatches that start together on an account whose access token is about to expire cause exactly one renewal, and both runs start with a login that works.
- A renewed login written back never replaces a newer one, and a failed or unreadable copy never touches the source.
- With no refresh function passed, behaviour is byte-identical to today (the same opt-in shape as the lazy probe).
- One real renewal after an expiry (xai) leaves the source usable for a second call.
- Spec text sits in `runner.md` and `confinement-authority.md`; the unlock rule moves from `distribution.md` to `runner.md` in the same change.

## Open questions

1. Does xAI, or OpenAI for Codex, revoke the whole token chain on reuse of an old refresh token? Decides how bad a lost race is, not whether the design is needed.
2. How early is "about to expire"? Proposed 30 minutes; a pane normally runs for minutes.
3. Where does Codex expose its access token expiry (the file has `last_refresh` and tokens)? Until known, Codex is refreshed on the 8 day assumption only if confirmed, otherwise skipped.
4. Does the agy (Gemini) login rotate at all?
