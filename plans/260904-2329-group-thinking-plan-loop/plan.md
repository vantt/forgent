# Group-Thinking Plan Loop

Status: COMPLETE — all phases (01, 02, 03 incl. R5-R7 live proof) closed and merged (see `docs/architect/agent-coordination/verification/group-thinking-plan-loop/index.md`'s own "Track status") | Created: 2026-09-04 | Owner: maintainer

Execution track: `group-thinking-plan-loop`

Authority entering the plan:

- [Group-Thinking Plan Loop — Design Proposal](../../docs/architect/proposals/group-thinking-plan-loop.md)
- [Master Multi-Agent Implementation Coordinator](../../docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md)
- [MVP6+ Dogfood Handoff](../../docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md)
- [CoordinationSession Contract](../../docs/architect/agent-coordination/contracts/coordination-session.md)
- [FlowDefinition Contract](../../docs/architect/agent-coordination/contracts/flow-definition.md)
- [`docs/how-to/run-a-coordination-session.md`](../../docs/how-to/run-a-coordination-session.md)
- [`docs/how-to/use-fgos-group-thinking.md`](../../docs/how-to/use-fgos-group-thinking.md)
- [ADR-006 (execution-contract read-only staging)](../../docs/architect/agent-coordination/decisions/) — cite the exact ADR file the Phase 1 Doer locates; superseded by this plan's own decision, never edited in place
- [`docs/specs/runner.md`](../../docs/specs/runner.md) §"CoordinationSession" and its Work-boundary stop gate (~line 1279)

## Goal

Give a live agent session ("the Lead") a group-thinking-native,
Work-independent way to run the same audit → decompose-into-cells →
Doer → independent Reviewer + Red-Team → disposition → fix → recheck →
close → next-cell loop that `master-coordinator.md` already runs by hand,
with two properties the manual prompt cannot give on its own:

1. **Real, replayable evidence** for every cell — Assignment/Run/RunResult
   through the CoordinationSession runtime, not chat scrollback or
   hand-written markdown.
2. **Genuine per-role provider/model/tier diversity** — Doer, Reviewer,
   Red-Team, Fixer each independently routable to a different real
   executor (Claude/Codex/Antigravity/etc.) within one evidence-linked
   session, proven live already by `P10.1`/`P10.3`.

No Work engine involvement of any kind. No new FlowDefinition/protocol
kind. One narrow, carefully-scoped kernel change (Phase 1) is the only
kernel-file work in this plan.

## Entry Conditions

- `step-09-mvp6-to-mvp9` is closed and merged into `main` (confirmed:
  `main`'s HEAD contains commit `856eeaf1` or a descendant).
- The group-thinking Protocol Pack and `fgos-group-thinking` skill are
  live on `main` (confirmed by `docs/how-to/use-fgos-group-thinking.md`
  existing and its own examples passing).
- No active cell from any other track owns
  `src/runner/coordination/**`, `src/runner/dispatch/**`, or
  `src/verbs/coordination/**` (check `git worktree list` and any other
  track's own `index.md`/`current-cell.md` before opening Phase 1).
- A baseline full-suite result is recorded before implementation (see
  Execution Inputs).

## Product Gates

| # | Phase | Product dependency | Exit | Status |
|---|---|---|---|---|
| 01 | [Mutation unlock](phase-01-mutation-unlock.md) | Entry Conditions | A declared `operation` step may dispatch `mutation: 'mutating'` only under the four-condition rule; every existing read-only-role test stays green; the cwd/repoRoot session-path bug is fixed and covered | **done** (2026-09-05) — P01.1 closed after 4 real fix rounds (forged-stamp bypass, confusion-of-authority bypass, a verified trust-boundary reframe, an overclaim correction), merged into `group-thinking-plan-loop` |
| 02 | [Chain verb and pack registration](phase-02-chain-verb-and-pack-registration.md) | Entry Conditions | `fgos coordination chain <track>` renders a correct, real status board from nothing but the session chain's own event logs; `standalone-master-coordination-loop` is a group-thinking pack member | **done** (2026-09-05) — P02.1 closed, merged into `group-thinking-plan-loop` |
| 03 | [Plan-loop skill and live proof](phase-03-plan-loop-skill-and-live-proof.md) | 01 and 02 both closed | `fgos-plan-loop` skill exists and a real, two-cell live proof on a separate host/dogfood project (never `forgentX`) confirms the whole loop: cross-provider dispatch, a real forced fix round, a killed-and-resumed cell, a merged result, zero Work engine touched | **done** (2026-09-05) — `fgos-plan-loop` skill authored, merged, live. R5-R7 live proof executed for real against `/home/vantt/projects/fgos-test-drive` (user go-ahead given, cross-provider executors configured): real kill+resume, real cross-provider dispatch, real fix round, zero Work-state touch confirmed. Independent Reviewer + Red-Team both APPROVE(-with-fixed-concerns). One HIGH gap filed as its own follow-up (`tsk-371`: `run.mjs` never forwards `step.mutation`) — out of this cell's scope. |

## Parallel Execution Map

The Master Multi-Agent Implementation Coordinator may dispatch only cells
whose `Ready after` condition is satisfied.

| Wave | Parallel cells | Ready after | Exclusive write scope |
|---|---|---|---|
| 1 | P01.1 mutation unlock; P02.1 chain verb + pack registration | Entry Conditions | P01 owns kernel/dispatch-core files (below), never `bin/fgos.mjs` or any CLI-registration/test file; P02 owns the new `chain.mjs` file, ALL CLI registration/wiring (including the `--cwd` flag and every enumerated-subcommand string), the pack JSON, and `test/cli/coordination.test.mjs` — zero file overlap with P01 |
| 2 | P03.1 skill authoring + live proof | P01 and P02 both closed | P03 owns the new skill directory and its own request templates; touches no file P01/P02 touched |

Two waves total. Wave 1 is the plan's only real parallelism opportunity —
P01 and P02 have zero file overlap and no data dependency on each other
(P02's chain verb reads session state that already exists regardless of
whether Assignments dispatched by it are read-only or mutating; P01's
unlock does not require the chain verb to exist). **This zero-overlap
claim depends entirely on P01 never touching `bin/fgos.mjs`, the CLI
registry, or any CLI-level test file — ALL CLI wiring for both cells
(including P01's own `--cwd` flag) belongs to P02.** P01 is proven and
tested purely at the engine/dispatch level (`runCoordinationUseCase`
called directly with `ctx.cwd`/`ctx.repoRoot`, never through `bin/fgos.mjs`).
Wave 2 cannot start until both Wave 1 cells are closed and merged, because
the live proof needs a real mutation-capable Doer (P01) driven through
`chain`-verified resume state (P02) simultaneously, AND needs P02's own
`--cwd` CLI flag to actually invoke either.

Wave 1's concurrency is safe only because P02 touches no file under
`src/runner/dispatch/**` — the self-hosted dispatch-hook hazard (see P01's
own Requirements) applies to P01 alone, and P01 runs in its own isolated
worktree regardless of P02's concurrent activity.

## Shared-File Lease Rule

```txt
mutation-core   = src/runner/coordination/session-engine.mjs, src/runner/dispatch/execution-contract.mjs,
                   src/runner/dispatch/assignment-normalizer.mjs, src/runner/dispatch/operation-choice.mjs
                   (read/verify only, see P01 R6c), src/verbs/coordination/schema.mjs
                   (the mutation-allowed assertion only), src/runner/coordination/store.mjs
                   (fgosDir/root resolution only), docs/how-to/run-a-coordination-session.md
                   (the "read-only in V1" sentence only), CHANGELOG.md
chain-surface   = src/verbs/coordination/chain.mjs (new), bin/fgos.mjs (coordination case: --cwd flag,
                   the chain subcommand, and every enumerated-subcommand string), src/cli/command-registry.mjs
                   (coordination verb's chain subcommand entry only), core/protocol-packs/group-thinking.json,
                   test/cli/coordination.test.mjs, CHANGELOG.md
plan-loop-skill = .agents/skills/fgos-plan-loop/** (new), plugins/fgOS/skills/fgos-plan-loop/** (generated mirror,
                   never hand-edited directly — regenerate via `npm run build:skills`),
                   src/verbs/coordination/launch-master-loop.mjs (comment-only correction, see P02 R7)
canonical-docs  = docs/architect/proposals/group-thinking-plan-loop.md, docs/specs/runner.md,
                   docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md (Retirement section only)
```

`CHANGELOG.md`'s `## [Unreleased]` section is touched by BOTH P01 and P02
(each adds its own line) — this is the one intentional, low-risk overlap;
the Coordinator resolves it as a trivial two-line merge conflict when
integrating both cells, not a lease violation.

P01 and P02 each own a disjoint lease for the whole plan — no integration
cell is needed to merge them; the Coordinator merges both cell branches
into the track branch sequentially (order does not matter, files never
collide) and re-runs the full focused regression once after both land,
before opening Wave 2.

## Plan-Level Acceptance

- No file under `src/runner/coordination/**` or `src/verbs/coordination/**`
  gains Work lifecycle authority (`assertNoWorkLifecycleKeys` stays
  unchanged; grep for `approve`/`merge`/`claim`/`workStatus`-shaped keys
  in every new/changed schema file stays empty).
- No `src/runner/coordination/**` code ever calls `git merge`, `git
  commit`, or any Work-state-mutating function — the Lead performs every
  merge itself, outside the session (a Doer/Fixer may commit on its own
  cell branch per Phase 01's own commit-policy decision; only the MERGE
  into the track/main branch is exclusively the Lead's). Prove this with
  a real test — a grep-based check in `test/architecture.test.mjs` if a
  similar "this module never calls X" pattern already exists there
  (Phase 01's own R6b static enumeration test is a natural place to add
  this same style of check), not a prose assertion alone.
- A `mutating` dispatch is refused when `cwd` resolves to the main
  checkout, refused when the bound operation's `result.kind` is not
  `work-product`, and refused when the step itself does not explicitly
  declare `mutation: 'mutating'` — all three refusals proven by a real
  test, not asserted in prose.
- Every existing read-only-role test (reviewer/red-team/consult/
  researcher/advisor dispatch) stays green, unchanged, after the unlock.
- `fgos coordination chain <track>` output is fully reconstructible from
  session event logs alone — no new persisted "plan" object exists
  anywhere in `.fgos/`.
- The live proof (Phase 3) runs on a project other than `forgentX`.
- Per-role provider diversity (`actors[].executor/tier/persona`) is
  exercised for real in the live proof — at least two distinct real
  executors dispatch in the same session.

## Non-Negotiable Deferrals

- No `Mission`/`missionId` or any cross-track grouping primitive.
- No new FlowDefinition/protocol kind — the cell protocol stays
  `standalone-master-coordination-loop`, version unchanged unless Phase 3's
  live proof shows a real, forced need (record as a Gap, do not add
  speculatively).
- No per-actor `model` override channel for declared-protocol requests —
  provider diversity stays expressed via `modelPolicies.<provider>.<tier>`.
- No retirement of `master-coordinator.md` for `forgentX`'s own
  development — it remains the permanent fallback; this plan adds one
  pointer line to its Retirement section and nothing more.
- No change to `core/coordination-protocols/group-cognition-framework.yaml`
  (never, this rule outlives every track).
- No autonomous in-graph coordinator, judge, or leader — the Lead never
  becomes a graph actor.
- No live proof against `forgentX` itself.

## Master Coordination Contract

Use the [Master Multi-Agent Implementation Coordinator](../../docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md)
as an external implementation coordinator for THIS plan (the irony of using
the manual prompt to build the manual prompt's own native successor is
intentional and acceptable — this plan's own product is not yet built, so
nothing native exists yet to coordinate with).

For every dispatch wave the coordinator must:

1. Read live repo/session state before trusting worker narration.
2. Dispatch only ready cells and name their exclusive write scopes (the
   Shared-File Lease Rule above).
3. Keep Reviewer and Red-Team first passes isolated, in parallel, per
   `master-coordinator.md`'s own Parallelism Policy.
4. Require each worker to return changed paths, tests, evidence refs, and
   whether it touched a shared lease.
5. Run the focused test command after each cell closes and the full
   suite once after Wave 1 fully closes and again after Wave 2 closes.
6. Record driver disposition on every finding before authorizing a fix
   round.
7. P01 (kernel-touching) gets the SAME rigor this repo's own
   `step-09-mvp6-to-mvp9` track required for every kernel change:
   independent Reviewer + Red-Team, disposition, fix rounds until both
   independently return APPROVE — do not shortcut this because the diff
   is small.
8. Use isolated worktrees for both Wave 1 cells (they run concurrently;
   a shared checkout must never have concurrent source writers, per this
   repo's own established rule).

## Execution Inputs

```text
REPO_ROOT: /home/vantt/projects/forgentX
PLAN_DIR: /home/vantt/projects/forgentX/plans/260904-2329-group-thinking-plan-loop
TRACK: group-thinking-plan-loop
BRANCH: group-thinking-plan-loop
BASE_REF: infer once at execution start (current main HEAD) and persist it
MAX_PARALLEL_CELLS: 2
Test command: FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
Focused command (Wave 1): FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs'
  'test/runner/dispatch-*.test.mjs' 'test/runner/assignment-dispatch.test.mjs'
  'test/architecture.test.mjs' 'test/cli/coordination.test.mjs'
```

The implementation owner must derive any additional focused test globs
from the actual files touched after P01/P02 open. Do not use fgOS skills,
fgos-runner, Work items, or claims to coordinate this plan's own
execution — `forgentX` is the system under test for Phase 1/2; Phase 3's
live proof runs entirely on a separate host project.
