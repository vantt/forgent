# Bounded re-review: accounting 6

Author session: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **12**; each request at most60 entries and400000 bytes.

[Single request index](review-request-step10-index-287a22d33.md). Before values are historical; currentDecision and after for content rows come from `git show <content commit>:<shard>` through unchanged `reviewEntryFromCommittedRow`. New package-native predecessor rows are explicitly labelled overlay and require the runner package commit. No seed, sample IDs or verdict chosen by producer.

Reproduce all-shard consistency and every714 generated rationale (unchanged checker, no --apply):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduce.py consistency
```

Reproduce tests yourself (473 expected):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-*.test.mjs test/scripts/check-doc-*.test.mjs test/scripts/generate-doc-inventory.test.mjs test/scripts/list-doc-anchors.test.mjs test/scripts/verify-phase-02.test.mjs test/scripts/next-doc-id.test.mjs
```

Run at the runner package checkout from repository root. The consistency reproduction materializes scratch only under `/tmp/fgos-work/`, checks all90 pinned shards with the original checker, verifies their current-row equality, then audits all4 package-native rows with unchanged `checkLegacyRationale`:12893 rows/91 nonempty shards in total. The original checker directly on the new shard errors because its historical oldRow lookup assumes every shard existed at5035fed52; that observed limitation is preserved in `step10-sync287-rationale-consistency.log`. No checker code was altered or bypassed for a pass.

Review every submitted current claim with an ordinary verdict and full digest/anchor/shard equality. Rationales are grouped for mechanical regeneration plus an independent seeded deep sample of at least108/714. A36 additionally requires reviewer-seeded at least162/1079 conservative Weak-exact/Judgment population, every unequal source/target digest and partial/historical row deep. One independently selected draw may satisfy both populations if both coverage thresholds are met; otherwise add draws. All exact doc corrections, tool changes and marked native predecessor transitions are deep. >3% deep rework escalates to the entire pack. Report seed/sample IDs and each claim's deep/mechanical note. Independent checkpoint/truth/red-team obligations remain. Confirmations retain existing committed approvals; metadata/evidence/native entries do not approve claims.

## Entry accounting-036

```json
{
  "kind": "new-native-predecessor-decision",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round3-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_d342cec565707124f0b4e7860db2193c",
  "currentDecision": {
    "claimId": "claim_d342cec565707124f0b4e7860db2193c",
    "sourcePath": "docs/platform/host-invocation-routing/vision.md",
    "sourceUnitDigest": "d02d7891949ca1a0284d509b5c8828e1631138f4d32c20830d5491efb75836c8",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/host-invocation-routing/vision.md",
    "targetAnchor": "unheaded-block-11",
    "targetUnitDigest": "ae9e5973a1589865f79a8daee8e14aa245ce6a8b7a0f7af3978006e63771ebb2",
    "targetAncestry": [
      "Host Invocation Vision",
      "5. Design Direction"
    ],
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
    "reviewNote": "Independent review pending at 287a22d33; no approval carried."
  },
  "packageOverlay": true,
  "contentPin": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "before": null,
  "deepRequired": true,
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-predecessor-reconciliation.json",
  "reviewScope": "Pending package-overlay row, to be bound to runner package commit; not claimed to exist at content pin.",
  "entryId": "accounting-036"
}
```

## Entry accounting-037

```json
{
  "kind": "new-native-predecessor-decision",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round3-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_a4ed6ca5cfd26790037b35d1c99373b2",
  "currentDecision": {
    "claimId": "claim_a4ed6ca5cfd26790037b35d1c99373b2",
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "sourceUnitDigest": "9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-75",
    "targetUnitDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail",
      "Workspace Runtime Model"
    ],
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
    "reviewNote": "Independent review pending at 287a22d33; no approval carried."
  },
  "packageOverlay": true,
  "contentPin": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "before": null,
  "deepRequired": true,
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-predecessor-reconciliation.json",
  "reviewScope": "Pending package-overlay row, to be bound to runner package commit; not claimed to exist at content pin.",
  "entryId": "accounting-037"
}
```

## Entry accounting-038

