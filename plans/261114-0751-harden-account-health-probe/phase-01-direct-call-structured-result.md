---
phase: 1
title: "The direct call returns its verdict and asks for the seat's model"
status: pending
depends_on: []
parallel: "wave 1 with P02 (file-disjoint)"
branch: harden/acct-a-p01
---

# P01 - direct call: structured result, model argument

**Authority:** the agent protocol judges a CLI's last words (`agentProtocol.classifyDirect`, addon `packages/git/node-addon/src/agent_protocol.rs`); this phase only stops dropping what it already returns.

## Context (verified on `9c8f5289b`)

- `judgeProbeOutput` (`src/runner/dispatch/provider-credential-probe.mjs:95`) calls `classifyDirect` and returns only `{ok, detail}`; `reason` and `providerSignal` are turned into prose and lost.
- `credentialProbeCommand(source, {noTools})` (`:46`) builds codex/omp/pi/claude calls with no model; its callers: `createCredentialProbe` (`:168`, the RUL74 unlock) and the renewal module (`noTools: true`) [lead: `git grep -n credentialProbeCommand src` before editing].
- `runCredentialProbe` (`:122`) resolves the judged object; it measures no time.

## Requirements

1. `judgeProbeOutput` returns `{ok, detail, reason, providerSignal}` (`reason` null on ok, timeout, plain exit code). `detail` text unchanged.
2. `runCredentialProbe` adds `elapsedMs` (start of spawn to close).
3. `credentialProbeCommand(source, {noTools, model})`: with `model`, codex gets `-m <model>`, omp/pi/claude get `--model <model>` [lead: confirm each flag with the CLI's `--help` on this machine and quote it in the report]. No model: command unchanged (unlock and renewal callers untouched).
4. `createCredentialProbe` passes `model` through when its caller names one (`probeCredential({account, cli, model, spawnHolding})`).

Decision D1 (b) assumed. If HARDEN picks (a), drop requirements 3-4.

## Files

- Modify: `src/runner/dispatch/provider-credential-probe.mjs`, `test/runner/provider-credential-probe.test.mjs`.

## Owning proofs

| Behaviour | Owner |
|---|---|
| reason + signal returned | extend `a call is judged by exit code and by the CLI's last words through the agent protocol...` (`:60`) and `the last JSON event of stdout names a refusal...` (`:72`) to assert `reason`/`providerSignal` |
| model on the command line per CLI | extend `the call is built per credential layout, pointing the CLI at the account home` (`:22`) |
| elapsedMs | extend `the probe runs the planned command with the account home in its environment and answers ok` (`:102`) |

No new test; nothing retired.

## Steps

1. Red: the three extended cases. 2. Return shape. 3. Model mapping. 4. Gate.

## Validation

`node scripts/run-tests.mjs test/runner/provider-credential-probe.test.mjs test/runner/provider-quarantine-probe.test.mjs test/runner/assignment-dispatch.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs`; `node scripts/git-one-door-scan.mjs --root .` (count unchanged); `git diff --stat origin/main...HEAD`.

## Risk / rollback

Risk: a CLI rejects the model flag spelling -> the call exits non-zero, the probe reports it (no state change in this phase). Rollback: revert; the extra fields are unread by old callers.
