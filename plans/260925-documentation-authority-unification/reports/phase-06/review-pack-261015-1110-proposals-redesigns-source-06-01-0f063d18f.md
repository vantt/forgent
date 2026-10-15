# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-06-knowledge-registry-redesign.json
Original shard SHA256: e24cf43c232be914afa51eac204db30de7609051b7c5ab1a22c4d1e8eae284cf
Source file: docs/architect/knowledge-registry-redesign.md
Part 1/3; entries: **80**. Source-file group 6/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (1): `claim_44f33af5bfe639da4877db2c7693d7d9`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 32; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_44f33af5bfe639da4877db2c7693d7d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/knowledge-registry-redesign.md#knowledge-registry-redesign, lines 1–1.
Target: docs/platform/proposals/knowledge-registry-redesign.md#knowledge-registry-redesign.
Source digest: cc375c4be5acee5826f56134d7ba92e21e6e55e338798fa15f1aa49f03a3c213
Target digest: dc2da928b0906d4329164efd39fe02fc8445b01bb03546887963170d5d909a81
Shown source SHA256: 45922667c48f784d017ebda37b2f3101feaa3d0c00b3fe7c122d9efc77cac8d5
Shown target SHA256: 46c9465fe85014965f7d00842de515cfd268ab7d17159a9886ca3dec00b3dbd3

### Proposed decision

```json
{
  "claimId": "claim_44f33af5bfe639da4877db2c7693d7d9",
  "sourceUnitDigest": "cc375c4be5acee5826f56134d7ba92e21e6e55e338798fa15f1aa49f03a3c213",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "knowledge-registry-redesign",
  "targetUnitDigest": "dc2da928b0906d4329164efd39fe02fc8445b01bb03546887963170d5d909a81",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#knowledge-registry-redesign (lines 1–1) is carried at docs/platform/proposals/knowledge-registry-redesign.md#knowledge-registry-redesign (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
# Knowledge Registry Redesign

Status: design target
Date: 2026-08-25
Scope: retrospective knowledge, end-user document identity, topic/doc registry, source linkage, migration, and harness enforcement
```

### Full target shown text

````text
# Knowledge Registry Redesign

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/knowledge-registry-redesign.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob ace04a2ddb00e44cf28f39f1f9cfd20d37362d75
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/knowledge-registry-redesign.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/knowledge-registry-redesign.md).


Status: design target
Date: 2026-08-25
Scope: retrospective knowledge, end-user document identity, topic/doc registry, source linkage, migration, and harness enforcement
````

## claim_736a70797d7977a9b389a38ff283ee0a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-1, lines 3–5.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-4.
Source digest: 8684029c4fe3bdd0c4bac84787e353e7f8be55e005f360bef1fd55ea47429d2c
Target digest: 8684029c4fe3bdd0c4bac84787e353e7f8be55e005f360bef1fd55ea47429d2c
Shown source SHA256: 8684029c4fe3bdd0c4bac84787e353e7f8be55e005f360bef1fd55ea47429d2c
Shown target SHA256: 8684029c4fe3bdd0c4bac84787e353e7f8be55e005f360bef1fd55ea47429d2c

### Proposed decision

```json
{
  "claimId": "claim_736a70797d7977a9b389a38ff283ee0a",
  "sourceUnitDigest": "8684029c4fe3bdd0c4bac84787e353e7f8be55e005f360bef1fd55ea47429d2c",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "8684029c4fe3bdd0c4bac84787e353e7f8be55e005f360bef1fd55ea47429d2c",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-1 (lines 3–5) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-4 (lines 27–29); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Status: design target
Date: 2026-08-25
Scope: retrospective knowledge, end-user document identity, topic/doc registry, source linkage, migration, and harness enforcement
```

### Full target shown text

```text
Status: design target
Date: 2026-08-25
Scope: retrospective knowledge, end-user document identity, topic/doc registry, source linkage, migration, and harness enforcement
```

## claim_34935642c74685c47d85513a9050eba3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#1-problem-statement, lines 7–7.
Target: docs/platform/proposals/knowledge-registry-redesign.md#1-problem-statement.
Source digest: 90fe8d265a69a86bf72e2531d87615188b95c45791ddeb50b428265d8f69ba33
Target digest: 90fe8d265a69a86bf72e2531d87615188b95c45791ddeb50b428265d8f69ba33
Shown source SHA256: 7f20e7bbb9bee1eaa5261248292d7157c9baf5a4c6ee49620168670b7bf755df
Shown target SHA256: 7f20e7bbb9bee1eaa5261248292d7157c9baf5a4c6ee49620168670b7bf755df

### Proposed decision

```json
{
  "claimId": "claim_34935642c74685c47d85513a9050eba3",
  "sourceUnitDigest": "90fe8d265a69a86bf72e2531d87615188b95c45791ddeb50b428265d8f69ba33",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "1-problem-statement",
  "targetUnitDigest": "90fe8d265a69a86bf72e2531d87615188b95c45791ddeb50b428265d8f69ba33",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#1-problem-statement (lines 7–7) is carried at docs/platform/proposals/knowledge-registry-redesign.md#1-problem-statement (lines 31–31); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 1. Problem Statement

fgOS turns completed work into end-user documentation during the retrospective part of the work-item lifecycle. The current mechanism classifies each document by one axis: the Diataxis quadrant. The quadrant also determines where the file lives, because documents are written under `docs/<quadrant>/`.

That single axis now carries three different jobs:

1. how the document should be written;
2. where the document should live;
3. what the document is about and which long-lived knowledge slot owns it.

This creates a structural sprawl problem. Each retrospective run can choose a new filename from local judgment, check whether that exact path exists, and create a new document when it does not. There is no mandatory registry-level answer to "does this subject already have a home?"

Measured on the design-source snapshot from 2026-08-25, the end-user corpus has 268 documents: 161 explanation, 85 how-to, 21 reference, and 1 tutorial. It had grown by 50 documents in 7 days. At that rate, the corpus doubles in roughly five weeks if the shape does not change. A separate name-level measurement found at least 93 of 330 document names touching two or more entities, so entity-as-folder is not viable.

The immediate failure is not that the prose is low value. The failure is that knowledge identity is inferred from path spelling at write time instead of being owned by a registry.
```

### Full target shown text

```text
## 1. Problem Statement

fgOS turns completed work into end-user documentation during the retrospective part of the work-item lifecycle. The current mechanism classifies each document by one axis: the Diataxis quadrant. The quadrant also determines where the file lives, because documents are written under `docs/<quadrant>/`.

That single axis now carries three different jobs:

1. how the document should be written;
2. where the document should live;
3. what the document is about and which long-lived knowledge slot owns it.

This creates a structural sprawl problem. Each retrospective run can choose a new filename from local judgment, check whether that exact path exists, and create a new document when it does not. There is no mandatory registry-level answer to "does this subject already have a home?"

Measured on the design-source snapshot from 2026-08-25, the end-user corpus has 268 documents: 161 explanation, 85 how-to, 21 reference, and 1 tutorial. It had grown by 50 documents in 7 days. At that rate, the corpus doubles in roughly five weeks if the shape does not change. A separate name-level measurement found at least 93 of 330 document names touching two or more entities, so entity-as-folder is not viable.

The immediate failure is not that the prose is low value. The failure is that knowledge identity is inferred from path spelling at write time instead of being owned by a registry.
```

## claim_7b8d9c9f9f3edd8b3a3e2477280acd6b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-2, lines 9–9.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-5.
Source digest: f466eae72501cb280cdace8983dca5caa0d51240aa590d7aa96b9240fdf55d8a
Target digest: f466eae72501cb280cdace8983dca5caa0d51240aa590d7aa96b9240fdf55d8a
Shown source SHA256: f466eae72501cb280cdace8983dca5caa0d51240aa590d7aa96b9240fdf55d8a
Shown target SHA256: f466eae72501cb280cdace8983dca5caa0d51240aa590d7aa96b9240fdf55d8a

### Proposed decision

```json
{
  "claimId": "claim_7b8d9c9f9f3edd8b3a3e2477280acd6b",
  "sourceUnitDigest": "f466eae72501cb280cdace8983dca5caa0d51240aa590d7aa96b9240fdf55d8a",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "f466eae72501cb280cdace8983dca5caa0d51240aa590d7aa96b9240fdf55d8a",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-2 (lines 9–9) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-5 (lines 33–33); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
fgOS turns completed work into end-user documentation during the retrospective part of the work-item lifecycle. The current mechanism classifies each document by one axis: the Diataxis quadrant. The quadrant also determines where the file lives, because documents are written under `docs/<quadrant>/`.
```

### Full target shown text

```text
fgOS turns completed work into end-user documentation during the retrospective part of the work-item lifecycle. The current mechanism classifies each document by one axis: the Diataxis quadrant. The quadrant also determines where the file lives, because documents are written under `docs/<quadrant>/`.
```

## claim_7deb7ac6665d756b638ae1f58955455d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-3, lines 11–11.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-6.
Source digest: 50de194206d487e878d9de452d81c4d2fbaf1f0cfdfc21e4cd0aeb1489923c44
Target digest: 50de194206d487e878d9de452d81c4d2fbaf1f0cfdfc21e4cd0aeb1489923c44
Shown source SHA256: 50de194206d487e878d9de452d81c4d2fbaf1f0cfdfc21e4cd0aeb1489923c44
Shown target SHA256: 50de194206d487e878d9de452d81c4d2fbaf1f0cfdfc21e4cd0aeb1489923c44

### Proposed decision

```json
{
  "claimId": "claim_7deb7ac6665d756b638ae1f58955455d",
  "sourceUnitDigest": "50de194206d487e878d9de452d81c4d2fbaf1f0cfdfc21e4cd0aeb1489923c44",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "50de194206d487e878d9de452d81c4d2fbaf1f0cfdfc21e4cd0aeb1489923c44",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-3 (lines 11–11) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-6 (lines 35–35); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
That single axis now carries three different jobs:
```

### Full target shown text

```text
That single axis now carries three different jobs:
```

## claim_8b7c7f5034e0038c3065a9be4aba871e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-4, lines 13–15.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-7.
Source digest: b1d2e5a8ca127983c9ec3441bfb9af4a96c7767ed99a33580a0cc9d01f2c2e8c
Target digest: b1d2e5a8ca127983c9ec3441bfb9af4a96c7767ed99a33580a0cc9d01f2c2e8c
Shown source SHA256: b1d2e5a8ca127983c9ec3441bfb9af4a96c7767ed99a33580a0cc9d01f2c2e8c
Shown target SHA256: b1d2e5a8ca127983c9ec3441bfb9af4a96c7767ed99a33580a0cc9d01f2c2e8c

### Proposed decision

```json
{
  "claimId": "claim_8b7c7f5034e0038c3065a9be4aba871e",
  "sourceUnitDigest": "b1d2e5a8ca127983c9ec3441bfb9af4a96c7767ed99a33580a0cc9d01f2c2e8c",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "b1d2e5a8ca127983c9ec3441bfb9af4a96c7767ed99a33580a0cc9d01f2c2e8c",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-4 (lines 13–15) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-7 (lines 37–39); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. how the document should be written;
2. where the document should live;
3. what the document is about and which long-lived knowledge slot owns it.
```

### Full target shown text

```text
1. how the document should be written;
2. where the document should live;
3. what the document is about and which long-lived knowledge slot owns it.
```

## claim_87d3b01982cf1cc894979570b903e428

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-5, lines 17–17.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-8.
Source digest: 2b9e047e704a879ccee4053064403b21c0e57b1ae968be41d1cf4f7d8ac324dc
Target digest: 2b9e047e704a879ccee4053064403b21c0e57b1ae968be41d1cf4f7d8ac324dc
Shown source SHA256: 2b9e047e704a879ccee4053064403b21c0e57b1ae968be41d1cf4f7d8ac324dc
Shown target SHA256: 2b9e047e704a879ccee4053064403b21c0e57b1ae968be41d1cf4f7d8ac324dc

### Proposed decision

```json
{
  "claimId": "claim_87d3b01982cf1cc894979570b903e428",
  "sourceUnitDigest": "2b9e047e704a879ccee4053064403b21c0e57b1ae968be41d1cf4f7d8ac324dc",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "2b9e047e704a879ccee4053064403b21c0e57b1ae968be41d1cf4f7d8ac324dc",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-5 (lines 17–17) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-8 (lines 41–41); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This creates a structural sprawl problem. Each retrospective run can choose a new filename from local judgment, check whether that exact path exists, and create a new document when it does not. There is no mandatory registry-level answer to "does this subject already have a home?"
```

### Full target shown text

```text
This creates a structural sprawl problem. Each retrospective run can choose a new filename from local judgment, check whether that exact path exists, and create a new document when it does not. There is no mandatory registry-level answer to "does this subject already have a home?"
```

## claim_c5127b3928a6bbceac2e6fec60454cf3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-6, lines 19–19.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-9.
Source digest: f8e559d5e47c08579f7ba2e56e9e9e17144961d121cffa8cad25a9bbda8bc6a6
Target digest: f8e559d5e47c08579f7ba2e56e9e9e17144961d121cffa8cad25a9bbda8bc6a6
Shown source SHA256: f8e559d5e47c08579f7ba2e56e9e9e17144961d121cffa8cad25a9bbda8bc6a6
Shown target SHA256: f8e559d5e47c08579f7ba2e56e9e9e17144961d121cffa8cad25a9bbda8bc6a6

### Proposed decision

```json
{
  "claimId": "claim_c5127b3928a6bbceac2e6fec60454cf3",
  "sourceUnitDigest": "f8e559d5e47c08579f7ba2e56e9e9e17144961d121cffa8cad25a9bbda8bc6a6",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "f8e559d5e47c08579f7ba2e56e9e9e17144961d121cffa8cad25a9bbda8bc6a6",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-6 (lines 19–19) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-9 (lines 43–43); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Measured on the design-source snapshot from 2026-08-25, the end-user corpus has 268 documents: 161 explanation, 85 how-to, 21 reference, and 1 tutorial. It had grown by 50 documents in 7 days. At that rate, the corpus doubles in roughly five weeks if the shape does not change. A separate name-level measurement found at least 93 of 330 document names touching two or more entities, so entity-as-folder is not viable.
```

### Full target shown text

```text
Measured on the design-source snapshot from 2026-08-25, the end-user corpus has 268 documents: 161 explanation, 85 how-to, 21 reference, and 1 tutorial. It had grown by 50 documents in 7 days. At that rate, the corpus doubles in roughly five weeks if the shape does not change. A separate name-level measurement found at least 93 of 330 document names touching two or more entities, so entity-as-folder is not viable.
```

## claim_3dc523aa3b4f3a6a0852df9153882b10

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-7, lines 21–21.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-10.
Source digest: 19b664ff6d40f76e64e5c3858c38e4d1b7adfcad94738fb2093327b8f3378747
Target digest: 19b664ff6d40f76e64e5c3858c38e4d1b7adfcad94738fb2093327b8f3378747
Shown source SHA256: 19b664ff6d40f76e64e5c3858c38e4d1b7adfcad94738fb2093327b8f3378747
Shown target SHA256: 19b664ff6d40f76e64e5c3858c38e4d1b7adfcad94738fb2093327b8f3378747

### Proposed decision

```json
{
  "claimId": "claim_3dc523aa3b4f3a6a0852df9153882b10",
  "sourceUnitDigest": "19b664ff6d40f76e64e5c3858c38e4d1b7adfcad94738fb2093327b8f3378747",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "19b664ff6d40f76e64e5c3858c38e4d1b7adfcad94738fb2093327b8f3378747",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-7 (lines 21–21) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-10 (lines 45–45); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The immediate failure is not that the prose is low value. The failure is that knowledge identity is inferred from path spelling at write time instead of being owned by a registry.
```

### Full target shown text

