# Step 3 pilot semantic review, group g05 (batch-040 slice: 4 files, 60 edges)

Author pin ae141550c. All sources read whole (platform-foundations 41 KB, herdr-web-dashboard 21 KB, decision-citation-drift 6 KB, distribution 83 KB: full-file read of every edge region plus headings, header block, Pointers and Business Rules rows). Targets read at the pin. Alias table (`plans/.../alias-table.json`) is empty; `docs/doc-registry.json` aliases consulted.

## Per-file verdicts

### docs/specs/platform-foundations.md (set batch-040, digest 5691c411...) : ok, 23 edges
- 08113-08116 (lines 26, 71, 93, 96) sit in live Data Dictionary, Business Rules and Pointers. They cite `docs/platform-foundations.md` and `docs/distillery/deep-dives/`. Both are retained, with no alias or retirement. Preserve under L12-26(3) is correct.
- 08117-08135 (lines 98 onward) are all inside "Lịch sử quyết định retired từ docs/decisions/" (ADR bodies). This includes the self-references to `docs/specs/platform-foundations.md` at 352, 421, 447, 465, 505, the `docs/specs/runner.md` cites at 310 and 377, and the wrapped cites at 303-304 and 353-354. Preserve under L12-26(5) is correct, and every locator and wrapped span is kept.
- No defects.

### docs/specs/herdr-web-dashboard.md : rework, 16 edges
- DEFECT 1: maps-j-08096 (line 39), maps-j-08102 (line 304), maps-j-08110 (line 331). All three are parked as "no verified committed live target; needs successor lookup" for `docs/reference/herdr-web-dashboard-layout.md`.
  - The file is gone at the pin, but `docs/doc-registry.json` carries it as an alias: currentPath `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md`, `aliases: ["docs/reference/herdr-web-dashboard-layout.md"]`.
  - The target exists at the pin, is a live Diataxis reference doc, and its own text is the layout/userflow/visual-language document that "takes this spec as product input", the same role the three source lines describe.
  - Rule: L12-26(2) says successor lookup reads registry aliases and moved files from retired roots (`docs/reference` to `docs/knowledge/**`). L12-26(3) retains these paths only while they still exist; here the original is gone.
  - Correction: change all three to `patch`, timing Phase 9, target the knowledge path, joined into hunks. Line 331 is a whole-file Pointers entry, and lines 39 and 304 are whole-file mentions. Keep the whole-label and destination form.
  - The same class appears in docs/specs/runner.md maps-j-08223. The `iron-law-evidence-contract-stays-human-gated` explanation has 6 hits in the registry, so it likely also has an alias. That is outside my files; I flag it for the owner of that batch.
