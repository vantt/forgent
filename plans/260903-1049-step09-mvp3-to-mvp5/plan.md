# Step 09 - Group Thinking Substrate MVP3 To MVP5

Status: proposed | Created: 2026-09-03 | Owner: maintainer

Execution track: `step-09-mvp3-to-mvp5`

Authority entering the plan:

- [Architecture Intent](../../docs/architect/architecture-intent.md)
- [Step 09 Group Thinking Substrate](../../docs/architect/proposals/step-09-group-thinking-substrate.md)
- [Component Authority Boundary Map](../../docs/architect/proposals/component-authority-boundary-map.md)
- [Coordination Foundation Baseline](../../docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md)
- [CoordinationSession Contract](../../docs/architect/agent-coordination/contracts/coordination-session.md)
- [FlowDefinition Contract](../../docs/architect/agent-coordination/contracts/flow-definition.md)
- [MVP1/MVP2 Plan](../260903-0004-step09-group-thinking-mvp1-mvp2/plan.md)

This plan starts after the MVP1/MVP2 track has closed or produced an accepted
handoff that the maintainer explicitly allows this plan to consume. It must not
edit, reinterpret, duplicate, or race the active MVP1/MVP2 Phase 03 work.

## Goal

Make the Step 09 Master Coordination substrate usable without skipping steps:

1. **MVP3** accepts, hardens, or gap-closes first-class recheck lineage and
   driver disposition semantics from the MVP1/MVP2 handoff.
2. **MVP4** adds a thin user-facing launcher for declared group-thinking
   fixtures.
3. **MVP5** proves an end-to-end standalone Master Coordination run that a user
   can invoke and resume without relying on chat history.

After MVP5, Step 09 should be able to dogfood its own substrate for MVP6+ design
and implementation coordination: a maintainer can give it a plan/artifact, get
Doer/Reviewer/Red-Team/Fixer/Recheck outputs through the runtime ledger, and
resume from persisted state. Until Step 10 or another accepted mutation
authority exists, any source/worktree/git mutation remains outside Agent
Coordination authority.

This plan still excludes Coding Domain adoption, Work lifecycle mutation, git
authority, dynamic specialist pull-in, broad deliberation memory, visibility
windows, and general aggregation frameworks.

## Entry Conditions

- MVP1 fixture skeleton exists and validates.
- MVP2 driver authorization primitive exists or has a maintainer-approved
  handoff naming the exact remaining limitations.
- `standalone-master-coordination-loop` is the declared fixture under test.
- `group-cognition-framework.yaml` remains unchanged from the Step 08 baseline.
- The current MVP1/MVP2 verification track has no unresolved blocker that would
  make MVP3-5 build on a known false premise.

If any entry condition fails, stop before code changes and record the blocker.

## Phases

| # | MVP | Phase | Depends on | Exit |
|---|---|---|---|---|
| 00 | Intake | [Consume MVP1/MVP2 handoff and freeze scope](phase-00-consume-handoff-and-freeze-scope.md) | MVP1/MVP2 handoff | done (P00.1) — Handoff accepted; no overlap with active MVP1/MVP2 work |
| 01 | MVP3 | [Recheck lineage and driver disposition](phase-01-mvp3-recheck-lineage-and-disposition.md) | 00 | done (P01.1) — Handoff semantics are accepted or the exact remaining MVP3 gaps are closed; recheck and disposition are replayable, immutable, and distinct from retry |
| 02 | MVP4 | [Thin surface launcher](phase-02-mvp4-thin-surface-launcher.md) | 01 | User can invoke the declared fixture without prompt-copy logic in the surface |
| 03 | Config | [Role execution policy readiness](phase-03-role-execution-policy-readiness.md) | 02 | Doer, Reviewer, Red-Team, Fixer, and Recheck resolve to intentional provider/model/tier policy |
| 04 | MVP5 | [Usable standalone live proof](phase-04-mvp5-usable-standalone-live-proof.md) | 03 | Full no-Work Master Coordination loop runs, resumes, and closes with evidence |

## Plan-Level Acceptance

- Full test suite passes relative to the baseline recorded before the first
  implementation cell.
- MVP3 preserves old RunResults/verdicts and records recheck as new Assignment
  lineage, not retry supersession. If MVP1/MVP2 already implemented this, MVP3
  records acceptance and only adds missing proof or display hardening.
- MVP3 disposition is a driver event with provenance and evidence refs. A worker
  cannot self-disposition final truth. If MVP1/MVP2 already implemented this,
  MVP3 does not reimplement it.
- MVP4 launcher assembles a request for a declared fixture and calls the
  coordination runtime. It does not contain group-thinking logic, hidden actors,
  hidden prompts, or bypasses.
