# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-03-documentation-system-discussion.json
Original shard SHA256: 0783bc5310488af81323a1bb9181becb5106ee7bb6c35d5239093298110b7862
Source file: docs/architect/documentation-system-discussion.md
Part 1/3; entries: **80**. Source-file group 3/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (1): `claim_54f84bc0076c9de943984a4aba493b8c`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 27; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_54f84bc0076c9de943984a4aba493b8c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/documentation-system-discussion.md#documentation-system-discussion, lines 1–1.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#documentation-system-discussion.
Source digest: 8c5bb28deef5ab7bb4f042960159215d6f8be63fc6551c82c01f79f6610ad658
Target digest: 7c07c92fd18d3f9559c788a4fd0967f87a02b7a5b0690e04445519063dac726e
Shown source SHA256: 0b1472dc4e994a7c55e1fdf7d5c94b1451c2b090987f638cd418f214b18ed827
Shown target SHA256: d52cc09a8624d6dc284983f769699c8a4474cd2139b9c741665edbfb51a6470d

### Proposed decision

```json
{
  "claimId": "claim_54f84bc0076c9de943984a4aba493b8c",
  "sourceUnitDigest": "8c5bb28deef5ab7bb4f042960159215d6f8be63fc6551c82c01f79f6610ad658",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "documentation-system-discussion",
  "targetUnitDigest": "7c07c92fd18d3f9559c788a4fd0967f87a02b7a5b0690e04445519063dac726e",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#documentation-system-discussion (lines 1–1) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#documentation-system-discussion (lines 1–1); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
# Documentation System Discussion

```txt
Document type: Discussion scratchpad
Design status: Discussion
Implementation: N/A
Last reviewed: 2026-09-13
Canonical for: nothing
```

This file is a temporary working note for redesigning the fgOS documentation
system. It is intentionally disposable.

Use this file to keep active discussion, open questions, candidate rules,
placement ideas, and decisions that are not ready to become canonical. When a
point becomes clear and accepted, move it into the correct canonical document
and remove it from this scratchpad.

Do not use this file as design authority, runtime instruction, or product
documentation.
````

### Full target shown text

````text
# Documentation System Discussion

```txt
Document type: History
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve historical source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/documentation-system-discussion.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob da8440522f43fc48d9b5b7355ae6ab0f1d0db490
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/documentation-system-discussion.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Historical snapshot; Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../../../architect/documentation-system-discussion.md).


```txt
Document type: Discussion scratchpad
Design status: Discussion
Implementation: N/A
Last reviewed: 2026-09-13
Canonical for: nothing
```

This file is a temporary working note for redesigning the fgOS documentation
system. It is intentionally disposable.

Use this file to keep active discussion, open questions, candidate rules,
placement ideas, and decisions that are not ready to become canonical. When a
point becomes clear and accepted, move it into the correct canonical document
and remove it from this scratchpad.

Do not use this file as design authority, runtime instruction, or product
documentation.
````

## claim_bf941f7fb269baae34d807f927b5bdf9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-1, lines 3–9.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-4.
Source digest: ef47d3c7c236d733d3b50aa9a684ed06aaeb445c1268efbd719af0b0ceb20cac
Target digest: ef47d3c7c236d733d3b50aa9a684ed06aaeb445c1268efbd719af0b0ceb20cac
Shown source SHA256: ef47d3c7c236d733d3b50aa9a684ed06aaeb445c1268efbd719af0b0ceb20cac
Shown target SHA256: ef47d3c7c236d733d3b50aa9a684ed06aaeb445c1268efbd719af0b0ceb20cac

### Proposed decision

```json
{
  "claimId": "claim_bf941f7fb269baae34d807f927b5bdf9",
  "sourceUnitDigest": "ef47d3c7c236d733d3b50aa9a684ed06aaeb445c1268efbd719af0b0ceb20cac",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "ef47d3c7c236d733d3b50aa9a684ed06aaeb445c1268efbd719af0b0ceb20cac",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-1 (lines 3–9) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-4 (lines 27–33); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
Document type: Discussion scratchpad
Design status: Discussion
Implementation: N/A
Last reviewed: 2026-09-13
Canonical for: nothing
```
````

### Full target shown text

````text
```txt
Document type: Discussion scratchpad
Design status: Discussion
Implementation: N/A
Last reviewed: 2026-09-13
Canonical for: nothing
```
````

## claim_4f31dbcf543d2f7e01aa49573e5be4a0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-2, lines 11–12.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-5.
Source digest: 6016f01ac3bb29c47fff1c1ad743e605cc487a3fe9e128f2f18a6a270c75e9af
Target digest: 6016f01ac3bb29c47fff1c1ad743e605cc487a3fe9e128f2f18a6a270c75e9af
Shown source SHA256: 6016f01ac3bb29c47fff1c1ad743e605cc487a3fe9e128f2f18a6a270c75e9af
Shown target SHA256: 6016f01ac3bb29c47fff1c1ad743e605cc487a3fe9e128f2f18a6a270c75e9af

### Proposed decision

```json
{
  "claimId": "claim_4f31dbcf543d2f7e01aa49573e5be4a0",
  "sourceUnitDigest": "6016f01ac3bb29c47fff1c1ad743e605cc487a3fe9e128f2f18a6a270c75e9af",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "6016f01ac3bb29c47fff1c1ad743e605cc487a3fe9e128f2f18a6a270c75e9af",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-2 (lines 11–12) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-5 (lines 35–36); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This file is a temporary working note for redesigning the fgOS documentation
system. It is intentionally disposable.
```

### Full target shown text

```text
This file is a temporary working note for redesigning the fgOS documentation
system. It is intentionally disposable.
```

## claim_db2f179e18718eac3739501561e0cb24

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-3, lines 14–17.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-6.
Source digest: 514d0b1d44110b9812d885402aab1a71f772be52ffaf83e7aa260259dbf7579c
Target digest: 514d0b1d44110b9812d885402aab1a71f772be52ffaf83e7aa260259dbf7579c
Shown source SHA256: 514d0b1d44110b9812d885402aab1a71f772be52ffaf83e7aa260259dbf7579c
Shown target SHA256: 514d0b1d44110b9812d885402aab1a71f772be52ffaf83e7aa260259dbf7579c

### Proposed decision

```json
{
  "claimId": "claim_db2f179e18718eac3739501561e0cb24",
  "sourceUnitDigest": "514d0b1d44110b9812d885402aab1a71f772be52ffaf83e7aa260259dbf7579c",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "514d0b1d44110b9812d885402aab1a71f772be52ffaf83e7aa260259dbf7579c",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-3 (lines 14–17) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-6 (lines 38–41); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Use this file to keep active discussion, open questions, candidate rules,
placement ideas, and decisions that are not ready to become canonical. When a
point becomes clear and accepted, move it into the correct canonical document
and remove it from this scratchpad.
```

### Full target shown text

```text
Use this file to keep active discussion, open questions, candidate rules,
placement ideas, and decisions that are not ready to become canonical. When a
point becomes clear and accepted, move it into the correct canonical document
and remove it from this scratchpad.
```

## claim_a791218ce9ed1fced8271ed7dd6f621d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-4, lines 19–20.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-7.
Source digest: 864e10bfb8154452cf5b7159ccc047d9c6f0005b356dd794162440ea0f76fba0
Target digest: 864e10bfb8154452cf5b7159ccc047d9c6f0005b356dd794162440ea0f76fba0
Shown source SHA256: 864e10bfb8154452cf5b7159ccc047d9c6f0005b356dd794162440ea0f76fba0
Shown target SHA256: 864e10bfb8154452cf5b7159ccc047d9c6f0005b356dd794162440ea0f76fba0

### Proposed decision

```json
{
  "claimId": "claim_a791218ce9ed1fced8271ed7dd6f621d",
  "sourceUnitDigest": "864e10bfb8154452cf5b7159ccc047d9c6f0005b356dd794162440ea0f76fba0",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "864e10bfb8154452cf5b7159ccc047d9c6f0005b356dd794162440ea0f76fba0",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-4 (lines 19–20) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-7 (lines 43–44); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Do not use this file as design authority, runtime instruction, or product
documentation.
```

### Full target shown text

```text
Do not use this file as design authority, runtime instruction, or product
documentation.
```

## claim_4a3d3d33b9b6cf83c3d159ca5ec835d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#current-goal, lines 22–22.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#current-goal.
Source digest: 46793b44c95ebc5129024d08a66d2405144b90a22b38ddcbd329fb0e4eed1077
Target digest: 46793b44c95ebc5129024d08a66d2405144b90a22b38ddcbd329fb0e4eed1077
Shown source SHA256: 09b3f49e0b6ee0515c351b69ad078f501af0fafd73e4c793414e0f166329be9a
Shown target SHA256: 09b3f49e0b6ee0515c351b69ad078f501af0fafd73e4c793414e0f166329be9a

### Proposed decision

```json
{
  "claimId": "claim_4a3d3d33b9b6cf83c3d159ca5ec835d9",
  "sourceUnitDigest": "46793b44c95ebc5129024d08a66d2405144b90a22b38ddcbd329fb0e4eed1077",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "current-goal",
  "targetUnitDigest": "46793b44c95ebc5129024d08a66d2405144b90a22b38ddcbd329fb0e4eed1077",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#current-goal (lines 22–22) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#current-goal (lines 46–46); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## Current Goal

Make the system-design documentation complete but simple, clear, and easy to
understand.

The redesign should produce two durable outcomes:

- a documentation placement map that defines where each kind of document lives;
- a writing/governance mechanism that defines document types, structure,
  audience, purpose, authority, and lifecycle.
```

### Full target shown text

```text
## Current Goal

Make the system-design documentation complete but simple, clear, and easy to
understand.

The redesign should produce two durable outcomes:

- a documentation placement map that defines where each kind of document lives;
- a writing/governance mechanism that defines document types, structure,
  audience, purpose, authority, and lifecycle.
```

## claim_c0575862ba7cee6008be6dddfe33fd21

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-5, lines 24–25.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-8.
Source digest: 7711adbb4733fe32ca98b6cbb63d3eaa237cf53b3f1245378af9bc0ab3ee98ef
Target digest: 7711adbb4733fe32ca98b6cbb63d3eaa237cf53b3f1245378af9bc0ab3ee98ef
Shown source SHA256: 7711adbb4733fe32ca98b6cbb63d3eaa237cf53b3f1245378af9bc0ab3ee98ef
Shown target SHA256: 7711adbb4733fe32ca98b6cbb63d3eaa237cf53b3f1245378af9bc0ab3ee98ef

### Proposed decision

```json
{
  "claimId": "claim_c0575862ba7cee6008be6dddfe33fd21",
  "sourceUnitDigest": "7711adbb4733fe32ca98b6cbb63d3eaa237cf53b3f1245378af9bc0ab3ee98ef",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "7711adbb4733fe32ca98b6cbb63d3eaa237cf53b3f1245378af9bc0ab3ee98ef",
  "targetAncestry": [
    "Documentation System Discussion",
    "Current Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-5 (lines 24–25) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-8 (lines 48–49); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Make the system-design documentation complete but simple, clear, and easy to
understand.
```

### Full target shown text

```text
Make the system-design documentation complete but simple, clear, and easy to
understand.
```

## claim_36a50a00635452ef1642d7aa2f99a046

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-6, lines 27–27.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-9.
Source digest: 49efd28d62dbccdc526ce32e79708cdcf5cb60fe041c18128fee84043d72b9bc
Target digest: 49efd28d62dbccdc526ce32e79708cdcf5cb60fe041c18128fee84043d72b9bc
Shown source SHA256: 49efd28d62dbccdc526ce32e79708cdcf5cb60fe041c18128fee84043d72b9bc
Shown target SHA256: 49efd28d62dbccdc526ce32e79708cdcf5cb60fe041c18128fee84043d72b9bc

### Proposed decision

```json
{
  "claimId": "claim_36a50a00635452ef1642d7aa2f99a046",
  "sourceUnitDigest": "49efd28d62dbccdc526ce32e79708cdcf5cb60fe041c18128fee84043d72b9bc",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "49efd28d62dbccdc526ce32e79708cdcf5cb60fe041c18128fee84043d72b9bc",
  "targetAncestry": [
    "Documentation System Discussion",
    "Current Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-6 (lines 27–27) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-9 (lines 51–51); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The redesign should produce two durable outcomes:
```

### Full target shown text

```text
The redesign should produce two durable outcomes:
```

## claim_5fa157decb917636e08e030af173b969

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-7, lines 29–31.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-10.
Source digest: 91ef3cb7b8c5274e8f95fd048db83fea8fa474eab557ba24a3c862349855dd05
Target digest: 91ef3cb7b8c5274e8f95fd048db83fea8fa474eab557ba24a3c862349855dd05
Shown source SHA256: 91ef3cb7b8c5274e8f95fd048db83fea8fa474eab557ba24a3c862349855dd05
Shown target SHA256: 91ef3cb7b8c5274e8f95fd048db83fea8fa474eab557ba24a3c862349855dd05

### Proposed decision

```json
{
  "claimId": "claim_5fa157decb917636e08e030af173b969",
  "sourceUnitDigest": "91ef3cb7b8c5274e8f95fd048db83fea8fa474eab557ba24a3c862349855dd05",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "91ef3cb7b8c5274e8f95fd048db83fea8fa474eab557ba24a3c862349855dd05",
  "targetAncestry": [
    "Documentation System Discussion",
    "Current Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-7 (lines 29–31) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-10 (lines 53–55); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- a documentation placement map that defines where each kind of document lives;
- a writing/governance mechanism that defines document types, structure,
  audience, purpose, authority, and lifecycle.
```

### Full target shown text

```text
- a documentation placement map that defines where each kind of document lives;
- a writing/governance mechanism that defines document types, structure,
  audience, purpose, authority, and lifecycle.
```

## claim_35dbe0ffde49cbfdc0e8bdbdf5c68b5a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#working-observations, lines 33–33.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#working-observations.
Source digest: 5d5f5807fa07c662664ff2f1d88d5654cea05154bfd8883be081939136e3acd6
Target digest: 5d5f5807fa07c662664ff2f1d88d5654cea05154bfd8883be081939136e3acd6
Shown source SHA256: 928a53abd9917a13d3af7ccfae581c1f991e4dd2be586d1defdba111284b616f
Shown target SHA256: 928a53abd9917a13d3af7ccfae581c1f991e4dd2be586d1defdba111284b616f

### Proposed decision

