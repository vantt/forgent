---
phase: 1
title: "Refresh-ahead under an account lock, and write-back when newer"
status: pending
priority: P1
effort: "1d"
dependencies: []
---

# Phase 01: Refresh-ahead and write-back

## Overview

Make a rotating login survive concurrent panes. Renew it once at the source before any private home is built, and keep a compare-before-write write-back as a safety net for a pane that outlives the remaining validity.

## Parallel runs: the cases

A source holds access token T1 and refresh token P1. A refresh token is single use.

| Case | Today | With this phase |
|---|---|---|
| Two panes start on an expired login | The first renews P1 into P2; the second sends P1 and is refused, so a healthy login looks dead and the account is locked | The first dispatcher takes the account lock, renews the source, releases; the second sees a fresh token and skips the renewal. Both panes copy a login that is good for hours |
| The provider treats a reused refresh token as theft | Both panes fail and the chain may be revoked | The reuse cannot happen: no pane renews while the source is fresh |
| Two panes both renew (a tolerant provider) and both write back | Not applicable | Compare-before-write: only a copy with a later expiry replaces the source, under the lock, so an older write never wins |
| A pane runs longer than the remaining validity | Its renewal is lost | The write-back after settlement keeps it, under the same rule |
| The renewal itself fails | Not applicable | Recorded, never blocks the dispatch; the existing classifier and lazy probe decide the account state |

## Requirements

- One account lock per provider account (own lock directory under the provider-capacity runtime directory, the same `withFileLock` shape), separate from the state lock so a slow call never holds the state lock.
- Refresh-ahead runs in the dispatch path before the credential is provisioned, only when the access token has less than the threshold left, and only for credential layouts whose expiry fgOS can read. A layout it cannot read is left as today.
- The renewal is one real call against the **real home** (as the lazy probe does), never a copy; the real home is where the renewed pair must land.
- Write-back runs after a pane settles: compare the copy's `auth.json` with the source's, replace only when the copy's expiry is later, through a temporary file and a rename in the same directory, mode `0600`, under the account lock, validating that the copy parses and has the expected shape first.
- Opt-in by function, like the lazy probe: `executeAssignment` takes `providerCredentialRenew`; the callers pass the real one; a caller that passes none changes nothing.
- No token value in any log, event or test output.

## Related files

- Create: `src/runner/dispatch/provider-credential-renewal.mjs` (expiry reading per layout, the renewal call, compare-before-write write-back; reuse `credentialProbeCommand` and `AUTH_FAILURE_PATTERNS`).
- Modify: `src/runner/dispatch/provider-capacity.mjs` (account lock path helper), `src/runner/dispatch/assignment-runner.mjs` (call before provisioning, write-back at settlement; reuse the lease-release helper's placement), the four callers that already pass the lazy probe.
- Docs: `docs/specs/runner.md` (new rule; move the unlock rule out of `distribution.md`), `docs/specs/confinement-authority.md` (one line on renewal and write-back), `CHANGELOG.md`, `docs/architecture-manifest.json`.

## Steps

1. Read the access token expiry per layout: pi `home-files` with `auth.json` (field `expires`, milliseconds or seconds); Codex (find the expiry before relying on `last_refresh`); other layouts: not renewed.
2. Write the account lock helper and the renewal function with an injectable spawn, as the probe does.
3. Test-first: two concurrent callers produce one renewal; threshold boundary; a layout with no readable expiry is skipped; a failed renewal never throws into the dispatch; write-back replaces only a newer copy and leaves the source alone for an older, equal, unreadable or malformed copy.
4. Wire into `assignment-runner.mjs` and the four callers.
5. Real check once, after an access token expiry, on xai: two dispatches started together, one renewal, a later call from the source still works.
6. Move the spec text to its owners and update the changelog.

## Risks and rollback

- A renewal call costs a small request per account per several hours. Mitigation: only inside the threshold window.
- A wrong threshold renews too late and the old problem returns for one run; the write-back is the second line.
- Rollback: stop passing the function (one line per caller); stored state is unchanged because nothing new is persisted except the lock directory.
- If the provider revokes a chain on reuse and a race still slips through, the owner logs in again and the lazy probe unlocks the account; no data is lost.

## Validation

Targeted tests first, then the dispatch, setup and architecture suites, then the full suite. Keep fingerprints (a short hash) in any evidence, never values.
