---
phase: 2
title: "Capacity: a probe result is recorded, a quota record says whether its reset was known, and the unlock door takes quota self-probes"
status: pending
depends_on: []
parallel: "wave 1 with P01 (file-disjoint)"
branch: harden/acct-a-p02
---

# P02 - capacity door for probe results and the self-probe

**Authority:** Seat Binding's capacity adapter (`src/runner/dispatch/provider-capacity.mjs`) owns quarantine, its history (`audit.jsonl`, B P04) and the one real-call unlock (RUL74).

## Context (verified on `9c8f5289b`)

- `quotaQuarantineUntil(providerSignal, now)` (`:1036`) picks requested wait, else reset hint, else `DEFAULT_QUOTA_QUARANTINE_TTL_MS` (`:982`); the caller cannot tell which. `classifyProviderCapacityFault` (`:1052`) returns `{action, reasonCode, quarantineKind, until}`.
- `setQuarantine` (`:752`) writes `{kind, reasonCode, until, detail, quarantinedAt}`; `recordProviderAccountFault` (`:785`) appends one `fault` line (fields `:800-811`).
- Clears are written twice: `clearProviderAccountQuarantine` (`:817`, person) and inline in `probeQuarantinedAccounts` (`:921-935`, unlock).
- `probeQuarantinedAccounts` (`:868`) picks only `manual-clear` + `auth-token` (`:889`), only when no account is usable (`:885`), guarded by a 30-min cooldown (`:891`); `readAccountStates` (`:609`) marks the same rule `probeable` (`:622`), which `accountViewOf` reads (`src/runner/execution/bind.mjs:235`).

## Requirements

1. `quotaQuarantineUntil` returns `{until, resetKnown}`; `classifyProviderCapacityFault` adds `resetKnown` to a `quota-limit` fault; `setQuarantine` stores it; the `fault` audit line's `quarantine` carries it.
2. `recordProviderAccountFault` takes optional `source` (`run` default, `probe`), written on the `fault` line.
3. One internal clear helper used by `clearProviderAccountQuarantine`, the unlock and requirement 4 (RUL11: three writers of the same record become one).
4. New export `recordAccountProbe({provider, accountId, direct: [{cli, ok, reason, providerSignal, exitCode, elapsedMs}], verdict, source, runtimeDir, now})`:
   - any direct row with `reason` `login` or `usage-limit` and non-zero exit -> `classifyProviderCapacityFault({adapterOutcome: 'provider-limit', stopCause: credential|quota, providerSignal})` -> `recordProviderAccountFault({..., source: 'probe'})`;
   - else every direct row ok and the account holds a `quota-limit` or `auth-token` quarantine -> the clear helper (`reason: 'a direct call answered'`, `caller: 'fgos dispatch probe-account'` or `'fgos self-probe'`);
   - always one `{contract: provider-capacity-audit.v1, action: 'probe', at, provider, accountId, verdict, direct, source}` line (D2 (b)); `source` is `probe-account` or `self`.
   One state-lock section per call.
5. Self-probe candidate rule in `probeQuarantinedAccounts({..., accountId = null, runKey = null, model = null})` (`model` handed to `probe` as is, P01) (D6 (c), D7 (a)): besides today's auth-token rule (unchanged), an account is a candidate when its record is `quota-limit` with `resetKnown === false`, `probe?.runKey !== runKey`, and either (i) no account of the provider is usable (record active) or (ii) it is `accountId` and the record has expired. The claim stamps `probe: {attemptedAt, status: 'running', runKey}`. The answer goes through `recordAccountProbe` (`source: 'self'`) instead of the inline clear. A record without `resetKnown` is never a quota candidate.
6. `readAccountStates` marks an active unknown-reset quota record `probeable` (so `bind.mjs:235` may name it when nothing else is healthy; no change in `bind.mjs`). The per-run guard cannot be read there (no run key); the lease-time claim (req. 5) is the guard.

## Files

- Modify: `src/runner/dispatch/provider-capacity.mjs`, `test/runner/provider-capacity.test.mjs`, `test/runner/provider-quarantine-probe.test.mjs`, `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (quarantine paragraph `:101-103` and the RUL74 bullet `:160`: reset-known marker, probe line, quota self-probe candidate rule).

## Owning proofs and retirements

| Behaviour | Owner |
|---|---|
| `resetKnown` true for wait/hint, false for default | extend the B P04 dating cases in `provider-capacity.test.mjs` (the `requestedWaitMs: 1800000` case and the default case) |
| `recordAccountProbe`: fault / clear / probe line | one new case in `provider-capacity.test.mjs` (no existing owner: new door) |
| one clear helper | existing clear cases keep passing unchanged (`clearProviderAccountQuarantine` tests, `provider-quarantine-probe.test.mjs:43`) |
| quota candidate rule (active when none usable; expired when named; once per runKey; old record without `resetKnown` skipped) | rewrite `only a dead-credential lock is probed: quota limits and other manual locks are left alone` (`provider-quarantine-probe.test.mjs:104`) into `a quota lock is probed only when its reset was unknown, once per run; other manual locks are left alone` — behaviour changed on purpose by decision 5 |

## Steps

1. Red: the rewritten `:104` case, the dating assertions, the new `recordAccountProbe` case. 2. `resetKnown` plumbing. 3. Clear helper. 4. `recordAccountProbe`. 5. Candidate rule + `probeable`. 6. Spec lines. 7. Gate.

## Validation

`node scripts/run-tests.mjs test/runner/provider-capacity.test.mjs test/runner/provider-quarantine-probe.test.mjs test/runner/provider-pool-lease.test.mjs test/runner/assignment-dispatch.test.mjs test/run-supervisor/attempt-steps.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs`; `cargo test -p fgos-binding` only if `bind.mjs`'s view shape is found to reach the crate differently [lead checks; plan expects no change]; `node scripts/git-one-door-scan.mjs --root .`; `git diff --stat origin/main...HEAD`.

## Risk / rollback

Risk: an account with no usable sibling is probed every unit run while its quota stays unknown -> bounded by D7, and each failed probe re-dates from the new signal (a provider that names a wait flips `resetKnown` to true and stops the probes). Risk: the unlock path now writes through `recordAccountProbe` -> the auth-token cases (`:43`, `:70`, `:132`) are the regression guard. Rollback: revert; extra record fields and `probe` lines are inert.
