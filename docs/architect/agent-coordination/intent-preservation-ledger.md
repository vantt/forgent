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
- **Status:** `implemented` -- Step 08 P01.1/P01.2 built and live-proved a
  persistent standalone CoordinationSession with `workId: null`, no
  Workflow, no Stage, no TaskSpec, and no protocol id (plan.md's own
  Plan-Level Acceptance criterion); reconfirmed live in P07.2's own R5/R6
  proofs (`docs/architect/agent-coordination/verification/step-08-standalone-coordination/proofs/P07.2/`).
- **Current slice:** persistent standalone CoordinationSession
  (`src/runner/coordination/{schema,store,replay,session-engine}.mjs`),
  crash-safe idempotent resume (P01.2), agent-led/declared/research/Group
  Cognition families all running on the same session ledger (P01-P06),
  exposed through the public CLI and headless adapter (P07).
- **Deferred:** nothing residual specific to AC-I001 itself; the
  "declared protocols" and "broader coordination families" this entry
  originally deferred are now their own fully-tracked entries
  (AC-I003/AC-I004 below).
- **Must not preclude:** no universal Work, Stage, Workflow, or TaskSpec
  requirement may enter the execution core.
- **Revisit when:** each Step 08 phase closes.
- **Abandonment rule:** explicit Vision supersession only.

### AC-I002: Agent-Led Coordination Without A Predeclared Protocol

- **Original intent:** a coordinator may form and revise a bounded runtime plan
  without selecting a Workflow or Coordination Protocol first.
