# Step 09 MVP6-MVP9 Group-Thinking Substrate

Status: planned | Created: 2026-09-03 | Owner: maintainer

Execution track: `step-09-mvp6-to-mvp9`

Authority entering the plan:

- [Architecture Intent](../../docs/architect/architecture-intent.md)
- [Step 09 Group Thinking Substrate](../../docs/architect/proposals/step-09-group-thinking-substrate.md)
- [Component Authority Boundary Map](../../docs/architect/proposals/component-authority-boundary-map.md)
- [Coordination Foundation Baseline](../../docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md)
- [CoordinationSession Contract](../../docs/architect/agent-coordination/contracts/coordination-session.md)
- [FlowDefinition Contract](../../docs/architect/agent-coordination/contracts/flow-definition.md)
- [MVP6+ Dogfood Handoff](../../docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md)
- [MVP3-MVP5 Plan](../260903-1049-step09-mvp3-to-mvp5/plan.md)

## Goal

Complete the remaining Step 09 substrate without building a general
collaboration framework:

1. MVP6 adds fail-closed visibility windows over exact context grants.
2. MVP7 adds evidence-preserving aggregation through a separate Team Cognition
   authority.
3. MVP8 adds immutable, artifact-backed deliberation contribution lineage.
4. MVP9 adds driver-authorized specialist binding into predeclared bounded
   slots.
5. An external Group-Thinking Protocol Pack, Conformance Suite, and thin
   `fgos-group-thinking` skill prove the substrate through public surfaces.

## Entry Conditions

- MVP5 is closed and its real standalone launch/resume/show path remains green.
- The MVP6+ dogfood handoff can coordinate plan/artifact review without Work.
- `group-cognition-framework.yaml` is unchanged from its Step 08 proof posture.
- No active MVP1-MVP5 implementation cell owns the files targeted here.
- A baseline full-suite result and git diff are recorded before implementation.

## Product Gates

Product acceptance remains sequential even where preparatory work runs in
parallel.

| # | MVP | Phase | Product dependency | Exit |
|---|---|---|---|---|
| 00 | Intake | [Freeze contracts, baseline, and work lanes](phase-00-freeze-contracts-and-work-lanes.md) | MVP5 handoff | One accepted execution map, baseline, and non-overlapping write scopes |
| 06 | MVP6 | [Visibility windows](phase-06-mvp6-visibility-windows.md) | 00 | Window legality and exact grants replay deterministically; isolation remains unchanged |
| 07 | MVP7 | [Evidence-preserving aggregation](phase-07-mvp7-evidence-preserving-aggregation.md) | 06 | Team Cognition validates honest synthesis without owning session terminal truth |
| 08 | MVP8 | [Deliberation memory](phase-08-mvp8-deliberation-memory.md) | 07 | Typed contribution lineage replays without mailbox semantics |
| 09 | MVP9 | [Bounded specialist binding](phase-09-mvp9-bounded-specialist-binding.md) | 08 | A driver can bind one capped specialist without runtime edge mutation |
| 10 | External acceptance | [Protocol Pack, conformance, and Step 09 closeout](phase-10-group-thinking-protocol-pack-conformance-and-closeout.md) | 09 | Three reference protocols use only public contracts; exit contract passes and accepted semantics are promoted |

## Parallel Execution Map

The Master Multi-Agent Implementation Coordinator may dispatch only cells whose
`Ready after` condition is satisfied. Product gates do not prevent isolated
preparatory cells from starting early; they prevent those cells from being
integrated or claimed accepted early.

| Wave | Parallel cells | Ready after | Exclusive write scope |
|---|---|---|---|
| 0 | P00.1 baseline, P00.2 contract/file ownership audit | MVP5 handoff | Read-only except P00 evidence |
| 1 | P06.1 visibility definition validator; P07.1 Team Cognition aggregation evaluator skeleton | P00 | P06 owns FlowDefinition/schema paths; P07 owns new Team Cognition paths only |
| 2 | P06.2 visibility runtime/replay; P07.2 aggregation fixtures/tests that do not touch session integration | P06.1 and P07.1 respectively | P06 owns CoordinationSession runtime; P07 owns Team Cognition tests/fixtures |
| 3 | P07.3 aggregation integration; P08.1 contribution model/validator | P06 exit and P07.1/P07.2 | One integration owner for shared schema/session files; P08.1 stays in Team Cognition-only paths |
| 4 | P08.2 deliberation ledger/replay, then P09.1 specialist-slot definition work | P07 exit and P08.1; P09.1 may prepare after P06 exit | Shared session files serialize through the active phase integrator |
| 5 | P09.2 specialist authorization/runtime/replay | P08 exit and P09.1 | Specialist integrator owns shared coordination files |
| 6 | P10.1 pack registry/surface; P10.2 RFC-lite; P10.3 Nominal-Group-lite; P10.4 Delphi-feedback-lite | P09 exit | Separate pack/fixture directories; no shared registry edit by fixture workers |
| 7 | P10.5 pack integration; P10.6-P10.9 conformance lanes | P10.1-P10.4 | Integrator owns registry/shared docs; conformance lanes own separate test/evidence paths |
| 8 | P10.10 promotion and closeout | All conformance lanes | One closer owns canonical contract/docs promotion |

