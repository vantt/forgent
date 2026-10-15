# Proposals and redesigns batch report

## Current native checkpoint

Date: 2026-10-15. Assignment: unit-run-1792040421980-b4e79fd1/producer/1. Content pin **d39fe9033928edc45d03a56e66a2d9949cfc4bdb**; comparison base **f5ca5d9e73b46d31bebf81e8e1cada96d022a09c**. Read progress first and wrote it early. This checkpoint supersedes the next-native-sync and stale predecessor-list wording below. **Step 7 remains open for independent bounded verdicts and their committed application.**

One background native sync, polled own log: **693.797s**, **4432 files / 90099 claims**. Known IDs **97756 → 97757**, zero loss; active native tuples equal persisted registry. Compact one-line registry **61217378 bytes (<90 MB)**, SHA256 b5b11092ccd69cf70bda295c50c614fb5d76a9b18440ae2ca6df3aa68ef96e54, byte-equal to native scratch. One actual successor plus explicit predecessor gap; zero retired, no identity graft or approval carry.

**D both priors together and each separately: zero fatal (3/3).** Scoped strict **E: exactly 190 pending source rows / 3 identical-owner groups / 665 candidate-unverified tuples**, zero structural fatal (3/3); E is open, not strict green. Complete duplicate member/owner equality and all-three-E/native/list five-field tuple equality pass. Earlier lists plus Step 7 cover current native namespaces exactly; no prior tuple lost. Unchanged **1,625 source approvals** and **664 eligibility observations** retain exact notes/pins; the new native successor is pending.

One request: [review-request-261015-1205-proposals-redesigns-bounded-rereview-d39fe9033.md](review-request-261015-1205-proposals-redesigns-bounded-rereview-d39fe9033.md), **198 entries** (190 source, 4 triage, 1 actual successor eligibility, 1 full reverse list, queue/report 2). Includes all full before/after text and decisions since f5ca5d9e7, full digests, all fix evidence, unchanged disposition audit and A36 deep-read lists. Source corrections: file 12 27, file 15 8, file 18 154, file 6 1. A36: read all 190 changed rationales, independently seed/sample at least 11/72 Weak-exact/Judgment, plus 14 differing pairs and all 27 file-12 rows after prior escalation; zero absent targets. Producer supplies no seed/draw/verdict.

Proof: [verification-261015-1205-native-bounded-rereview-d39fe9033.md](verification-261015-1205-native-bounded-rereview-d39fe9033.md) and full raw-result/reproduction sidecar; native log alongside. Relevant tests **59/59 pass**, env -u CLAUDE_CODE_SESSION_ID, zero fail/cancel/skip/todo. All workspace writes stay under this plan; scratch only /tmp/fgos-work/. No docs/decision/checker/extractor/vocabulary/baseline edits, .fgos workspace writes, git writes, lifecycle verbs or secrets read. Checkout Rust convention names used; preview tool unavailable. No needsWrites.

**Next turn:** Lead independently reviews exactly this bounded 198-entry request pinned to d39fe9033 and commits ordinary source verdicts plus separate triage/list/accounting verdicts. Then an authorized Doer applies committed verdicts through unchanged channels, preserving notes/pins, rebinds only changed evidence without approval carry, and verifies settled D/E/native/list proof. Source/eligibility/triage/accounting channels never substitute for each other. Step 7 closes only after bounded acceptance, application and settled proof with expected open lists explicitly accounted. No Step 8, promotion, strict-global-E green or cutover is claimed. Preserve all earlier Rings holds, A34 residuals, fresh-reader/truth limitations, token-total checkpoint and promotion/navigation/consumer/alias obligations.

---

## Historical verdict-application checkpoint (superseded where noted above)

## Current checkpoint — 2026-10-15

**Step 7 remains open for one bounded independent re-review and the next native sync.** Assignment: `unit-run-1792039975351-ac5d331e/producer/1`. Input and independent-report pin: **f5ca5d9e73b46d31bebf81e8e1cada96d022a09c**. The runner supplies the output commit after settlement. No output SHA is invented. This report supersedes earlier Step 7 15/5 splits and all-pending statements; prior evidence stays historical.

