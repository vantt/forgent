# Phase 2: the knowledge skill states claims and adds evidence

## Context

`domains/coding/skills/fgos-coding-knowledge/SKILL.md` today resolves a topic from the capture, reserves a slot, writes a document, attests, marks rendered. Its re-attest branch exists but is the exception. Write door 6.4 makes growth with evidence the default.

## Requirements

New flow, per retrospective item:

1. **State the claims.** One to three, each one sentence: a fact, rule, failure mode, decision or procedure. An item that showed nothing reusable says so in one sentence and records it as a non-engine decision through the existing decision door (a real judgement, as today).
2. **Locate each claim.** Draft the paragraph the writer would add, in English. Until `fgos doc locate` exists (build step 3), search with `rg -l -i` on two or three distinctive terms of the draft over `docs/knowledge`, `docs/explanation`, `docs/how-to` and the registry listing, then read the best three to five candidates. The skill names `fgos doc locate` as the replacement.
3. **Grow with evidence** when a candidate carries the claim:
   - add one line under the unit's `## Evidence` section (create the section at the end if absent): `- YYYY-MM-DD <item id>: <what this item showed, one line>` plus the decision or incident id when there is one;
   - change the claim's statement only if the item changed it;
   - commit by pathspec, then `fgos knowledge attest --doc-path <currentPath> --capture-id <id>`.
4. **Hand off** when no candidate carries it: `fgos submit` an admission request item titled `Admission request: <claim>` whose text links the retrospective item; then `fgos knowledge handoff` with the claim, the material and the locate result (phase 1). Never `fgos topic register` or `fgos doc reserve` unless a person asked for that slot.
5. Move the item to cleanup.

Hard rules kept: no raw item text spliced into shell; no automatic promotion; write and commit before attest.

## Files

- `domains/coding/skills/fgos-coding-knowledge/SKILL.md` (source; never edit the rendered copies).
- regenerated render surfaces through `npm run build:skills`, committed with the source.
- `docs/platform/documentation/subcomponents/write-door/spec.md` 12 (alignment row for 6.4: implemented).

## Steps

1. Rewrite the skill as above; keep it short (the always-loaded budget does not apply, but the skill is read at every retrospective).
2. `npm run build:skills`; `git diff --stat` to confirm only the skill's surfaces changed.
3. Run the skill-surface tests that own rendering (`rg -l "fgos-coding-knowledge" test`).

## Validation

- Dry run on one real retrospective item in a linked worktree: the item reaches cleanup through attest or handoff, and no `topic.register` or `doc.reserve` event is written.

## Risk

The interim locate is weaker than pkm with OHS (arm A: 50% right decisions in the trial against 73%). Most of the gain here comes from the default changing from "reserve" to "grow"; the stronger locate follows in build step 3.
