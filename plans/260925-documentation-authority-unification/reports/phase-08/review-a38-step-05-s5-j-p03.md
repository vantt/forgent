# Review p03 (seam 5 judgment files: scripts and CLI tests)

Payload: s4-src-p03.json, 12 files, 167 items (58 ADMIT, 109 REJECT). No patches, no parks, no diffs, no co-cut paths. Every item is preserve.

Scope note: nothing here reads a retiring document. The only real file read is the plans/** vocabulary JSON, correctly rejected under R11. All other document paths are synthetic strings or tmp-repo fixtures. So the preserve dispositions are all fine. The defects below are admission inconsistencies that leave the outcome unchanged (R10: fix now, no re-review).

## Per file

| File | Verdict | Items |
|---|---|---|
| test/scripts/doc-decision-conservation.test.mjs | rework (admission only) | 17 |
| test/scripts/doc-decision-exact.test.mjs | ok (Lead question Q1) | 24 |
| test/scripts/doc-decision-mirrors.test.mjs | ok (Lead question Q1) | 23 |
| test/scripts/doc-decision-review.test.mjs | ok | 25 |
| test/scripts/doc-link-pass.test.mjs | rework (admission only) | 26 |
| test/scripts/doc-restoration-proofs.test.mjs | ok (Lead question Q1) | 16 |
| test/scripts/knowledge-classifier.test.mjs | rework (admission only, 1 item) | 9 |
| test/scripts/verify-phase-02.test.mjs | ok | 1 |
| test/scripts/doc-review-authorship.test.mjs | ok | 18 |
| test/cli/fgos-edit-2.test.mjs | rework (admission only) | 2 |
| test/cli/fgos-intake-3.test.mjs | ok | 4 |
| test/cli/fgos-intake-4.test.mjs | rework (admission only) + Q2 | 2 |

## OUTCOME defects (admission wrong, disposition preserve unchanged)

D1. Pure in-memory fixture strings are ADMITted in some files and REJECTed in others. The rule that decides it is R5/R6: only an operand that constructs, reads or writes a document path is admitted. A string handed to a pure function (coverageOfSources, planLinkPass, classifyDocFile, buildReviewPack) neither reads nor writes anything, so it should be REJECT (config-or-metadata, the label already used in doc-decision-review, exact, mirrors, restoration).
- doc-decision-conservation.test.mjs: reference-004934..004941 (L5, L16, L17, L18, L19), dynamic-032581 (L19, `path: 'docs/specs/examples.md'`), dynamic-032583 (L73, `path: 'docs/user/guide.md'`). All are data in an `inventory`, map text or `mirrors` array passed to pure functions. No fs or git operation is involved.
- doc-link-pass.test.mjs: reference-004955..004968 and dynamic-032655..032663, 032665 (all ADMIT, role synthetic-fixture). Alias `fromPath` strings and link text go only into planLinkPass/specificTarget.
- knowledge-classifier.test.mjs: reference-005074 (L23, `classifyDocFile('docs/how-to/reclaim.md', content)`) is an in-memory path argument.
- Correction: pick one rule for the whole batch. The comparable cases in doc-decision-review (rows with `sourcePath: 'docs/specs/example.md'`, reference-004951/004952, dynamic-032648) and in exact, mirrors and restoration are REJECT. Convert the items above to REJECT config-or-metadata (no pathOperand, nonDocumentUse set). Keep ADMIT only where an fs or git operation builds a document path (see Q1).

D2. doc-link-pass.test.mjs, same-shape split: dynamic-032663 (L73, template `| ${label} | [docs/architect/a/design.md](../../architect/a/design.md) |`) is ADMIT, while dynamic-032664 (L79) and dynamic-032666 (L81), templated markdown with the same link, are REJECT text-label-join. These are identical in kind (markdown text fed to planLinkPass), so they need one admission. Under D1 all three become REJECT. If D1 is not adopted, 032664 and 032666 become ADMIT. Either way they must agree.

D3. Comment pointers into document trees are wrongly REJECT comment-or-type.
- fgos-edit-2.test.mjs reference-003953 (L125) and 003954 (L169) point to `docs/history/...` in comments. R16 says "comment pointers into docs/history => admit/preserve uniformly". Correction: ADMIT, preserve, role comment-provenance, keep the dated-provenance reason.
- fgos-intake-4.test.mjs reference-003959 (L312) and 003960 (L273, matched text split across `//` lines) point to `docs/architect/doing-coordination-redesign.md` in comments. The precedent for such pointers in these records is ADMIT/preserve with a dated tree-retires witness, for example the `docs/architect/knowledge-registry-redesign.md` comment-provenance items in generators-skills-and-support. Correction: ADMIT, preserve, role comment-provenance, witness treeRetires true. See Q2 for the live-holder question.

## Lead-judgment questions

Q1. Tmp-repo writes with a document literal under a mkdtemp root. `path.join(root, source)` and similar are ADMIT/synthetic-fixture in doc-decision-exact (dynamic-032597, 032598, 032600), doc-decision-mirrors (032625, 032626, 032627), doc-restoration-proofs (032729..032731, 032735, 032736) and knowledge-classifier (033477..033482). R21 treats operands based on os.tmpdir()/mkdtemp roots as non-document roots, which points to REJECT. The same files REJECT the tmpdir root itself (non-document-fs-probe) but ADMIT the joined path. This does not change the outcome and both readings preserve, but the batch should apply one rule. Suggest REJECT with nonDocumentUse tmp-fixture, unless Lead wants fixture writes of a moved-tree literal such as docs/architect/** or docs/specs/** to stay visible as admitted. The `docs/platform/**` and `docs/how-to` writes (restoration L16/L33, knowledge-classifier) are not moved paths either way.

Q2. Comment pointers in fgos-intake-4 (L273, L312) name `docs/architect/doing-coordination-redesign.md`. A live holder exists at the pin: `docs/platform/proposals/doing-coordination-redesign.md`, and a ledger decision exists at `plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-04-doing-coordination-redesign.json`. R8 makes a patch for a module-header navigation pointer with a live holder. These are inline, dated tsk-40m provenance in a test narrative, not a module header, so preserve as dated provenance is defensible. The current reason text does not mention the live holder. Recommend either keeping preserve and naming the live holder in the reason, or deciding it is a comment-only test patch to the proposals holder (that would need a forward/inverse diff and a replay under R22).

## Record-text notes

- doc-decision-conservation dynamic-032584 (L74, `cells.map(...).join('\n')`) has nonDocumentUse non-document-fs-probe. It is a text/label join, so the label should be text-label-join.
- doc-decision-conservation: the one shared reason ("coverage maps and unitsOf callbacks ... returned uncovered paths") is applied to all 17 items, including label joins and `sourcePath: source` metadata. It is accurate for the file but not for each tuple.
- fgos-intake-4 reference-003960: the matchedExpression spans a line break (`docs/architect/doing-\n// coordination-redesign.md`). Fine as is, but name the comment lines (L273-274) in the passage text.
- resolverWitness on the ADMIT synthetic rows says "treeRetires": true even for non-tree values such as `docs/user/guide.md` (032583) and `docs/user/**`. Under D1 that row becomes REJECT anyway.

## Checked and fine

- Every plans/** vocabulary or report operand is REJECT plans-report-artifact (exact 032590/032602, mirrors 032609/032610, restoration 032738, review-authorship 032739..032754). This matches R11. The review-authorship items for `path.join(root, 'source.md')` are bare basename in a tmp root, so reject is right.
- doc-decision-review: all 25 REJECT are correct (in-memory rows, `reportPath: 'fixture/review.md'`, reviewer/label templates). verify-phase-02 reference-005160: `diffNames()` callback data for a negative footprint case, REJECT correct.
- fgos-intake-3: the three `docs/history/p50-workflow-induct/` docsRef strings are one passage and share ADMIT/preserve. `work.mjs` has no on-disk existence check for docsRef (comment at line 613), so there is no hidden reader. 017327 is a title template, REJECT correct.
- Same-passage agreement holds on every line where a literal and a dynamic tuple share an expression (conservation L16/L17/L19, link-pass L6/L7/L8/L31/L52/L53/L58/L59/L68, exact L80-L88, mirrors L61, restoration L45/L47/L57/L58). Independent operands inside one call (path vs content template) are split legitimately.
- No park, patch or successorNote items, so the blockedReason, retired-decision and replay checks have nothing to find. No item has a pathOperand that fails to yield a document path, apart from the D1 cases noted above.

## Counts

Reviewed 167 / 167 items. ADMIT 58, REJECT 109. Admission defects: D1 about 48 items (conservation 10, link-pass 24, knowledge-classifier 1, plus Q1 overlap not counted), D2 3 items (included in D1 for link-pass), D3 4 items. No disposition defects. No diffs to check.

Status: DONE_WITH_CONCERNS
Summary: All 167 items are correctly preserve with no hidden consumer change; the defects are admission-only inconsistencies (in-memory fixture strings admitted in some files and rejected in others, split admission on identical link templates in doc-link-pass, and comment pointers into docs/history and docs/architect rejected instead of admitted), plus two Lead questions on tmp-root path joins and a live holder for the doing-coordination-redesign comment.
