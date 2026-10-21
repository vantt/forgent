# Review a38 step-05 seam 5 batch 7, part p03

Pin 5eb9dc609f303fc9d54377f866b5e8caf9a5d129. No crossSeamChangedOnly entries in this part. Read-only review.

## Per file

| File | Verdict | Items | Outcome defects |
|---|---|---|---|
| test/intake/plan.test.mjs | ok | 37 (3 admit: 2 preserve, 1 patch; 34 reject) | none |
| test/cli/helpers/fgos-cli-harness.mjs | ok | 14 + 2 author slots (10 admit: 9 preserve, 1 park; 4 reject) | none |
| test/runner/dispatch-executor-profile.test.mjs | ok | 4 (1 patch; 3 reject) | none |
| test/runner/dispatch-worker-home.test.mjs | ok | 2 (1 patch; 1 reject) | none |
| test/scripts/check-doc-candidate-status.test.mjs | ok | 46 + 46 author slots (4 admit/park; 42 reject, 46 author slots reject) | none |

Total 103 payload items plus 48 author-added slots reviewed. Patch, park and preserve counts: 3 patch, 5 park, 11 preserve admits.

### plan.test.mjs
- 004241 (L113-114 wrapped comment, docs/how-to/avoid-vacuous-pass-...pattern.md) patch. Old path is absent at the pin and the knowledge holder exists (blob checked). The diff touches only the comment (8 lines old, 8 lines new) and the inverse matches. No assertion reads it (grep). Source file, comment-only, so there is no output delta.
- 004240 and 004242 (docs/history pointers) are preserved dated provenance, per the R16 uniform rule.
- 004239 (`docsRef: 'docs/history/never-written/'`) reject. The fixture value is resolved against a tmp store and nothing is read. The nonDocumentUse "config-or-metadata" is true.
- The dynamic rejects (tmpStoreDir, mkContextFixture, fixtureRelPath templates) are all rooted in mkNativeTempDir or tmp dirs. Their nonDocumentUse labels are true.

### fgos-cli-harness.mjs
- dynamic-017973 (`docsIndexManifestPath`, fixed `docs/enduser-docs-index.json` suffix) is an admitted park. It is a fixed document literal emitted by a provider function (R6/R26), and the manifest path is a Phase 6 proposed-move unit. The R26 unit docs/enduser-docs-index.json lists it as a reader and co-change. The blocker names a real caller: the docsIndexManifestPath callers at fgos-merge.test.mjs L187-216 (existsSync/read after docs-index) plus generator dynamic-009788. This is specific, not boilerplate.
- 004009 and 004010 (`docs/architect/doing-coordination-redesign.md` comment pointers) preserve with treeRetires true. A candidate holder exists at docs/platform/proposals/doing-coordination-redesign.md, but it is a non-canonical proposal carrier. This matches the L12-83 p05 precedent (candidate-only holders keep dated tree-retires provenance), so preserve is acceptable. See Lead question 1.
- The remaining comment pointers into docs/history (004007, 004008, 004011-004015 and the two author slots) preserve uniformly, per R16.
- The rejects are .fgos paths and commit-message label joins, and are true.

### dispatch-executor-profile and dispatch-worker-home
- 004378 and 004379 patch docs/architect/.../2026-09-06-isolation/*.md to docs/platform/... I checked that both findings files exist under docs/platform with sha256 identical to the architect copies. The worker-home comment also names permission-posture-findings.md in the same directory, which resolves too. The diffs are one-line, comment-only, source files, with exact inverses. The patch is right because a live holder with the same bytes exists (a patch, not a park).
- The rejects (os.tmpdir mkdtemp, REPO_ROOT '/home/someone/...' fixture scalar, label template) are true.

### check-doc-candidate-status.test.mjs
- 004586, 004589, dynamic-031770 and dynamic-031771 (L41, copyFileSync from `REPO_ROOT/docs/doc-governance.md`, and its destination) share one admission (admit) and one disposition (park). They are in the R26 docs/doc-governance.md unit. The blocker is specific: governanceBaselineFields (scripts/check-doc-constitution.mjs L220) reads docs/doc-governance.md from repoRoot, so the copy is needed for the fixture.
- L27 and L57 `docs/README.md` (004587, 004588, 031762, 031763) are in-memory switchboard fixtures and classifyDocumentStatus string assertions. Nothing is read, so reject is right. The R26 docs/README.md unit lists them as co-changes only.
- L20 031759 `DEFAULT_SWITCHBOARD_PATH` resolves to a plans/** path, so R11 reject is correct (the constant is declared in scripts/check-doc-candidate-status.mjs L29). L19 `DEFAULT_CONSTITUTION_PATH` is also plans/**.
- All the 46 author-added fixture literals (docs/laws.md, docs/platform/**/README.md and similar) are in-memory switchboard or fixture-root content, rejected as config-or-metadata. That is true.

## Record-text notes (no outcome change)
1. fgos-cli-harness.mjs author slot at L525 col 65 is a wrapped pointer `docs/` + `// history/test-suite-dry-consolidation/CONTEXT.md`. Its reason says "corpus or root directory, not a unique movable holder", but it is the same dated pointer as 004011/004012/004015. The outcome (preserve) agrees; the text should say "dated docs/history comment pointer".
2. dynamic-017973 admitted/parked still carries a stale `rejectedAsUnrelatedReason` ("Test-owned scratch... no authority lookup") that contradicts the admission.
3. dynamic-017973 blockedReason cites "L187-216" without naming test/cli/fgos-merge.test.mjs, so the line range is ambiguous.
4. 004009/004010 reason text is accurate, but could name docs/platform/proposals/doing-coordination-redesign.md as the non-canonical holder explicitly.
5. 004008 and 004013 are directory-only pointers (`docs/history/`, `docs/history/promote-to-component/`) with matchedExpression truncated at a wrap; the outcome is preserve either way.

## Lead-judgment questions
1. The harness 004009/004010 `docs/architect/doing-coordination-redesign.md` comment pointers have a byte-possible holder at docs/platform/proposals/doing-coordination-redesign.md. Is a docs/platform/proposals/** file a "live holder" for R8 and S2, in which case this is a patch like 004378/004379? The record treats it as non-canonical (p05 precedent). That is consistent with L12-83 but is a Lead call.
2. check-doc-candidate-status.test.mjs L94 `governanceBaselineFields(REPO_ROOT)` and L163 `repoRoot: REPO_ROOT` pass the repo root into a script that reads docs/doc-governance.md. They have no own item (root pass-through, R5). The park text mentions governanceBaselineFields, so the co-cut is described. Confirm the R26 unit docs/doc-governance.md should list L94 as a reader explicitly. This is not an admission defect.

## Counts
- Outcome defects: 0
- Record-text notes: 5
- Lead questions: 2
