# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-04-doing-coordination-redesign.json
Original shard SHA256: 2e1f828a0423d70d3f99393b1129e8acd25528e423eacca3de1f53b69f8042f6
Source file: docs/architect/doing-coordination-redesign.md
Part 1/3; entries: **80**. Source-file group 4/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (1): `claim_4da3bc7c272c4f89a0d136bfa369c877`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 25; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_4da3bc7c272c4f89a0d136bfa369c877

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/doing-coordination-redesign.md#doing-coordination-redesign, lines 1–1.
Target: docs/platform/proposals/doing-coordination-redesign.md#doing-coordination-redesign.
Source digest: 8066fd6a83a2f2acf588dad72619b8c4676ede3e398cf176b7bda3868349c394
Target digest: da72635f1357888e24cffdc3a048739901fe210764c2adb2b6c2c378cfc4ec0f
Shown source SHA256: 142829018e65a07387aaf45954c0e6c095ed32cb51697238821db00d9626717f
Shown target SHA256: f19e756fcdf63497615ad102e247dd97a71c7dd3a95576c9a34d44868cdc63a9

### Proposed decision

```json
{
  "claimId": "claim_4da3bc7c272c4f89a0d136bfa369c877",
  "sourceUnitDigest": "8066fd6a83a2f2acf588dad72619b8c4676ede3e398cf176b7bda3868349c394",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "doing-coordination-redesign",
  "targetUnitDigest": "da72635f1357888e24cffdc3a048739901fe210764c2adb2b6c2c378cfc4ec0f",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#doing-coordination-redesign (lines 1–1) is carried at docs/platform/proposals/doing-coordination-redesign.md#doing-coordination-redesign (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
# Doing Coordination Redesign

Status: partially implemented — shipped via tsk-40m (mergedInto main,
mergedSha 401a2282ee381b5c2831e6f4d7538e834ada6503); §17 review checklist
re-audited 2026-08-26 (tsk-1sl) against real `src/` state — all 14 §15
Acceptance Criteria confirmed pass with cited evidence, zero unclassified
hit. Known gap found live during that same audit, tracked separately as
tsk-1ht: §16.3's own "Settlement after durable revision drift fails or
goes through explicit reconcile" only has the fail half implemented —
`settleClaim` (src/state/store.mjs) has no reconcile path, so `fgos
return` refuses for any claimed item edited mid-lifecycle (a routine,
expected pattern for `fgos-coding-planning`/`fgos-coding-discovering`),
even when the same claim-holder made every edit. Reproduced live, not
theoretical.
Date: 2026-08-25
Scope: fgOS work-item claim, coordination, durable event history, effective status views
History: original design/implementation context lives at
docs/history/runtime-claim-doing-separation/ (CONTEXT.md/plan.md/RESEARCH.md);
that CONTEXT.md's own SUPERSEDED banner points back here for anything it
still locks (D1-D6), consistent with this file remaining the live spec.
```

### Full target shown text

````text
# Doing Coordination Redesign

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/doing-coordination-redesign.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob d2f91b320e5dbb30d68c94895936bdc739860516
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/doing-coordination-redesign.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/doing-coordination-redesign.md).


Status: partially implemented — shipped via tsk-40m (mergedInto main,
mergedSha 401a2282ee381b5c2831e6f4d7538e834ada6503); §17 review checklist
re-audited 2026-08-26 (tsk-1sl) against real `src/` state — all 14 §15
Acceptance Criteria confirmed pass with cited evidence, zero unclassified
hit. Known gap found live during that same audit, tracked separately as
tsk-1ht: §16.3's own "Settlement after durable revision drift fails or
goes through explicit reconcile" only has the fail half implemented —
`settleClaim` (src/state/store.mjs) has no reconcile path, so `fgos
return` refuses for any claimed item edited mid-lifecycle (a routine,
expected pattern for `fgos-coding-planning`/`fgos-coding-discovering`),
even when the same claim-holder made every edit. Reproduced live, not
theoretical.
Date: 2026-08-25
Scope: fgOS work-item claim, coordination, durable event history, effective status views
History: original design/implementation context lives at
docs/history/runtime-claim-doing-separation/ (CONTEXT.md/plan.md/RESEARCH.md);
that CONTEXT.md's own SUPERSEDED banner points back here for anything it
still locks (D1-D6), consistent with this file remaining the live spec.
````

## claim_9e58375ad7618f7acef45d5448de37b0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-1, lines 3–20.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-4.
Source digest: cae7a3a33fa91b2f40d24e356223870d8afbc7fbb3c91eaebbce1c46ae1a8dd5
Target digest: cae7a3a33fa91b2f40d24e356223870d8afbc7fbb3c91eaebbce1c46ae1a8dd5
Shown source SHA256: cae7a3a33fa91b2f40d24e356223870d8afbc7fbb3c91eaebbce1c46ae1a8dd5
Shown target SHA256: cae7a3a33fa91b2f40d24e356223870d8afbc7fbb3c91eaebbce1c46ae1a8dd5

### Proposed decision

```json
{
  "claimId": "claim_9e58375ad7618f7acef45d5448de37b0",
  "sourceUnitDigest": "cae7a3a33fa91b2f40d24e356223870d8afbc7fbb3c91eaebbce1c46ae1a8dd5",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "cae7a3a33fa91b2f40d24e356223870d8afbc7fbb3c91eaebbce1c46ae1a8dd5",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-1 (lines 3–20) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-4 (lines 27–44); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Status: partially implemented — shipped via tsk-40m (mergedInto main,
mergedSha 401a2282ee381b5c2831e6f4d7538e834ada6503); §17 review checklist
re-audited 2026-08-26 (tsk-1sl) against real `src/` state — all 14 §15
Acceptance Criteria confirmed pass with cited evidence, zero unclassified
hit. Known gap found live during that same audit, tracked separately as
tsk-1ht: §16.3's own "Settlement after durable revision drift fails or
goes through explicit reconcile" only has the fail half implemented —
`settleClaim` (src/state/store.mjs) has no reconcile path, so `fgos
return` refuses for any claimed item edited mid-lifecycle (a routine,
expected pattern for `fgos-coding-planning`/`fgos-coding-discovering`),
even when the same claim-holder made every edit. Reproduced live, not
theoretical.
Date: 2026-08-25
Scope: fgOS work-item claim, coordination, durable event history, effective status views
History: original design/implementation context lives at
docs/history/runtime-claim-doing-separation/ (CONTEXT.md/plan.md/RESEARCH.md);
that CONTEXT.md's own SUPERSEDED banner points back here for anything it
still locks (D1-D6), consistent with this file remaining the live spec.
```

### Full target shown text

```text
Status: partially implemented — shipped via tsk-40m (mergedInto main,
mergedSha 401a2282ee381b5c2831e6f4d7538e834ada6503); §17 review checklist
re-audited 2026-08-26 (tsk-1sl) against real `src/` state — all 14 §15
Acceptance Criteria confirmed pass with cited evidence, zero unclassified
hit. Known gap found live during that same audit, tracked separately as
tsk-1ht: §16.3's own "Settlement after durable revision drift fails or
goes through explicit reconcile" only has the fail half implemented —
`settleClaim` (src/state/store.mjs) has no reconcile path, so `fgos
return` refuses for any claimed item edited mid-lifecycle (a routine,
expected pattern for `fgos-coding-planning`/`fgos-coding-discovering`),
even when the same claim-holder made every edit. Reproduced live, not
theoretical.
Date: 2026-08-25
Scope: fgOS work-item claim, coordination, durable event history, effective status views
History: original design/implementation context lives at
docs/history/runtime-claim-doing-separation/ (CONTEXT.md/plan.md/RESEARCH.md);
that CONTEXT.md's own SUPERSEDED banner points back here for anything it
still locks (D1-D6), consistent with this file remaining the live spec.
```

## claim_24b15504c2c27e9843b30e44f9f079b7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#1-problem-statement, lines 22–22.
Target: docs/platform/proposals/doing-coordination-redesign.md#1-problem-statement.
Source digest: 9719e7e52e1a79c8a7c096f24a59ccae92a62358e4a626be255bee3478f95657
Target digest: 9719e7e52e1a79c8a7c096f24a59ccae92a62358e4a626be255bee3478f95657
Shown source SHA256: 7d6bb5d73a00e70015a3a8fefcdaa8a9c98654e1509f27b0ce2dbd5dbba9822c
Shown target SHA256: 7d6bb5d73a00e70015a3a8fefcdaa8a9c98654e1509f27b0ce2dbd5dbba9822c

### Proposed decision

```json
{
  "claimId": "claim_24b15504c2c27e9843b30e44f9f079b7",
  "sourceUnitDigest": "9719e7e52e1a79c8a7c096f24a59ccae92a62358e4a626be255bee3478f95657",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "1-problem-statement",
  "targetUnitDigest": "9719e7e52e1a79c8a7c096f24a59ccae92a62358e4a626be255bee3478f95657",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#1-problem-statement (lines 22–22) is carried at docs/platform/proposals/doing-coordination-redesign.md#1-problem-statement (lines 46–46); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 1. Problem Statement

fgOS currently uses durable work-item status transitions as both workflow truth and live coordination. A worker claim writes a durable `work.move` event to `doing`; later return, reject, verify-fail, or release paths expect the item to still be durable `doing`.

That coupling creates the core failure mode:

- active ownership is short-lived runtime state, but it is written into the committed event stream;
- claim/release churn dirties the main checkout even when no durable work outcome exists yet;
- concurrent sessions must merge operational claim noise;
- readers cannot distinguish "durable workflow state" from "currently being worked";
- release-to-`todo` erases the difference between a never-started item and a previously attempted item unless they inspect incidental transition history.

The redesign separates those meanings without deleting `doing` as a domain concept.
```

### Full target shown text

```text
## 1. Problem Statement

fgOS currently uses durable work-item status transitions as both workflow truth and live coordination. A worker claim writes a durable `work.move` event to `doing`; later return, reject, verify-fail, or release paths expect the item to still be durable `doing`.

That coupling creates the core failure mode:

- active ownership is short-lived runtime state, but it is written into the committed event stream;
- claim/release churn dirties the main checkout even when no durable work outcome exists yet;
- concurrent sessions must merge operational claim noise;
- readers cannot distinguish "durable workflow state" from "currently being worked";
- release-to-`todo` erases the difference between a never-started item and a previously attempted item unless they inspect incidental transition history.

The redesign separates those meanings without deleting `doing` as a domain concept.
```

## claim_4ca45d465980606089245ec9e4250d53

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-2, lines 24–24.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-5.
Source digest: 0fb9c8009b3b54a2b0da9991c9764813449f09a17ac215ef9e47ea5ba5a6a149
Target digest: 0fb9c8009b3b54a2b0da9991c9764813449f09a17ac215ef9e47ea5ba5a6a149
Shown source SHA256: 0fb9c8009b3b54a2b0da9991c9764813449f09a17ac215ef9e47ea5ba5a6a149
Shown target SHA256: 0fb9c8009b3b54a2b0da9991c9764813449f09a17ac215ef9e47ea5ba5a6a149

### Proposed decision

```json
{
  "claimId": "claim_4ca45d465980606089245ec9e4250d53",
  "sourceUnitDigest": "0fb9c8009b3b54a2b0da9991c9764813449f09a17ac215ef9e47ea5ba5a6a149",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "0fb9c8009b3b54a2b0da9991c9764813449f09a17ac215ef9e47ea5ba5a6a149",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-2 (lines 24–24) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-5 (lines 48–48); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
fgOS currently uses durable work-item status transitions as both workflow truth and live coordination. A worker claim writes a durable `work.move` event to `doing`; later return, reject, verify-fail, or release paths expect the item to still be durable `doing`.
```

### Full target shown text

```text
fgOS currently uses durable work-item status transitions as both workflow truth and live coordination. A worker claim writes a durable `work.move` event to `doing`; later return, reject, verify-fail, or release paths expect the item to still be durable `doing`.
```

## claim_0ac1bbdfd82b993dbef37a43b378ce2b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-3, lines 26–26.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-6.
Source digest: dcdde6f35b997eaa9005891d327815ebef2abd81fcb62cd52a96fa3073b96b91
Target digest: dcdde6f35b997eaa9005891d327815ebef2abd81fcb62cd52a96fa3073b96b91
Shown source SHA256: dcdde6f35b997eaa9005891d327815ebef2abd81fcb62cd52a96fa3073b96b91
Shown target SHA256: dcdde6f35b997eaa9005891d327815ebef2abd81fcb62cd52a96fa3073b96b91

### Proposed decision

```json
{
  "claimId": "claim_0ac1bbdfd82b993dbef37a43b378ce2b",
  "sourceUnitDigest": "dcdde6f35b997eaa9005891d327815ebef2abd81fcb62cd52a96fa3073b96b91",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "dcdde6f35b997eaa9005891d327815ebef2abd81fcb62cd52a96fa3073b96b91",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-3 (lines 26–26) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-6 (lines 50–50); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
That coupling creates the core failure mode:
```

### Full target shown text

```text
That coupling creates the core failure mode:
```

## claim_2843d398495a705e4168383ba9e4c4f7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-4, lines 28–32.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-7.
Source digest: 4ac291c55ccf405d72a49e5df0c4c15d3ce68dc2d5afeb6c76c0aedef646dd8b
Target digest: 4ac291c55ccf405d72a49e5df0c4c15d3ce68dc2d5afeb6c76c0aedef646dd8b
Shown source SHA256: 4ac291c55ccf405d72a49e5df0c4c15d3ce68dc2d5afeb6c76c0aedef646dd8b
Shown target SHA256: 4ac291c55ccf405d72a49e5df0c4c15d3ce68dc2d5afeb6c76c0aedef646dd8b

### Proposed decision

```json
{
  "claimId": "claim_2843d398495a705e4168383ba9e4c4f7",
  "sourceUnitDigest": "4ac291c55ccf405d72a49e5df0c4c15d3ce68dc2d5afeb6c76c0aedef646dd8b",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "4ac291c55ccf405d72a49e5df0c4c15d3ce68dc2d5afeb6c76c0aedef646dd8b",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-4 (lines 28–32) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-7 (lines 52–56); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- active ownership is short-lived runtime state, but it is written into the committed event stream;
- claim/release churn dirties the main checkout even when no durable work outcome exists yet;
- concurrent sessions must merge operational claim noise;
- readers cannot distinguish "durable workflow state" from "currently being worked";
- release-to-`todo` erases the difference between a never-started item and a previously attempted item unless they inspect incidental transition history.
```

### Full target shown text

```text
- active ownership is short-lived runtime state, but it is written into the committed event stream;
- claim/release churn dirties the main checkout even when no durable work outcome exists yet;
- concurrent sessions must merge operational claim noise;
- readers cannot distinguish "durable workflow state" from "currently being worked";
- release-to-`todo` erases the difference between a never-started item and a previously attempted item unless they inspect incidental transition history.
```

## claim_fab0cd47b45637966f76ff9e995a306d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-5, lines 34–34.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-8.
Source digest: f76eb650ddf52b042e45401f19d5c7543351201e394cc0e9a3bb8ecfa82a42b8
Target digest: f76eb650ddf52b042e45401f19d5c7543351201e394cc0e9a3bb8ecfa82a42b8
Shown source SHA256: f76eb650ddf52b042e45401f19d5c7543351201e394cc0e9a3bb8ecfa82a42b8
Shown target SHA256: f76eb650ddf52b042e45401f19d5c7543351201e394cc0e9a3bb8ecfa82a42b8

### Proposed decision

```json
{
  "claimId": "claim_fab0cd47b45637966f76ff9e995a306d",
  "sourceUnitDigest": "f76eb650ddf52b042e45401f19d5c7543351201e394cc0e9a3bb8ecfa82a42b8",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "f76eb650ddf52b042e45401f19d5c7543351201e394cc0e9a3bb8ecfa82a42b8",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "1. Problem Statement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-5 (lines 34–34) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-8 (lines 58–58); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The redesign separates those meanings without deleting `doing` as a domain concept.
```

### Full target shown text

```text
The redesign separates those meanings without deleting `doing` as a domain concept.
```

