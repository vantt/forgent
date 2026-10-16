# Step 10 close c1 ordinary review: generated-backlog table, predecessor gap, accounting and native changes

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792176628519-ac852ba4@2026-10-17
Review mode: ordinary
Request commit: e52831e36daf883afb3c9d7dcd3fe479302c44f6
Content commit: 38672e7f157788cbe1b2bf59511bd61046dce660

## Scope and method

All 25 entries of review-request-step10-close.json were authenticated with `row-auth.mjs` (materialized into my scratch dir, 512 MiB heap): d01..d03, a01, r01..r06, n01..n15 each exit 0 with the committed shard, accounting files and persisted registry equal to the request proof. Worktree HEAD is e52831e36daf883afb3c9d7dcd3fe479302c44f6; the docs bytes equal the content commit (docs/backlog.md hashes b9f66783... at 38672e7f1, 0abc1c533, bc7358789 and HEAD; no other docs file changed since c3614f4d2). No sensitivity pack is requested (ordinary review). Seed for the sampling record: c1-261017-a36; the three decision rows are fewer than the 10-row minimum so all are deep-read (the first d01 is in the sibling report review-step10-close-c1-s1-e52831e36.md, authored by session 515f6e95); accounting entries a01, r01..r06 and n01..n15 were all read against the underlying files, not only mechanically.

Independent checks: (1) hand sha256 of docs/backlog.md lines 11-54 at HEAD gives 7d531761..., lines 11-52 at c3614f4d2 give 3430068f..., and the heading digests 5f190b84 and 92be08bb reproduce from printf of the heading, section payload and following block; (2) the actual `git diff c3614f4d2 bc7358789 -- docs/backlog.md` is byte-equal to a01 exactDiff, newRows are the two added lines, and deleting them from HEAD reproduces the c3614f4d2 file exactly, so every predecessor line is verbatim; (3) a full independent diff of the persisted registry against its 38672e7f1 version (all collections and metadata keys, 91388 units, 5913 identity gaps) gives exactly 15 changes, set-equal to the 15 n entries, and before/after bodies of every change equal the accounting file; (4) the candidate-unverified lists and the refresh receipt were diffed against c3614f4d2 and 38672e7f1; (5) anchors docs/backlog.md#product-backlog and docs/backlog.md#unheaded-block-2 pass list-doc-anchors --check; (6) the two main rows are present at HEAD lines 20-21 and carried.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_127225b8542c701295574b1b00749594 | ok | deep: current generated table unheaded-block-2 lines 11-54, digest 7d531761 recomputed by hand and by extractor; it is the 42-line predecessor plus exactly the two main rows p-68be2ae3 and p-7eb9e65b (both present verbatim at HEAD lines 20-21, equal to main commit 0abc1c533); the registry binds this ID by content as a new unit (n05) with sourceUnitDigest 7d531761 and the old ID is separately kept as a gap (d03), so no ordinal graft; regenerate-from-source with null owner and anchor is allowed for the generated class and grants no renderer or truth approval; wording: the claim kind historical-context is the same as the predecessor row | 7d5317616b4b105936b065a213de9cce47e44c3e623d6dd293ffd0d5dc4c84ec | none |
| claim_9b3b7fac64df06547dd06e05f4f026c5 | ok | deep: predecessor gap row for the c3614f4d2 table digest 3430068f (recomputed from lines 11-52 of the c3614f4d2 blob); registry moved this ID from units (n09 removed) to identityGaps (n14 added with gapReason about the unstable anchor) and the shard carries it under registryGaps with sourceCommit c3614f4d2; every predecessor line is verbatim in the current table so nothing is lost, and the older reviewed gap claim_d7660c15 (digest 57afbc48) is untouched; the stale text in the before row about a successor that native sync must allocate is replaced by the content-bound successor named here | 3430068fb5b1687e480e143bc34727fa7d6ada9f1342932c9fdd2f8b23c17da2 | none |

## Entry verdicts (accounting verdicts, not claim approvals)

