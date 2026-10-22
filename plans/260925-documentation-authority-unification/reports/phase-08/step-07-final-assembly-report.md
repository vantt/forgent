# Step 7 final-pin records assembly

Pinned source commit: `244a0435466a46e56cd95b4a70bfe03f54670996`. Latest merged main: `9c7edde30` (merge `ad98c3882`).

Final owning-row decisions are applied through the digest-bound overlay, consumed by the matrix. Historical Step 3/4/5 receipts remain unchanged. No consumer edit, authority flip, cutover readiness or independent acceptance is claimed.

## Counts

- `applied-safe`: 0
- `prepared-for-cutover`: 422
- `preserved-history/fixture`: 9611
- `individually parked`: 180
- `rejected-not-consumer`: 36191
- consumer-class rows: 10213 (5,249 ADMIT; 4,964 admission-unspecified)
- rejected rows checked separately: 36191
- blocked row-readiness entries: 602
- patch specifications: 214
- changed-candidate union: 54
- park families: 23; members: 2311
- alias writer violations: 0; checked 51 writer rows against 1559 effective old paths (not the empty adopted alias table)
- rows fitting no class/family: 0

All REJECT rows use `rejected-not-consumer`; every one resolves a non-null value through the matrix custody catalog. `applied-safe` remains in the vocabulary at zero and the assembler stops if a future row lacks applied-edit evidence.

## Output sizes

- `step-07-consumer-cutover-matrix.json`: 3633389 bytes
- `step-07-patch-order.json`: 260715 bytes
- `step-07-readiness.json`: 230731 bytes
- all four generated outputs: 4151018 bytes (limit: < 6000000 bytes)

## Explicit blockers

- `Both stale citations now have exact forward/inverse patches and source digests; pending independent review/application.`: 1
- `Combine CLI pointer hunk with remaining runtime/generator seam hunks; no pilot after-hash certifies a combined file.`: 1
- `Combine doc-sources pointer with generator/runtime quadrant parks only after owning parity; recompute hash.`: 1
- `Compare inherited Step4 knowledge-registry source comment parks against L12-78 P03 dated test-comment preserves. Reconcile provenance treatment at the owner record, never synthesize a new live knowledge-registry holder.`: 1
- `Complete candidate-status and constitution test files perform git init/add/commit in fixtures. They were not filtered or run under the strict no-Git-write worker boundary. Run both complete files before independent acceptance; not an expected-red waiver.`: 1
- `Compose the two hunks over final pin once; recompute full forward/rollback diffs and expectedAfterSha256; rebind and independently review changed binding.`: 1
- `Current registrations.mjs:6382 cites docs/specs/workflow.md RUL-WF-27; docs/platform/workflow/spec.md is absent. Preserve current source until a real conserved successor is bound, not a guessed path rewrite.`: 1
- `Deduplicate identical full test diffs, compose differing hunks once per final-pin test file, preserve every owning assertion.`: 1
- `Digest-bound sole main report reference patch is prepared, not applied or independently accepted.`: 1
- `Entry-by-entry union of docs/specs/reading-map.md into docs/reading-map.md remains uncomposed; L11-25 accepted divergence is not merge proof.`: 1
- `Evaluate park-to-patch candidates against live work-state and runner passages and exact anchors, paired with the eventual runtime contract-reader move. Retain independent missing history/ADR operands; no Step3 reopening here.`: 1
- `Exact supplemental comment patch prepared; compose remaining file hunks and independently review before cutover.`: 2
- `Final semantic join remains for 79 introduced literal and 1158 documentation-cued dynamic inventory sites. Each site is named by class/path/line/expression hash in the current-pin rescan; lexical presence is not an unowned-consumer verdict or an old-ID approval.`: 1
- `In-process header update is present; a digest-bound correction for remaining retired fence wording is now prepared, not applied.`: 1
- `Keep compiler-root and citation/ratchet retirement parity obligations in final assembly; missing current/candidate root-discovery/output and candidate post-delete finding parity remain missing.`: 1
- `Land with Phase 9; Git-owner consent for Git spec section 7 and Holder-lock notification receipt remain owed. Integrated fresh Git scope/ref proof must precede cutover, not trust sidecar drift.`: 1
- `One exported currentPath is absent at the pin: docs/knowledge/how-to-wire-a-skill-to-an-executor-by-purpose-not-by-name/wire-a-skill-to-an-executor-by-purpose-not-name.md. Unchanged path output is not document-existence proof.`: 1
- `Place dynamic-023895 carriage, compose successor scan, and replay dead-vocabulary guard. No expected-red waiver.`: 1
- `Preserve earlier R26 root-retention decisions and live-holder heading assertions when composing retired-corpus tests; no new outcome is authorized by a passing structural checker.`: 1
- `Reconcile exact AGENTS instruction claims claim_5c520fcb1a68ba27e2093341834258c7 and claim_2ae81c7bed935553943d6777b81e2114; do not delete source-to-self residuals. Other 28 A34 residual representations remain governed by their existing acceptance.`: 1
- `Reconcile inherited Step4 JSDoc example at L1784–1792: retiring docs/specs/<area>.md operand parks while docs/decisions/index.md operand preserves. Decide the final truthful scope/home example per operand and compose the whole comment without changing free-text semantics.`: 1
- `Replace inherited templated park descriptions with consumer-specific text for the two byte-identical contract copies. Preserve runtime gateway.rs L1187 and mcp.rs L127 loading custody plus API-client line-number citations; resolve any path move with readers and diagnostics in the same cut.`: 1
- `Resolve each deferred current/candidate replay at final composition before its dependent cutover. Current preserved legacy readers do not prove post-retirement parity.`: 1
- `Step 7 final source/census reconciliation must disposition this legacy-root comment before Phase 9 retirement; no invented frozen id, current code edit or approval carry.`: 1

