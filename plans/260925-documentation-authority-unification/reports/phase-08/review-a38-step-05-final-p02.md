# Review a38 step 05 final p02 (s4-src-p02)

Scope: 5 files, 35 listed items (12 + 5 + 2 + 4 + 12) plus 1 + 0 + 0 + 12 + 14 author-added slots, all cross-seam-changed. Pinned bytes read with `rtk proxy git show`. No diff touches an unadmitted passage; both diffs (registrations.mjs, enduser-index.test.mjs) are on source/test files with forward and inverse hunks, and their new targets exist in the worktree.

## Per file

### src/state/retrospective-doors.mjs - ok (12 items)
- 015650-015658 and 015660-015662 are all ADMIT parked on the Work.docsRef export. Each pathOperand really builds or reads a state-held document path (CONTEXT.md join/read, item docsRef directory listing, per-member read, finding `file` field, messages, freshness probe). Pairs on one passage agree (015657/015658 now both park, resolving the earlier split).
- No OUTCOME defect among the listed items.
- Record-text notes:
  - 015655 (L193, same passage as 015654): ADMIT parked, but it still carries a `rejectedAsUnrelatedReason` (R5 text) and a different dependency string ("retrospective checks persisted source/context evidence"). Clear the stale reject text and use the shared Work.docsRef dependency.
  - 015660/015661/015662 name only the docsRef export as dependency, while their blockers say the population is item.refs plus docsRef. Name the item.refs half in the dependency.
- Lead question: 015649 (L109) `excludeRelDirs: docsRef ? [docsRef] : []` is REJECT (config-or-metadata). It hands the persisted docsRef to the wide-citation document scan as an exclusion, in the same passage as parked 015650. Under R30 (state-held path value) this is probably ADMIT parked on the same export. It was not in the sweep candidate list.

### src/state/store.mjs - ok (5 items + 1 author slot)
- 015753, 015757, 015760 and the author slot (L631 pathsAtRevision) are ADMIT parked on Work.docsRef plus branch-tip membership. This is right: the candidate list mixes the state-held docsRef arm with the retained history arm.
- 015754 / reference-003909 (L615 `docs/history/${id}/plan.md`) is ADMIT preserve. This is justified: docs/history is retained (owner-answers L88/L221), the path is built in code from the id, and the target is not under docs/specs or docs/architect. The L12-87 text states this split explicitly. The mixed-candidate probes (015757, 015760) stay parked.
- No defect. Note: 003909 parks nothing itself, so the preserve and the park are independent only because L12-87 says so. That should stay documented.

### src/state/work.mjs - ok (2 items)
- reference-003929 (L122, retired decision 0027 comment) is preserve with a successor note naming `docs/platform/work-state/decisions/retired-decision-history.md#12-adr-0027-...` in the reason text. OK.
- dynamic-015839 (L893) is ADMIT parked on the Work.acceptance evidence-token export. Pattern `PATH_LIKE_TOKEN` over `clause.evidence` can match docs paths, and it is probed with existsSync. R30 ruling for 015839 is explicit in L12-87.
- Lead question: the function is a write-time validator whose `work` arrives as an argument. It follows the same Work-field treatment as docsRef, so I accept it. If Lead wants R5 for function arguments to apply, this and the docsRef items are the same family and must move together.

### src/setup/registrations.mjs - rework (4 items + 12 author slots, 39 parks)
Listed items 014387 (L3999 alias collision message), 014425 (L4115 git cat-file probe), 014426 (L4117), 014427 (L4121) are correct ADMIT parked on the registry docs currentPath/aliases export. Dependency strings agree.

OUTCOME defects (R30 consistency: a registry- or inventory-held doc path emitted or probed must be ADMIT parked on the same export; these siblings stayed REJECT because the sweep candidate scan never listed them):
1. dynamic-014385, L3997 `` `${alias}: claimed by ${owners.length} docs ...` ``. REJECT caller-data-formatting. It emits the persisted alias path in the same check and same message family as parked 014387 (L3999). Correction: ADMIT parked, dependency "Authorized registry docs currentPath / aliases / lifecycle export".
2. dynamic-014388, L4003 `found N broken doc aliases: ${broken.join}`. REJECT. Aggregates the alias paths of 014385/014387. Precedent: parked aggregate 014427 (L4121). Correction: ADMIT parked, same dependency.
3. dynamic-014434, L4150 `${doc.docId}: source '${captureId}' not reachable ...`. REJECT. captureId is a registry-held doc path (sourceCaptureIds), also fed to resolveDocPath. Correction: ADMIT parked on the registry export (sourceCaptureIds / aliases).
4. dynamic-014435, L4155 `unreachable source capture(s): ${unreachable.join}`. REJECT. Aggregate of 3. Correction: same as 3.
5. dynamic-014445 L4216 and 014447 L4224: messages emitting inventory-held oldPath values (`inventory source '${oldPath}'...`, `lost.join`). REJECT. They emit the population loaded by parked 014443/014444 and probed by parked 014446 (L4220). Correction: ADMIT parked and join those parks (inventory oldPath population plus registry aliases); 014427 and 014426 are the precedent for "missing/lost path output shares the probe's export".
Confidence: high for 1-4 (identical pattern to the changed items 014387/014426/014427). Medium for 5, because the values come from a docs/history data file loaded by an already parked reader; if Lead rules the inventory population is covered by the reader park, 5 may stay REJECT but the reason text should then say so.