### Verdict application and A22 corrections

Read Notes in all **37 committed ordinary reports**. Applied **1,788 ok source verdicts** through unchanged `applyReviewVerdicts`, with verbatim notes, actual reviewer identities and report pin f5ca5d9e7. **Zero application refusals**: the applier accepted the source-01-01 rows despite its header naming ...40d90d09 and the rows naming correction session ...eb65d2cd. No header or authoredBy was rewritten to obtain acceptance. The requested refused-row list is therefore empty. The **27 source-12-01 reworks** stayed pending.

Rebound **190 source rows**, all pending with no approval carry: **27 file 12 rationales + 8 file 15 rationales + 154 file 18 rationales + 1 file 6 H1 section**. Their complete before/after decisions and former review metadata are in [application and verification accounting](step-07-report.md.json); each changed row also preserves its prior review as history. **1,625 source approvals remain valid**. No source text was edited this turn.

- File 12 now names live file 11's status-pointer link at source `docs/architect/proposals/coordination-envelope-probe-contract.md:17` / carrier `docs/platform/proposals/coordination-envelope-probe-contract.md:44`, alongside files 9, 10 and 13. Rationales, file-level evidence, triage and owner queue also name `docs/platform/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md:11`, whose old `docs/platform/proposals/coordination-envelope-progress.md` destination is absent. This is queued for the navigation owner; historical placement stands.
- File 6's labelled Added paragraph explicitly names the two already-authorized A19 section-17 pointer corrections: `domains/coding/skills/fgos-coding-knowledge/SKILL.md` and `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`. It no longer describes link destinations as the sole change. Only this paragraph changes in docs this turn; H1's section digest and the candidate-native paragraph binding are pending under A22.
- File 15 neutrally states that the source README snapshot lists **6 of 14 directory entries**, all six carried in full. The loss-language trigger is removed from all eight rationales and matching file-level evidence. No text was lost; no partial-carry or checker change is used to bypass the gate.
- File 18 cites `docs/architect/proposals/step-10-coding-domain-adoption.md:18,167–172,206–217` for A0/facade work, replacing 18,93–110 in every rationale, file evidence and triage row.

Triage acceptance is separate: **18 ok / 2 rework** originally; after the two fixes and the file 15/18 evidence corrections, **16 accepted / 4 pending** (6,12,15,18). The **34 index verdicts** and all **666 candidate-list verdicts** are recorded in their own channels, not source or truth approvals. Candidate eligibility now retains **664 approvals**, with the changed paragraph's one predecessor observation pending native reconciliation and re-review. Original independent reports, request/pack bytes and shown hashes are untouched.

### Counts, ownership and legal dispositions

**20 sources / 1,815 rows; 16 candidate carriers / 4 archives; zero deletion requests or unknown owner decisions.** Archives are file 3 in Documentation history and files 12,14,17 in Agent Coordination history. Four frozen-map overrides are explicit; file 11 returned to its original live proposal target. Source kinds and file classes are distinct: the vocabulary gate constrains the source file class, not the candidate header's Canonical field.

The unchanged `validateAgainstVocabulary` accepts **all 20 actual source classifications and file dispositions**, zero findings. In particular, files **1–6 are maintained-authority**, so `move` is legal for their source classes, including file 3's archive. Files 7–20 are retained-source; eleven live sources use whole-unit `supersede`, three archives use `archive-with-reason`. No disposition switch was required. File 6 already has two `supersede` rows for its A19 correction and heading consequence. Total row dispositions: **844 move / 900 supersede / 71 archive-with-reason**. Exact-carry classes remain **1,289 Unit-exact / 438 Weak-exact / 88 Judgment**; none is a promotion truth receipt.

