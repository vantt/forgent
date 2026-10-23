# G7 batch g7-c3 review (docs/knowledge/** second half)

Review commit: 8a9385eca (/home/vantt/projects/forgentX-s8-review, clean apart from untracked target-review/). Scratch: /tmp/fgos-work/g7-g7-c3/.

## Counts

- Specs: 68
- APPROVE: 68
- REWORK: 0

## Checks run (my own runs, not the author's roundtrip)

1. Hash: sha256(file@8a9385eca) == beforeSha256 for 68/68. The batch file and step-07 spec agree.
2. Round trip: `patch --batch --fuzz=0 -p1` forward gives expectedAfterSha256, and rollback gives beforeSha256 again, for 68/68. No .rej or .orig files.
3. Semantics:
   - Normalized whole-file comparison: whitespace removed and every backtick `docs/...` span masked. Before and after match for 68/68, so nothing changed except citation paths. Line rewraps keep their list and blockquote prefixes.
   - The diffs add 106 new citation spans. Every one exists at the review commit.
   - 42 of those spans carry an anchor. All 42 pass `node scripts/list-doc-anchors.mjs --check`, which is the repo's anchor authority. The anchors use the extractor's single-hyphen form, so a strict GitHub slug may differ for headings containing an em dash.
   - Every new span matches a step-03 `patch` edge exactly (same target and same anchor), recorded against the same file digest. The other direction also holds: all 116 patch edges are realized.
   - The old paths under docs/explanation, how-to and reference were already missing at the review commit, so those references were dead links and this fixes them.
   - The old `docs/specs/runner.md` and `docs/specs/work-state.md` references now point at the exact decision or rule-section holders. I spot-checked RUL34, RUL37 and RUL25, Data Dictionary row 6, and decisions 0026, 0031 and 0062.

## REWORK

None.

## Observations (non-blocking, outside this batch's specs)

- Legacy mentions remain in 21 of the files, for example #2 line 55, #16 lines 167/192, #33, #41, #49, #51, #52, #53 and #60. Each is covered by a recorded `preserve` edge (past-tense history) or a `parked` edge ("description needs rewrite", P8-DOC-GAP-02, a dead link). These belong to the G7 park composition or the G6 preserve review, not to these specs.
- #2 is a within-file inconsistency to watch. The same target appears twice: line 8 is patched, and line 55 is parked. After cutover the file still cites the retired path until the park lands.
