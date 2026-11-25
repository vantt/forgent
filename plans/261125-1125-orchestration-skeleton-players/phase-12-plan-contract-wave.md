# Phase 12: General plan contract, wave optional

Decision: OS-D21 (1): a plan, from fgOS or another system, follows only the general contract (outcome, phases,
dependencies, footprint, done criteria, status); `wave` is derivable. The planner decided `wave` becomes optional and
computed (plan.md "Decided here").

## Inputs

- `core/skills/_shared/plan-contract.md` §3, §4.
- `scripts/plan-contract-check.mjs` (wave rules around lines 119 to 164).
- `test/scripts/plan-contract-check.test.mjs`.

## Footprint

`core/skills/_shared/plan-contract.md`, `scripts/plan-contract-check.mjs`, `test/scripts/plan-contract-check.test.mjs`.

## Steps

1. In the check, accept a phase table without a `wave` column, or a row with an empty wave. Compute the missing wave:
   one more than the highest wave among its dependencies (1 when none), then pushed one later while its footprint
   overlaps a row earlier in table order that holds the same wave. Report computed waves in the check output.
2. When a wave is written, keep every rule as today (later than dependencies, no same-wave overlap).
3. In `plan-contract.md`, mark `wave` optional in the column list, state the computing rule in one sentence, and keep
   the parallel-work guidance (waves are still how a lead runs phases).

## Verify

`node --test test/scripts/plan-contract-check.test.mjs`. Pass: a table without waves passes and gets the computed
waves; a table whose written wave breaks a dependency still fails; `node scripts/plan-contract-check.mjs --all`
reports no new errors on existing plans.

## Rollback

Revert the phase commit; tables with waves never depended on the change.
