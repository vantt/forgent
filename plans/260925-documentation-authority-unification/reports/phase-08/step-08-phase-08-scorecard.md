# Phase 8 scorecard — rebuilt handoff, pending acceptance

Status: **records-only handoff rebuilt under L12-124; no Phase 8 closure or Phase 9 authorization**. Closure reviews [A](review-a38-step-08-closure-A.md) and [C](review-a38-step-08-closure-C.md) supersede the earlier claim that integration r3 established complete Step 3/4 carriage. Historical acceptances and L12-118..121 dispositions remain intact; they do not accept this new composition.

## Authority and proof boundary

- Source/author pin: **`5e03159334df726e43ffe9505ad4ed43f72ba94d`**. Authority: [rebuild brief](step-08-handoff-rebuild-brief.md), Lead under A42, recorded as **L12-124** in [owner answers](owner-answers.md).
- L12-124 explicitly reassigns unfinished composition and independent-review duties to **Phase 9 PRE-FLIP gates**. It does **not** mark those duties met, waive the Lead suite/clean committed-byte checks, or authorize cutover. The 44 missing doctrine claims are not the separate 44 Work freshness references.
- No consumer changes were applied: **0 applied-safe**. Existing verifier/lease implementations, including L12-123's Land recheck fix, are on the plan branch only. No main landing, real lease, alias adoption, legacy deletion or live-state completeness is claimed.
- Runtime parity commands in new records are **obligations, not executed tests**. Actual proof this turn is record conservation, pinned source binding, exact scratch patch roundtrip and determinism. Impact analysis: degraded/unqueried under the no-fgOS-CLI boundary; no product symbol changed. Markdown preview remains Lead custody.
- Historical proofs remain at their recorded pins. `step-07-integration-verification.json`, `step-07-final-verification.json`, export and post-move proofs are not current whole-handoff acceptance receipts. Current verification is [rebuild verification](step-08-handoff-rebuild-verification.json), [determinism](step-07-final-determinism.json) and [source recomposition](step-08-source-recomposition.json).

## Steps and independent reviews

| Step | Current record result | Independent boundary / verdict |
|---|---|---|
| 0 Binding integrity | L12-16's 85 rebindings and 138 review joins remain historical. Review A independently recomputed 9,251 digests and 8,954 ancestry values without drift or stale approval | **Independent changed-binding acceptance not met.** Current gate lists 191 pending row bindings at their exact current digest/binding hash; 189 changed since Step 0 plus two referenced-set rows. Prior digest-identical reviews may be reused explicitly; do not review unchanged rows again merely because their status remains conservatively pending |
| 1 Pilot B | [Current table](step-08-current-judgments.json): **47/47** relocated; ten source-changed rows rebound by exact line content. Current outcomes: **2 prepared / 21 preserved / 16 parked / eight retire-with-tree** | A M2 confirms all 47 historical judgments remain valid, not their old executable dispositions. Rows 16/17 remain individually parked; row 20's final Step 3 rewrite is now in the composed file. Historical 2/21/24/0 is not the current handoff |
| 2 Census | L12-28/29 mechanical inventory acceptance retained | No semantic approval inferred from lexical role hints. Every one of the 79 literal + 1,158 dynamic post-census sites is individually joined or gated |
| 3 Final per-file dispositions | **130 final batches / 1,037 records / 7,937 final owning edges**. All **830 prepared edges across 379 files** and all **2,265 original parks** are now independently represented. Effective: **577 prepared / 4,842 preserved-or-retiring / 2,518 parked** | L12-55/56 review of author records retained. New composition is **pending independent review**, not inherited from the pilot/r3 handoff. The 4,804 original preserves need their own post-move premise gate; 38 retiring-edge receipts explain the effective 4,842 count |
| 4 Final source/render slots | **33 batches / 275 source-owner records / 890 slots**; each slotKey has a distinct matrix identity even when one census edge spans multiple slots. All **45 original parks** retained. Effective: **64 prepared / 609 preserve / 217 parked** | L12-64 accepted authoring, not build/adoption. Original 236 future patch/render slots are now either composed or explicitly parked; no generated-render hand edit |
| 5 Behavioral ownership | Original **46,404 items** retained with stable rNNNNN ids and L12-118..121 overlays. Effective: **146 prepared / 9,555 preserved / 512 parked / 36,191 rejected**. Added [post-census records](step-08-post-census-records.jsonl): **72 files / 427 items = 85 preserve + 28 park + 314 reject** | L12-90 author acceptance retained; new traces and current file composition are **pending independent/parity review**. Identity mint and setup duplicate-id scans have explicit owners/blockers; they are no longer untraced. Do not substitute a flat `docs/platform` scan for split live holders |
| 6 Evidence verifier | Existing 867 identical mirrors; historical before 867/0 and expected pre-deletion after red 907; owning tests historically 41/41 | L12-95/97 acceptance retained. No verifier/runtime test rerun this turn. Standing-suite, retirement integration and actual after-deletion proof remain owed |
| 6b Lease | L12-115 branch delivery retained; L12-123 adds both Land-door publication recheck and its owning race proof | Independent final lease review predates follow-ups. Real landing, Git-owner §7 consent, Holder-lock notice, current-scope proof and integrated suite remain owed |
| 7 Atomic handoff | **55,658 rows / 524 per-file specs / 423 composed roundtrips / 101 named composition parks**; all final Step 3/4/5 hunks composed together where unambiguous | **Not accepted/readiness not met.** Two byte-identical `--final --pin` runs; five generated handoff outputs **7,475,179 bytes**, below 8 MB. Pilot directories fail loudly. Roundtrip proves bytes, not semantic parity |
| 8 Closure | This rebuilt scorecard, L12-124, progress and current receipts | **Not met:** Lead full suite/attribution, actual runner-pair clean acceptance and fresh independent closure review remain pending |

