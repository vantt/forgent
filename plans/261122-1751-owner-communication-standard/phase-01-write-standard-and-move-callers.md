# Phase 1: Write the standard and move every caller

Capability: `code:implement`. Wave 1. Depends on nothing.

## Inputs

- `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`, section 6 steps 1 to 3 (the text of the
  standard, the T-signal table, the seed cases) and decisions OC-D2, OC-D3, OC-D4, OC-D6.
- `core/skills/_shared/decision-question.md` and `core/instructions/decision-question.md` (the text being absorbed).
- `core/skills/_shared/friction-capture.md` (the "Record when" list gets the owner-signal trigger).
- `packages/observe/rust/friction-kinds.json` and `docs/platform/observe/spec.md` line 136 (the layer list).
- `src/setup/instruction-projections.mjs` (how `core/instructions/*.md` reaches `AGENTS.md`) and
  `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md`.

## Files it may write (footprint)

New: `core/skills/_shared/owner-communication.md`, `core/instructions/owner-communication.md`.
Deleted: `core/skills/_shared/decision-question.md`, `core/instructions/decision-question.md`.
Modified: every other path in this phase's row of the plan's phase table. Generated (rebuilt, never hand-edited):
`.agents/skills/**`, `plugins/fgOS/skills/**`, `AGENTS.md`, `.fgos/instructions/effective/repo.json`,
`packages/git/contracts/mutation-census.v1.json`.

## Steps

1. Write `core/skills/_shared/owner-communication.md`, titled "Thấu hiểu user", in this order (OC-D3): why (step 1
   of the discussion's section 6); the principle and the test before sending (step 2); the applications: before you
   speak, names and ids, language and length, decision question, status and incident reports (step 2). The decision
   question application carries the whole of today's five-part template, its approved-frame rule and its "make it
   easy to answer" section word for word, plus lettered options with the recommended one first and a stated default
   (OC-D7 level 2). The report application carries "at most 10 lines, detail in a file". Then "How cases are kept":
   the friction layer `owner-communication`, the T1-T12 signal table, one stable signature per kind of fault
   (`owner-communication.permission-asking`, `.unexplained-id`, `.too-long`, `.wrong-language`, `.asked-back`,
   `.misread-goal`, `.repeated-instruction`, `.missed-context`), the rule that the agent who receives the owner's
   message records it and never argues with the signal, and that the coach (its own item, OC-D5) reads
   `fgos friction rank`. Then the curated seed cases C1, C4, C5, S1, S2, S3. Keep the file short enough to read in
   one pass (OC-D6: split the cases out only if it grows past that).
2. Write `core/instructions/owner-communication.md` with the same frontmatter shape as the old instruction
   (`kind: law`, `appliesTo: ["*"]`, `mode: append`, `specificity: 10`) and a new id `owner-communication`; the body
   is the motive and the principle in a few lines, the approved-frame sentence, and a pointer to the fragment.
3. Delete both decision-question files.
4. Move every caller. The list: `git grep -l -e "_shared/decision-question" -e "instructions/decision-question" -e
   "decision-question\.md" -- ':!plans' ':!CHANGELOG.md' ':!.agents' ':!plugins'`. Replace each pointer with the new
   fragment path (and the section name where the caller cited one part of the template). In `fgos-lead`,
   `fgos-secretary` and `fgos-supervisor`, replace the "At most 10 lines ..." report lines with a pointer to the
   standard's report application, keeping each skill's own report-file location sentence. In
   `src/state/decision-question.mjs`, `src/state/status-fsm.mjs` and `test/state/awaiting.test.mjs`, change only
   comments. In `test/docs/rul11-anchor-phrase.test.mjs`, pin the new instruction's anchor sentence and its pointer
   to `core/skills/_shared/owner-communication.md` (same test, same behaviour: the law reaches `AGENTS.md`).
   `docs/platform/platform-foundations.md` gets only its path pointer changed; no law text changes.
   `packages/yaml-doc/upgrade-record.md` gets only its path pointer changed.
5. Add `owner-communication` to the `fgos.friction.layer` values in `packages/observe/rust/friction-kinds.json` and to
   the layer list in `docs/platform/observe/spec.md` line 136.
6. Add to `core/skills/_shared/friction-capture.md` "Record when": "the owner's reaction shows a message cost them
   attention (signals in owner-communication.md); layer `owner-communication`".
7. Regenerate: `npm run build:skills`; the instruction projection for `AGENTS.md` and
   `.fgos/instructions/effective/repo.json` through `npm run fgos:dev -- setup` (the door that runs
   `src/setup/instruction-projections.mjs`; if it refuses in this tree, record a friction and use the projection
   door the instruction-composition contract names); `node scripts/git-one-door-scan.mjs --write-census`.

## Verify

```bash
git grep -n -e "_shared/decision-question" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md'   # prints nothing
npm run build:skills && git status --porcelain .agents plugins                                                 # prints nothing after the commit
node --test test/docs/rul11-anchor-phrase.test.mjs test/state/awaiting.test.mjs
cargo test -p fgos-observe
npm test
```

Pass: the grep and status print nothing; every command exits 0.

## Rollback

`git revert` of this phase's single commit restores both old files and every pointer together. Revert phases 2 and
3 first if they have landed.
