# Phase 8: Cutover; skills ask through the verb

## Inputs
- `plan.md`, decisions QP-13 and OQ-D7.
- Every open owner question on disk, found by
  `rg -n "\| *open *\|" docs/discussions/*/QUESTIONS.md` and by reading the "Owner questions" section of every
  `status: draft` plan.
- The skills to change:
  - `core/skills/fgos-shaping/**`
  - `domains/coding/skills/fgos-coding-shaping/**`
  - `domains/coding/skills/fgos-coding-planning/**`
  - `core/skills/_shared/plan-contract.md` (section 3, item 5)
  - `core/skills/_shared/decision-question.md`
  - `core/skills/fgos-secretary/**`
- `npm run build:skills` regenerates the render surfaces.

## Footprint
See the phase table in `plan.md`, row 8. Other plans' `plan.md` files are not in this phase's footprint. A draft plan
with an open owner question gets its id through that plan's own planner: the leader messages it, or the secretary
when the planner is closed. The ids are recorded in this phase's report.

## Steps
0. Re-grep the open questions. They change daily.
1. For each open `QUESTIONS.md` row, run `fgos questions ask --migrated --ref discussion:<topic>#Q<n> --input …`.
   Build the five parts from the row. A row without options becomes `--open-discovery`. Add the `q-` id to a new
   `qid` column.
2. For each open draft-plan owner question, ask it the same way with `--ref plan:<dir>`, and send its planner the id.
3. Change the skills so that they:
   - ask the owner through `fgos questions ask`;
   - write the returned id into the origin;
   - continue the work the question does not block;
   - on the hook line, write the answer and the decision back to the origin, then `fgos questions ack <id>`;
   - cancel or supersede a question that is no longer needed.
   The plan contract's "Owner questions" section lists `q-` ids with a one-line summary. The secretary batches from
   `fgos questions`.
4. Run `npm run build:skills`.

## Verify
- `npm run fgos:dev -- questions --json` lists every migrated question, each with its ref.
- `rg -n "questions --open" core domains .agents plugins .claude` finds nothing.
- The skill render check, through the repo test runner (the skills build test).

## Rollback
Revert the phase commit. Questions already asked stay in the store as open records. Cancel them with
`fgos questions cancel <id> --reason rollback` if the rest of the plan is reverted too.
