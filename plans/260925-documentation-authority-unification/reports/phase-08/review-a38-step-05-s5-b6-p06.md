# Review a38 Step 5 seam 5 batch 6 part p06

Payload: s4-src-p06.json, one file, pin 5eb9dc609, subBatch judgment-batch-6. Read against the pinned file via git (windows are truncated per window).

## test/runner/operation-choice.test.mjs

Verdict: ok

Items reviewed: 243 (76 literal references + 155 dynamic tuples listed; 6 ADMIT, 237 REJECT, all preserve; no diff, no rollback, no parks, no coCutPaths).

OUTCOME defects: none.

Verification basis:
- The file only writes docs/history/<id>/plan.md (and docs/feature) into mkTempDir() fixtures and hands the docsRef string to production code (hasPlanMd, chooseStageOperation, workUnitFor, findLatestAssignmentRunResult). It never reads a repository document, and `PROJECT_ROOT = process.cwd()` is declared but unused. So the rejected docs/history literals and tempDir path.join tuples (fixture writes, citation strings inside fixture reports, evidenceRefs fixtures such as 2143 and 4996, tamper data at 5245/5246, `docs/history/${id}` at 5925) construct no repository document path. Each is a true fixture or scratch use.
- The only assertion comparing against emitted document paths is lines 1169-1176: unitData.inputs deepEqual with docs/history/feat-refs, its plan.md and its CONTEXT.md. This matches the L12-72 contextRefs/inputs rule (R6), so ADMIT/preserve is right. The path stays under the retained docs/history convention, and the fixture is synthetic and not claimed retained. Admitted dynamic tuples 028231 and 028232 name real pathOperands (`posix.join('docs/history/feat-refs', 'plan.md')` and `'CONTEXT.md'`), which are what the assertion compares. Literals 004480, 004486, 004510, 004511 and 004486 all admit and preserve (same expression, same test), so R7 is satisfied. The neighbouring `stateRoot: tempDir` tuple (028230) and `tempDir = mkTempDir()` tuple (028229) are separate scalar operations and correctly reject.
- Same-line pairs (literal vs dynamic at 4433/4499, 5245/5246, 5925) agree on REJECT/preserve.
- No decision citations, docs/specs or docs/architect targets, or document byte/wording comparisons exist, so no successorNote, witness or patch is required. Preserve is not a hidden needed change.
- Ten rejects carry a nonDocumentUse; no reject lacks one. No admitted dynamic tuple lacks a pathOperand.

Record-text notes (labels only, outcome unaffected):
- Fixture data paths such as `path.join(docsRef, 'preexisting-dirty.txt')` (5537) and `path.join('docs','history','f2dc-spoof','planted',...)` (5245/5246, 004473/004543) are labelled `non-document-fs-probe`. They are fixture data fed to production, not fs probes. `fixture-data` (or the nearest list label) would be truer.
- `docs/history/<id>` citation strings in fixture reports (4433-4553, 5925, 2143) are labelled `config-or-metadata` / `text-label-join` (5925 template). The use is "in-memory fixture string or citation".
- The reason text for 004480/004486/004510/004511 says "contextRefs"; the assertion is on unitData.inputs. Cosmetic.

Lead-judgment questions:
1. Test-title strings (ADR-006 R5/R7, ADR-007 section 3, lines 5644-5789) cite ADR ids as titles, not paths. They are not in the payload and not census items, so no successorNote is owed. Baseline title-key stability is the owning seam's matter.
2. Other fixture strings with docs/ prefixes outside the legacy census (docs/plan.md at 608/637/648, docs/test-plan.md and docs/difficulty-notes.md at 4250-4306, docs/vanished-proof.txt at 4996, docs/feature at 4083) are not payload items. They are fixture inputs to keyword/evidence heuristics, so I expect no outcome change. Confirm the census intentionally excludes them.

Counts: 1 file ok; 243 items reviewed; 0 outcome defects; 3 record-text notes; 2 Lead-judgment questions.
