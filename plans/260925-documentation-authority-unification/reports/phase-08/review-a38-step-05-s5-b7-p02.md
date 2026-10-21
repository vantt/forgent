# Review a38 step 05, seam 5 batch 7, part p02 (s4-src-p02.json)

Pin for all three files: 5eb9dc609f303fc9d54377f866b5e8caf9a5d129 (read through git objects). Read-only review; no checker, probe, CLI or test was run.

Totals: 3 files, 148 items reviewed (file 1: 115 = 41 admit / 74 reject; file 2: 3; file 3: 30). The 74 rejects in file 1 are in-memory fixtures, tmp-cwd joins, `.fgos` paths or REPO_ROOT/`bin` plumbing. I checked each one against the pinned source, and none builds or reads a real document path. One note on rejects: L396-441 `docPath === 'docs/knowledge/sample-purpose/...'` (021560/021561) compares a product-emitted path to a literal. Post-merge 003985 admits the same kind of comparison (see note N3).

## test/report/enduser-index.test.mjs: verdict REWORK (3 low-severity outcome defects)

Reviewed 115 items (67 dynamic tuples, 48 literal references).

Dispositions: 2 patch (004312, dynamic-021552), 29 park, 10 admit/preserve, 74 reject/preserve.

Verified ok:
- **Patch 004312 + dynamic-021552 (L385 title, L386 read).**
  - The holder `docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md` exists at the pin.
  - Its frontmatter carries `type: how-to` and `source_capture_ids: [doc-fgos-rollup-howto]`, which is exactly what L388-391 assert.
  - Both items are on one operation and share one outcome.
  - The diff touches only L385-386. The hunk is -382,8/+382,8, and the rollback is the exact inverse.
  - No live baseline holds the old title. Only archive logs and the retiring docs/architect logs do.
  - It is on a source test file, and the co-cut set (CHANGELOG, test, helper) is present.
  - The patch holds whether or not `docs/how-to` moves, because the holder exists today.
- **L162/L167/L179 stay parked** (004330, 004344, dynamic-021513). The seeded demo path comes from `REAL_DEMO_DOC_PATH` in the helper, which still reads `'docs/how-to/check-rollup-progress.md'`. The blocker names that co-cut. I find no same-passage disagreement with the L386 patch, because L386 is a separate direct read.
- **docs/decisions, docs/explanation, docs/enduser-docs-index.json parks.** 004305/004307/004308/004311/004319/004320/004331/004332/004343/004345/004347/004348/004349/004351 and dynamic-021513/14/15/42/43/45/47/48/49 are all admit/park.
  - The blockers are passage-specific (alias enumeration, index.md membership, primaryDoc selection, count equality) and name 009788/009791. I found no templated or boilerplate text.
  - The move set confirms docs/explanation (216 paths) and docs/how-to (96) are proposed moves, and docs/decisions/index.md maps to a knowledge holder, so R26 parks are right.
  - docs/enduser-docs-index.json has no standalone move target (the units file says so). The park cites the retention-or-move dependency, which matches the R26 ruling.
- **Preserves rest on a true witness.** `docs/tutorials` is absent from all 1,561 move-set paths and holds only `.gitkeep`. So 004304/004324/004329/004350 and dynamic-021516..19 (the rename-aside read of the real dir) preserve correctly. 004336 (L171 dated comment) and 004321/004346 (L316 titles, co-cut with the parked reader, same line, same outcome) are fine.
- No retired-decision citation is present, so no successorNote is owed.

### OUTCOME defects (low severity; over-park, no unsafe outcome)

- **D1. dynamic-021550 (L380)** is admit/parked but should be REJECT.
  - Rule: R6/R16 and the L12-74 p05 ruling "basename-only prints rejected". The template `${file} must have a non-empty frontmatter type` prints only a basename from the readdir loop. It builds no path and has no fixed doc literal.
  - Correction: reject with nonDocumentUse `caller-data-message-formatting`, disposition preserve. The loop's real reads (021547/48/49, 004308) stay parked.
- **D2. dynamic-021551 (L381)** is the same case as D1 (`${file}'s frontmatter type must be 'explanation'`). Correct it the same way.
- **D3. dynamic-021544 (L335)** is admit/parked but should be REJECT.
  - Rule: R6. The message prints `entry.docPath`, which is manifest (caller) data with no fixed doc root or literal. It is an independent operand of the assert.ok call whose path literals (004319/004351, L334) are parked, so R16 allows a different outcome.
  - The blocker text calls itself "not an unrelated scalar diagnostic", but that is an assertion, not evidence. Correct it to reject/preserve.

### Record-text notes
- dynamic-021516..19 reason says "Real retained index/tutorials path and exact frontmatter assertions". There is no index in that passage, and the frontmatter assertions are not there either. Reword to the docs/tutorials rename-aside read (retained, not in the move set).
- dynamic-021543's `dependency` is null while its blockedReason is specific. Add the dependency label (alias membership / explanation move) for consistency with its siblings.