```json
{
  "claimId": "claim_35dbe0ffde49cbfdc0e8bdbdf5c68b5a",
  "sourceUnitDigest": "5d5f5807fa07c662664ff2f1d88d5654cea05154bfd8883be081939136e3acd6",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "working-observations",
  "targetUnitDigest": "5d5f5807fa07c662664ff2f1d88d5654cea05154bfd8883be081939136e3acd6",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#working-observations (lines 33–33) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#working-observations (lines 57–57); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## Working Observations

- The current repo has many generated or work-produced documents spread across
  several locations.
- `docs/specs/reading-map.md` is useful for agent orientation, but it has grown
  into a long inventory that mixes navigation, implementation map, history, and
  source pointers.
- `docs/architect/` is the active area for rewriting the system design docs.
- `docs/architect/agent-coordination/` already has the strongest shape:
  `vision`, `vocabulary`, `architecture`, `contracts`, `decisions`,
  `proposals`, `roadmap`, `verification`, `playbooks`, and `history`.
- `docs/architect/agent-coordination/documentation-governance.md` is a good
  candidate model for a broader documentation governance rule.
- The larger problem is not only document placement. Each artifact also needs a
  clear audience and purpose.
- Provenance is not uniformly declared today. Some generated artifacts declare
  their generator clearly (`docs/doc-registry.md`, `docs/decisions/index.md`,
  `docs/ui-spec/generated/*`), but many hand-written discussion/design/history
  files can only be classified by path conventions and local context.
- Known generated/projection sources found during scan:
  - `fgos doc-registry` writes `docs/doc-registry.md` and
    `docs/doc-registry.json`.
  - `fgos decision-index` writes `docs/decisions/index.md`.
  - `fgos docs-index` writes `docs/enduser-docs-index.json`.
  - `ui-spec-tools/build.mjs` writes `docs/ui-spec/generated/*`.
  - setup/projection scripts generate skill/agent wrapper surfaces such as
    `.agents/skills/**` and plugin skill mirrors.
- `docs/specs/**` investigation result:
  - No current source/code path was found that deterministically regenerates
    all `docs/specs/*.md` from another source, unlike `doc-registry`,
    `decision-index`, `docs-index`, or `ui-spec/generated`.
  - The files are hand/agent-curated area specs and reading maps, updated by
    scribing/sync/realignment work and committed in git.
  - Some architecture docs call them "generated specs" or "generated/curated
    state"; current evidence suggests this means "spec projection/state layer
    maintained through an owning workflow", not "machine-generated output that
    must never be hand-edited".
  - `docs/specs/reading-map.md` is explicitly hand map-like: it has no
    frontmatter and historical scribing guidance says the reading map is
    hand-written / "a map, not documentation".
  - `docs/specs/*` should therefore be classified as `curated spec-state` or
    `hand/agent-curated living spec`, not as `generated artifact`.
- Open provenance gap: hand-authored-by-discussion, generated-by-agent,
  generated-by-tool, migrated, promoted, and historical evidence are not
  consistently machine-declared across all docs.
```

### Full target shown text

```text
## Working Observations

- The current repo has many generated or work-produced documents spread across
  several locations.
- `docs/specs/reading-map.md` is useful for agent orientation, but it has grown
  into a long inventory that mixes navigation, implementation map, history, and
  source pointers.
- `docs/architect/` is the active area for rewriting the system design docs.
- `docs/architect/agent-coordination/` already has the strongest shape:
  `vision`, `vocabulary`, `architecture`, `contracts`, `decisions`,
  `proposals`, `roadmap`, `verification`, `playbooks`, and `history`.
- `docs/architect/agent-coordination/documentation-governance.md` is a good
  candidate model for a broader documentation governance rule.
- The larger problem is not only document placement. Each artifact also needs a
  clear audience and purpose.
- Provenance is not uniformly declared today. Some generated artifacts declare
  their generator clearly (`docs/doc-registry.md`, `docs/decisions/index.md`,
  `docs/ui-spec/generated/*`), but many hand-written discussion/design/history
  files can only be classified by path conventions and local context.
- Known generated/projection sources found during scan:
  - `fgos doc-registry` writes `docs/doc-registry.md` and
    `docs/doc-registry.json`.
  - `fgos decision-index` writes `docs/decisions/index.md`.
  - `fgos docs-index` writes `docs/enduser-docs-index.json`.
  - `ui-spec-tools/build.mjs` writes `docs/ui-spec/generated/*`.
  - setup/projection scripts generate skill/agent wrapper surfaces such as
    `.agents/skills/**` and plugin skill mirrors.
- `docs/specs/**` investigation result:
  - No current source/code path was found that deterministically regenerates
    all `docs/specs/*.md` from another source, unlike `doc-registry`,
    `decision-index`, `docs-index`, or `ui-spec/generated`.
  - The files are hand/agent-curated area specs and reading maps, updated by
    scribing/sync/realignment work and committed in git.
  - Some architecture docs call them "generated specs" or "generated/curated
    state"; current evidence suggests this means "spec projection/state layer
    maintained through an owning workflow", not "machine-generated output that
    must never be hand-edited".
  - `docs/specs/reading-map.md` is explicitly hand map-like: it has no
    frontmatter and historical scribing guidance says the reading map is
    hand-written / "a map, not documentation".
  - `docs/specs/*` should therefore be classified as `curated spec-state` or
    `hand/agent-curated living spec`, not as `generated artifact`.
- Open provenance gap: hand-authored-by-discussion, generated-by-agent,
  generated-by-tool, migrated, promoted, and historical evidence are not
  consistently machine-declared across all docs.
```

## claim_c2143f71a71008c7dea76a275ad8c549

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-8, lines 35–77.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-11.
Source digest: 5f34d456d2851f6fd294d587743b57e7067d66c96b07a96ecdd584aa08bb02bd
Target digest: 5f34d456d2851f6fd294d587743b57e7067d66c96b07a96ecdd584aa08bb02bd
Shown source SHA256: 5f34d456d2851f6fd294d587743b57e7067d66c96b07a96ecdd584aa08bb02bd
Shown target SHA256: 5f34d456d2851f6fd294d587743b57e7067d66c96b07a96ecdd584aa08bb02bd

### Proposed decision

```json
{
  "claimId": "claim_c2143f71a71008c7dea76a275ad8c549",
  "sourceUnitDigest": "5f34d456d2851f6fd294d587743b57e7067d66c96b07a96ecdd584aa08bb02bd",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "5f34d456d2851f6fd294d587743b57e7067d66c96b07a96ecdd584aa08bb02bd",
  "targetAncestry": [
    "Documentation System Discussion",
    "Working Observations"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-8 (lines 35–77) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-11 (lines 59–101); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- The current repo has many generated or work-produced documents spread across
  several locations.
- `docs/specs/reading-map.md` is useful for agent orientation, but it has grown
  into a long inventory that mixes navigation, implementation map, history, and
  source pointers.
- `docs/architect/` is the active area for rewriting the system design docs.
- `docs/architect/agent-coordination/` already has the strongest shape:
  `vision`, `vocabulary`, `architecture`, `contracts`, `decisions`,
  `proposals`, `roadmap`, `verification`, `playbooks`, and `history`.
- `docs/architect/agent-coordination/documentation-governance.md` is a good
  candidate model for a broader documentation governance rule.
- The larger problem is not only document placement. Each artifact also needs a
  clear audience and purpose.
- Provenance is not uniformly declared today. Some generated artifacts declare
  their generator clearly (`docs/doc-registry.md`, `docs/decisions/index.md`,
  `docs/ui-spec/generated/*`), but many hand-written discussion/design/history
  files can only be classified by path conventions and local context.
- Known generated/projection sources found during scan:
  - `fgos doc-registry` writes `docs/doc-registry.md` and
    `docs/doc-registry.json`.
  - `fgos decision-index` writes `docs/decisions/index.md`.
  - `fgos docs-index` writes `docs/enduser-docs-index.json`.
  - `ui-spec-tools/build.mjs` writes `docs/ui-spec/generated/*`.
  - setup/projection scripts generate skill/agent wrapper surfaces such as
    `.agents/skills/**` and plugin skill mirrors.
- `docs/specs/**` investigation result:
  - No current source/code path was found that deterministically regenerates
    all `docs/specs/*.md` from another source, unlike `doc-registry`,
    `decision-index`, `docs-index`, or `ui-spec/generated`.
  - The files are hand/agent-curated area specs and reading maps, updated by
    scribing/sync/realignment work and committed in git.
  - Some architecture docs call them "generated specs" or "generated/curated
    state"; current evidence suggests this means "spec projection/state layer
    maintained through an owning workflow", not "machine-generated output that
    must never be hand-edited".
  - `docs/specs/reading-map.md` is explicitly hand map-like: it has no
    frontmatter and historical scribing guidance says the reading map is
    hand-written / "a map, not documentation".
  - `docs/specs/*` should therefore be classified as `curated spec-state` or
    `hand/agent-curated living spec`, not as `generated artifact`.
- Open provenance gap: hand-authored-by-discussion, generated-by-agent,
  generated-by-tool, migrated, promoted, and historical evidence are not
  consistently machine-declared across all docs.
```

### Full target shown text

```text
- The current repo has many generated or work-produced documents spread across
  several locations.
- `docs/specs/reading-map.md` is useful for agent orientation, but it has grown
  into a long inventory that mixes navigation, implementation map, history, and
  source pointers.
- `docs/architect/` is the active area for rewriting the system design docs.
- `docs/architect/agent-coordination/` already has the strongest shape:
  `vision`, `vocabulary`, `architecture`, `contracts`, `decisions`,
  `proposals`, `roadmap`, `verification`, `playbooks`, and `history`.
- `docs/architect/agent-coordination/documentation-governance.md` is a good
  candidate model for a broader documentation governance rule.
- The larger problem is not only document placement. Each artifact also needs a
  clear audience and purpose.
- Provenance is not uniformly declared today. Some generated artifacts declare
  their generator clearly (`docs/doc-registry.md`, `docs/decisions/index.md`,
  `docs/ui-spec/generated/*`), but many hand-written discussion/design/history
  files can only be classified by path conventions and local context.
- Known generated/projection sources found during scan:
  - `fgos doc-registry` writes `docs/doc-registry.md` and
    `docs/doc-registry.json`.
  - `fgos decision-index` writes `docs/decisions/index.md`.
  - `fgos docs-index` writes `docs/enduser-docs-index.json`.
  - `ui-spec-tools/build.mjs` writes `docs/ui-spec/generated/*`.
  - setup/projection scripts generate skill/agent wrapper surfaces such as
    `.agents/skills/**` and plugin skill mirrors.
- `docs/specs/**` investigation result:
  - No current source/code path was found that deterministically regenerates
    all `docs/specs/*.md` from another source, unlike `doc-registry`,
    `decision-index`, `docs-index`, or `ui-spec/generated`.
  - The files are hand/agent-curated area specs and reading maps, updated by
    scribing/sync/realignment work and committed in git.
  - Some architecture docs call them "generated specs" or "generated/curated
    state"; current evidence suggests this means "spec projection/state layer
    maintained through an owning workflow", not "machine-generated output that
    must never be hand-edited".
  - `docs/specs/reading-map.md` is explicitly hand map-like: it has no
    frontmatter and historical scribing guidance says the reading map is
    hand-written / "a map, not documentation".
  - `docs/specs/*` should therefore be classified as `curated spec-state` or
    `hand/agent-curated living spec`, not as `generated artifact`.
- Open provenance gap: hand-authored-by-discussion, generated-by-agent,
  generated-by-tool, migrated, promoted, and historical evidence are not
  consistently machine-declared across all docs.
```

## claim_939827419adce135e235ab8d82afe266

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#candidate-principle, lines 79–79.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-principle.
Source digest: 7786805394da19567932525818295f8aaa309ecad286974cd861cb64943dedaa
Target digest: 7786805394da19567932525818295f8aaa309ecad286974cd861cb64943dedaa
Shown source SHA256: 58228da693db8cca9b022d02c1ee7e210265801573c95fb3c02575a6f569c025
Shown target SHA256: 58228da693db8cca9b022d02c1ee7e210265801573c95fb3c02575a6f569c025

### Proposed decision

```json
{
  "claimId": "claim_939827419adce135e235ab8d82afe266",
  "sourceUnitDigest": "7786805394da19567932525818295f8aaa309ecad286974cd861cb64943dedaa",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "candidate-principle",
  "targetUnitDigest": "7786805394da19567932525818295f8aaa309ecad286974cd861cb64943dedaa",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#candidate-principle (lines 79–79) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-principle (lines 103–103); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## Candidate Principle

Every maintained documentation artifact should state:

- who uses it;
- what decision, action, or understanding it supports;
- whether it is authority or only supporting material;
- when to use it;
- when not to use it.
- what wrote it or is allowed to write it.

Human presence principle:

- The folder structure, document structure, and writing style must help a human
  reader understand the system and participate in decisions with agents.
- Documentation quality is not only measured by whether an agent can route,
  execute, or verify work. It is also measured by whether a person can enter the
  material, read the current shape, review trade-offs, and approve or challenge
  an agent's recommendation.
- If the design optimizes for agent consumption while making human review
  spatially confusing, too fragmented, or too procedural to read, system quality
  degrades.
- Therefore every canonical system area should expose:
  - a human-readable portal;
  - a concise current-state summary;
  - visible open questions and decision points;
  - clear separation between accepted truth, proposal, evidence, and history;
  - enough rationale for a person to challenge the direction without needing
    chat history.

Working discussion rule:

- When a question is uncertain, high-impact, or would benefit from independent
  critique, consult an independent GPT-5.6-style reviewer before presenting a
  firm recommendation. Record the uncertainty and the resulting rationale here
  when it affects the documentation-system design.

Candidate required header fields:

```txt
Document type: <type>
Audience: <audience>
Purpose: <purpose>
Design status: Discussion | Proposed | Accepted | Superseded | N/A
Implementation: Not started | Partial | Implemented | Verified | Drifted | Active | N/A
Last reviewed: YYYY-MM-DD
Canonical for: <subject or "nothing">
Use this when: <short rule>
Do not use this for: <short rule>
```
````

### Full target shown text

````text
## Candidate Principle

Every maintained documentation artifact should state:

- who uses it;
- what decision, action, or understanding it supports;
- whether it is authority or only supporting material;
- when to use it;
- when not to use it.
- what wrote it or is allowed to write it.

Human presence principle:

- The folder structure, document structure, and writing style must help a human
  reader understand the system and participate in decisions with agents.
- Documentation quality is not only measured by whether an agent can route,
  execute, or verify work. It is also measured by whether a person can enter the
  material, read the current shape, review trade-offs, and approve or challenge
  an agent's recommendation.
- If the design optimizes for agent consumption while making human review
  spatially confusing, too fragmented, or too procedural to read, system quality
  degrades.
- Therefore every canonical system area should expose:
  - a human-readable portal;
  - a concise current-state summary;
  - visible open questions and decision points;
  - clear separation between accepted truth, proposal, evidence, and history;
  - enough rationale for a person to challenge the direction without needing
    chat history.

Working discussion rule:

- When a question is uncertain, high-impact, or would benefit from independent
  critique, consult an independent GPT-5.6-style reviewer before presenting a
  firm recommendation. Record the uncertainty and the resulting rationale here
  when it affects the documentation-system design.

Candidate required header fields:

```txt
Document type: <type>
Audience: <audience>
Purpose: <purpose>
Design status: Discussion | Proposed | Accepted | Superseded | N/A
Implementation: Not started | Partial | Implemented | Verified | Drifted | Active | N/A
Last reviewed: YYYY-MM-DD
Canonical for: <subject or "nothing">
Use this when: <short rule>
Do not use this for: <short rule>
```
````

## claim_b31dd44160ad35781346bf85d84680fc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-9, lines 81–81.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-12.
Source digest: f4efe6e2caf7082354932bffce04d8b35afe541eea53e7ca891c886fbc8913b6
Target digest: f4efe6e2caf7082354932bffce04d8b35afe541eea53e7ca891c886fbc8913b6
Shown source SHA256: f4efe6e2caf7082354932bffce04d8b35afe541eea53e7ca891c886fbc8913b6
Shown target SHA256: f4efe6e2caf7082354932bffce04d8b35afe541eea53e7ca891c886fbc8913b6

### Proposed decision

```json
{
  "claimId": "claim_b31dd44160ad35781346bf85d84680fc",
  "sourceUnitDigest": "f4efe6e2caf7082354932bffce04d8b35afe541eea53e7ca891c886fbc8913b6",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "f4efe6e2caf7082354932bffce04d8b35afe541eea53e7ca891c886fbc8913b6",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Principle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-9 (lines 81–81) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-12 (lines 105–105); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Every maintained documentation artifact should state:
```

### Full target shown text

```text
Every maintained documentation artifact should state:
```

## claim_48d7692fa3b7c156b7c7a5da2363b29f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-10, lines 83–88.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-13.
Source digest: 8426e8088b905cce3808c796f8a240472ded75957b990aecb255fc26af2cb167
Target digest: 8426e8088b905cce3808c796f8a240472ded75957b990aecb255fc26af2cb167
Shown source SHA256: 8426e8088b905cce3808c796f8a240472ded75957b990aecb255fc26af2cb167
Shown target SHA256: 8426e8088b905cce3808c796f8a240472ded75957b990aecb255fc26af2cb167

### Proposed decision

```json
{
  "claimId": "claim_48d7692fa3b7c156b7c7a5da2363b29f",
  "sourceUnitDigest": "8426e8088b905cce3808c796f8a240472ded75957b990aecb255fc26af2cb167",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "8426e8088b905cce3808c796f8a240472ded75957b990aecb255fc26af2cb167",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Principle"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-10 (lines 83–88) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-13 (lines 107–112); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- who uses it;
- what decision, action, or understanding it supports;
- whether it is authority or only supporting material;
- when to use it;
- when not to use it.
- what wrote it or is allowed to write it.
```

### Full target shown text

```text
- who uses it;
- what decision, action, or understanding it supports;
- whether it is authority or only supporting material;
- when to use it;
- when not to use it.
- what wrote it or is allowed to write it.
```

## claim_672e9ca191c2096814d4a1ae1e2d5222

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-11, lines 90–90.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-14.
Source digest: af675c02e7006b72ae9dac4988a8228ae4a8116ebe6c6b62c7832a2ca829c802
Target digest: af675c02e7006b72ae9dac4988a8228ae4a8116ebe6c6b62c7832a2ca829c802
Shown source SHA256: af675c02e7006b72ae9dac4988a8228ae4a8116ebe6c6b62c7832a2ca829c802
Shown target SHA256: af675c02e7006b72ae9dac4988a8228ae4a8116ebe6c6b62c7832a2ca829c802

### Proposed decision

```json
{
  "claimId": "claim_672e9ca191c2096814d4a1ae1e2d5222",
  "sourceUnitDigest": "af675c02e7006b72ae9dac4988a8228ae4a8116ebe6c6b62c7832a2ca829c802",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "af675c02e7006b72ae9dac4988a8228ae4a8116ebe6c6b62c7832a2ca829c802",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Principle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-11 (lines 90–90) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-14 (lines 114–114); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Human presence principle:
```

### Full target shown text

```text
Human presence principle:
```

## claim_2fb7c8c8408ed65ce2116e27e6ddafb7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-12, lines 92–107.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-15.
Source digest: 7d998db7faa5f4a3e3f25f44d9524bee046d2248e1a88dde6716b6cddeba5ac6
Target digest: 7d998db7faa5f4a3e3f25f44d9524bee046d2248e1a88dde6716b6cddeba5ac6
Shown source SHA256: 7d998db7faa5f4a3e3f25f44d9524bee046d2248e1a88dde6716b6cddeba5ac6
Shown target SHA256: 7d998db7faa5f4a3e3f25f44d9524bee046d2248e1a88dde6716b6cddeba5ac6

### Proposed decision

```json
{
  "claimId": "claim_2fb7c8c8408ed65ce2116e27e6ddafb7",
  "sourceUnitDigest": "7d998db7faa5f4a3e3f25f44d9524bee046d2248e1a88dde6716b6cddeba5ac6",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "7d998db7faa5f4a3e3f25f44d9524bee046d2248e1a88dde6716b6cddeba5ac6",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Principle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-12 (lines 92–107) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-15 (lines 116–131); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- The folder structure, document structure, and writing style must help a human
  reader understand the system and participate in decisions with agents.
- Documentation quality is not only measured by whether an agent can route,
  execute, or verify work. It is also measured by whether a person can enter the
  material, read the current shape, review trade-offs, and approve or challenge
  an agent's recommendation.
- If the design optimizes for agent consumption while making human review
  spatially confusing, too fragmented, or too procedural to read, system quality
  degrades.
- Therefore every canonical system area should expose:
  - a human-readable portal;
  - a concise current-state summary;
  - visible open questions and decision points;
  - clear separation between accepted truth, proposal, evidence, and history;
  - enough rationale for a person to challenge the direction without needing
    chat history.
```

### Full target shown text

```text
- The folder structure, document structure, and writing style must help a human
  reader understand the system and participate in decisions with agents.
- Documentation quality is not only measured by whether an agent can route,
  execute, or verify work. It is also measured by whether a person can enter the
  material, read the current shape, review trade-offs, and approve or challenge
  an agent's recommendation.
- If the design optimizes for agent consumption while making human review
  spatially confusing, too fragmented, or too procedural to read, system quality
  degrades.
- Therefore every canonical system area should expose:
  - a human-readable portal;
  - a concise current-state summary;
  - visible open questions and decision points;
  - clear separation between accepted truth, proposal, evidence, and history;
  - enough rationale for a person to challenge the direction without needing
    chat history.
```

## claim_d221228da01a7af5903dc3e9b8de712a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-13, lines 109–109.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-16.
Source digest: f94086add0f92ac1649199613bfae64d87bda030f1dc695a0ef1ae06cb3c2c31
Target digest: f94086add0f92ac1649199613bfae64d87bda030f1dc695a0ef1ae06cb3c2c31
Shown source SHA256: f94086add0f92ac1649199613bfae64d87bda030f1dc695a0ef1ae06cb3c2c31
Shown target SHA256: f94086add0f92ac1649199613bfae64d87bda030f1dc695a0ef1ae06cb3c2c31

### Proposed decision

```json
{
  "claimId": "claim_d221228da01a7af5903dc3e9b8de712a",
  "sourceUnitDigest": "f94086add0f92ac1649199613bfae64d87bda030f1dc695a0ef1ae06cb3c2c31",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "f94086add0f92ac1649199613bfae64d87bda030f1dc695a0ef1ae06cb3c2c31",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Principle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-13 (lines 109–109) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-16 (lines 133–133); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Working discussion rule:
```

### Full target shown text

```text
Working discussion rule:
```

## claim_e55a52f0be31e0e06df3ae438b7ad5d5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-14, lines 111–114.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-17.
Source digest: aabca6f689d34c8c4390d4053732ef39d365b64ec38ab6dea5f85599e9b6b336
Target digest: aabca6f689d34c8c4390d4053732ef39d365b64ec38ab6dea5f85599e9b6b336
Shown source SHA256: aabca6f689d34c8c4390d4053732ef39d365b64ec38ab6dea5f85599e9b6b336
Shown target SHA256: aabca6f689d34c8c4390d4053732ef39d365b64ec38ab6dea5f85599e9b6b336

### Proposed decision

```json
{
  "claimId": "claim_e55a52f0be31e0e06df3ae438b7ad5d5",
  "sourceUnitDigest": "aabca6f689d34c8c4390d4053732ef39d365b64ec38ab6dea5f85599e9b6b336",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "aabca6f689d34c8c4390d4053732ef39d365b64ec38ab6dea5f85599e9b6b336",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Principle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-14 (lines 111–114) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-17 (lines 135–138); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- When a question is uncertain, high-impact, or would benefit from independent
  critique, consult an independent GPT-5.6-style reviewer before presenting a
  firm recommendation. Record the uncertainty and the resulting rationale here
  when it affects the documentation-system design.
```

### Full target shown text

```text
- When a question is uncertain, high-impact, or would benefit from independent
  critique, consult an independent GPT-5.6-style reviewer before presenting a
  firm recommendation. Record the uncertainty and the resulting rationale here
  when it affects the documentation-system design.
```

## claim_b3b4c00aea97bb060944c8c12ae8773c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-15, lines 116–116.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-18.
Source digest: 3c77f72f068b8f247acc5c4ca8f57d44e5cf5f678274c958dddfd6a0e8978ab0
Target digest: 3c77f72f068b8f247acc5c4ca8f57d44e5cf5f678274c958dddfd6a0e8978ab0
Shown source SHA256: 3c77f72f068b8f247acc5c4ca8f57d44e5cf5f678274c958dddfd6a0e8978ab0
Shown target SHA256: 3c77f72f068b8f247acc5c4ca8f57d44e5cf5f678274c958dddfd6a0e8978ab0

### Proposed decision

```json
{
  "claimId": "claim_b3b4c00aea97bb060944c8c12ae8773c",
  "sourceUnitDigest": "3c77f72f068b8f247acc5c4ca8f57d44e5cf5f678274c958dddfd6a0e8978ab0",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "3c77f72f068b8f247acc5c4ca8f57d44e5cf5f678274c958dddfd6a0e8978ab0",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Principle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-15 (lines 116–116) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-18 (lines 140–140); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Candidate required header fields:
```

### Full target shown text

```text
Candidate required header fields:
```

## claim_8d20037a763816febd4d8049950164ac

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-16, lines 118–128.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-19.
Source digest: 5b4f8e539a79a8d768c5862cc16b9d7c6393364bdfb3746a817a548777231ac7
Target digest: 5b4f8e539a79a8d768c5862cc16b9d7c6393364bdfb3746a817a548777231ac7
Shown source SHA256: 5b4f8e539a79a8d768c5862cc16b9d7c6393364bdfb3746a817a548777231ac7
Shown target SHA256: 5b4f8e539a79a8d768c5862cc16b9d7c6393364bdfb3746a817a548777231ac7

### Proposed decision

```json
{
  "claimId": "claim_8d20037a763816febd4d8049950164ac",
  "sourceUnitDigest": "5b4f8e539a79a8d768c5862cc16b9d7c6393364bdfb3746a817a548777231ac7",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "5b4f8e539a79a8d768c5862cc16b9d7c6393364bdfb3746a817a548777231ac7",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Principle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-16 (lines 118–128) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-19 (lines 142–152); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
Document type: <type>
Audience: <audience>
Purpose: <purpose>
Design status: Discussion | Proposed | Accepted | Superseded | N/A
Implementation: Not started | Partial | Implemented | Verified | Drifted | Active | N/A
Last reviewed: YYYY-MM-DD
Canonical for: <subject or "nothing">
Use this when: <short rule>
Do not use this for: <short rule>
```
````

### Full target shown text

````text
```txt
Document type: <type>
Audience: <audience>
Purpose: <purpose>
Design status: Discussion | Proposed | Accepted | Superseded | N/A
Implementation: Not started | Partial | Implemented | Verified | Drifted | Active | N/A
Last reviewed: YYYY-MM-DD
Canonical for: <subject or "nothing">
Use this when: <short rule>
Do not use this for: <short rule>
```
````

## claim_17611ed7f153e08ecc0b47390de5f7d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#candidate-document-types, lines 130–130.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-document-types.
Source digest: 8ef8b5e3d15ef9293dac3953b51f5b597317bef24211b0a28d84771e4486f920
Target digest: 8ef8b5e3d15ef9293dac3953b51f5b597317bef24211b0a28d84771e4486f920
Shown source SHA256: f5dbfa8a2efe98a0755cff78c8ef64450194e84ea868c97fbb1237afaeac6b3c
Shown target SHA256: f5dbfa8a2efe98a0755cff78c8ef64450194e84ea868c97fbb1237afaeac6b3c

### Proposed decision

```json
{
  "claimId": "claim_17611ed7f153e08ecc0b47390de5f7d9",
  "sourceUnitDigest": "8ef8b5e3d15ef9293dac3953b51f5b597317bef24211b0a28d84771e4486f920",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "candidate-document-types",
  "targetUnitDigest": "8ef8b5e3d15ef9293dac3953b51f5b597317bef24211b0a28d84771e4486f920",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#candidate-document-types (lines 130–130) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-document-types (lines 154–154); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## Candidate Document Types

These are not final.

| Type | Main audience | Purpose | Authority |
|---|---|---|---|
| Vision | human architect, product owner, agent | preserve product identity and boundaries | Yes |
| Architecture | architect, implementer, reviewer, agent | explain responsibilities, boundaries, flows, and invariants | Yes |
| Contract | implementer, tests, runtime adapter, agent | define exact schema, behavior, state, or interface rules | Yes |
| Doctrine | agent, reviewer, maintainer | guide judgment where exact contracts are too narrow | Yes, but below contract |
| Agent instruction | agent runtime/session | tell an agent how to execute a specific workflow or capability | Execution authority only |
| Playbook | human or agent operator | run a manual procedure, bootstrap, or fallback | Operational only |
| Proposal | architect, decision maker | discuss an option before acceptance | No |
| ADR | architect, reviewer, future maintainer | record one accepted or rejected decision | Yes for accepted decisions |
| Roadmap | maintainer, implementer | sequence implementation work | No new design authority |
| Verification | reviewer, agent, maintainer | preserve proof, tests, traces, and evidence | Evidence, not design authority |
| History | future maintainer | preserve old rationale and source material | No |
| End-user docs | fgOS user | teach, guide, explain, or provide reference | User-facing, not system-design authority |
| Knowledge | agent, maintainer | preserve retrospective learning | Memory/evidence, not direct authority |
```

### Full target shown text

```text
## Candidate Document Types

These are not final.

| Type | Main audience | Purpose | Authority |
|---|---|---|---|
| Vision | human architect, product owner, agent | preserve product identity and boundaries | Yes |
| Architecture | architect, implementer, reviewer, agent | explain responsibilities, boundaries, flows, and invariants | Yes |
| Contract | implementer, tests, runtime adapter, agent | define exact schema, behavior, state, or interface rules | Yes |
| Doctrine | agent, reviewer, maintainer | guide judgment where exact contracts are too narrow | Yes, but below contract |
| Agent instruction | agent runtime/session | tell an agent how to execute a specific workflow or capability | Execution authority only |
| Playbook | human or agent operator | run a manual procedure, bootstrap, or fallback | Operational only |
| Proposal | architect, decision maker | discuss an option before acceptance | No |
| ADR | architect, reviewer, future maintainer | record one accepted or rejected decision | Yes for accepted decisions |
| Roadmap | maintainer, implementer | sequence implementation work | No new design authority |
| Verification | reviewer, agent, maintainer | preserve proof, tests, traces, and evidence | Evidence, not design authority |
| History | future maintainer | preserve old rationale and source material | No |
| End-user docs | fgOS user | teach, guide, explain, or provide reference | User-facing, not system-design authority |
| Knowledge | agent, maintainer | preserve retrospective learning | Memory/evidence, not direct authority |
```

## claim_ee3ed0f913b465f5f8d49ed162f6c167

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-17, lines 132–148.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-20.
Source digest: 8640f8ab4191c2dab3844a1f63d252cf071577dbcc888ad238f4077b572b995a
Target digest: 8640f8ab4191c2dab3844a1f63d252cf071577dbcc888ad238f4077b572b995a
Shown source SHA256: 8640f8ab4191c2dab3844a1f63d252cf071577dbcc888ad238f4077b572b995a
Shown target SHA256: 8640f8ab4191c2dab3844a1f63d252cf071577dbcc888ad238f4077b572b995a

### Proposed decision

```json
{
  "claimId": "claim_ee3ed0f913b465f5f8d49ed162f6c167",
  "sourceUnitDigest": "8640f8ab4191c2dab3844a1f63d252cf071577dbcc888ad238f4077b572b995a",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "8640f8ab4191c2dab3844a1f63d252cf071577dbcc888ad238f4077b572b995a",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Document Types"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-17 (lines 132–148) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-20 (lines 156–172); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
These are not final.

| Type | Main audience | Purpose | Authority |
|---|---|---|---|
| Vision | human architect, product owner, agent | preserve product identity and boundaries | Yes |
| Architecture | architect, implementer, reviewer, agent | explain responsibilities, boundaries, flows, and invariants | Yes |
| Contract | implementer, tests, runtime adapter, agent | define exact schema, behavior, state, or interface rules | Yes |
| Doctrine | agent, reviewer, maintainer | guide judgment where exact contracts are too narrow | Yes, but below contract |
| Agent instruction | agent runtime/session | tell an agent how to execute a specific workflow or capability | Execution authority only |
| Playbook | human or agent operator | run a manual procedure, bootstrap, or fallback | Operational only |
| Proposal | architect, decision maker | discuss an option before acceptance | No |
| ADR | architect, reviewer, future maintainer | record one accepted or rejected decision | Yes for accepted decisions |
| Roadmap | maintainer, implementer | sequence implementation work | No new design authority |
| Verification | reviewer, agent, maintainer | preserve proof, tests, traces, and evidence | Evidence, not design authority |
| History | future maintainer | preserve old rationale and source material | No |
| End-user docs | fgOS user | teach, guide, explain, or provide reference | User-facing, not system-design authority |
| Knowledge | agent, maintainer | preserve retrospective learning | Memory/evidence, not direct authority |
```

### Full target shown text

```text
These are not final.

| Type | Main audience | Purpose | Authority |
|---|---|---|---|
| Vision | human architect, product owner, agent | preserve product identity and boundaries | Yes |
| Architecture | architect, implementer, reviewer, agent | explain responsibilities, boundaries, flows, and invariants | Yes |
| Contract | implementer, tests, runtime adapter, agent | define exact schema, behavior, state, or interface rules | Yes |
| Doctrine | agent, reviewer, maintainer | guide judgment where exact contracts are too narrow | Yes, but below contract |
| Agent instruction | agent runtime/session | tell an agent how to execute a specific workflow or capability | Execution authority only |
| Playbook | human or agent operator | run a manual procedure, bootstrap, or fallback | Operational only |
| Proposal | architect, decision maker | discuss an option before acceptance | No |
| ADR | architect, reviewer, future maintainer | record one accepted or rejected decision | Yes for accepted decisions |
| Roadmap | maintainer, implementer | sequence implementation work | No new design authority |
| Verification | reviewer, agent, maintainer | preserve proof, tests, traces, and evidence | Evidence, not design authority |
| History | future maintainer | preserve old rationale and source material | No |
| End-user docs | fgOS user | teach, guide, explain, or provide reference | User-facing, not system-design authority |
| Knowledge | agent, maintainer | preserve retrospective learning | Memory/evidence, not direct authority |
```

## claim_8d455c891d2ee5c92a277b093fe5eb61

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#candidate-writer-types, lines 150–150.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-writer-types.
Source digest: 4c4c3ce4d523824d534d5b71db54a8f2318edffce7b68f4828c19429bfb92401
Target digest: 4c4c3ce4d523824d534d5b71db54a8f2318edffce7b68f4828c19429bfb92401
Shown source SHA256: 47b23a940b037c7b236cb80ce7b35621dda6af92ab134944d889729ba75e5c74
Shown target SHA256: 47b23a940b037c7b236cb80ce7b35621dda6af92ab134944d889729ba75e5c74

### Proposed decision

```json
{
  "claimId": "claim_8d455c891d2ee5c92a277b093fe5eb61",
  "sourceUnitDigest": "4c4c3ce4d523824d534d5b71db54a8f2318edffce7b68f4828c19429bfb92401",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "candidate-writer-types",
  "targetUnitDigest": "4c4c3ce4d523824d534d5b71db54a8f2318edffce7b68f4828c19429bfb92401",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#candidate-writer-types (lines 150–150) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-writer-types (lines 174–174); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## Candidate Writer Types

These are not final. Writer type is a separate axis from document type.

| Writer type | Meaning | Typical artifacts | Hand-edit policy |
|---|---|---|---|
| Human author | A person intentionally writes or edits the document. | vision notes, decisions, discussion outcomes | editable by people |
| Human + agent coauthor | A person and an agent shape the document through discussion. | design discussion, architecture drafts, governance drafts | editable, but preserve settled rationale |
| Agent draft writer | An agent creates a draft for review, not automatically canonical. | proposals, reports, draft docs | editable/promotable after review |
| Runtime generator | A command deterministically writes a projection from source state. | `docs/doc-registry.md`, `docs/decisions/index.md`, `docs/enduser-docs-index.json` | do not hand-edit; change source or generator |
| Build generator | A build/spec tool writes derived artifacts from source files. | `docs/ui-spec/generated/*` | do not hand-edit; edit source surfaces/config |
| Migration script | A script moves or rewrites existing docs as part of a controlled migration. | `docs/knowledge/**` migration outputs, registry path moves | edit only through migration protocol while active |
| Execution worker | A doer/reviewer/red-team/panel run writes evidence or reports. | `plans/**`, `verification/**`, report files | evidence; do not silently rewrite after use |
| Mirror/projection writer | Setup/projection materializes runtime instruction copies from authoring sources. | `.agents/skills/**`, plugin skill mirrors | edit source, not generated mirror |
| Registry/event writer | fgOS event/state layer records facts that later projections read. | `.fgos` state/log, projected indexes | not a markdown author; source-of-truth writer |

Open issue:

- Should writer type be a required metadata field on every document, or should
  it be inferred from path unless a file overrides the default?
```

### Full target shown text

```text
## Candidate Writer Types

These are not final. Writer type is a separate axis from document type.

| Writer type | Meaning | Typical artifacts | Hand-edit policy |
|---|---|---|---|
| Human author | A person intentionally writes or edits the document. | vision notes, decisions, discussion outcomes | editable by people |
| Human + agent coauthor | A person and an agent shape the document through discussion. | design discussion, architecture drafts, governance drafts | editable, but preserve settled rationale |
| Agent draft writer | An agent creates a draft for review, not automatically canonical. | proposals, reports, draft docs | editable/promotable after review |
| Runtime generator | A command deterministically writes a projection from source state. | `docs/doc-registry.md`, `docs/decisions/index.md`, `docs/enduser-docs-index.json` | do not hand-edit; change source or generator |
| Build generator | A build/spec tool writes derived artifacts from source files. | `docs/ui-spec/generated/*` | do not hand-edit; edit source surfaces/config |
| Migration script | A script moves or rewrites existing docs as part of a controlled migration. | `docs/knowledge/**` migration outputs, registry path moves | edit only through migration protocol while active |
| Execution worker | A doer/reviewer/red-team/panel run writes evidence or reports. | `plans/**`, `verification/**`, report files | evidence; do not silently rewrite after use |
| Mirror/projection writer | Setup/projection materializes runtime instruction copies from authoring sources. | `.agents/skills/**`, plugin skill mirrors | edit source, not generated mirror |
| Registry/event writer | fgOS event/state layer records facts that later projections read. | `.fgos` state/log, projected indexes | not a markdown author; source-of-truth writer |

Open issue:

- Should writer type be a required metadata field on every document, or should
  it be inferred from path unless a file overrides the default?
```

## claim_1c911982a453a3211a644da0c0248e4c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-18, lines 152–152.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-21.
Source digest: 69251783f129fc5124815c64e74574c9533caee39bd2cb2c39e530fd428735ab
Target digest: 69251783f129fc5124815c64e74574c9533caee39bd2cb2c39e530fd428735ab
Shown source SHA256: 69251783f129fc5124815c64e74574c9533caee39bd2cb2c39e530fd428735ab
Shown target SHA256: 69251783f129fc5124815c64e74574c9533caee39bd2cb2c39e530fd428735ab

### Proposed decision

```json
{
  "claimId": "claim_1c911982a453a3211a644da0c0248e4c",
  "sourceUnitDigest": "69251783f129fc5124815c64e74574c9533caee39bd2cb2c39e530fd428735ab",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "69251783f129fc5124815c64e74574c9533caee39bd2cb2c39e530fd428735ab",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Writer Types"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-18 (lines 152–152) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-21 (lines 176–176); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
These are not final. Writer type is a separate axis from document type.
```

### Full target shown text

```text
These are not final. Writer type is a separate axis from document type.
```

## claim_a7b5f62d8d239504a037f8747ead12f9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-19, lines 154–164.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-22.
Source digest: 3f9310faa412e26df677c03f7ff50c44ec7cae719487d9b2fba1704eb12832d4
Target digest: 3f9310faa412e26df677c03f7ff50c44ec7cae719487d9b2fba1704eb12832d4
Shown source SHA256: 3f9310faa412e26df677c03f7ff50c44ec7cae719487d9b2fba1704eb12832d4
Shown target SHA256: 3f9310faa412e26df677c03f7ff50c44ec7cae719487d9b2fba1704eb12832d4

### Proposed decision

```json
{
  "claimId": "claim_a7b5f62d8d239504a037f8747ead12f9",
  "sourceUnitDigest": "3f9310faa412e26df677c03f7ff50c44ec7cae719487d9b2fba1704eb12832d4",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "3f9310faa412e26df677c03f7ff50c44ec7cae719487d9b2fba1704eb12832d4",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Writer Types"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-19 (lines 154–164) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-22 (lines 178–188); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
| Writer type | Meaning | Typical artifacts | Hand-edit policy |
|---|---|---|---|
| Human author | A person intentionally writes or edits the document. | vision notes, decisions, discussion outcomes | editable by people |
| Human + agent coauthor | A person and an agent shape the document through discussion. | design discussion, architecture drafts, governance drafts | editable, but preserve settled rationale |
| Agent draft writer | An agent creates a draft for review, not automatically canonical. | proposals, reports, draft docs | editable/promotable after review |
| Runtime generator | A command deterministically writes a projection from source state. | `docs/doc-registry.md`, `docs/decisions/index.md`, `docs/enduser-docs-index.json` | do not hand-edit; change source or generator |
| Build generator | A build/spec tool writes derived artifacts from source files. | `docs/ui-spec/generated/*` | do not hand-edit; edit source surfaces/config |
| Migration script | A script moves or rewrites existing docs as part of a controlled migration. | `docs/knowledge/**` migration outputs, registry path moves | edit only through migration protocol while active |
| Execution worker | A doer/reviewer/red-team/panel run writes evidence or reports. | `plans/**`, `verification/**`, report files | evidence; do not silently rewrite after use |
| Mirror/projection writer | Setup/projection materializes runtime instruction copies from authoring sources. | `.agents/skills/**`, plugin skill mirrors | edit source, not generated mirror |
| Registry/event writer | fgOS event/state layer records facts that later projections read. | `.fgos` state/log, projected indexes | not a markdown author; source-of-truth writer |
```

### Full target shown text

```text
| Writer type | Meaning | Typical artifacts | Hand-edit policy |
|---|---|---|---|
| Human author | A person intentionally writes or edits the document. | vision notes, decisions, discussion outcomes | editable by people |
| Human + agent coauthor | A person and an agent shape the document through discussion. | design discussion, architecture drafts, governance drafts | editable, but preserve settled rationale |
| Agent draft writer | An agent creates a draft for review, not automatically canonical. | proposals, reports, draft docs | editable/promotable after review |
| Runtime generator | A command deterministically writes a projection from source state. | `docs/doc-registry.md`, `docs/decisions/index.md`, `docs/enduser-docs-index.json` | do not hand-edit; change source or generator |
| Build generator | A build/spec tool writes derived artifacts from source files. | `docs/ui-spec/generated/*` | do not hand-edit; edit source surfaces/config |
| Migration script | A script moves or rewrites existing docs as part of a controlled migration. | `docs/knowledge/**` migration outputs, registry path moves | edit only through migration protocol while active |
| Execution worker | A doer/reviewer/red-team/panel run writes evidence or reports. | `plans/**`, `verification/**`, report files | evidence; do not silently rewrite after use |
| Mirror/projection writer | Setup/projection materializes runtime instruction copies from authoring sources. | `.agents/skills/**`, plugin skill mirrors | edit source, not generated mirror |
| Registry/event writer | fgOS event/state layer records facts that later projections read. | `.fgos` state/log, projected indexes | not a markdown author; source-of-truth writer |
```

## claim_064dcff6772baaf27b3f74e67ded8c6c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-20, lines 166–169.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-23.
Source digest: 162be62b92ec9efb70f0fe94c1df3711f9ca204b606aa5f26d6c2e128f3018a7
Target digest: 162be62b92ec9efb70f0fe94c1df3711f9ca204b606aa5f26d6c2e128f3018a7
Shown source SHA256: 162be62b92ec9efb70f0fe94c1df3711f9ca204b606aa5f26d6c2e128f3018a7
Shown target SHA256: 162be62b92ec9efb70f0fe94c1df3711f9ca204b606aa5f26d6c2e128f3018a7

### Proposed decision

```json
{
  "claimId": "claim_064dcff6772baaf27b3f74e67ded8c6c",
  "sourceUnitDigest": "162be62b92ec9efb70f0fe94c1df3711f9ca204b606aa5f26d6c2e128f3018a7",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "162be62b92ec9efb70f0fe94c1df3711f9ca204b606aa5f26d6c2e128f3018a7",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Writer Types"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-20 (lines 166–169) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-23 (lines 190–193); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Open issue:

- Should writer type be a required metadata field on every document, or should
  it be inferred from path unless a file overrides the default?
```

### Full target shown text

```text
Open issue:

- Should writer type be a required metadata field on every document, or should
  it be inferred from path unless a file overrides the default?
```

## claim_75954a7d522d08c378384854a1b9e279

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#candidate-distinctions, lines 171–171.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-distinctions.
Source digest: 60d37d671c58f679b551c2b8ee509f2aae6ee71d3a2e35ce07417b211f6b0a97
Target digest: 60d37d671c58f679b551c2b8ee509f2aae6ee71d3a2e35ce07417b211f6b0a97
Shown source SHA256: 1d674120d7b0c34c0807afbef7b615c993d5ecc06463d09a9b636a6b4324dbba
Shown target SHA256: 1d674120d7b0c34c0807afbef7b615c993d5ecc06463d09a9b636a6b4324dbba

### Proposed decision

```json
{
  "claimId": "claim_75954a7d522d08c378384854a1b9e279",
  "sourceUnitDigest": "60d37d671c58f679b551c2b8ee509f2aae6ee71d3a2e35ce07417b211f6b0a97",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "candidate-distinctions",
  "targetUnitDigest": "60d37d671c58f679b551c2b8ee509f2aae6ee71d3a2e35ce07417b211f6b0a97",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#candidate-distinctions (lines 171–171) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-distinctions (lines 195–195); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## Candidate Distinctions
```

### Full target shown text

```text
## Candidate Distinctions
```

## claim_29dbe62a4f8962f821bd95d61b23b0cf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#prose, lines 173–173.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#prose.
Source digest: c4696a7de10b08746e4c51fb88a8ebaf456cf5d6555cd4cac09738c78f1661e8
Target digest: c4696a7de10b08746e4c51fb88a8ebaf456cf5d6555cd4cac09738c78f1661e8
Shown source SHA256: 677b6f607c908b94e3826bb86eab89349df5810cc917b6897b3190ca0c961111
Shown target SHA256: 677b6f607c908b94e3826bb86eab89349df5810cc917b6897b3190ca0c961111

### Proposed decision

```json
{
  "claimId": "claim_29dbe62a4f8962f821bd95d61b23b0cf",
  "sourceUnitDigest": "c4696a7de10b08746e4c51fb88a8ebaf456cf5d6555cd4cac09738c78f1661e8",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "prose",
  "targetUnitDigest": "c4696a7de10b08746e4c51fb88a8ebaf456cf5d6555cd4cac09738c78f1661e8",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#prose (lines 173–173) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#prose (lines 197–197); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### Prose

`Prose` is a writing format, not a sufficient document type.

Prose can carry a vision, doctrine, proposal, architecture explanation,
playbook, or agent instruction. Therefore, if `prose` remains in the vocabulary,
it should describe expression style rather than authority.
```

### Full target shown text

```text
### Prose

`Prose` is a writing format, not a sufficient document type.

Prose can carry a vision, doctrine, proposal, architecture explanation,
playbook, or agent instruction. Therefore, if `prose` remains in the vocabulary,
it should describe expression style rather than authority.
```

## claim_a73eeb1509ad90069fed27d52c40c86c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-21, lines 175–175.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-24.
Source digest: 5152b5a035b6a47ec731361c669d5e3ae4dc86a4f367c6bdb0820c59ec6aee1d
Target digest: 5152b5a035b6a47ec731361c669d5e3ae4dc86a4f367c6bdb0820c59ec6aee1d
Shown source SHA256: 5152b5a035b6a47ec731361c669d5e3ae4dc86a4f367c6bdb0820c59ec6aee1d
Shown target SHA256: 5152b5a035b6a47ec731361c669d5e3ae4dc86a4f367c6bdb0820c59ec6aee1d

### Proposed decision

```json
{
  "claimId": "claim_a73eeb1509ad90069fed27d52c40c86c",
  "sourceUnitDigest": "5152b5a035b6a47ec731361c669d5e3ae4dc86a4f367c6bdb0820c59ec6aee1d",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "5152b5a035b6a47ec731361c669d5e3ae4dc86a4f367c6bdb0820c59ec6aee1d",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions",
    "Prose"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-21 (lines 175–175) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-24 (lines 199–199); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`Prose` is a writing format, not a sufficient document type.
```

### Full target shown text

```text
`Prose` is a writing format, not a sufficient document type.
```

## claim_9a7c01092ce67329746edd131beb335a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-22, lines 177–179.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-25.
Source digest: b06a27f140f4ba79439724956deade71af81f82c47998c543bd919c99b7e0514
Target digest: b06a27f140f4ba79439724956deade71af81f82c47998c543bd919c99b7e0514
Shown source SHA256: b06a27f140f4ba79439724956deade71af81f82c47998c543bd919c99b7e0514
Shown target SHA256: b06a27f140f4ba79439724956deade71af81f82c47998c543bd919c99b7e0514

### Proposed decision

```json
{
  "claimId": "claim_9a7c01092ce67329746edd131beb335a",
  "sourceUnitDigest": "b06a27f140f4ba79439724956deade71af81f82c47998c543bd919c99b7e0514",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "b06a27f140f4ba79439724956deade71af81f82c47998c543bd919c99b7e0514",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions",
    "Prose"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-22 (lines 177–179) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-25 (lines 201–203); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Prose can carry a vision, doctrine, proposal, architecture explanation,
playbook, or agent instruction. Therefore, if `prose` remains in the vocabulary,
it should describe expression style rather than authority.
```

### Full target shown text

```text
Prose can carry a vision, doctrine, proposal, architecture explanation,
playbook, or agent instruction. Therefore, if `prose` remains in the vocabulary,
it should describe expression style rather than authority.
```

## claim_d31c00dea15d580d6f61246dc0aac200

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#doctrine, lines 181–181.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#doctrine.
Source digest: c9566d7618a45c0ea10bbed63828f56f9dfddb338fda4ff6bda602bd616c2c9b
Target digest: c9566d7618a45c0ea10bbed63828f56f9dfddb338fda4ff6bda602bd616c2c9b
Shown source SHA256: fb688f4d7fee07c8125dca5d8a7c1f6e68485ef5b091663a91c302e029c5ade9
Shown target SHA256: fb688f4d7fee07c8125dca5d8a7c1f6e68485ef5b091663a91c302e029c5ade9

### Proposed decision

```json
{
  "claimId": "claim_d31c00dea15d580d6f61246dc0aac200",
  "sourceUnitDigest": "c9566d7618a45c0ea10bbed63828f56f9dfddb338fda4ff6bda602bd616c2c9b",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "doctrine",
  "targetUnitDigest": "c9566d7618a45c0ea10bbed63828f56f9dfddb338fda4ff6bda602bd616c2c9b",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#doctrine (lines 181–181) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#doctrine (lines 205–205); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### Doctrine

Doctrine is durable judgment guidance. It should be used when the system needs
agents or humans to make consistent calls in situations that cannot be fully
encoded as contracts.

Doctrine must not silently override a contract.
```

### Full target shown text

```text
### Doctrine

Doctrine is durable judgment guidance. It should be used when the system needs
agents or humans to make consistent calls in situations that cannot be fully
encoded as contracts.

Doctrine must not silently override a contract.
```

## claim_ffcaca99f03a45f13cd4392ce2b9e77e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-23, lines 183–185.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-26.
Source digest: f3a14d712dbba892745a4db5d84c91b9b848e8291165609a4cd46695398694e0
Target digest: f3a14d712dbba892745a4db5d84c91b9b848e8291165609a4cd46695398694e0
Shown source SHA256: f3a14d712dbba892745a4db5d84c91b9b848e8291165609a4cd46695398694e0
Shown target SHA256: f3a14d712dbba892745a4db5d84c91b9b848e8291165609a4cd46695398694e0

### Proposed decision

```json
{
  "claimId": "claim_ffcaca99f03a45f13cd4392ce2b9e77e",
  "sourceUnitDigest": "f3a14d712dbba892745a4db5d84c91b9b848e8291165609a4cd46695398694e0",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "f3a14d712dbba892745a4db5d84c91b9b848e8291165609a4cd46695398694e0",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions",
    "Doctrine"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-23 (lines 183–185) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-26 (lines 207–209); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Doctrine is durable judgment guidance. It should be used when the system needs
agents or humans to make consistent calls in situations that cannot be fully
encoded as contracts.
```

### Full target shown text

```text
Doctrine is durable judgment guidance. It should be used when the system needs
agents or humans to make consistent calls in situations that cannot be fully
encoded as contracts.
```

## claim_42b115cbf244af63f862384b14dcec5e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-24, lines 187–187.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-27.
Source digest: b816fd5e0717d75332a67296f98f138901ca42fd2336d719472ee0ca48e76ef0
Target digest: b816fd5e0717d75332a67296f98f138901ca42fd2336d719472ee0ca48e76ef0
Shown source SHA256: b816fd5e0717d75332a67296f98f138901ca42fd2336d719472ee0ca48e76ef0
Shown target SHA256: b816fd5e0717d75332a67296f98f138901ca42fd2336d719472ee0ca48e76ef0

### Proposed decision

```json
{
  "claimId": "claim_42b115cbf244af63f862384b14dcec5e",
  "sourceUnitDigest": "b816fd5e0717d75332a67296f98f138901ca42fd2336d719472ee0ca48e76ef0",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "b816fd5e0717d75332a67296f98f138901ca42fd2336d719472ee0ca48e76ef0",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions",
    "Doctrine"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-24 (lines 187–187) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-27 (lines 211–211); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Doctrine must not silently override a contract.
```

### Full target shown text

```text
Doctrine must not silently override a contract.
```

## claim_3479bc20c7dd77b92fda7b5e35e5f66d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#agent-instruction, lines 189–189.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#agent-instruction.
Source digest: 92612477fc1019cd65e6ec1d09f5f4ed5cbfa7aac0f02d022d4a280abe19acd6
Target digest: 92612477fc1019cd65e6ec1d09f5f4ed5cbfa7aac0f02d022d4a280abe19acd6
Shown source SHA256: b4b3046307274eeb6e57a7d728163a2504a631fbb953bf2d0b98bef4cf581793
Shown target SHA256: b4b3046307274eeb6e57a7d728163a2504a631fbb953bf2d0b98bef4cf581793

### Proposed decision

```json
{
  "claimId": "claim_3479bc20c7dd77b92fda7b5e35e5f66d",
  "sourceUnitDigest": "92612477fc1019cd65e6ec1d09f5f4ed5cbfa7aac0f02d022d4a280abe19acd6",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "agent-instruction",
  "targetUnitDigest": "92612477fc1019cd65e6ec1d09f5f4ed5cbfa7aac0f02d022d4a280abe19acd6",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#agent-instruction (lines 189–189) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#agent-instruction (lines 213–213); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### Agent Instruction

Agent instruction is execution guidance for an agent in a specific context,
workflow, skill, or capability.

Agent instruction may be more operational and change more frequently than
doctrine. It should not become product architecture by accident.
```

### Full target shown text

```text
### Agent Instruction

Agent instruction is execution guidance for an agent in a specific context,
workflow, skill, or capability.

Agent instruction may be more operational and change more frequently than
doctrine. It should not become product architecture by accident.
```

## claim_ad16c83c7def91b06fcb28e4d52755a1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-25, lines 191–192.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-28.
Source digest: e7bb2bc5c6c2a02c4844d67743a3a607f627d8b03e9b89752b02b1e6b8e8c04a
Target digest: e7bb2bc5c6c2a02c4844d67743a3a607f627d8b03e9b89752b02b1e6b8e8c04a
Shown source SHA256: e7bb2bc5c6c2a02c4844d67743a3a607f627d8b03e9b89752b02b1e6b8e8c04a
Shown target SHA256: e7bb2bc5c6c2a02c4844d67743a3a607f627d8b03e9b89752b02b1e6b8e8c04a

### Proposed decision

```json
{
  "claimId": "claim_ad16c83c7def91b06fcb28e4d52755a1",
  "sourceUnitDigest": "e7bb2bc5c6c2a02c4844d67743a3a607f627d8b03e9b89752b02b1e6b8e8c04a",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "e7bb2bc5c6c2a02c4844d67743a3a607f627d8b03e9b89752b02b1e6b8e8c04a",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions",
    "Agent Instruction"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-25 (lines 191–192) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-28 (lines 215–216); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Agent instruction is execution guidance for an agent in a specific context,
workflow, skill, or capability.
```

### Full target shown text

```text
Agent instruction is execution guidance for an agent in a specific context,
workflow, skill, or capability.
```

## claim_1125dea60354f9838041d6d33c43f8b1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-26, lines 194–195.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-29.
Source digest: 9c355f5b539285999912498c1ac3a2a193315b82b9650b579261b501ede15ac2
Target digest: 9c355f5b539285999912498c1ac3a2a193315b82b9650b579261b501ede15ac2
Shown source SHA256: 9c355f5b539285999912498c1ac3a2a193315b82b9650b579261b501ede15ac2
Shown target SHA256: 9c355f5b539285999912498c1ac3a2a193315b82b9650b579261b501ede15ac2

### Proposed decision

```json
{
  "claimId": "claim_1125dea60354f9838041d6d33c43f8b1",
  "sourceUnitDigest": "9c355f5b539285999912498c1ac3a2a193315b82b9650b579261b501ede15ac2",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "9c355f5b539285999912498c1ac3a2a193315b82b9650b579261b501ede15ac2",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions",
    "Agent Instruction"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-26 (lines 194–195) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-29 (lines 218–219); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Agent instruction may be more operational and change more frequently than
doctrine. It should not become product architecture by accident.
```

### Full target shown text

```text
Agent instruction may be more operational and change more frequently than
doctrine. It should not become product architecture by accident.
```

## claim_734fe8824d4ad6854935c9a521a47d8d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#contract, lines 197–197.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#contract.
Source digest: 204a65339891d111f4e05795c3f3897c57b5efc5321cc395c7d04a607e265e94
Target digest: 204a65339891d111f4e05795c3f3897c57b5efc5321cc395c7d04a607e265e94
Shown source SHA256: 58787f4cc4888360bd97aeb3ff0c86199d62fc9aab72ab5ddbbb813d4caaf9b0
Shown target SHA256: 58787f4cc4888360bd97aeb3ff0c86199d62fc9aab72ab5ddbbb813d4caaf9b0

### Proposed decision

```json
{
  "claimId": "claim_734fe8824d4ad6854935c9a521a47d8d",
  "sourceUnitDigest": "204a65339891d111f4e05795c3f3897c57b5efc5321cc395c7d04a607e265e94",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "contract",
  "targetUnitDigest": "204a65339891d111f4e05795c3f3897c57b5efc5321cc395c7d04a607e265e94",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#contract (lines 197–197) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#contract (lines 221–221); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### Contract

Contract is exact behavior that consumers must obey and tests can verify.

When a contract and prose disagree, the contract should win unless an accepted
decision explicitly changes it.
```

### Full target shown text

```text
### Contract

Contract is exact behavior that consumers must obey and tests can verify.

When a contract and prose disagree, the contract should win unless an accepted
decision explicitly changes it.
```

## claim_b21759775b520f2c7d2a3f4ff10198f6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-27, lines 199–199.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-30.
Source digest: 9a540a3b3774f338e2dc929b537964e755a84eaa24b1099ea30826c2dd19e427
Target digest: 9a540a3b3774f338e2dc929b537964e755a84eaa24b1099ea30826c2dd19e427
Shown source SHA256: 9a540a3b3774f338e2dc929b537964e755a84eaa24b1099ea30826c2dd19e427
Shown target SHA256: 9a540a3b3774f338e2dc929b537964e755a84eaa24b1099ea30826c2dd19e427

### Proposed decision

```json
{
  "claimId": "claim_b21759775b520f2c7d2a3f4ff10198f6",
  "sourceUnitDigest": "9a540a3b3774f338e2dc929b537964e755a84eaa24b1099ea30826c2dd19e427",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "9a540a3b3774f338e2dc929b537964e755a84eaa24b1099ea30826c2dd19e427",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions",
    "Contract"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-27 (lines 199–199) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-30 (lines 223–223); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Contract is exact behavior that consumers must obey and tests can verify.
```

### Full target shown text

```text
Contract is exact behavior that consumers must obey and tests can verify.
```

## claim_3077abae4ed7f2c91e3bc5562ec75c46

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-28, lines 201–202.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-31.
Source digest: 19cda5c3424f06f82256e3bc6c8deebf677c8adb7f945e6b5ed9578c6f3737a2
Target digest: 19cda5c3424f06f82256e3bc6c8deebf677c8adb7f945e6b5ed9578c6f3737a2
Shown source SHA256: 19cda5c3424f06f82256e3bc6c8deebf677c8adb7f945e6b5ed9578c6f3737a2
Shown target SHA256: 19cda5c3424f06f82256e3bc6c8deebf677c8adb7f945e6b5ed9578c6f3737a2

### Proposed decision

```json
{
  "claimId": "claim_3077abae4ed7f2c91e3bc5562ec75c46",
  "sourceUnitDigest": "19cda5c3424f06f82256e3bc6c8deebf677c8adb7f945e6b5ed9578c6f3737a2",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "19cda5c3424f06f82256e3bc6c8deebf677c8adb7f945e6b5ed9578c6f3737a2",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions",
    "Contract"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-28 (lines 201–202) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-31 (lines 225–226); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
When a contract and prose disagree, the contract should win unless an accepted
decision explicitly changes it.
```

### Full target shown text

```text
When a contract and prose disagree, the contract should win unless an accepted
decision explicitly changes it.
```

## claim_344fccad6dd5a326db272e3821316dc3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#architecture, lines 204–204.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#architecture.
Source digest: 66f27a5bfd13866f637aced9dde106519ccacd0e02cedfb80197dcc99df06ab3
Target digest: 66f27a5bfd13866f637aced9dde106519ccacd0e02cedfb80197dcc99df06ab3
Shown source SHA256: 23f664b1d040f74d89b6b5c7757bf242d71b0e4609c35d2e766db2db80db2b30
Shown target SHA256: 23f664b1d040f74d89b6b5c7757bf242d71b0e4609c35d2e766db2db80db2b30

### Proposed decision

```json
{
  "claimId": "claim_344fccad6dd5a326db272e3821316dc3",
  "sourceUnitDigest": "66f27a5bfd13866f637aced9dde106519ccacd0e02cedfb80197dcc99df06ab3",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "architecture",
  "targetUnitDigest": "66f27a5bfd13866f637aced9dde106519ccacd0e02cedfb80197dcc99df06ab3",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#architecture (lines 204–204) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#architecture (lines 228–228); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### Architecture

Architecture explains durable boundaries, responsibilities, component
relationships, and invariants. It should explain why contracts belong where
they do, but should not duplicate every schema field.
```

### Full target shown text

```text
### Architecture

Architecture explains durable boundaries, responsibilities, component
relationships, and invariants. It should explain why contracts belong where
they do, but should not duplicate every schema field.
```

## claim_5cd0a6e73eec783070cd666f1389910f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-29, lines 206–208.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-32.
Source digest: d3c0d2740a287b7de5428b73ffb3fa61a235b75f0e900481373d86305bc1a230
Target digest: d3c0d2740a287b7de5428b73ffb3fa61a235b75f0e900481373d86305bc1a230
Shown source SHA256: d3c0d2740a287b7de5428b73ffb3fa61a235b75f0e900481373d86305bc1a230
Shown target SHA256: d3c0d2740a287b7de5428b73ffb3fa61a235b75f0e900481373d86305bc1a230

### Proposed decision

```json
{
  "claimId": "claim_5cd0a6e73eec783070cd666f1389910f",
  "sourceUnitDigest": "d3c0d2740a287b7de5428b73ffb3fa61a235b75f0e900481373d86305bc1a230",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "d3c0d2740a287b7de5428b73ffb3fa61a235b75f0e900481373d86305bc1a230",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Distinctions",
    "Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-29 (lines 206–208) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-32 (lines 230–232); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Architecture explains durable boundaries, responsibilities, component
relationships, and invariants. It should explain why contracts belong where
they do, but should not duplicate every schema field.
```

### Full target shown text

```text
Architecture explains durable boundaries, responsibilities, component
relationships, and invariants. It should explain why contracts belong where
they do, but should not duplicate every schema field.
```

## claim_2d542c374cb4b128dc70425db7530509

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#candidate-placement-map, lines 210–210.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-placement-map.
Source digest: b702dfd7ed161b2294a7fcfe0c60980223aed4f2402ec9787064c03803fdbde3
Target digest: b702dfd7ed161b2294a7fcfe0c60980223aed4f2402ec9787064c03803fdbde3
Shown source SHA256: e707c9f3995788b4f5cbc99e639ec5e3b522605047601ea8e74589fbeab4f8e1
Shown target SHA256: e707c9f3995788b4f5cbc99e639ec5e3b522605047601ea8e74589fbeab4f8e1

### Proposed decision

```json
{
  "claimId": "claim_2d542c374cb4b128dc70425db7530509",
  "sourceUnitDigest": "b702dfd7ed161b2294a7fcfe0c60980223aed4f2402ec9787064c03803fdbde3",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "candidate-placement-map",
  "targetUnitDigest": "b702dfd7ed161b2294a7fcfe0c60980223aed4f2402ec9787064c03803fdbde3",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#candidate-placement-map (lines 210–210) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#candidate-placement-map (lines 234–234); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## Candidate Placement Map

This is a draft, not a final rule.

| Location | Candidate role |
|---|---|
| `docs/architect/**` | system design for humans and agents who need to understand or change fgOS architecture |
| `docs/architect/<area>/README.md` | portal and reading path for one design area |
| `docs/architect/<area>/vision.md` | highest-level identity and boundary for one design area |
| `docs/architect/<area>/vocabulary/` | canonical terms for one design area |
| `docs/architect/<area>/architecture/` | accepted boundaries, responsibilities, flows, and invariants |
| `docs/architect/<area>/contracts/` | accepted exact behavior, schema, state, evidence, and interface rules |
| `docs/architect/<area>/decisions/` | ADRs for accepted or rejected durable decisions |
| `docs/architect/<area>/proposals/` | non-canonical drafts and alternatives |
| `docs/architect/<area>/roadmap/` | implementation sequence and rollout plan |
| `docs/architect/<area>/verification/` | proof, test evidence, live traces, review, red-team reports |
| `docs/architect/<area>/playbooks/` | manual/bootstrap/fallback operating procedures |
| `docs/architect/<area>/history/` | non-canonical archived source material |
| `docs/specs/**` | BA/state/behavior specs; relationship to `docs/architect/**` still needs to be settled |
| `domains/**/AGENTS.md` | domain doctrine loaded by agents |
| `domains/**/skills/**/SKILL.md` | domain agent instruction for executable workflows |
| `.agents/skills/**/SKILL.md` | installed agent instruction surface |
| `docs/how-to/**` | end-user task guidance |
| `docs/reference/**` | end-user lookup/reference |
| `docs/tutorials/**` | end-user learning path |
| `docs/explanation/**` | end-user conceptual explanation |
| `docs/knowledge/**` | retrospective learning and accumulated lessons |
| `docs/history/**` | non-canonical archive and discussion history |
| `plans/**` | implementation track plans and execution evidence |
```

### Full target shown text

```text
## Candidate Placement Map

This is a draft, not a final rule.

| Location | Candidate role |
|---|---|
| `docs/architect/**` | system design for humans and agents who need to understand or change fgOS architecture |
| `docs/architect/<area>/README.md` | portal and reading path for one design area |
| `docs/architect/<area>/vision.md` | highest-level identity and boundary for one design area |
| `docs/architect/<area>/vocabulary/` | canonical terms for one design area |
| `docs/architect/<area>/architecture/` | accepted boundaries, responsibilities, flows, and invariants |
| `docs/architect/<area>/contracts/` | accepted exact behavior, schema, state, evidence, and interface rules |
| `docs/architect/<area>/decisions/` | ADRs for accepted or rejected durable decisions |
| `docs/architect/<area>/proposals/` | non-canonical drafts and alternatives |
| `docs/architect/<area>/roadmap/` | implementation sequence and rollout plan |
| `docs/architect/<area>/verification/` | proof, test evidence, live traces, review, red-team reports |
| `docs/architect/<area>/playbooks/` | manual/bootstrap/fallback operating procedures |
| `docs/architect/<area>/history/` | non-canonical archived source material |
| `docs/specs/**` | BA/state/behavior specs; relationship to `docs/architect/**` still needs to be settled |
| `domains/**/AGENTS.md` | domain doctrine loaded by agents |
| `domains/**/skills/**/SKILL.md` | domain agent instruction for executable workflows |
| `.agents/skills/**/SKILL.md` | installed agent instruction surface |
| `docs/how-to/**` | end-user task guidance |
| `docs/reference/**` | end-user lookup/reference |
| `docs/tutorials/**` | end-user learning path |
| `docs/explanation/**` | end-user conceptual explanation |
| `docs/knowledge/**` | retrospective learning and accumulated lessons |
| `docs/history/**` | non-canonical archive and discussion history |
| `plans/**` | implementation track plans and execution evidence |
```

## claim_80d8568da5fe079b40b5c6364f935227

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-30, lines 212–212.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-33.
Source digest: 07549d77f411e7318e0c32dc5fd1fa7bb794487be65de5525362f7a5c50cafac
Target digest: 07549d77f411e7318e0c32dc5fd1fa7bb794487be65de5525362f7a5c50cafac
Shown source SHA256: 07549d77f411e7318e0c32dc5fd1fa7bb794487be65de5525362f7a5c50cafac
Shown target SHA256: 07549d77f411e7318e0c32dc5fd1fa7bb794487be65de5525362f7a5c50cafac

### Proposed decision

```json
{
  "claimId": "claim_80d8568da5fe079b40b5c6364f935227",
  "sourceUnitDigest": "07549d77f411e7318e0c32dc5fd1fa7bb794487be65de5525362f7a5c50cafac",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "07549d77f411e7318e0c32dc5fd1fa7bb794487be65de5525362f7a5c50cafac",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Placement Map"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-30 (lines 212–212) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-33 (lines 236–236); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This is a draft, not a final rule.
```

### Full target shown text

```text
This is a draft, not a final rule.
```

## claim_6da09bb35f2bef2638e1fc37ca349543

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-31, lines 214–238.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-34.
Source digest: 7aad131d75e951d69b647b9bfbf1513a480999dedcdb60452ac277530b073f6a
Target digest: 7aad131d75e951d69b647b9bfbf1513a480999dedcdb60452ac277530b073f6a
Shown source SHA256: 7aad131d75e951d69b647b9bfbf1513a480999dedcdb60452ac277530b073f6a
Shown target SHA256: 7aad131d75e951d69b647b9bfbf1513a480999dedcdb60452ac277530b073f6a

### Proposed decision

```json
{
  "claimId": "claim_6da09bb35f2bef2638e1fc37ca349543",
  "sourceUnitDigest": "7aad131d75e951d69b647b9bfbf1513a480999dedcdb60452ac277530b073f6a",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "7aad131d75e951d69b647b9bfbf1513a480999dedcdb60452ac277530b073f6a",
  "targetAncestry": [
    "Documentation System Discussion",
    "Candidate Placement Map"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-31 (lines 214–238) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-34 (lines 238–262); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
| Location | Candidate role |
|---|---|
| `docs/architect/**` | system design for humans and agents who need to understand or change fgOS architecture |
| `docs/architect/<area>/README.md` | portal and reading path for one design area |
| `docs/architect/<area>/vision.md` | highest-level identity and boundary for one design area |
| `docs/architect/<area>/vocabulary/` | canonical terms for one design area |
| `docs/architect/<area>/architecture/` | accepted boundaries, responsibilities, flows, and invariants |
| `docs/architect/<area>/contracts/` | accepted exact behavior, schema, state, evidence, and interface rules |
| `docs/architect/<area>/decisions/` | ADRs for accepted or rejected durable decisions |
| `docs/architect/<area>/proposals/` | non-canonical drafts and alternatives |
| `docs/architect/<area>/roadmap/` | implementation sequence and rollout plan |
| `docs/architect/<area>/verification/` | proof, test evidence, live traces, review, red-team reports |
| `docs/architect/<area>/playbooks/` | manual/bootstrap/fallback operating procedures |
| `docs/architect/<area>/history/` | non-canonical archived source material |
| `docs/specs/**` | BA/state/behavior specs; relationship to `docs/architect/**` still needs to be settled |
| `domains/**/AGENTS.md` | domain doctrine loaded by agents |
| `domains/**/skills/**/SKILL.md` | domain agent instruction for executable workflows |
| `.agents/skills/**/SKILL.md` | installed agent instruction surface |
| `docs/how-to/**` | end-user task guidance |
| `docs/reference/**` | end-user lookup/reference |
| `docs/tutorials/**` | end-user learning path |
| `docs/explanation/**` | end-user conceptual explanation |
| `docs/knowledge/**` | retrospective learning and accumulated lessons |
| `docs/history/**` | non-canonical archive and discussion history |
| `plans/**` | implementation track plans and execution evidence |
```

### Full target shown text

```text
| Location | Candidate role |
|---|---|
| `docs/architect/**` | system design for humans and agents who need to understand or change fgOS architecture |
| `docs/architect/<area>/README.md` | portal and reading path for one design area |
| `docs/architect/<area>/vision.md` | highest-level identity and boundary for one design area |
| `docs/architect/<area>/vocabulary/` | canonical terms for one design area |
| `docs/architect/<area>/architecture/` | accepted boundaries, responsibilities, flows, and invariants |
| `docs/architect/<area>/contracts/` | accepted exact behavior, schema, state, evidence, and interface rules |
| `docs/architect/<area>/decisions/` | ADRs for accepted or rejected durable decisions |
| `docs/architect/<area>/proposals/` | non-canonical drafts and alternatives |
| `docs/architect/<area>/roadmap/` | implementation sequence and rollout plan |
| `docs/architect/<area>/verification/` | proof, test evidence, live traces, review, red-team reports |
| `docs/architect/<area>/playbooks/` | manual/bootstrap/fallback operating procedures |
| `docs/architect/<area>/history/` | non-canonical archived source material |
| `docs/specs/**` | BA/state/behavior specs; relationship to `docs/architect/**` still needs to be settled |
| `domains/**/AGENTS.md` | domain doctrine loaded by agents |
| `domains/**/skills/**/SKILL.md` | domain agent instruction for executable workflows |
| `.agents/skills/**/SKILL.md` | installed agent instruction surface |
| `docs/how-to/**` | end-user task guidance |
| `docs/reference/**` | end-user lookup/reference |
| `docs/tutorials/**` | end-user learning path |
| `docs/explanation/**` | end-user conceptual explanation |
| `docs/knowledge/**` | retrospective learning and accumulated lessons |
| `docs/history/**` | non-canonical archive and discussion history |
| `plans/**` | implementation track plans and execution evidence |
```

## claim_e56a5fce9d9dd879b16728f42c02c775

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#open-questions, lines 240–240.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#open-questions.
Source digest: 1472f37c2373081f910cf229147d1d1aa49efede97b079bfd705f803fafc3fbd
Target digest: 1472f37c2373081f910cf229147d1d1aa49efede97b079bfd705f803fafc3fbd
Shown source SHA256: b87e2a19b165da0414d01536acf458d970997415bab946fcfc0f0429d9bf3396
Shown target SHA256: b87e2a19b165da0414d01536acf458d970997415bab946fcfc0f0429d9bf3396

### Proposed decision

```json
{
  "claimId": "claim_e56a5fce9d9dd879b16728f42c02c775",
  "sourceUnitDigest": "1472f37c2373081f910cf229147d1d1aa49efede97b079bfd705f803fafc3fbd",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "open-questions",
  "targetUnitDigest": "1472f37c2373081f910cf229147d1d1aa49efede97b079bfd705f803fafc3fbd",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#open-questions (lines 240–240) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#open-questions (lines 264–264); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## Open Questions

- If a future human-first root such as `docs/system/` exists, what other
  top-level documentation spaces should sit beside it?
- Should `docs/architect/` become the official root for all system-design docs,
  or should a new `docs/design/` root be introduced?
- What is the final relationship between `docs/specs/**` and
  `docs/architect/**`?
- Are specs a contract-like layer, a BA state layer, or a legacy mixed layer
  that should be gradually split?
- Should documentation governance be global under `docs/architect/`, or should
  each area keep its own governance file?
- What is the minimal required metadata set that is useful without creating
  bureaucratic noise?
- Should every document declare `Audience` and `Purpose`, or only maintained
  design documents?
- What is the exact authority order across Vision, ADR, Contract, Architecture,
  Doctrine, Agent Instruction, Proposal, Verification, and History?
- Where should generated documentation live?
- How should generated files declare their source and regeneration command?
- Which documents are meant for human reading, agent loading, runtime execution,
  or end-user learning?
- How should `docs/knowledge/**` be used without becoming a second design
  authority system?
- Should `plans/**` stay outside `docs/`, or should selected plan outputs be
  promoted into `verification/` or `history/`?
- Should old documents be moved, relabeled, indexed, or left in place with
  clearer frontmatter?
- What is the deletion/archive policy for temporary discussion files like this
  one?
```

### Full target shown text

```text
## Open Questions

- If a future human-first root such as `docs/system/` exists, what other
  top-level documentation spaces should sit beside it?
- Should `docs/architect/` become the official root for all system-design docs,
  or should a new `docs/design/` root be introduced?
- What is the final relationship between `docs/specs/**` and
  `docs/architect/**`?
- Are specs a contract-like layer, a BA state layer, or a legacy mixed layer
  that should be gradually split?
- Should documentation governance be global under `docs/architect/`, or should
  each area keep its own governance file?
- What is the minimal required metadata set that is useful without creating
  bureaucratic noise?
- Should every document declare `Audience` and `Purpose`, or only maintained
  design documents?
- What is the exact authority order across Vision, ADR, Contract, Architecture,
  Doctrine, Agent Instruction, Proposal, Verification, and History?
- Where should generated documentation live?
- How should generated files declare their source and regeneration command?
- Which documents are meant for human reading, agent loading, runtime execution,
  or end-user learning?
- How should `docs/knowledge/**` be used without becoming a second design
  authority system?
- Should `plans/**` stay outside `docs/`, or should selected plan outputs be
  promoted into `verification/` or `history/`?
- Should old documents be moved, relabeled, indexed, or left in place with
  clearer frontmatter?
- What is the deletion/archive policy for temporary discussion files like this
  one?
```

## claim_2de7cfc0e9dd7247b275a4454e00590c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-32, lines 242–269.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-35.
Source digest: 0035c138b0f9368c255f2e6f31256480def713ff6be3e86fae88e8d8be2b54a1
Target digest: 0035c138b0f9368c255f2e6f31256480def713ff6be3e86fae88e8d8be2b54a1
Shown source SHA256: 0035c138b0f9368c255f2e6f31256480def713ff6be3e86fae88e8d8be2b54a1
Shown target SHA256: 0035c138b0f9368c255f2e6f31256480def713ff6be3e86fae88e8d8be2b54a1

### Proposed decision

```json
{
  "claimId": "claim_2de7cfc0e9dd7247b275a4454e00590c",
  "sourceUnitDigest": "0035c138b0f9368c255f2e6f31256480def713ff6be3e86fae88e8d8be2b54a1",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "0035c138b0f9368c255f2e6f31256480def713ff6be3e86fae88e8d8be2b54a1",
  "targetAncestry": [
    "Documentation System Discussion",
    "Open Questions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-32 (lines 242–269) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-35 (lines 266–293); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- If a future human-first root such as `docs/system/` exists, what other
  top-level documentation spaces should sit beside it?
- Should `docs/architect/` become the official root for all system-design docs,
  or should a new `docs/design/` root be introduced?
- What is the final relationship between `docs/specs/**` and
  `docs/architect/**`?
- Are specs a contract-like layer, a BA state layer, or a legacy mixed layer
  that should be gradually split?
- Should documentation governance be global under `docs/architect/`, or should
  each area keep its own governance file?
- What is the minimal required metadata set that is useful without creating
  bureaucratic noise?
- Should every document declare `Audience` and `Purpose`, or only maintained
  design documents?
- What is the exact authority order across Vision, ADR, Contract, Architecture,
  Doctrine, Agent Instruction, Proposal, Verification, and History?
- Where should generated documentation live?
- How should generated files declare their source and regeneration command?
- Which documents are meant for human reading, agent loading, runtime execution,
  or end-user learning?
- How should `docs/knowledge/**` be used without becoming a second design
  authority system?
- Should `plans/**` stay outside `docs/`, or should selected plan outputs be
  promoted into `verification/` or `history/`?
- Should old documents be moved, relabeled, indexed, or left in place with
  clearer frontmatter?
- What is the deletion/archive policy for temporary discussion files like this
  one?
```

### Full target shown text

```text
- If a future human-first root such as `docs/system/` exists, what other
  top-level documentation spaces should sit beside it?
- Should `docs/architect/` become the official root for all system-design docs,
  or should a new `docs/design/` root be introduced?
- What is the final relationship between `docs/specs/**` and
  `docs/architect/**`?
- Are specs a contract-like layer, a BA state layer, or a legacy mixed layer
  that should be gradually split?
- Should documentation governance be global under `docs/architect/`, or should
  each area keep its own governance file?
- What is the minimal required metadata set that is useful without creating
  bureaucratic noise?
- Should every document declare `Audience` and `Purpose`, or only maintained
  design documents?
- What is the exact authority order across Vision, ADR, Contract, Architecture,
  Doctrine, Agent Instruction, Proposal, Verification, and History?
- Where should generated documentation live?
- How should generated files declare their source and regeneration command?
- Which documents are meant for human reading, agent loading, runtime execution,
  or end-user learning?
- How should `docs/knowledge/**` be used without becoming a second design
  authority system?
- Should `plans/**` stay outside `docs/`, or should selected plan outputs be
  promoted into `verification/` or `history/`?
- Should old documents be moved, relabeled, indexed, or left in place with
  clearer frontmatter?
- What is the deletion/archive policy for temporary discussion files like this
  one?
```

## claim_0be872076ae0aa079fb36955151d9169

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#things-to-chốt, lines 271–271.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#things-to-chốt.
Source digest: bf0d133e5a309981773bb5b88f7f4b549f8dea89ee0b5c70cafeff86bdc1c449
Target digest: bf0d133e5a309981773bb5b88f7f4b549f8dea89ee0b5c70cafeff86bdc1c449
Shown source SHA256: 404ac98920c4d8f252e69cc4ccde86568114c6502f73d4e425d67270dc2747c7
Shown target SHA256: 404ac98920c4d8f252e69cc4ccde86568114c6502f73d4e425d67270dc2747c7

### Proposed decision

```json
{
  "claimId": "claim_0be872076ae0aa079fb36955151d9169",
  "sourceUnitDigest": "bf0d133e5a309981773bb5b88f7f4b549f8dea89ee0b5c70cafeff86bdc1c449",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "things-to-chốt",
  "targetUnitDigest": "bf0d133e5a309981773bb5b88f7f4b549f8dea89ee0b5c70cafeff86bdc1c449",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#things-to-chốt (lines 271–271) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#things-to-chốt (lines 295–295); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## Things To Chốt

- Final document type vocabulary.
- Final audience vocabulary.
- Final purpose vocabulary.
- Final writer type vocabulary.
- Final authority order.
- Final placement map.
- Final required metadata/header.
- Promotion rule from proposal/discussion into canonical docs.
- Rule for generated docs.
- Rule for provenance/source declaration: generated automatically, hand-authored
  discussion, agent-produced draft, promoted canonical content, migrated file,
  or evidence/log artifact.
- Rule for proof/evidence placement.
- Rule for doctrine versus agent instruction.
- Rule for end-user docs versus system-design docs.
- Migration strategy for existing `docs/specs`, `docs/history`,
  `docs/knowledge`, `docs/architect`, and `plans`.
```

### Full target shown text

```text
## Things To Chốt

- Final document type vocabulary.
- Final audience vocabulary.
- Final purpose vocabulary.
- Final writer type vocabulary.
- Final authority order.
- Final placement map.
- Final required metadata/header.
- Promotion rule from proposal/discussion into canonical docs.
- Rule for generated docs.
- Rule for provenance/source declaration: generated automatically, hand-authored
  discussion, agent-produced draft, promoted canonical content, migrated file,
  or evidence/log artifact.
- Rule for proof/evidence placement.
- Rule for doctrine versus agent instruction.
- Rule for end-user docs versus system-design docs.
- Migration strategy for existing `docs/specs`, `docs/history`,
  `docs/knowledge`, `docs/architect`, and `plans`.
```

## claim_71fd78de69d236a607aa103ec2c42bf8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-33, lines 273–289.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-36.
Source digest: 6146c816f02876ca6a02aa4038c7212a4adad18004ff272886a2a29553a3a742
Target digest: 6146c816f02876ca6a02aa4038c7212a4adad18004ff272886a2a29553a3a742
Shown source SHA256: 6146c816f02876ca6a02aa4038c7212a4adad18004ff272886a2a29553a3a742
Shown target SHA256: 6146c816f02876ca6a02aa4038c7212a4adad18004ff272886a2a29553a3a742

### Proposed decision

```json
{
  "claimId": "claim_71fd78de69d236a607aa103ec2c42bf8",
  "sourceUnitDigest": "6146c816f02876ca6a02aa4038c7212a4adad18004ff272886a2a29553a3a742",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "6146c816f02876ca6a02aa4038c7212a4adad18004ff272886a2a29553a3a742",
  "targetAncestry": [
    "Documentation System Discussion",
    "Things To Chốt"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-33 (lines 273–289) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-36 (lines 297–313); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Final document type vocabulary.
- Final audience vocabulary.
- Final purpose vocabulary.
- Final writer type vocabulary.
- Final authority order.
- Final placement map.
- Final required metadata/header.
- Promotion rule from proposal/discussion into canonical docs.
- Rule for generated docs.
- Rule for provenance/source declaration: generated automatically, hand-authored
  discussion, agent-produced draft, promoted canonical content, migrated file,
  or evidence/log artifact.
- Rule for proof/evidence placement.
- Rule for doctrine versus agent instruction.
- Rule for end-user docs versus system-design docs.
- Migration strategy for existing `docs/specs`, `docs/history`,
  `docs/knowledge`, `docs/architect`, and `plans`.
```

### Full target shown text

```text
- Final document type vocabulary.
- Final audience vocabulary.
- Final purpose vocabulary.
- Final writer type vocabulary.
- Final authority order.
- Final placement map.
- Final required metadata/header.
- Promotion rule from proposal/discussion into canonical docs.
- Rule for generated docs.
- Rule for provenance/source declaration: generated automatically, hand-authored
  discussion, agent-produced draft, promoted canonical content, migrated file,
  or evidence/log artifact.
- Rule for proof/evidence placement.
- Rule for doctrine versus agent instruction.
- Rule for end-user docs versus system-design docs.
- Migration strategy for existing `docs/specs`, `docs/history`,
  `docs/knowledge`, `docs/architect`, and `plans`.
```

## claim_ea1bf1f78c8099c845d4873cfde6a05a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#discussion-log, lines 291–291.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#discussion-log.
Source digest: 7bcf144bf1b07cd838b26f132c5f2eec72ad19c1568f414382aea25fafb0456c
Target digest: 7bcf144bf1b07cd838b26f132c5f2eec72ad19c1568f414382aea25fafb0456c
Shown source SHA256: bf4e6b870282083aebc9f3fd9d37c1cde1ab7227ef3e168a7374a91a0a17f898
Shown target SHA256: bf4e6b870282083aebc9f3fd9d37c1cde1ab7227ef3e168a7374a91a0a17f898

### Proposed decision

```json
{
  "claimId": "claim_ea1bf1f78c8099c845d4873cfde6a05a",
  "sourceUnitDigest": "7bcf144bf1b07cd838b26f132c5f2eec72ad19c1568f414382aea25fafb0456c",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "discussion-log",
  "targetUnitDigest": "7bcf144bf1b07cd838b26f132c5f2eec72ad19c1568f414382aea25fafb0456c",
  "targetAncestry": [
    "Documentation System Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#discussion-log (lines 291–291) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#discussion-log (lines 315–315); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## Discussion Log
```

### Full target shown text

```text
## Discussion Log
```

## claim_83b013ce959691bdefd29ced49fbff4d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#2026-09-13-brainstorm-spec-khác-architecture-như-thế-nào, lines 293–293.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#2026-09-13-brainstorm-spec-khác-architecture-như-thế-nào.
Source digest: 0bf1062ebd1dd2ab9c539dfd147f7c3d59de111a764945b979ea9e294be1369b
Target digest: 0bf1062ebd1dd2ab9c539dfd147f7c3d59de111a764945b979ea9e294be1369b
Shown source SHA256: d2ac828fabde9a70f3e523bf07583862d2e524139e689436302446642c726e72
Shown target SHA256: d2ac828fabde9a70f3e523bf07583862d2e524139e689436302446642c726e72

### Proposed decision

```json
{
  "claimId": "claim_83b013ce959691bdefd29ced49fbff4d",
  "sourceUnitDigest": "0bf1062ebd1dd2ab9c539dfd147f7c3d59de111a764945b979ea9e294be1369b",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "2026-09-13-brainstorm-spec-khác-architecture-như-thế-nào",
  "targetUnitDigest": "0bf1062ebd1dd2ab9c539dfd147f7c3d59de111a764945b979ea9e294be1369b",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source heading docs/architect/documentation-system-discussion.md#2026-09-13-brainstorm-spec-khác-architecture-như-thế-nào (lines 293–293) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#2026-09-13-brainstorm-spec-khác-architecture-như-thế-nào (lines 317–317); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?

Prompt under discussion:

> Cần brainstorm để quyết định `spec` và `architecture` khác gì nhau.

Current framing:

- Both can be canonical.
- Both can mention boundaries, behavior, entities, and decisions.
- The useful distinction cannot be "technical vs non-technical" or "high-level
  vs detailed" only, because some specs are high-level and some architecture
  docs carry detailed boundaries.

Candidate distinction axes:

1. **Question answered**
   - Architecture answers: "What shape should the system have, and why are the
     boundaries here?"
   - Spec answers: "Given the accepted shape, what behavior/state/interface
     must a reader or implementer observe?"
2. **Primary reader mode**
   - Architecture is read to decide, review, redesign, or understand tradeoffs.
   - Spec is read to implement, verify, maintain, or rebuild current behavior.
3. **Time orientation**
   - Architecture may include direction, constraints, alternatives, proposed
     boundaries, and accepted design.
   - Spec should describe the current accepted/live behavior or explicitly mark
     gaps.
4. **Authority shape**
   - Architecture owns rationale, responsibility boundaries, component shape,
     and design invariants.
   - Spec owns area facts: entry points, data dictionary, behaviors,
     business rules, actors, edge cases, open gaps, and pointers.
5. **Change mode**
   - Architecture can move faster during design churn under `docs/architect/`.
   - Spec should update after decisions settle, through an owning sync workflow,
     so it remains a stable read-first surface.
6. **Proof expectation**
   - Architecture is validated by coherence, ADRs, design review, and proof
     plans.
   - Spec is validated by alignment with implemented behavior, tests, contracts,
     or explicitly named open gaps.

Candidate concise rule:

- Architecture is the **why/shape/boundary layer**.
- Spec is the **current behavior/state/reference layer**.

Potential authority rule:

- If a question is about component responsibility or accepted design direction,
  start with architecture.
- If a question is about how the system currently behaves, what data means, or
  what an implementer must preserve, start with spec.
- If they disagree, the disagreement is drift; neither silently overwrites the
  other. Use status/provenance:
  - accepted architecture may define the intended correction;
  - current spec may define current implemented behavior;
  - a migration/verification item reconciles them.

Open risk:

- If `spec` becomes a dump for all settled architecture narrative, it will grow
  into unreadable history.
- If `architecture` keeps settled behavior forever, specs become stale and
  agents miss the current source of behavior truth.

Settled direction:

- The distinction is accepted, but `spec` and `architecture` should not present
  as two equal top-level truths. That would confuse readers and agents.
- Need a hierarchy where one top-level documentation system explains which door
  to use:
  - `docs/doc-governance.md` owns the taxonomy and route rules;
  - `docs/reading-map.md` tells what to read first;
  - `docs/architect/**` is the design/decision/boundary workspace;
  - `docs/specs/**` is the stable current behavior/state reference layer.
- Open design choice: whether the top-level portal should route by task
  ("understand design", "implement behavior", "verify", "operate") rather than
  by directory name.

Human navigation objection:

- Relying on readers to pass through `doc-governance.md` or `reading-map.md`
  first is not enough.
- Human readers scan spatially: directory names, grouping, and relative
  placement must make the relationship obvious even before governance is read.
- Therefore the final structure must be legible from the tree itself. Governance
  can define the rule, but the folder layout must visually encode it.
- The next design needs an information architecture that makes `architecture`
  and `spec` visibly related without making them look like two unrelated
  top-level truths.

Follow-up question:

> Ngoài `system` sẽ có cái gì?

Candidate answer:

- `system` should not become the whole `docs/` universe. It should contain the
  documentation needed to understand, change, verify, and operate fgOS itself as
  a system.
- Other top-level spaces should be named by reader intent / artifact nature, so
  a human scanning the tree can tell whether they are reading:
  - stable system truth;
  - user-facing guidance;
  - generated projections;
  - execution evidence;
  - historical/archive material;
  - agent runtime instructions.
- Candidate sibling spaces to discuss:
  - `docs/system/` — maintained system knowledge: areas, architecture, specs,
    contracts, verification, operations, decisions relevant to fgOS internals.
  - `docs/user/` or existing Diataxis-style `docs/how-to`,
    `docs/reference`, `docs/explanation`, `docs/tutorials` — user-facing fgOS
    product documentation.
  - `docs/generated/` or explicit generated subtrees — deterministic
    projections such as registries, indexes, UI spec outputs.
  - `docs/history/` — archive, migrations, retired source material, discussion
    history that is no longer authority.
  - `docs/knowledge/` — retrospective/learning captures, if kept distinct from
    system authority.
  - `plans/` — execution plans and work evidence, likely outside `docs/`
    unless promoted into `docs/system/.../verification`.
  - `domains/` and `.agents/skills/` — agent doctrine/instruction surfaces,
    probably not moved under `docs/` because they are loaded/executed by
    runtime workflows, but must be governed by the documentation taxonomy.

Open design tension:

- A clean human tree wants fewer roots.
- Runtime/generated surfaces sometimes need to stay where tools already expect
  them.
- Therefore the governance may need to distinguish "documentation space" from
  "physical source path": some governed artifacts live outside `docs/`.

Follow-up question:

> Có tên nào khác phù hợp hơn `system`?

Candidate root names:

| Name | Strength | Risk |
|---|---|---|
| `system` | Plain, broad, matches "system design"; can contain both spec and architecture without privileging either | May sound too generic; could be confused with OS/runtime system only |
| `product` | Emphasizes fgOS as a product used by others, not only internal architecture | Specs/architecture/contracts may sound less naturally placed under it |
| `platform` | Strong fit for fgOS as a platform layer; concrete and mission-aligned | Could blur with product marketing/user docs; not every internal area feels "platform" |
| `core` | Short, signals internals | Too narrow; may imply only core package, not distribution/skills/operations |
| `design` | Directly names architecture/design intent | Makes specs feel secondary again; risks recreating `architect` under a new name |
| `engineering` | Signals implementation-facing maintained knowledge | Too team/process-oriented; less friendly to product/BA/state specs |
| `internals` | Clear distinction from user docs | Sounds like code internals, not product/system behavior; less inviting |
| `foundation` | Resonates with platform foundations and durable laws | Abstract; may be unclear as a navigation root |
| `operating-model` | Good for workflows/agent operations | Too narrow for specs/contracts/architecture |

Current leaning:

- `platform` may be the most fgOS-specific name.
- `system` may be the clearest general name.
- `design` is not preferred because it makes `spec` feel like a guest under a
  design/architecture umbrella.
- If the root must contain `spec`, `architecture`, `contracts`,
  `verification`, and `operations` as peers under each area, the name should not
  imply only design narrative.

Follow-up question:

> Có cần thêm `areas/` không, hay dùng trực tiếp `<area>` dưới root?

Candidate shapes:

```txt
docs/platform/
  areas/
    runner/
    distribution/
  shared/
  README.md
```

versus:

```txt
docs/platform/
  runner/
  distribution/
  shared/
  README.md
```

Trade-off:

- Keeping `areas/` makes it explicit that `runner`, `distribution`, etc. are
  system/product areas, while other root children such as `shared/`,
  `governance/`, `generated/`, or `README.md` are not areas.
- Removing `areas/` makes the tree shorter and more direct for human scanning.
- If the root is dedicated only to maintained platform/system docs, direct
  `<area>` folders may be clear enough.
- If the root also contains many non-area support folders, `areas/` prevents
  mixing first-class areas with meta/support material.

Current leaning:

- Prefer direct `<area>` folders if the root can stay clean and dedicated:

  ```txt
  docs/platform/
    runner/
    distribution/
    work-state/
    shared/
  ```

- Use `areas/` only if the root becomes crowded with many non-area siblings.

Settled direction for now:

- Do not add an `areas/` layer initially.
- Use direct area folders under the maintained platform/system root:

  ```txt
  docs/platform/<area>/
  ```

- This keeps spatial navigation short and makes the area the first visible
  organizing unit for human readers.
- `areas/` remains an escape hatch only if `docs/platform/` later becomes too
  crowded with non-area support folders.

Candidate full tree to refine:

```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    shared/
    runner/
    distribution/
    work-state/
    agent-coordination/
    skills/
    setup-doctor/
    ui-spec/

  user/
    README.md
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
  knowledge/
  history/
```

Per-area target:

```txt
docs/platform/<area>/
  README.md
  spec.md
  architecture/
  contracts/
  decisions/
  verification/
  operations/
  proposals/
  history/
```

Governed external surfaces:

```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```
````

### Full target shown text

````text
### 2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?

Prompt under discussion:

> Cần brainstorm để quyết định `spec` và `architecture` khác gì nhau.

Current framing:

- Both can be canonical.
- Both can mention boundaries, behavior, entities, and decisions.
- The useful distinction cannot be "technical vs non-technical" or "high-level
  vs detailed" only, because some specs are high-level and some architecture
  docs carry detailed boundaries.

Candidate distinction axes:

1. **Question answered**
   - Architecture answers: "What shape should the system have, and why are the
     boundaries here?"
   - Spec answers: "Given the accepted shape, what behavior/state/interface
     must a reader or implementer observe?"
2. **Primary reader mode**
   - Architecture is read to decide, review, redesign, or understand tradeoffs.
   - Spec is read to implement, verify, maintain, or rebuild current behavior.
3. **Time orientation**
   - Architecture may include direction, constraints, alternatives, proposed
     boundaries, and accepted design.
   - Spec should describe the current accepted/live behavior or explicitly mark
     gaps.
4. **Authority shape**
   - Architecture owns rationale, responsibility boundaries, component shape,
     and design invariants.
   - Spec owns area facts: entry points, data dictionary, behaviors,
     business rules, actors, edge cases, open gaps, and pointers.
5. **Change mode**
   - Architecture can move faster during design churn under `docs/architect/`.
   - Spec should update after decisions settle, through an owning sync workflow,
     so it remains a stable read-first surface.
6. **Proof expectation**
   - Architecture is validated by coherence, ADRs, design review, and proof
     plans.
   - Spec is validated by alignment with implemented behavior, tests, contracts,
     or explicitly named open gaps.

Candidate concise rule:

- Architecture is the **why/shape/boundary layer**.
- Spec is the **current behavior/state/reference layer**.

Potential authority rule:

- If a question is about component responsibility or accepted design direction,
  start with architecture.
- If a question is about how the system currently behaves, what data means, or
  what an implementer must preserve, start with spec.
- If they disagree, the disagreement is drift; neither silently overwrites the
  other. Use status/provenance:
  - accepted architecture may define the intended correction;
  - current spec may define current implemented behavior;
  - a migration/verification item reconciles them.

Open risk:

- If `spec` becomes a dump for all settled architecture narrative, it will grow
  into unreadable history.
- If `architecture` keeps settled behavior forever, specs become stale and
  agents miss the current source of behavior truth.

Settled direction:

- The distinction is accepted, but `spec` and `architecture` should not present
  as two equal top-level truths. That would confuse readers and agents.
- Need a hierarchy where one top-level documentation system explains which door
  to use:
  - `docs/doc-governance.md` owns the taxonomy and route rules;
  - `docs/reading-map.md` tells what to read first;
  - `docs/architect/**` is the design/decision/boundary workspace;
  - `docs/specs/**` is the stable current behavior/state reference layer.
- Open design choice: whether the top-level portal should route by task
  ("understand design", "implement behavior", "verify", "operate") rather than
  by directory name.

Human navigation objection:

- Relying on readers to pass through `doc-governance.md` or `reading-map.md`
  first is not enough.
- Human readers scan spatially: directory names, grouping, and relative
  placement must make the relationship obvious even before governance is read.
- Therefore the final structure must be legible from the tree itself. Governance
  can define the rule, but the folder layout must visually encode it.
- The next design needs an information architecture that makes `architecture`
  and `spec` visibly related without making them look like two unrelated
  top-level truths.

Follow-up question:

> Ngoài `system` sẽ có cái gì?

Candidate answer:

- `system` should not become the whole `docs/` universe. It should contain the
  documentation needed to understand, change, verify, and operate fgOS itself as
  a system.
- Other top-level spaces should be named by reader intent / artifact nature, so
  a human scanning the tree can tell whether they are reading:
  - stable system truth;
  - user-facing guidance;
  - generated projections;
  - execution evidence;
  - historical/archive material;
  - agent runtime instructions.
- Candidate sibling spaces to discuss:
  - `docs/system/` — maintained system knowledge: areas, architecture, specs,
    contracts, verification, operations, decisions relevant to fgOS internals.
  - `docs/user/` or existing Diataxis-style `docs/how-to`,
    `docs/reference`, `docs/explanation`, `docs/tutorials` — user-facing fgOS
    product documentation.
  - `docs/generated/` or explicit generated subtrees — deterministic
    projections such as registries, indexes, UI spec outputs.
  - `docs/history/` — archive, migrations, retired source material, discussion
    history that is no longer authority.
  - `docs/knowledge/` — retrospective/learning captures, if kept distinct from
    system authority.
  - `plans/` — execution plans and work evidence, likely outside `docs/`
    unless promoted into `docs/system/.../verification`.
  - `domains/` and `.agents/skills/` — agent doctrine/instruction surfaces,
    probably not moved under `docs/` because they are loaded/executed by
    runtime workflows, but must be governed by the documentation taxonomy.

Open design tension:

- A clean human tree wants fewer roots.
- Runtime/generated surfaces sometimes need to stay where tools already expect
  them.
- Therefore the governance may need to distinguish "documentation space" from
  "physical source path": some governed artifacts live outside `docs/`.

Follow-up question:

> Có tên nào khác phù hợp hơn `system`?

Candidate root names:

| Name | Strength | Risk |
|---|---|---|
| `system` | Plain, broad, matches "system design"; can contain both spec and architecture without privileging either | May sound too generic; could be confused with OS/runtime system only |
| `product` | Emphasizes fgOS as a product used by others, not only internal architecture | Specs/architecture/contracts may sound less naturally placed under it |
| `platform` | Strong fit for fgOS as a platform layer; concrete and mission-aligned | Could blur with product marketing/user docs; not every internal area feels "platform" |
| `core` | Short, signals internals | Too narrow; may imply only core package, not distribution/skills/operations |
| `design` | Directly names architecture/design intent | Makes specs feel secondary again; risks recreating `architect` under a new name |
| `engineering` | Signals implementation-facing maintained knowledge | Too team/process-oriented; less friendly to product/BA/state specs |
| `internals` | Clear distinction from user docs | Sounds like code internals, not product/system behavior; less inviting |
| `foundation` | Resonates with platform foundations and durable laws | Abstract; may be unclear as a navigation root |
| `operating-model` | Good for workflows/agent operations | Too narrow for specs/contracts/architecture |

Current leaning:

- `platform` may be the most fgOS-specific name.
- `system` may be the clearest general name.
- `design` is not preferred because it makes `spec` feel like a guest under a
  design/architecture umbrella.
- If the root must contain `spec`, `architecture`, `contracts`,
  `verification`, and `operations` as peers under each area, the name should not
  imply only design narrative.

Follow-up question:

> Có cần thêm `areas/` không, hay dùng trực tiếp `<area>` dưới root?

Candidate shapes:

```txt
docs/platform/
  areas/
    runner/
    distribution/
  shared/
  README.md
```

versus:

```txt
docs/platform/
  runner/
  distribution/
  shared/
  README.md
```

Trade-off:

- Keeping `areas/` makes it explicit that `runner`, `distribution`, etc. are
  system/product areas, while other root children such as `shared/`,
  `governance/`, `generated/`, or `README.md` are not areas.
- Removing `areas/` makes the tree shorter and more direct for human scanning.
- If the root is dedicated only to maintained platform/system docs, direct
  `<area>` folders may be clear enough.
- If the root also contains many non-area support folders, `areas/` prevents
  mixing first-class areas with meta/support material.

Current leaning:

- Prefer direct `<area>` folders if the root can stay clean and dedicated:

  ```txt
  docs/platform/
    runner/
    distribution/
    work-state/
    shared/
  ```

- Use `areas/` only if the root becomes crowded with many non-area siblings.

Settled direction for now:

- Do not add an `areas/` layer initially.
- Use direct area folders under the maintained platform/system root:

  ```txt
  docs/platform/<area>/
  ```

- This keeps spatial navigation short and makes the area the first visible
  organizing unit for human readers.
- `areas/` remains an escape hatch only if `docs/platform/` later becomes too
  crowded with non-area support folders.

Candidate full tree to refine:

```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    shared/
    runner/
    distribution/
    work-state/
    agent-coordination/
    skills/
    setup-doctor/
    ui-spec/

  user/
    README.md
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
  knowledge/
  history/
```

Per-area target:

```txt
docs/platform/<area>/
  README.md
  spec.md
  architecture/
  contracts/
  decisions/
  verification/
  operations/
  proposals/
  history/
```

Governed external surfaces:

```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```
````

## claim_88bade9a1b54c02c780cfe8c54b2265b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-34, lines 295–295.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-37.
Source digest: 7349663d046a2d1f1f3f57ba62619603d9cf84486b4e36a555c7d7b76c96de78
Target digest: 7349663d046a2d1f1f3f57ba62619603d9cf84486b4e36a555c7d7b76c96de78
Shown source SHA256: 7349663d046a2d1f1f3f57ba62619603d9cf84486b4e36a555c7d7b76c96de78
Shown target SHA256: 7349663d046a2d1f1f3f57ba62619603d9cf84486b4e36a555c7d7b76c96de78

### Proposed decision

```json
{
  "claimId": "claim_88bade9a1b54c02c780cfe8c54b2265b",
  "sourceUnitDigest": "7349663d046a2d1f1f3f57ba62619603d9cf84486b4e36a555c7d7b76c96de78",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "7349663d046a2d1f1f3f57ba62619603d9cf84486b4e36a555c7d7b76c96de78",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: target digest repeats; source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-34 (lines 295–295) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-37 (lines 319–319); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Prompt under discussion:
```

### Full target shown text

```text
Prompt under discussion:
```

## claim_3ea2a6776141c991a83fe5755c4603ea

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-35, lines 297–297.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-38.
Source digest: 1d45e1aa983d7cb3d0e45b8c0f2af3f91b0bbd654b932adf97055a01157a05e4
Target digest: 1d45e1aa983d7cb3d0e45b8c0f2af3f91b0bbd654b932adf97055a01157a05e4
Shown source SHA256: 1d45e1aa983d7cb3d0e45b8c0f2af3f91b0bbd654b932adf97055a01157a05e4
Shown target SHA256: 1d45e1aa983d7cb3d0e45b8c0f2af3f91b0bbd654b932adf97055a01157a05e4

### Proposed decision

```json
{
  "claimId": "claim_3ea2a6776141c991a83fe5755c4603ea",
  "sourceUnitDigest": "1d45e1aa983d7cb3d0e45b8c0f2af3f91b0bbd654b932adf97055a01157a05e4",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "1d45e1aa983d7cb3d0e45b8c0f2af3f91b0bbd654b932adf97055a01157a05e4",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-35 (lines 297–297) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-38 (lines 321–321); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
> Cần brainstorm để quyết định `spec` và `architecture` khác gì nhau.
```

### Full target shown text

```text
> Cần brainstorm để quyết định `spec` và `architecture` khác gì nhau.
```

## claim_1faeb9797443e3f3f6569e02effd77f9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-36, lines 299–305.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-39.
Source digest: 1805bdb448b8210415063864b038f3a6f96e59e58cc86a74fbc9503ef5b8d160
Target digest: 1805bdb448b8210415063864b038f3a6f96e59e58cc86a74fbc9503ef5b8d160
Shown source SHA256: 1805bdb448b8210415063864b038f3a6f96e59e58cc86a74fbc9503ef5b8d160
Shown target SHA256: 1805bdb448b8210415063864b038f3a6f96e59e58cc86a74fbc9503ef5b8d160

### Proposed decision

```json
{
  "claimId": "claim_1faeb9797443e3f3f6569e02effd77f9",
  "sourceUnitDigest": "1805bdb448b8210415063864b038f3a6f96e59e58cc86a74fbc9503ef5b8d160",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "1805bdb448b8210415063864b038f3a6f96e59e58cc86a74fbc9503ef5b8d160",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-36 (lines 299–305) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-39 (lines 323–329); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Current framing:

- Both can be canonical.
- Both can mention boundaries, behavior, entities, and decisions.
- The useful distinction cannot be "technical vs non-technical" or "high-level
  vs detailed" only, because some specs are high-level and some architecture
  docs carry detailed boundaries.
```

### Full target shown text

```text
Current framing:

- Both can be canonical.
- Both can mention boundaries, behavior, entities, and decisions.
- The useful distinction cannot be "technical vs non-technical" or "high-level
  vs detailed" only, because some specs are high-level and some architecture
  docs carry detailed boundaries.
```

## claim_bb59eb272bf5cf1e8adef13fadab1c1a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-37, lines 307–307.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-40.
Source digest: 757a871204c4fda7037b75d978a4fc034e4957b32d0a2c2cfad0b8e335f7ed8a
Target digest: 757a871204c4fda7037b75d978a4fc034e4957b32d0a2c2cfad0b8e335f7ed8a
Shown source SHA256: 757a871204c4fda7037b75d978a4fc034e4957b32d0a2c2cfad0b8e335f7ed8a
Shown target SHA256: 757a871204c4fda7037b75d978a4fc034e4957b32d0a2c2cfad0b8e335f7ed8a

### Proposed decision

```json
{
  "claimId": "claim_bb59eb272bf5cf1e8adef13fadab1c1a",
  "sourceUnitDigest": "757a871204c4fda7037b75d978a4fc034e4957b32d0a2c2cfad0b8e335f7ed8a",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "757a871204c4fda7037b75d978a4fc034e4957b32d0a2c2cfad0b8e335f7ed8a",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-37 (lines 307–307) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-40 (lines 331–331); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Candidate distinction axes:
```

### Full target shown text

```text
Candidate distinction axes:
```

## claim_10ea7bbf72528b1e6e7796cb8a7dfcd4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-38, lines 309–335.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-41.
Source digest: 4c9bd2269fa603bfc37ac40a682248607b925067e398ade694b3812e1fbbf200
Target digest: 4c9bd2269fa603bfc37ac40a682248607b925067e398ade694b3812e1fbbf200
Shown source SHA256: 4c9bd2269fa603bfc37ac40a682248607b925067e398ade694b3812e1fbbf200
Shown target SHA256: 4c9bd2269fa603bfc37ac40a682248607b925067e398ade694b3812e1fbbf200

### Proposed decision

```json
{
  "claimId": "claim_10ea7bbf72528b1e6e7796cb8a7dfcd4",
  "sourceUnitDigest": "4c9bd2269fa603bfc37ac40a682248607b925067e398ade694b3812e1fbbf200",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "4c9bd2269fa603bfc37ac40a682248607b925067e398ade694b3812e1fbbf200",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-38 (lines 309–335) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-41 (lines 333–359); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. **Question answered**
   - Architecture answers: "What shape should the system have, and why are the
     boundaries here?"
   - Spec answers: "Given the accepted shape, what behavior/state/interface
     must a reader or implementer observe?"
2. **Primary reader mode**
   - Architecture is read to decide, review, redesign, or understand tradeoffs.
   - Spec is read to implement, verify, maintain, or rebuild current behavior.
3. **Time orientation**
   - Architecture may include direction, constraints, alternatives, proposed
     boundaries, and accepted design.
   - Spec should describe the current accepted/live behavior or explicitly mark
     gaps.
4. **Authority shape**
   - Architecture owns rationale, responsibility boundaries, component shape,
     and design invariants.
   - Spec owns area facts: entry points, data dictionary, behaviors,
     business rules, actors, edge cases, open gaps, and pointers.
5. **Change mode**
   - Architecture can move faster during design churn under `docs/architect/`.
   - Spec should update after decisions settle, through an owning sync workflow,
     so it remains a stable read-first surface.
6. **Proof expectation**
   - Architecture is validated by coherence, ADRs, design review, and proof
     plans.
   - Spec is validated by alignment with implemented behavior, tests, contracts,
     or explicitly named open gaps.
```

### Full target shown text

```text
1. **Question answered**
   - Architecture answers: "What shape should the system have, and why are the
     boundaries here?"
   - Spec answers: "Given the accepted shape, what behavior/state/interface
     must a reader or implementer observe?"
2. **Primary reader mode**
   - Architecture is read to decide, review, redesign, or understand tradeoffs.
   - Spec is read to implement, verify, maintain, or rebuild current behavior.
3. **Time orientation**
   - Architecture may include direction, constraints, alternatives, proposed
     boundaries, and accepted design.
   - Spec should describe the current accepted/live behavior or explicitly mark
     gaps.
4. **Authority shape**
   - Architecture owns rationale, responsibility boundaries, component shape,
     and design invariants.
   - Spec owns area facts: entry points, data dictionary, behaviors,
     business rules, actors, edge cases, open gaps, and pointers.
5. **Change mode**
   - Architecture can move faster during design churn under `docs/architect/`.
   - Spec should update after decisions settle, through an owning sync workflow,
     so it remains a stable read-first surface.
6. **Proof expectation**
   - Architecture is validated by coherence, ADRs, design review, and proof
     plans.
   - Spec is validated by alignment with implemented behavior, tests, contracts,
     or explicitly named open gaps.
```

## claim_546e86b3ecfb410c7e6947400318c818

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-39, lines 337–337.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-42.
Source digest: befd6217aa99d97dcc6768f685f4e37b13e70882689b934dfa31d1957e4b2ef4
Target digest: befd6217aa99d97dcc6768f685f4e37b13e70882689b934dfa31d1957e4b2ef4
Shown source SHA256: befd6217aa99d97dcc6768f685f4e37b13e70882689b934dfa31d1957e4b2ef4
Shown target SHA256: befd6217aa99d97dcc6768f685f4e37b13e70882689b934dfa31d1957e4b2ef4

### Proposed decision

```json
{
  "claimId": "claim_546e86b3ecfb410c7e6947400318c818",
  "sourceUnitDigest": "befd6217aa99d97dcc6768f685f4e37b13e70882689b934dfa31d1957e4b2ef4",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "befd6217aa99d97dcc6768f685f4e37b13e70882689b934dfa31d1957e4b2ef4",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-39 (lines 337–337) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-42 (lines 361–361); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Candidate concise rule:
```

### Full target shown text

```text
Candidate concise rule:
```

## claim_1453869a6f1635280f2189bbd244e41a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-40, lines 339–340.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-43.
Source digest: b2f1d34f49eab46c5363505239fda241157619f0cec511809338282a5d491682
Target digest: b2f1d34f49eab46c5363505239fda241157619f0cec511809338282a5d491682
Shown source SHA256: b2f1d34f49eab46c5363505239fda241157619f0cec511809338282a5d491682
Shown target SHA256: b2f1d34f49eab46c5363505239fda241157619f0cec511809338282a5d491682

### Proposed decision

```json
{
  "claimId": "claim_1453869a6f1635280f2189bbd244e41a",
  "sourceUnitDigest": "b2f1d34f49eab46c5363505239fda241157619f0cec511809338282a5d491682",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "b2f1d34f49eab46c5363505239fda241157619f0cec511809338282a5d491682",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-40 (lines 339–340) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-43 (lines 363–364); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Architecture is the **why/shape/boundary layer**.
- Spec is the **current behavior/state/reference layer**.
```

### Full target shown text

```text
- Architecture is the **why/shape/boundary layer**.
- Spec is the **current behavior/state/reference layer**.
```

## claim_910fc399907245c8a007a8ce56671301

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-41, lines 342–342.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-44.
Source digest: 68379622a727d53aee2a333477f8540a34823eb269009d872a348e304256cddb
Target digest: 68379622a727d53aee2a333477f8540a34823eb269009d872a348e304256cddb
Shown source SHA256: 68379622a727d53aee2a333477f8540a34823eb269009d872a348e304256cddb
Shown target SHA256: 68379622a727d53aee2a333477f8540a34823eb269009d872a348e304256cddb

### Proposed decision

```json
{
  "claimId": "claim_910fc399907245c8a007a8ce56671301",
  "sourceUnitDigest": "68379622a727d53aee2a333477f8540a34823eb269009d872a348e304256cddb",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "68379622a727d53aee2a333477f8540a34823eb269009d872a348e304256cddb",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-41 (lines 342–342) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-44 (lines 366–366); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Potential authority rule:
```

### Full target shown text

```text
Potential authority rule:
```

## claim_9024ae347a7663ccb19da861a574cfc9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-42, lines 344–352.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-45.
Source digest: 12dd24576e9d64f2356aabedec8ea4b71ce1a9a68c15c1e9df10223669a99c4c
Target digest: 12dd24576e9d64f2356aabedec8ea4b71ce1a9a68c15c1e9df10223669a99c4c
Shown source SHA256: 12dd24576e9d64f2356aabedec8ea4b71ce1a9a68c15c1e9df10223669a99c4c
Shown target SHA256: 12dd24576e9d64f2356aabedec8ea4b71ce1a9a68c15c1e9df10223669a99c4c

### Proposed decision

```json
{
  "claimId": "claim_9024ae347a7663ccb19da861a574cfc9",
  "sourceUnitDigest": "12dd24576e9d64f2356aabedec8ea4b71ce1a9a68c15c1e9df10223669a99c4c",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "12dd24576e9d64f2356aabedec8ea4b71ce1a9a68c15c1e9df10223669a99c4c",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-42 (lines 344–352) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-45 (lines 368–376); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- If a question is about component responsibility or accepted design direction,
  start with architecture.
- If a question is about how the system currently behaves, what data means, or
  what an implementer must preserve, start with spec.
- If they disagree, the disagreement is drift; neither silently overwrites the
  other. Use status/provenance:
  - accepted architecture may define the intended correction;
  - current spec may define current implemented behavior;
  - a migration/verification item reconciles them.
```

### Full target shown text

```text
- If a question is about component responsibility or accepted design direction,
  start with architecture.
- If a question is about how the system currently behaves, what data means, or
  what an implementer must preserve, start with spec.
- If they disagree, the disagreement is drift; neither silently overwrites the
  other. Use status/provenance:
  - accepted architecture may define the intended correction;
  - current spec may define current implemented behavior;
  - a migration/verification item reconciles them.
```

## claim_e415dbf9fbe12fd437b6b7d9fa51bcf7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-43, lines 354–359.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-46.
Source digest: fceafc43df7d60365aea89164d68912735906947173f589d21715c380c1a311f
Target digest: fceafc43df7d60365aea89164d68912735906947173f589d21715c380c1a311f
Shown source SHA256: fceafc43df7d60365aea89164d68912735906947173f589d21715c380c1a311f
Shown target SHA256: fceafc43df7d60365aea89164d68912735906947173f589d21715c380c1a311f

### Proposed decision

```json
{
  "claimId": "claim_e415dbf9fbe12fd437b6b7d9fa51bcf7",
  "sourceUnitDigest": "fceafc43df7d60365aea89164d68912735906947173f589d21715c380c1a311f",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "fceafc43df7d60365aea89164d68912735906947173f589d21715c380c1a311f",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-43 (lines 354–359) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-46 (lines 378–383); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Open risk:

- If `spec` becomes a dump for all settled architecture narrative, it will grow
  into unreadable history.
- If `architecture` keeps settled behavior forever, specs become stale and
  agents miss the current source of behavior truth.
```

### Full target shown text

```text
Open risk:

- If `spec` becomes a dump for all settled architecture narrative, it will grow
  into unreadable history.
- If `architecture` keeps settled behavior forever, specs become stale and
  agents miss the current source of behavior truth.
```

## claim_1f232828f15530dcb9d4ce02aa07f65b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-44, lines 361–373.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-47.
Source digest: 6c61d348d3394a64d2a1c31d48c214a3bcb0266ad5ab617cdf3d8c08b4bb24f6
Target digest: 6c61d348d3394a64d2a1c31d48c214a3bcb0266ad5ab617cdf3d8c08b4bb24f6
Shown source SHA256: 6c61d348d3394a64d2a1c31d48c214a3bcb0266ad5ab617cdf3d8c08b4bb24f6
Shown target SHA256: 6c61d348d3394a64d2a1c31d48c214a3bcb0266ad5ab617cdf3d8c08b4bb24f6

### Proposed decision

```json
{
  "claimId": "claim_1f232828f15530dcb9d4ce02aa07f65b",
  "sourceUnitDigest": "6c61d348d3394a64d2a1c31d48c214a3bcb0266ad5ab617cdf3d8c08b4bb24f6",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "6c61d348d3394a64d2a1c31d48c214a3bcb0266ad5ab617cdf3d8c08b4bb24f6",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-44 (lines 361–373) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-47 (lines 385–397); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Settled direction:

- The distinction is accepted, but `spec` and `architecture` should not present
  as two equal top-level truths. That would confuse readers and agents.
- Need a hierarchy where one top-level documentation system explains which door
  to use:
  - `docs/doc-governance.md` owns the taxonomy and route rules;
  - `docs/reading-map.md` tells what to read first;
  - `docs/architect/**` is the design/decision/boundary workspace;
  - `docs/specs/**` is the stable current behavior/state reference layer.
- Open design choice: whether the top-level portal should route by task
  ("understand design", "implement behavior", "verify", "operate") rather than
  by directory name.
```

### Full target shown text

```text
Settled direction:

- The distinction is accepted, but `spec` and `architecture` should not present
  as two equal top-level truths. That would confuse readers and agents.
- Need a hierarchy where one top-level documentation system explains which door
  to use:
  - `docs/doc-governance.md` owns the taxonomy and route rules;
  - `docs/reading-map.md` tells what to read first;
  - `docs/architect/**` is the design/decision/boundary workspace;
  - `docs/specs/**` is the stable current behavior/state reference layer.
- Open design choice: whether the top-level portal should route by task
  ("understand design", "implement behavior", "verify", "operate") rather than
  by directory name.
```

## claim_f68d693176264c9ba8b78d9d35dca63d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-45, lines 375–375.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-48.
Source digest: 0caf7102b546b014723a1fe605a379c7139cfcb2596518ab4319cd488a890aa0
Target digest: 0caf7102b546b014723a1fe605a379c7139cfcb2596518ab4319cd488a890aa0
Shown source SHA256: 0caf7102b546b014723a1fe605a379c7139cfcb2596518ab4319cd488a890aa0
Shown target SHA256: 0caf7102b546b014723a1fe605a379c7139cfcb2596518ab4319cd488a890aa0

### Proposed decision

```json
{
  "claimId": "claim_f68d693176264c9ba8b78d9d35dca63d",
  "sourceUnitDigest": "0caf7102b546b014723a1fe605a379c7139cfcb2596518ab4319cd488a890aa0",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "0caf7102b546b014723a1fe605a379c7139cfcb2596518ab4319cd488a890aa0",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-45 (lines 375–375) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-48 (lines 399–399); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Human navigation objection:
```

### Full target shown text

```text
Human navigation objection:
```

## claim_55b51da671590fd2976bada31f33465b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-46, lines 377–385.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-49.
Source digest: d09ced7deeb50af5e4b1e1a32186fb3a10ed4a57606a442dacf0c79665ddf9ef
Target digest: d09ced7deeb50af5e4b1e1a32186fb3a10ed4a57606a442dacf0c79665ddf9ef
Shown source SHA256: d09ced7deeb50af5e4b1e1a32186fb3a10ed4a57606a442dacf0c79665ddf9ef
Shown target SHA256: d09ced7deeb50af5e4b1e1a32186fb3a10ed4a57606a442dacf0c79665ddf9ef

### Proposed decision

```json
{
  "claimId": "claim_55b51da671590fd2976bada31f33465b",
  "sourceUnitDigest": "d09ced7deeb50af5e4b1e1a32186fb3a10ed4a57606a442dacf0c79665ddf9ef",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "d09ced7deeb50af5e4b1e1a32186fb3a10ed4a57606a442dacf0c79665ddf9ef",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-46 (lines 377–385) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-49 (lines 401–409); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Relying on readers to pass through `doc-governance.md` or `reading-map.md`
  first is not enough.
- Human readers scan spatially: directory names, grouping, and relative
  placement must make the relationship obvious even before governance is read.
- Therefore the final structure must be legible from the tree itself. Governance
  can define the rule, but the folder layout must visually encode it.
- The next design needs an information architecture that makes `architecture`
  and `spec` visibly related without making them look like two unrelated
  top-level truths.
```

### Full target shown text

```text
- Relying on readers to pass through `doc-governance.md` or `reading-map.md`
  first is not enough.
- Human readers scan spatially: directory names, grouping, and relative
  placement must make the relationship obvious even before governance is read.
- Therefore the final structure must be legible from the tree itself. Governance
  can define the rule, but the folder layout must visually encode it.
- The next design needs an information architecture that makes `architecture`
  and `spec` visibly related without making them look like two unrelated
  top-level truths.
```

## claim_7be42e49db5ac085cc645302deebf71f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-47, lines 387–389.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-50.
Source digest: 8babba73eb5485919444b803475ade8f6c7140a134b43e268b2374fa945bf8ff
Target digest: 8babba73eb5485919444b803475ade8f6c7140a134b43e268b2374fa945bf8ff
Shown source SHA256: 8babba73eb5485919444b803475ade8f6c7140a134b43e268b2374fa945bf8ff
Shown target SHA256: 8babba73eb5485919444b803475ade8f6c7140a134b43e268b2374fa945bf8ff

### Proposed decision

```json
{
  "claimId": "claim_7be42e49db5ac085cc645302deebf71f",
  "sourceUnitDigest": "8babba73eb5485919444b803475ade8f6c7140a134b43e268b2374fa945bf8ff",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "8babba73eb5485919444b803475ade8f6c7140a134b43e268b2374fa945bf8ff",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-47 (lines 387–389) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-50 (lines 411–413); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Follow-up question:

> Ngoài `system` sẽ có cái gì?
```

### Full target shown text

```text
Follow-up question:

> Ngoài `system` sẽ có cái gì?
```

## claim_3310197e6bdb8bf121eaff81bb9e3590

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-48, lines 391–420.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-51.
Source digest: 6d77fbce3b4ac63f896ff232dc8ad30dbf7146ef69c8694a9179dbce34edb7c9
Target digest: 6d77fbce3b4ac63f896ff232dc8ad30dbf7146ef69c8694a9179dbce34edb7c9
Shown source SHA256: 6d77fbce3b4ac63f896ff232dc8ad30dbf7146ef69c8694a9179dbce34edb7c9
Shown target SHA256: 6d77fbce3b4ac63f896ff232dc8ad30dbf7146ef69c8694a9179dbce34edb7c9

### Proposed decision

```json
{
  "claimId": "claim_3310197e6bdb8bf121eaff81bb9e3590",
  "sourceUnitDigest": "6d77fbce3b4ac63f896ff232dc8ad30dbf7146ef69c8694a9179dbce34edb7c9",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "6d77fbce3b4ac63f896ff232dc8ad30dbf7146ef69c8694a9179dbce34edb7c9",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-48 (lines 391–420) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-51 (lines 415–444); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Candidate answer:

- `system` should not become the whole `docs/` universe. It should contain the
  documentation needed to understand, change, verify, and operate fgOS itself as
  a system.
- Other top-level spaces should be named by reader intent / artifact nature, so
  a human scanning the tree can tell whether they are reading:
  - stable system truth;
  - user-facing guidance;
  - generated projections;
  - execution evidence;
  - historical/archive material;
  - agent runtime instructions.
- Candidate sibling spaces to discuss:
  - `docs/system/` — maintained system knowledge: areas, architecture, specs,
    contracts, verification, operations, decisions relevant to fgOS internals.
  - `docs/user/` or existing Diataxis-style `docs/how-to`,
    `docs/reference`, `docs/explanation`, `docs/tutorials` — user-facing fgOS
    product documentation.
  - `docs/generated/` or explicit generated subtrees — deterministic
    projections such as registries, indexes, UI spec outputs.
  - `docs/history/` — archive, migrations, retired source material, discussion
    history that is no longer authority.
  - `docs/knowledge/` — retrospective/learning captures, if kept distinct from
    system authority.
  - `plans/` — execution plans and work evidence, likely outside `docs/`
    unless promoted into `docs/system/.../verification`.
  - `domains/` and `.agents/skills/` — agent doctrine/instruction surfaces,
    probably not moved under `docs/` because they are loaded/executed by
    runtime workflows, but must be governed by the documentation taxonomy.
```

### Full target shown text

```text
Candidate answer:

- `system` should not become the whole `docs/` universe. It should contain the
  documentation needed to understand, change, verify, and operate fgOS itself as
  a system.
- Other top-level spaces should be named by reader intent / artifact nature, so
  a human scanning the tree can tell whether they are reading:
  - stable system truth;
  - user-facing guidance;
  - generated projections;
  - execution evidence;
  - historical/archive material;
  - agent runtime instructions.
- Candidate sibling spaces to discuss:
  - `docs/system/` — maintained system knowledge: areas, architecture, specs,
    contracts, verification, operations, decisions relevant to fgOS internals.
  - `docs/user/` or existing Diataxis-style `docs/how-to`,
    `docs/reference`, `docs/explanation`, `docs/tutorials` — user-facing fgOS
    product documentation.
  - `docs/generated/` or explicit generated subtrees — deterministic
    projections such as registries, indexes, UI spec outputs.
  - `docs/history/` — archive, migrations, retired source material, discussion
    history that is no longer authority.
  - `docs/knowledge/` — retrospective/learning captures, if kept distinct from
    system authority.
  - `plans/` — execution plans and work evidence, likely outside `docs/`
    unless promoted into `docs/system/.../verification`.
  - `domains/` and `.agents/skills/` — agent doctrine/instruction surfaces,
    probably not moved under `docs/` because they are loaded/executed by
    runtime workflows, but must be governed by the documentation taxonomy.
```

## claim_7d81e1c559b866bef63a156ef78a8fde

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-49, lines 422–428.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-52.
Source digest: 9a8c4857b305a833e3d933b62c1df7403f743131c39acd20427537450c134474
Target digest: 9a8c4857b305a833e3d933b62c1df7403f743131c39acd20427537450c134474
Shown source SHA256: 9a8c4857b305a833e3d933b62c1df7403f743131c39acd20427537450c134474
Shown target SHA256: 9a8c4857b305a833e3d933b62c1df7403f743131c39acd20427537450c134474

### Proposed decision

```json
{
  "claimId": "claim_7d81e1c559b866bef63a156ef78a8fde",
  "sourceUnitDigest": "9a8c4857b305a833e3d933b62c1df7403f743131c39acd20427537450c134474",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "9a8c4857b305a833e3d933b62c1df7403f743131c39acd20427537450c134474",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-49 (lines 422–428) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-52 (lines 446–452); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Open design tension:

- A clean human tree wants fewer roots.
- Runtime/generated surfaces sometimes need to stay where tools already expect
  them.
- Therefore the governance may need to distinguish "documentation space" from
  "physical source path": some governed artifacts live outside `docs/`.
```

### Full target shown text

```text
Open design tension:

- A clean human tree wants fewer roots.
- Runtime/generated surfaces sometimes need to stay where tools already expect
  them.
- Therefore the governance may need to distinguish "documentation space" from
  "physical source path": some governed artifacts live outside `docs/`.
```

## claim_9530e15e364b0b5f54158a3f88a0c159

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-50, lines 430–432.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-53.
Source digest: 11e21313bddc05d0e6bfbc92d5d4b8b1a0eec908f46fa390e8dbcd49a2e1af51
Target digest: 11e21313bddc05d0e6bfbc92d5d4b8b1a0eec908f46fa390e8dbcd49a2e1af51
Shown source SHA256: 11e21313bddc05d0e6bfbc92d5d4b8b1a0eec908f46fa390e8dbcd49a2e1af51
Shown target SHA256: 11e21313bddc05d0e6bfbc92d5d4b8b1a0eec908f46fa390e8dbcd49a2e1af51

### Proposed decision

```json
{
  "claimId": "claim_9530e15e364b0b5f54158a3f88a0c159",
  "sourceUnitDigest": "11e21313bddc05d0e6bfbc92d5d4b8b1a0eec908f46fa390e8dbcd49a2e1af51",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "11e21313bddc05d0e6bfbc92d5d4b8b1a0eec908f46fa390e8dbcd49a2e1af51",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-50 (lines 430–432) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-53 (lines 454–456); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Follow-up question:

> Có tên nào khác phù hợp hơn `system`?
```

### Full target shown text

```text
Follow-up question:

> Có tên nào khác phù hợp hơn `system`?
```

## claim_95d055f27f00c4cb699d30388f853c43

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-51, lines 434–446.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-54.
Source digest: 804a6f426b44d58eaeafaf3e7e5f27e45772859347fb9b82917a8865e358e9c3
Target digest: 804a6f426b44d58eaeafaf3e7e5f27e45772859347fb9b82917a8865e358e9c3
Shown source SHA256: 804a6f426b44d58eaeafaf3e7e5f27e45772859347fb9b82917a8865e358e9c3
Shown target SHA256: 804a6f426b44d58eaeafaf3e7e5f27e45772859347fb9b82917a8865e358e9c3

### Proposed decision

```json
{
  "claimId": "claim_95d055f27f00c4cb699d30388f853c43",
  "sourceUnitDigest": "804a6f426b44d58eaeafaf3e7e5f27e45772859347fb9b82917a8865e358e9c3",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "804a6f426b44d58eaeafaf3e7e5f27e45772859347fb9b82917a8865e358e9c3",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-51 (lines 434–446) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-54 (lines 458–470); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Candidate root names:

| Name | Strength | Risk |
|---|---|---|
| `system` | Plain, broad, matches "system design"; can contain both spec and architecture without privileging either | May sound too generic; could be confused with OS/runtime system only |
| `product` | Emphasizes fgOS as a product used by others, not only internal architecture | Specs/architecture/contracts may sound less naturally placed under it |
| `platform` | Strong fit for fgOS as a platform layer; concrete and mission-aligned | Could blur with product marketing/user docs; not every internal area feels "platform" |
| `core` | Short, signals internals | Too narrow; may imply only core package, not distribution/skills/operations |
| `design` | Directly names architecture/design intent | Makes specs feel secondary again; risks recreating `architect` under a new name |
| `engineering` | Signals implementation-facing maintained knowledge | Too team/process-oriented; less friendly to product/BA/state specs |
| `internals` | Clear distinction from user docs | Sounds like code internals, not product/system behavior; less inviting |
| `foundation` | Resonates with platform foundations and durable laws | Abstract; may be unclear as a navigation root |
| `operating-model` | Good for workflows/agent operations | Too narrow for specs/contracts/architecture |
```

### Full target shown text

```text
Candidate root names:

| Name | Strength | Risk |
|---|---|---|
| `system` | Plain, broad, matches "system design"; can contain both spec and architecture without privileging either | May sound too generic; could be confused with OS/runtime system only |
| `product` | Emphasizes fgOS as a product used by others, not only internal architecture | Specs/architecture/contracts may sound less naturally placed under it |
| `platform` | Strong fit for fgOS as a platform layer; concrete and mission-aligned | Could blur with product marketing/user docs; not every internal area feels "platform" |
| `core` | Short, signals internals | Too narrow; may imply only core package, not distribution/skills/operations |
| `design` | Directly names architecture/design intent | Makes specs feel secondary again; risks recreating `architect` under a new name |
| `engineering` | Signals implementation-facing maintained knowledge | Too team/process-oriented; less friendly to product/BA/state specs |
| `internals` | Clear distinction from user docs | Sounds like code internals, not product/system behavior; less inviting |
| `foundation` | Resonates with platform foundations and durable laws | Abstract; may be unclear as a navigation root |
| `operating-model` | Good for workflows/agent operations | Too narrow for specs/contracts/architecture |
```

## claim_ff908ea321a6a78bd6f9270438129229

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-52, lines 448–456.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-55.
Source digest: 79e1dbb79ed294eaba5e0c28cd506ead91e3d8d2e604cb24906f61829f63dc0a
Target digest: 79e1dbb79ed294eaba5e0c28cd506ead91e3d8d2e604cb24906f61829f63dc0a
Shown source SHA256: 79e1dbb79ed294eaba5e0c28cd506ead91e3d8d2e604cb24906f61829f63dc0a
Shown target SHA256: 79e1dbb79ed294eaba5e0c28cd506ead91e3d8d2e604cb24906f61829f63dc0a

### Proposed decision

```json
{
  "claimId": "claim_ff908ea321a6a78bd6f9270438129229",
  "sourceUnitDigest": "79e1dbb79ed294eaba5e0c28cd506ead91e3d8d2e604cb24906f61829f63dc0a",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "79e1dbb79ed294eaba5e0c28cd506ead91e3d8d2e604cb24906f61829f63dc0a",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-52 (lines 448–456) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-55 (lines 472–480); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Current leaning:

- `platform` may be the most fgOS-specific name.
- `system` may be the clearest general name.
- `design` is not preferred because it makes `spec` feel like a guest under a
  design/architecture umbrella.
- If the root must contain `spec`, `architecture`, `contracts`,
  `verification`, and `operations` as peers under each area, the name should not
  imply only design narrative.
```

### Full target shown text

```text
Current leaning:

- `platform` may be the most fgOS-specific name.
- `system` may be the clearest general name.
- `design` is not preferred because it makes `spec` feel like a guest under a
  design/architecture umbrella.
- If the root must contain `spec`, `architecture`, `contracts`,
  `verification`, and `operations` as peers under each area, the name should not
  imply only design narrative.
```

## claim_7088a6b10c5164f1c75a93638e344380

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-53, lines 458–460.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-56.
Source digest: 3edd06d0383eec147f347633083b718da32fba47522773c77b8de4cab8b5840d
Target digest: 3edd06d0383eec147f347633083b718da32fba47522773c77b8de4cab8b5840d
Shown source SHA256: 3edd06d0383eec147f347633083b718da32fba47522773c77b8de4cab8b5840d
Shown target SHA256: 3edd06d0383eec147f347633083b718da32fba47522773c77b8de4cab8b5840d

### Proposed decision

```json
{
  "claimId": "claim_7088a6b10c5164f1c75a93638e344380",
  "sourceUnitDigest": "3edd06d0383eec147f347633083b718da32fba47522773c77b8de4cab8b5840d",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "3edd06d0383eec147f347633083b718da32fba47522773c77b8de4cab8b5840d",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-53 (lines 458–460) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-56 (lines 482–484); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Follow-up question:

> Có cần thêm `areas/` không, hay dùng trực tiếp `<area>` dưới root?
```

### Full target shown text

```text
Follow-up question:

> Có cần thêm `areas/` không, hay dùng trực tiếp `<area>` dưới root?
```

## claim_4c6fb2150d66dc3c1b9fbf27a5e4b8ae

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-54, lines 462–471.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-57.
Source digest: d428ed172dc618945c0859ba10ae7947233fc0bc62f98221ddc8a23e96c702e0
Target digest: d428ed172dc618945c0859ba10ae7947233fc0bc62f98221ddc8a23e96c702e0
Shown source SHA256: d428ed172dc618945c0859ba10ae7947233fc0bc62f98221ddc8a23e96c702e0
Shown target SHA256: d428ed172dc618945c0859ba10ae7947233fc0bc62f98221ddc8a23e96c702e0

### Proposed decision

```json
{
  "claimId": "claim_4c6fb2150d66dc3c1b9fbf27a5e4b8ae",
  "sourceUnitDigest": "d428ed172dc618945c0859ba10ae7947233fc0bc62f98221ddc8a23e96c702e0",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "d428ed172dc618945c0859ba10ae7947233fc0bc62f98221ddc8a23e96c702e0",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-54 (lines 462–471) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-57 (lines 486–495); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Candidate shapes:

```txt
docs/platform/
  areas/
    runner/
    distribution/
  shared/
  README.md
```
````

### Full target shown text

````text
Candidate shapes:

```txt
docs/platform/
  areas/
    runner/
    distribution/
  shared/
  README.md
```
````

## claim_06118f5fd6b6e2f5054dbaad4340f7b7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-55, lines 473–481.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-58.
Source digest: f1070d133eaee3766bfed589f9c22301a60060f7d368425d03dedae579833964
Target digest: f1070d133eaee3766bfed589f9c22301a60060f7d368425d03dedae579833964
Shown source SHA256: f1070d133eaee3766bfed589f9c22301a60060f7d368425d03dedae579833964
Shown target SHA256: f1070d133eaee3766bfed589f9c22301a60060f7d368425d03dedae579833964

### Proposed decision

```json
{
  "claimId": "claim_06118f5fd6b6e2f5054dbaad4340f7b7",
  "sourceUnitDigest": "f1070d133eaee3766bfed589f9c22301a60060f7d368425d03dedae579833964",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "f1070d133eaee3766bfed589f9c22301a60060f7d368425d03dedae579833964",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-55 (lines 473–481) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-58 (lines 497–505); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
versus:

```txt
docs/platform/
  runner/
  distribution/
  shared/
  README.md
```
````

### Full target shown text

````text
versus:

```txt
docs/platform/
  runner/
  distribution/
  shared/
  README.md
```
````

## claim_a3ca9164aaf1ef730201e011f65309a6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-56, lines 483–492.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-59.
Source digest: eee0fba0b7cc1cce89ec03fec92ef6150250bd11a4ec963a68a43b4f0de72cdb
Target digest: eee0fba0b7cc1cce89ec03fec92ef6150250bd11a4ec963a68a43b4f0de72cdb
Shown source SHA256: eee0fba0b7cc1cce89ec03fec92ef6150250bd11a4ec963a68a43b4f0de72cdb
Shown target SHA256: eee0fba0b7cc1cce89ec03fec92ef6150250bd11a4ec963a68a43b4f0de72cdb

### Proposed decision

```json
{
  "claimId": "claim_a3ca9164aaf1ef730201e011f65309a6",
  "sourceUnitDigest": "eee0fba0b7cc1cce89ec03fec92ef6150250bd11a4ec963a68a43b4f0de72cdb",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "eee0fba0b7cc1cce89ec03fec92ef6150250bd11a4ec963a68a43b4f0de72cdb",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-56 (lines 483–492) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-59 (lines 507–516); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Trade-off:

- Keeping `areas/` makes it explicit that `runner`, `distribution`, etc. are
  system/product areas, while other root children such as `shared/`,
  `governance/`, `generated/`, or `README.md` are not areas.
- Removing `areas/` makes the tree shorter and more direct for human scanning.
- If the root is dedicated only to maintained platform/system docs, direct
  `<area>` folders may be clear enough.
- If the root also contains many non-area support folders, `areas/` prevents
  mixing first-class areas with meta/support material.
```

### Full target shown text

```text
Trade-off:

- Keeping `areas/` makes it explicit that `runner`, `distribution`, etc. are
  system/product areas, while other root children such as `shared/`,
  `governance/`, `generated/`, or `README.md` are not areas.
- Removing `areas/` makes the tree shorter and more direct for human scanning.
- If the root is dedicated only to maintained platform/system docs, direct
  `<area>` folders may be clear enough.
- If the root also contains many non-area support folders, `areas/` prevents
  mixing first-class areas with meta/support material.
```

## claim_17dee686cea375cdadfec42b2a622d4b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-57, lines 494–496.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-60.
Source digest: 675a662c74bfb2572e009a84dad5943070ef6461638a656ac321a43c8709b4b8
Target digest: 675a662c74bfb2572e009a84dad5943070ef6461638a656ac321a43c8709b4b8
Shown source SHA256: 675a662c74bfb2572e009a84dad5943070ef6461638a656ac321a43c8709b4b8
Shown target SHA256: 675a662c74bfb2572e009a84dad5943070ef6461638a656ac321a43c8709b4b8

### Proposed decision

```json
{
  "claimId": "claim_17dee686cea375cdadfec42b2a622d4b",
  "sourceUnitDigest": "675a662c74bfb2572e009a84dad5943070ef6461638a656ac321a43c8709b4b8",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "675a662c74bfb2572e009a84dad5943070ef6461638a656ac321a43c8709b4b8",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-57 (lines 494–496) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-60 (lines 518–520); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Current leaning:

- Prefer direct `<area>` folders if the root can stay clean and dedicated:
```

### Full target shown text

```text
Current leaning:

- Prefer direct `<area>` folders if the root can stay clean and dedicated:
```

## claim_8e9efdcb37c9d1ac0e4a3a8c138fb2c3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-58, lines 498–504.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-61.
Source digest: 524b839e101f3bc77a3c8dac7e8a5faa3eea20604905aff253baccde00700d60
Target digest: 524b839e101f3bc77a3c8dac7e8a5faa3eea20604905aff253baccde00700d60
Shown source SHA256: 524b839e101f3bc77a3c8dac7e8a5faa3eea20604905aff253baccde00700d60
Shown target SHA256: 524b839e101f3bc77a3c8dac7e8a5faa3eea20604905aff253baccde00700d60

### Proposed decision

```json
{
  "claimId": "claim_8e9efdcb37c9d1ac0e4a3a8c138fb2c3",
  "sourceUnitDigest": "524b839e101f3bc77a3c8dac7e8a5faa3eea20604905aff253baccde00700d60",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-61",
  "targetUnitDigest": "524b839e101f3bc77a3c8dac7e8a5faa3eea20604905aff253baccde00700d60",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-58 (lines 498–504) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-61 (lines 522–528); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
  docs/platform/
    runner/
    distribution/
    work-state/
    shared/
  ```
````

### Full target shown text

````text
```txt
  docs/platform/
    runner/
    distribution/
    work-state/
    shared/
  ```
````

## claim_6331c2e5afe92ee7ca7c9b96f50ad7cf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-59, lines 506–506.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-62.
Source digest: 10b822af08233bd123000a585eff1303543c6d247853506c074f013eb231f88e
Target digest: 10b822af08233bd123000a585eff1303543c6d247853506c074f013eb231f88e
Shown source SHA256: 10b822af08233bd123000a585eff1303543c6d247853506c074f013eb231f88e
Shown target SHA256: 10b822af08233bd123000a585eff1303543c6d247853506c074f013eb231f88e

### Proposed decision

```json
{
  "claimId": "claim_6331c2e5afe92ee7ca7c9b96f50ad7cf",
  "sourceUnitDigest": "10b822af08233bd123000a585eff1303543c6d247853506c074f013eb231f88e",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-62",
  "targetUnitDigest": "10b822af08233bd123000a585eff1303543c6d247853506c074f013eb231f88e",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-59 (lines 506–506) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-62 (lines 530–530); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Use `areas/` only if the root becomes crowded with many non-area siblings.
```

### Full target shown text

```text
- Use `areas/` only if the root becomes crowded with many non-area siblings.
```

## claim_669bb561731dd50a2b1c684ca2f77419

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-60, lines 508–508.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-63.
Source digest: 9b7a1d67a12dac8aa5fe2e08d73635ad5b4b8037310a18f531e4e2b392352066
Target digest: 9b7a1d67a12dac8aa5fe2e08d73635ad5b4b8037310a18f531e4e2b392352066
Shown source SHA256: 9b7a1d67a12dac8aa5fe2e08d73635ad5b4b8037310a18f531e4e2b392352066
Shown target SHA256: 9b7a1d67a12dac8aa5fe2e08d73635ad5b4b8037310a18f531e4e2b392352066

### Proposed decision

```json
{
  "claimId": "claim_669bb561731dd50a2b1c684ca2f77419",
  "sourceUnitDigest": "9b7a1d67a12dac8aa5fe2e08d73635ad5b4b8037310a18f531e4e2b392352066",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-63",
  "targetUnitDigest": "9b7a1d67a12dac8aa5fe2e08d73635ad5b4b8037310a18f531e4e2b392352066",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-60 (lines 508–508) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-63 (lines 532–532); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Settled direction for now:
```

### Full target shown text

```text
Settled direction for now:
```

## claim_52e129699322a94c189abe3cc6abc967

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-61, lines 510–511.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-64.
Source digest: 5582fb4049409ae56f637196cc5174947e308339e3987baadb4ef97728bdc240
Target digest: 5582fb4049409ae56f637196cc5174947e308339e3987baadb4ef97728bdc240
Shown source SHA256: 5582fb4049409ae56f637196cc5174947e308339e3987baadb4ef97728bdc240
Shown target SHA256: 5582fb4049409ae56f637196cc5174947e308339e3987baadb4ef97728bdc240

### Proposed decision

```json
{
  "claimId": "claim_52e129699322a94c189abe3cc6abc967",
  "sourceUnitDigest": "5582fb4049409ae56f637196cc5174947e308339e3987baadb4ef97728bdc240",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-64",
  "targetUnitDigest": "5582fb4049409ae56f637196cc5174947e308339e3987baadb4ef97728bdc240",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-61 (lines 510–511) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-64 (lines 534–535); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Do not add an `areas/` layer initially.
- Use direct area folders under the maintained platform/system root:
```

### Full target shown text

```text
- Do not add an `areas/` layer initially.
- Use direct area folders under the maintained platform/system root:
```

## claim_0154a4d678a0603ff950eb12246ad3b2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-62, lines 513–515.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-65.
Source digest: c67cf473aa520f921da608ecea063746171dcb259c4feeba3f9984eebe7b5297
Target digest: c67cf473aa520f921da608ecea063746171dcb259c4feeba3f9984eebe7b5297
Shown source SHA256: c67cf473aa520f921da608ecea063746171dcb259c4feeba3f9984eebe7b5297
Shown target SHA256: c67cf473aa520f921da608ecea063746171dcb259c4feeba3f9984eebe7b5297

### Proposed decision

```json
{
  "claimId": "claim_0154a4d678a0603ff950eb12246ad3b2",
  "sourceUnitDigest": "c67cf473aa520f921da608ecea063746171dcb259c4feeba3f9984eebe7b5297",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-65",
  "targetUnitDigest": "c67cf473aa520f921da608ecea063746171dcb259c4feeba3f9984eebe7b5297",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: target digest repeats; source unit shorter than 40 characters. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-62 (lines 513–515) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-65 (lines 537–539); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
  docs/platform/<area>/
  ```
````

### Full target shown text

````text
```txt
  docs/platform/<area>/
  ```
````

## claim_9060f4434dfd11f7be6aede28c3c64dc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-discussion.md#unheaded-block-63, lines 517–520.
Target: docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-66.
Source digest: 04444865df6c8eb54e7b5f5dd6461edc4e48a902a57293208f1d8f338637a56b
Target digest: 04444865df6c8eb54e7b5f5dd6461edc4e48a902a57293208f1d8f338637a56b
Shown source SHA256: 04444865df6c8eb54e7b5f5dd6461edc4e48a902a57293208f1d8f338637a56b
Shown target SHA256: 04444865df6c8eb54e7b5f5dd6461edc4e48a902a57293208f1d8f338637a56b

### Proposed decision

```json
{
  "claimId": "claim_9060f4434dfd11f7be6aede28c3c64dc",
  "sourceUnitDigest": "04444865df6c8eb54e7b5f5dd6461edc4e48a902a57293208f1d8f338637a56b",
  "targetOwner": "docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md",
  "targetAnchor": "unheaded-block-66",
  "targetUnitDigest": "04444865df6c8eb54e7b5f5dd6461edc4e48a902a57293208f1d8f338637a56b",
  "targetAncestry": [
    "Documentation System Discussion",
    "Discussion Log",
    "2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the discussion as provenance, not deletion; open ideas remain literally available. The map proposal target is overridden by a documentation history carrier. Evidence: Source lines 10–19 calls itself temporary, disposable, and no design authority. docs/architect/documentation-system-design.md:19–23 and docs/doc-governance.md:9,475 carry its settled result. Required-root scan finds only ratchet bookkeeping, not a live consumer. Complete source unheaded-block docs/architect/documentation-system-discussion.md#unheaded-block-63 (lines 517–520) is carried at docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md#unheaded-block-66 (lines 541–544); Q3 per-file map override: docs/platform/proposals/documentation-system-discussion.md → docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md. Archival triage uses legal move-to-history representation for the maintained-authority source (A15/A16 precedent), with no file-class or vocabulary change. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- This keeps spatial navigation short and makes the area the first visible
  organizing unit for human readers.
- `areas/` remains an escape hatch only if `docs/platform/` later becomes too
  crowded with non-area support folders.
```

### Full target shown text

```text
- This keeps spatial navigation short and makes the area the first visible
  organizing unit for human readers.
- `areas/` remains an escape hatch only if `docs/platform/` later becomes too
  crowded with non-area support folders.
```
