# Review a38 step-03 wave5a part p01

Pin ae141550c. Six files, 18 edges, all read whole. Records read per field with the extractor (no checker or probe run). Diffs were checked against the pinned source lines and against the targets at the pin. Result: 0 outcome defects, 6 of 6 files ok.

## Per-file verdicts

| # | Set | Stratum | File | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | batch-079 | unpatched | docs/knowledge/why-fgos-s-automatic-capture-records-the-what-but-not-the-wh/fgos-capture-points-and-the-why-gap.md | 4 | ok |
| 2 | batch-079 | patched | docs/knowledge/why-fgos-treats-self-development-as-a-bounded-lane-with-its/why-fgos-self-development-is-not-the-default-mission.md | 5 | ok |
| 3 | batch-079 | patched | docs/knowledge/why-herdr-cockpit-stacked-worker-launches-into-a-single-reus/why-herdr-cockpit-stacked-worker-launches-into-one-pane.md | 4 | ok |
| 4 | batch-079 | unpatched | docs/knowledge/why-keywordriskgate-now-skips-the-heavy-risk-ask-when-a-verd/keywordriskgate-skips-when-verdict-cites-a-locked-decision.md | 2 | ok |
| 5 | batch-080 | unpatched | docs/knowledge/why-mergereadiness-excludes-superseded-items/why-mergereadiness-excludes-superseded-items.md | 1 | ok |
| 6 | batch-080 | patched | docs/knowledge/why-ppidof-bounds-its-ps-call-with-a-200ms-timeout/why-ppidof-bounds-its-ps-call-with-a-200ms-timeout.md | 2 | ok |

## Edge findings

1. **Files 1, 4, 5 (empty diffs).** Every edge preserves.
   - Edges 04827-04830 (file 1), 04889-04890 (file 4) and 04908 (file 5) point into `docs/history/**`, or are an illustrative `<feature>` or `*` pattern.
   - The `docs/history` paths exist at the pin, are retained, and have no alias-table entry. A literal preserve is right.
   - 04827 and 04829 are illustrative-pattern preserves. Their placeholders are not real paths, which is what the record says.
   - 04908 is inside a fenced js block (captured code). The path is wrapped across two lines.
     - The extractor matched only the truncated first line, `docs/history/tsk-2ie-duplicate-superseded-`.
     - The real directory `docs/history/tsk-2ie-duplicate-superseded-guard/` exists and is retained. Preserve is the right outcome.
2. **File 2.**
   - 04850 (L19) patches `docs/decisions/0030` to `docs/platform/runner/decisions/h-36d872fbb0e5.md#0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm`.
     - The heading is at line 921 of that file. The anchor equals the `list-doc-anchors.mjs` output.
     - The deleted `0030-them-release-con-nguoi-...` title matches the heading.
     - The adjacent description (four priorities) matches the target's ordering.
     - The diff replaces only the token. Correct.
   - 04849 (L15) and 04851 (L40-41) park as GAP-02 and are correct.
     - The title-matched 0035 narrative ("Xác lập ranh giới sứ mệnh") exists only in `docs/specs/platform-foundations.md:266`.
     - The runner holder's 0035 is a different decision (mutation-gate trust boundary). The record did not bind to that sibling.
   - 04852 and 04853 (L49-50) preserve a `Source:` / `Verify:` command naming the removed 0035 file. This is a captured verification input, and the removal is recorded at 4270c0c0d.
3. **File 3.**
   - 04876 (L13) patches the old `docs/explanation/worker-slot-is-the-engine-owned-...` path to the `docs/knowledge/worker-slot-concept-and-engine-wide-worker-occupancy-ceiling/...` holder.
     - The old path does not exist at the pin. The holder exists and is the worker-slot concept doc. It covers tsk-2sj, herdr-plugin and a post-merge review at its L289.
     - The reason handles the source's "three defects" against the target's "six defects" truthfully.
   - 04877, 04878 and 04879 preserve `docs/history/...` paths. All exist at the pin.
4. **File 6.**
   - 04916 (L63) patches to the `docs/knowledge/why-claimwork-s-cas-reread-...` holder.
     - The old path does not exist at the pin. The holder exists and is the tsk-3jh CAS-reread document.
     - The "same instability scan" claim holds: the scan report line 530 carries the same 274ms and 7-read measurement.
     - The diff replaces only the path.
   - 04915 preserves the existing `docs/history/tsk-13m-...` path.

## Outcome defects

None.

## Record-text notes (not rework)

- 04908 reason says "Source path never existed in author-pin ancestry: docs/history/tsk-2ie-duplicate-superseded-". That is true only of the truncated line-wrapped fragment. The full directory `...superseded-guard/` exists at the pin. The outcome (preserve) is unaffected.

## Lead-judgment question

- File 1 L109 (bare "decision `0014`") and the file's STR references carry no path form, so no edge was authored. The scanner appears to be path-driven. If bare undated decision ids in live knowledge files count as edges for the 0014 carry park, this file would need one. I did not treat it as a defect, because the record rules seen (L12-38) tie that case to docs/specs citations.

## Counts

| Set | Stratum | Reviewed | Rework |
|---|---|---:|---:|
| batch-079 | patched | 2 | 0 |
| batch-079 | unpatched | 2 | 0 |
| batch-080 | patched | 1 | 0 |
| batch-080 | unpatched | 1 | 0 |

No overlaps across strata. Part total: 6 files and 18 edges reviewed, 0 rework.