### Lead-judgment questions
- Q1. L316 titles 004321/004346 are preserve (co-cut), while the L373 title 004308 is park. Both are test titles whose bodies are parked readers, and both change in Phase 9 together with those readers. This is an outcome split on one kind of item, and it is harmless because the co-cut is explicit. Confirm that title items are meant to split by whether their own text names a moving dir.
- Q2. The same manifest literal joined to a tmp cwd, `path.join(cwd,'docs','enduser-docs-index.json')`, is R21-rejected here (021525/27/32/33/38/40). It is park in post-merge via the harness helper (see file 3, Q4).

## test/cli/fgos-merge.test.mjs: verdict OK

Reviewed 3 items.
- **003965 (L925-926, patch).**
  - The old `docs/how-to/add-a-read-only-fgos-verb-and-plugin-skill.md` is absent at the pin. The unique holder `docs/knowledge/add-a-read-only-fgos-verb-and-its-plugin-skill/add-a-read-only-fgos-verb-and-plugin-skill.md` exists.
  - The diff is a comment-only repair of the dead wrapped pointer, with no output delta. The rollback is the exact inverse. The added blank line keeps the line count unchanged. It sits on a source test file.
  - No CHANGELOG co-cut is needed for a comment-only unit, and none is listed.
- **003966 (L387) and 003967 (L1014)** are admit/preserve as dated `docs/history/...` comment pointers (R16 uniform). `docs/history/sync-root-direct-outcome-tests` and `docs/history/merge-next-auto-sync-root` exist at the pin, and docs/history is not in the move set.

Note: the receipt marks this as an R22 current/candidate replay obligation. Per R25, a deferred replay is acceptable once the command, lines, diffs and co-cut set are present (they are). A comment-only patch changes no assertion output.

## test/cli/fgos-post-merge.test.mjs: verdict OK (notes only)

Reviewed 30 items (5 literal references, 25 dynamic tuples) plus 12 author-added slots; 6 parks and no patches or diff.

- **The six parks** are author-s5-b6-closure-manifest-reader-187/188/198/201/212/216: the six `docsIndexManifestPath(...)` call sites at L187/188/198/201/212/216.
  - Their blockedReasons name each distinct operation (existsSync placement, statSync no-rewrite, row-count read) and co-cut with generator 009788/009791 and harness dynamic-017973.
  - The dependency is the R26 form "Phase 9 retention-or-move decision for docs/enduser-docs-index.json". They are not templated: each operation differs.
  - The harness helper at `test/cli/helpers/fgos-cli-harness.mjs` L366 is `path.join(root,'docs','enduser-docs-index.json')`, so the path literal is fixed there, as L12-83 recorded.
  - All six calls in the file are covered, and none is missed.
- **Admit/preserve.**
  - 003985/86/87 (L231, L186) and dynamic-017580 with author-115-43/118-61 (L115/L118) are fixed paths passed to or emitted by the product CLI inside tmp fixtures. All items on those lines share one outcome.
  - The L124/L126 comments are preserved as dated provenance.
- **Rejects** at L130-131, L178-179, L194-195, L209-225, L300-302, L326-327 and L332 are tmp-rooted (R21), `.fgos`, or label joins. Reject/preserve is right.
- Mixed outcomes on lines 145 and 188 are acceptable: prose `docs/` inside an assert message is an independent operand beside the parked call (R16).

### Lead-judgment / record notes
- N3. Admission wording differs for the same operation kind (an emitted docPath compared to a literal). Post-merge 003985/003987 (L231) is admit, while enduser-index 021560/021561 is reject. Likewise `--doc-path docs/how-to/compound-lock-item.md` (003984, L336) is reject while `doc-sources docs/some-doc.md` (L115) is admit. All are preserve, so there is no Phase 9 action change (R10 label-level), and there are no new defects.
- Q4. The six parked call sites hold no path literal and receive tmp roots (`main`, `wt`, `cwd`). Under R21 they could be neutral, and enduser-index rejects identical tmp-rooted manifest joins. Parking them follows the L12-83 ruling that joins them to dynamic-017973. It adds no text change in Phase 9, since only the helper changes. Confirm this is intended over-linking, not a rule to extend to enduser-index.

## Summary counts
- Items: 148 reviewed, with 3 OUTCOME defects (dynamic-021544, dynamic-021550, dynamic-021551 in enduser-index). All three are admit/park to reject/preserve, with no effect on any patch or on Phase 9 actions.
- Patches: 3 items in 2 patch units (enduser-index L385/386; fgos-merge L925-926), all verified against live holders.
- Retired-decision citations: none, so no successorNote is owed.
- Verdicts: enduser-index rework, fgos-merge ok, fgos-post-merge ok.

Status: DONE_WITH_CONCERNS
Summary: Two of three files are ok. enduser-index has three low-severity over-park defects (the message-only items 021544/021550/021551 should be rejects); every patch and R26 park verified against pinned holders and the move set.