Step 3's historical 9,424 authored-edge count and Step 5 membership totals are not additional unique handoff rows. The final matrix intentionally represents cross-stage memberships separately, never pretends Step 5 inherited Step 3/4 ownership.

## Requirements and success criteria

| Requirement | Current evidence / state |
|---|---|
| AGENTS/CLAUDE, instruction sources | Prepared records / named parks, **PRE-FLIP gate**: root instruction owner/A34 retains seven root-pointer parks, two exact claim residuals and the other 28 representations; no generated projection hand edit |
| Reading maps/portals | Final Step 3 rows now present. Entry-by-entry current-source union remains a **PRE-FLIP gate**; reading-map parks are final, not pilot patches |
| Skills/prompts | Final Step 4 physical source/render joins, canonical core records and post-census generated readers are explicit. **PRE-FLIP source-first composition/build/parity gate**; 13 external plan conventions and nine historical references remain governed by L12-10 |
| CLI help/examples | `cli-help-messages.jsonl` is included in one final-pin spec per file. `bin/fgos.mjs` has an ambiguous authored hunk and is **parked** with owner, not executable; output goldens/parity before flip |
| Setup/doctor | Existing roots and lease registration are historical branch delivery; **new identity-checks reader trace/parks** cover the missing scan. Co-cut actual duplicate-heading coverage and fixtures with Rust mint's document floor before flip. Not “all consumer roots prepared” |
| Generators/projections | State-wins index export parity remains delivered; fixed-root index/manifests retained. Exact generator/render/row actions not composed are among 101 file parks, **not runnable patches** |
| Tests/fixtures | Exact current-pin composition is byte-proven for 423 files in aggregate, not 423 runtime tests. Source/fixture co-cuts and six deferred owning replays are **PRE-FLIP gates**; ambiguous merge-test hunk is parked |
| Comments/authority pointers | Final source hunks included; conflicting shared Rust adapter comment composition is parked. No blanket preserve-role exemption or fabricated Workflow holder |
| Maintained in-repo links / Gateway contract | Final Step 3/4 links and Gateway reader/fixture records carried. Live YAML-reader switch, HTTP/MCP parity, CTR010/011 truth and installed/external adoption remain unproved |
| Evidence consumer table/manifest/verifier | Existing exact consumer-line hashes, 867 mirror digests/modes and historical before/after receipts retained. Live repoint/delete, standing-suite and `evidence-digests` registration remain owned execution gates |
| Lease/current-door reuse | Delivered on branch, not landed. Keep no-TTL persistent-sidecar/token boundaries, owner repair and both Land doors. No consent, actual scope digest or main-sidecar state is inferred |
| Binding integrity / A47 truth | Current-source union of **54 paths** is rehashed at this pin; Git spec changed since the old 2,049-binding receipt. Old “bound-at-pin” labels are not copied. Current pending bindings, all-source conservation and stale present-tense claims require independent proof |
| Decision F/shipped classification | Frozen B and L12-89's three same-change replacement guards remain binding; no rebaseline, record mode or new classifier exception. Plan A/B landed historically; Plan C and rule lane never become reverse cutover dependencies |
| **SC1: exact pre-cutover authority coverage** | **NOT MET.** Now 3,275 effective parks, 101 file composition parks, independent/parity duties, L12-96 uncomposed holders/claims/scans, 191 pending binding gates and 1,126 non-behavioral census joins. Historical 133 stale / 113 uncomposed specs were false completeness: the 133 now map to **48 composed / 77 parked / eight retiring/no prepared final hunk**. Complete post-flip literal/remnant search remains Phase 9, not executed |
| **SC2: aliases lookup-only** | **MET ONLY FOR THE TRACED RECORD POPULATION**, not adopted production aliases: **52 effective writer rows / 1,559 old paths / zero violations** = eight prepared + 16 preserved + 27 rejected + one new parked writer. Original Step 5 51 are stable; Step 3/4 have zero writers. All 43 post-census writer role hints are individually triaged; fixture/nonbehavioral joins remain PRE-FLIP. Caller/scratch/scalar false positives do not invent document destinations |
| Step 8 suite/independent acceptance | **NOT MET.** L12-124 moves review/composition backlog PRE-FLIP, never waives the full suite, committed-byte reproduction or fresh closure review |

## Exact final accounting and proof

