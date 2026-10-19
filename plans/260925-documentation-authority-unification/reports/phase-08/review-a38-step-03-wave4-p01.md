# Review a38 step-03 wave 4, Part 01 (batch-070 sample)

Pin `ae141550c2e022310de7a0efea757580c0b2479f`. Worktree `/home/vantt/projects/forgentX-s8-review` (read-only). No checker or probe run; no writes outside the scratch dir.

## Method

- Read owner-answers L12-26, L12-30..L12-38 and the progress.md authoring-rules digest.
- For each file, loaded the record from `step-03-records/batch-070.jsonl` with python3 and printed per-edge fields only: edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blockedReason/Category, dependency/Category, targetFacts. The checks sections were printed too: coverage, legacyScan, anchors, relativeResolution, labelForm. The diff was printed separately.
- Read every file whole from `git show <pin>:<path>`. The largest is 51 lines (about 17 KB), so no outline-only reading was needed.
- For decision-record.md, I wrote my own regex scan of every `docs|specs|architect/...`, `*.md`, `decisions/NNNN`, `.fgos` and `test/` token in the source. I compared the scan to the edge spans per line: complete match, no missed reference.
- Verified with git:
  - the `docs/history/**` targets exist at the pin;
  - `docs/history/learnings/critical-patterns.md` was deleted at e999986 with no rename;
  - the removed decision files were deleted at 4722361ae / 4270c0c0d with no rename;
  - 4ee0e3a3c is an ancestor of the pin and is the rename copy;
  - the patch targets exist and carry the cited heading and content.

## Per-file verdicts

| # | File | Set / stratum | Edges | Verdict |
|---|---|---|---:|---|
| 1 | `docs/knowledge/close-out-a-decomposed-root-item-after-all-its-children-are/close-out-a-decomposed-root-item-after-all-children-are-done.md` | batch-070 / unpatched-seeded | 1 | ok |
| 2 | `docs/knowledge/decisions-index/decision-record.md` | batch-070 / mandatory-threshold | 75 | ok |
| 3 | `docs/knowledge/fgos-cook-worktree-claim-before-drive/fgos-cook-worktree-claim-before-drive.md` | batch-070 / patched-seeded | 3 | ok |
| 4 | `docs/knowledge/fgos-researching-s-d2-fan-out-rule-verified-live-on-a-real-d/fgos-researching-d2-fanout-verified-live.md` | batch-070 / unpatched-seeded | 1 | ok |
| 5 | `docs/knowledge/fgos-s-layered-architecture-is-a-live-tested-invariant-not-a/layered-architecture-invariant.md` | batch-070 / patched-seeded | 4 | ok |

84 edges reviewed (1+75+3+1+4). No file is `retiresWithTree`.

## Edge notes

1. **close-out, 04146 (L19):** preserve of the `docs/history/tsk-3bn-merge-conductor-harness-v2/` directory.
   - It exists at the pin, and `docs/history/**` stays as immutable history (plan.md line 86, phase-06 line 50). The reason is true.
   - The source passage is a live "Update" header that cites the directory as provenance. Preserve is right, and there is no alias.
   - The scan has no other legacy hits.

