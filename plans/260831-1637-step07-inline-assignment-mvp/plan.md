# Step 07 MVP — Inline Assignment On One Governed Core

Status: done (2026-09-01) | Created: 2026-08-31 | Owner: maintainer
Authority: [ADR-006](../../docs/architect/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md), [ADR-007](../../docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md), [Step 07 checkpoint §19](../../docs/architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md)
Advisory trail: `plans/reports/advisor-260831-1559-step07-strategy-revision-after-review-report.md`

## Goal

Prove Vision V-012 on the smallest slice: two one-shot, read-only consumers
(standalone agent-led; coding consult on a planning Work) run through the same
`buildAssignment -> executeAssignment -> Run -> RunResult` core, with an
inline provenance class that cannot bypass governance or the declared graph.

## Phases

| # | Phase | Depends on | Status | Exit |
|---|---|---|---|---|
| 1 | [executeAssignment hardening + plan-verdict derivation](phase-01-execute-assignment-hardening-and-plan-verdict-derivation.md) | — | done (P01.1 `07f2d943`, P01.2 `d97837d3`) | G1, G6 fixed; `planVerdictFromPlanMd()` lands with READY+split-children test green |
| 2 | [Assignment provenance + stamped snapshot](phase-02-assignment-provenance-and-stamped-snapshot.md) | 1 | planned | declared path unchanged in behavior; `provenance`, `mutation`, `evidence.required` on every Assignment; interpretation field-driven; G3 closed; mission-lite off `stage:'planning'`; heuristic removed |
| 3 | [Harness seam + two proofs](phase-03-harness-seam-and-two-proofs.md) | 2 | done (P03.1 `2a22c93c`, P03.2 `7abe80c4`/`05e79b40`, P03.3 `e82a54d0`) | Proof 1 and Proof 2 recorded under `verification/`; `--contract` CLI door; negative tests green |

Separate items, not in this plan: **G4** verify-skip via `branchHeadAtReturn`
(security-relevant, prioritize alongside); **G2** `resolvePlan` `.fgos`
basename assumption (4 failing tests in `test/intake/plan.test.mjs`, before any
planning-materialization work).

## Acceptance Criteria (plan-level)

- `npm test` green except the pre-existing G2/G4/G7 failures, which must not grow.
- No Assignment, Run, or DispatchPlan produced by Proof 1 references a coding
  Stage or TaskSpec.
- Proof 2's Assignment carries `provenance.kind: inline`, `supports` a legal
  planning operation, harness-added context refs, and its RunResult is never
  consumed by driver operation choice.
- Declared-path golden tests (Step 02–06 batteries) pass without modification
  other than asserting the new stamped fields.
- All new persistence stays under `.fgos/assignments/`; nothing new under
  `.fgos/missions/` beyond references.

## Out Of Scope

Mutating inline contracts; `coordinationId`/ledger; AdhocTask/TaskCandidate
persistence; cells in plan.md; promotion; nested Work topology; Step 08
protocols; any CLI beyond the `--contract` flag.

## Rollback

Each phase is one PR. Phase 2 keeps the declared path behind the same
functions; reverting the PR restores op-id switching. Mission-lite migration
is reversible (prototype, no on-disk data).

## Execution

Executed by the [Master Multi-Agent Implementation Coordinator](../../docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md),
not by fgOS skills, fgos-runner, or Work items — fgOS is the system under test.

- TRACK: `step-07-mvp` -> `docs/architect/agent-coordination/verification/step-07-mvp/`
- BRANCH: `step-07-mvp` from `main`
- Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`
- Known baseline failures to record before the first cell: G2 (4 in
  `test/intake/plan.test.mjs`), G4 (2 e2e, verify-skip at merge), G7 (1 flake
  ask/answer round-trip). Cause per Cell 6.7 record.
- Suggested cell split: P01.1 (R1 G1 + R2 G6), P01.2 (R3 + R4 + R5);
  P02.1 (R1–R4 declared path only, goldens), P02.2 (R5 + R6), P02.3 (R7 + R8);
  P03.1 (R1 + R2), P03.2 (R3), P03.3 (R4 + R5 + R6 live proofs).
- Role tiers: Doer/Reviewer/Red-Team sonnet-class; master keeps coordination.
- Live proofs (P03.3) require a configured executor in `.fgos/config.json`;
  absence is a stop gate, not a reason to fake evidence.
- Repository rules bind every cell: `docs/specs/reading-map.md` then the runner
  area spec before touching `src/runner/**`; no cell/phase/requirement ids in
  code comments, test names, or commit messages; CHANGELOG `[Unreleased]` for
  user-visible changes.
- Self-hosted hook hazard: `scripts/dispatch-decide-hook.mjs` (PreToolUse on
  Agent/Task) imports `src/runner/dispatch.mjs`. Every cell touching
  `src/runner/dispatch/**` must keep `node src/runner/dispatch.mjs decide --for smoke --needs-soul --has-live-task-access`
  printing a `mechanism` field before it can close; no parallel Doers on those files.
- Mechanism/driver priority (user decision 2026-08-31): prove interactive
  session driving + `cli-spawn` workers first and completely; headless runner
  driving (loop.mjs sweeps, `--watch`) and `herdr-spawn` panes come only
  afterwards in their own phases. Phase 01 R4 wires the loop.mjs planning sweep
  and is covered by unit tests only — it is not a headless live proof and must
  not be presented as one. Both P03 live proofs run from the master's
  interactive session via `fgos dispatch execute --contract` with a `cli-spawn`
  executor (`claude-reviewer`).
