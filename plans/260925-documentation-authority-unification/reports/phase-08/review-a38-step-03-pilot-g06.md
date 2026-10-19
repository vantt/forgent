# Step 3 pilot semantic review: group g06 (batch-040, 6 files, 19 edges)

Author pin `ae141550c`. Sources read whole at the pin: confinement-authority.md (1401 lines; read every edge region in context: lines 1343-1372 and 1391-1401, plus a path grep over the whole file), distillery.md, enduser-docs-authoring.md, enduser-docs-index.md, fgos-plugin.md and observe.md (the last five read in full). Targets read at the pin: `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (RUL65b, RUL75, `## Business Rules`), `docs/platform/work-state/spec.md` (header and outline), `docs/platform/system-overview/spec.md`, and the existence of the retained how-to, reference, explanation, decisions and distillery paths. I also checked `alias-table.json`, which has no entries.

## Per file

### docs/specs/confinement-authority.md (batch-040): ok (4 edges)
- 08057 (line 1353, `docs/architecture-map.md`): preserve is right. The text is a past-tense settled-fact record, "đã được đăng ký chính thức ... (P07)" (L12-26 class 5).
- 08058 (line 1360) and 08059 (line 1369): patch to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`.
  - The RUL65b and RUL75 passages are in that file, under `## Business Rules`, which is the only heading with that slug. The file is a valid exact target under the Lead ruling.
  - The RUL locators are kept.
  - Both lines are in the live "Công thức" section (13.1) and in 13.2, not in the "Lịch sử" paragraph.
  - The two hunk headers cover the changed lines, and each hunk appears once.
  - Timing is Phase 9, cutover-patch-only.
- 08060 (line 1401, `docs/routing-handoff-contract.md`): preserve is right. It is a retained root authority (class 3).
- No defects.

### docs/specs/distillery.md: rework (3 edges)
- Defect on 08074 (line 124, `docs/specs/system-overview.md`).
  - The record preserves it under class 5/8 ("source-design/merged-from lineage"). That rule does not fit.
  - The sentence is a live Open Gaps bullet, a present-tense claim: "`docs/specs/system-overview.md` already lists a `distillery` area entry pointing here". It is not a completed past action or a lineage cell. The file is retired at Phase 9 and the path will dangle.
  - A candidate target exists. `docs/platform/system-overview/spec.md` has the `distillery` area-map entry at line 50, and it is not carriage.
  - Required correction: patch to `docs/platform/system-overview/spec.md` (cutover-patch-only, Phase 9, with the matching hunk). Alternative if the author reads the sentence as about how the legacy tree is organised (class 6): park it with an explicit non-executable status and the smallest dependency. It cannot stay a preserve under 5/8. The part after "(and a separate ...)" is lineage, but the edge's own span is not.
- 08075 and 08076 (lines 135 and 136, `docs/distillery/porting-log.md` and `docs/distillery/state/porting/`): preserve is right. Both exist at the pin and are retained under class 3; the rule is named in the record.

### docs/specs/enduser-docs-authoring.md: rework (3 edges)
- Defect on 08085 (line 35, `docs/how-to/x.md`).
  - It is parked as a "missing live reference" that "needs successor lookup".
  - It is an illustrative placeholder in the Data Dictionary value column ("vd `docs/how-to/x.md`"), not a reference. There is no successor to find.
  - A parked edge that the rules would preserve is rework. Class 3 keeps `docs/how-to/*` retained, the alias table is empty, and class 9/10 treat placeholders as not a broken link.
  - Required correction: preserve, naming L12-26(3,9,10) (placeholder example under a retained root, spelling kept). Drop the invented blockedReason and the "Step 3 successor decision / Step 5 parity" dependency.
- 08086 (line 103, `docs/how-to/`): preserve is right. `docs/how-to` exists with 34 files at the pin and the alias table is empty.
- 08087 (line 124, `repo/docs/how-to/check-rollup-progress.md`): preserve is right. The file exists at the pin, the `repo/` prefix is kept, and the alias table is empty.

### docs/specs/enduser-docs-index.md: rework (4 edges)
- Defect on 08088 (line 47, `docs/how-to/x.md`). It is the same placeholder as 08085, in the docPath row of the Data Dictionary. Same correction: park becomes preserve.
- 08089, 08090, 08091 (line 236, `repo/docs/how-to/`, `repo/docs/explanation/`; line 237, `repo/docs/decisions/`): preserve is right.
  - The directories exist at the pin (137, 34 and 1 files) and the alias table is empty.
  - These are runtime scan directories (`QUADRANT_DIR_ALIASES`), so keeping the original spelling is also the safe choice for later behavioural proof.

### docs/specs/fgos-plugin.md: ok (3 edges)
- 08092 (line 19) and 08094 (line 169): `docs/specs/work-state.md` becomes `docs/platform/work-state/spec.md`.
  - The target is a real exact spec at the pin. It holds the ask, answer, return and ready verbs and the stage and status model, and it is a candidate, not carriage.
  - The pointers are concrete, whole-file spec pointers with no locator, so `anchor: null` is correct.
  - The hunks match, the label and prefix are kept, and the timing is Phase 9.
- 08093 (line 149, `docs/backlog.md`): preserve is right. It is a retained hand-maintained file (class 3, class 4).
- No defects.

### docs/specs/observe.md: ok (2 edges)
- 08111 and 08112 (line 71, `../reference/discussion-quality-rubric.md` and `../how-to/compare-discussion-setups-with-metrics-eval.md`): preserve is right.
  - Both files exist at the pin under retained roots, and the alias table is empty.
  - The full link form (label, `../` prefix) is kept.
  - A `docs/knowledge` copy exists for the how-to, but with no approved alias, class 3 keeps the retained path.

## Authoring-rule gaps for Lead judgment
1. P8-DOC-GAP-02: none of the three records for the files with no destination (enduser-docs-authoring, enduser-docs-index and, outside my set, platform-foundations) carries the "no destination, no delete-without-carry" dependency.
   - This review covers only the two enduser-docs-* files: neither record mentions the gap in a reason, dependency or note.
   - The edges inside them do not need the gap. The gap is about the files themselves, and it is recorded in progress.md and owner-answers L12-26.
   - Lead may want a record-level note so the Phase 9 delete step cannot miss it. Either way, no destination for these two files is chosen at this step.
2. Placeholder examples. Class 9/10 say placeholders are dropped from the broken-link baseline but do not say what disposition an inventoried placeholder gets. The author chose park. I read the rules as preserve (spelling kept, no baseline entry). Please confirm so the same ruling is applied across batches.
3. Distillery 08074, class 6 versus patch: patch seems right because a live candidate holds the area entry. Confirm if the author argues "sentence about the legacy tree" and parks it instead.

## Denominator and numerator (batch-040, my share only; not pooled)
- Files reviewed: 6 of 6 assigned (11 files in the whole set).
- Rework: 3 (distillery.md, enduser-docs-authoring.md, enduser-docs-index.md). Ok: 3.
- Edges reviewed: 19, with 4 defective edges (08074, 08085, 08088; each counted once per file).

Status: DONE
Summary: Reviewed all 6 assigned files and 19 edges against the author pin. Three files need rework: one preserve that should be a patch or park, and two placeholder edges parked when they should be preserved.
