# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **2**. Target: `docs/platform/runner/spec.md`; part 1/1. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `7de501bbc6a8ffeff0234cc93ce4a4d62b012fcd1f9c5d9c0fc5219a8e02fb7a`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **2/2** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_a5f8435c8d549e5b41a34cf3e1f3e351"
    ],
    "Judgment": [
      "claim_d8ac30166d62dd668cf76d7dfb0a8170"
    ]
  },
  "unequalDigestPairs": [
    "claim_d8ac30166d62dd668cf76d7dfb0a8170"
  ],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_a5f8435c8d549e5b41a34cf3e1f3e351

Source digest: 6995106e543166fec7e46573ed70ab54a171c1d87f545ef19ade28df2cd97866

Target digest: 6995106e543166fec7e46573ed70ab54a171c1d87f545ef19ade28df2cd97866

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-1",
  "sourceLines": [
    1,
    7
  ],
  "sourceAncestry": [],
  "targetPath": "docs/platform/runner/spec.md",
  "targetAnchor": "unheaded-block-1",
  "targetAncestry": [],
  "nativeTargetClaimId": "claim_9e18cb6379ccc1a75eb0f38f5875e8b3",
  "class": "Weak-exact",
  "classReason": "document exact share below one half",
  "section": "preamble",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a5f8435c8d549e5b41a34cf3e1f3e351",
    "sourceUnitDigest": "6995106e543166fec7e46573ed70ab54a171c1d87f545ef19ade28df2cd97866",
    "targetOwner": "docs/platform/runner/spec.md",
    "targetAnchor": "unheaded-block-1",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: document exact share below one half. Whole unheaded-preamble docs/specs/runner.md#unheaded-block-1 (lines 1–7) carried at docs/platform/runner/spec.md#unheaded-block-1. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6995106e543166fec7e46573ed70ab54a171c1d87f545ef19ade28df2cd97866",
    "targetAncestry": []
  }
}
```

### Full source unit

```text
---
area: runner
updated: 2026-08-12
sources: [phase-2-routing, post-divorce-hardening, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, discovery-context, worker-execution, fan-out-parallel, human-rounds, worker-dispatch-log, self-improve-loop, base-workflow-model-s2, fgos-multi-session-checkout, github-adapter-s3, github-adapter-s4, work-graph-intelligence-s2b, work-graph-intelligence-s10, work-graph-intelligence-s11, fgos-sample-testbed, p50-workflow-induct, str68-discovery-judge-robustness, str76-runner-bootstrap, str86-runner-headless-git, str7-str8-priority-intent, str51-2-reclaim-self-mount-fix, mvp2-scope-test-infra, str46-io-contract-lat2, spec-docs-lifecycle-realignment]
decisions: [feed7428, 14396a5c, 1a80b4d3, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, cfae0120, 22699c61, 04a6cd05, 396d9d9e, 2e92b7a5, f0c40acc, 5a6900b2, 8575f1a3, c8df2479, cb09d6fd, b1aa1bdc, caecb9d1, 9b141173, a3176299, 140eb8a4, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, c11322cb, 2ac16176, f8a3a5d9, 3d4ea29c, 3c8e5926, 342102b9, d4c59ba2, 644916a4, ef6ed305, a4fe4c2b, f69951df, 5208dfe9, 8cf7effe, 7bbe6315, a7c93ec8, cfdd808f, 31b5f045, 87536f3f, 38f7e0b8, ecfd0d1a, f176c18a, d3445024, cf3ee399, fa12fd97, a58a7563, 6e2776cc, 8b95f883]
coverage: full
---
```

### Full target unit

```text
---
area: runner
updated: 2026-08-12
sources: [phase-2-routing, post-divorce-hardening, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, discovery-context, worker-execution, fan-out-parallel, human-rounds, worker-dispatch-log, self-improve-loop, base-workflow-model-s2, fgos-multi-session-checkout, github-adapter-s3, github-adapter-s4, work-graph-intelligence-s2b, work-graph-intelligence-s10, work-graph-intelligence-s11, fgos-sample-testbed, p50-workflow-induct, str68-discovery-judge-robustness, str76-runner-bootstrap, str86-runner-headless-git, str7-str8-priority-intent, str51-2-reclaim-self-mount-fix, mvp2-scope-test-infra, str46-io-contract-lat2, spec-docs-lifecycle-realignment]
decisions: [feed7428, 14396a5c, 1a80b4d3, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, cfae0120, 22699c61, 04a6cd05, 396d9d9e, 2e92b7a5, f0c40acc, 5a6900b2, 8575f1a3, c8df2479, cb09d6fd, b1aa1bdc, caecb9d1, 9b141173, a3176299, 140eb8a4, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, c11322cb, 2ac16176, f8a3a5d9, 3d4ea29c, 3c8e5926, 342102b9, d4c59ba2, 644916a4, ef6ed305, a4fe4c2b, f69951df, 5208dfe9, 8cf7effe, 7bbe6315, a7c93ec8, cfdd808f, 31b5f045, 87536f3f, 38f7e0b8, ecfd0d1a, f176c18a, d3445024, cf3ee399, fa12fd97, a58a7563, 6e2776cc, 8b95f883]
coverage: full
---
```

### Full diff

```diff
No text difference.
```

## claim_d8ac30166d62dd668cf76d7dfb0a8170

Source digest: a86d867279b4935bdfdfe419a3121f088ead4fe51ea0a62fbfec1da3949cb54c

Target digest: 8e268a88fd1470f40fe63c54b8f819ebdf8fcc3c539d6ad3165f39bd064ac705

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "spec-runner-vòng-tự-hành",
  "sourceLines": [
    9,
    9
  ],
  "sourceAncestry": [],
  "targetPath": "docs/platform/runner/spec.md",
  "targetAnchor": "spec-runner-vòng-tự-hành",
  "targetAncestry": [],
  "nativeTargetClaimId": "claim_000804c22dd42adbd92302318e8c6ca7",
  "class": "Judgment",
  "classReason": "no target digest match",
  "section": "spec-runner-vòng-tự-hành",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d8ac30166d62dd668cf76d7dfb0a8170",
    "sourceUnitDigest": "a86d867279b4935bdfdfe419a3121f088ead4fe51ea0a62fbfec1da3949cb54c",
    "targetOwner": "docs/platform/runner/spec.md",
    "targetAnchor": "spec-runner-vòng-tự-hành",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Judgment: no target digest match. Whole heading docs/specs/runner.md#spec-runner-vòng-tự-hành (lines 9–9) carried at docs/platform/runner/spec.md#spec-runner-vòng-tự-hành. Original H1 and direct source payload remain verbatim; its section digest changes because P3 candidate metadata follows the H1. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8e268a88fd1470f40fe63c54b8f819ebdf8fcc3c539d6ad3165f39bd064ac705",
    "targetAncestry": []
  }
}
```

