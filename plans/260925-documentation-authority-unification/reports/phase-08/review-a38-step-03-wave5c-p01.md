# Review a38 step-03 wave5c, part p01

Pin ae141550c, worktree 0dd23a73a, read-only. Part 01 has 4 files / 103 edges. Every edge was read (all fields except the large searchWitness bodies, which I read by category and counts, plus spot-checked git facts). Every source file was read whole. I ran no checker or probe. I used the `listAnchors` helper read-only to confirm anchors, and `git show`, `git grep` and `git log` at the pin. I wrote a scratch missed-reference scan over the legacy roots and the retiring basenames; for each file it lists hits not covered by an edge span.

## Per-file verdicts

| File | Set / stratum | Edges | Verdict |
|---|---|---:|---|
| docs/backlog.md | batch-126 / mandatory | 58 (48 inventory + 10 author-added) | ok |
| docs/coexistence.md | batch-126 / patched sample | 6 | rework (1 edge) |
| docs/distribution-vision.md | batch-126 / unpatched sample | 13 (6 + 7 author-added) | ok |
| docs/id-systems-audit.md | batch-130 / unpatched sample | 26 (23 + 3 author-added) | ok |

### docs/coexistence.md: rework

**Outcome defect: maps-j-01325**
- Source: line 31, "(fgos review/approve/reject — spec: docs/specs/runner.md)".
- Record: patch (Phase 9) to `docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#actors-access`.
- Problem: the exact holder of the three verbs is not the Actors & Access table. The "Actors & Access" table (lines 25-33 of the target) never names `review`, `approve` or `reject`. It only has the row "duyệt đề xuất (merge → done): operator". The legacy runner.md section "Cổng duyệt PR nội bộ (approval gate) — review/approve/reject" (legacy line 326) is carried in `docs/platform/runner/operations/h-51f5cd7279fd.md`, heading line 234, same title.
  - That section names `fgos review <id>` / `fgos approve <id> [...]` / `fgos reject <id> --reason`, and covers the human gate before an `awaiting-approval` proposal lands on trunk. That is the exact claim of the territory paragraph ("ghi vào trunk repo chỉ sau khi người duyệt một đề xuất").
  - Rules: L12-26 class 1 and L12-30(1c) say a content or locator citation maps to the exact candidate file that holds the content. The anchor is valid (`actors-access`, github slug `actors--access`), but it is a weaker holder than the one that exists.
- Correction: patch to `docs/platform/runner/operations/h-51f5cd7279fd.md` at the extractor anchor of "Cổng duyệt PR nội bộ (approval gate) — review/approve/reject". Alternatively patch to the area spec `docs/platform/runner/spec.md`, the same bare-area target the sibling edge maps-j-01326 uses, with a reason that states why. The reason text also says the patch "matches the complete territory paragraph"; update it to say what the target actually states.
- Confidence: moderate. The candidate file h-6df5686d0d54 is a valid target class (L12-26 ruling), and the Actors table does support "operator approves merge→done". The defect is precision, not falsity. Lead may overrule.

Other coexistence edges are ok.
- maps-j-01326 (line 48, whole-file runner.md to `docs/platform/runner/spec.md`) is a bare-area patch and the description stays true.
- maps-j-01324 and maps-j-01328 (the removed `docs/decisions/0009-chong-giao-thoa-luc-cai.md`) park as GAP-02 (blockedCategory equals dependencyCategory). Verified: ADR0009 narrative exists only at `docs/specs/platform-foundations.md:142`, "### 0009 — Chống giao thoa tiến trình lúc cài", which retires. The candidate holders (the coexistence candidate copy, packaging-distribution spec row 284, the decision-record frozen copy) only cite it or carry a one-line gloss, not the full decision. This is correct under L12-41 and L12-39.
- maps-j-01327 and maps-j-01329 preserve. See Lead question 1 for 01327.

### docs/backlog.md: ok (58 edges)

