# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-15-readme.json
Original shard SHA256: 8d9c585b94dc3ab40e8cde64f4cf8180a51875ace2c45c4ecbae0988dfbc3811
Source file: docs/architect/proposals/README.md
Part 1/1; entries: **8**. Source-file group 15/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (5): `claim_5f915941b6acdfb3a08345abf0e0719e`, `claim_69cd8997c627f22f069222676cc25e4d`, `claim_76cd5a79f79a23ddf7bf30b53312aadf`, `claim_86499a247b54e7e84a84c9cb0f477242`, `claim_f8e206eea9c8d807bb63e249dbc858f4`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 8; reviewer chooses and records seed and IDs for at least 8 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 8 affected rows.

```json
[
  {
    "type": "decision-loss-without-partial-carry",
    "message": "claim claim_5f915941b6acdfb3a08345abf0e0719e: the rationale says content is missing; a unit that loses anything is a partial-carry with a remainder, not supersede",
    "path": "docs/architect/proposals/README.md"
  },
  {
    "type": "decision-loss-without-partial-carry",
    "message": "claim claim_25b51a36a5abf6a4190291ac4da1f037: the rationale says content is missing; a unit that loses anything is a partial-carry with a remainder, not supersede",
    "path": "docs/architect/proposals/README.md"
  },
  {
    "type": "decision-loss-without-partial-carry",
    "message": "claim claim_09af0f2aa436ddd0e9171a866767c99b: the rationale says content is missing; a unit that loses anything is a partial-carry with a remainder, not supersede",
    "path": "docs/architect/proposals/README.md"
  },
  {
    "type": "decision-loss-without-partial-carry",
    "message": "claim claim_5ccfd7d5fd348491b4c0d6b9c9bfc7f3: the rationale says content is missing; a unit that loses anything is a partial-carry with a remainder, not supersede",
    "path": "docs/architect/proposals/README.md"
  },
  {
    "type": "decision-loss-without-partial-carry",
    "message": "claim claim_69cd8997c627f22f069222676cc25e4d: the rationale says content is missing; a unit that loses anything is a partial-carry with a remainder, not supersede",
    "path": "docs/architect/proposals/README.md"
  },
  {
    "type": "decision-loss-without-partial-carry",
    "message": "claim claim_76cd5a79f79a23ddf7bf30b53312aadf: the rationale says content is missing; a unit that loses anything is a partial-carry with a remainder, not supersede",
    "path": "docs/architect/proposals/README.md"
  },
  {
    "type": "decision-loss-without-partial-carry",
    "message": "claim claim_86499a247b54e7e84a84c9cb0f477242: the rationale says content is missing; a unit that loses anything is a partial-carry with a remainder, not supersede",
    "path": "docs/architect/proposals/README.md"
  },
  {
    "type": "decision-loss-without-partial-carry",
    "message": "claim claim_f8e206eea9c8d807bb63e249dbc858f4: the rationale says content is missing; a unit that loses anything is a partial-carry with a remainder, not supersede",
    "path": "docs/architect/proposals/README.md"
  }
]
```

## claim_5f915941b6acdfb3a08345abf0e0719e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/README.md#architect-level-proposals, lines 1–1.
Target: docs/platform/proposals/README.md#architect-level-proposals.
Source digest: 5c24a592f7b19694cd316b58db92a582e861d992ade3752bc722824e49941fca
Target digest: 03330e9b08cb144dc36c76550e849444c3e07f5a13ec984602cf4268698e6fc6
Shown source SHA256: 09d9bfb256ec2d59a8fb61bc432e390ce5cac61c4c939035cc7bce5a72119155
Shown target SHA256: 78a218ea10fae4ebd2b6413a3d131c61e4b5d4c3bb95a858faadcc2b21cb9ace

### Proposed decision

```json
{
  "claimId": "claim_5f915941b6acdfb3a08345abf0e0719e",
  "sourceUnitDigest": "5c24a592f7b19694cd316b58db92a582e861d992ade3752bc722824e49941fca",
  "targetOwner": "docs/platform/proposals/README.md",
  "targetAnchor": "architect-level-proposals",
  "targetUnitDigest": "03330e9b08cb144dc36c76550e849444c3e07f5a13ec984602cf4268698e6fc6",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#architect-level-proposals (lines 1–1) is carried at docs/platform/proposals/README.md#architect-level-proposals (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
# Architect-Level Proposals

Document type: Index
Design status: Discussion
Implementation: Not started unless each proposal says otherwise
Last reviewed: 2026-09-02

This folder holds proposals whose scope crosses one architecture area. A file
staying here means it is still a proposal, not accepted architecture. Once
accepted, extract the settled design into the relevant architect-level or
area-specific canonical document and leave the proposal as history.

Area-specific proposals stay under that area's own `proposals/` folder until
their scope crosses the area boundary.
```