## claim_25cea30cc46de79570d3603a4a9f2e84

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#2-goals, lines 36–36.
Target: docs/platform/proposals/doing-coordination-redesign.md#2-goals.
Source digest: 79da211f12517c6dabdad191a308b66831540c6c0118e778a882af9afbf7f595
Target digest: 79da211f12517c6dabdad191a308b66831540c6c0118e778a882af9afbf7f595
Shown source SHA256: fb3129c928c5f22b300b9f31e2eacc32a5ee489f083799514e1e1ddc77c8712b
Shown target SHA256: fb3129c928c5f22b300b9f31e2eacc32a5ee489f083799514e1e1ddc77c8712b

### Proposed decision

```json
{
  "claimId": "claim_25cea30cc46de79570d3603a4a9f2e84",
  "sourceUnitDigest": "79da211f12517c6dabdad191a308b66831540c6c0118e778a882af9afbf7f595",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "2-goals",
  "targetUnitDigest": "79da211f12517c6dabdad191a308b66831540c6c0118e778a882af9afbf7f595",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#2-goals (lines 36–36) is carried at docs/platform/proposals/doing-coordination-redesign.md#2-goals (lines 60–60); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 2. Goals

1. Keep `doing` visible and queryable for humans, workers, dashboards, and scheduling.
2. Stop writing durable current-status `doing` at claim-time.
3. Preserve durable history of every real execution attempt.
4. Distinguish:
   - never-started claimable work;
   - previously attempted but claimable work;
   - currently active work;
   - parked/final workflow states.
5. Prevent double-claim and double-settle without relying on `expectedStatus: "doing"`.
6. Reduce main-checkout churn by keeping live coordination out of committed event logs.
7. Keep the implementation file-based and process-local friendly. No daemon is required.
8. Make scheduling, listing, blocking, stale reclaim, and anti-loop read the correct state layer.
9. Preserve the user-facing meaning of `todo -> doing` as a logical coordination transition without committing that transition as durable workflow state.
```

### Full target shown text

```text
## 2. Goals

1. Keep `doing` visible and queryable for humans, workers, dashboards, and scheduling.
2. Stop writing durable current-status `doing` at claim-time.
3. Preserve durable history of every real execution attempt.
4. Distinguish:
   - never-started claimable work;
   - previously attempted but claimable work;
   - currently active work;
   - parked/final workflow states.
5. Prevent double-claim and double-settle without relying on `expectedStatus: "doing"`.
6. Reduce main-checkout churn by keeping live coordination out of committed event logs.
7. Keep the implementation file-based and process-local friendly. No daemon is required.
8. Make scheduling, listing, blocking, stale reclaim, and anti-loop read the correct state layer.
9. Preserve the user-facing meaning of `todo -> doing` as a logical coordination transition without committing that transition as durable workflow state.
```

## claim_d05ac17600a2345b8e0e14208f82e573

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-6, lines 38–50.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-9.
Source digest: 25981e9ec3831efc501f9d34b7263a2b651c314ccbe67cf666e5d20fd42e73f8
Target digest: 25981e9ec3831efc501f9d34b7263a2b651c314ccbe67cf666e5d20fd42e73f8
Shown source SHA256: 25981e9ec3831efc501f9d34b7263a2b651c314ccbe67cf666e5d20fd42e73f8
Shown target SHA256: 25981e9ec3831efc501f9d34b7263a2b651c314ccbe67cf666e5d20fd42e73f8

### Proposed decision

```json
{
  "claimId": "claim_d05ac17600a2345b8e0e14208f82e573",
  "sourceUnitDigest": "25981e9ec3831efc501f9d34b7263a2b651c314ccbe67cf666e5d20fd42e73f8",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "25981e9ec3831efc501f9d34b7263a2b651c314ccbe67cf666e5d20fd42e73f8",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "2. Goals"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-6 (lines 38–50) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-9 (lines 62–74); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Keep `doing` visible and queryable for humans, workers, dashboards, and scheduling.
2. Stop writing durable current-status `doing` at claim-time.
3. Preserve durable history of every real execution attempt.
4. Distinguish:
   - never-started claimable work;
   - previously attempted but claimable work;
   - currently active work;
   - parked/final workflow states.
5. Prevent double-claim and double-settle without relying on `expectedStatus: "doing"`.
6. Reduce main-checkout churn by keeping live coordination out of committed event logs.
7. Keep the implementation file-based and process-local friendly. No daemon is required.
8. Make scheduling, listing, blocking, stale reclaim, and anti-loop read the correct state layer.
9. Preserve the user-facing meaning of `todo -> doing` as a logical coordination transition without committing that transition as durable workflow state.
```

### Full target shown text

```text
1. Keep `doing` visible and queryable for humans, workers, dashboards, and scheduling.
2. Stop writing durable current-status `doing` at claim-time.
3. Preserve durable history of every real execution attempt.
4. Distinguish:
   - never-started claimable work;
   - previously attempted but claimable work;
   - currently active work;
   - parked/final workflow states.
5. Prevent double-claim and double-settle without relying on `expectedStatus: "doing"`.
6. Reduce main-checkout churn by keeping live coordination out of committed event logs.
7. Keep the implementation file-based and process-local friendly. No daemon is required.
8. Make scheduling, listing, blocking, stale reclaim, and anti-loop read the correct state layer.
9. Preserve the user-facing meaning of `todo -> doing` as a logical coordination transition without committing that transition as durable workflow state.
```

## claim_1c85e1bbe22ecc192a07bea5e423aa1d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#3-non-goals, lines 52–52.
Target: docs/platform/proposals/doing-coordination-redesign.md#3-non-goals.
Source digest: 3127f55340756f1813f34f2d529987d6890f3b0cf7580adf7050ab24f0ec0e1d
Target digest: 3127f55340756f1813f34f2d529987d6890f3b0cf7580adf7050ab24f0ec0e1d
Shown source SHA256: 82010e44ff5e5344420ab97b53161a567fd2bcc2eb13403d585f30fa950b3f5b
Shown target SHA256: 82010e44ff5e5344420ab97b53161a567fd2bcc2eb13403d585f30fa950b3f5b

### Proposed decision

```json
{
  "claimId": "claim_1c85e1bbe22ecc192a07bea5e423aa1d",
  "sourceUnitDigest": "3127f55340756f1813f34f2d529987d6890f3b0cf7580adf7050ab24f0ec0e1d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "3-non-goals",
  "targetUnitDigest": "3127f55340756f1813f34f2d529987d6890f3b0cf7580adf7050ab24f0ec0e1d",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#3-non-goals (lines 52–52) is carried at docs/platform/proposals/doing-coordination-redesign.md#3-non-goals (lines 76–76); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 3. Non-Goals

1. Do not add a daemon or long-running coordinator process.
2. Do not keep backward-compat branches that preserve durable claim-time `doing`.
3. Do not add `started` as a durable current status.
4. Do not make `state.json` a source of truth.
5. Do not solve every eventlog merge concern by hiding durable events. Durable outcome history remains committed.
```

### Full target shown text

```text
## 3. Non-Goals

1. Do not add a daemon or long-running coordinator process.
2. Do not keep backward-compat branches that preserve durable claim-time `doing`.
3. Do not add `started` as a durable current status.
4. Do not make `state.json` a source of truth.
5. Do not solve every eventlog merge concern by hiding durable events. Durable outcome history remains committed.
```

## claim_6c5e712fb1e41d7b43b05638e6e343cc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-7, lines 54–58.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-10.
Source digest: cdb6e26ab10b99089bd656913f4613e85d663df001e64499e2b0a2c8145df840
Target digest: cdb6e26ab10b99089bd656913f4613e85d663df001e64499e2b0a2c8145df840
Shown source SHA256: cdb6e26ab10b99089bd656913f4613e85d663df001e64499e2b0a2c8145df840
Shown target SHA256: cdb6e26ab10b99089bd656913f4613e85d663df001e64499e2b0a2c8145df840

### Proposed decision

```json
{
  "claimId": "claim_6c5e712fb1e41d7b43b05638e6e343cc",
  "sourceUnitDigest": "cdb6e26ab10b99089bd656913f4613e85d663df001e64499e2b0a2c8145df840",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "cdb6e26ab10b99089bd656913f4613e85d663df001e64499e2b0a2c8145df840",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "3. Non-Goals"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-7 (lines 54–58) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-10 (lines 78–82); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Do not add a daemon or long-running coordinator process.
2. Do not keep backward-compat branches that preserve durable claim-time `doing`.
3. Do not add `started` as a durable current status.
4. Do not make `state.json` a source of truth.
5. Do not solve every eventlog merge concern by hiding durable events. Durable outcome history remains committed.
```

### Full target shown text

```text
1. Do not add a daemon or long-running coordinator process.
2. Do not keep backward-compat branches that preserve durable claim-time `doing`.
3. Do not add `started` as a durable current status.
4. Do not make `state.json` a source of truth.
5. Do not solve every eventlog merge concern by hiding durable events. Durable outcome history remains committed.
```

## claim_2db84f44011ac03e6204ea32ae9b5653

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#4-core-decision, lines 60–60.
Target: docs/platform/proposals/doing-coordination-redesign.md#4-core-decision.
Source digest: 57c55c560bcbd2202e48580a5103c20d4df84d10ec6345998aa388c7a26a224f
Target digest: 57c55c560bcbd2202e48580a5103c20d4df84d10ec6345998aa388c7a26a224f
Shown source SHA256: 8397178f72c5039b1d06cda318ba29c6e300540d62f13613727237c2f8cf05e5
Shown target SHA256: 8397178f72c5039b1d06cda318ba29c6e300540d62f13613727237c2f8cf05e5

### Proposed decision

```json
{
  "claimId": "claim_2db84f44011ac03e6204ea32ae9b5653",
  "sourceUnitDigest": "57c55c560bcbd2202e48580a5103c20d4df84d10ec6345998aa388c7a26a224f",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "4-core-decision",
  "targetUnitDigest": "57c55c560bcbd2202e48580a5103c20d4df84d10ec6345998aa388c7a26a224f",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#4-core-decision (lines 60–60) is carried at docs/platform/proposals/doing-coordination-redesign.md#4-core-decision (lines 84–84); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 4. Core Decision

`doing` is split into two meanings:

1. `doing-current`
   - Represents an active claim right now.
   - Lives in runtime coordination.
   - Appears in the effective read model.
   - Is queryable via list/status APIs.
   - Is not written as durable current status at claim-time.

2. `doing-history`
   - Represents that an item had a real attempt/run.
   - Lives in durable event history.
   - Feeds audit, retry, anti-loop, and "has this ever been started?" decisions.
   - Is append-only and committed when the attempt settles, releases, fails, or is reclaimed.

The durable current status answers: "what stable workflow state is this item in?"

Runtime coordination answers: "who is actively holding this item right now?"

The effective view answers: "what should a user or scheduler see right now?"

The important distinction is not the word `doing`; it is which layer is allowed
to make `doing` true. A claim may make the effective view move from `todo` to
`doing`, but it must not make the durable event log move from `todo` to `doing`.
```

### Full target shown text

```text
## 4. Core Decision

`doing` is split into two meanings:

1. `doing-current`
   - Represents an active claim right now.
   - Lives in runtime coordination.
   - Appears in the effective read model.
   - Is queryable via list/status APIs.
   - Is not written as durable current status at claim-time.

2. `doing-history`
   - Represents that an item had a real attempt/run.
   - Lives in durable event history.
   - Feeds audit, retry, anti-loop, and "has this ever been started?" decisions.
   - Is append-only and committed when the attempt settles, releases, fails, or is reclaimed.

The durable current status answers: "what stable workflow state is this item in?"

Runtime coordination answers: "who is actively holding this item right now?"

The effective view answers: "what should a user or scheduler see right now?"

The important distinction is not the word `doing`; it is which layer is allowed
to make `doing` true. A claim may make the effective view move from `todo` to
`doing`, but it must not make the durable event log move from `todo` to `doing`.
```

## claim_2bed9fd390dae3ab8dbb7fd7820867cd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-8, lines 62–62.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-11.
Source digest: a6b1123eb77a46b6358a944de7ab73ae6e2df44a612b02f7211a1f1d873762fe
Target digest: a6b1123eb77a46b6358a944de7ab73ae6e2df44a612b02f7211a1f1d873762fe
Shown source SHA256: a6b1123eb77a46b6358a944de7ab73ae6e2df44a612b02f7211a1f1d873762fe
Shown target SHA256: a6b1123eb77a46b6358a944de7ab73ae6e2df44a612b02f7211a1f1d873762fe

### Proposed decision

```json
{
  "claimId": "claim_2bed9fd390dae3ab8dbb7fd7820867cd",
  "sourceUnitDigest": "a6b1123eb77a46b6358a944de7ab73ae6e2df44a612b02f7211a1f1d873762fe",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "a6b1123eb77a46b6358a944de7ab73ae6e2df44a612b02f7211a1f1d873762fe",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-8 (lines 62–62) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-11 (lines 86–86); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`doing` is split into two meanings:
```

### Full target shown text

```text
`doing` is split into two meanings:
```

## claim_7e5bba0f3b5374cc994e19e8701ede6f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-9, lines 64–69.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-12.
Source digest: 43f69e16829723ef629a252fcd3e2f3834ae55a1f8ec8a9b741ffa4e9ea75c25
Target digest: 43f69e16829723ef629a252fcd3e2f3834ae55a1f8ec8a9b741ffa4e9ea75c25
Shown source SHA256: 43f69e16829723ef629a252fcd3e2f3834ae55a1f8ec8a9b741ffa4e9ea75c25
Shown target SHA256: 43f69e16829723ef629a252fcd3e2f3834ae55a1f8ec8a9b741ffa4e9ea75c25

### Proposed decision

```json
{
  "claimId": "claim_7e5bba0f3b5374cc994e19e8701ede6f",
  "sourceUnitDigest": "43f69e16829723ef629a252fcd3e2f3834ae55a1f8ec8a9b741ffa4e9ea75c25",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "43f69e16829723ef629a252fcd3e2f3834ae55a1f8ec8a9b741ffa4e9ea75c25",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-9 (lines 64–69) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-12 (lines 88–93); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. `doing-current`
   - Represents an active claim right now.
   - Lives in runtime coordination.
   - Appears in the effective read model.
   - Is queryable via list/status APIs.
   - Is not written as durable current status at claim-time.
```

### Full target shown text

```text
1. `doing-current`
   - Represents an active claim right now.
   - Lives in runtime coordination.
   - Appears in the effective read model.
   - Is queryable via list/status APIs.
   - Is not written as durable current status at claim-time.
```

## claim_68da7c4797c9e4e4bc9370fad3ec7b29

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-10, lines 71–75.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-13.
Source digest: e40a1645600dbb2b8be7ed1a71c06509c9169496e004eaf0921b104285b4f355
Target digest: e40a1645600dbb2b8be7ed1a71c06509c9169496e004eaf0921b104285b4f355
Shown source SHA256: e40a1645600dbb2b8be7ed1a71c06509c9169496e004eaf0921b104285b4f355
Shown target SHA256: e40a1645600dbb2b8be7ed1a71c06509c9169496e004eaf0921b104285b4f355

### Proposed decision

```json
{
  "claimId": "claim_68da7c4797c9e4e4bc9370fad3ec7b29",
  "sourceUnitDigest": "e40a1645600dbb2b8be7ed1a71c06509c9169496e004eaf0921b104285b4f355",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "e40a1645600dbb2b8be7ed1a71c06509c9169496e004eaf0921b104285b4f355",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-10 (lines 71–75) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-13 (lines 95–99); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
2. `doing-history`
   - Represents that an item had a real attempt/run.
   - Lives in durable event history.
   - Feeds audit, retry, anti-loop, and "has this ever been started?" decisions.
   - Is append-only and committed when the attempt settles, releases, fails, or is reclaimed.
```

### Full target shown text

```text
2. `doing-history`
   - Represents that an item had a real attempt/run.
   - Lives in durable event history.
   - Feeds audit, retry, anti-loop, and "has this ever been started?" decisions.
   - Is append-only and committed when the attempt settles, releases, fails, or is reclaimed.
```

