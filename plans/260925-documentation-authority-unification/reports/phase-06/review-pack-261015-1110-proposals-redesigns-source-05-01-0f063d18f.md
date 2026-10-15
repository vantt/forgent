# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-05-readme.json
Original shard SHA256: 739b798b26216d562b2f1914d094a6f2b7b5e4e97055c0306748d43af59a5103
Source file: docs/architect/domainization/README.md
Part 1/1; entries: **66**. Source-file group 5/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (4): `claim_a425b576168290434c2e825ea049a6c7`, `claim_a65f6b3bb2c15aef0e2b9f212f68545e`, `claim_1353216031d7519ce0bb17d0b9772a6c`, `claim_c7fbfa80a3293fabc0cdb5707b132a17`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 18; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_a425b576168290434c2e825ea049a6c7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/domainization/README.md#fgos-domainization-architecture, lines 1–1.
Target: docs/platform/domainization/architecture/domainization.md#fgos-domainization-architecture.
Source digest: 9d7cc7951f09a74352788839817afb6359f6e89d8ab5f9b11e96fa0dc646b2db
Target digest: 9bb121feab75e0ced717554459cdef36e2d7c633e521d520776097bde350862e
Shown source SHA256: 8a3a67f595379151dcf55bbf6da88b87578d33f98a9cf15817b031664e159d91
Shown target SHA256: 5b578215bd0b88340d28fb857dbf13ed0e8ad3fcdc4a37228a0c6bbd11f53e9e

### Proposed decision

```json
{
  "claimId": "claim_a425b576168290434c2e825ea049a6c7",
  "sourceUnitDigest": "9d7cc7951f09a74352788839817afb6359f6e89d8ab5f9b11e96fa0dc646b2db",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "fgos-domainization-architecture",
  "targetUnitDigest": "9bb121feab75e0ced717554459cdef36e2d7c633e521d520776097bde350862e",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#fgos-domainization-architecture (lines 1–1) is carried at docs/platform/domainization/architecture/domainization.md#fgos-domainization-architecture (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
# fgOS Domainization Architecture

Document type: Architecture advisory
Design status: Discussion / Visionary advisory
Implementation: Partial
Last reviewed: 2026-09-03
Canonical for: domainization direction only; owning contracts still live in specs, domain files, and engine contracts
Related: [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md), [System Overview](../../specs/system-overview.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), [Work-State Spec](../../specs/work-state.md)
```

### Full target shown text

````text
# fgOS Domainization Architecture

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/domainization/README.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 10bba1a86978a08564cac0ca623bc4ed0326b987
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/domainization/README.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Retain mapped architecture; preserve advisory and partial status verbatim. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../../architect/domainization/README.md).


Document type: Architecture advisory
Design status: Discussion / Visionary advisory
Implementation: Partial
Last reviewed: 2026-09-03
Canonical for: domainization direction only; owning contracts still live in specs, domain files, and engine contracts
Related: [Component Boundary Advisory](../../../architect/component-boundary/component-boundary-advisory.md), [System Overview](../../../specs/system-overview.md), [Work Item Lifecycle Vision](../../../work-item-lifecycle-vision.md), [Work-State Spec](../../../specs/work-state.md)
````

## claim_a65f6b3bb2c15aef0e2b9f212f68545e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/domainization/README.md#unheaded-block-1, lines 3–8.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-4.
Source digest: 1487a6bbd263933fe101710c8c1b51d99e662d5b70b787dc7877c868c8883e4f
Target digest: 516282d7224eb21eb086442d86425f77135258878fe288e77ff3071b4faf0d84
Shown source SHA256: 1487a6bbd263933fe101710c8c1b51d99e662d5b70b787dc7877c868c8883e4f
Shown target SHA256: 516282d7224eb21eb086442d86425f77135258878fe288e77ff3071b4faf0d84

### Proposed decision

```json
{
  "claimId": "claim_a65f6b3bb2c15aef0e2b9f212f68545e",
  "sourceUnitDigest": "1487a6bbd263933fe101710c8c1b51d99e662d5b70b787dc7877c868c8883e4f",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "516282d7224eb21eb086442d86425f77135258878fe288e77ff3071b4faf0d84",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-1 (lines 3–8) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-4 (lines 27–32); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Document type: Architecture advisory
Design status: Discussion / Visionary advisory
Implementation: Partial
Last reviewed: 2026-09-03
Canonical for: domainization direction only; owning contracts still live in specs, domain files, and engine contracts
Related: [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md), [System Overview](../../specs/system-overview.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), [Work-State Spec](../../specs/work-state.md)
```

### Full target shown text

```text
Document type: Architecture advisory
Design status: Discussion / Visionary advisory
Implementation: Partial
Last reviewed: 2026-09-03
Canonical for: domainization direction only; owning contracts still live in specs, domain files, and engine contracts
Related: [Component Boundary Advisory](../../../architect/component-boundary/component-boundary-advisory.md), [System Overview](../../../specs/system-overview.md), [Work Item Lifecycle Vision](../../../work-item-lifecycle-vision.md), [Work-State Spec](../../../specs/work-state.md)
```

## claim_1353216031d7519ce0bb17d0b9772a6c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/domainization/README.md#1-purpose, lines 10–10.
Target: docs/platform/domainization/architecture/domainization.md#1-purpose.
Source digest: f7af919b7b59dee4322b27f2bc543131cfc3a57928f4d94bef07046cc097bf26
Target digest: ea88c12c80b9d502f4030eb168312e3190beeb929ffadc2f1b083af5e0a5a09e
Shown source SHA256: 0fb29b84c40f13e26785cea0a46a33559ede7a8c39c6f8e2b586fc8b0c9a27a3
Shown target SHA256: 034e8f03850763ff2b7c6aed2e74ba35855f5f9c4816461e0620538306d542bd

### Proposed decision

