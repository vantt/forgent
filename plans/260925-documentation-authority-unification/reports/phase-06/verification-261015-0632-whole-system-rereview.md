# Native registry refresh and bounded re-review handoff

Content pin: `2c228f69c85f3ab3176e71ff3ad9ae2a07603890`. Comparison: `48da12f2b5dedd6d9dd047ffb9c96f9259e20930`. Author: codex-session:41@2026-10-15. Step 6 remains ready-for-review, closure open. Runner produces this artifact commit later; no SHA invented.

Native sync ran once from the persisted working registry, background session and separate polled log. Duration 1188.027s. Persisted compact one-line registry: 60,237,399 bytes, below 90 MB; SHA256 `7fc78e5a5fe832ca37d7469257860690bcf9dc658d0466aa56662c6bcb1e441d`. All prior known IDs survive and full live claim-ID/path/anchor/digest equality passes before and after persistence. All four full candidate-list tuple equalities pass, including statuses: root=830, agent=572, packaging=694, whole=82. Full list union matches scoped E. No stale global green flag is carried.

D with both previous registries: 9 fatal finding(s). Whole-system scoped E with both previous registries remains red: claims-not-reviewed=11, identical-units-multiple-owners=2, candidate-blocks-unreferenced=82. Union-scoped E and per-area results are recorded separately in [native-rereview-verification.json](native-rereview-verification.json). Fatal findings:

- docs/platform/README.md: retired claim claim_15fb4071e9767dd5f80acc30bdee53fa (area-portals) has no vocabulary disposition, so its removal is not recorded
- docs/platform/README.md: retired claim claim_25738169c8abaf752373ce1b1c0732be (cross-area-intentions) has no vocabulary disposition, so its removal is not recorded
- docs/platform/README.md: retired claim claim_ef6c0254e5aadc24f40f019fd8d80810 (cross-area-proposals) has no vocabulary disposition, so its removal is not recorded
- docs/platform/README.md: retired claim claim_f1497619fab3b38741e7a8b5c163a80a (other-architecture-drafts) has no vocabulary disposition, so its removal is not recorded
- docs/platform/README.md: retired claim claim_f323732392f348ef8f622d71f49cb37d (unheaded-block-13) has no vocabulary disposition, so its removal is not recorded
- docs/platform/README.md: retired claim claim_d8aff6d952f0124b500969cdb34f8790 (unheaded-block-14) has no vocabulary disposition, so its removal is not recorded
- docs/platform/README.md: retired claim claim_df4971d4daf3dbb4a99a91a17ca7c5ae (unheaded-block-15) has no vocabulary disposition, so its removal is not recorded
- docs/platform/README.md: retired claim claim_e11d9541dc49ef78a20e7b57d1cccb36 (unheaded-block-16) has no vocabulary disposition, so its removal is not recorded
- docs/specs/runner.md: modified maintained file has exception but digest mismatch (expected 10b2de40c7668c98cf84a93785a7933a280e2fe7683328f97742c09365090e8b, got dcad9c1729e181668f15130635114ed452dd89ba55dd359a8ab416ac6914d564)

## One bounded re-review set

| Request | Entries |
|---|---:|
| [review-request-261015-0607-whole-system-rereview-01.md](review-request-261015-0607-whole-system-rereview-01.md) | 68 |
| [review-request-261015-0625-whole-system-rereview-candidates-01.md](review-request-261015-0625-whole-system-rereview-candidates-01.md) | 80 |
| [review-request-261015-0625-whole-system-rereview-candidates-02.md](review-request-261015-0625-whole-system-rereview-candidates-02.md) | 2 |

The first request contains 68 entries: 17 changed decision rows, 15 portal receipts, four machine classification protocol debts, two pending identical-unit exceptions 27 actual native consequences (six changed, 12 new, one gap, eight retired), and three reconciled optional file-status metadata rows. Those three inherited unrouted values are corrected to actual native candidate status; prior eligibility review is preserved as history and current metadata is pending independent review. All changed rows since the comparison base are covered. The 819 approval-only row changes are retained and are not blanket reopened. Full source/target shown text, full 64-hex unit/shown digests, complete diffs and the 24 mandatory differing pairs for A36 are included. Native list deltas: root 831 → 830 drops the now-bound current manifest; Agent 568 → 572 restores four formal classification debts; Packaging stays 694; Whole 62 → 82 restores 15 portal units pending classification and adds five History frame/wrapper units. The portal Accepted header does not override actual native conservation output. The reverse pack(s) show the full refreshed whole-system candidate-unverified population of 82; no truth approval is invented.

