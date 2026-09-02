# Step 08 - Standalone Coordination And Reusable Group Cognition

Status: done | Created: 2026-09-01 | Completed: 2026-09-02 | Owner: maintainer

All 8 phases closed. Full execution trace, review history (including
every real bug found and fixed, and both proof-rigor gaps found and
closed in the plan's own final cell), and the closing Deferral Audit
live under `docs/architect/agent-coordination/verification/step-08-standalone-coordination/`
(`index.md` is the entry point; `deferral-audit.md` is the final
AC-I001-I009 closure record).
Execution track: `step-08-standalone-coordination`

Authority entering the plan:

- [Agent Coordination Vision](../../docs/architect/agent-coordination/vision.md)
- [ADR-006](../../docs/architect/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md)
- [ADR-007](../../docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md)
- [Intent Preservation Ledger](../../docs/architect/agent-coordination/intent-preservation-ledger.md)
- human-approved decisions in the [Step 08 checkpoint](../../docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md#discussion-checkpoint-step-08-recommended-decisions-and-plan-2026-09-01)
- reconciled [pre-plan architecture review](../reports/reviewer-260901-1403-GH-07-step08-pre-plan-architecture-review.md)

Phase 00 extracts the approved checkpoint into accepted ADRs, contracts,
architecture, vocabulary, and the runner area spec before feature code relies on
it. The proposal remains rationale and discussion history, never runtime
authority.

## Goal

Deliver one domain-neutral coordination foundation that can run:

1. agent-led standalone coordination with no predeclared protocol;
2. declared reusable coordination through a typed `CoordinationProtocol`;
3. deterministic heterogeneous cohorts across provider/model/tier policy;
4. one real Group Cognition framework using divergent, critical, evidence, and
   convergent activities;
5. interactive and headless operation over the same semantic engine.

Every execution-triggering activity must converge on the existing
`Assignment -> DispatchPlan -> Run -> RunResult -> evidence` core. Work,
Workflow, Mission, and a declared protocol remain optional. Work remains the
only delivery lifecycle authority when present.

## Locked Product Decisions

- `CoordinationSession` is the V1 executable/recovery root. Future `Mission`
  may reference N sessions but is `deferred-preserved`; V1 has no mandatory or
  dead `missionId`.
- `FlowDefinition` is the shared versioned graph/operation/policy IR. Typed
  profiles preserve different semantics: `Workflow` uses Stage;
  `CoordinationProtocol` uses Phase. Existing Workflow behavior is projected
  additively; it is not migrated onto a new runtime in this step.
- Schema uses `role` and `actors`. Role, seat, and responsibility position are
  one concept. `SessionActor` is an addressable instance filling a Role.
  `Persona` is behavioral identity; `Stance` is a temporary viewpoint and is
  not a V1 schema field.
- Definitions/domain packages own Role responsibilities and legal actor slots.
  A trusted run request may bind a SessionActor slot to Persona and execution
  policy, or populate declared multiplicity, but cannot silently change that
  slot's Role or an operation's responsibility. Agent-led sessions may propose
  new actors/roles only through the same foundation validator and bounds.
- Declared protocol is optional. Agent-led sessions may create bounded inline
  Assignments dynamically without `protocolId`, Work, Stage, or TaskSpec.
- Portable definitions express WHAT through role, capabilities, evidence,
  mutation, context, tier floors, topology, and hard cohort constraints. They
  do not pin concrete executors or literal models.
- Trusted operator/session policy may express global or per-actor execution
  preferences. Governance remains final. A hard CLI executor selection means
  "highest-priority human preference subject to validation/governance", not a
  bypass.
- `purpose` routing, executor fitness scoring, autonomous provider routing,
  organization overlays, first-class AgentMessage, general AdhocTask storage,
  unrestricted peer chat, and a framework marketplace are out of V1.
- `.fgos/coordination/` is gitignored local runtime/recovery state. Verification
  exports selected evidence deliberately.
- Mission-lite is replaced directly. There is no migration reader, detector,
  reporter, compatibility writer, or stored-data migration. Assignment
  construction also drops its prototype `missionId` input; a future Mission
  groups completed session ids from above instead of entering Assignment.
- Interactive ships first for explicit observation. Headless later invokes the
  same session/protocol/dispatch/evidence/recovery engine. Visibility and
  operator presence are the intended differences; telemetry is deferred.
- Standalone proofs are read-only. Work-attached mutation is a stop gate until
  a coding-domain proof demonstrates domain-owned worktree/resource isolation,
  merge ownership, recovery, and Work transition authority.

## Phases

| # | Phase | Depends on | Exit |
|---|---|---|---|
| 00 | [Canonical contracts and dispatch prerequisites](phase-00-canonical-contracts-and-dispatch-prerequisites.md) | Step 07 complete | Accepted design surface; executor/provider/tier resolution is truthful and CLI-reachable |
| 01 | [CoordinationSession ledger and agent-led proof](phase-01-coordination-session-and-agent-led-proof.md) | 00 | Persistent standalone session resumes without duplicate Assignments and dynamically consults one actor |
| 02 | [Shared FlowDefinition kernel and typed profiles](phase-02-shared-flow-definition-kernel.md) | 01 | Existing Workflow and protocol fixtures normalize through one additive IR with profile isolation |
| 03 | [Declared consult protocol](phase-03-declared-consult-protocol.md) | 02 | Declared and agent-led consult use one governed engine with equivalent evidence semantics |
| 04 | [Research fan-out/fan-in and Cohort Planner](phase-04-research-cohort-planner.md) | 03 | Explainable heterogeneous allocation, isolated branches, verified fan-in, loud unsatisfied constraints |
| 05 | [First Group Cognition framework](phase-05-group-cognition-framework.md) | 04 | Real external-project comparison records quality gain or honest null result with dissent preserved |
| 06 | [Recovery, partial completion, and budget hardening](phase-06-recovery-partial-completion-and-budgets.md) | 05 | Crash, retry, quorum, bounds, leakage, and evidence-laundering attacks are negatively proven |
| 07 | [Headless parity, CLI stabilization, and adoption](phase-07-headless-parity-cli-and-adoption.md) | 06 | Public CLI/API stable; interactive/headless semantic parity proven; final intent audit closed |

Phases execute strictly in this order. Do not combine Phase 00 dispatch work
with coordination runtime, and do not extract the shared kernel before the
agent-led session proves the minimal runtime shape.

## Plan-Level Acceptance

- Full `npm test` passes relative to the exact baseline recorded before P00.1;
  no baseline failure may grow or be reclassified without evidence.
- Accepted ADRs/contracts and `docs/specs/runner.md` describe the implemented
  public behavior; the Step 08 proposal points to them and remains non-normative.
- A standalone session succeeds with `workId: null`, no Workflow, no Stage, no
  TaskSpec, and no protocol id.
- Existing coding Workflow behavior and golden tests remain unchanged while a
  `CoordinationProtocol` uses the same neutral IR.
- No coordinator, protocol, profile, role, actor, Skill, or Cohort Planner
  spawns an executor directly or creates a private dispatch/evidence path.
- Assignment/Run/RunResult remain canonical records. Session state stores
  references and field-level policy provenance, not copied truth.
- Actual executor id, provider family, model, tier, policy sources, and
  governance result are persisted for every live actor run.
- At least two configured provider families support every policy tier used by
  the Phase 05 framework. Missing support stops the live proof; it is never
  faked or silently weakened.
- Independent branches cannot read sibling outputs before fan-in. Synthesis
  cannot upgrade `reported`, failed, stale, or foreign evidence to `verified`.
- Missing required actors block completion unless an explicit partial policy
  is satisfied; every omission and dissenting result remains visible.
- Interactive and headless doors invoke the same engine and produce
  semantically equivalent persisted records for the same deterministic fixture.
- No Step 08 proof mutates a consuming repository or advances/merges Work.
- The final Deferral Audit covers AC-I001 through AC-I009 and includes an
  executable must-not-preclude proof for every entry touched by the plan.

## Intent Traceability

| Intent | Implemented or advanced here | Executable must-not-preclude proof |
|---|---|---|
| AC-I001 | Persistent standalone CoordinationSession | Run with null Work and no lifecycle fields; reject any universal Work/Stage requirement |
| AC-I002 | Dynamic primary-to-specialist consult | Run session with no protocol id; prove declared definitions remain optional |
| AC-I003 | Consult, research, Group Cognition protocols | Static/runtime test that all protocol execution reaches `executeAssignment` and no direct spawn exists |
| AC-I004 | Heterogeneous cohort and cognitive activities | Two-provider required-tier allocation plus dissent/evidence-aware synthesis tests |
| AC-I005 | Shared kernel and project/domain discovery seams | Normalize packaged and project-owned fixtures through one loader; no foundation fork |
| AC-I006 | Corrected dispatch provenance and one core | Unknown executor/provider-tier fail closed; all runs persist resolver provenance; no private dispatch core |
| AC-I007 | Mission remains optional future grouping | Session manifest schema rejects `missionId`; a pure future-grouping fixture can reference N session ids without rewriting them |
| AC-I008 | Interactive first, then headless capability parity | Same deterministic request through both doors yields equivalent semantic records after visibility fields are normalized |
| AC-I009 | Domain isolation boundary preserved | Concurrent mutating actors sharing one workspace are refused; no merge/Work-transition API exists in coordination engine |

Each phase closes with the ledger's Deferral Audit template. A status changes to
`implemented` only when its accepted contract and named proof both exist.

## Out Of Scope / Do Not Build

- Mission identity, persistence, aggregation, or migration compatibility.
- Mutating standalone coordination and Work-attached mutating live execution.
- Work lifecycle transitions, branch creation, merge, approval, or worktree
  allocation inside `src/runner/coordination/**`.
- A second execution core, direct `spawn`, private provider SDK, or protocol-
  specific executor adapter.
- General task-category/`purpose` routing, weighted scoring, learned routing,
  cost optimization, or automatic credential probing.
- Literal executor/model pins in portable `CoordinationProtocol` files.
- Full provider-by-tier matrix; only tiers a chosen framework requires matter.
- First-class AgentMessage, free peer chat, recursive/unbounded task creation,
  framework marketplace, organization overlay SDK, UI/dashboard, telemetry
  backend, or herdr-spawn proof.
- Consumer migration for the current Workflow runtime. The adapter is additive.

## Autonomous Execution Contract

Use the [Master Multi-Agent Implementation Coordinator](../../docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md).
This plan contains no open product decision. Routine implementation choices are
delegated to the master using repository precedent and the smallest compatible
change. The master must not ask for confirmation between cells.

Stop only when one of these objective gates occurs:

1. an accepted source above contradicts a requirement and no additive
   interpretation exists;
2. full or focused tests cannot run because required local infrastructure is
   unavailable after one documented recovery attempt;
3. a required independent Reviewer or Red-Team cannot be launched;
4. a required live CLI executor/provider is absent, unconfigured, lacks the
   exact required tier, or fails authentication after one bounded retry;
5. the external consuming-project case cannot be selected before observing
   candidate outputs;
6. Work-attached mutation becomes necessary to satisfy a requirement;
7. GitNexus reports HIGH/CRITICAL impact and the active cell did not already
   name that blast radius and mitigation;
8. concurrent/user changes overlap an active cell such that preservation is
   impossible without choosing whose behavior wins.

Do not stop for naming, file placement, test-fixture shape, error wording,
internal helper boundaries, or other reversible choices already constrained by
the phase. Infer those from adjacent code and record them in the cell trace.

## Execution Inputs

```text
REPO_ROOT: /home/vantt/projects/forgentX
PLAN_DIR: /home/vantt/projects/forgentX/plans/260901-1542-step08-standalone-coordination
TRACK: step-08-standalone-coordination
SCOPE_DOCS:
  - docs/architect/agent-coordination/vision.md
  - docs/architect/agent-coordination/intent-preservation-ledger.md
  - docs/architect/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md
  - docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md
  - docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
BRANCH: step-08-standalone-coordination
BASE_REF: infer once when branch is created and persist it
MAX_CELLS_THIS_RUN: unlimited
```

Before P00.1, the master records `git status`, preserves all unrelated changes,
runs the full baseline, and audits current code rather than trusting research
line numbers. Every symbol edit requires the repository's GitNexus upstream
impact analysis; HIGH/CRITICAL results are surfaced before editing. Before each
cell commit, run GitNexus `detect_changes` against `BASE_REF` and `git diff
--check`.

Full test command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
```

Every cell touching `src/runner/dispatch/**` also runs:

```bash
node src/runner/dispatch.mjs decide --for smoke --needs-soul --has-live-task-access
```

It must print a `mechanism` field before the cell can close. Only one Doer may
touch dispatch files at a time.

## Suggested Cell Schedule

| Cell | Requirements | Close boundary |
|---|---|---|
| P00.1 | Phase 00 R1, R2, R3, R4 | Accepted canonical design/spec and corrected stale pointers |
| P00.2 | Phase 00 R5, R6, R7, R8 | Truthful provider/tier/executor resolution with negative tests |
| P00.3 | Phase 00 R9, R10, R11 | CLI override, fallback posture, config baseline/live two-executor proof |
| P01.1 | Phase 01 R1, R2, R3, R4 | Atomic store/manifest/events and direct mission-lite cutover |
| P01.2 | Phase 01 R5, R6, R7, R8 | Shared engine, dynamic consult, recovery and live agent-led proof |
| P02.1 | Phase 02 R1, R2, R3, R4 | Pure IR/schema/profile validators |
| P02.2 | Phase 02 R5, R6, R7, R8 | Additive Workflow projection, protocol discovery, fixtures/doctor |
| P03.1 | Phase 03 R1, R2, R3, R4 | Consult materialization/topology/policy provenance |
| P03.2 | Phase 03 R5, R6, R7, R8 | Equivalent agent-led/declared proofs and bypass negatives |
| P04.1 | Phase 04 R1, R2, R3, R4 | Pure deterministic Cohort Planner and unsatisfied explanations |
| P04.2 | Phase 04 R5, R6, R7, R8, R9 | Concurrent isolated research, verified fan-in, two-provider live proof |
| P05.1 | Phase 05 R1, R2, R3, R4 | Framework definition and phase/activity semantics |
| P05.2 | Phase 05 R5, R6, R7, R8 | Locked external case, baseline, heterogeneous proof and quality report |
| P06.1 | Phase 06 R1, R2, R3, R4 | Quorum/partial/retry/recovery hardening |
| P06.2 | Phase 06 R5, R6, R7, R8 | Hard budgets, adversarial suite, Work isolation negatives |
| P07.1 | Phase 07 R1, R2, R3, R4 | Public CLI/registry/examples and shared headless adapter |
| P07.2 | Phase 07 R5, R6, R7, R8 | Parity proof, external adoption, canonical closure and final audit |

The master may split a suggested cell further for the playbook trace limits but
must not merge across the listed close boundaries or assign one requirement to
multiple cells.

## Rollback Strategy

- One commit per closed cell; no cross-cell squashing.
- Phase 00 dispatch changes are independently revertible from coordination
  runtime.
- New coordination modules are additive until Phase 01's direct mission-lite
  cutover; rollback restores the prior module from Git, not a compatibility
  reader.
- Workflow projection remains additive throughout, so reverting protocol
  phases does not alter Work lifecycle behavior.
- Local `.fgos/coordination/` state is disposable runtime data. Rollback never
  rewrites committed Work events or Assignment/Run/RunResult evidence.
