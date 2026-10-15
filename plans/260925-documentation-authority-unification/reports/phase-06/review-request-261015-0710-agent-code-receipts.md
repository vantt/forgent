# Machine code classification receipt request

Content commit: `dfff335d3f620b49403e4e4b2f70cedee5ca0452`. Comparison base: `36d79ddcc4e421b4739e34f73be8f878bedfadf7`. Packaging author: codex-session:43@2026-10-15. Entries: **4**. One bounded re-review set; this file is one part. Independent acceptance pending.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. This bounded request does not replace that checkpoint; the author has not created or selected its sensitivity pack/key.

Read review-brief.md, owner-answers.md A19/A22/A28/A31/A34/A36/A37 and progress.md. Check full units, conditions, remainders, ownership and all differing digests. Reviewer selects the A36 sample independently; every rationale/ownership change and differing pair requires deep reading. Source/gap decisions use the ordinary five-column table; classification receipts use the separate Receipt commit and Class-column protocol below. No author verdict is approval.

Verification and remaining blockers: [verification-261015-0710-native-sync-bounded-rereview.md](verification-261015-0710-native-sync-bounded-rereview.md). Report names were obtained from fgos convention path; the returned basename is placed inside the authorized plan report directory because the default plans/reports root is outside write scope.

Author session: codex-session:37@2026-10-15

Receipt commit: dfff335d3f620b49403e4e4b2f70cedee5ca0452

Receipt path: `plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json`.

This is a classification request. A separate independent report must repeat Author session, Reviewer and Receipt commit headers and the exact table below. The reviewer replaces pending with ok/rework/hold and writes a specific note. Current-content receipts additionally require the full evidence digest in the verdict/report under A12. Ordinary five-column observations or machine-equivalence notes do not close this channel.

| Claim | Class | Verdict | Unit digest | Shown text digest | Note |
|---|---|---|---|---|---|
| claim_366503bd4dadea43469f1586f4f25f60 | candidate-native-content | pending | 8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3 | 8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3 | Independent review requested; no author verdict. |
| claim_fa99f4d5cfcd0ea169efdf450e007955 | candidate-native-content | pending | 008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857 | 008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857 | Independent review requested; no author verdict. |
| claim_ad38a91ec63db8a175d99078bcf6e158 | candidate-native-content | pending | 4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e | 4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e | Independent review requested; no author verdict. |
| claim_c5395a2e8480ce44d27f2873c02b8746 | candidate-native-content | pending | 23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613 | 23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613 | Independent review requested; no author verdict. |

### Content verdict table extension required by the native A12 validator

The six-column table above is the complete request index required by review-brief.md. For candidate-native-content, the committed reviewer verdict must use the seventh Evidence digest column below; for the other classes it uses six columns. Write one final verdict per claim, not duplicate report verdicts. Pending index rows are not approvals.

| Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest |
|---|---|---|---|---|---|---|
| claim_366503bd4dadea43469f1586f4f25f60 | candidate-native-content | pending | 8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3 | 8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3 | Independent content acceptance requested. | 48eca430cc7733450e5d0e0cf5c254e787cb5214b9537ddf21693f00c6afab3f |
| claim_fa99f4d5cfcd0ea169efdf450e007955 | candidate-native-content | pending | 008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857 | 008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857 | Independent content acceptance requested. | 2f5e23426e0685a7cf79304fb003fab8eb3f975eaef265b93f2407eb7311f9ad |
| claim_ad38a91ec63db8a175d99078bcf6e158 | candidate-native-content | pending | 4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e | 4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e | Independent content acceptance requested. | 2f5e23426e0685a7cf79304fb003fab8eb3f975eaef265b93f2407eb7311f9ad |
| claim_c5395a2e8480ce44d27f2873c02b8746 | candidate-native-content | pending | 23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613 | 23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613 | Independent content acceptance requested. | 48eca430cc7733450e5d0e0cf5c254e787cb5214b9537ddf21693f00c6afab3f |

## 1. claim_366503bd4dadea43469f1586f4f25f60

### Before receipt

```json
{
  "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
  "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
  "anchor": "unheaded-block-39",
  "unitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
  "shownText": "Current compiled fields (`src/runner/dispatch/plan.mjs:444-461`) are\n`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,\n`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,\n`bindingSource`, `tier`, `model`, `providerModel`, `provenance`, and `policy`.\nGovernance uses its actual provider/egress shape; there is no top-level\n`target`, `handback` or `execution` wrapper and no `egress.allowed` flag.",
  "shownTextDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:1@2026-10-10",
  "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 6. DispatchPlan > 6.1 Shape, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
  "truthSection": {
    "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
    "anchor": "61-shape",
    "status": "verified",
    "reason": null
  },
  "currentEvidence": {
    "commit": "69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 91,
        "endLine": 104,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      },
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 455,
        "endLine": 472,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      }
    ],
    "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
    "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
  },
  "recoveryProvenance": {
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
    "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
    "verdictClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
    "unitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
    "originalAuthorSession": "codex-session:1@2026-10-10"
  }
}
```

### Committed receipt (full shown text and evidence)

```json
{
  "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
  "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
  "anchor": "unheaded-block-39",
  "unitDigest": "8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3",
  "shownText": "Current compiled fields (`src/runner/dispatch/plan.mjs:455-472`) are\n`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,\n`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,\n`bindingSource`, `tier`, `model`, `providerModel`, `provenance`, and `policy`.\nGovernance uses its actual provider/egress shape; there is no top-level\n`target`, `handback` or `execution` wrapper and no `egress.allowed` flag.",
  "shownTextDigest": "8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:1@2026-10-10",
  "rationale": "The current sentence cites the actual compiled DispatchPlan return object at plan.mjs:455-472 and optional capability fields at 464-465. Only the stale line numbers changed; independent classification/content review remains pending.",
  "truthSection": {
    "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
    "anchor": "61-shape",
    "status": "verified",
    "reason": null
  },
  "currentEvidence": {
    "commit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 91,
        "endLine": 104,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      },
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 455,
        "endLine": 472,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      }
    ],
    "scope": "Author checked current code; independent review pending.",
    "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/accounting-261015-0700-whole-system-verdict-corrections.md.json"
  },
  "recoveryProvenance": {
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
    "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
    "verdictClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
    "unitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
    "originalAuthorSession": "codex-session:1@2026-10-10"
  },
  "amendedBy": "codex-session:42@2026-10-15",
  "reviewStatus": "pending",
  "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
}
```

### Complete shown text: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-39` at `dfff335d3f620b49403e4e4b2f70cedee5ca0452`.

Unit digest: `8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3`. Full shown-text SHA256: `8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3`.

```json
{
  "ancestry": [
    "Dispatch Control Plane Redesign",
    "6. DispatchPlan",
    "6.1 Shape"
  ]
}
```

