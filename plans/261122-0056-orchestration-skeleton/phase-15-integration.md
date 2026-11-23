# Phase 15: Integration

Decisions: SR-D10 (integration phase), L5 (definition of done), OS-D6 and the component-authority constraint (declare
before code), design principle 7 (generated text regenerated from source).

## Inputs

- `plan.md` (acceptance criteria, "New things" table), every phase file of this plan.
- `docs/platform/supervision/spec.md` (its header still says "Spec only… every verb below is planned"; stale),
  `docs/platform/questions/spec.md`, `docs/platform/workflow/spec.md`, `docs/platform/resource-referee/spec.md`,
  `docs/platform/runner/spec.md`, `docs/platform/runner/contracts/routing-handoff.md`,
  `docs/platform/session-host/spec.md`.
- `CHANGELOG.md` `## [Unreleased]`.

## Footprint

`docs/platform/supervision/spec.md`, `docs/platform/questions/spec.md`, `docs/platform/workflow/spec.md`,
`docs/platform/resource-referee/spec.md`, `docs/platform/runner/spec.md`,
`docs/platform/runner/contracts/routing-handoff.md`, `docs/platform/session-host/spec.md`, `CHANGELOG.md`,
`.agents/skills/`, `plugins/fgOS/skills/`,
`.claude/skills/`, `plans/261122-0056-orchestration-skeleton/`.

## Steps

1. Merge the phase branches in wave order on one integration tree.
2. Specs: supervision (fix the header; add the keeper, scheduling records, sources, sleep, review, wake reasons, the
   signal route), questions (recipients, notifier port, external answers), workflow (frame intent, takeover check,
   records verb), resource referee (`resource` space), runner (tool job invocation, lead refusal outside a case),
   routing-handoff (handoff closes one record and opens the next; reason `sleep`), session host (the sleep fields of
   the head record, `session stop --reason sleep`, `fgos session list`, wake resume or fresh, D1 to D3 of
   `ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads` in its decision history). Record the settled facts and the decisions of
   plan.md "Decided here" in each owning spec's decision history.
3. `npm run build:skills` to regenerate the skill surfaces from the supervisor and lead sources.
4. Declare each row of plan.md "New things" with `fgos authority declare` if the verb exists on main; otherwise note in
   plan.md that the table is the record for plan `261121-2110-component-authority-doors`.
5. `CHANGELOG.md` `[Unreleased]`: admission in code, wake reasons, signal route, question recipients, tool jobs,
   periodic review, scheduling records read, lead refusal outside a case, `wave` optional, sleeping leads keep their
   worktree and resume, `fgos session list`.
6. Set the phase table and plan status to `done`.

## Verify

`npm test` and `cargo test --workspace` green on the integration tree; `node scripts/plan-contract-check.mjs --plan
plans/261122-0056-orchestration-skeleton` exits 0; `npm run build:skills -- --check` (or the repo's freshness check)
clean; every acceptance criterion of plan.md has its named test passing.

## Rollback

Revert the integration commit; phase commits stay individually revertible.
