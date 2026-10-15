# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-01-dispatch-control-plane-redesign.json
Original shard SHA256: 87bcc867a85d5af699e541c084adfbad0311e6d34604938e24c7ba7c50440735
Source file: docs/architect/dispatch-control-plane-redesign.md
Part 1/1; entries: **7**. Source-file group 1/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (1): `claim_2ec7fc22c79d18b5f8d57cc79ec5e587`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (7): `claim_2ec7fc22c79d18b5f8d57cc79ec5e587`, `claim_c1d6c7e71ac871df50ade9fbd9c197ef`, `claim_6f1c18985eba573f3f0bc7af216dff30`, `claim_2aa7df6a5ea4807463b81b5181821702`, `claim_62153be70af7b764bdb0d17617240bbf`, `claim_47245c890a656f03be28dee6020f095a`, `claim_3811942485f2624b620b36b3a3aba933`.

Weak-exact/Judgment population: 2; reviewer chooses and records seed and IDs for at least 2 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_2ec7fc22c79d18b5f8d57cc79ec5e587

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign, lines 1–1.
Target: docs/platform/proposals/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign.
Source digest: 7b5d3df68b88c26058760be3ed0d7f21c05f84e1512a07212d26e953156fc154
Target digest: b836a91ed4d5753a3192ae3a992e713477fc30524d664dc173024fb8ad889741
Shown source SHA256: 0fc333fc7df0c3c1883a8de7627769a26129cfe0566e74fdaeaec824618ce642
Shown target SHA256: 6a54dbf30fc96c54af700b3835b38957b878dc6e85d7160fbcd549ec4e4c377b

### Proposed decision

```json
{
  "claimId": "claim_2ec7fc22c79d18b5f8d57cc79ec5e587",
  "sourceUnitDigest": "7b5d3df68b88c26058760be3ed0d7f21c05f84e1512a07212d26e953156fc154",
  "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
  "targetAnchor": "dispatch-control-plane-redesign",
  "targetUnitDigest": "b836a91ed4d5753a3192ae3a992e713477fc30524d664dc173024fb8ad889741",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source heading docs/architect/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign (lines 1–1) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
# Dispatch Control Plane Redesign

Canonical architecture moved to:

`docs/architect/agent-coordination/architecture/dispatch-control-plane.md`

The unresolved redesign source is retained at:

`docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md`

For the full related architecture set, start at:

`docs/architect/agent-coordination/README.md`
```

### Full target shown text

````text
# Dispatch Control Plane Redesign

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/dispatch-control-plane-redesign.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 6d66e789fbe1fdf433d1c9a72d8ab3de32b0f8b1
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/dispatch-control-plane-redesign.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate pointer at the mapped proposals path; the full proposal is at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. The three inline-code legacy paths are retained pending cutover. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/dispatch-control-plane-redesign.md).


Canonical architecture moved to:

`docs/architect/agent-coordination/architecture/dispatch-control-plane.md`

The unresolved redesign source is retained at:

`docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md`

For the full related architecture set, start at:

`docs/architect/agent-coordination/README.md`
````

### Correction before/after and reasons

```json
{
  "claimId": "claim_2ec7fc22c79d18b5f8d57cc79ec5e587",
  "source": "docs/architect/dispatch-control-plane-redesign.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-01-dispatch-control-plane-redesign.json",
  "reasons": [
    "R7-1/R7-6 labelled neutral placement metadata and extracted-unit consequence",
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_2ec7fc22c79d18b5f8d57cc79ec5e587",
    "sourceUnitDigest": "7b5d3df68b88c26058760be3ed0d7f21c05f84e1512a07212d26e953156fc154",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "dispatch-control-plane-redesign",
    "targetUnitDigest": "c5529f675233bdd0307872cb2a5404c4fde626c39567f9ba459ea5a1d13cf94f",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map proposal carrier: A17/A19 live-spec protection beats archiving a cited pointer. No redirect or root retirement here. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source heading docs/architect/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign (lines 1–1) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_2ec7fc22c79d18b5f8d57cc79ec5e587",
    "sourceUnitDigest": "7b5d3df68b88c26058760be3ed0d7f21c05f84e1512a07212d26e953156fc154",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "dispatch-control-plane-redesign",
    "targetUnitDigest": "b836a91ed4d5753a3192ae3a992e713477fc30524d664dc173024fb8ad889741",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source heading docs/architect/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign (lines 1–1) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```