2. **decision-record, 75 edges (L15-51):** all preserve, no diff. They sit in a frozen rename copy (L12-26(4)), historically preserved.
   - Coverage is complete. Every `docs/architecture-map.md`, `docs/specs/<area>.md` and `docs/decisions/NNNN-*.md` token on L15-51 has an edge, including the elided `docs/decisions/0035` on L21 and the two `architecture-map.md` hits on L15.
   - Exempt tokens are true exemptions: `AGENTS.md` (L22/29/33), `.fgos/` (L25/41/48) and `test/docs/rul11-anchor-phrase.test.mjs` (L22, a code/test path).
   - Targets exist or are removed as stated. Spot-checked deletes, none with a same-commit rename: 0010, 0001, 0032, 0035 and 0034. 0035 and 0034 were deleted at 4270c0c0d; the rest at 4722361ae.
   - Successor notes are present where a `### NNNN` heading exists in a candidate decisions file:
     - runner 0005, 0008, 0020-0023, 0025, 0026, 0028-0034 and 0035 (the note's content is discussed below);
     - work-state 0002-0004, 0006, 0007, 0011-0013, 0019, 0024, 0027 and 0032.
   - I grepped candidate headings for 0001, 0009, 0010, 0014-0018. None exist as decision headings. The only hit is a non-decision section title in `documentation/history/id-systems-audit.md` (0017). The omission of notes there is correct.

3. **fgos-cook, 3 edges:**
   - 04232 (L56) and 04234 (L96): preserve `docs/history/fgos-coding-shaping-branch-isolation/` and `docs/history/fgos-cook-branch-isolation/`. Both exist at the pin and stay as history.
   - 04233 (L88): patch, Phase 9, to `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md#verify-trông-thế-nào`.
     - The source path is absent at the pin.
     - The registry alias maps it to this holder.
     - The target heading `## Verify trông thế nào` is at L26: `npm test && POSITIVE && NEGATIVE`.
     - The adjacent description ("two-sided skill-prose shape", with a positive grep and a negated grep) matches the target.
     - The diff is applicable, and the backtick `path#anchor` form is conserved.

4. **d2-fanout, 04249 (L78):** preserve of `docs/history/dispatch-fanout-research-dogfood/RESEARCH.md` (exists at the pin).
   - The path sits inside a past-tense quote of the item's own verify command, so it is history.
   - The scan has no other hits.

5. **layered-architecture, 4 edges:**
   - 04250 (L17) and 04253 (L89): preserve `docs/architecture-manifest.json`. The root authority is retained; the Phase 6 area map places a verbatim candidate copy, and no alias retires it. Outcome is correct.
   - 04251 (L54): patch, Phase 9, to the `docs/knowledge/why-docs-enduser-docs-index-json-needed-a-doctor-check-not-j/...` holder.
     - The source is absent at the pin, and the registry alias maps it to this holder.
     - The target is the complete tsk-1m0 doctor-check explanation, which matches "the doctor check for stale end-user doc indexing".
     - Anchor null with a whole-file justification is true: the citation names the whole artifact.
     - The diff is applicable and the form is conserved.
   - 04252 (L87): preserve of `docs/history/learnings/critical-patterns.md`. It was removed at e9999863 with no rename, and the successor is none.
     - The `**Source:**` provenance line is quoted history. Preserve with a true removal fact is right.

## OUTCOME defects (rework)

None. All 84 edges have a correct disposition, target and anchor. All 84 reasons agree with the pinned facts (but see the 0035 note below). All diffs are correct. The one diff, for fgos-cook 04233 and layered-architecture 04251, is applicable.

## Record-text notes (not rework)

- **Boilerplate error in 04250 and 04253** (layered-architecture): the reason says "tree retires at Phase 9" for `docs/architecture-manifest.json`. That file is a retained root authority, not under `docs/specs/**` or `docs/architect/**`, and it has no alias.
  - The preserve outcome is correct. Only the sentence is wrong. It should say it is retained, with a verbatim candidate copy at `docs/platform/contracts/architecture-manifest.json`.
  - The same wording was accepted for batch-065 edge 03896. Other batches (001, 033, 041) say "retained".
  - A text-only fix, consistent across records, would be good.
- **Successor note for the 0035 rows (04163, 04164, decision-record)** names `docs/platform/runner/decisions/h-36d872fbb0e5.md#0035-ranh-giới-tin-cậy-của-cổng-mutation-gate-...`.
  - That heading is the runner spec's own decision numbered 0035 (mutation-gate trust boundary).
  - The source row's D-ADR0035 is the mission-boundary decision "Xác lập ranh giới sứ mệnh". Its narrative lives in `docs/specs/platform-foundations.md` (GAP-02, no candidate holder).
  - So the note, computed by number match, points to a different decision of the same number. A non-executable note can mislead.
  - The preserve outcome is unaffected.
- **Notes for the 0032 rows (04191 runner Iron Law, 04223 Team Harness)** list every `### 0032` heading across both runner and work-state files. Each row is only one of the two distinct decisions numbered 0032.
  - 04191 (Iron Law) carries the work-state 0032 notes, which are unrelated. 04223 (Team Harness) carries the runner Iron Law one.
  - They are over-inclusive but harmless.
- **Notes for 0013 and 0027 rows** include sub-section anchors (`0013-trust-boundary`, `0027-consumer-audit`) beyond the main holder. Same over-inclusion, harmless.

## Lead-judgment questions

1. The 0035 successor-note collision, above. Should the checker-computed rule for numeric-collision cases (the same NNNN in different specs) be narrowed so a successor note only names the holder whose title matches the source? That would drop the wrong note on 04163/04164 and leave the platform-foundations/GAP-02 carry. I treat this as a record-text improvement, not an outcome defect, under L12-38(3), which says the note is checker-computed from any `### NNNN` heading in a candidate decisions file.

## Counts

| Set | Stratum | Reviewed | Rework |
|---|---|---:|---:|
| batch-070 | patched-seeded | 2 / 2 | 0 |
| batch-070 | unpatched-seeded | 2 / 2 | 0 |
| batch-070 | mandatory-threshold | 1 / 1 | 0 |

This part's distinct union is 5 files / 5 reviewed / 0 rework, 84 edges reviewed. Overlap: none within this part.

Not run, per the request: the checker, probes, fgos CLI, tests, cargo. No acceptance is claimed. The Lead owns accounting.
