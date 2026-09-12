# Phase 00 — Freeze Existing Runtime Behavior

**Plan:** [Runtime Recovery Implementation Plan](plan.md)
**Status:** PROPOSED

## Purpose

Create a reproducible baseline before changing Run admission, Herdr launch
identity, fallback mapping or session recovery. This phase is observation and
fixture work only; it must not enable the proposed runtime-recovery profile.

## Inputs

- `docs/specs/runner.md`
- `docs/architect/agent-coordination/architecture/runtime-recovery-design.md`
- `src/runner/dispatch/liveness.mjs`
- `src/runner/dispatch/recovery.mjs`
- `src/runner/dispatch/herdr-round.mjs`
- `src/runner/main-checkout-lock.mjs`
- `src/runner/coordination/{replay,session-engine}.mjs`

## Baseline Scenarios

| ID | Scenario | Frozen observation |
|---|---|---|
| S0-1 | `blocked` and `paused-limit` through the runner loop | Record current error-class mapping and whether retry matrix consumes an attempt. |
| S0-2 | Herdr prompt timeout before acknowledgement | Record resend-until-ack behavior; transport resend is not semantic duplicate delivery. |
| S0-3 | `run.mjs` recovery/continuation request after steps | Record whether close-after-steps is invoked on every path. |
| S0-4 | Lock holder past TTL, live PID and dead PID | Record current reclaim behavior separately from proposed generation-lock behavior. |
| S0-5 | Result link after a retry declaration | Record current fencing and any destination identity gap. |
| S0-6 | BL1 premature partial close | Preserve the smallest fixture that demonstrates early terminal close and its observable outcome. |
| S0-7 | Herdr create/bind/locator crash windows | Record which windows have a persisted lookup key and which can produce an orphan. |

## Evidence Format

Each fixture records:

```json
{
  "scenario": "S0-1",
  "inputDigest": "sha256:...",
  "injectedInterruption": "none|after-create|after-bind|before-ack",
  "observedOutcome": "...",
  "attemptCountBefore": 0,
  "attemptCountAfter": 0,
  "resourceRefs": [],
  "notes": "untrusted diagnostic text"
}
```

Diagnostic notes do not become acceptance evidence. Fixtures must preserve the
provider line, error class, Run/Assignment ids and resource locator facts when
available.

## Required Checks

- Run the focused runner, coordination and lock test suites.
- Run the existing Herdr adapter tests with a fake client; do not require a live
  gateway for the deterministic baseline.
- Verify the current Herdr name is timestamp-derived and that no run-scoped
  gateway lookup exists yet.
- Verify replay's post-terminal neutralization and current terminal absorption.
- Verify `git diff --check` and that this phase changes no source behavior.

## Exit Gate

S0 is complete only when the baseline fixtures are stored under the phase
reports, the focused tests are green, and every known behavior change is labeled
as either preserved baseline or a named future slice. In particular:

- no `blocked`/`paused-limit` remapping is shipped in S0;
- no deterministic Herdr naming is shipped in S0;
- no terminal transfer behavior is changed in S0;
- no lock reclaim policy is changed in S0.

The BL1 fixture must be rerun after `tsk-5qj` closes. If its outcome changes the
desired terminal-transfer policy, reopen Gate 1 before planning S5.
