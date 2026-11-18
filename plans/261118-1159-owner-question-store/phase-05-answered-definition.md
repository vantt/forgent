# Phase 5: Detection `question-answered`

Waits for ops-metrics phase 7 (the definition runner, `fgos metrics query --def`).

## Inputs
- `plan.md` QP-12 and OQ-D6 attrs (DISCUSSION §4).
- The definition format `*.query.json` and its runner, ops-metrics phase 7 (landed).
- The anti-join tests of ops-metrics phase 5 (`packages/observe/rust/tests/query_*.rs`).
- `packages/questions/rust/observe-kinds.json`.

## Footprint
- `core/questions/**`
- `packages/questions/rust/tests/definition_*.rs`
- `test/fixtures/questions/**`

## Steps
0. Re-grep the landed definition format.
1. Write `core/questions/definitions/question-answered.query.json`. It selects `fgos.question.answered` records that
   have no `fgos.question.acked` record for the same subject (an anti-join), with these attrs:
   - asker role
   - session id
   - handle
   - persona
   - origin ref
   - answeredAt
   - pane
2. Write fixture records under `test/fixtures/questions/observe/`: three answered questions, one of them acked.
3. Write `packages/questions/rust/tests/definition_question_answered.rs`. It runs the definition through the runner
   and checks for two rows with their attrs.

## Verify
`cargo test -p fgos-questions --test definition_question_answered` is green and returns two rows.

## Rollback
Revert the phase commit.
