# Phase 15: Integration of the players plan

Depends on phases 2, 6, 7, 8, 11, 12, 13, 14 and 17. Since the 2026-11-25 split this phase integrates only the
players plan. The keeper plan's phases are integrated by its own phase 18. Decisions: SR-D10 (integration phase),
L5 (definition of done), the component-authority constraint (declare before code), design principle 7 (generated
text is regenerated from its source).

## Inputs

- `plan.md` (acceptance criteria, "Decided here", "Authority map") and every phase file of this plan.
- `docs/platform/supervision/spec.md`, `docs/platform/questions/spec.md`, `docs/platform/workflow/spec.md`,
  `docs/platform/runner/spec.md`, `docs/platform/runner/contracts/routing-handoff.md`,
  `docs/platform/session-host/spec.md`, each as the keeper plan's phase 18 left it.
- `CHANGELOG.md` `## [Unreleased]`.

## Footprint

`docs/platform/supervision/spec.md`, `docs/platform/questions/spec.md`, `docs/platform/workflow/spec.md`,
`docs/platform/runner/spec.md`, `docs/platform/runner/contracts/routing-handoff.md`,
`docs/platform/session-host/spec.md`, `CHANGELOG.md`, `.agents/skills/`, `plugins/fgOS/skills/`, `.claude/skills/`,
`plans/261125-1125-orchestration-skeleton-players/`.

## Steps

1. Merge the phase branches in wave order on one integration tree.
2. Update the specs:
   - supervision: wake reasons, the signal route, the keeper's sleep and wake, handoff records and the records read
     port;
   - questions: external answers through the signed route;
   - workflow: frame intent and the takeover check;
   - runner: tool job invocation and the lead's refusal outside a case;
   - routing-handoff: a handoff closes one record and opens the next, with reason `sleep`;
   - session host: wake resume or fresh start, and D1 and D3 of
     `ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads` in its decision history.

   Record the plan's "Decided here" rows in each owning spec's decision history.
3. Run `npm run build:skills` to regenerate the skill surfaces from the supervisor and lead sources.
4. For each row of the plan's "Authority map" that `fgos authority locate` does not already return, record it with
   `fgos authority declare`. A new component or decision kind needs an owner question first (`--approved-by`).
5. Add to `CHANGELOG.md` `[Unreleased]`: wake reasons, the signal route, tool jobs, the scheduling records read
   port, the lead's refusal outside a case, optional `wave`, and sleeping leads that keep their worktree and resume.
6. Set the phase table and the plan status to `done`.

## Verify

`npm test` and `cargo test --workspace` are green on the integration tree.
`node scripts/plan-contract-check.mjs --plan plans/261125-1125-orchestration-skeleton-players` exits 0. The skill
freshness check (`npm run build:skills -- --check` or the repo's equivalent) is clean. Every acceptance criterion
of plan.md has its named test passing.

## Rollback

Revert the integration commit. The phase commits stay individually revertible.
