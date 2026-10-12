---
phase: 1
title: "Refresh-ahead in an fgOS-held scratch copy, and write-back of renewed copies"
status: pending
priority: P1
effort: "2d"
dependencies: []
---

# Phase 01: Refresh-ahead and write-back

<!-- Updated: Validation Session 1 - omp layout, forced renewal, write-back moved to private-home removal -->
<!-- Updated: Red Team Session 1 - renewal moved into a scratch copy; real store never marked due; async lock; shared removal; VACUUM INTO copy; Codex due time -->

## Overview

Make a rotating login survive concurrent panes. Before a private home is built from an account, renew the login once, inside a scratch copy that fgOS owns, and apply the renewed pair to the real store with compare-before-write. Renewals that still happen inside a pane's private home are staged when the home is removed and applied the same way. The real store is never made to look expired.

## Parallel runs: the cases

A source holds access token T1 and refresh token P1. A refresh token is single use (measured for pi, omp and Codex).

| Case | Today | With this phase |
|---|---|---|
| Two panes start on a login inside the window | Each copy renews P1 when its CLI decides to; the second is refused, the account is quarantined `auth-token` | The first dispatcher takes the account lock, renews in a scratch copy, applies the new pair to the source, releases; the second sees hours left and skips. Both panes copy a login good for hours |
| The owner's own omp/pi/Codex session runs on the same home meanwhile | Not affected | Not affected: the real store keeps its real expiry (not due), so that CLI does not renew because of us |
| The renewal fails | Not applicable | The source was never touched; the failure is recorded with a cooldown; the dispatch goes on |
| The runner dies while the renewal runs | Not applicable | The scratch copy stays under the account directory; the next holder of the account lock applies it if it is newer, then removes it |
| A pane outlives the remaining validity and renews in its private home | Lost with the home | Staged at removal, applied under the account lock (now or by the next refresh-ahead) |
| Two renewed copies are applied | Not applicable | Only a strictly later expiry replaces the source entry |

## Requirements

### Locks
- One account lock per provider account: `<runtimeDir>/account-locks/<provider>/<accountId>/lock`, the same generation-record format as `state-lock` (reuse `acquireGenerationLock`/`releaseGenerationLock` internals), separate from `state-lock`.
- Add an **async** acquire in `provider-capacity.mjs` that retries with `setTimeout` instead of `Atomics.wait` (the sync one blocks the event loop; panel seats run in one process and may share an account). Every caller in this phase that may wait uses the async form. Sync callers only try once (no wait).
- The holder record also carries the renewal child pid while a renewal runs; a reclaimer that finds a dead runner but a live child does not start a second renewal (it waits or skips this dispatch).
- The lazy-probe unlock (`probeQuarantinedAccounts`) takes the same account lock around its real call.

