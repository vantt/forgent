# Review p10 (seam 5 judgment files, batch 6)

Pin 5eb9dc609. Payload: 3 files, 143 items (references plus dynamic tuples), all REJECT / preserve, no parks, no diffs.

## test/scripts/doc-alias-resolver.test.mjs - verdict ok
Items reviewed: 119 (65 config-or-metadata, 33 non-document-fs-probe, 19 scalar-pass-through, 2 plans-report-artifact).
- Every `docs/...` string is an in-memory alias-table fixture value or a file written under `fs.mkdtempSync(os.tmpdir())`. Nothing reads a real repo document. The resolver is exercised with `repoRoot: <tmp root>`.
- The only real-repo reads are `DEFAULT_ALIAS_TABLE_PATH` (plans/.../alias-table.json, L28) and `plans/.../minimum-constitution.json` (L116, L243). Both are JSON data files under plans/, not documents. Rejecting them is correct.
- All dynamic tuples (`path.join(dir|root|owner, ...)`, `mkdtemp`) are tmp-fixture paths, so the nonDocumentUse values are true. The dir/root probe tuples are correctly rejected.
- Same-passage items agree (all reject/preserve). No OUTCOME defects.

## test/scripts/doc-candidate-conservation.test.mjs - verdict ok
Items reviewed: 14 (7 config-or-metadata, 2 fs-probe, 5 scalar-pass-through).
- Inventory objects, receipts and git fixtures live in `mkdtempSync` roots. `path.join(root, file)` is a tmp write helper. `historyPath`, `originalPath` and `provenancePath` are fixture literals checked against a fixture git blob.
- No real document is read and no document bytes or wording are compared. `docs/architect/.../data.log` and `docs/platform/.../data.log` are inventory strings only.
- No OUTCOME defects.

## test/scripts/doc-review-format.test.mjs - verdict ok
Items reviewed: 10 (1 config-or-metadata, 4 fs-probe, 2 scalar-pass-through, 2 plans-report-artifact, 1 text-label-join).
- `docs/specs/operation.md` and `docs/platform/operation.md` are written into a tmp git repo. The reviewed bytes are the fixture's own text, not repo docs.
- The `reportPath` tuples (`path.join(f.root, reportPath)`) resolve inside the tmp root, so they construct no real document path. The `join('')` and text-label items are fixture prose.
- The test also reads plans/.../claim-and-disposition-vocabulary.json (L131, L169). That is a JSON vocabulary, not a document, and it has no item, which is fine.
- No OUTCOME defects.

## Record-text notes (not outcome defects)
1. The `plans-report-artifact` label on the two `minimum-constitution.json` tuples (alias test L112, L239) is loose. They read a real plans/ JSON data file as a CLI option and are not a report artifact. `config-or-metadata` would be closer. The reject itself is correct.
2. In doc-review-format the `plans-report-artifact` tuples write a tmp-root fixture report. The label is acceptable but could say "tmp fixture report path".
3. The dynamic-tuple `caller.line` (e.g. alias 101, 106) is offset from the current source line (`currentLine`). Presumably this is a pre-pin line and is not an outcome issue.

## Lead-judgment questions
- Q1. The tests read real files under `plans/260925-documentation-authority-unification/` (alias-table.json, minimum-constitution.json, claim-and-disposition-vocabulary.json). If Phase 9 or a later step moves or retires that plan directory, these tests break. That is outside docs-path migration and is a plans-lifecycle concern. Confirm that it is out of Step 5 scope and that no co-cut is needed now.

## Counts
Files 3, items 143 (admit 0, reject 143), parks 0, patches 0, outcome defects 0, record-text notes 3, Lead questions 1.

Status: DONE
Summary: All 143 items are correctly rejected as tmp-dir or in-memory fixtures with no real document reads or byte/wording comparisons, and the preserve dispositions fit. No outcome defects were found, only minor label notes and one lifecycle question about plans/ JSON reads.
