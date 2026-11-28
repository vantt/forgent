# Phase 1: Write the standard and move every caller

Capability: `code:implement`. Wave 1, no dependencies.

## Inputs

- `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`, section 4 (OC-D4, OC-D6, OC-D8 to OC-D11,
  OC-D14) and section 6 steps 1 to 3: the standard's content, already settled in substance. Section 6 step 4 is
  superseded by OC-D13 for item 1; do not carry the reaction-capture hook into the text.
- `core/skills/_shared/decision-question.md` (five parts, `## When to ask the owner` with anchor `{#when-to-ask}`,
  Not owner questions, Quick table, discovery exception, Make it easy to answer) and
  `core/instructions/decision-question-template.md` (rule-unit frontmatter): the text being replaced.
- `core/skills/_shared/friction-capture.md`: where the owner-signal trigger and the OC-D14 duty go.
- `scripts/build-skill-wrappers.mjs` (`npm run build:skills`; also recompiles the `AGENTS.md` effective block and
  `.fgos/instructions/effective/rules.json`), `scripts/project-agents.mjs` (renders `core/agents/*.yaml` into
  `.claude/agents/*.md`), `scripts/git-one-door-scan.mjs` (census writer, read back by
  `test/setup/git-mutation-census.test.mjs`).
- `plans/261127-0144-when-to-ask-owner-rule/reports/recapture-goldens.sh`: the pattern for recapturing the 16
  start-context goldens after an agent-file line changes.

## Files it may write

New: `core/skills/_shared/owner-communication.md`, `core/instructions/owner-communication.md`.
Delete: `core/skills/_shared/decision-question.md`, `core/instructions/decision-question-template.md`.
Callers (path references only): `core/instructions/product-priority-order.md` (`[[decision-question-template]]` link),
`core/skills/_shared/coordination-driver.md`, `core/skills/_shared/plan-contract.md`,
`core/skills/_shared/friction-capture.md`, `core/skills/_shared/write-door.md`, `core/skills/fgos-cook/SKILL.md`,
`core/skills/fgos-cook/references/{case-and-doors,propose,reading-ak-plans}.md`, `core/skills/fgos-run/SKILL.md`,
`core/skills/fgos-{secretary,shaping,supervisor,lead}/SKILL.md`, `core/agents/{secretary,shaper,supervisor}.yaml`
(the `must_escalate` line "... (decision-question.md, When to ask)"),
`domains/coding/skills/fgos-coding-{discovering,exploring,implement,validating}/SKILL.md`,
`domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md`,
`docs/knowledge/why-a-gate-dialogue-keeps-the-agent-s-checkpoint-separate-fr/gate-checkpoint-vs-answer-separation.md`,
`docs/platform/agent-mailbox/spec.md`, `docs/platform/documentation/subcomponents/admission/spec.md`,
`docs/platform/platform-foundations.md` (link only), `docs/platform/questions/spec.md`, `docs/reading-map.md`,
`packages/yaml-doc/upgrade-record.md`, `src/state/decision-question.mjs` and `src/state/status-fsm.mjs` (comments
only), `test/docs/rul11-anchor-phrase.test.mjs`, `test/state/awaiting.test.mjs` (comment).
Generated (rebuild only, never hand-edit): `AGENTS.md`, `.fgos/instructions/effective/**`,
`.claude/agents/{secretary,shaper,supervisor}.md`, `packages/agent-start-context/goldens/**`,
`packages/git/contracts/mutation-census.v1.json`, `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`.

Find the caller set fresh before editing, since main moves:
`git grep -n -e "_shared/decision-question" -e "decision-question.md" -e "decision-question-template" -- ':!plans' ':!CHANGELOG.md' ':!changelog.d'`.
A hit outside the list above that serves this phase's acceptance is widened through `fgos supervisor widen`.

## Steps

