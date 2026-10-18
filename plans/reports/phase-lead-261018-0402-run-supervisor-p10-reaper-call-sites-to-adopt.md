# Phase report: reaper call sites to adopt (6.2 / p10)

Status: DONE_WITH_CONCERNS. Branch `run-supervisor/p10-reaper-adopt` merged `--no-ff` into integration.

## Done
- `cleanup.mjs`: `writeOwnershipMarkerV2` (contract `confinement-resource-ownership.v2`, `attemptId`, `runDir`, `dispatchId`, `resource`, `createdAt`, written atomically; same contract string finalize-home already reads), `readAttemptOwnershipMarker`, `ATTEMPT_HOME_MARKER_CONTRACT` (authority.mjs now imports it). `extendOwnershipMarker` and `listKeptCredentialHomes` accept v2 (before, `credentialWriteBack` was silently dropped on v2 homes). `removeConfinementDir` refuses a v2 home.
- Reaper: skips v2 (`attempt-home-owned-by-adopt`); a pane-less bound v1 marker is kept (`unpaned-binding-kept-for-doctor`); paned herdr rules and the unbound pid rule are unchanged.
- `src/run-supervisor/sweep.mjs` `sweepAttempts({assignmentsRoot, tempRoot, adoptOptions, reaperOptions})`: adoptScan, then reaper. An adopt failure is returned as `adoptError`, never throws, never stops the reaper. `run.mjs`, `loop.mjs`, `dispatch/cli.mjs` call it (`checkPaneOpen: paneOpenUnlessClosed` kept). Manifest row added (infra).
- Carry-over: `finalizeAttemptHome` bounds credential-home-kept retries per home (5 counted attempts, 15 min spacing, `countCredentialKeep` shared with `removeConfinementDir`); then returns `credential-home-held`, descriptor `retained`, step answers `done` with `detail.outcome: credential-home-held`, home kept, never retried.

## Tests (FGOS_HOST_BIN = private debug build of this branch)
Phase branch: sweep, reaper-fence, production-call-sites, attempt-steps, credential-hygiene, backend-p03, run-timeout, provider-credential-renewal, confinement-doctor-checks, architecture, adopt-client, contracts, bwrap-driver, runtime-dir: 319 tests, 309 pass, 0 fail, 10 todo (pre-existing). Integration after merge: sweep, fence, production-call-sites, attempt-steps, architecture, adopt-client: 119 tests, 109 pass, 0 fail, 10 todo.
New: 50-pass interleave on a v2 home, sweep with real adopt finalizing a dead attempt's home before the reaper, sweep without host, v1 herdr rules via sweep, call-site grep, kept-home bound, v2 refusal.

## Decisions
- "Marker v1 without paneId" read as the pane-less *bound* marker (old cli-spawn supervisor binding). The unbound in-process pid rule stays: many credential-hygiene/run-timeout tests rely on it and in-process crashes would otherwise leak login copies.
- S2(9) cases changed to "kept", as the phase file says.
- GitNexus impact unavailable (multi-repo index of main, stale); callers checked by grep: 3 call sites, registrations.mjs, bwrap.mjs.

## Concerns (reviewer, Sonnet)
1. HIGH until P09 lands: `transport.mjs:373 bindConfinedHomesToSupervisor` still writes pane-less bound v1 homes; they are now never reaped (login copies stay) and doctor's `fixConfinementOrphanedResourcesReaped` cannot clear them. Plan says writer and destructor move together with P09: do not land P10 without P09.
2. `registrations.mjs` doctor check (~5455-5474) counts v2 homes as orphans (no pid) and cannot fix them. That file is P11's; it must skip v2 markers / judge via adopt.
3. Not verified: `sweepAttempts` runs adopt synchronously at each `runUnit` start; safety against a concurrent live attempt rests on adopt's lock (P06).

Unresolved: none beyond the above.