- The diff is empty and the stale "GENERATED FILE" header is untouched, consistent with L12-26(4) and GAP-03. The file is treated as hand-maintained and all moved or retiring references are ordinary rows.
- Done/Declined and audit identities preserve.
  - Targets that exist stay literal: `docs/id-systems-audit.md`, `docs/coexistence.md`, `docs/platform-foundations.md`, `docs/distillery/**`, `docs/decisions/`, `docs/history`.
  - `docs/decisions/0000-index.md` is verified removed at 4722361ae.
  - Never-existing `docs/history/**` evidence paths are verified to have no git history at the pin.
- Three parks:
  - maps-j-01280, phase9-carry. The js-yaml upgrade procedure is only at `packaging-distribution/spec.md:723`, inside "Retained Distribution Source Detail" (heading line 459, carriage). No live holder exists elsewhere in docs/platform or docs/knowledge. Correct.
  - maps-j-01282 (L39 `work-state.md:647-675`) and L37C410 (STR62 `work-state.md:864`), description-rewrite. Both rows make present-tense claims tied to legacy line locators, so a path-only patch would leave the claim or locator false. Consistent with L12-32(3).
- Missed references: none. The scan flagged only non-retiring files (`architecture-map.md`, `routing-handoff-contract.md`, `work-item-lifecycle-vision.md`, `coexistence.json`, `backlog.md`). The checker's RETIRING_ROOTS covers only docs/specs and docs/architect, so these are out of scope. Bare retiring names `work-state.md`, `runner.md`, `distribution.md` and `platform-foundations.md` are covered as author-added edges.

### docs/distribution-vision.md: ok (13 edges)

- The diff is empty. The file header says "Legacy status: Promoted source ... Use this legacy file for: Historical wording, original rationale ... Do not use for current implementation status or canonical area navigation". All 13 edges preserve under that explicit header. Of the 13, 6 are inventory edges and 7 are author-added (all bare `distribution.md`).
- Coverage is complete. The scan found no uncovered retiring or legacy reference. The only extras were the header's new live paths (not legacy) and bare `coexistence.md` (retained).
- See Lead question 2 about L184.

### docs/id-systems-audit.md: ok (26 edges)

- The diff is empty. Frontmatter says status FINAL, kind audit, updated 2026-07-27. All edges preserve as audit evidence, with an illustrative placeholder for `docs/history/<feature>/CONTEXT.md` and `docs/history/*/CONTEXT.md`.
- Coverage is complete. The scan returned no uncovered hits. 3 author-added bare-name edges were added: `runner.md`, `0000-index.md` and `reading-map.md`.
- Facts verified: `docs/decisions/0000-index.md` removed at 4722361ae (index.md added in the same commit, see record notes). See the successor-note notes and Lead question 3.

## Record-text notes (not rework)

1. Missing title-matched successor notes on preserved removed decisions.
   - Edges maps-j-04084 and maps-j-04102 (0004 `pham-vi-va-non-goal`) say "removed ... with no successor file", with no successor note. A title-matched narrative holder exists at the pin: `docs/platform/work-state/decisions/retired-decision-history.md`, heading "## 4. ADR 0004 Scope And Non-Goals" (same decision, English title; body matches the legacy work-state.md:1433 "### 0004 — Phạm vi & non-goal"). The checker's ASCII title matching evidently cannot join Vietnamese and English titles.
   - Edges 04083, 04091, 04092, 04093, 04094 and 04097 (0017 `dong-audit-he-id-ten-goi`): the title-matched narrative is `docs/architecture-map.md:770`, "##### 0017 — Đóng audit hệ id/tên gọi (STR47)". It is a retained root file, not a candidate decisions holder, so a note is optional.
   - Rule: L12-39 and L12-41. Add a "Non-executable successor note: ..." with that holder; no disposition change.