- **Source:** [V-005](vision.md#v-005-agents-own-adaptive-reasoning-the-foundation-owns-authority)
  and [V-009](vision.md#v-009-runtime-graphs-may-be-trivial-dynamic-or-declared).
- **Status:** `implemented` for the accepted V1 shape (one primary actor plus
  dynamic consult, no predeclared protocol required) -- P01.2 built
  `openStandaloneSession`/`dispatchPrimaryTask`/`proposeConsult` and proved it
  live; reconfirmed live in P07.2's own R5/R6 proofs. `deferred-preserved`
  for anything beyond that fixed V1 shape (see Deferred).
- **Current slice:** one primary actor may dynamically consult one specialist
  actor mid-session, with no protocol id, Work, Stage, or TaskSpec required
  (`kind: "agent-led"` in the public request schema, `src/verbs/coordination/schema.mjs`).
- **Deferred:** richer dynamic task graphs (an agent freely authoring its own
  multi-step branching plan at runtime, beyond one primary plus one consult)
  and bounded adaptation -- never attempted in Step 08, no revisit trigger
  hit yet.
- **Must not preclude:** declared protocol config must remain optional.
- **Revisit when:** Step 8.1 evidence is reviewed and whenever protocol loading
  becomes a runtime prerequisite.
- **Abandonment rule:** explicit Vision supersession only.

### AC-I003: Reusable Declared Coordination Protocols

- **Original intent:** reusable consult, research, brainstorm, debate, and other
  coordination structures may constrain and accelerate repeated activity.
- **Source:** [Vision](vision.md#vision) and the human-approved direction recorded
  in the [Step 08 checkpoint](proposals/step-08-standalone-coordination-protocols.md#discussion-checkpoint-step-08-recommended-decisions-and-plan-2026-09-01).
- **Status:** `implemented` -- P02.1/P02.2 built the shared `FlowDefinition`
  kernel and typed `CoordinationProtocol` profile; P03 declared consult,
  P04 research fan-out/fan-in, P05 one Group Cognition framework, all
  statically AND runtime-proven to reach `executeAssignment` with no direct
  spawn (this track's own recurring "one execution core" static-import
  test, e.g. `test/runner/coordination-static.test.mjs`). Reconfirmed live
  in P07.2's own R5/R6 proofs using the published `declared-consult`
  protocol.
- **Current slice:** three real `CoordinationProtocol` definitions ship in
  `core/coordination-protocols/` (declared-consult, independent research
  fan-out/fan-in, group-cognition-framework), discovered through a
  project/domain/core loader (`src/runner/definitions/protocol-loader.mjs`)
  reachable from a real external consuming project (P07.2 R6, confirmed via
  `fgos doctor`'s `coordination-protocol-fixtures-valid` check from
  `/home/vantt/projects/mdview`'s own cwd against the installed package).
- **Deferred:** broad protocol catalog, marketplace, and unrestricted peer
  chat.
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
- **Status:** `implemented` at the MECHANISM level -- P04.1 built a
  deterministic, zero-scoring/zero-ranking Cohort Planner
  (`src/runner/coordination/cohort-planner.mjs`), P04.2 proved isolated
  concurrent fan-out and fan-in synthesis that never upgrades `reported`,
  failed, stale, or foreign evidence, P05.1 declared the first Group
  Cognition framework, and P05.2 live-ran it against a real external
  question with dissent-preservation behaving honestly. Whether the
  framework delivers a real QUALITY GAIN over a single agent remains an
  open empirical question -- P05.2's own live run returned an honest null
  result (8 of 9 real dispatches failed for infrastructure/dispatch-layer
  reasons, not for reasons traceable to the framework's cognitive design;
  see `P05.2.md`), which Phase 05's own accepted exit criterion explicitly
  treats as a valid, non-blocking close ("records quality gain or honest
  null result with dissent preserved").
- **Current slice:** deterministic heterogeneous cohort allocation plus one
  real 6-phase Group Cognition framework (`core/coordination-protocols/group-cognition-framework.yaml`),
  mechanism-proven; real-world quality gain unproven (honest null result,
  not a negative result -- the pipeline mostly didn't finish executing).
- **Deferred:** complete framework library, fitness scoring, learning
  allocation, and autonomous optimization; a repeat live quality proof
  outside the infrastructure friction observed in P05.2 (per-cwd dispatch
  concurrency lock, provider-quota headroom, cross-provider
  `agent-result.json` schema-validation mismatch -- all named as a
  recommended product reassessment in P05.2's Gaps).
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
- **Status:** `implemented` for the project/domain/core discovery seam --
  P02.2 built `discoverCoordinationProtocols`/`loadCoordinationProtocol`
  (`src/runner/definitions/protocol-loader.mjs`), zero foundation fork
  (`src/runner/dispatch/**` and `src/runner/coordination/**` stayed at zero
  diff for the whole of Phase 02). Reconfirmed working from a REAL external
  consuming project's own cwd in P07.2's own R6 proof (installed package,
  not source checkout).
- **Current slice:** foundation and domain definitions share one versioned
  definition loader and typed profile validators; a project outside this
  repo can add its own `.fgos/coordination-protocols/` (project tier) or
  rely on the packaged core tier with no fork.
- **Deferred:** organization overlay syntax and general extension SDK until
  two real consumers prove a common seam -- mdview (P07.2 R6) is the first
  real external consumer of the DISCOVERY seam, not yet of an organization
  OVERLAY, so this trigger is not yet met.
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
- **Status:** `implemented` -- the finding H2 provenance defect was fixed at
  P00.2/P00.4 (`deriveProviderFamily` call-site disagreement, confirmed
  affecting 3 of 12 registered executors, fixed and re-verified). Cohort
  Planner (P04.1) emits inputs to the existing Assignment resolver, never
  spawns directly (statically confirmed, zero scoring/ranking logic).
  Session-wide policy provenance (the 7-scope PolicyPatch precedence chain
  `runner < definition < operation < role < actor < assignment < cli`) landed
  at P03.1. All three revisit triggers named below (Steps 8.0, 8.4, 8.Final)
  have now closed.
- **Current slice:** every live Assignment dispatch across every coordination
  kind (agent-led, declared-protocol, research fan-out) resolves executor/
  provider/tier/model through the one hardened resolver
  (`resolveAssignmentDispatchPolicy`) and persists full provenance; unknown
  executor/provider/tier fails closed (adversarially tested clean at P06.2
  and again at P07.1's R2 trust-boundary review).
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
- **Status:** `deferred-preserved`, not replaced or rejected -- by design,
  for the whole of Step 08 (plan.md's own Out Of Scope list: "Mission
  identity, persistence, aggregation, or migration compatibility"). The
  must-not-preclude check is proven: `missionId` is structurally rejected
  everywhere a coordination request or Assignment could carry it (P01.1's
  direct mission-lite cutover dropped the field from Assignment
  construction entirely; P07.1's request schema recursively rejects
  `missionId` at any nesting depth, `src/verbs/coordination/schema.mjs`'s
  `WORK_LIFECYCLE_KEYS`, adversarially tested clean).
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
- **Status:** `implemented` -- P07.1 built `runCoordinationHeadless`
  (`src/runner/coordination/headless-adapter.mjs`), proven by reference
  identity to call the exact same `runCoordinationUseCase` the interactive
  CLI calls (no fork). P07.2's own R5 proof executed the same deterministic
  `declared-consult` fixture through both doors and diffed the full
  persisted output (manifest, Assignments, policy provenance, Runs/
  RunResults, evidence, quorum, budgets, final status): zero unexplained
  differences after normalizing only named, justified volatile fields
  (timestamps, wall-clock durations, pid, the two doors' deliberately
  distinct coordinationId, and live-LLM-generated content hashes); matching
  negative-case parity confirmed too (`docs/architect/agent-coordination/verification/step-08-standalone-coordination/proofs/P07.2/r5-parity/`).
- **Current slice:** interactive CLI (`fgos coordination run`/`show`) and
  headless adapter both invoke one shared engine with proven equivalent
  persisted output; visibility/operator-presence is the only intended
  difference.
- **Deferred:** telemetry for observing and improving headless runs --
  explicitly out of V1 scope per plan.md's Locked Product Decisions
  ("Interactive ships first for explicit observation... telemetry is
  deferred"), never built.
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
- **Status:** `deferred-preserved` -- by design, for the whole of Step 08
  (plan.md's own Locked Product Decisions: "Standalone proofs are read-only.
  Work-attached mutation is a stop gate..."). The must-not-preclude checks
  are proven, currently vacuously for the concurrency-refusal half (V1 has
  no mutating-actor capability at all yet) and structurally for the
  no-private-authority half: P06.2 added a static export-surface check
  confirming zero merge/Work-transition capability anywhere under
  `src/runner/coordination/**`, adversarially tested; the request/schema
  trust boundary (P07.1 R2) additionally rejects `mutation` unless it is
  the literal string `"read-only"`, at every step/branch/task nesting
  level, adversarially tested clean.
- **Current slice:** standalone read-only coordination plus ledger fields that
  can reference domain-provisioned workspace/isolation context.
- **Deferred:** Work-attached mutating coordination until a coding-domain live
  proof covers resource conflict, worktree allocation, serialization, merge
  ownership, recovery, and Work transition authority -- never attempted in
  Step 08, no revisit trigger hit.
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

The table above is a historical snapshot as of 2026-09-01 (Phase 00's own
close) and is left unedited as that record. Every "not yet implemented"
note in it is now stale: by the close of Phase 07 (P07.2, canonical
closure), every row's runtime is built, live-proved, and reflected in each
entry's own **Status** line above -- see those lines, and the plan's own
Intent Traceability table (`plans/260901-1542-step08-standalone-coordination/plan.md`),
for the current, accurate state. The plan's own final Deferral Audit
(`docs/architect/agent-coordination/verification/step-08-standalone-coordination/deferral-audit.md`)
is the authoritative closing record.

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