### Full target shown text

````text
# Architect-Level Proposals

```txt
Document type: Collection index
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/README.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 48a80d339a1f676a56153bac6677895e0d4eb377
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/README.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/README.md).


Document type: Index
Design status: Discussion
Implementation: Not started unless each proposal says otherwise
Last reviewed: 2026-09-02

This folder holds proposals whose scope crosses one architecture area. A file
staying here means it is still a proposal, not accepted architecture. Once
accepted, extract the settled design into the relevant architect-level or
area-specific canonical document and leave the proposal as history.

Area-specific proposals stay under that area's own `proposals/` folder until
their scope crosses the area boundary.
````

## claim_25b51a36a5abf6a4190291ac4da1f037

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/README.md#unheaded-block-1, lines 3–6.
Target: docs/platform/proposals/README.md#unheaded-block-4.
Source digest: a53e19b7b54a5568a7e7b6fdaabb2f786438aa6642d8d6629cecbd6a75326fdf
Target digest: a53e19b7b54a5568a7e7b6fdaabb2f786438aa6642d8d6629cecbd6a75326fdf
Shown source SHA256: a53e19b7b54a5568a7e7b6fdaabb2f786438aa6642d8d6629cecbd6a75326fdf
Shown target SHA256: a53e19b7b54a5568a7e7b6fdaabb2f786438aa6642d8d6629cecbd6a75326fdf

### Proposed decision

```json
{
  "claimId": "claim_25b51a36a5abf6a4190291ac4da1f037",
  "sourceUnitDigest": "a53e19b7b54a5568a7e7b6fdaabb2f786438aa6642d8d6629cecbd6a75326fdf",
  "targetOwner": "docs/platform/proposals/README.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "a53e19b7b54a5568a7e7b6fdaabb2f786438aa6642d8d6629cecbd6a75326fdf",
  "targetAncestry": [
    "Architect-Level Proposals"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: document exact share below one half. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-1 (lines 3–6) is carried at docs/platform/proposals/README.md#unheaded-block-4 (lines 27–30); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Document type: Index
Design status: Discussion
Implementation: Not started unless each proposal says otherwise
Last reviewed: 2026-09-02
```

### Full target shown text

```text
Document type: Index
Design status: Discussion
Implementation: Not started unless each proposal says otherwise
Last reviewed: 2026-09-02
```

## claim_09af0f2aa436ddd0e9171a866767c99b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/README.md#unheaded-block-2, lines 8–11.
Target: docs/platform/proposals/README.md#unheaded-block-5.
Source digest: dfb4844a6695230f763089717cda3e5ad8eeeb30f1b01308fa9beeb75eb3d5af
Target digest: dfb4844a6695230f763089717cda3e5ad8eeeb30f1b01308fa9beeb75eb3d5af
Shown source SHA256: dfb4844a6695230f763089717cda3e5ad8eeeb30f1b01308fa9beeb75eb3d5af
Shown target SHA256: dfb4844a6695230f763089717cda3e5ad8eeeb30f1b01308fa9beeb75eb3d5af

### Proposed decision

```json
{
  "claimId": "claim_09af0f2aa436ddd0e9171a866767c99b",
  "sourceUnitDigest": "dfb4844a6695230f763089717cda3e5ad8eeeb30f1b01308fa9beeb75eb3d5af",
  "targetOwner": "docs/platform/proposals/README.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "dfb4844a6695230f763089717cda3e5ad8eeeb30f1b01308fa9beeb75eb3d5af",
  "targetAncestry": [
    "Architect-Level Proposals"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: document exact share below one half. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-2 (lines 8–11) is carried at docs/platform/proposals/README.md#unheaded-block-5 (lines 32–35); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This folder holds proposals whose scope crosses one architecture area. A file
staying here means it is still a proposal, not accepted architecture. Once
accepted, extract the settled design into the relevant architect-level or
area-specific canonical document and leave the proposal as history.
```

### Full target shown text

```text
This folder holds proposals whose scope crosses one architecture area. A file
staying here means it is still a proposal, not accepted architecture. Once
accepted, extract the settled design into the relevant architect-level or
area-specific canonical document and leave the proposal as history.
```

## claim_5ccfd7d5fd348491b4c0d6b9c9bfc7f3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/README.md#unheaded-block-3, lines 13–14.
Target: docs/platform/proposals/README.md#unheaded-block-6.
Source digest: 4ed866e51da4c0c7312090bdaf830f6bfe2310113698960d6d81412fdbb41e72
Target digest: 4ed866e51da4c0c7312090bdaf830f6bfe2310113698960d6d81412fdbb41e72
Shown source SHA256: 4ed866e51da4c0c7312090bdaf830f6bfe2310113698960d6d81412fdbb41e72
Shown target SHA256: 4ed866e51da4c0c7312090bdaf830f6bfe2310113698960d6d81412fdbb41e72

### Proposed decision

```json
{
  "claimId": "claim_5ccfd7d5fd348491b4c0d6b9c9bfc7f3",
  "sourceUnitDigest": "4ed866e51da4c0c7312090bdaf830f6bfe2310113698960d6d81412fdbb41e72",
  "targetOwner": "docs/platform/proposals/README.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "4ed866e51da4c0c7312090bdaf830f6bfe2310113698960d6d81412fdbb41e72",
  "targetAncestry": [
    "Architect-Level Proposals"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: document exact share below one half. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-3 (lines 13–14) is carried at docs/platform/proposals/README.md#unheaded-block-6 (lines 37–38); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Area-specific proposals stay under that area's own `proposals/` folder until
their scope crosses the area boundary.
```

### Full target shown text

```text
Area-specific proposals stay under that area's own `proposals/` folder until
their scope crosses the area boundary.
```

## claim_69cd8997c627f22f069222676cc25e4d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/README.md#active-proposals, lines 16–16.
Target: docs/platform/proposals/README.md#active-proposals.
Source digest: 35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93
Target digest: d836846ddf01300cd1a50ab447e19e2c6b478104bf0621e9f044b37446c2feb4
Shown source SHA256: 8634b7ca6bb0142c8a525a2c802e1c82a34bb29704a54ba864011eae43d3a286
Shown target SHA256: 0972d49b75ebc949291c332910cb48278baa91fe86ffc3888d6724de72d9caff

### Proposed decision

```json
{
  "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
  "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
  "targetOwner": "docs/platform/proposals/README.md",
  "targetAnchor": "active-proposals",
  "targetUnitDigest": "d836846ddf01300cd1a50ab447e19e2c6b478104bf0621e9f044b37446c2feb4",
  "targetAncestry": [
    "Architect-Level Proposals"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Active Proposals

- [Coordination Capability Envelope](coordination-capability-envelope.md) —
  discussion following the independent review: three architecture families,
  hard/soft boundaries, recommendation, migration responsibilities, and probes;
  not an accepted architecture or implementation plan.
- [Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)
- [Architecture Advisory Panel](architecture-advisory-panel.md) — the next
  Group Thinking use case after `fgos-code-panel`: investigate and frame a
  software-system problem, deliberate on architectures, advise a person, and
  support a bounded decision dialogue.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)
- [Component Authority Boundary Map](component-authority-boundary-map.md)
```

### Full target shown text

```text
## Active Proposals

- [Coordination Capability Envelope](../../architect/proposals/coordination-capability-envelope.md) —
  discussion following the independent review: three architecture families,
  hard/soft boundaries, recommendation, migration responsibilities, and probes;
  not an accepted architecture or implementation plan.
- [Step 09: Group Thinking Substrate](../../architect/proposals/step-09-group-thinking-substrate.md)
- [Architecture Advisory Panel](../../architect/proposals/architecture-advisory-panel.md) — the next
  Group Thinking use case after `fgos-code-panel`: investigate and frame a
  software-system problem, deliberate on architectures, advise a person, and
  support a bounded decision dialogue.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](../../architect/proposals/step-10-coding-domain-adoption.md)
- [Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md)
```

## claim_76cd5a79f79a23ddf7bf30b53312aadf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/README.md#unheaded-block-4, lines 18–28.
Target: docs/platform/proposals/README.md#unheaded-block-7.
Source digest: 949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0
Target digest: 3d3d1d86ca10ef2ed0b784f13f86a69a4f06b906a73fcdf2eeca096c8119b5c0
Shown source SHA256: 949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0
Shown target SHA256: 3d3d1d86ca10ef2ed0b784f13f86a69a4f06b906a73fcdf2eeca096c8119b5c0

### Proposed decision

```json
{
  "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
  "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
  "targetOwner": "docs/platform/proposals/README.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "3d3d1d86ca10ef2ed0b784f13f86a69a4f06b906a73fcdf2eeca096c8119b5c0",
  "targetAncestry": [
    "Architect-Level Proposals",
    "Active Proposals"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- [Coordination Capability Envelope](coordination-capability-envelope.md) —
  discussion following the independent review: three architecture families,
  hard/soft boundaries, recommendation, migration responsibilities, and probes;
  not an accepted architecture or implementation plan.
- [Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)
- [Architecture Advisory Panel](architecture-advisory-panel.md) — the next
  Group Thinking use case after `fgos-code-panel`: investigate and frame a
  software-system problem, deliberate on architectures, advise a person, and
  support a bounded decision dialogue.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)
- [Component Authority Boundary Map](component-authority-boundary-map.md)
```

### Full target shown text

```text
- [Coordination Capability Envelope](../../architect/proposals/coordination-capability-envelope.md) —
  discussion following the independent review: three architecture families,
  hard/soft boundaries, recommendation, migration responsibilities, and probes;
  not an accepted architecture or implementation plan.
- [Step 09: Group Thinking Substrate](../../architect/proposals/step-09-group-thinking-substrate.md)
- [Architecture Advisory Panel](../../architect/proposals/architecture-advisory-panel.md) — the next
  Group Thinking use case after `fgos-code-panel`: investigate and frame a
  software-system problem, deliberate on architectures, advise a person, and
  support a bounded decision dialogue.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](../../architect/proposals/step-10-coding-domain-adoption.md)
- [Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md)
```

## claim_86499a247b54e7e84a84c9cb0f477242

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/README.md#handoff-prompts, lines 30–30.
Target: docs/platform/proposals/README.md#handoff-prompts.
Source digest: a8367c95c72c4487eeb5157751fbacafc5293909f9720e69aa24993e050a5a53
Target digest: 29d4d8ed08d8c765ae18fcd142e04c8ec693283df3c17e35ad468ad9e9480956
Shown source SHA256: 77c79effb86fc535f2911fd310ab009100c7165244e9143ae8347b25351422a4
Shown target SHA256: 5416f820a219a8241b5767658b5b7193a00f39dd6adaf5aed8e7d6ccd488ad75

### Proposed decision

```json
{
  "claimId": "claim_86499a247b54e7e84a84c9cb0f477242",
  "sourceUnitDigest": "a8367c95c72c4487eeb5157751fbacafc5293909f9720e69aa24993e050a5a53",
  "targetOwner": "docs/platform/proposals/README.md",
  "targetAnchor": "handoff-prompts",
  "targetUnitDigest": "29d4d8ed08d8c765ae18fcd142e04c8ec693283df3c17e35ad468ad9e9480956",
  "targetAncestry": [
    "Architect-Level Proposals"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#handoff-prompts (lines 30–30) is carried at docs/platform/proposals/README.md#handoff-prompts (lines 54–54); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Handoff Prompts

- [Step 09 / Step 10 Replan Handoff Prompt](step-09-step-10-replan-handoff-prompt.md)
```

### Full target shown text

```text
## Handoff Prompts

- [Step 09 / Step 10 Replan Handoff Prompt](../../architect/proposals/step-09-step-10-replan-handoff-prompt.md)
```

## claim_f8e206eea9c8d807bb63e249dbc858f4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/README.md#unheaded-block-5, lines 32–32.
Target: docs/platform/proposals/README.md#unheaded-block-8.
Source digest: 7d017b02c78c810db5bc23280aebdcd6f9032fe6952b95fd9e94b0bde634bdef
Target digest: 7bc3dad8854efec710c29af55773f57e28c7bfeb70332fe07610570708216ecb
Shown source SHA256: 7d017b02c78c810db5bc23280aebdcd6f9032fe6952b95fd9e94b0bde634bdef
Shown target SHA256: 7bc3dad8854efec710c29af55773f57e28c7bfeb70332fe07610570708216ecb

### Proposed decision

```json
{
  "claimId": "claim_f8e206eea9c8d807bb63e249dbc858f4",
  "sourceUnitDigest": "7d017b02c78c810db5bc23280aebdcd6f9032fe6952b95fd9e94b0bde634bdef",
  "targetOwner": "docs/platform/proposals/README.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "7bc3dad8854efec710c29af55773f57e28c7bfeb70332fe07610570708216ecb",
  "targetAncestry": [
    "Architect-Level Proposals",
    "Handoff Prompts"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-5 (lines 32–32) is carried at docs/platform/proposals/README.md#unheaded-block-8 (lines 56–56); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- [Step 09 / Step 10 Replan Handoff Prompt](step-09-step-10-replan-handoff-prompt.md)
```

### Full target shown text

```text
- [Step 09 / Step 10 Replan Handoff Prompt](../../architect/proposals/step-09-step-10-replan-handoff-prompt.md)
```
