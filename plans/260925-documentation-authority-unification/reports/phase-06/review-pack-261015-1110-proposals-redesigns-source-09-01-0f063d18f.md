# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-09-coordination-capability-envelope.json
Original shard SHA256: 35b444d9563a6a761d25239f19c667225b77e0b37635541d2978d12ba4b92c60
Source file: docs/architect/proposals/coordination-capability-envelope.md
Part 1/2; entries: **80**. Source-file group 9/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (7): `claim_a13a8579792632b5553ba4e6971523e3`, `claim_8bbbe1991d78a43f3a8ac34904ff529c`, `claim_85e9b5ff587ba23b26257be6b6130590`, `claim_ef60991eccbc94b8ea96109cd3a0523c`, `claim_47481f3d934351c88fe870e1bef64df2`, `claim_d0ef06cdbec4bbfb170f5270ae8b7937`, `claim_6a9363f6f73e41664daed48e700c76d0`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (1): `claim_a13a8579792632b5553ba4e6971523e3`.

Weak-exact/Judgment population: 23; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_a13a8579792632b5553ba4e6971523e3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-capability-envelope.md#agent-coordination-capability-envelope-và-coordinator-owned-deliberation, lines 1–1.
Target: docs/platform/proposals/coordination-capability-envelope.md#agent-coordination-capability-envelope-và-coordinator-owned-deliberation.
Source digest: 9f5435e86966d369799bacf179050534948e66a37db38f3a0dd6bfef8d86600e
Target digest: 478a72d4b4897394c014166b8178ea78fe90f112f248bf150611ececcf54bd1a
Shown source SHA256: d4e6e2b47195d781eb893ddd71f94eeb000448173ecc61b97e704727dec719f4
Shown target SHA256: 6120fa51cef453b8f19e0e38fd674dd17970c84613e752aef611d4a20fc50dac

### Proposed decision

```json
{
  "claimId": "claim_a13a8579792632b5553ba4e6971523e3",
  "sourceUnitDigest": "9f5435e86966d369799bacf179050534948e66a37db38f3a0dd6bfef8d86600e",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "agent-coordination-capability-envelope-và-coordinator-owned-deliberation",
  "targetUnitDigest": "478a72d4b4897394c014166b8178ea78fe90f112f248bf150611ececcf54bd1a",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#agent-coordination-capability-envelope-và-coordinator-owned-deliberation (lines 1–1) is carried at docs/platform/proposals/coordination-capability-envelope.md#agent-coordination-capability-envelope-và-coordinator-owned-deliberation (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
# Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation

Document type: Proposal
Design status: Discussion
Implementation: Not started for the proposed architecture; existing substrate is partially implemented
Last reviewed: 2026-09-06
Canonical for: nothing until explicitly accepted and promoted
State class: State — current conceptual recommendation; independent review remains historical evidence
```

### Full target shown text

````text
# Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/coordination-capability-envelope.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob d4ac1a3f53574846f15b7a46a6062f0080a0e4e6
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/coordination-capability-envelope.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate alternative recommendation using the surviving Assignment/Run execution substrate. The session engine cited by the source was removed in 2180b4e72; this envelope recommendation remains unaccepted. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/coordination-capability-envelope.md).


Document type: Proposal
Design status: Discussion
Implementation: Not started for the proposed architecture; existing substrate is partially implemented
Last reviewed: 2026-09-06
Canonical for: nothing until explicitly accepted and promoted
State class: State — current conceptual recommendation; independent review remains historical evidence
````

### Correction before/after and reasons

```json
{
  "claimId": "claim_a13a8579792632b5553ba4e6971523e3",
  "source": "docs/architect/proposals/coordination-capability-envelope.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-09-coordination-capability-envelope.json",
  "reasons": [
    "R7-1/R7-6 labelled neutral placement metadata and extracted-unit consequence"
  ],
  "before": {
    "claimId": "claim_a13a8579792632b5553ba4e6971523e3",
    "sourceUnitDigest": "9f5435e86966d369799bacf179050534948e66a37db38f3a0dd6bfef8d86600e",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "agent-coordination-capability-envelope-và-coordinator-owned-deliberation",
    "targetUnitDigest": "f2b880ee1d8dbfdaf6585f2167972aa8a9e61839ab7828c253ddd1bf4b33527c",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#agent-coordination-capability-envelope-và-coordinator-owned-deliberation (lines 1–1) is carried at docs/platform/proposals/coordination-capability-envelope.md#agent-coordination-capability-envelope-và-coordinator-owned-deliberation (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  },
  "after": {
    "claimId": "claim_a13a8579792632b5553ba4e6971523e3",
    "sourceUnitDigest": "9f5435e86966d369799bacf179050534948e66a37db38f3a0dd6bfef8d86600e",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "agent-coordination-capability-envelope-và-coordinator-owned-deliberation",
    "targetUnitDigest": "478a72d4b4897394c014166b8178ea78fe90f112f248bf150611ececcf54bd1a",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#agent-coordination-capability-envelope-và-coordinator-owned-deliberation (lines 1–1) is carried at docs/platform/proposals/coordination-capability-envelope.md#agent-coordination-capability-envelope-và-coordinator-owned-deliberation (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  }
}
```

## claim_2e70653d20889cd97e419baa94eefded

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-1, lines 3–8.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-4.
Source digest: 65e84dabdefc8287c7ff891acdc44ce6b361ea1a35022289a8436279450f3ae2
Target digest: 65e84dabdefc8287c7ff891acdc44ce6b361ea1a35022289a8436279450f3ae2
Shown source SHA256: 65e84dabdefc8287c7ff891acdc44ce6b361ea1a35022289a8436279450f3ae2
Shown target SHA256: 65e84dabdefc8287c7ff891acdc44ce6b361ea1a35022289a8436279450f3ae2

### Proposed decision

```json
{
  "claimId": "claim_2e70653d20889cd97e419baa94eefded",
  "sourceUnitDigest": "65e84dabdefc8287c7ff891acdc44ce6b361ea1a35022289a8436279450f3ae2",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "65e84dabdefc8287c7ff891acdc44ce6b361ea1a35022289a8436279450f3ae2",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-1 (lines 3–8) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-4 (lines 27–32); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Document type: Proposal
Design status: Discussion
Implementation: Not started for the proposed architecture; existing substrate is partially implemented
Last reviewed: 2026-09-06
Canonical for: nothing until explicitly accepted and promoted
State class: State — current conceptual recommendation; independent review remains historical evidence
```

### Full target shown text

```text
Document type: Proposal
Design status: Discussion
Implementation: Not started for the proposed architecture; existing substrate is partially implemented
Last reviewed: 2026-09-06
Canonical for: nothing until explicitly accepted and promoted
State class: State — current conceptual recommendation; independent review remains historical evidence
```

## claim_8bbbe1991d78a43f3a8ac34904ff529c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-capability-envelope.md#reading-context-and-authority, lines 10–10.
Target: docs/platform/proposals/coordination-capability-envelope.md#reading-context-and-authority.
Source digest: 3c19a059e386b5a45c12c189c5750f64e9eb9adcfcf3e56c2fad38db30e6c860
Target digest: 7e8c27e66df9b32c5e9291e13467ef5f5b96b2a462262bd83c29c5cf9439c666
Shown source SHA256: 63a05822a584a64a4da0fff85a117be931a682ee739111ec31f90d9995fe4715
Shown target SHA256: 9f2224ce7991b1927ea234bf2084ba90c788f1bdc1d39f5be3d75296a790bd1c

### Proposed decision

```json
{
  "claimId": "claim_8bbbe1991d78a43f3a8ac34904ff529c",
  "sourceUnitDigest": "3c19a059e386b5a45c12c189c5750f64e9eb9adcfcf3e56c2fad38db30e6c860",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "reading-context-and-authority",
  "targetUnitDigest": "7e8c27e66df9b32c5e9291e13467ef5f5b96b2a462262bd83c29c5cf9439c666",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#reading-context-and-authority (lines 10–10) is carried at docs/platform/proposals/coordination-capability-envelope.md#reading-context-and-authority (lines 34–34); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Reading context and authority

Current investigation status and next steps:
[Chat progress and handoff](coordination-envelope-progress.md).

Read [Reading Map](../../specs/reading-map.md), [Runner spec](../../specs/runner.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md), and
[System Vision: Trong Mem Ngoai Cung](../system-vision-trong-mem-ngoai-cung.md) first.

Inputs:

- [Independent review, 2026-09-05](../../../plans/reports/review-260905-agent-coordination-trong-mem-ngoai-cung.md).
- Repository source/contracts inspected on 2026-09-06.
- [Foundation baseline](../agent-coordination/architecture/coordination-foundation-baseline.md),
  [FlowDefinition contract](../agent-coordination/contracts/flow-definition.md),
  [CoordinationSession contract](../agent-coordination/contracts/coordination-session.md).
- [Raw master-coordination prompt](../agent-coordination/playbooks/prompts/master-coordinator.md),
  [Architecture Advisory proposal](architecture-advisory-panel.md), and
  [Plan Loop proposal](group-thinking-plan-loop.md).

This is an architecture recommendation, not an accepted decision, implementation
plan, or permission to change existing contracts. The structured debate below is
one advisor's adversarial analysis, not a newly dispatched independent agent
panel. Source and test source were inspected; no new tests or live provider runs
were performed for this analysis. GitNexus tools were unavailable in the review
session, so source navigation was direct.

**Recommendation:** choose capability-envelope + coordinator-owned deliberation
as the target; retain FlowDefinition as an optional coordination method over the
same execution substrate. Preserve the operating intelligence of a good master
prompt while enforcing consequential actions at a real authority boundary.
```

### Full target shown text

```text
## Reading context and authority

Current investigation status and next steps:
[Chat progress and handoff](../../architect/proposals/coordination-envelope-progress.md).

Read [Reading Map](../../specs/reading-map.md), [Runner spec](../../specs/runner.md),
[Agent Coordination Vision](../../architect/agent-coordination/vision.md),
[Intent Preservation Ledger](../../architect/agent-coordination/intent-preservation-ledger.md), and
[System Vision: Trong Mem Ngoai Cung](../../architect/system-vision-trong-mem-ngoai-cung.md) first.

Inputs:

- [Independent review, 2026-09-05](../../../plans/reports/review-260905-agent-coordination-trong-mem-ngoai-cung.md).
- Repository source/contracts inspected on 2026-09-06.
- [Foundation baseline](../../architect/agent-coordination/architecture/coordination-foundation-baseline.md),
  [FlowDefinition contract](../../architect/agent-coordination/contracts/flow-definition.md),
  [CoordinationSession contract](../../architect/agent-coordination/contracts/coordination-session.md).
- [Raw master-coordination prompt](../../architect/agent-coordination/playbooks/prompts/master-coordinator.md),
  [Architecture Advisory proposal](../../architect/proposals/architecture-advisory-panel.md), and
  [Plan Loop proposal](../../architect/proposals/group-thinking-plan-loop.md).

This is an architecture recommendation, not an accepted decision, implementation
plan, or permission to change existing contracts. The structured debate below is
one advisor's adversarial analysis, not a newly dispatched independent agent
panel. Source and test source were inspected; no new tests or live provider runs
were performed for this analysis. GitNexus tools were unavailable in the review
session, so source navigation was direct.

**Recommendation:** choose capability-envelope + coordinator-owned deliberation
as the target; retain FlowDefinition as an optional coordination method over the
same execution substrate. Preserve the operating intelligence of a good master
prompt while enforcing consequential actions at a real authority boundary.
```

## claim_85e9b5ff587ba23b26257be6b6130590

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-2, lines 12–13.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-5.
Source digest: 0ed8b9f312d31d8e6fd2e38651cb0ae2fe39fbff7eb7434c9a064dc9e9ae9898
Target digest: 22857411d9d89ab4fabe26d969affb082c947f70147b79311bb6d4b6e2bceafb
Shown source SHA256: 0ed8b9f312d31d8e6fd2e38651cb0ae2fe39fbff7eb7434c9a064dc9e9ae9898
Shown target SHA256: 22857411d9d89ab4fabe26d969affb082c947f70147b79311bb6d4b6e2bceafb

### Proposed decision

```json
{
  "claimId": "claim_85e9b5ff587ba23b26257be6b6130590",
  "sourceUnitDigest": "0ed8b9f312d31d8e6fd2e38651cb0ae2fe39fbff7eb7434c9a064dc9e9ae9898",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "22857411d9d89ab4fabe26d969affb082c947f70147b79311bb6d4b6e2bceafb",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "Reading context and authority"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-2 (lines 12–13) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-5 (lines 36–37); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Current investigation status and next steps:
[Chat progress and handoff](coordination-envelope-progress.md).
```

### Full target shown text

```text
Current investigation status and next steps:
[Chat progress and handoff](../../architect/proposals/coordination-envelope-progress.md).
```

## claim_ef60991eccbc94b8ea96109cd3a0523c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-3, lines 15–18.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-6.
Source digest: 1fb275c76ab3c6ea7895714160b65069c70ed8d9bfa3f9b3af531de68cd1708e
Target digest: f132c042e3bc5eb099140fcb0d7c0c6af81bf8e7cdc3647ea1632b445ab1b8ba
Shown source SHA256: 1fb275c76ab3c6ea7895714160b65069c70ed8d9bfa3f9b3af531de68cd1708e
Shown target SHA256: f132c042e3bc5eb099140fcb0d7c0c6af81bf8e7cdc3647ea1632b445ab1b8ba

### Proposed decision

```json
{
  "claimId": "claim_ef60991eccbc94b8ea96109cd3a0523c",
  "sourceUnitDigest": "1fb275c76ab3c6ea7895714160b65069c70ed8d9bfa3f9b3af531de68cd1708e",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "f132c042e3bc5eb099140fcb0d7c0c6af81bf8e7cdc3647ea1632b445ab1b8ba",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "Reading context and authority"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-3 (lines 15–18) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-6 (lines 39–42); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Read [Reading Map](../../specs/reading-map.md), [Runner spec](../../specs/runner.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md), and
[System Vision: Trong Mem Ngoai Cung](../system-vision-trong-mem-ngoai-cung.md) first.
```

### Full target shown text

```text
Read [Reading Map](../../specs/reading-map.md), [Runner spec](../../specs/runner.md),
[Agent Coordination Vision](../../architect/agent-coordination/vision.md),
[Intent Preservation Ledger](../../architect/agent-coordination/intent-preservation-ledger.md), and
[System Vision: Trong Mem Ngoai Cung](../../architect/system-vision-trong-mem-ngoai-cung.md) first.
```

## claim_47481f3d934351c88fe870e1bef64df2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-4, lines 20–29.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-7.
Source digest: a9fea4ac87e28e2d0bc3009f49773ead93a7187769c17847c12c4b59e48d0e3a
Target digest: 16dd0d80088622eb15c3e16e519661d1b17b48891c0512ac7b3c726a1e522dce
Shown source SHA256: a9fea4ac87e28e2d0bc3009f49773ead93a7187769c17847c12c4b59e48d0e3a
Shown target SHA256: 16dd0d80088622eb15c3e16e519661d1b17b48891c0512ac7b3c726a1e522dce

### Proposed decision

```json
{
  "claimId": "claim_47481f3d934351c88fe870e1bef64df2",
  "sourceUnitDigest": "a9fea4ac87e28e2d0bc3009f49773ead93a7187769c17847c12c4b59e48d0e3a",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "16dd0d80088622eb15c3e16e519661d1b17b48891c0512ac7b3c726a1e522dce",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "Reading context and authority"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-4 (lines 20–29) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-7 (lines 44–53); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Inputs:

- [Independent review, 2026-09-05](../../../plans/reports/review-260905-agent-coordination-trong-mem-ngoai-cung.md).
- Repository source/contracts inspected on 2026-09-06.
- [Foundation baseline](../agent-coordination/architecture/coordination-foundation-baseline.md),
  [FlowDefinition contract](../agent-coordination/contracts/flow-definition.md),
  [CoordinationSession contract](../agent-coordination/contracts/coordination-session.md).
- [Raw master-coordination prompt](../agent-coordination/playbooks/prompts/master-coordinator.md),
  [Architecture Advisory proposal](architecture-advisory-panel.md), and
  [Plan Loop proposal](group-thinking-plan-loop.md).
```

### Full target shown text

```text
Inputs:

- [Independent review, 2026-09-05](../../../plans/reports/review-260905-agent-coordination-trong-mem-ngoai-cung.md).
- Repository source/contracts inspected on 2026-09-06.
- [Foundation baseline](../../architect/agent-coordination/architecture/coordination-foundation-baseline.md),
  [FlowDefinition contract](../../architect/agent-coordination/contracts/flow-definition.md),
  [CoordinationSession contract](../../architect/agent-coordination/contracts/coordination-session.md).
- [Raw master-coordination prompt](../../architect/agent-coordination/playbooks/prompts/master-coordinator.md),
  [Architecture Advisory proposal](../../architect/proposals/architecture-advisory-panel.md), and
  [Plan Loop proposal](../../architect/proposals/group-thinking-plan-loop.md).
```

## claim_516e3e368afc06dd75eb5c65be686a3f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-5, lines 31–36.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-8.
Source digest: 8e23b27ac9cecf5a7324a8f4431acd47796a83a054ef6499d1eafa689d619496
Target digest: 8e23b27ac9cecf5a7324a8f4431acd47796a83a054ef6499d1eafa689d619496
Shown source SHA256: 8e23b27ac9cecf5a7324a8f4431acd47796a83a054ef6499d1eafa689d619496
Shown target SHA256: 8e23b27ac9cecf5a7324a8f4431acd47796a83a054ef6499d1eafa689d619496

### Proposed decision

```json
{
  "claimId": "claim_516e3e368afc06dd75eb5c65be686a3f",
  "sourceUnitDigest": "8e23b27ac9cecf5a7324a8f4431acd47796a83a054ef6499d1eafa689d619496",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "8e23b27ac9cecf5a7324a8f4431acd47796a83a054ef6499d1eafa689d619496",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "Reading context and authority"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-5 (lines 31–36) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-8 (lines 55–60); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This is an architecture recommendation, not an accepted decision, implementation
plan, or permission to change existing contracts. The structured debate below is
one advisor's adversarial analysis, not a newly dispatched independent agent
panel. Source and test source were inspected; no new tests or live provider runs
were performed for this analysis. GitNexus tools were unavailable in the review
session, so source navigation was direct.
```

### Full target shown text

```text
This is an architecture recommendation, not an accepted decision, implementation
plan, or permission to change existing contracts. The structured debate below is
one advisor's adversarial analysis, not a newly dispatched independent agent
panel. Source and test source were inspected; no new tests or live provider runs
were performed for this analysis. GitNexus tools were unavailable in the review
session, so source navigation was direct.
```

## claim_cf9493a97c14e442334138e5a4580334

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-6, lines 38–41.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-9.
Source digest: d766f41dd4fbf332c24fd39a23fb1a3d28fc98478bc6f05eed517342f3565a34
Target digest: d766f41dd4fbf332c24fd39a23fb1a3d28fc98478bc6f05eed517342f3565a34
Shown source SHA256: d766f41dd4fbf332c24fd39a23fb1a3d28fc98478bc6f05eed517342f3565a34
Shown target SHA256: d766f41dd4fbf332c24fd39a23fb1a3d28fc98478bc6f05eed517342f3565a34

### Proposed decision

```json
{
  "claimId": "claim_cf9493a97c14e442334138e5a4580334",
  "sourceUnitDigest": "d766f41dd4fbf332c24fd39a23fb1a3d28fc98478bc6f05eed517342f3565a34",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "d766f41dd4fbf332c24fd39a23fb1a3d28fc98478bc6f05eed517342f3565a34",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "Reading context and authority"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-6 (lines 38–41) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-9 (lines 62–65); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Recommendation:** choose capability-envelope + coordinator-owned deliberation
as the target; retain FlowDefinition as an optional coordination method over the
same execution substrate. Preserve the operating intelligence of a good master
prompt while enforcing consequential actions at a real authority boundary.
```

### Full target shown text

```text
**Recommendation:** choose capability-envelope + coordinator-owned deliberation
as the target; retain FlowDefinition as an optional coordination method over the
same execution substrate. Preserve the operating intelligence of a good master
prompt while enforcing consequential actions at a real authority boundary.
```

## claim_3c72c6fb18999eae99053763a8968825

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#1-working-understanding, lines 43–43.
Target: docs/platform/proposals/coordination-capability-envelope.md#1-working-understanding.
Source digest: 2e7e68b67a60f22705fc877ec5eb00a1f6303c536176e84c2046639f7e1a2ae2
Target digest: 2e7e68b67a60f22705fc877ec5eb00a1f6303c536176e84c2046639f7e1a2ae2
Shown source SHA256: 4afc1c52a4ca51a06d8af4923c8aa53098db1fd9ac218b4ff08d2c1d370bb024
Shown target SHA256: 4afc1c52a4ca51a06d8af4923c8aa53098db1fd9ac218b4ff08d2c1d370bb024

### Proposed decision

