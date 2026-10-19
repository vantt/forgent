# Step 3 wave 1 expansion review p07

Pin `ae141550c2e022310de7a0efea757580c0b2479f`, read-only worktree `forgentX-s8-review`. Checker and probes not run. Each source was read whole at the pin (architecture-map: 849 lines, all edge regions plus a line-by-line difflib against root `docs/architecture-map.md` and an independent token scan). Each record's edges, legacyScan, unitIds and diff were read. Existence of every target and successor note was checked with git at the pin. Removal commit `4722361ae` (deletes `docs/decisions/0004-*`, `0017-*`, `0000-index.md`) was verified.

## Verdicts

| File | Set | Edges | Verdict |
|---|---|---:|---|
| docs/platform/agent-coordination/vocabulary/README.md | batch-015 | 1 | ok |
| docs/platform/architecture-map.md | batch-016 | 39 (36 inventory + 3 added) | rework (1 outcome edge) |
| docs/platform/claude-plugin/README.md | batch-017 | 2 | ok |
| docs/platform/decision-citation-drift/README.md | batch-018 | 2 | ok |
| docs/platform/distillery/README.md | batch-019 | 2 | ok |
| docs/platform/documentation/operations/portals/docs-portal.md | batch-020 | 12 | ok |

Per set: batch-015 reviewed 1 / rework 0; batch-016 reviewed 1 / rework 1; batch-017 1 / 0; batch-018 1 / 0; batch-019 1 / 0; batch-020 1 / 0. Edges reviewed: 58.

## Outcome defect

### docs/platform/architecture-map.md, maps-j-06585 (source line 456), rework

- Edge: the CTR011 row's "Định nghĩa ở" cell, `src/runner/dispatch/confinement/` · spec `docs/specs/confinement-authority.md`. Record: preserve, with reason "Heading-framed source carriage: '#### 7 · Sổ đăng ký contract'" and a non-executable successor note.
- Why it is wrong: this row is not carried source bytes. The pinned root file has only one confinement row (root L372, labelled **CTR010**). The candidate's carriage section (L82-849) differs from the root in exactly these places beyond heading levels and decision-link destinations:
  - L411 and L421: the confinement component and slice rows now say CTR011.
  - L455-458: CTR010 is now the Gateway REST row, CTR011 is the confinement row with new text "nhãn registry chỉ có trong tài liệu, không phải version stamp trong code", and CTR012 and CTR013 are new rows.
  - So the contract registry in the candidate was reconciled by the candidate, and the L82 sentence "Full source text follows ... heading levels and physical link destinations adjusted only" is false for these rows. The reason also quotes the nearest H4 heading, not a framing sentence that covers the row.
  - The cell is present-tense "defined in" navigation in a registry that becomes the live architecture map at promotion. After Phase 9 step 6 it would point at a deleted file.
- Rule: L12-34(6) (present-tense navigation with a live holder is patched; carriage-only text is preserved only when the framing truly covers it); L12-30(1) (a live exact holder is the target); L12-31(5) (a preserve resting on a framing sentence must quote a sentence that applies).
- Correction: patch the cell to the live whole-file holder `docs/platform/agent-confinement/spec.md` (exists at the pin; it holds `executeThroughConfinement` at L51 and the one-door decision), timing Phase 9, anchor null because the cell names "spec" as a whole. The successor note naming `confinement-authority-v1.md` could move to a description comment, since that file is a contract and the label says "spec". Description check for the patch: the adjacent row text (confinement-authority.v1, the policy, plan and attestation names, 8 falsification probes) matches `agent-confinement/spec.md` and `contracts/confinement-authority-v1.md`; the "8 probes" count was not re-counted against the target.
- The other rows in L455-458 contain no legacy tokens (CTR010 `docs/platform/herdr-web-dashboard/...`, CTR012 and CTR013 `docs/platform/agent-coordination/...`), so no further edge arises.

## Per-file notes

### agent-coordination/vocabulary/README.md (batch-015, 1 edge), ok

- maps-j-06568 (L17, Related): `docs/specs/runner.md`, a retiring target, patched to `docs/platform/runner/spec.md` (exists at the pin, whole-file, anchor null correct for a bare Related entry). The holder is neither this file nor already listed (L16 lists `agent-coordination/README.md`). The diff changes only L17. The Provenance line (L9) holds a commit id, not a path, so there is no edge. The legacy scan excludes only the three sibling basenames at L39/41/43, which resolve to existing candidate files under `vocabulary/`. I found no missed reference (L23 and L49 links are candidate paths).

### claude-plugin, decision-citation-drift and distillery READMEs (batches 017, 018, 019; 2 edges each), ok

