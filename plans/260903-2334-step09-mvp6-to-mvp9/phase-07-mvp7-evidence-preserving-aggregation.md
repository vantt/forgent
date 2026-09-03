# Phase 07 - MVP7 Evidence-Preserving Aggregation

## Objective

Separate cognitive aggregation from session completion and prove one honest
synthesis method before introducing voting or convergence machinery.

## Candidate Contract

```text
completion.aggregation.method = evidence-preserving-synthesis
completion.aggregation.outputOperationRef
completion.aggregation.sourceOperationRefs[]
completion.aggregation.requiredDisclosures[]

aggregation-validated
  aggregationId
  method
  assignmentId/runId/outputArtifactRef
  sourceResultRefs
  outcome = consensus | qualified | no-consensus
  dissentRefs/unresolvedContributionRefs
  missingActors/failedActors/artifactRevisionRefs
  validatedBy/ts
```

## Cells

### P07.1 Team Cognition Evaluator

- Establish the minimal Team Cognition module/port boundary.
- Validate structured source coverage and required disclosures against immutable
  RunResult/artifact refs.
- Never rewrite evidence, alter confidence, dispatch work, or transition a
  session.
- This cell may start after P00 in a new exclusive path.

### P07.2 Isolated Evaluator Fixtures And Tests

- Cover all three outcomes and deterministic validation.
- Reject missing sources, hidden dissent, stale artifact revision provenance,
  malformed disclosure, and claims of consensus with unresolved dissent.
- Do not integrate with shared session files yet.

### P07.3 FlowDefinition And Session Integration

- Keep existing `completion.mode` semantics unchanged.
- Add the separate aggregation declaration and validation event/provenance.
- Agent Coordination may use a validated cognitive outcome as terminal input
  but retains terminal transition authority.
- Replay rejects worker-shaped/self-validated aggregate truth.

### P07.4 Surface And Regression Proof

- Show/replay presents method, outcome, sources, dissent, unresolved items,
  failures/omissions, and artifact revisions.
- Prove aggregation never upgrades RunResult confidence.
- Run CLI/headless parity and unchanged isolation fixtures.

## Exit

- One evidence-preserving method is real and replayable.
- Completion eligibility, cognitive validation, and terminal authority remain
  separate.
- Vote, rank tally, weighted scoring, convergence, and prose parsing remain
  absent.