## claim_561d3d57f9758a74ffe22b4149ea6ae3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-11, lines 77–77.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-14.
Source digest: 4e104211ccf4ce7065812b4e8d5d360c66033c42316ebefa38e618b8efdf5825
Target digest: 4e104211ccf4ce7065812b4e8d5d360c66033c42316ebefa38e618b8efdf5825
Shown source SHA256: 4e104211ccf4ce7065812b4e8d5d360c66033c42316ebefa38e618b8efdf5825
Shown target SHA256: 4e104211ccf4ce7065812b4e8d5d360c66033c42316ebefa38e618b8efdf5825

### Proposed decision

```json
{
  "claimId": "claim_561d3d57f9758a74ffe22b4149ea6ae3",
  "sourceUnitDigest": "4e104211ccf4ce7065812b4e8d5d360c66033c42316ebefa38e618b8efdf5825",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "4e104211ccf4ce7065812b4e8d5d360c66033c42316ebefa38e618b8efdf5825",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-11 (lines 77–77) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-14 (lines 101–101); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The durable current status answers: "what stable workflow state is this item in?"
```

### Full target shown text

```text
The durable current status answers: "what stable workflow state is this item in?"
```

## claim_e0f33a9199aca1eccb930f7ec2000643

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-12, lines 79–79.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-15.
Source digest: b9cc295a56a054b0d8d5d6d2b63384ad45b1ced05e141917ead8b50af55625ce
Target digest: b9cc295a56a054b0d8d5d6d2b63384ad45b1ced05e141917ead8b50af55625ce
Shown source SHA256: b9cc295a56a054b0d8d5d6d2b63384ad45b1ced05e141917ead8b50af55625ce
Shown target SHA256: b9cc295a56a054b0d8d5d6d2b63384ad45b1ced05e141917ead8b50af55625ce

### Proposed decision

```json
{
  "claimId": "claim_e0f33a9199aca1eccb930f7ec2000643",
  "sourceUnitDigest": "b9cc295a56a054b0d8d5d6d2b63384ad45b1ced05e141917ead8b50af55625ce",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "b9cc295a56a054b0d8d5d6d2b63384ad45b1ced05e141917ead8b50af55625ce",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-12 (lines 79–79) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-15 (lines 103–103); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Runtime coordination answers: "who is actively holding this item right now?"
```

### Full target shown text

```text
Runtime coordination answers: "who is actively holding this item right now?"
```

## claim_4d9854299149d20bad9149dbf9752f6d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-13, lines 81–81.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-16.
Source digest: ef28331b4caeaff0c6eb9de812939402e8d25120e3f28ce234984d8fdfb7414c
Target digest: ef28331b4caeaff0c6eb9de812939402e8d25120e3f28ce234984d8fdfb7414c
Shown source SHA256: ef28331b4caeaff0c6eb9de812939402e8d25120e3f28ce234984d8fdfb7414c
Shown target SHA256: ef28331b4caeaff0c6eb9de812939402e8d25120e3f28ce234984d8fdfb7414c

### Proposed decision

```json
{
  "claimId": "claim_4d9854299149d20bad9149dbf9752f6d",
  "sourceUnitDigest": "ef28331b4caeaff0c6eb9de812939402e8d25120e3f28ce234984d8fdfb7414c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "ef28331b4caeaff0c6eb9de812939402e8d25120e3f28ce234984d8fdfb7414c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-13 (lines 81–81) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-16 (lines 105–105); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The effective view answers: "what should a user or scheduler see right now?"
```

### Full target shown text

```text
The effective view answers: "what should a user or scheduler see right now?"
```

## claim_63072e2d65635ebe8b93df19f03562a0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-14, lines 83–85.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-17.
Source digest: d0c631abefd8d4a84cd26feba7596454d71b2f6000285a43c1632b4a4568b53c
Target digest: d0c631abefd8d4a84cd26feba7596454d71b2f6000285a43c1632b4a4568b53c
Shown source SHA256: d0c631abefd8d4a84cd26feba7596454d71b2f6000285a43c1632b4a4568b53c
Shown target SHA256: d0c631abefd8d4a84cd26feba7596454d71b2f6000285a43c1632b4a4568b53c

### Proposed decision

```json
{
  "claimId": "claim_63072e2d65635ebe8b93df19f03562a0",
  "sourceUnitDigest": "d0c631abefd8d4a84cd26feba7596454d71b2f6000285a43c1632b4a4568b53c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "d0c631abefd8d4a84cd26feba7596454d71b2f6000285a43c1632b4a4568b53c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "4. Core Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-14 (lines 83–85) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-17 (lines 107–109); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The important distinction is not the word `doing`; it is which layer is allowed
to make `doing` true. A claim may make the effective view move from `todo` to
`doing`, but it must not make the durable event log move from `todo` to `doing`.
```

### Full target shown text

```text
The important distinction is not the word `doing`; it is which layer is allowed
to make `doing` true. A claim may make the effective view move from `todo` to
`doing`, but it must not make the durable event log move from `todo` to `doing`.
```

## claim_a9a44efd46fd94b7a37347608cf6f1cc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#5-state-layers, lines 87–87.
Target: docs/platform/proposals/doing-coordination-redesign.md#5-state-layers.
Source digest: 329062623ff7626ac78f53bfeaefb6dd591688ea720bc3d523321e339629f0b1
Target digest: 329062623ff7626ac78f53bfeaefb6dd591688ea720bc3d523321e339629f0b1
Shown source SHA256: 7fdebc6e0d1330e3cea7bc971e0ae69c3cf3ff6750099f822b3c3df5f3caa241
Shown target SHA256: 7fdebc6e0d1330e3cea7bc971e0ae69c3cf3ff6750099f822b3c3df5f3caa241

### Proposed decision

```json
{
  "claimId": "claim_a9a44efd46fd94b7a37347608cf6f1cc",
  "sourceUnitDigest": "329062623ff7626ac78f53bfeaefb6dd591688ea720bc3d523321e339629f0b1",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "5-state-layers",
  "targetUnitDigest": "329062623ff7626ac78f53bfeaefb6dd591688ea720bc3d523321e339629f0b1",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#5-state-layers (lines 87–87) is carried at docs/platform/proposals/doing-coordination-redesign.md#5-state-layers (lines 111–111); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 5. State Layers
```

### Full target shown text

```text
## 5. State Layers
```

## claim_92c8566d5ec1f93ed016b83d99f44adf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#51-durable-event-log, lines 89–89.
Target: docs/platform/proposals/doing-coordination-redesign.md#51-durable-event-log.
Source digest: 6c08f4b38c6ca93e8368f60d9c7411750f7432a9d69caa3e0cea9e549f1fc352
Target digest: 6c08f4b38c6ca93e8368f60d9c7411750f7432a9d69caa3e0cea9e549f1fc352
Shown source SHA256: 34dc3f68b1efe91b55d930ca6cbde83a94ef4dd4d2bd9e13dd10ebc7108a62e2
Shown target SHA256: 34dc3f68b1efe91b55d930ca6cbde83a94ef4dd4d2bd9e13dd10ebc7108a62e2

### Proposed decision

```json
{
  "claimId": "claim_92c8566d5ec1f93ed016b83d99f44adf",
  "sourceUnitDigest": "6c08f4b38c6ca93e8368f60d9c7411750f7432a9d69caa3e0cea9e549f1fc352",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "51-durable-event-log",
  "targetUnitDigest": "6c08f4b38c6ca93e8368f60d9c7411750f7432a9d69caa3e0cea9e549f1fc352",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#51-durable-event-log (lines 89–89) is carried at docs/platform/proposals/doing-coordination-redesign.md#51-durable-event-log (lines 113–113); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 5.1 Durable Event Log

The durable event log remains the committed truth for workflow outcomes and attempt history.

It should contain:

- work creation and edits;
- durable workflow moves such as `todo -> awaiting-approval`, `todo -> blocked`, `awaiting-approval -> delivered`;
- attempt/run settlement records;
- reclaim/release/abandon records when they have durable meaning.

It should not contain:

- claim-time `work.move -> doing`;
- heartbeat updates;
- last-activity observations;
- transient lock acquisition/release noise.
```

### Full target shown text

```text
### 5.1 Durable Event Log

The durable event log remains the committed truth for workflow outcomes and attempt history.

It should contain:

- work creation and edits;
- durable workflow moves such as `todo -> awaiting-approval`, `todo -> blocked`, `awaiting-approval -> delivered`;
- attempt/run settlement records;
- reclaim/release/abandon records when they have durable meaning.

It should not contain:

- claim-time `work.move -> doing`;
- heartbeat updates;
- last-activity observations;
- transient lock acquisition/release noise.
```

## claim_f11c0aa9c1c41ce9e37355aaf5c37826

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-15, lines 91–91.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-18.
Source digest: 753c997a46647b5b5755f942aa139b2dbe5b607cb120c761f240104a82600613
Target digest: 753c997a46647b5b5755f942aa139b2dbe5b607cb120c761f240104a82600613
Shown source SHA256: 753c997a46647b5b5755f942aa139b2dbe5b607cb120c761f240104a82600613
Shown target SHA256: 753c997a46647b5b5755f942aa139b2dbe5b607cb120c761f240104a82600613

### Proposed decision

```json
{
  "claimId": "claim_f11c0aa9c1c41ce9e37355aaf5c37826",
  "sourceUnitDigest": "753c997a46647b5b5755f942aa139b2dbe5b607cb120c761f240104a82600613",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "753c997a46647b5b5755f942aa139b2dbe5b607cb120c761f240104a82600613",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.1 Durable Event Log"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-15 (lines 91–91) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-18 (lines 115–115); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The durable event log remains the committed truth for workflow outcomes and attempt history.
```

### Full target shown text

```text
The durable event log remains the committed truth for workflow outcomes and attempt history.
```

## claim_de1ec18687c75e262f11857abc09793d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-16, lines 93–98.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-19.
Source digest: f4c43c042da87440338457a71e9b3b4fbc7d95209f90c39557c63b76c982635c
Target digest: f4c43c042da87440338457a71e9b3b4fbc7d95209f90c39557c63b76c982635c
Shown source SHA256: f4c43c042da87440338457a71e9b3b4fbc7d95209f90c39557c63b76c982635c
Shown target SHA256: f4c43c042da87440338457a71e9b3b4fbc7d95209f90c39557c63b76c982635c

### Proposed decision

```json
{
  "claimId": "claim_de1ec18687c75e262f11857abc09793d",
  "sourceUnitDigest": "f4c43c042da87440338457a71e9b3b4fbc7d95209f90c39557c63b76c982635c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "f4c43c042da87440338457a71e9b3b4fbc7d95209f90c39557c63b76c982635c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.1 Durable Event Log"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-16 (lines 93–98) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-19 (lines 117–122); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It should contain:

- work creation and edits;
- durable workflow moves such as `todo -> awaiting-approval`, `todo -> blocked`, `awaiting-approval -> delivered`;
- attempt/run settlement records;
- reclaim/release/abandon records when they have durable meaning.
```

### Full target shown text

```text
It should contain:

- work creation and edits;
- durable workflow moves such as `todo -> awaiting-approval`, `todo -> blocked`, `awaiting-approval -> delivered`;
- attempt/run settlement records;
- reclaim/release/abandon records when they have durable meaning.
```

## claim_7c726d7fd1bd25f8b0173e51ae7b8841

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-17, lines 100–105.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-20.
Source digest: 866b6eea3480f2632258b9d5e99500ef8bf288eb469a26dfc02f86681c40e254
Target digest: 866b6eea3480f2632258b9d5e99500ef8bf288eb469a26dfc02f86681c40e254
Shown source SHA256: 866b6eea3480f2632258b9d5e99500ef8bf288eb469a26dfc02f86681c40e254
Shown target SHA256: 866b6eea3480f2632258b9d5e99500ef8bf288eb469a26dfc02f86681c40e254

### Proposed decision

```json
{
  "claimId": "claim_7c726d7fd1bd25f8b0173e51ae7b8841",
  "sourceUnitDigest": "866b6eea3480f2632258b9d5e99500ef8bf288eb469a26dfc02f86681c40e254",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "866b6eea3480f2632258b9d5e99500ef8bf288eb469a26dfc02f86681c40e254",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.1 Durable Event Log"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-17 (lines 100–105) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-20 (lines 124–129); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It should not contain:

- claim-time `work.move -> doing`;
- heartbeat updates;
- last-activity observations;
- transient lock acquisition/release noise.
```

### Full target shown text

```text
It should not contain:

- claim-time `work.move -> doing`;
- heartbeat updates;
- last-activity observations;
- transient lock acquisition/release noise.
```

## claim_cc69f7eabc1327bb06b44d5b373841e0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#52-derived-durable-view, lines 107–107.
Target: docs/platform/proposals/doing-coordination-redesign.md#52-derived-durable-view.
Source digest: 40653b577fc54a4c8d172a3cb1369db8908770411a24eda1dcc991e09d7e6409
Target digest: 40653b577fc54a4c8d172a3cb1369db8908770411a24eda1dcc991e09d7e6409
Shown source SHA256: 1cafced9dfab8e8f8d1abe26c91ec6443c5f57e962924da8a953bd648cd72682
Shown target SHA256: 1cafced9dfab8e8f8d1abe26c91ec6443c5f57e962924da8a953bd648cd72682

### Proposed decision

```json
{
  "claimId": "claim_cc69f7eabc1327bb06b44d5b373841e0",
  "sourceUnitDigest": "40653b577fc54a4c8d172a3cb1369db8908770411a24eda1dcc991e09d7e6409",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "52-derived-durable-view",
  "targetUnitDigest": "40653b577fc54a4c8d172a3cb1369db8908770411a24eda1dcc991e09d7e6409",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#52-derived-durable-view (lines 107–107) is carried at docs/platform/proposals/doing-coordination-redesign.md#52-derived-durable-view (lines 131–131); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 5.2 Derived Durable View

`state.json` is a rebuildable cache. It must remain ignored and must never become an authority for coordination.

It may include derived attempt fields such as:

- `attemptCount`;
- `lastAttempt`;
- `hasStarted`;
- per-item durable revision/hash used for CAS.

It should not be used alone by any code path that needs to know whether an item is actively claimed.
```

### Full target shown text

```text
### 5.2 Derived Durable View

`state.json` is a rebuildable cache. It must remain ignored and must never become an authority for coordination.

It may include derived attempt fields such as:

- `attemptCount`;
- `lastAttempt`;
- `hasStarted`;
- per-item durable revision/hash used for CAS.

It should not be used alone by any code path that needs to know whether an item is actively claimed.
```

## claim_dd9d9195a3ed51819ca11ed2b9fa2086

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-18, lines 109–109.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-21.
Source digest: ab214f0bde7c40a3d90e32d2bad98bee59264c25826a76f4f44a8e746c2fa770
Target digest: ab214f0bde7c40a3d90e32d2bad98bee59264c25826a76f4f44a8e746c2fa770
Shown source SHA256: ab214f0bde7c40a3d90e32d2bad98bee59264c25826a76f4f44a8e746c2fa770
Shown target SHA256: ab214f0bde7c40a3d90e32d2bad98bee59264c25826a76f4f44a8e746c2fa770

### Proposed decision

```json
{
  "claimId": "claim_dd9d9195a3ed51819ca11ed2b9fa2086",
  "sourceUnitDigest": "ab214f0bde7c40a3d90e32d2bad98bee59264c25826a76f4f44a8e746c2fa770",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "ab214f0bde7c40a3d90e32d2bad98bee59264c25826a76f4f44a8e746c2fa770",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.2 Derived Durable View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-18 (lines 109–109) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-21 (lines 133–133); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`state.json` is a rebuildable cache. It must remain ignored and must never become an authority for coordination.
```

### Full target shown text

```text
`state.json` is a rebuildable cache. It must remain ignored and must never become an authority for coordination.
```

