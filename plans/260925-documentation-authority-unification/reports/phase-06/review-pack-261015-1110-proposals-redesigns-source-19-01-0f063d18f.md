# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-19-step-10-coding-domain-adoption.json
Original shard SHA256: 098b9ec903b1eaf4c3f5829c902a5c90c8e43dab77c0205e2f9e31bd781081dc
Source file: docs/architect/proposals/step-10-coding-domain-adoption.md
Part 1/2; entries: **80**. Source-file group 19/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (12): `claim_7539ce5504b8ca9079f56a1ea32d72d9`, `claim_4e779fb6d6117a8afbb9b4231fc41517`, `claim_be4eaf1334073b4789d9465ca073ca10`, `claim_b8e7045d6255883081d81c5e4113fc56`, `claim_9baec27cadcd7ba898ca2c6a20e32d75`, `claim_c882f1126a89fd1bde5869084dd49d66`, `claim_4cf831a1488ff02a9d582c8e80acccef`, `claim_db1b9790987b9243caa0d47fa47fa3c3`, `claim_abda1a178e353cb46d7c04e6cb1764f2`, `claim_c549231db06f3511d15fc9534421715c`, `claim_95bd9e63c50b41b3b511d948685c8f38`, `claim_78e55538d050b196b46032da6b57fa9d`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 24; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_7539ce5504b8ca9079f56a1ea32d72d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#step-10---coding-domain-adoption-of-the-coordination-foundation, lines 1–1.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#step-10---coding-domain-adoption-of-the-coordination-foundation.
Source digest: 6b10f57a58673f82671fa342322f06086aae34c350691e0fb73e0434cfc37a5c
Target digest: 5dbab26a094bf907350b2791dbc50948793875dcc8b0d410619d08e38e8b57b5
Shown source SHA256: e221b7344a6d38b5bed4e5aac21d0483ca641a53488bdbfc4cd97b89368dbc1e
Shown target SHA256: 75b7c2f2d0abe083a7f7568a27158287f748ede74516b4b0789959267fe67dc7

### Proposed decision

```json
{
  "claimId": "claim_7539ce5504b8ca9079f56a1ea32d72d9",
  "sourceUnitDigest": "6b10f57a58673f82671fa342322f06086aae34c350691e0fb73e0434cfc37a5c",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "step-10---coding-domain-adoption-of-the-coordination-foundation",
  "targetUnitDigest": "5dbab26a094bf907350b2791dbc50948793875dcc8b0d410619d08e38e8b57b5",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#step-10---coding-domain-adoption-of-the-coordination-foundation (lines 1–1) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#step-10---coding-domain-adoption-of-the-coordination-foundation (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
# Step 10 - Coding Domain Adoption Of The Coordination Foundation

Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-04
Canonical for: nothing until explicitly accepted
Original date: 2026-09-02
Scope: capture the discussion about bringing the existing coding domain onto
the Agent Coordination foundation after Step 09's group-thinking substrate
direction is settled — which parts are normalization of duplicate mechanisms,
which parts are new foundation capability the coding domain genuinely needs,
the seams between them, and a candidate step sequence — without opening the
Work-attached mutation gate before the proof ADR-010 §5 requires
Intent traceability: [Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md),
entries AC-I005, AC-I008, AC-I009; Vision V-012 (two unlike consumers)
Related: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[Step 10 A0 Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[ADR-007](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md),
[ADR-010](../agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md),
[Work Integration](../agent-coordination/architecture/work-integration.md),
[Component Boundary Advisory](../component-boundary/component-boundary-advisory.md),
[Step 08 plan](../../../plans/260901-1542-step08-standalone-coordination/plan.md),
[Architecture Intent](../architecture-intent.md),
[Component Authority Boundary Map](component-authority-boundary-map.md)

Implementation note: nothing in this proposal is implemented. Step 08 has
closed all 8 phases. Step 09 now names the standalone group-thinking substrate
track; this Step 10 proposal must consume that substrate rather than reshape it
around coding-specific needs. This document records the coding-domain adoption
discussion so the next track does not have to be reconstructed from chat
history.
```

### Full target shown text

`````text
# Step 10 - Coding Domain Adoption Of The Coordination Foundation

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/step-10-coding-domain-adoption.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 211d40d63ddc4e5e5cc1a7661c3d4f234189904b
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/step-10-coding-domain-adoption.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/step-10-coding-domain-adoption.md).


````markdown
Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-04
Canonical for: nothing until explicitly accepted
Original date: 2026-09-02
Scope: capture the discussion about bringing the existing coding domain onto
the Agent Coordination foundation after Step 09's group-thinking substrate
direction is settled — which parts are normalization of duplicate mechanisms,
which parts are new foundation capability the coding domain genuinely needs,
the seams between them, and a candidate step sequence — without opening the
Work-attached mutation gate before the proof ADR-010 §5 requires
Intent traceability: [Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md),
entries AC-I005, AC-I008, AC-I009; Vision V-012 (two unlike consumers)
Related: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[Step 10 A0 Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[ADR-007](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md),
[ADR-010](../agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md),
[Work Integration](../agent-coordination/architecture/work-integration.md),
[Component Boundary Advisory](../component-boundary/component-boundary-advisory.md),
[Step 08 plan](../../../plans/260901-1542-step08-standalone-coordination/plan.md),
[Architecture Intent](../architecture-intent.md),
[Component Authority Boundary Map](component-authority-boundary-map.md)
````


Implementation note: nothing in this proposal is implemented. Step 08 has
closed all 8 phases. Step 09 now names the standalone group-thinking substrate
track; this Step 10 proposal must consume that substrate rather than reshape it
around coding-specific needs. This document records the coding-domain adoption
discussion so the next track does not have to be reconstructed from chat
history.
`````

## claim_4e779fb6d6117a8afbb9b4231fc41517

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-1, lines 3–26.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-4.
Source digest: dd7759c61f9fda0ed9be4e4fab7eed143c6a6967c591f523b48a584800d9f5b7
Target digest: 361fe2670734d9bbd9fd2890babf1d76f4a5a5fe2c74ad8fd0a4219a9a3ab9ef
Shown source SHA256: dd7759c61f9fda0ed9be4e4fab7eed143c6a6967c591f523b48a584800d9f5b7
Shown target SHA256: 361fe2670734d9bbd9fd2890babf1d76f4a5a5fe2c74ad8fd0a4219a9a3ab9ef

### Proposed decision

```json
{
  "claimId": "claim_4e779fb6d6117a8afbb9b4231fc41517",
  "sourceUnitDigest": "dd7759c61f9fda0ed9be4e4fab7eed143c6a6967c591f523b48a584800d9f5b7",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "361fe2670734d9bbd9fd2890babf1d76f4a5a5fe2c74ad8fd0a4219a9a3ab9ef",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-1 (lines 3–26) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-4 (lines 27–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-04
Canonical for: nothing until explicitly accepted
Original date: 2026-09-02
Scope: capture the discussion about bringing the existing coding domain onto
the Agent Coordination foundation after Step 09's group-thinking substrate
direction is settled — which parts are normalization of duplicate mechanisms,
which parts are new foundation capability the coding domain genuinely needs,
the seams between them, and a candidate step sequence — without opening the
Work-attached mutation gate before the proof ADR-010 §5 requires
Intent traceability: [Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md),
entries AC-I005, AC-I008, AC-I009; Vision V-012 (two unlike consumers)
Related: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[Step 10 A0 Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[ADR-007](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md),
[ADR-010](../agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md),
[Work Integration](../agent-coordination/architecture/work-integration.md),
[Component Boundary Advisory](../component-boundary/component-boundary-advisory.md),
[Step 08 plan](../../../plans/260901-1542-step08-standalone-coordination/plan.md),
[Architecture Intent](../architecture-intent.md),
[Component Authority Boundary Map](component-authority-boundary-map.md)
```

### Full target shown text

`````text
````markdown
Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-04
Canonical for: nothing until explicitly accepted
Original date: 2026-09-02
Scope: capture the discussion about bringing the existing coding domain onto
the Agent Coordination foundation after Step 09's group-thinking substrate
direction is settled — which parts are normalization of duplicate mechanisms,
which parts are new foundation capability the coding domain genuinely needs,
the seams between them, and a candidate step sequence — without opening the
Work-attached mutation gate before the proof ADR-010 §5 requires
Intent traceability: [Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md),
entries AC-I005, AC-I008, AC-I009; Vision V-012 (two unlike consumers)
Related: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[Step 10 A0 Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[ADR-007](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md),
[ADR-010](../agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md),
[Work Integration](../agent-coordination/architecture/work-integration.md),
[Component Boundary Advisory](../component-boundary/component-boundary-advisory.md),
[Step 08 plan](../../../plans/260901-1542-step08-standalone-coordination/plan.md),
[Architecture Intent](../architecture-intent.md),
[Component Authority Boundary Map](component-authority-boundary-map.md)
````
`````

## claim_f2e76aca54258dd9520218c6067a2a3b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-2, lines 28–33.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-5.
Source digest: 14198cae643dd8701de7ef46138b3e04f3d07b783fcff60e5746557f9a63fbbd
Target digest: 14198cae643dd8701de7ef46138b3e04f3d07b783fcff60e5746557f9a63fbbd
Shown source SHA256: 14198cae643dd8701de7ef46138b3e04f3d07b783fcff60e5746557f9a63fbbd
Shown target SHA256: 14198cae643dd8701de7ef46138b3e04f3d07b783fcff60e5746557f9a63fbbd

### Proposed decision

```json
{
  "claimId": "claim_f2e76aca54258dd9520218c6067a2a3b",
  "sourceUnitDigest": "14198cae643dd8701de7ef46138b3e04f3d07b783fcff60e5746557f9a63fbbd",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "14198cae643dd8701de7ef46138b3e04f3d07b783fcff60e5746557f9a63fbbd",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-2 (lines 28–33) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-5 (lines 55–60); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Implementation note: nothing in this proposal is implemented. Step 08 has
closed all 8 phases. Step 09 now names the standalone group-thinking substrate
track; this Step 10 proposal must consume that substrate rather than reshape it
around coding-specific needs. This document records the coding-domain adoption
discussion so the next track does not have to be reconstructed from chat
history.
```

### Full target shown text

```text
Implementation note: nothing in this proposal is implemented. Step 08 has
closed all 8 phases. Step 09 now names the standalone group-thinking substrate
track; this Step 10 proposal must consume that substrate rather than reshape it
around coding-specific needs. This document records the coding-domain adoption
discussion so the next track does not have to be reconstructed from chat
history.
```

## claim_be4eaf1334073b4789d9465ca073ca10

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#1-how-to-read-this-draft, lines 35–35.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#1-how-to-read-this-draft.
Source digest: 8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a
Target digest: fdd4cda38bcac2605dcbc9b3e6aed65aaceb9659649561898f5710cab3e2548b
Shown source SHA256: 99dfcd5d3767bbce117d4687f63968ceb3685f4f939153392dc00c97a7991315
Shown target SHA256: 460cd6d9265594decb8dafc5b35faa3c0a8735f296fb2b9be6248fa97a8af0b5

### Proposed decision

```json
{
  "claimId": "claim_be4eaf1334073b4789d9465ca073ca10",
  "sourceUnitDigest": "8dd84be02faf5679c0ebb4d1bb391dec8708a7d05a1415a72f80d3ea733f8d1a",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "1-how-to-read-this-draft",
  "targetUnitDigest": "fdd4cda38bcac2605dcbc9b3e6aed65aaceb9659649561898f5710cab3e2548b",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#1-how-to-read-this-draft (lines 35–35) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#1-how-to-read-this-draft (lines 62–62); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 1. How To Read This Draft

This document uses three labels:

- **Observed** describes current repository behavior found by reading code
  and accepted documents on 2026-09-02.
- **Proposed** captures a candidate direction from the discussion.
- **Open** identifies a decision that still requires human review or proof.

Nothing labeled Proposed is an approved contract or plan. The
[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority
above this proposal. In particular, V-002 (Work is optional integration),
V-008 (domain augmentation), V-011 (small core), and V-012 (two unlike
consumers) constrain every idea below.
```

### Full target shown text

```text
## 1. How To Read This Draft

This document uses three labels:

- **Observed** describes current repository behavior found by reading code
  and accepted documents on 2026-09-02.
- **Proposed** captures a candidate direction from the discussion.
- **Open** identifies a decision that still requires human review or proof.

Nothing labeled Proposed is an approved contract or plan. The
[Agent Coordination Vision](../../architect/agent-coordination/vision.md) is accepted authority
above this proposal. In particular, V-002 (Work is optional integration),
V-008 (domain augmentation), V-011 (small core), and V-012 (two unlike
consumers) constrain every idea below.
```

## claim_c9c28e6e9b543488b1cb729ebd0b5bf1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-3, lines 37–37.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-6.
Source digest: 674611497bb6224341a363fbb8b91816122c3965af2272ce59719ff9d97d6226
Target digest: 674611497bb6224341a363fbb8b91816122c3965af2272ce59719ff9d97d6226
Shown source SHA256: 674611497bb6224341a363fbb8b91816122c3965af2272ce59719ff9d97d6226
Shown target SHA256: 674611497bb6224341a363fbb8b91816122c3965af2272ce59719ff9d97d6226

### Proposed decision

```json
{
  "claimId": "claim_c9c28e6e9b543488b1cb729ebd0b5bf1",
  "sourceUnitDigest": "674611497bb6224341a363fbb8b91816122c3965af2272ce59719ff9d97d6226",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "674611497bb6224341a363fbb8b91816122c3965af2272ce59719ff9d97d6226",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "1. How To Read This Draft"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-3 (lines 37–37) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-6 (lines 64–64); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This document uses three labels:
```

### Full target shown text

```text
This document uses three labels:
```

## claim_cb392a9033f864f2cfa8da375cc915bb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-4, lines 39–42.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-7.
Source digest: e97e7596c2be8764e659ec2b50113b44951eb8f347c202506fe908f48601ab02
Target digest: e97e7596c2be8764e659ec2b50113b44951eb8f347c202506fe908f48601ab02
Shown source SHA256: e97e7596c2be8764e659ec2b50113b44951eb8f347c202506fe908f48601ab02
Shown target SHA256: e97e7596c2be8764e659ec2b50113b44951eb8f347c202506fe908f48601ab02

### Proposed decision

```json
{
  "claimId": "claim_cb392a9033f864f2cfa8da375cc915bb",
  "sourceUnitDigest": "e97e7596c2be8764e659ec2b50113b44951eb8f347c202506fe908f48601ab02",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "e97e7596c2be8764e659ec2b50113b44951eb8f347c202506fe908f48601ab02",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "1. How To Read This Draft"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-4 (lines 39–42) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-7 (lines 66–69); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- **Observed** describes current repository behavior found by reading code
  and accepted documents on 2026-09-02.
- **Proposed** captures a candidate direction from the discussion.
- **Open** identifies a decision that still requires human review or proof.
```

### Full target shown text

```text
- **Observed** describes current repository behavior found by reading code
  and accepted documents on 2026-09-02.
- **Proposed** captures a candidate direction from the discussion.
- **Open** identifies a decision that still requires human review or proof.
```

## claim_b8e7045d6255883081d81c5e4113fc56

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-5, lines 44–48.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-8.
Source digest: b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c
Target digest: 89660d655f8ac9af2bbc282ab32c946c3be366e096c6fe19c61f571058dc5635
Shown source SHA256: b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c
Shown target SHA256: 89660d655f8ac9af2bbc282ab32c946c3be366e096c6fe19c61f571058dc5635

### Proposed decision

```json
{
  "claimId": "claim_b8e7045d6255883081d81c5e4113fc56",
  "sourceUnitDigest": "b57ad9fd56b40bee0fb7af1950580d38253328cb42477445ca2645ad79cb6f5c",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "89660d655f8ac9af2bbc282ab32c946c3be366e096c6fe19c61f571058dc5635",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "1. How To Read This Draft"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-5 (lines 44–48) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-8 (lines 71–75); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Nothing labeled Proposed is an approved contract or plan. The
[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority
above this proposal. In particular, V-002 (Work is optional integration),
V-008 (domain augmentation), V-011 (small core), and V-012 (two unlike
consumers) constrain every idea below.
```

### Full target shown text

```text
Nothing labeled Proposed is an approved contract or plan. The
[Agent Coordination Vision](../../architect/agent-coordination/vision.md) is accepted authority
above this proposal. In particular, V-002 (Work is optional integration),
V-008 (domain augmentation), V-011 (small core), and V-012 (two unlike
consumers) constrain every idea below.
```

## claim_278cd2fef40a0c6f76eec033d9a2ab07

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#11-progress-tracking, lines 50–50.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#11-progress-tracking.
Source digest: 089455985ea4adfe93cbfd2e9bf0951b41a8039948f6a52372634b4a5a5c5728
Target digest: 089455985ea4adfe93cbfd2e9bf0951b41a8039948f6a52372634b4a5a5c5728
Shown source SHA256: 2bc66e079f62ee8f04367da02ace68ad14861cea902fec36bb6a0276abf90979
Shown target SHA256: 2bc66e079f62ee8f04367da02ace68ad14861cea902fec36bb6a0276abf90979

### Proposed decision

```json
{
  "claimId": "claim_278cd2fef40a0c6f76eec033d9a2ab07",
  "sourceUnitDigest": "089455985ea4adfe93cbfd2e9bf0951b41a8039948f6a52372634b4a5a5c5728",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "11-progress-tracking",
  "targetUnitDigest": "089455985ea4adfe93cbfd2e9bf0951b41a8039948f6a52372634b4a5a5c5728",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#11-progress-tracking (lines 50–50) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#11-progress-tracking (lines 77–77); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 1.1 Progress Tracking

This proposal tracks discussion progress without pretending Step 10
implementation has started. Status values:

| Status | Meaning |
|---|---|
| `discussion-open` | Still being shaped in this proposal. |
| `draft-ready` | Clear enough to turn into a dedicated draft artifact, but not accepted architecture. |
| `waiting-step-08` | Must be reconciled after Step 08's final audit before acceptance or implementation. |
| `accepted-prerequisite` | Promoted into an accepted/canonical architecture document. |
| `implementation-ready` | Accepted prerequisite exists and the next implementation slice can plan against it. |

Current progress:

| Track | Status | Notes |
|---|---|---|
| Boundary map — architect-level authority guardrail | `draft-ready` | Now tracked in `component-authority-boundary-map.md`, parallel to Step 09 and Step 10. |
| Step 09 substrate dependency | `accepted-prerequisite` | The implemented Step 09 slice is closed through the promoted CoordinationSession/FlowDefinition contracts; deferred substrate features remain parked in the architecture intent docs. |
| Step 10 high-level adoption plan | `draft-ready` | This document now records the large plan for making Coding Domain a first-class fgOS domain consumer. |
| Step 10 implementation | `implementation-ready` for read-only adoption; `waiting-topology` for mutating adoption | Read-only Work-attached sessions may start. Mutating work must wait for Workspace Topology resolver/root migration and the ADR-010 live proof gate. |
```

### Full target shown text

```text
## 1.1 Progress Tracking

This proposal tracks discussion progress without pretending Step 10
implementation has started. Status values:

| Status | Meaning |
|---|---|
| `discussion-open` | Still being shaped in this proposal. |
| `draft-ready` | Clear enough to turn into a dedicated draft artifact, but not accepted architecture. |
| `waiting-step-08` | Must be reconciled after Step 08's final audit before acceptance or implementation. |
| `accepted-prerequisite` | Promoted into an accepted/canonical architecture document. |
| `implementation-ready` | Accepted prerequisite exists and the next implementation slice can plan against it. |

Current progress:

| Track | Status | Notes |
|---|---|---|
| Boundary map — architect-level authority guardrail | `draft-ready` | Now tracked in `component-authority-boundary-map.md`, parallel to Step 09 and Step 10. |
| Step 09 substrate dependency | `accepted-prerequisite` | The implemented Step 09 slice is closed through the promoted CoordinationSession/FlowDefinition contracts; deferred substrate features remain parked in the architecture intent docs. |
| Step 10 high-level adoption plan | `draft-ready` | This document now records the large plan for making Coding Domain a first-class fgOS domain consumer. |
| Step 10 implementation | `implementation-ready` for read-only adoption; `waiting-topology` for mutating adoption | Read-only Work-attached sessions may start. Mutating work must wait for Workspace Topology resolver/root migration and the ADR-010 live proof gate. |
```

## claim_97dd9aad424848d2960c079e5d869c2a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-6, lines 52–53.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-9.
Source digest: a0b83fb942e38a57a9897c597d755b9f0eb63a4c05751f0e21e74dc94fe38216
Target digest: a0b83fb942e38a57a9897c597d755b9f0eb63a4c05751f0e21e74dc94fe38216
Shown source SHA256: a0b83fb942e38a57a9897c597d755b9f0eb63a4c05751f0e21e74dc94fe38216
Shown target SHA256: a0b83fb942e38a57a9897c597d755b9f0eb63a4c05751f0e21e74dc94fe38216

### Proposed decision

```json
{
  "claimId": "claim_97dd9aad424848d2960c079e5d869c2a",
  "sourceUnitDigest": "a0b83fb942e38a57a9897c597d755b9f0eb63a4c05751f0e21e74dc94fe38216",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "a0b83fb942e38a57a9897c597d755b9f0eb63a4c05751f0e21e74dc94fe38216",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "1.1 Progress Tracking"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-6 (lines 52–53) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-9 (lines 79–80); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This proposal tracks discussion progress without pretending Step 10
implementation has started. Status values:
```

### Full target shown text

```text
This proposal tracks discussion progress without pretending Step 10
implementation has started. Status values:
```

## claim_ceb14767f9cf2a00a4ac2c028a85409d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-7, lines 55–61.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-10.
Source digest: 4d3c22b6b66077d1a03850d8a8dfc2bbaade46ad0b78f1315a35213d4f241a31
Target digest: 4d3c22b6b66077d1a03850d8a8dfc2bbaade46ad0b78f1315a35213d4f241a31
Shown source SHA256: 4d3c22b6b66077d1a03850d8a8dfc2bbaade46ad0b78f1315a35213d4f241a31
Shown target SHA256: 4d3c22b6b66077d1a03850d8a8dfc2bbaade46ad0b78f1315a35213d4f241a31

### Proposed decision

```json
{
  "claimId": "claim_ceb14767f9cf2a00a4ac2c028a85409d",
  "sourceUnitDigest": "4d3c22b6b66077d1a03850d8a8dfc2bbaade46ad0b78f1315a35213d4f241a31",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "4d3c22b6b66077d1a03850d8a8dfc2bbaade46ad0b78f1315a35213d4f241a31",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "1.1 Progress Tracking"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-7 (lines 55–61) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-10 (lines 82–88); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Status | Meaning |
|---|---|
| `discussion-open` | Still being shaped in this proposal. |
| `draft-ready` | Clear enough to turn into a dedicated draft artifact, but not accepted architecture. |
| `waiting-step-08` | Must be reconciled after Step 08's final audit before acceptance or implementation. |
| `accepted-prerequisite` | Promoted into an accepted/canonical architecture document. |
| `implementation-ready` | Accepted prerequisite exists and the next implementation slice can plan against it. |
```

### Full target shown text

```text
| Status | Meaning |
|---|---|
| `discussion-open` | Still being shaped in this proposal. |
| `draft-ready` | Clear enough to turn into a dedicated draft artifact, but not accepted architecture. |
| `waiting-step-08` | Must be reconciled after Step 08's final audit before acceptance or implementation. |
| `accepted-prerequisite` | Promoted into an accepted/canonical architecture document. |
| `implementation-ready` | Accepted prerequisite exists and the next implementation slice can plan against it. |
```

## claim_ad24071c6e90ff9d99c586b6b854d87f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-8, lines 63–70.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-11.
Source digest: f572f241f727ee369bb50aad2fcd60f1fad7cccfc8ac5606fe7b3e6bb41e95d6
Target digest: f572f241f727ee369bb50aad2fcd60f1fad7cccfc8ac5606fe7b3e6bb41e95d6
Shown source SHA256: f572f241f727ee369bb50aad2fcd60f1fad7cccfc8ac5606fe7b3e6bb41e95d6
Shown target SHA256: f572f241f727ee369bb50aad2fcd60f1fad7cccfc8ac5606fe7b3e6bb41e95d6

### Proposed decision

```json
{
  "claimId": "claim_ad24071c6e90ff9d99c586b6b854d87f",
  "sourceUnitDigest": "f572f241f727ee369bb50aad2fcd60f1fad7cccfc8ac5606fe7b3e6bb41e95d6",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "f572f241f727ee369bb50aad2fcd60f1fad7cccfc8ac5606fe7b3e6bb41e95d6",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "1.1 Progress Tracking"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-8 (lines 63–70) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-11 (lines 90–97); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Current progress:

| Track | Status | Notes |
|---|---|---|
| Boundary map — architect-level authority guardrail | `draft-ready` | Now tracked in `component-authority-boundary-map.md`, parallel to Step 09 and Step 10. |
| Step 09 substrate dependency | `accepted-prerequisite` | The implemented Step 09 slice is closed through the promoted CoordinationSession/FlowDefinition contracts; deferred substrate features remain parked in the architecture intent docs. |
| Step 10 high-level adoption plan | `draft-ready` | This document now records the large plan for making Coding Domain a first-class fgOS domain consumer. |
| Step 10 implementation | `implementation-ready` for read-only adoption; `waiting-topology` for mutating adoption | Read-only Work-attached sessions may start. Mutating work must wait for Workspace Topology resolver/root migration and the ADR-010 live proof gate. |
```

### Full target shown text

```text
Current progress:

| Track | Status | Notes |
|---|---|---|
| Boundary map — architect-level authority guardrail | `draft-ready` | Now tracked in `component-authority-boundary-map.md`, parallel to Step 09 and Step 10. |
| Step 09 substrate dependency | `accepted-prerequisite` | The implemented Step 09 slice is closed through the promoted CoordinationSession/FlowDefinition contracts; deferred substrate features remain parked in the architecture intent docs. |
| Step 10 high-level adoption plan | `draft-ready` | This document now records the large plan for making Coding Domain a first-class fgOS domain consumer. |
| Step 10 implementation | `implementation-ready` for read-only adoption; `waiting-topology` for mutating adoption | Read-only Work-attached sessions may start. Mutating work must wait for Workspace Topology resolver/root migration and the ADR-010 live proof gate. |
```

## claim_569265c351adc092db10e87c642d0769

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#2-question-this-step-answers, lines 72–72.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#2-question-this-step-answers.
Source digest: 4919e00b6ba2889f7757a9cc6048c9c8ce4ddd9fa799870c404c47709fcc10b8
Target digest: 4919e00b6ba2889f7757a9cc6048c9c8ce4ddd9fa799870c404c47709fcc10b8
Shown source SHA256: fd65c6ccb7d40e64da83843d83a9f2d2ca98c9ef56a09d81351c4e64cf641e1a
Shown target SHA256: fd65c6ccb7d40e64da83843d83a9f2d2ca98c9ef56a09d81351c4e64cf641e1a

### Proposed decision

