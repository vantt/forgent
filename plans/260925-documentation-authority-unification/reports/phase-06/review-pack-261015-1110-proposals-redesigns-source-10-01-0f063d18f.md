# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-10-coordination-dispatch-contract.json
Original shard SHA256: 376c6c2fa069affacc50562da30fb481ea9cc825812d18cd814e32d1f482a997
Source file: docs/architect/proposals/coordination-dispatch-contract.md
Part 1/1; entries: **49**. Source-file group 10/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (2): `claim_63fe21c2a65de88c1fd69663557d32c6`, `claim_3bff4a1279be63767ac64ca80a9e7ae3`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 13; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_63fe21c2a65de88c1fd69663557d32c6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-dispatch-contract.md#coordination-dispatch-execution-contract, lines 1–1.
Target: docs/platform/proposals/coordination-dispatch-contract.md#coordination-dispatch-execution-contract.
Source digest: 42436466f569b9645c8f9c31dbead2426e207f0156f0a63aa7f74c8d7e5b51cf
Target digest: 1dfc677cd18cd822072acc9494aea6cdadf3f7a7e46c7cb33a27db1274776b2b
Shown source SHA256: b2b6e9aac69b70fec27a06deaabde4ccbc444a9e6d0eb30177b0a98310edc6de
Shown target SHA256: ae1b3f77df592db522e60b5529b6fd6c20a287c7a5f30fee8144de238cd299ed

### Proposed decision

```json
{
  "claimId": "claim_63fe21c2a65de88c1fd69663557d32c6",
  "sourceUnitDigest": "42436466f569b9645c8f9c31dbead2426e207f0156f0a63aa7f74c8d7e5b51cf",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "coordination-dispatch-execution-contract",
  "targetUnitDigest": "1dfc677cd18cd822072acc9494aea6cdadf3f7a7e46c7cb33a27db1274776b2b",
  "targetAncestry": [],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#coordination-dispatch-execution-contract (lines 1–1) is carried at docs/platform/proposals/coordination-dispatch-contract.md#coordination-dispatch-execution-contract (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
# Coordination ↔ Dispatch & Execution Contract

Document type: Proposal
Design status: Discussion
Implementation: Existing dispatch substrate; proposed coordination seam not yet accepted
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; conceptual boundary for the current architecture review
State class: State

Related: [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),
[Coordination capability envelope](coordination-capability-envelope.md),
[Worker/provider/control boundary](coordination-worker-provider-boundary.md),
[Progress](coordination-envelope-progress.md).
```

### Full target shown text

````text
# Coordination ↔ Dispatch & Execution Contract

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/coordination-dispatch-contract.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 80c315d884fdf211c752f0c53d43a459d4935092
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/coordination-dispatch-contract.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/coordination-dispatch-contract.md).


Document type: Proposal
Design status: Discussion
Implementation: Existing dispatch substrate; proposed coordination seam not yet accepted
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; conceptual boundary for the current architecture review
State class: State

Related: [Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md),
[Coordination capability envelope](../../architect/proposals/coordination-capability-envelope.md),
[Worker/provider/control boundary](../../architect/proposals/coordination-worker-provider-boundary.md),
[Progress](../../architect/proposals/coordination-envelope-progress.md).
````

## claim_517b04975763b42dd775bc2d49f1f559

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-1, lines 3–8.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-4.
Source digest: f9e3d3073004e198e33b6d4b18e7e2d7421415706f66f829df647b48503000da
Target digest: f9e3d3073004e198e33b6d4b18e7e2d7421415706f66f829df647b48503000da
Shown source SHA256: f9e3d3073004e198e33b6d4b18e7e2d7421415706f66f829df647b48503000da
Shown target SHA256: f9e3d3073004e198e33b6d4b18e7e2d7421415706f66f829df647b48503000da

### Proposed decision

```json
{
  "claimId": "claim_517b04975763b42dd775bc2d49f1f559",
  "sourceUnitDigest": "f9e3d3073004e198e33b6d4b18e7e2d7421415706f66f829df647b48503000da",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "f9e3d3073004e198e33b6d4b18e7e2d7421415706f66f829df647b48503000da",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-1 (lines 3–8) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-4 (lines 27–32); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Document type: Proposal
Design status: Discussion
Implementation: Existing dispatch substrate; proposed coordination seam not yet accepted
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; conceptual boundary for the current architecture review
State class: State
```

### Full target shown text

```text
Document type: Proposal
Design status: Discussion
Implementation: Existing dispatch substrate; proposed coordination seam not yet accepted
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; conceptual boundary for the current architecture review
State class: State
```

## claim_3bff4a1279be63767ac64ca80a9e7ae3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-2, lines 10–13.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-5.
Source digest: 6d3276e324ff04a1db3732ad7bbe3a0adb98f7439aa05917100edcf3c70c2f69
Target digest: e41bfc4e3ab998469ceeab7f7d6ec7fc34102db880e8a1c4cbee9df9299adc75
Shown source SHA256: 6d3276e324ff04a1db3732ad7bbe3a0adb98f7439aa05917100edcf3c70c2f69
Shown target SHA256: e41bfc4e3ab998469ceeab7f7d6ec7fc34102db880e8a1c4cbee9df9299adc75

### Proposed decision

```json
{
  "claimId": "claim_3bff4a1279be63767ac64ca80a9e7ae3",
  "sourceUnitDigest": "6d3276e324ff04a1db3732ad7bbe3a0adb98f7439aa05917100edcf3c70c2f69",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "e41bfc4e3ab998469ceeab7f7d6ec7fc34102db880e8a1c4cbee9df9299adc75",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-2 (lines 10–13) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-5 (lines 34–37); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Related: [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),
[Coordination capability envelope](coordination-capability-envelope.md),
[Worker/provider/control boundary](coordination-worker-provider-boundary.md),
[Progress](coordination-envelope-progress.md).
```

### Full target shown text

```text
Related: [Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md),
[Coordination capability envelope](../../architect/proposals/coordination-capability-envelope.md),
[Worker/provider/control boundary](../../architect/proposals/coordination-worker-provider-boundary.md),
[Progress](../../architect/proposals/coordination-envelope-progress.md).
```

## claim_6c299fe3f83c529c32ea5062d20d92a7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#correction-to-the-current-discussion, lines 15–15.
Target: docs/platform/proposals/coordination-dispatch-contract.md#correction-to-the-current-discussion.
Source digest: ee1a347923fa50cdf1e33c36cd894ea0d0a6e6d4c879c1de75104c2c35496d21
Target digest: ee1a347923fa50cdf1e33c36cd894ea0d0a6e6d4c879c1de75104c2c35496d21
Shown source SHA256: 1ff95d00f87fef38409eef108d5d670a33bfd3503a7650c1d586e54d52de7498
Shown target SHA256: 1ff95d00f87fef38409eef108d5d670a33bfd3503a7650c1d586e54d52de7498

### Proposed decision

```json
{
  "claimId": "claim_6c299fe3f83c529c32ea5062d20d92a7",
  "sourceUnitDigest": "ee1a347923fa50cdf1e33c36cd894ea0d0a6e6d4c879c1de75104c2c35496d21",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "correction-to-the-current-discussion",
  "targetUnitDigest": "ee1a347923fa50cdf1e33c36cd894ea0d0a6e6d4c879c1de75104c2c35496d21",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#correction-to-the-current-discussion (lines 15–15) is carried at docs/platform/proposals/coordination-dispatch-contract.md#correction-to-the-current-discussion (lines 39–39); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## Correction to the current discussion

Dispatch & Execution is not an implementation detail or a possible future
provider broker. It is the existing execution substrate through which every
capacity, role, workflow, and stage request is dispatched, unless dispatch
returns `in-process` and the caller uses its live capability to execute inline.

The architecture question is how coordinator judgment becomes a legal request
for this existing system, and how its result returns to deliberation without
Dispatch taking over cognitive method.

```text
coordinator soul / judgment
  -> proposed semantic action
  -> coordination authority + grants + bounds
  -> Assignment / dispatch request
  -> Dispatch & Execution resolution
       -> executor / provider / model / tier / persona / mechanism
       -> in-process OR governed external execution
  -> Run / RunResult / evidence
  -> durable deliberation memory
  -> coordinator chooses the next action
```

`in-process` is a dispatch result, not a coordinator bypass. It means the
current caller has the required live capability; the dispatch decision remains
the authority on whether that mechanism is available.
````

### Full target shown text

````text
## Correction to the current discussion

Dispatch & Execution is not an implementation detail or a possible future
provider broker. It is the existing execution substrate through which every
capacity, role, workflow, and stage request is dispatched, unless dispatch
returns `in-process` and the caller uses its live capability to execute inline.

The architecture question is how coordinator judgment becomes a legal request
for this existing system, and how its result returns to deliberation without
Dispatch taking over cognitive method.

```text
coordinator soul / judgment
  -> proposed semantic action
  -> coordination authority + grants + bounds
  -> Assignment / dispatch request
  -> Dispatch & Execution resolution
       -> executor / provider / model / tier / persona / mechanism
       -> in-process OR governed external execution
  -> Run / RunResult / evidence
  -> durable deliberation memory
  -> coordinator chooses the next action