```text
Current compiled fields (`src/runner/dispatch/plan.mjs:455-472`) are
`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,
`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,
`bindingSource`, `tier`, `model`, `providerModel`, `provenance`, and `policy`.
Governance uses its actual provider/egress shape; there is no top-level
`target`, `handback` or `execution` wrapper and no `egress.allowed` flag.
```

### Reference metadata before/after

```json
[
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "collection": "candidateClassifications",
    "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
    "before": {
      "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "reviewed",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
      "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
      "reviewMode": "ordinary",
      "reviewNote": "deep: machine re-pin proven by script, both spans of plan.mjs byte-identical (80-93 to 91-104, 444-461 to 455-472, unique match), shown text equals unit lines 172-177, digest 2f26ef79 recomputed, pending, original author and class kept; the candidate prose still says plan.mjs:444-461 which is stale as a line number but is a preserved byte, truth deferred to promotion"
    },
    "after": {
      "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: shown text cites `src/runner/dispatch/plan.mjs:444-461` for the compiled DispatchPlan fields but after the main merge the returned object is at plan.mjs 455-472 (lines 444-461 are now the executor-mismatch handling); the receipt evidence was re-pinned to 455-472 while the candidate text kept the old numbers, so a content sentence is stale by 11 lines. Field list itself matches the return object. Machine equivalence is not truth acceptance; also still owed the separate formal classification report. Fix by an A19 line-number correction or reclassify as candidate-unverified under A31",
        "verdict": "rework",
        "sourceUnitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "targetUnitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "deep: machine re-pin proven by script, both spans of plan.mjs byte-identical (80-93 to 91-104, 444-461 to 455-472, unique match), shown text equals unit lines 172-177, digest 2f26ef79 recomputed, pending, original author and class kept; the candidate prose still says plan.mjs:444-461 which is stale as a line number but is a preserved byte, truth deferred to promotion"
      },
      "pendingReceiptCommit": "Bind the actual runner settlement artifact next turn after native identity reconciliation.",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    }
  }
]
```

Evidence digest (SHA256 of JSON.stringify(currentEvidence)): `48eca430cc7733450e5d0e0cf5c254e787cb5214b9537ddf21693f00c6afab3f`.

Cited span `src/runner/dispatch/plan.mjs:91-104` at `36d79ddcc4e421b4739e34f73be8f878bedfadf7`; blob `819f4727c6f348e03d2c6c42a2714c0ec49857ab`; span SHA256 `a2a98693ed0da801a132f5346fa9b382431c18fc83039ad55a6c2fbe723dce8b`; same code blob at dfff: True.

```text
  let selector;
  if (executorIdArg) {
    selector = { type: 'executor', value: executorIdArg };
  } else if (assignmentArg) {
    selector = {
      type: 'assignment',
      value: typeof assignmentArg === 'string' ? assignmentArg : assignmentArg.assignmentId,
    };
  } else if (workIdArg) {
    selector = { type: 'work', value: workIdArg };
  } else if (purpose) {
    selector = { type: 'purpose', value: purpose };
  } else {
    selector = { type: 'adHocAgent', value: true };
```

Cited span `src/runner/dispatch/plan.mjs:455-472` at `36d79ddcc4e421b4739e34f73be8f878bedfadf7`; blob `819f4727c6f348e03d2c6c42a2714c0ec49857ab`; span SHA256 `0c95320f7d90b9f7f92cfc22a5a0bba3b70acab8079ca04342d800e181b70664`; same code blob at dfff: True.

```text
  return {
    selector,
    caller: callerObj,
    mechanism: finalMechanism,
    executorId,
    capability,
    invocation,
    governance,
    reasonCodes,
    ...(agentType ? { agentType } : {}),
    ...(mcpTool ? { mcpTool } : {}),
    configured,
    bindingSource: resolved.bindingSource ?? null,
    tier: effectivePolicy?.tier ?? null,
    model: effectivePolicy?.model ?? null,
    providerModel: effectivePolicy?.providerModel ?? null,
    provenance: effectivePolicy?.provenance ?? null,
    policy: effectivePolicy,
```

### Exact native binding result

```json
[
  {
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
    "receiptCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
    "receiptClaimId": "claim_366503bd4dadea43469f1586f4f25f60",
    "native": {
      "sourcePath": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "unitDigest": "e5816f50616899a52ab9d4268c9fcb8add5a6f9e3a5051a74613ffbae3f3a78c",
      "identityFingerprint": "e5816f50616899a52ab9d4268c9fcb8add5a6f9e3a5051a74613ffbae3f3a78c",
      "claimId": "claim_32d158caabf5001ae13d5c627496b6ab",
      "sourceAnchor": "unheaded-block-39",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3",
      "claimKind": "unclassified",
      "status": "future",
      "origin": "added-since-2c228f69c85f3ab3176e71ff3ad9ae2a07603890"
    },
    "identityMatches": false,
    "proposedSuccessorReceipt": {
      "claimId": "claim_32d158caabf5001ae13d5c627496b6ab",
      "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "anchor": "unheaded-block-39",
      "unitDigest": "8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3",
      "shownText": "Current compiled fields (`src/runner/dispatch/plan.mjs:455-472`) are\n`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,\n`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,\n`bindingSource`, `tier`, `model`, `providerModel`, `provenance`, and `policy`.\nGovernance uses its actual provider/egress shape; there is no top-level\n`target`, `handback` or `execution` wrapper and no `egress.allowed` flag.",
      "shownTextDigest": "8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3",
      "class": "candidate-native-content",
      "authoredBy": "codex-session:1@2026-10-10",
      "rationale": "The current sentence cites the actual compiled DispatchPlan return object at plan.mjs:455-472 and optional capability fields at 464-465. Only the stale line numbers changed; independent classification/content review remains pending.",
      "truthSection": {
        "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
        "anchor": "61-shape",
        "status": "verified",
        "reason": null
      },
      "currentEvidence": {
        "commit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "finding": "true-and-current",
        "citations": [
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 91,
            "endLine": 104,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          },
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 455,
            "endLine": 472,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          }
        ],
        "scope": "Author checked current code; independent review pending.",
        "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/accounting-261015-0700-whole-system-verdict-corrections.md.json"
      },
      "recoveryProvenance": {
        "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
        "receiptClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
        "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
        "verdictClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
        "unitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "originalAuthorSession": "codex-session:1@2026-10-10"
      },
      "amendedBy": "codex-session:43@2026-10-15",
      "reviewStatus": "pending",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    },
    "successorArtifactCommit": null,
    "status": "Proposal only. Committed dfff artifact names preserved predecessor; a current-ID artifact needs its actual later commit and separate reference before reverse closure."
  }
]
```

This committed receipt names the preserved predecessor ID. The real current native successor and full proposal are shown above. The successor receipt is not falsely pinned to dfff: it still requires its own actual artifact commit and subsequent reference binding. Review the dfff correction and identity proposal separately; no current reverse closure is claimed.

## 2. claim_fa99f4d5cfcd0ea169efdf450e007955

