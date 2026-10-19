# Review A38 Step 0 author/accounting, part 03

- Reviewer: reviewer:sonnet-session:af5f851222a418bb1@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, detached HEAD b1e7aec1a (ACCOUNTING); AUTHOR a2e8634df
- Part: plans/260925-documentation-authority-unification/reports/phase-08/step-00-author-review-part-03.json, sha256 2f4db02d60968c28723ca724a62dee4e6a10cb266dab14c661e4c8505d4397b3 (9 entries, all kind=binding; no exception/merge entries in this part)

Method, applied to every entry: current row at HEAD equals embedded `after`; reviewStatus pending; claimId, sourcePath, sourceUnitDigest, disposition, targetOwner, authoredBy unchanged vs `before`; sha256(oldPassage.text) == oldPassage.textDigest == before.targetUnitDigest; sha256(resolvedPassage.text) == resolvedPassage.textDigest == after.targetUnitDigest; old text occurs exactly once in `git show 49ad04648^1:<owner>` and new text exactly once in HEAD `<owner>`; for markdown owners the production extractor (`extractMarkdownConservationUnits` in scripts/generate-doc-inventory.mjs) run on both revisions yields the old anchor with the old digest and the new anchor with the new digest, with identical heading ancestry; line-diff of old vs new passage inspected.

| Entry | Row | Old -> new anchor | Evidence | Verdict |
| --- | --- | --- | --- | --- |
| binding-074 | s5-root-authorities-boundary-gaps registryGaps[2], distribution.md | unheaded-block-5 -> unheaded-block-5 | Same Data Dictionary table (header, numbered rows); old rows retained as prefixes of new rows (5g, 7, 7b extended); new rows 5h, 7c-7g added. Lines 57 unchanged. Digests recompute. | ok |
| binding-075 | s5-root-main-recarry registryGaps[0], architecture-manifest.json | file-block -> file-block | Whole-file single unit; same contract/map/layers/rules keys, module inventory and layer entries changed. Digests recompute (sha of full text). | ok |
| binding-076 | s5-root-main-recarry registryGaps[1], architecture-manifest.json | file-block -> file-block | Same as 075 (different claim, own sourceUnitDigest unchanged). | ok |
| binding-077 | s7-step09-main-import-accounting claims[12], activation-binding.md | unheaded-block-15 -> unheaded-block-19 | Old text byte-identical in new file (sim 1.000, count 1); extractor maps it to block-19; ancestry identical (Retained Runtime Identity ... / 6. WorkspaceActivationBinding); targetAncestry newly recorded. | ok |
| binding-078 | s7-step09-n1-holder-lock-predecessor registryGaps[0], holder-lock/spec.md | unheaded-block-1 -> unheaded-block-1 | Opening metadata fence; only diff is `Last reviewed: 2026-10-16` -> `2026-10-17`. | ok |
| binding-079 | s9-runner-01 registryGaps[19], runner.md | unheaded-block-314 -> unheaded-block-315 | Byte-identical passage (sim 1.000, count 1), line 3116 -> 3130, same ancestry (0047 section). | ok |
| binding-080 | s9-runner-01 registryGaps[20], runner.md | unheaded-block-315 -> unheaded-block-316 | Same, line 3129 -> 3143. | ok |
| binding-081 | s9-runner-01 registryGaps[21], runner.md | unheaded-block-320 -> unheaded-block-321 | Same, line 3196 -> 3210. | ok |
| binding-082 | s9-runner-01 registryGaps[22], runner.md | unheaded-block-317 -> unheaded-block-318 | Same, line 3151 -> 3165. | ok |

Totals: 9 entries, ok 9, rework 0.

## Observations (not rework)

- Rows 079-082 lose `evidenceDigest` and `acceptanceScope` in `after`. The same drop happens uniformly for all 6 such rows across parts 3 and 4; no rebound row keeps a digest of reviewed evidence tied to the old anchor (the reviewed decision in phase-06/step9-a42-predecessor-dispositions.json still names the old anchors, e.g. 314). This matches "no approval carry"; the rationale still cites that evidence file. I could not reproduce the old evidenceDigest by shell (not a plain hash of the decision/row JSON), so that digest was not recomputed.
- Added `reviewNote` on all rows and the appended "Step 0 AUTHOR ..." rationale suffix keep the old rationale as an exact prefix on every row.
- This part contains no merge-conflict or auto-merge exception entries, so the 49ad04648 parent/merge-base replay was not applicable here.

## Rework details

None.
