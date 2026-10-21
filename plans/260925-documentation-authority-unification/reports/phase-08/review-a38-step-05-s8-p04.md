# Review a38 step-05 seam 8, part p04 (s4-src-p04)

Scope: 67 source files in the payload, 22 of them with items; 0 diffs (none of these files carries a patch diff in this payload); 2 author-added slots (both in merge.mjs). Items reviewed: 120 (56 literal references plus 64 dynamic tuples) and the 2 author slots. Every file is read at pin 97c9694a4.

## Per-file verdicts

| File | Items | Verdict |
|---|---|---|
| src/runner/claim-port.mjs | 3 | ok |
| dispatch/assignment-policy.mjs | 1 | ok (inherited Step 4 park, join exact) |
| dispatch/assignment-runner.mjs | 1 | ok |
| dispatch/cli.mjs | 1 | ok |
| dispatch/config.mjs | 6 | ok (record-text note N1) |
| dispatch/confinement/{authority,backend-registry,policies,request}.mjs | 4 | ok (inherited patches, joins exact) |
| dispatch/execution-contract.mjs | 1 | ok |
| dispatch/herdr-round.mjs | 1 | ok |
| dispatch/mechanism.mjs | 4 | ok (N1) |
| dispatch/operation-prompt-templates.mjs | 1 | ok (inherited park) |
| dispatch/resolve.mjs | 4 | ok (N1) |
| dispatch/run-lock.mjs, transport.mjs, trust-store.mjs, worker-home.mjs | 1/3/1/2 | ok |
| dispatch/write-scope.mjs | 3 | ok |
| src/runner/loop.mjs | 6 | ok |
| src/runner/operation-choice.mjs | 25 | ok |
| src/runner/merge.mjs | 32 + 2 author slots | rework (defect D1) |

The 49 other files in the payload have no items and are omitted.

## OUTCOME defects

### D1. src/runner/merge.mjs L1091/L1092 reads have no honest record (rework)

- **Passage.** In `declareLandFiles` at the pin, `treePaths(port, target, 'docs/decisions/')` is at L1091 and `treePaths(port, source, 'docs/decisions/')` is at L1092. Both are real document-tree reads, so both must be admitted.
- **What the records say.**
  - The only items touching them are reference-003770 (span L638) and reference-003748 (span L640). Both are REJECT with nonDocumentUse `comment-or-type` and the label "occurrence removed before author pin". At the pin, L638 and L640 are comment text with no `docs/decisions/` literal after `0000-index.md`, so removing them is true for those lines.
  - The same record binds those ids to the real reads. `mandatoryCarries` lists 003770 at currentLine 1091 as "declareLandFiles: target tree", preserve. It lists 003748 at currentLine 1092 as "declareLandFiles: source tree", preserve. `legacyWriterUnit.readerIds` lists both.
  - So one id is "removed, non-document" in the item list and "live reader at L1091/L1092" in the carry list. Under R3, L1091/L1092 need their own source slot, as L1098 and L1104 got.
- **Correction.**
  - Add two author-added source slots at L1091 and L1092. Use ADMIT, preserve, role historical-tree-reader, pathOperand `'docs/decisions/'`, and the same co-cut set as the parked writers.
  - Point `mandatoryCarries` and `readerIds` at the new slots, not at the rejected removed ids. Keep 003748 and 003770 as removed-occurrence REJECT/preserve.
  - The disposition is already correct; only the record structure is wrong. 003747 at L542 is correct and already admitted.
- **Rule.** R3 (no owning record gets an author slot) and R7 (one outcome per real operation). The brief's mandatory carry of the L638/L640 reads is only met by the pointers, not by items.

## Checked and fine