| Population/proof | Count and boundary |
|---|---|
| Matrix | **55,658 = 0 applied + 787 prepared + 15,091 preserved-history/fixture + 3,275 individually parked + 36,505 rejected**; 19,153 consumer rows. 25 author structural/conservation/binding/receipt checks pass in `step-08-handoff-rebuild-verification.json` |
| Final file composition | **524 specs = 423 composed-at-pin + 101 parked**; 92 lack exact generator/render/row action; nine have missing/ambiguous/overlapping hunks. Every executable spec has one forward/inverse body, before/after SHA-256 and actual `patch --batch --fuzz=0 -p1` forward/rollback proof on scratch pinned bytes |
| Source drift | All final source records surveyed, including **32 changed-present + one missing Step 3 file**, 45 changed Step 4 records and 510 changed Step 5 memberships. The complete list and owners/outcomes are in `step-08-source-recomposition.json`. Review A's “33 changed + one missing” is **not reproduced**: at both review and final pin the full 1,037-record replay gives **33 total**, including missing Session Identity. No 34th file is invented; Lead reconciles this one-count prose discrepancy |
| Historical parks | Original **2,311 members = 2,131 flips + 180 family parks** and **34 additional integration parks** unchanged. All 214 earlier effective park owners/families survive. Additional composition parks are explicit execution blockers, not cancellation of accepted member rulings |
| Preserve-premise scope | L12-121 checked **9,650 original Step 5 preserves**, overturning 95 into 61 patches/34 parks and retaining 9,555. It did **not** prove final Step 3's 4,804 or Step 4's 609 preserves; independent premise review is expressly PRE-FLIP |
| Determinism | Two full final-pin assembler runs and stdout byte-identical. Five output sizes/hashes and all three new authored-input hashes in `step-07-final-determinism.json`; no generated readiness self-input |
| Post-census join | All **79 + 1,158** original compact site identities conserved; 427 grade items include two additional canonical core-source records outside that denominator. Each grade item has current source/operand, admission/disposition, owner and static-preservation/blocked-parity receipt; no parity command claimed run |
| Writer split correction | Matrix and readiness now share effective classes, resolving C F7. The historical 7 parked/17 preserved/27 rejected was pre-overlay; 8 prepared/16 preserved/27 rejected was post-overlay. New parked document writer makes 52, not a fabricated extra alias violation |
| Pair accounting | `step-08-handoff-rebuild-pair-accounting.json` records actual committed pairs and author-time audits, performed last. Future runner commit/path pairs **cannot** be pre-accounted; clean committed-byte acceptance remains a separate Lead Unit |

### L12-96 Step 7 duties not performed — explicitly reassigned PRE-FLIP

Full original member identities **and subsequent integration park members** are in `step-08-preflip-gates.json:l12_96Composition`; no anonymous post-flip carry:

| Duty | Owner / PRE-FLIP work |
|---|---|
| 44 missing claims, families 14/15/16/18 | Platform-foundations/locked-law (13), Knowledge-registry/framework (12), Runner/Work-state (11), Packaging-distribution/Gateway (eight): bind exact verbatim passages and live holders, preserve heading layout and accepted doctrine, then compose source pointers |
| Per-area holders/convention/coverage, families 13/17 | Decision-index generator / area-holder mapping owner: minimal area decision/RUL convention, split/renamed holders and recursive scan coverage at least as strong as current; exact source patches and regenerated renders |
| Post-retirement scan sets, family 8 | Documentation-governance / successor-scan owner, Lead for GAP-05 placement: original 31 member identities plus all 48 current historical integration parks; exact successor sets and owning guard replay, not guessed `docs/platform/**/spec.md` substitution |

### Phase 9 PRE-FLIP gates and retained duties

The authority is **L12-124**, not a new Doer deferral. `step-07-readiness.json:preFlipGates` points to the complete id/owner/digest/site lists in [gate details](step-08-preflip-gates.json). All **3,275** current parks have individual `rowId`, physical file, member/slot identity, owner and `remainingBlockerRef`; `blockerCatalog` holds either the exact blocker or its frozen record/member/hash locator. Do not interpret a blocker reference as absence of a blocker.

1. **Changed-binding independent review:** Lead/independent current-digest reviewer owns **191** listed file/key/claim-id/current-digest/binding-hash rows, including every 189 pending change since Step 0 and referenced merge/target rebind sets. Review A's 81-unreviewed set is not magically accepted; earlier digest-specific proof may be joined only if still identical. No approval is changed or carried by this turn.
2. **Dropped claims:** all **17 ids** are individually listed: **dropped-001 restore the conserved documentation claim before flip** (Packaging-distribution/Lead conservation owner; describe missing implementation honestly), **002–017 review/restore or explicitly disposition** (Host-invocation-routing/Lead conservation owner). Historical “Unassigned” is retained as provenance, not the new owner. Plan C implementation is draft/unscheduled and remains **NOT a cutover dependency**; restoring/dispositioning documentation is not authorization to implement it.
3. **Git one-door:** **58 sites versus five on main `9c7edde30`**; all 53 branch additions plus shared-main sites assigned to Git one-door/source owners. Each has **typed-port-fix** or **declared-exemption duty**; no exemption is approved here. Includes `scripts/check-evidence-relocation.mjs` and `.githooks/pre-commit`. Doctor red is explicit, not a permitted unexplained suite red.
4. **Retention:** Holder-lock owner retains **L11-23 current in-process header** and prepared retired-fence correction. Navigation owner retains **L11-25 transition banner** and both **compounding→knowledge** lines (**+10/−2 versus `eab4d617b`**, accepted divergence). Exact current line text/hashes are `retentionReceipts`; entry-union must preserve them.
5. **A34/navigation/current truth:** retain two named A34 claims and other 28 representations; seven AGENTS pointer parks, reading-map entry union, PF-I022/23 main-report patch, real Workflow holder and registry missing-currentPath all remain explicitly owned. **C F9** points A47/current-truth/Packaging-distribution reviewer at `setup-doctor-registry.md:207`: `lock-fences` row 7b and `predecessorKillWaitMs` are retired, not current shipped behavior.
6. **Step 5 carries and parity:** all 16 `step5-carry:*` obligations remain in readiness with original evidence and L12-124's explicit Phase 9 PRE-FLIP assignment where blocked. Preserve source/fixture co-cuts, gateway YAML copy semantics, registry provenance, store-comment/R5/triage composition, six deferred replays, **44 Work freshness refs**, two changed acceptance clauses of 99 and two cleanup diagnostic deltas across 647 verdicts. These numbers do not describe the separate 44 missing doctrine claims.
7. **Guard/consent/landing:** GAP-05 is the sole permitted historical closing red and still a **pre-landing blocker**, never a waiver. L12-89 replacement guards must co-retire the whole ratchet with no coverage gap. Lease owners obtain Git §7 consent/Holder-lock notice and actual fresh scoped-ref/checkout proof. Current Land recheck code does not grant real freeze/landing authority.
8. **Non-behavioral census joins:** all **1,126** fixture/comment/history/caller-scalar sites have stable original site ids and owner. Confirm grade-record REJECT custody or original owning proof **before flip**, not Phase 9's post-flip search. Current static traces do not certify ignored/external/live `.fgos` inputs; two external locator parks remain outside the original Step 5 denominator.
9. **Non-dependencies and bounded history:** A/B landing and C naming correction from L12-118 remain; L12-91 rule-management writes occur after cutover, never block it. Earlier RUL10/P8-DOC-GAP-01/02/03, two non-retiring dead links and pathless locators retain their source-specific obligations. Export v2 is delivered, not requested again. C F8 pruning metadata below authorizes no deletion.

