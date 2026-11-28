# Phase 5: Integration: changelog fragment and full gate

Capability: `code:test`. Wave 4, after phases 1 to 4.

## Inputs

- The plan's acceptance criteria (`plan.md`).
- `changelog.d/README.md`: the fragment scheme (never edit `CHANGELOG.md` directly).

## Files it may write

`changelog.d/261122-1950-owner-communication-standard.md`, `plans/261122-1950-owner-communication-standard/reports/**`.

## Steps

1. Merge the phase branches into one integration worktree (the lead's land flow).
2. Write `changelog.d/261122-1950-owner-communication-standard.md` with two bullets:
   - `- Changed: every agent loads one communication standard (tiêu chuẩn giao tiếp) for asking, reporting and presenting to the owner; it replaces the decision-question template, and an agent whose message fell short records a friction under the new owner-communication layer.`
   - `- Added: owner questions state what happens if no answer comes (parts.default), show their options lettered A to D with the recommended one first, and accept the letter as the answer.`
3. On the combined tree, run every acceptance criterion's command in order, then the full gate as the host step:
   `fgos release check --worktree <integrated worktree>`.
4. Write the result per criterion into a report named with `fgos convention path --kind report` under the plan's
   `reports/`.

## Verify

```bash
git grep -n -e "_shared/decision-question" -e "decision-question.md" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md' ':!changelog.d' ':!packages/agent-start-context/goldens/NOTES.md'
npm run build:skills && node scripts/project-agents.mjs && git status --porcelain
fgos release check --worktree <integrated worktree>
```

Pass: the grep prints nothing, the tree is clean after the rebuild, and the release check is green (it runs
`npm test` and `cargo test --workspace`).

## Rollback

`git revert` the phase commit; it touches only the changelog fragment and the report.
