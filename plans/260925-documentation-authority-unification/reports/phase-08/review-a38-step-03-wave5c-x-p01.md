# Review a38 step-03 wave5c x-p01

Worktree pin 0d1fb3bff, author pin ae141550c. No checker or probe was run.

## docs/architecture-map.md

- Set: batch-033. Stratum: L12-51 changed-file targeted re-review. Not a retiresWithTree record; its root-map status is confirmed by `docs/transitional-switchboard.json`, which lists `docs/architecture-map.md` as the retained root authority.
- Verdict: **ok**.
- Edges reviewed: 42, which is 39 inventory edges plus 3 author-added edges. The split is 38 preserve and 4 parked. The record has no patches and no row flips; the diff is empty, which is consistent.
- Source read in full (763 lines). Every `sourceSpan` was re-extracted at its line and column and matches `matchedExpression` and `text` exactly (0 mismatches).

### Per-edge conclusions

- **01237, 01239–01241, 01243–01244 (changelog decision links, lines 16–22, 57, 70).**
  - These are "nâng vX theo record" and Changelog citations, so preserve is correct.
  - 0010, 0015 and 0017 have their own `### 00NN` headings in this file's retired-decision region (lines 590, 634, 684). Naming the consumer as the holder fits L12-52(1).
  - 0013 (01239, 01243) points to `retired-decision-history.md` section 9, "Report-Not-Write Channel For Discovered-From". No competing title match exists under `docs/platform` or `docs/knowledge`.
- **01238, 01242 (0012, lines 17 and 43).** Preserve, with the successor note to `retired-decision-history.md` section 8, "Unified Typed-Edge Graph Model". That is the only 0012 holder.
- **01245 (L74), 01247 (L306), 01248 (L363), 01249 (L368), 01251 (L459), 01253–01255 (L523–525), 01257 (L549).**
  - These are retained root files, and each exists at the pin.
  - Preserve is correct.
  - None of the reasons carries a false "tree retires" suffix. I checked the reasons mechanically.
- **01246 (L225), 01252 (L522), 01256 (L529).** Parked as description-rewrite.
  - Each is a present-tense live statement about the `docs/specs/` organisation or the canonical reading path.
  - Alias lookups in the alias table and the registry returned nothing.
  - The witnesses show carriage and live hit counts and are consistent.
  - These parks agree with how 01264, 01273 and 01274 are handled: preserved as history inside the retired-decision narrative.
- **01250 (L372).**
  - The park is correct, and I verified it in the candidate. `docs/platform/architecture-map.md` L455–456 shows the candidate numbers the contract differently from the source row: the source has CTR010 as confinement-authority, while the candidate has CTR010 as the Gateway and CTR011 as confinement-authority.
  - A path-only patch would therefore leave the contract id in the row false.
  - The park is a description-rewrite, as authored.
- **01258 (L567, `0004-pham-vi-va-non-goal.md`).**
  - Preserve, with the file-level note and the 4. "ADR 0004 Scope And Non-Goals" section.
  - It carries the Vietnamese/English correspondence statement, as L12-51 requires.
  - The section exists in `retired-decision-history.md`.
- **01259 (L567, elided `docs/decisions/0017-...md`).** The elided name resolves to `0017-dong-audit-he-id-ten-goi.md`, and the holder is this file's own `### 0017` section. Correct.
- **01260, 01261 (L585, L587), 01262–01263, 01265, 01267–01272, 01275.** Paths cited inside the retired-decision region. The region is framed as a verbatim relocation by the line "Các ADR dưới đây được di dời nguyên văn…". All paths exist at the pin. Correct.
- **01264, 01273, 01274 (`docs/specs/reading-map.md`, lines 622, 733, 745).** These are decision narratives; preserving them as history is right, and they carry no successor-note requirement.
- **01266 (L667, `docs/decisions/0000-index.md`).** Preserve. The record names the removed hand-written index and `docs/decisions/index.md` (the generated retained index) as its successor, which is the L12-51 requirement.
- **Author-added edges.**
  - L41 `system-overview.md` is a preserve. It sits in the v0.1→v0.2 changelog item "Thêm §12", which is a version-change description, so preserve is correct.
  - L41 `reading-map.md` is a preserve with a successor note to `docs/reading-map.md`, which exists at the pin.
  - L735 `reading-map.md` is a preserve inside the 0017 narrative with the same note.

### Coverage and exclusions

- Every explicit legacy-root path in the file is covered. These are the `docs/specs/...` paths on lines 225, 522, 529, 622, 733 and 745, `docs/decisions/...` (including the elided and bare forms), and the changelog links.
- Excluded scan hits are correct under L12-38(5) and L12-53: bare basenames inside the retired-decision narrative (L666 `platform-foundations.md`, L691 and L715 `0004-pham-vi-va-non-goal.md`).
- Bare `architecture-map.md`, `id-systems-audit.md` and `backlog.md` basenames are retained roots, so they are not edges.
- The `.mjs` mentions on lines 162–185 are code paths, not documentation references.
- No missed references.

## OUTCOME defects

None.

## Record-text notes (not rework)

- The self-holder notes for 0010, 0015 and 0017 (01237, 01240, 01241, 01244, 01259) read "docs/architecture-map.md, retired decision 00NN section". L12-52(1) calls for the exact heading, such as "### 0010 — Bản đồ kiến trúc là bản chuẩn". The note identifies the right section but does not quote the heading. If the checker permits, quoting the heading would be tidier.
- The 0012 note names the heading "8. ADR 0012 Unified Typed-Edge Graph Model" for source slug "typed-edge-model-supersedes-deps-parent-separation". Matching is by number and as the sole holder, so it is acceptable.

## Lead-judgment questions

None.

## Counts

- Set batch-033, stratum L12-51 targeted re-review: 1 file reviewed, 0 rework, 42 edges reviewed, 0 outcome defects.

Status: DONE
Summary: `docs/architecture-map.md` (batch-033, 42 edges) is ok, with no outcome defects. The only observations are two record-text notes on the wording of the self-holder notes.
