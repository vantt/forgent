# Code review: provider credential rotation safety (phase 01 implementation)

Reviewer: independent code-reviewer (not the builder). Scope: `git diff main...HEAD` on `feat/provider-credential-rotation-safety` (commits `8a9bc9745`..`673a6ff8f`), against [phase-01](../phase-01-refresh-ahead-and-write-back.md), [plan.md](../plan.md) and the [builder report](implement-261013-phase-01-credential-rotation.md). No source edited. No real store read, no real CLI run.

## Verification run

- `env -u CLAUDE_CODE_SESSION_ID node --test test/runner/provider-credential-renewal.test.mjs test/runner/provider-capacity.test.mjs test/runner/provider-credential-probe.test.mjs`: 78/78 pass, exit 0.
- Ad-hoc repro script (scratchpad only, temp dirs, fake tokens, injected spawn). It confirmed findings H1 and H2 below:
  - H2: a pi `auth.json` holding `xai` (6 h left) and an abandoned `github-copilot` oauth entry that expired 30 days ago. Each `refreshAhead` for `xai` returned `{failed, not-renewed}` and started a real call (spawns 1, then 2).
  - H1: the source holds spent `P1`, and a pane home holds `P2` with an expiry that is past but later than the source's. `removeConfinementDir` deleted the home. The source still held `P1` and nothing was staged under `pending/`.

## What holds (checked, not findings)

- Compare-before-write. All three layouts need a strictly later expiry. pi/Codex replace only the matching entry, write a temp file and rename it, and recompute when the file changed in between. omp uses `UPDATE ... WHERE id = ? AND provider = ?` inside `BEGIN IMMEDIATE`, never replaces the db file, and rolls back on error. Mark-due only touches the scratch copy.
- The account lock never uses `Atomics.wait`; its async wait polls with `setTimeout`. Same-process contenders (panel seats) are excluded because the holder pid is live. A dead holder whose recorded child is still alive keeps the lock. Write-back uses try-lock. Leftover `scratch-*` and `pending/*` are applied by the next holder. The `.tmp-*` staging dirs are filtered out until their atomic rename.
- All three removal paths go through `removeConfinementDir` (driver cleanup, reaper via `cleanupConfinementResource`, `finalizeConfinementResources`). With no `credentialWriteBack` in the marker, the extra cost is one marker read and the removal is otherwise unchanged. The finalizer's marker digest is computed after `extendOwnershipMarker`, so no `ownership-marker-mismatch` occurs.
- Secrets: results, cooldown, stderr and markers carry fixed codes only. Parser messages are swallowed. The token-fragment test covers the output surfaces.
- Wiring. Renewal runs after the final selection: the fallback lease at assignment-runner.mjs:1819-1822 comes before the call at :2204. It is wrapped in try/catch, so it never fails the dispatch. `acquireProviderAccountLease` has no other call sites, so herdr does not re-select. The "may be confined" gate deviation is acceptable (worst case: an unneeded renewal).

## Findings

### H1 (High, conflicts with an owner decision): the "never write a past expiry" rule throws away the only valid refresh token on write-back and leftovers

- Where: `provider-credential-renewal.mjs:250, 319, 400` (the `> now` clause in apply), `:478` (`copyIsNewer`), `:512` (`applyLeftovers` deletes a leftover whose result is `unchanged`). The test at `test/runner/provider-credential-renewal.test.mjs:~510` locks this behaviour in.
- Failure scenario (reproduced):
  1. A pane outlives the access-token lifetime and renews P1 to P2 inside its private home. This is the case phase-01 row "A pane outlives the remaining validity" says write-back covers.
  2. The home is removed after P2's access token has also expired. This is certain for a retained home removed later by the reaper.
  3. The copy is "not newer", so the home is deleted with P2, and the source keeps P1, which the provider has already spent.
  4. The same loss happens to a `pending/` copy or a dead runner's `scratch-*` copy that is first applied after its access token expired. The next refresh-ahead finds it `unchanged` and deletes it.
  5. The login is then broken until the owner logs in again, which is exactly what this phase exists to prevent.
