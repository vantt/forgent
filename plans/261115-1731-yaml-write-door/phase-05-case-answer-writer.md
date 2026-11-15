# Phase 05: a workflow gate's answer file writes its frontmatter through the door

Start after: 02 landed on the integration branch. Parallel with 03, 04, 06, 07, 08. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F3 row 3, F6. Worktree `ywd-p05`, report slug `ywd-p05-case-answer`. Effort: 0.5h.

## Context

`renderAnswerFile` (`src/workflow/case-runtime.mjs:185-221`) writes the answer view of a human gate; its frontmatter
(`:197-203`) is four hand-joined lines. The view is regenerated from the rounds and no parser reads it. Values keep their
current meaning (RUL104, no behaviour change): `approved` is the string `yes`/`no`, `subjectDigest` is the string `none`
when the round has none.

## Requirements

- `renderAnswerFile` returns `writeFrontmatter({ approved: latest.approved ? 'yes' : 'no', occurrence: latest.occurrence, round: latest.round, subjectDigest: latest.subjectDigest ?? 'none' }, ['', `# Owner's answer ...`, ...].join('\n'), file)`;
  the body array is today's array from the blank line after the fence. Pass the answer file path for refusals
  (`renderGateAnswerFile` has it; add it as an argument).
- `src/workflow/case-runtime.mjs` imports `writeFrontmatter` from `../util/yaml.mjs` (allowed: `src/util` is tier 0 kernel;
  the file's own guard forbids only `src/state/**` and `src/runner/coordination/**`, `:2`).
- Owning proof: `test/workflow/case-runtime.test.mjs:44` keeps its byte regex (bytes are unchanged, F3) and gains
  `readFrontmatter(text).meta` deep-equal `{ approved: 'yes', occurrence: 1, round: 1, subjectDigest: 'sha256:copy' }`
  in the same test.

## Files

- Modify: `src/workflow/case-runtime.mjs`, `test/workflow/case-runtime.test.mjs` (one assertion).
- Create/Delete: none. Tests retired: none.
- Net size: about -6 / +3 lines.

## Steps

1. Add the assertion (passes today), change the writer.
2. `node scripts/run-tests.mjs test/workflow/case-runtime.test.mjs test/cli/fgos-case-doors.test.mjs` plus the
   `rg -l "case-runtime" test` list.
3. Gates in phase-lead-rules.

## Acceptance

- No `'---'` literal left in `src/workflow/case-runtime.mjs`; tests green; answer bytes unchanged (the regex at `:44`).

## Risks / rollback

- A caller of `renderAnswerFile` outside the file (L x L): it is not exported (`rg -n "renderAnswerFile" src test` before
  editing). Revert the commit.
