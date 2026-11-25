# Phase 18: Integration of the keeper plan

Depends on phases 1, 3, 4, 5, 9, 10 and 16. Added on 2026-11-25, when the plan was split: the players plan
`261125-1125-orchestration-skeleton-players` keeps the original integration phase 15 for its own phases.
Decisions: SR-D10 (integration phase), L5 (definition of done), the component-authority constraint (declare before
code), design principle 7 (generated text is regenerated from its source).

## Inputs

- `plan.md` (acceptance criteria, "Decided here", "Authority map") and every phase file of this plan.
- `docs/platform/supervision/spec.md` (check whether its header still says "Spec only… every verb below is
  planned"), `docs/platform/questions/spec.md`, `docs/platform/workflow/spec.md`,
  `docs/platform/resource-referee/spec.md`, `docs/platform/session-host/spec.md`.
- `CHANGELOG.md` `## [Unreleased]`.
- `fgos authority declare --help` and `fgos authority locate`.

## Footprint

`docs/platform/supervision/spec.md`, `docs/platform/questions/spec.md`, `docs/platform/workflow/spec.md`,
`docs/platform/resource-referee/spec.md`, `docs/platform/session-host/spec.md`, `CHANGELOG.md`, `.agents/skills/`,
`plugins/fgOS/skills/`, `.claude/skills/`, `plans/261122-0056-orchestration-skeleton/`.

## Steps

1. Merge the phase branches in wave order on one integration tree.
2. Update the specs. Supervision: fix the header if it is stale, and add admission in code, the keeper, scheduling
   records, sources and the periodic review. Questions: recipients, the notifier port and verified external answers.
   Workflow: the `fgos workflow records` verb. Resource referee: the `resource` space. Session host: the sleep fields
   of the head record, `session stop --reason sleep`, `fgos session list`, and D2 of
   `ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads` in its decision history. Record the plan's "Decided
   here" rows in each owning spec's decision history.
3. Run `npm run build:skills` to regenerate the skill surfaces from the supervisor skill source.
4. For each row of the plan's "Authority map" that `fgos authority locate` does not already return, record it with
   `fgos authority declare`. A new component or decision kind needs an owner question first (`--approved-by`). None
   is expected, because every row lands under an existing component.
5. Add to `CHANGELOG.md` `[Unreleased]`: admission in code, the keeper and scheduling records, question recipients,
   resource claims, periodic review, sleep records and `fgos session list`.
6. Set the phase table and the plan status to `done`.

## Verify

`npm test` and `cargo test --workspace` are green on the integration tree.
`node scripts/plan-contract-check.mjs --plan plans/261122-0056-orchestration-skeleton` exits 0. The skill
freshness check (`npm run build:skills -- --check` or the repo's equivalent) is clean. Every acceptance criterion
of plan.md has its named test passing.

## Rollback

Revert the integration commit. The phase commits stay individually revertible.
