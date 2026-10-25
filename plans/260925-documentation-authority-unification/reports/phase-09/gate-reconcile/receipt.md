# Gate register reconciliation

Original reconciliation inputs: `53de2207e1ea8a9417ac131f785704d6ab72ba2c`; W18/L13-17 inputs: `a808bc676c74b1dfafa4dffda4f6d7a31b6d86d6`; W19 review inputs: `98d9201f1905e433a40b94d8d8b0fb9fefda1452`; W20/W21/L13-18–19 catch-up: `cf13e2bd22ce390344837560b35b41adf7da1238` (each layer fingerprinted separately in receipt.json). No parallel uncommitted carries/g0rework bytes were read.

## Result

Met-local (not met at F): G0–G9; no local before-F blocker remains. W20/W21 and L13-18–19 settle the G2 census judgments (0288 REJECT under L13-19.1), G5 full check and G8 receipt/ref scheduling. The cutover approval packet must carry owner acceptance of the 8 exact G5 restatements (L13-10), Git/HARDEN review of 25 declarations and the alias-export gap, Git §7 consent and G10 rehearsal, SEAT release R and installed-host G11 proofs, the 2 backlog-owner G9 parks and 15 carried phase-08 dependencies, and S2 archive publication/main manifest merge plus separate cutover/lease/Land approval. All F duties remain open, including the L13-18 local archive ref with custody before G10; no F, release, publication or cutover is approved here.

Met-local is a pre-F scheduling classification, **not** final gate acceptance. Owner/external/F work stays open.

## Counts per gate

Counts are register entries, not distinct underlying defects. The prose remaining entry can overlap blockers.

| Gate | Status before → after | Blockers before → after | Remaining entries before → after | Cleared | F duties | External |
|---|---|---:|---:|---:|---:|---:|
| G0 | partial → met-local | 6 → 0 | 1 → 0 | 2 | 3 | 0 |
| G1 | partial → met-local | 5 → 0 | 1 → 0 | 6 | 2 | 0 |
| G2 | final-pin → met-local | 4 → 0 | 1 → 0 | 2 | 2 | 0 |
| G3 | final-pin → met-local | 2 → 0 | 1 → 0 | 0 | 1 | 0 |
| G4 | external → met-local | 3 → 0 | 1 → 0 | 1 | 0 | 1 |
| G5 | partial → met-local | 0 → 0 | 1 → 0 | 1 | 1 | 1 |
| G6 | partial → met-local | 4 → 0 | 1 → 0 | 3 | 3 | 0 |
| G7 | partial → met-local | 6 → 0 | 1 → 0 | 4 | 2 | 0 |
| G8 | partial → met-local | 4 → 0 | 1 → 0 | 2 | 2 | 1 |
| G9 | partial → met-local | 4 → 0 | 1 → 0 | 3 | 3 | 2 |
| G10 | external → external | 3 → 0 | 1 → 0 | 0 | 1 | 1 |
| G11 | external → external | 3 → 0 | 1 → 0 | 0 | 1 | 2 |

## Important boundaries