```json
{
  "claimId": "claim_3c72c6fb18999eae99053763a8968825",
  "sourceUnitDigest": "2e7e68b67a60f22705fc877ec5eb00a1f6303c536176e84c2046639f7e1a2ae2",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "1-working-understanding",
  "targetUnitDigest": "2e7e68b67a60f22705fc877ec5eb00a1f6303c536176e84c2046639f7e1a2ae2",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#1-working-understanding (lines 43–43) is carried at docs/platform/proposals/coordination-capability-envelope.md#1-working-understanding (lines 67–67); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 1. Working Understanding

The question is not graph versus prompt. It is who may decide what, on which
evidence, and where that authority is enforced.

A capable coordinator must understand and reframe a problem, choose specialists
and methods, progress independent work while a question is parked, request
unexpected investigation or recheck, and finish honestly with a recommendation,
dissent, or insufficient evidence. Runtime must bound and record those actions
without deciding the sequence of good thinking.

The accepted Vision already makes a predeclared protocol optional. The target
must support real multi-agent dispatch, per-role executor/provider/model/tier/
persona selection, independent-first work, controlled reveal, bounded specialist
recruitment, dissent, recheck, and cold resume. It must serve Code Panel, Plan
Loop, RFC review, research, Delphi/NGT, and Architecture Advisory through shared
primitives rather than a separate engine per use case.

One correction to the historical review: F4 is no longer accurate at its exact
forwarding point. `src/verbs/coordination/run.mjs` now forwards `step.mutation` to
`dispatchDeclaredOperation`. This does not establish end-to-end mutation
correctness; no new execution proof was run. Keep the historical review intact.
```

### Full target shown text

```text
## 1. Working Understanding

The question is not graph versus prompt. It is who may decide what, on which
evidence, and where that authority is enforced.

A capable coordinator must understand and reframe a problem, choose specialists
and methods, progress independent work while a question is parked, request
unexpected investigation or recheck, and finish honestly with a recommendation,
dissent, or insufficient evidence. Runtime must bound and record those actions
without deciding the sequence of good thinking.

The accepted Vision already makes a predeclared protocol optional. The target
must support real multi-agent dispatch, per-role executor/provider/model/tier/
persona selection, independent-first work, controlled reveal, bounded specialist
recruitment, dissent, recheck, and cold resume. It must serve Code Panel, Plan
Loop, RFC review, research, Delphi/NGT, and Architecture Advisory through shared
primitives rather than a separate engine per use case.

One correction to the historical review: F4 is no longer accurate at its exact
forwarding point. `src/verbs/coordination/run.mjs` now forwards `step.mutation` to
`dispatchDeclaredOperation`. This does not establish end-to-end mutation
correctness; no new execution proof was run. Keep the historical review intact.
```

## claim_63488d4b1b2004f789dfe43f74ae3814

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-7, lines 45–46.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-10.
Source digest: 9771c08edb8faf9012ea3bc71e611ff3802a7515c5bdca86b44a1c364e668ca4
Target digest: 9771c08edb8faf9012ea3bc71e611ff3802a7515c5bdca86b44a1c364e668ca4
Shown source SHA256: 9771c08edb8faf9012ea3bc71e611ff3802a7515c5bdca86b44a1c364e668ca4
Shown target SHA256: 9771c08edb8faf9012ea3bc71e611ff3802a7515c5bdca86b44a1c364e668ca4

### Proposed decision

```json
{
  "claimId": "claim_63488d4b1b2004f789dfe43f74ae3814",
  "sourceUnitDigest": "9771c08edb8faf9012ea3bc71e611ff3802a7515c5bdca86b44a1c364e668ca4",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "9771c08edb8faf9012ea3bc71e611ff3802a7515c5bdca86b44a1c364e668ca4",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "1. Working Understanding"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-7 (lines 45–46) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-10 (lines 69–70); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The question is not graph versus prompt. It is who may decide what, on which
evidence, and where that authority is enforced.
```

### Full target shown text

```text
The question is not graph versus prompt. It is who may decide what, on which
evidence, and where that authority is enforced.
```

## claim_2073340db28d6d6148e6034aedd62703

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-8, lines 48–52.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-11.
Source digest: 58eda5642c9b5cf927d416191922fe099fabf9cb3e825507ca2d3510093bd7f1
Target digest: 58eda5642c9b5cf927d416191922fe099fabf9cb3e825507ca2d3510093bd7f1
Shown source SHA256: 58eda5642c9b5cf927d416191922fe099fabf9cb3e825507ca2d3510093bd7f1
Shown target SHA256: 58eda5642c9b5cf927d416191922fe099fabf9cb3e825507ca2d3510093bd7f1

### Proposed decision

```json
{
  "claimId": "claim_2073340db28d6d6148e6034aedd62703",
  "sourceUnitDigest": "58eda5642c9b5cf927d416191922fe099fabf9cb3e825507ca2d3510093bd7f1",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "58eda5642c9b5cf927d416191922fe099fabf9cb3e825507ca2d3510093bd7f1",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "1. Working Understanding"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-8 (lines 48–52) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-11 (lines 72–76); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A capable coordinator must understand and reframe a problem, choose specialists
and methods, progress independent work while a question is parked, request
unexpected investigation or recheck, and finish honestly with a recommendation,
dissent, or insufficient evidence. Runtime must bound and record those actions
without deciding the sequence of good thinking.
```

### Full target shown text

```text
A capable coordinator must understand and reframe a problem, choose specialists
and methods, progress independent work while a question is parked, request
unexpected investigation or recheck, and finish honestly with a recommendation,
dissent, or insufficient evidence. Runtime must bound and record those actions
without deciding the sequence of good thinking.
```

## claim_ff9a687538e983a86174b00f8570d4c6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-9, lines 54–59.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-12.
Source digest: e3b9af04c753e602fdeca1ba865aab8ee3462efc0164fafa8a6e6ab7e751064d
Target digest: e3b9af04c753e602fdeca1ba865aab8ee3462efc0164fafa8a6e6ab7e751064d
Shown source SHA256: e3b9af04c753e602fdeca1ba865aab8ee3462efc0164fafa8a6e6ab7e751064d
Shown target SHA256: e3b9af04c753e602fdeca1ba865aab8ee3462efc0164fafa8a6e6ab7e751064d

### Proposed decision

```json
{
  "claimId": "claim_ff9a687538e983a86174b00f8570d4c6",
  "sourceUnitDigest": "e3b9af04c753e602fdeca1ba865aab8ee3462efc0164fafa8a6e6ab7e751064d",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "e3b9af04c753e602fdeca1ba865aab8ee3462efc0164fafa8a6e6ab7e751064d",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "1. Working Understanding"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-9 (lines 54–59) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-12 (lines 78–83); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The accepted Vision already makes a predeclared protocol optional. The target
must support real multi-agent dispatch, per-role executor/provider/model/tier/
persona selection, independent-first work, controlled reveal, bounded specialist
recruitment, dissent, recheck, and cold resume. It must serve Code Panel, Plan
Loop, RFC review, research, Delphi/NGT, and Architecture Advisory through shared
primitives rather than a separate engine per use case.
```

### Full target shown text

```text
The accepted Vision already makes a predeclared protocol optional. The target
must support real multi-agent dispatch, per-role executor/provider/model/tier/
persona selection, independent-first work, controlled reveal, bounded specialist
recruitment, dissent, recheck, and cold resume. It must serve Code Panel, Plan
Loop, RFC review, research, Delphi/NGT, and Architecture Advisory through shared
primitives rather than a separate engine per use case.
```

## claim_a292e17914a2848fb97298a56d034034

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-10, lines 61–64.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-13.
Source digest: 3d0fde36a42363ea189640d809f6675f66e951b29921775be6d7d7911f525b6d
Target digest: 3d0fde36a42363ea189640d809f6675f66e951b29921775be6d7d7911f525b6d
Shown source SHA256: 3d0fde36a42363ea189640d809f6675f66e951b29921775be6d7d7911f525b6d
Shown target SHA256: 3d0fde36a42363ea189640d809f6675f66e951b29921775be6d7d7911f525b6d

### Proposed decision

```json
{
  "claimId": "claim_a292e17914a2848fb97298a56d034034",
  "sourceUnitDigest": "3d0fde36a42363ea189640d809f6675f66e951b29921775be6d7d7911f525b6d",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "3d0fde36a42363ea189640d809f6675f66e951b29921775be6d7d7911f525b6d",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "1. Working Understanding"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-10 (lines 61–64) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-13 (lines 85–88); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
One correction to the historical review: F4 is no longer accurate at its exact
forwarding point. `src/verbs/coordination/run.mjs` now forwards `step.mutation` to
`dispatchDeclaredOperation`. This does not establish end-to-end mutation
correctness; no new execution proof was run. Keep the historical review intact.
```

### Full target shown text

```text
One correction to the historical review: F4 is no longer accurate at its exact
forwarding point. `src/verbs/coordination/run.mjs` now forwards `step.mutation` to
`dispatchDeclaredOperation`. This does not establish end-to-end mutation
correctness; no new execution proof was run. Keep the historical review intact.
```

## claim_d0ef06cdbec4bbfb170f5270ae8b7937

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-capability-envelope.md#2-root-causes-from-the-review, lines 66–66.
Target: docs/platform/proposals/coordination-capability-envelope.md#2-root-causes-from-the-review.
Source digest: 8147a2662459394e328b83e9184bc72f4ddee01cdc39f8d36bfd580a4f175240
Target digest: 0a319b68dcc021bc2805cc2eb6d242393eea028b9ffce807bbd6f049a5e61b3d
Shown source SHA256: c890c0ad72b65610647f8e8ff5ee15d8e47bd4d3f7dc52f557785d67f7a4d1c1
Shown target SHA256: a6081e327961c97aeda142bec8295fadac85526ec5ed714586345417e4a5396d

### Proposed decision

```json
{
  "claimId": "claim_d0ef06cdbec4bbfb170f5270ae8b7937",
  "sourceUnitDigest": "8147a2662459394e328b83e9184bc72f4ddee01cdc39f8d36bfd580a4f175240",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "2-root-causes-from-the-review",
  "targetUnitDigest": "0a319b68dcc021bc2805cc2eb6d242393eea028b9ffce807bbd6f049a5e61b3d",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#2-root-causes-from-the-review (lines 66–66) is carried at docs/platform/proposals/coordination-capability-envelope.md#2-root-causes-from-the-review (lines 90–90); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 2. Root causes from the review

| Root cause | Findings | Architectural implication |
|---|---|---|
| Method description doubles as legality | F3, F5, F8, F10 | Actors, bindings, windows, and contribution types limit thinking |
| Contract authority differs from process authority | F1, F6 | API refusal cannot contain a worker with direct access to the same resources |
| Operating intelligence lacks a complete delivery path | F2 | Persona provenance does not prove worker receipt of doctrine |
| Execution, evidence, agreement, and completion are conflated | F3, F7 | Finished reports become agreement; sufficient actors become a reason to stop |
| Durable execution lacks durable decision context | F11, F12 | Resume lacks rationale, obligations, and content-pinned baselines |
| Public actions expose less than underlying capability | F5, F9 | Coordinators need workarounds or private adapters |

Direct source anchors:

- [Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) explicitly
  documents same-user trust and post-execution read-only grading/rollback.
- [Prompt renderer](../../../src/runner/dispatch/assignment.mjs) renders the basic
  objective/context/output packet; this is not a complete soul delivery contract.
- [Session engine](../../../src/runner/coordination/session-engine.mjs),
  `classifySessionQuorum`, takes the manifest actor roster as required;
  aggregation-based close requires `consensus`.
- [Public run](../../../src/verbs/coordination/run.mjs) automatically attempts close.
- [Store](../../../src/runner/coordination/store.mjs), `assertDriverIdentity`, compares
  writer identity strings; session `maxRounds` uses Assignment count.
- [Chain](../../../src/verbs/coordination/chain.mjs) selects the latest active session
  and derives a hint; it does not reconstruct plan rationale.

A new Architecture Advisory graph alone would add another method to the same
misplaced boundaries. The review calls for responsibility redesign, not wholesale
replacement of proven execution machinery.
```

### Full target shown text

`````text
## 2. Root causes from the review

| Root cause | Findings | Architectural implication |
|---|---|---|
| Method description doubles as legality | F3, F5, F8, F10 | Actors, bindings, windows, and contribution types limit thinking |
| Contract authority differs from process authority | F1, F6 | API refusal cannot contain a worker with direct access to the same resources |
| Operating intelligence lacks a complete delivery path | F2 | Persona provenance does not prove worker receipt of doctrine |
| Execution, evidence, agreement, and completion are conflated | F3, F7 | Finished reports become agreement; sufficient actors become a reason to stop |
| Durable execution lacks durable decision context | F11, F12 | Resume lacks rationale, obligations, and content-pinned baselines |
| Public actions expose less than underlying capability | F5, F9 | Coordinators need workarounds or private adapters |

Direct source anchors:

````markdown
- [Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) explicitly
  documents same-user trust and post-execution read-only grading/rollback.
- [Prompt renderer](../../../src/runner/dispatch/assignment.mjs) renders the basic
  objective/context/output packet; this is not a complete soul delivery contract.
- [Session engine](../../../src/runner/coordination/session-engine.mjs),
  `classifySessionQuorum`, takes the manifest actor roster as required;
  aggregation-based close requires `consensus`.
- [Public run](../../../src/verbs/coordination/run.mjs) automatically attempts close.
- [Store](../../../src/runner/coordination/store.mjs), `assertDriverIdentity`, compares
  writer identity strings; session `maxRounds` uses Assignment count.
- [Chain](../../../src/verbs/coordination/chain.mjs) selects the latest active session
  and derives a hint; it does not reconstruct plan rationale.
````


A new Architecture Advisory graph alone would add another method to the same
misplaced boundaries. The review calls for responsibility redesign, not wholesale
replacement of proven execution machinery.
`````

## claim_e785cf9051779bdc5cf651e7408617f4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-11, lines 68–75.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-14.
Source digest: 6eca85718b6fdaca869a0ce86f14fcb51c407be7c90e9fd16584119d5959dc4a
Target digest: 6eca85718b6fdaca869a0ce86f14fcb51c407be7c90e9fd16584119d5959dc4a
Shown source SHA256: 6eca85718b6fdaca869a0ce86f14fcb51c407be7c90e9fd16584119d5959dc4a
Shown target SHA256: 6eca85718b6fdaca869a0ce86f14fcb51c407be7c90e9fd16584119d5959dc4a

### Proposed decision

```json
{
  "claimId": "claim_e785cf9051779bdc5cf651e7408617f4",
  "sourceUnitDigest": "6eca85718b6fdaca869a0ce86f14fcb51c407be7c90e9fd16584119d5959dc4a",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "6eca85718b6fdaca869a0ce86f14fcb51c407be7c90e9fd16584119d5959dc4a",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "2. Root causes from the review"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-11 (lines 68–75) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-14 (lines 92–99); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Root cause | Findings | Architectural implication |
|---|---|---|
| Method description doubles as legality | F3, F5, F8, F10 | Actors, bindings, windows, and contribution types limit thinking |
| Contract authority differs from process authority | F1, F6 | API refusal cannot contain a worker with direct access to the same resources |
| Operating intelligence lacks a complete delivery path | F2 | Persona provenance does not prove worker receipt of doctrine |
| Execution, evidence, agreement, and completion are conflated | F3, F7 | Finished reports become agreement; sufficient actors become a reason to stop |
| Durable execution lacks durable decision context | F11, F12 | Resume lacks rationale, obligations, and content-pinned baselines |
| Public actions expose less than underlying capability | F5, F9 | Coordinators need workarounds or private adapters |
```

### Full target shown text

```text
| Root cause | Findings | Architectural implication |
|---|---|---|
| Method description doubles as legality | F3, F5, F8, F10 | Actors, bindings, windows, and contribution types limit thinking |
| Contract authority differs from process authority | F1, F6 | API refusal cannot contain a worker with direct access to the same resources |
| Operating intelligence lacks a complete delivery path | F2 | Persona provenance does not prove worker receipt of doctrine |
| Execution, evidence, agreement, and completion are conflated | F3, F7 | Finished reports become agreement; sufficient actors become a reason to stop |
| Durable execution lacks durable decision context | F11, F12 | Resume lacks rationale, obligations, and content-pinned baselines |
| Public actions expose less than underlying capability | F5, F9 | Coordinators need workarounds or private adapters |
```

## claim_3180569060148df1fcdd74952544edde

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-12, lines 77–77.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-15.
Source digest: e53c039bbecf3f06acb7dfb0be9e21c6a8a5b03f7c95b7dcda97f2818cdfdde6
Target digest: e53c039bbecf3f06acb7dfb0be9e21c6a8a5b03f7c95b7dcda97f2818cdfdde6
Shown source SHA256: e53c039bbecf3f06acb7dfb0be9e21c6a8a5b03f7c95b7dcda97f2818cdfdde6
Shown target SHA256: e53c039bbecf3f06acb7dfb0be9e21c6a8a5b03f7c95b7dcda97f2818cdfdde6

### Proposed decision

```json
{
  "claimId": "claim_3180569060148df1fcdd74952544edde",
  "sourceUnitDigest": "e53c039bbecf3f06acb7dfb0be9e21c6a8a5b03f7c95b7dcda97f2818cdfdde6",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "e53c039bbecf3f06acb7dfb0be9e21c6a8a5b03f7c95b7dcda97f2818cdfdde6",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "2. Root causes from the review"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-12 (lines 77–77) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-15 (lines 101–101); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Direct source anchors:
```

### Full target shown text

```text
Direct source anchors:
```

## claim_6a9363f6f73e41664daed48e700c76d0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-13, lines 79–90.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-16.
Source digest: 4fdbbbea7ccf63f601901370e1f5b3bcfa62f40708385d99835bcd621f375252
Target digest: a4bfd9e9b7a626e33c5104f8cb62f2d12ddf2cadc648f135190be244c6f72b53
Shown source SHA256: 4fdbbbea7ccf63f601901370e1f5b3bcfa62f40708385d99835bcd621f375252
Shown target SHA256: a4bfd9e9b7a626e33c5104f8cb62f2d12ddf2cadc648f135190be244c6f72b53

### Proposed decision

```json
{
  "claimId": "claim_6a9363f6f73e41664daed48e700c76d0",
  "sourceUnitDigest": "4fdbbbea7ccf63f601901370e1f5b3bcfa62f40708385d99835bcd621f375252",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "a4bfd9e9b7a626e33c5104f8cb62f2d12ddf2cadc648f135190be244c6f72b53",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "2. Root causes from the review"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-13 (lines 79–90) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-16 (lines 103–116); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- [Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) explicitly
  documents same-user trust and post-execution read-only grading/rollback.
- [Prompt renderer](../../../src/runner/dispatch/assignment.mjs) renders the basic
  objective/context/output packet; this is not a complete soul delivery contract.
- [Session engine](../../../src/runner/coordination/session-engine.mjs),
  `classifySessionQuorum`, takes the manifest actor roster as required;
  aggregation-based close requires `consensus`.
- [Public run](../../../src/verbs/coordination/run.mjs) automatically attempts close.
- [Store](../../../src/runner/coordination/store.mjs), `assertDriverIdentity`, compares
  writer identity strings; session `maxRounds` uses Assignment count.
- [Chain](../../../src/verbs/coordination/chain.mjs) selects the latest active session
  and derives a hint; it does not reconstruct plan rationale.
```

### Full target shown text

`````text
````markdown
- [Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) explicitly
  documents same-user trust and post-execution read-only grading/rollback.
- [Prompt renderer](../../../src/runner/dispatch/assignment.mjs) renders the basic
  objective/context/output packet; this is not a complete soul delivery contract.
- [Session engine](../../../src/runner/coordination/session-engine.mjs),
  `classifySessionQuorum`, takes the manifest actor roster as required;
  aggregation-based close requires `consensus`.
- [Public run](../../../src/verbs/coordination/run.mjs) automatically attempts close.
- [Store](../../../src/runner/coordination/store.mjs), `assertDriverIdentity`, compares
  writer identity strings; session `maxRounds` uses Assignment count.
- [Chain](../../../src/verbs/coordination/chain.mjs) selects the latest active session
  and derives a hint; it does not reconstruct plan rationale.
````
`````

## claim_0ffd34ab353a90b0a5011c86e648af53

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-14, lines 92–94.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-17.
Source digest: 73d9f3d9d87cfb61b43654429f4e087c3f14ef172209aff5cc08b76f0d75d4a7
Target digest: 73d9f3d9d87cfb61b43654429f4e087c3f14ef172209aff5cc08b76f0d75d4a7
Shown source SHA256: 73d9f3d9d87cfb61b43654429f4e087c3f14ef172209aff5cc08b76f0d75d4a7
Shown target SHA256: 73d9f3d9d87cfb61b43654429f4e087c3f14ef172209aff5cc08b76f0d75d4a7

### Proposed decision

```json
{
  "claimId": "claim_0ffd34ab353a90b0a5011c86e648af53",
  "sourceUnitDigest": "73d9f3d9d87cfb61b43654429f4e087c3f14ef172209aff5cc08b76f0d75d4a7",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "73d9f3d9d87cfb61b43654429f4e087c3f14ef172209aff5cc08b76f0d75d4a7",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "2. Root causes from the review"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-14 (lines 92–94) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-17 (lines 119–121); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A new Architecture Advisory graph alone would add another method to the same
misplaced boundaries. The review calls for responsibility redesign, not wholesale
replacement of proven execution machinery.
```

### Full target shown text

```text
A new Architecture Advisory graph alone would add another method to the same
misplaced boundaries. The review calls for responsibility redesign, not wholesale
replacement of proven execution machinery.
```

