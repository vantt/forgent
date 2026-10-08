# Assignment Execution Runtime Model

```txt
Document type: Architecture
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Assignment Execution Runtime Model
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/architecture/runtime-model.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved architecture material for Assignment Execution Runtime Model; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related: [Assignment, Run, And RunResult Contract](../contracts/assignment-run-runresult.md), [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md), [CoordinationSession Contract](../contracts/coordination-session.md)
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Architecture
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-09-01
Canonical for: semantic request, dispatch, runtime attempt, and normalized result flow

## Execution Chain

```txt
declared legal Stage Operation
  or validated inline execution contract
  -> Assignment
    -> dispatch policy resolution
      -> DispatchPlan
        -> Run
          -> worker result / runtime settlement / artifacts
            -> RunResult
              -> evidence-aware driver decision
```

## Invariants

- Assignment is immutable semantic intent, not an execution attempt.
- Assignment provenance identifies whether its contract came from a declared
  operation/TaskSpec or validated agent-led planning.
- The inline path must satisfy foundation authority, budget, mutation, privacy,
  evidence, and dispatch validation; it is not a compatibility bypass.
- Each dispatch attempt creates a distinct Run.
- Retry creates another Run for the same Assignment.
- Each settled Run produces a normalized RunResult or explicit failure record.
- Prior Runs and evidence remain available after retry.
- Result confidence is derived from evidence policy, not worker self-report.
- Driver consumption of RunResult does not grant direct Work mutation authority.

## Failure Domains

The runtime distinguishes:

- assignment construction/validation failure;
- dispatch policy rejection;
- launch/transport failure;
- process timeout or non-zero exit;
- malformed or missing worker result;
- evidence mismatch or staleness;
- semantic task failure;
- persistence/recovery failure.

These outcomes must not collapse into a generic successful process exit.

## Storage

Assignment, Run, RunResult, artifacts, and evidence require canonical records
with IDs and references. Session or Mission storage must reference these records
rather than create conflicting copies.

The field-level baseline is defined in
[Assignment, Run, And RunResult Contract](../contracts/assignment-run-runresult.md).

CoordinationSession persists membership as a one-way reference to these
canonical records (session references Assignment; Assignment never carries a
session/coordination field) per
[ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)
and the [CoordinationSession Contract](../contracts/coordination-session.md).
A declared `CoordinationProtocol` lowers into this same execution chain
through the shared `FlowDefinition` IR
([ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md);
[FlowDefinition Contract](../contracts/flow-definition.md)) exactly like a
declared Workflow Stage Operation does; neither gains a private Run/RunResult
path.