### Lead suite and closure proof — measured red; suite-fix follow-up blocked

Lead's two isolated-clone results below are supplied by `step-08-suite-fix-brief.md`, not rerun by the Doer. **L12-125** in [owner answers](owner-answers.md) now includes continuation-2 complete-file checks at input HEAD `0962d4e834622445c1cada8436edd633ad6a84e5` plus the heading-identity test/record/accounting working slice. Artifact/registry/switchboard/changelog fixes are already in that input commit. No full suite, cargo suite or clean committed-byte acceptance is claimed for these changed bytes.

| Command/proof | Tree / exit / failures | Ownership and attribution |
|---|---|---|
| `env -u CLAUDE_CODE_SESSION_ID npm test` — isolated branch | **9f49695c7 / 1 / 406 failures of 9,317 tests** (Lead-supplied) | 18 unique branch-only titles: A=11 branch-caused, B=3 proposed clone artifacts, C=3 proposed flakes, D=1 authorized GAP-05 red. L12-125 records 7/11 A titles verified fixed, two native-before-hook blockers and two pending clean-pair recipe acceptances. Only one B case verified; native-blocked C reruns do not establish flakiness |
| Same isolated main baseline | **9c7edde30 / 1 / 392 failures of 8,668 tests** (Lead-supplied) | Exact failure lists in `suite-logs/`; 18 title differences are not the arithmetic count delta of 14. Raw Lead logs unavailable in this sandbox. No current-tree full-suite green inferred |
| `cargo test --workspace` when required by Lead proof frame | **not run** | Still owed if required; no historical result substituted |
| Both embedded ownership/audit/check recipes and `test/scripts/doc-rationale-reproduction.test.mjs` after actual-pair accounting | **Final: exit 1, 6/8; both recipes 0/0/1; clean committed pair still pending** | 27 actual historical pairs (18 rebuild + four brief/log + five prior repair) appended last through existing exception data only: both checks now show **4,179 accounted / zero unaccounted**, B green, H zero findings, both effective I predicates true. Only two current author report writes fail A; no allowlist/check/baseline/future-id waiver. Runner commit + separate L12-11 accounting/replay remains owed; symlink cases pass |
| Full `check-doc-candidate-status.test.mjs` and `check-doc-constitution.test.mjs` | **Exit 0: 11/11 and 64/64** | Complete files rerun in this worktree; final clean committed-byte replay remains separate |
| Command-route and envelope generators / owning files | **Both --check exit 0; command-routes 14/14 and envelope-contract 21/21, exit 0** | Existing-generator repairs from `0962d4e83` rechecked; no additional artifact edits |
| Full help-routes and release-tree proofs | **Both exit 1: help 0/5; release-tree 0/4** | Missing compiled `target/release/libfgos_node_addon.so` stops both shared before-hooks, including R4, before behavior. No separate committed help golden: live registry vs scratch staged release. Native infrastructure is not fixed through a test bypass |
| Runner liveness owning proof | **Exit 0, 1/1** | Lead-authorized owning-test repair locates all 31 original content-derived anchors uniquely; all 13 complete-record consumer/path/bounds/non-retirement cases retained. Former test-scope blocker resolved, no scanner/classifier/doc change |
| B admission checks | **Symlink case passes; two admission files unexecuted/infrastructure-blocked** | Read-only native preflight exits 1 (`git-addon-not-shipped`). Their automatic module bootstrap would stage forbidden `.fgos/runtime/git-addon`; not attempted. Clone-location hypothesis remains unverified |
| C three isolated reruns | **Each run once alone, all exit 1: worktree 0/7, ledger 1/8, observe 0/2** | Worktree/observe cannot load addon/lock driver; ledger cannot create `/var/tmp` fixture under confinement. These are prerequisite failures, not timing/recovery proof or confirmation of flakiness |
| Full `check-legacy-docs-ratchet.test.mjs` and `check-decision-citation-drift.test.mjs` | **Exit 0: 28/28 and 31/31** | Complete files rerun; no baseline/allowlist/check weakening |
| Fresh independent rebuilt-handoff closure review | **pending** | Lead starts one A38 review of final source pin, matrix, all gates, scorecard and actual-pair evidence |

Any unexplained red other than the narrowly allowed GAP-05 stops close. L12-14/L12-124 waive neither frozen B nor reproduction checks. **L12-125 is blocked partial repair, not suite acceptance**: the owning-test scope issue is resolved, but native-build/fixture prerequisites, two B admission runs, actual C behavior and clean committed-pair reproduction remain owed. Lead owns infrastructure provisioning without changing source behavior, the separate actual runner-pair accounting/replay, and remaining suite/closure proof. No future commit was pre-accounted; later cutover authorization remains a separate owner decision.

### Step 7 r3 Low observations — historical, not new acceptance

Retain r3 L1 dated distribution-vision rationale wording, L2 rollup-history capture wording and L3 redundant gateway YAML copy ordering. Current file composition may park an earlier prepared action; no low observation accepts a new patch. C Low notes are addressed above: effective writer split, explicit stale registry truth review, and dependency-aware bloat table below.