## claim_17f3fe0ea7ff2f9be66134ffb505337b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-19, lines 111–111.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-22.
Source digest: 7b6e31c94b488b1a6195e6baeae4299f243897278bb52dd0ffed7469ec19b12c
Target digest: 7b6e31c94b488b1a6195e6baeae4299f243897278bb52dd0ffed7469ec19b12c
Shown source SHA256: 7b6e31c94b488b1a6195e6baeae4299f243897278bb52dd0ffed7469ec19b12c
Shown target SHA256: 7b6e31c94b488b1a6195e6baeae4299f243897278bb52dd0ffed7469ec19b12c

### Proposed decision

```json
{
  "claimId": "claim_17f3fe0ea7ff2f9be66134ffb505337b",
  "sourceUnitDigest": "7b6e31c94b488b1a6195e6baeae4299f243897278bb52dd0ffed7469ec19b12c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "7b6e31c94b488b1a6195e6baeae4299f243897278bb52dd0ffed7469ec19b12c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.2 Derived Durable View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-19 (lines 111–111) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-22 (lines 135–135); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It may include derived attempt fields such as:
```

### Full target shown text

```text
It may include derived attempt fields such as:
```

## claim_7bbd002d8794d27de7c86a8ba73b74ad

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-20, lines 113–116.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-23.
Source digest: 7075a25e3f32f23a84c68e2af066849ce8ea1c92db12050e917bf47b6dc94fc9
Target digest: 7075a25e3f32f23a84c68e2af066849ce8ea1c92db12050e917bf47b6dc94fc9
Shown source SHA256: 7075a25e3f32f23a84c68e2af066849ce8ea1c92db12050e917bf47b6dc94fc9
Shown target SHA256: 7075a25e3f32f23a84c68e2af066849ce8ea1c92db12050e917bf47b6dc94fc9

### Proposed decision

```json
{
  "claimId": "claim_7bbd002d8794d27de7c86a8ba73b74ad",
  "sourceUnitDigest": "7075a25e3f32f23a84c68e2af066849ce8ea1c92db12050e917bf47b6dc94fc9",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "7075a25e3f32f23a84c68e2af066849ce8ea1c92db12050e917bf47b6dc94fc9",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.2 Derived Durable View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-20 (lines 113–116) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-23 (lines 137–140); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `attemptCount`;
- `lastAttempt`;
- `hasStarted`;
- per-item durable revision/hash used for CAS.
```

### Full target shown text

```text
- `attemptCount`;
- `lastAttempt`;
- `hasStarted`;
- per-item durable revision/hash used for CAS.
```

## claim_724c1ffe7b56c034b4674d7b6599b20c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-21, lines 118–118.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-24.
Source digest: 9ae479101583f24fba1cdbba3ad2a6bd4875f4e543e6be764f98785d66878583
Target digest: 9ae479101583f24fba1cdbba3ad2a6bd4875f4e543e6be764f98785d66878583
Shown source SHA256: 9ae479101583f24fba1cdbba3ad2a6bd4875f4e543e6be764f98785d66878583
Shown target SHA256: 9ae479101583f24fba1cdbba3ad2a6bd4875f4e543e6be764f98785d66878583

### Proposed decision

```json
{
  "claimId": "claim_724c1ffe7b56c034b4674d7b6599b20c",
  "sourceUnitDigest": "9ae479101583f24fba1cdbba3ad2a6bd4875f4e543e6be764f98785d66878583",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "9ae479101583f24fba1cdbba3ad2a6bd4875f4e543e6be764f98785d66878583",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.2 Derived Durable View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-21 (lines 118–118) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-24 (lines 142–142); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It should not be used alone by any code path that needs to know whether an item is actively claimed.
```

### Full target shown text

```text
It should not be used alone by any code path that needs to know whether an item is actively claimed.
```

## claim_04f0d27703857acc4ff54e1a559763e3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#53-runtime-coordination-store, lines 120–120.
Target: docs/platform/proposals/doing-coordination-redesign.md#53-runtime-coordination-store.
Source digest: e8789fc66a2d2ef17a7066a1f2963d6b3f9548292e01d3dbbad086cab1dc72dc
Target digest: e8789fc66a2d2ef17a7066a1f2963d6b3f9548292e01d3dbbad086cab1dc72dc
Shown source SHA256: 525484df9657f60bae972f2d20c95de5b647cc90e23a0556ecbe20e5dced6927
Shown target SHA256: 525484df9657f60bae972f2d20c95de5b647cc90e23a0556ecbe20e5dced6927

### Proposed decision

```json
{
  "claimId": "claim_04f0d27703857acc4ff54e1a559763e3",
  "sourceUnitDigest": "e8789fc66a2d2ef17a7066a1f2963d6b3f9548292e01d3dbbad086cab1dc72dc",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "53-runtime-coordination-store",
  "targetUnitDigest": "e8789fc66a2d2ef17a7066a1f2963d6b3f9548292e01d3dbbad086cab1dc72dc",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#53-runtime-coordination-store (lines 120–120) is carried at docs/platform/proposals/doing-coordination-redesign.md#53-runtime-coordination-store (lines 144–144); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 5.3 Runtime Coordination Store

Runtime coordination stores active claims. It is local/runtime state and should be gitignored.

It is the authority for:

- active claim ownership;
- active `doing-current`;
- claim liveness;
- claim release;
- claim reclaim eligibility;
- preventing another process from picking the same item.

It is not the authority for:

- delivered/blocked/awaiting workflow state;
- audit history;
- attempt counts;
- anti-loop history.
```

### Full target shown text

```text
### 5.3 Runtime Coordination Store

Runtime coordination stores active claims. It is local/runtime state and should be gitignored.

It is the authority for:

- active claim ownership;
- active `doing-current`;
- claim liveness;
- claim release;
- claim reclaim eligibility;
- preventing another process from picking the same item.

It is not the authority for:

- delivered/blocked/awaiting workflow state;
- audit history;
- attempt counts;
- anti-loop history.
```

## claim_7f834cd4a993c515f572246fe6821da9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-22, lines 122–122.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-25.
Source digest: 68d2297b186e4d2817126793244657031b19c9759daf62870d0a53cec73b7f05
Target digest: 68d2297b186e4d2817126793244657031b19c9759daf62870d0a53cec73b7f05
Shown source SHA256: 68d2297b186e4d2817126793244657031b19c9759daf62870d0a53cec73b7f05
Shown target SHA256: 68d2297b186e4d2817126793244657031b19c9759daf62870d0a53cec73b7f05

### Proposed decision

```json
{
  "claimId": "claim_7f834cd4a993c515f572246fe6821da9",
  "sourceUnitDigest": "68d2297b186e4d2817126793244657031b19c9759daf62870d0a53cec73b7f05",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "68d2297b186e4d2817126793244657031b19c9759daf62870d0a53cec73b7f05",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.3 Runtime Coordination Store"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-22 (lines 122–122) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-25 (lines 146–146); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Runtime coordination stores active claims. It is local/runtime state and should be gitignored.
```

### Full target shown text

```text
Runtime coordination stores active claims. It is local/runtime state and should be gitignored.
```

## claim_e1269626460c7cf02822911ee7960912

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-23, lines 124–124.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-26.
Source digest: b40f12a1ecde08164b1641d353cb37df1595600cef69f26fef2b48595a741ba2
Target digest: b40f12a1ecde08164b1641d353cb37df1595600cef69f26fef2b48595a741ba2
Shown source SHA256: b40f12a1ecde08164b1641d353cb37df1595600cef69f26fef2b48595a741ba2
Shown target SHA256: b40f12a1ecde08164b1641d353cb37df1595600cef69f26fef2b48595a741ba2

### Proposed decision

```json
{
  "claimId": "claim_e1269626460c7cf02822911ee7960912",
  "sourceUnitDigest": "b40f12a1ecde08164b1641d353cb37df1595600cef69f26fef2b48595a741ba2",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "b40f12a1ecde08164b1641d353cb37df1595600cef69f26fef2b48595a741ba2",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.3 Runtime Coordination Store"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-23 (lines 124–124) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-26 (lines 148–148); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It is the authority for:
```

### Full target shown text

```text
It is the authority for:
```

## claim_7c0ad13ca524199f415afbf6bb94aa0f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-24, lines 126–131.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-27.
Source digest: fd7d4129ccc8fb10604a63e8f89c42c486ec3f7d4fb3982c4ae9c6fc3de486ab
Target digest: fd7d4129ccc8fb10604a63e8f89c42c486ec3f7d4fb3982c4ae9c6fc3de486ab
Shown source SHA256: fd7d4129ccc8fb10604a63e8f89c42c486ec3f7d4fb3982c4ae9c6fc3de486ab
Shown target SHA256: fd7d4129ccc8fb10604a63e8f89c42c486ec3f7d4fb3982c4ae9c6fc3de486ab

### Proposed decision

```json
{
  "claimId": "claim_7c0ad13ca524199f415afbf6bb94aa0f",
  "sourceUnitDigest": "fd7d4129ccc8fb10604a63e8f89c42c486ec3f7d4fb3982c4ae9c6fc3de486ab",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "fd7d4129ccc8fb10604a63e8f89c42c486ec3f7d4fb3982c4ae9c6fc3de486ab",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.3 Runtime Coordination Store"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-24 (lines 126–131) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-27 (lines 150–155); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- active claim ownership;
- active `doing-current`;
- claim liveness;
- claim release;
- claim reclaim eligibility;
- preventing another process from picking the same item.
```

### Full target shown text

```text
- active claim ownership;
- active `doing-current`;
- claim liveness;
- claim release;
- claim reclaim eligibility;
- preventing another process from picking the same item.
```

## claim_b803f52825aa2cce172882475f0c3d5b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-25, lines 133–133.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-28.
Source digest: 8e7d172727773ae5d89728f39771fe5ae69c1474e36850d50f0cdb62e528641c
Target digest: 8e7d172727773ae5d89728f39771fe5ae69c1474e36850d50f0cdb62e528641c
Shown source SHA256: 8e7d172727773ae5d89728f39771fe5ae69c1474e36850d50f0cdb62e528641c
Shown target SHA256: 8e7d172727773ae5d89728f39771fe5ae69c1474e36850d50f0cdb62e528641c

### Proposed decision

```json
{
  "claimId": "claim_b803f52825aa2cce172882475f0c3d5b",
  "sourceUnitDigest": "8e7d172727773ae5d89728f39771fe5ae69c1474e36850d50f0cdb62e528641c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "8e7d172727773ae5d89728f39771fe5ae69c1474e36850d50f0cdb62e528641c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.3 Runtime Coordination Store"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-25 (lines 133–133) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-28 (lines 157–157); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It is not the authority for:
```

### Full target shown text

```text
It is not the authority for:
```

## claim_d81adfd45b0783bad64244746b74cd44

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-26, lines 135–138.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-29.
Source digest: 6e60447cdce8fa7e714a6f54060549c7c8a21af53f414839aee0dbbb8b12a783
Target digest: 6e60447cdce8fa7e714a6f54060549c7c8a21af53f414839aee0dbbb8b12a783
Shown source SHA256: 6e60447cdce8fa7e714a6f54060549c7c8a21af53f414839aee0dbbb8b12a783
Shown target SHA256: 6e60447cdce8fa7e714a6f54060549c7c8a21af53f414839aee0dbbb8b12a783

### Proposed decision

```json
{
  "claimId": "claim_d81adfd45b0783bad64244746b74cd44",
  "sourceUnitDigest": "6e60447cdce8fa7e714a6f54060549c7c8a21af53f414839aee0dbbb8b12a783",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "6e60447cdce8fa7e714a6f54060549c7c8a21af53f414839aee0dbbb8b12a783",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.3 Runtime Coordination Store"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-26 (lines 135–138) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-29 (lines 159–162); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- delivered/blocked/awaiting workflow state;
- audit history;
- attempt counts;
- anti-loop history.
```

### Full target shown text

```text
- delivered/blocked/awaiting workflow state;
- audit history;
- attempt counts;
- anti-loop history.
```

## claim_f565c8a8da8e82a3e932a5a20ab73560

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#54-effective-view, lines 140–140.
Target: docs/platform/proposals/doing-coordination-redesign.md#54-effective-view.
Source digest: 78495a0e6b4a27635946a0ecda76efac223ef76b0c5f7a903232bb5a8a6ed731
Target digest: 78495a0e6b4a27635946a0ecda76efac223ef76b0c5f7a903232bb5a8a6ed731
Shown source SHA256: dd069e5c059711604386595a6c1a499104b2802dfd8d831f87dd2d37c11a8399
Shown target SHA256: dd069e5c059711604386595a6c1a499104b2802dfd8d831f87dd2d37c11a8399

### Proposed decision

```json
{
  "claimId": "claim_f565c8a8da8e82a3e932a5a20ab73560",
  "sourceUnitDigest": "78495a0e6b4a27635946a0ecda76efac223ef76b0c5f7a903232bb5a8a6ed731",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "54-effective-view",
  "targetUnitDigest": "78495a0e6b4a27635946a0ecda76efac223ef76b0c5f7a903232bb5a8a6ed731",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#54-effective-view (lines 140–140) is carried at docs/platform/proposals/doing-coordination-redesign.md#54-effective-view (lines 164–164); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 5.4 Effective View

The effective view overlays runtime claims onto durable state:

```txt
effectiveStatus(item) =
  activeClaim(item.id) exists
  and claim still matches the durable base it captured
  and durableStatus(item) is not a parked/final state
    ? "doing"
    : durableStatus(item)
```

This is the view consumed by:

- `list --status doing`;
- dashboards;
- `pick`;
- `take`;
- frontier calculation;
- worker-slot visibility;
- open descendant checks;
- stale claim presentation;
- any user-facing status query.

The effective view must preserve durable attempt metadata. A previously attempted but released item still shows as claimable, but carries `attemptCount > 0` or `hasStarted = true`.

If the durable item has moved away from the claim's captured base status, the
claim is stale, paused, or already settled. It must not be allowed to mask the
durable status by continuing to render as effective `doing`.
````

### Full target shown text

````text
### 5.4 Effective View

The effective view overlays runtime claims onto durable state:

```txt
effectiveStatus(item) =
  activeClaim(item.id) exists
  and claim still matches the durable base it captured
  and durableStatus(item) is not a parked/final state
    ? "doing"
    : durableStatus(item)