- Why it needs a decision: plan.md acceptance says "The real store is never written with a past expiry". phase-01 says write-back covers retained homes. Both cannot hold for short-lived access tokens.
- Options:
  - (a) Drop the `> now` clause for write-back and leftovers only. A strictly later entry wins even if its expiry is past, because its refresh token is the newer one. Keep `> now` for the refresh-ahead scratch, where a past expiry means "not renewed".
  - (b) Keep the rule, but never delete a copy that was refused only because its expiry is past. Keep it under `pending/` and surface it through doctor.
  - (c) Accept the loss and amend phase-01 so it no longer claims write-back covers retained or late homes.
- Recommendation: (a). Writing an expired-but-later entry is strictly better than keeping a spent one, since the CLI renews on first use.

### H2 (High): the refresh window is computed over every entry in the store, not the dispatched provider's entry

- Where:
  - `:452` / `:575`: `earliestDue` takes the minimum over all pi `auth.json` keys and all omp `auth_credentials` rows.
  - `:610`: mark-due marks every in-window entry.
  - The probe (`credentialProbeCommand`) calls the CLI's default model, with no provider or model argument.
- Failure scenario 1 (reproduced). A store holds one abandoned or expired oauth entry from any provider, for example an old `github-copilot` login in pi, or a non-disabled stale omp row. Then:
  1. Every dispatch on that account is "in window".
  2. It takes the account lock and spends a real CLI call (up to 90 s) every cooldown period (30 min), forever.
  3. It records `failed/not-renewed`.
  4. Concurrent dispatches on the account wait on the lock in the meantime, up to `lockWaitMs` = 120 s.
- Failure scenario 2. The dispatched provider's entry is the one in the window, but the CLI's default model belongs to another provider in the same store. The scratch call renews nothing for the dispatched provider. The guarantee "both runs start with a login good for hours" silently fails, and the pane renews inside its throwaway home as before.
- Fix:
  - Key the window, mark-due and success test on the entry for `provider`: the pi key equal to the provider, the omp row `provider` column, or a mapping in the account inventory.
  - Ignore other entries. When no entry matches, return `skipped`.
  - Pass the provider or model to the probe command so the call actually uses the marked entry.
  - Add a test with a second, expired entry for an unrelated provider.

### M1 (Medium): a detached renewal child that outlives its runner holds the account lock with no deadline

- Where: `provider-capacity.mjs:453-457`, the child branch of `isGenerationHeld`. `runCredentialProbe` spawns with `detached: true`, and its kill timer lives only in the runner.
- Failure scenario:
  1. The runner is killed (SIGKILL or OOM) during a refresh-ahead call. The omp/pi child keeps running in its own process group, and nothing ever times it out.
  2. If it hangs (network, an interactive prompt), the lock stays held until the child exits. That can be indefinitely.
  3. Every dispatch on the account blocks for `lockWaitMs` (about 120 s), then skips.
  4. Every lazy unlock probe waits 120 s and counts as a failed attempt.
  5. Every write-back only stages.
- Fix:
  - Record `deadline = spawnedAt + timeoutMs` in the child record.
  - Once past the deadline (plus a margin), a contender kills the child's process group (`process.kill(-pid)` after a start-time match) and treats the lock as free.
  - Add a test with a live child past its deadline.

### M2 (Medium, design gap): refresh-ahead spends the refresh token that a running pane still holds

- Where: `refreshAhead` decides only from the source's expiry. It does not know about live private homes or leases copied from the same account.
- Failure scenario:
  1. Pane A copies P1 with 61 min left, so A is outside the window and no renewal happens. A runs for 2 hours.
  2. A dispatch B at 59 min left renews in scratch: P1 is redeemed and P2 is applied to the source.
  3. At expiry, A's CLI redeems P1 again. The provider refuses it, and per plan.md Q1 it may revoke the whole chain.
  4. Write-back cannot rescue A because A's renewal failed.
- Impact: phase-01's row "A pane outlives the remaining validity ... staged at removal" holds only if no other dispatch ran on the account in the window. Busy accounts and panels make that unlikely.
- Fix options (owner decision):
  - Skip refresh-ahead while another live lease or marked private home exists for the account, and let that pane's write-back carry the renewal. The cost is that concurrent starts in the window are not deduplicated.
  - Size `thresholdMs` above the maximum run length.
  - Accept and document the exposure.
- Not a regression versus today, but the phase claims coverage it does not have.

### M3 (Medium): an `agent.db` snapshot failure silently falls back to a raw copy even when `node:sqlite` is available

