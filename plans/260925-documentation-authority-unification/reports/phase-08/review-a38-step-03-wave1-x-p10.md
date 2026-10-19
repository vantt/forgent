# Review a38 step-03 wave1 expansion, part p10

Pin ae141550c (author), worktree detached at 836cc0fe1, read-only. Source and every edge read for all three files. No checker or probe run. Rules applied: L12-26..L12-34 and the authoring-rules digest.

| File | Set | Edges | Verdict |
|---|---|---:|---|
| docs/user/README.md | batch-032 | 6 | ok |
| docs/README.md | batch-033 | 15 | rework (row-L31, 4 edges, see below) |
| docs/architecture-map.md | batch-033 | 42 (39 inventory + 3 author-added) | ok |

Per-set: batch-032 reviewed 1, rework 0. batch-033 (this part) reviewed 2, rework 1. Both files are unpatched stratum with empty diffs.

## 1. docs/user/README.md (batch-032:1), ok, 6 edges

- 08491 (L16 `docs/doc-governance.md`) and 08492 (L17 `docs/README.md`) are Related-header entries. Both targets survive Phase 9 (retained roots, exist at pin). Preserve is correct under L12-34(4).
- 08493..08496 (L24..L27, one table row each) are phase9-row-flip, one disposition per row unit. The "Current active path during migration" column names retained roots (`docs/tutorials/`, `docs/how-to/`, `docs/reference/`, `docs/explanation/`). All four exist at the pin, and `docs/tutorials/` holds only `.gitkeep`. `docs/user/tutorials/` is absent. This matches L12-34(3) and (8): paths stay, status flips. The record facts are true.
- Scan: no other legacy token in the file. The `docs/user/**` strings are candidate targets. The author-added list is empty, which is correct.
- Earlier u03 note (reasons on 08493..08496) is fixed as to facts. The text now says `docs/user/tutorials/` is absent.
- Record-text note, not rework: 08494..08496 repeat the tutorials sentence on the how-to, reference and explanation rows, where it is irrelevant. 08491 and 08492 reasons use boilerplate "history/lineage" wording for a Related header (the disposition is still right).

## 2. docs/README.md (batch-033:1), rework, 15 edges

Reviewed edges: 00004..00018.

Correct as authored:
- 00004 and 00005 (L16 and L17 Related header, retained roots): preserve.
- 00006 and 00007 (L27 and L28 Read First rows linking to retained roots): preserve.
- 00008 (L30) and 00018 (L57) are rows labelled "Current legacy product/source map" and "legacy/current detailed source map". They are row flips, consistent with each other. A path-only patch would duplicate the row-28 `reading-map.md` and leave the label false.
- 00013 (L41 `history/`): preserve, directory exists.
- 00014 and 00015 (L47 `docs/specs/**` and `docs/architect/**`): flip of the Transitional Status paragraph.
- 00016 and 00017 (L54 and L55 Related Files rows linking to retained roots): preserve.
- Scan: no other legacy token. The header `docs/platform/README.md` is not a legacy path. The earlier u01 point about self-successor notes is fixed. 00012 now states the `.gitkeep` fact.

### Outcome defect

- Edges 00009, 00010, 00011, 00012 (L31 `[how-to/]`, `[reference/]`, `[explanation/]`, `docs/tutorials/`), unitId row-L31, disposition preserve.
  - Source row: "User docs | [user/](user/) target; existing how-to/, reference/, explanation/ during migration; `docs/tutorials/` is a planned/legacy slot not present in this checkout".
  - Rule: L12-34(3) says table rows are migration-state units, and the digest says "Retained roots in status units keep their paths; update status only".
  - The row is migration-state text ("target ... during migration"). It carries a claim that is false at the pin (`docs/tutorials/` is tracked with `.gitkeep`).
  - The record's own reason for 00012 says "Correct the stale absence description in the whole migration status unit at cutover", yet the disposition is preserve and has no timing or dependency. That is self-contradictory. The Phase 9 obligation is lost from the baseline.
  - The same pattern in this part's `docs/user/README.md` rows (08493..08496) is a row flip. The sibling inconsistency confirms it.
  - Correction: phase9-row-flip for all four edges (one unit, one disposition, timing Phase 9). Retained paths stay intact, and the status text is updated.
  - Lead may treat this as a classification-only fix. Neither disposition is executable before Phase 9, and u01 and u02 left the question open. No L12-34 sub-ruling names this row type explicitly.

