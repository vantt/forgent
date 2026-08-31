# Assignment Execution Runtime Model

Document type: Architecture
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: semantic request, dispatch, runtime attempt, and normalized result flow

## Execution Chain

```txt
legal Stage Operation
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
