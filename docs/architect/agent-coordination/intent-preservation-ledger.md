# Agent Coordination Intent Preservation Ledger

Document type: Index
Design status: N/A
Implementation: Active
Last reviewed: 2026-09-01
Canonical for: traceability of explicitly preserved intent, not architecture or runtime contracts

## Reading Rule

Read the [Agent Coordination Foundation Vision](vision.md) first, then this
ledger before a proposal, roadmap, or implementation plan narrows scope.

This ledger prevents an incremental implementation from silently becoming a
replacement for the original intention. It does not accept architecture by
itself. Vision, ADRs, contracts, and architecture retain their authority under
[Documentation Governance](documentation-governance.md).

## Status Vocabulary

| Status | Meaning |
|---|---|
| `deferred-preserved` | Not implemented in the current slice; the slice must not preclude it and a revisit trigger is recorded. |
| `implemented` | Proven by accepted contract and verification evidence. |
| `superseded` | Replaced by an explicit accepted decision that preserves or intentionally changes the objective. |
| `rejected` | Explicitly abandoned by a human decision with rationale. |

Silence, omission from a phase, or implementation inconvenience cannot change a
status. Only an explicit human decision may mark an original intention
`superseded` or `rejected`.

## Required Plan Traceability

Every Agent Coordination implementation plan must include:

1. an **Intent Traceability** table mapping its scope to ledger entries;
2. a **Must Not Preclude** check for every `deferred-preserved` entry it touches;
3. at least one executable proof for each applicable **Must Not Preclude** rule;
4. a phase-closing **Deferral Audit** recording what was implemented, remains
   preserved, was superseded, or was rejected;
5. links to accepted decisions and evidence for every status change.

Only human-confirmed product intentions belong here. Ordinary ideas and feature
backlog items stay in proposals or backlog so this ledger does not become an
unbounded wish list.

## Preserved Intentions

### AC-I001: Work-Independent Agent Coordination