```

`in-process` is a dispatch result, not a coordinator bypass. It means the
current caller has the required live capability; the dispatch decision remains
the authority on whether that mechanism is available.
````

## claim_71b2ddcda3fa3270fa28baf02049c3fa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-3, lines 17–20.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-6.
Source digest: 2d97760be62fab9d0883187e2387b14b0416c98e67c32f2de78ac6a5f39fc612
Target digest: 2d97760be62fab9d0883187e2387b14b0416c98e67c32f2de78ac6a5f39fc612
Shown source SHA256: 2d97760be62fab9d0883187e2387b14b0416c98e67c32f2de78ac6a5f39fc612
Shown target SHA256: 2d97760be62fab9d0883187e2387b14b0416c98e67c32f2de78ac6a5f39fc612

### Proposed decision

```json
{
  "claimId": "claim_71b2ddcda3fa3270fa28baf02049c3fa",
  "sourceUnitDigest": "2d97760be62fab9d0883187e2387b14b0416c98e67c32f2de78ac6a5f39fc612",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "2d97760be62fab9d0883187e2387b14b0416c98e67c32f2de78ac6a5f39fc612",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Correction to the current discussion"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-3 (lines 17–20) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-6 (lines 41–44); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Dispatch & Execution is not an implementation detail or a possible future
provider broker. It is the existing execution substrate through which every
capacity, role, workflow, and stage request is dispatched, unless dispatch
returns `in-process` and the caller uses its live capability to execute inline.
```

### Full target shown text

```text
Dispatch & Execution is not an implementation detail or a possible future
provider broker. It is the existing execution substrate through which every
capacity, role, workflow, and stage request is dispatched, unless dispatch
returns `in-process` and the caller uses its live capability to execute inline.
```

## claim_e869935cc46e0420810b9e1c17a1ca81

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-4, lines 22–24.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-7.
Source digest: f1e2741a444841c49755186a6cfc00cb7de39a77691228183fde205221f540eb
Target digest: f1e2741a444841c49755186a6cfc00cb7de39a77691228183fde205221f540eb
Shown source SHA256: f1e2741a444841c49755186a6cfc00cb7de39a77691228183fde205221f540eb
Shown target SHA256: f1e2741a444841c49755186a6cfc00cb7de39a77691228183fde205221f540eb

### Proposed decision

```json
{
  "claimId": "claim_e869935cc46e0420810b9e1c17a1ca81",
  "sourceUnitDigest": "f1e2741a444841c49755186a6cfc00cb7de39a77691228183fde205221f540eb",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "f1e2741a444841c49755186a6cfc00cb7de39a77691228183fde205221f540eb",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Correction to the current discussion"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-4 (lines 22–24) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-7 (lines 46–48); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The architecture question is how coordinator judgment becomes a legal request
for this existing system, and how its result returns to deliberation without
Dispatch taking over cognitive method.
```

### Full target shown text

```text
The architecture question is how coordinator judgment becomes a legal request
for this existing system, and how its result returns to deliberation without
Dispatch taking over cognitive method.
```

## claim_219c72f4537dfc8be1e53db073501452

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-5, lines 26–37.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-8.
Source digest: c8b3ef802e75106770f29e1ada182cf81139718a4034c5e81dd2a6dbb46e2223
Target digest: c8b3ef802e75106770f29e1ada182cf81139718a4034c5e81dd2a6dbb46e2223
Shown source SHA256: c8b3ef802e75106770f29e1ada182cf81139718a4034c5e81dd2a6dbb46e2223
Shown target SHA256: c8b3ef802e75106770f29e1ada182cf81139718a4034c5e81dd2a6dbb46e2223

### Proposed decision

```json
{
  "claimId": "claim_219c72f4537dfc8be1e53db073501452",
  "sourceUnitDigest": "c8b3ef802e75106770f29e1ada182cf81139718a4034c5e81dd2a6dbb46e2223",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "c8b3ef802e75106770f29e1ada182cf81139718a4034c5e81dd2a6dbb46e2223",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Correction to the current discussion"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-5 (lines 26–37) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-8 (lines 50–61); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```text
coordinator soul / judgment
  -> proposed semantic action
  -> coordination authority + grants + bounds
  -> Assignment / dispatch request
  -> Dispatch & Execution resolution
       -> executor / provider / model / tier / persona / mechanism
       -> in-process OR governed external execution
  -> Run / RunResult / evidence
  -> durable deliberation memory
  -> coordinator chooses the next action
```
````

### Full target shown text

````text
```text
coordinator soul / judgment
  -> proposed semantic action
  -> coordination authority + grants + bounds
  -> Assignment / dispatch request
  -> Dispatch & Execution resolution
       -> executor / provider / model / tier / persona / mechanism
       -> in-process OR governed external execution
  -> Run / RunResult / evidence
  -> durable deliberation memory
  -> coordinator chooses the next action
```
````

## claim_ca75bdcd10d49cd9b5e0b028bcabd061

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-6, lines 39–41.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-9.
Source digest: 19e303c4322eaf4a6ebddbe201e3f71acd58b85acd10008c9f0e76607d1bfa4a
Target digest: 19e303c4322eaf4a6ebddbe201e3f71acd58b85acd10008c9f0e76607d1bfa4a
Shown source SHA256: 19e303c4322eaf4a6ebddbe201e3f71acd58b85acd10008c9f0e76607d1bfa4a
Shown target SHA256: 19e303c4322eaf4a6ebddbe201e3f71acd58b85acd10008c9f0e76607d1bfa4a

### Proposed decision

```json
{
  "claimId": "claim_ca75bdcd10d49cd9b5e0b028bcabd061",
  "sourceUnitDigest": "19e303c4322eaf4a6ebddbe201e3f71acd58b85acd10008c9f0e76607d1bfa4a",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "19e303c4322eaf4a6ebddbe201e3f71acd58b85acd10008c9f0e76607d1bfa4a",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Correction to the current discussion"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-6 (lines 39–41) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-9 (lines 63–65); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
`in-process` is a dispatch result, not a coordinator bypass. It means the
current caller has the required live capability; the dispatch decision remains
the authority on whether that mechanism is available.
```

### Full target shown text

```text
`in-process` is a dispatch result, not a coordinator bypass. It means the
current caller has the required live capability; the dispatch decision remains
the authority on whether that mechanism is available.
```

## claim_f621d968dd23e9c7e3b2c582a96a9487

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#responsibility-split, lines 43–43.
Target: docs/platform/proposals/coordination-dispatch-contract.md#responsibility-split.
Source digest: 3f2ff796b3d461c07875063d6b47d253d275771961be9f0f166539a0ca692b8a
Target digest: 3f2ff796b3d461c07875063d6b47d253d275771961be9f0f166539a0ca692b8a
Shown source SHA256: 3ce47654db9fa48ecb897f9eb936bc5fd1b52cdcfad8d1218c1c8ffe40661551
Shown target SHA256: 3ce47654db9fa48ecb897f9eb936bc5fd1b52cdcfad8d1218c1c8ffe40661551

### Proposed decision

```json
{
  "claimId": "claim_f621d968dd23e9c7e3b2c582a96a9487",
  "sourceUnitDigest": "3f2ff796b3d461c07875063d6b47d253d275771961be9f0f166539a0ca692b8a",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "responsibility-split",
  "targetUnitDigest": "3f2ff796b3d461c07875063d6b47d253d275771961be9f0f166539a0ca692b8a",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#responsibility-split (lines 43–43) is carried at docs/platform/proposals/coordination-dispatch-contract.md#responsibility-split (lines 67–67); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Responsibility split

| Concern | Coordination | Dispatch & Execution |
|---|---|---|
| Understand/reframe objective | Owns | Does not interpret |
| Choose next cognitive move | Owns within grants/obligations | Does not choose method |
| Choose/request specialist | Proposes and requests | Resolves whether legal and dispatchable |
| Semantic operation | Proposes objective, posture, evidence | Normalizes into Assignment and validates execution contract |
| Role doctrine/soul | Supplies doctrine packet/reference | Delivers packet and records resolved form |
| Capability/context request | Requests attenuation-compatible grants | Enforces scope, egress, and mechanism policy |
| Executor/provider/model/tier | Expresses preference inside authority | Resolves final binding and provenance |
| In-process vs external | Consumes returned mechanism | Decides mechanism and capability requirements |
| Bounds | Chooses within remaining budget | Enforces run limits and reports consumption |
| Worker execution | Interprets result and evidence | Launches, observes, terminates, normalizes |
| Agreement/sufficiency | Assesses evidence and dissent | Reports facts; never infers consensus |
| Close/reopen | Requests or decides within authority | Enforces lifecycle/effect legality |

The same Assignment → DispatchPlan → Run → RunResult path must serve agent-led,
declared-protocol, workflow/stage, and domain-assisted callers. A dynamic
coordinator creates a new Assignment request; it never calls an executor adapter
directly. FlowDefinition supplies defaults and obligations, not a second path.
```

### Full target shown text

```text
## Responsibility split

| Concern | Coordination | Dispatch & Execution |
|---|---|---|
| Understand/reframe objective | Owns | Does not interpret |
| Choose next cognitive move | Owns within grants/obligations | Does not choose method |
| Choose/request specialist | Proposes and requests | Resolves whether legal and dispatchable |
| Semantic operation | Proposes objective, posture, evidence | Normalizes into Assignment and validates execution contract |
| Role doctrine/soul | Supplies doctrine packet/reference | Delivers packet and records resolved form |
| Capability/context request | Requests attenuation-compatible grants | Enforces scope, egress, and mechanism policy |
| Executor/provider/model/tier | Expresses preference inside authority | Resolves final binding and provenance |
| In-process vs external | Consumes returned mechanism | Decides mechanism and capability requirements |
| Bounds | Chooses within remaining budget | Enforces run limits and reports consumption |
| Worker execution | Interprets result and evidence | Launches, observes, terminates, normalizes |
| Agreement/sufficiency | Assesses evidence and dissent | Reports facts; never infers consensus |
| Close/reopen | Requests or decides within authority | Enforces lifecycle/effect legality |

The same Assignment → DispatchPlan → Run → RunResult path must serve agent-led,
declared-protocol, workflow/stage, and domain-assisted callers. A dynamic
coordinator creates a new Assignment request; it never calls an executor adapter
directly. FlowDefinition supplies defaults and obligations, not a second path.
```

## claim_d08762041e1cd43956c480e131fe4fb4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-7, lines 45–58.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-10.
Source digest: e53d7ac7bf528fb63d9651e79dd9ed1c0c7659c3e22bd1aaf687e74504cd3151
Target digest: e53d7ac7bf528fb63d9651e79dd9ed1c0c7659c3e22bd1aaf687e74504cd3151
Shown source SHA256: e53d7ac7bf528fb63d9651e79dd9ed1c0c7659c3e22bd1aaf687e74504cd3151
Shown target SHA256: e53d7ac7bf528fb63d9651e79dd9ed1c0c7659c3e22bd1aaf687e74504cd3151

### Proposed decision

```json
{
  "claimId": "claim_d08762041e1cd43956c480e131fe4fb4",
  "sourceUnitDigest": "e53d7ac7bf528fb63d9651e79dd9ed1c0c7659c3e22bd1aaf687e74504cd3151",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "e53d7ac7bf528fb63d9651e79dd9ed1c0c7659c3e22bd1aaf687e74504cd3151",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Responsibility split"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-7 (lines 45–58) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-10 (lines 69–82); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Concern | Coordination | Dispatch & Execution |
|---|---|---|
| Understand/reframe objective | Owns | Does not interpret |
| Choose next cognitive move | Owns within grants/obligations | Does not choose method |
| Choose/request specialist | Proposes and requests | Resolves whether legal and dispatchable |
| Semantic operation | Proposes objective, posture, evidence | Normalizes into Assignment and validates execution contract |
| Role doctrine/soul | Supplies doctrine packet/reference | Delivers packet and records resolved form |
| Capability/context request | Requests attenuation-compatible grants | Enforces scope, egress, and mechanism policy |
| Executor/provider/model/tier | Expresses preference inside authority | Resolves final binding and provenance |
| In-process vs external | Consumes returned mechanism | Decides mechanism and capability requirements |
| Bounds | Chooses within remaining budget | Enforces run limits and reports consumption |
| Worker execution | Interprets result and evidence | Launches, observes, terminates, normalizes |
| Agreement/sufficiency | Assesses evidence and dissent | Reports facts; never infers consensus |
| Close/reopen | Requests or decides within authority | Enforces lifecycle/effect legality |
```

### Full target shown text

```text
| Concern | Coordination | Dispatch & Execution |
|---|---|---|
| Understand/reframe objective | Owns | Does not interpret |
| Choose next cognitive move | Owns within grants/obligations | Does not choose method |
| Choose/request specialist | Proposes and requests | Resolves whether legal and dispatchable |
| Semantic operation | Proposes objective, posture, evidence | Normalizes into Assignment and validates execution contract |
| Role doctrine/soul | Supplies doctrine packet/reference | Delivers packet and records resolved form |
| Capability/context request | Requests attenuation-compatible grants | Enforces scope, egress, and mechanism policy |
| Executor/provider/model/tier | Expresses preference inside authority | Resolves final binding and provenance |
| In-process vs external | Consumes returned mechanism | Decides mechanism and capability requirements |
| Bounds | Chooses within remaining budget | Enforces run limits and reports consumption |
| Worker execution | Interprets result and evidence | Launches, observes, terminates, normalizes |
| Agreement/sufficiency | Assesses evidence and dissent | Reports facts; never infers consensus |
| Close/reopen | Requests or decides within authority | Enforces lifecycle/effect legality |
```

## claim_590dd4278c12ee2d083e22191f032592

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-8, lines 60–63.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-11.
Source digest: 3fe60153e9df93166625fdde609692271738683e8b89d46c3c24850c3cab6aea
Target digest: 3fe60153e9df93166625fdde609692271738683e8b89d46c3c24850c3cab6aea
Shown source SHA256: 3fe60153e9df93166625fdde609692271738683e8b89d46c3c24850c3cab6aea
Shown target SHA256: 3fe60153e9df93166625fdde609692271738683e8b89d46c3c24850c3cab6aea

### Proposed decision

```json
{
  "claimId": "claim_590dd4278c12ee2d083e22191f032592",
  "sourceUnitDigest": "3fe60153e9df93166625fdde609692271738683e8b89d46c3c24850c3cab6aea",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "3fe60153e9df93166625fdde609692271738683e8b89d46c3c24850c3cab6aea",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Responsibility split"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-8 (lines 60–63) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-11 (lines 84–87); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The same Assignment → DispatchPlan → Run → RunResult path must serve agent-led,
declared-protocol, workflow/stage, and domain-assisted callers. A dynamic
coordinator creates a new Assignment request; it never calls an executor adapter
directly. FlowDefinition supplies defaults and obligations, not a second path.
```

### Full target shown text

```text
The same Assignment → DispatchPlan → Run → RunResult path must serve agent-led,
declared-protocol, workflow/stage, and domain-assisted callers. A dynamic
coordinator creates a new Assignment request; it never calls an executor adapter
directly. FlowDefinition supplies defaults and obligations, not a second path.
```

## claim_408aa3943dc263f475d6a7afbd4f3c00

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#request-shape-without-cognitive-enums, lines 65–65.
Target: docs/platform/proposals/coordination-dispatch-contract.md#request-shape-without-cognitive-enums.
Source digest: f5b6bdd9b6aaa4ac5fff26658796632e12bf90b896d665d9d6541c41907edbbc
Target digest: f5b6bdd9b6aaa4ac5fff26658796632e12bf90b896d665d9d6541c41907edbbc
Shown source SHA256: fe5a7b777eede713fcc6556c0d124f878187feb85f73402565d9123e1520141b
Shown target SHA256: fe5a7b777eede713fcc6556c0d124f878187feb85f73402565d9123e1520141b

### Proposed decision

```json
{
  "claimId": "claim_408aa3943dc263f475d6a7afbd4f3c00",
  "sourceUnitDigest": "f5b6bdd9b6aaa4ac5fff26658796632e12bf90b896d665d9d6541c41907edbbc",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "request-shape-without-cognitive-enums",
  "targetUnitDigest": "f5b6bdd9b6aaa4ac5fff26658796632e12bf90b896d665d9d6541c41907edbbc",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#request-shape-without-cognitive-enums (lines 65–65) is carried at docs/platform/proposals/coordination-dispatch-contract.md#request-shape-without-cognitive-enums (lines 89–89); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## Request shape without cognitive enums

```yaml
proposedAction:
  objective: <what this invocation should establish or change>
  posture: <open doctrine or role packet reference>
  contextGrant: <attenuated refs and exposure constraints>
  capabilityRequest: <tools/resources requested>
  expectedEvidence: <artifact/result/evidence requirements>
  mutation: read-only | mutating
  parent: <coordinator/session lineage>
  bounds: <remaining child budget and depth>
  routingPreference: <executor/provider/model/tier/persona preferences>
```

Runtime validates effectful fields and produces an Assignment. “Investigate”,
“challenge”, “reframe”, “synthesize”, “Delphi”, and “red-team” remain doctrine
unless a use case explicitly turns one into a hard obligation. They do not create
new execution engines.
````

### Full target shown text

````text
## Request shape without cognitive enums

```yaml
proposedAction:
  objective: <what this invocation should establish or change>
  posture: <open doctrine or role packet reference>
  contextGrant: <attenuated refs and exposure constraints>
  capabilityRequest: <tools/resources requested>
  expectedEvidence: <artifact/result/evidence requirements>
  mutation: read-only | mutating
  parent: <coordinator/session lineage>
  bounds: <remaining child budget and depth>
  routingPreference: <executor/provider/model/tier/persona preferences>
```

Runtime validates effectful fields and produces an Assignment. “Investigate”,
“challenge”, “reframe”, “synthesize”, “Delphi”, and “red-team” remain doctrine
unless a use case explicitly turns one into a hard obligation. They do not create
new execution engines.
````

## claim_8defbffa24d8c19c2bb810cb733d7145

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-9, lines 67–78.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-12.
Source digest: 8e75d7b132728be6aff5258b645bb228ffee123bd46eab52a04bf89ed6da1427
Target digest: 8e75d7b132728be6aff5258b645bb228ffee123bd46eab52a04bf89ed6da1427
Shown source SHA256: 8e75d7b132728be6aff5258b645bb228ffee123bd46eab52a04bf89ed6da1427
Shown target SHA256: 8e75d7b132728be6aff5258b645bb228ffee123bd46eab52a04bf89ed6da1427

### Proposed decision

```json
{
  "claimId": "claim_8defbffa24d8c19c2bb810cb733d7145",
  "sourceUnitDigest": "8e75d7b132728be6aff5258b645bb228ffee123bd46eab52a04bf89ed6da1427",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "8e75d7b132728be6aff5258b645bb228ffee123bd46eab52a04bf89ed6da1427",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Request shape without cognitive enums"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-9 (lines 67–78) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-12 (lines 91–102); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
proposedAction:
  objective: <what this invocation should establish or change>
  posture: <open doctrine or role packet reference>
  contextGrant: <attenuated refs and exposure constraints>
  capabilityRequest: <tools/resources requested>
  expectedEvidence: <artifact/result/evidence requirements>
  mutation: read-only | mutating
  parent: <coordinator/session lineage>
  bounds: <remaining child budget and depth>
  routingPreference: <executor/provider/model/tier/persona preferences>
```
````

### Full target shown text

````text
```yaml
proposedAction:
  objective: <what this invocation should establish or change>
  posture: <open doctrine or role packet reference>
  contextGrant: <attenuated refs and exposure constraints>
  capabilityRequest: <tools/resources requested>
  expectedEvidence: <artifact/result/evidence requirements>
  mutation: read-only | mutating
  parent: <coordinator/session lineage>
  bounds: <remaining child budget and depth>
  routingPreference: <executor/provider/model/tier/persona preferences>
```
````

## claim_24003227a08b12dff5e19cd3c829b521

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-10, lines 80–83.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-13.
Source digest: aacd0f0bce962c80116a49c6188183608c9fd9dd8522da14a96145278642ee4d
Target digest: aacd0f0bce962c80116a49c6188183608c9fd9dd8522da14a96145278642ee4d
Shown source SHA256: aacd0f0bce962c80116a49c6188183608c9fd9dd8522da14a96145278642ee4d
Shown target SHA256: aacd0f0bce962c80116a49c6188183608c9fd9dd8522da14a96145278642ee4d

### Proposed decision

```json
{
  "claimId": "claim_24003227a08b12dff5e19cd3c829b521",
  "sourceUnitDigest": "aacd0f0bce962c80116a49c6188183608c9fd9dd8522da14a96145278642ee4d",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "aacd0f0bce962c80116a49c6188183608c9fd9dd8522da14a96145278642ee4d",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Request shape without cognitive enums"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-10 (lines 80–83) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-13 (lines 104–107); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Runtime validates effectful fields and produces an Assignment. “Investigate”,
“challenge”, “reframe”, “synthesize”, “Delphi”, and “red-team” remain doctrine
unless a use case explicitly turns one into a hard obligation. They do not create
new execution engines.
```

### Full target shown text

```text
Runtime validates effectful fields and produces an Assignment. “Investigate”,
“challenge”, “reframe”, “synthesize”, “Delphi”, and “red-team” remain doctrine
unless a use case explicitly turns one into a hard obligation. They do not create
new execution engines.
```

## claim_e1faa3f1423e438c0272274a84008103

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#adaptive-recruitment, lines 85–85.
Target: docs/platform/proposals/coordination-dispatch-contract.md#adaptive-recruitment.
Source digest: 94c43776bb01075dee079a37ec2c501f112c9b33ba95c4add9e900cc68176398
Target digest: 94c43776bb01075dee079a37ec2c501f112c9b33ba95c4add9e900cc68176398
Shown source SHA256: fbfd9aa7de77fc2838cb2cc9469550585bc0a334e47bb59a3550dfc7c21d251a
Shown target SHA256: fbfd9aa7de77fc2838cb2cc9469550585bc0a334e47bb59a3550dfc7c21d251a

### Proposed decision

```json
{
  "claimId": "claim_e1faa3f1423e438c0272274a84008103",
  "sourceUnitDigest": "94c43776bb01075dee079a37ec2c501f112c9b33ba95c4add9e900cc68176398",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "adaptive-recruitment",
  "targetUnitDigest": "94c43776bb01075dee079a37ec2c501f112c9b33ba95c4add9e900cc68176398",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#adaptive-recruitment (lines 85–85) is carried at docs/platform/proposals/coordination-dispatch-contract.md#adaptive-recruitment (lines 109–109); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Adaptive recruitment

1. Coordinator proposes a bounded Assignment with objective, posture, context,
   capability request, evidence requirement, and routing preference.
2. Coordination authority checks membership, obligation preservation, budget,
   depth, and disclosure rules.
3. Dispatch & Execution resolves the request and returns a legal mechanism or a
   refusal with reason.
4. Run/RunResult joins the same session lineage and replay log.
5. Coordinator evaluates the result and chooses the next action.

This is adaptive coordination judgment, not arbitrary runtime graph mutation.
The runtime still refuses an unbounded worker pool, ambient context, foreign
evidence, or a mutation outside the grant.

The current public request surface has not proven this complete path. Engine
internals contain consult/specialist/retry/replacement/cancellation capabilities,
but the audit has not shown that an adaptive coordinator can use them through one
public session contract with complete lineage and bounds. This is the next
capability-fit question; it does not imply a new executor stack.
```

### Full target shown text

```text
## Adaptive recruitment

1. Coordinator proposes a bounded Assignment with objective, posture, context,
   capability request, evidence requirement, and routing preference.
2. Coordination authority checks membership, obligation preservation, budget,
   depth, and disclosure rules.
3. Dispatch & Execution resolves the request and returns a legal mechanism or a
   refusal with reason.
4. Run/RunResult joins the same session lineage and replay log.
5. Coordinator evaluates the result and chooses the next action.

This is adaptive coordination judgment, not arbitrary runtime graph mutation.
The runtime still refuses an unbounded worker pool, ambient context, foreign
evidence, or a mutation outside the grant.

The current public request surface has not proven this complete path. Engine
internals contain consult/specialist/retry/replacement/cancellation capabilities,
but the audit has not shown that an adaptive coordinator can use them through one
public session contract with complete lineage and bounds. This is the next
capability-fit question; it does not imply a new executor stack.
```

## claim_93fc8ec7082cc77bea556741c03b180f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-11, lines 87–94.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-14.
Source digest: 6093bc38061ab9137b05ccf52278b401535b6634fae39fa4841881e3f91c7f83
Target digest: 6093bc38061ab9137b05ccf52278b401535b6634fae39fa4841881e3f91c7f83
Shown source SHA256: 6093bc38061ab9137b05ccf52278b401535b6634fae39fa4841881e3f91c7f83
Shown target SHA256: 6093bc38061ab9137b05ccf52278b401535b6634fae39fa4841881e3f91c7f83

### Proposed decision

```json
{
  "claimId": "claim_93fc8ec7082cc77bea556741c03b180f",
  "sourceUnitDigest": "6093bc38061ab9137b05ccf52278b401535b6634fae39fa4841881e3f91c7f83",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "6093bc38061ab9137b05ccf52278b401535b6634fae39fa4841881e3f91c7f83",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Adaptive recruitment"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-11 (lines 87–94) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-14 (lines 111–118); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. Coordinator proposes a bounded Assignment with objective, posture, context,
   capability request, evidence requirement, and routing preference.
2. Coordination authority checks membership, obligation preservation, budget,
   depth, and disclosure rules.
3. Dispatch & Execution resolves the request and returns a legal mechanism or a
   refusal with reason.
4. Run/RunResult joins the same session lineage and replay log.
5. Coordinator evaluates the result and chooses the next action.
```

### Full target shown text

```text
1. Coordinator proposes a bounded Assignment with objective, posture, context,
   capability request, evidence requirement, and routing preference.
2. Coordination authority checks membership, obligation preservation, budget,
   depth, and disclosure rules.
3. Dispatch & Execution resolves the request and returns a legal mechanism or a
   refusal with reason.
4. Run/RunResult joins the same session lineage and replay log.
5. Coordinator evaluates the result and chooses the next action.
```

## claim_a3e838e16cf97a30bba10d87f83427df

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-12, lines 96–98.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-15.
Source digest: 8dd1d54bb2641afa2b9bc29718c0b0763f67955890a8feafe3b7d8248aa25431
Target digest: 8dd1d54bb2641afa2b9bc29718c0b0763f67955890a8feafe3b7d8248aa25431
Shown source SHA256: 8dd1d54bb2641afa2b9bc29718c0b0763f67955890a8feafe3b7d8248aa25431
Shown target SHA256: 8dd1d54bb2641afa2b9bc29718c0b0763f67955890a8feafe3b7d8248aa25431

### Proposed decision

```json
{
  "claimId": "claim_a3e838e16cf97a30bba10d87f83427df",
  "sourceUnitDigest": "8dd1d54bb2641afa2b9bc29718c0b0763f67955890a8feafe3b7d8248aa25431",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "8dd1d54bb2641afa2b9bc29718c0b0763f67955890a8feafe3b7d8248aa25431",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Adaptive recruitment"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-12 (lines 96–98) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-15 (lines 120–122); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This is adaptive coordination judgment, not arbitrary runtime graph mutation.
The runtime still refuses an unbounded worker pool, ambient context, foreign
evidence, or a mutation outside the grant.
```

### Full target shown text

```text
This is adaptive coordination judgment, not arbitrary runtime graph mutation.
The runtime still refuses an unbounded worker pool, ambient context, foreign
evidence, or a mutation outside the grant.
```

## claim_2143d69c8c245802d14b8b7111ae3c36

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-13, lines 100–104.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-16.
Source digest: 2a894a3fa75a50a5a2289ff223e2cbf6362a9736910d18091dbe93c88504a66a
Target digest: 2a894a3fa75a50a5a2289ff223e2cbf6362a9736910d18091dbe93c88504a66a
Shown source SHA256: 2a894a3fa75a50a5a2289ff223e2cbf6362a9736910d18091dbe93c88504a66a
Shown target SHA256: 2a894a3fa75a50a5a2289ff223e2cbf6362a9736910d18091dbe93c88504a66a

### Proposed decision

```json
{
  "claimId": "claim_2143d69c8c245802d14b8b7111ae3c36",
  "sourceUnitDigest": "2a894a3fa75a50a5a2289ff223e2cbf6362a9736910d18091dbe93c88504a66a",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "2a894a3fa75a50a5a2289ff223e2cbf6362a9736910d18091dbe93c88504a66a",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Adaptive recruitment"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-13 (lines 100–104) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-16 (lines 124–128); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The current public request surface has not proven this complete path. Engine
internals contain consult/specialist/retry/replacement/cancellation capabilities,
but the audit has not shown that an adaptive coordinator can use them through one
public session contract with complete lineage and bounds. This is the next
capability-fit question; it does not imply a new executor stack.
```

### Full target shown text

```text
The current public request surface has not proven this complete path. Engine
internals contain consult/specialist/retry/replacement/cancellation capabilities,
but the audit has not shown that an adaptive coordinator can use them through one
public session contract with complete lineage and bounds. This is the next
capability-fit question; it does not imply a new executor stack.
```

## claim_14cd3005346d53ee63f1532ff998b669

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#minimal-capability-contract, lines 106–106.
Target: docs/platform/proposals/coordination-dispatch-contract.md#minimal-capability-contract.
Source digest: edcef1c324b82d765068122890288397521fdda351e96464c8b7271751ae8ec4
Target digest: edcef1c324b82d765068122890288397521fdda351e96464c8b7271751ae8ec4
Shown source SHA256: 15599ce25cd6067955a4ddf572c39959df2353ca218bedbd150dbe40e24f81f2
Shown target SHA256: 15599ce25cd6067955a4ddf572c39959df2353ca218bedbd150dbe40e24f81f2

### Proposed decision

```json
{
  "claimId": "claim_14cd3005346d53ee63f1532ff998b669",
  "sourceUnitDigest": "edcef1c324b82d765068122890288397521fdda351e96464c8b7271751ae8ec4",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "minimal-capability-contract",
  "targetUnitDigest": "edcef1c324b82d765068122890288397521fdda351e96464c8b7271751ae8ec4",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#minimal-capability-contract (lines 106–106) is carried at docs/platform/proposals/coordination-dispatch-contract.md#minimal-capability-contract (lines 130–130); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Minimal capability contract

Coordination should depend on a small effect-oriented Dispatch port, not on the
internal names of one protocol graph. These capabilities describe authority and
evidence obligations; they are not cognitive role enums.

| Capability | Coordinator may propose | Dispatch must enforce | Durable result |
|---|---|---|---|
| `createAssignment` | New bounded semantic work, including an unanticipated specialist | Principal, lineage, context subset, capability floor, budget, depth, mutation policy | Assignment and resolved policy/provenance |
| `retryRun` | Repeat an uncertain or failed attempt | Idempotency, retry cap, revision validity, budget reservation | New Run linked to prior attempt |
| `recheckRevision` | Reassess a changed candidate/evidence revision | Target revision pin and independent context rules | New assessment Run and invalidation link |
| `replaceActor` | Replace unavailable or unsuitable executor/actor | Replacement authority and obligation compatibility | Replacement event and provenance |
| `cancelRun` | Stop work no longer useful or safe | Caller authority, process/effect cancellation, reconciliation | Cancellation event and unresolved-effect status |
| `requestMutation` | Ask for candidate-producing or mutating execution | Resource owner, root, expected revision, mutation grant | Candidate artifact and RunResult; never automatic integration |
| `executeInProcess` | Use caller's live capability when resolved | Declared capability identity, same bounds/evidence contract | In-process receipt with capability provenance |

The port returns a governed execution result or a typed refusal. A refusal is
ordinary coordination input: the coordinator may choose another method, ask a
human, or stop. It is not permission to import the engine and call an adapter.
```

### Full target shown text

```text
## Minimal capability contract

Coordination should depend on a small effect-oriented Dispatch port, not on the
internal names of one protocol graph. These capabilities describe authority and
evidence obligations; they are not cognitive role enums.

| Capability | Coordinator may propose | Dispatch must enforce | Durable result |
|---|---|---|---|
| `createAssignment` | New bounded semantic work, including an unanticipated specialist | Principal, lineage, context subset, capability floor, budget, depth, mutation policy | Assignment and resolved policy/provenance |
| `retryRun` | Repeat an uncertain or failed attempt | Idempotency, retry cap, revision validity, budget reservation | New Run linked to prior attempt |
| `recheckRevision` | Reassess a changed candidate/evidence revision | Target revision pin and independent context rules | New assessment Run and invalidation link |
| `replaceActor` | Replace unavailable or unsuitable executor/actor | Replacement authority and obligation compatibility | Replacement event and provenance |
| `cancelRun` | Stop work no longer useful or safe | Caller authority, process/effect cancellation, reconciliation | Cancellation event and unresolved-effect status |
| `requestMutation` | Ask for candidate-producing or mutating execution | Resource owner, root, expected revision, mutation grant | Candidate artifact and RunResult; never automatic integration |
| `executeInProcess` | Use caller's live capability when resolved | Declared capability identity, same bounds/evidence contract | In-process receipt with capability provenance |

The port returns a governed execution result or a typed refusal. A refusal is
ordinary coordination input: the coordinator may choose another method, ask a
human, or stop. It is not permission to import the engine and call an adapter.
```

## claim_432f13e58da3a9765648ab3eee655dd4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-14, lines 108–110.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-17.
Source digest: a17d32119feab2e1692a1702145352e644e666fcb027828d79c6ee06e74c106e
Target digest: a17d32119feab2e1692a1702145352e644e666fcb027828d79c6ee06e74c106e
Shown source SHA256: a17d32119feab2e1692a1702145352e644e666fcb027828d79c6ee06e74c106e
Shown target SHA256: a17d32119feab2e1692a1702145352e644e666fcb027828d79c6ee06e74c106e

### Proposed decision

```json
{
  "claimId": "claim_432f13e58da3a9765648ab3eee655dd4",
  "sourceUnitDigest": "a17d32119feab2e1692a1702145352e644e666fcb027828d79c6ee06e74c106e",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "a17d32119feab2e1692a1702145352e644e666fcb027828d79c6ee06e74c106e",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Minimal capability contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-14 (lines 108–110) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-17 (lines 132–134); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Coordination should depend on a small effect-oriented Dispatch port, not on the
internal names of one protocol graph. These capabilities describe authority and
evidence obligations; they are not cognitive role enums.
```

### Full target shown text

```text
Coordination should depend on a small effect-oriented Dispatch port, not on the
internal names of one protocol graph. These capabilities describe authority and
evidence obligations; they are not cognitive role enums.
```

## claim_339a1435e44e43cf06066ea3429bc721

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-15, lines 112–120.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-18.
Source digest: 5cdbde9a2e7ae88a910007182d85c8f7250315f63e4a70ffd71a4172fc292bec
Target digest: 5cdbde9a2e7ae88a910007182d85c8f7250315f63e4a70ffd71a4172fc292bec
Shown source SHA256: 5cdbde9a2e7ae88a910007182d85c8f7250315f63e4a70ffd71a4172fc292bec
Shown target SHA256: 5cdbde9a2e7ae88a910007182d85c8f7250315f63e4a70ffd71a4172fc292bec

### Proposed decision

```json
{
  "claimId": "claim_339a1435e44e43cf06066ea3429bc721",
  "sourceUnitDigest": "5cdbde9a2e7ae88a910007182d85c8f7250315f63e4a70ffd71a4172fc292bec",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "5cdbde9a2e7ae88a910007182d85c8f7250315f63e4a70ffd71a4172fc292bec",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Minimal capability contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-15 (lines 112–120) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-18 (lines 136–144); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Capability | Coordinator may propose | Dispatch must enforce | Durable result |
|---|---|---|---|
| `createAssignment` | New bounded semantic work, including an unanticipated specialist | Principal, lineage, context subset, capability floor, budget, depth, mutation policy | Assignment and resolved policy/provenance |
| `retryRun` | Repeat an uncertain or failed attempt | Idempotency, retry cap, revision validity, budget reservation | New Run linked to prior attempt |
| `recheckRevision` | Reassess a changed candidate/evidence revision | Target revision pin and independent context rules | New assessment Run and invalidation link |
| `replaceActor` | Replace unavailable or unsuitable executor/actor | Replacement authority and obligation compatibility | Replacement event and provenance |
| `cancelRun` | Stop work no longer useful or safe | Caller authority, process/effect cancellation, reconciliation | Cancellation event and unresolved-effect status |
| `requestMutation` | Ask for candidate-producing or mutating execution | Resource owner, root, expected revision, mutation grant | Candidate artifact and RunResult; never automatic integration |
| `executeInProcess` | Use caller's live capability when resolved | Declared capability identity, same bounds/evidence contract | In-process receipt with capability provenance |
```

### Full target shown text

```text
| Capability | Coordinator may propose | Dispatch must enforce | Durable result |
|---|---|---|---|
| `createAssignment` | New bounded semantic work, including an unanticipated specialist | Principal, lineage, context subset, capability floor, budget, depth, mutation policy | Assignment and resolved policy/provenance |
| `retryRun` | Repeat an uncertain or failed attempt | Idempotency, retry cap, revision validity, budget reservation | New Run linked to prior attempt |
| `recheckRevision` | Reassess a changed candidate/evidence revision | Target revision pin and independent context rules | New assessment Run and invalidation link |
| `replaceActor` | Replace unavailable or unsuitable executor/actor | Replacement authority and obligation compatibility | Replacement event and provenance |
| `cancelRun` | Stop work no longer useful or safe | Caller authority, process/effect cancellation, reconciliation | Cancellation event and unresolved-effect status |
| `requestMutation` | Ask for candidate-producing or mutating execution | Resource owner, root, expected revision, mutation grant | Candidate artifact and RunResult; never automatic integration |
| `executeInProcess` | Use caller's live capability when resolved | Declared capability identity, same bounds/evidence contract | In-process receipt with capability provenance |
```

## claim_966c6efd2ee4766cf8bb4d897f6e0d10

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-16, lines 122–124.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-19.
Source digest: 1889a11dd41ba7fd04e5591a449e4e9d09e12bedd62afc1e4273ef459565d8e9
Target digest: 1889a11dd41ba7fd04e5591a449e4e9d09e12bedd62afc1e4273ef459565d8e9
Shown source SHA256: 1889a11dd41ba7fd04e5591a449e4e9d09e12bedd62afc1e4273ef459565d8e9
Shown target SHA256: 1889a11dd41ba7fd04e5591a449e4e9d09e12bedd62afc1e4273ef459565d8e9

### Proposed decision

```json
{
  "claimId": "claim_966c6efd2ee4766cf8bb4d897f6e0d10",
  "sourceUnitDigest": "1889a11dd41ba7fd04e5591a449e4e9d09e12bedd62afc1e4273ef459565d8e9",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "1889a11dd41ba7fd04e5591a449e4e9d09e12bedd62afc1e4273ef459565d8e9",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Minimal capability contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-16 (lines 122–124) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-19 (lines 146–148); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The port returns a governed execution result or a typed refusal. A refusal is
ordinary coordination input: the coordinator may choose another method, ask a
human, or stop. It is not permission to import the engine and call an adapter.
```

### Full target shown text

```text
The port returns a governed execution result or a typed refusal. A refusal is
ordinary coordination input: the coordinator may choose another method, ask a
human, or stop. It is not permission to import the engine and call an adapter.
```

## claim_dafaca7642e04b86e7267deceb0a4de8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#coordinator-facing-dispatch-port, lines 126–126.
Target: docs/platform/proposals/coordination-dispatch-contract.md#coordinator-facing-dispatch-port.
Source digest: 19c5252943c5a8810463ca00d81cb312f288f7da576300363086d2ff0f993a85
Target digest: 19c5252943c5a8810463ca00d81cb312f288f7da576300363086d2ff0f993a85
Shown source SHA256: 49636893b2ecf6e1a6919d0508ca553abc928331659afe71d7e45cde81d82611
Shown target SHA256: 49636893b2ecf6e1a6919d0508ca553abc928331659afe71d7e45cde81d82611

### Proposed decision

```json
{
  "claimId": "claim_dafaca7642e04b86e7267deceb0a4de8",
  "sourceUnitDigest": "19c5252943c5a8810463ca00d81cb312f288f7da576300363086d2ff0f993a85",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "coordinator-facing-dispatch-port",
  "targetUnitDigest": "19c5252943c5a8810463ca00d81cb312f288f7da576300363086d2ff0f993a85",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#coordinator-facing-dispatch-port (lines 126–126) is carried at docs/platform/proposals/coordination-dispatch-contract.md#coordinator-facing-dispatch-port (lines 150–150); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## Coordinator-facing Dispatch port

The coordinator-facing surface should expose one intent-neutral request door. It
does not need separate kernel operations named `investigate`, `challenge`,
`debate`, or `reframe`. Those remain in the objective and doctrine packet.

Conceptually:

```js
dispatchCoordinationAction({
  coordination: {
    id,
    epoch,
    parentRef,
    obligationRefs,
  },
  action: {
    kind: 'assignment' | 'retry' | 'recheck' | 'replacement' | 'cancel' | 'mutation',
    objective,
    actor: { id?, role?, doctrineRef?, capabilities? },
    contextGrant: { refs, revisions, disclosure },
    evidenceContract: { expectedOutputs, checks, sourcePins },
    mutation: 'read-only' | 'candidate-only' | 'resource-effect',
    routingPreference: { executor?, provider?, model?, tier?, persona? },
    bounds: { attempts?, concurrency?, depth?, cost? },
    idempotencyKey,
  },
}, callerContext)
```

The exact API shape is deliberately not accepted here. The important boundary is
that the request contains a semantic objective and effect constraints, while the
runtime derives the concrete Assignment, binding, mechanism, and Run. `kind`
selects an effect family, not a cognitive posture; the same Assignment path is
used after validation.

The response has two layers:

```yaml
dispatchDecision:
  status: accepted | refused | pending-reconciliation
  refusal: <typed reason, when refused>
  assignmentRef: <when materialized>
  runRef: <when launched>
  mechanism: <resolved mechanism, including in-process>
  policyProvenance: <resolved executor/provider/model/tier/persona/grants>
  boundsReservation: <what was reserved and consumed>
  evidenceRefs: <RunResult/artifact refs when settled>
```

`pending-reconciliation` is necessary after a crash or uncertain external effect:
the coordinator must not turn an unknown result into a retry or a success merely
because the local process disappeared.
````

### Full target shown text

````text
## Coordinator-facing Dispatch port

The coordinator-facing surface should expose one intent-neutral request door. It
does not need separate kernel operations named `investigate`, `challenge`,
`debate`, or `reframe`. Those remain in the objective and doctrine packet.

Conceptually:

```js
dispatchCoordinationAction({
  coordination: {
    id,
    epoch,
    parentRef,
    obligationRefs,
  },
  action: {
    kind: 'assignment' | 'retry' | 'recheck' | 'replacement' | 'cancel' | 'mutation',
    objective,
    actor: { id?, role?, doctrineRef?, capabilities? },
    contextGrant: { refs, revisions, disclosure },
    evidenceContract: { expectedOutputs, checks, sourcePins },
    mutation: 'read-only' | 'candidate-only' | 'resource-effect',
    routingPreference: { executor?, provider?, model?, tier?, persona? },
    bounds: { attempts?, concurrency?, depth?, cost? },
    idempotencyKey,
  },
}, callerContext)
```

The exact API shape is deliberately not accepted here. The important boundary is
that the request contains a semantic objective and effect constraints, while the
runtime derives the concrete Assignment, binding, mechanism, and Run. `kind`
selects an effect family, not a cognitive posture; the same Assignment path is
used after validation.

The response has two layers:

```yaml
dispatchDecision:
  status: accepted | refused | pending-reconciliation
  refusal: <typed reason, when refused>
  assignmentRef: <when materialized>
  runRef: <when launched>
  mechanism: <resolved mechanism, including in-process>
  policyProvenance: <resolved executor/provider/model/tier/persona/grants>
  boundsReservation: <what was reserved and consumed>
  evidenceRefs: <RunResult/artifact refs when settled>
```

`pending-reconciliation` is necessary after a crash or uncertain external effect:
the coordinator must not turn an unknown result into a retry or a success merely
because the local process disappeared.
````

## claim_56b3ade05decde0dbdd4f3d317abfe65

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-17, lines 128–130.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-20.
Source digest: cd4a011f127cba1f97ba62a180716158847a491401d935a091d0aa63a47dab0b
Target digest: cd4a011f127cba1f97ba62a180716158847a491401d935a091d0aa63a47dab0b
Shown source SHA256: cd4a011f127cba1f97ba62a180716158847a491401d935a091d0aa63a47dab0b
Shown target SHA256: cd4a011f127cba1f97ba62a180716158847a491401d935a091d0aa63a47dab0b

### Proposed decision

```json
{
  "claimId": "claim_56b3ade05decde0dbdd4f3d317abfe65",
  "sourceUnitDigest": "cd4a011f127cba1f97ba62a180716158847a491401d935a091d0aa63a47dab0b",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "cd4a011f127cba1f97ba62a180716158847a491401d935a091d0aa63a47dab0b",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-17 (lines 128–130) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-20 (lines 152–154); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The coordinator-facing surface should expose one intent-neutral request door. It
does not need separate kernel operations named `investigate`, `challenge`,
`debate`, or `reframe`. Those remain in the objective and doctrine packet.
```

### Full target shown text

```text
The coordinator-facing surface should expose one intent-neutral request door. It
does not need separate kernel operations named `investigate`, `challenge`,
`debate`, or `reframe`. Those remain in the objective and doctrine packet.
```

## claim_97297606d754a9d51d41f0e4de6888e9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-18, lines 132–154.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-21.
Source digest: f82b0acdc7dcf4c0a8da3d00a687e029b41bd633befeb8195c1d9b4b9840501f
Target digest: f82b0acdc7dcf4c0a8da3d00a687e029b41bd633befeb8195c1d9b4b9840501f
Shown source SHA256: f82b0acdc7dcf4c0a8da3d00a687e029b41bd633befeb8195c1d9b4b9840501f
Shown target SHA256: f82b0acdc7dcf4c0a8da3d00a687e029b41bd633befeb8195c1d9b4b9840501f

### Proposed decision

```json
{
  "claimId": "claim_97297606d754a9d51d41f0e4de6888e9",
  "sourceUnitDigest": "f82b0acdc7dcf4c0a8da3d00a687e029b41bd633befeb8195c1d9b4b9840501f",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "f82b0acdc7dcf4c0a8da3d00a687e029b41bd633befeb8195c1d9b4b9840501f",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-18 (lines 132–154) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-21 (lines 156–178); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
Conceptually:

```js
dispatchCoordinationAction({
  coordination: {
    id,
    epoch,
    parentRef,
    obligationRefs,
  },
  action: {
    kind: 'assignment' | 'retry' | 'recheck' | 'replacement' | 'cancel' | 'mutation',
    objective,
    actor: { id?, role?, doctrineRef?, capabilities? },
    contextGrant: { refs, revisions, disclosure },
    evidenceContract: { expectedOutputs, checks, sourcePins },
    mutation: 'read-only' | 'candidate-only' | 'resource-effect',
    routingPreference: { executor?, provider?, model?, tier?, persona? },
    bounds: { attempts?, concurrency?, depth?, cost? },
    idempotencyKey,
  },
}, callerContext)
```
````

### Full target shown text

````text
Conceptually:

```js
dispatchCoordinationAction({
  coordination: {
    id,
    epoch,
    parentRef,
    obligationRefs,
  },
  action: {
    kind: 'assignment' | 'retry' | 'recheck' | 'replacement' | 'cancel' | 'mutation',
    objective,
    actor: { id?, role?, doctrineRef?, capabilities? },
    contextGrant: { refs, revisions, disclosure },
    evidenceContract: { expectedOutputs, checks, sourcePins },
    mutation: 'read-only' | 'candidate-only' | 'resource-effect',
    routingPreference: { executor?, provider?, model?, tier?, persona? },
    bounds: { attempts?, concurrency?, depth?, cost? },
    idempotencyKey,
  },
}, callerContext)
```
````

## claim_c7b00519387946a5bfe3905ab69fbfad

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-19, lines 156–160.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-22.
Source digest: 164c7634b185440519cdb9a80b5603ad4a873384ad0d789febf63b5d62ad5140
Target digest: 164c7634b185440519cdb9a80b5603ad4a873384ad0d789febf63b5d62ad5140
Shown source SHA256: 164c7634b185440519cdb9a80b5603ad4a873384ad0d789febf63b5d62ad5140
Shown target SHA256: 164c7634b185440519cdb9a80b5603ad4a873384ad0d789febf63b5d62ad5140

### Proposed decision

```json
{
  "claimId": "claim_c7b00519387946a5bfe3905ab69fbfad",
  "sourceUnitDigest": "164c7634b185440519cdb9a80b5603ad4a873384ad0d789febf63b5d62ad5140",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "164c7634b185440519cdb9a80b5603ad4a873384ad0d789febf63b5d62ad5140",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-19 (lines 156–160) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-22 (lines 180–184); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The exact API shape is deliberately not accepted here. The important boundary is
that the request contains a semantic objective and effect constraints, while the
runtime derives the concrete Assignment, binding, mechanism, and Run. `kind`
selects an effect family, not a cognitive posture; the same Assignment path is
used after validation.
```

### Full target shown text

```text
The exact API shape is deliberately not accepted here. The important boundary is
that the request contains a semantic objective and effect constraints, while the
runtime derives the concrete Assignment, binding, mechanism, and Run. `kind`
selects an effect family, not a cognitive posture; the same Assignment path is
used after validation.
```

## claim_25a5ce5bd6247082f44a706c710f9aed

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-20, lines 162–162.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-23.
Source digest: e15cb153c2227466d565563ae1eda63bbea7450338dcd8c314c411b1ecbbb778
Target digest: e15cb153c2227466d565563ae1eda63bbea7450338dcd8c314c411b1ecbbb778
Shown source SHA256: e15cb153c2227466d565563ae1eda63bbea7450338dcd8c314c411b1ecbbb778
Shown target SHA256: e15cb153c2227466d565563ae1eda63bbea7450338dcd8c314c411b1ecbbb778

### Proposed decision

```json
{
  "claimId": "claim_25a5ce5bd6247082f44a706c710f9aed",
  "sourceUnitDigest": "e15cb153c2227466d565563ae1eda63bbea7450338dcd8c314c411b1ecbbb778",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "e15cb153c2227466d565563ae1eda63bbea7450338dcd8c314c411b1ecbbb778",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-20 (lines 162–162) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-23 (lines 186–186); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The response has two layers:
```

### Full target shown text

```text
The response has two layers:
```

## claim_92c49ed8715ed6768bfbe86b1e033408

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-21, lines 164–174.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-24.
Source digest: 68f953b73b4e06d363b346f9b92040d3763fbb26d642abe51d9cc19519d7a1e8
Target digest: 68f953b73b4e06d363b346f9b92040d3763fbb26d642abe51d9cc19519d7a1e8
Shown source SHA256: 68f953b73b4e06d363b346f9b92040d3763fbb26d642abe51d9cc19519d7a1e8
Shown target SHA256: 68f953b73b4e06d363b346f9b92040d3763fbb26d642abe51d9cc19519d7a1e8

### Proposed decision

```json
{
  "claimId": "claim_92c49ed8715ed6768bfbe86b1e033408",
  "sourceUnitDigest": "68f953b73b4e06d363b346f9b92040d3763fbb26d642abe51d9cc19519d7a1e8",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "68f953b73b4e06d363b346f9b92040d3763fbb26d642abe51d9cc19519d7a1e8",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-21 (lines 164–174) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-24 (lines 188–198); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
dispatchDecision:
  status: accepted | refused | pending-reconciliation
  refusal: <typed reason, when refused>
  assignmentRef: <when materialized>
  runRef: <when launched>
  mechanism: <resolved mechanism, including in-process>
  policyProvenance: <resolved executor/provider/model/tier/persona/grants>
  boundsReservation: <what was reserved and consumed>
  evidenceRefs: <RunResult/artifact refs when settled>
```
````

### Full target shown text

````text
```yaml
dispatchDecision:
  status: accepted | refused | pending-reconciliation
  refusal: <typed reason, when refused>
  assignmentRef: <when materialized>
  runRef: <when launched>
  mechanism: <resolved mechanism, including in-process>
  policyProvenance: <resolved executor/provider/model/tier/persona/grants>
  boundsReservation: <what was reserved and consumed>
  evidenceRefs: <RunResult/artifact refs when settled>
```
````

## claim_a4bb861f2f826ec4587f6d5b0fb4d9b5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-22, lines 176–178.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-25.
Source digest: 7eac43f3e5eb75a9b40dcde0605809e9ca30fbf4e3df9201ce2f513b9cee10eb
Target digest: 7eac43f3e5eb75a9b40dcde0605809e9ca30fbf4e3df9201ce2f513b9cee10eb
Shown source SHA256: 7eac43f3e5eb75a9b40dcde0605809e9ca30fbf4e3df9201ce2f513b9cee10eb
Shown target SHA256: 7eac43f3e5eb75a9b40dcde0605809e9ca30fbf4e3df9201ce2f513b9cee10eb

### Proposed decision

```json
{
  "claimId": "claim_a4bb861f2f826ec4587f6d5b0fb4d9b5",
  "sourceUnitDigest": "7eac43f3e5eb75a9b40dcde0605809e9ca30fbf4e3df9201ce2f513b9cee10eb",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "7eac43f3e5eb75a9b40dcde0605809e9ca30fbf4e3df9201ce2f513b9cee10eb",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-22 (lines 176–178) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-25 (lines 200–202); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
`pending-reconciliation` is necessary after a crash or uncertain external effect:
the coordinator must not turn an unknown result into a retry or a success merely
because the local process disappeared.
```

### Full target shown text

```text
`pending-reconciliation` is necessary after a crash or uncertain external effect:
the coordinator must not turn an unknown result into a retry or a success merely
because the local process disappeared.
```

## claim_5e6165408f4b5de0210561120547d50d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#invariants-at-the-door, lines 180–180.
Target: docs/platform/proposals/coordination-dispatch-contract.md#invariants-at-the-door.
Source digest: a949b408c3dcca5367a0cd5967c6095d92f128ccd892396d7067316fb407c76b
Target digest: a949b408c3dcca5367a0cd5967c6095d92f128ccd892396d7067316fb407c76b
Shown source SHA256: 5dec770cd211e40ba4de89ba2f50f82f9da5669bdfe98b9b023e3ac6d7eb0ab2
Shown target SHA256: 5dec770cd211e40ba4de89ba2f50f82f9da5669bdfe98b9b023e3ac6d7eb0ab2

### Proposed decision

```json
{
  "claimId": "claim_5e6165408f4b5de0210561120547d50d",
  "sourceUnitDigest": "a949b408c3dcca5367a0cd5967c6095d92f128ccd892396d7067316fb407c76b",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "invariants-at-the-door",
  "targetUnitDigest": "a949b408c3dcca5367a0cd5967c6095d92f128ccd892396d7067316fb407c76b",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#invariants-at-the-door (lines 180–180) is carried at docs/platform/proposals/coordination-dispatch-contract.md#invariants-at-the-door (lines 204–204); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Invariants at the door

The port must enforce these before materialization or launch:

1. The caller holds the current coordinator epoch for the session.
2. `parentRef` belongs to the same coordination session and is eligible to spawn
   the requested child action.
3. Context refs are a subset of the caller's grant and are pinned to revisions.
4. Requested capabilities are attenuated by, never wider than, the parent grant.
5. Assignment, attempt, concurrency, depth, active-time, and cost bounds are
   reserved atomically where their counters can race.
6. A mutation request has an authorized resource owner, expected revision, and
   candidate/evidence contract; coordination close cannot integrate it.
7. Retry, recheck, replacement, and cancellation reference a real prior object
   and preserve its history.
8. Routing preferences resolve only to approved targets; the final binding and
   observed execution identity are recorded separately.
9. A refusal is durable enough for replay and contains no hidden side effect.
10. A settled RunResult never implies agreement, acceptance, or human decision.

The caller may supply an open role label or doctrine reference. The port must not
derive authority from the role string, and it must not require every possible
role to be listed in a protocol graph before accepting a bounded Assignment.
```

### Full target shown text

```text
### Invariants at the door

The port must enforce these before materialization or launch:

1. The caller holds the current coordinator epoch for the session.
2. `parentRef` belongs to the same coordination session and is eligible to spawn
   the requested child action.
3. Context refs are a subset of the caller's grant and are pinned to revisions.
4. Requested capabilities are attenuated by, never wider than, the parent grant.
5. Assignment, attempt, concurrency, depth, active-time, and cost bounds are
   reserved atomically where their counters can race.
6. A mutation request has an authorized resource owner, expected revision, and
   candidate/evidence contract; coordination close cannot integrate it.
7. Retry, recheck, replacement, and cancellation reference a real prior object
   and preserve its history.
8. Routing preferences resolve only to approved targets; the final binding and
   observed execution identity are recorded separately.
9. A refusal is durable enough for replay and contains no hidden side effect.
10. A settled RunResult never implies agreement, acceptance, or human decision.

The caller may supply an open role label or doctrine reference. The port must not
derive authority from the role string, and it must not require every possible
role to be listed in a protocol graph before accepting a bounded Assignment.
```

## claim_06f9837779296d4616b74d232c27d074

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-23, lines 182–182.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-26.
Source digest: c34d683f3289c1eea64a2c68757fee90bc0a51442aecd7cfef24452592af2a85
Target digest: c34d683f3289c1eea64a2c68757fee90bc0a51442aecd7cfef24452592af2a85
Shown source SHA256: c34d683f3289c1eea64a2c68757fee90bc0a51442aecd7cfef24452592af2a85
Shown target SHA256: c34d683f3289c1eea64a2c68757fee90bc0a51442aecd7cfef24452592af2a85

### Proposed decision

```json
{
  "claimId": "claim_06f9837779296d4616b74d232c27d074",
  "sourceUnitDigest": "c34d683f3289c1eea64a2c68757fee90bc0a51442aecd7cfef24452592af2a85",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "c34d683f3289c1eea64a2c68757fee90bc0a51442aecd7cfef24452592af2a85",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Invariants at the door"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-23 (lines 182–182) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-26 (lines 206–206); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The port must enforce these before materialization or launch:
```

### Full target shown text

```text
The port must enforce these before materialization or launch:
```

## claim_5949f929ba9523af92b3f9be9e34f81c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-24, lines 184–198.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-27.
Source digest: d7ef13c7d8efcf64b4c136e0fa63573d8a9d5a0210388f9ae8dc1343db0fb2ce
Target digest: d7ef13c7d8efcf64b4c136e0fa63573d8a9d5a0210388f9ae8dc1343db0fb2ce
Shown source SHA256: d7ef13c7d8efcf64b4c136e0fa63573d8a9d5a0210388f9ae8dc1343db0fb2ce
Shown target SHA256: d7ef13c7d8efcf64b4c136e0fa63573d8a9d5a0210388f9ae8dc1343db0fb2ce

### Proposed decision

```json
{
  "claimId": "claim_5949f929ba9523af92b3f9be9e34f81c",
  "sourceUnitDigest": "d7ef13c7d8efcf64b4c136e0fa63573d8a9d5a0210388f9ae8dc1343db0fb2ce",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "d7ef13c7d8efcf64b4c136e0fa63573d8a9d5a0210388f9ae8dc1343db0fb2ce",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Invariants at the door"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-24 (lines 184–198) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-27 (lines 208–222); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. The caller holds the current coordinator epoch for the session.
2. `parentRef` belongs to the same coordination session and is eligible to spawn
   the requested child action.
3. Context refs are a subset of the caller's grant and are pinned to revisions.
4. Requested capabilities are attenuated by, never wider than, the parent grant.
5. Assignment, attempt, concurrency, depth, active-time, and cost bounds are
   reserved atomically where their counters can race.
6. A mutation request has an authorized resource owner, expected revision, and
   candidate/evidence contract; coordination close cannot integrate it.
7. Retry, recheck, replacement, and cancellation reference a real prior object
   and preserve its history.
8. Routing preferences resolve only to approved targets; the final binding and
   observed execution identity are recorded separately.
9. A refusal is durable enough for replay and contains no hidden side effect.
10. A settled RunResult never implies agreement, acceptance, or human decision.
```

### Full target shown text

```text
1. The caller holds the current coordinator epoch for the session.
2. `parentRef` belongs to the same coordination session and is eligible to spawn
   the requested child action.
3. Context refs are a subset of the caller's grant and are pinned to revisions.
4. Requested capabilities are attenuated by, never wider than, the parent grant.
5. Assignment, attempt, concurrency, depth, active-time, and cost bounds are
   reserved atomically where their counters can race.
6. A mutation request has an authorized resource owner, expected revision, and
   candidate/evidence contract; coordination close cannot integrate it.
7. Retry, recheck, replacement, and cancellation reference a real prior object
   and preserve its history.
8. Routing preferences resolve only to approved targets; the final binding and
   observed execution identity are recorded separately.
9. A refusal is durable enough for replay and contains no hidden side effect.
10. A settled RunResult never implies agreement, acceptance, or human decision.
```

## claim_b994df13b14104e6e3273e77f32d0d59

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-25, lines 200–202.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-28.
Source digest: dbaa2605d3283124dc7329e6e777d86bdf9edb5d9dfb503b3370a64ecce7374a
Target digest: dbaa2605d3283124dc7329e6e777d86bdf9edb5d9dfb503b3370a64ecce7374a
Shown source SHA256: dbaa2605d3283124dc7329e6e777d86bdf9edb5d9dfb503b3370a64ecce7374a
Shown target SHA256: dbaa2605d3283124dc7329e6e777d86bdf9edb5d9dfb503b3370a64ecce7374a

### Proposed decision

```json
{
  "claimId": "claim_b994df13b14104e6e3273e77f32d0d59",
  "sourceUnitDigest": "dbaa2605d3283124dc7329e6e777d86bdf9edb5d9dfb503b3370a64ecce7374a",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "dbaa2605d3283124dc7329e6e777d86bdf9edb5d9dfb503b3370a64ecce7374a",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Invariants at the door"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-25 (lines 200–202) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-28 (lines 224–226); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The caller may supply an open role label or doctrine reference. The port must not
derive authority from the role string, and it must not require every possible
role to be listed in a protocol graph before accepting a bounded Assignment.
```

### Full target shown text

```text
The caller may supply an open role label or doctrine reference. The port must not
derive authority from the role string, and it must not require every possible
role to be listed in a protocol graph before accepting a bounded Assignment.
```

## claim_fcac48d75539cb7ecc445edcf9d407ba

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#mapping-the-existing-primitives, lines 204–204.
Target: docs/platform/proposals/coordination-dispatch-contract.md#mapping-the-existing-primitives.
Source digest: be0f3fc23cf1a7f4e6d7989fdcc811e8edab813b023f124635b413de336e3263
Target digest: be0f3fc23cf1a7f4e6d7989fdcc811e8edab813b023f124635b413de336e3263
Shown source SHA256: 4b95587f334ec01be201676d7dd2e10739a49fcc996af2b07a341e4eec0d4cee
Shown target SHA256: 4b95587f334ec01be201676d7dd2e10739a49fcc996af2b07a341e4eec0d4cee

### Proposed decision

```json
{
  "claimId": "claim_fcac48d75539cb7ecc445edcf9d407ba",
  "sourceUnitDigest": "be0f3fc23cf1a7f4e6d7989fdcc811e8edab813b023f124635b413de336e3263",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "mapping-the-existing-primitives",
  "targetUnitDigest": "be0f3fc23cf1a7f4e6d7989fdcc811e8edab813b023f124635b413de336e3263",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#mapping-the-existing-primitives (lines 204–204) is carried at docs/platform/proposals/coordination-dispatch-contract.md#mapping-the-existing-primitives (lines 228–228); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Mapping the existing primitives

The proposal is a unifying door, not a replacement implementation for each
primitive:

| Port action | Existing implementation to reuse or adapt |
|---|---|
| `assignment` | `dispatchPrimaryTask`, `proposeConsult`, `dispatchDeclaredOperation` and common Assignment/Run path |
| `retry` | `retrySessionTask` and its lock/idempotency/reconciliation behavior |
| `recheck` | Existing new Assignment/operation path plus explicit target-revision obligation; no semantic alias to retry |
| `replacement` | `replaceSessionActor`, followed by ordinary dispatch for the replacement |
| `cancel` | `cancelSession` plus process/effect reconciliation |
| `mutation` | `dispatchDeclaredOperation` mutation gate, workspace/root policy, and resource-owner integration |
| `in-process` | Existing Dispatch resolver mechanism result, with an execution receipt rather than an adapter bypass |

The mapping table is an investigation guide, not permission to expose internal
functions directly. Before implementation, each mapping needs an impact check,
public caller authentication, and a test showing that it preserves the common
execution path.
```

### Full target shown text

```text
### Mapping the existing primitives

The proposal is a unifying door, not a replacement implementation for each
primitive:

| Port action | Existing implementation to reuse or adapt |
|---|---|
| `assignment` | `dispatchPrimaryTask`, `proposeConsult`, `dispatchDeclaredOperation` and common Assignment/Run path |
| `retry` | `retrySessionTask` and its lock/idempotency/reconciliation behavior |
| `recheck` | Existing new Assignment/operation path plus explicit target-revision obligation; no semantic alias to retry |
| `replacement` | `replaceSessionActor`, followed by ordinary dispatch for the replacement |
| `cancel` | `cancelSession` plus process/effect reconciliation |
| `mutation` | `dispatchDeclaredOperation` mutation gate, workspace/root policy, and resource-owner integration |
| `in-process` | Existing Dispatch resolver mechanism result, with an execution receipt rather than an adapter bypass |

The mapping table is an investigation guide, not permission to expose internal
functions directly. Before implementation, each mapping needs an impact check,
public caller authentication, and a test showing that it preserves the common
execution path.
```

## claim_c0b1e2ed80faf9fea1ebd478b97c0a5c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-26, lines 206–207.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-29.
Source digest: b57bdd3fec965fcf0f4de0dd2d9a2e0deb863c6afbf597adc04da7057a89cd73
Target digest: b57bdd3fec965fcf0f4de0dd2d9a2e0deb863c6afbf597adc04da7057a89cd73
Shown source SHA256: b57bdd3fec965fcf0f4de0dd2d9a2e0deb863c6afbf597adc04da7057a89cd73
Shown target SHA256: b57bdd3fec965fcf0f4de0dd2d9a2e0deb863c6afbf597adc04da7057a89cd73

### Proposed decision

```json
{
  "claimId": "claim_c0b1e2ed80faf9fea1ebd478b97c0a5c",
  "sourceUnitDigest": "b57bdd3fec965fcf0f4de0dd2d9a2e0deb863c6afbf597adc04da7057a89cd73",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "b57bdd3fec965fcf0f4de0dd2d9a2e0deb863c6afbf597adc04da7057a89cd73",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Mapping the existing primitives"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-26 (lines 206–207) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-29 (lines 230–231); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The proposal is a unifying door, not a replacement implementation for each
primitive:
```

### Full target shown text

```text
The proposal is a unifying door, not a replacement implementation for each
primitive:
```

## claim_49112bf8c51a643205d8fd86a66828bb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-27, lines 209–217.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-30.
Source digest: 84bad1befd6bfba4464818276683fa2bf6f4fd31b761b7b93cff303c125927b5
Target digest: 84bad1befd6bfba4464818276683fa2bf6f4fd31b761b7b93cff303c125927b5
Shown source SHA256: 84bad1befd6bfba4464818276683fa2bf6f4fd31b761b7b93cff303c125927b5
Shown target SHA256: 84bad1befd6bfba4464818276683fa2bf6f4fd31b761b7b93cff303c125927b5

### Proposed decision

```json
{
  "claimId": "claim_49112bf8c51a643205d8fd86a66828bb",
  "sourceUnitDigest": "84bad1befd6bfba4464818276683fa2bf6f4fd31b761b7b93cff303c125927b5",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "84bad1befd6bfba4464818276683fa2bf6f4fd31b761b7b93cff303c125927b5",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Mapping the existing primitives"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-27 (lines 209–217) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-30 (lines 233–241); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Port action | Existing implementation to reuse or adapt |
|---|---|
| `assignment` | `dispatchPrimaryTask`, `proposeConsult`, `dispatchDeclaredOperation` and common Assignment/Run path |
| `retry` | `retrySessionTask` and its lock/idempotency/reconciliation behavior |
| `recheck` | Existing new Assignment/operation path plus explicit target-revision obligation; no semantic alias to retry |
| `replacement` | `replaceSessionActor`, followed by ordinary dispatch for the replacement |
| `cancel` | `cancelSession` plus process/effect reconciliation |
| `mutation` | `dispatchDeclaredOperation` mutation gate, workspace/root policy, and resource-owner integration |
| `in-process` | Existing Dispatch resolver mechanism result, with an execution receipt rather than an adapter bypass |
```

### Full target shown text

```text
| Port action | Existing implementation to reuse or adapt |
|---|---|
| `assignment` | `dispatchPrimaryTask`, `proposeConsult`, `dispatchDeclaredOperation` and common Assignment/Run path |
| `retry` | `retrySessionTask` and its lock/idempotency/reconciliation behavior |
| `recheck` | Existing new Assignment/operation path plus explicit target-revision obligation; no semantic alias to retry |
| `replacement` | `replaceSessionActor`, followed by ordinary dispatch for the replacement |
| `cancel` | `cancelSession` plus process/effect reconciliation |
| `mutation` | `dispatchDeclaredOperation` mutation gate, workspace/root policy, and resource-owner integration |
| `in-process` | Existing Dispatch resolver mechanism result, with an execution receipt rather than an adapter bypass |
```

## claim_b348066daf819d563f10dc0bfd25df12

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-28, lines 219–222.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-31.
Source digest: 106025b7c779e0abb68bd13fae685712905d091a906ac13ebd322b3606559255
Target digest: 106025b7c779e0abb68bd13fae685712905d091a906ac13ebd322b3606559255
Shown source SHA256: 106025b7c779e0abb68bd13fae685712905d091a906ac13ebd322b3606559255
Shown target SHA256: 106025b7c779e0abb68bd13fae685712905d091a906ac13ebd322b3606559255

### Proposed decision

```json
{
  "claimId": "claim_b348066daf819d563f10dc0bfd25df12",
  "sourceUnitDigest": "106025b7c779e0abb68bd13fae685712905d091a906ac13ebd322b3606559255",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "106025b7c779e0abb68bd13fae685712905d091a906ac13ebd322b3606559255",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Mapping the existing primitives"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-28 (lines 219–222) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-31 (lines 243–246); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The mapping table is an investigation guide, not permission to expose internal
functions directly. Before implementation, each mapping needs an impact check,
public caller authentication, and a test showing that it preserves the common
execution path.
```

### Full target shown text

```text
The mapping table is an investigation guide, not permission to expose internal
functions directly. Before implementation, each mapping needs an impact check,
public caller authentication, and a test showing that it preserves the common
execution path.
```

## claim_c4a6c9b00f3dd1073dc3160041fef14e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#assignment-contract, lines 224–224.
Target: docs/platform/proposals/coordination-dispatch-contract.md#assignment-contract.
Source digest: 30b8b4adf8268721aee20949e2ba67a92d38f1037f0a07ddb8445293f276764a
Target digest: 30b8b4adf8268721aee20949e2ba67a92d38f1037f0a07ddb8445293f276764a
Shown source SHA256: 6676a7aedddbe4b3c3b2b33526bcce6f772b810eb727d835457cf1f4af270393
Shown target SHA256: 6676a7aedddbe4b3c3b2b33526bcce6f772b810eb727d835457cf1f4af270393

### Proposed decision

```json
{
  "claimId": "claim_c4a6c9b00f3dd1073dc3160041fef14e",
  "sourceUnitDigest": "30b8b4adf8268721aee20949e2ba67a92d38f1037f0a07ddb8445293f276764a",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "assignment-contract",
  "targetUnitDigest": "30b8b4adf8268721aee20949e2ba67a92d38f1037f0a07ddb8445293f276764a",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#assignment-contract (lines 224–224) is carried at docs/platform/proposals/coordination-dispatch-contract.md#assignment-contract (lines 248–248); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
### Assignment contract

Every dynamic Assignment should carry, at minimum:

```yaml
assignmentRequest:
  session: <coordination session and coordinator epoch>
  parent: <assignment or deliberation checkpoint>
  objective: <semantic objective>
  doctrine: <resolved role/soul packet reference and content hash>
  contextGrant: <refs, revisions, and disclosure limits>
  capabilityRequest: <requested tools/resources>
  evidenceContract: <expected artifacts, checks, and source pins>
  mutation: read-only | candidate-only | resource-effect
  bounds: <remaining budget, concurrency, depth, attempts>
  routingPreference: <executor/provider/model/tier/persona preferences>
```

`role` remains descriptive. Effective capabilities come from grants and policy,
never from role names. Routing preference is not authorization to select an
unapproved target. Doctrine is delivered content, not a runtime enum; its hash
and source are recorded so a fresh process knows what the worker received.
````

### Full target shown text

````text
### Assignment contract

Every dynamic Assignment should carry, at minimum:

```yaml
assignmentRequest:
  session: <coordination session and coordinator epoch>
  parent: <assignment or deliberation checkpoint>
  objective: <semantic objective>
  doctrine: <resolved role/soul packet reference and content hash>
  contextGrant: <refs, revisions, and disclosure limits>
  capabilityRequest: <requested tools/resources>
  evidenceContract: <expected artifacts, checks, and source pins>
  mutation: read-only | candidate-only | resource-effect
  bounds: <remaining budget, concurrency, depth, attempts>
  routingPreference: <executor/provider/model/tier/persona preferences>
```

`role` remains descriptive. Effective capabilities come from grants and policy,
never from role names. Routing preference is not authorization to select an
unapproved target. Doctrine is delivered content, not a runtime enum; its hash
and source are recorded so a fresh process knows what the worker received.
````

## claim_cba4f5e197e91b26eb1decb100c51b6b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-29, lines 226–226.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-32.
Source digest: 45bd422adc39b2d78d842d9c359ff4e467ce1a9176ebdeb9cf820f02c58d3a7a
Target digest: 45bd422adc39b2d78d842d9c359ff4e467ce1a9176ebdeb9cf820f02c58d3a7a
Shown source SHA256: 45bd422adc39b2d78d842d9c359ff4e467ce1a9176ebdeb9cf820f02c58d3a7a
Shown target SHA256: 45bd422adc39b2d78d842d9c359ff4e467ce1a9176ebdeb9cf820f02c58d3a7a

### Proposed decision

```json
{
  "claimId": "claim_cba4f5e197e91b26eb1decb100c51b6b",
  "sourceUnitDigest": "45bd422adc39b2d78d842d9c359ff4e467ce1a9176ebdeb9cf820f02c58d3a7a",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "45bd422adc39b2d78d842d9c359ff4e467ce1a9176ebdeb9cf820f02c58d3a7a",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Assignment contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-29 (lines 226–226) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-32 (lines 250–250); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Every dynamic Assignment should carry, at minimum:
```

### Full target shown text

```text
Every dynamic Assignment should carry, at minimum:
```

## claim_d0073c9f66b99fc7dca24e08566c36bb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-30, lines 228–240.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-33.
Source digest: 9e67eb8a58be4b3cdc4237685ef6bbea23462d3a5a5efc09710d612daae4f32f
Target digest: 9e67eb8a58be4b3cdc4237685ef6bbea23462d3a5a5efc09710d612daae4f32f
Shown source SHA256: 9e67eb8a58be4b3cdc4237685ef6bbea23462d3a5a5efc09710d612daae4f32f
Shown target SHA256: 9e67eb8a58be4b3cdc4237685ef6bbea23462d3a5a5efc09710d612daae4f32f

### Proposed decision

```json
{
  "claimId": "claim_d0073c9f66b99fc7dca24e08566c36bb",
  "sourceUnitDigest": "9e67eb8a58be4b3cdc4237685ef6bbea23462d3a5a5efc09710d612daae4f32f",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "9e67eb8a58be4b3cdc4237685ef6bbea23462d3a5a5efc09710d612daae4f32f",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Assignment contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-30 (lines 228–240) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-33 (lines 252–264); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
assignmentRequest:
  session: <coordination session and coordinator epoch>
  parent: <assignment or deliberation checkpoint>
  objective: <semantic objective>
  doctrine: <resolved role/soul packet reference and content hash>
  contextGrant: <refs, revisions, and disclosure limits>
  capabilityRequest: <requested tools/resources>
  evidenceContract: <expected artifacts, checks, and source pins>
  mutation: read-only | candidate-only | resource-effect
  bounds: <remaining budget, concurrency, depth, attempts>
  routingPreference: <executor/provider/model/tier/persona preferences>
```
````

### Full target shown text

````text
```yaml
assignmentRequest:
  session: <coordination session and coordinator epoch>
  parent: <assignment or deliberation checkpoint>
  objective: <semantic objective>
  doctrine: <resolved role/soul packet reference and content hash>
  contextGrant: <refs, revisions, and disclosure limits>
  capabilityRequest: <requested tools/resources>
  evidenceContract: <expected artifacts, checks, and source pins>
  mutation: read-only | candidate-only | resource-effect
  bounds: <remaining budget, concurrency, depth, attempts>
  routingPreference: <executor/provider/model/tier/persona preferences>
```
````

## claim_178d09a58e08aaa4ce3ec130e8b62eff

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-31, lines 242–245.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-34.
Source digest: 90a1beaa8fcbb916060793ee6c7d0195caa0ce86c63942c805a3765c4f0dfa30
Target digest: 90a1beaa8fcbb916060793ee6c7d0195caa0ce86c63942c805a3765c4f0dfa30
Shown source SHA256: 90a1beaa8fcbb916060793ee6c7d0195caa0ce86c63942c805a3765c4f0dfa30
Shown target SHA256: 90a1beaa8fcbb916060793ee6c7d0195caa0ce86c63942c805a3765c4f0dfa30

### Proposed decision

```json
{
  "claimId": "claim_178d09a58e08aaa4ce3ec130e8b62eff",
  "sourceUnitDigest": "90a1beaa8fcbb916060793ee6c7d0195caa0ce86c63942c805a3765c4f0dfa30",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "90a1beaa8fcbb916060793ee6c7d0195caa0ce86c63942c805a3765c4f0dfa30",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Assignment contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-31 (lines 242–245) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-34 (lines 266–269); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
`role` remains descriptive. Effective capabilities come from grants and policy,
never from role names. Routing preference is not authorization to select an
unapproved target. Doctrine is delivered content, not a runtime enum; its hash
and source are recorded so a fresh process knows what the worker received.
```

### Full target shown text

```text
`role` remains descriptive. Effective capabilities come from grants and policy,
never from role names. Routing preference is not authorization to select an
unapproved target. Doctrine is delivered content, not a runtime enum; its hash
and source are recorded so a fresh process knows what the worker received.
```

## claim_c62791b17d63b21c043aeca2c9313664

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#retry-recheck-replacement-and-completion, lines 247–247.
Target: docs/platform/proposals/coordination-dispatch-contract.md#retry-recheck-replacement-and-completion.
Source digest: d97ce1dd62d626b0ff3563224f5e9b2b4ed9388300ffdc59a56ebad649791821
Target digest: d97ce1dd62d626b0ff3563224f5e9b2b4ed9388300ffdc59a56ebad649791821
Shown source SHA256: ceb1922f3494864d0167277890e8194fd50d88f84a11f0f3948c8f39e7b75a1d
Shown target SHA256: ceb1922f3494864d0167277890e8194fd50d88f84a11f0f3948c8f39e7b75a1d

### Proposed decision

```json
{
  "claimId": "claim_c62791b17d63b21c043aeca2c9313664",
  "sourceUnitDigest": "d97ce1dd62d626b0ff3563224f5e9b2b4ed9388300ffdc59a56ebad649791821",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "retry-recheck-replacement-and-completion",
  "targetUnitDigest": "d97ce1dd62d626b0ff3563224f5e9b2b4ed9388300ffdc59a56ebad649791821",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#retry-recheck-replacement-and-completion (lines 247–247) is carried at docs/platform/proposals/coordination-dispatch-contract.md#retry-recheck-replacement-and-completion (lines 271–271); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Retry, recheck, replacement, and completion

Retry repeats an attempt whose contract/revision remains valid, or records why it
changed. Recheck evaluates a new candidate/evidence revision; prior assessments
remain historical and cannot certify the new revision silently. Replacement
changes who performs an obligation without erasing prior failure or missing
evidence. Cancellation reconciles unknown external effects before retrying.

Dispatch reports execution facts and evidence validity. Coordination owns semantic
disposition. A successful Run may still yield dissent, insufficient evidence, or
another Assignment. A process exit or roster quorum is never an implicit answer
to whether deliberation should close.
```

### Full target shown text

```text
### Retry, recheck, replacement, and completion

Retry repeats an attempt whose contract/revision remains valid, or records why it
changed. Recheck evaluates a new candidate/evidence revision; prior assessments
remain historical and cannot certify the new revision silently. Replacement
changes who performs an obligation without erasing prior failure or missing
evidence. Cancellation reconciles unknown external effects before retrying.

Dispatch reports execution facts and evidence validity. Coordination owns semantic
disposition. A successful Run may still yield dissent, insufficient evidence, or
another Assignment. A process exit or roster quorum is never an implicit answer
to whether deliberation should close.
```

## claim_354964976a9850d4951d3826a7e54982

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-32, lines 249–253.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-35.
Source digest: b2e68ca1f96fe0ca9e92b88747b22cfb857008455e2f8c6f70625e9960f2b2de
Target digest: b2e68ca1f96fe0ca9e92b88747b22cfb857008455e2f8c6f70625e9960f2b2de
Shown source SHA256: b2e68ca1f96fe0ca9e92b88747b22cfb857008455e2f8c6f70625e9960f2b2de
Shown target SHA256: b2e68ca1f96fe0ca9e92b88747b22cfb857008455e2f8c6f70625e9960f2b2de

### Proposed decision

```json
{
  "claimId": "claim_354964976a9850d4951d3826a7e54982",
  "sourceUnitDigest": "b2e68ca1f96fe0ca9e92b88747b22cfb857008455e2f8c6f70625e9960f2b2de",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "b2e68ca1f96fe0ca9e92b88747b22cfb857008455e2f8c6f70625e9960f2b2de",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Retry, recheck, replacement, and completion"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-32 (lines 249–253) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-35 (lines 273–277); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Retry repeats an attempt whose contract/revision remains valid, or records why it
changed. Recheck evaluates a new candidate/evidence revision; prior assessments
remain historical and cannot certify the new revision silently. Replacement
changes who performs an obligation without erasing prior failure or missing
evidence. Cancellation reconciles unknown external effects before retrying.
```

### Full target shown text

```text
Retry repeats an attempt whose contract/revision remains valid, or records why it
changed. Recheck evaluates a new candidate/evidence revision; prior assessments
remain historical and cannot certify the new revision silently. Replacement
changes who performs an obligation without erasing prior failure or missing
evidence. Cancellation reconciles unknown external effects before retrying.
```

## claim_bcf5db33098f330c42a4d4641e44d00f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-33, lines 255–258.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-36.
Source digest: 769d8d4b612031ba687d421c038bb3bb2120be0b163630b2253cdb989cbe0805
Target digest: 769d8d4b612031ba687d421c038bb3bb2120be0b163630b2253cdb989cbe0805
Shown source SHA256: 769d8d4b612031ba687d421c038bb3bb2120be0b163630b2253cdb989cbe0805
Shown target SHA256: 769d8d4b612031ba687d421c038bb3bb2120be0b163630b2253cdb989cbe0805

### Proposed decision

```json
{
  "claimId": "claim_bcf5db33098f330c42a4d4641e44d00f",
  "sourceUnitDigest": "769d8d4b612031ba687d421c038bb3bb2120be0b163630b2253cdb989cbe0805",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "769d8d4b612031ba687d421c038bb3bb2120be0b163630b2253cdb989cbe0805",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Coordinator-facing Dispatch port",
    "Retry, recheck, replacement, and completion"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-33 (lines 255–258) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-36 (lines 279–282); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Dispatch reports execution facts and evidence validity. Coordination owns semantic
disposition. A successful Run may still yield dissent, insufficient evidence, or
another Assignment. A process exit or roster quorum is never an implicit answer
to whether deliberation should close.
```

### Full target shown text

```text
Dispatch reports execution facts and evidence validity. Coordination owns semantic
disposition. A successful Run may still yield dissent, insufficient evidence, or
another Assignment. A process exit or roster quorum is never an implicit answer
to whether deliberation should close.
```

## claim_6f334a745f8cc0580151a1d7879f033a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#in-process-branch, lines 260–260.
Target: docs/platform/proposals/coordination-dispatch-contract.md#in-process-branch.
Source digest: da406d117b55bd4d5649033ba9175e3d8ab8990ed4282f4b65e53256bd536efd
Target digest: da406d117b55bd4d5649033ba9175e3d8ab8990ed4282f4b65e53256bd536efd
Shown source SHA256: 16f481b925eb4e1fe7f9327edcb424a758aa5d7566eb760b87210354fe8b7067
Shown target SHA256: 16f481b925eb4e1fe7f9327edcb424a758aa5d7566eb760b87210354fe8b7067

### Proposed decision

```json
{
  "claimId": "claim_6f334a745f8cc0580151a1d7879f033a",
  "sourceUnitDigest": "da406d117b55bd4d5649033ba9175e3d8ab8990ed4282f4b65e53256bd536efd",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "in-process-branch",
  "targetUnitDigest": "da406d117b55bd4d5649033ba9175e3d8ab8990ed4282f4b65e53256bd536efd",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#in-process-branch (lines 260–260) is carried at docs/platform/proposals/coordination-dispatch-contract.md#in-process-branch (lines 284–284); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## In-process branch

If Dispatch returns `in-process`, the caller must possess the declared live
capability. The result still needs the same execution identity, context and
capability checks, bounds, cancellation semantics where applicable, evidence
normalization, and provenance naming the caller capability. In-process must not
be used for an untrusted worker to import runtime modules or write control state.
```

### Full target shown text

```text
## In-process branch

If Dispatch returns `in-process`, the caller must possess the declared live
capability. The result still needs the same execution identity, context and
capability checks, bounds, cancellation semantics where applicable, evidence
normalization, and provenance naming the caller capability. In-process must not
be used for an untrusted worker to import runtime modules or write control state.
```

## claim_6b957ce50a92095bdfe2f793b4935a10

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-34, lines 262–266.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-37.
Source digest: c3e8be48291cf0c96fd3fb983d4ad6dcc7cb8a86ad4dacbcb28ebf258cec0410
Target digest: c3e8be48291cf0c96fd3fb983d4ad6dcc7cb8a86ad4dacbcb28ebf258cec0410
Shown source SHA256: c3e8be48291cf0c96fd3fb983d4ad6dcc7cb8a86ad4dacbcb28ebf258cec0410
Shown target SHA256: c3e8be48291cf0c96fd3fb983d4ad6dcc7cb8a86ad4dacbcb28ebf258cec0410

### Proposed decision

```json
{
  "claimId": "claim_6b957ce50a92095bdfe2f793b4935a10",
  "sourceUnitDigest": "c3e8be48291cf0c96fd3fb983d4ad6dcc7cb8a86ad4dacbcb28ebf258cec0410",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "c3e8be48291cf0c96fd3fb983d4ad6dcc7cb8a86ad4dacbcb28ebf258cec0410",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "In-process branch"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-34 (lines 262–266) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-37 (lines 286–290); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
If Dispatch returns `in-process`, the caller must possess the declared live
capability. The result still needs the same execution identity, context and
capability checks, bounds, cancellation semantics where applicable, evidence
normalization, and provenance naming the caller capability. In-process must not
be used for an untrusted worker to import runtime modules or write control state.
```

### Full target shown text

```text
If Dispatch returns `in-process`, the caller must possess the declared live
capability. The result still needs the same execution identity, context and
capability checks, bounds, cancellation semantics where applicable, evidence
normalization, and provenance naming the caller capability. In-process must not
be used for an untrusted worker to import runtime modules or write control state.
```

## claim_48aa309a8c7354d38c138d3fddd1bee6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#consequence-for-experiments, lines 268–268.
Target: docs/platform/proposals/coordination-dispatch-contract.md#consequence-for-experiments.
Source digest: 141e3bb7ca9e24989a15de04d58cd45a9023acc79d2634b9e0ef91b703b9630a
Target digest: 141e3bb7ca9e24989a15de04d58cd45a9023acc79d2634b9e0ef91b703b9630a
Shown source SHA256: e58da321f989afdb86c4b2b97fbe246310f0da0cc0fa89ea9719413477f64c9d
Shown target SHA256: e58da321f989afdb86c4b2b97fbe246310f0da0cc0fa89ea9719413477f64c9d

### Proposed decision

```json
{
  "claimId": "claim_48aa309a8c7354d38c138d3fddd1bee6",
  "sourceUnitDigest": "141e3bb7ca9e24989a15de04d58cd45a9023acc79d2634b9e0ef91b703b9630a",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "consequence-for-experiments",
  "targetUnitDigest": "141e3bb7ca9e24989a15de04d58cd45a9023acc79d2634b9e0ef91b703b9630a",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source heading docs/architect/proposals/coordination-dispatch-contract.md#consequence-for-experiments (lines 268–268) is carried at docs/platform/proposals/coordination-dispatch-contract.md#consequence-for-experiments (lines 292–292); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Consequence for experiments

The next experiment is not “choose a host or build a relay”. It is to construct a
synthetic coordinator request asking Dispatch for a specialist Assignment not
predicted by a graph; observe the returned mechanism, including `in-process` if
selected; verify grants, bounds, doctrine, routing provenance, and evidence
lineage; and record exactly where the current public Coordination door prevents
this. Worker filesystem, environment, output, and credential boundaries remain a
separate mechanism-level proof.

Visibility and interactive contact are intentionally outside this contract and
will be reviewed separately as Dispatch mechanism concerns.
```

### Full target shown text

```text
## Consequence for experiments

The next experiment is not “choose a host or build a relay”. It is to construct a
synthetic coordinator request asking Dispatch for a specialist Assignment not
predicted by a graph; observe the returned mechanism, including `in-process` if
selected; verify grants, bounds, doctrine, routing provenance, and evidence
lineage; and record exactly where the current public Coordination door prevents
this. Worker filesystem, environment, output, and credential boundaries remain a
separate mechanism-level proof.

Visibility and interactive contact are intentionally outside this contract and
will be reviewed separately as Dispatch mechanism concerns.
```

## claim_b8a2993f61f97a39f6e4d205556f6d8c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-35, lines 270–276.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-38.
Source digest: d384dbdc220ac30a8546a67a9424f08ae2e1f61efe0792ac96ba1af1195ca23b
Target digest: d384dbdc220ac30a8546a67a9424f08ae2e1f61efe0792ac96ba1af1195ca23b
Shown source SHA256: d384dbdc220ac30a8546a67a9424f08ae2e1f61efe0792ac96ba1af1195ca23b
Shown target SHA256: d384dbdc220ac30a8546a67a9424f08ae2e1f61efe0792ac96ba1af1195ca23b

### Proposed decision

```json
{
  "claimId": "claim_b8a2993f61f97a39f6e4d205556f6d8c",
  "sourceUnitDigest": "d384dbdc220ac30a8546a67a9424f08ae2e1f61efe0792ac96ba1af1195ca23b",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "d384dbdc220ac30a8546a67a9424f08ae2e1f61efe0792ac96ba1af1195ca23b",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Consequence for experiments"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-35 (lines 270–276) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-38 (lines 294–300); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The next experiment is not “choose a host or build a relay”. It is to construct a
synthetic coordinator request asking Dispatch for a specialist Assignment not
predicted by a graph; observe the returned mechanism, including `in-process` if
selected; verify grants, bounds, doctrine, routing provenance, and evidence
lineage; and record exactly where the current public Coordination door prevents
this. Worker filesystem, environment, output, and credential boundaries remain a
separate mechanism-level proof.
```

### Full target shown text

```text
The next experiment is not “choose a host or build a relay”. It is to construct a
synthetic coordinator request asking Dispatch for a specialist Assignment not
predicted by a graph; observe the returned mechanism, including `in-process` if
selected; verify grants, bounds, doctrine, routing provenance, and evidence
lineage; and record exactly where the current public Coordination door prevents
this. Worker filesystem, environment, output, and credential boundaries remain a
separate mechanism-level proof.
```

## claim_b6d4ea9e57e1d0d1dabd6dbcb2dffc67

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-36, lines 278–279.
Target: docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-39.
Source digest: 2b08b4fd1fb6b3ccc74157e7f6b3869ed8ec4a1766c2c3fdfc6130f74c26307d
Target digest: 2b08b4fd1fb6b3ccc74157e7f6b3869ed8ec4a1766c2c3fdfc6130f74c26307d
Shown source SHA256: 2b08b4fd1fb6b3ccc74157e7f6b3869ed8ec4a1766c2c3fdfc6130f74c26307d
Shown target SHA256: 2b08b4fd1fb6b3ccc74157e7f6b3869ed8ec4a1766c2c3fdfc6130f74c26307d

### Proposed decision

```json
{
  "claimId": "claim_b6d4ea9e57e1d0d1dabd6dbcb2dffc67",
  "sourceUnitDigest": "2b08b4fd1fb6b3ccc74157e7f6b3869ed8ec4a1766c2c3fdfc6130f74c26307d",
  "targetOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "2b08b4fd1fb6b3ccc74157e7f6b3869ed8ec4a1766c2c3fdfc6130f74c26307d",
  "targetAncestry": [
    "Coordination ↔ Dispatch & Execution Contract",
    "Consequence for experiments"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Evidence: Source Correction to the current discussion / Responsibility split makes Dispatch the execution substrate. src/runner/execution/bind.mjs and run.mjs, src/runner/dispatch/assignment.mjs and assignment-runner.mjs survive; retired engine-internal consult/close observations remain dated. Complete source unheaded-block docs/architect/proposals/coordination-dispatch-contract.md#unheaded-block-36 (lines 278–279) is carried at docs/platform/proposals/coordination-dispatch-contract.md#unheaded-block-39 (lines 302–303); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Visibility and interactive contact are intentionally outside this contract and
will be reviewed separately as Dispatch mechanism concerns.
```

### Full target shown text

```text
Visibility and interactive contact are intentionally outside this contract and
will be reviewed separately as Dispatch mechanism concerns.
```
