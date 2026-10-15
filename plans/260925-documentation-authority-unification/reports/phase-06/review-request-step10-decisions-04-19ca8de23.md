# Pending final source and predecessor decisions — part 4

Author session: `codex-session:unit-run-1792089181794-89ae42db@2026-10-16`
Packaged by: `codex-session:unit-run-1792090455209-159fbfed@2026-10-16`
Content pin / SYNC: `19ca8de23908e161c34c91626e41041b7813167c`
Comparison base: `ab4d6274a9ae78c2613897432df726bfab32be52`
Entries: **53**, maximum 120 per request part.

[Single request index](review-request-step10-index-19ca8de23.md). This is one bounded re-review set of changes since `ab4d6274a`, replacing prior submission for changed entries only; unchanged matching ok verdicts remain accepted. This author header identifies this part's submitted author; per-row `authoredBy` and immutable historical author fields remain exact. No producer seed, draw, sample or verdict is selected.

Read [A36 mechanical/deep lists](step10-sync19-A36.json). Every submitted claim requires one ordinary verdict with exact shown source and target digests and a `deep` or `mechanical` note. Recompute full digests and anchors and compare current shard/pack equality for every row. Deep-review every unequal source/target row, every submitted partial carry, all seven labelled truth corrections, all historical AGENTS rows and other explicitly marked reworks. The reviewer selects and records a seed for at least 63/415 Weak-exact/Judgment rows (15%, minimum 10, all if fewer); >3% deep rework escalates to whole-pack deep review. A36 changes neither truth sampling nor checkpoint review. Non-claim entries receive item-specific accounting/content verdicts, not claim approvals. Existing independently ok unchanged full-file content is context only.

## Entry claim_87bd809203f0b1b237b0afac092f6fda

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-11-coordination-envelope-probe-contract.json",
  "collection": "claims",
  "claimId": "claim_87bd809203f0b1b237b0afac092f6fda",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-11-coordination-envelope-probe-contract.json",
  "before": {
    "claimId": "claim_87bd809203f0b1b237b0afac092f6fda",
    "sourceUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "current-substrate-fit-and-gaps",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source heading docs/architect/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 117–117) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 144–144); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract"
    ]
  },
  "currentDecision": {
    "claimId": "claim_87bd809203f0b1b237b0afac092f6fda",
    "sourceUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "current-substrate-fit-and-gaps",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source heading docs/architect/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 117–117) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 144–144); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "unitDigest": "29c766c11b53ff1385700408b0db1453303d0ef50be73d2c231906ebb91db805",
    "identityFingerprint": "53be8d512cd5e83a45b975ca88e44910e13ed4d60b3408ecdec62d1029a42511",
    "claimId": "claim_87bd809203f0b1b237b0afac092f6fda",
    "sourceAnchor": "current-substrate-fit-and-gaps",
    "unitKind": "heading",
    "sourceUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Current substrate fit and gaps",
      "anchor": "current-substrate-fit-and-gaps",
      "githubAnchor": "current-substrate-fit-and-gaps",
      "stableAnchor": "h-1f0ed3006680",
      "startLine": 117,
      "endLine": 117,
      "textDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
      "sample": "Current substrate fit and gaps",
      "sectionPayloadDigest": "97017a6a4a2b4816f8ae993e14f81536fb377e9f7b0c46d05b4d401ed22cd868",
      "followingBlockDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
      "identityFingerprint": "53be8d512cd5e83a45b975ca88e44910e13ed4d60b3408ecdec62d1029a42511",
      "ancestry": [
        "Coordination Envelope — Minimal Probe Contract"
      ],
      "text": "## Current substrate fit and gaps",
      "sectionText": "## Current substrate fit and gaps\n\nFollow-up: [Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)\nidentifies inherited environment, credential custody, private scratch, and output\ningestion requirements before a real provider run. It remains Discussion.\n\n| Surface | Available evidence | Gap to establish before/through probe |\n|---|---|---|\n| Assignment/Run/RunResult and governed dispatch | Existing coordination foundation | Capture public-path behavior and real provider receipts |\n| Read-only executors | Advisory P00.1 allowlist: claude-bwrap, codex-readonly, agy-bwrap | Verify exact current binding/build; ro-bind of host root does not hide host files |\n| Dynamic specialist | Engine consult/declared slots exist per prior review | Public-path unanticipated recruitment without graph changes remains unproven |\n| Identity | Store compares driver writer strings | Authenticated identity inaccessible to worker is not established |\n| Visibility | Grants/windows and lineage exist | Actual filesystem/tool read containment remains unproven |\n| Mutation | Public run now forwards step.mutation | Safe isolated mutating executor and full public path remain unproven |\n| Closure | Actor quorum and automatic close remain in inspected source | Explicit candidate obligations may require substrate changes; record failure honestly |\n| Resume | Execution ledger and chain projections exist | Rationale checkpoint, exposure history, coordinator fencing, and unknown reconciliation need proof |\n| Limits | Assignment/concurrency checks exist | Correct attempt/cost accounting and parked-time semantics need verification |\n\nDo not implement an alternate private runtime and count its success as native\nfgOS proof. If a disposable broker prototype is needed, label its results\nprototype-only, keep the exact delta visible, and distinguish existing capability\nfrom hypothesized capability. A blocked full scenario should yield a gap report\nand executable smaller probes, not a fabricated overall pass."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "Current substrate fit and gaps",
    "anchor": "current-substrate-fit-and-gaps",
    "githubAnchor": "current-substrate-fit-and-gaps",
    "stableAnchor": "h-c53a4d5d3fcf",
    "startLine": 144,
    "endLine": 144,
    "textDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "sample": "Current substrate fit and gaps",
    "sectionPayloadDigest": "97017a6a4a2b4816f8ae993e14f81536fb377e9f7b0c46d05b4d401ed22cd868",
    "followingBlockDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "identityFingerprint": "53be8d512cd5e83a45b975ca88e44910e13ed4d60b3408ecdec62d1029a42511",
    "ancestry": [
      "Coordination Envelope — Minimal Probe Contract"
    ],
    "text": "## Current substrate fit and gaps",
    "sectionText": "## Current substrate fit and gaps\n\nFollow-up: [Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)\nidentifies inherited environment, credential custody, private scratch, and output\ningestion requirements before a real provider run. It remains Discussion.\n\n| Surface | Available evidence | Gap to establish before/through probe |\n|---|---|---|\n| Assignment/Run/RunResult and governed dispatch | Existing coordination foundation | Capture public-path behavior and real provider receipts |\n| Read-only executors | Advisory P00.1 allowlist: claude-bwrap, codex-readonly, agy-bwrap | Verify exact current binding/build; ro-bind of host root does not hide host files |\n| Dynamic specialist | Engine consult/declared slots exist per prior review | Public-path unanticipated recruitment without graph changes remains unproven |\n| Identity | Store compares driver writer strings | Authenticated identity inaccessible to worker is not established |\n| Visibility | Grants/windows and lineage exist | Actual filesystem/tool read containment remains unproven |\n| Mutation | Public run now forwards step.mutation | Safe isolated mutating executor and full public path remain unproven |\n| Closure | Actor quorum and automatic close remain in inspected source | Explicit candidate obligations may require substrate changes; record failure honestly |\n| Resume | Execution ledger and chain projections exist | Rationale checkpoint, exposure history, coordinator fencing, and unknown reconciliation need proof |\n| Limits | Assignment/concurrency checks exist | Correct attempt/cost accounting and parked-time semantics need verification |\n\nDo not implement an alternate private runtime and count its success as native\nfgOS proof. If a disposable broker prototype is needed, label its results\nprototype-only, keep the exact delta visible, and distinguish existing capability\nfrom hypothesized capability. A blocked full scenario should yield a gap report\nand executable smaller probes, not a fabricated overall pass."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "source unit shorter than 40 characters",
    "targetUnit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Current substrate fit and gaps",
      "anchor": "current-substrate-fit-and-gaps",
      "githubAnchor": "current-substrate-fit-and-gaps",
      "stableAnchor": "h-c53a4d5d3fcf",
      "startLine": 144,
      "endLine": 144,
      "textDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
      "sample": "Current substrate fit and gaps",
      "sectionPayloadDigest": "97017a6a4a2b4816f8ae993e14f81536fb377e9f7b0c46d05b4d401ed22cd868",
      "followingBlockDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
      "identityFingerprint": "53be8d512cd5e83a45b975ca88e44910e13ed4d60b3408ecdec62d1029a42511",
      "ancestry": [
        "Coordination Envelope — Minimal Probe Contract"
      ],
      "text": "## Current substrate fit and gaps",
      "sectionText": "## Current substrate fit and gaps\n\nFollow-up: [Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)\nidentifies inherited environment, credential custody, private scratch, and output\ningestion requirements before a real provider run. It remains Discussion.\n\n| Surface | Available evidence | Gap to establish before/through probe |\n|---|---|---|\n| Assignment/Run/RunResult and governed dispatch | Existing coordination foundation | Capture public-path behavior and real provider receipts |\n| Read-only executors | Advisory P00.1 allowlist: claude-bwrap, codex-readonly, agy-bwrap | Verify exact current binding/build; ro-bind of host root does not hide host files |\n| Dynamic specialist | Engine consult/declared slots exist per prior review | Public-path unanticipated recruitment without graph changes remains unproven |\n| Identity | Store compares driver writer strings | Authenticated identity inaccessible to worker is not established |\n| Visibility | Grants/windows and lineage exist | Actual filesystem/tool read containment remains unproven |\n| Mutation | Public run now forwards step.mutation | Safe isolated mutating executor and full public path remain unproven |\n| Closure | Actor quorum and automatic close remain in inspected source | Explicit candidate obligations may require substrate changes; record failure honestly |\n| Resume | Execution ledger and chain projections exist | Rationale checkpoint, exposure history, coordinator fencing, and unknown reconciliation need proof |\n| Limits | Assignment/concurrency checks exist | Correct attempt/cost accounting and parked-time semantics need verification |\n\nDo not implement an alternate private runtime and count its success as native\nfgOS proof. If a disposable broker prototype is needed, label its results\nprototype-only, keep the exact delta visible, and distinguish existing capability\nfrom hypothesized capability. A blocked full scenario should yield a gap report\nand executable smaller probes, not a fabricated overall pass."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_87bd809203f0b1b237b0afac092f6fda"
}
```

## Entry claim_92e903b30cfd63a63027bfff4d7a109d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-11-coordination-envelope-probe-contract.json",
  "collection": "claims",
  "claimId": "claim_92e903b30cfd63a63027bfff4d7a109d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-11-coordination-envelope-probe-contract.json",
  "before": {
    "claimId": "claim_92e903b30cfd63a63027bfff4d7a109d",
    "sourceUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source unheaded-block docs/architect/proposals/coordination-envelope-probe-contract.md#unheaded-block-16 (lines 119–121) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#unheaded-block-19 (lines 146–148); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract",
      "Current substrate fit and gaps"
    ]
  },
  "currentDecision": {
    "claimId": "claim_92e903b30cfd63a63027bfff4d7a109d",
    "sourceUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source unheaded-block docs/architect/proposals/coordination-envelope-probe-contract.md#unheaded-block-16 (lines 119–121) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#unheaded-block-19 (lines 146–148); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract",
      "Current substrate fit and gaps"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "unitDigest": "f805a9f64eabeb1746fe0055127e07d44080ef1d764a9c8eafaaf21048b5f3f8",
    "identityFingerprint": "f805a9f64eabeb1746fe0055127e07d44080ef1d764a9c8eafaaf21048b5f3f8",
    "claimId": "claim_92e903b30cfd63a63027bfff4d7a109d",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-16",
      "githubAnchor": "unheaded-block-16",
      "stableAnchor": "unheaded-block-16",
      "title": "Unheaded block 16",
      "startLine": 119,
      "endLine": 121,
      "textDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
      "sample": "Follow-up: [Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)\nidentifies inherited environment, credential custody, private scratch, and output\ning",
      "identityFingerprint": "f805a9f64eabeb1746fe0055127e07d44080ef1d764a9c8eafaaf21048b5f3f8",
      "ancestry": [
        "Coordination Envelope — Minimal Probe Contract",
        "Current substrate fit and gaps"
      ],
      "text": "Follow-up: [Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)\nidentifies inherited environment, credential custody, private scratch, and output\ningestion requirements before a real provider run. It remains Discussion."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-19",
    "githubAnchor": "unheaded-block-19",
    "stableAnchor": "unheaded-block-19",
    "title": "Unheaded block 19",
    "startLine": 146,
    "endLine": 148,
    "textDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "sample": "Follow-up: [Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)\nidentifies inherited environment, credential custody, private scratch, and output\ning",
    "identityFingerprint": "f805a9f64eabeb1746fe0055127e07d44080ef1d764a9c8eafaaf21048b5f3f8",
    "ancestry": [
      "Coordination Envelope — Minimal Probe Contract",
      "Current substrate fit and gaps"
    ],
    "text": "Follow-up: [Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)\nidentifies inherited environment, credential custody, private scratch, and output\ningestion requirements before a real provider run. It remains Discussion."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-19",
      "githubAnchor": "unheaded-block-19",
      "stableAnchor": "unheaded-block-19",
      "title": "Unheaded block 19",
      "startLine": 146,
      "endLine": 148,
      "textDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
      "sample": "Follow-up: [Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)\nidentifies inherited environment, credential custody, private scratch, and output\ning",
      "identityFingerprint": "f805a9f64eabeb1746fe0055127e07d44080ef1d764a9c8eafaaf21048b5f3f8",
      "ancestry": [
        "Coordination Envelope — Minimal Probe Contract",
        "Current substrate fit and gaps"
      ],
      "text": "Follow-up: [Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)\nidentifies inherited environment, credential custody, private scratch, and output\ningestion requirements before a real provider run. It remains Discussion."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_92e903b30cfd63a63027bfff4d7a109d"
}
```

## Entry claim_8dc6683dbb0a864d34d8649af015ce4a

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-13-coordination-worker-provider-boundary.json",
  "collection": "claims",
  "claimId": "claim_8dc6683dbb0a864d34d8649af015ce4a",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-13-coordination-worker-provider-boundary.json",
  "before": {
    "claimId": "claim_8dc6683dbb0a864d34d8649af015ce4a",
    "sourceUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "new-evidence-since-the-first-capability-audit",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 34–34) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 58–58); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary"
    ]
  },
  "currentDecision": {
    "claimId": "claim_8dc6683dbb0a864d34d8649af015ce4a",
    "sourceUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "new-evidence-since-the-first-capability-audit",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 34–34) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 58–58); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "unitDigest": "249ab4ca83e02d34ae130240b42146b4f204111f2a6082f819c2cc1166bab2a1",
    "identityFingerprint": "3c9ee409b0390c2a0c09646ff86cfeb71b6350a7429ce608356ce4a924e42bdc",
    "claimId": "claim_8dc6683dbb0a864d34d8649af015ce4a",
    "sourceAnchor": "new-evidence-since-the-first-capability-audit",
    "unitKind": "heading",
    "sourceUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "New evidence since the first capability audit",
      "anchor": "new-evidence-since-the-first-capability-audit",
      "githubAnchor": "new-evidence-since-the-first-capability-audit",
      "stableAnchor": "h-b1e0a99df863",
      "startLine": 34,
      "endLine": 34,
      "textDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
      "sample": "New evidence since the first capability audit",
      "sectionPayloadDigest": "32ab29bed3f6d4d7311a09e69f6b1a757343cabf0db8058408c4acf444f0cc03",
      "followingBlockDigest": "36a7c61d3234271b56c56913c31b1d2e24c5f1c88169d21f6ec14efb771515d6",
      "identityFingerprint": "3c9ee409b0390c2a0c09646ff86cfeb71b6350a7429ce608356ce4a924e42bdc",
      "ancestry": [
        "Coordination Envelope — Worker, Provider, and Control Boundary"
      ],
      "text": "## New evidence since the first capability audit",
      "sectionText": "## New evidence since the first capability audit\n\n[Transport](../../../src/runner/dispatch/transport.mjs), cliSpawnAdapter, launches\nwith `{ ...process.env, ...resolvedEnv, FGOS_DISPATCH_DEPTH: ... }`. The herdr path\nalso constructs a merged fullEnv. Environment overrides therefore do not form an\nallowlist. This is static evidence of inheritance, not a claim that a real secret\nwas leaked. An environment depth counter is a cooperative limit; a hostile child\ncan change its own environment, so it cannot own authoritative budget accounting.\n\n[Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) renders an\nabsolute runDir for worker report/result submission. That directory also contains\nruntime-authored dispatch-plan.json, run.json, and subsequent evidence/result\nfiles. A writable bind of the entire directory would grant more than submission\nrights. This is a proposed-isolation integration hazard, not a newly reproduced\nmetadata-forgery exploit.\n\nA fixed Python process inside the narrow mount inherited a synthetic parent\ncanary. Adding `--clearenv` removed it. No actual host environment values or\ncredentials were read. See [raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)\nand [reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).\nRun the script from repo root; it calls no provider or fgOS dispatch adapter."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "New evidence since the first capability audit",
    "anchor": "new-evidence-since-the-first-capability-audit",
    "githubAnchor": "new-evidence-since-the-first-capability-audit",
    "stableAnchor": "h-adafe1ba1b5b",
    "startLine": 58,
    "endLine": 58,
    "textDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "sample": "New evidence since the first capability audit",
    "sectionPayloadDigest": "32ab29bed3f6d4d7311a09e69f6b1a757343cabf0db8058408c4acf444f0cc03",
    "followingBlockDigest": "36a7c61d3234271b56c56913c31b1d2e24c5f1c88169d21f6ec14efb771515d6",
    "identityFingerprint": "3c9ee409b0390c2a0c09646ff86cfeb71b6350a7429ce608356ce4a924e42bdc",
    "ancestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary"
    ],
    "text": "## New evidence since the first capability audit",
    "sectionText": "## New evidence since the first capability audit\n\n[Transport](../../../src/runner/dispatch/transport.mjs), cliSpawnAdapter, launches\nwith `{ ...process.env, ...resolvedEnv, FGOS_DISPATCH_DEPTH: ... }`. The herdr path\nalso constructs a merged fullEnv. Environment overrides therefore do not form an\nallowlist. This is static evidence of inheritance, not a claim that a real secret\nwas leaked. An environment depth counter is a cooperative limit; a hostile child\ncan change its own environment, so it cannot own authoritative budget accounting.\n\n[Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) renders an\nabsolute runDir for worker report/result submission. That directory also contains\nruntime-authored dispatch-plan.json, run.json, and subsequent evidence/result\nfiles. A writable bind of the entire directory would grant more than submission\nrights. This is a proposed-isolation integration hazard, not a newly reproduced\nmetadata-forgery exploit.\n\nA fixed Python process inside the narrow mount inherited a synthetic parent\ncanary. Adding `--clearenv` removed it. No actual host environment values or\ncredentials were read. See [raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)\nand [reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).\nRun the script from repo root; it calls no provider or fgOS dispatch adapter."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "heading",
      "level": 2,
      "title": "New evidence since the first capability audit",
      "anchor": "new-evidence-since-the-first-capability-audit",
      "githubAnchor": "new-evidence-since-the-first-capability-audit",
      "stableAnchor": "h-adafe1ba1b5b",
      "startLine": 58,
      "endLine": 58,
      "textDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
      "sample": "New evidence since the first capability audit",
      "sectionPayloadDigest": "32ab29bed3f6d4d7311a09e69f6b1a757343cabf0db8058408c4acf444f0cc03",
      "followingBlockDigest": "36a7c61d3234271b56c56913c31b1d2e24c5f1c88169d21f6ec14efb771515d6",
      "identityFingerprint": "3c9ee409b0390c2a0c09646ff86cfeb71b6350a7429ce608356ce4a924e42bdc",
      "ancestry": [
        "Coordination Envelope — Worker, Provider, and Control Boundary"
      ],
      "text": "## New evidence since the first capability audit",
      "sectionText": "## New evidence since the first capability audit\n\n[Transport](../../../src/runner/dispatch/transport.mjs), cliSpawnAdapter, launches\nwith `{ ...process.env, ...resolvedEnv, FGOS_DISPATCH_DEPTH: ... }`. The herdr path\nalso constructs a merged fullEnv. Environment overrides therefore do not form an\nallowlist. This is static evidence of inheritance, not a claim that a real secret\nwas leaked. An environment depth counter is a cooperative limit; a hostile child\ncan change its own environment, so it cannot own authoritative budget accounting.\n\n[Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) renders an\nabsolute runDir for worker report/result submission. That directory also contains\nruntime-authored dispatch-plan.json, run.json, and subsequent evidence/result\nfiles. A writable bind of the entire directory would grant more than submission\nrights. This is a proposed-isolation integration hazard, not a newly reproduced\nmetadata-forgery exploit.\n\nA fixed Python process inside the narrow mount inherited a synthetic parent\ncanary. Adding `--clearenv` removed it. No actual host environment values or\ncredentials were read. See [raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)\nand [reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).\nRun the script from repo root; it calls no provider or fgOS dispatch adapter."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_8dc6683dbb0a864d34d8649af015ce4a"
}
```

## Entry claim_339a0cb071824020b79d4945db284748

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-13-coordination-worker-provider-boundary.json",
  "collection": "claims",
  "claimId": "claim_339a0cb071824020b79d4945db284748",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-13-coordination-worker-provider-boundary.json",
  "before": {
    "claimId": "claim_339a0cb071824020b79d4945db284748",
    "sourceUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "unheaded-block-11",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-8 (lines 50–54) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-11 (lines 74–78); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary",
      "New evidence since the first capability audit"
    ]
  },
  "currentDecision": {
    "claimId": "claim_339a0cb071824020b79d4945db284748",
    "sourceUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "unheaded-block-11",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-8 (lines 50–54) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-11 (lines 74–78); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary",
      "New evidence since the first capability audit"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "unitDigest": "ab556721be2ffe862d4030d20fa2aac0ff7f129da63daf82f4eb34e25b03dcf0",
    "identityFingerprint": "ab556721be2ffe862d4030d20fa2aac0ff7f129da63daf82f4eb34e25b03dcf0",
    "claimId": "claim_339a0cb071824020b79d4945db284748",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-8",
      "githubAnchor": "unheaded-block-8",
      "stableAnchor": "unheaded-block-8",
      "title": "Unheaded block 8",
      "startLine": 50,
      "endLine": 54,
      "textDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
      "sample": "A fixed Python process inside the narrow mount inherited a synthetic parent\ncanary. Adding `--clearenv` removed it. No actual host environment values or\ncredentials were read. See ",
      "identityFingerprint": "ab556721be2ffe862d4030d20fa2aac0ff7f129da63daf82f4eb34e25b03dcf0",
      "ancestry": [
        "Coordination Envelope — Worker, Provider, and Control Boundary",
        "New evidence since the first capability audit"
      ],
      "text": "A fixed Python process inside the narrow mount inherited a synthetic parent\ncanary. Adding `--clearenv` removed it. No actual host environment values or\ncredentials were read. See [raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)\nand [reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).\nRun the script from repo root; it calls no provider or fgOS dispatch adapter."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 74,
    "endLine": 78,
    "textDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "sample": "A fixed Python process inside the narrow mount inherited a synthetic parent\ncanary. Adding `--clearenv` removed it. No actual host environment values or\ncredentials were read. See ",
    "identityFingerprint": "ab556721be2ffe862d4030d20fa2aac0ff7f129da63daf82f4eb34e25b03dcf0",
    "ancestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary",
      "New evidence since the first capability audit"
    ],
    "text": "A fixed Python process inside the narrow mount inherited a synthetic parent\ncanary. Adding `--clearenv` removed it. No actual host environment values or\ncredentials were read. See [raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)\nand [reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).\nRun the script from repo root; it calls no provider or fgOS dispatch adapter."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-11",
      "githubAnchor": "unheaded-block-11",
      "stableAnchor": "unheaded-block-11",
      "title": "Unheaded block 11",
      "startLine": 74,
      "endLine": 78,
      "textDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
      "sample": "A fixed Python process inside the narrow mount inherited a synthetic parent\ncanary. Adding `--clearenv` removed it. No actual host environment values or\ncredentials were read. See ",
      "identityFingerprint": "ab556721be2ffe862d4030d20fa2aac0ff7f129da63daf82f4eb34e25b03dcf0",
      "ancestry": [
        "Coordination Envelope — Worker, Provider, and Control Boundary",
        "New evidence since the first capability audit"
      ],
      "text": "A fixed Python process inside the narrow mount inherited a synthetic parent\ncanary. Adding `--clearenv` removed it. No actual host environment values or\ncredentials were read. See [raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)\nand [reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).\nRun the script from repo root; it calls no provider or fgOS dispatch adapter."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_339a0cb071824020b79d4945db284748"
}
```

## Entry claim_69cd8997c627f22f069222676cc25e4d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-15-readme.json",
  "collection": "claims",
  "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-15-readme.json",
  "before": {
    "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
    "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "active-proposals",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
      "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "active-proposals",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: heading active-proposals src lines 16-16 -> tgt active-proposals lines 40-40; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "d836846ddf01300cd1a50ab447e19e2c6b478104bf0621e9f044b37446c2feb4",
      "targetAncestry": [
        "Architect-Level Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetAncestry": [
      "Architect-Level Proposals"
    ]
  },
  "currentDecision": {
    "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
    "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "active-proposals",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
      "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "active-proposals",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: heading active-proposals src lines 16-16 -> tgt active-proposals lines 40-40; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "d836846ddf01300cd1a50ab447e19e2c6b478104bf0621e9f044b37446c2feb4",
      "targetAncestry": [
        "Architect-Level Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetAncestry": [
      "Architect-Level Proposals"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/README.md",
    "unitDigest": "d8328d80baddc065d664d39ea358a278c747487606f1db9fc1f34e0fd07c8fbd",
    "identityFingerprint": "0aebaddbd45143cd3065ea66958178855c69a1cc720358f406f952e86236c75c",
    "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
    "sourceAnchor": "active-proposals",
    "unitKind": "heading",
    "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Active Proposals",
      "anchor": "active-proposals",
      "githubAnchor": "active-proposals",
      "stableAnchor": "h-46348cede15e",
      "startLine": 16,
      "endLine": 16,
      "textDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
      "sample": "Active Proposals",
      "sectionPayloadDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "followingBlockDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "identityFingerprint": "0aebaddbd45143cd3065ea66958178855c69a1cc720358f406f952e86236c75c",
      "ancestry": [
        "Architect-Level Proposals"
      ],
      "text": "## Active Proposals",
      "sectionText": "## Active Proposals\n\n- [Coordination Capability Envelope](coordination-capability-envelope.md) —\n  discussion following the independent review: three architecture families,\n  hard/soft boundaries, recommendation, migration responsibilities, and probes;\n  not an accepted architecture or implementation plan.\n- [Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)\n- [Architecture Advisory Panel](architecture-advisory-panel.md) — the next\n  Group Thinking use case after `fgos-code-panel`: investigate and frame a\n  software-system problem, deliberate on architectures, advise a person, and\n  support a bounded decision dialogue.\n- [Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)\n- [Component Authority Boundary Map](component-authority-boundary-map.md)"
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "Active Proposals",
    "anchor": "active-proposals",
    "githubAnchor": "active-proposals",
    "stableAnchor": "h-7b1dea5fe9b9",
    "startLine": 40,
    "endLine": 40,
    "textDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "sample": "Active Proposals",
    "sectionPayloadDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "followingBlockDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "identityFingerprint": "0aebaddbd45143cd3065ea66958178855c69a1cc720358f406f952e86236c75c",
    "ancestry": [
      "Architect-Level Proposals"
    ],
    "text": "## Active Proposals",
    "sectionText": "## Active Proposals\n\n- [Coordination Capability Envelope](coordination-capability-envelope.md) —\n  discussion following the independent review: three architecture families,\n  hard/soft boundaries, recommendation, migration responsibilities, and probes;\n  not an accepted architecture or implementation plan.\n- [Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)\n- [Architecture Advisory Panel](architecture-advisory-panel.md) — the next\n  Group Thinking use case after `fgos-code-panel`: investigate and frame a\n  software-system problem, deliberate on architectures, advise a person, and\n  support a bounded decision dialogue.\n- [Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)\n- [Component Authority Boundary Map](component-authority-boundary-map.md)"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "source unit shorter than 40 characters",
    "targetUnit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Active Proposals",
      "anchor": "active-proposals",
      "githubAnchor": "active-proposals",
      "stableAnchor": "h-7b1dea5fe9b9",
      "startLine": 40,
      "endLine": 40,
      "textDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
      "sample": "Active Proposals",
      "sectionPayloadDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "followingBlockDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "identityFingerprint": "0aebaddbd45143cd3065ea66958178855c69a1cc720358f406f952e86236c75c",
      "ancestry": [
        "Architect-Level Proposals"
      ],
      "text": "## Active Proposals",
      "sectionText": "## Active Proposals\n\n- [Coordination Capability Envelope](coordination-capability-envelope.md) —\n  discussion following the independent review: three architecture families,\n  hard/soft boundaries, recommendation, migration responsibilities, and probes;\n  not an accepted architecture or implementation plan.\n- [Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)\n- [Architecture Advisory Panel](architecture-advisory-panel.md) — the next\n  Group Thinking use case after `fgos-code-panel`: investigate and frame a\n  software-system problem, deliberate on architectures, advise a person, and\n  support a bounded decision dialogue.\n- [Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)\n- [Component Authority Boundary Map](component-authority-boundary-map.md)"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_69cd8997c627f22f069222676cc25e4d"
}
```

## Entry claim_76cd5a79f79a23ddf7bf30b53312aadf

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-15-readme.json",
  "collection": "claims",
  "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-15-readme.json",
  "before": {
    "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
    "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
      "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "unheaded-block-7",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: unheaded-block unheaded-block-4 src lines 18-28 -> tgt unheaded-block-7 lines 42-52; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "3d3d1d86ca10ef2ed0b784f13f86a69a4f06b906a73fcdf2eeca096c8119b5c0",
      "targetAncestry": [
        "Architect-Level Proposals",
        "Active Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetAncestry": [
      "Architect-Level Proposals",
      "Active Proposals"
    ]
  },
  "currentDecision": {
    "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
    "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
      "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "unheaded-block-7",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: unheaded-block unheaded-block-4 src lines 18-28 -> tgt unheaded-block-7 lines 42-52; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "3d3d1d86ca10ef2ed0b784f13f86a69a4f06b906a73fcdf2eeca096c8119b5c0",
      "targetAncestry": [
        "Architect-Level Proposals",
        "Active Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetAncestry": [
      "Architect-Level Proposals",
      "Active Proposals"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/README.md",
    "unitDigest": "6a712f152de142d3818934496b355be8004e8ca24feb19d3c3d9414c8f4d87f6",
    "identityFingerprint": "6a712f152de142d3818934496b355be8004e8ca24feb19d3c3d9414c8f4d87f6",
    "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-4",
      "githubAnchor": "unheaded-block-4",
      "stableAnchor": "unheaded-block-4",
      "title": "Unheaded block 4",
      "startLine": 18,
      "endLine": 28,
      "textDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "sample": "- [Coordination Capability Envelope](coordination-capability-envelope.md) —\n  discussion following the independent review: three architecture families,\n  hard/soft boundaries, reco",
      "identityFingerprint": "6a712f152de142d3818934496b355be8004e8ca24feb19d3c3d9414c8f4d87f6",
      "ancestry": [
        "Architect-Level Proposals",
        "Active Proposals"
      ],
      "text": "- [Coordination Capability Envelope](coordination-capability-envelope.md) —\n  discussion following the independent review: three architecture families,\n  hard/soft boundaries, recommendation, migration responsibilities, and probes;\n  not an accepted architecture or implementation plan.\n- [Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)\n- [Architecture Advisory Panel](architecture-advisory-panel.md) — the next\n  Group Thinking use case after `fgos-code-panel`: investigate and frame a\n  software-system problem, deliberate on architectures, advise a person, and\n  support a bounded decision dialogue.\n- [Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)\n- [Component Authority Boundary Map](component-authority-boundary-map.md)"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 42,
    "endLine": 52,
    "textDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "sample": "- [Coordination Capability Envelope](coordination-capability-envelope.md) —\n  discussion following the independent review: three architecture families,\n  hard/soft boundaries, reco",
    "identityFingerprint": "6a712f152de142d3818934496b355be8004e8ca24feb19d3c3d9414c8f4d87f6",
    "ancestry": [
      "Architect-Level Proposals",
      "Active Proposals"
    ],
    "text": "- [Coordination Capability Envelope](coordination-capability-envelope.md) —\n  discussion following the independent review: three architecture families,\n  hard/soft boundaries, recommendation, migration responsibilities, and probes;\n  not an accepted architecture or implementation plan.\n- [Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)\n- [Architecture Advisory Panel](architecture-advisory-panel.md) — the next\n  Group Thinking use case after `fgos-code-panel`: investigate and frame a\n  software-system problem, deliberate on architectures, advise a person, and\n  support a bounded decision dialogue.\n- [Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)\n- [Component Authority Boundary Map](component-authority-boundary-map.md)"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-7",
      "githubAnchor": "unheaded-block-7",
      "stableAnchor": "unheaded-block-7",
      "title": "Unheaded block 7",
      "startLine": 42,
      "endLine": 52,
      "textDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "sample": "- [Coordination Capability Envelope](coordination-capability-envelope.md) —\n  discussion following the independent review: three architecture families,\n  hard/soft boundaries, reco",
      "identityFingerprint": "6a712f152de142d3818934496b355be8004e8ca24feb19d3c3d9414c8f4d87f6",
      "ancestry": [
        "Architect-Level Proposals",
        "Active Proposals"
      ],
      "text": "- [Coordination Capability Envelope](coordination-capability-envelope.md) —\n  discussion following the independent review: three architecture families,\n  hard/soft boundaries, recommendation, migration responsibilities, and probes;\n  not an accepted architecture or implementation plan.\n- [Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)\n- [Architecture Advisory Panel](architecture-advisory-panel.md) — the next\n  Group Thinking use case after `fgos-code-panel`: investigate and frame a\n  software-system problem, deliberate on architectures, advise a person, and\n  support a bounded decision dialogue.\n- [Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)\n- [Component Authority Boundary Map](component-authority-boundary-map.md)"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_76cd5a79f79a23ddf7bf30b53312aadf"
}
```

## Entry claim_3865318571c3ebc0fed1203eddbca0c1

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "collection": "claims",
  "claimId": "claim_3865318571c3ebc0fed1203eddbca0c1",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "before": {
    "claimId": "claim_3865318571c3ebc0fed1203eddbca0c1",
    "sourceUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "5-prompt-source-not-runtime-dependency",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792080300559-b4112a2f@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 167–167) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 191–191); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate"
    ]
  },
  "currentDecision": {
    "claimId": "claim_3865318571c3ebc0fed1203eddbca0c1",
    "sourceUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "5-prompt-source-not-runtime-dependency",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 167–167) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 191–191); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "unitDigest": "885a12cc9eb997e4c001d974a1eae14279eb46aecdbedb4929d2324e97d57af7",
    "identityFingerprint": "8d7196c0fd12671ffb9566ab16c25c88953404939821b81f3cabd02c714344a0",
    "claimId": "claim_3865318571c3ebc0fed1203eddbca0c1",
    "sourceAnchor": "5-prompt-source-not-runtime-dependency",
    "unitKind": "heading",
    "sourceUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "5. Prompt Source, Not Runtime Dependency",
      "anchor": "5-prompt-source-not-runtime-dependency",
      "githubAnchor": "5-prompt-source-not-runtime-dependency",
      "stableAnchor": "h-f39b0d5aa4b1",
      "startLine": 167,
      "endLine": 167,
      "textDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
      "sample": "5. Prompt Source, Not Runtime Dependency",
      "sectionPayloadDigest": "3bd39e372a7e8ad09a0ed436f601ea41119565f90c6c7d590183367c81c2d800",
      "followingBlockDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
      "identityFingerprint": "8d7196c0fd12671ffb9566ab16c25c88953404939821b81f3cabd02c714344a0",
      "ancestry": [
        "Step 09 - Group Thinking Substrate"
      ],
      "text": "## 5. Prompt Source, Not Runtime Dependency",
      "sectionText": "## 5. Prompt Source, Not Runtime Dependency\n\nThe manual proof source is\n[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\nbacked by the\n[Coordination Operating Harness](../agent-coordination/playbooks/coordination-operating-harness.md).\nThose playbooks are not loaded by runtime and must not become hidden runtime\nprose. Their value for Step 09 is the operating shape they proved:\n\n```txt\nexternal coordinator owns durable state and stop/go authority\n  -> doer produces a bounded candidate\n  -> reviewer independently checks correctness/regression\n  -> red-team independently attacks invariants and false-success paths\n  -> coordinator dispositions findings\n  -> fixer/doer-followup handles accepted findings only\n  -> reviewer/red-team recheck the new revision\n  -> coordinator closes, blocks, or authorizes another declared round\n```\n\nStep 09 extracts that shape into declared FlowDefinition/session primitives. It\ndoes not paste the prompt into product runtime, and it does not make the prompt\nthe authority for Work, git, merge, approval, or lifecycle mutation."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Prompt Source, Not Runtime Dependency",
    "anchor": "5-prompt-source-not-runtime-dependency",
    "githubAnchor": "5-prompt-source-not-runtime-dependency",
    "stableAnchor": "h-ed4afc43cba5",
    "startLine": 191,
    "endLine": 191,
    "textDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "sample": "5. Prompt Source, Not Runtime Dependency",
    "sectionPayloadDigest": "3bd39e372a7e8ad09a0ed436f601ea41119565f90c6c7d590183367c81c2d800",
    "followingBlockDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
    "identityFingerprint": "8d7196c0fd12671ffb9566ab16c25c88953404939821b81f3cabd02c714344a0",
    "ancestry": [
      "Step 09 - Group Thinking Substrate"
    ],
    "text": "## 5. Prompt Source, Not Runtime Dependency",
    "sectionText": "## 5. Prompt Source, Not Runtime Dependency\n\nThe manual proof source is\n[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\nbacked by the\n[Coordination Operating Harness](../agent-coordination/playbooks/coordination-operating-harness.md).\nThose playbooks are not loaded by runtime and must not become hidden runtime\nprose. Their value for Step 09 is the operating shape they proved:\n\n```txt\nexternal coordinator owns durable state and stop/go authority\n  -> doer produces a bounded candidate\n  -> reviewer independently checks correctness/regression\n  -> red-team independently attacks invariants and false-success paths\n  -> coordinator dispositions findings\n  -> fixer/doer-followup handles accepted findings only\n  -> reviewer/red-team recheck the new revision\n  -> coordinator closes, blocks, or authorizes another declared round\n```\n\nStep 09 extracts that shape into declared FlowDefinition/session primitives. It\ndoes not paste the prompt into product runtime, and it does not make the prompt\nthe authority for Work, git, merge, approval, or lifecycle mutation."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "heading",
      "level": 2,
      "title": "5. Prompt Source, Not Runtime Dependency",
      "anchor": "5-prompt-source-not-runtime-dependency",
      "githubAnchor": "5-prompt-source-not-runtime-dependency",
      "stableAnchor": "h-ed4afc43cba5",
      "startLine": 191,
      "endLine": 191,
      "textDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
      "sample": "5. Prompt Source, Not Runtime Dependency",
      "sectionPayloadDigest": "3bd39e372a7e8ad09a0ed436f601ea41119565f90c6c7d590183367c81c2d800",
      "followingBlockDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
      "identityFingerprint": "8d7196c0fd12671ffb9566ab16c25c88953404939821b81f3cabd02c714344a0",
      "ancestry": [
        "Step 09 - Group Thinking Substrate"
      ],
      "text": "## 5. Prompt Source, Not Runtime Dependency",
      "sectionText": "## 5. Prompt Source, Not Runtime Dependency\n\nThe manual proof source is\n[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\nbacked by the\n[Coordination Operating Harness](../agent-coordination/playbooks/coordination-operating-harness.md).\nThose playbooks are not loaded by runtime and must not become hidden runtime\nprose. Their value for Step 09 is the operating shape they proved:\n\n```txt\nexternal coordinator owns durable state and stop/go authority\n  -> doer produces a bounded candidate\n  -> reviewer independently checks correctness/regression\n  -> red-team independently attacks invariants and false-success paths\n  -> coordinator dispositions findings\n  -> fixer/doer-followup handles accepted findings only\n  -> reviewer/red-team recheck the new revision\n  -> coordinator closes, blocks, or authorizes another declared round\n```\n\nStep 09 extracts that shape into declared FlowDefinition/session primitives. It\ndoes not paste the prompt into product runtime, and it does not make the prompt\nthe authority for Work, git, merge, approval, or lifecycle mutation."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_3865318571c3ebc0fed1203eddbca0c1"
}
```

## Entry claim_77e26521b60e819e54cd3ddaebf8f20f

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "collection": "claims",
  "claimId": "claim_77e26521b60e819e54cd3ddaebf8f20f",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "before": {
    "claimId": "claim_77e26521b60e819e54cd3ddaebf8f20f",
    "sourceUnitDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "unheaded-block-20",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792080300559-b4112a2f@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-17 (lines 169–174) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-20 (lines 193–198); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate",
      "5. Prompt Source, Not Runtime Dependency"
    ]
  },
  "currentDecision": {
    "claimId": "claim_77e26521b60e819e54cd3ddaebf8f20f",
    "sourceUnitDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "unheaded-block-20",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-17 (lines 169–174) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-20 (lines 193–198); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate",
      "5. Prompt Source, Not Runtime Dependency"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "unitDigest": "a4fb9ff2a9618483dbc899fc651b24e80f63d8ee6a6743e3b050f81001d3307f",
    "identityFingerprint": "a4fb9ff2a9618483dbc899fc651b24e80f63d8ee6a6743e3b050f81001d3307f",
    "claimId": "claim_77e26521b60e819e54cd3ddaebf8f20f",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-17",
      "githubAnchor": "unheaded-block-17",
      "stableAnchor": "unheaded-block-17",
      "title": "Unheaded block 17",
      "startLine": 169,
      "endLine": 174,
      "textDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
      "sample": "The manual proof source is\n[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\nbacked by the\n[Coordination Operating Har",
      "identityFingerprint": "a4fb9ff2a9618483dbc899fc651b24e80f63d8ee6a6743e3b050f81001d3307f",
      "ancestry": [
        "Step 09 - Group Thinking Substrate",
        "5. Prompt Source, Not Runtime Dependency"
      ],
      "text": "The manual proof source is\n[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\nbacked by the\n[Coordination Operating Harness](../agent-coordination/playbooks/coordination-operating-harness.md).\nThose playbooks are not loaded by runtime and must not become hidden runtime\nprose. Their value for Step 09 is the operating shape they proved:"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-20",
    "githubAnchor": "unheaded-block-20",
    "stableAnchor": "unheaded-block-20",
    "title": "Unheaded block 20",
    "startLine": 193,
    "endLine": 198,
    "textDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
    "sample": "The manual proof source is\n[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\nbacked by the\n[Coordination Operating Har",
    "identityFingerprint": "a4fb9ff2a9618483dbc899fc651b24e80f63d8ee6a6743e3b050f81001d3307f",
    "ancestry": [
      "Step 09 - Group Thinking Substrate",
      "5. Prompt Source, Not Runtime Dependency"
    ],
    "text": "The manual proof source is\n[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\nbacked by the\n[Coordination Operating Harness](../agent-coordination/playbooks/coordination-operating-harness.md).\nThose playbooks are not loaded by runtime and must not become hidden runtime\nprose. Their value for Step 09 is the operating shape they proved:"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-20",
      "githubAnchor": "unheaded-block-20",
      "stableAnchor": "unheaded-block-20",
      "title": "Unheaded block 20",
      "startLine": 193,
      "endLine": 198,
      "textDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
      "sample": "The manual proof source is\n[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\nbacked by the\n[Coordination Operating Har",
      "identityFingerprint": "a4fb9ff2a9618483dbc899fc651b24e80f63d8ee6a6743e3b050f81001d3307f",
      "ancestry": [
        "Step 09 - Group Thinking Substrate",
        "5. Prompt Source, Not Runtime Dependency"
      ],
      "text": "The manual proof source is\n[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\nbacked by the\n[Coordination Operating Harness](../agent-coordination/playbooks/coordination-operating-harness.md).\nThose playbooks are not loaded by runtime and must not become hidden runtime\nprose. Their value for Step 09 is the operating shape they proved:"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_77e26521b60e819e54cd3ddaebf8f20f"
}
```

## Entry claim_4ffa4a74fe4d743c8f99b9bcf43480d8

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "collection": "claims",
  "claimId": "claim_4ffa4a74fe4d743c8f99b9bcf43480d8",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "before": {
    "claimId": "claim_4ffa4a74fe4d743c8f99b9bcf43480d8",
    "sourceUnitDigest": "b9ea808cae6c10547475a63cfc946bd98e11dafd258f2f14334bb31ad11d40e1",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "12-relationship-to-component-boundary",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#12-relationship-to-component-boundary (lines 540–540) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#12-relationship-to-component-boundary (lines 564–564); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "b9ea808cae6c10547475a63cfc946bd98e11dafd258f2f14334bb31ad11d40e1",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate"
    ]
  },
  "currentDecision": {
    "claimId": "claim_4ffa4a74fe4d743c8f99b9bcf43480d8",
    "sourceUnitDigest": "b9ea808cae6c10547475a63cfc946bd98e11dafd258f2f14334bb31ad11d40e1",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "12-relationship-to-component-boundary",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#12-relationship-to-component-boundary (lines 540–540) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#12-relationship-to-component-boundary (lines 564–564); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "b9ea808cae6c10547475a63cfc946bd98e11dafd258f2f14334bb31ad11d40e1",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "unitDigest": "ff5830e4dc46b1369c05146f9d3309edb158b0fa675326b9bf3843f8e44a580b",
    "identityFingerprint": "f83f80773f457ed62e2eb6b528b2fb4d5431b1089cead9601ecdaf33fcc14d2f",
    "claimId": "claim_4ffa4a74fe4d743c8f99b9bcf43480d8",
    "sourceAnchor": "12-relationship-to-component-boundary",
    "unitKind": "heading",
    "sourceUnitDigest": "b9ea808cae6c10547475a63cfc946bd98e11dafd258f2f14334bb31ad11d40e1",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "12. Relationship To Component Boundary",
      "anchor": "12-relationship-to-component-boundary",
      "githubAnchor": "12-relationship-to-component-boundary",
      "stableAnchor": "h-af5b6d56aeac",
      "startLine": 540,
      "endLine": 540,
      "textDigest": "b9ea808cae6c10547475a63cfc946bd98e11dafd258f2f14334bb31ad11d40e1",
      "sample": "12. Relationship To Component Boundary",
      "sectionPayloadDigest": "551debe6b2365a5f7fa602f46e7eaeee904600a00f9df4839fabb83c69d89876",
      "followingBlockDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
      "identityFingerprint": "f83f80773f457ed62e2eb6b528b2fb4d5431b1089cead9601ecdaf33fcc14d2f",
      "ancestry": [
        "Step 09 - Group Thinking Substrate"
      ],
      "text": "## 12. Relationship To Component Boundary",
      "sectionText": "## 12. Relationship To Component Boundary\n\n[Component Authority Boundary Map](component-authority-boundary-map.md) runs\nin parallel with this step. It is not a Step 10 appendix.\n\nStep 09 must use that map to keep new primitives in the right component:\n\n- driver-authorized session operations belong to Agent Coordination Engine;\n- Assignment execution still goes through Dispatch And Execution Engine;\n- RunResult confidence belongs to Run Result Evaluator;\n- Work routing belongs to Work Driver / Domain Workflow Interpreter;\n- git/worktree/merge/mutation belongs to Coding Domain Core when Step 10 later\n  consumes this substrate."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "12. Relationship To Component Boundary",
    "anchor": "12-relationship-to-component-boundary",
    "githubAnchor": "12-relationship-to-component-boundary",
    "stableAnchor": "h-3b97622e93e1",
    "startLine": 564,
    "endLine": 564,
    "textDigest": "b9ea808cae6c10547475a63cfc946bd98e11dafd258f2f14334bb31ad11d40e1",
    "sample": "12. Relationship To Component Boundary",
    "sectionPayloadDigest": "551debe6b2365a5f7fa602f46e7eaeee904600a00f9df4839fabb83c69d89876",
    "followingBlockDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
    "identityFingerprint": "f83f80773f457ed62e2eb6b528b2fb4d5431b1089cead9601ecdaf33fcc14d2f",
    "ancestry": [
      "Step 09 - Group Thinking Substrate"
    ],
    "text": "## 12. Relationship To Component Boundary",
    "sectionText": "## 12. Relationship To Component Boundary\n\n[Component Authority Boundary Map](component-authority-boundary-map.md) runs\nin parallel with this step. It is not a Step 10 appendix.\n\nStep 09 must use that map to keep new primitives in the right component:\n\n- driver-authorized session operations belong to Agent Coordination Engine;\n- Assignment execution still goes through Dispatch And Execution Engine;\n- RunResult confidence belongs to Run Result Evaluator;\n- Work routing belongs to Work Driver / Domain Workflow Interpreter;\n- git/worktree/merge/mutation belongs to Coding Domain Core when Step 10 later\n  consumes this substrate."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "heading",
      "level": 2,
      "title": "12. Relationship To Component Boundary",
      "anchor": "12-relationship-to-component-boundary",
      "githubAnchor": "12-relationship-to-component-boundary",
      "stableAnchor": "h-3b97622e93e1",
      "startLine": 564,
      "endLine": 564,
      "textDigest": "b9ea808cae6c10547475a63cfc946bd98e11dafd258f2f14334bb31ad11d40e1",
      "sample": "12. Relationship To Component Boundary",
      "sectionPayloadDigest": "551debe6b2365a5f7fa602f46e7eaeee904600a00f9df4839fabb83c69d89876",
      "followingBlockDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
      "identityFingerprint": "f83f80773f457ed62e2eb6b528b2fb4d5431b1089cead9601ecdaf33fcc14d2f",
      "ancestry": [
        "Step 09 - Group Thinking Substrate"
      ],
      "text": "## 12. Relationship To Component Boundary",
      "sectionText": "## 12. Relationship To Component Boundary\n\n[Component Authority Boundary Map](component-authority-boundary-map.md) runs\nin parallel with this step. It is not a Step 10 appendix.\n\nStep 09 must use that map to keep new primitives in the right component:\n\n- driver-authorized session operations belong to Agent Coordination Engine;\n- Assignment execution still goes through Dispatch And Execution Engine;\n- RunResult confidence belongs to Run Result Evaluator;\n- Work routing belongs to Work Driver / Domain Workflow Interpreter;\n- git/worktree/merge/mutation belongs to Coding Domain Core when Step 10 later\n  consumes this substrate."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_4ffa4a74fe4d743c8f99b9bcf43480d8"
}
```

## Entry claim_f89b2bed2567e78d27a202ee0ee0c2ca

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "collection": "claims",
  "claimId": "claim_f89b2bed2567e78d27a202ee0ee0c2ca",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "before": {
    "claimId": "claim_f89b2bed2567e78d27a202ee0ee0c2ca",
    "sourceUnitDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-68 (lines 542–543) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-71 (lines 566–567); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate",
      "12. Relationship To Component Boundary"
    ]
  },
  "currentDecision": {
    "claimId": "claim_f89b2bed2567e78d27a202ee0ee0c2ca",
    "sourceUnitDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-68 (lines 542–543) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-71 (lines 566–567); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate",
      "12. Relationship To Component Boundary"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "unitDigest": "923f02263b685584a85e0bea0da0b00adadf2c42532a74167a91bda7f91333a7",
    "identityFingerprint": "923f02263b685584a85e0bea0da0b00adadf2c42532a74167a91bda7f91333a7",
    "claimId": "claim_f89b2bed2567e78d27a202ee0ee0c2ca",
    "sourceAnchor": "unheaded-block-68",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-68",
      "githubAnchor": "unheaded-block-68",
      "stableAnchor": "unheaded-block-68",
      "title": "Unheaded block 68",
      "startLine": 542,
      "endLine": 543,
      "textDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
      "sample": "[Component Authority Boundary Map](component-authority-boundary-map.md) runs\nin parallel with this step. It is not a Step 10 appendix.",
      "identityFingerprint": "923f02263b685584a85e0bea0da0b00adadf2c42532a74167a91bda7f91333a7",
      "ancestry": [
        "Step 09 - Group Thinking Substrate",
        "12. Relationship To Component Boundary"
      ],
      "text": "[Component Authority Boundary Map](component-authority-boundary-map.md) runs\nin parallel with this step. It is not a Step 10 appendix."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-71",
    "githubAnchor": "unheaded-block-71",
    "stableAnchor": "unheaded-block-71",
    "title": "Unheaded block 71",
    "startLine": 566,
    "endLine": 567,
    "textDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
    "sample": "[Component Authority Boundary Map](component-authority-boundary-map.md) runs\nin parallel with this step. It is not a Step 10 appendix.",
    "identityFingerprint": "923f02263b685584a85e0bea0da0b00adadf2c42532a74167a91bda7f91333a7",
    "ancestry": [
      "Step 09 - Group Thinking Substrate",
      "12. Relationship To Component Boundary"
    ],
    "text": "[Component Authority Boundary Map](component-authority-boundary-map.md) runs\nin parallel with this step. It is not a Step 10 appendix."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-71",
      "githubAnchor": "unheaded-block-71",
      "stableAnchor": "unheaded-block-71",
      "title": "Unheaded block 71",
      "startLine": 566,
      "endLine": 567,
      "textDigest": "575b16caed0746115a42be20c669b3d6e822f1b4d58daae8bfbc6f3d3ae0abb8",
      "sample": "[Component Authority Boundary Map](component-authority-boundary-map.md) runs\nin parallel with this step. It is not a Step 10 appendix.",
      "identityFingerprint": "923f02263b685584a85e0bea0da0b00adadf2c42532a74167a91bda7f91333a7",
      "ancestry": [
        "Step 09 - Group Thinking Substrate",
        "12. Relationship To Component Boundary"
      ],
      "text": "[Component Authority Boundary Map](component-authority-boundary-map.md) runs\nin parallel with this step. It is not a Step 10 appendix."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_f89b2bed2567e78d27a202ee0ee0c2ca"
}
```

## Entry claim_ec251bc62228aaecd0f781877257390e

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "collection": "claims",
  "claimId": "claim_ec251bc62228aaecd0f781877257390e",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "before": {
    "claimId": "claim_ec251bc62228aaecd0f781877257390e",
    "sourceUnitDigest": "a9986b0abded736cb24f40b01c86bcacfe9349f0d8172cbf883a3b7a4d955bf5",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "13-relationship-to-step-10",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#13-relationship-to-step-10 (lines 554–554) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#13-relationship-to-step-10 (lines 578–578); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "a9986b0abded736cb24f40b01c86bcacfe9349f0d8172cbf883a3b7a4d955bf5",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate"
    ]
  },
  "currentDecision": {
    "claimId": "claim_ec251bc62228aaecd0f781877257390e",
    "sourceUnitDigest": "a9986b0abded736cb24f40b01c86bcacfe9349f0d8172cbf883a3b7a4d955bf5",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "13-relationship-to-step-10",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#13-relationship-to-step-10 (lines 554–554) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#13-relationship-to-step-10 (lines 578–578); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "a9986b0abded736cb24f40b01c86bcacfe9349f0d8172cbf883a3b7a4d955bf5",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "unitDigest": "6cd586fa134d838f1b065424c6ddcc7b9ab199a66076c52dd47b94cdbed8a76e",
    "identityFingerprint": "11d26f34f616c70011e03e9c61f3ed5b27ddedb40f3a023af2347cc0e7217794",
    "claimId": "claim_ec251bc62228aaecd0f781877257390e",
    "sourceAnchor": "13-relationship-to-step-10",
    "unitKind": "heading",
    "sourceUnitDigest": "a9986b0abded736cb24f40b01c86bcacfe9349f0d8172cbf883a3b7a4d955bf5",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "13. Relationship To Step 10",
      "anchor": "13-relationship-to-step-10",
      "githubAnchor": "13-relationship-to-step-10",
      "stableAnchor": "h-c5adfde3e2b5",
      "startLine": 554,
      "endLine": 554,
      "textDigest": "a9986b0abded736cb24f40b01c86bcacfe9349f0d8172cbf883a3b7a4d955bf5",
      "sample": "13. Relationship To Step 10",
      "sectionPayloadDigest": "4d0604140816b4b7f209d23b98f5f907bacfd17f30e29de4b69c5579c9270037",
      "followingBlockDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
      "identityFingerprint": "11d26f34f616c70011e03e9c61f3ed5b27ddedb40f3a023af2347cc0e7217794",
      "ancestry": [
        "Step 09 - Group Thinking Substrate"
      ],
      "text": "## 13. Relationship To Step 10",
      "sectionText": "## 13. Relationship To Step 10\n\n[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the\nconsumer track. It should read Step 09 first and then apply the proven\ngroup-thinking substrate to Work-attached coding collaboration.\n\nCoding must not shape Step 09's core around coding-only needs. Coding is the\nsecond unlike consumer that proves the substrate boundary, not the authority\nthat owns group thinking."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Relationship To Step 10",
    "anchor": "13-relationship-to-step-10",
    "githubAnchor": "13-relationship-to-step-10",
    "stableAnchor": "h-de9766ae9ca8",
    "startLine": 578,
    "endLine": 578,
    "textDigest": "a9986b0abded736cb24f40b01c86bcacfe9349f0d8172cbf883a3b7a4d955bf5",
    "sample": "13. Relationship To Step 10",
    "sectionPayloadDigest": "4d0604140816b4b7f209d23b98f5f907bacfd17f30e29de4b69c5579c9270037",
    "followingBlockDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
    "identityFingerprint": "11d26f34f616c70011e03e9c61f3ed5b27ddedb40f3a023af2347cc0e7217794",
    "ancestry": [
      "Step 09 - Group Thinking Substrate"
    ],
    "text": "## 13. Relationship To Step 10",
    "sectionText": "## 13. Relationship To Step 10\n\n[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the\nconsumer track. It should read Step 09 first and then apply the proven\ngroup-thinking substrate to Work-attached coding collaboration.\n\nCoding must not shape Step 09's core around coding-only needs. Coding is the\nsecond unlike consumer that proves the substrate boundary, not the authority\nthat owns group thinking."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "source unit shorter than 40 characters",
    "targetUnit": {
      "unitKind": "heading",
      "level": 2,
      "title": "13. Relationship To Step 10",
      "anchor": "13-relationship-to-step-10",
      "githubAnchor": "13-relationship-to-step-10",
      "stableAnchor": "h-de9766ae9ca8",
      "startLine": 578,
      "endLine": 578,
      "textDigest": "a9986b0abded736cb24f40b01c86bcacfe9349f0d8172cbf883a3b7a4d955bf5",
      "sample": "13. Relationship To Step 10",
      "sectionPayloadDigest": "4d0604140816b4b7f209d23b98f5f907bacfd17f30e29de4b69c5579c9270037",
      "followingBlockDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
      "identityFingerprint": "11d26f34f616c70011e03e9c61f3ed5b27ddedb40f3a023af2347cc0e7217794",
      "ancestry": [
        "Step 09 - Group Thinking Substrate"
      ],
      "text": "## 13. Relationship To Step 10",
      "sectionText": "## 13. Relationship To Step 10\n\n[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the\nconsumer track. It should read Step 09 first and then apply the proven\ngroup-thinking substrate to Work-attached coding collaboration.\n\nCoding must not shape Step 09's core around coding-only needs. Coding is the\nsecond unlike consumer that proves the substrate boundary, not the authority\nthat owns group thinking."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_ec251bc62228aaecd0f781877257390e"
}
```

## Entry claim_275235f3135d9c91c97b72039ab95501

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "collection": "claims",
  "claimId": "claim_275235f3135d9c91c97b72039ab95501",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "before": {
    "claimId": "claim_275235f3135d9c91c97b72039ab95501",
    "sourceUnitDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-71 (lines 556–558) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-74 (lines 580–582); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate",
      "13. Relationship To Step 10"
    ]
  },
  "currentDecision": {
    "claimId": "claim_275235f3135d9c91c97b72039ab95501",
    "sourceUnitDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-71 (lines 556–558) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-74 (lines 580–582); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate",
      "13. Relationship To Step 10"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "unitDigest": "107851bd0dd3f30dbe5118f1971ef3455c36d9f91a5c0e735e85059a441ccfbe",
    "identityFingerprint": "107851bd0dd3f30dbe5118f1971ef3455c36d9f91a5c0e735e85059a441ccfbe",
    "claimId": "claim_275235f3135d9c91c97b72039ab95501",
    "sourceAnchor": "unheaded-block-71",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-71",
      "githubAnchor": "unheaded-block-71",
      "stableAnchor": "unheaded-block-71",
      "title": "Unheaded block 71",
      "startLine": 556,
      "endLine": 558,
      "textDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
      "sample": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the\nconsumer track. It should read Step 09 first and then apply the proven\ngroup-thinking substrate to W",
      "identityFingerprint": "107851bd0dd3f30dbe5118f1971ef3455c36d9f91a5c0e735e85059a441ccfbe",
      "ancestry": [
        "Step 09 - Group Thinking Substrate",
        "13. Relationship To Step 10"
      ],
      "text": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the\nconsumer track. It should read Step 09 first and then apply the proven\ngroup-thinking substrate to Work-attached coding collaboration."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-74",
    "githubAnchor": "unheaded-block-74",
    "stableAnchor": "unheaded-block-74",
    "title": "Unheaded block 74",
    "startLine": 580,
    "endLine": 582,
    "textDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
    "sample": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the\nconsumer track. It should read Step 09 first and then apply the proven\ngroup-thinking substrate to W",
    "identityFingerprint": "107851bd0dd3f30dbe5118f1971ef3455c36d9f91a5c0e735e85059a441ccfbe",
    "ancestry": [
      "Step 09 - Group Thinking Substrate",
      "13. Relationship To Step 10"
    ],
    "text": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the\nconsumer track. It should read Step 09 first and then apply the proven\ngroup-thinking substrate to Work-attached coding collaboration."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-74",
      "githubAnchor": "unheaded-block-74",
      "stableAnchor": "unheaded-block-74",
      "title": "Unheaded block 74",
      "startLine": 580,
      "endLine": 582,
      "textDigest": "472338c56495259cbf528d57d38b9fe7146d09bba7cbfdfbb143e4292d599b66",
      "sample": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the\nconsumer track. It should read Step 09 first and then apply the proven\ngroup-thinking substrate to W",
      "identityFingerprint": "107851bd0dd3f30dbe5118f1971ef3455c36d9f91a5c0e735e85059a441ccfbe",
      "ancestry": [
        "Step 09 - Group Thinking Substrate",
        "13. Relationship To Step 10"
      ],
      "text": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the\nconsumer track. It should read Step 09 first and then apply the proven\ngroup-thinking substrate to Work-attached coding collaboration."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_275235f3135d9c91c97b72039ab95501"
}
```

## Entry claim_be4eaf1334073b4789d9465ca073ca10

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "collection": "claims",
  "claimId": "claim_be4eaf1334073b4789d9465ca073ca10",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "before": {
    "claimId": "claim_be4eaf1334073b4789d9465ca073ca10",
    "sourceUnitDigest": "8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "1-how-to-read-this-draft",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792080300559-b4112a2f@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#1-how-to-read-this-draft (lines 35–35) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#1-how-to-read-this-draft (lines 62–62); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
    ]
  },
  "currentDecision": {
    "claimId": "claim_be4eaf1334073b4789d9465ca073ca10",
    "sourceUnitDigest": "8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "1-how-to-read-this-draft",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#1-how-to-read-this-draft (lines 35–35) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#1-how-to-read-this-draft (lines 62–62); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "unitDigest": "5aa6ccf614b4457ca4480ede4c4d150ebadd4ccae6d7aea0b78f067f92740b09",
    "identityFingerprint": "3d7dccfba876216b6c20a9671ec2183bc45e22d0c6f793fde18e4b04c1e6d011",
    "claimId": "claim_be4eaf1334073b4789d9465ca073ca10",
    "sourceAnchor": "1-how-to-read-this-draft",
    "unitKind": "heading",
    "sourceUnitDigest": "8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "1. How To Read This Draft",
      "anchor": "1-how-to-read-this-draft",
      "githubAnchor": "1-how-to-read-this-draft",
      "stableAnchor": "h-fa170ecee166",
      "startLine": 35,
      "endLine": 35,
      "textDigest": "8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a",
      "sample": "1. How To Read This Draft",
      "sectionPayloadDigest": "d588250529db4a9a31a2d1f7f760887b930a0bf8528c06568a4804551370f93b",
      "followingBlockDigest": "674611497bb6224341a363fbb8b91816122c3965af2272ce59719ff9d97d6226",
      "identityFingerprint": "3d7dccfba876216b6c20a9671ec2183bc45e22d0c6f793fde18e4b04c1e6d011",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
      ],
      "text": "## 1. How To Read This Draft",
      "sectionText": "## 1. How To Read This Draft\n\nThis document uses three labels:\n\n- **Observed** describes current repository behavior found by reading code\n  and accepted documents on 2026-09-02.\n- **Proposed** captures a candidate direction from the discussion.\n- **Open** identifies a decision that still requires human review or proof.\n\nNothing labeled Proposed is an approved contract or plan. The\n[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority\nabove this proposal. In particular, V-002 (Work is optional integration),\nV-008 (domain augmentation), V-011 (small core), and V-012 (two unlike\nconsumers) constrain every idea below."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. How To Read This Draft",
    "anchor": "1-how-to-read-this-draft",
    "githubAnchor": "1-how-to-read-this-draft",
    "stableAnchor": "h-dd4e48e4ed93",
    "startLine": 62,
    "endLine": 62,
    "textDigest": "8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a",
    "sample": "1. How To Read This Draft",
    "sectionPayloadDigest": "d588250529db4a9a31a2d1f7f760887b930a0bf8528c06568a4804551370f93b",
    "followingBlockDigest": "674611497bb6224341a363fbb8b91816122c3965af2272ce59719ff9d97d6226",
    "identityFingerprint": "3d7dccfba876216b6c20a9671ec2183bc45e22d0c6f793fde18e4b04c1e6d011",
    "ancestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
    ],
    "text": "## 1. How To Read This Draft",
    "sectionText": "## 1. How To Read This Draft\n\nThis document uses three labels:\n\n- **Observed** describes current repository behavior found by reading code\n  and accepted documents on 2026-09-02.\n- **Proposed** captures a candidate direction from the discussion.\n- **Open** identifies a decision that still requires human review or proof.\n\nNothing labeled Proposed is an approved contract or plan. The\n[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority\nabove this proposal. In particular, V-002 (Work is optional integration),\nV-008 (domain augmentation), V-011 (small core), and V-012 (two unlike\nconsumers) constrain every idea below."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "source unit shorter than 40 characters",
    "targetUnit": {
      "unitKind": "heading",
      "level": 2,
      "title": "1. How To Read This Draft",
      "anchor": "1-how-to-read-this-draft",
      "githubAnchor": "1-how-to-read-this-draft",
      "stableAnchor": "h-dd4e48e4ed93",
      "startLine": 62,
      "endLine": 62,
      "textDigest": "8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a",
      "sample": "1. How To Read This Draft",
      "sectionPayloadDigest": "d588250529db4a9a31a2d1f7f760887b930a0bf8528c06568a4804551370f93b",
      "followingBlockDigest": "674611497bb6224341a363fbb8b91816122c3965af2272ce59719ff9d97d6226",
      "identityFingerprint": "3d7dccfba876216b6c20a9671ec2183bc45e22d0c6f793fde18e4b04c1e6d011",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
      ],
      "text": "## 1. How To Read This Draft",
      "sectionText": "## 1. How To Read This Draft\n\nThis document uses three labels:\n\n- **Observed** describes current repository behavior found by reading code\n  and accepted documents on 2026-09-02.\n- **Proposed** captures a candidate direction from the discussion.\n- **Open** identifies a decision that still requires human review or proof.\n\nNothing labeled Proposed is an approved contract or plan. The\n[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority\nabove this proposal. In particular, V-002 (Work is optional integration),\nV-008 (domain augmentation), V-011 (small core), and V-012 (two unlike\nconsumers) constrain every idea below."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_be4eaf1334073b4789d9465ca073ca10"
}
```

## Entry claim_b8e7045d6255883081d81c5e4113fc56

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "collection": "claims",
  "claimId": "claim_b8e7045d6255883081d81c5e4113fc56",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "before": {
    "claimId": "claim_b8e7045d6255883081d81c5e4113fc56",
    "sourceUnitDigest": "b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792080300559-b4112a2f@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-5 (lines 44–48) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-8 (lines 71–75); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "1. How To Read This Draft"
    ]
  },
  "currentDecision": {
    "claimId": "claim_b8e7045d6255883081d81c5e4113fc56",
    "sourceUnitDigest": "b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-5 (lines 44–48) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-8 (lines 71–75); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "1. How To Read This Draft"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "unitDigest": "fcf4c0c9ecb404c5203dcbd91d35e0c6d2cd824b99400f5453546eb6b729b53b",
    "identityFingerprint": "fcf4c0c9ecb404c5203dcbd91d35e0c6d2cd824b99400f5453546eb6b729b53b",
    "claimId": "claim_b8e7045d6255883081d81c5e4113fc56",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-5",
      "githubAnchor": "unheaded-block-5",
      "stableAnchor": "unheaded-block-5",
      "title": "Unheaded block 5",
      "startLine": 44,
      "endLine": 48,
      "textDigest": "b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c",
      "sample": "Nothing labeled Proposed is an approved contract or plan. The\n[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority\nabove this proposal. In particular,",
      "identityFingerprint": "fcf4c0c9ecb404c5203dcbd91d35e0c6d2cd824b99400f5453546eb6b729b53b",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "1. How To Read This Draft"
      ],
      "text": "Nothing labeled Proposed is an approved contract or plan. The\n[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority\nabove this proposal. In particular, V-002 (Work is optional integration),\nV-008 (domain augmentation), V-011 (small core), and V-012 (two unlike\nconsumers) constrain every idea below."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-8",
    "githubAnchor": "unheaded-block-8",
    "stableAnchor": "unheaded-block-8",
    "title": "Unheaded block 8",
    "startLine": 71,
    "endLine": 75,
    "textDigest": "b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c",
    "sample": "Nothing labeled Proposed is an approved contract or plan. The\n[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority\nabove this proposal. In particular,",
    "identityFingerprint": "fcf4c0c9ecb404c5203dcbd91d35e0c6d2cd824b99400f5453546eb6b729b53b",
    "ancestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "1. How To Read This Draft"
    ],
    "text": "Nothing labeled Proposed is an approved contract or plan. The\n[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority\nabove this proposal. In particular, V-002 (Work is optional integration),\nV-008 (domain augmentation), V-011 (small core), and V-012 (two unlike\nconsumers) constrain every idea below."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-8",
      "githubAnchor": "unheaded-block-8",
      "stableAnchor": "unheaded-block-8",
      "title": "Unheaded block 8",
      "startLine": 71,
      "endLine": 75,
      "textDigest": "b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c",
      "sample": "Nothing labeled Proposed is an approved contract or plan. The\n[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority\nabove this proposal. In particular,",
      "identityFingerprint": "fcf4c0c9ecb404c5203dcbd91d35e0c6d2cd824b99400f5453546eb6b729b53b",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "1. How To Read This Draft"
      ],
      "text": "Nothing labeled Proposed is an approved contract or plan. The\n[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority\nabove this proposal. In particular, V-002 (Work is optional integration),\nV-008 (domain augmentation), V-011 (small core), and V-012 (two unlike\nconsumers) constrain every idea below."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_b8e7045d6255883081d81c5e4113fc56"
}
```

## Entry claim_9baec27cadcd7ba898ca2c6a20e32d75

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "collection": "claims",
  "claimId": "claim_9baec27cadcd7ba898ca2c6a20e32d75",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "before": {
    "claimId": "claim_9baec27cadcd7ba898ca2c6a20e32d75",
    "sourceUnitDigest": "96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "3-high-level-adoption-plan",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#3-high-level-adoption-plan (lines 93–93) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#3-high-level-adoption-plan (lines 120–120); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
    ]
  },
  "currentDecision": {
    "claimId": "claim_9baec27cadcd7ba898ca2c6a20e32d75",
    "sourceUnitDigest": "96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "3-high-level-adoption-plan",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#3-high-level-adoption-plan (lines 93–93) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#3-high-level-adoption-plan (lines 120–120); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "unitDigest": "141bbfa40c36ab5852a932e198a2e3bca5faf9cd5edf6d9183a5f9a6fd49821d",
    "identityFingerprint": "588133e44a41d44154ad679dd691a6296908a3556511b936de5290fd7b776cce",
    "claimId": "claim_9baec27cadcd7ba898ca2c6a20e32d75",
    "sourceAnchor": "3-high-level-adoption-plan",
    "unitKind": "heading",
    "sourceUnitDigest": "96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "3. High-Level Adoption Plan",
      "anchor": "3-high-level-adoption-plan",
      "githubAnchor": "3-high-level-adoption-plan",
      "stableAnchor": "h-ce45437748f5",
      "startLine": 93,
      "endLine": 93,
      "textDigest": "96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b",
      "sample": "3. High-Level Adoption Plan",
      "sectionPayloadDigest": "8eaf659d60ff34c4446c739ebc4eac610e1c9df1f0959d2a377dab2773166dfe",
      "followingBlockDigest": "047ba1a0992ff3054a9ded7e13367132f4ee91a23bfbfdc0ff5e734e920f3f60",
      "identityFingerprint": "588133e44a41d44154ad679dd691a6296908a3556511b936de5290fd7b776cce",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
      ],
      "text": "## 3. High-Level Adoption Plan",
      "sectionText": "## 3. High-Level Adoption Plan\n\n**Proposed.** Step 10's goal is not to add one Agent Coordination feature.\nIts goal is to make Coding Domain a first-class fgOS domain that consumes the\nshared platform engines while keeping coding-specific authority in the coding\ndomain.\n\nTarget ownership shape:\n\n```txt\nWork Core\n  owns Work identity, status, stage, claim, ask/answer, return\n\nWork Driver\n  is platform core: a domain-aware workflow interpreter that chooses and runs\n  the next legal operation for a Work item from domain-owned declarations\n\nAgent Coordination\n  owns CoordinationSession, FlowDefinition, session topology, membership,\n  Assignment participation, Run/RunResult evidence ledger, recovery,\n  visibility, and bounded collaboration\n\nDispatch And Run Runtime\n  owns executor selection, invocation, Run recording, and generic result\n  evaluation\n\nCoding Domain\n  owns coding workflow declarations, Coding Domain Adapter implementations,\n  repository footprint, worktree/branch policy, merge and technical approval\n  policy, verification evidence, coding-specific skills, prompts, harnesses,\n  and evidence adapters\n```\n\nThe boundary rule is:\n\n```txt\nWork Driver Core is reusable platform core.\nIt interprets domain-declared workflows and operations.\n\nCoding Domain does not own a separate driver.\nIt owns coding workflow declarations and Coding Domain Adapter implementations\nconsumed through the generic Domain Adapter ports owned by Work Driver Core.\n\nAny existing runner, skill, or operation-choice code that hardcodes coding\nworkflow order, git/worktree/merge behavior, or verify semantics is migration\ndebt unless it sits behind a coding-owned adapter/facade.\n```\n\nThe same Work Driver Core should later be able to drive non-coding domains such\nas marketing or business workflows by loading their domain declarations and\nadapters. For example, a marketing domain may declare brief, audience research,\ndraft, review, and publish-ready stages; the driver should not know brand voice\nor channel formatting, only the declared operation contract.\n\nNaming rule:\n\n```txt\nDomain Adapter Port\n  = generic platform-facing port shape owned by Work Driver Core.\n\nCoding Domain Adapter\n  = Coding Domain's implementation of that port.\n\nMarketing Domain Adapter\n  = a future Marketing Domain implementation of that same kind of port.\n```\n\nWhen this Step 10 proposal classifies concrete logic such as `plan.md`,\n`fgw/<id>`, git diff/status, verify commands, merge/catch-up, AGENTS/skills\nmaterial, or coding-specific footprint rules, it should call that logic part of\nthe Coding Domain Adapter, not the generic Domain Adapter.\n\nThe adoption plan has eight layers:\n\n1. **Node-only component boundary and harness facade.** Inventory existing\n   coding harnesses, including the harnesses that touch Workspace Topology\n   concerns, classify authority, define stable Coding Domain Adapter facades\n   behind generic Domain Adapter ports, and add contract/forbidden-dependency\n   tests before any Rust migration or large physical move. This pass exists\n   because coding harnesses currently sit at the busiest boundary between\n   domain logic, Work Driver, Dispatch/Run, Agent Coordination, topology, and\n   packaging. If the pass finds a harness reading or writing workspace policy,\n   worker workspace state, claims, sessions, leases, hot history, projections,\n   or runtime command entries, it must resolve that harness behind\n   `TopologyContext` in the same slice or record a named blocker.\n2. **Coding Domain contract.** Define what Coding Domain owns and does not own,\n   including upstream product/design flow for ambiguous work, `cook` for\n   implementation-ready work, bugfix/debug flow, small-change/direct path,\n   review/validate/repair operations, and fan-out policy.\n3. **Workflow and operation model.** Make coding operations explicit:\n   required inputs, actor role, read-only versus mutating effect, expected\n   evidence, footprint/isolation needs, and allowed next Work transition.\n   Examples include `validate-plan`, `review-item`, `implement-item`,\n   `scout-blast-radius`, `resolve-question`, and `fix-verify-red`.\n4. **Coordination adoption.** Use CoordinationSession for operations that need\n   multi-actor collaboration, provenance, recovery, visibility control, or\n   evidence history. Start read-only with validation/review/research/scout;\n   open mutating sessions only after the topology and ADR-010 gates are met.\n5. **Topology and isolation integration.** Consume Workspace Topology for\n   worker workspace identity, branch-local config, runtime coordination root,\n   hot history placement, workspace installation capsules, footprint claims,\n   and leases. This is the gate between read-only Step 10 and mutating Step\n   10.\n6. **Evidence boundary.** Move coding-specific git/diff/verify interpretation\n   behind a Coding Domain evidence adapter, while Run Result Evaluator remains\n   the generic confidence owner.\n7. **Runner unification.** Collapse the current interactive skill loop and\n   headless runner loop into one Work Driver path. Skills become launchers;\n   headless and interactive differ by operator presence, not capability.\n8. **Domain packaging.** After the runtime shape is stable, package coding\n   skills/prompts/harnesses as runtime workshop material and project them into\n   host-visible files through the workspace projection ledger.\n\nDetailed plans derived from this section must preserve the high-level A0-G\nshape instead of replacing it with local task detail. If a detailed plan\nchanges the sequence, scope, or exit criteria of any A0-G step, it must update\nthis proposal and the project-level Architect Roadmap in the same review.\n\nThe current detailed plan for A0 is\n[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md).\n\nRecommended execution order:\n\n```txt\nA0. Inventory coding/topology harnesses and define Node-only Coding Domain Adapter facades\nA1. Lock Coding Domain contract and operation catalog\nB. Prove read-only Work-attached CoordinationSession adoption\nC. Build topology resolver and migrate legacy roots behind typed roots\nD. Add coding evidence adapter and occupancy/concurrency bridge\nE. Run the ADR-010 mutating live proof\nF. Unify runner/interactive execution through Work Driver\nG. Package Coding Domain material through distribution/projection\n```\n\nParallelizable work:\n\n| Lane | Can proceed now | Must wait for |\n|---|---|---|\n| Node-only Coding Domain boundary/facade | Yes, first. Inventory coding harnesses plus topology-touching harnesses, classify owners, define Coding Domain Adapter facades behind generic Domain Adapter ports, resolve any raw topology root usage behind `TopologyContext`, and add contract/forbidden-dependency tests. | Rust migration and physical moves wait for facade proof. |\n| Coding Domain contract | Yes, after or beside A0. | It should consume A0's ownership classification. |\n| Operation catalog | Yes, after or beside A0. | Mutating operation execution waits for topology. |\n| Read-only coordination bridge | Yes after the minimum facade used by `validate-plan` exists. | It must not change Work mutation, git, merge, or lifecycle authority. |\n| Workspace Topology | Yes, in parallel | Implementation migration waits for resolver shape and legacy import rules. |\n| Evidence adapter design | Yes | Final mutating semantics wait for topology and ADR-010 proof. |\n| Component boundary cleanup | Yes at document/index level | Physical moves wait for Step 10 proof and facade tests. |\n| Packaging/projection | Docs may proceed | Runtime implementation waits for topology resolver and domain materialization contract. |\n\nStep 10 planning must not treat Workspace Topology and Packaging/Distribution\nas later cleanup. Every Step 10 implementation slice must explicitly check\nwhether it touches any of these topology or distribution concerns and resolve\nthe related contract gap in the same slice or record a named blocker:\n\n- branch/workspace policy reads, especially `.fgos/config.json` and\n  `.fgos/distribution.json`;\n- worker workspace creation, workspace identity, and whether the worker needs\n  a local `.fgos/installation/` capsule;\n- claim/session/assignment/lease placement under `runtimeCoordinationRoot`;\n- hot Work history writes and legacy import from existing `.fgos/events*`;\n- footprint claims, worktree leases, and mutation fencing;\n- projection ownership for coding skills, prompts, harnesses, AGENTS.md blocks,\n  `.agents/skills`, and `.claude/skills`;\n- active runtime identity, state-schema compatibility, and whether a local\n  `fgos` command is running under the workspace activation binding;\n- package/runtime materialization of Coding Domain assets as release workshop\n  material, not source-tree side effects.\n\nThe A0 boundary/facade pass is the preferred place to handle topology-related\nharnesses. It should classify at least these harness families before Step 10B\nuses them: worktree and branch creation, merge/catch-up/approval, claim and\nruntime occupancy, goal-check and verification evidence, prompt/skill\nprojection, config/default/doctor repair, and any coding harness that shells\nout through a local `fgos` command path. A0 may leave behavior in its current\nfiles, but callers should begin depending on typed facades rather than direct\nraw paths.\n\nIf a slice is read-only, the check may conclude \"not touched\" for mutation,\nworktree, merge, and packaging materialization. If a slice creates or changes\nany worker, claim, event, projection, local command entry, or domain asset\nplacement behavior, it must consume `TopologyContext` and align with\n`runtime-identity-and-activation.md` rather than introducing another raw\n`.fgos` path."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "3. High-Level Adoption Plan",
    "anchor": "3-high-level-adoption-plan",
    "githubAnchor": "3-high-level-adoption-plan",
    "stableAnchor": "h-632ebb636dea",
    "startLine": 120,
    "endLine": 120,
    "textDigest": "96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b",
    "sample": "3. High-Level Adoption Plan",
    "sectionPayloadDigest": "8eaf659d60ff34c4446c739ebc4eac610e1c9df1f0959d2a377dab2773166dfe",
    "followingBlockDigest": "047ba1a0992ff3054a9ded7e13367132f4ee91a23bfbfdc0ff5e734e920f3f60",
    "identityFingerprint": "588133e44a41d44154ad679dd691a6296908a3556511b936de5290fd7b776cce",
    "ancestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
    ],
    "text": "## 3. High-Level Adoption Plan",
    "sectionText": "## 3. High-Level Adoption Plan\n\n**Proposed.** Step 10's goal is not to add one Agent Coordination feature.\nIts goal is to make Coding Domain a first-class fgOS domain that consumes the\nshared platform engines while keeping coding-specific authority in the coding\ndomain.\n\nTarget ownership shape:\n\n```txt\nWork Core\n  owns Work identity, status, stage, claim, ask/answer, return\n\nWork Driver\n  is platform core: a domain-aware workflow interpreter that chooses and runs\n  the next legal operation for a Work item from domain-owned declarations\n\nAgent Coordination\n  owns CoordinationSession, FlowDefinition, session topology, membership,\n  Assignment participation, Run/RunResult evidence ledger, recovery,\n  visibility, and bounded collaboration\n\nDispatch And Run Runtime\n  owns executor selection, invocation, Run recording, and generic result\n  evaluation\n\nCoding Domain\n  owns coding workflow declarations, Coding Domain Adapter implementations,\n  repository footprint, worktree/branch policy, merge and technical approval\n  policy, verification evidence, coding-specific skills, prompts, harnesses,\n  and evidence adapters\n```\n\nThe boundary rule is:\n\n```txt\nWork Driver Core is reusable platform core.\nIt interprets domain-declared workflows and operations.\n\nCoding Domain does not own a separate driver.\nIt owns coding workflow declarations and Coding Domain Adapter implementations\nconsumed through the generic Domain Adapter ports owned by Work Driver Core.\n\nAny existing runner, skill, or operation-choice code that hardcodes coding\nworkflow order, git/worktree/merge behavior, or verify semantics is migration\ndebt unless it sits behind a coding-owned adapter/facade.\n```\n\nThe same Work Driver Core should later be able to drive non-coding domains such\nas marketing or business workflows by loading their domain declarations and\nadapters. For example, a marketing domain may declare brief, audience research,\ndraft, review, and publish-ready stages; the driver should not know brand voice\nor channel formatting, only the declared operation contract.\n\nNaming rule:\n\n```txt\nDomain Adapter Port\n  = generic platform-facing port shape owned by Work Driver Core.\n\nCoding Domain Adapter\n  = Coding Domain's implementation of that port.\n\nMarketing Domain Adapter\n  = a future Marketing Domain implementation of that same kind of port.\n```\n\nWhen this Step 10 proposal classifies concrete logic such as `plan.md`,\n`fgw/<id>`, git diff/status, verify commands, merge/catch-up, AGENTS/skills\nmaterial, or coding-specific footprint rules, it should call that logic part of\nthe Coding Domain Adapter, not the generic Domain Adapter.\n\nThe adoption plan has eight layers:\n\n1. **Node-only component boundary and harness facade.** Inventory existing\n   coding harnesses, including the harnesses that touch Workspace Topology\n   concerns, classify authority, define stable Coding Domain Adapter facades\n   behind generic Domain Adapter ports, and add contract/forbidden-dependency\n   tests before any Rust migration or large physical move. This pass exists\n   because coding harnesses currently sit at the busiest boundary between\n   domain logic, Work Driver, Dispatch/Run, Agent Coordination, topology, and\n   packaging. If the pass finds a harness reading or writing workspace policy,\n   worker workspace state, claims, sessions, leases, hot history, projections,\n   or runtime command entries, it must resolve that harness behind\n   `TopologyContext` in the same slice or record a named blocker.\n2. **Coding Domain contract.** Define what Coding Domain owns and does not own,\n   including upstream product/design flow for ambiguous work, `cook` for\n   implementation-ready work, bugfix/debug flow, small-change/direct path,\n   review/validate/repair operations, and fan-out policy.\n3. **Workflow and operation model.** Make coding operations explicit:\n   required inputs, actor role, read-only versus mutating effect, expected\n   evidence, footprint/isolation needs, and allowed next Work transition.\n   Examples include `validate-plan`, `review-item`, `implement-item`,\n   `scout-blast-radius`, `resolve-question`, and `fix-verify-red`.\n4. **Coordination adoption.** Use CoordinationSession for operations that need\n   multi-actor collaboration, provenance, recovery, visibility control, or\n   evidence history. Start read-only with validation/review/research/scout;\n   open mutating sessions only after the topology and ADR-010 gates are met.\n5. **Topology and isolation integration.** Consume Workspace Topology for\n   worker workspace identity, branch-local config, runtime coordination root,\n   hot history placement, workspace installation capsules, footprint claims,\n   and leases. This is the gate between read-only Step 10 and mutating Step\n   10.\n6. **Evidence boundary.** Move coding-specific git/diff/verify interpretation\n   behind a Coding Domain evidence adapter, while Run Result Evaluator remains\n   the generic confidence owner.\n7. **Runner unification.** Collapse the current interactive skill loop and\n   headless runner loop into one Work Driver path. Skills become launchers;\n   headless and interactive differ by operator presence, not capability.\n8. **Domain packaging.** After the runtime shape is stable, package coding\n   skills/prompts/harnesses as runtime workshop material and project them into\n   host-visible files through the workspace projection ledger.\n\nDetailed plans derived from this section must preserve the high-level A0-G\nshape instead of replacing it with local task detail. If a detailed plan\nchanges the sequence, scope, or exit criteria of any A0-G step, it must update\nthis proposal and the project-level Architect Roadmap in the same review.\n\nThe current detailed plan for A0 is\n[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md).\n\nRecommended execution order:\n\n```txt\nA0. Inventory coding/topology harnesses and define Node-only Coding Domain Adapter facades\nA1. Lock Coding Domain contract and operation catalog\nB. Prove read-only Work-attached CoordinationSession adoption\nC. Build topology resolver and migrate legacy roots behind typed roots\nD. Add coding evidence adapter and occupancy/concurrency bridge\nE. Run the ADR-010 mutating live proof\nF. Unify runner/interactive execution through Work Driver\nG. Package Coding Domain material through distribution/projection\n```\n\nParallelizable work:\n\n| Lane | Can proceed now | Must wait for |\n|---|---|---|\n| Node-only Coding Domain boundary/facade | Yes, first. Inventory coding harnesses plus topology-touching harnesses, classify owners, define Coding Domain Adapter facades behind generic Domain Adapter ports, resolve any raw topology root usage behind `TopologyContext`, and add contract/forbidden-dependency tests. | Rust migration and physical moves wait for facade proof. |\n| Coding Domain contract | Yes, after or beside A0. | It should consume A0's ownership classification. |\n| Operation catalog | Yes, after or beside A0. | Mutating operation execution waits for topology. |\n| Read-only coordination bridge | Yes after the minimum facade used by `validate-plan` exists. | It must not change Work mutation, git, merge, or lifecycle authority. |\n| Workspace Topology | Yes, in parallel | Implementation migration waits for resolver shape and legacy import rules. |\n| Evidence adapter design | Yes | Final mutating semantics wait for topology and ADR-010 proof. |\n| Component boundary cleanup | Yes at document/index level | Physical moves wait for Step 10 proof and facade tests. |\n| Packaging/projection | Docs may proceed | Runtime implementation waits for topology resolver and domain materialization contract. |\n\nStep 10 planning must not treat Workspace Topology and Packaging/Distribution\nas later cleanup. Every Step 10 implementation slice must explicitly check\nwhether it touches any of these topology or distribution concerns and resolve\nthe related contract gap in the same slice or record a named blocker:\n\n- branch/workspace policy reads, especially `.fgos/config.json` and\n  `.fgos/distribution.json`;\n- worker workspace creation, workspace identity, and whether the worker needs\n  a local `.fgos/installation/` capsule;\n- claim/session/assignment/lease placement under `runtimeCoordinationRoot`;\n- hot Work history writes and legacy import from existing `.fgos/events*`;\n- footprint claims, worktree leases, and mutation fencing;\n- projection ownership for coding skills, prompts, harnesses, AGENTS.md blocks,\n  `.agents/skills`, and `.claude/skills`;\n- active runtime identity, state-schema compatibility, and whether a local\n  `fgos` command is running under the workspace activation binding;\n- package/runtime materialization of Coding Domain assets as release workshop\n  material, not source-tree side effects.\n\nThe A0 boundary/facade pass is the preferred place to handle topology-related\nharnesses. It should classify at least these harness families before Step 10B\nuses them: worktree and branch creation, merge/catch-up/approval, claim and\nruntime occupancy, goal-check and verification evidence, prompt/skill\nprojection, config/default/doctor repair, and any coding harness that shells\nout through a local `fgos` command path. A0 may leave behavior in its current\nfiles, but callers should begin depending on typed facades rather than direct\nraw paths.\n\nIf a slice is read-only, the check may conclude \"not touched\" for mutation,\nworktree, merge, and packaging materialization. If a slice creates or changes\nany worker, claim, event, projection, local command entry, or domain asset\nplacement behavior, it must consume `TopologyContext` and align with\n`runtime-identity-and-activation.md` rather than introducing another raw\n`.fgos` path."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "source unit shorter than 40 characters",
    "targetUnit": {
      "unitKind": "heading",
      "level": 2,
      "title": "3. High-Level Adoption Plan",
      "anchor": "3-high-level-adoption-plan",
      "githubAnchor": "3-high-level-adoption-plan",
      "stableAnchor": "h-632ebb636dea",
      "startLine": 120,
      "endLine": 120,
      "textDigest": "96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b",
      "sample": "3. High-Level Adoption Plan",
      "sectionPayloadDigest": "8eaf659d60ff34c4446c739ebc4eac610e1c9df1f0959d2a377dab2773166dfe",
      "followingBlockDigest": "047ba1a0992ff3054a9ded7e13367132f4ee91a23bfbfdc0ff5e734e920f3f60",
      "identityFingerprint": "588133e44a41d44154ad679dd691a6296908a3556511b936de5290fd7b776cce",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
      ],
      "text": "## 3. High-Level Adoption Plan",
      "sectionText": "## 3. High-Level Adoption Plan\n\n**Proposed.** Step 10's goal is not to add one Agent Coordination feature.\nIts goal is to make Coding Domain a first-class fgOS domain that consumes the\nshared platform engines while keeping coding-specific authority in the coding\ndomain.\n\nTarget ownership shape:\n\n```txt\nWork Core\n  owns Work identity, status, stage, claim, ask/answer, return\n\nWork Driver\n  is platform core: a domain-aware workflow interpreter that chooses and runs\n  the next legal operation for a Work item from domain-owned declarations\n\nAgent Coordination\n  owns CoordinationSession, FlowDefinition, session topology, membership,\n  Assignment participation, Run/RunResult evidence ledger, recovery,\n  visibility, and bounded collaboration\n\nDispatch And Run Runtime\n  owns executor selection, invocation, Run recording, and generic result\n  evaluation\n\nCoding Domain\n  owns coding workflow declarations, Coding Domain Adapter implementations,\n  repository footprint, worktree/branch policy, merge and technical approval\n  policy, verification evidence, coding-specific skills, prompts, harnesses,\n  and evidence adapters\n```\n\nThe boundary rule is:\n\n```txt\nWork Driver Core is reusable platform core.\nIt interprets domain-declared workflows and operations.\n\nCoding Domain does not own a separate driver.\nIt owns coding workflow declarations and Coding Domain Adapter implementations\nconsumed through the generic Domain Adapter ports owned by Work Driver Core.\n\nAny existing runner, skill, or operation-choice code that hardcodes coding\nworkflow order, git/worktree/merge behavior, or verify semantics is migration\ndebt unless it sits behind a coding-owned adapter/facade.\n```\n\nThe same Work Driver Core should later be able to drive non-coding domains such\nas marketing or business workflows by loading their domain declarations and\nadapters. For example, a marketing domain may declare brief, audience research,\ndraft, review, and publish-ready stages; the driver should not know brand voice\nor channel formatting, only the declared operation contract.\n\nNaming rule:\n\n```txt\nDomain Adapter Port\n  = generic platform-facing port shape owned by Work Driver Core.\n\nCoding Domain Adapter\n  = Coding Domain's implementation of that port.\n\nMarketing Domain Adapter\n  = a future Marketing Domain implementation of that same kind of port.\n```\n\nWhen this Step 10 proposal classifies concrete logic such as `plan.md`,\n`fgw/<id>`, git diff/status, verify commands, merge/catch-up, AGENTS/skills\nmaterial, or coding-specific footprint rules, it should call that logic part of\nthe Coding Domain Adapter, not the generic Domain Adapter.\n\nThe adoption plan has eight layers:\n\n1. **Node-only component boundary and harness facade.** Inventory existing\n   coding harnesses, including the harnesses that touch Workspace Topology\n   concerns, classify authority, define stable Coding Domain Adapter facades\n   behind generic Domain Adapter ports, and add contract/forbidden-dependency\n   tests before any Rust migration or large physical move. This pass exists\n   because coding harnesses currently sit at the busiest boundary between\n   domain logic, Work Driver, Dispatch/Run, Agent Coordination, topology, and\n   packaging. If the pass finds a harness reading or writing workspace policy,\n   worker workspace state, claims, sessions, leases, hot history, projections,\n   or runtime command entries, it must resolve that harness behind\n   `TopologyContext` in the same slice or record a named blocker.\n2. **Coding Domain contract.** Define what Coding Domain owns and does not own,\n   including upstream product/design flow for ambiguous work, `cook` for\n   implementation-ready work, bugfix/debug flow, small-change/direct path,\n   review/validate/repair operations, and fan-out policy.\n3. **Workflow and operation model.** Make coding operations explicit:\n   required inputs, actor role, read-only versus mutating effect, expected\n   evidence, footprint/isolation needs, and allowed next Work transition.\n   Examples include `validate-plan`, `review-item`, `implement-item`,\n   `scout-blast-radius`, `resolve-question`, and `fix-verify-red`.\n4. **Coordination adoption.** Use CoordinationSession for operations that need\n   multi-actor collaboration, provenance, recovery, visibility control, or\n   evidence history. Start read-only with validation/review/research/scout;\n   open mutating sessions only after the topology and ADR-010 gates are met.\n5. **Topology and isolation integration.** Consume Workspace Topology for\n   worker workspace identity, branch-local config, runtime coordination root,\n   hot history placement, workspace installation capsules, footprint claims,\n   and leases. This is the gate between read-only Step 10 and mutating Step\n   10.\n6. **Evidence boundary.** Move coding-specific git/diff/verify interpretation\n   behind a Coding Domain evidence adapter, while Run Result Evaluator remains\n   the generic confidence owner.\n7. **Runner unification.** Collapse the current interactive skill loop and\n   headless runner loop into one Work Driver path. Skills become launchers;\n   headless and interactive differ by operator presence, not capability.\n8. **Domain packaging.** After the runtime shape is stable, package coding\n   skills/prompts/harnesses as runtime workshop material and project them into\n   host-visible files through the workspace projection ledger.\n\nDetailed plans derived from this section must preserve the high-level A0-G\nshape instead of replacing it with local task detail. If a detailed plan\nchanges the sequence, scope, or exit criteria of any A0-G step, it must update\nthis proposal and the project-level Architect Roadmap in the same review.\n\nThe current detailed plan for A0 is\n[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md).\n\nRecommended execution order:\n\n```txt\nA0. Inventory coding/topology harnesses and define Node-only Coding Domain Adapter facades\nA1. Lock Coding Domain contract and operation catalog\nB. Prove read-only Work-attached CoordinationSession adoption\nC. Build topology resolver and migrate legacy roots behind typed roots\nD. Add coding evidence adapter and occupancy/concurrency bridge\nE. Run the ADR-010 mutating live proof\nF. Unify runner/interactive execution through Work Driver\nG. Package Coding Domain material through distribution/projection\n```\n\nParallelizable work:\n\n| Lane | Can proceed now | Must wait for |\n|---|---|---|\n| Node-only Coding Domain boundary/facade | Yes, first. Inventory coding harnesses plus topology-touching harnesses, classify owners, define Coding Domain Adapter facades behind generic Domain Adapter ports, resolve any raw topology root usage behind `TopologyContext`, and add contract/forbidden-dependency tests. | Rust migration and physical moves wait for facade proof. |\n| Coding Domain contract | Yes, after or beside A0. | It should consume A0's ownership classification. |\n| Operation catalog | Yes, after or beside A0. | Mutating operation execution waits for topology. |\n| Read-only coordination bridge | Yes after the minimum facade used by `validate-plan` exists. | It must not change Work mutation, git, merge, or lifecycle authority. |\n| Workspace Topology | Yes, in parallel | Implementation migration waits for resolver shape and legacy import rules. |\n| Evidence adapter design | Yes | Final mutating semantics wait for topology and ADR-010 proof. |\n| Component boundary cleanup | Yes at document/index level | Physical moves wait for Step 10 proof and facade tests. |\n| Packaging/projection | Docs may proceed | Runtime implementation waits for topology resolver and domain materialization contract. |\n\nStep 10 planning must not treat Workspace Topology and Packaging/Distribution\nas later cleanup. Every Step 10 implementation slice must explicitly check\nwhether it touches any of these topology or distribution concerns and resolve\nthe related contract gap in the same slice or record a named blocker:\n\n- branch/workspace policy reads, especially `.fgos/config.json` and\n  `.fgos/distribution.json`;\n- worker workspace creation, workspace identity, and whether the worker needs\n  a local `.fgos/installation/` capsule;\n- claim/session/assignment/lease placement under `runtimeCoordinationRoot`;\n- hot Work history writes and legacy import from existing `.fgos/events*`;\n- footprint claims, worktree leases, and mutation fencing;\n- projection ownership for coding skills, prompts, harnesses, AGENTS.md blocks,\n  `.agents/skills`, and `.claude/skills`;\n- active runtime identity, state-schema compatibility, and whether a local\n  `fgos` command is running under the workspace activation binding;\n- package/runtime materialization of Coding Domain assets as release workshop\n  material, not source-tree side effects.\n\nThe A0 boundary/facade pass is the preferred place to handle topology-related\nharnesses. It should classify at least these harness families before Step 10B\nuses them: worktree and branch creation, merge/catch-up/approval, claim and\nruntime occupancy, goal-check and verification evidence, prompt/skill\nprojection, config/default/doctor repair, and any coding harness that shells\nout through a local `fgos` command path. A0 may leave behavior in its current\nfiles, but callers should begin depending on typed facades rather than direct\nraw paths.\n\nIf a slice is read-only, the check may conclude \"not touched\" for mutation,\nworktree, merge, and packaging materialization. If a slice creates or changes\nany worker, claim, event, projection, local command entry, or domain asset\nplacement behavior, it must consume `TopologyContext` and align with\n`runtime-identity-and-activation.md` rather than introducing another raw\n`.fgos` path."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_9baec27cadcd7ba898ca2c6a20e32d75"
}
```

## Entry claim_c882f1126a89fd1bde5869084dd49d66

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "collection": "claims",
  "claimId": "claim_c882f1126a89fd1bde5869084dd49d66",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "before": {
    "claimId": "claim_c882f1126a89fd1bde5869084dd49d66",
    "sourceUnitDigest": "95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "unheaded-block-25",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-22 (lines 211–212) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-25 (lines 238–239); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "3. High-Level Adoption Plan"
    ]
  },
  "currentDecision": {
    "claimId": "claim_c882f1126a89fd1bde5869084dd49d66",
    "sourceUnitDigest": "95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "unheaded-block-25",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-22 (lines 211–212) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-25 (lines 238–239); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "3. High-Level Adoption Plan"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "unitDigest": "0d1b50a7f64138d868e69195cbbf512aa19a30590424b41e43e9bd1c8abbdce5",
    "identityFingerprint": "0d1b50a7f64138d868e69195cbbf512aa19a30590424b41e43e9bd1c8abbdce5",
    "claimId": "claim_c882f1126a89fd1bde5869084dd49d66",
    "sourceAnchor": "unheaded-block-22",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-22",
      "githubAnchor": "unheaded-block-22",
      "stableAnchor": "unheaded-block-22",
      "title": "Unheaded block 22",
      "startLine": 211,
      "endLine": 212,
      "textDigest": "95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca",
      "sample": "The current detailed plan for A0 is\n[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md).",
      "identityFingerprint": "0d1b50a7f64138d868e69195cbbf512aa19a30590424b41e43e9bd1c8abbdce5",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "3. High-Level Adoption Plan"
      ],
      "text": "The current detailed plan for A0 is\n[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-25",
    "githubAnchor": "unheaded-block-25",
    "stableAnchor": "unheaded-block-25",
    "title": "Unheaded block 25",
    "startLine": 238,
    "endLine": 239,
    "textDigest": "95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca",
    "sample": "The current detailed plan for A0 is\n[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md).",
    "identityFingerprint": "0d1b50a7f64138d868e69195cbbf512aa19a30590424b41e43e9bd1c8abbdce5",
    "ancestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "3. High-Level Adoption Plan"
    ],
    "text": "The current detailed plan for A0 is\n[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-25",
      "githubAnchor": "unheaded-block-25",
      "stableAnchor": "unheaded-block-25",
      "title": "Unheaded block 25",
      "startLine": 238,
      "endLine": 239,
      "textDigest": "95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca",
      "sample": "The current detailed plan for A0 is\n[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md).",
      "identityFingerprint": "0d1b50a7f64138d868e69195cbbf512aa19a30590424b41e43e9bd1c8abbdce5",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "3. High-Level Adoption Plan"
      ],
      "text": "The current detailed plan for A0 is\n[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_c882f1126a89fd1bde5869084dd49d66"
}
```

## Entry claim_4cf831a1488ff02a9d582c8e80acccef

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "collection": "claims",
  "claimId": "claim_4cf831a1488ff02a9d582c8e80acccef",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "before": {
    "claimId": "claim_4cf831a1488ff02a9d582c8e80acccef",
    "sourceUnitDigest": "1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "4-dependency-on-step-08-and-step-09",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#4-dependency-on-step-08-and-step-09 (lines 311–311) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#4-dependency-on-step-08-and-step-09 (lines 338–338); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
    ]
  },
  "currentDecision": {
    "claimId": "claim_4cf831a1488ff02a9d582c8e80acccef",
    "sourceUnitDigest": "1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "4-dependency-on-step-08-and-step-09",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#4-dependency-on-step-08-and-step-09 (lines 311–311) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#4-dependency-on-step-08-and-step-09 (lines 338–338); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "unitDigest": "033355846189209b5d8cfa4389e7a465e5d0f100f32f10480c328126e1e877f5",
    "identityFingerprint": "eb60cb8991961e1fa741c6fa81f757e73e18aad13199a65370dde38c4f47d9d7",
    "claimId": "claim_4cf831a1488ff02a9d582c8e80acccef",
    "sourceAnchor": "4-dependency-on-step-08-and-step-09",
    "unitKind": "heading",
    "sourceUnitDigest": "1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "4. Dependency On Step 08 And Step 09",
      "anchor": "4-dependency-on-step-08-and-step-09",
      "githubAnchor": "4-dependency-on-step-08-and-step-09",
      "stableAnchor": "h-f7a3d59a8ecd",
      "startLine": 311,
      "endLine": 311,
      "textDigest": "1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74",
      "sample": "4. Dependency On Step 08 And Step 09",
      "sectionPayloadDigest": "d716fe025bf6b458c121e626fe2079bae6107e51855d6d1ae8969a8a2a7f35c7",
      "followingBlockDigest": "d5480045272ecdc207037110fbbe9da125ea69c3bb7faf72387c2ef045632875",
      "identityFingerprint": "eb60cb8991961e1fa741c6fa81f757e73e18aad13199a65370dde38c4f47d9d7",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
      ],
      "text": "## 4. Dependency On Step 08 And Step 09",
      "sectionText": "## 4. Dependency On Step 08 And Step 09\n\n**Observed:** Step 08 has closed all 8 phases. The final Deferral Audit is now\nthe reconciliation source for what Step 08 deliberately delivered, deferred,\nor proved out of scope.\n\n**Observed:** Step 09 has closed its implemented slice. The accepted substrate\nfor Step 10 is the promoted CoordinationSession and FlowDefinition contracts,\nplus the implemented protocol/visibility/aggregation/deliberation/specialist\nslice they authorize. Step 09's broader deferred features remain preserved in\nthe architecture intent docs; Step 10 should not pull them into scope unless a\ncoding-domain proof actually needs one.\n\n**Proposed:** keep the authority map as a parallel architect-level\nprerequisite, not a child step of coding adoption. The\n[Component Authority Boundary Map](component-authority-boundary-map.md)\nclassifies ownership and forbidden dependencies before Step 10 implementation\nstarts. Mutating adoption remains blocked by the ADR-010 gate and depends on\nthe Step 08 proofs for crash recovery and concurrent-mutating-actor refusal.\n\n**Observed, explicitly out of Step 08 scope and therefore *not* delivered:**\n\n- consumer migration for the current Workflow runtime (the FlowDefinition\n  adapter is additive and read-only);\n- AdhocTask and hybrid planning materialization;\n- Work-attached mutating coordination;\n- domain worktree allocation, merge, or Work transition inside\n  `src/runner/coordination/**`."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Dependency On Step 08 And Step 09",
    "anchor": "4-dependency-on-step-08-and-step-09",
    "githubAnchor": "4-dependency-on-step-08-and-step-09",
    "stableAnchor": "h-6a36d11dbff7",
    "startLine": 338,
    "endLine": 338,
    "textDigest": "1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74",
    "sample": "4. Dependency On Step 08 And Step 09",
    "sectionPayloadDigest": "d716fe025bf6b458c121e626fe2079bae6107e51855d6d1ae8969a8a2a7f35c7",
    "followingBlockDigest": "d5480045272ecdc207037110fbbe9da125ea69c3bb7faf72387c2ef045632875",
    "identityFingerprint": "eb60cb8991961e1fa741c6fa81f757e73e18aad13199a65370dde38c4f47d9d7",
    "ancestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
    ],
    "text": "## 4. Dependency On Step 08 And Step 09",
    "sectionText": "## 4. Dependency On Step 08 And Step 09\n\n**Observed:** Step 08 has closed all 8 phases. The final Deferral Audit is now\nthe reconciliation source for what Step 08 deliberately delivered, deferred,\nor proved out of scope.\n\n**Observed:** Step 09 has closed its implemented slice. The accepted substrate\nfor Step 10 is the promoted CoordinationSession and FlowDefinition contracts,\nplus the implemented protocol/visibility/aggregation/deliberation/specialist\nslice they authorize. Step 09's broader deferred features remain preserved in\nthe architecture intent docs; Step 10 should not pull them into scope unless a\ncoding-domain proof actually needs one.\n\n**Proposed:** keep the authority map as a parallel architect-level\nprerequisite, not a child step of coding adoption. The\n[Component Authority Boundary Map](component-authority-boundary-map.md)\nclassifies ownership and forbidden dependencies before Step 10 implementation\nstarts. Mutating adoption remains blocked by the ADR-010 gate and depends on\nthe Step 08 proofs for crash recovery and concurrent-mutating-actor refusal.\n\n**Observed, explicitly out of Step 08 scope and therefore *not* delivered:**\n\n- consumer migration for the current Workflow runtime (the FlowDefinition\n  adapter is additive and read-only);\n- AdhocTask and hybrid planning materialization;\n- Work-attached mutating coordination;\n- domain worktree allocation, merge, or Work transition inside\n  `src/runner/coordination/**`."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "source unit shorter than 40 characters",
    "targetUnit": {
      "unitKind": "heading",
      "level": 2,
      "title": "4. Dependency On Step 08 And Step 09",
      "anchor": "4-dependency-on-step-08-and-step-09",
      "githubAnchor": "4-dependency-on-step-08-and-step-09",
      "stableAnchor": "h-6a36d11dbff7",
      "startLine": 338,
      "endLine": 338,
      "textDigest": "1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74",
      "sample": "4. Dependency On Step 08 And Step 09",
      "sectionPayloadDigest": "d716fe025bf6b458c121e626fe2079bae6107e51855d6d1ae8969a8a2a7f35c7",
      "followingBlockDigest": "d5480045272ecdc207037110fbbe9da125ea69c3bb7faf72387c2ef045632875",
      "identityFingerprint": "eb60cb8991961e1fa741c6fa81f757e73e18aad13199a65370dde38c4f47d9d7",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
      ],
      "text": "## 4. Dependency On Step 08 And Step 09",
      "sectionText": "## 4. Dependency On Step 08 And Step 09\n\n**Observed:** Step 08 has closed all 8 phases. The final Deferral Audit is now\nthe reconciliation source for what Step 08 deliberately delivered, deferred,\nor proved out of scope.\n\n**Observed:** Step 09 has closed its implemented slice. The accepted substrate\nfor Step 10 is the promoted CoordinationSession and FlowDefinition contracts,\nplus the implemented protocol/visibility/aggregation/deliberation/specialist\nslice they authorize. Step 09's broader deferred features remain preserved in\nthe architecture intent docs; Step 10 should not pull them into scope unless a\ncoding-domain proof actually needs one.\n\n**Proposed:** keep the authority map as a parallel architect-level\nprerequisite, not a child step of coding adoption. The\n[Component Authority Boundary Map](component-authority-boundary-map.md)\nclassifies ownership and forbidden dependencies before Step 10 implementation\nstarts. Mutating adoption remains blocked by the ADR-010 gate and depends on\nthe Step 08 proofs for crash recovery and concurrent-mutating-actor refusal.\n\n**Observed, explicitly out of Step 08 scope and therefore *not* delivered:**\n\n- consumer migration for the current Workflow runtime (the FlowDefinition\n  adapter is additive and read-only);\n- AdhocTask and hybrid planning materialization;\n- Work-attached mutating coordination;\n- domain worktree allocation, merge, or Work transition inside\n  `src/runner/coordination/**`."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_4cf831a1488ff02a9d582c8e80acccef"
}
```

## Entry claim_db1b9790987b9243caa0d47fa47fa3c3

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "collection": "claims",
  "claimId": "claim_db1b9790987b9243caa0d47fa47fa3c3",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "before": {
    "claimId": "claim_db1b9790987b9243caa0d47fa47fa3c3",
    "sourceUnitDigest": "84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-35 (lines 324–329) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-38 (lines 351–356); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "4. Dependency On Step 08 And Step 09"
    ]
  },
  "currentDecision": {
    "claimId": "claim_db1b9790987b9243caa0d47fa47fa3c3",
    "sourceUnitDigest": "84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-35 (lines 324–329) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-38 (lines 351–356); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "4. Dependency On Step 08 And Step 09"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "unitDigest": "e11d4b7542c07713f4db55a3948fda249176902e3180b5de7c8a2d4b7dcee8b0",
    "identityFingerprint": "e11d4b7542c07713f4db55a3948fda249176902e3180b5de7c8a2d4b7dcee8b0",
    "claimId": "claim_db1b9790987b9243caa0d47fa47fa3c3",
    "sourceAnchor": "unheaded-block-35",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-35",
      "githubAnchor": "unheaded-block-35",
      "stableAnchor": "unheaded-block-35",
      "title": "Unheaded block 35",
      "startLine": 324,
      "endLine": 329,
      "textDigest": "84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc",
      "sample": "**Proposed:** keep the authority map as a parallel architect-level\nprerequisite, not a child step of coding adoption. The\n[Component Authority Boundary Map](component-authority-bou",
      "identityFingerprint": "e11d4b7542c07713f4db55a3948fda249176902e3180b5de7c8a2d4b7dcee8b0",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "4. Dependency On Step 08 And Step 09"
      ],
      "text": "**Proposed:** keep the authority map as a parallel architect-level\nprerequisite, not a child step of coding adoption. The\n[Component Authority Boundary Map](component-authority-boundary-map.md)\nclassifies ownership and forbidden dependencies before Step 10 implementation\nstarts. Mutating adoption remains blocked by the ADR-010 gate and depends on\nthe Step 08 proofs for crash recovery and concurrent-mutating-actor refusal."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-38",
    "githubAnchor": "unheaded-block-38",
    "stableAnchor": "unheaded-block-38",
    "title": "Unheaded block 38",
    "startLine": 351,
    "endLine": 356,
    "textDigest": "84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc",
    "sample": "**Proposed:** keep the authority map as a parallel architect-level\nprerequisite, not a child step of coding adoption. The\n[Component Authority Boundary Map](component-authority-bou",
    "identityFingerprint": "e11d4b7542c07713f4db55a3948fda249176902e3180b5de7c8a2d4b7dcee8b0",
    "ancestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "4. Dependency On Step 08 And Step 09"
    ],
    "text": "**Proposed:** keep the authority map as a parallel architect-level\nprerequisite, not a child step of coding adoption. The\n[Component Authority Boundary Map](component-authority-boundary-map.md)\nclassifies ownership and forbidden dependencies before Step 10 implementation\nstarts. Mutating adoption remains blocked by the ADR-010 gate and depends on\nthe Step 08 proofs for crash recovery and concurrent-mutating-actor refusal."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-38",
      "githubAnchor": "unheaded-block-38",
      "stableAnchor": "unheaded-block-38",
      "title": "Unheaded block 38",
      "startLine": 351,
      "endLine": 356,
      "textDigest": "84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc",
      "sample": "**Proposed:** keep the authority map as a parallel architect-level\nprerequisite, not a child step of coding adoption. The\n[Component Authority Boundary Map](component-authority-bou",
      "identityFingerprint": "e11d4b7542c07713f4db55a3948fda249176902e3180b5de7c8a2d4b7dcee8b0",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "4. Dependency On Step 08 And Step 09"
      ],
      "text": "**Proposed:** keep the authority map as a parallel architect-level\nprerequisite, not a child step of coding adoption. The\n[Component Authority Boundary Map](component-authority-boundary-map.md)\nclassifies ownership and forbidden dependencies before Step 10 implementation\nstarts. Mutating adoption remains blocked by the ADR-010 gate and depends on\nthe Step 08 proofs for crash recovery and concurrent-mutating-actor refusal."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_db1b9790987b9243caa0d47fa47fa3c3"
}
```

## Entry claim_95bd9e63c50b41b3b511d948685c8f38

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "collection": "claims",
  "claimId": "claim_95bd9e63c50b41b3b511d948685c8f38",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "before": {
    "claimId": "claim_95bd9e63c50b41b3b511d948685c8f38",
    "sourceUnitDigest": "6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "91-boundary-map-input-shape",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#91-boundary-map-input-shape (lines 547–547) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#91-boundary-map-input-shape (lines 574–574); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "9. Candidate Step Sequence"
    ]
  },
  "currentDecision": {
    "claimId": "claim_95bd9e63c50b41b3b511d948685c8f38",
    "sourceUnitDigest": "6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "91-boundary-map-input-shape",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#91-boundary-map-input-shape (lines 547–547) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#91-boundary-map-input-shape (lines 574–574); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "9. Candidate Step Sequence"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "unitDigest": "542076489915c89cd21755eb2ee6f9075aa2ea5b13f09ade6fff00634b961565",
    "identityFingerprint": "d81e5ca9d0aefd60eff2a252492c28cea1db7a48423b5c1b76dee7255066e76f",
    "claimId": "claim_95bd9e63c50b41b3b511d948685c8f38",
    "sourceAnchor": "91-boundary-map-input-shape",
    "unitKind": "heading",
    "sourceUnitDigest": "6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 3,
      "title": "9.1 Boundary Map Input Shape",
      "anchor": "91-boundary-map-input-shape",
      "githubAnchor": "91-boundary-map-input-shape",
      "stableAnchor": "h-c69f7a403afc",
      "startLine": 547,
      "endLine": 547,
      "textDigest": "6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597",
      "sample": "9.1 Boundary Map Input Shape",
      "sectionPayloadDigest": "2e246252977ce4f153798f67cdbe07639e292ab1ea81fdabc17fc63fe6546640",
      "followingBlockDigest": "1c8535cb91e7d4f35ed3292739974607955ec292f73310b38daa0fe56a04cf58",
      "identityFingerprint": "d81e5ca9d0aefd60eff2a252492c28cea1db7a48423b5c1b76dee7255066e76f",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "9. Candidate Step Sequence"
      ],
      "text": "### 9.1 Boundary Map Input Shape",
      "sectionText": "### 9.1 Boundary Map Input Shape\n\nThe parallel Component Authority Boundary Map should produce ownership\ndocuments, not a file move and not accepted runtime authority. The minimum\nuseful output is:\n\n1. **Component, Bounded-Context, And Authority Map.** Records each component's\n   authority, state, ports, adapters, forbidden dependencies, and layer:\n   foundation, platform support, domain, integration, host/surface, or plugin.\n   Draft artifact:\n   [Component Authority Boundary Map](component-authority-boundary-map.md).\n2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names\n   which currently-coding-used modules are reusable foundation/platform\n   components versus Coding Domain Core.\n3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction\n   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:\n   thin app entrypoints stay thin; reusable authority-owning logic lives behind\n   package/component facades; existing paths remain until a later movement\n   slice has contract tests.\n4. **Migration constraint.** Physical layout must express the authority map, not\n   create it. Moving a module under `packages/domains/coding` only means coding\n   owns it if the accepted authority map says coding owns that behavior.\n\nCandidate Node layout vocabulary for that overlay:\n\n```txt\napps/\n  cli/                    # thin fgos / fgos-runner entrypoints, if moved later\n\npackages/\n  work-core/\n    work-lifecycle/       # Work state, status/stage, claim/return, Work verbs\n    work-driver/          # ready selection, operation choice, automation loop\n    runtime-occupancy/    # worker slots, checkout locks, resource pressure\n  agent-coordination/\n    agent-coordination/   # CoordinationSession, topology, team cognition\n    dispatch-execution/   # DispatchPlan, Run runtime, executor adapters\n    run-result-evaluator/ # evidence collection, confidence, RunResult\n  domain-registry/        # domain/workflow/task-spec loading and validation\n  domains/coding/         # Coding Domain Core + product/design, cook, bugfix, small-change policy\n  setup-doctor/           # config/default/check registration\n  host-surfaces/          # gateway/API/plugin/Herdr adapters\n  learning-docs/          # retrospective knowledge and docs registry\n```\n\nThis vocabulary is deliberately not a required tree for Step 10. It is the\nshape the Component Authority Boundary Map should draft and later accepted\nboundary documents should accept, revise, or reject.\n\n**Proposed non-goals for Step 10:**\n\n- no AdhocTask entity (see §6 consequence 3);\n- no Workflow-runtime migration onto FlowDefinition;\n- no Mission, AgentMessage, `purpose` routing, marketplace, telemetry\n  backend;\n- no merge/branch/Work-transition API inside `src/runner/coordination/**`\n  (ADR-010 §4 holds regardless of step 5's outcome);\n- no editing of ADR-007 or ADR-010 in place; new decisions get new ADRs.\n\n**Proposed cut rule if scope must shrink:** cut step 8 first, then split step\n7 into \"driver engine\" and \"fan-out onto driver\". Do not cut steps 3 and 4;\nthey are what keeps step 5 and step 7 from collapsing."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "9.1 Boundary Map Input Shape",
    "anchor": "91-boundary-map-input-shape",
    "githubAnchor": "91-boundary-map-input-shape",
    "stableAnchor": "h-00e8b132b5bc",
    "startLine": 574,
    "endLine": 574,
    "textDigest": "6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597",
    "sample": "9.1 Boundary Map Input Shape",
    "sectionPayloadDigest": "2e246252977ce4f153798f67cdbe07639e292ab1ea81fdabc17fc63fe6546640",
    "followingBlockDigest": "1c8535cb91e7d4f35ed3292739974607955ec292f73310b38daa0fe56a04cf58",
    "identityFingerprint": "d81e5ca9d0aefd60eff2a252492c28cea1db7a48423b5c1b76dee7255066e76f",
    "ancestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "9. Candidate Step Sequence"
    ],
    "text": "### 9.1 Boundary Map Input Shape",
    "sectionText": "### 9.1 Boundary Map Input Shape\n\nThe parallel Component Authority Boundary Map should produce ownership\ndocuments, not a file move and not accepted runtime authority. The minimum\nuseful output is:\n\n1. **Component, Bounded-Context, And Authority Map.** Records each component's\n   authority, state, ports, adapters, forbidden dependencies, and layer:\n   foundation, platform support, domain, integration, host/surface, or plugin.\n   Draft artifact:\n   [Component Authority Boundary Map](component-authority-boundary-map.md).\n2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names\n   which currently-coding-used modules are reusable foundation/platform\n   components versus Coding Domain Core.\n3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction\n   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:\n   thin app entrypoints stay thin; reusable authority-owning logic lives behind\n   package/component facades; existing paths remain until a later movement\n   slice has contract tests.\n4. **Migration constraint.** Physical layout must express the authority map, not\n   create it. Moving a module under `packages/domains/coding` only means coding\n   owns it if the accepted authority map says coding owns that behavior.\n\nCandidate Node layout vocabulary for that overlay:\n\n```txt\napps/\n  cli/                    # thin fgos / fgos-runner entrypoints, if moved later\n\npackages/\n  work-core/\n    work-lifecycle/       # Work state, status/stage, claim/return, Work verbs\n    work-driver/          # ready selection, operation choice, automation loop\n    runtime-occupancy/    # worker slots, checkout locks, resource pressure\n  agent-coordination/\n    agent-coordination/   # CoordinationSession, topology, team cognition\n    dispatch-execution/   # DispatchPlan, Run runtime, executor adapters\n    run-result-evaluator/ # evidence collection, confidence, RunResult\n  domain-registry/        # domain/workflow/task-spec loading and validation\n  domains/coding/         # Coding Domain Core + product/design, cook, bugfix, small-change policy\n  setup-doctor/           # config/default/check registration\n  host-surfaces/          # gateway/API/plugin/Herdr adapters\n  learning-docs/          # retrospective knowledge and docs registry\n```\n\nThis vocabulary is deliberately not a required tree for Step 10. It is the\nshape the Component Authority Boundary Map should draft and later accepted\nboundary documents should accept, revise, or reject.\n\n**Proposed non-goals for Step 10:**\n\n- no AdhocTask entity (see §6 consequence 3);\n- no Workflow-runtime migration onto FlowDefinition;\n- no Mission, AgentMessage, `purpose` routing, marketplace, telemetry\n  backend;\n- no merge/branch/Work-transition API inside `src/runner/coordination/**`\n  (ADR-010 §4 holds regardless of step 5's outcome);\n- no editing of ADR-007 or ADR-010 in place; new decisions get new ADRs.\n\n**Proposed cut rule if scope must shrink:** cut step 8 first, then split step\n7 into \"driver engine\" and \"fan-out onto driver\". Do not cut steps 3 and 4;\nthey are what keeps step 5 and step 7 from collapsing."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "source unit shorter than 40 characters",
    "targetUnit": {
      "unitKind": "heading",
      "level": 3,
      "title": "9.1 Boundary Map Input Shape",
      "anchor": "91-boundary-map-input-shape",
      "githubAnchor": "91-boundary-map-input-shape",
      "stableAnchor": "h-00e8b132b5bc",
      "startLine": 574,
      "endLine": 574,
      "textDigest": "6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597",
      "sample": "9.1 Boundary Map Input Shape",
      "sectionPayloadDigest": "2e246252977ce4f153798f67cdbe07639e292ab1ea81fdabc17fc63fe6546640",
      "followingBlockDigest": "1c8535cb91e7d4f35ed3292739974607955ec292f73310b38daa0fe56a04cf58",
      "identityFingerprint": "d81e5ca9d0aefd60eff2a252492c28cea1db7a48423b5c1b76dee7255066e76f",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "9. Candidate Step Sequence"
      ],
      "text": "### 9.1 Boundary Map Input Shape",
      "sectionText": "### 9.1 Boundary Map Input Shape\n\nThe parallel Component Authority Boundary Map should produce ownership\ndocuments, not a file move and not accepted runtime authority. The minimum\nuseful output is:\n\n1. **Component, Bounded-Context, And Authority Map.** Records each component's\n   authority, state, ports, adapters, forbidden dependencies, and layer:\n   foundation, platform support, domain, integration, host/surface, or plugin.\n   Draft artifact:\n   [Component Authority Boundary Map](component-authority-boundary-map.md).\n2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names\n   which currently-coding-used modules are reusable foundation/platform\n   components versus Coding Domain Core.\n3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction\n   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:\n   thin app entrypoints stay thin; reusable authority-owning logic lives behind\n   package/component facades; existing paths remain until a later movement\n   slice has contract tests.\n4. **Migration constraint.** Physical layout must express the authority map, not\n   create it. Moving a module under `packages/domains/coding` only means coding\n   owns it if the accepted authority map says coding owns that behavior.\n\nCandidate Node layout vocabulary for that overlay:\n\n```txt\napps/\n  cli/                    # thin fgos / fgos-runner entrypoints, if moved later\n\npackages/\n  work-core/\n    work-lifecycle/       # Work state, status/stage, claim/return, Work verbs\n    work-driver/          # ready selection, operation choice, automation loop\n    runtime-occupancy/    # worker slots, checkout locks, resource pressure\n  agent-coordination/\n    agent-coordination/   # CoordinationSession, topology, team cognition\n    dispatch-execution/   # DispatchPlan, Run runtime, executor adapters\n    run-result-evaluator/ # evidence collection, confidence, RunResult\n  domain-registry/        # domain/workflow/task-spec loading and validation\n  domains/coding/         # Coding Domain Core + product/design, cook, bugfix, small-change policy\n  setup-doctor/           # config/default/check registration\n  host-surfaces/          # gateway/API/plugin/Herdr adapters\n  learning-docs/          # retrospective knowledge and docs registry\n```\n\nThis vocabulary is deliberately not a required tree for Step 10. It is the\nshape the Component Authority Boundary Map should draft and later accepted\nboundary documents should accept, revise, or reject.\n\n**Proposed non-goals for Step 10:**\n\n- no AdhocTask entity (see §6 consequence 3);\n- no Workflow-runtime migration onto FlowDefinition;\n- no Mission, AgentMessage, `purpose` routing, marketplace, telemetry\n  backend;\n- no merge/branch/Work-transition API inside `src/runner/coordination/**`\n  (ADR-010 §4 holds regardless of step 5's outcome);\n- no editing of ADR-007 or ADR-010 in place; new decisions get new ADRs.\n\n**Proposed cut rule if scope must shrink:** cut step 8 first, then split step\n7 into \"driver engine\" and \"fan-out onto driver\". Do not cut steps 3 and 4;\nthey are what keeps step 5 and step 7 from collapsing."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_95bd9e63c50b41b3b511d948685c8f38"
}
```

## Entry claim_78e55538d050b196b46032da6b57fa9d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "collection": "claims",
  "claimId": "claim_78e55538d050b196b46032da6b57fa9d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-19-step-10-coding-domain-adoption.json",
  "before": {
    "claimId": "claim_78e55538d050b196b46032da6b57fa9d",
    "sourceUnitDigest": "8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-62 (lines 553–568) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-65 (lines 580–595); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "9. Candidate Step Sequence",
      "9.1 Boundary Map Input Shape"
    ]
  },
  "currentDecision": {
    "claimId": "claim_78e55538d050b196b46032da6b57fa9d",
    "sourceUnitDigest": "8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680",
    "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-62 (lines 553–568) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-65 (lines 580–595); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680",
    "targetAncestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "9. Candidate Step Sequence",
      "9.1 Boundary Map Input Shape"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "unitDigest": "e6461ed19cc41652884d78104ea0a59531f3eb32e5409731d57c545c6f91a493",
    "identityFingerprint": "e6461ed19cc41652884d78104ea0a59531f3eb32e5409731d57c545c6f91a493",
    "claimId": "claim_78e55538d050b196b46032da6b57fa9d",
    "sourceAnchor": "unheaded-block-62",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-62",
      "githubAnchor": "unheaded-block-62",
      "stableAnchor": "unheaded-block-62",
      "title": "Unheaded block 62",
      "startLine": 553,
      "endLine": 568,
      "textDigest": "8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680",
      "sample": "1. **Component, Bounded-Context, And Authority Map.** Records each component's\n   authority, state, ports, adapters, forbidden dependencies, and layer:\n   foundation, platform supp",
      "identityFingerprint": "e6461ed19cc41652884d78104ea0a59531f3eb32e5409731d57c545c6f91a493",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "9. Candidate Step Sequence",
        "9.1 Boundary Map Input Shape"
      ],
      "text": "1. **Component, Bounded-Context, And Authority Map.** Records each component's\n   authority, state, ports, adapters, forbidden dependencies, and layer:\n   foundation, platform support, domain, integration, host/surface, or plugin.\n   Draft artifact:\n   [Component Authority Boundary Map](component-authority-boundary-map.md).\n2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names\n   which currently-coding-used modules are reusable foundation/platform\n   components versus Coding Domain Core.\n3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction\n   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:\n   thin app entrypoints stay thin; reusable authority-owning logic lives behind\n   package/component facades; existing paths remain until a later movement\n   slice has contract tests.\n4. **Migration constraint.** Physical layout must express the authority map, not\n   create it. Moving a module under `packages/domains/coding` only means coding\n   owns it if the accepted authority map says coding owns that behavior."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-65",
    "githubAnchor": "unheaded-block-65",
    "stableAnchor": "unheaded-block-65",
    "title": "Unheaded block 65",
    "startLine": 580,
    "endLine": 595,
    "textDigest": "8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680",
    "sample": "1. **Component, Bounded-Context, And Authority Map.** Records each component's\n   authority, state, ports, adapters, forbidden dependencies, and layer:\n   foundation, platform supp",
    "identityFingerprint": "e6461ed19cc41652884d78104ea0a59531f3eb32e5409731d57c545c6f91a493",
    "ancestry": [
      "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
      "9. Candidate Step Sequence",
      "9.1 Boundary Map Input Shape"
    ],
    "text": "1. **Component, Bounded-Context, And Authority Map.** Records each component's\n   authority, state, ports, adapters, forbidden dependencies, and layer:\n   foundation, platform support, domain, integration, host/surface, or plugin.\n   Draft artifact:\n   [Component Authority Boundary Map](component-authority-boundary-map.md).\n2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names\n   which currently-coding-used modules are reusable foundation/platform\n   components versus Coding Domain Core.\n3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction\n   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:\n   thin app entrypoints stay thin; reusable authority-owning logic lives behind\n   package/component facades; existing paths remain until a later movement\n   slice has contract tests.\n4. **Migration constraint.** Physical layout must express the authority map, not\n   create it. Moving a module under `packages/domains/coding` only means coding\n   owns it if the accepted authority map says coding owns that behavior."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-65",
      "githubAnchor": "unheaded-block-65",
      "stableAnchor": "unheaded-block-65",
      "title": "Unheaded block 65",
      "startLine": 580,
      "endLine": 595,
      "textDigest": "8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680",
      "sample": "1. **Component, Bounded-Context, And Authority Map.** Records each component's\n   authority, state, ports, adapters, forbidden dependencies, and layer:\n   foundation, platform supp",
      "identityFingerprint": "e6461ed19cc41652884d78104ea0a59531f3eb32e5409731d57c545c6f91a493",
      "ancestry": [
        "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
        "9. Candidate Step Sequence",
        "9.1 Boundary Map Input Shape"
      ],
      "text": "1. **Component, Bounded-Context, And Authority Map.** Records each component's\n   authority, state, ports, adapters, forbidden dependencies, and layer:\n   foundation, platform support, domain, integration, host/surface, or plugin.\n   Draft artifact:\n   [Component Authority Boundary Map](component-authority-boundary-map.md).\n2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names\n   which currently-coding-used modules are reusable foundation/platform\n   components versus Coding Domain Core.\n3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction\n   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:\n   thin app entrypoints stay thin; reusable authority-owning logic lives behind\n   package/component facades; existing paths remain until a later movement\n   slice has contract tests.\n4. **Migration constraint.** Physical layout must express the authority map, not\n   create it. Moving a module under `packages/domains/coding` only means coding\n   owns it if the accepted authority map says coding owns that behavior."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_78e55538d050b196b46032da6b57fa9d"
}
```

## Entry claim_427e36a559f714ab23628142cec0c7aa

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json",
  "collection": "claims",
  "claimId": "claim_427e36a559f714ab23628142cec0c7aa",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json",
  "before": {
    "claimId": "claim_427e36a559f714ab23628142cec0c7aa",
    "sourceUnitDigest": "011ff1ead4b5626955fb4c368e23c5c0e43dea44b10d06bf5ab9b9ac30631b24",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792080300559-b4112a2f@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "e9394c246cbe0e27e30ac12ce4b84e8fde484d51f3e4faff3b167e77fb80f786",
    "targetAncestry": []
  },
  "currentDecision": {
    "claimId": "claim_427e36a559f714ab23628142cec0c7aa",
    "sourceUnitDigest": "011ff1ead4b5626955fb4c368e23c5c0e43dea44b10d06bf5ab9b9ac30631b24",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:1008 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. Final L10-18/nit author correction disclosed in step10-review-final-target-bindings.json; current target binding pending independent re-review.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "1de89cd93411550ab19ca6146e4b61cf288419a4490f70c29f5082900ee797d4",
    "targetAncestry": []
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "unitDigest": "8e68e6d15ad65a1b8a251d38e298ae22610d413027df91792d849937450468e3",
    "identityFingerprint": "f414248f51964da8efea096314ce4c80350011b67cc64c45fbb7fdd40eaa46a2",
    "claimId": "claim_427e36a559f714ab23628142cec0c7aa",
    "sourceAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "unitKind": "heading",
    "sourceUnitDigest": "011ff1ead4b5626955fb4c368e23c5c0e43dea44b10d06bf5ab9b9ac30631b24",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 1,
      "title": "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
      "anchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
      "githubAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
      "stableAnchor": "h-93a28848ad6c",
      "startLine": 1,
      "endLine": 1,
      "textDigest": "011ff1ead4b5626955fb4c368e23c5c0e43dea44b10d06bf5ab9b9ac30631b24",
      "sample": "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
      "sectionPayloadDigest": "0bfc25e7ce21a48a9953ba672b5d331390c87efa1489a5672baeef0c2b670b63",
      "followingBlockDigest": "46753d58e2bcfaaafb4401c27c9750ec8bbb6e4a437792ad3574abd498e459f9",
      "identityFingerprint": "f414248f51964da8efea096314ce4c80350011b67cc64c45fbb7fdd40eaa46a2",
      "ancestry": [],
      "text": "# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
      "sectionText": "# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên\n\nDocument type: Proposal (investigation, lượt conceptual đầu — read-only)\nDesign status: Discussion\nImplementation: Existing `herdr-spawn` adapter (family A bên dưới); không có source nào được sửa trong lượt này\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; reconstruct hiện trạng + failure modes + boundary + conceptual design cho visibility/contact của mechanism interactive\nState class: State\n\nRelated: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),\n[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),\n[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),\n[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).\n\nNhãn chứng cứ dùng trong tài liệu: **native proven** (code + test có trong repo, chạy được), **native observed but incomplete** (code có, hành vi chỉ đúng một phần hoặc chưa test), **prototype-only**, **unproven** (chỉ là prose/giả định), **unsafe** (đã đo là gây hại), **upstream-proven** (beegog v2.33.2 đã đo và ship, chưa chạy trong fgOS).\n\n---"
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 1,
    "title": "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "anchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "githubAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "stableAnchor": "h-93a28848ad6c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1de89cd93411550ab19ca6146e4b61cf288419a4490f70c29f5082900ee797d4",
    "sample": "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "sectionPayloadDigest": "3d9d96a1abe2b5e36451832d7ac2d14d7523af0057512dcaf9e864d4be270d24",
    "followingBlockDigest": "0978630f14116d4e4f6ef49ecef9de5bc02e4823b4851f1ef2551286e7497ff9",
    "identityFingerprint": "a0a7f57ec4e20155d08f6be67c461672933c326cb916de6cdc513e4f5309b028",
    "ancestry": [],
    "text": "# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "sectionText": "# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 0669c4440662d98e207e676b76eb0ba70387be44\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate design evidence cited by docs/specs/runner.md:1008 RUL40, sections 3.3, 4 and 14 H1. Source transport line references and proposed recommendations are preserved as dated text. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../architect/proposals/visibility-and-interactive-contact-herdr-spawn.md).\n\n\nDocument type: Proposal (investigation, lượt conceptual đầu — read-only)\nDesign status: Discussion\nImplementation: Existing `herdr-spawn` adapter (family A bên dưới); không có source nào được sửa trong lượt này\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; reconstruct hiện trạng + failure modes + boundary + conceptual design cho visibility/contact của mechanism interactive\nState class: State\n\nRelated: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),\n[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),\n[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),\n[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).\n\nNhãn chứng cứ dùng trong tài liệu: **native proven** (code + test có trong repo, chạy được), **native observed but incomplete** (code có, hành vi chỉ đúng một phần hoặc chưa test), **prototype-only**, **unproven** (chỉ là prose/giả định), **unsafe** (đã đo là gây hại), **upstream-proven** (beegog v2.33.2 đã đo và ship, chưa chạy trong fgOS).\n\n---"
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_427e36a559f714ab23628142cec0c7aa"
}
```

## Entry claim_7765c8384841109f54c726219b338219

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json",
  "collection": "claims",
  "claimId": "claim_7765c8384841109f54c726219b338219",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json",
  "before": {
    "claimId": "claim_7765c8384841109f54c726219b338219",
    "sourceUnitDigest": "96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792080300559-b4112a2f@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-2 (lines 10–15) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-5 (lines 34–39); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1",
    "targetAncestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
    ]
  },
  "currentDecision": {
    "claimId": "claim_7765c8384841109f54c726219b338219",
    "sourceUnitDigest": "96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:1008 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-2 (lines 10–15) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-5 (lines 34–39); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1",
    "targetAncestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "unitDigest": "6b3798486bfa528cc02fb86e665e383bcb626b86d56395c78646ccaac78ba910",
    "identityFingerprint": "6b3798486bfa528cc02fb86e665e383bcb626b86d56395c78646ccaac78ba910",
    "claimId": "claim_7765c8384841109f54c726219b338219",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-2",
      "githubAnchor": "unheaded-block-2",
      "stableAnchor": "unheaded-block-2",
      "title": "Unheaded block 2",
      "startLine": 10,
      "endLine": 15,
      "textDigest": "96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1",
      "sample": "Related: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),\n[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),",
      "identityFingerprint": "6b3798486bfa528cc02fb86e665e383bcb626b86d56395c78646ccaac78ba910",
      "ancestry": [
        "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
      ],
      "text": "Related: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),\n[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),\n[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),\n[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 34,
    "endLine": 39,
    "textDigest": "96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1",
    "sample": "Related: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),\n[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),",
    "identityFingerprint": "6b3798486bfa528cc02fb86e665e383bcb626b86d56395c78646ccaac78ba910",
    "ancestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
    ],
    "text": "Related: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),\n[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),\n[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),\n[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-5",
      "githubAnchor": "unheaded-block-5",
      "stableAnchor": "unheaded-block-5",
      "title": "Unheaded block 5",
      "startLine": 34,
      "endLine": 39,
      "textDigest": "96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1",
      "sample": "Related: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),\n[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),",
      "identityFingerprint": "6b3798486bfa528cc02fb86e665e383bcb626b86d56395c78646ccaac78ba910",
      "ancestry": [
        "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
      ],
      "text": "Related: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),\n[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),\n[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),\n[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_7765c8384841109f54c726219b338219"
}
```

## Entry claim_ff1b02161c275824a631c743b5694875

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json",
  "collection": "claims",
  "claimId": "claim_ff1b02161c275824a631c743b5694875",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json",
  "before": {
    "claimId": "claim_ff1b02161c275824a631c743b5694875",
    "sourceUnitDigest": "00e6c7dfdba65c3d4cd3e2a2f8592d83a52d5a70d1cb65d0d4ce87e99be86b00",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent (lines 483–483) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent (lines 507–507); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "00e6c7dfdba65c3d4cd3e2a2f8592d83a52d5a70d1cb65d0d4ce87e99be86b00",
    "targetAncestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
      "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)"
    ]
  },
  "currentDecision": {
    "claimId": "claim_ff1b02161c275824a631c743b5694875",
    "sourceUnitDigest": "00e6c7dfdba65c3d4cd3e2a2f8592d83a52d5a70d1cb65d0d4ce87e99be86b00",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:1008 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent (lines 483–483) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent (lines 507–507); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "00e6c7dfdba65c3d4cd3e2a2f8592d83a52d5a70d1cb65d0d4ce87e99be86b00",
    "targetAncestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
      "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "unitDigest": "fc19f1c6f37d2245e0f9e998d1608da0fb45ebeb54f23cbe268a41c1fd6afd7d",
    "identityFingerprint": "849e6b986a0fe4193c985a67d87dd07f5e92a4ed80757d1a012e06360497319c",
    "claimId": "claim_ff1b02161c275824a631c743b5694875",
    "sourceAnchor": "12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent",
    "unitKind": "heading",
    "sourceUnitDigest": "00e6c7dfdba65c3d4cd3e2a2f8592d83a52d5a70d1cb65d0d4ce87e99be86b00",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 3,
      "title": "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)",
      "anchor": "12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent",
      "githubAnchor": "12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent",
      "stableAnchor": "h-83bd0492dc26",
      "startLine": 483,
      "endLine": 483,
      "textDigest": "00e6c7dfdba65c3d4cd3e2a2f8592d83a52d5a70d1cb65d0d4ce87e99be86b00",
      "sample": "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)",
      "sectionPayloadDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
      "followingBlockDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
      "identityFingerprint": "849e6b986a0fe4193c985a67d87dd07f5e92a4ed80757d1a012e06360497319c",
      "ancestry": [
        "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
        "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)"
      ],
      "text": "### 12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)",
      "sectionText": "### 12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)\n\n| Probe | Kết quả đo | Hệ quả thiết kế |\n|---|---|---|\n| **P7 — cô lập socket** | `tab create --env HERDR_PANE_ID= --env HERDR_SOCKET_PATH= --env HERDR_ENV=` **không** xoá được: herdr inject lại `HERDR_*` của chính pane (pane id mới, socket path) đè lên `--env`. Tệ hơn: `env -i PATH HOME herdr pane list` (không có biến herdr nào) vẫn liệt kê **toàn bộ pane của người dùng** kèm `agent_session` id — socket nằm ở `~/.config/herdr/herdr.sock` (mode 0600, cùng user). | Không cô lập được bằng env. Chỉ ba cách: (a) worker chạy với **HOME riêng** (trùng với private-scratch mà P00.1 đã đòi cho bwrap → một giải pháp giải hai bài), (b) user OS riêng, (c) herdr `--session` riêng cho worker (socket khác; chưa probe vì cần TUI/attach). **H5 cập nhật:** default = (a). Cho tới khi có (a), herdr-spawn phải ghi `unsafe: worker-can-drive-cockpit` trong capability profile. |\n| **P5-lite — descendant sau `pane close`** | Foreground `sleep 733` bị kill khi đóng pane; `setsid sleep 731 &` **sống sót** sau `pane close` (phải kill tay bằng pid). | `pane close` ≠ cancel. Cancel thật cần process-group/`setsid` tracking ngoài herdr, hoặc chấp nhận `cancelled-with-orphans` có type + sweep. Đồng thời cảnh báo: `pkill -f` theo pattern lệnh là nguy hiểm (probe này tự giết shell của chính nó vì pattern khớp command line cha). |\n| **Boot race — với `pane run`** | `pane run` ngay sau `tab create`: hai lệnh được **gõ vào pane nhưng không chạy** (shell còn đang boot `.zshrc`); `pane process-info` báo `foreground_processes` khác rỗng suốt ~21 s. Sau khi shell rảnh, cùng lệnh chạy bình thường. | Đây là lỗi của **`pane run`**, không phải của herdr nói chung — xem dòng dưới. Adapter hiện tại dùng `pane run` để khởi động agent nên dính. |\n| **`agent start` HẤP THỤ boot race** (probe bổ sung, câu hỏi của người dùng) | Tạo tab lúc `17:12:34.197`, gọi `agent start fgosprobe --kind claude --pane <p> --timeout 40000` **ngay lập tức**: herdr gõ `claude --dangerously-skip-permissions` vào pane và tiến trình chạy thật (`process-info` xác nhận pid 1682022, argv đúng). Không mất keystroke. | **Bỏ hẳn `pane run` khỏi đường khởi động.** §8.2 không cần tự làm shell-readiness gate nữa — `agent start` đã làm. Đây là bằng chứng mạnh cho Family B và cho H1 (re-scope RUL40 mở đúng cái cửa này). |\n| **`agent start` trả typed failure, không treo** | Trả về sau **3928 ms** với `agent_not_ready` + `agent_status: blocked` + `launch_pending: true` (claude hiện trust dialog cho `/tmp`), không chờ hết 40 s, không báo thành công giả. | Đúng readiness handshake §8.2: ready / `agent_not_ready` / `blocked`, mỗi cái có lý do. |\n| **`agent explain` giải thích được quyết định detect** | Trả `rule: live_blocked_form (region=after_last_horizontal_rule priority=980)`, `manifest: remote:~/.local/state/herdr/agent-detection/remote/claude.toml 2026.08.31.1`, kèm evidence nguyên văn đoạn màn hình. | Detect là manifest-driven, có version, giải thích được — khác hẳn regex tự chế. Nhưng manifest **fetch từ remote và có version** → là mặt drift phải pin/probe (`herdr server update-agent-manifests`). |\n| ~~**Cảnh báo phát sinh: `--kind claude` tự thêm `--dangerously-skip-permissions`**~~ **SAI, đã bác 2026-09-06** | Quan sát ban đầu chỉ thấy cờ trong `terminal_title` và `process-info.argv` rồi **suy đoán** là herdr thêm. Đo lại bằng ba lần `agent start` trong một session cô lập, chỉ đổi tham số đuôi: không tham số ra `claude` trần, `-- --model haiku` ra đúng thế, cờ chỉ xuất hiện khi tự truyền. **herdr không bao giờ thêm cờ này.** Nguồn thật là `~/.zshrc:148` `alias claude='command claude --dangerously-skip-permissions'` của người vận hành, cộng `~/.claude/settings.json`'s `skipDangerousModePermissionPrompt` chặn màn hình chấp thuận. | Kết luận đảo hẳn: đây không phải mặc định của herdr mà là **cấu hình vô hình của từng máy**. Xem [permission-posture-findings](../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md) và luật R0/R0b của Phase 01. |\n| **Không có \"prompt lúc tạo pane\"** | Help đầy đủ của `pane split`/`tab create`/`workspace create`: chỉ có `--cwd`, `--env`, `--label`, `--direction`, `--ratio`, `--focus/--no-focus`, `--right-click`. Không có `--command`, không có prompt. | Prompt luôn là bước riêng sau khi agent ready: `agent prompt <target> <text> --wait`. Đường brief-as-file + pointer của Family B giữ nguyên. |\n| **TRUST DIALOG là blocker sản xuất, không phải phiền toái probe** | claude lưu trust tại `~/.claude.json` → `projects[<đường dẫn TUYỆT ĐỐI CHÍNH XÁC>].hasTrustDialogAccepted`. Khóa theo path chính xác, **không** theo prefix (đo: 9/145 path được tin, toàn project root; `/home/vantt/projects/forgentX` = true nhưng **không một worktree path nào** có trong store). Mỗi dispatch fgOS tạo worktree path mới → dialog mới → `agent start` trả `blocked`. `--dangerously-skip-permissions` **không** bỏ qua được trust dialog — đo trực tiếp: cờ có trong argv, dialog vẫn hiện. (Nguồn của cờ đó lúc này bị ghi nhầm là \"herdr tự thêm\"; thực ra là alias trong `~/.zshrc` của người vận hành — đã bác ở dòng trên.) | Family B với claude **chết ngay từ dispatch đầu** nếu không xử lý. Giải: **pre-seed trust store** trước `agent start` (upstream đã ghi cùng cách). Rào chắn: chỉ seed path do fgOS tạo từ repo root **đã được tin** (trust là dẫn xuất, không bịa); khai trong executor config như capability `trustStore`; idempotent + fail loud khi field đổi tên; đăng ký `fgos doctor`; xoá entry khi teardown worktree (store đã 145 entry). |\n| **P3 — pane sống qua server restart** | **Chưa chạy**: session `default` đang chứa nhiều pane claude thật của người dùng; restart sẽ giết chúng. Cần session tên riêng (`herdr --session fgos-probe`, do người mở) trước khi đo. | `resume` tạm ghi `reattach-or-relaunch`, chưa chốt. |"
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)",
    "anchor": "12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent",
    "githubAnchor": "12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent",
    "stableAnchor": "h-cdea7f528782",
    "startLine": 507,
    "endLine": 507,
    "textDigest": "00e6c7dfdba65c3d4cd3e2a2f8592d83a52d5a70d1cb65d0d4ce87e99be86b00",
    "sample": "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)",
    "sectionPayloadDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
    "followingBlockDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
    "identityFingerprint": "849e6b986a0fe4193c985a67d87dd07f5e92a4ed80757d1a012e06360497319c",
    "ancestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
      "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)"
    ],
    "text": "### 12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)",
    "sectionText": "### 12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)\n\n| Probe | Kết quả đo | Hệ quả thiết kế |\n|---|---|---|\n| **P7 — cô lập socket** | `tab create --env HERDR_PANE_ID= --env HERDR_SOCKET_PATH= --env HERDR_ENV=` **không** xoá được: herdr inject lại `HERDR_*` của chính pane (pane id mới, socket path) đè lên `--env`. Tệ hơn: `env -i PATH HOME herdr pane list` (không có biến herdr nào) vẫn liệt kê **toàn bộ pane của người dùng** kèm `agent_session` id — socket nằm ở `~/.config/herdr/herdr.sock` (mode 0600, cùng user). | Không cô lập được bằng env. Chỉ ba cách: (a) worker chạy với **HOME riêng** (trùng với private-scratch mà P00.1 đã đòi cho bwrap → một giải pháp giải hai bài), (b) user OS riêng, (c) herdr `--session` riêng cho worker (socket khác; chưa probe vì cần TUI/attach). **H5 cập nhật:** default = (a). Cho tới khi có (a), herdr-spawn phải ghi `unsafe: worker-can-drive-cockpit` trong capability profile. |\n| **P5-lite — descendant sau `pane close`** | Foreground `sleep 733` bị kill khi đóng pane; `setsid sleep 731 &` **sống sót** sau `pane close` (phải kill tay bằng pid). | `pane close` ≠ cancel. Cancel thật cần process-group/`setsid` tracking ngoài herdr, hoặc chấp nhận `cancelled-with-orphans` có type + sweep. Đồng thời cảnh báo: `pkill -f` theo pattern lệnh là nguy hiểm (probe này tự giết shell của chính nó vì pattern khớp command line cha). |\n| **Boot race — với `pane run`** | `pane run` ngay sau `tab create`: hai lệnh được **gõ vào pane nhưng không chạy** (shell còn đang boot `.zshrc`); `pane process-info` báo `foreground_processes` khác rỗng suốt ~21 s. Sau khi shell rảnh, cùng lệnh chạy bình thường. | Đây là lỗi của **`pane run`**, không phải của herdr nói chung — xem dòng dưới. Adapter hiện tại dùng `pane run` để khởi động agent nên dính. |\n| **`agent start` HẤP THỤ boot race** (probe bổ sung, câu hỏi của người dùng) | Tạo tab lúc `17:12:34.197`, gọi `agent start fgosprobe --kind claude --pane <p> --timeout 40000` **ngay lập tức**: herdr gõ `claude --dangerously-skip-permissions` vào pane và tiến trình chạy thật (`process-info` xác nhận pid 1682022, argv đúng). Không mất keystroke. | **Bỏ hẳn `pane run` khỏi đường khởi động.** §8.2 không cần tự làm shell-readiness gate nữa — `agent start` đã làm. Đây là bằng chứng mạnh cho Family B và cho H1 (re-scope RUL40 mở đúng cái cửa này). |\n| **`agent start` trả typed failure, không treo** | Trả về sau **3928 ms** với `agent_not_ready` + `agent_status: blocked` + `launch_pending: true` (claude hiện trust dialog cho `/tmp`), không chờ hết 40 s, không báo thành công giả. | Đúng readiness handshake §8.2: ready / `agent_not_ready` / `blocked`, mỗi cái có lý do. |\n| **`agent explain` giải thích được quyết định detect** | Trả `rule: live_blocked_form (region=after_last_horizontal_rule priority=980)`, `manifest: remote:~/.local/state/herdr/agent-detection/remote/claude.toml 2026.08.31.1`, kèm evidence nguyên văn đoạn màn hình. | Detect là manifest-driven, có version, giải thích được — khác hẳn regex tự chế. Nhưng manifest **fetch từ remote và có version** → là mặt drift phải pin/probe (`herdr server update-agent-manifests`). |\n| ~~**Cảnh báo phát sinh: `--kind claude` tự thêm `--dangerously-skip-permissions`**~~ **SAI, đã bác 2026-09-06** | Quan sát ban đầu chỉ thấy cờ trong `terminal_title` và `process-info.argv` rồi **suy đoán** là herdr thêm. Đo lại bằng ba lần `agent start` trong một session cô lập, chỉ đổi tham số đuôi: không tham số ra `claude` trần, `-- --model haiku` ra đúng thế, cờ chỉ xuất hiện khi tự truyền. **herdr không bao giờ thêm cờ này.** Nguồn thật là `~/.zshrc:148` `alias claude='command claude --dangerously-skip-permissions'` của người vận hành, cộng `~/.claude/settings.json`'s `skipDangerousModePermissionPrompt` chặn màn hình chấp thuận. | Kết luận đảo hẳn: đây không phải mặc định của herdr mà là **cấu hình vô hình của từng máy**. Xem [permission-posture-findings](../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md) và luật R0/R0b của Phase 01. |\n| **Không có \"prompt lúc tạo pane\"** | Help đầy đủ của `pane split`/`tab create`/`workspace create`: chỉ có `--cwd`, `--env`, `--label`, `--direction`, `--ratio`, `--focus/--no-focus`, `--right-click`. Không có `--command`, không có prompt. | Prompt luôn là bước riêng sau khi agent ready: `agent prompt <target> <text> --wait`. Đường brief-as-file + pointer của Family B giữ nguyên. |\n| **TRUST DIALOG là blocker sản xuất, không phải phiền toái probe** | claude lưu trust tại `~/.claude.json` → `projects[<đường dẫn TUYỆT ĐỐI CHÍNH XÁC>].hasTrustDialogAccepted`. Khóa theo path chính xác, **không** theo prefix (đo: 9/145 path được tin, toàn project root; `/home/vantt/projects/forgentX` = true nhưng **không một worktree path nào** có trong store). Mỗi dispatch fgOS tạo worktree path mới → dialog mới → `agent start` trả `blocked`. `--dangerously-skip-permissions` **không** bỏ qua được trust dialog — đo trực tiếp: cờ có trong argv, dialog vẫn hiện. (Nguồn của cờ đó lúc này bị ghi nhầm là \"herdr tự thêm\"; thực ra là alias trong `~/.zshrc` của người vận hành — đã bác ở dòng trên.) | Family B với claude **chết ngay từ dispatch đầu** nếu không xử lý. Giải: **pre-seed trust store** trước `agent start` (upstream đã ghi cùng cách). Rào chắn: chỉ seed path do fgOS tạo từ repo root **đã được tin** (trust là dẫn xuất, không bịa); khai trong executor config như capability `trustStore`; idempotent + fail loud khi field đổi tên; đăng ký `fgos doctor`; xoá entry khi teardown worktree (store đã 145 entry). |\n| **P3 — pane sống qua server restart** | **Chưa chạy**: session `default` đang chứa nhiều pane claude thật của người dùng; restart sẽ giết chúng. Cần session tên riêng (`herdr --session fgos-probe`, do người mở) trước khi đo. | `resume` tạm ghi `reattach-or-relaunch`, chưa chốt. |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "heading",
      "level": 3,
      "title": "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)",
      "anchor": "12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent",
      "githubAnchor": "12b-kết-quả-probe-đã-chạy-2026-09-06-herdr-082-default-session-tab-tạm-fgos-probe-p7-không-agent",
      "stableAnchor": "h-cdea7f528782",
      "startLine": 507,
      "endLine": 507,
      "textDigest": "00e6c7dfdba65c3d4cd3e2a2f8592d83a52d5a70d1cb65d0d4ce87e99be86b00",
      "sample": "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)",
      "sectionPayloadDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
      "followingBlockDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
      "identityFingerprint": "849e6b986a0fe4193c985a67d87dd07f5e92a4ed80757d1a012e06360497319c",
      "ancestry": [
        "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
        "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)"
      ],
      "text": "### 12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)",
      "sectionText": "### 12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)\n\n| Probe | Kết quả đo | Hệ quả thiết kế |\n|---|---|---|\n| **P7 — cô lập socket** | `tab create --env HERDR_PANE_ID= --env HERDR_SOCKET_PATH= --env HERDR_ENV=` **không** xoá được: herdr inject lại `HERDR_*` của chính pane (pane id mới, socket path) đè lên `--env`. Tệ hơn: `env -i PATH HOME herdr pane list` (không có biến herdr nào) vẫn liệt kê **toàn bộ pane của người dùng** kèm `agent_session` id — socket nằm ở `~/.config/herdr/herdr.sock` (mode 0600, cùng user). | Không cô lập được bằng env. Chỉ ba cách: (a) worker chạy với **HOME riêng** (trùng với private-scratch mà P00.1 đã đòi cho bwrap → một giải pháp giải hai bài), (b) user OS riêng, (c) herdr `--session` riêng cho worker (socket khác; chưa probe vì cần TUI/attach). **H5 cập nhật:** default = (a). Cho tới khi có (a), herdr-spawn phải ghi `unsafe: worker-can-drive-cockpit` trong capability profile. |\n| **P5-lite — descendant sau `pane close`** | Foreground `sleep 733` bị kill khi đóng pane; `setsid sleep 731 &` **sống sót** sau `pane close` (phải kill tay bằng pid). | `pane close` ≠ cancel. Cancel thật cần process-group/`setsid` tracking ngoài herdr, hoặc chấp nhận `cancelled-with-orphans` có type + sweep. Đồng thời cảnh báo: `pkill -f` theo pattern lệnh là nguy hiểm (probe này tự giết shell của chính nó vì pattern khớp command line cha). |\n| **Boot race — với `pane run`** | `pane run` ngay sau `tab create`: hai lệnh được **gõ vào pane nhưng không chạy** (shell còn đang boot `.zshrc`); `pane process-info` báo `foreground_processes` khác rỗng suốt ~21 s. Sau khi shell rảnh, cùng lệnh chạy bình thường. | Đây là lỗi của **`pane run`**, không phải của herdr nói chung — xem dòng dưới. Adapter hiện tại dùng `pane run` để khởi động agent nên dính. |\n| **`agent start` HẤP THỤ boot race** (probe bổ sung, câu hỏi của người dùng) | Tạo tab lúc `17:12:34.197`, gọi `agent start fgosprobe --kind claude --pane <p> --timeout 40000` **ngay lập tức**: herdr gõ `claude --dangerously-skip-permissions` vào pane và tiến trình chạy thật (`process-info` xác nhận pid 1682022, argv đúng). Không mất keystroke. | **Bỏ hẳn `pane run` khỏi đường khởi động.** §8.2 không cần tự làm shell-readiness gate nữa — `agent start` đã làm. Đây là bằng chứng mạnh cho Family B và cho H1 (re-scope RUL40 mở đúng cái cửa này). |\n| **`agent start` trả typed failure, không treo** | Trả về sau **3928 ms** với `agent_not_ready` + `agent_status: blocked` + `launch_pending: true` (claude hiện trust dialog cho `/tmp`), không chờ hết 40 s, không báo thành công giả. | Đúng readiness handshake §8.2: ready / `agent_not_ready` / `blocked`, mỗi cái có lý do. |\n| **`agent explain` giải thích được quyết định detect** | Trả `rule: live_blocked_form (region=after_last_horizontal_rule priority=980)`, `manifest: remote:~/.local/state/herdr/agent-detection/remote/claude.toml 2026.08.31.1`, kèm evidence nguyên văn đoạn màn hình. | Detect là manifest-driven, có version, giải thích được — khác hẳn regex tự chế. Nhưng manifest **fetch từ remote và có version** → là mặt drift phải pin/probe (`herdr server update-agent-manifests`). |\n| ~~**Cảnh báo phát sinh: `--kind claude` tự thêm `--dangerously-skip-permissions`**~~ **SAI, đã bác 2026-09-06** | Quan sát ban đầu chỉ thấy cờ trong `terminal_title` và `process-info.argv` rồi **suy đoán** là herdr thêm. Đo lại bằng ba lần `agent start` trong một session cô lập, chỉ đổi tham số đuôi: không tham số ra `claude` trần, `-- --model haiku` ra đúng thế, cờ chỉ xuất hiện khi tự truyền. **herdr không bao giờ thêm cờ này.** Nguồn thật là `~/.zshrc:148` `alias claude='command claude --dangerously-skip-permissions'` của người vận hành, cộng `~/.claude/settings.json`'s `skipDangerousModePermissionPrompt` chặn màn hình chấp thuận. | Kết luận đảo hẳn: đây không phải mặc định của herdr mà là **cấu hình vô hình của từng máy**. Xem [permission-posture-findings](../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md) và luật R0/R0b của Phase 01. |\n| **Không có \"prompt lúc tạo pane\"** | Help đầy đủ của `pane split`/`tab create`/`workspace create`: chỉ có `--cwd`, `--env`, `--label`, `--direction`, `--ratio`, `--focus/--no-focus`, `--right-click`. Không có `--command`, không có prompt. | Prompt luôn là bước riêng sau khi agent ready: `agent prompt <target> <text> --wait`. Đường brief-as-file + pointer của Family B giữ nguyên. |\n| **TRUST DIALOG là blocker sản xuất, không phải phiền toái probe** | claude lưu trust tại `~/.claude.json` → `projects[<đường dẫn TUYỆT ĐỐI CHÍNH XÁC>].hasTrustDialogAccepted`. Khóa theo path chính xác, **không** theo prefix (đo: 9/145 path được tin, toàn project root; `/home/vantt/projects/forgentX` = true nhưng **không một worktree path nào** có trong store). Mỗi dispatch fgOS tạo worktree path mới → dialog mới → `agent start` trả `blocked`. `--dangerously-skip-permissions` **không** bỏ qua được trust dialog — đo trực tiếp: cờ có trong argv, dialog vẫn hiện. (Nguồn của cờ đó lúc này bị ghi nhầm là \"herdr tự thêm\"; thực ra là alias trong `~/.zshrc` của người vận hành — đã bác ở dòng trên.) | Family B với claude **chết ngay từ dispatch đầu** nếu không xử lý. Giải: **pre-seed trust store** trước `agent start` (upstream đã ghi cùng cách). Rào chắn: chỉ seed path do fgOS tạo từ repo root **đã được tin** (trust là dẫn xuất, không bịa); khai trong executor config như capability `trustStore`; idempotent + fail loud khi field đổi tên; đăng ký `fgos doctor`; xoá entry khi teardown worktree (store đã 145 entry). |\n| **P3 — pane sống qua server restart** | **Chưa chạy**: session `default` đang chứa nhiều pane claude thật của người dùng; restart sẽ giết chúng. Cần session tên riêng (`herdr --session fgos-probe`, do người mở) trước khi đo. | `resume` tạm ghi `reattach-or-relaunch`, chưa chốt. |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_ff1b02161c275824a631c743b5694875"
}
```

## Entry claim_9da7c5f236f54e3c812f4c488a6f044f

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json",
  "collection": "claims",
  "claimId": "claim_9da7c5f236f54e3c812f4c488a6f044f",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json",
  "before": {
    "claimId": "claim_9da7c5f236f54e3c812f4c488a6f044f",
    "sourceUnitDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-74 (lines 485–496) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-77 (lines 509–520); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
    "targetAncestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
      "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)",
      "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)"
    ]
  },
  "currentDecision": {
    "claimId": "claim_9da7c5f236f54e3c812f4c488a6f044f",
    "sourceUnitDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:1008 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-74 (lines 485–496) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-77 (lines 509–520); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
    "targetAncestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
      "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)",
      "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "unitDigest": "131f31787e516c98f0ab455bd6b3448cf419cacd43b9e710553de0bf31a99871",
    "identityFingerprint": "131f31787e516c98f0ab455bd6b3448cf419cacd43b9e710553de0bf31a99871",
    "claimId": "claim_9da7c5f236f54e3c812f4c488a6f044f",
    "sourceAnchor": "unheaded-block-74",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
    "claimKind": "architecture",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-74",
      "githubAnchor": "unheaded-block-74",
      "stableAnchor": "unheaded-block-74",
      "title": "Unheaded block 74",
      "startLine": 485,
      "endLine": 496,
      "textDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
      "sample": "| Probe | Kết quả đo | Hệ quả thiết kế |\n|---|---|---|\n| **P7 — cô lập socket** | `tab create --env HERDR_PANE_ID= --env HERDR_SOCKET_PATH= --env HERDR_ENV=` **không** xoá được: he",
      "identityFingerprint": "131f31787e516c98f0ab455bd6b3448cf419cacd43b9e710553de0bf31a99871",
      "ancestry": [
        "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
        "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)",
        "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)"
      ],
      "text": "| Probe | Kết quả đo | Hệ quả thiết kế |\n|---|---|---|\n| **P7 — cô lập socket** | `tab create --env HERDR_PANE_ID= --env HERDR_SOCKET_PATH= --env HERDR_ENV=` **không** xoá được: herdr inject lại `HERDR_*` của chính pane (pane id mới, socket path) đè lên `--env`. Tệ hơn: `env -i PATH HOME herdr pane list` (không có biến herdr nào) vẫn liệt kê **toàn bộ pane của người dùng** kèm `agent_session` id — socket nằm ở `~/.config/herdr/herdr.sock` (mode 0600, cùng user). | Không cô lập được bằng env. Chỉ ba cách: (a) worker chạy với **HOME riêng** (trùng với private-scratch mà P00.1 đã đòi cho bwrap → một giải pháp giải hai bài), (b) user OS riêng, (c) herdr `--session` riêng cho worker (socket khác; chưa probe vì cần TUI/attach). **H5 cập nhật:** default = (a). Cho tới khi có (a), herdr-spawn phải ghi `unsafe: worker-can-drive-cockpit` trong capability profile. |\n| **P5-lite — descendant sau `pane close`** | Foreground `sleep 733` bị kill khi đóng pane; `setsid sleep 731 &` **sống sót** sau `pane close` (phải kill tay bằng pid). | `pane close` ≠ cancel. Cancel thật cần process-group/`setsid` tracking ngoài herdr, hoặc chấp nhận `cancelled-with-orphans` có type + sweep. Đồng thời cảnh báo: `pkill -f` theo pattern lệnh là nguy hiểm (probe này tự giết shell của chính nó vì pattern khớp command line cha). |\n| **Boot race — với `pane run`** | `pane run` ngay sau `tab create`: hai lệnh được **gõ vào pane nhưng không chạy** (shell còn đang boot `.zshrc`); `pane process-info` báo `foreground_processes` khác rỗng suốt ~21 s. Sau khi shell rảnh, cùng lệnh chạy bình thường. | Đây là lỗi của **`pane run`**, không phải của herdr nói chung — xem dòng dưới. Adapter hiện tại dùng `pane run` để khởi động agent nên dính. |\n| **`agent start` HẤP THỤ boot race** (probe bổ sung, câu hỏi của người dùng) | Tạo tab lúc `17:12:34.197`, gọi `agent start fgosprobe --kind claude --pane <p> --timeout 40000` **ngay lập tức**: herdr gõ `claude --dangerously-skip-permissions` vào pane và tiến trình chạy thật (`process-info` xác nhận pid 1682022, argv đúng). Không mất keystroke. | **Bỏ hẳn `pane run` khỏi đường khởi động.** §8.2 không cần tự làm shell-readiness gate nữa — `agent start` đã làm. Đây là bằng chứng mạnh cho Family B và cho H1 (re-scope RUL40 mở đúng cái cửa này). |\n| **`agent start` trả typed failure, không treo** | Trả về sau **3928 ms** với `agent_not_ready` + `agent_status: blocked` + `launch_pending: true` (claude hiện trust dialog cho `/tmp`), không chờ hết 40 s, không báo thành công giả. | Đúng readiness handshake §8.2: ready / `agent_not_ready` / `blocked`, mỗi cái có lý do. |\n| **`agent explain` giải thích được quyết định detect** | Trả `rule: live_blocked_form (region=after_last_horizontal_rule priority=980)`, `manifest: remote:~/.local/state/herdr/agent-detection/remote/claude.toml 2026.08.31.1`, kèm evidence nguyên văn đoạn màn hình. | Detect là manifest-driven, có version, giải thích được — khác hẳn regex tự chế. Nhưng manifest **fetch từ remote và có version** → là mặt drift phải pin/probe (`herdr server update-agent-manifests`). |\n| ~~**Cảnh báo phát sinh: `--kind claude` tự thêm `--dangerously-skip-permissions`**~~ **SAI, đã bác 2026-09-06** | Quan sát ban đầu chỉ thấy cờ trong `terminal_title` và `process-info.argv` rồi **suy đoán** là herdr thêm. Đo lại bằng ba lần `agent start` trong một session cô lập, chỉ đổi tham số đuôi: không tham số ra `claude` trần, `-- --model haiku` ra đúng thế, cờ chỉ xuất hiện khi tự truyền. **herdr không bao giờ thêm cờ này.** Nguồn thật là `~/.zshrc:148` `alias claude='command claude --dangerously-skip-permissions'` của người vận hành, cộng `~/.claude/settings.json`'s `skipDangerousModePermissionPrompt` chặn màn hình chấp thuận. | Kết luận đảo hẳn: đây không phải mặc định của herdr mà là **cấu hình vô hình của từng máy**. Xem [permission-posture-findings](../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md) và luật R0/R0b của Phase 01. |\n| **Không có \"prompt lúc tạo pane\"** | Help đầy đủ của `pane split`/`tab create`/`workspace create`: chỉ có `--cwd`, `--env`, `--label`, `--direction`, `--ratio`, `--focus/--no-focus`, `--right-click`. Không có `--command`, không có prompt. | Prompt luôn là bước riêng sau khi agent ready: `agent prompt <target> <text> --wait`. Đường brief-as-file + pointer của Family B giữ nguyên. |\n| **TRUST DIALOG là blocker sản xuất, không phải phiền toái probe** | claude lưu trust tại `~/.claude.json` → `projects[<đường dẫn TUYỆT ĐỐI CHÍNH XÁC>].hasTrustDialogAccepted`. Khóa theo path chính xác, **không** theo prefix (đo: 9/145 path được tin, toàn project root; `/home/vantt/projects/forgentX` = true nhưng **không một worktree path nào** có trong store). Mỗi dispatch fgOS tạo worktree path mới → dialog mới → `agent start` trả `blocked`. `--dangerously-skip-permissions` **không** bỏ qua được trust dialog — đo trực tiếp: cờ có trong argv, dialog vẫn hiện. (Nguồn của cờ đó lúc này bị ghi nhầm là \"herdr tự thêm\"; thực ra là alias trong `~/.zshrc` của người vận hành — đã bác ở dòng trên.) | Family B với claude **chết ngay từ dispatch đầu** nếu không xử lý. Giải: **pre-seed trust store** trước `agent start` (upstream đã ghi cùng cách). Rào chắn: chỉ seed path do fgOS tạo từ repo root **đã được tin** (trust là dẫn xuất, không bịa); khai trong executor config như capability `trustStore`; idempotent + fail loud khi field đổi tên; đăng ký `fgos doctor`; xoá entry khi teardown worktree (store đã 145 entry). |\n| **P3 — pane sống qua server restart** | **Chưa chạy**: session `default` đang chứa nhiều pane claude thật của người dùng; restart sẽ giết chúng. Cần session tên riêng (`herdr --session fgos-probe`, do người mở) trước khi đo. | `resume` tạm ghi `reattach-or-relaunch`, chưa chốt. |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-77",
    "githubAnchor": "unheaded-block-77",
    "stableAnchor": "unheaded-block-77",
    "title": "Unheaded block 77",
    "startLine": 509,
    "endLine": 520,
    "textDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
    "sample": "| Probe | Kết quả đo | Hệ quả thiết kế |\n|---|---|---|\n| **P7 — cô lập socket** | `tab create --env HERDR_PANE_ID= --env HERDR_SOCKET_PATH= --env HERDR_ENV=` **không** xoá được: he",
    "identityFingerprint": "131f31787e516c98f0ab455bd6b3448cf419cacd43b9e710553de0bf31a99871",
    "ancestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
      "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)",
      "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)"
    ],
    "text": "| Probe | Kết quả đo | Hệ quả thiết kế |\n|---|---|---|\n| **P7 — cô lập socket** | `tab create --env HERDR_PANE_ID= --env HERDR_SOCKET_PATH= --env HERDR_ENV=` **không** xoá được: herdr inject lại `HERDR_*` của chính pane (pane id mới, socket path) đè lên `--env`. Tệ hơn: `env -i PATH HOME herdr pane list` (không có biến herdr nào) vẫn liệt kê **toàn bộ pane của người dùng** kèm `agent_session` id — socket nằm ở `~/.config/herdr/herdr.sock` (mode 0600, cùng user). | Không cô lập được bằng env. Chỉ ba cách: (a) worker chạy với **HOME riêng** (trùng với private-scratch mà P00.1 đã đòi cho bwrap → một giải pháp giải hai bài), (b) user OS riêng, (c) herdr `--session` riêng cho worker (socket khác; chưa probe vì cần TUI/attach). **H5 cập nhật:** default = (a). Cho tới khi có (a), herdr-spawn phải ghi `unsafe: worker-can-drive-cockpit` trong capability profile. |\n| **P5-lite — descendant sau `pane close`** | Foreground `sleep 733` bị kill khi đóng pane; `setsid sleep 731 &` **sống sót** sau `pane close` (phải kill tay bằng pid). | `pane close` ≠ cancel. Cancel thật cần process-group/`setsid` tracking ngoài herdr, hoặc chấp nhận `cancelled-with-orphans` có type + sweep. Đồng thời cảnh báo: `pkill -f` theo pattern lệnh là nguy hiểm (probe này tự giết shell của chính nó vì pattern khớp command line cha). |\n| **Boot race — với `pane run`** | `pane run` ngay sau `tab create`: hai lệnh được **gõ vào pane nhưng không chạy** (shell còn đang boot `.zshrc`); `pane process-info` báo `foreground_processes` khác rỗng suốt ~21 s. Sau khi shell rảnh, cùng lệnh chạy bình thường. | Đây là lỗi của **`pane run`**, không phải của herdr nói chung — xem dòng dưới. Adapter hiện tại dùng `pane run` để khởi động agent nên dính. |\n| **`agent start` HẤP THỤ boot race** (probe bổ sung, câu hỏi của người dùng) | Tạo tab lúc `17:12:34.197`, gọi `agent start fgosprobe --kind claude --pane <p> --timeout 40000` **ngay lập tức**: herdr gõ `claude --dangerously-skip-permissions` vào pane và tiến trình chạy thật (`process-info` xác nhận pid 1682022, argv đúng). Không mất keystroke. | **Bỏ hẳn `pane run` khỏi đường khởi động.** §8.2 không cần tự làm shell-readiness gate nữa — `agent start` đã làm. Đây là bằng chứng mạnh cho Family B và cho H1 (re-scope RUL40 mở đúng cái cửa này). |\n| **`agent start` trả typed failure, không treo** | Trả về sau **3928 ms** với `agent_not_ready` + `agent_status: blocked` + `launch_pending: true` (claude hiện trust dialog cho `/tmp`), không chờ hết 40 s, không báo thành công giả. | Đúng readiness handshake §8.2: ready / `agent_not_ready` / `blocked`, mỗi cái có lý do. |\n| **`agent explain` giải thích được quyết định detect** | Trả `rule: live_blocked_form (region=after_last_horizontal_rule priority=980)`, `manifest: remote:~/.local/state/herdr/agent-detection/remote/claude.toml 2026.08.31.1`, kèm evidence nguyên văn đoạn màn hình. | Detect là manifest-driven, có version, giải thích được — khác hẳn regex tự chế. Nhưng manifest **fetch từ remote và có version** → là mặt drift phải pin/probe (`herdr server update-agent-manifests`). |\n| ~~**Cảnh báo phát sinh: `--kind claude` tự thêm `--dangerously-skip-permissions`**~~ **SAI, đã bác 2026-09-06** | Quan sát ban đầu chỉ thấy cờ trong `terminal_title` và `process-info.argv` rồi **suy đoán** là herdr thêm. Đo lại bằng ba lần `agent start` trong một session cô lập, chỉ đổi tham số đuôi: không tham số ra `claude` trần, `-- --model haiku` ra đúng thế, cờ chỉ xuất hiện khi tự truyền. **herdr không bao giờ thêm cờ này.** Nguồn thật là `~/.zshrc:148` `alias claude='command claude --dangerously-skip-permissions'` của người vận hành, cộng `~/.claude/settings.json`'s `skipDangerousModePermissionPrompt` chặn màn hình chấp thuận. | Kết luận đảo hẳn: đây không phải mặc định của herdr mà là **cấu hình vô hình của từng máy**. Xem [permission-posture-findings](../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md) và luật R0/R0b của Phase 01. |\n| **Không có \"prompt lúc tạo pane\"** | Help đầy đủ của `pane split`/`tab create`/`workspace create`: chỉ có `--cwd`, `--env`, `--label`, `--direction`, `--ratio`, `--focus/--no-focus`, `--right-click`. Không có `--command`, không có prompt. | Prompt luôn là bước riêng sau khi agent ready: `agent prompt <target> <text> --wait`. Đường brief-as-file + pointer của Family B giữ nguyên. |\n| **TRUST DIALOG là blocker sản xuất, không phải phiền toái probe** | claude lưu trust tại `~/.claude.json` → `projects[<đường dẫn TUYỆT ĐỐI CHÍNH XÁC>].hasTrustDialogAccepted`. Khóa theo path chính xác, **không** theo prefix (đo: 9/145 path được tin, toàn project root; `/home/vantt/projects/forgentX` = true nhưng **không một worktree path nào** có trong store). Mỗi dispatch fgOS tạo worktree path mới → dialog mới → `agent start` trả `blocked`. `--dangerously-skip-permissions` **không** bỏ qua được trust dialog — đo trực tiếp: cờ có trong argv, dialog vẫn hiện. (Nguồn của cờ đó lúc này bị ghi nhầm là \"herdr tự thêm\"; thực ra là alias trong `~/.zshrc` của người vận hành — đã bác ở dòng trên.) | Family B với claude **chết ngay từ dispatch đầu** nếu không xử lý. Giải: **pre-seed trust store** trước `agent start` (upstream đã ghi cùng cách). Rào chắn: chỉ seed path do fgOS tạo từ repo root **đã được tin** (trust là dẫn xuất, không bịa); khai trong executor config như capability `trustStore`; idempotent + fail loud khi field đổi tên; đăng ký `fgos doctor`; xoá entry khi teardown worktree (store đã 145 entry). |\n| **P3 — pane sống qua server restart** | **Chưa chạy**: session `default` đang chứa nhiều pane claude thật của người dùng; restart sẽ giết chúng. Cần session tên riêng (`herdr --session fgos-probe`, do người mở) trước khi đo. | `resume` tạm ghi `reattach-or-relaunch`, chưa chốt. |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Unit-exact",
    "reason": "unique long digest match, equal ancestry, sufficient document exact share",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-77",
      "githubAnchor": "unheaded-block-77",
      "stableAnchor": "unheaded-block-77",
      "title": "Unheaded block 77",
      "startLine": 509,
      "endLine": 520,
      "textDigest": "8a6c208de4b598018b53e22005d82c98c74f09235ee19ae7b5659c75e8786450",
      "sample": "| Probe | Kết quả đo | Hệ quả thiết kế |\n|---|---|---|\n| **P7 — cô lập socket** | `tab create --env HERDR_PANE_ID= --env HERDR_SOCKET_PATH= --env HERDR_ENV=` **không** xoá được: he",
      "identityFingerprint": "131f31787e516c98f0ab455bd6b3448cf419cacd43b9e710553de0bf31a99871",
      "ancestry": [
        "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
        "12. Minimal probes trước implementation plan (read-only với repo, live với herdr thật, disposable dir)",
        "12b. Kết quả probe đã chạy 2026-09-06 (herdr 0.8.2, default session, tab tạm `fgos-probe-p7`, không agent)"
      ],
      "text": "| Probe | Kết quả đo | Hệ quả thiết kế |\n|---|---|---|\n| **P7 — cô lập socket** | `tab create --env HERDR_PANE_ID= --env HERDR_SOCKET_PATH= --env HERDR_ENV=` **không** xoá được: herdr inject lại `HERDR_*` của chính pane (pane id mới, socket path) đè lên `--env`. Tệ hơn: `env -i PATH HOME herdr pane list` (không có biến herdr nào) vẫn liệt kê **toàn bộ pane của người dùng** kèm `agent_session` id — socket nằm ở `~/.config/herdr/herdr.sock` (mode 0600, cùng user). | Không cô lập được bằng env. Chỉ ba cách: (a) worker chạy với **HOME riêng** (trùng với private-scratch mà P00.1 đã đòi cho bwrap → một giải pháp giải hai bài), (b) user OS riêng, (c) herdr `--session` riêng cho worker (socket khác; chưa probe vì cần TUI/attach). **H5 cập nhật:** default = (a). Cho tới khi có (a), herdr-spawn phải ghi `unsafe: worker-can-drive-cockpit` trong capability profile. |\n| **P5-lite — descendant sau `pane close`** | Foreground `sleep 733` bị kill khi đóng pane; `setsid sleep 731 &` **sống sót** sau `pane close` (phải kill tay bằng pid). | `pane close` ≠ cancel. Cancel thật cần process-group/`setsid` tracking ngoài herdr, hoặc chấp nhận `cancelled-with-orphans` có type + sweep. Đồng thời cảnh báo: `pkill -f` theo pattern lệnh là nguy hiểm (probe này tự giết shell của chính nó vì pattern khớp command line cha). |\n| **Boot race — với `pane run`** | `pane run` ngay sau `tab create`: hai lệnh được **gõ vào pane nhưng không chạy** (shell còn đang boot `.zshrc`); `pane process-info` báo `foreground_processes` khác rỗng suốt ~21 s. Sau khi shell rảnh, cùng lệnh chạy bình thường. | Đây là lỗi của **`pane run`**, không phải của herdr nói chung — xem dòng dưới. Adapter hiện tại dùng `pane run` để khởi động agent nên dính. |\n| **`agent start` HẤP THỤ boot race** (probe bổ sung, câu hỏi của người dùng) | Tạo tab lúc `17:12:34.197`, gọi `agent start fgosprobe --kind claude --pane <p> --timeout 40000` **ngay lập tức**: herdr gõ `claude --dangerously-skip-permissions` vào pane và tiến trình chạy thật (`process-info` xác nhận pid 1682022, argv đúng). Không mất keystroke. | **Bỏ hẳn `pane run` khỏi đường khởi động.** §8.2 không cần tự làm shell-readiness gate nữa — `agent start` đã làm. Đây là bằng chứng mạnh cho Family B và cho H1 (re-scope RUL40 mở đúng cái cửa này). |\n| **`agent start` trả typed failure, không treo** | Trả về sau **3928 ms** với `agent_not_ready` + `agent_status: blocked` + `launch_pending: true` (claude hiện trust dialog cho `/tmp`), không chờ hết 40 s, không báo thành công giả. | Đúng readiness handshake §8.2: ready / `agent_not_ready` / `blocked`, mỗi cái có lý do. |\n| **`agent explain` giải thích được quyết định detect** | Trả `rule: live_blocked_form (region=after_last_horizontal_rule priority=980)`, `manifest: remote:~/.local/state/herdr/agent-detection/remote/claude.toml 2026.08.31.1`, kèm evidence nguyên văn đoạn màn hình. | Detect là manifest-driven, có version, giải thích được — khác hẳn regex tự chế. Nhưng manifest **fetch từ remote và có version** → là mặt drift phải pin/probe (`herdr server update-agent-manifests`). |\n| ~~**Cảnh báo phát sinh: `--kind claude` tự thêm `--dangerously-skip-permissions`**~~ **SAI, đã bác 2026-09-06** | Quan sát ban đầu chỉ thấy cờ trong `terminal_title` và `process-info.argv` rồi **suy đoán** là herdr thêm. Đo lại bằng ba lần `agent start` trong một session cô lập, chỉ đổi tham số đuôi: không tham số ra `claude` trần, `-- --model haiku` ra đúng thế, cờ chỉ xuất hiện khi tự truyền. **herdr không bao giờ thêm cờ này.** Nguồn thật là `~/.zshrc:148` `alias claude='command claude --dangerously-skip-permissions'` của người vận hành, cộng `~/.claude/settings.json`'s `skipDangerousModePermissionPrompt` chặn màn hình chấp thuận. | Kết luận đảo hẳn: đây không phải mặc định của herdr mà là **cấu hình vô hình của từng máy**. Xem [permission-posture-findings](../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md) và luật R0/R0b của Phase 01. |\n| **Không có \"prompt lúc tạo pane\"** | Help đầy đủ của `pane split`/`tab create`/`workspace create`: chỉ có `--cwd`, `--env`, `--label`, `--direction`, `--ratio`, `--focus/--no-focus`, `--right-click`. Không có `--command`, không có prompt. | Prompt luôn là bước riêng sau khi agent ready: `agent prompt <target> <text> --wait`. Đường brief-as-file + pointer của Family B giữ nguyên. |\n| **TRUST DIALOG là blocker sản xuất, không phải phiền toái probe** | claude lưu trust tại `~/.claude.json` → `projects[<đường dẫn TUYỆT ĐỐI CHÍNH XÁC>].hasTrustDialogAccepted`. Khóa theo path chính xác, **không** theo prefix (đo: 9/145 path được tin, toàn project root; `/home/vantt/projects/forgentX` = true nhưng **không một worktree path nào** có trong store). Mỗi dispatch fgOS tạo worktree path mới → dialog mới → `agent start` trả `blocked`. `--dangerously-skip-permissions` **không** bỏ qua được trust dialog — đo trực tiếp: cờ có trong argv, dialog vẫn hiện. (Nguồn của cờ đó lúc này bị ghi nhầm là \"herdr tự thêm\"; thực ra là alias trong `~/.zshrc` của người vận hành — đã bác ở dòng trên.) | Family B với claude **chết ngay từ dispatch đầu** nếu không xử lý. Giải: **pre-seed trust store** trước `agent start` (upstream đã ghi cùng cách). Rào chắn: chỉ seed path do fgOS tạo từ repo root **đã được tin** (trust là dẫn xuất, không bịa); khai trong executor config như capability `trustStore`; idempotent + fail loud khi field đổi tên; đăng ký `fgos doctor`; xoá entry khi teardown worktree (store đã 145 entry). |\n| **P3 — pane sống qua server restart** | **Chưa chạy**: session `default` đang chứa nhiều pane claude thật của người dùng; restart sẽ giết chúng. Cần session tên riêng (`herdr --session fgos-probe`, do người mở) trước khi đo. | `resume` tạm ghi `reattach-or-relaunch`, chưa chốt. |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_9da7c5f236f54e3c812f4c488a6f044f"
}
```

## Entry claim_46c173824da77fbf25f59072ae8e1620

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_46c173824da77fbf25f59072ae8e1620",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_46c173824da77fbf25f59072ae8e1620",
    "sourceUnitDigest": "018713d3e9d6a59a7fb677b2dfa0225a5461509d1b26c27c0cfde12103d9d67a",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "86-crash-và-cleanup",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792079321432-41fe2051@2026-10-15",
    "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#86-crash-và-cleanup (source lines 1084-1084) is carried at docs/platform/agent-confinement/spec.md#86-crash-và-cleanup (candidate lines 348-348). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10-14: re-decided against current confinement §8.6 full direct-section source digest after binding paragraph addition; complete paragraph already carried verbatim. Current source/target binding is pending independent review.",
    "targetUnitDigest": "c3306e72572f72945df91c96305a90f6835935407a5d2027b1b60aad89695133",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ]
  },
  "currentDecision": {
    "claimId": "claim_46c173824da77fbf25f59072ae8e1620",
    "sourceUnitDigest": "018713d3e9d6a59a7fb677b2dfa0225a5461509d1b26c27c0cfde12103d9d67a",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "86-crash-và-cleanup",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Judgment: labelled candidate binding addition. The whole heading unit docs/specs/confinement-authority.md#86-crash-và-cleanup (source lines 1084-1084) is carried at docs/platform/agent-confinement/spec.md#86-crash-và-cleanup (candidate lines 348-348). The direct heading-section digests differ because the candidate includes the explicit Added in candidate label for the binding paragraph. The source paragraph is verbatim. Move became supersede to disclose that labelled addition; no digest-equality claim. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10-14: re-decided against current confinement §8.6 full direct-section source digest after binding paragraph addition; complete paragraph already carried verbatim. Current source/target binding is pending independent review.",
    "targetUnitDigest": "c3306e72572f72945df91c96305a90f6835935407a5d2027b1b60aad89695133",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "41121712d06197252202bc49af9d142924bce488f7bb894cc29771c49e15d5f4",
    "identityFingerprint": "441230ba30298939db103b7e3881ba13af5d98c36ffb0a75a891f2b60a81c7e2",
    "claimId": "claim_46c173824da77fbf25f59072ae8e1620",
    "sourceAnchor": "86-crash-và-cleanup",
    "unitKind": "heading",
    "sourceUnitDigest": "018713d3e9d6a59a7fb677b2dfa0225a5461509d1b26c27c0cfde12103d9d67a",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 3,
      "title": "8.6 Crash và cleanup",
      "anchor": "86-crash-và-cleanup",
      "githubAnchor": "86-crash-và-cleanup",
      "stableAnchor": "h-1205ca9f66bb",
      "startLine": 1084,
      "endLine": 1084,
      "textDigest": "018713d3e9d6a59a7fb677b2dfa0225a5461509d1b26c27c0cfde12103d9d67a",
      "sample": "8.6 Crash và cleanup",
      "sectionPayloadDigest": "7b0ab41c70e8c9929e8eabf4ce27fcb6002d42ffb743c088f8b515b41ee7dffb",
      "followingBlockDigest": "237461836affe4167aaf89d08ee087d9de21a39a3afc2f10e54bfe6bcaeaeb2b",
      "identityFingerprint": "441230ba30298939db103b7e3881ba13af5d98c36ffb0a75a891f2b60a81c7e2",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "8. Policy resolution và edge cases"
      ],
      "text": "### 8.6 Crash và cleanup",
      "sectionText": "### 8.6 Crash và cleanup\n\nNghĩa vụ chung của Authority là giữ evidence/ownership identity và chỉ cho phép\ndọn sau khi execution đã dừng; recovery mechanics được chọn theo driver profile.\nLocal-bwrap-v1 dùng thư mục tạm theo dispatchId tạo dưới trusted root, ownership\nmarker trước allocation, finally và startup reaper idempotent. Reaper kiểm tra\nprocess identity/liveness (không chỉ PID trần) trước khi dọn; host-disk private\nhome không tự biến mất khi process exit. Không cần remote lease/journal engine\ncho default local. Phần journal/lease dưới đây áp dụng profile có resource sống\nngoài process local (remote/container detached), không phải gate chung của S4.\n\nAttestation `prepared` được ghi trước adapter call. Cleanup chạy trong\n`finally`; partial prepare cũng phải cung cấp cleanup handle như quy định ở\n§6.5. Startup reaper nhận diện resource tạm qua dispatch id và dọn phần còn\nlại. Cleanup failure không được biến execution chưa rõ thành thành công, và\nkhông được che mất execution result đã có. Nếu Authority crash sau khi prepare,\nrun record giữ phase cuối cùng và reaper xử lý resource chưa dọn.\n\nReaper và recovery hỏi đúng herdr session mà worker được khởi chạy trong đó: bản ghi launch command và ownership marker của home được giữ lại mang `herdrSession` (socket suy ra từ tên, không lưu), `reconcile` dựng client theo session đó, reaper dùng `FGOS_HERDR_BIN` và cùng session; marker không có session thì trạng thái pane là không rõ và quy tắc hết hạn quyết định.\n\n**Gắn home với tiến trình đang chạy worker (binding, 2026-10-15).** Authority cấp cho mỗi dispatch đã prepare hai hàm `bind`/`markLaunched` (`drivers/bwrap.mjs`, gom qua `bindingForPrepared` ở `authority.mjs`); adapter chỉ gọi hàm, không thấy đường dẫn home, không tự ghi marker. Round herdr confined (mọi round, có assignment hay không) gọi `bind` trước `pane run` với `paneId`, endpoint herdr mà client của round thật sự dùng (`herdrEndpoint` = socket path từ env của client, hoặc socket của session nó đặt tên, hoặc socket mặc định herdr tự rơi về; `herdrSession` chỉ khi env có đặt tên), `binderPid` + `binderStartTime` của controller và `boundAt`; ghi atomic (tmp + rename). Ghi không được thì đóng pane, round fail trước khi có worker. Ngay trước `pane run` (hoặc khi round resume thấy worker đã chạy) ghi `launchedAt`. Round cli-spawn confined gắn home với run supervisor tách rời ngay khi supervisor khởi động (`binderPid` = pid supervisor, không có pane); ghi không được thì báo mã `confinement-bind-failed` và giữ marker như prepare (supervisor đã chạy rồi). Luật reaper cho marker đã bind mà chưa `retainedAt`: binder còn sống (pid + start time) thì giữ tới `boundAt + max(maxAgeMs, 2 phút launch grace + run timeout + 10 phút settle)` bất kể pane trả lời gì; binder chết hoặc quá cửa sổ thì: không có pane → dọn; có pane mà chưa `launchedAt` và binder chết → dọn và đóng pane rỗng; còn lại hỏi pane trên endpoint đã ghi (true giữ, null theo luật hết hạn, false dọn). Marker `retainedAt` giữ luật pane cũ, nhưng giờ hỏi được cả round default-session nhờ endpoint đã ghi. Trước khi xoá, reaper đọc lại marker; khác với bản nó đã dựa vào để quyết thì bỏ qua lượt này. Finalizer chấp nhận đúng các field binding (`paneId`, `herdrEndpoint`, `herdrSession`, `binderPid`, `binderStartTime`, `boundAt`, `launchedAt`) cộng `credentialKept` là thay đổi sau prepare; mọi thay đổi khác vẫn là `ownership-marker-mismatch`. Chưa có (để cho run supervisor + holder-lock): từ chối bind khi home đã quá cửa sổ run tính từ lúc tạo, kiểm trước/sau launch, claim độc quyền khi reap; nên khe \"reaper đã đọc lại xong, controller bind + launch ngay trước lúc xoá\" (RT2-1) vẫn còn.\n\nVới profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi\nside effect prepare; driver tạo theo identity đó một cách idempotent. Journal\nghi dispatch id, backend snapshot reference, resource locator, lease/execution\nidentity và trạng thái allocation/collection/cleanup, không chứa credential.\nCallback cleanup chỉ là tối ưu trong process; recovery không phụ thuộc callback.\nReaper phải lấy recovery lease độc quyền, kiểm tra liveness bằng execution\nidentity chống PID reuse, dừng và xác nhận cả execution tree trước khi collect\nvà cleanup idempotent. Timeout/cancel cũng tuân cùng thứ tự. Không liên lạc được\nremote thì giữ unknown và cleanup pending, không suy agent đã dừng; reconnect\nhoặc backend lease-expiry có proof mới cho phép dọn. Resource chưa collect được\ngiữ cho recovery, không xóa vì agent đã exit. Startup reaper dùng cùng registry\nsetup/doctor; backend không có recovery contract này chưa được nhận required.\n\nLocal profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu\ntrên, không phải triển khai journal/lease schema của remote."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "8.6 Crash và cleanup",
    "anchor": "86-crash-và-cleanup",
    "githubAnchor": "86-crash-và-cleanup",
    "stableAnchor": "h-d76fbbdc6f2f",
    "startLine": 348,
    "endLine": 348,
    "textDigest": "c3306e72572f72945df91c96305a90f6835935407a5d2027b1b60aad89695133",
    "sample": "8.6 Crash và cleanup",
    "sectionPayloadDigest": "6ad22d623e5bbbe5815d1aa4bf27adff6fd3ed5f57e234b40c1bc35b86a9aa42",
    "followingBlockDigest": "237461836affe4167aaf89d08ee087d9de21a39a3afc2f10e54bfe6bcaeaeb2b",
    "identityFingerprint": "c4e561fb2eb468c282be4fcd119a69b37cb1cc3bf20272269d17feb11ac2ce1a",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ],
    "text": "### 8.6 Crash và cleanup",
    "sectionText": "### 8.6 Crash và cleanup\n\nNghĩa vụ chung của Authority là giữ evidence/ownership identity và chỉ cho phép\ndọn sau khi execution đã dừng; recovery mechanics được chọn theo driver profile.\nLocal-bwrap-v1 dùng thư mục tạm theo dispatchId tạo dưới trusted root, ownership\nmarker trước allocation, finally và startup reaper idempotent. Reaper kiểm tra\nprocess identity/liveness (không chỉ PID trần) trước khi dọn; host-disk private\nhome không tự biến mất khi process exit. Không cần remote lease/journal engine\ncho default local. Phần journal/lease dưới đây áp dụng profile có resource sống\nngoài process local (remote/container detached), không phải gate chung của S4.\n\nAttestation `prepared` được ghi trước adapter call. Cleanup chạy trong\n`finally`; partial prepare cũng phải cung cấp cleanup handle như quy định ở\n§6.5. Startup reaper nhận diện resource tạm qua dispatch id và dọn phần còn\nlại. Cleanup failure không được biến execution chưa rõ thành thành công, và\nkhông được che mất execution result đã có. Nếu Authority crash sau khi prepare,\nrun record giữ phase cuối cùng và reaper xử lý resource chưa dọn.\n\nReaper và recovery hỏi đúng herdr session mà worker được khởi chạy trong đó: bản ghi launch command và ownership marker của home được giữ lại mang `herdrSession` (socket suy ra từ tên, không lưu), `reconcile` dựng client theo session đó, reaper dùng `FGOS_HERDR_BIN` và cùng session; marker không có session thì trạng thái pane là không rõ và quy tắc hết hạn quyết định.\n\nAdded in candidate — verbatim binding addition from the final main sync (2026-10-15); pending independent review:\n\n**Gắn home với tiến trình đang chạy worker (binding, 2026-10-15).** Authority cấp cho mỗi dispatch đã prepare hai hàm `bind`/`markLaunched` (`drivers/bwrap.mjs`, gom qua `bindingForPrepared` ở `authority.mjs`); adapter chỉ gọi hàm, không thấy đường dẫn home, không tự ghi marker. Round herdr confined (mọi round, có assignment hay không) gọi `bind` trước `pane run` với `paneId`, endpoint herdr mà client của round thật sự dùng (`herdrEndpoint` = socket path từ env của client, hoặc socket của session nó đặt tên, hoặc socket mặc định herdr tự rơi về; `herdrSession` chỉ khi env có đặt tên), `binderPid` + `binderStartTime` của controller và `boundAt`; ghi atomic (tmp + rename). Ghi không được thì đóng pane, round fail trước khi có worker. Ngay trước `pane run` (hoặc khi round resume thấy worker đã chạy) ghi `launchedAt`. Round cli-spawn confined gắn home với run supervisor tách rời ngay khi supervisor khởi động (`binderPid` = pid supervisor, không có pane); ghi không được thì báo mã `confinement-bind-failed` và giữ marker như prepare (supervisor đã chạy rồi). Luật reaper cho marker đã bind mà chưa `retainedAt`: binder còn sống (pid + start time) thì giữ tới `boundAt + max(maxAgeMs, 2 phút launch grace + run timeout + 10 phút settle)` bất kể pane trả lời gì; binder chết hoặc quá cửa sổ thì: không có pane → dọn; có pane mà chưa `launchedAt` và binder chết → dọn và đóng pane rỗng; còn lại hỏi pane trên endpoint đã ghi (true giữ, null theo luật hết hạn, false dọn). Marker `retainedAt` giữ luật pane cũ, nhưng giờ hỏi được cả round default-session nhờ endpoint đã ghi. Trước khi xoá, reaper đọc lại marker; khác với bản nó đã dựa vào để quyết thì bỏ qua lượt này. Finalizer chấp nhận đúng các field binding (`paneId`, `herdrEndpoint`, `herdrSession`, `binderPid`, `binderStartTime`, `boundAt`, `launchedAt`) cộng `credentialKept` là thay đổi sau prepare; mọi thay đổi khác vẫn là `ownership-marker-mismatch`. Chưa có (để cho run supervisor + holder-lock): từ chối bind khi home đã quá cửa sổ run tính từ lúc tạo, kiểm trước/sau launch, claim độc quyền khi reap; nên khe \"reaper đã đọc lại xong, controller bind + launch ngay trước lúc xoá\" (RT2-1) vẫn còn.\n\nVới profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi\nside effect prepare; driver tạo theo identity đó một cách idempotent. Journal\nghi dispatch id, backend snapshot reference, resource locator, lease/execution\nidentity và trạng thái allocation/collection/cleanup, không chứa credential.\nCallback cleanup chỉ là tối ưu trong process; recovery không phụ thuộc callback.\nReaper phải lấy recovery lease độc quyền, kiểm tra liveness bằng execution\nidentity chống PID reuse, dừng và xác nhận cả execution tree trước khi collect\nvà cleanup idempotent. Timeout/cancel cũng tuân cùng thứ tự. Không liên lạc được\nremote thì giữ unknown và cleanup pending, không suy agent đã dừng; reconnect\nhoặc backend lease-expiry có proof mới cho phép dọn. Resource chưa collect được\ngiữ cho recovery, không xóa vì agent đã exit. Startup reaper dùng cùng registry\nsetup/doctor; backend không có recovery contract này chưa được nhận required.\n\nLocal profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu\ntrên, không phải triển khai journal/lease schema của remote."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_46c173824da77fbf25f59072ae8e1620"
}
```

## Entry claim_d7fa39da9698c447594edefdc44d7ce5

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_d7fa39da9698c447594edefdc44d7ce5",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_d7fa39da9698c447594edefdc44d7ce5",
    "sourceUnitDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-48",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-113 (source lines 1104-1115) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-46 (candidate lines 368-379). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases",
      "8.6 Crash và cleanup"
    ]
  },
  "currentDecision": {
    "claimId": "claim_d7fa39da9698c447594edefdc44d7ce5",
    "sourceUnitDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-48",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-114 (source lines 1106-1117) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-48 (candidate lines 372-383). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases",
      "8.6 Crash và cleanup"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "50915dcd46d43dffa275812e2b7f5d7bb3dc97b5ab41900875cbc632e030bd25",
    "identityFingerprint": "50915dcd46d43dffa275812e2b7f5d7bb3dc97b5ab41900875cbc632e030bd25",
    "claimId": "claim_d7fa39da9698c447594edefdc44d7ce5",
    "sourceAnchor": "unheaded-block-114",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-114",
      "githubAnchor": "unheaded-block-114",
      "stableAnchor": "unheaded-block-114",
      "title": "Unheaded block 114",
      "startLine": 1106,
      "endLine": 1117,
      "textDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
      "sample": "Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi\nside effect prepare; driver tạo theo identity đó một cách idempot",
      "identityFingerprint": "50915dcd46d43dffa275812e2b7f5d7bb3dc97b5ab41900875cbc632e030bd25",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "8. Policy resolution và edge cases",
        "8.6 Crash và cleanup"
      ],
      "text": "Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi\nside effect prepare; driver tạo theo identity đó một cách idempotent. Journal\nghi dispatch id, backend snapshot reference, resource locator, lease/execution\nidentity và trạng thái allocation/collection/cleanup, không chứa credential.\nCallback cleanup chỉ là tối ưu trong process; recovery không phụ thuộc callback.\nReaper phải lấy recovery lease độc quyền, kiểm tra liveness bằng execution\nidentity chống PID reuse, dừng và xác nhận cả execution tree trước khi collect\nvà cleanup idempotent. Timeout/cancel cũng tuân cùng thứ tự. Không liên lạc được\nremote thì giữ unknown và cleanup pending, không suy agent đã dừng; reconnect\nhoặc backend lease-expiry có proof mới cho phép dọn. Resource chưa collect được\ngiữ cho recovery, không xóa vì agent đã exit. Startup reaper dùng cùng registry\nsetup/doctor; backend không có recovery contract này chưa được nhận required."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-48",
    "githubAnchor": "unheaded-block-48",
    "stableAnchor": "unheaded-block-48",
    "title": "Unheaded block 48",
    "startLine": 372,
    "endLine": 383,
    "textDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
    "sample": "Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi\nside effect prepare; driver tạo theo identity đó một cách idempot",
    "identityFingerprint": "50915dcd46d43dffa275812e2b7f5d7bb3dc97b5ab41900875cbc632e030bd25",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases",
      "8.6 Crash và cleanup"
    ],
    "text": "Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi\nside effect prepare; driver tạo theo identity đó một cách idempotent. Journal\nghi dispatch id, backend snapshot reference, resource locator, lease/execution\nidentity và trạng thái allocation/collection/cleanup, không chứa credential.\nCallback cleanup chỉ là tối ưu trong process; recovery không phụ thuộc callback.\nReaper phải lấy recovery lease độc quyền, kiểm tra liveness bằng execution\nidentity chống PID reuse, dừng và xác nhận cả execution tree trước khi collect\nvà cleanup idempotent. Timeout/cancel cũng tuân cùng thứ tự. Không liên lạc được\nremote thì giữ unknown và cleanup pending, không suy agent đã dừng; reconnect\nhoặc backend lease-expiry có proof mới cho phép dọn. Resource chưa collect được\ngiữ cho recovery, không xóa vì agent đã exit. Startup reaper dùng cùng registry\nsetup/doctor; backend không có recovery contract này chưa được nhận required."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-48",
      "githubAnchor": "unheaded-block-48",
      "stableAnchor": "unheaded-block-48",
      "title": "Unheaded block 48",
      "startLine": 372,
      "endLine": 383,
      "textDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
      "sample": "Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi\nside effect prepare; driver tạo theo identity đó một cách idempot",
      "identityFingerprint": "50915dcd46d43dffa275812e2b7f5d7bb3dc97b5ab41900875cbc632e030bd25",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "8. Policy resolution và edge cases",
        "8.6 Crash và cleanup"
      ],
      "text": "Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi\nside effect prepare; driver tạo theo identity đó một cách idempotent. Journal\nghi dispatch id, backend snapshot reference, resource locator, lease/execution\nidentity và trạng thái allocation/collection/cleanup, không chứa credential.\nCallback cleanup chỉ là tối ưu trong process; recovery không phụ thuộc callback.\nReaper phải lấy recovery lease độc quyền, kiểm tra liveness bằng execution\nidentity chống PID reuse, dừng và xác nhận cả execution tree trước khi collect\nvà cleanup idempotent. Timeout/cancel cũng tuân cùng thứ tự. Không liên lạc được\nremote thì giữ unknown và cleanup pending, không suy agent đã dừng; reconnect\nhoặc backend lease-expiry có proof mới cho phép dọn. Resource chưa collect được\ngiữ cho recovery, không xóa vì agent đã exit. Startup reaper dùng cùng registry\nsetup/doctor; backend không có recovery contract này chưa được nhận required."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_d7fa39da9698c447594edefdc44d7ce5"
}
```

## Entry claim_daf2ec0996ad074a68903680fce85adb

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_daf2ec0996ad074a68903680fce85adb",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_daf2ec0996ad074a68903680fce85adb",
    "sourceUnitDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-49",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-114 (source lines 1117-1118) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-47 (candidate lines 381-382). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases",
      "8.6 Crash và cleanup"
    ]
  },
  "currentDecision": {
    "claimId": "claim_daf2ec0996ad074a68903680fce85adb",
    "sourceUnitDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-49",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-115 (source lines 1119-1120) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-49 (candidate lines 385-386). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases",
      "8.6 Crash và cleanup"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "6a1fda5c01985520210ebb5055c2c7e5e1ec433b86f13cc8bd396d3bc4c6cdd0",
    "identityFingerprint": "6a1fda5c01985520210ebb5055c2c7e5e1ec433b86f13cc8bd396d3bc4c6cdd0",
    "claimId": "claim_daf2ec0996ad074a68903680fce85adb",
    "sourceAnchor": "unheaded-block-115",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-115",
      "githubAnchor": "unheaded-block-115",
      "stableAnchor": "unheaded-block-115",
      "title": "Unheaded block 115",
      "startLine": 1119,
      "endLine": 1120,
      "textDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
      "sample": "Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu\ntrên, không phải triển khai journal/lease schema của remote.",
      "identityFingerprint": "6a1fda5c01985520210ebb5055c2c7e5e1ec433b86f13cc8bd396d3bc4c6cdd0",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "8. Policy resolution và edge cases",
        "8.6 Crash và cleanup"
      ],
      "text": "Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu\ntrên, không phải triển khai journal/lease schema của remote."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-49",
    "githubAnchor": "unheaded-block-49",
    "stableAnchor": "unheaded-block-49",
    "title": "Unheaded block 49",
    "startLine": 385,
    "endLine": 386,
    "textDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
    "sample": "Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu\ntrên, không phải triển khai journal/lease schema của remote.",
    "identityFingerprint": "6a1fda5c01985520210ebb5055c2c7e5e1ec433b86f13cc8bd396d3bc4c6cdd0",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases",
      "8.6 Crash và cleanup"
    ],
    "text": "Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu\ntrên, không phải triển khai journal/lease schema của remote."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-49",
      "githubAnchor": "unheaded-block-49",
      "stableAnchor": "unheaded-block-49",
      "title": "Unheaded block 49",
      "startLine": 385,
      "endLine": 386,
      "textDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
      "sample": "Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu\ntrên, không phải triển khai journal/lease schema của remote.",
      "identityFingerprint": "6a1fda5c01985520210ebb5055c2c7e5e1ec433b86f13cc8bd396d3bc4c6cdd0",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "8. Policy resolution và edge cases",
        "8.6 Crash và cleanup"
      ],
      "text": "Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu\ntrên, không phải triển khai journal/lease schema của remote."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_daf2ec0996ad074a68903680fce85adb"
}
```

## Entry claim_73ae83a090b77eed0e84212e99fa6e7c

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_73ae83a090b77eed0e84212e99fa6e7c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_73ae83a090b77eed0e84212e99fa6e7c",
    "sourceUnitDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-50",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-115 (source lines 1122-1132) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-48 (candidate lines 386-396). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases",
      "8.7 Bảng tình huống chuẩn"
    ]
  },
  "currentDecision": {
    "claimId": "claim_73ae83a090b77eed0e84212e99fa6e7c",
    "sourceUnitDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-50",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-116 (source lines 1124-1134) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-50 (candidate lines 390-400). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases",
      "8.7 Bảng tình huống chuẩn"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "afe1847641e6aab965dbcece2e6e37cdbcd97a1d81833ccc9e239479ab3e67ae",
    "identityFingerprint": "afe1847641e6aab965dbcece2e6e37cdbcd97a1d81833ccc9e239479ab3e67ae",
    "claimId": "claim_73ae83a090b77eed0e84212e99fa6e7c",
    "sourceAnchor": "unheaded-block-116",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-116",
      "githubAnchor": "unheaded-block-116",
      "stableAnchor": "unheaded-block-116",
      "title": "Unheaded block 116",
      "startLine": 1124,
      "endLine": 1134,
      "textDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
      "sample": "| Tình huống | Trước spawn | Kết quả cuối |\n|---|---|---|\n| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |\n| Required, proof sta",
      "identityFingerprint": "afe1847641e6aab965dbcece2e6e37cdbcd97a1d81833ccc9e239479ab3e67ae",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "8. Policy resolution và edge cases",
        "8.7 Bảng tình huống chuẩn"
      ],
      "text": "| Tình huống | Trước spawn | Kết quả cuối |\n|---|---|---|\n| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |\n| Required, proof stale | tự refresh probe trước spawn | pass thì execute; fail/timeout thì refused |\n| Preferred, thiếu network protection nhưng đủ needs | ghi degrade rồi execute phần đã assess | degraded |\n| Preferred không backend, need private home chưa có | refuse, zero spawn | refused |\n| Grant read-write, backend chỉ read, need read | coverage/readiness satisfied | có thể enforced |\n| Grant read-write, backend chỉ read, need write | readiness unsatisfied, zero spawn | refused ở mọi mode |\n| Prepare tạo resource rồi Authority crash | phục hồi theo profile (local marker hoặc journal) | unknown tới khi recovery có bằng chứng |\n| Remote mất kết nối sau started | không suy đã dừng | failed/unknown, cleanup pending |\n| Collect artifact thất bại | agent đã chạy, không refusal hồi tố | failed, giữ resource để thu lại |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-50",
    "githubAnchor": "unheaded-block-50",
    "stableAnchor": "unheaded-block-50",
    "title": "Unheaded block 50",
    "startLine": 390,
    "endLine": 400,
    "textDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "sample": "| Tình huống | Trước spawn | Kết quả cuối |\n|---|---|---|\n| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |\n| Required, proof sta",
    "identityFingerprint": "afe1847641e6aab965dbcece2e6e37cdbcd97a1d81833ccc9e239479ab3e67ae",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases",
      "8.7 Bảng tình huống chuẩn"
    ],
    "text": "| Tình huống | Trước spawn | Kết quả cuối |\n|---|---|---|\n| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |\n| Required, proof stale | tự refresh probe trước spawn | pass thì execute; fail/timeout thì refused |\n| Preferred, thiếu network protection nhưng đủ needs | ghi degrade rồi execute phần đã assess | degraded |\n| Preferred không backend, need private home chưa có | refuse, zero spawn | refused |\n| Grant read-write, backend chỉ read, need read | coverage/readiness satisfied | có thể enforced |\n| Grant read-write, backend chỉ read, need write | readiness unsatisfied, zero spawn | refused ở mọi mode |\n| Prepare tạo resource rồi Authority crash | phục hồi theo profile (local marker hoặc journal) | unknown tới khi recovery có bằng chứng |\n| Remote mất kết nối sau started | không suy đã dừng | failed/unknown, cleanup pending |\n| Collect artifact thất bại | agent đã chạy, không refusal hồi tố | failed, giữ resource để thu lại |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-50",
      "githubAnchor": "unheaded-block-50",
      "stableAnchor": "unheaded-block-50",
      "title": "Unheaded block 50",
      "startLine": 390,
      "endLine": 400,
      "textDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
      "sample": "| Tình huống | Trước spawn | Kết quả cuối |\n|---|---|---|\n| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |\n| Required, proof sta",
      "identityFingerprint": "afe1847641e6aab965dbcece2e6e37cdbcd97a1d81833ccc9e239479ab3e67ae",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "8. Policy resolution và edge cases",
        "8.7 Bảng tình huống chuẩn"
      ],
      "text": "| Tình huống | Trước spawn | Kết quả cuối |\n|---|---|---|\n| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |\n| Required, proof stale | tự refresh probe trước spawn | pass thì execute; fail/timeout thì refused |\n| Preferred, thiếu network protection nhưng đủ needs | ghi degrade rồi execute phần đã assess | degraded |\n| Preferred không backend, need private home chưa có | refuse, zero spawn | refused |\n| Grant read-write, backend chỉ read, need read | coverage/readiness satisfied | có thể enforced |\n| Grant read-write, backend chỉ read, need write | readiness unsatisfied, zero spawn | refused ở mọi mode |\n| Prepare tạo resource rồi Authority crash | phục hồi theo profile (local marker hoặc journal) | unknown tới khi recovery có bằng chứng |\n| Remote mất kết nối sau started | không suy đã dừng | failed/unknown, cleanup pending |\n| Collect artifact thất bại | agent đã chạy, không refusal hồi tố | failed, giữ resource để thu lại |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_73ae83a090b77eed0e84212e99fa6e7c"
}
```

## Entry claim_cc0d485b1b93357edb755f4121a26206

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_cc0d485b1b93357edb755f4121a26206",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_cc0d485b1b93357edb755f4121a26206",
    "sourceUnitDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-51",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Weak-exact: source unit shorter than 40 characters. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-116 (source lines 1136-1136) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-49 (candidate lines 400-400). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "currentDecision": {
    "claimId": "claim_cc0d485b1b93357edb755f4121a26206",
    "sourceUnitDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-51",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: source unit shorter than 40 characters. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-117 (source lines 1138-1138) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-51 (candidate lines 404-404). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "939f27292f5a04d3a26553f71cb92d8d72ec73eab1559fa5db6e7e9b1630c4e6",
    "identityFingerprint": "939f27292f5a04d3a26553f71cb92d8d72ec73eab1559fa5db6e7e9b1630c4e6",
    "claimId": "claim_cc0d485b1b93357edb755f4121a26206",
    "sourceAnchor": "unheaded-block-117",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-117",
      "githubAnchor": "unheaded-block-117",
      "stableAnchor": "unheaded-block-117",
      "title": "Unheaded block 117",
      "startLine": 1138,
      "endLine": 1138,
      "textDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
      "sample": "Default nhỏ nhất có ích:",
      "identityFingerprint": "939f27292f5a04d3a26553f71cb92d8d72ec73eab1559fa5db6e7e9b1630c4e6",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên"
      ],
      "text": "Default nhỏ nhất có ích:"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-51",
    "githubAnchor": "unheaded-block-51",
    "stableAnchor": "unheaded-block-51",
    "title": "Unheaded block 51",
    "startLine": 404,
    "endLine": 404,
    "textDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "sample": "Default nhỏ nhất có ích:",
    "identityFingerprint": "939f27292f5a04d3a26553f71cb92d8d72ec73eab1559fa5db6e7e9b1630c4e6",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "text": "Default nhỏ nhất có ích:"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "source unit shorter than 40 characters; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-51",
      "githubAnchor": "unheaded-block-51",
      "stableAnchor": "unheaded-block-51",
      "title": "Unheaded block 51",
      "startLine": 404,
      "endLine": 404,
      "textDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
      "sample": "Default nhỏ nhất có ích:",
      "identityFingerprint": "939f27292f5a04d3a26553f71cb92d8d72ec73eab1559fa5db6e7e9b1630c4e6",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên"
      ],
      "text": "Default nhỏ nhất có ích:"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_cc0d485b1b93357edb755f4121a26206"
}
```

## Entry claim_f1aeeff92e7bbf3f52b1cc88896cc41e

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_f1aeeff92e7bbf3f52b1cc88896cc41e",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_f1aeeff92e7bbf3f52b1cc88896cc41e",
    "sourceUnitDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-52",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-117 (source lines 1138-1157) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-50 (candidate lines 402-421). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "currentDecision": {
    "claimId": "claim_f1aeeff92e7bbf3f52b1cc88896cc41e",
    "sourceUnitDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-52",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-118 (source lines 1140-1159) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-52 (candidate lines 406-425). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "c5a27e4d9b3fd598b286624f2fcacdda0a4b496dababc62c22d0ca3ffa7e149c",
    "identityFingerprint": "c5a27e4d9b3fd598b286624f2fcacdda0a4b496dababc62c22d0ca3ffa7e149c",
    "claimId": "claim_f1aeeff92e7bbf3f52b1cc88896cc41e",
    "sourceAnchor": "unheaded-block-118",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-118",
      "githubAnchor": "unheaded-block-118",
      "stableAnchor": "unheaded-block-118",
      "title": "Unheaded block 118",
      "startLine": 1140,
      "endLine": 1159,
      "textDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
      "sample": "1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine\n   registry.\n2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):\n   `hostWrite: deny",
      "identityFingerprint": "c5a27e4d9b3fd598b286624f2fcacdda0a4b496dababc62c22d0ca3ffa7e149c",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên"
      ],
      "text": "1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine\n   registry.\n2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):\n   `hostWrite: deny`; host-write-denied cấp `run-output` và backend-managed\n   `private-home`; read grant `executor-credentials`;\n   `hostRead/networkEgress/process` lần lượt cho phép `allow/allow/host` và\n   không được trình bày như restriction;\n   workspace-write thêm workspace/git-metadata grant theo ownership/readiness;\n   private home tùy nhu cầu provider, không là control bắt buộc của built-in;\n   private home cho Codex được provider normalizer diễn tả bằng resource binding\n   chuẩn, backend không biết đó là Codex.\n3. Migration ba executor bwrap khỏi argv hardcode; mỗi executor tham chiếu\n   singular backend instance `bwrap`.\n4. Giữ tên `claude-bwrap`, `agy-bwrap`, `codex-bwrap` để không phá evidence\n   trail và capability binding.\n5. Shape cũ của herdr được normalize và đi qua cùng Authority. Việc di dời\n   provisioning khỏi `herdr-round.mjs` có thể ship sau, nhưng chưa di dời xong\n   thì maturity một cửa chỉ được ghi là `partial`.\n6. Mọi capability committed phải khai policy ID hoặc `unconfined` trước khi bật\n   strict mode."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-52",
    "githubAnchor": "unheaded-block-52",
    "stableAnchor": "unheaded-block-52",
    "title": "Unheaded block 52",
    "startLine": 406,
    "endLine": 425,
    "textDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
    "sample": "1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine\n   registry.\n2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):\n   `hostWrite: deny",
    "identityFingerprint": "c5a27e4d9b3fd598b286624f2fcacdda0a4b496dababc62c22d0ca3ffa7e149c",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "text": "1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine\n   registry.\n2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):\n   `hostWrite: deny`; host-write-denied cấp `run-output` và backend-managed\n   `private-home`; read grant `executor-credentials`;\n   `hostRead/networkEgress/process` lần lượt cho phép `allow/allow/host` và\n   không được trình bày như restriction;\n   workspace-write thêm workspace/git-metadata grant theo ownership/readiness;\n   private home tùy nhu cầu provider, không là control bắt buộc của built-in;\n   private home cho Codex được provider normalizer diễn tả bằng resource binding\n   chuẩn, backend không biết đó là Codex.\n3. Migration ba executor bwrap khỏi argv hardcode; mỗi executor tham chiếu\n   singular backend instance `bwrap`.\n4. Giữ tên `claude-bwrap`, `agy-bwrap`, `codex-bwrap` để không phá evidence\n   trail và capability binding.\n5. Shape cũ của herdr được normalize và đi qua cùng Authority. Việc di dời\n   provisioning khỏi `herdr-round.mjs` có thể ship sau, nhưng chưa di dời xong\n   thì maturity một cửa chỉ được ghi là `partial`.\n6. Mọi capability committed phải khai policy ID hoặc `unconfined` trước khi bật\n   strict mode."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-52",
      "githubAnchor": "unheaded-block-52",
      "stableAnchor": "unheaded-block-52",
      "title": "Unheaded block 52",
      "startLine": 406,
      "endLine": 425,
      "textDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
      "sample": "1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine\n   registry.\n2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):\n   `hostWrite: deny",
      "identityFingerprint": "c5a27e4d9b3fd598b286624f2fcacdda0a4b496dababc62c22d0ca3ffa7e149c",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên"
      ],
      "text": "1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine\n   registry.\n2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):\n   `hostWrite: deny`; host-write-denied cấp `run-output` và backend-managed\n   `private-home`; read grant `executor-credentials`;\n   `hostRead/networkEgress/process` lần lượt cho phép `allow/allow/host` và\n   không được trình bày như restriction;\n   workspace-write thêm workspace/git-metadata grant theo ownership/readiness;\n   private home tùy nhu cầu provider, không là control bắt buộc của built-in;\n   private home cho Codex được provider normalizer diễn tả bằng resource binding\n   chuẩn, backend không biết đó là Codex.\n3. Migration ba executor bwrap khỏi argv hardcode; mỗi executor tham chiếu\n   singular backend instance `bwrap`.\n4. Giữ tên `claude-bwrap`, `agy-bwrap`, `codex-bwrap` để không phá evidence\n   trail và capability binding.\n5. Shape cũ của herdr được normalize và đi qua cùng Authority. Việc di dời\n   provisioning khỏi `herdr-round.mjs` có thể ship sau, nhưng chưa di dời xong\n   thì maturity một cửa chỉ được ghi là `partial`.\n6. Mọi capability committed phải khai policy ID hoặc `unconfined` trước khi bật\n   strict mode."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_f1aeeff92e7bbf3f52b1cc88896cc41e"
}
```

## Entry claim_1538dad17e4fa44207a7f70dc2ca7b55

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_1538dad17e4fa44207a7f70dc2ca7b55",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_1538dad17e4fa44207a7f70dc2ca7b55",
    "sourceUnitDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-53",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-118 (source lines 1159-1162) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-51 (candidate lines 423-426). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "currentDecision": {
    "claimId": "claim_1538dad17e4fa44207a7f70dc2ca7b55",
    "sourceUnitDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-53",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-119 (source lines 1161-1164) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-53 (candidate lines 427-430). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "5f4c45abf90f2a4f9a86048568f1bcc5c85c3256b8ec6beb944a3be317f830b1",
    "identityFingerprint": "5f4c45abf90f2a4f9a86048568f1bcc5c85c3256b8ec6beb944a3be317f830b1",
    "claimId": "claim_1538dad17e4fa44207a7f70dc2ca7b55",
    "sourceAnchor": "unheaded-block-119",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-119",
      "githubAnchor": "unheaded-block-119",
      "stableAnchor": "unheaded-block-119",
      "title": "Unheaded block 119",
      "startLine": 1161,
      "endLine": 1164,
      "textDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
      "sample": "Trong default, host-write-denied giữ workspace read-only; workspace-write cho\nsửa workspace đã cấp. Capability execute/stage implement phải được migrate sang\nprofile có backend phù",
      "identityFingerprint": "5f4c45abf90f2a4f9a86048568f1bcc5c85c3256b8ec6beb944a3be317f830b1",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên"
      ],
      "text": "Trong default, host-write-denied giữ workspace read-only; workspace-write cho\nsửa workspace đã cấp. Capability execute/stage implement phải được migrate sang\nprofile có backend phù hợp trước strict flip; không đổi sang unconfined chỉ để\nqua gate. Git commit readiness là kiểm tra riêng như §6.3."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-53",
    "githubAnchor": "unheaded-block-53",
    "stableAnchor": "unheaded-block-53",
    "title": "Unheaded block 53",
    "startLine": 427,
    "endLine": 430,
    "textDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
    "sample": "Trong default, host-write-denied giữ workspace read-only; workspace-write cho\nsửa workspace đã cấp. Capability execute/stage implement phải được migrate sang\nprofile có backend phù",
    "identityFingerprint": "5f4c45abf90f2a4f9a86048568f1bcc5c85c3256b8ec6beb944a3be317f830b1",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "text": "Trong default, host-write-denied giữ workspace read-only; workspace-write cho\nsửa workspace đã cấp. Capability execute/stage implement phải được migrate sang\nprofile có backend phù hợp trước strict flip; không đổi sang unconfined chỉ để\nqua gate. Git commit readiness là kiểm tra riêng như §6.3."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-53",
      "githubAnchor": "unheaded-block-53",
      "stableAnchor": "unheaded-block-53",
      "title": "Unheaded block 53",
      "startLine": 427,
      "endLine": 430,
      "textDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
      "sample": "Trong default, host-write-denied giữ workspace read-only; workspace-write cho\nsửa workspace đã cấp. Capability execute/stage implement phải được migrate sang\nprofile có backend phù",
      "identityFingerprint": "5f4c45abf90f2a4f9a86048568f1bcc5c85c3256b8ec6beb944a3be317f830b1",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên"
      ],
      "text": "Trong default, host-write-denied giữ workspace read-only; workspace-write cho\nsửa workspace đã cấp. Capability execute/stage implement phải được migrate sang\nprofile có backend phù hợp trước strict flip; không đổi sang unconfined chỉ để\nqua gate. Git commit readiness là kiểm tra riêng như §6.3."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_1538dad17e4fa44207a7f70dc2ca7b55"
}
```

## Entry claim_daa730ce31dbd045d14a42c31c57f316

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_daa730ce31dbd045d14a42c31c57f316",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_daa730ce31dbd045d14a42c31c57f316",
    "sourceUnitDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-54",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-119 (source lines 1164-1165) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-52 (candidate lines 428-429). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "currentDecision": {
    "claimId": "claim_daa730ce31dbd045d14a42c31c57f316",
    "sourceUnitDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-54",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-120 (source lines 1166-1167) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-54 (candidate lines 432-433). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "6437ebff8e50a0bfa5fa389c6d0eae24e193e7fdcce066395abd75e6d1a1b285",
    "identityFingerprint": "6437ebff8e50a0bfa5fa389c6d0eae24e193e7fdcce066395abd75e6d1a1b285",
    "claimId": "claim_daa730ce31dbd045d14a42c31c57f316",
    "sourceAnchor": "unheaded-block-120",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-120",
      "githubAnchor": "unheaded-block-120",
      "stableAnchor": "unheaded-block-120",
      "title": "Unheaded block 120",
      "startLine": 1166,
      "endLine": 1167,
      "textDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
      "sample": "Default chưa cần network firewall, secret filtering, macOS/container/remote\nbackend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor.",
      "identityFingerprint": "6437ebff8e50a0bfa5fa389c6d0eae24e193e7fdcce066395abd75e6d1a1b285",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên"
      ],
      "text": "Default chưa cần network firewall, secret filtering, macOS/container/remote\nbackend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-54",
    "githubAnchor": "unheaded-block-54",
    "stableAnchor": "unheaded-block-54",
    "title": "Unheaded block 54",
    "startLine": 432,
    "endLine": 433,
    "textDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
    "sample": "Default chưa cần network firewall, secret filtering, macOS/container/remote\nbackend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor.",
    "identityFingerprint": "6437ebff8e50a0bfa5fa389c6d0eae24e193e7fdcce066395abd75e6d1a1b285",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "text": "Default chưa cần network firewall, secret filtering, macOS/container/remote\nbackend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-54",
      "githubAnchor": "unheaded-block-54",
      "stableAnchor": "unheaded-block-54",
      "title": "Unheaded block 54",
      "startLine": 432,
      "endLine": 433,
      "textDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
      "sample": "Default chưa cần network firewall, secret filtering, macOS/container/remote\nbackend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor.",
      "identityFingerprint": "6437ebff8e50a0bfa5fa389c6d0eae24e193e7fdcce066395abd75e6d1a1b285",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên"
      ],
      "text": "Default chưa cần network firewall, secret filtering, macOS/container/remote\nbackend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_daa730ce31dbd045d14a42c31c57f316"
}
```

## Entry claim_1a847c3e3266a47169a83f7ac836ef7b

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_1a847c3e3266a47169a83f7ac836ef7b",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_1a847c3e3266a47169a83f7ac836ef7b",
    "sourceUnitDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-55",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-120 (source lines 1169-1181) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-53 (candidate lines 433-445). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.1 Support matrix của default"
    ]
  },
  "currentDecision": {
    "claimId": "claim_1a847c3e3266a47169a83f7ac836ef7b",
    "sourceUnitDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-55",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-121 (source lines 1171-1183) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-55 (candidate lines 437-449). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.1 Support matrix của default"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "af529bc80b1dc6dd2725ebf4012fcb269af668ad35efa8cd0abe96ede6c9f503",
    "identityFingerprint": "af529bc80b1dc6dd2725ebf4012fcb269af668ad35efa8cd0abe96ede6c9f503",
    "claimId": "claim_1a847c3e3266a47169a83f7ac836ef7b",
    "sourceAnchor": "unheaded-block-121",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-121",
      "githubAnchor": "unheaded-block-121",
      "stableAnchor": "unheaded-block-121",
      "title": "Unheaded block 121",
      "startLine": 1171,
      "endLine": 1183,
      "textDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
      "sample": "| Contract surface | Default v1 |\n|---|---|\n| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |\n| Invocation override | Contract đ",
      "identityFingerprint": "af529bc80b1dc6dd2725ebf4012fcb269af668ad35efa8cd0abe96ede6c9f503",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.1 Support matrix của default"
      ],
      "text": "| Contract surface | Default v1 |\n|---|---|\n| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |\n| Invocation override | Contract đích giữ shape/partial-order; default v1 từ chối config override, dùng policy ID/capability khác — trừ một override duy nhất, `{ controls: { hostRead: 'blind' } }` (§9.2) |\n| `hostWrite` | `deny` qua bwrap, hoặc `allow` khi explicit `unconfined` |\n| Write grant | run-output, private-home khi cần; workspace/git-metadata cho workspace-write theo readiness |\n| Read grant | `executor-credentials` khi policy của dispatch yêu cầu |\n| `home` | host mặc định; private resource khi provider cần; home private nếu policy thực sự yêu cầu và đã prove |\n| `session`, `workspace` | effective value là `shared`; legacy `isolated/own` được normalize nhưng chưa di dời enforcement ở slice đầu |\n| `hostRead` | `allow`, hoặc `blind` (§9.2); request `deny` bị `unsupported` |\n| `networkEgress`, `process` | effective value là `allow`, `host`; request `deny/filtered/isolated` bị `unsupported` |\n| Resource delivery/collect | host direct/mount; copy/remote/workspace-change chưa hỗ trợ |\n| Backend | Linux bwrap; backend khác trả `unsupported` có lý do |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-55",
    "githubAnchor": "unheaded-block-55",
    "stableAnchor": "unheaded-block-55",
    "title": "Unheaded block 55",
    "startLine": 437,
    "endLine": 449,
    "textDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "sample": "| Contract surface | Default v1 |\n|---|---|\n| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |\n| Invocation override | Contract đ",
    "identityFingerprint": "af529bc80b1dc6dd2725ebf4012fcb269af668ad35efa8cd0abe96ede6c9f503",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.1 Support matrix của default"
    ],
    "text": "| Contract surface | Default v1 |\n|---|---|\n| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |\n| Invocation override | Contract đích giữ shape/partial-order; default v1 từ chối config override, dùng policy ID/capability khác — trừ một override duy nhất, `{ controls: { hostRead: 'blind' } }` (§9.2) |\n| `hostWrite` | `deny` qua bwrap, hoặc `allow` khi explicit `unconfined` |\n| Write grant | run-output, private-home khi cần; workspace/git-metadata cho workspace-write theo readiness |\n| Read grant | `executor-credentials` khi policy của dispatch yêu cầu |\n| `home` | host mặc định; private resource khi provider cần; home private nếu policy thực sự yêu cầu và đã prove |\n| `session`, `workspace` | effective value là `shared`; legacy `isolated/own` được normalize nhưng chưa di dời enforcement ở slice đầu |\n| `hostRead` | `allow`, hoặc `blind` (§9.2); request `deny` bị `unsupported` |\n| `networkEgress`, `process` | effective value là `allow`, `host`; request `deny/filtered/isolated` bị `unsupported` |\n| Resource delivery/collect | host direct/mount; copy/remote/workspace-change chưa hỗ trợ |\n| Backend | Linux bwrap; backend khác trả `unsupported` có lý do |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-55",
      "githubAnchor": "unheaded-block-55",
      "stableAnchor": "unheaded-block-55",
      "title": "Unheaded block 55",
      "startLine": 437,
      "endLine": 449,
      "textDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
      "sample": "| Contract surface | Default v1 |\n|---|---|\n| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |\n| Invocation override | Contract đ",
      "identityFingerprint": "af529bc80b1dc6dd2725ebf4012fcb269af668ad35efa8cd0abe96ede6c9f503",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.1 Support matrix của default"
      ],
      "text": "| Contract surface | Default v1 |\n|---|---|\n| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |\n| Invocation override | Contract đích giữ shape/partial-order; default v1 từ chối config override, dùng policy ID/capability khác — trừ một override duy nhất, `{ controls: { hostRead: 'blind' } }` (§9.2) |\n| `hostWrite` | `deny` qua bwrap, hoặc `allow` khi explicit `unconfined` |\n| Write grant | run-output, private-home khi cần; workspace/git-metadata cho workspace-write theo readiness |\n| Read grant | `executor-credentials` khi policy của dispatch yêu cầu |\n| `home` | host mặc định; private resource khi provider cần; home private nếu policy thực sự yêu cầu và đã prove |\n| `session`, `workspace` | effective value là `shared`; legacy `isolated/own` được normalize nhưng chưa di dời enforcement ở slice đầu |\n| `hostRead` | `allow`, hoặc `blind` (§9.2); request `deny` bị `unsupported` |\n| `networkEgress`, `process` | effective value là `allow`, `host`; request `deny/filtered/isolated` bị `unsupported` |\n| Resource delivery/collect | host direct/mount; copy/remote/workspace-change chưa hỗ trợ |\n| Backend | Linux bwrap; backend khác trả `unsupported` có lý do |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_1a847c3e3266a47169a83f7ac836ef7b"
}
```

## Entry claim_d4bc3fb932ca2d29e917119191f45f1c

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_d4bc3fb932ca2d29e917119191f45f1c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_d4bc3fb932ca2d29e917119191f45f1c",
    "sourceUnitDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-56",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-121 (source lines 1183-1184) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-54 (candidate lines 447-448). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.1 Support matrix của default"
    ]
  },
  "currentDecision": {
    "claimId": "claim_d4bc3fb932ca2d29e917119191f45f1c",
    "sourceUnitDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-56",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-122 (source lines 1185-1186) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-56 (candidate lines 451-452). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.1 Support matrix của default"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "a47f66258b78b44aa166b2faf755f7afe52a56fbbc6d8b443faf60e128c0fd62",
    "identityFingerprint": "a47f66258b78b44aa166b2faf755f7afe52a56fbbc6d8b443faf60e128c0fd62",
    "claimId": "claim_d4bc3fb932ca2d29e917119191f45f1c",
    "sourceAnchor": "unheaded-block-122",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-122",
      "githubAnchor": "unheaded-block-122",
      "stableAnchor": "unheaded-block-122",
      "title": "Unheaded block 122",
      "startLine": 1185,
      "endLine": 1186,
      "textDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
      "sample": "Việc parser hiểu một field không có nghĩa backend đã support field đó. Default\nphải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua.",
      "identityFingerprint": "a47f66258b78b44aa166b2faf755f7afe52a56fbbc6d8b443faf60e128c0fd62",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.1 Support matrix của default"
      ],
      "text": "Việc parser hiểu một field không có nghĩa backend đã support field đó. Default\nphải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-56",
    "githubAnchor": "unheaded-block-56",
    "stableAnchor": "unheaded-block-56",
    "title": "Unheaded block 56",
    "startLine": 451,
    "endLine": 452,
    "textDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
    "sample": "Việc parser hiểu một field không có nghĩa backend đã support field đó. Default\nphải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua.",
    "identityFingerprint": "a47f66258b78b44aa166b2faf755f7afe52a56fbbc6d8b443faf60e128c0fd62",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.1 Support matrix của default"
    ],
    "text": "Việc parser hiểu một field không có nghĩa backend đã support field đó. Default\nphải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-56",
      "githubAnchor": "unheaded-block-56",
      "stableAnchor": "unheaded-block-56",
      "title": "Unheaded block 56",
      "startLine": 451,
      "endLine": 452,
      "textDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
      "sample": "Việc parser hiểu một field không có nghĩa backend đã support field đó. Default\nphải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua.",
      "identityFingerprint": "a47f66258b78b44aa166b2faf755f7afe52a56fbbc6d8b443faf60e128c0fd62",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.1 Support matrix của default"
      ],
      "text": "Việc parser hiểu một field không có nghĩa backend đã support field đó. Default\nphải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_d4bc3fb932ca2d29e917119191f45f1c"
}
```

## Entry claim_68dd1d19379c9a16393429b5e2aac34a

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_68dd1d19379c9a16393429b5e2aac34a",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_68dd1d19379c9a16393429b5e2aac34a",
    "sourceUnitDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-57",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-122 (source lines 1188-1192) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-55 (candidate lines 452-456). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "currentDecision": {
    "claimId": "claim_68dd1d19379c9a16393429b5e2aac34a",
    "sourceUnitDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-57",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-123 (source lines 1190-1194) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-57 (candidate lines 456-460). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "4938e6c7567c76d0df9a989ca7117af8fb8e81a2825f6e1caff9b18b4aa98acc",
    "identityFingerprint": "4938e6c7567c76d0df9a989ca7117af8fb8e81a2825f6e1caff9b18b4aa98acc",
    "claimId": "claim_68dd1d19379c9a16393429b5e2aac34a",
    "sourceAnchor": "unheaded-block-123",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-123",
      "githubAnchor": "unheaded-block-123",
      "stableAnchor": "unheaded-block-123",
      "title": "Unheaded block 123",
      "startLine": 1190,
      "endLine": 1194,
      "textDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
      "sample": "`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,\ntrừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một overr",
      "identityFingerprint": "4938e6c7567c76d0df9a989ca7117af8fb8e81a2825f6e1caff9b18b4aa98acc",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,\ntrừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một override\nchỉ-thu-hẹp qua slot `override` của request (Unit mang `blind: true`, mọi vai của Unit đó đều\nmù); built-in policy không đổi, không có policy ID mới. Mặc định tắt: argv của dispatch không\n`blind` giữ nguyên từng byte."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-57",
    "githubAnchor": "unheaded-block-57",
    "stableAnchor": "unheaded-block-57",
    "title": "Unheaded block 57",
    "startLine": 456,
    "endLine": 460,
    "textDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "sample": "`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,\ntrừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một overr",
    "identityFingerprint": "4938e6c7567c76d0df9a989ca7117af8fb8e81a2825f6e1caff9b18b4aa98acc",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ],
    "text": "`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,\ntrừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một override\nchỉ-thu-hẹp qua slot `override` của request (Unit mang `blind: true`, mọi vai của Unit đó đều\nmù); built-in policy không đổi, không có policy ID mới. Mặc định tắt: argv của dispatch không\n`blind` giữ nguyên từng byte."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-57",
      "githubAnchor": "unheaded-block-57",
      "stableAnchor": "unheaded-block-57",
      "title": "Unheaded block 57",
      "startLine": 456,
      "endLine": 460,
      "textDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
      "sample": "`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,\ntrừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một overr",
      "identityFingerprint": "4938e6c7567c76d0df9a989ca7117af8fb8e81a2825f6e1caff9b18b4aa98acc",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,\ntrừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một override\nchỉ-thu-hẹp qua slot `override` của request (Unit mang `blind: true`, mọi vai của Unit đó đều\nmù); built-in policy không đổi, không có policy ID mới. Mặc định tắt: argv của dispatch không\n`blind` giữ nguyên từng byte."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_68dd1d19379c9a16393429b5e2aac34a"
}
```

## Entry claim_b1731956c352b9977eef7ffa07f88991

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_b1731956c352b9977eef7ffa07f88991",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_b1731956c352b9977eef7ffa07f88991",
    "sourceUnitDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-58",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-123 (source lines 1194-1203) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-56 (candidate lines 458-467). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "currentDecision": {
    "claimId": "claim_b1731956c352b9977eef7ffa07f88991",
    "sourceUnitDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-58",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-124 (source lines 1196-1205) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-58 (candidate lines 462-471). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "4a38ae1622ec5454712f92237ad8feed19e54b64a51650533fee85d0b674ada7",
    "identityFingerprint": "4a38ae1622ec5454712f92237ad8feed19e54b64a51650533fee85d0b674ada7",
    "claimId": "claim_b1731956c352b9977eef7ffa07f88991",
    "sourceAnchor": "unheaded-block-124",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-124",
      "githubAnchor": "unheaded-block-124",
      "stableAnchor": "unheaded-block-124",
      "title": "Unheaded block 124",
      "startLine": 1196,
      "endLine": 1205,
      "textDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
      "sample": "Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn\n`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn t",
      "identityFingerprint": "4a38ae1622ec5454712f92237ad8feed19e54b64a51650533fee85d0b674ada7",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn\n`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn tại;\n`--ro-bind` thư mục của chính dispatch (round dir `<assignments>/<unit run>/<role>/<round>`,\nhoặc run dir nếu không có assignment) chỉ-đọc; các mount nằm dưới mask (outbox ghi được, private\nhome); cuối cùng `--remount-ro` trên các mask. Hidden root là dữ liệu của contract\n(`BLIND_HIDDEN_ROOTS`), không phải code của driver: `{fgosDir}/assignments`,\n`{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` của project dispatch đang chạy, thư mục\nsocket của herdr, và confinement temp root (private home của dispatch khác, chứa transcript agent).\nResource `hidden-root` và `own-assignment` đi vào plan/attestation; attestation ghi thêm\n`requested.override`, `effectiveControls.hostRead: blind` và `hiddenRoots`."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-58",
    "githubAnchor": "unheaded-block-58",
    "stableAnchor": "unheaded-block-58",
    "title": "Unheaded block 58",
    "startLine": 462,
    "endLine": 471,
    "textDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
    "sample": "Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn\n`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn t",
    "identityFingerprint": "4a38ae1622ec5454712f92237ad8feed19e54b64a51650533fee85d0b674ada7",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ],
    "text": "Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn\n`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn tại;\n`--ro-bind` thư mục của chính dispatch (round dir `<assignments>/<unit run>/<role>/<round>`,\nhoặc run dir nếu không có assignment) chỉ-đọc; các mount nằm dưới mask (outbox ghi được, private\nhome); cuối cùng `--remount-ro` trên các mask. Hidden root là dữ liệu của contract\n(`BLIND_HIDDEN_ROOTS`), không phải code của driver: `{fgosDir}/assignments`,\n`{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` của project dispatch đang chạy, thư mục\nsocket của herdr, và confinement temp root (private home của dispatch khác, chứa transcript agent).\nResource `hidden-root` và `own-assignment` đi vào plan/attestation; attestation ghi thêm\n`requested.override`, `effectiveControls.hostRead: blind` và `hiddenRoots`."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-58",
      "githubAnchor": "unheaded-block-58",
      "stableAnchor": "unheaded-block-58",
      "title": "Unheaded block 58",
      "startLine": 462,
      "endLine": 471,
      "textDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
      "sample": "Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn\n`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn t",
      "identityFingerprint": "4a38ae1622ec5454712f92237ad8feed19e54b64a51650533fee85d0b674ada7",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn\n`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn tại;\n`--ro-bind` thư mục của chính dispatch (round dir `<assignments>/<unit run>/<role>/<round>`,\nhoặc run dir nếu không có assignment) chỉ-đọc; các mount nằm dưới mask (outbox ghi được, private\nhome); cuối cùng `--remount-ro` trên các mask. Hidden root là dữ liệu của contract\n(`BLIND_HIDDEN_ROOTS`), không phải code của driver: `{fgosDir}/assignments`,\n`{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` của project dispatch đang chạy, thư mục\nsocket của herdr, và confinement temp root (private home của dispatch khác, chứa transcript agent).\nResource `hidden-root` và `own-assignment` đi vào plan/attestation; attestation ghi thêm\n`requested.override`, `effectiveControls.hostRead: blind` và `hiddenRoots`."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_b1731956c352b9977eef7ffa07f88991"
}
```

## Entry claim_54f630d44a33c5624ebeca834cf25ceb

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_54f630d44a33c5624ebeca834cf25ceb",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_54f630d44a33c5624ebeca834cf25ceb",
    "sourceUnitDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-59",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-124 (source lines 1205-1220) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-57 (candidate lines 469-484). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "currentDecision": {
    "claimId": "claim_54f630d44a33c5624ebeca834cf25ceb",
    "sourceUnitDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-59",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-125 (source lines 1207-1222) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-59 (candidate lines 473-488). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "3548ae4ac9be2f8c7d818cc88b96df1b59f595c7597bf8ce31b098fb1d4f23ec",
    "identityFingerprint": "3548ae4ac9be2f8c7d818cc88b96df1b59f595c7597bf8ce31b098fb1d4f23ec",
    "claimId": "claim_54f630d44a33c5624ebeca834cf25ceb",
    "sourceAnchor": "unheaded-block-125",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-125",
      "githubAnchor": "unheaded-block-125",
      "stableAnchor": "unheaded-block-125",
      "title": "Unheaded block 125",
      "startLine": 1207,
      "endLine": 1222,
      "textDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
      "sample": "Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file\ntracked (config, events) — che cả thư mục làm chúng hiện thành \"đã xoá\" trong trạng th",
      "identityFingerprint": "3548ae4ac9be2f8c7d818cc88b96df1b59f595c7597bf8ce31b098fb1d4f23ec",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file\ntracked (config, events) — che cả thư mục làm chúng hiện thành \"đã xoá\" trong trạng thái checkout,\nvà worker ghi được workspace có thể commit việc xoá đó; (2) `--unshare-pid` vì không có nó worker\nđọc được cmdline của tiến trình anh em; (3) socket herdr nằm trong danh sách vì `--ro-bind / /`\nvẫn cho `connect()`, tức worker có thể `pane read` pane của anh em. Blind chỉ dùng được khi cái\nworker *được trao* nằm sẵn trong thư mục của chính nó, nên với Unit `blind` resolver hand-off\n(`resolveUnitInputs`, `src/runner/execution/handoff-refs.mjs`) không giao đường dẫn gốc: mọi input\n`unit-run:`, `gate-answer:` và mọi ref nằm trong hidden root được chép nguyên byte (kiểm lại sha256\nlúc chép; nguồn đã đổi sau settle thì từ chối `report-changed-after-settle`) vào `inputs/` của\n*round dir của chính vai đó* (`<round>/inputs/<tên>`), vô điều kiện, không cần `anonymizeInputs`; tên\ntrung tính `seat-A...` cho input `unit-run:` khi `anonymizeInputs` bật, tên cố định `<n>-<vai>-r<vòng>`\nhoặc `<n>-gate-<bước>` nếu không. Mỗi vai một bản riêng (không chia sẻ giữa các vai của Unit), nên\nchỉ vai đó đọc được; danh sách ref của vai là các bản chép. `unit.json` giữ `resolvedInputs` (ref\nđọc được tại chỗ) và `inputMap` (nguồn, tên, sha256); resume dùng lại bản chép đã có, fallback chép\nlại vào round dir của lần thử mới. Synthesizer của pattern `panel` nhận report của panelist theo\nđúng cách đó. `blind-ref-hidden` chỉ còn cho ref không chép được."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-59",
    "githubAnchor": "unheaded-block-59",
    "stableAnchor": "unheaded-block-59",
    "title": "Unheaded block 59",
    "startLine": 473,
    "endLine": 488,
    "textDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
    "sample": "Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file\ntracked (config, events) — che cả thư mục làm chúng hiện thành \"đã xoá\" trong trạng th",
    "identityFingerprint": "3548ae4ac9be2f8c7d818cc88b96df1b59f595c7597bf8ce31b098fb1d4f23ec",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ],
    "text": "Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file\ntracked (config, events) — che cả thư mục làm chúng hiện thành \"đã xoá\" trong trạng thái checkout,\nvà worker ghi được workspace có thể commit việc xoá đó; (2) `--unshare-pid` vì không có nó worker\nđọc được cmdline của tiến trình anh em; (3) socket herdr nằm trong danh sách vì `--ro-bind / /`\nvẫn cho `connect()`, tức worker có thể `pane read` pane của anh em. Blind chỉ dùng được khi cái\nworker *được trao* nằm sẵn trong thư mục của chính nó, nên với Unit `blind` resolver hand-off\n(`resolveUnitInputs`, `src/runner/execution/handoff-refs.mjs`) không giao đường dẫn gốc: mọi input\n`unit-run:`, `gate-answer:` và mọi ref nằm trong hidden root được chép nguyên byte (kiểm lại sha256\nlúc chép; nguồn đã đổi sau settle thì từ chối `report-changed-after-settle`) vào `inputs/` của\n*round dir của chính vai đó* (`<round>/inputs/<tên>`), vô điều kiện, không cần `anonymizeInputs`; tên\ntrung tính `seat-A...` cho input `unit-run:` khi `anonymizeInputs` bật, tên cố định `<n>-<vai>-r<vòng>`\nhoặc `<n>-gate-<bước>` nếu không. Mỗi vai một bản riêng (không chia sẻ giữa các vai của Unit), nên\nchỉ vai đó đọc được; danh sách ref của vai là các bản chép. `unit.json` giữ `resolvedInputs` (ref\nđọc được tại chỗ) và `inputMap` (nguồn, tên, sha256); resume dùng lại bản chép đã có, fallback chép\nlại vào round dir của lần thử mới. Synthesizer của pattern `panel` nhận report của panelist theo\nđúng cách đó. `blind-ref-hidden` chỉ còn cho ref không chép được."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-59",
      "githubAnchor": "unheaded-block-59",
      "stableAnchor": "unheaded-block-59",
      "title": "Unheaded block 59",
      "startLine": 473,
      "endLine": 488,
      "textDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
      "sample": "Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file\ntracked (config, events) — che cả thư mục làm chúng hiện thành \"đã xoá\" trong trạng th",
      "identityFingerprint": "3548ae4ac9be2f8c7d818cc88b96df1b59f595c7597bf8ce31b098fb1d4f23ec",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file\ntracked (config, events) — che cả thư mục làm chúng hiện thành \"đã xoá\" trong trạng thái checkout,\nvà worker ghi được workspace có thể commit việc xoá đó; (2) `--unshare-pid` vì không có nó worker\nđọc được cmdline của tiến trình anh em; (3) socket herdr nằm trong danh sách vì `--ro-bind / /`\nvẫn cho `connect()`, tức worker có thể `pane read` pane của anh em. Blind chỉ dùng được khi cái\nworker *được trao* nằm sẵn trong thư mục của chính nó, nên với Unit `blind` resolver hand-off\n(`resolveUnitInputs`, `src/runner/execution/handoff-refs.mjs`) không giao đường dẫn gốc: mọi input\n`unit-run:`, `gate-answer:` và mọi ref nằm trong hidden root được chép nguyên byte (kiểm lại sha256\nlúc chép; nguồn đã đổi sau settle thì từ chối `report-changed-after-settle`) vào `inputs/` của\n*round dir của chính vai đó* (`<round>/inputs/<tên>`), vô điều kiện, không cần `anonymizeInputs`; tên\ntrung tính `seat-A...` cho input `unit-run:` khi `anonymizeInputs` bật, tên cố định `<n>-<vai>-r<vòng>`\nhoặc `<n>-gate-<bước>` nếu không. Mỗi vai một bản riêng (không chia sẻ giữa các vai của Unit), nên\nchỉ vai đó đọc được; danh sách ref của vai là các bản chép. `unit.json` giữ `resolvedInputs` (ref\nđọc được tại chỗ) và `inputMap` (nguồn, tên, sha256); resume dùng lại bản chép đã có, fallback chép\nlại vào round dir của lần thử mới. Synthesizer của pattern `panel` nhận report của panelist theo\nđúng cách đó. `blind-ref-hidden` chỉ còn cho ref không chép được."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_54f630d44a33c5624ebeca834cf25ceb"
}
```

## Entry claim_220b8163566ad8b38cbf1d534c871e42

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_220b8163566ad8b38cbf1d534c871e42",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_220b8163566ad8b38cbf1d534c871e42",
    "sourceUnitDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-60",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-125 (source lines 1222-1229) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-58 (candidate lines 486-493). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "currentDecision": {
    "claimId": "claim_220b8163566ad8b38cbf1d534c871e42",
    "sourceUnitDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-60",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-126 (source lines 1224-1231) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-60 (candidate lines 490-497). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "a3210dd0ebe893f20977d38eaad3c9a57ceb312096f517c8d17d704f8881f61b",
    "identityFingerprint": "a3210dd0ebe893f20977d38eaad3c9a57ceb312096f517c8d17d704f8881f61b",
    "claimId": "claim_220b8163566ad8b38cbf1d534c871e42",
    "sourceAnchor": "unheaded-block-126",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-126",
      "githubAnchor": "unheaded-block-126",
      "stableAnchor": "unheaded-block-126",
      "title": "Unheaded block 126",
      "startLine": 1224,
      "endLine": 1231,
      "textDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
      "sample": "Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn\ntuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi he",
      "identityFingerprint": "a3210dd0ebe893f20977d38eaad3c9a57ceb312096f517c8d17d704f8881f61b",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn\ntuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi herdr), glm và\ndeepseek (pi cli bwrap) đều đọc bản chép, gặp `ENOENT` ở nguồn và chỉ thấy chuỗi của chính mình\ntrong `.fgos/assignments`. Dưới `--unshare-pid` và mask thư mục socket herdr, herdr vẫn nhận ra agent\ntrong pane (`agentKnownToHerdr: detected`, trạng thái `unknown` → `working` → `idle`/kết thúc), nên\nmask và `--unshare-pid` giữ nguyên. agy chưa chứng minh được: `agy-herdr` hỏng cả khi không blind\n(`foreground process ... does not match prepared command argv`), `agy-cli-bwrap` dừng vì hết quota\ncủa tài khoản."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-60",
    "githubAnchor": "unheaded-block-60",
    "stableAnchor": "unheaded-block-60",
    "title": "Unheaded block 60",
    "startLine": 490,
    "endLine": 497,
    "textDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
    "sample": "Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn\ntuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi he",
    "identityFingerprint": "a3210dd0ebe893f20977d38eaad3c9a57ceb312096f517c8d17d704f8881f61b",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ],
    "text": "Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn\ntuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi herdr), glm và\ndeepseek (pi cli bwrap) đều đọc bản chép, gặp `ENOENT` ở nguồn và chỉ thấy chuỗi của chính mình\ntrong `.fgos/assignments`. Dưới `--unshare-pid` và mask thư mục socket herdr, herdr vẫn nhận ra agent\ntrong pane (`agentKnownToHerdr: detected`, trạng thái `unknown` → `working` → `idle`/kết thúc), nên\nmask và `--unshare-pid` giữ nguyên. agy chưa chứng minh được: `agy-herdr` hỏng cả khi không blind\n(`foreground process ... does not match prepared command argv`), `agy-cli-bwrap` dừng vì hết quota\ncủa tài khoản."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-60",
      "githubAnchor": "unheaded-block-60",
      "stableAnchor": "unheaded-block-60",
      "title": "Unheaded block 60",
      "startLine": 490,
      "endLine": 497,
      "textDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
      "sample": "Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn\ntuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi he",
      "identityFingerprint": "a3210dd0ebe893f20977d38eaad3c9a57ceb312096f517c8d17d704f8881f61b",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn\ntuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi herdr), glm và\ndeepseek (pi cli bwrap) đều đọc bản chép, gặp `ENOENT` ở nguồn và chỉ thấy chuỗi của chính mình\ntrong `.fgos/assignments`. Dưới `--unshare-pid` và mask thư mục socket herdr, herdr vẫn nhận ra agent\ntrong pane (`agentKnownToHerdr: detected`, trạng thái `unknown` → `working` → `idle`/kết thúc), nên\nmask và `--unshare-pid` giữ nguyên. agy chưa chứng minh được: `agy-herdr` hỏng cả khi không blind\n(`foreground process ... does not match prepared command argv`), `agy-cli-bwrap` dừng vì hết quota\ncủa tài khoản."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_220b8163566ad8b38cbf1d534c871e42"
}
```

## Entry claim_9d863e7c1e4c3983292845628b60e041

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_9d863e7c1e4c3983292845628b60e041",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_9d863e7c1e4c3983292845628b60e041",
    "sourceUnitDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-61",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-126 (source lines 1231-1243) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-59 (candidate lines 495-507). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "currentDecision": {
    "claimId": "claim_9d863e7c1e4c3983292845628b60e041",
    "sourceUnitDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-61",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-127 (source lines 1233-1245) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-61 (candidate lines 499-511). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "f70870c5e32af26c81575c163e34438c8e9fbe0acdec1c7b6da7681c0f3abfc3",
    "identityFingerprint": "f70870c5e32af26c81575c163e34438c8e9fbe0acdec1c7b6da7681c0f3abfc3",
    "claimId": "claim_9d863e7c1e4c3983292845628b60e041",
    "sourceAnchor": "unheaded-block-127",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-127",
      "githubAnchor": "unheaded-block-127",
      "stableAnchor": "unheaded-block-127",
      "title": "Unheaded block 127",
      "startLine": 1233,
      "endLine": 1245,
      "textDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
      "sample": "Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi\nspawn: `blind-requires-confinement` (mode không phải `required`/không có policy),\n`blin",
      "identityFingerprint": "f70870c5e32af26c81575c163e34438c8e9fbe0acdec1c7b6da7681c0f3abfc3",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi\nspawn: `blind-requires-confinement` (mode không phải `required`/không có policy),\n`blind-in-process` (Agent tool/inline không có sandbox quanh worker; `bind()` cũng không chọn nó),\n`blind-hides-workspace` (cwd hoặc repo root nằm trong hidden root), `blind-ref-hidden` (context\nref nằm trong hidden root ngoài thư mục của chính dispatch), `confinement-backend-missing` /\n`confinement-backend-disabled` (không có bwrap), `confinement-probe-failed` (probe chưa tươi hoặc\nkhông qua). Probe `peer-run-hidden` (thứ chín, chỉ cho dispatch blind; fingerprint và cache riêng)\ndựng argv từ chính `prepareBwrap`: worker không đọc được report của peer, home của peer, cmdline\ncủa tiến trình anh em, nhưng đọc được thư mục của mình (chỉ-đọc) và ghi được outbox; falsifier bỏ\nmask thì phải đọc được file peer. `fgos doctor` báo `blind-read: pass | fail |\nbackend-unsupported` (check `confinement-blind-read`). Giới hạn còn mở: transcript agent của Lead\ntrong host home, `.fgos/secrets.local.env` và project khác (bí mật, không phải mù), và mạng\nlocalhost."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-61",
    "githubAnchor": "unheaded-block-61",
    "stableAnchor": "unheaded-block-61",
    "title": "Unheaded block 61",
    "startLine": 499,
    "endLine": 511,
    "textDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
    "sample": "Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi\nspawn: `blind-requires-confinement` (mode không phải `required`/không có policy),\n`blin",
    "identityFingerprint": "f70870c5e32af26c81575c163e34438c8e9fbe0acdec1c7b6da7681c0f3abfc3",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên",
      "9.2 `hostRead: blind` — worker mù trước run state của peer"
    ],
    "text": "Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi\nspawn: `blind-requires-confinement` (mode không phải `required`/không có policy),\n`blind-in-process` (Agent tool/inline không có sandbox quanh worker; `bind()` cũng không chọn nó),\n`blind-hides-workspace` (cwd hoặc repo root nằm trong hidden root), `blind-ref-hidden` (context\nref nằm trong hidden root ngoài thư mục của chính dispatch), `confinement-backend-missing` /\n`confinement-backend-disabled` (không có bwrap), `confinement-probe-failed` (probe chưa tươi hoặc\nkhông qua). Probe `peer-run-hidden` (thứ chín, chỉ cho dispatch blind; fingerprint và cache riêng)\ndựng argv từ chính `prepareBwrap`: worker không đọc được report của peer, home của peer, cmdline\ncủa tiến trình anh em, nhưng đọc được thư mục của mình (chỉ-đọc) và ghi được outbox; falsifier bỏ\nmask thì phải đọc được file peer. `fgos doctor` báo `blind-read: pass | fail |\nbackend-unsupported` (check `confinement-blind-read`). Giới hạn còn mở: transcript agent của Lead\ntrong host home, `.fgos/secrets.local.env` và project khác (bí mật, không phải mù), và mạng\nlocalhost."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-61",
      "githubAnchor": "unheaded-block-61",
      "stableAnchor": "unheaded-block-61",
      "title": "Unheaded block 61",
      "startLine": 499,
      "endLine": 511,
      "textDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
      "sample": "Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi\nspawn: `blind-requires-confinement` (mode không phải `required`/không có policy),\n`blin",
      "identityFingerprint": "f70870c5e32af26c81575c163e34438c8e9fbe0acdec1c7b6da7681c0f3abfc3",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "9. Default implementation đầu tiên",
        "9.2 `hostRead: blind` — worker mù trước run state của peer"
      ],
      "text": "Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi\nspawn: `blind-requires-confinement` (mode không phải `required`/không có policy),\n`blind-in-process` (Agent tool/inline không có sandbox quanh worker; `bind()` cũng không chọn nó),\n`blind-hides-workspace` (cwd hoặc repo root nằm trong hidden root), `blind-ref-hidden` (context\nref nằm trong hidden root ngoài thư mục của chính dispatch), `confinement-backend-missing` /\n`confinement-backend-disabled` (không có bwrap), `confinement-probe-failed` (probe chưa tươi hoặc\nkhông qua). Probe `peer-run-hidden` (thứ chín, chỉ cho dispatch blind; fingerprint và cache riêng)\ndựng argv từ chính `prepareBwrap`: worker không đọc được report của peer, home của peer, cmdline\ncủa tiến trình anh em, nhưng đọc được thư mục của mình (chỉ-đọc) và ghi được outbox; falsifier bỏ\nmask thì phải đọc được file peer. `fgos doctor` báo `blind-read: pass | fail |\nbackend-unsupported` (check `confinement-blind-read`). Giới hạn còn mở: transcript agent của Lead\ntrong host home, `.fgos/secrets.local.env` và project khác (bí mật, không phải mù), và mạng\nlocalhost."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_9d863e7c1e4c3983292845628b60e041"
}
```

## Entry claim_bb5abf5828264d19c061b9b0920618a3

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_bb5abf5828264d19c061b9b0920618a3",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_bb5abf5828264d19c061b9b0920618a3",
    "sourceUnitDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-62",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-129 (source lines 1264-1272) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-60 (candidate lines 513-521). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.1 Contract tests"
    ]
  },
  "currentDecision": {
    "claimId": "claim_bb5abf5828264d19c061b9b0920618a3",
    "sourceUnitDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-62",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-130 (source lines 1266-1274) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-62 (candidate lines 517-525). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.1 Contract tests"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "b23f66e12db59d98e2df27a14c7953e28d9d2a82b8d761c306b4e401a7c38cab",
    "identityFingerprint": "b23f66e12db59d98e2df27a14c7953e28d9d2a82b8d761c306b4e401a7c38cab",
    "claimId": "claim_bb5abf5828264d19c061b9b0920618a3",
    "sourceAnchor": "unheaded-block-130",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-130",
      "githubAnchor": "unheaded-block-130",
      "stableAnchor": "unheaded-block-130",
      "title": "Unheaded block 130",
      "startLine": 1266,
      "endLine": 1274,
      "textDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
      "sample": "- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,\n  policy thiếu và override hạ policy.\n- Project-over-global merge được validate lại.\n- Project config k",
      "identityFingerprint": "b23f66e12db59d98e2df27a14c7953e28d9d2a82b8d761c306b4e401a7c38cab",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.1 Contract tests"
      ],
      "text": "- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,\n  policy thiếu và override hạ policy.\n- Project-over-global merge được validate lại.\n- Project config không thể định nghĩa hoặc override machine backend instance.\n- Mọi capability resolve thành policy ID hoặc explicit `unconfined`.\n- Backend không cover required control/grant phải refuse.\n- Network filter/override, grant coverage và resource readiness tuân bảng §8.7.\n- Fingerprint/receipt/channels đúng closed schema; stale proof phải refresh pass\n  trước required spawn, refresh fail/timeout thì refuse."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-62",
    "githubAnchor": "unheaded-block-62",
    "stableAnchor": "unheaded-block-62",
    "title": "Unheaded block 62",
    "startLine": 517,
    "endLine": 525,
    "textDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "sample": "- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,\n  policy thiếu và override hạ policy.\n- Project-over-global merge được validate lại.\n- Project config k",
    "identityFingerprint": "b23f66e12db59d98e2df27a14c7953e28d9d2a82b8d761c306b4e401a7c38cab",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.1 Contract tests"
    ],
    "text": "- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,\n  policy thiếu và override hạ policy.\n- Project-over-global merge được validate lại.\n- Project config không thể định nghĩa hoặc override machine backend instance.\n- Mọi capability resolve thành policy ID hoặc explicit `unconfined`.\n- Backend không cover required control/grant phải refuse.\n- Network filter/override, grant coverage và resource readiness tuân bảng §8.7.\n- Fingerprint/receipt/channels đúng closed schema; stale proof phải refresh pass\n  trước required spawn, refresh fail/timeout thì refuse."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-62",
      "githubAnchor": "unheaded-block-62",
      "stableAnchor": "unheaded-block-62",
      "title": "Unheaded block 62",
      "startLine": 517,
      "endLine": 525,
      "textDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
      "sample": "- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,\n  policy thiếu và override hạ policy.\n- Project-over-global merge được validate lại.\n- Project config k",
      "identityFingerprint": "b23f66e12db59d98e2df27a14c7953e28d9d2a82b8d761c306b4e401a7c38cab",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.1 Contract tests"
      ],
      "text": "- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,\n  policy thiếu và override hạ policy.\n- Project-over-global merge được validate lại.\n- Project config không thể định nghĩa hoặc override machine backend instance.\n- Mọi capability resolve thành policy ID hoặc explicit `unconfined`.\n- Backend không cover required control/grant phải refuse.\n- Network filter/override, grant coverage và resource readiness tuân bảng §8.7.\n- Fingerprint/receipt/channels đúng closed schema; stale proof phải refresh pass\n  trước required spawn, refresh fail/timeout thì refuse."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_bb5abf5828264d19c061b9b0920618a3"
}
```

## Entry claim_bd94f9efb9ccdbbc8ca5b90916290c6f

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_bd94f9efb9ccdbbc8ca5b90916290c6f",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_bd94f9efb9ccdbbc8ca5b90916290c6f",
    "sourceUnitDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-63",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-130 (source lines 1276-1285) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-61 (candidate lines 525-534). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.2 One-door tests"
    ]
  },
  "currentDecision": {
    "claimId": "claim_bd94f9efb9ccdbbc8ca5b90916290c6f",
    "sourceUnitDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-63",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-131 (source lines 1278-1287) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-63 (candidate lines 529-538). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.2 One-door tests"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "0d5707db18e5247b707f6978f604db5fdd4b99ae054155e51d0314fdf2c597d3",
    "identityFingerprint": "0d5707db18e5247b707f6978f604db5fdd4b99ae054155e51d0314fdf2c597d3",
    "claimId": "claim_bd94f9efb9ccdbbc8ca5b90916290c6f",
    "sourceAnchor": "unheaded-block-131",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-131",
      "githubAnchor": "unheaded-block-131",
      "stableAnchor": "unheaded-block-131",
      "title": "Unheaded block 131",
      "startLine": 1278,
      "endLine": 1287,
      "textDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
      "sample": "- Import/static test chứng minh production caller không gọi executor adapter\n  execute function trực tiếp.\n- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.\n- Adapter ",
      "identityFingerprint": "0d5707db18e5247b707f6978f604db5fdd4b99ae054155e51d0314fdf2c597d3",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.2 One-door tests"
      ],
      "text": "- Import/static test chứng minh production caller không gọi executor adapter\n  execute function trực tiếp.\n- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.\n- Adapter fake chỉ nhận prepared invocation.\n- Throw trong resolve/assess/compile/prepare tạo zero spawn.\n- Preferred thiếu backend/needs và partial coverage tuân §8.2, không fallback\n  invocation gốc sau prepare failure.\n- Crash giữa allocation intent và prepare completion được replay/reap\n  idempotent; không cleanup execution còn sống hoặc remote chưa rõ liveness.\n- Collect failure giữ artifact/resource; cleanup failure không xóa agent result."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-63",
    "githubAnchor": "unheaded-block-63",
    "stableAnchor": "unheaded-block-63",
    "title": "Unheaded block 63",
    "startLine": 529,
    "endLine": 538,
    "textDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "sample": "- Import/static test chứng minh production caller không gọi executor adapter\n  execute function trực tiếp.\n- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.\n- Adapter ",
    "identityFingerprint": "0d5707db18e5247b707f6978f604db5fdd4b99ae054155e51d0314fdf2c597d3",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.2 One-door tests"
    ],
    "text": "- Import/static test chứng minh production caller không gọi executor adapter\n  execute function trực tiếp.\n- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.\n- Adapter fake chỉ nhận prepared invocation.\n- Throw trong resolve/assess/compile/prepare tạo zero spawn.\n- Preferred thiếu backend/needs và partial coverage tuân §8.2, không fallback\n  invocation gốc sau prepare failure.\n- Crash giữa allocation intent và prepare completion được replay/reap\n  idempotent; không cleanup execution còn sống hoặc remote chưa rõ liveness.\n- Collect failure giữ artifact/resource; cleanup failure không xóa agent result."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-63",
      "githubAnchor": "unheaded-block-63",
      "stableAnchor": "unheaded-block-63",
      "title": "Unheaded block 63",
      "startLine": 529,
      "endLine": 538,
      "textDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
      "sample": "- Import/static test chứng minh production caller không gọi executor adapter\n  execute function trực tiếp.\n- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.\n- Adapter ",
      "identityFingerprint": "0d5707db18e5247b707f6978f604db5fdd4b99ae054155e51d0314fdf2c597d3",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.2 One-door tests"
      ],
      "text": "- Import/static test chứng minh production caller không gọi executor adapter\n  execute function trực tiếp.\n- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.\n- Adapter fake chỉ nhận prepared invocation.\n- Throw trong resolve/assess/compile/prepare tạo zero spawn.\n- Preferred thiếu backend/needs và partial coverage tuân §8.2, không fallback\n  invocation gốc sau prepare failure.\n- Crash giữa allocation intent và prepare completion được replay/reap\n  idempotent; không cleanup execution còn sống hoặc remote chưa rõ liveness.\n- Collect failure giữ artifact/resource; cleanup failure không xóa agent result."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_bd94f9efb9ccdbbc8ca5b90916290c6f"
}
```

## Entry claim_2977601fcac216f335c121ce5a58ec9e

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_2977601fcac216f335c121ce5a58ec9e",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_2977601fcac216f335c121ce5a58ec9e",
    "sourceUnitDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-64",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-131 (source lines 1289-1289) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-62 (candidate lines 538-538). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.3 Behavior probes"
    ]
  },
  "currentDecision": {
    "claimId": "claim_2977601fcac216f335c121ce5a58ec9e",
    "sourceUnitDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-64",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-132 (source lines 1291-1291) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-64 (candidate lines 542-542). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.3 Behavior probes"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "5e8485d8b6ee7f96373fb2f5326e33ebc44372cdf267980113554bd6a6b201c3",
    "identityFingerprint": "5e8485d8b6ee7f96373fb2f5326e33ebc44372cdf267980113554bd6a6b201c3",
    "claimId": "claim_2977601fcac216f335c121ce5a58ec9e",
    "sourceAnchor": "unheaded-block-132",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-132",
      "githubAnchor": "unheaded-block-132",
      "stableAnchor": "unheaded-block-132",
      "title": "Unheaded block 132",
      "startLine": 1291,
      "endLine": 1291,
      "textDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
      "sample": "Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:",
      "identityFingerprint": "5e8485d8b6ee7f96373fb2f5326e33ebc44372cdf267980113554bd6a6b201c3",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.3 Behavior probes"
      ],
      "text": "Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-64",
    "githubAnchor": "unheaded-block-64",
    "stableAnchor": "unheaded-block-64",
    "title": "Unheaded block 64",
    "startLine": 542,
    "endLine": 542,
    "textDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "sample": "Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:",
    "identityFingerprint": "5e8485d8b6ee7f96373fb2f5326e33ebc44372cdf267980113554bd6a6b201c3",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.3 Behavior probes"
    ],
    "text": "Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-64",
      "githubAnchor": "unheaded-block-64",
      "stableAnchor": "unheaded-block-64",
      "title": "Unheaded block 64",
      "startLine": 542,
      "endLine": 542,
      "textDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
      "sample": "Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:",
      "identityFingerprint": "5e8485d8b6ee7f96373fb2f5326e33ebc44372cdf267980113554bd6a6b201c3",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.3 Behavior probes"
      ],
      "text": "Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_2977601fcac216f335c121ce5a58ec9e"
}
```

## Entry claim_d81f120837aab96ba270276e5090e2e0

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_d81f120837aab96ba270276e5090e2e0",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_d81f120837aab96ba270276e5090e2e0",
    "sourceUnitDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-132 (source lines 1291-1300) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-63 (candidate lines 540-549). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.3 Behavior probes"
    ]
  },
  "currentDecision": {
    "claimId": "claim_d81f120837aab96ba270276e5090e2e0",
    "sourceUnitDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-133 (source lines 1293-1302) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-65 (candidate lines 544-553). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.3 Behavior probes"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "e8be6872ff628bf10e5664086b531568d2b80260e5c458298c0ee5ccd3372887",
    "identityFingerprint": "e8be6872ff628bf10e5664086b531568d2b80260e5c458298c0ee5ccd3372887",
    "claimId": "claim_d81f120837aab96ba270276e5090e2e0",
    "sourceAnchor": "unheaded-block-133",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-133",
      "githubAnchor": "unheaded-block-133",
      "stableAnchor": "unheaded-block-133",
      "title": "Unheaded block 133",
      "startLine": 1293,
      "endLine": 1302,
      "textDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
      "sample": "- ghi vào `run-output` của chính dispatch thành công;\n- host-write-denied: ghi vào cwd/repo root bị chặn;\n- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;\n ",
      "identityFingerprint": "e8be6872ff628bf10e5664086b531568d2b80260e5c458298c0ee5ccd3372887",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.3 Behavior probes"
      ],
      "text": "- ghi vào `run-output` của chính dispatch thành công;\n- host-write-denied: ghi vào cwd/repo root bị chặn;\n- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;\n  probe riêng Git metadata ownership và commit readiness;\n- ghi vào run directory của dispatch khác bị chặn;\n- private home ghi được nhưng real host home bị chặn;\n- descriptor ghi ngoài grant không được kế thừa; stdio chỉ qua output channel\n  được quản lý; attestation công bố host IPC/network ngoài phạm vi đúng §4;\n- `executor-credentials` grant đọc được nhưng không ghi được;\n- host read và network vẫn khả dụng, để chứng minh attestation không overclaim."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-65",
    "githubAnchor": "unheaded-block-65",
    "stableAnchor": "unheaded-block-65",
    "title": "Unheaded block 65",
    "startLine": 544,
    "endLine": 553,
    "textDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
    "sample": "- ghi vào `run-output` của chính dispatch thành công;\n- host-write-denied: ghi vào cwd/repo root bị chặn;\n- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;\n ",
    "identityFingerprint": "e8be6872ff628bf10e5664086b531568d2b80260e5c458298c0ee5ccd3372887",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.3 Behavior probes"
    ],
    "text": "- ghi vào `run-output` của chính dispatch thành công;\n- host-write-denied: ghi vào cwd/repo root bị chặn;\n- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;\n  probe riêng Git metadata ownership và commit readiness;\n- ghi vào run directory của dispatch khác bị chặn;\n- private home ghi được nhưng real host home bị chặn;\n- descriptor ghi ngoài grant không được kế thừa; stdio chỉ qua output channel\n  được quản lý; attestation công bố host IPC/network ngoài phạm vi đúng §4;\n- `executor-credentials` grant đọc được nhưng không ghi được;\n- host read và network vẫn khả dụng, để chứng minh attestation không overclaim."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-65",
      "githubAnchor": "unheaded-block-65",
      "stableAnchor": "unheaded-block-65",
      "title": "Unheaded block 65",
      "startLine": 544,
      "endLine": 553,
      "textDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
      "sample": "- ghi vào `run-output` của chính dispatch thành công;\n- host-write-denied: ghi vào cwd/repo root bị chặn;\n- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;\n ",
      "identityFingerprint": "e8be6872ff628bf10e5664086b531568d2b80260e5c458298c0ee5ccd3372887",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.3 Behavior probes"
      ],
      "text": "- ghi vào `run-output` của chính dispatch thành công;\n- host-write-denied: ghi vào cwd/repo root bị chặn;\n- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;\n  probe riêng Git metadata ownership và commit readiness;\n- ghi vào run directory của dispatch khác bị chặn;\n- private home ghi được nhưng real host home bị chặn;\n- descriptor ghi ngoài grant không được kế thừa; stdio chỉ qua output channel\n  được quản lý; attestation công bố host IPC/network ngoài phạm vi đúng §4;\n- `executor-credentials` grant đọc được nhưng không ghi được;\n- host read và network vẫn khả dụng, để chứng minh attestation không overclaim."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_d81f120837aab96ba270276e5090e2e0"
}
```

## Entry claim_34983077687032d7a49ecc61907a6806

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_34983077687032d7a49ecc61907a6806",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_34983077687032d7a49ecc61907a6806",
    "sourceUnitDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-66",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-133 (source lines 1302-1304) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-64 (candidate lines 551-553). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.3 Behavior probes"
    ]
  },
  "currentDecision": {
    "claimId": "claim_34983077687032d7a49ecc61907a6806",
    "sourceUnitDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-66",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-134 (source lines 1304-1306) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-66 (candidate lines 555-557). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.3 Behavior probes"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "a26346b5f9511a5db4f295da1d665e5c8cfd8de8ccb95a3397f8f6d871a23c6c",
    "identityFingerprint": "a26346b5f9511a5db4f295da1d665e5c8cfd8de8ccb95a3397f8f6d871a23c6c",
    "claimId": "claim_34983077687032d7a49ecc61907a6806",
    "sourceAnchor": "unheaded-block-134",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-134",
      "githubAnchor": "unheaded-block-134",
      "stableAnchor": "unheaded-block-134",
      "title": "Unheaded block 134",
      "startLine": 1304,
      "endLine": 1306,
      "textDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
      "sample": "Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong\nproof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe\nprovider thay đổi không i",
      "identityFingerprint": "a26346b5f9511a5db4f295da1d665e5c8cfd8de8ccb95a3397f8f6d871a23c6c",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.3 Behavior probes"
      ],
      "text": "Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong\nproof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe\nprovider thay đổi không invalidate backend proof không liên quan."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-66",
    "githubAnchor": "unheaded-block-66",
    "stableAnchor": "unheaded-block-66",
    "title": "Unheaded block 66",
    "startLine": 555,
    "endLine": 557,
    "textDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
    "sample": "Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong\nproof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe\nprovider thay đổi không i",
    "identityFingerprint": "a26346b5f9511a5db4f295da1d665e5c8cfd8de8ccb95a3397f8f6d871a23c6c",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.3 Behavior probes"
    ],
    "text": "Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong\nproof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe\nprovider thay đổi không invalidate backend proof không liên quan."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-66",
      "githubAnchor": "unheaded-block-66",
      "stableAnchor": "unheaded-block-66",
      "title": "Unheaded block 66",
      "startLine": 555,
      "endLine": 557,
      "textDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
      "sample": "Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong\nproof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe\nprovider thay đổi không i",
      "identityFingerprint": "a26346b5f9511a5db4f295da1d665e5c8cfd8de8ccb95a3397f8f6d871a23c6c",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.3 Behavior probes"
      ],
      "text": "Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong\nproof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe\nprovider thay đổi không invalidate backend proof không liên quan."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_34983077687032d7a49ecc61907a6806"
}
```

## Entry claim_d9f0a2209948f0357cac70dc0778b0bb

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_d9f0a2209948f0357cac70dc0778b0bb",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_d9f0a2209948f0357cac70dc0778b0bb",
    "sourceUnitDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-67",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-134 (source lines 1308-1312) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-65 (candidate lines 557-561). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.4 Observability"
    ]
  },
  "currentDecision": {
    "claimId": "claim_d9f0a2209948f0357cac70dc0778b0bb",
    "sourceUnitDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-67",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-135 (source lines 1310-1314) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-67 (candidate lines 561-565). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.4 Observability"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "1be45e1f3ed18b93004476a6a5919346fc763d0492c3a02bb10b2f683cdcb504",
    "identityFingerprint": "1be45e1f3ed18b93004476a6a5919346fc763d0492c3a02bb10b2f683cdcb504",
    "claimId": "claim_d9f0a2209948f0357cac70dc0778b0bb",
    "sourceAnchor": "unheaded-block-135",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-135",
      "githubAnchor": "unheaded-block-135",
      "stableAnchor": "unheaded-block-135",
      "title": "Unheaded block 135",
      "startLine": 1310,
      "endLine": 1314,
      "textDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
      "sample": "- Pin posture của cả 17 executor hiện tại.\n- Pin exact write grant của ba executor bwrap.\n- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.\n- Event/run record lưu",
      "identityFingerprint": "1be45e1f3ed18b93004476a6a5919346fc763d0492c3a02bb10b2f683cdcb504",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.4 Observability"
      ],
      "text": "- Pin posture của cả 17 executor hiện tại.\n- Pin exact write grant của ba executor bwrap.\n- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.\n- Event/run record lưu `confinement-attestation.v1` và mismatch.\n- Log stdout/stderr không chứa credential value."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-67",
    "githubAnchor": "unheaded-block-67",
    "stableAnchor": "unheaded-block-67",
    "title": "Unheaded block 67",
    "startLine": 561,
    "endLine": 565,
    "textDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "sample": "- Pin posture của cả 17 executor hiện tại.\n- Pin exact write grant của ba executor bwrap.\n- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.\n- Event/run record lưu",
    "identityFingerprint": "1be45e1f3ed18b93004476a6a5919346fc763d0492c3a02bb10b2f683cdcb504",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.4 Observability"
    ],
    "text": "- Pin posture của cả 17 executor hiện tại.\n- Pin exact write grant của ba executor bwrap.\n- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.\n- Event/run record lưu `confinement-attestation.v1` và mismatch.\n- Log stdout/stderr không chứa credential value."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-67",
      "githubAnchor": "unheaded-block-67",
      "stableAnchor": "unheaded-block-67",
      "title": "Unheaded block 67",
      "startLine": 561,
      "endLine": 565,
      "textDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
      "sample": "- Pin posture của cả 17 executor hiện tại.\n- Pin exact write grant của ba executor bwrap.\n- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.\n- Event/run record lưu",
      "identityFingerprint": "1be45e1f3ed18b93004476a6a5919346fc763d0492c3a02bb10b2f683cdcb504",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.4 Observability"
      ],
      "text": "- Pin posture của cả 17 executor hiện tại.\n- Pin exact write grant của ba executor bwrap.\n- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.\n- Event/run record lưu `confinement-attestation.v1` và mismatch.\n- Log stdout/stderr không chứa credential value."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_d9f0a2209948f0357cac70dc0778b0bb"
}
```

## Entry claim_f82a2cff173a458bb2231203222c10e0

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_f82a2cff173a458bb2231203222c10e0",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_f82a2cff173a458bb2231203222c10e0",
    "sourceUnitDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-68",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-135 (source lines 1316-1322) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-66 (candidate lines 565-571). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.5 Doctor/setup"
    ]
  },
  "currentDecision": {
    "claimId": "claim_f82a2cff173a458bb2231203222c10e0",
    "sourceUnitDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-68",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-136 (source lines 1318-1324) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-68 (candidate lines 569-575). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.5 Doctor/setup"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "ee8afd3b8ef3e08df9a1513448b6e6fcdb54709a5bffecef202bb567406cca25",
    "identityFingerprint": "ee8afd3b8ef3e08df9a1513448b6e6fcdb54709a5bffecef202bb567406cca25",
    "claimId": "claim_f82a2cff173a458bb2231203222c10e0",
    "sourceAnchor": "unheaded-block-136",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-136",
      "githubAnchor": "unheaded-block-136",
      "stableAnchor": "unheaded-block-136",
      "title": "Unheaded block 136",
      "startLine": 1318,
      "endLine": 1324,
      "textDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
      "sample": "Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry\ninstance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform\nsupport, namespace/mount pre",
      "identityFingerprint": "ee8afd3b8ef3e08df9a1513448b6e6fcdb54709a5bffecef202bb567406cca25",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.5 Doctor/setup"
      ],
      "text": "Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry\ninstance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform\nsupport, namespace/mount prerequisite, runDir writable, credential source\nreadable và probe freshness. `fgos setup` tạo/fill missing backend instance\ntrong machine registry mà không ghi đè custom value; shared project/global\nconfig vẫn giữ precedence hiện hành. Doctor report phân biệt rõ `configured`,\n`disabled`, `unavailable` và `ready`."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-68",
    "githubAnchor": "unheaded-block-68",
    "stableAnchor": "unheaded-block-68",
    "title": "Unheaded block 68",
    "startLine": 569,
    "endLine": 575,
    "textDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "sample": "Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry\ninstance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform\nsupport, namespace/mount pre",
    "identityFingerprint": "ee8afd3b8ef3e08df9a1513448b6e6fcdb54709a5bffecef202bb567406cca25",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done",
      "11.5 Doctor/setup"
    ],
    "text": "Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry\ninstance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform\nsupport, namespace/mount prerequisite, runDir writable, credential source\nreadable và probe freshness. `fgos setup` tạo/fill missing backend instance\ntrong machine registry mà không ghi đè custom value; shared project/global\nconfig vẫn giữ precedence hiện hành. Doctor report phân biệt rõ `configured`,\n`disabled`, `unavailable` và `ready`."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-68",
      "githubAnchor": "unheaded-block-68",
      "stableAnchor": "unheaded-block-68",
      "title": "Unheaded block 68",
      "startLine": 569,
      "endLine": 575,
      "textDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
      "sample": "Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry\ninstance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform\nsupport, namespace/mount pre",
      "identityFingerprint": "ee8afd3b8ef3e08df9a1513448b6e6fcdb54709a5bffecef202bb567406cca25",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "11. Proof và Definition of Done",
        "11.5 Doctor/setup"
      ],
      "text": "Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry\ninstance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform\nsupport, namespace/mount prerequisite, runDir writable, credential source\nreadable và probe freshness. `fgos setup` tạo/fill missing backend instance\ntrong machine registry mà không ghi đè custom value; shared project/global\nconfig vẫn giữ precedence hiện hành. Doctor report phân biệt rõ `configured`,\n`disabled`, `unavailable` và `ready`."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_f82a2cff173a458bb2231203222c10e0"
}
```

## Entry claim_022af2ccb616ad85400526fd94408258

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_022af2ccb616ad85400526fd94408258",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_022af2ccb616ad85400526fd94408258",
    "sourceUnitDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-143 (source lines 1367-1367) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-67 (candidate lines 577-577). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "currentDecision": {
    "claimId": "claim_022af2ccb616ad85400526fd94408258",
    "sourceUnitDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: ancestor headings differ. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-144 (source lines 1369-1369) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-69 (candidate lines 581-581). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "be86a74cad90f4d984b92e5c5e25041ffb38373d43fea3a5b1f491c2fc2b42b0",
    "identityFingerprint": "be86a74cad90f4d984b92e5c5e25041ffb38373d43fea3a5b1f491c2fc2b42b0",
    "claimId": "claim_022af2ccb616ad85400526fd94408258",
    "sourceAnchor": "unheaded-block-144",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-144",
      "githubAnchor": "unheaded-block-144",
      "stableAnchor": "unheaded-block-144",
      "title": "Unheaded block 144",
      "startLine": 1369,
      "endLine": 1369,
      "textDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
      "sample": "Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn",
      "identityFingerprint": "be86a74cad90f4d984b92e5c5e25041ffb38373d43fea3a5b1f491c2fc2b42b0",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
        "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
      ],
      "text": "Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-69",
    "githubAnchor": "unheaded-block-69",
    "stableAnchor": "unheaded-block-69",
    "title": "Unheaded block 69",
    "startLine": 581,
    "endLine": 581,
    "textDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "sample": "Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn",
    "identityFingerprint": "be86a74cad90f4d984b92e5c5e25041ffb38373d43fea3a5b1f491c2fc2b42b0",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ],
    "text": "Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-69",
      "githubAnchor": "unheaded-block-69",
      "stableAnchor": "unheaded-block-69",
      "title": "Unheaded block 69",
      "startLine": 581,
      "endLine": 581,
      "textDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
      "sample": "Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn",
      "identityFingerprint": "be86a74cad90f4d984b92e5c5e25041ffb38373d43fea3a5b1f491c2fc2b42b0",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "Added in candidate: Current settled facts and deferred items",
        "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
      ],
      "text": "Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_022af2ccb616ad85400526fd94408258"
}
```

## Entry claim_19c1aba20ad51fafc86dc889996c2063

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_19c1aba20ad51fafc86dc889996c2063",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_19c1aba20ad51fafc86dc889996c2063",
    "sourceUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-144 (source lines 1369-1370) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-68 (candidate lines 579-580). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "currentDecision": {
    "claimId": "claim_19c1aba20ad51fafc86dc889996c2063",
    "sourceUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: ancestor headings differ. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-145 (source lines 1371-1372) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-70 (candidate lines 583-584). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
    "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
    "claimId": "claim_19c1aba20ad51fafc86dc889996c2063",
    "sourceAnchor": "unheaded-block-145",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-145",
      "githubAnchor": "unheaded-block-145",
      "stableAnchor": "unheaded-block-145",
      "title": "Unheaded block 145",
      "startLine": 1371,
      "endLine": 1372,
      "textDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
      "sample": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong wr",
      "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
        "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
      ],
      "text": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-70",
    "githubAnchor": "unheaded-block-70",
    "stableAnchor": "unheaded-block-70",
    "title": "Unheaded block 70",
    "startLine": 583,
    "endLine": 584,
    "textDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "sample": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong wr",
    "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ],
    "text": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-70",
      "githubAnchor": "unheaded-block-70",
      "stableAnchor": "unheaded-block-70",
      "title": "Unheaded block 70",
      "startLine": 583,
      "endLine": 584,
      "textDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
      "sample": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong wr",
      "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "Added in candidate: Current settled facts and deferred items",
        "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
      ],
      "text": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_19c1aba20ad51fafc86dc889996c2063"
}
```

## Entry claim_dbbee9d940a2d595936e12ba6781f684

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_dbbee9d940a2d595936e12ba6781f684",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_dbbee9d940a2d595936e12ba6781f684",
    "sourceUnitDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-149 (source lines 1384-1387) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-69 (candidate lines 584-587). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items",
      "Tồn đọng mở (Open Deferred Items):"
    ]
  },
  "currentDecision": {
    "claimId": "claim_dbbee9d940a2d595936e12ba6781f684",
    "sourceUnitDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: ancestor headings differ. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-150 (source lines 1386-1389) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-71 (candidate lines 588-591). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items",
      "Tồn đọng mở (Open Deferred Items):"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "59b9c06c5006eebd43e4ccf13af1149a769149495a1e388ff746696660d02a4f",
    "identityFingerprint": "59b9c06c5006eebd43e4ccf13af1149a769149495a1e388ff746696660d02a4f",
    "claimId": "claim_dbbee9d940a2d595936e12ba6781f684",
    "sourceAnchor": "unheaded-block-150",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-150",
      "githubAnchor": "unheaded-block-150",
      "stableAnchor": "unheaded-block-150",
      "title": "Unheaded block 150",
      "startLine": 1386,
      "endLine": 1389,
      "textDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
      "sample": "- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-o",
      "identityFingerprint": "59b9c06c5006eebd43e4ccf13af1149a769149495a1e388ff746696660d02a4f",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
        "Tồn đọng mở (Open Deferred Items):"
      ],
      "text": "- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.\n- **P03 NEW-1b/NEW-1c & P06 M2 (Thin attestation body):** Thân attestation của `enforced` chưa so sánh toàn diện invocation chạy thực tế với plan đã prepare; mảng `channels[]` vẫn mang chi tiết observe-mode.\n- **P03 R4 (Reaper caller):** Hàm dọn dẹp thư mục tạm thành công chưa có caller định kỳ trong production.\n- **Strict Mode Default:** `runner.confinement.strict` tiếp tục mặc định là `false`, giữ an toàn tương thích cho môi trường phát triển và chờ hoàn thiện các tồn đọng trên trước khi kích hoạt mặc định. Operator có thể bật `strict: true` khi đã thoả mãn `fgos doctor`."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-71",
    "githubAnchor": "unheaded-block-71",
    "stableAnchor": "unheaded-block-71",
    "title": "Unheaded block 71",
    "startLine": 588,
    "endLine": 591,
    "textDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "sample": "- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-o",
    "identityFingerprint": "59b9c06c5006eebd43e4ccf13af1149a769149495a1e388ff746696660d02a4f",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items",
      "Tồn đọng mở (Open Deferred Items):"
    ],
    "text": "- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.\n- **P03 NEW-1b/NEW-1c & P06 M2 (Thin attestation body):** Thân attestation của `enforced` chưa so sánh toàn diện invocation chạy thực tế với plan đã prepare; mảng `channels[]` vẫn mang chi tiết observe-mode.\n- **P03 R4 (Reaper caller):** Hàm dọn dẹp thư mục tạm thành công chưa có caller định kỳ trong production.\n- **Strict Mode Default:** `runner.confinement.strict` tiếp tục mặc định là `false`, giữ an toàn tương thích cho môi trường phát triển và chờ hoàn thiện các tồn đọng trên trước khi kích hoạt mặc định. Operator có thể bật `strict: true` khi đã thoả mãn `fgos doctor`."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-71",
      "githubAnchor": "unheaded-block-71",
      "stableAnchor": "unheaded-block-71",
      "title": "Unheaded block 71",
      "startLine": 588,
      "endLine": 591,
      "textDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
      "sample": "- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-o",
      "identityFingerprint": "59b9c06c5006eebd43e4ccf13af1149a769149495a1e388ff746696660d02a4f",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "Added in candidate: Current settled facts and deferred items",
        "Tồn đọng mở (Open Deferred Items):"
      ],
      "text": "- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.\n- **P03 NEW-1b/NEW-1c & P06 M2 (Thin attestation body):** Thân attestation của `enforced` chưa so sánh toàn diện invocation chạy thực tế với plan đã prepare; mảng `channels[]` vẫn mang chi tiết observe-mode.\n- **P03 R4 (Reaper caller):** Hàm dọn dẹp thư mục tạm thành công chưa có caller định kỳ trong production.\n- **Strict Mode Default:** `runner.confinement.strict` tiếp tục mặc định là `false`, giữ an toàn tương thích cho môi trường phát triển và chờ hoàn thiện các tồn đọng trên trước khi kích hoạt mặc định. Operator có thể bật `strict: true` khi đã thoả mãn `fgos doctor`."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_dbbee9d940a2d595936e12ba6781f684"
}
```

## Entry claim_c491a724bb730522215633d79a66e5b3

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_c491a724bb730522215633d79a66e5b3",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s8-agent-confinement-01.json",
  "before": {
    "claimId": "claim_c491a724bb730522215633d79a66e5b3",
    "sourceUnitDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792077702187-860e8753@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-150 (source lines 1391-1399) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-70 (candidate lines 591-599). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "Independent review required for this package binding; no approval carried.",
    "targetUnitDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "14. Pointers hiện tại"
    ]
  },
  "currentDecision": {
    "claimId": "claim_c491a724bb730522215633d79a66e5b3",
    "sourceUnitDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-151 (source lines 1393-1401) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-72 (candidate lines 595-603). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by unique full text digest. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 c02: anchors and line ranges refreshed after the labelled binding paragraph; complete direct unit remains byte-equal.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "14. Pointers hiện tại"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/confinement-authority.md",
    "unitDigest": "20fbf3eb59c4ad33d13642444e0c6b2ca4812520f36b798bb5a7799f24bdae25",
    "identityFingerprint": "20fbf3eb59c4ad33d13642444e0c6b2ca4812520f36b798bb5a7799f24bdae25",
    "claimId": "claim_c491a724bb730522215633d79a66e5b3",
    "sourceAnchor": "unheaded-block-151",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-151",
      "githubAnchor": "unheaded-block-151",
      "stableAnchor": "unheaded-block-151",
      "title": "Unheaded block 151",
      "startLine": 1393,
      "endLine": 1401,
      "textDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
      "sample": "- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.\n- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry\n  và `cliSpawnAdapte",
      "identityFingerprint": "20fbf3eb59c4ad33d13642444e0c6b2ca4812520f36b798bb5a7799f24bdae25",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "14. Pointers hiện tại"
      ],
      "text": "- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.\n- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry\n  và `cliSpawnAdapter` hiện bỏ `confinement`.\n- `src/runner/dispatch/resolve.mjs`: resolve executor và fallback path.\n- `src/runner/dispatch/config.mjs`: validation của shape confinement cũ.\n- `src/runner/dispatch/herdr-round.mjs`: enforcement session/home hiện tại.\n- `src/setup/registrations.mjs`: doctor checks liên quan.\n- `.fgos/config.json`: các invocation bwrap (cli-spawn và herdr-spawn) khai `confinement.backend`; invocation herdr của codex/agy/pi khai thêm `resourceBindings` private-home (§13.1).\n- `docs/routing-handoff-contract.md`: worktree containment không phải sandbox."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-72",
    "githubAnchor": "unheaded-block-72",
    "stableAnchor": "unheaded-block-72",
    "title": "Unheaded block 72",
    "startLine": 595,
    "endLine": 603,
    "textDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "sample": "- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.\n- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry\n  và `cliSpawnAdapte",
    "identityFingerprint": "20fbf3eb59c4ad33d13642444e0c6b2ca4812520f36b798bb5a7799f24bdae25",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "14. Pointers hiện tại"
    ],
    "text": "- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.\n- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry\n  và `cliSpawnAdapter` hiện bỏ `confinement`.\n- `src/runner/dispatch/resolve.mjs`: resolve executor và fallback path.\n- `src/runner/dispatch/config.mjs`: validation của shape confinement cũ.\n- `src/runner/dispatch/herdr-round.mjs`: enforcement session/home hiện tại.\n- `src/setup/registrations.mjs`: doctor checks liên quan.\n- `.fgos/config.json`: các invocation bwrap (cli-spawn và herdr-spawn) khai `confinement.backend`; invocation herdr của codex/agy/pi khai thêm `resourceBindings` private-home (§13.1).\n- `docs/routing-handoff-contract.md`: worktree containment không phải sandbox."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-72",
      "githubAnchor": "unheaded-block-72",
      "stableAnchor": "unheaded-block-72",
      "title": "Unheaded block 72",
      "startLine": 595,
      "endLine": 603,
      "textDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
      "sample": "- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.\n- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry\n  và `cliSpawnAdapte",
      "identityFingerprint": "20fbf3eb59c4ad33d13642444e0c6b2ca4812520f36b798bb5a7799f24bdae25",
      "ancestry": [
        "Spec: Agent Confinement Authority",
        "14. Pointers hiện tại"
      ],
      "text": "- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.\n- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry\n  và `cliSpawnAdapter` hiện bỏ `confinement`.\n- `src/runner/dispatch/resolve.mjs`: resolve executor và fallback path.\n- `src/runner/dispatch/config.mjs`: validation của shape confinement cũ.\n- `src/runner/dispatch/herdr-round.mjs`: enforcement session/home hiện tại.\n- `src/setup/registrations.mjs`: doctor checks liên quan.\n- `.fgos/config.json`: các invocation bwrap (cli-spawn và herdr-spawn) khai `confinement.backend`; invocation herdr của codex/agy/pi khai thêm `resourceBindings` private-home (§13.1).\n- `docs/routing-handoff-contract.md`: worktree containment không phải sandbox."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_c491a724bb730522215633d79a66e5b3"
}
```

## Entry claim_5788dd19c4378fbb442c6a455f0e7857

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json",
  "collection": "claims",
  "claimId": "claim_5788dd19c4378fbb442c6a455f0e7857",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s9-runner-01.json",
  "before": {
    "claimId": "claim_5788dd19c4378fbb442c6a455f0e7857",
    "sourceUnitDigest": "29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792079321432-41fe2051@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2 (lines 3320–3320) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover. L10-13/L10-14: specific candidate link correction or explicit added-decision wrapper changes this direct unit; current target binding re-decided pending. Historical decision semantics remain; all text differences shown in step10-correction-edits.json. No approval carry.",
    "targetUnitDigest": "3a1f30f7334b753a47a5c620be560d11b00e969789882a65e594c96d92177f55",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  },
  "currentDecision": {
    "claimId": "claim_5788dd19c4378fbb442c6a455f0e7857",
    "sourceUnitDigest": "29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Judgment: labelled candidate addition. Whole heading docs/specs/runner.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2 (lines 3320–3320) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2. Source/target digests differ because the labelled 0064 introduction blockquote (Added in candidate: Settled runner decision carried from the retained source) sits at the end of the 0063 direct section; source decision text remains verbatim. Supersede records that labelled addition. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover. L10-13/L10-14: specific candidate link correction or explicit added-decision wrapper changes this direct unit; current target binding re-decided pending. Historical decision semantics remain; all text differences shown in step10-correction-edits.json. No approval carry.",
    "targetUnitDigest": "3a1f30f7334b753a47a5c620be560d11b00e969789882a65e594c96d92177f55",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "4e71d3a3cfda6f450ada9dc2a87b89124be294a5fdbfe73404fd18ff9ea39a72",
    "identityFingerprint": "df79b964c4a9306de76a0a58afc5945571da46e6c788d8c2c0983c1173ee200a",
    "claimId": "claim_5788dd19c4378fbb442c6a455f0e7857",
    "sourceAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
    "unitKind": "heading",
    "sourceUnitDigest": "29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 3,
      "title": "0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)",
      "anchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
      "githubAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
      "stableAnchor": "h-4cc7ccdf9e8a",
      "startLine": 3329,
      "endLine": 3329,
      "textDigest": "29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9",
      "sample": "0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)",
      "sectionPayloadDigest": "61e128436645d5127c2050899a6e209b13206523fe4a641557c4277ffda23d97",
      "followingBlockDigest": "61e128436645d5127c2050899a6e209b13206523fe4a641557c4277ffda23d97",
      "identityFingerprint": "df79b964c4a9306de76a0a58afc5945571da46e6c788d8c2c0983c1173ee200a",
      "ancestry": [
        "Spec: Runner (vòng tự hành)",
        "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
      ],
      "text": "### 0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)",
      "sectionText": "### 0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)\n\n- **Trạng thái:** Settled (2026-10-14). Thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2: dispatch thôi nhận object Work (`work`, `workItem`) hay `workExecutorId` rời; RUL95 (dispatch takes generic inputs only). Đóng danh sách `R3_PENDING_WORK_CALLERS` của RUL90 (the raw dispatch doors are removed) và câu để ngỏ về `import()` không literal ở đó.\n- **Bối cảnh:** Sau RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each) và RUL94 (a Work driver step runs as a Unit), không caller production nào còn gọi thẳng cửa chạy của dispatch, nhưng dispatch vẫn giữ các tham số Work: `buildAssignment({work})` tự suy `contextRefs` từ `docsRef`/`refs`; policy đọc `work.rigor`/`work.risk`/`work.domain`; `compileDispatchPlan` nhận `workItem` (fan-out còn truyền cả object item); `executeExecutorCli({work})` cho chạy executor chưa đăng ký khi có item đi kèm; `assignment.mjs` tự dò và `import()` harness của domain ở `domains/<d>/harness/` — guard import không thấy đường này (R4b của lane cắt cửa). Một caller truyền `work` vào dispatch bị bỏ qua trong im lặng, nên rigor của item có thể mất mà không ai biết. Thêm nữa, từ RUL94 (a Work driver step runs as a Unit), seat của bước driver mang `domain` mà policy không đọc, nên sàn `<domain>:review` bị mất.\n- **Quyết định:**\n  1. Rigor và domain là trường của chính assignment (`assignment.rigor`, `assignment.domain`). Tầng Work gộp `rigor` và `risk: heavy` của item thành một rigor (`workRigorFor`); luật đơn điệu ở lại dispatch: nguồn tường minh đầu tiên được chọn, nguồn sau chỉ nâng, sàn capability và luật tier giữ nguyên.\n  2. `decide --work` và fan-out nhận hint `{workExecutorId, agentType, rigor?, domain?}` từ tầng Work (`workDispatchHint`); khoá `--work` trong API là `workId`. `workDispatchContext` chỉ trả `capabilityHints`, `agentType`.\n  3. Các cửa dispatch từ chối `work`/`workItem`/`workExecutorId` thay vì bỏ qua.\n  4. Harness của domain chỉ tầng Work được nạp (`domainHarnessFor`, chỉ domain đã đăng ký, ở bước đã khai); caller truyền vào `buildAssignment` inline qua `options.domainHarness`; dispatch vẫn kiểm lại contract sau seam. Hiện chưa có đường production nào dựng assignment inline cho một Work item (trước đây cũng không: caller inline duy nhất là `probe-account`), nên seam chỉ chạy trong test; giữ lại vì ADR-007 là quyết định riêng, bỏ seam phải supersede ADR đó.\n  5. Guard ngữ nghĩa: không định danh/thuộc tính `work`, `workItem`, `docsRef` (giải mã escape trước), không chuỗi đúng bằng các tên đó ngoài chỗ được ghim, không `resolveContentRoot(` trong tập canh gác; `src/state/**` tính là tầng Work (một cạnh `StoreError` được ghim); thư mục canh gác chỉ chứa `.mjs` thường; lexer chung coi `/` sau `}` đóng khối là regex; không nạp code theo tên tính lúc chạy (`import()`/`require()` không literal, `createRequire`, `eval`, `Function(...)`, `module`/`vm`/`worker_threads`) ngoài các lần nạp được ghim từng cái trong allowlist đích danh có lý do. Guard call-site so bằng equality với danh sách caller tuyệt đối; `R3_PENDING_WORK_CALLERS` đã xoá.\n- **Cổng R3 đã đạt:** `rg -n R3_PENDING_WORK_CALLERS test` ra 0; guard call-site tuyệt đối, guard import, guard ngữ nghĩa và guard nạp động xanh trên nhánh `feat/rununit-guard` (commit `fc9cc6fb9`); trên `src/` của main các guard mới đỏ đúng các dòng trong kiểm kê (47 dòng Work-shaped ở `assignment.mjs`, `assignment-policy.mjs`, `assignment-runner.mjs`, `cli.mjs`, `plan.mjs`, cộng `assignment.mjs:99` nạp harness theo đường tính). Bằng chứng chạy: `plans/261014-1400-two-doors-one-rununit/reports/lane-guard-*.md`.\n- **Tái dùng / thiếu:** tái dùng `workRigorFor` (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), `executorIdForWork`, `lexSource` của test, guard import bắc cầu và guard call-site của 0062. Thiếu trước đó: hint generic cho `decide --work`, cách truyền harness từ caller, guard ngữ nghĩa, guard nạp động.\n- **Ranh giới:** Component-boundary change: dispatch không còn nhận dữ liệu Work dưới bất kỳ dạng nào; harness domain chuyển từ dispatch sang tầng Work.\n- **Lệch so với thiết kế R3 đã duyệt (mục 5):** hint không mang `capabilityHints`/`stage` vì không bên nào ở `decide` đọc chúng (YAGNI); provenance rigor ghi scope `assignment` (trường chung của assignment) thay cho `work-hint`.\n- **Giới hạn đã biết:** guard đọc văn bản, không có parser JS (repo chỉ có dependency `yaml`): tên dựng lúc chạy (`opts[k]`, `'wo' + 'rk'`), input lồng (`options.work`, `assignment.work`; không ai đọc) và code ngoài tập canh gác tự với vào nội bộ dispatch không bị bắt. `StoreError` nằm trong `src/state/store.mjs` nên module runner dùng chung vẫn nạp store; tách nó là việc riêng. Assignment cũ trên đĩa không có `rigor` ở cấp ngoài; assignment declared cũ thì luôn có `domain`, nên nếu config khai rigor cho capability `<domain>:review`, sàn đó nay áp cho chúng (chỉ nâng; registry mặc định không khai). Rigor sai định dạng trên item cũ (trước khi store kiểm) được hint chuyển nguyên cho dispatch tự xét, như khi dispatch còn đọc field của item.\nĐổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)",
    "anchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
    "githubAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
    "stableAnchor": "h-a01a1b8194f2",
    "startLine": 1736,
    "endLine": 1736,
    "textDigest": "3a1f30f7334b753a47a5c620be560d11b00e969789882a65e594c96d92177f55",
    "sample": "0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)",
    "sectionPayloadDigest": "337311871481a8ce4d215e13d79ad78069801bbfc90fd6d9c24fe214abd0021b",
    "followingBlockDigest": "61e128436645d5127c2050899a6e209b13206523fe4a641557c4277ffda23d97",
    "identityFingerprint": "98d8a57da42f33a1bcd932e0a4156a41f1891142907ac4b5a54a9af3cdf9b097",
    "ancestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ],
    "text": "### 0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)",
    "sectionText": "### 0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)\n\n- **Trạng thái:** Settled (2026-10-14). Thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2: dispatch thôi nhận object Work (`work`, `workItem`) hay `workExecutorId` rời; RUL95 (dispatch takes generic inputs only). Đóng danh sách `R3_PENDING_WORK_CALLERS` của RUL90 (the raw dispatch doors are removed) và câu để ngỏ về `import()` không literal ở đó.\n- **Bối cảnh:** Sau RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each) và RUL94 (a Work driver step runs as a Unit), không caller production nào còn gọi thẳng cửa chạy của dispatch, nhưng dispatch vẫn giữ các tham số Work: `buildAssignment({work})` tự suy `contextRefs` từ `docsRef`/`refs`; policy đọc `work.rigor`/`work.risk`/`work.domain`; `compileDispatchPlan` nhận `workItem` (fan-out còn truyền cả object item); `executeExecutorCli({work})` cho chạy executor chưa đăng ký khi có item đi kèm; `assignment.mjs` tự dò và `import()` harness của domain ở `domains/<d>/harness/` — guard import không thấy đường này (R4b của lane cắt cửa). Một caller truyền `work` vào dispatch bị bỏ qua trong im lặng, nên rigor của item có thể mất mà không ai biết. Thêm nữa, từ RUL94 (a Work driver step runs as a Unit), seat của bước driver mang `domain` mà policy không đọc, nên sàn `<domain>:review` bị mất.\n- **Quyết định:**\n  1. Rigor và domain là trường của chính assignment (`assignment.rigor`, `assignment.domain`). Tầng Work gộp `rigor` và `risk: heavy` của item thành một rigor (`workRigorFor`); luật đơn điệu ở lại dispatch: nguồn tường minh đầu tiên được chọn, nguồn sau chỉ nâng, sàn capability và luật tier giữ nguyên.\n  2. `decide --work` và fan-out nhận hint `{workExecutorId, agentType, rigor?, domain?}` từ tầng Work (`workDispatchHint`); khoá `--work` trong API là `workId`. `workDispatchContext` chỉ trả `capabilityHints`, `agentType`.\n  3. Các cửa dispatch từ chối `work`/`workItem`/`workExecutorId` thay vì bỏ qua.\n  4. Harness của domain chỉ tầng Work được nạp (`domainHarnessFor`, chỉ domain đã đăng ký, ở bước đã khai); caller truyền vào `buildAssignment` inline qua `options.domainHarness`; dispatch vẫn kiểm lại contract sau seam. Hiện chưa có đường production nào dựng assignment inline cho một Work item (trước đây cũng không: caller inline duy nhất là `probe-account`), nên seam chỉ chạy trong test; giữ lại vì ADR-007 là quyết định riêng, bỏ seam phải supersede ADR đó.\n  5. Guard ngữ nghĩa: không định danh/thuộc tính `work`, `workItem`, `docsRef` (giải mã escape trước), không chuỗi đúng bằng các tên đó ngoài chỗ được ghim, không `resolveContentRoot(` trong tập canh gác; `src/state/**` tính là tầng Work (một cạnh `StoreError` được ghim); thư mục canh gác chỉ chứa `.mjs` thường; lexer chung coi `/` sau `}` đóng khối là regex; không nạp code theo tên tính lúc chạy (`import()`/`require()` không literal, `createRequire`, `eval`, `Function(...)`, `module`/`vm`/`worker_threads`) ngoài các lần nạp được ghim từng cái trong allowlist đích danh có lý do. Guard call-site so bằng equality với danh sách caller tuyệt đối; `R3_PENDING_WORK_CALLERS` đã xoá.\n- **Cổng R3 đã đạt:** `rg -n R3_PENDING_WORK_CALLERS test` ra 0; guard call-site tuyệt đối, guard import, guard ngữ nghĩa và guard nạp động xanh trên nhánh `feat/rununit-guard` (commit `fc9cc6fb9`); trên `src/` của main các guard mới đỏ đúng các dòng trong kiểm kê (47 dòng Work-shaped ở `assignment.mjs`, `assignment-policy.mjs`, `assignment-runner.mjs`, `cli.mjs`, `plan.mjs`, cộng `assignment.mjs:99` nạp harness theo đường tính). Bằng chứng chạy: `plans/261014-1400-two-doors-one-rununit/reports/lane-guard-*.md`.\n- **Tái dùng / thiếu:** tái dùng `workRigorFor` (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), `executorIdForWork`, `lexSource` của test, guard import bắc cầu và guard call-site của 0062. Thiếu trước đó: hint generic cho `decide --work`, cách truyền harness từ caller, guard ngữ nghĩa, guard nạp động.\n- **Ranh giới:** Component-boundary change: dispatch không còn nhận dữ liệu Work dưới bất kỳ dạng nào; harness domain chuyển từ dispatch sang tầng Work.\n- **Lệch so với thiết kế R3 đã duyệt (mục 5):** hint không mang `capabilityHints`/`stage` vì không bên nào ở `decide` đọc chúng (YAGNI); provenance rigor ghi scope `assignment` (trường chung của assignment) thay cho `work-hint`.\n- **Giới hạn đã biết:** guard đọc văn bản, không có parser JS (repo chỉ có dependency `yaml`): tên dựng lúc chạy (`opts[k]`, `'wo' + 'rk'`), input lồng (`options.work`, `assignment.work`; không ai đọc) và code ngoài tập canh gác tự với vào nội bộ dispatch không bị bắt. `StoreError` nằm trong `src/state/store.mjs` nên module runner dùng chung vẫn nạp store; tách nó là việc riêng. Assignment cũ trên đĩa không có `rigor` ở cấp ngoài; assignment declared cũ thì luôn có `domain`, nên nếu config khai rigor cho capability `<domain>:review`, sàn đó nay áp cho chúng (chỉ nâng; registry mặc định không khai). Rigor sai định dạng trên item cũ (trước khi store kiểm) được hint chuyển nguyên cho dispatch tự xét, như khi dispatch còn đọc field của item.\nĐổi quyết định này = supersede bằng record mới, không sửa tại chỗ.\n\n> Added in candidate: Settled runner decision carried from the retained source."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_5788dd19c4378fbb442c6a455f0e7857"
}
```

## Entry claim_4599d55c9de4262714d378be2b9eaf80

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json",
  "collection": "claims",
  "claimId": "claim_4599d55c9de4262714d378be2b9eaf80",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s9-runner-01.json",
  "before": {
    "claimId": "claim_4599d55c9de4262714d378be2b9eaf80",
    "sourcePath": "docs/specs/runner.md",
    "sourceAnchor": "unheaded-block-102",
    "sourceUnitDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "claimKind": "specification",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792080300559-b4112a2f@2026-10-15",
    "rationale": "L10-14 / A31: every changed upstream span carried verbatim into mapped runner/root carrier; prior labelled truth corrections in the enclosing pointer list remain. Source and target unit digests disclose their inequality where applicable. Native identity resolved by the one sync at 2300d65571968bb3bcb80123a273272586e3f1db; pending independent review; no approval carry."
  },
  "currentDecision": {
    "claimId": "claim_4599d55c9de4262714d378be2b9eaf80",
    "sourcePath": "docs/specs/runner.md",
    "sourceAnchor": "unheaded-block-102",
    "sourceUnitDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "claimKind": "specification",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-3",
    "targetUnitDigest": "eb280e498fa6fc523bdcb534532de95023a5a82ec1ffaa2be5f5f36a4e618891",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)",
      "Pointers (implementation)"
    ],
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-14 / A31: every changed upstream span carried verbatim into mapped runner/root carrier; prior labelled truth corrections in the enclosing pointer list remain. Source and target unit digests disclose their inequality where applicable. Native identity resolved by the one sync at 2300d65571968bb3bcb80123a273272586e3f1db; pending independent review; no approval carry. L10-17: the actual 51-line Pointers list is spec.md#unheaded-block-3; block-2 is scaffolding. Correct list binding, pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
    "identityFingerprint": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
    "claimId": "claim_4599d55c9de4262714d378be2b9eaf80",
    "sourceAnchor": "unheaded-block-102",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-102",
      "githubAnchor": "unheaded-block-102",
      "stableAnchor": "unheaded-block-102",
      "title": "Unheaded block 102",
      "startLine": 1222,
      "endLine": 1272,
      "textDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
      "sample": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit",
      "identityFingerprint": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
      "ancestry": [
        "Spec: Runner (vòng tự hành)",
        "Pointers (implementation)"
      ],
      "text": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`.fgos/logs/entropy-history.jsonl`, gitignored, kể từ phase-01 plans/260825-0842-fgos-logs-dir-bucketing) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/execution/unit-sync.mjs` — sync base của Unit (RUL97 (a Unit may sync a base ref first)): `seedSync` (resolve ref trước khi unit run tồn tại), `runPendingSync`, `assertSyncResumable`, `syncBrief`, `commitRoundWithSync`; git tin cậy nằm ở `commit-unit-work.mjs` (`startSyncMerge`/`finishSyncMerge`/`syncMergeState`).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/dispatch/run-timeout.mjs` — sàn/trần thời gian của một lượt chạy (RUL96 (one run may take its own timeout)): `RUN_TIMEOUT_MIN_MS`, `RUN_TIMEOUT_MAX_MS`, `runTimeoutProblem`; leaf không import, đọc bởi `config.mjs` (`parseRunTimeout`, `assertRunTimeoutMs`), reaper confinement, khoá dispatch và `src/workflow/definition.mjs`.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1): thuần (`rankCandidates(view)`), không fs/Date.now, tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa \"chưa ngã-ngũ\" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.\n- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: mọi writer ghi `ttlMs` của chính nó vào record và người tranh xét record theo `ttlMs` ĐÓ, không bao giờ theo `ttlMs` của mình — số nguyên: pid sống VÀ còn trong ttl; chuỗi: chỉ xét độ mới (không có gì để kiểm sống); record cũ không có `ttlMs` nhận cửa sổ của writer cũ (chuỗi phiên do hook cũ ghi: `HOOK_TTL_MS` 20 s; pid: `DEFAULT_TTL_MS` 3 phút), mọi ttl bị chặn ở trần một run (4 h); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ); record có trường `v` (giao thức khóa mới hơn) hoặc marker `.fgos/runtime/locks/<tên khóa>/protocol.json` khác `{writer:1}` (một quyết định marker cho mọi cửa: acquire kiểm TRƯỚC khi ghi và kiểm lại sau acquire, `inspectMainCheckoutLock` kiểm trước nhánh \"không có file\", `forceReclaimAmbiguousLock` kiểm trước mọi sửa, hook và Rust `lock.rs` dùng cùng luật) → HELD với `reason: unsupported-protocol`; record có `v` kể cả khi mang đủ `pid`/`ts` không bao giờ bị dọn/làm mới/release (kể cả closure của một hold cũ và `releaseMainCheckoutLock`), `fgos unlock` từ chối và không bao giờ báo `cleared:true`. Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false` để không tái nhập hold của một operation khác cùng pid. Checkpoint `.fgos` (`runOpportunisticMainCheckoutChecks`) chạy trọn add → commit → reset-khi-lỗi trong mutex này: mutex thuộc tầng runner nên checkpoint (tầng kernel) nhận `mainCheckoutWriter` từ caller: caller đã giữ (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, caller chỉ giữ merge slot truyền `acquiringMainCheckoutWriter(dir)` (acquire rồi nhả ngay, bị giữ thì bỏ lượt); không có writer thì checkpoint không commit. Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); sau các guard `.fgos`/root-file/nhánh `fgw/*`, đọc `.fgos/main-checkout.lock` MỘT lần qua `inspectMainCheckoutLock` (không acquire, không chờ — git đã giữ `index.lock` khi hook chạy): pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp holder sống → commit của fgOS, bỏ qua đèn; holder pid số khác còn sống, giao thức khóa lạ, hoặc khóa hỏng → từ chối. Rồi `resolveWriterIdentity()` và đèn hoạt động `src/runner/main-checkout-activity.mjs` (`.fgos/runtime/main-checkout-activity.json`): writer khác trong `windowMs` → từ chối; còn lại ghi đèn cuối hook với `windowMs` = `HOOK_TTL_MS` 20 s (đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`); từ chối → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 27,
    "endLine": 77,
    "textDigest": "eb280e498fa6fc523bdcb534532de95023a5a82ec1ffaa2be5f5f36a4e618891",
    "sample": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit",
    "identityFingerprint": "12393aae26ef8da7160d239d3fd7530f9702e3b61f6112180771296affd15475",
    "ancestry": [
      "Added in candidate: Runner Pointers (implementation)",
      "Pointers (implementation)"
    ],
    "text": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — handler hiện hành cho `fgos metrics entropy`, tính score/parts và delta từ snapshot; `src/report/entropy.mjs` và CLI `check` cũ đã bị xoá.\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/execution/unit-sync.mjs` — sync base của Unit (RUL97 (a Unit may sync a base ref first)): `seedSync` (resolve ref trước khi unit run tồn tại), `runPendingSync`, `assertSyncResumable`, `syncBrief`, `commitRoundWithSync`; git tin cậy nằm ở `commit-unit-work.mjs` (`startSyncMerge`/`finishSyncMerge`/`syncMergeState`).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/dispatch/run-timeout.mjs` — sàn/trần thời gian của một lượt chạy (RUL96 (one run may take its own timeout)): `RUN_TIMEOUT_MIN_MS`, `RUN_TIMEOUT_MAX_MS`, `runTimeoutProblem`; leaf không import, đọc bởi `config.mjs` (`parseRunTimeout`, `assertRunTimeoutMs`), reaper confinement, khoá dispatch và `src/workflow/definition.mjs`.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` đã bị xoá; CLI hiện hành không có verb `evolve`, và `rankCandidates` chỉ còn được nhắc trong comment của entrypoint.\n- `bin/fgos.mjs` verb `evolve` — Added in candidate: former CLI contract, removed in `120af6b3d`; current CLI rejects `evolve` (`bin/fgos.mjs:4373`). Historical description of Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: mọi writer ghi `ttlMs` của chính nó vào record và người tranh xét record theo `ttlMs` ĐÓ, không bao giờ theo `ttlMs` của mình — số nguyên: pid sống VÀ còn trong ttl; chuỗi: chỉ xét độ mới (không có gì để kiểm sống); record cũ không có `ttlMs` nhận cửa sổ của writer cũ (chuỗi phiên do hook cũ ghi: `HOOK_TTL_MS` 20 s; pid: `DEFAULT_TTL_MS` 3 phút), mọi ttl bị chặn ở trần một run (4 h); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ); record có trường `v` (giao thức khóa mới hơn) hoặc marker `.fgos/runtime/locks/<tên khóa>/protocol.json` khác `{writer:1}` (một quyết định marker cho mọi cửa: acquire kiểm TRƯỚC khi ghi và kiểm lại sau acquire, `inspectMainCheckoutLock` kiểm trước nhánh \"không có file\", `forceReclaimAmbiguousLock` kiểm trước mọi sửa, hook và Rust `lock.rs` dùng cùng luật) → HELD với `reason: unsupported-protocol`; record có `v` kể cả khi mang đủ `pid`/`ts` không bao giờ bị dọn/làm mới/release (kể cả closure của một hold cũ và `releaseMainCheckoutLock`), `fgos unlock` từ chối và không bao giờ báo `cleared:true`. Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false` để không tái nhập hold của một operation khác cùng pid. Checkpoint `.fgos` (`runOpportunisticMainCheckoutChecks`) chạy trọn add → commit → reset-khi-lỗi trong mutex này: mutex thuộc tầng runner nên checkpoint (tầng kernel) nhận `mainCheckoutWriter` từ caller: caller đã giữ (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, caller chỉ giữ merge slot truyền `acquiringMainCheckoutWriter(dir)` (acquire rồi nhả ngay, bị giữ thì bỏ lượt); không có writer thì checkpoint không commit. Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); sau các guard `.fgos`/root-file/nhánh `fgw/*`, đọc `.fgos/main-checkout.lock` MỘT lần qua `inspectMainCheckoutLock` (không acquire, không chờ — git đã giữ `index.lock` khi hook chạy): pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp holder sống → commit của fgOS, bỏ qua đèn; holder pid số khác còn sống, giao thức khóa lạ, hoặc khóa hỏng → từ chối. Rồi `resolveWriterIdentity()` và đèn hoạt động `src/runner/main-checkout-activity.mjs` (`.fgos/runtime/main-checkout-activity.json`): writer khác trong `windowMs` → từ chối; còn lại ghi đèn cuối hook với `windowMs` = `HOOK_TTL_MS` 20 s (đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`); từ chối → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_4599d55c9de4262714d378be2b9eaf80"
}
```

## Entry claim_a63132a3f76d6b8ea05461c48c818836

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json",
  "collection": "registryGaps",
  "claimId": "claim_a63132a3f76d6b8ea05461c48c818836",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s9-runner-01.json",
  "before": {
    "claimId": "claim_a63132a3f76d6b8ea05461c48c818836",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "3f6a59c3d3764c1b978073ad68eb16ce1b0382d6bf362815f45ad79dd1625224",
    "authoredBy": "codex-session:unit-run-1792066534402-cb278bf5@2026-10-15",
    "reviewStatus": "reviewed",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-102",
    "targetUnitDigest": "b323720a9d4e93b156af47db347755f342dd8ad9fb9720466bb161732ebef4e3",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Pointers (implementation)"
    ],
    "rationale": "A34 pending predecessor disposition: All 49 historical lines remain in order; only unit-sync/run-timeout implementation pointers are inserted. Bound immutable witness and full current successor in step9-a42-predecessor-dispositions.json. No identity graft, truth approval or inherited review; revalidate/rebind at legacy cutover.",
    "reviewNote": "entry gap-claim_a63132a3f76d6b8ea05461c48c818836: deep: witness 8b4be4fcf unit unheaded-block-102 (L1208-1256, digest recomputed) to current runner.md#unheaded-block-102 (L1213-1263, digest recomputed); all 49 historical lines recur verbatim and in order in the 51 successor lines, so supersede is legal under A34 and no residual is needed; the 2 inserted successor lines are unit-sync.mjs and run-timeout.mjs pointers as the reason says; reason text is accurate, shard row equals pack, successor anchor exists",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-runner-bounded-rereview-b80e8c16c-part1.md",
    "reviewReportCommit": "11fc7590f7d0af4da10205359516aee0b0bff5c9",
    "reviewMode": "ordinary",
    "reviewEntryId": "gap-claim_a63132a3f76d6b8ea05461c48c818836",
    "evidenceDigest": "ddcc63f3f14921ed816bab258b99f56ff4d776c73598149b35351a162a6f22fa",
    "acceptanceScope": "Exact independently reviewed predecessor disposition and residual/group evidence only; no truth, promotion, retirement or cutover approval."
  },
  "currentDecision": {
    "claimId": "claim_a63132a3f76d6b8ea05461c48c818836",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "3f6a59c3d3764c1b978073ad68eb16ce1b0382d6bf362815f45ad79dd1625224",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-102",
    "targetUnitDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Pointers (implementation)"
    ],
    "rationale": "A34 pending predecessor disposition: All 49 historical lines remain in order; only unit-sync/run-timeout implementation pointers are inserted. Bound immutable witness and full current successor in step9-a42-predecessor-dispositions.json. No identity graft, truth approval or inherited review; revalidate/rebind at legacy cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "reviewEntryId": "gap-claim_a63132a3f76d6b8ea05461c48c818836",
    "evidenceDigest": "ddcc63f3f14921ed816bab258b99f56ff4d776c73598149b35351a162a6f22fa",
    "acceptanceScope": "Exact independently reviewed predecessor disposition and residual/group evidence only; no truth, promotion, retirement or cutover approval."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "ada833260f9657962f584363c765094e9637afa7f28baf519109cbd74eab6d15",
    "identityFingerprint": "ada833260f9657962f584363c765094e9637afa7f28baf519109cbd74eab6d15",
    "claimId": "claim_a63132a3f76d6b8ea05461c48c818836",
    "sourceAnchor": "unheaded-block-102",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3f6a59c3d3764c1b978073ad68eb16ce1b0382d6bf362815f45ad79dd1625224",
    "claimKind": "specification",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-102 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "8b4be4fcf99618be5edd86faa6080a1193d992be",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-102",
      "githubAnchor": "unheaded-block-102",
      "stableAnchor": "unheaded-block-102",
      "title": "Unheaded block 102",
      "startLine": 1208,
      "endLine": 1256,
      "textDigest": "3f6a59c3d3764c1b978073ad68eb16ce1b0382d6bf362815f45ad79dd1625224",
      "sample": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit",
      "identityFingerprint": "ada833260f9657962f584363c765094e9637afa7f28baf519109cbd74eab6d15",
      "ancestry": [
        "Spec: Runner (vòng tự hành)",
        "Pointers (implementation)"
      ],
      "text": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`.fgos/logs/entropy-history.jsonl`, gitignored, kể từ phase-01 plans/260825-0842-fgos-logs-dir-bucketing) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1): thuần (`rankCandidates(view)`), không fs/Date.now, tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa \"chưa ngã-ngũ\" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.\n- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: số nguyên giữ nguyên phép thử sống+ttl có sẵn, chuỗi chỉ xét độ mới theo `ttlMs` (không có gì để kiểm sống); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ). Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); gọi `resolveWriterIdentity()` rồi `acquireMainCheckoutLock` với `ttlMs` mặc định 300000 (5 phút, đọc đè được qua biến môi trường `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`) — số này chọn từ bằng chứng thật (khoảng cách giữa các commit thật của 3 sự cố STR65 có SHA, ~2-3.5 phút), giảm từ mức mặc định 15 phút ban đầu qua 10 phút xuống 5 phút; HELD/AMBIGUOUS → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0; ACQUIRED → thoát 0 im lặng.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-102",
    "githubAnchor": "unheaded-block-102",
    "stableAnchor": "unheaded-block-102",
    "title": "Unheaded block 102",
    "startLine": 1222,
    "endLine": 1272,
    "textDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "sample": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit",
    "identityFingerprint": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Pointers (implementation)"
    ],
    "text": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`.fgos/logs/entropy-history.jsonl`, gitignored, kể từ phase-01 plans/260825-0842-fgos-logs-dir-bucketing) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/execution/unit-sync.mjs` — sync base của Unit (RUL97 (a Unit may sync a base ref first)): `seedSync` (resolve ref trước khi unit run tồn tại), `runPendingSync`, `assertSyncResumable`, `syncBrief`, `commitRoundWithSync`; git tin cậy nằm ở `commit-unit-work.mjs` (`startSyncMerge`/`finishSyncMerge`/`syncMergeState`).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/dispatch/run-timeout.mjs` — sàn/trần thời gian của một lượt chạy (RUL96 (one run may take its own timeout)): `RUN_TIMEOUT_MIN_MS`, `RUN_TIMEOUT_MAX_MS`, `runTimeoutProblem`; leaf không import, đọc bởi `config.mjs` (`parseRunTimeout`, `assertRunTimeoutMs`), reaper confinement, khoá dispatch và `src/workflow/definition.mjs`.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1): thuần (`rankCandidates(view)`), không fs/Date.now, tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa \"chưa ngã-ngũ\" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.\n- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: mọi writer ghi `ttlMs` của chính nó vào record và người tranh xét record theo `ttlMs` ĐÓ, không bao giờ theo `ttlMs` của mình — số nguyên: pid sống VÀ còn trong ttl; chuỗi: chỉ xét độ mới (không có gì để kiểm sống); record cũ không có `ttlMs` nhận cửa sổ của writer cũ (chuỗi phiên do hook cũ ghi: `HOOK_TTL_MS` 20 s; pid: `DEFAULT_TTL_MS` 3 phút), mọi ttl bị chặn ở trần một run (4 h); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ); record có trường `v` (giao thức khóa mới hơn) hoặc marker `.fgos/runtime/locks/<tên khóa>/protocol.json` khác `{writer:1}` (một quyết định marker cho mọi cửa: acquire kiểm TRƯỚC khi ghi và kiểm lại sau acquire, `inspectMainCheckoutLock` kiểm trước nhánh \"không có file\", `forceReclaimAmbiguousLock` kiểm trước mọi sửa, hook và Rust `lock.rs` dùng cùng luật) → HELD với `reason: unsupported-protocol`; record có `v` kể cả khi mang đủ `pid`/`ts` không bao giờ bị dọn/làm mới/release (kể cả closure của một hold cũ và `releaseMainCheckoutLock`), `fgos unlock` từ chối và không bao giờ báo `cleared:true`. Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false` để không tái nhập hold của một operation khác cùng pid. Checkpoint `.fgos` (`runOpportunisticMainCheckoutChecks`) chạy trọn add → commit → reset-khi-lỗi trong mutex này: mutex thuộc tầng runner nên checkpoint (tầng kernel) nhận `mainCheckoutWriter` từ caller: caller đã giữ (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, caller chỉ giữ merge slot truyền `acquiringMainCheckoutWriter(dir)` (acquire rồi nhả ngay, bị giữ thì bỏ lượt); không có writer thì checkpoint không commit. Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); sau các guard `.fgos`/root-file/nhánh `fgw/*`, đọc `.fgos/main-checkout.lock` MỘT lần qua `inspectMainCheckoutLock` (không acquire, không chờ — git đã giữ `index.lock` khi hook chạy): pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp holder sống → commit của fgOS, bỏ qua đèn; holder pid số khác còn sống, giao thức khóa lạ, hoặc khóa hỏng → từ chối. Rồi `resolveWriterIdentity()` và đèn hoạt động `src/runner/main-checkout-activity.mjs` (`.fgos/runtime/main-checkout-activity.json`): writer khác trong `windowMs` → từ chối; còn lại ghi đèn cuối hook với `windowMs` = `HOOK_TTL_MS` 20 s (đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`); từ chối → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_a63132a3f76d6b8ea05461c48c818836"
}
```