- **Original intent:** coordinate governed agent activity with or without Work.
- **Source:** [Vision](vision.md#vision) and
  [V-001](vision.md#v-001-agent-coordination-is-a-foundation-layer).
- **Status:** `deferred-preserved` beyond the implemented inline-Assignment
  slice.
- **Current slice:** Step 07 proves a non-driving inline Assignment; Step 08
  plans a persistent standalone CoordinationSession.
- **Deferred:** full standalone recovery, declared protocols, and broader
  coordination families.
- **Must not preclude:** no universal Work, Stage, Workflow, or TaskSpec
  requirement may enter the execution core.
- **Revisit when:** each Step 08 phase closes.
- **Abandonment rule:** explicit Vision supersession only.

### AC-I002: Agent-Led Coordination Without A Predeclared Protocol

- **Original intent:** a coordinator may form and revise a bounded runtime plan
  without selecting a Workflow or Coordination Protocol first.
- **Source:** [V-005](vision.md#v-005-agents-own-adaptive-reasoning-the-foundation-owns-authority)
  and [V-009](vision.md#v-009-runtime-graphs-may-be-trivial-dynamic-or-declared).
- **Status:** `deferred-preserved`.
- **Current slice:** Step 8.1 plans one primary-investigator plus dynamic consult
  proof using inline Assignments.
- **Deferred:** richer dynamic task graphs and bounded adaptation.
- **Must not preclude:** declared protocol config must remain optional.
- **Revisit when:** Step 8.1 evidence is reviewed and whenever protocol loading
  becomes a runtime prerequisite.
- **Abandonment rule:** explicit Vision supersession only.

### AC-I003: Reusable Declared Coordination Protocols

- **Original intent:** reusable consult, research, brainstorm, debate, and other
  coordination structures may constrain and accelerate repeated activity.
- **Source:** [Vision](vision.md#vision) and the human-approved direction recorded
  in the [Step 08 checkpoint](proposals/step-08-standalone-coordination-protocols.md#discussion-checkpoint-step-08-recommended-decisions-and-plan-2026-09-01).
- **Status:** `deferred-preserved`.
- **Current slice:** shared `FlowDefinition` kernel with typed
  `CoordinationProtocol`, consult, research fan-out/fan-in, then one Group
  Cognition framework.
- **Deferred:** broad protocol catalog, marketplace, and unrestricted peer chat.
- **Must not preclude:** protocols remain optional and cannot create a second
  execution core.
- **Revisit when:** Steps 8.3 through 8.5 close.
- **Abandonment rule:** explicit human decision plus reconciliation with Vision.

### AC-I004: Group Cognition And Heterogeneous Cohorts

- **Original intent:** support collaborative problem-solving and group
  decision-making beyond generic brainstorm, including divergent, convergent,
  creative, critical, debate, evidence-review, and synthesis activities whose
  SessionActors may need different provider/model/tier characteristics.
- **Source:** human-approved Step 08 discussion recorded on 2026-09-01 in the
  [Step 08 checkpoints](proposals/step-08-standalone-coordination-protocols.md#discussion-checkpoint-step-08-recommended-decisions-and-plan-2026-09-01).
- **Status:** `deferred-preserved`.
- **Current slice:** one heterogeneous diverge/challenge/evidence/converge proof
  after deterministic Cohort Planner V1.
- **Deferred:** complete framework library, fitness scoring, learning allocation,
  and autonomous optimization.
- **Must not preclude:** per-role/actor/activity requirements, provider/model-family
  diversity constraints, dissent preservation, and evidence-aware synthesis.
- **Revisit when:** Steps 8.4 and 8.5 close or a second framework needs a missing
  primitive.
- **Abandonment rule:** explicit human rejection with evidence that heterogeneous
  group cognition does not improve a consuming project's decisions.

### AC-I005: Domain And Organization Customization

- **Original intent:** domain and organization packages can add doctrine,
  protocols, roles, policy, validation, evidence posture, and lifecycle
  integration without forking foundation execution.
- **Source:** [V-008](vision.md#v-008-domain-and-organization-augmentation-creates-differentiation).
- **Status:** `deferred-preserved`.
- **Current slice:** foundation and domain definitions share the versioned
  definition loader and typed profile validators.
- **Deferred:** organization overlay syntax and general extension SDK until two
  real consumers prove a common seam.
- **Must not preclude:** project/domain-owned definitions and policy enrichment
  through the same validated kernel.
- **Revisit when:** a second organization consumer appears or a domain cannot
  express a proven requirement through current seams.
- **Abandonment rule:** explicit Vision supersession only.

### AC-I006: One Governed Dispatch And Evidence Core

- **Original intent:** every agent-led, protocol-led, and domain-assisted action
  resolves infrastructure through dispatch and records Assignment, Run,
  RunResult, and evidence through one core.
- **Source:** [V-006](vision.md#v-006-planning-is-pluggable-and-composable) and
  [V-007](vision.md#v-007-dispatch-is-a-primary-foundation-capability).
- **Status:** `implemented` for individual Assignment execution with a known
  provenance defect (finding H2): `providerModel` is derived from the
  executor **id** rather than the configured executor entry, so non-claude
  provider/model provenance and governance's `disallowedProviders` key can be
  wrong today. This defect is scheduled to be fixed in Phase 00's dispatch
  cell (P00.2), not in this documentation cell (P00.1); `deferred-preserved`
  for corrected provenance, cohort allocation, and session-wide policy
  provenance until P00.2 lands and Steps 8.4/8.Final extend it.
- **Current slice:** wire human executor/model/tier overrides, correct provider
  provenance, and make Cohort Planner emit inputs to the existing Assignment
  resolver rather than spawning directly.
- **Deferred:** generalized task-category scoring, cross-definition `purpose`
  routing, or autonomous provider router. Per finding M8, `purpose` is
  dropped from `FlowDefinition` V1 entirely
  ([ADR-009](decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md));
  the revisit trigger is: reconsider a cross-definition `purpose` routing key
  only when **two real definitions need shared task-category routing** — not
  before, and not merely because a routing rung would be convenient.
- **Must not preclude:** governance remains final; no profile, role, Skill,
  protocol, or coordinator gains a private executor path.
- **Revisit when:** Steps 8.0, 8.4, and 8.Final close.
- **Abandonment rule:** dispatch-core replacement requires an accepted ADR and
  migration plan.

### AC-I007: Optional Multi-Session Mission Grouping

- **Original intent:** Mission is an optional durable strategic objective that
  may group multiple CoordinationSessions and outcomes without becoming a Work
  lifecycle or direct execution envelope.
- **Source:** [Step 08, Mission Versus CoordinationSession](proposals/step-08-standalone-coordination-protocols.md#6-mission-versus-coordinationsession)
  and the human decision recorded on 2026-09-01.
- **Status:** `deferred-preserved`, not replaced or rejected.
- **Current slice:** CoordinationSession is the V1 executable and recovery root.
- **Deferred:** Mission identity, persistence, aggregation, and multi-session
  outcome policy.
- **Must not preclude:** a future Mission must be able to reference N existing
  sessions without changing their execution, Assignment, Run, RunResult, or
  evidence contracts. V1 must not add a dead mandatory `missionId` field.
- **Revisit when:** one objective demonstrably needs multiple independently
  executable sessions or Step 8.Final evaluates a second consumer.
- **Abandonment rule:** explicit human rejection or accepted superseding concept;
  implementation omission is insufficient.

### AC-I008: Interactive And Headless Capability Parity

- **Original intent:** interactive and headless operation expose the same Agent
  Coordination capabilities and semantic contracts. Interactive ships first to
  make agent behavior explicitly observable during stabilization; headless runs
  the same capability quietly once that behavior is trusted.
- **Source:** explicit human clarification recorded on 2026-09-01 in the
  [Step 08 checkpoint](proposals/step-08-standalone-coordination-protocols.md#discussion-checkpoint-step-08-recommended-decisions-and-plan-2026-09-01).
- **Status:** `deferred-preserved`.
- **Current slice:** implement and prove interactive operation first on the
  shared CoordinationSession/dispatch/evidence core.
- **Deferred:** unattended headless operation and telemetry for observing and
  improving headless runs.
- **Must not preclude:** no interactive-only or headless-only coordination
  engine, contract, protocol semantics, recovery model, or evidence model.
  Temporary rollout gaps must be named and closed; visibility/operator presence
  is the intended mode difference.
- **Revisit when:** every phase that adds a user-visible coordination capability
  closes, and at Step 8.Final before claiming headless readiness.
- **Abandonment rule:** explicit human decision changing capability parity;
  implementation convenience is insufficient.

### AC-I009: Work-Attached Coordination Preserves Domain Isolation

- **Original intent:** CoordinationSession can support real Work, including
  coding work on Git branches/worktrees, without creating conflicting mutations
  or taking lifecycle/isolation authority away from Work and the domain harness.
- **Source:** explicit human clarification recorded on 2026-09-01, consistent
  with [Vision, V-012](vision.md#v-012-generalization-requires-two-unlike-consumers)
  and [V-008](vision.md#v-008-domain-and-organization-augmentation-creates-differentiation).
- **Status:** `deferred-preserved`.
- **Current slice:** standalone read-only coordination plus ledger fields that
  can reference domain-provisioned workspace/isolation context.
- **Deferred:** Work-attached mutating coordination until a coding-domain live
  proof covers resource conflict, worktree allocation, serialization, merge
  ownership, recovery, and Work transition authority.
- **Must not preclude:** two mutating actors never run concurrently in one
  worktree; coordination never creates private merge/lifecycle authority;
  domain-provisioned isolation and resource claims remain attachable and
  auditable from the session ledger.
- **Revisit when:** any mutating Assignment, coding-domain protocol, or
  Work-attached session enters a Step 08 plan.
- **Abandonment rule:** explicit Vision/ADR supersession only.

## Current Step 08 Decision Trace

| Decision | Ledger effect | State on 2026-09-01 |
|---|---|---|
| Shared kernel plus typed profiles | Advances AC-I003 and AC-I005 without flattening Stage/Phase semantics. | Accepted: [ADR-009](decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md), [FlowDefinition Contract](contracts/flow-definition.md) (P00.1). Runtime kernel not yet implemented. |
| CoordinationSession as V1 root | Advances AC-I001 while preserving AC-I007. | Accepted: [ADR-008](decisions/ADR-008-coordination-session-and-mission-deferral.md), [CoordinationSession Contract](contracts/coordination-session.md) (P00.1). Runtime ledger not yet implemented. |
| Consult, then research/cohort, then Group Cognition | Advances AC-I002, AC-I003, and AC-I004 incrementally. | Human-approved order. |
| External consuming-project comparison | Tests mission #1/#2 value rather than fgOS-only convenience. | Case selection deferred until before Step 8.5. |
| Partial completion in hardening; no first-class AgentMessage yet | Keeps V1 bounded while retaining explicit revisit points. | Human-approved scope. |
| Interactive before headless, with target capability parity | Advances AC-I008; visibility and operator presence are the intended difference. | Accepted: [ADR-010](decisions/ADR-010-interactive-headless-parity-and-work-isolation.md) (P00.1); telemetry deferred. |
| Gitignored coordination state plus domain-owned Work isolation | Advances AC-I009 without confusing local runtime state with Git/worktree isolation. | Accepted: [ADR-010](decisions/ADR-010-interactive-headless-parity-and-work-isolation.md), [CoordinationSession Contract](contracts/coordination-session.md) storage layout (P00.1). |
| Mission-lite direct cutover | Removes prototype code/tests directly, with no legacy reader, detector, reporter, or stored-data migration for `.fgos/missions/` data. | Accepted: [ADR-008](decisions/ADR-008-coordination-session-and-mission-deferral.md) (P00.1); fgOS is unreleased with no customer consumer. Cutover implementation lands in P01.1. |

## Step 08 Phase 00 Intent Proof Matrix (Cell P00.1)

Phase 00 R1-R4 is documentation-only: it extracts already-approved checkpoint
decisions into accepted ADRs/contracts/vocabulary/spec and fixes decision
reconciliation debt (stale plan row, proposal extraction pointers, AC-I003
source, AC-I006 annotation). This is not the phase-closing Deferral Audit; it
records which entries this cell's *documentation* work advances versus which
remain untouched until later cells implement runtime behavior.

| Intent | This cell's effect | Remains open until |
|---|---|---|
| AC-I001 | Boundary named (CoordinationSession accepted as V1 root, ADR-008). | P01.1/P01.2 implement and prove the ledger/runtime. |
| AC-I002 | Boundary named (declared protocol stays optional, ADR-008/ADR-009). | P01.2 proves a live agent-led dynamic-consult session. |
| AC-I003 | Source citation corrected to the dated human decision (checkpoint §22 "Human decisions recorded", 2026-09-01); shared-kernel direction named in ADR-009. | P02.x-P05.x implement and prove declared consult/research/Group Cognition. |
| AC-I004 | Untouched by this cell (no cohort/tier runtime work here). | P04.x/P05.x. |
| AC-I005 | FlowDefinition's shared loader contract named (ADR-009); no code. | P02.x implements the shared kernel/adapter. |
| AC-I006 | Provenance defect (H2) explicitly attributed to P00.2, not silently left as `implemented`; `purpose` revisit trigger recorded. | P00.2 fixes provider/tier/executor truth; Steps 8.4/8.Final extend provenance. |
| AC-I007 | Mission deferral and the no-`missionId` rule made explicit and Accepted (ADR-008), closing the ambiguity M4/M6 flagged. | Mission identity/persistence itself remains out of scope for all of Step 08. |
| AC-I008 | Interactive-first/headless-parity boundary recorded as Accepted (ADR-010); telemetry stays deferred. | Later phases that add user-visible capability; Step 8.Final headless proof. |
| AC-I009 | Domain-owned Work isolation boundary recorded as Accepted (ADR-010); no merge/Work-transition capability permitted in `src/runner/coordination/**`. | A coding-domain live proof (post-Step-08-hardening) before any Work-attached mutation is allowed. |

No ledger entry was removed, narrowed, or marked `implemented`/`superseded`/
`rejected` by this cell. Every status change above is a documentation
promotion of an already-human-approved boundary, not a new product decision.

## Deferral Audit Template

```md
## Deferral Audit

| Intent ID | Before | Evidence produced | After | Must-not-preclude check |
|---|---|---|---|---|
| AC-Ixxx | deferred-preserved | ... | implemented / deferred-preserved | Pass / Fail: ... |

No ledger intention was removed or reinterpreted by omission.
```