```json
{
  "claimId": "claim_569265c351adc092db10e87c642d0769",
  "sourceUnitDigest": "4919e00b6ba2889f7757a9cc6048c9c8ce4ddd9fa799870c404c47709fcc10b8",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "2-question-this-step-answers",
  "targetUnitDigest": "4919e00b6ba2889f7757a9cc6048c9c8ce4ddd9fa799870c404c47709fcc10b8",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#2-question-this-step-answers (lines 72–72) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#2-question-this-step-answers (lines 99–99); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 2. Question This Step Answers

```txt
Once Step 08 delivers a domain-neutral coordination foundation,
what does it take to make the existing coding domain a real consumer of it —
without a second execution core, without moving Work lifecycle or git
authority into coordination, and without reopening ADR-010's mutation gate
ahead of its proof?
```

The discussion reached one headline answer, recorded here so it is not
re-derived:

**Proposed:** Step 08 completion is a necessary precondition, not a
sufficient one. The coding domain can consume the *read-only* layer of the
foundation immediately after Step 08. The *mutating* layer is blocked by a
named stop gate (ADR-010 §5; Step 08 plan "Locked Product Decisions"; ledger
AC-I009) whose lifting condition is exactly a coding-domain live proof. That
proof is therefore the middle of Step 10, not something that happens on its
own once Step 08 closes.
````

### Full target shown text

````text
## 2. Question This Step Answers

```txt
Once Step 08 delivers a domain-neutral coordination foundation,
what does it take to make the existing coding domain a real consumer of it —
without a second execution core, without moving Work lifecycle or git
authority into coordination, and without reopening ADR-010's mutation gate
ahead of its proof?
```

The discussion reached one headline answer, recorded here so it is not
re-derived:

**Proposed:** Step 08 completion is a necessary precondition, not a
sufficient one. The coding domain can consume the *read-only* layer of the
foundation immediately after Step 08. The *mutating* layer is blocked by a
named stop gate (ADR-010 §5; Step 08 plan "Locked Product Decisions"; ledger
AC-I009) whose lifting condition is exactly a coding-domain live proof. That
proof is therefore the middle of Step 10, not something that happens on its
own once Step 08 closes.
````

## claim_76cca4370b07bb76a8eb67829ad73500

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-9, lines 74–80.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-12.
Source digest: 7c06fd57af9dbcd3acc2d689b54e99b473777659f426593da76a5178a6cebd1b
Target digest: 7c06fd57af9dbcd3acc2d689b54e99b473777659f426593da76a5178a6cebd1b
Shown source SHA256: 7c06fd57af9dbcd3acc2d689b54e99b473777659f426593da76a5178a6cebd1b
Shown target SHA256: 7c06fd57af9dbcd3acc2d689b54e99b473777659f426593da76a5178a6cebd1b

### Proposed decision

```json
{
  "claimId": "claim_76cca4370b07bb76a8eb67829ad73500",
  "sourceUnitDigest": "7c06fd57af9dbcd3acc2d689b54e99b473777659f426593da76a5178a6cebd1b",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "7c06fd57af9dbcd3acc2d689b54e99b473777659f426593da76a5178a6cebd1b",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "2. Question This Step Answers"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-9 (lines 74–80) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-12 (lines 101–107); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Once Step 08 delivers a domain-neutral coordination foundation,
what does it take to make the existing coding domain a real consumer of it —
without a second execution core, without moving Work lifecycle or git
authority into coordination, and without reopening ADR-010's mutation gate
ahead of its proof?
```
````

### Full target shown text

````text
```txt
Once Step 08 delivers a domain-neutral coordination foundation,
what does it take to make the existing coding domain a real consumer of it —
without a second execution core, without moving Work lifecycle or git
authority into coordination, and without reopening ADR-010's mutation gate
ahead of its proof?
```
````

## claim_6819e3a67298994c100345c21d9b4ad7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-10, lines 82–83.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-13.
Source digest: d686ef247ac176d8b5e6f491a7c061220c6ed962fa5a1313d773815c7b8b5162
Target digest: d686ef247ac176d8b5e6f491a7c061220c6ed962fa5a1313d773815c7b8b5162
Shown source SHA256: d686ef247ac176d8b5e6f491a7c061220c6ed962fa5a1313d773815c7b8b5162
Shown target SHA256: d686ef247ac176d8b5e6f491a7c061220c6ed962fa5a1313d773815c7b8b5162

### Proposed decision

```json
{
  "claimId": "claim_6819e3a67298994c100345c21d9b4ad7",
  "sourceUnitDigest": "d686ef247ac176d8b5e6f491a7c061220c6ed962fa5a1313d773815c7b8b5162",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "d686ef247ac176d8b5e6f491a7c061220c6ed962fa5a1313d773815c7b8b5162",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "2. Question This Step Answers"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-10 (lines 82–83) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-13 (lines 109–110); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The discussion reached one headline answer, recorded here so it is not
re-derived:
```

### Full target shown text

```text
The discussion reached one headline answer, recorded here so it is not
re-derived:
```

## claim_d8a1cecbc656859df0d196004da1aada

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-11, lines 85–91.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-14.
Source digest: ab3a664f19b1125d940bb2a0aff3777755272701850ced88450792507b54f866
Target digest: ab3a664f19b1125d940bb2a0aff3777755272701850ced88450792507b54f866
Shown source SHA256: ab3a664f19b1125d940bb2a0aff3777755272701850ced88450792507b54f866
Shown target SHA256: ab3a664f19b1125d940bb2a0aff3777755272701850ced88450792507b54f866

### Proposed decision

```json
{
  "claimId": "claim_d8a1cecbc656859df0d196004da1aada",
  "sourceUnitDigest": "ab3a664f19b1125d940bb2a0aff3777755272701850ced88450792507b54f866",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "ab3a664f19b1125d940bb2a0aff3777755272701850ced88450792507b54f866",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "2. Question This Step Answers"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-11 (lines 85–91) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-14 (lines 112–118); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Proposed:** Step 08 completion is a necessary precondition, not a
sufficient one. The coding domain can consume the *read-only* layer of the
foundation immediately after Step 08. The *mutating* layer is blocked by a
named stop gate (ADR-010 §5; Step 08 plan "Locked Product Decisions"; ledger
AC-I009) whose lifting condition is exactly a coding-domain live proof. That
proof is therefore the middle of Step 10, not something that happens on its
own once Step 08 closes.
```

### Full target shown text

```text
**Proposed:** Step 08 completion is a necessary precondition, not a
sufficient one. The coding domain can consume the *read-only* layer of the
foundation immediately after Step 08. The *mutating* layer is blocked by a
named stop gate (ADR-010 §5; Step 08 plan "Locked Product Decisions"; ledger
AC-I009) whose lifting condition is exactly a coding-domain live proof. That
proof is therefore the middle of Step 10, not something that happens on its
own once Step 08 closes.
```

## claim_9baec27cadcd7ba898ca2c6a20e32d75

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#3-high-level-adoption-plan, lines 93–93.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#3-high-level-adoption-plan.
Source digest: 96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b
Target digest: 57e2aec68e3b6a1134a3f47e90c648ece550254d5e539c6ece244dc5c107549f
Shown source SHA256: f193a0f397d80050cc7115e9932244d7efbece2c2f248b24b13d50140faaae45
Shown target SHA256: 96659601d5d4553aa2415b976ba7a282662ae06784bcb5aa3dd959f94457a523

### Proposed decision

```json
{
  "claimId": "claim_9baec27cadcd7ba898ca2c6a20e32d75",
  "sourceUnitDigest": "96d3315704f20b8c03a7b92426d0929daa1331997f6c8bc9cfe91eaa32d75c0b",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "3-high-level-adoption-plan",
  "targetUnitDigest": "57e2aec68e3b6a1134a3f47e90c648ece550254d5e539c6ece244dc5c107549f",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#3-high-level-adoption-plan (lines 93–93) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#3-high-level-adoption-plan (lines 120–120); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 3. High-Level Adoption Plan

**Proposed.** Step 10's goal is not to add one Agent Coordination feature.
Its goal is to make Coding Domain a first-class fgOS domain that consumes the
shared platform engines while keeping coding-specific authority in the coding
domain.

Target ownership shape:

```txt
Work Core
  owns Work identity, status, stage, claim, ask/answer, return

Work Driver
  is platform core: a domain-aware workflow interpreter that chooses and runs
  the next legal operation for a Work item from domain-owned declarations

Agent Coordination
  owns CoordinationSession, FlowDefinition, session topology, membership,
  Assignment participation, Run/RunResult evidence ledger, recovery,
  visibility, and bounded collaboration

Dispatch And Run Runtime
  owns executor selection, invocation, Run recording, and generic result
  evaluation

Coding Domain
  owns coding workflow declarations, Coding Domain Adapter implementations,
  repository footprint, worktree/branch policy, merge and technical approval
  policy, verification evidence, coding-specific skills, prompts, harnesses,
  and evidence adapters
```

The boundary rule is:

```txt
Work Driver Core is reusable platform core.
It interprets domain-declared workflows and operations.

Coding Domain does not own a separate driver.
It owns coding workflow declarations and Coding Domain Adapter implementations
consumed through the generic Domain Adapter ports owned by Work Driver Core.

Any existing runner, skill, or operation-choice code that hardcodes coding
workflow order, git/worktree/merge behavior, or verify semantics is migration
debt unless it sits behind a coding-owned adapter/facade.
```

The same Work Driver Core should later be able to drive non-coding domains such
as marketing or business workflows by loading their domain declarations and
adapters. For example, a marketing domain may declare brief, audience research,
draft, review, and publish-ready stages; the driver should not know brand voice
or channel formatting, only the declared operation contract.

Naming rule:

```txt
Domain Adapter Port
  = generic platform-facing port shape owned by Work Driver Core.

Coding Domain Adapter
  = Coding Domain's implementation of that port.

Marketing Domain Adapter
  = a future Marketing Domain implementation of that same kind of port.
```

When this Step 10 proposal classifies concrete logic such as `plan.md`,
`fgw/<id>`, git diff/status, verify commands, merge/catch-up, AGENTS/skills
material, or coding-specific footprint rules, it should call that logic part of
the Coding Domain Adapter, not the generic Domain Adapter.

The adoption plan has eight layers:

1. **Node-only component boundary and harness facade.** Inventory existing
   coding harnesses, including the harnesses that touch Workspace Topology
   concerns, classify authority, define stable Coding Domain Adapter facades
   behind generic Domain Adapter ports, and add contract/forbidden-dependency
   tests before any Rust migration or large physical move. This pass exists
   because coding harnesses currently sit at the busiest boundary between
   domain logic, Work Driver, Dispatch/Run, Agent Coordination, topology, and
   packaging. If the pass finds a harness reading or writing workspace policy,
   worker workspace state, claims, sessions, leases, hot history, projections,
   or runtime command entries, it must resolve that harness behind
   `TopologyContext` in the same slice or record a named blocker.
2. **Coding Domain contract.** Define what Coding Domain owns and does not own,
   including upstream product/design flow for ambiguous work, `cook` for
   implementation-ready work, bugfix/debug flow, small-change/direct path,
   review/validate/repair operations, and fan-out policy.
3. **Workflow and operation model.** Make coding operations explicit:
   required inputs, actor role, read-only versus mutating effect, expected
   evidence, footprint/isolation needs, and allowed next Work transition.
   Examples include `validate-plan`, `review-item`, `implement-item`,
   `scout-blast-radius`, `resolve-question`, and `fix-verify-red`.
4. **Coordination adoption.** Use CoordinationSession for operations that need
   multi-actor collaboration, provenance, recovery, visibility control, or
   evidence history. Start read-only with validation/review/research/scout;
   open mutating sessions only after the topology and ADR-010 gates are met.
5. **Topology and isolation integration.** Consume Workspace Topology for
   worker workspace identity, branch-local config, runtime coordination root,
   hot history placement, workspace installation capsules, footprint claims,
   and leases. This is the gate between read-only Step 10 and mutating Step
   10.
6. **Evidence boundary.** Move coding-specific git/diff/verify interpretation
   behind a Coding Domain evidence adapter, while Run Result Evaluator remains
   the generic confidence owner.
7. **Runner unification.** Collapse the current interactive skill loop and
   headless runner loop into one Work Driver path. Skills become launchers;
   headless and interactive differ by operator presence, not capability.
8. **Domain packaging.** After the runtime shape is stable, package coding
   skills/prompts/harnesses as runtime workshop material and project them into
   host-visible files through the workspace projection ledger.

Detailed plans derived from this section must preserve the high-level A0-G
shape instead of replacing it with local task detail. If a detailed plan
changes the sequence, scope, or exit criteria of any A0-G step, it must update
this proposal and the project-level Architect Roadmap in the same review.

The current detailed plan for A0 is
[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md).

Recommended execution order:

```txt
A0. Inventory coding/topology harnesses and define Node-only Coding Domain Adapter facades
A1. Lock Coding Domain contract and operation catalog
B. Prove read-only Work-attached CoordinationSession adoption
C. Build topology resolver and migrate legacy roots behind typed roots
D. Add coding evidence adapter and occupancy/concurrency bridge
E. Run the ADR-010 mutating live proof
F. Unify runner/interactive execution through Work Driver
G. Package Coding Domain material through distribution/projection
```

Parallelizable work:

| Lane | Can proceed now | Must wait for |
|---|---|---|
| Node-only Coding Domain boundary/facade | Yes, first. Inventory coding harnesses plus topology-touching harnesses, classify owners, define Coding Domain Adapter facades behind generic Domain Adapter ports, resolve any raw topology root usage behind `TopologyContext`, and add contract/forbidden-dependency tests. | Rust migration and physical moves wait for facade proof. |
| Coding Domain contract | Yes, after or beside A0. | It should consume A0's ownership classification. |
| Operation catalog | Yes, after or beside A0. | Mutating operation execution waits for topology. |
| Read-only coordination bridge | Yes after the minimum facade used by `validate-plan` exists. | It must not change Work mutation, git, merge, or lifecycle authority. |
| Workspace Topology | Yes, in parallel | Implementation migration waits for resolver shape and legacy import rules. |
| Evidence adapter design | Yes | Final mutating semantics wait for topology and ADR-010 proof. |
| Component boundary cleanup | Yes at document/index level | Physical moves wait for Step 10 proof and facade tests. |
| Packaging/projection | Docs may proceed | Runtime implementation waits for topology resolver and domain materialization contract. |

Step 10 planning must not treat Workspace Topology and Packaging/Distribution
as later cleanup. Every Step 10 implementation slice must explicitly check
whether it touches any of these topology or distribution concerns and resolve
the related contract gap in the same slice or record a named blocker:

- branch/workspace policy reads, especially `.fgos/config.json` and
  `.fgos/distribution.json`;
- worker workspace creation, workspace identity, and whether the worker needs
  a local `.fgos/installation/` capsule;
- claim/session/assignment/lease placement under `runtimeCoordinationRoot`;
- hot Work history writes and legacy import from existing `.fgos/events*`;
- footprint claims, worktree leases, and mutation fencing;
- projection ownership for coding skills, prompts, harnesses, AGENTS.md blocks,
  `.agents/skills`, and `.claude/skills`;
- active runtime identity, state-schema compatibility, and whether a local
  `fgos` command is running under the workspace activation binding;
- package/runtime materialization of Coding Domain assets as release workshop
  material, not source-tree side effects.

The A0 boundary/facade pass is the preferred place to handle topology-related
harnesses. It should classify at least these harness families before Step 10B
uses them: worktree and branch creation, merge/catch-up/approval, claim and
runtime occupancy, goal-check and verification evidence, prompt/skill
projection, config/default/doctor repair, and any coding harness that shells
out through a local `fgos` command path. A0 may leave behavior in its current
files, but callers should begin depending on typed facades rather than direct
raw paths.

If a slice is read-only, the check may conclude "not touched" for mutation,
worktree, merge, and packaging materialization. If a slice creates or changes
any worker, claim, event, projection, local command entry, or domain asset
placement behavior, it must consume `TopologyContext` and align with
`runtime-identity-and-activation.md` rather than introducing another raw
`.fgos` path.
````

### Full target shown text

````text
## 3. High-Level Adoption Plan

**Proposed.** Step 10's goal is not to add one Agent Coordination feature.
Its goal is to make Coding Domain a first-class fgOS domain that consumes the
shared platform engines while keeping coding-specific authority in the coding
domain.

Target ownership shape:

```txt
Work Core
  owns Work identity, status, stage, claim, ask/answer, return

Work Driver
  is platform core: a domain-aware workflow interpreter that chooses and runs
  the next legal operation for a Work item from domain-owned declarations

Agent Coordination
  owns CoordinationSession, FlowDefinition, session topology, membership,
  Assignment participation, Run/RunResult evidence ledger, recovery,
  visibility, and bounded collaboration

Dispatch And Run Runtime
  owns executor selection, invocation, Run recording, and generic result
  evaluation

Coding Domain
  owns coding workflow declarations, Coding Domain Adapter implementations,
  repository footprint, worktree/branch policy, merge and technical approval
  policy, verification evidence, coding-specific skills, prompts, harnesses,
  and evidence adapters
```

The boundary rule is:

```txt
Work Driver Core is reusable platform core.
It interprets domain-declared workflows and operations.

Coding Domain does not own a separate driver.
It owns coding workflow declarations and Coding Domain Adapter implementations
consumed through the generic Domain Adapter ports owned by Work Driver Core.

Any existing runner, skill, or operation-choice code that hardcodes coding
workflow order, git/worktree/merge behavior, or verify semantics is migration
debt unless it sits behind a coding-owned adapter/facade.
```

The same Work Driver Core should later be able to drive non-coding domains such
as marketing or business workflows by loading their domain declarations and
adapters. For example, a marketing domain may declare brief, audience research,
draft, review, and publish-ready stages; the driver should not know brand voice
or channel formatting, only the declared operation contract.

Naming rule:

```txt
Domain Adapter Port
  = generic platform-facing port shape owned by Work Driver Core.

Coding Domain Adapter
  = Coding Domain's implementation of that port.

Marketing Domain Adapter
  = a future Marketing Domain implementation of that same kind of port.
```

When this Step 10 proposal classifies concrete logic such as `plan.md`,
`fgw/<id>`, git diff/status, verify commands, merge/catch-up, AGENTS/skills
material, or coding-specific footprint rules, it should call that logic part of
the Coding Domain Adapter, not the generic Domain Adapter.

The adoption plan has eight layers:

1. **Node-only component boundary and harness facade.** Inventory existing
   coding harnesses, including the harnesses that touch Workspace Topology
   concerns, classify authority, define stable Coding Domain Adapter facades
   behind generic Domain Adapter ports, and add contract/forbidden-dependency
   tests before any Rust migration or large physical move. This pass exists
   because coding harnesses currently sit at the busiest boundary between
   domain logic, Work Driver, Dispatch/Run, Agent Coordination, topology, and
   packaging. If the pass finds a harness reading or writing workspace policy,
   worker workspace state, claims, sessions, leases, hot history, projections,
   or runtime command entries, it must resolve that harness behind
   `TopologyContext` in the same slice or record a named blocker.
2. **Coding Domain contract.** Define what Coding Domain owns and does not own,
   including upstream product/design flow for ambiguous work, `cook` for
   implementation-ready work, bugfix/debug flow, small-change/direct path,
   review/validate/repair operations, and fan-out policy.
3. **Workflow and operation model.** Make coding operations explicit:
   required inputs, actor role, read-only versus mutating effect, expected
   evidence, footprint/isolation needs, and allowed next Work transition.
   Examples include `validate-plan`, `review-item`, `implement-item`,
   `scout-blast-radius`, `resolve-question`, and `fix-verify-red`.
4. **Coordination adoption.** Use CoordinationSession for operations that need
   multi-actor collaboration, provenance, recovery, visibility control, or
   evidence history. Start read-only with validation/review/research/scout;
   open mutating sessions only after the topology and ADR-010 gates are met.
5. **Topology and isolation integration.** Consume Workspace Topology for
   worker workspace identity, branch-local config, runtime coordination root,
   hot history placement, workspace installation capsules, footprint claims,
   and leases. This is the gate between read-only Step 10 and mutating Step
   10.
6. **Evidence boundary.** Move coding-specific git/diff/verify interpretation
   behind a Coding Domain evidence adapter, while Run Result Evaluator remains
   the generic confidence owner.
7. **Runner unification.** Collapse the current interactive skill loop and
   headless runner loop into one Work Driver path. Skills become launchers;
   headless and interactive differ by operator presence, not capability.
8. **Domain packaging.** After the runtime shape is stable, package coding
   skills/prompts/harnesses as runtime workshop material and project them into
   host-visible files through the workspace projection ledger.

Detailed plans derived from this section must preserve the high-level A0-G
shape instead of replacing it with local task detail. If a detailed plan
changes the sequence, scope, or exit criteria of any A0-G step, it must update
this proposal and the project-level Architect Roadmap in the same review.

The current detailed plan for A0 is
[Step 10 A0 - Coding Domain Boundary And Facade Plan](../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md).

Recommended execution order:

```txt
A0. Inventory coding/topology harnesses and define Node-only Coding Domain Adapter facades
A1. Lock Coding Domain contract and operation catalog
B. Prove read-only Work-attached CoordinationSession adoption
C. Build topology resolver and migrate legacy roots behind typed roots
D. Add coding evidence adapter and occupancy/concurrency bridge
E. Run the ADR-010 mutating live proof
F. Unify runner/interactive execution through Work Driver
G. Package Coding Domain material through distribution/projection
```

Parallelizable work:

| Lane | Can proceed now | Must wait for |
|---|---|---|
| Node-only Coding Domain boundary/facade | Yes, first. Inventory coding harnesses plus topology-touching harnesses, classify owners, define Coding Domain Adapter facades behind generic Domain Adapter ports, resolve any raw topology root usage behind `TopologyContext`, and add contract/forbidden-dependency tests. | Rust migration and physical moves wait for facade proof. |
| Coding Domain contract | Yes, after or beside A0. | It should consume A0's ownership classification. |
| Operation catalog | Yes, after or beside A0. | Mutating operation execution waits for topology. |
| Read-only coordination bridge | Yes after the minimum facade used by `validate-plan` exists. | It must not change Work mutation, git, merge, or lifecycle authority. |
| Workspace Topology | Yes, in parallel | Implementation migration waits for resolver shape and legacy import rules. |
| Evidence adapter design | Yes | Final mutating semantics wait for topology and ADR-010 proof. |
| Component boundary cleanup | Yes at document/index level | Physical moves wait for Step 10 proof and facade tests. |
| Packaging/projection | Docs may proceed | Runtime implementation waits for topology resolver and domain materialization contract. |

Step 10 planning must not treat Workspace Topology and Packaging/Distribution
as later cleanup. Every Step 10 implementation slice must explicitly check
whether it touches any of these topology or distribution concerns and resolve
the related contract gap in the same slice or record a named blocker:

- branch/workspace policy reads, especially `.fgos/config.json` and
  `.fgos/distribution.json`;
- worker workspace creation, workspace identity, and whether the worker needs
  a local `.fgos/installation/` capsule;
- claim/session/assignment/lease placement under `runtimeCoordinationRoot`;
- hot Work history writes and legacy import from existing `.fgos/events*`;
- footprint claims, worktree leases, and mutation fencing;
- projection ownership for coding skills, prompts, harnesses, AGENTS.md blocks,
  `.agents/skills`, and `.claude/skills`;
- active runtime identity, state-schema compatibility, and whether a local
  `fgos` command is running under the workspace activation binding;
- package/runtime materialization of Coding Domain assets as release workshop
  material, not source-tree side effects.

The A0 boundary/facade pass is the preferred place to handle topology-related
harnesses. It should classify at least these harness families before Step 10B
uses them: worktree and branch creation, merge/catch-up/approval, claim and
runtime occupancy, goal-check and verification evidence, prompt/skill
projection, config/default/doctor repair, and any coding harness that shells
out through a local `fgos` command path. A0 may leave behavior in its current
files, but callers should begin depending on typed facades rather than direct
raw paths.

If a slice is read-only, the check may conclude "not touched" for mutation,
worktree, merge, and packaging materialization. If a slice creates or changes
any worker, claim, event, projection, local command entry, or domain asset
placement behavior, it must consume `TopologyContext` and align with
`runtime-identity-and-activation.md` rather than introducing another raw
`.fgos` path.
````

## claim_67505ee7846969c26c97829b79c58434

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-12, lines 95–98.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-15.
Source digest: 047ba1a0992ff3054a9ded7e13367132f4ee91a23bfbfdc0ff5e734e920f3f60
Target digest: 047ba1a0992ff3054a9ded7e13367132f4ee91a23bfbfdc0ff5e734e920f3f60
Shown source SHA256: 047ba1a0992ff3054a9ded7e13367132f4ee91a23bfbfdc0ff5e734e920f3f60
Shown target SHA256: 047ba1a0992ff3054a9ded7e13367132f4ee91a23bfbfdc0ff5e734e920f3f60

### Proposed decision

```json
{
  "claimId": "claim_67505ee7846969c26c97829b79c58434",
  "sourceUnitDigest": "047ba1a0992ff3054a9ded7e13367132f4ee91a23bfbfdc0ff5e734e920f3f60",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "047ba1a0992ff3054a9ded7e13367132f4ee91a23bfbfdc0ff5e734e920f3f60",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-12 (lines 95–98) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-15 (lines 122–125); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Proposed.** Step 10's goal is not to add one Agent Coordination feature.
Its goal is to make Coding Domain a first-class fgOS domain that consumes the
shared platform engines while keeping coding-specific authority in the coding
domain.
```

### Full target shown text

```text
**Proposed.** Step 10's goal is not to add one Agent Coordination feature.
Its goal is to make Coding Domain a first-class fgOS domain that consumes the
shared platform engines while keeping coding-specific authority in the coding
domain.
```

## claim_694e8f82ae6650627071ed3d28e17f01

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-13, lines 100–100.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-16.
Source digest: 8fbba81590d6fdd2a5899dd8e92f167123825f69975d9e48bcede44147d558a9
Target digest: 8fbba81590d6fdd2a5899dd8e92f167123825f69975d9e48bcede44147d558a9
Shown source SHA256: 8fbba81590d6fdd2a5899dd8e92f167123825f69975d9e48bcede44147d558a9
Shown target SHA256: 8fbba81590d6fdd2a5899dd8e92f167123825f69975d9e48bcede44147d558a9

### Proposed decision

```json
{
  "claimId": "claim_694e8f82ae6650627071ed3d28e17f01",
  "sourceUnitDigest": "8fbba81590d6fdd2a5899dd8e92f167123825f69975d9e48bcede44147d558a9",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "8fbba81590d6fdd2a5899dd8e92f167123825f69975d9e48bcede44147d558a9",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-13 (lines 100–100) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-16 (lines 127–127); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Target ownership shape:
```

### Full target shown text

```text
Target ownership shape:
```

## claim_a2a686118945f5c936031ab85e8e7f19

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-14, lines 102–124.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-17.
Source digest: d8787a03c9560543756cce42056e114a403fb71a3dde852ea0d52d340c325db8
Target digest: d8787a03c9560543756cce42056e114a403fb71a3dde852ea0d52d340c325db8
Shown source SHA256: d8787a03c9560543756cce42056e114a403fb71a3dde852ea0d52d340c325db8
Shown target SHA256: d8787a03c9560543756cce42056e114a403fb71a3dde852ea0d52d340c325db8

### Proposed decision

```json
{
  "claimId": "claim_a2a686118945f5c936031ab85e8e7f19",
  "sourceUnitDigest": "d8787a03c9560543756cce42056e114a403fb71a3dde852ea0d52d340c325db8",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "d8787a03c9560543756cce42056e114a403fb71a3dde852ea0d52d340c325db8",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-14 (lines 102–124) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-17 (lines 129–151); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Work Core
  owns Work identity, status, stage, claim, ask/answer, return

Work Driver
  is platform core: a domain-aware workflow interpreter that chooses and runs
  the next legal operation for a Work item from domain-owned declarations

Agent Coordination
  owns CoordinationSession, FlowDefinition, session topology, membership,
  Assignment participation, Run/RunResult evidence ledger, recovery,
  visibility, and bounded collaboration

Dispatch And Run Runtime
  owns executor selection, invocation, Run recording, and generic result
  evaluation

Coding Domain
  owns coding workflow declarations, Coding Domain Adapter implementations,
  repository footprint, worktree/branch policy, merge and technical approval
  policy, verification evidence, coding-specific skills, prompts, harnesses,
  and evidence adapters
```
````

### Full target shown text

````text
```txt
Work Core
  owns Work identity, status, stage, claim, ask/answer, return

Work Driver
  is platform core: a domain-aware workflow interpreter that chooses and runs
  the next legal operation for a Work item from domain-owned declarations

Agent Coordination
  owns CoordinationSession, FlowDefinition, session topology, membership,
  Assignment participation, Run/RunResult evidence ledger, recovery,
  visibility, and bounded collaboration

Dispatch And Run Runtime
  owns executor selection, invocation, Run recording, and generic result
  evaluation

Coding Domain
  owns coding workflow declarations, Coding Domain Adapter implementations,
  repository footprint, worktree/branch policy, merge and technical approval
  policy, verification evidence, coding-specific skills, prompts, harnesses,
  and evidence adapters
```
````

## claim_9cecddc972aabbd596be1474a05004b9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-15, lines 126–139.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-18.
Source digest: 4d19985e0d49a74ab41ef49b77875ba6396f0eb57cb6975bcbca2777aa75d20f
Target digest: 4d19985e0d49a74ab41ef49b77875ba6396f0eb57cb6975bcbca2777aa75d20f
Shown source SHA256: 4d19985e0d49a74ab41ef49b77875ba6396f0eb57cb6975bcbca2777aa75d20f
Shown target SHA256: 4d19985e0d49a74ab41ef49b77875ba6396f0eb57cb6975bcbca2777aa75d20f

### Proposed decision

```json
{
  "claimId": "claim_9cecddc972aabbd596be1474a05004b9",
  "sourceUnitDigest": "4d19985e0d49a74ab41ef49b77875ba6396f0eb57cb6975bcbca2777aa75d20f",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "4d19985e0d49a74ab41ef49b77875ba6396f0eb57cb6975bcbca2777aa75d20f",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-15 (lines 126–139) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-18 (lines 153–166); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
The boundary rule is:

```txt
Work Driver Core is reusable platform core.
It interprets domain-declared workflows and operations.

Coding Domain does not own a separate driver.
It owns coding workflow declarations and Coding Domain Adapter implementations
consumed through the generic Domain Adapter ports owned by Work Driver Core.

Any existing runner, skill, or operation-choice code that hardcodes coding
workflow order, git/worktree/merge behavior, or verify semantics is migration
debt unless it sits behind a coding-owned adapter/facade.
```
````

### Full target shown text

````text
The boundary rule is:

```txt
Work Driver Core is reusable platform core.
It interprets domain-declared workflows and operations.

Coding Domain does not own a separate driver.
It owns coding workflow declarations and Coding Domain Adapter implementations
consumed through the generic Domain Adapter ports owned by Work Driver Core.

Any existing runner, skill, or operation-choice code that hardcodes coding
workflow order, git/worktree/merge behavior, or verify semantics is migration
debt unless it sits behind a coding-owned adapter/facade.
```
````

## claim_9313507ea320dc30aa085b4b9443da44

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-16, lines 141–145.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-19.
Source digest: 013bffd4a64a22808a7fd42ec2e6444170dffe69912cf0295ed703181dad4aba
Target digest: 013bffd4a64a22808a7fd42ec2e6444170dffe69912cf0295ed703181dad4aba
Shown source SHA256: 013bffd4a64a22808a7fd42ec2e6444170dffe69912cf0295ed703181dad4aba
Shown target SHA256: 013bffd4a64a22808a7fd42ec2e6444170dffe69912cf0295ed703181dad4aba

### Proposed decision

```json
{
  "claimId": "claim_9313507ea320dc30aa085b4b9443da44",
  "sourceUnitDigest": "013bffd4a64a22808a7fd42ec2e6444170dffe69912cf0295ed703181dad4aba",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "013bffd4a64a22808a7fd42ec2e6444170dffe69912cf0295ed703181dad4aba",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-16 (lines 141–145) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-19 (lines 168–172); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The same Work Driver Core should later be able to drive non-coding domains such
as marketing or business workflows by loading their domain declarations and
adapters. For example, a marketing domain may declare brief, audience research,
draft, review, and publish-ready stages; the driver should not know brand voice
or channel formatting, only the declared operation contract.
```

### Full target shown text

```text
The same Work Driver Core should later be able to drive non-coding domains such
as marketing or business workflows by loading their domain declarations and
adapters. For example, a marketing domain may declare brief, audience research,
draft, review, and publish-ready stages; the driver should not know brand voice
or channel formatting, only the declared operation contract.
```

## claim_a052c10bdc45ba778a471a9fe2cdb638

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-17, lines 147–158.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-20.
Source digest: 6e03f0df8a57e4a164d3674aea56a2ebcc59779c0f1962261b6e775bb8a333c1
Target digest: 6e03f0df8a57e4a164d3674aea56a2ebcc59779c0f1962261b6e775bb8a333c1
Shown source SHA256: 6e03f0df8a57e4a164d3674aea56a2ebcc59779c0f1962261b6e775bb8a333c1
Shown target SHA256: 6e03f0df8a57e4a164d3674aea56a2ebcc59779c0f1962261b6e775bb8a333c1

### Proposed decision

```json
{
  "claimId": "claim_a052c10bdc45ba778a471a9fe2cdb638",
  "sourceUnitDigest": "6e03f0df8a57e4a164d3674aea56a2ebcc59779c0f1962261b6e775bb8a333c1",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "6e03f0df8a57e4a164d3674aea56a2ebcc59779c0f1962261b6e775bb8a333c1",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-17 (lines 147–158) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-20 (lines 174–185); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Naming rule:

```txt
Domain Adapter Port
  = generic platform-facing port shape owned by Work Driver Core.

Coding Domain Adapter
  = Coding Domain's implementation of that port.

Marketing Domain Adapter
  = a future Marketing Domain implementation of that same kind of port.
```
````

### Full target shown text

````text
Naming rule:

```txt
Domain Adapter Port
  = generic platform-facing port shape owned by Work Driver Core.

Coding Domain Adapter
  = Coding Domain's implementation of that port.

Marketing Domain Adapter
  = a future Marketing Domain implementation of that same kind of port.
```
````

## claim_5d1cbfcbc959ff533e12dae53c91dfe1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-18, lines 160–163.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-21.
Source digest: 13ea03434706727fe1109db524705b99337ed4f04bd728d6d1ecc1aa6c14640f
Target digest: 13ea03434706727fe1109db524705b99337ed4f04bd728d6d1ecc1aa6c14640f
Shown source SHA256: 13ea03434706727fe1109db524705b99337ed4f04bd728d6d1ecc1aa6c14640f
Shown target SHA256: 13ea03434706727fe1109db524705b99337ed4f04bd728d6d1ecc1aa6c14640f

### Proposed decision

```json
{
  "claimId": "claim_5d1cbfcbc959ff533e12dae53c91dfe1",
  "sourceUnitDigest": "13ea03434706727fe1109db524705b99337ed4f04bd728d6d1ecc1aa6c14640f",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "13ea03434706727fe1109db524705b99337ed4f04bd728d6d1ecc1aa6c14640f",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-18 (lines 160–163) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-21 (lines 187–190); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
When this Step 10 proposal classifies concrete logic such as `plan.md`,
`fgw/<id>`, git diff/status, verify commands, merge/catch-up, AGENTS/skills
material, or coding-specific footprint rules, it should call that logic part of
the Coding Domain Adapter, not the generic Domain Adapter.
```

### Full target shown text

```text
When this Step 10 proposal classifies concrete logic such as `plan.md`,
`fgw/<id>`, git diff/status, verify commands, merge/catch-up, AGENTS/skills
material, or coding-specific footprint rules, it should call that logic part of
the Coding Domain Adapter, not the generic Domain Adapter.
```

## claim_5951682d1ff57c53a2c8a9c7051e6abb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-19, lines 165–165.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-22.
Source digest: b4d2a4955492edc690534f02b4bfd433116cc4f8f4b72e99f02b4e5ef8084d62
Target digest: b4d2a4955492edc690534f02b4bfd433116cc4f8f4b72e99f02b4e5ef8084d62
Shown source SHA256: b4d2a4955492edc690534f02b4bfd433116cc4f8f4b72e99f02b4e5ef8084d62
Shown target SHA256: b4d2a4955492edc690534f02b4bfd433116cc4f8f4b72e99f02b4e5ef8084d62

### Proposed decision

```json
{
  "claimId": "claim_5951682d1ff57c53a2c8a9c7051e6abb",
  "sourceUnitDigest": "b4d2a4955492edc690534f02b4bfd433116cc4f8f4b72e99f02b4e5ef8084d62",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "b4d2a4955492edc690534f02b4bfd433116cc4f8f4b72e99f02b4e5ef8084d62",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-19 (lines 165–165) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-22 (lines 192–192); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The adoption plan has eight layers:
```

### Full target shown text

```text
The adoption plan has eight layers:
```

## claim_ca0b063480f461205e6f82ed82e9da25

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-20, lines 167–204.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-23.
Source digest: 807c4f918a7bc9e12709cd041e338b09cd28558af1c9173c451173fd89ea3213
Target digest: 807c4f918a7bc9e12709cd041e338b09cd28558af1c9173c451173fd89ea3213
Shown source SHA256: 807c4f918a7bc9e12709cd041e338b09cd28558af1c9173c451173fd89ea3213
Shown target SHA256: 807c4f918a7bc9e12709cd041e338b09cd28558af1c9173c451173fd89ea3213

### Proposed decision

```json
{
  "claimId": "claim_ca0b063480f461205e6f82ed82e9da25",
  "sourceUnitDigest": "807c4f918a7bc9e12709cd041e338b09cd28558af1c9173c451173fd89ea3213",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "807c4f918a7bc9e12709cd041e338b09cd28558af1c9173c451173fd89ea3213",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-20 (lines 167–204) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-23 (lines 194–231); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. **Node-only component boundary and harness facade.** Inventory existing
   coding harnesses, including the harnesses that touch Workspace Topology
   concerns, classify authority, define stable Coding Domain Adapter facades
   behind generic Domain Adapter ports, and add contract/forbidden-dependency
   tests before any Rust migration or large physical move. This pass exists
   because coding harnesses currently sit at the busiest boundary between
   domain logic, Work Driver, Dispatch/Run, Agent Coordination, topology, and
   packaging. If the pass finds a harness reading or writing workspace policy,
   worker workspace state, claims, sessions, leases, hot history, projections,
   or runtime command entries, it must resolve that harness behind
   `TopologyContext` in the same slice or record a named blocker.
2. **Coding Domain contract.** Define what Coding Domain owns and does not own,
   including upstream product/design flow for ambiguous work, `cook` for
   implementation-ready work, bugfix/debug flow, small-change/direct path,
   review/validate/repair operations, and fan-out policy.
3. **Workflow and operation model.** Make coding operations explicit:
   required inputs, actor role, read-only versus mutating effect, expected
   evidence, footprint/isolation needs, and allowed next Work transition.
   Examples include `validate-plan`, `review-item`, `implement-item`,
   `scout-blast-radius`, `resolve-question`, and `fix-verify-red`.
4. **Coordination adoption.** Use CoordinationSession for operations that need
   multi-actor collaboration, provenance, recovery, visibility control, or
   evidence history. Start read-only with validation/review/research/scout;
   open mutating sessions only after the topology and ADR-010 gates are met.
5. **Topology and isolation integration.** Consume Workspace Topology for
   worker workspace identity, branch-local config, runtime coordination root,
   hot history placement, workspace installation capsules, footprint claims,
   and leases. This is the gate between read-only Step 10 and mutating Step
   10.
6. **Evidence boundary.** Move coding-specific git/diff/verify interpretation
   behind a Coding Domain evidence adapter, while Run Result Evaluator remains
   the generic confidence owner.
7. **Runner unification.** Collapse the current interactive skill loop and
   headless runner loop into one Work Driver path. Skills become launchers;
   headless and interactive differ by operator presence, not capability.
8. **Domain packaging.** After the runtime shape is stable, package coding
   skills/prompts/harnesses as runtime workshop material and project them into
   host-visible files through the workspace projection ledger.
```

### Full target shown text

```text
1. **Node-only component boundary and harness facade.** Inventory existing
   coding harnesses, including the harnesses that touch Workspace Topology
   concerns, classify authority, define stable Coding Domain Adapter facades
   behind generic Domain Adapter ports, and add contract/forbidden-dependency
   tests before any Rust migration or large physical move. This pass exists
   because coding harnesses currently sit at the busiest boundary between
   domain logic, Work Driver, Dispatch/Run, Agent Coordination, topology, and
   packaging. If the pass finds a harness reading or writing workspace policy,
   worker workspace state, claims, sessions, leases, hot history, projections,
   or runtime command entries, it must resolve that harness behind
   `TopologyContext` in the same slice or record a named blocker.
2. **Coding Domain contract.** Define what Coding Domain owns and does not own,
   including upstream product/design flow for ambiguous work, `cook` for
   implementation-ready work, bugfix/debug flow, small-change/direct path,
   review/validate/repair operations, and fan-out policy.
3. **Workflow and operation model.** Make coding operations explicit:
   required inputs, actor role, read-only versus mutating effect, expected
   evidence, footprint/isolation needs, and allowed next Work transition.
   Examples include `validate-plan`, `review-item`, `implement-item`,
   `scout-blast-radius`, `resolve-question`, and `fix-verify-red`.
4. **Coordination adoption.** Use CoordinationSession for operations that need
   multi-actor collaboration, provenance, recovery, visibility control, or
   evidence history. Start read-only with validation/review/research/scout;
   open mutating sessions only after the topology and ADR-010 gates are met.
5. **Topology and isolation integration.** Consume Workspace Topology for
   worker workspace identity, branch-local config, runtime coordination root,
   hot history placement, workspace installation capsules, footprint claims,
   and leases. This is the gate between read-only Step 10 and mutating Step
   10.
6. **Evidence boundary.** Move coding-specific git/diff/verify interpretation
   behind a Coding Domain evidence adapter, while Run Result Evaluator remains
   the generic confidence owner.
7. **Runner unification.** Collapse the current interactive skill loop and
   headless runner loop into one Work Driver path. Skills become launchers;
   headless and interactive differ by operator presence, not capability.
8. **Domain packaging.** After the runtime shape is stable, package coding
   skills/prompts/harnesses as runtime workshop material and project them into
   host-visible files through the workspace projection ledger.
```

## claim_1ec5967a675c25adc2384126d647fc6d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-21, lines 206–209.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-24.
Source digest: 522b3cee680616ebdf9e8dde7b2d5ba0f8203041cc42a475390f3fe85428dcd3
Target digest: 522b3cee680616ebdf9e8dde7b2d5ba0f8203041cc42a475390f3fe85428dcd3
Shown source SHA256: 522b3cee680616ebdf9e8dde7b2d5ba0f8203041cc42a475390f3fe85428dcd3
Shown target SHA256: 522b3cee680616ebdf9e8dde7b2d5ba0f8203041cc42a475390f3fe85428dcd3

### Proposed decision

```json
{
  "claimId": "claim_1ec5967a675c25adc2384126d647fc6d",
  "sourceUnitDigest": "522b3cee680616ebdf9e8dde7b2d5ba0f8203041cc42a475390f3fe85428dcd3",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "522b3cee680616ebdf9e8dde7b2d5ba0f8203041cc42a475390f3fe85428dcd3",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-21 (lines 206–209) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-24 (lines 233–236); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Detailed plans derived from this section must preserve the high-level A0-G
shape instead of replacing it with local task detail. If a detailed plan
changes the sequence, scope, or exit criteria of any A0-G step, it must update
this proposal and the project-level Architect Roadmap in the same review.
```

### Full target shown text

```text
Detailed plans derived from this section must preserve the high-level A0-G
shape instead of replacing it with local task detail. If a detailed plan
changes the sequence, scope, or exit criteria of any A0-G step, it must update
this proposal and the project-level Architect Roadmap in the same review.
```

## claim_c882f1126a89fd1bde5869084dd49d66

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-22, lines 211–212.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-25.
Source digest: 95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca
Target digest: fcced8e49866778eb28238af97c2e051af2ee7cd0e43e7618cd6e2b2ce1df721
Shown source SHA256: 95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca
Shown target SHA256: fcced8e49866778eb28238af97c2e051af2ee7cd0e43e7618cd6e2b2ce1df721

### Proposed decision

```json
{
  "claimId": "claim_c882f1126a89fd1bde5869084dd49d66",
  "sourceUnitDigest": "95b35698d2e26e6bb38bd5ea8151b5e1c96dafa5ec873310d9006ba1f9f8adca",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "fcced8e49866778eb28238af97c2e051af2ee7cd0e43e7618cd6e2b2ce1df721",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-22 (lines 211–212) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-25 (lines 238–239); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The current detailed plan for A0 is
[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md).
```

### Full target shown text

```text
The current detailed plan for A0 is
[Step 10 A0 - Coding Domain Boundary And Facade Plan](../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md).
```

## claim_297959b4b26fd7d081334fc586f8873b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-23, lines 214–214.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-26.
Source digest: b8b4c9181b9ae69ce03999f53005c4306744238893debf2bf65ec58e2403a9fb
Target digest: b8b4c9181b9ae69ce03999f53005c4306744238893debf2bf65ec58e2403a9fb
Shown source SHA256: b8b4c9181b9ae69ce03999f53005c4306744238893debf2bf65ec58e2403a9fb
Shown target SHA256: b8b4c9181b9ae69ce03999f53005c4306744238893debf2bf65ec58e2403a9fb

### Proposed decision

```json
{
  "claimId": "claim_297959b4b26fd7d081334fc586f8873b",
  "sourceUnitDigest": "b8b4c9181b9ae69ce03999f53005c4306744238893debf2bf65ec58e2403a9fb",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "b8b4c9181b9ae69ce03999f53005c4306744238893debf2bf65ec58e2403a9fb",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-23 (lines 214–214) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-26 (lines 241–241); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Recommended execution order:
```

### Full target shown text

```text
Recommended execution order:
```

## claim_cef20a0879b67abd9ad28c886bab0144

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-24, lines 216–225.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-27.
Source digest: 80780a1c1fa1e91876fc16d5719ccb574879cb434d1748509822c081f5491c5c
Target digest: 80780a1c1fa1e91876fc16d5719ccb574879cb434d1748509822c081f5491c5c
Shown source SHA256: 80780a1c1fa1e91876fc16d5719ccb574879cb434d1748509822c081f5491c5c
Shown target SHA256: 80780a1c1fa1e91876fc16d5719ccb574879cb434d1748509822c081f5491c5c

### Proposed decision

```json
{
  "claimId": "claim_cef20a0879b67abd9ad28c886bab0144",
  "sourceUnitDigest": "80780a1c1fa1e91876fc16d5719ccb574879cb434d1748509822c081f5491c5c",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "80780a1c1fa1e91876fc16d5719ccb574879cb434d1748509822c081f5491c5c",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-24 (lines 216–225) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-27 (lines 243–252); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
A0. Inventory coding/topology harnesses and define Node-only Coding Domain Adapter facades
A1. Lock Coding Domain contract and operation catalog
B. Prove read-only Work-attached CoordinationSession adoption
C. Build topology resolver and migrate legacy roots behind typed roots
D. Add coding evidence adapter and occupancy/concurrency bridge
E. Run the ADR-010 mutating live proof
F. Unify runner/interactive execution through Work Driver
G. Package Coding Domain material through distribution/projection
```
````

### Full target shown text

````text
```txt
A0. Inventory coding/topology harnesses and define Node-only Coding Domain Adapter facades
A1. Lock Coding Domain contract and operation catalog
B. Prove read-only Work-attached CoordinationSession adoption
C. Build topology resolver and migrate legacy roots behind typed roots
D. Add coding evidence adapter and occupancy/concurrency bridge
E. Run the ADR-010 mutating live proof
F. Unify runner/interactive execution through Work Driver
G. Package Coding Domain material through distribution/projection
```
````

## claim_cc8dc988ed05015d1b6cbfb178fc638f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-25, lines 227–238.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-28.
Source digest: 4713ea998cdbbd66b7dfee15571f98b20cb7f392011a7cdf77b46f12287b894f
Target digest: 4713ea998cdbbd66b7dfee15571f98b20cb7f392011a7cdf77b46f12287b894f
Shown source SHA256: 4713ea998cdbbd66b7dfee15571f98b20cb7f392011a7cdf77b46f12287b894f
Shown target SHA256: 4713ea998cdbbd66b7dfee15571f98b20cb7f392011a7cdf77b46f12287b894f

### Proposed decision

```json
{
  "claimId": "claim_cc8dc988ed05015d1b6cbfb178fc638f",
  "sourceUnitDigest": "4713ea998cdbbd66b7dfee15571f98b20cb7f392011a7cdf77b46f12287b894f",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "4713ea998cdbbd66b7dfee15571f98b20cb7f392011a7cdf77b46f12287b894f",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-25 (lines 227–238) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-28 (lines 254–265); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Parallelizable work:

| Lane | Can proceed now | Must wait for |
|---|---|---|
| Node-only Coding Domain boundary/facade | Yes, first. Inventory coding harnesses plus topology-touching harnesses, classify owners, define Coding Domain Adapter facades behind generic Domain Adapter ports, resolve any raw topology root usage behind `TopologyContext`, and add contract/forbidden-dependency tests. | Rust migration and physical moves wait for facade proof. |
| Coding Domain contract | Yes, after or beside A0. | It should consume A0's ownership classification. |
| Operation catalog | Yes, after or beside A0. | Mutating operation execution waits for topology. |
| Read-only coordination bridge | Yes after the minimum facade used by `validate-plan` exists. | It must not change Work mutation, git, merge, or lifecycle authority. |
| Workspace Topology | Yes, in parallel | Implementation migration waits for resolver shape and legacy import rules. |
| Evidence adapter design | Yes | Final mutating semantics wait for topology and ADR-010 proof. |
| Component boundary cleanup | Yes at document/index level | Physical moves wait for Step 10 proof and facade tests. |
| Packaging/projection | Docs may proceed | Runtime implementation waits for topology resolver and domain materialization contract. |
```

### Full target shown text

```text
Parallelizable work:

| Lane | Can proceed now | Must wait for |
|---|---|---|
| Node-only Coding Domain boundary/facade | Yes, first. Inventory coding harnesses plus topology-touching harnesses, classify owners, define Coding Domain Adapter facades behind generic Domain Adapter ports, resolve any raw topology root usage behind `TopologyContext`, and add contract/forbidden-dependency tests. | Rust migration and physical moves wait for facade proof. |
| Coding Domain contract | Yes, after or beside A0. | It should consume A0's ownership classification. |
| Operation catalog | Yes, after or beside A0. | Mutating operation execution waits for topology. |
| Read-only coordination bridge | Yes after the minimum facade used by `validate-plan` exists. | It must not change Work mutation, git, merge, or lifecycle authority. |
| Workspace Topology | Yes, in parallel | Implementation migration waits for resolver shape and legacy import rules. |
| Evidence adapter design | Yes | Final mutating semantics wait for topology and ADR-010 proof. |
| Component boundary cleanup | Yes at document/index level | Physical moves wait for Step 10 proof and facade tests. |
| Packaging/projection | Docs may proceed | Runtime implementation waits for topology resolver and domain materialization contract. |
```

## claim_e733edb142e6d910f6e1299887045ce1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-26, lines 240–243.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-29.
Source digest: 13b78af63dcbe7a63251f20e9afd9616cf2cce8a06e5d335d4a12e4556d81a52
Target digest: 13b78af63dcbe7a63251f20e9afd9616cf2cce8a06e5d335d4a12e4556d81a52
Shown source SHA256: 13b78af63dcbe7a63251f20e9afd9616cf2cce8a06e5d335d4a12e4556d81a52
Shown target SHA256: 13b78af63dcbe7a63251f20e9afd9616cf2cce8a06e5d335d4a12e4556d81a52

### Proposed decision

```json
{
  "claimId": "claim_e733edb142e6d910f6e1299887045ce1",
  "sourceUnitDigest": "13b78af63dcbe7a63251f20e9afd9616cf2cce8a06e5d335d4a12e4556d81a52",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "13b78af63dcbe7a63251f20e9afd9616cf2cce8a06e5d335d4a12e4556d81a52",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-26 (lines 240–243) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-29 (lines 267–270); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Step 10 planning must not treat Workspace Topology and Packaging/Distribution
as later cleanup. Every Step 10 implementation slice must explicitly check
whether it touches any of these topology or distribution concerns and resolve
the related contract gap in the same slice or record a named blocker:
```

### Full target shown text

```text
Step 10 planning must not treat Workspace Topology and Packaging/Distribution
as later cleanup. Every Step 10 implementation slice must explicitly check
whether it touches any of these topology or distribution concerns and resolve
the related contract gap in the same slice or record a named blocker:
```

## claim_c4ceee182f93f9bab2987ad45f06f968

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-27, lines 245–257.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-30.
Source digest: 6c54e9535566518cf9a08c9a4eb6b4748d529f6f5763bd23b3270cad569c2be9
Target digest: 6c54e9535566518cf9a08c9a4eb6b4748d529f6f5763bd23b3270cad569c2be9
Shown source SHA256: 6c54e9535566518cf9a08c9a4eb6b4748d529f6f5763bd23b3270cad569c2be9
Shown target SHA256: 6c54e9535566518cf9a08c9a4eb6b4748d529f6f5763bd23b3270cad569c2be9

### Proposed decision

```json
{
  "claimId": "claim_c4ceee182f93f9bab2987ad45f06f968",
  "sourceUnitDigest": "6c54e9535566518cf9a08c9a4eb6b4748d529f6f5763bd23b3270cad569c2be9",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "6c54e9535566518cf9a08c9a4eb6b4748d529f6f5763bd23b3270cad569c2be9",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-27 (lines 245–257) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-30 (lines 272–284); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- branch/workspace policy reads, especially `.fgos/config.json` and
  `.fgos/distribution.json`;
- worker workspace creation, workspace identity, and whether the worker needs
  a local `.fgos/installation/` capsule;
- claim/session/assignment/lease placement under `runtimeCoordinationRoot`;
- hot Work history writes and legacy import from existing `.fgos/events*`;
- footprint claims, worktree leases, and mutation fencing;
- projection ownership for coding skills, prompts, harnesses, AGENTS.md blocks,
  `.agents/skills`, and `.claude/skills`;
- active runtime identity, state-schema compatibility, and whether a local
  `fgos` command is running under the workspace activation binding;
- package/runtime materialization of Coding Domain assets as release workshop
  material, not source-tree side effects.
```

### Full target shown text

```text
- branch/workspace policy reads, especially `.fgos/config.json` and
  `.fgos/distribution.json`;
- worker workspace creation, workspace identity, and whether the worker needs
  a local `.fgos/installation/` capsule;
- claim/session/assignment/lease placement under `runtimeCoordinationRoot`;
- hot Work history writes and legacy import from existing `.fgos/events*`;
- footprint claims, worktree leases, and mutation fencing;
- projection ownership for coding skills, prompts, harnesses, AGENTS.md blocks,
  `.agents/skills`, and `.claude/skills`;
- active runtime identity, state-schema compatibility, and whether a local
  `fgos` command is running under the workspace activation binding;
- package/runtime materialization of Coding Domain assets as release workshop
  material, not source-tree side effects.
```

## claim_8066cc8f99847d1567d89d58d97052f6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-28, lines 259–266.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-31.
Source digest: 81b033534418a9eae8083fcd827de5739fd680a44f5bb72d969fe04f51091ffb
Target digest: 81b033534418a9eae8083fcd827de5739fd680a44f5bb72d969fe04f51091ffb
Shown source SHA256: 81b033534418a9eae8083fcd827de5739fd680a44f5bb72d969fe04f51091ffb
Shown target SHA256: 81b033534418a9eae8083fcd827de5739fd680a44f5bb72d969fe04f51091ffb

### Proposed decision

```json
{
  "claimId": "claim_8066cc8f99847d1567d89d58d97052f6",
  "sourceUnitDigest": "81b033534418a9eae8083fcd827de5739fd680a44f5bb72d969fe04f51091ffb",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "81b033534418a9eae8083fcd827de5739fd680a44f5bb72d969fe04f51091ffb",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-28 (lines 259–266) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-31 (lines 286–293); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The A0 boundary/facade pass is the preferred place to handle topology-related
harnesses. It should classify at least these harness families before Step 10B
uses them: worktree and branch creation, merge/catch-up/approval, claim and
runtime occupancy, goal-check and verification evidence, prompt/skill
projection, config/default/doctor repair, and any coding harness that shells
out through a local `fgos` command path. A0 may leave behavior in its current
files, but callers should begin depending on typed facades rather than direct
raw paths.
```

### Full target shown text

```text
The A0 boundary/facade pass is the preferred place to handle topology-related
harnesses. It should classify at least these harness families before Step 10B
uses them: worktree and branch creation, merge/catch-up/approval, claim and
runtime occupancy, goal-check and verification evidence, prompt/skill
projection, config/default/doctor repair, and any coding harness that shells
out through a local `fgos` command path. A0 may leave behavior in its current
files, but callers should begin depending on typed facades rather than direct
raw paths.
```

## claim_2cd843265456f75fc4830af00488fee0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-29, lines 268–273.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-32.
Source digest: bdb02a213c8c61f24f708ca3f214fcdac1b7690afc435acdff6db16875f4b271
Target digest: bdb02a213c8c61f24f708ca3f214fcdac1b7690afc435acdff6db16875f4b271
Shown source SHA256: bdb02a213c8c61f24f708ca3f214fcdac1b7690afc435acdff6db16875f4b271
Shown target SHA256: bdb02a213c8c61f24f708ca3f214fcdac1b7690afc435acdff6db16875f4b271

### Proposed decision

```json
{
  "claimId": "claim_2cd843265456f75fc4830af00488fee0",
  "sourceUnitDigest": "bdb02a213c8c61f24f708ca3f214fcdac1b7690afc435acdff6db16875f4b271",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "bdb02a213c8c61f24f708ca3f214fcdac1b7690afc435acdff6db16875f4b271",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-29 (lines 268–273) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-32 (lines 295–300); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
If a slice is read-only, the check may conclude "not touched" for mutation,
worktree, merge, and packaging materialization. If a slice creates or changes
any worker, claim, event, projection, local command entry, or domain asset
placement behavior, it must consume `TopologyContext` and align with
`runtime-identity-and-activation.md` rather than introducing another raw
`.fgos` path.
```

### Full target shown text

```text
If a slice is read-only, the check may conclude "not touched" for mutation,
worktree, merge, and packaging materialization. If a slice creates or changes
any worker, claim, event, projection, local command entry, or domain asset
placement behavior, it must consume `TopologyContext` and align with
`runtime-identity-and-activation.md` rather than introducing another raw
`.fgos` path.
```

## claim_e2e13a14bcd18a40781dc6b361f932d4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#31-a0-exit-criteria, lines 275–275.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#31-a0-exit-criteria.
Source digest: 5266f3dc8a234e399be9182f7f117868575a0fe606eb066259c9570707077a9e
Target digest: 5266f3dc8a234e399be9182f7f117868575a0fe606eb066259c9570707077a9e
Shown source SHA256: f0e7ad61adf7471dfef499f929dfed81af30223ad6351b983206f9c792b49b47
Shown target SHA256: f0e7ad61adf7471dfef499f929dfed81af30223ad6351b983206f9c792b49b47

### Proposed decision

```json
{
  "claimId": "claim_e2e13a14bcd18a40781dc6b361f932d4",
  "sourceUnitDigest": "5266f3dc8a234e399be9182f7f117868575a0fe606eb066259c9570707077a9e",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "31-a0-exit-criteria",
  "targetUnitDigest": "5266f3dc8a234e399be9182f7f117868575a0fe606eb066259c9570707077a9e",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#31-a0-exit-criteria (lines 275–275) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#31-a0-exit-criteria (lines 302–302); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 3.1 A0 Exit Criteria

A0 is done when the next agent can begin Step 10B without rediscovering coding
harness ownership or guessing topology boundaries.

Required outputs:

1. **Harness inventory table.** Inventory at least contract enrich/validate,
   worktree/branch, merge/catch-up/approval, claim/occupancy,
   goal-check/verify evidence, prompt/skill material, config/doctor/projection,
   and local `fgos` command entry.
2. **Owner classification.** Each harness family has one authority owner:
   Work Core, Work Driver Core, Workspace & Occupancy Substrate,
   Dispatch/Run Runtime, Run Result Evaluator, Coding Domain Adapter, or
   Packaging/Projection. Shared use is allowed; shared authority is not.
3. **Minimal facade list.** Name the generic ports and the Coding Domain
   Adapter facades Step 10B may call. The expected starting set is:
   `describeCodingOperation`, `enrichCodingOperationContract`,
   `planCodingWorkspaceNeeds`, `collectCodingEvidence`,
   `interpretCodingEvidence`, and `resolveCodingPromptMaterial`, plus the
   Workspace & Occupancy substrate calls `resolveTopology`,
   `planWorkspaceUse`, `requestOccupancy`, and `releaseOccupancy`.
4. **Forbidden dependency rules.** At minimum: Work Driver Core must not import
   coding worktree/merge/verify modules directly; Agent Coordination must not
   import coding repo mutation modules; Coding Domain Adapter must not write
   Work state directly; Packaging/Distribution must not decide coding workflow
   semantics.
5. **Contract tests.** Add or name tests proving the first Step 10B path uses
   facades rather than raw harness files, Work Driver can call a generic Domain
   Adapter Port, Coding Domain Adapter can declare read-only workspace needs,
   topology-touching harnesses do not introduce new raw `.fgos` paths, and
   forbidden imports are rejected.

No Rust migration, broad physical source move, or mutating Work-attached
session is part of A0.
```

### Full target shown text

```text
### 3.1 A0 Exit Criteria

A0 is done when the next agent can begin Step 10B without rediscovering coding
harness ownership or guessing topology boundaries.

Required outputs:

1. **Harness inventory table.** Inventory at least contract enrich/validate,
   worktree/branch, merge/catch-up/approval, claim/occupancy,
   goal-check/verify evidence, prompt/skill material, config/doctor/projection,
   and local `fgos` command entry.
2. **Owner classification.** Each harness family has one authority owner:
   Work Core, Work Driver Core, Workspace & Occupancy Substrate,
   Dispatch/Run Runtime, Run Result Evaluator, Coding Domain Adapter, or
   Packaging/Projection. Shared use is allowed; shared authority is not.
3. **Minimal facade list.** Name the generic ports and the Coding Domain
   Adapter facades Step 10B may call. The expected starting set is:
   `describeCodingOperation`, `enrichCodingOperationContract`,
   `planCodingWorkspaceNeeds`, `collectCodingEvidence`,
   `interpretCodingEvidence`, and `resolveCodingPromptMaterial`, plus the
   Workspace & Occupancy substrate calls `resolveTopology`,
   `planWorkspaceUse`, `requestOccupancy`, and `releaseOccupancy`.
4. **Forbidden dependency rules.** At minimum: Work Driver Core must not import
   coding worktree/merge/verify modules directly; Agent Coordination must not
   import coding repo mutation modules; Coding Domain Adapter must not write
   Work state directly; Packaging/Distribution must not decide coding workflow
   semantics.
5. **Contract tests.** Add or name tests proving the first Step 10B path uses
   facades rather than raw harness files, Work Driver can call a generic Domain
   Adapter Port, Coding Domain Adapter can declare read-only workspace needs,
   topology-touching harnesses do not introduce new raw `.fgos` paths, and
   forbidden imports are rejected.

No Rust migration, broad physical source move, or mutating Work-attached
session is part of A0.
```

## claim_50cb4b8871c07549bea696fbaca458d4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-30, lines 277–278.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-33.
Source digest: 1cb59be2be6cc2fdbe86566d07b368c3a73285b11fdb7f6c6cd3750bbf4ec614
Target digest: 1cb59be2be6cc2fdbe86566d07b368c3a73285b11fdb7f6c6cd3750bbf4ec614
Shown source SHA256: 1cb59be2be6cc2fdbe86566d07b368c3a73285b11fdb7f6c6cd3750bbf4ec614
Shown target SHA256: 1cb59be2be6cc2fdbe86566d07b368c3a73285b11fdb7f6c6cd3750bbf4ec614

### Proposed decision

```json
{
  "claimId": "claim_50cb4b8871c07549bea696fbaca458d4",
  "sourceUnitDigest": "1cb59be2be6cc2fdbe86566d07b368c3a73285b11fdb7f6c6cd3750bbf4ec614",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "1cb59be2be6cc2fdbe86566d07b368c3a73285b11fdb7f6c6cd3750bbf4ec614",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan",
    "3.1 A0 Exit Criteria"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-30 (lines 277–278) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-33 (lines 304–305); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A0 is done when the next agent can begin Step 10B without rediscovering coding
harness ownership or guessing topology boundaries.
```

### Full target shown text

```text
A0 is done when the next agent can begin Step 10B without rediscovering coding
harness ownership or guessing topology boundaries.
```

## claim_c6a1c5cca76387c7e9915335630b274e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-31, lines 280–306.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-34.
Source digest: 6de4c8733f82c59c4bb297db5d878504d61035260566b75ab411470ae076a598
Target digest: 6de4c8733f82c59c4bb297db5d878504d61035260566b75ab411470ae076a598
Shown source SHA256: 6de4c8733f82c59c4bb297db5d878504d61035260566b75ab411470ae076a598
Shown target SHA256: 6de4c8733f82c59c4bb297db5d878504d61035260566b75ab411470ae076a598

### Proposed decision

```json
{
  "claimId": "claim_c6a1c5cca76387c7e9915335630b274e",
  "sourceUnitDigest": "6de4c8733f82c59c4bb297db5d878504d61035260566b75ab411470ae076a598",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "6de4c8733f82c59c4bb297db5d878504d61035260566b75ab411470ae076a598",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan",
    "3.1 A0 Exit Criteria"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-31 (lines 280–306) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-34 (lines 307–333); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Required outputs:

1. **Harness inventory table.** Inventory at least contract enrich/validate,
   worktree/branch, merge/catch-up/approval, claim/occupancy,
   goal-check/verify evidence, prompt/skill material, config/doctor/projection,
   and local `fgos` command entry.
2. **Owner classification.** Each harness family has one authority owner:
   Work Core, Work Driver Core, Workspace & Occupancy Substrate,
   Dispatch/Run Runtime, Run Result Evaluator, Coding Domain Adapter, or
   Packaging/Projection. Shared use is allowed; shared authority is not.
3. **Minimal facade list.** Name the generic ports and the Coding Domain
   Adapter facades Step 10B may call. The expected starting set is:
   `describeCodingOperation`, `enrichCodingOperationContract`,
   `planCodingWorkspaceNeeds`, `collectCodingEvidence`,
   `interpretCodingEvidence`, and `resolveCodingPromptMaterial`, plus the
   Workspace & Occupancy substrate calls `resolveTopology`,
   `planWorkspaceUse`, `requestOccupancy`, and `releaseOccupancy`.
4. **Forbidden dependency rules.** At minimum: Work Driver Core must not import
   coding worktree/merge/verify modules directly; Agent Coordination must not
   import coding repo mutation modules; Coding Domain Adapter must not write
   Work state directly; Packaging/Distribution must not decide coding workflow
   semantics.
5. **Contract tests.** Add or name tests proving the first Step 10B path uses
   facades rather than raw harness files, Work Driver can call a generic Domain
   Adapter Port, Coding Domain Adapter can declare read-only workspace needs,
   topology-touching harnesses do not introduce new raw `.fgos` paths, and
   forbidden imports are rejected.
```

### Full target shown text

```text
Required outputs:

1. **Harness inventory table.** Inventory at least contract enrich/validate,
   worktree/branch, merge/catch-up/approval, claim/occupancy,
   goal-check/verify evidence, prompt/skill material, config/doctor/projection,
   and local `fgos` command entry.
2. **Owner classification.** Each harness family has one authority owner:
   Work Core, Work Driver Core, Workspace & Occupancy Substrate,
   Dispatch/Run Runtime, Run Result Evaluator, Coding Domain Adapter, or
   Packaging/Projection. Shared use is allowed; shared authority is not.
3. **Minimal facade list.** Name the generic ports and the Coding Domain
   Adapter facades Step 10B may call. The expected starting set is:
   `describeCodingOperation`, `enrichCodingOperationContract`,
   `planCodingWorkspaceNeeds`, `collectCodingEvidence`,
   `interpretCodingEvidence`, and `resolveCodingPromptMaterial`, plus the
   Workspace & Occupancy substrate calls `resolveTopology`,
   `planWorkspaceUse`, `requestOccupancy`, and `releaseOccupancy`.
4. **Forbidden dependency rules.** At minimum: Work Driver Core must not import
   coding worktree/merge/verify modules directly; Agent Coordination must not
   import coding repo mutation modules; Coding Domain Adapter must not write
   Work state directly; Packaging/Distribution must not decide coding workflow
   semantics.
5. **Contract tests.** Add or name tests proving the first Step 10B path uses
   facades rather than raw harness files, Work Driver can call a generic Domain
   Adapter Port, Coding Domain Adapter can declare read-only workspace needs,
   topology-touching harnesses do not introduce new raw `.fgos` paths, and
   forbidden imports are rejected.
```

## claim_37eaef51fe602e844edb461fb63abfd9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-32, lines 308–309.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-35.
Source digest: 85a34b9a8706b7b06a5bee5974058fc2e82b79a1b478fc2e0b9ad28f73a400b6
Target digest: 85a34b9a8706b7b06a5bee5974058fc2e82b79a1b478fc2e0b9ad28f73a400b6
Shown source SHA256: 85a34b9a8706b7b06a5bee5974058fc2e82b79a1b478fc2e0b9ad28f73a400b6
Shown target SHA256: 85a34b9a8706b7b06a5bee5974058fc2e82b79a1b478fc2e0b9ad28f73a400b6

### Proposed decision

```json
{
  "claimId": "claim_37eaef51fe602e844edb461fb63abfd9",
  "sourceUnitDigest": "85a34b9a8706b7b06a5bee5974058fc2e82b79a1b478fc2e0b9ad28f73a400b6",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "85a34b9a8706b7b06a5bee5974058fc2e82b79a1b478fc2e0b9ad28f73a400b6",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "3. High-Level Adoption Plan",
    "3.1 A0 Exit Criteria"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-32 (lines 308–309) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-35 (lines 335–336); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
No Rust migration, broad physical source move, or mutating Work-attached
session is part of A0.
```

### Full target shown text

```text
No Rust migration, broad physical source move, or mutating Work-attached
session is part of A0.
```

## claim_4cf831a1488ff02a9d582c8e80acccef

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#4-dependency-on-step-08-and-step-09, lines 311–311.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#4-dependency-on-step-08-and-step-09.
Source digest: 1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74
Target digest: 8e891c41440fba675e7aa1038d558b28e4a1f92c31403adcc46342a509ccb981
Shown source SHA256: 51b3321222081bfbccdf3233394f960de22d6ef3cb5f24eb1d79cbdde8ebdabb
Shown target SHA256: 41131d6cbe42e72923750c1487bfecb2f26dd3bf7e4cbb5b586bdff4b11d388a

### Proposed decision

```json
{
  "claimId": "claim_4cf831a1488ff02a9d582c8e80acccef",
  "sourceUnitDigest": "1d879354ffc73a1ec525472763b1eb42f37800cacb97c1bbb72fc61194e12b74",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "4-dependency-on-step-08-and-step-09",
  "targetUnitDigest": "8e891c41440fba675e7aa1038d558b28e4a1f92c31403adcc46342a509ccb981",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#4-dependency-on-step-08-and-step-09 (lines 311–311) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#4-dependency-on-step-08-and-step-09 (lines 338–338); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 4. Dependency On Step 08 And Step 09

**Observed:** Step 08 has closed all 8 phases. The final Deferral Audit is now
the reconciliation source for what Step 08 deliberately delivered, deferred,
or proved out of scope.

**Observed:** Step 09 has closed its implemented slice. The accepted substrate
for Step 10 is the promoted CoordinationSession and FlowDefinition contracts,
plus the implemented protocol/visibility/aggregation/deliberation/specialist
slice they authorize. Step 09's broader deferred features remain preserved in
the architecture intent docs; Step 10 should not pull them into scope unless a
coding-domain proof actually needs one.

**Proposed:** keep the authority map as a parallel architect-level
prerequisite, not a child step of coding adoption. The
[Component Authority Boundary Map](component-authority-boundary-map.md)
classifies ownership and forbidden dependencies before Step 10 implementation
starts. Mutating adoption remains blocked by the ADR-010 gate and depends on
the Step 08 proofs for crash recovery and concurrent-mutating-actor refusal.

**Observed, explicitly out of Step 08 scope and therefore *not* delivered:**

- consumer migration for the current Workflow runtime (the FlowDefinition
  adapter is additive and read-only);
- AdhocTask and hybrid planning materialization;
- Work-attached mutating coordination;
- domain worktree allocation, merge, or Work transition inside
  `src/runner/coordination/**`.
```

### Full target shown text

```text
## 4. Dependency On Step 08 And Step 09

**Observed:** Step 08 has closed all 8 phases. The final Deferral Audit is now
the reconciliation source for what Step 08 deliberately delivered, deferred,
or proved out of scope.

**Observed:** Step 09 has closed its implemented slice. The accepted substrate
for Step 10 is the promoted CoordinationSession and FlowDefinition contracts,
plus the implemented protocol/visibility/aggregation/deliberation/specialist
slice they authorize. Step 09's broader deferred features remain preserved in
the architecture intent docs; Step 10 should not pull them into scope unless a
coding-domain proof actually needs one.

**Proposed:** keep the authority map as a parallel architect-level
prerequisite, not a child step of coding adoption. The
[Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md)
classifies ownership and forbidden dependencies before Step 10 implementation
starts. Mutating adoption remains blocked by the ADR-010 gate and depends on
the Step 08 proofs for crash recovery and concurrent-mutating-actor refusal.

**Observed, explicitly out of Step 08 scope and therefore *not* delivered:**

- consumer migration for the current Workflow runtime (the FlowDefinition
  adapter is additive and read-only);
- AdhocTask and hybrid planning materialization;
- Work-attached mutating coordination;
- domain worktree allocation, merge, or Work transition inside
  `src/runner/coordination/**`.
```

## claim_b3809c970cd360e7286a3cfb37e432be

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-33, lines 313–315.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-36.
Source digest: d5480045272ecdc207037110fbbe9da125ea69c3bb7faf72387c2ef045632875
Target digest: d5480045272ecdc207037110fbbe9da125ea69c3bb7faf72387c2ef045632875
Shown source SHA256: d5480045272ecdc207037110fbbe9da125ea69c3bb7faf72387c2ef045632875
Shown target SHA256: d5480045272ecdc207037110fbbe9da125ea69c3bb7faf72387c2ef045632875

### Proposed decision

```json
{
  "claimId": "claim_b3809c970cd360e7286a3cfb37e432be",
  "sourceUnitDigest": "d5480045272ecdc207037110fbbe9da125ea69c3bb7faf72387c2ef045632875",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "d5480045272ecdc207037110fbbe9da125ea69c3bb7faf72387c2ef045632875",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "4. Dependency On Step 08 And Step 09"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-33 (lines 313–315) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-36 (lines 340–342); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Observed:** Step 08 has closed all 8 phases. The final Deferral Audit is now
the reconciliation source for what Step 08 deliberately delivered, deferred,
or proved out of scope.
```

### Full target shown text

```text
**Observed:** Step 08 has closed all 8 phases. The final Deferral Audit is now
the reconciliation source for what Step 08 deliberately delivered, deferred,
or proved out of scope.
```

## claim_49b4d7c2a2b2043e000ab31badb2eddc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-34, lines 317–322.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-37.
Source digest: d9e54695335f2408d595aa0a682d974e820b934cdc0f7fa88b71e5223ed0a804
Target digest: d9e54695335f2408d595aa0a682d974e820b934cdc0f7fa88b71e5223ed0a804
Shown source SHA256: d9e54695335f2408d595aa0a682d974e820b934cdc0f7fa88b71e5223ed0a804
Shown target SHA256: d9e54695335f2408d595aa0a682d974e820b934cdc0f7fa88b71e5223ed0a804

### Proposed decision

```json
{
  "claimId": "claim_49b4d7c2a2b2043e000ab31badb2eddc",
  "sourceUnitDigest": "d9e54695335f2408d595aa0a682d974e820b934cdc0f7fa88b71e5223ed0a804",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "d9e54695335f2408d595aa0a682d974e820b934cdc0f7fa88b71e5223ed0a804",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "4. Dependency On Step 08 And Step 09"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-34 (lines 317–322) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-37 (lines 344–349); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Observed:** Step 09 has closed its implemented slice. The accepted substrate
for Step 10 is the promoted CoordinationSession and FlowDefinition contracts,
plus the implemented protocol/visibility/aggregation/deliberation/specialist
slice they authorize. Step 09's broader deferred features remain preserved in
the architecture intent docs; Step 10 should not pull them into scope unless a
coding-domain proof actually needs one.
```

### Full target shown text

```text
**Observed:** Step 09 has closed its implemented slice. The accepted substrate
for Step 10 is the promoted CoordinationSession and FlowDefinition contracts,
plus the implemented protocol/visibility/aggregation/deliberation/specialist
slice they authorize. Step 09's broader deferred features remain preserved in
the architecture intent docs; Step 10 should not pull them into scope unless a
coding-domain proof actually needs one.
```

## claim_db1b9790987b9243caa0d47fa47fa3c3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-35, lines 324–329.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-38.
Source digest: 84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc
Target digest: 3e55a6bee078e912313eb1bf9d17c2936238dd1e9ee7564b5c68f6c4747d524a
Shown source SHA256: 84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc
Shown target SHA256: 3e55a6bee078e912313eb1bf9d17c2936238dd1e9ee7564b5c68f6c4747d524a

### Proposed decision

```json
{
  "claimId": "claim_db1b9790987b9243caa0d47fa47fa3c3",
  "sourceUnitDigest": "84b3bb414cc305a853a6c1861dfd52727d90d0ce7febceff36bde8e4c7ec64cc",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "3e55a6bee078e912313eb1bf9d17c2936238dd1e9ee7564b5c68f6c4747d524a",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "4. Dependency On Step 08 And Step 09"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-35 (lines 324–329) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-38 (lines 351–356); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Proposed:** keep the authority map as a parallel architect-level
prerequisite, not a child step of coding adoption. The
[Component Authority Boundary Map](component-authority-boundary-map.md)
classifies ownership and forbidden dependencies before Step 10 implementation
starts. Mutating adoption remains blocked by the ADR-010 gate and depends on
the Step 08 proofs for crash recovery and concurrent-mutating-actor refusal.
```

### Full target shown text

```text
**Proposed:** keep the authority map as a parallel architect-level
prerequisite, not a child step of coding adoption. The
[Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md)
classifies ownership and forbidden dependencies before Step 10 implementation
starts. Mutating adoption remains blocked by the ADR-010 gate and depends on
the Step 08 proofs for crash recovery and concurrent-mutating-actor refusal.
```

## claim_3e71ad7bb30b6e567c5116c45794a382

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-36, lines 331–331.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-39.
Source digest: 48cde5627fa3886fd97761646204287e660a17f6ff5b511d41da4bc35bd8e7b2
Target digest: 48cde5627fa3886fd97761646204287e660a17f6ff5b511d41da4bc35bd8e7b2
Shown source SHA256: 48cde5627fa3886fd97761646204287e660a17f6ff5b511d41da4bc35bd8e7b2
Shown target SHA256: 48cde5627fa3886fd97761646204287e660a17f6ff5b511d41da4bc35bd8e7b2

### Proposed decision

```json
{
  "claimId": "claim_3e71ad7bb30b6e567c5116c45794a382",
  "sourceUnitDigest": "48cde5627fa3886fd97761646204287e660a17f6ff5b511d41da4bc35bd8e7b2",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "48cde5627fa3886fd97761646204287e660a17f6ff5b511d41da4bc35bd8e7b2",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "4. Dependency On Step 08 And Step 09"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-36 (lines 331–331) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-39 (lines 358–358); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Observed, explicitly out of Step 08 scope and therefore *not* delivered:**
```

### Full target shown text

```text
**Observed, explicitly out of Step 08 scope and therefore *not* delivered:**
```

## claim_7004d6c3c7a8d58b6664a943e655947c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-37, lines 333–338.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-40.
Source digest: 7b012508c6fb505769f391d4b4873d0e40202a458b48efe04d45d3688bcc9e57
Target digest: 7b012508c6fb505769f391d4b4873d0e40202a458b48efe04d45d3688bcc9e57
Shown source SHA256: 7b012508c6fb505769f391d4b4873d0e40202a458b48efe04d45d3688bcc9e57
Shown target SHA256: 7b012508c6fb505769f391d4b4873d0e40202a458b48efe04d45d3688bcc9e57

### Proposed decision

```json
{
  "claimId": "claim_7004d6c3c7a8d58b6664a943e655947c",
  "sourceUnitDigest": "7b012508c6fb505769f391d4b4873d0e40202a458b48efe04d45d3688bcc9e57",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "7b012508c6fb505769f391d4b4873d0e40202a458b48efe04d45d3688bcc9e57",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "4. Dependency On Step 08 And Step 09"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-37 (lines 333–338) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-40 (lines 360–365); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- consumer migration for the current Workflow runtime (the FlowDefinition
  adapter is additive and read-only);
- AdhocTask and hybrid planning materialization;
- Work-attached mutating coordination;
- domain worktree allocation, merge, or Work transition inside
  `src/runner/coordination/**`.
```

### Full target shown text

```text
- consumer migration for the current Workflow runtime (the FlowDefinition
  adapter is additive and read-only);
- AdhocTask and hybrid planning materialization;
- Work-attached mutating coordination;
- domain worktree allocation, merge, or Work transition inside
  `src/runner/coordination/**`.
```

## claim_ace01e2ab039ecbfd19f3c1d8f049d8c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#5-current-coding-domain-reality, lines 340–340.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#5-current-coding-domain-reality.
Source digest: 8a8b7d899b9b1a61cc82b12c397e2a7ac3099e80222fe921f757d241d779ec84
Target digest: 8a8b7d899b9b1a61cc82b12c397e2a7ac3099e80222fe921f757d241d779ec84
Shown source SHA256: 8e7c55753bd44dfcf8693ee7a9fcf4386808391c6e15a16a3e5840fda6eed3fe
Shown target SHA256: 8e7c55753bd44dfcf8693ee7a9fcf4386808391c6e15a16a3e5840fda6eed3fe

### Proposed decision

```json
{
  "claimId": "claim_ace01e2ab039ecbfd19f3c1d8f049d8c",
  "sourceUnitDigest": "8a8b7d899b9b1a61cc82b12c397e2a7ac3099e80222fe921f757d241d779ec84",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "5-current-coding-domain-reality",
  "targetUnitDigest": "8a8b7d899b9b1a61cc82b12c397e2a7ac3099e80222fe921f757d241d779ec84",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#5-current-coding-domain-reality (lines 340–340) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#5-current-coding-domain-reality (lines 367–367); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 5. Current Coding-Domain Reality
```

### Full target shown text

```text
## 5. Current Coding-Domain Reality
```

## claim_65f2743ad3eb5162fac84c0f61620dd1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#51-coding-already-sits-on-the-shared-execution-core, lines 342–342.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#51-coding-already-sits-on-the-shared-execution-core.
Source digest: 2db4a17b8470f62adc7fa9723f2d9e48b1cb6a2512cebbb3966055e6b10ba1ca
Target digest: 2db4a17b8470f62adc7fa9723f2d9e48b1cb6a2512cebbb3966055e6b10ba1ca
Shown source SHA256: 374b49f61e1edcc73a6aa8c48104040ed5d5bf9fb964f132822d8c8d76bd64c6
Shown target SHA256: 374b49f61e1edcc73a6aa8c48104040ed5d5bf9fb964f132822d8c8d76bd64c6

### Proposed decision

```json
{
  "claimId": "claim_65f2743ad3eb5162fac84c0f61620dd1",
  "sourceUnitDigest": "2db4a17b8470f62adc7fa9723f2d9e48b1cb6a2512cebbb3966055e6b10ba1ca",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "51-coding-already-sits-on-the-shared-execution-core",
  "targetUnitDigest": "2db4a17b8470f62adc7fa9723f2d9e48b1cb6a2512cebbb3966055e6b10ba1ca",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#51-coding-already-sits-on-the-shared-execution-core (lines 342–342) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#51-coding-already-sits-on-the-shared-execution-core (lines 369–369); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 5.1 Coding already sits on the shared execution core

**Observed:** since Team Dispatch V1 Steps 02–06, coding Stage Operations
lower to `Assignment -> DispatchPlan -> Run -> RunResult` through
`buildAssignment` / `executeAssignment`. The coding harness
`domains/coding/harness/enrich-and-validate-contract.mjs` (ADR-007) already
exists for agent-led inline contracts attached to Work. So "moving coding
onto the new architecture" is not a runtime replacement. What coding lacks is
the *session* layer Step 08 adds: CoordinationSession ledger, topology,
cohort allocation, session-wide budgets, and session recovery.
```

### Full target shown text

```text
### 5.1 Coding already sits on the shared execution core

**Observed:** since Team Dispatch V1 Steps 02–06, coding Stage Operations
lower to `Assignment -> DispatchPlan -> Run -> RunResult` through
`buildAssignment` / `executeAssignment`. The coding harness
`domains/coding/harness/enrich-and-validate-contract.mjs` (ADR-007) already
exists for agent-led inline contracts attached to Work. So "moving coding
onto the new architecture" is not a runtime replacement. What coding lacks is
the *session* layer Step 08 adds: CoordinationSession ledger, topology,
cohort allocation, session-wide budgets, and session recovery.
```

## claim_e4bedc4a8f3b9779a20c0cb7bd71e0d8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-38, lines 344–351.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-41.
Source digest: fb2faa3faf4e7c61d25c4d7e4d08c99b0be794da954d053c354cc60b8633cf89
Target digest: fb2faa3faf4e7c61d25c4d7e4d08c99b0be794da954d053c354cc60b8633cf89
Shown source SHA256: fb2faa3faf4e7c61d25c4d7e4d08c99b0be794da954d053c354cc60b8633cf89
Shown target SHA256: fb2faa3faf4e7c61d25c4d7e4d08c99b0be794da954d053c354cc60b8633cf89

### Proposed decision

```json
{
  "claimId": "claim_e4bedc4a8f3b9779a20c0cb7bd71e0d8",
  "sourceUnitDigest": "fb2faa3faf4e7c61d25c4d7e4d08c99b0be794da954d053c354cc60b8633cf89",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "fb2faa3faf4e7c61d25c4d7e4d08c99b0be794da954d053c354cc60b8633cf89",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.1 Coding already sits on the shared execution core"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-38 (lines 344–351) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-41 (lines 371–378); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Observed:** since Team Dispatch V1 Steps 02–06, coding Stage Operations
lower to `Assignment -> DispatchPlan -> Run -> RunResult` through
`buildAssignment` / `executeAssignment`. The coding harness
`domains/coding/harness/enrich-and-validate-contract.mjs` (ADR-007) already
exists for agent-led inline contracts attached to Work. So "moving coding
onto the new architecture" is not a runtime replacement. What coding lacks is
the *session* layer Step 08 adds: CoordinationSession ledger, topology,
cohort allocation, session-wide budgets, and session recovery.
```

### Full target shown text

```text
**Observed:** since Team Dispatch V1 Steps 02–06, coding Stage Operations
lower to `Assignment -> DispatchPlan -> Run -> RunResult` through
`buildAssignment` / `executeAssignment`. The coding harness
`domains/coding/harness/enrich-and-validate-contract.mjs` (ADR-007) already
exists for agent-led inline contracts attached to Work. So "moving coding
onto the new architecture" is not a runtime replacement. What coding lacks is
the *session* layer Step 08 adds: CoordinationSession ledger, topology,
cohort allocation, session-wide budgets, and session recovery.
```

## claim_f3a6a5bf8dd066998e90e63f72f739fa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#52-two-doors-one-shared-function, lines 353–353.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#52-two-doors-one-shared-function.
Source digest: 9ea4056e79f946a1e51916cea5385ddab83937adfe3a8ef3bd01154f424bb170
Target digest: 9ea4056e79f946a1e51916cea5385ddab83937adfe3a8ef3bd01154f424bb170
Shown source SHA256: a30ab3b9e20013bdb772f5fa23a3b321d4587c8e9517713f33f000509a553b88
Shown target SHA256: a30ab3b9e20013bdb772f5fa23a3b321d4587c8e9517713f33f000509a553b88

### Proposed decision

```json
{
  "claimId": "claim_f3a6a5bf8dd066998e90e63f72f739fa",
  "sourceUnitDigest": "9ea4056e79f946a1e51916cea5385ddab83937adfe3a8ef3bd01154f424bb170",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "52-two-doors-one-shared-function",
  "targetUnitDigest": "9ea4056e79f946a1e51916cea5385ddab83937adfe3a8ef3bd01154f424bb170",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#52-two-doors-one-shared-function (lines 353–353) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#52-two-doors-one-shared-function (lines 380–380); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 5.2 Two doors, one shared function

**Observed:** coding has two Work-attached doors:

- **Interactive:** `fgos-coding-driving` (prose loop) → stage skill → engine
  verb (`fgos discover` / `fgos plan` / `fgos return`). Secondary
  operations such as `validate-plan` reach `bin/fgos.mjs plan` →
  `chooseStageOperation` → `executeDriverOperationChoice` →
  `executeAssignment`. The Implement step calls
  `node src/runner/dispatch.mjs decide --work <id>`.
- **Headless:** `src/runner/loop.mjs` → `chooseStageOperation` →
  `executeDriverOperationChoice` for `dispatch: 'assignment'` choices, and
  `spawnWorker` (own worktree, own goal-check) for the executing-stage
  primary operation.

Both doors converge on `executeDriverOperationChoice`
(`src/runner/dispatch/operation-choice.mjs`). This is the single most useful
fact for Step 10: changing the interior of that function's `assignment`
branch changes both doors at once, which is the ADR-010 parity property for
free.
```

### Full target shown text

```text
### 5.2 Two doors, one shared function

**Observed:** coding has two Work-attached doors:

- **Interactive:** `fgos-coding-driving` (prose loop) → stage skill → engine
  verb (`fgos discover` / `fgos plan` / `fgos return`). Secondary
  operations such as `validate-plan` reach `bin/fgos.mjs plan` →
  `chooseStageOperation` → `executeDriverOperationChoice` →
  `executeAssignment`. The Implement step calls
  `node src/runner/dispatch.mjs decide --work <id>`.
- **Headless:** `src/runner/loop.mjs` → `chooseStageOperation` →
  `executeDriverOperationChoice` for `dispatch: 'assignment'` choices, and
  `spawnWorker` (own worktree, own goal-check) for the executing-stage
  primary operation.

Both doors converge on `executeDriverOperationChoice`
(`src/runner/dispatch/operation-choice.mjs`). This is the single most useful
fact for Step 10: changing the interior of that function's `assignment`
branch changes both doors at once, which is the ADR-010 parity property for
free.
```

## claim_1a068bd05c93b8ebc329470679e3ba0c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-39, lines 355–355.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-42.
Source digest: 86b26db88c05d8d481be05366ab2c1d3274c3717f8d6175a77dddb59fcc1da77
Target digest: 86b26db88c05d8d481be05366ab2c1d3274c3717f8d6175a77dddb59fcc1da77
Shown source SHA256: 86b26db88c05d8d481be05366ab2c1d3274c3717f8d6175a77dddb59fcc1da77
Shown target SHA256: 86b26db88c05d8d481be05366ab2c1d3274c3717f8d6175a77dddb59fcc1da77

### Proposed decision

```json
{
  "claimId": "claim_1a068bd05c93b8ebc329470679e3ba0c",
  "sourceUnitDigest": "86b26db88c05d8d481be05366ab2c1d3274c3717f8d6175a77dddb59fcc1da77",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "86b26db88c05d8d481be05366ab2c1d3274c3717f8d6175a77dddb59fcc1da77",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.2 Two doors, one shared function"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-39 (lines 355–355) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-42 (lines 382–382); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Observed:** coding has two Work-attached doors:
```

### Full target shown text

```text
**Observed:** coding has two Work-attached doors:
```

## claim_c9d8fb82141dfb5149abdfe3c8f141cf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-40, lines 357–366.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-43.
Source digest: 295d037240f005500ed54e3631eb39920792b2b8d90456a3f1b70814c2d3447b
Target digest: 295d037240f005500ed54e3631eb39920792b2b8d90456a3f1b70814c2d3447b
Shown source SHA256: 295d037240f005500ed54e3631eb39920792b2b8d90456a3f1b70814c2d3447b
Shown target SHA256: 295d037240f005500ed54e3631eb39920792b2b8d90456a3f1b70814c2d3447b

### Proposed decision

```json
{
  "claimId": "claim_c9d8fb82141dfb5149abdfe3c8f141cf",
  "sourceUnitDigest": "295d037240f005500ed54e3631eb39920792b2b8d90456a3f1b70814c2d3447b",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "295d037240f005500ed54e3631eb39920792b2b8d90456a3f1b70814c2d3447b",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.2 Two doors, one shared function"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-40 (lines 357–366) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-43 (lines 384–393); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- **Interactive:** `fgos-coding-driving` (prose loop) → stage skill → engine
  verb (`fgos discover` / `fgos plan` / `fgos return`). Secondary
  operations such as `validate-plan` reach `bin/fgos.mjs plan` →
  `chooseStageOperation` → `executeDriverOperationChoice` →
  `executeAssignment`. The Implement step calls
  `node src/runner/dispatch.mjs decide --work <id>`.
- **Headless:** `src/runner/loop.mjs` → `chooseStageOperation` →
  `executeDriverOperationChoice` for `dispatch: 'assignment'` choices, and
  `spawnWorker` (own worktree, own goal-check) for the executing-stage
  primary operation.
```

### Full target shown text

```text
- **Interactive:** `fgos-coding-driving` (prose loop) → stage skill → engine
  verb (`fgos discover` / `fgos plan` / `fgos return`). Secondary
  operations such as `validate-plan` reach `bin/fgos.mjs plan` →
  `chooseStageOperation` → `executeDriverOperationChoice` →
  `executeAssignment`. The Implement step calls
  `node src/runner/dispatch.mjs decide --work <id>`.
- **Headless:** `src/runner/loop.mjs` → `chooseStageOperation` →
  `executeDriverOperationChoice` for `dispatch: 'assignment'` choices, and
  `spawnWorker` (own worktree, own goal-check) for the executing-stage
  primary operation.
```

## claim_e38c785efe34f5f968f9321b22c8d2be

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-41, lines 368–372.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-44.
Source digest: c651ef4468c5fac250cbe0f60223da417ad114cca682e5336d3be9623c09838e
Target digest: c651ef4468c5fac250cbe0f60223da417ad114cca682e5336d3be9623c09838e
Shown source SHA256: c651ef4468c5fac250cbe0f60223da417ad114cca682e5336d3be9623c09838e
Shown target SHA256: c651ef4468c5fac250cbe0f60223da417ad114cca682e5336d3be9623c09838e

### Proposed decision

```json
{
  "claimId": "claim_e38c785efe34f5f968f9321b22c8d2be",
  "sourceUnitDigest": "c651ef4468c5fac250cbe0f60223da417ad114cca682e5336d3be9623c09838e",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "c651ef4468c5fac250cbe0f60223da417ad114cca682e5336d3be9623c09838e",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.2 Two doors, one shared function"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-41 (lines 368–372) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-44 (lines 395–399); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Both doors converge on `executeDriverOperationChoice`
(`src/runner/dispatch/operation-choice.mjs`). This is the single most useful
fact for Step 10: changing the interior of that function's `assignment`
branch changes both doors at once, which is the ADR-010 parity property for
free.
```

### Full target shown text

```text
Both doors converge on `executeDriverOperationChoice`
(`src/runner/dispatch/operation-choice.mjs`). This is the single most useful
fact for Step 10: changing the interior of that function's `assignment`
branch changes both doors at once, which is the ADR-010 parity property for
free.
```

## claim_180f64f5f441ed16d70bbda2b633bad2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#53-session-engine-already-accepts-workref-nothing-uses-it, lines 374–374.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#53-session-engine-already-accepts-workref-nothing-uses-it.
Source digest: 435f524572520535469642f0f6e62ad653ce604c336ac5fcb99a96149b7f4f29
Target digest: 435f524572520535469642f0f6e62ad653ce604c336ac5fcb99a96149b7f4f29
Shown source SHA256: 71a6769c2c33f6167fdd2d4a7a06078d7c748cd54583044fc3eef5b716a1db66
Shown target SHA256: 71a6769c2c33f6167fdd2d4a7a06078d7c748cd54583044fc3eef5b716a1db66

### Proposed decision

```json
{
  "claimId": "claim_180f64f5f441ed16d70bbda2b633bad2",
  "sourceUnitDigest": "435f524572520535469642f0f6e62ad653ce604c336ac5fcb99a96149b7f4f29",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "53-session-engine-already-accepts-workref-nothing-uses-it",
  "targetUnitDigest": "435f524572520535469642f0f6e62ad653ce604c336ac5fcb99a96149b7f4f29",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#53-session-engine-already-accepts-workref-nothing-uses-it (lines 374–374) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#53-session-engine-already-accepts-workref-nothing-uses-it (lines 401–401); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 5.3 Session engine already accepts `workRef`, nothing uses it

**Observed:** both `openStandaloneSession` and
`openDeclaredProtocolSession` accept `workRef` (read-only, contract-approved).
No caller passes it. `createSessionAssignment` builds inline contracts only
and does not pass `work` into the build, so the ADR-007 harness never runs on
the session path. `buildReadOnlyContract` hard-codes `mutation: 'read-only'`
and restricts roles to `READ_ONLY_ROLES`. The ledger has no workspace/isolation
reference field yet (the contract permits one; P06 R7 adds the refusal).
```

### Full target shown text

```text
### 5.3 Session engine already accepts `workRef`, nothing uses it

**Observed:** both `openStandaloneSession` and
`openDeclaredProtocolSession` accept `workRef` (read-only, contract-approved).
No caller passes it. `createSessionAssignment` builds inline contracts only
and does not pass `work` into the build, so the ADR-007 harness never runs on
the session path. `buildReadOnlyContract` hard-codes `mutation: 'read-only'`
and restricts roles to `READ_ONLY_ROLES`. The ledger has no workspace/isolation
reference field yet (the contract permits one; P06 R7 adds the refusal).
```

## claim_5930e2ad303e3d38fdef8c03509d6e3b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-42, lines 376–382.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-45.
Source digest: bf5744df93a9a38b3795a9630969cf8a8b9b13564448f67640a25bd06d7587f0
Target digest: bf5744df93a9a38b3795a9630969cf8a8b9b13564448f67640a25bd06d7587f0
Shown source SHA256: bf5744df93a9a38b3795a9630969cf8a8b9b13564448f67640a25bd06d7587f0
Shown target SHA256: bf5744df93a9a38b3795a9630969cf8a8b9b13564448f67640a25bd06d7587f0

### Proposed decision

```json
{
  "claimId": "claim_5930e2ad303e3d38fdef8c03509d6e3b",
  "sourceUnitDigest": "bf5744df93a9a38b3795a9630969cf8a8b9b13564448f67640a25bd06d7587f0",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "bf5744df93a9a38b3795a9630969cf8a8b9b13564448f67640a25bd06d7587f0",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.3 Session engine already accepts `workRef`, nothing uses it"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-42 (lines 376–382) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-45 (lines 403–409); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Observed:** both `openStandaloneSession` and
`openDeclaredProtocolSession` accept `workRef` (read-only, contract-approved).
No caller passes it. `createSessionAssignment` builds inline contracts only
and does not pass `work` into the build, so the ADR-007 harness never runs on
the session path. `buildReadOnlyContract` hard-codes `mutation: 'read-only'`
and restricts roles to `READ_ONLY_ROLES`. The ledger has no workspace/isolation
reference field yet (the contract permits one; P06 R7 adds the refusal).
```

### Full target shown text

```text
**Observed:** both `openStandaloneSession` and
`openDeclaredProtocolSession` accept `workRef` (read-only, contract-approved).
No caller passes it. `createSessionAssignment` builds inline contracts only
and does not pass `work` into the build, so the ADR-007 harness never runs on
the session path. `buildReadOnlyContract` hard-codes `mutation: 'read-only'`
and restricts roles to `READ_ONLY_ROLES`. The ledger has no workspace/isolation
reference field yet (the contract permits one; P06 R7 adds the refusal).
```

## claim_8e634325e3e4006de76bc3af3c81b89d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#54-inventory-of-duplicate-mechanisms-the-tùm-lum-list-rul11, lines 384–384.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#54-inventory-of-duplicate-mechanisms-the-tùm-lum-list-rul11.
Source digest: 48c92255df013d07bdd1c0a6f41b9ee2d4fcf1de8a5aa900b57e4d7cae9acd51
Target digest: 48c92255df013d07bdd1c0a6f41b9ee2d4fcf1de8a5aa900b57e4d7cae9acd51
Shown source SHA256: cc5a0013a3c5a93ce2726200b4ad063cfd0c3fc8c49a6d49e61e8845174adc09
Shown target SHA256: cc5a0013a3c5a93ce2726200b4ad063cfd0c3fc8c49a6d49e61e8845174adc09

### Proposed decision

```json
{
  "claimId": "claim_8e634325e3e4006de76bc3af3c81b89d",
  "sourceUnitDigest": "48c92255df013d07bdd1c0a6f41b9ee2d4fcf1de8a5aa900b57e4d7cae9acd51",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "54-inventory-of-duplicate-mechanisms-the-tùm-lum-list-rul11",
  "targetUnitDigest": "48c92255df013d07bdd1c0a6f41b9ee2d4fcf1de8a5aa900b57e4d7cae9acd51",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#54-inventory-of-duplicate-mechanisms-the-tùm-lum-list-rul11 (lines 384–384) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#54-inventory-of-duplicate-mechanisms-the-tùm-lum-list-rul11 (lines 411–411); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 5.4 Inventory of duplicate mechanisms (the "tùm lum" list, RUL11)

**Observed:** the following pairs each implement one responsibility twice.
The Step 10 sequence in §9 is derived directly from this list.

| # | Responsibility | Mechanism A | Mechanism B | Note |
|---|---|---|---|---|
| D1 | Drive one Work item through its lifecycle | `fgos-coding-driving` SKILL.md (prose, interactive) | `src/runner/loop.mjs` (code, headless) | Two implementations of one loop; no test can catch drift between them. |
| D2 | Execute the executing-stage primary operation | `spawnWorker` + worktree + goal-check (`loop.mjs`) | Assignment path (`executeAssignment`) used by every secondary operation | `implement-item` produces no RunResult / evidence record on the headless path. |
| D3 | Enforce the role graph (edges, `callstackCap`) | `src/state/handoff.mjs` on Work events, plus skill-prose reclaim | CoordinationSession `topology.edges` / `maxRounds` (Step 08) | Same rule class, two enforcement points. |
| D4 | Concurrency ceiling | worker-slots / claim-port / main-checkout-lock | `aggregateBounds.maxConcurrency` (Step 08) | Neither knows about the other. |
| D5 | Fan-out | `fgos-fanout` (prose spawning Agents that run `/fgOS:pick`; known worktree-pin race) and `loop.mjs` batch dispatch | `dispatchResearchFanOut` (Step 08, session) | Child-Work fan-out and session fan-out are different things, but the prose orchestrator is the weakest of the three. |
| D6 | Coding evidence interpretation | `interpretAssignmentRunResult` inside `src/runner/dispatch/operation-choice.mjs` (2260 lines; diff refs, verify refs, scoped-subtask undeclared-file rules) | Group Cognition synthesis evidence rules (`session-engine.mjs`) | Coding-specific evidence policy lives under a foundation directory. |
| D7 | Coding git core placement | `src/runner/{worktree,merge,iron-law-gate}.mjs`, `src/verbs/merge/*`, `src/state/{graph-harness,cleanup-harness,drift-status}.mjs` | — | One component scattered across three trees; advisory §18.5 names it Coding Repository Integration Core. |
| D8 | Collaboration record | `fgos handoff` → role/holder Work events | session `actor-bound` / `assignment-created` events | Must not become two copies of one truth. |
```

### Full target shown text

```text
### 5.4 Inventory of duplicate mechanisms (the "tùm lum" list, RUL11)

**Observed:** the following pairs each implement one responsibility twice.
The Step 10 sequence in §9 is derived directly from this list.

| # | Responsibility | Mechanism A | Mechanism B | Note |
|---|---|---|---|---|
| D1 | Drive one Work item through its lifecycle | `fgos-coding-driving` SKILL.md (prose, interactive) | `src/runner/loop.mjs` (code, headless) | Two implementations of one loop; no test can catch drift between them. |
| D2 | Execute the executing-stage primary operation | `spawnWorker` + worktree + goal-check (`loop.mjs`) | Assignment path (`executeAssignment`) used by every secondary operation | `implement-item` produces no RunResult / evidence record on the headless path. |
| D3 | Enforce the role graph (edges, `callstackCap`) | `src/state/handoff.mjs` on Work events, plus skill-prose reclaim | CoordinationSession `topology.edges` / `maxRounds` (Step 08) | Same rule class, two enforcement points. |
| D4 | Concurrency ceiling | worker-slots / claim-port / main-checkout-lock | `aggregateBounds.maxConcurrency` (Step 08) | Neither knows about the other. |
| D5 | Fan-out | `fgos-fanout` (prose spawning Agents that run `/fgOS:pick`; known worktree-pin race) and `loop.mjs` batch dispatch | `dispatchResearchFanOut` (Step 08, session) | Child-Work fan-out and session fan-out are different things, but the prose orchestrator is the weakest of the three. |
| D6 | Coding evidence interpretation | `interpretAssignmentRunResult` inside `src/runner/dispatch/operation-choice.mjs` (2260 lines; diff refs, verify refs, scoped-subtask undeclared-file rules) | Group Cognition synthesis evidence rules (`session-engine.mjs`) | Coding-specific evidence policy lives under a foundation directory. |
| D7 | Coding git core placement | `src/runner/{worktree,merge,iron-law-gate}.mjs`, `src/verbs/merge/*`, `src/state/{graph-harness,cleanup-harness,drift-status}.mjs` | — | One component scattered across three trees; advisory §18.5 names it Coding Repository Integration Core. |
| D8 | Collaboration record | `fgos handoff` → role/holder Work events | session `actor-bound` / `assignment-created` events | Must not become two copies of one truth. |
```

## claim_8a76505b070d5e8a3753d12031703976

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-43, lines 386–387.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-46.
Source digest: 7445c834bcfb70ea52934efdd56e62a3073f34ac8f18c78395ad083a15bf7c07
Target digest: 7445c834bcfb70ea52934efdd56e62a3073f34ac8f18c78395ad083a15bf7c07
Shown source SHA256: 7445c834bcfb70ea52934efdd56e62a3073f34ac8f18c78395ad083a15bf7c07
Shown target SHA256: 7445c834bcfb70ea52934efdd56e62a3073f34ac8f18c78395ad083a15bf7c07

### Proposed decision

```json
{
  "claimId": "claim_8a76505b070d5e8a3753d12031703976",
  "sourceUnitDigest": "7445c834bcfb70ea52934efdd56e62a3073f34ac8f18c78395ad083a15bf7c07",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "7445c834bcfb70ea52934efdd56e62a3073f34ac8f18c78395ad083a15bf7c07",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.4 Inventory of duplicate mechanisms (the \"tùm lum\" list, RUL11)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-43 (lines 386–387) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-46 (lines 413–414); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Observed:** the following pairs each implement one responsibility twice.
The Step 10 sequence in §9 is derived directly from this list.
```

### Full target shown text

```text
**Observed:** the following pairs each implement one responsibility twice.
The Step 10 sequence in §9 is derived directly from this list.
```

## claim_873df97aa3b6ce083e29153828f83d14

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-44, lines 389–398.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-47.
Source digest: 7c88956431e4ca2c393f9d5c45cbb3048d69c2caeee0066ac3a0368a9ed9ac1e
Target digest: 7c88956431e4ca2c393f9d5c45cbb3048d69c2caeee0066ac3a0368a9ed9ac1e
Shown source SHA256: 7c88956431e4ca2c393f9d5c45cbb3048d69c2caeee0066ac3a0368a9ed9ac1e
Shown target SHA256: 7c88956431e4ca2c393f9d5c45cbb3048d69c2caeee0066ac3a0368a9ed9ac1e

### Proposed decision

```json
{
  "claimId": "claim_873df97aa3b6ce083e29153828f83d14",
  "sourceUnitDigest": "7c88956431e4ca2c393f9d5c45cbb3048d69c2caeee0066ac3a0368a9ed9ac1e",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "7c88956431e4ca2c393f9d5c45cbb3048d69c2caeee0066ac3a0368a9ed9ac1e",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.4 Inventory of duplicate mechanisms (the \"tùm lum\" list, RUL11)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-44 (lines 389–398) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-47 (lines 416–425); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| # | Responsibility | Mechanism A | Mechanism B | Note |
|---|---|---|---|---|
| D1 | Drive one Work item through its lifecycle | `fgos-coding-driving` SKILL.md (prose, interactive) | `src/runner/loop.mjs` (code, headless) | Two implementations of one loop; no test can catch drift between them. |
| D2 | Execute the executing-stage primary operation | `spawnWorker` + worktree + goal-check (`loop.mjs`) | Assignment path (`executeAssignment`) used by every secondary operation | `implement-item` produces no RunResult / evidence record on the headless path. |
| D3 | Enforce the role graph (edges, `callstackCap`) | `src/state/handoff.mjs` on Work events, plus skill-prose reclaim | CoordinationSession `topology.edges` / `maxRounds` (Step 08) | Same rule class, two enforcement points. |
| D4 | Concurrency ceiling | worker-slots / claim-port / main-checkout-lock | `aggregateBounds.maxConcurrency` (Step 08) | Neither knows about the other. |
| D5 | Fan-out | `fgos-fanout` (prose spawning Agents that run `/fgOS:pick`; known worktree-pin race) and `loop.mjs` batch dispatch | `dispatchResearchFanOut` (Step 08, session) | Child-Work fan-out and session fan-out are different things, but the prose orchestrator is the weakest of the three. |
| D6 | Coding evidence interpretation | `interpretAssignmentRunResult` inside `src/runner/dispatch/operation-choice.mjs` (2260 lines; diff refs, verify refs, scoped-subtask undeclared-file rules) | Group Cognition synthesis evidence rules (`session-engine.mjs`) | Coding-specific evidence policy lives under a foundation directory. |
| D7 | Coding git core placement | `src/runner/{worktree,merge,iron-law-gate}.mjs`, `src/verbs/merge/*`, `src/state/{graph-harness,cleanup-harness,drift-status}.mjs` | — | One component scattered across three trees; advisory §18.5 names it Coding Repository Integration Core. |
| D8 | Collaboration record | `fgos handoff` → role/holder Work events | session `actor-bound` / `assignment-created` events | Must not become two copies of one truth. |
```

### Full target shown text

```text
| # | Responsibility | Mechanism A | Mechanism B | Note |
|---|---|---|---|---|
| D1 | Drive one Work item through its lifecycle | `fgos-coding-driving` SKILL.md (prose, interactive) | `src/runner/loop.mjs` (code, headless) | Two implementations of one loop; no test can catch drift between them. |
| D2 | Execute the executing-stage primary operation | `spawnWorker` + worktree + goal-check (`loop.mjs`) | Assignment path (`executeAssignment`) used by every secondary operation | `implement-item` produces no RunResult / evidence record on the headless path. |
| D3 | Enforce the role graph (edges, `callstackCap`) | `src/state/handoff.mjs` on Work events, plus skill-prose reclaim | CoordinationSession `topology.edges` / `maxRounds` (Step 08) | Same rule class, two enforcement points. |
| D4 | Concurrency ceiling | worker-slots / claim-port / main-checkout-lock | `aggregateBounds.maxConcurrency` (Step 08) | Neither knows about the other. |
| D5 | Fan-out | `fgos-fanout` (prose spawning Agents that run `/fgOS:pick`; known worktree-pin race) and `loop.mjs` batch dispatch | `dispatchResearchFanOut` (Step 08, session) | Child-Work fan-out and session fan-out are different things, but the prose orchestrator is the weakest of the three. |
| D6 | Coding evidence interpretation | `interpretAssignmentRunResult` inside `src/runner/dispatch/operation-choice.mjs` (2260 lines; diff refs, verify refs, scoped-subtask undeclared-file rules) | Group Cognition synthesis evidence rules (`session-engine.mjs`) | Coding-specific evidence policy lives under a foundation directory. |
| D7 | Coding git core placement | `src/runner/{worktree,merge,iron-law-gate}.mjs`, `src/verbs/merge/*`, `src/state/{graph-harness,cleanup-harness,drift-status}.mjs` | — | One component scattered across three trees; advisory §18.5 names it Coding Repository Integration Core. |
| D8 | Collaboration record | `fgos handoff` → role/holder Work events | session `actor-bound` / `assignment-created` events | Must not become two copies of one truth. |
```

## claim_b68ded6cfa3fb454ad7667cc4aeae18d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#55-foundation-vs-coding-classification-debt, lines 400–400.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#55-foundation-vs-coding-classification-debt.
Source digest: 3d25683772079ca26b4a5efa12f9ecd33183d35ef4d294486972fff72cc24219
Target digest: 3d25683772079ca26b4a5efa12f9ecd33183d35ef4d294486972fff72cc24219
Shown source SHA256: a42b042efae8f492cf66e99b90cfe3be53a1dd6eef7f43d4ef2a5e794f687f6f
Shown target SHA256: a42b042efae8f492cf66e99b90cfe3be53a1dd6eef7f43d4ef2a5e794f687f6f

### Proposed decision

```json
{
  "claimId": "claim_b68ded6cfa3fb454ad7667cc4aeae18d",
  "sourceUnitDigest": "3d25683772079ca26b4a5efa12f9ecd33183d35ef4d294486972fff72cc24219",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "55-foundation-vs-coding-classification-debt",
  "targetUnitDigest": "3d25683772079ca26b4a5efa12f9ecd33183d35ef4d294486972fff72cc24219",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#55-foundation-vs-coding-classification-debt (lines 400–400) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#55-foundation-vs-coding-classification-debt (lines 427–427); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 5.5 Foundation-vs-coding classification debt

**Observed:** advisory §18 identifies several current code clusters that are
used heavily by coding-domain workflows and therefore *look* coding-specific,
but are actually broader platform or foundation machinery. Step 10 must not
start by moving all of them under Coding Domain merely because coding is the
first serious consumer.

| # | Current cluster | Candidate owner | Why it matters for Step 10 |
|---|---|---|---|
| F1 | Work State And Event Store Kernel (`src/state/events.mjs`, replay/store/registry) | Platform core / Work Lifecycle substrate | Event-store/log/replay is the truth substrate for many components, not coding-domain behavior. Coding consumes it through Work and evidence records. |
| F2 | Claim And Runtime Occupancy Coordination (`claim-port`, `runtime-coordination`, `worker-slots`, main-checkout lock) | Shared runtime occupancy / Work Driver support | Coding uses it for worktrees and runner pressure today, but other Work-backed domains also need claim/occupancy semantics. |
| F3 | Work Driver And Automation Engine (`loop`, `operation-choice`, stage pool selectors, recovery/anti-loop) | Work Driver / Domain Workflow Interpreter | It chooses ready work and legal operations; coding supplies workflow declarations, but the automation driver should not become Coding Domain Core or CoordinationSession progress. |
| F4 | Coding Repository Integration Core (`worktree`, `merge`, drift, cleanup, iron-law gate, repo adapters) | Coding Domain Core | This one really is coding-specific: branch/worktree/merge/technical approval must not leak into generic Work Lifecycle. |
| F5 | Setup, Doctor, And Distribution Health | Platform support infrastructure | New domains, protocols, binaries, and config defaults must register with setup/doctor instead of creating hidden prerequisites. |
| F6 | Gateway And External Interface Control Plane | Host And Surface Layer | Gateway/REST/MCP/Herdr expose surfaces and process control; they are not lifecycle, coordination, or coding truth. |
| F7 | Knowledge, Learning, And Documentation Registry | Platform learning/documentation component | Coding currently drives much of retrospective learning, but the registry and indexing model are reusable across domains. |

**Proposed rule:** Step 1 classifies by authority and reason-to-change before
any physical move. Current paths under `src/runner`, `src/state`, or `src/verbs`
are implementation history, not ownership. A cluster becomes Coding Domain only
when its model depends on repository/code-change semantics; event logs,
runtime occupancy, setup/doctor, host surfaces, and learning registries are
 platform-core, platform-support, or host-surface components even if coding is
 the first heavy user. The Component Authority Boundary Map separates
 **platform layer** (`platform-core`, `platform-support`, `domain`,
 `host-surface`) from
 **component category** (`foundation-engine`, `integration-engine`,
 `support-infrastructure`, `domain-component`, `adapter/surface`) so
 "foundation" does not become a vague synonym for "not coding-specific."
```

### Full target shown text

```text
### 5.5 Foundation-vs-coding classification debt

**Observed:** advisory §18 identifies several current code clusters that are
used heavily by coding-domain workflows and therefore *look* coding-specific,
but are actually broader platform or foundation machinery. Step 10 must not
start by moving all of them under Coding Domain merely because coding is the
first serious consumer.

| # | Current cluster | Candidate owner | Why it matters for Step 10 |
|---|---|---|---|
| F1 | Work State And Event Store Kernel (`src/state/events.mjs`, replay/store/registry) | Platform core / Work Lifecycle substrate | Event-store/log/replay is the truth substrate for many components, not coding-domain behavior. Coding consumes it through Work and evidence records. |
| F2 | Claim And Runtime Occupancy Coordination (`claim-port`, `runtime-coordination`, `worker-slots`, main-checkout lock) | Shared runtime occupancy / Work Driver support | Coding uses it for worktrees and runner pressure today, but other Work-backed domains also need claim/occupancy semantics. |
| F3 | Work Driver And Automation Engine (`loop`, `operation-choice`, stage pool selectors, recovery/anti-loop) | Work Driver / Domain Workflow Interpreter | It chooses ready work and legal operations; coding supplies workflow declarations, but the automation driver should not become Coding Domain Core or CoordinationSession progress. |
| F4 | Coding Repository Integration Core (`worktree`, `merge`, drift, cleanup, iron-law gate, repo adapters) | Coding Domain Core | This one really is coding-specific: branch/worktree/merge/technical approval must not leak into generic Work Lifecycle. |
| F5 | Setup, Doctor, And Distribution Health | Platform support infrastructure | New domains, protocols, binaries, and config defaults must register with setup/doctor instead of creating hidden prerequisites. |
| F6 | Gateway And External Interface Control Plane | Host And Surface Layer | Gateway/REST/MCP/Herdr expose surfaces and process control; they are not lifecycle, coordination, or coding truth. |
| F7 | Knowledge, Learning, And Documentation Registry | Platform learning/documentation component | Coding currently drives much of retrospective learning, but the registry and indexing model are reusable across domains. |

**Proposed rule:** Step 1 classifies by authority and reason-to-change before
any physical move. Current paths under `src/runner`, `src/state`, or `src/verbs`
are implementation history, not ownership. A cluster becomes Coding Domain only
when its model depends on repository/code-change semantics; event logs,
runtime occupancy, setup/doctor, host surfaces, and learning registries are
 platform-core, platform-support, or host-surface components even if coding is
 the first heavy user. The Component Authority Boundary Map separates
 **platform layer** (`platform-core`, `platform-support`, `domain`,
 `host-surface`) from
 **component category** (`foundation-engine`, `integration-engine`,
 `support-infrastructure`, `domain-component`, `adapter/surface`) so
 "foundation" does not become a vague synonym for "not coding-specific."
```

## claim_fd460b555f1fe11c7019b6732fe2f9eb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-45, lines 402–406.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-48.
Source digest: e6a1e98a416c9d69a99eb27d0c298cc081a051f8e68e44f03aa22ab71fbb1227
Target digest: e6a1e98a416c9d69a99eb27d0c298cc081a051f8e68e44f03aa22ab71fbb1227
Shown source SHA256: e6a1e98a416c9d69a99eb27d0c298cc081a051f8e68e44f03aa22ab71fbb1227
Shown target SHA256: e6a1e98a416c9d69a99eb27d0c298cc081a051f8e68e44f03aa22ab71fbb1227

### Proposed decision

```json
{
  "claimId": "claim_fd460b555f1fe11c7019b6732fe2f9eb",
  "sourceUnitDigest": "e6a1e98a416c9d69a99eb27d0c298cc081a051f8e68e44f03aa22ab71fbb1227",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "e6a1e98a416c9d69a99eb27d0c298cc081a051f8e68e44f03aa22ab71fbb1227",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.5 Foundation-vs-coding classification debt"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-45 (lines 402–406) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-48 (lines 429–433); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Observed:** advisory §18 identifies several current code clusters that are
used heavily by coding-domain workflows and therefore *look* coding-specific,
but are actually broader platform or foundation machinery. Step 10 must not
start by moving all of them under Coding Domain merely because coding is the
first serious consumer.
```

### Full target shown text

```text
**Observed:** advisory §18 identifies several current code clusters that are
used heavily by coding-domain workflows and therefore *look* coding-specific,
but are actually broader platform or foundation machinery. Step 10 must not
start by moving all of them under Coding Domain merely because coding is the
first serious consumer.
```

## claim_8c17f892965517a5c1591899e36462b9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-46, lines 408–416.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-49.
Source digest: 916df59012ce54b31b41a285c4341443de4153ac19009f53801819046981b985
Target digest: 916df59012ce54b31b41a285c4341443de4153ac19009f53801819046981b985
Shown source SHA256: 916df59012ce54b31b41a285c4341443de4153ac19009f53801819046981b985
Shown target SHA256: 916df59012ce54b31b41a285c4341443de4153ac19009f53801819046981b985

### Proposed decision

```json
{
  "claimId": "claim_8c17f892965517a5c1591899e36462b9",
  "sourceUnitDigest": "916df59012ce54b31b41a285c4341443de4153ac19009f53801819046981b985",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "916df59012ce54b31b41a285c4341443de4153ac19009f53801819046981b985",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.5 Foundation-vs-coding classification debt"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-46 (lines 408–416) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-49 (lines 435–443); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| # | Current cluster | Candidate owner | Why it matters for Step 10 |
|---|---|---|---|
| F1 | Work State And Event Store Kernel (`src/state/events.mjs`, replay/store/registry) | Platform core / Work Lifecycle substrate | Event-store/log/replay is the truth substrate for many components, not coding-domain behavior. Coding consumes it through Work and evidence records. |
| F2 | Claim And Runtime Occupancy Coordination (`claim-port`, `runtime-coordination`, `worker-slots`, main-checkout lock) | Shared runtime occupancy / Work Driver support | Coding uses it for worktrees and runner pressure today, but other Work-backed domains also need claim/occupancy semantics. |
| F3 | Work Driver And Automation Engine (`loop`, `operation-choice`, stage pool selectors, recovery/anti-loop) | Work Driver / Domain Workflow Interpreter | It chooses ready work and legal operations; coding supplies workflow declarations, but the automation driver should not become Coding Domain Core or CoordinationSession progress. |
| F4 | Coding Repository Integration Core (`worktree`, `merge`, drift, cleanup, iron-law gate, repo adapters) | Coding Domain Core | This one really is coding-specific: branch/worktree/merge/technical approval must not leak into generic Work Lifecycle. |
| F5 | Setup, Doctor, And Distribution Health | Platform support infrastructure | New domains, protocols, binaries, and config defaults must register with setup/doctor instead of creating hidden prerequisites. |
| F6 | Gateway And External Interface Control Plane | Host And Surface Layer | Gateway/REST/MCP/Herdr expose surfaces and process control; they are not lifecycle, coordination, or coding truth. |
| F7 | Knowledge, Learning, And Documentation Registry | Platform learning/documentation component | Coding currently drives much of retrospective learning, but the registry and indexing model are reusable across domains. |
```

### Full target shown text

```text
| # | Current cluster | Candidate owner | Why it matters for Step 10 |
|---|---|---|---|
| F1 | Work State And Event Store Kernel (`src/state/events.mjs`, replay/store/registry) | Platform core / Work Lifecycle substrate | Event-store/log/replay is the truth substrate for many components, not coding-domain behavior. Coding consumes it through Work and evidence records. |
| F2 | Claim And Runtime Occupancy Coordination (`claim-port`, `runtime-coordination`, `worker-slots`, main-checkout lock) | Shared runtime occupancy / Work Driver support | Coding uses it for worktrees and runner pressure today, but other Work-backed domains also need claim/occupancy semantics. |
| F3 | Work Driver And Automation Engine (`loop`, `operation-choice`, stage pool selectors, recovery/anti-loop) | Work Driver / Domain Workflow Interpreter | It chooses ready work and legal operations; coding supplies workflow declarations, but the automation driver should not become Coding Domain Core or CoordinationSession progress. |
| F4 | Coding Repository Integration Core (`worktree`, `merge`, drift, cleanup, iron-law gate, repo adapters) | Coding Domain Core | This one really is coding-specific: branch/worktree/merge/technical approval must not leak into generic Work Lifecycle. |
| F5 | Setup, Doctor, And Distribution Health | Platform support infrastructure | New domains, protocols, binaries, and config defaults must register with setup/doctor instead of creating hidden prerequisites. |
| F6 | Gateway And External Interface Control Plane | Host And Surface Layer | Gateway/REST/MCP/Herdr expose surfaces and process control; they are not lifecycle, coordination, or coding truth. |
| F7 | Knowledge, Learning, And Documentation Registry | Platform learning/documentation component | Coding currently drives much of retrospective learning, but the registry and indexing model are reusable across domains. |
```

## claim_73fd6f25c65c606f74ada3f1bd642f5e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-47, lines 418–429.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-50.
Source digest: 8eb824679581a8ee8541a5be7bf3fa235be954aeb8e82627017359a7346f397c
Target digest: 8eb824679581a8ee8541a5be7bf3fa235be954aeb8e82627017359a7346f397c
Shown source SHA256: 8eb824679581a8ee8541a5be7bf3fa235be954aeb8e82627017359a7346f397c
Shown target SHA256: 8eb824679581a8ee8541a5be7bf3fa235be954aeb8e82627017359a7346f397c

### Proposed decision

```json
{
  "claimId": "claim_73fd6f25c65c606f74ada3f1bd642f5e",
  "sourceUnitDigest": "8eb824679581a8ee8541a5be7bf3fa235be954aeb8e82627017359a7346f397c",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "8eb824679581a8ee8541a5be7bf3fa235be954aeb8e82627017359a7346f397c",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "5. Current Coding-Domain Reality",
    "5.5 Foundation-vs-coding classification debt"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-47 (lines 418–429) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-50 (lines 445–456); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Proposed rule:** Step 1 classifies by authority and reason-to-change before
any physical move. Current paths under `src/runner`, `src/state`, or `src/verbs`
are implementation history, not ownership. A cluster becomes Coding Domain only
when its model depends on repository/code-change semantics; event logs,
runtime occupancy, setup/doctor, host surfaces, and learning registries are
 platform-core, platform-support, or host-surface components even if coding is
 the first heavy user. The Component Authority Boundary Map separates
 **platform layer** (`platform-core`, `platform-support`, `domain`,
 `host-surface`) from
 **component category** (`foundation-engine`, `integration-engine`,
 `support-infrastructure`, `domain-component`, `adapter/surface`) so
 "foundation" does not become a vague synonym for "not coding-specific."
```

### Full target shown text

```text
**Proposed rule:** Step 1 classifies by authority and reason-to-change before
any physical move. Current paths under `src/runner`, `src/state`, or `src/verbs`
are implementation history, not ownership. A cluster becomes Coding Domain only
when its model depends on repository/code-change semantics; event logs,
runtime occupancy, setup/doctor, host surfaces, and learning registries are
 platform-core, platform-support, or host-surface components even if coding is
 the first heavy user. The Component Authority Boundary Map separates
 **platform layer** (`platform-core`, `platform-support`, `domain`,
 `host-surface`) from
 **component category** (`foundation-engine`, `integration-engine`,
 `support-infrastructure`, `domain-component`, `adapter/surface`) so
 "foundation" does not become a vague synonym for "not coding-specific."
```

## claim_abda1a178e353cb46d7c04e6cb1764f2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#6-architectural-stance, lines 431–431.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#6-architectural-stance.
Source digest: 8d899dcb6197e7b01f3fc9bbfcaa1eb3888f4458d884a4f9d8506ba51ede608c
Target digest: 6c4d67aae25eab8f5ed3615c12f5c9e6443c3294823a26d1502a75677253293c
Shown source SHA256: eb7f3f665a7681f489548460cf0b597b659d394a356ec4cf01369ef1ad263c50
Shown target SHA256: 1258c542f507af592bdda78ba7de7cfa47a52d170c228d5796e006c107e9387c

### Proposed decision

```json
{
  "claimId": "claim_abda1a178e353cb46d7c04e6cb1764f2",
  "sourceUnitDigest": "8d899dcb6197e7b01f3fc9bbfcaa1eb3888f4458d884a4f9d8506ba51ede608c",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "6-architectural-stance",
  "targetUnitDigest": "6c4d67aae25eab8f5ed3615c12f5c9e6443c3294823a26d1502a75677253293c",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#6-architectural-stance (lines 431–431) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#6-architectural-stance (lines 458–458); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 6. Architectural Stance

**Proposed:** coding does not "migrate onto" Agent Coordination. Coding is a
domain component that *consumes* four platform engines
([advisory §10](../component-boundary/component-boundary-advisory.md)):

- Work Lifecycle Engine owns Work identity, status/stage, claim/return, human
  gates, and Work verbs (ADR-001).
- Agent Coordination Engine owns CoordinationSession, Assignment membership,
  topology, cohort, budgets, recovery, and synthesis inputs (ADR-008).
- Dispatch And Execution Engine owns executor/provider/model/tier/mechanism
  under governance (dispatch-control-plane).
- Run Result Evaluator owns confidence over one Assignment Run. Coding supplies
  evidence adapters and policy inputs; it does not compute final confidence
  outside that evaluator.

Coding keeps: repo scope and footprint, worktree/branch/isolation policy,
merge and catch-up, technical approval, code verification doctrine, and
coding evidence policy (Coding Repository Integration Core).

```txt
Work driver / Workflow interpreter (one engine, two doors — see §9 step 7)
  └─ selects a legal declared Stage Operation
       (domains/coding/workflows/feature.yaml remains the hard constraint)
       ├─ primary operation      → stage skill / implementer actor
       └─ collaboration operation
            ├─ opens Work-attached CoordinationSession
            │    workRef = <id>  (read-only context, never authority)
            │    actors/topology/bounds only
            ├─ asks Assignment Builder to freeze the declared operation
            │    work + stage + operation + TaskSpec provenance
            ├─ coding harness enriches/rejects before dispatch
            │    scope, evidence policy, footprint/isolation advice,
            │    opaque workspaceRef when mutation is later allowed
            ├─ Assignment → DispatchPlan → Run → RunResult     ← same core
            ├─ Run Result Evaluator applies generic + coding evidence inputs
            └─ session outcome = non-driving evidence (ADR-007 §3)
                 → driver chooses the next existing Work verb
```

Three consequences:

1. **Workflow stays the coding runtime authority.** FlowDefinition remains a
   read-only projection shared with CoordinationProtocol for validation. A
   Workflow-runtime migration is reconsidered only when a second domain
   needs something the Workflow model cannot express. This is the direct
   application of product priority #1 (AGENTS.md, D-ADR0030): do not spend
   fgOS-internal refactor effort that does not make a consuming project ship
   faster.
2. **Coding's consult / review / research / validate / scout operations become
   sessions, but declared operation construction stays outside the session
   engine.** The Work driver chooses the legal operation; the Assignment
   Builder freezes it; the session ledger records membership/topology/bounds.
3. **`scoped-subtask` is AdhocTask-lite.** A helper runs inside the session
   with its own Assignment, no Work id, no new persisted entity (V-011).
   AdhocTask proper is reconsidered only if session + Assignment refs prove
   insufficient — the same deferral logic already applied to AgentMessage
   (Step 08 human decision 5).
````

### Full target shown text

````text
## 6. Architectural Stance

**Proposed:** coding does not "migrate onto" Agent Coordination. Coding is a
domain component that *consumes* four platform engines
([advisory §10](../../architect/component-boundary/component-boundary-advisory.md)):

- Work Lifecycle Engine owns Work identity, status/stage, claim/return, human
  gates, and Work verbs (ADR-001).
- Agent Coordination Engine owns CoordinationSession, Assignment membership,
  topology, cohort, budgets, recovery, and synthesis inputs (ADR-008).
- Dispatch And Execution Engine owns executor/provider/model/tier/mechanism
  under governance (dispatch-control-plane).
- Run Result Evaluator owns confidence over one Assignment Run. Coding supplies
  evidence adapters and policy inputs; it does not compute final confidence
  outside that evaluator.

Coding keeps: repo scope and footprint, worktree/branch/isolation policy,
merge and catch-up, technical approval, code verification doctrine, and
coding evidence policy (Coding Repository Integration Core).

```txt
Work driver / Workflow interpreter (one engine, two doors — see §9 step 7)
  └─ selects a legal declared Stage Operation
       (domains/coding/workflows/feature.yaml remains the hard constraint)
       ├─ primary operation      → stage skill / implementer actor
       └─ collaboration operation
            ├─ opens Work-attached CoordinationSession
            │    workRef = <id>  (read-only context, never authority)
            │    actors/topology/bounds only
            ├─ asks Assignment Builder to freeze the declared operation
            │    work + stage + operation + TaskSpec provenance
            ├─ coding harness enriches/rejects before dispatch
            │    scope, evidence policy, footprint/isolation advice,
            │    opaque workspaceRef when mutation is later allowed
            ├─ Assignment → DispatchPlan → Run → RunResult     ← same core
            ├─ Run Result Evaluator applies generic + coding evidence inputs
            └─ session outcome = non-driving evidence (ADR-007 §3)
                 → driver chooses the next existing Work verb
```

Three consequences:

1. **Workflow stays the coding runtime authority.** FlowDefinition remains a
   read-only projection shared with CoordinationProtocol for validation. A
   Workflow-runtime migration is reconsidered only when a second domain
   needs something the Workflow model cannot express. This is the direct
   application of product priority #1 (AGENTS.md, D-ADR0030): do not spend
   fgOS-internal refactor effort that does not make a consuming project ship
   faster.
2. **Coding's consult / review / research / validate / scout operations become
   sessions, but declared operation construction stays outside the session
   engine.** The Work driver chooses the legal operation; the Assignment
   Builder freezes it; the session ledger records membership/topology/bounds.
3. **`scoped-subtask` is AdhocTask-lite.** A helper runs inside the session
   with its own Assignment, no Work id, no new persisted entity (V-011).
   AdhocTask proper is reconsidered only if session + Assignment refs prove
   insufficient — the same deferral logic already applied to AgentMessage
   (Step 08 human decision 5).
````

## claim_c549231db06f3511d15fc9534421715c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-48, lines 433–435.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-51.
Source digest: 7f3f466b90a840dca036e0e414a58f38e02a326e1230e2409cfc827350a6b017
Target digest: ff4e419713858a3e2ae05d04d1beb07ecd9aaa12d0578fdc89aeb5f38eb0a188
Shown source SHA256: 7f3f466b90a840dca036e0e414a58f38e02a326e1230e2409cfc827350a6b017
Shown target SHA256: ff4e419713858a3e2ae05d04d1beb07ecd9aaa12d0578fdc89aeb5f38eb0a188

### Proposed decision

```json
{
  "claimId": "claim_c549231db06f3511d15fc9534421715c",
  "sourceUnitDigest": "7f3f466b90a840dca036e0e414a58f38e02a326e1230e2409cfc827350a6b017",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "ff4e419713858a3e2ae05d04d1beb07ecd9aaa12d0578fdc89aeb5f38eb0a188",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "6. Architectural Stance"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-48 (lines 433–435) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-51 (lines 460–462); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Proposed:** coding does not "migrate onto" Agent Coordination. Coding is a
domain component that *consumes* four platform engines
([advisory §10](../component-boundary/component-boundary-advisory.md)):
```

### Full target shown text

```text
**Proposed:** coding does not "migrate onto" Agent Coordination. Coding is a
domain component that *consumes* four platform engines
([advisory §10](../../architect/component-boundary/component-boundary-advisory.md)):
```

## claim_0bc395532fcfa75036424f99375762e5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-49, lines 437–445.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-52.
Source digest: f444e2f4610ce3eca7adf7aa5b145a37abe592129fcb693bdc185438a7b3c1f7
Target digest: f444e2f4610ce3eca7adf7aa5b145a37abe592129fcb693bdc185438a7b3c1f7
Shown source SHA256: f444e2f4610ce3eca7adf7aa5b145a37abe592129fcb693bdc185438a7b3c1f7
Shown target SHA256: f444e2f4610ce3eca7adf7aa5b145a37abe592129fcb693bdc185438a7b3c1f7

### Proposed decision

```json
{
  "claimId": "claim_0bc395532fcfa75036424f99375762e5",
  "sourceUnitDigest": "f444e2f4610ce3eca7adf7aa5b145a37abe592129fcb693bdc185438a7b3c1f7",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "f444e2f4610ce3eca7adf7aa5b145a37abe592129fcb693bdc185438a7b3c1f7",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "6. Architectural Stance"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-49 (lines 437–445) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-52 (lines 464–472); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Work Lifecycle Engine owns Work identity, status/stage, claim/return, human
  gates, and Work verbs (ADR-001).
- Agent Coordination Engine owns CoordinationSession, Assignment membership,
  topology, cohort, budgets, recovery, and synthesis inputs (ADR-008).
- Dispatch And Execution Engine owns executor/provider/model/tier/mechanism
  under governance (dispatch-control-plane).
- Run Result Evaluator owns confidence over one Assignment Run. Coding supplies
  evidence adapters and policy inputs; it does not compute final confidence
  outside that evaluator.
```

### Full target shown text

```text
- Work Lifecycle Engine owns Work identity, status/stage, claim/return, human
  gates, and Work verbs (ADR-001).
- Agent Coordination Engine owns CoordinationSession, Assignment membership,
  topology, cohort, budgets, recovery, and synthesis inputs (ADR-008).
- Dispatch And Execution Engine owns executor/provider/model/tier/mechanism
  under governance (dispatch-control-plane).
- Run Result Evaluator owns confidence over one Assignment Run. Coding supplies
  evidence adapters and policy inputs; it does not compute final confidence
  outside that evaluator.
```

## claim_f1f60397706f3880628d060926d13d12

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-50, lines 447–449.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-53.
Source digest: 7fb45c9349606c18dcf6cc7fa4a263c8dfce2c336b0f181e1a4d13181b0dd0f0
Target digest: 7fb45c9349606c18dcf6cc7fa4a263c8dfce2c336b0f181e1a4d13181b0dd0f0
Shown source SHA256: 7fb45c9349606c18dcf6cc7fa4a263c8dfce2c336b0f181e1a4d13181b0dd0f0
Shown target SHA256: 7fb45c9349606c18dcf6cc7fa4a263c8dfce2c336b0f181e1a4d13181b0dd0f0

### Proposed decision

```json
{
  "claimId": "claim_f1f60397706f3880628d060926d13d12",
  "sourceUnitDigest": "7fb45c9349606c18dcf6cc7fa4a263c8dfce2c336b0f181e1a4d13181b0dd0f0",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "7fb45c9349606c18dcf6cc7fa4a263c8dfce2c336b0f181e1a4d13181b0dd0f0",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "6. Architectural Stance"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-50 (lines 447–449) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-53 (lines 474–476); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Coding keeps: repo scope and footprint, worktree/branch/isolation policy,
merge and catch-up, technical approval, code verification doctrine, and
coding evidence policy (Coding Repository Integration Core).
```

### Full target shown text

```text
Coding keeps: repo scope and footprint, worktree/branch/isolation policy,
merge and catch-up, technical approval, code verification doctrine, and
coding evidence policy (Coding Repository Integration Core).
```

## claim_e823aee058892fd0ebad3cf729ae5bec

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-51, lines 451–469.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-54.
Source digest: 07f4388ea5534a22fbb102a668ef0ea205c030e709d30740e4fbb74ed6551eea
Target digest: 07f4388ea5534a22fbb102a668ef0ea205c030e709d30740e4fbb74ed6551eea
Shown source SHA256: 07f4388ea5534a22fbb102a668ef0ea205c030e709d30740e4fbb74ed6551eea
Shown target SHA256: 07f4388ea5534a22fbb102a668ef0ea205c030e709d30740e4fbb74ed6551eea

### Proposed decision

```json
{
  "claimId": "claim_e823aee058892fd0ebad3cf729ae5bec",
  "sourceUnitDigest": "07f4388ea5534a22fbb102a668ef0ea205c030e709d30740e4fbb74ed6551eea",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "07f4388ea5534a22fbb102a668ef0ea205c030e709d30740e4fbb74ed6551eea",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "6. Architectural Stance"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-51 (lines 451–469) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-54 (lines 478–496); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Work driver / Workflow interpreter (one engine, two doors — see §9 step 7)
  └─ selects a legal declared Stage Operation
       (domains/coding/workflows/feature.yaml remains the hard constraint)
       ├─ primary operation      → stage skill / implementer actor
       └─ collaboration operation
            ├─ opens Work-attached CoordinationSession
            │    workRef = <id>  (read-only context, never authority)
            │    actors/topology/bounds only
            ├─ asks Assignment Builder to freeze the declared operation
            │    work + stage + operation + TaskSpec provenance
            ├─ coding harness enriches/rejects before dispatch
            │    scope, evidence policy, footprint/isolation advice,
            │    opaque workspaceRef when mutation is later allowed
            ├─ Assignment → DispatchPlan → Run → RunResult     ← same core
            ├─ Run Result Evaluator applies generic + coding evidence inputs
            └─ session outcome = non-driving evidence (ADR-007 §3)
                 → driver chooses the next existing Work verb
```
````

### Full target shown text

````text
```txt
Work driver / Workflow interpreter (one engine, two doors — see §9 step 7)
  └─ selects a legal declared Stage Operation
       (domains/coding/workflows/feature.yaml remains the hard constraint)
       ├─ primary operation      → stage skill / implementer actor
       └─ collaboration operation
            ├─ opens Work-attached CoordinationSession
            │    workRef = <id>  (read-only context, never authority)
            │    actors/topology/bounds only
            ├─ asks Assignment Builder to freeze the declared operation
            │    work + stage + operation + TaskSpec provenance
            ├─ coding harness enriches/rejects before dispatch
            │    scope, evidence policy, footprint/isolation advice,
            │    opaque workspaceRef when mutation is later allowed
            ├─ Assignment → DispatchPlan → Run → RunResult     ← same core
            ├─ Run Result Evaluator applies generic + coding evidence inputs
            └─ session outcome = non-driving evidence (ADR-007 §3)
                 → driver chooses the next existing Work verb
```
````

## claim_8eb50653e11994ce64a33a2ebd26d59f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-52, lines 471–488.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-55.
Source digest: bdb6c687e98aae89637fc05b864583981bc745869059f1f3e494b7ff7fa81cb2
Target digest: bdb6c687e98aae89637fc05b864583981bc745869059f1f3e494b7ff7fa81cb2
Shown source SHA256: bdb6c687e98aae89637fc05b864583981bc745869059f1f3e494b7ff7fa81cb2
Shown target SHA256: bdb6c687e98aae89637fc05b864583981bc745869059f1f3e494b7ff7fa81cb2

### Proposed decision

```json
{
  "claimId": "claim_8eb50653e11994ce64a33a2ebd26d59f",
  "sourceUnitDigest": "bdb6c687e98aae89637fc05b864583981bc745869059f1f3e494b7ff7fa81cb2",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "bdb6c687e98aae89637fc05b864583981bc745869059f1f3e494b7ff7fa81cb2",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "6. Architectural Stance"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-52 (lines 471–488) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-55 (lines 498–515); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Three consequences:

1. **Workflow stays the coding runtime authority.** FlowDefinition remains a
   read-only projection shared with CoordinationProtocol for validation. A
   Workflow-runtime migration is reconsidered only when a second domain
   needs something the Workflow model cannot express. This is the direct
   application of product priority #1 (AGENTS.md, D-ADR0030): do not spend
   fgOS-internal refactor effort that does not make a consuming project ship
   faster.
2. **Coding's consult / review / research / validate / scout operations become
   sessions, but declared operation construction stays outside the session
   engine.** The Work driver chooses the legal operation; the Assignment
   Builder freezes it; the session ledger records membership/topology/bounds.
3. **`scoped-subtask` is AdhocTask-lite.** A helper runs inside the session
   with its own Assignment, no Work id, no new persisted entity (V-011).
   AdhocTask proper is reconsidered only if session + Assignment refs prove
   insufficient — the same deferral logic already applied to AgentMessage
   (Step 08 human decision 5).
```

### Full target shown text

```text
Three consequences:

1. **Workflow stays the coding runtime authority.** FlowDefinition remains a
   read-only projection shared with CoordinationProtocol for validation. A
   Workflow-runtime migration is reconsidered only when a second domain
   needs something the Workflow model cannot express. This is the direct
   application of product priority #1 (AGENTS.md, D-ADR0030): do not spend
   fgOS-internal refactor effort that does not make a consuming project ship
   faster.
2. **Coding's consult / review / research / validate / scout operations become
   sessions, but declared operation construction stays outside the session
   engine.** The Work driver chooses the legal operation; the Assignment
   Builder freezes it; the session ledger records membership/topology/bounds.
3. **`scoped-subtask` is AdhocTask-lite.** A helper runs inside the session
   with its own Assignment, no Work id, no new persisted entity (V-011).
   AdhocTask proper is reconsidered only if session + Assignment refs prove
   insufficient — the same deferral logic already applied to AgentMessage
   (Step 08 human decision 5).
```

## claim_16f91ee486e3ada91928a7e02a26abd7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#7-seams, lines 490–490.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#7-seams.
Source digest: 5ad03136564ad44186a60555098c6b12ece0e023dde568c398d142b00f12b303
Target digest: 5ad03136564ad44186a60555098c6b12ece0e023dde568c398d142b00f12b303
Shown source SHA256: 66595642440acb9b1c6d9839b22a1db5d7c578cd1800864bdb4e62290096d789
Shown target SHA256: 66595642440acb9b1c6d9839b22a1db5d7c578cd1800864bdb4e62290096d789

### Proposed decision

```json
{
  "claimId": "claim_16f91ee486e3ada91928a7e02a26abd7",
  "sourceUnitDigest": "5ad03136564ad44186a60555098c6b12ece0e023dde568c398d142b00f12b303",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "7-seams",
  "targetUnitDigest": "5ad03136564ad44186a60555098c6b12ece0e023dde568c398d142b00f12b303",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#7-seams (lines 490–490) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#7-seams (lines 517–517); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 7. Seams

**Proposed.** Lettered so later documents can reference them.

| Seam | What | Where | Status today |
|---|---|---|---|
| A | Work-attached session bridge: Work driver opens a session with `workRef`, actor/topology/bounds, then records one-way membership. The session engine does **not** resolve Workflow, Stage, operation, merge, branch, or lifecycle authority. | Work Driver + `src/runner/coordination/session-engine.mjs` | `workRef` accepted, no Work-attached caller |
| B | Declared Assignment handoff: Work driver passes `{work, stage, operation}` to Assignment Builder; Assignment Builder creates declared provenance and appends membership through the session ledger. This is not an inline `supports:` workaround. | Work Driver + `src/runner/dispatch/assignment.mjs` + session store | Session assignments are inline only today |
| C | Harness preflight extension (ADR-007 §Consequences: extend this function's I/O, do not add seams): `footprint`, `isolation: shared \| isolated`, opaque `workspaceRef`, coding evidence policy inputs. | `domains/coding/harness/enrich-and-validate-contract.mjs` + ledger field | Harness is read-only-only and returns no workspace/resource data |
| D | roleGraph → session topology: manifest edges (`from`, `to`, `reason`, `mode`) and `callstackCap` map onto `topology.edges` with `intents` / `maxRounds` / `maxTaskDepth`; `handoff.mjs` remains the holder truth on Work events; ledger references, never copies. | `domains/coding/manifest.yaml`, `src/state/handoff.mjs`, session manifest | Two enforcement points (D3) |
| E | Evidence adapter bridge: coding-specific git/verify/artifact interpretation feeds Run Result Evaluator; session result refs and synthesis return to the Work driver as non-driving evidence; `onAdvance` verdict derivation stays in the driver. | Run Result Evaluator + Coding Domain Evidence Adapter + Work Driver | Coding evidence is concentrated in `operation-choice.mjs`; session results not wired |
| F | Git/isolation authority stays in Coding Repository Integration Core; the coding driver provisions worktrees per mutating actor and hands opaque refs to the ledger; engine refuses two mutating actors on one ref. | `src/runner/worktree.mjs`, `merge.mjs`, `src/verbs/merge/*` | Unchanged authority; no ledger integration |
| G | One change point for both doors: the `assignment` branch of `executeDriverOperationChoice` calls the Work-driver/session bridge for collaboration operations, keeping the return shape `{executed, runResult, verdictPayload, canAdvanceEdge, stop}`. | `src/runner/dispatch/operation-choice.mjs` as current entry, later Work Driver | `loop.mjs` and `bin/fgos.mjs` both call it |
| H | In-process Run mechanism: when the caller itself performs an Assignment, Dispatch/Run Runtime still records a Run and the Run Result Evaluator settles it from external evidence. This is a runtime mechanism, not a CoordinationSession feature. | Dispatch And Execution Engine + Run Result Evaluator | No minimum Run record for caller-performed work |

Two hazards attached to the seams:

- **D4 must be reconciled before Work-attached session fan-out ships:** a session's
  `maxConcurrency` must never exceed the Work runtime's worker-slot ceiling,
  or two mechanisms each believe they are the cap.
- **D8 must be decided before Seam D ships:** Work event = holder truth;
  session ledger = collaboration evidence; no field copied between them.
```

### Full target shown text

```text
## 7. Seams

**Proposed.** Lettered so later documents can reference them.

| Seam | What | Where | Status today |
|---|---|---|---|
| A | Work-attached session bridge: Work driver opens a session with `workRef`, actor/topology/bounds, then records one-way membership. The session engine does **not** resolve Workflow, Stage, operation, merge, branch, or lifecycle authority. | Work Driver + `src/runner/coordination/session-engine.mjs` | `workRef` accepted, no Work-attached caller |
| B | Declared Assignment handoff: Work driver passes `{work, stage, operation}` to Assignment Builder; Assignment Builder creates declared provenance and appends membership through the session ledger. This is not an inline `supports:` workaround. | Work Driver + `src/runner/dispatch/assignment.mjs` + session store | Session assignments are inline only today |
| C | Harness preflight extension (ADR-007 §Consequences: extend this function's I/O, do not add seams): `footprint`, `isolation: shared \| isolated`, opaque `workspaceRef`, coding evidence policy inputs. | `domains/coding/harness/enrich-and-validate-contract.mjs` + ledger field | Harness is read-only-only and returns no workspace/resource data |
| D | roleGraph → session topology: manifest edges (`from`, `to`, `reason`, `mode`) and `callstackCap` map onto `topology.edges` with `intents` / `maxRounds` / `maxTaskDepth`; `handoff.mjs` remains the holder truth on Work events; ledger references, never copies. | `domains/coding/manifest.yaml`, `src/state/handoff.mjs`, session manifest | Two enforcement points (D3) |
| E | Evidence adapter bridge: coding-specific git/verify/artifact interpretation feeds Run Result Evaluator; session result refs and synthesis return to the Work driver as non-driving evidence; `onAdvance` verdict derivation stays in the driver. | Run Result Evaluator + Coding Domain Evidence Adapter + Work Driver | Coding evidence is concentrated in `operation-choice.mjs`; session results not wired |
| F | Git/isolation authority stays in Coding Repository Integration Core; the coding driver provisions worktrees per mutating actor and hands opaque refs to the ledger; engine refuses two mutating actors on one ref. | `src/runner/worktree.mjs`, `merge.mjs`, `src/verbs/merge/*` | Unchanged authority; no ledger integration |
| G | One change point for both doors: the `assignment` branch of `executeDriverOperationChoice` calls the Work-driver/session bridge for collaboration operations, keeping the return shape `{executed, runResult, verdictPayload, canAdvanceEdge, stop}`. | `src/runner/dispatch/operation-choice.mjs` as current entry, later Work Driver | `loop.mjs` and `bin/fgos.mjs` both call it |
| H | In-process Run mechanism: when the caller itself performs an Assignment, Dispatch/Run Runtime still records a Run and the Run Result Evaluator settles it from external evidence. This is a runtime mechanism, not a CoordinationSession feature. | Dispatch And Execution Engine + Run Result Evaluator | No minimum Run record for caller-performed work |

Two hazards attached to the seams:

- **D4 must be reconciled before Work-attached session fan-out ships:** a session's
  `maxConcurrency` must never exceed the Work runtime's worker-slot ceiling,
  or two mechanisms each believe they are the cap.
- **D8 must be decided before Seam D ships:** Work event = holder truth;
  session ledger = collaboration evidence; no field copied between them.
```

## claim_36388d3827f3b3c535eb1129146fe83d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-53, lines 492–492.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-56.
Source digest: ea077fe3a780d43c0f12f05b450558a36f03b92162fe6505ef3edc06c174657a
Target digest: ea077fe3a780d43c0f12f05b450558a36f03b92162fe6505ef3edc06c174657a
Shown source SHA256: ea077fe3a780d43c0f12f05b450558a36f03b92162fe6505ef3edc06c174657a
Shown target SHA256: ea077fe3a780d43c0f12f05b450558a36f03b92162fe6505ef3edc06c174657a

### Proposed decision

```json
{
  "claimId": "claim_36388d3827f3b3c535eb1129146fe83d",
  "sourceUnitDigest": "ea077fe3a780d43c0f12f05b450558a36f03b92162fe6505ef3edc06c174657a",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "ea077fe3a780d43c0f12f05b450558a36f03b92162fe6505ef3edc06c174657a",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "7. Seams"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-53 (lines 492–492) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-56 (lines 519–519); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Proposed.** Lettered so later documents can reference them.
```

### Full target shown text

```text
**Proposed.** Lettered so later documents can reference them.
```

## claim_f845bb0471262c83c9e175260fe8a825

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-54, lines 494–503.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-57.
Source digest: b122ea0062b392046ff991604351c384c7a36eb474aeea8ff04be5d785047f11
Target digest: b122ea0062b392046ff991604351c384c7a36eb474aeea8ff04be5d785047f11
Shown source SHA256: b122ea0062b392046ff991604351c384c7a36eb474aeea8ff04be5d785047f11
Shown target SHA256: b122ea0062b392046ff991604351c384c7a36eb474aeea8ff04be5d785047f11

### Proposed decision

```json
{
  "claimId": "claim_f845bb0471262c83c9e175260fe8a825",
  "sourceUnitDigest": "b122ea0062b392046ff991604351c384c7a36eb474aeea8ff04be5d785047f11",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "b122ea0062b392046ff991604351c384c7a36eb474aeea8ff04be5d785047f11",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "7. Seams"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-54 (lines 494–503) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-57 (lines 521–530); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Seam | What | Where | Status today |
|---|---|---|---|
| A | Work-attached session bridge: Work driver opens a session with `workRef`, actor/topology/bounds, then records one-way membership. The session engine does **not** resolve Workflow, Stage, operation, merge, branch, or lifecycle authority. | Work Driver + `src/runner/coordination/session-engine.mjs` | `workRef` accepted, no Work-attached caller |
| B | Declared Assignment handoff: Work driver passes `{work, stage, operation}` to Assignment Builder; Assignment Builder creates declared provenance and appends membership through the session ledger. This is not an inline `supports:` workaround. | Work Driver + `src/runner/dispatch/assignment.mjs` + session store | Session assignments are inline only today |
| C | Harness preflight extension (ADR-007 §Consequences: extend this function's I/O, do not add seams): `footprint`, `isolation: shared \| isolated`, opaque `workspaceRef`, coding evidence policy inputs. | `domains/coding/harness/enrich-and-validate-contract.mjs` + ledger field | Harness is read-only-only and returns no workspace/resource data |
| D | roleGraph → session topology: manifest edges (`from`, `to`, `reason`, `mode`) and `callstackCap` map onto `topology.edges` with `intents` / `maxRounds` / `maxTaskDepth`; `handoff.mjs` remains the holder truth on Work events; ledger references, never copies. | `domains/coding/manifest.yaml`, `src/state/handoff.mjs`, session manifest | Two enforcement points (D3) |
| E | Evidence adapter bridge: coding-specific git/verify/artifact interpretation feeds Run Result Evaluator; session result refs and synthesis return to the Work driver as non-driving evidence; `onAdvance` verdict derivation stays in the driver. | Run Result Evaluator + Coding Domain Evidence Adapter + Work Driver | Coding evidence is concentrated in `operation-choice.mjs`; session results not wired |
| F | Git/isolation authority stays in Coding Repository Integration Core; the coding driver provisions worktrees per mutating actor and hands opaque refs to the ledger; engine refuses two mutating actors on one ref. | `src/runner/worktree.mjs`, `merge.mjs`, `src/verbs/merge/*` | Unchanged authority; no ledger integration |
| G | One change point for both doors: the `assignment` branch of `executeDriverOperationChoice` calls the Work-driver/session bridge for collaboration operations, keeping the return shape `{executed, runResult, verdictPayload, canAdvanceEdge, stop}`. | `src/runner/dispatch/operation-choice.mjs` as current entry, later Work Driver | `loop.mjs` and `bin/fgos.mjs` both call it |
| H | In-process Run mechanism: when the caller itself performs an Assignment, Dispatch/Run Runtime still records a Run and the Run Result Evaluator settles it from external evidence. This is a runtime mechanism, not a CoordinationSession feature. | Dispatch And Execution Engine + Run Result Evaluator | No minimum Run record for caller-performed work |
```

### Full target shown text

```text
| Seam | What | Where | Status today |
|---|---|---|---|
| A | Work-attached session bridge: Work driver opens a session with `workRef`, actor/topology/bounds, then records one-way membership. The session engine does **not** resolve Workflow, Stage, operation, merge, branch, or lifecycle authority. | Work Driver + `src/runner/coordination/session-engine.mjs` | `workRef` accepted, no Work-attached caller |
| B | Declared Assignment handoff: Work driver passes `{work, stage, operation}` to Assignment Builder; Assignment Builder creates declared provenance and appends membership through the session ledger. This is not an inline `supports:` workaround. | Work Driver + `src/runner/dispatch/assignment.mjs` + session store | Session assignments are inline only today |
| C | Harness preflight extension (ADR-007 §Consequences: extend this function's I/O, do not add seams): `footprint`, `isolation: shared \| isolated`, opaque `workspaceRef`, coding evidence policy inputs. | `domains/coding/harness/enrich-and-validate-contract.mjs` + ledger field | Harness is read-only-only and returns no workspace/resource data |
| D | roleGraph → session topology: manifest edges (`from`, `to`, `reason`, `mode`) and `callstackCap` map onto `topology.edges` with `intents` / `maxRounds` / `maxTaskDepth`; `handoff.mjs` remains the holder truth on Work events; ledger references, never copies. | `domains/coding/manifest.yaml`, `src/state/handoff.mjs`, session manifest | Two enforcement points (D3) |
| E | Evidence adapter bridge: coding-specific git/verify/artifact interpretation feeds Run Result Evaluator; session result refs and synthesis return to the Work driver as non-driving evidence; `onAdvance` verdict derivation stays in the driver. | Run Result Evaluator + Coding Domain Evidence Adapter + Work Driver | Coding evidence is concentrated in `operation-choice.mjs`; session results not wired |
| F | Git/isolation authority stays in Coding Repository Integration Core; the coding driver provisions worktrees per mutating actor and hands opaque refs to the ledger; engine refuses two mutating actors on one ref. | `src/runner/worktree.mjs`, `merge.mjs`, `src/verbs/merge/*` | Unchanged authority; no ledger integration |
| G | One change point for both doors: the `assignment` branch of `executeDriverOperationChoice` calls the Work-driver/session bridge for collaboration operations, keeping the return shape `{executed, runResult, verdictPayload, canAdvanceEdge, stop}`. | `src/runner/dispatch/operation-choice.mjs` as current entry, later Work Driver | `loop.mjs` and `bin/fgos.mjs` both call it |
| H | In-process Run mechanism: when the caller itself performs an Assignment, Dispatch/Run Runtime still records a Run and the Run Result Evaluator settles it from external evidence. This is a runtime mechanism, not a CoordinationSession feature. | Dispatch And Execution Engine + Run Result Evaluator | No minimum Run record for caller-performed work |
```

## claim_cc31064c0755e77295e2d2099cfd858b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-55, lines 505–505.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-58.
Source digest: 4cb415e99f49810671f790b6f5b00ab0c7cb938d491fcc1820920ce58973c757
Target digest: 4cb415e99f49810671f790b6f5b00ab0c7cb938d491fcc1820920ce58973c757
Shown source SHA256: 4cb415e99f49810671f790b6f5b00ab0c7cb938d491fcc1820920ce58973c757
Shown target SHA256: 4cb415e99f49810671f790b6f5b00ab0c7cb938d491fcc1820920ce58973c757

### Proposed decision

```json
{
  "claimId": "claim_cc31064c0755e77295e2d2099cfd858b",
  "sourceUnitDigest": "4cb415e99f49810671f790b6f5b00ab0c7cb938d491fcc1820920ce58973c757",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "4cb415e99f49810671f790b6f5b00ab0c7cb938d491fcc1820920ce58973c757",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "7. Seams"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-55 (lines 505–505) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-58 (lines 532–532); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Two hazards attached to the seams:
```

### Full target shown text

```text
Two hazards attached to the seams:
```

## claim_05733a7f0fe3e0b63bbd115b4f0d86a3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-56, lines 507–511.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-59.
Source digest: ad56b4f2d43b0f168827e749ab4b7ac3f1d0cb232a82a26378768fe2c0fab405
Target digest: ad56b4f2d43b0f168827e749ab4b7ac3f1d0cb232a82a26378768fe2c0fab405
Shown source SHA256: ad56b4f2d43b0f168827e749ab4b7ac3f1d0cb232a82a26378768fe2c0fab405
Shown target SHA256: ad56b4f2d43b0f168827e749ab4b7ac3f1d0cb232a82a26378768fe2c0fab405

### Proposed decision

```json
{
  "claimId": "claim_05733a7f0fe3e0b63bbd115b4f0d86a3",
  "sourceUnitDigest": "ad56b4f2d43b0f168827e749ab4b7ac3f1d0cb232a82a26378768fe2c0fab405",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "ad56b4f2d43b0f168827e749ab4b7ac3f1d0cb232a82a26378768fe2c0fab405",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "7. Seams"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-56 (lines 507–511) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-59 (lines 534–538); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- **D4 must be reconciled before Work-attached session fan-out ships:** a session's
  `maxConcurrency` must never exceed the Work runtime's worker-slot ceiling,
  or two mechanisms each believe they are the cap.
- **D8 must be decided before Seam D ships:** Work event = holder truth;
  session ledger = collaboration evidence; no field copied between them.
```

### Full target shown text

```text
- **D4 must be reconciled before Work-attached session fan-out ships:** a session's
  `maxConcurrency` must never exceed the Work runtime's worker-slot ceiling,
  or two mechanisms each believe they are the cap.
- **D8 must be decided before Seam D ships:** Work event = holder truth;
  session ledger = collaboration evidence; no field copied between them.
```

## claim_bdd6aa198148edab24d4d4d737c68c28

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#8-foundation-capabilities-coding-requires-that-standalone-never-did, lines 513–513.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#8-foundation-capabilities-coding-requires-that-standalone-never-did.
Source digest: 266f0e17ac7da24bed57ecc49cb9debca326bbb827581b9bb4ee9245072161e4
Target digest: 266f0e17ac7da24bed57ecc49cb9debca326bbb827581b9bb4ee9245072161e4
Shown source SHA256: 701118effc5ad1260a78bc7dba12afeed49f9f97ceb5c6c5034ac501c07074be
Shown target SHA256: 701118effc5ad1260a78bc7dba12afeed49f9f97ceb5c6c5034ac501c07074be

### Proposed decision

```json
{
  "claimId": "claim_bdd6aa198148edab24d4d4d737c68c28",
  "sourceUnitDigest": "266f0e17ac7da24bed57ecc49cb9debca326bbb827581b9bb4ee9245072161e4",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "8-foundation-capabilities-coding-requires-that-standalone-never-did",
  "targetUnitDigest": "266f0e17ac7da24bed57ecc49cb9debca326bbb827581b9bb4ee9245072161e4",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#8-foundation-capabilities-coding-requires-that-standalone-never-did (lines 513–513) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#8-foundation-capabilities-coding-requires-that-standalone-never-did (lines 540–540); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 8. Foundation Capabilities Coding Requires That Standalone Never Did

**Proposed.** Roughly seven tenths of Step 10 is normalization. The remaining
three tenths is genuinely new capability, concentrated below. Standalone
proofs never needed these because every Step 08 proof is read-only.

| # | Capability | Why standalone did not need it | Lands in (§9) |
|---|---|---|---|
| N1 | Mutating Assignment inside a session: lift `buildReadOnlyContract`'s `mutation: read-only` and `READ_ONLY_ROLES` restriction for `evidence.required: verified` contracts; reuse `classifyRunEvidence`'s existing git-delta / dirty-before path | all Step 08 actors are read-only | step 5 |
| N2 | Session Assignments with **declared** provenance: `createSessionAssignment` builds inline only; coding's operations are declared Stage Operations with TaskSpecs. Decision: Work driver + Assignment Builder create the declared Assignment (`work`, `stage`, `operation`, ADR-006 provenance), while the session store records membership. Do not make CoordinationSession a Workflow interpreter. | standalone has no Stage | step 2 (needs a small ADR or contract note) |
| N3 | **In-process Run mechanism:** when `dispatch decide` returns `in-process` or `unavailable`, the caller may perform the work, but Dispatch/Run Runtime still records a Run and Run Result Evaluator settles it from real evidence. Without it, steps 6–7 hold only for headless and ADR-010 parity is not reached | standalone always dispatches a subprocess | ownership fixed in step 1; exact shape before step 6 |
| N4 | Domain evidence adapter seam: coding-specific evidence collection/interpretation feeds the Run Result Evaluator. Justified by two real consumers (coding review-item evidence; Group Cognition synthesis). New ADR; ADR-007 is not edited in place | Step 08 evidence rules live in the engine | step 3; must precede step 5 |
| N5 | Ledger accepts and persists the opaque `workspaceRef` the harness returns, and routes it into the P06 R7 refusal | P06 adds refusal only | step 5 |
| N6 | Concurrency/occupancy port: first Work-attached read-only slice inherits the host Work slot; fan-out or mutation must consult an external slot provider (coding: worker-slots) instead of treating `aggregateBounds.maxConcurrency` as an independent ceiling | standalone has no competing runtime | step 4 before fan-out/mutation |
| N7 | Session pause for a human: coding has `dispatch: human-only` operations and `fgos ask`. The CoordinationSession contract forbids "waiting on human" as a manifest status; it must be inferred from events. An event kind for park/resume is needed; replay already covers resume | standalone proofs never park | step 4 |
| N8 | Work Driver verb shared by both doors (e.g. `fgos drive <id> --ceiling <stage:\|status:>`) | not foundation; Work Driver component | step 7 |
```

### Full target shown text

```text
## 8. Foundation Capabilities Coding Requires That Standalone Never Did

**Proposed.** Roughly seven tenths of Step 10 is normalization. The remaining
three tenths is genuinely new capability, concentrated below. Standalone
proofs never needed these because every Step 08 proof is read-only.

| # | Capability | Why standalone did not need it | Lands in (§9) |
|---|---|---|---|
| N1 | Mutating Assignment inside a session: lift `buildReadOnlyContract`'s `mutation: read-only` and `READ_ONLY_ROLES` restriction for `evidence.required: verified` contracts; reuse `classifyRunEvidence`'s existing git-delta / dirty-before path | all Step 08 actors are read-only | step 5 |
| N2 | Session Assignments with **declared** provenance: `createSessionAssignment` builds inline only; coding's operations are declared Stage Operations with TaskSpecs. Decision: Work driver + Assignment Builder create the declared Assignment (`work`, `stage`, `operation`, ADR-006 provenance), while the session store records membership. Do not make CoordinationSession a Workflow interpreter. | standalone has no Stage | step 2 (needs a small ADR or contract note) |
| N3 | **In-process Run mechanism:** when `dispatch decide` returns `in-process` or `unavailable`, the caller may perform the work, but Dispatch/Run Runtime still records a Run and Run Result Evaluator settles it from real evidence. Without it, steps 6–7 hold only for headless and ADR-010 parity is not reached | standalone always dispatches a subprocess | ownership fixed in step 1; exact shape before step 6 |
| N4 | Domain evidence adapter seam: coding-specific evidence collection/interpretation feeds the Run Result Evaluator. Justified by two real consumers (coding review-item evidence; Group Cognition synthesis). New ADR; ADR-007 is not edited in place | Step 08 evidence rules live in the engine | step 3; must precede step 5 |
| N5 | Ledger accepts and persists the opaque `workspaceRef` the harness returns, and routes it into the P06 R7 refusal | P06 adds refusal only | step 5 |
| N6 | Concurrency/occupancy port: first Work-attached read-only slice inherits the host Work slot; fan-out or mutation must consult an external slot provider (coding: worker-slots) instead of treating `aggregateBounds.maxConcurrency` as an independent ceiling | standalone has no competing runtime | step 4 before fan-out/mutation |
| N7 | Session pause for a human: coding has `dispatch: human-only` operations and `fgos ask`. The CoordinationSession contract forbids "waiting on human" as a manifest status; it must be inferred from events. An event kind for park/resume is needed; replay already covers resume | standalone proofs never park | step 4 |
| N8 | Work Driver verb shared by both doors (e.g. `fgos drive <id> --ceiling <stage:\|status:>`) | not foundation; Work Driver component | step 7 |
```

## claim_1d524b32eb6e94e4c7677d60cec3099d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-57, lines 515–517.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-60.
Source digest: c4dca96317dca6ac68dab96f7c439f5967fa965141b534afafa6789732576b63
Target digest: c4dca96317dca6ac68dab96f7c439f5967fa965141b534afafa6789732576b63
Shown source SHA256: c4dca96317dca6ac68dab96f7c439f5967fa965141b534afafa6789732576b63
Shown target SHA256: c4dca96317dca6ac68dab96f7c439f5967fa965141b534afafa6789732576b63

### Proposed decision

```json
{
  "claimId": "claim_1d524b32eb6e94e4c7677d60cec3099d",
  "sourceUnitDigest": "c4dca96317dca6ac68dab96f7c439f5967fa965141b534afafa6789732576b63",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "c4dca96317dca6ac68dab96f7c439f5967fa965141b534afafa6789732576b63",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "8. Foundation Capabilities Coding Requires That Standalone Never Did"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-57 (lines 515–517) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-60 (lines 542–544); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Proposed.** Roughly seven tenths of Step 10 is normalization. The remaining
three tenths is genuinely new capability, concentrated below. Standalone
proofs never needed these because every Step 08 proof is read-only.
```

### Full target shown text

```text
**Proposed.** Roughly seven tenths of Step 10 is normalization. The remaining
three tenths is genuinely new capability, concentrated below. Standalone
proofs never needed these because every Step 08 proof is read-only.
```

## claim_842df57246399c54f1a1f8626cde1e6f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-58, lines 519–528.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-61.
Source digest: 53173fab0e9e23131989c0034c184c73351fc32b7ec6f219fa79b17d90bb7886
Target digest: 53173fab0e9e23131989c0034c184c73351fc32b7ec6f219fa79b17d90bb7886
Shown source SHA256: 53173fab0e9e23131989c0034c184c73351fc32b7ec6f219fa79b17d90bb7886
Shown target SHA256: 53173fab0e9e23131989c0034c184c73351fc32b7ec6f219fa79b17d90bb7886

### Proposed decision

```json
{
  "claimId": "claim_842df57246399c54f1a1f8626cde1e6f",
  "sourceUnitDigest": "53173fab0e9e23131989c0034c184c73351fc32b7ec6f219fa79b17d90bb7886",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-61",
  "targetUnitDigest": "53173fab0e9e23131989c0034c184c73351fc32b7ec6f219fa79b17d90bb7886",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "8. Foundation Capabilities Coding Requires That Standalone Never Did"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-58 (lines 519–528) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-61 (lines 546–555); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| # | Capability | Why standalone did not need it | Lands in (§9) |
|---|---|---|---|
| N1 | Mutating Assignment inside a session: lift `buildReadOnlyContract`'s `mutation: read-only` and `READ_ONLY_ROLES` restriction for `evidence.required: verified` contracts; reuse `classifyRunEvidence`'s existing git-delta / dirty-before path | all Step 08 actors are read-only | step 5 |
| N2 | Session Assignments with **declared** provenance: `createSessionAssignment` builds inline only; coding's operations are declared Stage Operations with TaskSpecs. Decision: Work driver + Assignment Builder create the declared Assignment (`work`, `stage`, `operation`, ADR-006 provenance), while the session store records membership. Do not make CoordinationSession a Workflow interpreter. | standalone has no Stage | step 2 (needs a small ADR or contract note) |
| N3 | **In-process Run mechanism:** when `dispatch decide` returns `in-process` or `unavailable`, the caller may perform the work, but Dispatch/Run Runtime still records a Run and Run Result Evaluator settles it from real evidence. Without it, steps 6–7 hold only for headless and ADR-010 parity is not reached | standalone always dispatches a subprocess | ownership fixed in step 1; exact shape before step 6 |
| N4 | Domain evidence adapter seam: coding-specific evidence collection/interpretation feeds the Run Result Evaluator. Justified by two real consumers (coding review-item evidence; Group Cognition synthesis). New ADR; ADR-007 is not edited in place | Step 08 evidence rules live in the engine | step 3; must precede step 5 |
| N5 | Ledger accepts and persists the opaque `workspaceRef` the harness returns, and routes it into the P06 R7 refusal | P06 adds refusal only | step 5 |
| N6 | Concurrency/occupancy port: first Work-attached read-only slice inherits the host Work slot; fan-out or mutation must consult an external slot provider (coding: worker-slots) instead of treating `aggregateBounds.maxConcurrency` as an independent ceiling | standalone has no competing runtime | step 4 before fan-out/mutation |
| N7 | Session pause for a human: coding has `dispatch: human-only` operations and `fgos ask`. The CoordinationSession contract forbids "waiting on human" as a manifest status; it must be inferred from events. An event kind for park/resume is needed; replay already covers resume | standalone proofs never park | step 4 |
| N8 | Work Driver verb shared by both doors (e.g. `fgos drive <id> --ceiling <stage:\|status:>`) | not foundation; Work Driver component | step 7 |
```

### Full target shown text

```text
| # | Capability | Why standalone did not need it | Lands in (§9) |
|---|---|---|---|
| N1 | Mutating Assignment inside a session: lift `buildReadOnlyContract`'s `mutation: read-only` and `READ_ONLY_ROLES` restriction for `evidence.required: verified` contracts; reuse `classifyRunEvidence`'s existing git-delta / dirty-before path | all Step 08 actors are read-only | step 5 |
| N2 | Session Assignments with **declared** provenance: `createSessionAssignment` builds inline only; coding's operations are declared Stage Operations with TaskSpecs. Decision: Work driver + Assignment Builder create the declared Assignment (`work`, `stage`, `operation`, ADR-006 provenance), while the session store records membership. Do not make CoordinationSession a Workflow interpreter. | standalone has no Stage | step 2 (needs a small ADR or contract note) |
| N3 | **In-process Run mechanism:** when `dispatch decide` returns `in-process` or `unavailable`, the caller may perform the work, but Dispatch/Run Runtime still records a Run and Run Result Evaluator settles it from real evidence. Without it, steps 6–7 hold only for headless and ADR-010 parity is not reached | standalone always dispatches a subprocess | ownership fixed in step 1; exact shape before step 6 |
| N4 | Domain evidence adapter seam: coding-specific evidence collection/interpretation feeds the Run Result Evaluator. Justified by two real consumers (coding review-item evidence; Group Cognition synthesis). New ADR; ADR-007 is not edited in place | Step 08 evidence rules live in the engine | step 3; must precede step 5 |
| N5 | Ledger accepts and persists the opaque `workspaceRef` the harness returns, and routes it into the P06 R7 refusal | P06 adds refusal only | step 5 |
| N6 | Concurrency/occupancy port: first Work-attached read-only slice inherits the host Work slot; fan-out or mutation must consult an external slot provider (coding: worker-slots) instead of treating `aggregateBounds.maxConcurrency` as an independent ceiling | standalone has no competing runtime | step 4 before fan-out/mutation |
| N7 | Session pause for a human: coding has `dispatch: human-only` operations and `fgos ask`. The CoordinationSession contract forbids "waiting on human" as a manifest status; it must be inferred from events. An event kind for park/resume is needed; replay already covers resume | standalone proofs never park | step 4 |
| N8 | Work Driver verb shared by both doors (e.g. `fgos drive <id> --ceiling <stage:\|status:>`) | not foundation; Work Driver component | step 7 |
```

## claim_7b8ad892f65fa8be4b4897b4708edc9b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#9-candidate-step-sequence, lines 530–530.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#9-candidate-step-sequence.
Source digest: f0a2ee9ec9bbca33dbc5aac2044758aab65719d4ce79b240b3eb4a4ac133a112
Target digest: f0a2ee9ec9bbca33dbc5aac2044758aab65719d4ce79b240b3eb4a4ac133a112
Shown source SHA256: 2306883f1f36f8d844d3f698725b893351fecf6c4d37a9ba99c11fc9d3dd292a
Shown target SHA256: 2306883f1f36f8d844d3f698725b893351fecf6c4d37a9ba99c11fc9d3dd292a

### Proposed decision

```json
{
  "claimId": "claim_7b8ad892f65fa8be4b4897b4708edc9b",
  "sourceUnitDigest": "f0a2ee9ec9bbca33dbc5aac2044758aab65719d4ce79b240b3eb4a4ac133a112",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "9-candidate-step-sequence",
  "targetUnitDigest": "f0a2ee9ec9bbca33dbc5aac2044758aab65719d4ce79b240b3eb4a4ac133a112",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#9-candidate-step-sequence (lines 530–530) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#9-candidate-step-sequence (lines 557–557); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 9. Candidate Step Sequence

**Proposed.** Ordered by two criteria: never open the ADR-010 §5 gate earlier
than its proof, and leave visible value for a consuming project at each stop,
not only internal tidiness.

| Step | Name | Closes | Depends on | Value class |
|---|---|---|---|---|
| 1 | Boundary and substrate readiness gate: consume the parallel Component Authority Boundary Map and the relevant accepted Step 09 group-thinking primitive; no runtime code, no file moves. | F1-F7 authority classification, D7 proposed ownership, Q7 draft layout direction, Step 09 dependency | Component Authority Boundary Map + accepted Step 09 slice | prerequisite |
| 2 | Work-attached read-only `validate-plan` session only: Seams A, B, E, G for the single reviewer operation; both doors (`fgos plan --validate`, `fgos-runner --once`); golden Workflow tests unchanged; session engine remains lifecycle-blind. | first proof of N2 | 1 | **direct**: reviewer validation gains provenance/recovery without widening scope |
| 3 | Coding evidence evaluator home: extract coding-specific RunResult interpretation from `operation-choice.mjs` into the coding domain behind the N4 seam; new ADR; keep Run Result Evaluator as final confidence owner. | D6 | 1 (can run after or beside 2, but must close before 5) | indirect |
| 4 | Expand read-only collaboration sessions: `review-item`, `scout-blast-radius`, `resolve-question`; roleGraph → topology; `handoff.mjs` stays holder truth; add park/resume events and reconcile worker-slots vs session concurrency before any fan-out. | D3, D4, D8, N6, N7 | 2, 3 | **direct**: reviewer/consult get cohort diversity, provenance, recovery |
| 5 | **Mutating live proof — the ADR-010 §5 gate itself:** Seams C, F; N1, N5. Scenario: one executing item; implementer + helper (`scoped-subtask`) concurrently in distinct worktrees; reviewer read-only; overlapping footprint refused before Assignment creation; crash mid-run then resume without duplicate; merge only through `approve`; transition only through `fgos return`. Exit: AC-I009 → implemented; gate lifted by a **new** ADR, ADR-010 untouched | — | 2, 3, 4, P06 R3/R7 | required for V-012 |
| 6 | Executing path onto Assignment: `implement-item` becomes a mutating verified Assignment; goal-check becomes an evidence adapter; `spawnWorker` loses its reason to exist as a second core; in-process/manual-caller execution uses the Dispatch/Run Runtime mechanism from N3. | D2 | 5, N3 shape decided | indirect (removes false-success surface) |
| 7 | One Work Driver, two doors: `fgos-coding-driving` loop + `loop.mjs` driver logic → one engine (N8); skills become thin launchers; `fgos-fanout` calls the driver's batch dispatch instead of spawning Agents; interactive = driver with an operator attached | D1, D5 | 6, N3 | **direct**: "release con người" (priority #2); interactive/headless identical capability |
| 8 | Physical placement (optional): `operation-choice` → driver; domain loader → domains; git core → under coding domain; first Rust candidate per the migration note | D7 | 7 | optional |
```

### Full target shown text

```text
## 9. Candidate Step Sequence

**Proposed.** Ordered by two criteria: never open the ADR-010 §5 gate earlier
than its proof, and leave visible value for a consuming project at each stop,
not only internal tidiness.

| Step | Name | Closes | Depends on | Value class |
|---|---|---|---|---|
| 1 | Boundary and substrate readiness gate: consume the parallel Component Authority Boundary Map and the relevant accepted Step 09 group-thinking primitive; no runtime code, no file moves. | F1-F7 authority classification, D7 proposed ownership, Q7 draft layout direction, Step 09 dependency | Component Authority Boundary Map + accepted Step 09 slice | prerequisite |
| 2 | Work-attached read-only `validate-plan` session only: Seams A, B, E, G for the single reviewer operation; both doors (`fgos plan --validate`, `fgos-runner --once`); golden Workflow tests unchanged; session engine remains lifecycle-blind. | first proof of N2 | 1 | **direct**: reviewer validation gains provenance/recovery without widening scope |
| 3 | Coding evidence evaluator home: extract coding-specific RunResult interpretation from `operation-choice.mjs` into the coding domain behind the N4 seam; new ADR; keep Run Result Evaluator as final confidence owner. | D6 | 1 (can run after or beside 2, but must close before 5) | indirect |
| 4 | Expand read-only collaboration sessions: `review-item`, `scout-blast-radius`, `resolve-question`; roleGraph → topology; `handoff.mjs` stays holder truth; add park/resume events and reconcile worker-slots vs session concurrency before any fan-out. | D3, D4, D8, N6, N7 | 2, 3 | **direct**: reviewer/consult get cohort diversity, provenance, recovery |
| 5 | **Mutating live proof — the ADR-010 §5 gate itself:** Seams C, F; N1, N5. Scenario: one executing item; implementer + helper (`scoped-subtask`) concurrently in distinct worktrees; reviewer read-only; overlapping footprint refused before Assignment creation; crash mid-run then resume without duplicate; merge only through `approve`; transition only through `fgos return`. Exit: AC-I009 → implemented; gate lifted by a **new** ADR, ADR-010 untouched | — | 2, 3, 4, P06 R3/R7 | required for V-012 |
| 6 | Executing path onto Assignment: `implement-item` becomes a mutating verified Assignment; goal-check becomes an evidence adapter; `spawnWorker` loses its reason to exist as a second core; in-process/manual-caller execution uses the Dispatch/Run Runtime mechanism from N3. | D2 | 5, N3 shape decided | indirect (removes false-success surface) |
| 7 | One Work Driver, two doors: `fgos-coding-driving` loop + `loop.mjs` driver logic → one engine (N8); skills become thin launchers; `fgos-fanout` calls the driver's batch dispatch instead of spawning Agents; interactive = driver with an operator attached | D1, D5 | 6, N3 | **direct**: "release con người" (priority #2); interactive/headless identical capability |
| 8 | Physical placement (optional): `operation-choice` → driver; domain loader → domains; git core → under coding domain; first Rust candidate per the migration note | D7 | 7 | optional |
```

## claim_8fcb3591eacb9a8f07025ef5fc2b0644

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-59, lines 532–534.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-62.
Source digest: 2b4e1b441a2eda5be176a6e735dc53aaa1651e898cdb756d062638380cbc7e96
Target digest: 2b4e1b441a2eda5be176a6e735dc53aaa1651e898cdb756d062638380cbc7e96
Shown source SHA256: 2b4e1b441a2eda5be176a6e735dc53aaa1651e898cdb756d062638380cbc7e96
Shown target SHA256: 2b4e1b441a2eda5be176a6e735dc53aaa1651e898cdb756d062638380cbc7e96

### Proposed decision

```json
{
  "claimId": "claim_8fcb3591eacb9a8f07025ef5fc2b0644",
  "sourceUnitDigest": "2b4e1b441a2eda5be176a6e735dc53aaa1651e898cdb756d062638380cbc7e96",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-62",
  "targetUnitDigest": "2b4e1b441a2eda5be176a6e735dc53aaa1651e898cdb756d062638380cbc7e96",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "9. Candidate Step Sequence"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-59 (lines 532–534) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-62 (lines 559–561); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Proposed.** Ordered by two criteria: never open the ADR-010 §5 gate earlier
than its proof, and leave visible value for a consuming project at each stop,
not only internal tidiness.
```

### Full target shown text

```text
**Proposed.** Ordered by two criteria: never open the ADR-010 §5 gate earlier
than its proof, and leave visible value for a consuming project at each stop,
not only internal tidiness.
```

## claim_afe9b72871508182cf2fe3edcbf355f9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-60, lines 536–545.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-63.
Source digest: 5b0883e5a1edf88d034b676502c08587f358d4084b60be6cdfaf6e9ccb7657fa
Target digest: 5b0883e5a1edf88d034b676502c08587f358d4084b60be6cdfaf6e9ccb7657fa
Shown source SHA256: 5b0883e5a1edf88d034b676502c08587f358d4084b60be6cdfaf6e9ccb7657fa
Shown target SHA256: 5b0883e5a1edf88d034b676502c08587f358d4084b60be6cdfaf6e9ccb7657fa

### Proposed decision

```json
{
  "claimId": "claim_afe9b72871508182cf2fe3edcbf355f9",
  "sourceUnitDigest": "5b0883e5a1edf88d034b676502c08587f358d4084b60be6cdfaf6e9ccb7657fa",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-63",
  "targetUnitDigest": "5b0883e5a1edf88d034b676502c08587f358d4084b60be6cdfaf6e9ccb7657fa",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "9. Candidate Step Sequence"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-60 (lines 536–545) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-63 (lines 563–572); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Step | Name | Closes | Depends on | Value class |
|---|---|---|---|---|
| 1 | Boundary and substrate readiness gate: consume the parallel Component Authority Boundary Map and the relevant accepted Step 09 group-thinking primitive; no runtime code, no file moves. | F1-F7 authority classification, D7 proposed ownership, Q7 draft layout direction, Step 09 dependency | Component Authority Boundary Map + accepted Step 09 slice | prerequisite |
| 2 | Work-attached read-only `validate-plan` session only: Seams A, B, E, G for the single reviewer operation; both doors (`fgos plan --validate`, `fgos-runner --once`); golden Workflow tests unchanged; session engine remains lifecycle-blind. | first proof of N2 | 1 | **direct**: reviewer validation gains provenance/recovery without widening scope |
| 3 | Coding evidence evaluator home: extract coding-specific RunResult interpretation from `operation-choice.mjs` into the coding domain behind the N4 seam; new ADR; keep Run Result Evaluator as final confidence owner. | D6 | 1 (can run after or beside 2, but must close before 5) | indirect |
| 4 | Expand read-only collaboration sessions: `review-item`, `scout-blast-radius`, `resolve-question`; roleGraph → topology; `handoff.mjs` stays holder truth; add park/resume events and reconcile worker-slots vs session concurrency before any fan-out. | D3, D4, D8, N6, N7 | 2, 3 | **direct**: reviewer/consult get cohort diversity, provenance, recovery |
| 5 | **Mutating live proof — the ADR-010 §5 gate itself:** Seams C, F; N1, N5. Scenario: one executing item; implementer + helper (`scoped-subtask`) concurrently in distinct worktrees; reviewer read-only; overlapping footprint refused before Assignment creation; crash mid-run then resume without duplicate; merge only through `approve`; transition only through `fgos return`. Exit: AC-I009 → implemented; gate lifted by a **new** ADR, ADR-010 untouched | — | 2, 3, 4, P06 R3/R7 | required for V-012 |
| 6 | Executing path onto Assignment: `implement-item` becomes a mutating verified Assignment; goal-check becomes an evidence adapter; `spawnWorker` loses its reason to exist as a second core; in-process/manual-caller execution uses the Dispatch/Run Runtime mechanism from N3. | D2 | 5, N3 shape decided | indirect (removes false-success surface) |
| 7 | One Work Driver, two doors: `fgos-coding-driving` loop + `loop.mjs` driver logic → one engine (N8); skills become thin launchers; `fgos-fanout` calls the driver's batch dispatch instead of spawning Agents; interactive = driver with an operator attached | D1, D5 | 6, N3 | **direct**: "release con người" (priority #2); interactive/headless identical capability |
| 8 | Physical placement (optional): `operation-choice` → driver; domain loader → domains; git core → under coding domain; first Rust candidate per the migration note | D7 | 7 | optional |
```

### Full target shown text

```text
| Step | Name | Closes | Depends on | Value class |
|---|---|---|---|---|
| 1 | Boundary and substrate readiness gate: consume the parallel Component Authority Boundary Map and the relevant accepted Step 09 group-thinking primitive; no runtime code, no file moves. | F1-F7 authority classification, D7 proposed ownership, Q7 draft layout direction, Step 09 dependency | Component Authority Boundary Map + accepted Step 09 slice | prerequisite |
| 2 | Work-attached read-only `validate-plan` session only: Seams A, B, E, G for the single reviewer operation; both doors (`fgos plan --validate`, `fgos-runner --once`); golden Workflow tests unchanged; session engine remains lifecycle-blind. | first proof of N2 | 1 | **direct**: reviewer validation gains provenance/recovery without widening scope |
| 3 | Coding evidence evaluator home: extract coding-specific RunResult interpretation from `operation-choice.mjs` into the coding domain behind the N4 seam; new ADR; keep Run Result Evaluator as final confidence owner. | D6 | 1 (can run after or beside 2, but must close before 5) | indirect |
| 4 | Expand read-only collaboration sessions: `review-item`, `scout-blast-radius`, `resolve-question`; roleGraph → topology; `handoff.mjs` stays holder truth; add park/resume events and reconcile worker-slots vs session concurrency before any fan-out. | D3, D4, D8, N6, N7 | 2, 3 | **direct**: reviewer/consult get cohort diversity, provenance, recovery |
| 5 | **Mutating live proof — the ADR-010 §5 gate itself:** Seams C, F; N1, N5. Scenario: one executing item; implementer + helper (`scoped-subtask`) concurrently in distinct worktrees; reviewer read-only; overlapping footprint refused before Assignment creation; crash mid-run then resume without duplicate; merge only through `approve`; transition only through `fgos return`. Exit: AC-I009 → implemented; gate lifted by a **new** ADR, ADR-010 untouched | — | 2, 3, 4, P06 R3/R7 | required for V-012 |
| 6 | Executing path onto Assignment: `implement-item` becomes a mutating verified Assignment; goal-check becomes an evidence adapter; `spawnWorker` loses its reason to exist as a second core; in-process/manual-caller execution uses the Dispatch/Run Runtime mechanism from N3. | D2 | 5, N3 shape decided | indirect (removes false-success surface) |
| 7 | One Work Driver, two doors: `fgos-coding-driving` loop + `loop.mjs` driver logic → one engine (N8); skills become thin launchers; `fgos-fanout` calls the driver's batch dispatch instead of spawning Agents; interactive = driver with an operator attached | D1, D5 | 6, N3 | **direct**: "release con người" (priority #2); interactive/headless identical capability |
| 8 | Physical placement (optional): `operation-choice` → driver; domain loader → domains; git core → under coding domain; first Rust candidate per the migration note | D7 | 7 | optional |
```

## claim_95bd9e63c50b41b3b511d948685c8f38

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#91-boundary-map-input-shape, lines 547–547.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#91-boundary-map-input-shape.
Source digest: 6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597
Target digest: 4f3162f65a350d3a52e930890085e6591e32267011e497b41d5a0887f607c1da
Shown source SHA256: 7f44cf3e88fff9c6b7ae6a0a042bc01a5f926741a11680f5ba652e43ca272d59
Shown target SHA256: 2d1769dd83075a8ac676221e25983083ff33ccceca1b1d14f20d1977e67da6d0

### Proposed decision

```json
{
  "claimId": "claim_95bd9e63c50b41b3b511d948685c8f38",
  "sourceUnitDigest": "6aee115d6a5ef8ae9048352100bb8e7a006af2373e23ac36d343c152c9934597",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "91-boundary-map-input-shape",
  "targetUnitDigest": "4f3162f65a350d3a52e930890085e6591e32267011e497b41d5a0887f607c1da",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "9. Candidate Step Sequence"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source heading docs/architect/proposals/step-10-coding-domain-adoption.md#91-boundary-map-input-shape (lines 547–547) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#91-boundary-map-input-shape (lines 574–574); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
### 9.1 Boundary Map Input Shape

The parallel Component Authority Boundary Map should produce ownership
documents, not a file move and not accepted runtime authority. The minimum
useful output is:

1. **Component, Bounded-Context, And Authority Map.** Records each component's
   authority, state, ports, adapters, forbidden dependencies, and layer:
   foundation, platform support, domain, integration, host/surface, or plugin.
   Draft artifact:
   [Component Authority Boundary Map](component-authority-boundary-map.md).
2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names
   which currently-coding-used modules are reusable foundation/platform
   components versus Coding Domain Core.
3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction
   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:
   thin app entrypoints stay thin; reusable authority-owning logic lives behind
   package/component facades; existing paths remain until a later movement
   slice has contract tests.
4. **Migration constraint.** Physical layout must express the authority map, not
   create it. Moving a module under `packages/domains/coding` only means coding
   owns it if the accepted authority map says coding owns that behavior.

Candidate Node layout vocabulary for that overlay:

```txt
apps/
  cli/                    # thin fgos / fgos-runner entrypoints, if moved later

packages/
  work-core/
    work-lifecycle/       # Work state, status/stage, claim/return, Work verbs
    work-driver/          # ready selection, operation choice, automation loop
    runtime-occupancy/    # worker slots, checkout locks, resource pressure
  agent-coordination/
    agent-coordination/   # CoordinationSession, topology, team cognition
    dispatch-execution/   # DispatchPlan, Run runtime, executor adapters
    run-result-evaluator/ # evidence collection, confidence, RunResult
  domain-registry/        # domain/workflow/task-spec loading and validation
  domains/coding/         # Coding Domain Core + product/design, cook, bugfix, small-change policy
  setup-doctor/           # config/default/check registration
  host-surfaces/          # gateway/API/plugin/Herdr adapters
  learning-docs/          # retrospective knowledge and docs registry
```

This vocabulary is deliberately not a required tree for Step 10. It is the
shape the Component Authority Boundary Map should draft and later accepted
boundary documents should accept, revise, or reject.

**Proposed non-goals for Step 10:**

- no AdhocTask entity (see §6 consequence 3);
- no Workflow-runtime migration onto FlowDefinition;
- no Mission, AgentMessage, `purpose` routing, marketplace, telemetry
  backend;
- no merge/branch/Work-transition API inside `src/runner/coordination/**`
  (ADR-010 §4 holds regardless of step 5's outcome);
- no editing of ADR-007 or ADR-010 in place; new decisions get new ADRs.

**Proposed cut rule if scope must shrink:** cut step 8 first, then split step
7 into "driver engine" and "fan-out onto driver". Do not cut steps 3 and 4;
they are what keeps step 5 and step 7 from collapsing.
````

### Full target shown text

````text
### 9.1 Boundary Map Input Shape

The parallel Component Authority Boundary Map should produce ownership
documents, not a file move and not accepted runtime authority. The minimum
useful output is:

1. **Component, Bounded-Context, And Authority Map.** Records each component's
   authority, state, ports, adapters, forbidden dependencies, and layer:
   foundation, platform support, domain, integration, host/surface, or plugin.
   Draft artifact:
   [Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md).
2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names
   which currently-coding-used modules are reusable foundation/platform
   components versus Coding Domain Core.
3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction
   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:
   thin app entrypoints stay thin; reusable authority-owning logic lives behind
   package/component facades; existing paths remain until a later movement
   slice has contract tests.
4. **Migration constraint.** Physical layout must express the authority map, not
   create it. Moving a module under `packages/domains/coding` only means coding
   owns it if the accepted authority map says coding owns that behavior.

Candidate Node layout vocabulary for that overlay:

```txt
apps/
  cli/                    # thin fgos / fgos-runner entrypoints, if moved later

packages/
  work-core/
    work-lifecycle/       # Work state, status/stage, claim/return, Work verbs
    work-driver/          # ready selection, operation choice, automation loop
    runtime-occupancy/    # worker slots, checkout locks, resource pressure
  agent-coordination/
    agent-coordination/   # CoordinationSession, topology, team cognition
    dispatch-execution/   # DispatchPlan, Run runtime, executor adapters
    run-result-evaluator/ # evidence collection, confidence, RunResult
  domain-registry/        # domain/workflow/task-spec loading and validation
  domains/coding/         # Coding Domain Core + product/design, cook, bugfix, small-change policy
  setup-doctor/           # config/default/check registration
  host-surfaces/          # gateway/API/plugin/Herdr adapters
  learning-docs/          # retrospective knowledge and docs registry
```

This vocabulary is deliberately not a required tree for Step 10. It is the
shape the Component Authority Boundary Map should draft and later accepted
boundary documents should accept, revise, or reject.

**Proposed non-goals for Step 10:**

- no AdhocTask entity (see §6 consequence 3);
- no Workflow-runtime migration onto FlowDefinition;
- no Mission, AgentMessage, `purpose` routing, marketplace, telemetry
  backend;
- no merge/branch/Work-transition API inside `src/runner/coordination/**`
  (ADR-010 §4 holds regardless of step 5's outcome);
- no editing of ADR-007 or ADR-010 in place; new decisions get new ADRs.

**Proposed cut rule if scope must shrink:** cut step 8 first, then split step
7 into "driver engine" and "fan-out onto driver". Do not cut steps 3 and 4;
they are what keeps step 5 and step 7 from collapsing.
````

## claim_457dcb9815214f3655a3ebf8120ef65f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-61, lines 549–551.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-64.
Source digest: 1c8535cb91e7d4f35ed3292739974607955ec292f73310b38daa0fe56a04cf58
Target digest: 1c8535cb91e7d4f35ed3292739974607955ec292f73310b38daa0fe56a04cf58
Shown source SHA256: 1c8535cb91e7d4f35ed3292739974607955ec292f73310b38daa0fe56a04cf58
Shown target SHA256: 1c8535cb91e7d4f35ed3292739974607955ec292f73310b38daa0fe56a04cf58

### Proposed decision

```json
{
  "claimId": "claim_457dcb9815214f3655a3ebf8120ef65f",
  "sourceUnitDigest": "1c8535cb91e7d4f35ed3292739974607955ec292f73310b38daa0fe56a04cf58",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-64",
  "targetUnitDigest": "1c8535cb91e7d4f35ed3292739974607955ec292f73310b38daa0fe56a04cf58",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "9. Candidate Step Sequence",
    "9.1 Boundary Map Input Shape"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-61 (lines 549–551) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-64 (lines 576–578); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The parallel Component Authority Boundary Map should produce ownership
documents, not a file move and not accepted runtime authority. The minimum
useful output is:
```

### Full target shown text

```text
The parallel Component Authority Boundary Map should produce ownership
documents, not a file move and not accepted runtime authority. The minimum
useful output is:
```

## claim_78e55538d050b196b46032da6b57fa9d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-62, lines 553–568.
Target: docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-65.
Source digest: 8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680
Target digest: 217569c4e4b3dcc07bd536f9d861518458ab3fb766107b0afea4a9c1ec24c998
Shown source SHA256: 8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680
Shown target SHA256: 217569c4e4b3dcc07bd536f9d861518458ab3fb766107b0afea4a9c1ec24c998

### Proposed decision

```json
{
  "claimId": "claim_78e55538d050b196b46032da6b57fa9d",
  "sourceUnitDigest": "8c86310dc03b26aada935eac76ada9ca7fc24ebceb452d901ecb7e7db23e3680",
  "targetOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "targetAnchor": "unheaded-block-65",
  "targetUnitDigest": "217569c4e4b3dcc07bd536f9d861518458ab3fb766107b0afea4a9c1ec24c998",
  "targetAncestry": [
    "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "9. Candidate Step Sequence",
    "9.1 Boundary Map Input Shape"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Evidence: docs/platform/system-architecture/architecture/roadmap.md:53 retains the direction, explicitly using Workflow runner and Execution Core. Source lines 3–32 calls itself Discussion, Not started and no implemented slice. domains/coding/workflows/feature.yaml and harness/enrich-and-validate-contract.mjs survive. Complete source unheaded-block docs/architect/proposals/step-10-coding-domain-adoption.md#unheaded-block-62 (lines 553–568) is carried at docs/platform/proposals/step-10-coding-domain-adoption.md#unheaded-block-65 (lines 580–595); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. **Component, Bounded-Context, And Authority Map.** Records each component's
   authority, state, ports, adapters, forbidden dependencies, and layer:
   foundation, platform support, domain, integration, host/surface, or plugin.
   Draft artifact:
   [Component Authority Boundary Map](component-authority-boundary-map.md).
2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names
   which currently-coding-used modules are reusable foundation/platform
   components versus Coding Domain Core.
3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction
   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:
   thin app entrypoints stay thin; reusable authority-owning logic lives behind
   package/component facades; existing paths remain until a later movement
   slice has contract tests.
4. **Migration constraint.** Physical layout must express the authority map, not
   create it. Moving a module under `packages/domains/coding` only means coding
   owns it if the accepted authority map says coding owns that behavior.
```

### Full target shown text

```text
1. **Component, Bounded-Context, And Authority Map.** Records each component's
   authority, state, ports, adapters, forbidden dependencies, and layer:
   foundation, platform support, domain, integration, host/surface, or plugin.
   Draft artifact:
   [Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md).
2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names
   which currently-coding-used modules are reusable foundation/platform
   components versus Coding Domain Core.
3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction
   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:
   thin app entrypoints stay thin; reusable authority-owning logic lives behind
   package/component facades; existing paths remain until a later movement
   slice has contract tests.
4. **Migration constraint.** Physical layout must express the authority map, not
   create it. Moving a module under `packages/domains/coding` only means coding
   owns it if the accepted authority map says coding owns that behavior.
```