### Before receipt

```json
{
  "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
  "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
  "anchor": "unheaded-block-40",
  "unitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
  "shownText": "Values and reason codes depend on the resolved request/configuration. Inspect\nthe actual returned plan rather than treating an illustrative schema or an\nold executor selection as a observed result.",
  "shownTextDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:1@2026-10-10",
  "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 6. DispatchPlan > 6.1 Shape, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
  "truthSection": {
    "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
    "anchor": "61-shape",
    "status": "verified",
    "reason": null
  },
  "currentEvidence": {
    "commit": "69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 91,
        "endLine": 104,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      },
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 455,
        "endLine": 472,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      }
    ],
    "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
    "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
  },
  "recoveryProvenance": {
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptClaimId": "claim_271c8a780dde80cb18e612f908a4eca1",
    "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
    "verdictClaimId": "claim_271c8a780dde80cb18e612f908a4eca1",
    "unitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
    "originalAuthorSession": "codex-session:1@2026-10-10"
  }
}
```

### Committed receipt (full shown text and evidence)

```json
{
  "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
  "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
  "anchor": "unheaded-block-40",
  "unitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
  "shownText": "Values and reason codes depend on the resolved request/configuration. Inspect\nthe actual returned plan rather than treating an illustrative schema or an\nold executor selection as a observed result.",
  "shownTextDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:1@2026-10-10",
  "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 6. DispatchPlan > 6.1 Shape, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
  "truthSection": {
    "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
    "anchor": "61-shape",
    "status": "verified",
    "reason": null
  },
  "currentEvidence": {
    "commit": "69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 91,
        "endLine": 104,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      },
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 455,
        "endLine": 472,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      }
    ],
    "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
    "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
  },
  "recoveryProvenance": {
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptClaimId": "claim_271c8a780dde80cb18e612f908a4eca1",
    "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
    "verdictClaimId": "claim_271c8a780dde80cb18e612f908a4eca1",
    "unitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
    "originalAuthorSession": "codex-session:1@2026-10-10"
  }
}
```

### Complete shown text: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-40` at `dfff335d3f620b49403e4e4b2f70cedee5ca0452`.

Unit digest: `008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857`. Full shown-text SHA256: `008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857`.

```json
{
  "ancestry": [
    "Dispatch Control Plane Redesign",
    "6. DispatchPlan",
    "6.1 Shape"
  ]
}
```

```text
Values and reason codes depend on the resolved request/configuration. Inspect
the actual returned plan rather than treating an illustrative schema or an
old executor selection as a observed result.
```

### Reference metadata before/after

```json
[
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "collection": "candidateClassifications",
    "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
    "before": {
      "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "reviewed",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
      "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
      "reviewMode": "ordinary",
      "reviewNote": "mechanical: same two spans of plan.mjs byte-identical and uniquely located, unit digest 008c98d9 recomputed from lines 179-181 and equals shownText, anchor unheaded-block-40 ok, receipt pending with original authorship; this is machine equivalence only"
    },
    "after": {
      "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: sentence is guidance (values depend on resolved request, inspect the returned plan) with no file:line or behaviour claim to falsify; digest recomputed. The formal classification report for the earlier machine-only acceptance is still owed and not supplied by this ordinary verdict",
        "verdict": "ok",
        "sourceUnitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
        "targetUnitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans of plan.mjs byte-identical and uniquely located, unit digest 008c98d9 recomputed from lines 179-181 and equals shownText, anchor unheaded-block-40 ok, receipt pending with original authorship; this is machine equivalence only"
      }
    }
  }
]
```

Evidence digest (SHA256 of JSON.stringify(currentEvidence)): `2f5e23426e0685a7cf79304fb003fab8eb3f975eaef265b93f2407eb7311f9ad`.

Cited span `src/runner/dispatch/plan.mjs:91-104` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; blob `819f4727c6f348e03d2c6c42a2714c0ec49857ab`; span SHA256 `a2a98693ed0da801a132f5346fa9b382431c18fc83039ad55a6c2fbe723dce8b`; same code blob at dfff: True.

```text
  let selector;
  if (executorIdArg) {
    selector = { type: 'executor', value: executorIdArg };
  } else if (assignmentArg) {
    selector = {
      type: 'assignment',
      value: typeof assignmentArg === 'string' ? assignmentArg : assignmentArg.assignmentId,
    };
  } else if (workIdArg) {
    selector = { type: 'work', value: workIdArg };
  } else if (purpose) {
    selector = { type: 'purpose', value: purpose };
  } else {
    selector = { type: 'adHocAgent', value: true };
```

Cited span `src/runner/dispatch/plan.mjs:455-472` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; blob `819f4727c6f348e03d2c6c42a2714c0ec49857ab`; span SHA256 `0c95320f7d90b9f7f92cfc22a5a0bba3b70acab8079ca04342d800e181b70664`; same code blob at dfff: True.

```text
  return {
    selector,
    caller: callerObj,
    mechanism: finalMechanism,
    executorId,
    capability,
    invocation,
    governance,
    reasonCodes,
    ...(agentType ? { agentType } : {}),
    ...(mcpTool ? { mcpTool } : {}),
    configured,
    bindingSource: resolved.bindingSource ?? null,
    tier: effectivePolicy?.tier ?? null,
    model: effectivePolicy?.model ?? null,
    providerModel: effectivePolicy?.providerModel ?? null,
    provenance: effectivePolicy?.provenance ?? null,
    policy: effectivePolicy,
```

### Exact native binding result

```json
[
  {
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
    "receiptCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
    "receiptClaimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
    "native": {
      "sourcePath": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "unitDigest": "6aac4236a8850f948cf4697248c8a75b25b88481bf704f2750abc75bd2262bd4",
      "identityFingerprint": "6aac4236a8850f948cf4697248c8a75b25b88481bf704f2750abc75bd2262bd4",
      "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
      "sourceAnchor": "unheaded-block-40",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
      "claimKind": "contract",
      "status": "future"
    },
    "identityMatches": true,
    "proposedSuccessorReceipt": null,
    "successorArtifactCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
    "status": "current binding; independent acceptance pending"
  }
]
```

## 3. claim_ad38a91ec63db8a175d99078bcf6e158

### Before receipt

```json
{
  "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
  "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
  "anchor": "unheaded-block-43",
  "unitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
  "shownText": "- `work` - dispatch decision for a lifecycle work item.\n- `purpose` - dispatch decision for a named capability/purpose.\n- `executor` - dispatch decision for a concrete executor id.\n- `assignment` - dispatch decision for an actual Assignment or its id.\n- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.",
  "shownTextDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:1@2026-10-10",
  "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 6. DispatchPlan > 6.2 Selector, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
  "truthSection": {
    "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
    "anchor": "62-selector",
    "status": "verified",
    "reason": null
  },
  "currentEvidence": {
    "commit": "69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 91,
        "endLine": 104,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      },
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 455,
        "endLine": 472,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      }
    ],
    "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
    "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
  },
  "recoveryProvenance": {
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptClaimId": "claim_c66cf74ca521ea390c33065fc83b28d7",
    "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
    "verdictClaimId": "claim_c66cf74ca521ea390c33065fc83b28d7",
    "unitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
    "originalAuthorSession": "codex-session:1@2026-10-10"
  }
}
```