- G2: W20/W21 review chain closes settlement/citation rework. L13-19.1 settles 0288 as non-document diagnostic REJECT. Current 1,126 = 779 proof joins + 289 unchanged grades + 54 settlement REJECTs + 4 citations; zero open judgment. Post-pin/F duties remain open.
- G6: W8 reviews are exhaustive before db023f065; W9 accepts its 319-park / 20-operand reclassification by rule with a 56-row spot check and controls (L13-17.3). Current totals remain 4,320 / 924 / 163 / 6 = 5,413. W19 independently approves 25e8842d3 receipt counts; G6 is met-local, not final-met. Owned actions, F refresh and combined verifier remain open.
- G0 F join duty carries W16 F5: duplicate /bindingRefresh/124..126 follows later rebinds of /6, /20, /21. G3 F placement pre-existed in the old register; W3 is not its authority.
- Import-3: all 98 rows reviewed APPROVE; 8 adapted rows are included in the 24 new source rows, not additional rows.
- G0: W14 reviewed 124 distinct rows, including the 3 Lead corrections. W19 independently approves all 25 pending rebinds (8 changed target digests) row by row; G0 is met-local.
- G1: W19 independently approves the L13-16 live-parity correction and 25 rebinds; W20 B approves the stale-duty control and duplicate-heading cleanup. Two disclosed drifted patches stay at F.
- G9: W15 reviewed all 50 parks/superseded/recomposition rows and sampled 60/288 still-valid rows, not all 338 exhaustively; current dispositions are 526 / 15 / 31 / 2. The 2 backlog-owner parks and 15 inherited phase-08 blockers remain owned/open.
- G5: W21 B approves check-b57e79625.json (exit 0, 1 verbatim / 8 restated / 1 not applicable). Only owner acceptance of 8 exact restatements and the F rerun remain open.
- G8: W20 C independently approves f67e0f676. L13-18 defers the create-only LOCAL archive ref, with custody, to the F rebuild before G10; S2 publication stays owner-gated. No Git mutation here.
- Historical residual sizing is 407 distinct = 361 chain-caused + 46 pre-existing, 556 assertions at W10. Earlier 661 is not an additional population; F must re-enumerate.
- L13-12 replaces L13-9 review-branch/blanket stop wording; no release, lease, publication or cutover permission is inferred.

## Every original item

The machine receipt preserves each original pointer/text, explanation, exact evidence paths and independently decided parts of compound entries. Below, evidence groups are linked once instead of repeating their full path lists for every overlapping occurrence. A cleared review demand does not clear the F/owner parts of a compound sentence; those parts are explicit in `receipt.json` and in the register.

