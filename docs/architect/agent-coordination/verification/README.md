# Agent Coordination Verification

> Migration status: This document is a legacy/current source for
> `docs/platform/agent-coordination/verification/README.md`. Do not edit divergent design
> claims here without also updating the target doc or migration inventory.

Document type: Index
Design status: N/A
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: navigation to conformance evidence

## Evidence Sets

- [Team Dispatch V1 trace](team-dispatch-v1/index.md) records cell-level
  implementation, review, red-team, and live proof evidence.

Verification establishes implementation conformance at a point in time. It does
not define architecture or change a contract.

Future verification should separate:

- deterministic unit/integration tests;
- negative and adversarial tests;
- live provider/executor scenarios;
- traceability matrix from requirement to code/test/evidence;
- known unrelated failures;
- date/commit/configuration of the proof.
