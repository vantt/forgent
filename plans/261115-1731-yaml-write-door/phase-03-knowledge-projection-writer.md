# Phase 03: the knowledge registry projection writes its frontmatter through the door

Start after: 02 landed on the integration branch. Parallel with 04, 05, 06, 07, 08. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F3 row 1, F6. Worktree `ywd-p03`, report slug `ywd-p03-knowledge-projection`. Effort: 0.5h.

## Context

`computeKnowledgeProjection` (`src/report/knowledge-projection.mjs:17-24`) starts its Markdown with a hand-written
`---\ngenerated: true\n---\n` template. Its output is the committed `docs/doc-registry.md`, compared byte for byte by
`fgos doc-registry --check` (`bin/fgos.mjs:1531-1543`). The emitter renders `generated: true` identically (F3), so the
committed file must not change.

## Requirements

- `md` starts as `writeFrontmatter({ generated: true }, '# Knowledge Registry Index\n\n> **WARNING**: ... overwritten.\n\n', 'docs/doc-registry.md')`
  (body text exactly as today); import `writeFrontmatter` from `../util/yaml.mjs`. Nothing else in the function changes.
- No test change. `writeFrontmatter` checks on every call that the block reads back to the meta (phase 02), and the meta
  here is a literal, so a per-writer read-back assertion would repeat that proof (design principle 8). The existing
  `test/report/knowledge-lints.test.mjs:42` stays as is.
- Consumers (the projection now needs the addon): `bin/fgos.mjs:1531` (`fgos doc-registry`, already loads the native door
  through its YAML and state reads); `test/report/knowledge-lints.test.mjs`. No setup or doctor path calls it.
- Drift proof for the committed `docs/doc-registry.md`: no test compares it today; the gate is `fgos doc-registry --check`
  (step 2), recorded in the report.

## Files

- Modify: `src/report/knowledge-projection.mjs`, `packages/git/contracts/mutation-census.v1.json` (regenerated).
- Create/Delete: none. Tests retired: none. `docs/doc-registry.md`: must stay byte-identical (if it differs, stop and report).
- Net size: about -6 / +2 lines; no test lines.

## Steps

1. Change the writer.
2. `node scripts/run-tests.mjs test/report/knowledge-lints.test.mjs` plus `test/setup/git-mutation-census.test.mjs` and tests that `rg -l "knowledge-projection|computeKnowledgeProjection|doc-registry" test` lists;
   `npm run fgos:dev -- doc-registry --check` from the worktree root exits 0 (no drift).
3. Gates in phase-lead-rules.

## Acceptance

- `rg -n "\`---" src/report/knowledge-projection.mjs` finds nothing; `doc-registry --check` clean; tests green.

## Risks / rollback

- Byte drift in the committed projection (L x M): `--check` catches it; the expected bytes are identical. Revert the commit.
