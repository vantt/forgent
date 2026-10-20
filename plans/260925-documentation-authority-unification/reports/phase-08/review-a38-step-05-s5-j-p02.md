# Review a38 step-05 seam 5 judgment part p02

Pin 5eb9dc60. Four files, 169 items. No diffs, no parks, no coCutPaths in this part.

## Per-file verdicts

### test/architecture.test.mjs - verdict ok (140 items)
- 1 literal (reference-003949, L2) plus 139 dynamic tuples (138 REJECT, 1 ADMIT); all preserve.
- The only real document operation is L24 `fs.readFileSync(path.join(root,'docs','architecture-manifest.json'))` (dynamic-016778). It is ADMIT/preserve with a true `pathOperand` and a valid retention witness (L12-60(6)/L12-71 keep the architecture-manifest reader on the retained path). This target is not under docs/specs or docs/architect. The move-set draft proposes a move to docs/platform/contracts, but the Lead ruling says the alias proposal is not a writer destination, so preserve is fine.
- I read the whole pinned file and grepped it for docs/, .md, .yaml, AGENTS and README. No other call reads or probes a document:
  - Every dir walk (mjsFilesUnder, unguardedSourcesUnder, a4GuardedFiles) is over src, bin, core, domains, scripts or src/runner/* and filters to .mjs/.cjs/.js/.ts sources.
  - The domains/*/workflows/*.yaml read at L933-936 is workflow config, not a document.
  - The YAML_DOOR and YAML_THIRD_PARTY paths are src files.
  - The `path.join('domains','coding','spec.md')` at L223 and `../domains/coding/foo.md` at L246 are template-string lexer fixtures, so rejecting them is right.
  - The tmpdir fixtures (L1169-1173) and the text/label joins are correctly rejected.
- No outcome defect.

### apps/fgos-gateway/web/src/App.test.tsx - verdict rework / Lead-judgment (5 items)
- reference-000201 (L6 comment) is REJECT/preserve with nonDocumentUse comment-or-type.
- OUTCOME defect, admission class (R16, R8). L6 is a header navigation pointer, "S01 - Sign in (docs/ui-spec/screens/S01-sign-in.md)".
  - That path is in step-05-cutover-move-set.json. It moves to docs/platform/ui-spec/architecture/screens/S01-sign-in.md, and a holder exists at the pin as a candidate area.
  - R16 says comment pointers are admitted. R8 says a module-header navigation pointer with a live holder gets a patch; a preserve is allowed only as dated provenance, with a "tree retires" witness when the target is under docs/specs or docs/architect.
  - docs/ui-spec is not a retiring tree, and the record gives no such witness. REJECT with "dated provenance preserved even where the referenced tree retires" cites a rule that does not fit. The tsk-51i wording dates the prose around the pointer, not the pointer.
  - Correction: ADMIT, then either (a) a patch, a comment-only diff in the test (source file) with the new holder path, forward and inverse, and replay per R22, or (b) preserve with a documented dated-provenance witness. Whether the candidate holder counts as "live" is a Lead call, because it is marked candidate and not canonical.
- The four dynamic tuples (dynamic-000796/797/798/799, fetch mock `Promise.resolve(jsonResponse(...))`) are correctly REJECT. They construct no document path.
- Note: no other record in this seam has a comment pointer into docs/ui-spec. Across tests-judgment-batch4.jsonl, 24 REJECT comment-or-type pointers (docs/history, docs/architect, docs/decisions, docs/platform-foundations) use the same pattern. They are outside my part, but R16 says docs/history comment pointers are admit/preserve uniformly. The Lead may want to check them as a class.

### test/scripts/doc-global-closure.test.mjs - verdict ok (6 items)
- 2 literals plus 4 dynamic tuples, all REJECT/preserve.
- The file has only in-memory fixtures (`docs/specs/a.md`, `docs/platform/a.md` as row data) and imports the compare script. It has no fs, git or path read, so the rejects are true.
- No outcome defect.

### test/scripts/doc-corpus-decisions.test.mjs - verdict ok (18 items)
- 3 literals plus 15 dynamic tuples, all REJECT/preserve.
- Fixture rows `docs/fixture/N.md`, `docs/specs/legacy.md`, `docs/decisions/index.md`, `docs/doc-registry.md` and `docs/enduser-docs-index.json` are in-memory inventory data given to applyDecisions with a tmpdir repoRoot.
- The git repo is a mkdtemp tmpdir. The vocabulary read and the reportPath are plans/** (R11), so they are correctly rejected as plans-report-artifact.
- No document read from the repo exists in the file (full-file grep).
- No outcome defect.

## Record-text notes (not outcome)
- App.test.tsx dynamic-000796..799 carry nonDocumentUse `non-document-fs-probe`, but they are fetch-mock Promise.resolve calls. A better label is an in-memory/mock use. The reason text cites the S01 comment, which is unrelated to those tuples.
- architecture.test.mjs reference-003949 (L2 comment) is REJECT while the same file's L24 real read is ADMIT. Both preserve. Per R16 the comment is an admission-class inconsistency, but the outcome is identical, so no disposition change.
- architecture.test.mjs L223 and L794 are labelled `non-document-fs-probe` / `comment-or-type`. These are loose labels for a template-string fixture and a JSDoc line. The substance is true.
- doc-global-closure and doc-corpus-decisions use `config-or-metadata` for in-memory row-fixture data. It is accepted in this batch, though "in-memory fixture" would be more exact.
- doc-corpus-decisions reason text on non-plans tuples ("the only committed fixture report lives under plans/**") is boilerplate shared by 15 tuples. Its facts are true but not specific to each tuple.

## Lead-judgment questions
1. App.test.tsx L6: patch the comment pointer to docs/platform/ui-spec/architecture/screens/S01-sign-in.md, or preserve as dated provenance? A candidate-only holder exists. If it is preserve, an explicit witness is needed and the admission must be ADMIT.
2. Should the 24 comment-or-type REJECTs in tests-judgment-batch4 be reconciled with R16 as a class?

## Counts
- Files 4; items reviewed 169 (references 6, dynamic tuples 163): architecture 140 (1+139), App.test 5 (1+4), doc-global-closure 6 (2+4), doc-corpus 18 (3+15).
- ADMIT 1; REJECT 168. Parks 0; patches 0; preserves 169.
- Outcome defects 1 (App.test.tsx reference-000201, admission/disposition class). Files ok 3, rework 1.
