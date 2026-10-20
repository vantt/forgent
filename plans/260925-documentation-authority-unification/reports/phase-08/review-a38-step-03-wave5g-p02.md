# Step 3 wave 5g review, part p02

Pin ae141550c2e022310de7a0efea757580c0b2479f; worktree read-only at 9117e9cb6. No checker, probe or fgos CLI was run. I used only `git show`, python JSON extraction, and `scripts/list-doc-anchors.mjs` (read-only anchor listing).

## Verdicts

All 5 files are ok, with no outcome defects and 42 edges reviewed. Source sha256 prefixes equal the record digests, but that binds bytes only.

| Set | Stratum | File | Edges | Verdict |
|---|---|---|---:|---|
| batch-122 | mandatory-threshold (empty diff) | docs/platform/work-state/decisions/retired-decision-history.md | 15 (07915-07929) | ok |
| batch-122 | mandatory-threshold (empty diff) | docs/platform/work-state/spec.md | 17 (07935-07951) | ok |
| batch-121 | unpatched-seeded | docs/platform/vision.md | 4 (07874-07877) | ok |
| batch-120 | patched-seeded | docs/platform/ui-spec/architecture/modals/M02-approve-merge.md | 3 (07826-07828) | ok |
| batch-120 | patched-seeded | docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md | 3 (07829-07831) | ok |

