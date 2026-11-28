# Phase 3: Stated default and lettered options in the question door

Capability: `code:implement`. Wave 2, after phase 1 (shared file `docs/platform/questions/spec.md`).

## Inputs

- Discussion section 7 task 3, OC-D7 item 2 and case C5.
- `packages/questions/contracts/questions-input.v1.json`: the rule authority for the ask door (`$defs.decided`
  holds the required options and recommendation).
- `packages/questions/rust/src/shape.rs` (validation, `exactly one option recommended`), `record.rs` (stored
  shape), `usecase.rs` (`answer`, around line 226), `packages/questions/contracts/question-event-payloads.v1.json`.
- `apps/fgos/src/wiring/questions.rs`: `recommended` (around 285), `answer_command` (around 296), the list line
  (around 389), the detail view (around 420 to 450).
- `apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx` and its test `NeedsAnswer.test.tsx`: the web dashboard's
  view of open questions, which also renders the options.
- `docs/platform/questions/spec.md` sections 4 and 5.

## Files it may write

`packages/questions/contracts/questions-input.v1.json`, `packages/questions/contracts/question-event-payloads.v1.json`,
`packages/questions/contracts/refusals.v1.json` (only if a new refusal wording is needed; prefer the existing
`question-unclear`), `packages/questions/rust/src/shape.rs`, `packages/questions/rust/src/record.rs`,
`packages/questions/rust/src/usecase.rs`, `packages/questions/rust/tests/store_usecases.rs`,
`apps/fgos/src/wiring/questions.rs`, `apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx`,
`apps/fgos-gateway/web/src/screens/NeedsAnswer.test.tsx`, `docs/platform/questions/spec.md`.

## Steps

1. Contract: add `parts.default` (string, `minLength: 1`, describes what the asker does, and when, if no answer
   comes) to `properties.parts.properties`, and to the `required` list of `$defs.decided`, so it is required exactly
   when options are. The discovery exception keeps it optional. Mirror the field in the event payload contract.
2. `shape.rs`: read and check the field from the contract data, refusing `question-unclear` naming `parts.default`
   when the decided shape lacks it. `record.rs`: store it as optional so questions asked before this change still
   fold.
3. Display: options are shown in order recommended first, each prefixed `A.` to `D.`; the detail view adds a line
   `Default if no answer: <default>` after the recommendation when present; the list line's `[recommended: ...]`
   shows the letter and label; `answer_command` uses `--option A`. A label that already starts with its own
   letter and a dot (askers do this by hand today, e.g. "B. Keeper's lead ...") is shown as is, not doubled. The
   gateway's `NeedsAnswer.tsx` shows the same letters, order and default line; extend `NeedsAnswer.test.tsx`.
4. Answer: `--option` accepts a single letter `A` to `D` (case-insensitive) as the option at that display position,
   besides the exact label; a letter beyond the number of options is refused with the existing unknown-option
   refusal.
5. Tests: extend `packages/questions/rust/tests/store_usecases.rs` (the owning proof of the ask and answer use
   cases) with: decided question without default refused naming the field; discovery question without default
   accepted; a stored question without default still folds; answer by letter maps to the recommended-first order.
   Extend the existing wiring test of the display, if one exists, rather than adding a new file.
6. Spec: add the field, the lettered display and the letter answer to `docs/platform/questions/spec.md` sections
   4 and 5.

## Verify

```bash
cargo test -p fgos-questions
cargo test -p fgos --test questions   # if the wiring has its own test target; otherwise cargo test -p fgos
cargo test --workspace
(cd apps/fgos-gateway/web && npx vitest run src/screens/NeedsAnswer.test.tsx)
```

Pass: all green, and the four cases in step 5 are present and fail when their behaviour is removed.

## Rollback

`git revert` the phase commit. Questions asked with a default during the window keep folding after revert only if
`record.rs` ignores unknown fields; check this before landing and note it in the phase report.
