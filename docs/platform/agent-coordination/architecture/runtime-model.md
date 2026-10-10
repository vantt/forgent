# Assignment Execution Runtime Model

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/runtime-model.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Execution Chain | Current contract/invariant | src/runner/dispatch/assignment.mjs:283 buildAssignment -> plan.mjs:45 compileDispatchPlan -> assignment-runner.mjs:783 run_<assignment>_<attempt> -> run-result.mjs:350 normalizeRunResult |
| Invariants | Current contract/invariant | Assignment frozen: assignment.mjs:374-419 Object.freeze; distinct Run per attempt assignment-runner.mjs:783,893,931; confidence from evidence run-result.mjs:29-56 (no self-report trust); mutating done w/o evidence = no-evidence (cited at HEAD run-result.mjs:1276-1280) |
| Storage | Mixed implementation and proposal; no blanket implementation claim | Canonical Assignment/Run/RunResult records: assignment.mjs, run-result.mjs, runDir layout in assignment-layout.mjs; CoordinationSession/FlowDefinition/CoordinationProtocol paragraph refers to ADR-008/ADR-009 and src/runner/coordination retired in 2180b4e72 |

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

The concrete failure-family vocabulary is owned by FAILURE_FAMILIES in src/runner/dispatch/run-result.mjs, not the former eight-domain design grouping. Controller/worker/transport/evidence failures must not be collapsed into success or inferred Work completion.

## Storage

Assignment, Run, RunResult, artifacts, and evidence require canonical records
with IDs and references. Session or Mission storage must reference these records
rather than create conflicting copies.

The field-level baseline is defined in
[Assignment, Run, And RunResult Contract](../contracts/assignment-run-runresult.md).