### Committed receipt (full shown text and evidence)

```json
{
  "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
  "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
  "anchor": "unheaded-block-43",
  "unitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
  "shownText": "- `work` - dispatch decision for a lifecycle work item.\n- `purpose` - dispatch decision for a named capability/purpose.\n- `executor` - dispatch decision for a concrete executor id.\n- `assignment` - dispatch decision for an actual Assignment or its id.\n- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.",
  "shownTextDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:1@2026-10-10",
  "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 6. DispatchPlan > 6.2 Selector, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
  "truthSection": {
    "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
    "anchor": "62-selector",
    "status": "verified",
    "reason": null
  },
  "currentEvidence": {
    "commit": "69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 91,
        "endLine": 104,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      },
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 455,
        "endLine": 472,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      }
    ],
    "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
    "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
  },
  "recoveryProvenance": {
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptClaimId": "claim_c66cf74ca521ea390c33065fc83b28d7",
    "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
    "verdictClaimId": "claim_c66cf74ca521ea390c33065fc83b28d7",
    "unitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
    "originalAuthorSession": "codex-session:1@2026-10-10"
  }
}
```

### Complete shown text: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-43` at `dfff335d3f620b49403e4e4b2f70cedee5ca0452`.

Unit digest: `4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e`. Full shown-text SHA256: `4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e`.

```json
{
  "ancestry": [
    "Dispatch Control Plane Redesign",
    "6. DispatchPlan",
    "6.2 Selector"
  ]
}
```

```text
- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.
```

### Reference metadata before/after

```json
[
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "collection": "candidateClassifications",
    "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
    "before": {
      "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "reviewed",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
      "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
      "reviewMode": "ordinary",
      "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 4097ad34 recomputed from lines 189-193 and equals shownText, anchor unheaded-block-43 ok, pending, original authorship kept; machine equivalence only"
    },
    "after": {
      "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: the five selector types work, purpose, executor, assignment, adHocAgent match plan.mjs selector construction at lines 91-104 (executor, assignment, work, purpose, adHocAgent); descriptions are consistent; digest recomputed. Formal classification report for the earlier machine-only acceptance still owed",
        "verdict": "ok",
        "sourceUnitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
        "targetUnitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 4097ad34 recomputed from lines 189-193 and equals shownText, anchor unheaded-block-43 ok, pending, original authorship kept; machine equivalence only"
      }
    }
  }
]
```

Evidence digest (SHA256 of JSON.stringify(currentEvidence)): `2f5e23426e0685a7cf79304fb003fab8eb3f975eaef265b93f2407eb7311f9ad`.

Cited span `src/runner/dispatch/plan.mjs:91-104` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; blob `819f4727c6f348e03d2c6c42a2714c0ec49857ab`; span SHA256 `a2a98693ed0da801a132f5346fa9b382431c18fc83039ad55a6c2fbe723dce8b`; same code blob at dfff: True.

```text
  let selector;
  if (executorIdArg) {
    selector = { type: 'executor', value: executorIdArg };
  } else if (assignmentArg) {
    selector = {
      type: 'assignment',
      value: typeof assignmentArg === 'string' ? assignmentArg : assignmentArg.assignmentId,
    };
  } else if (workIdArg) {
    selector = { type: 'work', value: workIdArg };
  } else if (purpose) {
    selector = { type: 'purpose', value: purpose };
  } else {
    selector = { type: 'adHocAgent', value: true };
```

Cited span `src/runner/dispatch/plan.mjs:455-472` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; blob `819f4727c6f348e03d2c6c42a2714c0ec49857ab`; span SHA256 `0c95320f7d90b9f7f92cfc22a5a0bba3b70acab8079ca04342d800e181b70664`; same code blob at dfff: True.

```text
  return {
    selector,
    caller: callerObj,
    mechanism: finalMechanism,
    executorId,
    capability,
    invocation,
    governance,
    reasonCodes,
    ...(agentType ? { agentType } : {}),
    ...(mcpTool ? { mcpTool } : {}),
    configured,
    bindingSource: resolved.bindingSource ?? null,
    tier: effectivePolicy?.tier ?? null,
    model: effectivePolicy?.model ?? null,
    providerModel: effectivePolicy?.providerModel ?? null,
    provenance: effectivePolicy?.provenance ?? null,
    policy: effectivePolicy,
```

### Exact native binding result

```json
[
  {
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
    "receiptCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
    "receiptClaimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
    "native": {
      "sourcePath": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "unitDigest": "51ef8dcb17ca8cec35d54b4797f30f493a2e544eefc65c31a1caa9bdd0fec6db",
      "identityFingerprint": "51ef8dcb17ca8cec35d54b4797f30f493a2e544eefc65c31a1caa9bdd0fec6db",
      "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
      "sourceAnchor": "unheaded-block-43",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
      "claimKind": "decision",
      "status": "future"
    },
    "identityMatches": true,
    "proposedSuccessorReceipt": null,
    "successorArtifactCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
    "status": "current binding; independent acceptance pending"
  }
]
```

## 4. claim_c5395a2e8480ce44d27f2873c02b8746

### Before receipt

```json
{
  "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
  "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
  "anchor": "unheaded-block-47",
  "unitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
  "shownText": "For in-process plans, native capability fields are top-level `agentType` or\n`mcpTool` when supplied (`plan.mjs:453-454`), not a `handback` object.\nThe caller must actually possess the returned live facility; the decision\ndoes not invoke that facility itself.",
  "shownTextDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:1@2026-10-10",
  "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 6. DispatchPlan > 6.3 Mechanism, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
  "truthSection": {
    "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
    "anchor": "63-mechanism",
    "status": "verified",
    "reason": null
  },
  "currentEvidence": {
    "commit": "69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 91,
        "endLine": 104,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      },
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 455,
        "endLine": 472,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      }
    ],
    "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
    "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
  },
  "recoveryProvenance": {
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
    "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
    "verdictClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
    "unitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
    "originalAuthorSession": "codex-session:1@2026-10-10"
  }
}
```

### Committed receipt (full shown text and evidence)

