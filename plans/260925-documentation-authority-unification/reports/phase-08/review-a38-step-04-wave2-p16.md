# Review a38 — step-04 wave 2, part 16 (set step04-009)

Pin dc24ce645. Source file read whole (28 lines, 1888 bytes) through EOF. Slots: 24 (12 patch, 12 render-join). The diff was applied to a scratch copy of the pinned blob and applied cleanly.

## core/instructions/platform-laws.md — set step04-009, stratum mandatory re-review (patched) — verdict: ok

All 24 slots reviewed.

### Patch slots, source lines 15, 17-26, 28 (instructions-039..050)
- **Source coverage.** The source has exactly 12 occurrences of `docs/platform-foundations.md`, on lines 15, 17-26 and 28. All 12 have a slot. Frontmatter (lines 1-10) and prose contain no other path.
- **Target.** `docs/platform/platform-foundations.md` exists at the pin and is the correct current owner. It carries the Luật nền section with the full L1-L10 text (lines 86, 113-339). Its own purpose and authority sections name it as the target reader entry.
- **Anchors.** Every anchor resolves to a real heading in the target. I recomputed each with `githubSlugText`, the repo extractor's slug function (`scripts/generate-doc-inventory.mjs`).
  - 039 and 050 use `luật-nền-platform-forgent-phase-0-compound-learning-stack`, which is the enclosing heading for the whole-law and authority claims.
  - 040-049 map each law to its own heading: L1 to L1, through L10 to L10. L6 resolves to `f0f5` and L9 to `run-merge-durable`.
- **Anchor form.** These are plain inline-code `path#anchor` citations, so the extractor anchor form applies under the L12 anchor-form rule (`githubSlug` is for markdown link destinations). The form is correct. The new anchors have a single hyphen, where the old ones had `--`.
- **Diff.** It rewrites only the path token and its fragment, keeps the backtick form, and the prose, bold labels and label text are unchanged. The paths are repo-root tokens, as in the source. The result renders correctly. No behavior is affected, because the file is an instruction body and the frontmatter is untouched.

### Render-join slots, AGENTS.md managed block (instructions-025..036)
- **Disposition and label.** All are `render-join` with null target, null anchor and null diff. Each carries `sourceDisposition: patch`. The block range is 321-411.
- **Header witness.** AGENTS.md line 341 reads "- source: `core/instructions/platform-laws.md`".
- **Line correspondence.** The render line is the source line plus 330. This holds for 345/15, 347-356/17-26 and 358/28. The recorded render spans match the render text.
- **Stale anchor forms.** The render text matches the pinned source byte for byte. The old `--` anchors survive only in the render, and a regeneration will replace them.
- **Step 5 exclusions.** The `stepFiveExcluded` list covers only AGENTS.md root rows, which are separate slots owned by AGENTS.md. None belong to this file.

### Outcome defects
None.

### Record-text and join notes (not rework)
1. **instructions-025 join points at the wrong source slot.**
   - Edge 025 is render line 345. Its own-passage text is "Platform laws L1-L10 are locked in `docs/platform-foundations.md` and define…", which is source line 15 (instructions-039).
   - Its `sourceSlotKey` instead names instructions-050 (source line 28, the "Authoritative statements…" sentence). It should name instructions-039.
   - As recorded, instructions-050 carries two render joins (025 and 036). Instructions-039 carries none.
   - The applied outcome is identical, because 039 and 050 patch to the same target and anchor and neither changes disposition. The slot is the only provenance mismatch among the 12 joins; the other 11 map correctly (026-035 to 040-049, and 036 to 050).
   - Correction: set 025's `sourceSlotKey` to the 039 slot key.

### Lead-judgment question
- Is the 025 join mismatch rework or a record-text fix? I judged it record-text because no diff, target, anchor or disposition changes. If the Lead treats an incorrect source-slot join as an outcome defect, this file is rework with only that one-slot correction.

### Counts
- step04-009, this part: reviewed 1 file (patched stratum), outcome rework 0. Counting 025 as outcome would make 1 of 1.
- This is part 16 of 16-17 for the step04-009 file set; part 15 covers the other 3 files and is judged separately.
