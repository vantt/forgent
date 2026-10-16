# Review step 10 re-review links part 1 (per-cell link semantics)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792093168554-f28af963@2026-10-16
Review mode: ordinary
Request commit: c939e9a51560a124e3723ba69ce39a202a1b7efc
Content commit: 345f15d95663260976200be66d1b9a6c648bcd6d

## Scope and method

Request reviewed: review-request-step10-links-01-345f15d95.md (9 position-specific-link-cell-fix entries; md blocks equal the json sidecar). Read-only worktree at c939e9a51 (docs bytes equal 345f15d95); no sensitivity pack requested or made. There are no claim rows, so each entry gets one item row with the entry id as first cell.

Checks: (1) git diff 4a18f35ff to 345f15d95 for the three files: only the six link substitutions in source-preservation-audit.md lines 41-43, the two links of work-state/README.md line 61 and one cell of legacy-payload.md line 57 changed, nothing else on those lines; (2) each after-link was compared with the same position in the first-authored file (05b6bf861 for host-invocation files, f0cadf365 for work-state README) and equals it byte for byte; I also parsed all six Source Coverage Matrix rows of the audit (cells 1 and 3) at HEAD against first-authored: 6 of 6 identical; (3) the table headers (Legacy source, Preservation target) and cell numbering match the entries' cell numbers; (4) destinations exist; (5) step10-sync345-link-replay.json exists with 366 original and 98 later rows and 0 findings, as the pack states; (6) the three systemic defect classes were checked for these files: swapped cells (fixed), kept-by-position anchors (not applicable), boilerplate (not applicable).

Seed and sample: all 9 entries were read in full (A36 minimum is met by reading everything; no Weak-exact or Judgment rows are in this request, so no seed draw was needed; recorded seed for the extra whole-file parse: v4-links-345f15d95, not used for selection).

Result: 9 ok, 0 rework, 0 hold.

## Item table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| cell-1-0 | ok | deep: source-preservation-audit.md line 41, Legacy source column (cell 1): link and label now external-provider-protocol.md to ../../../architect/host-invocation-routing/external-provider-protocol.md; cells 1 and 3 of all six matrix rows are byte-equal to the first-authored 05b6bf861 file, so the earlier cell swap is undone; diff 4a18f35ff to 345f15d95 changes only the six links of rows 41-43. | none | none |
| cell-1-1 | ok | deep: same row, Preservation target column (cell 3): link back to ../architecture/external-provider-protocol.md with its own label, equal to the first-authored bytes; the other five links of the cell are untouched; target file exists. | none | none |
| cell-2-0 | ok | deep: line 42 legacy-cli-transition row, Legacy source cell holds the architect destination with label legacy-cli-transition.md, identical to first-authored 05b6bf861; no other text on the line changed. | none | none |
| cell-2-1 | ok | deep: line 42 Preservation target cell leads with ../architecture/legacy-cli-transition.md (label and destination), identical to first-authored; the previous round's cell swap is gone. | none | none |
| cell-3-0 | ok | deep: line 43 node-to-rust row, Legacy source cell holds label node-to-rust-component-migration.md to the architect destination, identical to first-authored (the legacy and platform filenames differ here and both labels are the verbatim first-authored ones). | none | none |
| cell-3-1 | ok | deep: line 43 Preservation target cell leads with ../architecture/node-to-rust-migration.md with its own label, identical to first-authored; destination exists. | none | none |
| cell-4-0 | ok | deep: work-state README line 61: retained-source slot is [docs/work-item-lifecycle-vision.md](../../work-item-lifecycle-vision.md) and exists (docs/work-item-lifecycle-vision.md); the whole sentence equals the first-authored f0cadf365 and aecdc30aa bytes, undoing the 2300d6557 and 19ca8de23 swaps; only the two links of that line changed in the diff. | none | none |
| cell-4-1 | ok | deep: same sentence, platform vision candidate slot is [vision.md](../vision.md) which resolves to docs/platform/vision.md (exists); verbatim first-authored, so the retained source and the candidate are no longer exchanged. | none | none |
| cell-5-0 | ok | deep: legacy-payload.md line 57, row 'legacy transition' (a bare legacy name is not a source label) now points to ../architecture/legacy-cli-transition.md as first authored at 05b6bf861 and in 08429d74b, aecdc30aa and 2300d6557; the separate 'source transition' row still keeps the architect link; only this one cell changed in the diff. | none | none |

## Notes

- The tool support for these edits is reviewed in the tools report: replayLinks in doc-binding-repair.mjs can only replay destination edits, not the label changes in cell-1-0 to cell-3-1, so the three-file corrections rest on the byte comparison with first-authored files that I did, not on the helper.
- The wider claim that no other table has swapped source and target cells was not re-proved here; this request covers only these three files.

Unresolved: none.