## claim_c1d6c7e71ac871df50ade9fbd9c197ef

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Weak-exact.
Source: docs/architect/dispatch-control-plane-redesign.md#unheaded-block-1, lines 3–3.
Target: docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-4.
Source digest: d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025
Target digest: d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025
Shown source SHA256: d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025
Shown target SHA256: d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025

### Proposed decision

```json
{
  "claimId": "claim_c1d6c7e71ac871df50ade9fbd9c197ef",
  "sourceUnitDigest": "d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025",
  "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025",
  "targetAncestry": [
    "Dispatch Control Plane Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-1 (lines 3–3) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-4 (lines 27–27); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Canonical architecture moved to:
```

### Full target shown text

```text
Canonical architecture moved to:
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_c1d6c7e71ac871df50ade9fbd9c197ef",
  "source": "docs/architect/dispatch-control-plane-redesign.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-01-dispatch-control-plane-redesign.json",
  "reasons": [
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_c1d6c7e71ac871df50ade9fbd9c197ef",
    "sourceUnitDigest": "d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-4",
    "targetUnitDigest": "d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal carrier: A17/A19 live-spec protection beats archiving a cited pointer. No redirect or root retirement here. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-1 (lines 3–3) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-4 (lines 27–27); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_c1d6c7e71ac871df50ade9fbd9c197ef",
    "sourceUnitDigest": "d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-4",
    "targetUnitDigest": "d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-1 (lines 3–3) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-4 (lines 27–27); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```

## claim_6f1c18985eba573f3f0bc7af216dff30

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Unit-exact.
Source: docs/architect/dispatch-control-plane-redesign.md#unheaded-block-2, lines 5–5.
Target: docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-5.
Source digest: 9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d
Target digest: 9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d
Shown source SHA256: 9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d
Shown target SHA256: 9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d

### Proposed decision

```json
{
  "claimId": "claim_6f1c18985eba573f3f0bc7af216dff30",
  "sourceUnitDigest": "9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d",
  "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d",
  "targetAncestry": [
    "Dispatch Control Plane Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-2 (lines 5–5) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-5 (lines 29–29); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`docs/architect/agent-coordination/architecture/dispatch-control-plane.md`
```

### Full target shown text

```text
`docs/architect/agent-coordination/architecture/dispatch-control-plane.md`
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_6f1c18985eba573f3f0bc7af216dff30",
  "source": "docs/architect/dispatch-control-plane-redesign.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-01-dispatch-control-plane-redesign.json",
  "reasons": [
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_6f1c18985eba573f3f0bc7af216dff30",
    "sourceUnitDigest": "9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-5",
    "targetUnitDigest": "9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal carrier: A17/A19 live-spec protection beats archiving a cited pointer. No redirect or root retirement here. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-2 (lines 5–5) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-5 (lines 29–29); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_6f1c18985eba573f3f0bc7af216dff30",
    "sourceUnitDigest": "9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-5",
    "targetUnitDigest": "9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-2 (lines 5–5) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-5 (lines 29–29); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```

## claim_2aa7df6a5ea4807463b81b5181821702

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Unit-exact.
Source: docs/architect/dispatch-control-plane-redesign.md#unheaded-block-3, lines 7–7.
Target: docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-6.
Source digest: 05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9
Target digest: 05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9
Shown source SHA256: 05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9
Shown target SHA256: 05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9

### Proposed decision

```json
{
  "claimId": "claim_2aa7df6a5ea4807463b81b5181821702",
  "sourceUnitDigest": "05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9",
  "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9",
  "targetAncestry": [
    "Dispatch Control Plane Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-3 (lines 7–7) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-6 (lines 31–31); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The unresolved redesign source is retained at:
```

### Full target shown text

```text
The unresolved redesign source is retained at:
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_2aa7df6a5ea4807463b81b5181821702",
  "source": "docs/architect/dispatch-control-plane-redesign.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-01-dispatch-control-plane-redesign.json",
  "reasons": [
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_2aa7df6a5ea4807463b81b5181821702",
    "sourceUnitDigest": "05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-6",
    "targetUnitDigest": "05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal carrier: A17/A19 live-spec protection beats archiving a cited pointer. No redirect or root retirement here. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-3 (lines 7–7) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-6 (lines 31–31); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_2aa7df6a5ea4807463b81b5181821702",
    "sourceUnitDigest": "05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-6",
    "targetUnitDigest": "05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-3 (lines 7–7) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-6 (lines 31–31); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```

## claim_62153be70af7b764bdb0d17617240bbf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Unit-exact.
Source: docs/architect/dispatch-control-plane-redesign.md#unheaded-block-4, lines 9–9.
Target: docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-7.
Source digest: 9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c
Target digest: 9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c
Shown source SHA256: 9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c
Shown target SHA256: 9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c

