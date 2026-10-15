# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-08-component-authority-boundary-map.json
Original shard SHA256: 525813264701c46fee63401a8ca02f638be1c39e4a413fd0000ef0cff7eff073
Source file: docs/architect/proposals/component-authority-boundary-map.md
Part 1/2; entries: **80**. Source-file group 8/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (6): `claim_c1741ef08c45e88d276f75b668de7452`, `claim_d9bc09e7463502aa503b0e6024f5fc32`, `claim_dd861ef529a741867fc35af43d6df091`, `claim_21929c380c2aa47b4c919e6738c75db8`, `claim_1b216e6e51864d2cccf9d2e5f362893a`, `claim_141274342ca234cf21529b9afcb645db`.

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

## claim_c1741ef08c45e88d276f75b668de7452

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/component-authority-boundary-map.md#component-authority-boundary-map, lines 1–1.
Target: docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map.
Source digest: 2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872
Target digest: dd6f0ca1c6cde70d021a36a77ae3ba02fe91701fc2b1ecf01c15273afdf9b485
Shown source SHA256: b81147acd954470839ffbf6e699e379a0131f8918df1c260087f9517464c4399
Shown target SHA256: 14f3603959eddf82b90de7e7252aebac146efefb4f7689b0192fa527a6fb2eba

### Proposed decision

```json
{
  "claimId": "claim_c1741ef08c45e88d276f75b668de7452",
  "sourceUnitDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "component-authority-boundary-map",
  "targetUnitDigest": "dd6f0ca1c6cde70d021a36a77ae3ba02fe91701fc2b1ecf01c15273afdf9b485",
  "targetAncestry": [],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#component-authority-boundary-map (lines 1–1) is carried at docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
# Component Authority Boundary Map

Document type: Proposal artifact
Design status: Draft / architect-level discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing until promoted or replaced by an accepted boundary document
Related: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md), [Agent Coordination Vision](../agent-coordination/vision.md), [Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md), [Architecture Intent](../architecture-intent.md), [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md), [Repo Layout Vision](../component-boundary/repo-layout-vision.md), [Host Invocation And Provider Routing](../host-invocation-routing/host-invocation-provider-routing.md), [Node To Rust Component Migration](../host-invocation-routing/node-to-rust-component-migration.md)
```

### Full target shown text

````text
# Component Authority Boundary Map

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/component-authority-boundary-map.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/component-authority-boundary-map.md).


Document type: Proposal artifact
Design status: Draft / architect-level discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing until promoted or replaced by an accepted boundary document
Related: [Step 09 Group Thinking Substrate](../../architect/proposals/step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](../../architect/proposals/step-10-coding-domain-adoption.md), [Agent Coordination Vision](../../architect/agent-coordination/vision.md), [Intent Preservation Ledger](../../architect/agent-coordination/intent-preservation-ledger.md), [Architecture Intent](../../architect/architecture-intent.md), [Component Boundary Advisory](../../architect/component-boundary/component-boundary-advisory.md), [Repo Layout Vision](../../architect/component-boundary/repo-layout-vision.md), [Host Invocation And Provider Routing](../../architect/host-invocation-routing/host-invocation-provider-routing.md), [Node To Rust Component Migration](../../architect/host-invocation-routing/node-to-rust-component-migration.md)
````

## claim_d9bc09e7463502aa503b0e6024f5fc32

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-1, lines 3–8.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-4.
Source digest: f803e72921b475b1a1c7d6e813238314618a3f97d8e7e975223cd9674ab5f37c
Target digest: bfbe7b58638e0205b5a87258235220798b6f87e3395dee5c9ce3ae3085d8d615
Shown source SHA256: f803e72921b475b1a1c7d6e813238314618a3f97d8e7e975223cd9674ab5f37c
Shown target SHA256: bfbe7b58638e0205b5a87258235220798b6f87e3395dee5c9ce3ae3085d8d615

### Proposed decision

```json
{
  "claimId": "claim_d9bc09e7463502aa503b0e6024f5fc32",
  "sourceUnitDigest": "f803e72921b475b1a1c7d6e813238314618a3f97d8e7e975223cd9674ab5f37c",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "bfbe7b58638e0205b5a87258235220798b6f87e3395dee5c9ce3ae3085d8d615",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-1 (lines 3–8) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-4 (lines 27–32); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Document type: Proposal artifact
Design status: Draft / architect-level discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing until promoted or replaced by an accepted boundary document
Related: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md), [Agent Coordination Vision](../agent-coordination/vision.md), [Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md), [Architecture Intent](../architecture-intent.md), [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md), [Repo Layout Vision](../component-boundary/repo-layout-vision.md), [Host Invocation And Provider Routing](../host-invocation-routing/host-invocation-provider-routing.md), [Node To Rust Component Migration](../host-invocation-routing/node-to-rust-component-migration.md)
```

### Full target shown text

```text
Document type: Proposal artifact
Design status: Draft / architect-level discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing until promoted or replaced by an accepted boundary document
Related: [Step 09 Group Thinking Substrate](../../architect/proposals/step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](../../architect/proposals/step-10-coding-domain-adoption.md), [Agent Coordination Vision](../../architect/agent-coordination/vision.md), [Intent Preservation Ledger](../../architect/agent-coordination/intent-preservation-ledger.md), [Architecture Intent](../../architect/architecture-intent.md), [Component Boundary Advisory](../../architect/component-boundary/component-boundary-advisory.md), [Repo Layout Vision](../../architect/component-boundary/repo-layout-vision.md), [Host Invocation And Provider Routing](../../architect/host-invocation-routing/host-invocation-provider-routing.md), [Node To Rust Component Migration](../../architect/host-invocation-routing/node-to-rust-component-migration.md)
```

## claim_7be7f2579917656f6790c5fd8ffefb32

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#1-status-and-reading-rule, lines 10–10.
Target: docs/platform/proposals/component-authority-boundary-map.md#1-status-and-reading-rule.
Source digest: 1ffb8d576a2c555953089a51e13f5c01e1ee9c2220fb3c141ea5a7c700504ec2
Target digest: 1ffb8d576a2c555953089a51e13f5c01e1ee9c2220fb3c141ea5a7c700504ec2
Shown source SHA256: 2a3d186fb43d450c32d25a7a32db7ae5c6c9bb82d978a3e7ce2c25e015206fc9
Shown target SHA256: 2a3d186fb43d450c32d25a7a32db7ae5c6c9bb82d978a3e7ce2c25e015206fc9

### Proposed decision

```json
{
  "claimId": "claim_7be7f2579917656f6790c5fd8ffefb32",
  "sourceUnitDigest": "1ffb8d576a2c555953089a51e13f5c01e1ee9c2220fb3c141ea5a7c700504ec2",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "1-status-and-reading-rule",
  "targetUnitDigest": "1ffb8d576a2c555953089a51e13f5c01e1ee9c2220fb3c141ea5a7c700504ec2",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#1-status-and-reading-rule (lines 10–10) is carried at docs/platform/proposals/component-authority-boundary-map.md#1-status-and-reading-rule (lines 34–34); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 1. Status And Reading Rule

This is an architect-level boundary draft, not a child of Step 09 or Step 10.
It is not accepted architecture, not a roadmap, and not permission to move
files. It names likely ownership so group-thinking substrate work and later
coding-domain adoption can place primitives under the right authority before
any implementation or physical layout move starts.

Read this draft under the accepted constraints:

- Work is optional integration, not Agent Coordination identity.
- Work Lifecycle remains the only authority for Work status, stage, claim,
  return, approval gates, and lifecycle verbs.
- CoordinationSession is a bounded execution/recovery ledger. It records
  `workRef`, actor/topology/bounds, and Assignment membership; it does not
  resolve Work, Stage, operation, branch, merge, or lifecycle authority.
- Dispatch is the only execution control plane. In-process execution is a
  Dispatch/Run Runtime mechanism, not a CoordinationSession feature.
- RunResult confidence is derived from evidence policy and accepted evidence,
  not worker self-report, terminal output, or session synthesis.
- Coding Domain consumes platform engines. It does not migrate into Agent
  Coordination.
```

### Full target shown text

```text
## 1. Status And Reading Rule

This is an architect-level boundary draft, not a child of Step 09 or Step 10.
It is not accepted architecture, not a roadmap, and not permission to move
files. It names likely ownership so group-thinking substrate work and later
coding-domain adoption can place primitives under the right authority before
any implementation or physical layout move starts.

Read this draft under the accepted constraints:

- Work is optional integration, not Agent Coordination identity.
- Work Lifecycle remains the only authority for Work status, stage, claim,
  return, approval gates, and lifecycle verbs.
- CoordinationSession is a bounded execution/recovery ledger. It records
  `workRef`, actor/topology/bounds, and Assignment membership; it does not
  resolve Work, Stage, operation, branch, merge, or lifecycle authority.
- Dispatch is the only execution control plane. In-process execution is a
  Dispatch/Run Runtime mechanism, not a CoordinationSession feature.
- RunResult confidence is derived from evidence policy and accepted evidence,
  not worker self-report, terminal output, or session synthesis.
- Coding Domain consumes platform engines. It does not migrate into Agent
  Coordination.
```

## claim_209b7d197d7b8c08edab5f92d8ecdc6c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-2, lines 12–16.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-5.
Source digest: 48f68646530178058abefd0ec977ff9dc57de9b36bfbe98acf28f91d971fac9e
Target digest: 48f68646530178058abefd0ec977ff9dc57de9b36bfbe98acf28f91d971fac9e
Shown source SHA256: 48f68646530178058abefd0ec977ff9dc57de9b36bfbe98acf28f91d971fac9e
Shown target SHA256: 48f68646530178058abefd0ec977ff9dc57de9b36bfbe98acf28f91d971fac9e

### Proposed decision

```json
{
  "claimId": "claim_209b7d197d7b8c08edab5f92d8ecdc6c",
  "sourceUnitDigest": "48f68646530178058abefd0ec977ff9dc57de9b36bfbe98acf28f91d971fac9e",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "48f68646530178058abefd0ec977ff9dc57de9b36bfbe98acf28f91d971fac9e",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "1. Status And Reading Rule"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-2 (lines 12–16) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-5 (lines 36–40); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This is an architect-level boundary draft, not a child of Step 09 or Step 10.
It is not accepted architecture, not a roadmap, and not permission to move
files. It names likely ownership so group-thinking substrate work and later
coding-domain adoption can place primitives under the right authority before
any implementation or physical layout move starts.
```

### Full target shown text

```text
This is an architect-level boundary draft, not a child of Step 09 or Step 10.
It is not accepted architecture, not a roadmap, and not permission to move
files. It names likely ownership so group-thinking substrate work and later
coding-domain adoption can place primitives under the right authority before
any implementation or physical layout move starts.
```

## claim_70fe6280e9106819dd306918dea34238

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-3, lines 18–18.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-6.
Source digest: b2056ed9f039f69d3ea9dea1af20abe7d9defff60d9f6c2ccabb93d592aa99b8
Target digest: b2056ed9f039f69d3ea9dea1af20abe7d9defff60d9f6c2ccabb93d592aa99b8
Shown source SHA256: b2056ed9f039f69d3ea9dea1af20abe7d9defff60d9f6c2ccabb93d592aa99b8
Shown target SHA256: b2056ed9f039f69d3ea9dea1af20abe7d9defff60d9f6c2ccabb93d592aa99b8

### Proposed decision

```json
{
  "claimId": "claim_70fe6280e9106819dd306918dea34238",
  "sourceUnitDigest": "b2056ed9f039f69d3ea9dea1af20abe7d9defff60d9f6c2ccabb93d592aa99b8",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "b2056ed9f039f69d3ea9dea1af20abe7d9defff60d9f6c2ccabb93d592aa99b8",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "1. Status And Reading Rule"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-3 (lines 18–18) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-6 (lines 42–42); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Read this draft under the accepted constraints:
```

### Full target shown text

```text
Read this draft under the accepted constraints:
```

## claim_b33388e2e66dbf18c5d59356f3819668

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-4, lines 20–31.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-7.
Source digest: 489e3f5da892a8d98077e17ff8580ed0f64673951123969a6f05c1895c87f4ab
Target digest: 489e3f5da892a8d98077e17ff8580ed0f64673951123969a6f05c1895c87f4ab
Shown source SHA256: 489e3f5da892a8d98077e17ff8580ed0f64673951123969a6f05c1895c87f4ab
Shown target SHA256: 489e3f5da892a8d98077e17ff8580ed0f64673951123969a6f05c1895c87f4ab

### Proposed decision

```json
{
  "claimId": "claim_b33388e2e66dbf18c5d59356f3819668",
  "sourceUnitDigest": "489e3f5da892a8d98077e17ff8580ed0f64673951123969a6f05c1895c87f4ab",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "489e3f5da892a8d98077e17ff8580ed0f64673951123969a6f05c1895c87f4ab",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "1. Status And Reading Rule"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-4 (lines 20–31) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-7 (lines 44–55); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Work is optional integration, not Agent Coordination identity.
- Work Lifecycle remains the only authority for Work status, stage, claim,
  return, approval gates, and lifecycle verbs.
- CoordinationSession is a bounded execution/recovery ledger. It records
  `workRef`, actor/topology/bounds, and Assignment membership; it does not
  resolve Work, Stage, operation, branch, merge, or lifecycle authority.
- Dispatch is the only execution control plane. In-process execution is a
  Dispatch/Run Runtime mechanism, not a CoordinationSession feature.
- RunResult confidence is derived from evidence policy and accepted evidence,
  not worker self-report, terminal output, or session synthesis.
- Coding Domain consumes platform engines. It does not migrate into Agent
  Coordination.
```

### Full target shown text

```text
- Work is optional integration, not Agent Coordination identity.
- Work Lifecycle remains the only authority for Work status, stage, claim,
  return, approval gates, and lifecycle verbs.
- CoordinationSession is a bounded execution/recovery ledger. It records
  `workRef`, actor/topology/bounds, and Assignment membership; it does not
  resolve Work, Stage, operation, branch, merge, or lifecycle authority.
- Dispatch is the only execution control plane. In-process execution is a
  Dispatch/Run Runtime mechanism, not a CoordinationSession feature.
- RunResult confidence is derived from evidence policy and accepted evidence,
  not worker self-report, terminal output, or session synthesis.
- Coding Domain consumes platform engines. It does not migrate into Agent
  Coordination.
```

## claim_2483f4e93df5819b20ec5c4efce4faae

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#2-organizing-formula, lines 33–33.
Target: docs/platform/proposals/component-authority-boundary-map.md#2-organizing-formula.
Source digest: 9c0e05f52d8beac3a800dacd325d65c18690db83313377f6c3583de53bb905df
Target digest: 9c0e05f52d8beac3a800dacd325d65c18690db83313377f6c3583de53bb905df
Shown source SHA256: c52a49fd602393e11239af66859f79d7daa8984d215b301aff9ebed05b1b13a7
Shown target SHA256: c52a49fd602393e11239af66859f79d7daa8984d215b301aff9ebed05b1b13a7

### Proposed decision

