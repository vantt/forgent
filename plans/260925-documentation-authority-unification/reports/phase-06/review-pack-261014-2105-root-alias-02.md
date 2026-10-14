# Committed-content conservation review: root-alias-02

Author session: codex-session:24@2026-10-14
Decision author: codex-session:23@2026-10-14
Content commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Entries: 75
Review status: pending

All shown source, target and decision bytes are bound to Content commit above, except explicitly pinned historical predecessors. This is a review of pending dispositions/navigation/accounting, without truth certification or authority promotion. Existing accepted source decisions are evidence only. Historical short digest fields in quoted accepted decision JSON stay verbatim; the full independently recomputed 64-hex native and shown digests accompany every unit. Each stored target prefix is checked for a unique native match in its owner, with the actual anchor checked separately.

## root-authorities-draft-0076

Entry kind: alias-accounting
Class: Judgment
Source digest: e5aec62d393c0201df912b76467125999b27d5b466327e3dd73991287a251386
Target digest: 5a8bd90404bdc7021a6d3ba75882493b6331b3d3640224d7e3e654c07cf523ad

```json
{
  "aliasId": "root-authorities-draft-0076",
  "fromPath": "docs/specs/work-state.md#khai-việc-add-bề-mặt-nội-bộ",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "add-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-rework2.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0076",
  "claimId": "claim_b7cdc84d6130cac22511eed0ed6e4e6c",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "khai-việc-add-bề-mặt-nội-bộ",
  "sourceUnitDigest": "e5aec62d393c0201df912b76467125999b27d5b466327e3dd73991287a251386",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "add-verb",
  "targetUnitDigest": "5a8bd90404bdc7021a6d3ba75882493b6331b3d3640224d7e3e654c07cf523ad",
  "targetBrowserAnchor": "add-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-rework2.md",
  "reviewReportCommit": "9f087f37d134366bd2057af2fac831ed18a9b3c3",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#khai-việc-add-bề-mặt-nội-bộ`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e5aec62d393c0201df912b76467125999b27d5b466327e3dd73991287a251386
Shown text SHA256: cb5ede9e3bddf2804629145add5b14a69cc7e1c9b4c67a617badff7f2676b529

```text
### Khai việc (add) — bề mặt nội bộ
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#add-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5a8bd90404bdc7021a6d3ba75882493b6331b3d3640224d7e3e654c07cf523ad
Shown text SHA256: d7d979cd69dc5db1834d0529d0173d6becd455840fcb9fba6505d9b25e92c4b9

```text
### Add Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Khai việc (add) — bề mặt nội bộ
\ No newline at end of file
+### Add Verb
\ No newline at end of file
```

### Existing decision evidence: claim_b7cdc84d6130cac22511eed0ed6e4e6c

```json
{
  "claimId": "claim_b7cdc84d6130cac22511eed0ed6e4e6c",
  "sourceUnitDigest": "e5aec62d393c0201",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "add-verb",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 833 is carried as the frozen target heading \"Add Verb\" (anchor add-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. Authorized A35 correction changes the whole target unit; A22 requires independent re-review, with no approval carried. Full original source, previous target and corrected target are shown; the false clauses are replaced by code-backed facts. The current U8/RUL60 fragment is corrected to the exact required fields/live wrapper ordering under A19; A22 real target digest and ancestry are rebound, no approval carries.",
  "authoredBy": "codex-session:22@2026-10-14",
  "reviewNote": "deep: heading Khai viec (add) to Add Verb, H3 both, ancestry equal, anchor add-verb exists; the heading digest binds the section body so it moved to 5a8bd904 only because of the two corrected fragments; rebound digest equals the file at HEAD.",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-rework2.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "5a8bd90404bdc7021a6d3ba75882493b6331b3d3640224d7e3e654c07cf523ad",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "9f087f37d134366bd2057af2fac831ed18a9b3c3"
}
```

Complete native source: `docs/specs/work-state.md#khai-việc-add-bề-mặt-nội-bộ`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e5aec62d393c0201df912b76467125999b27d5b466327e3dd73991287a251386
Shown text SHA256: cb5ede9e3bddf2804629145add5b14a69cc7e1c9b4c67a617badff7f2676b529

```text
### Khai việc (add) — bề mặt nội bộ
```

Complete native target: `docs/platform/work-state/spec.md#add-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5a8bd90404bdc7021a6d3ba75882493b6331b3d3640224d7e3e654c07cf523ad
Shown text SHA256: d7d979cd69dc5db1834d0529d0173d6becd455840fcb9fba6505d9b25e92c4b9

```text
### Add Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Khai việc (add) — bề mặt nội bộ
\ No newline at end of file
+### Add Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0077

Entry kind: alias-accounting
Class: Judgment
Source digest: 8bd05d09e2083e072a7c666de0d7d1d8399c2255f96cc4c22ead81c72bd2ff69
Target digest: efb90fe882b0fbb11659db82440c3c004cbdd1006bb240abbadc2b2404773ee1

```json
{
  "aliasId": "root-authorities-draft-0077",
  "fromPath": "docs/specs/work-state.md#nộp-vấn-đề-tự-do-submit",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "submit-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0077",
  "claimId": "claim_bf41e5090dd12c430e3a55206ea11658",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "nộp-vấn-đề-tự-do-submit",
  "sourceUnitDigest": "8bd05d09e2083e072a7c666de0d7d1d8399c2255f96cc4c22ead81c72bd2ff69",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "submit-verb",
  "targetUnitDigest": "efb90fe882b0fbb11659db82440c3c004cbdd1006bb240abbadc2b2404773ee1",
  "targetBrowserAnchor": "submit-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#nộp-vấn-đề-tự-do-submit`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 8bd05d09e2083e072a7c666de0d7d1d8399c2255f96cc4c22ead81c72bd2ff69
Shown text SHA256: d475e6e6dd7cd83c43f04d3b12b4845f2ff109c724d0f2353256f49c0d5eb561