### Layouts (read without ever printing a value)
- **pi** `home-files` with `auth.json`: entries with `type: "oauth"` and numeric `expires` (ms; below 1e12 → seconds). Entry key = provider id. No oauth entry (API key, e.g. OpenRouter) → unreadable → skipped.
- **omp** `home-files` whose `files` include `agent.db`: SQLite (`node:sqlite` `DatabaseSync`, loaded lazily; unavailable → unreadable). Table `auth_credentials`, rows `credential_type = 'oauth'` and `disabled_cause IS NULL`, `data.expires` (ms). Entry key = row `id` + `provider`.
- **Codex** `codex-home`: due time = min(JWT `exp` of `tokens.access_token`, `last_refresh` + Codex's own refresh interval). The interval constant must be read from the Codex source (`gh api` on openai/codex, `codex-rs` auth code) before use and cited in a code comment; if it cannot be confirmed, use JWT `exp` only and say so in the report.
- Anything else (agy/Gemini): unreadable → skipped, as today.
- Errors from parsing a store are reported by a fixed code (`unreadable-json`, `unexpected-shape`, `sqlite-unavailable`), never by the parser message (it quotes nearby input).

### Refresh-ahead (`refreshAhead`)
- Runs in the dispatch path for the account that is actually provisioned (after the final selection, including the executor fallback lease), right before the confined private home is prepared, only when a credential copy will be made, the layout is readable, and the source has less than `thresholdMs` left. `thresholdMs` defaults to `max(60 min, probe timeout + 5 min)`, injectable.
- Under the account lock (async wait ≥ probe timeout + margin):
  1. Apply any pending staged copies and any leftover scratch copy (compare-before-write), then remove them.
  2. Re-read the source; if no longer inside the window, release and return `fresh`.
  3. Skip with `cooldown` if the last failed renewal for this account is younger than the cooldown (default 30 min; recorded in the account directory).
  4. Build a scratch home under `<account dir>/scratch-<pid>-<time>/` (mode `0700`) with the same listed files (omp `agent.db` via `VACUUM INTO`), set the "due" marker **in the scratch copy only** (pi/omp `expires` in the past; Codex `last_refresh` older than its interval), run `credentialProbeCommand` against the scratch home (record the child pid in the lock holder), judge the output.
  5. On success with a later expiry: apply the scratch entry to the source (see apply). Then remove the scratch home. On failure: record the cooldown, remove the scratch home (its refresh token was not redeemed or was refused; either way the source is untouched).
- Never throws into the dispatch; returns `{status: fresh|renewed|failed|cooldown|skipped, reason}` with no values.

### Apply (compare-before-write, shared by refresh-ahead and write-back)
- Under the account lock. Read copy and source; the copy entry must parse and have the expected shape; replace **only the matching entry** and only when its expiry is strictly later. Other entries/rows/fields stay byte-equal.
- pi/Codex: write the merged JSON through a temp file and a rename in the same directory, mode `0600`. omp: `UPDATE auth_credentials SET data = ?, updated_at = ? WHERE id = ? AND provider = ?` in a transaction; never replace the db file; then `PRAGMA wal_checkpoint(PASSIVE)` (best effort).

### Provisioning copy
- `copyHomeFiles` copies a listed `agent.db` with `VACUUM INTO` through `node:sqlite` (consistent snapshot including the WAL) when the module is available; otherwise the plain copy as today. Only `agent.db`; the allow list does not change.
- When the dispatch opted in, the private-home ownership marker (`writeOwnershipMarker`, written before the copy) is extended after the copy with `credentialWriteBack: { provider, accountId, kind, home, layout }`. No values.

### Write-back at private-home removal
- One shared removal function used by all three removal paths: the driver `cleanup` (herdr-spawn), `finalizeConfinementResources` (`authority.mjs`, which today calls `fs.rmSync` itself on the cli-spawn path) and the orphan reaper (`reapOrphanedConfinementResources`), including retained homes when they are finally removed.
- Before deleting, when the marker has `credentialWriteBack` and the copy's entry is later than the source's: copy the credential file(s) into `<account dir>/pending/<unique>/` (atomic rename), then try the account lock once without waiting; if acquired, apply and clear; if not, leave it pending for the next `refreshAhead`. A write-back problem is reported on stderr by code only and never stops the removal.

### Probe command
- `credentialProbeCommand` learns omp: `home-files` whose files include `agent.db` → `omp -p <PROMPT> --mode json --tools read` with `PI_CODING_AGENT_DIR=<home>`. This branch is tested **before** the pi `auth.json` branch. The probe keeps `stdin: 'ignore'` (omp waits for EOF on a piped stdin).

### Opt-in
- `executeAssignment` takes `providerCredentialRenew` (from `createCredentialRenewal()`); the four callers that already pass `providerCredentialProbe` (`dispatch/cli.mjs` ×2, `operation-choice.mjs`, `execution/run.mjs`) pass the real one. Without it: no refresh-ahead, no marker field, so removal is byte-identical to today. The `VACUUM INTO` copy and the omp probe branch apply regardless (they fix copy staleness and the unlock probe, independent of the opt-in) — say so in the changelog.
- No token value in any log, event, error, marker, report or test output.

## Architecture

```
executeAssignment
  select account (+ executor fallback lease)
  └► renew.refreshAhead(account)              [async account lock]
        apply pending/scratch ─ re-read ─ cooldown? ─ scratch copy ─ mark due in scratch
        ─ spawn probe on scratch ─ apply newer entry to source ─ rm scratch
  prepareConfinementForLaunch ─► bwrap: marker ─ copy (agent.db via VACUUM INTO) ─ marker += credentialWriteBack
  ... pane runs ...
  driver cleanup | finalizeConfinementResources | reaper
  └► removePrivateHome(dir)  (shared)
        credentialWriteBack? ─ stage newer copy to pending ─ try-lock ─ apply ─ rm home
```

## Related Code Files

- Create: `src/runner/dispatch/provider-credential-renewal.mjs` (layouts, expiry, scratch renewal, apply, staging).
- Modify: `src/runner/dispatch/provider-credential-probe.mjs` (omp branch first), `src/runner/dispatch/provider-capacity.mjs` (account lock paths, async acquire, try-acquire, lazy probe takes the account lock), `src/runner/dispatch/assignment-runner.mjs` (call after final lease, before confinement prepare; pass the opt-in into the confinement request), `src/runner/dispatch/confinement/drivers/bwrap.mjs` (`VACUUM INTO` copy, marker field), `src/runner/dispatch/confinement/cleanup.mjs` (shared removal with write-back), `src/runner/dispatch/confinement/authority.mjs` (`finalizeConfinementResources` uses the shared removal), the four callers.
- Tests: new `test/runner/provider-credential-renewal.test.mjs`; extend the probe, cleanup/finalize and provider-capacity lock tests.
- Docs: `docs/specs/runner.md` (refresh-ahead, apply, write-back; move the lazy-probe unlock rule from `docs/specs/distribution.md` row 5d into it, leave a pointer), `docs/specs/confinement-authority.md` (the private home receives a renewed copy; SQLite store copied as a snapshot; a newer copy is written back at removal), `CHANGELOG.md` `[Unreleased]`, `docs/architecture-manifest.json`.

## Implementation Steps

1. Re-read the code paths above on the worktree HEAD; confirm the three removal paths, the four callers, the executor fallback lease site.
2. Confirm the Codex refresh interval from its source; record the citation.
3. Test-first, with temp dirs, an injectable spawn and obviously fake token strings (never the real CLIs, never real stores):
   - expiry per layout (pi oauth / API key / several entries; omp one row / several rows / disabled / no `node:sqlite`; Codex `exp` vs `last_refresh`; unknown layout);
   - async lock: two concurrent `refreshAhead` in one process → one spawn, event loop not blocked; dead runner + live child → no second spawn;
   - outside window → no spawn; cooldown → no spawn; spawn failure/timeout → source byte-equal, cooldown recorded;
   - the real store is never written with a past expiry (assert on every write);
   - apply: later entry replaces only that entry; older/equal/unreadable/malformed leaves the source byte-equal; omp other rows/columns unchanged;
   - leftover scratch and pending copies are applied by the next holder;
   - removal via each of the three paths: without marker field identical to today; with it, staged then removed; write-back error still removes;
   - `VACUUM INTO` copy carries a row committed only in the WAL;
   - no parser message or token substring in any stderr/result (scan test output for the fake token strings).
4. Implement, then wire the callers.
5. `env -u CLAUDE_CODE_SESSION_ID npm test` (targeted suites first).
6. Real check (by the Lead/verifier, not the builder): a small script in the scratch directory calls `refreshAhead` with a `thresholdMs` larger than the remaining validity on the omp xai account → `renewed`; the source fingerprints change and a plain `omp -p` from the source answers; then two confined dispatches started together → no renewal inside either pane (source expiry unchanged by them). Fingerprints and expiry deltas only.
7. Spec text, changelog, architecture manifest.

## Success Criteria

- [ ] Two concurrent dispatches, one renewal, real store never marked due.
- [ ] Byte-identical removal and provisioning marker without the opt-in.
- [ ] Apply never replaces a newer/equal entry and never touches the source on a bad copy; only the matching entry changes.
- [ ] Write-back reachable from driver cleanup, `finalizeConfinementResources` and the reaper.
- [ ] No event-loop blocking lock in the async paths.
- [ ] Full suite green; real-check evidence by fingerprints only.
- [ ] Spec text in `runner.md` and `confinement-authority.md`; unlock rule moved out of `distribution.md`.

## Risk Assessment

- **Scratch renewal redeems P1 and then the apply fails** (crash between): the scratch copy holds the only good pair; it stays in the account directory and the next lock holder applies it. Signal: leftover scratch found. Response: apply, then remove.
- **The owner's CLI renews the source concurrently by itself** (it was inside its own 5-min window): both redeem P1 → one refused. Same exposure as today, made rarer because fgOS renews at ≤ threshold, long before the CLI's own window.
- **Codex interval unknown**: fall back to JWT `exp`; Codex then still renews inside copies at its interval → write-back covers it.
- **`VACUUM INTO` cost** on each confined omp dispatch: agent.db is ~170 KB; negligible.
- **Rollback**: stop passing the function (one line per caller). The `VACUUM INTO` copy and the omp probe branch are independent fixes; revert separately if needed. New persisted state: the account-lock directory with pending/scratch/cooldown files.
- **Reuse revokes the chain**: owner logs in again; the lazy probe (now omp-aware) unlocks the account.

## Validation

Targeted tests first, then the dispatch, confinement, setup and architecture suites, then `env -u CLAUDE_CODE_SESSION_ID npm test`. Fingerprints in any evidence, never values.
