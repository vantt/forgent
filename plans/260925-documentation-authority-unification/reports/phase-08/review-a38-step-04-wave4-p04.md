# Review a38 — Step 4 wave 4, part 04 (step04-030)

## core/skills/fgos-indexing/SKILL.md

Set step04-030, stratum: skills. Verdict: **ok**. Source read whole (84 lines, pin dc24ce645). 21 slots reviewed: 1 patch, 4 preserve, 2 parked, 14 render-join (3 `docs/specs/reading-map.md`/how-to/tutorials/reference/explanation joins per render file on lines 63-64, plus 4 new quadrant joins). The `.claude` wrapper is 16 lines with no passage, so it carries no slot.

### Wave 3 rework: `docs/<quadrant>/` (lines 20 and 41)
- Line 20 `exist under \`docs/<quadrant>/\`.` is `parked`, timing none, `dependencyCategory` description-rewrite. The reason names the Phase 9 description rewrite plus Step 5 scanner/writer parity. `parkSourceQuote` matches the source passage. A passage-content live-holder search is present (`searchWitness` and `passageSearchWitness`). Alias lookups were empty, and the only carriage hit is history.
- Line 41 `\`fgos docs-index\` enumerates every document under \`docs/<quadrant>/\`` is parked on the same terms. The quote matches the source line.
- This matches core/task-specs/fgos-indexing.md line 6 (`docs/<quadrant>/`, parked, timing none, description-rewrite). The Input section there lists the four quadrant directories, which is the same layout claim.
- Render joins: `.agents` lines 21 and 42, and `plugins/fgOS` lines 21 and 42. I checked each at the pin, and the render line equals the source line plus one for the generated header at line 13. The text is byte-identical to source lines 20 and 41, and the columns (14-30 and 52-68) match. `sourceSlotKey` points at the source lines 20 and 41. Their disposition is `render-join` with no target, anchor or diff, and the reason says "Source outcome: parked" with the matching own passage. `renderOnly` is true, and both files have the header witness at line 13 and the `npm run build:skills` door.
- Outcome: all six slots are correct.

### Other slots
- `skills-085`, line 62, `docs/specs/reading-map.md`: patch. The target `docs/reading-map.md` exists at the pin. Heading line 122 `## 5. Detailed Product And Source Map` gives the slug `5-detailed-product-and-source-map`, so the anchor resolves. Section 5 line 157 carries the end-user read-by-tag index pointer, so it is the correct current owner. The diff hunk (`@@ -59,7`) changes only line 62, keeps the backtick form and leaves the `docs/how-to/` text intact. The context lines (59-61, 63-65) match the source. Applied verbatim, the line renders correctly, and the path is repo-root relative like the original.
- Preserve slots for `docs/how-to/` (line 62), `docs/tutorials/`, `docs/reference/` and `docs/explanation/` (line 63) are correct. The directories exist at the pin, with 34, 1, 7 and 137 files.
- Joins `skills-043` and `skills-176` (render line 63, source outcome patch) and the three/three how-to/tutorials/reference/explanation joins (render lines 63-64) have the same passage as the source and carry no own diff.
- No missed reference. The remaining paths are `docs/enduser-docs-index.json` (lines 9, 43, 67, 74), `repo/src/report/enduser-index.mjs` and bare `reading-map.md`. The first two exist at the pin and are not retiring, and the last is a bare filename, not an edge. `stepFiveExcluded` is empty, which is correct since the file has no runtime strings.

### Defects
- OUTCOME defects: none.
- Record-text notes (not rework): none material. The parked slots use timing "none", consistent with the task-spec record, while the reason text says Phase 9.
- Lead-judgment questions: none.

## Counts
- Set step04-030 / stratum skills: 1 file reviewed, 0 rework, 21 slots reviewed, 0 outcome defects.
