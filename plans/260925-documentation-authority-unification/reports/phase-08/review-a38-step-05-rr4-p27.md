# Review a38 step-05 seam 4 rr4 p27

Payload: s4-src-p27.json (5 source files, pin 95301cb9a, no diffs, no parks). Items reviewed: 126 (1 literal, 125 dynamic tuples). Verdicts: 4 ok, 1 rework.

## Per file

### scripts/test-proof-inventory.mjs — ok (24 items)
- reference-003634 (L166, "see docs/specs and P00's baseline report"): ADMIT / preserve, comment-provenance, "tree retires" witness. Fits R8: a comment pointer into docs/specs, preserved as dated provenance with an explicit retiring witness, not a "retained" witness.
- 23 rejected tuples: cwd/test-id/baseline-key label templates, repoRoot defaults, `path.join(repoRoot,'test')` (dirBucket relative-path classification), the DIR_RULES array and its `dir === 'rust-host'` guard, `--scope`/`--baseline` argv guards, and the violation-message formatting. All nonDocumentUse values are true. None constructs or reads a document path.
- `SUITE_BASELINE_PATH` (test/suite-baseline.json) is test data, not a document. Its reads and writes are correctly not admitted.

### scripts/test-select-compare.mjs — ok (17 items)
All rejected. `planPath = options.planFile || 'selector-plan.json'` is a CI artifact filename default (guard). The `.fgos/` check is a string test on changed paths. The rest are log strings, breaker-state scalars, and junit `repoRoot = process.cwd()` path trimming. No document path.

### scripts/test-select-coverage-map.mjs — REWORK (37 items)
OUTCOME defect, dynamic-008907 and its same-passage group (L173-203):
- Source: `const outDir = 'plans/260922-test-suite-optimization/reports';` (L173), followed by `fs.existsSync(outDir)` / `fs.mkdirSync(outDir)` (L174-176), then `fs.writeFileSync(path.join(outDir, \`coverage-map-${date}.json\`), ...)` (L179) and `fs.writeFileSync(path.join(outDir, \`coverage-suggestion-${date}.md\`), md)` (L203).
- Current outcome: REJECT, with outDir as `non-document-infrastructure` (scalar-pass-through) and the path.join and filename operands as `caller-data-formatting`.
- Rule: R6 (admit write/probe/emit on a fixed document root) and R7 (same passage, one admission). This is a fixed literal root under plans/. The script writes a markdown report and a JSON report there, and creates the directory. If the plan folder moves, the output location changes. It is not root-only plumbing, a clone dir, or a state path.
- Precedent: L12-72 p08 and p10/p11 treat fixed plans/ inputs as ADMIT/preserve gate identity, not new migrations. The same ruling applies to a fixed plans/ output root.
- Correction: admit the following as one passage, preserve (plans/ is not a retiring tree). Witness: fixed plans/ report output root, with dir creation and writes of `coverage-map-<date>.json` and `coverage-suggestion-<date>.md`.
  - the outDir literal tuple;
  - the exists/mkdir probes;
  - the two `path.join(outDir, ...)` tuples;
  - the two filename template tuples (`coverage-map-${date}.json`, `coverage-suggestion-${date}.md`).
  Give each a real pathOperand. The `${src}` / `- ${t}` markdown-body templates (L196-201) stay reject, since they only build report text.
- Note: plans/260922-test-suite-optimization does not exist at the pin or in the worktree. The script creates it on demand (recursive mkdir). This does not change the admission.

Other tuples are correctly rejected:
- NODE_V8_COVERAGE, os.tmpdir mkdtemp and TMPDIR dirs, and the `new URL(res.url)` coverage-source mapping;
- `path.join(repoRoot, 'test'|'src'|'bin')` code-tree discovery, and import resolution of JS code;
- progress log strings and `join(', ')` label joins.

### scripts/test-select-mutate.mjs — ok (32 items)
All rejected correctly: tmpdir mkdtemp, junit report path, worktree-relative test and mutant source files (code, not documents), node_modules and target symlinks, `directTests` guards and hashing, and log strings. No document path.

### scripts/test-select-promote-report.mjs — ok (17 items)
Tmpdir zip and json extraction (`path.join(dir, filename)`), `gh api repos/.../artifacts` strings, row formatting, and `file://${process.argv[1]}` are all non-document. `manifestPath = path.resolve('test/test-ownership.mjs')` is a code manifest, so it is not a document read or write. Its two items (dynamic-008976 accumulator, dynamic-008977 infrastructure) both reject. This is consistent and the labels are acceptable.

## Record-text notes
- dynamic-008976 (promote-report L88) is labelled `accumulator`, while the sibling tuple on the same operand is `non-document-infrastructure`. The outcome is the same (reject). A more accurate role would be `config-or-metadata` or `scalar-pass-through`, since this is a parameter default.
- The `rejectedAsUnrelatedReason` of dynamic-008907 should be rewritten if the item is admitted.

## Lead-judgment questions
1. Is plans/<plan>/reports a "document path" for Step 5 admission? I followed the p08 precedent (yes, admit/preserve). If Lead's intended boundary is only docs-legacy roots, then the coverage-map rejects stand, but p08/p10 would then be inconsistent with them.
2. reference-003634 (docs/specs comment): the pointer is generic, so preserve with a "tree retires" witness is OK under R8. If Lead knows of a live platform holder that explains test-ownership rules, a header/comment patch would be preferred instead.

## Counts
- Files: 5. ok: 4. rework: 1.
- Items: 126. ADMIT: 1. REJECT: 125.
- Outcome defects: 1 group (dynamic-008907 plus about 6 same-passage items in test-select-coverage-map.mjs L173-203).
- Dispositions: 126 preserve, 0 park, 0 patch. No diffs in payload.

Status: DONE
Summary: 4 of 5 files are ok. test-select-coverage-map.mjs needs rework: its fixed plans/ report output root and the writes under it (L173-203) are document operations that should be ADMIT/preserve, not rejected.