```json
{
  "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
  "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
  "anchor": "unheaded-block-47",
  "unitDigest": "23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613",
  "shownText": "For in-process plans, native capability fields are top-level `agentType` or\n`mcpTool` when supplied (`plan.mjs:464-465`), not a `handback` object.\nThe caller must actually possess the returned live facility; the decision\ndoes not invoke that facility itself.",
  "shownTextDigest": "23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:1@2026-10-10",
  "rationale": "The current sentence cites the actual compiled DispatchPlan return object at plan.mjs:455-472 and optional capability fields at 464-465. Only the stale line numbers changed; independent classification/content review remains pending.",
  "truthSection": {
    "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
    "anchor": "63-mechanism",
    "status": "verified",
    "reason": null
  },
  "currentEvidence": {
    "commit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 91,
        "endLine": 104,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      },
      {
        "path": "src/runner/dispatch/plan.mjs",
        "startLine": 455,
        "endLine": 472,
        "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
      }
    ],
    "scope": "Author checked current code; independent review pending.",
    "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/accounting-261015-0700-whole-system-verdict-corrections.md.json"
  },
  "recoveryProvenance": {
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
    "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
    "verdictClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
    "unitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
    "originalAuthorSession": "codex-session:1@2026-10-10"
  },
  "amendedBy": "codex-session:42@2026-10-15",
  "reviewStatus": "pending",
  "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
}
```

### Complete shown text: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-47` at `dfff335d3f620b49403e4e4b2f70cedee5ca0452`.

Unit digest: `23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613`. Full shown-text SHA256: `23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613`.

```json
{
  "ancestry": [
    "Dispatch Control Plane Redesign",
    "6. DispatchPlan",
    "6.3 Mechanism"
  ]
}
```

```text
For in-process plans, native capability fields are top-level `agentType` or
`mcpTool` when supplied (`plan.mjs:464-465`), not a `handback` object.
The caller must actually possess the returned live facility; the decision
does not invoke that facility itself.
```

### Reference metadata before/after

```json
[
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "collection": "candidateClassifications",
    "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
    "before": {
      "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "reviewed",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
      "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
      "reviewMode": "ordinary",
      "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 1e2dd90c recomputed from lines 210-213 and equals shownText, anchor unheaded-block-47 ok, pending, original authorship kept; machine equivalence only"
    },
    "after": {
      "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: text cites `plan.mjs:453-454` for the top-level agentType and mcpTool fields; they are now at plan.mjs 464-465 (shift of 11 after the merge), so the cited lines are stale although the substance (top-level fields, no handback object) is true. Same remedy as the sibling row; formal classification report still owed",
        "verdict": "rework",
        "sourceUnitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "targetUnitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 1e2dd90c recomputed from lines 210-213 and equals shownText, anchor unheaded-block-47 ok, pending, original authorship kept; machine equivalence only"
      },
      "pendingReceiptCommit": "Bind the actual runner settlement artifact next turn after native identity reconciliation.",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    }
  }
]
```

Evidence digest (SHA256 of JSON.stringify(currentEvidence)): `48eca430cc7733450e5d0e0cf5c254e787cb5214b9537ddf21693f00c6afab3f`.

Cited span `src/runner/dispatch/plan.mjs:91-104` at `36d79ddcc4e421b4739e34f73be8f878bedfadf7`; blob `819f4727c6f348e03d2c6c42a2714c0ec49857ab`; span SHA256 `a2a98693ed0da801a132f5346fa9b382431c18fc83039ad55a6c2fbe723dce8b`; same code blob at dfff: True.

```text
  let selector;
  if (executorIdArg) {
    selector = { type: 'executor', value: executorIdArg };
  } else if (assignmentArg) {
    selector = {
      type: 'assignment',
      value: typeof assignmentArg === 'string' ? assignmentArg : assignmentArg.assignmentId,
    };
  } else if (workIdArg) {
    selector = { type: 'work', value: workIdArg };
  } else if (purpose) {
    selector = { type: 'purpose', value: purpose };
  } else {
    selector = { type: 'adHocAgent', value: true };
```

Cited span `src/runner/dispatch/plan.mjs:455-472` at `36d79ddcc4e421b4739e34f73be8f878bedfadf7`; blob `819f4727c6f348e03d2c6c42a2714c0ec49857ab`; span SHA256 `0c95320f7d90b9f7f92cfc22a5a0bba3b70acab8079ca04342d800e181b70664`; same code blob at dfff: True.

```text
  return {
    selector,
    caller: callerObj,
    mechanism: finalMechanism,
    executorId,
    capability,
    invocation,
    governance,
    reasonCodes,
    ...(agentType ? { agentType } : {}),
    ...(mcpTool ? { mcpTool } : {}),
    configured,
    bindingSource: resolved.bindingSource ?? null,
    tier: effectivePolicy?.tier ?? null,
    model: effectivePolicy?.model ?? null,
    providerModel: effectivePolicy?.providerModel ?? null,
    provenance: effectivePolicy?.provenance ?? null,
    policy: effectivePolicy,
```

### Exact native binding result

```json
[
  {
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
    "receiptCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
    "receiptClaimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
    "native": {
      "sourcePath": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "unitDigest": "31ebd999e29e9ac7f23771697363df655bf89b8805357dcaaab17a751bd0fd33",
      "identityFingerprint": "31ebd999e29e9ac7f23771697363df655bf89b8805357dcaaab17a751bd0fd33",
      "claimId": "claim_4f6feca8cda6aa723bb9bd72ca956657",
      "sourceAnchor": "unheaded-block-47",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613",
      "claimKind": "unclassified",
      "status": "future",
      "origin": "added-since-2c228f69c85f3ab3176e71ff3ad9ae2a07603890"
    },
    "identityMatches": false,
    "proposedSuccessorReceipt": {
      "claimId": "claim_4f6feca8cda6aa723bb9bd72ca956657",
      "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "anchor": "unheaded-block-47",
      "unitDigest": "23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613",
      "shownText": "For in-process plans, native capability fields are top-level `agentType` or\n`mcpTool` when supplied (`plan.mjs:464-465`), not a `handback` object.\nThe caller must actually possess the returned live facility; the decision\ndoes not invoke that facility itself.",
      "shownTextDigest": "23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613",
      "class": "candidate-native-content",
      "authoredBy": "codex-session:1@2026-10-10",
      "rationale": "The current sentence cites the actual compiled DispatchPlan return object at plan.mjs:455-472 and optional capability fields at 464-465. Only the stale line numbers changed; independent classification/content review remains pending.",
      "truthSection": {
        "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
        "anchor": "63-mechanism",
        "status": "verified",
        "reason": null
      },
      "currentEvidence": {
        "commit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "finding": "true-and-current",
        "citations": [
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 91,
            "endLine": 104,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          },
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 455,
            "endLine": 472,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          }
        ],
        "scope": "Author checked current code; independent review pending.",
        "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/accounting-261015-0700-whole-system-verdict-corrections.md.json"
      },
      "recoveryProvenance": {
        "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
        "receiptClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
        "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
        "verdictClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
        "unitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "originalAuthorSession": "codex-session:1@2026-10-10"
      },
      "amendedBy": "codex-session:43@2026-10-15",
      "reviewStatus": "pending",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    },
    "successorArtifactCommit": null,
    "status": "Proposal only. Committed dfff artifact names preserved predecessor; a current-ID artifact needs its actual later commit and separate reference before reverse closure."
  }
]
```

