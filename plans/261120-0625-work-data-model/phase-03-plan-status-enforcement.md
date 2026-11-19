# Phase 3: Plan statuses held to plan-v1 enum and strict contract check

## Inputs
- Settled discussion `docs/discussions/work-data-model/DISCUSSION.md` §6, §7 `#task-plan-status`, D-ADR0082.
- `core/skills/_shared/plan-contract.md` and `scripts/plan-contract-check.mjs`.

## Files it may write
- `scripts/plan-contract-check.mjs`
- `test/scripts/plan-contract-check.test.mjs`
- Legacy plan files under `plans/**/plan.md` requiring frontmatter status migration.

## Steps
1. Migrate legacy statuses across existing `plans/*/plan.md` by applying the plan-v1 mapping:
   - `pending`, `proposed` -> `draft`
   - `todo`, `approved` -> `ready`
   - `in-progress` -> `running`
   - `completed`, `complete`, `landed`, `done` -> `done`
   - `cancelled`, `archived` -> `withdrawn`
   - Handle the two legacy plans marked `partial` and `deferred` per owner decision.
2. Add `contract: plan-v1` marker where missing on migrated plans.
3. Update `scripts/plan-contract-check.mjs`:
   - Change legacy status warning to hard error when running `node scripts/plan-contract-check.mjs --all`.
   - Require `source:` frontmatter field for new contract plans (citing at least one backlog `p-` id).
4. Update tests in `test/scripts/plan-contract-check.test.mjs` to verify that unknown statuses and legacy statuses fail.

## Verify
`node scripts/plan-contract-check.mjs --all` exits 0; `node --test test/scripts/plan-contract-check.test.mjs` passes.

## Rollback
Revert the commit; plan contract check reverts to warning legacy statuses.