## Shared-File Lease Rule

Parallel workers must not edit the same authority surface. Before dispatch, the
external Master Coordinator records one active owner for each shared group:

```txt
definition-schema   = FlowDefinition loader/schema and protocol fixtures
session-runtime     = CoordinationSession schema/store/replay/engine
team-cognition      = cognitive evaluator/model implementation
public-surface      = CLI/headless/skill request and rendering path
canonical-docs      = accepted contracts, baseline, proposal status
shared-tests        = existing cross-feature coordination suites
```

Workers outside the active lease may return findings, test cases, or patch
artifacts, but may not edit the leased files. The integration cell consumes
those artifacts in one writer context. This rule is more important than
maximizing worker count.

For this plan, one **wave** is the active coordination unit. The generic Master
Prompt's one-active-cell rule is narrowed as follows: there is still at most one
active integration cell, while multiple leaf cells explicitly listed in the
same wave may be active only when they are read-only or use isolated
workspaces/branches with disjoint leases. A shared checkout never has concurrent
source writers. The coordinator integrates leaf results sequentially into the
track branch and verifies the combined state before advancing the product gate.

## Plan-Level Acceptance

- Visibility legality is declared by FlowDefinition and concrete read authority
  remains exact `grantedContextRefs`/Assignment context provenance.
- Team Cognition owns cognitive interpretation; Agent Coordination alone owns
  session transitions and grant/dispatch legality.
- Aggregation cannot hide declared source gaps, dissent, unresolved objections,
  failures, omissions, or artifact revision provenance.
- Deliberation state is immutable and artifact-backed, with no generalized
  AgentMessage, mailbox, delivery, unread, or mutable-thread model.
- Specialist recruitment binds into a predeclared capped slot; no arbitrary
  runtime edge or autonomous worker recruitment exists.
- RFC-review-lite, Nominal-Group-lite, and Delphi-feedback-lite run without
  protocol-specific kernel branches.
- The thin skill launches/resumes/renders through public coordination surfaces
  and does not carry hidden group-thinking logic.
- CLI/headless parity, crash/resume idempotency, budget caps, governance-final
  dispatch, evidence immutability, and mutation exclusivity remain green.
- No Work lifecycle, Coding Domain, git, worktree, merge, or repository mutation
  authority moves into Agent Coordination or Team Cognition.
- The unchanged isolation-heavy Group Cognition fixture remains green.

## Non-Negotiable Deferrals

- No change or loosening of
  `core/coordination-protocols/group-cognition-framework.yaml`.
- No autonomous in-graph coordinator, judge, or leader.
- No general peer-chat/mailbox protocol.
- No cross-session context grant.
- No partial-window exception in MVP6.
- No strong anonymization guarantee or aggregate transformation in MVP6.
- No vote, weighted vote, rank tally, convergence engine, or prose-parsed vote
  in MVP7/MVP8.
- No arbitrary `addSessionEdge`, topology overlay, driver handoff, persistent
  organization membership, or peer-authorized specialist.
- No Step 10 Coding adoption assumption.

## Master Coordination Contract

Use the [Master Multi-Agent Implementation Coordinator](../../docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md)
as an external implementation coordinator. It is not a graph actor and is not
the runtime feature being shipped.

For every dispatch wave the coordinator must:

1. Read live repo/session state before trusting worker narration.
2. Dispatch only ready cells and name their exclusive write scopes.
3. Keep Reviewer and Red-Team first passes isolated.
4. Require each worker to return changed paths, tests, evidence refs, unresolved
   risks, and whether it touched a shared lease.
5. Integrate shared files through one designated writer.
6. Run focused tests after each integration cell and the full suite at each MVP
   product gate.
7. Record driver disposition on findings before authorizing fix/recheck work.
8. Stop dispatch from a failed product gate while allowing unrelated read-only
   review cells to finish.
9. Use isolated workspaces for concurrent source-writing leaf cells; otherwise
   downgrade them to read-only patch/report producers and integrate serially.
10. Keep exactly one integration cell active and never merge concurrent leaf
    results without reviewing their combined diff and rerunning gate tests.

## Execution Inputs

```text
REPO_ROOT: /home/vantt/projects/forgentX
PLAN_DIR: /home/vantt/projects/forgentX/plans/260903-2334-step09-mvp6-to-mvp9
TRACK: step-09-mvp6-to-mvp9
BRANCH: step-09-mvp6-to-mvp9
BASE_REF: infer once at execution start and persist it
MAX_PARALLEL_CELLS: 4
```

The implementation owner must derive focused test commands from the actual
files after P00. The full closeout command remains `npm test` unless the repo's
accepted test entry point changes before execution.
