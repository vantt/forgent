# Step 09 - Group Thinking Substrate MVP1/MVP2

Status: proposed | Created: 2026-09-03 | Owner: maintainer

Execution track: `step-09-group-thinking-mvp1-mvp2`

Authority entering the plan:

- [Architecture Intent](../../docs/architect/architecture-intent.md)
- [Step 09 Group Thinking Substrate](../../docs/architect/proposals/step-09-group-thinking-substrate.md)
- [Component Authority Boundary Map](../../docs/architect/proposals/component-authority-boundary-map.md)
- [Coordination Foundation Baseline](../../docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md)
- [CoordinationSession Contract](../../docs/architect/agent-coordination/contracts/coordination-session.md)
- [FlowDefinition Contract](../../docs/architect/agent-coordination/contracts/flow-definition.md)
- [Master Multi-Agent Implementation Coordinator](../../docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md)
- [Coordination Operating Harness](../../docs/architect/agent-coordination/playbooks/coordination-operating-harness.md)

Step 09 MVP1/MVP2 turns the proven manual Master Coordinator operating shape
into the first standalone runtime-facing group-thinking fixture. The fixture
must stay independent from Work, git, merge, and coding-domain lifecycle
authority.

## Goal

Deliver the smallest accepted substrate slice that can express:

1. a standalone `standalone-master-coordination-loop` fixture;
2. required Doer, Reviewer, and Red-Team first-pass operations;
3. driver-authorized Fixer/Doer-followup and recheck operations;
4. disposition as a driver ledger event, not a worker verdict;
5. context grants and artifact refs sufficient to recheck a revised artifact;
6. hard preservation of Step 08 invariants and the existing isolation-heavy
   `group-cognition-framework.yaml` proof fixture.

## Non-Negotiable Boundaries

- Do not modify or loosen
  `core/coordination-protocols/group-cognition-framework.yaml`.
- Do not introduce an autonomous in-graph coordinator/leader.
- Do not give Agent Coordination Work lifecycle, git, worktree, merge, approval,
  or coding-domain mutation authority.
- Do not create a second execution core or private evidence path.
- Do not reinterpret retry as recheck. Retry supersedes a Run for one
  Assignment; recheck creates a new Assignment against new artifact/evidence.
- Do not use playbook prose as runtime logic. The Master Prompt remains a
  manual implementation coordinator and proof source only.

## Phases

| # | Phase | Depends on | Exit | Status |
|---|---|---|---|---|
| 00 | [Promote minimal contract deltas](phase-00-promote-minimal-contract-deltas.md) | user-approved Step 09 direction | Accepted docs define fixture, authorization, artifact refs, recheck, disposition, and bounds semantics before code | done (P00.1, 2026-09-03) |
| 01 | [MVP1 fixture skeleton and validation](phase-01-master-coordination-fixture-skeleton.md) | 00 | Fixture validates as a CoordinationProtocol without Work fields and without changing existing fixtures | done (P01.1, 2026-09-03) |
| 02 | [MVP2 driver authorization primitive](phase-02-driver-authorization-primitive.md) | 01 | Driver-authorized operations cannot dispatch without a valid event and cannot exceed binding/session caps | done (P02.1+P02.2, 2026-09-03) |
| 03 | [Recheck, disposition, and live standalone proof](phase-03-recheck-disposition-live-proof.md) | 02 | A no-Work live run proves candidate, review, red-team, authorized revision, recheck, disposition, and close | done (P03.1+P03.2, 2026-09-03) |

**Plan status: CLOSED.** All four phases done. Full verification trace:
`docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md`.

Phases execute in order. Phase 00 must land before source runtime changes so
the implementation reads from accepted contracts rather than a discussion-only
proposal.

## Plan-Level Acceptance

- Full test suite passes relative to the baseline recorded before the first
  implementation cell.
- Existing Step 08 standalone coordination behavior remains compatible.
- `group-cognition-framework.yaml` is unchanged and its isolation-heavy proof
  remains valid.