## Park resolution: all 2,311 members

| Family | Preserve | Patch | Individually parked | Flips |
|---|---:|---:|---:|---:|
| gen-doc-registry | 1318 | 0 | 0 | 1318 |
| gen-enduser-index | 489 | 4 | 13 | 493 |
| gen-decision-index | 78 | 0 | 0 | 78 |
| state-registry-export | 47 | 0 | 11 | 47 |
| state-work-docsref | 53 | 0 | 3 | 53 |
| r26:docs/decisions/index.md | 51 | 0 | 0 | 51 |
| r26:docs/enduser-docs-index.json | 33 | 3 | 0 | 36 |
| readset-post-retirement-scan | 0 | 0 | 31 | 0 |
| state-inventory-oldpath | 30 | 0 | 1 | 30 |
| decision-f-ratchet-retirement | 0 | 0 | 18 | 0 |
| r26:docs/doc-governance.md | 0 | 0 | 17 | 0 |
| gateway-ctr010-contract-citations | 1 | 0 | 16 | 1 |
| citation-convention-and-scan | 0 | 0 | 14 | 0 |
| carry-foundations-and-retired-decision-narratives | 0 | 0 | 13 | 0 |
| carry-knowledge-registry-framework | 0 | 0 | 12 | 0 |
| carry-runner-workstate-doctrine | 0 | 0 | 11 | 0 |
| split-area-holder-mapping | 0 | 0 | 8 | 0 |
| carry-distribution-gateway-claims | 0 | 1 | 7 | 1 |
| r29-native-land-decisions-tree | 8 | 0 | 0 | 8 |
| state-outcome-and-evidence | 3 | 0 | 4 | 3 |
| r26:docs/contracts/fgos-gateway-api-v1.yaml | 0 | 6 | 0 | 6 |
| r26:docs/architecture-manifest.json | 6 | 0 | 0 | 6 |
| r26:docs/architecture-map.md | 0 | 0 | 1 | 0 |

Applied flips: **2131**. Every member, including unchanged parks, has its old/new disposition, original physical record locator, evidence and named remaining blocker/owner in `step-07-park-resolution-applied.json`. Preservation proves the member operand, not full-file generation/parity. Three generated-index families are evaluated separately; complete v2 export closes data gaps, while successor scan/carriage and consumer co-cuts remain explicit. Original v1 rows and v2 reevaluations remain historical inputs; the L12-120 integration overlay is last-write.

## Export v2 and post-move preservation

