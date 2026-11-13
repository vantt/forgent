---
phase: 4
title: "Settle: the signal rides on the failure, the quarantine is dated from it, every fault leaves an audit line"
status: pending
depends_on: [2, 3]
parallel: "serial after P02 and P03; P05 waits for it (shared provider-capacity.test.mjs)"
branch: harden/acct-b-p04
---

# P04 - settle signal, quarantine dating, capacity audit log

**Authority:** the receipt is the only judge of why a provider stopped (`4597694c0`, `6e011e056`); Seat Binding's capacity adapter (`provider-capacity.mjs`) owns quarantine and its history.

## Context (verified)

- `providerStopOf` (`src/run-supervisor/steps/settle-attempt.mjs:96-106`) returns `{adapterOutcome, cause}`; its only caller is `settleAttempt` (`:204`). Settle also hands `capacityEvidenceText` (15 screen lines, `SCREEN_EVIDENCE_LINES` `:17`, passed at `:224`) and full `stderrText` only so the classifier can find a reset time.
- `settleRunOutcome` (`src/runner/dispatch/settlement.mjs:689`, only src caller `settle-attempt.mjs:207`) builds `failureOverride {family, code, cause}` (`:863`) and calls `recordProviderCapacityFault` (`:609-648`, called once inside `settleRunOutcome`), which calls `classifyProviderCapacityFault` (`src/runner/dispatch/provider-capacity.mjs:969-1000`, only caller) and `quarantineProviderAccount` (`:734-750`).
- Dating: `quotaQuarantineUntil` (`:955-960`) parses `resets in` / `try again at` from text, else `DEFAULT_QUOTA_QUARANTINE_TTL_MS` 1 h (`:922`); `Provider requested 1800000ms wait` falls to 1 h.
- Audit: `state.audit[]` inside `state.json` (`emptyState` `:298-305`, `readState` `:317-358`), written by `readState` corruption resets (`:330`, `:342`), `clearProviderAccountQuarantine` (`:781`) and `probeQuarantinedAccounts` (`:860`); `writeState` (`:360`) rewrites the whole file on every lease/release (8 call sites). No fault is recorded; live `~/.fgos/runtime/provider-capacity/state.json` has `audit: []`.
- Reusable capped append: `appendFaultRecord` (`src/observe/invocation-fault-log.mjs:69`) + `FAULT_LOG_MAX_BYTES` (callers: `src/observe/approve-fault-log.mjs:21,35`, `test/observe/invocation-fault-log.test.mjs:18,235`). Importing it from dispatch would reach `src/state/` transitively (`invocation-fault-log.mjs` imports `../state/fgos-file-registry.mjs`), which the A4 guard (`test/architecture.test.mjs:945-990`) refuses.

## Requirements

1. `providerStopOf` returns `{adapterOutcome, cause, signal}` with `signal = receipt.providerSignal ?? null` for a provider stop only.
2. `settleRunOutcome` takes `providerSignal`; `failureOverride` carries `providerSignal` when present; `recordProviderCapacityFault` passes it on.
3. `classifyProviderCapacityFault({provider, adapterOutcome, structuredAgent, stopCause, providerSignal, now})`: quota `until` = `now + requestedWaitMs` when named; else the parsed `resetHint` (`parseQuotaResetWindowMs` / `parseQuotaResetClockTime` applied to the hint only); else 1 h. The `stderr` and `capacityEvidenceText` inputs, `SCREEN_EVIDENCE_LINES` and the `capacityEvidenceText` argument of `settleRunOutcome` are deleted (RUL104: one judge, the receipt).
4. Every classified provider fault (`reasonCode` `quota-limit`, `auth-token` or `provider-error`) appends one `provider-capacity-audit.v1` record `{action: "fault", at, provider, accountId, reasonCode, quarantine: {kind, until?} | null, providerSignal | null, runId, assignmentId}` to `<runtimeDir>/provider-capacity/audit.jsonl`, under the state lock.
5. The three existing audit writers write the same log; `state.json` loses `audit`. `writeState` moves a legacy non-empty `audit` array into the log once, then drops it. `inspectProviderCapacity` output is unchanged.
6. `appendFaultRecord` and `FAULT_LOG_MAX_BYTES` move to a kernel leaf `src/util/capped-jsonl-log.mjs` (fs/path only); both observe modules and the capacity module import it there (design principle 2).

## Files

- Create: `src/util/capped-jsonl-log.mjs`.
- Modify: `src/run-supervisor/steps/settle-attempt.mjs`, `src/runner/dispatch/settlement.mjs` (not `classifyEvidenceToOutcomeFacts`), `src/runner/dispatch/provider-capacity.mjs`, `src/observe/invocation-fault-log.mjs`, `src/observe/approve-fault-log.mjs`, `docs/architecture-manifest.json` (new kernel entry), `test/run-supervisor/attempt-steps.test.mjs`, `test/runner/provider-capacity.test.mjs`, `test/observe/invocation-fault-log.test.mjs` (import path only), `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (`:101-103`), `docs/platform/runner/decisions/h-36d872fbb0e5.md` (new narrative entry).
- Delete: none (P05 deletes the wording module).

## Owning proofs and retirements

| Behaviour | Owner |
|---|---|
| receipt signal -> `failure.providerSignal`, cause unchanged | extend `a pane seat stopped at its deadline whose receipt names the provider settles as a provider limit` (`attempt-steps.test.mjs:524`) with a `providerSignal` on the receipt |
| quarantine dated from requested wait / reset hint / default | rewrite the four dating cases in `provider-capacity.test.mjs` (`:551`, `:659`, `:688`, `:724`) to pass `providerSignal`; add one case for `requestedWaitMs: 1800000` |
| one audit line per fault, legacy array moved once | extend `a pane seat the supervisor stopped on a dead login quarantines its leased account` (`attempt-steps.test.mjs:549`) to read one `fault` line; one new case in `provider-capacity.test.mjs` for the legacy-array move (no existing test owns it) |
| capped append | stays `test/observe/invocation-fault-log.test.mjs:234-240` (import moves) |

Retired: the `capacityEvidenceText` arm of `:688` (the screen no longer dates anything; the case now owns signal dating) and the `stderr` text arm of `:659` (owner: the same rewritten case). Net size: about -25 Node lines (text dating paths and the `capacityEvidenceText` plumbing go), +35 (signal, audit log, migration), +1 small module moved, not grown.

## Steps

1. Red: the attempt-steps and capacity cases. 2. Leaf module move. 3. Classifier and settle plumbing; delete text dating. 4. Audit log and migration. 5. Spec + narrative.

## Validation

`node scripts/run-tests.mjs test/run-supervisor/attempt-steps.test.mjs test/runner/provider-capacity.test.mjs test/runner/provider-pool-lease.test.mjs test/observe/invocation-fault-log.test.mjs test/architecture.test.mjs test/run-supervisor/terminal-fallback.test.mjs`. `test/runner/provider-auth-failure.test.mjs` still passes here (its capacity cases pass extra keys the classifier ignores); P05 removes it.

## Risk / rollback

Risk: losing the reset time a screen printed above the bottom 12 lines (P01 window) -> falls back to 1 h, conservative. Risk: legacy audit move under a crash -> the array is dropped only in the same `writeState` that followed a successful append; a crash in between re-appends once (duplicate line, harmless). Rollback: revert; `audit.jsonl` stays on disk unread.
