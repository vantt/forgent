# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-02-documentation-system-design.json
Original shard SHA256: ea7cb09e88b4de9c1c0f671e8890fe748b7fb0a6e34be752c4cab6a50f8c6307
Source file: docs/architect/documentation-system-design.md
Part 1/2; entries: **80**. Source-file group 2/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (1): `claim_c015fd82d6f1a32273bff77ec8b4299c`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 22; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_c015fd82d6f1a32273bff77ec8b4299c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/documentation-system-design.md#documentation-system-design, lines 1–1.
Target: docs/platform/documentation/architecture/documentation-system-design.md#documentation-system-design.
Source digest: 68df3b836c2275f542f163a0d65d2439a21f0bde57b0fd1ef88d4ce3a6f69c36
Target digest: 70a02fca3bf1139d4184cea11e561982fd6536e0f124e8318d32c62116eb3f96
Shown source SHA256: 00b0808a322a25d5bbc8a839416412e1e611abdb139eaa6d750a95d17b74917d
Shown target SHA256: 2c67ad8b0d04a76c2ef4a6bf2587b004c0cc91ae12a20d8054b65332915a25e3

### Proposed decision

```json
{
  "claimId": "claim_c015fd82d6f1a32273bff77ec8b4299c",
  "sourceUnitDigest": "68df3b836c2275f542f163a0d65d2439a21f0bde57b0fd1ef88d4ce3a6f69c36",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "documentation-system-design",
  "targetUnitDigest": "70a02fca3bf1139d4184cea11e561982fd6536e0f124e8318d32c62116eb3f96",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#documentation-system-design (lines 1–1) is carried at docs/platform/documentation/architecture/documentation-system-design.md#documentation-system-design (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
# Documentation System Design

```txt
Document type: Architecture design
Audience: Human reviewer, architect, maintainer, agent
Purpose: Propose the whole-system documentation model for fgOS
Design status: Accepted
Implementation: Partially promoted
Provenance: Human + agent coauthor, synthesized from discussion and panel review
Writer type: Human + agent coauthor
Canonical for: source design behind the promoted documentation governance
Use this when: Reviewing the rationale behind the documentation-system governance
Do not use this for: Migration execution details
Last reviewed: 2026-09-13
Related:
- `docs/architect/documentation-system-discussion.md`
```

This document is the source design for the fgOS documentation system. Its first
settled slice has been promoted into `docs/doc-governance.md`,
`docs/reading-map.md`, `docs/README.md`, `docs/platform/README.md`, and
`docs/templates/**`. Use the promoted files for day-to-day documentation
governance; use this design for rationale and future refinement.
````

### Full target shown text

````text
# Documentation System Design

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/documentation-system-design.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob cbb634aa4c221da02bd34e41cb234abb70dfaa9b
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/documentation-system-design.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Keep the mapped architecture rationale, not a new governance authority. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../../architect/documentation-system-design.md).


```txt
Document type: Architecture design
Audience: Human reviewer, architect, maintainer, agent
Purpose: Propose the whole-system documentation model for fgOS
Design status: Accepted
Implementation: Partially promoted
Provenance: Human + agent coauthor, synthesized from discussion and panel review
Writer type: Human + agent coauthor
Canonical for: source design behind the promoted documentation governance
Use this when: Reviewing the rationale behind the documentation-system governance
Do not use this for: Migration execution details
Last reviewed: 2026-09-13
Related:
- `docs/architect/documentation-system-discussion.md`
```

This document is the source design for the fgOS documentation system. Its first
settled slice has been promoted into `docs/doc-governance.md`,
`docs/reading-map.md`, `docs/README.md`, `docs/platform/README.md`, and
`docs/templates/**`. Use the promoted files for day-to-day documentation
governance; use this design for rationale and future refinement.
````

## claim_b446fcc10393e105f0df249a7e278850

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-1, lines 3–17.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-4.
Source digest: f0c471b0c6ffef060ec47aff61ac80bb162d658d7c02b467ea7418d940718e66
Target digest: f0c471b0c6ffef060ec47aff61ac80bb162d658d7c02b467ea7418d940718e66
Shown source SHA256: f0c471b0c6ffef060ec47aff61ac80bb162d658d7c02b467ea7418d940718e66
Shown target SHA256: f0c471b0c6ffef060ec47aff61ac80bb162d658d7c02b467ea7418d940718e66

### Proposed decision

```json
{
  "claimId": "claim_b446fcc10393e105f0df249a7e278850",
  "sourceUnitDigest": "f0c471b0c6ffef060ec47aff61ac80bb162d658d7c02b467ea7418d940718e66",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "f0c471b0c6ffef060ec47aff61ac80bb162d658d7c02b467ea7418d940718e66",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-1 (lines 3–17) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-4 (lines 27–41); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
Document type: Architecture design
Audience: Human reviewer, architect, maintainer, agent
Purpose: Propose the whole-system documentation model for fgOS
Design status: Accepted
Implementation: Partially promoted
Provenance: Human + agent coauthor, synthesized from discussion and panel review
Writer type: Human + agent coauthor
Canonical for: source design behind the promoted documentation governance
Use this when: Reviewing the rationale behind the documentation-system governance
Do not use this for: Migration execution details
Last reviewed: 2026-09-13
Related:
- `docs/architect/documentation-system-discussion.md`
```
````

### Full target shown text

````text
```txt
Document type: Architecture design
Audience: Human reviewer, architect, maintainer, agent
Purpose: Propose the whole-system documentation model for fgOS
Design status: Accepted
Implementation: Partially promoted
Provenance: Human + agent coauthor, synthesized from discussion and panel review
Writer type: Human + agent coauthor
Canonical for: source design behind the promoted documentation governance
Use this when: Reviewing the rationale behind the documentation-system governance
Do not use this for: Migration execution details
Last reviewed: 2026-09-13
Related:
- `docs/architect/documentation-system-discussion.md`
```
````

## claim_947205c6591127361dba8d41bb6dc56c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-2, lines 19–23.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-5.
Source digest: 5ccbc8d338a3e1155de6391262094273824c7b267927bce46d8b713e789bf15f
Target digest: 5ccbc8d338a3e1155de6391262094273824c7b267927bce46d8b713e789bf15f
Shown source SHA256: 5ccbc8d338a3e1155de6391262094273824c7b267927bce46d8b713e789bf15f
Shown target SHA256: 5ccbc8d338a3e1155de6391262094273824c7b267927bce46d8b713e789bf15f

### Proposed decision

```json
{
  "claimId": "claim_947205c6591127361dba8d41bb6dc56c",
  "sourceUnitDigest": "5ccbc8d338a3e1155de6391262094273824c7b267927bce46d8b713e789bf15f",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "5ccbc8d338a3e1155de6391262094273824c7b267927bce46d8b713e789bf15f",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-2 (lines 19–23) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-5 (lines 43–47); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This document is the source design for the fgOS documentation system. Its first
settled slice has been promoted into `docs/doc-governance.md`,
`docs/reading-map.md`, `docs/README.md`, `docs/platform/README.md`, and
`docs/templates/**`. Use the promoted files for day-to-day documentation
governance; use this design for rationale and future refinement.
```

### Full target shown text

```text
This document is the source design for the fgOS documentation system. Its first
settled slice has been promoted into `docs/doc-governance.md`,
`docs/reading-map.md`, `docs/README.md`, `docs/platform/README.md`, and
`docs/templates/**`. Use the promoted files for day-to-day documentation
governance; use this design for rationale and future refinement.
```

## claim_2ba6ffde58ced119647ca17c0c0fe518

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#1-goal, lines 25–25.
Target: docs/platform/documentation/architecture/documentation-system-design.md#1-goal.
Source digest: 27d2df98c18321d1aed47577ca8a28f989b1453759d11ca745a4ec56f6afd117
Target digest: 27d2df98c18321d1aed47577ca8a28f989b1453759d11ca745a4ec56f6afd117
Shown source SHA256: 99a4f1abd7fa023c2b9a0c3f9a7ed241b22b513eb6f0c78b03161a1921ebc5dd
Shown target SHA256: 99a4f1abd7fa023c2b9a0c3f9a7ed241b22b513eb6f0c78b03161a1921ebc5dd

### Proposed decision

```json
{
  "claimId": "claim_2ba6ffde58ced119647ca17c0c0fe518",
  "sourceUnitDigest": "27d2df98c18321d1aed47577ca8a28f989b1453759d11ca745a4ec56f6afd117",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "1-goal",
  "targetUnitDigest": "27d2df98c18321d1aed47577ca8a28f989b1453759d11ca745a4ec56f6afd117",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#1-goal (lines 25–25) is carried at docs/platform/documentation/architecture/documentation-system-design.md#1-goal (lines 49–49); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 1. Goal

fgOS needs a documentation system that is complete without becoming heavy,
simple without becoming shallow, and clear enough that both humans and agents
can use it safely.

The documentation system must support three jobs:

1. Help humans understand the system.
2. Help humans and agents shape, review, challenge, and approve architecture.
3. Help agents route, implement, verify, and leave durable knowledge behind.

The critical quality bar is human presence. If the docs are optimized for agent
execution but a human cannot scan, understand, challenge, and approve decisions,
the documentation system is failing.
```

### Full target shown text

```text
## 1. Goal

fgOS needs a documentation system that is complete without becoming heavy,
simple without becoming shallow, and clear enough that both humans and agents
can use it safely.

The documentation system must support three jobs:

1. Help humans understand the system.
2. Help humans and agents shape, review, challenge, and approve architecture.
3. Help agents route, implement, verify, and leave durable knowledge behind.

The critical quality bar is human presence. If the docs are optimized for agent
execution but a human cannot scan, understand, challenge, and approve decisions,
the documentation system is failing.
```

## claim_4656768b8b4ab0533fbc6a265e928bff

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-3, lines 27–29.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-6.
Source digest: ea17cf4786b9795351bde0d134fd7bcbc5a5aa0ba5c9b518b0c64b7025c6cbfc
Target digest: ea17cf4786b9795351bde0d134fd7bcbc5a5aa0ba5c9b518b0c64b7025c6cbfc
Shown source SHA256: ea17cf4786b9795351bde0d134fd7bcbc5a5aa0ba5c9b518b0c64b7025c6cbfc
Shown target SHA256: ea17cf4786b9795351bde0d134fd7bcbc5a5aa0ba5c9b518b0c64b7025c6cbfc

### Proposed decision

```json
{
  "claimId": "claim_4656768b8b4ab0533fbc6a265e928bff",
  "sourceUnitDigest": "ea17cf4786b9795351bde0d134fd7bcbc5a5aa0ba5c9b518b0c64b7025c6cbfc",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "ea17cf4786b9795351bde0d134fd7bcbc5a5aa0ba5c9b518b0c64b7025c6cbfc",
  "targetAncestry": [
    "Documentation System Design",
    "1. Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-3 (lines 27–29) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-6 (lines 51–53); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
fgOS needs a documentation system that is complete without becoming heavy,
simple without becoming shallow, and clear enough that both humans and agents
can use it safely.
```

### Full target shown text

```text
fgOS needs a documentation system that is complete without becoming heavy,
simple without becoming shallow, and clear enough that both humans and agents
can use it safely.
```

## claim_488f21ec4abc43eb3fffd6f925c9d99c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-4, lines 31–31.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-7.
Source digest: b35759acb28345a0de4f34dd6ca897349da1b6425c53240a634bd434a210b4dd
Target digest: b35759acb28345a0de4f34dd6ca897349da1b6425c53240a634bd434a210b4dd
Shown source SHA256: b35759acb28345a0de4f34dd6ca897349da1b6425c53240a634bd434a210b4dd
Shown target SHA256: b35759acb28345a0de4f34dd6ca897349da1b6425c53240a634bd434a210b4dd

### Proposed decision

```json
{
  "claimId": "claim_488f21ec4abc43eb3fffd6f925c9d99c",
  "sourceUnitDigest": "b35759acb28345a0de4f34dd6ca897349da1b6425c53240a634bd434a210b4dd",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "b35759acb28345a0de4f34dd6ca897349da1b6425c53240a634bd434a210b4dd",
  "targetAncestry": [
    "Documentation System Design",
    "1. Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-4 (lines 31–31) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-7 (lines 55–55); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The documentation system must support three jobs:
```

### Full target shown text

```text
The documentation system must support three jobs:
```

## claim_dfe3ddfdfaa28514e33254f72a9197c8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-5, lines 33–35.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-8.
Source digest: 6609c21304cabd495f636225eb7d0de0e1f961c90d7507eda050a141fef0b202
Target digest: 6609c21304cabd495f636225eb7d0de0e1f961c90d7507eda050a141fef0b202
Shown source SHA256: 6609c21304cabd495f636225eb7d0de0e1f961c90d7507eda050a141fef0b202
Shown target SHA256: 6609c21304cabd495f636225eb7d0de0e1f961c90d7507eda050a141fef0b202

### Proposed decision

```json
{
  "claimId": "claim_dfe3ddfdfaa28514e33254f72a9197c8",
  "sourceUnitDigest": "6609c21304cabd495f636225eb7d0de0e1f961c90d7507eda050a141fef0b202",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "6609c21304cabd495f636225eb7d0de0e1f961c90d7507eda050a141fef0b202",
  "targetAncestry": [
    "Documentation System Design",
    "1. Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-5 (lines 33–35) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-8 (lines 57–59); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Help humans understand the system.
2. Help humans and agents shape, review, challenge, and approve architecture.
3. Help agents route, implement, verify, and leave durable knowledge behind.
```

### Full target shown text

```text
1. Help humans understand the system.
2. Help humans and agents shape, review, challenge, and approve architecture.
3. Help agents route, implement, verify, and leave durable knowledge behind.
```

## claim_24730225000dc21ea3dc57c22e857a37

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-6, lines 37–39.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-9.
Source digest: ed72ba7bc2c7e9223d38a11fec686feff43578bb78d5365a11d158f1ebec1687
Target digest: ed72ba7bc2c7e9223d38a11fec686feff43578bb78d5365a11d158f1ebec1687
Shown source SHA256: ed72ba7bc2c7e9223d38a11fec686feff43578bb78d5365a11d158f1ebec1687
Shown target SHA256: ed72ba7bc2c7e9223d38a11fec686feff43578bb78d5365a11d158f1ebec1687

### Proposed decision

```json
{
  "claimId": "claim_24730225000dc21ea3dc57c22e857a37",
  "sourceUnitDigest": "ed72ba7bc2c7e9223d38a11fec686feff43578bb78d5365a11d158f1ebec1687",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "ed72ba7bc2c7e9223d38a11fec686feff43578bb78d5365a11d158f1ebec1687",
  "targetAncestry": [
    "Documentation System Design",
    "1. Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-6 (lines 37–39) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-9 (lines 61–63); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The critical quality bar is human presence. If the docs are optimized for agent
execution but a human cannot scan, understand, challenge, and approve decisions,
the documentation system is failing.
```

### Full target shown text

```text
The critical quality bar is human presence. If the docs are optimized for agent
execution but a human cannot scan, understand, challenge, and approve decisions,
the documentation system is failing.
```

## claim_27b29141065a4fdbb5b4bb758b74f19d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#2-principles, lines 41–41.
Target: docs/platform/documentation/architecture/documentation-system-design.md#2-principles.
Source digest: 99288e8744dc4bf44c94d64a690da68563ac3c94c94919c67dcbc0bed334940a
Target digest: 99288e8744dc4bf44c94d64a690da68563ac3c94c94919c67dcbc0bed334940a
Shown source SHA256: 82d9caa6f1de3ae6a41add8f46c39644eaf42f4ac8d3cde5860377cd06ff79fb
Shown target SHA256: 82d9caa6f1de3ae6a41add8f46c39644eaf42f4ac8d3cde5860377cd06ff79fb

### Proposed decision

```json
{
  "claimId": "claim_27b29141065a4fdbb5b4bb758b74f19d",
  "sourceUnitDigest": "99288e8744dc4bf44c94d64a690da68563ac3c94c94919c67dcbc0bed334940a",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "2-principles",
  "targetUnitDigest": "99288e8744dc4bf44c94d64a690da68563ac3c94c94919c67dcbc0bed334940a",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#2-principles (lines 41–41) is carried at docs/platform/documentation/architecture/documentation-system-design.md#2-principles (lines 65–65); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 2. Principles
```

### Full target shown text

```text
## 2. Principles
```

## claim_9c7ff54e9b8a84ceabab682c94cf6d91

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#21-human-first-structure, lines 43–43.
Target: docs/platform/documentation/architecture/documentation-system-design.md#21-human-first-structure.
Source digest: b0f06f85354625862cd1754687961bf0921c2cf463d684bda7432bdde9d7d6b3
Target digest: b0f06f85354625862cd1754687961bf0921c2cf463d684bda7432bdde9d7d6b3
Shown source SHA256: 66b5216dad88e2bbe1e96ba92531c260615d31c7acfbe0107ba87801528cfba7
Shown target SHA256: 66b5216dad88e2bbe1e96ba92531c260615d31c7acfbe0107ba87801528cfba7

### Proposed decision

```json
{
  "claimId": "claim_9c7ff54e9b8a84ceabab682c94cf6d91",
  "sourceUnitDigest": "b0f06f85354625862cd1754687961bf0921c2cf463d684bda7432bdde9d7d6b3",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "21-human-first-structure",
  "targetUnitDigest": "b0f06f85354625862cd1754687961bf0921c2cf463d684bda7432bdde9d7d6b3",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#21-human-first-structure (lines 43–43) is carried at docs/platform/documentation/architecture/documentation-system-design.md#21-human-first-structure (lines 67–67); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 2.1. Human-first structure

The folder tree, document structure, and writing style must be legible to a
human without requiring them to read governance first.

Spatial navigation matters. A person scanning the tree should see what is
platform-wide, what is area-specific, what is current state, what is rationale,
what is contract, what is proof, and what is history.
```

### Full target shown text

```text
### 2.1. Human-first structure

The folder tree, document structure, and writing style must be legible to a
human without requiring them to read governance first.

Spatial navigation matters. A person scanning the tree should see what is
platform-wide, what is area-specific, what is current state, what is rationale,
what is contract, what is proof, and what is history.
```

## claim_682e917c2592070307cbfc4f76bbe485

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-7, lines 45–46.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-10.
Source digest: b037403125adb69516ea217b5e8effea3dfc6de9cbd57363a9f6f0713d8304c5
Target digest: b037403125adb69516ea217b5e8effea3dfc6de9cbd57363a9f6f0713d8304c5
Shown source SHA256: b037403125adb69516ea217b5e8effea3dfc6de9cbd57363a9f6f0713d8304c5
Shown target SHA256: b037403125adb69516ea217b5e8effea3dfc6de9cbd57363a9f6f0713d8304c5

### Proposed decision

```json
{
  "claimId": "claim_682e917c2592070307cbfc4f76bbe485",
  "sourceUnitDigest": "b037403125adb69516ea217b5e8effea3dfc6de9cbd57363a9f6f0713d8304c5",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "b037403125adb69516ea217b5e8effea3dfc6de9cbd57363a9f6f0713d8304c5",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles",
    "2.1. Human-first structure"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-7 (lines 45–46) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-10 (lines 69–70); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The folder tree, document structure, and writing style must be legible to a
human without requiring them to read governance first.
```

### Full target shown text

```text
The folder tree, document structure, and writing style must be legible to a
human without requiring them to read governance first.
```

## claim_c0c1acb7bfcca0f4613d666d2c35528a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-8, lines 48–50.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-11.
Source digest: ffe286b387706245aafba907345d147eebbcd69d3cb2e2082c10af3991c2e62f
Target digest: ffe286b387706245aafba907345d147eebbcd69d3cb2e2082c10af3991c2e62f
Shown source SHA256: ffe286b387706245aafba907345d147eebbcd69d3cb2e2082c10af3991c2e62f
Shown target SHA256: ffe286b387706245aafba907345d147eebbcd69d3cb2e2082c10af3991c2e62f

### Proposed decision

```json
{
  "claimId": "claim_c0c1acb7bfcca0f4613d666d2c35528a",
  "sourceUnitDigest": "ffe286b387706245aafba907345d147eebbcd69d3cb2e2082c10af3991c2e62f",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "ffe286b387706245aafba907345d147eebbcd69d3cb2e2082c10af3991c2e62f",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles",
    "2.1. Human-first structure"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-8 (lines 48–50) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-11 (lines 72–74); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Spatial navigation matters. A person scanning the tree should see what is
platform-wide, what is area-specific, what is current state, what is rationale,
what is contract, what is proof, and what is history.
```

### Full target shown text

```text
Spatial navigation matters. A person scanning the tree should see what is
platform-wide, what is area-specific, what is current state, what is rationale,
what is contract, what is proof, and what is history.
```

## claim_acc823f4fae24e6e85018509266b3449

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#22-one-claim-one-owner, lines 52–52.
Target: docs/platform/documentation/architecture/documentation-system-design.md#22-one-claim-one-owner.
Source digest: 72bf6035ba799c271af41757d53d54f55b05df270ec9362bcde1919969a9952d
Target digest: 72bf6035ba799c271af41757d53d54f55b05df270ec9362bcde1919969a9952d
Shown source SHA256: 948167ec9e3ab712c6c41b227a94e6a7eecffe0f1f4045538bfef233e8c12c81
Shown target SHA256: 948167ec9e3ab712c6c41b227a94e6a7eecffe0f1f4045538bfef233e8c12c81

### Proposed decision

```json
{
  "claimId": "claim_acc823f4fae24e6e85018509266b3449",
  "sourceUnitDigest": "72bf6035ba799c271af41757d53d54f55b05df270ec9362bcde1919969a9952d",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "22-one-claim-one-owner",
  "targetUnitDigest": "72bf6035ba799c271af41757d53d54f55b05df270ec9362bcde1919969a9952d",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#22-one-claim-one-owner (lines 52–52) is carried at docs/platform/documentation/architecture/documentation-system-design.md#22-one-claim-one-owner (lines 76–76); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 2.2. One claim, one owner

A rule, contract, behavior, or architectural claim should have one owning
document. Other documents may summarize and link to it, but must not fork its
authority.
```

### Full target shown text

```text
### 2.2. One claim, one owner

A rule, contract, behavior, or architectural claim should have one owning
document. Other documents may summarize and link to it, but must not fork its
authority.
```

## claim_cd835f2700d485d8b6bec44e60fc8b82

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-9, lines 54–56.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-12.
Source digest: 43f007455165a570d509e9224546ef1300fa526ecd10eef032231c31f98ca4a6
Target digest: 43f007455165a570d509e9224546ef1300fa526ecd10eef032231c31f98ca4a6
Shown source SHA256: 43f007455165a570d509e9224546ef1300fa526ecd10eef032231c31f98ca4a6
Shown target SHA256: 43f007455165a570d509e9224546ef1300fa526ecd10eef032231c31f98ca4a6

### Proposed decision

```json
{
  "claimId": "claim_cd835f2700d485d8b6bec44e60fc8b82",
  "sourceUnitDigest": "43f007455165a570d509e9224546ef1300fa526ecd10eef032231c31f98ca4a6",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "43f007455165a570d509e9224546ef1300fa526ecd10eef032231c31f98ca4a6",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles",
    "2.2. One claim, one owner"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-9 (lines 54–56) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-12 (lines 78–80); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
A rule, contract, behavior, or architectural claim should have one owning
document. Other documents may summarize and link to it, but must not fork its
authority.
```

### Full target shown text

```text
A rule, contract, behavior, or architectural claim should have one owning
document. Other documents may summarize and link to it, but must not fork its
authority.
```

## claim_8af8a57013489e436df94b113a24d370

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#23-provenance-is-not-authority, lines 58–58.
Target: docs/platform/documentation/architecture/documentation-system-design.md#23-provenance-is-not-authority.
Source digest: 30377915a4ed9cce36c15c2bbe40a311c1a7885fe12d0cb37d005b39ea195c54
Target digest: 30377915a4ed9cce36c15c2bbe40a311c1a7885fe12d0cb37d005b39ea195c54
Shown source SHA256: 44ac5f37e279678a989fdabb1321b06ac0079f98ae73531cb9e910cae35a0e78
Shown target SHA256: 44ac5f37e279678a989fdabb1321b06ac0079f98ae73531cb9e910cae35a0e78

### Proposed decision

```json
{
  "claimId": "claim_8af8a57013489e436df94b113a24d370",
  "sourceUnitDigest": "30377915a4ed9cce36c15c2bbe40a311c1a7885fe12d0cb37d005b39ea195c54",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "23-provenance-is-not-authority",
  "targetUnitDigest": "30377915a4ed9cce36c15c2bbe40a311c1a7885fe12d0cb37d005b39ea195c54",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#23-provenance-is-not-authority (lines 58–58) is carried at docs/platform/documentation/architecture/documentation-system-design.md#23-provenance-is-not-authority (lines 82–82); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 2.3. Provenance is not authority

An agent may draft, summarize, cross-link, or detect drift. That provenance must
be visible, but agent authorship does not make a document authoritative.
Authority comes from document type, status, owner, evidence, and approval.
```

### Full target shown text

```text
### 2.3. Provenance is not authority

An agent may draft, summarize, cross-link, or detect drift. That provenance must
be visible, but agent authorship does not make a document authoritative.
Authority comes from document type, status, owner, evidence, and approval.
```

## claim_2874b165852596b9ab2bbe30aaf1d056

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-10, lines 60–62.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-13.
Source digest: 4c3c1cdead8a86d8035ee15da2c5e84a23d1615209459fd645641f6ef0507cec
Target digest: 4c3c1cdead8a86d8035ee15da2c5e84a23d1615209459fd645641f6ef0507cec
Shown source SHA256: 4c3c1cdead8a86d8035ee15da2c5e84a23d1615209459fd645641f6ef0507cec
Shown target SHA256: 4c3c1cdead8a86d8035ee15da2c5e84a23d1615209459fd645641f6ef0507cec

### Proposed decision

```json
{
  "claimId": "claim_2874b165852596b9ab2bbe30aaf1d056",
  "sourceUnitDigest": "4c3c1cdead8a86d8035ee15da2c5e84a23d1615209459fd645641f6ef0507cec",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "4c3c1cdead8a86d8035ee15da2c5e84a23d1615209459fd645641f6ef0507cec",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles",
    "2.3. Provenance is not authority"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-10 (lines 60–62) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-13 (lines 84–86); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
An agent may draft, summarize, cross-link, or detect drift. That provenance must
be visible, but agent authorship does not make a document authoritative.
Authority comes from document type, status, owner, evidence, and approval.
```

### Full target shown text

```text
An agent may draft, summarize, cross-link, or detect drift. That provenance must
be visible, but agent authorship does not make a document authoritative.
Authority comes from document type, status, owner, evidence, and approval.
```

## claim_2eab18c285aa1ac93bde40423d954e11

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#24-discussion-is-preserved-then-drained, lines 64–64.
Target: docs/platform/documentation/architecture/documentation-system-design.md#24-discussion-is-preserved-then-drained.
Source digest: cd39ab68f181dc69feb8444fa7f6495ad41747cc353111700c58702be41c959e
Target digest: cd39ab68f181dc69feb8444fa7f6495ad41747cc353111700c58702be41c959e
Shown source SHA256: be1be3ab3768a23c69f9e001f608f3220f4e9640dec23f0f918e97cd0538828b
Shown target SHA256: be1be3ab3768a23c69f9e001f608f3220f4e9640dec23f0f918e97cd0538828b

### Proposed decision

```json
{
  "claimId": "claim_2eab18c285aa1ac93bde40423d954e11",
  "sourceUnitDigest": "cd39ab68f181dc69feb8444fa7f6495ad41747cc353111700c58702be41c959e",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "24-discussion-is-preserved-then-drained",
  "targetUnitDigest": "cd39ab68f181dc69feb8444fa7f6495ad41747cc353111700c58702be41c959e",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#24-discussion-is-preserved-then-drained (lines 64–64) is carried at docs/platform/documentation/architecture/documentation-system-design.md#24-discussion-is-preserved-then-drained (lines 88–88); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 2.4. Discussion is preserved, then drained

Architecture shaping needs a temporary place to preserve ideas, objections,
tentative decisions, and evidence. That place must not become a shadow spec.
Settled content is promoted into canonical documents, then removed or marked as
promoted.
```

### Full target shown text

```text
### 2.4. Discussion is preserved, then drained

Architecture shaping needs a temporary place to preserve ideas, objections,
tentative decisions, and evidence. That place must not become a shadow spec.
Settled content is promoted into canonical documents, then removed or marked as
promoted.
```

## claim_de6873dbd7dc67522a4fa6342a8db387

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-11, lines 66–69.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-14.
Source digest: c0a2918f9cf03cac94a0c63ae868f00476adf7eff93c909ff4282f71a0ec8c66
Target digest: c0a2918f9cf03cac94a0c63ae868f00476adf7eff93c909ff4282f71a0ec8c66
Shown source SHA256: c0a2918f9cf03cac94a0c63ae868f00476adf7eff93c909ff4282f71a0ec8c66
Shown target SHA256: c0a2918f9cf03cac94a0c63ae868f00476adf7eff93c909ff4282f71a0ec8c66

### Proposed decision

```json
{
  "claimId": "claim_de6873dbd7dc67522a4fa6342a8db387",
  "sourceUnitDigest": "c0a2918f9cf03cac94a0c63ae868f00476adf7eff93c909ff4282f71a0ec8c66",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "c0a2918f9cf03cac94a0c63ae868f00476adf7eff93c909ff4282f71a0ec8c66",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles",
    "2.4. Discussion is preserved, then drained"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-11 (lines 66–69) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-14 (lines 90–93); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Architecture shaping needs a temporary place to preserve ideas, objections,
tentative decisions, and evidence. That place must not become a shadow spec.
Settled content is promoted into canonical documents, then removed or marked as
promoted.
```

### Full target shown text

```text
Architecture shaping needs a temporary place to preserve ideas, objections,
tentative decisions, and evidence. That place must not become a shadow spec.
Settled content is promoted into canonical documents, then removed or marked as
promoted.
```

## claim_54cc0c8a6ad8521c1c63b32bc2da3b6b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#25-documentation-is-a-reading-graph, lines 71–71.
Target: docs/platform/documentation/architecture/documentation-system-design.md#25-documentation-is-a-reading-graph.
Source digest: 2794fd39cb327397d8b477be12daee606043e60ae8a2d467dc1b77306d8036fc
Target digest: 2794fd39cb327397d8b477be12daee606043e60ae8a2d467dc1b77306d8036fc
Shown source SHA256: e4c569ef13dd44c1bbe49d716949d4858ddebce9524bf128ac4f1259efb244c9
Shown target SHA256: e4c569ef13dd44c1bbe49d716949d4858ddebce9524bf128ac4f1259efb244c9

### Proposed decision

```json
{
  "claimId": "claim_54cc0c8a6ad8521c1c63b32bc2da3b6b",
  "sourceUnitDigest": "2794fd39cb327397d8b477be12daee606043e60ae8a2d467dc1b77306d8036fc",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "25-documentation-is-a-reading-graph",
  "targetUnitDigest": "2794fd39cb327397d8b477be12daee606043e60ae8a2d467dc1b77306d8036fc",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#25-documentation-is-a-reading-graph (lines 71–71) is carried at docs/platform/documentation/architecture/documentation-system-design.md#25-documentation-is-a-reading-graph (lines 95–95); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 2.5. Documentation is a reading graph

Good docs are not only good files. They are also a navigable graph. A reader
must be able to move from portal to current state, rationale, contract,
decision, proof, proposal, and history through deliberate links.
```

### Full target shown text

```text
### 2.5. Documentation is a reading graph

Good docs are not only good files. They are also a navigable graph. A reader
must be able to move from portal to current state, rationale, contract,
decision, proof, proposal, and history through deliberate links.
```

## claim_58343c58799a3a95fe9591567eef225f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-12, lines 73–75.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-15.
Source digest: 75b1720bcd6082fec386306cc097db363f8fe43cd41a42247819291559a00800
Target digest: 75b1720bcd6082fec386306cc097db363f8fe43cd41a42247819291559a00800
Shown source SHA256: 75b1720bcd6082fec386306cc097db363f8fe43cd41a42247819291559a00800
Shown target SHA256: 75b1720bcd6082fec386306cc097db363f8fe43cd41a42247819291559a00800

### Proposed decision

```json
{
  "claimId": "claim_58343c58799a3a95fe9591567eef225f",
  "sourceUnitDigest": "75b1720bcd6082fec386306cc097db363f8fe43cd41a42247819291559a00800",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "75b1720bcd6082fec386306cc097db363f8fe43cd41a42247819291559a00800",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles",
    "2.5. Documentation is a reading graph"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-12 (lines 73–75) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-15 (lines 97–99); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Good docs are not only good files. They are also a navigable graph. A reader
must be able to move from portal to current state, rationale, contract,
decision, proof, proposal, and history through deliberate links.
```

### Full target shown text

```text
Good docs are not only good files. They are also a navigable graph. A reader
must be able to move from portal to current state, rationale, contract,
decision, proof, proposal, and history through deliberate links.
```

## claim_a039fc8266284597631e8ebc0a899e60

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#26-generated-output-never-outranks-source, lines 77–77.
Target: docs/platform/documentation/architecture/documentation-system-design.md#26-generated-output-never-outranks-source.
Source digest: fba6de6b7add3b9f8bd42c20e52b4f617a5709838b04a3999e78983f3f4d3d8b
Target digest: fba6de6b7add3b9f8bd42c20e52b4f617a5709838b04a3999e78983f3f4d3d8b
Shown source SHA256: d1a3033749d36b915e9e1ca7cbc496699cdf7adf7019c0dcd2c9a8276b6977f2
Shown target SHA256: d1a3033749d36b915e9e1ca7cbc496699cdf7adf7019c0dcd2c9a8276b6977f2

### Proposed decision

```json
{
  "claimId": "claim_a039fc8266284597631e8ebc0a899e60",
  "sourceUnitDigest": "fba6de6b7add3b9f8bd42c20e52b4f617a5709838b04a3999e78983f3f4d3d8b",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "26-generated-output-never-outranks-source",
  "targetUnitDigest": "fba6de6b7add3b9f8bd42c20e52b4f617a5709838b04a3999e78983f3f4d3d8b",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#26-generated-output-never-outranks-source (lines 77–77) is carried at docs/platform/documentation/architecture/documentation-system-design.md#26-generated-output-never-outranks-source (lines 101–101); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 2.6. Generated output never outranks source

Generated documents and indexes are projections. They must declare their source,
generator, freshness rule, and do-not-edit status. They never create new policy
or override their source.
```

### Full target shown text

```text
### 2.6. Generated output never outranks source

Generated documents and indexes are projections. They must declare their source,
generator, freshness rule, and do-not-edit status. They never create new policy
or override their source.
```

## claim_246fed247cebf58fab5849a4ac437bba

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-13, lines 79–81.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-16.
Source digest: 8fe79b09dc74954bf9dd1f7da022d26b776377d9ca9ba88a4f3877db61cb200d
Target digest: 8fe79b09dc74954bf9dd1f7da022d26b776377d9ca9ba88a4f3877db61cb200d
Shown source SHA256: 8fe79b09dc74954bf9dd1f7da022d26b776377d9ca9ba88a4f3877db61cb200d
Shown target SHA256: 8fe79b09dc74954bf9dd1f7da022d26b776377d9ca9ba88a4f3877db61cb200d

### Proposed decision

```json
{
  "claimId": "claim_246fed247cebf58fab5849a4ac437bba",
  "sourceUnitDigest": "8fe79b09dc74954bf9dd1f7da022d26b776377d9ca9ba88a4f3877db61cb200d",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "8fe79b09dc74954bf9dd1f7da022d26b776377d9ca9ba88a4f3877db61cb200d",
  "targetAncestry": [
    "Documentation System Design",
    "2. Principles",
    "2.6. Generated output never outranks source"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-13 (lines 79–81) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-16 (lines 103–105); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Generated documents and indexes are projections. They must declare their source,
generator, freshness rule, and do-not-edit status. They never create new policy
or override their source.
```

### Full target shown text

```text
Generated documents and indexes are projections. They must declare their source,
generator, freshness rule, and do-not-edit status. They never create new policy
or override their source.
```

## claim_543dcbe60de11b1133a158cf51c62b07

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#3-target-folder-structure, lines 83–83.
Target: docs/platform/documentation/architecture/documentation-system-design.md#3-target-folder-structure.
Source digest: c19052fdad13c8b613b1b8481282ec3e77a9a81eec14a1425011cd0af3191b09
Target digest: c19052fdad13c8b613b1b8481282ec3e77a9a81eec14a1425011cd0af3191b09
Shown source SHA256: a62d71f4e2d41637a87882c510be60aa51b2b02afd932efca28283972ef833ac
Shown target SHA256: a62d71f4e2d41637a87882c510be60aa51b2b02afd932efca28283972ef833ac

### Proposed decision

```json
{
  "claimId": "claim_543dcbe60de11b1133a158cf51c62b07",
  "sourceUnitDigest": "c19052fdad13c8b613b1b8481282ec3e77a9a81eec14a1425011cd0af3191b09",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "3-target-folder-structure",
  "targetUnitDigest": "c19052fdad13c8b613b1b8481282ec3e77a9a81eec14a1425011cd0af3191b09",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#3-target-folder-structure (lines 83–83) is carried at docs/platform/documentation/architecture/documentation-system-design.md#3-target-folder-structure (lines 107–107); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 3. Target Folder Structure

The target model keeps platform-wide authority at `docs/platform/` and keeps
area-specific docs under `docs/platform/<area>/`.

There is no `docs/platform/system/` folder and no `docs/platform/areas/` layer.
`system/` would look like another area, and `areas/` adds an unnecessary level.

```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    vision.md
    platform-foundations.md
    architecture-map.md
    component-boundary.md

    contracts/
      routing-handoff-contract.md

    decisions/
    verification/
    history/

    <area>/
      README.md
      spec.md
      architecture/
      contracts/
      decisions/
      verification/
      operations/
      proposals/
      history/

  user/
    README.md
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
    README.md

  knowledge/
    README.md

  history/
    README.md
```

External governed surfaces remain outside `docs/` when runtime/tooling needs
them there, but they are still governed by `docs/doc-governance.md`:

```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```
````

### Full target shown text

````text
## 3. Target Folder Structure

The target model keeps platform-wide authority at `docs/platform/` and keeps
area-specific docs under `docs/platform/<area>/`.

There is no `docs/platform/system/` folder and no `docs/platform/areas/` layer.
`system/` would look like another area, and `areas/` adds an unnecessary level.

```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    vision.md
    platform-foundations.md
    architecture-map.md
    component-boundary.md

    contracts/
      routing-handoff-contract.md

    decisions/
    verification/
    history/

    <area>/
      README.md
      spec.md
      architecture/
      contracts/
      decisions/
      verification/
      operations/
      proposals/
      history/

  user/
    README.md
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
    README.md

  knowledge/
    README.md

  history/
    README.md
```

External governed surfaces remain outside `docs/` when runtime/tooling needs
them there, but they are still governed by `docs/doc-governance.md`:

```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```
````

## claim_b14d737970401cb4bd7ed11b8cb1368f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-14, lines 85–86.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-17.
Source digest: dd3900db320fd5e102f5d6d41f2ed61f0c6f6602753649a850d3c15a938a0b59
Target digest: dd3900db320fd5e102f5d6d41f2ed61f0c6f6602753649a850d3c15a938a0b59
Shown source SHA256: dd3900db320fd5e102f5d6d41f2ed61f0c6f6602753649a850d3c15a938a0b59
Shown target SHA256: dd3900db320fd5e102f5d6d41f2ed61f0c6f6602753649a850d3c15a938a0b59

### Proposed decision

```json
{
  "claimId": "claim_b14d737970401cb4bd7ed11b8cb1368f",
  "sourceUnitDigest": "dd3900db320fd5e102f5d6d41f2ed61f0c6f6602753649a850d3c15a938a0b59",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "dd3900db320fd5e102f5d6d41f2ed61f0c6f6602753649a850d3c15a938a0b59",
  "targetAncestry": [
    "Documentation System Design",
    "3. Target Folder Structure"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-14 (lines 85–86) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-17 (lines 109–110); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The target model keeps platform-wide authority at `docs/platform/` and keeps
area-specific docs under `docs/platform/<area>/`.
```

### Full target shown text

```text
The target model keeps platform-wide authority at `docs/platform/` and keeps
area-specific docs under `docs/platform/<area>/`.
```

## claim_9fecc8e967579a2a9f01906a01c4c164

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-15, lines 88–89.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-18.
Source digest: e212b63935f38ed1c710f6120fd08ddcaac1d5a5148c9e97356aa851826f65c3
Target digest: e212b63935f38ed1c710f6120fd08ddcaac1d5a5148c9e97356aa851826f65c3
Shown source SHA256: e212b63935f38ed1c710f6120fd08ddcaac1d5a5148c9e97356aa851826f65c3
Shown target SHA256: e212b63935f38ed1c710f6120fd08ddcaac1d5a5148c9e97356aa851826f65c3

### Proposed decision

```json
{
  "claimId": "claim_9fecc8e967579a2a9f01906a01c4c164",
  "sourceUnitDigest": "e212b63935f38ed1c710f6120fd08ddcaac1d5a5148c9e97356aa851826f65c3",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "e212b63935f38ed1c710f6120fd08ddcaac1d5a5148c9e97356aa851826f65c3",
  "targetAncestry": [
    "Documentation System Design",
    "3. Target Folder Structure"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-15 (lines 88–89) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-18 (lines 112–113); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
There is no `docs/platform/system/` folder and no `docs/platform/areas/` layer.
`system/` would look like another area, and `areas/` adds an unnecessary level.
```

### Full target shown text

```text
There is no `docs/platform/system/` folder and no `docs/platform/areas/` layer.
`system/` would look like another area, and `areas/` adds an unnecessary level.
```

## claim_eca8c04e487a8cc6f9a8c6718b867aa6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-16, lines 91–138.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-19.
Source digest: 06a2c499e50bfcc8da716af7e7616ae04e3bb50ebf56717ededaf2421184a683
Target digest: 06a2c499e50bfcc8da716af7e7616ae04e3bb50ebf56717ededaf2421184a683
Shown source SHA256: 06a2c499e50bfcc8da716af7e7616ae04e3bb50ebf56717ededaf2421184a683
Shown target SHA256: 06a2c499e50bfcc8da716af7e7616ae04e3bb50ebf56717ededaf2421184a683

### Proposed decision

```json
{
  "claimId": "claim_eca8c04e487a8cc6f9a8c6718b867aa6",
  "sourceUnitDigest": "06a2c499e50bfcc8da716af7e7616ae04e3bb50ebf56717ededaf2421184a683",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "06a2c499e50bfcc8da716af7e7616ae04e3bb50ebf56717ededaf2421184a683",
  "targetAncestry": [
    "Documentation System Design",
    "3. Target Folder Structure"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-16 (lines 91–138) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-19 (lines 115–162); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    vision.md
    platform-foundations.md
    architecture-map.md
    component-boundary.md

    contracts/
      routing-handoff-contract.md

    decisions/
    verification/
    history/

    <area>/
      README.md
      spec.md
      architecture/
      contracts/
      decisions/
      verification/
      operations/
      proposals/
      history/

  user/
    README.md
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
    README.md

  knowledge/
    README.md

  history/
    README.md
```
````

### Full target shown text

````text
```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    vision.md
    platform-foundations.md
    architecture-map.md
    component-boundary.md

    contracts/
      routing-handoff-contract.md

    decisions/
    verification/
    history/

    <area>/
      README.md
      spec.md
      architecture/
      contracts/
      decisions/
      verification/
      operations/
      proposals/
      history/

  user/
    README.md
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
    README.md

  knowledge/
    README.md

  history/
    README.md
```
````

## claim_720ebdd59676df2835160de961304b13

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-17, lines 140–141.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-20.
Source digest: d1730c87570dfea643cc54ac255f22a75be9337ff27e1daf076b1cadf31502c0
Target digest: d1730c87570dfea643cc54ac255f22a75be9337ff27e1daf076b1cadf31502c0
Shown source SHA256: d1730c87570dfea643cc54ac255f22a75be9337ff27e1daf076b1cadf31502c0
Shown target SHA256: d1730c87570dfea643cc54ac255f22a75be9337ff27e1daf076b1cadf31502c0

### Proposed decision

```json
{
  "claimId": "claim_720ebdd59676df2835160de961304b13",
  "sourceUnitDigest": "d1730c87570dfea643cc54ac255f22a75be9337ff27e1daf076b1cadf31502c0",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "d1730c87570dfea643cc54ac255f22a75be9337ff27e1daf076b1cadf31502c0",
  "targetAncestry": [
    "Documentation System Design",
    "3. Target Folder Structure"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-17 (lines 140–141) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-20 (lines 164–165); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
External governed surfaces remain outside `docs/` when runtime/tooling needs
them there, but they are still governed by `docs/doc-governance.md`:
```

### Full target shown text

```text
External governed surfaces remain outside `docs/` when runtime/tooling needs
them there, but they are still governed by `docs/doc-governance.md`:
```

## claim_0b2c9b14b17eb9b941ea8400621637aa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-18, lines 143–148.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-21.
Source digest: fd6f97edf98ce6716fa567c1af023f6149a977a91fbfff2f704119881fc938d9
Target digest: fd6f97edf98ce6716fa567c1af023f6149a977a91fbfff2f704119881fc938d9
Shown source SHA256: fd6f97edf98ce6716fa567c1af023f6149a977a91fbfff2f704119881fc938d9
Shown target SHA256: fd6f97edf98ce6716fa567c1af023f6149a977a91fbfff2f704119881fc938d9

### Proposed decision

```json
{
  "claimId": "claim_0b2c9b14b17eb9b941ea8400621637aa",
  "sourceUnitDigest": "fd6f97edf98ce6716fa567c1af023f6149a977a91fbfff2f704119881fc938d9",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "fd6f97edf98ce6716fa567c1af023f6149a977a91fbfff2f704119881fc938d9",
  "targetAncestry": [
    "Documentation System Design",
    "3. Target Folder Structure"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-18 (lines 143–148) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-21 (lines 167–172); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```
````

### Full target shown text

````text
```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```
````

## claim_da6ee0f1d5c5f047185ca5ba7f744416

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#4-platform-wide-anchors, lines 150–150.
Target: docs/platform/documentation/architecture/documentation-system-design.md#4-platform-wide-anchors.
Source digest: aa165c8b5c9e1cf6fff73b9c9e421c4acff7e5b8ecb6de1237f8af9f4d7ccdfb
Target digest: aa165c8b5c9e1cf6fff73b9c9e421c4acff7e5b8ecb6de1237f8af9f4d7ccdfb
Shown source SHA256: b422bd11c0107a13ee66b2a24fd2c5dfd9acf95dc864e0a5cbf339d345cb0b77
Shown target SHA256: b422bd11c0107a13ee66b2a24fd2c5dfd9acf95dc864e0a5cbf339d345cb0b77

### Proposed decision

```json
{
  "claimId": "claim_da6ee0f1d5c5f047185ca5ba7f744416",
  "sourceUnitDigest": "aa165c8b5c9e1cf6fff73b9c9e421c4acff7e5b8ecb6de1237f8af9f4d7ccdfb",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "4-platform-wide-anchors",
  "targetUnitDigest": "aa165c8b5c9e1cf6fff73b9c9e421c4acff7e5b8ecb6de1237f8af9f4d7ccdfb",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#4-platform-wide-anchors (lines 150–150) is carried at docs/platform/documentation/architecture/documentation-system-design.md#4-platform-wide-anchors (lines 174–174); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 4. Platform-wide Anchors

The root of `docs/platform/` holds cross-area platform authority.

| File | Role |
|---|---|
| `README.md` | Platform documentation portal and area registry |
| `vision.md` | Whole-platform mission, scope, non-scope, direction, and quality principles |
| `platform-foundations.md` | Cross-area platform laws and durable constraints |
| `architecture-map.md` | Whole-system architecture map |
| `component-boundary.md` | Layers, parent components, child components, responsibilities, and authority boundaries |
| `contracts/` | Cross-area contracts that no single area should own alone |
| `decisions/` | Platform-wide decisions |
| `verification/` | Cross-area proof and conformance evidence |
| `history/` | Retired or archived cross-area source material |

`component-boundary.md` is a system architecture document, not an area. It shows
how the whole system is decomposed into layers, parent components, child
components, responsibilities, and authority boundaries.
```

### Full target shown text

```text
## 4. Platform-wide Anchors

The root of `docs/platform/` holds cross-area platform authority.

| File | Role |
|---|---|
| `README.md` | Platform documentation portal and area registry |
| `vision.md` | Whole-platform mission, scope, non-scope, direction, and quality principles |
| `platform-foundations.md` | Cross-area platform laws and durable constraints |
| `architecture-map.md` | Whole-system architecture map |
| `component-boundary.md` | Layers, parent components, child components, responsibilities, and authority boundaries |
| `contracts/` | Cross-area contracts that no single area should own alone |
| `decisions/` | Platform-wide decisions |
| `verification/` | Cross-area proof and conformance evidence |
| `history/` | Retired or archived cross-area source material |

`component-boundary.md` is a system architecture document, not an area. It shows
how the whole system is decomposed into layers, parent components, child
components, responsibilities, and authority boundaries.
```

## claim_91aba155f02829357ed67a56e7024251

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-19, lines 152–152.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-22.
Source digest: 63d0f9aac3d04c8004f9c37c879d70ff79df61d1631bf66029b3e6654be940b7
Target digest: 63d0f9aac3d04c8004f9c37c879d70ff79df61d1631bf66029b3e6654be940b7
Shown source SHA256: 63d0f9aac3d04c8004f9c37c879d70ff79df61d1631bf66029b3e6654be940b7
Shown target SHA256: 63d0f9aac3d04c8004f9c37c879d70ff79df61d1631bf66029b3e6654be940b7

### Proposed decision

```json
{
  "claimId": "claim_91aba155f02829357ed67a56e7024251",
  "sourceUnitDigest": "63d0f9aac3d04c8004f9c37c879d70ff79df61d1631bf66029b3e6654be940b7",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "63d0f9aac3d04c8004f9c37c879d70ff79df61d1631bf66029b3e6654be940b7",
  "targetAncestry": [
    "Documentation System Design",
    "4. Platform-wide Anchors"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-19 (lines 152–152) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-22 (lines 176–176); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The root of `docs/platform/` holds cross-area platform authority.
```

### Full target shown text

```text
The root of `docs/platform/` holds cross-area platform authority.
```

## claim_f2fb01d36f8cae8aa5639f46c8c899be

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-20, lines 154–164.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-23.
Source digest: 56313ea6e06266d1b461d55926719697844eca15913b81c2ddb9a2936527a910
Target digest: 56313ea6e06266d1b461d55926719697844eca15913b81c2ddb9a2936527a910
Shown source SHA256: 56313ea6e06266d1b461d55926719697844eca15913b81c2ddb9a2936527a910
Shown target SHA256: 56313ea6e06266d1b461d55926719697844eca15913b81c2ddb9a2936527a910

### Proposed decision

```json
{
  "claimId": "claim_f2fb01d36f8cae8aa5639f46c8c899be",
  "sourceUnitDigest": "56313ea6e06266d1b461d55926719697844eca15913b81c2ddb9a2936527a910",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "56313ea6e06266d1b461d55926719697844eca15913b81c2ddb9a2936527a910",
  "targetAncestry": [
    "Documentation System Design",
    "4. Platform-wide Anchors"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-20 (lines 154–164) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-23 (lines 178–188); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
| File | Role |
|---|---|
| `README.md` | Platform documentation portal and area registry |
| `vision.md` | Whole-platform mission, scope, non-scope, direction, and quality principles |
| `platform-foundations.md` | Cross-area platform laws and durable constraints |
| `architecture-map.md` | Whole-system architecture map |
| `component-boundary.md` | Layers, parent components, child components, responsibilities, and authority boundaries |
| `contracts/` | Cross-area contracts that no single area should own alone |
| `decisions/` | Platform-wide decisions |
| `verification/` | Cross-area proof and conformance evidence |
| `history/` | Retired or archived cross-area source material |
```

### Full target shown text

```text
| File | Role |
|---|---|
| `README.md` | Platform documentation portal and area registry |
| `vision.md` | Whole-platform mission, scope, non-scope, direction, and quality principles |
| `platform-foundations.md` | Cross-area platform laws and durable constraints |
| `architecture-map.md` | Whole-system architecture map |
| `component-boundary.md` | Layers, parent components, child components, responsibilities, and authority boundaries |
| `contracts/` | Cross-area contracts that no single area should own alone |
| `decisions/` | Platform-wide decisions |
| `verification/` | Cross-area proof and conformance evidence |
| `history/` | Retired or archived cross-area source material |
```

## claim_c6a8a0e28ae8ca3bc38bfa80c3cb4454

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-21, lines 166–168.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-24.
Source digest: f5e8c51505b897a8d378dfdfaeffa2b213466c75c5c7b532de74a96764dda58f
Target digest: f5e8c51505b897a8d378dfdfaeffa2b213466c75c5c7b532de74a96764dda58f
Shown source SHA256: f5e8c51505b897a8d378dfdfaeffa2b213466c75c5c7b532de74a96764dda58f
Shown target SHA256: f5e8c51505b897a8d378dfdfaeffa2b213466c75c5c7b532de74a96764dda58f

### Proposed decision

```json
{
  "claimId": "claim_c6a8a0e28ae8ca3bc38bfa80c3cb4454",
  "sourceUnitDigest": "f5e8c51505b897a8d378dfdfaeffa2b213466c75c5c7b532de74a96764dda58f",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "f5e8c51505b897a8d378dfdfaeffa2b213466c75c5c7b532de74a96764dda58f",
  "targetAncestry": [
    "Documentation System Design",
    "4. Platform-wide Anchors"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-21 (lines 166–168) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-24 (lines 190–192); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`component-boundary.md` is a system architecture document, not an area. It shows
how the whole system is decomposed into layers, parent components, child
components, responsibilities, and authority boundaries.
```

### Full target shown text

```text
`component-boundary.md` is a system architecture document, not an area. It shows
how the whole system is decomposed into layers, parent components, child
components, responsibilities, and authority boundaries.
```

## claim_347dd87130bf999639e2bfa64680a5bf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#5-area-shape, lines 170–170.
Target: docs/platform/documentation/architecture/documentation-system-design.md#5-area-shape.
Source digest: 03f25873e5b9219cb1e6869b9912010d6d6a57199828cb3468ad0228b92a9b44
Target digest: 03f25873e5b9219cb1e6869b9912010d6d6a57199828cb3468ad0228b92a9b44
Shown source SHA256: 99c99e8ba2824841523013991997d5148360ded7486376848af929fbcb55d46e
Shown target SHA256: 99c99e8ba2824841523013991997d5148360ded7486376848af929fbcb55d46e

### Proposed decision

```json
{
  "claimId": "claim_347dd87130bf999639e2bfa64680a5bf",
  "sourceUnitDigest": "03f25873e5b9219cb1e6869b9912010d6d6a57199828cb3468ad0228b92a9b44",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "5-area-shape",
  "targetUnitDigest": "03f25873e5b9219cb1e6869b9912010d6d6a57199828cb3468ad0228b92a9b44",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#5-area-shape (lines 170–170) is carried at docs/platform/documentation/architecture/documentation-system-design.md#5-area-shape (lines 194–194); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 5. Area Shape

Each area lives directly under `docs/platform/<area>/`.

Minimum required shape:

```txt
docs/platform/<area>/
  README.md
  spec.md
  architecture/
  contracts/
  decisions/
  verification/
```

Optional folders are created only when needed:

```txt
operations/
playbooks/
proposals/
history/
generated/
```

Empty optional folders should not be created just to make the area look
complete. Absence should be meaningful.
````

### Full target shown text

````text
## 5. Area Shape

Each area lives directly under `docs/platform/<area>/`.

Minimum required shape:

```txt
docs/platform/<area>/
  README.md
  spec.md
  architecture/
  contracts/
  decisions/
  verification/
```

Optional folders are created only when needed:

```txt
operations/
playbooks/
proposals/
history/
generated/
```

Empty optional folders should not be created just to make the area look
complete. Absence should be meaningful.
````

## claim_6ba876d4506efa372f78e6f42def52e6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-22, lines 172–172.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-25.
Source digest: c73eafec7106aaae46a5253b950fae3e2d629a3c6f81274906d92f4729e713a9
Target digest: c73eafec7106aaae46a5253b950fae3e2d629a3c6f81274906d92f4729e713a9
Shown source SHA256: c73eafec7106aaae46a5253b950fae3e2d629a3c6f81274906d92f4729e713a9
Shown target SHA256: c73eafec7106aaae46a5253b950fae3e2d629a3c6f81274906d92f4729e713a9

### Proposed decision

```json
{
  "claimId": "claim_6ba876d4506efa372f78e6f42def52e6",
  "sourceUnitDigest": "c73eafec7106aaae46a5253b950fae3e2d629a3c6f81274906d92f4729e713a9",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "c73eafec7106aaae46a5253b950fae3e2d629a3c6f81274906d92f4729e713a9",
  "targetAncestry": [
    "Documentation System Design",
    "5. Area Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-22 (lines 172–172) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-25 (lines 196–196); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Each area lives directly under `docs/platform/<area>/`.
```

### Full target shown text

```text
Each area lives directly under `docs/platform/<area>/`.
```

## claim_b748d15e10606f7b45b2f95136fd7deb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-23, lines 174–174.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-26.
Source digest: b7492d1297b464885a07ddfb59d05d9335c548026701da3fe25579a413afe045
Target digest: b7492d1297b464885a07ddfb59d05d9335c548026701da3fe25579a413afe045
Shown source SHA256: b7492d1297b464885a07ddfb59d05d9335c548026701da3fe25579a413afe045
Shown target SHA256: b7492d1297b464885a07ddfb59d05d9335c548026701da3fe25579a413afe045

### Proposed decision

```json
{
  "claimId": "claim_b748d15e10606f7b45b2f95136fd7deb",
  "sourceUnitDigest": "b7492d1297b464885a07ddfb59d05d9335c548026701da3fe25579a413afe045",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "b7492d1297b464885a07ddfb59d05d9335c548026701da3fe25579a413afe045",
  "targetAncestry": [
    "Documentation System Design",
    "5. Area Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-23 (lines 174–174) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-26 (lines 198–198); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Minimum required shape:
```

### Full target shown text

```text
Minimum required shape:
```

## claim_feafd85fbffb18eb7746ed97dd7d085b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-24, lines 176–184.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-27.
Source digest: 40aad26d32920104831010f8a3cfd2ee5cc6d1eab050204985192005d63a4cfd
Target digest: 40aad26d32920104831010f8a3cfd2ee5cc6d1eab050204985192005d63a4cfd
Shown source SHA256: 40aad26d32920104831010f8a3cfd2ee5cc6d1eab050204985192005d63a4cfd
Shown target SHA256: 40aad26d32920104831010f8a3cfd2ee5cc6d1eab050204985192005d63a4cfd

### Proposed decision

```json
{
  "claimId": "claim_feafd85fbffb18eb7746ed97dd7d085b",
  "sourceUnitDigest": "40aad26d32920104831010f8a3cfd2ee5cc6d1eab050204985192005d63a4cfd",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "40aad26d32920104831010f8a3cfd2ee5cc6d1eab050204985192005d63a4cfd",
  "targetAncestry": [
    "Documentation System Design",
    "5. Area Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-24 (lines 176–184) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-27 (lines 200–208); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
docs/platform/<area>/
  README.md
  spec.md
  architecture/
  contracts/
  decisions/
  verification/
```
````

### Full target shown text

````text
```txt
docs/platform/<area>/
  README.md
  spec.md
  architecture/
  contracts/
  decisions/
  verification/
```
````

## claim_6fd0a930ccde32e57740645c0540889d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-25, lines 186–186.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-28.
Source digest: e7c6d1d1faa3464e874723052a76fc3d2d91b51bda6001fc8e2ca68f973cba55
Target digest: e7c6d1d1faa3464e874723052a76fc3d2d91b51bda6001fc8e2ca68f973cba55
Shown source SHA256: e7c6d1d1faa3464e874723052a76fc3d2d91b51bda6001fc8e2ca68f973cba55
Shown target SHA256: e7c6d1d1faa3464e874723052a76fc3d2d91b51bda6001fc8e2ca68f973cba55

### Proposed decision

```json
{
  "claimId": "claim_6fd0a930ccde32e57740645c0540889d",
  "sourceUnitDigest": "e7c6d1d1faa3464e874723052a76fc3d2d91b51bda6001fc8e2ca68f973cba55",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "e7c6d1d1faa3464e874723052a76fc3d2d91b51bda6001fc8e2ca68f973cba55",
  "targetAncestry": [
    "Documentation System Design",
    "5. Area Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-25 (lines 186–186) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-28 (lines 210–210); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Optional folders are created only when needed:
```

### Full target shown text

```text
Optional folders are created only when needed:
```

## claim_ac013cea2230387f4471666ac03b817e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-26, lines 188–194.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-29.
Source digest: 132953040376675ad7d32d63c7b5651322ef63afc65f71f698ac3cfc52b8207e
Target digest: 132953040376675ad7d32d63c7b5651322ef63afc65f71f698ac3cfc52b8207e
Shown source SHA256: 132953040376675ad7d32d63c7b5651322ef63afc65f71f698ac3cfc52b8207e
Shown target SHA256: 132953040376675ad7d32d63c7b5651322ef63afc65f71f698ac3cfc52b8207e

### Proposed decision

```json
{
  "claimId": "claim_ac013cea2230387f4471666ac03b817e",
  "sourceUnitDigest": "132953040376675ad7d32d63c7b5651322ef63afc65f71f698ac3cfc52b8207e",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "132953040376675ad7d32d63c7b5651322ef63afc65f71f698ac3cfc52b8207e",
  "targetAncestry": [
    "Documentation System Design",
    "5. Area Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-26 (lines 188–194) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-29 (lines 212–218); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
operations/
playbooks/
proposals/
history/
generated/
```
````

### Full target shown text

````text
```txt
operations/
playbooks/
proposals/
history/
generated/
```
````

## claim_e8cee55ebe4887b8696420c053cc84f8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-27, lines 196–197.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-30.
Source digest: e2124f9f74a88d64c727cb36d5e3e708806248fe55180675137902716d500104
Target digest: e2124f9f74a88d64c727cb36d5e3e708806248fe55180675137902716d500104
Shown source SHA256: e2124f9f74a88d64c727cb36d5e3e708806248fe55180675137902716d500104
Shown target SHA256: e2124f9f74a88d64c727cb36d5e3e708806248fe55180675137902716d500104

### Proposed decision

```json
{
  "claimId": "claim_e8cee55ebe4887b8696420c053cc84f8",
  "sourceUnitDigest": "e2124f9f74a88d64c727cb36d5e3e708806248fe55180675137902716d500104",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "e2124f9f74a88d64c727cb36d5e3e708806248fe55180675137902716d500104",
  "targetAncestry": [
    "Documentation System Design",
    "5. Area Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-27 (lines 196–197) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-30 (lines 220–221); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Empty optional folders should not be created just to make the area look
complete. Absence should be meaningful.
```

### Full target shown text

```text
Empty optional folders should not be created just to make the area look
complete. Absence should be meaningful.
```

## claim_efdfefddfa795fafe391a0eacdca6670

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#6-document-model, lines 199–199.
Target: docs/platform/documentation/architecture/documentation-system-design.md#6-document-model.
Source digest: 4eca77f97419a6f6b4e8a224f7fa31e7de1a727955152b8dfcdb82530f2f8b2c
Target digest: 4eca77f97419a6f6b4e8a224f7fa31e7de1a727955152b8dfcdb82530f2f8b2c
Shown source SHA256: 0ad8f6f4aeda2a9a23872dd596303daa062c608f5101d1216f2447a78825798c
Shown target SHA256: 0ad8f6f4aeda2a9a23872dd596303daa062c608f5101d1216f2447a78825798c

### Proposed decision

```json
{
  "claimId": "claim_efdfefddfa795fafe391a0eacdca6670",
  "sourceUnitDigest": "4eca77f97419a6f6b4e8a224f7fa31e7de1a727955152b8dfcdb82530f2f8b2c",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "6-document-model",
  "targetUnitDigest": "4eca77f97419a6f6b4e8a224f7fa31e7de1a727955152b8dfcdb82530f2f8b2c",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#6-document-model (lines 199–199) is carried at docs/platform/documentation/architecture/documentation-system-design.md#6-document-model (lines 223–223); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 6. Document Model
```

### Full target shown text

```text
## 6. Document Model
```

## claim_87a86d967b3e3a0de8bcebb699ed6269

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#61-area-readme, lines 201–201.
Target: docs/platform/documentation/architecture/documentation-system-design.md#61-area-readme.
Source digest: 4aacbefc6c80c2e0c0741eb3ef7a0666fa83532d05cba748732cb8f53a15ef29
Target digest: 4aacbefc6c80c2e0c0741eb3ef7a0666fa83532d05cba748732cb8f53a15ef29
Shown source SHA256: f2315781180c7f108164c431dc667263449f02f9fa809afbd817a6086ce3efdd
Shown target SHA256: f2315781180c7f108164c431dc667263449f02f9fa809afbd817a6086ce3efdd

### Proposed decision

```json
{
  "claimId": "claim_87a86d967b3e3a0de8bcebb699ed6269",
  "sourceUnitDigest": "4aacbefc6c80c2e0c0741eb3ef7a0666fa83532d05cba748732cb8f53a15ef29",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "61-area-readme",
  "targetUnitDigest": "4aacbefc6c80c2e0c0741eb3ef7a0666fa83532d05cba748732cb8f53a15ef29",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#61-area-readme (lines 201–201) is carried at docs/platform/documentation/architecture/documentation-system-design.md#61-area-readme (lines 225–225); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.1. Area README

The area README is the human-first portal into one platform area.

It owns orientation, ownership summary, read-first routing, decision surface,
and participation path. It does not own exact behavior, detailed contracts, or
historical rationale.

Required sections:

```txt
# <Area Name>

<metadata header>

## 1. What This Area Owns
## 2. Current Shape
## 3. Read First
## 4. Decision Surface
## 5. Canonical Documents
## 6. Key Contracts
## 7. Related Areas
## 8. How To Change This Area
## 9. Maintenance Notes
```

`Decision Surface` is required, even when it says "No active open decision."
````

### Full target shown text

````text
### 6.1. Area README

The area README is the human-first portal into one platform area.

It owns orientation, ownership summary, read-first routing, decision surface,
and participation path. It does not own exact behavior, detailed contracts, or
historical rationale.

Required sections:

```txt
# <Area Name>

<metadata header>

## 1. What This Area Owns
## 2. Current Shape
## 3. Read First
## 4. Decision Surface
## 5. Canonical Documents
## 6. Key Contracts
## 7. Related Areas
## 8. How To Change This Area
## 9. Maintenance Notes
```

`Decision Surface` is required, even when it says "No active open decision."
````

## claim_bb445dab742b3604bd6ed4cf2f137a24

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-28, lines 203–203.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-31.
Source digest: fa6e5cef7e51c0ebc323a5cc531b8ece38dac3be333c363a7f969763d09664fe
Target digest: fa6e5cef7e51c0ebc323a5cc531b8ece38dac3be333c363a7f969763d09664fe
Shown source SHA256: fa6e5cef7e51c0ebc323a5cc531b8ece38dac3be333c363a7f969763d09664fe
Shown target SHA256: fa6e5cef7e51c0ebc323a5cc531b8ece38dac3be333c363a7f969763d09664fe

### Proposed decision

```json
{
  "claimId": "claim_bb445dab742b3604bd6ed4cf2f137a24",
  "sourceUnitDigest": "fa6e5cef7e51c0ebc323a5cc531b8ece38dac3be333c363a7f969763d09664fe",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "fa6e5cef7e51c0ebc323a5cc531b8ece38dac3be333c363a7f969763d09664fe",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.1. Area README"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-28 (lines 203–203) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-31 (lines 227–227); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The area README is the human-first portal into one platform area.
```

### Full target shown text

```text
The area README is the human-first portal into one platform area.
```

## claim_fdca8aae4b18332b3c266face26d711f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-29, lines 205–207.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-32.
Source digest: 2e5652d9c27b7d07fa187434ccef5562da890ece7695f3b0031808ed0e3df2b6
Target digest: 2e5652d9c27b7d07fa187434ccef5562da890ece7695f3b0031808ed0e3df2b6
Shown source SHA256: 2e5652d9c27b7d07fa187434ccef5562da890ece7695f3b0031808ed0e3df2b6
Shown target SHA256: 2e5652d9c27b7d07fa187434ccef5562da890ece7695f3b0031808ed0e3df2b6

### Proposed decision

```json
{
  "claimId": "claim_fdca8aae4b18332b3c266face26d711f",
  "sourceUnitDigest": "2e5652d9c27b7d07fa187434ccef5562da890ece7695f3b0031808ed0e3df2b6",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "2e5652d9c27b7d07fa187434ccef5562da890ece7695f3b0031808ed0e3df2b6",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.1. Area README"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-29 (lines 205–207) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-32 (lines 229–231); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It owns orientation, ownership summary, read-first routing, decision surface,
and participation path. It does not own exact behavior, detailed contracts, or
historical rationale.
```

### Full target shown text

```text
It owns orientation, ownership summary, read-first routing, decision surface,
and participation path. It does not own exact behavior, detailed contracts, or
historical rationale.
```

## claim_633a38f9007f749c215b3e4e5e4f8d43

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-30, lines 209–225.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-33.
Source digest: d64d2c5f2ffd2d4c22ec7a23b84b59969c059c384daa77e8c326f9eeb09feb90
Target digest: d64d2c5f2ffd2d4c22ec7a23b84b59969c059c384daa77e8c326f9eeb09feb90
Shown source SHA256: d64d2c5f2ffd2d4c22ec7a23b84b59969c059c384daa77e8c326f9eeb09feb90
Shown target SHA256: d64d2c5f2ffd2d4c22ec7a23b84b59969c059c384daa77e8c326f9eeb09feb90

### Proposed decision

```json
{
  "claimId": "claim_633a38f9007f749c215b3e4e5e4f8d43",
  "sourceUnitDigest": "d64d2c5f2ffd2d4c22ec7a23b84b59969c059c384daa77e8c326f9eeb09feb90",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "d64d2c5f2ffd2d4c22ec7a23b84b59969c059c384daa77e8c326f9eeb09feb90",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.1. Area README"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-30 (lines 209–225) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-33 (lines 233–249); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Required sections:

```txt
# <Area Name>

<metadata header>

## 1. What This Area Owns
## 2. Current Shape
## 3. Read First
## 4. Decision Surface
## 5. Canonical Documents
## 6. Key Contracts
## 7. Related Areas
## 8. How To Change This Area
## 9. Maintenance Notes
```
````

### Full target shown text

````text
Required sections:

```txt
# <Area Name>

<metadata header>

## 1. What This Area Owns
## 2. Current Shape
## 3. Read First
## 4. Decision Surface
## 5. Canonical Documents
## 6. Key Contracts
## 7. Related Areas
## 8. How To Change This Area
## 9. Maintenance Notes
```
````

## claim_30442ad0a727a8034107e3d883d28276

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-31, lines 227–227.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-34.
Source digest: fc51a154149d488529414c507991955a1145eb3b96f6f8178410d97eb1d551a9
Target digest: fc51a154149d488529414c507991955a1145eb3b96f6f8178410d97eb1d551a9
Shown source SHA256: fc51a154149d488529414c507991955a1145eb3b96f6f8178410d97eb1d551a9
Shown target SHA256: fc51a154149d488529414c507991955a1145eb3b96f6f8178410d97eb1d551a9

### Proposed decision

```json
{
  "claimId": "claim_30442ad0a727a8034107e3d883d28276",
  "sourceUnitDigest": "fc51a154149d488529414c507991955a1145eb3b96f6f8178410d97eb1d551a9",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "fc51a154149d488529414c507991955a1145eb3b96f6f8178410d97eb1d551a9",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.1. Area README"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-31 (lines 227–227) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-34 (lines 251–251); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`Decision Surface` is required, even when it says "No active open decision."
```

### Full target shown text

```text
`Decision Surface` is required, even when it says "No active open decision."
```

## claim_3d4c90701a614a9c95acb55eb8ef989c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#62-spec, lines 229–229.
Target: docs/platform/documentation/architecture/documentation-system-design.md#62-spec.
Source digest: a2cac21ec0c41a4c0a3a863e6e1aa6e7a1a0d3a2a46c03f06915563ee4fde2f9
Target digest: a2cac21ec0c41a4c0a3a863e6e1aa6e7a1a0d3a2a46c03f06915563ee4fde2f9
Shown source SHA256: 7c4f961f367c4d1f2e86b4135a6d6ad216a23c58a65a4690e64e16f3ff198198
Shown target SHA256: 7c4f961f367c4d1f2e86b4135a6d6ad216a23c58a65a4690e64e16f3ff198198

### Proposed decision

```json
{
  "claimId": "claim_3d4c90701a614a9c95acb55eb8ef989c",
  "sourceUnitDigest": "a2cac21ec0c41a4c0a3a863e6e1aa6e7a1a0d3a2a46c03f06915563ee4fde2f9",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "62-spec",
  "targetUnitDigest": "a2cac21ec0c41a4c0a3a863e6e1aa6e7a1a0d3a2a46c03f06915563ee4fde2f9",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#62-spec (lines 229–229) is carried at docs/platform/documentation/architecture/documentation-system-design.md#62-spec (lines 253–253); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.2. Spec

`spec.md` is the current behavior/state/reference layer for one area.

It answers: what does this area currently do, expose, preserve, and require?
It is not the home for long rationale, design alternatives, or raw history.

Required sections:

```txt
# Spec: <Area Name>

<metadata header>

## 1. Current Summary
## 2. Scope
## 3. Entry Points And Triggers
## 4. Actors And Access
## 5. Data / Concepts
## 6. Behaviors And Operations
## 7. Rules And Invariants
## 8. Contracts Owned
## 9. Contracts Consumed
## 10. Edge Cases Settled
## 11. Open Gaps
## 12. Verification
## 13. Pointers
## 14. Decision History Summary
```

Specs should be written in present tense. Open gaps must be explicit.
````

### Full target shown text

````text
### 6.2. Spec

`spec.md` is the current behavior/state/reference layer for one area.

It answers: what does this area currently do, expose, preserve, and require?
It is not the home for long rationale, design alternatives, or raw history.

Required sections:

```txt
# Spec: <Area Name>

<metadata header>

## 1. Current Summary
## 2. Scope
## 3. Entry Points And Triggers
## 4. Actors And Access
## 5. Data / Concepts
## 6. Behaviors And Operations
## 7. Rules And Invariants
## 8. Contracts Owned
## 9. Contracts Consumed
## 10. Edge Cases Settled
## 11. Open Gaps
## 12. Verification
## 13. Pointers
## 14. Decision History Summary
```

Specs should be written in present tense. Open gaps must be explicit.
````

## claim_4490af02d539634ecde98385387bfe2e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-32, lines 231–231.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-35.
Source digest: 5b50f2d296cda2f644570ba35b48046b389ab2101e9f219b29989e253b030ca9
Target digest: 5b50f2d296cda2f644570ba35b48046b389ab2101e9f219b29989e253b030ca9
Shown source SHA256: 5b50f2d296cda2f644570ba35b48046b389ab2101e9f219b29989e253b030ca9
Shown target SHA256: 5b50f2d296cda2f644570ba35b48046b389ab2101e9f219b29989e253b030ca9

### Proposed decision

```json
{
  "claimId": "claim_4490af02d539634ecde98385387bfe2e",
  "sourceUnitDigest": "5b50f2d296cda2f644570ba35b48046b389ab2101e9f219b29989e253b030ca9",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "5b50f2d296cda2f644570ba35b48046b389ab2101e9f219b29989e253b030ca9",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.2. Spec"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-32 (lines 231–231) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-35 (lines 255–255); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`spec.md` is the current behavior/state/reference layer for one area.
```

### Full target shown text

```text
`spec.md` is the current behavior/state/reference layer for one area.
```

## claim_9667c097d107d51f0fb9c83bedafa250

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-33, lines 233–234.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-36.
Source digest: bd6e1841d7d35ad06c710c87d41ea8b8c951d6af10d2e4e4f9c8c9f8896fd61b
Target digest: bd6e1841d7d35ad06c710c87d41ea8b8c951d6af10d2e4e4f9c8c9f8896fd61b
Shown source SHA256: bd6e1841d7d35ad06c710c87d41ea8b8c951d6af10d2e4e4f9c8c9f8896fd61b
Shown target SHA256: bd6e1841d7d35ad06c710c87d41ea8b8c951d6af10d2e4e4f9c8c9f8896fd61b

### Proposed decision

```json
{
  "claimId": "claim_9667c097d107d51f0fb9c83bedafa250",
  "sourceUnitDigest": "bd6e1841d7d35ad06c710c87d41ea8b8c951d6af10d2e4e4f9c8c9f8896fd61b",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "bd6e1841d7d35ad06c710c87d41ea8b8c951d6af10d2e4e4f9c8c9f8896fd61b",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.2. Spec"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-33 (lines 233–234) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-36 (lines 257–258); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It answers: what does this area currently do, expose, preserve, and require?
It is not the home for long rationale, design alternatives, or raw history.
```

### Full target shown text

```text
It answers: what does this area currently do, expose, preserve, and require?
It is not the home for long rationale, design alternatives, or raw history.
```

## claim_b1830c8030e9ae2415b6d2fe733922ef

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-34, lines 236–257.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-37.
Source digest: 07a2b94a02386cd9a6d205cb2212309c0ee5d106a89d013bb702440558d5d941
Target digest: 07a2b94a02386cd9a6d205cb2212309c0ee5d106a89d013bb702440558d5d941
Shown source SHA256: 07a2b94a02386cd9a6d205cb2212309c0ee5d106a89d013bb702440558d5d941
Shown target SHA256: 07a2b94a02386cd9a6d205cb2212309c0ee5d106a89d013bb702440558d5d941

### Proposed decision

```json
{
  "claimId": "claim_b1830c8030e9ae2415b6d2fe733922ef",
  "sourceUnitDigest": "07a2b94a02386cd9a6d205cb2212309c0ee5d106a89d013bb702440558d5d941",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "07a2b94a02386cd9a6d205cb2212309c0ee5d106a89d013bb702440558d5d941",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.2. Spec"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-34 (lines 236–257) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-37 (lines 260–281); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Required sections:

```txt
# Spec: <Area Name>

<metadata header>

## 1. Current Summary
## 2. Scope
## 3. Entry Points And Triggers
## 4. Actors And Access
## 5. Data / Concepts
## 6. Behaviors And Operations
## 7. Rules And Invariants
## 8. Contracts Owned
## 9. Contracts Consumed
## 10. Edge Cases Settled
## 11. Open Gaps
## 12. Verification
## 13. Pointers
## 14. Decision History Summary
```
````

### Full target shown text

````text
Required sections:

```txt
# Spec: <Area Name>

<metadata header>

## 1. Current Summary
## 2. Scope
## 3. Entry Points And Triggers
## 4. Actors And Access
## 5. Data / Concepts
## 6. Behaviors And Operations
## 7. Rules And Invariants
## 8. Contracts Owned
## 9. Contracts Consumed
## 10. Edge Cases Settled
## 11. Open Gaps
## 12. Verification
## 13. Pointers
## 14. Decision History Summary
```
````

## claim_9dff8df96cfe881ad7fe4a6ce5682302

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-35, lines 259–259.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-38.
Source digest: a429b211b10996685b65b8727a1c648dbb3dda459c075bc59b7b8af8cda5617a
Target digest: a429b211b10996685b65b8727a1c648dbb3dda459c075bc59b7b8af8cda5617a
Shown source SHA256: a429b211b10996685b65b8727a1c648dbb3dda459c075bc59b7b8af8cda5617a
Shown target SHA256: a429b211b10996685b65b8727a1c648dbb3dda459c075bc59b7b8af8cda5617a

### Proposed decision

```json
{
  "claimId": "claim_9dff8df96cfe881ad7fe4a6ce5682302",
  "sourceUnitDigest": "a429b211b10996685b65b8727a1c648dbb3dda459c075bc59b7b8af8cda5617a",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "a429b211b10996685b65b8727a1c648dbb3dda459c075bc59b7b8af8cda5617a",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.2. Spec"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-35 (lines 259–259) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-38 (lines 283–283); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Specs should be written in present tense. Open gaps must be explicit.
```

### Full target shown text

```text
Specs should be written in present tense. Open gaps must be explicit.
```

## claim_5cc5289781df6a7e332e8bc6494cc567

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#63-architecture, lines 261–261.
Target: docs/platform/documentation/architecture/documentation-system-design.md#63-architecture.
Source digest: 14afda834034704c40b1f07a2968e76765fd4cb67f21cdf5683116315454a14a
Target digest: 14afda834034704c40b1f07a2968e76765fd4cb67f21cdf5683116315454a14a
Shown source SHA256: c8c4ca8798a9717eb22706c61cc88a68d5a7bdb127c52f918b68f4762b81f04b
Shown target SHA256: c8c4ca8798a9717eb22706c61cc88a68d5a7bdb127c52f918b68f4762b81f04b

### Proposed decision

```json
{
  "claimId": "claim_5cc5289781df6a7e332e8bc6494cc567",
  "sourceUnitDigest": "14afda834034704c40b1f07a2968e76765fd4cb67f21cdf5683116315454a14a",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "63-architecture",
  "targetUnitDigest": "14afda834034704c40b1f07a2968e76765fd4cb67f21cdf5683116315454a14a",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#63-architecture (lines 261–261) is carried at docs/platform/documentation/architecture/documentation-system-design.md#63-architecture (lines 285–285); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.3. Architecture

Architecture docs are the why/shape/boundary/trade-off layer.

They answer: why is the system shaped this way, what boundaries matter, and what
would make the design change?

Required sections:

```txt
# <Architecture Topic>

<metadata header>

## 1. Problem And Forces
## 2. Chosen Shape
## 3. Boundaries And Responsibilities
## 4. Alternatives Considered
## 5. Trade-offs
## 6. Decision Surface
## 7. Consequences
## 8. Contracts Affected
## 9. Verification Expectations
## 10. Related Docs
```

Architecture docs should preserve meaningful rejected alternatives and dissent.
"No objections" is not the same as informed agreement.
````

### Full target shown text

````text
### 6.3. Architecture

Architecture docs are the why/shape/boundary/trade-off layer.

They answer: why is the system shaped this way, what boundaries matter, and what
would make the design change?

Required sections:

```txt
# <Architecture Topic>

<metadata header>

## 1. Problem And Forces
## 2. Chosen Shape
## 3. Boundaries And Responsibilities
## 4. Alternatives Considered
## 5. Trade-offs
## 6. Decision Surface
## 7. Consequences
## 8. Contracts Affected
## 9. Verification Expectations
## 10. Related Docs
```

Architecture docs should preserve meaningful rejected alternatives and dissent.
"No objections" is not the same as informed agreement.
````

## claim_a1eae8979080dfdc95ad6f27d3b48b9a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-36, lines 263–263.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-39.
Source digest: 8a053bf4b75bf9337190cd58926ff5b5d2ad4ce7d6c4364d5d3cd0725c4eb183
Target digest: 8a053bf4b75bf9337190cd58926ff5b5d2ad4ce7d6c4364d5d3cd0725c4eb183
Shown source SHA256: 8a053bf4b75bf9337190cd58926ff5b5d2ad4ce7d6c4364d5d3cd0725c4eb183
Shown target SHA256: 8a053bf4b75bf9337190cd58926ff5b5d2ad4ce7d6c4364d5d3cd0725c4eb183

### Proposed decision

```json
{
  "claimId": "claim_a1eae8979080dfdc95ad6f27d3b48b9a",
  "sourceUnitDigest": "8a053bf4b75bf9337190cd58926ff5b5d2ad4ce7d6c4364d5d3cd0725c4eb183",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "8a053bf4b75bf9337190cd58926ff5b5d2ad4ce7d6c4364d5d3cd0725c4eb183",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.3. Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-36 (lines 263–263) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-39 (lines 287–287); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Architecture docs are the why/shape/boundary/trade-off layer.
```

### Full target shown text

```text
Architecture docs are the why/shape/boundary/trade-off layer.
```

## claim_bb5e45cbee6f262d1b2270177f77150a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-37, lines 265–266.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-40.
Source digest: 8c9d1a50623ae3c1091170368e262d4d75f05e8c786d33add4e971dade8a9856
Target digest: 8c9d1a50623ae3c1091170368e262d4d75f05e8c786d33add4e971dade8a9856
Shown source SHA256: 8c9d1a50623ae3c1091170368e262d4d75f05e8c786d33add4e971dade8a9856
Shown target SHA256: 8c9d1a50623ae3c1091170368e262d4d75f05e8c786d33add4e971dade8a9856

### Proposed decision

```json
{
  "claimId": "claim_bb5e45cbee6f262d1b2270177f77150a",
  "sourceUnitDigest": "8c9d1a50623ae3c1091170368e262d4d75f05e8c786d33add4e971dade8a9856",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "8c9d1a50623ae3c1091170368e262d4d75f05e8c786d33add4e971dade8a9856",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.3. Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-37 (lines 265–266) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-40 (lines 289–290); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
They answer: why is the system shaped this way, what boundaries matter, and what
would make the design change?
```

### Full target shown text

```text
They answer: why is the system shaped this way, what boundaries matter, and what
would make the design change?
```

## claim_3769dab4ce79effdb12839b7ddc7de8e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-38, lines 268–285.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-41.
Source digest: 73e30094182a7f8ec0a221533aca131224608159c9fd8eb92cca224b79eaedee
Target digest: 73e30094182a7f8ec0a221533aca131224608159c9fd8eb92cca224b79eaedee
Shown source SHA256: 73e30094182a7f8ec0a221533aca131224608159c9fd8eb92cca224b79eaedee
Shown target SHA256: 73e30094182a7f8ec0a221533aca131224608159c9fd8eb92cca224b79eaedee

### Proposed decision

```json
{
  "claimId": "claim_3769dab4ce79effdb12839b7ddc7de8e",
  "sourceUnitDigest": "73e30094182a7f8ec0a221533aca131224608159c9fd8eb92cca224b79eaedee",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "73e30094182a7f8ec0a221533aca131224608159c9fd8eb92cca224b79eaedee",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.3. Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-38 (lines 268–285) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-41 (lines 292–309); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Required sections:

```txt
# <Architecture Topic>

<metadata header>

## 1. Problem And Forces
## 2. Chosen Shape
## 3. Boundaries And Responsibilities
## 4. Alternatives Considered
## 5. Trade-offs
## 6. Decision Surface
## 7. Consequences
## 8. Contracts Affected
## 9. Verification Expectations
## 10. Related Docs
```
````

### Full target shown text

````text
Required sections:

```txt
# <Architecture Topic>

<metadata header>

## 1. Problem And Forces
## 2. Chosen Shape
## 3. Boundaries And Responsibilities
## 4. Alternatives Considered
## 5. Trade-offs
## 6. Decision Surface
## 7. Consequences
## 8. Contracts Affected
## 9. Verification Expectations
## 10. Related Docs
```
````

## claim_4a601e518c65fea7a1a253faacc21220

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-39, lines 287–288.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-42.
Source digest: 6be61c56fd7b12fd267b20e5cc6738ace16e7d5ccf17c3707fd8df491cd302bb
Target digest: 6be61c56fd7b12fd267b20e5cc6738ace16e7d5ccf17c3707fd8df491cd302bb
Shown source SHA256: 6be61c56fd7b12fd267b20e5cc6738ace16e7d5ccf17c3707fd8df491cd302bb
Shown target SHA256: 6be61c56fd7b12fd267b20e5cc6738ace16e7d5ccf17c3707fd8df491cd302bb

### Proposed decision

```json
{
  "claimId": "claim_4a601e518c65fea7a1a253faacc21220",
  "sourceUnitDigest": "6be61c56fd7b12fd267b20e5cc6738ace16e7d5ccf17c3707fd8df491cd302bb",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "6be61c56fd7b12fd267b20e5cc6738ace16e7d5ccf17c3707fd8df491cd302bb",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.3. Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-39 (lines 287–288) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-42 (lines 311–312); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Architecture docs should preserve meaningful rejected alternatives and dissent.
"No objections" is not the same as informed agreement.
```

### Full target shown text

```text
Architecture docs should preserve meaningful rejected alternatives and dissent.
"No objections" is not the same as informed agreement.
```

## claim_b2c1b7b4ddeaa8a4e2821b9069b1ccb4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#64-contract, lines 290–290.
Target: docs/platform/documentation/architecture/documentation-system-design.md#64-contract.
Source digest: ea1304d1211b5b62c49f748ff396b823460201c4fc383ecc81f007620fb00bb7
Target digest: ea1304d1211b5b62c49f748ff396b823460201c4fc383ecc81f007620fb00bb7
Shown source SHA256: 0f0210c30588d4c68ace02b37d081e4f4d5bbcdceeb52c1195f1fbc704b10538
Shown target SHA256: 0f0210c30588d4c68ace02b37d081e4f4d5bbcdceeb52c1195f1fbc704b10538

### Proposed decision

```json
{
  "claimId": "claim_b2c1b7b4ddeaa8a4e2821b9069b1ccb4",
  "sourceUnitDigest": "ea1304d1211b5b62c49f748ff396b823460201c4fc383ecc81f007620fb00bb7",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "64-contract",
  "targetUnitDigest": "ea1304d1211b5b62c49f748ff396b823460201c4fc383ecc81f007620fb00bb7",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#64-contract (lines 290–290) is carried at docs/platform/documentation/architecture/documentation-system-design.md#64-contract (lines 314–314); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.4. Contract

Contracts are exact normative rules.

They answer: what must producers and consumers obey?

Required sections:

```txt
# Contract: <Name>

<metadata header>

## 1. Status And Authority
## 2. Parties
## 3. Definitions
## 4. Rules
## 5. Inputs And Outputs
## 6. Failure Behavior
## 7. Compatibility And Versioning
## 8. Examples
## 9. Verification
## 10. Change Procedure
## 11. Related Docs
```

Use explicit normative language: must, must not, may. Every normative rule
should be testable or have a named verification path.
````

### Full target shown text

````text
### 6.4. Contract

Contracts are exact normative rules.

They answer: what must producers and consumers obey?

Required sections:

```txt
# Contract: <Name>

<metadata header>

## 1. Status And Authority
## 2. Parties
## 3. Definitions
## 4. Rules
## 5. Inputs And Outputs
## 6. Failure Behavior
## 7. Compatibility And Versioning
## 8. Examples
## 9. Verification
## 10. Change Procedure
## 11. Related Docs
```

Use explicit normative language: must, must not, may. Every normative rule
should be testable or have a named verification path.
````

## claim_89d6421baac9bdc61612bf9962e5ba59

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-40, lines 292–292.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-43.
Source digest: 594ac9478ef8f4f04e0fcefc6acdffcc89290200b0cbae89e096626e058753ad
Target digest: 594ac9478ef8f4f04e0fcefc6acdffcc89290200b0cbae89e096626e058753ad
Shown source SHA256: 594ac9478ef8f4f04e0fcefc6acdffcc89290200b0cbae89e096626e058753ad
Shown target SHA256: 594ac9478ef8f4f04e0fcefc6acdffcc89290200b0cbae89e096626e058753ad

### Proposed decision

```json
{
  "claimId": "claim_89d6421baac9bdc61612bf9962e5ba59",
  "sourceUnitDigest": "594ac9478ef8f4f04e0fcefc6acdffcc89290200b0cbae89e096626e058753ad",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "594ac9478ef8f4f04e0fcefc6acdffcc89290200b0cbae89e096626e058753ad",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.4. Contract"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-40 (lines 292–292) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-43 (lines 316–316); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Contracts are exact normative rules.
```

### Full target shown text

```text
Contracts are exact normative rules.
```

## claim_f3815a0a6c95a93d905ed3c23e64b28e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-41, lines 294–294.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-44.
Source digest: c1ea9ec606c771d1e8842a417a4abf27c69637d043cc699c99c99bdbde7c3ed3
Target digest: c1ea9ec606c771d1e8842a417a4abf27c69637d043cc699c99c99bdbde7c3ed3
Shown source SHA256: c1ea9ec606c771d1e8842a417a4abf27c69637d043cc699c99c99bdbde7c3ed3
Shown target SHA256: c1ea9ec606c771d1e8842a417a4abf27c69637d043cc699c99c99bdbde7c3ed3

### Proposed decision

```json
{
  "claimId": "claim_f3815a0a6c95a93d905ed3c23e64b28e",
  "sourceUnitDigest": "c1ea9ec606c771d1e8842a417a4abf27c69637d043cc699c99c99bdbde7c3ed3",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "c1ea9ec606c771d1e8842a417a4abf27c69637d043cc699c99c99bdbde7c3ed3",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.4. Contract"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-41 (lines 294–294) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-44 (lines 318–318); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
They answer: what must producers and consumers obey?
```

### Full target shown text

```text
They answer: what must producers and consumers obey?
```

## claim_6c1fc1454feeb373576933637808fcbf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-42, lines 296–314.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-45.
Source digest: 729927aa9a9704f8485608d612ead94c95a822489ae0a50c357ab0181b606137
Target digest: 729927aa9a9704f8485608d612ead94c95a822489ae0a50c357ab0181b606137
Shown source SHA256: 729927aa9a9704f8485608d612ead94c95a822489ae0a50c357ab0181b606137
Shown target SHA256: 729927aa9a9704f8485608d612ead94c95a822489ae0a50c357ab0181b606137

### Proposed decision

```json
{
  "claimId": "claim_6c1fc1454feeb373576933637808fcbf",
  "sourceUnitDigest": "729927aa9a9704f8485608d612ead94c95a822489ae0a50c357ab0181b606137",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "729927aa9a9704f8485608d612ead94c95a822489ae0a50c357ab0181b606137",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.4. Contract"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-42 (lines 296–314) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-45 (lines 320–338); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Required sections:

```txt
# Contract: <Name>

<metadata header>

## 1. Status And Authority
## 2. Parties
## 3. Definitions
## 4. Rules
## 5. Inputs And Outputs
## 6. Failure Behavior
## 7. Compatibility And Versioning
## 8. Examples
## 9. Verification
## 10. Change Procedure
## 11. Related Docs
```
````

### Full target shown text

````text
Required sections:

```txt
# Contract: <Name>

<metadata header>

## 1. Status And Authority
## 2. Parties
## 3. Definitions
## 4. Rules
## 5. Inputs And Outputs
## 6. Failure Behavior
## 7. Compatibility And Versioning
## 8. Examples
## 9. Verification
## 10. Change Procedure
## 11. Related Docs
```
````

## claim_351ee5a96aad43fe1529e7c51cb7d7fe

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-43, lines 316–317.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-46.
Source digest: 095fc09e1bd5541c1123e562bc28eafc63d1bec6a66f08cfbba7f09654bed468
Target digest: 095fc09e1bd5541c1123e562bc28eafc63d1bec6a66f08cfbba7f09654bed468
Shown source SHA256: 095fc09e1bd5541c1123e562bc28eafc63d1bec6a66f08cfbba7f09654bed468
Shown target SHA256: 095fc09e1bd5541c1123e562bc28eafc63d1bec6a66f08cfbba7f09654bed468

### Proposed decision

```json
{
  "claimId": "claim_351ee5a96aad43fe1529e7c51cb7d7fe",
  "sourceUnitDigest": "095fc09e1bd5541c1123e562bc28eafc63d1bec6a66f08cfbba7f09654bed468",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "095fc09e1bd5541c1123e562bc28eafc63d1bec6a66f08cfbba7f09654bed468",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.4. Contract"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-43 (lines 316–317) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-46 (lines 340–341); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Use explicit normative language: must, must not, may. Every normative rule
should be testable or have a named verification path.
```

### Full target shown text

```text
Use explicit normative language: must, must not, may. Every normative rule
should be testable or have a named verification path.
```

## claim_78b02082a5f9e8a16338285287b2ae4f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#65-decision, lines 319–319.
Target: docs/platform/documentation/architecture/documentation-system-design.md#65-decision.
Source digest: dbb339665b5cebfe0ad1691df98435e500fcf54894ff011dd309680603cceea6
Target digest: dbb339665b5cebfe0ad1691df98435e500fcf54894ff011dd309680603cceea6
Shown source SHA256: 506c729ec184a3d96f0f9bb748dada27e9ab4598e95a5a6a3fe111de8289bfcc
Shown target SHA256: 506c729ec184a3d96f0f9bb748dada27e9ab4598e95a5a6a3fe111de8289bfcc

### Proposed decision

```json
{
  "claimId": "claim_78b02082a5f9e8a16338285287b2ae4f",
  "sourceUnitDigest": "dbb339665b5cebfe0ad1691df98435e500fcf54894ff011dd309680603cceea6",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "65-decision",
  "targetUnitDigest": "dbb339665b5cebfe0ad1691df98435e500fcf54894ff011dd309680603cceea6",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#65-decision (lines 319–319) is carried at docs/platform/documentation/architecture/documentation-system-design.md#65-decision (lines 343–343); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.5. Decision

Decision docs preserve decision provenance.

They answer: what was decided, why, by whom, against what alternatives, and what
does it supersede?

Required sections:

```txt
# Decision: <Title>

<metadata header>

## 1. Decision
## 2. Status
## 3. Context
## 4. Options Considered
## 5. Rationale
## 6. Consequences
## 7. Dissent / Uncertainty
## 8. Supersession
## 9. Evidence
## 10. Affected Docs
```

Historical decisions must not be rewritten to match today's rationale. Supersede
them with a new decision.
````

### Full target shown text

````text
### 6.5. Decision

Decision docs preserve decision provenance.

They answer: what was decided, why, by whom, against what alternatives, and what
does it supersede?

Required sections:

```txt
# Decision: <Title>

<metadata header>

## 1. Decision
## 2. Status
## 3. Context
## 4. Options Considered
## 5. Rationale
## 6. Consequences
## 7. Dissent / Uncertainty
## 8. Supersession
## 9. Evidence
## 10. Affected Docs
```

Historical decisions must not be rewritten to match today's rationale. Supersede
them with a new decision.
````

## claim_8fdb557df6dd625ce09745576635c6fd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-44, lines 321–321.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-47.
Source digest: 61e5f377381bd3064b68fb33129da2a20242004d57506d921fe905c7370780a0
Target digest: 61e5f377381bd3064b68fb33129da2a20242004d57506d921fe905c7370780a0
Shown source SHA256: 61e5f377381bd3064b68fb33129da2a20242004d57506d921fe905c7370780a0
Shown target SHA256: 61e5f377381bd3064b68fb33129da2a20242004d57506d921fe905c7370780a0

### Proposed decision

```json
{
  "claimId": "claim_8fdb557df6dd625ce09745576635c6fd",
  "sourceUnitDigest": "61e5f377381bd3064b68fb33129da2a20242004d57506d921fe905c7370780a0",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "61e5f377381bd3064b68fb33129da2a20242004d57506d921fe905c7370780a0",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.5. Decision"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-44 (lines 321–321) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-47 (lines 345–345); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Decision docs preserve decision provenance.
```

### Full target shown text

```text
Decision docs preserve decision provenance.
```

## claim_3978265e69b7c5b40006d62b4d220fb0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-45, lines 323–324.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-48.
Source digest: b85a798d195f0459667f39a33aa7951036656ce180d3c41e01b3633864d59070
Target digest: b85a798d195f0459667f39a33aa7951036656ce180d3c41e01b3633864d59070
Shown source SHA256: b85a798d195f0459667f39a33aa7951036656ce180d3c41e01b3633864d59070
Shown target SHA256: b85a798d195f0459667f39a33aa7951036656ce180d3c41e01b3633864d59070

### Proposed decision

```json
{
  "claimId": "claim_3978265e69b7c5b40006d62b4d220fb0",
  "sourceUnitDigest": "b85a798d195f0459667f39a33aa7951036656ce180d3c41e01b3633864d59070",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "b85a798d195f0459667f39a33aa7951036656ce180d3c41e01b3633864d59070",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.5. Decision"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-45 (lines 323–324) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-48 (lines 347–348); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
They answer: what was decided, why, by whom, against what alternatives, and what
does it supersede?
```

### Full target shown text

```text
They answer: what was decided, why, by whom, against what alternatives, and what
does it supersede?
```

## claim_ece6c0c84742bce2031467504e9938ef

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-46, lines 326–343.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-49.
Source digest: 70539863fd8f596c59f0553b6f80198ca5038736f814f8edafba857bdcaae014
Target digest: 70539863fd8f596c59f0553b6f80198ca5038736f814f8edafba857bdcaae014
Shown source SHA256: 70539863fd8f596c59f0553b6f80198ca5038736f814f8edafba857bdcaae014
Shown target SHA256: 70539863fd8f596c59f0553b6f80198ca5038736f814f8edafba857bdcaae014

### Proposed decision

```json
{
  "claimId": "claim_ece6c0c84742bce2031467504e9938ef",
  "sourceUnitDigest": "70539863fd8f596c59f0553b6f80198ca5038736f814f8edafba857bdcaae014",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "70539863fd8f596c59f0553b6f80198ca5038736f814f8edafba857bdcaae014",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.5. Decision"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-46 (lines 326–343) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-49 (lines 350–367); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Required sections:

```txt
# Decision: <Title>

<metadata header>

## 1. Decision
## 2. Status
## 3. Context
## 4. Options Considered
## 5. Rationale
## 6. Consequences
## 7. Dissent / Uncertainty
## 8. Supersession
## 9. Evidence
## 10. Affected Docs
```
````

### Full target shown text

````text
Required sections:

```txt
# Decision: <Title>

<metadata header>

## 1. Decision
## 2. Status
## 3. Context
## 4. Options Considered
## 5. Rationale
## 6. Consequences
## 7. Dissent / Uncertainty
## 8. Supersession
## 9. Evidence
## 10. Affected Docs
```
````

## claim_c00ad545812cdfe6169276b6e0fc3ca8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-47, lines 345–346.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-50.
Source digest: ebe3413bc64166bf28aef0d24b88f029917e9dd8ac1c5688abe32a090b569599
Target digest: ebe3413bc64166bf28aef0d24b88f029917e9dd8ac1c5688abe32a090b569599
Shown source SHA256: ebe3413bc64166bf28aef0d24b88f029917e9dd8ac1c5688abe32a090b569599
Shown target SHA256: ebe3413bc64166bf28aef0d24b88f029917e9dd8ac1c5688abe32a090b569599

### Proposed decision

```json
{
  "claimId": "claim_c00ad545812cdfe6169276b6e0fc3ca8",
  "sourceUnitDigest": "ebe3413bc64166bf28aef0d24b88f029917e9dd8ac1c5688abe32a090b569599",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "ebe3413bc64166bf28aef0d24b88f029917e9dd8ac1c5688abe32a090b569599",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.5. Decision"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-47 (lines 345–346) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-50 (lines 369–370); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Historical decisions must not be rewritten to match today's rationale. Supersede
them with a new decision.
```

### Full target shown text

```text
Historical decisions must not be rewritten to match today's rationale. Supersede
them with a new decision.
```

## claim_d64abab511ed186193d5a500f61e4e66

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#66-verification, lines 348–348.
Target: docs/platform/documentation/architecture/documentation-system-design.md#66-verification.
Source digest: f34dccafc52b6d4d06b9d27b45b6fbf8134b1517ec97a0d7f15f768426e2c607
Target digest: f34dccafc52b6d4d06b9d27b45b6fbf8134b1517ec97a0d7f15f768426e2c607
Shown source SHA256: 7d03481375e146b3a66b41aafbb5a4d6a1555c70c78b2d295723b3e439d01fe9
Shown target SHA256: 7d03481375e146b3a66b41aafbb5a4d6a1555c70c78b2d295723b3e439d01fe9

### Proposed decision

```json
{
  "claimId": "claim_d64abab511ed186193d5a500f61e4e66",
  "sourceUnitDigest": "f34dccafc52b6d4d06b9d27b45b6fbf8134b1517ec97a0d7f15f768426e2c607",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "66-verification",
  "targetUnitDigest": "f34dccafc52b6d4d06b9d27b45b6fbf8134b1517ec97a0d7f15f768426e2c607",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#66-verification (lines 348–348) is carried at docs/platform/documentation/architecture/documentation-system-design.md#66-verification (lines 372–372); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.6. Verification

Verification docs preserve proof.

They answer: what claim is proven, by what command/test/evidence, and what gaps
remain?

Required sections:

```txt
# Verification: <Claim>

<metadata header>

## 1. Claim
## 2. Acceptance Evidence
## 3. Procedure
## 4. Current Evidence Status
## 5. Known Gaps
## 6. Traceability
## 7. Related Docs
```
````

### Full target shown text

````text
### 6.6. Verification

Verification docs preserve proof.

They answer: what claim is proven, by what command/test/evidence, and what gaps
remain?

Required sections:

```txt
# Verification: <Claim>

<metadata header>

## 1. Claim
## 2. Acceptance Evidence
## 3. Procedure
## 4. Current Evidence Status
## 5. Known Gaps
## 6. Traceability
## 7. Related Docs
```
````

## claim_1cbde20917113433f4960aaef249b725

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-48, lines 350–350.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-51.
Source digest: b3523502b7b64292420795f41501c269f76915707d6be94a23ef71d4e69a007e
Target digest: b3523502b7b64292420795f41501c269f76915707d6be94a23ef71d4e69a007e
Shown source SHA256: b3523502b7b64292420795f41501c269f76915707d6be94a23ef71d4e69a007e
Shown target SHA256: b3523502b7b64292420795f41501c269f76915707d6be94a23ef71d4e69a007e

### Proposed decision

```json
{
  "claimId": "claim_1cbde20917113433f4960aaef249b725",
  "sourceUnitDigest": "b3523502b7b64292420795f41501c269f76915707d6be94a23ef71d4e69a007e",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "b3523502b7b64292420795f41501c269f76915707d6be94a23ef71d4e69a007e",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.6. Verification"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-48 (lines 350–350) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-51 (lines 374–374); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Verification docs preserve proof.
```

### Full target shown text

```text
Verification docs preserve proof.
```

## claim_2a872690c0874ab6b9f398e27e4143b6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-49, lines 352–353.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-52.
Source digest: 785db4626732da41a047f957ff6271710809d13c668998db421b41c1ac843880
Target digest: 785db4626732da41a047f957ff6271710809d13c668998db421b41c1ac843880
Shown source SHA256: 785db4626732da41a047f957ff6271710809d13c668998db421b41c1ac843880
Shown target SHA256: 785db4626732da41a047f957ff6271710809d13c668998db421b41c1ac843880

### Proposed decision

```json
{
  "claimId": "claim_2a872690c0874ab6b9f398e27e4143b6",
  "sourceUnitDigest": "785db4626732da41a047f957ff6271710809d13c668998db421b41c1ac843880",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "785db4626732da41a047f957ff6271710809d13c668998db421b41c1ac843880",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.6. Verification"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-49 (lines 352–353) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-52 (lines 376–377); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
They answer: what claim is proven, by what command/test/evidence, and what gaps
remain?
```

### Full target shown text

```text
They answer: what claim is proven, by what command/test/evidence, and what gaps
remain?
```

## claim_b48e1bf5b33c639754812ed7f4edaca0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-50, lines 355–369.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-53.
Source digest: 1db8ccb22ce3d5a7f718fefe34e6db4ae721cd717c4686282774672869641be3
Target digest: 1db8ccb22ce3d5a7f718fefe34e6db4ae721cd717c4686282774672869641be3
Shown source SHA256: 1db8ccb22ce3d5a7f718fefe34e6db4ae721cd717c4686282774672869641be3
Shown target SHA256: 1db8ccb22ce3d5a7f718fefe34e6db4ae721cd717c4686282774672869641be3

### Proposed decision

```json
{
  "claimId": "claim_b48e1bf5b33c639754812ed7f4edaca0",
  "sourceUnitDigest": "1db8ccb22ce3d5a7f718fefe34e6db4ae721cd717c4686282774672869641be3",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "1db8ccb22ce3d5a7f718fefe34e6db4ae721cd717c4686282774672869641be3",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.6. Verification"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-50 (lines 355–369) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-53 (lines 379–393); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Required sections:

```txt
# Verification: <Claim>

<metadata header>

## 1. Claim
## 2. Acceptance Evidence
## 3. Procedure
## 4. Current Evidence Status
## 5. Known Gaps
## 6. Traceability
## 7. Related Docs
```
````

### Full target shown text

````text
Required sections:

```txt
# Verification: <Claim>

<metadata header>

## 1. Claim
## 2. Acceptance Evidence
## 3. Procedure
## 4. Current Evidence Status
## 5. Known Gaps
## 6. Traceability
## 7. Related Docs
```
````

## claim_31f74a83e1fc18915da49fab099c662f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#67-proposal, lines 371–371.
Target: docs/platform/documentation/architecture/documentation-system-design.md#67-proposal.
Source digest: 20b02408e41a0a0a0f788f4785389595400b3a3ad1f5bc53f853acbac28f0689
Target digest: 20b02408e41a0a0a0f788f4785389595400b3a3ad1f5bc53f853acbac28f0689
Shown source SHA256: aaba948996eb38044f81349aaf579d341c6b71ff30567ba125b914a0af743095
Shown target SHA256: aaba948996eb38044f81349aaf579d341c6b71ff30567ba125b914a0af743095

### Proposed decision

```json
{
  "claimId": "claim_31f74a83e1fc18915da49fab099c662f",
  "sourceUnitDigest": "20b02408e41a0a0a0f788f4785389595400b3a3ad1f5bc53f853acbac28f0689",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "67-proposal",
  "targetUnitDigest": "20b02408e41a0a0a0f788f4785389595400b3a3ad1f5bc53f853acbac28f0689",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#67-proposal (lines 371–371) is carried at docs/platform/documentation/architecture/documentation-system-design.md#67-proposal (lines 395–395); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.7. Proposal

Proposals are non-canonical design candidates.

Required sections:

```txt
# Proposal: <Title>

<metadata header>

## 1. Problem
## 2. Proposed Change
## 3. Alternatives
## 4. Decision Requested
## 5. Impact Map
## 6. Unresolved Questions
## 7. Expiry / Promotion Outcome
```
````

### Full target shown text

````text
### 6.7. Proposal

Proposals are non-canonical design candidates.

Required sections:

```txt
# Proposal: <Title>

<metadata header>

## 1. Problem
## 2. Proposed Change
## 3. Alternatives
## 4. Decision Requested
## 5. Impact Map
## 6. Unresolved Questions
## 7. Expiry / Promotion Outcome
```
````

## claim_9f3a5845818a0c088285f0f17da08124

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-51, lines 373–373.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-54.
Source digest: d3cefa7c283ffd8101601749b1f835c2aff0b7abc1bdaaa9abcb6ee9c26817f9
Target digest: d3cefa7c283ffd8101601749b1f835c2aff0b7abc1bdaaa9abcb6ee9c26817f9
Shown source SHA256: d3cefa7c283ffd8101601749b1f835c2aff0b7abc1bdaaa9abcb6ee9c26817f9
Shown target SHA256: d3cefa7c283ffd8101601749b1f835c2aff0b7abc1bdaaa9abcb6ee9c26817f9

### Proposed decision

```json
{
  "claimId": "claim_9f3a5845818a0c088285f0f17da08124",
  "sourceUnitDigest": "d3cefa7c283ffd8101601749b1f835c2aff0b7abc1bdaaa9abcb6ee9c26817f9",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "d3cefa7c283ffd8101601749b1f835c2aff0b7abc1bdaaa9abcb6ee9c26817f9",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.7. Proposal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-51 (lines 373–373) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-54 (lines 397–397); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Proposals are non-canonical design candidates.
```

### Full target shown text

```text
Proposals are non-canonical design candidates.
```

## claim_c34ed91f11c9191d582c110878b27157

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-52, lines 375–389.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-55.
Source digest: 12507dc57884c5974f01f58b7eb7f6aa24bd44e67547e35294a242beacec84f8
Target digest: 12507dc57884c5974f01f58b7eb7f6aa24bd44e67547e35294a242beacec84f8
Shown source SHA256: 12507dc57884c5974f01f58b7eb7f6aa24bd44e67547e35294a242beacec84f8
Shown target SHA256: 12507dc57884c5974f01f58b7eb7f6aa24bd44e67547e35294a242beacec84f8

### Proposed decision

```json
{
  "claimId": "claim_c34ed91f11c9191d582c110878b27157",
  "sourceUnitDigest": "12507dc57884c5974f01f58b7eb7f6aa24bd44e67547e35294a242beacec84f8",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "12507dc57884c5974f01f58b7eb7f6aa24bd44e67547e35294a242beacec84f8",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.7. Proposal"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-52 (lines 375–389) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-55 (lines 399–413); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Required sections:

```txt
# Proposal: <Title>

<metadata header>

## 1. Problem
## 2. Proposed Change
## 3. Alternatives
## 4. Decision Requested
## 5. Impact Map
## 6. Unresolved Questions
## 7. Expiry / Promotion Outcome
```
````

### Full target shown text

````text
Required sections:

```txt
# Proposal: <Title>

<metadata header>

## 1. Problem
## 2. Proposed Change
## 3. Alternatives
## 4. Decision Requested
## 5. Impact Map
## 6. Unresolved Questions
## 7. Expiry / Promotion Outcome
```
````

## claim_ebd1ab9cf62cfd4fede7fedbbfd5233e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#68-discussion-scratchpad, lines 391–391.
Target: docs/platform/documentation/architecture/documentation-system-design.md#68-discussion-scratchpad.
Source digest: a03c790d600897c5d533055f94e30322f5fea2adb514aa34ef191ec00271566c
Target digest: a03c790d600897c5d533055f94e30322f5fea2adb514aa34ef191ec00271566c
Shown source SHA256: 99cc93219472d6a0530f1cd220e9a73aaf75bec48a6f94d6bf8d4f691e8d15ee
Shown target SHA256: 99cc93219472d6a0530f1cd220e9a73aaf75bec48a6f94d6bf8d4f691e8d15ee

### Proposed decision

```json
{
  "claimId": "claim_ebd1ab9cf62cfd4fede7fedbbfd5233e",
  "sourceUnitDigest": "a03c790d600897c5d533055f94e30322f5fea2adb514aa34ef191ec00271566c",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "68-discussion-scratchpad",
  "targetUnitDigest": "a03c790d600897c5d533055f94e30322f5fea2adb514aa34ef191ec00271566c",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#68-discussion-scratchpad (lines 391–391) is carried at docs/platform/documentation/architecture/documentation-system-design.md#68-discussion-scratchpad (lines 415–415); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.8. Discussion Scratchpad

`DISCUSSION.md` or `<topic>-discussion.md` is a temporary shaping artifact.

It is non-canonical.

Required sections:

```txt
# <Topic> Discussion

<metadata header>

## 1. Current Summary
## 2. Open Questions
## 3. Tentative Decisions
## 4. Promoted Decisions
## 5. Rejected / Parked Alternatives
## 6. Evidence And Source Links
## 7. Promotion Targets
## 8. Raw Discussion Log
```

Lifecycle:

```txt
Open -> Active -> Stabilizing -> Promoting -> Drained -> Delete/Archive
```

Default outcome is delete after promotion. Archive only when the discussion
itself has long-term diagnostic or rationale value.
````

### Full target shown text

````text
### 6.8. Discussion Scratchpad

`DISCUSSION.md` or `<topic>-discussion.md` is a temporary shaping artifact.

It is non-canonical.

Required sections:

```txt
# <Topic> Discussion

<metadata header>

## 1. Current Summary
## 2. Open Questions
## 3. Tentative Decisions
## 4. Promoted Decisions
## 5. Rejected / Parked Alternatives
## 6. Evidence And Source Links
## 7. Promotion Targets
## 8. Raw Discussion Log
```

Lifecycle:

```txt
Open -> Active -> Stabilizing -> Promoting -> Drained -> Delete/Archive
```

Default outcome is delete after promotion. Archive only when the discussion
itself has long-term diagnostic or rationale value.
````

## claim_08bf3479cdc72cbd5626886dd0697509

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-53, lines 393–395.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-56.
Source digest: 1f0ca305571095b5eafa28783e3b3bc4694aabcb5b8efc1969f76815327d9a53
Target digest: 1f0ca305571095b5eafa28783e3b3bc4694aabcb5b8efc1969f76815327d9a53
Shown source SHA256: 1f0ca305571095b5eafa28783e3b3bc4694aabcb5b8efc1969f76815327d9a53
Shown target SHA256: 1f0ca305571095b5eafa28783e3b3bc4694aabcb5b8efc1969f76815327d9a53

### Proposed decision

```json
{
  "claimId": "claim_08bf3479cdc72cbd5626886dd0697509",
  "sourceUnitDigest": "1f0ca305571095b5eafa28783e3b3bc4694aabcb5b8efc1969f76815327d9a53",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "1f0ca305571095b5eafa28783e3b3bc4694aabcb5b8efc1969f76815327d9a53",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.8. Discussion Scratchpad"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-53 (lines 393–395) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-56 (lines 417–419); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`DISCUSSION.md` or `<topic>-discussion.md` is a temporary shaping artifact.

It is non-canonical.
```

### Full target shown text

```text
`DISCUSSION.md` or `<topic>-discussion.md` is a temporary shaping artifact.

It is non-canonical.
```

## claim_1e3a4836d2029e595821ae0194af699b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-54, lines 397–412.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-57.
Source digest: 027a9f7824117c505d8b0808bca5689a4960e3189297665658a0e93b35afccf6
Target digest: 027a9f7824117c505d8b0808bca5689a4960e3189297665658a0e93b35afccf6
Shown source SHA256: 027a9f7824117c505d8b0808bca5689a4960e3189297665658a0e93b35afccf6
Shown target SHA256: 027a9f7824117c505d8b0808bca5689a4960e3189297665658a0e93b35afccf6

### Proposed decision

```json
{
  "claimId": "claim_1e3a4836d2029e595821ae0194af699b",
  "sourceUnitDigest": "027a9f7824117c505d8b0808bca5689a4960e3189297665658a0e93b35afccf6",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "027a9f7824117c505d8b0808bca5689a4960e3189297665658a0e93b35afccf6",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.8. Discussion Scratchpad"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-54 (lines 397–412) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-57 (lines 421–436); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Required sections:

```txt
# <Topic> Discussion

<metadata header>

## 1. Current Summary
## 2. Open Questions
## 3. Tentative Decisions
## 4. Promoted Decisions
## 5. Rejected / Parked Alternatives
## 6. Evidence And Source Links
## 7. Promotion Targets
## 8. Raw Discussion Log
```
````

### Full target shown text

````text
Required sections:

```txt
# <Topic> Discussion

<metadata header>

## 1. Current Summary
## 2. Open Questions
## 3. Tentative Decisions
## 4. Promoted Decisions
## 5. Rejected / Parked Alternatives
## 6. Evidence And Source Links
## 7. Promotion Targets
## 8. Raw Discussion Log
```
````

## claim_32afd8895c195467bb408d10c7c943df

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-55, lines 414–418.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-58.
Source digest: c0000ebfd3df6287bae1b1bdb4ce65226e2b20b6459b438f90475e8e0c3f8e07
Target digest: c0000ebfd3df6287bae1b1bdb4ce65226e2b20b6459b438f90475e8e0c3f8e07
Shown source SHA256: c0000ebfd3df6287bae1b1bdb4ce65226e2b20b6459b438f90475e8e0c3f8e07
Shown target SHA256: c0000ebfd3df6287bae1b1bdb4ce65226e2b20b6459b438f90475e8e0c3f8e07

### Proposed decision

```json
{
  "claimId": "claim_32afd8895c195467bb408d10c7c943df",
  "sourceUnitDigest": "c0000ebfd3df6287bae1b1bdb4ce65226e2b20b6459b438f90475e8e0c3f8e07",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "c0000ebfd3df6287bae1b1bdb4ce65226e2b20b6459b438f90475e8e0c3f8e07",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.8. Discussion Scratchpad"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-55 (lines 414–418) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-58 (lines 438–442); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Lifecycle:

```txt
Open -> Active -> Stabilizing -> Promoting -> Drained -> Delete/Archive
```
````

### Full target shown text

````text
Lifecycle:

```txt
Open -> Active -> Stabilizing -> Promoting -> Drained -> Delete/Archive
```
````

## claim_5bc8ae00baf33aaf2e81f117889bfff3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-56, lines 420–421.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-59.
Source digest: 70bb778b7d179defd966d97e11c4a672841eb8bd46b72fdc50ee0e57e2e7e325
Target digest: 70bb778b7d179defd966d97e11c4a672841eb8bd46b72fdc50ee0e57e2e7e325
Shown source SHA256: 70bb778b7d179defd966d97e11c4a672841eb8bd46b72fdc50ee0e57e2e7e325
Shown target SHA256: 70bb778b7d179defd966d97e11c4a672841eb8bd46b72fdc50ee0e57e2e7e325

### Proposed decision

```json
{
  "claimId": "claim_5bc8ae00baf33aaf2e81f117889bfff3",
  "sourceUnitDigest": "70bb778b7d179defd966d97e11c4a672841eb8bd46b72fdc50ee0e57e2e7e325",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "70bb778b7d179defd966d97e11c4a672841eb8bd46b72fdc50ee0e57e2e7e325",
  "targetAncestry": [
    "Documentation System Design",
    "6. Document Model",
    "6.8. Discussion Scratchpad"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-56 (lines 420–421) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-59 (lines 444–445); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Default outcome is delete after promotion. Archive only when the discussion
itself has long-term diagnostic or rationale value.
```

### Full target shown text

```text
Default outcome is delete after promotion. Archive only when the discussion
itself has long-term diagnostic or rationale value.
```

## claim_8e59ae39b9be31af962f6ac9371f7b99

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#7-authority-matrix, lines 423–423.
Target: docs/platform/documentation/architecture/documentation-system-design.md#7-authority-matrix.
Source digest: ecc8e8d177ef29cc65a150df4ca9f96869783b9f976cce69a2a0554bf13d8155
Target digest: ecc8e8d177ef29cc65a150df4ca9f96869783b9f976cce69a2a0554bf13d8155
Shown source SHA256: b9bc98f1810fc194d3180e8b51d7b68937e41bad3bd9b35bc4b21fe3f0c2c02e
Shown target SHA256: b9bc98f1810fc194d3180e8b51d7b68937e41bad3bd9b35bc4b21fe3f0c2c02e

### Proposed decision

```json
{
  "claimId": "claim_8e59ae39b9be31af962f6ac9371f7b99",
  "sourceUnitDigest": "ecc8e8d177ef29cc65a150df4ca9f96869783b9f976cce69a2a0554bf13d8155",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "7-authority-matrix",
  "targetUnitDigest": "ecc8e8d177ef29cc65a150df4ca9f96869783b9f976cce69a2a0554bf13d8155",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#7-authority-matrix (lines 423–423) is carried at docs/platform/documentation/architecture/documentation-system-design.md#7-authority-matrix (lines 447–447); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 7. Authority Matrix

| Artifact | Authority | May establish | Must not establish |
|---|---|---|---|
| Discussion scratchpad | Non-canonical | Open questions, alternatives, evidence, provisional reasoning | Current behavior, binding rules, settled decisions |
| Spec | Canonical state authority | Current behavior, shared entities, observable flows | Long rationale or hidden design alternatives |
| Architecture | Canonical design authority | Why, boundaries, responsibility allocation, trade-offs | Detailed current implementation state as timeless truth |
| Contract | Canonical normative authority | Exact obligations, invariants, inputs/outputs, compatibility, handoff rules | Ambiguous rationale or optional guidance phrased as mandatory |
| Decision | Canonical decision provenance | Who decided what, when, why, alternatives, supersession | Silent rewriting of historical intent |
| Generated doc/index | Derived authority only | Faithful projection of declared sources | New policy, interpretation, independently edited facts |
| Guide/runbook | Operational guidance | Supported procedures and recovery paths | Override specs or contracts |
| History | Archive/evidence | Retired source material and context | Current authority |

Conflict rules:

- Contract overrides guide/runbook.
- Current spec overrides stale architecture wording about present behavior.
- Newer approved decision supersedes older decision.
- Generated output never overrides its source.
- A conflict is a documentation defect. It must be surfaced and reconciled, not
  silently fixed by an agent.
```

### Full target shown text

```text
## 7. Authority Matrix

| Artifact | Authority | May establish | Must not establish |
|---|---|---|---|
| Discussion scratchpad | Non-canonical | Open questions, alternatives, evidence, provisional reasoning | Current behavior, binding rules, settled decisions |
| Spec | Canonical state authority | Current behavior, shared entities, observable flows | Long rationale or hidden design alternatives |
| Architecture | Canonical design authority | Why, boundaries, responsibility allocation, trade-offs | Detailed current implementation state as timeless truth |
| Contract | Canonical normative authority | Exact obligations, invariants, inputs/outputs, compatibility, handoff rules | Ambiguous rationale or optional guidance phrased as mandatory |
| Decision | Canonical decision provenance | Who decided what, when, why, alternatives, supersession | Silent rewriting of historical intent |
| Generated doc/index | Derived authority only | Faithful projection of declared sources | New policy, interpretation, independently edited facts |
| Guide/runbook | Operational guidance | Supported procedures and recovery paths | Override specs or contracts |
| History | Archive/evidence | Retired source material and context | Current authority |

Conflict rules:

- Contract overrides guide/runbook.
- Current spec overrides stale architecture wording about present behavior.
- Newer approved decision supersedes older decision.
- Generated output never overrides its source.
- A conflict is a documentation defect. It must be surfaced and reconciled, not
  silently fixed by an agent.
```

## claim_12d27cd83c4c655e67945fc659870fda

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-57, lines 425–434.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-60.
Source digest: 6cea4233919d2d447db1b45115eebafd11253d39e42dcd09db3b5079718bfe0e
Target digest: 6cea4233919d2d447db1b45115eebafd11253d39e42dcd09db3b5079718bfe0e
Shown source SHA256: 6cea4233919d2d447db1b45115eebafd11253d39e42dcd09db3b5079718bfe0e
Shown target SHA256: 6cea4233919d2d447db1b45115eebafd11253d39e42dcd09db3b5079718bfe0e

### Proposed decision

```json
{
  "claimId": "claim_12d27cd83c4c655e67945fc659870fda",
  "sourceUnitDigest": "6cea4233919d2d447db1b45115eebafd11253d39e42dcd09db3b5079718bfe0e",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "6cea4233919d2d447db1b45115eebafd11253d39e42dcd09db3b5079718bfe0e",
  "targetAncestry": [
    "Documentation System Design",
    "7. Authority Matrix"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-57 (lines 425–434) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-60 (lines 449–458); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
| Artifact | Authority | May establish | Must not establish |
|---|---|---|---|
| Discussion scratchpad | Non-canonical | Open questions, alternatives, evidence, provisional reasoning | Current behavior, binding rules, settled decisions |
| Spec | Canonical state authority | Current behavior, shared entities, observable flows | Long rationale or hidden design alternatives |
| Architecture | Canonical design authority | Why, boundaries, responsibility allocation, trade-offs | Detailed current implementation state as timeless truth |
| Contract | Canonical normative authority | Exact obligations, invariants, inputs/outputs, compatibility, handoff rules | Ambiguous rationale or optional guidance phrased as mandatory |
| Decision | Canonical decision provenance | Who decided what, when, why, alternatives, supersession | Silent rewriting of historical intent |
| Generated doc/index | Derived authority only | Faithful projection of declared sources | New policy, interpretation, independently edited facts |
| Guide/runbook | Operational guidance | Supported procedures and recovery paths | Override specs or contracts |
| History | Archive/evidence | Retired source material and context | Current authority |
```

### Full target shown text

```text
| Artifact | Authority | May establish | Must not establish |
|---|---|---|---|
| Discussion scratchpad | Non-canonical | Open questions, alternatives, evidence, provisional reasoning | Current behavior, binding rules, settled decisions |
| Spec | Canonical state authority | Current behavior, shared entities, observable flows | Long rationale or hidden design alternatives |
| Architecture | Canonical design authority | Why, boundaries, responsibility allocation, trade-offs | Detailed current implementation state as timeless truth |
| Contract | Canonical normative authority | Exact obligations, invariants, inputs/outputs, compatibility, handoff rules | Ambiguous rationale or optional guidance phrased as mandatory |
| Decision | Canonical decision provenance | Who decided what, when, why, alternatives, supersession | Silent rewriting of historical intent |
| Generated doc/index | Derived authority only | Faithful projection of declared sources | New policy, interpretation, independently edited facts |
| Guide/runbook | Operational guidance | Supported procedures and recovery paths | Override specs or contracts |
| History | Archive/evidence | Retired source material and context | Current authority |
```

## claim_789776ed6c63b9b48f0f6c302840fca6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-58, lines 436–443.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-61.
Source digest: 03476e57c33e5f14e1e1e0034ba3d7c13b9d945a01bc35ca8e9a3fc6a6f15372
Target digest: 03476e57c33e5f14e1e1e0034ba3d7c13b9d945a01bc35ca8e9a3fc6a6f15372
Shown source SHA256: 03476e57c33e5f14e1e1e0034ba3d7c13b9d945a01bc35ca8e9a3fc6a6f15372
Shown target SHA256: 03476e57c33e5f14e1e1e0034ba3d7c13b9d945a01bc35ca8e9a3fc6a6f15372

### Proposed decision

```json
{
  "claimId": "claim_789776ed6c63b9b48f0f6c302840fca6",
  "sourceUnitDigest": "03476e57c33e5f14e1e1e0034ba3d7c13b9d945a01bc35ca8e9a3fc6a6f15372",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-61",
  "targetUnitDigest": "03476e57c33e5f14e1e1e0034ba3d7c13b9d945a01bc35ca8e9a3fc6a6f15372",
  "targetAncestry": [
    "Documentation System Design",
    "7. Authority Matrix"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-58 (lines 436–443) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-61 (lines 460–467); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Conflict rules:

- Contract overrides guide/runbook.
- Current spec overrides stale architecture wording about present behavior.
- Newer approved decision supersedes older decision.
- Generated output never overrides its source.
- A conflict is a documentation defect. It must be surfaced and reconciled, not
  silently fixed by an agent.
```

### Full target shown text

```text
Conflict rules:

- Contract overrides guide/runbook.
- Current spec overrides stale architecture wording about present behavior.
- Newer approved decision supersedes older decision.
- Generated output never overrides its source.
- A conflict is a documentation defect. It must be surfaced and reconciled, not
  silently fixed by an agent.
```