This committed receipt names the preserved predecessor ID. The real current native successor and full proposal are shown above. The successor receipt is not falsely pinned to dfff: it still requires its own actual artifact commit and subsequent reference binding. Review the dfff correction and identity proposal separately; no current reverse closure is claimed.

## Complete reference/receipt metadata change audit

```json
[
  {
    "file": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
    "collection": "receipts",
    "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
    "before": {
      "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
      "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "anchor": "unheaded-block-39",
      "unitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
      "shownText": "Current compiled fields (`src/runner/dispatch/plan.mjs:444-461`) are\n`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,\n`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,\n`bindingSource`, `tier`, `model`, `providerModel`, `provenance`, and `policy`.\nGovernance uses its actual provider/egress shape; there is no top-level\n`target`, `handback` or `execution` wrapper and no `egress.allowed` flag.",
      "shownTextDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
      "class": "candidate-native-content",
      "authoredBy": "codex-session:1@2026-10-10",
      "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 6. DispatchPlan > 6.1 Shape, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
      "truthSection": {
        "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
        "anchor": "61-shape",
        "status": "verified",
        "reason": null
      },
      "currentEvidence": {
        "commit": "69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539",
        "finding": "true-and-current",
        "citations": [
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 91,
            "endLine": 104,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          },
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 455,
            "endLine": 472,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          }
        ],
        "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
        "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
      },
      "recoveryProvenance": {
        "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
        "receiptClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
        "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
        "verdictClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
        "unitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "originalAuthorSession": "codex-session:1@2026-10-10"
      }
    },
    "after": {
      "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
      "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "anchor": "unheaded-block-39",
      "unitDigest": "8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3",
      "shownText": "Current compiled fields (`src/runner/dispatch/plan.mjs:455-472`) are\n`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,\n`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,\n`bindingSource`, `tier`, `model`, `providerModel`, `provenance`, and `policy`.\nGovernance uses its actual provider/egress shape; there is no top-level\n`target`, `handback` or `execution` wrapper and no `egress.allowed` flag.",
      "shownTextDigest": "8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3",
      "class": "candidate-native-content",
      "authoredBy": "codex-session:1@2026-10-10",
      "rationale": "The current sentence cites the actual compiled DispatchPlan return object at plan.mjs:455-472 and optional capability fields at 464-465. Only the stale line numbers changed; independent classification/content review remains pending.",
      "truthSection": {
        "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
        "anchor": "61-shape",
        "status": "verified",
        "reason": null
      },
      "currentEvidence": {
        "commit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "finding": "true-and-current",
        "citations": [
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 91,
            "endLine": 104,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          },
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 455,
            "endLine": 472,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          }
        ],
        "scope": "Author checked current code; independent review pending.",
        "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/accounting-261015-0700-whole-system-verdict-corrections.md.json"
      },
      "recoveryProvenance": {
        "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
        "receiptClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
        "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
        "verdictClaimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
        "unitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "originalAuthorSession": "codex-session:1@2026-10-10"
      },
      "amendedBy": "codex-session:42@2026-10-15",
      "reviewStatus": "pending",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    }
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
    "collection": "receipts",
    "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
    "before": {
      "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
      "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "anchor": "unheaded-block-47",
      "unitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
      "shownText": "For in-process plans, native capability fields are top-level `agentType` or\n`mcpTool` when supplied (`plan.mjs:453-454`), not a `handback` object.\nThe caller must actually possess the returned live facility; the decision\ndoes not invoke that facility itself.",
      "shownTextDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
      "class": "candidate-native-content",
      "authoredBy": "codex-session:1@2026-10-10",
      "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 6. DispatchPlan > 6.3 Mechanism, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
      "truthSection": {
        "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
        "anchor": "63-mechanism",
        "status": "verified",
        "reason": null
      },
      "currentEvidence": {
        "commit": "69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539",
        "finding": "true-and-current",
        "citations": [
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 91,
            "endLine": 104,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          },
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 455,
            "endLine": 472,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          }
        ],
        "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
        "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
      },
      "recoveryProvenance": {
        "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
        "receiptClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
        "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
        "verdictClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
        "unitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "originalAuthorSession": "codex-session:1@2026-10-10"
      }
    },
    "after": {
      "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
      "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
      "anchor": "unheaded-block-47",
      "unitDigest": "23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613",
      "shownText": "For in-process plans, native capability fields are top-level `agentType` or\n`mcpTool` when supplied (`plan.mjs:464-465`), not a `handback` object.\nThe caller must actually possess the returned live facility; the decision\ndoes not invoke that facility itself.",
      "shownTextDigest": "23216df99f389ab83588aeb312e949c92c3ed1817396047257e860a356f47613",
      "class": "candidate-native-content",
      "authoredBy": "codex-session:1@2026-10-10",
      "rationale": "The current sentence cites the actual compiled DispatchPlan return object at plan.mjs:455-472 and optional capability fields at 464-465. Only the stale line numbers changed; independent classification/content review remains pending.",
      "truthSection": {
        "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
        "anchor": "63-mechanism",
        "status": "verified",
        "reason": null
      },
      "currentEvidence": {
        "commit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "finding": "true-and-current",
        "citations": [
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 91,
            "endLine": 104,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          },
          {
            "path": "src/runner/dispatch/plan.mjs",
            "startLine": 455,
            "endLine": 472,
            "blobSha": "819f4727c6f348e03d2c6c42a2714c0ec49857ab"
          }
        ],
        "scope": "Author checked current code; independent review pending.",
        "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/accounting-261015-0700-whole-system-verdict-corrections.md.json"
      },
      "recoveryProvenance": {
        "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
        "receiptClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
        "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
        "verdictClaimId": "claim_56af2fc53f516253db192a78f0dddc70",
        "unitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "originalAuthorSession": "codex-session:1@2026-10-10"
      },
      "amendedBy": "codex-session:42@2026-10-15",
      "reviewStatus": "pending",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    }
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "collection": "candidateClassifications",
    "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
    "before": {
      "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "reviewed",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
      "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
      "reviewMode": "ordinary",
      "reviewNote": "deep: machine re-pin proven by script, both spans of plan.mjs byte-identical (80-93 to 91-104, 444-461 to 455-472, unique match), shown text equals unit lines 172-177, digest 2f26ef79 recomputed, pending, original author and class kept; the candidate prose still says plan.mjs:444-461 which is stale as a line number but is a preserved byte, truth deferred to promotion"
    },
    "after": {
      "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: shown text cites `src/runner/dispatch/plan.mjs:444-461` for the compiled DispatchPlan fields but after the main merge the returned object is at plan.mjs 455-472 (lines 444-461 are now the executor-mismatch handling); the receipt evidence was re-pinned to 455-472 while the candidate text kept the old numbers, so a content sentence is stale by 11 lines. Field list itself matches the return object. Machine equivalence is not truth acceptance; also still owed the separate formal classification report. Fix by an A19 line-number correction or reclassify as candidate-unverified under A31",
        "verdict": "rework",
        "sourceUnitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "targetUnitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "deep: machine re-pin proven by script, both spans of plan.mjs byte-identical (80-93 to 91-104, 444-461 to 455-472, unique match), shown text equals unit lines 172-177, digest 2f26ef79 recomputed, pending, original author and class kept; the candidate prose still says plan.mjs:444-461 which is stale as a line number but is a preserved byte, truth deferred to promotion"
      },
      "pendingReceiptCommit": "Bind the actual runner settlement artifact next turn after native identity reconciliation.",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    }
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "collection": "candidateClassifications",
    "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
    "before": {
      "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "reviewed",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
      "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
      "reviewMode": "ordinary",
      "reviewNote": "mechanical: same two spans of plan.mjs byte-identical and uniquely located, unit digest 008c98d9 recomputed from lines 179-181 and equals shownText, anchor unheaded-block-40 ok, receipt pending with original authorship; this is machine equivalence only"
    },
    "after": {
      "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: sentence is guidance (values depend on resolved request, inspect the returned plan) with no file:line or behaviour claim to falsify; digest recomputed. The formal classification report for the earlier machine-only acceptance is still owed and not supplied by this ordinary verdict",
        "verdict": "ok",
        "sourceUnitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
        "targetUnitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans of plan.mjs byte-identical and uniquely located, unit digest 008c98d9 recomputed from lines 179-181 and equals shownText, anchor unheaded-block-40 ok, receipt pending with original authorship; this is machine equivalence only"
      }
    }
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "collection": "candidateClassifications",
    "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
    "before": {
      "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "reviewed",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
      "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
      "reviewMode": "ordinary",
      "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 4097ad34 recomputed from lines 189-193 and equals shownText, anchor unheaded-block-43 ok, pending, original authorship kept; machine equivalence only"
    },
    "after": {
      "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: the five selector types work, purpose, executor, assignment, adHocAgent match plan.mjs selector construction at lines 91-104 (executor, assignment, work, purpose, adHocAgent); descriptions are consistent; digest recomputed. Formal classification report for the earlier machine-only acceptance still owed",
        "verdict": "ok",
        "sourceUnitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
        "targetUnitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 4097ad34 recomputed from lines 189-193 and equals shownText, anchor unheaded-block-43 ok, pending, original authorship kept; machine equivalence only"
      }
    }
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "collection": "candidateClassifications",
    "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
    "before": {
      "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "reviewed",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
      "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
      "reviewMode": "ordinary",
      "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 1e2dd90c recomputed from lines 210-213 and equals shownText, anchor unheaded-block-47 ok, pending, original authorship kept; machine equivalence only"
    },
    "after": {
      "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: text cites `plan.mjs:453-454` for the top-level agentType and mcpTool fields; they are now at plan.mjs 464-465 (shift of 11 after the merge), so the cited lines are stale although the substance (top-level fields, no handback object) is true. Same remedy as the sibling row; formal classification report still owed",
        "verdict": "rework",
        "sourceUnitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "targetUnitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 1e2dd90c recomputed from lines 210-213 and equals shownText, anchor unheaded-block-47 ok, pending, original authorship kept; machine equivalence only"
      },
      "pendingReceiptCommit": "Bind the actual runner settlement artifact next turn after native identity reconciliation.",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    }
  }
]
```