- **Joins.** All 47 items with a canonicalOperation join match their Step 4 record in disposition. Spans differ only by line-wrap fragments (003715, 003726, 003730, 003731, 003734, 003744).
- **Writer parks (merge.mjs).** The two author slots (L1098 numbered-path writer, L1104 index writer) are specific to their passage. They name the destination, the runtime inputs and the unresolved retention policy. `aliasWriteCheck` says not an alias destination, with no root conversion. Their co-cut set (merge.mjs, merge-quoted-paths.test.mjs, merge.test.mjs) is consistent with the brief.
- **Carry L536.** The `nextFreeDecisionId` scan (003747, L542) is ADMIT/preserve with pathOperand `docs/decisions/`. At the pin only `docs/decisions/index.md` exists, so the scan reads immutable branch trees. That is defensible as preserve.
- **Removed-occurrence rejects.** The seven removed-occurrence rejects (003748, 003758, 003760, 003763, 003764, 003769, 003770) are true at the pin for the listed lines. 003758 and the dynamic 012993-012996 and 012998 correspond to the old `renumberDecisionFile`, which the pin no longer has. Its replacement is the L1098 author slot.
- **Plan-path readers.** All plan-path reader constructions in operation-choice.mjs are covered:
  - L50, L78, L384/L386, L809/L811, L1877, L2414 in operation-choice.mjs, and L1544 in loop.mjs.
  - Each has its parked read plus a reject for its `resolveContentRoot` root line.
  - Each blocker names its own distinct consumer. None is boilerplate. The `posix.join(work.docsRef,'plan.md')` input refs (013134, 013172) are correctly admitted as worker context under R6.
- **Same-line agreement.** Same-line pairs agree, for example 013081/013082, 013113/013114, 013132/013133, 013139/013140, 013166/013167, 013170/013171, 012848/012849. Independent side-by-side operations keep independent outcomes, for example claim-port L225 (`text` reject) vs L228 (`rationale` carrying the `docs/history/...` path, admitted), and the `contentRoot` root rejects next to their reads.
- **pathOperand and nonDocumentUse.** Every admitted dynamic tuple's pathOperand yields a document path. Every rejected tuple's nonDocumentUse is true: `scalar-pass-through` for roots and `segments.join`, `text-label-join` for caller diagnostics, `comment-or-type`.
- **docs/specs and docs/architect preserves.** The comment-pointer preserves into docs/specs or docs/architect (003707, 003712, 003738) carry "source tree retires in Phase 9". The dated proof citations (003715, 003737, 003739) do not rest on a "retained" witness. 003721 is correctly noted as a false prefix match.

## Record-text notes (no outcome impact)

- **N1.** The preserved `docs/decisions/00NN-...md` citations 003713, 003723 and 003729 carry successorNote `docs/decisions/index.md`, but their reason text names the real holder `docs/platform/runner/decisions/h-36d872fbb0e5.md#...`. 003726 (parked) has no successorNote field at all. R8 wants the successorNote to be the retired-decision history holder, so set the field to the heading named in the reason. The `0000-index.md` citations (003750-003752, 003762, 003766, 012990 index writers) match the Step 4 precedent, so they are fine.
- **N2.** The preserved legacy readers and constants in merge.mjs (003747, 003754, 003762, 012990) carry no coCutPaths of their own. Only the parked author slots list the co-cut set. Consider repeating it, since the park's parity text says the unit includes the scans and constants.
- **N3.** The reasons on many REJECT tuples read "Original input identity and full pinned context remain available for judgment review." That is generic wording, but the nonDocumentUse labels are true.

## Lead-judgment questions

- **Q1.** In merge.mjs the writers (L1098, L1104) are parked on the "legacy output retention/retirement" policy. The constant `DECISION_INDEX_PATH` (L418, preserved) is the destination operand of the L1104 writer. The regex `DECISION_FILE_RE` (L419, preserved) builds the L1098 path. Is preserving them acceptable with the co-cut note, or should they join the same park as one unit? The records state "preserve immutable Git-tree input identities until an atomic policy/fixture-backed change". I find that consistent, and it is not an outcome defect.
- **Q2.** The parks for `item.docsRef` plan reads all rest on "state export of docsRef plus contentRoot". The values live in state. If `docs/history/<id>` stays a retained convention (as accepted for contextRefs in earlier rulings), a Phase 9 preserve might do. The parks are conservative and match the brief's "state/external populations stay explicit parks", so I accept them.

Counts: 120 items reviewed (literal references 56; dynamic tuples 64), of which 87 ADMIT and 33 REJECT. Of the ADMIT: 3 parked-join, 16 parked (13 `docs/*` plan reads, 3 other), 11 patch (all inherited), 3 bounded-source-construction preserve, the rest preserve. 2 author slots reviewed (both parked, correct). 1 outcome defect (D1), 3 record-text notes, 2 Lead questions.

Status: DONE
Summary: merge.mjs needs rework (D1): the native Land L1091/L1092 `docs/decisions/` tree reads are carried only by rejected removed-occurrence ids 003748 and 003770 and need their own admitted source slots. The other 21 files with items are ok, with record-text notes only.
