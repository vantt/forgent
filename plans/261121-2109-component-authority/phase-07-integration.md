# Phase 7: Integration

## Inputs
The landed branches of phases 1-6; `plan.md` acceptance criteria.

## Files it may write
plans/261121-2109-component-authority/ (log and reports only). A gate failure is fixed in the owning phase's branch, never here.

## Steps
1. On the combined tree, run `npm test` and `cargo test --workspace`.
2. Run `node scripts/component-authority-render.mjs --check`.
3. Run each acceptance-criterion command and record its output in `reports/`.
4. Run `node scripts/plan-contract-check.mjs --plan plans/261121-2109-component-authority`.
5. Set the plan status to `done`, and wake the sibling plan's planner or supervisor so it re-reads its blockers.

## Verify
Every acceptance criterion's check passes, and `npm test` and `cargo test --workspace` are green.

## Rollback
None of its own. Revert the phases in reverse wave order.
