# Phase 4: A malformed plan is refused at commit and first at land

## Why

On 2026-11-27 a plan that broke the contract (no `created`, a short `base`, no backlog id in `source`) reached a land
and failed only at the last gate, after the tests, wasting a whole land attempt. The plan check existed; nothing ran
it before the commit, and land ran it last.

## Requirements

- The pre-commit hook runs `scripts/plan-contract-check.mjs` (the one beside the hook) on every plan whose `plan.md` or
  phase file the commit stages, and refuses the commit on its ERROR lines. WARN lines do not refuse.
- The plan contract gate is the first land gate in `.fgos/config.yaml`.

## Files

`.githooks/pre-commit` (`planContractRefusal`), `test/githooks/plan-contract.test.mjs`, `.fgos/config.yaml`.

## Result (2026-11-27)

Done. The hook test fails without the hook change: a broken staged plan is refused naming its ERROR, and a commit
staging no plan file is not judged.