Record-text note: reasons on the preserve edges use the boilerplate "preserved as history/lineage/self-reference" for plain live navigation rows (00006, 00007, 00009..00011, 00013, 00016, 00017). The stated fact (path exists, outside retiring trees) is true.

## 3. docs/architecture-map.md (batch-033:2), ok, 42 edges

I read all 763 lines of the source. I reviewed all 39 inventory edges (maps-j-01237..01275) and the 3 author-added edges. I checked every grep hit for a legacy token against the edge lines.

p03 defects: all fixed.
- 01250 (L372, CTR010 row, `docs/specs/confinement-authority.md`) is now parked, category description-rewrite, for the A45 CTR010/CTR011 reconciliation (consistent with phase-09 and the candidate registry).
- L41 `reading-map.md` and L735 `reading-map.md` are now author-added preserve edges. L735 sits in the 0017 narrative, and L733 shows the file meant is `docs/specs/reading-map.md`.
- Narrative-holder notes are present. They match the pin: retired-decision-history.md sections 8 (0012), 9 (0013) and 4 (0004) exist, and `### 0010/0015/0017` are in this file's own retired-decision section.
- 0000-index successor `docs/decisions/index.md` exists at the pin.
- Removal facts: all seven decision paths (0004, 0010, 0012, 0013, 0015, 0017, 0000-index) were pure `D` entries at 4722361ae, with no rename.

Live-root framing under L12-34(7).
- Parked as description-rewrite (live voice): 01246 (L225 `docs/specs/` not in Kernel), 01250 (L372 CTR010), 01252 (L522 `docs/specs/system-overview.md` row), 01256 (L529 reading path `docs/specs/reading-map.md`).
- Preserved as provenance, changelog or retired-decision units:
  - L16..L22 version lineage: 01237..01241.
  - L43, L57 and L70 changelog: 01242..01244.
  - L41 (both author-added edges), L74, L567, L585 and L587.
  - L599..L751 inside the "Lịch sử quyết định retired" section, including `docs/specs/reading-map.md` at L622, L733 and L745.
- Preserved retained roots: `docs/id-systems-audit.md`, `docs/architecture-manifest.json`, `docs/io-contract.md`, `docs/routing-handoff-contract.md`, `docs/backlog.md`, self-references, and `docs/decisions/`. All exist at the pin and are outside the retiring trees.
- Unit consistency: rows 522..525 are separate row units, so the 522 park and the 523..525 preserves are consistent. Same-unit edges (L41, L567, L667, L717) share a disposition.
- Missed references: none that matter. The author-added scan covers the bare `system-overview.md` and `reading-map.md` forms. The contextual exclusion of L666 `platform-foundations.md` is harmless. It sits inside the retired 0015 narrative, and both `docs/platform-foundations.md` and `docs/specs/platform-foundations.md` exist at the pin, so preserve would be the outcome either way.

No outcome defects.

Record-text and suggestions (not rework):
- Basenames `0004-pham-vi-va-non-goal.md` (L691, L715) and `id-systems-audit.md` (L680, L706, L739) have no edge. They are inside retired-decision carriage, and the full-path form at L567 and the retained-root edges are covered. They would preserve if added, so this is completeness only.
- The reason for 01260 and 01261 says "Path exists", which is true (`docs/decisions/index.md` is tracked).
- The L666 exclusion reason names only `docs/platform-foundations.md`, which is ambiguous with `docs/specs/platform-foundations.md`.

## Lead-judgment questions

1. Do migration-state table rows that only name retained roots (docs/README.md row-L31 vs docs/user/README.md rows 24..27) always flip? If yes, the docs/README.md rework above stands. If Lead rules that stale "not present" text can ride as a preserve with an A45 note, then docs/README.md is ok and docs/user/README.md is still ok.
2. docs/README.md row-L31 `[user/](user/)` and docs/architecture-map.md header "Do not use for the target documentation entry path": no action needed, noted for the cutover packet.

Status: DONE
Summary: Of the three files, docs/user/README.md and docs/architecture-map.md are ok. docs/README.md needs one fix: row-L31 (00009..00012) should be a row flip, not a preserve. Every earlier wave-1 defect for these files is confirmed fixed.
