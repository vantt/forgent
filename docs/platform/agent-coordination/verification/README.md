# Agent Coordination Verification

Document type: Index
Design status: N/A
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: navigation to conformance evidence

## Evidence Sets

During migration, target docs link to retained legacy proof roots. The mirrored
target directories remain navigable copies, but do not replace the dated
evidence artifacts or their recorded environments.

| Evidence set | Supports | Current proof root |
|---|---|---|
| Foundation and standalone coordination | CoordinationSession, FlowDefinition, and Work-isolation boundaries | [Step 08](../../../architect/agent-coordination/verification/step-08-standalone-coordination/index.md) |
| Runtime recovery | admission fencing, launch reconciliation, fallback, and recovery status split | [Runtime recovery](../../../architect/agent-coordination/verification/runtime-recovery/) |
| Dispatch operability | worker claim, execution-contract persistence, RunResult v2, inspect, and reconcile boundaries | [Dispatch operability](../../../architect/agent-coordination/verification/dispatch-operability-implementation/) |
| Executor policy and placement | executor-policy baseline and placement-policy limits | [Executor-policy seams](../../../architect/agent-coordination/verification/executor-policy-dispatch-seams/p00.md) |
| Code implementation track policy | targeted proof per cell and full proof at declared gates | [Track policy](../../../architect/agent-coordination/verification/code-implementation-track-policy/) |
| Group thinking | protocol, cohort, and advisory-panel evidence, including known quality gaps | [Step 09 evidence](../../../architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md) |
| Visibility / Herdr | visibility-only boundary | [Live proof](../../../architect/agent-coordination/verification/visibility-herdr/v0-live-proof-2026-09-07.md) |
| Team Dispatch V1 | original cell-level implementation, review, red-team, and live proof | [Team Dispatch V1](../../../architect/agent-coordination/verification/team-dispatch-v1/index.md) |

The phase-by-phase move policy and known gaps are in
[Proof Preservation](../history/documentation-migration/proof-preservation.md).

Verification establishes implementation conformance at a point in time. It does
not define architecture or change a contract.

Future verification should separate:

- deterministic unit/integration tests;
- negative and adversarial tests;
- live provider/executor scenarios;
- traceability matrix from requirement to code/test/evidence;
- known unrelated failures;
- date/commit/configuration of the proof.