## claim_e994732c727ea742566e2ceeda681ef4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#3-proposed-hardsoft-boundary, lines 96–96.
Target: docs/platform/proposals/coordination-capability-envelope.md#3-proposed-hardsoft-boundary.
Source digest: 97ce268333e83b91e63feb558f05b5badf8760c1db0705e7e71cb6b7973dda3c
Target digest: 97ce268333e83b91e63feb558f05b5badf8760c1db0705e7e71cb6b7973dda3c
Shown source SHA256: 2fbabc3a07e6a21f56aa4db1fdb6bd3c208e5bc933d0526e09431f0d2afc9a09
Shown target SHA256: 2fbabc3a07e6a21f56aa4db1fdb6bd3c208e5bc933d0526e09431f0d2afc9a09

### Proposed decision

```json
{
  "claimId": "claim_e994732c727ea742566e2ceeda681ef4",
  "sourceUnitDigest": "97ce268333e83b91e63feb558f05b5badf8760c1db0705e7e71cb6b7973dda3c",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "3-proposed-hardsoft-boundary",
  "targetUnitDigest": "97ce268333e83b91e63feb558f05b5badf8760c1db0705e7e71cb6b7973dda3c",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#3-proposed-hardsoft-boundary (lines 96–96) is carried at docs/platform/proposals/coordination-capability-envelope.md#3-proposed-hardsoft-boundary (lines 123–123); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 3. Proposed hard/soft boundary

| Layer | Responsibility |
|---|---|
| Hard invariants | Authenticated principals; attenuating grants; isolation; visibility; bounds; provenance; evidence integrity; mutation exclusivity; lifecycle authority |
| Soft coordination judgment | Understand/reframe, select methods/specialists, assess findings, choose the next step, judge sufficiency and propose closure |
| Reusable cognitive doctrine | Independent-first, challenge assumptions, preserve dissent, investigate-before-ask, distinguish fact/inference, recheck after changes |
| Use-case playbook | Role postures, heuristics, outputs, and defaults for Code Panel, Plan Loop, RFC, research, Delphi/NGT, Advisory |
| Derived evidence/replay view | Who acted, who saw what, outstanding obligations, reviewed candidate, decision-to-evidence links |

Doctrine may instantiate a hard commitment without becoming kernel logic in its
entirety. “Usually seek two independent views” is doctrine. “This candidate needs
two separate assessments before acceptance” is an obligation when the authority
owner adopts it. “Do not reveal either draft before first-pass submissions” is a
visibility constraint. Whether to debate afterward or recruit a specialist is
judgment.

A coordinator may change method but cannot waive an obligation locked by higher
authority. Runtime must distinguish:

1. Has execution ended?
2. Does evidence satisfy source/revision/verification requirements?
3. Do participants agree?
4. Should deliberation end, or should a deliverable be accepted?

No universal quorum answers all four.
```

### Full target shown text

```text
## 3. Proposed hard/soft boundary

| Layer | Responsibility |
|---|---|
| Hard invariants | Authenticated principals; attenuating grants; isolation; visibility; bounds; provenance; evidence integrity; mutation exclusivity; lifecycle authority |
| Soft coordination judgment | Understand/reframe, select methods/specialists, assess findings, choose the next step, judge sufficiency and propose closure |
| Reusable cognitive doctrine | Independent-first, challenge assumptions, preserve dissent, investigate-before-ask, distinguish fact/inference, recheck after changes |
| Use-case playbook | Role postures, heuristics, outputs, and defaults for Code Panel, Plan Loop, RFC, research, Delphi/NGT, Advisory |
| Derived evidence/replay view | Who acted, who saw what, outstanding obligations, reviewed candidate, decision-to-evidence links |

Doctrine may instantiate a hard commitment without becoming kernel logic in its
entirety. “Usually seek two independent views” is doctrine. “This candidate needs
two separate assessments before acceptance” is an obligation when the authority
owner adopts it. “Do not reveal either draft before first-pass submissions” is a
visibility constraint. Whether to debate afterward or recruit a specialist is
judgment.

A coordinator may change method but cannot waive an obligation locked by higher
authority. Runtime must distinguish:

1. Has execution ended?
2. Does evidence satisfy source/revision/verification requirements?
3. Do participants agree?
4. Should deliberation end, or should a deliverable be accepted?

No universal quorum answers all four.
```

## claim_1fe0aa4b2ea52775da9299e51b41db35

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-15, lines 98–104.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-18.
Source digest: b6982b6a6d6c2c0e75cf914817b419e172f541cea94444d25fa366c9c52b9444
Target digest: b6982b6a6d6c2c0e75cf914817b419e172f541cea94444d25fa366c9c52b9444
Shown source SHA256: b6982b6a6d6c2c0e75cf914817b419e172f541cea94444d25fa366c9c52b9444
Shown target SHA256: b6982b6a6d6c2c0e75cf914817b419e172f541cea94444d25fa366c9c52b9444

### Proposed decision

```json
{
  "claimId": "claim_1fe0aa4b2ea52775da9299e51b41db35",
  "sourceUnitDigest": "b6982b6a6d6c2c0e75cf914817b419e172f541cea94444d25fa366c9c52b9444",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "b6982b6a6d6c2c0e75cf914817b419e172f541cea94444d25fa366c9c52b9444",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "3. Proposed hard/soft boundary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-15 (lines 98–104) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-18 (lines 125–131); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Layer | Responsibility |
|---|---|
| Hard invariants | Authenticated principals; attenuating grants; isolation; visibility; bounds; provenance; evidence integrity; mutation exclusivity; lifecycle authority |
| Soft coordination judgment | Understand/reframe, select methods/specialists, assess findings, choose the next step, judge sufficiency and propose closure |
| Reusable cognitive doctrine | Independent-first, challenge assumptions, preserve dissent, investigate-before-ask, distinguish fact/inference, recheck after changes |
| Use-case playbook | Role postures, heuristics, outputs, and defaults for Code Panel, Plan Loop, RFC, research, Delphi/NGT, Advisory |
| Derived evidence/replay view | Who acted, who saw what, outstanding obligations, reviewed candidate, decision-to-evidence links |
```

### Full target shown text

```text
| Layer | Responsibility |
|---|---|
| Hard invariants | Authenticated principals; attenuating grants; isolation; visibility; bounds; provenance; evidence integrity; mutation exclusivity; lifecycle authority |
| Soft coordination judgment | Understand/reframe, select methods/specialists, assess findings, choose the next step, judge sufficiency and propose closure |
| Reusable cognitive doctrine | Independent-first, challenge assumptions, preserve dissent, investigate-before-ask, distinguish fact/inference, recheck after changes |
| Use-case playbook | Role postures, heuristics, outputs, and defaults for Code Panel, Plan Loop, RFC, research, Delphi/NGT, Advisory |
| Derived evidence/replay view | Who acted, who saw what, outstanding obligations, reviewed candidate, decision-to-evidence links |
```

## claim_2f8b933238807fe08083e3d6647bf2d3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-16, lines 106–111.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-19.
Source digest: 4d70691036c31a2833d830ec37ee71d34f13da8273669b117db8880913b6895d
Target digest: 4d70691036c31a2833d830ec37ee71d34f13da8273669b117db8880913b6895d
Shown source SHA256: 4d70691036c31a2833d830ec37ee71d34f13da8273669b117db8880913b6895d
Shown target SHA256: 4d70691036c31a2833d830ec37ee71d34f13da8273669b117db8880913b6895d

### Proposed decision

```json
{
  "claimId": "claim_2f8b933238807fe08083e3d6647bf2d3",
  "sourceUnitDigest": "4d70691036c31a2833d830ec37ee71d34f13da8273669b117db8880913b6895d",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "4d70691036c31a2833d830ec37ee71d34f13da8273669b117db8880913b6895d",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "3. Proposed hard/soft boundary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-16 (lines 106–111) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-19 (lines 133–138); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Doctrine may instantiate a hard commitment without becoming kernel logic in its
entirety. “Usually seek two independent views” is doctrine. “This candidate needs
two separate assessments before acceptance” is an obligation when the authority
owner adopts it. “Do not reveal either draft before first-pass submissions” is a
visibility constraint. Whether to debate afterward or recruit a specialist is
judgment.
```

### Full target shown text

```text
Doctrine may instantiate a hard commitment without becoming kernel logic in its
entirety. “Usually seek two independent views” is doctrine. “This candidate needs
two separate assessments before acceptance” is an obligation when the authority
owner adopts it. “Do not reveal either draft before first-pass submissions” is a
visibility constraint. Whether to debate afterward or recruit a specialist is
judgment.
```

## claim_492148733a56390622fe5d0d132089c1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-17, lines 113–114.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-20.
Source digest: 9ce1d49a8205cb5dfb1f66a56d99a6ad8739c5784d1c10c404708d0ef36711d8
Target digest: 9ce1d49a8205cb5dfb1f66a56d99a6ad8739c5784d1c10c404708d0ef36711d8
Shown source SHA256: 9ce1d49a8205cb5dfb1f66a56d99a6ad8739c5784d1c10c404708d0ef36711d8
Shown target SHA256: 9ce1d49a8205cb5dfb1f66a56d99a6ad8739c5784d1c10c404708d0ef36711d8

### Proposed decision

```json
{
  "claimId": "claim_492148733a56390622fe5d0d132089c1",
  "sourceUnitDigest": "9ce1d49a8205cb5dfb1f66a56d99a6ad8739c5784d1c10c404708d0ef36711d8",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "9ce1d49a8205cb5dfb1f66a56d99a6ad8739c5784d1c10c404708d0ef36711d8",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "3. Proposed hard/soft boundary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-17 (lines 113–114) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-20 (lines 140–141); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A coordinator may change method but cannot waive an obligation locked by higher
authority. Runtime must distinguish:
```

### Full target shown text

```text
A coordinator may change method but cannot waive an obligation locked by higher
authority. Runtime must distinguish:
```

## claim_ad4a0e1733fd2c0a2a0ac95fcb869912

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-18, lines 116–119.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-21.
Source digest: f9d1ca936c5c31dd74bf2f01a2a7e4af056b00c3c1b8b61a3209452548043d5a
Target digest: f9d1ca936c5c31dd74bf2f01a2a7e4af056b00c3c1b8b61a3209452548043d5a
Shown source SHA256: f9d1ca936c5c31dd74bf2f01a2a7e4af056b00c3c1b8b61a3209452548043d5a
Shown target SHA256: f9d1ca936c5c31dd74bf2f01a2a7e4af056b00c3c1b8b61a3209452548043d5a

### Proposed decision

```json
{
  "claimId": "claim_ad4a0e1733fd2c0a2a0ac95fcb869912",
  "sourceUnitDigest": "f9d1ca936c5c31dd74bf2f01a2a7e4af056b00c3c1b8b61a3209452548043d5a",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "f9d1ca936c5c31dd74bf2f01a2a7e4af056b00c3c1b8b61a3209452548043d5a",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "3. Proposed hard/soft boundary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-18 (lines 116–119) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-21 (lines 143–146); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. Has execution ended?
2. Does evidence satisfy source/revision/verification requirements?
3. Do participants agree?
4. Should deliberation end, or should a deliverable be accepted?
```

### Full target shown text

```text
1. Has execution ended?
2. Does evidence satisfy source/revision/verification requirements?
3. Do participants agree?
4. Should deliberation end, or should a deliverable be accepted?
```

## claim_761d93d8a9991ea75cb5198c78ad80c6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-19, lines 121–121.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-22.
Source digest: c2af62ae53c891596294b5d6d6f48f42f3e83b2ab4737d71cdf34557ac0ac079
Target digest: c2af62ae53c891596294b5d6d6f48f42f3e83b2ab4737d71cdf34557ac0ac079
Shown source SHA256: c2af62ae53c891596294b5d6d6f48f42f3e83b2ab4737d71cdf34557ac0ac079
Shown target SHA256: c2af62ae53c891596294b5d6d6f48f42f3e83b2ab4737d71cdf34557ac0ac079

### Proposed decision

```json
{
  "claimId": "claim_761d93d8a9991ea75cb5198c78ad80c6",
  "sourceUnitDigest": "c2af62ae53c891596294b5d6d6f48f42f3e83b2ab4737d71cdf34557ac0ac079",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "c2af62ae53c891596294b5d6d6f48f42f3e83b2ab4737d71cdf34557ac0ac079",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "3. Proposed hard/soft boundary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-19 (lines 121–121) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-22 (lines 148–148); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
No universal quorum answers all four.
```

### Full target shown text

```text
No universal quorum answers all four.
```

## claim_4012bc2ca9fa1cfa37b4376e5da361dc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#4-three-architecture-families, lines 123–123.
Target: docs/platform/proposals/coordination-capability-envelope.md#4-three-architecture-families.
Source digest: fbf507bb428f459a78060dc810212902d29463f67aae1120976227f3a9b07c97
Target digest: fbf507bb428f459a78060dc810212902d29463f67aae1120976227f3a9b07c97
Shown source SHA256: 29faa2071c6e5d6585fbef9372fd1125aedf8eab9e2e2e3737b57d4f39109b62
Shown target SHA256: 29faa2071c6e5d6585fbef9372fd1125aedf8eab9e2e2e3737b57d4f39109b62

### Proposed decision

```json
{
  "claimId": "claim_4012bc2ca9fa1cfa37b4376e5da361dc",
  "sourceUnitDigest": "fbf507bb428f459a78060dc810212902d29463f67aae1120976227f3a9b07c97",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "4-three-architecture-families",
  "targetUnitDigest": "fbf507bb428f459a78060dc810212902d29463f67aae1120976227f3a9b07c97",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#4-three-architecture-families (lines 123–123) is carried at docs/platform/proposals/coordination-capability-envelope.md#4-three-architecture-families (lines 150–150); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 4. Three architecture families

| Family | Coordination structure | Adaptation | Strength | Main limitation |
|---|---|---|---|---|
| A — Incremental FlowDefinition | Graph/binding remains primary | Branches, repeatable invocation identities, bounded extension regions | Lowest migration distance; declared methods remain inspectable | Unexpected cases may require graph edits |
| B — Capability envelope + coordinator-owned deliberation | Envelope owns legality; coordinator owns method | New bounded assignments, grants, and obligation instances from evidence | Broad reuse without a graph per use case | Requires sound isolation and durable memory |
| C — Programmable master prompt + minimal broker | Prompt/skill and session documents own most structure | Master calls a small set of protected tools | Closest to raw master prompt; low authoring cost | Recovery and obligation logic can be duplicated in playbooks |
```

### Full target shown text

```text
## 4. Three architecture families

| Family | Coordination structure | Adaptation | Strength | Main limitation |
|---|---|---|---|---|
| A — Incremental FlowDefinition | Graph/binding remains primary | Branches, repeatable invocation identities, bounded extension regions | Lowest migration distance; declared methods remain inspectable | Unexpected cases may require graph edits |
| B — Capability envelope + coordinator-owned deliberation | Envelope owns legality; coordinator owns method | New bounded assignments, grants, and obligation instances from evidence | Broad reuse without a graph per use case | Requires sound isolation and durable memory |
| C — Programmable master prompt + minimal broker | Prompt/skill and session documents own most structure | Master calls a small set of protected tools | Closest to raw master prompt; low authoring cost | Recovery and obligation logic can be duplicated in playbooks |
```

## claim_1643a2580572c9f09cb915630cedc549

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-20, lines 125–129.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-23.
Source digest: ae4a84594e33a5dee4c3c118f0c388190b8dc5a26e7a3c1673afd375c30c28f6
Target digest: ae4a84594e33a5dee4c3c118f0c388190b8dc5a26e7a3c1673afd375c30c28f6
Shown source SHA256: ae4a84594e33a5dee4c3c118f0c388190b8dc5a26e7a3c1673afd375c30c28f6
Shown target SHA256: ae4a84594e33a5dee4c3c118f0c388190b8dc5a26e7a3c1673afd375c30c28f6

### Proposed decision

```json
{
  "claimId": "claim_1643a2580572c9f09cb915630cedc549",
  "sourceUnitDigest": "ae4a84594e33a5dee4c3c118f0c388190b8dc5a26e7a3c1673afd375c30c28f6",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "ae4a84594e33a5dee4c3c118f0c388190b8dc5a26e7a3c1673afd375c30c28f6",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-20 (lines 125–129) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-23 (lines 152–156); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Family | Coordination structure | Adaptation | Strength | Main limitation |
|---|---|---|---|---|
| A — Incremental FlowDefinition | Graph/binding remains primary | Branches, repeatable invocation identities, bounded extension regions | Lowest migration distance; declared methods remain inspectable | Unexpected cases may require graph edits |
| B — Capability envelope + coordinator-owned deliberation | Envelope owns legality; coordinator owns method | New bounded assignments, grants, and obligation instances from evidence | Broad reuse without a graph per use case | Requires sound isolation and durable memory |
| C — Programmable master prompt + minimal broker | Prompt/skill and session documents own most structure | Master calls a small set of protected tools | Closest to raw master prompt; low authoring cost | Recovery and obligation logic can be duplicated in playbooks |
```

### Full target shown text

```text
| Family | Coordination structure | Adaptation | Strength | Main limitation |
|---|---|---|---|---|
| A — Incremental FlowDefinition | Graph/binding remains primary | Branches, repeatable invocation identities, bounded extension regions | Lowest migration distance; declared methods remain inspectable | Unexpected cases may require graph edits |
| B — Capability envelope + coordinator-owned deliberation | Envelope owns legality; coordinator owns method | New bounded assignments, grants, and obligation instances from evidence | Broad reuse without a graph per use case | Requires sound isolation and durable memory |
| C — Programmable master prompt + minimal broker | Prompt/skill and session documents own most structure | Master calls a small set of protected tools | Closest to raw master prompt; low authoring cost | Recovery and obligation logic can be duplicated in playbooks |
```

## claim_1008c9a3ac71c19e65e8d5809779022e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#a-improve-flowdefinition-incrementally, lines 131–131.
Target: docs/platform/proposals/coordination-capability-envelope.md#a-improve-flowdefinition-incrementally.
Source digest: dbbf3128fefaa0534cfb9022aa96ce8cc0ba59a9bb841797a98e6a099faa4c83
Target digest: dbbf3128fefaa0534cfb9022aa96ce8cc0ba59a9bb841797a98e6a099faa4c83
Shown source SHA256: 3e18a4bae5c1533b4a093d2d432ed15b7853235162eff8b2532093d418475db7
Shown target SHA256: 3e18a4bae5c1533b4a093d2d432ed15b7853235162eff8b2532093d418475db7

### Proposed decision

```json
{
  "claimId": "claim_1008c9a3ac71c19e65e8d5809779022e",
  "sourceUnitDigest": "dbbf3128fefaa0534cfb9022aa96ce8cc0ba59a9bb841797a98e6a099faa4c83",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "a-improve-flowdefinition-incrementally",
  "targetUnitDigest": "dbbf3128fefaa0534cfb9022aa96ce8cc0ba59a9bb841797a98e6a099faa4c83",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#a-improve-flowdefinition-incrementally (lines 131–131) is carried at docs/platform/proposals/coordination-capability-envelope.md#a-improve-flowdefinition-incrementally (lines 158–158); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### A. Improve FlowDefinition incrementally

Retain FlowDefinition and CoordinationSession. Address individual invocations,
not the first matching binding. Derive completion from applicable obligations,
not every declared actor. Require explicit close. Separate read grants from graph
position and assignment counts from cognitive rounds. Expose retry, replacement,
cancel, and specialist actions publicly. Complete role-packet delivery and
executor/provider/model/tier/persona binding, including fan-out.

A generic deliberate/observe/choose graph can provide bounded extension regions.
If most useful work moves into those regions, however, the graph is no longer
the actual coordination structure: A is converging toward B.
```

### Full target shown text

```text
### A. Improve FlowDefinition incrementally

Retain FlowDefinition and CoordinationSession. Address individual invocations,
not the first matching binding. Derive completion from applicable obligations,
not every declared actor. Require explicit close. Separate read grants from graph
position and assignment counts from cognitive rounds. Expose retry, replacement,
cancel, and specialist actions publicly. Complete role-packet delivery and
executor/provider/model/tier/persona binding, including fan-out.

A generic deliberate/observe/choose graph can provide bounded extension regions.
If most useful work moves into those regions, however, the graph is no longer
the actual coordination structure: A is converging toward B.
```

## claim_acba7768e2dca66cf2e20d2a06703778

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-21, lines 133–138.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-24.
Source digest: af3164996bd724bb75ba16494644edcb0d601b839bcf82f184b8daecd7413786
Target digest: af3164996bd724bb75ba16494644edcb0d601b839bcf82f184b8daecd7413786
Shown source SHA256: af3164996bd724bb75ba16494644edcb0d601b839bcf82f184b8daecd7413786
Shown target SHA256: af3164996bd724bb75ba16494644edcb0d601b839bcf82f184b8daecd7413786

### Proposed decision

```json
{
  "claimId": "claim_acba7768e2dca66cf2e20d2a06703778",
  "sourceUnitDigest": "af3164996bd724bb75ba16494644edcb0d601b839bcf82f184b8daecd7413786",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "af3164996bd724bb75ba16494644edcb0d601b839bcf82f184b8daecd7413786",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families",
    "A. Improve FlowDefinition incrementally"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-21 (lines 133–138) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-24 (lines 160–165); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Retain FlowDefinition and CoordinationSession. Address individual invocations,
not the first matching binding. Derive completion from applicable obligations,
not every declared actor. Require explicit close. Separate read grants from graph
position and assignment counts from cognitive rounds. Expose retry, replacement,
cancel, and specialist actions publicly. Complete role-packet delivery and
executor/provider/model/tier/persona binding, including fan-out.
```

