# Phase 5: Integration: changelog and full gate

Capability: `code:test`. Wave 4, after phases 1 to 4.

## Inputs

- The plan's acceptance criteria (`plan.md`).
- `CHANGELOG.md` `## [Unreleased]`.

## Files it may write

`CHANGELOG.md`, `plans/261122-1950-owner-communication-standard/reports/**`.

## Steps

1. Add two lines under `## [Unreleased]`: the communication standard replaces the decision-question template for
   every agent, with an `owner-communication` friction layer; owner questions carry a stated default, show
   lettered options and accept a letter as the answer.
2. On the combined tree, run every acceptance criterion's command in order.
3. Write the result per criterion into a report named with `fgos convention path --kind report` under the plan's
   `reports/`.

## Verify

```bash
git grep -n -e "_shared/decision-question" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md'
npm run build:skills && git status --porcelain
npm test
cargo test --workspace
```

Pass: the grep prints nothing, the tree is clean after the rebuild, and both suites are green.

## Rollback

`git revert` the phase commit; it touches only the changelog and the report.
