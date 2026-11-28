# Phase 4: Skills that ask questions fill the default

Capability: `code:implement`. Wave 3, after phases 1 and 3.

## Inputs

- The standard written in phase 1: `core/skills/_shared/owner-communication.md`, Part B point 8.
- The field added in phase 3: `parts.default` in `packages/questions/contracts/questions-input.v1.json`.
- The skills that show or ask owner questions: `git grep -l "questions ask" core/skills domains/*/skills`.

## Files it may write

`core/skills/_shared/owner-communication.md`, `core/skills/_shared/plan-contract.md`,
`core/skills/fgos-lead/SKILL.md`, `core/skills/fgos-supervisor/SKILL.md`, `core/skills/fgos-shaping/SKILL.md`,
`core/skills/fgos-secretary/SKILL.md`, `domains/coding/skills/fgos-coding-shaping/SKILL.md`,
`domains/coding/skills/fgos-coding-planning/SKILL.md`, and the generated surfaces
`packages/git/contracts/mutation-census.v1.json`, `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`.

## Steps

1. In the standard's decision-question application, name the field: "`fgos questions ask` requires
   `parts.default` whenever options are given".
2. In each skill that asks with `fgos questions ask`, add `default` to any example input and one sentence that
   the default says what the asker does, and when, if no answer comes.
3. In `fgos-secretary`, where it shows owner questions, say they are shown with lettered options, recommended
   first, and the default, and that the owner may answer with the letter alone.
4. Rebuild with `npm run build:skills` and regenerate the mutation census through `scripts/git-one-door-scan.mjs`.

## Verify

```bash
git grep -n "questions ask" core/skills domains/*/skills   # every hit's example carries default
npm run build:skills && git status --porcelain -- .agents plugins .claude   # empty
node --test test/setup/git-mutation-census.test.mjs
npm test
```

Pass: every example carries the field, the rebuild leaves no diff, and `npm test` is green.

## Rollback

`git revert` the phase commit.