### Full source unit

```text
# Spec: Runner (vòng tự hành)
```

### Full target unit

````text
# Spec: Runner (vòng tự hành)

```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve frozen-map runner content for independent conservation review
Design status: Candidate
Implementation: Carriage only; implementation truth not certified
Provenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing runner carriage, placement and conservation
Do not use this for: Canonical behavior, source retirement or current truth proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/runner.md
Supersedes: None; legacy authority retained
Superseded by: None
```

> Added in candidate: Metadata and map-based placement scaffolding. The area introduction follows the frozen map into architecture/h-e53a3a9829a8.md. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim.
````

### Full diff

````diff
diff --git a/tmp/fgos-work/step9-source-unit b/tmp/fgos-work/step9-target-unit
index a5e3570b3..c902dede5 100644
--- a/tmp/fgos-work/step9-source-unit
+++ b/tmp/fgos-work/step9-target-unit
@@ -1 +1,22 @@
-# Spec: Runner (vòng tự hành)
\ No newline at end of file
+# Spec: Runner (vòng tự hành)
+
+```txt
+Document type: Specification
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve frozen-map runner content for independent conservation review
+Design status: Candidate
+Implementation: Carriage only; implementation truth not certified
+Provenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing runner carriage, placement and conservation
+Do not use this for: Canonical behavior, source retirement or current truth proof
+Last reviewed: Not independently reviewed; authored 2026-10-15
+Related:
+- docs/specs/runner.md
+Supersedes: None; legacy authority retained
+Superseded by: None
+```
+
+> Added in candidate: Metadata and map-based placement scaffolding. The area introduction follows the frozen map into architecture/h-e53a3a9829a8.md. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim.
\ No newline at end of file

````
