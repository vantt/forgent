# Review a38 step-03 wave5h, part p01

Reviewer: independent read-only semantic reviewer. No checker or probe scripts were run, and nothing was written to the worktree. I used pure-Python reads of the record and `git show`/`ls-tree` at pin `ae141550c2e022310de7a0efea757580c0b2479f`.

## File

- Path: `docs/platform/agent-coordination/history/documentation-migration/source-inventory.md`
- Set / stratum: batch-086, targeted re-review (the file changed under L12-53). It counts as the patched stratum of its set only in the sense that it was re-authored. The record has an empty diff and all 472 edges are preserve, so this is an unpatched-style file.
- **Verdict: ok**
- Edges reviewed: 472 of 472, in pages 1-100 through 401-472. They are 469 inventory edges plus the 3 author-added edges.
- Source read: whole file, 493 lines, 131125 bytes. The sha256 `6b314f37...84b855` equals the record digest and the index digest.
- Record line sha256 `1b99e84e...1ff4` (531789 bytes) equals the index binding. The diff is empty, matching the index diffSha for an empty string.

## Edge verification

**L12-53 added edges (3).** All three are correct.
- `author-wave5h-source-inventory-L40C181` matches `[documentation-governance.md](documentation-governance.md)`, line 40, cols 181-239.
- `author-wave5h-source-inventory-L40C244` matches `[documentation-standardization-plan.md](documentation-standardization-plan.md)`, line 40, cols 244-322.
- `author-wave5h-source-inventory-L44C5` matches `[Phase 7 completion](phase-7-completion.md)`, line 44, cols 5-48.
- Each span is the complete label plus destination, and the span text equals the pinned text.
- Each disposition is preserve, with timing none and no target. The two line-40 edges share unit `line-L40` and the line-44 edge has unit `line-L44`.
- All three destinations exist at the pin in the same directory (`documentation-governance.md`, `documentation-standardization-plan.md`, `phase-7-completion.md`). Line 40 sits inside the "Added in candidate" history-carrier note, and line 44 is the original Phase 7 completion pointer. Preserve is the right outcome under L12-38(5).
- The reasons make no false claim. They say "No current authority endorsement or runtime change".

**Boilerplate sentence.** "The verification-index navigation keeps its existing path" appears only on `maps-j-05219`, the line-34 link. I found 1 occurrence among the 472 reasons. 05219 is the one edge where it is true: `../../verification/README.md` resolves to `docs/platform/agent-coordination/verification/README.md`, which exists at the pin. The other 468 reasons no longer carry it.

**Source-locator edges (258 `docs/architect/**` plus 3 `docs/specs/**` = 261, col 1).**
- All 261 are preserve, as source-locator cells in the dated Phase 0 migration ledger (L12-21 / L12-26(5) / L12-38).
- Each target fact says "exists", and `ls-tree` at the pin confirms every path exists.
- The "tree retires at Phase 9" suffix appears only on these 261 paths, which is correct because they are under `docs/architect/**` and `docs/specs/**`.
- The 3 `docs/specs/**` edges are `docs/specs/runner.md` (05667, L307), `docs/specs/confinement-authority.md` (L308) and `docs/specs/distribution.md` (L309). None of them is retained as a live spec, and nothing is claimed to be retained.

**Target-column edges on `docs/platform/agent-coordination/verification/**` (207, col 5).**
- 189 are preserve with the state "exists", and each path is confirmed present at the pin ("current retained path stays literal").
- 18 are `maps-j-05670` to `maps-j-05687`, with state "renamed" at `9134ff4e5` (`docs: retire obsolete coordination documents...`). For all 18, the original path is absent at the pin, the successor path under `history/retired-engine/files/verification/...` exists, and the `git diff-tree -M` rename pair at 9134ff4e5 equals the recorded successor.
- The reasons for these 18 state the true fact, "renamed ... original source spelling conserved", and make no false "retained" claim.
- The matchedExpression equals the targetFacts path for all of them.

**Other checks.**
- All 472 span texts match the pinned lines, there are no duplicate spans, there are no multi-span edges, and the edge ids equal the inventory ids plus the 3 author ids.
- Every edge is preserve with timing none, anchor null and diffHunk null. The edge dispositions are uniform within each row and line unit, so there is no L12-34(3) unit conflict.
- No patch, row-flip or park exists in this file, so there is no description-truth, anchor or label-form exposure. The label-form, anchors and relativeResolution check sections are empty, which is consistent.
- A full-file scan found no uncovered reference to a retiring root (`docs/architect`, `docs/specs`, `docs/decisions`, `docs/how-to`, `docs/reference` and so on). No relative link other than lines 34, 40 and 44 exists.
- `plans/**`, `src/**` and `test/**` source paths are not legacy-tree references and need no edge.

## OUTCOME defects

None found.

## Record-text notes (not rework)

- The 3 added edges all carry the identical long reason text. It is accurate. It does not distinguish the line-44 link (Phase 7 completion pointer) from the line-40 carrier links, but that is acceptable.
- `maps-j-05219` uses the phrase "retained path" for `docs/platform/...verification/README.md`. That is true because the path is outside the retiring trees.

## Lead-judgment questions (no rework asserted)

1. **Stale candidate target paths without edges.** 25 target-column cells name candidate-tree paths that exist neither at the pin nor under their original name. 9134ff4e5 moved them to `history/retired-engine/files/...`. They are uncovered:
   - Lines 51, 52, 61, 64, 66, 67, 76-78, 87, 93, 96, 98, 100, 101, 103-111 and 443.
   - Examples: `docs/platform/agent-coordination/architecture/coordination-continuation-recovery.md` and `.../intent-preservation-ledger.md` (lines 87 and 443).
   - Rationale for no edge: these are not link targets and not explicit legacy-root paths, so L12-38(5) excludes dated-history coverage for them. The census also produced no edge for them. The result would be preserve in any case.
   - Inconsistency to note: the 18 renamed `.../verification/implementation-alignment.md` family paths do carry edges, because the census treats `agent-coordination/verification/**` as a retained legacy root. If Lead wants any removed target-column path covered, it would need a census or scanner extension. I did not count this as an outcome defect, since the disposition would be preserve and nothing in the outcome changes.
2. **Scanner limitation.** The author-added line-40 and line-44 edges depend on the unchanged scanner gap that the record states in `manualLinkCoverage`. I take no position on the checker, since I was told not to run it.

## Counts

- Set batch-086 (this file only): reviewed 1 file / 472 edges, rework 0.
- Stratum: the file has an empty diff (preserve-only), and it is also the targeted re-review file for L12-53. Reviewed 1, rework 0.
- No overlap with other parts. The edge denominator is 472: 469 inventory edges plus 3 author-added edges.

Status: DONE
Summary: Reviewed all 472 preserve edges of `source-inventory.md` (the whole 493-line source) against the pin. The 3 added whole-link preserves are correct, the boilerplate sentence survives only on 05219, and every "exists" and "renamed" target fact checked out against git. Verdict ok, 0 outcome defects, with one Lead-judgment note about 25 stale target-column paths that have no edge.