```text
### Nộp vấn đề tự do (submit)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#submit-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: efb90fe882b0fbb11659db82440c3c004cbdd1006bb240abbadc2b2404773ee1
Shown text SHA256: fba00ca8d2e6c8e8e0e1d972a9d2eca799f1ecd16c36412d7208afce3ae56299

```text
### Submit Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Nộp vấn đề tự do (submit)
\ No newline at end of file
+### Submit Verb
\ No newline at end of file
```

### Existing decision evidence: claim_bf41e5090dd12c430e3a55206ea11658

```json
{
  "claimId": "claim_bf41e5090dd12c430e3a55206ea11658",
  "sourceUnitDigest": "8bd05d09e2083e07",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "submit-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 857 is carried as the frozen target heading \"Submit Verb\" (anchor submit-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Nộp vấn đề tự do (submit)' (src line 857) to 'Submit Verb' (target line 729): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "efb90fe882b0fbb11659db82440c3c004cbdd1006bb240abbadc2b2404773ee1",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#nộp-vấn-đề-tự-do-submit`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 8bd05d09e2083e072a7c666de0d7d1d8399c2255f96cc4c22ead81c72bd2ff69
Shown text SHA256: d475e6e6dd7cd83c43f04d3b12b4845f2ff109c724d0f2353256f49c0d5eb561

```text
### Nộp vấn đề tự do (submit)
```

Complete native target: `docs/platform/work-state/spec.md#submit-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: efb90fe882b0fbb11659db82440c3c004cbdd1006bb240abbadc2b2404773ee1
Shown text SHA256: fba00ca8d2e6c8e8e0e1d972a9d2eca799f1ecd16c36412d7208afce3ae56299

```text
### Submit Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Nộp vấn đề tự do (submit)
\ No newline at end of file
+### Submit Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0078

Entry kind: alias-accounting
Class: Judgment
Source digest: 341f740a8ac765ef5377b8e2370b9d809e54887db271ad1fa2d7c79e9d2a8637
Target digest: f33a86417aeeb82bb3127686df99ed16ed2b3c30f4ebb6f10272dc8e99885111

```json
{
  "aliasId": "root-authorities-draft-0078",
  "fromPath": "docs/specs/work-state.md#chạy-context-discovery-discover",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "discover-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0078",
  "claimId": "claim_bee83aee35ec25ec87d88a57a984cf50",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "chạy-context-discovery-discover",
  "sourceUnitDigest": "341f740a8ac765ef5377b8e2370b9d809e54887db271ad1fa2d7c79e9d2a8637",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "discover-verb",
  "targetUnitDigest": "f33a86417aeeb82bb3127686df99ed16ed2b3c30f4ebb6f10272dc8e99885111",
  "targetBrowserAnchor": "discover-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#chạy-context-discovery-discover`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 341f740a8ac765ef5377b8e2370b9d809e54887db271ad1fa2d7c79e9d2a8637
Shown text SHA256: 72a8b116c4392718f804e5b90830bc06cc77b6373a0aab29b0843b31e070750f

```text
### Chạy context-discovery (discover)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#discover-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f33a86417aeeb82bb3127686df99ed16ed2b3c30f4ebb6f10272dc8e99885111
Shown text SHA256: 6f331300e6f6533a33b2265c78343c05eee213ce9facf069433c2a830ecf58fd

```text
### Discover Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Chạy context-discovery (discover)
\ No newline at end of file
+### Discover Verb
\ No newline at end of file
```

### Existing decision evidence: claim_bee83aee35ec25ec87d88a57a984cf50

```json
{
  "claimId": "claim_bee83aee35ec25ec87d88a57a984cf50",
  "sourceUnitDigest": "341f740a8ac765ef",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "discover-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 914 is carried as the frozen target heading \"Discover Verb\" (anchor discover-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Chạy context-discovery (discover)' (src line 914) to 'Discover Verb' (target line 786): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "f33a86417aeeb82bb3127686df99ed16ed2b3c30f4ebb6f10272dc8e99885111",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#chạy-context-discovery-discover`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 341f740a8ac765ef5377b8e2370b9d809e54887db271ad1fa2d7c79e9d2a8637
Shown text SHA256: 72a8b116c4392718f804e5b90830bc06cc77b6373a0aab29b0843b31e070750f

```text
### Chạy context-discovery (discover)
```

Complete native target: `docs/platform/work-state/spec.md#discover-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f33a86417aeeb82bb3127686df99ed16ed2b3c30f4ebb6f10272dc8e99885111
Shown text SHA256: 6f331300e6f6533a33b2265c78343c05eee213ce9facf069433c2a830ecf58fd

```text
### Discover Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Chạy context-discovery (discover)
\ No newline at end of file
+### Discover Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0079

Entry kind: alias-accounting
Class: Judgment
Source digest: d3f409fb371e54a9cced0f325eed10932be0e192ae013f883942ec4cc84e3a4f
Target digest: 740f2ae9b28f097c07927fe74376ff62724ebde1c3c9ba057e1091f49560a9b7

```json
{
  "aliasId": "root-authorities-draft-0079",
  "fromPath": "docs/specs/work-state.md#chạy-phán-chia-việc-plan",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "plan-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0079",
  "claimId": "claim_e2682084346c72123f9bad31f345fb99",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "chạy-phán-chia-việc-plan",
  "sourceUnitDigest": "d3f409fb371e54a9cced0f325eed10932be0e192ae013f883942ec4cc84e3a4f",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "plan-verb",
  "targetUnitDigest": "740f2ae9b28f097c07927fe74376ff62724ebde1c3c9ba057e1091f49560a9b7",
  "targetBrowserAnchor": "plan-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#chạy-phán-chia-việc-plan`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: d3f409fb371e54a9cced0f325eed10932be0e192ae013f883942ec4cc84e3a4f
Shown text SHA256: f58191921e8c5cea4cbdde352ca6c30a2ec0eef8cb2042f64ab990ffe436599e

```text
### Chạy phán chia-việc (plan)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#plan-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 740f2ae9b28f097c07927fe74376ff62724ebde1c3c9ba057e1091f49560a9b7
Shown text SHA256: 708de76e53c52c350e38450874bf7dc7bbe3c4095e9e38b7424765545acdfbe4

```text
### Plan Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Chạy phán chia-việc (plan)
\ No newline at end of file
+### Plan Verb
\ No newline at end of file
```

### Existing decision evidence: claim_e2682084346c72123f9bad31f345fb99

```json
{
  "claimId": "claim_e2682084346c72123f9bad31f345fb99",
  "sourceUnitDigest": "d3f409fb371e54a9",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "plan-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 952 is carried as the frozen target heading \"Plan Verb\" (anchor plan-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Chạy phán chia-việc (plan)' (src line 952) to 'Plan Verb' (target line 824): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "740f2ae9b28f097c07927fe74376ff62724ebde1c3c9ba057e1091f49560a9b7",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#chạy-phán-chia-việc-plan`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: d3f409fb371e54a9cced0f325eed10932be0e192ae013f883942ec4cc84e3a4f
Shown text SHA256: f58191921e8c5cea4cbdde352ca6c30a2ec0eef8cb2042f64ab990ffe436599e

```text
### Chạy phán chia-việc (plan)
```

Complete native target: `docs/platform/work-state/spec.md#plan-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 740f2ae9b28f097c07927fe74376ff62724ebde1c3c9ba057e1091f49560a9b7
Shown text SHA256: 708de76e53c52c350e38450874bf7dc7bbe3c4095e9e38b7424765545acdfbe4

```text
### Plan Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Chạy phán chia-việc (plan)
\ No newline at end of file
+### Plan Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0080

Entry kind: alias-accounting
Class: Judgment
Source digest: 70094fdb0606211275fe1da337fd3bd27d4b9614a67d8850b9ae0c1c91b5b475
Target digest: 685d7431d20a366b69624974b7fa6cf3f60f80fdc979c8f9b49c6dd9a48ac4aa

```json
{
  "aliasId": "root-authorities-draft-0080",
  "fromPath": "docs/specs/work-state.md#chuyển-trạng-thái-move",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "move-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0080",
  "claimId": "claim_d91ae89ffb766e69e4a544b9b81c8c4b",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "chuyển-trạng-thái-move",
  "sourceUnitDigest": "70094fdb0606211275fe1da337fd3bd27d4b9614a67d8850b9ae0c1c91b5b475",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "move-verb",
  "targetUnitDigest": "685d7431d20a366b69624974b7fa6cf3f60f80fdc979c8f9b49c6dd9a48ac4aa",
  "targetBrowserAnchor": "move-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#chuyển-trạng-thái-move`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 70094fdb0606211275fe1da337fd3bd27d4b9614a67d8850b9ae0c1c91b5b475
Shown text SHA256: e20e3563a26337a0a7516eb08705a0ed247fe09f8e473949a1de256d20e86d17

```text
### Chuyển trạng thái (move)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#move-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 685d7431d20a366b69624974b7fa6cf3f60f80fdc979c8f9b49c6dd9a48ac4aa
Shown text SHA256: 7843ddb82e8425572a3fa08d749e93f89982f859f5f2c3339388dae37fa9a3d3

```text
### Move Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Chuyển trạng thái (move)
\ No newline at end of file
+### Move Verb
\ No newline at end of file
```

### Existing decision evidence: claim_d91ae89ffb766e69e4a544b9b81c8c4b

```json
{
  "claimId": "claim_d91ae89ffb766e69e4a544b9b81c8c4b",
  "sourceUnitDigest": "70094fdb06062112",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "move-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 976 is carried as the frozen target heading \"Move Verb\" (anchor move-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Chuyển trạng thái (move)' (src line 976) to 'Move Verb' (target line 848): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "685d7431d20a366b69624974b7fa6cf3f60f80fdc979c8f9b49c6dd9a48ac4aa",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#chuyển-trạng-thái-move`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 70094fdb0606211275fe1da337fd3bd27d4b9614a67d8850b9ae0c1c91b5b475
Shown text SHA256: e20e3563a26337a0a7516eb08705a0ed247fe09f8e473949a1de256d20e86d17

```text
### Chuyển trạng thái (move)
```

Complete native target: `docs/platform/work-state/spec.md#move-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 685d7431d20a366b69624974b7fa6cf3f60f80fdc979c8f9b49c6dd9a48ac4aa
Shown text SHA256: 7843ddb82e8425572a3fa08d749e93f89982f859f5f2c3339388dae37fa9a3d3

```text
### Move Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Chuyển trạng thái (move)
\ No newline at end of file
+### Move Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0081

Entry kind: alias-accounting
Class: Judgment
Source digest: 9014f02138e6400d5d060dd48e3036762e426587c3da5db1f9bb49b9e5b09b2c
Target digest: 689202f851d08a96234a5a232f112d0642ab5109173f3b834566e4e6f36d9f7b

```json
{
  "aliasId": "root-authorities-draft-0081",
  "fromPath": "docs/specs/work-state.md#sửa-việc-edit-luôn-ghi-đè-được-str23-per-work-item-verb-surface",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "edit-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0081",
  "claimId": "claim_e7f5c77c843747d054f54f58e6429262",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "sửa-việc-edit-luôn-ghi-đè-được-str23-per-work-item-verb-surface",
  "sourceUnitDigest": "9014f02138e6400d5d060dd48e3036762e426587c3da5db1f9bb49b9e5b09b2c",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "edit-verb",
  "targetUnitDigest": "689202f851d08a96234a5a232f112d0642ab5109173f3b834566e4e6f36d9f7b",
  "targetBrowserAnchor": "edit-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#sửa-việc-edit-luôn-ghi-đè-được-str23-per-work-item-verb-surface`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9014f02138e6400d5d060dd48e3036762e426587c3da5db1f9bb49b9e5b09b2c
Shown text SHA256: 2b9025680f199bd35b34ae3046137032f58b0b405cd684797e8137c5fc1d81b3

```text
### Sửa việc (edit) — luôn ghi đè được (STR23, per work-item-verb-surface)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#edit-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 689202f851d08a96234a5a232f112d0642ab5109173f3b834566e4e6f36d9f7b
Shown text SHA256: 15bc7218a90448b766b5ba3a541aee6be5ddf079690ffb060a4c1d3ab2147439

```text
### Edit Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Sửa việc (edit) — luôn ghi đè được (STR23, per work-item-verb-surface)
\ No newline at end of file
+### Edit Verb
\ No newline at end of file
```

### Existing decision evidence: claim_e7f5c77c843747d054f54f58e6429262

```json
{
  "claimId": "claim_e7f5c77c843747d054f54f58e6429262",
  "sourceUnitDigest": "9014f02138e6400d",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "edit-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 983 is carried as the frozen target heading \"Edit Verb\" (anchor edit-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Sửa việc (edit) — luôn ghi đè được (STR23, per w' (src line 983) to 'Edit Verb' (target line 855): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "689202f851d08a96234a5a232f112d0642ab5109173f3b834566e4e6f36d9f7b",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#sửa-việc-edit-luôn-ghi-đè-được-str23-per-work-item-verb-surface`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9014f02138e6400d5d060dd48e3036762e426587c3da5db1f9bb49b9e5b09b2c
Shown text SHA256: 2b9025680f199bd35b34ae3046137032f58b0b405cd684797e8137c5fc1d81b3

```text
### Sửa việc (edit) — luôn ghi đè được (STR23, per work-item-verb-surface)
```

Complete native target: `docs/platform/work-state/spec.md#edit-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 689202f851d08a96234a5a232f112d0642ab5109173f3b834566e4e6f36d9f7b
Shown text SHA256: 15bc7218a90448b766b5ba3a541aee6be5ddf079690ffb060a4c1d3ab2147439

```text
### Edit Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Sửa việc (edit) — luôn ghi đè được (STR23, per work-item-verb-surface)
\ No newline at end of file
+### Edit Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0082

Entry kind: alias-accounting
Class: Judgment
Source digest: 7785259f39c2b11639e0d28f24b2f0df776f3bc6e93d8a3bf145cb6a06c19502
Target digest: dbf59c33ac4e331f1f85a643593063ff0059dd22a9c78d2cd17fa3a9c97e6b4c

```json
{
  "aliasId": "root-authorities-draft-0082",
  "fromPath": "docs/specs/work-state.md#ghi-quyết-định-decision",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "decision-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0082",
  "claimId": "claim_099cfdfdc16d8e8b4946219c7ed988f3",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "ghi-quyết-định-decision",
  "sourceUnitDigest": "7785259f39c2b11639e0d28f24b2f0df776f3bc6e93d8a3bf145cb6a06c19502",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "decision-verb",
  "targetUnitDigest": "dbf59c33ac4e331f1f85a643593063ff0059dd22a9c78d2cd17fa3a9c97e6b4c",
  "targetBrowserAnchor": "decision-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#ghi-quyết-định-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 7785259f39c2b11639e0d28f24b2f0df776f3bc6e93d8a3bf145cb6a06c19502
Shown text SHA256: c33d958631917c48bd161841855397983c977fc0438f79cafaeca2f9c2cc6dc7

```text
### Ghi quyết định (decision)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#decision-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dbf59c33ac4e331f1f85a643593063ff0059dd22a9c78d2cd17fa3a9c97e6b4c
Shown text SHA256: 6206829a9813782016e59268be8d2cfc5f4aca89d48761538157b2e87fdb48fd

```text
### Decision Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Ghi quyết định (decision)
\ No newline at end of file
+### Decision Verb
\ No newline at end of file
```

### Existing decision evidence: claim_099cfdfdc16d8e8b4946219c7ed988f3

```json
{
  "claimId": "claim_099cfdfdc16d8e8b4946219c7ed988f3",
  "sourceUnitDigest": "7785259f39c2b116",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "decision-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1027 is carried as the frozen target heading \"Decision Verb\" (anchor decision-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Ghi quyết định (decision)' (src line 1027) to 'Decision Verb' (target line 899): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "dbf59c33ac4e331f1f85a643593063ff0059dd22a9c78d2cd17fa3a9c97e6b4c",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#ghi-quyết-định-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 7785259f39c2b11639e0d28f24b2f0df776f3bc6e93d8a3bf145cb6a06c19502
Shown text SHA256: c33d958631917c48bd161841855397983c977fc0438f79cafaeca2f9c2cc6dc7

```text
### Ghi quyết định (decision)
```

Complete native target: `docs/platform/work-state/spec.md#decision-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dbf59c33ac4e331f1f85a643593063ff0059dd22a9c78d2cd17fa3a9c97e6b4c
Shown text SHA256: 6206829a9813782016e59268be8d2cfc5f4aca89d48761538157b2e87fdb48fd

```text
### Decision Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Ghi quyết định (decision)
\ No newline at end of file
+### Decision Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0083

Entry kind: alias-accounting
Class: Judgment
Source digest: 5791aa2f96066e0249e513fc0da31a41a91bea00f140ebee240744086d2c1fa7
Target digest: 2c04890a8a028ad8c2cea00ffc025f821840f79ccb20f1f0b9c8b78843782eaa

```json
{
  "aliasId": "root-authorities-draft-0083",
  "fromPath": "docs/specs/work-state.md#đưa-vào-chờ-người-ask",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "ask-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0083",
  "claimId": "claim_75500caff35f59b62abf19b6b88dc5ae",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "đưa-vào-chờ-người-ask",
  "sourceUnitDigest": "5791aa2f96066e0249e513fc0da31a41a91bea00f140ebee240744086d2c1fa7",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "ask-verb",
  "targetUnitDigest": "2c04890a8a028ad8c2cea00ffc025f821840f79ccb20f1f0b9c8b78843782eaa",
  "targetBrowserAnchor": "ask-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#đưa-vào-chờ-người-ask`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5791aa2f96066e0249e513fc0da31a41a91bea00f140ebee240744086d2c1fa7
Shown text SHA256: 771b040c2022feee3d122668043ccda7c97f51b6b9785fad28955d32886f456d

```text
### Đưa vào chờ người (ask)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#ask-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2c04890a8a028ad8c2cea00ffc025f821840f79ccb20f1f0b9c8b78843782eaa
Shown text SHA256: ed9e6f641fa181ba499eb610d3e90415770ec8f4e682b20e830fa200917ed02f

```text
### Ask Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Đưa vào chờ người (ask)
\ No newline at end of file
+### Ask Verb
\ No newline at end of file
```

### Existing decision evidence: claim_75500caff35f59b62abf19b6b88dc5ae

```json
{
  "claimId": "claim_75500caff35f59b62abf19b6b88dc5ae",
  "sourceUnitDigest": "5791aa2f96066e02",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "ask-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1032 is carried as the frozen target heading \"Ask Verb\" (anchor ask-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Đưa vào chờ người (ask)' (src line 1032) to 'Ask Verb' (target line 904): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "2c04890a8a028ad8c2cea00ffc025f821840f79ccb20f1f0b9c8b78843782eaa",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#đưa-vào-chờ-người-ask`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5791aa2f96066e0249e513fc0da31a41a91bea00f140ebee240744086d2c1fa7
Shown text SHA256: 771b040c2022feee3d122668043ccda7c97f51b6b9785fad28955d32886f456d

```text
### Đưa vào chờ người (ask)
```

Complete native target: `docs/platform/work-state/spec.md#ask-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2c04890a8a028ad8c2cea00ffc025f821840f79ccb20f1f0b9c8b78843782eaa
Shown text SHA256: ed9e6f641fa181ba499eb610d3e90415770ec8f4e682b20e830fa200917ed02f

```text
### Ask Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Đưa vào chờ người (ask)
\ No newline at end of file
+### Ask Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0084

Entry kind: alias-accounting
Class: Judgment
Source digest: 53bebe93150ccda0a0e8e21eabc2f218075498c9841485e9f938f5e54d998738
Target digest: 5dc76d31ba2acacb4a7d4bfbf78df3d1bc10fbb977a176ac4d3e6da62c4e3635

```json
{
  "aliasId": "root-authorities-draft-0084",
  "fromPath": "docs/specs/work-state.md#trả-lời-answer",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "answer-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0084",
  "claimId": "claim_b406721dd14005f1f8721b2329dd53d6",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "trả-lời-answer",
  "sourceUnitDigest": "53bebe93150ccda0a0e8e21eabc2f218075498c9841485e9f938f5e54d998738",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "answer-verb",
  "targetUnitDigest": "5dc76d31ba2acacb4a7d4bfbf78df3d1bc10fbb977a176ac4d3e6da62c4e3635",
  "targetBrowserAnchor": "answer-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#trả-lời-answer`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 53bebe93150ccda0a0e8e21eabc2f218075498c9841485e9f938f5e54d998738
Shown text SHA256: d7f783136e844737cf1fad77a812a92e4be0363cd457de09952cd009a3f90ddd

```text
### Trả lời (answer)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#answer-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5dc76d31ba2acacb4a7d4bfbf78df3d1bc10fbb977a176ac4d3e6da62c4e3635
Shown text SHA256: d5bfb6d798505d2395b26a4a3c76cd2f532ac603d07269f1a98ea167f3bf4f85

```text
### Answer Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Trả lời (answer)
\ No newline at end of file
+### Answer Verb
\ No newline at end of file
```

### Existing decision evidence: claim_b406721dd14005f1f8721b2329dd53d6

```json
{
  "claimId": "claim_b406721dd14005f1f8721b2329dd53d6",
  "sourceUnitDigest": "53bebe93150ccda0",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "answer-verb",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1040 is carried as the frozen target heading \"Answer Verb\" (anchor answer-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. Authorized A35 correction changes the whole target unit; A22 requires independent re-review, with no approval carried. Full original source, previous target and corrected target are shown; the false clauses are replaced by code-backed facts.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Tra loi (answer)' to 'Answer Verb' (H3 both): title-only change plus a payload digest that moved only because the U3 body below it was corrected; anchor ok, ancestry equal, digests recomputed match the shard, supersede is correct.",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "5dc76d31ba2acacb4a7d4bfbf78df3d1bc10fbb977a176ac4d3e6da62c4e3635",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#trả-lời-answer`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 53bebe93150ccda0a0e8e21eabc2f218075498c9841485e9f938f5e54d998738
Shown text SHA256: d7f783136e844737cf1fad77a812a92e4be0363cd457de09952cd009a3f90ddd

```text
### Trả lời (answer)
```

Complete native target: `docs/platform/work-state/spec.md#answer-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5dc76d31ba2acacb4a7d4bfbf78df3d1bc10fbb977a176ac4d3e6da62c4e3635
Shown text SHA256: d5bfb6d798505d2395b26a4a3c76cd2f532ac603d07269f1a98ea167f3bf4f85

```text
### Answer Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Trả lời (answer)
\ No newline at end of file
+### Answer Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0085

Entry kind: alias-accounting
Class: Judgment
Source digest: 32d6edcfca2c33fd1e09a7845cc4fd3f8a73fe50f0dc9ada5093cc59ec67a85b
Target digest: 1cead60d786aa453151e1ed45cc0ad04643b3ce164c4536b12f2d5aac0082f6f

```json
{
  "aliasId": "root-authorities-draft-0085",
  "fromPath": "docs/specs/work-state.md#ghi-kết-quả-dự-đoánthực-tế-outcome",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "outcome-recording",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0085",
  "claimId": "claim_0f34f596e1d30c6195234ae86ff49537",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "ghi-kết-quả-dự-đoánthực-tế-outcome",
  "sourceUnitDigest": "32d6edcfca2c33fd1e09a7845cc4fd3f8a73fe50f0dc9ada5093cc59ec67a85b",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "outcome-recording",
  "targetUnitDigest": "1cead60d786aa453151e1ed45cc0ad04643b3ce164c4536b12f2d5aac0082f6f",
  "targetBrowserAnchor": "outcome-recording",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#ghi-kết-quả-dự-đoánthực-tế-outcome`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 32d6edcfca2c33fd1e09a7845cc4fd3f8a73fe50f0dc9ada5093cc59ec67a85b
Shown text SHA256: 06867d0b34c736eb0eaace6a5cb0df697916847822f45acb5df3e32760858e46

```text
### Ghi kết quả dự đoán/thực tế (outcome)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#outcome-recording`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 1cead60d786aa453151e1ed45cc0ad04643b3ce164c4536b12f2d5aac0082f6f
Shown text SHA256: cf6e2875b45f4b2f8fd253de2ce0bf4f303a6d42b79998f370d867383db11566

```text
### Outcome Recording
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Ghi kết quả dự đoán/thực tế (outcome)
\ No newline at end of file
+### Outcome Recording
\ No newline at end of file
```

### Existing decision evidence: claim_0f34f596e1d30c6195234ae86ff49537

```json
{
  "claimId": "claim_0f34f596e1d30c6195234ae86ff49537",
  "sourceUnitDigest": "32d6edcfca2c33fd",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "outcome-recording",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1048 is carried as the frozen target heading \"Outcome Recording\" (anchor outcome-recording) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Ghi kết quả dự đoán/thực tế (outcome)' (src line 1048) to 'Outcome Recording' (target line 920): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "1cead60d786aa453151e1ed45cc0ad04643b3ce164c4536b12f2d5aac0082f6f",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#ghi-kết-quả-dự-đoánthực-tế-outcome`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 32d6edcfca2c33fd1e09a7845cc4fd3f8a73fe50f0dc9ada5093cc59ec67a85b
Shown text SHA256: 06867d0b34c736eb0eaace6a5cb0df697916847822f45acb5df3e32760858e46

```text
### Ghi kết quả dự đoán/thực tế (outcome)
```

Complete native target: `docs/platform/work-state/spec.md#outcome-recording`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 1cead60d786aa453151e1ed45cc0ad04643b3ce164c4536b12f2d5aac0082f6f
Shown text SHA256: cf6e2875b45f4b2f8fd253de2ce0bf4f303a6d42b79998f370d867383db11566

```text
### Outcome Recording
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Ghi kết quả dự đoán/thực tế (outcome)
\ No newline at end of file
+### Outcome Recording
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0086

Entry kind: alias-accounting
Class: Judgment
Source digest: 4f07596c39d3ce703d7a382a31f817aa4cea96b6f7ff0c4899aff48a3d9d104b
Target digest: b78e269b113fe52a189e91db3cc0cb1f0a0d361678b78bf054d89d0ffa683660

```json
{
  "aliasId": "root-authorities-draft-0086",
  "fromPath": "docs/specs/work-state.md#đọc-kết-quả-check",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "check-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0086",
  "claimId": "claim_87ab779ddfa1909428d88042b42754f5",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "đọc-kết-quả-check",
  "sourceUnitDigest": "4f07596c39d3ce703d7a382a31f817aa4cea96b6f7ff0c4899aff48a3d9d104b",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "check-verb",
  "targetUnitDigest": "b78e269b113fe52a189e91db3cc0cb1f0a0d361678b78bf054d89d0ffa683660",
  "targetBrowserAnchor": "check-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#đọc-kết-quả-check`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4f07596c39d3ce703d7a382a31f817aa4cea96b6f7ff0c4899aff48a3d9d104b
Shown text SHA256: a5631f0a390dad25b436444aab4e3e4ad79d6e951bb3b5a4a985f2cd141b11f6

```text
### Đọc kết quả (check)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#check-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b78e269b113fe52a189e91db3cc0cb1f0a0d361678b78bf054d89d0ffa683660
Shown text SHA256: 110cfd12c1ba34dc66097c23ea7f57febfc84d78f8293828b7e5cd3cdc0905ad

```text
### Check Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Đọc kết quả (check)
\ No newline at end of file
+### Check Verb
\ No newline at end of file
```

### Existing decision evidence: claim_87ab779ddfa1909428d88042b42754f5

```json
{
  "claimId": "claim_87ab779ddfa1909428d88042b42754f5",
  "sourceUnitDigest": "4f07596c39d3ce70",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "check-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1056 is carried as the frozen target heading \"Check Verb\" (anchor check-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Đọc kết quả (check)' (src line 1056) to 'Check Verb' (target line 928): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "b78e269b113fe52a189e91db3cc0cb1f0a0d361678b78bf054d89d0ffa683660",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#đọc-kết-quả-check`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4f07596c39d3ce703d7a382a31f817aa4cea96b6f7ff0c4899aff48a3d9d104b
Shown text SHA256: a5631f0a390dad25b436444aab4e3e4ad79d6e951bb3b5a4a985f2cd141b11f6

```text
### Đọc kết quả (check)
```

Complete native target: `docs/platform/work-state/spec.md#check-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b78e269b113fe52a189e91db3cc0cb1f0a0d361678b78bf054d89d0ffa683660
Shown text SHA256: 110cfd12c1ba34dc66097c23ea7f57febfc84d78f8293828b7e5cd3cdc0905ad

```text
### Check Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Đọc kết quả (check)
\ No newline at end of file
+### Check Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0087

Entry kind: alias-accounting
Class: Judgment
Source digest: a21681fc69c7784260920353c6805ea0a6b9bd470e25bf66b467e1220787620a
Target digest: e8318f23e767c0e0775f5fb1e566f3ee4ebc759dd07ecf2310ae735c15a932d6

```json
{
  "aliasId": "root-authorities-draft-0087",
  "fromPath": "docs/specs/work-state.md#sinh-chỉ-mục-đọc-theo-tag-tài-liệu-người-dùng-cuối-docs-index",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "docs-index-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0087",
  "claimId": "claim_2c5f685ef7ce4a68703207540518c20f",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "sinh-chỉ-mục-đọc-theo-tag-tài-liệu-người-dùng-cuối-docs-index",
  "sourceUnitDigest": "a21681fc69c7784260920353c6805ea0a6b9bd470e25bf66b467e1220787620a",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "docs-index-verb",
  "targetUnitDigest": "e8318f23e767c0e0775f5fb1e566f3ee4ebc759dd07ecf2310ae735c15a932d6",
  "targetBrowserAnchor": "docs-index-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#sinh-chỉ-mục-đọc-theo-tag-tài-liệu-người-dùng-cuối-docs-index`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a21681fc69c7784260920353c6805ea0a6b9bd470e25bf66b467e1220787620a
Shown text SHA256: 806527db47798d3e87b8ed20c21ff906c0cbc57d3e9d479a9174812867a9aaab

```text
### Sinh chỉ mục đọc-theo-tag tài liệu người-dùng-cuối (docs-index)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#docs-index-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e8318f23e767c0e0775f5fb1e566f3ee4ebc759dd07ecf2310ae735c15a932d6
Shown text SHA256: b01ef7360fed0056fd1ca94ecdeabadc39e0bb4d42cea4f7ab921941dc750fa5

```text
### Docs Index Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Sinh chỉ mục đọc-theo-tag tài liệu người-dùng-cuối (docs-index)
\ No newline at end of file
+### Docs Index Verb
\ No newline at end of file
```

### Existing decision evidence: claim_2c5f685ef7ce4a68703207540518c20f

```json
{
  "claimId": "claim_2c5f685ef7ce4a68703207540518c20f",
  "sourceUnitDigest": "a21681fc69c77842",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "docs-index-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1063 is carried as the frozen target heading \"Docs Index Verb\" (anchor docs-index-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Sinh chỉ mục đọc-theo-tag tài liệu người-dùng-cu' (src line 1063) to 'Docs Index Verb' (target line 935): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "e8318f23e767c0e0775f5fb1e566f3ee4ebc759dd07ecf2310ae735c15a932d6",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#sinh-chỉ-mục-đọc-theo-tag-tài-liệu-người-dùng-cuối-docs-index`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a21681fc69c7784260920353c6805ea0a6b9bd470e25bf66b467e1220787620a
Shown text SHA256: 806527db47798d3e87b8ed20c21ff906c0cbc57d3e9d479a9174812867a9aaab

```text
### Sinh chỉ mục đọc-theo-tag tài liệu người-dùng-cuối (docs-index)
```

Complete native target: `docs/platform/work-state/spec.md#docs-index-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e8318f23e767c0e0775f5fb1e566f3ee4ebc759dd07ecf2310ae735c15a932d6
Shown text SHA256: b01ef7360fed0056fd1ca94ecdeabadc39e0bb4d42cea4f7ab921941dc750fa5

```text
### Docs Index Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Sinh chỉ mục đọc-theo-tag tài liệu người-dùng-cuối (docs-index)
\ No newline at end of file
+### Docs Index Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0088

Entry kind: alias-accounting
Class: Judgment
Source digest: 95efa9270b39dff3ad45f9c31a59f7a65caa1cc8a808c9e43bfc4a1e7eeaced8
Target digest: ed414778b43df6e52ed94cc6779375839da3e9729d2be1a7eb921ee8ad1a1ed0

```json
{
  "aliasId": "root-authorities-draft-0088",
  "fromPath": "docs/specs/work-state.md#xem-tiến-độ-theo-bộ-rollup",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "rollup-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0088",
  "claimId": "claim_630475260ac68684638bc1a7aee5b610",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "xem-tiến-độ-theo-bộ-rollup",
  "sourceUnitDigest": "95efa9270b39dff3ad45f9c31a59f7a65caa1cc8a808c9e43bfc4a1e7eeaced8",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "rollup-verb",
  "targetUnitDigest": "ed414778b43df6e52ed94cc6779375839da3e9729d2be1a7eb921ee8ad1a1ed0",
  "targetBrowserAnchor": "rollup-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#xem-tiến-độ-theo-bộ-rollup`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 95efa9270b39dff3ad45f9c31a59f7a65caa1cc8a808c9e43bfc4a1e7eeaced8
Shown text SHA256: e4bdf9091ec51ac5bed0226d5ff27d07c4f92ba59f761a2aed42f4f55d74daee

```text
### Xem tiến độ theo bộ (rollup)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#rollup-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ed414778b43df6e52ed94cc6779375839da3e9729d2be1a7eb921ee8ad1a1ed0
Shown text SHA256: 8bb23f5a4f8d12ec2c8947d604310c3c9916dee02abdfbe51838ed46304d1df6

```text
### Rollup Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Xem tiến độ theo bộ (rollup)
\ No newline at end of file
+### Rollup Verb
\ No newline at end of file
```

### Existing decision evidence: claim_630475260ac68684638bc1a7aee5b610

```json
{
  "claimId": "claim_630475260ac68684638bc1a7aee5b610",
  "sourceUnitDigest": "95efa9270b39dff3",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "rollup-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1070 is carried as the frozen target heading \"Rollup Verb\" (anchor rollup-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Xem tiến độ theo bộ (rollup)' (src line 1070) to 'Rollup Verb' (target line 942): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "ed414778b43df6e52ed94cc6779375839da3e9729d2be1a7eb921ee8ad1a1ed0",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#xem-tiến-độ-theo-bộ-rollup`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 95efa9270b39dff3ad45f9c31a59f7a65caa1cc8a808c9e43bfc4a1e7eeaced8
Shown text SHA256: e4bdf9091ec51ac5bed0226d5ff27d07c4f92ba59f761a2aed42f4f55d74daee

```text
### Xem tiến độ theo bộ (rollup)
```

Complete native target: `docs/platform/work-state/spec.md#rollup-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ed414778b43df6e52ed94cc6779375839da3e9729d2be1a7eb921ee8ad1a1ed0
Shown text SHA256: 8bb23f5a4f8d12ec2c8947d604310c3c9916dee02abdfbe51838ed46304d1df6

```text
### Rollup Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Xem tiến độ theo bộ (rollup)
\ No newline at end of file
+### Rollup Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0089

Entry kind: alias-accounting
Class: Judgment
Source digest: b6dd16681d445682205ef42e74864ed7dd0a2310a97c9cea18e6352cdc288b7c
Target digest: b14350bc6836dcbb82ec7b0a834b6c56d596496a3811a3d446a2acbbf7902322

```json
{
  "aliasId": "root-authorities-draft-0089",
  "fromPath": "docs/specs/work-state.md#xếp-hạng-tác-động-backlog-triage",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "triage-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0089",
  "claimId": "claim_3ce01ed0c5831b032d0fb9114c465c35",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "xếp-hạng-tác-động-backlog-triage",
  "sourceUnitDigest": "b6dd16681d445682205ef42e74864ed7dd0a2310a97c9cea18e6352cdc288b7c",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "triage-verb",
  "targetUnitDigest": "b14350bc6836dcbb82ec7b0a834b6c56d596496a3811a3d446a2acbbf7902322",
  "targetBrowserAnchor": "triage-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#xếp-hạng-tác-động-backlog-triage`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b6dd16681d445682205ef42e74864ed7dd0a2310a97c9cea18e6352cdc288b7c
Shown text SHA256: 200f58db26d8f0215b736ccf58d20e8f9561ae6ed680322b590844be93d3a2b9

```text
### Xếp hạng tác động backlog (triage)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#triage-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b14350bc6836dcbb82ec7b0a834b6c56d596496a3811a3d446a2acbbf7902322
Shown text SHA256: 6e9805d3aad8795b8408568c34d96fc24d1e049389834fcfff551226c730e191

```text
### Triage Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Xếp hạng tác động backlog (triage)
\ No newline at end of file
+### Triage Verb
\ No newline at end of file
```

### Existing decision evidence: claim_3ce01ed0c5831b032d0fb9114c465c35

```json
{
  "claimId": "claim_3ce01ed0c5831b032d0fb9114c465c35",
  "sourceUnitDigest": "b6dd16681d445682",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "triage-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1077 is carried as the frozen target heading \"Triage Verb\" (anchor triage-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Xếp hạng tác động backlog (triage)' (src line 1077) to 'Triage Verb' (target line 949): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "b14350bc6836dcbb82ec7b0a834b6c56d596496a3811a3d446a2acbbf7902322",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#xếp-hạng-tác-động-backlog-triage`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b6dd16681d445682205ef42e74864ed7dd0a2310a97c9cea18e6352cdc288b7c
Shown text SHA256: 200f58db26d8f0215b736ccf58d20e8f9561ae6ed680322b590844be93d3a2b9

```text
### Xếp hạng tác động backlog (triage)
```

Complete native target: `docs/platform/work-state/spec.md#triage-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b14350bc6836dcbb82ec7b0a834b6c56d596496a3811a3d446a2acbbf7902322
Shown text SHA256: 6e9805d3aad8795b8408568c34d96fc24d1e049389834fcfff551226c730e191

```text
### Triage Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Xếp hạng tác động backlog (triage)
\ No newline at end of file
+### Triage Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0090

Entry kind: alias-accounting
Class: Judgment
Source digest: 4af02513f5016df6000f0ed5e57a436c7a436ee901c828844419943946e507bb
Target digest: 9d733d0265fc3f50452d82169301c1c4ba18d87f1ca9274b0e4551825931c04b

```json
{
  "aliasId": "root-authorities-draft-0090",
  "fromPath": "docs/specs/work-state.md#cầm-việc-qua-cửa-pull-take",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "take-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0090",
  "claimId": "claim_8ab73081ca23b57d7e1000709c6afb7a",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "cầm-việc-qua-cửa-pull-take",
  "sourceUnitDigest": "4af02513f5016df6000f0ed5e57a436c7a436ee901c828844419943946e507bb",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "take-verb",
  "targetUnitDigest": "9d733d0265fc3f50452d82169301c1c4ba18d87f1ca9274b0e4551825931c04b",
  "targetBrowserAnchor": "take-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#cầm-việc-qua-cửa-pull-take`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4af02513f5016df6000f0ed5e57a436c7a436ee901c828844419943946e507bb
Shown text SHA256: c1ab61a48b16a71388d2565ace48d652bca7024e09498da0276918af4dd1a228

```text
### Cầm việc qua cửa pull (take)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#take-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9d733d0265fc3f50452d82169301c1c4ba18d87f1ca9274b0e4551825931c04b
Shown text SHA256: 107dd54b51d5a273d023c3a2041ca0c2115003ebd2133e8229f75cc07372768c

```text
### Take Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Cầm việc qua cửa pull (take)
\ No newline at end of file
+### Take Verb
\ No newline at end of file
```

### Existing decision evidence: claim_8ab73081ca23b57d7e1000709c6afb7a

```json
{
  "claimId": "claim_8ab73081ca23b57d7e1000709c6afb7a",
  "sourceUnitDigest": "4af02513f5016df6",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "take-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1084 is carried as the frozen target heading \"Take Verb\" (anchor take-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Cầm việc qua cửa pull (take)' (src line 1084) to 'Take Verb' (target line 956): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "9d733d0265fc3f50452d82169301c1c4ba18d87f1ca9274b0e4551825931c04b",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#cầm-việc-qua-cửa-pull-take`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4af02513f5016df6000f0ed5e57a436c7a436ee901c828844419943946e507bb
Shown text SHA256: c1ab61a48b16a71388d2565ace48d652bca7024e09498da0276918af4dd1a228

```text
### Cầm việc qua cửa pull (take)
```

Complete native target: `docs/platform/work-state/spec.md#take-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9d733d0265fc3f50452d82169301c1c4ba18d87f1ca9274b0e4551825931c04b
Shown text SHA256: 107dd54b51d5a273d023c3a2041ca0c2115003ebd2133e8229f75cc07372768c

```text
### Take Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Cầm việc qua cửa pull (take)
\ No newline at end of file
+### Take Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0091

Entry kind: alias-accounting
Class: Judgment
Source digest: 3521fcb1bbf3a46cbd20fbeedc2f3041a71a774742c3b87505449c578ad1477a
Target digest: 9d6b89d822737055f2fde27c45a03a8a28eb373487186c248235f45774b6a709

```json
{
  "aliasId": "root-authorities-draft-0091",
  "fromPath": "docs/specs/work-state.md#cầm-việc-dựng-workspace-pick",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "pick-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0091",
  "claimId": "claim_d365a6a94d068bc2ba274b535299db86",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "cầm-việc-dựng-workspace-pick",
  "sourceUnitDigest": "3521fcb1bbf3a46cbd20fbeedc2f3041a71a774742c3b87505449c578ad1477a",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "pick-verb",
  "targetUnitDigest": "9d6b89d822737055f2fde27c45a03a8a28eb373487186c248235f45774b6a709",
  "targetBrowserAnchor": "pick-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#cầm-việc-dựng-workspace-pick`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 3521fcb1bbf3a46cbd20fbeedc2f3041a71a774742c3b87505449c578ad1477a
Shown text SHA256: 77ddba3bfa6f371b727b45a85a474b2727533131764b27fde27c6d9e65b81355

```text
### Cầm việc + dựng workspace (pick)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#pick-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9d6b89d822737055f2fde27c45a03a8a28eb373487186c248235f45774b6a709
Shown text SHA256: 302808ce43504b17ecd61e5bd27f8e68812e7d5a371c4629f019299e7422fbb7

```text
### Pick Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Cầm việc + dựng workspace (pick)
\ No newline at end of file
+### Pick Verb
\ No newline at end of file
```

### Existing decision evidence: claim_d365a6a94d068bc2ba274b535299db86

```json
{
  "claimId": "claim_d365a6a94d068bc2ba274b535299db86",
  "sourceUnitDigest": "3521fcb1bbf3a46c",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "pick-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1092 is carried as the frozen target heading \"Pick Verb\" (anchor pick-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Cầm việc + dựng workspace (pick)' (src line 1092) to 'Pick Verb' (target line 964): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "9d6b89d822737055f2fde27c45a03a8a28eb373487186c248235f45774b6a709",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#cầm-việc-dựng-workspace-pick`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 3521fcb1bbf3a46cbd20fbeedc2f3041a71a774742c3b87505449c578ad1477a
Shown text SHA256: 77ddba3bfa6f371b727b45a85a474b2727533131764b27fde27c6d9e65b81355

```text
### Cầm việc + dựng workspace (pick)
```

Complete native target: `docs/platform/work-state/spec.md#pick-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9d6b89d822737055f2fde27c45a03a8a28eb373487186c248235f45774b6a709
Shown text SHA256: 302808ce43504b17ecd61e5bd27f8e68812e7d5a371c4629f019299e7422fbb7

```text
### Pick Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Cầm việc + dựng workspace (pick)
\ No newline at end of file
+### Pick Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0092

Entry kind: alias-accounting
Class: Judgment
Source digest: a807c9515dd88b714063004cba893e96d576cb4cfdec91a19330cf2e89646486
Target digest: fd5055fd4d167520785637d135539dfe7883fe7f6e206aba3329e266f2fff67d

```json
{
  "aliasId": "root-authorities-draft-0092",
  "fromPath": "docs/specs/work-state.md#trả-việc-qua-cửa-pull-return",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "return-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0092",
  "claimId": "claim_5bcb955bde6e229ab09e5002c1911076",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "trả-việc-qua-cửa-pull-return",
  "sourceUnitDigest": "a807c9515dd88b714063004cba893e96d576cb4cfdec91a19330cf2e89646486",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "return-verb",
  "targetUnitDigest": "fd5055fd4d167520785637d135539dfe7883fe7f6e206aba3329e266f2fff67d",
  "targetBrowserAnchor": "return-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#trả-việc-qua-cửa-pull-return`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a807c9515dd88b714063004cba893e96d576cb4cfdec91a19330cf2e89646486
Shown text SHA256: c6c402e6d1ed5bfd52285b34831d4a5f4d14c6837c1d1f6b88f800bb484abb16

```text
### Trả việc qua cửa pull (return)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#return-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: fd5055fd4d167520785637d135539dfe7883fe7f6e206aba3329e266f2fff67d
Shown text SHA256: 65db9ee395136962f90ba153b9f039afd7a2eddc25308baa0f74be99dc262686

```text
### Return Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Trả việc qua cửa pull (return)
\ No newline at end of file
+### Return Verb
\ No newline at end of file
```

### Existing decision evidence: claim_5bcb955bde6e229ab09e5002c1911076

```json
{
  "claimId": "claim_5bcb955bde6e229ab09e5002c1911076",
  "sourceUnitDigest": "a807c9515dd88b71",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "return-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1100 is carried as the frozen target heading \"Return Verb\" (anchor return-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Trả việc qua cửa pull (return)' (src line 1100) to 'Return Verb' (target line 972): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "fd5055fd4d167520785637d135539dfe7883fe7f6e206aba3329e266f2fff67d",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#trả-việc-qua-cửa-pull-return`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a807c9515dd88b714063004cba893e96d576cb4cfdec91a19330cf2e89646486
Shown text SHA256: c6c402e6d1ed5bfd52285b34831d4a5f4d14c6837c1d1f6b88f800bb484abb16

```text
### Trả việc qua cửa pull (return)
```

Complete native target: `docs/platform/work-state/spec.md#return-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: fd5055fd4d167520785637d135539dfe7883fe7f6e206aba3329e266f2fff67d
Shown text SHA256: 65db9ee395136962f90ba153b9f039afd7a2eddc25308baa0f74be99dc262686

```text
### Return Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Trả việc qua cửa pull (return)
\ No newline at end of file
+### Return Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0093

Entry kind: alias-accounting
Class: Judgment
Source digest: cf68d4bf824dc72a07225c03e2b68dfb8aac1608c37afbb1c81f02f6d4c0c5e5
Target digest: cfb4d9d1b43c6a4f40c13357f9d9124ae1977dd24ccd483d4016fe7c0bbe542e

```json
{
  "aliasId": "root-authorities-draft-0093",
  "fromPath": "docs/specs/work-state.md#dựng-lại-rebuild-thao-tác-phục-hồi",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "rebuild-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0093",
  "claimId": "claim_54ab90a57c23e9ceabed9e79ad78dd7f",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "dựng-lại-rebuild-thao-tác-phục-hồi",
  "sourceUnitDigest": "cf68d4bf824dc72a07225c03e2b68dfb8aac1608c37afbb1c81f02f6d4c0c5e5",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "rebuild-verb",
  "targetUnitDigest": "cfb4d9d1b43c6a4f40c13357f9d9124ae1977dd24ccd483d4016fe7c0bbe542e",
  "targetBrowserAnchor": "rebuild-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#dựng-lại-rebuild-thao-tác-phục-hồi`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: cf68d4bf824dc72a07225c03e2b68dfb8aac1608c37afbb1c81f02f6d4c0c5e5
Shown text SHA256: d43029ed9471b6ac584e60d6c86a61f5c91e6502556028cfb7bcf6e5f23b7d64

```text
### Dựng lại (rebuild) — thao tác phục hồi
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#rebuild-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: cfb4d9d1b43c6a4f40c13357f9d9124ae1977dd24ccd483d4016fe7c0bbe542e
Shown text SHA256: e6ea865132e222ee7ce35425400297f904f53921b83bd29501f2f4b08f8471e4

```text
### Rebuild Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Dựng lại (rebuild) — thao tác phục hồi
\ No newline at end of file
+### Rebuild Verb
\ No newline at end of file
```

### Existing decision evidence: claim_54ab90a57c23e9ceabed9e79ad78dd7f

```json
{
  "claimId": "claim_54ab90a57c23e9ceabed9e79ad78dd7f",
  "sourceUnitDigest": "cf68d4bf824dc72a",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "rebuild-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1108 is carried as the frozen target heading \"Rebuild Verb\" (anchor rebuild-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Dựng lại (rebuild) — thao tác phục hồi' (src line 1108) to 'Rebuild Verb' (target line 980): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "cfb4d9d1b43c6a4f40c13357f9d9124ae1977dd24ccd483d4016fe7c0bbe542e",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#dựng-lại-rebuild-thao-tác-phục-hồi`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: cf68d4bf824dc72a07225c03e2b68dfb8aac1608c37afbb1c81f02f6d4c0c5e5
Shown text SHA256: d43029ed9471b6ac584e60d6c86a61f5c91e6502556028cfb7bcf6e5f23b7d64

```text
### Dựng lại (rebuild) — thao tác phục hồi
```

Complete native target: `docs/platform/work-state/spec.md#rebuild-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: cfb4d9d1b43c6a4f40c13357f9d9124ae1977dd24ccd483d4016fe7c0bbe542e
Shown text SHA256: e6ea865132e222ee7ce35425400297f904f53921b83bd29501f2f4b08f8471e4

```text
### Rebuild Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Dựng lại (rebuild) — thao tác phục hồi
\ No newline at end of file
+### Rebuild Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0094

Entry kind: alias-accounting
Class: Judgment
Source digest: 500c384061cc02b264189e24bfe674ebff2c583be71df03b5a6f0b6bec371e48
Target digest: 19092cecd7a48ba649e05e533b65fe6c04e87c618c6b248c2517efd96bc85ee0

```json
{
  "aliasId": "root-authorities-draft-0094",
  "fromPath": "docs/specs/work-state.md#đọc-list-ready",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "list-and-ready-verbs",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0094",
  "claimId": "claim_d54d2955da490ed329bf2f80c4540800",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "đọc-list-ready",
  "sourceUnitDigest": "500c384061cc02b264189e24bfe674ebff2c583be71df03b5a6f0b6bec371e48",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "list-and-ready-verbs",
  "targetUnitDigest": "19092cecd7a48ba649e05e533b65fe6c04e87c618c6b248c2517efd96bc85ee0",
  "targetBrowserAnchor": "list-and-ready-verbs",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#đọc-list-ready`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 500c384061cc02b264189e24bfe674ebff2c583be71df03b5a6f0b6bec371e48
Shown text SHA256: 6119ac3600f596f0e22c458f89d0e72bfd26cef11126b55e465fdc68b7a73a1a

```text
### Đọc (list / ready)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#list-and-ready-verbs`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 19092cecd7a48ba649e05e533b65fe6c04e87c618c6b248c2517efd96bc85ee0
Shown text SHA256: c45f8a943eb58aa7450759f50e04797c0d06fc45b85c5446045566d6add83e46

```text
### List And Ready Verbs
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Đọc (list / ready)
\ No newline at end of file
+### List And Ready Verbs
\ No newline at end of file
```

### Existing decision evidence: claim_d54d2955da490ed329bf2f80c4540800

```json
{
  "claimId": "claim_d54d2955da490ed329bf2f80c4540800",
  "sourceUnitDigest": "500c384061cc02b2",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "list-and-ready-verbs",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1114 is carried as the frozen target heading \"List And Ready Verbs\" (anchor list-and-ready-verbs) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Đọc (list / ready)' (src line 1114) to 'List And Ready Verbs' (target line 986): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "19092cecd7a48ba649e05e533b65fe6c04e87c618c6b248c2517efd96bc85ee0",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#đọc-list-ready`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 500c384061cc02b264189e24bfe674ebff2c583be71df03b5a6f0b6bec371e48
Shown text SHA256: 6119ac3600f596f0e22c458f89d0e72bfd26cef11126b55e465fdc68b7a73a1a

```text
### Đọc (list / ready)
```

Complete native target: `docs/platform/work-state/spec.md#list-and-ready-verbs`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 19092cecd7a48ba649e05e533b65fe6c04e87c618c6b248c2517efd96bc85ee0
Shown text SHA256: c45f8a943eb58aa7450759f50e04797c0d06fc45b85c5446045566d6add83e46

```text
### List And Ready Verbs
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Đọc (list / ready)
\ No newline at end of file
+### List And Ready Verbs
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0095

Entry kind: alias-accounting
Class: Judgment
Source digest: 19f77860e0a9884073961f5d67eb3ba1a737c0d58f565c456ade9ab32d18eba4
Target digest: dcd7eb9471aac0ed9c6f305e7b3b8a671171f22b2009b5af8a7346d593323c6f

```json
{
  "aliasId": "root-authorities-draft-0095",
  "fromPath": "docs/specs/work-state.md#đọc-metrics-đồ-thị-graph-bề-mặt-đọc-thuần-str43",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "graph-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0095",
  "claimId": "claim_806561c52e1172c2bd94ba1e87a5a0b9",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "đọc-metrics-đồ-thị-graph-bề-mặt-đọc-thuần-str43",
  "sourceUnitDigest": "19f77860e0a9884073961f5d67eb3ba1a737c0d58f565c456ade9ab32d18eba4",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "graph-verb",
  "targetUnitDigest": "dcd7eb9471aac0ed9c6f305e7b3b8a671171f22b2009b5af8a7346d593323c6f",
  "targetBrowserAnchor": "graph-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#đọc-metrics-đồ-thị-graph-bề-mặt-đọc-thuần-str43`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 19f77860e0a9884073961f5d67eb3ba1a737c0d58f565c456ade9ab32d18eba4
Shown text SHA256: 36d1cf8d21152d7e7cbf7aebd6ed31c950e1e95464e7e42971168ab15c782bb5

```text
### Đọc metrics đồ thị (graph) — bề mặt đọc-thuần STR43
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#graph-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dcd7eb9471aac0ed9c6f305e7b3b8a671171f22b2009b5af8a7346d593323c6f
Shown text SHA256: fcd47b019685bc654773b425256cf1fe497275d1c9025c97a4709f54e5077120

```text
### Graph Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Đọc metrics đồ thị (graph) — bề mặt đọc-thuần STR43
\ No newline at end of file
+### Graph Verb
\ No newline at end of file
```

### Existing decision evidence: claim_806561c52e1172c2bd94ba1e87a5a0b9

```json
{
  "claimId": "claim_806561c52e1172c2bd94ba1e87a5a0b9",
  "sourceUnitDigest": "19f77860e0a98840",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "graph-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1120 is carried as the frozen target heading \"Graph Verb\" (anchor graph-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Đọc metrics đồ thị (graph) — bề mặt đọc-thuần ST' (src line 1120) to 'Graph Verb' (target line 992): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "dcd7eb9471aac0ed9c6f305e7b3b8a671171f22b2009b5af8a7346d593323c6f",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#đọc-metrics-đồ-thị-graph-bề-mặt-đọc-thuần-str43`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 19f77860e0a9884073961f5d67eb3ba1a737c0d58f565c456ade9ab32d18eba4
Shown text SHA256: 36d1cf8d21152d7e7cbf7aebd6ed31c950e1e95464e7e42971168ab15c782bb5

```text
### Đọc metrics đồ thị (graph) — bề mặt đọc-thuần STR43
```

Complete native target: `docs/platform/work-state/spec.md#graph-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dcd7eb9471aac0ed9c6f305e7b3b8a671171f22b2009b5af8a7346d593323c6f
Shown text SHA256: fcd47b019685bc654773b425256cf1fe497275d1c9025c97a4709f54e5077120

```text
### Graph Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Đọc metrics đồ thị (graph) — bề mặt đọc-thuần STR43
\ No newline at end of file
+### Graph Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0096

Entry kind: alias-accounting
Class: Judgment
Source digest: 882f67908c94739c9b12223fa8d9576d92fe6056131b013229b32652d3471d2f
Target digest: a20fc04fd5996f8baf9803dcf9430e973f0014f06b24fc3978b477b562c2672f

```json
{
  "aliasId": "root-authorities-draft-0096",
  "fromPath": "docs/specs/work-state.md#cố-vấn-item-kẹt-ở-doing-stale-đọc-thuần-không-tự-thu-hồi-s8",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "stale-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0096",
  "claimId": "claim_78b2df24acd3461e45462add5ee00a73",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "cố-vấn-item-kẹt-ở-doing-stale-đọc-thuần-không-tự-thu-hồi-s8",
  "sourceUnitDigest": "882f67908c94739c9b12223fa8d9576d92fe6056131b013229b32652d3471d2f",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "stale-verb",
  "targetUnitDigest": "a20fc04fd5996f8baf9803dcf9430e973f0014f06b24fc3978b477b562c2672f",
  "targetBrowserAnchor": "stale-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#cố-vấn-item-kẹt-ở-doing-stale-đọc-thuần-không-tự-thu-hồi-s8`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 882f67908c94739c9b12223fa8d9576d92fe6056131b013229b32652d3471d2f
Shown text SHA256: 69832a6178365f99381f4bce0243a05eb18c715bbc9c246568579bacfcdf9846

```text
### Cố vấn item kẹt ở `doing` (stale) — đọc-thuần, KHÔNG tự thu hồi (S8)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#stale-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a20fc04fd5996f8baf9803dcf9430e973f0014f06b24fc3978b477b562c2672f
Shown text SHA256: c21b41ded150af756086290041d72b25f0ed3369532539e79746a4166f8d56ac

```text
### Stale Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Cố vấn item kẹt ở `doing` (stale) — đọc-thuần, KHÔNG tự thu hồi (S8)
\ No newline at end of file
+### Stale Verb
\ No newline at end of file
```

### Existing decision evidence: claim_78b2df24acd3461e45462add5ee00a73

```json
{
  "claimId": "claim_78b2df24acd3461e45462add5ee00a73",
  "sourceUnitDigest": "882f67908c94739c",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "stale-verb",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1134 is carried as the frozen target heading \"Stale Verb\" (anchor stale-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Cố vấn item kẹt ở `doing` (stale) — đọc-thuần, K' (src line 1134) to 'Stale Verb' (target line 1006): payload and following-block digests equal on both sides so only the title changes; anchor ok, ancestry recomputed equal, section order kept, target unit and ancestry unchanged vs resume tree; rationale truthful",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "a20fc04fd5996f8baf9803dcf9430e973f0014f06b24fc3978b477b562c2672f",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#cố-vấn-item-kẹt-ở-doing-stale-đọc-thuần-không-tự-thu-hồi-s8`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 882f67908c94739c9b12223fa8d9576d92fe6056131b013229b32652d3471d2f
Shown text SHA256: 69832a6178365f99381f4bce0243a05eb18c715bbc9c246568579bacfcdf9846

```text
### Cố vấn item kẹt ở `doing` (stale) — đọc-thuần, KHÔNG tự thu hồi (S8)
```

Complete native target: `docs/platform/work-state/spec.md#stale-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a20fc04fd5996f8baf9803dcf9430e973f0014f06b24fc3978b477b562c2672f
Shown text SHA256: c21b41ded150af756086290041d72b25f0ed3369532539e79746a4166f8d56ac

```text
### Stale Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Cố vấn item kẹt ở `doing` (stale) — đọc-thuần, KHÔNG tự thu hồi (S8)
\ No newline at end of file
+### Stale Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0097

Entry kind: alias-accounting
Class: Judgment
Source digest: cd3c322e3683f39801eb3186a19f292428b41dba085f5031b33e87b05a6bb973
Target digest: d830f5412e1ce47c85290c83e5ec760bec631c0edc5b8b3d0c5c7c6b22e095df

```json
{
  "aliasId": "root-authorities-draft-0097",
  "fromPath": "docs/specs/work-state.md#cố-vấn-xung-đột-dấu-chân-file-conflicts-chống-đụng-độ-fan-out-song-song-s9",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "conflicts-verb",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0097",
  "claimId": "claim_a773a3b3e0730bd8624c641dc1671dd6",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "cố-vấn-xung-đột-dấu-chân-file-conflicts-chống-đụng-độ-fan-out-song-song-s9",
  "sourceUnitDigest": "cd3c322e3683f39801eb3186a19f292428b41dba085f5031b33e87b05a6bb973",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "conflicts-verb",
  "targetUnitDigest": "d830f5412e1ce47c85290c83e5ec760bec631c0edc5b8b3d0c5c7c6b22e095df",
  "targetBrowserAnchor": "conflicts-verb",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#cố-vấn-xung-đột-dấu-chân-file-conflicts-chống-đụng-độ-fan-out-song-song-s9`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: cd3c322e3683f39801eb3186a19f292428b41dba085f5031b33e87b05a6bb973
Shown text SHA256: 72872c8b0f70e7e58b5af6095458068d9bc9a5984fd21cb25844780ee1344fd1

```text
### Cố vấn xung đột dấu chân file (conflicts) — chống đụng độ fan-out song song (S9)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#conflicts-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: d830f5412e1ce47c85290c83e5ec760bec631c0edc5b8b3d0c5c7c6b22e095df
Shown text SHA256: da2af611da0795c3aa23fa0dbf5b7b033a9a93e3c9e46edd6b1f4c9089af13a2

```text
### Conflicts Verb
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Cố vấn xung đột dấu chân file (conflicts) — chống đụng độ fan-out song song (S9)
\ No newline at end of file
+### Conflicts Verb
\ No newline at end of file
```

### Existing decision evidence: claim_a773a3b3e0730bd8624c641dc1671dd6

```json
{
  "claimId": "claim_a773a3b3e0730bd8624c641dc1671dd6",
  "sourceUnitDigest": "cd3c322e3683f398",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "conflicts-verb",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "reviewed",
  "rationale": "Source heading at line 1142 is carried as the frozen target heading \"Conflicts Verb\" (anchor conflicts-verb) in the Behaviors And Operations section; the title is changed (English, punctuation and Vietnamese diacritics removed) per the heading registry, the section position is the same. Authorized A35 correction changes the whole target unit; A22 requires independent re-review, with no approval carried. Full original source, previous target and corrected target are shown; the false clauses are replaced by code-backed facts.",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewNote": "deep: heading 'Co van xung dot dau chan file (conflicts)' to 'Conflicts Verb' (H3 both): title-only change, digest moved because the section it heads contains the corrected U20 block; anchor ok, ancestry equal, digests recomputed match the shard.",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "d830f5412e1ce47c85290c83e5ec760bec631c0edc5b8b3d0c5c7c6b22e095df",
  "targetAncestry": [
    "Work State Specification",
    "9. Behaviors And Operations"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#cố-vấn-xung-đột-dấu-chân-file-conflicts-chống-đụng-độ-fan-out-song-song-s9`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: cd3c322e3683f39801eb3186a19f292428b41dba085f5031b33e87b05a6bb973
Shown text SHA256: 72872c8b0f70e7e58b5af6095458068d9bc9a5984fd21cb25844780ee1344fd1

```text
### Cố vấn xung đột dấu chân file (conflicts) — chống đụng độ fan-out song song (S9)
```

Complete native target: `docs/platform/work-state/spec.md#conflicts-verb`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: d830f5412e1ce47c85290c83e5ec760bec631c0edc5b8b3d0c5c7c6b22e095df
Shown text SHA256: da2af611da0795c3aa23fa0dbf5b7b033a9a93e3c9e46edd6b1f4c9089af13a2

```text
### Conflicts Verb
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Cố vấn xung đột dấu chân file (conflicts) — chống đụng độ fan-out song song (S9)
\ No newline at end of file
+### Conflicts Verb
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0098

Entry kind: alias-accounting
Class: Judgment
Source digest: c0b8898d1e7625e96ad4e254793a49ed66d3215ce2d833c0ecf8178756f53f4e
Target digest: 827361074e830d7578a9647026a99ed3167345d915247ea3b82cbfe48f718984

```json
{
  "aliasId": "root-authorities-draft-0098",
  "fromPath": "docs/specs/work-state.md#data-dictionary",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "3-work-item-data-dictionary",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0098",
  "claimId": "claim_4333c7a8ff0e32c7b69dc10ed113f25b",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "data-dictionary",
  "sourceUnitDigest": "c0b8898d1e7625e96ad4e254793a49ed66d3215ce2d833c0ecf8178756f53f4e",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "3-work-item-data-dictionary",
  "targetUnitDigest": "827361074e830d7578a9647026a99ed3167345d915247ea3b82cbfe48f718984",
  "targetBrowserAnchor": "3-work-item-data-dictionary",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#data-dictionary`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: c0b8898d1e7625e96ad4e254793a49ed66d3215ce2d833c0ecf8178756f53f4e
Shown text SHA256: 6cc7ecf970c8f1c10522fccb88a49b0a9787aee807f2caa1d5f41918aebe9b4d

```text
## Data Dictionary
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#3-work-item-data-dictionary`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 827361074e830d7578a9647026a99ed3167345d915247ea3b82cbfe48f718984
Shown text SHA256: c9fed4e28e8ca6b8753e84958d40d4472d6deb69c24a07eb94fd7db94ade87fd

```text
## 3. Work Item Data Dictionary
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-## Data Dictionary
\ No newline at end of file
+## 3. Work Item Data Dictionary
\ No newline at end of file
```

### Existing decision evidence: claim_4333c7a8ff0e32c7b69dc10ed113f25b

```json
{
  "claimId": "claim_4333c7a8ff0e32c7b69dc10ed113f25b",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "c0b8898d1e7625e9",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "3-work-item-data-dictionary",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H2 Data Dictionary is carried as the numbered H2 \"3. Work Item Data Dictionary\"; the title differs, the section scope is the same.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L40-40 (heading \"Data Dictionary\") -> spec.md#3-work-item-data-dictionary L50-50; targetOwner/targetAnchor spec.md#3-work-item-data-dictionary. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "827361074e830d7578a9647026a99ed3167345d915247ea3b82cbfe48f718984",
  "targetAncestry": [
    "Work State Specification"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#data-dictionary`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: c0b8898d1e7625e96ad4e254793a49ed66d3215ce2d833c0ecf8178756f53f4e
Shown text SHA256: 6cc7ecf970c8f1c10522fccb88a49b0a9787aee807f2caa1d5f41918aebe9b4d

```text
## Data Dictionary
```

Complete native target: `docs/platform/work-state/spec.md#3-work-item-data-dictionary`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 827361074e830d7578a9647026a99ed3167345d915247ea3b82cbfe48f718984
Shown text SHA256: c9fed4e28e8ca6b8753e84958d40d4472d6deb69c24a07eb94fd7db94ade87fd

```text
## 3. Work Item Data Dictionary
```

```diff
--- source
+++ target
@@ -1 +1 @@
-## Data Dictionary
\ No newline at end of file
+## 3. Work Item Data Dictionary
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0099

Entry kind: alias-accounting
Class: Judgment
Source digest: 602d948e76f9796ce23c9449b93b83321230de4dff8b8e58d84438647fb91e51
Target digest: a168e3fe6dda648968686b558ed3c53a94ff85685a8501224570d6462a348425

```json
{
  "aliasId": "root-authorities-draft-0099",
  "fromPath": "docs/specs/work-state.md#bản-ghi-kết-quả-outcome-dự-đoán-thực-tế",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "outcome-record",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0099",
  "claimId": "claim_f4fb783783bb1ad062f39d73e0165f86",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bản-ghi-kết-quả-outcome-dự-đoán-thực-tế",
  "sourceUnitDigest": "602d948e76f9796ce23c9449b93b83321230de4dff8b8e58d84438647fb91e51",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "outcome-record",
  "targetUnitDigest": "a168e3fe6dda648968686b558ed3c53a94ff85685a8501224570d6462a348425",
  "targetBrowserAnchor": "outcome-record",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bản-ghi-kết-quả-outcome-dự-đoán-thực-tế`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 602d948e76f9796ce23c9449b93b83321230de4dff8b8e58d84438647fb91e51
Shown text SHA256: 9d08aeb41db300f2507df8e4ad7a3bb44d7d324c6f9fef2050961c7a063ffd9e

```text
### Bản ghi kết quả (outcome) — dự đoán / thực tế
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#outcome-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a168e3fe6dda648968686b558ed3c53a94ff85685a8501224570d6462a348425
Shown text SHA256: d00bb7fe0690edf1f039570a6f0966a3f0585b2e9f43236d0cb41cae7ed75f55

```text
### Outcome Record
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi kết quả (outcome) — dự đoán / thực tế
\ No newline at end of file
+### Outcome Record
\ No newline at end of file
```

### Existing decision evidence: claim_f4fb783783bb1ad062f39d73e0165f86

```json
{
  "claimId": "claim_f4fb783783bb1ad062f39d73e0165f86",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "602d948e76f9796c",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "outcome-record",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 Outcome record becomes the H3 \"Outcome Record\" in the English-titled candidate; only the title changed.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L77-77 (heading \"Bản ghi kết quả (outcome) — dự đoán / thực tế\") -> spec.md#outcome-record L91-91; targetOwner/targetAnchor spec.md#outcome-record. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "a168e3fe6dda648968686b558ed3c53a94ff85685a8501224570d6462a348425",
  "targetAncestry": [
    "Work State Specification",
    "4. Capture And Evidence Records"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#bản-ghi-kết-quả-outcome-dự-đoán-thực-tế`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 602d948e76f9796ce23c9449b93b83321230de4dff8b8e58d84438647fb91e51
Shown text SHA256: 9d08aeb41db300f2507df8e4ad7a3bb44d7d324c6f9fef2050961c7a063ffd9e

```text
### Bản ghi kết quả (outcome) — dự đoán / thực tế
```

Complete native target: `docs/platform/work-state/spec.md#outcome-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a168e3fe6dda648968686b558ed3c53a94ff85685a8501224570d6462a348425
Shown text SHA256: d00bb7fe0690edf1f039570a6f0966a3f0585b2e9f43236d0cb41cae7ed75f55

```text
### Outcome Record
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi kết quả (outcome) — dự đoán / thực tế
\ No newline at end of file
+### Outcome Record
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0100

Entry kind: alias-accounting
Class: Judgment
Source digest: 35425ff8bd1cd9068ff6b1af5ba8a6b71a99e5fc8e74bce822f4609f90cfa0e6
Target digest: ec1aa6de3ff234de129cf1ac211eea608f176a68f472e589103900af32a0ab61

```json
{
  "aliasId": "root-authorities-draft-0100",
  "fromPath": "docs/specs/work-state.md#bản-ghi-friction-kênh-2-của-capture-phase-3-slice-2",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "friction-record",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0100",
  "claimId": "claim_3e0b2d8ae4ea0740c26e216e927e001b",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bản-ghi-friction-kênh-2-của-capture-phase-3-slice-2",
  "sourceUnitDigest": "35425ff8bd1cd9068ff6b1af5ba8a6b71a99e5fc8e74bce822f4609f90cfa0e6",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "friction-record",
  "targetUnitDigest": "ec1aa6de3ff234de129cf1ac211eea608f176a68f472e589103900af32a0ab61",
  "targetBrowserAnchor": "friction-record",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bản-ghi-friction-kênh-2-của-capture-phase-3-slice-2`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 35425ff8bd1cd9068ff6b1af5ba8a6b71a99e5fc8e74bce822f4609f90cfa0e6
Shown text SHA256: d9c0401253d04573b1d1ead0ff58ecc9a52b0c47d901a1fb47a522311ee65a63

```text
### Bản ghi friction — kênh 2 của capture (Phase 3 Slice 2)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#friction-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ec1aa6de3ff234de129cf1ac211eea608f176a68f472e589103900af32a0ab61
Shown text SHA256: 5ad5f6d4d9bf633d70e42c81dc474204c8a3a536bde4f3cc4f52cd8ffb40d70e

```text
### Friction Record
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi friction — kênh 2 của capture (Phase 3 Slice 2)
\ No newline at end of file
+### Friction Record
\ No newline at end of file
```

### Existing decision evidence: claim_3e0b2d8ae4ea0740c26e216e927e001b

```json
{
  "claimId": "claim_3e0b2d8ae4ea0740c26e216e927e001b",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "35425ff8bd1cd906",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "friction-record",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 Friction record becomes the H3 \"Friction Record\"; only the title differs.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L101-101 (heading \"Bản ghi friction — kênh 2 của capture (Phase 3 Slice 2)\") -> spec.md#friction-record L115-115; targetOwner/targetAnchor spec.md#friction-record. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "ec1aa6de3ff234de129cf1ac211eea608f176a68f472e589103900af32a0ab61",
  "targetAncestry": [
    "Work State Specification",
    "4. Capture And Evidence Records"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#bản-ghi-friction-kênh-2-của-capture-phase-3-slice-2`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 35425ff8bd1cd9068ff6b1af5ba8a6b71a99e5fc8e74bce822f4609f90cfa0e6
Shown text SHA256: d9c0401253d04573b1d1ead0ff58ecc9a52b0c47d901a1fb47a522311ee65a63

```text
### Bản ghi friction — kênh 2 của capture (Phase 3 Slice 2)
```

Complete native target: `docs/platform/work-state/spec.md#friction-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ec1aa6de3ff234de129cf1ac211eea608f176a68f472e589103900af32a0ab61
Shown text SHA256: 5ad5f6d4d9bf633d70e42c81dc474204c8a3a536bde4f3cc4f52cd8ffb40d70e

```text
### Friction Record
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi friction — kênh 2 của capture (Phase 3 Slice 2)
\ No newline at end of file
+### Friction Record
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0101

Entry kind: alias-accounting
Class: Judgment
Source digest: 4dfcb8bd258080c6df9bd6419877eb72b17fe78cb562f0e85b9b9457c7464ee2
Target digest: 5cb3e656cf57f4ae9600cf7a1f21d94aa85f767d626277391e23f559bf4f4436

```json
{
  "aliasId": "root-authorities-draft-0101",
  "fromPath": "docs/specs/work-state.md#bản-ghi-settlement-kênh-1-của-capture-2-kênh-phase-3-s3-closeout",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "settlement-record",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0101",
  "claimId": "claim_f7fe1d20b37bc8712bd364582e015c3b",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bản-ghi-settlement-kênh-1-của-capture-2-kênh-phase-3-s3-closeout",
  "sourceUnitDigest": "4dfcb8bd258080c6df9bd6419877eb72b17fe78cb562f0e85b9b9457c7464ee2",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "settlement-record",
  "targetUnitDigest": "5cb3e656cf57f4ae9600cf7a1f21d94aa85f767d626277391e23f559bf4f4436",
  "targetBrowserAnchor": "settlement-record",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bản-ghi-settlement-kênh-1-của-capture-2-kênh-phase-3-s3-closeout`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4dfcb8bd258080c6df9bd6419877eb72b17fe78cb562f0e85b9b9457c7464ee2
Shown text SHA256: e381544f1239b206ffbf038e5f2813ea0152f7b4ea6ea00952f82f265e569d6f

```text
### Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#settlement-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5cb3e656cf57f4ae9600cf7a1f21d94aa85f767d626277391e23f559bf4f4436
Shown text SHA256: c3c94bef9f48379d2a713940e486f30aaec60bf337f34352e2c46bc62dc8e82c

```text
### Settlement Record
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)
\ No newline at end of file
+### Settlement Record
\ No newline at end of file
```

### Existing decision evidence: claim_f7fe1d20b37bc8712bd364582e015c3b

```json
{
  "claimId": "claim_f7fe1d20b37bc8712bd364582e015c3b",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "4dfcb8bd258080c6",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "settlement-record",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 Settlement record becomes the H3 \"Settlement Record\"; only the title differs.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L123-123 (heading \"Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)\") -> spec.md#settlement-record L137-137; targetOwner/targetAnchor spec.md#settlement-record. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "5cb3e656cf57f4ae9600cf7a1f21d94aa85f767d626277391e23f559bf4f4436",
  "targetAncestry": [
    "Work State Specification",
    "4. Capture And Evidence Records"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#bản-ghi-settlement-kênh-1-của-capture-2-kênh-phase-3-s3-closeout`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4dfcb8bd258080c6df9bd6419877eb72b17fe78cb562f0e85b9b9457c7464ee2
Shown text SHA256: e381544f1239b206ffbf038e5f2813ea0152f7b4ea6ea00952f82f265e569d6f

```text
### Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)
```

Complete native target: `docs/platform/work-state/spec.md#settlement-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5cb3e656cf57f4ae9600cf7a1f21d94aa85f767d626277391e23f559bf4f4436
Shown text SHA256: c3c94bef9f48379d2a713940e486f30aaec60bf337f34352e2c46bc62dc8e82c

```text
### Settlement Record
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)
\ No newline at end of file
+### Settlement Record
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0102

Entry kind: alias-accounting
Class: Judgment
Source digest: 23ff78de6cfd39e47769fe92bcc0079e675f36fd2ff19e34fa61dbb6c8438992
Target digest: feea2119b2cc9f32fa0ab4f059db649d2db68e954726324f0caab96db3ec0d7e

```json
{
  "aliasId": "root-authorities-draft-0102",
  "fromPath": "docs/specs/work-state.md#danh-tính-người-ghi-writer-cá-thể-tách-bạch-khỏi-vai-str46-io-contract",
  "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "toAnchor": "writer-identity",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0102",
  "claimId": "claim_b846b2039547198ed6ff7d51f777f951",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "danh-tính-người-ghi-writer-cá-thể-tách-bạch-khỏi-vai-str46-io-contract",
  "sourceUnitDigest": "23ff78de6cfd39e47769fe92bcc0079e675f36fd2ff19e34fa61dbb6c8438992",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetNativeAnchor": "writer-identity",
  "targetUnitDigest": "feea2119b2cc9f32fa0ab4f059db649d2db68e954726324f0caab96db3ec0d7e",
  "targetBrowserAnchor": "writer-identity",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#danh-tính-người-ghi-writer-cá-thể-tách-bạch-khỏi-vai-str46-io-contract`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 23ff78de6cfd39e47769fe92bcc0079e675f36fd2ff19e34fa61dbb6c8438992
Shown text SHA256: 1f81832eafe4b1ee078a7c23e2cc24693969913cbfd5869df52031ac7f973ef4

```text
### Danh tính người ghi (writer) — cá thể, tách bạch khỏi vai (str46-io-contract)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/contracts/cli-io-contract.md#writer-identity`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: feea2119b2cc9f32fa0ab4f059db649d2db68e954726324f0caab96db3ec0d7e
Shown text SHA256: ddb9af3743bba30baf03085b11dc541da040d9bcfe0feb848a4312361a3545f8

```text
### Writer Identity
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Danh tính người ghi (writer) — cá thể, tách bạch khỏi vai (str46-io-contract)
\ No newline at end of file
+### Writer Identity
\ No newline at end of file
```

### Existing decision evidence: claim_b846b2039547198ed6ff7d51f777f951

```json
{
  "claimId": "claim_b846b2039547198ed6ff7d51f777f951",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "23ff78de6cfd39e4",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "writer-identity",
  "claimKind": "contract",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 writer identity is moved out of the spec into the contract document as \"Writer Identity\" (map section 4, contract kind); the title is English in the candidate, the heading unit itself carries no claim of its own.",
  "reviewNote": "Unchanged under A14. promote/contract: work-state.md L154-154 (heading \"Danh tính người ghi (writer) — cá thể, tách bạch khỏi vai (str46-io-contract)\") -> contracts/cli-io-contract.md#writer-identity L41-41; targetOwner/targetAnchor contracts/cli-io-contract.md#writer-identity. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "feea2119b2cc9f32fa0ab4f059db649d2db68e954726324f0caab96db3ec0d7e",
  "targetAncestry": [
    "CLI I/O Contract",
    "2. Input Direction Verb And Identity"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#danh-tính-người-ghi-writer-cá-thể-tách-bạch-khỏi-vai-str46-io-contract`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 23ff78de6cfd39e47769fe92bcc0079e675f36fd2ff19e34fa61dbb6c8438992
Shown text SHA256: 1f81832eafe4b1ee078a7c23e2cc24693969913cbfd5869df52031ac7f973ef4

```text
### Danh tính người ghi (writer) — cá thể, tách bạch khỏi vai (str46-io-contract)
```

Complete native target: `docs/platform/work-state/contracts/cli-io-contract.md#writer-identity`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: feea2119b2cc9f32fa0ab4f059db649d2db68e954726324f0caab96db3ec0d7e
Shown text SHA256: ddb9af3743bba30baf03085b11dc541da040d9bcfe0feb848a4312361a3545f8

```text
### Writer Identity
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Danh tính người ghi (writer) — cá thể, tách bạch khỏi vai (str46-io-contract)
\ No newline at end of file
+### Writer Identity
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0103

Entry kind: alias-accounting
Class: Judgment
Source digest: 8568529f121205ac649a38e9d0ec6fe91210011020f984cb6782b4623c313798
Target digest: f2388cf0fece03b5c1935ada5691f17bb210fa4a67efc9404fa236cc344fa0c8

```json
{
  "aliasId": "root-authorities-draft-0103",
  "fromPath": "docs/specs/work-state.md#bài-học-lúc-đóng-câu-6-tự-động-phase-3-s3-closeout",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "close-lesson-record",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0103",
  "claimId": "claim_270cbd193260c5730c24a2c8cbbf21b6",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bài-học-lúc-đóng-câu-6-tự-động-phase-3-s3-closeout",
  "sourceUnitDigest": "8568529f121205ac649a38e9d0ec6fe91210011020f984cb6782b4623c313798",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "close-lesson-record",
  "targetUnitDigest": "f2388cf0fece03b5c1935ada5691f17bb210fa4a67efc9404fa236cc344fa0c8",
  "targetBrowserAnchor": "close-lesson-record",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bài-học-lúc-đóng-câu-6-tự-động-phase-3-s3-closeout`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 8568529f121205ac649a38e9d0ec6fe91210011020f984cb6782b4623c313798
Shown text SHA256: afa248d47f039e1c387dbbb15911a21369a8a8d3ad7a04f86224c2f0cfa01be9

```text
### Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#close-lesson-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f2388cf0fece03b5c1935ada5691f17bb210fa4a67efc9404fa236cc344fa0c8
Shown text SHA256: cf08e1d8c57a3cb72e50a40ded8fd4186a02ee35a744bfad7d40a49b1f7b0fdf

```text
### Close Lesson Record
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)
\ No newline at end of file
+### Close Lesson Record
\ No newline at end of file
```

### Existing decision evidence: claim_270cbd193260c5730c24a2c8cbbf21b6

```json
{
  "claimId": "claim_270cbd193260c5730c24a2c8cbbf21b6",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "8568529f121205ac",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "close-lesson-record",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 close lesson record becomes the H3 \"Close Lesson Record\"; only the title differs.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L193-193 (heading \"Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)\") -> spec.md#close-lesson-record L168-168; targetOwner/targetAnchor spec.md#close-lesson-record. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "f2388cf0fece03b5c1935ada5691f17bb210fa4a67efc9404fa236cc344fa0c8",
  "targetAncestry": [
    "Work State Specification",
    "4. Capture And Evidence Records"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#bài-học-lúc-đóng-câu-6-tự-động-phase-3-s3-closeout`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 8568529f121205ac649a38e9d0ec6fe91210011020f984cb6782b4623c313798
Shown text SHA256: afa248d47f039e1c387dbbb15911a21369a8a8d3ad7a04f86224c2f0cfa01be9

```text
### Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)
```

Complete native target: `docs/platform/work-state/spec.md#close-lesson-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f2388cf0fece03b5c1935ada5691f17bb210fa4a67efc9404fa236cc344fa0c8
Shown text SHA256: cf08e1d8c57a3cb72e50a40ded8fd4186a02ee35a744bfad7d40a49b1f7b0fdf

```text
### Close Lesson Record
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)
\ No newline at end of file
+### Close Lesson Record
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0104

Entry kind: alias-accounting
Class: Judgment
Source digest: 2961cc00969bd31a1052857896a0fcb43cd23deb44255c61d05f92ee7ff8926b
Target digest: b10cf2bd9decaf289a3d1855118efec41de9d8b40ceeed1b56d699b500ca17a0

```json
{
  "aliasId": "root-authorities-draft-0104",
  "fromPath": "docs/specs/work-state.md#bản-ghi-cổng-người-gate-câu-hỏi-câu-trả-lời-ảnh-chụp-gốc",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "human-gate-record",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0104",
  "claimId": "claim_e9322d0e436e48b5d231ccd1b8bd441d",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bản-ghi-cổng-người-gate-câu-hỏi-câu-trả-lời-ảnh-chụp-gốc",
  "sourceUnitDigest": "2961cc00969bd31a1052857896a0fcb43cd23deb44255c61d05f92ee7ff8926b",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "human-gate-record",
  "targetUnitDigest": "b10cf2bd9decaf289a3d1855118efec41de9d8b40ceeed1b56d699b500ca17a0",
  "targetBrowserAnchor": "human-gate-record",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bản-ghi-cổng-người-gate-câu-hỏi-câu-trả-lời-ảnh-chụp-gốc`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2961cc00969bd31a1052857896a0fcb43cd23deb44255c61d05f92ee7ff8926b
Shown text SHA256: f5557ca14a4846f5f30c3d9d2b2fa97c2330f838398783ca88fab7bfe249c845

```text
### Bản ghi cổng-người (gate) — câu hỏi / câu trả lời / ảnh chụp gốc
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#human-gate-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b10cf2bd9decaf289a3d1855118efec41de9d8b40ceeed1b56d699b500ca17a0
Shown text SHA256: 6f753beacf8ac35dfabf31b4a630e700dcd491d10947ad0ca42ea18094189f60

```text
### Human Gate Record
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi cổng-người (gate) — câu hỏi / câu trả lời / ảnh chụp gốc
\ No newline at end of file
+### Human Gate Record
\ No newline at end of file
```

### Existing decision evidence: claim_e9322d0e436e48b5d231ccd1b8bd441d

```json
{
  "claimId": "claim_e9322d0e436e48b5d231ccd1b8bd441d",
  "authoredBy": "codex-session:21@2026-10-14",
  "sourceUnitDigest": "2961cc00969bd31a1052857896a0fcb43cd23deb44255c61d05f92ee7ff8926b",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "human-gate-record",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 human gate record becomes the H3 \"Human Gate Record\"; only the title differs. Authorized A35 correction changes the whole target unit; A22 requires independent re-review, with no approval carried. Full original source, previous target and corrected target are shown; the false clauses are replaced by code-backed facts.",
  "reviewNote": "deep: heading 'Ban ghi cong-nguoi (gate)' to 'Human Gate Record' (H3 both): title-only change, digest moved because the gate table row G4 below it was corrected; anchor ok, ancestry equal, digests recomputed match the shard.",
  "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
  "reviewedAt": "2026-10-14",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-truth-corrections.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "b10cf2bd9decaf289a3d1855118efec41de9d8b40ceeed1b56d699b500ca17a0",
  "targetAncestry": [
    "Work State Specification",
    "4. Capture And Evidence Records"
  ],
  "reviewReportCommit": "c3895c140e9fa02a4a5b9e9649049b1a906c6601"
}
```

Complete native source: `docs/specs/work-state.md#bản-ghi-cổng-người-gate-câu-hỏi-câu-trả-lời-ảnh-chụp-gốc`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2961cc00969bd31a1052857896a0fcb43cd23deb44255c61d05f92ee7ff8926b
Shown text SHA256: f5557ca14a4846f5f30c3d9d2b2fa97c2330f838398783ca88fab7bfe249c845

```text
### Bản ghi cổng-người (gate) — câu hỏi / câu trả lời / ảnh chụp gốc
```

Complete native target: `docs/platform/work-state/spec.md#human-gate-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b10cf2bd9decaf289a3d1855118efec41de9d8b40ceeed1b56d699b500ca17a0
Shown text SHA256: 6f753beacf8ac35dfabf31b4a630e700dcd491d10947ad0ca42ea18094189f60

```text
### Human Gate Record
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi cổng-người (gate) — câu hỏi / câu trả lời / ảnh chụp gốc
\ No newline at end of file
+### Human Gate Record
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0105

Entry kind: alias-accounting
Class: Judgment
Source digest: 1a2872c3adf3b233b75296aa3ba960b4678468a8f7c7a35807b0d13681c3bfe7
Target digest: 4b198e448003e829b23d32152cf3d51811de020e687a9a661b4868f327dfb836

```json
{
  "aliasId": "root-authorities-draft-0105",
  "fromPath": "docs/specs/work-state.md#work-không-còn-stage-bước-đến-từ-workflow-đường-đọc-dữ-liệu-cũ",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "workflow-step-replaces-stage",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0105",
  "claimId": "claim_eb9f287c141e9c763699b81d466f8561",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "work-không-còn-stage-bước-đến-từ-workflow-đường-đọc-dữ-liệu-cũ",
  "sourceUnitDigest": "1a2872c3adf3b233b75296aa3ba960b4678468a8f7c7a35807b0d13681c3bfe7",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "workflow-step-replaces-stage",
  "targetUnitDigest": "4b198e448003e829b23d32152cf3d51811de020e687a9a661b4868f327dfb836",
  "targetBrowserAnchor": "workflow-step-replaces-stage",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#work-không-còn-stage-bước-đến-từ-workflow-đường-đọc-dữ-liệu-cũ`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 1a2872c3adf3b233b75296aa3ba960b4678468a8f7c7a35807b0d13681c3bfe7
Shown text SHA256: e7f07fc4f6cd094e3933190557f72067d6cd1ada996feb8ce7bfe780f64a0538

```text
### Work không còn `stage` — bước đến từ Workflow (đường đọc dữ liệu cũ)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#workflow-step-replaces-stage`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4b198e448003e829b23d32152cf3d51811de020e687a9a661b4868f327dfb836
Shown text SHA256: ad51a25e6edc403209d9fa369e8530a1a4bc79c3cd3d23abb7de4b6a3982ed9f

```text
### Workflow Step Replaces Stage
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Work không còn `stage` — bước đến từ Workflow (đường đọc dữ liệu cũ)
\ No newline at end of file
+### Workflow Step Replaces Stage
\ No newline at end of file
```

### Existing decision evidence: claim_eb9f287c141e9c763699b81d466f8561

```json
{
  "claimId": "claim_eb9f287c141e9c763699b81d466f8561",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "1a2872c3adf3b233",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "workflow-step-replaces-stage",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 about work no longer carrying stage becomes \"Workflow Step Replaces Stage\"; title changed.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L239-239 (heading \"Work không còn `stage` — bước đến từ Workflow (đường đọc dữ liệu cũ)\") -> spec.md#workflow-step-replaces-stage L236-236; targetOwner/targetAnchor spec.md#workflow-step-replaces-stage. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "4b198e448003e829b23d32152cf3d51811de020e687a9a661b4868f327dfb836",
  "targetAncestry": [
    "Work State Specification",
    "5. Workflow Step And Stage Model"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#work-không-còn-stage-bước-đến-từ-workflow-đường-đọc-dữ-liệu-cũ`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 1a2872c3adf3b233b75296aa3ba960b4678468a8f7c7a35807b0d13681c3bfe7
Shown text SHA256: e7f07fc4f6cd094e3933190557f72067d6cd1ada996feb8ce7bfe780f64a0538

```text
### Work không còn `stage` — bước đến từ Workflow (đường đọc dữ liệu cũ)
```

Complete native target: `docs/platform/work-state/spec.md#workflow-step-replaces-stage`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4b198e448003e829b23d32152cf3d51811de020e687a9a661b4868f327dfb836
Shown text SHA256: ad51a25e6edc403209d9fa369e8530a1a4bc79c3cd3d23abb7de4b6a3982ed9f

```text
### Workflow Step Replaces Stage
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Work không còn `stage` — bước đến từ Workflow (đường đọc dữ liệu cũ)
\ No newline at end of file
+### Workflow Step Replaces Stage
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0106

Entry kind: alias-accounting
Class: Judgment
Source digest: 64d0a5ff2b07f4c135d408d40c6e5cde0edd69223d287eeca7a0dad2696d64cd
Target digest: fd8dbb8574d07360d5c80574ef2031a6e68e0b78e375379a1a255d89b838152a

```json
{
  "aliasId": "root-authorities-draft-0106",
  "fromPath": "docs/specs/work-state.md#giai-đoạn-soi-rõ-bước-discovery-và-đào-sâu-bước-exploring",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "discovery-and-exploring-stages",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0106",
  "claimId": "claim_0c44dd8aa02800039adbb9c39e5a11c7",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "giai-đoạn-soi-rõ-bước-discovery-và-đào-sâu-bước-exploring",
  "sourceUnitDigest": "64d0a5ff2b07f4c135d408d40c6e5cde0edd69223d287eeca7a0dad2696d64cd",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "discovery-and-exploring-stages",
  "targetUnitDigest": "fd8dbb8574d07360d5c80574ef2031a6e68e0b78e375379a1a255d89b838152a",
  "targetBrowserAnchor": "discovery-and-exploring-stages",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#giai-đoạn-soi-rõ-bước-discovery-và-đào-sâu-bước-exploring`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 64d0a5ff2b07f4c135d408d40c6e5cde0edd69223d287eeca7a0dad2696d64cd
Shown text SHA256: 0c9654d9bb00bcf260f1483c75f404b7eb572f31a559852673ad39da382a0780

```text
### Giai đoạn Soi-rõ (bước discovery) và Đào-sâu (bước exploring)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#discovery-and-exploring-stages`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: fd8dbb8574d07360d5c80574ef2031a6e68e0b78e375379a1a255d89b838152a
Shown text SHA256: 7c1457865a2f6e52c314a32c700c0eae3fe6e3f2c5baf5748447d89746d2376e

```text
### Discovery And Exploring Stages
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Giai đoạn Soi-rõ (bước discovery) và Đào-sâu (bước exploring)
\ No newline at end of file
+### Discovery And Exploring Stages
\ No newline at end of file
```

### Existing decision evidence: claim_0c44dd8aa02800039adbb9c39e5a11c7

```json
{
  "claimId": "claim_0c44dd8aa02800039adbb9c39e5a11c7",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "64d0a5ff2b07f4c1",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "discovery-and-exploring-stages",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 on the discovery and exploring stages becomes \"Discovery And Exploring Stages\"; title changed.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L264-264 (heading \"Giai đoạn Soi-rõ (bước discovery) và Đào-sâu (bước exploring)\") -> spec.md#discovery-and-exploring-stages L261-261; targetOwner/targetAnchor spec.md#discovery-and-exploring-stages. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "fd8dbb8574d07360d5c80574ef2031a6e68e0b78e375379a1a255d89b838152a",
  "targetAncestry": [
    "Work State Specification",
    "5. Workflow Step And Stage Model"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#giai-đoạn-soi-rõ-bước-discovery-và-đào-sâu-bước-exploring`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 64d0a5ff2b07f4c135d408d40c6e5cde0edd69223d287eeca7a0dad2696d64cd
Shown text SHA256: 0c9654d9bb00bcf260f1483c75f404b7eb572f31a559852673ad39da382a0780

```text
### Giai đoạn Soi-rõ (bước discovery) và Đào-sâu (bước exploring)
```

Complete native target: `docs/platform/work-state/spec.md#discovery-and-exploring-stages`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: fd8dbb8574d07360d5c80574ef2031a6e68e0b78e375379a1a255d89b838152a
Shown text SHA256: 7c1457865a2f6e52c314a32c700c0eae3fe6e3f2c5baf5748447d89746d2376e

```text
### Discovery And Exploring Stages
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Giai đoạn Soi-rõ (bước discovery) và Đào-sâu (bước exploring)
\ No newline at end of file
+### Discovery And Exploring Stages
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0107

Entry kind: alias-accounting
Class: Judgment
Source digest: 59597f01695814b2e968c2061f6d9803fbf2da09a8a5614dd6144433c4936433
Target digest: b54621bc3c29c78c30db728bd19468892d5b74aa8e1389ca478778cfd1c9c915

```json
{
  "aliasId": "root-authorities-draft-0107",
  "fromPath": "docs/specs/work-state.md#bản-ghi-cổng-discovery",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "discovery-gate-record",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0107",
  "claimId": "claim_8ddaf275a9286c13d4d7b21c67477ef4",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bản-ghi-cổng-discovery",
  "sourceUnitDigest": "59597f01695814b2e968c2061f6d9803fbf2da09a8a5614dd6144433c4936433",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "discovery-gate-record",
  "targetUnitDigest": "b54621bc3c29c78c30db728bd19468892d5b74aa8e1389ca478778cfd1c9c915",
  "targetBrowserAnchor": "discovery-gate-record",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bản-ghi-cổng-discovery`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 59597f01695814b2e968c2061f6d9803fbf2da09a8a5614dd6144433c4936433
Shown text SHA256: 7300c158a6e517affbd4cfd59c27417be488b10e80dc94c263fd39dc9da9bf98

```text
### Bản ghi cổng discovery
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#discovery-gate-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b54621bc3c29c78c30db728bd19468892d5b74aa8e1389ca478778cfd1c9c915
Shown text SHA256: b4da572b95ac8a1bc9bb25bbd75ef55aa710a9c65532da22eefb3711ae232dde

```text
### Discovery Gate Record
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi cổng discovery
\ No newline at end of file
+### Discovery Gate Record
\ No newline at end of file
```

### Existing decision evidence: claim_8ddaf275a9286c13d4d7b21c67477ef4

```json
{
  "claimId": "claim_8ddaf275a9286c13d4d7b21c67477ef4",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "59597f01695814b2",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "discovery-gate-record",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 discovery gate record becomes \"Discovery Gate Record\"; title changed.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L339-339 (heading \"Bản ghi cổng discovery\") -> spec.md#discovery-gate-record L214-214; targetOwner/targetAnchor spec.md#discovery-gate-record. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "b54621bc3c29c78c30db728bd19468892d5b74aa8e1389ca478778cfd1c9c915",
  "targetAncestry": [
    "Work State Specification",
    "4. Capture And Evidence Records"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#bản-ghi-cổng-discovery`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 59597f01695814b2e968c2061f6d9803fbf2da09a8a5614dd6144433c4936433
Shown text SHA256: 7300c158a6e517affbd4cfd59c27417be488b10e80dc94c263fd39dc9da9bf98

```text
### Bản ghi cổng discovery
```

Complete native target: `docs/platform/work-state/spec.md#discovery-gate-record`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b54621bc3c29c78c30db728bd19468892d5b74aa8e1389ca478778cfd1c9c915
Shown text SHA256: b4da572b95ac8a1bc9bb25bbd75ef55aa710a9c65532da22eefb3711ae232dde

```text
### Discovery Gate Record
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Bản ghi cổng discovery
\ No newline at end of file
+### Discovery Gate Record
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0108

Entry kind: alias-accounting
Class: Judgment
Source digest: e9ddd76efbdba56b6f3481090144b98922455ebf9fc2eab52d636234a75c85d9
Target digest: ad4b3ce7e44af669b6d5a850c82c1127c6bb32dfe343da691e1d7a1ab2c53ab2

```json
{
  "aliasId": "root-authorities-draft-0108",
  "fromPath": "docs/specs/work-state.md#giai-đoạn-lập-kế-hoạch-stage-planning",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "planning-stage",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0108",
  "claimId": "claim_44e9aa951025f9b7e71066c325ec7df1",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "giai-đoạn-lập-kế-hoạch-stage-planning",
  "sourceUnitDigest": "e9ddd76efbdba56b6f3481090144b98922455ebf9fc2eab52d636234a75c85d9",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "planning-stage",
  "targetUnitDigest": "ad4b3ce7e44af669b6d5a850c82c1127c6bb32dfe343da691e1d7a1ab2c53ab2",
  "targetBrowserAnchor": "planning-stage",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#giai-đoạn-lập-kế-hoạch-stage-planning`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e9ddd76efbdba56b6f3481090144b98922455ebf9fc2eab52d636234a75c85d9
Shown text SHA256: 593082a3d4d4cf310c5a546ee5609a2901fcbf1264b1e2ff81cd1c08af32b42f

```text
### Giai đoạn Lập-kế-hoạch (stage planning)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#planning-stage`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ad4b3ce7e44af669b6d5a850c82c1127c6bb32dfe343da691e1d7a1ab2c53ab2
Shown text SHA256: 51d479b399dd5799039126095b983a0cc2fab2052da94f11450231157066bb8c

```text
### Planning Stage
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Giai đoạn Lập-kế-hoạch (stage planning)
\ No newline at end of file
+### Planning Stage
\ No newline at end of file
```

### Existing decision evidence: claim_44e9aa951025f9b7e71066c325ec7df1

```json
{
  "claimId": "claim_44e9aa951025f9b7e71066c325ec7df1",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "e9ddd76efbdba56b",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "planning-stage",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 on the planning stage becomes \"Planning Stage\"; title changed.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L357-357 (heading \"Giai đoạn Lập-kế-hoạch (stage planning)\") -> spec.md#planning-stage L336-336; targetOwner/targetAnchor spec.md#planning-stage. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "ad4b3ce7e44af669b6d5a850c82c1127c6bb32dfe343da691e1d7a1ab2c53ab2",
  "targetAncestry": [
    "Work State Specification",
    "5. Workflow Step And Stage Model"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#giai-đoạn-lập-kế-hoạch-stage-planning`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e9ddd76efbdba56b6f3481090144b98922455ebf9fc2eab52d636234a75c85d9
Shown text SHA256: 593082a3d4d4cf310c5a546ee5609a2901fcbf1264b1e2ff81cd1c08af32b42f

```text
### Giai đoạn Lập-kế-hoạch (stage planning)
```

Complete native target: `docs/platform/work-state/spec.md#planning-stage`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ad4b3ce7e44af669b6d5a850c82c1127c6bb32dfe343da691e1d7a1ab2c53ab2
Shown text SHA256: 51d479b399dd5799039126095b983a0cc2fab2052da94f11450231157066bb8c

```text
### Planning Stage
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Giai đoạn Lập-kế-hoạch (stage planning)
\ No newline at end of file
+### Planning Stage
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0109

Entry kind: alias-accounting
Class: Judgment
Source digest: a90d38d0af33deb55244511fec2419e6b9009cef53e33c59caa52c392e89bba4
Target digest: 4b12f710732bcb366502200ee43245c3ea649ab7ea953f79748ad6e2ad02cd77

```json
{
  "aliasId": "root-authorities-draft-0109",
  "fromPath": "docs/specs/work-state.md#mô-hình-domain-base-workflow-domain-extension",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "6-domain-model",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0109",
  "claimId": "claim_79b8aa6e1e59ca0593c2e3f1a409a459",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "mô-hình-domain-base-workflow-domain-extension",
  "sourceUnitDigest": "a90d38d0af33deb55244511fec2419e6b9009cef53e33c59caa52c392e89bba4",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "6-domain-model",
  "targetUnitDigest": "4b12f710732bcb366502200ee43245c3ea649ab7ea953f79748ad6e2ad02cd77",
  "targetBrowserAnchor": "6-domain-model",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#mô-hình-domain-base-workflow-domain-extension`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a90d38d0af33deb55244511fec2419e6b9009cef53e33c59caa52c392e89bba4
Shown text SHA256: 64105e221583022b93d5e3df37534c2f6059871167f93e4d7b15eae703f8cc46

```text
### Mô hình domain (base-workflow + domain-extension)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#6-domain-model`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4b12f710732bcb366502200ee43245c3ea649ab7ea953f79748ad6e2ad02cd77
Shown text SHA256: 6f01bc2f4eb8b9e2bf74a9919fcaffdaa524741f89b1caafcc3f3aa0a0f17993

```text
## 6. Domain Model
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Mô hình domain (base-workflow + domain-extension)
\ No newline at end of file
+## 6. Domain Model
\ No newline at end of file
```

### Existing decision evidence: claim_79b8aa6e1e59ca0593c2e3f1a409a459

```json
{
  "claimId": "claim_79b8aa6e1e59ca0593c2e3f1a409a459",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "a90d38d0af33deb5",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "6-domain-model",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 domain model becomes the numbered H2 \"6. Domain Model\"; level and title changed, same scope.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L441-441 (heading \"Mô hình domain (base-workflow + domain-extension)\") -> spec.md#6-domain-model L420-420; targetOwner/targetAnchor spec.md#6-domain-model. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "4b12f710732bcb366502200ee43245c3ea649ab7ea953f79748ad6e2ad02cd77",
  "targetAncestry": [
    "Work State Specification"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#mô-hình-domain-base-workflow-domain-extension`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a90d38d0af33deb55244511fec2419e6b9009cef53e33c59caa52c392e89bba4
Shown text SHA256: 64105e221583022b93d5e3df37534c2f6059871167f93e4d7b15eae703f8cc46

```text
### Mô hình domain (base-workflow + domain-extension)
```

Complete native target: `docs/platform/work-state/spec.md#6-domain-model`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 4b12f710732bcb366502200ee43245c3ea649ab7ea953f79748ad6e2ad02cd77
Shown text SHA256: 6f01bc2f4eb8b9e2bf74a9919fcaffdaa524741f89b1caafcc3f3aa0a0f17993

```text
## 6. Domain Model
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Mô hình domain (base-workflow + domain-extension)
\ No newline at end of file
+## 6. Domain Model
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0110

Entry kind: alias-accounting
Class: Judgment
Source digest: a5dd45a68b5d86032779280701828b283538eb27913613662cda41cb98ce93e8
Target digest: 69eb01f3f5134b71523424d41de4c6e5215d81a6c0448dec0ae378e3eb3cbb97

```json
{
  "aliasId": "root-authorities-draft-0110",
  "fromPath": "docs/specs/work-state.md#cửa-pull-giaonhận-việc-takereturn",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "7-pull-door-take-and-return",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0110",
  "claimId": "claim_34205657a84c4f1e6610db2ea48aecde",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "cửa-pull-giaonhận-việc-takereturn",
  "sourceUnitDigest": "a5dd45a68b5d86032779280701828b283538eb27913613662cda41cb98ce93e8",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "7-pull-door-take-and-return",
  "targetUnitDigest": "69eb01f3f5134b71523424d41de4c6e5215d81a6c0448dec0ae378e3eb3cbb97",
  "targetBrowserAnchor": "7-pull-door-take-and-return",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#cửa-pull-giaonhận-việc-takereturn`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a5dd45a68b5d86032779280701828b283538eb27913613662cda41cb98ce93e8
Shown text SHA256: cc712eff8334a70e9826f9853d28d0c1fe7c0a8056bb43b478866bb631540dd5

```text
### Cửa pull giao–nhận việc (take/return)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#7-pull-door-take-and-return`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 69eb01f3f5134b71523424d41de4c6e5215d81a6c0448dec0ae378e3eb3cbb97
Shown text SHA256: c460595062b903113c06ecfe2a0d6040c2230a4ec833dbbf349dc4f4f7d5fa4e

```text
## 7. Pull Door Take And Return
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Cửa pull giao–nhận việc (take/return)
\ No newline at end of file
+## 7. Pull Door Take And Return
\ No newline at end of file
```

### Existing decision evidence: claim_34205657a84c4f1e6610db2ea48aecde

```json
{
  "claimId": "claim_34205657a84c4f1e6610db2ea48aecde",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "a5dd45a68b5d8603",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "7-pull-door-take-and-return",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 pull door becomes the numbered H2 \"7. Pull Door Take And Return\"; level and title changed.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L538-538 (heading \"Cửa pull giao–nhận việc (take/return)\") -> spec.md#7-pull-door-take-and-return L517-517; targetOwner/targetAnchor spec.md#7-pull-door-take-and-return. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "69eb01f3f5134b71523424d41de4c6e5215d81a6c0448dec0ae378e3eb3cbb97",
  "targetAncestry": [
    "Work State Specification"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#cửa-pull-giaonhận-việc-takereturn`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a5dd45a68b5d86032779280701828b283538eb27913613662cda41cb98ce93e8
Shown text SHA256: cc712eff8334a70e9826f9853d28d0c1fe7c0a8056bb43b478866bb631540dd5

```text
### Cửa pull giao–nhận việc (take/return)
```

Complete native target: `docs/platform/work-state/spec.md#7-pull-door-take-and-return`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 69eb01f3f5134b71523424d41de4c6e5215d81a6c0448dec0ae378e3eb3cbb97
Shown text SHA256: c460595062b903113c06ecfe2a0d6040c2230a4ec833dbbf349dc4f4f7d5fa4e

```text
## 7. Pull Door Take And Return
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Cửa pull giao–nhận việc (take/return)
\ No newline at end of file
+## 7. Pull Door Take And Return
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0111

Entry kind: alias-accounting
Class: Judgment
Source digest: 22ca034a916c92fed5827df34ad5e3db32bbb5eb41fbd63603054595819fdb0a
Target digest: 7949ca542ba953e6f041b76bd0440493df4879bb72d157566ce0346a59d5d75f

```json
{
  "aliasId": "root-authorities-draft-0111",
  "fromPath": "docs/specs/work-state.md#cửa-pull-mở-rộng-hoàn-tất-một-đề-xuất-nguồn-nhánh-bị-đỗ",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "branch-proposal-completion",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0111",
  "claimId": "claim_d2b3576164c7a12b25979e8dfb68d7b5",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "cửa-pull-mở-rộng-hoàn-tất-một-đề-xuất-nguồn-nhánh-bị-đỗ",
  "sourceUnitDigest": "22ca034a916c92fed5827df34ad5e3db32bbb5eb41fbd63603054595819fdb0a",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "branch-proposal-completion",
  "targetUnitDigest": "7949ca542ba953e6f041b76bd0440493df4879bb72d157566ce0346a59d5d75f",
  "targetBrowserAnchor": "branch-proposal-completion",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#cửa-pull-mở-rộng-hoàn-tất-một-đề-xuất-nguồn-nhánh-bị-đỗ`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 22ca034a916c92fed5827df34ad5e3db32bbb5eb41fbd63603054595819fdb0a
Shown text SHA256: 2c96f9db9b22485596104c7530f732ef675a03047c0073de3d3bf8e6efc6a079

```text
#### Cửa pull mở rộng: hoàn tất một đề xuất nguồn-nhánh bị đỗ
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#branch-proposal-completion`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 7949ca542ba953e6f041b76bd0440493df4879bb72d157566ce0346a59d5d75f
Shown text SHA256: 8967d4201017532016044a756dda0cbf727f879062107ca1de4ec63eb84c376b

```text
### Branch Proposal Completion
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Cửa pull mở rộng: hoàn tất một đề xuất nguồn-nhánh bị đỗ
\ No newline at end of file
+### Branch Proposal Completion
\ No newline at end of file
```

### Existing decision evidence: claim_d2b3576164c7a12b25979e8dfb68d7b5

```json
{
  "claimId": "claim_d2b3576164c7a12b25979e8dfb68d7b5",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "22ca034a916c92fe",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "branch-proposal-completion",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H4 on completing a parked branch proposal becomes the H3 \"Branch Proposal Completion\"; level and title changed.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L587-587 (heading \"Cửa pull mở rộng: hoàn tất một đề xuất nguồn-nhánh bị đỗ\") -> spec.md#branch-proposal-completion L566-566; targetOwner/targetAnchor spec.md#branch-proposal-completion. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "7949ca542ba953e6f041b76bd0440493df4879bb72d157566ce0346a59d5d75f",
  "targetAncestry": [
    "Work State Specification",
    "7. Pull Door Take And Return"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#cửa-pull-mở-rộng-hoàn-tất-một-đề-xuất-nguồn-nhánh-bị-đỗ`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 22ca034a916c92fed5827df34ad5e3db32bbb5eb41fbd63603054595819fdb0a
Shown text SHA256: 2c96f9db9b22485596104c7530f732ef675a03047c0073de3d3bf8e6efc6a079

```text
#### Cửa pull mở rộng: hoàn tất một đề xuất nguồn-nhánh bị đỗ
```

Complete native target: `docs/platform/work-state/spec.md#branch-proposal-completion`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 7949ca542ba953e6f041b76bd0440493df4879bb72d157566ce0346a59d5d75f
Shown text SHA256: 8967d4201017532016044a756dda0cbf727f879062107ca1de4ec63eb84c376b

```text
### Branch Proposal Completion
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Cửa pull mở rộng: hoàn tất một đề xuất nguồn-nhánh bị đỗ
\ No newline at end of file
+### Branch Proposal Completion
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0112

Entry kind: alias-accounting
Class: Judgment
Source digest: 69ec031b67cb5fcd1a62982e9310e0bf5bae352f31d650e1d85141a0f82dd99d
Target digest: 66e458351046f7cb0b354aed583e73c70e99bab5f1ef4eb25f69ca0742e176c7

```json
{
  "aliasId": "root-authorities-draft-0112",
  "fromPath": "docs/specs/work-state.md#phong-bì-output-envelope-chuẩn-máy-đọc-của-mọi-verb-per-d-b2d18cc7-b0da87aa",
  "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "toAnchor": "envelope-shape",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0112",
  "claimId": "claim_2b2aa99a73a8e330673e26d15ac171e3",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "phong-bì-output-envelope-chuẩn-máy-đọc-của-mọi-verb-per-d-b2d18cc7-b0da87aa",
  "sourceUnitDigest": "69ec031b67cb5fcd1a62982e9310e0bf5bae352f31d650e1d85141a0f82dd99d",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetNativeAnchor": "envelope-shape",
  "targetUnitDigest": "66e458351046f7cb0b354aed583e73c70e99bab5f1ef4eb25f69ca0742e176c7",
  "targetBrowserAnchor": "envelope-shape",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#phong-bì-output-envelope-chuẩn-máy-đọc-của-mọi-verb-per-d-b2d18cc7-b0da87aa`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 69ec031b67cb5fcd1a62982e9310e0bf5bae352f31d650e1d85141a0f82dd99d
Shown text SHA256: 6e96783413d7fff5d677119cebda0b5b1a45c3017012ecb82abca668f22c46fd

```text
### Phong bì output (envelope) — chuẩn máy-đọc của MỌI verb (per D b2d18cc7, b0da87aa)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/contracts/cli-io-contract.md#envelope-shape`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 66e458351046f7cb0b354aed583e73c70e99bab5f1ef4eb25f69ca0742e176c7
Shown text SHA256: 11c344dbfce90e3ec298463ad09623a1b068e13974b8a6edf77789fb20ec5327

```text
### Envelope Shape
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Phong bì output (envelope) — chuẩn máy-đọc của MỌI verb (per D b2d18cc7, b0da87aa)
\ No newline at end of file
+### Envelope Shape
\ No newline at end of file
```

### Existing decision evidence: claim_2b2aa99a73a8e330673e26d15ac171e3

```json
{
  "claimId": "claim_2b2aa99a73a8e330673e26d15ac171e3",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "69ec031b67cb5fcd",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "envelope-shape",
  "claimKind": "contract",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 envelope becomes \"Envelope Shape\" under the contract document (map section 4); title changed and the claim kind is contract, not specification.",
  "reviewNote": "Unchanged under A14. promote/contract: work-state.md L622-622 (heading \"Phong bì output (envelope) — chuẩn máy-đọc của MỌI verb (per D b2d18cc7, b0da87aa)\") -> contracts/cli-io-contract.md#envelope-shape L113-113; targetOwner/targetAnchor contracts/cli-io-contract.md#envelope-shape. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "66e458351046f7cb0b354aed583e73c70e99bab5f1ef4eb25f69ca0742e176c7",
  "targetAncestry": [
    "CLI I/O Contract",
    "3. Output Direction Unified Envelope"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#phong-bì-output-envelope-chuẩn-máy-đọc-của-mọi-verb-per-d-b2d18cc7-b0da87aa`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 69ec031b67cb5fcd1a62982e9310e0bf5bae352f31d650e1d85141a0f82dd99d
Shown text SHA256: 6e96783413d7fff5d677119cebda0b5b1a45c3017012ecb82abca668f22c46fd

```text
### Phong bì output (envelope) — chuẩn máy-đọc của MỌI verb (per D b2d18cc7, b0da87aa)
```

Complete native target: `docs/platform/work-state/contracts/cli-io-contract.md#envelope-shape`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 66e458351046f7cb0b354aed583e73c70e99bab5f1ef4eb25f69ca0742e176c7
Shown text SHA256: 11c344dbfce90e3ec298463ad09623a1b068e13974b8a6edf77789fb20ec5327

```text
### Envelope Shape
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Phong bì output (envelope) — chuẩn máy-đọc của MỌI verb (per D b2d18cc7, b0da87aa)
\ No newline at end of file
+### Envelope Shape
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0113

Entry kind: alias-accounting
Class: Judgment
Source digest: 9dcfe09c6bf68c7ba877bff28dba42ef7c502a932bb9ec1c97b83766c1c216d3
Target digest: f7201259d68259d70be0b14e5989837d13de80f1a0f46817c02bca93603a9250

```json
{
  "aliasId": "root-authorities-draft-0113",
  "fromPath": "docs/specs/work-state.md#sổ-verb-máy-đọc-manifest---help---json",
  "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "toAnchor": "manifest-shape",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0113",
  "claimId": "claim_9c6c68acbcd413ec5d826804b07650c0",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "sổ-verb-máy-đọc-manifest---help---json",
  "sourceUnitDigest": "9dcfe09c6bf68c7ba877bff28dba42ef7c502a932bb9ec1c97b83766c1c216d3",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetNativeAnchor": "manifest-shape",
  "targetUnitDigest": "f7201259d68259d70be0b14e5989837d13de80f1a0f46817c02bca93603a9250",
  "targetBrowserAnchor": "manifest-shape",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#sổ-verb-máy-đọc-manifest---help---json`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9dcfe09c6bf68c7ba877bff28dba42ef7c502a932bb9ec1c97b83766c1c216d3
Shown text SHA256: 3a6751501e6195d2085a9412169fc0e08f73d7f135c484b032d14c6754325bae

```text
### Sổ verb máy-đọc (manifest) — `--help --json`
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/contracts/cli-io-contract.md#manifest-shape`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f7201259d68259d70be0b14e5989837d13de80f1a0f46817c02bca93603a9250
Shown text SHA256: dfee92cc2e2abee498c90fae7c5939752209b37fccebd85a1252b9bfe75685e9

```text
### Manifest Shape
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Sổ verb máy-đọc (manifest) — `--help --json`
\ No newline at end of file
+### Manifest Shape
\ No newline at end of file
```

### Existing decision evidence: claim_9c6c68acbcd413ec5d826804b07650c0

```json
{
  "claimId": "claim_9c6c68acbcd413ec5d826804b07650c0",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "9dcfe09c6bf68c7b",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "manifest-shape",
  "claimKind": "contract",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 manifest becomes \"Manifest Shape\" in the contract document; title changed.",
  "reviewNote": "Unchanged under A14. promote/contract: work-state.md L647-647 (heading \"Sổ verb máy-đọc (manifest) — `--help --json`\") -> contracts/cli-io-contract.md#manifest-shape L244-244; targetOwner/targetAnchor contracts/cli-io-contract.md#manifest-shape. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "f7201259d68259d70be0b14e5989837d13de80f1a0f46817c02bca93603a9250",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#sổ-verb-máy-đọc-manifest---help---json`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9dcfe09c6bf68c7ba877bff28dba42ef7c502a932bb9ec1c97b83766c1c216d3
Shown text SHA256: 3a6751501e6195d2085a9412169fc0e08f73d7f135c484b032d14c6754325bae

```text
### Sổ verb máy-đọc (manifest) — `--help --json`
```

Complete native target: `docs/platform/work-state/contracts/cli-io-contract.md#manifest-shape`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f7201259d68259d70be0b14e5989837d13de80f1a0f46817c02bca93603a9250
Shown text SHA256: dfee92cc2e2abee498c90fae7c5939752209b37fccebd85a1252b9bfe75685e9

```text
### Manifest Shape
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Sổ verb máy-đọc (manifest) — `--help --json`
\ No newline at end of file
+### Manifest Shape
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0114

Entry kind: alias-accounting
Class: Judgment
Source digest: aadcac783bf592674ae3d58de41b7e75038b16e2550de06a19c322c91a088be9
Target digest: c57c03b28277a6a6bb5608ca73c026fab2a79333bccf9bc89a53208ea9d16dcb

```json
{
  "aliasId": "root-authorities-draft-0114",
  "fromPath": "docs/specs/work-state.md#trợ-giúp-theo-từng-verb-fgos---help",
  "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "toAnchor": "9-per-verb-help",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0114",
  "claimId": "claim_522c26efde7ef029b3ce6e25829a8915",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "trợ-giúp-theo-từng-verb-fgos---help",
  "sourceUnitDigest": "aadcac783bf592674ae3d58de41b7e75038b16e2550de06a19c322c91a088be9",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetNativeAnchor": "9-per-verb-help",
  "targetUnitDigest": "c57c03b28277a6a6bb5608ca73c026fab2a79333bccf9bc89a53208ea9d16dcb",
  "targetBrowserAnchor": "9-per-verb-help",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#trợ-giúp-theo-từng-verb-fgos---help`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: aadcac783bf592674ae3d58de41b7e75038b16e2550de06a19c322c91a088be9
Shown text SHA256: 7a3dd8672f56100bc293e4184371395cfa653885bc5c765fe7fcc91428d93f4b

```text
### Trợ giúp theo từng verb — `fgos <verb> --help`
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/contracts/cli-io-contract.md#9-per-verb-help`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: c57c03b28277a6a6bb5608ca73c026fab2a79333bccf9bc89a53208ea9d16dcb
Shown text SHA256: ecdfc0d03902b1dbd0114cc253a21cc191b853e554ce7945493460194605f963

```text
## 9. Per-Verb Help
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Trợ giúp theo từng verb — `fgos <verb> --help`
\ No newline at end of file
+## 9. Per-Verb Help
\ No newline at end of file
```

### Existing decision evidence: claim_522c26efde7ef029b3ce6e25829a8915

```json
{
  "claimId": "claim_522c26efde7ef029b3ce6e25829a8915",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "aadcac783bf59267",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "9-per-verb-help",
  "claimKind": "contract",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 per-verb help becomes the numbered H2 \"9. Per-Verb Help\" in the contract document; level and title changed.",
  "reviewNote": "Unchanged under A14. promote/contract: work-state.md L713-713 (heading \"Trợ giúp theo từng verb — `fgos <verb> --help`\") -> contracts/cli-io-contract.md#9-per-verb-help L313-313; targetOwner/targetAnchor contracts/cli-io-contract.md#9-per-verb-help. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "c57c03b28277a6a6bb5608ca73c026fab2a79333bccf9bc89a53208ea9d16dcb",
  "targetAncestry": [
    "CLI I/O Contract"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#trợ-giúp-theo-từng-verb-fgos---help`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: aadcac783bf592674ae3d58de41b7e75038b16e2550de06a19c322c91a088be9
Shown text SHA256: 7a3dd8672f56100bc293e4184371395cfa653885bc5c765fe7fcc91428d93f4b

```text
### Trợ giúp theo từng verb — `fgos <verb> --help`
```

Complete native target: `docs/platform/work-state/contracts/cli-io-contract.md#9-per-verb-help`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: c57c03b28277a6a6bb5608ca73c026fab2a79333bccf9bc89a53208ea9d16dcb
Shown text SHA256: ecdfc0d03902b1dbd0114cc253a21cc191b853e554ce7945493460194605f963

```text
## 9. Per-Verb Help
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Trợ giúp theo từng verb — `fgos <verb> --help`
\ No newline at end of file
+## 9. Per-Verb Help
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0115

Entry kind: alias-accounting
Class: Judgment
Source digest: 7f649852cab8e8143b6e44ef9672d72a4144069013587ee25b2658aff484fac1
Target digest: bd97137715f092dd3d8e4496cf57d1da65c5b7f06dea827f5312fb2e13ce602a

```json
{
  "aliasId": "root-authorities-draft-0115",
  "fromPath": "docs/specs/work-state.md#sổ-đăng-ký-công-cụ-tool-registry-hai-chiều-tách-chuẩn-đăng-ký-khỏi-đang-hiện-diện",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "registry-projection-and-registration-standard",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0115",
  "claimId": "claim_a374334e7c5dc565cac42c0fa641f78f",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "sổ-đăng-ký-công-cụ-tool-registry-hai-chiều-tách-chuẩn-đăng-ký-khỏi-đang-hiện-diện",
  "sourceUnitDigest": "7f649852cab8e8143b6e44ef9672d72a4144069013587ee25b2658aff484fac1",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "registry-projection-and-registration-standard",
  "targetUnitDigest": "bd97137715f092dd3d8e4496cf57d1da65c5b7f06dea827f5312fb2e13ce602a",
  "targetBrowserAnchor": "registry-projection-and-registration-standard",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#sổ-đăng-ký-công-cụ-tool-registry-hai-chiều-tách-chuẩn-đăng-ký-khỏi-đang-hiện-diện`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 7f649852cab8e8143b6e44ef9672d72a4144069013587ee25b2658aff484fac1
Shown text SHA256: 64d21937eab595afda868f80516c82dea4f94d206b5fdb90f3b0e4db22db896f

```text
### Sổ đăng ký công cụ (tool registry) — hai chiều, tách chuẩn "đăng ký" khỏi "đang hiện diện"
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#registry-projection-and-registration-standard`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: bd97137715f092dd3d8e4496cf57d1da65c5b7f06dea827f5312fb2e13ce602a
Shown text SHA256: 9f7476ad79a2e500287c789ded9652d5f5a020b3a5cb548d5b3e5a97207a6e7b

```text
### Registry Projection And Registration Standard
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Sổ đăng ký công cụ (tool registry) — hai chiều, tách chuẩn "đăng ký" khỏi "đang hiện diện"
\ No newline at end of file
+### Registry Projection And Registration Standard
\ No newline at end of file
```

### Existing decision evidence: claim_a374334e7c5dc565cac42c0fa641f78f

```json
{
  "claimId": "claim_a374334e7c5dc565cac42c0fa641f78f",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "7f649852cab8e814",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "registry-projection-and-registration-standard",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 tool registry becomes \"Registry Projection And Registration Standard\"; title changed.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L733-733 (heading \"Sổ đăng ký công cụ (tool registry) — hai chiều, tách chuẩn \"đăng ký\" khỏi \"đang hiện diện\"\") -> spec.md#registry-projection-and-registration-standard L605-605; targetOwner/targetAnchor spec.md#registry-projection-and-registration-standard. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "bd97137715f092dd3d8e4496cf57d1da65c5b7f06dea827f5312fb2e13ce602a",
  "targetAncestry": [
    "Work State Specification",
    "8. Tool Registry"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#sổ-đăng-ký-công-cụ-tool-registry-hai-chiều-tách-chuẩn-đăng-ký-khỏi-đang-hiện-diện`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 7f649852cab8e8143b6e44ef9672d72a4144069013587ee25b2658aff484fac1
Shown text SHA256: 64d21937eab595afda868f80516c82dea4f94d206b5fdb90f3b0e4db22db896f

```text
### Sổ đăng ký công cụ (tool registry) — hai chiều, tách chuẩn "đăng ký" khỏi "đang hiện diện"
```

Complete native target: `docs/platform/work-state/spec.md#registry-projection-and-registration-standard`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: bd97137715f092dd3d8e4496cf57d1da65c5b7f06dea827f5312fb2e13ce602a
Shown text SHA256: 9f7476ad79a2e500287c789ded9652d5f5a020b3a5cb548d5b3e5a97207a6e7b

```text
### Registry Projection And Registration Standard
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Sổ đăng ký công cụ (tool registry) — hai chiều, tách chuẩn "đăng ký" khỏi "đang hiện diện"
\ No newline at end of file
+### Registry Projection And Registration Standard
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0116

Entry kind: alias-accounting
Class: Judgment
Source digest: 5622ec7819b82b1fd8196e8a1facadd50f17fbd33c01589a10193f45a46a39e0
Target digest: 5dff99d34cce8282fc33c703b20af8a564a2f474b8574b4491c758ec171263a0

```json
{
  "aliasId": "root-authorities-draft-0116",
  "fromPath": "docs/specs/work-state.md#đăng-kýgỡprobehỏi-công-cụ-tool-register-check-query-remove",
  "toOwner": "docs/platform/work-state/spec.md",
  "toAnchor": "tool-registry-verbs",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0116",
  "claimId": "claim_07b1d2ac34bdddeb8112613640a65ab5",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "đăng-kýgỡprobehỏi-công-cụ-tool-register-check-query-remove",
  "sourceUnitDigest": "5622ec7819b82b1fd8196e8a1facadd50f17fbd33c01589a10193f45a46a39e0",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetNativeAnchor": "tool-registry-verbs",
  "targetUnitDigest": "5dff99d34cce8282fc33c703b20af8a564a2f474b8574b4491c758ec171263a0",
  "targetBrowserAnchor": "tool-registry-verbs",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#đăng-kýgỡprobehỏi-công-cụ-tool-register-check-query-remove`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5622ec7819b82b1fd8196e8a1facadd50f17fbd33c01589a10193f45a46a39e0
Shown text SHA256: 8202aaebad32067171971c745a4d92ec001b27cde7247db77e66fab13281843d

```text
### Đăng ký/gỡ/probe/hỏi công cụ (tool register / check / query / remove)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/spec.md#tool-registry-verbs`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5dff99d34cce8282fc33c703b20af8a564a2f474b8574b4491c758ec171263a0
Shown text SHA256: 17adacf5830da4b214e3ce289df29ff5f2f7a9f23785db9cfd104f64af059f33

```text
### Tool Registry Verbs
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### Đăng ký/gỡ/probe/hỏi công cụ (tool register / check / query / remove)
\ No newline at end of file
+### Tool Registry Verbs
\ No newline at end of file
```

### Existing decision evidence: claim_07b1d2ac34bdddeb8112613640a65ab5

```json
{
  "claimId": "claim_07b1d2ac34bdddeb8112613640a65ab5",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "5622ec7819b82b1f",
  "targetOwner": "docs/platform/work-state/spec.md",
  "targetAnchor": "tool-registry-verbs",
  "claimKind": "specification",
  "disposition": "promote",
  "reviewStatus": "reviewed",
  "rationale": "Source H3 on tool register/check/query/remove becomes \"Tool Registry Verbs\"; title changed.",
  "reviewNote": "Unchanged under A14. promote/specification: work-state.md L770-770 (heading \"Đăng ký/gỡ/probe/hỏi công cụ (tool register / check / query / remove)\") -> spec.md#tool-registry-verbs L642-642; targetOwner/targetAnchor spec.md#tool-registry-verbs. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
  "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
  "reviewedAt": "2026-10-09",
  "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
  "reviewMode": "ordinary",
  "targetUnitDigest": "5dff99d34cce8282fc33c703b20af8a564a2f474b8574b4491c758ec171263a0",
  "targetAncestry": [
    "Work State Specification",
    "8. Tool Registry"
  ],
  "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
}
```

Complete native source: `docs/specs/work-state.md#đăng-kýgỡprobehỏi-công-cụ-tool-register-check-query-remove`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5622ec7819b82b1fd8196e8a1facadd50f17fbd33c01589a10193f45a46a39e0
Shown text SHA256: 8202aaebad32067171971c745a4d92ec001b27cde7247db77e66fab13281843d

```text
### Đăng ký/gỡ/probe/hỏi công cụ (tool register / check / query / remove)
```

Complete native target: `docs/platform/work-state/spec.md#tool-registry-verbs`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5dff99d34cce8282fc33c703b20af8a564a2f474b8574b4491c758ec171263a0
Shown text SHA256: 17adacf5830da4b214e3ce289df29ff5f2f7a9f23785db9cfd104f64af059f33

```text
### Tool Registry Verbs
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### Đăng ký/gỡ/probe/hỏi công cụ (tool register / check / query / remove)
\ No newline at end of file
+### Tool Registry Verbs
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0117

Entry kind: alias-accounting
Class: Judgment
Source digest: 0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea
Target digest: 260da5fd6eab8c113ea7e756985b782b5e45721aae8f34aab1e50389af0dff24

```json
{
  "aliasId": "root-authorities-draft-0117",
  "fromPath": "docs/specs/work-state.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "1-provenance-of-retired-decisions",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0117",
  "claimId": "claim_ae1f21106b52006a2ff377f9104a1fce",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4",
  "sourceUnitDigest": "0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "1-provenance-of-retired-decisions",
  "targetUnitDigest": "260da5fd6eab8c113ea7e756985b782b",
  "targetBrowserAnchor": "1-provenance-of-retired-decisions",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea
Shown text SHA256: 6878d16b7457809b91344e2aabc6d97d2cca7f2a51d3ca7f1ef9dde58b07735c

```text
## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#1-provenance-of-retired-decisions`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 260da5fd6eab8c113ea7e756985b782b5e45721aae8f34aab1e50389af0dff24
Shown text SHA256: 0d796c024ab41cc6d4d2d9e0ee588d55cbba9b9da3991572ce2f9e91971678a9

```text
## 1. Provenance Of Retired Decisions
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)
\ No newline at end of file
+## 1. Provenance Of Retired Decisions
\ No newline at end of file
```

### Existing decision evidence: claim_ae1f21106b52006a2ff377f9104a1fce

```json
{
  "claimId": "claim_ae1f21106b52006a2ff377f9104a1fce",
  "sourceUnitDigest": "0e00c9cccba1af1e",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "1-provenance-of-retired-decisions",
  "claimKind": "historical-context",
  "disposition": "promote",
  "rationale": "Source H2 stating where the retired records came from is represented by the frozen H2 \"1. Provenance Of Retired Decisions\"; only the heading title differs (numbered, English, no tsk id in the title).",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "260da5fd6eab8c113ea7e756985b782b"
}
```

Complete native source: `docs/specs/work-state.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea
Shown text SHA256: 6878d16b7457809b91344e2aabc6d97d2cca7f2a51d3ca7f1ef9dde58b07735c

```text
## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#1-provenance-of-retired-decisions`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 260da5fd6eab8c113ea7e756985b782b5e45721aae8f34aab1e50389af0dff24
Shown text SHA256: 0d796c024ab41cc6d4d2d9e0ee588d55cbba9b9da3991572ce2f9e91971678a9

```text
## 1. Provenance Of Retired Decisions
```

```diff
--- source
+++ target
@@ -1 +1 @@
-## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)
\ No newline at end of file
+## 1. Provenance Of Retired Decisions
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0118

Entry kind: alias-accounting
Class: Judgment
Source digest: cb78249b3b34c872441f503e5969695e0b15abd05195c856493d6227ff5bbb23
Target digest: dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d

```json
{
  "aliasId": "root-authorities-draft-0118",
  "fromPath": "docs/specs/work-state.md#0002-mô-hình-việc-phẳng",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "2-adr-0002-flat-work-model",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0118",
  "claimId": "claim_5412ac73c702e4ec33e4b59dd9ad1940",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "0002-mô-hình-việc-phẳng",
  "sourceUnitDigest": "cb78249b3b34c872441f503e5969695e0b15abd05195c856493d6227ff5bbb23",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "2-adr-0002-flat-work-model",
  "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e",
  "targetBrowserAnchor": "2-adr-0002-flat-work-model",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#0002-mô-hình-việc-phẳng`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: cb78249b3b34c872441f503e5969695e0b15abd05195c856493d6227ff5bbb23
Shown text SHA256: 1a7f7ca13ad53e9f30a84816dd9cbc52e2397da12698afe627483b8dd6943c34

```text
### 0002 — Mô hình việc phẳng
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#2-adr-0002-flat-work-model`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d
Shown text SHA256: 0159658791f9180699398027120835700f10c63b0537b90826cf61b3c81d9278

```text
## 2. ADR 0002 Flat Work Model
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### 0002 — Mô hình việc phẳng
\ No newline at end of file
+## 2. ADR 0002 Flat Work Model
\ No newline at end of file
```

### Existing decision evidence: claim_5412ac73c702e4ec33e4b59dd9ad1940

```json
{
  "claimId": "claim_5412ac73c702e4ec33e4b59dd9ad1940",
  "sourceUnitDigest": "cb78249b3b34c872",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "2-adr-0002-flat-work-model",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Source ADR 0002 title heading is represented by the frozen H2 \"2. ADR 0002 ...\" (2-adr-0002-flat-work-model); title is renumbered and re-worded in English, text of the record is unchanged.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e"
}
```

Complete native source: `docs/specs/work-state.md#0002-mô-hình-việc-phẳng`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: cb78249b3b34c872441f503e5969695e0b15abd05195c856493d6227ff5bbb23
Shown text SHA256: 1a7f7ca13ad53e9f30a84816dd9cbc52e2397da12698afe627483b8dd6943c34

```text
### 0002 — Mô hình việc phẳng
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#2-adr-0002-flat-work-model`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d
Shown text SHA256: 0159658791f9180699398027120835700f10c63b0537b90826cf61b3c81d9278

```text
## 2. ADR 0002 Flat Work Model
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### 0002 — Mô hình việc phẳng
\ No newline at end of file
+## 2. ADR 0002 Flat Work Model
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0119

Entry kind: alias-accounting
Class: Judgment
Source digest: a05e96aa58d47c2d93aba8822f9e8c38f89b39b979d8c8b8fad842328f65c489
Target digest: dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d

```json
{
  "aliasId": "root-authorities-draft-0119",
  "fromPath": "docs/specs/work-state.md#0002-mô-hình-việc-phẳng-1",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "2-adr-0002-flat-work-model",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0119",
  "claimId": "claim_f8e2b48d6234ca8a73e15cdaad7d9c07",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "0002-mô-hình-việc-phẳng-1",
  "sourceUnitDigest": "a05e96aa58d47c2d93aba8822f9e8c38f89b39b979d8c8b8fad842328f65c489",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "2-adr-0002-flat-work-model",
  "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e",
  "targetBrowserAnchor": "2-adr-0002-flat-work-model",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#0002-mô-hình-việc-phẳng-1`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a05e96aa58d47c2d93aba8822f9e8c38f89b39b979d8c8b8fad842328f65c489
Shown text SHA256: 9242549e6594fc7c33bb4c5dc66c7b68906efa7ad4ac34142e59d619d1de6a96

```text
# 0002 — Mô hình việc phẳng
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#2-adr-0002-flat-work-model`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d
Shown text SHA256: 0159658791f9180699398027120835700f10c63b0537b90826cf61b3c81d9278

```text
## 2. ADR 0002 Flat Work Model
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-# 0002 — Mô hình việc phẳng
\ No newline at end of file
+## 2. ADR 0002 Flat Work Model
\ No newline at end of file
```

### Existing decision evidence: claim_f8e2b48d6234ca8a73e15cdaad7d9c07

```json
{
  "claimId": "claim_f8e2b48d6234ca8a73e15cdaad7d9c07",
  "sourceUnitDigest": "a05e96aa58d47c2d",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "2-adr-0002-flat-work-model",
  "claimKind": "decision",
  "disposition": "merge",
  "rationale": "Repeated duplicate title \"# 0002 - Mo hinh viec phang\" inside the ADR 0002 text: merged into the single ADR 0002 H2 (no second H1 in the candidate), so no claim is lost but the heading itself does not appear twice.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e"
}
```

Complete native source: `docs/specs/work-state.md#0002-mô-hình-việc-phẳng-1`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a05e96aa58d47c2d93aba8822f9e8c38f89b39b979d8c8b8fad842328f65c489
Shown text SHA256: 9242549e6594fc7c33bb4c5dc66c7b68906efa7ad4ac34142e59d619d1de6a96

```text
# 0002 — Mô hình việc phẳng
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#2-adr-0002-flat-work-model`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d
Shown text SHA256: 0159658791f9180699398027120835700f10c63b0537b90826cf61b3c81d9278

```text
## 2. ADR 0002 Flat Work Model
```

```diff
--- source
+++ target
@@ -1 +1 @@
-# 0002 — Mô hình việc phẳng
\ No newline at end of file
+## 2. ADR 0002 Flat Work Model
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0120

Entry kind: alias-accounting
Class: Judgment
Source digest: f014a166cf0c8f3dc0e0998cbb8b08c1927000c5e341fcc78ea8f052cf420b1d
Target digest: 5cd2a9a136e3025d04ed41810213e2a9c383290b3eb3e863644e4af952612d3e

```json
{
  "aliasId": "root-authorities-draft-0120",
  "fromPath": "docs/specs/work-state.md#bối-cảnh",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0002-context",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0120",
  "claimId": "claim_faeaa8e46158de47c45810fb0a595dcc",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bối-cảnh",
  "sourceUnitDigest": "f014a166cf0c8f3dc0e0998cbb8b08c1927000c5e341fcc78ea8f052cf420b1d",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0002-context",
  "targetUnitDigest": "5cd2a9a136e3025d04ed41810213e2a9",
  "targetBrowserAnchor": "0002-context",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bối-cảnh`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f014a166cf0c8f3dc0e0998cbb8b08c1927000c5e341fcc78ea8f052cf420b1d
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0002-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5cd2a9a136e3025d04ed41810213e2a9c383290b3eb3e863644e4af952612d3e
Shown text SHA256: 0723738053e07ff58ff9e878888f62819c8184ed9b361cc93712d5454ddcceaf

```text
### 0002 Context
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0002 Context
\ No newline at end of file
```

### Existing decision evidence: claim_faeaa8e46158de47c45810fb0a595dcc

```json
{
  "claimId": "claim_faeaa8e46158de47c45810fb0a595dcc",
  "sourceUnitDigest": "f014a166cf0c8f3d",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0002-context",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Bối cảnh\" of ADR 0002 is represented by the frozen H3 \"0002 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "5cd2a9a136e3025d04ed41810213e2a9"
}
```

Complete native source: `docs/specs/work-state.md#bối-cảnh`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f014a166cf0c8f3dc0e0998cbb8b08c1927000c5e341fcc78ea8f052cf420b1d
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0002-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5cd2a9a136e3025d04ed41810213e2a9c383290b3eb3e863644e4af952612d3e
Shown text SHA256: 0723738053e07ff58ff9e878888f62819c8184ed9b361cc93712d5454ddcceaf

```text
### 0002 Context
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0002 Context
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0121

Entry kind: alias-accounting
Class: Judgment
Source digest: d6043b1481fba899bd107a3f203d0eb91b3510c392303fba688d5d8dcd74ea9b
Target digest: 6a7b90c72430f1cb8d04a666d3fa97514ec1f6ba3c24cf36641333a9745f4e19

```json
{
  "aliasId": "root-authorities-draft-0121",
  "fromPath": "docs/specs/work-state.md#quyết-định",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0002-decision",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0121",
  "claimId": "claim_5b6cd72833b3ee7ea7a2862b4eadb328",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "quyết-định",
  "sourceUnitDigest": "d6043b1481fba899bd107a3f203d0eb91b3510c392303fba688d5d8dcd74ea9b",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0002-decision",
  "targetUnitDigest": "6a7b90c72430f1cb8d04a666d3fa9751",
  "targetBrowserAnchor": "0002-decision",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#quyết-định`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: d6043b1481fba899bd107a3f203d0eb91b3510c392303fba688d5d8dcd74ea9b
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0002-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 6a7b90c72430f1cb8d04a666d3fa97514ec1f6ba3c24cf36641333a9745f4e19
Shown text SHA256: 1449c3f654a8491bf2d6ffa285bbed97a0f3b55295654b51cce0b09e7f1a0061

```text
### 0002 Decision
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0002 Decision
\ No newline at end of file
```

### Existing decision evidence: claim_5b6cd72833b3ee7ea7a2862b4eadb328

```json
{
  "claimId": "claim_5b6cd72833b3ee7ea7a2862b4eadb328",
  "sourceUnitDigest": "d6043b1481fba899",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0002-decision",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Quyết định\" of ADR 0002 is represented by the frozen H3 \"0002 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "6a7b90c72430f1cb8d04a666d3fa9751"
}
```

Complete native source: `docs/specs/work-state.md#quyết-định`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: d6043b1481fba899bd107a3f203d0eb91b3510c392303fba688d5d8dcd74ea9b
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0002-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 6a7b90c72430f1cb8d04a666d3fa97514ec1f6ba3c24cf36641333a9745f4e19
Shown text SHA256: 1449c3f654a8491bf2d6ffa285bbed97a0f3b55295654b51cce0b09e7f1a0061

```text
### 0002 Decision
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0002 Decision
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0122

Entry kind: alias-accounting
Class: Judgment
Source digest: e91bbb5ae8fcb8f80cfc0e7d96edacde4801d6b55c38e7d7effdc6e66668fe3d
Target digest: fc62699538350fccc923e8874a342f8d5e5f5582ae09db366066bf776b60ef7a

```json
{
  "aliasId": "root-authorities-draft-0122",
  "fromPath": "docs/specs/work-state.md#hệ-quả",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0002-consequences",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0122",
  "claimId": "claim_e8b18c86c4297b05e04a14793817bf6a",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "hệ-quả",
  "sourceUnitDigest": "e91bbb5ae8fcb8f80cfc0e7d96edacde4801d6b55c38e7d7effdc6e66668fe3d",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0002-consequences",
  "targetUnitDigest": "fc62699538350fccc923e8874a342f8d",
  "targetBrowserAnchor": "0002-consequences",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#hệ-quả`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e91bbb5ae8fcb8f80cfc0e7d96edacde4801d6b55c38e7d7effdc6e66668fe3d
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0002-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: fc62699538350fccc923e8874a342f8d5e5f5582ae09db366066bf776b60ef7a
Shown text SHA256: 456dac68eacce8b9d98f5b8ad40ae83e80c8ad711f264526db915d456c067c62

```text
### 0002 Consequences
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0002 Consequences
\ No newline at end of file
```

### Existing decision evidence: claim_e8b18c86c4297b05e04a14793817bf6a

```json
{
  "claimId": "claim_e8b18c86c4297b05e04a14793817bf6a",
  "sourceUnitDigest": "e91bbb5ae8fcb8f8",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0002-consequences",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Hệ quả\" of ADR 0002 is represented by the frozen H3 \"0002 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "fc62699538350fccc923e8874a342f8d"
}
```

Complete native source: `docs/specs/work-state.md#hệ-quả`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e91bbb5ae8fcb8f80cfc0e7d96edacde4801d6b55c38e7d7effdc6e66668fe3d
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0002-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: fc62699538350fccc923e8874a342f8d5e5f5582ae09db366066bf776b60ef7a
Shown text SHA256: 456dac68eacce8b9d98f5b8ad40ae83e80c8ad711f264526db915d456c067c62

```text
### 0002 Consequences
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0002 Consequences
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0123

Entry kind: alias-accounting
Class: Judgment
Source digest: c0dc9acc17db42831047d749d50611b840aa11185c806d786510a00e63aa5cd0
Target digest: eed7c45e529a07ba42be1926c4715e28e71d7ab481a6e270e4db28d1981b35d3

```json
{
  "aliasId": "root-authorities-draft-0123",
  "fromPath": "docs/specs/work-state.md#0003-đặt-tên-bố-cục-dữ-liệu",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "3-adr-0003-naming-and-data-layout",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0123",
  "claimId": "claim_0e062808f47ce5c348b6b44a91650ecc",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "0003-đặt-tên-bố-cục-dữ-liệu",
  "sourceUnitDigest": "c0dc9acc17db42831047d749d50611b840aa11185c806d786510a00e63aa5cd0",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "3-adr-0003-naming-and-data-layout",
  "targetUnitDigest": "eed7c45e529a07ba42be1926c4715e28",
  "targetBrowserAnchor": "3-adr-0003-naming-and-data-layout",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#0003-đặt-tên-bố-cục-dữ-liệu`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: c0dc9acc17db42831047d749d50611b840aa11185c806d786510a00e63aa5cd0
Shown text SHA256: 3def879b9b6ca14d3b816166abd33a597a79336c4b56aca7fdecdba62bf1ec5c

```text
### 0003 — Đặt tên & bố cục dữ liệu
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#3-adr-0003-naming-and-data-layout`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: eed7c45e529a07ba42be1926c4715e28e71d7ab481a6e270e4db28d1981b35d3
Shown text SHA256: 9d7001cb20851388a6281b4c036808a6993dd28f7a032b868ab7a596a6948210

```text
## 3. ADR 0003 Naming And Data Layout
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### 0003 — Đặt tên & bố cục dữ liệu
\ No newline at end of file
+## 3. ADR 0003 Naming And Data Layout
\ No newline at end of file
```

### Existing decision evidence: claim_0e062808f47ce5c348b6b44a91650ecc

```json
{
  "claimId": "claim_0e062808f47ce5c348b6b44a91650ecc",
  "sourceUnitDigest": "c0dc9acc17db4283",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "3-adr-0003-naming-and-data-layout",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Source ADR 0003 title heading is represented by the frozen H2 \"3. ADR 0003 ...\" (3-adr-0003-naming-and-data-layout); title is renumbered and re-worded in English, text of the record is unchanged.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "eed7c45e529a07ba42be1926c4715e28"
}
```

Complete native source: `docs/specs/work-state.md#0003-đặt-tên-bố-cục-dữ-liệu`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: c0dc9acc17db42831047d749d50611b840aa11185c806d786510a00e63aa5cd0
Shown text SHA256: 3def879b9b6ca14d3b816166abd33a597a79336c4b56aca7fdecdba62bf1ec5c

```text
### 0003 — Đặt tên & bố cục dữ liệu
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#3-adr-0003-naming-and-data-layout`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: eed7c45e529a07ba42be1926c4715e28e71d7ab481a6e270e4db28d1981b35d3
Shown text SHA256: 9d7001cb20851388a6281b4c036808a6993dd28f7a032b868ab7a596a6948210

```text
## 3. ADR 0003 Naming And Data Layout
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### 0003 — Đặt tên & bố cục dữ liệu
\ No newline at end of file
+## 3. ADR 0003 Naming And Data Layout
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0124

Entry kind: alias-accounting
Class: Judgment
Source digest: 203f9cd3142f933c7ed8ebb33a25e956689e857e4cc3d5f54031a06a9a8faa2c
Target digest: c6a2c64d4858021065b5e9f3a7dd05666d15ee2123b64859bc98ecf175325bd1

```json
{
  "aliasId": "root-authorities-draft-0124",
  "fromPath": "docs/specs/work-state.md#bối-cảnh-1",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0003-context",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0124",
  "claimId": "claim_75f47ef3fd99abd07c138f106f1ca023",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bối-cảnh-1",
  "sourceUnitDigest": "203f9cd3142f933c7ed8ebb33a25e956689e857e4cc3d5f54031a06a9a8faa2c",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0003-context",
  "targetUnitDigest": "c6a2c64d4858021065b5e9f3a7dd0566",
  "targetBrowserAnchor": "0003-context",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bối-cảnh-1`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 203f9cd3142f933c7ed8ebb33a25e956689e857e4cc3d5f54031a06a9a8faa2c
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0003-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: c6a2c64d4858021065b5e9f3a7dd05666d15ee2123b64859bc98ecf175325bd1
Shown text SHA256: c4e0b4257caaca2446254d579fa2d8a73f20fa08c38c3d000f6249c8ed662677

```text
### 0003 Context
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0003 Context
\ No newline at end of file
```

### Existing decision evidence: claim_75f47ef3fd99abd07c138f106f1ca023

```json
{
  "claimId": "claim_75f47ef3fd99abd07c138f106f1ca023",
  "sourceUnitDigest": "203f9cd3142f933c",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0003-context",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Bối cảnh\" of ADR 0003 is represented by the frozen H3 \"0003 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "c6a2c64d4858021065b5e9f3a7dd0566"
}
```

Complete native source: `docs/specs/work-state.md#bối-cảnh-1`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 203f9cd3142f933c7ed8ebb33a25e956689e857e4cc3d5f54031a06a9a8faa2c
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0003-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: c6a2c64d4858021065b5e9f3a7dd05666d15ee2123b64859bc98ecf175325bd1
Shown text SHA256: c4e0b4257caaca2446254d579fa2d8a73f20fa08c38c3d000f6249c8ed662677

```text
### 0003 Context
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0003 Context
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0125

Entry kind: alias-accounting
Class: Judgment
Source digest: 798c507e268c8c148014c86c19d3e9ba38434eefe0623a8b6606737629e5ae32
Target digest: d0f79f2a53f7edfc1d92c6e8c71d50e3eecb588a7bccf96f3eb9c97f0a628a7d

```json
{
  "aliasId": "root-authorities-draft-0125",
  "fromPath": "docs/specs/work-state.md#quyết-định-1",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0003-decision",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0125",
  "claimId": "claim_c6a1314c4583518f5100cc53e78b1979",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "quyết-định-1",
  "sourceUnitDigest": "798c507e268c8c148014c86c19d3e9ba38434eefe0623a8b6606737629e5ae32",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0003-decision",
  "targetUnitDigest": "d0f79f2a53f7edfc1d92c6e8c71d50e3",
  "targetBrowserAnchor": "0003-decision",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#quyết-định-1`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 798c507e268c8c148014c86c19d3e9ba38434eefe0623a8b6606737629e5ae32
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0003-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: d0f79f2a53f7edfc1d92c6e8c71d50e3eecb588a7bccf96f3eb9c97f0a628a7d
Shown text SHA256: d2bd25571ddb45209555db1ecdca976e42823e6a40307cabc346562b7840b687

```text
### 0003 Decision
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0003 Decision
\ No newline at end of file
```

### Existing decision evidence: claim_c6a1314c4583518f5100cc53e78b1979

```json
{
  "claimId": "claim_c6a1314c4583518f5100cc53e78b1979",
  "sourceUnitDigest": "798c507e268c8c14",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0003-decision",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Quyết định\" of ADR 0003 is represented by the frozen H3 \"0003 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "d0f79f2a53f7edfc1d92c6e8c71d50e3"
}
```

Complete native source: `docs/specs/work-state.md#quyết-định-1`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 798c507e268c8c148014c86c19d3e9ba38434eefe0623a8b6606737629e5ae32
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0003-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: d0f79f2a53f7edfc1d92c6e8c71d50e3eecb588a7bccf96f3eb9c97f0a628a7d
Shown text SHA256: d2bd25571ddb45209555db1ecdca976e42823e6a40307cabc346562b7840b687

```text
### 0003 Decision
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0003 Decision
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0126

Entry kind: alias-accounting
Class: Judgment
Source digest: 055bb7583cd585802e14c9c9a6472e7c19df9cce141ecf2b1f8ebcd152343e06
Target digest: e6a929b78a9cc9b4254c5e289f33c764837ff88c2f3ff9919376e5f8823b9ff0

```json
{
  "aliasId": "root-authorities-draft-0126",
  "fromPath": "docs/specs/work-state.md#hệ-quả-1",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0003-consequences",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0126",
  "claimId": "claim_f161fbd15476131b86b7c2fd2f1d8f59",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "hệ-quả-1",
  "sourceUnitDigest": "055bb7583cd585802e14c9c9a6472e7c19df9cce141ecf2b1f8ebcd152343e06",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0003-consequences",
  "targetUnitDigest": "e6a929b78a9cc9b4254c5e289f33c764",
  "targetBrowserAnchor": "0003-consequences",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#hệ-quả-1`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 055bb7583cd585802e14c9c9a6472e7c19df9cce141ecf2b1f8ebcd152343e06
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0003-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e6a929b78a9cc9b4254c5e289f33c764837ff88c2f3ff9919376e5f8823b9ff0
Shown text SHA256: 48f84fbd843fcd272e60a54d874595edff12eae3a5a9d55e95baaafd13ebcd62

```text
### 0003 Consequences
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0003 Consequences
\ No newline at end of file
```

### Existing decision evidence: claim_f161fbd15476131b86b7c2fd2f1d8f59

```json
{
  "claimId": "claim_f161fbd15476131b86b7c2fd2f1d8f59",
  "sourceUnitDigest": "055bb7583cd58580",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0003-consequences",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Hệ quả\" of ADR 0003 is represented by the frozen H3 \"0003 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "e6a929b78a9cc9b4254c5e289f33c764"
}
```

Complete native source: `docs/specs/work-state.md#hệ-quả-1`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 055bb7583cd585802e14c9c9a6472e7c19df9cce141ecf2b1f8ebcd152343e06
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0003-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e6a929b78a9cc9b4254c5e289f33c764837ff88c2f3ff9919376e5f8823b9ff0
Shown text SHA256: 48f84fbd843fcd272e60a54d874595edff12eae3a5a9d55e95baaafd13ebcd62

```text
### 0003 Consequences
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0003 Consequences
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0127

Entry kind: alias-accounting
Class: Judgment
Source digest: a0ff252fe4a05fd8e693c461f92fec4d11953243fbd4743612353acb3d2aec72
Target digest: 2d2db2abca61349471af2e2a3d0f5581e7f87af45a979df1e541c1448a865f8a

```json
{
  "aliasId": "root-authorities-draft-0127",
  "fromPath": "docs/specs/work-state.md#0004-phạm-vi-non-goal",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "4-adr-0004-scope-and-non-goals",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0127",
  "claimId": "claim_5908b357cb98d52934398e26e43fcb39",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "0004-phạm-vi-non-goal",
  "sourceUnitDigest": "a0ff252fe4a05fd8e693c461f92fec4d11953243fbd4743612353acb3d2aec72",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "4-adr-0004-scope-and-non-goals",
  "targetUnitDigest": "2d2db2abca61349471af2e2a3d0f5581",
  "targetBrowserAnchor": "4-adr-0004-scope-and-non-goals",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#0004-phạm-vi-non-goal`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a0ff252fe4a05fd8e693c461f92fec4d11953243fbd4743612353acb3d2aec72
Shown text SHA256: 5250b2fa28d2195fc82a886b4b5f17bbece630f5f79ad89a9099e10d44dd4f24

```text
### 0004 — Phạm vi & non-goal
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#4-adr-0004-scope-and-non-goals`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2d2db2abca61349471af2e2a3d0f5581e7f87af45a979df1e541c1448a865f8a
Shown text SHA256: 9fa61285b65e4ee62e684e0e736d1111b747a5c455eb3a934cfffab673174a0b

```text
## 4. ADR 0004 Scope And Non-Goals
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### 0004 — Phạm vi & non-goal
\ No newline at end of file
+## 4. ADR 0004 Scope And Non-Goals
\ No newline at end of file
```

### Existing decision evidence: claim_5908b357cb98d52934398e26e43fcb39

```json
{
  "claimId": "claim_5908b357cb98d52934398e26e43fcb39",
  "sourceUnitDigest": "a0ff252fe4a05fd8",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "4-adr-0004-scope-and-non-goals",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Source ADR 0004 title heading is represented by the frozen H2 \"4. ADR 0004 ...\" (4-adr-0004-scope-and-non-goals); title is renumbered and re-worded in English, text of the record is unchanged.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "2d2db2abca61349471af2e2a3d0f5581"
}
```

Complete native source: `docs/specs/work-state.md#0004-phạm-vi-non-goal`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: a0ff252fe4a05fd8e693c461f92fec4d11953243fbd4743612353acb3d2aec72
Shown text SHA256: 5250b2fa28d2195fc82a886b4b5f17bbece630f5f79ad89a9099e10d44dd4f24

```text
### 0004 — Phạm vi & non-goal
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#4-adr-0004-scope-and-non-goals`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2d2db2abca61349471af2e2a3d0f5581e7f87af45a979df1e541c1448a865f8a
Shown text SHA256: 9fa61285b65e4ee62e684e0e736d1111b747a5c455eb3a934cfffab673174a0b

```text
## 4. ADR 0004 Scope And Non-Goals
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### 0004 — Phạm vi & non-goal
\ No newline at end of file
+## 4. ADR 0004 Scope And Non-Goals
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0128

Entry kind: alias-accounting
Class: Judgment
Source digest: f27931862e682c2f65d58afcf2b0e652f898219a48d79f6ddb16de0d9b4af6fc
Target digest: 2d45d4866f7526c232afdeaf650c17f9c3efee2a04afd9e6241922d522abffe9

```json
{
  "aliasId": "root-authorities-draft-0128",
  "fromPath": "docs/specs/work-state.md#bối-cảnh-2",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0004-context",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0128",
  "claimId": "claim_67494c7de8ad006fcb01b825ea00e6b2",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bối-cảnh-2",
  "sourceUnitDigest": "f27931862e682c2f65d58afcf2b0e652f898219a48d79f6ddb16de0d9b4af6fc",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0004-context",
  "targetUnitDigest": "2d45d4866f7526c232afdeaf650c17f9",
  "targetBrowserAnchor": "0004-context",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bối-cảnh-2`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f27931862e682c2f65d58afcf2b0e652f898219a48d79f6ddb16de0d9b4af6fc
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0004-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2d45d4866f7526c232afdeaf650c17f9c3efee2a04afd9e6241922d522abffe9
Shown text SHA256: b3f3ed373058d6b365a8e5c3aa3f505c7a6e2e34d97659b3454e73c23eb57d82

```text
### 0004 Context
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0004 Context
\ No newline at end of file
```

### Existing decision evidence: claim_67494c7de8ad006fcb01b825ea00e6b2

```json
{
  "claimId": "claim_67494c7de8ad006fcb01b825ea00e6b2",
  "sourceUnitDigest": "f27931862e682c2f",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0004-context",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Bối cảnh\" of ADR 0004 is represented by the frozen H3 \"0004 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "2d45d4866f7526c232afdeaf650c17f9"
}
```

Complete native source: `docs/specs/work-state.md#bối-cảnh-2`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f27931862e682c2f65d58afcf2b0e652f898219a48d79f6ddb16de0d9b4af6fc
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0004-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2d45d4866f7526c232afdeaf650c17f9c3efee2a04afd9e6241922d522abffe9
Shown text SHA256: b3f3ed373058d6b365a8e5c3aa3f505c7a6e2e34d97659b3454e73c23eb57d82

```text
### 0004 Context
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0004 Context
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0129

Entry kind: alias-accounting
Class: Judgment
Source digest: b72bf8ee1aea6db60efc87e527428e2ea30208408c6d507cb22e94d1aeaa5fef
Target digest: 59bda06684c6859316ad8f0b236bc7b6ebc9dc72139fca854456d9b38de05252

```json
{
  "aliasId": "root-authorities-draft-0129",
  "fromPath": "docs/specs/work-state.md#quyết-định-2",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0004-decision",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0129",
  "claimId": "claim_4063855a9287de7cf5b27cb77d96955f",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "quyết-định-2",
  "sourceUnitDigest": "b72bf8ee1aea6db60efc87e527428e2ea30208408c6d507cb22e94d1aeaa5fef",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0004-decision",
  "targetUnitDigest": "59bda06684c6859316ad8f0b236bc7b6",
  "targetBrowserAnchor": "0004-decision",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#quyết-định-2`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b72bf8ee1aea6db60efc87e527428e2ea30208408c6d507cb22e94d1aeaa5fef
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0004-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 59bda06684c6859316ad8f0b236bc7b6ebc9dc72139fca854456d9b38de05252
Shown text SHA256: 09adfe40cdb99057aabcb04c93e83dd423f02b6ce838ae2b97bb998750ffc7a7

```text
### 0004 Decision
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0004 Decision
\ No newline at end of file
```

### Existing decision evidence: claim_4063855a9287de7cf5b27cb77d96955f

```json
{
  "claimId": "claim_4063855a9287de7cf5b27cb77d96955f",
  "sourceUnitDigest": "b72bf8ee1aea6db6",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0004-decision",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Quyết định\" of ADR 0004 is represented by the frozen H3 \"0004 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "59bda06684c6859316ad8f0b236bc7b6"
}
```

Complete native source: `docs/specs/work-state.md#quyết-định-2`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: b72bf8ee1aea6db60efc87e527428e2ea30208408c6d507cb22e94d1aeaa5fef
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0004-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 59bda06684c6859316ad8f0b236bc7b6ebc9dc72139fca854456d9b38de05252
Shown text SHA256: 09adfe40cdb99057aabcb04c93e83dd423f02b6ce838ae2b97bb998750ffc7a7

```text
### 0004 Decision
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0004 Decision
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0130

Entry kind: alias-accounting
Class: Judgment
Source digest: e44f9991b9931d7cb611894760d23de0ccecacc3e6d22456433e9ba8c115f937
Target digest: 12d505aab6487945d39c7e3a3f15ad06171917f8bf16b2b27387a9c6efd0d33b

```json
{
  "aliasId": "root-authorities-draft-0130",
  "fromPath": "docs/specs/work-state.md#hệ-quả-2",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0004-consequences",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0130",
  "claimId": "claim_0b4d53be3903ac1ce9299b5d7174feab",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "hệ-quả-2",
  "sourceUnitDigest": "e44f9991b9931d7cb611894760d23de0ccecacc3e6d22456433e9ba8c115f937",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0004-consequences",
  "targetUnitDigest": "12d505aab6487945d39c7e3a3f15ad06",
  "targetBrowserAnchor": "0004-consequences",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#hệ-quả-2`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e44f9991b9931d7cb611894760d23de0ccecacc3e6d22456433e9ba8c115f937
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0004-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 12d505aab6487945d39c7e3a3f15ad06171917f8bf16b2b27387a9c6efd0d33b
Shown text SHA256: f40e2e4589a891dcfbc10aff9acb0f0ef24e60f30dc5db485d6e314ea41d7390

```text
### 0004 Consequences
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0004 Consequences
\ No newline at end of file
```

### Existing decision evidence: claim_0b4d53be3903ac1ce9299b5d7174feab

```json
{
  "claimId": "claim_0b4d53be3903ac1ce9299b5d7174feab",
  "sourceUnitDigest": "e44f9991b9931d7c",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0004-consequences",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Hệ quả\" of ADR 0004 is represented by the frozen H3 \"0004 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "12d505aab6487945d39c7e3a3f15ad06"
}
```

Complete native source: `docs/specs/work-state.md#hệ-quả-2`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e44f9991b9931d7cb611894760d23de0ccecacc3e6d22456433e9ba8c115f937
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0004-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 12d505aab6487945d39c7e3a3f15ad06171917f8bf16b2b27387a9c6efd0d33b
Shown text SHA256: f40e2e4589a891dcfbc10aff9acb0f0ef24e60f30dc5db485d6e314ea41d7390

```text
### 0004 Consequences
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0004 Consequences
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0131

Entry kind: alias-accounting
Class: Judgment
Source digest: 2ff34201c3aa91d6669a84ed0af602479d1834bc8906cf8447aca5ca588ebac8
Target digest: 67c97b2b884ac9505324dc3b688a7989f36bfd27700bf7389751058845c479f0

```json
{
  "aliasId": "root-authorities-draft-0131",
  "fromPath": "docs/specs/work-state.md#0006-trạng-thái-proposed",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "5-adr-0006-proposed-status",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0131",
  "claimId": "claim_dbc0da98acd1c90327ebd67850cc8983",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "0006-trạng-thái-proposed",
  "sourceUnitDigest": "2ff34201c3aa91d6669a84ed0af602479d1834bc8906cf8447aca5ca588ebac8",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "5-adr-0006-proposed-status",
  "targetUnitDigest": "67c97b2b884ac9505324dc3b688a7989",
  "targetBrowserAnchor": "5-adr-0006-proposed-status",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#0006-trạng-thái-proposed`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2ff34201c3aa91d6669a84ed0af602479d1834bc8906cf8447aca5ca588ebac8
Shown text SHA256: 636b2c3d76e7a16a4f9bf063c70be44f8bdaae9e728ea1cbe1da16b11c80127a

```text
### 0006 — Trạng thái `proposed`
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#5-adr-0006-proposed-status`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 67c97b2b884ac9505324dc3b688a7989f36bfd27700bf7389751058845c479f0
Shown text SHA256: b42f8dc4f4ea2af7be32af4886f06900a326b41813e168eec877367c9e2567ce

```text
## 5. ADR 0006 Proposed Status
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### 0006 — Trạng thái `proposed`
\ No newline at end of file
+## 5. ADR 0006 Proposed Status
\ No newline at end of file
```

### Existing decision evidence: claim_dbc0da98acd1c90327ebd67850cc8983

```json
{
  "claimId": "claim_dbc0da98acd1c90327ebd67850cc8983",
  "sourceUnitDigest": "2ff34201c3aa91d6",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "5-adr-0006-proposed-status",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Source ADR 0006 title heading is represented by the frozen H2 \"5. ADR 0006 ...\" (5-adr-0006-proposed-status); title is renumbered and re-worded in English, text of the record is unchanged.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "67c97b2b884ac9505324dc3b688a7989"
}
```

Complete native source: `docs/specs/work-state.md#0006-trạng-thái-proposed`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 2ff34201c3aa91d6669a84ed0af602479d1834bc8906cf8447aca5ca588ebac8
Shown text SHA256: 636b2c3d76e7a16a4f9bf063c70be44f8bdaae9e728ea1cbe1da16b11c80127a

```text
### 0006 — Trạng thái `proposed`
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#5-adr-0006-proposed-status`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 67c97b2b884ac9505324dc3b688a7989f36bfd27700bf7389751058845c479f0
Shown text SHA256: b42f8dc4f4ea2af7be32af4886f06900a326b41813e168eec877367c9e2567ce

```text
## 5. ADR 0006 Proposed Status
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### 0006 — Trạng thái `proposed`
\ No newline at end of file
+## 5. ADR 0006 Proposed Status
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0132

Entry kind: alias-accounting
Class: Judgment
Source digest: 9c8485790cf86a6a2235f130eeb8eac8443d0d9c3c6a400e3b969405245ccadf
Target digest: 6163b36b62dbb7c76e3510b09ab0d83b08f3542562b99abc5c41cd0534b0c789

```json
{
  "aliasId": "root-authorities-draft-0132",
  "fromPath": "docs/specs/work-state.md#bối-cảnh-3",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0006-context",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0132",
  "claimId": "claim_a79114f19bb479ea6b69c50166af8972",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bối-cảnh-3",
  "sourceUnitDigest": "9c8485790cf86a6a2235f130eeb8eac8443d0d9c3c6a400e3b969405245ccadf",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0006-context",
  "targetUnitDigest": "6163b36b62dbb7c76e3510b09ab0d83b",
  "targetBrowserAnchor": "0006-context",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bối-cảnh-3`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9c8485790cf86a6a2235f130eeb8eac8443d0d9c3c6a400e3b969405245ccadf
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0006-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 6163b36b62dbb7c76e3510b09ab0d83b08f3542562b99abc5c41cd0534b0c789
Shown text SHA256: 444dd310909b59d5f07ae6fcb5d37baabb321408cf24736a8429d49406cbbabf

```text
### 0006 Context
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0006 Context
\ No newline at end of file
```

### Existing decision evidence: claim_a79114f19bb479ea6b69c50166af8972

```json
{
  "claimId": "claim_a79114f19bb479ea6b69c50166af8972",
  "sourceUnitDigest": "9c8485790cf86a6a",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0006-context",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Bối cảnh\" of ADR 0006 is represented by the frozen H3 \"0006 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "6163b36b62dbb7c76e3510b09ab0d83b"
}
```

Complete native source: `docs/specs/work-state.md#bối-cảnh-3`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9c8485790cf86a6a2235f130eeb8eac8443d0d9c3c6a400e3b969405245ccadf
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0006-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 6163b36b62dbb7c76e3510b09ab0d83b08f3542562b99abc5c41cd0534b0c789
Shown text SHA256: 444dd310909b59d5f07ae6fcb5d37baabb321408cf24736a8429d49406cbbabf

```text
### 0006 Context
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0006 Context
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0133

Entry kind: alias-accounting
Class: Judgment
Source digest: 965caf0a033210097211032405753f3000abd6e872fb43f53017528db996c151
Target digest: ffd717cc616acfaa71c4fb8a61763bcfb0a5272b8345d44b839fc6e10e2afb43

```json
{
  "aliasId": "root-authorities-draft-0133",
  "fromPath": "docs/specs/work-state.md#quyết-định-3",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0006-decision",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0133",
  "claimId": "claim_99fa84eefd3c917530ef1a453f08be21",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "quyết-định-3",
  "sourceUnitDigest": "965caf0a033210097211032405753f3000abd6e872fb43f53017528db996c151",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0006-decision",
  "targetUnitDigest": "ffd717cc616acfaa71c4fb8a61763bcf",
  "targetBrowserAnchor": "0006-decision",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#quyết-định-3`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 965caf0a033210097211032405753f3000abd6e872fb43f53017528db996c151
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0006-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ffd717cc616acfaa71c4fb8a61763bcfb0a5272b8345d44b839fc6e10e2afb43
Shown text SHA256: 2e0ee675fff203fe13fe86f40c64cf88a5a1a7415e2e96dd891480e96e1cd591

```text
### 0006 Decision
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0006 Decision
\ No newline at end of file
```

### Existing decision evidence: claim_99fa84eefd3c917530ef1a453f08be21

```json
{
  "claimId": "claim_99fa84eefd3c917530ef1a453f08be21",
  "sourceUnitDigest": "965caf0a03321009",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0006-decision",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Quyết định\" of ADR 0006 is represented by the frozen H3 \"0006 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "ffd717cc616acfaa71c4fb8a61763bcf"
}
```

Complete native source: `docs/specs/work-state.md#quyết-định-3`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 965caf0a033210097211032405753f3000abd6e872fb43f53017528db996c151
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0006-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ffd717cc616acfaa71c4fb8a61763bcfb0a5272b8345d44b839fc6e10e2afb43
Shown text SHA256: 2e0ee675fff203fe13fe86f40c64cf88a5a1a7415e2e96dd891480e96e1cd591

```text
### 0006 Decision
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0006 Decision
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0134

Entry kind: alias-accounting
Class: Judgment
Source digest: 899175d57462b10345fc181dc2f7dbe36dc232d277f38a317cf156247aa4dcb9
Target digest: 783e9b5f2b2e44c3010507770e87c9785bcf8ff5b1aae09aecd902440090f996

```json
{
  "aliasId": "root-authorities-draft-0134",
  "fromPath": "docs/specs/work-state.md#hệ-quả-3",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0006-consequences",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0134",
  "claimId": "claim_e602fe2731b631f7be06ccebc5cf8e91",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "hệ-quả-3",
  "sourceUnitDigest": "899175d57462b10345fc181dc2f7dbe36dc232d277f38a317cf156247aa4dcb9",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0006-consequences",
  "targetUnitDigest": "783e9b5f2b2e44c3010507770e87c978",
  "targetBrowserAnchor": "0006-consequences",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#hệ-quả-3`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 899175d57462b10345fc181dc2f7dbe36dc232d277f38a317cf156247aa4dcb9
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0006-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 783e9b5f2b2e44c3010507770e87c9785bcf8ff5b1aae09aecd902440090f996
Shown text SHA256: 367ce997872afa280037ffb851cb96c81dcbe922afe549a73b3ce300f9b3f830

```text
### 0006 Consequences
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0006 Consequences
\ No newline at end of file
```

### Existing decision evidence: claim_e602fe2731b631f7be06ccebc5cf8e91

```json
{
  "claimId": "claim_e602fe2731b631f7be06ccebc5cf8e91",
  "sourceUnitDigest": "899175d57462b103",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0006-consequences",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Hệ quả\" of ADR 0006 is represented by the frozen H3 \"0006 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "783e9b5f2b2e44c3010507770e87c978"
}
```

Complete native source: `docs/specs/work-state.md#hệ-quả-3`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 899175d57462b10345fc181dc2f7dbe36dc232d277f38a317cf156247aa4dcb9
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0006-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 783e9b5f2b2e44c3010507770e87c9785bcf8ff5b1aae09aecd902440090f996
Shown text SHA256: 367ce997872afa280037ffb851cb96c81dcbe922afe549a73b3ce300f9b3f830

```text
### 0006 Consequences
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0006 Consequences
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0135

Entry kind: alias-accounting
Class: Judgment
Source digest: 0652eaa390a60c98405d46d2e62b3aac80aa32d00a54006debdda70257a3ffbf
Target digest: 38c7e64350e2c0ead7dc9dab84c6ecc28918e7bb019e31a35b07fc88b495842f

```json
{
  "aliasId": "root-authorities-draft-0135",
  "fromPath": "docs/specs/work-state.md#0007-tiến-hoá-schema-event",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "6-adr-0007-schema-and-event-evolution",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0135",
  "claimId": "claim_2f1ede55aaf8adff2f15c46ffc646e8d",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "0007-tiến-hoá-schema-event",
  "sourceUnitDigest": "0652eaa390a60c98405d46d2e62b3aac80aa32d00a54006debdda70257a3ffbf",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "6-adr-0007-schema-and-event-evolution",
  "targetUnitDigest": "38c7e64350e2c0ead7dc9dab84c6ecc2",
  "targetBrowserAnchor": "6-adr-0007-schema-and-event-evolution",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#0007-tiến-hoá-schema-event`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 0652eaa390a60c98405d46d2e62b3aac80aa32d00a54006debdda70257a3ffbf
Shown text SHA256: 8bb76364c5f990b82bd7f52ffdfffaebfd204c5886726482259c9d7872d7ea5b

```text
### 0007 — Tiến hoá schema & event
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#6-adr-0007-schema-and-event-evolution`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 38c7e64350e2c0ead7dc9dab84c6ecc28918e7bb019e31a35b07fc88b495842f
Shown text SHA256: d0a38ddb26b5d04d33184e57aa0fc1ff0220cbac7cc4cdd1a99416b70c01757b

```text
## 6. ADR 0007 Schema And Event Evolution
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### 0007 — Tiến hoá schema & event
\ No newline at end of file
+## 6. ADR 0007 Schema And Event Evolution
\ No newline at end of file
```

### Existing decision evidence: claim_2f1ede55aaf8adff2f15c46ffc646e8d

```json
{
  "claimId": "claim_2f1ede55aaf8adff2f15c46ffc646e8d",
  "sourceUnitDigest": "0652eaa390a60c98",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "6-adr-0007-schema-and-event-evolution",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Source ADR 0007 title heading is represented by the frozen H2 \"6. ADR 0007 ...\" (6-adr-0007-schema-and-event-evolution); title is renumbered and re-worded in English, text of the record is unchanged.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "38c7e64350e2c0ead7dc9dab84c6ecc2"
}
```

Complete native source: `docs/specs/work-state.md#0007-tiến-hoá-schema-event`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 0652eaa390a60c98405d46d2e62b3aac80aa32d00a54006debdda70257a3ffbf
Shown text SHA256: 8bb76364c5f990b82bd7f52ffdfffaebfd204c5886726482259c9d7872d7ea5b

```text
### 0007 — Tiến hoá schema & event
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#6-adr-0007-schema-and-event-evolution`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 38c7e64350e2c0ead7dc9dab84c6ecc28918e7bb019e31a35b07fc88b495842f
Shown text SHA256: d0a38ddb26b5d04d33184e57aa0fc1ff0220cbac7cc4cdd1a99416b70c01757b

```text
## 6. ADR 0007 Schema And Event Evolution
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### 0007 — Tiến hoá schema & event
\ No newline at end of file
+## 6. ADR 0007 Schema And Event Evolution
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0136

Entry kind: alias-accounting
Class: Judgment
Source digest: 5483e14a0ec0d67c7dc61a0c49e438a7274617176e5f82086ea2d136bae2ad43
Target digest: ab86aba22bff4bd95dfd666582cad23d4a6f3c760c8cf86de79efdac597d4dd2

```json
{
  "aliasId": "root-authorities-draft-0136",
  "fromPath": "docs/specs/work-state.md#bối-cảnh-4",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0007-context",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0136",
  "claimId": "claim_208f5cc84da2b23ab24abde2c91c4f06",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bối-cảnh-4",
  "sourceUnitDigest": "5483e14a0ec0d67c7dc61a0c49e438a7274617176e5f82086ea2d136bae2ad43",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0007-context",
  "targetUnitDigest": "ab86aba22bff4bd95dfd666582cad23d",
  "targetBrowserAnchor": "0007-context",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bối-cảnh-4`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5483e14a0ec0d67c7dc61a0c49e438a7274617176e5f82086ea2d136bae2ad43
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0007-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ab86aba22bff4bd95dfd666582cad23d4a6f3c760c8cf86de79efdac597d4dd2
Shown text SHA256: 29aef411c968fa81203ec950c4765d5cbae96e34fe775e83c5ca606e713ca578

```text
### 0007 Context
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0007 Context
\ No newline at end of file
```

### Existing decision evidence: claim_208f5cc84da2b23ab24abde2c91c4f06

```json
{
  "claimId": "claim_208f5cc84da2b23ab24abde2c91c4f06",
  "sourceUnitDigest": "5483e14a0ec0d67c",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0007-context",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Bối cảnh\" of ADR 0007 is represented by the frozen H3 \"0007 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "ab86aba22bff4bd95dfd666582cad23d"
}
```

Complete native source: `docs/specs/work-state.md#bối-cảnh-4`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 5483e14a0ec0d67c7dc61a0c49e438a7274617176e5f82086ea2d136bae2ad43
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0007-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: ab86aba22bff4bd95dfd666582cad23d4a6f3c760c8cf86de79efdac597d4dd2
Shown text SHA256: 29aef411c968fa81203ec950c4765d5cbae96e34fe775e83c5ca606e713ca578

```text
### 0007 Context
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0007 Context
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0137

Entry kind: alias-accounting
Class: Judgment
Source digest: eb9a345fe658f7c42e45f2cde5666e0946a8e55f948b709a4afb87d07719356d
Target digest: 08f6311c148ae29221fd5d1a3613d38b0e740914a3dcde683f27d48ee398de27

```json
{
  "aliasId": "root-authorities-draft-0137",
  "fromPath": "docs/specs/work-state.md#quyết-định-4",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0007-decision",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0137",
  "claimId": "claim_886f9acc902249e303bacc887ffb9882",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "quyết-định-4",
  "sourceUnitDigest": "eb9a345fe658f7c42e45f2cde5666e0946a8e55f948b709a4afb87d07719356d",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0007-decision",
  "targetUnitDigest": "08f6311c148ae29221fd5d1a3613d38b",
  "targetBrowserAnchor": "0007-decision",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#quyết-định-4`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: eb9a345fe658f7c42e45f2cde5666e0946a8e55f948b709a4afb87d07719356d
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0007-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 08f6311c148ae29221fd5d1a3613d38b0e740914a3dcde683f27d48ee398de27
Shown text SHA256: a174eab6f4adb5f0e9c2d57d34b96effa5c51d3bfe1af16ca326de67f2fe2cac

```text
### 0007 Decision
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0007 Decision
\ No newline at end of file
```

### Existing decision evidence: claim_886f9acc902249e303bacc887ffb9882

```json
{
  "claimId": "claim_886f9acc902249e303bacc887ffb9882",
  "sourceUnitDigest": "eb9a345fe658f7c4",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0007-decision",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Quyết định\" of ADR 0007 is represented by the frozen H3 \"0007 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "08f6311c148ae29221fd5d1a3613d38b"
}
```

Complete native source: `docs/specs/work-state.md#quyết-định-4`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: eb9a345fe658f7c42e45f2cde5666e0946a8e55f948b709a4afb87d07719356d
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0007-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 08f6311c148ae29221fd5d1a3613d38b0e740914a3dcde683f27d48ee398de27
Shown text SHA256: a174eab6f4adb5f0e9c2d57d34b96effa5c51d3bfe1af16ca326de67f2fe2cac

```text
### 0007 Decision
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0007 Decision
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0138

Entry kind: alias-accounting
Class: Judgment
Source digest: e5123dd05236e7c96e5998728159ce6f1528786e13cd7838a3bfc723563abbdb
Target digest: 55d9c1f19dff0d40bd97abcc406422ba20f7091135f9eaa20462af0bb2388f82

```json
{
  "aliasId": "root-authorities-draft-0138",
  "fromPath": "docs/specs/work-state.md#hệ-quả-4",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0007-consequences",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0138",
  "claimId": "claim_9faf2f6fcfad6a089f7077f61abb3b56",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "hệ-quả-4",
  "sourceUnitDigest": "e5123dd05236e7c96e5998728159ce6f1528786e13cd7838a3bfc723563abbdb",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0007-consequences",
  "targetUnitDigest": "55d9c1f19dff0d40bd97abcc406422ba",
  "targetBrowserAnchor": "0007-consequences",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#hệ-quả-4`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e5123dd05236e7c96e5998728159ce6f1528786e13cd7838a3bfc723563abbdb
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0007-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 55d9c1f19dff0d40bd97abcc406422ba20f7091135f9eaa20462af0bb2388f82
Shown text SHA256: 503ff6aebdc661d724d7f8935c3710a997a731aef7a02264ec8be6dffb54a8ba

```text
### 0007 Consequences
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0007 Consequences
\ No newline at end of file
```

### Existing decision evidence: claim_9faf2f6fcfad6a089f7077f61abb3b56

```json
{
  "claimId": "claim_9faf2f6fcfad6a089f7077f61abb3b56",
  "sourceUnitDigest": "e5123dd05236e7c9",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0007-consequences",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Hệ quả\" of ADR 0007 is represented by the frozen H3 \"0007 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "55d9c1f19dff0d40bd97abcc406422ba"
}
```

Complete native source: `docs/specs/work-state.md#hệ-quả-4`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e5123dd05236e7c96e5998728159ce6f1528786e13cd7838a3bfc723563abbdb
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0007-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 55d9c1f19dff0d40bd97abcc406422ba20f7091135f9eaa20462af0bb2388f82
Shown text SHA256: 503ff6aebdc661d724d7f8935c3710a997a731aef7a02264ec8be6dffb54a8ba

```text
### 0007 Consequences
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0007 Consequences
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0139

Entry kind: alias-accounting
Class: Judgment
Source digest: 520a09658b9497557f245c1299a8da65c50068afe1381b53d2f790f1437b025b
Target digest: 7b520a895337dc7ea9a23e4bcc1debc386a39fc1e8120673d0aa77ea4a309457

```json
{
  "aliasId": "root-authorities-draft-0139",
  "fromPath": "docs/specs/work-state.md#0011-version-tường-minh-cho-mọi-contract",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "7-adr-0011-explicit-version-for-every-contract",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0139",
  "claimId": "claim_e375b70390617716823280eb03a82a87",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "0011-version-tường-minh-cho-mọi-contract",
  "sourceUnitDigest": "520a09658b9497557f245c1299a8da65c50068afe1381b53d2f790f1437b025b",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "7-adr-0011-explicit-version-for-every-contract",
  "targetUnitDigest": "7b520a895337dc7ea9a23e4bcc1debc3",
  "targetBrowserAnchor": "7-adr-0011-explicit-version-for-every-contract",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#0011-version-tường-minh-cho-mọi-contract`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 520a09658b9497557f245c1299a8da65c50068afe1381b53d2f790f1437b025b
Shown text SHA256: f9b437339afb77da17655c0d037f46e418077e484c1e28e6431bdc03d876cd34

```text
### 0011 — Version tường minh cho mọi contract
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 7b520a895337dc7ea9a23e4bcc1debc386a39fc1e8120673d0aa77ea4a309457
Shown text SHA256: e40d77e9d954d1178c84fc462bbf98639d63d21bec819cda7fca44e429101a66

```text
## 7. ADR 0011 Explicit Version For Every Contract
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### 0011 — Version tường minh cho mọi contract
\ No newline at end of file
+## 7. ADR 0011 Explicit Version For Every Contract
\ No newline at end of file
```

### Existing decision evidence: claim_e375b70390617716823280eb03a82a87

```json
{
  "claimId": "claim_e375b70390617716823280eb03a82a87",
  "sourceUnitDigest": "520a09658b949755",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "7-adr-0011-explicit-version-for-every-contract",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Source ADR 0011 title heading is represented by the frozen H2 \"7. ADR 0011 ...\" (7-adr-0011-explicit-version-for-every-contract); title is renumbered and re-worded in English, text of the record is unchanged.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "7b520a895337dc7ea9a23e4bcc1debc3"
}
```

Complete native source: `docs/specs/work-state.md#0011-version-tường-minh-cho-mọi-contract`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 520a09658b9497557f245c1299a8da65c50068afe1381b53d2f790f1437b025b
Shown text SHA256: f9b437339afb77da17655c0d037f46e418077e484c1e28e6431bdc03d876cd34

```text
### 0011 — Version tường minh cho mọi contract
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 7b520a895337dc7ea9a23e4bcc1debc386a39fc1e8120673d0aa77ea4a309457
Shown text SHA256: e40d77e9d954d1178c84fc462bbf98639d63d21bec819cda7fca44e429101a66

```text
## 7. ADR 0011 Explicit Version For Every Contract
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### 0011 — Version tường minh cho mọi contract
\ No newline at end of file
+## 7. ADR 0011 Explicit Version For Every Contract
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0140

Entry kind: alias-accounting
Class: Judgment
Source digest: f0e519e3d177081f8c87798e69a8bfd6ec2a3721d617d8b81a188532ac67d006
Target digest: e113b11d301e876e8e3b3d3f59eca420dab2ea0aa6f3adc8d3ac076de93317d4

```json
{
  "aliasId": "root-authorities-draft-0140",
  "fromPath": "docs/specs/work-state.md#bối-cảnh-5",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0011-context",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0140",
  "claimId": "claim_a93bf40197e2bf32890a9cf931226e15",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bối-cảnh-5",
  "sourceUnitDigest": "f0e519e3d177081f8c87798e69a8bfd6ec2a3721d617d8b81a188532ac67d006",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0011-context",
  "targetUnitDigest": "e113b11d301e876e8e3b3d3f59eca420",
  "targetBrowserAnchor": "0011-context",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bối-cảnh-5`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f0e519e3d177081f8c87798e69a8bfd6ec2a3721d617d8b81a188532ac67d006
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0011-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e113b11d301e876e8e3b3d3f59eca420dab2ea0aa6f3adc8d3ac076de93317d4
Shown text SHA256: 9ab104320cd00625e47f2bde0545d82308ad97bb8e4fecfd8f88da77f27efc21

```text
### 0011 Context
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0011 Context
\ No newline at end of file
```

### Existing decision evidence: claim_a93bf40197e2bf32890a9cf931226e15

```json
{
  "claimId": "claim_a93bf40197e2bf32890a9cf931226e15",
  "sourceUnitDigest": "f0e519e3d177081f",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0011-context",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Bối cảnh\" of ADR 0011 is represented by the frozen H3 \"0011 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "e113b11d301e876e8e3b3d3f59eca420"
}
```

Complete native source: `docs/specs/work-state.md#bối-cảnh-5`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f0e519e3d177081f8c87798e69a8bfd6ec2a3721d617d8b81a188532ac67d006
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0011-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e113b11d301e876e8e3b3d3f59eca420dab2ea0aa6f3adc8d3ac076de93317d4
Shown text SHA256: 9ab104320cd00625e47f2bde0545d82308ad97bb8e4fecfd8f88da77f27efc21

```text
### 0011 Context
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0011 Context
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0141

Entry kind: alias-accounting
Class: Judgment
Source digest: 03f45ad00ec7a12c5133d79a3941f5911abce8372d7271c75988bda7ee94c3ec
Target digest: 28cc1686008a465c5f12c2c878349dc018dd023ba3dbd514689390ca5ac61776

```json
{
  "aliasId": "root-authorities-draft-0141",
  "fromPath": "docs/specs/work-state.md#quyết-định-5",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0011-decision",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0141",
  "claimId": "claim_ff4510bb2afe125aedac972ed943ce2c",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "quyết-định-5",
  "sourceUnitDigest": "03f45ad00ec7a12c5133d79a3941f5911abce8372d7271c75988bda7ee94c3ec",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0011-decision",
  "targetUnitDigest": "28cc1686008a465c5f12c2c878349dc0",
  "targetBrowserAnchor": "0011-decision",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#quyết-định-5`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 03f45ad00ec7a12c5133d79a3941f5911abce8372d7271c75988bda7ee94c3ec
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0011-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 28cc1686008a465c5f12c2c878349dc018dd023ba3dbd514689390ca5ac61776
Shown text SHA256: fb6d8d9f62c52238efbdeabada8de346838442fbf9d13406337db6b8f6fc7dbc

```text
### 0011 Decision
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0011 Decision
\ No newline at end of file
```

### Existing decision evidence: claim_ff4510bb2afe125aedac972ed943ce2c

```json
{
  "claimId": "claim_ff4510bb2afe125aedac972ed943ce2c",
  "sourceUnitDigest": "03f45ad00ec7a12c",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0011-decision",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Quyết định\" of ADR 0011 is represented by the frozen H3 \"0011 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "28cc1686008a465c5f12c2c878349dc0"
}
```

Complete native source: `docs/specs/work-state.md#quyết-định-5`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 03f45ad00ec7a12c5133d79a3941f5911abce8372d7271c75988bda7ee94c3ec
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0011-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 28cc1686008a465c5f12c2c878349dc018dd023ba3dbd514689390ca5ac61776
Shown text SHA256: fb6d8d9f62c52238efbdeabada8de346838442fbf9d13406337db6b8f6fc7dbc

```text
### 0011 Decision
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0011 Decision
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0142

Entry kind: alias-accounting
Class: Judgment
Source digest: 3bd6300879f149e85115d60fc55891e1f240d8e61447c372cda1982ea85ff3fe
Target digest: 54a5977501d4d13b842a24d99b66e4591c4b04006f57477f35b248e444d7585c

```json
{
  "aliasId": "root-authorities-draft-0142",
  "fromPath": "docs/specs/work-state.md#hệ-quả-5",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0011-consequences",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0142",
  "claimId": "claim_0dd6189a9d8ed1bcdd656127bf71774e",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "hệ-quả-5",
  "sourceUnitDigest": "3bd6300879f149e85115d60fc55891e1f240d8e61447c372cda1982ea85ff3fe",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0011-consequences",
  "targetUnitDigest": "54a5977501d4d13b842a24d99b66e459",
  "targetBrowserAnchor": "0011-consequences",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#hệ-quả-5`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 3bd6300879f149e85115d60fc55891e1f240d8e61447c372cda1982ea85ff3fe
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0011-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 54a5977501d4d13b842a24d99b66e4591c4b04006f57477f35b248e444d7585c
Shown text SHA256: 4a53ff82aa430855521ca2b6e7a39c0b247bd45bde3ff7e32c9d52c9afe836d2

```text
### 0011 Consequences
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0011 Consequences
\ No newline at end of file
```

### Existing decision evidence: claim_0dd6189a9d8ed1bcdd656127bf71774e

```json
{
  "claimId": "claim_0dd6189a9d8ed1bcdd656127bf71774e",
  "sourceUnitDigest": "3bd6300879f149e8",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0011-consequences",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Hệ quả\" of ADR 0011 is represented by the frozen H3 \"0011 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "54a5977501d4d13b842a24d99b66e459"
}
```

Complete native source: `docs/specs/work-state.md#hệ-quả-5`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 3bd6300879f149e85115d60fc55891e1f240d8e61447c372cda1982ea85ff3fe
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0011-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 54a5977501d4d13b842a24d99b66e4591c4b04006f57477f35b248e444d7585c
Shown text SHA256: 4a53ff82aa430855521ca2b6e7a39c0b247bd45bde3ff7e32c9d52c9afe836d2

```text
### 0011 Consequences
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0011 Consequences
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0143

Entry kind: alias-accounting
Class: Judgment
Source digest: 9b3ff4bedb1e8747640191bfea313ad3c8e14772aa83430035793053454b84cf
Target digest: e9c5857a60ea685d3aab78eae8e2b44b7d96e10698e4764d4a8b109e54f47f45

```json
{
  "aliasId": "root-authorities-draft-0143",
  "fromPath": "docs/specs/work-state.md#0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "8-adr-0012-unified-typed-edge-graph-model",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0143",
  "claimId": "claim_e3c928a8fca5c645487d1b574f0c5d36",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời",
  "sourceUnitDigest": "9b3ff4bedb1e8747640191bfea313ad3c8e14772aa83430035793053454b84cf",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "8-adr-0012-unified-typed-edge-graph-model",
  "targetUnitDigest": "e9c5857a60ea685d3aab78eae8e2b44b",
  "targetBrowserAnchor": "8-adr-0012-unified-typed-edge-graph-model",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9b3ff4bedb1e8747640191bfea313ad3c8e14772aa83430035793053454b84cf
Shown text SHA256: 8becd495fed9e2436c872f8672e52b6a8ada3233d33212c6026036a01f026d87

```text
### 0012 — Mô hình đồ thị cạnh-định-kiểu hợp nhất thay thế deps/parent tách rời
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e9c5857a60ea685d3aab78eae8e2b44b7d96e10698e4764d4a8b109e54f47f45
Shown text SHA256: 809e0d5779064889f37a1fee5d29bb97e7641b4b18f7fda0ffcaab8a9461530f

```text
## 8. ADR 0012 Unified Typed-Edge Graph Model
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### 0012 — Mô hình đồ thị cạnh-định-kiểu hợp nhất thay thế deps/parent tách rời
\ No newline at end of file
+## 8. ADR 0012 Unified Typed-Edge Graph Model
\ No newline at end of file
```

### Existing decision evidence: claim_e3c928a8fca5c645487d1b574f0c5d36

```json
{
  "claimId": "claim_e3c928a8fca5c645487d1b574f0c5d36",
  "sourceUnitDigest": "9b3ff4bedb1e8747",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "8-adr-0012-unified-typed-edge-graph-model",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Source ADR 0012 title heading is represented by the frozen H2 \"8. ADR 0012 ...\" (8-adr-0012-unified-typed-edge-graph-model); title is renumbered and re-worded in English, text of the record is unchanged.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "e9c5857a60ea685d3aab78eae8e2b44b"
}
```

Complete native source: `docs/specs/work-state.md#0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9b3ff4bedb1e8747640191bfea313ad3c8e14772aa83430035793053454b84cf
Shown text SHA256: 8becd495fed9e2436c872f8672e52b6a8ada3233d33212c6026036a01f026d87

```text
### 0012 — Mô hình đồ thị cạnh-định-kiểu hợp nhất thay thế deps/parent tách rời
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: e9c5857a60ea685d3aab78eae8e2b44b7d96e10698e4764d4a8b109e54f47f45
Shown text SHA256: 809e0d5779064889f37a1fee5d29bb97e7641b4b18f7fda0ffcaab8a9461530f

```text
## 8. ADR 0012 Unified Typed-Edge Graph Model
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### 0012 — Mô hình đồ thị cạnh-định-kiểu hợp nhất thay thế deps/parent tách rời
\ No newline at end of file
+## 8. ADR 0012 Unified Typed-Edge Graph Model
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0144

Entry kind: alias-accounting
Class: Judgment
Source digest: 95bdd9de256a67e0fa8dd10401b1d7f0844d1870123518726e598b2c5bae3595
Target digest: 0dc5cda4fa7fbd44208f88a810d9e6f77a67e9efa236041735d82bad31cd0158

```json
{
  "aliasId": "root-authorities-draft-0144",
  "fromPath": "docs/specs/work-state.md#bối-cảnh-6",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0012-context",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0144",
  "claimId": "claim_386a8c90d7f9d79a52190add7a82f33f",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bối-cảnh-6",
  "sourceUnitDigest": "95bdd9de256a67e0fa8dd10401b1d7f0844d1870123518726e598b2c5bae3595",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0012-context",
  "targetUnitDigest": "0dc5cda4fa7fbd44208f88a810d9e6f7",
  "targetBrowserAnchor": "0012-context",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bối-cảnh-6`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 95bdd9de256a67e0fa8dd10401b1d7f0844d1870123518726e598b2c5bae3595
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0012-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 0dc5cda4fa7fbd44208f88a810d9e6f77a67e9efa236041735d82bad31cd0158
Shown text SHA256: 6d8dad346c907c30682590dfe97a61488bc19528697a94023ff1a60c1d929407

```text
### 0012 Context
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0012 Context
\ No newline at end of file
```

### Existing decision evidence: claim_386a8c90d7f9d79a52190add7a82f33f

```json
{
  "claimId": "claim_386a8c90d7f9d79a52190add7a82f33f",
  "sourceUnitDigest": "95bdd9de256a67e0",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0012-context",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Bối cảnh\" of ADR 0012 is represented by the frozen H3 \"0012 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "0dc5cda4fa7fbd44208f88a810d9e6f7"
}
```

Complete native source: `docs/specs/work-state.md#bối-cảnh-6`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 95bdd9de256a67e0fa8dd10401b1d7f0844d1870123518726e598b2c5bae3595
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0012-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 0dc5cda4fa7fbd44208f88a810d9e6f77a67e9efa236041735d82bad31cd0158
Shown text SHA256: 6d8dad346c907c30682590dfe97a61488bc19528697a94023ff1a60c1d929407

```text
### 0012 Context
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0012 Context
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0145

Entry kind: alias-accounting
Class: Judgment
Source digest: 24cacb854eb926ac0ca1d2e0857cddeca8ae642c1e412f5f08515826e4b2dcce
Target digest: 9dee590708c4181b56606cd803fd345edfe4a9db456d03efe6a0d63e7b8ad917

```json
{
  "aliasId": "root-authorities-draft-0145",
  "fromPath": "docs/specs/work-state.md#quyết-định-6",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0012-decision",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0145",
  "claimId": "claim_3b4da5c5b12c6780b24e84b53ca73e49",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "quyết-định-6",
  "sourceUnitDigest": "24cacb854eb926ac0ca1d2e0857cddeca8ae642c1e412f5f08515826e4b2dcce",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0012-decision",
  "targetUnitDigest": "9dee590708c4181b56606cd803fd345e",
  "targetBrowserAnchor": "0012-decision",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#quyết-định-6`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 24cacb854eb926ac0ca1d2e0857cddeca8ae642c1e412f5f08515826e4b2dcce
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0012-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9dee590708c4181b56606cd803fd345edfe4a9db456d03efe6a0d63e7b8ad917
Shown text SHA256: 25511a2012d6e0d051f80a810e0fdd558d579e0d1a1ce472e9cdba4db062f260

```text
### 0012 Decision
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0012 Decision
\ No newline at end of file
```

### Existing decision evidence: claim_3b4da5c5b12c6780b24e84b53ca73e49

```json
{
  "claimId": "claim_3b4da5c5b12c6780b24e84b53ca73e49",
  "sourceUnitDigest": "24cacb854eb926ac",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0012-decision",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Quyết định\" of ADR 0012 is represented by the frozen H3 \"0012 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "9dee590708c4181b56606cd803fd345e"
}
```

Complete native source: `docs/specs/work-state.md#quyết-định-6`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 24cacb854eb926ac0ca1d2e0857cddeca8ae642c1e412f5f08515826e4b2dcce
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0012-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9dee590708c4181b56606cd803fd345edfe4a9db456d03efe6a0d63e7b8ad917
Shown text SHA256: 25511a2012d6e0d051f80a810e0fdd558d579e0d1a1ce472e9cdba4db062f260

```text
### 0012 Decision
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0012 Decision
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0146

Entry kind: alias-accounting
Class: Judgment
Source digest: f35473b9295a35aff0204ba97ea33eb6d3e19a99c6f25796258beb4e73e0e9b2
Target digest: 764a0029f0ee73f78c522c71e69830fac20871e226b636c7832f1461d0c0c79c

```json
{
  "aliasId": "root-authorities-draft-0146",
  "fromPath": "docs/specs/work-state.md#hệ-quả-6",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0012-consequences",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0146",
  "claimId": "claim_c6a32a1e4ab8c7078b89199236f3d5e0",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "hệ-quả-6",
  "sourceUnitDigest": "f35473b9295a35aff0204ba97ea33eb6d3e19a99c6f25796258beb4e73e0e9b2",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0012-consequences",
  "targetUnitDigest": "764a0029f0ee73f78c522c71e69830fa",
  "targetBrowserAnchor": "0012-consequences",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#hệ-quả-6`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f35473b9295a35aff0204ba97ea33eb6d3e19a99c6f25796258beb4e73e0e9b2
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0012-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 764a0029f0ee73f78c522c71e69830fac20871e226b636c7832f1461d0c0c79c
Shown text SHA256: 72f0f0dc875a20c790689a8ef4b33933fb852e8407285abec76b0f404d3ef349

```text
### 0012 Consequences
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0012 Consequences
\ No newline at end of file
```

### Existing decision evidence: claim_c6a32a1e4ab8c7078b89199236f3d5e0

```json
{
  "claimId": "claim_c6a32a1e4ab8c7078b89199236f3d5e0",
  "sourceUnitDigest": "f35473b9295a35af",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0012-consequences",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Hệ quả\" of ADR 0012 is represented by the frozen H3 \"0012 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "764a0029f0ee73f78c522c71e69830fa"
}
```

Complete native source: `docs/specs/work-state.md#hệ-quả-6`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f35473b9295a35aff0204ba97ea33eb6d3e19a99c6f25796258beb4e73e0e9b2
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0012-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 764a0029f0ee73f78c522c71e69830fac20871e226b636c7832f1461d0c0c79c
Shown text SHA256: 72f0f0dc875a20c790689a8ef4b33933fb852e8407285abec76b0f404d3ef349

```text
### 0012 Consequences
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0012 Consequences
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0147

Entry kind: alias-accounting
Class: Judgment
Source digest: f529cf675d973db5c441eb564349795365a178af00c24a64574e719574a90d9a
Target digest: bb9207e0916a5823e45378afb7d0247d511cb2bf870386fdefd982d8a17e51cb

```json
{
  "aliasId": "root-authorities-draft-0147",
  "fromPath": "docs/specs/work-state.md#0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0147",
  "claimId": "claim_2d27908b73621a411fcf708b067b6ba2",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from",
  "sourceUnitDigest": "f529cf675d973db5c441eb564349795365a178af00c24a64574e719574a90d9a",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
  "targetUnitDigest": "bb9207e0916a5823e45378afb7d0247d",
  "targetBrowserAnchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f529cf675d973db5c441eb564349795365a178af00c24a64574e719574a90d9a
Shown text SHA256: 000c67be90ce6cf84b7b6f08ea28cc7cdc5eb728f4918ddadbe4a054458a5e1e

```text
### 0013 — Kênh báo-cáo-không-ghi (worker→runner) cho `discovered-from`
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: bb9207e0916a5823e45378afb7d0247d511cb2bf870386fdefd982d8a17e51cb
Shown text SHA256: 5b12f1cae688be998654991d34b122ed4022ba9ca9c9daa612a8272737f983e6

```text
## 9. ADR 0013 Report-Not-Write Channel For Discovered-From
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-### 0013 — Kênh báo-cáo-không-ghi (worker→runner) cho `discovered-from`
\ No newline at end of file
+## 9. ADR 0013 Report-Not-Write Channel For Discovered-From
\ No newline at end of file
```

### Existing decision evidence: claim_2d27908b73621a411fcf708b067b6ba2

```json
{
  "claimId": "claim_2d27908b73621a411fcf708b067b6ba2",
  "sourceUnitDigest": "f529cf675d973db5",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Source ADR 0013 title heading is represented by the frozen H2 \"9. ADR 0013 ...\" (9-adr-0013-report-not-write-channel-for-discovered-from); title is renumbered and re-worded in English, text of the record is unchanged.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "bb9207e0916a5823e45378afb7d0247d"
}
```

Complete native source: `docs/specs/work-state.md#0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: f529cf675d973db5c441eb564349795365a178af00c24a64574e719574a90d9a
Shown text SHA256: 000c67be90ce6cf84b7b6f08ea28cc7cdc5eb728f4918ddadbe4a054458a5e1e

```text
### 0013 — Kênh báo-cáo-không-ghi (worker→runner) cho `discovered-from`
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: bb9207e0916a5823e45378afb7d0247d511cb2bf870386fdefd982d8a17e51cb
Shown text SHA256: 5b12f1cae688be998654991d34b122ed4022ba9ca9c9daa612a8272737f983e6

```text
## 9. ADR 0013 Report-Not-Write Channel For Discovered-From
```

```diff
--- source
+++ target
@@ -1 +1 @@
-### 0013 — Kênh báo-cáo-không-ghi (worker→runner) cho `discovered-from`
\ No newline at end of file
+## 9. ADR 0013 Report-Not-Write Channel For Discovered-From
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0148

Entry kind: alias-accounting
Class: Judgment
Source digest: 31a7f48e9cc16169ae86eca79b0e4f00c8db944f0459f712a74075403989eefe
Target digest: 39a94a27f6e89fec290ba89590cff97929d9c7625c0ad041e4bb461c53fe5d61

```json
{
  "aliasId": "root-authorities-draft-0148",
  "fromPath": "docs/specs/work-state.md#bối-cảnh-7",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0013-context",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0148",
  "claimId": "claim_e68c14be45a430e3676761d7bdc9e6db",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "bối-cảnh-7",
  "sourceUnitDigest": "31a7f48e9cc16169ae86eca79b0e4f00c8db944f0459f712a74075403989eefe",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0013-context",
  "targetUnitDigest": "39a94a27f6e89fec290ba89590cff979",
  "targetBrowserAnchor": "0013-context",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#bối-cảnh-7`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 31a7f48e9cc16169ae86eca79b0e4f00c8db944f0459f712a74075403989eefe
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0013-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 39a94a27f6e89fec290ba89590cff97929d9c7625c0ad041e4bb461c53fe5d61
Shown text SHA256: 04c6557faaea8ef873ac2c87895657e4f3758ef14163c83b8aa3462f777feabb

```text
### 0013 Context
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0013 Context
\ No newline at end of file
```

### Existing decision evidence: claim_e68c14be45a430e3676761d7bdc9e6db

```json
{
  "claimId": "claim_e68c14be45a430e3676761d7bdc9e6db",
  "sourceUnitDigest": "31a7f48e9cc16169",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0013-context",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Bối cảnh\" of ADR 0013 is represented by the frozen H3 \"0013 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "39a94a27f6e89fec290ba89590cff979"
}
```

Complete native source: `docs/specs/work-state.md#bối-cảnh-7`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 31a7f48e9cc16169ae86eca79b0e4f00c8db944f0459f712a74075403989eefe
Shown text SHA256: 225e45b1dd2b3c7483caf70343595d5d24a3d7e79bc72c59d98aecf606c8b9ea

```text
#### Bối cảnh
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0013-context`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 39a94a27f6e89fec290ba89590cff97929d9c7625c0ad041e4bb461c53fe5d61
Shown text SHA256: 04c6557faaea8ef873ac2c87895657e4f3758ef14163c83b8aa3462f777feabb

```text
### 0013 Context
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Bối cảnh
\ No newline at end of file
+### 0013 Context
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0149

Entry kind: alias-accounting
Class: Judgment
Source digest: 9b836a5af7fa427d6991eaabe7781f566d664801b58ca1f13b67277ea39ad7f0
Target digest: dc61b855030de6ec8c01fd1fd46215522d2327be9adb6c025724d974f8843b8e

```json
{
  "aliasId": "root-authorities-draft-0149",
  "fromPath": "docs/specs/work-state.md#quyết-định-7",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0013-decision",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0149",
  "claimId": "claim_1f9265c6ad8bc4b9e8cf754fb1b8b164",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "quyết-định-7",
  "sourceUnitDigest": "9b836a5af7fa427d6991eaabe7781f566d664801b58ca1f13b67277ea39ad7f0",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0013-decision",
  "targetUnitDigest": "dc61b855030de6ec8c01fd1fd4621552",
  "targetBrowserAnchor": "0013-decision",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#quyết-định-7`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9b836a5af7fa427d6991eaabe7781f566d664801b58ca1f13b67277ea39ad7f0
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0013-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dc61b855030de6ec8c01fd1fd46215522d2327be9adb6c025724d974f8843b8e
Shown text SHA256: 940c5f0e8d1907107c283beae62da4d2a8219234106351ebc4e635b2f4f6fed7

```text
### 0013 Decision
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0013 Decision
\ No newline at end of file
```

### Existing decision evidence: claim_1f9265c6ad8bc4b9e8cf754fb1b8b164

```json
{
  "claimId": "claim_1f9265c6ad8bc4b9e8cf754fb1b8b164",
  "sourceUnitDigest": "9b836a5af7fa427d",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0013-decision",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Quyết định\" of ADR 0013 is represented by the frozen H3 \"0013 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "dc61b855030de6ec8c01fd1fd4621552"
}
```

Complete native source: `docs/specs/work-state.md#quyết-định-7`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 9b836a5af7fa427d6991eaabe7781f566d664801b58ca1f13b67277ea39ad7f0
Shown text SHA256: 7b31cfa4db5cec3758d413b4b63ffb5bc5b899a1ee4002087c00488a0a5089a4

```text
#### Quyết định
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0013-decision`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: dc61b855030de6ec8c01fd1fd46215522d2327be9adb6c025724d974f8843b8e
Shown text SHA256: 940c5f0e8d1907107c283beae62da4d2a8219234106351ebc4e635b2f4f6fed7

```text
### 0013 Decision
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Quyết định
\ No newline at end of file
+### 0013 Decision
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.
## root-authorities-draft-0150

Entry kind: alias-accounting
Class: Judgment
Source digest: 261b711fa046562a35014f434dbf1d8f6407b07a3ffd954587406a05682d15d4
Target digest: 19ae019de9e9e6e87ca9d19d8bb92a18bbefab9ab1579d1010a315477e994782

```json
{
  "aliasId": "root-authorities-draft-0150",
  "fromPath": "docs/specs/work-state.md#hệ-quả-7",
  "toOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "toAnchor": "0013-consequences",
  "kind": "split",
  "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "immutableRefs": [],
  "recordedAt": "2026-10-14"
}
```
```json
{
  "aliasId": "root-authorities-draft-0150",
  "claimId": "claim_df1ec9feeaeb131a98f44cebcd3c8f6c",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "hệ-quả-7",
  "sourceUnitDigest": "261b711fa046562a35014f434dbf1d8f6407b07a3ffd954587406a05682d15d4",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "targetNativeAnchor": "0013-consequences",
  "targetUnitDigest": "19ae019de9e9e6e87ca9d19d8bb92a18",
  "targetBrowserAnchor": "0013-consequences",
  "authoredBy": "codex-session:23@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Preview only: exact reviewed disposition identifies the owner; browser navigation uses a real containing heading while the native decision anchor/digest remain in this binding. Consumer files and the active alias table stay untouched. At cutover revalidate source/target bytes and independent review before activating this proposal."
}
```

Complete alias/retained source: `docs/specs/work-state.md#hệ-quả-7`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 261b711fa046562a35014f434dbf1d8f6407b07a3ffd954587406a05682d15d4
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete navigation destination (distinct from native decision target): `docs/platform/work-state/decisions/retired-decision-history.md#0013-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 19ae019de9e9e6e87ca9d19d8bb92a18bbefab9ab1579d1010a315477e994782
Shown text SHA256: 8e609ca7a029be61ed5cd0fd74e146f8ac449c05b79c56fca9e3d471e4d4cd44

```text
### 0013 Consequences
```

Complete navigation-source/destination diff:
```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0013 Consequences
\ No newline at end of file
```

### Existing decision evidence: claim_df1ec9feeaeb131a98f44cebcd3c8f6c

```json
{
  "claimId": "claim_df1ec9feeaeb131a98f44cebcd3c8f6c",
  "sourceUnitDigest": "261b711fa046562a",
  "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
  "reviewStatus": "reviewed",
  "targetAnchor": "0013-consequences",
  "claimKind": "decision",
  "disposition": "promote",
  "rationale": "Section heading \"Hệ quả\" of ADR 0013 is represented by the frozen H3 \"0013 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same.",
  "reviewedBy": "independent reviewer (review-b-decisions-first)",
  "reviewedAt": "2026-10-07",
  "targetUnitDigest": "19ae019de9e9e6e87ca9d19d8bb92a18"
}
```

Complete native source: `docs/specs/work-state.md#hệ-quả-7`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 261b711fa046562a35014f434dbf1d8f6407b07a3ffd954587406a05682d15d4
Shown text SHA256: 5b194b163344778a86d1ffafd2bd224fd8a850d1adce581aea88af47fe61a7fd

```text
#### Hệ quả
```

Complete native target: `docs/platform/work-state/decisions/retired-decision-history.md#0013-consequences`
Commit: a125b4ec0ab4dc4717488c60f0dd305054c6f022
Native unit SHA256: 19ae019de9e9e6e87ca9d19d8bb92a18bbefab9ab1579d1010a315477e994782
Shown text SHA256: 8e609ca7a029be61ed5cd0fd74e146f8ac449c05b79c56fca9e3d471e4d4cd44

```text
### 0013 Consequences
```

```diff
--- source
+++ target
@@ -1 +1 @@
-#### Hệ quả
\ No newline at end of file
+### 0013 Consequences
\ No newline at end of file
```

This proposal remains pending. Existing reviewed source bindings are not resubmitted or overwritten.

## Consumer edge appendix — root-alias-02

Edges: 0
Native identity population SHA256: 4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945
Full machine-readable appendix: plans/260925-documentation-authority-unification/reports/phase-06/preview-261014-2105-root-alias-consumer-edges.json, partition root-alias-02. Every record below includes all native identity fields, full identity hash, assigned pack, action, category and rationale. Executable/data references still require contract review even where immutable bytes stay unchanged.

