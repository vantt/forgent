# Step 3 contract and component-boundary matrix

The matrix contains **22 rows**: 16 contract/boundary rows and six stale
coordination rows inventoried for Step 5.

## Findings

- The live chain from validated contract through Assignment, DispatchPlan,
  `assignment-run.v2`, `agent-result-claim.v2`, RunResult v3/v4 and the Work
  boundary has one state writer at each boundary. No second Work-state writer
  was found.
- Under L11-12, S3-01 is historical/deferred intent, not a current seam. The
  engine is retired and `runPattern` has no cognition producer, so it receives
  no contract id. Step 5 owns the visible superseded label.
- Under L11-13, S3-09 is covered by CTR001/CTR002 and the run-result contract in
  S3-08. The remaining confidence/category-to-action mapping is an internal
  driver-policy documentation gap queued as `P7-DOC-GAP-01`, not a new wire id.
- Under L11-14, the two live seams are registered: CTR012 names
  `workflow-step-operation`, and CTR013 names Assignment. Their current payloads
  carry no version field. DispatchPlan stays inside `assignment-run.v2`.
- A45 leaves `CTR010 · fgos-gateway.v1` unchanged and adds its missing Gateway
  REST registry row. `confinement-authority.v1` moves to verified-free CTR011;
  that name is a documentation-only registry label, not a code version stamp.
- The S3-13 implementation citation now points to the shape check at
  `src/runner/dispatch/config.mjs:394`; S3-09 no longer attributes RunResult
  consumption to `fanout-batch.mjs`.
- X-STALE-01..06 are inventory-only and keep Step 5 as their sole writer.

## Stop result

Step 3 is **accepted-pending-review**: all prior stop arrays are empty after
A45 and L11-12..L11-14. S3-01's Step 5 route and `P7-DOC-GAP-01` are bounded
documentation follow-ups, not Step 3 stop conditions. Only the changed rows and
candidate edits return to independent architecture/contract review.

## Proof list

- matrix schema/completeness and unique-row validation;
- producer and consumer evidence paths for every non-inventory row;
- contract registry and Gateway OpenAPI comparison;
- retired-name scan separating current owner text from preserved history;
- candidate-link/citation checks and protected-boundary check;
- independent A36 architecture/contract review requested in the combined
  Steps 3-4 request.

## Closing citation refresh

S3-09 now cites `loop.mjs:103,901-915,1538` and `workflow/runner.mjs:337,703`. All 22 rows have current statement and evidence file hashes, spans and probes in the machine matrix and `step-09-close-pin-verification.json`. The prior review verdict is historical; bounded re-review of refreshed rows is pending.
