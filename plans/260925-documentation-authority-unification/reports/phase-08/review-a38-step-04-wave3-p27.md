# Review a38 step 04 wave 3, part 27 (set step04-031)

Reviewer scope: final-state review at author pin dc24ce645, four whole source files, 7 slots. Sources were read whole (the two task specs and both prompt templates are under 100 lines). Category: fgos-indexing.md and worker-prompt-skill-pointer.txt are A; fgos-researching.md, worker-prompt-discovery.txt and worker-prompt-skill-pointer.txt are B.

## Per-file verdicts

| File | Set | Stratum | Verdict | Slots |
| --- | --- | --- | --- | ---: |
| core/task-specs/fgos-indexing.md | 031 | task spec | ok | 2 (1 patch, 1 parked) |
| core/task-specs/fgos-researching.md | 031 | task spec | ok | 1 (preserve) |
| src/runner/prompt-templates/worker-prompt-discovery.txt | 031 | prompt | ok | 1 (preserve, two census joins) |
| src/runner/prompt-templates/worker-prompt-skill-pointer.txt | 031 | prompt | ok | 3 (1 preserve, 2 patch) |

## Outcome defects

None.

## Evidence per slot

- fgos-indexing.md skills-088 (line 12, patch). `docs/specs/reading-map.md` changes to `docs/reading-map.md#5-detailed-product-and-source-map`. `docs/reading-map.md` is live and its heading `## 5. Detailed Product And Source Map` is at line 122, so the anchor resolves. Line 157 in that section names `docs/enduser-docs-index.json`, the `fgos-indexing` skill and `docs/specs/enduser-docs-authoring.md`, so the pointer description is true. The backtick form is kept. The diff applies cleanly to the pinned bytes (`patch --dry-run`), and the only changed line is the pointer line. The reason's "Phase 9 first conserves remaining reading-map source" refers to the Step 3 carry. The passage witness shows 0 hits for the heading text only because `docs/reading-map.md` is outside the search roots. The `enduser-docs-index.json` term has 40 live hits.
- fgos-indexing.md parked slot (line 6, `docs/<quadrant>/`, author-added, no census id). The park is justified by a content search, not just a name search.
  - Alias lookups (alias-table, doc-registry) return no matches.
  - The `<quadrant>` term gives 12 live hits, but I read them and none states where end-user documents are located. They are `fgos compound --doc-type <quadrant>` recipe lines, and work-state RUL52, which defines the `docType` label and not a directory. The one location statement (`docs/platform/proposals/knowledge-registry-redesign.md:33`) is carriage ("Canonical: No").
  - A repo-wide pin search of `docs/platform` and `docs/reading-map.md` for end-user doc, `enduser-docs` and read-by-tag finds no live holder of the input layout.
  - A park with a Phase 9 description rewrite and Step 5 scanner/writer parity as the blocker is the right outcome. A patch would invent a layout.
- fgos-researching.md skills-089 (line 11): `docs/history/<feature>/RESEARCH.md` is a pattern, not a path. It is the portable sibling RESEARCH convention that L12-10 keeps unchanged. Preserve is correct. The bare `RESEARCH.md` on line 17 is not an edge.
- worker-prompt-discovery.txt skills-198 (line 21, also class6-l-000322): same convention and same preserve. Both census ids are joined on the slot.
- worker-prompt-skill-pointer.txt skills-199 (line 55, `docs/history/<your item id>/iron-law-evidence.md`): a pattern naming a writer destination in the external project. Preserve under L12-10. The census id class6-l-000325 is also joined.
- worker-prompt-skill-pointer.txt class6-l-000323 (line 31) and 000324 (line 48), patch. The old path `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md` does not exist at the pin (a dead link). It was moved verbatim by commit 989d0c7fa. The target `docs/knowledge/produce-failing-test-first-proof-for-an-iron-law-gated-diff/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md` exists, is non-carriage, and contains the three "Watch out for" sections. The first citation reads `'s "Watch out for" section`, which still holds. This is the ruling 1 case (same basename, moved verbatim). Both diff hunks apply cleanly, keep the backticks and the trailing `'s`, and use repo-root paths.

## Record-text notes (not rework)

- The checks record the two patched citations as "read-only citation", which is true of the txt file itself.
- The 000324 passage witness for the file name has 0 hits (the term is the old slugged title). Existence at the pin was confirmed by the moved-verbatim digest witness, so this is fine.

## Lead-judgment question

- `test/runner/prompt-templates.test.mjs` lines 198 and 215 hold a byte-exact golden of the skill-pointer prompt, including both old `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md` citations. They are escaped (`\``), so the census missed them. That file only lists `docs/specs/widget.md` hits in the consumer inventory. When Phase 9 applies the two skill-pointer patches, the golden must change in the same step, or that test fails. The record does not mention this coupling. I do not treat it as a defect of this part, because the template slots themselves are correct and the test is outside the Step 4 file set. The Lead may want to log it as a Phase 9 co-edit, and note that the patch also changes the worker prompt text.

## Counts

Set 031: 4 files reviewed, 0 rework. 7 slots reviewed (3 patch, 3 preserve, 1 parked). The parked slot's passage-content witness was verified live.
