# Review a38 step-03 wave5c expansion, part p09

Reviewer: independent read-only semantic review. Pin ae141550c. Both records are in batch-130. I read each source whole at the pin, the full diff, every edge, and the targets of every patch.

## docs/io-contract.md (batch-130, L12-51 changed-file re-review)

Verdict: ok. 11 edges reviewed (04104-04114), 0 rework.

- **04105, 04108, 04110 (0011 links, lines 6, 177, 216):** patch to `docs/platform/work-state/decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract`. The heading exists at line 192 and the slug matches. The ADR 0011 Decision (L213) carries the `<name>/v<N>` explicit-version rule that the source gloss states. The diff matches the record in all three places.
- **04106, 04107 (line 10):** patch to `docs/platform/work-state/spec.md` and `docs/platform/runner/spec.md`. Both files exist. The gloss ("implementation detail already in ...") is generic, so a whole-file target holds. The diff matches.
- **04112 (line 218, RUL61):** patch to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`. `## Business Rules` is at line 25 and RUL61 is at line 92. It states the fgos.v1 stdout envelope of the runner, which the gloss "(envelope stdout runner)" claims. The diff is correct.
- **04104, 04109 (0014):** parked GAP-02. The only title-matched narrative holder is D-ADR0014 in the retiring `docs/specs/platform-foundations.md`; `docs/decisions/index.md` row 18 confirms it. This follows L12-41(1).
- **04111 (line 217, `docs/specs/work-state.md` §envelope/§Sổ verb/§Danh tính người ghi):** parked phase9-carry. The locators span several current sources. This is consistent with the generic L10 patch (04106) because 04111 carries section locators.
- **04113:** preserve. `docs/architecture-map.md` is a retained root file.
- **04114:** parked dead-link. `docs/history/str46-io-contract/` is in the live "Tham chiếu" list and never existed, which matches L12-51 (04114).
- No missed references. The only other path-like text is line 33 `platform/session-identity/spec.md`, which is an existing non-retiring path.

## docs/id-systems-audit.md (batch-130, L12-51 changed-file re-review)

Verdict: ok on outcome, with one record-text omission (see the note below). 26 edges reviewed: 23 inventory edges (04081-04103) and 3 author-added.

- The file is `status: FINAL`, `kind: audit`, and says "Audit đóng". That makes it history class under L12-38 and L12-51(2), so preserving every edge is correct. There is no diff (empty), which is correct for an all-preserve record.
- **04084, 04102 (0004):** preserve with a file-level successor note to `retired-decision-history.md`, passage "4. ADR 0004 Scope And Non-Goals". The heading exists at L89 and the Vietnamese/English correspondence is right (L12-51).
- **04087, 04101 (0000-index):** preserve with a record-only note naming `docs/decisions/index.md` as the generated projection. The added edge L147C33 (`0000-index.md:40-64`) carries the same note. All three are correct per L12-51.
- **04088, 04099, 04100, 04089, 04095, 04098, 04081, 04082, 04085, 04086, 04096:** preserve of existing or retiring-tree paths inside a FINAL audit. Correct.
- **04090, 04103:** preserve of illustrative `docs/history/<feature>/` and `docs/history/*/CONTEXT.md` patterns. Correct.
- **Author-added L49C167 (`runner.md`):** preserve. Correct, and no patch is needed in a history file.
- **I found no missed references.** I grepped all path-like text: lines 11, 14, 16, 30, 32, 47-50, 57, 107, 124, 147, 150, 160, 164, 170, 171, 174-178.

### Record-text notes (not rework)

1. **No successor note on the six 0017 edges** (04083, 04091, 04092, 04093, 04094, 04097). The removed `docs/decisions/0017-dong-audit-he-id-ten-goi.md` has a title-matched narrative holder at pin: `docs/architecture-map.md` L770, "##### 0017 — Đóng audit hệ id/tên gọi (STR47)". The batch-033 record (maps-j-01241) already carries a "Non-executable narrative-holder note: docs/architecture-map.md, retired decision 0017 section". The 0004 and 0000-index edges in this same file got notes, so the 0017 edges are inconsistent with L12-38/L12-39 (removed decision ids need successor notes). The disposition (preserve) is right. The identical gap is in batch-098 `docs/platform/documentation/history/id-systems-audit.md` (06707, 06715-06718, 06721), which is outside this part. Recommended fix: add the architecture-map 0017 holder note to all twelve edges.
2. **Author-added edge L164C100 (`reading-map.md`) has an inconsistent resolution.** The record resolves it to retained `docs/reading-map.md` ("current retained path stays literal"). The audit's own evidence list (L175) names `docs/specs/reading-map.md`, and the author resolved the sibling bare `runner.md` through that same context to `docs/specs/runner.md`. The disposition stays preserve either way. Only the reason and targetFacts text differ ("tree retires at Phase 9" versus retained). Please align the text.

### Lead-judgment questions

- Does the checker's removed-decision successor rule recognise `docs/architecture-map.md` decision sections as holders? Note 1 suggests it only knows decision shards. If so, the checker passing does not prove the 0017 notes are not required.

## Counts

| Set | Stratum | Files | Edges reviewed | Rework |
|---|---|---|---|---|
| batch-130 | L12-51 changed-file re-review | 2 | 37 | 0 outcome defects; 2 record-text notes on one file |

Status: DONE_WITH_CONCERNS
Summary: Both files are ok on every disposition, target, anchor and diff, and no references were missed. The one gap is record text: the six 0017 edges in id-systems-audit.md lack the architecture-map successor note that the 0004 and 0000-index edges got, and the author-added L164C100 reading-map edge has an inconsistent resolution.
