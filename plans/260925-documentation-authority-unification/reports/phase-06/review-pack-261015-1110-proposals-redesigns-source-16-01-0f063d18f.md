# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-16-step-09-group-thinking-substrate.json
Original shard SHA256: 720f58259922e4a2869dd9e96efae21ca7da4fc915fae164cbdd83b3466409dc
Source file: docs/architect/proposals/step-09-group-thinking-substrate.md
Part 1/2; entries: **80**. Source-file group 16/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (6): `claim_45e2e391f46f70ce6e48eb2dcdcae936`, `claim_2b571132cc8fd45580b1ec2dba340ba9`, `claim_ae7a9e514e23ea99fe7cfc930d798b42`, `claim_e5de5fe180ff63066d0977970e5e53e3`, `claim_3865318571c3ebc0fed1203eddbca0c1`, `claim_77e26521b60e819e54cd3ddaebf8f20f`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (1): `claim_45e2e391f46f70ce6e48eb2dcdcae936`.

Weak-exact/Judgment population: 17; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_45e2e391f46f70ce6e48eb2dcdcae936

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#step-09---group-thinking-substrate, lines 1–1.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#step-09---group-thinking-substrate.
Source digest: 4704ac59101e08fe8aaeb92ea9ac4d855c6ba41023b8e11344b39ccc2f56a65e
Target digest: 3cf00a3c56f5c4f25a61320fd95f88fd93e01903118d429d576e70347dac8396
Shown source SHA256: 8dacf4dd721d70338cca42e607ef1db147815a81d124647c0783f44b3f1b2351
Shown target SHA256: 39d9fe916bc5223cca8541be2b6e472b267bf9651b2b7809e809f26294aaec46

### Proposed decision

