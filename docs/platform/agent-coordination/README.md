# Agent Coordination

```txt
Document type: Area Portal
Audience: Human reviewer, maintainer and implementation agent
Purpose: Route current execution to its owners and retain historical evidence
Design status: Accepted
Implementation: Current-owner navigation; former coordination engine retired
Provenance: Owner A16 whole-area reframe; complete classified input retained in history/retired-engine/files
Writer type: Human + agent coauthor
Canonical for: Area navigation, not runtime schema or old engine status
Use this when: Locating current execution owners or historical coordination claims
Do not use this for: Reinstating the retired CoordinationSession engine
Last reviewed: Pending independent whole-area review
Related:
- docs/specs/runner.md
- docs/platform/agent-coordination/spec.md
- docs/platform/agent-coordination/history/retired-engine/README.md
Supersedes: Stale current-state framing only; no old claim is dropped
Superseded by: None
Added in candidate: Current-owner routing and retirement framing
```

## Current Execution

The former coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. `coordination` is not a current public CLI verb; the actual machine-readable `--help --json` manifest is the CLI inventory.

CollaborationPattern owns Unit collaboration patterns in `src/runner/execution/patterns/index.mjs`; Unit execution enters through `src/runner/execution/run.mjs`. Workflow execution belongs to `src/workflow/runner.mjs` and its Unit execution-core integration.
The surviving Assignment/Run dispatch chain is also current: Assignment building, DispatchPlan compilation, governed execution and RunResult normalization are owned by `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`.

Read [the runner spec](../../specs/runner.md) for the current execution contract, then [this area's current-owner map](spec.md). Do not treat CoordinationSession, CoordinationProtocol or FlowDefinition in the preserved documents as current implemented engine entities.

## Preserved History

The [complete previous portal](history/retired-engine/README.md#literal-snapshot) and [previous spec](history/retired-engine/spec.md#literal-snapshot) remain verbatim, including all original qualifications and statuses. They are non-authority history, not present implementation claims.

Use the snapshots to audit preserved claims. They do not reinstate the retired engine or strengthen proposal/implementation status.

- [Historical architecture](history/retired-engine/architecture/system-context.md#literal-snapshot)
- [Historical CLI proposal](history/retired-engine/proposals/semantic-cli-surface.md#literal-snapshot)
- [Historical implementation alignment](history/retired-engine/verification/implementation-alignment.md#literal-snapshot)
- [Retired documentation policies and migration plans](history/documentation-migration/documentation-governance.md)

## Surviving Current Material

The retired engine no longer defines this area's live runtime. Current material
is narrower, but not empty: it retains the dispatch/result/recovery boundaries
that have surviving executable owners, and four cognitive companions consumed
by the registered architecture-advisory skill. No current CoordinationSession,
FlowDefinition, CoordinationProtocol or `fgos coordination` contract is retained.

| Reading need | Current candidate material |
|---|---|
| Execution and Workflow ownership | [spec.md](spec.md), with links to the runner spec and executable owners |
| Retained dispatch boundary | [Dispatch control plane](architecture/dispatch-control-plane.md), [runtime model](architecture/runtime-model.md) |
| Evidence and outcome | [Evidence/results](architecture/evidence-and-results.md), [RunResult contract](contracts/assignment-run-runresult.md), [visibility](architecture/visibility-and-herdr.md) |
| Recovery and control | [Recovery](architecture/runtime-recovery-design.md), [run control](architecture/run-handle.md), [recovery choice](architecture/executor-health-and-fallback.md) |
| Work and result authority boundaries | [Work integration](architecture/work-integration.md), [ADR-001](decisions/ADR-001-work-lifecycle-authority.md), [ADR-003](decisions/ADR-003-assignment-run-runresult-separation.md), [ADR-005](decisions/ADR-005-herdr-visibility-only.md), [ADR-011](decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md) |
| Cognitive advisory quality, not runtime recipes | [Coordinator companion](playbooks/prompts/architecture-advisory-coordinator.md), [role doctrine](playbooks/architecture-advisory-role-doctrine.md), [artifact templates](playbooks/architecture-advisory-artifact-templates.md), [evaluation rubric](playbooks/architecture-advisory-evaluation-rubric.md) |
| Dated physical evidence | [Verification index](verification/README.md); evidence payload bytes and paths remain unchanged |
| Legal Workflow operations and current vocabulary | [Operation contract](contracts/workflow-stage-operation.md), [vocabulary index](vocabulary/README.md), [trigger surface](architecture/group-thinking-trigger-surface.md) |
| Provenance, compatibility and domain harness decisions | [Decision index](decisions/README.md), including current ADR-002, ADR-004, ADR-006 and ADR-007 |
| Current intended design, not blanket implementation | [Proposal index](proposals/README.md), [foundation vision](vision.md); section status distinguishes proposals from implemented behavior |
| Owner-retained manual operating material | [Operating harness](playbooks/coordination-operating-harness.md), [master coordinator](playbooks/prompts/master-coordinator.md); these are not the registered architecture-advisory runtime |
| Classified prior files | [Whole-input history](history/retired-engine/files/README.md#literal-snapshot); historical statuses and links do not establish present implementation |

The registered skill explicitly retains the four cognitive companions and
rejects historical runtime recipes (`core/skills/fgos-architecture-panel/SKILL.md:135-142`).
This reframe changes candidate placement and framing only; it does not promote
the area, accept historical proposals or replace the runner spec.