None of the five is a retiresWithTree record. All are under docs/platform/** and carry per-edge dispositions.

Per set and stratum (reviewed / rework):
- batch-122, mandatory: 2 / 0
- batch-121, unpatched: 1 / 0
- batch-120, patched: 2 / 0

## File notes

### M02-approve-merge.md (07826, 07827, 07828)

- **07826, 07827:** preserve. The Provenance line and the Related bullet name the legacy `docs/ui-spec/modals/M02-approve-merge.md`. That file exists at the pin, docs/ui-spec/** survives, and the alias table is empty. This differs from the 07786 case: there the Related target is a retiring source; here it survives, so L12-34(4) preserve applies.
- **07828:** patch to `docs/platform/herdr-web-dashboard/spec.md#approve-a-merge`, timing Phase 9.
  - The heading exists (list-doc-anchors gives `approve-a-merge`, line 155).
  - The adjacent claim "the one operation … that changes trunk" matches target L163: "this changes trunk. It is the only operation on this surface that does".
  - The diff replaces only the path token and keeps the "§Approve a merge" label, which stays true.
  - No other legacy token is in the file.

### M03-add-edit-item.md (07829, 07830, 07831)

- **07829, 07830:** preserve, same reasoning as M02.
- **07831:** patch to `docs/platform/herdr-web-dashboard/spec.md#behaviors-operations`, the nearest common parent of the sibling "Add a work item" and "Edit a work item" sections.
  - The anchor `behaviors-operations` is confirmed by list-doc-anchors.
  - The adjacent claims hold: intake and edit verbs, and "same validation a terminal edit gets" (target Edit section).
  - The "§Add…, §Edit…" labels are kept and stay true.

### vision.md (07874-07877)

- **07874** (Related, L16) and **07875** (Related, L17): preserve. `docs/work-item-lifecycle-vision.md` and `docs/platform-foundations.md` are retained roots. Switchboard row 88 says "retained-source / non-authority"; the alias table is empty.
- **07876:** the Provenance preserve is correct.
- **07877:** phase9-row-flip for the table row "Legacy full law source | ../platform-foundations.md" (L92). It is migration-state, so L12-35(2) applies. The retained link stays literal, and the reason says to replace the row role and status, not the link.
- The scan exclusions for `intent-preservation-ledger.md` and `platform-foundations.md` resolve to existing docs/platform siblings (checked with ls-tree).

### work-state/spec.md (07935-07951; 1204 lines, 218 KB)

I read the outline, every edge region, the header and the Known Gaps / Related sections, and ran a regex scan of the whole file for legacy tokens.

- **07935 and 07950** (Related items `docs/specs/work-state.md`, the latter written as a link `../../specs/work-state.md` at L1203): parked as description-rewrite. The live holder is the consumer itself, so these are duplicate or self Related entries per L12-34(4). The Provenance line (07937, L18) is correctly separate and preserved.
- **07936 and 07951:** preserve. `docs/io-contract.md` is a root authority that survives (plan.md, switchboard row 83, empty alias table).
- **07938, 07943, 07944, 07946:** preserve. `docs/coexistence.md` is retained.
- **07942:** preserve. The distillery deep-dive exists.
- **07945:** preserve. docs/history/session-claim-liveness/CONTEXT.md exists.
- **07948:** preserve. The docs/decisions/ directory still holds index.md.
- **07939, 07940** (docsRef example row, L85) **and 07941** (docs/how-to/x.md, "vd"): preserve as illustrative.
  - `docs/history/<feature>/` is a pattern.
  - docs/history/p50-workflow-induct, docs/how-to/x.md and the install-coexistence canary-run path have no history in the pin ancestry (git log empty).
- **07947** (canary-run.md): preserve as an evidence citation ("canary pin sự thật này — …"), per L12-51(1).
- **07949** (docs/history/store-atomic-rmw/): preserve per 08351 under the explicit "Đã đóng … từng liệt ở đây, nay đã sửa" marker. The path never existed, but it is a completed-action evidence citation, not live navigation.
- **Whole-file scan:** the retained bare references `work-item-lifecycle-vision.md` (L435), `work-item-management.md` (L960) and `docs/enduser-docs-index.json` are not retiring paths. There is no missed legacy reference.

### retired-decision-history.md (07915-07929; 945 lines, 66 KB)

I read the header, the outline, every edge region and the scan candidates. The file declares "Canonical for: None; historical evidence" and its L25 framing says the ADRs are relocated verbatim. It is a history class file.

- **07915** (Provenance L14) and **07918-07920, 07922** (`docs/specs/work-state.md` inside verbatim ADR bodies): preserved as history.
  - The reasons quote the framing sentences.
  - The reasons say "tree retires at Phase 9".
  - The bare `work-state.md` tokens at L298, L547 and L550 are excluded by L12-38(5) (non-link token inside dated history).
- **07916, 07921:** `docs/decisions/` exists with index.md only. Preserved under the framing "Các ADR … di dời nguyên văn từ docs/decisions/ … corpus đó đã retired".
- **07917 (docs/architecture-map.md) and 07924 (docs/platform-foundations.md):** retained roots, preserved.
- **07925 and 07926** (docs/reference/triage-table-columns.md): preserved. The path was renamed at 126a8ae51 to docs/knowledge/fgos-triage-table-columns/triage-table-columns.md; I confirmed the rename commit and that the successor exists.
- **07923, 07927, 07928, 07929:** the docs/history targets all exist.
- No `00NN-*.md` basename references appear in the file.

## Outcome defects

None.

## Record-text notes (not rework)

1. **Successor notes in retired-decision-history.md.** The preserve reasons for 07915 and 07918-07922 cite "tree retires at Phase 9" but name no non-executable successor (docs/platform/work-state/spec.md). L12-37 and L12-35(3) say a live successor should be named where one exists. 07926 does carry a successor note. The checker passed, so this is optional.
2. **Pathless migration-state text in vision.md.** The carried source fence at L97-104 holds pathless migration-state text ("Vision source retained during migration", "Do not use this legacy file for: Current canonical platform navigation"). No edge or row flip was recorded for it. It sits inside the carried source header and names no path, so I treat it as a non-edge. L12-51(4) pathless-status carry applies explicitly only to the switchboard and reading-map.
3. **Rule labels in 07949.** The reason cites "L12-41(3), L12-31(8)", which are loosely labelled. The substance (the 08351 disposition) is correct.

## Lead-judgment questions

1. **Related to a surviving legacy source.** M02/M03 Related bullets (07827, 07830) point at the consumer's own surviving legacy source `docs/ui-spec/modals/*.md`. I read these as preserve under L12-34(4) because the target survives, unlike the retiring-source 07786 case. Please confirm that ruling (b) ("Related to its own source parks as duplicate") applies only when the source retires or is the consumer itself.

Status: DONE
Summary: Reviewed all 5 assigned files (42 edges) across batches 120, 121 and 122. All 5 are ok with 0 outcome defects, and 3 minor record-text notes and 1 Lead question are recorded.
