# Agent Coordination Proof Preservation

```txt
Document type: Proof preservation table
Audience: Human reviewer, maintainer and implementation agent
Purpose: Navigate preserved design and historical material without asserting a retired runtime
Design status: Archived
Implementation: Retired engine material is non-authority history; verified retained units remain unchanged
Provenance: Source material from `docs/platform/agent-coordination/history/documentation-migration/proof-preservation.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; retirement framing, metadata and current-owner navigation are adapted here.
Writer type: Human + agent coauthor
Canonical for: Retained-document navigation only; no current engine authority
Use this when: Locating current execution owners or auditing historical claims
Do not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/runner/decisions/h-aabefc85f0c9.md#coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner
- docs/platform/agent-coordination/history/retired-engine/history/documentation-migration/proof-preservation.md
Supersedes: Stale current-state framing only; all old claims are preserved verbatim
Superseded by: Runtime ownership in docs/platform/runner/spec.md#spec-runner-vòng-tự-hành
Carriage note: Retirement framing and current-owner navigation
```

2026-11-03 cutover note: The legacy runner citation above is a historical coordinate, not a post-cutover link. Prepared successors: `docs/platform/runner/spec.md`.

Proof trees must remain linkable. Summary rows here do not replace the proof
roots, logs, current-cell files, reviews, red-team reports, or known gaps.

| Proof root | Proves / supports | Consumed by target doc | Move policy | Known gaps | Notes |
|---|---|---|---|---|---|
| `docs/architect/agent-coordination/verification/runtime-recovery/p01.md` | Run admission/control-epoch fencing. | runtime-recovery architecture / implementation alignment | link-only | Later recovery slices still split. | Required runtime-recovery row. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p02l.md` | cli-spawn launch reconciliation. | runtime-recovery verification index | link-only | Preserve exact scope. | Required runtime-recovery row. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p02h.md` | Original herdr-spawn proof attempt and falsified direct-command typing context. | runtime-recovery verification index | link-only | Do not promote falsified invocation. | Historical/evidence context. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p02h-reopen.md` | Authoritative shipped herdr-spawn bwrap launcher-script mechanism and residual accepted gap. | runtime-recovery architecture / implementation alignment | link-only | Residual accepted gap remains. | Must override earlier pseudocode when describing shipped behavior. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p03.md` | Governed fallback. | runtime-recovery verification index | link-only | Split status must stay explicit. | Required runtime-recovery row. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p04.md` | Pure evaluators. | runtime-recovery verification index | link-only | Split status must stay explicit. | Required runtime-recovery row. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p05.md` | Standalone `dispatch recover`. | runtime-recovery verification index | link-only | S5 transfer/import/budget/apply not implemented. | Required runtime-recovery row. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p05s.md` | Session-owned recovery read/apply door. | runtime-recovery architecture / implementation alignment | link-only | Only session-recovery half of S5 implemented. | Required runtime-recovery row. |
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I01.md` | `agent-result-claim.v2` prompt/validation contract proof. | assignment/run/runresult contract and implementation alignment | link-only | Worker claim is not normalized proof. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I02.md` | Effective execution contract persisted pre-launch and inspectable. | dispatch-control and implementation alignment | link-only | Preserve inspectability status. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I03.md` | `RunResult` v2, legacy-v1 interpretation, attribution dimensions. | assignment/run/runresult and evidence/results | link-only | Preserve documented residuals. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I04.md` | `dispatch.runtime.inspect` read model and public CLI projection. | spec / dispatch-control | link-only | Deferred label-consistency residual. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I05.md` | `dispatch.runtime.reconcile` CAS guard/projection repair and negative routes. | spec / dispatch-control | link-only | Residual findings must stay visible. | Required recent-track row. |
| `plans/260915-dispatch-operability-implementation/reports/track-closeout.md` | Production-door proof summary, full-suite result, and deferred non-capabilities. | implementation alignment | evidence-only | Track-complete until current checkout verified. | Keep as plan evidence. |
| `docs/architect/agent-coordination/verification/executor-policy-dispatch-seams/p00.md` | Executor-policy baseline verification root. | dispatch-control placement-policy notes | link-only | Later phase proof lives across plan/code/tests. | Inventory must keep later status split. |
| `plans/260915-executor-policy-dispatch-seams/plan.md` | Phase status for PlacementPolicy, self-verifying binder, redirect retirement. | dispatch-control / proposal-status | evidence-only | Phase 08 pending status must not be erased. | Required recent-track row. |
| `plans/260916-account-rotator/design.md` | Provider Capacity Rotator design and same-provider/global-config limits. | provider-capacity proposal/status | link-only | Current shipped slice needs focused verification. | Required recent-track row. |
| `plans/260916-account-rotator/plan.md` | Provider Capacity Rotator implementation contract. | provider-capacity proposal/status | link-only | Not cross-provider fallback; not project-local credential inventory. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/code-implementation-track-policy/p01.md` | Policy-track proof slice P01. | playbook / verification policy | link-only | See p05 for remaining policy proof. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/code-implementation-track-policy/p02.md` | Policy-track proof slice P02. | playbook / verification policy | link-only | None recorded here. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/code-implementation-track-policy/p03.md` | Policy-track proof slice P03. | playbook / verification policy | link-only | None recorded here. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/code-implementation-track-policy/p04.md` | Policy-track proof slice P04. | playbook / verification policy | link-only | None recorded here. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/code-implementation-track-policy/p05.md` | Policy-track proof slice P05 and known gaps. | playbook / verification policy | link-only | Preserve final policy scope. | Required recent-track row. |
| `plans/260915-code-implementation-track-policy/reports/track-closeout.md` | Final policy-track closeout and proof status. | playbook / verification policy | evidence-only | No policy YAML/validator was accepted. | Required recent-track row. |
| `plans/260915-0455-test-suite-feedback-cost/decision-lock.md` | Test feedback/cost decisions. | verification/history | link-only | P05 related-test selector deferred. | Required recent-track row. |
| `plans/260915-0455-test-suite-feedback-cost/phase-08-evidence-decision-and-handoff.md` | Test feedback/cost handoff and deferred status. | verification/history | link-only | Preserve P05 deferred status. | Required recent-track row. |
| `plans/260917-cold-resumable-coordination-dag/plan.md` | DAG implementation plan and non-goals. | proposals / proposal-status | link-only | Not accepted runtime truth by itself. | Required recent-track row. |
| `docs/architect/agent-coordination/proposals/dag-request-scheduler.md` | Candidate DAG shape and unresolved questions. | proposals / proposal-status | link-only | Canonical for nothing until accepted. | Required recent-track row. |
| `docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md` | CoordinationSession/FlowDefinition foundation implementation proof index. | future spec and contracts | link-only | Verify exact per-cell status before quoting. | Supports core implemented claims. |
| `docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md` | Early group-thinking substrate proof. | group-thinking status | link-only | Quality proof mixed. | Keep mechanism vs product-quality distinction. |
| `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md` | Later group-thinking/advisory proof tree. | group-thinking status | link-only | Known reports and rechecks must remain reachable. | Large proof tree remains legacy-current. |
| `docs/architect/agent-coordination/verification/visibility-herdr/v0-live-proof-2026-09-07.md` | Herdr visibility proof. | visibility/Herdr architecture | link-only | Visibility only; not Run truth. | Supports AC-CLAIM-010. |

## Boundary Note

No component-boundary change in this Phase 0/1 migration.
