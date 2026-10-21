# Review a38 Step 5 seam 5 batch 6 part p01

Pin 5eb9dc609, read through git objects. Payload: `s4-src-p01.json`, 3 files, 155 items in total.

## Per file

### test/report/enduser-index.test.mjs
Verdict: rework (one outcome defect). Items reviewed: 115 (29 admitted parks, 8 admitted preserves of comment and title items, 4 admitted real-reader preserves, about 74 rejects).

Parks reviewed against the source:
- The decisions and explanation alias readers are parked consistently with generator dynamic-009788 and dynamic-009791. The passages are L316-L351 and L373-L386.
- Same-passage items agree. L334 has 004319, 004351, 021544 and the author slot, all parked. L325 has 004320 and 004347, L330 has 004311 and 004348, and L345-L346 have 004349, 004331 and 021545.
- The blockers differ between passages. Identical wording appears only inside one passage.
- Every park names a real dependency.
- The pathOperand fields of the admitted dynamic tuples do yield real document paths: `path.join(REPO_ROOT,'docs','decisions'|'explanation')`, `decisionsDir`, and the real `docs/how-to/check-rollup-progress.md` read.
- The retained `docs/enduser-docs-index.json` and `docs/tutorials` readers (021514-021519) are correct admit/preserve.

Rejects reviewed:
- The fixture-only rejects are true. They are the in-memory `docPath: 'docs/how-to/foo.md'` literals and the `path.join(cwd, ...)` joins under `os.tmpdir()` mkdtemp (L216-L300).
- The `__dirname`, `REPO_ROOT` and `bin/fgos.mjs` plumbing rejects (021507, 021510-021512) are true.
- The `docs/knowledge/sample-purpose` joins are under a tmp cwd, so reject is correct.

OUTCOME defect:
- dynamic-021552, source L386. The park is `demo-read`, but the read is a direct `fs.readFileSync(path.join(REPO_ROOT,'docs','how-to','check-rollup-progress.md'))`. It does not depend on generator output.
  - The rule violated is a live holder with the same passage means a patch, not a park. The blocker only asks to "verify the proposed holder carries both fields".
  - I verified it at the pin. `docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md` exists. Its frontmatter has `type: how-to` and `source_capture_ids: [doc-fgos-rollup-howto]`. The `framework` and `mode: how-to` fields are present too.
  - Correction: make it a patch. That means a source and test diff that rebinds the read path, with the L385 title (004312) as the co-cut. Alternatively, keep the park but name a real missing claim. The current text names none.

No diff is carried in this file (parks and preserves only), so no replay is owed under R22.

### test/cli/fgos-merge.test.mjs
Verdict: ok. Items reviewed: 3.
- 003965 (L925-L926) is admit/patch. This is a comment-navigation pointer to `docs/how-to/add-a-read-only-fgos-verb-and-plugin-skill.md`. That path is absent at the pin. A unique holder exists at `docs/knowledge/add-a-read-only-fgos-verb-and-its-plugin-skill/add-a-read-only-fgos-verb-and-plugin-skill.md`. The diff changes only that comment, and the forward and inverse diffs mirror each other. The file is the test itself, which is the right place. The patch needs an R22 replay, and replay-deferred-phase9 is acceptable.
- 003966 (L387) and 003967 (L1014) are dated `docs/history/` comment pointers, admit/preserve. This is correct under R16, and the `docs/history/sync-root-*` files exist.

### test/intake/plan.test.mjs
Verdict: ok. Items reviewed: 4 judgment items plus 33 mechanical or judgment-neutral tuples. All of the 33 are test-tmp, `storeDir`/`featureDir` and label joins, and they are true rejects.
- 004241 (L113-L114) is admit/patch. The old `docs/how-to/avoid-vacuous-pass-...pattern.md` is absent at the pin. A unique `docs/knowledge/avoid-a-vacuous-pass-from-node-test-test-name-pattern/avoid-vacuous-pass-with-node-test-test-name-pattern.md` exists. The diff is comment-only and has an inverse.
- 004240 and 004242 are `docs/history/` comments, admit/preserve under R16.
- 004239 is a reject. `docsRef: 'docs/history/never-written/'` is a work-record field resolved under a tmp store, and nothing real is read. The nonDocumentUse `config-or-metadata` is true.

## Record-text notes
- Both comment patches (merge and plan) reflow the comment so a stub line is left (`// .` in merge, `// ) -- the ONE thing` in plan). The edit would be cleaner if it rewrapped the comment, but the outcome is not affected.
- Both patch records list `CHANGELOG.md` in `coCutPaths`. A comment-only test edit has no changelog effect. Check that this is not just inherited boilerplate.
- 004308 (title L373) is parked, while the other titles 004312, 004321 and 004346 are preserved as co-cut. This matches the L12-81 P01 ruling, so it is not a defect. The titles' parity obligations should keep naming the reader they follow.

## Lead-judgment questions
1. The tmp fixtures (021521-021538: `path.join(cwd,'docs','how-to','hello.md')`, and the manifest written under `cwd/docs/`) are correct R21 rejects. They are not repository documents. However, they do feed the generator's quadrant scan, in which `docs/how-to` is a scan root. If the parked alias decisions (dynamic-009788 and dynamic-009791) change the scanned directory names, these fixtures would need a co-change. Phase 9 should carry this as a parity watch item. It is not an admission change.
2. 004305 (L341) and 004307 (L369) are comments saying `docs/decisions/` "now holds only index.md". They are preserved as dated provenance, which is acceptable. They become stale if the decisions-index alias decision moves the file. Decide whether to note them for Step 7.

## Counts
- Files: 3 (1 rework, 2 ok).
- Items reviewed: about 155 (115 + 3 + 37).
- OUTCOME defects: 1 (dynamic-021552).
- Record-text notes: 3.
- Lead questions: 2.
