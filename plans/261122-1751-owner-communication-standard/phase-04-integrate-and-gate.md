# Phase 4: Integrate and run the full gate

Capability: `code:test`. Wave 3. Depends on phases 2 and 3.

## Inputs

- The landed commits of phases 1, 2 and 3 on `main`.
- `plan.md` acceptance criteria 1 to 7.

## Files it may write (footprint)

`CHANGELOG.md` only.

## Steps

1. Confirm phases 1 to 3 are on `main` (`git log --oneline` shows their commits).
2. Add under `## [Unreleased]` in `CHANGELOG.md`: the communication standard ("tiêu chuẩn giao tiếp") replaces the decision-question
   template for every agent; a new friction layer `owner-communication`; the `owner-reaction` prompt hook for Claude
   Code (installed on the next `fgos setup`); owner questions now show lettered options, accept a letter as an answer
   and need a stated default.
3. Run every acceptance criterion's command on the combined tree, then the full gate.

## Verify

```bash
git grep -n -e "_shared/decision-question" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md'   # prints nothing
npm run build:skills && git status --porcelain .agents plugins                                                 # prints nothing
npm test
cargo test --workspace
node scripts/plan-contract-check.mjs --plan plans/261122-1751-owner-communication-standard
```

Pass: both checks print nothing and every command exits 0.

## Rollback

`git revert` of the CHANGELOG commit. A failure in the gate is fixed in the phase that owns the failing file, not
here.
