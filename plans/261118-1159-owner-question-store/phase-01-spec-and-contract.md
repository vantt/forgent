# Phase 1: Area spec, contracts, kinds

This phase writes docs and JSON contracts only. It writes no code. Its status is `ready`: its files are disjoint from
every running or ready plan.

## Inputs
- `docs/discussions/owner-questions/DISCUSSION.md`, sections 4 and 6 (OQ-D1..D7).
- `plan.md`, decisions QP-1..QP-22.
- The house spec shape, taken from `docs/platform/observe/spec.md` and `docs/platform/identity/spec.md`.
- The Event Store stream contract format: `packages/identity/contracts/identity-event-streams.v1.json`,
  `packages/event-store/contracts/consumers.v1.json` and `docs/platform/event-store/spec.md`.
- The `observe-kinds` declaration format, landed in `d97ee32b8`: `packages/observe/contracts/observe-names.json` and
  `packages/observe/contracts/observe.record.v2.json`.
- `core/skills/_shared/decision-question.md`.
- The area table in `docs/platform/component-boundary.md:82` and the holder table in `docs/platform/governance.md`
  (around line 540).

## Footprint
- `docs/platform/questions/**`
- `docs/platform/component-boundary.md`
- `docs/platform/governance.md`
- `packages/questions/contracts/**`
- `packages/questions/rust/observe-kinds.json`

## Steps
0. Re-grep every input.
1. Write `docs/platform/questions/spec.md` with these sections:
   - purpose and owned decisions;
   - shared entities: question, answer, ack, cancel;
   - store: Event Store consumer `questions`, the fold, and the cross-machine conflict rule;
   - verbs and head-socket verbs;
   - who may answer, ack and cancel, stating that the owner rule guards against mistakes only;
   - refusals;
   - events;
   - hook;
   - boundaries with Observe, Identity, Event Store, Session Host, Supervision and Workflow;
   - decision history: OQ-D1..D7 and QP-1..QP-22, with links.
2. Add the Questions row to `component-boundary.md`, and add the holder row for the `questions` scope to
   `governance.md`.
3. Write `packages/questions/contracts/question-event-streams.v1.json`. It declares four types, each `scope: project`,
   `schemaVersion: 1`, `sealOnWrite: true` (QP-2). The `asker` of `question.asked` also carries `machine`. Their payloads:
   - `question.asked`: `{id, askedAt, asker{sessionId, handle, roles, persona?, pane?}, stage, ref{value, branch,
     commit}, headline, blocks, parts{what, cause, options[{label, does, gain, harm, cost, recommended?}],
     recommendation, scope{allows, forbids}}, migrated, supersedes?}`
   - `question.answered`: `{id, option?, text?, by, via?, answeredAt}`
   - `question.acked`: `{id, by, at}`
   - `question.cancelled`: `{id, by, reason, at}`
4. Write `packages/questions/contracts/questions-input.v1.json`, the `ask --input` shape. Every QP-19 limit is data
   in this file (`maxLength` counts characters, and `minItems`/`maxItems` count options). The discovery exception is
   tied to a `discussion:` ref with stage `shaping`.
5. Write `packages/questions/contracts/refusals.v1.json`. Each refusal gets an exit category:
   - `asker-unresolved`
   - `ref-invalid`
   - `parts-incomplete`
   - `question-unclear`, which names the field and the rule
   - `question-unknown`
   - `question-already-answered`
   - `question-not-open`
   - `answer-not-owner`
   - `not-asker`
   - the Event Store refusals the verbs pass through, such as `event-store-unsupported-platform` and the store's lock
     timeout, each with its exit category
6. In the spec, state the Linux-only limit (QP-2) and the per-machine view `.fgos/cache/questions.json` (QP-23).
7. Write `packages/questions/rust/observe-kinds.json`. It declares `fgos.question.asked`, `answered`, `acked` and
   `cancelled`, with the question id as subject and the OQ-D6 attrs.

## Verify
- The observe declaration test accepts the kinds file. Run `cargo test -p fgos-observe record_` with the file loaded
  the way the phase 1 tests load a test-local declaration. If no such loader exists, validate the file against the
  declaration schema.
- One example of each event type and one valid and one invalid `--input` validate as expected against their schemas,
  using a JSON Schema check run through `node`.

Pass condition: both checks pass, and the spec has every section listed in step 1.

## Rollback
Revert the phase commit.