### Proposed decision

```json
{
  "claimId": "claim_62153be70af7b764bdb0d17617240bbf",
  "sourceUnitDigest": "9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c",
  "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c",
  "targetAncestry": [
    "Dispatch Control Plane Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-4 (lines 9–9) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-7 (lines 33–33); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md`
```

### Full target shown text

```text
`docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md`
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_62153be70af7b764bdb0d17617240bbf",
  "source": "docs/architect/dispatch-control-plane-redesign.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-01-dispatch-control-plane-redesign.json",
  "reasons": [
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_62153be70af7b764bdb0d17617240bbf",
    "sourceUnitDigest": "9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-7",
    "targetUnitDigest": "9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal carrier: A17/A19 live-spec protection beats archiving a cited pointer. No redirect or root retirement here. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-4 (lines 9–9) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-7 (lines 33–33); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_62153be70af7b764bdb0d17617240bbf",
    "sourceUnitDigest": "9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-7",
    "targetUnitDigest": "9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-4 (lines 9–9) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-7 (lines 33–33); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```

## claim_47245c890a656f03be28dee6020f095a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Unit-exact.
Source: docs/architect/dispatch-control-plane-redesign.md#unheaded-block-5, lines 11–11.
Target: docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-8.
Source digest: 9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b
Target digest: 9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b
Shown source SHA256: 9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b
Shown target SHA256: 9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b

### Proposed decision

```json
{
  "claimId": "claim_47245c890a656f03be28dee6020f095a",
  "sourceUnitDigest": "9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b",
  "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b",
  "targetAncestry": [
    "Dispatch Control Plane Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-5 (lines 11–11) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-8 (lines 35–35); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
For the full related architecture set, start at:
```

### Full target shown text

```text
For the full related architecture set, start at:
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_47245c890a656f03be28dee6020f095a",
  "source": "docs/architect/dispatch-control-plane-redesign.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-01-dispatch-control-plane-redesign.json",
  "reasons": [
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_47245c890a656f03be28dee6020f095a",
    "sourceUnitDigest": "9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-8",
    "targetUnitDigest": "9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal carrier: A17/A19 live-spec protection beats archiving a cited pointer. No redirect or root retirement here. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-5 (lines 11–11) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-8 (lines 35–35); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_47245c890a656f03be28dee6020f095a",
    "sourceUnitDigest": "9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-8",
    "targetUnitDigest": "9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-5 (lines 11–11) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-8 (lines 35–35); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```

## claim_3811942485f2624b620b36b3a3aba933

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Unit-exact.
Source: docs/architect/dispatch-control-plane-redesign.md#unheaded-block-6, lines 13–13.
Target: docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-9.
Source digest: 08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d
Target digest: 08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d
Shown source SHA256: 08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d
Shown target SHA256: 08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d

### Proposed decision

```json
{
  "claimId": "claim_3811942485f2624b620b36b3a3aba933",
  "sourceUnitDigest": "08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d",
  "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d",
  "targetAncestry": [
    "Dispatch Control Plane Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-6 (lines 13–13) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-9 (lines 37–37); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`docs/architect/agent-coordination/README.md`
```

### Full target shown text

```text
`docs/architect/agent-coordination/README.md`
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_3811942485f2624b620b36b3a3aba933",
  "source": "docs/architect/dispatch-control-plane-redesign.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-01-dispatch-control-plane-redesign.json",
  "reasons": [
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_3811942485f2624b620b36b3a3aba933",
    "sourceUnitDigest": "08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-9",
    "targetUnitDigest": "08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal carrier: A17/A19 live-spec protection beats archiving a cited pointer. No redirect or root retirement here. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-6 (lines 13–13) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-9 (lines 37–37); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_3811942485f2624b620b36b3a3aba933",
    "sourceUnitDigest": "08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d",
    "targetOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "unheaded-block-9",
    "targetUnitDigest": "08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped pointer carrier; the full proposal lives at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Its three inline-code legacy destinations remain owed repoints at cutover. Evidence: docs/specs/runner.md:1273,1277–1278 still cites the redesign; source lines 3–13 redirect to the surviving area architecture/proposal. Full body remains at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. Complete source unheaded-block docs/architect/dispatch-control-plane-redesign.md#unheaded-block-6 (lines 13–13) is carried at docs/platform/proposals/dispatch-control-plane-redesign.md#unheaded-block-9 (lines 37–37); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```
