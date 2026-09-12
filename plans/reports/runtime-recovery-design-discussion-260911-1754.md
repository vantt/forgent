# Runtime Recovery: Discussion Record And Design Handoff

Date: 2026-09-11. Artifact type: discussion log and design handoff.
Status: product direction agreed; detailed design draft completed in
`docs/architect/agent-coordination/architecture/runtime-recovery-design.md`.

## Purpose And Sources

This records the discussion following the independent runtime-recovery review. It preserves the user's agreements, the corrections made during discussion, and the technical work the assistant can now carry forward autonomously. It does not promote an unimplemented proposal to an accepted canonical contract.

- Review request: `plans/reports/review-prompt-260911-1654-runtime-recovery-design-second-opinion.md`.
- Independent review: `plans/reports/design-review-second-opinion-260911-1709-runtime-recovery.md` (A-G, 15 findings, 20 bug/proof mappings).
- Earlier decisions: `plans/reports/design-review-260911-1617-run-handle-continuation-health.md`, especially sections 6-8.
- Proposal files: `docs/architect/agent-coordination/architecture/run-handle.md`, `coordination-continuation-recovery.md`, `executor-health-and-fallback.md`.
- Canonical anchors: `docs/specs/reading-map.md`, `docs/specs/runner.md`, Agent Coordination's Run/Session/FlowDefinition contracts and runtime/dispatch/visibility architecture.

## Agreed Direction

1. Keep the long-horizon problem in scope: reconnecting execution, replacing a failed worker, actor replacement, continuing unfinished work through a replacement session, and progression between cells must fit one coherent architecture.
2. This is not authorization to rebuild all Agent Coordination. Preserve the existing Assignment -> DispatchPlan -> Run -> RunResult chain, protocol graph, authorization, visibility, quorum, evidence and confinement boundaries.
3. A small initial implementation must be a valid subset of the longer-term contract. A narrow rollout does not justify designing away later continuity requirements.
4. The design must be simple, clean, hexagonal and SRP. A map of recovery scenarios is not a request for one new subsystem per scenario or a generic continuity engine over everything.
5. Work identity, objective and acceptance must survive a change of worker or coordinating process. Progress is distinct from execution authority; replacement preserves history instead of deleting it.
6. Agents should focus on their assigned work. Harness correctness must not depend on agents remembering a long recovery procedure or manually rebuilding IDs, grants, counters and child requests.
7. Explicit checkpoints inside every small task are not required. Recovery must support interruptions at arbitrary points, including partially written or invalid intermediate artifacts.
8. A worker-provided progress note is useful but optional, potentially stale and never authoritative completion evidence.
9. Explicit checkpoints remain a supported future capability for operations that naturally have resumable boundaries, such as batches, cursors or transaction receipts.
10. For deliberate session continuation, the favored direction is a protocol-declared legal transfer boundary, carrying verified artifacts/provenance and establishing fresh execution authority. This is not a universal prerequisite for replacing a failed worker inside a cell.

The seven decisions in the original review prompt remain constraints: Run owns admission; lease and incarnation guarantees are mandatory; reuse ladder/matrix/fallbackExecutors semantics; preserve engine authorization/partialPolicy semantics except the named fixes; defer health store/scoring; explicit Node/Rust ownership/version behavior; implement required Node guarantees before porting the writer.

## Vocabulary And Corrections

| Concept | Meaning in this discussion | Important boundary |
|---|---|---|
| Cell | A bounded unit of work with an objective and acceptance conditions in its governing track/workflow | Do not assume it is a mandatory core entity or identical to a session. |
| CoordinationSession | A bounded coordination execution with its own state, authority and budget | Session replacement does not necessarily mean a new cell. |
| Assignment | The semantic task to be executed | A retry preserves it; a newly authorized revision/recheck may create a new Assignment. |
| Run | One attempt on an Assignment | Reconnect retains the Run; retry/replacement execution creates another Run. |
| Actor/role | A participant identity/responsibility within coordination | Replacing an executor for one Run is not automatically replacing an actor across subsequent tasks. |
| Handoff | Deliberate transfer at a known, validated boundary | End-of-cell and declared resumable checkpoints are examples. |
| Recovery takeover | Replacing interrupted execution after reconciling actual state | Does not require a checkpoint prepared by the old worker. |

The user explicitly described a long session containing multiple cells. Earlier assistant examples also considered one cell requiring multiple sessions. Neither relationship is established here as the universal current implementation. Detailed design must inspect actual consumers and distinguish domain meaning from today's storage/naming conventions before selecting a representation. Do not hardcode one cell = one session, or introduce a mandatory Cell Engine on the strength of this discussion.

Corrections preserved:

- The assistant initially expanded worker replacement into cross-session transfer too quickly, then narrowed the scope too far. The user explicitly requested long-horizon coverage; the final scope includes both, with distinct mechanisms.
- Requiring all replacement to occur at a protocol checkpoint was too restrictive. That requirement is applicable to deliberate protocol-state transfer, not arbitrary worker crash recovery.
- An optional/additive field is not evidence of low risk: enabled continuation touches authority, visibility, budget and replay together.
- “Continue where the worker stopped” means reconstructing usable work state, not restoring the worker's exact private reasoning or assuming every partial edit is correct.