Portal truth evidence includes the corrected complete portal and source authority/authorization evidence, legacy-to-current numbering, stale plan-status table caveat, eight content evidence hashes, full cited spans and recorded command outputs. Fresh authorization reconciliation and current code-blob/output-digest checks pass. This is authored evidence, pending independent acceptance.

All 15 historical receipt refs now pin the actual corrected committed artifact at `2c228f69c85f3ab3176e71ff3ad9ae2a07603890`. Fourteen receipt IDs match current native units. The remaining block's historical ID `claim_afcdab4a068dfd573dfa7ec5a5f21c34` is a real gap; its actual current ID is `claim_2c69afcc45e403c70c550a3934d0443c`. Its complete successor receipt proposal is shown for review, with no identity graft, approval carry or invented successor artifact commit. Source/gap decisions and receipt content were not edited. Five moved carriage IDs retain identity; eight old carriage IDs remain retired with current carrier witnesses shown in the same pack.

Four A31 accepted machine refs retain prior truth evidence and ordinary reports; those reports lack the separate formal classification receipt headers/tables. This debt is explicit. The two contextual multi-owner exceptions remain pending, with exact members, full text and ancestry. No membership is waived.

Each request states: Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. Author has not created or selected that pack/key. No new owner question is introduced.

## Verification and remaining closure

Tests use env -u CLAUDE_CODE_SESSION_ID: initial 53/54 (fixture mutation selection reported insufficient eligible rows for deleted-list-item), isolated retry 1/1, complete confirmation 54/54. No fixture or production edit. Three inherited optional authorityStatus metadata values were stale (unrouted versus actual candidate); corrected on the list, previous eligibility review archived, current metadata pending in the bounded pack. An initial post-persistence scratch helper treated optional legacy fileStatus metadata as a native tuple field, although native rows do not emit it; verification was corrected to the real tuple contract and every supplied optional status was independently checked against pinned headers/constitution/native authority status, with no ID or digest drift and no checker change. Candidate-status zero findings; placement 537/536/one existing exception; A has the same eight historical observations and zero new violations; B/C/I and protected hashes pass. No docs byte, decision content, protected tool, vocabulary, baseline or workspace .fgos mutation; no secret read, git write, full-suite/current-truth certification, promotion or Step 7. Scratch remains /tmp/fgos-work/. Markdown preview unavailable within the authorized scope.

- Independent bounded review of this request set, including all changed rows, portal truth receipts, two contextual exceptions and native consequences.
- Authorized writer applies independently reviewed vocabulary dispositions for eight actually retired portal-carriage IDs; current D reports retired-row-disposition-missing for all eight, with full proposed supersede relations shown only in the request.
- Apply the native block receipt successor proposal using actual claim_2c69afcc45e403c70c550a3934d0443c, commit it and then bind its real receiptCommit; historical claim_afcdab4a068dfd573dfa7ec5a5f21c34 remains a gap. No synthetic pin or acceptance.
- Resolve four A31 formal classification report/header/table debts; ordinary machine equivalence does not itself certify truth.
- Authorized owner handles existing runner ratchet digest mismatch outside this producer write scope.
- Reviewer-selected 30-unit truth sample, with >10% false escalated; zero open Critical/High red-team findings or explicit owner acceptance.
- Reviewer-selected stratified 50-block sample (20 unnamed, 20 rewritten rationale, ten random).
- Commit fresh-reader key, then two independent fresh readers for three scenarios; do not claim instruction-only isolation.
- Closing checkpoint review with sensitivity pack held by reviewer; author never creates or selects that pack/key.
- Consumer/link rewrite and alias preview, final both-prior/scoped/native proofs, final batch/effort report and owner effort checkpoint.
- Preserve Rings holds, A34 residuals, owner queue and all remaining truth/navigation/promotion/alias/consumer/native-gap/cutover debts. No Step 7 or promotion.

Full command logs, native proofs, source helpers, exact request hashes and reconciliation evidence: [native-rereview-verification.json](native-rereview-verification.json).