2. Docs/id-systems-audit.md and docs/backlog.md edges 04087, 04101 and backlog maps-j-01299 (`docs/decisions/0000-index.md`) say "no successor file". `docs/decisions/index.md` was added in the same commit 4722361ae as the generated projection. A note naming it would be truer; git did not detect a rename, so the factual claim as stated still passes.
3. The generic suffix "tree retires at Phase 9" is false for paths that are not under docs/specs or docs/architect: `docs/architecture-manifest.json` (distribution-vision maps-j-01898), `docs/architecture-map.md` (backlog maps-j-01304, id-systems-audit 04089/04095/04098), and the specs-tree-wording on `docs/reading-map.md`-class edges. The preserve outcome is unaffected.
4. Backlog preserves of `docs/specs/runner.md` / `work-state.md` / `distribution.md` / `platform-foundations.md` inside Done rows (01295, L110 x4, L116C997, L40C354) carry no successor note, although holders exist. Not required by the checker.

## Lead-judgment questions

1. docs/coexistence.md maps-j-01327: a live Known Gaps pointer to `docs/history/install-coexistence/reports/canary-run.md`, which never existed in the pin's ancestry. It preserves because the text itself says it is an external workshop record, not part of the product repo. L12-47 parks a live prose pointer to a nonexistent path as a dead link, but the text disclaims the product repo. The same ruling covers the live (status proposed) backlog rows: L17 (`mvp2-scope-test-infra` case reports, edges 01276/01277), L39 (`gate-dialogue-continuity/CONTEXT.md`, edge 01281) and L40, whose evidence paths all never existed. Please confirm that "dated evidence or provenance citation" is the reading, not a live pointer.
2. docs/distribution-vision.md maps-j-01901 (line 184, "xem docs/specs/distribution.md Data Dictionary #4b/#7") is a live-sounding "see" with a locator. All 13 edges preserve under the file-level header "use for historical wording, not navigation". L12-26 class 1 would map the locator to a candidate holder. Confirm that the file-level header framing is enough. (AGENTS.md still points readers at this file as live direction.)
3. docs/id-systems-audit.md edges 04083, 04091 and 04092 (L16, L107, L124: "quyết định ... nằm ở / chốt ... xem docs/decisions/0017-...md") are present-tense location claims to a removed file, preserved as FINAL-audit evidence. If a FINAL audit is not treated as history, L12-39 would require a title-matched holder or a dead-link park. I read it as history (status FINAL, "Audit đóng", closed-question sections), so I did not mark rework.
4. docs/backlog.md author-added L40C354 (STR70b, `work-state.md` in "RUL11 (tiến hóa schema)") preserves as a "captured 2026-07-21 investigation", while sibling live-row locators L37 and L39 park. A candidate holder for RUL11 exists (`docs/platform/work-state/contracts/cli-io-contract.md:112`, `.../decisions/retired-decision-history.md:298`). The distinction (past-dated finding vs present-tense claim) is defensible. Confirm.
5. Open Lead-ruling gaps in `step-03-wave5c-lead-ruling-gaps.json`: none for batch-126..130. I found no unreported need for a new rule.

## Counts (reviewed / rework), per set and stratum

| Set | Stratum | Reviewed | Rework | Rate |
|---|---|---:|---:|---:|
| batch-126 | mandatory (backlog.md) | 1 | 0 | 0% |
| batch-126 | patched sample (coexistence.md) | 1 | 1 | 100%, over 3% |
| batch-126 | unpatched sample (distribution-vision.md) | 1 | 0 | 0% |
| batch-130 | unpatched sample (id-systems-audit.md) | 1 | 0 | 0% |

If Lead accepts the coexistence finding, batch-126's patched stratum breaches 3%. Its patched population is 1 file, already fully reviewed, so per the request's expansion rule the whole batch-126 set expands to every file: coexistence.md, backlog.md and distribution-vision.md are done here; the batch's other files, if any, are outside part 01. Batch-130's patched stratum is not in this part.

Status: DONE_WITH_CONCERNS
Summary: 3 of 4 files ok; docs/coexistence.md has one outcome defect (edge maps-j-01325 patches the verbs citation to the Actors and Access table instead of the runner approval-gate section that names review/approve/reject). Record-text notes (missing successor notes for 0004/0017, an inaccurate "tree retires" suffix) and 5 Lead questions are listed.