## Pending reference commit metadata authored this turn

```json
[
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "before": {
      "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: shown text cites `src/runner/dispatch/plan.mjs:444-461` for the compiled DispatchPlan fields but after the main merge the returned object is at plan.mjs 455-472 (lines 444-461 are now the executor-mismatch handling); the receipt evidence was re-pinned to 455-472 while the candidate text kept the old numbers, so a content sentence is stale by 11 lines. Field list itself matches the return object. Machine equivalence is not truth acceptance; also still owed the separate formal classification report. Fix by an A19 line-number correction or reclassify as candidate-unverified under A31",
        "verdict": "rework",
        "sourceUnitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "targetUnitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "deep: machine re-pin proven by script, both spans of plan.mjs byte-identical (80-93 to 91-104, 444-461 to 455-472, unique match), shown text equals unit lines 172-177, digest 2f26ef79 recomputed, pending, original author and class kept; the candidate prose still says plan.mjs:444-461 which is stale as a line number but is a preserved byte, truth deferred to promotion"
      },
      "pendingReceiptCommit": "Bind the actual runner settlement artifact next turn after native identity reconciliation.",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    },
    "after": {
      "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: shown text cites `src/runner/dispatch/plan.mjs:444-461` for the compiled DispatchPlan fields but after the main merge the returned object is at plan.mjs 455-472 (lines 444-461 are now the executor-mismatch handling); the receipt evidence was re-pinned to 455-472 while the candidate text kept the old numbers, so a content sentence is stale by 11 lines. Field list itself matches the return object. Machine equivalence is not truth acceptance; also still owed the separate formal classification report. Fix by an A19 line-number correction or reclassify as candidate-unverified under A31",
        "verdict": "rework",
        "sourceUnitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "targetUnitDigest": "2f26ef793b85a9534c07f2080df713367086ccdf91e96a8cf0652d28acf971a6",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_366503bd4dadea43469f1586f4f25f60",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "deep: machine re-pin proven by script, both spans of plan.mjs byte-identical (80-93 to 91-104, 444-461 to 455-472, unique match), shown text equals unit lines 172-177, digest 2f26ef79 recomputed, pending, original author and class kept; the candidate prose still says plan.mjs:444-461 which is stale as a line number but is a preserved byte, truth deferred to promotion"
      },
      "pendingReceiptCommit": "Bind the actual runner settlement artifact next turn after native identity reconciliation.",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry.",
      "receiptCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
      "receiptBinding": "Committed artifact at dfff335d3; independent classification acceptance pending. Current native ID consequences are shown separately; no approval carry or identity graft."
    }
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "before": {
      "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: sentence is guidance (values depend on resolved request, inspect the returned plan) with no file:line or behaviour claim to falsify; digest recomputed. The formal classification report for the earlier machine-only acceptance is still owed and not supplied by this ordinary verdict",
        "verdict": "ok",
        "sourceUnitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
        "targetUnitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans of plan.mjs byte-identical and uniquely located, unit digest 008c98d9 recomputed from lines 179-181 and equals shownText, anchor unheaded-block-40 ok, receipt pending with original authorship; this is machine equivalence only"
      }
    },
    "after": {
      "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: sentence is guidance (values depend on resolved request, inspect the returned plan) with no file:line or behaviour claim to falsify; digest recomputed. The formal classification report for the earlier machine-only acceptance is still owed and not supplied by this ordinary verdict",
        "verdict": "ok",
        "sourceUnitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
        "targetUnitDigest": "008c98d9c6445268a4d6e33133ec0871b7c7a23a48e51369cad11c0b20caa857",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_fa99f4d5cfcd0ea169efdf450e007955",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans of plan.mjs byte-identical and uniquely located, unit digest 008c98d9 recomputed from lines 179-181 and equals shownText, anchor unheaded-block-40 ok, receipt pending with original authorship; this is machine equivalence only"
      },
      "receiptBinding": "Committed artifact at dfff335d3; independent classification acceptance pending. Current native ID consequences are shown separately; no approval carry or identity graft."
    }
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "before": {
      "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: the five selector types work, purpose, executor, assignment, adHocAgent match plan.mjs selector construction at lines 91-104 (executor, assignment, work, purpose, adHocAgent); descriptions are consistent; digest recomputed. Formal classification report for the earlier machine-only acceptance still owed",
        "verdict": "ok",
        "sourceUnitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
        "targetUnitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 4097ad34 recomputed from lines 189-193 and equals shownText, anchor unheaded-block-43 ok, pending, original authorship kept; machine equivalence only"
      }
    },
    "after": {
      "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "receiptCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: the five selector types work, purpose, executor, assignment, adHocAgent match plan.mjs selector construction at lines 91-104 (executor, assignment, work, purpose, adHocAgent); descriptions are consistent; digest recomputed. Formal classification report for the earlier machine-only acceptance still owed",
        "verdict": "ok",
        "sourceUnitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
        "targetUnitDigest": "4097ad349f818789dbce9534ea72cb57d15de4064f1996e24c34588a47c75d9e",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_ad38a91ec63db8a175d99078bcf6e158",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 4097ad34 recomputed from lines 189-193 and equals shownText, anchor unheaded-block-43 ok, pending, original authorship kept; machine equivalence only"
      },
      "receiptBinding": "Committed artifact at dfff335d3; independent classification acceptance pending. Current native ID consequences are shown separately; no approval carry or identity graft."
    }
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
    "before": {
      "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: text cites `plan.mjs:453-454` for the top-level agentType and mcpTool fields; they are now at plan.mjs 464-465 (shift of 11 after the merge), so the cited lines are stale although the substance (top-level fields, no handback object) is true. Same remedy as the sibling row; formal classification report still owed",
        "verdict": "rework",
        "sourceUnitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "targetUnitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 1e2dd90c recomputed from lines 210-213 and equals shownText, anchor unheaded-block-47 ok, pending, original authorship kept; machine equivalence only"
      },
      "pendingReceiptCommit": "Bind the actual runner settlement artifact next turn after native identity reconciliation.",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry."
    },
    "after": {
      "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
      "authoredBy": "codex-session:1@2026-10-10",
      "reviewStatus": "pending",
      "ordinaryAssessment": {
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewMode": "ordinary",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0607-whole-system-rereview-01.md",
        "reviewReportCommit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "reviewNote": "deep: text cites `plan.mjs:453-454` for the top-level agentType and mcpTool fields; they are now at plan.mjs 464-465 (shift of 11 after the merge), so the cited lines are stale although the substance (top-level fields, no handback object) is true. Same remedy as the sibling row; formal classification report still owed",
        "verdict": "rework",
        "sourceUnitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "targetUnitDigest": "1e2dd90c75bf8049d0ad5d55ea4677898a163a1229eb4528d65cc2ae4323effa",
        "scope": "Ordinary assessment; does not satisfy the separate Receipt commit / Class-column report contract."
      },
      "priorReview": {
        "claimId": "claim_c5395a2e8480ce44d27f2873c02b8746",
        "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-step6-repin.json",
        "receiptCommit": "a8a10abc1a24218518a14764f68c8d86f4810f91",
        "authoredBy": "codex-session:1@2026-10-10",
        "reviewStatus": "reviewed",
        "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
        "reviewedAt": "2026-10-15",
        "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0451-whole-system-merge.md",
        "reviewReportCommit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "reviewMode": "ordinary",
        "reviewNote": "mechanical: same two spans byte-identical and unique, unit digest 1e2dd90c recomputed from lines 210-213 and equals shownText, anchor unheaded-block-47 ok, pending, original authorship kept; machine equivalence only"
      },
      "pendingReceiptCommit": "Bind the actual runner settlement artifact next turn after native identity reconciliation.",
      "rebindingReason": "A19 line-number-only correction; A22 digest/section rebind. Native ID allocation deferred to the next sync; no identity graft or approval carry.",
      "receiptCommit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
      "receiptBinding": "Committed artifact at dfff335d3; independent classification acceptance pending. Current native ID consequences are shown separately; no approval carry or identity graft."
    }
  }
]
```

