# Step 3 contract and component-boundary matrix

The matrix contains **22 rows**: 16 contract/boundary rows and six stale
coordination rows inventoried for Step 5.

## Findings

- The live chain from validated contract through Assignment, DispatchPlan,
  `assignment-run.v2`, `agent-result-claim.v2`, RunResult v3/v4 and the Work
  boundary has one state writer at each boundary. No second Work-state writer
  was found.
- S3-01 is incompatible: the preserved advisory cognition/protocol chain names
  the retired Agent Coordination Engine, while the current owner map points to
  Workflow/CollaborationPattern. There is no current Team Cognition producer
  contract to validate.
- Four current cross-area seams have no stable versioned contract id:
  cognition/protocol (S3-01), Assignment→DispatchPlan (S3-04), and
  RunResult→Work driver (S3-09), plus the named but unversioned
  workflow-step-operation document at S3-02.
- CTR010 remains a two-contract collision. The Gateway OpenAPI declares
  `CTR010 · fgos-gateway.v1`; the architecture registry declares
  `CTR010 · confinement-authority.v1` and has no Gateway REST row. No number or
  registry content changed while L11-7 awaits the owner.
- X-STALE-01..06 are inventory-only and keep Step 5 as their sole writer.

## Stop result

Step 3 is **parked**, not accepted: incompatible producer/consumer evidence and
missing contract ids trigger the phase-file stop rule. This does not stop Step
4. The completed matrix and unaffected compatible rows go to independent
architecture/contract review.

## Proof list

- matrix schema/completeness and unique-row validation;
- producer and consumer evidence paths for every non-inventory row;
- contract registry and Gateway OpenAPI comparison;
- retired-name scan separating current owner text from preserved history;
- candidate-link/citation checks and protected-boundary check;
- independent A36 architecture/contract review requested in the combined
  Steps 3-4 request.
