# Implement report: phase 01 credential rotation safety (steps 1-5, 7)

Branch `feat/provider-credential-rotation-safety` (base main `97ca636f9`). Step 6 (real check on a live account) not done, left to the Lead. No real credential, CLI or `~/.fgos/config.json` was touched; tests use temp dirs, an injected spawn and fake token strings.

## What was built

- `src/runner/dispatch/provider-capacity.mjs`: per-account lock under `<runtimeDir>/account-locks/<provider>/<account>/lock` (same generation-record format, separate from `state-lock`). `tryAcquireAccountLock` (once, no wait), `acquireAccountLock` (async, `setTimeout` poll, never `Atomics.wait`), `providerAccountDir` (null on unsafe ids). Holder record can carry a `child` pid; a dead holder with a live child still counts as held. `probeQuarantinedAccounts` now holds the account lock around its real call (waits up to 2 min, otherwise that account counts as a failed attempt). No new imports (the import-graph test pins this file as a leaf).
- `src/runner/dispatch/provider-credential-probe.mjs`: omp branch (`home-files` listing `agent.db` -> `omp -p ... --mode json --tools read`, `PI_CODING_AGENT_DIR`), tested before pi; `runCredentialProbe` extracted with an `onSpawn` hook; `createCredentialProbe` unchanged in behaviour.
- `src/runner/dispatch/provider-credential-renewal.mjs` (new): layouts pi / omp / Codex (expiry, mark-due in scratch, entry-level apply, stage), `copyCredentialFiles` (moved out of bwrap.mjs, `agent.db` via `VACUUM INTO`, plain copy when `node:sqlite` is missing), `refreshAhead`, `applyRenewedCredential`, `writeBackRenewedCredential`, `credentialWriteBackMarker`, `createCredentialRenewal`. Fixed error codes only (`unreadable-file`, `unreadable-json`, `unreadable-db`, `unexpected-shape`, `sqlite-unavailable`, ...).
- `confinement/cleanup.mjs`: `removeConfinementDir` is the one removal (stop processes optionally, write-back, `rmSync`), used by `cleanupConfinementResource` (so also the reaper), and by `finalizeConfinementResources` in `authority.mjs`. `extendOwnershipMarker` added. Without the marker field the removal is as before.
- `confinement/drivers/bwrap.mjs`: copy goes through `copyCredentialFiles`; after provisioning, marker gets `credentialWriteBack` only when the request carries the opt-in.
- `assignment-runner.mjs`: when `opts.providerCredentialRenew` is a function and a selection exists, `refreshAhead` runs once after the final lease (fallback lease included), before both launch branches, and the confinement request carries `credentialWriteBack: {runtimeDir}`. The four callers (`dispatch/cli.mjs` x2, `operation-choice.mjs`, `execution/run.mjs`) pass `createCredentialRenewal()`.
- Docs: `runner.md` RUL74 (lazy-probe unlock, moved) and RUL75 (renewal, apply, write-back); `confinement-authority.md` 13.2; `distribution.md` RUL14 replaced by a pointer, row 5d notes the `account-locks/` subtree; `CHANGELOG.md` [Unreleased]; `docs/architecture-manifest.json`.

## Commits (in order)

1. `8a9bc9745` feat(dispatch): per-account lock with async wait, and an omp branch for the credential probe
2. `599b33f65` feat(dispatch): renew a rotating login once in a scratch copy and write back what a pane renewed
3. `abe893d5d` feat(dispatch): opt dispatch callers in to credential renewal before the private home is built
4. `32f61c964` docs(specs): rotating login renewal and write-back; lazy-probe unlock rule moves to the runner spec

## Tests

- New `test/runner/provider-credential-renewal.test.mjs`: 36 tests (expiry per layout, concurrent refresh = one spawn with timers still firing, dead runner + live child, cooldown, failure leaves source byte-equal, real store never marked due during the call, scratch/pending leftovers applied, apply only on strictly later and future entries, omp row update with other rows/columns unchanged, `VACUUM INTO` copy carries a WAL-only row, write-back through driver cleanup / finalizer / reaper, busy lock stages then next refresh applies, write-back error still removes, token-fragment scan over results, cooldown, lock records, markers, stderr).
- Extended: `provider-capacity.test.mjs` (account lock, async wait, unlock probe holds the lock), `provider-credential-probe.test.mjs` (omp branch first, no stdin), `assignment-dispatch.test.mjs` (renewal called for the fallback account; thrown renewal does not fail the dispatch; unconfined launch does not call it).
- `node --test test/runner/provider-credential-renewal.test.mjs` exit 0 (36/36); probe + capacity + import-graph 59/59 exit 0; `test/architecture.test.mjs` 16/16; `node scripts/check-decision-citation-drift.mjs` no findings.
- `env -u CLAUDE_CODE_SESSION_ID npm test`: first run (no release binary in the worktree) 62 fail, all in rust-host/fgctl/dev-door suites ("Build the release fgos host before this suite", "fgctl binary must exist"). After `CARGO_TARGET_DIR=$PWD/target cargo build --release --workspace` (exit 0): `npm test` exit 0, 7179 tests, 7106 pass, 0 fail, 8 skipped. Worktree clean afterwards.

## Codex refresh interval