### Repository bloat — inventory only, no deletion

Read-only committed inventory at the source pin: **35 files / 34 unique blobs ≥10,000,000 bytes**, **728,650,869 logical bytes**, not Git-pack disk cost. The two 15,083,075-byte checker files share blob `5e3d93d7`. Full bounded direct script/review consumers and both reproduction-manifest pair dependencies: [dependency inventory](step-08-bloat-dependencies.json). Owning records, failure provenance and historical reviews must remain reproducible; actual deletion needs separate authority and L12-11 actual-pair accounting. **No bloat payload is deleted or pruned.**

| Committed file | Bytes | Track-end treatment | Dependents (full list in inventory) |
|---|---:|---|---|
| `step-05-records/tests-judgment-batch6.jsonl` | 103,868,451 | Owning record; retain until references/reproducibility safely preserved | `step-05-seam5-b6-review-closure.py`; `step-05-seam5-batch6-author.py`; `step-05-seam5-batch6-check.py`; `step-05-seam5-batch6-closure.py`; +12 in inventory; both Phase 6 reproduction pair histories |
| `step-05-records/ui-spec-compiler.jsonl` | 66,028,148 | Owning record; same protection | `step-05-check.py`; `step-05-seam67-finalize.py`; `step-05-seam67-seal.py`; `step-05-seam67-authoring-brief.md`; +1 in inventory; both Phase 6 reproduction pair histories |
| `step-05-full-check-result.json` | 30,233,365 | Repeated checker result; prune/compact candidate after evidence retention | `step-05-check.py`; `step-05-final-verify.py`; `step-05-seam5-batch2-verify.py`; `step-05-seam5-batch3-verify.py`; +10 in inventory; both Phase 6 reproduction pair histories |
| `step-02j-census-maps-portals-prose.json` | 30,138,968 | Accepted census input; preserve dependency before any compaction | `step-02j-packet.py`; `step-02j-probes.py`; `step-02j-replay.py`; `step-02k-probes.py`; +19 in inventory; both Phase 6 reproduction pair histories |
| `step-05-records/tests-judgment-batch7.jsonl` | 29,742,476 | Owning record; retain dependency | `step-05-seam5-batch7-author.py`; `step-05-seam5-batch7-check.py`; `step-05-seam5-batch7-closure.py`; `step-05-seam5-batch7-index.py`; +8 in inventory; both Phase 6 reproduction pair histories |
| `step-02c-census-maps-portals-prose.json` | 28,169,277 | Historical intermediate census; prune candidate after provenance retention | `step-02c-replay.py`; `step-02e-packet.py`; `step-02e-parser.py`; `step-02f-packet.py`; +41 in inventory; both Phase 6 reproduction pair histories |
| `step-02h-census-maps-portals-prose.json` | 19,966,224 | Historical intermediate census; same | `step-02h-packet.py`; `step-02h-probes.py`; `step-02h-replay.py`; `step-02i-defects.py`; +23 in inventory; both Phase 6 reproduction pair histories |
| `step-02i-census-maps-portals-prose.json` | 19,943,786 | Historical intermediate census; same | `step-02i-class4.py`; `step-02i-diff.py`; `step-02i-packet.py`; `step-02i-probes.py`; +113 in inventory; both Phase 6 reproduction pair histories |
| `step-02g-census-maps-portals-prose.json` | 19,939,944 | Historical intermediate census; same | `step-02g-packet.py`; `step-02g-probes.py`; `step-02g-replay.py`; `step-02h-packet.py`; +9 in inventory; both Phase 6 reproduction pair histories |
| `step-02f-census-maps-portals-prose.json` | 19,906,833 | Historical intermediate census; same | `step-02f-packet.py`; `step-02f-probes.py`; `step-02f-replay.py`; `step-02g-packet.py`; +11 in inventory; both Phase 6 reproduction pair histories |
| `step-02e-census-maps-portals-prose.json` | 19,649,575 | Historical intermediate census; same | `step-02e-packet.py`; `step-02e-replay.py`; `step-02f-packet.py`; `step-02g-packet.py`; +8 in inventory; both Phase 6 reproduction pair histories |
| `step-05-records/generators-skills-and-support.jsonl` | 17,130,155 | Owning record; retain dependency | `step-05-probes.py`; `owner-answers.md`; `step-05-seam5-handback.md`; `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-02c-inventory-reconciliation.json` | 16,530,073 | Historical intermediate reconciliation; prune candidate | `step-02e-parser.py`; `step-02f-parser.py`; `step-02g-parser.py`; `step-02h-parser.py`; +5 in inventory; both Phase 6 reproduction pair histories |
| `step-05-records/runtime-judgment-part-29.jsonl` | 16,390,406 | Owning record; retain dependency | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-records/runtime-judgment-part-27.jsonl` | 15,858,862 | Owning record; retain dependency | `review-a38-step-05-final-p02.md`; `review-a38-step-05-s8-p06.md`; `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-records/generators-doc-registry.jsonl` | 15,202,077 | Owning record; retain dependency | `step-05-seam4-field-roles.py`; `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam67-full-check.json` | 15,120,631 | Repeated result; prune/compact candidate | `step-05-seam67-revalidate.py`; `step-05-seam67-seal.py`; `step-05-seam67-verify.py`; `owner-answers.md`; +3 in inventory; both Phase 6 reproduction pair histories |
| `step-05-seam67-pre-final-full-check.json` | 15,119,975 | Intermediate result; prune candidate | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam67-initial-check.json` | 15,105,214 | Intermediate diagnostic; preserve failure evidence before pruning | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam5-b6-closure-recheck.json` | 15,096,671 | Intermediate result; prune candidate | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam5-b6-closure-second-check.json` | 15,087,877 | Failed diagnostic; preserve failure evidence before pruning | `step-05-seam5-b6-review-finalize.py`; `progress.md`; `step-05-seam5-batch7-handback.md`; `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam5-batch7-full-check.json` | 15,083,075 | Duplicate result blob; prune candidate | `step-05-seam5-b6-review-finalize.py`; `step-05-seam5-batch7-closure.py`; `step-05-seam5-batch7-seal.py`; `step-05-seam5-batch7-verify.py`; +2 in inventory; both Phase 6 reproduction pair histories |
| `step-05-seam5-b6-closure-clean-check.json` | 15,083,075 | Same Git blob as preceding row; logical sum is not unique disk bytes | `step-05-seam5-b6-review-finalize.py`; `step-05-seam5-b6-review-verify.py`; `progress.md`; `review-a38-step-08-closure-C.md`; +1 in inventory; both Phase 6 reproduction pair histories |
| `step-05-seam5-b6-closure-initial-check.json` | 15,081,912 | Intermediate diagnostic; prune candidate | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam5-batch7-initial-full-check.json` | 15,079,415 | Intermediate diagnostic; prune candidate | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-00-l12-61-binding-check.json` | 14,830,575 | Historical binding witness; preserve dependency before compaction | `step-00-l12-61-account.py`; `step-04-wave2-packet.py`; `owner-answers.md`; `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-population-dynamic.jsonl` | 14,296,344 | Owning population input; retain dependency | `step-05-check.py`; `step-05-pilot-author.py`; `step-05-pilot-packet.py`; `step-05-seam4-author.py`; +23 in inventory; both Phase 6 reproduction pair histories |
| `step-00-l12-66-binding-check.json` | 13,994,815 | Historical binding witness; preserve dependency before compaction | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam67-proof-full-check.log` | 12,096,327 | Repeated raw proof log; prune candidate after hash/proof retention | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam67-full-check.log` | 12,095,643 | Repeated raw log; same | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam67-initial-check.log` | 12,095,102 | Initial diagnostic log; retain failure evidence first | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam5-batch7-proof-full-check.log` | 12,075,637 | Repeated raw proof log; prune candidate | `progress.md`; `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-seam5-batch7-full-check.log` | 12,072,133 | Repeated raw log; prune candidate | `step-08-phase-08-scorecard.md`; both Phase 6 reproduction pair histories |
| `step-05-head-drift.json` | 10,519,279 | Regenerable intermediate drift list; retain final pins/joins first | `step-05-check.py`; `step-05-final-verify.py`; `step-05-seam8-verify.py`; `owner-answers.md`; +7 in inventory; both Phase 6 reproduction pair histories |
| `step-04-population.json` | 10,018,549 | Population input; retain dependency | `step-04-check.py`; `step-04-l12-60-author.py`; `step-04-l12-60-lib.py`; `step-04-l12-60-scope-check.py`; +10 in inventory; both Phase 6 reproduction pair histories |