| Entry | Verdict | Note |
|---|---|---|
| d01 | ok | deep: see the sibling report for claim_f0b2a4079764d68b1102ddddb08776ce (heading digest 92be08bb to 5f190b84 only from the two added rows); entry rows equal the committed shard. |
| d02 | ok | deep: see the claim table, claim_127225b8542c701295574b1b00749594 content-bound to the 44-line table 7d531761 with the two main rows carried; before is null as the row is new. |
| d03 | ok | deep: see the claim table, claim_9b3b7fac64df06547dd06e05f4f026c5 gap row, registryGaps collection, same ID as native identityGap n14; before differs only by authoredBy and rationale refresh. |
| a01 | ok | deep: proof equals backlogRecarry in step10-ordinary-application-and-refresh.json; fromCommit c3614f4d2 to bc7358789, the exactDiff string equals a fresh git diff byte for byte, newRows are HEAD lines 20-21, oldUnits and currentLocalUnits digests all reproduce; all three claim IDs are known to the registry; wording: nativeSuccessorId still reads pending next sync although n05 now shows claim_127225b8 as the native successor, a stale historical field that conflicts with nothing in the binding. |
| r01 | ok | deep: x01 old tuple claim_35b6d800 d4d6dd64 (the paragraph before the restore, reproduced from the 498048c1a blob) is an identity gap and in no candidate list at c3614f4d2 or now; new tuple claim_87f236ae 59d70c7f is the registry unit and is in both lists; the receipt in candidate-classifications-agent-coordination-step10-refresh.json has shownText equal to line 27 and unit digest equal to the extractor output, pending with no approval carried; line 27 is the only line changed and the two recovery-planner sentences cite plan at lines 243-266 and checkApply at lines 281-316, which I read and which match; wording: the gate line cite in the note is approximate. |
| r02 | ok | deep: x02 new tuple claim_9d5d0b39 1f25a51f is the registry unit and is in both lists once (no duplicates); old claim_2e2938c7 d4d6dd64 is an identity gap; no receipt exists for the unit, as stated; run-handle.md line 27 carries the three sentences whose evidence ranges run-lock.mjs 306-320, 321-334 and 390-412 I read (epoch check and settled refusal, held-or-unproven-dead holder not stolen, settle checks epoch and token) and they match. |
| r03 | ok | deep: x03 heading claim_b6963c89 keeps its ID with new digest e9987e41 (old 4fc22267 reproduced at the 498048c1a blob); it is the registry unit, in both lists and has a pending refresh receipt whose shownText equals the heading plus its section payload at HEAD and whose digest check passes; the old receipt at 4fc22267 is rejected by digest equality; wording: the explanation text is copied from x01 and speaks of a paragraph. |
| r04 | ok | deep: x04 heading claim_f1c6ef52 of run-handle.md retained with new digest 565cf67d (old bef0ccaa reproduced from the 498048c1a blob); it is the registry unit and is in both lists once; there is no receipt, as stated; the pair x04 and x06 is one heading replacement. |
| r05 | ok | deep: x05 expected-only old tuple claim_2e2938c7 d4d6dd64 was in both lists at c3614f4d2 and is removed in the refreshed lists (my set diff shows exactly this removal and nothing else for it), the replacement occupant is x02; wording: the note says the committed list at HEAD still lists it, which was true at the pre-refresh comparator commit but is not true of the current files, the current evidence supports closure of the difference. |
| r06 | ok | deep: x06 expected-only old tuple claim_f1c6ef52 bef0ccaa was in both lists at c3614f4d2 and is replaced by 565cf67d in the refreshed lists; list set diff against c3614f4d2 is exactly 2 removed and 4 added rows (b6963c89 e9987e41, 87f236ae 59d70c7f, f1c6ef52 565cf67d, 9d5d0b39 1f25a51f) and zero changes between 38672e7f1 and HEAD; the six differences are four actual-only and two expected-only; no waiver or relabelling. |
| n01 | ok | deep: _binding metadata only: before b7b7c94c (62198395 bytes) is the c3614f4d2 registry digest recorded in the 38672e7f1 file, after 6fcd58e6 (62196419 bytes) is the 38672e7f1 file digest, both reproduced by sha256sum of those blobs; marker accounting, no truth approval. |
| n02 | ok | deep: carriedFromCommit moves from 498048c1 to c3614f4d, matching the registry before and after bodies. |
| n03 | ok | deep: carryForward counters before and after equal the two registry files (kept 91008 to 91012, editedKept 3 to 1, added 3 to 1, gaps 3 to 1); from and to commits advance by one hop. |
| n04 | ok | deep: commit metadata c3614f4d to 38672e7f, equal to the registry before and after bodies. |
| n05 | ok | deep: added unit claim_127225b8 with source digest 7d531761 at unheaded-block-2, origin added-since-c3614f4d2; after equals the persisted registry record and the extractor unit at HEAD. |
| n06 | ok | deep: session-identity spec unheaded-block-1 claim_3b20c21f, only the origin marker is dropped, digests unchanged; that docs file did not change between c3614f4d2 and the content commit; marker-only. |
| n07 | ok | deep: session-identity heading claim_47720e8d loses lineage and needs-review marker only, source digest 94917454 unchanged; the file is unchanged since c3614f4d2; marker-only, not an approval. |
| n08 | ok | deep: executor-health-and-fallback block-3 claim_87f236ae loses its origin marker only; digest 59d70c7f equals the extractor output and r01 tuple. |
| n09 | ok | deep: claim_9b3b7fac leaves units (removed) and returns as an identity gap (n14); source digest 3430068f reproduced; the shard row d03 covers it, so no loss. |
| n10 | ok | deep: run-handle block-3 claim_9d5d0b39 loses its origin marker only; digest 1f25a51f equals the extractor output and r02 tuple. |
| n11 | ok | deep: executor-health heading claim_b6963c89 loses lineage and needs-review marker, digest e9987e41 unchanged and equal to r03 new tuple; the refreshed receipt for it stays pending. |
| n12 | ok | deep: backlog heading claim_f0b2a407 retained with the same ID, digest 92be08bb to 5f190b84, unit digest and fingerprint recomputed, lineage from c3614f4d2 records both; ID retention confirms d01. |
| n13 | ok | deep: run-handle heading claim_f1c6ef52 loses lineage and marker, digest 565cf67d unchanged and equal to r04 new tuple. |
| n14 | ok | deep: identityGaps adds claim_9b3b7fac with gapReason for the unstable anchor; body equals the removed unit of n09 plus identity status fields; equals d03. |
| n15 | ok | deep: documents docs/backlog.md changes sourceDigest 4d2d62ea to b9f66783 and blobSha 7393034c to 5063fd3e; I hashed both file versions (4d2d62ea at c3614f4d2, b9f66783 at HEAD) and both blob ids match git. |

## Notes

- The three pending decision rows keep regenerate-from-source with null target; this report approves binding and conservation only, not renderer permission, backlog status truth, promotion, retirement or cutover.
- Neither direction shows loss: the table loses no predecessor line, and the only additions are the two main rows, which are present in the current table and registry. No hand-added or unlabelled row exists in the file.
- worktree git status was empty at the end of the review.

Unresolved: none.