Confirmed from openai/codex `codex-rs/login/src/auth/manager.rs`: `const TOKEN_REFRESH_INTERVAL: i64 = 8;` (days), used in `should_refresh_proactively` as `last_refresh < now - 8 days`, but only when the access token's `exp` cannot be read; when it can, Codex renews at `exp` minus 5 minutes (`CHATGPT_ACCESS_TOKEN_REFRESH_WINDOW_MINUTES`). Implemented as the phase says: due = min(`exp`, `last_refresh` + 8 days), cited in a code comment. To make a scratch Codex copy look due, both are moved: `last_refresh` set to 2000-01-01 and the JWT payload `exp` rewritten into the past in the scratch copy only (Codex reads the claim unverified; refresh token untouched). Not yet proven against a real Codex build.

## Deviations from the phase spec

- Marker carries `runtimeDir` in addition to `{provider, accountId, kind, home, layout}`: removal paths (finalize, reaper, possibly another process) have no other way to find the account directory.
- Confined-launch gate for refresh-ahead: the confinement requirement is "unconfined" at that point for executors whose confinement comes from a confined invocation, and which invocation is used is decided later (also inside `executeExecutorCli` for herdr). So the gate is: requirement not unconfined, or the executor (or any of its invocations) declares confinement. An unconfined invocation of such an executor may do a refresh-ahead that no copy needed; harmless.
- Lazy-probe unlock rule is now RUL74 in `runner.md` (the id RUL14 is already used there for another rule), the new rules RUL75; `distribution.md` keeps a pointer with a gloss (citation guard). Row 5d also gained one sentence on `account-locks/`.
- A renewal call that is judged failed (timeout/kill) still attempts apply from the scratch copy before removing it, since it may already hold the only good pair.
- omp apply copies the copy row's own `updated_at` value (column type unknown without reading a real db; set only when the column exists).
- Pending copies are applied even when the source looks fresh (the source's refresh token may already be spent by the pane's renewal).

## Open issues / notes

- Step 6 (real scratch renewal on the omp xai account, two concurrent confined dispatches) is untested against real CLIs. Points to watch there: omp `VACUUM INTO` from a live profile, that omp renews in the scratch home when `expires` is in the past (the fake spawn proves the mechanism, not the CLI), Codex payload-`exp` trick.
- `fgos doctor` has no check for the new `account-locks/` subtree (stale scratch, pending copies); the existing `provider-capacity-lock-stale` reads only `state-lock`. Not added (out of the phase's file list); worth a follow-up item.
- Account lock directories grow one small record per acquisition, same trade-off as the state lock (documented there).
- GitNexus impact analysis: `fgos tool query --capability impact-analysis --status present` returned 0 providers (inactive); callers were found with grep (4 callers of the probe option, 3 removal paths).
- Phase file status not updated (not in the file list).

## Fix round

Decisions by the Lead applied as given. Review: `code-review-261013-credential-rotation-implementation.md`.

| Finding | Change | Test (`provider-credential-renewal.test.mjs` unless noted) |
|---|---|---|
| H1 write-back / leftovers dropped a later-but-expired login | Apply rule is now: strictly later expiry AND refresh token differs (in-memory compare, null counts as differs). `requireFuture` only for a fresh scratch result; write-back (`copyIsNewer`) and leftovers (`applyLeftovers`) apply without it. A copy with the source's own refresh token is never applied. | retained home removed after renewed access expired -> applied; staged copy past expiry applied only with `requireFuture: false`; leftover scratch with same refresh token and later-looking expiry never applied and removed; call that keeps the refresh token -> `not-renewed`, source byte-equal |
| H2 window/judgement over all entries | `selectProviderEntry`: single oauth entry, else owner (pi key, omp row provider, Codex single) equal to provider or `<provider>-` prefix; zero/several -> `skipped: entry-unidentified`. Window, mark-due, apply and leftover/write-back all use that one key. | unrelated expired entry (pi, omp) -> no spawn; omp `xai-oauth` row matched, other row neither made due nor applied; several/none -> skipped, lone entry used |
| M1 detached child outlives runner | Probe command wrapped in `timeout --kill-after=5 <s>` resolved on PATH (`withKillTimeout`); in-process timer kept; unwrapped when `timeout` absent. | wrapped args asserted; `PATH` without timeout -> plain `pi` |
| M3 silent raw copy | Node:sqlite present + snapshot failure -> plain copy plus one stderr line `credential-snapshot-failed` (file name only). | failing sqlite stub: copy made, one line, no path |
| L1 unlock probe child not recorded | `probeQuarantinedAccounts` passes `onSpawn` recording the child in the account lock; `createCredentialProbe` forwards it. | `provider-capacity.test.mjs` (child pid in lock record), `provider-credential-probe.test.mjs` |
| L2 outcome invisible | `assignment-runner` writes `fgos: credential refresh-ahead <provider>/<account>: <status> (<reason>)` unless `fresh` or `skipped:unsupported-layout`. | `assignment-dispatch.test.mjs` |
| M2 | No code. One sentence added to RUL75 in `runner.md` (item 5) and to phase-01 Risk Assessment. | - |
| L3 | No change. | - |

Not done: the review's suggestion of a provider/model argument on the probe call (decision H2 only scopes the entry; the probe still uses the CLI default model, so a store whose default model belongs to another provider can still renew nothing for the dispatched provider, reported as `not-renewed` with cooldown).
