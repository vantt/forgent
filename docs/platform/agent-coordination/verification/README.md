# Agent Coordination Verification

```txt
Document type: Collection index
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Accepted at atomic cutover
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Source material from the earlier revision of this README at commit `947dc310396071a4d530216d5c06d05993d63bf5`; live routes and the explicitly stated implementation corrections are adapted here.
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/runner/spec.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Carriage note: Liveness evidence and explicit implementation/proposal distinction
```

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
| Foundation and standalone coordination | CoordinationSession, FlowDefinition, and Work-isolation boundaries | [Step 08](step-08-standalone-coordination/index.md) |
| Runtime recovery | admission fencing, launch reconciliation, fallback, and recovery status split | [Runtime recovery](runtime-recovery/) |
| Dispatch operability | worker claim, execution-contract persistence, RunResult v2, inspect, and reconcile boundaries | [Dispatch operability](dispatch-operability-implementation/) |
| Executor policy and placement | executor-policy baseline and placement-policy limits | [Executor-policy seams](executor-policy-dispatch-seams/p00.md) |
| Code implementation track policy | targeted proof per cell and full proof at declared gates | [Track policy](code-implementation-track-policy/) |
| Group thinking | protocol, cohort, and advisory-panel evidence, including known quality gaps | [Step 09 evidence](step-09-mvp6-to-mvp9/index.md) |
| Visibility / Herdr | visibility-only boundary | [Live proof](visibility-herdr/v0-live-proof-2026-09-07.md) |
| Team Dispatch V1 | original cell-level implementation, review, red-team, and live proof | [Team Dispatch V1](team-dispatch-v1/index.md) |

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