Record-text notes:
- author-s4-fix2-b75674e7a307ed78 (L3518 README.md) and the other README/CHANGELOG preserve slots reuse a boilerplate reason ("manifestPathFor -> docs/enduser-docs-index.json, indexPathFor -> docs/decisions/index.md") that is unrelated to those passages. Admission and preserve are right (retained root documents); the text should name the README/CHANGELOG operand. The same L3518 message also carries the patched `docs/how-to/cut-a-fgos-release-tag.md` path (reference-003804); independent operands, differing outcomes are acceptable.
- Diffs: the four visible pointer patches (L874, L2045, L2094) and their inverse hunks match the registry holders and change only the path text in comments and messages. Output delta (doctor message text) is named. OK.

### test/report/enduser-index.test.mjs - ok (12 items + author slots)
- Ten reference items (004311, 004319, 004320, 004330, 004332, 004344, 004345, 004347, 004348, 004351) plus dynamic-021513 and 021543 are ADMIT parked. Same-line pairs agree (004311/004348 at L330, 004319/004351 at L334, 004320/004347 at L325, 004344/021513 at L162). Blockers name the assertion, the co-cut (REAL_DEMO_DOC_PATH in docs-index-state-fixture.mjs, generator parks dynamic-009788/009791) and are not boilerplate.
- Patch at L385 (title and readFileSync of the rollup how-to) targets `docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md`, which exists. Forward and inverse diffs are complete.
- Record-text note: dynamic-021543 (L323, docs/explanation enumeration) names its dependency as "retention-or-move decision for docs/enduser-docs-index.json"; its blocker is really the explanation-directory move plus generator parks. Label only.
- Lead question: the L385 test patches the how-to demo doc to the knowledge path while parked L162/L167 still assert the old path for the same doc. They are different operations (direct disk read vs generated manifest docPath) and the park is tied to the generator/fixture co-cut. Accepted; just confirm Phase 9 lands both in one co-cut.

## R29 unit check (step-05-state-tree-sweep.json key R29 against src/runner/merge.mjs at 97c9694a)
Confirmed, all numbers match the record runtime-judgment-part-27.jsonl:
- parkedMembers 8: reference-003747 (L542 nextFreeDecisionId tree scan), 003754 (L419 DECISION_FILE_RE), 003762 and dynamic-012990 (L418 DECISION_INDEX_PATH), plus the four seam-8 author slots (L1091 target reader, L1092 source reader, L1098 renumbered-file writer, L1104 index writer). All share one dependency string.
- newLiveReaderSlots 2: L1091 and L1092 (`treePaths(port, target|source, 'docs/decisions/')`) are live reads in the pinned bytes.
- writerParksRebound 2: L1098 and L1104 are live writes at those lines.
- oldPreservesChangedToPark 4: 003747, 003754, 003762, 012990.
- removedCensusIdsRemainReject 003748 (L640) and 003770 (L638): the pinned lines carry no docs/decisions/ text, so REJECT "occurrence removed" is true.
- coupledProof test/runner/merge-quoted-paths.test.mjs L100-108 is the nextFreeDecisionId Vietnamese-slug test reading docs/decisions/0041-... .
- Lead question: comment preserves 003750-003752/003766 (L637, L465, L579, L405) describe the live handling of `docs/decisions/0000-index.md` while the code path is parked for the Phase 9 decision. If that decision moves the path, these comments need a co-change; they are labelled historical because the corpus is absent at the pin. Accept unless Lead wants them in the unit's coCut list (prior review N2 made the same suggestion).

## step-05-step7-carry.json check
16 items, itemCount 16, needsWrites empty. Every requested inherited residual is present with evidence from the cited review and an owner join:
- network.ts reference-000209 (network-r5-park-to-patch, evidence R5 holder lines 239/240 of herdr-web-dashboard/spec.md)
- gateway yaml L205 split: reference-000307 (parked) vs 002240 (preserve), id gateway-yaml-research-split
- templated gateway parks: gateway-yaml-consumer-specific-parks (17 refs: 9 + 8)
- work-state/runner park-to-patch candidates: gateway-yaml-live-state-runner-holders (12 refs)
- store.mjs comment block: store-comment-block-split (003908 park / 003910 preserve)
- knowledge-registry parks vs test provenance: registry-source-versus-test-provenance (003892-003899)
- also triage-absent-goal-tier-claim (002301), agents-0030-anchor-slug (000128/000129) and the earlier overlap, deferred-replay and closure lists.
No inherited item flagged in the seam 8 reviews is missing. (The s8-p05 N3 retrospective 015657/015658 split is closed in the records, not carried, and I confirmed both now park.)

## Counts
- Files: 5 (4 ok, 1 rework)
- OUTCOME defects: 6 ids in registrations.mjs (014385, 014388, 014434, 014435, 014445, 014447; 1-4 high confidence, 5 medium)
- Record-text notes: 6
- Lead questions: 5 (015649 docsRef exclusion, 015839 function-argument rule, merge comment co-cut, README/CHANGELOG reason text is a note not a question, L162 vs L385 co-cut)

Status: DONE_WITH_CONCERNS
Summary: Four of five files are correct; registrations.mjs has six sibling messages (alias, sourceCaptureIds, inventory oldPath) that stayed REJECT while their parked neighbours (014387/014426/014427) follow R30. R29 merge.mjs unit and the step-7 carry list verify clean.