## Historical receipts remain immutable

```json
[
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-classifications.json",
    "claimId": "claim_fd2bcba645deec52f9b969d6152c78c6",
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "anchor": "61-shape",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-liveness-rework.json",
    "receiptCommit": "090840a6c7e941926813efb6d76298d10b1dcd68",
    "status": "Historical identity absent from persisted native known set; immutable historical receipt/ref retained; actual current-ID receipts are pending and rebound separately."
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-classifications.json",
    "claimId": "claim_d27932d002d467defb89b57442428b80",
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "anchor": "unheaded-block-39",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-liveness-rework.json",
    "receiptCommit": "090840a6c7e941926813efb6d76298d10b1dcd68",
    "status": "Historical identity absent from persisted native known set; immutable historical receipt/ref retained; actual current-ID receipts are pending and rebound separately."
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-classifications.json",
    "claimId": "claim_a9d82bdbadaa186c80a769e0f8a57123",
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "anchor": "63-mechanism",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-liveness-rework.json",
    "receiptCommit": "090840a6c7e941926813efb6d76298d10b1dcd68",
    "status": "Historical identity absent from persisted native known set; immutable historical receipt/ref retained; actual current-ID receipts are pending and rebound separately."
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-classifications.json",
    "claimId": "claim_e62d2421e6273f7a3c19b6f681680a93",
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "anchor": "unheaded-block-47",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-liveness-rework.json",
    "receiptCommit": "090840a6c7e941926813efb6d76298d10b1dcd68",
    "status": "Historical identity absent from persisted native known set; immutable historical receipt/ref retained; actual current-ID receipts are pending and rebound separately."
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-classifications.json",
    "claimId": "claim_de1bde6579325220fa5ddea79b9cd77f",
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "anchor": "unheaded-block-39",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "status": "Historical identity absent from persisted native known set; immutable historical receipt/ref retained; actual current-ID receipts are pending and rebound separately."
  },
  {
    "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-classifications.json",
    "claimId": "claim_56af2fc53f516253db192a78f0dddc70",
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "anchor": "unheaded-block-47",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "status": "Historical identity absent from persisted native known set; immutable historical receipt/ref retained; actual current-ID receipts are pending and rebound separately."
  }
]
```
