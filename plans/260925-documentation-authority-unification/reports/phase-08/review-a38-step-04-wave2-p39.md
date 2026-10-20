# Review a38 — step 4 wave 2, part 39 (set step04-029, merge verb comments)

Pin dc24ce645. `src/verbs/merge/approve.mjs` read at every edge region plus a full grep of the file for `docs/`, `.md`, `CONTEXT` and `ADR`. The record diff is empty (no patch slots), so there is no behavior-change risk. `stepFiveExcluded` is `[]`. No runtime strings cite docs paths. The `ADR0020` at L536 is a decision id in a comment, not a path edge.

## src/verbs/merge/approve.mjs — set step04-029 — verdict REWORK (minor, successor note)
Slots reviewed: 8 slot rows across 5 edges (class6-l-000481, -000482 x2, -000483, -000484 x2, -000485 x2); all preserve.

- 000481 (L216 `docs/history/`, continued as `tsk-3bn-merge-conductor-harness-v2/`): the directory exists. ok.
- 000482 (L257-258 `docs/history/leaf-merge-into-resolved-root/ CONTEXT.md`): the directory exists and has CONTEXT.md. ok.
- 000484 (L431-432 `docs/history/merge-worktree-reclaim-clobbers-kept-checkout/ CONTEXT.md`): the directory exists and has CONTEXT.md. ok.
- 000485 (L440-441 `docs/history/ merge-ephemeral-branch-force-race/CONTEXT.md`): the directory exists and has CONTEXT.md. ok.
- OUTCOME DEFECT, class6-l-000483, source line 311: `// Trunk-boundary scoping (docs/decisions/0032, tsk-1y6-1 D1)`. The record preserves it with the generic reason "Retained native path, literal example or captured contract reference" and has no successor note.
  - `docs/decisions/` is the retired corpus: only `index.md` remains at the pin, with no `0032*.md` file, so the cited path is dead.
  - The authoring rule is that removed decision ids get title-matched successor notes, as the owner-answers disposition additions and Step 2 successor-lookup rule describe.
  - The sibling record in part 34 (resolve.mjs 000276, `docs/decisions/0033-...md`) does carry that note, so the treatment is inconsistent.
  - The successor exists: `docs/platform/runner/decisions/h-36d872fbb0e5.md` L1095 `### 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người`. Its subject matches the comment (Iron Law gate scoped to the trunk boundary). Do not use `work-state/decisions/retired-decision-history.md` `### 0032 …`, which has several unrelated 0032 titles.
  - Correction: keep `preserve` (retired decision-id citation in a comment) but replace the reason with the retained-literal/dead-path reasoning and add the non-executable successor note `docs/platform/runner/decisions/h-36d872fbb0e5.md#0032-…` (title above). Alternatively use a comment-only Phase 9 patch to that path. Preserve plus note is the form used elsewhere.
- Missed references: none. `CONTEXT.md D1` / `CONTEXT.md Deferred` / `tsk-4voj-iron-law-leaf-scope CONTEXT.md` (L72, 184, 293, 296, 900) are bare filenames and not edges.

## Record-text notes (not rework)
- The 0033 successor note in the sibling resolve.mjs record uses the anchor `#0033-capacity-cli-spawn-shaped-thắng-...`. The heading has an em dash, so a GitHub-style slug would be `0033--capacity-...` (two hyphens). Check the anchor convention when notes are finalized, and use the same convention for the new 0032 note. I found no existing link to that file to confirm either form.

## Lead-judgment questions
- Whether a missing successor note on a `preserve` slot counts as an outcome rework or a record-text fix. I counted it as rework because the consistency rule requires the note. If you count it as record-text, the file is ok and the set is 0/1.

## Counts
- Set step04-029: 1 file reviewed, 1 rework (as counted above; 0 if the note counts as record-text). 1/1 > 3%, which expands the set to every file. The set has one file, so the expansion is complete.
- Slots: 8 reviewed (8 preserve, 0 parked, 0 patch).

Status: DONE
