# Phase 5: Detection `question-answered`

## Inputs
- `plan.md`, decision QP-12, and OQ-D6 (the attrs).
- The definition file format `*.query.json` and its runner (`fgos metrics query --def`), from ops-metrics phase 7.
- The phase 7 definition tests in `packages/observe/rust/tests/definition_*.rs`, used as the pattern.
- `packages/questions/rust/observe-kinds.json`, from phase 1.

## Footprint
- `core/questions/**`
- `packages/questions/rust/tests/definition_*.rs`
- `test/fixtures/questions/**`

## Steps
0. Re-grep the landed definition format.
1. Write `core/questions/definitions/question-answered.query.json`. It selects `fgos.question.answered` records
   whose question has no later `acked` record (an anti-join on the store's ack events or on the subject id, as the
   query grammar allows). Each row carries the asker role, session id, handle and persona, the origin ref,
   answeredAt and the pane. If the grammar cannot express "no ack yet" because acks are not events, emit
   every answered question and let the watcher dedupe by the event id. Note that choice in the file's `about` field.
2. Write the fixture records under `test/fixtures/questions/observe/`.
3. Write `packages/questions/rust/tests/definition_question_answered.rs` (acceptance 6). It runs the definition
   through the observe definition runner over the fixture and checks the rows and attrs.

## Verify
`cargo test -p fgos-questions --test definition_question_answered` must be green.

## Rollback
Revert the phase commit.
