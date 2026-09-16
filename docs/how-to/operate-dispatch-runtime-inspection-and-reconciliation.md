---
docType: how-to
title: Operate Dispatch Runtime Inspection And Reconciliation
tags: [dispatch, runner, operations, recovery-boundary]
updated: 2026-09-16
source: plans/260915-dispatch-operability-implementation
---

# Operate Dispatch Runtime Inspection And Reconciliation

Use these commands when a local Dispatch Assignment/Run projection looks stale
or incomplete and you need a public, evidence-preserving door before deciding
what to do next.

## Inspect Runtime State

Choose exactly one selector:

```sh
fgos dispatch inspect --run <runId>
fgos dispatch inspect --assignment <assignmentId>
fgos dispatch inspect --cwd <absolute-worktree-path>
```

`inspect` is read-only. It reports `RunObservation` facts, a terminal
`RunResult` when one exists, duplicate or incomplete materializations, and
non-authorizing recovery ownership hints.

Treat `inspectionStatus` this way:

- `resolved`: Dispatch found one ownership-complete subject and can show the
  current terminal/in-flight facts it has.
- `partial`: some expected ownership, admission, materialization, or workspace
  evidence is missing or malformed; do not infer a recovery owner from it.
- `conflicting` or `ambiguous`: more than one candidate exists; choose no
  candidate until the conflict is resolved by a narrower owner door or manual
  investigation.
- `not-found`: Dispatch has no matching local subject.

## Plan Reconciliation

Use reconciliation only for local guard/projection repair:

```sh
fgos dispatch reconcile plan --cwd <absolute-worktree-path>
fgos dispatch reconcile plan --action collect-result --run <runId>
fgos dispatch reconcile plan --action clear-assignment-claim --assignment <assignmentId>
fgos dispatch reconcile plan --action repair-projection --run <runId>
```

The plan carries a snapshot digest, action key, resource incarnation, and
expiry. A planned action is not authority to run code; it is only a prepared
CAS repair.

## Apply Reconciliation

Apply the exact plan JSON returned by `plan`:

```sh
fgos dispatch reconcile apply --plan '<plan-json>'
```

`apply` re-reads current state before writing. `plan-stale`, `blocked`,
`needs-input`, and `refused` are successful refusals, not crashes. Re-plan only
after you understand what changed.

## Recovery Boundary

`dispatch.runtime.reconcile` never kills, signals, retries, relaunches,
resumes, reattaches, reassigns, takes over, admits, or cancels a Run. If
inspection reports a `recoveryAuthority.observeCommand`, read it as a routing
hint only. Use the named owner door separately; do not feed that hint back into
reconciliation as permission.