```json
{
  "claimId": "claim_45e2e391f46f70ce6e48eb2dcdcae936",
  "sourceUnitDigest": "4704ac59101e08fe8aaeb92ea9ac4d855c6ba41023b8e11344b39ccc2f56a65e",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "step-09---group-thinking-substrate",
  "targetUnitDigest": "3cf00a3c56f5c4f25a61320fd95f88fd93e01903118d429d576e70347dac8396",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#step-09---group-thinking-substrate (lines 1–1) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#step-09---group-thinking-substrate (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
# Step 09 - Group Thinking Substrate

Document type: Proposal
Design status: Accepted for the implemented slice (MVP0-9 plus the Post-MVP9
Acceptance Layer); Discussion for every item this document still names as
deferred (vote/rank tally/weighted scoring/convergence, anonymization,
partial-window exceptions, aggregate transformation, cross-session grants,
`addSessionEdge`/arbitrary topology overlays, driver handoff, persistent
organization membership, peer-invited specialists — none of these are
implemented or claimed by any cell in this track).
Implementation: MVP0-5 implemented per `step-09-group-thinking-mvp1-mvp2`
(MVP1/MVP2) and `step-09-mvp3-to-mvp5` (MVP3-MVP5). MVP6-9 (§8.1's own
"Locked MVP6-MVP9 Shape") plus the Post-MVP9 Acceptance Layer (§8.2: the
Group-Thinking Protocol Pack, three conformance-proven protocol
definitions, and the `fgos-group-thinking` skill) implemented and closed by
`step-09-mvp6-to-mvp9` (Phases 00/06/07/08/09/10, including the
user-authorized P10-KERNEL-FIX quorum fix) — see that track's own
verification index for the full per-phase evidence trail and the
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md)/
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)
for the promoted contract text, each with its own named limitations.
Last reviewed: 2026-09-04
Canonical for: nothing until explicitly accepted; the implemented MVP0-9 +
Post-MVP9 Acceptance Layer slice is canonical only through the
CoordinationSession/FlowDefinition contracts it was promoted into, above —
this proposal document itself never becomes canonical by implementation
alone
Original date: 2026-09-02
Scope: preserve and narrow the next Agent Coordination design frontier after
Step 08: make fgOS able to express richer group-thinking and problem-solving
collaboration patterns without weakening the isolation-heavy fixtures already
proved by Step 08.
Intent traceability: [Architecture Intent](../architecture-intent.md),
[Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md)
Related: [Coordination Foundation Baseline](../agent-coordination/architecture/coordination-foundation-baseline.md),
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),
[Team Communication Protocol V1](../agent-coordination/proposals/team-communication-protocol-v1.md),
[Component Authority Boundary Map](component-authority-boundary-map.md),
[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md),
[Step 09 MVP1/MVP2 group-thinking verification](../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md),
[Step 09 MVP3-MVP5 verification](../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md),
[MVP6+ Dogfood Handoff](../agent-coordination/playbooks/mvp6-dogfood-handoff.md)

Implementation note (updated by `step-09-mvp6-to-mvp9`'s own closing cell,
P10.10 — Step 09 is now closed): MVP1-MVP5 promoted starting Phase 00 — see
`step-09-group-thinking-mvp1-mvp2` (MVP1/MVP2) and `step-09-mvp3-to-mvp5`
(MVP3-MVP5: recheck lineage/disposition hardening, a thin CLI launcher,
intentional role-tier dispatch policy, and session resume). MVP6 visibility
windows, MVP7 aggregation rules, MVP8 deliberation memory, and MVP9
dynamic specialist pull-in — §8.1's own "Locked MVP6-MVP9 Shape" — are now
IMPLEMENTED AND PROVEN, along with the Post-MVP9 Acceptance Layer (§8.2):
the Group-Thinking Protocol Pack, three real, conformance-proven protocol
definitions (RFC-Review-Lite, Nominal-Group-Lite, Delphi-Feedback-Lite),
and the `fgos-group-thinking` skill — see
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`
for the full evidence trail and the CoordinationSession/FlowDefinition
contracts for the promoted text. This document still does not authorize
any runtime/schema change beyond what those contracts now accept — every
item this document names elsewhere as deferred (§8.1's per-MVP "remain
deferred" clauses; §15 "Explicitly Not Proposed") is STILL deferred, not
implemented by this track: no vote/rank tally/weighted scoring/convergence
semantics, no anonymization, no partial-window exceptions, no aggregate
transformation, no cross-session grants, no `addSessionEdge`/arbitrary
topology overlay, no driver handoff, no persistent organization
membership, no peer-invited specialists. It exists so a future deferred
slice does not narrow the original intent into only the currently
convenient fixture.
```

### Full target shown text

````text
# Step 09 - Group Thinking Substrate

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/step-09-group-thinking-substrate.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 0fe7e01a53cbed52b8557571136450f8533aeaea
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/step-09-group-thinking-substrate.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate proposal retaining deferred capabilities referenced by docs/how-to/use-fgos-group-thinking.md:196–200. Current group-thinking guidance uses Workflows/presets; the old pack was removed in 2180b4e72. Source implementation and deferred-status statements remain dated metadata. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/step-09-group-thinking-substrate.md).


Document type: Proposal
Design status: Accepted for the implemented slice (MVP0-9 plus the Post-MVP9
Acceptance Layer); Discussion for every item this document still names as
deferred (vote/rank tally/weighted scoring/convergence, anonymization,
partial-window exceptions, aggregate transformation, cross-session grants,
`addSessionEdge`/arbitrary topology overlays, driver handoff, persistent
organization membership, peer-invited specialists — none of these are
implemented or claimed by any cell in this track).
Implementation: MVP0-5 implemented per `step-09-group-thinking-mvp1-mvp2`
(MVP1/MVP2) and `step-09-mvp3-to-mvp5` (MVP3-MVP5). MVP6-9 (§8.1's own
"Locked MVP6-MVP9 Shape") plus the Post-MVP9 Acceptance Layer (§8.2: the
Group-Thinking Protocol Pack, three conformance-proven protocol
definitions, and the `fgos-group-thinking` skill) implemented and closed by
`step-09-mvp6-to-mvp9` (Phases 00/06/07/08/09/10, including the
user-authorized P10-KERNEL-FIX quorum fix) — see that track's own
verification index for the full per-phase evidence trail and the
[CoordinationSession Contract](../../architect/agent-coordination/contracts/coordination-session.md)/
[FlowDefinition Contract](../../architect/agent-coordination/contracts/flow-definition.md)
for the promoted contract text, each with its own named limitations.
Last reviewed: 2026-09-04
Canonical for: nothing until explicitly accepted; the implemented MVP0-9 +
Post-MVP9 Acceptance Layer slice is canonical only through the
CoordinationSession/FlowDefinition contracts it was promoted into, above —
this proposal document itself never becomes canonical by implementation
alone
Original date: 2026-09-02
Scope: preserve and narrow the next Agent Coordination design frontier after
Step 08: make fgOS able to express richer group-thinking and problem-solving
collaboration patterns without weakening the isolation-heavy fixtures already
proved by Step 08.
Intent traceability: [Architecture Intent](../../architect/architecture-intent.md),
[Agent Coordination Intent Preservation Ledger](../../architect/agent-coordination/intent-preservation-ledger.md)
Related: [Coordination Foundation Baseline](../../architect/agent-coordination/architecture/coordination-foundation-baseline.md),
[CoordinationSession Contract](../../architect/agent-coordination/contracts/coordination-session.md),
[FlowDefinition Contract](../../architect/agent-coordination/contracts/flow-definition.md),
[Team Communication Protocol V1](../../architect/agent-coordination/proposals/team-communication-protocol-v1.md),
[Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md),
[Step 10 Coding Domain Adoption](../../architect/proposals/step-10-coding-domain-adoption.md),
[Step 09 MVP1/MVP2 group-thinking verification](../../architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md),
[Step 09 MVP3-MVP5 verification](../../architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md),
[MVP6+ Dogfood Handoff](../../architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md)

Implementation note (updated by `step-09-mvp6-to-mvp9`'s own closing cell,
P10.10 — Step 09 is now closed): MVP1-MVP5 promoted starting Phase 00 — see
`step-09-group-thinking-mvp1-mvp2` (MVP1/MVP2) and `step-09-mvp3-to-mvp5`
(MVP3-MVP5: recheck lineage/disposition hardening, a thin CLI launcher,
intentional role-tier dispatch policy, and session resume). MVP6 visibility
windows, MVP7 aggregation rules, MVP8 deliberation memory, and MVP9
dynamic specialist pull-in — §8.1's own "Locked MVP6-MVP9 Shape" — are now
IMPLEMENTED AND PROVEN, along with the Post-MVP9 Acceptance Layer (§8.2):
the Group-Thinking Protocol Pack, three real, conformance-proven protocol
definitions (RFC-Review-Lite, Nominal-Group-Lite, Delphi-Feedback-Lite),
and the `fgos-group-thinking` skill — see
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`
for the full evidence trail and the CoordinationSession/FlowDefinition
contracts for the promoted text. This document still does not authorize
any runtime/schema change beyond what those contracts now accept — every
item this document names elsewhere as deferred (§8.1's per-MVP "remain
deferred" clauses; §15 "Explicitly Not Proposed") is STILL deferred, not
implemented by this track: no vote/rank tally/weighted scoring/convergence
semantics, no anonymization, no partial-window exceptions, no aggregate
transformation, no cross-session grants, no `addSessionEdge`/arbitrary
topology overlay, no driver handoff, no persistent organization
membership, no peer-invited specialists. It exists so a future deferred
slice does not narrow the original intent into only the currently
convenient fixture.
````

### Correction before/after and reasons

```json
{
  "claimId": "claim_45e2e391f46f70ce6e48eb2dcdcae936",
  "source": "docs/architect/proposals/step-09-group-thinking-substrate.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "reasons": [
    "R7-1/R7-6 labelled neutral placement metadata and extracted-unit consequence"
  ],
  "before": {
    "claimId": "claim_45e2e391f46f70ce6e48eb2dcdcae936",
    "sourceUnitDigest": "4704ac59101e08fe8aaeb92ea9ac4d855c6ba41023b8e11344b39ccc2f56a65e",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "step-09---group-thinking-substrate",
    "targetUnitDigest": "0a1f9df2d96fcb963b53b0ffc677d95447d61c576f2c829bc511cf743fb41350",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#step-09---group-thinking-substrate (lines 1–1) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#step-09---group-thinking-substrate (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  },
  "after": {
    "claimId": "claim_45e2e391f46f70ce6e48eb2dcdcae936",
    "sourceUnitDigest": "4704ac59101e08fe8aaeb92ea9ac4d855c6ba41023b8e11344b39ccc2f56a65e",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "step-09---group-thinking-substrate",
    "targetUnitDigest": "3cf00a3c56f5c4f25a61320fd95f88fd93e01903118d429d576e70347dac8396",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#step-09---group-thinking-substrate (lines 1–1) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#step-09---group-thinking-substrate (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  }
}
```

## claim_2b571132cc8fd45580b1ec2dba340ba9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-1, lines 3–43.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-4.
Source digest: e255b7e73d3d36b05a2a2b3ffa7e65220deb77f04b8c39a036a5ead6482e7374
Target digest: dade66367ef432177726221ddcf8ffa27926128294f1bfa4d07bb6305c826eaa
Shown source SHA256: e255b7e73d3d36b05a2a2b3ffa7e65220deb77f04b8c39a036a5ead6482e7374
Shown target SHA256: dade66367ef432177726221ddcf8ffa27926128294f1bfa4d07bb6305c826eaa

### Proposed decision

```json
{
  "claimId": "claim_2b571132cc8fd45580b1ec2dba340ba9",
  "sourceUnitDigest": "e255b7e73d3d36b05a2a2b3ffa7e65220deb77f04b8c39a036a5ead6482e7374",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "dade66367ef432177726221ddcf8ffa27926128294f1bfa4d07bb6305c826eaa",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-1 (lines 3–43) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-4 (lines 27–67); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Document type: Proposal
Design status: Accepted for the implemented slice (MVP0-9 plus the Post-MVP9
Acceptance Layer); Discussion for every item this document still names as
deferred (vote/rank tally/weighted scoring/convergence, anonymization,
partial-window exceptions, aggregate transformation, cross-session grants,
`addSessionEdge`/arbitrary topology overlays, driver handoff, persistent
organization membership, peer-invited specialists — none of these are
implemented or claimed by any cell in this track).
Implementation: MVP0-5 implemented per `step-09-group-thinking-mvp1-mvp2`
(MVP1/MVP2) and `step-09-mvp3-to-mvp5` (MVP3-MVP5). MVP6-9 (§8.1's own
"Locked MVP6-MVP9 Shape") plus the Post-MVP9 Acceptance Layer (§8.2: the
Group-Thinking Protocol Pack, three conformance-proven protocol
definitions, and the `fgos-group-thinking` skill) implemented and closed by
`step-09-mvp6-to-mvp9` (Phases 00/06/07/08/09/10, including the
user-authorized P10-KERNEL-FIX quorum fix) — see that track's own
verification index for the full per-phase evidence trail and the
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md)/
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)
for the promoted contract text, each with its own named limitations.
Last reviewed: 2026-09-04
Canonical for: nothing until explicitly accepted; the implemented MVP0-9 +
Post-MVP9 Acceptance Layer slice is canonical only through the
CoordinationSession/FlowDefinition contracts it was promoted into, above —
this proposal document itself never becomes canonical by implementation
alone
Original date: 2026-09-02
Scope: preserve and narrow the next Agent Coordination design frontier after
Step 08: make fgOS able to express richer group-thinking and problem-solving
collaboration patterns without weakening the isolation-heavy fixtures already
proved by Step 08.
Intent traceability: [Architecture Intent](../architecture-intent.md),
[Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md)
Related: [Coordination Foundation Baseline](../agent-coordination/architecture/coordination-foundation-baseline.md),
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),
[Team Communication Protocol V1](../agent-coordination/proposals/team-communication-protocol-v1.md),
[Component Authority Boundary Map](component-authority-boundary-map.md),
[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md),
[Step 09 MVP1/MVP2 group-thinking verification](../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md),
[Step 09 MVP3-MVP5 verification](../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md),
[MVP6+ Dogfood Handoff](../agent-coordination/playbooks/mvp6-dogfood-handoff.md)
```

### Full target shown text

```text
Document type: Proposal
Design status: Accepted for the implemented slice (MVP0-9 plus the Post-MVP9
Acceptance Layer); Discussion for every item this document still names as
deferred (vote/rank tally/weighted scoring/convergence, anonymization,
partial-window exceptions, aggregate transformation, cross-session grants,
`addSessionEdge`/arbitrary topology overlays, driver handoff, persistent
organization membership, peer-invited specialists — none of these are
implemented or claimed by any cell in this track).
Implementation: MVP0-5 implemented per `step-09-group-thinking-mvp1-mvp2`
(MVP1/MVP2) and `step-09-mvp3-to-mvp5` (MVP3-MVP5). MVP6-9 (§8.1's own
"Locked MVP6-MVP9 Shape") plus the Post-MVP9 Acceptance Layer (§8.2: the
Group-Thinking Protocol Pack, three conformance-proven protocol
definitions, and the `fgos-group-thinking` skill) implemented and closed by
`step-09-mvp6-to-mvp9` (Phases 00/06/07/08/09/10, including the
user-authorized P10-KERNEL-FIX quorum fix) — see that track's own
verification index for the full per-phase evidence trail and the
[CoordinationSession Contract](../../architect/agent-coordination/contracts/coordination-session.md)/
[FlowDefinition Contract](../../architect/agent-coordination/contracts/flow-definition.md)
for the promoted contract text, each with its own named limitations.
Last reviewed: 2026-09-04
Canonical for: nothing until explicitly accepted; the implemented MVP0-9 +
Post-MVP9 Acceptance Layer slice is canonical only through the
CoordinationSession/FlowDefinition contracts it was promoted into, above —
this proposal document itself never becomes canonical by implementation
alone
Original date: 2026-09-02
Scope: preserve and narrow the next Agent Coordination design frontier after
Step 08: make fgOS able to express richer group-thinking and problem-solving
collaboration patterns without weakening the isolation-heavy fixtures already
proved by Step 08.
Intent traceability: [Architecture Intent](../../architect/architecture-intent.md),
[Agent Coordination Intent Preservation Ledger](../../architect/agent-coordination/intent-preservation-ledger.md)
Related: [Coordination Foundation Baseline](../../architect/agent-coordination/architecture/coordination-foundation-baseline.md),
[CoordinationSession Contract](../../architect/agent-coordination/contracts/coordination-session.md),
[FlowDefinition Contract](../../architect/agent-coordination/contracts/flow-definition.md),
[Team Communication Protocol V1](../../architect/agent-coordination/proposals/team-communication-protocol-v1.md),
[Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md),
[Step 10 Coding Domain Adoption](../../architect/proposals/step-10-coding-domain-adoption.md),
[Step 09 MVP1/MVP2 group-thinking verification](../../architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md),
[Step 09 MVP3-MVP5 verification](../../architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md),
[MVP6+ Dogfood Handoff](../../architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md)
```

## claim_881322674e920410ea8b09d0a9e7012b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-2, lines 45–68.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-5.
Source digest: e18462ad15b831301294d2589dd4584ee973586f655840507ed354b9d3cebdaa
Target digest: e18462ad15b831301294d2589dd4584ee973586f655840507ed354b9d3cebdaa
Shown source SHA256: e18462ad15b831301294d2589dd4584ee973586f655840507ed354b9d3cebdaa
Shown target SHA256: e18462ad15b831301294d2589dd4584ee973586f655840507ed354b9d3cebdaa

### Proposed decision

```json
{
  "claimId": "claim_881322674e920410ea8b09d0a9e7012b",
  "sourceUnitDigest": "e18462ad15b831301294d2589dd4584ee973586f655840507ed354b9d3cebdaa",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "e18462ad15b831301294d2589dd4584ee973586f655840507ed354b9d3cebdaa",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-2 (lines 45–68) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-5 (lines 69–92); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Implementation note (updated by `step-09-mvp6-to-mvp9`'s own closing cell,
P10.10 — Step 09 is now closed): MVP1-MVP5 promoted starting Phase 00 — see
`step-09-group-thinking-mvp1-mvp2` (MVP1/MVP2) and `step-09-mvp3-to-mvp5`
(MVP3-MVP5: recheck lineage/disposition hardening, a thin CLI launcher,
intentional role-tier dispatch policy, and session resume). MVP6 visibility
windows, MVP7 aggregation rules, MVP8 deliberation memory, and MVP9
dynamic specialist pull-in — §8.1's own "Locked MVP6-MVP9 Shape" — are now
IMPLEMENTED AND PROVEN, along with the Post-MVP9 Acceptance Layer (§8.2):
the Group-Thinking Protocol Pack, three real, conformance-proven protocol
definitions (RFC-Review-Lite, Nominal-Group-Lite, Delphi-Feedback-Lite),
and the `fgos-group-thinking` skill — see
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`
for the full evidence trail and the CoordinationSession/FlowDefinition
contracts for the promoted text. This document still does not authorize
any runtime/schema change beyond what those contracts now accept — every
item this document names elsewhere as deferred (§8.1's per-MVP "remain
deferred" clauses; §15 "Explicitly Not Proposed") is STILL deferred, not
implemented by this track: no vote/rank tally/weighted scoring/convergence
semantics, no anonymization, no partial-window exceptions, no aggregate
transformation, no cross-session grants, no `addSessionEdge`/arbitrary
topology overlay, no driver handoff, no persistent organization
membership, no peer-invited specialists. It exists so a future deferred
slice does not narrow the original intent into only the currently
convenient fixture.
```

### Full target shown text

```text
Implementation note (updated by `step-09-mvp6-to-mvp9`'s own closing cell,
P10.10 — Step 09 is now closed): MVP1-MVP5 promoted starting Phase 00 — see
`step-09-group-thinking-mvp1-mvp2` (MVP1/MVP2) and `step-09-mvp3-to-mvp5`
(MVP3-MVP5: recheck lineage/disposition hardening, a thin CLI launcher,
intentional role-tier dispatch policy, and session resume). MVP6 visibility
windows, MVP7 aggregation rules, MVP8 deliberation memory, and MVP9
dynamic specialist pull-in — §8.1's own "Locked MVP6-MVP9 Shape" — are now
IMPLEMENTED AND PROVEN, along with the Post-MVP9 Acceptance Layer (§8.2):
the Group-Thinking Protocol Pack, three real, conformance-proven protocol
definitions (RFC-Review-Lite, Nominal-Group-Lite, Delphi-Feedback-Lite),
and the `fgos-group-thinking` skill — see
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`
for the full evidence trail and the CoordinationSession/FlowDefinition
contracts for the promoted text. This document still does not authorize
any runtime/schema change beyond what those contracts now accept — every
item this document names elsewhere as deferred (§8.1's per-MVP "remain
deferred" clauses; §15 "Explicitly Not Proposed") is STILL deferred, not
implemented by this track: no vote/rank tally/weighted scoring/convergence
semantics, no anonymization, no partial-window exceptions, no aggregate
transformation, no cross-session grants, no `addSessionEdge`/arbitrary
topology overlay, no driver handoff, no persistent organization
membership, no peer-invited specialists. It exists so a future deferred
slice does not narrow the original intent into only the currently
convenient fixture.
```

## claim_8e6ed52741f2530c267e6667c64b6214

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#1-why-this-step-exists, lines 70–70.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#1-why-this-step-exists.
Source digest: ed8cf54ea6ba899cf648dde82977751ad61d99d3835de16ad4a141e3a9b6a04e
Target digest: ed8cf54ea6ba899cf648dde82977751ad61d99d3835de16ad4a141e3a9b6a04e
Shown source SHA256: a807d474857bc64fd56b651fa8c6858baa0a110e4dbaa41d57a379b8659d9df0
Shown target SHA256: a807d474857bc64fd56b651fa8c6858baa0a110e4dbaa41d57a379b8659d9df0

### Proposed decision

```json
{
  "claimId": "claim_8e6ed52741f2530c267e6667c64b6214",
  "sourceUnitDigest": "ed8cf54ea6ba899cf648dde82977751ad61d99d3835de16ad4a141e3a9b6a04e",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "1-why-this-step-exists",
  "targetUnitDigest": "ed8cf54ea6ba899cf648dde82977751ad61d99d3835de16ad4a141e3a9b6a04e",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#1-why-this-step-exists (lines 70–70) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#1-why-this-step-exists (lines 94–94); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 1. Why This Step Exists

The original plan after Step 08 was to make Coding Domain consume the
coordination foundation. During Step 01-08 implementation, the manual
Master Coordination Prompt worked well enough to expose a separate question:

```txt
Can Agent Coordination itself express the group-thinking loop that the manual
Master Coordinator used successfully?
```

That loop is not a Coding Domain adoption effort. It is a standalone
coordination capability proof: Doer, Reviewer, Fixer, Red-Team, recheck, and a
persistent external coordinator deciding whether to continue or stop. It does
not require Work lifecycle, Work status/stage, git merge, or coding-domain
mutation authority.

The current foundation can express static declared graphs, mediated consult,
bounded fan-out/fan-in, evidence refs, retry, replacement, and synthesis. It
cannot yet express a bounded adaptive group-thinking loop cleanly: optional
follow-up rounds, recheck distinct from retry, driver authorization, and
disposition are still ad hoc.
````

### Full target shown text

````text
## 1. Why This Step Exists

The original plan after Step 08 was to make Coding Domain consume the
coordination foundation. During Step 01-08 implementation, the manual
Master Coordination Prompt worked well enough to expose a separate question:

```txt
Can Agent Coordination itself express the group-thinking loop that the manual
Master Coordinator used successfully?
```

That loop is not a Coding Domain adoption effort. It is a standalone
coordination capability proof: Doer, Reviewer, Fixer, Red-Team, recheck, and a
persistent external coordinator deciding whether to continue or stop. It does
not require Work lifecycle, Work status/stage, git merge, or coding-domain
mutation authority.

The current foundation can express static declared graphs, mediated consult,
bounded fan-out/fan-in, evidence refs, retry, replacement, and synthesis. It
cannot yet express a bounded adaptive group-thinking loop cleanly: optional
follow-up rounds, recheck distinct from retry, driver authorization, and
disposition are still ad hoc.
````

## claim_0163b52a36cd825291928d20bbc0b46c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-3, lines 72–74.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-6.
Source digest: 2b884f73a73d13d1926cab6f54985605ee8dd6a925e9a525809009a30bb9cf27
Target digest: 2b884f73a73d13d1926cab6f54985605ee8dd6a925e9a525809009a30bb9cf27
Shown source SHA256: 2b884f73a73d13d1926cab6f54985605ee8dd6a925e9a525809009a30bb9cf27
Shown target SHA256: 2b884f73a73d13d1926cab6f54985605ee8dd6a925e9a525809009a30bb9cf27

### Proposed decision

```json
{
  "claimId": "claim_0163b52a36cd825291928d20bbc0b46c",
  "sourceUnitDigest": "2b884f73a73d13d1926cab6f54985605ee8dd6a925e9a525809009a30bb9cf27",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "2b884f73a73d13d1926cab6f54985605ee8dd6a925e9a525809009a30bb9cf27",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "1. Why This Step Exists"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-3 (lines 72–74) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-6 (lines 96–98); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The original plan after Step 08 was to make Coding Domain consume the
coordination foundation. During Step 01-08 implementation, the manual
Master Coordination Prompt worked well enough to expose a separate question:
```

### Full target shown text

```text
The original plan after Step 08 was to make Coding Domain consume the
coordination foundation. During Step 01-08 implementation, the manual
Master Coordination Prompt worked well enough to expose a separate question:
```

## claim_c730a7ff8b5ddac740747426f949d067

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-4, lines 76–79.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-7.
Source digest: c3507a9c8c2d7012ea92ff4e9daa5431c8e52da42630f9fcf8cf23dd0af91af5
Target digest: c3507a9c8c2d7012ea92ff4e9daa5431c8e52da42630f9fcf8cf23dd0af91af5
Shown source SHA256: c3507a9c8c2d7012ea92ff4e9daa5431c8e52da42630f9fcf8cf23dd0af91af5
Shown target SHA256: c3507a9c8c2d7012ea92ff4e9daa5431c8e52da42630f9fcf8cf23dd0af91af5

### Proposed decision

```json
{
  "claimId": "claim_c730a7ff8b5ddac740747426f949d067",
  "sourceUnitDigest": "c3507a9c8c2d7012ea92ff4e9daa5431c8e52da42630f9fcf8cf23dd0af91af5",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "c3507a9c8c2d7012ea92ff4e9daa5431c8e52da42630f9fcf8cf23dd0af91af5",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "1. Why This Step Exists"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-4 (lines 76–79) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-7 (lines 100–103); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Can Agent Coordination itself express the group-thinking loop that the manual
Master Coordinator used successfully?
```
````

### Full target shown text

````text
```txt
Can Agent Coordination itself express the group-thinking loop that the manual
Master Coordinator used successfully?
```
````

## claim_b6d8a2bee384c754274409bbd6abebf2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-5, lines 81–85.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-8.
Source digest: a2e0884baa8e30bd4b31f30711e3c494715e3c04a118b796ab62424469aa010e
Target digest: a2e0884baa8e30bd4b31f30711e3c494715e3c04a118b796ab62424469aa010e
Shown source SHA256: a2e0884baa8e30bd4b31f30711e3c494715e3c04a118b796ab62424469aa010e
Shown target SHA256: a2e0884baa8e30bd4b31f30711e3c494715e3c04a118b796ab62424469aa010e

### Proposed decision

```json
{
  "claimId": "claim_b6d8a2bee384c754274409bbd6abebf2",
  "sourceUnitDigest": "a2e0884baa8e30bd4b31f30711e3c494715e3c04a118b796ab62424469aa010e",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "a2e0884baa8e30bd4b31f30711e3c494715e3c04a118b796ab62424469aa010e",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "1. Why This Step Exists"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-5 (lines 81–85) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-8 (lines 105–109); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
That loop is not a Coding Domain adoption effort. It is a standalone
coordination capability proof: Doer, Reviewer, Fixer, Red-Team, recheck, and a
persistent external coordinator deciding whether to continue or stop. It does
not require Work lifecycle, Work status/stage, git merge, or coding-domain
mutation authority.
```

### Full target shown text

```text
That loop is not a Coding Domain adoption effort. It is a standalone
coordination capability proof: Doer, Reviewer, Fixer, Red-Team, recheck, and a
persistent external coordinator deciding whether to continue or stop. It does
not require Work lifecycle, Work status/stage, git merge, or coding-domain
mutation authority.
```

## claim_52d7ec56dc03f7794238259798fc6a84

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-6, lines 87–91.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-9.
Source digest: 61df011cca0a66f182686e863a1e50d93a55231297ab1a6300b7c0e7d113e4ef
Target digest: 61df011cca0a66f182686e863a1e50d93a55231297ab1a6300b7c0e7d113e4ef
Shown source SHA256: 61df011cca0a66f182686e863a1e50d93a55231297ab1a6300b7c0e7d113e4ef
Shown target SHA256: 61df011cca0a66f182686e863a1e50d93a55231297ab1a6300b7c0e7d113e4ef

### Proposed decision

```json
{
  "claimId": "claim_52d7ec56dc03f7794238259798fc6a84",
  "sourceUnitDigest": "61df011cca0a66f182686e863a1e50d93a55231297ab1a6300b7c0e7d113e4ef",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "61df011cca0a66f182686e863a1e50d93a55231297ab1a6300b7c0e7d113e4ef",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "1. Why This Step Exists"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-6 (lines 87–91) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-9 (lines 111–115); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The current foundation can express static declared graphs, mediated consult,
bounded fan-out/fan-in, evidence refs, retry, replacement, and synthesis. It
cannot yet express a bounded adaptive group-thinking loop cleanly: optional
follow-up rounds, recheck distinct from retry, driver authorization, and
disposition are still ad hoc.
```

### Full target shown text

```text
The current foundation can express static declared graphs, mediated consult,
bounded fan-out/fan-in, evidence refs, retry, replacement, and synthesis. It
cannot yet express a bounded adaptive group-thinking loop cleanly: optional
follow-up rounds, recheck distinct from retry, driver authorization, and
disposition are still ad hoc.
```

## claim_ae7a9e514e23ea99fe7cfc930d798b42

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#2-intent-guardrail, lines 93–93.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#2-intent-guardrail.
Source digest: 4d20445a472c04246f8261d1f0c038eee8ab82dd923f9ea70e56bae83f887cb5
Target digest: 4dc79412839b6a867f5db44209a72950977a22130c3def4e2e2b7e8c3ea4083d
Shown source SHA256: 3f326b84766b3895f283b5afa0ec727f8420476eb1be2542372b10f542d5f314
Shown target SHA256: 1533c5613b26c5619f3e3f11b06f8fc4bb82098509a79487563823cc37b3b2e1

### Proposed decision

```json
{
  "claimId": "claim_ae7a9e514e23ea99fe7cfc930d798b42",
  "sourceUnitDigest": "4d20445a472c04246f8261d1f0c038eee8ab82dd923f9ea70e56bae83f887cb5",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "2-intent-guardrail",
  "targetUnitDigest": "4dc79412839b6a867f5db44209a72950977a22130c3def4e2e2b7e8c3ea4083d",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#2-intent-guardrail (lines 93–93) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#2-intent-guardrail (lines 117–117); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 2. Intent Guardrail

Step 09 must keep the design open to future group collaboration mechanisms
without implementing all of them now. "Open" means the core has declared
extension points and fixture-local posture; it does not mean global peer chat,
unbounded dynamic topology, or weakening proven invariants.

The capability map remains the group-thinking axes from
[Architecture Intent](../architecture-intent.md):

- topology shape;
- timing;
- role symmetry;
- information visibility;
- control regime / meta-authority;
- feedback loop;
- decision / aggregation rule;
- deliberation memory;
- speech acts.

These axes are not one implementation backlog. They are the map that prevents a
small MVP from hardcoding itself into the only collaboration shape fgOS can
ever express.
```

### Full target shown text

```text
## 2. Intent Guardrail

Step 09 must keep the design open to future group collaboration mechanisms
without implementing all of them now. "Open" means the core has declared
extension points and fixture-local posture; it does not mean global peer chat,
unbounded dynamic topology, or weakening proven invariants.

The capability map remains the group-thinking axes from
[Architecture Intent](../../architect/architecture-intent.md):

- topology shape;
- timing;
- role symmetry;
- information visibility;
- control regime / meta-authority;
- feedback loop;
- decision / aggregation rule;
- deliberation memory;
- speech acts.

These axes are not one implementation backlog. They are the map that prevents a
small MVP from hardcoding itself into the only collaboration shape fgOS can
ever express.
```

## claim_0a9f610a3b20d4a1f5acd024bd9172b9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-7, lines 95–98.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-10.
Source digest: 8e84c59bff13b8a03571609b76282ae19404bcb8225f6f88ecbdde85329ddd1d
Target digest: 8e84c59bff13b8a03571609b76282ae19404bcb8225f6f88ecbdde85329ddd1d
Shown source SHA256: 8e84c59bff13b8a03571609b76282ae19404bcb8225f6f88ecbdde85329ddd1d
Shown target SHA256: 8e84c59bff13b8a03571609b76282ae19404bcb8225f6f88ecbdde85329ddd1d

### Proposed decision

```json
{
  "claimId": "claim_0a9f610a3b20d4a1f5acd024bd9172b9",
  "sourceUnitDigest": "8e84c59bff13b8a03571609b76282ae19404bcb8225f6f88ecbdde85329ddd1d",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "8e84c59bff13b8a03571609b76282ae19404bcb8225f6f88ecbdde85329ddd1d",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "2. Intent Guardrail"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-7 (lines 95–98) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-10 (lines 119–122); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Step 09 must keep the design open to future group collaboration mechanisms
without implementing all of them now. "Open" means the core has declared
extension points and fixture-local posture; it does not mean global peer chat,
unbounded dynamic topology, or weakening proven invariants.
```

### Full target shown text

```text
Step 09 must keep the design open to future group collaboration mechanisms
without implementing all of them now. "Open" means the core has declared
extension points and fixture-local posture; it does not mean global peer chat,
unbounded dynamic topology, or weakening proven invariants.
```

## claim_e5de5fe180ff63066d0977970e5e53e3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-8, lines 100–101.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-11.
Source digest: 8e15bb7f5b38643a093d24f58e4d2b974efe3395b9683247490cf0355a8d631d
Target digest: e4de43f774db5f89a02336e2ee84cf0dbae525e5d95693a68163cee1dea9dd46
Shown source SHA256: 8e15bb7f5b38643a093d24f58e4d2b974efe3395b9683247490cf0355a8d631d
Shown target SHA256: e4de43f774db5f89a02336e2ee84cf0dbae525e5d95693a68163cee1dea9dd46

### Proposed decision

```json
{
  "claimId": "claim_e5de5fe180ff63066d0977970e5e53e3",
  "sourceUnitDigest": "8e15bb7f5b38643a093d24f58e4d2b974efe3395b9683247490cf0355a8d631d",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "e4de43f774db5f89a02336e2ee84cf0dbae525e5d95693a68163cee1dea9dd46",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "2. Intent Guardrail"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-8 (lines 100–101) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-11 (lines 124–125); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The capability map remains the group-thinking axes from
[Architecture Intent](../architecture-intent.md):
```

### Full target shown text

```text
The capability map remains the group-thinking axes from
[Architecture Intent](../../architect/architecture-intent.md):
```

## claim_62c0e0eda98fb826f31d02b5754f06e7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-9, lines 103–111.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-12.
Source digest: c59d6f1487efca1cce23e6e3f10de135a1213df9e7a4328196fdeca1d955b469
Target digest: c59d6f1487efca1cce23e6e3f10de135a1213df9e7a4328196fdeca1d955b469
Shown source SHA256: c59d6f1487efca1cce23e6e3f10de135a1213df9e7a4328196fdeca1d955b469
Shown target SHA256: c59d6f1487efca1cce23e6e3f10de135a1213df9e7a4328196fdeca1d955b469

### Proposed decision

```json
{
  "claimId": "claim_62c0e0eda98fb826f31d02b5754f06e7",
  "sourceUnitDigest": "c59d6f1487efca1cce23e6e3f10de135a1213df9e7a4328196fdeca1d955b469",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "c59d6f1487efca1cce23e6e3f10de135a1213df9e7a4328196fdeca1d955b469",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "2. Intent Guardrail"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-9 (lines 103–111) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-12 (lines 127–135); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- topology shape;
- timing;
- role symmetry;
- information visibility;
- control regime / meta-authority;
- feedback loop;
- decision / aggregation rule;
- deliberation memory;
- speech acts.
```

### Full target shown text

```text
- topology shape;
- timing;
- role symmetry;
- information visibility;
- control regime / meta-authority;
- feedback loop;
- decision / aggregation rule;
- deliberation memory;
- speech acts.
```

## claim_174d8a66ad3bca26c8a40747789f1c1d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-10, lines 113–115.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-13.
Source digest: 6fb8e5f2421e2582a217ca7206472bc4c638124923815d4ebff6f78990be8235
Target digest: 6fb8e5f2421e2582a217ca7206472bc4c638124923815d4ebff6f78990be8235
Shown source SHA256: 6fb8e5f2421e2582a217ca7206472bc4c638124923815d4ebff6f78990be8235
Shown target SHA256: 6fb8e5f2421e2582a217ca7206472bc4c638124923815d4ebff6f78990be8235

### Proposed decision

```json
{
  "claimId": "claim_174d8a66ad3bca26c8a40747789f1c1d",
  "sourceUnitDigest": "6fb8e5f2421e2582a217ca7206472bc4c638124923815d4ebff6f78990be8235",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "6fb8e5f2421e2582a217ca7206472bc4c638124923815d4ebff6f78990be8235",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "2. Intent Guardrail"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-10 (lines 113–115) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-13 (lines 137–139); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
These axes are not one implementation backlog. They are the map that prevents a
small MVP from hardcoding itself into the only collaboration shape fgOS can
ever express.
```

### Full target shown text

```text
These axes are not one implementation backlog. They are the map that prevents a
small MVP from hardcoding itself into the only collaboration shape fgOS can
ever express.
```

## claim_570e1c2ddb5f1c4050b0ac45bbb803c1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#3-non-negotiables, lines 117–117.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#3-non-negotiables.
Source digest: 29a5b79e9d4c4d288d8a2c92b14b0b1078aa184151928f4dfd0006d450701afe
Target digest: 29a5b79e9d4c4d288d8a2c92b14b0b1078aa184151928f4dfd0006d450701afe
Shown source SHA256: 991e2cb3c7a49360b51f93f7866e7b3dc4e8e3daa4cd6f0f585c732ad44587f0
Shown target SHA256: 991e2cb3c7a49360b51f93f7866e7b3dc4e8e3daa4cd6f0f585c732ad44587f0

### Proposed decision

```json
{
  "claimId": "claim_570e1c2ddb5f1c4050b0ac45bbb803c1",
  "sourceUnitDigest": "29a5b79e9d4c4d288d8a2c92b14b0b1078aa184151928f4dfd0006d450701afe",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "3-non-negotiables",
  "targetUnitDigest": "29a5b79e9d4c4d288d8a2c92b14b0b1078aa184151928f4dfd0006d450701afe",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#3-non-negotiables (lines 117–117) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#3-non-negotiables (lines 141–141); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 3. Non-Negotiables

- Do not change or loosen `group-cognition-framework.yaml`; it remains the
  isolation-heavy R3 proof fixture.
- Do not reopen evidence immutability, governance-final dispatch, budget caps,
  path safety, or mutation exclusivity.
- Do not introduce an autonomous in-graph leader. The persistent coordinator
  or driver authority stays outside the declared worker graph.
- Do not require Work. Step 09 is standalone coordination first.
- Do not move Work lifecycle, git, merge, status/stage, or coding-domain
  mutation authority into Agent Coordination.
- Do not make this proposal accepted design before it is promoted through the
  documentation governance path.
```

### Full target shown text

```text
## 3. Non-Negotiables

- Do not change or loosen `group-cognition-framework.yaml`; it remains the
  isolation-heavy R3 proof fixture.
- Do not reopen evidence immutability, governance-final dispatch, budget caps,
  path safety, or mutation exclusivity.
- Do not introduce an autonomous in-graph leader. The persistent coordinator
  or driver authority stays outside the declared worker graph.
- Do not require Work. Step 09 is standalone coordination first.
- Do not move Work lifecycle, git, merge, status/stage, or coding-domain
  mutation authority into Agent Coordination.
- Do not make this proposal accepted design before it is promoted through the
  documentation governance path.
```

## claim_677089d2a5a67f71bbbd8ba21261b1f5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-11, lines 119–129.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-14.
Source digest: 187171a922d3497695d4c740f5099a11b80cbf328fd1e7f86ce6c58cb0a5ba9c
Target digest: 187171a922d3497695d4c740f5099a11b80cbf328fd1e7f86ce6c58cb0a5ba9c
Shown source SHA256: 187171a922d3497695d4c740f5099a11b80cbf328fd1e7f86ce6c58cb0a5ba9c
Shown target SHA256: 187171a922d3497695d4c740f5099a11b80cbf328fd1e7f86ce6c58cb0a5ba9c

### Proposed decision

```json
{
  "claimId": "claim_677089d2a5a67f71bbbd8ba21261b1f5",
  "sourceUnitDigest": "187171a922d3497695d4c740f5099a11b80cbf328fd1e7f86ce6c58cb0a5ba9c",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "187171a922d3497695d4c740f5099a11b80cbf328fd1e7f86ce6c58cb0a5ba9c",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "3. Non-Negotiables"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-11 (lines 119–129) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-14 (lines 143–153); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Do not change or loosen `group-cognition-framework.yaml`; it remains the
  isolation-heavy R3 proof fixture.
- Do not reopen evidence immutability, governance-final dispatch, budget caps,
  path safety, or mutation exclusivity.
- Do not introduce an autonomous in-graph leader. The persistent coordinator
  or driver authority stays outside the declared worker graph.
- Do not require Work. Step 09 is standalone coordination first.
- Do not move Work lifecycle, git, merge, status/stage, or coding-domain
  mutation authority into Agent Coordination.
- Do not make this proposal accepted design before it is promoted through the
  documentation governance path.
```

### Full target shown text

```text
- Do not change or loosen `group-cognition-framework.yaml`; it remains the
  isolation-heavy R3 proof fixture.
- Do not reopen evidence immutability, governance-final dispatch, budget caps,
  path safety, or mutation exclusivity.
- Do not introduce an autonomous in-graph leader. The persistent coordinator
  or driver authority stays outside the declared worker graph.
- Do not require Work. Step 09 is standalone coordination first.
- Do not move Work lifecycle, git, merge, status/stage, or coding-domain
  mutation authority into Agent Coordination.
- Do not make this proposal accepted design before it is promoted through the
  documentation governance path.
```

## claim_ca48d09ae0346a5ddd622e71921be554

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#4-stable-spine, lines 131–131.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#4-stable-spine.
Source digest: d92c3488ac319e76036b656596b585e25dbce4e46ffba1783107486c11c2145e
Target digest: d92c3488ac319e76036b656596b585e25dbce4e46ffba1783107486c11c2145e
Shown source SHA256: fbbe09a15e0c0682b781954511fc5420ebfd6193ad87b1d595b98577cd48e752
Shown target SHA256: fbbe09a15e0c0682b781954511fc5420ebfd6193ad87b1d595b98577cd48e752

### Proposed decision

```json
{
  "claimId": "claim_ca48d09ae0346a5ddd622e71921be554",
  "sourceUnitDigest": "d92c3488ac319e76036b656596b585e25dbce4e46ffba1783107486c11c2145e",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "4-stable-spine",
  "targetUnitDigest": "d92c3488ac319e76036b656596b585e25dbce4e46ffba1783107486c11c2145e",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#4-stable-spine (lines 131–131) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#4-stable-spine (lines 155–155); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 4. Stable Spine

The step's stable architecture direction is the spine below. Later MVPs may
add capability layers, but should not replace this shape just because a new
group-thinking method appears:

```txt
FlowDefinition = static legality envelope
CoordinationSession = event-sourced runtime ledger
External driver = adaptive authority outside the worker graph
Assignment / Run / RunResult = execution and evidence path
Context grant = visibility and memory access path
Skill / surface = thin launcher only
```

The first useful fixture should be `standalone-master-coordination-loop`, a
CoordinationProtocol-profile FlowDefinition plus a small runtime primitive for
driver-authorized declared rounds. The input can be a plan or artifact file.

Target flow:

```txt
external coordinator / session driver
  -> doer receives plan.md / artifact.md and produces candidate artifact
  -> reviewer reviews the candidate artifact
  -> red-team challenges the candidate artifact
  -> coordinator reads evidence and records disposition
  -> optional fixer or doer-followup produces revision
  -> reviewer or red-team rechecks revision
  -> coordinator records final disposition and closes session
```

The coordinator is not a `spec.actors[]` worker. It is the durable authority
that reads RunResults/evidence, authorizes optional rounds, records
disposition, and decides terminal session status within declared bounds.
````

### Full target shown text

````text
## 4. Stable Spine

The step's stable architecture direction is the spine below. Later MVPs may
add capability layers, but should not replace this shape just because a new
group-thinking method appears:

```txt
FlowDefinition = static legality envelope
CoordinationSession = event-sourced runtime ledger
External driver = adaptive authority outside the worker graph
Assignment / Run / RunResult = execution and evidence path
Context grant = visibility and memory access path
Skill / surface = thin launcher only
```

The first useful fixture should be `standalone-master-coordination-loop`, a
CoordinationProtocol-profile FlowDefinition plus a small runtime primitive for
driver-authorized declared rounds. The input can be a plan or artifact file.

Target flow:

```txt
external coordinator / session driver
  -> doer receives plan.md / artifact.md and produces candidate artifact
  -> reviewer reviews the candidate artifact
  -> red-team challenges the candidate artifact
  -> coordinator reads evidence and records disposition
  -> optional fixer or doer-followup produces revision
  -> reviewer or red-team rechecks revision
  -> coordinator records final disposition and closes session
```

The coordinator is not a `spec.actors[]` worker. It is the durable authority
that reads RunResults/evidence, authorizes optional rounds, records
disposition, and decides terminal session status within declared bounds.
````

## claim_411141cdf5ee58ac7218915a0b37c72b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-12, lines 133–135.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-15.
Source digest: 3b713d7b1a4e9c701bcf2bfda548ce253f8f0e310842d7743e3225b5edddce3a
Target digest: 3b713d7b1a4e9c701bcf2bfda548ce253f8f0e310842d7743e3225b5edddce3a
Shown source SHA256: 3b713d7b1a4e9c701bcf2bfda548ce253f8f0e310842d7743e3225b5edddce3a
Shown target SHA256: 3b713d7b1a4e9c701bcf2bfda548ce253f8f0e310842d7743e3225b5edddce3a

### Proposed decision

```json
{
  "claimId": "claim_411141cdf5ee58ac7218915a0b37c72b",
  "sourceUnitDigest": "3b713d7b1a4e9c701bcf2bfda548ce253f8f0e310842d7743e3225b5edddce3a",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "3b713d7b1a4e9c701bcf2bfda548ce253f8f0e310842d7743e3225b5edddce3a",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "4. Stable Spine"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-12 (lines 133–135) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-15 (lines 157–159); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The step's stable architecture direction is the spine below. Later MVPs may
add capability layers, but should not replace this shape just because a new
group-thinking method appears:
```

### Full target shown text

```text
The step's stable architecture direction is the spine below. Later MVPs may
add capability layers, but should not replace this shape just because a new
group-thinking method appears:
```

## claim_840485a93135d119ffcce9f8b2039e72

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-13, lines 137–144.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-16.
Source digest: 966147104e6b4c1b53031ac4733a03dcd6cdf947946de9ab5f8156eeb8e01a71
Target digest: 966147104e6b4c1b53031ac4733a03dcd6cdf947946de9ab5f8156eeb8e01a71
Shown source SHA256: 966147104e6b4c1b53031ac4733a03dcd6cdf947946de9ab5f8156eeb8e01a71
Shown target SHA256: 966147104e6b4c1b53031ac4733a03dcd6cdf947946de9ab5f8156eeb8e01a71

### Proposed decision

```json
{
  "claimId": "claim_840485a93135d119ffcce9f8b2039e72",
  "sourceUnitDigest": "966147104e6b4c1b53031ac4733a03dcd6cdf947946de9ab5f8156eeb8e01a71",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "966147104e6b4c1b53031ac4733a03dcd6cdf947946de9ab5f8156eeb8e01a71",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "4. Stable Spine"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-13 (lines 137–144) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-16 (lines 161–168); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
FlowDefinition = static legality envelope
CoordinationSession = event-sourced runtime ledger
External driver = adaptive authority outside the worker graph
Assignment / Run / RunResult = execution and evidence path
Context grant = visibility and memory access path
Skill / surface = thin launcher only
```
````

### Full target shown text

````text
```txt
FlowDefinition = static legality envelope
CoordinationSession = event-sourced runtime ledger
External driver = adaptive authority outside the worker graph
Assignment / Run / RunResult = execution and evidence path
Context grant = visibility and memory access path
Skill / surface = thin launcher only
```
````

## claim_fc179d6f549b4c13e169a2882908bb6a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-14, lines 146–148.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-17.
Source digest: 8db6b093bd5011fe64bd861a2273c4bdf8a6d481b2215886c8b7f1275b979ed6
Target digest: 8db6b093bd5011fe64bd861a2273c4bdf8a6d481b2215886c8b7f1275b979ed6
Shown source SHA256: 8db6b093bd5011fe64bd861a2273c4bdf8a6d481b2215886c8b7f1275b979ed6
Shown target SHA256: 8db6b093bd5011fe64bd861a2273c4bdf8a6d481b2215886c8b7f1275b979ed6

### Proposed decision

```json
{
  "claimId": "claim_fc179d6f549b4c13e169a2882908bb6a",
  "sourceUnitDigest": "8db6b093bd5011fe64bd861a2273c4bdf8a6d481b2215886c8b7f1275b979ed6",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "8db6b093bd5011fe64bd861a2273c4bdf8a6d481b2215886c8b7f1275b979ed6",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "4. Stable Spine"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-14 (lines 146–148) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-17 (lines 170–172); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The first useful fixture should be `standalone-master-coordination-loop`, a
CoordinationProtocol-profile FlowDefinition plus a small runtime primitive for
driver-authorized declared rounds. The input can be a plan or artifact file.
```

### Full target shown text

```text
The first useful fixture should be `standalone-master-coordination-loop`, a
CoordinationProtocol-profile FlowDefinition plus a small runtime primitive for
driver-authorized declared rounds. The input can be a plan or artifact file.
```

## claim_fcf4aaf0c38ed78f46f4338f09801909

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-15, lines 150–161.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-18.
Source digest: 7dc25ffedfbf67ee933126418c2703fc6b6ea15000e2ab5a4920da1681799207
Target digest: 7dc25ffedfbf67ee933126418c2703fc6b6ea15000e2ab5a4920da1681799207
Shown source SHA256: 7dc25ffedfbf67ee933126418c2703fc6b6ea15000e2ab5a4920da1681799207
Shown target SHA256: 7dc25ffedfbf67ee933126418c2703fc6b6ea15000e2ab5a4920da1681799207

### Proposed decision

```json
{
  "claimId": "claim_fcf4aaf0c38ed78f46f4338f09801909",
  "sourceUnitDigest": "7dc25ffedfbf67ee933126418c2703fc6b6ea15000e2ab5a4920da1681799207",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "7dc25ffedfbf67ee933126418c2703fc6b6ea15000e2ab5a4920da1681799207",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "4. Stable Spine"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-15 (lines 150–161) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-18 (lines 174–185); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Target flow:

```txt
external coordinator / session driver
  -> doer receives plan.md / artifact.md and produces candidate artifact
  -> reviewer reviews the candidate artifact
  -> red-team challenges the candidate artifact
  -> coordinator reads evidence and records disposition
  -> optional fixer or doer-followup produces revision
  -> reviewer or red-team rechecks revision
  -> coordinator records final disposition and closes session
```
````

### Full target shown text

````text
Target flow:

```txt
external coordinator / session driver
  -> doer receives plan.md / artifact.md and produces candidate artifact
  -> reviewer reviews the candidate artifact
  -> red-team challenges the candidate artifact
  -> coordinator reads evidence and records disposition
  -> optional fixer or doer-followup produces revision
  -> reviewer or red-team rechecks revision
  -> coordinator records final disposition and closes session
```
````

## claim_267ea45d6652de06caced7c981f02017

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-16, lines 163–165.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-19.
Source digest: ab7179f4ce11cebef8cf85a214472ea3a1fa2ab600977ea2ec5f763b1d282af9
Target digest: ab7179f4ce11cebef8cf85a214472ea3a1fa2ab600977ea2ec5f763b1d282af9
Shown source SHA256: ab7179f4ce11cebef8cf85a214472ea3a1fa2ab600977ea2ec5f763b1d282af9
Shown target SHA256: ab7179f4ce11cebef8cf85a214472ea3a1fa2ab600977ea2ec5f763b1d282af9

### Proposed decision

```json
{
  "claimId": "claim_267ea45d6652de06caced7c981f02017",
  "sourceUnitDigest": "ab7179f4ce11cebef8cf85a214472ea3a1fa2ab600977ea2ec5f763b1d282af9",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "ab7179f4ce11cebef8cf85a214472ea3a1fa2ab600977ea2ec5f763b1d282af9",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "4. Stable Spine"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-16 (lines 163–165) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-19 (lines 187–189); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The coordinator is not a `spec.actors[]` worker. It is the durable authority
that reads RunResults/evidence, authorizes optional rounds, records
disposition, and decides terminal session status within declared bounds.
```

### Full target shown text

```text
The coordinator is not a `spec.actors[]` worker. It is the durable authority
that reads RunResults/evidence, authorizes optional rounds, records
disposition, and decides terminal session status within declared bounds.
```

## claim_3865318571c3ebc0fed1203eddbca0c1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency, lines 167–167.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency.
Source digest: e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457
Target digest: ae8a662d909b551afc353c70333e4086f5cef65daa92a6daa1860b58567d4db9
Shown source SHA256: 33d42f1eeaf4f7b3780bb56f7570f1ce80b150cd20751d24b607f97822a3cf3a
Shown target SHA256: 16f98f73c8161bf89a8e9cd9b96e10da78ac3b993ea7f5ce9c2b1cf9cb335b12

### Proposed decision

```json
{
  "claimId": "claim_3865318571c3ebc0fed1203eddbca0c1",
  "sourceUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "5-prompt-source-not-runtime-dependency",
  "targetUnitDigest": "ae8a662d909b551afc353c70333e4086f5cef65daa92a6daa1860b58567d4db9",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 167–167) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 191–191); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 5. Prompt Source, Not Runtime Dependency

The manual proof source is
[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),
backed by the
[Coordination Operating Harness](../agent-coordination/playbooks/coordination-operating-harness.md).
Those playbooks are not loaded by runtime and must not become hidden runtime
prose. Their value for Step 09 is the operating shape they proved:

```txt
external coordinator owns durable state and stop/go authority
  -> doer produces a bounded candidate
  -> reviewer independently checks correctness/regression
  -> red-team independently attacks invariants and false-success paths
  -> coordinator dispositions findings
  -> fixer/doer-followup handles accepted findings only
  -> reviewer/red-team recheck the new revision
  -> coordinator closes, blocks, or authorizes another declared round
```

Step 09 extracts that shape into declared FlowDefinition/session primitives. It
does not paste the prompt into product runtime, and it does not make the prompt
the authority for Work, git, merge, approval, or lifecycle mutation.
````

### Full target shown text

````text
## 5. Prompt Source, Not Runtime Dependency

The manual proof source is
[Master Multi-Agent Implementation Coordinator](../../architect/agent-coordination/playbooks/prompts/master-coordinator.md),
backed by the
[Coordination Operating Harness](../../architect/agent-coordination/playbooks/coordination-operating-harness.md).
Those playbooks are not loaded by runtime and must not become hidden runtime
prose. Their value for Step 09 is the operating shape they proved:

```txt
external coordinator owns durable state and stop/go authority
  -> doer produces a bounded candidate
  -> reviewer independently checks correctness/regression
  -> red-team independently attacks invariants and false-success paths
  -> coordinator dispositions findings
  -> fixer/doer-followup handles accepted findings only
  -> reviewer/red-team recheck the new revision
  -> coordinator closes, blocks, or authorizes another declared round
```

Step 09 extracts that shape into declared FlowDefinition/session primitives. It
does not paste the prompt into product runtime, and it does not make the prompt
the authority for Work, git, merge, approval, or lifecycle mutation.
````

## claim_77e26521b60e819e54cd3ddaebf8f20f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-17, lines 169–174.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-20.
Source digest: 74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898
Target digest: 15d5ed596398980d281b469c3068d4d9963149350c65c8c041afe4f07f6fc3e0
Shown source SHA256: 74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898
Shown target SHA256: 15d5ed596398980d281b469c3068d4d9963149350c65c8c041afe4f07f6fc3e0

### Proposed decision

```json
{
  "claimId": "claim_77e26521b60e819e54cd3ddaebf8f20f",
  "sourceUnitDigest": "74a1489a661f1f1399df4300f3d2e1ec8660b9de9ab89583d3d0b1dc05e94898",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "15d5ed596398980d281b469c3068d4d9963149350c65c8c041afe4f07f6fc3e0",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "5. Prompt Source, Not Runtime Dependency"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-17 (lines 169–174) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-20 (lines 193–198); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The manual proof source is
[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),
backed by the
[Coordination Operating Harness](../agent-coordination/playbooks/coordination-operating-harness.md).
Those playbooks are not loaded by runtime and must not become hidden runtime
prose. Their value for Step 09 is the operating shape they proved:
```

### Full target shown text

```text
The manual proof source is
[Master Multi-Agent Implementation Coordinator](../../architect/agent-coordination/playbooks/prompts/master-coordinator.md),
backed by the
[Coordination Operating Harness](../../architect/agent-coordination/playbooks/coordination-operating-harness.md).
Those playbooks are not loaded by runtime and must not become hidden runtime
prose. Their value for Step 09 is the operating shape they proved:
```

## claim_abab70a0365ac246c96517ab7177daec

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-18, lines 176–185.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-21.
Source digest: c9ca3f55b0ff037964bd2934c6a785e41744e34f71f2b32d86d009dcfafb4883
Target digest: c9ca3f55b0ff037964bd2934c6a785e41744e34f71f2b32d86d009dcfafb4883
Shown source SHA256: c9ca3f55b0ff037964bd2934c6a785e41744e34f71f2b32d86d009dcfafb4883
Shown target SHA256: c9ca3f55b0ff037964bd2934c6a785e41744e34f71f2b32d86d009dcfafb4883

### Proposed decision

```json
{
  "claimId": "claim_abab70a0365ac246c96517ab7177daec",
  "sourceUnitDigest": "c9ca3f55b0ff037964bd2934c6a785e41744e34f71f2b32d86d009dcfafb4883",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "c9ca3f55b0ff037964bd2934c6a785e41744e34f71f2b32d86d009dcfafb4883",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "5. Prompt Source, Not Runtime Dependency"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-18 (lines 176–185) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-21 (lines 200–209); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
external coordinator owns durable state and stop/go authority
  -> doer produces a bounded candidate
  -> reviewer independently checks correctness/regression
  -> red-team independently attacks invariants and false-success paths
  -> coordinator dispositions findings
  -> fixer/doer-followup handles accepted findings only
  -> reviewer/red-team recheck the new revision
  -> coordinator closes, blocks, or authorizes another declared round
```
````

### Full target shown text

````text
```txt
external coordinator owns durable state and stop/go authority
  -> doer produces a bounded candidate
  -> reviewer independently checks correctness/regression
  -> red-team independently attacks invariants and false-success paths
  -> coordinator dispositions findings
  -> fixer/doer-followup handles accepted findings only
  -> reviewer/red-team recheck the new revision
  -> coordinator closes, blocks, or authorizes another declared round
```
````

## claim_c9da9b8224f3c0f07571b28307706b0f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-19, lines 187–189.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-22.
Source digest: 8c28c0fc6f8495882a7e94993bdd0c8a836cf1a292550482bcee2abdf98c7f44
Target digest: 8c28c0fc6f8495882a7e94993bdd0c8a836cf1a292550482bcee2abdf98c7f44
Shown source SHA256: 8c28c0fc6f8495882a7e94993bdd0c8a836cf1a292550482bcee2abdf98c7f44
Shown target SHA256: 8c28c0fc6f8495882a7e94993bdd0c8a836cf1a292550482bcee2abdf98c7f44

### Proposed decision

```json
{
  "claimId": "claim_c9da9b8224f3c0f07571b28307706b0f",
  "sourceUnitDigest": "8c28c0fc6f8495882a7e94993bdd0c8a836cf1a292550482bcee2abdf98c7f44",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "8c28c0fc6f8495882a7e94993bdd0c8a836cf1a292550482bcee2abdf98c7f44",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "5. Prompt Source, Not Runtime Dependency"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-19 (lines 187–189) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-22 (lines 211–213); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Step 09 extracts that shape into declared FlowDefinition/session primitives. It
does not paste the prompt into product runtime, and it does not make the prompt
the authority for Work, git, merge, approval, or lifecycle mutation.
```

### Full target shown text

```text
Step 09 extracts that shape into declared FlowDefinition/session primitives. It
does not paste the prompt into product runtime, and it does not make the prompt
the authority for Work, git, merge, approval, or lifecycle mutation.
```

## claim_786318e98d46ba0261e25c42b35161f1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#6-mvp1---master-coordination-fixture, lines 191–191.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#6-mvp1---master-coordination-fixture.
Source digest: 4d44002d394639db5df27acc7bcaf5f32f51fca20e4ae5b73e3de68d4e58882f
Target digest: 4d44002d394639db5df27acc7bcaf5f32f51fca20e4ae5b73e3de68d4e58882f
Shown source SHA256: 8f299ecbc79ae20d5c73c38a455bb8e0d787e311b27e59b80384ba60a40e7fa5
Shown target SHA256: 8f299ecbc79ae20d5c73c38a455bb8e0d787e311b27e59b80384ba60a40e7fa5

### Proposed decision

```json
{
  "claimId": "claim_786318e98d46ba0261e25c42b35161f1",
  "sourceUnitDigest": "4d44002d394639db5df27acc7bcaf5f32f51fca20e4ae5b73e3de68d4e58882f",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "6-mvp1---master-coordination-fixture",
  "targetUnitDigest": "4d44002d394639db5df27acc7bcaf5f32f51fca20e4ae5b73e3de68d4e58882f",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#6-mvp1---master-coordination-fixture (lines 191–191) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#6-mvp1---master-coordination-fixture (lines 215–215); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 6. MVP1 - Master Coordination Fixture

The first fixture should be named:

```txt
standalone-master-coordination-loop
```

It is a `CoordinationProtocol` FlowDefinition used with a coordination request
whose input is an already-approved plan or artifact reference:

```yaml
definitionRef:
  id: standalone-master-coordination-loop
  version: v0
objective: <one approved plan or artifact review objective>
inputRefs:
  - path: plans/.../plan.md
  - path: docs/.../artifact.md
aggregateBounds:
  maxAssignments: 8
  maxRounds: 3
  maxConcurrency: 2
```

`inputRefs` are context references. They do not create Work items and do not
grant mutation authority.

The declared worker graph contains workers only:

```yaml
actors:
  - id: doer
    role: doer
  - id: reviewer
    role: reviewer
  - id: red-team
    role: red-team
  - id: fixer
    role: fixer
```

The driver/coordinator is not an actor. It opens the session, reads evidence,
authorizes optional operations, records disposition, and closes or stops the
session.

Minimal operation set:

```yaml
operations:
  - id: produce-candidate
    role: doer
    result: {kind: work-product, evidenceRequired: reported}
  - id: review-candidate
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-candidate
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
  - id: revise-candidate
    role: fixer
    result: {kind: work-product, evidenceRequired: reported}
  - id: reviewer-recheck
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-recheck
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
```

The first three operations are required. `revise-candidate`,
`reviewer-recheck`, and `red-team-recheck` are declared in the graph but may
materialize only after driver authorization. MVP1 can document and validate the
static fixture skeleton first; a real adaptive run requires MVP2.

Artifact stance:

```txt
RunResult owns produced artifact refs.
CoordinationSession links those refs.
CoordinationSession does not become a second artifact authority.
```

If runtime cannot yet carry produced artifact refs cleanly, MVP1 may keep
artifact refs as documented fixture intent. MVP2 decides the persisted shape.
````

### Full target shown text

````text
## 6. MVP1 - Master Coordination Fixture

The first fixture should be named:

```txt
standalone-master-coordination-loop
```

It is a `CoordinationProtocol` FlowDefinition used with a coordination request
whose input is an already-approved plan or artifact reference:

```yaml
definitionRef:
  id: standalone-master-coordination-loop
  version: v0
objective: <one approved plan or artifact review objective>
inputRefs:
  - path: plans/.../plan.md
  - path: docs/.../artifact.md
aggregateBounds:
  maxAssignments: 8
  maxRounds: 3
  maxConcurrency: 2
```

`inputRefs` are context references. They do not create Work items and do not
grant mutation authority.

The declared worker graph contains workers only:

```yaml
actors:
  - id: doer
    role: doer
  - id: reviewer
    role: reviewer
  - id: red-team
    role: red-team
  - id: fixer
    role: fixer
```

The driver/coordinator is not an actor. It opens the session, reads evidence,
authorizes optional operations, records disposition, and closes or stops the
session.

Minimal operation set:

```yaml
operations:
  - id: produce-candidate
    role: doer
    result: {kind: work-product, evidenceRequired: reported}
  - id: review-candidate
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-candidate
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
  - id: revise-candidate
    role: fixer
    result: {kind: work-product, evidenceRequired: reported}
  - id: reviewer-recheck
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-recheck
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
```

The first three operations are required. `revise-candidate`,
`reviewer-recheck`, and `red-team-recheck` are declared in the graph but may
materialize only after driver authorization. MVP1 can document and validate the
static fixture skeleton first; a real adaptive run requires MVP2.

Artifact stance:

```txt
RunResult owns produced artifact refs.
CoordinationSession links those refs.
CoordinationSession does not become a second artifact authority.
```

If runtime cannot yet carry produced artifact refs cleanly, MVP1 may keep
artifact refs as documented fixture intent. MVP2 decides the persisted shape.
````

## claim_b71bcbb199b7533c066da97c8f5d5726

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-20, lines 193–193.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-23.
Source digest: 1a609eacb73f49cf792458805a6db4cfad783ffbf94c8b72f0605e17d7bcd841
Target digest: 1a609eacb73f49cf792458805a6db4cfad783ffbf94c8b72f0605e17d7bcd841
Shown source SHA256: 1a609eacb73f49cf792458805a6db4cfad783ffbf94c8b72f0605e17d7bcd841
Shown target SHA256: 1a609eacb73f49cf792458805a6db4cfad783ffbf94c8b72f0605e17d7bcd841

### Proposed decision

```json
{
  "claimId": "claim_b71bcbb199b7533c066da97c8f5d5726",
  "sourceUnitDigest": "1a609eacb73f49cf792458805a6db4cfad783ffbf94c8b72f0605e17d7bcd841",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "1a609eacb73f49cf792458805a6db4cfad783ffbf94c8b72f0605e17d7bcd841",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-20 (lines 193–193) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-23 (lines 217–217); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The first fixture should be named:
```

### Full target shown text

```text
The first fixture should be named:
```

## claim_e41ebad36b3f1c4c37967e882fbd15f4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-21, lines 195–197.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-24.
Source digest: 47a56b0b4f7b232565dffc9adbf48c0fa87244fa59e2d2a6bba3615263e90c26
Target digest: 47a56b0b4f7b232565dffc9adbf48c0fa87244fa59e2d2a6bba3615263e90c26
Shown source SHA256: 47a56b0b4f7b232565dffc9adbf48c0fa87244fa59e2d2a6bba3615263e90c26
Shown target SHA256: 47a56b0b4f7b232565dffc9adbf48c0fa87244fa59e2d2a6bba3615263e90c26

### Proposed decision

```json
{
  "claimId": "claim_e41ebad36b3f1c4c37967e882fbd15f4",
  "sourceUnitDigest": "47a56b0b4f7b232565dffc9adbf48c0fa87244fa59e2d2a6bba3615263e90c26",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "47a56b0b4f7b232565dffc9adbf48c0fa87244fa59e2d2a6bba3615263e90c26",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-21 (lines 195–197) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-24 (lines 219–221); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
standalone-master-coordination-loop
```
````

### Full target shown text

````text
```txt
standalone-master-coordination-loop
```
````

## claim_e10c16b32fdbcab85be0360534e1d253

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-22, lines 199–200.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-25.
Source digest: ad0025b1a80e3e911c8b2213483a2f8b27d120804e6a40ee13026fa53a4ae952
Target digest: ad0025b1a80e3e911c8b2213483a2f8b27d120804e6a40ee13026fa53a4ae952
Shown source SHA256: ad0025b1a80e3e911c8b2213483a2f8b27d120804e6a40ee13026fa53a4ae952
Shown target SHA256: ad0025b1a80e3e911c8b2213483a2f8b27d120804e6a40ee13026fa53a4ae952

### Proposed decision

```json
{
  "claimId": "claim_e10c16b32fdbcab85be0360534e1d253",
  "sourceUnitDigest": "ad0025b1a80e3e911c8b2213483a2f8b27d120804e6a40ee13026fa53a4ae952",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "ad0025b1a80e3e911c8b2213483a2f8b27d120804e6a40ee13026fa53a4ae952",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-22 (lines 199–200) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-25 (lines 223–224); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
It is a `CoordinationProtocol` FlowDefinition used with a coordination request
whose input is an already-approved plan or artifact reference:
```

### Full target shown text

```text
It is a `CoordinationProtocol` FlowDefinition used with a coordination request
whose input is an already-approved plan or artifact reference:
```

## claim_470117750d46b429ea795c8ca1bc428f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-23, lines 202–214.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-26.
Source digest: 350350eac2d93c56a8eedfd164711851dea4755a60ffd7b1c902c9a55460c87b
Target digest: 350350eac2d93c56a8eedfd164711851dea4755a60ffd7b1c902c9a55460c87b
Shown source SHA256: 350350eac2d93c56a8eedfd164711851dea4755a60ffd7b1c902c9a55460c87b
Shown target SHA256: 350350eac2d93c56a8eedfd164711851dea4755a60ffd7b1c902c9a55460c87b

### Proposed decision

```json
{
  "claimId": "claim_470117750d46b429ea795c8ca1bc428f",
  "sourceUnitDigest": "350350eac2d93c56a8eedfd164711851dea4755a60ffd7b1c902c9a55460c87b",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "350350eac2d93c56a8eedfd164711851dea4755a60ffd7b1c902c9a55460c87b",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-23 (lines 202–214) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-26 (lines 226–238); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
definitionRef:
  id: standalone-master-coordination-loop
  version: v0
objective: <one approved plan or artifact review objective>
inputRefs:
  - path: plans/.../plan.md
  - path: docs/.../artifact.md
aggregateBounds:
  maxAssignments: 8
  maxRounds: 3
  maxConcurrency: 2
```
````

### Full target shown text

````text
```yaml
definitionRef:
  id: standalone-master-coordination-loop
  version: v0
objective: <one approved plan or artifact review objective>
inputRefs:
  - path: plans/.../plan.md
  - path: docs/.../artifact.md
aggregateBounds:
  maxAssignments: 8
  maxRounds: 3
  maxConcurrency: 2
```
````

## claim_3208e52df7bb24049d4b97ec1c6374a7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-24, lines 216–217.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-27.
Source digest: 3b2545256b59ea07860bc065d92a28ac184236160c01c42784cf6818b8be6483
Target digest: 3b2545256b59ea07860bc065d92a28ac184236160c01c42784cf6818b8be6483
Shown source SHA256: 3b2545256b59ea07860bc065d92a28ac184236160c01c42784cf6818b8be6483
Shown target SHA256: 3b2545256b59ea07860bc065d92a28ac184236160c01c42784cf6818b8be6483

### Proposed decision

```json
{
  "claimId": "claim_3208e52df7bb24049d4b97ec1c6374a7",
  "sourceUnitDigest": "3b2545256b59ea07860bc065d92a28ac184236160c01c42784cf6818b8be6483",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "3b2545256b59ea07860bc065d92a28ac184236160c01c42784cf6818b8be6483",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-24 (lines 216–217) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-27 (lines 240–241); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
`inputRefs` are context references. They do not create Work items and do not
grant mutation authority.
```

### Full target shown text

```text
`inputRefs` are context references. They do not create Work items and do not
grant mutation authority.
```

## claim_b43db85304a1f907bd12c456a60fefa6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-25, lines 219–219.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-28.
Source digest: da007f249364e0d17b79905915b3b722dda5b4390a91c6887081230008a77ff7
Target digest: da007f249364e0d17b79905915b3b722dda5b4390a91c6887081230008a77ff7
Shown source SHA256: da007f249364e0d17b79905915b3b722dda5b4390a91c6887081230008a77ff7
Shown target SHA256: da007f249364e0d17b79905915b3b722dda5b4390a91c6887081230008a77ff7

### Proposed decision

```json
{
  "claimId": "claim_b43db85304a1f907bd12c456a60fefa6",
  "sourceUnitDigest": "da007f249364e0d17b79905915b3b722dda5b4390a91c6887081230008a77ff7",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "da007f249364e0d17b79905915b3b722dda5b4390a91c6887081230008a77ff7",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-25 (lines 219–219) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-28 (lines 243–243); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The declared worker graph contains workers only:
```

### Full target shown text

```text
The declared worker graph contains workers only:
```

## claim_407b7752a13ffd8346d0490cf3a63a6b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-26, lines 221–231.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-29.
Source digest: c27ed1f9d789d080a36ec7e33ef1cbe6ee962afccf85338b38ddbd5407f99613
Target digest: c27ed1f9d789d080a36ec7e33ef1cbe6ee962afccf85338b38ddbd5407f99613
Shown source SHA256: c27ed1f9d789d080a36ec7e33ef1cbe6ee962afccf85338b38ddbd5407f99613
Shown target SHA256: c27ed1f9d789d080a36ec7e33ef1cbe6ee962afccf85338b38ddbd5407f99613

### Proposed decision

```json
{
  "claimId": "claim_407b7752a13ffd8346d0490cf3a63a6b",
  "sourceUnitDigest": "c27ed1f9d789d080a36ec7e33ef1cbe6ee962afccf85338b38ddbd5407f99613",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "c27ed1f9d789d080a36ec7e33ef1cbe6ee962afccf85338b38ddbd5407f99613",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-26 (lines 221–231) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-29 (lines 245–255); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
actors:
  - id: doer
    role: doer
  - id: reviewer
    role: reviewer
  - id: red-team
    role: red-team
  - id: fixer
    role: fixer
```
````

### Full target shown text

````text
```yaml
actors:
  - id: doer
    role: doer
  - id: reviewer
    role: reviewer
  - id: red-team
    role: red-team
  - id: fixer
    role: fixer
```
````

## claim_80963d046a4933f615e61c3fe3e39424

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-27, lines 233–235.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-30.
Source digest: a19dc3c8416de2244e55a8f24a13c6b904c41ef523ad63d5b750da6b07a01919
Target digest: a19dc3c8416de2244e55a8f24a13c6b904c41ef523ad63d5b750da6b07a01919
Shown source SHA256: a19dc3c8416de2244e55a8f24a13c6b904c41ef523ad63d5b750da6b07a01919
Shown target SHA256: a19dc3c8416de2244e55a8f24a13c6b904c41ef523ad63d5b750da6b07a01919

### Proposed decision

```json
{
  "claimId": "claim_80963d046a4933f615e61c3fe3e39424",
  "sourceUnitDigest": "a19dc3c8416de2244e55a8f24a13c6b904c41ef523ad63d5b750da6b07a01919",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "a19dc3c8416de2244e55a8f24a13c6b904c41ef523ad63d5b750da6b07a01919",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-27 (lines 233–235) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-30 (lines 257–259); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The driver/coordinator is not an actor. It opens the session, reads evidence,
authorizes optional operations, records disposition, and closes or stops the
session.
```

### Full target shown text

```text
The driver/coordinator is not an actor. It opens the session, reads evidence,
authorizes optional operations, records disposition, and closes or stops the
session.
```

## claim_c11159f76679f3b6cbf078276bdedddc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-28, lines 237–237.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-31.
Source digest: d280653fcd405f7d2e0cfa6cfe8b846b584e9f60a5ed46da852b3b010541d6b5
Target digest: d280653fcd405f7d2e0cfa6cfe8b846b584e9f60a5ed46da852b3b010541d6b5
Shown source SHA256: d280653fcd405f7d2e0cfa6cfe8b846b584e9f60a5ed46da852b3b010541d6b5
Shown target SHA256: d280653fcd405f7d2e0cfa6cfe8b846b584e9f60a5ed46da852b3b010541d6b5

### Proposed decision

```json
{
  "claimId": "claim_c11159f76679f3b6cbf078276bdedddc",
  "sourceUnitDigest": "d280653fcd405f7d2e0cfa6cfe8b846b584e9f60a5ed46da852b3b010541d6b5",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "d280653fcd405f7d2e0cfa6cfe8b846b584e9f60a5ed46da852b3b010541d6b5",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-28 (lines 237–237) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-31 (lines 261–261); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Minimal operation set:
```

### Full target shown text

```text
Minimal operation set:
```

## claim_801307a8a6333dd96ddd456018deb14e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-29, lines 239–259.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-32.
Source digest: e7d324cc68dec052f263c3aaa66abfd50214d160fd27231c5b7eb6ec5fed7355
Target digest: e7d324cc68dec052f263c3aaa66abfd50214d160fd27231c5b7eb6ec5fed7355
Shown source SHA256: e7d324cc68dec052f263c3aaa66abfd50214d160fd27231c5b7eb6ec5fed7355
Shown target SHA256: e7d324cc68dec052f263c3aaa66abfd50214d160fd27231c5b7eb6ec5fed7355

### Proposed decision

```json
{
  "claimId": "claim_801307a8a6333dd96ddd456018deb14e",
  "sourceUnitDigest": "e7d324cc68dec052f263c3aaa66abfd50214d160fd27231c5b7eb6ec5fed7355",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "e7d324cc68dec052f263c3aaa66abfd50214d160fd27231c5b7eb6ec5fed7355",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-29 (lines 239–259) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-32 (lines 263–283); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
operations:
  - id: produce-candidate
    role: doer
    result: {kind: work-product, evidenceRequired: reported}
  - id: review-candidate
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-candidate
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
  - id: revise-candidate
    role: fixer
    result: {kind: work-product, evidenceRequired: reported}
  - id: reviewer-recheck
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-recheck
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
```
````

### Full target shown text

````text
```yaml
operations:
  - id: produce-candidate
    role: doer
    result: {kind: work-product, evidenceRequired: reported}
  - id: review-candidate
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-candidate
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
  - id: revise-candidate
    role: fixer
    result: {kind: work-product, evidenceRequired: reported}
  - id: reviewer-recheck
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-recheck
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
```
````

## claim_0f19038dd05a73281a7e6f5d5bf64720

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-30, lines 261–264.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-33.
Source digest: 9b82aa1dc03c752d0ecd17993e59239e3076db9bb1ebeca78e02988c69f1a95c
Target digest: 9b82aa1dc03c752d0ecd17993e59239e3076db9bb1ebeca78e02988c69f1a95c
Shown source SHA256: 9b82aa1dc03c752d0ecd17993e59239e3076db9bb1ebeca78e02988c69f1a95c
Shown target SHA256: 9b82aa1dc03c752d0ecd17993e59239e3076db9bb1ebeca78e02988c69f1a95c

### Proposed decision

```json
{
  "claimId": "claim_0f19038dd05a73281a7e6f5d5bf64720",
  "sourceUnitDigest": "9b82aa1dc03c752d0ecd17993e59239e3076db9bb1ebeca78e02988c69f1a95c",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "9b82aa1dc03c752d0ecd17993e59239e3076db9bb1ebeca78e02988c69f1a95c",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-30 (lines 261–264) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-33 (lines 285–288); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The first three operations are required. `revise-candidate`,
`reviewer-recheck`, and `red-team-recheck` are declared in the graph but may
materialize only after driver authorization. MVP1 can document and validate the
static fixture skeleton first; a real adaptive run requires MVP2.
```

### Full target shown text

```text
The first three operations are required. `revise-candidate`,
`reviewer-recheck`, and `red-team-recheck` are declared in the graph but may
materialize only after driver authorization. MVP1 can document and validate the
static fixture skeleton first; a real adaptive run requires MVP2.
```

## claim_4837f0d7d07529a705ad1d0910c674d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-31, lines 266–272.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-34.
Source digest: 2db4a4d99cff78bb779b7683bb41a4ed3f270a5d2115d2a63e2d21b920759609
Target digest: 2db4a4d99cff78bb779b7683bb41a4ed3f270a5d2115d2a63e2d21b920759609
Shown source SHA256: 2db4a4d99cff78bb779b7683bb41a4ed3f270a5d2115d2a63e2d21b920759609
Shown target SHA256: 2db4a4d99cff78bb779b7683bb41a4ed3f270a5d2115d2a63e2d21b920759609

### Proposed decision

```json
{
  "claimId": "claim_4837f0d7d07529a705ad1d0910c674d9",
  "sourceUnitDigest": "2db4a4d99cff78bb779b7683bb41a4ed3f270a5d2115d2a63e2d21b920759609",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "2db4a4d99cff78bb779b7683bb41a4ed3f270a5d2115d2a63e2d21b920759609",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-31 (lines 266–272) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-34 (lines 290–296); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Artifact stance:

```txt
RunResult owns produced artifact refs.
CoordinationSession links those refs.
CoordinationSession does not become a second artifact authority.
```
````

### Full target shown text

````text
Artifact stance:

```txt
RunResult owns produced artifact refs.
CoordinationSession links those refs.
CoordinationSession does not become a second artifact authority.
```
````

## claim_8a499e09f33c573cc795d4c14b2ec0ba

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-32, lines 274–275.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-35.
Source digest: 35d303b4f08c821b673e9a14b437b5cca67bcca70ded6d99aa5534e7170759f0
Target digest: 35d303b4f08c821b673e9a14b437b5cca67bcca70ded6d99aa5534e7170759f0
Shown source SHA256: 35d303b4f08c821b673e9a14b437b5cca67bcca70ded6d99aa5534e7170759f0
Shown target SHA256: 35d303b4f08c821b673e9a14b437b5cca67bcca70ded6d99aa5534e7170759f0

### Proposed decision

```json
{
  "claimId": "claim_8a499e09f33c573cc795d4c14b2ec0ba",
  "sourceUnitDigest": "35d303b4f08c821b673e9a14b437b5cca67bcca70ded6d99aa5534e7170759f0",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "35d303b4f08c821b673e9a14b437b5cca67bcca70ded6d99aa5534e7170759f0",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "6. MVP1 - Master Coordination Fixture"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-32 (lines 274–275) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-35 (lines 298–299); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
If runtime cannot yet carry produced artifact refs cleanly, MVP1 may keep
artifact refs as documented fixture intent. MVP2 decides the persisted shape.
```

### Full target shown text

```text
If runtime cannot yet carry produced artifact refs cleanly, MVP1 may keep
artifact refs as documented fixture intent. MVP2 decides the persisted shape.
```

## claim_47911c3f57c649cdeaba0235dfdb165b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#7-mvp2---driver-authorization-primitive, lines 277–277.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#7-mvp2---driver-authorization-primitive.
Source digest: 6cafdf745ba5b4c9eab9beaa7b9a6b06671f0f3bc57ba1eeaaa13ac288efe873
Target digest: 6cafdf745ba5b4c9eab9beaa7b9a6b06671f0f3bc57ba1eeaaa13ac288efe873
Shown source SHA256: 8da44fbe164d0e1494a618a7e9f399976f24a3679a55d2efab34f249f4619902
Shown target SHA256: 8da44fbe164d0e1494a618a7e9f399976f24a3679a55d2efab34f249f4619902

### Proposed decision

```json
{
  "claimId": "claim_47911c3f57c649cdeaba0235dfdb165b",
  "sourceUnitDigest": "6cafdf745ba5b4c9eab9beaa7b9a6b06671f0f3bc57ba1eeaaa13ac288efe873",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "7-mvp2---driver-authorization-primitive",
  "targetUnitDigest": "6cafdf745ba5b4c9eab9beaa7b9a6b06671f0f3bc57ba1eeaaa13ac288efe873",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#7-mvp2---driver-authorization-primitive (lines 277–277) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#7-mvp2---driver-authorization-primitive (lines 301–301); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 7. MVP2 - Driver Authorization Primitive

The primitive should be `operation-authorized`, not `requestRound` and not
`addSessionEdge`.

Workers may recommend another round later, but they do not authorize it.
Dynamic edge addition is useful later, but too broad for the first Master
Coordination proof and too easy to confuse with the isolation-heavy R3 fixture.

The FlowDefinition delta belongs on the node-operation binding:

```yaml
graph:
  nodes:
    - id: revision
      operations:
        - ref: revise-candidate
          actor: fixer
          activation:
            mode: driver-authorized
            maxInvocations: 1
```

`activation.mode` is not a reusable operation property. The same operation may
be required in one graph position and driver-authorized in another.

Candidate session event:

```json
{
  "kind": "operation-authorized",
  "authorizationId": "auth_...",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "targetActorId": "fixer",
  "invocationKey": "revision:1",
  "authorizedBy": {"type": "driver", "id": "session-driver"},
  "reason": "accepted findings require revision",
  "grantedContextRefs": [
    "run:<doer-run>/artifact:candidate",
    "run:<reviewer-run>/artifact:review-report",
    "run:<red-team-run>/artifact:red-team-report"
  ],
  "targetArtifactRef": "run:<doer-run>/artifact:candidate",
  "ts": "..."
}
```

Assignment creation for that operation must persist the authorization
provenance:

```json
{
  "kind": "assignment-created",
  "assignmentId": "asgn_...",
  "actorId": "fixer",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "authorizationId": "auth_...",
  "invocationKey": "revision:1",
  "contextGrant": {"refs": ["..."]},
  "ts": "..."
}
```

Disposition is a driver event, not a worker result:

```json
{
  "kind": "driver-disposition-recorded",
  "targetRef": "finding:RT-1",
  "disposition": "accepted",
  "rationale": "violates declared invariant",
  "evidenceRefs": ["run:<red-team-run>/artifact:red-team-report"],
  "ts": "..."
}
```

Recheck is not retry:

```txt
retry   = new Run for the same Assignment, with supersession rules
recheck = new Assignment against a new artifact revision/evidence ref
```

Therefore `reviewer-recheck` and `red-team-recheck` are new operations or
driver-authorized redispatches with distinct operation provenance. The old
verdict and RunResult remain immutable.

Bounds rule:

```txt
An optional operation invocation must satisfy:
  declared binding activation
  binding-level maxInvocations
  aggregateBounds.maxAssignments
  aggregateBounds.maxRounds
  terminal-session refusal
```

Binding-level caps never widen aggregate caps. `aggregateBounds.maxRounds`
remains the hard session-wide ceiling; binding caps only narrow a specific
operation position.
````

### Full target shown text

````text
## 7. MVP2 - Driver Authorization Primitive

The primitive should be `operation-authorized`, not `requestRound` and not
`addSessionEdge`.

Workers may recommend another round later, but they do not authorize it.
Dynamic edge addition is useful later, but too broad for the first Master
Coordination proof and too easy to confuse with the isolation-heavy R3 fixture.

The FlowDefinition delta belongs on the node-operation binding:

```yaml
graph:
  nodes:
    - id: revision
      operations:
        - ref: revise-candidate
          actor: fixer
          activation:
            mode: driver-authorized
            maxInvocations: 1
```

`activation.mode` is not a reusable operation property. The same operation may
be required in one graph position and driver-authorized in another.

Candidate session event:

```json
{
  "kind": "operation-authorized",
  "authorizationId": "auth_...",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "targetActorId": "fixer",
  "invocationKey": "revision:1",
  "authorizedBy": {"type": "driver", "id": "session-driver"},
  "reason": "accepted findings require revision",
  "grantedContextRefs": [
    "run:<doer-run>/artifact:candidate",
    "run:<reviewer-run>/artifact:review-report",
    "run:<red-team-run>/artifact:red-team-report"
  ],
  "targetArtifactRef": "run:<doer-run>/artifact:candidate",
  "ts": "..."
}
```

Assignment creation for that operation must persist the authorization
provenance:

```json
{
  "kind": "assignment-created",
  "assignmentId": "asgn_...",
  "actorId": "fixer",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "authorizationId": "auth_...",
  "invocationKey": "revision:1",
  "contextGrant": {"refs": ["..."]},
  "ts": "..."
}
```

Disposition is a driver event, not a worker result:

```json
{
  "kind": "driver-disposition-recorded",
  "targetRef": "finding:RT-1",
  "disposition": "accepted",
  "rationale": "violates declared invariant",
  "evidenceRefs": ["run:<red-team-run>/artifact:red-team-report"],
  "ts": "..."
}
```

Recheck is not retry:

```txt
retry   = new Run for the same Assignment, with supersession rules
recheck = new Assignment against a new artifact revision/evidence ref
```

Therefore `reviewer-recheck` and `red-team-recheck` are new operations or
driver-authorized redispatches with distinct operation provenance. The old
verdict and RunResult remain immutable.

Bounds rule:

```txt
An optional operation invocation must satisfy:
  declared binding activation
  binding-level maxInvocations
  aggregateBounds.maxAssignments
  aggregateBounds.maxRounds
  terminal-session refusal
```

Binding-level caps never widen aggregate caps. `aggregateBounds.maxRounds`
remains the hard session-wide ceiling; binding caps only narrow a specific
operation position.
````

## claim_b3dc6b9e49e294c8fb0e9944a4e942d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-33, lines 279–280.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-36.
Source digest: fb8f2cc77e9ffb10001ff4842a36a36e7f33d7c32d4e8c72ddb80d815f71f657
Target digest: fb8f2cc77e9ffb10001ff4842a36a36e7f33d7c32d4e8c72ddb80d815f71f657
Shown source SHA256: fb8f2cc77e9ffb10001ff4842a36a36e7f33d7c32d4e8c72ddb80d815f71f657
Shown target SHA256: fb8f2cc77e9ffb10001ff4842a36a36e7f33d7c32d4e8c72ddb80d815f71f657

### Proposed decision

```json
{
  "claimId": "claim_b3dc6b9e49e294c8fb0e9944a4e942d9",
  "sourceUnitDigest": "fb8f2cc77e9ffb10001ff4842a36a36e7f33d7c32d4e8c72ddb80d815f71f657",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "fb8f2cc77e9ffb10001ff4842a36a36e7f33d7c32d4e8c72ddb80d815f71f657",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-33 (lines 279–280) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-36 (lines 303–304); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The primitive should be `operation-authorized`, not `requestRound` and not
`addSessionEdge`.
```

### Full target shown text

```text
The primitive should be `operation-authorized`, not `requestRound` and not
`addSessionEdge`.
```

## claim_aaa53726ff86aa51309bb3bcfbd9a624

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-34, lines 282–284.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-37.
Source digest: 9129d62051975860713ed2a1808f7ee0ff5b2f889dd7d0b5dbddf3bfbe595cc4
Target digest: 9129d62051975860713ed2a1808f7ee0ff5b2f889dd7d0b5dbddf3bfbe595cc4
Shown source SHA256: 9129d62051975860713ed2a1808f7ee0ff5b2f889dd7d0b5dbddf3bfbe595cc4
Shown target SHA256: 9129d62051975860713ed2a1808f7ee0ff5b2f889dd7d0b5dbddf3bfbe595cc4

### Proposed decision

```json
{
  "claimId": "claim_aaa53726ff86aa51309bb3bcfbd9a624",
  "sourceUnitDigest": "9129d62051975860713ed2a1808f7ee0ff5b2f889dd7d0b5dbddf3bfbe595cc4",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "9129d62051975860713ed2a1808f7ee0ff5b2f889dd7d0b5dbddf3bfbe595cc4",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-34 (lines 282–284) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-37 (lines 306–308); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Workers may recommend another round later, but they do not authorize it.
Dynamic edge addition is useful later, but too broad for the first Master
Coordination proof and too easy to confuse with the isolation-heavy R3 fixture.
```

### Full target shown text

```text
Workers may recommend another round later, but they do not authorize it.
Dynamic edge addition is useful later, but too broad for the first Master
Coordination proof and too easy to confuse with the isolation-heavy R3 fixture.
```

## claim_10306ae620d805a74de5a7eb509968c7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-35, lines 286–286.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-38.
Source digest: 1f65f81fda6175c9bf799114bc7c09deb04f92c9ae75b6332da0a160c7d1bc23
Target digest: 1f65f81fda6175c9bf799114bc7c09deb04f92c9ae75b6332da0a160c7d1bc23
Shown source SHA256: 1f65f81fda6175c9bf799114bc7c09deb04f92c9ae75b6332da0a160c7d1bc23
Shown target SHA256: 1f65f81fda6175c9bf799114bc7c09deb04f92c9ae75b6332da0a160c7d1bc23

### Proposed decision

```json
{
  "claimId": "claim_10306ae620d805a74de5a7eb509968c7",
  "sourceUnitDigest": "1f65f81fda6175c9bf799114bc7c09deb04f92c9ae75b6332da0a160c7d1bc23",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "1f65f81fda6175c9bf799114bc7c09deb04f92c9ae75b6332da0a160c7d1bc23",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-35 (lines 286–286) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-38 (lines 310–310); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The FlowDefinition delta belongs on the node-operation binding:
```

### Full target shown text

```text
The FlowDefinition delta belongs on the node-operation binding:
```

## claim_ef97e0f1d5941a2eca23a3819b4f73bc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-36, lines 288–298.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-39.
Source digest: 0b30a72e61637544da0827ba3aebc3cfe11410a3c62b5379ca1dd5beaf522a96
Target digest: 0b30a72e61637544da0827ba3aebc3cfe11410a3c62b5379ca1dd5beaf522a96
Shown source SHA256: 0b30a72e61637544da0827ba3aebc3cfe11410a3c62b5379ca1dd5beaf522a96
Shown target SHA256: 0b30a72e61637544da0827ba3aebc3cfe11410a3c62b5379ca1dd5beaf522a96

### Proposed decision

```json
{
  "claimId": "claim_ef97e0f1d5941a2eca23a3819b4f73bc",
  "sourceUnitDigest": "0b30a72e61637544da0827ba3aebc3cfe11410a3c62b5379ca1dd5beaf522a96",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "0b30a72e61637544da0827ba3aebc3cfe11410a3c62b5379ca1dd5beaf522a96",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-36 (lines 288–298) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-39 (lines 312–322); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
graph:
  nodes:
    - id: revision
      operations:
        - ref: revise-candidate
          actor: fixer
          activation:
            mode: driver-authorized
            maxInvocations: 1
```
````

### Full target shown text

````text
```yaml
graph:
  nodes:
    - id: revision
      operations:
        - ref: revise-candidate
          actor: fixer
          activation:
            mode: driver-authorized
            maxInvocations: 1
```
````

## claim_d0af36761de0f63186d4e2b83e26f25c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-37, lines 300–301.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-40.
Source digest: 636320cddf363375f75be787ce5457039ec589b43b270eaf97f68cbdbe493993
Target digest: 636320cddf363375f75be787ce5457039ec589b43b270eaf97f68cbdbe493993
Shown source SHA256: 636320cddf363375f75be787ce5457039ec589b43b270eaf97f68cbdbe493993
Shown target SHA256: 636320cddf363375f75be787ce5457039ec589b43b270eaf97f68cbdbe493993

### Proposed decision

```json
{
  "claimId": "claim_d0af36761de0f63186d4e2b83e26f25c",
  "sourceUnitDigest": "636320cddf363375f75be787ce5457039ec589b43b270eaf97f68cbdbe493993",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "636320cddf363375f75be787ce5457039ec589b43b270eaf97f68cbdbe493993",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-37 (lines 300–301) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-40 (lines 324–325); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
`activation.mode` is not a reusable operation property. The same operation may
be required in one graph position and driver-authorized in another.
```

### Full target shown text

```text
`activation.mode` is not a reusable operation property. The same operation may
be required in one graph position and driver-authorized in another.
```

## claim_1ab7abbb990e375b8434e10b9009cff3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-38, lines 303–303.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-41.
Source digest: 2e4c4fc1fcad1914f747dd7fbad2f4811a9eceb296542c198d80a5b62ba03a03
Target digest: 2e4c4fc1fcad1914f747dd7fbad2f4811a9eceb296542c198d80a5b62ba03a03
Shown source SHA256: 2e4c4fc1fcad1914f747dd7fbad2f4811a9eceb296542c198d80a5b62ba03a03
Shown target SHA256: 2e4c4fc1fcad1914f747dd7fbad2f4811a9eceb296542c198d80a5b62ba03a03

### Proposed decision

```json
{
  "claimId": "claim_1ab7abbb990e375b8434e10b9009cff3",
  "sourceUnitDigest": "2e4c4fc1fcad1914f747dd7fbad2f4811a9eceb296542c198d80a5b62ba03a03",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "2e4c4fc1fcad1914f747dd7fbad2f4811a9eceb296542c198d80a5b62ba03a03",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-38 (lines 303–303) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-41 (lines 327–327); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Candidate session event:
```

### Full target shown text

```text
Candidate session event:
```

## claim_67df124b6530f6c84aafbb629c0cdf19

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-39, lines 305–323.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-42.
Source digest: 7cbe97b50625f11e0f48f34110ac0ebd07021f9bfcb59e401370841df5e561e9
Target digest: 7cbe97b50625f11e0f48f34110ac0ebd07021f9bfcb59e401370841df5e561e9
Shown source SHA256: 7cbe97b50625f11e0f48f34110ac0ebd07021f9bfcb59e401370841df5e561e9
Shown target SHA256: 7cbe97b50625f11e0f48f34110ac0ebd07021f9bfcb59e401370841df5e561e9

### Proposed decision

```json
{
  "claimId": "claim_67df124b6530f6c84aafbb629c0cdf19",
  "sourceUnitDigest": "7cbe97b50625f11e0f48f34110ac0ebd07021f9bfcb59e401370841df5e561e9",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "7cbe97b50625f11e0f48f34110ac0ebd07021f9bfcb59e401370841df5e561e9",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-39 (lines 305–323) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-42 (lines 329–347); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```json
{
  "kind": "operation-authorized",
  "authorizationId": "auth_...",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "targetActorId": "fixer",
  "invocationKey": "revision:1",
  "authorizedBy": {"type": "driver", "id": "session-driver"},
  "reason": "accepted findings require revision",
  "grantedContextRefs": [
    "run:<doer-run>/artifact:candidate",
    "run:<reviewer-run>/artifact:review-report",
    "run:<red-team-run>/artifact:red-team-report"
  ],
  "targetArtifactRef": "run:<doer-run>/artifact:candidate",
  "ts": "..."
}
```
````

### Full target shown text

````text
```json
{
  "kind": "operation-authorized",
  "authorizationId": "auth_...",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "targetActorId": "fixer",
  "invocationKey": "revision:1",
  "authorizedBy": {"type": "driver", "id": "session-driver"},
  "reason": "accepted findings require revision",
  "grantedContextRefs": [
    "run:<doer-run>/artifact:candidate",
    "run:<reviewer-run>/artifact:review-report",
    "run:<red-team-run>/artifact:red-team-report"
  ],
  "targetArtifactRef": "run:<doer-run>/artifact:candidate",
  "ts": "..."
}
```
````

## claim_ec17f9f3763b41a8e8cd4896b112d112

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-40, lines 325–326.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-43.
Source digest: 8ba527e6a0a1e15883f3a5667a22c6563bcac738f76947a6993cc3bb6159852b
Target digest: 8ba527e6a0a1e15883f3a5667a22c6563bcac738f76947a6993cc3bb6159852b
Shown source SHA256: 8ba527e6a0a1e15883f3a5667a22c6563bcac738f76947a6993cc3bb6159852b
Shown target SHA256: 8ba527e6a0a1e15883f3a5667a22c6563bcac738f76947a6993cc3bb6159852b

### Proposed decision

```json
{
  "claimId": "claim_ec17f9f3763b41a8e8cd4896b112d112",
  "sourceUnitDigest": "8ba527e6a0a1e15883f3a5667a22c6563bcac738f76947a6993cc3bb6159852b",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "8ba527e6a0a1e15883f3a5667a22c6563bcac738f76947a6993cc3bb6159852b",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-40 (lines 325–326) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-43 (lines 349–350); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Assignment creation for that operation must persist the authorization
provenance:
```

### Full target shown text

```text
Assignment creation for that operation must persist the authorization
provenance:
```

## claim_ece73a7c8e525dc3389235aa65b835c8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-41, lines 328–340.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-44.
Source digest: 8f17f2041b31d76cac51ff737fa7f6f86cc35081fb9445a3badf036d00a17fb7
Target digest: 8f17f2041b31d76cac51ff737fa7f6f86cc35081fb9445a3badf036d00a17fb7
Shown source SHA256: 8f17f2041b31d76cac51ff737fa7f6f86cc35081fb9445a3badf036d00a17fb7
Shown target SHA256: 8f17f2041b31d76cac51ff737fa7f6f86cc35081fb9445a3badf036d00a17fb7

### Proposed decision

```json
{
  "claimId": "claim_ece73a7c8e525dc3389235aa65b835c8",
  "sourceUnitDigest": "8f17f2041b31d76cac51ff737fa7f6f86cc35081fb9445a3badf036d00a17fb7",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "8f17f2041b31d76cac51ff737fa7f6f86cc35081fb9445a3badf036d00a17fb7",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-41 (lines 328–340) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-44 (lines 352–364); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```json
{
  "kind": "assignment-created",
  "assignmentId": "asgn_...",
  "actorId": "fixer",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "authorizationId": "auth_...",
  "invocationKey": "revision:1",
  "contextGrant": {"refs": ["..."]},
  "ts": "..."
}
```
````

### Full target shown text

````text
```json
{
  "kind": "assignment-created",
  "assignmentId": "asgn_...",
  "actorId": "fixer",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "authorizationId": "auth_...",
  "invocationKey": "revision:1",
  "contextGrant": {"refs": ["..."]},
  "ts": "..."
}
```
````

## claim_8c7c6c84c00a6e9819b4a74524a8786b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-42, lines 342–342.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-45.
Source digest: cecce6a8c8f5f1e9efacb27f7fc9a19702a6e5acd3eb75acb2f4cadd4492dd27
Target digest: cecce6a8c8f5f1e9efacb27f7fc9a19702a6e5acd3eb75acb2f4cadd4492dd27
Shown source SHA256: cecce6a8c8f5f1e9efacb27f7fc9a19702a6e5acd3eb75acb2f4cadd4492dd27
Shown target SHA256: cecce6a8c8f5f1e9efacb27f7fc9a19702a6e5acd3eb75acb2f4cadd4492dd27

### Proposed decision

```json
{
  "claimId": "claim_8c7c6c84c00a6e9819b4a74524a8786b",
  "sourceUnitDigest": "cecce6a8c8f5f1e9efacb27f7fc9a19702a6e5acd3eb75acb2f4cadd4492dd27",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "cecce6a8c8f5f1e9efacb27f7fc9a19702a6e5acd3eb75acb2f4cadd4492dd27",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-42 (lines 342–342) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-45 (lines 366–366); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Disposition is a driver event, not a worker result:
```

### Full target shown text

```text
Disposition is a driver event, not a worker result:
```

## claim_6521b59d70ba3485488655ff053371c7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-43, lines 344–353.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-46.
Source digest: 41444fe1606e8df729d978631bcfa7dad0d24c564fc2f5ced15a7f251b4e1f2e
Target digest: 41444fe1606e8df729d978631bcfa7dad0d24c564fc2f5ced15a7f251b4e1f2e
Shown source SHA256: 41444fe1606e8df729d978631bcfa7dad0d24c564fc2f5ced15a7f251b4e1f2e
Shown target SHA256: 41444fe1606e8df729d978631bcfa7dad0d24c564fc2f5ced15a7f251b4e1f2e

### Proposed decision

```json
{
  "claimId": "claim_6521b59d70ba3485488655ff053371c7",
  "sourceUnitDigest": "41444fe1606e8df729d978631bcfa7dad0d24c564fc2f5ced15a7f251b4e1f2e",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "41444fe1606e8df729d978631bcfa7dad0d24c564fc2f5ced15a7f251b4e1f2e",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-43 (lines 344–353) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-46 (lines 368–377); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```json
{
  "kind": "driver-disposition-recorded",
  "targetRef": "finding:RT-1",
  "disposition": "accepted",
  "rationale": "violates declared invariant",
  "evidenceRefs": ["run:<red-team-run>/artifact:red-team-report"],
  "ts": "..."
}
```
````

### Full target shown text

````text
```json
{
  "kind": "driver-disposition-recorded",
  "targetRef": "finding:RT-1",
  "disposition": "accepted",
  "rationale": "violates declared invariant",
  "evidenceRefs": ["run:<red-team-run>/artifact:red-team-report"],
  "ts": "..."
}
```
````

## claim_8db8024b8a0c075bac91c30a1fb37919

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-44, lines 355–360.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-47.
Source digest: f4cafd74698c767758c56991b5f69556e3e6abd1071193a5117dab5065a78fca
Target digest: f4cafd74698c767758c56991b5f69556e3e6abd1071193a5117dab5065a78fca
Shown source SHA256: f4cafd74698c767758c56991b5f69556e3e6abd1071193a5117dab5065a78fca
Shown target SHA256: f4cafd74698c767758c56991b5f69556e3e6abd1071193a5117dab5065a78fca

### Proposed decision

```json
{
  "claimId": "claim_8db8024b8a0c075bac91c30a1fb37919",
  "sourceUnitDigest": "f4cafd74698c767758c56991b5f69556e3e6abd1071193a5117dab5065a78fca",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "f4cafd74698c767758c56991b5f69556e3e6abd1071193a5117dab5065a78fca",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-44 (lines 355–360) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-47 (lines 379–384); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Recheck is not retry:

```txt
retry   = new Run for the same Assignment, with supersession rules
recheck = new Assignment against a new artifact revision/evidence ref
```
````

### Full target shown text

````text
Recheck is not retry:

```txt
retry   = new Run for the same Assignment, with supersession rules
recheck = new Assignment against a new artifact revision/evidence ref
```
````

## claim_4ad8c87f8384c8e91a6ec47e1b7a114f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-45, lines 362–364.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-48.
Source digest: a6a3f6696794c3f97dc1ce13cad679f28707321784dcc298e9486a40c997f3ac
Target digest: a6a3f6696794c3f97dc1ce13cad679f28707321784dcc298e9486a40c997f3ac
Shown source SHA256: a6a3f6696794c3f97dc1ce13cad679f28707321784dcc298e9486a40c997f3ac
Shown target SHA256: a6a3f6696794c3f97dc1ce13cad679f28707321784dcc298e9486a40c997f3ac

### Proposed decision

```json
{
  "claimId": "claim_4ad8c87f8384c8e91a6ec47e1b7a114f",
  "sourceUnitDigest": "a6a3f6696794c3f97dc1ce13cad679f28707321784dcc298e9486a40c997f3ac",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "a6a3f6696794c3f97dc1ce13cad679f28707321784dcc298e9486a40c997f3ac",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-45 (lines 362–364) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-48 (lines 386–388); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Therefore `reviewer-recheck` and `red-team-recheck` are new operations or
driver-authorized redispatches with distinct operation provenance. The old
verdict and RunResult remain immutable.
```

### Full target shown text

```text
Therefore `reviewer-recheck` and `red-team-recheck` are new operations or
driver-authorized redispatches with distinct operation provenance. The old
verdict and RunResult remain immutable.
```

## claim_a6c3ba8d946480f8f384cb862795a778

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-46, lines 366–375.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-49.
Source digest: 0b3f069d274ff51c8c195485bdad481bdd833604bc7e267b5dcf7ee0bfef0e3b
Target digest: 0b3f069d274ff51c8c195485bdad481bdd833604bc7e267b5dcf7ee0bfef0e3b
Shown source SHA256: 0b3f069d274ff51c8c195485bdad481bdd833604bc7e267b5dcf7ee0bfef0e3b
Shown target SHA256: 0b3f069d274ff51c8c195485bdad481bdd833604bc7e267b5dcf7ee0bfef0e3b

### Proposed decision

```json
{
  "claimId": "claim_a6c3ba8d946480f8f384cb862795a778",
  "sourceUnitDigest": "0b3f069d274ff51c8c195485bdad481bdd833604bc7e267b5dcf7ee0bfef0e3b",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "0b3f069d274ff51c8c195485bdad481bdd833604bc7e267b5dcf7ee0bfef0e3b",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-46 (lines 366–375) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-49 (lines 390–399); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Bounds rule:

```txt
An optional operation invocation must satisfy:
  declared binding activation
  binding-level maxInvocations
  aggregateBounds.maxAssignments
  aggregateBounds.maxRounds
  terminal-session refusal
```
````

### Full target shown text

````text
Bounds rule:

```txt
An optional operation invocation must satisfy:
  declared binding activation
  binding-level maxInvocations
  aggregateBounds.maxAssignments
  aggregateBounds.maxRounds
  terminal-session refusal
```
````

## claim_0dd94f2f8d923e9ddfb0704a4fd00c32

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-47, lines 377–379.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-50.
Source digest: 19d5df58cf48278020ed700c83571292f7f6fb883398f3015c0b128985fa8615
Target digest: 19d5df58cf48278020ed700c83571292f7f6fb883398f3015c0b128985fa8615
Shown source SHA256: 19d5df58cf48278020ed700c83571292f7f6fb883398f3015c0b128985fa8615
Shown target SHA256: 19d5df58cf48278020ed700c83571292f7f6fb883398f3015c0b128985fa8615

### Proposed decision

```json
{
  "claimId": "claim_0dd94f2f8d923e9ddfb0704a4fd00c32",
  "sourceUnitDigest": "19d5df58cf48278020ed700c83571292f7f6fb883398f3015c0b128985fa8615",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "19d5df58cf48278020ed700c83571292f7f6fb883398f3015c0b128985fa8615",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "7. MVP2 - Driver Authorization Primitive"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-47 (lines 377–379) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-50 (lines 401–403); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Binding-level caps never widen aggregate caps. `aggregateBounds.maxRounds`
remains the hard session-wide ceiling; binding caps only narrow a specific
operation position.
```

### Full target shown text

```text
Binding-level caps never widen aggregate caps. `aggregateBounds.maxRounds`
remains the hard session-wide ceiling; binding caps only narrow a specific
operation position.
```

## claim_1ab29484f63a2286ca9e6d6578ef9747

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#8-mvp-plan, lines 381–381.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#8-mvp-plan.
Source digest: fa56498fad68f11d1029d7b8017f2c25bac3441124cf011fdf22d94eb010784b
Target digest: fa56498fad68f11d1029d7b8017f2c25bac3441124cf011fdf22d94eb010784b
Shown source SHA256: 7306e40cc58274c7fb931385fa320916531062018a4d2a032ff6a76897e1ebd1
Shown target SHA256: 7306e40cc58274c7fb931385fa320916531062018a4d2a032ff6a76897e1ebd1

### Proposed decision

```json
{
  "claimId": "claim_1ab29484f63a2286ca9e6d6578ef9747",
  "sourceUnitDigest": "fa56498fad68f11d1029d7b8017f2c25bac3441124cf011fdf22d94eb010784b",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "8-mvp-plan",
  "targetUnitDigest": "fa56498fad68f11d1029d7b8017f2c25bac3441124cf011fdf22d94eb010784b",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#8-mvp-plan (lines 381–381) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#8-mvp-plan (lines 405–405); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 8. MVP Plan

MVPs 0-5 make Master Coordination usable as a standalone group-thinking proof.
MVPs 6-9 preserve the expansion path for broader methods such as Delphi, NGT,
RFC review, adversarial triads, and specialist pull-in.

| MVP | Goal | Real shape | Docs/schema/runtime | Proof | Held invariant |
|---|---|---|---|---|
| 0 | Shape lock. | Record the stable spine and boundaries before runtime work. | Docs-only. | Link/check review. | No source runtime edit; Step 09 remains discussion. |
| 1 | Standalone Master Coordination fixture. | `plan.md` or `artifact.md` enters a declared worker graph: Doer, Reviewer, Red-Team, Fixer/Doer-followup, optional Synthesizer. Doer/Fixer produce session-local artifacts/revisions. | Docs + fixture draft first; then schema validation when accepted. | Static skeleton can be expressed without Work fields. | `group-cognition-framework.yaml` remains untouched. |
| 2 | Driver authorization primitive. | Optional operations require `operation-authorized` before dispatch. Authorization carries `authorizationId`, `operationId`, `targetActorId`, `invocationKey`, `authorizedBy`, `reason`, `grantedContextRefs`, and `artifactRevision`. | Schema/runtime after acceptance. | Reject missing authorization, undeclared operation, over-cap invocation, terminal-session authorization, and context beyond grant. | External driver is authority; budget/topology caps stay hard. |
| 3 | Recheck and disposition. | Recheck is a new Assignment against a new artifact revision; disposition is a driver event, not worker self-report. | Schema/runtime after MVP 2. | Old verdict remains immutable; new verdict links to revision; synthesis preserves dissent and unresolved findings. | Retry remains attempt supersession, not recheck. |
| 4 | Surface launcher. | A skill/slash surface builds a request for a declared fixture and calls `fgos coordination run --file`, then reads `coordination show`/evidence. | Surface only; no group-thinking logic inside the skill. | Launcher cannot bypass FlowDefinition/session authorization. | Surface is not truth or coordination mechanism. |
| 5 | Live standalone proof. | Run the Master Coordination loop with no Work: input plan, Doer artifact, Reviewer report, Red-Team report, driver-authorized fix, revision, recheck, final disposition. | CLI/headless run. | CLI/headless parity, crash/resume no duplicate, unauthorized optional operation rejected, hidden context rejected, bounds enforced. | No Work lifecycle, git, merge, or repo mutation. |
| 6 | Visibility windows. | Topology declares fail-closed private-first-pass and post-independent-pass windows; operation bindings select a window; runtime authorization carries the exact eligible `grantedContextRefs`. | Deferred schema/runtime. | Post-milestone sharing works only in an opt-in fixture; pre-window, foreign-session, late/failed-source, and unchanged isolation-fixture access reject. | FlowDefinition is legality, context grant is invocation authority, and isolation-heavy fixtures remain unchanged. |
| 7 | Evidence-preserving aggregation. | Keep completion eligibility separate from one `evidence-preserving-synthesis` method with `consensus`, `qualified`, or `no-consensus` outcome and mandatory disclosure fields. | Deferred schema/runtime plus Team Cognition boundary. | Validation rejects hidden source gaps, dissent, unresolved objections, failed/missing actors, or stale artifact revisions. | Aggregation never upgrades RunResult confidence or becomes driver disposition. |
| 8 | Deliberation memory. | Session events link immutable artifacts as `proposal`, `objection`, `response`, `clarification`, `rank`, or `specialist-request` contributions with explicit lineage. | Deferred schema/runtime. | Replay reconstructs contribution chains using artifact refs without chat history. | No recipient, inbox, unread, delivery, arbitrary message body, or mutable record status. |
| 9 | Bounded dynamic specialist pull-in. | The driver binds a specialist identity into a predeclared role/capability/assignment-capped specialist slot, then authorizes declared operations normally. | Deferred schema/runtime. | Opt-in slot works; undeclared slot, second/over-cap binding, unauthorized writer, terminal session, and isolation fixtures reject. | No arbitrary runtime edge, autonomous recruitment, or global dynamic topology. |
```

### Full target shown text

```text
## 8. MVP Plan

MVPs 0-5 make Master Coordination usable as a standalone group-thinking proof.
MVPs 6-9 preserve the expansion path for broader methods such as Delphi, NGT,
RFC review, adversarial triads, and specialist pull-in.

| MVP | Goal | Real shape | Docs/schema/runtime | Proof | Held invariant |
|---|---|---|---|---|
| 0 | Shape lock. | Record the stable spine and boundaries before runtime work. | Docs-only. | Link/check review. | No source runtime edit; Step 09 remains discussion. |
| 1 | Standalone Master Coordination fixture. | `plan.md` or `artifact.md` enters a declared worker graph: Doer, Reviewer, Red-Team, Fixer/Doer-followup, optional Synthesizer. Doer/Fixer produce session-local artifacts/revisions. | Docs + fixture draft first; then schema validation when accepted. | Static skeleton can be expressed without Work fields. | `group-cognition-framework.yaml` remains untouched. |
| 2 | Driver authorization primitive. | Optional operations require `operation-authorized` before dispatch. Authorization carries `authorizationId`, `operationId`, `targetActorId`, `invocationKey`, `authorizedBy`, `reason`, `grantedContextRefs`, and `artifactRevision`. | Schema/runtime after acceptance. | Reject missing authorization, undeclared operation, over-cap invocation, terminal-session authorization, and context beyond grant. | External driver is authority; budget/topology caps stay hard. |
| 3 | Recheck and disposition. | Recheck is a new Assignment against a new artifact revision; disposition is a driver event, not worker self-report. | Schema/runtime after MVP 2. | Old verdict remains immutable; new verdict links to revision; synthesis preserves dissent and unresolved findings. | Retry remains attempt supersession, not recheck. |
| 4 | Surface launcher. | A skill/slash surface builds a request for a declared fixture and calls `fgos coordination run --file`, then reads `coordination show`/evidence. | Surface only; no group-thinking logic inside the skill. | Launcher cannot bypass FlowDefinition/session authorization. | Surface is not truth or coordination mechanism. |
| 5 | Live standalone proof. | Run the Master Coordination loop with no Work: input plan, Doer artifact, Reviewer report, Red-Team report, driver-authorized fix, revision, recheck, final disposition. | CLI/headless run. | CLI/headless parity, crash/resume no duplicate, unauthorized optional operation rejected, hidden context rejected, bounds enforced. | No Work lifecycle, git, merge, or repo mutation. |
| 6 | Visibility windows. | Topology declares fail-closed private-first-pass and post-independent-pass windows; operation bindings select a window; runtime authorization carries the exact eligible `grantedContextRefs`. | Deferred schema/runtime. | Post-milestone sharing works only in an opt-in fixture; pre-window, foreign-session, late/failed-source, and unchanged isolation-fixture access reject. | FlowDefinition is legality, context grant is invocation authority, and isolation-heavy fixtures remain unchanged. |
| 7 | Evidence-preserving aggregation. | Keep completion eligibility separate from one `evidence-preserving-synthesis` method with `consensus`, `qualified`, or `no-consensus` outcome and mandatory disclosure fields. | Deferred schema/runtime plus Team Cognition boundary. | Validation rejects hidden source gaps, dissent, unresolved objections, failed/missing actors, or stale artifact revisions. | Aggregation never upgrades RunResult confidence or becomes driver disposition. |
| 8 | Deliberation memory. | Session events link immutable artifacts as `proposal`, `objection`, `response`, `clarification`, `rank`, or `specialist-request` contributions with explicit lineage. | Deferred schema/runtime. | Replay reconstructs contribution chains using artifact refs without chat history. | No recipient, inbox, unread, delivery, arbitrary message body, or mutable record status. |
| 9 | Bounded dynamic specialist pull-in. | The driver binds a specialist identity into a predeclared role/capability/assignment-capped specialist slot, then authorizes declared operations normally. | Deferred schema/runtime. | Opt-in slot works; undeclared slot, second/over-cap binding, unauthorized writer, terminal session, and isolation fixtures reject. | No arbitrary runtime edge, autonomous recruitment, or global dynamic topology. |
```

## claim_9e2a32d9733c72aaa9b926b454053139

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-48, lines 383–385.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-51.
Source digest: 38bfa976bcfc52b82ddccc9ef62b9a4b8d6fe7cd971ee03653354d4a564d64c3
Target digest: 38bfa976bcfc52b82ddccc9ef62b9a4b8d6fe7cd971ee03653354d4a564d64c3
Shown source SHA256: 38bfa976bcfc52b82ddccc9ef62b9a4b8d6fe7cd971ee03653354d4a564d64c3
Shown target SHA256: 38bfa976bcfc52b82ddccc9ef62b9a4b8d6fe7cd971ee03653354d4a564d64c3

### Proposed decision

```json
{
  "claimId": "claim_9e2a32d9733c72aaa9b926b454053139",
  "sourceUnitDigest": "38bfa976bcfc52b82ddccc9ef62b9a4b8d6fe7cd971ee03653354d4a564d64c3",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "38bfa976bcfc52b82ddccc9ef62b9a4b8d6fe7cd971ee03653354d4a564d64c3",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-48 (lines 383–385) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-51 (lines 407–409); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
MVPs 0-5 make Master Coordination usable as a standalone group-thinking proof.
MVPs 6-9 preserve the expansion path for broader methods such as Delphi, NGT,
RFC review, adversarial triads, and specialist pull-in.
```

### Full target shown text

```text
MVPs 0-5 make Master Coordination usable as a standalone group-thinking proof.
MVPs 6-9 preserve the expansion path for broader methods such as Delphi, NGT,
RFC review, adversarial triads, and specialist pull-in.
```

## claim_4b3d19b00a75b5400a09a605c6d1fe18

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-49, lines 387–398.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-52.
Source digest: f45d73f0242fd79df0effcc6f99222d82f3bde02c5173bfbb05a393d7dbe9f13
Target digest: f45d73f0242fd79df0effcc6f99222d82f3bde02c5173bfbb05a393d7dbe9f13
Shown source SHA256: f45d73f0242fd79df0effcc6f99222d82f3bde02c5173bfbb05a393d7dbe9f13
Shown target SHA256: f45d73f0242fd79df0effcc6f99222d82f3bde02c5173bfbb05a393d7dbe9f13

### Proposed decision

```json
{
  "claimId": "claim_4b3d19b00a75b5400a09a605c6d1fe18",
  "sourceUnitDigest": "f45d73f0242fd79df0effcc6f99222d82f3bde02c5173bfbb05a393d7dbe9f13",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "f45d73f0242fd79df0effcc6f99222d82f3bde02c5173bfbb05a393d7dbe9f13",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-49 (lines 387–398) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-52 (lines 411–422); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| MVP | Goal | Real shape | Docs/schema/runtime | Proof | Held invariant |
|---|---|---|---|---|
| 0 | Shape lock. | Record the stable spine and boundaries before runtime work. | Docs-only. | Link/check review. | No source runtime edit; Step 09 remains discussion. |
| 1 | Standalone Master Coordination fixture. | `plan.md` or `artifact.md` enters a declared worker graph: Doer, Reviewer, Red-Team, Fixer/Doer-followup, optional Synthesizer. Doer/Fixer produce session-local artifacts/revisions. | Docs + fixture draft first; then schema validation when accepted. | Static skeleton can be expressed without Work fields. | `group-cognition-framework.yaml` remains untouched. |
| 2 | Driver authorization primitive. | Optional operations require `operation-authorized` before dispatch. Authorization carries `authorizationId`, `operationId`, `targetActorId`, `invocationKey`, `authorizedBy`, `reason`, `grantedContextRefs`, and `artifactRevision`. | Schema/runtime after acceptance. | Reject missing authorization, undeclared operation, over-cap invocation, terminal-session authorization, and context beyond grant. | External driver is authority; budget/topology caps stay hard. |
| 3 | Recheck and disposition. | Recheck is a new Assignment against a new artifact revision; disposition is a driver event, not worker self-report. | Schema/runtime after MVP 2. | Old verdict remains immutable; new verdict links to revision; synthesis preserves dissent and unresolved findings. | Retry remains attempt supersession, not recheck. |
| 4 | Surface launcher. | A skill/slash surface builds a request for a declared fixture and calls `fgos coordination run --file`, then reads `coordination show`/evidence. | Surface only; no group-thinking logic inside the skill. | Launcher cannot bypass FlowDefinition/session authorization. | Surface is not truth or coordination mechanism. |
| 5 | Live standalone proof. | Run the Master Coordination loop with no Work: input plan, Doer artifact, Reviewer report, Red-Team report, driver-authorized fix, revision, recheck, final disposition. | CLI/headless run. | CLI/headless parity, crash/resume no duplicate, unauthorized optional operation rejected, hidden context rejected, bounds enforced. | No Work lifecycle, git, merge, or repo mutation. |
| 6 | Visibility windows. | Topology declares fail-closed private-first-pass and post-independent-pass windows; operation bindings select a window; runtime authorization carries the exact eligible `grantedContextRefs`. | Deferred schema/runtime. | Post-milestone sharing works only in an opt-in fixture; pre-window, foreign-session, late/failed-source, and unchanged isolation-fixture access reject. | FlowDefinition is legality, context grant is invocation authority, and isolation-heavy fixtures remain unchanged. |
| 7 | Evidence-preserving aggregation. | Keep completion eligibility separate from one `evidence-preserving-synthesis` method with `consensus`, `qualified`, or `no-consensus` outcome and mandatory disclosure fields. | Deferred schema/runtime plus Team Cognition boundary. | Validation rejects hidden source gaps, dissent, unresolved objections, failed/missing actors, or stale artifact revisions. | Aggregation never upgrades RunResult confidence or becomes driver disposition. |
| 8 | Deliberation memory. | Session events link immutable artifacts as `proposal`, `objection`, `response`, `clarification`, `rank`, or `specialist-request` contributions with explicit lineage. | Deferred schema/runtime. | Replay reconstructs contribution chains using artifact refs without chat history. | No recipient, inbox, unread, delivery, arbitrary message body, or mutable record status. |
| 9 | Bounded dynamic specialist pull-in. | The driver binds a specialist identity into a predeclared role/capability/assignment-capped specialist slot, then authorizes declared operations normally. | Deferred schema/runtime. | Opt-in slot works; undeclared slot, second/over-cap binding, unauthorized writer, terminal session, and isolation fixtures reject. | No arbitrary runtime edge, autonomous recruitment, or global dynamic topology. |
```

### Full target shown text

```text
| MVP | Goal | Real shape | Docs/schema/runtime | Proof | Held invariant |
|---|---|---|---|---|
| 0 | Shape lock. | Record the stable spine and boundaries before runtime work. | Docs-only. | Link/check review. | No source runtime edit; Step 09 remains discussion. |
| 1 | Standalone Master Coordination fixture. | `plan.md` or `artifact.md` enters a declared worker graph: Doer, Reviewer, Red-Team, Fixer/Doer-followup, optional Synthesizer. Doer/Fixer produce session-local artifacts/revisions. | Docs + fixture draft first; then schema validation when accepted. | Static skeleton can be expressed without Work fields. | `group-cognition-framework.yaml` remains untouched. |
| 2 | Driver authorization primitive. | Optional operations require `operation-authorized` before dispatch. Authorization carries `authorizationId`, `operationId`, `targetActorId`, `invocationKey`, `authorizedBy`, `reason`, `grantedContextRefs`, and `artifactRevision`. | Schema/runtime after acceptance. | Reject missing authorization, undeclared operation, over-cap invocation, terminal-session authorization, and context beyond grant. | External driver is authority; budget/topology caps stay hard. |
| 3 | Recheck and disposition. | Recheck is a new Assignment against a new artifact revision; disposition is a driver event, not worker self-report. | Schema/runtime after MVP 2. | Old verdict remains immutable; new verdict links to revision; synthesis preserves dissent and unresolved findings. | Retry remains attempt supersession, not recheck. |
| 4 | Surface launcher. | A skill/slash surface builds a request for a declared fixture and calls `fgos coordination run --file`, then reads `coordination show`/evidence. | Surface only; no group-thinking logic inside the skill. | Launcher cannot bypass FlowDefinition/session authorization. | Surface is not truth or coordination mechanism. |
| 5 | Live standalone proof. | Run the Master Coordination loop with no Work: input plan, Doer artifact, Reviewer report, Red-Team report, driver-authorized fix, revision, recheck, final disposition. | CLI/headless run. | CLI/headless parity, crash/resume no duplicate, unauthorized optional operation rejected, hidden context rejected, bounds enforced. | No Work lifecycle, git, merge, or repo mutation. |
| 6 | Visibility windows. | Topology declares fail-closed private-first-pass and post-independent-pass windows; operation bindings select a window; runtime authorization carries the exact eligible `grantedContextRefs`. | Deferred schema/runtime. | Post-milestone sharing works only in an opt-in fixture; pre-window, foreign-session, late/failed-source, and unchanged isolation-fixture access reject. | FlowDefinition is legality, context grant is invocation authority, and isolation-heavy fixtures remain unchanged. |
| 7 | Evidence-preserving aggregation. | Keep completion eligibility separate from one `evidence-preserving-synthesis` method with `consensus`, `qualified`, or `no-consensus` outcome and mandatory disclosure fields. | Deferred schema/runtime plus Team Cognition boundary. | Validation rejects hidden source gaps, dissent, unresolved objections, failed/missing actors, or stale artifact revisions. | Aggregation never upgrades RunResult confidence or becomes driver disposition. |
| 8 | Deliberation memory. | Session events link immutable artifacts as `proposal`, `objection`, `response`, `clarification`, `rank`, or `specialist-request` contributions with explicit lineage. | Deferred schema/runtime. | Replay reconstructs contribution chains using artifact refs without chat history. | No recipient, inbox, unread, delivery, arbitrary message body, or mutable record status. |
| 9 | Bounded dynamic specialist pull-in. | The driver binds a specialist identity into a predeclared role/capability/assignment-capped specialist slot, then authorizes declared operations normally. | Deferred schema/runtime. | Opt-in slot works; undeclared slot, second/over-cap binding, unauthorized writer, terminal session, and isolation fixtures reject. | No arbitrary runtime edge, autonomous recruitment, or global dynamic topology. |
```

## claim_227d062515671b53703da0fed567b7c9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#81-locked-mvp6-mvp9-shape, lines 400–400.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#81-locked-mvp6-mvp9-shape.
Source digest: 035a374443fdc24b639e77c16484e0f42f77b65292b09e27a7797017e2553a50
Target digest: 035a374443fdc24b639e77c16484e0f42f77b65292b09e27a7797017e2553a50
Shown source SHA256: bd2dd0649ab1b888ab8310c083ff373fc24e1ef453f5e4e950dbae5684935d5f
Shown target SHA256: bd2dd0649ab1b888ab8310c083ff373fc24e1ef453f5e4e950dbae5684935d5f

### Proposed decision

```json
{
  "claimId": "claim_227d062515671b53703da0fed567b7c9",
  "sourceUnitDigest": "035a374443fdc24b639e77c16484e0f42f77b65292b09e27a7797017e2553a50",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "81-locked-mvp6-mvp9-shape",
  "targetUnitDigest": "035a374443fdc24b639e77c16484e0f42f77b65292b09e27a7797017e2553a50",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#81-locked-mvp6-mvp9-shape (lines 400–400) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#81-locked-mvp6-mvp9-shape (lines 424–424); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 8.1 Locked MVP6-MVP9 Shape

The discussion round on 2026-09-03 narrows the four remaining MVPs as follows.
These are planning inputs, not accepted runtime contracts until each slice is
implemented, proved, and promoted into the canonical contracts.

**MVP6 ownership and shape.** `spec.profile.topology.visibilityWindows`
declares static legality. A node-operation binding may select one window using
`contextAccess.visibilityWindowRef`. The first slice supports only
private-first-pass and post-independent-pass sharing of same-session artifact
refs. The milestone is replay-derived from listed first-pass `result-linked`
events; missing, failed, or late sources keep it closed, while a formally
recorded replacement may satisfy the original obligation. Partial-window
exceptions, anonymization, aggregate transformation, and cross-session grants
remain deferred. `operation-authorized.grantedContextRefs` and
`assignment-created.contextGrant.refs` remain the exact invocation authority
and replay proof.

**MVP7 ownership and shape.** Existing `completion.mode` keeps its completion-
eligibility meaning. A separate `completion.aggregation` declaration selects
`evidence-preserving-synthesis`, names source and output operations, and
requires disclosure of source coverage, dissent, unresolved objections,
missing/failed actors, and artifact revisions. Team Cognition validates a
linked RunResult artifact and records an `aggregation-validated` fact with
outcome `consensus | qualified | no-consensus`; Agent Coordination alone
decides whether the session may transition terminal. Vote, rank tally,
weighted scoring, convergence, and prose-parsed pseudo-voting remain deferred.

**MVP8 ownership and shape.** Operations declare allowed contribution types;
the session ledger records `deliberation-contribution-linked` with contribution
identity/type, Assignment/Run/artifact provenance, anchors, response lineage,
round key, and visibility-window provenance. Contribution content remains in
immutable artifacts. Existing `driver-disposition-recorded` may target a
contribution and remains the only final disposition primitive. No general
AgentMessage, mailbox, recipient, delivery, unread, mutable thread status, or
arbitrary event-body protocol is introduced.

**MVP9 ownership and shape.** `topology.specialistSlots` predeclares legal
role, capability, operation, visibility-window, binding, and Assignment caps.
The external driver records `specialist-authorized`; the runtime atomically
binds the session-scoped actor and then uses existing `operation-authorized`
for each invocation. Workers may emit `specialist-request` contributions but
cannot recruit or dispatch. Expiry stops future materialization and never
erases history. `addSessionEdge`, arbitrary topology overlays, driver handoff,
persistent organization membership, and peer-invited specialists remain
deferred.
```

### Full target shown text

```text
### 8.1 Locked MVP6-MVP9 Shape

The discussion round on 2026-09-03 narrows the four remaining MVPs as follows.
These are planning inputs, not accepted runtime contracts until each slice is
implemented, proved, and promoted into the canonical contracts.

**MVP6 ownership and shape.** `spec.profile.topology.visibilityWindows`
declares static legality. A node-operation binding may select one window using
`contextAccess.visibilityWindowRef`. The first slice supports only
private-first-pass and post-independent-pass sharing of same-session artifact
refs. The milestone is replay-derived from listed first-pass `result-linked`
events; missing, failed, or late sources keep it closed, while a formally
recorded replacement may satisfy the original obligation. Partial-window
exceptions, anonymization, aggregate transformation, and cross-session grants
remain deferred. `operation-authorized.grantedContextRefs` and
`assignment-created.contextGrant.refs` remain the exact invocation authority
and replay proof.

**MVP7 ownership and shape.** Existing `completion.mode` keeps its completion-
eligibility meaning. A separate `completion.aggregation` declaration selects
`evidence-preserving-synthesis`, names source and output operations, and
requires disclosure of source coverage, dissent, unresolved objections,
missing/failed actors, and artifact revisions. Team Cognition validates a
linked RunResult artifact and records an `aggregation-validated` fact with
outcome `consensus | qualified | no-consensus`; Agent Coordination alone
decides whether the session may transition terminal. Vote, rank tally,
weighted scoring, convergence, and prose-parsed pseudo-voting remain deferred.

**MVP8 ownership and shape.** Operations declare allowed contribution types;
the session ledger records `deliberation-contribution-linked` with contribution
identity/type, Assignment/Run/artifact provenance, anchors, response lineage,
round key, and visibility-window provenance. Contribution content remains in
immutable artifacts. Existing `driver-disposition-recorded` may target a
contribution and remains the only final disposition primitive. No general
AgentMessage, mailbox, recipient, delivery, unread, mutable thread status, or
arbitrary event-body protocol is introduced.

**MVP9 ownership and shape.** `topology.specialistSlots` predeclares legal
role, capability, operation, visibility-window, binding, and Assignment caps.
The external driver records `specialist-authorized`; the runtime atomically
binds the session-scoped actor and then uses existing `operation-authorized`
for each invocation. Workers may emit `specialist-request` contributions but
cannot recruit or dispatch. Expiry stops future materialization and never
erases history. `addSessionEdge`, arbitrary topology overlays, driver handoff,
persistent organization membership, and peer-invited specialists remain
deferred.
```

## claim_8fb4fa2a155e6e0357e5bdca9e35cde9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-50, lines 402–404.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-53.
Source digest: b36f55ca75c855faf3510c67801c2bfaabfd4fca1eb904d6107b57208c322cfe
Target digest: b36f55ca75c855faf3510c67801c2bfaabfd4fca1eb904d6107b57208c322cfe
Shown source SHA256: b36f55ca75c855faf3510c67801c2bfaabfd4fca1eb904d6107b57208c322cfe
Shown target SHA256: b36f55ca75c855faf3510c67801c2bfaabfd4fca1eb904d6107b57208c322cfe

### Proposed decision

```json
{
  "claimId": "claim_8fb4fa2a155e6e0357e5bdca9e35cde9",
  "sourceUnitDigest": "b36f55ca75c855faf3510c67801c2bfaabfd4fca1eb904d6107b57208c322cfe",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "b36f55ca75c855faf3510c67801c2bfaabfd4fca1eb904d6107b57208c322cfe",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan",
    "8.1 Locked MVP6-MVP9 Shape"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-50 (lines 402–404) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-53 (lines 426–428); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The discussion round on 2026-09-03 narrows the four remaining MVPs as follows.
These are planning inputs, not accepted runtime contracts until each slice is
implemented, proved, and promoted into the canonical contracts.
```

### Full target shown text

```text
The discussion round on 2026-09-03 narrows the four remaining MVPs as follows.
These are planning inputs, not accepted runtime contracts until each slice is
implemented, proved, and promoted into the canonical contracts.
```

## claim_3f9938c2d597a9bc55c37fad133c4636

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-51, lines 406–416.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-54.
Source digest: 1f956473b63b7e0a56407a1c1d54bc0c4fe3953f314c8152eec395460262c3ff
Target digest: 1f956473b63b7e0a56407a1c1d54bc0c4fe3953f314c8152eec395460262c3ff
Shown source SHA256: 1f956473b63b7e0a56407a1c1d54bc0c4fe3953f314c8152eec395460262c3ff
Shown target SHA256: 1f956473b63b7e0a56407a1c1d54bc0c4fe3953f314c8152eec395460262c3ff

### Proposed decision

```json
{
  "claimId": "claim_3f9938c2d597a9bc55c37fad133c4636",
  "sourceUnitDigest": "1f956473b63b7e0a56407a1c1d54bc0c4fe3953f314c8152eec395460262c3ff",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "1f956473b63b7e0a56407a1c1d54bc0c4fe3953f314c8152eec395460262c3ff",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan",
    "8.1 Locked MVP6-MVP9 Shape"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-51 (lines 406–416) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-54 (lines 430–440); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**MVP6 ownership and shape.** `spec.profile.topology.visibilityWindows`
declares static legality. A node-operation binding may select one window using
`contextAccess.visibilityWindowRef`. The first slice supports only
private-first-pass and post-independent-pass sharing of same-session artifact
refs. The milestone is replay-derived from listed first-pass `result-linked`
events; missing, failed, or late sources keep it closed, while a formally
recorded replacement may satisfy the original obligation. Partial-window
exceptions, anonymization, aggregate transformation, and cross-session grants
remain deferred. `operation-authorized.grantedContextRefs` and
`assignment-created.contextGrant.refs` remain the exact invocation authority
and replay proof.
```

### Full target shown text

```text
**MVP6 ownership and shape.** `spec.profile.topology.visibilityWindows`
declares static legality. A node-operation binding may select one window using
`contextAccess.visibilityWindowRef`. The first slice supports only
private-first-pass and post-independent-pass sharing of same-session artifact
refs. The milestone is replay-derived from listed first-pass `result-linked`
events; missing, failed, or late sources keep it closed, while a formally
recorded replacement may satisfy the original obligation. Partial-window
exceptions, anonymization, aggregate transformation, and cross-session grants
remain deferred. `operation-authorized.grantedContextRefs` and
`assignment-created.contextGrant.refs` remain the exact invocation authority
and replay proof.
```

## claim_9b0bab0211180d67107aca8ff802c22f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-52, lines 418–426.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-55.
Source digest: 56d86ee7d3b7738ff87fe704d769dcee273ca55ba2f90dc3bd1603c3ce76851e
Target digest: 56d86ee7d3b7738ff87fe704d769dcee273ca55ba2f90dc3bd1603c3ce76851e
Shown source SHA256: 56d86ee7d3b7738ff87fe704d769dcee273ca55ba2f90dc3bd1603c3ce76851e
Shown target SHA256: 56d86ee7d3b7738ff87fe704d769dcee273ca55ba2f90dc3bd1603c3ce76851e

### Proposed decision

```json
{
  "claimId": "claim_9b0bab0211180d67107aca8ff802c22f",
  "sourceUnitDigest": "56d86ee7d3b7738ff87fe704d769dcee273ca55ba2f90dc3bd1603c3ce76851e",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "56d86ee7d3b7738ff87fe704d769dcee273ca55ba2f90dc3bd1603c3ce76851e",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan",
    "8.1 Locked MVP6-MVP9 Shape"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-52 (lines 418–426) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-55 (lines 442–450); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**MVP7 ownership and shape.** Existing `completion.mode` keeps its completion-
eligibility meaning. A separate `completion.aggregation` declaration selects
`evidence-preserving-synthesis`, names source and output operations, and
requires disclosure of source coverage, dissent, unresolved objections,
missing/failed actors, and artifact revisions. Team Cognition validates a
linked RunResult artifact and records an `aggregation-validated` fact with
outcome `consensus | qualified | no-consensus`; Agent Coordination alone
decides whether the session may transition terminal. Vote, rank tally,
weighted scoring, convergence, and prose-parsed pseudo-voting remain deferred.
```

### Full target shown text

```text
**MVP7 ownership and shape.** Existing `completion.mode` keeps its completion-
eligibility meaning. A separate `completion.aggregation` declaration selects
`evidence-preserving-synthesis`, names source and output operations, and
requires disclosure of source coverage, dissent, unresolved objections,
missing/failed actors, and artifact revisions. Team Cognition validates a
linked RunResult artifact and records an `aggregation-validated` fact with
outcome `consensus | qualified | no-consensus`; Agent Coordination alone
decides whether the session may transition terminal. Vote, rank tally,
weighted scoring, convergence, and prose-parsed pseudo-voting remain deferred.
```

## claim_18368b20eeeef025880553b53e803509

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-53, lines 428–435.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-56.
Source digest: 4a0ccdd1750e800abb30d511811651a8c35f6a6dde1d8d029d4985373704f32e
Target digest: 4a0ccdd1750e800abb30d511811651a8c35f6a6dde1d8d029d4985373704f32e
Shown source SHA256: 4a0ccdd1750e800abb30d511811651a8c35f6a6dde1d8d029d4985373704f32e
Shown target SHA256: 4a0ccdd1750e800abb30d511811651a8c35f6a6dde1d8d029d4985373704f32e

### Proposed decision

```json
{
  "claimId": "claim_18368b20eeeef025880553b53e803509",
  "sourceUnitDigest": "4a0ccdd1750e800abb30d511811651a8c35f6a6dde1d8d029d4985373704f32e",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "4a0ccdd1750e800abb30d511811651a8c35f6a6dde1d8d029d4985373704f32e",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan",
    "8.1 Locked MVP6-MVP9 Shape"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-53 (lines 428–435) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-56 (lines 452–459); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**MVP8 ownership and shape.** Operations declare allowed contribution types;
the session ledger records `deliberation-contribution-linked` with contribution
identity/type, Assignment/Run/artifact provenance, anchors, response lineage,
round key, and visibility-window provenance. Contribution content remains in
immutable artifacts. Existing `driver-disposition-recorded` may target a
contribution and remains the only final disposition primitive. No general
AgentMessage, mailbox, recipient, delivery, unread, mutable thread status, or
arbitrary event-body protocol is introduced.
```

### Full target shown text

```text
**MVP8 ownership and shape.** Operations declare allowed contribution types;
the session ledger records `deliberation-contribution-linked` with contribution
identity/type, Assignment/Run/artifact provenance, anchors, response lineage,
round key, and visibility-window provenance. Contribution content remains in
immutable artifacts. Existing `driver-disposition-recorded` may target a
contribution and remains the only final disposition primitive. No general
AgentMessage, mailbox, recipient, delivery, unread, mutable thread status, or
arbitrary event-body protocol is introduced.
```

## claim_e7cb659b3714c224a39550c9d62fc8c3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-54, lines 437–445.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-57.
Source digest: 5fa4bd46db4a2aa9d4df066eec6f6779dbd5c8706a1ad180f22292ba9e5775d9
Target digest: 5fa4bd46db4a2aa9d4df066eec6f6779dbd5c8706a1ad180f22292ba9e5775d9
Shown source SHA256: 5fa4bd46db4a2aa9d4df066eec6f6779dbd5c8706a1ad180f22292ba9e5775d9
Shown target SHA256: 5fa4bd46db4a2aa9d4df066eec6f6779dbd5c8706a1ad180f22292ba9e5775d9

### Proposed decision

```json
{
  "claimId": "claim_e7cb659b3714c224a39550c9d62fc8c3",
  "sourceUnitDigest": "5fa4bd46db4a2aa9d4df066eec6f6779dbd5c8706a1ad180f22292ba9e5775d9",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "5fa4bd46db4a2aa9d4df066eec6f6779dbd5c8706a1ad180f22292ba9e5775d9",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan",
    "8.1 Locked MVP6-MVP9 Shape"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-54 (lines 437–445) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-57 (lines 461–469); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**MVP9 ownership and shape.** `topology.specialistSlots` predeclares legal
role, capability, operation, visibility-window, binding, and Assignment caps.
The external driver records `specialist-authorized`; the runtime atomically
binds the session-scoped actor and then uses existing `operation-authorized`
for each invocation. Workers may emit `specialist-request` contributions but
cannot recruit or dispatch. Expiry stops future materialization and never
erases history. `addSessionEdge`, arbitrary topology overlays, driver handoff,
persistent organization membership, and peer-invited specialists remain
deferred.
```

### Full target shown text

```text
**MVP9 ownership and shape.** `topology.specialistSlots` predeclares legal
role, capability, operation, visibility-window, binding, and Assignment caps.
The external driver records `specialist-authorized`; the runtime atomically
binds the session-scoped actor and then uses existing `operation-authorized`
for each invocation. Workers may emit `specialist-request` contributions but
cannot recruit or dispatch. Expiry stops future materialization and never
erases history. `addSessionEdge`, arbitrary topology overlays, driver handoff,
persistent organization membership, and peer-invited specialists remain
deferred.
```

## claim_8610099c237f8e8c70a88a1d185904db

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#82-post-mvp9-acceptance-layer, lines 447–447.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#82-post-mvp9-acceptance-layer.
Source digest: 863a4f5c2b1382ce54aa0c40119bf81618f3e1295c276e294d0ada6f6981f10e
Target digest: 863a4f5c2b1382ce54aa0c40119bf81618f3e1295c276e294d0ada6f6981f10e
Shown source SHA256: ec46a2220354e4f3695e3d885d95a238a2cf2e012d6166b00c68cab19ed045ef
Shown target SHA256: ec46a2220354e4f3695e3d885d95a238a2cf2e012d6166b00c68cab19ed045ef

### Proposed decision

```json
{
  "claimId": "claim_8610099c237f8e8c70a88a1d185904db",
  "sourceUnitDigest": "863a4f5c2b1382ce54aa0c40119bf81618f3e1295c276e294d0ada6f6981f10e",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "82-post-mvp9-acceptance-layer",
  "targetUnitDigest": "863a4f5c2b1382ce54aa0c40119bf81618f3e1295c276e294d0ada6f6981f10e",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#82-post-mvp9-acceptance-layer (lines 447–447) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#82-post-mvp9-acceptance-layer (lines 471–471); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
### 8.2 Post-MVP9 Acceptance Layer

The post-MVP9 acceptance work is outside the Agent Coordination kernel:

```txt
Group-Thinking Protocol Pack
  -> RFC-review-lite, Nominal-Group-lite, Delphi-feedback-lite definitions
Group-Thinking Conformance Suite
  -> public-contract, replay, isolation, CLI/headless parity proofs
fgos-group-thinking skill
  -> thin request/launch/resume/render surface over the pack
```

FlowDefinition `metadata.id@version` remains the protocol identity; a pack
registry only indexes it. Protocol definitions are data-first. Request
adapters and renderers may contain code but may use only public contracts and
must not decide visibility legality, aggregate validity, specialist authority,
or terminal truth. Passing this external suite is the Step 09 exit gate; it
does not make the suite part of core runtime authority.

Step 10 starts after the relevant Step 09 substrate slice exists. Coding Domain
adoption then consumes the substrate for Work-attached review/fix/red-team/
recheck, with mutation, worktree, merge, and return still owned by Work/Coding
authorities.
````

### Full target shown text

````text
### 8.2 Post-MVP9 Acceptance Layer

The post-MVP9 acceptance work is outside the Agent Coordination kernel:

```txt
Group-Thinking Protocol Pack
  -> RFC-review-lite, Nominal-Group-lite, Delphi-feedback-lite definitions
Group-Thinking Conformance Suite
  -> public-contract, replay, isolation, CLI/headless parity proofs
fgos-group-thinking skill
  -> thin request/launch/resume/render surface over the pack
```

FlowDefinition `metadata.id@version` remains the protocol identity; a pack
registry only indexes it. Protocol definitions are data-first. Request
adapters and renderers may contain code but may use only public contracts and
must not decide visibility legality, aggregate validity, specialist authority,
or terminal truth. Passing this external suite is the Step 09 exit gate; it
does not make the suite part of core runtime authority.

Step 10 starts after the relevant Step 09 substrate slice exists. Coding Domain
adoption then consumes the substrate for Work-attached review/fix/red-team/
recheck, with mutation, worktree, merge, and return still owned by Work/Coding
authorities.
````

## claim_4aa4f1662906f10eee15f1bb442eddf5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-55, lines 449–449.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-58.
Source digest: 2c423b780ce33b1539b5401ed234084c4640df81e9c61cd9a3bf4e1ba24e324b
Target digest: 2c423b780ce33b1539b5401ed234084c4640df81e9c61cd9a3bf4e1ba24e324b
Shown source SHA256: 2c423b780ce33b1539b5401ed234084c4640df81e9c61cd9a3bf4e1ba24e324b
Shown target SHA256: 2c423b780ce33b1539b5401ed234084c4640df81e9c61cd9a3bf4e1ba24e324b

### Proposed decision

```json
{
  "claimId": "claim_4aa4f1662906f10eee15f1bb442eddf5",
  "sourceUnitDigest": "2c423b780ce33b1539b5401ed234084c4640df81e9c61cd9a3bf4e1ba24e324b",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "2c423b780ce33b1539b5401ed234084c4640df81e9c61cd9a3bf4e1ba24e324b",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan",
    "8.2 Post-MVP9 Acceptance Layer"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-55 (lines 449–449) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-58 (lines 473–473); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The post-MVP9 acceptance work is outside the Agent Coordination kernel:
```

### Full target shown text

```text
The post-MVP9 acceptance work is outside the Agent Coordination kernel:
```

## claim_a446309efdef849e56c4f63b7a4d611e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-56, lines 451–458.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-59.
Source digest: 990c7969247f2a0700807b708705287979aba704580d373f19d4233dacd69cbc
Target digest: 990c7969247f2a0700807b708705287979aba704580d373f19d4233dacd69cbc
Shown source SHA256: 990c7969247f2a0700807b708705287979aba704580d373f19d4233dacd69cbc
Shown target SHA256: 990c7969247f2a0700807b708705287979aba704580d373f19d4233dacd69cbc

### Proposed decision

```json
{
  "claimId": "claim_a446309efdef849e56c4f63b7a4d611e",
  "sourceUnitDigest": "990c7969247f2a0700807b708705287979aba704580d373f19d4233dacd69cbc",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "990c7969247f2a0700807b708705287979aba704580d373f19d4233dacd69cbc",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan",
    "8.2 Post-MVP9 Acceptance Layer"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-56 (lines 451–458) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-59 (lines 475–482); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Group-Thinking Protocol Pack
  -> RFC-review-lite, Nominal-Group-lite, Delphi-feedback-lite definitions
Group-Thinking Conformance Suite
  -> public-contract, replay, isolation, CLI/headless parity proofs
fgos-group-thinking skill
  -> thin request/launch/resume/render surface over the pack
```
````

### Full target shown text

````text
```txt
Group-Thinking Protocol Pack
  -> RFC-review-lite, Nominal-Group-lite, Delphi-feedback-lite definitions
Group-Thinking Conformance Suite
  -> public-contract, replay, isolation, CLI/headless parity proofs
fgos-group-thinking skill
  -> thin request/launch/resume/render surface over the pack
```
````

## claim_ae4c0f6c20ffd833138c0bf2069088f2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-57, lines 460–465.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-60.
Source digest: 69e96f722c002d6f03f635312f13b761431fc9503f6c384082cb894415eaa0e4
Target digest: 69e96f722c002d6f03f635312f13b761431fc9503f6c384082cb894415eaa0e4
Shown source SHA256: 69e96f722c002d6f03f635312f13b761431fc9503f6c384082cb894415eaa0e4
Shown target SHA256: 69e96f722c002d6f03f635312f13b761431fc9503f6c384082cb894415eaa0e4

### Proposed decision

```json
{
  "claimId": "claim_ae4c0f6c20ffd833138c0bf2069088f2",
  "sourceUnitDigest": "69e96f722c002d6f03f635312f13b761431fc9503f6c384082cb894415eaa0e4",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "69e96f722c002d6f03f635312f13b761431fc9503f6c384082cb894415eaa0e4",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan",
    "8.2 Post-MVP9 Acceptance Layer"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-57 (lines 460–465) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-60 (lines 484–489); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
FlowDefinition `metadata.id@version` remains the protocol identity; a pack
registry only indexes it. Protocol definitions are data-first. Request
adapters and renderers may contain code but may use only public contracts and
must not decide visibility legality, aggregate validity, specialist authority,
or terminal truth. Passing this external suite is the Step 09 exit gate; it
does not make the suite part of core runtime authority.
```

### Full target shown text

```text
FlowDefinition `metadata.id@version` remains the protocol identity; a pack
registry only indexes it. Protocol definitions are data-first. Request
adapters and renderers may contain code but may use only public contracts and
must not decide visibility legality, aggregate validity, specialist authority,
or terminal truth. Passing this external suite is the Step 09 exit gate; it
does not make the suite part of core runtime authority.
```

## claim_958ff86ff87ec19ab15ac6b37ae00140

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-58, lines 467–470.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-61.
Source digest: 894fca767571d8634fca4f047453ad6a8de26700e30f1a486d03a2e366d113e5
Target digest: 894fca767571d8634fca4f047453ad6a8de26700e30f1a486d03a2e366d113e5
Shown source SHA256: 894fca767571d8634fca4f047453ad6a8de26700e30f1a486d03a2e366d113e5
Shown target SHA256: 894fca767571d8634fca4f047453ad6a8de26700e30f1a486d03a2e366d113e5

### Proposed decision

```json
{
  "claimId": "claim_958ff86ff87ec19ab15ac6b37ae00140",
  "sourceUnitDigest": "894fca767571d8634fca4f047453ad6a8de26700e30f1a486d03a2e366d113e5",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-61",
  "targetUnitDigest": "894fca767571d8634fca4f047453ad6a8de26700e30f1a486d03a2e366d113e5",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "8. MVP Plan",
    "8.2 Post-MVP9 Acceptance Layer"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-58 (lines 467–470) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-61 (lines 491–494); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Step 10 starts after the relevant Step 09 substrate slice exists. Coding Domain
adoption then consumes the substrate for Work-attached review/fix/red-team/
recheck, with mutation, worktree, merge, and return still owned by Work/Coding
authorities.
```

### Full target shown text

```text
Step 10 starts after the relevant Step 09 substrate slice exists. Coding Domain
adoption then consumes the substrate for Work-attached review/fix/red-team/
recheck, with mutation, worktree, merge, and return still owned by Work/Coding
authorities.
```

## claim_3a27cd976ee6645945565ebce5df2498

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#9-schema-and-runtime-deltas-under-discussion, lines 472–472.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#9-schema-and-runtime-deltas-under-discussion.
Source digest: deacda61a2f792493cc1ec78a0b4d5f8220f59ecd6425f717bb98882f7781c2b
Target digest: deacda61a2f792493cc1ec78a0b4d5f8220f59ecd6425f717bb98882f7781c2b
Shown source SHA256: a4ca01c4f8df93b9b610e478d02e767fc87ab5b714f2d155587e3e1aa34420df
Shown target SHA256: a4ca01c4f8df93b9b610e478d02e767fc87ab5b714f2d155587e3e1aa34420df

### Proposed decision

```json
{
  "claimId": "claim_3a27cd976ee6645945565ebce5df2498",
  "sourceUnitDigest": "deacda61a2f792493cc1ec78a0b4d5f8220f59ecd6425f717bb98882f7781c2b",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "9-schema-and-runtime-deltas-under-discussion",
  "targetUnitDigest": "deacda61a2f792493cc1ec78a0b4d5f8220f59ecd6425f717bb98882f7781c2b",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#9-schema-and-runtime-deltas-under-discussion (lines 472–472) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#9-schema-and-runtime-deltas-under-discussion (lines 496–496); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 9. Schema And Runtime Deltas Under Discussion

Current FlowDefinition can draft actors, static edges, fixture-local `intents`,
per-edge `maxRounds`, operations, policies, and advisory/work-product result
kinds. It is enough for the static skeleton.

Current contracts are not enough for the adaptive loop without at least these
candidate deltas:

| Gap | Candidate shape | Why |
|---|---|---|
| Optional materialization | `activation.mode: required \| driver-authorized` on the node-operation binding, plus `operation-authorized` before Assignment creation. | The driver must approve optional operations before they consume budget; activation belongs to this graph position, not the reusable operation template. |
| Round request | Later `round-requested` event from an actor, not required for MVP. | Actors may recommend more work; they do not authorize it. |
| Recheck distinct from retry | Dedicated `recheck-*` operation or authorization intent. | Retry replaces an attempt; recheck preserves prior verdict and evaluates a new revision/evidence ref. |
| Disposition | `driver-disposition-recorded` event with `targetAssignmentId` or `targetArtifactRef`, `disposition`, `rationale`, and evidence refs. | Stop/go authority must be auditable without becoming worker self-report or another worker Assignment. |
| Context grant | Authorization carries `grantedContextRefs` and `artifactRevision`; dispatch rejects context outside the grant. | Adaptive loops need controlled memory without opening peer chat or hidden sibling leakage. |
| Invocation identity | `invocationKey` is idempotent and can be consumed exactly once for a logical optional operation. | Prevents authorization replay/double-spend and crash-resume duplication. |
| Execution effect | `executionEffect: read-only` for Step 09 MVP. | Role is cognitive responsibility; read-only/mutation is execution/evidence posture. Doer/Fixer can be read-only artifact producers. |
| Operation provenance | `assignment-created` or a companion event records `operationId`, `nodeId`, `authorizationId`, `invocationKey`, and `contextGrant`. | Replay must explain why a worker ran and which grant made its context legal. |
| Edge disambiguation | Materialization must select the exact node-operation/edge binding, not just the first incoming edge for an actor. | One actor may receive first-pass and recheck operations from different sources. |
| Invocation caps | Binding-level `maxInvocations` or equivalent; `aggregateBounds.maxRounds` remains a hard session cap. | A semantic round may contain multiple Assignments; Assignment count is not round semantics. |
| Driver authority | Pin an authorized driver identity or provenance root for authorization/disposition events. | `writerId` alone is provenance, not a complete authority model. |
| Visibility windows | Deferred topology declaration plus binding reference for phase-limited context legality; concrete grants remain on authorization/Assignment provenance. | Needed for RFC/NGT/Delphi later without weakening fixture-local isolation. |
| Aggregation validation | Deferred `completion.aggregation` declaration and Team-Cognition-owned `aggregation-validated` result linked to RunResult evidence. | Completion eligibility, cognitive interpretation, and terminal authority must not collapse into one worker synthesis. |
| Deliberation contribution | Deferred artifact-backed `deliberation-contribution-linked` event with typed lineage. | Durable reasoning must remain auditable without becoming a mailbox. |
| Dynamic specialist pull-in | Deferred predeclared `topology.specialistSlots` plus driver-owned `specialist-authorized`. | Covers bounded unknown-identity recruitment without arbitrary runtime topology mutation. |
```

### Full target shown text

```text
## 9. Schema And Runtime Deltas Under Discussion

Current FlowDefinition can draft actors, static edges, fixture-local `intents`,
per-edge `maxRounds`, operations, policies, and advisory/work-product result
kinds. It is enough for the static skeleton.

Current contracts are not enough for the adaptive loop without at least these
candidate deltas:

| Gap | Candidate shape | Why |
|---|---|---|
| Optional materialization | `activation.mode: required \| driver-authorized` on the node-operation binding, plus `operation-authorized` before Assignment creation. | The driver must approve optional operations before they consume budget; activation belongs to this graph position, not the reusable operation template. |
| Round request | Later `round-requested` event from an actor, not required for MVP. | Actors may recommend more work; they do not authorize it. |
| Recheck distinct from retry | Dedicated `recheck-*` operation or authorization intent. | Retry replaces an attempt; recheck preserves prior verdict and evaluates a new revision/evidence ref. |
| Disposition | `driver-disposition-recorded` event with `targetAssignmentId` or `targetArtifactRef`, `disposition`, `rationale`, and evidence refs. | Stop/go authority must be auditable without becoming worker self-report or another worker Assignment. |
| Context grant | Authorization carries `grantedContextRefs` and `artifactRevision`; dispatch rejects context outside the grant. | Adaptive loops need controlled memory without opening peer chat or hidden sibling leakage. |
| Invocation identity | `invocationKey` is idempotent and can be consumed exactly once for a logical optional operation. | Prevents authorization replay/double-spend and crash-resume duplication. |
| Execution effect | `executionEffect: read-only` for Step 09 MVP. | Role is cognitive responsibility; read-only/mutation is execution/evidence posture. Doer/Fixer can be read-only artifact producers. |
| Operation provenance | `assignment-created` or a companion event records `operationId`, `nodeId`, `authorizationId`, `invocationKey`, and `contextGrant`. | Replay must explain why a worker ran and which grant made its context legal. |
| Edge disambiguation | Materialization must select the exact node-operation/edge binding, not just the first incoming edge for an actor. | One actor may receive first-pass and recheck operations from different sources. |
| Invocation caps | Binding-level `maxInvocations` or equivalent; `aggregateBounds.maxRounds` remains a hard session cap. | A semantic round may contain multiple Assignments; Assignment count is not round semantics. |
| Driver authority | Pin an authorized driver identity or provenance root for authorization/disposition events. | `writerId` alone is provenance, not a complete authority model. |
| Visibility windows | Deferred topology declaration plus binding reference for phase-limited context legality; concrete grants remain on authorization/Assignment provenance. | Needed for RFC/NGT/Delphi later without weakening fixture-local isolation. |
| Aggregation validation | Deferred `completion.aggregation` declaration and Team-Cognition-owned `aggregation-validated` result linked to RunResult evidence. | Completion eligibility, cognitive interpretation, and terminal authority must not collapse into one worker synthesis. |
| Deliberation contribution | Deferred artifact-backed `deliberation-contribution-linked` event with typed lineage. | Durable reasoning must remain auditable without becoming a mailbox. |
| Dynamic specialist pull-in | Deferred predeclared `topology.specialistSlots` plus driver-owned `specialist-authorized`. | Covers bounded unknown-identity recruitment without arbitrary runtime topology mutation. |
```

## claim_1503d4bdbf31163a99644e4b7fda2d1f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-59, lines 474–476.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-62.
Source digest: 7db30c39018fac001c36e7abd3dc883da773e38d66fdbacfb54be2d1b732458a
Target digest: 7db30c39018fac001c36e7abd3dc883da773e38d66fdbacfb54be2d1b732458a
Shown source SHA256: 7db30c39018fac001c36e7abd3dc883da773e38d66fdbacfb54be2d1b732458a
Shown target SHA256: 7db30c39018fac001c36e7abd3dc883da773e38d66fdbacfb54be2d1b732458a

### Proposed decision

```json
{
  "claimId": "claim_1503d4bdbf31163a99644e4b7fda2d1f",
  "sourceUnitDigest": "7db30c39018fac001c36e7abd3dc883da773e38d66fdbacfb54be2d1b732458a",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-62",
  "targetUnitDigest": "7db30c39018fac001c36e7abd3dc883da773e38d66fdbacfb54be2d1b732458a",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "9. Schema And Runtime Deltas Under Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-59 (lines 474–476) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-62 (lines 498–500); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Current FlowDefinition can draft actors, static edges, fixture-local `intents`,
per-edge `maxRounds`, operations, policies, and advisory/work-product result
kinds. It is enough for the static skeleton.
```

### Full target shown text

```text
Current FlowDefinition can draft actors, static edges, fixture-local `intents`,
per-edge `maxRounds`, operations, policies, and advisory/work-product result
kinds. It is enough for the static skeleton.
```

## claim_36681f9b1807485f3d4115c70fdf1955

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-60, lines 478–479.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-63.
Source digest: 1f0c7292be2d883c373c1e9c3d9f82424b3f1903bb672c4b1bc2163e123d1e35
Target digest: 1f0c7292be2d883c373c1e9c3d9f82424b3f1903bb672c4b1bc2163e123d1e35
Shown source SHA256: 1f0c7292be2d883c373c1e9c3d9f82424b3f1903bb672c4b1bc2163e123d1e35
Shown target SHA256: 1f0c7292be2d883c373c1e9c3d9f82424b3f1903bb672c4b1bc2163e123d1e35

### Proposed decision

```json
{
  "claimId": "claim_36681f9b1807485f3d4115c70fdf1955",
  "sourceUnitDigest": "1f0c7292be2d883c373c1e9c3d9f82424b3f1903bb672c4b1bc2163e123d1e35",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-63",
  "targetUnitDigest": "1f0c7292be2d883c373c1e9c3d9f82424b3f1903bb672c4b1bc2163e123d1e35",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "9. Schema And Runtime Deltas Under Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-60 (lines 478–479) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-63 (lines 502–503); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Current contracts are not enough for the adaptive loop without at least these
candidate deltas:
```

### Full target shown text

```text
Current contracts are not enough for the adaptive loop without at least these
candidate deltas:
```

## claim_45ee2e87aac155ff226ab89bc1195ba7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-61, lines 481–497.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-64.
Source digest: 602603560ee685e35ad9e0d309c33bc6bd951d11ef268a75f43c245efe74a5d8
Target digest: 602603560ee685e35ad9e0d309c33bc6bd951d11ef268a75f43c245efe74a5d8
Shown source SHA256: 602603560ee685e35ad9e0d309c33bc6bd951d11ef268a75f43c245efe74a5d8
Shown target SHA256: 602603560ee685e35ad9e0d309c33bc6bd951d11ef268a75f43c245efe74a5d8

### Proposed decision

```json
{
  "claimId": "claim_45ee2e87aac155ff226ab89bc1195ba7",
  "sourceUnitDigest": "602603560ee685e35ad9e0d309c33bc6bd951d11ef268a75f43c245efe74a5d8",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-64",
  "targetUnitDigest": "602603560ee685e35ad9e0d309c33bc6bd951d11ef268a75f43c245efe74a5d8",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "9. Schema And Runtime Deltas Under Discussion"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-61 (lines 481–497) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-64 (lines 505–521); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Gap | Candidate shape | Why |
|---|---|---|
| Optional materialization | `activation.mode: required \| driver-authorized` on the node-operation binding, plus `operation-authorized` before Assignment creation. | The driver must approve optional operations before they consume budget; activation belongs to this graph position, not the reusable operation template. |
| Round request | Later `round-requested` event from an actor, not required for MVP. | Actors may recommend more work; they do not authorize it. |
| Recheck distinct from retry | Dedicated `recheck-*` operation or authorization intent. | Retry replaces an attempt; recheck preserves prior verdict and evaluates a new revision/evidence ref. |
| Disposition | `driver-disposition-recorded` event with `targetAssignmentId` or `targetArtifactRef`, `disposition`, `rationale`, and evidence refs. | Stop/go authority must be auditable without becoming worker self-report or another worker Assignment. |
| Context grant | Authorization carries `grantedContextRefs` and `artifactRevision`; dispatch rejects context outside the grant. | Adaptive loops need controlled memory without opening peer chat or hidden sibling leakage. |
| Invocation identity | `invocationKey` is idempotent and can be consumed exactly once for a logical optional operation. | Prevents authorization replay/double-spend and crash-resume duplication. |
| Execution effect | `executionEffect: read-only` for Step 09 MVP. | Role is cognitive responsibility; read-only/mutation is execution/evidence posture. Doer/Fixer can be read-only artifact producers. |
| Operation provenance | `assignment-created` or a companion event records `operationId`, `nodeId`, `authorizationId`, `invocationKey`, and `contextGrant`. | Replay must explain why a worker ran and which grant made its context legal. |
| Edge disambiguation | Materialization must select the exact node-operation/edge binding, not just the first incoming edge for an actor. | One actor may receive first-pass and recheck operations from different sources. |
| Invocation caps | Binding-level `maxInvocations` or equivalent; `aggregateBounds.maxRounds` remains a hard session cap. | A semantic round may contain multiple Assignments; Assignment count is not round semantics. |
| Driver authority | Pin an authorized driver identity or provenance root for authorization/disposition events. | `writerId` alone is provenance, not a complete authority model. |
| Visibility windows | Deferred topology declaration plus binding reference for phase-limited context legality; concrete grants remain on authorization/Assignment provenance. | Needed for RFC/NGT/Delphi later without weakening fixture-local isolation. |
| Aggregation validation | Deferred `completion.aggregation` declaration and Team-Cognition-owned `aggregation-validated` result linked to RunResult evidence. | Completion eligibility, cognitive interpretation, and terminal authority must not collapse into one worker synthesis. |
| Deliberation contribution | Deferred artifact-backed `deliberation-contribution-linked` event with typed lineage. | Durable reasoning must remain auditable without becoming a mailbox. |
| Dynamic specialist pull-in | Deferred predeclared `topology.specialistSlots` plus driver-owned `specialist-authorized`. | Covers bounded unknown-identity recruitment without arbitrary runtime topology mutation. |
```

### Full target shown text

```text
| Gap | Candidate shape | Why |
|---|---|---|
| Optional materialization | `activation.mode: required \| driver-authorized` on the node-operation binding, plus `operation-authorized` before Assignment creation. | The driver must approve optional operations before they consume budget; activation belongs to this graph position, not the reusable operation template. |
| Round request | Later `round-requested` event from an actor, not required for MVP. | Actors may recommend more work; they do not authorize it. |
| Recheck distinct from retry | Dedicated `recheck-*` operation or authorization intent. | Retry replaces an attempt; recheck preserves prior verdict and evaluates a new revision/evidence ref. |
| Disposition | `driver-disposition-recorded` event with `targetAssignmentId` or `targetArtifactRef`, `disposition`, `rationale`, and evidence refs. | Stop/go authority must be auditable without becoming worker self-report or another worker Assignment. |
| Context grant | Authorization carries `grantedContextRefs` and `artifactRevision`; dispatch rejects context outside the grant. | Adaptive loops need controlled memory without opening peer chat or hidden sibling leakage. |
| Invocation identity | `invocationKey` is idempotent and can be consumed exactly once for a logical optional operation. | Prevents authorization replay/double-spend and crash-resume duplication. |
| Execution effect | `executionEffect: read-only` for Step 09 MVP. | Role is cognitive responsibility; read-only/mutation is execution/evidence posture. Doer/Fixer can be read-only artifact producers. |
| Operation provenance | `assignment-created` or a companion event records `operationId`, `nodeId`, `authorizationId`, `invocationKey`, and `contextGrant`. | Replay must explain why a worker ran and which grant made its context legal. |
| Edge disambiguation | Materialization must select the exact node-operation/edge binding, not just the first incoming edge for an actor. | One actor may receive first-pass and recheck operations from different sources. |
| Invocation caps | Binding-level `maxInvocations` or equivalent; `aggregateBounds.maxRounds` remains a hard session cap. | A semantic round may contain multiple Assignments; Assignment count is not round semantics. |
| Driver authority | Pin an authorized driver identity or provenance root for authorization/disposition events. | `writerId` alone is provenance, not a complete authority model. |
| Visibility windows | Deferred topology declaration plus binding reference for phase-limited context legality; concrete grants remain on authorization/Assignment provenance. | Needed for RFC/NGT/Delphi later without weakening fixture-local isolation. |
| Aggregation validation | Deferred `completion.aggregation` declaration and Team-Cognition-owned `aggregation-validated` result linked to RunResult evidence. | Completion eligibility, cognitive interpretation, and terminal authority must not collapse into one worker synthesis. |
| Deliberation contribution | Deferred artifact-backed `deliberation-contribution-linked` event with typed lineage. | Durable reasoning must remain auditable without becoming a mailbox. |
| Dynamic specialist pull-in | Deferred predeclared `topology.specialistSlots` plus driver-owned `specialist-authorized`. | Covers bounded unknown-identity recruitment without arbitrary runtime topology mutation. |
```

## claim_e036e9769d5846abcc70b88233c9a898

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#10-read-only-and-mutation-stance, lines 499–499.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#10-read-only-and-mutation-stance.
Source digest: b1926a9dd7feb43e4a87b81d30cdf8149759244ed265baca7186c1e91b40d623
Target digest: b1926a9dd7feb43e4a87b81d30cdf8149759244ed265baca7186c1e91b40d623
Shown source SHA256: 74f2be5952a017d9769ed10057bc38b9b16dc34f8fcbba6e4a6a0d2394e3597f
Shown target SHA256: 74f2be5952a017d9769ed10057bc38b9b16dc34f8fcbba6e4a6a0d2394e3597f

### Proposed decision

```json
{
  "claimId": "claim_e036e9769d5846abcc70b88233c9a898",
  "sourceUnitDigest": "b1926a9dd7feb43e4a87b81d30cdf8149759244ed265baca7186c1e91b40d623",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "10-read-only-and-mutation-stance",
  "targetUnitDigest": "b1926a9dd7feb43e4a87b81d30cdf8149759244ed265baca7186c1e91b40d623",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#10-read-only-and-mutation-stance (lines 499–499) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#10-read-only-and-mutation-stance (lines 523–523); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 10. Read-Only And Mutation Stance

Step 09 must consider execution effect, but must not implement repo or Work
mutation in the MVP. The substrate should avoid encoding "Doer means mutating"
or "Reviewer means read-only." Role names describe cognitive responsibility.
Execution effect describes what the Assignment is allowed to change.

For Step 09:

```txt
executionEffect = read-only
Doer/Fixer output = session-local artifact or revision artifact
No Work lifecycle
No git authority
No repo mutation
```

Mutation remains deferred to Step 10 or a later ADR. When it arrives,
Coordination may carry opaque evidence/resource/workspace references, but the
authority for worktree, branch, merge, lifecycle return, and technical approval
stays outside Agent Coordination.
````

### Full target shown text

````text
## 10. Read-Only And Mutation Stance

Step 09 must consider execution effect, but must not implement repo or Work
mutation in the MVP. The substrate should avoid encoding "Doer means mutating"
or "Reviewer means read-only." Role names describe cognitive responsibility.
Execution effect describes what the Assignment is allowed to change.

For Step 09:

```txt
executionEffect = read-only
Doer/Fixer output = session-local artifact or revision artifact
No Work lifecycle
No git authority
No repo mutation
```

Mutation remains deferred to Step 10 or a later ADR. When it arrives,
Coordination may carry opaque evidence/resource/workspace references, but the
authority for worktree, branch, merge, lifecycle return, and technical approval
stays outside Agent Coordination.
````

## claim_524392af531bb67a8013df0ed6eedd22

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-62, lines 501–504.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-65.
Source digest: 51107d1bd45ef97548b449ccaaf46230ed2634ebcb4a07741a9bfb4fc3a49770
Target digest: 51107d1bd45ef97548b449ccaaf46230ed2634ebcb4a07741a9bfb4fc3a49770
Shown source SHA256: 51107d1bd45ef97548b449ccaaf46230ed2634ebcb4a07741a9bfb4fc3a49770
Shown target SHA256: 51107d1bd45ef97548b449ccaaf46230ed2634ebcb4a07741a9bfb4fc3a49770

### Proposed decision

```json
{
  "claimId": "claim_524392af531bb67a8013df0ed6eedd22",
  "sourceUnitDigest": "51107d1bd45ef97548b449ccaaf46230ed2634ebcb4a07741a9bfb4fc3a49770",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-65",
  "targetUnitDigest": "51107d1bd45ef97548b449ccaaf46230ed2634ebcb4a07741a9bfb4fc3a49770",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "10. Read-Only And Mutation Stance"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-62 (lines 501–504) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-65 (lines 525–528); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Step 09 must consider execution effect, but must not implement repo or Work
mutation in the MVP. The substrate should avoid encoding "Doer means mutating"
or "Reviewer means read-only." Role names describe cognitive responsibility.
Execution effect describes what the Assignment is allowed to change.
```

### Full target shown text

```text
Step 09 must consider execution effect, but must not implement repo or Work
mutation in the MVP. The substrate should avoid encoding "Doer means mutating"
or "Reviewer means read-only." Role names describe cognitive responsibility.
Execution effect describes what the Assignment is allowed to change.
```

## claim_d3de72e3dbf4df0cdb2837a123250fa7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-63, lines 506–514.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-66.
Source digest: 6adc0e42258360d3df8a37f33bdc2b757b1f00483e892709b009938dde2eca88
Target digest: 6adc0e42258360d3df8a37f33bdc2b757b1f00483e892709b009938dde2eca88
Shown source SHA256: 6adc0e42258360d3df8a37f33bdc2b757b1f00483e892709b009938dde2eca88
Shown target SHA256: 6adc0e42258360d3df8a37f33bdc2b757b1f00483e892709b009938dde2eca88

### Proposed decision

```json
{
  "claimId": "claim_d3de72e3dbf4df0cdb2837a123250fa7",
  "sourceUnitDigest": "6adc0e42258360d3df8a37f33bdc2b757b1f00483e892709b009938dde2eca88",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-66",
  "targetUnitDigest": "6adc0e42258360d3df8a37f33bdc2b757b1f00483e892709b009938dde2eca88",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "10. Read-Only And Mutation Stance"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-63 (lines 506–514) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-66 (lines 530–538); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
For Step 09:

```txt
executionEffect = read-only
Doer/Fixer output = session-local artifact or revision artifact
No Work lifecycle
No git authority
No repo mutation
```
````

### Full target shown text

````text
For Step 09:

```txt
executionEffect = read-only
Doer/Fixer output = session-local artifact or revision artifact
No Work lifecycle
No git authority
No repo mutation
```
````

## claim_5ca3bcb58631d9a84675c76a4b365fd9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-64, lines 516–519.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-67.
Source digest: 45bde8e08a13e67426581d2260cfd7d05de7392516acf2e27eee7830c98fa768
Target digest: 45bde8e08a13e67426581d2260cfd7d05de7392516acf2e27eee7830c98fa768
Shown source SHA256: 45bde8e08a13e67426581d2260cfd7d05de7392516acf2e27eee7830c98fa768
Shown target SHA256: 45bde8e08a13e67426581d2260cfd7d05de7392516acf2e27eee7830c98fa768

### Proposed decision

```json
{
  "claimId": "claim_5ca3bcb58631d9a84675c76a4b365fd9",
  "sourceUnitDigest": "45bde8e08a13e67426581d2260cfd7d05de7392516acf2e27eee7830c98fa768",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-67",
  "targetUnitDigest": "45bde8e08a13e67426581d2260cfd7d05de7392516acf2e27eee7830c98fa768",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "10. Read-Only And Mutation Stance"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-64 (lines 516–519) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-67 (lines 540–543); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Mutation remains deferred to Step 10 or a later ADR. When it arrives,
Coordination may carry opaque evidence/resource/workspace references, but the
authority for worktree, branch, merge, lifecycle return, and technical approval
stays outside Agent Coordination.
```

### Full target shown text

```text
Mutation remains deferred to Step 10 or a later ADR. When it arrives,
Coordination may carry opaque evidence/resource/workspace references, but the
authority for worktree, branch, merge, lifecycle return, and technical approval
stays outside Agent Coordination.
```

## claim_503f25acb6211f5f3913462555222160

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#11-surface-launcher-stance, lines 521–521.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#11-surface-launcher-stance.
Source digest: 9108e09a2420aad87d9a788eda5766a45957b54106cc69a45bca85ea156ae47b
Target digest: 9108e09a2420aad87d9a788eda5766a45957b54106cc69a45bca85ea156ae47b
Shown source SHA256: 4e656dbf0ce30960a2d28eee29d443288cb10e542b3c4e82b80defd4254456f9
Shown target SHA256: 4e656dbf0ce30960a2d28eee29d443288cb10e542b3c4e82b80defd4254456f9

### Proposed decision

```json
{
  "claimId": "claim_503f25acb6211f5f3913462555222160",
  "sourceUnitDigest": "9108e09a2420aad87d9a788eda5766a45957b54106cc69a45bca85ea156ae47b",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "11-surface-launcher-stance",
  "targetUnitDigest": "9108e09a2420aad87d9a788eda5766a45957b54106cc69a45bca85ea156ae47b",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#11-surface-launcher-stance (lines 521–521) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#11-surface-launcher-stance (lines 545–545); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 11. Surface Launcher Stance

Step 09 should include a thin surface launcher once the Master Coordination
fixture exists. The launcher is useful because it makes group-thinking patterns
easy to trigger, but it must not become another prose coordination mechanism.

Target shape:

```txt
/fgOS:coordinate master-plan <plan.md>
  -> builds a request file/object for a declared fixture
  -> calls fgos coordination run --file <request>
  -> reads fgos coordination show / evidence
```

The skill or slash command may choose a fixture and assemble inputs. It must
not add undeclared actors, bypass authorization, synthesize final truth outside
the session ledger, or contain the group-thinking logic itself.
````

### Full target shown text

````text
## 11. Surface Launcher Stance

Step 09 should include a thin surface launcher once the Master Coordination
fixture exists. The launcher is useful because it makes group-thinking patterns
easy to trigger, but it must not become another prose coordination mechanism.

Target shape:

```txt
/fgOS:coordinate master-plan <plan.md>
  -> builds a request file/object for a declared fixture
  -> calls fgos coordination run --file <request>
  -> reads fgos coordination show / evidence
```

The skill or slash command may choose a fixture and assemble inputs. It must
not add undeclared actors, bypass authorization, synthesize final truth outside
the session ledger, or contain the group-thinking logic itself.
````

## claim_eb58b28de65f86c69fcd9c5af9266a86

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-65, lines 523–525.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-68.
Source digest: c2c6e0a51beebfd9b02f713009c822aeb7ec9c7f46bbcd2b08a02fe04167a24c
Target digest: c2c6e0a51beebfd9b02f713009c822aeb7ec9c7f46bbcd2b08a02fe04167a24c
Shown source SHA256: c2c6e0a51beebfd9b02f713009c822aeb7ec9c7f46bbcd2b08a02fe04167a24c
Shown target SHA256: c2c6e0a51beebfd9b02f713009c822aeb7ec9c7f46bbcd2b08a02fe04167a24c

### Proposed decision

```json
{
  "claimId": "claim_eb58b28de65f86c69fcd9c5af9266a86",
  "sourceUnitDigest": "c2c6e0a51beebfd9b02f713009c822aeb7ec9c7f46bbcd2b08a02fe04167a24c",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-68",
  "targetUnitDigest": "c2c6e0a51beebfd9b02f713009c822aeb7ec9c7f46bbcd2b08a02fe04167a24c",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "11. Surface Launcher Stance"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-65 (lines 523–525) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-68 (lines 547–549); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Step 09 should include a thin surface launcher once the Master Coordination
fixture exists. The launcher is useful because it makes group-thinking patterns
easy to trigger, but it must not become another prose coordination mechanism.
```

### Full target shown text

```text
Step 09 should include a thin surface launcher once the Master Coordination
fixture exists. The launcher is useful because it makes group-thinking patterns
easy to trigger, but it must not become another prose coordination mechanism.
```

## claim_c37d185e48dd0051a58c717252c062a0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-66, lines 527–534.
Target: docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-69.
Source digest: 198971e38b66ced6b5e7af387220ea57561778f5e362f8e84d8fbbab9768bb0b
Target digest: 198971e38b66ced6b5e7af387220ea57561778f5e362f8e84d8fbbab9768bb0b
Shown source SHA256: 198971e38b66ced6b5e7af387220ea57561778f5e362f8e84d8fbbab9768bb0b
Shown target SHA256: 198971e38b66ced6b5e7af387220ea57561778f5e362f8e84d8fbbab9768bb0b

### Proposed decision

```json
{
  "claimId": "claim_c37d185e48dd0051a58c717252c062a0",
  "sourceUnitDigest": "198971e38b66ced6b5e7af387220ea57561778f5e362f8e84d8fbbab9768bb0b",
  "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "targetAnchor": "unheaded-block-69",
  "targetUnitDigest": "198971e38b66ced6b5e7af387220ea57561778f5e362f8e84d8fbbab9768bb0b",
  "targetAncestry": [
    "Step 09 - Group Thinking Substrate",
    "11. Surface Launcher Stance"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source unheaded-block docs/architect/proposals/step-09-group-thinking-substrate.md#unheaded-block-66 (lines 527–534) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#unheaded-block-69 (lines 551–558); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Target shape:

```txt
/fgOS:coordinate master-plan <plan.md>
  -> builds a request file/object for a declared fixture
  -> calls fgos coordination run --file <request>
  -> reads fgos coordination show / evidence
```
````

### Full target shown text

````text
Target shape:

```txt
/fgOS:coordinate master-plan <plan.md>
  -> builds a request file/object for a declared fixture
  -> calls fgos coordination run --file <request>
  -> reads fgos coordination show / evidence
```
````
