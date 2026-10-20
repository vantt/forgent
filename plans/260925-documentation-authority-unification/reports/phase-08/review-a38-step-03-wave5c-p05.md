# Review a38 step-03 wave5c p05: docs/io-contract.md

Set batch-130, stratum: mandatory (per request, batch-130 has 1 mandatory file plus patched and unpatched seeded samples; this file is in the part assigned as p05). Pin ae141550c. Record step-03-records/batch-130.jsonl. File is ~221 lines; read whole. 11 edges reviewed (04104..04114), diff reviewed.

## Verdict: rework (1 outcome defect)

### Outcome defect
- **maps-j-04114**, source line 220: `docs/history/str46-io-contract/` in the live `## Tham chiếu` pointer list. Recorded as preserve, reason "retained ... original str46-io-contract decision dossier ... historical source paths stay literal".
  - Evidence: path never existed in pin ancestry (`git ls-tree -r` at the pin has no str46-io-contract directory under docs/history; `git log -- docs/history/str46-io-contract` is empty). The record itself states "never existed".
  - Rule: L12-30(5)/L12-32(3): present-tense navigation (a Pointers/Tham chiếu list) to a never-existing path is parked as a dead link. L12-47 preserve applies only to a **Source:** provenance line, not here. Same shape was parked elsewhere (e.g. 08215 in docs/specs/reading-map.md, 04595/04693). The file is a live root contract doc, not dated history, and line 220 is not a past-action marker.
  - Correction: disposition parked, blockedCategory dead-link, reason stating the path never existed in ancestry. No diff change (it was preserved so no hunk).
  - Lead-judgment note: the only argument for preserve is that docs/history is a retained root and the entry names the original dossier of a closed task; if Lead rules that a retained-root history path stays literal in live reference lists, 04114 stands, but that would contradict the 08215 precedent.

### Edges judged ok
- 04104 (L5 `[0014](decisions/0014-...md)`), 04109 (L215 `docs/decisions/0014-...md`): parked GAP-02, category and reason consistent (removed at 4722361ae, no successor file; full 0014 narrative only in retiring platform-foundations). Matches L12-41 and the focus note. ok.
- 04105 (L6), 04108 (L177), 04110 (L216) patch to docs/platform/work-state/decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract. Heading "## 7. ADR 0011 Explicit Version For Every Contract" exists at the pin; slug correct; the 0011 Decision (`<name>/v<N>`, explicit version in every contract identifier) matches the adjacent descriptions (L6-7 "mọi contract mang version tường minh `<name>/v<N>`", L177-178, L216 "(version)"). Diff hunks correct, label text kept. ok.
- 04106/04107 (L10): whole-area pointers patched to docs/platform/work-state/spec.md and docs/platform/runner/spec.md, both exist; adjacent claim ("chi tiết cài đặt đã có trong") true; no locator asserted. ok.
- 04111 (L217 `docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người ghi): parked phase9-carry. Reasonable: three section locators span several current holders and the writer/host content (Rust host, attempt writer id) must carry together; separate from RUL61 as the focus note requires. Source exists at pin, retires at Phase 9. ok. (Mild tension with 04106 patching the same path at L10 is justified: L10 is whole-area, L217 carries section locators.)
- 04112 (L218 `docs/specs/runner.md` RUL61): patched to docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules. RUL61 is defined at line 92 of that spec under "## Business Rules" (one fgos.v1 envelope per once/watch cycle, one line); docs/platform/runner/spec.md line 163 only mentions it, so the subcomponent is the correct holder. Diff hunk matches. ok.
- 04113 (L219 `docs/architecture-map.md`): preserve; path exists at the pin and is a retained root map. ok.

### Missed references
None found. Other docs paths in the file (`platform/session-identity/spec.md`, `platform/run-supervisor/spec.md#91-controller-death`) are already new-form and exist at the pin (run-supervisor has `### 9.1 Controller death`). Code paths (`src/state/store.mjs`, etc.) are not doc edges. Legacy scan candidates: none.

### Record-text notes (not rework)
- 04114 reason wording "original str46-io-contract decision dossier" conflates a dead link with retained history; will be fixed with the disposition change.

### Lead-judgment questions
- 04114: confirm dead-link park (per L12-30(5)/L12-32(3), precedent 08215) versus preserve as retained-root history path.
- Open rulings in step-03-wave5c-lead-ruling-gaps.json: no entry mentions io-contract/0014/str46 (searched); none recorded for this file.

## Counts
- batch-130, mandatory stratum: reviewed 1 file (11 edges) / rework 1 file (1 defect edge). Per-stratum rate 100% (denominator of 1; pending the other batch-130 files from other parts). Set-level expansion consideration is Lead's after combining parts.
