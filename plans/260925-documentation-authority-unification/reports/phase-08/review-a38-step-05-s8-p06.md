# Review a38: step-05 seam 8, payload s4-src-p06 (src/state/store.mjs .. src/workflow/integrate.mjs)

Verdict overall: one OUTCOME defect at seam level (merge.mjs carry), none in the payload files themselves.

## Per file (34 payload entries; 8 carry items, 26 entries have no in-scope items)

| file | verdict | items reviewed |
|---|---|---|
| src/state/store.mjs | ok | 14 (003908-003917 + 4 unnumbered: 2 text rejects, 2 admitted parks) |
| src/state/tool-registry.mjs | ok | 2 (003918, 003919) |
| src/state/work.mjs | ok | 13 (003920-003929 + 3 rejects) |
| src/util/yaml.mjs | ok | 1 (text-label-join reject, true) |
| src/verbs/merge/approve.mjs | ok | 6 (003935-003939 + 1 reject) |
| src/verbs/merge/iron-law-level.mjs | ok | 2 (003940, 003941) |
| src/verbs/merge/promote-to-component.mjs | ok | 4 (003946 + 3 rejects) |
| src/workflow/ref-digests.mjs | ok | 1 (dynamic-016502) |
| src/workflow/integrate.mjs (pin 42edba2b0, retired) | ok | 15 dynamic rejects in the record (payload shows 0 in scope) |
| 25 other src/util|verbs|workflow|terminal-control files | n/a, no in-scope items | 0 |

No file in the payload carries a diff or rollbackDiff (all preserve/park), so the diff checks do not apply.

### Notes on specific items (all confirmed against the pin)
- store.mjs 003909 and the docsRef tuple (L610-615): both parked, same passage, one outcome. Blocker is specific (checkPlanEvidence reads work.docsRef/plan.md and docs/history/<id>/plan.md from a branch tip; needs the item/branch export; co-cut approve-6, state-cutover, coding-knowledge fixtures). The pathOperand really yields a document path. This is the mandatory L615 carry: it has an owner record with its coupled tests.
- store.mjs 003908 (L1788, docs/specs/<area>.md) is a park inherited from the step 04 record (step04-027 line 1), blocker names the retiring area layout and what must be traced. 003910 (L1792, docs/decisions/index.md) is preserve in the same JSDoc block (passage 1784-1792). Different referents, both inherited joins, so I accept it; flagged as a Lead question below.
- store.mjs/work.mjs/approve.mjs docs/architect and docs/history comment cites: preserve as dated history/provenance, reason text names retiring source, no "retained" witness on a docs/specs or docs/architect target. OK.
- approve.mjs 003937 / 003939 (L431, L440) rejected as removed-occurrence: verified, the pin contains docs/ only at L267, L308, L362. True.
- iron-law-level.mjs 003941 docs/architecture-manifest.json: file exists, preserve right, the docs/architect prefix hit is a false match.
- promote-to-component.mjs 003946 (L134): the literal is persisted as the recordCoordination rationale, so admitting it as persisted-document-rationale is right; preserve is right (docs/history/promote-to-component/CONTEXT.md exists).
- ref-digests.mjs dynamic-016502: real reader (fs.readFileSync(path.resolve(root, ref))), preserve with no fixed prefix, caller owns the ref. OK.
- work.mjs PATH_LIKE_TOKEN reject (scalar regex) is true. See Lead question 2 for the existsSync that uses it.
- integrate.mjs retired source: file is absent at 97c9694a4, record is read at its own 42edba2b0, whole-file read evidence, full 174-line deletion diff present in retiredSource, all 15 tuples are tmpdir/message/git-arg operands (true non-document).
- yaml.mjs reject, approve.mjs worktree message reject, promote-to-component message/join rejects: true.

## OUTCOME defects

1. **src/runner/merge.mjs, reference-003748 (recorded L640) and reference-003770 (recorded L638), runtime-judgment-part-27.jsonl line 38.** Rule: admission must follow the pinned construction (a live reader is a consumer; mandatory carry needs an owner record; same-passage items share one outcome). Both are REJECT/non-document-operation ("removed/replaced before author pin; same scalar elsewhere is not a binding"). But the record's own mandatoryCarries block names these exact ids as the live current readers `declareLandFiles: target tree` (L1091) and `declareLandFiles: source tree` (L1092) with disposition preserve. At pin 97c9694a4, `treePaths(port, target, 'docs/decisions/')` is at L1091 and `treePaths(port, source, 'docs/decisions/')` at L1092, and no item in the record has a sourceSpan on L1091 or L1092 (only the L1098 writer and L1104 index writer were author-added, as parked). So the carried docs/decisions reads at L638/L640 have an owner record only in prose, contradicting the reject on the same ids. The record also has dynamic-012917 (L1090) and dynamic-012918 (L1098) rejected as removed-occurrence at current line numbers where live code sits (the L1098 one is the writer already covered by the author-added park). Correction: add author-added ADMIT preserve references (historical-tree-reader, same outcome and same co-cut as reference-003747) with sourceSpans on L1091 and L1092, and make 003748/003770 the removed-occurrence history rejects only, not the carry owners (or re-point mandatoryCarries to the new ids). L542 (nextFreeDecisionId) is correct.