```text
The immediate failure is not that the prose is low value. The failure is that knowledge identity is inferred from path spelling at write time instead of being owned by a registry.
```

## claim_b43e854fdbacb527b69c860c90f8fe3a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#2-goals, lines 23–23.
Target: docs/platform/proposals/knowledge-registry-redesign.md#2-goals.
Source digest: 955eea013604d0548dc6ba785be8ad6efe98b13fd6383364056e1808ac32989d
Target digest: 955eea013604d0548dc6ba785be8ad6efe98b13fd6383364056e1808ac32989d
Shown source SHA256: ad7abe047c224614bc3d5a215c627d236afc9404cbadd3ba996356d9a8ef635b
Shown target SHA256: ad7abe047c224614bc3d5a215c627d236afc9404cbadd3ba996356d9a8ef635b

### Proposed decision

```json
{
  "claimId": "claim_b43e854fdbacb527b69c860c90f8fe3a",
  "sourceUnitDigest": "955eea013604d0548dc6ba785be8ad6efe98b13fd6383364056e1808ac32989d",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "2-goals",
  "targetUnitDigest": "955eea013604d0548dc6ba785be8ad6efe98b13fd6383364056e1808ac32989d",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#2-goals (lines 23–23) is carried at docs/platform/proposals/knowledge-registry-redesign.md#2-goals (lines 47–47); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 2. Goals

1. Stop corpus growth from tracking work-item count.
2. Make each long-lived knowledge subject addressable before prose is written.
3. Preserve the useful part of Diataxis as a writing framework without making it the filesystem layout.
4. Keep topic and document identity durable across renames, splits, merges, and file moves.
5. Preserve all historical capture linkage without rewriting old capture events.
6. Let raw material be captured continuously without human approval.
7. Require explicit document promotion before rendered prose becomes authoritative, unless a future decision narrows that rule.
8. Close the write-time escape hatch in code, not by relying on skill prose or rollout order.
9. Make migration auditable with conservation: every old document is accounted for exactly once.
10. Provide a harness that proves the registry prevents sprawl, preserves source reachability, and keeps projections fresh.
```

### Full target shown text

```text
## 2. Goals

1. Stop corpus growth from tracking work-item count.
2. Make each long-lived knowledge subject addressable before prose is written.
3. Preserve the useful part of Diataxis as a writing framework without making it the filesystem layout.
4. Keep topic and document identity durable across renames, splits, merges, and file moves.
5. Preserve all historical capture linkage without rewriting old capture events.
6. Let raw material be captured continuously without human approval.
7. Require explicit document promotion before rendered prose becomes authoritative, unless a future decision narrows that rule.
8. Close the write-time escape hatch in code, not by relying on skill prose or rollout order.
9. Make migration auditable with conservation: every old document is accounted for exactly once.
10. Provide a harness that proves the registry prevents sprawl, preserves source reachability, and keeps projections fresh.
```

## claim_eee299eb5f12392ae6c32d17323c4d0f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-8, lines 25–34.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-11.
Source digest: ef7f5ef64bcd18c18838061503f8cb5c6e4fc15afdaf55ed40275d62494e7ddb
Target digest: ef7f5ef64bcd18c18838061503f8cb5c6e4fc15afdaf55ed40275d62494e7ddb
Shown source SHA256: ef7f5ef64bcd18c18838061503f8cb5c6e4fc15afdaf55ed40275d62494e7ddb
Shown target SHA256: ef7f5ef64bcd18c18838061503f8cb5c6e4fc15afdaf55ed40275d62494e7ddb

### Proposed decision

```json
{
  "claimId": "claim_eee299eb5f12392ae6c32d17323c4d0f",
  "sourceUnitDigest": "ef7f5ef64bcd18c18838061503f8cb5c6e4fc15afdaf55ed40275d62494e7ddb",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "ef7f5ef64bcd18c18838061503f8cb5c6e4fc15afdaf55ed40275d62494e7ddb",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "2. Goals"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-8 (lines 25–34) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-11 (lines 49–58); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Stop corpus growth from tracking work-item count.
2. Make each long-lived knowledge subject addressable before prose is written.
3. Preserve the useful part of Diataxis as a writing framework without making it the filesystem layout.
4. Keep topic and document identity durable across renames, splits, merges, and file moves.
5. Preserve all historical capture linkage without rewriting old capture events.
6. Let raw material be captured continuously without human approval.
7. Require explicit document promotion before rendered prose becomes authoritative, unless a future decision narrows that rule.
8. Close the write-time escape hatch in code, not by relying on skill prose or rollout order.
9. Make migration auditable with conservation: every old document is accounted for exactly once.
10. Provide a harness that proves the registry prevents sprawl, preserves source reachability, and keeps projections fresh.
```

### Full target shown text

```text
1. Stop corpus growth from tracking work-item count.
2. Make each long-lived knowledge subject addressable before prose is written.
3. Preserve the useful part of Diataxis as a writing framework without making it the filesystem layout.
4. Keep topic and document identity durable across renames, splits, merges, and file moves.
5. Preserve all historical capture linkage without rewriting old capture events.
6. Let raw material be captured continuously without human approval.
7. Require explicit document promotion before rendered prose becomes authoritative, unless a future decision narrows that rule.
8. Close the write-time escape hatch in code, not by relying on skill prose or rollout order.
9. Make migration auditable with conservation: every old document is accounted for exactly once.
10. Provide a harness that proves the registry prevents sprawl, preserves source reachability, and keeps projections fresh.
```

## claim_e3ae81bb9af288110fd8c39f00c90a67

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#3-non-goals, lines 36–36.
Target: docs/platform/proposals/knowledge-registry-redesign.md#3-non-goals.
Source digest: 7768cbba83342a7d0cfac7d3d6f5e56e830341e9b03f7e05984fd04bf30334c5
Target digest: 7768cbba83342a7d0cfac7d3d6f5e56e830341e9b03f7e05984fd04bf30334c5
Shown source SHA256: 794e74b04d5bfe6b90fe4205d17ae470ed0158baf915474056c40e0af5ff523a
Shown target SHA256: 794e74b04d5bfe6b90fe4205d17ae470ed0158baf915474056c40e0af5ff523a

### Proposed decision

```json
{
  "claimId": "claim_e3ae81bb9af288110fd8c39f00c90a67",
  "sourceUnitDigest": "7768cbba83342a7d0cfac7d3d6f5e56e830341e9b03f7e05984fd04bf30334c5",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "3-non-goals",
  "targetUnitDigest": "7768cbba83342a7d0cfac7d3d6f5e56e830341e9b03f7e05984fd04bf30334c5",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#3-non-goals (lines 36–36) is carried at docs/platform/proposals/knowledge-registry-redesign.md#3-non-goals (lines 60–60); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 3. Non-Goals

1. Do not invent a fifth Diataxis quadrant.
2. Do not make entity names part of the directory tree.
3. Do not allow multiple active documents for the same topic and role.
4. Do not rewrite historical `docPath` values in capture events.
5. Do not use a hand-edited JSON file as the registry source of truth.
6. Do not require a daemon.
7. Do not fold the storytelling-material pipeline into this design; that remains a separate item.
8. Do not rename historical discussion text that used the old term `compound`.
```

### Full target shown text

```text
## 3. Non-Goals

1. Do not invent a fifth Diataxis quadrant.
2. Do not make entity names part of the directory tree.
3. Do not allow multiple active documents for the same topic and role.
4. Do not rewrite historical `docPath` values in capture events.
5. Do not use a hand-edited JSON file as the registry source of truth.
6. Do not require a daemon.
7. Do not fold the storytelling-material pipeline into this design; that remains a separate item.
8. Do not rename historical discussion text that used the old term `compound`.
```

## claim_1eea6f2a52cc2604c180195d0dcf19dd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-9, lines 38–45.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-12.
Source digest: 29a49bae901a497410ebe1189a6d73ba819fa58d412ba8180a24ae8a91966685
Target digest: 29a49bae901a497410ebe1189a6d73ba819fa58d412ba8180a24ae8a91966685
Shown source SHA256: 29a49bae901a497410ebe1189a6d73ba819fa58d412ba8180a24ae8a91966685
Shown target SHA256: 29a49bae901a497410ebe1189a6d73ba819fa58d412ba8180a24ae8a91966685

### Proposed decision

```json
{
  "claimId": "claim_1eea6f2a52cc2604c180195d0dcf19dd",
  "sourceUnitDigest": "29a49bae901a497410ebe1189a6d73ba819fa58d412ba8180a24ae8a91966685",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "29a49bae901a497410ebe1189a6d73ba819fa58d412ba8180a24ae8a91966685",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "3. Non-Goals"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-9 (lines 38–45) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-12 (lines 62–69); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Do not invent a fifth Diataxis quadrant.
2. Do not make entity names part of the directory tree.
3. Do not allow multiple active documents for the same topic and role.
4. Do not rewrite historical `docPath` values in capture events.
5. Do not use a hand-edited JSON file as the registry source of truth.
6. Do not require a daemon.
7. Do not fold the storytelling-material pipeline into this design; that remains a separate item.
8. Do not rename historical discussion text that used the old term `compound`.
```

### Full target shown text

```text
1. Do not invent a fifth Diataxis quadrant.
2. Do not make entity names part of the directory tree.
3. Do not allow multiple active documents for the same topic and role.
4. Do not rewrite historical `docPath` values in capture events.
5. Do not use a hand-edited JSON file as the registry source of truth.
6. Do not require a daemon.
7. Do not fold the storytelling-material pipeline into this design; that remains a separate item.
8. Do not rename historical discussion text that used the old term `compound`.
```

## claim_0f8148fd04b5c69bf42eed311b581e79

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#4-core-decision, lines 47–47.
Target: docs/platform/proposals/knowledge-registry-redesign.md#4-core-decision.
Source digest: 82b4130294142159d2da50bde453fde09774c9adade113d8ce88ae7b718f5a35
Target digest: 82b4130294142159d2da50bde453fde09774c9adade113d8ce88ae7b718f5a35
Shown source SHA256: 43e2e285ebb6843c5d915bac2a8ba18c71b85a887e56f4003b941e82fbce42bc
Shown target SHA256: 43e2e285ebb6843c5d915bac2a8ba18c71b85a887e56f4003b941e82fbce42bc

### Proposed decision

```json
{
  "claimId": "claim_0f8148fd04b5c69bf42eed311b581e79",
  "sourceUnitDigest": "82b4130294142159d2da50bde453fde09774c9adade113d8ce88ae7b718f5a35",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "4-core-decision",
  "targetUnitDigest": "82b4130294142159d2da50bde453fde09774c9adade113d8ce88ae7b718f5a35",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#4-core-decision (lines 47–47) is carried at docs/platform/proposals/knowledge-registry-redesign.md#4-core-decision (lines 71–71); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 4. Core Decision

The replacement boundary is called **knowledge**.

`knowledge` is the process boundary: raw work capture becomes routed, authored, attested, and eventually promoted knowledge.

`topic` and `doc` are sibling state namespaces, not subcommands under `knowledge`:

```txt
fgos topic register
fgos topic split
fgos topic merge
fgos topic rename
fgos topic retire

fgos doc reserve
fgos doc mark-rendered
fgos doc move-path
fgos doc promote
fgos doc supersede
fgos doc retire
```

Do not expose `fgos knowledge topic register`. Registry operations are state operations. Knowledge execution is a process. fgOS already keeps those surfaces flat, and a three-level CLI would add weight without adding safety.

`promote` exists only as `fgos doc promote`. Promotion is a document state transition from provisional to active. A second entry point such as `fgos knowledge promote <doc>` would create two names for the same action and invite contract drift.

The legacy word `compound` remains valid when referring to historical records, existing command names, and old discussion rounds. Going forward, the architectural boundary is `knowledge`. The legacy producer command can remain as a compatibility alias only if it enforces the same registry gate as the new attestation surface.
````

### Full target shown text

````text
## 4. Core Decision

The replacement boundary is called **knowledge**.

`knowledge` is the process boundary: raw work capture becomes routed, authored, attested, and eventually promoted knowledge.

`topic` and `doc` are sibling state namespaces, not subcommands under `knowledge`:

```txt
fgos topic register
fgos topic split
fgos topic merge
fgos topic rename
fgos topic retire