- DEFECT 2 (smaller): maps-j-08107 (line 324, `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) is correctly not patchable. The ADR 0014 file does not exist, and the only narrative holder is `docs/specs/platform-foundations.md` section "0014 - Kien truc giao tiep nguoi <-> fgOS" (line 180). That holder has no Phase 6 destination (P8-DOC-GAP-02). The record's dependency is the generic "Step 3 successor decision". It must instead name the smallest real dependency: P8-DOC-GAP-02 (destination for the platform-foundations decision history), plus the `docs/decisions/index.md` / frozen `docs/knowledge/decisions-index/decision-record.md` projection as a non-narrative holder.
- OK edges: 08095, 08100, 08103-08106 (existing `docs/history/**` carriers, provenance or Pointers: preserve is correct). 08097, 08099, 08108 (`docs/io-contract.md`, retained: no alias, area map says "split" but no approved retirement). 08101 (`docs/contracts/fgos-gateway-api-v1.yaml`, runtime-read, retained). 08098 and 08109 (patch `docs/specs/work-state.md` to `docs/platform/work-state/spec.md`: whole-file reads, target exists, hunk headers correct, no label drift).

### docs/specs/decision-citation-drift.md : rework (minor), 13 edges
- DEFECT: maps-j-08064 (line 27, `--specs-dir <path>` "(default `docs/specs`)") is preserved under "L12-26(3): committed retained path outside retiring roots". `docs/specs` IS a retiring root, so the named rule is false. This is a checker default-root flag, the same behavioral class as the parked 08062, 08066, 08068, 08070 (L12-26(9): citation-drift scope is Step 5).
  - Correction: change to `parked`, with a blocked reason "checker default-root `docs/specs` has no live target until Step 5 reader/default-root parity", and dependency Step 5 plus Phase 9. A preserve drops the Phase 9 action filter and loses the tracking that this default breaks when `docs/specs/**` is deleted.
- OK edges: 08061, 08063, 08065, 08067, 08069, 08072 (`docs/backlog.md`, retained; 08072 is better cited under (5) past-tense dogfood record but the outcome is identical). 08071 and 08073 (glob and retired-format placeholders; the 08073 region is an explicit "Retired" note). 08062, 08066, 08068, 08070 (parked, with real Step 5 dependency).
- Inventory observation (not an author defect): line 26 "(default `docs/decisions`)" has no edge. The `--decisions-dir` default is the same default-root behavior and should be tracked at Step 5.

### docs/specs/distribution.md : rework, 8 edges
- DEFECT 1: maps-j-08082 (line 315, RUL14 "the lazy-probe unlock rule: moved ... now lives ... in `docs/specs/runner.md` (RUL74 ...) ... (RUL75 ...)") is parked as "exact live passage not proved". The sentence names RUL74 and RUL75, and both exist at the pin in `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (lines 160, 162, "Business Rules"). L12-26(1) and the Lead ruling name that file as a valid exact target (RUL74/75 map to the runner business-rules subcomponent spec).
  - Correction: change to `patch`, Phase 9, target that subcomponent spec. Use `#business-rules` only if the anchor is kept coarse, since the bullets have no heading. The parked reason is rework by the "could have been a patch" rule.
- DEFECT 2: maps-j-08078 (line 67, row 5d, "the lazy-probe unlock rule, now in `docs/specs/runner.md`") is patched to `docs/platform/runner/spec.md`. That file is a candidate navigation/carrier index with no RUL74 or lazy-probe text (grep clean). This is a content-locator citation, and L12-26(1) forbids falling back to the area spec when the content has an exact holder.
  - Correction: retarget the hunk at line 67 to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`, the same target as 08082. The diff text for row 5d changes to match. Keep the rest of the row byte-identical.
- OK edges: 08077, 08083 (`docs/coexistence.md`, retained), 08080 (`docs/distribution-vision.md`), 08084 (`repo/docs/architecture-manifest.json`, retained, `repo/` prefix kept), 08079 and 08081 (existing `docs/history/**` provenance, including the wrapped two-line span in 08079).

## Authoring-rule gaps needing Lead judgment (separate from findings)
1. P8-DOC-GAP-02 is not carried at file level for `docs/specs/platform-foundations.md`. Its 23 preserve records are right, but the file is a curated projection with no Phase 6 destination while Phase 9 deletes `docs/specs/**`. The record has no note, so a delete-without-carry is not flagged. Lead should decide whether the file record needs a gap pointer (and a destination choice, or an owner question). This also affects herdr 08107 (decision 0014 narrative lives only there).
2. L12-26(3) says root authorities are retained unless an approved alias retires them. `docs/io-contract.md` and `docs/contracts/fgos-gateway-api-v1.yaml` are still preserved while the frozen area map places them under `docs/platform/**` ("split" and "place verbatim"). With an empty alias table the preserve is consistent, but Phase 9 will need these to flip together. Not a defect here.
3. A preserve edge whose cited rule is false (08064) shows the preserve reason text is generated from a path class. A mechanical check could reject "outside retiring roots" for any `docs/specs` or `docs/architect` path. Lead may want that guard.

## Denominators (my slice only; batch-040 has 11 files, the rest are reviewed elsewhere)
- batch-040 (g05 slice): 4 files reviewed / 3 rework (herdr-web-dashboard, decision-citation-drift, distribution). Edges reviewed: 23 + 16 + 13 + 8 = 60. Defective edges: 08096, 08102, 08110, 08107 (herdr); 08064 (decision-citation-drift); 08078, 08082 (distribution).
- No other set touched.

Status: DONE
Summary: platform-foundations is ok. herdr-web-dashboard, decision-citation-drift and distribution need rework: three parked edges that have a registry-alias successor, a preserve with a false rule, and two runner RUL74/75 edges (one parked that has an exact target, one patched to a portal that lacks the passage).