### Full target shown text

```text
Retain FlowDefinition and CoordinationSession. Address individual invocations,
not the first matching binding. Derive completion from applicable obligations,
not every declared actor. Require explicit close. Separate read grants from graph
position and assignment counts from cognitive rounds. Expose retry, replacement,
cancel, and specialist actions publicly. Complete role-packet delivery and
executor/provider/model/tier/persona binding, including fan-out.
```

## claim_1f3e51e40f2053bc23990774306efe53

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-22, lines 140–142.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-25.
Source digest: f3865acd9653d4c6a4471f427380497aed38a25db40898083db1fc3d4b3c12f4
Target digest: f3865acd9653d4c6a4471f427380497aed38a25db40898083db1fc3d4b3c12f4
Shown source SHA256: f3865acd9653d4c6a4471f427380497aed38a25db40898083db1fc3d4b3c12f4
Shown target SHA256: f3865acd9653d4c6a4471f427380497aed38a25db40898083db1fc3d4b3c12f4

### Proposed decision

```json
{
  "claimId": "claim_1f3e51e40f2053bc23990774306efe53",
  "sourceUnitDigest": "f3865acd9653d4c6a4471f427380497aed38a25db40898083db1fc3d4b3c12f4",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "f3865acd9653d4c6a4471f427380497aed38a25db40898083db1fc3d4b3c12f4",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families",
    "A. Improve FlowDefinition incrementally"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-22 (lines 140–142) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-25 (lines 167–169); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A generic deliberate/observe/choose graph can provide bounded extension regions.
If most useful work moves into those regions, however, the graph is no longer
the actual coordination structure: A is converging toward B.
```

### Full target shown text

```text
A generic deliberate/observe/choose graph can provide bounded extension regions.
If most useful work moves into those regions, however, the graph is no longer
the actual coordination structure: A is converging toward B.
```

## claim_c8ce873250201d1a61cd2ebaad931b07

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#b-capability-envelope-with-coordinator-owned-deliberation, lines 144–144.
Target: docs/platform/proposals/coordination-capability-envelope.md#b-capability-envelope-with-coordinator-owned-deliberation.
Source digest: 20719623a65acd0bb2a5b7b57a30ded544c148db697a88fbdeb43ab0f807fb8d
Target digest: 20719623a65acd0bb2a5b7b57a30ded544c148db697a88fbdeb43ab0f807fb8d
Shown source SHA256: 2eb763dcc6df84b461166f390ad1039be839231cc355628fcce72622c0307318
Shown target SHA256: 2eb763dcc6df84b461166f390ad1039be839231cc355628fcce72622c0307318

### Proposed decision

```json
{
  "claimId": "claim_c8ce873250201d1a61cd2ebaad931b07",
  "sourceUnitDigest": "20719623a65acd0bb2a5b7b57a30ded544c148db697a88fbdeb43ab0f807fb8d",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "b-capability-envelope-with-coordinator-owned-deliberation",
  "targetUnitDigest": "20719623a65acd0bb2a5b7b57a30ded544c148db697a88fbdeb43ab0f807fb8d",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#b-capability-envelope-with-coordinator-owned-deliberation (lines 144–144) is carried at docs/platform/proposals/coordination-capability-envelope.md#b-capability-envelope-with-coordinator-owned-deliberation (lines 171–171); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### B. Capability envelope with coordinator-owned deliberation

The coordinator is an agent with soul, memory, and delegated process authority.
It proposes consequential actions; runtime validates and executes them. A new
investigation does not require a predeclared cognitive operation. Its execution
contract identifies principal, resources, outputs, context, budget, capabilities,
and obligations.

FlowDefinition remains useful for a deliberately selected stable method. It may
supply sequencing/defaults or additional commitments, but is not the mandatory
language of deliberation. Method changes never expand the envelope implicitly.
```

### Full target shown text

```text
### B. Capability envelope with coordinator-owned deliberation

The coordinator is an agent with soul, memory, and delegated process authority.
It proposes consequential actions; runtime validates and executes them. A new
investigation does not require a predeclared cognitive operation. Its execution
contract identifies principal, resources, outputs, context, budget, capabilities,
and obligations.

FlowDefinition remains useful for a deliberately selected stable method. It may
supply sequencing/defaults or additional commitments, but is not the mandatory
language of deliberation. Method changes never expand the envelope implicitly.
```

## claim_b4613cc7ee9921c97898ad5930ed804b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-23, lines 146–150.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-26.
Source digest: 9113e8c3fb46d193b6c1db2dc9234067d9e38a0f568ff0d84218e7df310831f2
Target digest: 9113e8c3fb46d193b6c1db2dc9234067d9e38a0f568ff0d84218e7df310831f2
Shown source SHA256: 9113e8c3fb46d193b6c1db2dc9234067d9e38a0f568ff0d84218e7df310831f2
Shown target SHA256: 9113e8c3fb46d193b6c1db2dc9234067d9e38a0f568ff0d84218e7df310831f2

### Proposed decision

```json
{
  "claimId": "claim_b4613cc7ee9921c97898ad5930ed804b",
  "sourceUnitDigest": "9113e8c3fb46d193b6c1db2dc9234067d9e38a0f568ff0d84218e7df310831f2",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "9113e8c3fb46d193b6c1db2dc9234067d9e38a0f568ff0d84218e7df310831f2",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families",
    "B. Capability envelope with coordinator-owned deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-23 (lines 146–150) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-26 (lines 173–177); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The coordinator is an agent with soul, memory, and delegated process authority.
It proposes consequential actions; runtime validates and executes them. A new
investigation does not require a predeclared cognitive operation. Its execution
contract identifies principal, resources, outputs, context, budget, capabilities,
and obligations.
```

### Full target shown text

```text
The coordinator is an agent with soul, memory, and delegated process authority.
It proposes consequential actions; runtime validates and executes them. A new
investigation does not require a predeclared cognitive operation. Its execution
contract identifies principal, resources, outputs, context, budget, capabilities,
and obligations.
```

## claim_20fe8805e262e3edd9d59115751221b9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-24, lines 152–154.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-27.
Source digest: a27cb8f382e927116bd69886faed9a632a2ca6299b2c86d041113c02fa4d8b94
Target digest: a27cb8f382e927116bd69886faed9a632a2ca6299b2c86d041113c02fa4d8b94
Shown source SHA256: a27cb8f382e927116bd69886faed9a632a2ca6299b2c86d041113c02fa4d8b94
Shown target SHA256: a27cb8f382e927116bd69886faed9a632a2ca6299b2c86d041113c02fa4d8b94

### Proposed decision

```json
{
  "claimId": "claim_20fe8805e262e3edd9d59115751221b9",
  "sourceUnitDigest": "a27cb8f382e927116bd69886faed9a632a2ca6299b2c86d041113c02fa4d8b94",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "a27cb8f382e927116bd69886faed9a632a2ca6299b2c86d041113c02fa4d8b94",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families",
    "B. Capability envelope with coordinator-owned deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-24 (lines 152–154) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-27 (lines 179–181); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
FlowDefinition remains useful for a deliberately selected stable method. It may
supply sequencing/defaults or additional commitments, but is not the mandatory
language of deliberation. Method changes never expand the envelope implicitly.
```

### Full target shown text

```text
FlowDefinition remains useful for a deliberately selected stable method. It may
supply sequencing/defaults or additional commitments, but is not the mandatory
language of deliberation. Method changes never expand the envelope implicitly.
```

## claim_3ee7e1c3c3ce8be5ed558b0c7382544b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#c-programmable-master-prompt-with-a-minimal-tool-broker, lines 156–156.
Target: docs/platform/proposals/coordination-capability-envelope.md#c-programmable-master-prompt-with-a-minimal-tool-broker.
Source digest: 9d83f4ea727cc75afc2f660a46e9113e76bf13477d799d1556a236431d2dcb3e
Target digest: 9d83f4ea727cc75afc2f660a46e9113e76bf13477d799d1556a236431d2dcb3e
Shown source SHA256: 2c9f3701500f42b3099d92a980a233df6549ecded511f88527660bcc8bb940c4
Shown target SHA256: 2c9f3701500f42b3099d92a980a233df6549ecded511f88527660bcc8bb940c4

### Proposed decision

```json
{
  "claimId": "claim_3ee7e1c3c3ce8be5ed558b0c7382544b",
  "sourceUnitDigest": "9d83f4ea727cc75afc2f660a46e9113e76bf13477d799d1556a236431d2dcb3e",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "c-programmable-master-prompt-with-a-minimal-tool-broker",
  "targetUnitDigest": "9d83f4ea727cc75afc2f660a46e9113e76bf13477d799d1556a236431d2dcb3e",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#c-programmable-master-prompt-with-a-minimal-tool-broker (lines 156–156) is carried at docs/platform/proposals/coordination-capability-envelope.md#c-programmable-master-prompt-with-a-minimal-tool-broker (lines 183–183); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### C. Programmable master prompt with a minimal tool broker

A versioned master prompt uses protected tools to dispatch bounded workers,
read/publish granted artifacts, checkpoint, park/resume, and propose closure or
mutation. The broker protects execution, authority, and evidence. Review logic,
tracking, and synthesis mostly remain in skill/documents.

Unlike B, C has less shared coordination state with operational meaning. This
keeps it small but pushes obligation tracking, invalidation, and cold resume into
each playbook. Adding all those shared mechanisms to the broker converges on B.

All three require real containment for the malicious-worker requirement. Fewer
schemas do not remove the trust-boundary cost.
```

### Full target shown text

```text
### C. Programmable master prompt with a minimal tool broker

A versioned master prompt uses protected tools to dispatch bounded workers,
read/publish granted artifacts, checkpoint, park/resume, and propose closure or
mutation. The broker protects execution, authority, and evidence. Review logic,
tracking, and synthesis mostly remain in skill/documents.

Unlike B, C has less shared coordination state with operational meaning. This
keeps it small but pushes obligation tracking, invalidation, and cold resume into
each playbook. Adding all those shared mechanisms to the broker converges on B.

All three require real containment for the malicious-worker requirement. Fewer
schemas do not remove the trust-boundary cost.
```

## claim_e355ec42f273086f2ea9b69e3ae0edf0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-25, lines 158–161.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-28.
Source digest: 506d34ee1a656f53a43c6655463ef30819bd38bfe9a0044005fad65a8d682c31
Target digest: 506d34ee1a656f53a43c6655463ef30819bd38bfe9a0044005fad65a8d682c31
Shown source SHA256: 506d34ee1a656f53a43c6655463ef30819bd38bfe9a0044005fad65a8d682c31
Shown target SHA256: 506d34ee1a656f53a43c6655463ef30819bd38bfe9a0044005fad65a8d682c31

### Proposed decision

```json
{
  "claimId": "claim_e355ec42f273086f2ea9b69e3ae0edf0",
  "sourceUnitDigest": "506d34ee1a656f53a43c6655463ef30819bd38bfe9a0044005fad65a8d682c31",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "506d34ee1a656f53a43c6655463ef30819bd38bfe9a0044005fad65a8d682c31",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families",
    "C. Programmable master prompt with a minimal tool broker"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-25 (lines 158–161) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-28 (lines 185–188); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A versioned master prompt uses protected tools to dispatch bounded workers,
read/publish granted artifacts, checkpoint, park/resume, and propose closure or
mutation. The broker protects execution, authority, and evidence. Review logic,
tracking, and synthesis mostly remain in skill/documents.
```

### Full target shown text

```text
A versioned master prompt uses protected tools to dispatch bounded workers,
read/publish granted artifacts, checkpoint, park/resume, and propose closure or
mutation. The broker protects execution, authority, and evidence. Review logic,
tracking, and synthesis mostly remain in skill/documents.
```

## claim_5244b0e2580e5e4a32c4560f7dfce934

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-26, lines 163–165.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-29.
Source digest: cffaac2e53a6e5121dca635f0f152d7ef3d38d983bfa95b406b2449b742917d7
Target digest: cffaac2e53a6e5121dca635f0f152d7ef3d38d983bfa95b406b2449b742917d7
Shown source SHA256: cffaac2e53a6e5121dca635f0f152d7ef3d38d983bfa95b406b2449b742917d7
Shown target SHA256: cffaac2e53a6e5121dca635f0f152d7ef3d38d983bfa95b406b2449b742917d7

### Proposed decision

```json
{
  "claimId": "claim_5244b0e2580e5e4a32c4560f7dfce934",
  "sourceUnitDigest": "cffaac2e53a6e5121dca635f0f152d7ef3d38d983bfa95b406b2449b742917d7",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "cffaac2e53a6e5121dca635f0f152d7ef3d38d983bfa95b406b2449b742917d7",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families",
    "C. Programmable master prompt with a minimal tool broker"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-26 (lines 163–165) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-29 (lines 190–192); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Unlike B, C has less shared coordination state with operational meaning. This
keeps it small but pushes obligation tracking, invalidation, and cold resume into
each playbook. Adding all those shared mechanisms to the broker converges on B.
```

### Full target shown text

```text
Unlike B, C has less shared coordination state with operational meaning. This
keeps it small but pushes obligation tracking, invalidation, and cold resume into
each playbook. Adding all those shared mechanisms to the broker converges on B.
```

## claim_2182f5edd441716b22578461d3589656

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-27, lines 167–168.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-30.
Source digest: f8afd1fc58b9f583e7917115d7e184d2b111f4009e2dcf2cd4c310e5955240cc
Target digest: f8afd1fc58b9f583e7917115d7e184d2b111f4009e2dcf2cd4c310e5955240cc
Shown source SHA256: f8afd1fc58b9f583e7917115d7e184d2b111f4009e2dcf2cd4c310e5955240cc
Shown target SHA256: f8afd1fc58b9f583e7917115d7e184d2b111f4009e2dcf2cd4c310e5955240cc

### Proposed decision

```json
{
  "claimId": "claim_2182f5edd441716b22578461d3589656",
  "sourceUnitDigest": "f8afd1fc58b9f583e7917115d7e184d2b111f4009e2dcf2cd4c310e5955240cc",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "f8afd1fc58b9f583e7917115d7e184d2b111f4009e2dcf2cd4c310e5955240cc",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "4. Three architecture families",
    "C. Programmable master prompt with a minimal tool broker"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-27 (lines 167–168) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-30 (lines 194–195); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
All three require real containment for the malicious-worker requirement. Fewer
schemas do not remove the trust-boundary cost.
```

### Full target shown text

```text
All three require real containment for the malicious-worker requirement. Fewer
schemas do not remove the trust-boundary cost.
```

## claim_bf9b86140d0db67dbdb2f25f6277775a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#5-comparative-walkthrough-and-trade-offs, lines 170–170.
Target: docs/platform/proposals/coordination-capability-envelope.md#5-comparative-walkthrough-and-trade-offs.
Source digest: b2aba4bfe2260eb4d851cc45f97c79f34932d9567e8335a2e112a97133052d25
Target digest: b2aba4bfe2260eb4d851cc45f97c79f34932d9567e8335a2e112a97133052d25
Shown source SHA256: 90a482eb9e408b17fd6974a1f83415b96ebc940fef59c8e5c9fed8837158e029
Shown target SHA256: 90a482eb9e408b17fd6974a1f83415b96ebc940fef59c8e5c9fed8837158e029

### Proposed decision

```json
{
  "claimId": "claim_bf9b86140d0db67dbdb2f25f6277775a",
  "sourceUnitDigest": "b2aba4bfe2260eb4d851cc45f97c79f34932d9567e8335a2e112a97133052d25",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "5-comparative-walkthrough-and-trade-offs",
  "targetUnitDigest": "b2aba4bfe2260eb4d851cc45f97c79f34932d9567e8335a2e112a97133052d25",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#5-comparative-walkthrough-and-trade-offs (lines 170–170) is carried at docs/platform/proposals/coordination-capability-envelope.md#5-comparative-walkthrough-and-trade-offs (lines 197–197); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 5. Comparative walkthrough and trade-offs

| Scenario | A — Improved Flow | B — Envelope | C — Master + broker |
|---|---|---|---|
| Code Panel | Doer then review/red-team; conditional fixer/recheck; candidate obligations gate close | Seal candidate; dispatch two independent reviews; recruit specialist or fix from findings | Master follows the same method through tools; playbook owns candidate/review tracking |
| Multi-phase Plan Loop | Graph governs cell method; track documents retain dependencies/proof; new scope may need flow revision | Memory holds requirements/dependencies; coordinator chooses cells and selectively invalidates affected proof | Closest to raw master; depends on index/current-cell quality and checkpoint discipline |
| Initially unclear Advisory | Requires investigation/reframe loops and usable specialist extension | Investigate competing hypotheses, change framing, then select RFC/NGT/review when useful | Natural prompt behavior; fresh masters may lack sufficient recorded rationale |
| Crash/resume | Restore invocation, graph version, grants, obligations; reasoning memory still needed | Replay effects, load checkpoint at event cursor, reconcile unknown outcomes, then choose next step | Restore receipts/documents; larger risk of missing or mismatched checkpoints |
| Malicious/overreaching worker | Graph cannot protect filesystem; broker/isolation still required | Attenuated worker grant; no coordinator credential, ledger write, or sibling access | Same protection required as B; no inherited bypass tools |

B examples at the judgment boundary:

- Code Panel discovers an unexpected compatibility concern. The coordinator
  recruits a read-only specialist with only relevant context. After a fix, old
  reviews remain historical but cannot certify the new candidate.
- A later Plan Loop phase disproves an earlier assumption. The coordinator records
  why prior proof no longer satisfies a requirement and reopens only affected
  work, without resetting the track.
- Advisory evidence points to CI rather than orchestration. The coordinator
  abandons the new-orchestrator hypothesis, records why, and investigates the
  actual bottleneck.

| Additional use case | Specific doctrine | Shared substrate |
|---|---|---|
| RFC review | Proposal, objections, responses, amendments | Bounded assignments, reveal, revision lineage |
| Research | Question decomposition, source comparison, contradiction resolution | Context grants, evidence refs, specialist, budget |
| Delphi | Private first pass, controlled feedback, reassessment | Sealed submissions, filtered publication, invocation lineage |
| NGT | Independent idea generation, clarification, ranking | Artifacts, controlled reveal, optional validator/scorer |
| Advisory | Investigation, reframing, alternatives, decision dialogue | Same primitives plus separate human authority |

Delphi anonymity needs its own assurance definition: removing identity metadata
does not prove that prose/content cannot identify an author.

| Criterion | A | B | C |
|---|---|---|---|
| Initial migration cost | Lowest | Medium–high | Low UX cost; containment remains substantial |
| Unanticipated method | Limited by extension surface | Natural inside envelope | Natural in prompt |
| Authority/effect audit | Good with real containment | Good with real containment | Good if broker has no bypass |
| Rationale resume | Must be added | Central design element | Playbook-dependent |
| Cross-domain reuse | Risk of multiplying graphs | High | Risk of duplicated skill logic |
| Rigidity recurrence | Growing graph | Cognitive semantics absorbed into envelope/actions | Templates become mandatory ceremony |
```

### Full target shown text

```text
## 5. Comparative walkthrough and trade-offs

| Scenario | A — Improved Flow | B — Envelope | C — Master + broker |
|---|---|---|---|
| Code Panel | Doer then review/red-team; conditional fixer/recheck; candidate obligations gate close | Seal candidate; dispatch two independent reviews; recruit specialist or fix from findings | Master follows the same method through tools; playbook owns candidate/review tracking |
| Multi-phase Plan Loop | Graph governs cell method; track documents retain dependencies/proof; new scope may need flow revision | Memory holds requirements/dependencies; coordinator chooses cells and selectively invalidates affected proof | Closest to raw master; depends on index/current-cell quality and checkpoint discipline |
| Initially unclear Advisory | Requires investigation/reframe loops and usable specialist extension | Investigate competing hypotheses, change framing, then select RFC/NGT/review when useful | Natural prompt behavior; fresh masters may lack sufficient recorded rationale |
| Crash/resume | Restore invocation, graph version, grants, obligations; reasoning memory still needed | Replay effects, load checkpoint at event cursor, reconcile unknown outcomes, then choose next step | Restore receipts/documents; larger risk of missing or mismatched checkpoints |
| Malicious/overreaching worker | Graph cannot protect filesystem; broker/isolation still required | Attenuated worker grant; no coordinator credential, ledger write, or sibling access | Same protection required as B; no inherited bypass tools |

B examples at the judgment boundary:

- Code Panel discovers an unexpected compatibility concern. The coordinator
  recruits a read-only specialist with only relevant context. After a fix, old
  reviews remain historical but cannot certify the new candidate.
- A later Plan Loop phase disproves an earlier assumption. The coordinator records
  why prior proof no longer satisfies a requirement and reopens only affected
  work, without resetting the track.
- Advisory evidence points to CI rather than orchestration. The coordinator
  abandons the new-orchestrator hypothesis, records why, and investigates the
  actual bottleneck.

| Additional use case | Specific doctrine | Shared substrate |
|---|---|---|
| RFC review | Proposal, objections, responses, amendments | Bounded assignments, reveal, revision lineage |
| Research | Question decomposition, source comparison, contradiction resolution | Context grants, evidence refs, specialist, budget |
| Delphi | Private first pass, controlled feedback, reassessment | Sealed submissions, filtered publication, invocation lineage |
| NGT | Independent idea generation, clarification, ranking | Artifacts, controlled reveal, optional validator/scorer |
| Advisory | Investigation, reframing, alternatives, decision dialogue | Same primitives plus separate human authority |

Delphi anonymity needs its own assurance definition: removing identity metadata
does not prove that prose/content cannot identify an author.

| Criterion | A | B | C |
|---|---|---|---|
| Initial migration cost | Lowest | Medium–high | Low UX cost; containment remains substantial |
| Unanticipated method | Limited by extension surface | Natural inside envelope | Natural in prompt |
| Authority/effect audit | Good with real containment | Good with real containment | Good if broker has no bypass |
| Rationale resume | Must be added | Central design element | Playbook-dependent |
| Cross-domain reuse | Risk of multiplying graphs | High | Risk of duplicated skill logic |
| Rigidity recurrence | Growing graph | Cognitive semantics absorbed into envelope/actions | Templates become mandatory ceremony |
```

