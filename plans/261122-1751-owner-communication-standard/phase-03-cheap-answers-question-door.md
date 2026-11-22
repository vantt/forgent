# Phase 3: Cheap answers in the question door

Capability: `code:implement`. Wave 2. Depends on phase 1 (the standard's decision-question application states the
rule this phase enforces).

## Inputs

- `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`, section 6 step 2 "Decision question" and
  step 4 level 2; decision OC-D7; seed case C5.
- `packages/questions/contracts/questions-input.v1.json` (rule authority; `$defs.decided`),
  `packages/questions/contracts/refusals.v1.json`.
- `packages/questions/rust/src/shape.rs` (validation, line 294 "exactly one option recommended"), `record.rs`
  (`QuestionOption`), `usecase.rs` (answer).
- `apps/fgos/src/wiring/questions.rs` (`recommended()` near line 285, the list line near 383, the option marks near
  426) and `apps/fgos/tests/questions_verb.rs`.
- `docs/platform/questions/spec.md` sections 4 and 5.

## Files it may write (footprint)

`packages/questions/contracts/questions-input.v1.json`, `packages/questions/contracts/refusals.v1.json`,
`packages/questions/rust/src/**`, `packages/questions/rust/tests/**`, `apps/fgos/src/wiring/questions.rs`,
`apps/fgos/tests/questions_verb.rs`, `docs/platform/questions/spec.md`, `core/skills/_shared/owner-communication.md`,
the asking skills (`core/skills/fgos-lead/SKILL.md`, `core/skills/fgos-secretary/SKILL.md`,
`core/skills/fgos-shaping/SKILL.md`, `core/skills/fgos-supervisor/SKILL.md`,
`domains/coding/skills/fgos-coding-planning/SKILL.md`, `domains/coding/skills/fgos-coding-shaping/SKILL.md`), and the
generated `.agents/skills/**`, `plugins/fgOS/skills/**`.

## Steps

1. Contract: add `parts.default`, an object `{ "does": string, "when": string }` (what the asker does and when, if no
   answer comes), both `minLength: 1`. Add it to `$defs.decided`'s required list, so it is required exactly where
   options and a recommendation are required and the discovery exception stays as it is. Stored questions without it
   still fold and display.
2. `shape.rs`: validate the new field from the contract and refuse `question-unclear` naming `parts.default` when a
   decided question lacks it; `record.rs`: carry it.
3. One ordering function in the questions package: options in recommended-first order, the rest in stored order,
   lettered `A` to `D`. Both the display and the answer path use it, so a letter means the same option everywhere.
4. `questions.rs`: show options as `A. <label>` with the recommended mark at `A.`, show the default line ("No answer
   by <when>: <does>"), add the letters to the JSON view, and make the generated `answerCommand` use the letter.
   `usecase.rs` (answer): accept `--option <letter>` (single letter `A`-`D`, case-insensitive) as well as the label;
   a letter beyond the option count is refused with the existing unknown-option refusal.
5. Tests in the owning files: the shape refusal and the ordering in `packages/questions/rust/tests/` (or the
   existing unit tests of `shape.rs`), the display and the answer by letter in `apps/fgos/tests/questions_verb.rs`.
6. Docs and skills: update `docs/platform/questions/spec.md` sections 4 and 5 for the field and the letters. Add
   `parts.default` to every `fgos questions ask` input example in the asking skills and in the standard's decision
   question application; tell the secretary to show questions with their letters and default. Run
   `npm run build:skills`.

## Verify

```bash
cargo test -p fgos-questions
cargo test -p fgos --test questions_verb
npm run build:skills && git status --porcelain .agents plugins   # prints nothing after the commit
npm test && cargo test --workspace
```

Pass: every command exits 0; a decided question without `parts.default` is refused `question-unclear` naming it;
`fgos questions` shows `A.` to `D.` with the recommended option at `A.`.

## Rollback

`git revert` of this phase's commit. Questions asked with `parts.default` meanwhile keep the extra field in their
stored payload; the reverted reader ignores it only if the record type tolerates unknown fields, so check
`record.rs` before reverting and, if it is strict, revert phase 3 before any new question is asked.
