---
phase: 4
title: "Shared write-door procedure; the knowledge skill calls it"
status: ready
dependencies: [1, 7]
---

# Phase 4: shared write-door procedure; the knowledge skill calls it

## Inputs

- `plan.md` decisions D1, D2, D3, D7–D10 and facts F1, F2, F3, F15; gaps G1, G7.
- `docs/platform/documentation/subcomponents/write-door/spec.md` sections 6.1, 6.4 and 7.
- `docs/platform/documentation/subcomponents/document-identity/spec.md` section 8.1.
- `domains/coding/skills/fgos-coding-knowledge/SKILL.md` (current flow).
- `core/skills/_shared/decision-question.md`, for the shape of a shared fragment and the `ask` path.
- `docs/platform/documentation/operations/how-a-document-is-written.md` (the worked procedure in this repository).
- `fgos doc locate --help`, `fgos doc index --help`; phase 1's `fgos knowledge attest --locate-file` and
  `fgos knowledge handoff --decision`.

## Footprint

`core/skills/_shared/write-door.md`, `domains/coding/skills/fgos-coding-knowledge/SKILL.md`, the generated copies
`.agents/skills/_shared/write-door.md`, `.agents/skills/fgos-coding-knowledge/SKILL.md`,
`.claude/skills/fgos-coding-knowledge/SKILL.md`, `plugins/fgOS/skills/_shared/write-door.md`,
`plugins/fgOS/skills/fgos-coding-knowledge/SKILL.md`, and
`docs/platform/documentation/operations/how-a-document-is-written.md`.

## Steps

1. Write `core/skills/_shared/write-door.md`, independent of any domain. Steps:
   1. State the claim and draft the paragraph. **Translate it into the corpus's language (English here) before
      locate; this is required** (D10: a draft in another language ranks a right unit in the top 3 for 0% of
      queries, and a draft with no names gets no help from the scan). Put every name the claim touches (verb, flag,
      path, symbol, rule id) in backticks. Write it to `.fgos/runtime/tmp/<id>-draft.md`.
   2. `fgos doc locate --draft-file <draft> --json`, optionally with `--area`/`--question`, and `--exact <string>`
      for a name or phrase the draft does not backtick. If `state` is not ready or `partial` is true, run
      `fgos doc index status --wait <s>` once and locate again. If it is still partial, continue: `mentions` is
      complete either way. Say so in the record.
   3. Read one to three candidates around their `section`, **and every mention marked `missedBySearch`**. Decide
      `grow`, `ask`, `create` or `no-place`. Never decide from rank alone, and never from mentions alone: a name in a
      section does not make that section the carrier.
   4. For each mention, decide its handling: `updated` (edit the section so it agrees with the claim),
      `unaffected` (it names the term but states nothing the claim changes), or `too-common` (with a note; use it
      when `truncated` is true and a longer `--exact` string does not narrow it). Do not use `rg` on the corpus
      instead; locate's scan is the corpus scan.
   5. `grow`, user knowledge unit: add one evidence line under `## Evidence`, change the claim only if the item
      changed it, commit the path by pathspec, then `fgos knowledge attest --doc-path <path> --capture-id <id>
      --locate-file <file>`. Build the locate file from the locate answer, giving `why_not` for each candidate read
      and not grown, and every mention with its handling (the verb refuses one without).
   6. `grow`, composite document (spec, contract, guide): edit the section only when the claim changes what it states,
      then run doc-health. Otherwise the claim is already carried (D3): record a non-engine decision that names
      `path#heading` and why nothing is added.
   7. `ask`: the decision-question template; resume with the answer.
   8. `create` / `no-place`: `fgos submit` an admission request, then `fgos knowledge handoff ... --decision
      create|no-place --locate-file <file>` (with the mentions' handling, as for grow). Never `fgos topic register`,
      `fgos doc reserve` or `fgos doc register` unless a person asked for that slot.
   9. Report the claim, the decision, the mentions updated, and the record written.
   Add a short "What this door cannot catch" note at the end of the fragment that links document identity section
   12 "Known limits of finding" rather than restating it.
   Keep the untrusted-input rule: drafted text and item text go through files, never raw into a shell line.
2. Knowledge skill: replace flow steps 2 and 3 with "follow `../_shared/write-door.md` for each claim". Keep
   step 1 (state the claims, or record "nothing reusable"), step 4 (move to cleanup), the hard rules and the red
   flags that are specific to retrospective items. Delete the `rg` search and the "when it lands" sentence.
3. `docs/platform/documentation/operations/how-a-document-is-written.md`: where it restates the steps, link to the
   fragment. Keep the fgOS-specific worked examples. Replace any `rg` locate step with `fgos doc locate`.
4. Run `npm run build:skills` and commit the regenerated copies with their sources.
5. Proof point for validating: run steps 1.1–1.4 on one real claim drafted from the current retrospective pool
   (`fgos list --status retrospective`). Note in the phase's commit message body, without the item text: the
   candidate count, the mention count, how many were `missedBySearch`, and whether reading them changed the
   decision.

## Verify

```bash
rg -n "rg -l" domains/coding/skills/fgos-coding-knowledge/SKILL.md   # no output
rg -n "missedBySearch|--exact|handling" core/skills/_shared/write-door.md
npm run build:skills && git diff --exit-code -- .agents .claude plugins
node scripts/doc-health.mjs
```

Pass: no `rg` corpus search left in the skill; the fragment covers mentions, `--exact` and handling; regenerated
copies match the committed ones; doc-health is green.

## Rollback

Revert the phase commit and run `npm run build:skills`. The skill returns to its `rg` flow.
