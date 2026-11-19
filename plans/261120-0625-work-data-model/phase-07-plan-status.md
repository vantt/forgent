# Phase 7: Plan statuses held to plan-v1

## Inputs
- Phase 6 landed.
- Section 7 anchor `#task-plan-status` of `docs/discussions/work-data-model/DISCUSSION.md`, decision D-ADR0082.
- Backlog row `p-xmpheuduez`.
- Owner question `q-x3ata7iuej` answered in the question store.
- `core/skills/_shared/plan-contract.md` and `scripts/plan-contract-check.mjs`.

## Files it may write
- `scripts/plan-contract-check.mjs`
- `test/scripts/plan-contract-check.test.mjs`
- `plans/261006-1408-advisory-capability-completion/plan.md`
- `plans/261007-1800-observe-overdue-run-signal-deferred/plan.md`

## Steps
1. Migrate legacy statuses across existing `plans/*/plan.md` by applying the plan-v1 mapping:
   - `pending`, `proposed` -> `draft`
   - `todo`, `approved` -> `ready`
   - `in-progress` -> `running`
   - `completed`, `complete`, `landed`, `done` -> `done`
   - `cancelled`, `archived` -> `withdrawn`
   - Migrate `plans/261006-1408-advisory-capability-completion/plan.md` (`partial`) and `plans/261007-1800-observe-overdue-run-signal-deferred/plan.md` (`deferred`) according to owner decision `q-x3ata7iuej`.
2. Add `contract: plan-v1` marker where missing on migrated plans.
3. Update `scripts/plan-contract-check.mjs`:
   - Change legacy status warning to hard error when running `node scripts/plan-contract-check.mjs --all`.
   - Require `source:` frontmatter field for new contract plans (citing at least one backlog `p-` id).
4. Update tests in `test/scripts/plan-contract-check.test.mjs` to verify that unknown statuses and legacy statuses fail.

## Verify
`node scripts/plan-contract-check.mjs --all` exits 0; `node --test test/scripts/plan-contract-check.test.mjs` passes.

## Rollback
Revert the commit; plan contract check reverts to warning legacy statuses.