## claim_0a3a3ccd8405605e50e793ab172c6202

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-28, lines 172–178.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-31.
Source digest: a1639fde1101016cee51128e70c2b189620e44f1ede18fbdf806fc215c04c92c
Target digest: a1639fde1101016cee51128e70c2b189620e44f1ede18fbdf806fc215c04c92c
Shown source SHA256: a1639fde1101016cee51128e70c2b189620e44f1ede18fbdf806fc215c04c92c
Shown target SHA256: a1639fde1101016cee51128e70c2b189620e44f1ede18fbdf806fc215c04c92c

### Proposed decision

```json
{
  "claimId": "claim_0a3a3ccd8405605e50e793ab172c6202",
  "sourceUnitDigest": "a1639fde1101016cee51128e70c2b189620e44f1ede18fbdf806fc215c04c92c",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "a1639fde1101016cee51128e70c2b189620e44f1ede18fbdf806fc215c04c92c",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "5. Comparative walkthrough and trade-offs"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-28 (lines 172–178) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-31 (lines 199–205); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Scenario | A — Improved Flow | B — Envelope | C — Master + broker |
|---|---|---|---|
| Code Panel | Doer then review/red-team; conditional fixer/recheck; candidate obligations gate close | Seal candidate; dispatch two independent reviews; recruit specialist or fix from findings | Master follows the same method through tools; playbook owns candidate/review tracking |
| Multi-phase Plan Loop | Graph governs cell method; track documents retain dependencies/proof; new scope may need flow revision | Memory holds requirements/dependencies; coordinator chooses cells and selectively invalidates affected proof | Closest to raw master; depends on index/current-cell quality and checkpoint discipline |
| Initially unclear Advisory | Requires investigation/reframe loops and usable specialist extension | Investigate competing hypotheses, change framing, then select RFC/NGT/review when useful | Natural prompt behavior; fresh masters may lack sufficient recorded rationale |
| Crash/resume | Restore invocation, graph version, grants, obligations; reasoning memory still needed | Replay effects, load checkpoint at event cursor, reconcile unknown outcomes, then choose next step | Restore receipts/documents; larger risk of missing or mismatched checkpoints |
| Malicious/overreaching worker | Graph cannot protect filesystem; broker/isolation still required | Attenuated worker grant; no coordinator credential, ledger write, or sibling access | Same protection required as B; no inherited bypass tools |
```

### Full target shown text

```text
| Scenario | A — Improved Flow | B — Envelope | C — Master + broker |
|---|---|---|---|
| Code Panel | Doer then review/red-team; conditional fixer/recheck; candidate obligations gate close | Seal candidate; dispatch two independent reviews; recruit specialist or fix from findings | Master follows the same method through tools; playbook owns candidate/review tracking |
| Multi-phase Plan Loop | Graph governs cell method; track documents retain dependencies/proof; new scope may need flow revision | Memory holds requirements/dependencies; coordinator chooses cells and selectively invalidates affected proof | Closest to raw master; depends on index/current-cell quality and checkpoint discipline |
| Initially unclear Advisory | Requires investigation/reframe loops and usable specialist extension | Investigate competing hypotheses, change framing, then select RFC/NGT/review when useful | Natural prompt behavior; fresh masters may lack sufficient recorded rationale |
| Crash/resume | Restore invocation, graph version, grants, obligations; reasoning memory still needed | Replay effects, load checkpoint at event cursor, reconcile unknown outcomes, then choose next step | Restore receipts/documents; larger risk of missing or mismatched checkpoints |
| Malicious/overreaching worker | Graph cannot protect filesystem; broker/isolation still required | Attenuated worker grant; no coordinator credential, ledger write, or sibling access | Same protection required as B; no inherited bypass tools |
```

## claim_2371962d49dde1980ee84acee0526fe9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-29, lines 180–180.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-32.
Source digest: 59748c90cb22ce9beeb2143492c795e9ca3d36442ea791e819fd0646ae8ef169
Target digest: 59748c90cb22ce9beeb2143492c795e9ca3d36442ea791e819fd0646ae8ef169
Shown source SHA256: 59748c90cb22ce9beeb2143492c795e9ca3d36442ea791e819fd0646ae8ef169
Shown target SHA256: 59748c90cb22ce9beeb2143492c795e9ca3d36442ea791e819fd0646ae8ef169

### Proposed decision

```json
{
  "claimId": "claim_2371962d49dde1980ee84acee0526fe9",
  "sourceUnitDigest": "59748c90cb22ce9beeb2143492c795e9ca3d36442ea791e819fd0646ae8ef169",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "59748c90cb22ce9beeb2143492c795e9ca3d36442ea791e819fd0646ae8ef169",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "5. Comparative walkthrough and trade-offs"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-29 (lines 180–180) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-32 (lines 207–207); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
B examples at the judgment boundary:
```

### Full target shown text

```text
B examples at the judgment boundary:
```

## claim_4464d719aa53b9b03c57d8ad116729d2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-30, lines 182–190.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-33.
Source digest: a06bc6ddf7e4d4c625a567ac49bde91e4c2beded0c4b6935d57da290ec24a1a9
Target digest: a06bc6ddf7e4d4c625a567ac49bde91e4c2beded0c4b6935d57da290ec24a1a9
Shown source SHA256: a06bc6ddf7e4d4c625a567ac49bde91e4c2beded0c4b6935d57da290ec24a1a9
Shown target SHA256: a06bc6ddf7e4d4c625a567ac49bde91e4c2beded0c4b6935d57da290ec24a1a9

### Proposed decision

```json
{
  "claimId": "claim_4464d719aa53b9b03c57d8ad116729d2",
  "sourceUnitDigest": "a06bc6ddf7e4d4c625a567ac49bde91e4c2beded0c4b6935d57da290ec24a1a9",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "a06bc6ddf7e4d4c625a567ac49bde91e4c2beded0c4b6935d57da290ec24a1a9",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "5. Comparative walkthrough and trade-offs"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-30 (lines 182–190) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-33 (lines 209–217); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Code Panel discovers an unexpected compatibility concern. The coordinator
  recruits a read-only specialist with only relevant context. After a fix, old
  reviews remain historical but cannot certify the new candidate.
- A later Plan Loop phase disproves an earlier assumption. The coordinator records
  why prior proof no longer satisfies a requirement and reopens only affected
  work, without resetting the track.
- Advisory evidence points to CI rather than orchestration. The coordinator
  abandons the new-orchestrator hypothesis, records why, and investigates the
  actual bottleneck.
```

### Full target shown text

```text
- Code Panel discovers an unexpected compatibility concern. The coordinator
  recruits a read-only specialist with only relevant context. After a fix, old
  reviews remain historical but cannot certify the new candidate.
- A later Plan Loop phase disproves an earlier assumption. The coordinator records
  why prior proof no longer satisfies a requirement and reopens only affected
  work, without resetting the track.
- Advisory evidence points to CI rather than orchestration. The coordinator
  abandons the new-orchestrator hypothesis, records why, and investigates the
  actual bottleneck.
```

## claim_aa9a48577e193c9c964758af707b7450

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-31, lines 192–198.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-34.
Source digest: 0f59d477f67b7c7cc00c52667d89427a2d590486b60ead3fd7487432d18825dd
Target digest: 0f59d477f67b7c7cc00c52667d89427a2d590486b60ead3fd7487432d18825dd
Shown source SHA256: 0f59d477f67b7c7cc00c52667d89427a2d590486b60ead3fd7487432d18825dd
Shown target SHA256: 0f59d477f67b7c7cc00c52667d89427a2d590486b60ead3fd7487432d18825dd

### Proposed decision

```json
{
  "claimId": "claim_aa9a48577e193c9c964758af707b7450",
  "sourceUnitDigest": "0f59d477f67b7c7cc00c52667d89427a2d590486b60ead3fd7487432d18825dd",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "0f59d477f67b7c7cc00c52667d89427a2d590486b60ead3fd7487432d18825dd",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "5. Comparative walkthrough and trade-offs"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-31 (lines 192–198) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-34 (lines 219–225); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Additional use case | Specific doctrine | Shared substrate |
|---|---|---|
| RFC review | Proposal, objections, responses, amendments | Bounded assignments, reveal, revision lineage |
| Research | Question decomposition, source comparison, contradiction resolution | Context grants, evidence refs, specialist, budget |
| Delphi | Private first pass, controlled feedback, reassessment | Sealed submissions, filtered publication, invocation lineage |
| NGT | Independent idea generation, clarification, ranking | Artifacts, controlled reveal, optional validator/scorer |
| Advisory | Investigation, reframing, alternatives, decision dialogue | Same primitives plus separate human authority |
```

### Full target shown text

```text
| Additional use case | Specific doctrine | Shared substrate |
|---|---|---|
| RFC review | Proposal, objections, responses, amendments | Bounded assignments, reveal, revision lineage |
| Research | Question decomposition, source comparison, contradiction resolution | Context grants, evidence refs, specialist, budget |
| Delphi | Private first pass, controlled feedback, reassessment | Sealed submissions, filtered publication, invocation lineage |
| NGT | Independent idea generation, clarification, ranking | Artifacts, controlled reveal, optional validator/scorer |
| Advisory | Investigation, reframing, alternatives, decision dialogue | Same primitives plus separate human authority |
```

## claim_6ca5923306b2cee5dd3e029fe61a637f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-32, lines 200–201.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-35.
Source digest: a3b35de075e2f48fd2d1c3575f8cc6a1ae5502e60cce92e4c25515d49df47841
Target digest: a3b35de075e2f48fd2d1c3575f8cc6a1ae5502e60cce92e4c25515d49df47841
Shown source SHA256: a3b35de075e2f48fd2d1c3575f8cc6a1ae5502e60cce92e4c25515d49df47841
Shown target SHA256: a3b35de075e2f48fd2d1c3575f8cc6a1ae5502e60cce92e4c25515d49df47841

### Proposed decision

```json
{
  "claimId": "claim_6ca5923306b2cee5dd3e029fe61a637f",
  "sourceUnitDigest": "a3b35de075e2f48fd2d1c3575f8cc6a1ae5502e60cce92e4c25515d49df47841",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "a3b35de075e2f48fd2d1c3575f8cc6a1ae5502e60cce92e4c25515d49df47841",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "5. Comparative walkthrough and trade-offs"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-32 (lines 200–201) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-35 (lines 227–228); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Delphi anonymity needs its own assurance definition: removing identity metadata
does not prove that prose/content cannot identify an author.
```

### Full target shown text

```text
Delphi anonymity needs its own assurance definition: removing identity metadata
does not prove that prose/content cannot identify an author.
```

## claim_69d7c46251d8ecca8850138166449c66

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-33, lines 203–210.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-36.
Source digest: 459f039832924b2b2d25e1cb8f44573cb7bdcdec848ff99d4dbb627282db8a8d
Target digest: 459f039832924b2b2d25e1cb8f44573cb7bdcdec848ff99d4dbb627282db8a8d
Shown source SHA256: 459f039832924b2b2d25e1cb8f44573cb7bdcdec848ff99d4dbb627282db8a8d
Shown target SHA256: 459f039832924b2b2d25e1cb8f44573cb7bdcdec848ff99d4dbb627282db8a8d

### Proposed decision

```json
{
  "claimId": "claim_69d7c46251d8ecca8850138166449c66",
  "sourceUnitDigest": "459f039832924b2b2d25e1cb8f44573cb7bdcdec848ff99d4dbb627282db8a8d",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "459f039832924b2b2d25e1cb8f44573cb7bdcdec848ff99d4dbb627282db8a8d",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "5. Comparative walkthrough and trade-offs"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-33 (lines 203–210) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-36 (lines 230–237); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Criterion | A | B | C |
|---|---|---|---|
| Initial migration cost | Lowest | Medium–high | Low UX cost; containment remains substantial |
| Unanticipated method | Limited by extension surface | Natural inside envelope | Natural in prompt |
| Authority/effect audit | Good with real containment | Good with real containment | Good if broker has no bypass |
| Rationale resume | Must be added | Central design element | Playbook-dependent |
| Cross-domain reuse | Risk of multiplying graphs | High | Risk of duplicated skill logic |
| Rigidity recurrence | Growing graph | Cognitive semantics absorbed into envelope/actions | Templates become mandatory ceremony |
```

### Full target shown text

```text
| Criterion | A | B | C |
|---|---|---|---|
| Initial migration cost | Lowest | Medium–high | Low UX cost; containment remains substantial |
| Unanticipated method | Limited by extension surface | Natural inside envelope | Natural in prompt |
| Authority/effect audit | Good with real containment | Good with real containment | Good if broker has no bypass |
| Rationale resume | Must be added | Central design element | Playbook-dependent |
| Cross-domain reuse | Risk of multiplying graphs | High | Risk of duplicated skill logic |
| Rigidity recurrence | Growing graph | Cognitive semantics absorbed into envelope/actions | Templates become mandatory ceremony |
```

## claim_6c4e483a2bddbd858f1b93a3dafbd065

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#6-structured-debate, lines 212–212.
Target: docs/platform/proposals/coordination-capability-envelope.md#6-structured-debate.
Source digest: f2c27ea91ff22052c9265ac06b80f79f3486e9b6f9166d02f68d0d78d72111b1
Target digest: f2c27ea91ff22052c9265ac06b80f79f3486e9b6f9166d02f68d0d78d72111b1
Shown source SHA256: d80fc2749c6fc309923841ddfefb1238795e054a02b4e35142c0737360bc0b94
Shown target SHA256: d80fc2749c6fc309923841ddfefb1238795e054a02b4e35142c0737360bc0b94

### Proposed decision

```json
{
  "claimId": "claim_6c4e483a2bddbd858f1b93a3dafbd065",
  "sourceUnitDigest": "f2c27ea91ff22052c9265ac06b80f79f3486e9b6f9166d02f68d0d78d72111b1",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "6-structured-debate",
  "targetUnitDigest": "f2c27ea91ff22052c9265ac06b80f79f3486e9b6f9166d02f68d0d78d72111b1",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#6-structured-debate (lines 212–212) is carried at docs/platform/proposals/coordination-capability-envelope.md#6-structured-debate (lines 239–239); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 6. Structured debate

| Objection | Response | Unresolved concern |
|---|---|---|
| A to B: soft sequence lets the coordinator forget review | Hard obligations preserve required review; soft sequence allows different ways to fulfill it | Obligation creation/waiver authority must be explicit |
| B to A: every unknown needs a graph author | A can offer bounded extension regions | Predeclaring every specialty/operation preserves the original problem |
| C to B: envelope is a workflow engine under another name | Actions describe effects, not reframe/debate/Delphi enums | Use cases may steadily demand cognitive fields in kernel schemas |
| B to C: Markdown resume loses obligations | C can retain checkpoints and trustworthy receipts | Prose-only obligations cannot reliably prevent omission |
| A/C to B: added complexity has not proved faster shipping | Measure consuming-project authoring effort, human intervention, and output quality | No equal-budget live comparison yet |
| All: containment reduces provider portability | Adapters declare proven capabilities and refuse incompatible grants | Some providers/hosts cannot satisfy the requested envelope |
| All: the coordinator can still judge incorrectly | Runtime protects sources and rights; doctrine/review improve judgment | No architecture proves arbitrary semantic conclusions correct |

B's most important rigidity failure mode is a general policy language that
absorbs the whole cognitive method. If adding a counterfactual critic requires a
kernel schema change, the boundary has drifted.
```

### Full target shown text

```text
## 6. Structured debate

| Objection | Response | Unresolved concern |
|---|---|---|
| A to B: soft sequence lets the coordinator forget review | Hard obligations preserve required review; soft sequence allows different ways to fulfill it | Obligation creation/waiver authority must be explicit |
| B to A: every unknown needs a graph author | A can offer bounded extension regions | Predeclaring every specialty/operation preserves the original problem |
| C to B: envelope is a workflow engine under another name | Actions describe effects, not reframe/debate/Delphi enums | Use cases may steadily demand cognitive fields in kernel schemas |
| B to C: Markdown resume loses obligations | C can retain checkpoints and trustworthy receipts | Prose-only obligations cannot reliably prevent omission |
| A/C to B: added complexity has not proved faster shipping | Measure consuming-project authoring effort, human intervention, and output quality | No equal-budget live comparison yet |
| All: containment reduces provider portability | Adapters declare proven capabilities and refuse incompatible grants | Some providers/hosts cannot satisfy the requested envelope |
| All: the coordinator can still judge incorrectly | Runtime protects sources and rights; doctrine/review improve judgment | No architecture proves arbitrary semantic conclusions correct |

B's most important rigidity failure mode is a general policy language that
absorbs the whole cognitive method. If adding a counterfactual critic requires a
kernel schema change, the boundary has drifted.
```

## claim_c3eae72a9458bc8bf1af80410045b72a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-34, lines 214–222.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-37.
Source digest: ad1dd9eabc8e823b41327591db15225ab5b13970fffcc4aa3f5dd66d954f446d
Target digest: ad1dd9eabc8e823b41327591db15225ab5b13970fffcc4aa3f5dd66d954f446d
Shown source SHA256: ad1dd9eabc8e823b41327591db15225ab5b13970fffcc4aa3f5dd66d954f446d
Shown target SHA256: ad1dd9eabc8e823b41327591db15225ab5b13970fffcc4aa3f5dd66d954f446d

### Proposed decision

```json
{
  "claimId": "claim_c3eae72a9458bc8bf1af80410045b72a",
  "sourceUnitDigest": "ad1dd9eabc8e823b41327591db15225ab5b13970fffcc4aa3f5dd66d954f446d",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "ad1dd9eabc8e823b41327591db15225ab5b13970fffcc4aa3f5dd66d954f446d",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "6. Structured debate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-34 (lines 214–222) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-37 (lines 241–249); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Objection | Response | Unresolved concern |
|---|---|---|
| A to B: soft sequence lets the coordinator forget review | Hard obligations preserve required review; soft sequence allows different ways to fulfill it | Obligation creation/waiver authority must be explicit |
| B to A: every unknown needs a graph author | A can offer bounded extension regions | Predeclaring every specialty/operation preserves the original problem |
| C to B: envelope is a workflow engine under another name | Actions describe effects, not reframe/debate/Delphi enums | Use cases may steadily demand cognitive fields in kernel schemas |
| B to C: Markdown resume loses obligations | C can retain checkpoints and trustworthy receipts | Prose-only obligations cannot reliably prevent omission |
| A/C to B: added complexity has not proved faster shipping | Measure consuming-project authoring effort, human intervention, and output quality | No equal-budget live comparison yet |
| All: containment reduces provider portability | Adapters declare proven capabilities and refuse incompatible grants | Some providers/hosts cannot satisfy the requested envelope |
| All: the coordinator can still judge incorrectly | Runtime protects sources and rights; doctrine/review improve judgment | No architecture proves arbitrary semantic conclusions correct |
```

### Full target shown text

```text
| Objection | Response | Unresolved concern |
|---|---|---|
| A to B: soft sequence lets the coordinator forget review | Hard obligations preserve required review; soft sequence allows different ways to fulfill it | Obligation creation/waiver authority must be explicit |
| B to A: every unknown needs a graph author | A can offer bounded extension regions | Predeclaring every specialty/operation preserves the original problem |
| C to B: envelope is a workflow engine under another name | Actions describe effects, not reframe/debate/Delphi enums | Use cases may steadily demand cognitive fields in kernel schemas |
| B to C: Markdown resume loses obligations | C can retain checkpoints and trustworthy receipts | Prose-only obligations cannot reliably prevent omission |
| A/C to B: added complexity has not proved faster shipping | Measure consuming-project authoring effort, human intervention, and output quality | No equal-budget live comparison yet |
| All: containment reduces provider portability | Adapters declare proven capabilities and refuse incompatible grants | Some providers/hosts cannot satisfy the requested envelope |
| All: the coordinator can still judge incorrectly | Runtime protects sources and rights; doctrine/review improve judgment | No architecture proves arbitrary semantic conclusions correct |
```

