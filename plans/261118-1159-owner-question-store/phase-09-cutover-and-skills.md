# Phase 9: Cutover; skills ask through the verb

## Inputs
- `plan.md` QP-13, QP-19, QP-21 and QP-22, plus OQ-D7.
- Every open owner question on disk. Find them in three places:
  - `rg -n "\| *open *\|" docs/discussions/*/QUESTIONS.md`;
  - the "Owner questions" section of every `status: draft` plan on `main`;
  - the discussions and draft plans on live shaper and planner branches. Ask their sessions through the secretary.
- The skills:
  - `core/skills/fgos-shaping/**`
  - `domains/coding/skills/fgos-coding-shaping/**`
  - `domains/coding/skills/fgos-coding-planning/**`
  - `core/skills/_shared/plan-contract.md` (section 3, item 5)
  - `core/skills/_shared/decision-question.md`
  - `core/skills/fgos-secretary/**`
- `npm run build:skills`.

## Footprint
See the phase table in `plan.md`, row 9. Other plans' `plan.md` files are not in this footprint. A draft plan with
an open question gets its id through that plan's planner (message it, or the secretary when it is closed).

## Steps
0. Re-grep the open questions.
1. Ask each open `QUESTIONS.md` row again with `fgos questions ask --migrated --ref discussion:<topic>#Q<n> --input …`.
   Build the input so it passes QP-19, using `headline` and `blocks` from the row. Add the `q-` id to a new `qid`
   column.
2. Ask each open draft-plan question again with `--ref plan:<dir>`, and send its planner the id.
3. Change the skills so they say the following:
   - Ask the owner only with `fgos questions ask`. Inside a head, the CLI goes through the socket.
   - Write the id into the origin, then keep working on whatever the question does not block.
   - On the hook line, write the answer and the decision back to the origin, then `fgos questions ack <id>`.
   - When a question is no longer needed, `cancel` it or `--supersedes` it.
   - In the plan contract, "Owner questions" lists `q-` ids, each with its headline.
   - `decision-question.md` gains a section "make it easy to answer" (QP-21).
   - The secretary batches at most 5 questions in QP-21 order, and rewrites a question that breaks the guide.
4. Run `npm run build:skills` and regenerate the census.

## Verify
- `npm run fgos:dev -- questions --json` lists each migrated question with its ref.
- `rg -n "questions --open" core domains .agents plugins .claude` finds nothing.
- The skills build test, run through the repo test runner, is green.

## Rollback
Revert the phase commit. Questions already asked stay in the log as open records. Close them with
`fgos questions cancel <id> --reason rollback` if the plan is reverted.