fgos doc reserve
fgos doc mark-rendered
fgos doc move-path
fgos doc promote
fgos doc supersede
fgos doc retire
```

Do not expose `fgos knowledge topic register`. Registry operations are state operations. Knowledge execution is a process. fgOS already keeps those surfaces flat, and a three-level CLI would add weight without adding safety.

`promote` exists only as `fgos doc promote`. Promotion is a document state transition from provisional to active. A second entry point such as `fgos knowledge promote <doc>` would create two names for the same action and invite contract drift.

The legacy word `compound` remains valid when referring to historical records, existing command names, and old discussion rounds. Going forward, the architectural boundary is `knowledge`. The legacy producer command can remain as a compatibility alias only if it enforces the same registry gate as the new attestation surface.
````

## claim_f306940ac300214773c70dd7c769aa66

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-10, lines 49–49.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-13.
Source digest: 807fcfdf34977383f079158982913627f6c0db170228fdd9582030c3856045b4
Target digest: 807fcfdf34977383f079158982913627f6c0db170228fdd9582030c3856045b4
Shown source SHA256: 807fcfdf34977383f079158982913627f6c0db170228fdd9582030c3856045b4
Shown target SHA256: 807fcfdf34977383f079158982913627f6c0db170228fdd9582030c3856045b4

### Proposed decision

```json
{
  "claimId": "claim_f306940ac300214773c70dd7c769aa66",
  "sourceUnitDigest": "807fcfdf34977383f079158982913627f6c0db170228fdd9582030c3856045b4",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "807fcfdf34977383f079158982913627f6c0db170228fdd9582030c3856045b4",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "4. Core Decision"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-10 (lines 49–49) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-13 (lines 73–73); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The replacement boundary is called **knowledge**.
```

### Full target shown text

```text
The replacement boundary is called **knowledge**.
```

## claim_9032479e6e8d546a169df3fd4048d06c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-11, lines 51–51.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-14.
Source digest: 6edc4463d12668a6626fa65b6876dae0f6a62fc47888878126d29d8896df2c70
Target digest: 6edc4463d12668a6626fa65b6876dae0f6a62fc47888878126d29d8896df2c70
Shown source SHA256: 6edc4463d12668a6626fa65b6876dae0f6a62fc47888878126d29d8896df2c70
Shown target SHA256: 6edc4463d12668a6626fa65b6876dae0f6a62fc47888878126d29d8896df2c70

### Proposed decision

```json
{
  "claimId": "claim_9032479e6e8d546a169df3fd4048d06c",
  "sourceUnitDigest": "6edc4463d12668a6626fa65b6876dae0f6a62fc47888878126d29d8896df2c70",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "6edc4463d12668a6626fa65b6876dae0f6a62fc47888878126d29d8896df2c70",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "4. Core Decision"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-11 (lines 51–51) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-14 (lines 75–75); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`knowledge` is the process boundary: raw work capture becomes routed, authored, attested, and eventually promoted knowledge.
```

### Full target shown text

```text
`knowledge` is the process boundary: raw work capture becomes routed, authored, attested, and eventually promoted knowledge.
```

## claim_f24ed6ca8034da086f3e913140fcbef5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-12, lines 53–53.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-15.
Source digest: 4c89642cf48bb21eb63e9dc91df3e4bae1da7a225e4b269fe588cf780ff0b663
Target digest: 4c89642cf48bb21eb63e9dc91df3e4bae1da7a225e4b269fe588cf780ff0b663
Shown source SHA256: 4c89642cf48bb21eb63e9dc91df3e4bae1da7a225e4b269fe588cf780ff0b663
Shown target SHA256: 4c89642cf48bb21eb63e9dc91df3e4bae1da7a225e4b269fe588cf780ff0b663

### Proposed decision

```json
{
  "claimId": "claim_f24ed6ca8034da086f3e913140fcbef5",
  "sourceUnitDigest": "4c89642cf48bb21eb63e9dc91df3e4bae1da7a225e4b269fe588cf780ff0b663",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "4c89642cf48bb21eb63e9dc91df3e4bae1da7a225e4b269fe588cf780ff0b663",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-12 (lines 53–53) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-15 (lines 77–77); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`topic` and `doc` are sibling state namespaces, not subcommands under `knowledge`:
```

### Full target shown text

```text
`topic` and `doc` are sibling state namespaces, not subcommands under `knowledge`:
```

## claim_8c2fa6bc94336ff47d129b4580833bc0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-13, lines 55–68.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-16.
Source digest: 17edec3e75e96e8db13438e1df5630a6c8430db760b3781e291e28782a696d90
Target digest: 17edec3e75e96e8db13438e1df5630a6c8430db760b3781e291e28782a696d90
Shown source SHA256: 17edec3e75e96e8db13438e1df5630a6c8430db760b3781e291e28782a696d90
Shown target SHA256: 17edec3e75e96e8db13438e1df5630a6c8430db760b3781e291e28782a696d90

### Proposed decision

```json
{
  "claimId": "claim_8c2fa6bc94336ff47d129b4580833bc0",
  "sourceUnitDigest": "17edec3e75e96e8db13438e1df5630a6c8430db760b3781e291e28782a696d90",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "17edec3e75e96e8db13438e1df5630a6c8430db760b3781e291e28782a696d90",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-13 (lines 55–68) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-16 (lines 79–92); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
fgos topic register
fgos topic split
fgos topic merge
fgos topic rename
fgos topic retire

fgos doc reserve
fgos doc mark-rendered
fgos doc move-path
fgos doc promote
fgos doc supersede
fgos doc retire
```
````

### Full target shown text

````text
```txt
fgos topic register
fgos topic split
fgos topic merge
fgos topic rename
fgos topic retire

fgos doc reserve
fgos doc mark-rendered
fgos doc move-path
fgos doc promote
fgos doc supersede
fgos doc retire
```
````

## claim_ee7e8c005fa41c714984a5eaef2cf224

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-14, lines 70–70.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-17.
Source digest: ce2d8fdcdb7c27c9a5b6a0d4c04a2d660c1010b9f1d4cfa19b505d83d6187e4d
Target digest: ce2d8fdcdb7c27c9a5b6a0d4c04a2d660c1010b9f1d4cfa19b505d83d6187e4d
Shown source SHA256: ce2d8fdcdb7c27c9a5b6a0d4c04a2d660c1010b9f1d4cfa19b505d83d6187e4d
Shown target SHA256: ce2d8fdcdb7c27c9a5b6a0d4c04a2d660c1010b9f1d4cfa19b505d83d6187e4d

### Proposed decision

```json
{
  "claimId": "claim_ee7e8c005fa41c714984a5eaef2cf224",
  "sourceUnitDigest": "ce2d8fdcdb7c27c9a5b6a0d4c04a2d660c1010b9f1d4cfa19b505d83d6187e4d",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "ce2d8fdcdb7c27c9a5b6a0d4c04a2d660c1010b9f1d4cfa19b505d83d6187e4d",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-14 (lines 70–70) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-17 (lines 94–94); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Do not expose `fgos knowledge topic register`. Registry operations are state operations. Knowledge execution is a process. fgOS already keeps those surfaces flat, and a three-level CLI would add weight without adding safety.
```

### Full target shown text

```text
Do not expose `fgos knowledge topic register`. Registry operations are state operations. Knowledge execution is a process. fgOS already keeps those surfaces flat, and a three-level CLI would add weight without adding safety.
```

## claim_2315ad5f09e180d16505c1c26e2ece24

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-15, lines 72–72.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-18.
Source digest: 72abe49df7d564713d99585a9403d636217a5ec30af3ea5a8df0d959b18c3b67
Target digest: 72abe49df7d564713d99585a9403d636217a5ec30af3ea5a8df0d959b18c3b67
Shown source SHA256: 72abe49df7d564713d99585a9403d636217a5ec30af3ea5a8df0d959b18c3b67
Shown target SHA256: 72abe49df7d564713d99585a9403d636217a5ec30af3ea5a8df0d959b18c3b67

### Proposed decision

```json
{
  "claimId": "claim_2315ad5f09e180d16505c1c26e2ece24",
  "sourceUnitDigest": "72abe49df7d564713d99585a9403d636217a5ec30af3ea5a8df0d959b18c3b67",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "72abe49df7d564713d99585a9403d636217a5ec30af3ea5a8df0d959b18c3b67",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-15 (lines 72–72) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-18 (lines 96–96); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`promote` exists only as `fgos doc promote`. Promotion is a document state transition from provisional to active. A second entry point such as `fgos knowledge promote <doc>` would create two names for the same action and invite contract drift.
```

### Full target shown text

```text
`promote` exists only as `fgos doc promote`. Promotion is a document state transition from provisional to active. A second entry point such as `fgos knowledge promote <doc>` would create two names for the same action and invite contract drift.
```

## claim_85ee95a8b85dedf89b245143b292fbe4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-16, lines 74–74.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-19.
Source digest: afe78b310592ad3926ee14cc96bbf2b7b7d52302205455b541a426d018b81c23
Target digest: afe78b310592ad3926ee14cc96bbf2b7b7d52302205455b541a426d018b81c23
Shown source SHA256: afe78b310592ad3926ee14cc96bbf2b7b7d52302205455b541a426d018b81c23
Shown target SHA256: afe78b310592ad3926ee14cc96bbf2b7b7d52302205455b541a426d018b81c23

### Proposed decision

```json
{
  "claimId": "claim_85ee95a8b85dedf89b245143b292fbe4",
  "sourceUnitDigest": "afe78b310592ad3926ee14cc96bbf2b7b7d52302205455b541a426d018b81c23",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "afe78b310592ad3926ee14cc96bbf2b7b7d52302205455b541a426d018b81c23",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "4. Core Decision"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-16 (lines 74–74) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-19 (lines 98–98); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The legacy word `compound` remains valid when referring to historical records, existing command names, and old discussion rounds. Going forward, the architectural boundary is `knowledge`. The legacy producer command can remain as a compatibility alias only if it enforces the same registry gate as the new attestation surface.
```

### Full target shown text

```text
The legacy word `compound` remains valid when referring to historical records, existing command names, and old discussion rounds. Going forward, the architectural boundary is `knowledge`. The legacy producer command can remain as a compatibility alias only if it enforces the same registry gate as the new attestation surface.
```

## claim_caba8b164aab919052e346f6f73b2093

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#5-vocabulary, lines 76–76.
Target: docs/platform/proposals/knowledge-registry-redesign.md#5-vocabulary.
Source digest: f94e7b2a243f1b8a61718285d93b3c3ddee594c126df0337ede2f80f538c5fd5
Target digest: f94e7b2a243f1b8a61718285d93b3c3ddee594c126df0337ede2f80f538c5fd5
Shown source SHA256: dd268a5c98cfa64650ccbaed6982587959a17d96671cfd3dea6e69a227bd0a1d
Shown target SHA256: dd268a5c98cfa64650ccbaed6982587959a17d96671cfd3dea6e69a227bd0a1d

### Proposed decision

```json
{
  "claimId": "claim_caba8b164aab919052e346f6f73b2093",
  "sourceUnitDigest": "f94e7b2a243f1b8a61718285d93b3c3ddee594c126df0337ede2f80f538c5fd5",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "5-vocabulary",
  "targetUnitDigest": "f94e7b2a243f1b8a61718285d93b3c3ddee594c126df0337ede2f80f538c5fd5",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#5-vocabulary (lines 76–76) is carried at docs/platform/proposals/knowledge-registry-redesign.md#5-vocabulary (lines 100–100); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 5. Vocabulary
```

### Full target shown text

```text
## 5. Vocabulary
```

## claim_67c77b7c56b8e9031d2c50c41983d56d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#51-capture, lines 78–78.
Target: docs/platform/proposals/knowledge-registry-redesign.md#51-capture.
Source digest: 4e522b5259d8d4e5cc101351d679ff5e714ad24fac4936babe511c933636567f
Target digest: 4e522b5259d8d4e5cc101351d679ff5e714ad24fac4936babe511c933636567f
Shown source SHA256: 0eece329e000cebc1b68e3a5c03a4d7cb0aeb1e776e7e8129ca2cfdc34f53495
Shown target SHA256: 0eece329e000cebc1b68e3a5c03a4d7cb0aeb1e776e7e8129ca2cfdc34f53495

### Proposed decision

```json
{
  "claimId": "claim_67c77b7c56b8e9031d2c50c41983d56d",
  "sourceUnitDigest": "4e522b5259d8d4e5cc101351d679ff5e714ad24fac4936babe511c933636567f",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "51-capture",
  "targetUnitDigest": "4e522b5259d8d4e5cc101351d679ff5e714ad24fac4936babe511c933636567f",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#51-capture (lines 78–78) is carried at docs/platform/proposals/knowledge-registry-redesign.md#51-capture (lines 102–102); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 5.1 Capture

Capture is raw recorded material from work: outcome, friction, decisions, questions, answers, verification evidence, and other event-log facts. Capture is not a finished document and should not be blocked on human approval.
```

### Full target shown text

```text
### 5.1 Capture

Capture is raw recorded material from work: outcome, friction, decisions, questions, answers, verification evidence, and other event-log facts. Capture is not a finished document and should not be blocked on human approval.
```

## claim_c2f0fad62ca2495c552eab8f4a231bc7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-17, lines 80–80.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-20.
Source digest: ea7e0c840ef8177842c0fd9a04cd7ee14c5f2125517d4db4d036ec9aab48013e
Target digest: ea7e0c840ef8177842c0fd9a04cd7ee14c5f2125517d4db4d036ec9aab48013e
Shown source SHA256: ea7e0c840ef8177842c0fd9a04cd7ee14c5f2125517d4db4d036ec9aab48013e
Shown target SHA256: ea7e0c840ef8177842c0fd9a04cd7ee14c5f2125517d4db4d036ec9aab48013e

### Proposed decision

```json
{
  "claimId": "claim_c2f0fad62ca2495c552eab8f4a231bc7",
  "sourceUnitDigest": "ea7e0c840ef8177842c0fd9a04cd7ee14c5f2125517d4db4d036ec9aab48013e",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "ea7e0c840ef8177842c0fd9a04cd7ee14c5f2125517d4db4d036ec9aab48013e",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.1 Capture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-17 (lines 80–80) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-20 (lines 104–104); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Capture is raw recorded material from work: outcome, friction, decisions, questions, answers, verification evidence, and other event-log facts. Capture is not a finished document and should not be blocked on human approval.
```

### Full target shown text

```text
Capture is raw recorded material from work: outcome, friction, decisions, questions, answers, verification evidence, and other event-log facts. Capture is not a finished document and should not be blocked on human approval.
```

## claim_be3a54b0c8ae17d0d35d25e6230d5fbb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#52-material, lines 82–82.
Target: docs/platform/proposals/knowledge-registry-redesign.md#52-material.
Source digest: ca7e88a6cae0f80c445040bf85bf380b2aaddd59476c2ba74701f0e478c5f8c2
Target digest: ca7e88a6cae0f80c445040bf85bf380b2aaddd59476c2ba74701f0e478c5f8c2
Shown source SHA256: 3596e42d1a00d80b416b44d54995c74c8fc3bae06efcd9e003952e0226558b77
Shown target SHA256: 3596e42d1a00d80b416b44d54995c74c8fc3bae06efcd9e003952e0226558b77

### Proposed decision

```json
{
  "claimId": "claim_be3a54b0c8ae17d0d35d25e6230d5fbb",
  "sourceUnitDigest": "ca7e88a6cae0f80c445040bf85bf380b2aaddd59476c2ba74701f0e478c5f8c2",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "52-material",
  "targetUnitDigest": "ca7e88a6cae0f80c445040bf85bf380b2aaddd59476c2ba74701f0e478c5f8c2",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#52-material (lines 82–82) is carried at docs/platform/proposals/knowledge-registry-redesign.md#52-material (lines 106–106); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 5.2 Material

Material is extracted evidence selected from capture for possible knowledge use. If the previous discussion uses "draft" for this layer, keep that meaning here. Material can be draft-like without claiming to be authoritative prose.
```

### Full target shown text

```text
### 5.2 Material

Material is extracted evidence selected from capture for possible knowledge use. If the previous discussion uses "draft" for this layer, keep that meaning here. Material can be draft-like without claiming to be authoritative prose.
```

## claim_4b34093091e3d7fc0b1e79b32f202620

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-18, lines 84–84.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-21.
Source digest: 55a0937658dd873ac813d042f9b4d69c2d6a23086e391be790080b3d8d7829b1
Target digest: 55a0937658dd873ac813d042f9b4d69c2d6a23086e391be790080b3d8d7829b1
Shown source SHA256: 55a0937658dd873ac813d042f9b4d69c2d6a23086e391be790080b3d8d7829b1
Shown target SHA256: 55a0937658dd873ac813d042f9b4d69c2d6a23086e391be790080b3d8d7829b1

### Proposed decision

```json
{
  "claimId": "claim_4b34093091e3d7fc0b1e79b32f202620",
  "sourceUnitDigest": "55a0937658dd873ac813d042f9b4d69c2d6a23086e391be790080b3d8d7829b1",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "55a0937658dd873ac813d042f9b4d69c2d6a23086e391be790080b3d8d7829b1",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.2 Material"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-18 (lines 84–84) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-21 (lines 108–108); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Material is extracted evidence selected from capture for possible knowledge use. If the previous discussion uses "draft" for this layer, keep that meaning here. Material can be draft-like without claiming to be authoritative prose.
```

### Full target shown text

```text
Material is extracted evidence selected from capture for possible knowledge use. If the previous discussion uses "draft" for this layer, keep that meaning here. Material can be draft-like without claiming to be authoritative prose.
```

## claim_faa40ab0bc429d6736f4131ecfb877eb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#53-topic, lines 86–86.
Target: docs/platform/proposals/knowledge-registry-redesign.md#53-topic.
Source digest: 7709211a44d68781d8994e48f2af6e7b4485e90063b4f1de568d050da9a692bb
Target digest: 7709211a44d68781d8994e48f2af6e7b4485e90063b4f1de568d050da9a692bb
Shown source SHA256: 08d4e001c263b24ae23a7056cbe5141a8288bfe98e4fca7bc9a6c4730f88261d
Shown target SHA256: 08d4e001c263b24ae23a7056cbe5141a8288bfe98e4fca7bc9a6c4730f88261d

### Proposed decision

```json
{
  "claimId": "claim_faa40ab0bc429d6736f4131ecfb877eb",
  "sourceUnitDigest": "7709211a44d68781d8994e48f2af6e7b4485e90063b4f1de568d050da9a692bb",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "53-topic",
  "targetUnitDigest": "7709211a44d68781d8994e48f2af6e7b4485e90063b4f1de568d050da9a692bb",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#53-topic (lines 86–86) is carried at docs/platform/proposals/knowledge-registry-redesign.md#53-topic (lines 110–110); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 5.3 Topic

A topic is a long-lived subject slot. It answers: "what problem domain or reader job is this knowledge about?"

A topic grows slower than work items. A normal retrospective writer must not silently open a new official topic whenever it cannot find a path. Topic creation goes through `fgos topic register` or through migration/classification tooling whose output is reviewed by the registry harness.
```

### Full target shown text

```text
### 5.3 Topic

A topic is a long-lived subject slot. It answers: "what problem domain or reader job is this knowledge about?"

A topic grows slower than work items. A normal retrospective writer must not silently open a new official topic whenever it cannot find a path. Topic creation goes through `fgos topic register` or through migration/classification tooling whose output is reviewed by the registry harness.
```

## claim_4b88e4320a046e5410eae2ce817f8f64

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-19, lines 88–88.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-22.
Source digest: 34babbf16cf5df45b6bc92288626eaede7ace6e806a1073c888031d12b1b4990
Target digest: 34babbf16cf5df45b6bc92288626eaede7ace6e806a1073c888031d12b1b4990
Shown source SHA256: 34babbf16cf5df45b6bc92288626eaede7ace6e806a1073c888031d12b1b4990
Shown target SHA256: 34babbf16cf5df45b6bc92288626eaede7ace6e806a1073c888031d12b1b4990

### Proposed decision

```json
{
  "claimId": "claim_4b88e4320a046e5410eae2ce817f8f64",
  "sourceUnitDigest": "34babbf16cf5df45b6bc92288626eaede7ace6e806a1073c888031d12b1b4990",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "34babbf16cf5df45b6bc92288626eaede7ace6e806a1073c888031d12b1b4990",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.3 Topic"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-19 (lines 88–88) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-22 (lines 112–112); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
A topic is a long-lived subject slot. It answers: "what problem domain or reader job is this knowledge about?"
```

### Full target shown text

```text
A topic is a long-lived subject slot. It answers: "what problem domain or reader job is this knowledge about?"
```

## claim_09e5801c5e7ad3ada99b461ae64a863b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-20, lines 90–90.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-23.
Source digest: 7fb1a3e42058e0bbb5562c114f237128fa9b4ed108e307465a0bae1af522ee2a
Target digest: 7fb1a3e42058e0bbb5562c114f237128fa9b4ed108e307465a0bae1af522ee2a
Shown source SHA256: 7fb1a3e42058e0bbb5562c114f237128fa9b4ed108e307465a0bae1af522ee2a
Shown target SHA256: 7fb1a3e42058e0bbb5562c114f237128fa9b4ed108e307465a0bae1af522ee2a

### Proposed decision

```json
{
  "claimId": "claim_09e5801c5e7ad3ada99b461ae64a863b",
  "sourceUnitDigest": "7fb1a3e42058e0bbb5562c114f237128fa9b4ed108e307465a0bae1af522ee2a",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "7fb1a3e42058e0bbb5562c114f237128fa9b4ed108e307465a0bae1af522ee2a",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.3 Topic"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-20 (lines 90–90) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-23 (lines 114–114); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
A topic grows slower than work items. A normal retrospective writer must not silently open a new official topic whenever it cannot find a path. Topic creation goes through `fgos topic register` or through migration/classification tooling whose output is reviewed by the registry harness.
```

### Full target shown text

```text
A topic grows slower than work items. A normal retrospective writer must not silently open a new official topic whenever it cannot find a path. Topic creation goes through `fgos topic register` or through migration/classification tooling whose output is reviewed by the registry harness.
```

## claim_7de0e174dff6bb112e6dade429cd808f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#54-purpose, lines 92–92.
Target: docs/platform/proposals/knowledge-registry-redesign.md#54-purpose.
Source digest: 2ab933e9d47599c2178a73bf1afeb9293ad023f6c7b658fcb70564f4f080cb18
Target digest: 2ab933e9d47599c2178a73bf1afeb9293ad023f6c7b658fcb70564f4f080cb18
Shown source SHA256: c3b5cab96d863ca29331c90560b5850bd854721e3aac9ced002e1a07cf67b5b8
Shown target SHA256: c3b5cab96d863ca29331c90560b5850bd854721e3aac9ced002e1a07cf67b5b8

### Proposed decision

```json
{
  "claimId": "claim_7de0e174dff6bb112e6dade429cd808f",
  "sourceUnitDigest": "2ab933e9d47599c2178a73bf1afeb9293ad023f6c7b658fcb70564f4f080cb18",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "54-purpose",
  "targetUnitDigest": "2ab933e9d47599c2178a73bf1afeb9293ad023f6c7b658fcb70564f4f080cb18",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#54-purpose (lines 92–92) is carried at docs/platform/proposals/knowledge-registry-redesign.md#54-purpose (lines 116–116); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 5.4 Purpose

Purpose is the reader-facing form of a topic. It appears in the filesystem as the directory slug:

```txt
docs/knowledge/<purposeSlug>/<role>.md
```

Purpose must not be a restatement of a single work item title. It must describe a reusable reader job or problem domain.
````

### Full target shown text

````text
### 5.4 Purpose

Purpose is the reader-facing form of a topic. It appears in the filesystem as the directory slug:

```txt
docs/knowledge/<purposeSlug>/<role>.md
```

Purpose must not be a restatement of a single work item title. It must describe a reusable reader job or problem domain.
````

## claim_13418394d8de954c254bd5694a81d1f8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-21, lines 94–94.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-24.
Source digest: 79c2372e010ec5e457627b44575dfe8d1b19ee00e03efdd5ba30c31d9952da7f
Target digest: 79c2372e010ec5e457627b44575dfe8d1b19ee00e03efdd5ba30c31d9952da7f
Shown source SHA256: 79c2372e010ec5e457627b44575dfe8d1b19ee00e03efdd5ba30c31d9952da7f
Shown target SHA256: 79c2372e010ec5e457627b44575dfe8d1b19ee00e03efdd5ba30c31d9952da7f

### Proposed decision

```json
{
  "claimId": "claim_13418394d8de954c254bd5694a81d1f8",
  "sourceUnitDigest": "79c2372e010ec5e457627b44575dfe8d1b19ee00e03efdd5ba30c31d9952da7f",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "79c2372e010ec5e457627b44575dfe8d1b19ee00e03efdd5ba30c31d9952da7f",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.4 Purpose"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-21 (lines 94–94) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-24 (lines 118–118); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Purpose is the reader-facing form of a topic. It appears in the filesystem as the directory slug:
```

### Full target shown text

```text
Purpose is the reader-facing form of a topic. It appears in the filesystem as the directory slug:
```

## claim_ec933bb0400606868f14ca749583c4c7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-22, lines 96–98.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-25.
Source digest: 99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8
Target digest: 99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8
Shown source SHA256: 99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8
Shown target SHA256: 99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8

### Proposed decision

```json
{
  "claimId": "claim_ec933bb0400606868f14ca749583c4c7",
  "sourceUnitDigest": "99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.4 Purpose"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: target digest repeats. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-22 (lines 96–98) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-25 (lines 120–122); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
docs/knowledge/<purposeSlug>/<role>.md
```
````

### Full target shown text

````text
```txt
docs/knowledge/<purposeSlug>/<role>.md
```
````

## claim_74a451a3ebaae9542d815a25ddbed262

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-23, lines 100–100.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-26.
Source digest: f463b6fbd2e614e0aa64f22eced774f6b683b3a1e2a314157d6fe1a5a12666cf
Target digest: f463b6fbd2e614e0aa64f22eced774f6b683b3a1e2a314157d6fe1a5a12666cf
Shown source SHA256: f463b6fbd2e614e0aa64f22eced774f6b683b3a1e2a314157d6fe1a5a12666cf
Shown target SHA256: f463b6fbd2e614e0aa64f22eced774f6b683b3a1e2a314157d6fe1a5a12666cf

### Proposed decision

```json
{
  "claimId": "claim_74a451a3ebaae9542d815a25ddbed262",
  "sourceUnitDigest": "f463b6fbd2e614e0aa64f22eced774f6b683b3a1e2a314157d6fe1a5a12666cf",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "f463b6fbd2e614e0aa64f22eced774f6b683b3a1e2a314157d6fe1a5a12666cf",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.4 Purpose"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-23 (lines 100–100) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-26 (lines 124–124); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Purpose must not be a restatement of a single work item title. It must describe a reusable reader job or problem domain.
```

### Full target shown text

```text
Purpose must not be a restatement of a single work item title. It must describe a reusable reader job or problem domain.
```

## claim_aee75b779faf2d87c9187ea7fd04bb4e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#55-role, lines 102–102.
Target: docs/platform/proposals/knowledge-registry-redesign.md#55-role.
Source digest: 61c39fc3f4b5ed1d3253bd0d805327f2e993f8b05351396f3d5b7cd31bdddcb9
Target digest: 61c39fc3f4b5ed1d3253bd0d805327f2e993f8b05351396f3d5b7cd31bdddcb9
Shown source SHA256: 9dccb4a4dd9d9a9a382362636b12370f8a297b72a73f8715aeb25ffc92b6a104
Shown target SHA256: 9dccb4a4dd9d9a9a382362636b12370f8a297b72a73f8715aeb25ffc92b6a104

### Proposed decision

```json
{
  "claimId": "claim_aee75b779faf2d87c9187ea7fd04bb4e",
  "sourceUnitDigest": "61c39fc3f4b5ed1d3253bd0d805327f2e993f8b05351396f3d5b7cd31bdddcb9",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "55-role",
  "targetUnitDigest": "61c39fc3f4b5ed1d3253bd0d805327f2e993f8b05351396f3d5b7cd31bdddcb9",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#55-role (lines 102–102) is carried at docs/platform/proposals/knowledge-registry-redesign.md#55-role (lines 126–126); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 5.5 Role

Role is the knowledge-artifact role within a topic. It answers: "what kind of knowledge artifact is this?"

Examples:

- `decision` - records a choice, rationale, supersession, and alternatives;
- `runbook` - tells an operator how to handle a recurring situation;
- `pitfall` - records a failure shape and how to avoid or recognize it;
- `pattern` - records a reusable design or execution pattern;
- `evidence` - preserves a measured result or audit finding.

Role is not a synonym for Diataxis mode. Two roles can share the same writing mode but have different lifecycle policy. A decision can be superseded; a pattern is refined; a runbook can be retired when its operational surface disappears.

Role vocabulary is closed-with-a-door. New roles are proposed when existing roles do not fit, but normal writers assign the nearest existing role and record the proposal rather than expanding the vocabulary immediately.
```

### Full target shown text

```text
### 5.5 Role

Role is the knowledge-artifact role within a topic. It answers: "what kind of knowledge artifact is this?"

Examples:

- `decision` - records a choice, rationale, supersession, and alternatives;
- `runbook` - tells an operator how to handle a recurring situation;
- `pitfall` - records a failure shape and how to avoid or recognize it;
- `pattern` - records a reusable design or execution pattern;
- `evidence` - preserves a measured result or audit finding.

Role is not a synonym for Diataxis mode. Two roles can share the same writing mode but have different lifecycle policy. A decision can be superseded; a pattern is refined; a runbook can be retired when its operational surface disappears.

Role vocabulary is closed-with-a-door. New roles are proposed when existing roles do not fit, but normal writers assign the nearest existing role and record the proposal rather than expanding the vocabulary immediately.
```

## claim_9c1d7d559bf8802c182824e77972a558

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-24, lines 104–104.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-27.
Source digest: 1280ba5ea25d36262e0349ea7ff0ca46bba2371cbebb3e40f2faca98da4ba9dd
Target digest: 1280ba5ea25d36262e0349ea7ff0ca46bba2371cbebb3e40f2faca98da4ba9dd
Shown source SHA256: 1280ba5ea25d36262e0349ea7ff0ca46bba2371cbebb3e40f2faca98da4ba9dd
Shown target SHA256: 1280ba5ea25d36262e0349ea7ff0ca46bba2371cbebb3e40f2faca98da4ba9dd

### Proposed decision

```json
{
  "claimId": "claim_9c1d7d559bf8802c182824e77972a558",
  "sourceUnitDigest": "1280ba5ea25d36262e0349ea7ff0ca46bba2371cbebb3e40f2faca98da4ba9dd",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "1280ba5ea25d36262e0349ea7ff0ca46bba2371cbebb3e40f2faca98da4ba9dd",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.5 Role"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-24 (lines 104–104) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-27 (lines 128–128); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Role is the knowledge-artifact role within a topic. It answers: "what kind of knowledge artifact is this?"
```

### Full target shown text

```text
Role is the knowledge-artifact role within a topic. It answers: "what kind of knowledge artifact is this?"
```

## claim_4c94e0c294b24ce558006cf9c07eb988

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-25, lines 106–112.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-28.
Source digest: 1d332459407c2e65a2c3e0364f0cb6414303f3e7e7bf6ee4b95cbed6b0acdf22
Target digest: 1d332459407c2e65a2c3e0364f0cb6414303f3e7e7bf6ee4b95cbed6b0acdf22
Shown source SHA256: 1d332459407c2e65a2c3e0364f0cb6414303f3e7e7bf6ee4b95cbed6b0acdf22
Shown target SHA256: 1d332459407c2e65a2c3e0364f0cb6414303f3e7e7bf6ee4b95cbed6b0acdf22

### Proposed decision

```json
{
  "claimId": "claim_4c94e0c294b24ce558006cf9c07eb988",
  "sourceUnitDigest": "1d332459407c2e65a2c3e0364f0cb6414303f3e7e7bf6ee4b95cbed6b0acdf22",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "1d332459407c2e65a2c3e0364f0cb6414303f3e7e7bf6ee4b95cbed6b0acdf22",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.5 Role"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-25 (lines 106–112) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-28 (lines 130–136); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Examples:

- `decision` - records a choice, rationale, supersession, and alternatives;
- `runbook` - tells an operator how to handle a recurring situation;
- `pitfall` - records a failure shape and how to avoid or recognize it;
- `pattern` - records a reusable design or execution pattern;
- `evidence` - preserves a measured result or audit finding.
```

### Full target shown text

```text
Examples:

- `decision` - records a choice, rationale, supersession, and alternatives;
- `runbook` - tells an operator how to handle a recurring situation;
- `pitfall` - records a failure shape and how to avoid or recognize it;
- `pattern` - records a reusable design or execution pattern;
- `evidence` - preserves a measured result or audit finding.
```

## claim_5d0c28a007a981ec655b23cb62905a53

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-26, lines 114–114.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-29.
Source digest: 48553ccc173f80cfb16cc54dd22483435bdba0a592f69d2afe0f177eb9c983ae
Target digest: 48553ccc173f80cfb16cc54dd22483435bdba0a592f69d2afe0f177eb9c983ae
Shown source SHA256: 48553ccc173f80cfb16cc54dd22483435bdba0a592f69d2afe0f177eb9c983ae
Shown target SHA256: 48553ccc173f80cfb16cc54dd22483435bdba0a592f69d2afe0f177eb9c983ae

### Proposed decision

```json
{
  "claimId": "claim_5d0c28a007a981ec655b23cb62905a53",
  "sourceUnitDigest": "48553ccc173f80cfb16cc54dd22483435bdba0a592f69d2afe0f177eb9c983ae",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "48553ccc173f80cfb16cc54dd22483435bdba0a592f69d2afe0f177eb9c983ae",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.5 Role"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-26 (lines 114–114) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-29 (lines 138–138); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Role is not a synonym for Diataxis mode. Two roles can share the same writing mode but have different lifecycle policy. A decision can be superseded; a pattern is refined; a runbook can be retired when its operational surface disappears.
```

### Full target shown text

```text
Role is not a synonym for Diataxis mode. Two roles can share the same writing mode but have different lifecycle policy. A decision can be superseded; a pattern is refined; a runbook can be retired when its operational surface disappears.
```

## claim_ad31610a2eadcb4803ca51bea674338c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-27, lines 116–116.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-30.
Source digest: 0f048b9698aa61548e372ead489d136b83fdc63e258e7d4e7524d220ee9b32b8
Target digest: 0f048b9698aa61548e372ead489d136b83fdc63e258e7d4e7524d220ee9b32b8
Shown source SHA256: 0f048b9698aa61548e372ead489d136b83fdc63e258e7d4e7524d220ee9b32b8
Shown target SHA256: 0f048b9698aa61548e372ead489d136b83fdc63e258e7d4e7524d220ee9b32b8

### Proposed decision

```json
{
  "claimId": "claim_ad31610a2eadcb4803ca51bea674338c",
  "sourceUnitDigest": "0f048b9698aa61548e372ead489d136b83fdc63e258e7d4e7524d220ee9b32b8",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "0f048b9698aa61548e372ead489d136b83fdc63e258e7d4e7524d220ee9b32b8",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.5 Role"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-27 (lines 116–116) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-30 (lines 140–140); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Role vocabulary is closed-with-a-door. New roles are proposed when existing roles do not fit, but normal writers assign the nearest existing role and record the proposal rather than expanding the vocabulary immediately.
```

### Full target shown text

```text
Role vocabulary is closed-with-a-door. New roles are proposed when existing roles do not fit, but normal writers assign the nearest existing role and record the proposal rather than expanding the vocabulary immediately.
```

## claim_5fe8238cacc7837bd94fd2234426cb9d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#56-entity, lines 118–118.
Target: docs/platform/proposals/knowledge-registry-redesign.md#56-entity.
Source digest: c73322e658a860dd52824fe6dcdb02bc50ff76d3dce80955279816acbe4566b7
Target digest: c73322e658a860dd52824fe6dcdb02bc50ff76d3dce80955279816acbe4566b7
Shown source SHA256: 7f7b4db80c97c85fa965750816c2958eda692a69667b24fe763b9841e179a972
Shown target SHA256: 7f7b4db80c97c85fa965750816c2958eda692a69667b24fe763b9841e179a972

### Proposed decision

```json
{
  "claimId": "claim_5fe8238cacc7837bd94fd2234426cb9d",
  "sourceUnitDigest": "c73322e658a860dd52824fe6dcdb02bc50ff76d3dce80955279816acbe4566b7",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "56-entity",
  "targetUnitDigest": "c73322e658a860dd52824fe6dcdb02bc50ff76d3dce80955279816acbe4566b7",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#56-entity (lines 118–118) is carried at docs/platform/proposals/knowledge-registry-redesign.md#56-entity (lines 142–142); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 5.6 Entity

Entity is an open, multi-value metadata axis. It names things the document touches: subsystems, commands, actors, stores, concepts, or other durable objects. Entity never becomes a directory, because many documents legitimately touch multiple entities.
```

### Full target shown text

```text
### 5.6 Entity

Entity is an open, multi-value metadata axis. It names things the document touches: subsystems, commands, actors, stores, concepts, or other durable objects. Entity never becomes a directory, because many documents legitimately touch multiple entities.
```

## claim_fc244e7b26958d61cb6a09eb604db657

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-28, lines 120–120.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-31.
Source digest: 29fe8f4f3fe14b42e70b1c6a7949ae17d870b7cbc7be6e70af100c6afd4b0ca5
Target digest: 29fe8f4f3fe14b42e70b1c6a7949ae17d870b7cbc7be6e70af100c6afd4b0ca5
Shown source SHA256: 29fe8f4f3fe14b42e70b1c6a7949ae17d870b7cbc7be6e70af100c6afd4b0ca5
Shown target SHA256: 29fe8f4f3fe14b42e70b1c6a7949ae17d870b7cbc7be6e70af100c6afd4b0ca5

### Proposed decision

```json
{
  "claimId": "claim_fc244e7b26958d61cb6a09eb604db657",
  "sourceUnitDigest": "29fe8f4f3fe14b42e70b1c6a7949ae17d870b7cbc7be6e70af100c6afd4b0ca5",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "29fe8f4f3fe14b42e70b1c6a7949ae17d870b7cbc7be6e70af100c6afd4b0ca5",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.6 Entity"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-28 (lines 120–120) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-31 (lines 144–144); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Entity is an open, multi-value metadata axis. It names things the document touches: subsystems, commands, actors, stores, concepts, or other durable objects. Entity never becomes a directory, because many documents legitimately touch multiple entities.
```

### Full target shown text

```text
Entity is an open, multi-value metadata axis. It names things the document touches: subsystems, commands, actors, stores, concepts, or other durable objects. Entity never becomes a directory, because many documents legitimately touch multiple entities.
```

## claim_f0a9737d42d90c0e0925fcb88e49d8c2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#57-framework-and-mode, lines 122–122.
Target: docs/platform/proposals/knowledge-registry-redesign.md#57-framework-and-mode.
Source digest: d7e58308415f634fdf83e80d896cc216e402e7c44329a25609c1c3ec37260fb4
Target digest: d7e58308415f634fdf83e80d896cc216e402e7c44329a25609c1c3ec37260fb4
Shown source SHA256: 8fa3888922d11cc1e84721d1fecfbee6cfc413b2f3445f3c188de59df12b5746
Shown target SHA256: 8fa3888922d11cc1e84721d1fecfbee6cfc413b2f3445f3c188de59df12b5746

### Proposed decision

```json
{
  "claimId": "claim_f0a9737d42d90c0e0925fcb88e49d8c2",
  "sourceUnitDigest": "d7e58308415f634fdf83e80d896cc216e402e7c44329a25609c1c3ec37260fb4",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "57-framework-and-mode",
  "targetUnitDigest": "d7e58308415f634fdf83e80d896cc216e402e7c44329a25609c1c3ec37260fb4",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#57-framework-and-mode (lines 122–122) is carried at docs/platform/proposals/knowledge-registry-redesign.md#57-framework-and-mode (lines 146–146); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 5.7 Framework And Mode

Framework and mode describe how to write the document. Diataxis is the first framework:

```txt
framework: diataxis
mode: explanation
```

Diataxis modes remain closed to tutorial, how-to, reference, and explanation. Other writing frameworks can be registered later, and each framework owns its own closed mode vocabulary.

Framework/mode must not be used as the primary filesystem layout. Otherwise the first non-Diataxis framework recreates the same structural problem under another name.
````

### Full target shown text

````text
### 5.7 Framework And Mode

Framework and mode describe how to write the document. Diataxis is the first framework:

```txt
framework: diataxis
mode: explanation
```

Diataxis modes remain closed to tutorial, how-to, reference, and explanation. Other writing frameworks can be registered later, and each framework owns its own closed mode vocabulary.

Framework/mode must not be used as the primary filesystem layout. Otherwise the first non-Diataxis framework recreates the same structural problem under another name.
````

## claim_0bc84d42ae24ed5089b7a8cd5c7b53c6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-29, lines 124–124.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-32.
Source digest: 12f1aae66370fa048c2a63eecfcd2587179c6b182ab5e4a0cd1f316f6d9af3c7
Target digest: 12f1aae66370fa048c2a63eecfcd2587179c6b182ab5e4a0cd1f316f6d9af3c7
Shown source SHA256: 12f1aae66370fa048c2a63eecfcd2587179c6b182ab5e4a0cd1f316f6d9af3c7
Shown target SHA256: 12f1aae66370fa048c2a63eecfcd2587179c6b182ab5e4a0cd1f316f6d9af3c7

### Proposed decision

```json
{
  "claimId": "claim_0bc84d42ae24ed5089b7a8cd5c7b53c6",
  "sourceUnitDigest": "12f1aae66370fa048c2a63eecfcd2587179c6b182ab5e4a0cd1f316f6d9af3c7",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "12f1aae66370fa048c2a63eecfcd2587179c6b182ab5e4a0cd1f316f6d9af3c7",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.7 Framework And Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-29 (lines 124–124) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-32 (lines 148–148); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Framework and mode describe how to write the document. Diataxis is the first framework:
```

### Full target shown text

```text
Framework and mode describe how to write the document. Diataxis is the first framework:
```

## claim_ebaaaaaab122f62a2d96b1606e420b70

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-30, lines 126–129.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-33.
Source digest: 825db07080cc9922bb6f025ab15ef9d6faf796d2c468a4339424330c03d029ec
Target digest: 825db07080cc9922bb6f025ab15ef9d6faf796d2c468a4339424330c03d029ec
Shown source SHA256: 825db07080cc9922bb6f025ab15ef9d6faf796d2c468a4339424330c03d029ec
Shown target SHA256: 825db07080cc9922bb6f025ab15ef9d6faf796d2c468a4339424330c03d029ec

### Proposed decision

```json
{
  "claimId": "claim_ebaaaaaab122f62a2d96b1606e420b70",
  "sourceUnitDigest": "825db07080cc9922bb6f025ab15ef9d6faf796d2c468a4339424330c03d029ec",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "825db07080cc9922bb6f025ab15ef9d6faf796d2c468a4339424330c03d029ec",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.7 Framework And Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-30 (lines 126–129) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-33 (lines 150–153); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
framework: diataxis
mode: explanation
```
````

### Full target shown text

````text
```txt
framework: diataxis
mode: explanation
```
````

## claim_f755036487a4db3d6a6e4da78c9dd5f2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-31, lines 131–131.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-34.
Source digest: 1bd394a71e80e1c33910db0c0c662f3cf0c9fd4c246f1b334aa02a93293cbb55
Target digest: 1bd394a71e80e1c33910db0c0c662f3cf0c9fd4c246f1b334aa02a93293cbb55
Shown source SHA256: 1bd394a71e80e1c33910db0c0c662f3cf0c9fd4c246f1b334aa02a93293cbb55
Shown target SHA256: 1bd394a71e80e1c33910db0c0c662f3cf0c9fd4c246f1b334aa02a93293cbb55

### Proposed decision

```json
{
  "claimId": "claim_f755036487a4db3d6a6e4da78c9dd5f2",
  "sourceUnitDigest": "1bd394a71e80e1c33910db0c0c662f3cf0c9fd4c246f1b334aa02a93293cbb55",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "1bd394a71e80e1c33910db0c0c662f3cf0c9fd4c246f1b334aa02a93293cbb55",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.7 Framework And Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-31 (lines 131–131) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-34 (lines 155–155); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Diataxis modes remain closed to tutorial, how-to, reference, and explanation. Other writing frameworks can be registered later, and each framework owns its own closed mode vocabulary.
```

### Full target shown text

```text
Diataxis modes remain closed to tutorial, how-to, reference, and explanation. Other writing frameworks can be registered later, and each framework owns its own closed mode vocabulary.
```

## claim_f42ace0d2bf01bdaa0da2ca54c79a82c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-32, lines 133–133.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-35.
Source digest: 76e4802e53492552a4187c1aaad3086e3ae4cab2ec78c8c2a22f8c135747ca57
Target digest: 76e4802e53492552a4187c1aaad3086e3ae4cab2ec78c8c2a22f8c135747ca57
Shown source SHA256: 76e4802e53492552a4187c1aaad3086e3ae4cab2ec78c8c2a22f8c135747ca57
Shown target SHA256: 76e4802e53492552a4187c1aaad3086e3ae4cab2ec78c8c2a22f8c135747ca57

### Proposed decision

```json
{
  "claimId": "claim_f42ace0d2bf01bdaa0da2ca54c79a82c",
  "sourceUnitDigest": "76e4802e53492552a4187c1aaad3086e3ae4cab2ec78c8c2a22f8c135747ca57",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "76e4802e53492552a4187c1aaad3086e3ae4cab2ec78c8c2a22f8c135747ca57",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.7 Framework And Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-32 (lines 133–133) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-35 (lines 157–157); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Framework/mode must not be used as the primary filesystem layout. Otherwise the first non-Diataxis framework recreates the same structural problem under another name.
```

### Full target shown text

```text
Framework/mode must not be used as the primary filesystem layout. Otherwise the first non-Diataxis framework recreates the same structural problem under another name.
```

## claim_c7b2fab7e34667ed4b21cc9adce175b6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#58-document-lifecycle, lines 135–135.
Target: docs/platform/proposals/knowledge-registry-redesign.md#58-document-lifecycle.
Source digest: df80058fde80a113d7ee141fb907b78c60a7dca7eed152f7ac8798f2492e30b0
Target digest: df80058fde80a113d7ee141fb907b78c60a7dca7eed152f7ac8798f2492e30b0
Shown source SHA256: 36910bc3df55c2a38343f7263e851eca00db1771c3fd3bfbbd403a2dac962e3f
Shown target SHA256: 36910bc3df55c2a38343f7263e851eca00db1771c3fd3bfbbd403a2dac962e3f

### Proposed decision

```json
{
  "claimId": "claim_c7b2fab7e34667ed4b21cc9adce175b6",
  "sourceUnitDigest": "df80058fde80a113d7ee141fb907b78c60a7dca7eed152f7ac8798f2492e30b0",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "58-document-lifecycle",
  "targetUnitDigest": "df80058fde80a113d7ee141fb907b78c60a7dca7eed152f7ac8798f2492e30b0",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#58-document-lifecycle (lines 135–135) is carried at docs/platform/proposals/knowledge-registry-redesign.md#58-document-lifecycle (lines 159–159); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 5.8 Document Lifecycle

Documents use the lifecycle vocabulary:

- `reserved` - a registry slot and path are held before prose exists;
- `provisional` - prose exists and is linked, but is not yet authoritative;
- `active` - the authoritative document for its topic and role;
- `superseded` - replaced by another document or topic lineage;
- `retired` - no longer current, with successor or reason recorded.

Do not use `draft` for document lifecycle while `draft` is already used for extracted material. That would put the same label on two different axes.
```

### Full target shown text

```text
### 5.8 Document Lifecycle

Documents use the lifecycle vocabulary:

- `reserved` - a registry slot and path are held before prose exists;
- `provisional` - prose exists and is linked, but is not yet authoritative;
- `active` - the authoritative document for its topic and role;
- `superseded` - replaced by another document or topic lineage;
- `retired` - no longer current, with successor or reason recorded.

Do not use `draft` for document lifecycle while `draft` is already used for extracted material. That would put the same label on two different axes.
```

## claim_7a7e850c69fa157b6259d1eaa33e69b0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-33, lines 137–137.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-36.
Source digest: a125c5c5d352bc96f9bffabe5e353d4f2bd8d13d7e45757c9418deb3be995fe1
Target digest: a125c5c5d352bc96f9bffabe5e353d4f2bd8d13d7e45757c9418deb3be995fe1
Shown source SHA256: a125c5c5d352bc96f9bffabe5e353d4f2bd8d13d7e45757c9418deb3be995fe1
Shown target SHA256: a125c5c5d352bc96f9bffabe5e353d4f2bd8d13d7e45757c9418deb3be995fe1

### Proposed decision

```json
{
  "claimId": "claim_7a7e850c69fa157b6259d1eaa33e69b0",
  "sourceUnitDigest": "a125c5c5d352bc96f9bffabe5e353d4f2bd8d13d7e45757c9418deb3be995fe1",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "a125c5c5d352bc96f9bffabe5e353d4f2bd8d13d7e45757c9418deb3be995fe1",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.8 Document Lifecycle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-33 (lines 137–137) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-36 (lines 161–161); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Documents use the lifecycle vocabulary:
```

### Full target shown text

```text
Documents use the lifecycle vocabulary:
```

## claim_45b3c308721913597841c67440a2b25b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-34, lines 139–143.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-37.
Source digest: a6b27f4ebff7faacac68bf9cffa06caba948d51adee7a60414278166c189e253
Target digest: a6b27f4ebff7faacac68bf9cffa06caba948d51adee7a60414278166c189e253
Shown source SHA256: a6b27f4ebff7faacac68bf9cffa06caba948d51adee7a60414278166c189e253
Shown target SHA256: a6b27f4ebff7faacac68bf9cffa06caba948d51adee7a60414278166c189e253

### Proposed decision

```json
{
  "claimId": "claim_45b3c308721913597841c67440a2b25b",
  "sourceUnitDigest": "a6b27f4ebff7faacac68bf9cffa06caba948d51adee7a60414278166c189e253",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "a6b27f4ebff7faacac68bf9cffa06caba948d51adee7a60414278166c189e253",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.8 Document Lifecycle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-34 (lines 139–143) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-37 (lines 163–167); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `reserved` - a registry slot and path are held before prose exists;
- `provisional` - prose exists and is linked, but is not yet authoritative;
- `active` - the authoritative document for its topic and role;
- `superseded` - replaced by another document or topic lineage;
- `retired` - no longer current, with successor or reason recorded.
```

### Full target shown text

```text
- `reserved` - a registry slot and path are held before prose exists;
- `provisional` - prose exists and is linked, but is not yet authoritative;
- `active` - the authoritative document for its topic and role;
- `superseded` - replaced by another document or topic lineage;
- `retired` - no longer current, with successor or reason recorded.
```

## claim_841347cb154f7dec3e761991720490ff

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-35, lines 145–145.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-38.
Source digest: da53402e3440c28a0650f5f6eb20f3ee43d465252d264782421e7d1edc16c181
Target digest: da53402e3440c28a0650f5f6eb20f3ee43d465252d264782421e7d1edc16c181
Shown source SHA256: da53402e3440c28a0650f5f6eb20f3ee43d465252d264782421e7d1edc16c181
Shown target SHA256: da53402e3440c28a0650f5f6eb20f3ee43d465252d264782421e7d1edc16c181

### Proposed decision

```json
{
  "claimId": "claim_841347cb154f7dec3e761991720490ff",
  "sourceUnitDigest": "da53402e3440c28a0650f5f6eb20f3ee43d465252d264782421e7d1edc16c181",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "da53402e3440c28a0650f5f6eb20f3ee43d465252d264782421e7d1edc16c181",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "5. Vocabulary",
    "5.8 Document Lifecycle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-35 (lines 145–145) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-38 (lines 169–169); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Do not use `draft` for document lifecycle while `draft` is already used for extracted material. That would put the same label on two different axes.
```

### Full target shown text

```text
Do not use `draft` for document lifecycle while `draft` is already used for extracted material. That would put the same label on two different axes.
```

## claim_4a2b9083ad65975a5dd8c36e5586e0e0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#6-identity-model, lines 147–147.
Target: docs/platform/proposals/knowledge-registry-redesign.md#6-identity-model.
Source digest: 0d1c27d56bdae68ea20858e2c471f477bef5a266f3d7da17d2308857f1004666
Target digest: 0d1c27d56bdae68ea20858e2c471f477bef5a266f3d7da17d2308857f1004666
Shown source SHA256: 4e2f0419d196cd95b5a4aafef540b379c7f60112bee685fec56d80b65389421b
Shown target SHA256: 4e2f0419d196cd95b5a4aafef540b379c7f60112bee685fec56d80b65389421b

### Proposed decision

```json
{
  "claimId": "claim_4a2b9083ad65975a5dd8c36e5586e0e0",
  "sourceUnitDigest": "0d1c27d56bdae68ea20858e2c471f477bef5a266f3d7da17d2308857f1004666",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "6-identity-model",
  "targetUnitDigest": "0d1c27d56bdae68ea20858e2c471f477bef5a266f3d7da17d2308857f1004666",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#6-identity-model (lines 147–147) is carried at docs/platform/proposals/knowledge-registry-redesign.md#6-identity-model (lines 171–171); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 6. Identity Model
```

### Full target shown text

```text
## 6. Identity Model
```

## claim_47d8facdbdfecfbabb61d4e981328f51

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#61-cardinality, lines 149–149.
Target: docs/platform/proposals/knowledge-registry-redesign.md#61-cardinality.
Source digest: 856ed33217beff0ce4aa41c09ba36e0018844b3d682449f0423c91f2a47c2c0f
Target digest: 856ed33217beff0ce4aa41c09ba36e0018844b3d682449f0423c91f2a47c2c0f
Shown source SHA256: 1c52df2828a1c7050a019b0e4b86925d465e0517f54da5619fec65f86d23b758
Shown target SHA256: 1c52df2828a1c7050a019b0e4b86925d465e0517f54da5619fec65f86d23b758

### Proposed decision

```json
{
  "claimId": "claim_47d8facdbdfecfbabb61d4e981328f51",
  "sourceUnitDigest": "856ed33217beff0ce4aa41c09ba36e0018844b3d682449f0423c91f2a47c2c0f",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "61-cardinality",
  "targetUnitDigest": "856ed33217beff0ce4aa41c09ba36e0018844b3d682449f0423c91f2a47c2c0f",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#61-cardinality (lines 149–149) is carried at docs/platform/proposals/knowledge-registry-redesign.md#61-cardinality (lines 173–173); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.1 Cardinality

The central invariant is:

```txt
activeDoc(topicId, role) <= 1
```

There is no "extra doc id" escape hatch at write time. A technical `docId` may exist as a registry row identifier, but it never grants semantic permission to create another active document for the same topic and role.

If the system needs more than one active document for what appears to be the same topic and role, the topic boundary is wrong. The path forward is an explicit topic split, topic merge, or role change with lineage.
````

### Full target shown text

````text
### 6.1 Cardinality

The central invariant is:

```txt
activeDoc(topicId, role) <= 1
```

There is no "extra doc id" escape hatch at write time. A technical `docId` may exist as a registry row identifier, but it never grants semantic permission to create another active document for the same topic and role.

If the system needs more than one active document for what appears to be the same topic and role, the topic boundary is wrong. The path forward is an explicit topic split, topic merge, or role change with lineage.
````

## claim_391b354956dadb6ebd23f7a17fce5265

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-36, lines 151–151.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-39.
Source digest: 2d2be1df1e31b6859766c694473a2c3c3ed08df09655fafa72a635ebfb42bfbd
Target digest: 2d2be1df1e31b6859766c694473a2c3c3ed08df09655fafa72a635ebfb42bfbd
Shown source SHA256: 2d2be1df1e31b6859766c694473a2c3c3ed08df09655fafa72a635ebfb42bfbd
Shown target SHA256: 2d2be1df1e31b6859766c694473a2c3c3ed08df09655fafa72a635ebfb42bfbd

### Proposed decision

```json
{
  "claimId": "claim_391b354956dadb6ebd23f7a17fce5265",
  "sourceUnitDigest": "2d2be1df1e31b6859766c694473a2c3c3ed08df09655fafa72a635ebfb42bfbd",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "2d2be1df1e31b6859766c694473a2c3c3ed08df09655fafa72a635ebfb42bfbd",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.1 Cardinality"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-36 (lines 151–151) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-39 (lines 175–175); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The central invariant is:
```

### Full target shown text

```text
The central invariant is:
```

## claim_fca94e02d1a08721830847ab60c9d927

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-37, lines 153–155.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-40.
Source digest: 376cde44da7727d4ee3129c3cb7a4e5829b901522af2454e74595cb1c32f5df6
Target digest: 376cde44da7727d4ee3129c3cb7a4e5829b901522af2454e74595cb1c32f5df6
Shown source SHA256: 376cde44da7727d4ee3129c3cb7a4e5829b901522af2454e74595cb1c32f5df6
Shown target SHA256: 376cde44da7727d4ee3129c3cb7a4e5829b901522af2454e74595cb1c32f5df6

### Proposed decision

```json
{
  "claimId": "claim_fca94e02d1a08721830847ab60c9d927",
  "sourceUnitDigest": "376cde44da7727d4ee3129c3cb7a4e5829b901522af2454e74595cb1c32f5df6",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "376cde44da7727d4ee3129c3cb7a4e5829b901522af2454e74595cb1c32f5df6",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.1 Cardinality"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-37 (lines 153–155) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-40 (lines 177–179); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
activeDoc(topicId, role) <= 1
```
````

### Full target shown text

````text
```txt
activeDoc(topicId, role) <= 1
```
````

## claim_abb6a9d42b0dca87f24b96b970a911e0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-38, lines 157–157.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-41.
Source digest: ad10f4098a41a2e85339dcf98198c6d727b2fceab48ed4f6b44106b251f6824b
Target digest: ad10f4098a41a2e85339dcf98198c6d727b2fceab48ed4f6b44106b251f6824b
Shown source SHA256: ad10f4098a41a2e85339dcf98198c6d727b2fceab48ed4f6b44106b251f6824b
Shown target SHA256: ad10f4098a41a2e85339dcf98198c6d727b2fceab48ed4f6b44106b251f6824b

### Proposed decision

```json
{
  "claimId": "claim_abb6a9d42b0dca87f24b96b970a911e0",
  "sourceUnitDigest": "ad10f4098a41a2e85339dcf98198c6d727b2fceab48ed4f6b44106b251f6824b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "ad10f4098a41a2e85339dcf98198c6d727b2fceab48ed4f6b44106b251f6824b",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.1 Cardinality"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-38 (lines 157–157) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-41 (lines 181–181); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
There is no "extra doc id" escape hatch at write time. A technical `docId` may exist as a registry row identifier, but it never grants semantic permission to create another active document for the same topic and role.
```

### Full target shown text

```text
There is no "extra doc id" escape hatch at write time. A technical `docId` may exist as a registry row identifier, but it never grants semantic permission to create another active document for the same topic and role.
```

## claim_14cf1d618621091166e87eab89437537

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-39, lines 159–159.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-42.
Source digest: f9847f06343232d434e2efe0375e05c80c79d2520463320415a1024ba2aaa920
Target digest: f9847f06343232d434e2efe0375e05c80c79d2520463320415a1024ba2aaa920
Shown source SHA256: f9847f06343232d434e2efe0375e05c80c79d2520463320415a1024ba2aaa920
Shown target SHA256: f9847f06343232d434e2efe0375e05c80c79d2520463320415a1024ba2aaa920

### Proposed decision

```json
{
  "claimId": "claim_14cf1d618621091166e87eab89437537",
  "sourceUnitDigest": "f9847f06343232d434e2efe0375e05c80c79d2520463320415a1024ba2aaa920",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "f9847f06343232d434e2efe0375e05c80c79d2520463320415a1024ba2aaa920",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.1 Cardinality"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-39 (lines 159–159) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-42 (lines 183–183); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
If the system needs more than one active document for what appears to be the same topic and role, the topic boundary is wrong. The path forward is an explicit topic split, topic merge, or role change with lineage.
```

### Full target shown text

```text
If the system needs more than one active document for what appears to be the same topic and role, the topic boundary is wrong. The path forward is an explicit topic split, topic merge, or role change with lineage.
```

## claim_d7e6a052f3aa57c6a20d866330d7d6b5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#62-path-projection, lines 161–161.
Target: docs/platform/proposals/knowledge-registry-redesign.md#62-path-projection.
Source digest: c8d8e06ba6ac0e0009d9d2ab5d8e180ee5d034c73c651b8c380d0ebfed998b64
Target digest: c8d8e06ba6ac0e0009d9d2ab5d8e180ee5d034c73c651b8c380d0ebfed998b64
Shown source SHA256: ec31f5c57388fa9289e911a8abca8474c6fb854f45d808cc42c53ac996dd0276
Shown target SHA256: ec31f5c57388fa9289e911a8abca8474c6fb854f45d808cc42c53ac996dd0276

### Proposed decision

```json
{
  "claimId": "claim_d7e6a052f3aa57c6a20d866330d7d6b5",
  "sourceUnitDigest": "c8d8e06ba6ac0e0009d9d2ab5d8e180ee5d034c73c651b8c380d0ebfed998b64",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "62-path-projection",
  "targetUnitDigest": "c8d8e06ba6ac0e0009d9d2ab5d8e180ee5d034c73c651b8c380d0ebfed998b64",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#62-path-projection (lines 161–161) is carried at docs/platform/proposals/knowledge-registry-redesign.md#62-path-projection (lines 185–185); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.2 Path Projection

The normal projected path is:

```txt
docs/knowledge/<purposeSlug>/<role>.md
```

This path is a projection of registry state, not the source of truth. It gives the filesystem the structure humans want from `ls docs/`, while the registry preserves identity across moves.
````

### Full target shown text

````text
### 6.2 Path Projection

The normal projected path is:

```txt
docs/knowledge/<purposeSlug>/<role>.md
```

This path is a projection of registry state, not the source of truth. It gives the filesystem the structure humans want from `ls docs/`, while the registry preserves identity across moves.
````

## claim_d1fa964c2304ee20ea199f2ee5b401e5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-40, lines 163–163.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-43.
Source digest: b8b18dfe2891469cc46b5280a93288e3c04b71f45f0874dfd8f9f4634020524c
Target digest: b8b18dfe2891469cc46b5280a93288e3c04b71f45f0874dfd8f9f4634020524c
Shown source SHA256: b8b18dfe2891469cc46b5280a93288e3c04b71f45f0874dfd8f9f4634020524c
Shown target SHA256: b8b18dfe2891469cc46b5280a93288e3c04b71f45f0874dfd8f9f4634020524c

### Proposed decision

```json
{
  "claimId": "claim_d1fa964c2304ee20ea199f2ee5b401e5",
  "sourceUnitDigest": "b8b18dfe2891469cc46b5280a93288e3c04b71f45f0874dfd8f9f4634020524c",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "b8b18dfe2891469cc46b5280a93288e3c04b71f45f0874dfd8f9f4634020524c",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.2 Path Projection"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-40 (lines 163–163) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-43 (lines 187–187); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The normal projected path is:
```

### Full target shown text

```text
The normal projected path is:
```

## claim_378f176a24c737ea410dcebe9b22a801

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-41, lines 165–167.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-44.
Source digest: 99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8
Target digest: 99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8
Shown source SHA256: 99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8
Shown target SHA256: 99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8

### Proposed decision

```json
{
  "claimId": "claim_378f176a24c737ea410dcebe9b22a801",
  "sourceUnitDigest": "99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "99a541bc6f36182ac4a91cdcac764594c365dc469fd8d8bbde4db9e9c2674bb8",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.2 Path Projection"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: target digest repeats; ancestor headings differ. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-41 (lines 165–167) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-44 (lines 189–191); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
docs/knowledge/<purposeSlug>/<role>.md
```
````

### Full target shown text

````text
```txt
docs/knowledge/<purposeSlug>/<role>.md
```
````

## claim_3a0a6705e09e29ed45982daad2181565

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-42, lines 169–169.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-45.
Source digest: b27809361339cbedc3ce0d9567b0af38ff2851809238980057582f5869c8f64b
Target digest: b27809361339cbedc3ce0d9567b0af38ff2851809238980057582f5869c8f64b
Shown source SHA256: b27809361339cbedc3ce0d9567b0af38ff2851809238980057582f5869c8f64b
Shown target SHA256: b27809361339cbedc3ce0d9567b0af38ff2851809238980057582f5869c8f64b

### Proposed decision

```json
{
  "claimId": "claim_3a0a6705e09e29ed45982daad2181565",
  "sourceUnitDigest": "b27809361339cbedc3ce0d9567b0af38ff2851809238980057582f5869c8f64b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "b27809361339cbedc3ce0d9567b0af38ff2851809238980057582f5869c8f64b",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.2 Path Projection"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-42 (lines 169–169) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-45 (lines 193–193); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This path is a projection of registry state, not the source of truth. It gives the filesystem the structure humans want from `ls docs/`, while the registry preserves identity across moves.
```

### Full target shown text

```text
This path is a projection of registry state, not the source of truth. It gives the filesystem the structure humans want from `ls docs/`, while the registry preserves identity across moves.
```

## claim_004bb45c2c3d0e37cf5f8cea254b18d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#63-current-path-and-aliases, lines 171–171.
Target: docs/platform/proposals/knowledge-registry-redesign.md#63-current-path-and-aliases.
Source digest: 638b615b090618fb7e96ae1623caf4c8af51181553da0c932b28a5d3a1e6e0e7
Target digest: 638b615b090618fb7e96ae1623caf4c8af51181553da0c932b28a5d3a1e6e0e7
Shown source SHA256: 4c0d0d58b68f284eedaacc96855e0eb48688333e83643c0d40282aa898a7a8f4
Shown target SHA256: 4c0d0d58b68f284eedaacc96855e0eb48688333e83643c0d40282aa898a7a8f4

### Proposed decision

```json
{
  "claimId": "claim_004bb45c2c3d0e37cf5f8cea254b18d9",
  "sourceUnitDigest": "638b615b090618fb7e96ae1623caf4c8af51181553da0c932b28a5d3a1e6e0e7",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "63-current-path-and-aliases",
  "targetUnitDigest": "638b615b090618fb7e96ae1623caf4c8af51181553da0c932b28a5d3a1e6e0e7",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#63-current-path-and-aliases (lines 171–171) is carried at docs/platform/proposals/knowledge-registry-redesign.md#63-current-path-and-aliases (lines 195–195); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 6.3 Current Path And Aliases

Each document slot has:

- `currentPath` - the only path accepted for new attestations;
- `aliases` - historical paths used for read resolution only.

Aliases are not write targets. A new capture must not tag an alias path. If a legacy writer commits a file at an old path, the producer door refuses it even if the alias resolves for reads.
```

### Full target shown text

```text
### 6.3 Current Path And Aliases

Each document slot has:

- `currentPath` - the only path accepted for new attestations;
- `aliases` - historical paths used for read resolution only.

Aliases are not write targets. A new capture must not tag an alias path. If a legacy writer commits a file at an old path, the producer door refuses it even if the alias resolves for reads.
```

## claim_0915cc189775b250e06d697d875c65b3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-43, lines 173–173.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-46.
Source digest: ecef573ffe837822c7a2958fbb75b439a33f0b94bd33dfe0b5a1d4065ec9725f
Target digest: ecef573ffe837822c7a2958fbb75b439a33f0b94bd33dfe0b5a1d4065ec9725f
Shown source SHA256: ecef573ffe837822c7a2958fbb75b439a33f0b94bd33dfe0b5a1d4065ec9725f
Shown target SHA256: ecef573ffe837822c7a2958fbb75b439a33f0b94bd33dfe0b5a1d4065ec9725f

### Proposed decision

```json
{
  "claimId": "claim_0915cc189775b250e06d697d875c65b3",
  "sourceUnitDigest": "ecef573ffe837822c7a2958fbb75b439a33f0b94bd33dfe0b5a1d4065ec9725f",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "ecef573ffe837822c7a2958fbb75b439a33f0b94bd33dfe0b5a1d4065ec9725f",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.3 Current Path And Aliases"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-43 (lines 173–173) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-46 (lines 197–197); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Each document slot has:
```

### Full target shown text

```text
Each document slot has:
```

## claim_3b56c612c40728294170b6063607ea46

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-44, lines 175–176.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-47.
Source digest: e7069eb8ad9dfff5cf0aae968211aae17965c002f8813973024b5f9a45180236
Target digest: e7069eb8ad9dfff5cf0aae968211aae17965c002f8813973024b5f9a45180236
Shown source SHA256: e7069eb8ad9dfff5cf0aae968211aae17965c002f8813973024b5f9a45180236
Shown target SHA256: e7069eb8ad9dfff5cf0aae968211aae17965c002f8813973024b5f9a45180236

### Proposed decision

```json
{
  "claimId": "claim_3b56c612c40728294170b6063607ea46",
  "sourceUnitDigest": "e7069eb8ad9dfff5cf0aae968211aae17965c002f8813973024b5f9a45180236",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "e7069eb8ad9dfff5cf0aae968211aae17965c002f8813973024b5f9a45180236",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.3 Current Path And Aliases"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-44 (lines 175–176) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-47 (lines 199–200); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `currentPath` - the only path accepted for new attestations;
- `aliases` - historical paths used for read resolution only.
```

### Full target shown text

```text
- `currentPath` - the only path accepted for new attestations;
- `aliases` - historical paths used for read resolution only.
```

## claim_8e67561c942159e4872f2d1a83749549

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-45, lines 178–178.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-48.
Source digest: 9099a6dc90c33b213bd015ebadffdebacfe6eb18875cd8d9ddc910f5eecbb8de
Target digest: 9099a6dc90c33b213bd015ebadffdebacfe6eb18875cd8d9ddc910f5eecbb8de
Shown source SHA256: 9099a6dc90c33b213bd015ebadffdebacfe6eb18875cd8d9ddc910f5eecbb8de
Shown target SHA256: 9099a6dc90c33b213bd015ebadffdebacfe6eb18875cd8d9ddc910f5eecbb8de

### Proposed decision

```json
{
  "claimId": "claim_8e67561c942159e4872f2d1a83749549",
  "sourceUnitDigest": "9099a6dc90c33b213bd015ebadffdebacfe6eb18875cd8d9ddc910f5eecbb8de",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "9099a6dc90c33b213bd015ebadffdebacfe6eb18875cd8d9ddc910f5eecbb8de",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.3 Current Path And Aliases"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-45 (lines 178–178) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-48 (lines 202–202); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Aliases are not write targets. A new capture must not tag an alias path. If a legacy writer commits a file at an old path, the producer door refuses it even if the alias resolves for reads.
```

### Full target shown text

```text
Aliases are not write targets. A new capture must not tag an alias path. If a legacy writer commits a file at an old path, the producer door refuses it even if the alias resolves for reads.
```

## claim_6b5e031d2b7e693dd7854f95c1a662ea

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#64-topic-lineage, lines 180–180.
Target: docs/platform/proposals/knowledge-registry-redesign.md#64-topic-lineage.
Source digest: b181c7a315d6ec4e21b69d53e21528f0dfc9baef36a89cbf76983f7d4c087d4f
Target digest: b181c7a315d6ec4e21b69d53e21528f0dfc9baef36a89cbf76983f7d4c087d4f
Shown source SHA256: e7991714319e67178156e67c6c8715387134b29e447dd50437950cd0f12eb8ee
Shown target SHA256: e7991714319e67178156e67c6c8715387134b29e447dd50437950cd0f12eb8ee

### Proposed decision

```json
{
  "claimId": "claim_6b5e031d2b7e693dd7854f95c1a662ea",
  "sourceUnitDigest": "b181c7a315d6ec4e21b69d53e21528f0dfc9baef36a89cbf76983f7d4c087d4f",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "64-topic-lineage",
  "targetUnitDigest": "b181c7a315d6ec4e21b69d53e21528f0dfc9baef36a89cbf76983f7d4c087d4f",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#64-topic-lineage (lines 180–180) is carried at docs/platform/proposals/knowledge-registry-redesign.md#64-topic-lineage (lines 204–204); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 6.4 Topic Lineage

Topic lineage records:

- rename: one topic keeps identity, purpose label changes;
- split: one topic retires or narrows, two or more successor topics become active;
- merge: multiple topics retire into one successor;
- retire: topic no longer accepts active documents.

Lineage is what makes "many documents after a split" legitimate. Multiple active documents with the same role are allowed only when they belong to different successor topics.
```

### Full target shown text

```text
### 6.4 Topic Lineage

Topic lineage records:

- rename: one topic keeps identity, purpose label changes;
- split: one topic retires or narrows, two or more successor topics become active;
- merge: multiple topics retire into one successor;
- retire: topic no longer accepts active documents.

Lineage is what makes "many documents after a split" legitimate. Multiple active documents with the same role are allowed only when they belong to different successor topics.
```

## claim_517f4a6179b29f3121241023bd0112b1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-46, lines 182–182.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-49.
Source digest: 5310f3c9e54d4d1ec3789d2c8712fc6ecb4c3a3d4caf5fb7c82015f3f2a344ea
Target digest: 5310f3c9e54d4d1ec3789d2c8712fc6ecb4c3a3d4caf5fb7c82015f3f2a344ea
Shown source SHA256: 5310f3c9e54d4d1ec3789d2c8712fc6ecb4c3a3d4caf5fb7c82015f3f2a344ea
Shown target SHA256: 5310f3c9e54d4d1ec3789d2c8712fc6ecb4c3a3d4caf5fb7c82015f3f2a344ea

### Proposed decision

```json
{
  "claimId": "claim_517f4a6179b29f3121241023bd0112b1",
  "sourceUnitDigest": "5310f3c9e54d4d1ec3789d2c8712fc6ecb4c3a3d4caf5fb7c82015f3f2a344ea",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "5310f3c9e54d4d1ec3789d2c8712fc6ecb4c3a3d4caf5fb7c82015f3f2a344ea",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.4 Topic Lineage"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-46 (lines 182–182) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-49 (lines 206–206); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Topic lineage records:
```

### Full target shown text

```text
Topic lineage records:
```

## claim_63c67647dbed11198a62b0966bc8caa2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-47, lines 184–187.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-50.
Source digest: a77d286957b1682e939926a51be1194fe1e3458bf50d6334d3f0eea70868c429
Target digest: a77d286957b1682e939926a51be1194fe1e3458bf50d6334d3f0eea70868c429
Shown source SHA256: a77d286957b1682e939926a51be1194fe1e3458bf50d6334d3f0eea70868c429
Shown target SHA256: a77d286957b1682e939926a51be1194fe1e3458bf50d6334d3f0eea70868c429

### Proposed decision

```json
{
  "claimId": "claim_63c67647dbed11198a62b0966bc8caa2",
  "sourceUnitDigest": "a77d286957b1682e939926a51be1194fe1e3458bf50d6334d3f0eea70868c429",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "a77d286957b1682e939926a51be1194fe1e3458bf50d6334d3f0eea70868c429",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.4 Topic Lineage"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-47 (lines 184–187) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-50 (lines 208–211); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- rename: one topic keeps identity, purpose label changes;
- split: one topic retires or narrows, two or more successor topics become active;
- merge: multiple topics retire into one successor;
- retire: topic no longer accepts active documents.
```

### Full target shown text

```text
- rename: one topic keeps identity, purpose label changes;
- split: one topic retires or narrows, two or more successor topics become active;
- merge: multiple topics retire into one successor;
- retire: topic no longer accepts active documents.
```

## claim_4985e24aeb65f7973bf0f5bc0cec9cf0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-48, lines 189–189.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-51.
Source digest: 6017d0306a7a0617f2795470b68274460bbc959495b87210deabc98f99404298
Target digest: 6017d0306a7a0617f2795470b68274460bbc959495b87210deabc98f99404298
Shown source SHA256: 6017d0306a7a0617f2795470b68274460bbc959495b87210deabc98f99404298
Shown target SHA256: 6017d0306a7a0617f2795470b68274460bbc959495b87210deabc98f99404298

### Proposed decision

```json
{
  "claimId": "claim_4985e24aeb65f7973bf0f5bc0cec9cf0",
  "sourceUnitDigest": "6017d0306a7a0617f2795470b68274460bbc959495b87210deabc98f99404298",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "6017d0306a7a0617f2795470b68274460bbc959495b87210deabc98f99404298",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "6. Identity Model",
    "6.4 Topic Lineage"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-48 (lines 189–189) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-51 (lines 213–213); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Lineage is what makes "many documents after a split" legitimate. Multiple active documents with the same role are allowed only when they belong to different successor topics.
```

### Full target shown text

```text
Lineage is what makes "many documents after a split" legitimate. Multiple active documents with the same role are allowed only when they belong to different successor topics.
```

## claim_aad58936bac2e2b81ff03f06027c15ca

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#7-registry-model, lines 191–191.
Target: docs/platform/proposals/knowledge-registry-redesign.md#7-registry-model.
Source digest: 855c5bacb20ca39777c03b521c9d5e598700cd9941183684a93fbfa13321c69c
Target digest: 855c5bacb20ca39777c03b521c9d5e598700cd9941183684a93fbfa13321c69c
Shown source SHA256: f874c0433beb14159a869be904ad5dadfa96dc18e8c6e55b5a3b4a38cb606c5b
Shown target SHA256: f874c0433beb14159a869be904ad5dadfa96dc18e8c6e55b5a3b4a38cb606c5b

### Proposed decision

```json
{
  "claimId": "claim_aad58936bac2e2b81ff03f06027c15ca",
  "sourceUnitDigest": "855c5bacb20ca39777c03b521c9d5e598700cd9941183684a93fbfa13321c69c",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "7-registry-model",
  "targetUnitDigest": "855c5bacb20ca39777c03b521c9d5e598700cd9941183684a93fbfa13321c69c",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#7-registry-model (lines 191–191) is carried at docs/platform/proposals/knowledge-registry-redesign.md#7-registry-model (lines 215–215); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 7. Registry Model

The registry source is event-sourced. Projections are derived.
```

### Full target shown text

```text
## 7. Registry Model

The registry source is event-sourced. Projections are derived.
```

## claim_45a482db54ef05ddbeb7ccd3446c150a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-49, lines 193–193.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-52.
Source digest: 69b862faaabb62fd106dbbbf88f2b55a6edee7c3e6e1ebe05fd804822d6c6c38
Target digest: 69b862faaabb62fd106dbbbf88f2b55a6edee7c3e6e1ebe05fd804822d6c6c38
Shown source SHA256: 69b862faaabb62fd106dbbbf88f2b55a6edee7c3e6e1ebe05fd804822d6c6c38
Shown target SHA256: 69b862faaabb62fd106dbbbf88f2b55a6edee7c3e6e1ebe05fd804822d6c6c38

### Proposed decision

```json
{
  "claimId": "claim_45a482db54ef05ddbeb7ccd3446c150a",
  "sourceUnitDigest": "69b862faaabb62fd106dbbbf88f2b55a6edee7c3e6e1ebe05fd804822d6c6c38",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "69b862faaabb62fd106dbbbf88f2b55a6edee7c3e6e1ebe05fd804822d6c6c38",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-49 (lines 193–193) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-52 (lines 217–217); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The registry source is event-sourced. Projections are derived.
```

### Full target shown text

```text
The registry source is event-sourced. Projections are derived.
```

## claim_4d27efb58f91eb2965bffc62442f88c3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#71-topic-events, lines 195–195.
Target: docs/platform/proposals/knowledge-registry-redesign.md#71-topic-events.
Source digest: 28259c892dbd164671ef902b7e6d32bf0fd58c20bf63e55cc576602a970cdf0b
Target digest: 28259c892dbd164671ef902b7e6d32bf0fd58c20bf63e55cc576602a970cdf0b
Shown source SHA256: 86ce7ff0463c9da791de16777b07df7d9aa52dfb6b58188dc256847fdb89f6d2
Shown target SHA256: 86ce7ff0463c9da791de16777b07df7d9aa52dfb6b58188dc256847fdb89f6d2

### Proposed decision

```json
{
  "claimId": "claim_4d27efb58f91eb2965bffc62442f88c3",
  "sourceUnitDigest": "28259c892dbd164671ef902b7e6d32bf0fd58c20bf63e55cc576602a970cdf0b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "71-topic-events",
  "targetUnitDigest": "28259c892dbd164671ef902b7e6d32bf0fd58c20bf63e55cc576602a970cdf0b",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#71-topic-events (lines 195–195) is carried at docs/platform/proposals/knowledge-registry-redesign.md#71-topic-events (lines 219–219); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 7.1 Topic Events

```txt
topic.register
topic.rename
topic.split
topic.merge
topic.retire
```

A topic record contains:

```yaml
topicId: worktree-reclaim-safety
purposeSlug: worktree-reclaim-safety
purposeTitle: Worktree reclaim safety
description: How fgOS distinguishes reclaimable worktrees from live work
entities: [worktree, claim, session-liveness, uncommitted-work]
lifecycle: active
lineage: []
```
````

### Full target shown text

````text
### 7.1 Topic Events

```txt
topic.register
topic.rename
topic.split
topic.merge
topic.retire
```

A topic record contains:

```yaml
topicId: worktree-reclaim-safety
purposeSlug: worktree-reclaim-safety
purposeTitle: Worktree reclaim safety
description: How fgOS distinguishes reclaimable worktrees from live work
entities: [worktree, claim, session-liveness, uncommitted-work]
lifecycle: active
lineage: []
```
````

## claim_c63aee15d6a3ada441775c2cfe2b9a2a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-50, lines 197–203.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-53.
Source digest: 077537453f3503ec51c73f973badac53cedf764675d960d79d1ef1219fd69feb
Target digest: 077537453f3503ec51c73f973badac53cedf764675d960d79d1ef1219fd69feb
Shown source SHA256: 077537453f3503ec51c73f973badac53cedf764675d960d79d1ef1219fd69feb
Shown target SHA256: 077537453f3503ec51c73f973badac53cedf764675d960d79d1ef1219fd69feb

### Proposed decision

```json
{
  "claimId": "claim_c63aee15d6a3ada441775c2cfe2b9a2a",
  "sourceUnitDigest": "077537453f3503ec51c73f973badac53cedf764675d960d79d1ef1219fd69feb",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "077537453f3503ec51c73f973badac53cedf764675d960d79d1ef1219fd69feb",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.1 Topic Events"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-50 (lines 197–203) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-53 (lines 221–227); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
topic.register
topic.rename
topic.split
topic.merge
topic.retire
```
````

### Full target shown text

````text
```txt
topic.register
topic.rename
topic.split
topic.merge
topic.retire
```
````

## claim_209373acd7a525a86ccdf601a2db3a94

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-51, lines 205–205.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-54.
Source digest: c48b59a9ff758d6149492773f7e2c9fc55e18f4561c14b1b4141f1b5a198de58
Target digest: c48b59a9ff758d6149492773f7e2c9fc55e18f4561c14b1b4141f1b5a198de58
Shown source SHA256: c48b59a9ff758d6149492773f7e2c9fc55e18f4561c14b1b4141f1b5a198de58
Shown target SHA256: c48b59a9ff758d6149492773f7e2c9fc55e18f4561c14b1b4141f1b5a198de58

### Proposed decision

```json
{
  "claimId": "claim_209373acd7a525a86ccdf601a2db3a94",
  "sourceUnitDigest": "c48b59a9ff758d6149492773f7e2c9fc55e18f4561c14b1b4141f1b5a198de58",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "c48b59a9ff758d6149492773f7e2c9fc55e18f4561c14b1b4141f1b5a198de58",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.1 Topic Events"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-51 (lines 205–205) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-54 (lines 229–229); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
A topic record contains:
```

### Full target shown text

```text
A topic record contains:
```

## claim_d1c0cce1e1a3a40f90fddce90afd45b2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-52, lines 207–215.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-55.
Source digest: 756d562b9efb511d9fa3e4e945d3f8016c022e4d442073b1bc1b585bf167bd1b
Target digest: 756d562b9efb511d9fa3e4e945d3f8016c022e4d442073b1bc1b585bf167bd1b
Shown source SHA256: 756d562b9efb511d9fa3e4e945d3f8016c022e4d442073b1bc1b585bf167bd1b
Shown target SHA256: 756d562b9efb511d9fa3e4e945d3f8016c022e4d442073b1bc1b585bf167bd1b

### Proposed decision

```json
{
  "claimId": "claim_d1c0cce1e1a3a40f90fddce90afd45b2",
  "sourceUnitDigest": "756d562b9efb511d9fa3e4e945d3f8016c022e4d442073b1bc1b585bf167bd1b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "756d562b9efb511d9fa3e4e945d3f8016c022e4d442073b1bc1b585bf167bd1b",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.1 Topic Events"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-52 (lines 207–215) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-55 (lines 231–239); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```yaml
topicId: worktree-reclaim-safety
purposeSlug: worktree-reclaim-safety
purposeTitle: Worktree reclaim safety
description: How fgOS distinguishes reclaimable worktrees from live work
entities: [worktree, claim, session-liveness, uncommitted-work]
lifecycle: active
lineage: []
```
````

### Full target shown text

````text
```yaml
topicId: worktree-reclaim-safety
purposeSlug: worktree-reclaim-safety
purposeTitle: Worktree reclaim safety
description: How fgOS distinguishes reclaimable worktrees from live work
entities: [worktree, claim, session-liveness, uncommitted-work]
lifecycle: active
lineage: []
```
````

## claim_2d50e35737f1316a2d7593519c64b42c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#72-role-registry, lines 217–217.
Target: docs/platform/proposals/knowledge-registry-redesign.md#72-role-registry.
Source digest: 164d8dd34f192ab6066338637aae65e6826043760805a2b9f3cc68498ef52ee8
Target digest: 164d8dd34f192ab6066338637aae65e6826043760805a2b9f3cc68498ef52ee8
Shown source SHA256: ca1d6b17c1164983099d71687910623d2f8129ea20e9b75f861e6cfe4a932a11
Shown target SHA256: ca1d6b17c1164983099d71687910623d2f8129ea20e9b75f861e6cfe4a932a11

### Proposed decision

```json
{
  "claimId": "claim_2d50e35737f1316a2d7593519c64b42c",
  "sourceUnitDigest": "164d8dd34f192ab6066338637aae65e6826043760805a2b9f3cc68498ef52ee8",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "72-role-registry",
  "targetUnitDigest": "164d8dd34f192ab6066338637aae65e6826043760805a2b9f3cc68498ef52ee8",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#72-role-registry (lines 217–217) is carried at docs/platform/proposals/knowledge-registry-redesign.md#72-role-registry (lines 241–241); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 7.2 Role Registry

Role vocabulary is a registry with explicit policy:

```yaml
role: pitfall
meaning: A recurring failure shape, its cause, and how to avoid or recognize it
defaultFramework: diataxis
defaultMode: explanation
requiredFields: [symptom, cause, prevention]
lifecyclePolicy: refine
```

Rules:

1. A role name must not equal any framework mode name. For example, `reference` is not a valid role name while Diataxis has `reference` as a mode.
2. A role exists only when it carries different lifecycle, metadata, or consumption policy.
3. A one-off role with only one document is suspicious and must be surfaced by the harness, not silently accepted forever.
````

### Full target shown text

````text
### 7.2 Role Registry

Role vocabulary is a registry with explicit policy:

```yaml
role: pitfall
meaning: A recurring failure shape, its cause, and how to avoid or recognize it
defaultFramework: diataxis
defaultMode: explanation
requiredFields: [symptom, cause, prevention]
lifecyclePolicy: refine
```

Rules:

1. A role name must not equal any framework mode name. For example, `reference` is not a valid role name while Diataxis has `reference` as a mode.
2. A role exists only when it carries different lifecycle, metadata, or consumption policy.
3. A one-off role with only one document is suspicious and must be surfaced by the harness, not silently accepted forever.
````

## claim_245b6805f05aa67a44d17c913c907695

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-53, lines 219–219.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-56.
Source digest: 98280a0b6df3e11154c4b5cd4b7f82eb6efab64095abf845b25fa0392d043e6a
Target digest: 98280a0b6df3e11154c4b5cd4b7f82eb6efab64095abf845b25fa0392d043e6a
Shown source SHA256: 98280a0b6df3e11154c4b5cd4b7f82eb6efab64095abf845b25fa0392d043e6a
Shown target SHA256: 98280a0b6df3e11154c4b5cd4b7f82eb6efab64095abf845b25fa0392d043e6a

### Proposed decision

```json
{
  "claimId": "claim_245b6805f05aa67a44d17c913c907695",
  "sourceUnitDigest": "98280a0b6df3e11154c4b5cd4b7f82eb6efab64095abf845b25fa0392d043e6a",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "98280a0b6df3e11154c4b5cd4b7f82eb6efab64095abf845b25fa0392d043e6a",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.2 Role Registry"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-53 (lines 219–219) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-56 (lines 243–243); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Role vocabulary is a registry with explicit policy:
```

### Full target shown text

```text
Role vocabulary is a registry with explicit policy:
```

## claim_3733acd5042525dad78d405a39392d0f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-54, lines 221–228.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-57.
Source digest: 7b00c05ddfb683e94cb7218b60d7afdf37437fcb3ba4d5957e3f0fe84b4fc5ba
Target digest: 7b00c05ddfb683e94cb7218b60d7afdf37437fcb3ba4d5957e3f0fe84b4fc5ba
Shown source SHA256: 7b00c05ddfb683e94cb7218b60d7afdf37437fcb3ba4d5957e3f0fe84b4fc5ba
Shown target SHA256: 7b00c05ddfb683e94cb7218b60d7afdf37437fcb3ba4d5957e3f0fe84b4fc5ba

### Proposed decision

```json
{
  "claimId": "claim_3733acd5042525dad78d405a39392d0f",
  "sourceUnitDigest": "7b00c05ddfb683e94cb7218b60d7afdf37437fcb3ba4d5957e3f0fe84b4fc5ba",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "7b00c05ddfb683e94cb7218b60d7afdf37437fcb3ba4d5957e3f0fe84b4fc5ba",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.2 Role Registry"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-54 (lines 221–228) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-57 (lines 245–252); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```yaml
role: pitfall
meaning: A recurring failure shape, its cause, and how to avoid or recognize it
defaultFramework: diataxis
defaultMode: explanation
requiredFields: [symptom, cause, prevention]
lifecyclePolicy: refine
```
````

### Full target shown text

````text
```yaml
role: pitfall
meaning: A recurring failure shape, its cause, and how to avoid or recognize it
defaultFramework: diataxis
defaultMode: explanation
requiredFields: [symptom, cause, prevention]
lifecyclePolicy: refine
```
````

## claim_5374bc15812b1c6106279df52892c0c0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-55, lines 230–234.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-58.
Source digest: 921faa33d4f5438516e9d3ffdf998cbba421be8d79f2a7f139d2d8db421d66bd
Target digest: 921faa33d4f5438516e9d3ffdf998cbba421be8d79f2a7f139d2d8db421d66bd
Shown source SHA256: 921faa33d4f5438516e9d3ffdf998cbba421be8d79f2a7f139d2d8db421d66bd
Shown target SHA256: 921faa33d4f5438516e9d3ffdf998cbba421be8d79f2a7f139d2d8db421d66bd

### Proposed decision

```json
{
  "claimId": "claim_5374bc15812b1c6106279df52892c0c0",
  "sourceUnitDigest": "921faa33d4f5438516e9d3ffdf998cbba421be8d79f2a7f139d2d8db421d66bd",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "921faa33d4f5438516e9d3ffdf998cbba421be8d79f2a7f139d2d8db421d66bd",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.2 Role Registry"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-55 (lines 230–234) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-58 (lines 254–258); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Rules:

1. A role name must not equal any framework mode name. For example, `reference` is not a valid role name while Diataxis has `reference` as a mode.
2. A role exists only when it carries different lifecycle, metadata, or consumption policy.
3. A one-off role with only one document is suspicious and must be surfaced by the harness, not silently accepted forever.
```

### Full target shown text

```text
Rules:

1. A role name must not equal any framework mode name. For example, `reference` is not a valid role name while Diataxis has `reference` as a mode.
2. A role exists only when it carries different lifecycle, metadata, or consumption policy.
3. A one-off role with only one document is suspicious and must be surfaced by the harness, not silently accepted forever.
```

## claim_241ee36d55946f3de2df9d54b1c6558a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#73-document-events, lines 236–236.
Target: docs/platform/proposals/knowledge-registry-redesign.md#73-document-events.
Source digest: a8b2d6271978f883d37d758eeb39ab04f890f9b260930728b42c8c50a9ebbafb
Target digest: a8b2d6271978f883d37d758eeb39ab04f890f9b260930728b42c8c50a9ebbafb
Shown source SHA256: 097ad42cc25115d994f7d0b55982cf73adbd3639c108164ac66c70398befe8bd
Shown target SHA256: 097ad42cc25115d994f7d0b55982cf73adbd3639c108164ac66c70398befe8bd

### Proposed decision

```json
{
  "claimId": "claim_241ee36d55946f3de2df9d54b1c6558a",
  "sourceUnitDigest": "a8b2d6271978f883d37d758eeb39ab04f890f9b260930728b42c8c50a9ebbafb",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "73-document-events",
  "targetUnitDigest": "a8b2d6271978f883d37d758eeb39ab04f890f9b260930728b42c8c50a9ebbafb",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#73-document-events (lines 236–236) is carried at docs/platform/proposals/knowledge-registry-redesign.md#73-document-events (lines 260–260); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 7.3 Document Events

```txt
doc.reserve
doc.mark-rendered
doc.move-path
doc.promote
doc.supersede
doc.retire
```

A document record contains:

```yaml
docId: doc-worktree-reclaim-safety-pitfall
topicId: worktree-reclaim-safety
role: pitfall
framework: diataxis
mode: explanation
lifecycle: provisional
currentPath: docs/worktree-reclaim-safety/pitfall.md
aliases:
  - docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md
  - docs/explanation/why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md
sourceCaptureIds: [tsk-a, tsk-b]
```
````

### Full target shown text

````text
### 7.3 Document Events

```txt
doc.reserve
doc.mark-rendered
doc.move-path
doc.promote
doc.supersede
doc.retire
```

A document record contains:

```yaml
docId: doc-worktree-reclaim-safety-pitfall
topicId: worktree-reclaim-safety
role: pitfall
framework: diataxis
mode: explanation
lifecycle: provisional
currentPath: docs/worktree-reclaim-safety/pitfall.md
aliases:
  - docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md
  - docs/explanation/why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md
sourceCaptureIds: [tsk-a, tsk-b]
```
````

## claim_0cc819e139ade1c937d6a5f2b815d54c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-56, lines 238–245.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-59.
Source digest: a33ee8c80cd83fa71e670ca60f33bcde7896c470a9d35fb0b17f10b3ad43e565
Target digest: a33ee8c80cd83fa71e670ca60f33bcde7896c470a9d35fb0b17f10b3ad43e565
Shown source SHA256: a33ee8c80cd83fa71e670ca60f33bcde7896c470a9d35fb0b17f10b3ad43e565
Shown target SHA256: a33ee8c80cd83fa71e670ca60f33bcde7896c470a9d35fb0b17f10b3ad43e565

### Proposed decision

```json
{
  "claimId": "claim_0cc819e139ade1c937d6a5f2b815d54c",
  "sourceUnitDigest": "a33ee8c80cd83fa71e670ca60f33bcde7896c470a9d35fb0b17f10b3ad43e565",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "a33ee8c80cd83fa71e670ca60f33bcde7896c470a9d35fb0b17f10b3ad43e565",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.3 Document Events"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-56 (lines 238–245) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-59 (lines 262–269); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
doc.reserve
doc.mark-rendered
doc.move-path
doc.promote
doc.supersede
doc.retire
```
````

### Full target shown text

````text
```txt
doc.reserve
doc.mark-rendered
doc.move-path
doc.promote
doc.supersede
doc.retire
```
````

## claim_28d3db2516a9b26d54ccf74de7113274

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-57, lines 247–247.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-60.
Source digest: f1afb964edc2695673d22888b2f12de5b4218c7bbb68207836fd301e39e0fe08
Target digest: f1afb964edc2695673d22888b2f12de5b4218c7bbb68207836fd301e39e0fe08
Shown source SHA256: f1afb964edc2695673d22888b2f12de5b4218c7bbb68207836fd301e39e0fe08
Shown target SHA256: f1afb964edc2695673d22888b2f12de5b4218c7bbb68207836fd301e39e0fe08

### Proposed decision

```json
{
  "claimId": "claim_28d3db2516a9b26d54ccf74de7113274",
  "sourceUnitDigest": "f1afb964edc2695673d22888b2f12de5b4218c7bbb68207836fd301e39e0fe08",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "f1afb964edc2695673d22888b2f12de5b4218c7bbb68207836fd301e39e0fe08",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.3 Document Events"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-57 (lines 247–247) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-60 (lines 271–271); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
A document record contains:
```

### Full target shown text

```text
A document record contains:
```
