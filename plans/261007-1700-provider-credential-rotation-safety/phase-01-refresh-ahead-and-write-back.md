---
phase: 1
title: "Forced refresh-ahead under an account lock, and write-back at private-home removal"
status: pending
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 01: Refresh-ahead and write-back

<!-- Updated: Validation Session 1 - omp layout, forced renewal, write-back moved to private-home removal -->

## Overview

Make a rotating login survive concurrent panes. Make the source due and renew it once in the real home before any private home is built from it, and keep a compare-before-write write-back, run when the private home is removed, as a safety net for a pane that outlives the remaining validity.

## Parallel runs: the cases

A source holds access token T1 and refresh token P1. A refresh token is single use (measured for pi, omp and Codex).

| Case | Today | With this phase |
|---|---|---|
| Two panes start on a login inside the window | Each copy renews P1 when its CLI decides to; the second is refused, the account is quarantined as `auth-token` | The first dispatcher takes the account lock, makes the source due, renews it in the real home, releases; the second takes the lock, sees hours left and skips. Both panes copy a login good for hours |
| Provider treats a reused refresh token as theft | The chain may be revoked | Reuse cannot happen while every copy starts fresh |
| Two panes both renew anyway and both are written back | Not applicable | Compare-before-write under the lock: only a later expiry replaces the source |
| A pane outlives the remaining validity | Its renewal is lost with the home | Write-back at private-home removal keeps it |
| The renewal itself fails | Not applicable | Recorded, never blocks the dispatch; the store keeps its refresh token (only the expiry marker was moved earlier, which the CLI renews from next time); the classifier and the lazy probe decide the account state |
| The private home is removed later, by settlement in another process or by the reaper | Not applicable | The write-back runs in the removal path itself, from the marker written at provisioning |

## Requirements

- One account lock per provider account: its own lock directory under the provider-capacity runtime directory (`<runtimeDir>/account-locks/<provider>/<accountId>`), the same `withFileLock` generation-lock shape, separate from `state-lock` so a slow call never holds the state lock. `withFileLock` is synchronous: the renewal spawn is async, so use the lock for the decide-and-mark step and the re-read/record step, and hold mutual exclusion across the spawn with an equivalent async helper in `provider-capacity.mjs` built on the same acquire/release generation functions (do not fork a second lock format). The wait must exceed the probe timeout (90 s) plus margin.
- Layouts and their expiry, read without printing any value:
  - **pi** `home-files` with `auth.json`: any top-level entry with `type: "oauth"` and numeric `expires` (ms; treat values below 1e12 as seconds). No such entry (API key, e.g. OpenRouter) → unreadable → skipped.
  - **omp** `home-files` whose `files` include `agent.db`: SQLite, table `auth_credentials`, rows with `credential_type = 'oauth'` and `disabled_cause IS NULL`, JSON `data.expires` (ms). Open with `node:sqlite` (`DatabaseSync`), loaded lazily; when it cannot be loaded the layout is unreadable. Read-only open for reads.
  - **Codex** `codex-home`: decode the payload of `tokens.access_token` (base64url JWT, no signature check needed) and read `exp` (s).
  - Anything else (agy/Gemini): unreadable → skipped, exactly as today.
- Forced refresh-ahead, in the dispatch path, after the final account is selected (including the fail-over rotation from `1de852877`) and before the private home is provisioned, only when the dispatch is confined (a credential copy will be made) and the expiry is readable and less than `thresholdMs` (default 60 min, injectable) away:
  1. Under the account lock, re-read; if still inside the window, move only the "due" marker in the **real** store: pi/omp `expires` → a past value; Codex `last_refresh` → a timestamp older than its refresh interval. pi/Codex files: write through a temporary file and a rename in the same directory, mode `0600`. omp: `UPDATE auth_credentials SET data = json_set(data, '$.expires', ?) WHERE id = ?` in a transaction (never replace the db file).
  2. Run the probe command (`credentialProbeCommand`) against the real home, still holding the account lock.
  3. Re-read; record the outcome (renewed: expiry moved forward; or failed with the judged detail) and release. Never throw into the dispatch.
- `credentialProbeCommand` learns the omp layout: `home-files` with `agent.db` → `omp -p <PROMPT> --mode json --tools read` with `PI_CODING_AGENT_DIR=<home>`; the probe already ignores stdin (omp waits for EOF on a piped stdin). This also lets the lazy-probe unlock reach the omp xai account.
- Write-back at private-home removal:
  - At provisioning, when the dispatch opted in, write into the private-home ownership marker the credential identity needed later: `provider`, `accountId`, credential `kind`, expanded `home`, the layout name. No token values.
  - `cleanupConfinementResource` (the one removal path used by the driver cleanup, `finalizeConfinementResources` and the reaper) calls the write-back before deleting, when the marker carries that field. A write-back error is reported on stderr and never prevents the removal.
  - Rule: under the account lock, read the copy and the source; the copy must parse and have the expected shape; replace only when the copy's expiry is strictly later. pi/Codex: temp file + rename, `0600`. omp: update the matching row (`provider` + `identity_key`, or the single oauth row when only one exists) in a transaction, `data` only.
  - A retained home (failed pane left open, `markResourceRetained`) is written back when it is finally removed, by the same path.
- Opt-in by function, like the lazy probe: `executeAssignment` takes `providerCredentialRenew` (an object or function created by `createCredentialRenewal()` holding threshold, spawn and lock wait); the four callers that pass `providerCredentialProbe` (`dispatch/cli.mjs` ×2, `operation-choice.mjs`, `execution/run.mjs`) pass the real one. A caller that passes none changes nothing, and no marker field is written, so removal is byte-identical too.
- No token value in any log, event, error message, marker or test output.