```json
{
  "kind": "new-native-predecessor-decision",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round3-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_c0f157804addf46fdb20b9c61882794b",
  "currentDecision": {
    "claimId": "claim_c0f157804addf46fdb20b9c61882794b",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "targetUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
    "reviewNote": "Independent review pending at 287a22d33; no approval carried."
  },
  "packageOverlay": true,
  "contentPin": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "before": null,
  "deepRequired": true,
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-predecessor-reconciliation.json",
  "reviewScope": "Pending package-overlay row, to be bound to runner package commit; not claimed to exist at content pin.",
  "entryId": "accounting-038"
}
```

## Entry accounting-039

```json
{
  "kind": "new-native-predecessor-decision",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round3-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_647a9d5f06216a5e9d6fa267e77cbf03",
  "currentDecision": {
    "claimId": "claim_647a9d5f06216a5e9d6fa267e77cbf03",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
    "reviewNote": "Independent review pending at 287a22d33; no approval carried."
  },
  "packageOverlay": true,
  "contentPin": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "before": null,
  "deepRequired": true,
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-predecessor-reconciliation.json",
  "reviewScope": "Pending package-overlay row, to be bound to runner package commit; not claimed to exist at content pin.",
  "entryId": "accounting-039"
}
```

## Entry fresh-checks

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-checks",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-checks.json",
  "SHA256": "4419c78b9738729cd5b6237de658e1ca81fa389d2038dafce23c2dc89e9e6bbb",
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "reviewScope": "Read and independently reproduce the measured result; this artifact is no substantive verdict.",
  "checkARecord": {
    "historicalOffenders": [
      "plans/260925-documentation-authority-unification/phase-06-transform-all-platform-areas-as-candidate-material.md",
      "plans/260925-documentation-authority-unification/phase-08-eliminate-switchboard-bypasses-and-prepare-consumers.md",
      "plans/260925-documentation-authority-unification/phase-09-atomic-platform-authority-cutover.md",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/consumer-survey.json",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/consumer-survey.md",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/open-questions.md",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/phase-07-draft.md",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/phase-08-draft.md"
    ],
    "historicalEqual": true,
    "newWorkingViolations": [],
    "ok": true
  }
}
```

## Entry fresh-native-proof

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-native-proof",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-native-proof.json",
  "SHA256": "e402e4bb77f8477d878fc702361cebae1f33dcb3e1e22a1d61c2eeb95df66b96",
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "reviewScope": "Read and independently reproduce the measured result; this artifact is no substantive verdict.",
  "checkARecord": null
}
```

## Entry fresh-D-summary

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-D-summary",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-D-summary.json",
  "SHA256": "ad10af5a8240433eb286cacbb4b005e0f90e5a4895ecdeec9b07597347245f69",
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "reviewScope": "Read and independently reproduce the measured result; this artifact is no substantive verdict.",
  "checkARecord": null
}
```

## Entry fresh-rebindings

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-rebindings",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-rebindings.json",
  "SHA256": "6d61bbe6023dbb86f9dc4fb6dc2a0f96772e2cfbbf7e6b5f117a618c67ea2dd0",
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "reviewScope": "Read and independently reproduce the measured result; this artifact is no substantive verdict.",
  "checkARecord": null
}
```

## Entry fresh-target-ownership

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-target-ownership",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-target-ownership.json",
  "SHA256": "3a4a84a8213e7feb1b54ac40f297a2b7333c216c842c1150a5f2ec77a29dbaed",
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "reviewScope": "Read and independently reproduce the measured result; this artifact is no substantive verdict.",
  "checkARecord": null
}
```

## Entry fresh-link-replay

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-link-replay",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-link-replay.json",
  "SHA256": "973ed51820a387ce5addf7e63d58c949083ccc9c7d0b92746ab887a86f911d57",
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "reviewScope": "Read and independently reproduce the measured result; this artifact is no substantive verdict.",
  "checkARecord": null
}
```

## Entry fresh-all-shards-consistency

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-all-shards-consistency",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-all-shards-consistency.json",
  "SHA256": "9ce78c4188035dff996abefe0e3c0587445155adcb8732bea910b154ec78ceba",
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "reviewScope": "Read and independently reproduce the measured result; this artifact is no substantive verdict.",
  "checkARecord": null
}
```

## Entry fresh-predecessor-reconciliation

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-predecessor-reconciliation",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-predecessor-reconciliation.json",
  "SHA256": "01ffb763798085409ea8a6277c2d05026906879c0b4fbcebb8ec8d1682b13590",
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "reviewScope": "Read and independently reproduce the measured result; this artifact is no substantive verdict.",
  "checkARecord": null
}
```

