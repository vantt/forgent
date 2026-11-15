# Phase 04: the decisions index writes its frontmatter through the door

Start after: 02 landed on the integration branch. Parallel with 03, 05, 06, 07, 08. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F3 row 2, F6. Worktree `ywd-p04`, report slug `ywd-p04-decision-index`. Effort: 0.5h.

## Context

`buildDecisionIndexMarkdown` (`src/report/decision-index.mjs:96-101`) opens its `lines` array with five hand-written
frontmatter lines. Output: the committed `docs/decisions/index.md`, checked by `fgos decision-index --check`. The emitter
renders the three keys identically (F3).

## Requirements

- Drop the five fence/key lines from `lines`; return
  `writeFrontmatter({ type: 'explanation', title: 'Decisions index', generated: true }, lines.join('\n'), 'docs/decisions/index.md')`
  where `lines` now starts with `''` (the blank line after the closing fence today). Keep the function's JSDoc paragraph on
  why `type: explanation` is there.
- No test change. Owning drift proof of the committed index: `test/scripts/doc-health.test.mjs:150-154` ("the committed
  decisions index is a fixpoint of the generator over its own rows") compares the rebuilt text with
  `docs/decisions/index.md` byte for byte; it must stay green. That matters beyond the file: `readDecisionIds`
  (`src/setup/instruction-registry.mjs:95-107`) returns an empty set silently when the bytes differ.
- Consumers (now need the addon): `src/report/decision-index.mjs:135` (`computeDecisionIndex`), `bin/fgos.mjs:40` import
  (`fgos decision-index`), `src/setup/instruction-registry.mjs:106` (outside the `try` that guards `listWork`). Each already
  needs the addon: `instruction-registry.mjs:17` imports `parseYaml` and `cutFrontmatter` and calls them on the same path.
  A refusal from `writeFrontmatter` here is impossible for the literal meta; no new handling.

## Files

- Modify: `src/report/decision-index.mjs`, `packages/git/contracts/mutation-census.v1.json` (regenerated).
- Create/Delete: none. Tests retired: none. `docs/decisions/index.md`: must stay byte-identical.
- Net size: about -5 / +3 lines.

## Steps

1. Change the writer.
2. `node scripts/run-tests.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs test/report/decision-index.test.mjs test/report/enduser-index.test.mjs test/setup/instruction-registry.test.mjs`
   plus the `rg -l "decision-index" test` list; `npm run fgos:dev -- decision-index --check` exits 0.
3. Gates in phase-lead-rules.

## Acceptance

- No `'---'` literal left in `src/report/decision-index.mjs`; `--check` clean; tests green.

## Risks / rollback

- Byte drift (L x M): `--check` and the existing pure cases catch it. Revert the commit.