## Architecture

```
executeAssignment
  select account (+ fail-over)  ──►  providerCredentialRenew.refreshAhead({provider, accountId, credentialSource})
                                        account lock ─ read expiry ─ mark due ─ spawn probe in real home ─ re-read ─ release
  prepareConfinementForLaunch ──► bwrap provisionSelectedCodexCredential
                                        copy listed files ─ writeOwnershipMarker(+ credentialWriteBack when opted in)
  ... pane runs ...
  cleanup / finalizeConfinementResources / reaper
        └► cleanupConfinementResource ─ marker.credentialWriteBack? ─ writeBackIfNewer ─ rm
```

## Related Code Files

- Create: `src/runner/dispatch/provider-credential-renewal.mjs` (layout detection, expiry read, mark-due, `refreshAhead`, `writeBackIfNewer`; reuses `credentialProbeCommand`, `judgeProbeOutput`).
- Modify: `src/runner/dispatch/provider-credential-probe.mjs` (omp layout), `src/runner/dispatch/provider-capacity.mjs` (account lock path + async lock helper on the existing generation lock), `src/runner/dispatch/assignment-runner.mjs` (call after final selection, before provisioning; pass the opt-in to the confinement request), `src/runner/dispatch/confinement/drivers/bwrap.mjs` (marker field at provisioning), `src/runner/dispatch/confinement/cleanup.mjs` (write-back before removal), the four callers.
- Tests: new `test/runner/provider-credential-renewal.test.mjs`; extend the probe and cleanup tests that exist.
- Docs: `docs/specs/runner.md` (refresh-ahead + write-back rule; move the lazy-probe unlock rule out of `docs/specs/distribution.md` row 5d into it, leave a pointer), `docs/specs/confinement-authority.md` (one line: the private home receives a renewed copy; a newer copy is written back at removal), `CHANGELOG.md` `[Unreleased]`, `docs/architecture-manifest.json` (new module).

## Implementation Steps

1. Read the current code paths named above on the worktree HEAD; confirm the four callers and the removal paths.
2. Test-first, with temp dirs and an injectable spawn (never the real CLIs, never real tokens; fixtures use obviously fake strings):
   - expiry read per layout (pi oauth/API-key, omp row/no row/disabled row/no `node:sqlite`, Codex JWT, unknown layout);
   - two concurrent `refreshAhead` calls → one spawn; outside the window → no spawn; unreadable → no spawn; spawn failure/timeout → no throw, store refresh token unchanged;
   - mark-due touches only the expiry marker (other fields byte-equal);
   - write-back: newer copy replaces; older/equal/unreadable/malformed copy leaves the source byte-equal; omp row update keeps other rows and columns;
   - removal without the marker field: identical to today; with it: write-back then removal; write-back error still removes.
3. Implement the module, the lock helper, the probe extension.
4. Wire into `assignment-runner.mjs`, bwrap provisioning marker, `cleanupConfinementResource`, and the four callers.
5. Run targeted tests, then `env -u CLAUDE_CODE_SESSION_ID npm test`.
6. Real check once (the Lead or a verifier, not the builder): on omp xai, with the source inside the window (or by using a threshold larger than the remaining validity), two confined dispatches started together → one renewal recorded, both runs answer, a later plain `omp -p` from the source answers. Evidence: fingerprints (short sha256) and expiry deltas only.
7. Move the spec text to its owners, update the changelog and the architecture manifest.

## Success Criteria

- [ ] Concurrency test: two callers, one spawn.
- [ ] Byte-identical behaviour without the opt-in (tests cover provisioning and removal).
- [ ] Write-back never replaces a newer or equal source; never touches the source on a bad copy.
- [ ] omp layout handled through row updates; db file never replaced.
- [ ] Full suite green; real check evidence recorded with fingerprints only.
- [ ] Spec text in `runner.md` and `confinement-authority.md`; unlock rule moved out of `distribution.md`.

## Risk Assessment

- **Mark-due then the renewal fails**: the store's refresh token is unchanged; the CLI renews from it on the next call. Signal: outcome `failed` recorded. Response: none needed beyond the record; repeated failure ends in the existing `auth-token` quarantine path.
- **A live CLI in the real home writes the store at the same moment** (the unconfined `omp-cli-vantt` invocation uses the real profile): omp writes go through SQLite transactions, ours too; pi/Codex file writes can race a CLI rewrite. Mitigation: re-read and compare expiry inside the lock right before writing; never write when the source is already later.
- **omp WAL**: a running omp in the real profile may hold newer rows in `agent.db-wal`, which the plain file copy (`copyHomeFiles`) does not carry. Out of scope to change the copy; after a successful renewal run `PRAGMA wal_checkpoint(PASSIVE)` so the copy made next sees the renewed row. Signal: the real check shows a pane renewing right after a fresh renewal. Response: replan the copy for SQLite layouts.
- **The CLI's own "due" rule differs from what we mark** (e.g. Codex interval): the real check proves it. Signal: expiry does not move after a forced renewal. Response: adjust the mark-due value for that layout; if it cannot be forced, skip that layout and keep only the write-back.
- **Renewal cost**: one small request per account per window. Only inside the threshold.
- **Rollback**: stop passing the function (one line per caller); markers without the field are removed as today; the only new persisted thing is the account-lock directory.
- **Reuse revokes the chain** and a race still slips through: the owner logs in again and the lazy probe (now omp-aware) unlocks the account.

## Validation

Targeted tests first, then the dispatch, confinement, setup and architecture suites, then `env -u CLAUDE_CODE_SESSION_ID npm test`. Fingerprints in any evidence, never values.