- The new fixture is a `CoordinationProtocol`; it contains no Work profile,
  Work lifecycle, Stage, git, merge, or coding-domain mutation fields.
- Optional operations reject unless a valid `operation-authorized` event exists.
- Authorization replay/double-spend is rejected through `invocationKey`.
- Context outside `grantedContextRefs` is rejected.
- Terminal sessions refuse authorization and new dispatch.
- Binding caps and `aggregateBounds` caps are both enforced, with aggregate caps
  always winning.
- Recheck creates new Assignments and preserves old RunResults/verdicts.
- Disposition is replayable from session events and cannot masquerade as a
  worker result.
- Live proof runs through the same Assignment/Run/RunResult/evidence path as
  existing coordination execution.
- No Work status/stage/claim/return/approval/merge changes occur.

## Implementation Guidance

Prefer additive changes in the existing ownership seams:

- `src/runner/definitions/` owns FlowDefinition schema/validation.
- `core/coordination-protocols/` owns reusable coordination fixtures.
- `src/runner/coordination/` owns session events, replay, declared operation
  materialization, and bounds checks.
- `src/runner/dispatch/` and Assignment/Run/RunResult remain the execution and
  evidence path; do not fork them.
- CLI changes are allowed only where needed to run/prove the declared fixture.
- Setup/doctor updates are required only if a new runtime-read config,
  definition location, or infrastructure assumption is introduced.

## Out Of Scope / Do Not Build

- Coding Domain adoption.
- Work-attached mutation.
- General `addSessionEdge`.
- General peer mailbox or AgentMessage thread.
- Delphi, NGT, RFC, or voting framework implementation.
- Global closed intent vocabulary.
- Framework marketplace or UI.
- Headless/herdr expansion beyond what existing coordination CLI/headless paths
  already require for parity.
- Repo mutation by standalone group-thinking fixture.

## Autonomous Execution Contract

Use the [Master Multi-Agent Implementation Coordinator](../../docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md).
This plan contains no open product choice for routine implementation. The
master must infer reversible implementation details from accepted contracts,
adjacent Step 08 code, and the smallest compatible change.

Stop only when one of these gates occurs:

1. Step 09 discussion text cannot be promoted into accepted contract without a
   new maintainer decision;
2. accepted contracts conflict with this plan and no additive interpretation
   exists;
3. an implementation requires Work/git/coding-domain mutation authority inside
   Agent Coordination;
4. required independent Reviewer or Red-Team cannot be launched;
5. tests or live proof cannot produce trustworthy evidence after one documented
   recovery attempt;
6. GitNexus reports HIGH/CRITICAL impact and the active cell did not already
   name that blast radius and mitigation;
7. concurrent/user changes overlap an active cell so preservation is impossible
   without choosing whose behavior wins.

Do not stop for naming, file placement, test fixture shape, error wording,
internal helper boundaries, or other reversible choices already constrained by
the phase.

## Execution Inputs

```text
REPO_ROOT: /home/vantt/projects/forgentX
PLAN_DIR: /home/vantt/projects/forgentX/plans/260903-0004-step09-group-thinking-mvp1-mvp2
TRACK: step-09-group-thinking-mvp1-mvp2
SCOPE_DOCS:
  - docs/architect/architecture-intent.md
  - docs/architect/proposals/step-09-group-thinking-substrate.md
  - docs/architect/proposals/component-authority-boundary-map.md
  - docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
  - docs/architect/agent-coordination/contracts/coordination-session.md
  - docs/architect/agent-coordination/contracts/flow-definition.md
BRANCH: step-09-group-thinking-mvp1-mvp2
BASE_REF: infer once when branch is created and persist it
MAX_CELLS_THIS_RUN: unlimited
```

Before P00.1, the master records `git status`, preserves all unrelated changes,
runs the full baseline, and audits current code rather than trusting stale line
numbers. Every symbol edit requires the repository's GitNexus upstream impact
analysis when available. Before each cell commit, run GitNexus `detect_changes`
against `BASE_REF` when available and `git diff --check`.

Full test command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
```