## Recovery Levels

| Scenario | Intended response | Preserved identity/constraints |
|---|---|---|
| Coordinator/observer disconnect; worker still live | Reattach/observe the existing Run | Same Run, Assignment and coordination context. |
| Worker cannot continue its task | Reconcile, establish takeover eligibility, admit a replacement Run, possibly on another executor | Same Assignment and original acceptance conditions. |
| Role needs a replacement participant across tasks | Use actor replacement under existing role/protocol rules | Role responsibility, provenance and authorization boundaries. |
| Session cannot continue; cell objective remains unfinished | Propose a legal replacement session with lineage and explicit authority/budget | Objective, artifacts, history and acceptance; no implicit quorum or authorization inheritance. |
| Cell is accepted and the next cell starts | Normal track/workflow progression | Governing objective and accepted evidence; not classified as failure recovery. |

## Within-Cell Recovery

The default should preserve recoverable state rather than demand worker-authored checkpoints.

| Level | Available material | Recovery behavior |
|---|---|---|
| Baseline | Assignment, original inputs and base state | Re-execute when no later state can be used safely. |
| Recoverable state | Preserved workspace/artifacts, observations and execution receipts where supported | Inspect/reconcile, then retain, repair or discard partial work as appropriate. |
| Declared checkpoint | Operation-specific resumable milestone with explicit preconditions | Resume according to that operation's contract. |

Potential recovery input includes the immutable objective and constraints, base revision, preserved workspace/diff including uncommitted edits, latest verification result tied to the state it checked, known pending/unknown effects, and optional worker progress notes. Not all of this is currently guaranteed by the implementation; the design must label capture coverage and missing/unknown facts explicitly.

Example: a worker dies after editing file A and half of file B, before running tests. The replacement may inherit a syntax-invalid workspace. That is permissible as recovery input, not as an accepted checkpoint or completion proof. It inspects the actual changes and works toward the original acceptance conditions.

Responsibilities:

- Runtime preserves available work state and execution identity, and distinguishes a disconnected worker from one that cannot continue.
- The old worker must be stopped or isolated from the transferred writable resources before another worker takes them over. Unknown ownership does not authorize concurrent mutation.
- The operation boundary supplies effect-reconciliation/retry conditions. Preserved files do not prove whether an email, payment or external API effect happened.
- The replacement worker treats notes and partial edits as untrusted claims requiring inspection, not authoritative progress.
- Result evaluation still applies the original evidence/acceptance contract.
- Independent work may proceed while an ambiguous task is parked; a question or unknown effect must not unnecessarily block unrelated work.

## Deliberate Session Continuation

The favored architecture uses a protocol-declared transfer point with input requirements, source eligibility, destination protocol/version, context permissions, and budget/authority provenance.

Artifacts from the parent become attributable inputs to the child. They do not automatically become completed child operations, quorum credit or reusable authorization. A child must have a legal entry/request under its chosen protocol. A bare list of remaining operations is insufficient to prove reachability.

A transfer needs a stable identity, durable pending/completed state, deduplication and crash recovery. Once the transfer takes ownership of specified unfinished work, the parent cannot keep admitting that same work. The parent retains history and may need to collect late results. Exact serialization, parent disposition and transfer storage are still technical design work.

The assistant recommended a first proof where the parent cannot continue because of budget, artifacts are stable, and no relevant Run remains live/unknown; transfer the remaining work to one supported destination protocol with a separately authorized child budget. This is a rollout recommendation, not a newly locked limitation of the long-term contract. Partial transfer, live-worker transfer and shared chain-budget allocation remain long-horizon cases to account for explicitly.

## Impact On Existing Components

| Area | Expected work | Boundary to preserve |
|---|---|---|
| Run runtime and RunHandle | Atomic admission, launch reconciliation, guarded control, replacement attempts, strict result eligibility | Dispatch runtime owns execution; no new admission authority. |
| Assignment/result evaluator | Preserve task identity and interpret partial/late outputs | Recovery notes and runtime observations cannot replace evidence. |
| FlowDefinition schema and adopting protocols | Declare legal transfer points and destination/input rules | No bespoke core knowledge of coding task steps; non-adopting protocols remain supported. |
| Session engine/store/replay | Transfer validation, lineage, claims, budget/authority and replay behavior | Existing write doors; no generic graph/quorum replacement. |
| Planner/snapshot builder | Derive typed actions from read facts and existing evaluators | Pure planner; no spawn or private policy engine. |
| Public run/show/chain and headless | Apply through one mutation use case; read lineage and proposed actions | Show/chain remain read-only; headless shares the same authority. |
| Cell/track integration | Identify the owner of cell identity/acceptance and its session relationships | Do not assume a new core entity is necessary. |
| Compiler/confinement/fallback | Reuse governed execution and consume explicit recovery facts | Session continuation is not executor selection; no confinement bypass. |
| Work lifecycle | Normally no new status/stage needed for this feature | No approval/merge/Work transition inferred from continuation. |