### Retired worktrees — track-end cleanup queue, not removal authority

Historical worktree-registration snapshot from L12-122 (not a fresh current registration/status assertion); no status/secret/runtime-file read in other checkouts. Lead confirms no live writer, dirty/unmerged work or later review dependency before removal through the existing authorized door. Do not delete by path/age alone.

| Worktree / branch | Retirement evidence and next action |
|---|---|
| `/home/vantt/projects/forgentX-p8-seam8`, `plan/260925-doc-authority-seam8`, `302575c046adee740430e352ee0399aeddff46b5` | L12-88 merge `3a95653ea` integrated its records; retired author worktree remains registered. Queue cleanup at track end after Lead custody check |
| `/home/vantt/projects/forgentX-s8-review`, detached `9395aa11182d13eb6b9e87c9b0430130350d5e6c` | Step 7 r3 complete, but retain for Step 8/closure proof as needed; retire and clean only after final reviewer releases it |
| Step 3 Doer B tree/branch (historical, no remaining path asserted) | L12-54 explicitly says merged at `a997ae7e6`, worktree and branch already removed; no second cleanup claimed |

Main and this active plan worktree are **not retired**. Other registered Claude/runtime worktrees have no track-specific retirement evidence in this package and are not declared safe to remove; Lead owns any separate inventory/custody decision. Disposable lease rehearsal clone/worktrees were already removed (L12-114), not pending cleanup.

## Owner and Lead decision index — L12-1 through L12-125

One line per existing decision, grouped by work. These are pointers/summaries, not new decisions. Exact authority, reasons, dates, witnesses and supersession scope live in **`owner-answers.md`, heading of the same id**; owner decisions A49/A50/A51 and the accepted lease design remain separately inherited. Doer delivery entries are not re-labelled owner approvals.

### Foundation, scope and prerequisite (1–18)

