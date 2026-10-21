# Review a38 step-05 seam 5 batch 6, part p09

Pin 5eb9dc609f303fc9d54377f866b5e8caf9a5d129 (read through git). No diff, no patch, no park in either file; all items preserve.

## test/scripts/check-doc-constitution.test.mjs
Verdict: ok. Items reviewed: 47 (19 literal refs, 28 dynamic tuples).
Admitted 4: 004651, 004659 (L713 literals) and dynamic-032029/032030 (L713). Rejected 43.

OUTCOME defects: none.

Checks:
- L713 `fs.copyFileSync(path.join(REPO_ROOT,'docs/doc-governance.md'), path.join(root,'docs/doc-governance.md'))` really reads and writes a document path. Admit is right. Preserve is right: docs/doc-governance.md is a retained root file (owner-answers L12-72 rule 3 retains non-specs/architect legacy paths), the witness says treeRetires false, and the gate is frozen. All four items on the line share one admission and one disposition.
- Literal rejects in `validRow`, `validItem`, `classifyPath` and `validate(owned(...))` (L43, L149, L264, L402, L423-432, L580-585, L625) are in-memory strings given to pure classifier and validator functions. No real file is read from them. The only real reads are the plans/ JSON files (L31-33, L646-648) and the doc-governance read done inside the script.
- L660 `assert.match(reading.note, /docs\/specs\/reading-map\.md/)` compares a plans/ JSON note against a regex. It does not touch a document, so reject is correct.
- L718-733 fixture paths (`docs/specs/fixture.md`, `docs/platform/fixture/spec.md`) are written only under an `os.tmpdir()` root and committed to a throwaway git repo. Reject is correct under the root-anchored neutrality rule.
- 032037/032038 (IDENTITY_REGISTRY_PATH) resolve to plans/.../reports/identity-registry.json, so plans-report-artifact is a true non-document use.
- `{repoRoot: REPO_ROOT}` pass-through items (031959, 031960, 032004) reject under the root-only rule.

Record-text notes (labels only, not outcomes):
- dynamic-032037 and dynamic-032038 are the same expression, `path.join(root, IDENTITY_REGISTRY_PATH)` at L733. One is labelled plans-report-artifact and the other non-document-fs-probe. Both reject, so the outcome is unaffected. Unify the label to plans-report-artifact.
- dynamic-032030 targets `path.join(root,'docs/doc-governance.md')`, but its `pathOperand` repeats the source expression `path.join(REPO_ROOT,...)`. It should name the temp-root destination expression.
- dynamic-032012 and dynamic-032013 carry labels like `txt\n${fields.map(` and `join('\n')`. They are template-literal fragments in a fixture header, not paths. Labels are loose but the outcome is right.
- Reject reason text says "Preserve fixture cases including intentional old/dead paths". Fine for fixtures. Nothing claims a retained tree.

Lead-judgment questions:
- Q1: The test calls `governanceBaselineFields(REPO_ROOT)` directly (L528, L550) and runs `validateConstitution(..., {repoRoot: REPO_ROOT})` throughout (L72 and others). Both read the real docs/doc-governance.md inside scripts/check-doc-constitution.mjs L221/L264. No literal path appears in the test, so rejecting these as root-only pass-through follows the root-only rule, and the read is owned by the admitted script record. Preserve is safe because the file is retained. If a future move of doc-governance.md is planned, the owning script record is the place it will show up. No action needed unless the Lead wants an explicit cross-reference to that script record on 032029.

## test/scripts/check-doc-retirement.test.mjs
Verdict: ok. Items reviewed: 110 (48 literal refs, 62 dynamic tuples). All reject, none admitted.

OUTCOME defects: none.

Checks:
- The only fs reads are `minimum-constitution.json` (L19) and the plans/ JSON copy loop into a tmpdir (L183-188). Both are plans/ paths, so plans-report-artifact applies and no docs path is read.
- Every docs/specs, docs/architect, docs/io-contract.md, docs/decisions/index.md, docs/history and docs/platform path (L24, L62-63, L137-164, L196-264) sits inside an in-memory `consumerEdges`, `aliasTable`, `retiringRoots`, `paths` or `entries` object passed to pure functions (`evaluateRetirement`, `uncoveredHistoryReferences`, `unrewrittenConsumerEdges`, `openConflictGroups`). `runCli([], dir)` runs against an empty tmp root that holds only plans/ files. Reject and preserve are correct, and no retained-tree claim is made.
- L264 `roots: ['docs/']` is an input proving invalid retiring-roots data throws. It is a value under test, not a read.
- Same-line pairs (for example L137, L158-164, L234-237, L248-252) agree: all reject and preserve.

Record-text notes:
- Several `archive/plans/*.md` fixture paths (032045, 032053, 032065, 032116) are labelled plans-report-artifact. They are in-memory fixture strings under no census root, so the label is loose. The outcome (reject, preserve) is right.
- `.fgos/events/e.jsonl` (032049) is labelled scalar-pass-through, but state-event-store would be more accurate. Outcome unaffected.

## Counts
- Files: 2, verdict ok on both.
- Items reviewed: 157 (67 literal refs, 90 dynamic tuples). Admits 4, judgment rejects 153.
- OUTCOME defects: 0.
- Record-text notes: 6 (4 constitution, 2 retirement).
- Lead questions: 1.
- Diff, patch and replay: none required, so no replay check is owed.

Status: DONE
Summary: Both files are ok. The four admitted L713 doc-governance copy items and all 153 judgment rejects are correct, with preserve outcomes and no outcome defects. Only label and text notes plus one cross-reference question for the Lead.