| Original pointer | Original item | Decision | Evidence group |
|---|---|---|---|
| `/gates/0/blockers/0` | 124 content rebind rows pending re-review (rebind/rereview-claim-ids.json) | cleared | [G0](#g0-evidence) |
| `/gates/0/blockers/1` | 3 rows corrected in 6f5b9419d (claim_26b3a49a move->merge, claim_2e2bc926, claim_5ba6768e) not independently re-reviewed | cleared | [G0](#g0-evidence) |
| `/gates/0/blockers/2` | 73/257 changedBindings rows in phase-08/step-08-preflip-gates.json not current at 77db6ed2b; register not re-joined since fd161a8c2 (w4-ledger-d7b REWORK HEAD-gate-changedBindings, LF-claim_af89c4e6-current) | moved to F | [G0](#g0-evidence) |
| `/gates/0/blockers/3` | Earlier approvals were bound to pre-migration hashes and M1 digests; no current-digest verdict file exists | moved to F | [G0](#g0-evidence) |
| `/gates/0/blockers/4` | Final pin F not recorded | moved to F | [G0](#g0-evidence) |
| `/gates/0/blockers/5` | 661 bindings unresolved after full patch chain; final-pin post-apply rebind required (reviews/w9-composition-fix-review.md) | moved to F | [G0](#g0-evidence) |
| `/gates/0/remaining` | Re-review the 124 pending content rebind rows and the 3 rows corrected in 6f5b9419d, then at F re-join every changedBindings row to its ledger row and produce a verdict join with 0 missing, 0 mismatched and 0 open REWORK. | moved to F | [G0](#g0-evidence) |
| `/gates/1/blockers/0` | No independent review found for composition/** (family 8 successor scan sets, family 13 convention/citation-drift scan, family 17 area-holder table) | cleared | [G1](#g1-evidence) |
| `/gates/1/blockers/1` | GAP-05 placement proposal (composition/gap05-placement-proposal.json) awaits Lead approval; test/runner/dead-vocabulary-guard.test.mjs red (L13-7 D class) | cleared | [G1](#g1-evidence) |
| `/gates/1/blockers/2` | test/scripts/check-decision-citation-drift.test.mjs real-repo baseline case reports 124 new findings (open parity gap per composition/receipt.md) | moved to F | [G1](#g1-evidence) |
| `/gates/1/blockers/3` | No per-member APPROVE join over all 115 members found | cleared | [G1](#g1-evidence) |
| `/gates/1/blockers/4` | Pending content rebind re-review (rebind/rereview-claim-ids.json) overlaps carried claims | cleared | [G1](#g1-evidence) |
| `/gates/1/remaining` | Independent per-unit review of the 24 import-3 bindings and the 8 adapted rows (s18-import3-resync.json); at F re-run the owning guards (dead-vocabulary, citation drift) on the post-apply tree. | moved to F | [G1](#g1-evidence) |
| `/gates/2/blockers/0` | Pinned to 3d0169f39, not F | moved to F | [G2](#g2-evidence) |
| `/gates/2/blockers/1` | 33 G2 Rust test locators moved since the pin | moved to F | [G2](#g2-evidence) |
| `/gates/2/blockers/2` | 8 post-pin literal judgments open | moved to F | [G2](#g2-evidence) |
| `/gates/2/blockers/3` | preserve-premise/verify.py exits 1 on the G2 census pin | moved to F | [G2](#g2-evidence) |
| `/gates/2/remaining` | At F, re-run join.py with --pin F and --rescan, refresh the 33 moved Rust locators, settle the 8 open literal judgments, get preserve-premise/verify.py to exit 0 and get a delta review. | moved to F | [G2](#g2-evidence) |
| `/gates/3/blockers/0` | Per-id approvals are bound to cffe725b9; targets edited afterwards | moved to F | [G3](#g3-evidence) |
| `/gates/3/blockers/1` | Register statuses still restored-pending-review / superseded-pending-review | moved to F | [G3](#g3-evidence) |
| `/gates/3/remaining` | At F, re-check the 17 register targets at their current anchor and unit digest, get a delta review for any changed target, and move the register statuses off *-pending-review. | moved to F | [G3](#g3-evidence) |
| `/gates/4/blockers/0` | Git owner / HARDEN review of the 25 declarations not done; review-branch push waits for WORK "cutover xong" (L13-9) | still open | [G4](#g4-evidence) |
| `/gates/4/blockers/1` | 53499dc9d (w6 REWORK fix) not independently re-reviewed | cleared | [G4](#g4-evidence) |
| `/gates/4/blockers/2` | Aliased-export scan gap is an open Git-owner item (git-one-door/git-owner-review-request.md) | still open | [G4](#g4-evidence) |
| `/gates/4/remaining` | Git owner (HARDEN) must review the declarations on the review branch, and 53499dc9d needs an independent check. | still open | [G4](#g4-evidence) |
| `/gates/5/remaining` | Extend g5/check.py to the surviving docs/reading-map.md: banner lines 3-9 are restated in English in §3, line 34 survives only with a Truth correction suffix (line 156), line 37 is exact (line 159); the restatement and suffix need owner acceptance (cutover packet), then rerun at F. | moved to F | [G5](#g5-evidence) |
| `/gates/6/blockers/0` | c5586146c (w7 REWORK fixes) not independently re-reviewed | cleared | [G6](#g6-evidence) |
| `/gates/6/blockers/1` | No exhaustive APPROVE over the 1,423 open judgment/note rows and every overturn (w2-g6 was a stratified sample) | cleared | [G6](#g6-evidence) |
| `/gates/6/blockers/2` | 186 G6 rows and 86 wrapper successor digests to refresh at F | moved to F | [G6](#g6-evidence) |
| `/gates/6/blockers/3` | Combined verifier blocked on the G2 census pin | moved to F | [G6](#g6-evidence) |
| `/gates/6/remaining` | Get c5586146c independently checked, get an APPROVE on every overturn/judgment row (the reviews so far were sampled), then refresh the proof at F and replay it twice. | moved to F | [G6](#g6-evidence) |
| `/gates/7/blockers/0` | 2 REWORK specs recomposed but not re-reviewed | cleared | [G7](#g7-evidence) |
| `/gates/7/blockers/1` | 101 park actions without independent review | cleared | [G7](#g7-evidence) |
| `/gates/7/blockers/2` | 4 park actions blocked: system-overview f07928/f07929, architecture-intent 8 Related/evidence rows, transitional-switchboard f08382-f08384, documentation/switchboard f06749-f06751 | cleared | [G7](#g7-evidence) |
| `/gates/7/blockers/3` | 124 content rebind rows plus 3 corrected rows (6f5b9419d) pending re-review | cleared | [G7](#g7-evidence) |
| `/gates/7/blockers/4` | 36 specs deferred to G9; approvals bound to 8a9385eca bytes | moved to F | [G7](#g7-evidence) |
| `/gates/7/blockers/5` | 661 bindings unresolved after full patch chain; final-pin post-apply rebind required (reviews/w9-composition-fix-review.md) | moved to F | [G7](#g7-evidence) |
| `/gates/7/remaining` | Re-check every approved spec digest at F and get delta reviews; the 4 blocked park actions were resolved in the w8/w9 composition rework. | moved to F | [G7](#g7-evidence) |
| `/gates/8/blockers/0` | 984829939 and 5c3b57347 (w5-d5c REWORK fixes) not independently re-reviewed | cleared | [G8](#g8-evidence) |
| `/gates/8/blockers/1` | Partition bound to d3efc70c5; rebuild required at F | moved to F | [G8](#g8-evidence) |
| `/gates/8/blockers/2` | No local archive ref in the repository (rehearsal clone only) | moved to F | [G8](#g8-evidence) |
| `/gates/8/blockers/3` | Publication (S2) needs owner cutover approval | still open | [G8](#g8-evidence) |
| `/gates/8/remaining` | At F: rebuild the partition keeping register evidence (L13-13.4), re-enumerate readers to 0 unresolved and retime from a cold cache. | moved to F | [G8](#g8-evidence) |
| `/gates/9/blockers/0` | Final pin F not recorded | moved to F | [G9](#g9-evidence) |
| `/gates/9/blockers/1` | Interim and final re-judgment of 518 + 144 records not done | cleared | [G9](#g9-evidence) |
| `/gates/9/blockers/2` | Doer-SHA record pins not re-pinned to plan-branch SHAs (w4-import2 REWORK) | cleared | [G9](#g9-evidence) |
| `/gates/9/blockers/3` | No G9 review | cleared | [G9](#g9-evidence) |
| `/gates/9/remaining` | At F: rerun sweep.py --check --pin F and judge every row whose evidence changed since d786e305e; recompose drifted specs; the 338 owned parks are mechanical (5 fixed rules, generic next action) and need the Lead re-judgment or an owner before F; source review of the F delta. | moved to F | [G9](#g9-evidence) |
| `/gates/10/blockers/0` | Git owner section 7 consent not recorded | still open | [G10](#g10-evidence) |
| `/gates/10/blockers/1` | Depends on G11 release and F | moved to F | [G10](#g10-evidence) |
| `/gates/10/blockers/2` | Depends on G8 rehearsal clone at F | moved to F | [G10](#g10-evidence) |
| `/gates/10/remaining` | After section 7 consent and the G11 release, run holder Land publish, non-holder refusal and rollback on the shrunk clone at the F code commit and commit the receipt JSON. | still open | [G10](#g10-evidence) |
| `/gates/11/blockers/0` | SEAT release not staged | still open | [G11](#g11-evidence) |
| `/gates/11/blockers/1` | Depends on F | moved to F | [G11](#g11-evidence) |
| `/gates/11/blockers/2` | WORK cutover stop: DOC launches no fgos run, pull or push until "cutover xong" (L13-9) | still open | [G11](#g11-evidence) |
| `/gates/11/remaining` | SEAT stages release R with sourcePin equal to the F code commit; the Lead then proves docs-lease acquire/status/release/abandon in a disposable clone. | still open | [G11](#g11-evidence) |
| `/cutoverReadiness/beforeFinalPin/0` | Re-review the 124 pending content rebind rows in rebind/rereview-claim-ids.json and the 3 rows corrected in 6f5b9419d (G0, G7) | cleared | [G0](#g0-evidence), [G7](#g7-evidence) |
| `/cutoverReadiness/beforeFinalPin/1` | Get independent re-reviews of the Lead REWORK fixes: c5586146c (G6), 6f5b9419d (G0/G7), 53499dc9d (G4 spec sentence), 984829939 and 5c3b57347 (G8) | cleared | [G0](#g0-evidence), [G4](#g4-evidence), [G6](#g6-evidence), [G7](#g7-evidence), [G8](#g8-evidence) |
| `/cutoverReadiness/beforeFinalPin/2` | Get an exhaustive APPROVE of every G6 overturn/judgment row, including the 1,423 open judgment/note rows (G6) | cleared | [G6](#g6-evidence) |
| `/cutoverReadiness/beforeFinalPin/3` | Run and commit the G5 retention hash check (G5) | cleared | [G5](#g5-evidence) |
| `/cutoverReadiness/beforeFinalPin/4` | Re-judge or assign owners for the 338 mechanical G9 parks (G9) | cleared | [G9](#g9-evidence) |
| `/cutoverReadiness/beforeFinalPin/5` | Independent per-unit review of the 24 import-3 bindings and 8 adapted rows in s18-import3-resync.json (G0, G1) | cleared | [G0](#g0-evidence), [G1](#g1-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/0` | Import main (M2) with merge accounting and record F; no further main import after it | moved to F | [G0](#g0-evidence), [G9](#g9-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/1` | Re-pin Doer-SHA record pins to plan-branch SHAs, keeping plan/260925-w1-d* branches until then (w4-import2 REWORK) | cleared | [G9](#g9-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/2` | G9: run the all-spec hash sweep at F, recompose drifted specs (including the 36 deferred G7 specs and 19 predecessors) and get a source review | moved to F | [G7](#g7-evidence), [G9](#g9-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/3` | G0: re-join all changedBindings rows to the ledger at F (73/257 stale at 77db6ed2b) and run the verdict join to 0 missing or mismatched | moved to F | [G0](#g0-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/4` | G7: re-check every approved spec digest at F and get delta reviews | moved to F | [G7](#g7-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/5` | G2: run join.py --pin F --rescan, refresh the 33 Rust locators, settle the 8 open literal judgments, get preserve-premise/verify.py to exit 0 and get a delta review | moved to F | [G2](#g2-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/6` | G6: refresh the proof at F (186 rows, 86 wrapper digests plus any later drift), replay twice and get a review | moved to F | [G6](#g6-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/7` | G3: re-check the 17 register targets at F and set their final statuses | moved to F | [G3](#g3-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/8` | G5: hash check at F | moved to F | [G5](#g5-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/9` | Pair-account every new plan-branch commit | moved to F | [Common](#common-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/10` | Run the full suite in an isolated clone at F with main-vs-branch attribution | moved to F | [Common](#common-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/11` | G8: rebuild the partition at F, re-enumerate readers and time a cold checkout (after G10 per W4) | moved to F | [G8](#g8-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/12` | Write the final status ledger and get an independent review of it | moved to F | [Common](#common-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/13` | At F, after applying every composed patch, rerun the ownership/ledger binding resolution and rebind: review w9-composition-fix found 661 bindings unresolved after the full patch chain (2 at HEAD), e.g. 339 in platform-foundations.md from block-position shifts. The final-pin rebind must cover composed patches, not only GAP-05. | moved to F | [G0](#g0-evidence), [G7](#g7-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/14` | Size the post-apply rebind as two groups: 361 bindings broken by the composed patch chain and 46 already unresolved at the pin (w10-composition-rework); the 661 figure from w9 counts assertions across the full chain | moved to F | [G0](#g0-evidence), [G7](#g7-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/15` | Legacy drift scan after applying the prepared w8/w9 shards reports 2 gaps (README, repo-layout-vision) because its source join does not follow supersession; fix the join or carry them before the scan gate at F (w11-import3 F3) | moved to F | [G9](#g9-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/16` | Every check that reads committed bytes takes an explicit --pin; run them at F, not at a moving HEAD | moved to F | [Common](#common-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/17` | G8 rebuild at F keeps every file named as evidence in preflip-gate-status.json and the final status ledger (L13-13.4); 70 of 92 register evidence paths would otherwise be archived (w14-g8-retention-timing-review) | moved to F | [G8](#g8-evidence) |
| `/cutoverReadiness/atFinalPinUnderLease/18` | After the final main import, redo the claim_2e2bc926 supersede against main Event Store cutover 42c5a0a55 (events.mjs removed on main), L13-15.2 | moved to F | [G0](#g0-evidence) |
| `/cutoverReadiness/external/0` | Git owner / HARDEN reviews the 25 git one-door declarations on review/doc-git-one-door (G4) | still open | [G4](#g4-evidence) |
| `/cutoverReadiness/external/1` | Git owner gives section 7 consent (G10) | still open | [G10](#g10-evidence) |
| `/cutoverReadiness/external/2` | SEAT stages the docs-lease release from the F code commit; the Lead proves the four routes in a disposable clone (G11) | still open | [G11](#g11-evidence) |
| `/cutoverReadiness/external/3` | Lead runs the G10 holder Land rehearsal on the shrunk clone with that release | still open | [G10](#g10-evidence) |
| `/cutoverReadiness/external/4` | Owner decides S2, the archive ref push and main manifest merge (G8 publication) | still open | [G8](#g8-evidence) |
| `/cutoverReadiness/external/5` | Owner approves the cutover (lease + Land) as a separate decision | still open | [Common](#common-evidence) |

## Evidence groups

All paths below are phase-09-relative and read from the committed snapshot, not current uncommitted files.

### Common evidence

`owner-answers.md`, `preflip-execution-plan.md`.

### G0 evidence

`review-batches.json`, `reviews/g0-b1-review.json`, `reviews/g0-b2-review.json`, `reviews/g0-b3-review.json`, `reviews/g0-b4-review.json`, `reviews/g0-b5-review.json`, `reviews/w2-g0-delta-review.json`, `reviews/w4-ledger-d7b-review.json`, `reviews/w7-rebind-review.json`, `g0fix/receipt.md`, `ledgerfix/receipt.md`, `ledgerfix/recipe-migration.json`, `rebind/receipt.md`, `rebind/rereview-claim-ids.json`, `reviews/w16-g0-rework-and-park-rule-review.json`, `reviews/w14-g0-content-rereview.json`, `reviews/w17-parity-rework-review.json`, `g0rework/receipt.md`, `g0rework/receipt.json`, `carries/current-binding-refresh.json`, `reviews/w17-parity-rework-review.md`, `owner-answers.md`, `preflip-execution-plan.md`, `reviews/w19-live-parity-and-rebinds-review.md`, `reviews/w19-live-parity-and-rebinds-review.json`.

### G1 evidence

`carries/receipt.md`, `composition/receipt.md`, `composition/member-joins.json`, `composition/area-holder-table.json`, `composition/gap05-placement-proposal.json`, `composition/w2-gap05-verification.json`, `late-areas/receipt.md`, `resync-a/receipt.md`, `resync-b/receipt.md`, `reviews/w2-g1-carries-review.json`, `reviews/w2-late-areas-review.json`, `reviews/w3-d1b-resync-review.json`, `reviews/w3-d7-resync-review.json`, `reviews/w4-ledger-d7b-review.json`, `reviews/w5-misc-fix-review.json`, `reviews/w6-misc-rework-review.json`, `reviews/w8-composition-review.json`, `reviews/w9-composition-fix-review.json`, `reviews/w10-composition-rework-review.json`, `reviews/w14-check-hardening-review.json`, `reviews/w13-misc-pin-and-gloss-review.json`, `reviews/w14-import3-binding-review.json`, `reviews/w14-import3-binding-review.md`, `reviews/w17-parity-rework-review.json`, `import3/receipt.md`, `owner-answers.md`, `reviews/w19-live-parity-and-rebinds-review.md`, `reviews/w19-live-parity-and-rebinds-review.json`, `reviews/w20-census-settlement-review.md`, `reviews/w20-census-settlement-review.json`.

### G2 evidence

`census-join/receipt.md`, `reviews/w2-g2-census-review.json`, `reviews/w2-g2-dyn-delta.json`, `reviews/w3-g2g6-delta-review.json`, `reviews/w6-misc-rework-review.md`, `preserve-premise/verification.json`, `owner-answers.md`, `preflip-execution-plan.md`, `reviews/w20-census-settlement-review.json`, `reviews/w21-census-rework-and-g5-review.json`, `w19-cleanup-brief.md`, `reviews/w20-census-settlement-review.md`, `reviews/w21-census-rework-and-g5-review.md`.

### G3 evidence

`carries/receipt.md`, `reviews/w2-g3-packaging-review.json`, `preflip-execution-plan.md`.

### G4 evidence

`git-one-door/receipt.md`, `git-one-door/exemption-proposal.md`, `git-one-door/declared-exemptions/receipt.md`, `git-one-door/wrapper-callers/receipt.md`, `git-one-door/wrapper-escapes/receipt.md`, `git-one-door/git-owner-review-request.md`, `reviews/w2-g4-code-review.json`, `reviews/w4-g4-declare-review.json`, `reviews/w5-g4-wrapper-review.json`, `reviews/w6-g4-escape-review.json`, `reviews/w8-lead-fixes-review.json`, `owner-answers.md`.

### G5 evidence

`g5/check.py`, `g5/check-b726d44ed.json`, `reviews/w8-lead-fixes-review.json`, `reviews/w21-census-rework-and-g5-review.json`, `g5/check-b57e79625.json`, `reviews/w21-census-rework-and-g5-review.md`, `owner-answers.md`, `preflip-execution-plan.md`.

### G6 evidence

`preserve-premise/receipt.md`, `preserve-premise/sentence-delta.json`, `preserve-premise/sentence-replay.json`, `misc-fix/receipt.md`, `reviews/w2-g6-preserve-review.json`, `reviews/w3-g2g6-delta-review.json`, `reviews/w5-misc-fix-review.json`, `reviews/w6-misc-rework-review.json`, `reviews/w7-header-sentence-review.json`, `reviews/w8-lead-fixes-review.json`, `reviews/w9-g6-fix-review.json`, `reviews/w8-g6-parks-review.json`, `reviews/w8-g6-judgments-review.json`, `preserve-premise/receipt.json`, `owner-answers.md`, `reviews/w19-live-parity-and-rebinds-review.md`, `reviews/w19-live-parity-and-rebinds-review.json`.

### G7 evidence

`review-batches.json`, `reviews/g7-c1-review.json`, `reviews/g7-c2-review.json`, `reviews/g7-c3-review.json`, `reviews/g7-c4-review.json`, `reviews/g7-c5-review.json`, `reviews/g7-c6-review.json`, `reviews/g7-c7-review.json`, `composition/receipt.md`, `composition/w2-independent-verification.json`, `composition/w2-predecessor-recomposition.json`, `w1-review-notes.md`, `w2-review-notes.md`, `rebind/rereview-claim-ids.json`, `reviews/w8-composition-review.json`, `reviews/w9-composition-fix-review.json`, `reviews/w10-composition-rework-review.json`, `reviews/w16-g0-rework-and-park-rule-review.json`, `reviews/w14-g0-content-rereview.json`, `reviews/w17-parity-rework-review.json`, `reviews/w8-composition-review.md`, `reviews/w14-check-hardening-review.json`, `preflip-execution-plan.md`.

### G8 evidence

`archive/receipt.md`, `archive/design.md`, `archive/manifest.json`, `archive/verification.json`, `archive/rehearsal.json`, `archive/link-closure.json`, `reviews/w2-g8-archive-review.json`, `reviews/w4-g8-archive-review.json`, `reviews/w5-d5c-archive-review.json`, `reviews/w14-g8-retention-timing-review.json`, `reviews/w8-lead-fixes-review.json`, `reviews/w20-census-settlement-review.json`, `reviews/w20-census-settlement-review.md`, `reviews/w21-census-rework-and-g5-review.json`, `archive/receipt.json`, `owner-answers.md`, `preflip-execution-plan.md`.

### G9 evidence

`late-areas/receipt.md`, `late-areas/legacy-drift.json`, `import2/receipt.md`, `resync-a/receipt.md`, `resync-b/receipt.md`, `w0-deferred-rebinds.json`, `w0-prior-overlap-replay.json`, `composition/w2-predecessor-recomposition.json`, `reviews/w4-import2-review.json`, `reviews/w16-g0-rework-and-park-rule-review.json`, `reviews/w10-g9-interim-review.json`, `reviews/w11-g9-rework-review.json`, `reviews/w12-g9-followup-review.json`, `reviews/w15-g9-parks-review.json`, `reviews/w13-misc-pin-and-gloss-review.json`, `reviews/w14-check-hardening-review.json`, `g9/receipt.md`, `reviews/w11-import3-review.json`, `owner-answers.md`, `preflip-execution-plan.md`.

### G10 evidence

`owner-answers.md`, `preflip-execution-plan.md`.

### G11 evidence

`owner-answers.md`, `preflip-execution-plan.md`.

## Reproduce

`python3 -B plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/verify.py`

Checks every cited evidence/review path, cleared commit ancestry at its owning snapshot layer and HEAD, exact quoted review verdicts, source fingerprints, original-item coverage and counts. Exit 0; see verification.json. controls.py exits 0 with the positive proof and 10 rejecting controls, retaining all 9 original controls and extending the same owning proof for false catch-up fingerprints. No original assertion is weakened. Only verification.json /checkedAtHead is volatile; restore that field after replay, leaving current proof results intact.

Let P=plans/260925-documentation-authority-unification/reports/phase-09. All Python rows below run with python3 -B; current argv, exits and bytes are in catchup-proof.json.

| Command | Exit | Evidence |
|---|---:|---|
| P/census-join/join.py --pin cf13e2bd22ce390344837560b35b41adf7da1238 — final run 1 | 0 | catchup-proof.json |
| Same command — final run 2 | 0 | stdout/stderr and five join/citation outputs byte-identical |
| python3 -B P/g5/check.py --pin b57e79625 | 0 | byte-equal to g5/check-b57e79625.json; 31 controls |
| python3 -B P/gate-reconcile/reconcile.py — twice | 0 / 0 | all generated outputs byte-identical |
| python3 -B P/gate-reconcile/verify.py | 0 | verification.json; checkedAtHead restored afterward |
| python3 -B P/gate-reconcile/controls.py | 0 | controls.json; 10 rejecting controls |

Current catch-up reuses the generator, settlement branches and verifier seams; only an immutable catch-up evidence layer is added for the newly committed reviews/rulings. 0288 is a Lead-authorized REJECT (L13-19.1), not an invented independent review. No final-F acceptance, lease, ref creation or publication occurs here.

Historical cleanup logs remain unchanged in reproduction.json, misc-replay.json, ../census-join/replay.json and ../carries/cleanup-verification.json. They are not this turn’s proofs. sources.json keeps all original input fingerprints; receipt.json fingerprints W18, W19 and W20/W21/rulings separately. plan-branch-log.txt remains the original snapshot history. No product suite, native load, old authoring checker, Git mutation, fgOS CLI, pair accounting or preview service was used. Impact-analysis is degraded/unqueried under the no-CLI/no-MCP boundary. Scratch uses tempfile directories under /tmp/fgos-work/ and is removed. needsWrites: [].
