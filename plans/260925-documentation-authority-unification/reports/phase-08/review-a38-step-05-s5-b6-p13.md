# Review a38 step-05 seam 5 judgment-batch-6 part p13

## test/scripts/knowledge-migration.test.mjs (pin 5eb9dc609)

Verdict: ok. Items reviewed: 229 (2 ADMIT, 227 REJECT; all disposition preserve; no diff, no parks, no coCutPaths).

Basis: whole pinned file read for operations. Every `docs/...` literal and every dynamic tuple lives inside a `mkdtempSync` git repo (`setupGitRepoWithStore`) and flows only into `path.join(tmpDir, ...)`, `registerDocStore`/inventory-data JSON fixtures, `assert.throws` regexes over runtime-emitted error text, or label strings. No `process.cwd()`/`__dirname` based path, no `cwd:` other than `tmpDir`, no read of real `docs/specs/**` or `docs/architect/**`, no real repo document. So every REJECT is a true non-document use, and nothing in the file is a consumer of real document bytes or wording.

Rejects (227):
- 122 config-or-metadata (fixture strings: currentPath, oldPath, inventory rows, reportsDir): true.
- 94 non-document-fs-probe (test-owned `path.join(tmpDir, ...)` construction, existsSync/writeFileSync on temp files): true that they are test-owned scratch paths.
- 6 text-label-join (`# ${p}\n` file bodies and `expected ..., got: ${JSON.stringify(...)}` messages): true.
- 4 scalar-pass-through (`weirdOldPath` ternary/pass-through at L305-L313; the regex `docs\/how-to\/reclaim\.md` at L155): true. The L155 regex asserts an error string that echoes the fixture path, not a document.
- 1 comment-or-type (`sourcePath ===`): true.
- No pathOperand-bearing admitted dynamic tuple exists, and no rejected tuple lacks a true nonDocumentUse. successorNote is not needed: no retired decision citation appears in the payload.

Admits (2), both preserve and harmless:
- reference-005086 L226 `docs/doc-registry.*` (test-title): the title is a runtime test-name baseline key; preserve exact title is right. The witness is scoped to "actual pinned test-title; synthetic paths remain fixtures". The target is not under docs/specs or docs/architect, so the retained-witness rule is not triggered.
- reference-005101 L151 `docs/how-to/reclaim.md` (comment-provenance): preserve is right (no assertion is changed).

Co-cut consistency checked: the fixtures mirror hardcoded constants in `scripts/knowledge-migration.mjs` (inventory-data.json under docs/history/compound-learn-artifact-registry/reports, docs/knowledge/<slug>/<role>.md targets, docs/doc-registry.md/json). The step-05 record for that script preserves those constants and parks only the inventory oldPath-row dynamics, so preserving the test fixtures matches it. If Phase 9 ever changes those script constants, this test's literals must move in the same change.

OUTCOME defects: none.

Record-text notes:
- L151 (admit) and L155 (reject, scalar-pass-through) are in overlapping passages (148-154 vs 152-158) on the same fixture path `docs/how-to/reclaim.md`, and over 100 other same-literal fixture occurrences are rejected. The admit reason "pending source-grounded S2 holder check" reads like boilerplate; the comment is a plain fixture note. Outcome is the same (preserve), so this is a label issue only.
- The 94 "non-document-fs-probe" labels are really temp-fixture path construction and writes, not probes; the reason text itself says "scratch/state/source/fixture path construction". Label is slightly off, the admission is right.
- L226 title admit versus L256/L257 `docs/doc-registry.md`/`.json` rejects as config-or-metadata: they are existsSync assertions over files the script writes into the temp repo. They are a different passage from the title, and both are preserve. Fine, but record the co-cut with the script constant above.

Lead-judgment questions: none.

Counts: files 1, ok 1, rework 0, items 229, outcome defects 0, record-text notes 3.