| File | Source basename | Rows | File disposition | Reviewed / pending rows |
|---|---|---:|---|---:|
| 1 | `dispatch-control-plane-redesign.md` | 7 | move | 7 / 0 |
| 2 | `documentation-system-design.md` | 129 | move | 129 / 0 |
| 3 | `documentation-system-discussion.md` | 214 | move | 214 / 0 |
| 4 | `doing-coordination-redesign.md` | 233 | move | 233 / 0 |
| 5 | `README.md` | 66 | move | 66 / 0 |
| 6 | `knowledge-registry-redesign.md` | 197 | move | 196 / 1 |
| 7 | `architecture-advisory-panel.md` | 119 | supersede | 119 / 0 |
| 8 | `component-authority-boundary-map.md` | 99 | supersede | 99 / 0 |
| 9 | `coordination-capability-envelope.md` | 92 | supersede | 92 / 0 |
| 10 | `coordination-dispatch-contract.md` | 49 | supersede | 49 / 0 |
| 11 | `coordination-envelope-probe-contract.md` | 28 | supersede | 28 / 0 |
| 12 | `coordination-envelope-progress.md` | 27 | archive-with-reason | 0 / 27 |
| 13 | `coordination-worker-provider-boundary.md` | 37 | supersede | 37 / 0 |
| 14 | `group-thinking-plan-loop.md` | 40 | archive-with-reason | 40 / 0 |
| 15 | `README.md` | 8 | supersede | 0 / 8 |
| 16 | `step-09-group-thinking-substrate.md` | 93 | supersede | 93 / 0 |
| 17 | `step-09-step-10-replan-handoff-prompt.md` | 4 | archive-with-reason | 4 / 0 |
| 18 | `step-10-a0-coding-domain-boundary-facade-plan.md` | 154 | supersede | 0 / 154 |
| 19 | `step-10-coding-domain-adoption.md` | 96 | supersede | 96 / 0 |
| 20 | `visibility-and-interactive-contact-herdr-spawn.md` | 123 | supersede | 123 / 0 |

### Review rounds, samples and limits

One completed all-row ordinary round at f5ca5d9e7: **34 source reports / 1,815 verdicts / 1,788 ok / 27 rework / 0 hold**, **1.49% row rework**. All 27 reworks are one shared rationale omission in file 12, with conservation intact. Separate triage: **20 verdicts / 18 ok / 2 rework**, **10% file rework**. Index: **34 ok**. Candidate eligibility: **666 ok** (665 tuple rows plus one list row). Across those distinct channels: **2,535 verdict occurrences / 2,506 ok / 29 rework**, **1.14% occurrence rework**. This aggregate is not the A36 deep-read denominator. The next bounded round has not happened; this producer supplies no verdicts for its own corrections.

A36: mechanical checks cover all rows; independent seeded deep samples cover at least 15% of Weak-exact/Judgment, minimum ten per pack or all when smaller, with all **88 differing-digest pairs** mandatory and zero absent targets. The committed reports preserve seeds, drawn IDs and mechanical/deep scope; the earlier request's all-Weak/Judgment-deep wording is superseded by A36. Source 12 reports **10/10 sampled deep rows rework**, triggering >3% escalation. Its reviewer discloses whole-file bidirectional reconstruction and rationale-skeleton checks over all 27, rather than claiming individual text deep reads of the other 17. The bounded re-review must read every changed rationale; the 190 rows are not waived by the batch-wide rate.

[Truth draw](review-7-proposals-truth.md) at **4ee263d09**: **1/30 false units (3.33%)**, **2 false path sentences**, both in one section-17 block; 25 present-implementation assertions in six drawn units, population 1,095 body units. Both pointers were corrected at 0f063d18f and checked by the ordinary file-6 reviews; this turn labels those corrections. Headers were excluded; 24/30 drawn units were proposals, plans, normative text or labels. Full current-truth review remains owed at promotion. No rerun or blanket truth acceptance is claimed.

[Red-team/block draw](red-team-7.md) at the original carriage: **0/50 defective blocks**, no detected lost source lines or unlabelled additions. The draw does not certify every sentence. Red-team's historical 84 differing pairs and 15/5 split predate the correction's **88 pairs / 16/4 split**; denominators are not silently mixed.