The Lead export is consumed read-only and never rerun. Its 214 reevaluations promoted 195 preserves and left 19 non-export parks. The existing decision-index generator proves parity only for the state-wins union with the retained committed index, not export-only reconstruction. The export records fgosDir but not the producing codeRoot commit; no missing provenance is invented.

L12-120 rechecks all **9,650** input preserves on a physical scratch copy of the explicit move set through the existing enumerateDocEntries/buildEnduserIndex. **39** become patch: the review's 7 plus **32** additional conditional R28 pointers and gateway runtime/fixture co-cuts (including fixture parent directories). All row IDs, reasons and candidate scan checks are in `step-07-post-move-proof.json` and the exact inputs in `step-07-integration-inputs.json`. No additional park is created. The two legacy duplicate entries disappear; their aliases on surviving knowledge entries remain unchanged. Four generated members are `patch via existing generator`, never hand-edited output.

The enduser test L162/L167 lookup/assertion and L385/L386 frontmatter read are composed ONCE over the source pin, together with the REAL_DEMO_DOC_PATH fixture constant as an atomic co-cut. Forward and rollback diffs, source blob and expectedAfterSha256 are in `step-07-final-prepared-specs.json`; patch-order supersedes the earlier same-file hunk instead of applying both. Owning tests and independent composed-file acceptance remain owed.

All 180 effective parks have member-specific owners and their L12-96 family-plan action in readiness. This overrides the historical v1 catch-all owner catalog, including its 161 parks. Two external locator parks remain separately joined in `step-07-park-resolution-applied.json#externalLocatorReevaluations`; they are outside the 46,404-row census and matrix recordCatalog, not silently counted as members.

## Effective park-family owners

| Family | Park count | Owners |
|---|---:|---|
| gen-enduser-index | 13 | Enduser-index / doc-sources reader owner |
| state-registry-export | 11 | Git / ScopedCommit owner; Knowledge-registry owner |
| state-work-docsref | 3 | Work-state owner |
| readset-post-retirement-scan | 31 | Component-boundary / documentation scan owner; Lead (placement decision) / Component-boundary owner |
| state-inventory-oldpath | 1 | Knowledge migration / inventory owner |
| decision-f-ratchet-retirement | 18 | Documentation ratchet / replacement-guard owner |
| r26:docs/doc-governance.md | 17 | Documentation-governance owner |
| gateway-ctr010-contract-citations | 16 | Gateway / CTR010 contract owner |
| citation-convention-and-scan | 14 | Citation-drift checker / area-spec owners (RULE follow-up is independent) |
| carry-foundations-and-retired-decision-narratives | 13 | Platform-foundations / locked-law holder owner |
| carry-knowledge-registry-framework | 12 | Knowledge-registry owner |
| carry-runner-workstate-doctrine | 11 | Runner owner; Work-state owner |
| split-area-holder-mapping | 8 | Decision-index generator / area-holder mapping owner |
| carry-distribution-gateway-claims | 7 | Gateway owner; Packaging-distribution owner |
| state-outcome-and-evidence | 4 | Work-state / retrospective validator owner |
| r26:docs/architecture-map.md | 1 | Architecture-map / component-boundary owner |

## Current obligations and owners

