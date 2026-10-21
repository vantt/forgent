# Review p08 (seam 5 judgment-batch-6)

File: test/scripts/check-doc-conservation.test.mjs (pin 5eb9dc609)
Verdict: ok
Items reviewed: 191 (75 references + 116 dynamic... split: 65 reference-type rows by referenceId and the rest dynamic tuples; all 191 are REJECT / non-document-operation / preserve). No admitted items, no diff, no parks, no patches.

## Method
Loaded payload, read pinned source (716 lines) via git show, and checked every item's source line against its stated nonDocumentUse. Grepped the file for every real-file read (readFileSync, existsSync, repoRoot, cwd, import.meta.dirname).

## Findings
- The file tests the conservation gates against in-memory fixtures or a temp git repo (`repo.tmp`, `fs.mkdtemp(os.tmpdir())`). Every `docs/...` string (docs/specs/runner.md, docs/io-contract.md, docs/a.md, docs/in/a.md, docs/architect/.../raw.log, docs/platform/...) is fixture data: inventory `path`/`sourcePath`/`targetOwner`, `scope` arrays, or content written into the temp repo. None is read from the real checkout and none is compared to a real document's bytes or wording. Rejects are correct.
- The only real-file reads are lines 15 and 86: `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json` and `minimum-constitution.json`. Both are machine-readable plan data, not documents under docs/specs or docs/architect, and the test reads them as data. Reject as plans-report-artifact is acceptable.
- Same-passage agreement: items on the same line (for example 175, 126, 360, 368, 393, 503, 675, 683, 686) all carry preserve. Literal and dynamic tuples on a passage agree. No park exists, so no boilerplate blockedReason. No retired decision citations.
- The `reason` text for every reject names a use that is true for its operand.

## OUTCOME defects
None.

## Record-text notes
- Dynamic tuple dynamic-031941 (source line 696, `scoped = counts(...scope...)`) is labelled plans-report-artifact. The operand is a `scope` array of fixture `docs/in` strings, so config-or-metadata or scalar-pass-through is the true label. Outcome (preserve) is unchanged.
- The same-line `${PLAN_DIR}/transitional-switchboard.json` write (line 175) is written into the temp repo, so plans-report-artifact is accurate only in the sense of a plan-shaped fixture name. Not an outcome issue.
- The payload scope note says "all admitted items plus judgment rejects that mention docs"; this part has zero admitted items, which is consistent with the file.

## Lead-judgment question
- Lines 15 and 86 read two plan JSON files by real path. If Phase 9 or later moves or retires `plans/260925-documentation-authority-unification/`, these two reads break. They are not document-authority consumers, so no admission is required now, but Lead may want the plan-dir lifecycle recorded elsewhere.

## Counts
Reviewed 191; ok 191; defects 0; record-text notes 1 real (031941) plus 1 minor; Lead questions 1.