- Where: `provider-credential-renewal.mjs:176-177`. `snapshotSqliteFile` returns false on any error: busy past 5 s, I/O error, a `-shm` it cannot open read-only.
- Failure scenario:
  1. The owner's omp is holding the database while it writes. `VACUUM INTO` throws, and `copyFileSync` copies the main file without its WAL.
  2. The private home gets the pre-renewal row, P0, which is already spent. This is the staleness the change was meant to fix.
  3. The pane's omp then redeems a spent token.
- Fix: fall back to a plain copy only when the module is missing, as the spec says. Otherwise fail provisioning with a fixed code (`credential-snapshot-failed`), or retry the snapshot once.

### L1 (Low): the lazy unlock probe holds the account lock but does not record its child

- Where: `provider-capacity.mjs:923`, and `createCredentialProbe`, which passes no `onSpawn`.
- Failure scenario:
  1. The runner dies while the unlock probe's CLI runs in the real home and may renew it.
  2. The lock is reclaimable at once, because the holder is dead and no child is recorded.
  3. A refresh-ahead then copies the real store, which may still hold P1 mid-renewal, and redeems P1 a second time.
- Fix: thread `onSpawn: (c) => lock.recordChild(c.pid)` through `probe(...)`. For example, pass the lock handle as `{onSpawn}` in the probe arguments.

### L2 (Low): the renewal outcome is discarded, so a failing renewal is invisible

- Where: `assignment-runner.mjs:2204`. The result `{status, reason}` is never written to run evidence or stderr.
- Impact: H2's permanent `failed/not-renewed`, constant `lock-busy` (M1), and `cooldown` all look exactly like success to an operator. `fgos doctor` has no check for the `account-locks/` subtree, which the builder already notes. A `pending/` copy that is never applied is also never reported.
- Fix: put `{status, reason}` into the run evidence or launch context, and add a doctor check for stale `pending/` and `scratch-*` entries and for the cooldown.

### L3 (Low): the synchronous write-back can block the event loop for seconds

- Where: `removeConfinementDir`, then `writeBackRenewedCredential`. The omp layout opens the db with `timeout: 5000` plus `PRAGMA busy_timeout = 5000`.
- Impact: up to three blocking SQLite waits per removal (read source, read copy, `BEGIN IMMEDIATE`) when the owner's omp holds a write lock. `finalizeConfinementResources` is reached from async dispatch code shared by in-process panel seats. This is the same class of problem the async account lock avoided.
- Fix: use a short busy timeout (for example 250 ms) on the write-back path, and stage instead when it is busy. The pending copy already covers that case.

## Tests

- The suites pass, and they genuinely assert byte-equality, single spawn and the child-pid lock. The gaps that matter:
  - No test has a second, unrelated or expired entry in the store (H2).
  - The past-expiry test (`:~505-515`) asserts the behaviour criticised in H1.
  - No test covers a live child past its deadline (M1) or a snapshot failure with `node:sqlite` present (M3).
- The fake spawn's child pids (`424242+n`) are not live processes. Any test that expects a recorded child to keep the lock must keep using a real pid, as the dead-runner test does with `process.pid`.

## Recommended order

1. Decide H1 (owner decision; (a) recommended).
2. Fix H2 (provider-scoped entry and probe).
3. Fix M1 and M3.
4. Decide M2 (owner decision).
5. Do L1-L3.
6. Then step 6, the real check on a live account. Run it only after H2: with a multi-provider omp profile, the real check may otherwise "pass" by renewing the wrong row.

## Unresolved questions

- Do the pi and omp CLIs use a lockfile around `auth.json`/`agent.db` renewal? If they do, the compare-and-rename apply on pi/Codex should honour it. Not verified, because the real CLIs were not run.
- How do fgOS provider ids map to pi `auth.json` keys and omp `provider` values in the real inventory? H2's fix depends on it.

Status: DONE_WITH_CONCERNS
Summary: Compare-before-write, the row-level omp update, the lock mechanics and removal-path coverage are correct, but two reproduced High defects remain: write-back and leftovers discard a later-but-expired renewed login (only good refresh token lost), and the refresh window/probe is not scoped to the dispatched provider's entry (endless futile renewals or no renewal at all). M1-M3 cover a lock with no deadline, a gap with long-running panes, and a silent raw-copy fallback.
