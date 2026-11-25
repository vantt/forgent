# Phase 13: Contract check at takeover; frame intent

Backlog `p-f367pplkhu`. Decisions: OS-D21 (1) (a foreign plan that breaks the contract is refused with a reason) and
(2) (mapping at execution; the approved frame), workflow spec §2.2 (a frame carries intended outcome and non-goals).
The planner decided the frame copies the plan's Outcome and Non-goals (plan.md "Decided here").

## Inputs

- `scripts/plan-contract-check.mjs` after phase 12; `src/portfolio/plan-sections.mjs` (its section reader).
- `src/workflow/propose.mjs`, `propose-validate.mjs` (refusals `plan-missing`, `write-overlap`, `slice-cycle`,
  `guide-activity-missing`), `propose-frame.mjs`, `case-frame.mjs`.
- `docs/platform/workflow/spec.md` §2.2, §7.8.

## Footprint

`src/portfolio/plan-contract.mjs` (new), `scripts/plan-contract-check.mjs`, `src/workflow/propose.mjs`,
`src/workflow/propose-validate.mjs`, `src/workflow/propose-frame.mjs`, `src/workflow/case-frame.mjs`,
`test/workflow/propose.test.mjs`, `test/workflow/propose-frame.test.mjs`, `test/portfolio/plan-contract.test.mjs` (new).

## Steps

1. Move the check's rule logic into `src/portfolio/plan-contract.mjs` (one door); `scripts/plan-contract-check.mjs`
   becomes a thin CLI over it. Move the owning tests of the rules with the logic; the script test keeps one wiring
   proof.
2. `fgos workflow propose --plan <dir>` runs that check before slicing. A failure refuses with code
   `plan-contract-broken`, the broken rule, and what the plan must change, in words a foreign planner can act on.
3. `propose-frame` returns `intent: { outcome, nonGoals }` read from the plan's Outcome and Non-goals sections;
   `case-frame` includes it in the frame digest the owner approves and shows it in the approval question.

## Verify

`node --test test/portfolio/plan-contract.test.mjs test/workflow/propose.test.mjs test/workflow/propose-frame.test.mjs
test/scripts/plan-contract-check.test.mjs`. Pass: propose on a plan missing its Non-goals section refuses with
`plan-contract-broken` naming the section; a valid plan proposes a frame whose `intent` equals its sections; changing
the Outcome text changes the frame digest.

## Rollback

Revert the phase commit; propose returns to the counters-only frame.