- **A34-two-line-residual** — blocked; owner: Root-instruction owner / independent A34 reviewer. Reconcile exact AGENTS instruction claims claim_5c520fcb1a68ba27e2093341834258c7 and claim_2ae81c7bed935553943d6777b81e2114; do not delete source-to-self residuals. Other 28 A34 residual representations remain governed by their existing acceptance. Evidence: `reports/phase-06/owner-queue.md:423; phase-09-atomic-platform-authority-cutover.md:31`.
- **L12-96-state-export** — delivered; owner: Lead state-export owner / consumer proof owners. No outstanding prerequisite in this receipt. Evidence: `step-07-state-path-export-v2.json; step-07-export-v2-proof.json; step-07-park-resolution-applied.json#reevaluations`.
- **P7-DOC-GAP-05** — blocked; owner: Lead placement decision / component-boundary owner. Place dynamic-023895 carriage, compose successor scan, and replay dead-vocabulary guard. No expected-red waiver. Evidence: `owner-answers.md#L12-96; reports/phase-07/owner-answers.md#P7-DOC-GAP-05`.
- **P7-DOC-GAP-06** — prepared-for-cutover; owner: Agent-coordination owner / independent promotion reviewer. Both stale citations now have exact forward/inverse patches and source digests; pending independent review/application. Evidence: `step-07-final-prepared-specs.json#stale-assignment-provenance-citation; #stale-execution-budget-citation`.
- **PF-I022-PF-I023** — prepared-for-cutover; owner: Intent-ledger owner / Lead integration reviewer. Digest-bound sole main report reference patch is prepared, not applied or independently accepted. Evidence: `step-07-final-prepared-specs.json#intent-ledger-main-reference-reconciliation`.
- **common-light-Git-fixture-tests** — blocked; owner: Lead in authorized proof environment. Complete candidate-status and constitution test files perform git init/add/commit in fixtures. They were not filtered or run under the strict no-Git-write worker boundary. Run both complete files before independent acceptance; not an expected-red waiver. Evidence: `step-07-final-verification.json#unrunRequiredChecks`.
- **current-census-semantic-join** — blocked; owner: Documentation integration owner / independent census reviewer. Final semantic join remains for 79 introduced literal and 1158 documentation-cued dynamic inventory sites. Each site is named by class/path/line/expression hash in the current-pin rescan; lexical presence is not an unowned-consumer verdict or an old-ID approval. Evidence: `step-07-final-verification.json#censusRescan`.
- **final-pin** — ready; owner: Lead integration owner. No outstanding prerequisite in this receipt. Evidence: `244a0435466a46e56cd95b4a70bfe03f54670996; latest main 9c7edde30 imported by ad98c3882`.
- **holder-lock-status-header** — prepared-for-cutover; owner: Holder-lock owner / independent promotion reviewer. In-process header update is present; a digest-bound correction for remaining retired fence wording is now prepared, not applied. Evidence: `step-07-final-prepared-specs.json#holder-lock-current-header`.
- **plan-a-phase-06** — ready; owner: AGENTS cutover packet owner. No outstanding prerequisite in this receipt. Evidence: `plans/261006-1415-fgos-single-door-mechanisms/reports/main-integration.md; main ancestor a004bb59802016d3ddd63f6b8e430fdfa599d60e`.
- **plan-b-phase-06** — ready; owner: AGENTS cutover packet owner. No outstanding prerequisite in this receipt. Evidence: `archive/plans/261006-1415-fgos-convention-component/phase-06-agents-line.md; main ancestor 461e12d12a2186c53ae2eec0953bcd7cec83192b`.
- **plan-label-correction** — recorded; owner: Lead integration reviewer. No outstanding prerequisite in this receipt. Evidence: `Plan B is convention, archived completed; Plan C plans/261006-1445-fgctl-dev-activation/plan.md is draft/unscheduled and explicitly NOT a cutover dependency (plan.md section 7.5). L12-99/preassembly named Plan C as Plan B incorrectly. The brief repeats that historical mislabel; no draft is falsely reported landed.`.
- **post-census-workflow-holder** — blocked; owner: Workflow owner / documentation migration owner. Current registrations.mjs:6382 cites docs/specs/workflow.md RUL-WF-27; docs/platform/workflow/spec.md is absent. Preserve current source until a real conserved successor is bound, not a guessed path rewrite. Evidence: `step-05-step7-carry.json#earlier-post-census-workflow`.
- **reading-map-entry-merge** — blocked; owner: Documentation-navigation owner / independent entry reviewer. Entry-by-entry union of docs/specs/reading-map.md into docs/reading-map.md remains uncomposed; L11-25 accepted divergence is not merge proof. Evidence: `phase-09-atomic-platform-authority-cutover.md:31; owner-answers.md#L12-112`.
- **registry-preexisting-missing-slot** — blocked; owner: Knowledge-registry owner. One exported currentPath is absent at the pin: docs/knowledge/how-to-wire-a-skill-to-an-executor-by-purpose-not-by-name/wire-a-skill-to-an-executor-by-purpose-not-name.md. Unchanged path output is not document-existence proof. Evidence: `step-07-generator-path-proof.json#registryPathEvidence`.
- **retired-native-land-mechanism** — recorded; owner: Identity / Git owners / integration reviewer. No outstanding prerequisite in this receipt. Evidence: `All eight family members preserve their exact historical identity. Current src/runner/merge.mjs has no nextFreeDecisionId/DECISION_INDEX_PATH: main commit 63b777873c44e8977d16857e80246b043240ed0b removed the numbered-file self-resolver intentionally for identity mint. The final source-binding catalog proves old source bytes and retirement ancestry, not dormant live code.`.
- **step-06b-lease** — delivered-reviewed-rehearsed; owner: Lead / Git owner / Holder-lock owner. Land with Phase 9; Git-owner consent for Git spec section 7 and Holder-lock notification receipt remain owed. Integrated fresh Git scope/ref proof must precede cutover, not trust sidecar drift. Evidence: `owner-answers.md#L12-115; step-06b-rehearsal.md; review-a38-step-06b-final.md (predates O1 follow-up)`.
- **step5-carry:agents-0030-anchor-slug** — resolved-in-records; owner: Lead / final consumer-composition owner / independent integration reviewer. No outstanding prerequisite in this receipt. Evidence: `review-a38-step-05-s8-p01.md; step-07-final-binding-check.json`.
- **step5-carry:earlier-overlap-1** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Compose the two hunks over final pin once; recompute full forward/rollback diffs and expectedAfterSha256; rebind and independently review changed binding. Evidence: `step-05-step7-overlap-list.json (L12-69)`.
- **step5-carry:earlier-overlap-2** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Combine CLI pointer hunk with remaining runtime/generator seam hunks; no pilot after-hash certifies a combined file. Evidence: `step-05-step7-overlap-list.json (L12-69)`.
- **step5-carry:earlier-overlap-3** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Combine doc-sources pointer with generator/runtime quadrant parks only after owning parity; recompute hash. Evidence: `step-05-step7-overlap-list.json (L12-69)`.
- **step5-carry:earlier-post-census-workflow** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Step 7 final source/census reconciliation must disposition this legacy-root comment before Phase 9 retirement; no invented frozen id, current code edit or approval carry. Evidence: `step-05-step7-overlap-list.json`.
- **step5-carry:earlier-seam5-b6-review-closure** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Preserve earlier R26 root-retention decisions and live-holder heading assertions when composing retired-corpus tests; no new outcome is authorized by a passing structural checker. Evidence: `step-05-seam5-b6-review-closure.json`.
- **step5-carry:earlier-seam5-batch7-deferred-replays** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Resolve each deferred current/candidate replay at final composition before its dependent cutover. Current preserved legacy readers do not prove post-retirement parity. Evidence: `step-05-seam5-batch7-deferred-replays.json`.
- **step5-carry:earlier-seam67-closure** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Keep compiler-root and citation/ratchet retirement parity obligations in final assembly; missing current/candidate root-discovery/output and candidate post-delete finding parity remain missing. Evidence: `step-05-seam67-closure.json`.
- **step5-carry:earlier-shared-test-co-cuts** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Deduplicate identical full test diffs, compose differing hunks once per final-pin test file, preserve every owning assertion. Evidence: `step-05-step7-overlap-list.json`.
- **step5-carry:gateway-yaml-consumer-specific-parks** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Replace inherited templated park descriptions with consumer-specific text for the two byte-identical contract copies. Preserve runtime gateway.rs L1187 and mcp.rs L127 loading custody plus API-client line-number citations; resolve any path move with readers and diagnostics in the same cut. Evidence: `review-a38-step-05-s8-p03.md`.
- **step5-carry:gateway-yaml-live-state-runner-holders** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Evaluate park-to-patch candidates against live work-state and runner passages and exact anchors, paired with the eventual runtime contract-reader move. Retain independent missing history/ADR operands; no Step3 reopening here. Evidence: `review-a38-step-05-s8-p03.md`.
- **step5-carry:gateway-yaml-research-split** — resolved-in-records; owner: Lead / final consumer-composition owner / independent integration reviewer. No outstanding prerequisite in this receipt. Evidence: `review-a38-step-05-s8-p03.md`.
- **step5-carry:network-r5-park-to-patch** — prepared-for-cutover; owner: Lead / final consumer-composition owner / independent integration reviewer. Exact supplemental comment patch prepared; compose remaining file hunks and independently review before cutover. Evidence: `review-a38-step-05-s8-p01.md; step-07-final-prepared-specs.json`.
- **step5-carry:registry-source-versus-test-provenance** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Compare inherited Step4 knowledge-registry source comment parks against L12-78 P03 dated test-comment preserves. Reconcile provenance treatment at the owner record, never synthesize a new live knowledge-registry holder. Evidence: `review-a38-step-05-s8-p05.md`.
- **step5-carry:store-comment-block-split** — blocked; owner: Lead / final consumer-composition owner / independent integration reviewer. Reconcile inherited Step4 JSDoc example at L1784–1792: retiring docs/specs/<area>.md operand parks while docs/decisions/index.md operand preserves. Decide the final truthful scope/home example per operand and compose the whole comment without changing free-text semantics. Evidence: `review-a38-step-05-s8-p06.md`.
- **step5-carry:triage-absent-goal-tier-claim** — prepared-for-cutover; owner: Lead / final consumer-composition owner / independent integration reviewer. Exact supplemental comment patch prepared; compose remaining file hunks and independently review before cutover. Evidence: `review-a38-step-05-s8-p03.md; step-07-final-prepared-specs.json`.