```

This is the view consumed by:

- `list --status doing`;
- dashboards;
- `pick`;
- `take`;
- frontier calculation;
- worker-slot visibility;
- open descendant checks;
- stale claim presentation;
- any user-facing status query.

The effective view must preserve durable attempt metadata. A previously attempted but released item still shows as claimable, but carries `attemptCount > 0` or `hasStarted = true`.

If the durable item has moved away from the claim's captured base status, the
claim is stale, paused, or already settled. It must not be allowed to mask the
durable status by continuing to render as effective `doing`.
````

## claim_6e8375ee244fbbe0e4b27a78a936b2a2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-27, lines 142–142.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-30.
Source digest: b861121e574c0680d2cfded19a01d67eb4e7153f962828ed98661ab60fb98a33
Target digest: b861121e574c0680d2cfded19a01d67eb4e7153f962828ed98661ab60fb98a33
Shown source SHA256: b861121e574c0680d2cfded19a01d67eb4e7153f962828ed98661ab60fb98a33
Shown target SHA256: b861121e574c0680d2cfded19a01d67eb4e7153f962828ed98661ab60fb98a33

### Proposed decision

```json
{
  "claimId": "claim_6e8375ee244fbbe0e4b27a78a936b2a2",
  "sourceUnitDigest": "b861121e574c0680d2cfded19a01d67eb4e7153f962828ed98661ab60fb98a33",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "b861121e574c0680d2cfded19a01d67eb4e7153f962828ed98661ab60fb98a33",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.4 Effective View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-27 (lines 142–142) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-30 (lines 166–166); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The effective view overlays runtime claims onto durable state:
```

### Full target shown text

```text
The effective view overlays runtime claims onto durable state:
```

## claim_c9c82f5dffb53f15d686cd12e9810dae

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-28, lines 144–151.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-31.
Source digest: 32bf703bc2ec6dbdd012bff74b1697a58972a7ba921b817732646af285b40fcc
Target digest: 32bf703bc2ec6dbdd012bff74b1697a58972a7ba921b817732646af285b40fcc
Shown source SHA256: 32bf703bc2ec6dbdd012bff74b1697a58972a7ba921b817732646af285b40fcc
Shown target SHA256: 32bf703bc2ec6dbdd012bff74b1697a58972a7ba921b817732646af285b40fcc

### Proposed decision

```json
{
  "claimId": "claim_c9c82f5dffb53f15d686cd12e9810dae",
  "sourceUnitDigest": "32bf703bc2ec6dbdd012bff74b1697a58972a7ba921b817732646af285b40fcc",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "32bf703bc2ec6dbdd012bff74b1697a58972a7ba921b817732646af285b40fcc",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.4 Effective View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-28 (lines 144–151) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-31 (lines 168–175); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
effectiveStatus(item) =
  activeClaim(item.id) exists
  and claim still matches the durable base it captured
  and durableStatus(item) is not a parked/final state
    ? "doing"
    : durableStatus(item)
```
````

### Full target shown text

````text
```txt
effectiveStatus(item) =
  activeClaim(item.id) exists
  and claim still matches the durable base it captured
  and durableStatus(item) is not a parked/final state
    ? "doing"
    : durableStatus(item)
```
````

## claim_7aa366d4e95da7cb0253a50ef58a534e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-29, lines 153–153.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-32.
Source digest: a2466d894016dbf9b27b138ed5822094c0baa51f37523f67793bed18da2c198a
Target digest: a2466d894016dbf9b27b138ed5822094c0baa51f37523f67793bed18da2c198a
Shown source SHA256: a2466d894016dbf9b27b138ed5822094c0baa51f37523f67793bed18da2c198a
Shown target SHA256: a2466d894016dbf9b27b138ed5822094c0baa51f37523f67793bed18da2c198a

### Proposed decision

```json
{
  "claimId": "claim_7aa366d4e95da7cb0253a50ef58a534e",
  "sourceUnitDigest": "a2466d894016dbf9b27b138ed5822094c0baa51f37523f67793bed18da2c198a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "a2466d894016dbf9b27b138ed5822094c0baa51f37523f67793bed18da2c198a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.4 Effective View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-29 (lines 153–153) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-32 (lines 177–177); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This is the view consumed by:
```

### Full target shown text

```text
This is the view consumed by:
```

## claim_a32cc38a8c33ad45ed6d680404b69fe9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-30, lines 155–163.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-33.
Source digest: f1401336f552fe9454264a509609845d224f2fcadbdd465a0e8c5c69375d87b6
Target digest: f1401336f552fe9454264a509609845d224f2fcadbdd465a0e8c5c69375d87b6
Shown source SHA256: f1401336f552fe9454264a509609845d224f2fcadbdd465a0e8c5c69375d87b6
Shown target SHA256: f1401336f552fe9454264a509609845d224f2fcadbdd465a0e8c5c69375d87b6

### Proposed decision

```json
{
  "claimId": "claim_a32cc38a8c33ad45ed6d680404b69fe9",
  "sourceUnitDigest": "f1401336f552fe9454264a509609845d224f2fcadbdd465a0e8c5c69375d87b6",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "f1401336f552fe9454264a509609845d224f2fcadbdd465a0e8c5c69375d87b6",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.4 Effective View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-30 (lines 155–163) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-33 (lines 179–187); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `list --status doing`;
- dashboards;
- `pick`;
- `take`;
- frontier calculation;
- worker-slot visibility;
- open descendant checks;
- stale claim presentation;
- any user-facing status query.
```

### Full target shown text

```text
- `list --status doing`;
- dashboards;
- `pick`;
- `take`;
- frontier calculation;
- worker-slot visibility;
- open descendant checks;
- stale claim presentation;
- any user-facing status query.
```

## claim_9266aac5efedbb133a27a009ad9ff359

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-31, lines 165–165.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-34.
Source digest: 446aef1fe6ab99c43b122d5a9e5a4c1359ee9a8a272922c785279b7795c5a48c
Target digest: 446aef1fe6ab99c43b122d5a9e5a4c1359ee9a8a272922c785279b7795c5a48c
Shown source SHA256: 446aef1fe6ab99c43b122d5a9e5a4c1359ee9a8a272922c785279b7795c5a48c
Shown target SHA256: 446aef1fe6ab99c43b122d5a9e5a4c1359ee9a8a272922c785279b7795c5a48c

### Proposed decision

```json
{
  "claimId": "claim_9266aac5efedbb133a27a009ad9ff359",
  "sourceUnitDigest": "446aef1fe6ab99c43b122d5a9e5a4c1359ee9a8a272922c785279b7795c5a48c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "446aef1fe6ab99c43b122d5a9e5a4c1359ee9a8a272922c785279b7795c5a48c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.4 Effective View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-31 (lines 165–165) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-34 (lines 189–189); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The effective view must preserve durable attempt metadata. A previously attempted but released item still shows as claimable, but carries `attemptCount > 0` or `hasStarted = true`.
```

### Full target shown text

```text
The effective view must preserve durable attempt metadata. A previously attempted but released item still shows as claimable, but carries `attemptCount > 0` or `hasStarted = true`.
```

## claim_f33a1f7b2f11208738d166e00e54579f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-32, lines 167–169.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-35.
Source digest: 4465d7476029a5917f1578ac9bfad17260d9e2c7563838b2bff918e835d797f6
Target digest: 4465d7476029a5917f1578ac9bfad17260d9e2c7563838b2bff918e835d797f6
Shown source SHA256: 4465d7476029a5917f1578ac9bfad17260d9e2c7563838b2bff918e835d797f6
Shown target SHA256: 4465d7476029a5917f1578ac9bfad17260d9e2c7563838b2bff918e835d797f6

### Proposed decision

```json
{
  "claimId": "claim_f33a1f7b2f11208738d166e00e54579f",
  "sourceUnitDigest": "4465d7476029a5917f1578ac9bfad17260d9e2c7563838b2bff918e835d797f6",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "4465d7476029a5917f1578ac9bfad17260d9e2c7563838b2bff918e835d797f6",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "5. State Layers",
    "5.4 Effective View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-32 (lines 167–169) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-35 (lines 191–193); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
If the durable item has moved away from the claim's captured base status, the
claim is stale, paused, or already settled. It must not be allowed to mask the
durable status by continuing to render as effective `doing`.
```

### Full target shown text

```text
If the durable item has moved away from the claim's captured base status, the
claim is stale, paused, or already settled. It must not be allowed to mask the
durable status by continuing to render as effective `doing`.
```

## claim_bafc6b169d8fcb218a99e80443535dce

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#6-status-semantics, lines 171–171.
Target: docs/platform/proposals/doing-coordination-redesign.md#6-status-semantics.
Source digest: 15af5ce370b31092854dade7d158b9e96ffa48fd8ce35324bb5d88a072fc2dd5
Target digest: 15af5ce370b31092854dade7d158b9e96ffa48fd8ce35324bb5d88a072fc2dd5
Shown source SHA256: 287dcee0df2a3df7d470fd19957357ffd7ac2edad0f11f2865f93f9765babc93
Shown target SHA256: 287dcee0df2a3df7d470fd19957357ffd7ac2edad0f11f2865f93f9765babc93

### Proposed decision

```json
{
  "claimId": "claim_bafc6b169d8fcb218a99e80443535dce",
  "sourceUnitDigest": "15af5ce370b31092854dade7d158b9e96ffa48fd8ce35324bb5d88a072fc2dd5",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "6-status-semantics",
  "targetUnitDigest": "15af5ce370b31092854dade7d158b9e96ffa48fd8ce35324bb5d88a072fc2dd5",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#6-status-semantics (lines 171–171) is carried at docs/platform/proposals/doing-coordination-redesign.md#6-status-semantics (lines 195–195); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 6. Status Semantics
```

### Full target shown text

```text
## 6. Status Semantics
```

## claim_3df6c8a1b11c1733eebfee3a002b48db

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#61-durable-current-status, lines 173–173.
Target: docs/platform/proposals/doing-coordination-redesign.md#61-durable-current-status.
Source digest: e271b3aea2bf01a9af373b993bb4c63a475db5fa6751b4faa76c179425069f62
Target digest: e271b3aea2bf01a9af373b993bb4c63a475db5fa6751b4faa76c179425069f62
Shown source SHA256: 6839165b92728c5c1d3c83b535616f5e920951a6ab46db70c1ba07b6cb7d2dbf
Shown target SHA256: 6839165b92728c5c1d3c83b535616f5e920951a6ab46db70c1ba07b6cb7d2dbf

### Proposed decision

```json
{
  "claimId": "claim_3df6c8a1b11c1733eebfee3a002b48db",
  "sourceUnitDigest": "e271b3aea2bf01a9af373b993bb4c63a475db5fa6751b4faa76c179425069f62",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "61-durable-current-status",
  "targetUnitDigest": "e271b3aea2bf01a9af373b993bb4c63a475db5fa6751b4faa76c179425069f62",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#61-durable-current-status (lines 173–173) is carried at docs/platform/proposals/doing-coordination-redesign.md#61-durable-current-status (lines 197–197); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 6.1 Durable Current Status

Durable current status is only for stable workflow state.

Allowed durable status categories should represent states such as:

- `todo` - claimable work that is not parked or final;
- `awaiting-approval` - work submitted for review;
- `blocked` - cannot proceed without a condition being resolved;
- `awaiting-human` - parked on human input;
- `delivered` or equivalent final success state;
- `wontfix` or equivalent terminal non-delivery state.

`doing` should not be produced by claim acquire as durable current status.

If the implementation keeps a `doing` enum value for effective statuses or historical run segments, it must be clearly separated from durable current-status transitions.

Durable workflow edges that write into `doing` are not normal runtime edges after
the hard cut. Any remaining durable `* -> doing` edge must be either migration
code, a fixture for old data, or a reviewed compatibility path with an explicit
retirement plan.
```

### Full target shown text

```text
### 6.1 Durable Current Status

Durable current status is only for stable workflow state.

Allowed durable status categories should represent states such as:

- `todo` - claimable work that is not parked or final;
- `awaiting-approval` - work submitted for review;
- `blocked` - cannot proceed without a condition being resolved;
- `awaiting-human` - parked on human input;
- `delivered` or equivalent final success state;
- `wontfix` or equivalent terminal non-delivery state.

`doing` should not be produced by claim acquire as durable current status.

If the implementation keeps a `doing` enum value for effective statuses or historical run segments, it must be clearly separated from durable current-status transitions.

Durable workflow edges that write into `doing` are not normal runtime edges after
the hard cut. Any remaining durable `* -> doing` edge must be either migration
code, a fixture for old data, or a reviewed compatibility path with an explicit
retirement plan.
```

## claim_77d67fdbc4c6b64fcc57af6256f9bc9e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-33, lines 175–175.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-36.
Source digest: 0e8b1a471047e70729b8c934a8560f4e30123ceb10dab660e8965e88f0c5ebc5
Target digest: 0e8b1a471047e70729b8c934a8560f4e30123ceb10dab660e8965e88f0c5ebc5
Shown source SHA256: 0e8b1a471047e70729b8c934a8560f4e30123ceb10dab660e8965e88f0c5ebc5
Shown target SHA256: 0e8b1a471047e70729b8c934a8560f4e30123ceb10dab660e8965e88f0c5ebc5

### Proposed decision

```json
{
  "claimId": "claim_77d67fdbc4c6b64fcc57af6256f9bc9e",
  "sourceUnitDigest": "0e8b1a471047e70729b8c934a8560f4e30123ceb10dab660e8965e88f0c5ebc5",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "0e8b1a471047e70729b8c934a8560f4e30123ceb10dab660e8965e88f0c5ebc5",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.1 Durable Current Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-33 (lines 175–175) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-36 (lines 199–199); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Durable current status is only for stable workflow state.
```

### Full target shown text

```text
Durable current status is only for stable workflow state.
```

## claim_95ad034e1726c592fe8285fd5e678e39

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-34, lines 177–177.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-37.
Source digest: 1107b1040000d3b417bbaae207a3a90fb168cdbc4d62db6057741aa4408a5219
Target digest: 1107b1040000d3b417bbaae207a3a90fb168cdbc4d62db6057741aa4408a5219
Shown source SHA256: 1107b1040000d3b417bbaae207a3a90fb168cdbc4d62db6057741aa4408a5219
Shown target SHA256: 1107b1040000d3b417bbaae207a3a90fb168cdbc4d62db6057741aa4408a5219

### Proposed decision

```json
{
  "claimId": "claim_95ad034e1726c592fe8285fd5e678e39",
  "sourceUnitDigest": "1107b1040000d3b417bbaae207a3a90fb168cdbc4d62db6057741aa4408a5219",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "1107b1040000d3b417bbaae207a3a90fb168cdbc4d62db6057741aa4408a5219",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.1 Durable Current Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-34 (lines 177–177) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-37 (lines 201–201); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Allowed durable status categories should represent states such as:
```

### Full target shown text

```text
Allowed durable status categories should represent states such as:
```

## claim_f441ad9c2280df41c1b7ac8f51cc7427

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-35, lines 179–184.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-38.
Source digest: 4cb9006d44db15dafaae690b654da95b9311c043aace1d365b5e322b2fcbf239
Target digest: 4cb9006d44db15dafaae690b654da95b9311c043aace1d365b5e322b2fcbf239
Shown source SHA256: 4cb9006d44db15dafaae690b654da95b9311c043aace1d365b5e322b2fcbf239
Shown target SHA256: 4cb9006d44db15dafaae690b654da95b9311c043aace1d365b5e322b2fcbf239

### Proposed decision

```json
{
  "claimId": "claim_f441ad9c2280df41c1b7ac8f51cc7427",
  "sourceUnitDigest": "4cb9006d44db15dafaae690b654da95b9311c043aace1d365b5e322b2fcbf239",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "4cb9006d44db15dafaae690b654da95b9311c043aace1d365b5e322b2fcbf239",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.1 Durable Current Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-35 (lines 179–184) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-38 (lines 203–208); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `todo` - claimable work that is not parked or final;
- `awaiting-approval` - work submitted for review;
- `blocked` - cannot proceed without a condition being resolved;
- `awaiting-human` - parked on human input;
- `delivered` or equivalent final success state;
- `wontfix` or equivalent terminal non-delivery state.
```

### Full target shown text

```text
- `todo` - claimable work that is not parked or final;
- `awaiting-approval` - work submitted for review;
- `blocked` - cannot proceed without a condition being resolved;
- `awaiting-human` - parked on human input;
- `delivered` or equivalent final success state;
- `wontfix` or equivalent terminal non-delivery state.
```

## claim_7a410fed24099a67f497d6de31d7e653

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-36, lines 186–186.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-39.
Source digest: ce485db8eb705a643afcf4f4b4fb92f37e9d88aca9a4d13433a32cdf7ad5905f
Target digest: ce485db8eb705a643afcf4f4b4fb92f37e9d88aca9a4d13433a32cdf7ad5905f
Shown source SHA256: ce485db8eb705a643afcf4f4b4fb92f37e9d88aca9a4d13433a32cdf7ad5905f
Shown target SHA256: ce485db8eb705a643afcf4f4b4fb92f37e9d88aca9a4d13433a32cdf7ad5905f

### Proposed decision

```json
{
  "claimId": "claim_7a410fed24099a67f497d6de31d7e653",
  "sourceUnitDigest": "ce485db8eb705a643afcf4f4b4fb92f37e9d88aca9a4d13433a32cdf7ad5905f",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "ce485db8eb705a643afcf4f4b4fb92f37e9d88aca9a4d13433a32cdf7ad5905f",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.1 Durable Current Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-36 (lines 186–186) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-39 (lines 210–210); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`doing` should not be produced by claim acquire as durable current status.
```

### Full target shown text

```text
`doing` should not be produced by claim acquire as durable current status.
```

## claim_4231d5b287a6126adbd701ecb80f3ae8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-37, lines 188–188.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-40.
Source digest: 272bb59c214d7fb5ce232e8e1b333baa06bff999b7a773e990f533b9167a1c81
Target digest: 272bb59c214d7fb5ce232e8e1b333baa06bff999b7a773e990f533b9167a1c81
Shown source SHA256: 272bb59c214d7fb5ce232e8e1b333baa06bff999b7a773e990f533b9167a1c81
Shown target SHA256: 272bb59c214d7fb5ce232e8e1b333baa06bff999b7a773e990f533b9167a1c81

### Proposed decision

```json
{
  "claimId": "claim_4231d5b287a6126adbd701ecb80f3ae8",
  "sourceUnitDigest": "272bb59c214d7fb5ce232e8e1b333baa06bff999b7a773e990f533b9167a1c81",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "272bb59c214d7fb5ce232e8e1b333baa06bff999b7a773e990f533b9167a1c81",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.1 Durable Current Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-37 (lines 188–188) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-40 (lines 212–212); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
If the implementation keeps a `doing` enum value for effective statuses or historical run segments, it must be clearly separated from durable current-status transitions.
```

### Full target shown text

```text
If the implementation keeps a `doing` enum value for effective statuses or historical run segments, it must be clearly separated from durable current-status transitions.
```

## claim_70674d97387a5835a5e51dccf1d94291

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-38, lines 190–193.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-41.
Source digest: 59327648a308417ae2cc2532216d1e2f3f88e73b9c0fbef9de8a9568e65d4c2c
Target digest: 59327648a308417ae2cc2532216d1e2f3f88e73b9c0fbef9de8a9568e65d4c2c
Shown source SHA256: 59327648a308417ae2cc2532216d1e2f3f88e73b9c0fbef9de8a9568e65d4c2c
Shown target SHA256: 59327648a308417ae2cc2532216d1e2f3f88e73b9c0fbef9de8a9568e65d4c2c

### Proposed decision

```json
{
  "claimId": "claim_70674d97387a5835a5e51dccf1d94291",
  "sourceUnitDigest": "59327648a308417ae2cc2532216d1e2f3f88e73b9c0fbef9de8a9568e65d4c2c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "59327648a308417ae2cc2532216d1e2f3f88e73b9c0fbef9de8a9568e65d4c2c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.1 Durable Current Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-38 (lines 190–193) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-41 (lines 214–217); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Durable workflow edges that write into `doing` are not normal runtime edges after
the hard cut. Any remaining durable `* -> doing` edge must be either migration
code, a fixture for old data, or a reviewed compatibility path with an explicit
retirement plan.
```

### Full target shown text

```text
Durable workflow edges that write into `doing` are not normal runtime edges after
the hard cut. Any remaining durable `* -> doing` edge must be either migration
code, a fixture for old data, or a reviewed compatibility path with an explicit
retirement plan.
```

## claim_bd56e62558dec18e52052522d2d42806

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#62-effective-status, lines 195–195.
Target: docs/platform/proposals/doing-coordination-redesign.md#62-effective-status.
Source digest: ca3f34751ba6eeeba725c4a410704a4e83bb14e25b976b1ff8f18245c34f3c44
Target digest: ca3f34751ba6eeeba725c4a410704a4e83bb14e25b976b1ff8f18245c34f3c44
Shown source SHA256: 8b3130de70bb59abf0f12ee56cafe4a169460dadc9c27c3cef22f6e29a7e2101
Shown target SHA256: 8b3130de70bb59abf0f12ee56cafe4a169460dadc9c27c3cef22f6e29a7e2101

### Proposed decision

```json
{
  "claimId": "claim_bd56e62558dec18e52052522d2d42806",
  "sourceUnitDigest": "ca3f34751ba6eeeba725c4a410704a4e83bb14e25b976b1ff8f18245c34f3c44",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "62-effective-status",
  "targetUnitDigest": "ca3f34751ba6eeeba725c4a410704a4e83bb14e25b976b1ff8f18245c34f3c44",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#62-effective-status (lines 195–195) is carried at docs/platform/proposals/doing-coordination-redesign.md#62-effective-status (lines 219–219); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.2 Effective Status

Effective status is what the system presents at runtime.

An item may have:

```json
{
  "status": "todo",
  "effectiveStatus": "doing",
  "claim": {
    "claimId": "c1",
    "actor": "runner-1"
  },
  "attemptCount": 0
}
```

This means the durable workflow has not settled yet, but the item is actively owned.

This is the valid form of the logical `todo -> doing` transition:

```txt
durable:
  todo

runtime coordination:
  active claim exists

effective:
  doing
```

The invalid form is:

```txt
durable:
  work.move todo -> doing
```

That invalid form reintroduces main-checkout churn, stale durable `doing`, and
cleanup/reclaim paths that fight the committed event log.
````

### Full target shown text

````text
### 6.2 Effective Status

Effective status is what the system presents at runtime.

An item may have:

```json
{
  "status": "todo",
  "effectiveStatus": "doing",
  "claim": {
    "claimId": "c1",
    "actor": "runner-1"
  },
  "attemptCount": 0
}
```

This means the durable workflow has not settled yet, but the item is actively owned.

This is the valid form of the logical `todo -> doing` transition:

```txt
durable:
  todo

runtime coordination:
  active claim exists

effective:
  doing
```

The invalid form is:

```txt
durable:
  work.move todo -> doing
```

That invalid form reintroduces main-checkout churn, stale durable `doing`, and
cleanup/reclaim paths that fight the committed event log.
````

## claim_c2309488ce728bf45efc18cbda36ea73

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-39, lines 197–197.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-42.
Source digest: 329c2c7ac39baaea738c18f485dd3f0db86e822a039f5e9988b45636c3e5aa69
Target digest: 329c2c7ac39baaea738c18f485dd3f0db86e822a039f5e9988b45636c3e5aa69
Shown source SHA256: 329c2c7ac39baaea738c18f485dd3f0db86e822a039f5e9988b45636c3e5aa69
Shown target SHA256: 329c2c7ac39baaea738c18f485dd3f0db86e822a039f5e9988b45636c3e5aa69

### Proposed decision

```json
{
  "claimId": "claim_c2309488ce728bf45efc18cbda36ea73",
  "sourceUnitDigest": "329c2c7ac39baaea738c18f485dd3f0db86e822a039f5e9988b45636c3e5aa69",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "329c2c7ac39baaea738c18f485dd3f0db86e822a039f5e9988b45636c3e5aa69",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.2 Effective Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-39 (lines 197–197) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-42 (lines 221–221); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Effective status is what the system presents at runtime.
```

### Full target shown text

```text
Effective status is what the system presents at runtime.
```

## claim_1d2ff8bc2331c0443c08deae98ae0b15

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-40, lines 199–211.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-43.
Source digest: 6266dbda5648ee8420f10c3150812641cb6a4f13bbbf1113ad628b361e9de339
Target digest: 6266dbda5648ee8420f10c3150812641cb6a4f13bbbf1113ad628b361e9de339
Shown source SHA256: 6266dbda5648ee8420f10c3150812641cb6a4f13bbbf1113ad628b361e9de339
Shown target SHA256: 6266dbda5648ee8420f10c3150812641cb6a4f13bbbf1113ad628b361e9de339

### Proposed decision

```json
{
  "claimId": "claim_1d2ff8bc2331c0443c08deae98ae0b15",
  "sourceUnitDigest": "6266dbda5648ee8420f10c3150812641cb6a4f13bbbf1113ad628b361e9de339",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "6266dbda5648ee8420f10c3150812641cb6a4f13bbbf1113ad628b361e9de339",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.2 Effective Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-40 (lines 199–211) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-43 (lines 223–235); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
An item may have:

```json
{
  "status": "todo",
  "effectiveStatus": "doing",
  "claim": {
    "claimId": "c1",
    "actor": "runner-1"
  },
  "attemptCount": 0
}
```
````

### Full target shown text

````text
An item may have:

```json
{
  "status": "todo",
  "effectiveStatus": "doing",
  "claim": {
    "claimId": "c1",
    "actor": "runner-1"
  },
  "attemptCount": 0
}
```
````

## claim_d79b9f121ff916cd6863fb3bc886c639

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-41, lines 213–213.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-44.
Source digest: 1ad9a476b11beb83d42adacd25dfa74e77218970ce858ecddf876cbbcb6cdb4e
Target digest: 1ad9a476b11beb83d42adacd25dfa74e77218970ce858ecddf876cbbcb6cdb4e
Shown source SHA256: 1ad9a476b11beb83d42adacd25dfa74e77218970ce858ecddf876cbbcb6cdb4e
Shown target SHA256: 1ad9a476b11beb83d42adacd25dfa74e77218970ce858ecddf876cbbcb6cdb4e

### Proposed decision

```json
{
  "claimId": "claim_d79b9f121ff916cd6863fb3bc886c639",
  "sourceUnitDigest": "1ad9a476b11beb83d42adacd25dfa74e77218970ce858ecddf876cbbcb6cdb4e",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "1ad9a476b11beb83d42adacd25dfa74e77218970ce858ecddf876cbbcb6cdb4e",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.2 Effective Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-41 (lines 213–213) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-44 (lines 237–237); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This means the durable workflow has not settled yet, but the item is actively owned.
```

### Full target shown text

```text
This means the durable workflow has not settled yet, but the item is actively owned.
```

## claim_123a84b839f17006e21566376cc36a98

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-42, lines 215–215.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-45.
Source digest: 343f5c8262524dabd61f8da51d2196aeeba0fe522c632cb61e67f230e423c8b8
Target digest: 343f5c8262524dabd61f8da51d2196aeeba0fe522c632cb61e67f230e423c8b8
Shown source SHA256: 343f5c8262524dabd61f8da51d2196aeeba0fe522c632cb61e67f230e423c8b8
Shown target SHA256: 343f5c8262524dabd61f8da51d2196aeeba0fe522c632cb61e67f230e423c8b8

### Proposed decision

```json
{
  "claimId": "claim_123a84b839f17006e21566376cc36a98",
  "sourceUnitDigest": "343f5c8262524dabd61f8da51d2196aeeba0fe522c632cb61e67f230e423c8b8",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "343f5c8262524dabd61f8da51d2196aeeba0fe522c632cb61e67f230e423c8b8",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.2 Effective Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-42 (lines 215–215) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-45 (lines 239–239); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This is the valid form of the logical `todo -> doing` transition:
```

### Full target shown text

```text
This is the valid form of the logical `todo -> doing` transition:
```

## claim_fc4bf95c7a5140dc328dcbcf7eb7c5a4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-43, lines 217–226.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-46.
Source digest: d5afa4af70ed1b04991499959a7d1ba0171aa01f734b0ba941550fe9e5108d08
Target digest: d5afa4af70ed1b04991499959a7d1ba0171aa01f734b0ba941550fe9e5108d08
Shown source SHA256: d5afa4af70ed1b04991499959a7d1ba0171aa01f734b0ba941550fe9e5108d08
Shown target SHA256: d5afa4af70ed1b04991499959a7d1ba0171aa01f734b0ba941550fe9e5108d08

### Proposed decision

```json
{
  "claimId": "claim_fc4bf95c7a5140dc328dcbcf7eb7c5a4",
  "sourceUnitDigest": "d5afa4af70ed1b04991499959a7d1ba0171aa01f734b0ba941550fe9e5108d08",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "d5afa4af70ed1b04991499959a7d1ba0171aa01f734b0ba941550fe9e5108d08",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.2 Effective Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-43 (lines 217–226) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-46 (lines 241–250); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
durable:
  todo

runtime coordination:
  active claim exists

effective:
  doing
```
````

### Full target shown text

````text
```txt
durable:
  todo

runtime coordination:
  active claim exists

effective:
  doing
```
````

## claim_993ef397801667121c2e74acae308247

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-44, lines 228–233.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-47.
Source digest: f86038c26128468a79a13e016f036a597ab5c18acd76cb5d49db779d5f687f0f
Target digest: f86038c26128468a79a13e016f036a597ab5c18acd76cb5d49db779d5f687f0f
Shown source SHA256: f86038c26128468a79a13e016f036a597ab5c18acd76cb5d49db779d5f687f0f
Shown target SHA256: f86038c26128468a79a13e016f036a597ab5c18acd76cb5d49db779d5f687f0f

### Proposed decision

```json
{
  "claimId": "claim_993ef397801667121c2e74acae308247",
  "sourceUnitDigest": "f86038c26128468a79a13e016f036a597ab5c18acd76cb5d49db779d5f687f0f",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "f86038c26128468a79a13e016f036a597ab5c18acd76cb5d49db779d5f687f0f",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.2 Effective Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-44 (lines 228–233) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-47 (lines 252–257); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
The invalid form is:

```txt
durable:
  work.move todo -> doing
```
````

### Full target shown text

````text
The invalid form is:

```txt
durable:
  work.move todo -> doing
```
````

## claim_06ec2144bd47892193e455d9ff9820c7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-45, lines 235–236.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-48.
Source digest: 41325119c4ce06034243ec227d4ffffb1dae992b597856b367b424703fe48a42
Target digest: 41325119c4ce06034243ec227d4ffffb1dae992b597856b367b424703fe48a42
Shown source SHA256: 41325119c4ce06034243ec227d4ffffb1dae992b597856b367b424703fe48a42
Shown target SHA256: 41325119c4ce06034243ec227d4ffffb1dae992b597856b367b424703fe48a42

### Proposed decision

```json
{
  "claimId": "claim_06ec2144bd47892193e455d9ff9820c7",
  "sourceUnitDigest": "41325119c4ce06034243ec227d4ffffb1dae992b597856b367b424703fe48a42",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "41325119c4ce06034243ec227d4ffffb1dae992b597856b367b424703fe48a42",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.2 Effective Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-45 (lines 235–236) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-48 (lines 259–260); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
That invalid form reintroduces main-checkout churn, stale durable `doing`, and
cleanup/reclaim paths that fight the committed event log.
```

### Full target shown text

```text
That invalid form reintroduces main-checkout churn, stale durable `doing`, and
cleanup/reclaim paths that fight the committed event log.
```

## claim_7a36be3e9bc28e19ed09e2abbd1feae0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#63-started-is-not-a-durable-status, lines 238–238.
Target: docs/platform/proposals/doing-coordination-redesign.md#63-started-is-not-a-durable-status.
Source digest: 1661c9e01745e9019f9e000bfe985e5ad9d15027a0d5f2da673d34b29c7f26a7
Target digest: 1661c9e01745e9019f9e000bfe985e5ad9d15027a0d5f2da673d34b29c7f26a7
Shown source SHA256: 046f56893a23297df9316dccda9c1652abadcb261a1402b54f451472e88ed06c
Shown target SHA256: 046f56893a23297df9316dccda9c1652abadcb261a1402b54f451472e88ed06c

### Proposed decision

```json
{
  "claimId": "claim_7a36be3e9bc28e19ed09e2abbd1feae0",
  "sourceUnitDigest": "1661c9e01745e9019f9e000bfe985e5ad9d15027a0d5f2da673d34b29c7f26a7",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "63-started-is-not-a-durable-status",
  "targetUnitDigest": "1661c9e01745e9019f9e000bfe985e5ad9d15027a0d5f2da673d34b29c7f26a7",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#63-started-is-not-a-durable-status (lines 238–238) is carried at docs/platform/proposals/doing-coordination-redesign.md#63-started-is-not-a-durable-status (lines 262–262); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.3 Started Is Not A Durable Status

Do not add `started` as a durable current status.

`started` mixes two different facts:

- whether an item has ever had an attempt;
- whether an item is currently claimable or active.

Use durable attempt metadata instead:

```json
{
  "status": "todo",
  "attemptCount": 1,
  "hasStarted": true,
  "lastAttempt": {
    "result": "released",
    "endedAt": "2026-08-25T03:30:00.000Z"
  }
}
```

This remains claimable while preserving that it is not fresh work.
````

### Full target shown text

````text
### 6.3 Started Is Not A Durable Status

Do not add `started` as a durable current status.

`started` mixes two different facts:

- whether an item has ever had an attempt;
- whether an item is currently claimable or active.

Use durable attempt metadata instead:

```json
{
  "status": "todo",
  "attemptCount": 1,
  "hasStarted": true,
  "lastAttempt": {
    "result": "released",
    "endedAt": "2026-08-25T03:30:00.000Z"
  }
}
```

This remains claimable while preserving that it is not fresh work.
````

## claim_3c7bd93536407a81eefa776aa33b801c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-46, lines 240–240.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-49.
Source digest: 47b04c8d8f8224738ec09c2e5a12ebb165838591b7f7aa6fb20e13967e0ad661
Target digest: 47b04c8d8f8224738ec09c2e5a12ebb165838591b7f7aa6fb20e13967e0ad661
Shown source SHA256: 47b04c8d8f8224738ec09c2e5a12ebb165838591b7f7aa6fb20e13967e0ad661
Shown target SHA256: 47b04c8d8f8224738ec09c2e5a12ebb165838591b7f7aa6fb20e13967e0ad661

### Proposed decision

```json
{
  "claimId": "claim_3c7bd93536407a81eefa776aa33b801c",
  "sourceUnitDigest": "47b04c8d8f8224738ec09c2e5a12ebb165838591b7f7aa6fb20e13967e0ad661",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "47b04c8d8f8224738ec09c2e5a12ebb165838591b7f7aa6fb20e13967e0ad661",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.3 Started Is Not A Durable Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-46 (lines 240–240) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-49 (lines 264–264); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Do not add `started` as a durable current status.
```

### Full target shown text

```text
Do not add `started` as a durable current status.
```

## claim_2ce89e5df7c8d5b6dbb007ffc343cb3e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-47, lines 242–242.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-50.
Source digest: 93d0409396ae3d338609af6cdafba2db4180c11f841b1559222c1c1571dad80a
Target digest: 93d0409396ae3d338609af6cdafba2db4180c11f841b1559222c1c1571dad80a
Shown source SHA256: 93d0409396ae3d338609af6cdafba2db4180c11f841b1559222c1c1571dad80a
Shown target SHA256: 93d0409396ae3d338609af6cdafba2db4180c11f841b1559222c1c1571dad80a

### Proposed decision

```json
{
  "claimId": "claim_2ce89e5df7c8d5b6dbb007ffc343cb3e",
  "sourceUnitDigest": "93d0409396ae3d338609af6cdafba2db4180c11f841b1559222c1c1571dad80a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "93d0409396ae3d338609af6cdafba2db4180c11f841b1559222c1c1571dad80a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.3 Started Is Not A Durable Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-47 (lines 242–242) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-50 (lines 266–266); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`started` mixes two different facts:
```

### Full target shown text

```text
`started` mixes two different facts:
```

## claim_89cbcc910b0513c90a1b95d7c64b04a5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-48, lines 244–245.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-51.
Source digest: 0b6658271ee9ecc666b0549f867b11bcecb5a1db1d3538452c98c1b659ba820d
Target digest: 0b6658271ee9ecc666b0549f867b11bcecb5a1db1d3538452c98c1b659ba820d
Shown source SHA256: 0b6658271ee9ecc666b0549f867b11bcecb5a1db1d3538452c98c1b659ba820d
Shown target SHA256: 0b6658271ee9ecc666b0549f867b11bcecb5a1db1d3538452c98c1b659ba820d

### Proposed decision

```json
{
  "claimId": "claim_89cbcc910b0513c90a1b95d7c64b04a5",
  "sourceUnitDigest": "0b6658271ee9ecc666b0549f867b11bcecb5a1db1d3538452c98c1b659ba820d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "0b6658271ee9ecc666b0549f867b11bcecb5a1db1d3538452c98c1b659ba820d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.3 Started Is Not A Durable Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-48 (lines 244–245) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-51 (lines 268–269); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- whether an item has ever had an attempt;
- whether an item is currently claimable or active.
```

### Full target shown text

```text
- whether an item has ever had an attempt;
- whether an item is currently claimable or active.
```

## claim_4240d3edbb3f1b396aa85c6ff9d2d1c0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-49, lines 247–247.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-52.
Source digest: c9f9523ddce4c98b70eeedcdc21feaee9876f106b19e8bf916cee162c5a6510d
Target digest: c9f9523ddce4c98b70eeedcdc21feaee9876f106b19e8bf916cee162c5a6510d
Shown source SHA256: c9f9523ddce4c98b70eeedcdc21feaee9876f106b19e8bf916cee162c5a6510d
Shown target SHA256: c9f9523ddce4c98b70eeedcdc21feaee9876f106b19e8bf916cee162c5a6510d

### Proposed decision

```json
{
  "claimId": "claim_4240d3edbb3f1b396aa85c6ff9d2d1c0",
  "sourceUnitDigest": "c9f9523ddce4c98b70eeedcdc21feaee9876f106b19e8bf916cee162c5a6510d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "c9f9523ddce4c98b70eeedcdc21feaee9876f106b19e8bf916cee162c5a6510d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.3 Started Is Not A Durable Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-49 (lines 247–247) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-52 (lines 271–271); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Use durable attempt metadata instead:
```

### Full target shown text

```text
Use durable attempt metadata instead:
```

## claim_7948da5e64b0561ac7270a64181978da

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-50, lines 249–259.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-53.
Source digest: 46c1b89886e29cf361d1711db6e1b1bc341539ba194a37aeac993f7b11f8c47c
Target digest: 46c1b89886e29cf361d1711db6e1b1bc341539ba194a37aeac993f7b11f8c47c
Shown source SHA256: 46c1b89886e29cf361d1711db6e1b1bc341539ba194a37aeac993f7b11f8c47c
Shown target SHA256: 46c1b89886e29cf361d1711db6e1b1bc341539ba194a37aeac993f7b11f8c47c

### Proposed decision

```json
{
  "claimId": "claim_7948da5e64b0561ac7270a64181978da",
  "sourceUnitDigest": "46c1b89886e29cf361d1711db6e1b1bc341539ba194a37aeac993f7b11f8c47c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "46c1b89886e29cf361d1711db6e1b1bc341539ba194a37aeac993f7b11f8c47c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.3 Started Is Not A Durable Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-50 (lines 249–259) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-53 (lines 273–283); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```json
{
  "status": "todo",
  "attemptCount": 1,
  "hasStarted": true,
  "lastAttempt": {
    "result": "released",
    "endedAt": "2026-08-25T03:30:00.000Z"
  }
}
```
````

### Full target shown text

````text
```json
{
  "status": "todo",
  "attemptCount": 1,
  "hasStarted": true,
  "lastAttempt": {
    "result": "released",
    "endedAt": "2026-08-25T03:30:00.000Z"
  }
}
```
````

## claim_9e31320865548679e2f45dd61ba239af

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-51, lines 261–261.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-54.
Source digest: 1c061ecfa18bd49eb0fbc767b73d2d5e519e9b86c4c59d9c5768e60a3b75e426
Target digest: 1c061ecfa18bd49eb0fbc767b73d2d5e519e9b86c4c59d9c5768e60a3b75e426
Shown source SHA256: 1c061ecfa18bd49eb0fbc767b73d2d5e519e9b86c4c59d9c5768e60a3b75e426
Shown target SHA256: 1c061ecfa18bd49eb0fbc767b73d2d5e519e9b86c4c59d9c5768e60a3b75e426

### Proposed decision

```json
{
  "claimId": "claim_9e31320865548679e2f45dd61ba239af",
  "sourceUnitDigest": "1c061ecfa18bd49eb0fbc767b73d2d5e519e9b86c4c59d9c5768e60a3b75e426",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "1c061ecfa18bd49eb0fbc767b73d2d5e519e9b86c4c59d9c5768e60a3b75e426",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.3 Started Is Not A Durable Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-51 (lines 261–261) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-54 (lines 285–285); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This remains claimable while preserving that it is not fresh work.
```

### Full target shown text

```text
This remains claimable while preserving that it is not fresh work.
```

## claim_7185c369f8849b380a239037ee61db31

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#64-human-park-is-not-active-doing, lines 263–263.
Target: docs/platform/proposals/doing-coordination-redesign.md#64-human-park-is-not-active-doing.
Source digest: 416a2ee0a560fc1a89add019559fd08622de9eb1bdb1343429d677279d821884
Target digest: 416a2ee0a560fc1a89add019559fd08622de9eb1bdb1343429d677279d821884
Shown source SHA256: 3c886ad7fc5bb4d4efaf5c16e7f4c37092913c7bff2c59d34937b0cc88915614
Shown target SHA256: 3c886ad7fc5bb4d4efaf5c16e7f4c37092913c7bff2c59d34937b0cc88915614

### Proposed decision

```json
{
  "claimId": "claim_7185c369f8849b380a239037ee61db31",
  "sourceUnitDigest": "416a2ee0a560fc1a89add019559fd08622de9eb1bdb1343429d677279d821884",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "64-human-park-is-not-active-doing",
  "targetUnitDigest": "416a2ee0a560fc1a89add019559fd08622de9eb1bdb1343429d677279d821884",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#64-human-park-is-not-active-doing (lines 263–263) is carried at docs/platform/proposals/doing-coordination-redesign.md#64-human-park-is-not-active-doing (lines 287–287); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 6.4 Human Park Is Not Active Doing

`awaiting-human` is a stable parked workflow state. It means the item is waiting
for a human answer, not that work is actively progressing.

When an active item needs human input:

- the durable item may move from its captured durable base, such as `todo`, to
  `awaiting-human`;
- the active runtime claim must be released, or moved to an explicitly paused
  non-active representation that does not count as `doing`;
- the effective view must show `awaiting-human`, not `doing`;
- worker slots and reclaim must not treat the item as active work while it is
  parked on the human.

When the human answers:

- the durable item resumes to the stable durable base or another stable policy
  target, such as `todo`;
- answer handling must not write durable `awaiting-human -> doing`;
- if the same actor should continue immediately, that continuation must reacquire
  or reactivate a runtime claim, which then makes the effective view `doing`.

This preserves the user-facing sequence:

```txt
todo -> doing -> awaiting-human -> doing -> awaiting-approval
```

while the committed workflow history stays stable:

```txt
todo -> awaiting-human -> todo -> awaiting-approval
```

The two sequences are both true, but they belong to different layers.
````

### Full target shown text

````text
### 6.4 Human Park Is Not Active Doing

`awaiting-human` is a stable parked workflow state. It means the item is waiting
for a human answer, not that work is actively progressing.

When an active item needs human input:

- the durable item may move from its captured durable base, such as `todo`, to
  `awaiting-human`;
- the active runtime claim must be released, or moved to an explicitly paused
  non-active representation that does not count as `doing`;
- the effective view must show `awaiting-human`, not `doing`;
- worker slots and reclaim must not treat the item as active work while it is
  parked on the human.

When the human answers:

- the durable item resumes to the stable durable base or another stable policy
  target, such as `todo`;
- answer handling must not write durable `awaiting-human -> doing`;
- if the same actor should continue immediately, that continuation must reacquire
  or reactivate a runtime claim, which then makes the effective view `doing`.

This preserves the user-facing sequence:

```txt
todo -> doing -> awaiting-human -> doing -> awaiting-approval
```

while the committed workflow history stays stable:

```txt
todo -> awaiting-human -> todo -> awaiting-approval
```

The two sequences are both true, but they belong to different layers.
````

## claim_a80719931a792d954a3cc0747c5516ef

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-52, lines 265–266.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-55.
Source digest: 5491f565c2de8d9f52c82cea1d5949e7fdb12f7ee8e072960dc3977d2f74aad5
Target digest: 5491f565c2de8d9f52c82cea1d5949e7fdb12f7ee8e072960dc3977d2f74aad5
Shown source SHA256: 5491f565c2de8d9f52c82cea1d5949e7fdb12f7ee8e072960dc3977d2f74aad5
Shown target SHA256: 5491f565c2de8d9f52c82cea1d5949e7fdb12f7ee8e072960dc3977d2f74aad5

### Proposed decision

```json
{
  "claimId": "claim_a80719931a792d954a3cc0747c5516ef",
  "sourceUnitDigest": "5491f565c2de8d9f52c82cea1d5949e7fdb12f7ee8e072960dc3977d2f74aad5",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "5491f565c2de8d9f52c82cea1d5949e7fdb12f7ee8e072960dc3977d2f74aad5",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-52 (lines 265–266) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-55 (lines 289–290); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`awaiting-human` is a stable parked workflow state. It means the item is waiting
for a human answer, not that work is actively progressing.
```

### Full target shown text

```text
`awaiting-human` is a stable parked workflow state. It means the item is waiting
for a human answer, not that work is actively progressing.
```

## claim_5c7de39c5d011187f0f29f06a3b21d8b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-53, lines 268–268.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-56.
Source digest: 8dc056e18c5a9bb86aa3197ea87894223b6daf5db3a0e509d5dc0a1d3e98fb79
Target digest: 8dc056e18c5a9bb86aa3197ea87894223b6daf5db3a0e509d5dc0a1d3e98fb79
Shown source SHA256: 8dc056e18c5a9bb86aa3197ea87894223b6daf5db3a0e509d5dc0a1d3e98fb79
Shown target SHA256: 8dc056e18c5a9bb86aa3197ea87894223b6daf5db3a0e509d5dc0a1d3e98fb79

### Proposed decision

```json
{
  "claimId": "claim_5c7de39c5d011187f0f29f06a3b21d8b",
  "sourceUnitDigest": "8dc056e18c5a9bb86aa3197ea87894223b6daf5db3a0e509d5dc0a1d3e98fb79",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "8dc056e18c5a9bb86aa3197ea87894223b6daf5db3a0e509d5dc0a1d3e98fb79",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-53 (lines 268–268) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-56 (lines 292–292); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
When an active item needs human input:
```

### Full target shown text

```text
When an active item needs human input:
```

## claim_0ee1ae5b786ab4e8d36e242096adf204

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-54, lines 270–276.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-57.
Source digest: 570d605054f6373c5aa5c546d5d6165ec17d8de7985b5be6a239ea64f84833c7
Target digest: 570d605054f6373c5aa5c546d5d6165ec17d8de7985b5be6a239ea64f84833c7
Shown source SHA256: 570d605054f6373c5aa5c546d5d6165ec17d8de7985b5be6a239ea64f84833c7
Shown target SHA256: 570d605054f6373c5aa5c546d5d6165ec17d8de7985b5be6a239ea64f84833c7

### Proposed decision

```json
{
  "claimId": "claim_0ee1ae5b786ab4e8d36e242096adf204",
  "sourceUnitDigest": "570d605054f6373c5aa5c546d5d6165ec17d8de7985b5be6a239ea64f84833c7",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "570d605054f6373c5aa5c546d5d6165ec17d8de7985b5be6a239ea64f84833c7",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-54 (lines 270–276) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-57 (lines 294–300); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- the durable item may move from its captured durable base, such as `todo`, to
  `awaiting-human`;
- the active runtime claim must be released, or moved to an explicitly paused
  non-active representation that does not count as `doing`;
- the effective view must show `awaiting-human`, not `doing`;
- worker slots and reclaim must not treat the item as active work while it is
  parked on the human.
```

### Full target shown text

```text
- the durable item may move from its captured durable base, such as `todo`, to
  `awaiting-human`;
- the active runtime claim must be released, or moved to an explicitly paused
  non-active representation that does not count as `doing`;
- the effective view must show `awaiting-human`, not `doing`;
- worker slots and reclaim must not treat the item as active work while it is
  parked on the human.
```

## claim_cbd4e1cfe5f001c75866d2399ce968f1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-55, lines 278–278.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-58.
Source digest: 1798e0636ba8670fb83e308c52c19594b0ffe54ebfeb225f1b587195a1076810
Target digest: 1798e0636ba8670fb83e308c52c19594b0ffe54ebfeb225f1b587195a1076810
Shown source SHA256: 1798e0636ba8670fb83e308c52c19594b0ffe54ebfeb225f1b587195a1076810
Shown target SHA256: 1798e0636ba8670fb83e308c52c19594b0ffe54ebfeb225f1b587195a1076810

### Proposed decision

```json
{
  "claimId": "claim_cbd4e1cfe5f001c75866d2399ce968f1",
  "sourceUnitDigest": "1798e0636ba8670fb83e308c52c19594b0ffe54ebfeb225f1b587195a1076810",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "1798e0636ba8670fb83e308c52c19594b0ffe54ebfeb225f1b587195a1076810",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-55 (lines 278–278) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-58 (lines 302–302); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
When the human answers:
```

### Full target shown text

```text
When the human answers:
```

## claim_faa3f4570096c47ad41347bdc510aa05

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-56, lines 280–284.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-59.
Source digest: 3e22f3b689bef9d54e1b6c1c55a2dcf70520ed039be5a4099c0f264cfa1bcbb9
Target digest: 3e22f3b689bef9d54e1b6c1c55a2dcf70520ed039be5a4099c0f264cfa1bcbb9
Shown source SHA256: 3e22f3b689bef9d54e1b6c1c55a2dcf70520ed039be5a4099c0f264cfa1bcbb9
Shown target SHA256: 3e22f3b689bef9d54e1b6c1c55a2dcf70520ed039be5a4099c0f264cfa1bcbb9

### Proposed decision

```json
{
  "claimId": "claim_faa3f4570096c47ad41347bdc510aa05",
  "sourceUnitDigest": "3e22f3b689bef9d54e1b6c1c55a2dcf70520ed039be5a4099c0f264cfa1bcbb9",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "3e22f3b689bef9d54e1b6c1c55a2dcf70520ed039be5a4099c0f264cfa1bcbb9",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-56 (lines 280–284) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-59 (lines 304–308); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- the durable item resumes to the stable durable base or another stable policy
  target, such as `todo`;
- answer handling must not write durable `awaiting-human -> doing`;
- if the same actor should continue immediately, that continuation must reacquire
  or reactivate a runtime claim, which then makes the effective view `doing`.
```

### Full target shown text

```text
- the durable item resumes to the stable durable base or another stable policy
  target, such as `todo`;
- answer handling must not write durable `awaiting-human -> doing`;
- if the same actor should continue immediately, that continuation must reacquire
  or reactivate a runtime claim, which then makes the effective view `doing`.
```

## claim_2c7c21091418c9a93bda9ce470810eb1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-57, lines 286–286.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-60.
Source digest: 95f0c2ea3eb8735423a93ac1d644bf07a765956486f37253dd840b57db523f1d
Target digest: 95f0c2ea3eb8735423a93ac1d644bf07a765956486f37253dd840b57db523f1d
Shown source SHA256: 95f0c2ea3eb8735423a93ac1d644bf07a765956486f37253dd840b57db523f1d
Shown target SHA256: 95f0c2ea3eb8735423a93ac1d644bf07a765956486f37253dd840b57db523f1d

### Proposed decision

```json
{
  "claimId": "claim_2c7c21091418c9a93bda9ce470810eb1",
  "sourceUnitDigest": "95f0c2ea3eb8735423a93ac1d644bf07a765956486f37253dd840b57db523f1d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "95f0c2ea3eb8735423a93ac1d644bf07a765956486f37253dd840b57db523f1d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-57 (lines 286–286) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-60 (lines 310–310); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This preserves the user-facing sequence:
```

### Full target shown text

```text
This preserves the user-facing sequence:
```

## claim_2510a63a1cec4aa28cb4c3e2645b6425

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-58, lines 288–290.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-61.
Source digest: 2f894675517c9cf68bfb15e5039b0621c953a273280ab63b5527954f1e0a57b9
Target digest: 2f894675517c9cf68bfb15e5039b0621c953a273280ab63b5527954f1e0a57b9
Shown source SHA256: 2f894675517c9cf68bfb15e5039b0621c953a273280ab63b5527954f1e0a57b9
Shown target SHA256: 2f894675517c9cf68bfb15e5039b0621c953a273280ab63b5527954f1e0a57b9

### Proposed decision

```json
{
  "claimId": "claim_2510a63a1cec4aa28cb4c3e2645b6425",
  "sourceUnitDigest": "2f894675517c9cf68bfb15e5039b0621c953a273280ab63b5527954f1e0a57b9",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-61",
  "targetUnitDigest": "2f894675517c9cf68bfb15e5039b0621c953a273280ab63b5527954f1e0a57b9",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-58 (lines 288–290) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-61 (lines 312–314); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
todo -> doing -> awaiting-human -> doing -> awaiting-approval
```
````

### Full target shown text

````text
```txt
todo -> doing -> awaiting-human -> doing -> awaiting-approval
```
````

## claim_5c20cfe60c9ce1b1c4be2cbc2748b29c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-59, lines 292–292.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-62.
Source digest: af3a8363a20f939cbd101e1e5e086cd1bf3f2a3a8e09a82f7977382194c47537
Target digest: af3a8363a20f939cbd101e1e5e086cd1bf3f2a3a8e09a82f7977382194c47537
Shown source SHA256: af3a8363a20f939cbd101e1e5e086cd1bf3f2a3a8e09a82f7977382194c47537
Shown target SHA256: af3a8363a20f939cbd101e1e5e086cd1bf3f2a3a8e09a82f7977382194c47537

### Proposed decision

```json
{
  "claimId": "claim_5c20cfe60c9ce1b1c4be2cbc2748b29c",
  "sourceUnitDigest": "af3a8363a20f939cbd101e1e5e086cd1bf3f2a3a8e09a82f7977382194c47537",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-62",
  "targetUnitDigest": "af3a8363a20f939cbd101e1e5e086cd1bf3f2a3a8e09a82f7977382194c47537",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-59 (lines 292–292) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-62 (lines 316–316); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
while the committed workflow history stays stable:
```

### Full target shown text

```text
while the committed workflow history stays stable:
```

## claim_e55aba6e6f214cdfb4a1635d8118907c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-60, lines 294–296.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-63.
Source digest: 7969912310fc0169e53aab53f7d8334d17ca67d1bb815df28ebc7b06320ae075
Target digest: 7969912310fc0169e53aab53f7d8334d17ca67d1bb815df28ebc7b06320ae075
Shown source SHA256: 7969912310fc0169e53aab53f7d8334d17ca67d1bb815df28ebc7b06320ae075
Shown target SHA256: 7969912310fc0169e53aab53f7d8334d17ca67d1bb815df28ebc7b06320ae075

### Proposed decision

```json
{
  "claimId": "claim_e55aba6e6f214cdfb4a1635d8118907c",
  "sourceUnitDigest": "7969912310fc0169e53aab53f7d8334d17ca67d1bb815df28ebc7b06320ae075",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-63",
  "targetUnitDigest": "7969912310fc0169e53aab53f7d8334d17ca67d1bb815df28ebc7b06320ae075",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-60 (lines 294–296) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-63 (lines 318–320); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
todo -> awaiting-human -> todo -> awaiting-approval
```
````

### Full target shown text

````text
```txt
todo -> awaiting-human -> todo -> awaiting-approval
```
````

## claim_e2f31d6e34df46f40bf0e81e79b9ab51

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-61, lines 298–298.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-64.
Source digest: 7f9f7b359f8ded1cb55a600c371730592005621914c1002aa4f2a5a9f0e7342f
Target digest: 7f9f7b359f8ded1cb55a600c371730592005621914c1002aa4f2a5a9f0e7342f
Shown source SHA256: 7f9f7b359f8ded1cb55a600c371730592005621914c1002aa4f2a5a9f0e7342f
Shown target SHA256: 7f9f7b359f8ded1cb55a600c371730592005621914c1002aa4f2a5a9f0e7342f

### Proposed decision

```json
{
  "claimId": "claim_e2f31d6e34df46f40bf0e81e79b9ab51",
  "sourceUnitDigest": "7f9f7b359f8ded1cb55a600c371730592005621914c1002aa4f2a5a9f0e7342f",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-64",
  "targetUnitDigest": "7f9f7b359f8ded1cb55a600c371730592005621914c1002aa4f2a5a9f0e7342f",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "6. Status Semantics",
    "6.4 Human Park Is Not Active Doing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-61 (lines 298–298) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-64 (lines 322–322); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The two sequences are both true, but they belong to different layers.
```

### Full target shown text

```text
The two sequences are both true, but they belong to different layers.
```

## claim_61310863ec0e30be2167105861b3b900

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#7-data-model, lines 300–300.
Target: docs/platform/proposals/doing-coordination-redesign.md#7-data-model.
Source digest: 488abbdfdcb24c98f7ec0c2007b77d3a7fa2f4d313aad72864eaff5c6c2152c3
Target digest: 488abbdfdcb24c98f7ec0c2007b77d3a7fa2f4d313aad72864eaff5c6c2152c3
Shown source SHA256: 3f8c40738486e5fa1a339e9c88f0f5ebc366db4c57b7b19ff073c8120d6c05d4
Shown target SHA256: 3f8c40738486e5fa1a339e9c88f0f5ebc366db4c57b7b19ff073c8120d6c05d4

### Proposed decision

```json
{
  "claimId": "claim_61310863ec0e30be2167105861b3b900",
  "sourceUnitDigest": "488abbdfdcb24c98f7ec0c2007b77d3a7fa2f4d313aad72864eaff5c6c2152c3",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "7-data-model",
  "targetUnitDigest": "488abbdfdcb24c98f7ec0c2007b77d3a7fa2f4d313aad72864eaff5c6c2152c3",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#7-data-model (lines 300–300) is carried at docs/platform/proposals/doing-coordination-redesign.md#7-data-model (lines 324–324); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 7. Data Model
```

### Full target shown text

```text
## 7. Data Model
```

## claim_feb8e16d69856f834f0adcaa16fcf8ea

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#71-runtime-claim, lines 302–302.
Target: docs/platform/proposals/doing-coordination-redesign.md#71-runtime-claim.
Source digest: ad0cb732565f935541c97b52b61ce82c541ab59d2b437e5799fc2f0440f78df2
Target digest: ad0cb732565f935541c97b52b61ce82c541ab59d2b437e5799fc2f0440f78df2
Shown source SHA256: de844cfa845fe7c65054ec004ca9dc8d8b82646997e808e4cc652af1f325a947
Shown target SHA256: de844cfa845fe7c65054ec004ca9dc8d8b82646997e808e4cc652af1f325a947

### Proposed decision

```json
{
  "claimId": "claim_feb8e16d69856f834f0adcaa16fcf8ea",
  "sourceUnitDigest": "ad0cb732565f935541c97b52b61ce82c541ab59d2b437e5799fc2f0440f78df2",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "71-runtime-claim",
  "targetUnitDigest": "ad0cb732565f935541c97b52b61ce82c541ab59d2b437e5799fc2f0440f78df2",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#71-runtime-claim (lines 302–302) is carried at docs/platform/proposals/doing-coordination-redesign.md#71-runtime-claim (lines 326–326); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 7.1 Runtime Claim

Runtime claim records should include enough data to validate settlement without using durable `doing`.

```json
{
  "claimId": "claim-01K3...",
  "id": "tsk-123",
  "actor": "runner-1",
  "role": "agent",
  "phase": "execute",
  "preClaimStatus": "todo",
  "preClaimRevision": "item-rev-before-claim",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-sha-or-null",
  "claimTrigger": "pick",
  "acquiredAt": "2026-08-25T03:00:00.000Z",
  "lastObservedActivityAt": "2026-08-25T03:10:00.000Z",
  "hardExpiresAt": "2026-08-26T03:00:00.000Z"
}
```

Required properties:

- `claimId` uniquely identifies this ownership lease.
- `id` identifies the work item.
- `actor` identifies the owner allowed to settle or release.
- `preClaimStatus` is the durable status at acquire time.
- `preClaimRevision` is the durable per-item revision/hash at acquire time.
- `acquiredAt` supports audit and diagnostics.
- `lastObservedActivityAt` supports liveness-based reclaim.

`hardExpiresAt` is only a safety backstop. It must not replace real liveness checks.
````

### Full target shown text

````text
### 7.1 Runtime Claim

Runtime claim records should include enough data to validate settlement without using durable `doing`.

```json
{
  "claimId": "claim-01K3...",
  "id": "tsk-123",
  "actor": "runner-1",
  "role": "agent",
  "phase": "execute",
  "preClaimStatus": "todo",
  "preClaimRevision": "item-rev-before-claim",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-sha-or-null",
  "claimTrigger": "pick",
  "acquiredAt": "2026-08-25T03:00:00.000Z",
  "lastObservedActivityAt": "2026-08-25T03:10:00.000Z",
  "hardExpiresAt": "2026-08-26T03:00:00.000Z"
}
```

Required properties:

- `claimId` uniquely identifies this ownership lease.
- `id` identifies the work item.
- `actor` identifies the owner allowed to settle or release.
- `preClaimStatus` is the durable status at acquire time.
- `preClaimRevision` is the durable per-item revision/hash at acquire time.
- `acquiredAt` supports audit and diagnostics.
- `lastObservedActivityAt` supports liveness-based reclaim.

`hardExpiresAt` is only a safety backstop. It must not replace real liveness checks.
````

## claim_6cd113b3358102a002c7395b6f9fd086

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-62, lines 304–304.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-65.
Source digest: 0416f3f163e683ef4cffc379635e4fcdf87fb7a16d3e5317d8bb3ef8495713ea
Target digest: 0416f3f163e683ef4cffc379635e4fcdf87fb7a16d3e5317d8bb3ef8495713ea
Shown source SHA256: 0416f3f163e683ef4cffc379635e4fcdf87fb7a16d3e5317d8bb3ef8495713ea
Shown target SHA256: 0416f3f163e683ef4cffc379635e4fcdf87fb7a16d3e5317d8bb3ef8495713ea

### Proposed decision

```json
{
  "claimId": "claim_6cd113b3358102a002c7395b6f9fd086",
  "sourceUnitDigest": "0416f3f163e683ef4cffc379635e4fcdf87fb7a16d3e5317d8bb3ef8495713ea",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-65",
  "targetUnitDigest": "0416f3f163e683ef4cffc379635e4fcdf87fb7a16d3e5317d8bb3ef8495713ea",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.1 Runtime Claim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-62 (lines 304–304) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-65 (lines 328–328); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Runtime claim records should include enough data to validate settlement without using durable `doing`.
```

### Full target shown text

```text
Runtime claim records should include enough data to validate settlement without using durable `doing`.
```

## claim_cacac9a0346f0c71ee5c6b4e83d7754b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-63, lines 306–323.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-66.
Source digest: a26533d7f3f9629b208b1f38a5b8c1c57880f5418c68ccad0e43283ccf74f0aa
Target digest: a26533d7f3f9629b208b1f38a5b8c1c57880f5418c68ccad0e43283ccf74f0aa
Shown source SHA256: a26533d7f3f9629b208b1f38a5b8c1c57880f5418c68ccad0e43283ccf74f0aa
Shown target SHA256: a26533d7f3f9629b208b1f38a5b8c1c57880f5418c68ccad0e43283ccf74f0aa

### Proposed decision

```json
{
  "claimId": "claim_cacac9a0346f0c71ee5c6b4e83d7754b",
  "sourceUnitDigest": "a26533d7f3f9629b208b1f38a5b8c1c57880f5418c68ccad0e43283ccf74f0aa",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-66",
  "targetUnitDigest": "a26533d7f3f9629b208b1f38a5b8c1c57880f5418c68ccad0e43283ccf74f0aa",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.1 Runtime Claim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-63 (lines 306–323) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-66 (lines 330–347); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```json
{
  "claimId": "claim-01K3...",
  "id": "tsk-123",
  "actor": "runner-1",
  "role": "agent",
  "phase": "execute",
  "preClaimStatus": "todo",
  "preClaimRevision": "item-rev-before-claim",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-sha-or-null",
  "claimTrigger": "pick",
  "acquiredAt": "2026-08-25T03:00:00.000Z",
  "lastObservedActivityAt": "2026-08-25T03:10:00.000Z",
  "hardExpiresAt": "2026-08-26T03:00:00.000Z"
}
```
````

### Full target shown text

````text
```json
{
  "claimId": "claim-01K3...",
  "id": "tsk-123",
  "actor": "runner-1",
  "role": "agent",
  "phase": "execute",
  "preClaimStatus": "todo",
  "preClaimRevision": "item-rev-before-claim",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-sha-or-null",
  "claimTrigger": "pick",
  "acquiredAt": "2026-08-25T03:00:00.000Z",
  "lastObservedActivityAt": "2026-08-25T03:10:00.000Z",
  "hardExpiresAt": "2026-08-26T03:00:00.000Z"
}
```
````