1. Write `core/skills/_shared/owner-communication.md`, titled "Tiêu chuẩn giao tiếp (communication standard)":
   1. **Why** (discussion section 6 step 1, with OC-D8's overload reading): the owner's attention is the scarcest
      resource; the agent does the heavy work before it speaks; a program check is a safety net, never the reason.
   2. **Principle and test before sending** (step 2, as written).
   3. **Part A, conduct**: the four bullets of step 2 Part A (no permission for one's own work; weigh, agree
      plainly or push back with evidence, then carry out the decision, OC-D9/OC-D10; record a friction when the
      communication fell short, with the three doors and the working-file fallback, OC-D14; on a reaction signal,
      notice, record, wait for the owner's question and answer it short, never re-present unprompted).
   4. **Part B, presenting information**: the nine points (OC-D11). Point 8's decision question carries the old
      five parts (Vietnamese and English headings both accepted, as today, since `src/state/decision-question.mjs`
      matches them), the discovery exception (parts 1, 2 and 5 only), lettered options with the recommended one
      first and a stated default; status report and incident report shapes as in step 2. Keep the sentences that
      `fgos questions ask` checks the measurable rules while this file holds the rest, and that the ask hook checks
      the parts through `src/state/decision-question.mjs`. Fold "Make it easy to answer" into points 3, 4 and 8.
   5. **Part C, when and where**: step 2 Part C, then the whole `## When to ask the owner (khi nào hỏi chủ)
      {#when-to-ask}` section of the old fragment word for word (approved frame, three questions, after deciding,
      not owner questions, quick table, mess inside the frame), anchor kept.
   6. **Reaction signals**: the T1 to T12 table, marked provisional (the coach refines it).
   7. **Curated cases**: C1, C4, C5, S1, S3, S4, S5 from step 3 in one short table (drop S2 if it repeats S3's
      lesson). Say that raw cases live in the friction store under layer `owner-communication`, not here (OC-D4).
2. Write `core/instructions/owner-communication.md` with the frontmatter keys of the old instruction (`kind: law`,
   `owner: core`, `scope: repo`, `mode: append`, `specificity: 10`, `lifecycle: live`), `id: owner-communication`,
   `valid_from` today, title "Communication Standard", a one-line `description`, and a body of at most six lines:
   the overload reason, the principle, the five-part decision question in one line, the When to ask sentence of the
   old instruction, and the pointer to the fragment.
3. In `core/skills/_shared/friction-capture.md`, add to "Record when": the owner's reaction shows a message fell
   short (point to the standard's signal table), or your own reflection shows it; add to "Record how" the layer
   `owner-communication` with a fault signature as `--error-class`, a short redacted paraphrase of the owner's
   reaction and of your message in `--detail` (never the owner's words verbatim, no names or private details:
   friction records sit in a git-tracked path), and the OC-D14 fallback when the door refuses.
4. Replace the "At most 10 lines" sentence in `fgos-lead`, `fgos-secretary` and `fgos-supervisor` with a pointer to
   the standard's status-report shape; keep each skill's own sentence about where the full report file goes.
5. Move every other caller to the new paths: `decision-question.md` becomes `owner-communication.md`,
   `decision-question.md#when-to-ask` becomes `owner-communication.md#when-to-ask`, `[[decision-question-template]]`
   becomes `[[owner-communication]]`; where the text named the template, say "the decision question in the
   communication standard". Prose that names "the decision-question template" as the guard's check stays (plan
   non-goal). Update `test/docs/rul11-anchor-phrase.test.mjs` to assert the new instruction's sentence and path (it
   stays the owning proof that AGENTS.md carries the standard).
6. Delete the two old files.
7. Regenerate, never hand-edit: `npm run build:skills`; `node scripts/project-agents.mjs`; recapture the goldens
   that carry the changed `must_escalate` line by the `recapture-goldens.sh` pattern (replace the old line with the
   new one in every golden, append one dated line to `packages/agent-start-context/goldens/NOTES.md`, then
   `cmp` each `goldens/agent-file/<name>.md` with `.claude/agents/<name>.md`); the census through
   `scripts/git-one-door-scan.mjs` (its write mode; see the script header).

## Verify

```bash
git grep -n -e "_shared/decision-question" -e "decision-question.md" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md' ':!changelog.d' ':!packages/agent-start-context/goldens/NOTES.md'   # prints nothing
git grep -n "decision-question-template" -- AGENTS.md core .fgos/instructions   # prints nothing
npm run build:skills && node scripts/project-agents.mjs && git status --porcelain -- .agents plugins .claude AGENTS.md .fgos/instructions   # empty once committed
node --test test/docs/rul11-anchor-phrase.test.mjs test/state/awaiting.test.mjs test/setup/git-mutation-census.test.mjs test/scripts/project-agents.test.mjs
npm test
```

Pass: both greps print nothing, the rebuild leaves no diff, and all tests are green.

## Rollback

`git revert` the phase commit; it holds the new files, the deletions, every caller move and the regenerated
surfaces together.