## Evidence and limits

- Changed-candidate union is recomputed at the pin: every A47/incoming/imported and Phase 8-edited platform path has a file digest and dual-extractor binding receipt. Missing Session Identity is the explicit Identity section 7a retirement carry; it is not silently dropped.
- `step-07-final-binding-check.json` verifies complete content/ancestry and neighbours, including the doctor-list edits e8e340887/a59ae8b01. No current target drift or rebind is hidden by ordinal rehashing. Historical priorReview snapshots are explicitly excluded, not rewritten.
- Exact forward/inverse supplemental patches prepare gateway input/fixture path changes, the network R5 pointer and truthful triage comment, PF references, holder-lock header and both stale citations. Other file hunks still require final composition and independent acceptance. Existing patch-spec source digests are compared with this pin, with drift left as a per-spec blocker.
- The effective move-set adjustment retains the generated docs/decisions/index.md (L12-96 Q2), enduser manifest and architecture manifest at their fixed paths. It drops the duplicate proposed decisions-index destination and suppresses those retired move proposals; the historical Step 5 move manifest is not silently rewritten. No hand edit of generated output is proposed.
- The v2 export supplies decision fields, inventory role/destination inputs, work/head pins and untruncated acceptance. Registry parity remains bounded rather than full live-state output certification. One registry currentPath remains absent at the pin, owned by the Knowledge-registry owner; unchanged operands are not existence proof.
- Plan A and the actual Plan B/convention landed. The draft is Plan C and is not a cutover dependency; the preassembly mislabel is corrected from committed plans and main ancestry, not from a guessed status.
- Both runs of the final assembler must be byte-identical; `step-07-final-determinism.json` records actual hashes/bytes and verification commands. Pair accounting is performed last; the integration receipt is `step-07-integration-pair-accounting.json`. This turn cannot pre-account its future runner commit; L12-11 requires a subsequent accounting-only Unit.
- `step-07-final-verification.json` records actual light exits: ratchet, doc-link tests, evidence --before and diff check, both main-drift tiers and unchanged protected files. The census was freshly re-enumerated; every introduced literal/documentation-dynamic site is named, with final semantic joining explicitly blocked. Two common-light files are not run because their fixtures write Git; no filtered run or false green.
- No fgOS CLI, Git write, workspace .fgos or secrets read, product docs/code/test/skill/baseline mutation, full npm/cargo suite, live lease or post-cutover proof is performed. Impact analysis is degraded/unqueried under that boundary; no code symbol or graph proof is claimed.


## Final-pin rerun

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-08/step-07-assemble.py --final --pin 244a0435466a46e56cd95b4a70bfe03f54670996 --output-dir plans/260925-documentation-authority-unification/reports/phase-08
```