## claim_50fd0c873ff55f20f510c61152c13a76

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-35, lines 224–226.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-38.
Source digest: 6c55ba9016884e07a53a28dac06aef8386771b3a2c8472a387a084787059aacd
Target digest: 6c55ba9016884e07a53a28dac06aef8386771b3a2c8472a387a084787059aacd
Shown source SHA256: 6c55ba9016884e07a53a28dac06aef8386771b3a2c8472a387a084787059aacd
Shown target SHA256: 6c55ba9016884e07a53a28dac06aef8386771b3a2c8472a387a084787059aacd

### Proposed decision

```json
{
  "claimId": "claim_50fd0c873ff55f20f510c61152c13a76",
  "sourceUnitDigest": "6c55ba9016884e07a53a28dac06aef8386771b3a2c8472a387a084787059aacd",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "6c55ba9016884e07a53a28dac06aef8386771b3a2c8472a387a084787059aacd",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "6. Structured debate"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-35 (lines 224–226) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-38 (lines 251–253); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
B's most important rigidity failure mode is a general policy language that
absorbs the whole cognitive method. If adding a counterfactual critic requires a
kernel schema change, the boundary has drifted.
```

### Full target shown text

```text
B's most important rigidity failure mode is a general policy language that
absorbs the whole cognitive method. If adding a counterfactual critic requires a
kernel schema change, the boundary has drifted.
```

## claim_811538806e1ed4e390136f00ade8a03d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#7-recommendation-and-reversal-conditions, lines 228–228.
Target: docs/platform/proposals/coordination-capability-envelope.md#7-recommendation-and-reversal-conditions.
Source digest: 5b4364f6620caa1faab1760178302653b50c0e7b33a23fa146459cf40adfdab9
Target digest: 5b4364f6620caa1faab1760178302653b50c0e7b33a23fa146459cf40adfdab9
Shown source SHA256: 84ea01bcd2d180415892d5429ce7d4bb225534cccb65e2db9b35d2ce34d2dc77
Shown target SHA256: 84ea01bcd2d180415892d5429ce7d4bb225534cccb65e2db9b35d2ce34d2dc77

### Proposed decision

```json
{
  "claimId": "claim_811538806e1ed4e390136f00ade8a03d",
  "sourceUnitDigest": "5b4364f6620caa1faab1760178302653b50c0e7b33a23fa146459cf40adfdab9",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "7-recommendation-and-reversal-conditions",
  "targetUnitDigest": "5b4364f6620caa1faab1760178302653b50c0e7b33a23fa146459cf40adfdab9",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#7-recommendation-and-reversal-conditions (lines 228–228) is carried at docs/platform/proposals/coordination-capability-envelope.md#7-recommendation-and-reversal-conditions (lines 255–255); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 7. Recommendation and reversal conditions

Choose B as the target, use A's corrections to preserve current capability, and
use C's prompt/skill experience as the coordinator-facing operating surface.
These are not three execution engines.

Compared with the current harness, B permits unanticipated bounded work without
graph authoring. Compared with a raw prompt, it subjects that work to authority,
budget, isolation, evidence, and durable execution controls. This is a conceptual
responsibility advantage; quality and operating-cost advantage remain empirical.

Reverse or narrow the recommendation if:

- Real use cases fit a few reusable flows naturally without kernel edits or
  recurring escape hatches: A may be sufficient as the target.
- A minimal broker plus artifacts matches B on resume, omission, and integration
  effort across unlike use cases: C may be sufficient.
- An adapter cannot enforce isolation: narrow supported deployment, not the
  meaning of secure containment.
- Multiple agents do not improve quality enough for their cost: reduce default
  fan-out rather than treating team size as a product achievement.

The proposed threat model changes the accepted
[Routing Handoff Contract](../../routing-handoff-contract.md). Acceptance requires
explicit reconciliation/supersession of affected decisions and contracts, not
silently relabeling existing same-user execution. No locked law is changed here.
```

### Full target shown text

```text
## 7. Recommendation and reversal conditions

Choose B as the target, use A's corrections to preserve current capability, and
use C's prompt/skill experience as the coordinator-facing operating surface.
These are not three execution engines.

Compared with the current harness, B permits unanticipated bounded work without
graph authoring. Compared with a raw prompt, it subjects that work to authority,
budget, isolation, evidence, and durable execution controls. This is a conceptual
responsibility advantage; quality and operating-cost advantage remain empirical.

Reverse or narrow the recommendation if:

- Real use cases fit a few reusable flows naturally without kernel edits or
  recurring escape hatches: A may be sufficient as the target.
- A minimal broker plus artifacts matches B on resume, omission, and integration
  effort across unlike use cases: C may be sufficient.
- An adapter cannot enforce isolation: narrow supported deployment, not the
  meaning of secure containment.
- Multiple agents do not improve quality enough for their cost: reduce default
  fan-out rather than treating team size as a product achievement.

The proposed threat model changes the accepted
[Routing Handoff Contract](../../routing-handoff-contract.md). Acceptance requires
explicit reconciliation/supersession of affected decisions and contracts, not
silently relabeling existing same-user execution. No locked law is changed here.
```

## claim_7464ca1b7f4f2b9375802d9551bcf9de

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-36, lines 230–232.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-39.
Source digest: a7398f340897f2b9eb71bae3bb8450fa8e0613bc4850f4b2797487aef2ef40f1
Target digest: a7398f340897f2b9eb71bae3bb8450fa8e0613bc4850f4b2797487aef2ef40f1
Shown source SHA256: a7398f340897f2b9eb71bae3bb8450fa8e0613bc4850f4b2797487aef2ef40f1
Shown target SHA256: a7398f340897f2b9eb71bae3bb8450fa8e0613bc4850f4b2797487aef2ef40f1

### Proposed decision

```json
{
  "claimId": "claim_7464ca1b7f4f2b9375802d9551bcf9de",
  "sourceUnitDigest": "a7398f340897f2b9eb71bae3bb8450fa8e0613bc4850f4b2797487aef2ef40f1",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "a7398f340897f2b9eb71bae3bb8450fa8e0613bc4850f4b2797487aef2ef40f1",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "7. Recommendation and reversal conditions"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-36 (lines 230–232) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-39 (lines 257–259); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Choose B as the target, use A's corrections to preserve current capability, and
use C's prompt/skill experience as the coordinator-facing operating surface.
These are not three execution engines.
```

### Full target shown text

```text
Choose B as the target, use A's corrections to preserve current capability, and
use C's prompt/skill experience as the coordinator-facing operating surface.
These are not three execution engines.
```

## claim_177c68ba085b0faf30360f2ffe7dfee1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-37, lines 234–237.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-40.
Source digest: 41137bae8477390167b9e26f4d11af62af6afb06b6a9b130b8724610d2f3c3e3
Target digest: 41137bae8477390167b9e26f4d11af62af6afb06b6a9b130b8724610d2f3c3e3
Shown source SHA256: 41137bae8477390167b9e26f4d11af62af6afb06b6a9b130b8724610d2f3c3e3
Shown target SHA256: 41137bae8477390167b9e26f4d11af62af6afb06b6a9b130b8724610d2f3c3e3

### Proposed decision

```json
{
  "claimId": "claim_177c68ba085b0faf30360f2ffe7dfee1",
  "sourceUnitDigest": "41137bae8477390167b9e26f4d11af62af6afb06b6a9b130b8724610d2f3c3e3",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "41137bae8477390167b9e26f4d11af62af6afb06b6a9b130b8724610d2f3c3e3",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "7. Recommendation and reversal conditions"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-37 (lines 234–237) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-40 (lines 261–264); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Compared with the current harness, B permits unanticipated bounded work without
graph authoring. Compared with a raw prompt, it subjects that work to authority,
budget, isolation, evidence, and durable execution controls. This is a conceptual
responsibility advantage; quality and operating-cost advantage remain empirical.
```

### Full target shown text

```text
Compared with the current harness, B permits unanticipated bounded work without
graph authoring. Compared with a raw prompt, it subjects that work to authority,
budget, isolation, evidence, and durable execution controls. This is a conceptual
responsibility advantage; quality and operating-cost advantage remain empirical.
```

## claim_d9abd54fc0bff47b9c8c526354e5611a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-38, lines 239–239.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-41.
Source digest: d773b5fea750fd1f6ea657bac85d9c73398260b05c318fdabe78e42c4bd6e761
Target digest: d773b5fea750fd1f6ea657bac85d9c73398260b05c318fdabe78e42c4bd6e761
Shown source SHA256: d773b5fea750fd1f6ea657bac85d9c73398260b05c318fdabe78e42c4bd6e761
Shown target SHA256: d773b5fea750fd1f6ea657bac85d9c73398260b05c318fdabe78e42c4bd6e761

### Proposed decision

```json
{
  "claimId": "claim_d9abd54fc0bff47b9c8c526354e5611a",
  "sourceUnitDigest": "d773b5fea750fd1f6ea657bac85d9c73398260b05c318fdabe78e42c4bd6e761",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "d773b5fea750fd1f6ea657bac85d9c73398260b05c318fdabe78e42c4bd6e761",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "7. Recommendation and reversal conditions"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-38 (lines 239–239) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-41 (lines 266–266); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Reverse or narrow the recommendation if:
```

### Full target shown text

```text
Reverse or narrow the recommendation if:
```

## claim_67406ba3ad743c7d240b75ee5b96bacb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-39, lines 241–248.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-42.
Source digest: a9ea3880190fd2c9a811cb9ed72e1a1e2f0342a82d102423c91e29bf0e3264d3
Target digest: a9ea3880190fd2c9a811cb9ed72e1a1e2f0342a82d102423c91e29bf0e3264d3
Shown source SHA256: a9ea3880190fd2c9a811cb9ed72e1a1e2f0342a82d102423c91e29bf0e3264d3
Shown target SHA256: a9ea3880190fd2c9a811cb9ed72e1a1e2f0342a82d102423c91e29bf0e3264d3

### Proposed decision

```json
{
  "claimId": "claim_67406ba3ad743c7d240b75ee5b96bacb",
  "sourceUnitDigest": "a9ea3880190fd2c9a811cb9ed72e1a1e2f0342a82d102423c91e29bf0e3264d3",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "a9ea3880190fd2c9a811cb9ed72e1a1e2f0342a82d102423c91e29bf0e3264d3",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "7. Recommendation and reversal conditions"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-39 (lines 241–248) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-42 (lines 268–275); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Real use cases fit a few reusable flows naturally without kernel edits or
  recurring escape hatches: A may be sufficient as the target.
- A minimal broker plus artifacts matches B on resume, omission, and integration
  effort across unlike use cases: C may be sufficient.
- An adapter cannot enforce isolation: narrow supported deployment, not the
  meaning of secure containment.
- Multiple agents do not improve quality enough for their cost: reduce default
  fan-out rather than treating team size as a product achievement.
```

### Full target shown text

```text
- Real use cases fit a few reusable flows naturally without kernel edits or
  recurring escape hatches: A may be sufficient as the target.
- A minimal broker plus artifacts matches B on resume, omission, and integration
  effort across unlike use cases: C may be sufficient.
- An adapter cannot enforce isolation: narrow supported deployment, not the
  meaning of secure containment.
- Multiple agents do not improve quality enough for their cost: reduce default
  fan-out rather than treating team size as a product achievement.
```

## claim_08ce73390cb135225e26376d61a3c2c0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-40, lines 250–253.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-43.
Source digest: 1dcc99a8d286c2a7810ab416e8252315a28c7ff47fa6f257e1cb992980b4eb1a
Target digest: 1dcc99a8d286c2a7810ab416e8252315a28c7ff47fa6f257e1cb992980b4eb1a
Shown source SHA256: 1dcc99a8d286c2a7810ab416e8252315a28c7ff47fa6f257e1cb992980b4eb1a
Shown target SHA256: 1dcc99a8d286c2a7810ab416e8252315a28c7ff47fa6f257e1cb992980b4eb1a

### Proposed decision

```json
{
  "claimId": "claim_08ce73390cb135225e26376d61a3c2c0",
  "sourceUnitDigest": "1dcc99a8d286c2a7810ab416e8252315a28c7ff47fa6f257e1cb992980b4eb1a",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "1dcc99a8d286c2a7810ab416e8252315a28c7ff47fa6f257e1cb992980b4eb1a",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "7. Recommendation and reversal conditions"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-40 (lines 250–253) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-43 (lines 277–280); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The proposed threat model changes the accepted
[Routing Handoff Contract](../../routing-handoff-contract.md). Acceptance requires
explicit reconciliation/supersession of affected decisions and contracts, not
silently relabeling existing same-user execution. No locked law is changed here.
```

### Full target shown text

```text
The proposed threat model changes the accepted
[Routing Handoff Contract](../../routing-handoff-contract.md). Acceptance requires
explicit reconciliation/supersession of affected decisions and contracts, not
silently relabeling existing same-user execution. No locked law is changed here.
```

## claim_282b6362035c0d1bc2db4ba997a1870f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#8-conceptual-model, lines 255–255.
Target: docs/platform/proposals/coordination-capability-envelope.md#8-conceptual-model.
Source digest: fd89b54b16e062842cb8842a516508ad64d6a8e1492ecfbd208af47d288e5de1
Target digest: fd89b54b16e062842cb8842a516508ad64d6a8e1492ecfbd208af47d288e5de1
Shown source SHA256: db8bb44a404631e03387690fb31138739fb76c31d25a177a0b282b02bc7020dd
Shown target SHA256: db8bb44a404631e03387690fb31138739fb76c31d25a177a0b282b02bc7020dd

### Proposed decision

```json
{
  "claimId": "claim_282b6362035c0d1bc2db4ba997a1870f",
  "sourceUnitDigest": "fd89b54b16e062842cb8842a516508ad64d6a8e1492ecfbd208af47d288e5de1",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "8-conceptual-model",
  "targetUnitDigest": "fd89b54b16e062842cb8842a516508ad64d6a8e1492ecfbd208af47d288e5de1",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#8-conceptual-model (lines 255–255) is carried at docs/platform/proposals/coordination-capability-envelope.md#8-conceptual-model (lines 282–282); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 8. Conceptual model
```

### Full target shown text

```text
## 8. Conceptual model
```

## claim_23cc21f91ef2f127ecfe350334db49ed

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#coordinator-soul, lines 257–257.
Target: docs/platform/proposals/coordination-capability-envelope.md#coordinator-soul.
Source digest: 7c952c25c4201077be971f4d51dfae21b4ba02d7ddda5f7249cdc586b5db01b3
Target digest: 7c952c25c4201077be971f4d51dfae21b4ba02d7ddda5f7249cdc586b5db01b3
Shown source SHA256: 45105de0452a0634ef4a1fde029f8b0160564cb6c258b173597ce0a6649a72e0
Shown target SHA256: 45105de0452a0634ef4a1fde029f8b0160564cb6c258b173597ce0a6649a72e0

### Proposed decision

```json
{
  "claimId": "claim_23cc21f91ef2f127ecfe350334db49ed",
  "sourceUnitDigest": "7c952c25c4201077be971f4d51dfae21b4ba02d7ddda5f7249cdc586b5db01b3",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "coordinator-soul",
  "targetUnitDigest": "7c952c25c4201077be971f4d51dfae21b4ba02d7ddda5f7249cdc586b5db01b3",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#coordinator-soul (lines 257–257) is carried at docs/platform/proposals/coordination-capability-envelope.md#coordinator-soul (lines 284–284); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Coordinator soul

Soul carries mission, doctrine, judgment heuristics, uncertainty handling,
specialist selection, and recovery practice. Each worker receives a resolved role
packet: objective, posture, must-read context, constraints, actual rights,
expected evidence, and output destination. Persist the packet content/hash and
provenance. This proves delivery, not comprehension or compliance.

Role names are open labels; rights never derive from a role name. Runtime prose
must be packaged under its runtime owner, not loaded from documentation playbooks.
```

### Full target shown text

```text
### Coordinator soul

Soul carries mission, doctrine, judgment heuristics, uncertainty handling,
specialist selection, and recovery practice. Each worker receives a resolved role
packet: objective, posture, must-read context, constraints, actual rights,
expected evidence, and output destination. Persist the packet content/hash and
provenance. This proves delivery, not comprehension or compliance.

Role names are open labels; rights never derive from a role name. Runtime prose
must be packaged under its runtime owner, not loaded from documentation playbooks.
```

## claim_decb10de90b28977e91ed949f6a6bf7e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-41, lines 259–263.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-44.
Source digest: 2579b4f758d3689b8e9fda217a0425084f0edceb4dc16fd51f3265ac48119cd8
Target digest: 2579b4f758d3689b8e9fda217a0425084f0edceb4dc16fd51f3265ac48119cd8
Shown source SHA256: 2579b4f758d3689b8e9fda217a0425084f0edceb4dc16fd51f3265ac48119cd8
Shown target SHA256: 2579b4f758d3689b8e9fda217a0425084f0edceb4dc16fd51f3265ac48119cd8

### Proposed decision

```json
{
  "claimId": "claim_decb10de90b28977e91ed949f6a6bf7e",
  "sourceUnitDigest": "2579b4f758d3689b8e9fda217a0425084f0edceb4dc16fd51f3265ac48119cd8",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "2579b4f758d3689b8e9fda217a0425084f0edceb4dc16fd51f3265ac48119cd8",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Coordinator soul"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-41 (lines 259–263) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-44 (lines 286–290); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Soul carries mission, doctrine, judgment heuristics, uncertainty handling,
specialist selection, and recovery practice. Each worker receives a resolved role
packet: objective, posture, must-read context, constraints, actual rights,
expected evidence, and output destination. Persist the packet content/hash and
provenance. This proves delivery, not comprehension or compliance.
```

### Full target shown text

```text
Soul carries mission, doctrine, judgment heuristics, uncertainty handling,
specialist selection, and recovery practice. Each worker receives a resolved role
packet: objective, posture, must-read context, constraints, actual rights,
expected evidence, and output destination. Persist the packet content/hash and
provenance. This proves delivery, not comprehension or compliance.
```

## claim_f81a18819c2c3484de2feaee9d343496

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-42, lines 265–266.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-45.
Source digest: 437ee03a3ae005eb484c2215ba410da8f948a31d75bd6bfb5ba0401fb94e0ed2
Target digest: 437ee03a3ae005eb484c2215ba410da8f948a31d75bd6bfb5ba0401fb94e0ed2
Shown source SHA256: 437ee03a3ae005eb484c2215ba410da8f948a31d75bd6bfb5ba0401fb94e0ed2
Shown target SHA256: 437ee03a3ae005eb484c2215ba410da8f948a31d75bd6bfb5ba0401fb94e0ed2

### Proposed decision

```json
{
  "claimId": "claim_f81a18819c2c3484de2feaee9d343496",
  "sourceUnitDigest": "437ee03a3ae005eb484c2215ba410da8f948a31d75bd6bfb5ba0401fb94e0ed2",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "437ee03a3ae005eb484c2215ba410da8f948a31d75bd6bfb5ba0401fb94e0ed2",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Coordinator soul"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-42 (lines 265–266) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-45 (lines 292–293); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Role names are open labels; rights never derive from a role name. Runtime prose
must be packaged under its runtime owner, not loaded from documentation playbooks.
```

### Full target shown text

```text
Role names are open labels; rights never derive from a role name. Runtime prose
must be packaged under its runtime owner, not loaded from documentation playbooks.
```

## claim_568b57a943c924873936f042768788c1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#capability-envelope, lines 268–268.
Target: docs/platform/proposals/coordination-capability-envelope.md#capability-envelope.
Source digest: 26266416d59bd034876f86fa5dc9e3204f3f595c017d3a834944c2b2534fdfb5
Target digest: 26266416d59bd034876f86fa5dc9e3204f3f595c017d3a834944c2b2534fdfb5
Shown source SHA256: d371137e816becf882708e7c699bdfe0d6d2f4bc3565c458d523319ed7006727
Shown target SHA256: d371137e816becf882708e7c699bdfe0d6d2f4bc3565c458d523319ed7006727

### Proposed decision

```json
{
  "claimId": "claim_568b57a943c924873936f042768788c1",
  "sourceUnitDigest": "26266416d59bd034876f86fa5dc9e3204f3f595c017d3a834944c2b2534fdfb5",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "capability-envelope",
  "targetUnitDigest": "26266416d59bd034876f86fa5dc9e3204f3f595c017d3a834944c2b2534fdfb5",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#capability-envelope (lines 268–268) is carried at docs/platform/proposals/coordination-capability-envelope.md#capability-envelope (lines 295–295); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Capability envelope

The envelope bounds resource/data scope, permitted executor/provider/model,
tier/cost, Assignment count, concurrency, delegation depth, mutation/integration,
disclosure, non-waivable obligations, active execution budget, deadline, and
grant expiry. These clocks and counters are distinct.

The coordinator chooses inside the envelope and cannot rewrite its root grant.
Accounting is aggregate across child work, retries, and related sessions when
funded by the same budget authority; splitting work must not reset limits.
```

### Full target shown text

```text
### Capability envelope

The envelope bounds resource/data scope, permitted executor/provider/model,
tier/cost, Assignment count, concurrency, delegation depth, mutation/integration,
disclosure, non-waivable obligations, active execution budget, deadline, and
grant expiry. These clocks and counters are distinct.

The coordinator chooses inside the envelope and cannot rewrite its root grant.
Accounting is aggregate across child work, retries, and related sessions when
funded by the same budget authority; splitting work must not reset limits.
```