### Fresh readers and area gaps

[Fresh-reader evidence](fresh-reader-261015-proposals.md) passed all six reader/scenario cells under its scoring: **32 yes / 4 partial / 0 no**, **0/57 missing anchors**, zero legacy-as-authority answers, at most five files before first acceptable owner. Readers read **f060a66fc**, before the R7 history moves; **those moves changed placement only**. Their answers still name former system-architecture history destinations and an archived probe. The run is historical navigation evidence, not certification of the final R7 content/dispositions or this turn. Reader 1 opened two out-of-scope fragments, so its literal scope criterion failed despite no observed answer effect. Key/scoring share an author; instruction-only isolation remains **UNPROVEN**. Large files were read in ranges.

Preserve these area gaps for promotion/navigation work:

- The live proposals index lists **6 of 12 candidate carriers**. Missing entries include worker/provider boundary, dispatch contract, doing-coordination, knowledge registry, Step 10 A0 facade and visibility/herdr-spawn. This differs from the legacy README's **6 of 14 directory-entry** fact above.
- No proposals/redesigns switchboard row, including `docs/architect/proposals/**`; routing relies on topic rows and candidate headers.
- No resolved registration target for a new cross-area proposal; the platform portal links the unification proposal rather than a collection entry.
- Governance's authority matrix has **no Proposal row**; type-table and scratchpad constraints are available, while required proposal sections are buried in candidate design §6.7.
- No in-scope current plan-loop owner, stale legacy links, brittle extractor-numbered anchors, and reader-misquoted switchboard ordinals remain disclosed. Navigation success grants no current-truth or classification approval.

### Red-team-7: fixed, accepted and owed

Original hostile review: **0 Critical / 0 High / 2 Medium / 4 Low**, DONE_WITH_CONCERNS.

| Finding | Fixed / accepted / owed |
|---|---|
| R7-1, false file-11 engine-retirement premise | **Fixed and ordinary-accepted**: live Assignment/Run probe retained at the original target, 28 source rows accepted. No CoordinationSession/FlowDefinition rationale remains. Its link to historical progress is now queued through the pending file-12 correction. |
| R7-2, history owning area and map overrides | **Fixed and accepted**: files 12/14/17 moved to Agent Coordination history; file 3 stays Documentation history; four map overrides and reasons recorded. File 12's 27 revised rationales await bounded acceptance. Q3 mapped-source interpretation is the Lead's recorded decision; no new owner waiver is asserted. |
| R7-3, wrapped-label Dispatch link | **Fixed and ordinary-accepted**: original legacy referent restored, physical rebases total **99**. Cutover repoints remain owed. |
| R7-4, pointer's inline-code paths | **Fixed and accepted as accounting**: all three inline-code paths queued; the carrier explicitly says pointer. Runner's line-specific citations must target the full proposal. Actual consumer rewrites are owed. |
| R7-5, ten hot archived sections | **Fixed and ordinary-accepted**: all ten have individual liveness notes; two probe sections remain current, eight historical. Raw scan hits/input hashes preserved. |
| R7-6, process chatter in Added paragraphs | **Fixed and ordinary-accepted** in the five named carriers; source-20 rationale's residual “input report” wording stays a disclosed nonblocking stable-record observation. File 6's newly explicit correction label awaits bounded review. |

No changed component boundary. No new mechanism, alias activation, consumer edit, deletion or promotion.

### Reverse list, repoints and native proof

[Candidate list](candidate-unverified-proposals-redesigns.json): **665 native five-field tuples**, comprising **60 new labelled Step 7 wrapper units + 605 byte-equal duplicates of earlier Agent and Root eligibility tuples**. The checker's three-segment owner prefix expands the native namespace into those existing areas. These are duplicate list observations, not duplicate new content; Packaging and Whole-system lists do not overlap. All 665 tuple verdicts and the list verdict were ok at f5ca5d9e7. Content status stays `candidate-unverified` after eligibility approval. The 33 carried “Canonical for” lines remain a promotion obligation.