- Role execution policy for the fixture is explicit enough to avoid accidental
  all-lightweight execution: Doer/Fixer may be cheap by default, while Reviewer,
  Red-Team, and Recheck have analytical/critical escalation rules.
- MVP5 live proof runs from a normal user-facing command path, not from manual
  Master Prompt orchestration alone.
- MVP5 proof can resume from persisted session state and does not duplicate
  assignments, reconsume authorization keys, or lose disposition lineage.
- MVP5 leaves a documented dogfood handoff showing how MVP6+ can be started
  through the new runtime/surface path instead of the manual Master Prompt for
  group-thinking coordination.
- No Work item, Work status/stage, claim, return, approval, merge, branch
  management, tracked source mutation, or worktree delivery mutation is created
  by this standalone proof. Runtime may still write `.fgos/coordination`
  session state and the plan may write explicit verification evidence.
- Existing Step 08 and MVP1/MVP2 behavior remains compatible.

## Non-Negotiable Boundaries

- Do not modify or loosen
  `core/coordination-protocols/group-cognition-framework.yaml`.
- Do not add an autonomous coordinator actor to
  `standalone-master-coordination-loop`.
- Do not put Work/git/coding-domain authority inside Agent Coordination.
- Do not let a skill/slash command become a second coordination engine.
- Do not use playbook prose as product runtime logic.
- Do not claim Step 09 standalone coordination owns code mutation after MVP5.
  Dogfooding MVP6+ may use the substrate to coordinate plan/artifact/review
  loops, while source mutation remains under existing external tooling or later
  Coding/Work authority.
- Do not introduce `addSessionEdge`, global AgentMessage/mailbox, global intent
  registry, Delphi/NGT/RFC frameworks, or dynamic specialist pull-in in this
  plan.

## Implementation Guidance

- Recheck/disposition belongs in `src/runner/coordination/` and session replay;
  after the MVP1/MVP2 handoff, change only the missing or insufficient parts.
- Artifact refs should remain owned by RunResult/evidence. Coordination links
  them; it does not copy or become artifact authority.
- Launcher belongs at the public surface only after the declared runtime path is
  authoritative.
- Any request-file shape added for the launcher must be schema-validated and
  must not bypass FlowDefinition/session authorization.
- Use existing `fgos coordination run/show` semantics where possible before
  adding a new command.
- Fixture and surface code should declare capabilities/tier floors, not literal
  provider/model pins. Project config maps those capabilities to concrete
  executors and model policies.
- Minimal expected policy: Doer/Fixer default to standard or cheapest capable
  coding execution; Reviewer/Recheck default to analytical read-only execution;
  Red-Team defaults to analytical and escalates to critical for invariant,
  security, concurrency, dispatch, session/replay/schema, or Work-boundary cells.

## Autonomous Execution Contract

Use the [Master Multi-Agent Implementation Coordinator](../../docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md).
The Master Prompt is only the manual implementation coordinator for this repo.
It is not the runtime mechanism being shipped.

Stop only when one of these gates occurs:

1. MVP1/MVP2 handoff is incomplete or contradictory;
2. MVP3 requires changing retry supersession semantics instead of adding
   recheck lineage;
3. MVP4 requires putting coordination logic into a skill/slash surface;
4. MVP5 requires Work/git/tracked-source delivery mutation to prove standalone
   usability;
5. required independent Reviewer or Red-Team cannot be launched;
6. tests or live proof cannot produce trustworthy evidence after one documented
   recovery attempt;
7. GitNexus reports HIGH/CRITICAL impact and the active cell did not already
   name blast radius and mitigation;
8. concurrent/user changes overlap an active cell so preservation is impossible
   without choosing whose behavior wins.

## Execution Inputs

```text
REPO_ROOT: /home/vantt/projects/forgentX
PLAN_DIR: /home/vantt/projects/forgentX/plans/260903-1049-step09-mvp3-to-mvp5
TRACK: step-09-mvp3-to-mvp5
SCOPE_DOCS:
  - docs/architect/architecture-intent.md
  - docs/architect/proposals/step-09-group-thinking-substrate.md
  - docs/architect/proposals/component-authority-boundary-map.md
  - docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
  - docs/architect/agent-coordination/contracts/coordination-session.md
  - docs/architect/agent-coordination/contracts/flow-definition.md
  - plans/260903-0004-step09-group-thinking-mvp1-mvp2/plan.md
BRANCH: step-09-mvp3-to-mvp5
BASE_REF: infer once when branch is created and persist it
MAX_CELLS_THIS_RUN: unlimited
```

Full test command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
```
