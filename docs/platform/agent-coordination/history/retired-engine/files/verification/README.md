# Historical File: dated evidence navigation; constitution-required owner of 867 physical payloads

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/verification/README.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 e78bac480615f20e753369e8b8d624ff3a67a123d17e8a6c8c396a6fed201f40
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current authority
Use this when: Auditing original claims or section-level retirement
Do not use this for: Current runtime behaviour, accepted proposals or executable routing
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: None; this is an exact historical carrier
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Historical framing only; literal file bytes are unchanged
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims.

## Literal Snapshot

~~~~text
# Agent Coordination Verification

```txt
Document type: Collection index
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Agent Coordination Verification
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/verification/README.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved collection-index material for Agent Coordination Verification; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md
- docs/architect/agent-coordination/verification/executor-policy-dispatch-seams/p00.md
- docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Index
Design status: N/A
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: navigation to conformance evidence

## Evidence Sets

Added in candidate: The migration navigation paragraph, evidence-root table and Proof Preservation pointer below predate this batch (`fcfe78cb8`); they are candidate navigation, not newly verified conformance. During migration, target docs link to retained legacy proof roots. The mirrored
target directories remain navigable copies, but do not replace the dated
evidence artifacts or their recorded environments.

- [Team Dispatch V1 trace](team-dispatch-v1/index.md) records cell-level
  implementation, review, red-team, and live proof evidence.

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
~~~~
