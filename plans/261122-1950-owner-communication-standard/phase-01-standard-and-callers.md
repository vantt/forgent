# Phase 1: Write the standard and move every caller

Capability: `code:implement`. Wave 1, no dependencies.

## Inputs

- `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`, section 4 (OC-D4, OC-D6, OC-D8 to OC-D11,
  OC-D14) and section 6 steps 1 to 3: the standard's content, already settled in substance. Section 6 step 4 is
  superseded by OC-D13 for item 1; do not carry the reaction-capture hook into the text.
- `core/skills/_shared/decision-question.md` and `core/instructions/decision-question.md`: the text being replaced.
- `core/skills/_shared/friction-capture.md`: where the owner-signal trigger and the OC-D14 duty go.
- `src/setup/instruction-projections.mjs`: how `core/instructions/*.md` reaches `AGENTS.md` and
  `.fgos/instructions/effective/repo.json`.
- `scripts/build-skill-wrappers.mjs` (`npm run build:skills`) and `scripts/git-one-door-scan.mjs` (census writer,
  read back by `test/setup/git-mutation-census.test.mjs`).

## Files it may write

`core/skills/_shared/owner-communication.md` (new), `core/instructions/owner-communication.md` (new),
`core/skills/_shared/decision-question.md` (delete), `core/instructions/decision-question.md` (delete), and every
caller: `core/skills/_shared/coordination-driver.md`, `core/skills/_shared/plan-contract.md`,
`core/skills/_shared/friction-capture.md`, `core/skills/fgos-cook/SKILL.md`,
`core/skills/fgos-cook/references/case-and-doors.md`, `core/skills/fgos-run/SKILL.md`,
`core/skills/fgos-secretary/SKILL.md`, `core/skills/fgos-shaping/SKILL.md`, `core/skills/fgos-supervisor/SKILL.md`,
`core/skills/fgos-lead/SKILL.md`, `domains/coding/skills/fgos-coding-{discovering,exploring,implement,knowledge,validating}/SKILL.md`,
`domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md`,
`docs/knowledge/why-a-gate-dialogue-keeps-the-agent-s-checkpoint-separate-fr/gate-checkpoint-vs-answer-separation.md`,
`docs/platform/agent-mailbox/spec.md`, `docs/platform/documentation/subcomponents/admission/spec.md`,
`docs/platform/platform-foundations.md` (link only), `docs/platform/questions/spec.md`, `docs/reading-map.md`,
`packages/yaml-doc/upgrade-record.md`, `src/state/decision-question.mjs` and `src/state/status-fsm.mjs` (comments
only), `test/docs/rul11-anchor-phrase.test.mjs`, `test/state/awaiting.test.mjs` (comment), and the generated
surfaces `AGENTS.md`, `.fgos/instructions/effective/repo.json`, `packages/git/contracts/mutation-census.v1.json`,
`.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`.

## Steps

1. Write `core/skills/_shared/owner-communication.md`, titled "Tiêu chuẩn giao tiếp (communication standard)":
   1. **Why** (discussion section 6 step 1, with OC-D8's overload reading): the owner's attention is the scarcest
      resource; the agent does the heavy work before it speaks; a program check is a safety net, never the reason.
   2. **Principle and test before sending** (step 2, as written).
   3. **Part A, conduct**: the four bullets of step 2 Part A (no permission for one's own work; weigh, agree
      plainly or push back with evidence, then carry out the decision, OC-D9/OC-D10; record a friction when the
      communication fell short, with the three doors and the working-file fallback, OC-D14; on a reaction signal,
      notice, record, wait for the owner's question and answer it short, never re-present unprompted). Then the
      approved-frame rule from the old fragment, unchanged in substance.
   4. **Part B, presenting information**: the nine points (OC-D11). Point 8's decision question carries the old
      five parts (Vietnamese and English headings both accepted, as today), the discovery exception (parts 1, 2
      and 5 only), lettered options with the recommended one first and a stated default; status report and
      incident report shapes as in step 2. Keep the sentence that `fgos questions ask` checks the measurable rules
      and this file holds the rest, and that the ask hook checks the parts through `src/state/decision-question.mjs`.
   5. **Part C, when and where** (step 2 Part C), pointing to AGENTS.md product priority 2 for batching.
   6. **Reaction signals**: the T1 to T12 table, marked provisional (the coach refines it).
   7. **Curated cases**: C1, C4, C5, S1, S3, S4, S5 from step 3 in one short table (drop S2 if it repeats S3's
      lesson). Say that raw cases live in the friction store under layer `owner-communication`, not here (OC-D4).
2. Write `core/instructions/owner-communication.md` with the same frontmatter keys as the old instruction
   (`kind: law`, `appliesTo: ["*"]`, `mode: append`), `id: owner-communication`, a title "Communication Standard",
   and a body of at most six lines: the overload reason, the principle, the five-part decision question in one
   line, the approved-frame sentence, and the pointer to the fragment.
3. In `core/skills/_shared/friction-capture.md`, add to "Record when": the owner's reaction shows a message fell
   short (point to the standard's signal table), and your own reflection shows it; add to "Record how" the layer
   `owner-communication` with a fault signature as `--error-class`, the owner's words and your message in
   `--detail`, and the OC-D14 fallback when the door refuses.
4. Replace the "At most 10 lines" sentence in `fgos-lead`, `fgos-secretary` and `fgos-supervisor` with a pointer to
   the standard's status-report shape; keep each skill's own sentence about where the full report file goes.
5. Move every other caller from `_shared/decision-question.md` or `instructions/decision-question.md` to the new
   paths, wording "the decision question in the communication standard" where the text named the template.
   Update `test/docs/rul11-anchor-phrase.test.mjs` to assert the new instruction's sentence and path (it stays the
   owning proof that AGENTS.md carries the standard).
6. Delete the two old files.
7. Regenerate: `npm run build:skills`; the AGENTS.md effective block and `.fgos/instructions/effective/repo.json`
   through the instruction projection door (find its entry point from `src/setup/instruction-projections.mjs`
   callers; never hand-edit the block); the mutation census through its own script.

## Verify

```bash
git grep -n -e "_shared/decision-question" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md'   # prints nothing
npm run build:skills && git status --porcelain -- .agents plugins .claude   # empty
node --test test/docs/rul11-anchor-phrase.test.mjs test/state/awaiting.test.mjs test/setup/git-mutation-census.test.mjs
npm test
```

Pass: the grep prints nothing, the rebuild leaves no diff, and all tests are green.

## Rollback

`git revert` the phase commit; it holds the new files, the deletions and every caller move together.