- **L12-1** — Main merge/conflict and six exception accounting; final A47 conservation retained.
- **L12-2** — Defer 85 drifts/expected red: historical, **superseded by L12-3**.
- **L12-3** — Green binding package before consumers; content-based same-batch rebind, not blind hashes.
- **L12-4** — Fixed pre-cutover SC1 reading; literal post-flip search belongs to Phase 9.
- **L12-5** — Drift scope includes written consumers; refined to exact-file tiers by N4.
- **L12-6** — Git-04 wait/read-only lease direction: **superseded by L12-13**.
- **L12-7** — No legacy specs/architect consumer edits now; exact cutover specs only.
- **L12-8** — Small eventual flip does not authorize early landing.
- **L12-9** — Restore inherited duties; Decision F retires whole gate, no record mode; classifier part later deferred by L12-14.
- **L12-10** — Keep 13 external plan conventions and nine historical references unchanged.
- **L12-11** — Separate real-commit pair accounting; clean committed-byte batch end, no future ids.
- **L12-12** — Proposed classifier effective-B lane: **withdrawn by L12-14**, never executable.
- **L12-13** — Restore owner lease on current Holder-lock/Git doors, no Git-04 wait.
- **L12-14** — Defer classifier/inventory, frozen B must pass; only known dead-vocabulary closing red.
- **L12-15** — Lease-owned registry lock and persistent committed sidecar, no shared lifetime mutex.
- **L12-16** — Lead accepts Step 0: 85/85 rebindings, 138 review joins, committed-byte green.
- **L12-17** — Settle Pilot B rows 16/17; RUL10 carriage/P8-DOC-GAP-01 prose dependency.
- **L12-18** — Lead historically accepts all 47 Step 1 joins at 2/21/24/0; current executable dispositions are superseded by the pinned current table above.

### Inventory, parser and A51 gate (19–29)

- **L12-19** — First census slice review dispositions and corrections.
- **L12-20** — Second census slice review dispositions and corrections.
- **L12-21** — Class-3 systemic parser/mapping defects require regeneration.
- **L12-22** — First regenerated pilot requires second parser round.
- **L12-23** — Second regenerated pilot requires third parser round.
- **L12-24** — Third pilot passes; narrow fixes precede full A50 review.
- **L12-25** — Partial step-02h review requires consolidated parser repair.
- **L12-26** — step-02i seeded rejection; consolidate into step-02j, retain authoring rules.
- **L12-27** — Account main at batch boundary and carry workflow/current-source gaps.
- **L12-28** — Accept class 3 as mechanical inventory under A51, advisory semantics only.
- **L12-29** — Accept classes 4–6 escaped-literal inventory step-02l.

### Per-file authoring and review convergence (30–56)

- **L12-30** — Step 3 pilot rejected; explicit target-resolution/authoring procedure.
- **L12-31** — Pilot r2 18/21 ok; settle remaining target questions.
- **L12-32** — Pilot r3 five outcome defects/494 edges; record-text classes become checker rules.
- **L12-33** — Pilot accepted; scale remaining per-file batches.
- **L12-34** — Wave 1 retiring-tree/unit/Related rules; no pointless retiring-source patch.
- **L12-35** — Wave 1 expansion 6/48 rework; checker computes units/scans.
- **L12-36** — Wave 1 r3 11/13 ok; checker closeout and wave 2.
- **L12-37** — Wave 2 11/13 ok; renamed-alias/live-pointer rules, wave 3.
- **L12-38** — Wave 2 expansion/wave 3 history versus live-boundary rulings.
- **L12-39** — Wave 3 expansion/batch-070 clean; successor and coverage rulings.
- **L12-40** — Captured evidence/self-alias exemption from renamed-alias rule.
- **L12-41** — Batches 071–072 clean review.
- **L12-42** — Batches 073–074 review and required corrections.
- **L12-43** — Batch 075 review clean.
- **L12-44** — Account release/main merge; defer exact overlapping consumer revalidation.
- **L12-45** — Batch-073 full review and batch-076 sample.
- **L12-46** — Completed-action sections count as history regions.
- **L12-47** — Wave 4g review/provenance-line rulings.
- **L12-48** — Account next local-main merge and exact target bindings.
- **L12-49** — Batch-073 re-review/wave 5a outcomes.
- **L12-50** — Owner authorizes parallel remaining Step 3 authoring and Phase 11 direction.
- **L12-51** — Wave 5b/5c and batch-081 expansion; merged checker/rulings.
- **L12-52** — Same-consumer decision narratives versus source-carriage boundary.
- **L12-53** — Wave 5d/5e/5g review outcomes and remaining link/remnant carries.
- **L12-54** — Final author fixes/reviews; Doer B merged/removed; 04967 outcome corrected by L12-55.
- **L12-55** — Final review zero outcome rework; last text/coverage touch-ups.
- **L12-56** — Lead closes Step 3, all future cutover timing, accounting/tests green.

### Source/render preparation and main imports (57–68)

- **L12-57** — Account main, 19 direct plus 128 group-member repairs; Step 4 population refresh.
- **L12-58** — Step 4 stays records-only; deferred source overlaps join final assembly once.
- **L12-59** — Account next main before Step 4 wave 2.
- **L12-60** — Wave 1 review/systemic fixes; seven AGENTS root-pointer outcomes later superseded only by L12-121.
- **L12-61** — Account `dc24ce645`, rebind targets and re-author merged-pin records.
- **L12-62** — Wave 2 review, live-holder/history/wrapped/anchor sweep and expansion.
- **L12-63** — Account `bf5d847c9`, wave 3 rework and exact prompt-golden co-cuts.
- **L12-64** — Lead closes Step 4 at 890 slots, no consumer/source/render edits.
- **L12-65** — Account `3d599d449`, prepare Step 5.
- **L12-66** — Deterministic history witness and `fd126f0c8` main accounting.
- **L12-67** — Account `aa8d34374` and run Step 5 admission pilot.
- **L12-68** — Account `f12d2a505` and preserve affected proof boundaries.

### Behavioral seams and guard decisions (69–91)