## claim_24e91339f7dbcc1f9887a77805adbb30

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-43, lines 270–273.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-46.
Source digest: 7f53e52dab74a5fdb83c4e4557a709151ccd9c47724b5730706b9c259535ea85
Target digest: 7f53e52dab74a5fdb83c4e4557a709151ccd9c47724b5730706b9c259535ea85
Shown source SHA256: 7f53e52dab74a5fdb83c4e4557a709151ccd9c47724b5730706b9c259535ea85
Shown target SHA256: 7f53e52dab74a5fdb83c4e4557a709151ccd9c47724b5730706b9c259535ea85

### Proposed decision

```json
{
  "claimId": "claim_24e91339f7dbcc1f9887a77805adbb30",
  "sourceUnitDigest": "7f53e52dab74a5fdb83c4e4557a709151ccd9c47724b5730706b9c259535ea85",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "7f53e52dab74a5fdb83c4e4557a709151ccd9c47724b5730706b9c259535ea85",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Capability envelope"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-43 (lines 270–273) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-46 (lines 297–300); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The envelope bounds resource/data scope, permitted executor/provider/model,
tier/cost, Assignment count, concurrency, delegation depth, mutation/integration,
disclosure, non-waivable obligations, active execution budget, deadline, and
grant expiry. These clocks and counters are distinct.
```

### Full target shown text

```text
The envelope bounds resource/data scope, permitted executor/provider/model,
tier/cost, Assignment count, concurrency, delegation depth, mutation/integration,
disclosure, non-waivable obligations, active execution budget, deadline, and
grant expiry. These clocks and counters are distinct.
```

## claim_23b885dcdffd8291e9400551639f7f72

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-44, lines 275–277.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-47.
Source digest: fcfc4cfcffbde49c790b86fc2add8d2ed3f7bf06e3f1376c51a86bd237157f12
Target digest: fcfc4cfcffbde49c790b86fc2add8d2ed3f7bf06e3f1376c51a86bd237157f12
Shown source SHA256: fcfc4cfcffbde49c790b86fc2add8d2ed3f7bf06e3f1376c51a86bd237157f12
Shown target SHA256: fcfc4cfcffbde49c790b86fc2add8d2ed3f7bf06e3f1376c51a86bd237157f12

### Proposed decision

```json
{
  "claimId": "claim_23b885dcdffd8291e9400551639f7f72",
  "sourceUnitDigest": "fcfc4cfcffbde49c790b86fc2add8d2ed3f7bf06e3f1376c51a86bd237157f12",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "fcfc4cfcffbde49c790b86fc2add8d2ed3f7bf06e3f1376c51a86bd237157f12",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Capability envelope"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-44 (lines 275–277) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-47 (lines 302–304); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The coordinator chooses inside the envelope and cannot rewrite its root grant.
Accounting is aggregate across child work, retries, and related sessions when
funded by the same budget authority; splitting work must not reset limits.
```

### Full target shown text

```text
The coordinator chooses inside the envelope and cannot rewrite its root grant.
Accounting is aggregate across child work, retries, and related sessions when
funded by the same budget authority; splitting work must not reset limits.
```

## claim_811235fa39de2da2c99d3f51295b3cf5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#authority-grants, lines 279–279.
Target: docs/platform/proposals/coordination-capability-envelope.md#authority-grants.
Source digest: a563c13315f64d557501bc098f42f6888c46c3cedecd8326215cf321c304585f
Target digest: a563c13315f64d557501bc098f42f6888c46c3cedecd8326215cf321c304585f
Shown source SHA256: 0263b30fe2c72a4c778f109f55906827be24b169f50158c7c0fc57d4cc99b05e
Shown target SHA256: 0263b30fe2c72a4c778f109f55906827be24b169f50158c7c0fc57d4cc99b05e

### Proposed decision

```json
{
  "claimId": "claim_811235fa39de2da2c99d3f51295b3cf5",
  "sourceUnitDigest": "a563c13315f64d557501bc098f42f6888c46c3cedecd8326215cf321c304585f",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "authority-grants",
  "targetUnitDigest": "a563c13315f64d557501bc098f42f6888c46c3cedecd8326215cf321c304585f",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#authority-grants (lines 279–279) is carried at docs/platform/proposals/coordination-capability-envelope.md#authority-grants (lines 306–306); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Authority grants

A grant has an authenticated issuer, recipient, resource, actions, limits, and
expiry. Subgrants only attenuate authority. The coordinator cannot bypass the
broker through ambient control-store/config access. Workers receive no coordinator
credential. Human decisions enter through a separately authenticated source;
worker prose saying “human approved” creates no rights.

Isolation must actually enforce the boundary. Worktrees and identity-string
checks are insufficient. Tests executing worker-produced code also run within an
appropriate boundary. Runtime, privileged configuration, and operator remain
trusted; this is not protection against a compromised host administrator.
```

### Full target shown text

```text
### Authority grants

A grant has an authenticated issuer, recipient, resource, actions, limits, and
expiry. Subgrants only attenuate authority. The coordinator cannot bypass the
broker through ambient control-store/config access. Workers receive no coordinator
credential. Human decisions enter through a separately authenticated source;
worker prose saying “human approved” creates no rights.

Isolation must actually enforce the boundary. Worktrees and identity-string
checks are insufficient. Tests executing worker-produced code also run within an
appropriate boundary. Runtime, privileged configuration, and operator remain
trusted; this is not protection against a compromised host administrator.
```

## claim_1c1febae718b85c33193cf9d24f5a9bf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-45, lines 281–285.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-48.
Source digest: beff7a25ddaacb85bed8148a2db48f733ec2764c9b397d1826cc3f63671fe586
Target digest: beff7a25ddaacb85bed8148a2db48f733ec2764c9b397d1826cc3f63671fe586
Shown source SHA256: beff7a25ddaacb85bed8148a2db48f733ec2764c9b397d1826cc3f63671fe586
Shown target SHA256: beff7a25ddaacb85bed8148a2db48f733ec2764c9b397d1826cc3f63671fe586

### Proposed decision

```json
{
  "claimId": "claim_1c1febae718b85c33193cf9d24f5a9bf",
  "sourceUnitDigest": "beff7a25ddaacb85bed8148a2db48f733ec2764c9b397d1826cc3f63671fe586",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "beff7a25ddaacb85bed8148a2db48f733ec2764c9b397d1826cc3f63671fe586",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Authority grants"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-45 (lines 281–285) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-48 (lines 308–312); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A grant has an authenticated issuer, recipient, resource, actions, limits, and
expiry. Subgrants only attenuate authority. The coordinator cannot bypass the
broker through ambient control-store/config access. Workers receive no coordinator
credential. Human decisions enter through a separately authenticated source;
worker prose saying “human approved” creates no rights.
```

### Full target shown text

```text
A grant has an authenticated issuer, recipient, resource, actions, limits, and
expiry. Subgrants only attenuate authority. The coordinator cannot bypass the
broker through ambient control-store/config access. Workers receive no coordinator
credential. Human decisions enter through a separately authenticated source;
worker prose saying “human approved” creates no rights.
```

## claim_46314ba63a8cc87cfa5820eebea720b4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-46, lines 287–290.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-49.
Source digest: 5aabd41de1bfcd16ca9d2a58a3472e06b59a8645e64e92a254d20caf6ed0398a
Target digest: 5aabd41de1bfcd16ca9d2a58a3472e06b59a8645e64e92a254d20caf6ed0398a
Shown source SHA256: 5aabd41de1bfcd16ca9d2a58a3472e06b59a8645e64e92a254d20caf6ed0398a
Shown target SHA256: 5aabd41de1bfcd16ca9d2a58a3472e06b59a8645e64e92a254d20caf6ed0398a

### Proposed decision

```json
{
  "claimId": "claim_46314ba63a8cc87cfa5820eebea720b4",
  "sourceUnitDigest": "5aabd41de1bfcd16ca9d2a58a3472e06b59a8645e64e92a254d20caf6ed0398a",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "5aabd41de1bfcd16ca9d2a58a3472e06b59a8645e64e92a254d20caf6ed0398a",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Authority grants"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-46 (lines 287–290) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-49 (lines 314–317); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Isolation must actually enforce the boundary. Worktrees and identity-string
checks are insufficient. Tests executing worker-produced code also run within an
appropriate boundary. Runtime, privileged configuration, and operator remain
trusted; this is not protection against a compromised host administrator.
```

### Full target shown text

```text
Isolation must actually enforce the boundary. Worktrees and identity-string
checks are insufficient. Tests executing worker-produced code also run within an
appropriate boundary. Runtime, privileged configuration, and operator remain
trusted; this is not protection against a compromised host administrator.
```

## claim_6149a065b8171abd4d850be6f96f70de

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#contextevidence-grants, lines 292–292.
Target: docs/platform/proposals/coordination-capability-envelope.md#contextevidence-grants.
Source digest: 2c2ea1a0271797b42b888e5fee95324c7f97b5a55e46c8da68f7017ff69e49d1
Target digest: 2c2ea1a0271797b42b888e5fee95324c7f97b5a55e46c8da68f7017ff69e49d1
Shown source SHA256: 773dd0116835bd0b89425ba36b61fe7a06e47729a331421111c22de67facda0b
Shown target SHA256: 773dd0116835bd0b89425ba36b61fe7a06e47729a331421111c22de67facda0b

### Proposed decision

```json
{
  "claimId": "claim_6149a065b8171abd4d850be6f96f70de",
  "sourceUnitDigest": "2c2ea1a0271797b42b888e5fee95324c7f97b5a55e46c8da68f7017ff69e49d1",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "contextevidence-grants",
  "targetUnitDigest": "2c2ea1a0271797b42b888e5fee95324c7f97b5a55e46c8da68f7017ff69e49d1",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#contextevidence-grants (lines 292–292) is carried at docs/platform/proposals/coordination-capability-envelope.md#contextevidence-grants (lines 319–319); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Context/evidence grants

Separate permission to read, permission to publish, and eligibility to cite an
artifact as evidence for an assertion. Independent-first uses separate packets/
snapshots and sealed submissions. Reveal is a recorded grant effect.

Knowledge already revealed cannot be revoked from model context. Later work
retains exposure history; a new independent assessment requires a fresh execution
with an appropriately restricted packet.
```

### Full target shown text

```text
### Context/evidence grants

Separate permission to read, permission to publish, and eligibility to cite an
artifact as evidence for an assertion. Independent-first uses separate packets/
snapshots and sealed submissions. Reveal is a recorded grant effect.

Knowledge already revealed cannot be revoked from model context. Later work
retains exposure history; a new independent assessment requires a fresh execution
with an appropriately restricted packet.
```

## claim_4d6a763ce3f177c4d4f4cccb6b3bfeff

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-47, lines 294–296.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-50.
Source digest: 4bed8d2bd2843b52880345c88ad93e8b9b0112b81a0d24f8eee3dd88870ad938
Target digest: 4bed8d2bd2843b52880345c88ad93e8b9b0112b81a0d24f8eee3dd88870ad938
Shown source SHA256: 4bed8d2bd2843b52880345c88ad93e8b9b0112b81a0d24f8eee3dd88870ad938
Shown target SHA256: 4bed8d2bd2843b52880345c88ad93e8b9b0112b81a0d24f8eee3dd88870ad938

### Proposed decision

```json
{
  "claimId": "claim_4d6a763ce3f177c4d4f4cccb6b3bfeff",
  "sourceUnitDigest": "4bed8d2bd2843b52880345c88ad93e8b9b0112b81a0d24f8eee3dd88870ad938",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "4bed8d2bd2843b52880345c88ad93e8b9b0112b81a0d24f8eee3dd88870ad938",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Context/evidence grants"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-47 (lines 294–296) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-50 (lines 321–323); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Separate permission to read, permission to publish, and eligibility to cite an
artifact as evidence for an assertion. Independent-first uses separate packets/
snapshots and sealed submissions. Reveal is a recorded grant effect.
```

### Full target shown text

```text
Separate permission to read, permission to publish, and eligibility to cite an
artifact as evidence for an assertion. Independent-first uses separate packets/
snapshots and sealed submissions. Reveal is a recorded grant effect.
```

## claim_22fb315680c92fd338f955488f4d5e55

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-48, lines 298–300.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-51.
Source digest: 943650ad435ea8247f3046d43c25b7ad4d8449cff6cf03fad823ef4093433adc
Target digest: 943650ad435ea8247f3046d43c25b7ad4d8449cff6cf03fad823ef4093433adc
Shown source SHA256: 943650ad435ea8247f3046d43c25b7ad4d8449cff6cf03fad823ef4093433adc
Shown target SHA256: 943650ad435ea8247f3046d43c25b7ad4d8449cff6cf03fad823ef4093433adc

### Proposed decision

```json
{
  "claimId": "claim_22fb315680c92fd338f955488f4d5e55",
  "sourceUnitDigest": "943650ad435ea8247f3046d43c25b7ad4d8449cff6cf03fad823ef4093433adc",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "943650ad435ea8247f3046d43c25b7ad4d8449cff6cf03fad823ef4093433adc",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Context/evidence grants"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-48 (lines 298–300) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-51 (lines 325–327); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Knowledge already revealed cannot be revoked from model context. Later work
retains exposure history; a new independent assessment requires a fresh execution
with an appropriately restricted packet.
```

### Full target shown text

```text
Knowledge already revealed cannot be revoked from model context. Later work
retains exposure history; a new independent assessment requires a fresh execution
with an appropriately restricted packet.
```

## claim_121b653fb5342ad708df077f885ea156

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#bounded-action-vocabulary, lines 302–302.
Target: docs/platform/proposals/coordination-capability-envelope.md#bounded-action-vocabulary.
Source digest: d73d624b31d03e4230c720d3ee8ddf689ac7be13bed251e41ec19ee628d47e2b
Target digest: d73d624b31d03e4230c720d3ee8ddf689ac7be13bed251e41ec19ee628d47e2b
Shown source SHA256: f4b19ba2c3c1ae028541860302592cdc07509693c1755528bbf61e41674ad035
Shown target SHA256: f4b19ba2c3c1ae028541860302592cdc07509693c1755528bbf61e41674ad035

### Proposed decision

```json
{
  "claimId": "claim_121b653fb5342ad708df077f885ea156",
  "sourceUnitDigest": "d73d624b31d03e4230c720d3ee8ddf689ac7be13bed251e41ec19ee628d47e2b",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "bounded-action-vocabulary",
  "targetUnitDigest": "d73d624b31d03e4230c720d3ee8ddf689ac7be13bed251e41ec19ee628d47e2b",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#bounded-action-vocabulary (lines 302–302) is carried at docs/platform/proposals/coordination-capability-envelope.md#bounded-action-vocabulary (lines 329–329); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Bounded action vocabulary

| Effect category | Conceptual actions |
|---|---|
| Execution | Dispatch, retry, cancel, replace |
| Access | Grant/revoke, reveal |
| Durable record | Submit artifact, checkpoint, assessment, evidence reference |
| Commitment | Record/resolve obligation within delegated authority |
| Lifecycle | Park, resume, propose close |
| Integration | Propose an effect to its authorized resource owner |

Investigate, challenge, synthesize, and reframe remain task prose/doctrine, not
kernel operation enums. All execution still lowers through Assignment → Dispatch
→ Run → RunResult. Resolved executor/provider/model/tier/persona binding applies
per Assignment, including fan-out. Provenance distinguishes requested/configured
routing from observed backend identity when actual model attestation is absent.
```

### Full target shown text

```text
### Bounded action vocabulary

| Effect category | Conceptual actions |
|---|---|
| Execution | Dispatch, retry, cancel, replace |
| Access | Grant/revoke, reveal |
| Durable record | Submit artifact, checkpoint, assessment, evidence reference |
| Commitment | Record/resolve obligation within delegated authority |
| Lifecycle | Park, resume, propose close |
| Integration | Propose an effect to its authorized resource owner |

Investigate, challenge, synthesize, and reframe remain task prose/doctrine, not
kernel operation enums. All execution still lowers through Assignment → Dispatch
→ Run → RunResult. Resolved executor/provider/model/tier/persona binding applies
per Assignment, including fan-out. Provenance distinguishes requested/configured
routing from observed backend identity when actual model attestation is absent.
```

## claim_794f3c1693856f39415ee320430d87d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-49, lines 304–311.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-52.
Source digest: 14264f1915319f4aa234c7d3f605b11ca98bd12291be030b791b725b81a16103
Target digest: 14264f1915319f4aa234c7d3f605b11ca98bd12291be030b791b725b81a16103
Shown source SHA256: 14264f1915319f4aa234c7d3f605b11ca98bd12291be030b791b725b81a16103
Shown target SHA256: 14264f1915319f4aa234c7d3f605b11ca98bd12291be030b791b725b81a16103

### Proposed decision

```json
{
  "claimId": "claim_794f3c1693856f39415ee320430d87d9",
  "sourceUnitDigest": "14264f1915319f4aa234c7d3f605b11ca98bd12291be030b791b725b81a16103",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "14264f1915319f4aa234c7d3f605b11ca98bd12291be030b791b725b81a16103",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Bounded action vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-49 (lines 304–311) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-52 (lines 331–338); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Effect category | Conceptual actions |
|---|---|
| Execution | Dispatch, retry, cancel, replace |
| Access | Grant/revoke, reveal |
| Durable record | Submit artifact, checkpoint, assessment, evidence reference |
| Commitment | Record/resolve obligation within delegated authority |
| Lifecycle | Park, resume, propose close |
| Integration | Propose an effect to its authorized resource owner |
```

### Full target shown text

```text
| Effect category | Conceptual actions |
|---|---|
| Execution | Dispatch, retry, cancel, replace |
| Access | Grant/revoke, reveal |
| Durable record | Submit artifact, checkpoint, assessment, evidence reference |
| Commitment | Record/resolve obligation within delegated authority |
| Lifecycle | Park, resume, propose close |
| Integration | Propose an effect to its authorized resource owner |
```

## claim_97936d32fe249ae29d3f26468983b67d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-50, lines 313–317.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-53.
Source digest: 1bbce46e9d42d5ec6a93cf1732a66d73522699d7411adf2f3a52e1e9292f401b
Target digest: 1bbce46e9d42d5ec6a93cf1732a66d73522699d7411adf2f3a52e1e9292f401b
Shown source SHA256: 1bbce46e9d42d5ec6a93cf1732a66d73522699d7411adf2f3a52e1e9292f401b
Shown target SHA256: 1bbce46e9d42d5ec6a93cf1732a66d73522699d7411adf2f3a52e1e9292f401b

### Proposed decision

```json
{
  "claimId": "claim_97936d32fe249ae29d3f26468983b67d",
  "sourceUnitDigest": "1bbce46e9d42d5ec6a93cf1732a66d73522699d7411adf2f3a52e1e9292f401b",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "1bbce46e9d42d5ec6a93cf1732a66d73522699d7411adf2f3a52e1e9292f401b",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Bounded action vocabulary"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-50 (lines 313–317) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-53 (lines 340–344); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Investigate, challenge, synthesize, and reframe remain task prose/doctrine, not
kernel operation enums. All execution still lowers through Assignment → Dispatch
→ Run → RunResult. Resolved executor/provider/model/tier/persona binding applies
per Assignment, including fan-out. Provenance distinguishes requested/configured
routing from observed backend identity when actual model attestation is absent.
```

### Full target shown text

```text
Investigate, challenge, synthesize, and reframe remain task prose/doctrine, not
kernel operation enums. All execution still lowers through Assignment → Dispatch
→ Run → RunResult. Resolved executor/provider/model/tier/persona binding applies
per Assignment, including fan-out. Provenance distinguishes requested/configured
routing from observed backend identity when actual model attestation is absent.
```

## claim_c77ada0116158e70d454512d583bd05a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#durable-deliberation-memory, lines 319–319.
Target: docs/platform/proposals/coordination-capability-envelope.md#durable-deliberation-memory.
Source digest: 4abe74aa51b9a947edb54eefcce514b2a7b34695d052def690a9f20a5cdc244d
Target digest: 4abe74aa51b9a947edb54eefcce514b2a7b34695d052def690a9f20a5cdc244d
Shown source SHA256: 8ac939c97f99b5186239641107bb934c0e1ed2a01018918af177c827b0d91fbd
Shown target SHA256: 8ac939c97f99b5186239641107bb934c0e1ed2a01018918af177c827b0d91fbd

### Proposed decision

```json
{
  "claimId": "claim_c77ada0116158e70d454512d583bd05a",
  "sourceUnitDigest": "4abe74aa51b9a947edb54eefcce514b2a7b34695d052def690a9f20a5cdc244d",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "durable-deliberation-memory",
  "targetUnitDigest": "4abe74aa51b9a947edb54eefcce514b2a7b34695d052def690a9f20a5cdc244d",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#durable-deliberation-memory (lines 319–319) is carried at docs/platform/proposals/coordination-capability-envelope.md#durable-deliberation-memory (lines 346–346); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Durable deliberation memory

Keep two layers consistent with platform Log/State laws:

- Immutable log: actions, grants, results, artifact versions, checkpoint history.
- Current state: understanding, assumptions, open questions, alternatives,
  commitments, requirement-to-proof mapping, and rationale for the next step.

The current view references its sources; it does not rewrite history. A checkpoint
stores decision rationale sufficient for handoff, not every internal thought.
Only changes to authority, effects, commitments, or evidence truth require typed
records. Conversation can be prose, artifacts, or mediated messages as appropriate.
```