- L9 Provenance (06611, 06666, 06684): preserve, with a non-executable successor note to `<area>/spec.md`. Correct under L12-34(4) (Provenance is lineage). The successor note does not name the edge's own path.
- L17 Related (06612, 06667, 06685): patched to `docs/platform/<area>/spec.md`. The holders exist at the pin, are not self, and are not already listed. The diff is a single-line replacement at L17 and matches the patch. u04's Q1 (Related lineage) is resolved by L12-34(4) and the records now follow it. Each spec.md header says "Carriage only" while serving as the area's whole-file spec; this is the same live-holder pattern the runner spec uses and was accepted in earlier rounds, so I treat it as a live holder.
- No other legacy tokens exist in these files (L26 `[spec.md](spec.md)` and the plans/ paths are not legacy).

### docs/platform/documentation/operations/portals/docs-portal.md (batch-020, 12 edges), ok

- Source is 81 lines and was read whole. Link resolution from `docs/platform/documentation/operations/portals/`: `../../../../reading-map.md` is `docs/reading-map.md`, `../../../../specs/reading-map.md` is `docs/specs/reading-map.md`, `../../../governance.md` is `docs/platform/governance.md` (exists), and `../../../README.md` is `docs/platform/README.md`. The empty candidates list is therefore correct.
- 06814 (L9 Provenance) and 06815 (L17 Related, `docs/README.md`): preserve. `docs/README.md` is a retained root outside the retiring trees and is listed as a Phase 8 navigation consumer, not a retiring file.
- 06816 and 06822 (`docs/reading-map.md`): preserve (live). 06819 (`docs/history`): preserve (live). 06824 and 06825 (L77-78): preserve inside the "Source Metadata (Added in candidate)" text block, which is literal carriage.
- 06817 (L31) and 06823 (L58): phase9-row-flip, same reason. The rows say "Current legacy product/source map" and "legacy/current detailed source map". Both are one disposition per row unit. 06820 and 06821 (L48): row-flip, one shared unit (`line-L48`). Each row-flip carries a Phase 9 dependency and no target, as required.
- 06818 (L32 `docs/tutorials/`): preserve. The reason now states correctly that `docs/tutorials/` exists with a tracked `.gitkeep`. See Lead question 2.

## Record-text notes (no rework)

- architecture-map 06579-06610: the "Heading-framed source carriage" reasons quote the nearest H4/H6 heading (for example `'#### 7 · Sổ đăng ký contract'`), not the framing sentence at L82-84 that actually justifies carriage. L12-31(5) asks to quote the framing sentence.
- architecture-map 06581 (`docs/specs/`, a retiring-tree path) says "source path exists at author pin" without "tree retires at Phase 9". 06585, 06587 and 06591 use the required wording.
- architecture-map 06593 (`0004-pham-vi-va-non-goal.md`) and 06601 (`0000-index.md`): "removed at 4722361ae" is true and verified. Neither has a narrative-holder successor note, unlike 06594. This may be unavoidable if no narrative holder exists for those ids.
- architecture-map: bare basenames inside the carriage at L725, 735, 748, 752, 766, 777, 792, 801, 820 and 825 (`architecture-map.md`, `platform-foundations.md`, `id-systems-audit.md`, `0004-...md`) have neither an edge nor an exclusion, except 752 (excluded). None resolves to a retiring-tree file, so there is no outcome effect.
- docs-portal 06817 and 06823: the dependency prose is present but both categories are None, which is correct for a row-flip.

## Lead-judgment questions

1. architecture-map carriage rows that the root file parks. The root record (batch-033) parks `docs/specs/` organisation and reading-path claims as description-rewrite for A45 (01246 `docs/specs/` Kernel, 01252 §12 system-overview row, 01256 reading-map "đường đọc chuẩn"). The candidate's unmodified copies of those lines (06581 L308, 06587 L608, 06591 L615) are preserved as carriage. That is consistent with literal carriage. But the candidate becomes the live map at promotion, and those statements will then point at the retired `docs/specs/**`. Should the candidate copies carry a description-rewrite or cutover obligation, or is the L82 carriage framing enough? I judged them ok as authored. If the Lead rules that 06585's carriage framing is also valid for the reconciled rows, 06585 reverts to ok and the file is 0 rework.
2. docs-portal 06818 (L32). The row says `docs/tutorials/` is "a planned/legacy slot not present in this checkout", which is false at the pin (the directory exists with only `.gitkeep`). The record preserves the token and notes the stale description should be corrected at cutover, but no disposition carries that correction (the same row in root `docs/README.md` is preserved identically). u02 raised the same question. I left it ok.
3. Whether the area `spec.md` files whose header says "Carriage only" are acceptable as the Related holder for the claude-plugin, decision-citation-drift and distillery wrappers. Earlier rounds accepted this pattern.

Status: DONE
Summary: Reviewed all 6 files and 58 edges; 5 files ok and 1 rework (`architecture-map.md` maps-j-06585, where the CTR011 row's `docs/specs/confinement-authority.md` cell sits in candidate-reconciled registry text, not carried bytes, and should patch to `docs/platform/agent-confinement/spec.md`). The earlier 06578 defect is confirmed fixed.
