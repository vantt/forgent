# Review p11: test/scripts/generate-doc-inventory.test.mjs (pin 5eb9dc609)

Verdict: ok (no OUTCOME defects).

Items reviewed: 371 (8 ADMIT/preserve, 363 REJECT/preserve). No diff, no parks, no patches, no co-cut paths (consistent with the R22 preserve-only rule).

Method: read the pinned file through git (1498 lines), traced every filesystem, git and path operation, and compared each item's line and operand with its record.

## Basis for the verdict

- The file is the owning proof for the frozen gate scripts generate-doc-inventory.mjs, check-doc-inventory-gates.mjs and doc-inventory-artifact.mjs.
- Every path operation targets one of:
  - an `os.tmpdir()` mkdtemp fixture repo (`git init`, write, commit, `rev-parse`);
  - an in-memory fixture string or object (FIXTURE_SWITCHBOARD, scaffold, ls-tree lines, `classifyDocPath` / `classifyConsumerKind` inputs);
  - fixture source text written into tmp (the `path.join("docs","specs",name)` strings inside `[...].join('\n')`);
  - a plans/** artifact path (PHASE_DIR, DEFAULT_INVENTORY_PATH, DEFAULT_IDENTITY_REGISTRY_PATH, reports/...). R11 and R5 make these rejects.
- Greps for `repoRoot`, `process.cwd`, `import.meta.url` (only inside fixture strings), `__dirname`, `fileURLToPath`, `existsSync` and `readFileSync` found no read or write of a real repo document. The only `readFileSync` is of a tmp shard manifest.
- The 8 admits are the actual pinned test titles (lines 143, 153, 161, 169) and the comment pointer at L127 (`docs/how-to/**`), all preserve.
  - Same-line pairs agree: 005005 and 033087 at title L161; 005025, 005041 and 033088 at title L169.
  - Titles preserve as baseline keys, with treeRetires true for docs/architect and docs/specs, as in the earlier seam rulings.
  - The L127 comment is explanatory prose about retained corpora, with no live-holder change owed. Preserve is fine.

Admit vs reject, spot checks on the riskiest rejects:

- 004975 and 005023 (L721): fixture write content.
- 004982, 004981 and 005042 (L440-441): fixture, with assertions on fixture edges.
- 004996, 005035, 004994, 004995, 004997 and 004991 (`path.join("docs","specs"...)`): fixture source text, not a path operation.
- 005038 (L165, comment `classifyFile(): docs/architect + /proposals/`): describes the classifier rule, not a navigation pointer. Reject/preserve gives the same Phase 9 action as an R8 admit/preserve, so it is not an outcome defect (R10).
- 004999 and 005000: tmp `mkdirSync`, correct reject.
- Items 033159, 033130-033132 and 033116: string construction inside a tmp fixture or classifier input. Correct reject under R21 (test-owned tmp root).

## Record-text notes (labels only, outcome unaffected)

1. Wrong nonDocumentUse label (text-label-join; should be plans-report-artifact):
   - dynamic-033212 (L704, `${generator.PHASE_DIR}/reports`);
   - dynamic-033227 (L755, DEFAULT_INVENTORY_PATH `.parts/part-0001.json`);
   - dynamic-033228 (L756, PHASE_DIR resync path).
   All three are plans/** paths, so R11 labels them plans-report-artifact.
2. dynamic-033159 (L553, `` `${commit}:docs/x.md` `` passed to `git rev-parse` in a tmp fixture repo) is labelled text-label-join.
   - The actual use is a git probe of a fixture-repo doc path in a test-owned tmp repo (R21).
   - A label such as non-document-fs-probe or tmp-fixture-git-probe would be more truthful.
3. The reject reason for the fixture-source-text items (004996, 005035, 004994, 004995, 004997, 004991, dynamic-033125, 033193-033198, 033201, 033202) says "Real docs-root exceptions are separately enumerated above". This file has no real-docs-root exception; the only admits are titles and one comment.
   - The sentence is boilerplate and should be dropped.
   - The label non-document-fs-probe is also loose, because these are fixture source strings (a better label is in-memory-fixture-source).
4. The admit reason for the title items says "synthetic paths remain fixtures, never claimed retained". That is fine, but 005010 reads "pending source-grounded S2 holder check". Please confirm the S2 comment audit actually covers L127.
   - It is an explanatory corpus mention, not a pointer to a removable holder, so preserve stands either way.

## Lead-judgment questions

1. Title tuples dynamic-033073, 033086, 033087 and 033088 are ADMIT with pathOperand = the full title string, which names a docs path but does not construct one.
   - This follows the baseline-title-key precedent (L12-72 p07, L12-81 S3).
   - If the L12-72 extra check requires a `pathOperand` that "really yields a document path", the check technically fails for titles. Confirm that the precedent exempts titles.
   - Related: title 267 (`proposeDisposition: already-promoted docs/platform/** ...`) and title 135 have no tuple in this payload while 143/153 do. This is scanner-dependent and outside the payload, so I did not chase it.
2. dynamic-033089 (title at L181, "classifyByDirectoryHeuristic: distillery ...") is REJECT while its sibling titles are ADMIT.
   - Defensible, because the title contains no docs path, but the rule "titles are baseline keys" would make all titles one class. The outcome is preserve either way.

## Counts

- Admit 8 (preserve 8). Reject 363 (preserve 363), of which:
  - config-or-metadata 145
  - non-document-fs-probe 84
  - scalar-pass-through 41
  - plans-report-artifact 39
  - text-label-join about 54
- Outcome defects: 0. Record-text notes: 4. Lead questions: 2.