- **L12-69** — Pilot rework/window review; owner option B covers 100% admitted references.
- **L12-70** — Account `c8eec31a2`/`080e7ccad`; exact seam overlaps retained.
- **L12-71** — Pilot re-review/generator records; source output versus runtime parity limits.
- **L12-72** — Systemic admission R1–R9, render joins and consumer-specific blockers.
- **L12-73** — Account `0b55288b0` main import.
- **L12-74** — Second source-window review correction closure.
- **L12-75** — Account `e83ca379c` main import.
- **L12-76** — Pinned checker/residual closure and seam-5 batched authoring.
- **L12-77** — R20 cutover-relevance triage, no category-only neutrality.
- **L12-78** — R21 root-anchored neutrality; R22 replay and R23 judgment throughput.
- **L12-79** — Account `4ef05b0b8` main import.
- **L12-80** — Review closure, admission sweeps and next judgment files.
- **L12-81** — Review closure/sweeps; explicit replay-blocked handback, not false green.
- **L12-82** — R25 exact deferred replays and complete seam-5 authoring.
- **L12-83** — Batch-6 review closure and R26 proposed-move reader families.
- **L12-84** — Account `9c5dfe10a`/`8461ef5fc` main imports.
- **L12-85** — Batch-7 closure/compiler/citation authoring under R27/R28.
- **L12-86** — Compiler/citation review closure and exact root/Decision-F evidence.
- **L12-87** — Runtime review closure, R29/R30 and complete Step 5 population.
- **L12-88** — Account main `149f47acc` and seam-8 `3a95653ea` merge separately.
- **L12-89** — Owner requires three same-change replacement documentation guards at cutover.
- **L12-90** — Final review residuals/R31/expanded state sweep; final 370 negative probes.
- **L12-91** — Owner: rule-management writes land after cutover; no reverse dependency.

### Tooling, lease, final-pin assembly and integration (92–121)

- **L12-92** — Owner authorizes Step 6 verifier and Step 6b lease code on plan branch only.
- **L12-93** — Evidence manifest/verifier delivery; subsequent corrections preserve historical claims.
- **L12-94** — Lead accepts current-door lease reuse check/refinements.
- **L12-95** — Evidence verifier independent-review correction closure.
- **L12-96** — Owner accepts family resolution choices Q1/Q2/Q3=A and named handling list.
- **L12-97** — Exact consumer matching-line digests close coarse consumer-drift detection gap.
- **L12-98** — Account `ab3eb83d7`; before proof/table replay and exact committed pairs.
- **L12-99** — Pre-pin deterministic handoff; historical Plan-B draft mislabel later corrected.
- **L12-100** — Separate rejected census rows and compact Step 7 outputs.
- **L12-101** — Account `2cf668766` main import.
- **L12-102** — Lead accepts content rebinds and corrects runner anchor placement.
- **L12-103** — Account `cef806a1e` main import.
- **L12-104** — Initial lease slice delivery, not final accepted production behavior.
- **L12-105** — First adversarial rework; false production-transition closure later corrected by L12-106.
- **L12-106** — Real ScopedCommit transitions, production CLI and exact fail-closed/rollback proofs.
- **L12-107** — Initial execution/Land admission; later boundary/caller corrections govern.
- **L12-108** — Hook cost/filter, owner repair, holder release proof; fresh cutover digests operator-owned.
- **L12-109** — Explicit caller/origin and both Land doors; pure bind, once-per-operation admission.
- **L12-110** — Lease contract/docs delivery with then-pending token diagnostic explicitly disclosed.
- **L12-111** — Repository-bound holder/stray-token diagnostics and receipt-token preservation; docs follow-up.
- **L12-112** — Account `66b637a10`, Identity writer successor/conservation, merge bindings/pairs.
- **L12-113** — Stray main token never grants admission; no automatic pre-existing residue cleanup.
- **L12-114** — Seven-step lease rehearsal passes only in disposable clone; scratch removed.
- **L12-115** — Close Step 6b on branch; three setup bindings repaired; landing/consents retained.
- **L12-116** — Lead capture-buffer-only change for long-history reproduction; no predicate waiver.
- **L12-117** — Account `ad98c3882` hardening import; current lease table and inventory carry.
- **L12-118** — Final-pin member assembly, 54 candidates/2,049 bindings; actual A/B landing and C non-dependency.
- **L12-119** — Complete export-v2 application: 195 new preserves/19 remaining reevaluated parks; bounded parity.
- **L12-120** — First integration correction/single replay; dated split correction 16+16+7, whitelist superseded.
- **L12-121** — Remove role exemption, all-preserve premise proof, ten named patches/nine parks plus 37 further overturns; final 214 parks/226 specs.


### Closing record updates (122–125)

- **L12-122** — Initial scorecard delivery; closure A/C subsequently return rework. Its counts are historical, not current carriage.
- **L12-123** — Both Land doors recheck lease admission through publication; code/race proof on plan branch only.
- **L12-124** — Lead-under-A42 records ruling: rebuild from final records, trace behavioral additions now, move unfinished composition/review to explicit owned Phase 9 PRE-FLIP gates. This rebuilt package does not grant closure/cutover acceptance.
- **L12-125** — Branch suite repair/attribution: artifacts and switchboard fixed, heading-identity liveness green without lost cases, 27 actual historical pairs admitted through existing exception data; native/fixture and clean committed-pair proofs remain blocked, not suite acceptance.

## Next concrete action

Lead reviews the rebuilt 55,658-row/524-spec handoff and named PRE-FLIP assignments, reconciles Review A's one-count source-drift prose discrepancy, runs/fills the full isolated-clone suite and exact main attribution, and accounts the actual runner commit/path pairs in the separate L12-11 Unit. Then run both clean committed-byte recipes/owning tests and start ONE fresh independent A38 closure review. All residual duties are either explicit L12-124 PRE-FLIP gates or pre-close Lead proof; no silent Step 7 carry remains. Phase 8 stays open until these closing proofs and acceptance exist. Owner separately authorizes Phase 9. Markdown preview remains Lead custody under this records-only/no-runtime boundary.
