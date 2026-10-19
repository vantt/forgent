# Review a38 step-03 wave1 expansion p01

Pin ae141550c2e022310de7a0efea757580c0b2479f. Read-only. No checker or probe was run.

## docs/doc-governance.md (batch-002 line 2, unpatched)

Verdict: **ok**. 8 edges reviewed, 0 outcome defects. Diff is empty, and that is correct (no executable patch before Phase 9).

I read the whole 475-line source and the whole record, including all 16 legacy-scan exclusions and the search witness for 01904.

| edge | line | disposition | check |
|---|---|---|---|
| maps-j-01902 | 9 `Provenance: Promoted from docs/architect/documentation-system-design.md` | preserve | Provenance lines preserve (L12-34(4)). The successor note names doc-governance.md, not the edge path, so it is valid under L12-34(8). |
| maps-j-01903 | 16 Related `docs/reading-map.md` | preserve | Retained root, exists at the pin, and the Related target survives Phase 9. Correct. |
| maps-j-01904 | 20 Related `docs/architect/documentation-system-design.md` | parked, phase9-carry | Related entry with a retiring target. The live holder is the consumer itself: the file's own Provenance (line 9) says it was promoted from that design. The only other holders are carriage candidates (see below). Parking as duplicate matches L12-34(4), which names 01904 explicitly. Correct. |
| maps-j-01905, maps-j-01906 | 95-96 "During migration, existing `docs/specs/**` and `docs/architect/**` remain valid legacy/current sources" | phase9-row-flip (both) | One unit (line-L95), one disposition, and the same replacement text and dependency. This is a present-tense migration-state paragraph naming both retiring roots, so a flip is right. The edge spans cover only line 95; line 96 has no path. Correct. |
| maps-j-01907 | 470 `[README.md](README.md)` | preserve | Resolves to retained docs/README.md. Correct. |
| maps-j-01908 | 471 `[reading-map.md](reading-map.md)` | preserve | Resolves to retained docs/reading-map.md, not docs/specs/reading-map.md. Correct. |
| maps-j-01909 | 475 `[architect/documentation-system-design.md](...)` in Related Files table, labelled "source design discussion" | preserve | The row labels itself as source lineage, so L12-26(5,8) and L12-30(3,5) apply. The candidate carrier docs/platform/documentation/architecture/documentation-system-design.md has "Design status: Candidate" and "Implementation: Source snapshot retained". The reason's claim about it is true. See question Q1. |

Tree-relative scan: lines 353, 456-457 and 472-474 (and the sibling `platform/...` links) resolve to candidate or retained files. `platform/proposals/documentation-system-unification.md` (line 463) exists. `docs/transitional-switchboard.md` is a retained root. No resolution reaches a retiring file other than the 20/475/9 hits already covered. I found no missed reference. Lines 49-60 and 67-69 are target-layout filenames under docs/platform, so excluding them is right. Lines 91-93 and 309-310 are candidate paths, not retiring roots.

Previous reviews: u01-u04 and p01-p03 list no defect for this file. u01 and u03 mention it only as a retained-root target of other files.

### Record-text notes (do not count as rework)
- 01904 reason and blockedReason say the holder "is the consumer itself or already listed". This is boilerplate. For this file it is the consumer itself, so the record could say that.
- 01909 reason is one run-on string. The L12-30 successor note is concatenated after the source passage, and the L12-30 text sits in the middle of the source passage. It reads awkwardly, but the facts are correct.
- 01902 and 01909 reasons carry a "Non-executable file-level successor note" with no per-edge target. That is acceptable.

### Lead-judgment questions
- **Q1 (consistency within the file).** Line 20 (Related header, same retiring target) is parked as a duplicate with "preserve provenance separately". Line 475 (Related Files body table, same target) is preserved as lineage. L12-34(4) governs "Related: header entries". 475 is a body table, labelled "source design discussion", so preserving it is defensible, and I accept it. Two lineage carriers also remain (line 9 and 475). If the Lead wants one rule for every Related-type listing, 475 should park as a duplicate too, and its reason would change. I count it as ok because the label states source lineage and the checker accepts it.

## Set counts
Set batch-002 (this part): 1 file reviewed, 0 rework, 8 edges reviewed, 0 outcome defects.
