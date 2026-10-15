# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-07-architecture-advisory-panel.json
Original shard SHA256: 8808f66639ca2d88f5f4ce0705f2487584a34941f4858de6643a03c77678f8be
Source file: docs/architect/proposals/architecture-advisory-panel.md
Part 1/2; entries: **80**. Source-file group 7/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (5): `claim_45a73c31fae3d141bfa8135d542a01b4`, `claim_b7d291d64adeb83b2093e6be3990a41c`, `claim_ff302d4fba8c16fa09c0534ad4bc96d4`, `claim_261388005dee058fbf5654fd71423700`, `claim_c9589a9aac2a821697b1a0942e121c84`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (1): `claim_45a73c31fae3d141bfa8135d542a01b4`.

Weak-exact/Judgment population: 23; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_45a73c31fae3d141bfa8135d542a01b4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/proposals/architecture-advisory-panel.md#architecture-advisory-panel, lines 1–1.
Target: docs/platform/proposals/architecture-advisory-panel.md#architecture-advisory-panel.
Source digest: aef9241c6773a4fee5177cccf3d4f1288dde72d533970dc7ca230f4dd117bdf6
Target digest: e82955a32175ed9d12dfcadf8373ba47a507a1e58d54bab7a9a30065d78d977d
Shown source SHA256: 0f8745e90974d21d817d3a9f069bdcaf7c174a2068587cd716aab968b290a7a3
Shown target SHA256: 8703ef5974c83ef716be28fd6eacc97dbccf32dcc36e09814fcc7b254a7b645c

### Proposed decision

```json
{
  "claimId": "claim_45a73c31fae3d141bfa8135d542a01b4",
  "sourceUnitDigest": "aef9241c6773a4fee5177cccf3d4f1288dde72d533970dc7ca230f4dd117bdf6",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "architecture-advisory-panel",
  "targetUnitDigest": "e82955a32175ed9d12dfcadf8373ba47a507a1e58d54bab7a9a30065d78d977d",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#architecture-advisory-panel (lines 1–1) is carried at docs/platform/proposals/architecture-advisory-panel.md#architecture-advisory-panel (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
# Architecture Advisory Panel

Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-05
Canonical for: nothing until explicitly accepted and promoted

Scope: define the next natural Group Thinking use case after the coding-focused
`fgos-code-panel`: a bounded advisory panel that can understand an initially
clear or unclear software-system problem, investigate before asking a person,
develop and challenge architecture alternatives, explain its recommendation,
and remain available for a decision dialogue without taking decision authority
from the person.

Related:
[Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),
[Group Thinking user guide](../../how-to/use-fgos-group-thinking.md), and
[`fgos-code-panel`](../../../.agents/skills/fgos-code-panel/SKILL.md).

Implementation plan:
[Architecture Advisory Panel execution track](../../../plans/260905-architecture-advisory-panel/plan.md).
```

### Full target shown text

`````text
# Architecture Advisory Panel

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/architecture-advisory-panel.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 9bb16cb08aef516e20efd07e896890f7eb7b3e1f
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/architecture-advisory-panel.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate proposal for the architecture-advisory use case, now served by core/workflows/architecture-advisory.yaml and core/skills/fgos-architecture-panel/SKILL.md. The original protocol was removed in 2180b4e72; its source Not started header is preserved as dated metadata. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/architecture-advisory-panel.md).


Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-05
Canonical for: nothing until explicitly accepted and promoted

Scope: define the next natural Group Thinking use case after the coding-focused
`fgos-code-panel`: a bounded advisory panel that can understand an initially
clear or unclear software-system problem, investigate before asking a person,
develop and challenge architecture alternatives, explain its recommendation,
and remain available for a decision dialogue without taking decision authority
from the person.

````markdown
Related:
[Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),
[Group Thinking user guide](../../how-to/use-fgos-group-thinking.md), and
[`fgos-code-panel`](../../../.agents/skills/fgos-code-panel/SKILL.md).
````


````markdown
Implementation plan:
[Architecture Advisory Panel execution track](../../../plans/260905-architecture-advisory-panel/plan.md).
````
`````

### Correction before/after and reasons

```json
{
  "claimId": "claim_45a73c31fae3d141bfa8135d542a01b4",
  "source": "docs/architect/proposals/architecture-advisory-panel.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-07-architecture-advisory-panel.json",
  "reasons": [
    "R7-1/R7-6 labelled neutral placement metadata and extracted-unit consequence"
  ],
  "before": {
    "claimId": "claim_45a73c31fae3d141bfa8135d542a01b4",
    "sourceUnitDigest": "aef9241c6773a4fee5177cccf3d4f1288dde72d533970dc7ca230f4dd117bdf6",
    "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
    "targetAnchor": "architecture-advisory-panel",
    "targetUnitDigest": "320bf20b62d31599e6906394bd5aaecbf1c0fc395fd1179adfac45b3cdade80f",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#architecture-advisory-panel (lines 1–1) is carried at docs/platform/proposals/architecture-advisory-panel.md#architecture-advisory-panel (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  },
  "after": {
    "claimId": "claim_45a73c31fae3d141bfa8135d542a01b4",
    "sourceUnitDigest": "aef9241c6773a4fee5177cccf3d4f1288dde72d533970dc7ca230f4dd117bdf6",
    "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
    "targetAnchor": "architecture-advisory-panel",
    "targetUnitDigest": "e82955a32175ed9d12dfcadf8373ba47a507a1e58d54bab7a9a30065d78d977d",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#architecture-advisory-panel (lines 1–1) is carried at docs/platform/proposals/architecture-advisory-panel.md#architecture-advisory-panel (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  }
}
```

## claim_e4d03af71785136f44f4721c291091bd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-1, lines 3–7.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-4.
Source digest: c796df6a48fa21294a1a724666c204188abbbbe42284ff7e382030c3746b6b5d
Target digest: c796df6a48fa21294a1a724666c204188abbbbe42284ff7e382030c3746b6b5d
Shown source SHA256: c796df6a48fa21294a1a724666c204188abbbbe42284ff7e382030c3746b6b5d
Shown target SHA256: c796df6a48fa21294a1a724666c204188abbbbe42284ff7e382030c3746b6b5d

### Proposed decision

```json
{
  "claimId": "claim_e4d03af71785136f44f4721c291091bd",
  "sourceUnitDigest": "c796df6a48fa21294a1a724666c204188abbbbe42284ff7e382030c3746b6b5d",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "c796df6a48fa21294a1a724666c204188abbbbe42284ff7e382030c3746b6b5d",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-1 (lines 3–7) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-4 (lines 27–31); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-05
Canonical for: nothing until explicitly accepted and promoted
```

### Full target shown text

```text
Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-05
Canonical for: nothing until explicitly accepted and promoted
```

## claim_1a027c3d28203805631d0db27f2ca7ae

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-2, lines 9–14.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-5.
Source digest: 6a101a56fb3865f022bf6c11942482c8af41c0d558df875af387de9437c40594
Target digest: 6a101a56fb3865f022bf6c11942482c8af41c0d558df875af387de9437c40594
Shown source SHA256: 6a101a56fb3865f022bf6c11942482c8af41c0d558df875af387de9437c40594
Shown target SHA256: 6a101a56fb3865f022bf6c11942482c8af41c0d558df875af387de9437c40594

### Proposed decision

```json
{
  "claimId": "claim_1a027c3d28203805631d0db27f2ca7ae",
  "sourceUnitDigest": "6a101a56fb3865f022bf6c11942482c8af41c0d558df875af387de9437c40594",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "6a101a56fb3865f022bf6c11942482c8af41c0d558df875af387de9437c40594",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-2 (lines 9–14) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-5 (lines 33–38); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Scope: define the next natural Group Thinking use case after the coding-focused
`fgos-code-panel`: a bounded advisory panel that can understand an initially
clear or unclear software-system problem, investigate before asking a person,
develop and challenge architecture alternatives, explain its recommendation,
and remain available for a decision dialogue without taking decision authority
from the person.
```

### Full target shown text

```text
Scope: define the next natural Group Thinking use case after the coding-focused
`fgos-code-panel`: a bounded advisory panel that can understand an initially
clear or unclear software-system problem, investigate before asking a person,
develop and challenge architecture alternatives, explain its recommendation,
and remain available for a decision dialogue without taking decision authority
from the person.
```

## claim_b7d291d64adeb83b2093e6be3990a41c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-3, lines 16–22.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-6.
Source digest: 6703b82f815751a15c7bd3c8e4f6bb8bd1d6ee3147856f9898461c08ed951229
Target digest: 91c501dfe5206a1a8a213acc7a0f88364bb5740d2d8000c7b3f8a18b9876fde8
Shown source SHA256: 6703b82f815751a15c7bd3c8e4f6bb8bd1d6ee3147856f9898461c08ed951229
Shown target SHA256: 91c501dfe5206a1a8a213acc7a0f88364bb5740d2d8000c7b3f8a18b9876fde8

### Proposed decision

```json
{
  "claimId": "claim_b7d291d64adeb83b2093e6be3990a41c",
  "sourceUnitDigest": "6703b82f815751a15c7bd3c8e4f6bb8bd1d6ee3147856f9898461c08ed951229",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "91c501dfe5206a1a8a213acc7a0f88364bb5740d2d8000c7b3f8a18b9876fde8",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-3 (lines 16–22) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-6 (lines 40–48); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Related:
[Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),
[Group Thinking user guide](../../how-to/use-fgos-group-thinking.md), and
[`fgos-code-panel`](../../../.agents/skills/fgos-code-panel/SKILL.md).
```

### Full target shown text

`````text
````markdown
Related:
[Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),
[Group Thinking user guide](../../how-to/use-fgos-group-thinking.md), and
[`fgos-code-panel`](../../../.agents/skills/fgos-code-panel/SKILL.md).
````
`````

## claim_ff302d4fba8c16fa09c0534ad4bc96d4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-4, lines 24–25.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-7.
Source digest: e62001e4512f962fc42d43b3e399bb9a7e773f1881e60f08610d4b584e21022e
Target digest: 8f2d045f97123626847251e2667a3b9b0b39e051687221870b483d8820cec1b1
Shown source SHA256: e62001e4512f962fc42d43b3e399bb9a7e773f1881e60f08610d4b584e21022e
Shown target SHA256: 8f2d045f97123626847251e2667a3b9b0b39e051687221870b483d8820cec1b1

### Proposed decision

```json
{
  "claimId": "claim_ff302d4fba8c16fa09c0534ad4bc96d4",
  "sourceUnitDigest": "e62001e4512f962fc42d43b3e399bb9a7e773f1881e60f08610d4b584e21022e",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "8f2d045f97123626847251e2667a3b9b0b39e051687221870b483d8820cec1b1",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-4 (lines 24–25) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-7 (lines 51–54); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Implementation plan:
[Architecture Advisory Panel execution track](../../../plans/260905-architecture-advisory-panel/plan.md).
```

### Full target shown text

`````text
````markdown
Implementation plan:
[Architecture Advisory Panel execution track](../../../plans/260905-architecture-advisory-panel/plan.md).
````
`````

## claim_261388005dee058fbf5654fd71423700

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/architecture-advisory-panel.md#1-why-this-use-case-exists, lines 27–27.
Target: docs/platform/proposals/architecture-advisory-panel.md#1-why-this-use-case-exists.
Source digest: 79bf9bfe96f9639354bb5f881c56a0c9778d40618b5902cf139890284866204e
Target digest: 136816209d1b8dfb993d49319d15ed3e687d1df9927f8bece40f01ddc34bfab5
Shown source SHA256: eaceb1ef7305dcbf38888a0344161e8a69e1afa1cad67b565ad66de5037b0c9a
Shown target SHA256: f4d86c0596736b531754f6b6c0ef9740899b7145f6095f22af82694e9bd2b005

### Proposed decision

```json
{
  "claimId": "claim_261388005dee058fbf5654fd71423700",
  "sourceUnitDigest": "79bf9bfe96f9639354bb5f881c56a0c9778d40618b5902cf139890284866204e",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "1-why-this-use-case-exists",
  "targetUnitDigest": "136816209d1b8dfb993d49319d15ed3e687d1df9927f8bece40f01ddc34bfab5",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#1-why-this-use-case-exists (lines 27–27) is carried at docs/platform/proposals/architecture-advisory-panel.md#1-why-this-use-case-exists (lines 57–57); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 1. Why This Use Case Exists

Architecture follow-up: [Coordination Capability Envelope](coordination-capability-envelope.md)
compares the substrate alternatives after the independent review. Read it before
turning this proposal's phase, round, or posture defaults into runtime legality.
It remains Discussion; neither document accepts the other's proposed contracts.

`fgos-code-panel` starts with one concrete code change. Its group works toward a
bounded implementation result, independently reviews and attacks that result,
and hands a verified patch back to the Lead. It deliberately rejects design-doc
ceremony and sends larger design questions elsewhere.

Architecture advice begins earlier. A person may arrive with a precise system
boundary and decision, or only a symptom, an intuition, and partial context. A
useful advisory group cannot respond to the latter with only "what do you
want?" It must first make its best effort to understand the person and the real
problem, inspect evidence that is available to it, distinguish facts from
inferences, and ask only for material knowledge or authority that remains
exclusive to the person.

The intended product sequence is therefore:

```text
concrete code change
  -> fgos-code-panel

software-system question, unclear problem, or architecture decision
  -> architecture-advisory-panel
  -> person decides
  -> implementation planning or a later code/plan panel
```

The panel is a group of advisors, not a requirements form, an autonomous design
authority, a voting council, or an implementation executor.

It is also a real multi-agent panel, not one model narrating several imaginary
roles. Each role remains independently dispatchable through the shared Agent
Coordination dispatch path. A declared-protocol session can bind a different
executor, tier, and persona per actor; provider/model is derived from the
executor's `providerModel` and tier policy. Direct `actors[].model` override is
not a current declared-protocol capability and must not be implied.
````

### Full target shown text

````text
## 1. Why This Use Case Exists

Architecture follow-up: [Coordination Capability Envelope](../../architect/proposals/coordination-capability-envelope.md)
compares the substrate alternatives after the independent review. Read it before
turning this proposal's phase, round, or posture defaults into runtime legality.
It remains Discussion; neither document accepts the other's proposed contracts.

`fgos-code-panel` starts with one concrete code change. Its group works toward a
bounded implementation result, independently reviews and attacks that result,
and hands a verified patch back to the Lead. It deliberately rejects design-doc
ceremony and sends larger design questions elsewhere.

Architecture advice begins earlier. A person may arrive with a precise system
boundary and decision, or only a symptom, an intuition, and partial context. A
useful advisory group cannot respond to the latter with only "what do you
want?" It must first make its best effort to understand the person and the real
problem, inspect evidence that is available to it, distinguish facts from
inferences, and ask only for material knowledge or authority that remains
exclusive to the person.

The intended product sequence is therefore:

```text
concrete code change
  -> fgos-code-panel

software-system question, unclear problem, or architecture decision
  -> architecture-advisory-panel
  -> person decides
  -> implementation planning or a later code/plan panel