```json
{
  "claimId": "claim_1353216031d7519ce0bb17d0b9772a6c",
  "sourceUnitDigest": "f7af919b7b59dee4322b27f2bc543131cfc3a57928f4d94bef07046cc097bf26",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "1-purpose",
  "targetUnitDigest": "ea88c12c80b9d502f4030eb168312e3190beeb929ffadc2f1b083af5e0a5a09e",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#1-purpose (lines 10–10) is carried at docs/platform/domainization/architecture/domainization.md#1-purpose (lines 34–34); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 1. Purpose

This document records the architecture direction for turning fgOS into a
multi-domain platform without letting domain-specific behavior leak into the
foundation.

Domainization answers a narrower question than the whole-system component map:

```txt
What belongs to core foundation?
What belongs to one domain?
How does core discover and govern domain-provided material?
Which files are authoring sources, and which files are render/runtime targets?
```

It does not define every fgOS component. For the system-level component and
authority map, read [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md).
````

### Full target shown text

````text
## 1. Purpose

This document records the architecture direction for turning fgOS into a
multi-domain platform without letting domain-specific behavior leak into the
foundation.

Domainization answers a narrower question than the whole-system component map:

```txt
What belongs to core foundation?
What belongs to one domain?
How does core discover and govern domain-provided material?
Which files are authoring sources, and which files are render/runtime targets?
```

It does not define every fgOS component. For the system-level component and
authority map, read [Component Boundary Advisory](../../../architect/component-boundary/component-boundary-advisory.md).
````

## claim_478b542735d3495bea9ad08001909ed9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-2, lines 12–14.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-5.
Source digest: eb0b57d2fd7792dbca4d91c2f7b4a2ff2feee26bec00bc123fee57bc53fe66fb
Target digest: eb0b57d2fd7792dbca4d91c2f7b4a2ff2feee26bec00bc123fee57bc53fe66fb
Shown source SHA256: eb0b57d2fd7792dbca4d91c2f7b4a2ff2feee26bec00bc123fee57bc53fe66fb
Shown target SHA256: eb0b57d2fd7792dbca4d91c2f7b4a2ff2feee26bec00bc123fee57bc53fe66fb

### Proposed decision

```json
{
  "claimId": "claim_478b542735d3495bea9ad08001909ed9",
  "sourceUnitDigest": "eb0b57d2fd7792dbca4d91c2f7b4a2ff2feee26bec00bc123fee57bc53fe66fb",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "eb0b57d2fd7792dbca4d91c2f7b4a2ff2feee26bec00bc123fee57bc53fe66fb",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "1. Purpose"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-2 (lines 12–14) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-5 (lines 36–38); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This document records the architecture direction for turning fgOS into a
multi-domain platform without letting domain-specific behavior leak into the
foundation.
```

### Full target shown text

```text
This document records the architecture direction for turning fgOS into a
multi-domain platform without letting domain-specific behavior leak into the
foundation.
```

## claim_79d20ebdc9002223287d06733fe818bd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-3, lines 16–16.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-6.
Source digest: 50836ab172ff994940bb9961b5b7b8f6e5027eb5d201000edfd2b9f7db647c5c
Target digest: 50836ab172ff994940bb9961b5b7b8f6e5027eb5d201000edfd2b9f7db647c5c
Shown source SHA256: 50836ab172ff994940bb9961b5b7b8f6e5027eb5d201000edfd2b9f7db647c5c
Shown target SHA256: 50836ab172ff994940bb9961b5b7b8f6e5027eb5d201000edfd2b9f7db647c5c

### Proposed decision

```json
{
  "claimId": "claim_79d20ebdc9002223287d06733fe818bd",
  "sourceUnitDigest": "50836ab172ff994940bb9961b5b7b8f6e5027eb5d201000edfd2b9f7db647c5c",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "50836ab172ff994940bb9961b5b7b8f6e5027eb5d201000edfd2b9f7db647c5c",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "1. Purpose"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-3 (lines 16–16) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-6 (lines 40–40); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Domainization answers a narrower question than the whole-system component map:
```

### Full target shown text

```text
Domainization answers a narrower question than the whole-system component map:
```

## claim_1b1a25172bfc415786b2985b44c4bf36

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-4, lines 18–23.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-7.
Source digest: 898759e878265c59cce46f30f6a30f9777494dbeb8ac6047f04641870330b5c1
Target digest: 898759e878265c59cce46f30f6a30f9777494dbeb8ac6047f04641870330b5c1
Shown source SHA256: 898759e878265c59cce46f30f6a30f9777494dbeb8ac6047f04641870330b5c1
Shown target SHA256: 898759e878265c59cce46f30f6a30f9777494dbeb8ac6047f04641870330b5c1

### Proposed decision

```json
{
  "claimId": "claim_1b1a25172bfc415786b2985b44c4bf36",
  "sourceUnitDigest": "898759e878265c59cce46f30f6a30f9777494dbeb8ac6047f04641870330b5c1",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "898759e878265c59cce46f30f6a30f9777494dbeb8ac6047f04641870330b5c1",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "1. Purpose"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-4 (lines 18–23) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-7 (lines 42–47); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
What belongs to core foundation?
What belongs to one domain?
How does core discover and govern domain-provided material?
Which files are authoring sources, and which files are render/runtime targets?
```
````

### Full target shown text

````text
```txt
What belongs to core foundation?
What belongs to one domain?
How does core discover and govern domain-provided material?
Which files are authoring sources, and which files are render/runtime targets?
```
````

## claim_c7fbfa80a3293fabc0cdb5707b132a17

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/domainization/README.md#unheaded-block-5, lines 25–26.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-8.
Source digest: c064f6155b327bd1b93f1c8ae839ff50a5fc126243864874958e5bab1a88b571
Target digest: 73eb5cd7cac55dc1c0ee15ccb8db94b0ddf1d0260f4332f9055d140b7d106c88
Shown source SHA256: c064f6155b327bd1b93f1c8ae839ff50a5fc126243864874958e5bab1a88b571
Shown target SHA256: 73eb5cd7cac55dc1c0ee15ccb8db94b0ddf1d0260f4332f9055d140b7d106c88

### Proposed decision

```json
{
  "claimId": "claim_c7fbfa80a3293fabc0cdb5707b132a17",
  "sourceUnitDigest": "c064f6155b327bd1b93f1c8ae839ff50a5fc126243864874958e5bab1a88b571",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "73eb5cd7cac55dc1c0ee15ccb8db94b0ddf1d0260f4332f9055d140b7d106c88",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "1. Purpose"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-5 (lines 25–26) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-8 (lines 49–50); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It does not define every fgOS component. For the system-level component and
authority map, read [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md).
```

### Full target shown text

```text
It does not define every fgOS component. For the system-level component and
authority map, read [Component Boundary Advisory](../../../architect/component-boundary/component-boundary-advisory.md).
```

## claim_a191d9efd716e4e29890c907f1f11c1e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#2-boundary-rule, lines 28–28.
Target: docs/platform/domainization/architecture/domainization.md#2-boundary-rule.
Source digest: f218cb2ba4ad4d7ce222e99e4b3cfe37e20a61f7a4e8378f0cb87c143956f8f2
Target digest: f218cb2ba4ad4d7ce222e99e4b3cfe37e20a61f7a4e8378f0cb87c143956f8f2
Shown source SHA256: 7fae49f2ca37e0308f4b6b4a60ff988ec8958aaac47a07022a25417134381599
Shown target SHA256: 7fae49f2ca37e0308f4b6b4a60ff988ec8958aaac47a07022a25417134381599

### Proposed decision

```json
{
  "claimId": "claim_a191d9efd716e4e29890c907f1f11c1e",
  "sourceUnitDigest": "f218cb2ba4ad4d7ce222e99e4b3cfe37e20a61f7a4e8378f0cb87c143956f8f2",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "2-boundary-rule",
  "targetUnitDigest": "f218cb2ba4ad4d7ce222e99e4b3cfe37e20a61f7a4e8378f0cb87c143956f8f2",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#2-boundary-rule (lines 28–28) is carried at docs/platform/domainization/architecture/domainization.md#2-boundary-rule (lines 52–52); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 2. Boundary Rule

The core rule is:

```txt
core = closed port, shared by every domain
domains/<name>/ = open adapter, owned by one domain
```

Put a concern in core only when it has the same meaning and is read the same
way across every domain. Put domain-local behavior in `domains/<name>/`, then
let core consume it through a resolver, loader, or explicit contract.

Source placement is not authority. A domain file may be consumed by core, and a
core resolver may normalize domain data, but domain-owned vocabulary and
workflow declarations remain domain-owned.
````

### Full target shown text

````text
## 2. Boundary Rule

The core rule is:

```txt
core = closed port, shared by every domain
domains/<name>/ = open adapter, owned by one domain
```

Put a concern in core only when it has the same meaning and is read the same
way across every domain. Put domain-local behavior in `domains/<name>/`, then
let core consume it through a resolver, loader, or explicit contract.

Source placement is not authority. A domain file may be consumed by core, and a
core resolver may normalize domain data, but domain-owned vocabulary and
workflow declarations remain domain-owned.
````

## claim_600360d534a88b4edc1d03fe07e592a5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-6, lines 30–35.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-9.
Source digest: b88ea24ecdf3a80f1f6f235941acd4d419c108efb7b7a205bfc4a81827f7071c
Target digest: b88ea24ecdf3a80f1f6f235941acd4d419c108efb7b7a205bfc4a81827f7071c
Shown source SHA256: b88ea24ecdf3a80f1f6f235941acd4d419c108efb7b7a205bfc4a81827f7071c
Shown target SHA256: b88ea24ecdf3a80f1f6f235941acd4d419c108efb7b7a205bfc4a81827f7071c

### Proposed decision

```json
{
  "claimId": "claim_600360d534a88b4edc1d03fe07e592a5",
  "sourceUnitDigest": "b88ea24ecdf3a80f1f6f235941acd4d419c108efb7b7a205bfc4a81827f7071c",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "b88ea24ecdf3a80f1f6f235941acd4d419c108efb7b7a205bfc4a81827f7071c",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "2. Boundary Rule"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-6 (lines 30–35) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-9 (lines 54–59); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
The core rule is:

```txt
core = closed port, shared by every domain
domains/<name>/ = open adapter, owned by one domain
```
````

### Full target shown text

````text
The core rule is:

```txt
core = closed port, shared by every domain
domains/<name>/ = open adapter, owned by one domain
```
````

## claim_18bda7bc17b0a6bfc0fa89b056b0a710

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-7, lines 37–39.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-10.
Source digest: 63a555f800ce94a7e7546802fe849dd9b077809dcc0bf2fe73f2ef414c81ca4a
Target digest: 63a555f800ce94a7e7546802fe849dd9b077809dcc0bf2fe73f2ef414c81ca4a
Shown source SHA256: 63a555f800ce94a7e7546802fe849dd9b077809dcc0bf2fe73f2ef414c81ca4a
Shown target SHA256: 63a555f800ce94a7e7546802fe849dd9b077809dcc0bf2fe73f2ef414c81ca4a

### Proposed decision

```json
{
  "claimId": "claim_18bda7bc17b0a6bfc0fa89b056b0a710",
  "sourceUnitDigest": "63a555f800ce94a7e7546802fe849dd9b077809dcc0bf2fe73f2ef414c81ca4a",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "63a555f800ce94a7e7546802fe849dd9b077809dcc0bf2fe73f2ef414c81ca4a",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "2. Boundary Rule"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-7 (lines 37–39) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-10 (lines 61–63); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Put a concern in core only when it has the same meaning and is read the same
way across every domain. Put domain-local behavior in `domains/<name>/`, then
let core consume it through a resolver, loader, or explicit contract.
```

### Full target shown text

```text
Put a concern in core only when it has the same meaning and is read the same
way across every domain. Put domain-local behavior in `domains/<name>/`, then
let core consume it through a resolver, loader, or explicit contract.
```

## claim_ce8572265550ef862ca319e28cf6e8b6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-8, lines 41–43.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-11.
Source digest: bfbfd8255048573ed973ca8396ff9eca3c435d04ad73e757ff5669d992cb82d9
Target digest: bfbfd8255048573ed973ca8396ff9eca3c435d04ad73e757ff5669d992cb82d9
Shown source SHA256: bfbfd8255048573ed973ca8396ff9eca3c435d04ad73e757ff5669d992cb82d9
Shown target SHA256: bfbfd8255048573ed973ca8396ff9eca3c435d04ad73e757ff5669d992cb82d9

### Proposed decision

```json
{
  "claimId": "claim_ce8572265550ef862ca319e28cf6e8b6",
  "sourceUnitDigest": "bfbfd8255048573ed973ca8396ff9eca3c435d04ad73e757ff5669d992cb82d9",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "bfbfd8255048573ed973ca8396ff9eca3c435d04ad73e757ff5669d992cb82d9",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "2. Boundary Rule"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-8 (lines 41–43) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-11 (lines 65–67); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Source placement is not authority. A domain file may be consumed by core, and a
core resolver may normalize domain data, but domain-owned vocabulary and
workflow declarations remain domain-owned.
```

### Full target shown text

```text
Source placement is not authority. A domain file may be consumed by core, and a
core resolver may normalize domain data, but domain-owned vocabulary and
workflow declarations remain domain-owned.
```

## claim_b163c9d80da6ec2bbdb6f44cfba82da5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#3-target-domain-shape, lines 45–45.
Target: docs/platform/domainization/architecture/domainization.md#3-target-domain-shape.
Source digest: dddb99eb1303314534f0d6c912798816c7fe0750f4275c3678f3b732f40d0d2c
Target digest: dddb99eb1303314534f0d6c912798816c7fe0750f4275c3678f3b732f40d0d2c
Shown source SHA256: 65e68b45e2dc87911baa85daeccb6594329e064a243c19fe6ceeb212fa8cdaa3
Shown target SHA256: 65e68b45e2dc87911baa85daeccb6594329e064a243c19fe6ceeb212fa8cdaa3

### Proposed decision

```json
{
  "claimId": "claim_b163c9d80da6ec2bbdb6f44cfba82da5",
  "sourceUnitDigest": "dddb99eb1303314534f0d6c912798816c7fe0750f4275c3678f3b732f40d0d2c",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "3-target-domain-shape",
  "targetUnitDigest": "dddb99eb1303314534f0d6c912798816c7fe0750f4275c3678f3b732f40d0d2c",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#3-target-domain-shape (lines 45–45) is carried at docs/platform/domainization/architecture/domainization.md#3-target-domain-shape (lines 69–69); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 3. Target Domain Shape

A domain is a self-contained authoring unit:

```txt
domains/<name>/
  manifest.yaml
  workflows/*.yaml
  skills/*.md
  task-specs/*.md
  specs/*.md
  knowledge/*.md
  agents/*.yaml
  AGENTS.md
```

The intended domain folder is YAML plus Markdown/prose. Domain authors should
not need to write JavaScript to declare a domain. Core code owns scanning,
parsing, validation, normalization, and runtime projection.
````

### Full target shown text

````text
## 3. Target Domain Shape

A domain is a self-contained authoring unit:

```txt
domains/<name>/
  manifest.yaml
  workflows/*.yaml
  skills/*.md
  task-specs/*.md
  specs/*.md
  knowledge/*.md
  agents/*.yaml
  AGENTS.md
```

The intended domain folder is YAML plus Markdown/prose. Domain authors should
not need to write JavaScript to declare a domain. Core code owns scanning,
parsing, validation, normalization, and runtime projection.
````

## claim_bdf765116c0f0a6c49fdaf6bc7dd7f2f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-9, lines 47–47.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-12.
Source digest: fee7929ef3abe1f0f7a1b9d50372c738fb18a36aa97a479d0cd1e743a12e4794
Target digest: fee7929ef3abe1f0f7a1b9d50372c738fb18a36aa97a479d0cd1e743a12e4794
Shown source SHA256: fee7929ef3abe1f0f7a1b9d50372c738fb18a36aa97a479d0cd1e743a12e4794
Shown target SHA256: fee7929ef3abe1f0f7a1b9d50372c738fb18a36aa97a479d0cd1e743a12e4794

### Proposed decision

```json
{
  "claimId": "claim_bdf765116c0f0a6c49fdaf6bc7dd7f2f",
  "sourceUnitDigest": "fee7929ef3abe1f0f7a1b9d50372c738fb18a36aa97a479d0cd1e743a12e4794",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "fee7929ef3abe1f0f7a1b9d50372c738fb18a36aa97a479d0cd1e743a12e4794",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "3. Target Domain Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-9 (lines 47–47) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-12 (lines 71–71); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
A domain is a self-contained authoring unit:
```

### Full target shown text

```text
A domain is a self-contained authoring unit:
```

## claim_1bf64537afa326a8be5bbdd31daf365a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-10, lines 49–59.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-13.
Source digest: f1ec6da9b0446126c47e5bae9f21f9561bef92a47e68eed0153091f78595d5e1
Target digest: f1ec6da9b0446126c47e5bae9f21f9561bef92a47e68eed0153091f78595d5e1
Shown source SHA256: f1ec6da9b0446126c47e5bae9f21f9561bef92a47e68eed0153091f78595d5e1
Shown target SHA256: f1ec6da9b0446126c47e5bae9f21f9561bef92a47e68eed0153091f78595d5e1

### Proposed decision

```json
{
  "claimId": "claim_1bf64537afa326a8be5bbdd31daf365a",
  "sourceUnitDigest": "f1ec6da9b0446126c47e5bae9f21f9561bef92a47e68eed0153091f78595d5e1",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "f1ec6da9b0446126c47e5bae9f21f9561bef92a47e68eed0153091f78595d5e1",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "3. Target Domain Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-10 (lines 49–59) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-13 (lines 73–83); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
domains/<name>/
  manifest.yaml
  workflows/*.yaml
  skills/*.md
  task-specs/*.md
  specs/*.md
  knowledge/*.md
  agents/*.yaml
  AGENTS.md
```
````

### Full target shown text

````text
```txt
domains/<name>/
  manifest.yaml
  workflows/*.yaml
  skills/*.md
  task-specs/*.md
  specs/*.md
  knowledge/*.md
  agents/*.yaml
  AGENTS.md
```
````

## claim_bc1d6d49978688fdcb43a40977b47ff8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-11, lines 61–63.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-14.
Source digest: b451e8c72257785c366393b1eaac8495f24ce3156cd43545459eca7b7f79a975
Target digest: b451e8c72257785c366393b1eaac8495f24ce3156cd43545459eca7b7f79a975
Shown source SHA256: b451e8c72257785c366393b1eaac8495f24ce3156cd43545459eca7b7f79a975
Shown target SHA256: b451e8c72257785c366393b1eaac8495f24ce3156cd43545459eca7b7f79a975

### Proposed decision

```json
{
  "claimId": "claim_bc1d6d49978688fdcb43a40977b47ff8",
  "sourceUnitDigest": "b451e8c72257785c366393b1eaac8495f24ce3156cd43545459eca7b7f79a975",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "b451e8c72257785c366393b1eaac8495f24ce3156cd43545459eca7b7f79a975",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "3. Target Domain Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-11 (lines 61–63) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-14 (lines 85–87); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The intended domain folder is YAML plus Markdown/prose. Domain authors should
not need to write JavaScript to declare a domain. Core code owns scanning,
parsing, validation, normalization, and runtime projection.
```

### Full target shown text

```text
The intended domain folder is YAML plus Markdown/prose. Domain authors should
not need to write JavaScript to declare a domain. Core code owns scanning,
parsing, validation, normalization, and runtime projection.
```

## claim_6f4225f67c5667bb6a9e6a9cc91ea279

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#4-concern-placement, lines 65–65.
Target: docs/platform/domainization/architecture/domainization.md#4-concern-placement.
Source digest: 34c3a8318b70907220b50f0c5a8e616da9d3dbf2795d43ee33651335da5b24d2
Target digest: 34c3a8318b70907220b50f0c5a8e616da9d3dbf2795d43ee33651335da5b24d2
Shown source SHA256: 9167b8715de031ca1cc55521c68bbf24d8067f645440a8d7048c4cef9f824fd7
Shown target SHA256: 9167b8715de031ca1cc55521c68bbf24d8067f645440a8d7048c4cef9f824fd7

### Proposed decision

```json
{
  "claimId": "claim_6f4225f67c5667bb6a9e6a9cc91ea279",
  "sourceUnitDigest": "34c3a8318b70907220b50f0c5a8e616da9d3dbf2795d43ee33651335da5b24d2",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "4-concern-placement",
  "targetUnitDigest": "34c3a8318b70907220b50f0c5a8e616da9d3dbf2795d43ee33651335da5b24d2",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#4-concern-placement (lines 65–65) is carried at docs/platform/domainization/architecture/domainization.md#4-concern-placement (lines 89–89); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 4. Concern Placement

| Concern | Core Placement | Domain Placement | Boundary |
|---|---|---|---|
| Work store | One shared fgOS store/event log | Domain identity and domain-local fields | Domains do not get separate fgOS installs or stores. |
| Work fields | Top-level work schema and closed editable field set | `domainFields.<domain>.*` | Top-level fields are platform ports; domain fields are adapter territory. |
| Workflow engine | Domain/workflow resolver and normalized runtime shape | `manifest.yaml` and `workflows/*.yaml` | Core loads and validates; domains declare vocabulary and legal operations. |
| Task-specs | `core/task-specs/` for domain-agnostic skills | `domains/<name>/task-specs/` | Task-spec is executable contract by task kind, not work-item field schema. |
| Skills | `core/skills/` for shared skills | `domains/<name>/skills/` | Authoring source is split; generated skill trees remain render targets. |
| Knowledge | Platform-wide decisions and shared knowledge registries | `domains/<name>/knowledge/` | Knowledge is curated expertise, distinct from raw feature context. |
| Context | `docs/history/<feature>/` | Same shared context location | Context is raw, feature-scoped material; do not tag it as domain knowledge. |
| Doctrine | Root `AGENTS.md` for domain-agnostic doctrine | `domains/<name>/AGENTS.md` | Routing reads domain doctrine after domain resolution. |
| Agent types | `core/agents/` for domain-agnostic agent types | `domains/<name>/agents/` | Location records authorship/flavor, not an execution-use restriction. |
| External render targets | `.agents/skills/`, `.claude/skills/`, `.claude/agents/`, plugin skill trees | None | Render targets keep host-facing shape stable while authoring sources move. |
```

### Full target shown text

```text
## 4. Concern Placement

| Concern | Core Placement | Domain Placement | Boundary |
|---|---|---|---|
| Work store | One shared fgOS store/event log | Domain identity and domain-local fields | Domains do not get separate fgOS installs or stores. |
| Work fields | Top-level work schema and closed editable field set | `domainFields.<domain>.*` | Top-level fields are platform ports; domain fields are adapter territory. |
| Workflow engine | Domain/workflow resolver and normalized runtime shape | `manifest.yaml` and `workflows/*.yaml` | Core loads and validates; domains declare vocabulary and legal operations. |
| Task-specs | `core/task-specs/` for domain-agnostic skills | `domains/<name>/task-specs/` | Task-spec is executable contract by task kind, not work-item field schema. |
| Skills | `core/skills/` for shared skills | `domains/<name>/skills/` | Authoring source is split; generated skill trees remain render targets. |
| Knowledge | Platform-wide decisions and shared knowledge registries | `domains/<name>/knowledge/` | Knowledge is curated expertise, distinct from raw feature context. |
| Context | `docs/history/<feature>/` | Same shared context location | Context is raw, feature-scoped material; do not tag it as domain knowledge. |
| Doctrine | Root `AGENTS.md` for domain-agnostic doctrine | `domains/<name>/AGENTS.md` | Routing reads domain doctrine after domain resolution. |
| Agent types | `core/agents/` for domain-agnostic agent types | `domains/<name>/agents/` | Location records authorship/flavor, not an execution-use restriction. |
| External render targets | `.agents/skills/`, `.claude/skills/`, `.claude/agents/`, plugin skill trees | None | Render targets keep host-facing shape stable while authoring sources move. |
```

## claim_d8f988ee8325b7a605290c3f775f0376

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-12, lines 67–78.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-15.
Source digest: e591fd72c7b36388e5d57f295f4ba1522b6fb91860719fd3c9f6e67d966ce72e
Target digest: e591fd72c7b36388e5d57f295f4ba1522b6fb91860719fd3c9f6e67d966ce72e
Shown source SHA256: e591fd72c7b36388e5d57f295f4ba1522b6fb91860719fd3c9f6e67d966ce72e
Shown target SHA256: e591fd72c7b36388e5d57f295f4ba1522b6fb91860719fd3c9f6e67d966ce72e

### Proposed decision

```json
{
  "claimId": "claim_d8f988ee8325b7a605290c3f775f0376",
  "sourceUnitDigest": "e591fd72c7b36388e5d57f295f4ba1522b6fb91860719fd3c9f6e67d966ce72e",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "e591fd72c7b36388e5d57f295f4ba1522b6fb91860719fd3c9f6e67d966ce72e",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "4. Concern Placement"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-12 (lines 67–78) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-15 (lines 91–102); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
| Concern | Core Placement | Domain Placement | Boundary |
|---|---|---|---|
| Work store | One shared fgOS store/event log | Domain identity and domain-local fields | Domains do not get separate fgOS installs or stores. |
| Work fields | Top-level work schema and closed editable field set | `domainFields.<domain>.*` | Top-level fields are platform ports; domain fields are adapter territory. |
| Workflow engine | Domain/workflow resolver and normalized runtime shape | `manifest.yaml` and `workflows/*.yaml` | Core loads and validates; domains declare vocabulary and legal operations. |
| Task-specs | `core/task-specs/` for domain-agnostic skills | `domains/<name>/task-specs/` | Task-spec is executable contract by task kind, not work-item field schema. |
| Skills | `core/skills/` for shared skills | `domains/<name>/skills/` | Authoring source is split; generated skill trees remain render targets. |
| Knowledge | Platform-wide decisions and shared knowledge registries | `domains/<name>/knowledge/` | Knowledge is curated expertise, distinct from raw feature context. |
| Context | `docs/history/<feature>/` | Same shared context location | Context is raw, feature-scoped material; do not tag it as domain knowledge. |
| Doctrine | Root `AGENTS.md` for domain-agnostic doctrine | `domains/<name>/AGENTS.md` | Routing reads domain doctrine after domain resolution. |
| Agent types | `core/agents/` for domain-agnostic agent types | `domains/<name>/agents/` | Location records authorship/flavor, not an execution-use restriction. |
| External render targets | `.agents/skills/`, `.claude/skills/`, `.claude/agents/`, plugin skill trees | None | Render targets keep host-facing shape stable while authoring sources move. |
```

### Full target shown text

```text
| Concern | Core Placement | Domain Placement | Boundary |
|---|---|---|---|
| Work store | One shared fgOS store/event log | Domain identity and domain-local fields | Domains do not get separate fgOS installs or stores. |
| Work fields | Top-level work schema and closed editable field set | `domainFields.<domain>.*` | Top-level fields are platform ports; domain fields are adapter territory. |
| Workflow engine | Domain/workflow resolver and normalized runtime shape | `manifest.yaml` and `workflows/*.yaml` | Core loads and validates; domains declare vocabulary and legal operations. |
| Task-specs | `core/task-specs/` for domain-agnostic skills | `domains/<name>/task-specs/` | Task-spec is executable contract by task kind, not work-item field schema. |
| Skills | `core/skills/` for shared skills | `domains/<name>/skills/` | Authoring source is split; generated skill trees remain render targets. |
| Knowledge | Platform-wide decisions and shared knowledge registries | `domains/<name>/knowledge/` | Knowledge is curated expertise, distinct from raw feature context. |
| Context | `docs/history/<feature>/` | Same shared context location | Context is raw, feature-scoped material; do not tag it as domain knowledge. |
| Doctrine | Root `AGENTS.md` for domain-agnostic doctrine | `domains/<name>/AGENTS.md` | Routing reads domain doctrine after domain resolution. |
| Agent types | `core/agents/` for domain-agnostic agent types | `domains/<name>/agents/` | Location records authorship/flavor, not an execution-use restriction. |
| External render targets | `.agents/skills/`, `.claude/skills/`, `.claude/agents/`, plugin skill trees | None | Render targets keep host-facing shape stable while authoring sources move. |
```

## claim_75c6766395a29437c3b171a7be3ce7c2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#5-manifest-and-workflow-boundary, lines 80–80.
Target: docs/platform/domainization/architecture/domainization.md#5-manifest-and-workflow-boundary.
Source digest: 470b195a19f7337adea0e203a6c29698112632396390d5248eee7ef80a85d417
Target digest: 470b195a19f7337adea0e203a6c29698112632396390d5248eee7ef80a85d417
Shown source SHA256: b2bbf30c6c78edb42051d595dc7d19ff6df1674286c1438dd3c864c7918fa1ee
Shown target SHA256: b2bbf30c6c78edb42051d595dc7d19ff6df1674286c1438dd3c864c7918fa1ee

### Proposed decision

```json
{
  "claimId": "claim_75c6766395a29437c3b171a7be3ce7c2",
  "sourceUnitDigest": "470b195a19f7337adea0e203a6c29698112632396390d5248eee7ef80a85d417",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "5-manifest-and-workflow-boundary",
  "targetUnitDigest": "470b195a19f7337adea0e203a6c29698112632396390d5248eee7ef80a85d417",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#5-manifest-and-workflow-boundary (lines 80–80) is carried at docs/platform/domainization/architecture/domainization.md#5-manifest-and-workflow-boundary (lines 104–104); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 5. Manifest And Workflow Boundary

`manifest.yaml` owns domain-level identity, selector, and policy data:

```txt
roleGraph
worktreeBacked
statusLabels
parkReason
classification
defaultWorkflow
workflowFor
```

`workflows/*.yaml` owns workflow-specific data:

```txt
stages
stepMap
transitions
skillMap
taskSpecMap
legal operations
```

The `workflows` map is not authored. Core derives it by scanning
`domains/<name>/workflows/*.yaml`; the filename is the workflow name.

Core then normalizes author-friendly YAML into the runtime shape consumed by
existing resolver functions such as `getDomain`, `resolveWorkflow`,
`skillForStage`, and future path/bundle resolvers.

The filename is uniform across authored extension kinds. `kind` (for example
`fgos.domain`) selects the schema; it is not encoded in a second filename.
The runtime registry is a derived index built after manifests and workflows
are validated, so authors do not maintain both a manifest and a registry.
````

### Full target shown text

````text
## 5. Manifest And Workflow Boundary

`manifest.yaml` owns domain-level identity, selector, and policy data:

```txt
roleGraph
worktreeBacked
statusLabels
parkReason
classification
defaultWorkflow
workflowFor
```

`workflows/*.yaml` owns workflow-specific data:

```txt
stages
stepMap
transitions
skillMap
taskSpecMap
legal operations
```

The `workflows` map is not authored. Core derives it by scanning
`domains/<name>/workflows/*.yaml`; the filename is the workflow name.

Core then normalizes author-friendly YAML into the runtime shape consumed by
existing resolver functions such as `getDomain`, `resolveWorkflow`,
`skillForStage`, and future path/bundle resolvers.

The filename is uniform across authored extension kinds. `kind` (for example
`fgos.domain`) selects the schema; it is not encoded in a second filename.
The runtime registry is a derived index built after manifests and workflows
are validated, so authors do not maintain both a manifest and a registry.
````

## claim_11ff56c98f098a7f66337dee48b304de

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-13, lines 82–82.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-16.
Source digest: 791d49ade630f415f5b4b9778afd855a5a415e2b05563c9e0201c1d5f8ef6a8b
Target digest: 791d49ade630f415f5b4b9778afd855a5a415e2b05563c9e0201c1d5f8ef6a8b
Shown source SHA256: 791d49ade630f415f5b4b9778afd855a5a415e2b05563c9e0201c1d5f8ef6a8b
Shown target SHA256: 791d49ade630f415f5b4b9778afd855a5a415e2b05563c9e0201c1d5f8ef6a8b

### Proposed decision

```json
{
  "claimId": "claim_11ff56c98f098a7f66337dee48b304de",
  "sourceUnitDigest": "791d49ade630f415f5b4b9778afd855a5a415e2b05563c9e0201c1d5f8ef6a8b",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "791d49ade630f415f5b4b9778afd855a5a415e2b05563c9e0201c1d5f8ef6a8b",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "5. Manifest And Workflow Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-13 (lines 82–82) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-16 (lines 106–106); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`manifest.yaml` owns domain-level identity, selector, and policy data:
```

### Full target shown text

```text
`manifest.yaml` owns domain-level identity, selector, and policy data:
```

## claim_a49a22c3a47c684ff0d25551b11e1b27

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-14, lines 84–92.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-17.
Source digest: 611bad8dc12b1ad221685f63441b86c6d4a012f65cc2e06e9d6c90a6a4f90eac
Target digest: 611bad8dc12b1ad221685f63441b86c6d4a012f65cc2e06e9d6c90a6a4f90eac
Shown source SHA256: 611bad8dc12b1ad221685f63441b86c6d4a012f65cc2e06e9d6c90a6a4f90eac
Shown target SHA256: 611bad8dc12b1ad221685f63441b86c6d4a012f65cc2e06e9d6c90a6a4f90eac

### Proposed decision

```json
{
  "claimId": "claim_a49a22c3a47c684ff0d25551b11e1b27",
  "sourceUnitDigest": "611bad8dc12b1ad221685f63441b86c6d4a012f65cc2e06e9d6c90a6a4f90eac",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "611bad8dc12b1ad221685f63441b86c6d4a012f65cc2e06e9d6c90a6a4f90eac",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "5. Manifest And Workflow Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-14 (lines 84–92) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-17 (lines 108–116); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
roleGraph
worktreeBacked
statusLabels
parkReason
classification
defaultWorkflow
workflowFor
```
````

### Full target shown text

````text
```txt
roleGraph
worktreeBacked
statusLabels
parkReason
classification
defaultWorkflow
workflowFor
```
````

## claim_69aef065cbdba37df1f55a7c515f4032

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-15, lines 94–94.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-18.
Source digest: dabd154bd775593734f0df0096a148370319749a1328fb5b144072d19ebe7055
Target digest: dabd154bd775593734f0df0096a148370319749a1328fb5b144072d19ebe7055
Shown source SHA256: dabd154bd775593734f0df0096a148370319749a1328fb5b144072d19ebe7055
Shown target SHA256: dabd154bd775593734f0df0096a148370319749a1328fb5b144072d19ebe7055

### Proposed decision

```json
{
  "claimId": "claim_69aef065cbdba37df1f55a7c515f4032",
  "sourceUnitDigest": "dabd154bd775593734f0df0096a148370319749a1328fb5b144072d19ebe7055",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "dabd154bd775593734f0df0096a148370319749a1328fb5b144072d19ebe7055",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "5. Manifest And Workflow Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-15 (lines 94–94) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-18 (lines 118–118); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`workflows/*.yaml` owns workflow-specific data:
```

### Full target shown text

```text
`workflows/*.yaml` owns workflow-specific data:
```

## claim_876ce30e139a28b9aea5e05d3a416413

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-16, lines 96–103.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-19.
Source digest: 532189a5c7b56ccc7a0cdc7e12a8cb96069e81f29ca20b2316b1aadadb889083
Target digest: 532189a5c7b56ccc7a0cdc7e12a8cb96069e81f29ca20b2316b1aadadb889083
Shown source SHA256: 532189a5c7b56ccc7a0cdc7e12a8cb96069e81f29ca20b2316b1aadadb889083
Shown target SHA256: 532189a5c7b56ccc7a0cdc7e12a8cb96069e81f29ca20b2316b1aadadb889083

### Proposed decision

```json
{
  "claimId": "claim_876ce30e139a28b9aea5e05d3a416413",
  "sourceUnitDigest": "532189a5c7b56ccc7a0cdc7e12a8cb96069e81f29ca20b2316b1aadadb889083",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "532189a5c7b56ccc7a0cdc7e12a8cb96069e81f29ca20b2316b1aadadb889083",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "5. Manifest And Workflow Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-16 (lines 96–103) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-19 (lines 120–127); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
stages
stepMap
transitions
skillMap
taskSpecMap
legal operations
```
````

### Full target shown text

````text
```txt
stages
stepMap
transitions
skillMap
taskSpecMap
legal operations
```
````

## claim_3fa326bfb8656e454284a2b263a13cbd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-17, lines 105–106.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-20.
Source digest: 7299973d662e3c8f6e71f9d61c1687df6548dbc91ad45541b2bc457f6e6d5e3d
Target digest: 7299973d662e3c8f6e71f9d61c1687df6548dbc91ad45541b2bc457f6e6d5e3d
Shown source SHA256: 7299973d662e3c8f6e71f9d61c1687df6548dbc91ad45541b2bc457f6e6d5e3d
Shown target SHA256: 7299973d662e3c8f6e71f9d61c1687df6548dbc91ad45541b2bc457f6e6d5e3d

### Proposed decision

```json
{
  "claimId": "claim_3fa326bfb8656e454284a2b263a13cbd",
  "sourceUnitDigest": "7299973d662e3c8f6e71f9d61c1687df6548dbc91ad45541b2bc457f6e6d5e3d",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "7299973d662e3c8f6e71f9d61c1687df6548dbc91ad45541b2bc457f6e6d5e3d",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "5. Manifest And Workflow Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-17 (lines 105–106) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-20 (lines 129–130); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The `workflows` map is not authored. Core derives it by scanning
`domains/<name>/workflows/*.yaml`; the filename is the workflow name.
```

### Full target shown text

```text
The `workflows` map is not authored. Core derives it by scanning
`domains/<name>/workflows/*.yaml`; the filename is the workflow name.
```

## claim_10158df1c75bfe58c9ea32618a656558

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-18, lines 108–110.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-21.
Source digest: 9a8fad483b16e6c445d9debcdb4b8dffcd4b4b768f35d5add84d18c768673e2e
Target digest: 9a8fad483b16e6c445d9debcdb4b8dffcd4b4b768f35d5add84d18c768673e2e
Shown source SHA256: 9a8fad483b16e6c445d9debcdb4b8dffcd4b4b768f35d5add84d18c768673e2e
Shown target SHA256: 9a8fad483b16e6c445d9debcdb4b8dffcd4b4b768f35d5add84d18c768673e2e

### Proposed decision

```json
{
  "claimId": "claim_10158df1c75bfe58c9ea32618a656558",
  "sourceUnitDigest": "9a8fad483b16e6c445d9debcdb4b8dffcd4b4b768f35d5add84d18c768673e2e",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "9a8fad483b16e6c445d9debcdb4b8dffcd4b4b768f35d5add84d18c768673e2e",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "5. Manifest And Workflow Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-18 (lines 108–110) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-21 (lines 132–134); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Core then normalizes author-friendly YAML into the runtime shape consumed by
existing resolver functions such as `getDomain`, `resolveWorkflow`,
`skillForStage`, and future path/bundle resolvers.
```

### Full target shown text

```text
Core then normalizes author-friendly YAML into the runtime shape consumed by
existing resolver functions such as `getDomain`, `resolveWorkflow`,
`skillForStage`, and future path/bundle resolvers.
```

## claim_86f7b9ccb47d0fca691c5be8977c7da5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-19, lines 112–115.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-22.
Source digest: 0eb777fbe75087e0cf63359ed4201d425f1cbf4ba17d7d8a8308a02986c7141d
Target digest: 0eb777fbe75087e0cf63359ed4201d425f1cbf4ba17d7d8a8308a02986c7141d
Shown source SHA256: 0eb777fbe75087e0cf63359ed4201d425f1cbf4ba17d7d8a8308a02986c7141d
Shown target SHA256: 0eb777fbe75087e0cf63359ed4201d425f1cbf4ba17d7d8a8308a02986c7141d

### Proposed decision

```json
{
  "claimId": "claim_86f7b9ccb47d0fca691c5be8977c7da5",
  "sourceUnitDigest": "0eb777fbe75087e0cf63359ed4201d425f1cbf4ba17d7d8a8308a02986c7141d",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "0eb777fbe75087e0cf63359ed4201d425f1cbf4ba17d7d8a8308a02986c7141d",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "5. Manifest And Workflow Boundary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-19 (lines 112–115) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-22 (lines 136–139); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The filename is uniform across authored extension kinds. `kind` (for example
`fgos.domain`) selects the schema; it is not encoded in a second filename.
The runtime registry is a derived index built after manifests and workflows
are validated, so authors do not maintain both a manifest and a registry.
```

### Full target shown text

```text
The filename is uniform across authored extension kinds. `kind` (for example
`fgos.domain`) selects the schema; it is not encoded in a second filename.
The runtime registry is a derived index built after manifests and workflows
are validated, so authors do not maintain both a manifest and a registry.
```

## claim_877b932b36d9ba41767351191af73997

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#6-resolver-boundary, lines 117–117.
Target: docs/platform/domainization/architecture/domainization.md#6-resolver-boundary.
Source digest: 2c1cadea222d25d77d26b869756a671a7aaf8b8e71f289d2992443942da9e815
Target digest: 2c1cadea222d25d77d26b869756a671a7aaf8b8e71f289d2992443942da9e815
Shown source SHA256: 4566c49cae89325e710af958b12066e5fe4f588a47406c232621f311cae01e40
Shown target SHA256: 4566c49cae89325e710af958b12066e5fe4f588a47406c232621f311cae01e40

### Proposed decision

```json
{
  "claimId": "claim_877b932b36d9ba41767351191af73997",
  "sourceUnitDigest": "2c1cadea222d25d77d26b869756a671a7aaf8b8e71f289d2992443942da9e815",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "6-resolver-boundary",
  "targetUnitDigest": "2c1cadea222d25d77d26b869756a671a7aaf8b8e71f289d2992443942da9e815",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#6-resolver-boundary (lines 117–117) is carried at docs/platform/domainization/architecture/domainization.md#6-resolver-boundary (lines 141–141); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 6. Resolver Boundary

Cross-boundary access should go through resolver functions, not raw path joins
or direct imports of a specific domain file.

Important resolver responsibilities:

- resolve a domain and workflow for a work item;
- resolve a task-spec path from `(domain, specId)`;
- resolve a stage bundle from `(domain, stage, item kind)` into `{skill, taskSpec}`;
- expose role graph and workflow legality without letting callers inspect raw
  YAML layout;
- preserve current runtime signatures where possible while changing the data
  source behind them.

This keeps domain files replaceable and keeps core code from depending on a
particular domain's source layout.
```

### Full target shown text

```text
## 6. Resolver Boundary

Cross-boundary access should go through resolver functions, not raw path joins
or direct imports of a specific domain file.

Important resolver responsibilities:

- resolve a domain and workflow for a work item;
- resolve a task-spec path from `(domain, specId)`;
- resolve a stage bundle from `(domain, stage, item kind)` into `{skill, taskSpec}`;
- expose role graph and workflow legality without letting callers inspect raw
  YAML layout;
- preserve current runtime signatures where possible while changing the data
  source behind them.

This keeps domain files replaceable and keeps core code from depending on a
particular domain's source layout.
```

## claim_4a8f5423a77d9c88dc5d3aaf9e3459b2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-20, lines 119–120.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-23.
Source digest: a324fce15ab2dfab42475fc75957d73a5715fc5cf952d8fccd097e0e584c1325
Target digest: a324fce15ab2dfab42475fc75957d73a5715fc5cf952d8fccd097e0e584c1325
Shown source SHA256: a324fce15ab2dfab42475fc75957d73a5715fc5cf952d8fccd097e0e584c1325
Shown target SHA256: a324fce15ab2dfab42475fc75957d73a5715fc5cf952d8fccd097e0e584c1325

### Proposed decision

```json
{
  "claimId": "claim_4a8f5423a77d9c88dc5d3aaf9e3459b2",
  "sourceUnitDigest": "a324fce15ab2dfab42475fc75957d73a5715fc5cf952d8fccd097e0e584c1325",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "a324fce15ab2dfab42475fc75957d73a5715fc5cf952d8fccd097e0e584c1325",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "6. Resolver Boundary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-20 (lines 119–120) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-23 (lines 143–144); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Cross-boundary access should go through resolver functions, not raw path joins
or direct imports of a specific domain file.
```

### Full target shown text

```text
Cross-boundary access should go through resolver functions, not raw path joins
or direct imports of a specific domain file.
```

## claim_ff694ee8e076161a743d773dd891ace1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#unheaded-block-21, lines 122–122.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-24.
Source digest: c2e0949097ba3eb8acc7c20e0930960f7b12fdccf886f7897777911792cb0034
Target digest: c2e0949097ba3eb8acc7c20e0930960f7b12fdccf886f7897777911792cb0034
Shown source SHA256: c2e0949097ba3eb8acc7c20e0930960f7b12fdccf886f7897777911792cb0034
Shown target SHA256: c2e0949097ba3eb8acc7c20e0930960f7b12fdccf886f7897777911792cb0034

### Proposed decision

```json
{
  "claimId": "claim_ff694ee8e076161a743d773dd891ace1",
  "sourceUnitDigest": "c2e0949097ba3eb8acc7c20e0930960f7b12fdccf886f7897777911792cb0034",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "c2e0949097ba3eb8acc7c20e0930960f7b12fdccf886f7897777911792cb0034",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "6. Resolver Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-21 (lines 122–122) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-24 (lines 146–146); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Important resolver responsibilities:
```

### Full target shown text

```text
Important resolver responsibilities:
```

## claim_9d85d310c14456129d2d42fbf1d1d7aa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-22, lines 124–130.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-25.
Source digest: 249ee32682d25fb439a85571ebb31256e26e96d63c3963130b1f5c228b438c00
Target digest: 249ee32682d25fb439a85571ebb31256e26e96d63c3963130b1f5c228b438c00
Shown source SHA256: 249ee32682d25fb439a85571ebb31256e26e96d63c3963130b1f5c228b438c00
Shown target SHA256: 249ee32682d25fb439a85571ebb31256e26e96d63c3963130b1f5c228b438c00

### Proposed decision

```json
{
  "claimId": "claim_9d85d310c14456129d2d42fbf1d1d7aa",
  "sourceUnitDigest": "249ee32682d25fb439a85571ebb31256e26e96d63c3963130b1f5c228b438c00",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "249ee32682d25fb439a85571ebb31256e26e96d63c3963130b1f5c228b438c00",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "6. Resolver Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-22 (lines 124–130) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-25 (lines 148–154); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- resolve a domain and workflow for a work item;
- resolve a task-spec path from `(domain, specId)`;
- resolve a stage bundle from `(domain, stage, item kind)` into `{skill, taskSpec}`;
- expose role graph and workflow legality without letting callers inspect raw
  YAML layout;
- preserve current runtime signatures where possible while changing the data
  source behind them.
```

### Full target shown text

```text
- resolve a domain and workflow for a work item;
- resolve a task-spec path from `(domain, specId)`;
- resolve a stage bundle from `(domain, stage, item kind)` into `{skill, taskSpec}`;
- expose role graph and workflow legality without letting callers inspect raw
  YAML layout;
- preserve current runtime signatures where possible while changing the data
  source behind them.
```

## claim_15c1e3eed435202f266c5534dae203d0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-23, lines 132–133.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-26.
Source digest: 43e1345a662a0e989a55a13efc122587c142e3cf50b3d08af8e9e303da98194d
Target digest: 43e1345a662a0e989a55a13efc122587c142e3cf50b3d08af8e9e303da98194d
Shown source SHA256: 43e1345a662a0e989a55a13efc122587c142e3cf50b3d08af8e9e303da98194d
Shown target SHA256: 43e1345a662a0e989a55a13efc122587c142e3cf50b3d08af8e9e303da98194d

### Proposed decision

```json
{
  "claimId": "claim_15c1e3eed435202f266c5534dae203d0",
  "sourceUnitDigest": "43e1345a662a0e989a55a13efc122587c142e3cf50b3d08af8e9e303da98194d",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "43e1345a662a0e989a55a13efc122587c142e3cf50b3d08af8e9e303da98194d",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "6. Resolver Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-23 (lines 132–133) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-26 (lines 156–157); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This keeps domain files replaceable and keeps core code from depending on a
particular domain's source layout.
```

### Full target shown text

```text
This keeps domain files replaceable and keeps core code from depending on a
particular domain's source layout.
```

## claim_687218e70427951eb86bc7ce0e439bf1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#7-doctrine-loading, lines 135–135.
Target: docs/platform/domainization/architecture/domainization.md#7-doctrine-loading.
Source digest: bb201d8604bb80293f49f1bfaba9a4b05aa6c2b5fc3b2472449ad7eca64be005
Target digest: bb201d8604bb80293f49f1bfaba9a4b05aa6c2b5fc3b2472449ad7eca64be005
Shown source SHA256: e1c6d21589df70d78b148793f620e3dc5ac868e0e706cc13ce7cfeeb507b0b56
Shown target SHA256: e1c6d21589df70d78b148793f620e3dc5ac868e0e706cc13ce7cfeeb507b0b56

### Proposed decision

```json
{
  "claimId": "claim_687218e70427951eb86bc7ce0e439bf1",
  "sourceUnitDigest": "bb201d8604bb80293f49f1bfaba9a4b05aa6c2b5fc3b2472449ad7eca64be005",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "7-doctrine-loading",
  "targetUnitDigest": "bb201d8604bb80293f49f1bfaba9a4b05aa6c2b5fc3b2472449ad7eca64be005",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#7-doctrine-loading (lines 135–135) is carried at docs/platform/domainization/architecture/domainization.md#7-doctrine-loading (lines 159–159); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 7. Doctrine Loading

Root doctrine stays domain-agnostic. Domain doctrine lives at:

```txt
domains/<domain>/AGENTS.md
```

Do not rely on tool-specific automatic discovery of nested `AGENTS.md` files.
The reliable contract is explicit loading: once routing resolves `work.domain`,
it reads `domains/<domain>/AGENTS.md` before handing control to the domain
driver or stage skill.

This mirrors the stage-level bundle rule: routing resolves domain doctrine once
per session; driving resolves skill/task-spec material per stage.
````

### Full target shown text

````text
## 7. Doctrine Loading

Root doctrine stays domain-agnostic. Domain doctrine lives at:

```txt
domains/<domain>/AGENTS.md
```

Do not rely on tool-specific automatic discovery of nested `AGENTS.md` files.
The reliable contract is explicit loading: once routing resolves `work.domain`,
it reads `domains/<domain>/AGENTS.md` before handing control to the domain
driver or stage skill.

This mirrors the stage-level bundle rule: routing resolves domain doctrine once
per session; driving resolves skill/task-spec material per stage.
````

## claim_7282a1455bdd0c684d8cc405a9ad2fb4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-24, lines 137–137.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-27.
Source digest: 54676e4c3d47255b454dbb089c39f847f4ef20add540800d8a2ddce115e8f54a
Target digest: 54676e4c3d47255b454dbb089c39f847f4ef20add540800d8a2ddce115e8f54a
Shown source SHA256: 54676e4c3d47255b454dbb089c39f847f4ef20add540800d8a2ddce115e8f54a
Shown target SHA256: 54676e4c3d47255b454dbb089c39f847f4ef20add540800d8a2ddce115e8f54a

### Proposed decision

```json
{
  "claimId": "claim_7282a1455bdd0c684d8cc405a9ad2fb4",
  "sourceUnitDigest": "54676e4c3d47255b454dbb089c39f847f4ef20add540800d8a2ddce115e8f54a",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "54676e4c3d47255b454dbb089c39f847f4ef20add540800d8a2ddce115e8f54a",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "7. Doctrine Loading"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-24 (lines 137–137) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-27 (lines 161–161); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Root doctrine stays domain-agnostic. Domain doctrine lives at:
```

### Full target shown text

```text
Root doctrine stays domain-agnostic. Domain doctrine lives at:
```

## claim_e58b71cb87ac94106fbc628715eef4c2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#unheaded-block-25, lines 139–141.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-28.
Source digest: e8f7f9a9b7b9726dd97d3a488cfc9a0cf1ac5267c47432872bdebcc35abdfc0b
Target digest: e8f7f9a9b7b9726dd97d3a488cfc9a0cf1ac5267c47432872bdebcc35abdfc0b
Shown source SHA256: e8f7f9a9b7b9726dd97d3a488cfc9a0cf1ac5267c47432872bdebcc35abdfc0b
Shown target SHA256: e8f7f9a9b7b9726dd97d3a488cfc9a0cf1ac5267c47432872bdebcc35abdfc0b

### Proposed decision

```json
{
  "claimId": "claim_e58b71cb87ac94106fbc628715eef4c2",
  "sourceUnitDigest": "e8f7f9a9b7b9726dd97d3a488cfc9a0cf1ac5267c47432872bdebcc35abdfc0b",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "e8f7f9a9b7b9726dd97d3a488cfc9a0cf1ac5267c47432872bdebcc35abdfc0b",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "7. Doctrine Loading"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-25 (lines 139–141) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-28 (lines 163–165); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
domains/<domain>/AGENTS.md
```
````

### Full target shown text

````text
```txt
domains/<domain>/AGENTS.md
```
````

## claim_2af6dbbc9fb6a6d5c3faa8d26971e200

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-26, lines 143–146.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-29.
Source digest: f599b8b93cddd6e864a953a05e97ec3bbc8998ebe450d2d9990c00feb5a02fbd
Target digest: f599b8b93cddd6e864a953a05e97ec3bbc8998ebe450d2d9990c00feb5a02fbd
Shown source SHA256: f599b8b93cddd6e864a953a05e97ec3bbc8998ebe450d2d9990c00feb5a02fbd
Shown target SHA256: f599b8b93cddd6e864a953a05e97ec3bbc8998ebe450d2d9990c00feb5a02fbd

### Proposed decision

```json
{
  "claimId": "claim_2af6dbbc9fb6a6d5c3faa8d26971e200",
  "sourceUnitDigest": "f599b8b93cddd6e864a953a05e97ec3bbc8998ebe450d2d9990c00feb5a02fbd",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "f599b8b93cddd6e864a953a05e97ec3bbc8998ebe450d2d9990c00feb5a02fbd",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "7. Doctrine Loading"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-26 (lines 143–146) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-29 (lines 167–170); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Do not rely on tool-specific automatic discovery of nested `AGENTS.md` files.
The reliable contract is explicit loading: once routing resolves `work.domain`,
it reads `domains/<domain>/AGENTS.md` before handing control to the domain
driver or stage skill.
```

### Full target shown text

```text
Do not rely on tool-specific automatic discovery of nested `AGENTS.md` files.
The reliable contract is explicit loading: once routing resolves `work.domain`,
it reads `domains/<domain>/AGENTS.md` before handing control to the domain
driver or stage skill.
```

## claim_a5b2fa2b666a8b2de96f2f94c4aef599

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-27, lines 148–149.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-30.
Source digest: 4cc2acd0014945627ee57f2eb60a2fea856e96f939c919ab1f8cc35d5a164c27
Target digest: 4cc2acd0014945627ee57f2eb60a2fea856e96f939c919ab1f8cc35d5a164c27
Shown source SHA256: 4cc2acd0014945627ee57f2eb60a2fea856e96f939c919ab1f8cc35d5a164c27
Shown target SHA256: 4cc2acd0014945627ee57f2eb60a2fea856e96f939c919ab1f8cc35d5a164c27

### Proposed decision

```json
{
  "claimId": "claim_a5b2fa2b666a8b2de96f2f94c4aef599",
  "sourceUnitDigest": "4cc2acd0014945627ee57f2eb60a2fea856e96f939c919ab1f8cc35d5a164c27",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "4cc2acd0014945627ee57f2eb60a2fea856e96f939c919ab1f8cc35d5a164c27",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "7. Doctrine Loading"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-27 (lines 148–149) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-30 (lines 172–173); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This mirrors the stage-level bundle rule: routing resolves domain doctrine once
per session; driving resolves skill/task-spec material per stage.
```

### Full target shown text

```text
This mirrors the stage-level bundle rule: routing resolves domain doctrine once
per session; driving resolves skill/task-spec material per stage.
```

## claim_43411cc9720cb67df7501864531a7dbb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#8-skill-and-agent-authoring, lines 151–151.
Target: docs/platform/domainization/architecture/domainization.md#8-skill-and-agent-authoring.
Source digest: 4ad5c40e6af17f0d07a4caf215f4f52ca5d8daf9cffaeabde5bf80d06ac37d02
Target digest: 4ad5c40e6af17f0d07a4caf215f4f52ca5d8daf9cffaeabde5bf80d06ac37d02
Shown source SHA256: fd0f304bca74334244549b847d94955c07c784c4a04eb36741fb55bd971ab4c6
Shown target SHA256: fd0f304bca74334244549b847d94955c07c784c4a04eb36741fb55bd971ab4c6

### Proposed decision

```json
{
  "claimId": "claim_43411cc9720cb67df7501864531a7dbb",
  "sourceUnitDigest": "4ad5c40e6af17f0d07a4caf215f4f52ca5d8daf9cffaeabde5bf80d06ac37d02",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "8-skill-and-agent-authoring",
  "targetUnitDigest": "4ad5c40e6af17f0d07a4caf215f4f52ca5d8daf9cffaeabde5bf80d06ac37d02",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#8-skill-and-agent-authoring (lines 151–151) is carried at docs/platform/domainization/architecture/domainization.md#8-skill-and-agent-authoring (lines 175–175); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 8. Skill And Agent Authoring

Skill authoring sources split by ownership:

```txt
core/skills/
domains/<domain>/skills/
```

Existing generated/render targets remain stable:

```txt
.agents/skills/
.claude/skills/
plugins/fgOS/skills/
```

Agent-type authoring follows the same ownership split:

```txt
core/agents/
domains/<domain>/agents/
```

Generated Claude-facing agents still land in one flat `.claude/agents/` target.
Because that render target is flat, agent-type names must be globally unique
across core and every domain. This should be enforced by doctor/setup checks,
not left as a silent overwrite risk.
````

### Full target shown text

````text
## 8. Skill And Agent Authoring

Skill authoring sources split by ownership:

```txt
core/skills/
domains/<domain>/skills/
```

Existing generated/render targets remain stable:

```txt
.agents/skills/
.claude/skills/
plugins/fgOS/skills/
```

Agent-type authoring follows the same ownership split:

```txt
core/agents/
domains/<domain>/agents/
```

Generated Claude-facing agents still land in one flat `.claude/agents/` target.
Because that render target is flat, agent-type names must be globally unique
across core and every domain. This should be enforced by doctor/setup checks,
not left as a silent overwrite risk.
````

## claim_215c0e6ac51c54f56b6f3c1035e4a1ea

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-28, lines 153–153.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-31.
Source digest: efd5d74fe753179eac66a9bc60747506fa20d8a51cc8b9fff8ee59786f658605
Target digest: efd5d74fe753179eac66a9bc60747506fa20d8a51cc8b9fff8ee59786f658605
Shown source SHA256: efd5d74fe753179eac66a9bc60747506fa20d8a51cc8b9fff8ee59786f658605
Shown target SHA256: efd5d74fe753179eac66a9bc60747506fa20d8a51cc8b9fff8ee59786f658605

### Proposed decision

```json
{
  "claimId": "claim_215c0e6ac51c54f56b6f3c1035e4a1ea",
  "sourceUnitDigest": "efd5d74fe753179eac66a9bc60747506fa20d8a51cc8b9fff8ee59786f658605",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "efd5d74fe753179eac66a9bc60747506fa20d8a51cc8b9fff8ee59786f658605",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "8. Skill And Agent Authoring"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-28 (lines 153–153) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-31 (lines 177–177); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Skill authoring sources split by ownership:
```

### Full target shown text

```text
Skill authoring sources split by ownership:
```

## claim_a1e73dc2671513b4540f8e35db38417b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-29, lines 155–158.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-32.
Source digest: 07bb23af365c2bc3d29124aaffe9b45163f593e889c0247f1555c14cc1d5c953
Target digest: 07bb23af365c2bc3d29124aaffe9b45163f593e889c0247f1555c14cc1d5c953
Shown source SHA256: 07bb23af365c2bc3d29124aaffe9b45163f593e889c0247f1555c14cc1d5c953
Shown target SHA256: 07bb23af365c2bc3d29124aaffe9b45163f593e889c0247f1555c14cc1d5c953

### Proposed decision

```json
{
  "claimId": "claim_a1e73dc2671513b4540f8e35db38417b",
  "sourceUnitDigest": "07bb23af365c2bc3d29124aaffe9b45163f593e889c0247f1555c14cc1d5c953",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "07bb23af365c2bc3d29124aaffe9b45163f593e889c0247f1555c14cc1d5c953",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "8. Skill And Agent Authoring"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-29 (lines 155–158) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-32 (lines 179–182); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
core/skills/
domains/<domain>/skills/
```
````

### Full target shown text

````text
```txt
core/skills/
domains/<domain>/skills/
```
````

## claim_c4465e9a4f4b92a23aeb31c258c9c64c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-30, lines 160–160.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-33.
Source digest: 17fc1f8d8e966562410d47e37305201422213e33b73e95723f8a6aab05375db4
Target digest: 17fc1f8d8e966562410d47e37305201422213e33b73e95723f8a6aab05375db4
Shown source SHA256: 17fc1f8d8e966562410d47e37305201422213e33b73e95723f8a6aab05375db4
Shown target SHA256: 17fc1f8d8e966562410d47e37305201422213e33b73e95723f8a6aab05375db4

### Proposed decision

```json
{
  "claimId": "claim_c4465e9a4f4b92a23aeb31c258c9c64c",
  "sourceUnitDigest": "17fc1f8d8e966562410d47e37305201422213e33b73e95723f8a6aab05375db4",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "17fc1f8d8e966562410d47e37305201422213e33b73e95723f8a6aab05375db4",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "8. Skill And Agent Authoring"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-30 (lines 160–160) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-33 (lines 184–184); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Existing generated/render targets remain stable:
```

### Full target shown text

```text
Existing generated/render targets remain stable:
```

## claim_46db838c0858d7686896000600d674e8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-31, lines 162–166.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-34.
Source digest: 18164685a460e420ff9e08df016e27822aa5cf748be5afa70ad13fa9d096a07d
Target digest: 18164685a460e420ff9e08df016e27822aa5cf748be5afa70ad13fa9d096a07d
Shown source SHA256: 18164685a460e420ff9e08df016e27822aa5cf748be5afa70ad13fa9d096a07d
Shown target SHA256: 18164685a460e420ff9e08df016e27822aa5cf748be5afa70ad13fa9d096a07d

### Proposed decision

```json
{
  "claimId": "claim_46db838c0858d7686896000600d674e8",
  "sourceUnitDigest": "18164685a460e420ff9e08df016e27822aa5cf748be5afa70ad13fa9d096a07d",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "18164685a460e420ff9e08df016e27822aa5cf748be5afa70ad13fa9d096a07d",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "8. Skill And Agent Authoring"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-31 (lines 162–166) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-34 (lines 186–190); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
.agents/skills/
.claude/skills/
plugins/fgOS/skills/
```
````

### Full target shown text

````text
```txt
.agents/skills/
.claude/skills/
plugins/fgOS/skills/
```
````

## claim_f767f249ad0e4a0d4900556d54fcde3b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-32, lines 168–168.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-35.
Source digest: 9d99fcd3f524446e3fe2b00f1e80186d9c009eebcd838e9dc2e6cc467b9fd826
Target digest: 9d99fcd3f524446e3fe2b00f1e80186d9c009eebcd838e9dc2e6cc467b9fd826
Shown source SHA256: 9d99fcd3f524446e3fe2b00f1e80186d9c009eebcd838e9dc2e6cc467b9fd826
Shown target SHA256: 9d99fcd3f524446e3fe2b00f1e80186d9c009eebcd838e9dc2e6cc467b9fd826

### Proposed decision

```json
{
  "claimId": "claim_f767f249ad0e4a0d4900556d54fcde3b",
  "sourceUnitDigest": "9d99fcd3f524446e3fe2b00f1e80186d9c009eebcd838e9dc2e6cc467b9fd826",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "9d99fcd3f524446e3fe2b00f1e80186d9c009eebcd838e9dc2e6cc467b9fd826",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "8. Skill And Agent Authoring"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-32 (lines 168–168) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-35 (lines 192–192); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Agent-type authoring follows the same ownership split:
```

### Full target shown text

```text
Agent-type authoring follows the same ownership split:
```

## claim_e81265c2833607dfd6f8a9d3398e59ca

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-33, lines 170–173.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-36.
Source digest: 8b991d2edc03df5539b53b242089d038e9bc604ca0b95ad6fcf27d3260d5f074
Target digest: 8b991d2edc03df5539b53b242089d038e9bc604ca0b95ad6fcf27d3260d5f074
Shown source SHA256: 8b991d2edc03df5539b53b242089d038e9bc604ca0b95ad6fcf27d3260d5f074
Shown target SHA256: 8b991d2edc03df5539b53b242089d038e9bc604ca0b95ad6fcf27d3260d5f074

### Proposed decision

```json
{
  "claimId": "claim_e81265c2833607dfd6f8a9d3398e59ca",
  "sourceUnitDigest": "8b991d2edc03df5539b53b242089d038e9bc604ca0b95ad6fcf27d3260d5f074",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "8b991d2edc03df5539b53b242089d038e9bc604ca0b95ad6fcf27d3260d5f074",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "8. Skill And Agent Authoring"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-33 (lines 170–173) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-36 (lines 194–197); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
core/agents/
domains/<domain>/agents/
```
````

### Full target shown text

````text
```txt
core/agents/
domains/<domain>/agents/
```
````

## claim_9a67380ad7725f08ba58075ae56b7400

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-34, lines 175–178.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-37.
Source digest: 0bf51faba066572f5b6e4e659f42a15545c8ad6083a4e8f7de8f327a4be7cbac
Target digest: 0bf51faba066572f5b6e4e659f42a15545c8ad6083a4e8f7de8f327a4be7cbac
Shown source SHA256: 0bf51faba066572f5b6e4e659f42a15545c8ad6083a4e8f7de8f327a4be7cbac
Shown target SHA256: 0bf51faba066572f5b6e4e659f42a15545c8ad6083a4e8f7de8f327a4be7cbac

### Proposed decision

```json
{
  "claimId": "claim_9a67380ad7725f08ba58075ae56b7400",
  "sourceUnitDigest": "0bf51faba066572f5b6e4e659f42a15545c8ad6083a4e8f7de8f327a4be7cbac",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "0bf51faba066572f5b6e4e659f42a15545c8ad6083a4e8f7de8f327a4be7cbac",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "8. Skill And Agent Authoring"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-34 (lines 175–178) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-37 (lines 199–202); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Generated Claude-facing agents still land in one flat `.claude/agents/` target.
Because that render target is flat, agent-type names must be globally unique
across core and every domain. This should be enforced by doctor/setup checks,
not left as a silent overwrite risk.
```

### Full target shown text

```text
Generated Claude-facing agents still land in one flat `.claude/agents/` target.
Because that render target is flat, agent-type names must be globally unique
across core and every domain. This should be enforced by doctor/setup checks,
not left as a silent overwrite risk.
```

## claim_ddad13b9058b19f47e90dc522170fcf7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#9-eligibility-boundary, lines 180–180.
Target: docs/platform/domainization/architecture/domainization.md#9-eligibility-boundary.
Source digest: 4d9a6797116ed53ef4d33d99209577a7ff60f9e94885b934af299af0aafdfe21
Target digest: 4d9a6797116ed53ef4d33d99209577a7ff60f9e94885b934af299af0aafdfe21
Shown source SHA256: 6d837ed7c4238347ae7b29b9a0d5500005c477c2de4e1d8fb2d8dbce31259d15
Shown target SHA256: 6d837ed7c4238347ae7b29b9a0d5500005c477c2de4e1d8fb2d8dbce31259d15

### Proposed decision

```json
{
  "claimId": "claim_ddad13b9058b19f47e90dc522170fcf7",
  "sourceUnitDigest": "4d9a6797116ed53ef4d33d99209577a7ff60f9e94885b934af299af0aafdfe21",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "9-eligibility-boundary",
  "targetUnitDigest": "4d9a6797116ed53ef4d33d99209577a7ff60f9e94885b934af299af0aafdfe21",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#9-eligibility-boundary (lines 180–180) is carried at docs/platform/domainization/architecture/domainization.md#9-eligibility-boundary (lines 204–204); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 9. Eligibility Boundary

Eligibility should be declared in the direction that minimizes maintenance:

```txt
agent type declares what it has:
  role
  persona / decision boundary
  skills

task-spec declares what it needs:
  agent        # optional explicit pin
  requires-skill
```

Avoid the inverse shape where every agent type lists every task-spec id it can
handle. That creates an N-by-M maintenance problem: adding one task-spec forces
edits across many agent files.

Selection order:

1. `agent` pin on the task-spec wins outright.
2. Without a pin, keep the current agent type when it satisfies
   `requires-skill`.
3. Otherwise choose deterministically from matching agent types by declaration
   order.

The same eligibility mechanism applies to stage-entry work and to declared
collaboration calls. They differ only in which task-spec is being matched.
````

### Full target shown text

````text
## 9. Eligibility Boundary

Eligibility should be declared in the direction that minimizes maintenance:

```txt
agent type declares what it has:
  role
  persona / decision boundary
  skills

task-spec declares what it needs:
  agent        # optional explicit pin
  requires-skill
```

Avoid the inverse shape where every agent type lists every task-spec id it can
handle. That creates an N-by-M maintenance problem: adding one task-spec forces
edits across many agent files.

Selection order:

1. `agent` pin on the task-spec wins outright.
2. Without a pin, keep the current agent type when it satisfies
   `requires-skill`.
3. Otherwise choose deterministically from matching agent types by declaration
   order.

The same eligibility mechanism applies to stage-entry work and to declared
collaboration calls. They differ only in which task-spec is being matched.
````

## claim_b7bba907b8ec21df0cbc55e84207cb59

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-35, lines 182–182.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-38.
Source digest: 20fd4ae4713296a0cb10b804c0f071d2b459bfec1bb55cccb566171682b8edde
Target digest: 20fd4ae4713296a0cb10b804c0f071d2b459bfec1bb55cccb566171682b8edde
Shown source SHA256: 20fd4ae4713296a0cb10b804c0f071d2b459bfec1bb55cccb566171682b8edde
Shown target SHA256: 20fd4ae4713296a0cb10b804c0f071d2b459bfec1bb55cccb566171682b8edde

### Proposed decision

```json
{
  "claimId": "claim_b7bba907b8ec21df0cbc55e84207cb59",
  "sourceUnitDigest": "20fd4ae4713296a0cb10b804c0f071d2b459bfec1bb55cccb566171682b8edde",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "20fd4ae4713296a0cb10b804c0f071d2b459bfec1bb55cccb566171682b8edde",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "9. Eligibility Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-35 (lines 182–182) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-38 (lines 206–206); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Eligibility should be declared in the direction that minimizes maintenance:
```

### Full target shown text

```text
Eligibility should be declared in the direction that minimizes maintenance:
```

## claim_85ddf8243527db46b1b67b2fed3d1bf9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-36, lines 184–193.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-39.
Source digest: ec41e40863d154d928fd75e0061c3e1e80f3c50e8d9094af3dd3200102011a56
Target digest: ec41e40863d154d928fd75e0061c3e1e80f3c50e8d9094af3dd3200102011a56
Shown source SHA256: ec41e40863d154d928fd75e0061c3e1e80f3c50e8d9094af3dd3200102011a56
Shown target SHA256: ec41e40863d154d928fd75e0061c3e1e80f3c50e8d9094af3dd3200102011a56

### Proposed decision

```json
{
  "claimId": "claim_85ddf8243527db46b1b67b2fed3d1bf9",
  "sourceUnitDigest": "ec41e40863d154d928fd75e0061c3e1e80f3c50e8d9094af3dd3200102011a56",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "ec41e40863d154d928fd75e0061c3e1e80f3c50e8d9094af3dd3200102011a56",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "9. Eligibility Boundary"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-36 (lines 184–193) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-39 (lines 208–217); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
agent type declares what it has:
  role
  persona / decision boundary
  skills

task-spec declares what it needs:
  agent        # optional explicit pin
  requires-skill
```
````

### Full target shown text

````text
```txt
agent type declares what it has:
  role
  persona / decision boundary
  skills

task-spec declares what it needs:
  agent        # optional explicit pin
  requires-skill
```
````

## claim_fc1465367dc79886fc49e3eb9609d2f0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-37, lines 195–197.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-40.
Source digest: de9c5f51c49873c7021bd1c7f78f98a8c41ed96acb12b291b3a0a0be8eaf6c10
Target digest: de9c5f51c49873c7021bd1c7f78f98a8c41ed96acb12b291b3a0a0be8eaf6c10
Shown source SHA256: de9c5f51c49873c7021bd1c7f78f98a8c41ed96acb12b291b3a0a0be8eaf6c10
Shown target SHA256: de9c5f51c49873c7021bd1c7f78f98a8c41ed96acb12b291b3a0a0be8eaf6c10

### Proposed decision

```json
{
  "claimId": "claim_fc1465367dc79886fc49e3eb9609d2f0",
  "sourceUnitDigest": "de9c5f51c49873c7021bd1c7f78f98a8c41ed96acb12b291b3a0a0be8eaf6c10",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "de9c5f51c49873c7021bd1c7f78f98a8c41ed96acb12b291b3a0a0be8eaf6c10",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "9. Eligibility Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-37 (lines 195–197) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-40 (lines 219–221); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Avoid the inverse shape where every agent type lists every task-spec id it can
handle. That creates an N-by-M maintenance problem: adding one task-spec forces
edits across many agent files.
```

### Full target shown text

```text
Avoid the inverse shape where every agent type lists every task-spec id it can
handle. That creates an N-by-M maintenance problem: adding one task-spec forces
edits across many agent files.
```

## claim_0c7bd5743359f2ceed0172b7cffd811d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-38, lines 199–205.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-41.
Source digest: 443ed452e855dab44b0915e1c1ae767d96f4a6b285f8d0202d03ead6bcb9993e
Target digest: 443ed452e855dab44b0915e1c1ae767d96f4a6b285f8d0202d03ead6bcb9993e
Shown source SHA256: 443ed452e855dab44b0915e1c1ae767d96f4a6b285f8d0202d03ead6bcb9993e
Shown target SHA256: 443ed452e855dab44b0915e1c1ae767d96f4a6b285f8d0202d03ead6bcb9993e

### Proposed decision

```json
{
  "claimId": "claim_0c7bd5743359f2ceed0172b7cffd811d",
  "sourceUnitDigest": "443ed452e855dab44b0915e1c1ae767d96f4a6b285f8d0202d03ead6bcb9993e",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "443ed452e855dab44b0915e1c1ae767d96f4a6b285f8d0202d03ead6bcb9993e",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "9. Eligibility Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-38 (lines 199–205) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-41 (lines 223–229); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Selection order:

1. `agent` pin on the task-spec wins outright.
2. Without a pin, keep the current agent type when it satisfies
   `requires-skill`.
3. Otherwise choose deterministically from matching agent types by declaration
   order.
```

### Full target shown text

```text
Selection order:

1. `agent` pin on the task-spec wins outright.
2. Without a pin, keep the current agent type when it satisfies
   `requires-skill`.
3. Otherwise choose deterministically from matching agent types by declaration
   order.
```

## claim_1be81e886a0d1dd022e507989d5f59f1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-39, lines 207–208.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-42.
Source digest: e31a0bc47006a166217c5651b760a9aa56ffc2ec5660e762b27e0514320d3d7b
Target digest: e31a0bc47006a166217c5651b760a9aa56ffc2ec5660e762b27e0514320d3d7b
Shown source SHA256: e31a0bc47006a166217c5651b760a9aa56ffc2ec5660e762b27e0514320d3d7b
Shown target SHA256: e31a0bc47006a166217c5651b760a9aa56ffc2ec5660e762b27e0514320d3d7b

### Proposed decision

```json
{
  "claimId": "claim_1be81e886a0d1dd022e507989d5f59f1",
  "sourceUnitDigest": "e31a0bc47006a166217c5651b760a9aa56ffc2ec5660e762b27e0514320d3d7b",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "e31a0bc47006a166217c5651b760a9aa56ffc2ec5660e762b27e0514320d3d7b",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "9. Eligibility Boundary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-39 (lines 207–208) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-42 (lines 231–232); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The same eligibility mechanism applies to stage-entry work and to declared
collaboration calls. They differ only in which task-spec is being matched.
```

### Full target shown text

```text
The same eligibility mechanism applies to stage-entry work and to declared
collaboration calls. They differ only in which task-spec is being matched.
```

## claim_d82ce19a3f2a768902d46b6e4d2eeca5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#10-dispatch-routing-driving, lines 210–210.
Target: docs/platform/domainization/architecture/domainization.md#10-dispatch-routing-driving.
Source digest: 75fb19d3cb667e31b4144e90300da3eeff5adc567bde179ae82aaf981777dbbe
Target digest: 75fb19d3cb667e31b4144e90300da3eeff5adc567bde179ae82aaf981777dbbe
Shown source SHA256: d3cccb943f49cd83cfcfe2d4b1a700cc7885131f379973379e9e9ea278ab38ef
Shown target SHA256: d3cccb943f49cd83cfcfe2d4b1a700cc7885131f379973379e9e9ea278ab38ef

### Proposed decision

```json
{
  "claimId": "claim_d82ce19a3f2a768902d46b6e4d2eeca5",
  "sourceUnitDigest": "75fb19d3cb667e31b4144e90300da3eeff5adc567bde179ae82aaf981777dbbe",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "10-dispatch-routing-driving",
  "targetUnitDigest": "75fb19d3cb667e31b4144e90300da3eeff5adc567bde179ae82aaf981777dbbe",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#10-dispatch-routing-driving (lines 210–210) is carried at docs/platform/domainization/architecture/domainization.md#10-dispatch-routing-driving (lines 234–234); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 10. Dispatch / Routing / Driving

Domainization uses the existing execution concepts:

```txt
DISPATCH = chooses or validates the persona/executor for a work order
ROUTING = resolves the item's domain and loads domain doctrine
DRIVING = loops through the domain workflow stages
```

Driving should not stop merely because a stage would benefit from a different
persona. The default answer is a synchronous collaboration call through the
declared role graph while the same holder continues driving. Driving stops only
for an interaction that explicitly declares asynchronous handoff, such as a
review gate.

Synchronous collaboration needs a nesting-depth cap, not a lifetime call-count
cap. Sequential sync calls across stages are valid; nested sync calls can loop
and should be bounded.
````

### Full target shown text

````text
## 10. Dispatch / Routing / Driving

Domainization uses the existing execution concepts:

```txt
DISPATCH = chooses or validates the persona/executor for a work order
ROUTING = resolves the item's domain and loads domain doctrine
DRIVING = loops through the domain workflow stages
```

Driving should not stop merely because a stage would benefit from a different
persona. The default answer is a synchronous collaboration call through the
declared role graph while the same holder continues driving. Driving stops only
for an interaction that explicitly declares asynchronous handoff, such as a
review gate.

Synchronous collaboration needs a nesting-depth cap, not a lifetime call-count
cap. Sequential sync calls across stages are valid; nested sync calls can loop
and should be bounded.
````

## claim_adfb6b8e47c360bbd3933739f5000376

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-40, lines 212–212.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-43.
Source digest: 736d2745948a4f25cbf5b85e5b288aa5063cd6cdfaee854addb36e8e553b2b24
Target digest: 736d2745948a4f25cbf5b85e5b288aa5063cd6cdfaee854addb36e8e553b2b24
Shown source SHA256: 736d2745948a4f25cbf5b85e5b288aa5063cd6cdfaee854addb36e8e553b2b24
Shown target SHA256: 736d2745948a4f25cbf5b85e5b288aa5063cd6cdfaee854addb36e8e553b2b24

### Proposed decision

```json
{
  "claimId": "claim_adfb6b8e47c360bbd3933739f5000376",
  "sourceUnitDigest": "736d2745948a4f25cbf5b85e5b288aa5063cd6cdfaee854addb36e8e553b2b24",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "736d2745948a4f25cbf5b85e5b288aa5063cd6cdfaee854addb36e8e553b2b24",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "10. Dispatch / Routing / Driving"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-40 (lines 212–212) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-43 (lines 236–236); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Domainization uses the existing execution concepts:
```

### Full target shown text

```text
Domainization uses the existing execution concepts:
```

## claim_11dd3a68dca9fc16e1ea3fdc3675c457

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-41, lines 214–218.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-44.
Source digest: 56d967bcbc98b5bb327552afe517d80e464357cd60b5f4e074e05b862150bc10
Target digest: 56d967bcbc98b5bb327552afe517d80e464357cd60b5f4e074e05b862150bc10
Shown source SHA256: 56d967bcbc98b5bb327552afe517d80e464357cd60b5f4e074e05b862150bc10
Shown target SHA256: 56d967bcbc98b5bb327552afe517d80e464357cd60b5f4e074e05b862150bc10

### Proposed decision

```json
{
  "claimId": "claim_11dd3a68dca9fc16e1ea3fdc3675c457",
  "sourceUnitDigest": "56d967bcbc98b5bb327552afe517d80e464357cd60b5f4e074e05b862150bc10",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "56d967bcbc98b5bb327552afe517d80e464357cd60b5f4e074e05b862150bc10",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "10. Dispatch / Routing / Driving"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-41 (lines 214–218) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-44 (lines 238–242); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
DISPATCH = chooses or validates the persona/executor for a work order
ROUTING = resolves the item's domain and loads domain doctrine
DRIVING = loops through the domain workflow stages
```
````

### Full target shown text

````text
```txt
DISPATCH = chooses or validates the persona/executor for a work order
ROUTING = resolves the item's domain and loads domain doctrine
DRIVING = loops through the domain workflow stages
```
````

## claim_bcdbc2ea3ab214cbcbeb19b3d6de9ef3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-42, lines 220–224.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-45.
Source digest: c01c72dff1c2bc96c88d1600ee302b62b6d0b9dbdda689ad70d161f4725da587
Target digest: c01c72dff1c2bc96c88d1600ee302b62b6d0b9dbdda689ad70d161f4725da587
Shown source SHA256: c01c72dff1c2bc96c88d1600ee302b62b6d0b9dbdda689ad70d161f4725da587
Shown target SHA256: c01c72dff1c2bc96c88d1600ee302b62b6d0b9dbdda689ad70d161f4725da587

### Proposed decision

```json
{
  "claimId": "claim_bcdbc2ea3ab214cbcbeb19b3d6de9ef3",
  "sourceUnitDigest": "c01c72dff1c2bc96c88d1600ee302b62b6d0b9dbdda689ad70d161f4725da587",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "c01c72dff1c2bc96c88d1600ee302b62b6d0b9dbdda689ad70d161f4725da587",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "10. Dispatch / Routing / Driving"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-42 (lines 220–224) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-45 (lines 244–248); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Driving should not stop merely because a stage would benefit from a different
persona. The default answer is a synchronous collaboration call through the
declared role graph while the same holder continues driving. Driving stops only
for an interaction that explicitly declares asynchronous handoff, such as a
review gate.
```

### Full target shown text

```text
Driving should not stop merely because a stage would benefit from a different
persona. The default answer is a synchronous collaboration call through the
declared role graph while the same holder continues driving. Driving stops only
for an interaction that explicitly declares asynchronous handoff, such as a
review gate.
```

## claim_083c1d0b37d591e0f22b001024e1858b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-43, lines 226–228.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-46.
Source digest: c158a82110a07b6c5e224cb2be23fb2476027149cbe00863ae3b400e6c53a407
Target digest: c158a82110a07b6c5e224cb2be23fb2476027149cbe00863ae3b400e6c53a407
Shown source SHA256: c158a82110a07b6c5e224cb2be23fb2476027149cbe00863ae3b400e6c53a407
Shown target SHA256: c158a82110a07b6c5e224cb2be23fb2476027149cbe00863ae3b400e6c53a407

### Proposed decision

```json
{
  "claimId": "claim_083c1d0b37d591e0f22b001024e1858b",
  "sourceUnitDigest": "c158a82110a07b6c5e224cb2be23fb2476027149cbe00863ae3b400e6c53a407",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "c158a82110a07b6c5e224cb2be23fb2476027149cbe00863ae3b400e6c53a407",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "10. Dispatch / Routing / Driving"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-43 (lines 226–228) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-46 (lines 250–252); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Synchronous collaboration needs a nesting-depth cap, not a lifetime call-count
cap. Sequential sync calls across stages are valid; nested sync calls can loop
and should be bounded.
```

### Full target shown text

```text
Synchronous collaboration needs a nesting-depth cap, not a lifetime call-count
cap. Sequential sync calls across stages are valid; nested sync calls can loop
and should be bounded.
```

## claim_f98b83414f770d7181d6952a0cdaf5dd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#11-enforcement, lines 230–230.
Target: docs/platform/domainization/architecture/domainization.md#11-enforcement.
Source digest: 3b3b19ffe6a18d6e0dbaf73fb96a220e11bdf7696d6f56c0aba8f9ca454f4ed4
Target digest: 3b3b19ffe6a18d6e0dbaf73fb96a220e11bdf7696d6f56c0aba8f9ca454f4ed4
Shown source SHA256: b24a62425b634b69ef607bf02268ffb789bd362289dd410296c6de93a3484cf1
Shown target SHA256: b24a62425b634b69ef607bf02268ffb789bd362289dd410296c6de93a3484cf1

### Proposed decision

```json
{
  "claimId": "claim_f98b83414f770d7181d6952a0cdaf5dd",
  "sourceUnitDigest": "3b3b19ffe6a18d6e0dbaf73fb96a220e11bdf7696d6f56c0aba8f9ca454f4ed4",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "11-enforcement",
  "targetUnitDigest": "3b3b19ffe6a18d6e0dbaf73fb96a220e11bdf7696d6f56c0aba8f9ca454f4ed4",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#11-enforcement (lines 230–230) is carried at docs/platform/domainization/architecture/domainization.md#11-enforcement (lines 254–254); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 11. Enforcement

Domain boundaries should be mechanically checked where possible:

- core must not import a specific domain directly;
- one domain must not import another domain directly;
- cross-domain/core access should go through core resolvers or data contracts;
- generated render targets should be rebuilt from canonical authoring sources;
- setup/doctor should know about generated skill/agent outputs and uniqueness
  checks;
- task-spec and agent eligibility should fail loud when no valid match exists.

This should reuse the existing architecture-manifest/test approach where
possible instead of introducing a separate package system only for enforcement.
```

### Full target shown text

```text
## 11. Enforcement

Domain boundaries should be mechanically checked where possible:

- core must not import a specific domain directly;
- one domain must not import another domain directly;
- cross-domain/core access should go through core resolvers or data contracts;
- generated render targets should be rebuilt from canonical authoring sources;
- setup/doctor should know about generated skill/agent outputs and uniqueness
  checks;
- task-spec and agent eligibility should fail loud when no valid match exists.

This should reuse the existing architecture-manifest/test approach where
possible instead of introducing a separate package system only for enforcement.
```

## claim_e9fd26a4913a17e8524edf935dbf5c8b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-44, lines 232–232.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-47.
Source digest: ca6581dadce7114ebbe78fc6339e3f8a25f3a2db4528b91d7fd100e84bd12cac
Target digest: ca6581dadce7114ebbe78fc6339e3f8a25f3a2db4528b91d7fd100e84bd12cac
Shown source SHA256: ca6581dadce7114ebbe78fc6339e3f8a25f3a2db4528b91d7fd100e84bd12cac
Shown target SHA256: ca6581dadce7114ebbe78fc6339e3f8a25f3a2db4528b91d7fd100e84bd12cac

### Proposed decision

```json
{
  "claimId": "claim_e9fd26a4913a17e8524edf935dbf5c8b",
  "sourceUnitDigest": "ca6581dadce7114ebbe78fc6339e3f8a25f3a2db4528b91d7fd100e84bd12cac",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "ca6581dadce7114ebbe78fc6339e3f8a25f3a2db4528b91d7fd100e84bd12cac",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "11. Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-44 (lines 232–232) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-47 (lines 256–256); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Domain boundaries should be mechanically checked where possible:
```

### Full target shown text

```text
Domain boundaries should be mechanically checked where possible:
```

## claim_04a8023bf200bc5f05da9b1b462270e7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-45, lines 234–240.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-48.
Source digest: 15d34fc0a62416120837b6b780196098b2c3e1a17663b9ff09c2ea83dd745927
Target digest: 15d34fc0a62416120837b6b780196098b2c3e1a17663b9ff09c2ea83dd745927
Shown source SHA256: 15d34fc0a62416120837b6b780196098b2c3e1a17663b9ff09c2ea83dd745927
Shown target SHA256: 15d34fc0a62416120837b6b780196098b2c3e1a17663b9ff09c2ea83dd745927

### Proposed decision

```json
{
  "claimId": "claim_04a8023bf200bc5f05da9b1b462270e7",
  "sourceUnitDigest": "15d34fc0a62416120837b6b780196098b2c3e1a17663b9ff09c2ea83dd745927",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "15d34fc0a62416120837b6b780196098b2c3e1a17663b9ff09c2ea83dd745927",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "11. Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-45 (lines 234–240) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-48 (lines 258–264); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- core must not import a specific domain directly;
- one domain must not import another domain directly;
- cross-domain/core access should go through core resolvers or data contracts;
- generated render targets should be rebuilt from canonical authoring sources;
- setup/doctor should know about generated skill/agent outputs and uniqueness
  checks;
- task-spec and agent eligibility should fail loud when no valid match exists.
```

### Full target shown text

```text
- core must not import a specific domain directly;
- one domain must not import another domain directly;
- cross-domain/core access should go through core resolvers or data contracts;
- generated render targets should be rebuilt from canonical authoring sources;
- setup/doctor should know about generated skill/agent outputs and uniqueness
  checks;
- task-spec and agent eligibility should fail loud when no valid match exists.
```

## claim_07e1b5f7056b525ba4f737337eea2ebe

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-46, lines 242–243.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-49.
Source digest: 7602eefaf445f727f47f283a621558abd2ed40411e9b2716527a91ea52a38063
Target digest: 7602eefaf445f727f47f283a621558abd2ed40411e9b2716527a91ea52a38063
Shown source SHA256: 7602eefaf445f727f47f283a621558abd2ed40411e9b2716527a91ea52a38063
Shown target SHA256: 7602eefaf445f727f47f283a621558abd2ed40411e9b2716527a91ea52a38063

### Proposed decision

```json
{
  "claimId": "claim_07e1b5f7056b525ba4f737337eea2ebe",
  "sourceUnitDigest": "7602eefaf445f727f47f283a621558abd2ed40411e9b2716527a91ea52a38063",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "7602eefaf445f727f47f283a621558abd2ed40411e9b2716527a91ea52a38063",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "11. Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-46 (lines 242–243) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-49 (lines 266–267); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This should reuse the existing architecture-manifest/test approach where
possible instead of introducing a separate package system only for enforcement.
```

### Full target shown text

```text
This should reuse the existing architecture-manifest/test approach where
possible instead of introducing a separate package system only for enforcement.
```

## claim_b121a4524ae5b6e884160e716c09d134

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#12-what-stays-out, lines 245–245.
Target: docs/platform/domainization/architecture/domainization.md#12-what-stays-out.
Source digest: d189e8051fc111630645026f5ee1e6ac7ca1493c5224f0baf7a8d3e500968c4b
Target digest: d189e8051fc111630645026f5ee1e6ac7ca1493c5224f0baf7a8d3e500968c4b
Shown source SHA256: 156673a22d78ba396618841942b373ceae0d4c9aeaf6b0031aab378a76ee8452
Shown target SHA256: 156673a22d78ba396618841942b373ceae0d4c9aeaf6b0031aab378a76ee8452

### Proposed decision

```json
{
  "claimId": "claim_b121a4524ae5b6e884160e716c09d134",
  "sourceUnitDigest": "d189e8051fc111630645026f5ee1e6ac7ca1493c5224f0baf7a8d3e500968c4b",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "12-what-stays-out",
  "targetUnitDigest": "d189e8051fc111630645026f5ee1e6ac7ca1493c5224f0baf7a8d3e500968c4b",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#12-what-stays-out (lines 245–245) is carried at docs/platform/domainization/architecture/domainization.md#12-what-stays-out (lines 269–269); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 12. What Stays Out

Domainization is not a mandate to relocate all core runtime code.

`bin/`, `src/`, and `herdr-dashboard/` can remain at top level while still being
core. Moving heavily referenced runtime paths only to make the tree look
symmetrical creates churn without clarifying authority.

Domainization is also not a mandate to make every domain file private to that
domain. A domain-authored skill or agent type may be eligible elsewhere if its
declared capabilities match. File location records ownership and default
flavor; contracts decide legal use.
```

### Full target shown text

```text
## 12. What Stays Out

Domainization is not a mandate to relocate all core runtime code.

`bin/`, `src/`, and `herdr-dashboard/` can remain at top level while still being
core. Moving heavily referenced runtime paths only to make the tree look
symmetrical creates churn without clarifying authority.

Domainization is also not a mandate to make every domain file private to that
domain. A domain-authored skill or agent type may be eligible elsewhere if its
declared capabilities match. File location records ownership and default
flavor; contracts decide legal use.
```

## claim_93494435c58d71196be30d8f8ce48863

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-47, lines 247–247.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-50.
Source digest: de3904ecf55a9566a8625a9d56fbb20e03f526d9d1f8a0521214d06b5eaa7a2c
Target digest: de3904ecf55a9566a8625a9d56fbb20e03f526d9d1f8a0521214d06b5eaa7a2c
Shown source SHA256: de3904ecf55a9566a8625a9d56fbb20e03f526d9d1f8a0521214d06b5eaa7a2c
Shown target SHA256: de3904ecf55a9566a8625a9d56fbb20e03f526d9d1f8a0521214d06b5eaa7a2c

### Proposed decision

```json
{
  "claimId": "claim_93494435c58d71196be30d8f8ce48863",
  "sourceUnitDigest": "de3904ecf55a9566a8625a9d56fbb20e03f526d9d1f8a0521214d06b5eaa7a2c",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "de3904ecf55a9566a8625a9d56fbb20e03f526d9d1f8a0521214d06b5eaa7a2c",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "12. What Stays Out"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-47 (lines 247–247) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-50 (lines 271–271); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Domainization is not a mandate to relocate all core runtime code.
```

### Full target shown text

```text
Domainization is not a mandate to relocate all core runtime code.
```

## claim_3fe82685b1d3480be2995228b3450123

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-48, lines 249–251.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-51.
Source digest: 1150c454d5d31698b898b7a4fd4f903c2ce976532debc525cb1f7669a5c549b0
Target digest: 1150c454d5d31698b898b7a4fd4f903c2ce976532debc525cb1f7669a5c549b0
Shown source SHA256: 1150c454d5d31698b898b7a4fd4f903c2ce976532debc525cb1f7669a5c549b0
Shown target SHA256: 1150c454d5d31698b898b7a4fd4f903c2ce976532debc525cb1f7669a5c549b0

### Proposed decision

```json
{
  "claimId": "claim_3fe82685b1d3480be2995228b3450123",
  "sourceUnitDigest": "1150c454d5d31698b898b7a4fd4f903c2ce976532debc525cb1f7669a5c549b0",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "1150c454d5d31698b898b7a4fd4f903c2ce976532debc525cb1f7669a5c549b0",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "12. What Stays Out"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-48 (lines 249–251) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-51 (lines 273–275); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`bin/`, `src/`, and `herdr-dashboard/` can remain at top level while still being
core. Moving heavily referenced runtime paths only to make the tree look
symmetrical creates churn without clarifying authority.
```

### Full target shown text

```text
`bin/`, `src/`, and `herdr-dashboard/` can remain at top level while still being
core. Moving heavily referenced runtime paths only to make the tree look
symmetrical creates churn without clarifying authority.
```

## claim_e524c4564877c432ae6031485125a1f5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-49, lines 253–256.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-52.
Source digest: 1db467ccbcac0451b28f1da60b88274c393db89ed903d47fe898ddf166a9cad5
Target digest: 1db467ccbcac0451b28f1da60b88274c393db89ed903d47fe898ddf166a9cad5
Shown source SHA256: 1db467ccbcac0451b28f1da60b88274c393db89ed903d47fe898ddf166a9cad5
Shown target SHA256: 1db467ccbcac0451b28f1da60b88274c393db89ed903d47fe898ddf166a9cad5

### Proposed decision

```json
{
  "claimId": "claim_e524c4564877c432ae6031485125a1f5",
  "sourceUnitDigest": "1db467ccbcac0451b28f1da60b88274c393db89ed903d47fe898ddf166a9cad5",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "1db467ccbcac0451b28f1da60b88274c393db89ed903d47fe898ddf166a9cad5",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "12. What Stays Out"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-49 (lines 253–256) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-52 (lines 277–280); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Domainization is also not a mandate to make every domain file private to that
domain. A domain-authored skill or agent type may be eligible elsewhere if its
declared capabilities match. File location records ownership and default
flavor; contracts decide legal use.
```

### Full target shown text

```text
Domainization is also not a mandate to make every domain file private to that
domain. A domain-authored skill or agent type may be eligible elsewhere if its
declared capabilities match. File location records ownership and default
flavor; contracts decide legal use.
```

## claim_b95267e9d8d460637fc5fbb7eaae0373

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/domainization/README.md#13-implementation-slices, lines 258–258.
Target: docs/platform/domainization/architecture/domainization.md#13-implementation-slices.
Source digest: 43e0ffde07072296cf125d2f1d16e0491831e043e6f9adbf7d8d384aa182c35e
Target digest: 43e0ffde07072296cf125d2f1d16e0491831e043e6f9adbf7d8d384aa182c35e
Shown source SHA256: 665929329737bd1ee2cc0d409e0b996cc770b2a5276a8446a30cd3489e3ae101
Shown target SHA256: 665929329737bd1ee2cc0d409e0b996cc770b2a5276a8446a30cd3489e3ae101

### Proposed decision

```json
{
  "claimId": "claim_b95267e9d8d460637fc5fbb7eaae0373",
  "sourceUnitDigest": "43e0ffde07072296cf125d2f1d16e0491831e043e6f9adbf7d8d384aa182c35e",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "13-implementation-slices",
  "targetUnitDigest": "43e0ffde07072296cf125d2f1d16e0491831e043e6f9adbf7d8d384aa182c35e",
  "targetAncestry": [
    "fgOS Domainization Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source heading docs/architect/domainization/README.md#13-implementation-slices (lines 258–258) is carried at docs/platform/domainization/architecture/domainization.md#13-implementation-slices (lines 282–282); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 13. Implementation Slices

The domainization material decomposes into these implementation slices:

- split domain declaration into `manifest.yaml` plus `workflows/*.yaml`, with core
  aggregation and normalization;
- move coding task-specs from `docs/task-specs/coding/` to
  `domains/coding/task-specs/`;
- add `resolveTaskSpecPath(domain, specId)`;
- add `bundleForStage(domain, stage, item kind)` returning `{skill, taskSpec}`;
- split skill authoring into `core/skills/` and `domains/<domain>/skills/`,
  then assemble existing render targets;
- split agent authoring into `core/agents/` and `domains/<domain>/agents/`,
  then render the flat `.claude/agents/` target with uniqueness checks;
- move domain-specific doctrine into `domains/<domain>/AGENTS.md` and teach
  routing to read it after domain resolution;
- create `core/task-specs/` for domain-agnostic skills;
- invert eligibility from agent `claims` to agent `skills` plus task-spec
  `requires-skill` / `agent`;
- add a domain-siloing architecture check;
- cap nested sync collaboration depth.

Each slice should leave existing host-facing surfaces stable unless its own
contract explicitly says otherwise.
```

### Full target shown text

```text
## 13. Implementation Slices

The domainization material decomposes into these implementation slices:

- split domain declaration into `manifest.yaml` plus `workflows/*.yaml`, with core
  aggregation and normalization;
- move coding task-specs from `docs/task-specs/coding/` to
  `domains/coding/task-specs/`;
- add `resolveTaskSpecPath(domain, specId)`;
- add `bundleForStage(domain, stage, item kind)` returning `{skill, taskSpec}`;
- split skill authoring into `core/skills/` and `domains/<domain>/skills/`,
  then assemble existing render targets;
- split agent authoring into `core/agents/` and `domains/<domain>/agents/`,
  then render the flat `.claude/agents/` target with uniqueness checks;
- move domain-specific doctrine into `domains/<domain>/AGENTS.md` and teach
  routing to read it after domain resolution;
- create `core/task-specs/` for domain-agnostic skills;
- invert eligibility from agent `claims` to agent `skills` plus task-spec
  `requires-skill` / `agent`;
- add a domain-siloing architecture check;
- cap nested sync collaboration depth.

Each slice should leave existing host-facing surfaces stable unless its own
contract explicitly says otherwise.
```

## claim_ad0dbc94fab9ad85806b458863ec4936

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-50, lines 260–260.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-53.
Source digest: 9ca8a00fead71b33e6e15ccabc16c55d93257b70f769d357265192cdeaad9470
Target digest: 9ca8a00fead71b33e6e15ccabc16c55d93257b70f769d357265192cdeaad9470
Shown source SHA256: 9ca8a00fead71b33e6e15ccabc16c55d93257b70f769d357265192cdeaad9470
Shown target SHA256: 9ca8a00fead71b33e6e15ccabc16c55d93257b70f769d357265192cdeaad9470

### Proposed decision

```json
{
  "claimId": "claim_ad0dbc94fab9ad85806b458863ec4936",
  "sourceUnitDigest": "9ca8a00fead71b33e6e15ccabc16c55d93257b70f769d357265192cdeaad9470",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "9ca8a00fead71b33e6e15ccabc16c55d93257b70f769d357265192cdeaad9470",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "13. Implementation Slices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-50 (lines 260–260) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-53 (lines 284–284); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The domainization material decomposes into these implementation slices:
```

### Full target shown text

```text
The domainization material decomposes into these implementation slices:
```

## claim_eef524ccdffda3ec8afb3325cc5d1b0b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-51, lines 262–278.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-54.
Source digest: 3852c9b4afc403536d7d7e7546b6940843899ae6fbc4ab0bb47237ad9528893e
Target digest: 3852c9b4afc403536d7d7e7546b6940843899ae6fbc4ab0bb47237ad9528893e
Shown source SHA256: 3852c9b4afc403536d7d7e7546b6940843899ae6fbc4ab0bb47237ad9528893e
Shown target SHA256: 3852c9b4afc403536d7d7e7546b6940843899ae6fbc4ab0bb47237ad9528893e

### Proposed decision

```json
{
  "claimId": "claim_eef524ccdffda3ec8afb3325cc5d1b0b",
  "sourceUnitDigest": "3852c9b4afc403536d7d7e7546b6940843899ae6fbc4ab0bb47237ad9528893e",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "3852c9b4afc403536d7d7e7546b6940843899ae6fbc4ab0bb47237ad9528893e",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "13. Implementation Slices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-51 (lines 262–278) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-54 (lines 286–302); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- split domain declaration into `manifest.yaml` plus `workflows/*.yaml`, with core
  aggregation and normalization;
- move coding task-specs from `docs/task-specs/coding/` to
  `domains/coding/task-specs/`;
- add `resolveTaskSpecPath(domain, specId)`;
- add `bundleForStage(domain, stage, item kind)` returning `{skill, taskSpec}`;
- split skill authoring into `core/skills/` and `domains/<domain>/skills/`,
  then assemble existing render targets;
- split agent authoring into `core/agents/` and `domains/<domain>/agents/`,
  then render the flat `.claude/agents/` target with uniqueness checks;
- move domain-specific doctrine into `domains/<domain>/AGENTS.md` and teach
  routing to read it after domain resolution;
- create `core/task-specs/` for domain-agnostic skills;
- invert eligibility from agent `claims` to agent `skills` plus task-spec
  `requires-skill` / `agent`;
- add a domain-siloing architecture check;
- cap nested sync collaboration depth.
```

### Full target shown text

```text
- split domain declaration into `manifest.yaml` plus `workflows/*.yaml`, with core
  aggregation and normalization;
- move coding task-specs from `docs/task-specs/coding/` to
  `domains/coding/task-specs/`;
- add `resolveTaskSpecPath(domain, specId)`;
- add `bundleForStage(domain, stage, item kind)` returning `{skill, taskSpec}`;
- split skill authoring into `core/skills/` and `domains/<domain>/skills/`,
  then assemble existing render targets;
- split agent authoring into `core/agents/` and `domains/<domain>/agents/`,
  then render the flat `.claude/agents/` target with uniqueness checks;
- move domain-specific doctrine into `domains/<domain>/AGENTS.md` and teach
  routing to read it after domain resolution;
- create `core/task-specs/` for domain-agnostic skills;
- invert eligibility from agent `claims` to agent `skills` plus task-spec
  `requires-skill` / `agent`;
- add a domain-siloing architecture check;
- cap nested sync collaboration depth.
```

## claim_f0a4fcda68a4ccf1d03c06882cd37905

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/domainization/README.md#unheaded-block-52, lines 280–281.
Target: docs/platform/domainization/architecture/domainization.md#unheaded-block-55.
Source digest: 9982c504dd07507023a1fb08a8d621d81774efc3de7dba949d4dbe02867c7a2a
Target digest: 9982c504dd07507023a1fb08a8d621d81774efc3de7dba949d4dbe02867c7a2a
Shown source SHA256: 9982c504dd07507023a1fb08a8d621d81774efc3de7dba949d4dbe02867c7a2a
Shown target SHA256: 9982c504dd07507023a1fb08a8d621d81774efc3de7dba949d4dbe02867c7a2a

### Proposed decision

```json
{
  "claimId": "claim_f0a4fcda68a4ccf1d03c06882cd37905",
  "sourceUnitDigest": "9982c504dd07507023a1fb08a8d621d81774efc3de7dba949d4dbe02867c7a2a",
  "targetOwner": "docs/platform/domainization/architecture/domainization.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "9982c504dd07507023a1fb08a8d621d81774efc3de7dba949d4dbe02867c7a2a",
  "targetAncestry": [
    "fgOS Domainization Architecture",
    "13. Implementation Slices"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain mapped architecture; preserve advisory and partial status verbatim. Evidence: docs/specs/reading-map.md:40 and docs/platform/component-boundary.md:241,1364 still route to this direction. domains/coding/AGENTS.md, domains/coding/registry.yaml and domains/marketing/AGENTS.md survive. Source lines 29–43 states the closed-core/open-domain rule. Complete source unheaded-block docs/architect/domainization/README.md#unheaded-block-52 (lines 280–281) is carried at docs/platform/domainization/architecture/domainization.md#unheaded-block-55 (lines 304–305); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Each slice should leave existing host-facing surfaces stable unless its own
contract explicitly says otherwise.
```

### Full target shown text

```text
Each slice should leave existing host-facing surfaces stable unless its own
contract explicitly says otherwise.
```
