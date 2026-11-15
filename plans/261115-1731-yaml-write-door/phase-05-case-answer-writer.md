# Phase 05: a workflow gate's answer file writes its frontmatter through the door

Start after: 02 landed on the integration branch. Parallel with 03, 04, 06, 07, 08. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F3 row 3, F6. Worktree `ywd-p05`, report slug `ywd-p05-case-answer`. Effort: 1h.

## Context

`renderAnswerFile` (`src/workflow/case-runtime.mjs:185-221`) writes the answer view of a human gate; its frontmatter
(`:197-203`) is four hand-joined lines. The view is regenerated from the rounds and no parser reads it ("A view: deleting
it loses nothing", `:184`). Its input is untrusted: `roundsOf` (`:152-158`) returns every JSON file in the gate's inbox,
including ones `refusalOfRound` (`:169-176`) would refuse, and `latest = rounds.at(-1)`. The render runs after durable
writes: `:271-272` after `installOnce` recorded the round, `:349` after the drain appended `gate.answer` events. Today a
missing or odd field is interpolated as text (`undefined`, `[object Object]`) and nothing throws. The view must stay
non-throwing for such input, or one bad inbox file wedges the gate's drain after the ledger changed.

Values keep their current meaning (RUL104): `approved` is the string `yes`/`no`, `subjectDigest` the string `none` when
the round has none.

## Requirements

- Build the meta by coercion so it is always JSON-plain and round-trips, matching today's text for well-formed rounds:
  `approved: latest.approved ? 'yes' : 'no'`; `occurrence` and `round`: the value when `Number.isInteger`, else
  `String(value)` (today's interpolation); `subjectDigest`: `latest.subjectDigest ?? 'none'` when a string or null/undefined,
  else `String(...)`.
- `renderAnswerFile` returns `writeFrontmatter(meta, ['', `# Owner's answer ...`, ...].join('\n'), file)`; the body array is
  today's array from the blank line after the fence. Pass the answer file path in from `renderGateAnswerFile` (it has it, `:224`).
- Remaining refusals after coercion are crate limits only (a string over the profile's size bound). They propagate by
  name; record that in the JSDoc of `renderAnswerFile`. No catch-and-hide.
- `src/workflow/case-runtime.mjs` imports `writeFrontmatter` from `../util/yaml.mjs` (`src/util` is tier 0 kernel; the
  file's own guard forbids only `src/state/**` and `src/runner/coordination/**`, `:2`).

## Proofs

- `test/workflow/case-runtime.test.mjs:44` keeps its byte regex (bytes unchanged for a well-formed round, F3). No
  read-back assertion (02's per-call check owns that).
- One new case in the same file, owning the behaviour "a malformed round file in the inbox does not break the answer view":
  plant a round file without `occurrence` and with an object `subjectDigest` beside a good one (the fixture helper at
  `:319` already plants files), run the drain, assert it returns and the view file exists and reads back through
  `readFrontmatter`. Why new: no test plants a malformed round next to a good one and renders.

## Files

- Modify: `src/workflow/case-runtime.mjs`, `test/workflow/case-runtime.test.mjs` (one case),
  `packages/git/contracts/mutation-census.v1.json` (regenerated).
- Create/Delete: none. Tests retired: none.
- Net size: about -6 / +10 lines code, +15 test lines.

## Steps

1. Red: the malformed-round case. On today's code it passes (text interpolation); make it red by first switching the
   writer to `writeFrontmatter` without coercion (the case throws `frontmatter-not-round-trip`), commit that red pair, push.
2. Add the coercion; green.
3. `node scripts/run-tests.mjs test/workflow/case-runtime.test.mjs test/cli/fgos-case-doors.test.mjs test/setup/git-mutation-census.test.mjs`
   plus the `rg -l "case-runtime" test` list.
4. Gates in phase-lead-rules.

## Acceptance

- No `'---'` literal left in `src/workflow/case-runtime.mjs`; the regex at `:44` and the malformed-round case green.

## Risks / rollback

- `renderAnswerFile` called elsewhere (L x L): not exported; callers are `:227` only. Revert the commits; regenerate the census.
