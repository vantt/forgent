# Phase 1: Area spec, record contract, kinds

This phase writes docs and JSON contracts only. It writes no code.

## Inputs
- `docs/discussions/owner-questions/DISCUSSION.md`, sections 4 and 6, decisions OQ-D1..D7.
- `plan.md`, decisions QP-1..QP-18.
- `docs/platform/observe/spec.md`, section 3 (shards and lock), as a template for the spec's shape.
- Ops-metrics phase 1, landed: the `observe-kinds` declaration format (`packages/observe/contracts/observe-names.json`
  and the record v2 contract).
- `core/skills/_shared/decision-question.md` (the five parts).

## Footprint
- `docs/platform/questions/**`
- `packages/questions/contracts/**`
- `packages/questions/rust/observe-kinds.json`

## Steps
0. Re-grep the inputs. Check that the ops-metrics declaration format has landed, and read its real field names.
1. Write `docs/platform/questions/spec.md`. Use the house spec shape: purpose, owned decisions, shared entities,
   store, verbs, refusals, events, hook, boundaries with Observe, Identity, Supervision and Workflow, and decision
   history (OQ-D1..D7 and QP-1..QP-18, with a link to the discussion).
2. Write `packages/questions/contracts/question.record.v1.json`, a JSON Schema for the four record kinds:
   - `asked`: `{id, askedAt, asker{sessionId, handle, roles, persona?, pane?}, stage, ref, parts{what, cause,
     options[{label, does, gain, harm, cost, recommended?}], recommendation, scope}, openDiscovery, migrated,
     supersedes?}`;
   - `answered`: `{id, option?, text?, by, via?, answeredAt}`;
   - `acked`: `{id, by, at}`;
   - `cancelled`: `{id, by, reason, at}`.
3. Write `packages/questions/contracts/questions-input.v1.json`, the `ask --input` JSON shape (QP-5, QP-17 and
   QP-19). It holds `headline` and `blocks` and every QP-19 limit as data (`maxLength`, `minItems`/`maxItems`), so
   the code reads the limits from the contract and keeps no copy of its own. Add `headline` and `blocks` to the
   `asked` record in step 2.
4. Write `packages/questions/contracts/refusals.v1.json`. It names each refusal and its exit category:
   - `asker-unresolved`
   - `question-unclear` (names the field and the rule)
   - `ref-invalid`
   - `parts-incomplete`
   - `question-unknown`
   - `question-already-answered`
   - `question-not-open`
   - `answer-not-owner`
   - `not-asker`
5. Write `packages/questions/rust/observe-kinds.json`. It declares `fgos.question.asked`, `fgos.question.answered`
   and `fgos.question.cancelled`. The subject is the question id. The attrs are the asker role, session id, handle,
   persona, origin ref, stage, pane (optional) and answeredAt or cancel reason. Use the declaration format of
   ops-metrics phase 1.

## Verify
- The declaration test of ops-metrics phase 1 accepts the file. Use its test-local loading path, or
  `cargo test -p fgos-observe record_` with this file added to the test glob if the phase provides one. Otherwise
  validate the file with the JSON Schema of the declaration format.
- The record schema validates one example of each record kind.

Pass condition: the declaration file loads with no error, and the record schema accepts all four example records.

## Rollback
Revert the phase commit.
