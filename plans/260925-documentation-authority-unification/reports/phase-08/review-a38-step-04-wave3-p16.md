# Review a38 Step 4 wave 3, part 16 (set step04-020)

Pin dc24ce645. Payload step-04-wave3-p16.json. File: packages/herdr-fgos-common/rust/src/fgos.rs, read whole (1119 lines) via git show. Every doc/path mention was grepped, so all 4 occurrences are covered.

## Verdict
packages/herdr-fgos-common/rust/src/fgos.rs, Category A+B: ok. 3 slots reviewed, 0 rework.

## Slot findings

- class6-l-000200 (line 25, patch).
  - The old path docs/reference/triage-table-columns.md does not exist at the pin, so this is a dead link.
  - The target docs/knowledge/fgos-triage-table-columns/triage-table-columns.md exists. It was moved by commit 126a8ae51, with only frontmatter changes (quoted title, framework and mode keys); narrative and text are identical.
  - The H1 "# `/fgOS:triage` table columns" slugs to `fgostriage-table-columns`, so the anchor resolves.
  - The claim "own 'rendered as-is'" is proven by the status row, which says "rendered as-is".
  - Diff is a single `///` doc-comment line. Backticks and label form are kept. The path is repo-root-relative like the original.
- class6-l-000201 (line 242, patch, no anchor).
  - Same-basename moved-verbatim knowledge holder. Ruling 1 requires a patch. The diff replaces the path only, and the comment line stays well-formed.
  - The anchorless form fits this slot, because the claim is about the whole document.
- class6-l-000202 (lines 721-722, preserve).
  - The wrapped reference `docs/history/herdr-plugin-parkreason-pane-filter/ CONTEXT.md` exists at the pin as docs/history/herdr-plugin-parkreason-pane-filter/CONTEXT.md.
  - It is a design-origin history citation (tsk-1hb D2/D4) and a portable history convention (L12-10), so preserving is correct. The matched expression covers both wrapped spans.
  - Line 134 "CONTEXT.md D3/D4" is a bare filename, not an edge. No missed reference.

## Behavior check
- Both hunks (@@ -22 and @@ -239) change only `///` doc-comment text. No code, attribute or string literal is touched.
- A repo grep found no test or script that reads these comment strings. No behavior change.

## OUTCOME defects
None.

## Record-text notes (not rework)
- The 201 comment says the doc "already documents `goalTier`" absent-sorts-last. Neither the old nor the new doc states absent-sorts-last for goalTier; the tier row says only `-` when no tier. The mismatch is in the original source text, and the doc was moved verbatim, so ruling 1 still requires a patch. It is a stale source claim for the owner to know about, not a Step 4 defect.

## Lead-judgment questions
None.

## Counts
Set step04-020: 1 file, 3 slots reviewed, 0 rework.

Status: DONE