```json
{
  "claimId": "claim_2483f4e93df5819b20ec5c4efce4faae",
  "sourceUnitDigest": "9c0e05f52d8beac3a800dacd325d65c18690db83313377f6c3583de53bb905df",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "2-organizing-formula",
  "targetUnitDigest": "9c0e05f52d8beac3a800dacd325d65c18690db83313377f6c3583de53bb905df",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#2-organizing-formula (lines 33–33) is carried at docs/platform/proposals/component-authority-boundary-map.md#2-organizing-formula (lines 57–57); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 2. Organizing Formula

The earlier draft blurred layer, category, hierarchy, authority, and dependency.
This artifact is organized around four rules:

```txt
Parent-child = responsibility grouping + runtime coupling + placement hint.
Authority = exactly one component.
Dependency = explicit contract direction, never inferred from nesting.
Sibling collaboration = through ports/events, not private calls.
```

Consequences:

- A parent groups related responsibility concepts that coordinate tightly at
  runtime.
- A parent-child tree helps package placement and reader navigation.
- Authority does not flow upward to the parent.
- Siblings do not call private internals just because they share a parent.
- Allowed dependencies must be named in a contract matrix or port.
````

### Full target shown text

````text
## 2. Organizing Formula

The earlier draft blurred layer, category, hierarchy, authority, and dependency.
This artifact is organized around four rules:

```txt
Parent-child = responsibility grouping + runtime coupling + placement hint.
Authority = exactly one component.
Dependency = explicit contract direction, never inferred from nesting.
Sibling collaboration = through ports/events, not private calls.
```

Consequences:

- A parent groups related responsibility concepts that coordinate tightly at
  runtime.
- A parent-child tree helps package placement and reader navigation.
- Authority does not flow upward to the parent.
- Siblings do not call private internals just because they share a parent.
- Allowed dependencies must be named in a contract matrix or port.
````

## claim_545d251f19e1e34f5b9996ab72e19399

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-5, lines 35–36.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-8.
Source digest: 7eacab6724287b81dac63ce8defb92bb31dd1bb6532c84f192e1596067257926
Target digest: 7eacab6724287b81dac63ce8defb92bb31dd1bb6532c84f192e1596067257926
Shown source SHA256: 7eacab6724287b81dac63ce8defb92bb31dd1bb6532c84f192e1596067257926
Shown target SHA256: 7eacab6724287b81dac63ce8defb92bb31dd1bb6532c84f192e1596067257926

### Proposed decision

```json
{
  "claimId": "claim_545d251f19e1e34f5b9996ab72e19399",
  "sourceUnitDigest": "7eacab6724287b81dac63ce8defb92bb31dd1bb6532c84f192e1596067257926",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "7eacab6724287b81dac63ce8defb92bb31dd1bb6532c84f192e1596067257926",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "2. Organizing Formula"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-5 (lines 35–36) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-8 (lines 59–60); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The earlier draft blurred layer, category, hierarchy, authority, and dependency.
This artifact is organized around four rules:
```

### Full target shown text

```text
The earlier draft blurred layer, category, hierarchy, authority, and dependency.
This artifact is organized around four rules:
```

## claim_ada6e0bfc034dbb9e47b0775dc820e17

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-6, lines 38–43.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-9.
Source digest: 763510c0d25722528854f050af578b19ed52b7691236176f2ea6ae86a683b39a
Target digest: 763510c0d25722528854f050af578b19ed52b7691236176f2ea6ae86a683b39a
Shown source SHA256: 763510c0d25722528854f050af578b19ed52b7691236176f2ea6ae86a683b39a
Shown target SHA256: 763510c0d25722528854f050af578b19ed52b7691236176f2ea6ae86a683b39a

### Proposed decision

```json
{
  "claimId": "claim_ada6e0bfc034dbb9e47b0775dc820e17",
  "sourceUnitDigest": "763510c0d25722528854f050af578b19ed52b7691236176f2ea6ae86a683b39a",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "763510c0d25722528854f050af578b19ed52b7691236176f2ea6ae86a683b39a",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "2. Organizing Formula"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-6 (lines 38–43) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-9 (lines 62–67); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Parent-child = responsibility grouping + runtime coupling + placement hint.
Authority = exactly one component.
Dependency = explicit contract direction, never inferred from nesting.
Sibling collaboration = through ports/events, not private calls.
```
````

### Full target shown text

````text
```txt
Parent-child = responsibility grouping + runtime coupling + placement hint.
Authority = exactly one component.
Dependency = explicit contract direction, never inferred from nesting.
Sibling collaboration = through ports/events, not private calls.
```
````

## claim_ecc29faf68c1c253722621a8d7f5320e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-7, lines 45–52.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-10.
Source digest: 59ffef772d24e766a3673ac04a4ffbb2c6781ae495755f79f3c723ed6d98bc20
Target digest: 59ffef772d24e766a3673ac04a4ffbb2c6781ae495755f79f3c723ed6d98bc20
Shown source SHA256: 59ffef772d24e766a3673ac04a4ffbb2c6781ae495755f79f3c723ed6d98bc20
Shown target SHA256: 59ffef772d24e766a3673ac04a4ffbb2c6781ae495755f79f3c723ed6d98bc20

### Proposed decision

```json
{
  "claimId": "claim_ecc29faf68c1c253722621a8d7f5320e",
  "sourceUnitDigest": "59ffef772d24e766a3673ac04a4ffbb2c6781ae495755f79f3c723ed6d98bc20",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "59ffef772d24e766a3673ac04a4ffbb2c6781ae495755f79f3c723ed6d98bc20",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "2. Organizing Formula"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-7 (lines 45–52) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-10 (lines 69–76); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Consequences:

- A parent groups related responsibility concepts that coordinate tightly at
  runtime.
- A parent-child tree helps package placement and reader navigation.
- Authority does not flow upward to the parent.
- Siblings do not call private internals just because they share a parent.
- Allowed dependencies must be named in a contract matrix or port.
```

### Full target shown text

```text
Consequences:

- A parent groups related responsibility concepts that coordinate tightly at
  runtime.
- A parent-child tree helps package placement and reader navigation.
- Authority does not flow upward to the parent.
- Siblings do not call private internals just because they share a parent.
- Allowed dependencies must be named in a contract matrix or port.
```

## claim_d5ccfd9b19a80711b88c5175b81bf430

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#3-vocabulary, lines 54–54.
Target: docs/platform/proposals/component-authority-boundary-map.md#3-vocabulary.
Source digest: ec7c7925f306d7cd3db258a7b8b236d25518ec56b62ecb41ae2242dca2b47995
Target digest: ec7c7925f306d7cd3db258a7b8b236d25518ec56b62ecb41ae2242dca2b47995
Shown source SHA256: 501f8d87cccfffcaae8a52512255058cd0c0546aca634c6e6dacf9d0be2ad6dd
Shown target SHA256: 501f8d87cccfffcaae8a52512255058cd0c0546aca634c6e6dacf9d0be2ad6dd

### Proposed decision

```json
{
  "claimId": "claim_d5ccfd9b19a80711b88c5175b81bf430",
  "sourceUnitDigest": "ec7c7925f306d7cd3db258a7b8b236d25518ec56b62ecb41ae2242dca2b47995",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "3-vocabulary",
  "targetUnitDigest": "ec7c7925f306d7cd3db258a7b8b236d25518ec56b62ecb41ae2242dca2b47995",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#3-vocabulary (lines 54–54) is carried at docs/platform/proposals/component-authority-boundary-map.md#3-vocabulary (lines 78–78); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 3. Vocabulary

| Term | Meaning in this draft |
|---|---|
| Component | A practical packaging and replacement unit, eventually suitable for `packages/*` or a service/binary facade. |
| Bounded context | A model and vocabulary with one reason to change. It may live inside a larger component. |
| Authority boundary | The source of truth for a decision or write. Every authority belongs to exactly one component. |
| Platform layer | The fgOS product layer that hosts reusable engines, platform support, domain components, host surfaces, and extensions. |
| Component category | The kind of component: foundation engine, integration engine, support infrastructure, domain component, adapter/surface, or extension package. |
| Foundation engine | A platform-core engine with domain-neutral runtime authority and reusable contracts. This is a component category, not a separate layer above platform core. |
| Platform support | Cross-cutting infrastructure such as setup/doctor, event substrate, distribution health, and learning registries. |
| Definition registry / config loader | A platform-core registry that loads runtime definitions such as domains, workflows, stage operations, TaskSpecs, Skills, roles, and FlowDefinition projections. It is "general" across domains, but it is not the same authority as setup/distribution config. |
| Domain core | Behavior whose model depends on a domain's semantics. For coding, that means repository, code-change, worktree, branch, merge, technical approval, and verification doctrine. |

Physical placement must follow authority; it does not define authority. A file
under `src/runner` or `src/state` may belong to a domain or platform component.
Moving it later does not make the authority true unless this map or its
accepted boundary successor says so.
```

### Full target shown text

```text
## 3. Vocabulary

| Term | Meaning in this draft |
|---|---|
| Component | A practical packaging and replacement unit, eventually suitable for `packages/*` or a service/binary facade. |
| Bounded context | A model and vocabulary with one reason to change. It may live inside a larger component. |
| Authority boundary | The source of truth for a decision or write. Every authority belongs to exactly one component. |
| Platform layer | The fgOS product layer that hosts reusable engines, platform support, domain components, host surfaces, and extensions. |
| Component category | The kind of component: foundation engine, integration engine, support infrastructure, domain component, adapter/surface, or extension package. |
| Foundation engine | A platform-core engine with domain-neutral runtime authority and reusable contracts. This is a component category, not a separate layer above platform core. |
| Platform support | Cross-cutting infrastructure such as setup/doctor, event substrate, distribution health, and learning registries. |
| Definition registry / config loader | A platform-core registry that loads runtime definitions such as domains, workflows, stage operations, TaskSpecs, Skills, roles, and FlowDefinition projections. It is "general" across domains, but it is not the same authority as setup/distribution config. |
| Domain core | Behavior whose model depends on a domain's semantics. For coding, that means repository, code-change, worktree, branch, merge, technical approval, and verification doctrine. |

Physical placement must follow authority; it does not define authority. A file
under `src/runner` or `src/state` may belong to a domain or platform component.
Moving it later does not make the authority true unless this map or its
accepted boundary successor says so.
```

## claim_f540a2e443c4e81e77bbf60c632be600

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-8, lines 56–66.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-11.
Source digest: b7f0e2e755b2eac078078ed6a5875493ec34ff0f18e75bcf2b71ddbcdc680cac
Target digest: b7f0e2e755b2eac078078ed6a5875493ec34ff0f18e75bcf2b71ddbcdc680cac
Shown source SHA256: b7f0e2e755b2eac078078ed6a5875493ec34ff0f18e75bcf2b71ddbcdc680cac
Shown target SHA256: b7f0e2e755b2eac078078ed6a5875493ec34ff0f18e75bcf2b71ddbcdc680cac

### Proposed decision

```json
{
  "claimId": "claim_f540a2e443c4e81e77bbf60c632be600",
  "sourceUnitDigest": "b7f0e2e755b2eac078078ed6a5875493ec34ff0f18e75bcf2b71ddbcdc680cac",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "b7f0e2e755b2eac078078ed6a5875493ec34ff0f18e75bcf2b71ddbcdc680cac",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "3. Vocabulary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-8 (lines 56–66) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-11 (lines 80–90); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Term | Meaning in this draft |
|---|---|
| Component | A practical packaging and replacement unit, eventually suitable for `packages/*` or a service/binary facade. |
| Bounded context | A model and vocabulary with one reason to change. It may live inside a larger component. |
| Authority boundary | The source of truth for a decision or write. Every authority belongs to exactly one component. |
| Platform layer | The fgOS product layer that hosts reusable engines, platform support, domain components, host surfaces, and extensions. |
| Component category | The kind of component: foundation engine, integration engine, support infrastructure, domain component, adapter/surface, or extension package. |
| Foundation engine | A platform-core engine with domain-neutral runtime authority and reusable contracts. This is a component category, not a separate layer above platform core. |
| Platform support | Cross-cutting infrastructure such as setup/doctor, event substrate, distribution health, and learning registries. |
| Definition registry / config loader | A platform-core registry that loads runtime definitions such as domains, workflows, stage operations, TaskSpecs, Skills, roles, and FlowDefinition projections. It is "general" across domains, but it is not the same authority as setup/distribution config. |
| Domain core | Behavior whose model depends on a domain's semantics. For coding, that means repository, code-change, worktree, branch, merge, technical approval, and verification doctrine. |
```

### Full target shown text

```text
| Term | Meaning in this draft |
|---|---|
| Component | A practical packaging and replacement unit, eventually suitable for `packages/*` or a service/binary facade. |
| Bounded context | A model and vocabulary with one reason to change. It may live inside a larger component. |
| Authority boundary | The source of truth for a decision or write. Every authority belongs to exactly one component. |
| Platform layer | The fgOS product layer that hosts reusable engines, platform support, domain components, host surfaces, and extensions. |
| Component category | The kind of component: foundation engine, integration engine, support infrastructure, domain component, adapter/surface, or extension package. |
| Foundation engine | A platform-core engine with domain-neutral runtime authority and reusable contracts. This is a component category, not a separate layer above platform core. |
| Platform support | Cross-cutting infrastructure such as setup/doctor, event substrate, distribution health, and learning registries. |
| Definition registry / config loader | A platform-core registry that loads runtime definitions such as domains, workflows, stage operations, TaskSpecs, Skills, roles, and FlowDefinition projections. It is "general" across domains, but it is not the same authority as setup/distribution config. |
| Domain core | Behavior whose model depends on a domain's semantics. For coding, that means repository, code-change, worktree, branch, merge, technical approval, and verification doctrine. |
```

## claim_b7514c397e65fb061657e196e7385fd9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-9, lines 68–71.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-12.
Source digest: ad34b696cea14def2c1303a25554ae357e7ce4e66773c2b34b2dd3fb94438831
Target digest: ad34b696cea14def2c1303a25554ae357e7ce4e66773c2b34b2dd3fb94438831
Shown source SHA256: ad34b696cea14def2c1303a25554ae357e7ce4e66773c2b34b2dd3fb94438831
Shown target SHA256: ad34b696cea14def2c1303a25554ae357e7ce4e66773c2b34b2dd3fb94438831

### Proposed decision

```json
{
  "claimId": "claim_b7514c397e65fb061657e196e7385fd9",
  "sourceUnitDigest": "ad34b696cea14def2c1303a25554ae357e7ce4e66773c2b34b2dd3fb94438831",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "ad34b696cea14def2c1303a25554ae357e7ce4e66773c2b34b2dd3fb94438831",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "3. Vocabulary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-9 (lines 68–71) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-12 (lines 92–95); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Physical placement must follow authority; it does not define authority. A file
under `src/runner` or `src/state` may belong to a domain or platform component.
Moving it later does not make the authority true unless this map or its
accepted boundary successor says so.
```

### Full target shown text

```text
Physical placement must follow authority; it does not define authority. A file
under `src/runner` or `src/state` may belong to a domain or platform component.
Moving it later does not make the authority true unless this map or its
accepted boundary successor says so.
```

## claim_92c4229fec13f81d90e86122c2e95a45

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#4-two-classification-axes, lines 73–73.
Target: docs/platform/proposals/component-authority-boundary-map.md#4-two-classification-axes.
Source digest: 0d34261c49777dc97c8e9f043b8c27051e93eb9837b9a46bb4efedca4ffda224
Target digest: 0d34261c49777dc97c8e9f043b8c27051e93eb9837b9a46bb4efedca4ffda224
Shown source SHA256: 73a746888f4081a5023691feb6fb448148433ad55b4702efe5430eac34655ac6
Shown target SHA256: 73a746888f4081a5023691feb6fb448148433ad55b4702efe5430eac34655ac6

### Proposed decision

```json
{
  "claimId": "claim_92c4229fec13f81d90e86122c2e95a45",
  "sourceUnitDigest": "0d34261c49777dc97c8e9f043b8c27051e93eb9837b9a46bb4efedca4ffda224",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "4-two-classification-axes",
  "targetUnitDigest": "0d34261c49777dc97c8e9f043b8c27051e93eb9837b9a46bb4efedca4ffda224",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#4-two-classification-axes (lines 73–73) is carried at docs/platform/proposals/component-authority-boundary-map.md#4-two-classification-axes (lines 97–97); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 4. Two Classification Axes

This draft separates platform layer from component category:

```txt
Platform layer:
  platform-core | platform-support | domain | host-surface | plugin/extension

Component category:
  foundation-engine | integration-engine | support-infrastructure |
  domain-component | adapter/surface | extension-package
```

| Component | Platform layer | Component category |
|---|---|---|
| Agent Coordination Engine | Platform core | Foundation engine |
| Team Cognition Engine | Platform core | Foundation engine |
| Dispatch And Execution Engine | Platform core | Foundation engine |
| Run Result Evaluator | Platform core | Foundation engine |
| Work Lifecycle Engine | Platform core | Foundation engine |
| Work Driver / Domain Workflow Interpreter | Platform core | Integration engine |
| Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary |
| Setup, Doctor, And Distribution Health | Platform support | Support infrastructure |
| Coding Domain Component | Domain | Domain component |
| Host And Surface Layer | Host surface | Adapter/surface |
| Group-Thinking Protocol Pack | Plugin/extension | Extension package |
| `fgos-group-thinking` Skill | Host surface | Adapter/surface |

Boundary rule:

```txt
Do not label a component "foundation" when the intended meaning is merely
"not coding-specific." First decide whether it has runtime authority and a
reusable contract. If not, call it platform support, host surface, or domain.
```
````

### Full target shown text

````text
## 4. Two Classification Axes

This draft separates platform layer from component category:

```txt
Platform layer:
  platform-core | platform-support | domain | host-surface | plugin/extension

Component category:
  foundation-engine | integration-engine | support-infrastructure |
  domain-component | adapter/surface | extension-package
```

| Component | Platform layer | Component category |
|---|---|---|
| Agent Coordination Engine | Platform core | Foundation engine |
| Team Cognition Engine | Platform core | Foundation engine |
| Dispatch And Execution Engine | Platform core | Foundation engine |
| Run Result Evaluator | Platform core | Foundation engine |
| Work Lifecycle Engine | Platform core | Foundation engine |
| Work Driver / Domain Workflow Interpreter | Platform core | Integration engine |
| Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary |
| Setup, Doctor, And Distribution Health | Platform support | Support infrastructure |
| Coding Domain Component | Domain | Domain component |
| Host And Surface Layer | Host surface | Adapter/surface |
| Group-Thinking Protocol Pack | Plugin/extension | Extension package |
| `fgos-group-thinking` Skill | Host surface | Adapter/surface |

Boundary rule:

```txt
Do not label a component "foundation" when the intended meaning is merely
"not coding-specific." First decide whether it has runtime authority and a
reusable contract. If not, call it platform support, host surface, or domain.
```
````

## claim_ab461fdf69ebaedddc0d49c9ab1c0d9d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-10, lines 75–75.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-13.
Source digest: c39c49fca44f28346ec0927023e676b47f11efd17ec961ddfef496fb6d0464a1
Target digest: c39c49fca44f28346ec0927023e676b47f11efd17ec961ddfef496fb6d0464a1
Shown source SHA256: c39c49fca44f28346ec0927023e676b47f11efd17ec961ddfef496fb6d0464a1
Shown target SHA256: c39c49fca44f28346ec0927023e676b47f11efd17ec961ddfef496fb6d0464a1

### Proposed decision

```json
{
  "claimId": "claim_ab461fdf69ebaedddc0d49c9ab1c0d9d",
  "sourceUnitDigest": "c39c49fca44f28346ec0927023e676b47f11efd17ec961ddfef496fb6d0464a1",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "c39c49fca44f28346ec0927023e676b47f11efd17ec961ddfef496fb6d0464a1",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "4. Two Classification Axes"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-10 (lines 75–75) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-13 (lines 99–99); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This draft separates platform layer from component category:
```

### Full target shown text

```text
This draft separates platform layer from component category:
```

## claim_a7d017c0e5fe238209d08d4b8365fef4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-11, lines 77–84.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-14.
Source digest: e6175264f237257c32914239a7feb8123ebb2e03999bf3b02b30c89b6b15fd3b
Target digest: e6175264f237257c32914239a7feb8123ebb2e03999bf3b02b30c89b6b15fd3b
Shown source SHA256: e6175264f237257c32914239a7feb8123ebb2e03999bf3b02b30c89b6b15fd3b
Shown target SHA256: e6175264f237257c32914239a7feb8123ebb2e03999bf3b02b30c89b6b15fd3b

### Proposed decision

```json
{
  "claimId": "claim_a7d017c0e5fe238209d08d4b8365fef4",
  "sourceUnitDigest": "e6175264f237257c32914239a7feb8123ebb2e03999bf3b02b30c89b6b15fd3b",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "e6175264f237257c32914239a7feb8123ebb2e03999bf3b02b30c89b6b15fd3b",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "4. Two Classification Axes"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-11 (lines 77–84) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-14 (lines 101–108); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Platform layer:
  platform-core | platform-support | domain | host-surface | plugin/extension

Component category:
  foundation-engine | integration-engine | support-infrastructure |
  domain-component | adapter/surface | extension-package
```
````

### Full target shown text

````text
```txt
Platform layer:
  platform-core | platform-support | domain | host-surface | plugin/extension

Component category:
  foundation-engine | integration-engine | support-infrastructure |
  domain-component | adapter/surface | extension-package
```
````

## claim_09106686651d39c25c8774d23a8ad0fb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-12, lines 86–99.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-15.
Source digest: fc04fd662c766f8defd9f583b1e4a72b74b42a4a8dbb99980de50d548fc06f47
Target digest: fc04fd662c766f8defd9f583b1e4a72b74b42a4a8dbb99980de50d548fc06f47
Shown source SHA256: fc04fd662c766f8defd9f583b1e4a72b74b42a4a8dbb99980de50d548fc06f47
Shown target SHA256: fc04fd662c766f8defd9f583b1e4a72b74b42a4a8dbb99980de50d548fc06f47

### Proposed decision

```json
{
  "claimId": "claim_09106686651d39c25c8774d23a8ad0fb",
  "sourceUnitDigest": "fc04fd662c766f8defd9f583b1e4a72b74b42a4a8dbb99980de50d548fc06f47",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "fc04fd662c766f8defd9f583b1e4a72b74b42a4a8dbb99980de50d548fc06f47",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "4. Two Classification Axes"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-12 (lines 86–99) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-15 (lines 110–123); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Component | Platform layer | Component category |
|---|---|---|
| Agent Coordination Engine | Platform core | Foundation engine |
| Team Cognition Engine | Platform core | Foundation engine |
| Dispatch And Execution Engine | Platform core | Foundation engine |
| Run Result Evaluator | Platform core | Foundation engine |
| Work Lifecycle Engine | Platform core | Foundation engine |
| Work Driver / Domain Workflow Interpreter | Platform core | Integration engine |
| Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary |
| Setup, Doctor, And Distribution Health | Platform support | Support infrastructure |
| Coding Domain Component | Domain | Domain component |
| Host And Surface Layer | Host surface | Adapter/surface |
| Group-Thinking Protocol Pack | Plugin/extension | Extension package |
| `fgos-group-thinking` Skill | Host surface | Adapter/surface |
```

### Full target shown text

```text
| Component | Platform layer | Component category |
|---|---|---|
| Agent Coordination Engine | Platform core | Foundation engine |
| Team Cognition Engine | Platform core | Foundation engine |
| Dispatch And Execution Engine | Platform core | Foundation engine |
| Run Result Evaluator | Platform core | Foundation engine |
| Work Lifecycle Engine | Platform core | Foundation engine |
| Work Driver / Domain Workflow Interpreter | Platform core | Integration engine |
| Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary |
| Setup, Doctor, And Distribution Health | Platform support | Support infrastructure |
| Coding Domain Component | Domain | Domain component |
| Host And Surface Layer | Host surface | Adapter/surface |
| Group-Thinking Protocol Pack | Plugin/extension | Extension package |
| `fgos-group-thinking` Skill | Host surface | Adapter/surface |
```

## claim_51e4faa371692bef0d77d88ab378255d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-13, lines 101–107.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-16.
Source digest: 890e60df8a4031267b2f62e4316febdfc5fd4b07f1a67171f6a8be23df6cc25f
Target digest: 890e60df8a4031267b2f62e4316febdfc5fd4b07f1a67171f6a8be23df6cc25f
Shown source SHA256: 890e60df8a4031267b2f62e4316febdfc5fd4b07f1a67171f6a8be23df6cc25f
Shown target SHA256: 890e60df8a4031267b2f62e4316febdfc5fd4b07f1a67171f6a8be23df6cc25f

### Proposed decision

```json
{
  "claimId": "claim_51e4faa371692bef0d77d88ab378255d",
  "sourceUnitDigest": "890e60df8a4031267b2f62e4316febdfc5fd4b07f1a67171f6a8be23df6cc25f",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "890e60df8a4031267b2f62e4316febdfc5fd4b07f1a67171f6a8be23df6cc25f",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "4. Two Classification Axes"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-13 (lines 101–107) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-16 (lines 125–131); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Boundary rule:

```txt
Do not label a component "foundation" when the intended meaning is merely
"not coding-specific." First decide whether it has runtime authority and a
reusable contract. If not, call it platform support, host surface, or domain.
```
````

### Full target shown text

````text
Boundary rule:

```txt
Do not label a component "foundation" when the intended meaning is merely
"not coding-specific." First decide whether it has runtime authority and a
reusable contract. If not, call it platform support, host surface, or domain.
```
````

## claim_de02613cf5aca754d473a47221b30419

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#5-parent-child-responsibility-map, lines 109–109.
Target: docs/platform/proposals/component-authority-boundary-map.md#5-parent-child-responsibility-map.
Source digest: 4749286dcb1e0ff52686a2474130b18f8f27efc8ac5fc2d6f4d4121802c41f7b
Target digest: 4749286dcb1e0ff52686a2474130b18f8f27efc8ac5fc2d6f4d4121802c41f7b
Shown source SHA256: a25cfc17decba6fd346ae062476c739f494da2659a290c51c8ca084aeac91b4e
Shown target SHA256: a25cfc17decba6fd346ae062476c739f494da2659a290c51c8ca084aeac91b4e

### Proposed decision

```json
{
  "claimId": "claim_de02613cf5aca754d473a47221b30419",
  "sourceUnitDigest": "4749286dcb1e0ff52686a2474130b18f8f27efc8ac5fc2d6f4d4121802c41f7b",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "5-parent-child-responsibility-map",
  "targetUnitDigest": "4749286dcb1e0ff52686a2474130b18f8f27efc8ac5fc2d6f4d4121802c41f7b",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#5-parent-child-responsibility-map (lines 109–109) is carried at docs/platform/proposals/component-authority-boundary-map.md#5-parent-child-responsibility-map (lines 133–133); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 5. Parent-Child Responsibility Map

Some accepted Agent Coordination docs discuss dispatch governance, Run
provenance, normalized results, and evidence quality in the same architecture
area. This draft treats **Agent Coordination** as the umbrella responsibility
group for those tightly coupled runtime concerns. It does not mean every one of
those authorities is an internal submodule of the narrower Agent Coordination
Engine.

Draft hierarchy:

```txt
Platform Core
  Agent Coordination
    Agent Coordination Engine
      CoordinationSession Runtime
      Assignment Builder
    Team Cognition Engine
      Aggregation Validator
      Deliberation Model
      Cognitive Protocol Interpreter
    Dispatch And Execution Engine
      Dispatch Control Plane
      Run Runtime
      Execution Adapters
    Run Result Evaluator
      Evidence Collectors
      Artifact Store/Refs
      Confidence Evaluator

  Work Core
    Work Lifecycle Engine
    Work Driver / Domain Workflow Interpreter
    Runtime Occupancy Support

  Domain Registry And Definition Loader

Platform Support
  Setup, Doctor, And Distribution Health
  Learning, Knowledge, And Documentation Registry

Host Surface
  CLI
  Runner
  Gateway
  Herdr
  Plugin/API adapters
  fgos-group-thinking Skill

Extension Layer
  Group-Thinking Protocol Pack
  Group-Thinking Conformance Suite

Domain Layer
  Coding Domain Component
    Coding Domain Core
    Product/Design Flow (name open)
    Cook Workflow
    Bugfix Workflow
    Small-Change Policy/Path (open)
```

Reading the tree:

- `Agent Coordination` is an umbrella responsibility group.
- `Agent Coordination Engine`, `Team Cognition Engine`, `Dispatch And Execution
  Engine`, and `Run Result Evaluator` are sibling authority components under
  that umbrella. Agent Coordination invokes Team Cognition but does not absorb
  cognitive interpretation into session truth.
- `Work Core` is a separate platform-core group because Work lifecycle and
  Work/domain driving can exist without CoordinationSession. Work Driver is a
  child responsibility under Work Core.
- `Coding Domain Component` is a domain component that consumes both platform
  groups and supplies coding-specific declarations, policies, and adapters.
````

### Full target shown text

````text
## 5. Parent-Child Responsibility Map

Some accepted Agent Coordination docs discuss dispatch governance, Run
provenance, normalized results, and evidence quality in the same architecture
area. This draft treats **Agent Coordination** as the umbrella responsibility
group for those tightly coupled runtime concerns. It does not mean every one of
those authorities is an internal submodule of the narrower Agent Coordination
Engine.

Draft hierarchy:

```txt
Platform Core
  Agent Coordination
    Agent Coordination Engine
      CoordinationSession Runtime
      Assignment Builder
    Team Cognition Engine
      Aggregation Validator
      Deliberation Model
      Cognitive Protocol Interpreter
    Dispatch And Execution Engine
      Dispatch Control Plane
      Run Runtime
      Execution Adapters
    Run Result Evaluator
      Evidence Collectors
      Artifact Store/Refs
      Confidence Evaluator

  Work Core
    Work Lifecycle Engine
    Work Driver / Domain Workflow Interpreter
    Runtime Occupancy Support

  Domain Registry And Definition Loader

Platform Support
  Setup, Doctor, And Distribution Health
  Learning, Knowledge, And Documentation Registry

Host Surface
  CLI
  Runner
  Gateway
  Herdr
  Plugin/API adapters
  fgos-group-thinking Skill

Extension Layer
  Group-Thinking Protocol Pack
  Group-Thinking Conformance Suite

Domain Layer
  Coding Domain Component
    Coding Domain Core
    Product/Design Flow (name open)
    Cook Workflow
    Bugfix Workflow
    Small-Change Policy/Path (open)
```

Reading the tree:

- `Agent Coordination` is an umbrella responsibility group.
- `Agent Coordination Engine`, `Team Cognition Engine`, `Dispatch And Execution
  Engine`, and `Run Result Evaluator` are sibling authority components under
  that umbrella. Agent Coordination invokes Team Cognition but does not absorb
  cognitive interpretation into session truth.
- `Work Core` is a separate platform-core group because Work lifecycle and
  Work/domain driving can exist without CoordinationSession. Work Driver is a
  child responsibility under Work Core.
- `Coding Domain Component` is a domain component that consumes both platform
  groups and supplies coding-specific declarations, policies, and adapters.
````

## claim_44fdf74926ae320f1a88b094bb2212dd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-14, lines 111–116.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-17.
Source digest: 67aff5480cf92123809fadbf0722959db0f77e30f067b07bc4af792c693c18d8
Target digest: 67aff5480cf92123809fadbf0722959db0f77e30f067b07bc4af792c693c18d8
Shown source SHA256: 67aff5480cf92123809fadbf0722959db0f77e30f067b07bc4af792c693c18d8
Shown target SHA256: 67aff5480cf92123809fadbf0722959db0f77e30f067b07bc4af792c693c18d8

### Proposed decision

```json
{
  "claimId": "claim_44fdf74926ae320f1a88b094bb2212dd",
  "sourceUnitDigest": "67aff5480cf92123809fadbf0722959db0f77e30f067b07bc4af792c693c18d8",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "67aff5480cf92123809fadbf0722959db0f77e30f067b07bc4af792c693c18d8",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "5. Parent-Child Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-14 (lines 111–116) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-17 (lines 135–140); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Some accepted Agent Coordination docs discuss dispatch governance, Run
provenance, normalized results, and evidence quality in the same architecture
area. This draft treats **Agent Coordination** as the umbrella responsibility
group for those tightly coupled runtime concerns. It does not mean every one of
those authorities is an internal submodule of the narrower Agent Coordination
Engine.
```

### Full target shown text

```text
Some accepted Agent Coordination docs discuss dispatch governance, Run
provenance, normalized results, and evidence quality in the same architecture
area. This draft treats **Agent Coordination** as the umbrella responsibility
group for those tightly coupled runtime concerns. It does not mean every one of
those authorities is an internal submodule of the narrower Agent Coordination
Engine.
```

## claim_cf8273cf867bd9cdd3a08294692dcb50

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-15, lines 118–169.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-18.
Source digest: 4981bbb69adae9bb20b39dc215f2363cade19fe0e5f53c52b8546e11a363102f
Target digest: 4981bbb69adae9bb20b39dc215f2363cade19fe0e5f53c52b8546e11a363102f
Shown source SHA256: 4981bbb69adae9bb20b39dc215f2363cade19fe0e5f53c52b8546e11a363102f
Shown target SHA256: 4981bbb69adae9bb20b39dc215f2363cade19fe0e5f53c52b8546e11a363102f

### Proposed decision

```json
{
  "claimId": "claim_cf8273cf867bd9cdd3a08294692dcb50",
  "sourceUnitDigest": "4981bbb69adae9bb20b39dc215f2363cade19fe0e5f53c52b8546e11a363102f",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "4981bbb69adae9bb20b39dc215f2363cade19fe0e5f53c52b8546e11a363102f",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "5. Parent-Child Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-15 (lines 118–169) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-18 (lines 142–193); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Draft hierarchy:

```txt
Platform Core
  Agent Coordination
    Agent Coordination Engine
      CoordinationSession Runtime
      Assignment Builder
    Team Cognition Engine
      Aggregation Validator
      Deliberation Model
      Cognitive Protocol Interpreter
    Dispatch And Execution Engine
      Dispatch Control Plane
      Run Runtime
      Execution Adapters
    Run Result Evaluator
      Evidence Collectors
      Artifact Store/Refs
      Confidence Evaluator

  Work Core
    Work Lifecycle Engine
    Work Driver / Domain Workflow Interpreter
    Runtime Occupancy Support

  Domain Registry And Definition Loader

Platform Support
  Setup, Doctor, And Distribution Health
  Learning, Knowledge, And Documentation Registry

Host Surface
  CLI
  Runner
  Gateway
  Herdr
  Plugin/API adapters
  fgos-group-thinking Skill

Extension Layer
  Group-Thinking Protocol Pack
  Group-Thinking Conformance Suite

Domain Layer
  Coding Domain Component
    Coding Domain Core
    Product/Design Flow (name open)
    Cook Workflow
    Bugfix Workflow
    Small-Change Policy/Path (open)
```
````

### Full target shown text

````text
Draft hierarchy:

```txt
Platform Core
  Agent Coordination
    Agent Coordination Engine
      CoordinationSession Runtime
      Assignment Builder
    Team Cognition Engine
      Aggregation Validator
      Deliberation Model
      Cognitive Protocol Interpreter
    Dispatch And Execution Engine
      Dispatch Control Plane
      Run Runtime
      Execution Adapters
    Run Result Evaluator
      Evidence Collectors
      Artifact Store/Refs
      Confidence Evaluator

  Work Core
    Work Lifecycle Engine
    Work Driver / Domain Workflow Interpreter
    Runtime Occupancy Support

  Domain Registry And Definition Loader

Platform Support
  Setup, Doctor, And Distribution Health
  Learning, Knowledge, And Documentation Registry

Host Surface
  CLI
  Runner
  Gateway
  Herdr
  Plugin/API adapters
  fgos-group-thinking Skill

Extension Layer
  Group-Thinking Protocol Pack
  Group-Thinking Conformance Suite

Domain Layer
  Coding Domain Component
    Coding Domain Core
    Product/Design Flow (name open)
    Cook Workflow
    Bugfix Workflow
    Small-Change Policy/Path (open)
```
````

## claim_a7c8d9c327892c65c4e5dd61889f5344

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-16, lines 171–182.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-19.
Source digest: 408db8c7ce43889981f2927fe34e402ca4001209962955d9e6a8f97ad86eccba
Target digest: 408db8c7ce43889981f2927fe34e402ca4001209962955d9e6a8f97ad86eccba
Shown source SHA256: 408db8c7ce43889981f2927fe34e402ca4001209962955d9e6a8f97ad86eccba
Shown target SHA256: 408db8c7ce43889981f2927fe34e402ca4001209962955d9e6a8f97ad86eccba

### Proposed decision

```json
{
  "claimId": "claim_a7c8d9c327892c65c4e5dd61889f5344",
  "sourceUnitDigest": "408db8c7ce43889981f2927fe34e402ca4001209962955d9e6a8f97ad86eccba",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "408db8c7ce43889981f2927fe34e402ca4001209962955d9e6a8f97ad86eccba",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "5. Parent-Child Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-16 (lines 171–182) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-19 (lines 195–206); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Reading the tree:

- `Agent Coordination` is an umbrella responsibility group.
- `Agent Coordination Engine`, `Team Cognition Engine`, `Dispatch And Execution
  Engine`, and `Run Result Evaluator` are sibling authority components under
  that umbrella. Agent Coordination invokes Team Cognition but does not absorb
  cognitive interpretation into session truth.
- `Work Core` is a separate platform-core group because Work lifecycle and
  Work/domain driving can exist without CoordinationSession. Work Driver is a
  child responsibility under Work Core.
- `Coding Domain Component` is a domain component that consumes both platform
  groups and supplies coding-specific declarations, policies, and adapters.
```

### Full target shown text

```text
Reading the tree:

- `Agent Coordination` is an umbrella responsibility group.
- `Agent Coordination Engine`, `Team Cognition Engine`, `Dispatch And Execution
  Engine`, and `Run Result Evaluator` are sibling authority components under
  that umbrella. Agent Coordination invokes Team Cognition but does not absorb
  cognitive interpretation into session truth.
- `Work Core` is a separate platform-core group because Work lifecycle and
  Work/domain driving can exist without CoordinationSession. Work Driver is a
  child responsibility under Work Core.
- `Coding Domain Component` is a domain component that consumes both platform
  groups and supplies coding-specific declarations, policies, and adapters.
```

## claim_dd861ef529a741867fc35af43d6df091

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/component-authority-boundary-map.md#6-authority-ownership, lines 184–184.
Target: docs/platform/proposals/component-authority-boundary-map.md#6-authority-ownership.
Source digest: d80bf06a234f969ff2f396572bf70121217226c161021b05fc747d49b6ec1c7c
Target digest: 3142af64d8983cac38dd92004bf0ca844e8bfc627b6677aeb2a377d59f248b3d
Shown source SHA256: 56527b37ae0e6fea93789c232de0fa4f24c8072989d5ab56acb1f754d498bf4b
Shown target SHA256: 205a2c4704c9dd199fc51a97f36359166f5278898ffd9437f269e60fb0c5b196

### Proposed decision

```json
{
  "claimId": "claim_dd861ef529a741867fc35af43d6df091",
  "sourceUnitDigest": "d80bf06a234f969ff2f396572bf70121217226c161021b05fc747d49b6ec1c7c",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "6-authority-ownership",
  "targetUnitDigest": "3142af64d8983cac38dd92004bf0ca844e8bfc627b6677aeb2a377d59f248b3d",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#6-authority-ownership (lines 184–184) is carried at docs/platform/proposals/component-authority-boundary-map.md#6-authority-ownership (lines 208–208); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 6. Authority Ownership

| Component | Owns | Must not own |
|---|---|---|
| Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context refs, document refs, questions, human gates, lifecycle verbs, domain-agnostic Work event truth. | Agent runtime, Assignment membership, executor choice, evidence confidence, coding merge/worktree/technical approval. |
| Work Driver / Domain Workflow Interpreter | Ready-work selection, automation loop policy, declared Stage Operation choice, cross-flow routing, park/halt behavior, recovery/anti-loop around Work execution, invoking lifecycle verbs and dispatch surfaces. | Domain workflow semantics, lifecycle writes outside Work Lifecycle verbs, dispatch target choice, RunResult confidence, coding repository isolation, CoordinationSession progress. |
| Agent Coordination Engine | CoordinationSession manifest/events, Assignment membership, actor/topology/bounds, session recovery, session synthesis boundary, Team Cognition invocation, optional protocol/dynamic planning consumption. | Work stage/status/claim/return, declared Work operation selection, dispatch mechanism, provider/model choice, coding worktree/merge authority. |
| Team Cognition Engine | Typed deliberation interpretation, aggregation-method semantics, source/dissent/omission coverage validation, and cognitive outcomes linked to immutable RunResult/artifact evidence. | CoordinationSession terminal transitions, context-grant authority, Assignment dispatch, RunResult confidence upgrades, Work lifecycle, chat/mailbox delivery, or protocol-specific RFC/NGT/Delphi control flow. |
| Dispatch And Execution Engine | Assignment-to-DispatchPlan resolution, executor/provider/model/tier/mechanism/adapter selection, governance/egress, Run creation, launch, timeout, cancellation, retry attempt metadata, in-process Run mechanism. Owns exactly two routing identities (capability, executor-id) — `purpose`/`--for` is capability compatibility syntax, `job` is not a routing identity (ADR-004 reserves it, unused). See the canonical [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) doc's Component-Internal Ownership list for the eight owned authorities and forbidden dependencies. | Semantic operation choice, Work lifecycle, evidence confidence, coding merge/approval. |
| Run Result Evaluator | Worker result parsing, evidence collection coordination, artifact freshness/provenance checks, confidence decision, RunResult normalization, failure classification for one Assignment Run. | Executor launch, provider choice, Work lifecycle, session completion policy, domain-specific evidence collection ownership. |
| Domain Registry And Definition Loader | General runtime definition registry and config loader for domains, workflows, workflow/stage/operation declarations, task-spec/skill references, roles, and FlowDefinition validation/projection. | Runtime session state, dispatch target choice, Work lifecycle writes, evidence confidence, setup/distribution config authority. |
| Coding Domain Component | Coding Domain Core plus product/design, cook, bugfix, and possible small-change policies; repo scope, footprint, worktree/branch/isolation, merge/catchup, technical approval, code verification doctrine, coding evidence adapters. | Generic Work lifecycle, generic Agent Coordination runtime, direct executor launch, final confidence outside Run Result Evaluator. |
| Setup, Doctor, And Distribution Health | Config defaults, config merge, global/project precedence, doctor checks/fixes registry, install/upgrade/distribution health, required binaries/services/directories. | Domain behavior, lifecycle mutation, dispatch or evidence truth. |
| Host And Surface Layer | CLI/API/plugin/gateway/Herdr/webhook/chat entrypoints, auth, envelopes, visibility, process control, operator diagnostics. | Work truth, CoordinationSession truth, dispatch governance, evidence confidence. |
| Group-Thinking Protocol Pack | Versioned, data-first CoordinationProtocol definitions and public-contract request/renderer adapters for reusable group-thinking methods. | Session state, visibility legality, aggregation validity, terminal authority, dispatch, Work lifecycle, or hidden protocol semantics in prompts/adapters. |
| `fgos-group-thinking` Skill | Selects an explicit registered protocol, builds a public request, launches/resumes through coordination surfaces, and renders public replay/evidence. | Group-thinking runtime logic, hidden actor/topology changes, context grants, aggregate validation, specialist authorization, or Work/git mutation. |
| Learning, Knowledge, And Documentation Registry | Retrospective knowledge capture, doc slot/topic registry, projections, traces, end-user docs index, learning outputs. | Work lifecycle, Agent Coordination runtime, RunResult confidence. |
| Observe (Metrics & Friction) | Measurement and scorecard calculation across substrate entities (`run`, `session`, `executor`, `case`, `work`), case lifecycle journal (`.fgos/observe/cases/`), independent friction repository (`.fgos/observe/friction/`), writer shards, store locks (`.fgos/observe/.lock`), snapshots, and declaring `ObservationSource` / `LegacyFrictionSource` traits. | Work item status/stage mutation, RunResult confidence truth, Agent Coordination session lifecycle, or direct dispatch governance. |
```

### Full target shown text

```text
## 6. Authority Ownership

| Component | Owns | Must not own |
|---|---|---|
| Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context refs, document refs, questions, human gates, lifecycle verbs, domain-agnostic Work event truth. | Agent runtime, Assignment membership, executor choice, evidence confidence, coding merge/worktree/technical approval. |
| Work Driver / Domain Workflow Interpreter | Ready-work selection, automation loop policy, declared Stage Operation choice, cross-flow routing, park/halt behavior, recovery/anti-loop around Work execution, invoking lifecycle verbs and dispatch surfaces. | Domain workflow semantics, lifecycle writes outside Work Lifecycle verbs, dispatch target choice, RunResult confidence, coding repository isolation, CoordinationSession progress. |
| Agent Coordination Engine | CoordinationSession manifest/events, Assignment membership, actor/topology/bounds, session recovery, session synthesis boundary, Team Cognition invocation, optional protocol/dynamic planning consumption. | Work stage/status/claim/return, declared Work operation selection, dispatch mechanism, provider/model choice, coding worktree/merge authority. |
| Team Cognition Engine | Typed deliberation interpretation, aggregation-method semantics, source/dissent/omission coverage validation, and cognitive outcomes linked to immutable RunResult/artifact evidence. | CoordinationSession terminal transitions, context-grant authority, Assignment dispatch, RunResult confidence upgrades, Work lifecycle, chat/mailbox delivery, or protocol-specific RFC/NGT/Delphi control flow. |
| Dispatch And Execution Engine | Assignment-to-DispatchPlan resolution, executor/provider/model/tier/mechanism/adapter selection, governance/egress, Run creation, launch, timeout, cancellation, retry attempt metadata, in-process Run mechanism. Owns exactly two routing identities (capability, executor-id) — `purpose`/`--for` is capability compatibility syntax, `job` is not a routing identity (ADR-004 reserves it, unused). See the canonical [Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md) doc's Component-Internal Ownership list for the eight owned authorities and forbidden dependencies. | Semantic operation choice, Work lifecycle, evidence confidence, coding merge/approval. |
| Run Result Evaluator | Worker result parsing, evidence collection coordination, artifact freshness/provenance checks, confidence decision, RunResult normalization, failure classification for one Assignment Run. | Executor launch, provider choice, Work lifecycle, session completion policy, domain-specific evidence collection ownership. |
| Domain Registry And Definition Loader | General runtime definition registry and config loader for domains, workflows, workflow/stage/operation declarations, task-spec/skill references, roles, and FlowDefinition validation/projection. | Runtime session state, dispatch target choice, Work lifecycle writes, evidence confidence, setup/distribution config authority. |
| Coding Domain Component | Coding Domain Core plus product/design, cook, bugfix, and possible small-change policies; repo scope, footprint, worktree/branch/isolation, merge/catchup, technical approval, code verification doctrine, coding evidence adapters. | Generic Work lifecycle, generic Agent Coordination runtime, direct executor launch, final confidence outside Run Result Evaluator. |
| Setup, Doctor, And Distribution Health | Config defaults, config merge, global/project precedence, doctor checks/fixes registry, install/upgrade/distribution health, required binaries/services/directories. | Domain behavior, lifecycle mutation, dispatch or evidence truth. |
| Host And Surface Layer | CLI/API/plugin/gateway/Herdr/webhook/chat entrypoints, auth, envelopes, visibility, process control, operator diagnostics. | Work truth, CoordinationSession truth, dispatch governance, evidence confidence. |
| Group-Thinking Protocol Pack | Versioned, data-first CoordinationProtocol definitions and public-contract request/renderer adapters for reusable group-thinking methods. | Session state, visibility legality, aggregation validity, terminal authority, dispatch, Work lifecycle, or hidden protocol semantics in prompts/adapters. |
| `fgos-group-thinking` Skill | Selects an explicit registered protocol, builds a public request, launches/resumes through coordination surfaces, and renders public replay/evidence. | Group-thinking runtime logic, hidden actor/topology changes, context grants, aggregate validation, specialist authorization, or Work/git mutation. |
| Learning, Knowledge, And Documentation Registry | Retrospective knowledge capture, doc slot/topic registry, projections, traces, end-user docs index, learning outputs. | Work lifecycle, Agent Coordination runtime, RunResult confidence. |
| Observe (Metrics & Friction) | Measurement and scorecard calculation across substrate entities (`run`, `session`, `executor`, `case`, `work`), case lifecycle journal (`.fgos/observe/cases/`), independent friction repository (`.fgos/observe/friction/`), writer shards, store locks (`.fgos/observe/.lock`), snapshots, and declaring `ObservationSource` / `LegacyFrictionSource` traits. | Work item status/stage mutation, RunResult confidence truth, Agent Coordination session lifecycle, or direct dispatch governance. |
```

## claim_21929c380c2aa47b4c919e6738c75db8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-17, lines 186–201.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-20.
Source digest: f1772e2a068f8e7570c6d90fe294821fa64eea57fc0a9560b7462762a070d86e
Target digest: 8783ca2eda7577abab8dae70890cbb413943999de555ba932680707abdc86893
Shown source SHA256: f1772e2a068f8e7570c6d90fe294821fa64eea57fc0a9560b7462762a070d86e
Shown target SHA256: 8783ca2eda7577abab8dae70890cbb413943999de555ba932680707abdc86893

### Proposed decision

```json
{
  "claimId": "claim_21929c380c2aa47b4c919e6738c75db8",
  "sourceUnitDigest": "f1772e2a068f8e7570c6d90fe294821fa64eea57fc0a9560b7462762a070d86e",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "8783ca2eda7577abab8dae70890cbb413943999de555ba932680707abdc86893",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "6. Authority Ownership"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-17 (lines 186–201) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-20 (lines 210–225); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Component | Owns | Must not own |
|---|---|---|
| Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context refs, document refs, questions, human gates, lifecycle verbs, domain-agnostic Work event truth. | Agent runtime, Assignment membership, executor choice, evidence confidence, coding merge/worktree/technical approval. |
| Work Driver / Domain Workflow Interpreter | Ready-work selection, automation loop policy, declared Stage Operation choice, cross-flow routing, park/halt behavior, recovery/anti-loop around Work execution, invoking lifecycle verbs and dispatch surfaces. | Domain workflow semantics, lifecycle writes outside Work Lifecycle verbs, dispatch target choice, RunResult confidence, coding repository isolation, CoordinationSession progress. |
| Agent Coordination Engine | CoordinationSession manifest/events, Assignment membership, actor/topology/bounds, session recovery, session synthesis boundary, Team Cognition invocation, optional protocol/dynamic planning consumption. | Work stage/status/claim/return, declared Work operation selection, dispatch mechanism, provider/model choice, coding worktree/merge authority. |
| Team Cognition Engine | Typed deliberation interpretation, aggregation-method semantics, source/dissent/omission coverage validation, and cognitive outcomes linked to immutable RunResult/artifact evidence. | CoordinationSession terminal transitions, context-grant authority, Assignment dispatch, RunResult confidence upgrades, Work lifecycle, chat/mailbox delivery, or protocol-specific RFC/NGT/Delphi control flow. |
| Dispatch And Execution Engine | Assignment-to-DispatchPlan resolution, executor/provider/model/tier/mechanism/adapter selection, governance/egress, Run creation, launch, timeout, cancellation, retry attempt metadata, in-process Run mechanism. Owns exactly two routing identities (capability, executor-id) — `purpose`/`--for` is capability compatibility syntax, `job` is not a routing identity (ADR-004 reserves it, unused). See the canonical [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) doc's Component-Internal Ownership list for the eight owned authorities and forbidden dependencies. | Semantic operation choice, Work lifecycle, evidence confidence, coding merge/approval. |
| Run Result Evaluator | Worker result parsing, evidence collection coordination, artifact freshness/provenance checks, confidence decision, RunResult normalization, failure classification for one Assignment Run. | Executor launch, provider choice, Work lifecycle, session completion policy, domain-specific evidence collection ownership. |
| Domain Registry And Definition Loader | General runtime definition registry and config loader for domains, workflows, workflow/stage/operation declarations, task-spec/skill references, roles, and FlowDefinition validation/projection. | Runtime session state, dispatch target choice, Work lifecycle writes, evidence confidence, setup/distribution config authority. |
| Coding Domain Component | Coding Domain Core plus product/design, cook, bugfix, and possible small-change policies; repo scope, footprint, worktree/branch/isolation, merge/catchup, technical approval, code verification doctrine, coding evidence adapters. | Generic Work lifecycle, generic Agent Coordination runtime, direct executor launch, final confidence outside Run Result Evaluator. |
| Setup, Doctor, And Distribution Health | Config defaults, config merge, global/project precedence, doctor checks/fixes registry, install/upgrade/distribution health, required binaries/services/directories. | Domain behavior, lifecycle mutation, dispatch or evidence truth. |
| Host And Surface Layer | CLI/API/plugin/gateway/Herdr/webhook/chat entrypoints, auth, envelopes, visibility, process control, operator diagnostics. | Work truth, CoordinationSession truth, dispatch governance, evidence confidence. |
| Group-Thinking Protocol Pack | Versioned, data-first CoordinationProtocol definitions and public-contract request/renderer adapters for reusable group-thinking methods. | Session state, visibility legality, aggregation validity, terminal authority, dispatch, Work lifecycle, or hidden protocol semantics in prompts/adapters. |
| `fgos-group-thinking` Skill | Selects an explicit registered protocol, builds a public request, launches/resumes through coordination surfaces, and renders public replay/evidence. | Group-thinking runtime logic, hidden actor/topology changes, context grants, aggregate validation, specialist authorization, or Work/git mutation. |
| Learning, Knowledge, And Documentation Registry | Retrospective knowledge capture, doc slot/topic registry, projections, traces, end-user docs index, learning outputs. | Work lifecycle, Agent Coordination runtime, RunResult confidence. |
| Observe (Metrics & Friction) | Measurement and scorecard calculation across substrate entities (`run`, `session`, `executor`, `case`, `work`), case lifecycle journal (`.fgos/observe/cases/`), independent friction repository (`.fgos/observe/friction/`), writer shards, store locks (`.fgos/observe/.lock`), snapshots, and declaring `ObservationSource` / `LegacyFrictionSource` traits. | Work item status/stage mutation, RunResult confidence truth, Agent Coordination session lifecycle, or direct dispatch governance. |
```

### Full target shown text

```text
| Component | Owns | Must not own |
|---|---|---|
| Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context refs, document refs, questions, human gates, lifecycle verbs, domain-agnostic Work event truth. | Agent runtime, Assignment membership, executor choice, evidence confidence, coding merge/worktree/technical approval. |
| Work Driver / Domain Workflow Interpreter | Ready-work selection, automation loop policy, declared Stage Operation choice, cross-flow routing, park/halt behavior, recovery/anti-loop around Work execution, invoking lifecycle verbs and dispatch surfaces. | Domain workflow semantics, lifecycle writes outside Work Lifecycle verbs, dispatch target choice, RunResult confidence, coding repository isolation, CoordinationSession progress. |
| Agent Coordination Engine | CoordinationSession manifest/events, Assignment membership, actor/topology/bounds, session recovery, session synthesis boundary, Team Cognition invocation, optional protocol/dynamic planning consumption. | Work stage/status/claim/return, declared Work operation selection, dispatch mechanism, provider/model choice, coding worktree/merge authority. |
| Team Cognition Engine | Typed deliberation interpretation, aggregation-method semantics, source/dissent/omission coverage validation, and cognitive outcomes linked to immutable RunResult/artifact evidence. | CoordinationSession terminal transitions, context-grant authority, Assignment dispatch, RunResult confidence upgrades, Work lifecycle, chat/mailbox delivery, or protocol-specific RFC/NGT/Delphi control flow. |
| Dispatch And Execution Engine | Assignment-to-DispatchPlan resolution, executor/provider/model/tier/mechanism/adapter selection, governance/egress, Run creation, launch, timeout, cancellation, retry attempt metadata, in-process Run mechanism. Owns exactly two routing identities (capability, executor-id) — `purpose`/`--for` is capability compatibility syntax, `job` is not a routing identity (ADR-004 reserves it, unused). See the canonical [Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md) doc's Component-Internal Ownership list for the eight owned authorities and forbidden dependencies. | Semantic operation choice, Work lifecycle, evidence confidence, coding merge/approval. |
| Run Result Evaluator | Worker result parsing, evidence collection coordination, artifact freshness/provenance checks, confidence decision, RunResult normalization, failure classification for one Assignment Run. | Executor launch, provider choice, Work lifecycle, session completion policy, domain-specific evidence collection ownership. |
| Domain Registry And Definition Loader | General runtime definition registry and config loader for domains, workflows, workflow/stage/operation declarations, task-spec/skill references, roles, and FlowDefinition validation/projection. | Runtime session state, dispatch target choice, Work lifecycle writes, evidence confidence, setup/distribution config authority. |
| Coding Domain Component | Coding Domain Core plus product/design, cook, bugfix, and possible small-change policies; repo scope, footprint, worktree/branch/isolation, merge/catchup, technical approval, code verification doctrine, coding evidence adapters. | Generic Work lifecycle, generic Agent Coordination runtime, direct executor launch, final confidence outside Run Result Evaluator. |
| Setup, Doctor, And Distribution Health | Config defaults, config merge, global/project precedence, doctor checks/fixes registry, install/upgrade/distribution health, required binaries/services/directories. | Domain behavior, lifecycle mutation, dispatch or evidence truth. |
| Host And Surface Layer | CLI/API/plugin/gateway/Herdr/webhook/chat entrypoints, auth, envelopes, visibility, process control, operator diagnostics. | Work truth, CoordinationSession truth, dispatch governance, evidence confidence. |
| Group-Thinking Protocol Pack | Versioned, data-first CoordinationProtocol definitions and public-contract request/renderer adapters for reusable group-thinking methods. | Session state, visibility legality, aggregation validity, terminal authority, dispatch, Work lifecycle, or hidden protocol semantics in prompts/adapters. |
| `fgos-group-thinking` Skill | Selects an explicit registered protocol, builds a public request, launches/resumes through coordination surfaces, and renders public replay/evidence. | Group-thinking runtime logic, hidden actor/topology changes, context grants, aggregate validation, specialist authorization, or Work/git mutation. |
| Learning, Knowledge, And Documentation Registry | Retrospective knowledge capture, doc slot/topic registry, projections, traces, end-user docs index, learning outputs. | Work lifecycle, Agent Coordination runtime, RunResult confidence. |
| Observe (Metrics & Friction) | Measurement and scorecard calculation across substrate entities (`run`, `session`, `executor`, `case`, `work`), case lifecycle journal (`.fgos/observe/cases/`), independent friction repository (`.fgos/observe/friction/`), writer shards, store locks (`.fgos/observe/.lock`), snapshots, and declaring `ObservationSource` / `LegacyFrictionSource` traits. | Work item status/stage mutation, RunResult confidence truth, Agent Coordination session lifecycle, or direct dispatch governance. |
```

## claim_eca5f985d835c77e88b23df03cd01afe

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#7-contract-dependency-matrix, lines 203–203.
Target: docs/platform/proposals/component-authority-boundary-map.md#7-contract-dependency-matrix.
Source digest: a28c0c5ac8b3f3ef90b260e4f644af7246559f36a78f3541971081272fcb04ce
Target digest: a28c0c5ac8b3f3ef90b260e4f644af7246559f36a78f3541971081272fcb04ce
Shown source SHA256: 6c46255ff7b0829a1d4889c563762d7a8a850d8c7f7fe1ecdca7c8a3e777f352
Shown target SHA256: 6c46255ff7b0829a1d4889c563762d7a8a850d8c7f7fe1ecdca7c8a3e777f352

### Proposed decision

```json
{
  "claimId": "claim_eca5f985d835c77e88b23df03cd01afe",
  "sourceUnitDigest": "a28c0c5ac8b3f3ef90b260e4f644af7246559f36a78f3541971081272fcb04ce",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "7-contract-dependency-matrix",
  "targetUnitDigest": "a28c0c5ac8b3f3ef90b260e4f644af7246559f36a78f3541971081272fcb04ce",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#7-contract-dependency-matrix (lines 203–203) is carried at docs/platform/proposals/component-authority-boundary-map.md#7-contract-dependency-matrix (lines 227–227); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 7. Contract Dependency Matrix

| Relation | Allowed dependency | Forbidden dependency |
|---|---|---|
| Agent Coordination Engine -> Dispatch And Execution Engine | May call Dispatch through Assignment/DispatchPlan contracts. | Must not choose executor/provider/model directly or bypass dispatch. |
| Agent Coordination Engine -> Run Result Evaluator | May consume RunResult/evidence refs. | Must not compute confidence or upgrade evidence in synthesis. |
| Agent Coordination Engine -> Team Cognition Engine | May ask Team Cognition to validate typed contributions and aggregation against immutable result/artifact refs, then use the validated outcome as one input to terminal legality. | Must not delegate session transition authority or let a worker/self-reported aggregate close the session. |
| Team Cognition Engine -> Run Result Evaluator outputs | May interpret already-normalized RunResult/artifact/evidence refs without rewriting them. | Must not recollect evidence, change confidence, or create a second artifact authority. |
| Work Driver -> Work Lifecycle Engine | May read Work view and invoke lifecycle verbs. | Must not write Work event truth directly or create a second lifecycle path. |
| Work Driver -> Domain Registry And Definition Loader | May load legal workflow/stage/operation declarations and cross-flow rules. | Must not invent undeclared domain operations. |
| Work Driver -> Agent Coordination | May open Work-attached sessions and dispatch Assignments through Agent Coordination contracts. | Must not make Agent Coordination own Work lifecycle or domain workflow routing. |
| Domain Component -> Work Driver / Agent Coordination | May supply workflow declarations, TaskSpecs, Skills, policies, harness advice, evidence adapters, and resource/isolation constraints. | Must not call executors privately or mutate Work outside lifecycle verbs. |
| Host Surface -> platform engines | May route commands/API calls into component ports. | Must not become source of truth for lifecycle, dispatch governance, or evidence. |
| Group-Thinking Protocol Pack -> Agent Coordination / Team Cognition | May declare versioned protocols and invoke only public request, replay, contribution, and aggregation contracts. | Must not read private session storage, add protocol-specific branches to core, or bypass legality/validation. |
| `fgos-group-thinking` Skill -> Group-Thinking Protocol Pack / Host Surface | May select an indexed `metadata.id@version`, assemble inputs/bounds, and call the public coordination surface. | Must not implement RFC/NGT/Delphi semantics in skill prose or switch protocols invisibly during a session. |
| Sibling components under one parent | May collaborate through declared ports/events and shared immutable references. | Must not reach into each other's private state or rely on physical nesting as API. |
| Observe -> Substrate Sources | May read substrate events and states through declared read contracts (`run-result.read.v1`, `session-events.read.v1`, `work-events.read.v1`) and traits. | Must not mutate substrate truth or enforce Work-lifecycle dependencies on metrics. |
| Platform Components -> Observe | May append friction or case transitions via native CLI (`fgos friction`, `fgos metrics`). | Must not bypass writer shards or write directly into `.fgos/observe` storage without host lock. |

Placement rule:

```txt
Put children near their parent when they share release/runtime contracts.
Split children into separate packages when their authority, tests, or Rust
replacement path needs independent ownership.
Never use physical nesting as proof that the parent may rewrite child truth.
```
````

### Full target shown text

````text
## 7. Contract Dependency Matrix

| Relation | Allowed dependency | Forbidden dependency |
|---|---|---|
| Agent Coordination Engine -> Dispatch And Execution Engine | May call Dispatch through Assignment/DispatchPlan contracts. | Must not choose executor/provider/model directly or bypass dispatch. |
| Agent Coordination Engine -> Run Result Evaluator | May consume RunResult/evidence refs. | Must not compute confidence or upgrade evidence in synthesis. |
| Agent Coordination Engine -> Team Cognition Engine | May ask Team Cognition to validate typed contributions and aggregation against immutable result/artifact refs, then use the validated outcome as one input to terminal legality. | Must not delegate session transition authority or let a worker/self-reported aggregate close the session. |
| Team Cognition Engine -> Run Result Evaluator outputs | May interpret already-normalized RunResult/artifact/evidence refs without rewriting them. | Must not recollect evidence, change confidence, or create a second artifact authority. |
| Work Driver -> Work Lifecycle Engine | May read Work view and invoke lifecycle verbs. | Must not write Work event truth directly or create a second lifecycle path. |
| Work Driver -> Domain Registry And Definition Loader | May load legal workflow/stage/operation declarations and cross-flow rules. | Must not invent undeclared domain operations. |
| Work Driver -> Agent Coordination | May open Work-attached sessions and dispatch Assignments through Agent Coordination contracts. | Must not make Agent Coordination own Work lifecycle or domain workflow routing. |
| Domain Component -> Work Driver / Agent Coordination | May supply workflow declarations, TaskSpecs, Skills, policies, harness advice, evidence adapters, and resource/isolation constraints. | Must not call executors privately or mutate Work outside lifecycle verbs. |
| Host Surface -> platform engines | May route commands/API calls into component ports. | Must not become source of truth for lifecycle, dispatch governance, or evidence. |
| Group-Thinking Protocol Pack -> Agent Coordination / Team Cognition | May declare versioned protocols and invoke only public request, replay, contribution, and aggregation contracts. | Must not read private session storage, add protocol-specific branches to core, or bypass legality/validation. |
| `fgos-group-thinking` Skill -> Group-Thinking Protocol Pack / Host Surface | May select an indexed `metadata.id@version`, assemble inputs/bounds, and call the public coordination surface. | Must not implement RFC/NGT/Delphi semantics in skill prose or switch protocols invisibly during a session. |
| Sibling components under one parent | May collaborate through declared ports/events and shared immutable references. | Must not reach into each other's private state or rely on physical nesting as API. |
| Observe -> Substrate Sources | May read substrate events and states through declared read contracts (`run-result.read.v1`, `session-events.read.v1`, `work-events.read.v1`) and traits. | Must not mutate substrate truth or enforce Work-lifecycle dependencies on metrics. |
| Platform Components -> Observe | May append friction or case transitions via native CLI (`fgos friction`, `fgos metrics`). | Must not bypass writer shards or write directly into `.fgos/observe` storage without host lock. |

Placement rule:

```txt
Put children near their parent when they share release/runtime contracts.
Split children into separate packages when their authority, tests, or Rust
replacement path needs independent ownership.
Never use physical nesting as proof that the parent may rewrite child truth.
```
````

## claim_d3514101cbb67f546ffc421263c2c155

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-18, lines 205–220.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-21.
Source digest: 6dbe8b176c9d5aaf8cdfb0f276270fc33ebae7ca634f6105f2aa4883ece2e2c0
Target digest: 6dbe8b176c9d5aaf8cdfb0f276270fc33ebae7ca634f6105f2aa4883ece2e2c0
Shown source SHA256: 6dbe8b176c9d5aaf8cdfb0f276270fc33ebae7ca634f6105f2aa4883ece2e2c0
Shown target SHA256: 6dbe8b176c9d5aaf8cdfb0f276270fc33ebae7ca634f6105f2aa4883ece2e2c0

### Proposed decision

```json
{
  "claimId": "claim_d3514101cbb67f546ffc421263c2c155",
  "sourceUnitDigest": "6dbe8b176c9d5aaf8cdfb0f276270fc33ebae7ca634f6105f2aa4883ece2e2c0",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "6dbe8b176c9d5aaf8cdfb0f276270fc33ebae7ca634f6105f2aa4883ece2e2c0",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "7. Contract Dependency Matrix"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-18 (lines 205–220) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-21 (lines 229–244); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Relation | Allowed dependency | Forbidden dependency |
|---|---|---|
| Agent Coordination Engine -> Dispatch And Execution Engine | May call Dispatch through Assignment/DispatchPlan contracts. | Must not choose executor/provider/model directly or bypass dispatch. |
| Agent Coordination Engine -> Run Result Evaluator | May consume RunResult/evidence refs. | Must not compute confidence or upgrade evidence in synthesis. |
| Agent Coordination Engine -> Team Cognition Engine | May ask Team Cognition to validate typed contributions and aggregation against immutable result/artifact refs, then use the validated outcome as one input to terminal legality. | Must not delegate session transition authority or let a worker/self-reported aggregate close the session. |
| Team Cognition Engine -> Run Result Evaluator outputs | May interpret already-normalized RunResult/artifact/evidence refs without rewriting them. | Must not recollect evidence, change confidence, or create a second artifact authority. |
| Work Driver -> Work Lifecycle Engine | May read Work view and invoke lifecycle verbs. | Must not write Work event truth directly or create a second lifecycle path. |
| Work Driver -> Domain Registry And Definition Loader | May load legal workflow/stage/operation declarations and cross-flow rules. | Must not invent undeclared domain operations. |
| Work Driver -> Agent Coordination | May open Work-attached sessions and dispatch Assignments through Agent Coordination contracts. | Must not make Agent Coordination own Work lifecycle or domain workflow routing. |
| Domain Component -> Work Driver / Agent Coordination | May supply workflow declarations, TaskSpecs, Skills, policies, harness advice, evidence adapters, and resource/isolation constraints. | Must not call executors privately or mutate Work outside lifecycle verbs. |
| Host Surface -> platform engines | May route commands/API calls into component ports. | Must not become source of truth for lifecycle, dispatch governance, or evidence. |
| Group-Thinking Protocol Pack -> Agent Coordination / Team Cognition | May declare versioned protocols and invoke only public request, replay, contribution, and aggregation contracts. | Must not read private session storage, add protocol-specific branches to core, or bypass legality/validation. |
| `fgos-group-thinking` Skill -> Group-Thinking Protocol Pack / Host Surface | May select an indexed `metadata.id@version`, assemble inputs/bounds, and call the public coordination surface. | Must not implement RFC/NGT/Delphi semantics in skill prose or switch protocols invisibly during a session. |
| Sibling components under one parent | May collaborate through declared ports/events and shared immutable references. | Must not reach into each other's private state or rely on physical nesting as API. |
| Observe -> Substrate Sources | May read substrate events and states through declared read contracts (`run-result.read.v1`, `session-events.read.v1`, `work-events.read.v1`) and traits. | Must not mutate substrate truth or enforce Work-lifecycle dependencies on metrics. |
| Platform Components -> Observe | May append friction or case transitions via native CLI (`fgos friction`, `fgos metrics`). | Must not bypass writer shards or write directly into `.fgos/observe` storage without host lock. |
```

### Full target shown text

```text
| Relation | Allowed dependency | Forbidden dependency |
|---|---|---|
| Agent Coordination Engine -> Dispatch And Execution Engine | May call Dispatch through Assignment/DispatchPlan contracts. | Must not choose executor/provider/model directly or bypass dispatch. |
| Agent Coordination Engine -> Run Result Evaluator | May consume RunResult/evidence refs. | Must not compute confidence or upgrade evidence in synthesis. |
| Agent Coordination Engine -> Team Cognition Engine | May ask Team Cognition to validate typed contributions and aggregation against immutable result/artifact refs, then use the validated outcome as one input to terminal legality. | Must not delegate session transition authority or let a worker/self-reported aggregate close the session. |
| Team Cognition Engine -> Run Result Evaluator outputs | May interpret already-normalized RunResult/artifact/evidence refs without rewriting them. | Must not recollect evidence, change confidence, or create a second artifact authority. |
| Work Driver -> Work Lifecycle Engine | May read Work view and invoke lifecycle verbs. | Must not write Work event truth directly or create a second lifecycle path. |
| Work Driver -> Domain Registry And Definition Loader | May load legal workflow/stage/operation declarations and cross-flow rules. | Must not invent undeclared domain operations. |
| Work Driver -> Agent Coordination | May open Work-attached sessions and dispatch Assignments through Agent Coordination contracts. | Must not make Agent Coordination own Work lifecycle or domain workflow routing. |
| Domain Component -> Work Driver / Agent Coordination | May supply workflow declarations, TaskSpecs, Skills, policies, harness advice, evidence adapters, and resource/isolation constraints. | Must not call executors privately or mutate Work outside lifecycle verbs. |
| Host Surface -> platform engines | May route commands/API calls into component ports. | Must not become source of truth for lifecycle, dispatch governance, or evidence. |
| Group-Thinking Protocol Pack -> Agent Coordination / Team Cognition | May declare versioned protocols and invoke only public request, replay, contribution, and aggregation contracts. | Must not read private session storage, add protocol-specific branches to core, or bypass legality/validation. |
| `fgos-group-thinking` Skill -> Group-Thinking Protocol Pack / Host Surface | May select an indexed `metadata.id@version`, assemble inputs/bounds, and call the public coordination surface. | Must not implement RFC/NGT/Delphi semantics in skill prose or switch protocols invisibly during a session. |
| Sibling components under one parent | May collaborate through declared ports/events and shared immutable references. | Must not reach into each other's private state or rely on physical nesting as API. |
| Observe -> Substrate Sources | May read substrate events and states through declared read contracts (`run-result.read.v1`, `session-events.read.v1`, `work-events.read.v1`) and traits. | Must not mutate substrate truth or enforce Work-lifecycle dependencies on metrics. |
| Platform Components -> Observe | May append friction or case transitions via native CLI (`fgos friction`, `fgos metrics`). | Must not bypass writer shards or write directly into `.fgos/observe` storage without host lock. |
```

## claim_442b0d61834954090f1ecd48254fe184

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-19, lines 222–229.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-22.
Source digest: e3262c39db11116a87679360652459009e4e65141b59155e53cc5e6ade9ae872
Target digest: e3262c39db11116a87679360652459009e4e65141b59155e53cc5e6ade9ae872
Shown source SHA256: e3262c39db11116a87679360652459009e4e65141b59155e53cc5e6ade9ae872
Shown target SHA256: e3262c39db11116a87679360652459009e4e65141b59155e53cc5e6ade9ae872

### Proposed decision

```json
{
  "claimId": "claim_442b0d61834954090f1ecd48254fe184",
  "sourceUnitDigest": "e3262c39db11116a87679360652459009e4e65141b59155e53cc5e6ade9ae872",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "e3262c39db11116a87679360652459009e4e65141b59155e53cc5e6ade9ae872",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "7. Contract Dependency Matrix"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-19 (lines 222–229) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-22 (lines 246–253); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Placement rule:

```txt
Put children near their parent when they share release/runtime contracts.
Split children into separate packages when their authority, tests, or Rust
replacement path needs independent ownership.
Never use physical nesting as proof that the parent may rewrite child truth.
```
````

### Full target shown text

````text
Placement rule:

```txt
Put children near their parent when they share release/runtime contracts.
Split children into separate packages when their authority, tests, or Rust
replacement path needs independent ownership.
Never use physical nesting as proof that the parent may rewrite child truth.
```
````

## claim_2eaf9d5f95b19b39372fe20f7aae8da8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#8-advisory-section-18-cluster-classification, lines 231–231.
Target: docs/platform/proposals/component-authority-boundary-map.md#8-advisory-section-18-cluster-classification.
Source digest: e07dde45c2da84ef25f52cd87fc05d5da3d9203af233346d70a2844de4f14234
Target digest: e07dde45c2da84ef25f52cd87fc05d5da3d9203af233346d70a2844de4f14234
Shown source SHA256: d42e2fe8456c0f9bba21d89ca3b62d19e36fc90fbf1f169b3efe703524a58413
Shown target SHA256: d42e2fe8456c0f9bba21d89ca3b62d19e36fc90fbf1f169b3efe703524a58413

### Proposed decision

```json
{
  "claimId": "claim_2eaf9d5f95b19b39372fe20f7aae8da8",
  "sourceUnitDigest": "e07dde45c2da84ef25f52cd87fc05d5da3d9203af233346d70a2844de4f14234",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "8-advisory-section-18-cluster-classification",
  "targetUnitDigest": "e07dde45c2da84ef25f52cd87fc05d5da3d9203af233346d70a2844de4f14234",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#8-advisory-section-18-cluster-classification (lines 231–231) is carried at docs/platform/proposals/component-authority-boundary-map.md#8-advisory-section-18-cluster-classification (lines 255–255); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 8. Advisory Section 18 Cluster Classification

| Cluster | Draft owner | Platform layer | Component category | Why |
|---|---|---|---|---|
| F1 / Work State And Event Store Kernel | Work Lifecycle Engine, with reusable store utilities only behind explicit ports | Platform core | Foundation substrate | Append-only events, replay, locks, CAS, and `.fgos` path registry are truth substrate. Coding consumes them but does not own them. |
| F2 / Domain Registry And Workflow Definition Loader | Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary | Stage vocabulary, legal operations, workflow selection, task-spec/skill mappings, and role metadata are domain declarations consumed by Work Driver and Agent Coordination. This is a general runtime-definition loader, not setup/distribution config. |
| F3 / Claim And Runtime Occupancy Coordination | Work Driver / Runtime Occupancy Support | Platform core | Integration support | Effective claim state, worker-slot pressure, and main-checkout safety are about running Work safely. Coding is the first heavy user, but other Work-backed domains can need occupancy. |
| F4 / Work Driver And Automation Engine | Work Driver / Domain Workflow Interpreter | Platform core | Integration engine | It chooses ready Work and legal declared operations, then calls lifecycle/dispatch surfaces. It is a shared Work-backed-domain engine, not a Coding Domain component. |
| F5 / Coding Repository Integration Core | Coding Domain Component / Coding Domain Core | Domain | Domain core | Worktree, branch, merge, drift, cleanup, verification gates, and technical approval depend on repository/code-change semantics. Marketing or operations Work must not inherit them. |
| F6 / Setup, Doctor, And Distribution Health | Setup, Doctor, And Distribution Health | Platform support | Support infrastructure | New domains, protocols, executors, binaries, services, config defaults, and directories must be discoverable through setup/doctor instead of hidden prerequisites. |
| F7 / Gateway And External Interface Control Plane | Host And Surface Layer | Host surface | Adapter/surface | Gateway, REST, MCP, Herdr, auth, terminal ports, and VerbGateway expose/control surfaces. They are visibility and integration, not lifecycle/evidence truth. |
| F8 / Knowledge, Learning, And Documentation Registry | Learning, Knowledge, And Documentation Registry | Platform support | Support infrastructure | Coding currently generates much of the learning, but the registry/index/projection model is cross-domain retrospective infrastructure. |

Naming risks that remain active:

- `runtime-coordination.mjs` means claim/runtime occupancy, not
  CoordinationSession.
- `session.mjs` means git checkout session, not CoordinationSession.
- `graph-harness.mjs` and `cleanup-harness.mjs` are coding readiness/cleanup
  gates, not ADR-007 generic domain harnesses.
- `operation-choice.mjs` is currently under dispatch, but its authority is
  closer to Work Driver / Domain Workflow Interpreter.
- `assignment-runner.mjs` and `result-ladder.mjs` may keep implementation
  plumbing near dispatch for now, but target authority remains split between
  Dispatch/Run Runtime and Run Result Evaluator.
```

### Full target shown text

```text
## 8. Advisory Section 18 Cluster Classification

| Cluster | Draft owner | Platform layer | Component category | Why |
|---|---|---|---|---|
| F1 / Work State And Event Store Kernel | Work Lifecycle Engine, with reusable store utilities only behind explicit ports | Platform core | Foundation substrate | Append-only events, replay, locks, CAS, and `.fgos` path registry are truth substrate. Coding consumes them but does not own them. |
| F2 / Domain Registry And Workflow Definition Loader | Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary | Stage vocabulary, legal operations, workflow selection, task-spec/skill mappings, and role metadata are domain declarations consumed by Work Driver and Agent Coordination. This is a general runtime-definition loader, not setup/distribution config. |
| F3 / Claim And Runtime Occupancy Coordination | Work Driver / Runtime Occupancy Support | Platform core | Integration support | Effective claim state, worker-slot pressure, and main-checkout safety are about running Work safely. Coding is the first heavy user, but other Work-backed domains can need occupancy. |
| F4 / Work Driver And Automation Engine | Work Driver / Domain Workflow Interpreter | Platform core | Integration engine | It chooses ready Work and legal declared operations, then calls lifecycle/dispatch surfaces. It is a shared Work-backed-domain engine, not a Coding Domain component. |
| F5 / Coding Repository Integration Core | Coding Domain Component / Coding Domain Core | Domain | Domain core | Worktree, branch, merge, drift, cleanup, verification gates, and technical approval depend on repository/code-change semantics. Marketing or operations Work must not inherit them. |
| F6 / Setup, Doctor, And Distribution Health | Setup, Doctor, And Distribution Health | Platform support | Support infrastructure | New domains, protocols, executors, binaries, services, config defaults, and directories must be discoverable through setup/doctor instead of hidden prerequisites. |
| F7 / Gateway And External Interface Control Plane | Host And Surface Layer | Host surface | Adapter/surface | Gateway, REST, MCP, Herdr, auth, terminal ports, and VerbGateway expose/control surfaces. They are visibility and integration, not lifecycle/evidence truth. |
| F8 / Knowledge, Learning, And Documentation Registry | Learning, Knowledge, And Documentation Registry | Platform support | Support infrastructure | Coding currently generates much of the learning, but the registry/index/projection model is cross-domain retrospective infrastructure. |

Naming risks that remain active:

- `runtime-coordination.mjs` means claim/runtime occupancy, not
  CoordinationSession.
- `session.mjs` means git checkout session, not CoordinationSession.
- `graph-harness.mjs` and `cleanup-harness.mjs` are coding readiness/cleanup
  gates, not ADR-007 generic domain harnesses.
- `operation-choice.mjs` is currently under dispatch, but its authority is
  closer to Work Driver / Domain Workflow Interpreter.
- `assignment-runner.mjs` and `result-ladder.mjs` may keep implementation
  plumbing near dispatch for now, but target authority remains split between
  Dispatch/Run Runtime and Run Result Evaluator.
```

## claim_1c47b30f7273f17c77152d51c850cfaa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-20, lines 233–242.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-23.
Source digest: 0366d012cecb6b38d124dc5a2770d49716f7c1117da75ff981c5aba3b89c813b
Target digest: 0366d012cecb6b38d124dc5a2770d49716f7c1117da75ff981c5aba3b89c813b
Shown source SHA256: 0366d012cecb6b38d124dc5a2770d49716f7c1117da75ff981c5aba3b89c813b
Shown target SHA256: 0366d012cecb6b38d124dc5a2770d49716f7c1117da75ff981c5aba3b89c813b

### Proposed decision

```json
{
  "claimId": "claim_1c47b30f7273f17c77152d51c850cfaa",
  "sourceUnitDigest": "0366d012cecb6b38d124dc5a2770d49716f7c1117da75ff981c5aba3b89c813b",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "0366d012cecb6b38d124dc5a2770d49716f7c1117da75ff981c5aba3b89c813b",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "8. Advisory Section 18 Cluster Classification"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-20 (lines 233–242) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-23 (lines 257–266); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Cluster | Draft owner | Platform layer | Component category | Why |
|---|---|---|---|---|
| F1 / Work State And Event Store Kernel | Work Lifecycle Engine, with reusable store utilities only behind explicit ports | Platform core | Foundation substrate | Append-only events, replay, locks, CAS, and `.fgos` path registry are truth substrate. Coding consumes them but does not own them. |
| F2 / Domain Registry And Workflow Definition Loader | Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary | Stage vocabulary, legal operations, workflow selection, task-spec/skill mappings, and role metadata are domain declarations consumed by Work Driver and Agent Coordination. This is a general runtime-definition loader, not setup/distribution config. |
| F3 / Claim And Runtime Occupancy Coordination | Work Driver / Runtime Occupancy Support | Platform core | Integration support | Effective claim state, worker-slot pressure, and main-checkout safety are about running Work safely. Coding is the first heavy user, but other Work-backed domains can need occupancy. |
| F4 / Work Driver And Automation Engine | Work Driver / Domain Workflow Interpreter | Platform core | Integration engine | It chooses ready Work and legal declared operations, then calls lifecycle/dispatch surfaces. It is a shared Work-backed-domain engine, not a Coding Domain component. |
| F5 / Coding Repository Integration Core | Coding Domain Component / Coding Domain Core | Domain | Domain core | Worktree, branch, merge, drift, cleanup, verification gates, and technical approval depend on repository/code-change semantics. Marketing or operations Work must not inherit them. |
| F6 / Setup, Doctor, And Distribution Health | Setup, Doctor, And Distribution Health | Platform support | Support infrastructure | New domains, protocols, executors, binaries, services, config defaults, and directories must be discoverable through setup/doctor instead of hidden prerequisites. |
| F7 / Gateway And External Interface Control Plane | Host And Surface Layer | Host surface | Adapter/surface | Gateway, REST, MCP, Herdr, auth, terminal ports, and VerbGateway expose/control surfaces. They are visibility and integration, not lifecycle/evidence truth. |
| F8 / Knowledge, Learning, And Documentation Registry | Learning, Knowledge, And Documentation Registry | Platform support | Support infrastructure | Coding currently generates much of the learning, but the registry/index/projection model is cross-domain retrospective infrastructure. |
```

### Full target shown text

```text
| Cluster | Draft owner | Platform layer | Component category | Why |
|---|---|---|---|---|
| F1 / Work State And Event Store Kernel | Work Lifecycle Engine, with reusable store utilities only behind explicit ports | Platform core | Foundation substrate | Append-only events, replay, locks, CAS, and `.fgos` path registry are truth substrate. Coding consumes them but does not own them. |
| F2 / Domain Registry And Workflow Definition Loader | Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary | Stage vocabulary, legal operations, workflow selection, task-spec/skill mappings, and role metadata are domain declarations consumed by Work Driver and Agent Coordination. This is a general runtime-definition loader, not setup/distribution config. |
| F3 / Claim And Runtime Occupancy Coordination | Work Driver / Runtime Occupancy Support | Platform core | Integration support | Effective claim state, worker-slot pressure, and main-checkout safety are about running Work safely. Coding is the first heavy user, but other Work-backed domains can need occupancy. |
| F4 / Work Driver And Automation Engine | Work Driver / Domain Workflow Interpreter | Platform core | Integration engine | It chooses ready Work and legal declared operations, then calls lifecycle/dispatch surfaces. It is a shared Work-backed-domain engine, not a Coding Domain component. |
| F5 / Coding Repository Integration Core | Coding Domain Component / Coding Domain Core | Domain | Domain core | Worktree, branch, merge, drift, cleanup, verification gates, and technical approval depend on repository/code-change semantics. Marketing or operations Work must not inherit them. |
| F6 / Setup, Doctor, And Distribution Health | Setup, Doctor, And Distribution Health | Platform support | Support infrastructure | New domains, protocols, executors, binaries, services, config defaults, and directories must be discoverable through setup/doctor instead of hidden prerequisites. |
| F7 / Gateway And External Interface Control Plane | Host And Surface Layer | Host surface | Adapter/surface | Gateway, REST, MCP, Herdr, auth, terminal ports, and VerbGateway expose/control surfaces. They are visibility and integration, not lifecycle/evidence truth. |
| F8 / Knowledge, Learning, And Documentation Registry | Learning, Knowledge, And Documentation Registry | Platform support | Support infrastructure | Coding currently generates much of the learning, but the registry/index/projection model is cross-domain retrospective infrastructure. |
```

## claim_c7221a5770c99130c9096460978139aa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-21, lines 244–244.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-24.
Source digest: 4966a55ce801a1f4fd8405e8ef0fbb207f819efad73314d965c85fc2b0c288ef
Target digest: 4966a55ce801a1f4fd8405e8ef0fbb207f819efad73314d965c85fc2b0c288ef
Shown source SHA256: 4966a55ce801a1f4fd8405e8ef0fbb207f819efad73314d965c85fc2b0c288ef
Shown target SHA256: 4966a55ce801a1f4fd8405e8ef0fbb207f819efad73314d965c85fc2b0c288ef

### Proposed decision

```json
{
  "claimId": "claim_c7221a5770c99130c9096460978139aa",
  "sourceUnitDigest": "4966a55ce801a1f4fd8405e8ef0fbb207f819efad73314d965c85fc2b0c288ef",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "4966a55ce801a1f4fd8405e8ef0fbb207f819efad73314d965c85fc2b0c288ef",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "8. Advisory Section 18 Cluster Classification"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-21 (lines 244–244) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-24 (lines 268–268); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Naming risks that remain active:
```

### Full target shown text

```text
Naming risks that remain active:
```

## claim_f0ec2f1974378c305e326f25aeb91a24

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-22, lines 246–255.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-25.
Source digest: 3f073ecf54ce169bb6a191ab50cc355d5b6f418137f31090130a878195c64294
Target digest: 3f073ecf54ce169bb6a191ab50cc355d5b6f418137f31090130a878195c64294
Shown source SHA256: 3f073ecf54ce169bb6a191ab50cc355d5b6f418137f31090130a878195c64294
Shown target SHA256: 3f073ecf54ce169bb6a191ab50cc355d5b6f418137f31090130a878195c64294

### Proposed decision

```json
{
  "claimId": "claim_f0ec2f1974378c305e326f25aeb91a24",
  "sourceUnitDigest": "3f073ecf54ce169bb6a191ab50cc355d5b6f418137f31090130a878195c64294",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "3f073ecf54ce169bb6a191ab50cc355d5b6f418137f31090130a878195c64294",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "8. Advisory Section 18 Cluster Classification"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-22 (lines 246–255) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-25 (lines 270–279); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- `runtime-coordination.mjs` means claim/runtime occupancy, not
  CoordinationSession.
- `session.mjs` means git checkout session, not CoordinationSession.
- `graph-harness.mjs` and `cleanup-harness.mjs` are coding readiness/cleanup
  gates, not ADR-007 generic domain harnesses.
- `operation-choice.mjs` is currently under dispatch, but its authority is
  closer to Work Driver / Domain Workflow Interpreter.
- `assignment-runner.mjs` and `result-ladder.mjs` may keep implementation
  plumbing near dispatch for now, but target authority remains split between
  Dispatch/Run Runtime and Run Result Evaluator.
```

### Full target shown text

```text
- `runtime-coordination.mjs` means claim/runtime occupancy, not
  CoordinationSession.
- `session.mjs` means git checkout session, not CoordinationSession.
- `graph-harness.mjs` and `cleanup-harness.mjs` are coding readiness/cleanup
  gates, not ADR-007 generic domain harnesses.
- `operation-choice.mjs` is currently under dispatch, but its authority is
  closer to Work Driver / Domain Workflow Interpreter.
- `assignment-runner.mjs` and `result-ladder.mjs` may keep implementation
  plumbing near dispatch for now, but target authority remains split between
  Dispatch/Run Runtime and Run Result Evaluator.
```

## claim_b80fee8bb2d6a1562787cceca48f236f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#9-coding-domain-responsibility-map, lines 257–257.
Target: docs/platform/proposals/component-authority-boundary-map.md#9-coding-domain-responsibility-map.
Source digest: 33f9100bd3d171f94774695172826230e6fd8ab858eec462eeedec4a26fa1439
Target digest: 33f9100bd3d171f94774695172826230e6fd8ab858eec462eeedec4a26fa1439
Shown source SHA256: 5b8f47e9c5f5bfca11ad0400a71bb311aab5f729e450880a3cf4966fd07b7c91
Shown target SHA256: 5b8f47e9c5f5bfca11ad0400a71bb311aab5f729e450880a3cf4966fd07b7c91

### Proposed decision

```json
{
  "claimId": "claim_b80fee8bb2d6a1562787cceca48f236f",
  "sourceUnitDigest": "33f9100bd3d171f94774695172826230e6fd8ab858eec462eeedec4a26fa1439",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "9-coding-domain-responsibility-map",
  "targetUnitDigest": "33f9100bd3d171f94774695172826230e6fd8ab858eec462eeedec4a26fa1439",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#9-coding-domain-responsibility-map (lines 257–257) is carried at docs/platform/proposals/component-authority-boundary-map.md#9-coding-domain-responsibility-map (lines 281–281); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 9. Coding Domain Responsibility Map

Coding Domain Component is large enough to contain its own subcomponents:

| Subcomponent | Owns | Consumes |
|---|---|---|
| Coding Domain Core | Repository scope, allowed footprint, resource conflict model, worktree/branch/isolation policy, merge/catchup, technical approval, verification doctrine, coding evidence adapters. | Work Lifecycle for Work state; Agent Coordination for sessions/Assignments; Dispatch/Run Runtime for execution; Run Result Evaluator for final confidence. |
| Coding Product/Design Flow, name open | Requirement discovery, product requirement detail, architecture/design decision, implementation shape, high-level implementation sequence, decision capture, feasibility proof, and handoff package for implementation. This is an escalation flow for heavy or ambiguous items. | Coding Domain Core for repo constraints and feasibility; Work Driver for operation choice; Agent Coordination for consult/review/research sessions. |
| Coding Cook Workflow | Implementation from a sufficiently detailed item: detailed execution planning, concrete task split, execution acceleration/stability, verify, review, fix red findings, prepare approval/merge evidence. This is the candidate rename/replacement for today's implementation half of `feature`. | Coding Domain Core for repo mechanics; Work Driver for operation choice; Agent Coordination for collaboration operations; Run Result Evaluator for confidence. |
| Coding Bugfix Workflow | Reproduce/diagnose/fix/verify/review doctrine, bugfix stages/operations, bugfix TaskSpecs and Skills. | Coding Domain Core and the same platform engines. |
| Coding Small-Change Policy/Path, open | A possible fast path for small coding work where the domain contract can prove enough detail and evidence without a full upstream product/design flow. It is not yet clear whether this should be a workflow, a cook mode, or only a routing policy. | Coding Domain Core and the same platform engines. |

Draft flow relationship:

```txt
Coding Product/Design Flow (name open)
  -> detailed requirement/design/architecture/shape artifact
  -> high-level implementation sequence
  -> implementation-ready Work item or handoff package
  -> Coding Cook Workflow
       -> detailed execution plan
       -> concrete child/task split where useful
       -> implementation / verify / review
```

Planning vocabulary split:

| Planning meaning | Belongs to | Human posture | Output |
|---|---|---|---|
| Product/design planning | Product/Design Flow, name open | Human-adjacent when product or architecture decisions are material; machine should research and propose first, then ask only for real decisions. | Requirements, architecture/design decision, implementation shape, high-level sequence, accepted constraints, readiness verdict for `cook`. |
| Execution planning | Cook Workflow | Machine-owned by default; no human gate unless the item is missing a product/design decision or crosses an explicit approval/risk threshold. | Detailed task split, order of work, verification plan, resource/footprint plan, dispatch-ready units. |

The boundary is not "planning vs implementation." It is "decision-shaping
planning" versus "execution planning." The first reduces ambiguity and locks
the work's shape. The second increases speed and stability once the shape is
already good enough.

Cross-flow routing belongs to the domain workflow layer:

- default route for a sufficiently detailed coding item is `cook`;
- under-specified, heavy, or architecture-sensitive feature enters the
  upstream product/design flow;
- upstream product/design output routes into `cook`;
- a `cook` item that discovers missing product/design decisions routes back to
  the upstream product/design flow or parks with a named question;
- detailed decomposition inside `cook` is an execution optimization, not a
  human gate.

Candidate names for the upstream flow:

| Candidate name | Fit |
|---|---|
| `shape` | Short and close to current doctrine; may be too narrow if it must include product requirements and coding design. |
| `design` | Clear for technical design, weaker for product requirement discussion. |
| `define` | Emphasizes deciding what the work is before cooking it; less tied to code. |
| `spec` | Emphasizes requirement/design artifact output; risks confusion with `docs/specs/` accepted state layer. |
| `forge` | Product-flavored, but less mechanically obvious than `shape` or `define`. |

No name is accepted yet. `define` remains the best current candidate, but it
does not fully satisfy the desired nuance. Reserve `shape` for the final
operation inside the upstream flow that prepares the handoff to `cook`.

Simple item rule:

```txt
Route directly to cook when requirement, acceptance, verify, and footprint are
already sufficient. Route to the upstream product/design flow only when a
readiness check finds material requirement ambiguity, architecture/design
choices, cross-component sequencing, or unresolved product decisions.
```

The small-change path is still open. It should not be named as a real workflow
until an accepted coding-domain design decides whether "small" means a separate workflow, a mode inside
`cook`, or only a routing policy that skips the upstream product/design flow.

The test for whether a concern belongs in Coding Domain Core:

```txt
If removing Git, branches, worktrees, code deltas, build/test verification, or
technical code approval would make the model meaningless, it is coding-domain.
Otherwise classify it by its generic authority first.
```
````

### Full target shown text

````text
## 9. Coding Domain Responsibility Map

Coding Domain Component is large enough to contain its own subcomponents:

| Subcomponent | Owns | Consumes |
|---|---|---|
| Coding Domain Core | Repository scope, allowed footprint, resource conflict model, worktree/branch/isolation policy, merge/catchup, technical approval, verification doctrine, coding evidence adapters. | Work Lifecycle for Work state; Agent Coordination for sessions/Assignments; Dispatch/Run Runtime for execution; Run Result Evaluator for final confidence. |
| Coding Product/Design Flow, name open | Requirement discovery, product requirement detail, architecture/design decision, implementation shape, high-level implementation sequence, decision capture, feasibility proof, and handoff package for implementation. This is an escalation flow for heavy or ambiguous items. | Coding Domain Core for repo constraints and feasibility; Work Driver for operation choice; Agent Coordination for consult/review/research sessions. |
| Coding Cook Workflow | Implementation from a sufficiently detailed item: detailed execution planning, concrete task split, execution acceleration/stability, verify, review, fix red findings, prepare approval/merge evidence. This is the candidate rename/replacement for today's implementation half of `feature`. | Coding Domain Core for repo mechanics; Work Driver for operation choice; Agent Coordination for collaboration operations; Run Result Evaluator for confidence. |
| Coding Bugfix Workflow | Reproduce/diagnose/fix/verify/review doctrine, bugfix stages/operations, bugfix TaskSpecs and Skills. | Coding Domain Core and the same platform engines. |
| Coding Small-Change Policy/Path, open | A possible fast path for small coding work where the domain contract can prove enough detail and evidence without a full upstream product/design flow. It is not yet clear whether this should be a workflow, a cook mode, or only a routing policy. | Coding Domain Core and the same platform engines. |

Draft flow relationship:

```txt
Coding Product/Design Flow (name open)
  -> detailed requirement/design/architecture/shape artifact
  -> high-level implementation sequence
  -> implementation-ready Work item or handoff package
  -> Coding Cook Workflow
       -> detailed execution plan
       -> concrete child/task split where useful
       -> implementation / verify / review
```

Planning vocabulary split:

| Planning meaning | Belongs to | Human posture | Output |
|---|---|---|---|
| Product/design planning | Product/Design Flow, name open | Human-adjacent when product or architecture decisions are material; machine should research and propose first, then ask only for real decisions. | Requirements, architecture/design decision, implementation shape, high-level sequence, accepted constraints, readiness verdict for `cook`. |
| Execution planning | Cook Workflow | Machine-owned by default; no human gate unless the item is missing a product/design decision or crosses an explicit approval/risk threshold. | Detailed task split, order of work, verification plan, resource/footprint plan, dispatch-ready units. |

The boundary is not "planning vs implementation." It is "decision-shaping
planning" versus "execution planning." The first reduces ambiguity and locks
the work's shape. The second increases speed and stability once the shape is
already good enough.

Cross-flow routing belongs to the domain workflow layer:

- default route for a sufficiently detailed coding item is `cook`;
- under-specified, heavy, or architecture-sensitive feature enters the
  upstream product/design flow;
- upstream product/design output routes into `cook`;
- a `cook` item that discovers missing product/design decisions routes back to
  the upstream product/design flow or parks with a named question;
- detailed decomposition inside `cook` is an execution optimization, not a
  human gate.

Candidate names for the upstream flow:

| Candidate name | Fit |
|---|---|
| `shape` | Short and close to current doctrine; may be too narrow if it must include product requirements and coding design. |
| `design` | Clear for technical design, weaker for product requirement discussion. |
| `define` | Emphasizes deciding what the work is before cooking it; less tied to code. |
| `spec` | Emphasizes requirement/design artifact output; risks confusion with `docs/specs/` accepted state layer. |
| `forge` | Product-flavored, but less mechanically obvious than `shape` or `define`. |

No name is accepted yet. `define` remains the best current candidate, but it
does not fully satisfy the desired nuance. Reserve `shape` for the final
operation inside the upstream flow that prepares the handoff to `cook`.

Simple item rule:

```txt
Route directly to cook when requirement, acceptance, verify, and footprint are
already sufficient. Route to the upstream product/design flow only when a
readiness check finds material requirement ambiguity, architecture/design
choices, cross-component sequencing, or unresolved product decisions.
```

The small-change path is still open. It should not be named as a real workflow
until an accepted coding-domain design decides whether "small" means a separate workflow, a mode inside
`cook`, or only a routing policy that skips the upstream product/design flow.

The test for whether a concern belongs in Coding Domain Core:

```txt
If removing Git, branches, worktrees, code deltas, build/test verification, or
technical code approval would make the model meaningless, it is coding-domain.
Otherwise classify it by its generic authority first.
```
````

## claim_eb26e5bf8f5599bdc0c93774f26da4b4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-23, lines 259–259.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-26.
Source digest: b999782f6b45421e4c79dfd855122b7e999966e5a245fd685bb81052199250b6
Target digest: b999782f6b45421e4c79dfd855122b7e999966e5a245fd685bb81052199250b6
Shown source SHA256: b999782f6b45421e4c79dfd855122b7e999966e5a245fd685bb81052199250b6
Shown target SHA256: b999782f6b45421e4c79dfd855122b7e999966e5a245fd685bb81052199250b6

### Proposed decision

```json
{
  "claimId": "claim_eb26e5bf8f5599bdc0c93774f26da4b4",
  "sourceUnitDigest": "b999782f6b45421e4c79dfd855122b7e999966e5a245fd685bb81052199250b6",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "b999782f6b45421e4c79dfd855122b7e999966e5a245fd685bb81052199250b6",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-23 (lines 259–259) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-26 (lines 283–283); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Coding Domain Component is large enough to contain its own subcomponents:
```

### Full target shown text

```text
Coding Domain Component is large enough to contain its own subcomponents:
```

## claim_4e0e85510d76ef14ffcb6145b73703da

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-24, lines 261–267.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-27.
Source digest: 6cdada4d7ac7284783c713ce23e306a1c57ce0721166a000dadc6546ba048140
Target digest: 6cdada4d7ac7284783c713ce23e306a1c57ce0721166a000dadc6546ba048140
Shown source SHA256: 6cdada4d7ac7284783c713ce23e306a1c57ce0721166a000dadc6546ba048140
Shown target SHA256: 6cdada4d7ac7284783c713ce23e306a1c57ce0721166a000dadc6546ba048140

### Proposed decision

```json
{
  "claimId": "claim_4e0e85510d76ef14ffcb6145b73703da",
  "sourceUnitDigest": "6cdada4d7ac7284783c713ce23e306a1c57ce0721166a000dadc6546ba048140",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "6cdada4d7ac7284783c713ce23e306a1c57ce0721166a000dadc6546ba048140",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-24 (lines 261–267) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-27 (lines 285–291); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Subcomponent | Owns | Consumes |
|---|---|---|
| Coding Domain Core | Repository scope, allowed footprint, resource conflict model, worktree/branch/isolation policy, merge/catchup, technical approval, verification doctrine, coding evidence adapters. | Work Lifecycle for Work state; Agent Coordination for sessions/Assignments; Dispatch/Run Runtime for execution; Run Result Evaluator for final confidence. |
| Coding Product/Design Flow, name open | Requirement discovery, product requirement detail, architecture/design decision, implementation shape, high-level implementation sequence, decision capture, feasibility proof, and handoff package for implementation. This is an escalation flow for heavy or ambiguous items. | Coding Domain Core for repo constraints and feasibility; Work Driver for operation choice; Agent Coordination for consult/review/research sessions. |
| Coding Cook Workflow | Implementation from a sufficiently detailed item: detailed execution planning, concrete task split, execution acceleration/stability, verify, review, fix red findings, prepare approval/merge evidence. This is the candidate rename/replacement for today's implementation half of `feature`. | Coding Domain Core for repo mechanics; Work Driver for operation choice; Agent Coordination for collaboration operations; Run Result Evaluator for confidence. |
| Coding Bugfix Workflow | Reproduce/diagnose/fix/verify/review doctrine, bugfix stages/operations, bugfix TaskSpecs and Skills. | Coding Domain Core and the same platform engines. |
| Coding Small-Change Policy/Path, open | A possible fast path for small coding work where the domain contract can prove enough detail and evidence without a full upstream product/design flow. It is not yet clear whether this should be a workflow, a cook mode, or only a routing policy. | Coding Domain Core and the same platform engines. |
```

### Full target shown text

```text
| Subcomponent | Owns | Consumes |
|---|---|---|
| Coding Domain Core | Repository scope, allowed footprint, resource conflict model, worktree/branch/isolation policy, merge/catchup, technical approval, verification doctrine, coding evidence adapters. | Work Lifecycle for Work state; Agent Coordination for sessions/Assignments; Dispatch/Run Runtime for execution; Run Result Evaluator for final confidence. |
| Coding Product/Design Flow, name open | Requirement discovery, product requirement detail, architecture/design decision, implementation shape, high-level implementation sequence, decision capture, feasibility proof, and handoff package for implementation. This is an escalation flow for heavy or ambiguous items. | Coding Domain Core for repo constraints and feasibility; Work Driver for operation choice; Agent Coordination for consult/review/research sessions. |
| Coding Cook Workflow | Implementation from a sufficiently detailed item: detailed execution planning, concrete task split, execution acceleration/stability, verify, review, fix red findings, prepare approval/merge evidence. This is the candidate rename/replacement for today's implementation half of `feature`. | Coding Domain Core for repo mechanics; Work Driver for operation choice; Agent Coordination for collaboration operations; Run Result Evaluator for confidence. |
| Coding Bugfix Workflow | Reproduce/diagnose/fix/verify/review doctrine, bugfix stages/operations, bugfix TaskSpecs and Skills. | Coding Domain Core and the same platform engines. |
| Coding Small-Change Policy/Path, open | A possible fast path for small coding work where the domain contract can prove enough detail and evidence without a full upstream product/design flow. It is not yet clear whether this should be a workflow, a cook mode, or only a routing policy. | Coding Domain Core and the same platform engines. |
```

## claim_a3ffdcc117b56048591562fda8cb3ec6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-25, lines 269–269.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-28.
Source digest: 61d8d98bdb42ecb212072c4e54616b0f47623d6d84360c9af77988c686decf15
Target digest: 61d8d98bdb42ecb212072c4e54616b0f47623d6d84360c9af77988c686decf15
Shown source SHA256: 61d8d98bdb42ecb212072c4e54616b0f47623d6d84360c9af77988c686decf15
Shown target SHA256: 61d8d98bdb42ecb212072c4e54616b0f47623d6d84360c9af77988c686decf15

### Proposed decision

```json
{
  "claimId": "claim_a3ffdcc117b56048591562fda8cb3ec6",
  "sourceUnitDigest": "61d8d98bdb42ecb212072c4e54616b0f47623d6d84360c9af77988c686decf15",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "61d8d98bdb42ecb212072c4e54616b0f47623d6d84360c9af77988c686decf15",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-25 (lines 269–269) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-28 (lines 293–293); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Draft flow relationship:
```

### Full target shown text

```text
Draft flow relationship:
```

## claim_3c19f4be15314a69a73c0055612e68c2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-26, lines 271–280.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-29.
Source digest: be42b599f34640dc3da9310db42bb40ac26657f1eec70328392736be99839edb
Target digest: be42b599f34640dc3da9310db42bb40ac26657f1eec70328392736be99839edb
Shown source SHA256: be42b599f34640dc3da9310db42bb40ac26657f1eec70328392736be99839edb
Shown target SHA256: be42b599f34640dc3da9310db42bb40ac26657f1eec70328392736be99839edb

### Proposed decision

```json
{
  "claimId": "claim_3c19f4be15314a69a73c0055612e68c2",
  "sourceUnitDigest": "be42b599f34640dc3da9310db42bb40ac26657f1eec70328392736be99839edb",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "be42b599f34640dc3da9310db42bb40ac26657f1eec70328392736be99839edb",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-26 (lines 271–280) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-29 (lines 295–304); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Coding Product/Design Flow (name open)
  -> detailed requirement/design/architecture/shape artifact
  -> high-level implementation sequence
  -> implementation-ready Work item or handoff package
  -> Coding Cook Workflow
       -> detailed execution plan
       -> concrete child/task split where useful
       -> implementation / verify / review
```
````

### Full target shown text

````text
```txt
Coding Product/Design Flow (name open)
  -> detailed requirement/design/architecture/shape artifact
  -> high-level implementation sequence
  -> implementation-ready Work item or handoff package
  -> Coding Cook Workflow
       -> detailed execution plan
       -> concrete child/task split where useful
       -> implementation / verify / review
```
````

## claim_f7155ed6aeea1f6720fa2cc4eadaad71

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-27, lines 282–282.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-30.
Source digest: de63d5ea434f685f8d90153aa10a6415c5d94dc55768eeb36833858a49b08793
Target digest: de63d5ea434f685f8d90153aa10a6415c5d94dc55768eeb36833858a49b08793
Shown source SHA256: de63d5ea434f685f8d90153aa10a6415c5d94dc55768eeb36833858a49b08793
Shown target SHA256: de63d5ea434f685f8d90153aa10a6415c5d94dc55768eeb36833858a49b08793

### Proposed decision

```json
{
  "claimId": "claim_f7155ed6aeea1f6720fa2cc4eadaad71",
  "sourceUnitDigest": "de63d5ea434f685f8d90153aa10a6415c5d94dc55768eeb36833858a49b08793",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "de63d5ea434f685f8d90153aa10a6415c5d94dc55768eeb36833858a49b08793",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-27 (lines 282–282) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-30 (lines 306–306); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Planning vocabulary split:
```

### Full target shown text

```text
Planning vocabulary split:
```

## claim_11298e53c89300e8043ca31768e13db2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-28, lines 284–287.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-31.
Source digest: 1699f0084035c45235b7cf32d6e8925a4feb1d1e851d1d85bb8abb0de7988697
Target digest: 1699f0084035c45235b7cf32d6e8925a4feb1d1e851d1d85bb8abb0de7988697
Shown source SHA256: 1699f0084035c45235b7cf32d6e8925a4feb1d1e851d1d85bb8abb0de7988697
Shown target SHA256: 1699f0084035c45235b7cf32d6e8925a4feb1d1e851d1d85bb8abb0de7988697

### Proposed decision

```json
{
  "claimId": "claim_11298e53c89300e8043ca31768e13db2",
  "sourceUnitDigest": "1699f0084035c45235b7cf32d6e8925a4feb1d1e851d1d85bb8abb0de7988697",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "1699f0084035c45235b7cf32d6e8925a4feb1d1e851d1d85bb8abb0de7988697",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-28 (lines 284–287) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-31 (lines 308–311); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Planning meaning | Belongs to | Human posture | Output |
|---|---|---|---|
| Product/design planning | Product/Design Flow, name open | Human-adjacent when product or architecture decisions are material; machine should research and propose first, then ask only for real decisions. | Requirements, architecture/design decision, implementation shape, high-level sequence, accepted constraints, readiness verdict for `cook`. |
| Execution planning | Cook Workflow | Machine-owned by default; no human gate unless the item is missing a product/design decision or crosses an explicit approval/risk threshold. | Detailed task split, order of work, verification plan, resource/footprint plan, dispatch-ready units. |
```

### Full target shown text

```text
| Planning meaning | Belongs to | Human posture | Output |
|---|---|---|---|
| Product/design planning | Product/Design Flow, name open | Human-adjacent when product or architecture decisions are material; machine should research and propose first, then ask only for real decisions. | Requirements, architecture/design decision, implementation shape, high-level sequence, accepted constraints, readiness verdict for `cook`. |
| Execution planning | Cook Workflow | Machine-owned by default; no human gate unless the item is missing a product/design decision or crosses an explicit approval/risk threshold. | Detailed task split, order of work, verification plan, resource/footprint plan, dispatch-ready units. |
```

## claim_33125a268232511d3183317660030816

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-29, lines 289–292.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-32.
Source digest: 355703702d3a1052df767e8446ddc73cafb406ce39d07562f829b55cb63aaf00
Target digest: 355703702d3a1052df767e8446ddc73cafb406ce39d07562f829b55cb63aaf00
Shown source SHA256: 355703702d3a1052df767e8446ddc73cafb406ce39d07562f829b55cb63aaf00
Shown target SHA256: 355703702d3a1052df767e8446ddc73cafb406ce39d07562f829b55cb63aaf00

### Proposed decision

```json
{
  "claimId": "claim_33125a268232511d3183317660030816",
  "sourceUnitDigest": "355703702d3a1052df767e8446ddc73cafb406ce39d07562f829b55cb63aaf00",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "355703702d3a1052df767e8446ddc73cafb406ce39d07562f829b55cb63aaf00",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-29 (lines 289–292) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-32 (lines 313–316); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The boundary is not "planning vs implementation." It is "decision-shaping
planning" versus "execution planning." The first reduces ambiguity and locks
the work's shape. The second increases speed and stability once the shape is
already good enough.
```

### Full target shown text

```text
The boundary is not "planning vs implementation." It is "decision-shaping
planning" versus "execution planning." The first reduces ambiguity and locks
the work's shape. The second increases speed and stability once the shape is
already good enough.
```

## claim_72ae0caa96d7eb978fec0098e38acbef

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-30, lines 294–294.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-33.
Source digest: 8048d7f5110cb95ee82ae7bee0c7ece0ff571181914e1cda603c5284f58572bd
Target digest: 8048d7f5110cb95ee82ae7bee0c7ece0ff571181914e1cda603c5284f58572bd
Shown source SHA256: 8048d7f5110cb95ee82ae7bee0c7ece0ff571181914e1cda603c5284f58572bd
Shown target SHA256: 8048d7f5110cb95ee82ae7bee0c7ece0ff571181914e1cda603c5284f58572bd

### Proposed decision

```json
{
  "claimId": "claim_72ae0caa96d7eb978fec0098e38acbef",
  "sourceUnitDigest": "8048d7f5110cb95ee82ae7bee0c7ece0ff571181914e1cda603c5284f58572bd",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "8048d7f5110cb95ee82ae7bee0c7ece0ff571181914e1cda603c5284f58572bd",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-30 (lines 294–294) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-33 (lines 318–318); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Cross-flow routing belongs to the domain workflow layer:
```

### Full target shown text

```text
Cross-flow routing belongs to the domain workflow layer:
```

## claim_576462317595ab4fff7e7b94dc966700

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-31, lines 296–303.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-34.
Source digest: ff4140a482a1d3c8ddff42ea939d26eabc8120762a2f5827c1e0470ab1412aff
Target digest: ff4140a482a1d3c8ddff42ea939d26eabc8120762a2f5827c1e0470ab1412aff
Shown source SHA256: ff4140a482a1d3c8ddff42ea939d26eabc8120762a2f5827c1e0470ab1412aff
Shown target SHA256: ff4140a482a1d3c8ddff42ea939d26eabc8120762a2f5827c1e0470ab1412aff

### Proposed decision

```json
{
  "claimId": "claim_576462317595ab4fff7e7b94dc966700",
  "sourceUnitDigest": "ff4140a482a1d3c8ddff42ea939d26eabc8120762a2f5827c1e0470ab1412aff",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "ff4140a482a1d3c8ddff42ea939d26eabc8120762a2f5827c1e0470ab1412aff",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-31 (lines 296–303) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-34 (lines 320–327); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- default route for a sufficiently detailed coding item is `cook`;
- under-specified, heavy, or architecture-sensitive feature enters the
  upstream product/design flow;
- upstream product/design output routes into `cook`;
- a `cook` item that discovers missing product/design decisions routes back to
  the upstream product/design flow or parks with a named question;
- detailed decomposition inside `cook` is an execution optimization, not a
  human gate.
```

### Full target shown text

```text
- default route for a sufficiently detailed coding item is `cook`;
- under-specified, heavy, or architecture-sensitive feature enters the
  upstream product/design flow;
- upstream product/design output routes into `cook`;
- a `cook` item that discovers missing product/design decisions routes back to
  the upstream product/design flow or parks with a named question;
- detailed decomposition inside `cook` is an execution optimization, not a
  human gate.
```

## claim_6b4f048d664c05d1bfed96c8215c14ed

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-32, lines 305–305.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-35.
Source digest: db0e42034452ef3218a7ec5e738f4388b27d882b617b8aac4808124dd47f01d5
Target digest: db0e42034452ef3218a7ec5e738f4388b27d882b617b8aac4808124dd47f01d5
Shown source SHA256: db0e42034452ef3218a7ec5e738f4388b27d882b617b8aac4808124dd47f01d5
Shown target SHA256: db0e42034452ef3218a7ec5e738f4388b27d882b617b8aac4808124dd47f01d5

### Proposed decision

```json
{
  "claimId": "claim_6b4f048d664c05d1bfed96c8215c14ed",
  "sourceUnitDigest": "db0e42034452ef3218a7ec5e738f4388b27d882b617b8aac4808124dd47f01d5",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "db0e42034452ef3218a7ec5e738f4388b27d882b617b8aac4808124dd47f01d5",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-32 (lines 305–305) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-35 (lines 329–329); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Candidate names for the upstream flow:
```

### Full target shown text

```text
Candidate names for the upstream flow:
```

## claim_c12f6da895d5fe3c354894e8c0f9c2a0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-33, lines 307–313.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-36.
Source digest: 69a8bb6d45afdc7f4080590ea9ec61b1b9b144e061b865efcdacdfec5b0bc0b4
Target digest: 69a8bb6d45afdc7f4080590ea9ec61b1b9b144e061b865efcdacdfec5b0bc0b4
Shown source SHA256: 69a8bb6d45afdc7f4080590ea9ec61b1b9b144e061b865efcdacdfec5b0bc0b4
Shown target SHA256: 69a8bb6d45afdc7f4080590ea9ec61b1b9b144e061b865efcdacdfec5b0bc0b4

### Proposed decision

```json
{
  "claimId": "claim_c12f6da895d5fe3c354894e8c0f9c2a0",
  "sourceUnitDigest": "69a8bb6d45afdc7f4080590ea9ec61b1b9b144e061b865efcdacdfec5b0bc0b4",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "69a8bb6d45afdc7f4080590ea9ec61b1b9b144e061b865efcdacdfec5b0bc0b4",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-33 (lines 307–313) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-36 (lines 331–337); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Candidate name | Fit |
|---|---|
| `shape` | Short and close to current doctrine; may be too narrow if it must include product requirements and coding design. |
| `design` | Clear for technical design, weaker for product requirement discussion. |
| `define` | Emphasizes deciding what the work is before cooking it; less tied to code. |
| `spec` | Emphasizes requirement/design artifact output; risks confusion with `docs/specs/` accepted state layer. |
| `forge` | Product-flavored, but less mechanically obvious than `shape` or `define`. |
```

### Full target shown text

```text
| Candidate name | Fit |
|---|---|
| `shape` | Short and close to current doctrine; may be too narrow if it must include product requirements and coding design. |
| `design` | Clear for technical design, weaker for product requirement discussion. |
| `define` | Emphasizes deciding what the work is before cooking it; less tied to code. |
| `spec` | Emphasizes requirement/design artifact output; risks confusion with `docs/specs/` accepted state layer. |
| `forge` | Product-flavored, but less mechanically obvious than `shape` or `define`. |
```

## claim_1705fb6afbad108d02787b58e543ae15

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-34, lines 315–317.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-37.
Source digest: df9c17f823091797d41ba2948737090579200085d74b5c7eb8e964bd6f96b9d0
Target digest: df9c17f823091797d41ba2948737090579200085d74b5c7eb8e964bd6f96b9d0
Shown source SHA256: df9c17f823091797d41ba2948737090579200085d74b5c7eb8e964bd6f96b9d0
Shown target SHA256: df9c17f823091797d41ba2948737090579200085d74b5c7eb8e964bd6f96b9d0

### Proposed decision

```json
{
  "claimId": "claim_1705fb6afbad108d02787b58e543ae15",
  "sourceUnitDigest": "df9c17f823091797d41ba2948737090579200085d74b5c7eb8e964bd6f96b9d0",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "df9c17f823091797d41ba2948737090579200085d74b5c7eb8e964bd6f96b9d0",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-34 (lines 315–317) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-37 (lines 339–341); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
No name is accepted yet. `define` remains the best current candidate, but it
does not fully satisfy the desired nuance. Reserve `shape` for the final
operation inside the upstream flow that prepares the handoff to `cook`.
```

### Full target shown text

```text
No name is accepted yet. `define` remains the best current candidate, but it
does not fully satisfy the desired nuance. Reserve `shape` for the final
operation inside the upstream flow that prepares the handoff to `cook`.
```

## claim_1268896fbe8053e6ff7d86140d757c96

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-35, lines 319–326.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-38.
Source digest: 90b862a874b720bc819a021d1dc330899b001980c87ed32a7b3a6872f60f82ce
Target digest: 90b862a874b720bc819a021d1dc330899b001980c87ed32a7b3a6872f60f82ce
Shown source SHA256: 90b862a874b720bc819a021d1dc330899b001980c87ed32a7b3a6872f60f82ce
Shown target SHA256: 90b862a874b720bc819a021d1dc330899b001980c87ed32a7b3a6872f60f82ce

### Proposed decision

```json
{
  "claimId": "claim_1268896fbe8053e6ff7d86140d757c96",
  "sourceUnitDigest": "90b862a874b720bc819a021d1dc330899b001980c87ed32a7b3a6872f60f82ce",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "90b862a874b720bc819a021d1dc330899b001980c87ed32a7b3a6872f60f82ce",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-35 (lines 319–326) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-38 (lines 343–350); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Simple item rule:

```txt
Route directly to cook when requirement, acceptance, verify, and footprint are
already sufficient. Route to the upstream product/design flow only when a
readiness check finds material requirement ambiguity, architecture/design
choices, cross-component sequencing, or unresolved product decisions.
```
````

### Full target shown text

````text
Simple item rule:

```txt
Route directly to cook when requirement, acceptance, verify, and footprint are
already sufficient. Route to the upstream product/design flow only when a
readiness check finds material requirement ambiguity, architecture/design
choices, cross-component sequencing, or unresolved product decisions.
```
````

## claim_46e140ec7ee784d10d4b54af1ef3b822

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-36, lines 328–330.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-39.
Source digest: 45a54ecc733263f0922a7a0c67dd693e8c4ea184aec469cae405744a46bc3364
Target digest: 45a54ecc733263f0922a7a0c67dd693e8c4ea184aec469cae405744a46bc3364
Shown source SHA256: 45a54ecc733263f0922a7a0c67dd693e8c4ea184aec469cae405744a46bc3364
Shown target SHA256: 45a54ecc733263f0922a7a0c67dd693e8c4ea184aec469cae405744a46bc3364

### Proposed decision

```json
{
  "claimId": "claim_46e140ec7ee784d10d4b54af1ef3b822",
  "sourceUnitDigest": "45a54ecc733263f0922a7a0c67dd693e8c4ea184aec469cae405744a46bc3364",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "45a54ecc733263f0922a7a0c67dd693e8c4ea184aec469cae405744a46bc3364",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-36 (lines 328–330) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-39 (lines 352–354); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The small-change path is still open. It should not be named as a real workflow
until an accepted coding-domain design decides whether "small" means a separate workflow, a mode inside
`cook`, or only a routing policy that skips the upstream product/design flow.
```

### Full target shown text

```text
The small-change path is still open. It should not be named as a real workflow
until an accepted coding-domain design decides whether "small" means a separate workflow, a mode inside
`cook`, or only a routing policy that skips the upstream product/design flow.
```

## claim_bfd9fcf9b3a794cd757f40f26cf8d1c8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-37, lines 332–332.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-40.
Source digest: 4289e5cfc4b41b5ff2bfaa16b954ea25e8108f0f6c35f002687e42b6e8884587
Target digest: 4289e5cfc4b41b5ff2bfaa16b954ea25e8108f0f6c35f002687e42b6e8884587
Shown source SHA256: 4289e5cfc4b41b5ff2bfaa16b954ea25e8108f0f6c35f002687e42b6e8884587
Shown target SHA256: 4289e5cfc4b41b5ff2bfaa16b954ea25e8108f0f6c35f002687e42b6e8884587

### Proposed decision

```json
{
  "claimId": "claim_bfd9fcf9b3a794cd757f40f26cf8d1c8",
  "sourceUnitDigest": "4289e5cfc4b41b5ff2bfaa16b954ea25e8108f0f6c35f002687e42b6e8884587",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "4289e5cfc4b41b5ff2bfaa16b954ea25e8108f0f6c35f002687e42b6e8884587",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-37 (lines 332–332) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-40 (lines 356–356); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The test for whether a concern belongs in Coding Domain Core:
```

### Full target shown text

```text
The test for whether a concern belongs in Coding Domain Core:
```

## claim_e9d56d5b49da3053f773bf5ee3260037

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-38, lines 334–338.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-41.
Source digest: 37693e5577a2a36b569cc50553047c923b7bd58b0f38915c77376a92130d866b
Target digest: 37693e5577a2a36b569cc50553047c923b7bd58b0f38915c77376a92130d866b
Shown source SHA256: 37693e5577a2a36b569cc50553047c923b7bd58b0f38915c77376a92130d866b
Shown target SHA256: 37693e5577a2a36b569cc50553047c923b7bd58b0f38915c77376a92130d866b

### Proposed decision

```json
{
  "claimId": "claim_e9d56d5b49da3053f773bf5ee3260037",
  "sourceUnitDigest": "37693e5577a2a36b569cc50553047c923b7bd58b0f38915c77376a92130d866b",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "37693e5577a2a36b569cc50553047c923b7bd58b0f38915c77376a92130d866b",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "9. Coding Domain Responsibility Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-38 (lines 334–338) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-41 (lines 358–362); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
If removing Git, branches, worktrees, code deltas, build/test verification, or
technical code approval would make the model meaningless, it is coding-domain.
Otherwise classify it by its generic authority first.
```
````

### Full target shown text

````text
```txt
If removing Git, branches, worktrees, code deltas, build/test verification, or
technical code approval would make the model meaningless, it is coding-domain.
Otherwise classify it by its generic authority first.
```
````

## claim_1feeee0631269fa46203c62400f687ad

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#10-driver-router-and-coordination-relationship, lines 340–340.
Target: docs/platform/proposals/component-authority-boundary-map.md#10-driver-router-and-coordination-relationship.
Source digest: 4ce75be44e6aa392c98acbc5c877488bf5a29253226af3337bee3ca498cf1306
Target digest: 4ce75be44e6aa392c98acbc5c877488bf5a29253226af3337bee3ca498cf1306
Shown source SHA256: fd026dbcf021774ee8e443c0b0dff4ea85eb03430959f4f0198d277d1e3a1594
Shown target SHA256: fd026dbcf021774ee8e443c0b0dff4ea85eb03430959f4f0198d277d1e3a1594

### Proposed decision

```json
{
  "claimId": "claim_1feeee0631269fa46203c62400f687ad",
  "sourceUnitDigest": "4ce75be44e6aa392c98acbc5c877488bf5a29253226af3337bee3ca498cf1306",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "10-driver-router-and-coordination-relationship",
  "targetUnitDigest": "4ce75be44e6aa392c98acbc5c877488bf5a29253226af3337bee3ca498cf1306",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#10-driver-router-and-coordination-relationship (lines 340–340) is carried at docs/platform/proposals/component-authority-boundary-map.md#10-driver-router-and-coordination-relationship (lines 364–364); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 10. Driver, Router, And Coordination Relationship

Agent Coordination may have its own session driver/router/launcher vocabulary,
but that does not replace the Work Driver / Domain Workflow Interpreter:

| Driver concern | Owner | Meaning |
|---|---|---|
| Coordination session driving | Agent Coordination Engine | Drive one CoordinationSession: materialize session tasks/Assignments, enforce topology/bounds/recovery, synthesize results. |
| Work/domain workflow driving | Work Driver / Domain Workflow Interpreter | Drive one Work item through domain workflow operations: inspect Work status/stage, select a legal declared Stage Operation, call Agent Coordination or Dispatch, then invoke Work Lifecycle verbs when evidence permits. |

`Router` is not one global component. It is a responsibility scoped by what is
being routed:

| Router scope | Likely owner | Routes |
|---|---|---|
| Surface routing | Host And Surface Layer | CLI/API/plugin request to the correct platform component/verb. |
| Work/domain routing | Work Driver / Domain Workflow Interpreter, using Domain Registry | Work item to domain, workflow, stage operation, or cross-flow route such as upstream product/design flow -> `cook`. |
| Coordination routing | Agent Coordination Engine | Session-local phase/task/actor/topology routing inside one CoordinationSession. |
| Dispatch routing | Dispatch And Execution Engine | One Assignment to executor/provider/model/tier/mechanism under governance. |

These routers may call each other through contracts, but they must not collapse
into one authority. For example, Work/domain routing may decide that a Work
item needs a `validate-plan` reviewer session; Agent Coordination then routes
session tasks and actors; Dispatch routes each Assignment to execution
infrastructure.

Why not move Work Driver into Agent Coordination?

| Reason | Boundary |
|---|---|
| Work Driver requires Work lifecycle authority adjacency. | It reads Work status/stage/claims and invokes Work Lifecycle verbs. Agent Coordination must remain Work-optional and cannot depend on Work to exist. |
| Domain workflows are not coordination protocols. | Coding product/design -> `cook`, marketing content review, and operations runbooks are Work-domain flow semantics. Agent Coordination can execute coordinated actions inside them, but should not own their lifecycle graph. |
| Cross-flow routing can exist without multi-agent coordination. | A simple item may route directly to `cook` and run one Assignment or no session. Putting this in Agent Coordination would make coordination look mandatory. |
| Non-Work coordination must stay clean. | Standalone brainstorm/research sessions should not carry Work status/stage/domain workflow baggage. |
| Other domains should reuse the driver without inheriting coding. | Marketing can plug its workflow config into the same Work/domain driver, while Agent Coordination remains the shared session/Assignment engine. |

Composition:

```txt
Work Driver / Domain Workflow Interpreter
  -> uses Agent Coordination as a coordination engine when a Work operation
     needs session/actor/topology/Assignment machinery

Agent Coordination
  -> does not own Work-domain flow selection or Work lifecycle progression
```

What Work Driver uses from Agent Coordination:

| Agent Coordination capability | How Work Driver uses it |
|---|---|
| CoordinationSession ledger | Opens a Work-attached session with `workRef` so collaboration has recovery, actor/topology/bounds, and one-way Assignment membership. |
| FlowDefinition / protocol parser | Consumes declared protocol or workflow projection shape when selected. The parser validates graph/roles/operations/policy shape; it does not choose Work's next lifecycle action. |
| Assignment Builder | Freezes the Work Driver's selected declared operation, or a validated inline contract, into immutable Assignment intent. |
| Team cognition / coordinator runtime | Plans session-local consult/research/review/debate steps inside bounds when a Work operation needs multiple actors or adaptive collaboration. |
| Dispatch/Run Runtime bridge | Ensures every executable Assignment goes through governed dispatch and gets a Run. |
| Session synthesis | Aggregates session outputs without upgrading weak evidence or mutating Work. |

Coding domain input is necessary but not sufficient by itself. Coding supplies
workflow YAML, TaskSpecs, Skills, doctrine, repo/resource/footprint policy,
evidence adapters, persona/soul preferences, and quality gates. Dispatch
resolves actual executor/provider/model/tier/soul/profile under governance.
````

### Full target shown text

````text
## 10. Driver, Router, And Coordination Relationship

Agent Coordination may have its own session driver/router/launcher vocabulary,
but that does not replace the Work Driver / Domain Workflow Interpreter:

| Driver concern | Owner | Meaning |
|---|---|---|
| Coordination session driving | Agent Coordination Engine | Drive one CoordinationSession: materialize session tasks/Assignments, enforce topology/bounds/recovery, synthesize results. |
| Work/domain workflow driving | Work Driver / Domain Workflow Interpreter | Drive one Work item through domain workflow operations: inspect Work status/stage, select a legal declared Stage Operation, call Agent Coordination or Dispatch, then invoke Work Lifecycle verbs when evidence permits. |

`Router` is not one global component. It is a responsibility scoped by what is
being routed:

| Router scope | Likely owner | Routes |
|---|---|---|
| Surface routing | Host And Surface Layer | CLI/API/plugin request to the correct platform component/verb. |
| Work/domain routing | Work Driver / Domain Workflow Interpreter, using Domain Registry | Work item to domain, workflow, stage operation, or cross-flow route such as upstream product/design flow -> `cook`. |
| Coordination routing | Agent Coordination Engine | Session-local phase/task/actor/topology routing inside one CoordinationSession. |
| Dispatch routing | Dispatch And Execution Engine | One Assignment to executor/provider/model/tier/mechanism under governance. |

These routers may call each other through contracts, but they must not collapse
into one authority. For example, Work/domain routing may decide that a Work
item needs a `validate-plan` reviewer session; Agent Coordination then routes
session tasks and actors; Dispatch routes each Assignment to execution
infrastructure.

Why not move Work Driver into Agent Coordination?

| Reason | Boundary |
|---|---|
| Work Driver requires Work lifecycle authority adjacency. | It reads Work status/stage/claims and invokes Work Lifecycle verbs. Agent Coordination must remain Work-optional and cannot depend on Work to exist. |
| Domain workflows are not coordination protocols. | Coding product/design -> `cook`, marketing content review, and operations runbooks are Work-domain flow semantics. Agent Coordination can execute coordinated actions inside them, but should not own their lifecycle graph. |
| Cross-flow routing can exist without multi-agent coordination. | A simple item may route directly to `cook` and run one Assignment or no session. Putting this in Agent Coordination would make coordination look mandatory. |
| Non-Work coordination must stay clean. | Standalone brainstorm/research sessions should not carry Work status/stage/domain workflow baggage. |
| Other domains should reuse the driver without inheriting coding. | Marketing can plug its workflow config into the same Work/domain driver, while Agent Coordination remains the shared session/Assignment engine. |

Composition:

```txt
Work Driver / Domain Workflow Interpreter
  -> uses Agent Coordination as a coordination engine when a Work operation
     needs session/actor/topology/Assignment machinery

Agent Coordination
  -> does not own Work-domain flow selection or Work lifecycle progression
```

What Work Driver uses from Agent Coordination:

| Agent Coordination capability | How Work Driver uses it |
|---|---|
| CoordinationSession ledger | Opens a Work-attached session with `workRef` so collaboration has recovery, actor/topology/bounds, and one-way Assignment membership. |
| FlowDefinition / protocol parser | Consumes declared protocol or workflow projection shape when selected. The parser validates graph/roles/operations/policy shape; it does not choose Work's next lifecycle action. |
| Assignment Builder | Freezes the Work Driver's selected declared operation, or a validated inline contract, into immutable Assignment intent. |
| Team cognition / coordinator runtime | Plans session-local consult/research/review/debate steps inside bounds when a Work operation needs multiple actors or adaptive collaboration. |
| Dispatch/Run Runtime bridge | Ensures every executable Assignment goes through governed dispatch and gets a Run. |
| Session synthesis | Aggregates session outputs without upgrading weak evidence or mutating Work. |

Coding domain input is necessary but not sufficient by itself. Coding supplies
workflow YAML, TaskSpecs, Skills, doctrine, repo/resource/footprint policy,
evidence adapters, persona/soul preferences, and quality gates. Dispatch
resolves actual executor/provider/model/tier/soul/profile under governance.
````

## claim_6c16d18e8a777af7815d2c22ba5630a5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-39, lines 342–343.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-42.
Source digest: e9f76c5e13888084f488d3ed055f035bdfd810894ee0d944f66e20061cf1e483
Target digest: e9f76c5e13888084f488d3ed055f035bdfd810894ee0d944f66e20061cf1e483
Shown source SHA256: e9f76c5e13888084f488d3ed055f035bdfd810894ee0d944f66e20061cf1e483
Shown target SHA256: e9f76c5e13888084f488d3ed055f035bdfd810894ee0d944f66e20061cf1e483

### Proposed decision

```json
{
  "claimId": "claim_6c16d18e8a777af7815d2c22ba5630a5",
  "sourceUnitDigest": "e9f76c5e13888084f488d3ed055f035bdfd810894ee0d944f66e20061cf1e483",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "e9f76c5e13888084f488d3ed055f035bdfd810894ee0d944f66e20061cf1e483",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-39 (lines 342–343) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-42 (lines 366–367); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Agent Coordination may have its own session driver/router/launcher vocabulary,
but that does not replace the Work Driver / Domain Workflow Interpreter:
```

### Full target shown text

```text
Agent Coordination may have its own session driver/router/launcher vocabulary,
but that does not replace the Work Driver / Domain Workflow Interpreter:
```

## claim_e09cfbd32f916fd59d0f071b0cb79d36

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-40, lines 345–348.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-43.
Source digest: 777b9c0ba889bc00bf80f53c29fc5723817ca4720befa80591c0f5a17ae7835b
Target digest: 777b9c0ba889bc00bf80f53c29fc5723817ca4720befa80591c0f5a17ae7835b
Shown source SHA256: 777b9c0ba889bc00bf80f53c29fc5723817ca4720befa80591c0f5a17ae7835b
Shown target SHA256: 777b9c0ba889bc00bf80f53c29fc5723817ca4720befa80591c0f5a17ae7835b

### Proposed decision

```json
{
  "claimId": "claim_e09cfbd32f916fd59d0f071b0cb79d36",
  "sourceUnitDigest": "777b9c0ba889bc00bf80f53c29fc5723817ca4720befa80591c0f5a17ae7835b",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "777b9c0ba889bc00bf80f53c29fc5723817ca4720befa80591c0f5a17ae7835b",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-40 (lines 345–348) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-43 (lines 369–372); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Driver concern | Owner | Meaning |
|---|---|---|
| Coordination session driving | Agent Coordination Engine | Drive one CoordinationSession: materialize session tasks/Assignments, enforce topology/bounds/recovery, synthesize results. |
| Work/domain workflow driving | Work Driver / Domain Workflow Interpreter | Drive one Work item through domain workflow operations: inspect Work status/stage, select a legal declared Stage Operation, call Agent Coordination or Dispatch, then invoke Work Lifecycle verbs when evidence permits. |
```

### Full target shown text

```text
| Driver concern | Owner | Meaning |
|---|---|---|
| Coordination session driving | Agent Coordination Engine | Drive one CoordinationSession: materialize session tasks/Assignments, enforce topology/bounds/recovery, synthesize results. |
| Work/domain workflow driving | Work Driver / Domain Workflow Interpreter | Drive one Work item through domain workflow operations: inspect Work status/stage, select a legal declared Stage Operation, call Agent Coordination or Dispatch, then invoke Work Lifecycle verbs when evidence permits. |
```

## claim_24ffa1c68a9d589b0e6e68c197a484b4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-41, lines 350–351.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-44.
Source digest: 4c1e79671d9b5e1d969d710cdef8305a2d0363157b9b1d61b519a3f8f72daca3
Target digest: 4c1e79671d9b5e1d969d710cdef8305a2d0363157b9b1d61b519a3f8f72daca3
Shown source SHA256: 4c1e79671d9b5e1d969d710cdef8305a2d0363157b9b1d61b519a3f8f72daca3
Shown target SHA256: 4c1e79671d9b5e1d969d710cdef8305a2d0363157b9b1d61b519a3f8f72daca3

### Proposed decision

```json
{
  "claimId": "claim_24ffa1c68a9d589b0e6e68c197a484b4",
  "sourceUnitDigest": "4c1e79671d9b5e1d969d710cdef8305a2d0363157b9b1d61b519a3f8f72daca3",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "4c1e79671d9b5e1d969d710cdef8305a2d0363157b9b1d61b519a3f8f72daca3",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-41 (lines 350–351) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-44 (lines 374–375); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
`Router` is not one global component. It is a responsibility scoped by what is
being routed:
```

### Full target shown text

```text
`Router` is not one global component. It is a responsibility scoped by what is
being routed:
```

## claim_67802b4e45d27960252a4ee10aa39f1b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-42, lines 353–358.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-45.
Source digest: 77d8ae1abaa9f3c00dc6947f14a9f8a8dd0f8409513870fe13a4af9b617cae4f
Target digest: 77d8ae1abaa9f3c00dc6947f14a9f8a8dd0f8409513870fe13a4af9b617cae4f
Shown source SHA256: 77d8ae1abaa9f3c00dc6947f14a9f8a8dd0f8409513870fe13a4af9b617cae4f
Shown target SHA256: 77d8ae1abaa9f3c00dc6947f14a9f8a8dd0f8409513870fe13a4af9b617cae4f

### Proposed decision

```json
{
  "claimId": "claim_67802b4e45d27960252a4ee10aa39f1b",
  "sourceUnitDigest": "77d8ae1abaa9f3c00dc6947f14a9f8a8dd0f8409513870fe13a4af9b617cae4f",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "77d8ae1abaa9f3c00dc6947f14a9f8a8dd0f8409513870fe13a4af9b617cae4f",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-42 (lines 353–358) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-45 (lines 377–382); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Router scope | Likely owner | Routes |
|---|---|---|
| Surface routing | Host And Surface Layer | CLI/API/plugin request to the correct platform component/verb. |
| Work/domain routing | Work Driver / Domain Workflow Interpreter, using Domain Registry | Work item to domain, workflow, stage operation, or cross-flow route such as upstream product/design flow -> `cook`. |
| Coordination routing | Agent Coordination Engine | Session-local phase/task/actor/topology routing inside one CoordinationSession. |
| Dispatch routing | Dispatch And Execution Engine | One Assignment to executor/provider/model/tier/mechanism under governance. |
```

### Full target shown text

```text
| Router scope | Likely owner | Routes |
|---|---|---|
| Surface routing | Host And Surface Layer | CLI/API/plugin request to the correct platform component/verb. |
| Work/domain routing | Work Driver / Domain Workflow Interpreter, using Domain Registry | Work item to domain, workflow, stage operation, or cross-flow route such as upstream product/design flow -> `cook`. |
| Coordination routing | Agent Coordination Engine | Session-local phase/task/actor/topology routing inside one CoordinationSession. |
| Dispatch routing | Dispatch And Execution Engine | One Assignment to executor/provider/model/tier/mechanism under governance. |
```

## claim_a5f4a1c30d507bc27828c9dbd05cc5cf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-43, lines 360–364.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-46.
Source digest: e67221b8da3df106fda8d8a40b083ca4865c7fe97419f3e1782123a7eb67e90e
Target digest: e67221b8da3df106fda8d8a40b083ca4865c7fe97419f3e1782123a7eb67e90e
Shown source SHA256: e67221b8da3df106fda8d8a40b083ca4865c7fe97419f3e1782123a7eb67e90e
Shown target SHA256: e67221b8da3df106fda8d8a40b083ca4865c7fe97419f3e1782123a7eb67e90e

### Proposed decision

```json
{
  "claimId": "claim_a5f4a1c30d507bc27828c9dbd05cc5cf",
  "sourceUnitDigest": "e67221b8da3df106fda8d8a40b083ca4865c7fe97419f3e1782123a7eb67e90e",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "e67221b8da3df106fda8d8a40b083ca4865c7fe97419f3e1782123a7eb67e90e",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-43 (lines 360–364) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-46 (lines 384–388); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
These routers may call each other through contracts, but they must not collapse
into one authority. For example, Work/domain routing may decide that a Work
item needs a `validate-plan` reviewer session; Agent Coordination then routes
session tasks and actors; Dispatch routes each Assignment to execution
infrastructure.
```

### Full target shown text

```text
These routers may call each other through contracts, but they must not collapse
into one authority. For example, Work/domain routing may decide that a Work
item needs a `validate-plan` reviewer session; Agent Coordination then routes
session tasks and actors; Dispatch routes each Assignment to execution
infrastructure.
```

## claim_41fffacade922a0473326cad57a26a9a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-44, lines 366–366.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-47.
Source digest: 467203497278293be4ad04c8202f2359688347b6e1324c1852e8a04a834dccff
Target digest: 467203497278293be4ad04c8202f2359688347b6e1324c1852e8a04a834dccff
Shown source SHA256: 467203497278293be4ad04c8202f2359688347b6e1324c1852e8a04a834dccff
Shown target SHA256: 467203497278293be4ad04c8202f2359688347b6e1324c1852e8a04a834dccff

### Proposed decision

```json
{
  "claimId": "claim_41fffacade922a0473326cad57a26a9a",
  "sourceUnitDigest": "467203497278293be4ad04c8202f2359688347b6e1324c1852e8a04a834dccff",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "467203497278293be4ad04c8202f2359688347b6e1324c1852e8a04a834dccff",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-44 (lines 366–366) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-47 (lines 390–390); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Why not move Work Driver into Agent Coordination?
```

### Full target shown text

```text
Why not move Work Driver into Agent Coordination?
```

## claim_c0545819d02f98e0447caf634183bd78

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-45, lines 368–374.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-48.
Source digest: 45fa7dc4257bc75aa0ba8bccf58fbade650625a475874f61f6800bca1031972c
Target digest: 45fa7dc4257bc75aa0ba8bccf58fbade650625a475874f61f6800bca1031972c
Shown source SHA256: 45fa7dc4257bc75aa0ba8bccf58fbade650625a475874f61f6800bca1031972c
Shown target SHA256: 45fa7dc4257bc75aa0ba8bccf58fbade650625a475874f61f6800bca1031972c

### Proposed decision

```json
{
  "claimId": "claim_c0545819d02f98e0447caf634183bd78",
  "sourceUnitDigest": "45fa7dc4257bc75aa0ba8bccf58fbade650625a475874f61f6800bca1031972c",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "45fa7dc4257bc75aa0ba8bccf58fbade650625a475874f61f6800bca1031972c",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-45 (lines 368–374) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-48 (lines 392–398); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Reason | Boundary |
|---|---|
| Work Driver requires Work lifecycle authority adjacency. | It reads Work status/stage/claims and invokes Work Lifecycle verbs. Agent Coordination must remain Work-optional and cannot depend on Work to exist. |
| Domain workflows are not coordination protocols. | Coding product/design -> `cook`, marketing content review, and operations runbooks are Work-domain flow semantics. Agent Coordination can execute coordinated actions inside them, but should not own their lifecycle graph. |
| Cross-flow routing can exist without multi-agent coordination. | A simple item may route directly to `cook` and run one Assignment or no session. Putting this in Agent Coordination would make coordination look mandatory. |
| Non-Work coordination must stay clean. | Standalone brainstorm/research sessions should not carry Work status/stage/domain workflow baggage. |
| Other domains should reuse the driver without inheriting coding. | Marketing can plug its workflow config into the same Work/domain driver, while Agent Coordination remains the shared session/Assignment engine. |
```

### Full target shown text

```text
| Reason | Boundary |
|---|---|
| Work Driver requires Work lifecycle authority adjacency. | It reads Work status/stage/claims and invokes Work Lifecycle verbs. Agent Coordination must remain Work-optional and cannot depend on Work to exist. |
| Domain workflows are not coordination protocols. | Coding product/design -> `cook`, marketing content review, and operations runbooks are Work-domain flow semantics. Agent Coordination can execute coordinated actions inside them, but should not own their lifecycle graph. |
| Cross-flow routing can exist without multi-agent coordination. | A simple item may route directly to `cook` and run one Assignment or no session. Putting this in Agent Coordination would make coordination look mandatory. |
| Non-Work coordination must stay clean. | Standalone brainstorm/research sessions should not carry Work status/stage/domain workflow baggage. |
| Other domains should reuse the driver without inheriting coding. | Marketing can plug its workflow config into the same Work/domain driver, while Agent Coordination remains the shared session/Assignment engine. |
```

## claim_b8ba0124c3b2935a5b540cd7f584bb89

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-46, lines 376–385.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-49.
Source digest: 3167e09f7f61979721de56eab0aca6fa47b343bad4651f4038dd7de552e47a03
Target digest: 3167e09f7f61979721de56eab0aca6fa47b343bad4651f4038dd7de552e47a03
Shown source SHA256: 3167e09f7f61979721de56eab0aca6fa47b343bad4651f4038dd7de552e47a03
Shown target SHA256: 3167e09f7f61979721de56eab0aca6fa47b343bad4651f4038dd7de552e47a03

### Proposed decision

```json
{
  "claimId": "claim_b8ba0124c3b2935a5b540cd7f584bb89",
  "sourceUnitDigest": "3167e09f7f61979721de56eab0aca6fa47b343bad4651f4038dd7de552e47a03",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "3167e09f7f61979721de56eab0aca6fa47b343bad4651f4038dd7de552e47a03",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-46 (lines 376–385) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-49 (lines 400–409); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Composition:

```txt
Work Driver / Domain Workflow Interpreter
  -> uses Agent Coordination as a coordination engine when a Work operation
     needs session/actor/topology/Assignment machinery

Agent Coordination
  -> does not own Work-domain flow selection or Work lifecycle progression
```
````

### Full target shown text

````text
Composition:

```txt
Work Driver / Domain Workflow Interpreter
  -> uses Agent Coordination as a coordination engine when a Work operation
     needs session/actor/topology/Assignment machinery

Agent Coordination
  -> does not own Work-domain flow selection or Work lifecycle progression
```
````

## claim_a5fb67c7d511ca402ed2c5be859cfa7c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-47, lines 387–387.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-50.
Source digest: 44820f997c989e68aa6ac6cb30924078ee14e4142546f0d18618a40aaa0d7357
Target digest: 44820f997c989e68aa6ac6cb30924078ee14e4142546f0d18618a40aaa0d7357
Shown source SHA256: 44820f997c989e68aa6ac6cb30924078ee14e4142546f0d18618a40aaa0d7357
Shown target SHA256: 44820f997c989e68aa6ac6cb30924078ee14e4142546f0d18618a40aaa0d7357

### Proposed decision

```json
{
  "claimId": "claim_a5fb67c7d511ca402ed2c5be859cfa7c",
  "sourceUnitDigest": "44820f997c989e68aa6ac6cb30924078ee14e4142546f0d18618a40aaa0d7357",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "44820f997c989e68aa6ac6cb30924078ee14e4142546f0d18618a40aaa0d7357",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-47 (lines 387–387) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-50 (lines 411–411); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
What Work Driver uses from Agent Coordination:
```

### Full target shown text

```text
What Work Driver uses from Agent Coordination:
```

## claim_2bd05c25349247cebb3fab830a6edee6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-48, lines 389–396.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-51.
Source digest: e6acf36f9e2e7a8c82c6484c5bc6c1ca56e2be584d383101ae81fcb8ba2ebda1
Target digest: e6acf36f9e2e7a8c82c6484c5bc6c1ca56e2be584d383101ae81fcb8ba2ebda1
Shown source SHA256: e6acf36f9e2e7a8c82c6484c5bc6c1ca56e2be584d383101ae81fcb8ba2ebda1
Shown target SHA256: e6acf36f9e2e7a8c82c6484c5bc6c1ca56e2be584d383101ae81fcb8ba2ebda1

### Proposed decision

```json
{
  "claimId": "claim_2bd05c25349247cebb3fab830a6edee6",
  "sourceUnitDigest": "e6acf36f9e2e7a8c82c6484c5bc6c1ca56e2be584d383101ae81fcb8ba2ebda1",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "e6acf36f9e2e7a8c82c6484c5bc6c1ca56e2be584d383101ae81fcb8ba2ebda1",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-48 (lines 389–396) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-51 (lines 413–420); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Agent Coordination capability | How Work Driver uses it |
|---|---|
| CoordinationSession ledger | Opens a Work-attached session with `workRef` so collaboration has recovery, actor/topology/bounds, and one-way Assignment membership. |
| FlowDefinition / protocol parser | Consumes declared protocol or workflow projection shape when selected. The parser validates graph/roles/operations/policy shape; it does not choose Work's next lifecycle action. |
| Assignment Builder | Freezes the Work Driver's selected declared operation, or a validated inline contract, into immutable Assignment intent. |
| Team cognition / coordinator runtime | Plans session-local consult/research/review/debate steps inside bounds when a Work operation needs multiple actors or adaptive collaboration. |
| Dispatch/Run Runtime bridge | Ensures every executable Assignment goes through governed dispatch and gets a Run. |
| Session synthesis | Aggregates session outputs without upgrading weak evidence or mutating Work. |
```

### Full target shown text

```text
| Agent Coordination capability | How Work Driver uses it |
|---|---|
| CoordinationSession ledger | Opens a Work-attached session with `workRef` so collaboration has recovery, actor/topology/bounds, and one-way Assignment membership. |
| FlowDefinition / protocol parser | Consumes declared protocol or workflow projection shape when selected. The parser validates graph/roles/operations/policy shape; it does not choose Work's next lifecycle action. |
| Assignment Builder | Freezes the Work Driver's selected declared operation, or a validated inline contract, into immutable Assignment intent. |
| Team cognition / coordinator runtime | Plans session-local consult/research/review/debate steps inside bounds when a Work operation needs multiple actors or adaptive collaboration. |
| Dispatch/Run Runtime bridge | Ensures every executable Assignment goes through governed dispatch and gets a Run. |
| Session synthesis | Aggregates session outputs without upgrading weak evidence or mutating Work. |
```

## claim_3277b077e438db8c88147975ba43f613

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-49, lines 398–401.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-52.
Source digest: d25bdbdd37f19f4992b22f771f7bf27220fdfb164c6c778e1a7cd018abed5573
Target digest: d25bdbdd37f19f4992b22f771f7bf27220fdfb164c6c778e1a7cd018abed5573
Shown source SHA256: d25bdbdd37f19f4992b22f771f7bf27220fdfb164c6c778e1a7cd018abed5573
Shown target SHA256: d25bdbdd37f19f4992b22f771f7bf27220fdfb164c6c778e1a7cd018abed5573

### Proposed decision

```json
{
  "claimId": "claim_3277b077e438db8c88147975ba43f613",
  "sourceUnitDigest": "d25bdbdd37f19f4992b22f771f7bf27220fdfb164c6c778e1a7cd018abed5573",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "d25bdbdd37f19f4992b22f771f7bf27220fdfb164c6c778e1a7cd018abed5573",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "10. Driver, Router, And Coordination Relationship"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-49 (lines 398–401) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-52 (lines 422–425); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Coding domain input is necessary but not sufficient by itself. Coding supplies
workflow YAML, TaskSpecs, Skills, doctrine, repo/resource/footprint policy,
evidence adapters, persona/soul preferences, and quality gates. Dispatch
resolves actual executor/provider/model/tier/soul/profile under governance.
```

### Full target shown text

```text
Coding domain input is necessary but not sufficient by itself. Coding supplies
workflow YAML, TaskSpecs, Skills, doctrine, repo/resource/footprint policy,
evidence adapters, persona/soul preferences, and quality gates. Dispatch
resolves actual executor/provider/model/tier/soul/profile under governance.
```

## claim_be1240004efd99c1da7df5ddcf86d58e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#11-four-coordination-rings, lines 403–403.
Target: docs/platform/proposals/component-authority-boundary-map.md#11-four-coordination-rings.
Source digest: 3ec1a393350cdc349afb21cc7881a684ed52200650dc2fc695ae133dea1e8178
Target digest: 3ec1a393350cdc349afb21cc7881a684ed52200650dc2fc695ae133dea1e8178
Shown source SHA256: a9dfa72716c769593658d135066d105de0bbba5f1bcceceb963134313f89fcd8
Shown target SHA256: a9dfa72716c769593658d135066d105de0bbba5f1bcceceb963134313f89fcd8

### Proposed decision

```json
{
  "claimId": "claim_be1240004efd99c1da7df5ddcf86d58e",
  "sourceUnitDigest": "3ec1a393350cdc349afb21cc7881a684ed52200650dc2fc695ae133dea1e8178",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "11-four-coordination-rings",
  "targetUnitDigest": "3ec1a393350cdc349afb21cc7881a684ed52200650dc2fc695ae133dea1e8178",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#11-four-coordination-rings (lines 403–403) is carried at docs/platform/proposals/component-authority-boundary-map.md#11-four-coordination-rings (lines 427–427); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 11. Four Coordination Rings

The four rings should be preserved by a shared orchestration spine, not by
turning each ring into an unrelated module and not by collapsing all rings into
Agent Coordination:

```txt
Strategic ring  = Orchestrator
Activation ring = Launcher
Flow ring       = Router + Driver
Execution ring  = Dispatcher

Shared spine:
  request envelope
  -> ring handoff contract
  -> authority check
  -> state/evidence reference
  -> next-ring decision
```

`Spine` means a common control contract and trace shape across rings. It does
not mean one module owns every decision.

| Ring | Platform component | Authority preserved by the spine |
|---|---|---|
| Strategic / Orchestrator | Future orchestration strategy above single Work/session execution | Selects objectives, candidate Work/Assignment sets, and broad strategy; does not mutate Work or dispatch directly. |
| Activation / Launcher | Host And Surface Layer plus Work Driver entrypoints | Starts or resumes one selected Work item/session through the right door; does not reimplement driver logic. |
| Flow / Router + Driver | Work Driver / Domain Workflow Interpreter and Agent Coordination session routing | Chooses legal domain flow/operation or session-local task/actor route; does not select concrete executor infrastructure. |
| Execution / Dispatcher | Dispatch And Execution Engine | Resolves and launches one Assignment under governance; does not choose semantic operation or lifecycle result. |

The eventual accepted boundary document should decide whether this spine is
named as its own platform-core contract, or recorded as a required
cross-component contract spanning Work Driver, Agent Coordination, Dispatch,
and Host Surface.
````

### Full target shown text

````text
## 11. Four Coordination Rings

The four rings should be preserved by a shared orchestration spine, not by
turning each ring into an unrelated module and not by collapsing all rings into
Agent Coordination:

```txt
Strategic ring  = Orchestrator
Activation ring = Launcher
Flow ring       = Router + Driver
Execution ring  = Dispatcher

Shared spine:
  request envelope
  -> ring handoff contract
  -> authority check
  -> state/evidence reference
  -> next-ring decision
```

`Spine` means a common control contract and trace shape across rings. It does
not mean one module owns every decision.

| Ring | Platform component | Authority preserved by the spine |
|---|---|---|
| Strategic / Orchestrator | Future orchestration strategy above single Work/session execution | Selects objectives, candidate Work/Assignment sets, and broad strategy; does not mutate Work or dispatch directly. |
| Activation / Launcher | Host And Surface Layer plus Work Driver entrypoints | Starts or resumes one selected Work item/session through the right door; does not reimplement driver logic. |
| Flow / Router + Driver | Work Driver / Domain Workflow Interpreter and Agent Coordination session routing | Chooses legal domain flow/operation or session-local task/actor route; does not select concrete executor infrastructure. |
| Execution / Dispatcher | Dispatch And Execution Engine | Resolves and launches one Assignment under governance; does not choose semantic operation or lifecycle result. |

The eventual accepted boundary document should decide whether this spine is
named as its own platform-core contract, or recorded as a required
cross-component contract spanning Work Driver, Agent Coordination, Dispatch,
and Host Surface.
````

## claim_698c183441f61808940a0ad89048facd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-50, lines 405–407.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-53.
Source digest: 5009bd0e4ee8cb110bcd7c6d9f3981b43aa357a49f222304dba5aff0486e11dc
Target digest: 5009bd0e4ee8cb110bcd7c6d9f3981b43aa357a49f222304dba5aff0486e11dc
Shown source SHA256: 5009bd0e4ee8cb110bcd7c6d9f3981b43aa357a49f222304dba5aff0486e11dc
Shown target SHA256: 5009bd0e4ee8cb110bcd7c6d9f3981b43aa357a49f222304dba5aff0486e11dc

### Proposed decision

```json
{
  "claimId": "claim_698c183441f61808940a0ad89048facd",
  "sourceUnitDigest": "5009bd0e4ee8cb110bcd7c6d9f3981b43aa357a49f222304dba5aff0486e11dc",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "5009bd0e4ee8cb110bcd7c6d9f3981b43aa357a49f222304dba5aff0486e11dc",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "11. Four Coordination Rings"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-50 (lines 405–407) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-53 (lines 429–431); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The four rings should be preserved by a shared orchestration spine, not by
turning each ring into an unrelated module and not by collapsing all rings into
Agent Coordination:
```

### Full target shown text

```text
The four rings should be preserved by a shared orchestration spine, not by
turning each ring into an unrelated module and not by collapsing all rings into
Agent Coordination:
```

## claim_181748b74b3a5801fa890d3cce78e33e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-51, lines 409–421.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-54.
Source digest: 3090686bec6e1d94c61fbc14c5d840eed559c82a14740ad8ebb95396d3067e35
Target digest: 3090686bec6e1d94c61fbc14c5d840eed559c82a14740ad8ebb95396d3067e35
Shown source SHA256: 3090686bec6e1d94c61fbc14c5d840eed559c82a14740ad8ebb95396d3067e35
Shown target SHA256: 3090686bec6e1d94c61fbc14c5d840eed559c82a14740ad8ebb95396d3067e35

### Proposed decision

```json
{
  "claimId": "claim_181748b74b3a5801fa890d3cce78e33e",
  "sourceUnitDigest": "3090686bec6e1d94c61fbc14c5d840eed559c82a14740ad8ebb95396d3067e35",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "3090686bec6e1d94c61fbc14c5d840eed559c82a14740ad8ebb95396d3067e35",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "11. Four Coordination Rings"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-51 (lines 409–421) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-54 (lines 433–445); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Strategic ring  = Orchestrator
Activation ring = Launcher
Flow ring       = Router + Driver
Execution ring  = Dispatcher

Shared spine:
  request envelope
  -> ring handoff contract
  -> authority check
  -> state/evidence reference
  -> next-ring decision
```
````

### Full target shown text

````text
```txt
Strategic ring  = Orchestrator
Activation ring = Launcher
Flow ring       = Router + Driver
Execution ring  = Dispatcher

Shared spine:
  request envelope
  -> ring handoff contract
  -> authority check
  -> state/evidence reference
  -> next-ring decision
```
````

## claim_729c46d63b96f3497e3d05910867d00c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-52, lines 423–424.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-55.
Source digest: c1e6a07dfcd84720deeba3481886be3b53b26e95fb77a0ed1bb972cce3d54d49
Target digest: c1e6a07dfcd84720deeba3481886be3b53b26e95fb77a0ed1bb972cce3d54d49
Shown source SHA256: c1e6a07dfcd84720deeba3481886be3b53b26e95fb77a0ed1bb972cce3d54d49
Shown target SHA256: c1e6a07dfcd84720deeba3481886be3b53b26e95fb77a0ed1bb972cce3d54d49

### Proposed decision

```json
{
  "claimId": "claim_729c46d63b96f3497e3d05910867d00c",
  "sourceUnitDigest": "c1e6a07dfcd84720deeba3481886be3b53b26e95fb77a0ed1bb972cce3d54d49",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "c1e6a07dfcd84720deeba3481886be3b53b26e95fb77a0ed1bb972cce3d54d49",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "11. Four Coordination Rings"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-52 (lines 423–424) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-55 (lines 447–448); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
`Spine` means a common control contract and trace shape across rings. It does
not mean one module owns every decision.
```

### Full target shown text

```text
`Spine` means a common control contract and trace shape across rings. It does
not mean one module owns every decision.
```

## claim_117335246f76475c630f76ac4b87eb99

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-53, lines 426–431.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-56.
Source digest: d45f45860772623ea1c56c5ccb60fdbdf7b65eff269c383d1a30d022d4bfd336
Target digest: d45f45860772623ea1c56c5ccb60fdbdf7b65eff269c383d1a30d022d4bfd336
Shown source SHA256: d45f45860772623ea1c56c5ccb60fdbdf7b65eff269c383d1a30d022d4bfd336
Shown target SHA256: d45f45860772623ea1c56c5ccb60fdbdf7b65eff269c383d1a30d022d4bfd336

### Proposed decision

```json
{
  "claimId": "claim_117335246f76475c630f76ac4b87eb99",
  "sourceUnitDigest": "d45f45860772623ea1c56c5ccb60fdbdf7b65eff269c383d1a30d022d4bfd336",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "d45f45860772623ea1c56c5ccb60fdbdf7b65eff269c383d1a30d022d4bfd336",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "11. Four Coordination Rings"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-53 (lines 426–431) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-56 (lines 450–455); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Ring | Platform component | Authority preserved by the spine |
|---|---|---|
| Strategic / Orchestrator | Future orchestration strategy above single Work/session execution | Selects objectives, candidate Work/Assignment sets, and broad strategy; does not mutate Work or dispatch directly. |
| Activation / Launcher | Host And Surface Layer plus Work Driver entrypoints | Starts or resumes one selected Work item/session through the right door; does not reimplement driver logic. |
| Flow / Router + Driver | Work Driver / Domain Workflow Interpreter and Agent Coordination session routing | Chooses legal domain flow/operation or session-local task/actor route; does not select concrete executor infrastructure. |
| Execution / Dispatcher | Dispatch And Execution Engine | Resolves and launches one Assignment under governance; does not choose semantic operation or lifecycle result. |
```

### Full target shown text

```text
| Ring | Platform component | Authority preserved by the spine |
|---|---|---|
| Strategic / Orchestrator | Future orchestration strategy above single Work/session execution | Selects objectives, candidate Work/Assignment sets, and broad strategy; does not mutate Work or dispatch directly. |
| Activation / Launcher | Host And Surface Layer plus Work Driver entrypoints | Starts or resumes one selected Work item/session through the right door; does not reimplement driver logic. |
| Flow / Router + Driver | Work Driver / Domain Workflow Interpreter and Agent Coordination session routing | Chooses legal domain flow/operation or session-local task/actor route; does not select concrete executor infrastructure. |
| Execution / Dispatcher | Dispatch And Execution Engine | Resolves and launches one Assignment under governance; does not choose semantic operation or lifecycle result. |
```

## claim_4e90346f759839e2815abc39d2b0fe12

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-54, lines 433–436.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-57.
Source digest: 5f61b9425183689a839c074b4c5bdbd40754989c33a15cb501244d45598b044c
Target digest: 5f61b9425183689a839c074b4c5bdbd40754989c33a15cb501244d45598b044c
Shown source SHA256: 5f61b9425183689a839c074b4c5bdbd40754989c33a15cb501244d45598b044c
Shown target SHA256: 5f61b9425183689a839c074b4c5bdbd40754989c33a15cb501244d45598b044c

### Proposed decision

```json
{
  "claimId": "claim_4e90346f759839e2815abc39d2b0fe12",
  "sourceUnitDigest": "5f61b9425183689a839c074b4c5bdbd40754989c33a15cb501244d45598b044c",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "5f61b9425183689a839c074b4c5bdbd40754989c33a15cb501244d45598b044c",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "11. Four Coordination Rings"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-54 (lines 433–436) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-57 (lines 457–460); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The eventual accepted boundary document should decide whether this spine is
named as its own platform-core contract, or recorded as a required
cross-component contract spanning Work Driver, Agent Coordination, Dispatch,
and Host Surface.
```

### Full target shown text

```text
The eventual accepted boundary document should decide whether this spine is
named as its own platform-core contract, or recorded as a required
cross-component contract spanning Work Driver, Agent Coordination, Dispatch,
and Host Surface.
```

## claim_e7b25a804bb7dcbe8cd9de9e9644fe05

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#12-work-attached-coding-collaboration-chain, lines 438–438.
Target: docs/platform/proposals/component-authority-boundary-map.md#12-work-attached-coding-collaboration-chain.
Source digest: 1e743dd621bc04d134e2ca33a663a866d2cc16477f586fe7aad081f8d1dc3476
Target digest: 1e743dd621bc04d134e2ca33a663a866d2cc16477f586fe7aad081f8d1dc3476
Shown source SHA256: 9b91a1e161e9185402fe4e20d1d737149e73cbfc27f55b82d06ca15d7b636e51
Shown target SHA256: 9b91a1e161e9185402fe4e20d1d737149e73cbfc27f55b82d06ca15d7b636e51

### Proposed decision

```json
{
  "claimId": "claim_e7b25a804bb7dcbe8cd9de9e9644fe05",
  "sourceUnitDigest": "1e743dd621bc04d134e2ca33a663a866d2cc16477f586fe7aad081f8d1dc3476",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "12-work-attached-coding-collaboration-chain",
  "targetUnitDigest": "1e743dd621bc04d134e2ca33a663a866d2cc16477f586fe7aad081f8d1dc3476",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#12-work-attached-coding-collaboration-chain (lines 438–438) is carried at docs/platform/proposals/component-authority-boundary-map.md#12-work-attached-coding-collaboration-chain (lines 462–462); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 12. Work-Attached Coding Collaboration Chain

The draft chain for Step 10 coding adoption remains:

```txt
Work Driver / Domain Workflow Interpreter
  -> selects one legal declared Stage Operation from the coding workflow
Assignment Builder
  -> freezes the declared operation into an immutable Assignment
CoordinationSession
  -> records workRef, actors/topology/bounds, and Assignment membership
Coding Domain Harness/Core
  -> enriches or rejects using repo scope, footprint, isolation, and evidence policy
Dispatch And Execution Engine
  -> resolves DispatchPlan and records/launches one Run
Run Result Evaluator
  -> computes RunResult confidence from evidence
Work Driver
  -> consumes RunResult and calls existing Work Lifecycle verbs when allowed
Work Lifecycle Engine
  -> applies status/stage/claim/return/approval transitions
Coding Domain Core
  -> applies merge/catchup/technical approval only through coding-owned gates
```

Forbidden shortcuts:

- CoordinationSession must not resolve Work, Stage, operation, branch, merge,
  or lifecycle status.
- Domain harnesses must not spawn executors.
- Dispatch must not invent semantic operations.
- RunResult or synthesis must not move Work.
- Host surfaces and Herdr must not become evidence or lifecycle truth.

Examples:

| Concern | Draft owner |
|---|---|
| `validate-plan` as a legal operation | Upstream product/design flow declares it while shaping remains open; Work Driver selects it; Assignment Builder freezes it. |
| `validate-plan` reviewer session | Agent Coordination owns session/membership; Work Driver owns Work-attached bridge. |
| File footprint conflict | Coding Domain Core, exposed as harness/resource advice. |
| Worker slot ceiling | Work Driver / Runtime Occupancy Support; coding may provide stricter resource claims. |
| Merge readiness | Coding Domain Core. |
| Work item status after review | Work Lifecycle Engine, through Work verbs only. |
| Confidence for reviewer RunResult | Run Result Evaluator, using coding evidence adapter inputs. |
````

### Full target shown text

````text
## 12. Work-Attached Coding Collaboration Chain

The draft chain for Step 10 coding adoption remains:

```txt
Work Driver / Domain Workflow Interpreter
  -> selects one legal declared Stage Operation from the coding workflow
Assignment Builder
  -> freezes the declared operation into an immutable Assignment
CoordinationSession
  -> records workRef, actors/topology/bounds, and Assignment membership
Coding Domain Harness/Core
  -> enriches or rejects using repo scope, footprint, isolation, and evidence policy
Dispatch And Execution Engine
  -> resolves DispatchPlan and records/launches one Run
Run Result Evaluator
  -> computes RunResult confidence from evidence
Work Driver
  -> consumes RunResult and calls existing Work Lifecycle verbs when allowed
Work Lifecycle Engine
  -> applies status/stage/claim/return/approval transitions
Coding Domain Core
  -> applies merge/catchup/technical approval only through coding-owned gates
```

Forbidden shortcuts:

- CoordinationSession must not resolve Work, Stage, operation, branch, merge,
  or lifecycle status.
- Domain harnesses must not spawn executors.
- Dispatch must not invent semantic operations.
- RunResult or synthesis must not move Work.
- Host surfaces and Herdr must not become evidence or lifecycle truth.

Examples:

| Concern | Draft owner |
|---|---|
| `validate-plan` as a legal operation | Upstream product/design flow declares it while shaping remains open; Work Driver selects it; Assignment Builder freezes it. |
| `validate-plan` reviewer session | Agent Coordination owns session/membership; Work Driver owns Work-attached bridge. |
| File footprint conflict | Coding Domain Core, exposed as harness/resource advice. |
| Worker slot ceiling | Work Driver / Runtime Occupancy Support; coding may provide stricter resource claims. |
| Merge readiness | Coding Domain Core. |
| Work item status after review | Work Lifecycle Engine, through Work verbs only. |
| Confidence for reviewer RunResult | Run Result Evaluator, using coding evidence adapter inputs. |
````

## claim_064ef80f00053de41ac8f01e452f896a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-55, lines 440–440.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-58.
Source digest: 04e60efe9f3ca5d38de6b914b99bfc424a4643987bae2fadcc2ec8ab5d798526
Target digest: 04e60efe9f3ca5d38de6b914b99bfc424a4643987bae2fadcc2ec8ab5d798526
Shown source SHA256: 04e60efe9f3ca5d38de6b914b99bfc424a4643987bae2fadcc2ec8ab5d798526
Shown target SHA256: 04e60efe9f3ca5d38de6b914b99bfc424a4643987bae2fadcc2ec8ab5d798526

### Proposed decision

```json
{
  "claimId": "claim_064ef80f00053de41ac8f01e452f896a",
  "sourceUnitDigest": "04e60efe9f3ca5d38de6b914b99bfc424a4643987bae2fadcc2ec8ab5d798526",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "04e60efe9f3ca5d38de6b914b99bfc424a4643987bae2fadcc2ec8ab5d798526",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "12. Work-Attached Coding Collaboration Chain"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-55 (lines 440–440) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-58 (lines 464–464); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The draft chain for Step 10 coding adoption remains:
```

### Full target shown text

```text
The draft chain for Step 10 coding adoption remains:
```

## claim_cc92173a83e78210e9327de114f82467

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-56, lines 442–461.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-59.
Source digest: 1776cce4f4fbff5abdd83fca1d671393ce0fe19d04561b7ab4c10866890dc758
Target digest: 1776cce4f4fbff5abdd83fca1d671393ce0fe19d04561b7ab4c10866890dc758
Shown source SHA256: 1776cce4f4fbff5abdd83fca1d671393ce0fe19d04561b7ab4c10866890dc758
Shown target SHA256: 1776cce4f4fbff5abdd83fca1d671393ce0fe19d04561b7ab4c10866890dc758

### Proposed decision

```json
{
  "claimId": "claim_cc92173a83e78210e9327de114f82467",
  "sourceUnitDigest": "1776cce4f4fbff5abdd83fca1d671393ce0fe19d04561b7ab4c10866890dc758",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "1776cce4f4fbff5abdd83fca1d671393ce0fe19d04561b7ab4c10866890dc758",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "12. Work-Attached Coding Collaboration Chain"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-56 (lines 442–461) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-59 (lines 466–485); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Work Driver / Domain Workflow Interpreter
  -> selects one legal declared Stage Operation from the coding workflow
Assignment Builder
  -> freezes the declared operation into an immutable Assignment
CoordinationSession
  -> records workRef, actors/topology/bounds, and Assignment membership
Coding Domain Harness/Core
  -> enriches or rejects using repo scope, footprint, isolation, and evidence policy
Dispatch And Execution Engine
  -> resolves DispatchPlan and records/launches one Run
Run Result Evaluator
  -> computes RunResult confidence from evidence
Work Driver
  -> consumes RunResult and calls existing Work Lifecycle verbs when allowed
Work Lifecycle Engine
  -> applies status/stage/claim/return/approval transitions
Coding Domain Core
  -> applies merge/catchup/technical approval only through coding-owned gates
```
````

### Full target shown text

````text
```txt
Work Driver / Domain Workflow Interpreter
  -> selects one legal declared Stage Operation from the coding workflow
Assignment Builder
  -> freezes the declared operation into an immutable Assignment
CoordinationSession
  -> records workRef, actors/topology/bounds, and Assignment membership
Coding Domain Harness/Core
  -> enriches or rejects using repo scope, footprint, isolation, and evidence policy
Dispatch And Execution Engine
  -> resolves DispatchPlan and records/launches one Run
Run Result Evaluator
  -> computes RunResult confidence from evidence
Work Driver
  -> consumes RunResult and calls existing Work Lifecycle verbs when allowed
Work Lifecycle Engine
  -> applies status/stage/claim/return/approval transitions
Coding Domain Core
  -> applies merge/catchup/technical approval only through coding-owned gates
```
````

## claim_c920c0227157381487ca6749683a193d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-57, lines 463–470.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-60.
Source digest: 448e6ad74bbd5df141ecbf3961c4603e63a6ae224ba5f1b8bc099d8116457f5e
Target digest: 448e6ad74bbd5df141ecbf3961c4603e63a6ae224ba5f1b8bc099d8116457f5e
Shown source SHA256: 448e6ad74bbd5df141ecbf3961c4603e63a6ae224ba5f1b8bc099d8116457f5e
Shown target SHA256: 448e6ad74bbd5df141ecbf3961c4603e63a6ae224ba5f1b8bc099d8116457f5e

### Proposed decision

```json
{
  "claimId": "claim_c920c0227157381487ca6749683a193d",
  "sourceUnitDigest": "448e6ad74bbd5df141ecbf3961c4603e63a6ae224ba5f1b8bc099d8116457f5e",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "448e6ad74bbd5df141ecbf3961c4603e63a6ae224ba5f1b8bc099d8116457f5e",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "12. Work-Attached Coding Collaboration Chain"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-57 (lines 463–470) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-60 (lines 487–494); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Forbidden shortcuts:

- CoordinationSession must not resolve Work, Stage, operation, branch, merge,
  or lifecycle status.
- Domain harnesses must not spawn executors.
- Dispatch must not invent semantic operations.
- RunResult or synthesis must not move Work.
- Host surfaces and Herdr must not become evidence or lifecycle truth.
```

### Full target shown text

```text
Forbidden shortcuts:

- CoordinationSession must not resolve Work, Stage, operation, branch, merge,
  or lifecycle status.
- Domain harnesses must not spawn executors.
- Dispatch must not invent semantic operations.
- RunResult or synthesis must not move Work.
- Host surfaces and Herdr must not become evidence or lifecycle truth.
```

## claim_ea73d116b8ec0cfbe9faf81b46b5a499

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-58, lines 472–482.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-61.
Source digest: e2da645e4c91efcb1a7fbded763065c9067f8a325cc7d5d67b9cb9b47476eeed
Target digest: e2da645e4c91efcb1a7fbded763065c9067f8a325cc7d5d67b9cb9b47476eeed
Shown source SHA256: e2da645e4c91efcb1a7fbded763065c9067f8a325cc7d5d67b9cb9b47476eeed
Shown target SHA256: e2da645e4c91efcb1a7fbded763065c9067f8a325cc7d5d67b9cb9b47476eeed

### Proposed decision

```json
{
  "claimId": "claim_ea73d116b8ec0cfbe9faf81b46b5a499",
  "sourceUnitDigest": "e2da645e4c91efcb1a7fbded763065c9067f8a325cc7d5d67b9cb9b47476eeed",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-61",
  "targetUnitDigest": "e2da645e4c91efcb1a7fbded763065c9067f8a325cc7d5d67b9cb9b47476eeed",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "12. Work-Attached Coding Collaboration Chain"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-58 (lines 472–482) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-61 (lines 496–506); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Examples:

| Concern | Draft owner |
|---|---|
| `validate-plan` as a legal operation | Upstream product/design flow declares it while shaping remains open; Work Driver selects it; Assignment Builder freezes it. |
| `validate-plan` reviewer session | Agent Coordination owns session/membership; Work Driver owns Work-attached bridge. |
| File footprint conflict | Coding Domain Core, exposed as harness/resource advice. |
| Worker slot ceiling | Work Driver / Runtime Occupancy Support; coding may provide stricter resource claims. |
| Merge readiness | Coding Domain Core. |
| Work item status after review | Work Lifecycle Engine, through Work verbs only. |
| Confidence for reviewer RunResult | Run Result Evaluator, using coding evidence adapter inputs. |
```

### Full target shown text

```text
Examples:

| Concern | Draft owner |
|---|---|
| `validate-plan` as a legal operation | Upstream product/design flow declares it while shaping remains open; Work Driver selects it; Assignment Builder freezes it. |
| `validate-plan` reviewer session | Agent Coordination owns session/membership; Work Driver owns Work-attached bridge. |
| File footprint conflict | Coding Domain Core, exposed as harness/resource advice. |
| Worker slot ceiling | Work Driver / Runtime Occupancy Support; coding may provide stricter resource claims. |
| Merge readiness | Coding Domain Core. |
| Work item status after review | Work Lifecycle Engine, through Work verbs only. |
| Confidence for reviewer RunResult | Run Result Evaluator, using coding evidence adapter inputs. |
```

## claim_1b216e6e51864d2cccf9d2e5f362893a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/component-authority-boundary-map.md#13-draft-ports, lines 484–484.
Target: docs/platform/proposals/component-authority-boundary-map.md#13-draft-ports.
Source digest: 5b95c33258eb31f92771f73726c2588b8057467d0c0a84ecb9d1a3838ed8d320
Target digest: 435d86bbc645aacf73ddb38aadfa994dae4adc4bfe425cd506b9bbd890046051
Shown source SHA256: c184499b83a7f7f5a91b14fd4aa6b52c13e47796df739cc846995566a2d64c6d
Shown target SHA256: a8ebb0088f5b8f693af3872f2a120c6055196fc7101e3a36f8977ff4a03f5a93

### Proposed decision

```json
{
  "claimId": "claim_1b216e6e51864d2cccf9d2e5f362893a",
  "sourceUnitDigest": "5b95c33258eb31f92771f73726c2588b8057467d0c0a84ecb9d1a3838ed8d320",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "13-draft-ports",
  "targetUnitDigest": "435d86bbc645aacf73ddb38aadfa994dae4adc4bfe425cd506b9bbd890046051",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#13-draft-ports (lines 484–484) is carried at docs/platform/proposals/component-authority-boundary-map.md#13-draft-ports (lines 508–508); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 13. Draft Ports

These are proposal-level names for future facades. This boundary draft does
not require creating them.

| Port | Owned by | Shape |
|---|---|---|
| `WorkLifecyclePort` | Work Lifecycle Engine | Read Work view; apply existing lifecycle verbs; expose domain-agnostic state transitions and gates. |
| `WorkDriverPort` | Work Driver / Domain Workflow Interpreter | Choose next legal operation; drive to a ceiling; park/halt; invoke Assignment/dispatch/lifecycle surfaces. |
| `DefinitionLoaderPort` | Domain Registry And Definition Loader | Load/validate domain registry, Workflow, FlowDefinition, TaskSpec, Skill refs, RoleGraph metadata. |
| `SessionStorePort` | Agent Coordination Engine | Open/replay/close CoordinationSession; append one-way Assignment membership; derive transient phase. |
| `AssignmentBuilderPort` | Agent Coordination Engine | Freeze declared operation or validated inline contract into immutable Assignment with provenance. |
| `DomainHarnessPort` | Domain Components | Enrich/reject contracts with domain constraints, evidence policy, resource/isolation advice, opaque workspace refs. |
| `DispatchRuntimePort` (supersedes the earlier `DispatchResolverPort` name in [Component Boundary Advisory §9](../component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view) — one candidate facade, not two) | Dispatch And Execution Engine | Resolve DispatchPlan; create Run; launch/observe/cancel/retry; support subprocess and in-process mechanisms. Routes on exactly two identities, capability and executor-id, per the canonical [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) doc. |
| `RunResultEvaluatorPort` | Run Result Evaluator | Parse worker claim; collect/validate evidence; compute confidence; normalize RunResult. |
| `OccupancyPort` | Work Driver / Runtime Occupancy Support | Check claims, worker slots, checkout locks, and resource availability before dispatch. |
| `SurfacePort` | Host And Surface Layer | Translate CLI/API/plugin/gateway calls into component requests and fgOS envelopes. |
| `SetupDoctorRegistryPort` | Setup, Doctor, And Distribution Health | Register config defaults, doctor checks, fixers, required binaries/services/directories. |
| `LearningDocsPort` | Learning, Knowledge, And Documentation Registry | Record/read retrospective captures, projections, traces, and docs indexes. |
```

### Full target shown text

```text
## 13. Draft Ports

These are proposal-level names for future facades. This boundary draft does
not require creating them.

| Port | Owned by | Shape |
|---|---|---|
| `WorkLifecyclePort` | Work Lifecycle Engine | Read Work view; apply existing lifecycle verbs; expose domain-agnostic state transitions and gates. |
| `WorkDriverPort` | Work Driver / Domain Workflow Interpreter | Choose next legal operation; drive to a ceiling; park/halt; invoke Assignment/dispatch/lifecycle surfaces. |
| `DefinitionLoaderPort` | Domain Registry And Definition Loader | Load/validate domain registry, Workflow, FlowDefinition, TaskSpec, Skill refs, RoleGraph metadata. |
| `SessionStorePort` | Agent Coordination Engine | Open/replay/close CoordinationSession; append one-way Assignment membership; derive transient phase. |
| `AssignmentBuilderPort` | Agent Coordination Engine | Freeze declared operation or validated inline contract into immutable Assignment with provenance. |
| `DomainHarnessPort` | Domain Components | Enrich/reject contracts with domain constraints, evidence policy, resource/isolation advice, opaque workspace refs. |
| `DispatchRuntimePort` (supersedes the earlier `DispatchResolverPort` name in [Component Boundary Advisory §9](../../architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view) — one candidate facade, not two) | Dispatch And Execution Engine | Resolve DispatchPlan; create Run; launch/observe/cancel/retry; support subprocess and in-process mechanisms. Routes on exactly two identities, capability and executor-id, per the canonical [Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md) doc. |
| `RunResultEvaluatorPort` | Run Result Evaluator | Parse worker claim; collect/validate evidence; compute confidence; normalize RunResult. |
| `OccupancyPort` | Work Driver / Runtime Occupancy Support | Check claims, worker slots, checkout locks, and resource availability before dispatch. |
| `SurfacePort` | Host And Surface Layer | Translate CLI/API/plugin/gateway calls into component requests and fgOS envelopes. |
| `SetupDoctorRegistryPort` | Setup, Doctor, And Distribution Health | Register config defaults, doctor checks, fixers, required binaries/services/directories. |
| `LearningDocsPort` | Learning, Knowledge, And Documentation Registry | Record/read retrospective captures, projections, traces, and docs indexes. |
```

## claim_2fd39611a4b6aab39b7ff11fbf195287

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-59, lines 486–487.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-62.
Source digest: 4811e025a08284812cccd747f4a7f585fcf6b3057b529125694c9144f538227b
Target digest: 4811e025a08284812cccd747f4a7f585fcf6b3057b529125694c9144f538227b
Shown source SHA256: 4811e025a08284812cccd747f4a7f585fcf6b3057b529125694c9144f538227b
Shown target SHA256: 4811e025a08284812cccd747f4a7f585fcf6b3057b529125694c9144f538227b

### Proposed decision

```json
{
  "claimId": "claim_2fd39611a4b6aab39b7ff11fbf195287",
  "sourceUnitDigest": "4811e025a08284812cccd747f4a7f585fcf6b3057b529125694c9144f538227b",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-62",
  "targetUnitDigest": "4811e025a08284812cccd747f4a7f585fcf6b3057b529125694c9144f538227b",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "13. Draft Ports"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-59 (lines 486–487) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-62 (lines 510–511); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
These are proposal-level names for future facades. This boundary draft does
not require creating them.
```

### Full target shown text

```text
These are proposal-level names for future facades. This boundary draft does
not require creating them.
```

## claim_141274342ca234cf21529b9afcb645db

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-60, lines 489–502.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-63.
Source digest: f1e17299f3ca75b903841a89da19d5b5576230b3f781fa618f0bfe3fe2ffcf39
Target digest: 38d5336c4a92d6bb904a832355ebd1b3c874afe5326ca137874fd3ab5812c3c8
Shown source SHA256: f1e17299f3ca75b903841a89da19d5b5576230b3f781fa618f0bfe3fe2ffcf39
Shown target SHA256: 38d5336c4a92d6bb904a832355ebd1b3c874afe5326ca137874fd3ab5812c3c8

### Proposed decision

```json
{
  "claimId": "claim_141274342ca234cf21529b9afcb645db",
  "sourceUnitDigest": "f1e17299f3ca75b903841a89da19d5b5576230b3f781fa618f0bfe3fe2ffcf39",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-63",
  "targetUnitDigest": "38d5336c4a92d6bb904a832355ebd1b3c874afe5326ca137874fd3ab5812c3c8",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "13. Draft Ports"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-60 (lines 489–502) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-63 (lines 513–526); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Port | Owned by | Shape |
|---|---|---|
| `WorkLifecyclePort` | Work Lifecycle Engine | Read Work view; apply existing lifecycle verbs; expose domain-agnostic state transitions and gates. |
| `WorkDriverPort` | Work Driver / Domain Workflow Interpreter | Choose next legal operation; drive to a ceiling; park/halt; invoke Assignment/dispatch/lifecycle surfaces. |
| `DefinitionLoaderPort` | Domain Registry And Definition Loader | Load/validate domain registry, Workflow, FlowDefinition, TaskSpec, Skill refs, RoleGraph metadata. |
| `SessionStorePort` | Agent Coordination Engine | Open/replay/close CoordinationSession; append one-way Assignment membership; derive transient phase. |
| `AssignmentBuilderPort` | Agent Coordination Engine | Freeze declared operation or validated inline contract into immutable Assignment with provenance. |
| `DomainHarnessPort` | Domain Components | Enrich/reject contracts with domain constraints, evidence policy, resource/isolation advice, opaque workspace refs. |
| `DispatchRuntimePort` (supersedes the earlier `DispatchResolverPort` name in [Component Boundary Advisory §9](../component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view) — one candidate facade, not two) | Dispatch And Execution Engine | Resolve DispatchPlan; create Run; launch/observe/cancel/retry; support subprocess and in-process mechanisms. Routes on exactly two identities, capability and executor-id, per the canonical [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) doc. |
| `RunResultEvaluatorPort` | Run Result Evaluator | Parse worker claim; collect/validate evidence; compute confidence; normalize RunResult. |
| `OccupancyPort` | Work Driver / Runtime Occupancy Support | Check claims, worker slots, checkout locks, and resource availability before dispatch. |
| `SurfacePort` | Host And Surface Layer | Translate CLI/API/plugin/gateway calls into component requests and fgOS envelopes. |
| `SetupDoctorRegistryPort` | Setup, Doctor, And Distribution Health | Register config defaults, doctor checks, fixers, required binaries/services/directories. |
| `LearningDocsPort` | Learning, Knowledge, And Documentation Registry | Record/read retrospective captures, projections, traces, and docs indexes. |
```

### Full target shown text

```text
| Port | Owned by | Shape |
|---|---|---|
| `WorkLifecyclePort` | Work Lifecycle Engine | Read Work view; apply existing lifecycle verbs; expose domain-agnostic state transitions and gates. |
| `WorkDriverPort` | Work Driver / Domain Workflow Interpreter | Choose next legal operation; drive to a ceiling; park/halt; invoke Assignment/dispatch/lifecycle surfaces. |
| `DefinitionLoaderPort` | Domain Registry And Definition Loader | Load/validate domain registry, Workflow, FlowDefinition, TaskSpec, Skill refs, RoleGraph metadata. |
| `SessionStorePort` | Agent Coordination Engine | Open/replay/close CoordinationSession; append one-way Assignment membership; derive transient phase. |
| `AssignmentBuilderPort` | Agent Coordination Engine | Freeze declared operation or validated inline contract into immutable Assignment with provenance. |
| `DomainHarnessPort` | Domain Components | Enrich/reject contracts with domain constraints, evidence policy, resource/isolation advice, opaque workspace refs. |
| `DispatchRuntimePort` (supersedes the earlier `DispatchResolverPort` name in [Component Boundary Advisory §9](../../architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view) — one candidate facade, not two) | Dispatch And Execution Engine | Resolve DispatchPlan; create Run; launch/observe/cancel/retry; support subprocess and in-process mechanisms. Routes on exactly two identities, capability and executor-id, per the canonical [Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md) doc. |
| `RunResultEvaluatorPort` | Run Result Evaluator | Parse worker claim; collect/validate evidence; compute confidence; normalize RunResult. |
| `OccupancyPort` | Work Driver / Runtime Occupancy Support | Check claims, worker slots, checkout locks, and resource availability before dispatch. |
| `SurfacePort` | Host And Surface Layer | Translate CLI/API/plugin/gateway calls into component requests and fgOS envelopes. |
| `SetupDoctorRegistryPort` | Setup, Doctor, And Distribution Health | Register config defaults, doctor checks, fixers, required binaries/services/directories. |
| `LearningDocsPort` | Learning, Knowledge, And Documentation Registry | Record/read retrospective captures, projections, traces, and docs indexes. |
```

## claim_84061a6f94082fd16f75e419144a02b8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#14-node-repo-layout-overlay-direction, lines 504–504.
Target: docs/platform/proposals/component-authority-boundary-map.md#14-node-repo-layout-overlay-direction.
Source digest: 636c966d223d262bc733af356109d03c71020f04863999c6a8a6973a8440530c
Target digest: 636c966d223d262bc733af356109d03c71020f04863999c6a8a6973a8440530c
Shown source SHA256: 841df3079bdb6380003ddeec019e298df35f9c10108fe35e167c063efc61199e
Shown target SHA256: 841df3079bdb6380003ddeec019e298df35f9c10108fe35e167c063efc61199e

### Proposed decision

```json
{
  "claimId": "claim_84061a6f94082fd16f75e419144a02b8",
  "sourceUnitDigest": "636c966d223d262bc733af356109d03c71020f04863999c6a8a6973a8440530c",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "14-node-repo-layout-overlay-direction",
  "targetUnitDigest": "636c966d223d262bc733af356109d03c71020f04863999c6a8a6973a8440530c",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#14-node-repo-layout-overlay-direction (lines 504–504) is carried at docs/platform/proposals/component-authority-boundary-map.md#14-node-repo-layout-overlay-direction (lines 528–528); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 14. Node Repo-Layout Overlay Direction

This overlay extends the `apps/` + `packages/` direction to Node, but only as
a proposal. Existing files stay where they are until a later slice creates a
facade, contract tests, and a low-risk move plan.

```txt
apps/
  cli/                         # thin fgos / fgos-runner entrypoints
  gateway/                     # Rust/web target already covered by repo-layout-vision
  herdr-tui/                   # Rust/web target already covered by repo-layout-vision

packages/
  work-core/
    work-lifecycle/            # Work state, status/stage, claim/return, Work verbs
    work-driver/               # ready selection, operation choice, automation loop
    runtime-occupancy/         # worker slots, checkout locks, resource pressure
  agent-coordination/
    coordination-engine/       # CoordinationSession, topology, team cognition, Assignment builder
    dispatch-execution/        # DispatchPlan, Run runtime, executor adapters
    run-result-evaluator/      # evidence collection, confidence, RunResult
  domain-registry/             # domain/workflow/task-spec/FlowDefinition loading
  domains/
    coding/                    # Coding Domain Core + product/design, cook, bugfix, small-change policy
  setup-doctor/                # config defaults, setup, doctor, distribution health
  host-surfaces/               # CLI/API/plugin/gateway/Herdr adapters and envelopes
  learning-docs/               # knowledge registry, projections, end-user docs index
```

Layout constraints:

- `apps/*` stay thin and wire packages together.
- `packages/*` own reusable component contracts and facades before moving
  implementations.
- A Rust replacement may sit behind the same Node facade as a binary or service
  adapter.
- Public `fgos` and `fgos-runner` command shape, `fgos.v1` envelopes, exit-code
  behavior, and current state authority stay stable through moves.
- Setup/doctor must learn any new binary, service, directory, config default,
  or writable path introduced by a future implementation slice.
- Physical movement follows accepted boundary authority, not draft vocabulary.
````

### Full target shown text

````text
## 14. Node Repo-Layout Overlay Direction

This overlay extends the `apps/` + `packages/` direction to Node, but only as
a proposal. Existing files stay where they are until a later slice creates a
facade, contract tests, and a low-risk move plan.

```txt
apps/
  cli/                         # thin fgos / fgos-runner entrypoints
  gateway/                     # Rust/web target already covered by repo-layout-vision
  herdr-tui/                   # Rust/web target already covered by repo-layout-vision

packages/
  work-core/
    work-lifecycle/            # Work state, status/stage, claim/return, Work verbs
    work-driver/               # ready selection, operation choice, automation loop
    runtime-occupancy/         # worker slots, checkout locks, resource pressure
  agent-coordination/
    coordination-engine/       # CoordinationSession, topology, team cognition, Assignment builder
    dispatch-execution/        # DispatchPlan, Run runtime, executor adapters
    run-result-evaluator/      # evidence collection, confidence, RunResult
  domain-registry/             # domain/workflow/task-spec/FlowDefinition loading
  domains/
    coding/                    # Coding Domain Core + product/design, cook, bugfix, small-change policy
  setup-doctor/                # config defaults, setup, doctor, distribution health
  host-surfaces/               # CLI/API/plugin/gateway/Herdr adapters and envelopes
  learning-docs/               # knowledge registry, projections, end-user docs index
```

Layout constraints:

- `apps/*` stay thin and wire packages together.
- `packages/*` own reusable component contracts and facades before moving
  implementations.
- A Rust replacement may sit behind the same Node facade as a binary or service
  adapter.
- Public `fgos` and `fgos-runner` command shape, `fgos.v1` envelopes, exit-code
  behavior, and current state authority stay stable through moves.
- Setup/doctor must learn any new binary, service, directory, config default,
  or writable path introduced by a future implementation slice.
- Physical movement follows accepted boundary authority, not draft vocabulary.
````

## claim_448b7b0d61bd079524579a61178ec384

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-61, lines 506–508.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-64.
Source digest: e8168444beb0515add6633ed6d92c8304c6d225b91e985a117f31c7f6846378e
Target digest: e8168444beb0515add6633ed6d92c8304c6d225b91e985a117f31c7f6846378e
Shown source SHA256: e8168444beb0515add6633ed6d92c8304c6d225b91e985a117f31c7f6846378e
Shown target SHA256: e8168444beb0515add6633ed6d92c8304c6d225b91e985a117f31c7f6846378e

### Proposed decision

```json
{
  "claimId": "claim_448b7b0d61bd079524579a61178ec384",
  "sourceUnitDigest": "e8168444beb0515add6633ed6d92c8304c6d225b91e985a117f31c7f6846378e",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-64",
  "targetUnitDigest": "e8168444beb0515add6633ed6d92c8304c6d225b91e985a117f31c7f6846378e",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "14. Node Repo-Layout Overlay Direction"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-61 (lines 506–508) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-64 (lines 530–532); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This overlay extends the `apps/` + `packages/` direction to Node, but only as
a proposal. Existing files stay where they are until a later slice creates a
facade, contract tests, and a low-risk move plan.
```

### Full target shown text

```text
This overlay extends the `apps/` + `packages/` direction to Node, but only as
a proposal. Existing files stay where they are until a later slice creates a
facade, contract tests, and a low-risk move plan.
```

## claim_0abd1fe9ecc541e481de4ca2ea5f3760

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-62, lines 510–531.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-65.
Source digest: d7da6699f8b96bcd988943d0083350c31d861003eb3e025ce60c9ef0393f5306
Target digest: d7da6699f8b96bcd988943d0083350c31d861003eb3e025ce60c9ef0393f5306
Shown source SHA256: d7da6699f8b96bcd988943d0083350c31d861003eb3e025ce60c9ef0393f5306
Shown target SHA256: d7da6699f8b96bcd988943d0083350c31d861003eb3e025ce60c9ef0393f5306

### Proposed decision

```json
{
  "claimId": "claim_0abd1fe9ecc541e481de4ca2ea5f3760",
  "sourceUnitDigest": "d7da6699f8b96bcd988943d0083350c31d861003eb3e025ce60c9ef0393f5306",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-65",
  "targetUnitDigest": "d7da6699f8b96bcd988943d0083350c31d861003eb3e025ce60c9ef0393f5306",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "14. Node Repo-Layout Overlay Direction"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-62 (lines 510–531) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-65 (lines 534–555); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
apps/
  cli/                         # thin fgos / fgos-runner entrypoints
  gateway/                     # Rust/web target already covered by repo-layout-vision
  herdr-tui/                   # Rust/web target already covered by repo-layout-vision

packages/
  work-core/
    work-lifecycle/            # Work state, status/stage, claim/return, Work verbs
    work-driver/               # ready selection, operation choice, automation loop
    runtime-occupancy/         # worker slots, checkout locks, resource pressure
  agent-coordination/
    coordination-engine/       # CoordinationSession, topology, team cognition, Assignment builder
    dispatch-execution/        # DispatchPlan, Run runtime, executor adapters
    run-result-evaluator/      # evidence collection, confidence, RunResult
  domain-registry/             # domain/workflow/task-spec/FlowDefinition loading
  domains/
    coding/                    # Coding Domain Core + product/design, cook, bugfix, small-change policy
  setup-doctor/                # config defaults, setup, doctor, distribution health
  host-surfaces/               # CLI/API/plugin/gateway/Herdr adapters and envelopes
  learning-docs/               # knowledge registry, projections, end-user docs index
```
````

### Full target shown text

````text
```txt
apps/
  cli/                         # thin fgos / fgos-runner entrypoints
  gateway/                     # Rust/web target already covered by repo-layout-vision
  herdr-tui/                   # Rust/web target already covered by repo-layout-vision

packages/
  work-core/
    work-lifecycle/            # Work state, status/stage, claim/return, Work verbs
    work-driver/               # ready selection, operation choice, automation loop
    runtime-occupancy/         # worker slots, checkout locks, resource pressure
  agent-coordination/
    coordination-engine/       # CoordinationSession, topology, team cognition, Assignment builder
    dispatch-execution/        # DispatchPlan, Run runtime, executor adapters
    run-result-evaluator/      # evidence collection, confidence, RunResult
  domain-registry/             # domain/workflow/task-spec/FlowDefinition loading
  domains/
    coding/                    # Coding Domain Core + product/design, cook, bugfix, small-change policy
  setup-doctor/                # config defaults, setup, doctor, distribution health
  host-surfaces/               # CLI/API/plugin/gateway/Herdr adapters and envelopes
  learning-docs/               # knowledge registry, projections, end-user docs index
```
````

## claim_4c029a1df0c76a8da9496fde10da8493

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-63, lines 533–544.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-66.
Source digest: 98f617b3a29e72c091f39b81cd198e2d9cdf82f9504785d7f62288cc297e4185
Target digest: 98f617b3a29e72c091f39b81cd198e2d9cdf82f9504785d7f62288cc297e4185
Shown source SHA256: 98f617b3a29e72c091f39b81cd198e2d9cdf82f9504785d7f62288cc297e4185
Shown target SHA256: 98f617b3a29e72c091f39b81cd198e2d9cdf82f9504785d7f62288cc297e4185

### Proposed decision

```json
{
  "claimId": "claim_4c029a1df0c76a8da9496fde10da8493",
  "sourceUnitDigest": "98f617b3a29e72c091f39b81cd198e2d9cdf82f9504785d7f62288cc297e4185",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-66",
  "targetUnitDigest": "98f617b3a29e72c091f39b81cd198e2d9cdf82f9504785d7f62288cc297e4185",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "14. Node Repo-Layout Overlay Direction"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-63 (lines 533–544) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-66 (lines 557–568); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Layout constraints:

- `apps/*` stay thin and wire packages together.
- `packages/*` own reusable component contracts and facades before moving
  implementations.
- A Rust replacement may sit behind the same Node facade as a binary or service
  adapter.
- Public `fgos` and `fgos-runner` command shape, `fgos.v1` envelopes, exit-code
  behavior, and current state authority stay stable through moves.
- Setup/doctor must learn any new binary, service, directory, config default,
  or writable path introduced by a future implementation slice.
- Physical movement follows accepted boundary authority, not draft vocabulary.
```

### Full target shown text

```text
Layout constraints:

- `apps/*` stay thin and wire packages together.
- `packages/*` own reusable component contracts and facades before moving
  implementations.
- A Rust replacement may sit behind the same Node facade as a binary or service
  adapter.
- Public `fgos` and `fgos-runner` command shape, `fgos.v1` envelopes, exit-code
  behavior, and current state authority stay stable through moves.
- Setup/doctor must learn any new binary, service, directory, config default,
  or writable path introduced by a future implementation slice.
- Physical movement follows accepted boundary authority, not draft vocabulary.
```

## claim_012e0413851415550dd55bbb57a176de

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#15-code-scan-findings-for-boundary-drafting, lines 546–546.
Target: docs/platform/proposals/component-authority-boundary-map.md#15-code-scan-findings-for-boundary-drafting.
Source digest: 051a7e56da401660bcfa025d97f1336128a130f095956f11dd1d8687bd2e9338
Target digest: 051a7e56da401660bcfa025d97f1336128a130f095956f11dd1d8687bd2e9338
Shown source SHA256: a458b71ce2351bdaeddd91323f5418916eacba59ec0f215cb154f5401bcf75e9
Shown target SHA256: a458b71ce2351bdaeddd91323f5418916eacba59ec0f215cb154f5401bcf75e9

### Proposed decision

```json
{
  "claimId": "claim_012e0413851415550dd55bbb57a176de",
  "sourceUnitDigest": "051a7e56da401660bcfa025d97f1336128a130f095956f11dd1d8687bd2e9338",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "15-code-scan-findings-for-boundary-drafting",
  "targetUnitDigest": "051a7e56da401660bcfa025d97f1336128a130f095956f11dd1d8687bd2e9338",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#15-code-scan-findings-for-boundary-drafting (lines 546–546) is carried at docs/platform/proposals/component-authority-boundary-map.md#15-code-scan-findings-for-boundary-drafting (lines 570–570); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 15. Code Scan Findings For Boundary Drafting

Scan date: 2026-09-02. This scan read the current Node implementation only to
shape the proposal. It did not run tests, edit runtime code, or claim Work.

| Finding | Evidence | Architecture read | Recommendation |
|---|---|---|---|
| A. `operation-choice.mjs` is the highest-risk boundary knot. | `chooseStageOperation()` line 649, `interpretAssignmentRunResult()` line 1671, `executeDriverOperationChoice()` line 2144 in a 2,260-line file. GitNexus shows callers from `dispatchClaimedItem()`, `runOnce()`, and tests. | The file spans Work Driver, Assignment/Dispatch invocation, and RunResult interpretation. It is a compatibility join point, not the long-term component home. | Treat `executeDriverOperationChoice()` as the temporary adapter seam for Step 10 slice 2. The accepted boundary should target `WorkDriverPort.chooseOperation() -> AssignmentBuilderPort.freezeDeclaredOperation() -> DispatchRuntimePort.runAssignment() -> RunResultEvaluatorPort.evaluate() -> WorkDriverPort.consumeRunResult()`. |
| B. Secondary operations use Assignment/RunResult; primary executing still uses `spawnWorker`. | `src/runner/loop.mjs` chooses operations and calls `executeDriverOperationChoice()` for assignment dispatch, but still falls through to `spawnWorker()` around executing/research paths. `assignment-runner.mjs` persists Run, dispatch plan, result, evidence, dirty-before state, and hashes. | The repo has two execution cores: `Assignment -> DispatchPlan -> Run -> RunResult` and legacy `spawnWorker -> goal-check -> settleClaim`. | Keep Step 2 narrow on read-only `validate-plan`. Mark `spawnWorker` primary execution as a legacy path to retire behind `DispatchRuntimePort`; goal-check becomes a coding evidence adapter. |
| C. CoordinationSession bounds and worker slots are separate caps. | Coordination defaults `aggregateBounds.maxConcurrency` and enforces session assignment creation; worker slots are computed from Work claims and optional ceiling. | Both caps are legitimate but currently have no shared port. Work-attached fan-out or mutation could create conflicting answers to "is there room?" | Step 2 should use concurrency 1 and borrow the host Work claim. Before fan-out/mutation, accept an `OccupancyPort` rule that clamps session materialization against Work runtime slots and coding resource claims. |
| D. CoordinationSession is correctly lifecycle-blind today. | `openSession()` accepts `workRef`; session engine builds read-only inline contracts; inline mutating contracts are rejected. | Session can reference Work but does not own lifecycle/isolation/merge and cannot run mutating inline Assignments. | Do not extend CoordinationSession into a Work/Stage resolver. Add declared Assignment handoff from Work Driver + Assignment Builder into session membership. |
| E. Coding harness is pure and read-only, but too narrow for mutation proof. | `domains/coding/harness/enrich-and-validate-contract.mjs` validates declared stage operation and appends context/policy hints without filesystem, store, network, dispatch, or executor choice. | This is a good ADR-007 seam. It lacks footprint/resource/isolation advice and opaque workspace refs needed for mutating proof. | Extend harness I/O only after the boundary and Step 10 readiness gates: enriched contract + policy + evidencePolicy + resourceClaims + isolationAdvice + `workspaceRef?`. |
| F. Domain workflow declarations already contain legal operation truth. | `domains/coding/workflows/feature.yaml` declares `validate-plan`, `implement-item`, `review-item`, `fix-verify-red`, `scoped-subtask`, `scout-blast-radius`, and `resolve-question`; `assignment.mjs` rejects unknown declared operations. | Step 10 does not need a new place to decide legal operations. It needs a clean path for declared operation truth to enter a Work-attached session. | For Step 10 slice 2: Work Driver selects `planning.validate-plan`; Assignment Builder freezes; Session store appends membership; Dispatch executes; Run Result Evaluator evaluates; Work Driver consumes verdict and calls lifecycle verbs if allowed. |
| G. Coding Repository Integration Core is scattered but authority is clear. | `src/runner/worktree.mjs`, `src/runner/merge.mjs`, `src/verbs/merge/**`, readiness/cleanup/drift state files. | These concerns are coding-specific because they depend on Git branches, worktrees, repo deltas, verification, merge readiness, and technical approval. | Do not move files in the boundary draft or Step 10 slice 2. The accepted boundary should mark them as Coding Domain Core and require a `CodingRepositoryPort` facade before layout moves. |
| H. Setup/Doctor is already a real platform boundary. | `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `src/setup/config-merge.mjs`, shared config helpers. | Clean architecture on paper is not enough if new files/config/executors/services are undiscoverable in real projects. | Make setup/doctor registration part of implementation gates for Step 09/Step 10 changes that introduce new config, files, services, or directories. |
```

### Full target shown text

```text
## 15. Code Scan Findings For Boundary Drafting

Scan date: 2026-09-02. This scan read the current Node implementation only to
shape the proposal. It did not run tests, edit runtime code, or claim Work.

| Finding | Evidence | Architecture read | Recommendation |
|---|---|---|---|
| A. `operation-choice.mjs` is the highest-risk boundary knot. | `chooseStageOperation()` line 649, `interpretAssignmentRunResult()` line 1671, `executeDriverOperationChoice()` line 2144 in a 2,260-line file. GitNexus shows callers from `dispatchClaimedItem()`, `runOnce()`, and tests. | The file spans Work Driver, Assignment/Dispatch invocation, and RunResult interpretation. It is a compatibility join point, not the long-term component home. | Treat `executeDriverOperationChoice()` as the temporary adapter seam for Step 10 slice 2. The accepted boundary should target `WorkDriverPort.chooseOperation() -> AssignmentBuilderPort.freezeDeclaredOperation() -> DispatchRuntimePort.runAssignment() -> RunResultEvaluatorPort.evaluate() -> WorkDriverPort.consumeRunResult()`. |
| B. Secondary operations use Assignment/RunResult; primary executing still uses `spawnWorker`. | `src/runner/loop.mjs` chooses operations and calls `executeDriverOperationChoice()` for assignment dispatch, but still falls through to `spawnWorker()` around executing/research paths. `assignment-runner.mjs` persists Run, dispatch plan, result, evidence, dirty-before state, and hashes. | The repo has two execution cores: `Assignment -> DispatchPlan -> Run -> RunResult` and legacy `spawnWorker -> goal-check -> settleClaim`. | Keep Step 2 narrow on read-only `validate-plan`. Mark `spawnWorker` primary execution as a legacy path to retire behind `DispatchRuntimePort`; goal-check becomes a coding evidence adapter. |
| C. CoordinationSession bounds and worker slots are separate caps. | Coordination defaults `aggregateBounds.maxConcurrency` and enforces session assignment creation; worker slots are computed from Work claims and optional ceiling. | Both caps are legitimate but currently have no shared port. Work-attached fan-out or mutation could create conflicting answers to "is there room?" | Step 2 should use concurrency 1 and borrow the host Work claim. Before fan-out/mutation, accept an `OccupancyPort` rule that clamps session materialization against Work runtime slots and coding resource claims. |
| D. CoordinationSession is correctly lifecycle-blind today. | `openSession()` accepts `workRef`; session engine builds read-only inline contracts; inline mutating contracts are rejected. | Session can reference Work but does not own lifecycle/isolation/merge and cannot run mutating inline Assignments. | Do not extend CoordinationSession into a Work/Stage resolver. Add declared Assignment handoff from Work Driver + Assignment Builder into session membership. |
| E. Coding harness is pure and read-only, but too narrow for mutation proof. | `domains/coding/harness/enrich-and-validate-contract.mjs` validates declared stage operation and appends context/policy hints without filesystem, store, network, dispatch, or executor choice. | This is a good ADR-007 seam. It lacks footprint/resource/isolation advice and opaque workspace refs needed for mutating proof. | Extend harness I/O only after the boundary and Step 10 readiness gates: enriched contract + policy + evidencePolicy + resourceClaims + isolationAdvice + `workspaceRef?`. |
| F. Domain workflow declarations already contain legal operation truth. | `domains/coding/workflows/feature.yaml` declares `validate-plan`, `implement-item`, `review-item`, `fix-verify-red`, `scoped-subtask`, `scout-blast-radius`, and `resolve-question`; `assignment.mjs` rejects unknown declared operations. | Step 10 does not need a new place to decide legal operations. It needs a clean path for declared operation truth to enter a Work-attached session. | For Step 10 slice 2: Work Driver selects `planning.validate-plan`; Assignment Builder freezes; Session store appends membership; Dispatch executes; Run Result Evaluator evaluates; Work Driver consumes verdict and calls lifecycle verbs if allowed. |
| G. Coding Repository Integration Core is scattered but authority is clear. | `src/runner/worktree.mjs`, `src/runner/merge.mjs`, `src/verbs/merge/**`, readiness/cleanup/drift state files. | These concerns are coding-specific because they depend on Git branches, worktrees, repo deltas, verification, merge readiness, and technical approval. | Do not move files in the boundary draft or Step 10 slice 2. The accepted boundary should mark them as Coding Domain Core and require a `CodingRepositoryPort` facade before layout moves. |
| H. Setup/Doctor is already a real platform boundary. | `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `src/setup/config-merge.mjs`, shared config helpers. | Clean architecture on paper is not enough if new files/config/executors/services are undiscoverable in real projects. | Make setup/doctor registration part of implementation gates for Step 09/Step 10 changes that introduce new config, files, services, or directories. |
```

## claim_8ba58ba6039b0506e41e0ffd0487ed4d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-64, lines 548–549.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-67.
Source digest: 859b11d7715380a7a530f07c9d6478448b0f5f4a2ff9008837ab3c6ba498d0a5
Target digest: 859b11d7715380a7a530f07c9d6478448b0f5f4a2ff9008837ab3c6ba498d0a5
Shown source SHA256: 859b11d7715380a7a530f07c9d6478448b0f5f4a2ff9008837ab3c6ba498d0a5
Shown target SHA256: 859b11d7715380a7a530f07c9d6478448b0f5f4a2ff9008837ab3c6ba498d0a5

### Proposed decision

```json
{
  "claimId": "claim_8ba58ba6039b0506e41e0ffd0487ed4d",
  "sourceUnitDigest": "859b11d7715380a7a530f07c9d6478448b0f5f4a2ff9008837ab3c6ba498d0a5",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-67",
  "targetUnitDigest": "859b11d7715380a7a530f07c9d6478448b0f5f4a2ff9008837ab3c6ba498d0a5",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "15. Code Scan Findings For Boundary Drafting"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-64 (lines 548–549) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-67 (lines 572–573); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Scan date: 2026-09-02. This scan read the current Node implementation only to
shape the proposal. It did not run tests, edit runtime code, or claim Work.
```

### Full target shown text

```text
Scan date: 2026-09-02. This scan read the current Node implementation only to
shape the proposal. It did not run tests, edit runtime code, or claim Work.
```