Concrete current-code constraints identified during discussion:

- `src/verbs/coordination/chain.mjs:24`: session membership is currently inferred from naming; explicit continuation lineage requires a deliberate read-model extension.
- `src/verbs/coordination/run.mjs:744`: the request use case attempts close after execution; pending transfer must interact coherently with close, not disappear behind it.
- `src/runner/coordination/session-engine.mjs:1909`: context grants are checked against session ownership; parent refs need a validated transfer contract, not a blanket cross-session exception.
- `src/runner/definitions/protocol-loader.mjs:1`: discovery already reuses FlowDefinition validation; extend that boundary rather than building another protocol interpreter.

## Agent Ergonomics And Feasibility

Feasibility is grounded in source review, not a successful live continuation implementation. Read-only planning is comparatively straightforward; cross-session write recovery and effect-aware takeover are the highest-risk portions.

The agent-facing task should be small: name the task/session to continue, supply a genuinely missing semantic decision or budget authorization if needed, and consume the typed outcome. Runtime should derive action eligibility, stable IDs, task keys, transfer refs, request shape, deduplication and revalidation. Repeated calls after a timeout must be safe without agent memory of the prior call.

Required proof categories:

1. A fresh agent with short instructions completes recovery through public interfaces without manually editing state or assembling hidden identity fields.
2. Wrong/stale requests, foreign refs and missing authority cannot create unauthorized execution.
3. Duplicate/concurrent invocations create one replacement/child and consume authorized budget once.
4. Crash injection across each write boundary recovers through the same public door without manual file removal.
5. Old workers and late results cannot reclaim current execution/result authority.
6. Artifact revision, visibility and quorum rules survive replacement/continuation.
7. Existing non-continuation flows keep their behavior; CLI and headless use the same mutation authority.
8. Measure human interventions, manually repaired requests and actionable refusals, not only absence of duplicate spawn.

If live agents remain stuck or require long procedural reminders, revise the runtime interface rather than lengthening the skill as the primary fix.

## Remaining Autonomous Design Work

There is enough product direction to proceed without another general clarification round. The assistant should now:

1. Map actual cell/session/actor/Assignment/Run ownership and consumers, including the user's long-session/multiple-cell case. Distinguish supported behavior, naming conventions and desired future behavior.
2. Specify the detailed contracts and transitions for reconnect, takeover, actor replacement and session continuation; attach an owner to every write and guarantee.
3. Define recovery input/material capture, coverage/unknowns, workspace ownership transfer and operation-specific effect eligibility. Do not promise arbitrary worker-memory snapshots.
4. Close the review findings: admission/result fencing, local lock semantics, pure snapshot completeness, apply idempotency, budget mapping, typed error/remedy contracts and proof mismatches.
5. Specify persistence, ordering, crash windows, version compatibility and Node/Rust writer ownership using existing component boundaries.
6. Produce one coherent detailed design, clearly distinguishing inherited agreements, recommended technical choices and unresolved product trade-offs. Then align the three proposal documents and canonical amend together, with explicit proposed/accepted status.
7. Assess the complete design against the 20 historical bug cases plus takeover and parent-child crash/concurrency cases. Keep a traceable proof matrix.
8. Only after the design is coherent, propose implementation slices: runtime guarantees and within-cell recovery first where dependencies require them, read-only planning independently where possible, then one end-to-end continuation proof. No production code implementation is authorized by this record alone.

Potential technical choices still unratified include exact schemas and paths, token/lock implementation, retry-same defaults, recovery-material representation, transfer transaction shape, shared-budget support, and cell/session linkage representation. Do not describe these as user-approved simply because they appeared in assistant proposals.

Ask the user again only when repository evidence cannot resolve a meaningful product trade-off, such as permissible context transfer, who may authorize extra budget, or whether a workflow intentionally accepts duplicated external effects. Bundle those questions while continuing independent design work.

## Conversation Milestones

- User prioritized simple, clean, hexagonal and SRP in the review.
- User requested detailed brainstorming and advice about continuation choices.
- User tested system impact and whether agents can follow the harness.
- User clarified worker replacement within a cell, then explicitly retained long-horizon session/cell continuity in the design context.
- User challenged whether this entails rebuilding Agent Coordination; direction retained existing foundations and scoped extensions.
- User explained that small cell tasks do not naturally have internal checkpoints.
- Assistant distinguished deliberate handoff from arbitrary recovery takeover and proposed recoverable state by default, explicit checkpoints as an optional operation capability.
- User agreed and requested that all details be recorded, and asked whether detailed design can now proceed autonomously.

Next state: detailed design draft is ready for review; no additional broad product discussion is required before implementation planning. This record does not claim the design is accepted, implementation or live proof is complete.