## Record-text notes (not outcome defects)

- src/state/work.mjs reference-003929: successorNote field is `docs/decisions/index.md` but the reason text names `docs/platform/work-state/decisions/retired-decision-history.md#12-adr-0027...` as the successor. Field should carry the retired-history anchor (the file and section exist).
- src/verbs/merge/approve.mjs reference-003935 (docs/decisions/0032): successorNote is null; the successor (docs/platform/runner/decisions/h-36d872fbb0e5.md#0032-...) is only in the reason prose. Put it in the field.
- Several preserve reasons start "A51, L12-60/26/38/40/46: Retained native path..." for docs/decisions/index.md and docs/distillery paths. The wording is generic boilerplate but the outcome is right here (targets are not under docs/specs or docs/architect).
- store.mjs 003909 label is "parked" while its own text says "preserve this exact fallback until an authorized export". Outcome is acceptable as a park (state-dependent proof missing), just confirm the label is intended.

## Seam-level checks (step-05-seam8-review-list.json and records)

- **Owner joins**: validated all 286 priorOwnerJoins (not just 15). Each ownerJoin points to an existing record line with an edge of the same edgeId, same consumer file, same source span text, same disposition as the current seam 8 record. 281 resolve through `edges`; 5 (dynamic-001635, -010050, -013025, -013447, -015423, in cli-help-messages records) join by referenceId (reference-000228, -003708, -003749, -003784, -003868) and match too (patch/preserve as recorded). Hash/rebase exactness left to the checker. No duplicated outcomes found.
- **Generated outputs** (docs/decisions/index.md 80 joins, docs/doc-registry.json 836, docs/doc-registry.md 494, docs/enduser-docs-index.json 507): the part-22 records contain only censusJoins, with no diff, and every join points to the generator record (generators-decision-index, generators-doc-registry lines 1/2, generators-enduser-index) at their own pinned input commit; counts equal references+dynamic of those owners (78+2, 825+11, 493+1, 506+1). Parks name state.decisions / generator-source export. Not hand-patched.
- **External populations** (runtime-external-parks.jsonl): both parks are specific. `.fgos/**` ignored instructions need an authorized redacted consumer-edge export, `doc-inventory.json` needs a bounded export through the loader (2.61 GB / 125 parts). Both carry readPerformed:false and a scope limited to dependent consumers. OK.
- **Retired source**: see integrate.mjs above. OK.
- **Mandatory carries**:
  - merge.mjs L536 nextFreeDecisionId scan: owner reference-003747 (L542), preserve, coupled to test/runner/merge-quoted-paths.test.mjs:100-108 (test at line 103 exists; the test's own fixture 'docs/decisions/0041-quyết-định.md' is a correct reject in the tests record). OK.
  - merge.mjs L638/L640 docs/decisions reads: DEFECT 1 above.
  - merge.mjs writers L1098/L1104: parked, specific blocker (legacy collision output policy plus bounded tree fixtures), no alias destination. OK.
  - bin/fgos.mjs L224 (now L256 excludeIronLawEvidence): reference-000243 plus dynamic-001376/001377, preserve, narrow exemption retained. OK.
  - bin/fgos.mjs doc-registry L1758/1759 (now L1774/1775): reference-000238/242/266/267 and dynamic-001333/001335, preserve as fixed output destination, writes stay with generator-export custody. OK.
  - store.mjs L615 reader with coupled tests: reference-003909 parked, coCut approve-6, coding-knowledge, state-cutover. OK.
  - scripts/generate-doc-inventory.mjs L339/L340 prefixes docs/specs and docs/architect: join to generators-skills-and-support line 190 (reference-003560/-003568), preserve under frozen-gate identity (not a "retained" witness), co-cut with test/scripts/check-doc-constitution.test.mjs:718 (`docs/specs/fixture.md`, reference-004654 preserve). The cross-seam carries file states it. OK.

## Lead-judgment questions

1. store.mjs 003908 (parked) and 003910 (preserve) share the JSDoc passage L1784-1792. Both are inherited from step04-027, so I did not call it a defect. Does the Lead want the inherited split kept, or the whole passage handled as one park until the decision-index example is rewritten?
2. work.mjs checkAcceptanceEvidenceTraceable (pin L894) does `fs.existsSync(path.join(repoRoot, candidate))` on a path-shaped token pulled from acceptance evidence text (e.g. a cited docs/specs path). No tuple covers that join (only the regex at L856 and the error message at L901 are recorded, both true rejects). Under R5 it would reject (caller-supplied), but it is a state-population reader of document paths; consider noting it with the external-state parks.
3. store.mjs 003909: docs/history/<id>/plan.md is a surviving root (881 history dirs present). Is "parked on item/branch export" intended over plain preserve?

Counts: payload entries 34; in-scope items reviewed 43 plus the retired-source record (15 tuples); OUTCOME defects 1 (merge.mjs seam carry, outside the payload files); record-text notes 4; Lead questions 3.

Status: DONE_WITH_CONCERNS