One labelled paragraph changed this turn. Its actual native predecessor ID/path/anchor/digest/status tuple is retained pending reconciliation, with old and current local digests explicit; **no successor ID is guessed and no eligibility approval carries**. List-level review returns to pending; 664 unaffected eligibility approvals remain. Prior `nativeEquality` records refer to 0f063d18f and are historical. The next single native sync must reconcile any real successor/gap, preserve all known IDs and establish fresh equality; this turn does not claim full current native equality.

[Owner queue](owner-queue.md) retains all earlier repoints and adds:

- Live files 9:13, 10:13, **11:17 / carrier 44**, and 13:12 → the dated progress carrier under `docs/platform/agent-coordination/history/proposals-redesigns/`.
- `capability-fit-2026-09-06.md:11` → the same history carrier; its former platform proposals destination is absent.
- `docs/specs/runner.md:1273,1277–1278` → the full Agent Coordination redesign proposal, not the same-basename pointer.
- Documentation design Related lists at source :16 / carrier :40 → Documentation discussion history.

Keep file 9:388 and file 13:11 → **live** probe, file 1's three inline-code destinations, legacy Markdown paths, code-comment consumers, and generated knowledge-skill source/render handling in the later reviewed navigation/cutover pass. No consumer is rewritten here.

Last full native proof at 0f063d18f: **4,432 files / 90,099 claims; 97,756 known IDs; zero known-ID loss**, compact persisted registry 61,337,223 bytes. Prior D had eight README loss-language fatal findings; scoped strict E also had 1,815 pending source rows, three identical-unit owner groups and 665 candidate-unverified tuples. These are historical pre-application results, not current E counts.

This turn's scoped replay of unchanged `applyDecisions` and `validateAgainstVocabulary` has **zero application / vocabulary findings**, including zero loss-language findings. All **1,815 current local target digests and ancestries** match their decisions; all **1,625 retained source notes and report pins** validate exactly. It reconstructs only the scoped ledger from committed full-text packs and verifies source units against production extraction; it is **not native D/E**. Gates, checker, vocabulary, extractor, baselines, frozen inputs and working registry are unchanged.

Relevant existing tests: `env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-review-format.test.mjs test/scripts/doc-decision-review.test.mjs test/scripts/doc-review-authorship.test.mjs test/scripts/doc-decision-conservation.test.mjs`: **59/59 passed**, no failures/cancel/skip/todo. Full test output and replay helper sources are retained in the accounting sidecar. No full suite or installed-release claim. No full native registry sync or new review pack was run or authored.

### Next bounded closure

At this turn's actual runner commit, run **one native sync**, then D against both priors together and each separately, scoped strict E, full known-ID/native tuple equality, exact duplicate-owner membership and reverse-list equality. Persist the real native result once; account the changed paragraph's real identity consequences without a graft or approval carry.

Package **one bounded independent re-review** of the **190 changed source rows**, triage files **6/12/15/18**, changed Added paragraph/native successor or gap/list consequence, owner-queue additions and this report. Include every affected row and actual native binding; all changed rationales must be read. Unchanged 1,625 source approvals and 664 candidate eligibility observations retain their exact accepted evidence. Apply committed bounded verdicts and verify D/E/equality against the settled tree. **Step 7 closes after that bounded re-review and native proof pass with expected open data explicitly accounted**; strict E green, global promotion and cutover are not implied.

Keep Rings holds, A34 residuals, owner token-total checkpoint, global candidate/gap debt, full truth/promotion review, singleton/reading-map reconciliation and consumer/alias/navigation/cutover work. Owner effort and token totals remain unreported; no throughput claim is invented. Markdown preview tools are unavailable in this session; installed `fgos convention` also cannot resolve an installation in this worktree, and the Node compatibility entry delegates convention to Rust. The assignment-specified report/progress paths are used; no install or external preview state is changed.