### Full target shown text

```text
### Durable deliberation memory

Keep two layers consistent with platform Log/State laws:

- Immutable log: actions, grants, results, artifact versions, checkpoint history.
- Current state: understanding, assumptions, open questions, alternatives,
  commitments, requirement-to-proof mapping, and rationale for the next step.

The current view references its sources; it does not rewrite history. A checkpoint
stores decision rationale sufficient for handoff, not every internal thought.
Only changes to authority, effects, commitments, or evidence truth require typed
records. Conversation can be prose, artifacts, or mediated messages as appropriate.
```

## claim_6cc2b1b7d0b50da9b98ab7b32faec106

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-51, lines 321–321.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-54.
Source digest: d09d660562ea2a222ef682d591bc4dfb1f7293f3c07b4b7e80dc2be215457466
Target digest: d09d660562ea2a222ef682d591bc4dfb1f7293f3c07b4b7e80dc2be215457466
Shown source SHA256: d09d660562ea2a222ef682d591bc4dfb1f7293f3c07b4b7e80dc2be215457466
Shown target SHA256: d09d660562ea2a222ef682d591bc4dfb1f7293f3c07b4b7e80dc2be215457466

### Proposed decision

```json
{
  "claimId": "claim_6cc2b1b7d0b50da9b98ab7b32faec106",
  "sourceUnitDigest": "d09d660562ea2a222ef682d591bc4dfb1f7293f3c07b4b7e80dc2be215457466",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "d09d660562ea2a222ef682d591bc4dfb1f7293f3c07b4b7e80dc2be215457466",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Durable deliberation memory"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-51 (lines 321–321) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-54 (lines 348–348); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Keep two layers consistent with platform Log/State laws:
```

### Full target shown text

```text
Keep two layers consistent with platform Log/State laws:
```

## claim_7903db7c0340d72a42a73c1f2796147d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-52, lines 323–325.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-55.
Source digest: 10c45197d36087f69fb0016ac979121937449186111b94557e248a185ad4b383
Target digest: 10c45197d36087f69fb0016ac979121937449186111b94557e248a185ad4b383
Shown source SHA256: 10c45197d36087f69fb0016ac979121937449186111b94557e248a185ad4b383
Shown target SHA256: 10c45197d36087f69fb0016ac979121937449186111b94557e248a185ad4b383

### Proposed decision

```json
{
  "claimId": "claim_7903db7c0340d72a42a73c1f2796147d",
  "sourceUnitDigest": "10c45197d36087f69fb0016ac979121937449186111b94557e248a185ad4b383",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "10c45197d36087f69fb0016ac979121937449186111b94557e248a185ad4b383",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Durable deliberation memory"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-52 (lines 323–325) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-55 (lines 350–352); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Immutable log: actions, grants, results, artifact versions, checkpoint history.
- Current state: understanding, assumptions, open questions, alternatives,
  commitments, requirement-to-proof mapping, and rationale for the next step.
```

### Full target shown text

```text
- Immutable log: actions, grants, results, artifact versions, checkpoint history.
- Current state: understanding, assumptions, open questions, alternatives,
  commitments, requirement-to-proof mapping, and rationale for the next step.
```

## claim_69e84042a171c17f273bb312b096ad23

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-53, lines 327–330.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-56.
Source digest: 41e260c830ea1cac91ebc2899d954b6e773571313a2004f20388b1957a30401f
Target digest: 41e260c830ea1cac91ebc2899d954b6e773571313a2004f20388b1957a30401f
Shown source SHA256: 41e260c830ea1cac91ebc2899d954b6e773571313a2004f20388b1957a30401f
Shown target SHA256: 41e260c830ea1cac91ebc2899d954b6e773571313a2004f20388b1957a30401f

### Proposed decision

```json
{
  "claimId": "claim_69e84042a171c17f273bb312b096ad23",
  "sourceUnitDigest": "41e260c830ea1cac91ebc2899d954b6e773571313a2004f20388b1957a30401f",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "41e260c830ea1cac91ebc2899d954b6e773571313a2004f20388b1957a30401f",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Durable deliberation memory"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-53 (lines 327–330) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-56 (lines 354–357); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The current view references its sources; it does not rewrite history. A checkpoint
stores decision rationale sufficient for handoff, not every internal thought.
Only changes to authority, effects, commitments, or evidence truth require typed
records. Conversation can be prose, artifacts, or mediated messages as appropriate.
```

### Full target shown text

```text
The current view references its sources; it does not rewrite history. A checkpoint
stores decision rationale sufficient for handoff, not every internal thought.
Only changes to authority, effects, commitments, or evidence truth require typed
records. Conversation can be prose, artifacts, or mediated messages as appropriate.
```

## claim_b7f3264bf04c3bdd590bd0b8cf31edeb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#replayresume, lines 332–332.
Target: docs/platform/proposals/coordination-capability-envelope.md#replayresume.
Source digest: fe4e95ecb80098de9bcd48baf05871d8676cb366177668db75297c9fb4817265
Target digest: fe4e95ecb80098de9bcd48baf05871d8676cb366177668db75297c9fb4817265
Shown source SHA256: 24661cdd7adf80db1dfc34aa649f1aaa0b7eefbdd097314ad98f1a94a5b874f5
Shown target SHA256: 24661cdd7adf80db1dfc34aa649f1aaa0b7eefbdd097314ad98f1a94a5b874f5

### Proposed decision

```json
{
  "claimId": "claim_b7f3264bf04c3bdd590bd0b8cf31edeb",
  "sourceUnitDigest": "fe4e95ecb80098de9bcd48baf05871d8676cb366177668db75297c9fb4817265",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "replayresume",
  "targetUnitDigest": "fe4e95ecb80098de9bcd48baf05871d8676cb366177668db75297c9fb4817265",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#replayresume (lines 332–332) is carried at docs/platform/proposals/coordination-capability-envelope.md#replayresume (lines 359–359); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Replay/resume

Replay execution/grants/obligations, load a checkpoint with its event cursor and
content-pinned versions, reconcile uncertain runs/effects, then let the new
coordinator choose a next step. Replay reconstructs history; it does not promise
identical future model judgment.

A coordinator lease/epoch prevents two resumed processes from simultaneously
controlling the session. Idempotency prevents duplicate consumption/application;
external exactly-once effects are not promised where the target cannot support
them. Unknown outcomes require reconciliation before retry.

Parked time consumes no active execution budget when nothing runs, while deadline
and grant expiry remain effective. Resume does not replenish spent budget.
```

### Full target shown text

```text
### Replay/resume

Replay execution/grants/obligations, load a checkpoint with its event cursor and
content-pinned versions, reconcile uncertain runs/effects, then let the new
coordinator choose a next step. Replay reconstructs history; it does not promise
identical future model judgment.

A coordinator lease/epoch prevents two resumed processes from simultaneously
controlling the session. Idempotency prevents duplicate consumption/application;
external exactly-once effects are not promised where the target cannot support
them. Unknown outcomes require reconciliation before retry.

Parked time consumes no active execution budget when nothing runs, while deadline
and grant expiry remain effective. Resume does not replenish spent budget.
```

## claim_6d1eab6b208ce87271c509a83d6cca4c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-54, lines 334–337.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-57.
Source digest: ef40cf70624716c8db97374853d8de517aa523f3bc3181987481367ca44f1211
Target digest: ef40cf70624716c8db97374853d8de517aa523f3bc3181987481367ca44f1211
Shown source SHA256: ef40cf70624716c8db97374853d8de517aa523f3bc3181987481367ca44f1211
Shown target SHA256: ef40cf70624716c8db97374853d8de517aa523f3bc3181987481367ca44f1211

### Proposed decision

```json
{
  "claimId": "claim_6d1eab6b208ce87271c509a83d6cca4c",
  "sourceUnitDigest": "ef40cf70624716c8db97374853d8de517aa523f3bc3181987481367ca44f1211",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "ef40cf70624716c8db97374853d8de517aa523f3bc3181987481367ca44f1211",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Replay/resume"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-54 (lines 334–337) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-57 (lines 361–364); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Replay execution/grants/obligations, load a checkpoint with its event cursor and
content-pinned versions, reconcile uncertain runs/effects, then let the new
coordinator choose a next step. Replay reconstructs history; it does not promise
identical future model judgment.
```

### Full target shown text

```text
Replay execution/grants/obligations, load a checkpoint with its event cursor and
content-pinned versions, reconcile uncertain runs/effects, then let the new
coordinator choose a next step. Replay reconstructs history; it does not promise
identical future model judgment.
```

## claim_dcb0c9986a76ff758afc13a61b6f9fab

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-55, lines 339–342.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-58.
Source digest: 3983f3ee9f6a3832d408be5fde3f5e69d41cb6dbef6ba069ac5d3227767c4485
Target digest: 3983f3ee9f6a3832d408be5fde3f5e69d41cb6dbef6ba069ac5d3227767c4485
Shown source SHA256: 3983f3ee9f6a3832d408be5fde3f5e69d41cb6dbef6ba069ac5d3227767c4485
Shown target SHA256: 3983f3ee9f6a3832d408be5fde3f5e69d41cb6dbef6ba069ac5d3227767c4485

### Proposed decision

```json
{
  "claimId": "claim_dcb0c9986a76ff758afc13a61b6f9fab",
  "sourceUnitDigest": "3983f3ee9f6a3832d408be5fde3f5e69d41cb6dbef6ba069ac5d3227767c4485",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "3983f3ee9f6a3832d408be5fde3f5e69d41cb6dbef6ba069ac5d3227767c4485",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Replay/resume"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-55 (lines 339–342) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-58 (lines 366–369); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A coordinator lease/epoch prevents two resumed processes from simultaneously
controlling the session. Idempotency prevents duplicate consumption/application;
external exactly-once effects are not promised where the target cannot support
them. Unknown outcomes require reconciliation before retry.
```

### Full target shown text

```text
A coordinator lease/epoch prevents two resumed processes from simultaneously
controlling the session. Idempotency prevents duplicate consumption/application;
external exactly-once effects are not promised where the target cannot support
them. Unknown outcomes require reconciliation before retry.
```

## claim_9003582939153746ac660a6195306c89

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-56, lines 344–345.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-59.
Source digest: bc3c7d322c0d64f1c16fdf123573e5578f973bea6b7cc7f2dd8083ef15aeb203
Target digest: bc3c7d322c0d64f1c16fdf123573e5578f973bea6b7cc7f2dd8083ef15aeb203
Shown source SHA256: bc3c7d322c0d64f1c16fdf123573e5578f973bea6b7cc7f2dd8083ef15aeb203
Shown target SHA256: bc3c7d322c0d64f1c16fdf123573e5578f973bea6b7cc7f2dd8083ef15aeb203

### Proposed decision

```json
{
  "claimId": "claim_9003582939153746ac660a6195306c89",
  "sourceUnitDigest": "bc3c7d322c0d64f1c16fdf123573e5578f973bea6b7cc7f2dd8083ef15aeb203",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "bc3c7d322c0d64f1c16fdf123573e5578f973bea6b7cc7f2dd8083ef15aeb203",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Replay/resume"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-56 (lines 344–345) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-59 (lines 371–372); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Parked time consumes no active execution budget when nothing runs, while deadline
and grant expiry remain effective. Resume does not replenish spent budget.
```

### Full target shown text

```text
Parked time consumes no active execution budget when nothing runs, while deadline
and grant expiry remain effective. Resume does not replenish spent budget.
```

## claim_5d360f3824e24d44f4690a8e84ba1ba8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#mutation-evidence-and-completion, lines 347–347.
Target: docs/platform/proposals/coordination-capability-envelope.md#mutation-evidence-and-completion.
Source digest: 6efac93f32f0353b0d1cd4388a1b05280275acad8acc2f649677c01d565590bb
Target digest: 6efac93f32f0353b0d1cd4388a1b05280275acad8acc2f649677c01d565590bb
Shown source SHA256: f9f5408d2883b2913c1242b789e1cc8b0e2dcc4b21efadf3f3d67456179c9124
Shown target SHA256: f9f5408d2883b2913c1242b789e1cc8b0e2dcc4b21efadf3f3d67456179c9124

### Proposed decision

```json
{
  "claimId": "claim_5d360f3824e24d44f4690a8e84ba1ba8",
  "sourceUnitDigest": "6efac93f32f0353b0d1cd4388a1b05280275acad8acc2f649677c01d565590bb",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "mutation-evidence-and-completion",
  "targetUnitDigest": "6efac93f32f0353b0d1cd4388a1b05280275acad8acc2f649677c01d565590bb",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#mutation-evidence-and-completion (lines 347–347) is carried at docs/platform/proposals/coordination-capability-envelope.md#mutation-evidence-and-completion (lines 374–374); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Mutation, evidence, and completion

Workers produce candidates in granted workspaces. The resource owner checks
scope, revision, and evidence before integration. A new candidate means prior
assessments no longer satisfy obligations for the current candidate; the old
records remain valid historical evidence.

Closing coordination does not merge, approve, or transition Work. Work retains
its own lifecycle authority. Runtime validates evidence structure and required
attestations; it does not infer agreement or correctness from process success.
```

### Full target shown text

```text
### Mutation, evidence, and completion

Workers produce candidates in granted workspaces. The resource owner checks
scope, revision, and evidence before integration. A new candidate means prior
assessments no longer satisfy obligations for the current candidate; the old
records remain valid historical evidence.

Closing coordination does not merge, approve, or transition Work. Work retains
its own lifecycle authority. Runtime validates evidence structure and required
attestations; it does not infer agreement or correctness from process success.
```

## claim_92c3087e4801217c35178b00b74db150

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-57, lines 349–352.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-60.
Source digest: e688e5ca798268c5c41f79ceb76515cd5b08ab5cb69fefe1a766d9296a426fe3
Target digest: e688e5ca798268c5c41f79ceb76515cd5b08ab5cb69fefe1a766d9296a426fe3
Shown source SHA256: e688e5ca798268c5c41f79ceb76515cd5b08ab5cb69fefe1a766d9296a426fe3
Shown target SHA256: e688e5ca798268c5c41f79ceb76515cd5b08ab5cb69fefe1a766d9296a426fe3

### Proposed decision

```json
{
  "claimId": "claim_92c3087e4801217c35178b00b74db150",
  "sourceUnitDigest": "e688e5ca798268c5c41f79ceb76515cd5b08ab5cb69fefe1a766d9296a426fe3",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "e688e5ca798268c5c41f79ceb76515cd5b08ab5cb69fefe1a766d9296a426fe3",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Mutation, evidence, and completion"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-57 (lines 349–352) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-60 (lines 376–379); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Workers produce candidates in granted workspaces. The resource owner checks
scope, revision, and evidence before integration. A new candidate means prior
assessments no longer satisfy obligations for the current candidate; the old
records remain valid historical evidence.
```

### Full target shown text

```text
Workers produce candidates in granted workspaces. The resource owner checks
scope, revision, and evidence before integration. A new candidate means prior
assessments no longer satisfy obligations for the current candidate; the old
records remain valid historical evidence.
```

## claim_f729b2670c78b66b91e8f44be56bfeda

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-58, lines 354–356.
Target: docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-61.
Source digest: b0aa7116f85d04bb483cf843f252d5c3c284fe324d896903ce5e2fc70980948d
Target digest: b0aa7116f85d04bb483cf843f252d5c3c284fe324d896903ce5e2fc70980948d
Shown source SHA256: b0aa7116f85d04bb483cf843f252d5c3c284fe324d896903ce5e2fc70980948d
Shown target SHA256: b0aa7116f85d04bb483cf843f252d5c3c284fe324d896903ce5e2fc70980948d

### Proposed decision

```json
{
  "claimId": "claim_f729b2670c78b66b91e8f44be56bfeda",
  "sourceUnitDigest": "b0aa7116f85d04bb483cf843f252d5c3c284fe324d896903ce5e2fc70980948d",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "unheaded-block-61",
  "targetUnitDigest": "b0aa7116f85d04bb483cf843f252d5c3c284fe324d896903ce5e2fc70980948d",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "8. Conceptual model",
    "Mutation, evidence, and completion"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-58 (lines 354–356) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-61 (lines 381–383); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Closing coordination does not merge, approve, or transition Work. Work retains
its own lifecycle authority. Runtime validates evidence structure and required
attestations; it does not infer agreement or correctness from process success.
```

### Full target shown text

```text
Closing coordination does not merge, approve, or transition Work. Work retains
its own lifecycle authority. Runtime validates evidence structure and required
attestations; it does not infer agreement or correctness from process success.
```

## claim_4ee9f1732d26d96843aa7ccc15a1cca7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-capability-envelope.md#9-migration-path-preserving-proven-capability, lines 358–358.
Target: docs/platform/proposals/coordination-capability-envelope.md#9-migration-path-preserving-proven-capability.
Source digest: 56ccdefdef9b30d9707640c556fb2810a0628f9c5569f20a0412f53714a25309
Target digest: 56ccdefdef9b30d9707640c556fb2810a0628f9c5569f20a0412f53714a25309
Shown source SHA256: fdccbde4513c32167115fb9e3ba6348ccd820f9d4b2d46c4a0c130b6134a7e07
Shown target SHA256: fdccbde4513c32167115fb9e3ba6348ccd820f9d4b2d46c4a0c130b6134a7e07

### Proposed decision

```json
{
  "claimId": "claim_4ee9f1732d26d96843aa7ccc15a1cca7",
  "sourceUnitDigest": "56ccdefdef9b30d9707640c556fb2810a0628f9c5569f20a0412f53714a25309",
  "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
  "targetAnchor": "9-migration-path-preserving-proven-capability",
  "targetUnitDigest": "56ccdefdef9b30d9707640c556fb2810a0628f9c5569f20a0412f53714a25309",
  "targetAncestry": [
    "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#9-migration-path-preserving-proven-capability (lines 358–358) is carried at docs/platform/proposals/coordination-capability-envelope.md#9-migration-path-preserving-proven-capability (lines 385–385); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 9. Migration path preserving proven capability

This is a responsibility map, not a multi-phase implementation plan.

| Existing substrate | Proposed treatment |
|---|---|
| Assignment/Dispatch/Run/RunResult | Keep one execution path |
| Work-independent CoordinationSession | Keep identity/recovery root; no placeholder Work |
| Retry/recheck, history, idempotency, lock-held bounds | Keep; prove through public paths |
| FlowDefinition | Narrow to optional method/constraint representation; preserve Workflow consumers |
| Authorization/mutation gates | Elevate to authenticated grants tied to execution isolation |
| Visibility windows | Elevate to disclosure/read-grant primitives referenceable by a graph |
| Specialist slots | Generalize to bounded recruitment without predeclaring each specialty |
| Persona/policy resolution | Complete delivery and per-assignment binding, including fan-out |
| Typed contributions | Separate generic artifact lineage from optional cognitive taxonomy |
| Aggregation evaluator | Narrow to structural/evidence validation; agreement is a sourced assertion |
| Quorum and auto-close | Replace with explicit close plus applicable obligations; remove roster-based completion |
| chain/show | Keep projections; add memory/checkpoint refs; hints are not planners |
| Fixed phase/round counts and posture rosters | Move to doctrine/playbook unless explicitly adopted as a commitment |
| Definition id/version | Add content pins including dependencies affecting legality or packets |
| Prose workarounds contradicting RunResult | Remove when runtime paths are corrected; preserve one execution truth |

Old sessions retain historical semantics under their definitions/policies. Never
replay old evidence as though it had new containment or completion guarantees.
Public-path corrections and role-packet delivery can be evaluated independently
of the final family choice. No new Mission entity or Work lifecycle authority is
implicitly introduced by this proposal.
```

### Full target shown text

```text
## 9. Migration path preserving proven capability

This is a responsibility map, not a multi-phase implementation plan.

| Existing substrate | Proposed treatment |
|---|---|
| Assignment/Dispatch/Run/RunResult | Keep one execution path |
| Work-independent CoordinationSession | Keep identity/recovery root; no placeholder Work |
| Retry/recheck, history, idempotency, lock-held bounds | Keep; prove through public paths |
| FlowDefinition | Narrow to optional method/constraint representation; preserve Workflow consumers |
| Authorization/mutation gates | Elevate to authenticated grants tied to execution isolation |
| Visibility windows | Elevate to disclosure/read-grant primitives referenceable by a graph |
| Specialist slots | Generalize to bounded recruitment without predeclaring each specialty |
| Persona/policy resolution | Complete delivery and per-assignment binding, including fan-out |
| Typed contributions | Separate generic artifact lineage from optional cognitive taxonomy |
| Aggregation evaluator | Narrow to structural/evidence validation; agreement is a sourced assertion |
| Quorum and auto-close | Replace with explicit close plus applicable obligations; remove roster-based completion |
| chain/show | Keep projections; add memory/checkpoint refs; hints are not planners |
| Fixed phase/round counts and posture rosters | Move to doctrine/playbook unless explicitly adopted as a commitment |
| Definition id/version | Add content pins including dependencies affecting legality or packets |
| Prose workarounds contradicting RunResult | Remove when runtime paths are corrected; preserve one execution truth |

Old sessions retain historical semantics under their definitions/policies. Never
replay old evidence as though it had new containment or completion guarantees.
Public-path corrections and role-packet delivery can be evaluated independently
of the final family choice. No new Mission entity or Work lifecycle authority is
implicitly introduced by this proposal.
```
