---
phase: 4
title: "Self-probe before launch: once per account per unit run when the last quota stop named no reset"
status: pending
depends_on: [1, 2, 3]
parallel: "wave 3 with P05 (file-disjoint); after P03 only because both edit the runner spec"
branch: harden/acct-a-p04
---

# P04 - self-probe wiring at lease time

**Authority:** Dispatch's lease step (`leaseAccountForAttempt`) already calls the one unlock door before it leases; this phase hands that door the named account and the run key. The candidate rule lives in P02.

## Context (verified on `9c8f5289b`)

- `leaseAccountForAttempt` (`src/runner/dispatch/assignment-runner.mjs:592`) calls `probeQuarantinedAccounts({runnerConfig, provider, runtimeDir, probe: opts.providerCredentialProbe, cli})` (`:606`) when `opts.providerCredentialProbe` is set, then leases `pin.leaseAccount` (`acquireNamedAccountLease`). Its only caller: `:1354`; a refused lease settles through `settleRefusedLease` and the runner rebinds on `lease-conflict` (`provider-capacity.mjs:631-637` doc).
- The unit run id of an assignment: `asgn.unitRunId || asgn.provenance?.unitRunId || asgn.assignmentId?.split('/')[0]` (`assignment-runner.mjs:235`, the mutating-check site); `leaseAccountForAttempt` receives only `assignmentId`.
- `opts.providerCredentialProbe` is set by `runUnit` (`src/runner/execution/run.mjs:990`, `createCredentialProbe()`), not by probe-account (which runs its own direct leg).

## Requirements

1. `leaseAccountForAttempt` receives the effective assignment's unit run id (one derivation, shared with `:235` through a small local helper, not a copy) and passes `accountId: pin.leaseAccount`, `runKey: <unitRunId>` and the probe model (the binding's model, `pin.model` or the launch's model [lead: find the field the launch already carries]) to `probeQuarantinedAccounts`.
2. Nothing else changes in the lease: a probe that re-quarantines the account makes the lease refuse with `lease-conflict` and the existing rebind takes the next account; a probe that clears it lets the lease proceed.
3. Spec: RUL74 bullet (`docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:160`), one sentence on the lease-time trigger and the per-run guard (P02 wrote the candidate rule).

## Files

- Modify: `src/runner/dispatch/assignment-runner.mjs`, `test/runner/assignment-dispatch.test.mjs`, `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (RUL74 bullet only).

## Owning proofs

| Behaviour | Owner |
|---|---|
| a launch whose named account has an expired unknown-reset quota record makes one direct call; a second attempt of the same unit run makes none; a still-exhausted answer refuses the lease | one new case beside `a dispatch whose only account is locked for a dead login tries one real call and runs once the call succeeds` (`test/runner/assignment-dispatch.test.mjs:2340`), same fixture; it is the one wiring proof (the rule's cases are P02's) |

Nothing retired.

## Steps

1. Red: the new case. 2. Run-id helper + arguments. 3. Spec sentence. 4. Gate.

## Validation

`node scripts/run-tests.mjs test/runner/assignment-dispatch.test.mjs test/runner/provider-quarantine-probe.test.mjs test/runner/provider-capacity.test.mjs test/runner/provider-pool-lease.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs`; `node scripts/git-one-door-scan.mjs --root .`; `git diff --stat origin/main...HEAD`.

## Risk / rollback

Risk: up to 90 s added to one launch per unit run per affected account (plan risk table). Risk: an assignment with no unit run (a probe-account harness round) gets `runKey = assignmentId` -> at most once per such round; probe-account sets no `providerCredentialProbe`, so it never triggers. Rollback: revert; P02's door stays, reached only by the RUL74 unlock and `--record`.