```

The panel is a group of advisors, not a requirements form, an autonomous design
authority, a voting council, or an implementation executor.

It is also a real multi-agent panel, not one model narrating several imaginary
roles. Each role remains independently dispatchable through the shared Agent
Coordination dispatch path. A declared-protocol session can bind a different
executor, tier, and persona per actor; provider/model is derived from the
executor's `providerModel` and tier policy. Direct `actors[].model` override is
not a current declared-protocol capability and must not be implied.
````

## claim_c9589a9aac2a821697b1a0942e121c84

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-5, lines 29–32.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-8.
Source digest: 1931a38a18229f97e8363e60a58fa6c9259c0209faaf59506fedd68c64cc348c
Target digest: aea9f69a683ed485fba138c7d4c9740fec96e8ad7b715680fdc065a60bca1694
Shown source SHA256: 1931a38a18229f97e8363e60a58fa6c9259c0209faaf59506fedd68c64cc348c
Shown target SHA256: aea9f69a683ed485fba138c7d4c9740fec96e8ad7b715680fdc065a60bca1694

### Proposed decision

```json
{
  "claimId": "claim_c9589a9aac2a821697b1a0942e121c84",
  "sourceUnitDigest": "1931a38a18229f97e8363e60a58fa6c9259c0209faaf59506fedd68c64cc348c",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "aea9f69a683ed485fba138c7d4c9740fec96e8ad7b715680fdc065a60bca1694",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "1. Why This Use Case Exists"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-5 (lines 29–32) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-8 (lines 59–62); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Architecture follow-up: [Coordination Capability Envelope](coordination-capability-envelope.md)
compares the substrate alternatives after the independent review. Read it before
turning this proposal's phase, round, or posture defaults into runtime legality.
It remains Discussion; neither document accepts the other's proposed contracts.
```

### Full target shown text

```text
Architecture follow-up: [Coordination Capability Envelope](../../architect/proposals/coordination-capability-envelope.md)
compares the substrate alternatives after the independent review. Read it before
turning this proposal's phase, round, or posture defaults into runtime legality.
It remains Discussion; neither document accepts the other's proposed contracts.
```

## claim_cf8a0a304268918d85b35fc5131db131

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-6, lines 34–37.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-9.
Source digest: ab4d2af2ca2b6a81e5b15c610f07c51fffcfbce034cf3f9b3681fcfa6e9a261a
Target digest: ab4d2af2ca2b6a81e5b15c610f07c51fffcfbce034cf3f9b3681fcfa6e9a261a
Shown source SHA256: ab4d2af2ca2b6a81e5b15c610f07c51fffcfbce034cf3f9b3681fcfa6e9a261a
Shown target SHA256: ab4d2af2ca2b6a81e5b15c610f07c51fffcfbce034cf3f9b3681fcfa6e9a261a

### Proposed decision

```json
{
  "claimId": "claim_cf8a0a304268918d85b35fc5131db131",
  "sourceUnitDigest": "ab4d2af2ca2b6a81e5b15c610f07c51fffcfbce034cf3f9b3681fcfa6e9a261a",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "ab4d2af2ca2b6a81e5b15c610f07c51fffcfbce034cf3f9b3681fcfa6e9a261a",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "1. Why This Use Case Exists"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-6 (lines 34–37) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-9 (lines 64–67); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
`fgos-code-panel` starts with one concrete code change. Its group works toward a
bounded implementation result, independently reviews and attacks that result,
and hands a verified patch back to the Lead. It deliberately rejects design-doc
ceremony and sends larger design questions elsewhere.
```

### Full target shown text

```text
`fgos-code-panel` starts with one concrete code change. Its group works toward a
bounded implementation result, independently reviews and attacks that result,
and hands a verified patch back to the Lead. It deliberately rejects design-doc
ceremony and sends larger design questions elsewhere.
```

## claim_d082a215012922c4a828d2b7ea17bf76

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-7, lines 39–45.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-10.
Source digest: b2c6fa94292cd653b27bf472c61874fc9ab61c71fda2b201115a8461417f2ff9
Target digest: b2c6fa94292cd653b27bf472c61874fc9ab61c71fda2b201115a8461417f2ff9
Shown source SHA256: b2c6fa94292cd653b27bf472c61874fc9ab61c71fda2b201115a8461417f2ff9
Shown target SHA256: b2c6fa94292cd653b27bf472c61874fc9ab61c71fda2b201115a8461417f2ff9

### Proposed decision

```json
{
  "claimId": "claim_d082a215012922c4a828d2b7ea17bf76",
  "sourceUnitDigest": "b2c6fa94292cd653b27bf472c61874fc9ab61c71fda2b201115a8461417f2ff9",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "b2c6fa94292cd653b27bf472c61874fc9ab61c71fda2b201115a8461417f2ff9",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "1. Why This Use Case Exists"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-7 (lines 39–45) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-10 (lines 69–75); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Architecture advice begins earlier. A person may arrive with a precise system
boundary and decision, or only a symptom, an intuition, and partial context. A
useful advisory group cannot respond to the latter with only "what do you
want?" It must first make its best effort to understand the person and the real
problem, inspect evidence that is available to it, distinguish facts from
inferences, and ask only for material knowledge or authority that remains
exclusive to the person.
```

### Full target shown text

```text
Architecture advice begins earlier. A person may arrive with a precise system
boundary and decision, or only a symptom, an intuition, and partial context. A
useful advisory group cannot respond to the latter with only "what do you
want?" It must first make its best effort to understand the person and the real
problem, inspect evidence that is available to it, distinguish facts from
inferences, and ask only for material knowledge or authority that remains
exclusive to the person.
```

## claim_695e3e41f1b93592d72ea783de22de16

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-8, lines 47–47.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-11.
Source digest: 479d17dda0c37b78ff5da9edf47aeb729f039f0e7beb26cf06551eb759968c56
Target digest: 479d17dda0c37b78ff5da9edf47aeb729f039f0e7beb26cf06551eb759968c56
Shown source SHA256: 479d17dda0c37b78ff5da9edf47aeb729f039f0e7beb26cf06551eb759968c56
Shown target SHA256: 479d17dda0c37b78ff5da9edf47aeb729f039f0e7beb26cf06551eb759968c56

### Proposed decision

```json
{
  "claimId": "claim_695e3e41f1b93592d72ea783de22de16",
  "sourceUnitDigest": "479d17dda0c37b78ff5da9edf47aeb729f039f0e7beb26cf06551eb759968c56",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "479d17dda0c37b78ff5da9edf47aeb729f039f0e7beb26cf06551eb759968c56",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "1. Why This Use Case Exists"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-8 (lines 47–47) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-11 (lines 77–77); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The intended product sequence is therefore:
```

### Full target shown text

```text
The intended product sequence is therefore:
```

## claim_a519cbda712bf26c20b0e57d9d5832be

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-9, lines 49–57.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-12.
Source digest: 3be706cfd36ce8f501f3bd2b816f48176fe550666bf28c4b0fb46579ad27fc7b
Target digest: 3be706cfd36ce8f501f3bd2b816f48176fe550666bf28c4b0fb46579ad27fc7b
Shown source SHA256: 3be706cfd36ce8f501f3bd2b816f48176fe550666bf28c4b0fb46579ad27fc7b
Shown target SHA256: 3be706cfd36ce8f501f3bd2b816f48176fe550666bf28c4b0fb46579ad27fc7b

### Proposed decision

```json
{
  "claimId": "claim_a519cbda712bf26c20b0e57d9d5832be",
  "sourceUnitDigest": "3be706cfd36ce8f501f3bd2b816f48176fe550666bf28c4b0fb46579ad27fc7b",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "3be706cfd36ce8f501f3bd2b816f48176fe550666bf28c4b0fb46579ad27fc7b",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "1. Why This Use Case Exists"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-9 (lines 49–57) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-12 (lines 79–87); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```text
concrete code change
  -> fgos-code-panel

software-system question, unclear problem, or architecture decision
  -> architecture-advisory-panel
  -> person decides
  -> implementation planning or a later code/plan panel
```
````

### Full target shown text

````text
```text
concrete code change
  -> fgos-code-panel

software-system question, unclear problem, or architecture decision
  -> architecture-advisory-panel
  -> person decides
  -> implementation planning or a later code/plan panel
```
````

## claim_7df21f360d6287284f14ebeb07538e27

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-10, lines 59–60.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-13.
Source digest: 894e44ee45063d90656ac687adf4c5cfd4aeb50ae90039a25d10c2eef4a009f7
Target digest: 894e44ee45063d90656ac687adf4c5cfd4aeb50ae90039a25d10c2eef4a009f7
Shown source SHA256: 894e44ee45063d90656ac687adf4c5cfd4aeb50ae90039a25d10c2eef4a009f7
Shown target SHA256: 894e44ee45063d90656ac687adf4c5cfd4aeb50ae90039a25d10c2eef4a009f7

### Proposed decision

```json
{
  "claimId": "claim_7df21f360d6287284f14ebeb07538e27",
  "sourceUnitDigest": "894e44ee45063d90656ac687adf4c5cfd4aeb50ae90039a25d10c2eef4a009f7",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "894e44ee45063d90656ac687adf4c5cfd4aeb50ae90039a25d10c2eef4a009f7",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "1. Why This Use Case Exists"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-10 (lines 59–60) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-13 (lines 89–90); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The panel is a group of advisors, not a requirements form, an autonomous design
authority, a voting council, or an implementation executor.
```

### Full target shown text

```text
The panel is a group of advisors, not a requirements form, an autonomous design
authority, a voting council, or an implementation executor.
```

## claim_f7a066620aaefbcb03cf7b8ec4dbb454

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-11, lines 62–67.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-14.
Source digest: d8b38a87908cb6d31700a79bbda50b6c371ff86b8a87d9e9e79cdf122f0b2772
Target digest: d8b38a87908cb6d31700a79bbda50b6c371ff86b8a87d9e9e79cdf122f0b2772
Shown source SHA256: d8b38a87908cb6d31700a79bbda50b6c371ff86b8a87d9e9e79cdf122f0b2772
Shown target SHA256: d8b38a87908cb6d31700a79bbda50b6c371ff86b8a87d9e9e79cdf122f0b2772

### Proposed decision

```json
{
  "claimId": "claim_f7a066620aaefbcb03cf7b8ec4dbb454",
  "sourceUnitDigest": "d8b38a87908cb6d31700a79bbda50b6c371ff86b8a87d9e9e79cdf122f0b2772",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "d8b38a87908cb6d31700a79bbda50b6c371ff86b8a87d9e9e79cdf122f0b2772",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "1. Why This Use Case Exists"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-11 (lines 62–67) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-14 (lines 92–97); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
It is also a real multi-agent panel, not one model narrating several imaginary
roles. Each role remains independently dispatchable through the shared Agent
Coordination dispatch path. A declared-protocol session can bind a different
executor, tier, and persona per actor; provider/model is derived from the
executor's `providerModel` and tier policy. Direct `actors[].model` override is
not a current declared-protocol capability and must not be implied.
```

### Full target shown text

```text
It is also a real multi-agent panel, not one model narrating several imaginary
roles. Each role remains independently dispatchable through the shared Agent
Coordination dispatch path. A declared-protocol session can bind a different
executor, tier, and persona per actor; provider/model is derived from the
executor's `providerModel` and tier policy. Direct `actors[].model` override is
not a current declared-protocol capability and must not be implied.
```

## claim_4802d3f54de099ddfd1d1faee1df3604

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#2-intended-outcome, lines 69–69.
Target: docs/platform/proposals/architecture-advisory-panel.md#2-intended-outcome.
Source digest: a00533cf78dffd0899eaf4750697ab6c01486d40c78651d62a9f5bc8cedf7593
Target digest: a00533cf78dffd0899eaf4750697ab6c01486d40c78651d62a9f5bc8cedf7593
Shown source SHA256: bc61e983609e7cdc03e7c397ed99bd6a30ae719ff5bfd6640afd0710c5e7d0e4
Shown target SHA256: bc61e983609e7cdc03e7c397ed99bd6a30ae719ff5bfd6640afd0710c5e7d0e4

### Proposed decision

```json
{
  "claimId": "claim_4802d3f54de099ddfd1d1faee1df3604",
  "sourceUnitDigest": "a00533cf78dffd0899eaf4750697ab6c01486d40c78651d62a9f5bc8cedf7593",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "2-intended-outcome",
  "targetUnitDigest": "a00533cf78dffd0899eaf4750697ab6c01486d40c78651d62a9f5bc8cedf7593",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#2-intended-outcome (lines 69–69) is carried at docs/platform/proposals/architecture-advisory-panel.md#2-intended-outcome (lines 99–99); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 2. Intended Outcome

The panel produces an evidence-linked `AdvisoryDecisionPacket` that lets a
person understand:

- how the panel currently understands the person, problem, and desired outcome;
- which claims are verified facts, inferences, assumptions, or unknowns;
- which architecture options are credible and why;
- the material trade-offs, failure modes, migration consequences, and
  irreversible choices of each option;
- what the panel recommends, what credible minority positions remain, and what
  would reverse the recommendation;
- which decision belongs to the person and what follows from each choice.

The first recommendation begins a decision dialogue. It is not a one-way final
answer. The person may challenge its reasoning, ask for clarification, add new
context, request another alternative, request a composition of alternatives,
or decide. The panel assesses the impact and reopens only the earliest affected
part of deliberation rather than restarting indiscriminately.
```

### Full target shown text

```text
## 2. Intended Outcome

The panel produces an evidence-linked `AdvisoryDecisionPacket` that lets a
person understand:

- how the panel currently understands the person, problem, and desired outcome;
- which claims are verified facts, inferences, assumptions, or unknowns;
- which architecture options are credible and why;
- the material trade-offs, failure modes, migration consequences, and
  irreversible choices of each option;
- what the panel recommends, what credible minority positions remain, and what
  would reverse the recommendation;
- which decision belongs to the person and what follows from each choice.

The first recommendation begins a decision dialogue. It is not a one-way final
answer. The person may challenge its reasoning, ask for clarification, add new
context, request another alternative, request a composition of alternatives,
or decide. The panel assesses the impact and reopens only the earliest affected
part of deliberation rather than restarting indiscriminately.
```

## claim_aba3247fbb5ba7a3a35f809703129d65

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-12, lines 71–72.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-15.
Source digest: 67b2833b3ed39df518c271d44c490ca90eb96a2da14710d8c7832dc0f55483ab
Target digest: 67b2833b3ed39df518c271d44c490ca90eb96a2da14710d8c7832dc0f55483ab
Shown source SHA256: 67b2833b3ed39df518c271d44c490ca90eb96a2da14710d8c7832dc0f55483ab
Shown target SHA256: 67b2833b3ed39df518c271d44c490ca90eb96a2da14710d8c7832dc0f55483ab

### Proposed decision

```json
{
  "claimId": "claim_aba3247fbb5ba7a3a35f809703129d65",
  "sourceUnitDigest": "67b2833b3ed39df518c271d44c490ca90eb96a2da14710d8c7832dc0f55483ab",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "67b2833b3ed39df518c271d44c490ca90eb96a2da14710d8c7832dc0f55483ab",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "2. Intended Outcome"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-12 (lines 71–72) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-15 (lines 101–102); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The panel produces an evidence-linked `AdvisoryDecisionPacket` that lets a
person understand:
```

### Full target shown text

```text
The panel produces an evidence-linked `AdvisoryDecisionPacket` that lets a
person understand:
```

## claim_169a8382f92011f1ae8c6c6ad734e369

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-13, lines 74–81.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-16.
Source digest: fd73ae6d0b0d14c90e9758db1251c82b572905c9b941dc934d2df950983b4715
Target digest: fd73ae6d0b0d14c90e9758db1251c82b572905c9b941dc934d2df950983b4715
Shown source SHA256: fd73ae6d0b0d14c90e9758db1251c82b572905c9b941dc934d2df950983b4715
Shown target SHA256: fd73ae6d0b0d14c90e9758db1251c82b572905c9b941dc934d2df950983b4715

### Proposed decision

```json
{
  "claimId": "claim_169a8382f92011f1ae8c6c6ad734e369",
  "sourceUnitDigest": "fd73ae6d0b0d14c90e9758db1251c82b572905c9b941dc934d2df950983b4715",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "fd73ae6d0b0d14c90e9758db1251c82b572905c9b941dc934d2df950983b4715",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "2. Intended Outcome"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-13 (lines 74–81) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-16 (lines 104–111); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- how the panel currently understands the person, problem, and desired outcome;
- which claims are verified facts, inferences, assumptions, or unknowns;
- which architecture options are credible and why;
- the material trade-offs, failure modes, migration consequences, and
  irreversible choices of each option;
- what the panel recommends, what credible minority positions remain, and what
  would reverse the recommendation;
- which decision belongs to the person and what follows from each choice.
```

### Full target shown text

```text
- how the panel currently understands the person, problem, and desired outcome;
- which claims are verified facts, inferences, assumptions, or unknowns;
- which architecture options are credible and why;
- the material trade-offs, failure modes, migration consequences, and
  irreversible choices of each option;
- what the panel recommends, what credible minority positions remain, and what
  would reverse the recommendation;
- which decision belongs to the person and what follows from each choice.
```

## claim_2659734c9513dea29c03f448379533bf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-14, lines 83–87.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-17.
Source digest: 365529c1fbc36fb5ea655875ea824c1c0900b3f8d10d743869c83f7a5d9a89bc
Target digest: 365529c1fbc36fb5ea655875ea824c1c0900b3f8d10d743869c83f7a5d9a89bc
Shown source SHA256: 365529c1fbc36fb5ea655875ea824c1c0900b3f8d10d743869c83f7a5d9a89bc
Shown target SHA256: 365529c1fbc36fb5ea655875ea824c1c0900b3f8d10d743869c83f7a5d9a89bc

### Proposed decision

```json
{
  "claimId": "claim_2659734c9513dea29c03f448379533bf",
  "sourceUnitDigest": "365529c1fbc36fb5ea655875ea824c1c0900b3f8d10d743869c83f7a5d9a89bc",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "365529c1fbc36fb5ea655875ea824c1c0900b3f8d10d743869c83f7a5d9a89bc",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "2. Intended Outcome"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-14 (lines 83–87) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-17 (lines 113–117); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The first recommendation begins a decision dialogue. It is not a one-way final
answer. The person may challenge its reasoning, ask for clarification, add new
context, request another alternative, request a composition of alternatives,
or decide. The panel assesses the impact and reopens only the earliest affected
part of deliberation rather than restarting indiscriminately.
```

### Full target shown text

```text
The first recommendation begins a decision dialogue. It is not a one-way final
answer. The person may challenge its reasoning, ask for clarification, add new
context, request another alternative, request a composition of alternatives,
or decide. The panel assesses the impact and reopens only the earliest affected
part of deliberation rather than restarting indiscriminately.
```

## claim_aed9b7970d2b831a3ddc9d0fd930b092

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#3-authority-boundaries, lines 89–89.
Target: docs/platform/proposals/architecture-advisory-panel.md#3-authority-boundaries.
Source digest: f5de14acea626086126072d8b427a78e7f2dfaab3164c57d8d10a77c62167caa
Target digest: f5de14acea626086126072d8b427a78e7f2dfaab3164c57d8d10a77c62167caa
Shown source SHA256: 78e513b70a91ac115248cc4d6e647f557865db66814a94aa1d63b1fabf09d63e
Shown target SHA256: 78e513b70a91ac115248cc4d6e647f557865db66814a94aa1d63b1fabf09d63e

### Proposed decision

```json
{
  "claimId": "claim_aed9b7970d2b831a3ddc9d0fd930b092",
  "sourceUnitDigest": "f5de14acea626086126072d8b427a78e7f2dfaab3164c57d8d10a77c62167caa",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "3-authority-boundaries",
  "targetUnitDigest": "f5de14acea626086126072d8b427a78e7f2dfaab3164c57d8d10a77c62167caa",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#3-authority-boundaries (lines 89–89) is carried at docs/platform/proposals/architecture-advisory-panel.md#3-authority-boundaries (lines 119–119); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 3. Authority Boundaries

| Authority | Owner | Responsibility |
|---|---|---|
| Advisory authority | Panel | Investigate, frame, design, challenge, compare, explain, and recommend. |
| Process authority | External session driver | Open phases, authorize optional operations, grant context, bind declared specialists, enforce bounds, and stop or resume the session. |
| Evidence authority | Coordination runtime | Preserve provenance and revisions; validate visibility, contribution lineage, missing actors, dissent disclosure, aggregation, and bounds. |
| Decision authority | Person | Accept, reject, defer, combine, or require validation before choosing. |

Workers may recommend. The driver may authorize. The runtime may validate. Only
the person may decide.

An advisory recommendation must never be recorded as though it were the
person's decision. A driver interpretation of a person's input must never
replace the immutable source input from which that interpretation was derived.

Dispatch remains governed by the existing shared control plane. The portable
protocol may declare capability and minimum-tier requirements, but must not pin
a host-specific executor or model. The session request/policy layer binds each
actor's concrete `executor`, `tier`, and `persona`; dispatch derives the
provider/model through configured policy and RunResult records what ran.
```

### Full target shown text

```text
## 3. Authority Boundaries

| Authority | Owner | Responsibility |
|---|---|---|
| Advisory authority | Panel | Investigate, frame, design, challenge, compare, explain, and recommend. |
| Process authority | External session driver | Open phases, authorize optional operations, grant context, bind declared specialists, enforce bounds, and stop or resume the session. |
| Evidence authority | Coordination runtime | Preserve provenance and revisions; validate visibility, contribution lineage, missing actors, dissent disclosure, aggregation, and bounds. |
| Decision authority | Person | Accept, reject, defer, combine, or require validation before choosing. |

Workers may recommend. The driver may authorize. The runtime may validate. Only
the person may decide.

An advisory recommendation must never be recorded as though it were the
person's decision. A driver interpretation of a person's input must never
replace the immutable source input from which that interpretation was derived.

Dispatch remains governed by the existing shared control plane. The portable
protocol may declare capability and minimum-tier requirements, but must not pin
a host-specific executor or model. The session request/policy layer binds each
actor's concrete `executor`, `tier`, and `persona`; dispatch derives the
provider/model through configured policy and RunResult records what ran.
```

## claim_d0fa82be69edc646c7bff75213500202

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-15, lines 91–96.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-18.
Source digest: 5471a626168cbfcedaf40c0a6f7595d98e46f0590f0279ee8a16fba4c0776d18
Target digest: 5471a626168cbfcedaf40c0a6f7595d98e46f0590f0279ee8a16fba4c0776d18
Shown source SHA256: 5471a626168cbfcedaf40c0a6f7595d98e46f0590f0279ee8a16fba4c0776d18
Shown target SHA256: 5471a626168cbfcedaf40c0a6f7595d98e46f0590f0279ee8a16fba4c0776d18

### Proposed decision

```json
{
  "claimId": "claim_d0fa82be69edc646c7bff75213500202",
  "sourceUnitDigest": "5471a626168cbfcedaf40c0a6f7595d98e46f0590f0279ee8a16fba4c0776d18",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "5471a626168cbfcedaf40c0a6f7595d98e46f0590f0279ee8a16fba4c0776d18",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "3. Authority Boundaries"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-15 (lines 91–96) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-18 (lines 121–126); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Authority | Owner | Responsibility |
|---|---|---|
| Advisory authority | Panel | Investigate, frame, design, challenge, compare, explain, and recommend. |
| Process authority | External session driver | Open phases, authorize optional operations, grant context, bind declared specialists, enforce bounds, and stop or resume the session. |
| Evidence authority | Coordination runtime | Preserve provenance and revisions; validate visibility, contribution lineage, missing actors, dissent disclosure, aggregation, and bounds. |
| Decision authority | Person | Accept, reject, defer, combine, or require validation before choosing. |
```

### Full target shown text

```text
| Authority | Owner | Responsibility |
|---|---|---|
| Advisory authority | Panel | Investigate, frame, design, challenge, compare, explain, and recommend. |
| Process authority | External session driver | Open phases, authorize optional operations, grant context, bind declared specialists, enforce bounds, and stop or resume the session. |
| Evidence authority | Coordination runtime | Preserve provenance and revisions; validate visibility, contribution lineage, missing actors, dissent disclosure, aggregation, and bounds. |
| Decision authority | Person | Accept, reject, defer, combine, or require validation before choosing. |
```

## claim_8d3dca8c04d9a6c21f4705cbf8e90e4d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-16, lines 98–99.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-19.
Source digest: bc16799dc857e8fc0f32e31aef2d1a2e7fc89e67be7d0ea73428d157249e1321
Target digest: bc16799dc857e8fc0f32e31aef2d1a2e7fc89e67be7d0ea73428d157249e1321
Shown source SHA256: bc16799dc857e8fc0f32e31aef2d1a2e7fc89e67be7d0ea73428d157249e1321
Shown target SHA256: bc16799dc857e8fc0f32e31aef2d1a2e7fc89e67be7d0ea73428d157249e1321

### Proposed decision

```json
{
  "claimId": "claim_8d3dca8c04d9a6c21f4705cbf8e90e4d",
  "sourceUnitDigest": "bc16799dc857e8fc0f32e31aef2d1a2e7fc89e67be7d0ea73428d157249e1321",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "bc16799dc857e8fc0f32e31aef2d1a2e7fc89e67be7d0ea73428d157249e1321",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "3. Authority Boundaries"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-16 (lines 98–99) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-19 (lines 128–129); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Workers may recommend. The driver may authorize. The runtime may validate. Only
the person may decide.
```

### Full target shown text

```text
Workers may recommend. The driver may authorize. The runtime may validate. Only
the person may decide.
```

## claim_60162fd4870c15b49b0047546b39fe8e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-17, lines 101–103.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-20.
Source digest: d6036122df631d4a0e77b9b3cddcda2b33ac7a57ff1c03aae3301b0addfb6723
Target digest: d6036122df631d4a0e77b9b3cddcda2b33ac7a57ff1c03aae3301b0addfb6723
Shown source SHA256: d6036122df631d4a0e77b9b3cddcda2b33ac7a57ff1c03aae3301b0addfb6723
Shown target SHA256: d6036122df631d4a0e77b9b3cddcda2b33ac7a57ff1c03aae3301b0addfb6723

### Proposed decision

```json
{
  "claimId": "claim_60162fd4870c15b49b0047546b39fe8e",
  "sourceUnitDigest": "d6036122df631d4a0e77b9b3cddcda2b33ac7a57ff1c03aae3301b0addfb6723",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "d6036122df631d4a0e77b9b3cddcda2b33ac7a57ff1c03aae3301b0addfb6723",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "3. Authority Boundaries"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-17 (lines 101–103) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-20 (lines 131–133); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
An advisory recommendation must never be recorded as though it were the
person's decision. A driver interpretation of a person's input must never
replace the immutable source input from which that interpretation was derived.
```

### Full target shown text

```text
An advisory recommendation must never be recorded as though it were the
person's decision. A driver interpretation of a person's input must never
replace the immutable source input from which that interpretation was derived.
```

## claim_0f388ead930dddf3f5e580e084406d02

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-18, lines 105–109.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-21.
Source digest: 3f2988f7f370cdc276c7b15be3c9b5c45f2213b303e3118b197d5c314f965952
Target digest: 3f2988f7f370cdc276c7b15be3c9b5c45f2213b303e3118b197d5c314f965952
Shown source SHA256: 3f2988f7f370cdc276c7b15be3c9b5c45f2213b303e3118b197d5c314f965952
Shown target SHA256: 3f2988f7f370cdc276c7b15be3c9b5c45f2213b303e3118b197d5c314f965952

### Proposed decision

```json
{
  "claimId": "claim_0f388ead930dddf3f5e580e084406d02",
  "sourceUnitDigest": "3f2988f7f370cdc276c7b15be3c9b5c45f2213b303e3118b197d5c314f965952",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "3f2988f7f370cdc276c7b15be3c9b5c45f2213b303e3118b197d5c314f965952",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "3. Authority Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-18 (lines 105–109) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-21 (lines 135–139); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Dispatch remains governed by the existing shared control plane. The portable
protocol may declare capability and minimum-tier requirements, but must not pin
a host-specific executor or model. The session request/policy layer binds each
actor's concrete `executor`, `tier`, and `persona`; dispatch derives the
provider/model through configured policy and RunResult records what ran.
```

### Full target shown text

```text
Dispatch remains governed by the existing shared control plane. The portable
protocol may declare capability and minimum-tier requirements, but must not pin
a host-specific executor or model. The session request/policy layer binds each
actor's concrete `executor`, `tier`, and `persona`; dispatch derives the
provider/model through configured policy and RunResult records what ran.
```

## claim_4aa4cbbbe02fa587944a9b8349b5053e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#4-design-principles, lines 111–111.
Target: docs/platform/proposals/architecture-advisory-panel.md#4-design-principles.
Source digest: 713483a2bdd60672a452748bf49630c0066d0504e5dc69f64aa3d3f364439454
Target digest: 713483a2bdd60672a452748bf49630c0066d0504e5dc69f64aa3d3f364439454
Shown source SHA256: b4222a70e5c7d84d4b335c33d9f568ee2d9327b5650999fcb54464dc673d193d
Shown target SHA256: b4222a70e5c7d84d4b335c33d9f568ee2d9327b5650999fcb54464dc673d193d

### Proposed decision

```json
{
  "claimId": "claim_4aa4cbbbe02fa587944a9b8349b5053e",
  "sourceUnitDigest": "713483a2bdd60672a452748bf49630c0066d0504e5dc69f64aa3d3f364439454",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "4-design-principles",
  "targetUnitDigest": "713483a2bdd60672a452748bf49630c0066d0504e5dc69f64aa3d3f364439454",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#4-design-principles (lines 111–111) is carried at docs/platform/proposals/architecture-advisory-panel.md#4-design-principles (lines 141–141); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 4. Design Principles

1. **Understand before advising.** The panel builds and tests a working
   understanding before generating architecture candidates.
2. **Investigate before asking.** A short input is not automatically unclear.
   The panel reads available code, specifications, decisions, operational
   evidence, and other permitted sources first.
3. **Ask only across a real human boundary.** A question is justified only when
   its answer can materially change the recommendation, the panel cannot resolve
   it through investigation or a bounded specialist, and it concerns a
   preference, authority, or reality held only by the person.
4. **Advise rather than defer preference back to the person.** When presenting
   choices, the panel names its recommendation and rationale instead of hiding
   behind "it depends."
5. **Preserve disagreement.** Synthesis may disposition a dissent but may not
   erase or silently absorb it.
6. **Separate problem framing from solution generation.** Divergent frames are
   resolved before candidate architectures are compared.
7. **Keep evidence append-only.** New context creates new revisions and
   explicit supersession; prior proposals, objections, verdicts, and decisions
   remain reconstructable.
8. **Reopen selectively.** Dialogue invalidates only the earliest affected
   phase and its downstream artifacts.
9. **Stay bounded.** More rounds are not a substitute for missing evidence, a
   product decision, a specialist, or a prototype.
10. **Dispatch real independent actors.** Role separation means separate
    Assignments/Runs with per-actor executor/tier/persona selection, derived
    provider/model, and recorded provenance, never persona simulation inside
    one model response.
```

### Full target shown text

```text
## 4. Design Principles

1. **Understand before advising.** The panel builds and tests a working
   understanding before generating architecture candidates.
2. **Investigate before asking.** A short input is not automatically unclear.
   The panel reads available code, specifications, decisions, operational
   evidence, and other permitted sources first.
3. **Ask only across a real human boundary.** A question is justified only when
   its answer can materially change the recommendation, the panel cannot resolve
   it through investigation or a bounded specialist, and it concerns a
   preference, authority, or reality held only by the person.
4. **Advise rather than defer preference back to the person.** When presenting
   choices, the panel names its recommendation and rationale instead of hiding
   behind "it depends."
5. **Preserve disagreement.** Synthesis may disposition a dissent but may not
   erase or silently absorb it.
6. **Separate problem framing from solution generation.** Divergent frames are
   resolved before candidate architectures are compared.
7. **Keep evidence append-only.** New context creates new revisions and
   explicit supersession; prior proposals, objections, verdicts, and decisions
   remain reconstructable.
8. **Reopen selectively.** Dialogue invalidates only the earliest affected
   phase and its downstream artifacts.
9. **Stay bounded.** More rounds are not a substitute for missing evidence, a
   product decision, a specialist, or a prototype.
10. **Dispatch real independent actors.** Role separation means separate
    Assignments/Runs with per-actor executor/tier/persona selection, derived
    provider/model, and recorded provenance, never persona simulation inside
    one model response.
```

## claim_9ba7b330180ecb908df1583bb2c237b2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-19, lines 113–139.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-22.
Source digest: 556d27e9676998b1aa695f97fa3502d2a3b85d13e4e0bfdda2dd749cb11fe969
Target digest: 556d27e9676998b1aa695f97fa3502d2a3b85d13e4e0bfdda2dd749cb11fe969
Shown source SHA256: 556d27e9676998b1aa695f97fa3502d2a3b85d13e4e0bfdda2dd749cb11fe969
Shown target SHA256: 556d27e9676998b1aa695f97fa3502d2a3b85d13e4e0bfdda2dd749cb11fe969

### Proposed decision

```json
{
  "claimId": "claim_9ba7b330180ecb908df1583bb2c237b2",
  "sourceUnitDigest": "556d27e9676998b1aa695f97fa3502d2a3b85d13e4e0bfdda2dd749cb11fe969",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "556d27e9676998b1aa695f97fa3502d2a3b85d13e4e0bfdda2dd749cb11fe969",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "4. Design Principles"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-19 (lines 113–139) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-22 (lines 143–169); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. **Understand before advising.** The panel builds and tests a working
   understanding before generating architecture candidates.
2. **Investigate before asking.** A short input is not automatically unclear.
   The panel reads available code, specifications, decisions, operational
   evidence, and other permitted sources first.
3. **Ask only across a real human boundary.** A question is justified only when
   its answer can materially change the recommendation, the panel cannot resolve
   it through investigation or a bounded specialist, and it concerns a
   preference, authority, or reality held only by the person.
4. **Advise rather than defer preference back to the person.** When presenting
   choices, the panel names its recommendation and rationale instead of hiding
   behind "it depends."
5. **Preserve disagreement.** Synthesis may disposition a dissent but may not
   erase or silently absorb it.
6. **Separate problem framing from solution generation.** Divergent frames are
   resolved before candidate architectures are compared.
7. **Keep evidence append-only.** New context creates new revisions and
   explicit supersession; prior proposals, objections, verdicts, and decisions
   remain reconstructable.
8. **Reopen selectively.** Dialogue invalidates only the earliest affected
   phase and its downstream artifacts.
9. **Stay bounded.** More rounds are not a substitute for missing evidence, a
   product decision, a specialist, or a prototype.
10. **Dispatch real independent actors.** Role separation means separate
    Assignments/Runs with per-actor executor/tier/persona selection, derived
    provider/model, and recorded provenance, never persona simulation inside
    one model response.
```

### Full target shown text

```text
1. **Understand before advising.** The panel builds and tests a working
   understanding before generating architecture candidates.
2. **Investigate before asking.** A short input is not automatically unclear.
   The panel reads available code, specifications, decisions, operational
   evidence, and other permitted sources first.
3. **Ask only across a real human boundary.** A question is justified only when
   its answer can materially change the recommendation, the panel cannot resolve
   it through investigation or a bounded specialist, and it concerns a
   preference, authority, or reality held only by the person.
4. **Advise rather than defer preference back to the person.** When presenting
   choices, the panel names its recommendation and rationale instead of hiding
   behind "it depends."
5. **Preserve disagreement.** Synthesis may disposition a dissent but may not
   erase or silently absorb it.
6. **Separate problem framing from solution generation.** Divergent frames are
   resolved before candidate architectures are compared.
7. **Keep evidence append-only.** New context creates new revisions and
   explicit supersession; prior proposals, objections, verdicts, and decisions
   remain reconstructable.
8. **Reopen selectively.** Dialogue invalidates only the earliest affected
   phase and its downstream artifacts.
9. **Stay bounded.** More rounds are not a substitute for missing evidence, a
   product decision, a specialist, or a prototype.
10. **Dispatch real independent actors.** Role separation means separate
    Assignments/Runs with per-actor executor/tier/persona selection, derived
    provider/model, and recorded provenance, never persona simulation inside
    one model response.
```

## claim_cad39da7d57b536a75e3b1acef2354cf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#5-nine-logical-phases, lines 141–141.
Target: docs/platform/proposals/architecture-advisory-panel.md#5-nine-logical-phases.
Source digest: 471979ebb9af3dbabd2aef9cc7303c7f9dbc45a69c62d299be9b4c424c5b4271
Target digest: 471979ebb9af3dbabd2aef9cc7303c7f9dbc45a69c62d299be9b4c424c5b4271
Shown source SHA256: bdff4102459d871cae479f7fe87011896d1621898d689c7887a8f80c1c0d6df2
Shown target SHA256: bdff4102459d871cae479f7fe87011896d1621898d689c7887a8f80c1c0d6df2

### Proposed decision

```json
{
  "claimId": "claim_cad39da7d57b536a75e3b1acef2354cf",
  "sourceUnitDigest": "471979ebb9af3dbabd2aef9cc7303c7f9dbc45a69c62d299be9b4c424c5b4271",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "5-nine-logical-phases",
  "targetUnitDigest": "471979ebb9af3dbabd2aef9cc7303c7f9dbc45a69c62d299be9b4c424c5b4271",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#5-nine-logical-phases (lines 141–141) is carried at docs/platform/proposals/architecture-advisory-panel.md#5-nine-logical-phases (lines 171–171); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 5. Nine Logical Phases

The panel has nine logical phases. A phase describes a cognitive responsibility;
it is not necessarily one runtime dispatch round.
```

### Full target shown text

```text
## 5. Nine Logical Phases

The panel has nine logical phases. A phase describes a cognitive responsibility;
it is not necessarily one runtime dispatch round.
```

## claim_8e18d190884666e53329a3cd1ef0b95b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-20, lines 143–144.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-23.
Source digest: aa907a93d1a02a41c86df0b58365214141b8216475c1e5f4cc836d9b3cb99afc
Target digest: aa907a93d1a02a41c86df0b58365214141b8216475c1e5f4cc836d9b3cb99afc
Shown source SHA256: aa907a93d1a02a41c86df0b58365214141b8216475c1e5f4cc836d9b3cb99afc
Shown target SHA256: aa907a93d1a02a41c86df0b58365214141b8216475c1e5f4cc836d9b3cb99afc

### Proposed decision

```json
{
  "claimId": "claim_8e18d190884666e53329a3cd1ef0b95b",
  "sourceUnitDigest": "aa907a93d1a02a41c86df0b58365214141b8216475c1e5f4cc836d9b3cb99afc",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "aa907a93d1a02a41c86df0b58365214141b8216475c1e5f4cc836d9b3cb99afc",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-20 (lines 143–144) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-23 (lines 173–174); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The panel has nine logical phases. A phase describes a cognitive responsibility;
it is not necessarily one runtime dispatch round.
```

### Full target shown text

```text
The panel has nine logical phases. A phase describes a cognitive responsibility;
it is not necessarily one runtime dispatch round.
```

## claim_3947ace59a40d893907a28c0f61f99fe

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#the-panels-soul-is-primary, lines 146–146.
Target: docs/platform/proposals/architecture-advisory-panel.md#the-panels-soul-is-primary.
Source digest: 328ac7d989ba9f5d3632cc3f15dbf1345dfccaf806b716226cf0db91cb41e7bf
Target digest: 328ac7d989ba9f5d3632cc3f15dbf1345dfccaf806b716226cf0db91cb41e7bf
Shown source SHA256: c198454de857e0ca4506ae8372e613330f9555bd84838b6acec7f19d1297aeb5
Shown target SHA256: c198454de857e0ca4506ae8372e613330f9555bd84838b6acec7f19d1297aeb5

### Proposed decision

```json
{
  "claimId": "claim_3947ace59a40d893907a28c0f61f99fe",
  "sourceUnitDigest": "328ac7d989ba9f5d3632cc3f15dbf1345dfccaf806b716226cf0db91cb41e7bf",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "the-panels-soul-is-primary",
  "targetUnitDigest": "328ac7d989ba9f5d3632cc3f15dbf1345dfccaf806b716226cf0db91cb41e7bf",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#the-panels-soul-is-primary (lines 146–146) is carried at docs/platform/proposals/architecture-advisory-panel.md#the-panels-soul-is-primary (lines 176–176); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### The panel's soul is primary

The nine phases are not valuable because a graph can name them. They are useful
only when the agents inside them exhibit the right judgment. The production
skill and role prose must therefore carry a coherent advisory doctrine:

- enter as a thoughtful consulting group, not as a form that extracts
  requirements from the person;
- form a provisional understanding quickly, then actively try to disprove it;
- read the person's altitude, vocabulary, risk appetite, and real decision
  burden without pretending to know private intent;
- investigate what the system can discover instead of asking the person to
  restate repository or domain facts;
- notice when the requested feature is a symptom, but explain the reframe
  respectfully and preserve the person's original concern;
- generate alternatives that are genuinely worth choosing, including a
  smaller intervention or no new component, rather than ceremonial options;
- argue against claims and assumptions, not against another actor's identity;
- change position when evidence changes and say plainly what caused the change;
- give a recommendation with conviction proportional to evidence, including a
  minority view when it remains credible;
- explain architecture in the person's language and at the depth needed for
  them to own the decision;
- treat questions as expensive boundary crossings: scout first, consolidate
  what remains, show why it matters, and provide the panel's current default;
- stay present after recommending: clarify, defend, revise, compose, or admit
  uncertainty without taking decision authority.

Role prose must include positive judgment heuristics, failure postures, and
examples of good advisory behavior. A role name plus an output schema is not a
soul. FlowDefinition may bound visibility and authority, but it must not become
the source of consulting intelligence.

Before mechanization, this doctrine must operate successfully as one manual
playbook prompt on a real architecture question. The proof should show not only
that artifacts were produced, but that the panel understood better than the
initial wording, asked fewer and better questions, surfaced a non-obvious
alternative, explained dissent, and helped a person make or defer a decision.
Only behavior that the manual proof demonstrates should be hardened into the
protocol and runtime.
```

### Full target shown text

```text
### The panel's soul is primary

The nine phases are not valuable because a graph can name them. They are useful
only when the agents inside them exhibit the right judgment. The production
skill and role prose must therefore carry a coherent advisory doctrine:

- enter as a thoughtful consulting group, not as a form that extracts
  requirements from the person;
- form a provisional understanding quickly, then actively try to disprove it;
- read the person's altitude, vocabulary, risk appetite, and real decision
  burden without pretending to know private intent;
- investigate what the system can discover instead of asking the person to
  restate repository or domain facts;
- notice when the requested feature is a symptom, but explain the reframe
  respectfully and preserve the person's original concern;
- generate alternatives that are genuinely worth choosing, including a
  smaller intervention or no new component, rather than ceremonial options;
- argue against claims and assumptions, not against another actor's identity;
- change position when evidence changes and say plainly what caused the change;
- give a recommendation with conviction proportional to evidence, including a
  minority view when it remains credible;
- explain architecture in the person's language and at the depth needed for
  them to own the decision;
- treat questions as expensive boundary crossings: scout first, consolidate
  what remains, show why it matters, and provide the panel's current default;
- stay present after recommending: clarify, defend, revise, compose, or admit
  uncertainty without taking decision authority.

Role prose must include positive judgment heuristics, failure postures, and
examples of good advisory behavior. A role name plus an output schema is not a
soul. FlowDefinition may bound visibility and authority, but it must not become
the source of consulting intelligence.

Before mechanization, this doctrine must operate successfully as one manual
playbook prompt on a real architecture question. The proof should show not only
that artifacts were produced, but that the panel understood better than the
initial wording, asked fewer and better questions, surfaced a non-obvious
alternative, explained dissent, and helped a person make or defer a decision.
Only behavior that the manual proof demonstrates should be hardened into the
protocol and runtime.
```

## claim_e05607518de2409a96ecd6fab3060fcf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-21, lines 148–150.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-24.
Source digest: b285dabc7dc3f99fe6c08e13a46b44927b836c700ecab3e9fb33a00fefcd670c
Target digest: b285dabc7dc3f99fe6c08e13a46b44927b836c700ecab3e9fb33a00fefcd670c
Shown source SHA256: b285dabc7dc3f99fe6c08e13a46b44927b836c700ecab3e9fb33a00fefcd670c
Shown target SHA256: b285dabc7dc3f99fe6c08e13a46b44927b836c700ecab3e9fb33a00fefcd670c

### Proposed decision

```json
{
  "claimId": "claim_e05607518de2409a96ecd6fab3060fcf",
  "sourceUnitDigest": "b285dabc7dc3f99fe6c08e13a46b44927b836c700ecab3e9fb33a00fefcd670c",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "b285dabc7dc3f99fe6c08e13a46b44927b836c700ecab3e9fb33a00fefcd670c",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "The panel's soul is primary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-21 (lines 148–150) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-24 (lines 178–180); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The nine phases are not valuable because a graph can name them. They are useful
only when the agents inside them exhibit the right judgment. The production
skill and role prose must therefore carry a coherent advisory doctrine:
```

### Full target shown text

```text
The nine phases are not valuable because a graph can name them. They are useful
only when the agents inside them exhibit the right judgment. The production
skill and role prose must therefore carry a coherent advisory doctrine:
```

## claim_54e955a2a3adaa362ceb6295045401e8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-22, lines 152–172.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-25.
Source digest: 4c8841a79ee7208d0f378173a3f1fe01582c55be5aa7c48cf956d6fd344b4908
Target digest: 4c8841a79ee7208d0f378173a3f1fe01582c55be5aa7c48cf956d6fd344b4908
Shown source SHA256: 4c8841a79ee7208d0f378173a3f1fe01582c55be5aa7c48cf956d6fd344b4908
Shown target SHA256: 4c8841a79ee7208d0f378173a3f1fe01582c55be5aa7c48cf956d6fd344b4908

### Proposed decision

```json
{
  "claimId": "claim_54e955a2a3adaa362ceb6295045401e8",
  "sourceUnitDigest": "4c8841a79ee7208d0f378173a3f1fe01582c55be5aa7c48cf956d6fd344b4908",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "4c8841a79ee7208d0f378173a3f1fe01582c55be5aa7c48cf956d6fd344b4908",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "The panel's soul is primary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-22 (lines 152–172) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-25 (lines 182–202); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- enter as a thoughtful consulting group, not as a form that extracts
  requirements from the person;
- form a provisional understanding quickly, then actively try to disprove it;
- read the person's altitude, vocabulary, risk appetite, and real decision
  burden without pretending to know private intent;
- investigate what the system can discover instead of asking the person to
  restate repository or domain facts;
- notice when the requested feature is a symptom, but explain the reframe
  respectfully and preserve the person's original concern;
- generate alternatives that are genuinely worth choosing, including a
  smaller intervention or no new component, rather than ceremonial options;
- argue against claims and assumptions, not against another actor's identity;
- change position when evidence changes and say plainly what caused the change;
- give a recommendation with conviction proportional to evidence, including a
  minority view when it remains credible;
- explain architecture in the person's language and at the depth needed for
  them to own the decision;
- treat questions as expensive boundary crossings: scout first, consolidate
  what remains, show why it matters, and provide the panel's current default;
- stay present after recommending: clarify, defend, revise, compose, or admit
  uncertainty without taking decision authority.
```

### Full target shown text

```text
- enter as a thoughtful consulting group, not as a form that extracts
  requirements from the person;
- form a provisional understanding quickly, then actively try to disprove it;
- read the person's altitude, vocabulary, risk appetite, and real decision
  burden without pretending to know private intent;
- investigate what the system can discover instead of asking the person to
  restate repository or domain facts;
- notice when the requested feature is a symptom, but explain the reframe
  respectfully and preserve the person's original concern;
- generate alternatives that are genuinely worth choosing, including a
  smaller intervention or no new component, rather than ceremonial options;
- argue against claims and assumptions, not against another actor's identity;
- change position when evidence changes and say plainly what caused the change;
- give a recommendation with conviction proportional to evidence, including a
  minority view when it remains credible;
- explain architecture in the person's language and at the depth needed for
  them to own the decision;
- treat questions as expensive boundary crossings: scout first, consolidate
  what remains, show why it matters, and provide the panel's current default;
- stay present after recommending: clarify, defend, revise, compose, or admit
  uncertainty without taking decision authority.
```

## claim_2b9c0e553f72ddd2b371a411a5f7850d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-23, lines 174–177.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-26.
Source digest: 804f16757edef43363621ac646cd6ce0f83e2d7e5968e1991b32a0f07479c582
Target digest: 804f16757edef43363621ac646cd6ce0f83e2d7e5968e1991b32a0f07479c582
Shown source SHA256: 804f16757edef43363621ac646cd6ce0f83e2d7e5968e1991b32a0f07479c582
Shown target SHA256: 804f16757edef43363621ac646cd6ce0f83e2d7e5968e1991b32a0f07479c582

### Proposed decision

```json
{
  "claimId": "claim_2b9c0e553f72ddd2b371a411a5f7850d",
  "sourceUnitDigest": "804f16757edef43363621ac646cd6ce0f83e2d7e5968e1991b32a0f07479c582",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "804f16757edef43363621ac646cd6ce0f83e2d7e5968e1991b32a0f07479c582",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "The panel's soul is primary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-23 (lines 174–177) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-26 (lines 204–207); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Role prose must include positive judgment heuristics, failure postures, and
examples of good advisory behavior. A role name plus an output schema is not a
soul. FlowDefinition may bound visibility and authority, but it must not become
the source of consulting intelligence.
```

### Full target shown text

```text
Role prose must include positive judgment heuristics, failure postures, and
examples of good advisory behavior. A role name plus an output schema is not a
soul. FlowDefinition may bound visibility and authority, but it must not become
the source of consulting intelligence.
```

## claim_05ac49c38bd2988ad3f11c7f1fe6e587

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-24, lines 179–185.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-27.
Source digest: 6d12cc94f3e78fecb109a9931f65b05a8e1868cddc8f7808addb66bb48cfd163
Target digest: 6d12cc94f3e78fecb109a9931f65b05a8e1868cddc8f7808addb66bb48cfd163
Shown source SHA256: 6d12cc94f3e78fecb109a9931f65b05a8e1868cddc8f7808addb66bb48cfd163
Shown target SHA256: 6d12cc94f3e78fecb109a9931f65b05a8e1868cddc8f7808addb66bb48cfd163

### Proposed decision

```json
{
  "claimId": "claim_05ac49c38bd2988ad3f11c7f1fe6e587",
  "sourceUnitDigest": "6d12cc94f3e78fecb109a9931f65b05a8e1868cddc8f7808addb66bb48cfd163",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "6d12cc94f3e78fecb109a9931f65b05a8e1868cddc8f7808addb66bb48cfd163",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "The panel's soul is primary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-24 (lines 179–185) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-27 (lines 209–215); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Before mechanization, this doctrine must operate successfully as one manual
playbook prompt on a real architecture question. The proof should show not only
that artifacts were produced, but that the panel understood better than the
initial wording, asked fewer and better questions, surfaced a non-obvious
alternative, explained dissent, and helped a person make or defer a decision.
Only behavior that the manual proof demonstrates should be hardened into the
protocol and runtime.
```

### Full target shown text

```text
Before mechanization, this doctrine must operate successfully as one manual
playbook prompt on a real architecture question. The proof should show not only
that artifacts were produced, but that the panel understood better than the
initial wording, asked fewer and better questions, surfaced a non-obvious
alternative, explained dissent, and helped a person make or defer a decision.
Only behavior that the manual proof demonstrates should be hardened into the
protocol and runtime.
```

## claim_4a497ca3b7537b7a073a7b84791f5fb6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#phase-1---interpret-intent, lines 187–187.
Target: docs/platform/proposals/architecture-advisory-panel.md#phase-1---interpret-intent.
Source digest: a353f7ace85eed74c21b1fe69a954c9dad57458cc5c4d93dd76601f69f9b3d13
Target digest: a353f7ace85eed74c21b1fe69a954c9dad57458cc5c4d93dd76601f69f9b3d13
Shown source SHA256: 61c1f25dc502c7dd86313d10e3d8fecb286c50df514f08eaf13939ce4b5fb0f6
Shown target SHA256: 61c1f25dc502c7dd86313d10e3d8fecb286c50df514f08eaf13939ce4b5fb0f6

### Proposed decision

```json
{
  "claimId": "claim_4a497ca3b7537b7a073a7b84791f5fb6",
  "sourceUnitDigest": "a353f7ace85eed74c21b1fe69a954c9dad57458cc5c4d93dd76601f69f9b3d13",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "phase-1---interpret-intent",
  "targetUnitDigest": "a353f7ace85eed74c21b1fe69a954c9dad57458cc5c4d93dd76601f69f9b3d13",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#phase-1---interpret-intent (lines 187–187) is carried at docs/platform/proposals/architecture-advisory-panel.md#phase-1---interpret-intent (lines 217–217); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Phase 1 - Interpret Intent

The `lead-advisor` derives `WorkingUnderstanding` revision 1 from the person's
input. It identifies the apparent desired outcome, stakeholders, decision,
known constraints, assumptions, unknowns, and its confidence. Inferences stay
explicit; they are not promoted to facts because they sound plausible.
```

### Full target shown text

```text
### Phase 1 - Interpret Intent

The `lead-advisor` derives `WorkingUnderstanding` revision 1 from the person's
input. It identifies the apparent desired outcome, stakeholders, decision,
known constraints, assumptions, unknowns, and its confidence. Inferences stay
explicit; they are not promoted to facts because they sound plausible.
```

## claim_5857af8a02fa5f836a3c4e8cf533c655

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-25, lines 189–192.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-28.
Source digest: 8f563851b33cd4216dc494f2f174984a3803c5b19c99e315b10f66e6d084abb8
Target digest: 8f563851b33cd4216dc494f2f174984a3803c5b19c99e315b10f66e6d084abb8
Shown source SHA256: 8f563851b33cd4216dc494f2f174984a3803c5b19c99e315b10f66e6d084abb8
Shown target SHA256: 8f563851b33cd4216dc494f2f174984a3803c5b19c99e315b10f66e6d084abb8

### Proposed decision

```json
{
  "claimId": "claim_5857af8a02fa5f836a3c4e8cf533c655",
  "sourceUnitDigest": "8f563851b33cd4216dc494f2f174984a3803c5b19c99e315b10f66e6d084abb8",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "8f563851b33cd4216dc494f2f174984a3803c5b19c99e315b10f66e6d084abb8",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 1 - Interpret Intent"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-25 (lines 189–192) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-28 (lines 219–222); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The `lead-advisor` derives `WorkingUnderstanding` revision 1 from the person's
input. It identifies the apparent desired outcome, stakeholders, decision,
known constraints, assumptions, unknowns, and its confidence. Inferences stay
explicit; they are not promoted to facts because they sound plausible.
```

### Full target shown text

```text
The `lead-advisor` derives `WorkingUnderstanding` revision 1 from the person's
input. It identifies the apparent desired outcome, stakeholders, decision,
known constraints, assumptions, unknowns, and its confidence. Inferences stay
explicit; they are not promoted to facts because they sound plausible.
```

## claim_b74844e1e277ebffcb8f2c94305bb172

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#phase-2---autonomous-discovery, lines 194–194.
Target: docs/platform/proposals/architecture-advisory-panel.md#phase-2---autonomous-discovery.
Source digest: a77c1a041afb8eaef3a79bc5df4ea2fc06b6c384416f6cf2be701bff313c24cc
Target digest: a77c1a041afb8eaef3a79bc5df4ea2fc06b6c384416f6cf2be701bff313c24cc
Shown source SHA256: 2ccd0fb4ca09568efd4e727e02db99c9e3e21df8f4db15b373093cc20bee845a
Shown target SHA256: 2ccd0fb4ca09568efd4e727e02db99c9e3e21df8f4db15b373093cc20bee845a

### Proposed decision

```json
{
  "claimId": "claim_b74844e1e277ebffcb8f2c94305bb172",
  "sourceUnitDigest": "a77c1a041afb8eaef3a79bc5df4ea2fc06b6c384416f6cf2be701bff313c24cc",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "phase-2---autonomous-discovery",
  "targetUnitDigest": "a77c1a041afb8eaef3a79bc5df4ea2fc06b6c384416f6cf2be701bff313c24cc",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#phase-2---autonomous-discovery (lines 194–194) is carried at docs/platform/proposals/architecture-advisory-panel.md#phase-2---autonomous-discovery (lines 224–224); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Phase 2 - Autonomous Discovery

The `context-investigator` reads available sources and produces an
`EvidenceMap`. It separates facts, authoritative constraints, inferences, and
unknowns, and classifies each unknown as resolvable by further investigation,
a declared specialist, or only the person. It does not generate solution
proposals during this phase.
```

### Full target shown text

```text
### Phase 2 - Autonomous Discovery

The `context-investigator` reads available sources and produces an
`EvidenceMap`. It separates facts, authoritative constraints, inferences, and
unknowns, and classifies each unknown as resolvable by further investigation,
a declared specialist, or only the person. It does not generate solution
proposals during this phase.
```

## claim_32eacf0e73a96f0f9e6830a675e79741

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-26, lines 196–200.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-29.
Source digest: dbdb9c364f9cae26149c37461ce0ba8f3d0f844f8d7ae2991d70a55005c03a7b
Target digest: dbdb9c364f9cae26149c37461ce0ba8f3d0f844f8d7ae2991d70a55005c03a7b
Shown source SHA256: dbdb9c364f9cae26149c37461ce0ba8f3d0f844f8d7ae2991d70a55005c03a7b
Shown target SHA256: dbdb9c364f9cae26149c37461ce0ba8f3d0f844f8d7ae2991d70a55005c03a7b

### Proposed decision

```json
{
  "claimId": "claim_32eacf0e73a96f0f9e6830a675e79741",
  "sourceUnitDigest": "dbdb9c364f9cae26149c37461ce0ba8f3d0f844f8d7ae2991d70a55005c03a7b",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "dbdb9c364f9cae26149c37461ce0ba8f3d0f844f8d7ae2991d70a55005c03a7b",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 2 - Autonomous Discovery"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-26 (lines 196–200) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-29 (lines 226–230); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The `context-investigator` reads available sources and produces an
`EvidenceMap`. It separates facts, authoritative constraints, inferences, and
unknowns, and classifies each unknown as resolvable by further investigation,
a declared specialist, or only the person. It does not generate solution
proposals during this phase.
```

### Full target shown text

```text
The `context-investigator` reads available sources and produces an
`EvidenceMap`. It separates facts, authoritative constraints, inferences, and
unknowns, and classifies each unknown as resolvable by further investigation,
a declared specialist, or only the person. It does not generate solution
proposals during this phase.
```

## claim_fc71b9d8f1ac1eb4a6b8041f6f745547

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#phase-3---problem-framing-divergence, lines 202–202.
Target: docs/platform/proposals/architecture-advisory-panel.md#phase-3---problem-framing-divergence.
Source digest: d7a73a65dbe5aa209bff31cf13f7cb569ca968c25bcc902a062c3035f7d81187
Target digest: d7a73a65dbe5aa209bff31cf13f7cb569ca968c25bcc902a062c3035f7d81187
Shown source SHA256: 427acce7a37afd1fadc59905f35c71e8fffd1ce2b37166ff680b5ee60877540e
Shown target SHA256: 427acce7a37afd1fadc59905f35c71e8fffd1ce2b37166ff680b5ee60877540e

### Proposed decision

```json
{
  "claimId": "claim_fc71b9d8f1ac1eb4a6b8041f6f745547",
  "sourceUnitDigest": "d7a73a65dbe5aa209bff31cf13f7cb569ca968c25bcc902a062c3035f7d81187",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "phase-3---problem-framing-divergence",
  "targetUnitDigest": "d7a73a65dbe5aa209bff31cf13f7cb569ca968c25bcc902a062c3035f7d81187",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#phase-3---problem-framing-divergence (lines 202–202) is carried at docs/platform/proposals/architecture-advisory-panel.md#phase-3---problem-framing-divergence (lines 232–232); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Phase 3 - Problem-Framing Divergence

This phase runs only when the problem is not yet sufficiently understood.
Independent advisors test alternative explanations: architecture problem,
workflow or product problem, organizational or operational constraint, local
symptom of a boundary defect, or a case where no new system should be built.
The result is a `FramingAssessment` with a primary frame, credible alternatives,
supporting and contradicting evidence, and remaining material unknowns.
```

### Full target shown text

```text
### Phase 3 - Problem-Framing Divergence

This phase runs only when the problem is not yet sufficiently understood.
Independent advisors test alternative explanations: architecture problem,
workflow or product problem, organizational or operational constraint, local
symptom of a boundary defect, or a case where no new system should be built.
The result is a `FramingAssessment` with a primary frame, credible alternatives,
supporting and contradicting evidence, and remaining material unknowns.
```

## claim_599fecbe319398b91122836be4394722

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-27, lines 204–209.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-30.
Source digest: d4e7793cefde06fb0a676ab86970434dd3cd87085df407bcce60d991ea29cdad
Target digest: d4e7793cefde06fb0a676ab86970434dd3cd87085df407bcce60d991ea29cdad
Shown source SHA256: d4e7793cefde06fb0a676ab86970434dd3cd87085df407bcce60d991ea29cdad
Shown target SHA256: d4e7793cefde06fb0a676ab86970434dd3cd87085df407bcce60d991ea29cdad

### Proposed decision

```json
{
  "claimId": "claim_599fecbe319398b91122836be4394722",
  "sourceUnitDigest": "d4e7793cefde06fb0a676ab86970434dd3cd87085df407bcce60d991ea29cdad",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "d4e7793cefde06fb0a676ab86970434dd3cd87085df407bcce60d991ea29cdad",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 3 - Problem-Framing Divergence"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-27 (lines 204–209) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-30 (lines 234–239); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This phase runs only when the problem is not yet sufficiently understood.
Independent advisors test alternative explanations: architecture problem,
workflow or product problem, organizational or operational constraint, local
symptom of a boundary defect, or a case where no new system should be built.
The result is a `FramingAssessment` with a primary frame, credible alternatives,
supporting and contradicting evidence, and remaining material unknowns.
```

### Full target shown text

```text
This phase runs only when the problem is not yet sufficiently understood.
Independent advisors test alternative explanations: architecture problem,
workflow or product problem, organizational or operational constraint, local
symptom of a boundary defect, or a case where no new system should be built.
The result is a `FramingAssessment` with a primary frame, credible alternatives,
supporting and contradicting evidence, and remaining material unknowns.
```

## claim_ba442edb5fdb9560ce9fa83310695486

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#phase-4---clarification-with-the-person, lines 211–211.
Target: docs/platform/proposals/architecture-advisory-panel.md#phase-4---clarification-with-the-person.
Source digest: 8c4fb567b88a4c4e288fb6e95bb13462a43367db5d6201a9bdcdd0d8b1924299
Target digest: 8c4fb567b88a4c4e288fb6e95bb13462a43367db5d6201a9bdcdd0d8b1924299
Shown source SHA256: abe8893ae5b57ac0d32ed3bf0e87c74c5300e230b88fb5c57693b3f984aa1d28
Shown target SHA256: abe8893ae5b57ac0d32ed3bf0e87c74c5300e230b88fb5c57693b3f984aa1d28

### Proposed decision

```json
{
  "claimId": "claim_ba442edb5fdb9560ce9fa83310695486",
  "sourceUnitDigest": "8c4fb567b88a4c4e288fb6e95bb13462a43367db5d6201a9bdcdd0d8b1924299",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "phase-4---clarification-with-the-person",
  "targetUnitDigest": "8c4fb567b88a4c4e288fb6e95bb13462a43367db5d6201a9bdcdd0d8b1924299",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#phase-4---clarification-with-the-person (lines 211–211) is carried at docs/platform/proposals/architecture-advisory-panel.md#phase-4---clarification-with-the-person (lines 241–241); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Phase 4 - Clarification With The Person

This phase runs only after investigation and framing still leave a material
user-only gap. The panel sends one consolidated `DecisionRequest` explaining
its current understanding, work already performed, why each gap cannot be
resolved elsewhere, its effect on the recommendation, and the panel's default
assumption if unanswered. The session parks without blocking unrelated work.

When the person responds, the response becomes a new immutable input and the
panel returns to Phase 1 with an explicit revision rather than splicing the
answer silently into old artifacts.
```

### Full target shown text

```text
### Phase 4 - Clarification With The Person

This phase runs only after investigation and framing still leave a material
user-only gap. The panel sends one consolidated `DecisionRequest` explaining
its current understanding, work already performed, why each gap cannot be
resolved elsewhere, its effect on the recommendation, and the panel's default
assumption if unanswered. The session parks without blocking unrelated work.

When the person responds, the response becomes a new immutable input and the
panel returns to Phase 1 with an explicit revision rather than splicing the
answer silently into old artifacts.
```

## claim_b3bfb284463d7455bda2d9fa2d7e2441

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-28, lines 213–217.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-31.
Source digest: 3f39dc8454e12c9b616a6cec987c9260b41822d9a995deb061e97e44b6f9857c
Target digest: 3f39dc8454e12c9b616a6cec987c9260b41822d9a995deb061e97e44b6f9857c
Shown source SHA256: 3f39dc8454e12c9b616a6cec987c9260b41822d9a995deb061e97e44b6f9857c
Shown target SHA256: 3f39dc8454e12c9b616a6cec987c9260b41822d9a995deb061e97e44b6f9857c

### Proposed decision

```json
{
  "claimId": "claim_b3bfb284463d7455bda2d9fa2d7e2441",
  "sourceUnitDigest": "3f39dc8454e12c9b616a6cec987c9260b41822d9a995deb061e97e44b6f9857c",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "3f39dc8454e12c9b616a6cec987c9260b41822d9a995deb061e97e44b6f9857c",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 4 - Clarification With The Person"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-28 (lines 213–217) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-31 (lines 243–247); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This phase runs only after investigation and framing still leave a material
user-only gap. The panel sends one consolidated `DecisionRequest` explaining
its current understanding, work already performed, why each gap cannot be
resolved elsewhere, its effect on the recommendation, and the panel's default
assumption if unanswered. The session parks without blocking unrelated work.
```

### Full target shown text

```text
This phase runs only after investigation and framing still leave a material
user-only gap. The panel sends one consolidated `DecisionRequest` explaining
its current understanding, work already performed, why each gap cannot be
resolved elsewhere, its effect on the recommendation, and the panel's default
assumption if unanswered. The session parks without blocking unrelated work.
```

## claim_bd5260496401374c4dc8dfaf347957b1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-29, lines 219–221.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-32.
Source digest: 9e427e8e9c52dcb18a4bef6fe950ebcc03ea6be5511b6cd7ae19dad27389336b
Target digest: 9e427e8e9c52dcb18a4bef6fe950ebcc03ea6be5511b6cd7ae19dad27389336b
Shown source SHA256: 9e427e8e9c52dcb18a4bef6fe950ebcc03ea6be5511b6cd7ae19dad27389336b
Shown target SHA256: 9e427e8e9c52dcb18a4bef6fe950ebcc03ea6be5511b6cd7ae19dad27389336b

### Proposed decision

```json
{
  "claimId": "claim_bd5260496401374c4dc8dfaf347957b1",
  "sourceUnitDigest": "9e427e8e9c52dcb18a4bef6fe950ebcc03ea6be5511b6cd7ae19dad27389336b",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "9e427e8e9c52dcb18a4bef6fe950ebcc03ea6be5511b6cd7ae19dad27389336b",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 4 - Clarification With The Person"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-29 (lines 219–221) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-32 (lines 249–251); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
When the person responds, the response becomes a new immutable input and the
panel returns to Phase 1 with an explicit revision rather than splicing the
answer silently into old artifacts.
```

### Full target shown text

```text
When the person responds, the response becomes a new immutable input and the
panel returns to Phase 1 with an explicit revision rather than splicing the
answer silently into old artifacts.
```

## claim_8300d7530812216c3509f194d8acd226

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#phase-5---architecture-divergence, lines 223–223.
Target: docs/platform/proposals/architecture-advisory-panel.md#phase-5---architecture-divergence.
Source digest: 8a3651a7a66b5ac2454aa04b746ca393c7b61d9c9a328cd5b682adfe3f00b29e
Target digest: 8a3651a7a66b5ac2454aa04b746ca393c7b61d9c9a328cd5b682adfe3f00b29e
Shown source SHA256: 7ce139f27e3ec059516aeb99bbbd00137573d67ee478c929387a6c2056241155
Shown target SHA256: 7ce139f27e3ec059516aeb99bbbd00137573d67ee478c929387a6c2056241155

### Proposed decision

```json
{
  "claimId": "claim_8300d7530812216c3509f194d8acd226",
  "sourceUnitDigest": "8a3651a7a66b5ac2454aa04b746ca393c7b61d9c9a328cd5b682adfe3f00b29e",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "phase-5---architecture-divergence",
  "targetUnitDigest": "8a3651a7a66b5ac2454aa04b746ca393c7b61d9c9a328cd5b682adfe3f00b29e",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#phase-5---architecture-divergence (lines 223–223) is carried at docs/platform/proposals/architecture-advisory-panel.md#phase-5---architecture-divergence (lines 253–253); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Phase 5 - Architecture Divergence

At least three independent postures receive the same settled problem frame and
Evidence Map through a private visibility window:

- `system-shaper` develops the best balanced system shape;
- `alternative-shaper` searches for a genuinely different solution class,
  including extending an existing capability, changing workflow instead of
  architecture, or not building;
- `constraint-advocate` develops the option from operational, security,
  reliability, cost, migration, reversibility, and team-capability constraints.

Each emits an `ArchitectureProposal` against the same `problemFrameRef`.
```

### Full target shown text

```text
### Phase 5 - Architecture Divergence

At least three independent postures receive the same settled problem frame and
Evidence Map through a private visibility window:

- `system-shaper` develops the best balanced system shape;
- `alternative-shaper` searches for a genuinely different solution class,
  including extending an existing capability, changing workflow instead of
  architecture, or not building;
- `constraint-advocate` develops the option from operational, security,
  reliability, cost, migration, reversibility, and team-capability constraints.

Each emits an `ArchitectureProposal` against the same `problemFrameRef`.
```

## claim_033f437313acc75ba906be0705521a7e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-30, lines 225–226.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-33.
Source digest: 9676fab3d56da3bf2a501a1f88fe27d4393ca41536fd34716eec222e61c862a4
Target digest: 9676fab3d56da3bf2a501a1f88fe27d4393ca41536fd34716eec222e61c862a4
Shown source SHA256: 9676fab3d56da3bf2a501a1f88fe27d4393ca41536fd34716eec222e61c862a4
Shown target SHA256: 9676fab3d56da3bf2a501a1f88fe27d4393ca41536fd34716eec222e61c862a4

### Proposed decision

```json
{
  "claimId": "claim_033f437313acc75ba906be0705521a7e",
  "sourceUnitDigest": "9676fab3d56da3bf2a501a1f88fe27d4393ca41536fd34716eec222e61c862a4",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "9676fab3d56da3bf2a501a1f88fe27d4393ca41536fd34716eec222e61c862a4",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 5 - Architecture Divergence"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-30 (lines 225–226) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-33 (lines 255–256); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
At least three independent postures receive the same settled problem frame and
Evidence Map through a private visibility window:
```

### Full target shown text

```text
At least three independent postures receive the same settled problem frame and
Evidence Map through a private visibility window:
```

## claim_cca40f7433fb02cb1917b2236823ca87

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-31, lines 228–233.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-34.
Source digest: 13914a8266b7c982ab3d8d170d08a4a4400a8a2069ef805ee6a41410a314d18d
Target digest: 13914a8266b7c982ab3d8d170d08a4a4400a8a2069ef805ee6a41410a314d18d
Shown source SHA256: 13914a8266b7c982ab3d8d170d08a4a4400a8a2069ef805ee6a41410a314d18d
Shown target SHA256: 13914a8266b7c982ab3d8d170d08a4a4400a8a2069ef805ee6a41410a314d18d

### Proposed decision

```json
{
  "claimId": "claim_cca40f7433fb02cb1917b2236823ca87",
  "sourceUnitDigest": "13914a8266b7c982ab3d8d170d08a4a4400a8a2069ef805ee6a41410a314d18d",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "13914a8266b7c982ab3d8d170d08a4a4400a8a2069ef805ee6a41410a314d18d",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 5 - Architecture Divergence"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-31 (lines 228–233) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-34 (lines 258–263); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- `system-shaper` develops the best balanced system shape;
- `alternative-shaper` searches for a genuinely different solution class,
  including extending an existing capability, changing workflow instead of
  architecture, or not building;
- `constraint-advocate` develops the option from operational, security,
  reliability, cost, migration, reversibility, and team-capability constraints.
```

### Full target shown text

```text
- `system-shaper` develops the best balanced system shape;
- `alternative-shaper` searches for a genuinely different solution class,
  including extending an existing capability, changing workflow instead of
  architecture, or not building;
- `constraint-advocate` develops the option from operational, security,
  reliability, cost, migration, reversibility, and team-capability constraints.
```

## claim_017f36b73d4ec5f5285b85a5a502c2de

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-32, lines 235–235.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-35.
Source digest: 8fa4bac4478be73e742896a0627bbdc030746c48c20dca3a20721f00fa0254c0
Target digest: 8fa4bac4478be73e742896a0627bbdc030746c48c20dca3a20721f00fa0254c0
Shown source SHA256: 8fa4bac4478be73e742896a0627bbdc030746c48c20dca3a20721f00fa0254c0
Shown target SHA256: 8fa4bac4478be73e742896a0627bbdc030746c48c20dca3a20721f00fa0254c0

### Proposed decision

```json
{
  "claimId": "claim_017f36b73d4ec5f5285b85a5a502c2de",
  "sourceUnitDigest": "8fa4bac4478be73e742896a0627bbdc030746c48c20dca3a20721f00fa0254c0",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "8fa4bac4478be73e742896a0627bbdc030746c48c20dca3a20721f00fa0254c0",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 5 - Architecture Divergence"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-32 (lines 235–235) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-35 (lines 265–265); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Each emits an `ArchitectureProposal` against the same `problemFrameRef`.
```

### Full target shown text

```text
Each emits an `ArchitectureProposal` against the same `problemFrameRef`.
```

## claim_b973a5ee7d810a6ca9acd86caeedf0e9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#phase-6---structured-debate, lines 237–237.
Target: docs/platform/proposals/architecture-advisory-panel.md#phase-6---structured-debate.
Source digest: b9fd41715f213615ae03725824fb9cf86404a983afe521a88942cf2b5731ee26
Target digest: b9fd41715f213615ae03725824fb9cf86404a983afe521a88942cf2b5731ee26
Shown source SHA256: e91781e245a1ca48746110486f9e34659a925f5d34172a156f4bdff1f9e06b52
Shown target SHA256: e91781e245a1ca48746110486f9e34659a925f5d34172a156f4bdff1f9e06b52

### Proposed decision

```json
{
  "claimId": "claim_b973a5ee7d810a6ca9acd86caeedf0e9",
  "sourceUnitDigest": "b9fd41715f213615ae03725824fb9cf86404a983afe521a88942cf2b5731ee26",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "phase-6---structured-debate",
  "targetUnitDigest": "b9fd41715f213615ae03725824fb9cf86404a983afe521a88942cf2b5731ee26",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#phase-6---structured-debate (lines 237–237) is carried at docs/platform/proposals/architecture-advisory-panel.md#phase-6---structured-debate (lines 267–267); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Phase 6 - Structured Debate

After every proposal in the independent cohort settles, the driver opens a
controlled reveal. Debate uses artifact-backed `objection`, `response`,
`clarification`, and `specialist-request` contributions rather than free peer
chat. Every material objection names its target, evidence, severity, and
resolution condition. The driver records an explicit disposition: accepted,
answered, mitigated, deferred with reason, unresolved, or invalidated by
evidence.
```

### Full target shown text

```text
### Phase 6 - Structured Debate

After every proposal in the independent cohort settles, the driver opens a
controlled reveal. Debate uses artifact-backed `objection`, `response`,
`clarification`, and `specialist-request` contributions rather than free peer
chat. Every material objection names its target, evidence, severity, and
resolution condition. The driver records an explicit disposition: accepted,
answered, mitigated, deferred with reason, unresolved, or invalidated by
evidence.
```

## claim_87bd25e461085696ac21cc663babbaa7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-33, lines 239–245.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-36.
Source digest: 8dc949a4acdcc4cf86c854ef4df504213192c7afcea427a2ab75bc54293d41c4
Target digest: 8dc949a4acdcc4cf86c854ef4df504213192c7afcea427a2ab75bc54293d41c4
Shown source SHA256: 8dc949a4acdcc4cf86c854ef4df504213192c7afcea427a2ab75bc54293d41c4
Shown target SHA256: 8dc949a4acdcc4cf86c854ef4df504213192c7afcea427a2ab75bc54293d41c4

### Proposed decision

```json
{
  "claimId": "claim_87bd25e461085696ac21cc663babbaa7",
  "sourceUnitDigest": "8dc949a4acdcc4cf86c854ef4df504213192c7afcea427a2ab75bc54293d41c4",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "8dc949a4acdcc4cf86c854ef4df504213192c7afcea427a2ab75bc54293d41c4",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 6 - Structured Debate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-33 (lines 239–245) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-36 (lines 269–275); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
After every proposal in the independent cohort settles, the driver opens a
controlled reveal. Debate uses artifact-backed `objection`, `response`,
`clarification`, and `specialist-request` contributions rather than free peer
chat. Every material objection names its target, evidence, severity, and
resolution condition. The driver records an explicit disposition: accepted,
answered, mitigated, deferred with reason, unresolved, or invalidated by
evidence.
```

### Full target shown text

```text
After every proposal in the independent cohort settles, the driver opens a
controlled reveal. Debate uses artifact-backed `objection`, `response`,
`clarification`, and `specialist-request` contributions rather than free peer
chat. Every material objection names its target, evidence, severity, and
resolution condition. The driver records an explicit disposition: accepted,
answered, mitigated, deferred with reason, unresolved, or invalidated by
evidence.
```

## claim_7e95ca27e8d15f3c06af9445954d6212

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#phase-7---comparative-convergence, lines 247–247.
Target: docs/platform/proposals/architecture-advisory-panel.md#phase-7---comparative-convergence.
Source digest: b5c2bec1f849c9b0dfab3b538e744aba98c0ff8d63a8930c1133df4fe442c55d
Target digest: b5c2bec1f849c9b0dfab3b538e744aba98c0ff8d63a8930c1133df4fe442c55d
Shown source SHA256: cf89dc40ab0e1810b893efc59102430d0a0c6d6e4817fa70c55230e947ad2654
Shown target SHA256: cf89dc40ab0e1810b893efc59102430d0a0c6d6e4817fa70c55230e947ad2654

### Proposed decision

```json
{
  "claimId": "claim_7e95ca27e8d15f3c06af9445954d6212",
  "sourceUnitDigest": "b5c2bec1f849c9b0dfab3b538e744aba98c0ff8d63a8930c1133df4fe442c55d",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "phase-7---comparative-convergence",
  "targetUnitDigest": "b5c2bec1f849c9b0dfab3b538e744aba98c0ff8d63a8930c1133df4fe442c55d",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#phase-7---comparative-convergence (lines 247–247) is carried at docs/platform/proposals/architecture-advisory-panel.md#phase-7---comparative-convergence (lines 277–277); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Phase 7 - Comparative Convergence

The panel compares candidates against criteria derived from the actual context,
not a universal numeric scorecard. It identifies where one option dominates,
where trade-offs are non-comparable, which evidence gaps remain, and which
conditions could reverse the ranking. V1 does not infer votes or consensus by
parsing prose.
```

### Full target shown text

```text
### Phase 7 - Comparative Convergence

The panel compares candidates against criteria derived from the actual context,
not a universal numeric scorecard. It identifies where one option dominates,
where trade-offs are non-comparable, which evidence gaps remain, and which
conditions could reverse the ranking. V1 does not infer votes or consensus by
parsing prose.
```

## claim_a63d10913e1ea8dd8fe8c41817fd63d5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-34, lines 249–253.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-37.
Source digest: f1241416f5dad07dccb26c71452c60bf0e3fb5dbee4fa92a69ebe620db2a980e
Target digest: f1241416f5dad07dccb26c71452c60bf0e3fb5dbee4fa92a69ebe620db2a980e
Shown source SHA256: f1241416f5dad07dccb26c71452c60bf0e3fb5dbee4fa92a69ebe620db2a980e
Shown target SHA256: f1241416f5dad07dccb26c71452c60bf0e3fb5dbee4fa92a69ebe620db2a980e

### Proposed decision

```json
{
  "claimId": "claim_a63d10913e1ea8dd8fe8c41817fd63d5",
  "sourceUnitDigest": "f1241416f5dad07dccb26c71452c60bf0e3fb5dbee4fa92a69ebe620db2a980e",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "f1241416f5dad07dccb26c71452c60bf0e3fb5dbee4fa92a69ebe620db2a980e",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 7 - Comparative Convergence"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-34 (lines 249–253) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-37 (lines 279–283); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The panel compares candidates against criteria derived from the actual context,
not a universal numeric scorecard. It identifies where one option dominates,
where trade-offs are non-comparable, which evidence gaps remain, and which
conditions could reverse the ranking. V1 does not infer votes or consensus by
parsing prose.
```

### Full target shown text

```text
The panel compares candidates against criteria derived from the actual context,
not a universal numeric scorecard. It identifies where one option dominates,
where trade-offs are non-comparable, which evidence gaps remain, and which
conditions could reverse the ranking. V1 does not infer votes or consensus by
parsing prose.
```

## claim_b3bf228c1037cf6b0489ddcf19dc0a1e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#phase-8---advisory-synthesis, lines 255–255.
Target: docs/platform/proposals/architecture-advisory-panel.md#phase-8---advisory-synthesis.
Source digest: 4c4fd08470ca3ce77d6a081139f9f42be69e7c3fef4f124f1032593308034dd1
Target digest: 4c4fd08470ca3ce77d6a081139f9f42be69e7c3fef4f124f1032593308034dd1
Shown source SHA256: 8a47222e8e5f0534d7f9abba6e003bdaaec6475854fc7bf6cf85298f285c8e6f
Shown target SHA256: 8a47222e8e5f0534d7f9abba6e003bdaaec6475854fc7bf6cf85298f285c8e6f

### Proposed decision

```json
{
  "claimId": "claim_b3bf228c1037cf6b0489ddcf19dc0a1e",
  "sourceUnitDigest": "4c4fd08470ca3ce77d6a081139f9f42be69e7c3fef4f124f1032593308034dd1",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "phase-8---advisory-synthesis",
  "targetUnitDigest": "4c4fd08470ca3ce77d6a081139f9f42be69e7c3fef4f124f1032593308034dd1",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#phase-8---advisory-synthesis (lines 255–255) is carried at docs/platform/proposals/architecture-advisory-panel.md#phase-8---advisory-synthesis (lines 285–285); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Phase 8 - Advisory Synthesis

The `synthesizer` creates an `AdvisoryDecisionPacket` from the settled proposal,
contribution, disposition, specialist, and comparison artifacts. The packet
must disclose source revisions, failed or missing actors, unresolved objections,
minority positions, remaining uncertainty, and reversal conditions.
```

### Full target shown text

```text
### Phase 8 - Advisory Synthesis

The `synthesizer` creates an `AdvisoryDecisionPacket` from the settled proposal,
contribution, disposition, specialist, and comparison artifacts. The packet
must disclose source revisions, failed or missing actors, unresolved objections,
minority positions, remaining uncertainty, and reversal conditions.
```

## claim_6a9a06cab3a37f4e059fd465908cc100

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-35, lines 257–260.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-38.
Source digest: e4437aadbdc8414911ebb0ca2804ea9077f22fef573cd15d897d2945c47ad182
Target digest: e4437aadbdc8414911ebb0ca2804ea9077f22fef573cd15d897d2945c47ad182
Shown source SHA256: e4437aadbdc8414911ebb0ca2804ea9077f22fef573cd15d897d2945c47ad182
Shown target SHA256: e4437aadbdc8414911ebb0ca2804ea9077f22fef573cd15d897d2945c47ad182

### Proposed decision

```json
{
  "claimId": "claim_6a9a06cab3a37f4e059fd465908cc100",
  "sourceUnitDigest": "e4437aadbdc8414911ebb0ca2804ea9077f22fef573cd15d897d2945c47ad182",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "e4437aadbdc8414911ebb0ca2804ea9077f22fef573cd15d897d2945c47ad182",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 8 - Advisory Synthesis"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-35 (lines 257–260) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-38 (lines 287–290); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The `synthesizer` creates an `AdvisoryDecisionPacket` from the settled proposal,
contribution, disposition, specialist, and comparison artifacts. The packet
must disclose source revisions, failed or missing actors, unresolved objections,
minority positions, remaining uncertainty, and reversal conditions.
```

### Full target shown text

```text
The `synthesizer` creates an `AdvisoryDecisionPacket` from the settled proposal,
contribution, disposition, specialist, and comparison artifacts. The packet
must disclose source revisions, failed or missing actors, unresolved objections,
minority positions, remaining uncertainty, and reversal conditions.
```

## claim_f675d050c9fe867d3ac6fd7faf3046a3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#phase-9---independent-recheck, lines 262–262.
Target: docs/platform/proposals/architecture-advisory-panel.md#phase-9---independent-recheck.
Source digest: 65945238c12fb871968acd5b417f8d8a10aa33055c361a94641648329c6adc70
Target digest: 65945238c12fb871968acd5b417f8d8a10aa33055c361a94641648329c6adc70
Shown source SHA256: 6837f9ecbbd53ff01f78103e87a2f865a06fd5306f206a11982dc31bc12e4664
Shown target SHA256: 6837f9ecbbd53ff01f78103e87a2f865a06fd5306f206a11982dc31bc12e4664

### Proposed decision

```json
{
  "claimId": "claim_f675d050c9fe867d3ac6fd7faf3046a3",
  "sourceUnitDigest": "65945238c12fb871968acd5b417f8d8a10aa33055c361a94641648329c6adc70",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "phase-9---independent-recheck",
  "targetUnitDigest": "65945238c12fb871968acd5b417f8d8a10aa33055c361a94641648329c6adc70",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#phase-9---independent-recheck (lines 262–262) is carried at docs/platform/proposals/architecture-advisory-panel.md#phase-9---independent-recheck (lines 292–292); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Phase 9 - Independent Recheck

An `independent-red-team` reviews the new packet rather than merely repeating
candidate reviews. It attacks the framing, omitted alternatives, authority
leakage, hidden dissent, false certainty, migration feasibility, and violations
of authoritative constraints. Its `RecheckReport` verdict is `sound`, `revise`,
or `insufficient-evidence`. At most one synthesis revision is permitted before
the session reports `no-consensus` or `validation-required` instead of looping.
```

### Full target shown text

```text
### Phase 9 - Independent Recheck

An `independent-red-team` reviews the new packet rather than merely repeating
candidate reviews. It attacks the framing, omitted alternatives, authority
leakage, hidden dissent, false certainty, migration feasibility, and violations
of authoritative constraints. Its `RecheckReport` verdict is `sound`, `revise`,
or `insufficient-evidence`. At most one synthesis revision is permitted before
the session reports `no-consensus` or `validation-required` instead of looping.
```

## claim_59278cb33cfbefabfade69c2b73e194a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-36, lines 264–269.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-39.
Source digest: 759c90918674c5eeb07dd62ba020079e46965a0161297723f7a0f3cdafa6a917
Target digest: 759c90918674c5eeb07dd62ba020079e46965a0161297723f7a0f3cdafa6a917
Shown source SHA256: 759c90918674c5eeb07dd62ba020079e46965a0161297723f7a0f3cdafa6a917
Shown target SHA256: 759c90918674c5eeb07dd62ba020079e46965a0161297723f7a0f3cdafa6a917

### Proposed decision

```json
{
  "claimId": "claim_59278cb33cfbefabfade69c2b73e194a",
  "sourceUnitDigest": "759c90918674c5eeb07dd62ba020079e46965a0161297723f7a0f3cdafa6a917",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "759c90918674c5eeb07dd62ba020079e46965a0161297723f7a0f3cdafa6a917",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "5. Nine Logical Phases",
    "Phase 9 - Independent Recheck"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-36 (lines 264–269) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-39 (lines 294–299); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
An `independent-red-team` reviews the new packet rather than merely repeating
candidate reviews. It attacks the framing, omitted alternatives, authority
leakage, hidden dissent, false certainty, migration feasibility, and violations
of authoritative constraints. Its `RecheckReport` verdict is `sound`, `revise`,
or `insufficient-evidence`. At most one synthesis revision is permitted before
the session reports `no-consensus` or `validation-required` instead of looping.
```

### Full target shown text

```text
An `independent-red-team` reviews the new packet rather than merely repeating
candidate reviews. It attacks the framing, omitted alternatives, authority
leakage, hidden dissent, false certainty, migration feasibility, and violations
of authoritative constraints. Its `RecheckReport` verdict is `sound`, `revise`,
or `insufficient-evidence`. At most one synthesis revision is permitted before
the session reports `no-consensus` or `validation-required` instead of looping.
```

## claim_cbc8916c923d07b9388d7e99d504eecb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#6-runtime-rounds-and-bounds, lines 271–271.
Target: docs/platform/proposals/architecture-advisory-panel.md#6-runtime-rounds-and-bounds.
Source digest: 4d3bf4672631e875987aafc3b440df4e6454c7a99ea832399d0e185a911a8771
Target digest: 4d3bf4672631e875987aafc3b440df4e6454c7a99ea832399d0e185a911a8771
Shown source SHA256: 1f5201271f9c94c49db3e54417ffc0f897b20f50df310fbcac4cc4fbee01d3bb
Shown target SHA256: 1f5201271f9c94c49db3e54417ffc0f897b20f50df310fbcac4cc4fbee01d3bb

### Proposed decision

```json
{
  "claimId": "claim_cbc8916c923d07b9388d7e99d504eecb",
  "sourceUnitDigest": "4d3bf4672631e875987aafc3b440df4e6454c7a99ea832399d0e185a911a8771",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "6-runtime-rounds-and-bounds",
  "targetUnitDigest": "4d3bf4672631e875987aafc3b440df4e6454c7a99ea832399d0e185a911a8771",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#6-runtime-rounds-and-bounds (lines 271–271) is carried at docs/platform/proposals/architecture-advisory-panel.md#6-runtime-rounds-and-bounds (lines 301–301); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 6. Runtime Rounds And Bounds

The default deliberation budget is seven runtime rounds, although a clear input
normally consumes fewer:

| Runtime round | Work | Required? |
|---|---|---|
| R1 | Interpret intent and investigate context. | Yes |
| R2 | Diverge on problem framing. | Only when the understanding gate requires it |
| R3 | Generate independent architecture candidates. | Yes |
| R4 | Challenge, respond, disposition, and optionally consult specialists. | Yes |
| R5 | Compare and synthesize. | Yes |
| R6 | Independently recheck the synthesized packet. | Yes |
| R7 | Revise and recheck the new packet revision. | Only once, when authorized |

The distinction is deliberate: nine phases define the logical workflow; up to
seven rounds define runtime cost. Clarification with the person is a parked
boundary, not an agent round.

Initial bounds should be evaluated during planning, with this proposal as the
starting point:

```yaml
aggregateBounds:
  maxRounds: 7
  maxAssignments: 18
  maxConcurrency: 3
```

Decision Dialogue conceptually has a separate allowance so a difficult discovery phase
cannot exhaust the person's opportunity to question the advice:

```yaml
dialogueBounds:
  maxReopenCycles: 2
  maxAssignmentsPerCycle: 8
```

This `dialogueBounds` block is proposal vocabulary, not an implemented runtime
field. Planning must map it to an existing enforced counter or implement a
general bounded-reopen capability. Simple clarification and direct answers
consume no reopen cycle.
````

### Full target shown text

````text
## 6. Runtime Rounds And Bounds

The default deliberation budget is seven runtime rounds, although a clear input
normally consumes fewer:

| Runtime round | Work | Required? |
|---|---|---|
| R1 | Interpret intent and investigate context. | Yes |
| R2 | Diverge on problem framing. | Only when the understanding gate requires it |
| R3 | Generate independent architecture candidates. | Yes |
| R4 | Challenge, respond, disposition, and optionally consult specialists. | Yes |
| R5 | Compare and synthesize. | Yes |
| R6 | Independently recheck the synthesized packet. | Yes |
| R7 | Revise and recheck the new packet revision. | Only once, when authorized |

The distinction is deliberate: nine phases define the logical workflow; up to
seven rounds define runtime cost. Clarification with the person is a parked
boundary, not an agent round.

Initial bounds should be evaluated during planning, with this proposal as the
starting point:

```yaml
aggregateBounds:
  maxRounds: 7
  maxAssignments: 18
  maxConcurrency: 3
```

Decision Dialogue conceptually has a separate allowance so a difficult discovery phase
cannot exhaust the person's opportunity to question the advice:

```yaml
dialogueBounds:
  maxReopenCycles: 2
  maxAssignmentsPerCycle: 8
```

This `dialogueBounds` block is proposal vocabulary, not an implemented runtime
field. Planning must map it to an existing enforced counter or implement a
general bounded-reopen capability. Simple clarification and direct answers
consume no reopen cycle.
````

## claim_259bda054ec95b8947009a8495a80abd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-37, lines 273–274.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-40.
Source digest: a7394ffa5efde0c71d5d3492c7b0346385edba0d4396cb063d3162d03136d635
Target digest: a7394ffa5efde0c71d5d3492c7b0346385edba0d4396cb063d3162d03136d635
Shown source SHA256: a7394ffa5efde0c71d5d3492c7b0346385edba0d4396cb063d3162d03136d635
Shown target SHA256: a7394ffa5efde0c71d5d3492c7b0346385edba0d4396cb063d3162d03136d635

### Proposed decision

```json
{
  "claimId": "claim_259bda054ec95b8947009a8495a80abd",
  "sourceUnitDigest": "a7394ffa5efde0c71d5d3492c7b0346385edba0d4396cb063d3162d03136d635",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "a7394ffa5efde0c71d5d3492c7b0346385edba0d4396cb063d3162d03136d635",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "6. Runtime Rounds And Bounds"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-37 (lines 273–274) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-40 (lines 303–304); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The default deliberation budget is seven runtime rounds, although a clear input
normally consumes fewer:
```

### Full target shown text

```text
The default deliberation budget is seven runtime rounds, although a clear input
normally consumes fewer:
```

## claim_c38261e7cbf81288cfc3c1a5facfdf02

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-38, lines 276–284.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-41.
Source digest: 05b8b735064ebe6a09df1e2e97ca499bd6a41f8db54a213303152bdff40b7893
Target digest: 05b8b735064ebe6a09df1e2e97ca499bd6a41f8db54a213303152bdff40b7893
Shown source SHA256: 05b8b735064ebe6a09df1e2e97ca499bd6a41f8db54a213303152bdff40b7893
Shown target SHA256: 05b8b735064ebe6a09df1e2e97ca499bd6a41f8db54a213303152bdff40b7893

### Proposed decision

```json
{
  "claimId": "claim_c38261e7cbf81288cfc3c1a5facfdf02",
  "sourceUnitDigest": "05b8b735064ebe6a09df1e2e97ca499bd6a41f8db54a213303152bdff40b7893",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "05b8b735064ebe6a09df1e2e97ca499bd6a41f8db54a213303152bdff40b7893",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "6. Runtime Rounds And Bounds"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-38 (lines 276–284) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-41 (lines 306–314); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Runtime round | Work | Required? |
|---|---|---|
| R1 | Interpret intent and investigate context. | Yes |
| R2 | Diverge on problem framing. | Only when the understanding gate requires it |
| R3 | Generate independent architecture candidates. | Yes |
| R4 | Challenge, respond, disposition, and optionally consult specialists. | Yes |
| R5 | Compare and synthesize. | Yes |
| R6 | Independently recheck the synthesized packet. | Yes |
| R7 | Revise and recheck the new packet revision. | Only once, when authorized |
```

### Full target shown text

```text
| Runtime round | Work | Required? |
|---|---|---|
| R1 | Interpret intent and investigate context. | Yes |
| R2 | Diverge on problem framing. | Only when the understanding gate requires it |
| R3 | Generate independent architecture candidates. | Yes |
| R4 | Challenge, respond, disposition, and optionally consult specialists. | Yes |
| R5 | Compare and synthesize. | Yes |
| R6 | Independently recheck the synthesized packet. | Yes |
| R7 | Revise and recheck the new packet revision. | Only once, when authorized |
```

## claim_d234799111d4ca9f82d9ae9a0e42d535

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-39, lines 286–288.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-42.
Source digest: 520ef7ce0aff5f38b44d4f79cb025033f460545cbf01e3b9d2958d5619dae2d1
Target digest: 520ef7ce0aff5f38b44d4f79cb025033f460545cbf01e3b9d2958d5619dae2d1
Shown source SHA256: 520ef7ce0aff5f38b44d4f79cb025033f460545cbf01e3b9d2958d5619dae2d1
Shown target SHA256: 520ef7ce0aff5f38b44d4f79cb025033f460545cbf01e3b9d2958d5619dae2d1

### Proposed decision

```json
{
  "claimId": "claim_d234799111d4ca9f82d9ae9a0e42d535",
  "sourceUnitDigest": "520ef7ce0aff5f38b44d4f79cb025033f460545cbf01e3b9d2958d5619dae2d1",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "520ef7ce0aff5f38b44d4f79cb025033f460545cbf01e3b9d2958d5619dae2d1",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "6. Runtime Rounds And Bounds"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-39 (lines 286–288) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-42 (lines 316–318); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The distinction is deliberate: nine phases define the logical workflow; up to
seven rounds define runtime cost. Clarification with the person is a parked
boundary, not an agent round.
```

### Full target shown text

```text
The distinction is deliberate: nine phases define the logical workflow; up to
seven rounds define runtime cost. Clarification with the person is a parked
boundary, not an agent round.
```

## claim_8f0c042bad0e2bf45b7708d00a1b6e34

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-40, lines 290–291.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-43.
Source digest: 09ffa59d849b756006da6cc7e4a930fd16665fafd2c16b2a2188514bfb9da0ed
Target digest: 09ffa59d849b756006da6cc7e4a930fd16665fafd2c16b2a2188514bfb9da0ed
Shown source SHA256: 09ffa59d849b756006da6cc7e4a930fd16665fafd2c16b2a2188514bfb9da0ed
Shown target SHA256: 09ffa59d849b756006da6cc7e4a930fd16665fafd2c16b2a2188514bfb9da0ed

### Proposed decision

```json
{
  "claimId": "claim_8f0c042bad0e2bf45b7708d00a1b6e34",
  "sourceUnitDigest": "09ffa59d849b756006da6cc7e4a930fd16665fafd2c16b2a2188514bfb9da0ed",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "09ffa59d849b756006da6cc7e4a930fd16665fafd2c16b2a2188514bfb9da0ed",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "6. Runtime Rounds And Bounds"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-40 (lines 290–291) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-43 (lines 320–321); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Initial bounds should be evaluated during planning, with this proposal as the
starting point:
```

### Full target shown text

```text
Initial bounds should be evaluated during planning, with this proposal as the
starting point:
```

## claim_0a05a33dbc0f6709ed61aaec5ec030cb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-41, lines 293–298.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-44.
Source digest: 6f1744a7c46ffd763f33a2c31d3466389460044f8f5ebb2dc1087430e401183d
Target digest: 6f1744a7c46ffd763f33a2c31d3466389460044f8f5ebb2dc1087430e401183d
Shown source SHA256: 6f1744a7c46ffd763f33a2c31d3466389460044f8f5ebb2dc1087430e401183d
Shown target SHA256: 6f1744a7c46ffd763f33a2c31d3466389460044f8f5ebb2dc1087430e401183d

### Proposed decision

```json
{
  "claimId": "claim_0a05a33dbc0f6709ed61aaec5ec030cb",
  "sourceUnitDigest": "6f1744a7c46ffd763f33a2c31d3466389460044f8f5ebb2dc1087430e401183d",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "6f1744a7c46ffd763f33a2c31d3466389460044f8f5ebb2dc1087430e401183d",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "6. Runtime Rounds And Bounds"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-41 (lines 293–298) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-44 (lines 323–328); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
aggregateBounds:
  maxRounds: 7
  maxAssignments: 18
  maxConcurrency: 3
```
````

### Full target shown text

````text
```yaml
aggregateBounds:
  maxRounds: 7
  maxAssignments: 18
  maxConcurrency: 3
```
````

## claim_8eb2a6dce9049d06ff77f7232059612e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-42, lines 300–301.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-45.
Source digest: be6421a096c023467cc0e01c36f637be65d7ab8b127d84ead3a0fdeb21e8007b
Target digest: be6421a096c023467cc0e01c36f637be65d7ab8b127d84ead3a0fdeb21e8007b
Shown source SHA256: be6421a096c023467cc0e01c36f637be65d7ab8b127d84ead3a0fdeb21e8007b
Shown target SHA256: be6421a096c023467cc0e01c36f637be65d7ab8b127d84ead3a0fdeb21e8007b

### Proposed decision

```json
{
  "claimId": "claim_8eb2a6dce9049d06ff77f7232059612e",
  "sourceUnitDigest": "be6421a096c023467cc0e01c36f637be65d7ab8b127d84ead3a0fdeb21e8007b",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "be6421a096c023467cc0e01c36f637be65d7ab8b127d84ead3a0fdeb21e8007b",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "6. Runtime Rounds And Bounds"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-42 (lines 300–301) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-45 (lines 330–331); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Decision Dialogue conceptually has a separate allowance so a difficult discovery phase
cannot exhaust the person's opportunity to question the advice:
```

### Full target shown text

```text
Decision Dialogue conceptually has a separate allowance so a difficult discovery phase
cannot exhaust the person's opportunity to question the advice:
```

## claim_038f9d78806feb10575693e9825ab0a8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-43, lines 303–307.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-46.
Source digest: 0ac6b72ca8f1bf7630ace94db35aea431b91556746eab2d33ec232fb3d809eaf
Target digest: 0ac6b72ca8f1bf7630ace94db35aea431b91556746eab2d33ec232fb3d809eaf
Shown source SHA256: 0ac6b72ca8f1bf7630ace94db35aea431b91556746eab2d33ec232fb3d809eaf
Shown target SHA256: 0ac6b72ca8f1bf7630ace94db35aea431b91556746eab2d33ec232fb3d809eaf

### Proposed decision

```json
{
  "claimId": "claim_038f9d78806feb10575693e9825ab0a8",
  "sourceUnitDigest": "0ac6b72ca8f1bf7630ace94db35aea431b91556746eab2d33ec232fb3d809eaf",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "0ac6b72ca8f1bf7630ace94db35aea431b91556746eab2d33ec232fb3d809eaf",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "6. Runtime Rounds And Bounds"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-43 (lines 303–307) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-46 (lines 333–337); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
dialogueBounds:
  maxReopenCycles: 2
  maxAssignmentsPerCycle: 8
```
````

### Full target shown text

````text
```yaml
dialogueBounds:
  maxReopenCycles: 2
  maxAssignmentsPerCycle: 8
```
````

## claim_e9777367cd5c0bc3ee8e6d0fa9768395

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-44, lines 309–312.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-47.
Source digest: 3fcb7e31203b89777f965a501d9612e3796fb744d3210aab569f9b6e8a82fe27
Target digest: 3fcb7e31203b89777f965a501d9612e3796fb744d3210aab569f9b6e8a82fe27
Shown source SHA256: 3fcb7e31203b89777f965a501d9612e3796fb744d3210aab569f9b6e8a82fe27
Shown target SHA256: 3fcb7e31203b89777f965a501d9612e3796fb744d3210aab569f9b6e8a82fe27

### Proposed decision

```json
{
  "claimId": "claim_e9777367cd5c0bc3ee8e6d0fa9768395",
  "sourceUnitDigest": "3fcb7e31203b89777f965a501d9612e3796fb744d3210aab569f9b6e8a82fe27",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "3fcb7e31203b89777f965a501d9612e3796fb744d3210aab569f9b6e8a82fe27",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "6. Runtime Rounds And Bounds"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-44 (lines 309–312) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-47 (lines 339–342); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This `dialogueBounds` block is proposal vocabulary, not an implemented runtime
field. Planning must map it to an existing enforced counter or implement a
general bounded-reopen capability. Simple clarification and direct answers
consume no reopen cycle.
```

### Full target shown text

```text
This `dialogueBounds` block is proposal vocabulary, not an implemented runtime
field. Planning must map it to an existing enforced counter or implement a
general bounded-reopen capability. Simple clarification and direct answers
consume no reopen cycle.
```

## claim_9ebf93e5e407b59158649c96b7aaec5e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#7-understanding-and-clarification-gates, lines 314–314.
Target: docs/platform/proposals/architecture-advisory-panel.md#7-understanding-and-clarification-gates.
Source digest: 3e57f975571d566c455a398b79c462c2473a9b35e69ca3e32e93a6ad93659e01
Target digest: 3e57f975571d566c455a398b79c462c2473a9b35e69ca3e32e93a6ad93659e01
Shown source SHA256: 94b05bbddd19ee71c2b3e189eeac68f8271de92b97890fd02ffa53cec16e6551
Shown target SHA256: 94b05bbddd19ee71c2b3e189eeac68f8271de92b97890fd02ffa53cec16e6551

### Proposed decision

```json
{
  "claimId": "claim_9ebf93e5e407b59158649c96b7aaec5e",
  "sourceUnitDigest": "3e57f975571d566c455a398b79c462c2473a9b35e69ca3e32e93a6ad93659e01",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "7-understanding-and-clarification-gates",
  "targetUnitDigest": "3e57f975571d566c455a398b79c462c2473a9b35e69ca3e32e93a6ad93659e01",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#7-understanding-and-clarification-gates (lines 314–314) is carried at docs/platform/proposals/architecture-advisory-panel.md#7-understanding-and-clarification-gates (lines 344–344); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 7. Understanding And Clarification Gates

The understanding gate does not use one opaque confidence score. It refuses to
advance while any of these conditions holds:

- the actual decision is unknown;
- the relevant system boundary is unknown;
- a remaining unknown can change the solution class;
- a material constraint has no known authority;
- symptom and underlying problem have not been distinguished;
- the desired outcome merely repeats the requested feature.

If none holds, the panel may proceed despite non-material unknowns.

A request to the person is legal only when all three conditions hold:

1. the answer can materially change the recommendation;
2. permitted investigation and bounded specialists cannot resolve it;
3. the answer is a preference, authority, or business reality held only by the
   person.

The lead advisor proposes the gate outcome, the external driver authorizes the
next operation, and the runtime verifies artifact and provenance preconditions.
No worker opens a round on its own.
```

### Full target shown text

```text
## 7. Understanding And Clarification Gates

The understanding gate does not use one opaque confidence score. It refuses to
advance while any of these conditions holds:

- the actual decision is unknown;
- the relevant system boundary is unknown;
- a remaining unknown can change the solution class;
- a material constraint has no known authority;
- symptom and underlying problem have not been distinguished;
- the desired outcome merely repeats the requested feature.

If none holds, the panel may proceed despite non-material unknowns.

A request to the person is legal only when all three conditions hold:

1. the answer can materially change the recommendation;
2. permitted investigation and bounded specialists cannot resolve it;
3. the answer is a preference, authority, or business reality held only by the
   person.

The lead advisor proposes the gate outcome, the external driver authorizes the
next operation, and the runtime verifies artifact and provenance preconditions.
No worker opens a round on its own.
```

## claim_64faad88503ce426731c2e4e98027426

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-45, lines 316–317.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-48.
Source digest: bfd8b5e82f3e30711ea9dd4242500098523cf209eb723a102c7ef37d25cef3b7
Target digest: bfd8b5e82f3e30711ea9dd4242500098523cf209eb723a102c7ef37d25cef3b7
Shown source SHA256: bfd8b5e82f3e30711ea9dd4242500098523cf209eb723a102c7ef37d25cef3b7
Shown target SHA256: bfd8b5e82f3e30711ea9dd4242500098523cf209eb723a102c7ef37d25cef3b7

### Proposed decision

```json
{
  "claimId": "claim_64faad88503ce426731c2e4e98027426",
  "sourceUnitDigest": "bfd8b5e82f3e30711ea9dd4242500098523cf209eb723a102c7ef37d25cef3b7",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "bfd8b5e82f3e30711ea9dd4242500098523cf209eb723a102c7ef37d25cef3b7",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "7. Understanding And Clarification Gates"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-45 (lines 316–317) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-48 (lines 346–347); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The understanding gate does not use one opaque confidence score. It refuses to
advance while any of these conditions holds:
```

### Full target shown text

```text
The understanding gate does not use one opaque confidence score. It refuses to
advance while any of these conditions holds:
```

## claim_28e416031b7872bd878483a94ab8105a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-46, lines 319–324.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-49.
Source digest: 088c35b841376b1bbaa91d27ce05bbee13cd94bb669db334eebe4a3180185bb4
Target digest: 088c35b841376b1bbaa91d27ce05bbee13cd94bb669db334eebe4a3180185bb4
Shown source SHA256: 088c35b841376b1bbaa91d27ce05bbee13cd94bb669db334eebe4a3180185bb4
Shown target SHA256: 088c35b841376b1bbaa91d27ce05bbee13cd94bb669db334eebe4a3180185bb4

### Proposed decision

```json
{
  "claimId": "claim_28e416031b7872bd878483a94ab8105a",
  "sourceUnitDigest": "088c35b841376b1bbaa91d27ce05bbee13cd94bb669db334eebe4a3180185bb4",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "088c35b841376b1bbaa91d27ce05bbee13cd94bb669db334eebe4a3180185bb4",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "7. Understanding And Clarification Gates"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-46 (lines 319–324) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-49 (lines 349–354); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- the actual decision is unknown;
- the relevant system boundary is unknown;
- a remaining unknown can change the solution class;
- a material constraint has no known authority;
- symptom and underlying problem have not been distinguished;
- the desired outcome merely repeats the requested feature.
```

### Full target shown text

```text
- the actual decision is unknown;
- the relevant system boundary is unknown;
- a remaining unknown can change the solution class;
- a material constraint has no known authority;
- symptom and underlying problem have not been distinguished;
- the desired outcome merely repeats the requested feature.
```

## claim_4d687c6e19f1747febc4e3a9dde49112

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-47, lines 326–326.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-50.
Source digest: 9318c38f7e6fb99c0e99ddd0c9319a7988ed76a7d1b0c23c89130c43213f30f0
Target digest: 9318c38f7e6fb99c0e99ddd0c9319a7988ed76a7d1b0c23c89130c43213f30f0
Shown source SHA256: 9318c38f7e6fb99c0e99ddd0c9319a7988ed76a7d1b0c23c89130c43213f30f0
Shown target SHA256: 9318c38f7e6fb99c0e99ddd0c9319a7988ed76a7d1b0c23c89130c43213f30f0

### Proposed decision

```json
{
  "claimId": "claim_4d687c6e19f1747febc4e3a9dde49112",
  "sourceUnitDigest": "9318c38f7e6fb99c0e99ddd0c9319a7988ed76a7d1b0c23c89130c43213f30f0",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "9318c38f7e6fb99c0e99ddd0c9319a7988ed76a7d1b0c23c89130c43213f30f0",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "7. Understanding And Clarification Gates"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-47 (lines 326–326) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-50 (lines 356–356); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
If none holds, the panel may proceed despite non-material unknowns.
```

### Full target shown text

```text
If none holds, the panel may proceed despite non-material unknowns.
```

## claim_ecfc8b52318d62adbc970921435c9c70

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-48, lines 328–328.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-51.
Source digest: eeb9f9773100d9d795e4d8649634e32f6f9d669424dfbe101ce06030b67299c5
Target digest: eeb9f9773100d9d795e4d8649634e32f6f9d669424dfbe101ce06030b67299c5
Shown source SHA256: eeb9f9773100d9d795e4d8649634e32f6f9d669424dfbe101ce06030b67299c5
Shown target SHA256: eeb9f9773100d9d795e4d8649634e32f6f9d669424dfbe101ce06030b67299c5

### Proposed decision

```json
{
  "claimId": "claim_ecfc8b52318d62adbc970921435c9c70",
  "sourceUnitDigest": "eeb9f9773100d9d795e4d8649634e32f6f9d669424dfbe101ce06030b67299c5",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "eeb9f9773100d9d795e4d8649634e32f6f9d669424dfbe101ce06030b67299c5",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "7. Understanding And Clarification Gates"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-48 (lines 328–328) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-51 (lines 358–358); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A request to the person is legal only when all three conditions hold:
```

### Full target shown text

```text
A request to the person is legal only when all three conditions hold:
```

## claim_ae286fd7b89b931db447e7769c61fc25

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-49, lines 330–333.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-52.
Source digest: 2e4dc300f0283e69821a3faf1fd45ed862da5a672f7dcef1167898b74ded1be8
Target digest: 2e4dc300f0283e69821a3faf1fd45ed862da5a672f7dcef1167898b74ded1be8
Shown source SHA256: 2e4dc300f0283e69821a3faf1fd45ed862da5a672f7dcef1167898b74ded1be8
Shown target SHA256: 2e4dc300f0283e69821a3faf1fd45ed862da5a672f7dcef1167898b74ded1be8

### Proposed decision

```json
{
  "claimId": "claim_ae286fd7b89b931db447e7769c61fc25",
  "sourceUnitDigest": "2e4dc300f0283e69821a3faf1fd45ed862da5a672f7dcef1167898b74ded1be8",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "2e4dc300f0283e69821a3faf1fd45ed862da5a672f7dcef1167898b74ded1be8",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "7. Understanding And Clarification Gates"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-49 (lines 330–333) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-52 (lines 360–363); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. the answer can materially change the recommendation;
2. permitted investigation and bounded specialists cannot resolve it;
3. the answer is a preference, authority, or business reality held only by the
   person.
```

### Full target shown text

```text
1. the answer can materially change the recommendation;
2. permitted investigation and bounded specialists cannot resolve it;
3. the answer is a preference, authority, or business reality held only by the
   person.
```

## claim_21afd1250edea73555d4b8a47fba7876

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-50, lines 335–337.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-53.
Source digest: c8e88ebe440eba2a3c181eddf789ef52217aa9ab1df1db4975ef4d4a4aa2839b
Target digest: c8e88ebe440eba2a3c181eddf789ef52217aa9ab1df1db4975ef4d4a4aa2839b
Shown source SHA256: c8e88ebe440eba2a3c181eddf789ef52217aa9ab1df1db4975ef4d4a4aa2839b
Shown target SHA256: c8e88ebe440eba2a3c181eddf789ef52217aa9ab1df1db4975ef4d4a4aa2839b

### Proposed decision

```json
{
  "claimId": "claim_21afd1250edea73555d4b8a47fba7876",
  "sourceUnitDigest": "c8e88ebe440eba2a3c181eddf789ef52217aa9ab1df1db4975ef4d4a4aa2839b",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "c8e88ebe440eba2a3c181eddf789ef52217aa9ab1df1db4975ef4d4a4aa2839b",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "7. Understanding And Clarification Gates"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-50 (lines 335–337) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-53 (lines 365–367); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The lead advisor proposes the gate outcome, the external driver authorizes the
next operation, and the runtime verifies artifact and provenance preconditions.
No worker opens a round on its own.
```

### Full target shown text

```text
The lead advisor proposes the gate outcome, the external driver authorizes the
next operation, and the runtime verifies artifact and provenance preconditions.
No worker opens a round on its own.
```

## claim_7d7b428e73dcc5e2429d9c1f2cea8584

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#8-roles, lines 339–339.
Target: docs/platform/proposals/architecture-advisory-panel.md#8-roles.
Source digest: f61934f0ea3622614fca38a6f35fcb676805f249fea783bf14712709bfac5787
Target digest: f61934f0ea3622614fca38a6f35fcb676805f249fea783bf14712709bfac5787
Shown source SHA256: 18117a77512d51ea812b1576c263123e2a1aeac0cd24b33e8fc6df34e04efe3f
Shown target SHA256: 18117a77512d51ea812b1576c263123e2a1aeac0cd24b33e8fc6df34e04efe3f

### Proposed decision

```json
{
  "claimId": "claim_7d7b428e73dcc5e2429d9c1f2cea8584",
  "sourceUnitDigest": "f61934f0ea3622614fca38a6f35fcb676805f249fea783bf14712709bfac5787",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "8-roles",
  "targetUnitDigest": "f61934f0ea3622614fca38a6f35fcb676805f249fea783bf14712709bfac5787",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#8-roles (lines 339–339) is carried at docs/platform/proposals/architecture-advisory-panel.md#8-roles (lines 369–369); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 8. Roles

| Role | Responsibility | Prohibited shortcut |
|---|---|---|
| `lead-advisor` | A separately dispatched actor that maintains working understanding, identifies material gaps, prepares questions, assesses dialogue impact, and explains the final packet. | Treat inferred intent as fact, defer every trade-off to the person, or authorize its own proposed gate. |
| `context-investigator` | Build the evidence map from permitted sources. | Search only for support for an early solution. |
| `system-shaper` | Produce a balanced system architecture. | See sibling proposals before the independent cohort settles. |
| `alternative-shaper` | Produce a credible, materially different solution class. | Add a token weak alternative merely to claim divergence. |
| `constraint-advocate` | Design from operational, security, reliability, migration, cost, and team constraints. | Turn every concern into a veto without evidence. |
| `architecture-critic` | Raise evidence-linked objections and state resolution conditions. | Argue for an actor or proposal identity rather than test claims. |
| `synthesizer` | Compare, recommend, and preserve uncertainty and dissent. | Resolve objections or invent facts silently. |
| `independent-red-team` | Attack the packet's framing, completeness, confidence, and feasibility. | Reuse the synthesizer's reasoning as its own proof. |

The protocol may predeclare bounded `domain-specialist`,
`security-specialist`, `operations-specialist`, and `data-specialist` slots.
The driver binds only the slots needed for the current session, normally no
more than two. Workers may request a specialist contribution but may not invite
or bind peers themselves.

The default product posture should recommend heterogeneous role bindings while
remaining configurable. The contract requires real per-actor selection and
provenance, not any permanently hardcoded vendor roster. A host with one
provider may still run separate assignments with fresh role contexts, but that
fallback must not be presented as provider diversity.

Every advisory execution must also run inside a live-proven read-only
confinement envelope. That envelope may be a provider-native sandbox, an
executor variant, an OS/filesystem boundary, a read-only mount, or another
mechanism that proves the same invariant. A read-only Assignment classification
or a prompt saying "do not edit" is insufficient when the subprocess can still
write. Any executor/mechanism pair that fails the mutation attack is excluded.
```

### Full target shown text

```text
## 8. Roles

| Role | Responsibility | Prohibited shortcut |
|---|---|---|
| `lead-advisor` | A separately dispatched actor that maintains working understanding, identifies material gaps, prepares questions, assesses dialogue impact, and explains the final packet. | Treat inferred intent as fact, defer every trade-off to the person, or authorize its own proposed gate. |
| `context-investigator` | Build the evidence map from permitted sources. | Search only for support for an early solution. |
| `system-shaper` | Produce a balanced system architecture. | See sibling proposals before the independent cohort settles. |
| `alternative-shaper` | Produce a credible, materially different solution class. | Add a token weak alternative merely to claim divergence. |
| `constraint-advocate` | Design from operational, security, reliability, migration, cost, and team constraints. | Turn every concern into a veto without evidence. |
| `architecture-critic` | Raise evidence-linked objections and state resolution conditions. | Argue for an actor or proposal identity rather than test claims. |
| `synthesizer` | Compare, recommend, and preserve uncertainty and dissent. | Resolve objections or invent facts silently. |
| `independent-red-team` | Attack the packet's framing, completeness, confidence, and feasibility. | Reuse the synthesizer's reasoning as its own proof. |

The protocol may predeclare bounded `domain-specialist`,
`security-specialist`, `operations-specialist`, and `data-specialist` slots.
The driver binds only the slots needed for the current session, normally no
more than two. Workers may request a specialist contribution but may not invite
or bind peers themselves.

The default product posture should recommend heterogeneous role bindings while
remaining configurable. The contract requires real per-actor selection and
provenance, not any permanently hardcoded vendor roster. A host with one
provider may still run separate assignments with fresh role contexts, but that
fallback must not be presented as provider diversity.

Every advisory execution must also run inside a live-proven read-only
confinement envelope. That envelope may be a provider-native sandbox, an
executor variant, an OS/filesystem boundary, a read-only mount, or another
mechanism that proves the same invariant. A read-only Assignment classification
or a prompt saying "do not edit" is insufficient when the subprocess can still
write. Any executor/mechanism pair that fails the mutation attack is excluded.
```

## claim_b7fdbaf175e23c612a2928d7bcae52dc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-51, lines 341–350.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-54.
Source digest: b83589b01e06927acafeffdc51dbad986399747ae1ec033a15e53975e8a395b5
Target digest: b83589b01e06927acafeffdc51dbad986399747ae1ec033a15e53975e8a395b5
Shown source SHA256: b83589b01e06927acafeffdc51dbad986399747ae1ec033a15e53975e8a395b5
Shown target SHA256: b83589b01e06927acafeffdc51dbad986399747ae1ec033a15e53975e8a395b5

### Proposed decision

```json
{
  "claimId": "claim_b7fdbaf175e23c612a2928d7bcae52dc",
  "sourceUnitDigest": "b83589b01e06927acafeffdc51dbad986399747ae1ec033a15e53975e8a395b5",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "b83589b01e06927acafeffdc51dbad986399747ae1ec033a15e53975e8a395b5",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "8. Roles"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-51 (lines 341–350) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-54 (lines 371–380); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Role | Responsibility | Prohibited shortcut |
|---|---|---|
| `lead-advisor` | A separately dispatched actor that maintains working understanding, identifies material gaps, prepares questions, assesses dialogue impact, and explains the final packet. | Treat inferred intent as fact, defer every trade-off to the person, or authorize its own proposed gate. |
| `context-investigator` | Build the evidence map from permitted sources. | Search only for support for an early solution. |
| `system-shaper` | Produce a balanced system architecture. | See sibling proposals before the independent cohort settles. |
| `alternative-shaper` | Produce a credible, materially different solution class. | Add a token weak alternative merely to claim divergence. |
| `constraint-advocate` | Design from operational, security, reliability, migration, cost, and team constraints. | Turn every concern into a veto without evidence. |
| `architecture-critic` | Raise evidence-linked objections and state resolution conditions. | Argue for an actor or proposal identity rather than test claims. |
| `synthesizer` | Compare, recommend, and preserve uncertainty and dissent. | Resolve objections or invent facts silently. |
| `independent-red-team` | Attack the packet's framing, completeness, confidence, and feasibility. | Reuse the synthesizer's reasoning as its own proof. |
```

### Full target shown text

```text
| Role | Responsibility | Prohibited shortcut |
|---|---|---|
| `lead-advisor` | A separately dispatched actor that maintains working understanding, identifies material gaps, prepares questions, assesses dialogue impact, and explains the final packet. | Treat inferred intent as fact, defer every trade-off to the person, or authorize its own proposed gate. |
| `context-investigator` | Build the evidence map from permitted sources. | Search only for support for an early solution. |
| `system-shaper` | Produce a balanced system architecture. | See sibling proposals before the independent cohort settles. |
| `alternative-shaper` | Produce a credible, materially different solution class. | Add a token weak alternative merely to claim divergence. |
| `constraint-advocate` | Design from operational, security, reliability, migration, cost, and team constraints. | Turn every concern into a veto without evidence. |
| `architecture-critic` | Raise evidence-linked objections and state resolution conditions. | Argue for an actor or proposal identity rather than test claims. |
| `synthesizer` | Compare, recommend, and preserve uncertainty and dissent. | Resolve objections or invent facts silently. |
| `independent-red-team` | Attack the packet's framing, completeness, confidence, and feasibility. | Reuse the synthesizer's reasoning as its own proof. |
```

## claim_94142879a4af2136a24c88676d77dabd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-52, lines 352–356.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-55.
Source digest: 8da3cc983377e60d4b889d9528c30eb3b1a2d3a379b507467c2ad10d226c4bf9
Target digest: 8da3cc983377e60d4b889d9528c30eb3b1a2d3a379b507467c2ad10d226c4bf9
Shown source SHA256: 8da3cc983377e60d4b889d9528c30eb3b1a2d3a379b507467c2ad10d226c4bf9
Shown target SHA256: 8da3cc983377e60d4b889d9528c30eb3b1a2d3a379b507467c2ad10d226c4bf9

### Proposed decision

```json
{
  "claimId": "claim_94142879a4af2136a24c88676d77dabd",
  "sourceUnitDigest": "8da3cc983377e60d4b889d9528c30eb3b1a2d3a379b507467c2ad10d226c4bf9",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "8da3cc983377e60d4b889d9528c30eb3b1a2d3a379b507467c2ad10d226c4bf9",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "8. Roles"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-52 (lines 352–356) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-55 (lines 382–386); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The protocol may predeclare bounded `domain-specialist`,
`security-specialist`, `operations-specialist`, and `data-specialist` slots.
The driver binds only the slots needed for the current session, normally no
more than two. Workers may request a specialist contribution but may not invite
or bind peers themselves.
```

### Full target shown text

```text
The protocol may predeclare bounded `domain-specialist`,
`security-specialist`, `operations-specialist`, and `data-specialist` slots.
The driver binds only the slots needed for the current session, normally no
more than two. Workers may request a specialist contribution but may not invite
or bind peers themselves.
```

## claim_b2440bfb05454417eaf55d1b15de2557

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-53, lines 358–362.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-56.
Source digest: d4bad11f7169eafe37a201056a7a016ef61789f506ea03307ef91672200062be
Target digest: d4bad11f7169eafe37a201056a7a016ef61789f506ea03307ef91672200062be
Shown source SHA256: d4bad11f7169eafe37a201056a7a016ef61789f506ea03307ef91672200062be
Shown target SHA256: d4bad11f7169eafe37a201056a7a016ef61789f506ea03307ef91672200062be

### Proposed decision

```json
{
  "claimId": "claim_b2440bfb05454417eaf55d1b15de2557",
  "sourceUnitDigest": "d4bad11f7169eafe37a201056a7a016ef61789f506ea03307ef91672200062be",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "d4bad11f7169eafe37a201056a7a016ef61789f506ea03307ef91672200062be",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "8. Roles"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-53 (lines 358–362) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-56 (lines 388–392); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The default product posture should recommend heterogeneous role bindings while
remaining configurable. The contract requires real per-actor selection and
provenance, not any permanently hardcoded vendor roster. A host with one
provider may still run separate assignments with fresh role contexts, but that
fallback must not be presented as provider diversity.
```

### Full target shown text

```text
The default product posture should recommend heterogeneous role bindings while
remaining configurable. The contract requires real per-actor selection and
provenance, not any permanently hardcoded vendor roster. A host with one
provider may still run separate assignments with fresh role contexts, but that
fallback must not be presented as provider diversity.
```

## claim_ced0cb59a9dce337de7701a769f71641

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-54, lines 364–369.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-57.
Source digest: 8e398c166279856f5ef65828763aefaf2712b91ff3d28a39510cdf9bd77fcc3c
Target digest: 8e398c166279856f5ef65828763aefaf2712b91ff3d28a39510cdf9bd77fcc3c
Shown source SHA256: 8e398c166279856f5ef65828763aefaf2712b91ff3d28a39510cdf9bd77fcc3c
Shown target SHA256: 8e398c166279856f5ef65828763aefaf2712b91ff3d28a39510cdf9bd77fcc3c

### Proposed decision

```json
{
  "claimId": "claim_ced0cb59a9dce337de7701a769f71641",
  "sourceUnitDigest": "8e398c166279856f5ef65828763aefaf2712b91ff3d28a39510cdf9bd77fcc3c",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "8e398c166279856f5ef65828763aefaf2712b91ff3d28a39510cdf9bd77fcc3c",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "8. Roles"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-54 (lines 364–369) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-57 (lines 394–399); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Every advisory execution must also run inside a live-proven read-only
confinement envelope. That envelope may be a provider-native sandbox, an
executor variant, an OS/filesystem boundary, a read-only mount, or another
mechanism that proves the same invariant. A read-only Assignment classification
or a prompt saying "do not edit" is insufficient when the subprocess can still
write. Any executor/mechanism pair that fails the mutation attack is excluded.
```

### Full target shown text

```text
Every advisory execution must also run inside a live-proven read-only
confinement envelope. That envelope may be a provider-native sandbox, an
executor variant, an OS/filesystem boundary, a read-only mount, or another
mechanism that proves the same invariant. A read-only Assignment classification
or a prompt saying "do not edit" is insufficient when the subprocess can still
write. Any executor/mechanism pair that fails the mutation attack is excluded.
```

## claim_6a17ffc3acbeef15279ad91be7e31ee8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#9-artifact-contracts, lines 371–371.
Target: docs/platform/proposals/architecture-advisory-panel.md#9-artifact-contracts.
Source digest: a48bed0ff4a639169558ed83c20906e8ccb056376c75429e267df6334855f934
Target digest: a48bed0ff4a639169558ed83c20906e8ccb056376c75429e267df6334855f934
Shown source SHA256: 52f5716e2c7a2ca17ada2e5390adf224a0a6a2824cc0d22eef83475aceab36b5
Shown target SHA256: 52f5716e2c7a2ca17ada2e5390adf224a0a6a2824cc0d22eef83475aceab36b5

### Proposed decision

```json
{
  "claimId": "claim_6a17ffc3acbeef15279ad91be7e31ee8",
  "sourceUnitDigest": "a48bed0ff4a639169558ed83c20906e8ccb056376c75429e267df6334855f934",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "9-artifact-contracts",
  "targetUnitDigest": "a48bed0ff4a639169558ed83c20906e8ccb056376c75429e267df6334855f934",
  "targetAncestry": [
    "Architecture Advisory Panel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#9-artifact-contracts (lines 371–371) is carried at docs/platform/proposals/architecture-advisory-panel.md#9-artifact-contracts (lines 401–401); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 9. Artifact Contracts

Exact schemas remain a planning task. The minimum semantic fields below are
part of this proposal's intended shape.
```

### Full target shown text

```text
## 9. Artifact Contracts

Exact schemas remain a planning task. The minimum semantic fields below are
part of this proposal's intended shape.
```

## claim_aafb3c2c889c4baf910bc9579e6b8c7c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-55, lines 373–374.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-58.
Source digest: 1155cdd6c2d7b83fae57d0a401d820a66c08a0470ffdf8550b88406b73b7d19d
Target digest: 1155cdd6c2d7b83fae57d0a401d820a66c08a0470ffdf8550b88406b73b7d19d
Shown source SHA256: 1155cdd6c2d7b83fae57d0a401d820a66c08a0470ffdf8550b88406b73b7d19d
Shown target SHA256: 1155cdd6c2d7b83fae57d0a401d820a66c08a0470ffdf8550b88406b73b7d19d

### Proposed decision

```json
{
  "claimId": "claim_aafb3c2c889c4baf910bc9579e6b8c7c",
  "sourceUnitDigest": "1155cdd6c2d7b83fae57d0a401d820a66c08a0470ffdf8550b88406b73b7d19d",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "1155cdd6c2d7b83fae57d0a401d820a66c08a0470ffdf8550b88406b73b7d19d",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "9. Artifact Contracts"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-55 (lines 373–374) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-58 (lines 403–404); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Exact schemas remain a planning task. The minimum semantic fields below are
part of this proposal's intended shape.
```

### Full target shown text

```text
Exact schemas remain a planning task. The minimum semantic fields below are
part of this proposal's intended shape.
```

## claim_ea9feeefebe9c4157b4ad565eeac0f4a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#workingunderstanding, lines 376–376.
Target: docs/platform/proposals/architecture-advisory-panel.md#workingunderstanding.
Source digest: ae0cfefbdf3d8ac039a88c7208a86b9f6194adb202b3ff6bbfc6d664a06d55f4
Target digest: ae0cfefbdf3d8ac039a88c7208a86b9f6194adb202b3ff6bbfc6d664a06d55f4
Shown source SHA256: 494cbe345db9f84c3217a0c8e7efb89d928e6213c35c89c361729fa458ec4b33
Shown target SHA256: 494cbe345db9f84c3217a0c8e7efb89d928e6213c35c89c361729fa458ec4b33

### Proposed decision

```json
{
  "claimId": "claim_ea9feeefebe9c4157b4ad565eeac0f4a",
  "sourceUnitDigest": "ae0cfefbdf3d8ac039a88c7208a86b9f6194adb202b3ff6bbfc6d664a06d55f4",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "workingunderstanding",
  "targetUnitDigest": "ae0cfefbdf3d8ac039a88c7208a86b9f6194adb202b3ff6bbfc6d664a06d55f4",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "9. Artifact Contracts"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#workingunderstanding (lines 376–376) is carried at docs/platform/proposals/architecture-advisory-panel.md#workingunderstanding (lines 406–406); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
### `WorkingUnderstanding`

```yaml
kind: WorkingUnderstanding
revision: 1
userIntent: {}
problemAsUnderstood: ""
desiredOutcome: ""
stakeholders: []
knownConstraints: []
assumptions:
  - statement: ""
    confidence: low | medium | high
    basisRefs: []
unknowns: []
decisionNeeded: ""
understandingConfidence: low | medium | high
```
````

### Full target shown text

````text
### `WorkingUnderstanding`

```yaml
kind: WorkingUnderstanding
revision: 1
userIntent: {}
problemAsUnderstood: ""
desiredOutcome: ""
stakeholders: []
knownConstraints: []
assumptions:
  - statement: ""
    confidence: low | medium | high
    basisRefs: []
unknowns: []
decisionNeeded: ""
understandingConfidence: low | medium | high
```
````

## claim_85bb51df2d28e2d7e0d861c0e5efff0e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-56, lines 378–393.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-59.
Source digest: 0ff699b2c814e45af70c0d21596643604bd722b0e8d7196082926eb257f85212
Target digest: 0ff699b2c814e45af70c0d21596643604bd722b0e8d7196082926eb257f85212
Shown source SHA256: 0ff699b2c814e45af70c0d21596643604bd722b0e8d7196082926eb257f85212
Shown target SHA256: 0ff699b2c814e45af70c0d21596643604bd722b0e8d7196082926eb257f85212

### Proposed decision

```json
{
  "claimId": "claim_85bb51df2d28e2d7e0d861c0e5efff0e",
  "sourceUnitDigest": "0ff699b2c814e45af70c0d21596643604bd722b0e8d7196082926eb257f85212",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "0ff699b2c814e45af70c0d21596643604bd722b0e8d7196082926eb257f85212",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "9. Artifact Contracts",
    "`WorkingUnderstanding`"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-56 (lines 378–393) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-59 (lines 408–423); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
kind: WorkingUnderstanding
revision: 1
userIntent: {}
problemAsUnderstood: ""
desiredOutcome: ""
stakeholders: []
knownConstraints: []
assumptions:
  - statement: ""
    confidence: low | medium | high
    basisRefs: []
unknowns: []
decisionNeeded: ""
understandingConfidence: low | medium | high
```
````

### Full target shown text

````text
```yaml
kind: WorkingUnderstanding
revision: 1
userIntent: {}
problemAsUnderstood: ""
desiredOutcome: ""
stakeholders: []
knownConstraints: []
assumptions:
  - statement: ""
    confidence: low | medium | high
    basisRefs: []
unknowns: []
decisionNeeded: ""
understandingConfidence: low | medium | high
```
````

## claim_46505137d4b32ac8f5eb49adb679099e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#evidencemap, lines 395–395.
Target: docs/platform/proposals/architecture-advisory-panel.md#evidencemap.
Source digest: 64f50e69e1c76fa218e56e26b08bc6bff0702b4f8cb6e6f800c8704f3a2e5ca2
Target digest: 64f50e69e1c76fa218e56e26b08bc6bff0702b4f8cb6e6f800c8704f3a2e5ca2
Shown source SHA256: c92b4b39a68b7b9bd8904991f657b92a035e7c61e487e3b23f393dbe56ad4084
Shown target SHA256: c92b4b39a68b7b9bd8904991f657b92a035e7c61e487e3b23f393dbe56ad4084

### Proposed decision

```json
{
  "claimId": "claim_46505137d4b32ac8f5eb49adb679099e",
  "sourceUnitDigest": "64f50e69e1c76fa218e56e26b08bc6bff0702b4f8cb6e6f800c8704f3a2e5ca2",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "evidencemap",
  "targetUnitDigest": "64f50e69e1c76fa218e56e26b08bc6bff0702b4f8cb6e6f800c8704f3a2e5ca2",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "9. Artifact Contracts"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#evidencemap (lines 395–395) is carried at docs/platform/proposals/architecture-advisory-panel.md#evidencemap (lines 425–425); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
### `EvidenceMap`

```yaml
kind: EvidenceMap
facts:
  - claim: ""
    evidenceRefs: []
constraints:
  - statement: ""
    authorityRef: ""
inferences:
  - statement: ""
    evidenceRefs: []
    confidence: low | medium | high
unknowns:
  - question: ""
    materiality: ""
    resolvableBy: investigation | specialist | user
```
````

### Full target shown text

````text
### `EvidenceMap`

```yaml
kind: EvidenceMap
facts:
  - claim: ""
    evidenceRefs: []
constraints:
  - statement: ""
    authorityRef: ""
inferences:
  - statement: ""
    evidenceRefs: []
    confidence: low | medium | high
unknowns:
  - question: ""
    materiality: ""
    resolvableBy: investigation | specialist | user
```
````

## claim_40474186eaaf765427a00c5b42cda235

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-57, lines 397–413.
Target: docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-60.
Source digest: 8339941faca2b92929cb87e9fdf9e5a4c4a306bd24fbfa905587447c39a189ca
Target digest: 8339941faca2b92929cb87e9fdf9e5a4c4a306bd24fbfa905587447c39a189ca
Shown source SHA256: 8339941faca2b92929cb87e9fdf9e5a4c4a306bd24fbfa905587447c39a189ca
Shown target SHA256: 8339941faca2b92929cb87e9fdf9e5a4c4a306bd24fbfa905587447c39a189ca

### Proposed decision

```json
{
  "claimId": "claim_40474186eaaf765427a00c5b42cda235",
  "sourceUnitDigest": "8339941faca2b92929cb87e9fdf9e5a4c4a306bd24fbfa905587447c39a189ca",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "8339941faca2b92929cb87e9fdf9e5a4c4a306bd24fbfa905587447c39a189ca",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "9. Artifact Contracts",
    "`EvidenceMap`"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source unheaded-block docs/architect/proposals/architecture-advisory-panel.md#unheaded-block-57 (lines 397–413) is carried at docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-60 (lines 427–443); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
kind: EvidenceMap
facts:
  - claim: ""
    evidenceRefs: []
constraints:
  - statement: ""
    authorityRef: ""
inferences:
  - statement: ""
    evidenceRefs: []
    confidence: low | medium | high
unknowns:
  - question: ""
    materiality: ""
    resolvableBy: investigation | specialist | user
```
````

### Full target shown text

````text
```yaml
kind: EvidenceMap
facts:
  - claim: ""
    evidenceRefs: []
constraints:
  - statement: ""
    authorityRef: ""
inferences:
  - statement: ""
    evidenceRefs: []
    confidence: low | medium | high
unknowns:
  - question: ""
    materiality: ""
    resolvableBy: investigation | specialist | user
```
````

## claim_72a58db612cbcb4662bdc0f171890c7f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/architecture-advisory-panel.md#decisionrequest, lines 415–415.
Target: docs/platform/proposals/architecture-advisory-panel.md#decisionrequest.
Source digest: dd8e7b648b2e9252090f5345f2c085df8c35bcf884c0024abb41fa9284563a95
Target digest: dd8e7b648b2e9252090f5345f2c085df8c35bcf884c0024abb41fa9284563a95
Shown source SHA256: ba14c84d7ee596d9b24eedd6f5156ae074af61433fc02fed6d8530e13f06ce1b
Shown target SHA256: ba14c84d7ee596d9b24eedd6f5156ae074af61433fc02fed6d8530e13f06ce1b

### Proposed decision

```json
{
  "claimId": "claim_72a58db612cbcb4662bdc0f171890c7f",
  "sourceUnitDigest": "dd8e7b648b2e9252090f5345f2c085df8c35bcf884c0024abb41fa9284563a95",
  "targetOwner": "docs/platform/proposals/architecture-advisory-panel.md",
  "targetAnchor": "decisionrequest",
  "targetUnitDigest": "dd8e7b648b2e9252090f5345f2c085df8c35bcf884c0024abb41fa9284563a95",
  "targetAncestry": [
    "Architecture Advisory Panel",
    "9. Artifact Contracts"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive: surviving workflow use case protects intent under A17/A19. Keep map proposal, including stale Not started header; do not claim the old protocol was retained. Evidence: core/workflows/architecture-advisory.yaml:1–6,24–45 implements framing/panel/critique/synthesis; core/skills/fgos-architecture-panel/SKILL.md is current. Commit 2180b4e72 removed the original architecture-advisory-panel-v1.yaml. Source lines 3–7 still says Not started. Complete source heading docs/architect/proposals/architecture-advisory-panel.md#decisionrequest (lines 415–415) is carried at docs/platform/proposals/architecture-advisory-panel.md#decisionrequest (lines 445–445); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
### `DecisionRequest`

```yaml
kind: DecisionRequest
currentUnderstanding: ""
workAlreadyDone: []
materialGap: ""
panelRecommendation: ""
questions:
  - question: ""
    whyOnlyUserCanAnswer: ""
    impactOnRecommendation: ""
    panelDefaultIfUnanswered: ""
```
````

### Full target shown text

````text
### `DecisionRequest`

```yaml
kind: DecisionRequest
currentUnderstanding: ""
workAlreadyDone: []
materialGap: ""
panelRecommendation: ""
questions:
  - question: ""
    whyOnlyUserCanAnswer: ""
    impactOnRecommendation: ""
    panelDefaultIfUnanswered: ""
```
````
