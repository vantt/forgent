# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json
Original shard SHA256: 5de8aa0ea2f4e78524d2e2cc6db4e74eae949514b6e5dd35e56e67920fb4476c
Source file: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md
Part 1/2; entries: **80**. Source-file group 20/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (2): `claim_427e36a559f714ab23628142cec0c7aa`, `claim_7765c8384841109f54c726219b338219`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (1): `claim_427e36a559f714ab23628142cec0c7aa`.

Weak-exact/Judgment population: 15; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_427e36a559f714ab23628142cec0c7aa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên, lines 1–1.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên.
Source digest: 011ff1ead4b5626955fb4c368e23c5c0e43dea44b10d06bf5ab9b9ac30631b24
Target digest: 151ad429b2747f33872adfaece97118eebd64b153feb127ad195eeec175b9caa
Shown source SHA256: e7e1b3a5e01b2f91a9cf3dc427ac7e74882b387093822b074b42d724504409b0
Shown target SHA256: 67b362b9baa077fc6c3c652adc59d45459bbd60dfaf6059a11bddf75af4fded1

### Proposed decision

```json
{
  "claimId": "claim_427e36a559f714ab23628142cec0c7aa",
  "sourceUnitDigest": "011ff1ead4b5626955fb4c368e23c5c0e43dea44b10d06bf5ab9b9ac30631b24",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
  "targetUnitDigest": "151ad429b2747f33872adfaece97118eebd64b153feb127ad195eeec175b9caa",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên

Document type: Proposal (investigation, lượt conceptual đầu — read-only)
Design status: Discussion
Implementation: Existing `herdr-spawn` adapter (family A bên dưới); không có source nào được sửa trong lượt này
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; reconstruct hiện trạng + failure modes + boundary + conceptual design cho visibility/contact của mechanism interactive
State class: State

Related: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),
[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),
[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md),
[Worker/provider/control boundary](coordination-worker-provider-boundary.md),
[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),
[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).

Nhãn chứng cứ dùng trong tài liệu: **native proven** (code + test có trong repo, chạy được), **native observed but incomplete** (code có, hành vi chỉ đúng một phần hoặc chưa test), **prototype-only**, **unproven** (chỉ là prose/giả định), **unsafe** (đã đo là gây hại), **upstream-proven** (beegog v2.33.2 đã đo và ship, chưa chạy trong fgOS).

---
```

### Full target shown text

````text
# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 0669c4440662d98e207e676b76eb0ba70387be44
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate design evidence cited by docs/specs/runner.md:999 RUL40, sections 3.3, 4 and 14 H1. Source transport line references and proposed recommendations are preserved as dated text. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/visibility-and-interactive-contact-herdr-spawn.md).


Document type: Proposal (investigation, lượt conceptual đầu — read-only)
Design status: Discussion
Implementation: Existing `herdr-spawn` adapter (family A bên dưới); không có source nào được sửa trong lượt này
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; reconstruct hiện trạng + failure modes + boundary + conceptual design cho visibility/contact của mechanism interactive
State class: State

Related: [Visibility And Herdr](../../architect/agent-coordination/architecture/visibility-and-herdr.md),
[Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md),
[Coordination ↔ Dispatch contract](../../architect/proposals/coordination-dispatch-contract.md),
[Worker/provider/control boundary](../../architect/proposals/coordination-worker-provider-boundary.md),
[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),
[Brainstorm 2026-08-27 (superseded)](../../architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).

Nhãn chứng cứ dùng trong tài liệu: **native proven** (code + test có trong repo, chạy được), **native observed but incomplete** (code có, hành vi chỉ đúng một phần hoặc chưa test), **prototype-only**, **unproven** (chỉ là prose/giả định), **unsafe** (đã đo là gây hại), **upstream-proven** (beegog v2.33.2 đã đo và ship, chưa chạy trong fgOS).

---
````

### Correction before/after and reasons

```json
{
  "claimId": "claim_427e36a559f714ab23628142cec0c7aa",
  "source": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-20-visibility-and-interactive-contact-herdr-spawn.json",
  "reasons": [
    "R7-1/R7-6 labelled neutral placement metadata and extracted-unit consequence"
  ],
  "before": {
    "claimId": "claim_427e36a559f714ab23628142cec0c7aa",
    "sourceUnitDigest": "011ff1ead4b5626955fb4c368e23c5c0e43dea44b10d06bf5ab9b9ac30631b24",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "targetUnitDigest": "dea69ad933aaa53c695ab63a63f3428ae105495bec43da7772b19e34eb99c737",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  },
  "after": {
    "claimId": "claim_427e36a559f714ab23628142cec0c7aa",
    "sourceUnitDigest": "011ff1ead4b5626955fb4c368e23c5c0e43dea44b10d06bf5ab9b9ac30631b24",
    "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "targetAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "targetUnitDigest": "151ad429b2747f33872adfaece97118eebd64b153feb127ad195eeec175b9caa",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  }
}
```

## claim_7082c16a8b1598cae59022ce455b9597

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-1, lines 3–8.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-4.
Source digest: 46753d58e2bcfaaafb4401c27c9750ec8bbb6e4a437792ad3574abd498e459f9
Target digest: 46753d58e2bcfaaafb4401c27c9750ec8bbb6e4a437792ad3574abd498e459f9
Shown source SHA256: 46753d58e2bcfaaafb4401c27c9750ec8bbb6e4a437792ad3574abd498e459f9
Shown target SHA256: 46753d58e2bcfaaafb4401c27c9750ec8bbb6e4a437792ad3574abd498e459f9

### Proposed decision

```json
{
  "claimId": "claim_7082c16a8b1598cae59022ce455b9597",
  "sourceUnitDigest": "46753d58e2bcfaaafb4401c27c9750ec8bbb6e4a437792ad3574abd498e459f9",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "46753d58e2bcfaaafb4401c27c9750ec8bbb6e4a437792ad3574abd498e459f9",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-1 (lines 3–8) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-4 (lines 27–32); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Document type: Proposal (investigation, lượt conceptual đầu — read-only)
Design status: Discussion
Implementation: Existing `herdr-spawn` adapter (family A bên dưới); không có source nào được sửa trong lượt này
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; reconstruct hiện trạng + failure modes + boundary + conceptual design cho visibility/contact của mechanism interactive
State class: State
```

### Full target shown text

```text
Document type: Proposal (investigation, lượt conceptual đầu — read-only)
Design status: Discussion
Implementation: Existing `herdr-spawn` adapter (family A bên dưới); không có source nào được sửa trong lượt này
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; reconstruct hiện trạng + failure modes + boundary + conceptual design cho visibility/contact của mechanism interactive
State class: State
```

## claim_7765c8384841109f54c726219b338219

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-2, lines 10–15.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-5.
Source digest: 96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1
Target digest: 52f715a408328b91d35f99fb67c3f35c6a8cc1c79dc2d1b37078c0cabd4b55e8
Shown source SHA256: 96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1
Shown target SHA256: 52f715a408328b91d35f99fb67c3f35c6a8cc1c79dc2d1b37078c0cabd4b55e8

### Proposed decision

```json
{
  "claimId": "claim_7765c8384841109f54c726219b338219",
  "sourceUnitDigest": "96cc53c4805e83d00d148109c625bb58ce48ca514b3907c4007ed3ece6d410a1",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "52f715a408328b91d35f99fb67c3f35c6a8cc1c79dc2d1b37078c0cabd4b55e8",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-2 (lines 10–15) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-5 (lines 34–39); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Related: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),
[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),
[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md),
[Worker/provider/control boundary](coordination-worker-provider-boundary.md),
[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),
[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).
```

### Full target shown text

```text
Related: [Visibility And Herdr](../../architect/agent-coordination/architecture/visibility-and-herdr.md),
[Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md),
[Coordination ↔ Dispatch contract](../../architect/proposals/coordination-dispatch-contract.md),
[Worker/provider/control boundary](../../architect/proposals/coordination-worker-provider-boundary.md),
[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),
[Brainstorm 2026-08-27 (superseded)](../../architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).
```

## claim_76a87648ab887934fefe3e9c9d24f068

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-3, lines 17–19.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-6.
Source digest: 96631ae6c45e60bbabe94c04895182ec0505b40215cfbea07601701b946d70bf
Target digest: 96631ae6c45e60bbabe94c04895182ec0505b40215cfbea07601701b946d70bf
Shown source SHA256: 96631ae6c45e60bbabe94c04895182ec0505b40215cfbea07601701b946d70bf
Shown target SHA256: 96631ae6c45e60bbabe94c04895182ec0505b40215cfbea07601701b946d70bf

### Proposed decision

```json
{
  "claimId": "claim_76a87648ab887934fefe3e9c9d24f068",
  "sourceUnitDigest": "96631ae6c45e60bbabe94c04895182ec0505b40215cfbea07601701b946d70bf",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "96631ae6c45e60bbabe94c04895182ec0505b40215cfbea07601701b946d70bf",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-3 (lines 17–19) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-6 (lines 41–43); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Nhãn chứng cứ dùng trong tài liệu: **native proven** (code + test có trong repo, chạy được), **native observed but incomplete** (code có, hành vi chỉ đúng một phần hoặc chưa test), **prototype-only**, **unproven** (chỉ là prose/giả định), **unsafe** (đã đo là gây hại), **upstream-proven** (beegog v2.33.2 đã đo và ship, chưa chạy trong fgOS).

---
```

### Full target shown text

```text
Nhãn chứng cứ dùng trong tài liệu: **native proven** (code + test có trong repo, chạy được), **native observed but incomplete** (code có, hành vi chỉ đúng một phần hoặc chưa test), **prototype-only**, **unproven** (chỉ là prose/giả định), **unsafe** (đã đo là gây hại), **upstream-proven** (beegog v2.33.2 đã đo và ship, chưa chạy trong fgOS).

---
```

## claim_bfe38f5d426483a59075a525151d3636

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#1-working-understanding, lines 21–21.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#1-working-understanding.
Source digest: 970ac55b4c0b53e75eb824980230b4aff4e077e58a5d2ee6f1938974fcc83b45
Target digest: 970ac55b4c0b53e75eb824980230b4aff4e077e58a5d2ee6f1938974fcc83b45
Shown source SHA256: 4c7ffc7fec95eef5d36c8089a9156fee47aae7f84029b55c7b5777367a14bf99
Shown target SHA256: 4c7ffc7fec95eef5d36c8089a9156fee47aae7f84029b55c7b5777367a14bf99

### Proposed decision

```json
{
  "claimId": "claim_bfe38f5d426483a59075a525151d3636",
  "sourceUnitDigest": "970ac55b4c0b53e75eb824980230b4aff4e077e58a5d2ee6f1938974fcc83b45",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "1-working-understanding",
  "targetUnitDigest": "970ac55b4c0b53e75eb824980230b4aff4e077e58a5d2ee6f1938974fcc83b45",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#1-working-understanding (lines 21–21) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#1-working-understanding (lines 45–45); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 1. Working Understanding

Câu hỏi thật không phải "làm pane herdr chạy chắc hơn". Câu hỏi là: **khi Dispatch chọn một mechanism interactive, nó phải trả về cho caller một bộ capability quan sát/liên lạc tương ứng, và lifecycle truth của Run phải nằm ở Dispatch chứ không ở terminal.**

```txt
Coordinator judgment
  → semantic Assignment
  → coordination grants / bounds
  → Dispatch & Execution
       → executor / provider / model / tier / persona
       → mechanism (in-process | cli-spawn | herdr-spawn …)
       → execution capability set   ← MỚI, mechanism khai báo
            observe · contact · interrupt · checkpoint · resume
       → Run + VisibilitySession + RunResult
  → durable deliberation memory
  → coordinator chọn bước tiếp
```

Ba nguyên tắc khoá (giữ nguyên từ brief, đã đối chiếu với evidence bên dưới):

1. **Dispatch sở hữu lifecycle truth.** Pane, process handle, provider session là *binding* có thể mất và rebind.
2. **Visibility và contact là capability riêng, có thể refuse.** Observe không kéo theo contact; contact không kéo theo interrupt.
3. **Interactive vẫn đi qua Assignment → Run → RunResult.** Không có "đường herdr riêng" bỏ qua policy, bounds, provenance, evidence.

Kết luận sớm cho câu hỏi của người dùng ("có cần contact mới làm được visibility không?"): **Không.** Visibility cần ba thứ: Run identity bền, một kênh output đọc được, và evidence độc lập với màn hình. Cả ba không cần inbox. Nhưng **readiness handshake + delivery receipt** (worker tự ghi một file ack) thì cần ngay để herdr-spawn ổn định — và chính file đó là hạt giống rẻ nhất của contact sau này, không phải một message bus.

---
````

### Full target shown text

````text
## 1. Working Understanding

Câu hỏi thật không phải "làm pane herdr chạy chắc hơn". Câu hỏi là: **khi Dispatch chọn một mechanism interactive, nó phải trả về cho caller một bộ capability quan sát/liên lạc tương ứng, và lifecycle truth của Run phải nằm ở Dispatch chứ không ở terminal.**

```txt
Coordinator judgment
  → semantic Assignment
  → coordination grants / bounds
  → Dispatch & Execution
       → executor / provider / model / tier / persona
       → mechanism (in-process | cli-spawn | herdr-spawn …)
       → execution capability set   ← MỚI, mechanism khai báo
            observe · contact · interrupt · checkpoint · resume
       → Run + VisibilitySession + RunResult
  → durable deliberation memory
  → coordinator chọn bước tiếp
```

Ba nguyên tắc khoá (giữ nguyên từ brief, đã đối chiếu với evidence bên dưới):

1. **Dispatch sở hữu lifecycle truth.** Pane, process handle, provider session là *binding* có thể mất và rebind.
2. **Visibility và contact là capability riêng, có thể refuse.** Observe không kéo theo contact; contact không kéo theo interrupt.
3. **Interactive vẫn đi qua Assignment → Run → RunResult.** Không có "đường herdr riêng" bỏ qua policy, bounds, provenance, evidence.

Kết luận sớm cho câu hỏi của người dùng ("có cần contact mới làm được visibility không?"): **Không.** Visibility cần ba thứ: Run identity bền, một kênh output đọc được, và evidence độc lập với màn hình. Cả ba không cần inbox. Nhưng **readiness handshake + delivery receipt** (worker tự ghi một file ack) thì cần ngay để herdr-spawn ổn định — và chính file đó là hạt giống rẻ nhất của contact sau này, không phải một message bus.

---
````

## claim_7afd6a4d5ca2ee8e3e4476243b75d89a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-4, lines 23–23.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-7.
Source digest: 4bba97dcfe6428829ef6e746a3a740128e13e722b8231b042954ad06721fb9e1
Target digest: 4bba97dcfe6428829ef6e746a3a740128e13e722b8231b042954ad06721fb9e1
Shown source SHA256: 4bba97dcfe6428829ef6e746a3a740128e13e722b8231b042954ad06721fb9e1
Shown target SHA256: 4bba97dcfe6428829ef6e746a3a740128e13e722b8231b042954ad06721fb9e1

### Proposed decision

```json
{
  "claimId": "claim_7afd6a4d5ca2ee8e3e4476243b75d89a",
  "sourceUnitDigest": "4bba97dcfe6428829ef6e746a3a740128e13e722b8231b042954ad06721fb9e1",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "4bba97dcfe6428829ef6e746a3a740128e13e722b8231b042954ad06721fb9e1",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "1. Working Understanding"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-4 (lines 23–23) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-7 (lines 47–47); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Câu hỏi thật không phải "làm pane herdr chạy chắc hơn". Câu hỏi là: **khi Dispatch chọn một mechanism interactive, nó phải trả về cho caller một bộ capability quan sát/liên lạc tương ứng, và lifecycle truth của Run phải nằm ở Dispatch chứ không ở terminal.**
```

### Full target shown text

```text
Câu hỏi thật không phải "làm pane herdr chạy chắc hơn". Câu hỏi là: **khi Dispatch chọn một mechanism interactive, nó phải trả về cho caller một bộ capability quan sát/liên lạc tương ứng, và lifecycle truth của Run phải nằm ở Dispatch chứ không ở terminal.**
```

## claim_86f7b504c0fc742cf6b27820a4728433

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-5, lines 25–37.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-8.
Source digest: 7101c384b9e9ff1d2d6bf90d227b49fedd2b5940531a9a38bd8483183c96dd18
Target digest: 7101c384b9e9ff1d2d6bf90d227b49fedd2b5940531a9a38bd8483183c96dd18
Shown source SHA256: 7101c384b9e9ff1d2d6bf90d227b49fedd2b5940531a9a38bd8483183c96dd18
Shown target SHA256: 7101c384b9e9ff1d2d6bf90d227b49fedd2b5940531a9a38bd8483183c96dd18

### Proposed decision

```json
{
  "claimId": "claim_86f7b504c0fc742cf6b27820a4728433",
  "sourceUnitDigest": "7101c384b9e9ff1d2d6bf90d227b49fedd2b5940531a9a38bd8483183c96dd18",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "7101c384b9e9ff1d2d6bf90d227b49fedd2b5940531a9a38bd8483183c96dd18",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "1. Working Understanding"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-5 (lines 25–37) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-8 (lines 49–61); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
Coordinator judgment
  → semantic Assignment
  → coordination grants / bounds
  → Dispatch & Execution
       → executor / provider / model / tier / persona
       → mechanism (in-process | cli-spawn | herdr-spawn …)
       → execution capability set   ← MỚI, mechanism khai báo
            observe · contact · interrupt · checkpoint · resume
       → Run + VisibilitySession + RunResult
  → durable deliberation memory
  → coordinator chọn bước tiếp
```
````

### Full target shown text

````text
```txt
Coordinator judgment
  → semantic Assignment
  → coordination grants / bounds
  → Dispatch & Execution
       → executor / provider / model / tier / persona
       → mechanism (in-process | cli-spawn | herdr-spawn …)
       → execution capability set   ← MỚI, mechanism khai báo
            observe · contact · interrupt · checkpoint · resume
       → Run + VisibilitySession + RunResult
  → durable deliberation memory
  → coordinator chọn bước tiếp
```
````

## claim_34cfb3649fad970f56fb1731768c04c4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-6, lines 39–39.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-9.
Source digest: 351d72ff012f8cf375b3714b8c3fd6272d119f2e92bc03c9a300a1361b93aa9c
Target digest: 351d72ff012f8cf375b3714b8c3fd6272d119f2e92bc03c9a300a1361b93aa9c
Shown source SHA256: 351d72ff012f8cf375b3714b8c3fd6272d119f2e92bc03c9a300a1361b93aa9c
Shown target SHA256: 351d72ff012f8cf375b3714b8c3fd6272d119f2e92bc03c9a300a1361b93aa9c

### Proposed decision

```json
{
  "claimId": "claim_34cfb3649fad970f56fb1731768c04c4",
  "sourceUnitDigest": "351d72ff012f8cf375b3714b8c3fd6272d119f2e92bc03c9a300a1361b93aa9c",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "351d72ff012f8cf375b3714b8c3fd6272d119f2e92bc03c9a300a1361b93aa9c",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "1. Working Understanding"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-6 (lines 39–39) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-9 (lines 63–63); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Ba nguyên tắc khoá (giữ nguyên từ brief, đã đối chiếu với evidence bên dưới):
```

### Full target shown text

```text
Ba nguyên tắc khoá (giữ nguyên từ brief, đã đối chiếu với evidence bên dưới):
```

## claim_4765f23bfdde0a9ee23a17f07b090e39

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-7, lines 41–43.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-10.
Source digest: d17110d362a083c2f178136722f23edc6a8df6be4ec09f2752dee00e348fbeeb
Target digest: d17110d362a083c2f178136722f23edc6a8df6be4ec09f2752dee00e348fbeeb
Shown source SHA256: d17110d362a083c2f178136722f23edc6a8df6be4ec09f2752dee00e348fbeeb
Shown target SHA256: d17110d362a083c2f178136722f23edc6a8df6be4ec09f2752dee00e348fbeeb

### Proposed decision

```json
{
  "claimId": "claim_4765f23bfdde0a9ee23a17f07b090e39",
  "sourceUnitDigest": "d17110d362a083c2f178136722f23edc6a8df6be4ec09f2752dee00e348fbeeb",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "d17110d362a083c2f178136722f23edc6a8df6be4ec09f2752dee00e348fbeeb",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "1. Working Understanding"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-7 (lines 41–43) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-10 (lines 65–67); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. **Dispatch sở hữu lifecycle truth.** Pane, process handle, provider session là *binding* có thể mất và rebind.
2. **Visibility và contact là capability riêng, có thể refuse.** Observe không kéo theo contact; contact không kéo theo interrupt.
3. **Interactive vẫn đi qua Assignment → Run → RunResult.** Không có "đường herdr riêng" bỏ qua policy, bounds, provenance, evidence.
```

### Full target shown text

```text
1. **Dispatch sở hữu lifecycle truth.** Pane, process handle, provider session là *binding* có thể mất và rebind.
2. **Visibility và contact là capability riêng, có thể refuse.** Observe không kéo theo contact; contact không kéo theo interrupt.
3. **Interactive vẫn đi qua Assignment → Run → RunResult.** Không có "đường herdr riêng" bỏ qua policy, bounds, provenance, evidence.
```

## claim_5aa8c8b4ae0ddfb35dfd821af68a199e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-8, lines 45–47.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-11.
Source digest: 0da0ef353ef1c73d25d08e7d5bfc886c3221bbcba96d994b4540c91227c19a61
Target digest: 0da0ef353ef1c73d25d08e7d5bfc886c3221bbcba96d994b4540c91227c19a61
Shown source SHA256: 0da0ef353ef1c73d25d08e7d5bfc886c3221bbcba96d994b4540c91227c19a61
Shown target SHA256: 0da0ef353ef1c73d25d08e7d5bfc886c3221bbcba96d994b4540c91227c19a61

### Proposed decision

```json
{
  "claimId": "claim_5aa8c8b4ae0ddfb35dfd821af68a199e",
  "sourceUnitDigest": "0da0ef353ef1c73d25d08e7d5bfc886c3221bbcba96d994b4540c91227c19a61",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "0da0ef353ef1c73d25d08e7d5bfc886c3221bbcba96d994b4540c91227c19a61",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "1. Working Understanding"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-8 (lines 45–47) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-11 (lines 69–71); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Kết luận sớm cho câu hỏi của người dùng ("có cần contact mới làm được visibility không?"): **Không.** Visibility cần ba thứ: Run identity bền, một kênh output đọc được, và evidence độc lập với màn hình. Cả ba không cần inbox. Nhưng **readiness handshake + delivery receipt** (worker tự ghi một file ack) thì cần ngay để herdr-spawn ổn định — và chính file đó là hạt giống rẻ nhất của contact sau này, không phải một message bus.

---
```

### Full target shown text

```text
Kết luận sớm cho câu hỏi của người dùng ("có cần contact mới làm được visibility không?"): **Không.** Visibility cần ba thứ: Run identity bền, một kênh output đọc được, và evidence độc lập với màn hình. Cả ba không cần inbox. Nhưng **readiness handshake + delivery receipt** (worker tự ghi một file ack) thì cần ngay để herdr-spawn ổn định — và chính file đó là hạt giống rẻ nhất của contact sau này, không phải một message bus.

---
```

## claim_44c6e473a6d42986fd8c64b963077b0d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#2-current-visibilitycontact-map-của-dispatch-execution, lines 49–49.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#2-current-visibilitycontact-map-của-dispatch-execution.
Source digest: c54ba7e2797ddccfc76d128949345632896ff291b20328215778cc0c70fc6914
Target digest: c54ba7e2797ddccfc76d128949345632896ff291b20328215778cc0c70fc6914
Shown source SHA256: cf2ee3b9502595f0af7a620964163d272d121b3b394f538dcb33384a264a482f
Shown target SHA256: cf2ee3b9502595f0af7a620964163d272d121b3b394f538dcb33384a264a482f

### Proposed decision

```json
{
  "claimId": "claim_44c6e473a6d42986fd8c64b963077b0d",
  "sourceUnitDigest": "c54ba7e2797ddccfc76d128949345632896ff291b20328215778cc0c70fc6914",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "2-current-visibilitycontact-map-của-dispatch-execution",
  "targetUnitDigest": "c54ba7e2797ddccfc76d128949345632896ff291b20328215778cc0c70fc6914",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#2-current-visibilitycontact-map-của-dispatch-execution (lines 49–49) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#2-current-visibilitycontact-map-của-dispatch-execution (lines 73–73); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 2. Current visibility/contact map của Dispatch & Execution

Nguồn: `src/runner/dispatch/transport.mjs` (`herdrSpawnInteractiveAdapter`, dòng 549–971), `assignment-runner.mjs`, `cli.mjs`, `result-ladder.mjs`, `src/runner/coordination/session-engine.mjs`, `herdr-plugin/src/{gateway,mcp,pick}.rs`, `herdr 0.8.2` (`herdr --skill`, `herdr agent list`).

| Capability | Tồn tại? | Symbol / cửa | Caller | Authz | Provenance | Idempotent | Timeout | Failure | Test | Nhãn |
|---|---|---|---|---|---|---|---|---|---|---|
| Observe pane (người xem) | Có, gián tiếp | pane thật do `herdr pane split` tạo; người nhìn màn hình | human tại herdr UI | không | không | n/a | n/a | pane đóng ở **mọi** outcome (`closePaneBestEffort`, transport.mjs:641,663,785,958) | mocked | native observed but incomplete — không có forensics sau lỗi |
| Stream output (tail) | cli-spawn: có; herdr-spawn: **không** | `onChunk` → `appendWorkerLogChunk` (`.fgos/logs/<id>.log`, RUL39); herdr-spawn chỉ gọi `onChunk` **một lần** ở cuối với stdout best-effort (transport.mjs:954) | loop.mjs | không | không | — | — | — | cli-spawn: có; herdr: không | herdr-spawn: prototype-only |
| Fetch recent output | herdr có (`pane read`, `agent read`); fgOS không expose | — | — | — | — | — | — | — | — | unproven cho fgOS |
| Send input | **không** | cli-spawn: `stdin: 'ignore'`; herdr-spawn chỉ gõ `exitCommand` + sentinel | — | — | — | — | — | — | — | absent |
| Structured contact | **không** | Work-level `ask`/`answer` (`/v1/work/{id}/ask`, MCP `ask_work`) là contact human ↔ *work item*, không phải human ↔ *agent đang chạy* | — | — | — | — | — | — | — | absent |
| Interrupt / cancel Run | **không** | `cancelSession` chỉ ghi status `cancelled` + `inFlightAssignmentIds`, **không kill process, không đóng pane** (session-engine.mjs:4695–4717); kill chỉ xảy ra khi timeout (`killChildTree`) | engine | lock | có (event) | có | — | process vẫn chạy | có (status) / không (kill) | native observed but incomplete — cancel là *ghi sổ*, không phải *effect* |
| Checkpoint | **không** | — | — | — | — | — | — | — | — | absent |
| Inspect current Run | một phần | `.fgos/assignments/<a>/runs/NN/run.json` ghi `status:"running"` trước spawn và **không bao giờ cập nhật**; `exit.json`/`result.json` ghi khi settle; `paneId` **không được persist**, `pid` không bao giờ ghi | `fgos coordination show` | — | có | — | — | crash giữa chừng → run.json kẹt "running", không có marker `pending-reconciliation` | có (settle path) | native observed but incomplete |
| Resume same interactive agent | **không** | herdr có `agent_session` (integration claude báo session id, `herdr agent list` trả `agent_session.value`) và native resume; fgOS không ghi lại | — | — | — | — | — | — | — | absent (herdr-side proven) |
| Reopen với context | **không** | mỗi dispatch = pane mới + `--new-project` | — | — | — | — | — | — | — | absent |
| Contact coordinator tách khỏi worker | **không** | — | — | — | — | — | — | — | — | absent |

Hai cửa contact *có sẵn nhưng ở tầng khác*: (a) Work-level `fgos ask`/`answer` (awaiting-human) — có audit, có lifecycle, nhưng nhắm vào work item; (b) herdr `agent prompt`/`send-keys`/`agent wait` — có transport, **không** authz, **không** audit, không biết Run.

**Kết luận map:** hôm nay fgOS có *visibility thô* (pane thật) và *evidence collector* (run dir + git before/after), nhưng **không có** VisibilitySession, không có contact, không có interrupt-as-effect, không persist binding nào (paneId/pid/agent_session) để một process khác quan sát hay rebind.

---
```

### Full target shown text

```text
## 2. Current visibility/contact map của Dispatch & Execution

Nguồn: `src/runner/dispatch/transport.mjs` (`herdrSpawnInteractiveAdapter`, dòng 549–971), `assignment-runner.mjs`, `cli.mjs`, `result-ladder.mjs`, `src/runner/coordination/session-engine.mjs`, `herdr-plugin/src/{gateway,mcp,pick}.rs`, `herdr 0.8.2` (`herdr --skill`, `herdr agent list`).

| Capability | Tồn tại? | Symbol / cửa | Caller | Authz | Provenance | Idempotent | Timeout | Failure | Test | Nhãn |
|---|---|---|---|---|---|---|---|---|---|---|
| Observe pane (người xem) | Có, gián tiếp | pane thật do `herdr pane split` tạo; người nhìn màn hình | human tại herdr UI | không | không | n/a | n/a | pane đóng ở **mọi** outcome (`closePaneBestEffort`, transport.mjs:641,663,785,958) | mocked | native observed but incomplete — không có forensics sau lỗi |
| Stream output (tail) | cli-spawn: có; herdr-spawn: **không** | `onChunk` → `appendWorkerLogChunk` (`.fgos/logs/<id>.log`, RUL39); herdr-spawn chỉ gọi `onChunk` **một lần** ở cuối với stdout best-effort (transport.mjs:954) | loop.mjs | không | không | — | — | — | cli-spawn: có; herdr: không | herdr-spawn: prototype-only |
| Fetch recent output | herdr có (`pane read`, `agent read`); fgOS không expose | — | — | — | — | — | — | — | — | unproven cho fgOS |
| Send input | **không** | cli-spawn: `stdin: 'ignore'`; herdr-spawn chỉ gõ `exitCommand` + sentinel | — | — | — | — | — | — | — | absent |
| Structured contact | **không** | Work-level `ask`/`answer` (`/v1/work/{id}/ask`, MCP `ask_work`) là contact human ↔ *work item*, không phải human ↔ *agent đang chạy* | — | — | — | — | — | — | — | absent |
| Interrupt / cancel Run | **không** | `cancelSession` chỉ ghi status `cancelled` + `inFlightAssignmentIds`, **không kill process, không đóng pane** (session-engine.mjs:4695–4717); kill chỉ xảy ra khi timeout (`killChildTree`) | engine | lock | có (event) | có | — | process vẫn chạy | có (status) / không (kill) | native observed but incomplete — cancel là *ghi sổ*, không phải *effect* |
| Checkpoint | **không** | — | — | — | — | — | — | — | — | absent |
| Inspect current Run | một phần | `.fgos/assignments/<a>/runs/NN/run.json` ghi `status:"running"` trước spawn và **không bao giờ cập nhật**; `exit.json`/`result.json` ghi khi settle; `paneId` **không được persist**, `pid` không bao giờ ghi | `fgos coordination show` | — | có | — | — | crash giữa chừng → run.json kẹt "running", không có marker `pending-reconciliation` | có (settle path) | native observed but incomplete |
| Resume same interactive agent | **không** | herdr có `agent_session` (integration claude báo session id, `herdr agent list` trả `agent_session.value`) và native resume; fgOS không ghi lại | — | — | — | — | — | — | — | absent (herdr-side proven) |
| Reopen với context | **không** | mỗi dispatch = pane mới + `--new-project` | — | — | — | — | — | — | — | absent |
| Contact coordinator tách khỏi worker | **không** | — | — | — | — | — | — | — | — | absent |

Hai cửa contact *có sẵn nhưng ở tầng khác*: (a) Work-level `fgos ask`/`answer` (awaiting-human) — có audit, có lifecycle, nhưng nhắm vào work item; (b) herdr `agent prompt`/`send-keys`/`agent wait` — có transport, **không** authz, **không** audit, không biết Run.

**Kết luận map:** hôm nay fgOS có *visibility thô* (pane thật) và *evidence collector* (run dir + git before/after), nhưng **không có** VisibilitySession, không có contact, không có interrupt-as-effect, không persist binding nào (paneId/pid/agent_session) để một process khác quan sát hay rebind.

---
```

## claim_bb07f4ace08f5cc8d6d892ea6e059bd8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-9, lines 51–51.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-12.
Source digest: 2e07bdec9fbd43b0f6fb82188b9902ff860a169bb36c846be40d56e7ee9d312d
Target digest: 2e07bdec9fbd43b0f6fb82188b9902ff860a169bb36c846be40d56e7ee9d312d
Shown source SHA256: 2e07bdec9fbd43b0f6fb82188b9902ff860a169bb36c846be40d56e7ee9d312d
Shown target SHA256: 2e07bdec9fbd43b0f6fb82188b9902ff860a169bb36c846be40d56e7ee9d312d

### Proposed decision

```json
{
  "claimId": "claim_bb07f4ace08f5cc8d6d892ea6e059bd8",
  "sourceUnitDigest": "2e07bdec9fbd43b0f6fb82188b9902ff860a169bb36c846be40d56e7ee9d312d",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "2e07bdec9fbd43b0f6fb82188b9902ff860a169bb36c846be40d56e7ee9d312d",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "2. Current visibility/contact map của Dispatch & Execution"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-9 (lines 51–51) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-12 (lines 75–75); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Nguồn: `src/runner/dispatch/transport.mjs` (`herdrSpawnInteractiveAdapter`, dòng 549–971), `assignment-runner.mjs`, `cli.mjs`, `result-ladder.mjs`, `src/runner/coordination/session-engine.mjs`, `herdr-plugin/src/{gateway,mcp,pick}.rs`, `herdr 0.8.2` (`herdr --skill`, `herdr agent list`).
```

### Full target shown text

```text
Nguồn: `src/runner/dispatch/transport.mjs` (`herdrSpawnInteractiveAdapter`, dòng 549–971), `assignment-runner.mjs`, `cli.mjs`, `result-ladder.mjs`, `src/runner/coordination/session-engine.mjs`, `herdr-plugin/src/{gateway,mcp,pick}.rs`, `herdr 0.8.2` (`herdr --skill`, `herdr agent list`).
```

## claim_75771f6f3202c37a464dff7ca7162450

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-10, lines 53–65.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-13.
Source digest: fa0c1077c549808840039e69cb01baca1781085f04f126eb530fd8163e24e010
Target digest: fa0c1077c549808840039e69cb01baca1781085f04f126eb530fd8163e24e010
Shown source SHA256: fa0c1077c549808840039e69cb01baca1781085f04f126eb530fd8163e24e010
Shown target SHA256: fa0c1077c549808840039e69cb01baca1781085f04f126eb530fd8163e24e010

### Proposed decision

```json
{
  "claimId": "claim_75771f6f3202c37a464dff7ca7162450",
  "sourceUnitDigest": "fa0c1077c549808840039e69cb01baca1781085f04f126eb530fd8163e24e010",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "fa0c1077c549808840039e69cb01baca1781085f04f126eb530fd8163e24e010",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "2. Current visibility/contact map của Dispatch & Execution"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-10 (lines 53–65) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-13 (lines 77–89); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Capability | Tồn tại? | Symbol / cửa | Caller | Authz | Provenance | Idempotent | Timeout | Failure | Test | Nhãn |
|---|---|---|---|---|---|---|---|---|---|---|
| Observe pane (người xem) | Có, gián tiếp | pane thật do `herdr pane split` tạo; người nhìn màn hình | human tại herdr UI | không | không | n/a | n/a | pane đóng ở **mọi** outcome (`closePaneBestEffort`, transport.mjs:641,663,785,958) | mocked | native observed but incomplete — không có forensics sau lỗi |
| Stream output (tail) | cli-spawn: có; herdr-spawn: **không** | `onChunk` → `appendWorkerLogChunk` (`.fgos/logs/<id>.log`, RUL39); herdr-spawn chỉ gọi `onChunk` **một lần** ở cuối với stdout best-effort (transport.mjs:954) | loop.mjs | không | không | — | — | — | cli-spawn: có; herdr: không | herdr-spawn: prototype-only |
| Fetch recent output | herdr có (`pane read`, `agent read`); fgOS không expose | — | — | — | — | — | — | — | — | unproven cho fgOS |
| Send input | **không** | cli-spawn: `stdin: 'ignore'`; herdr-spawn chỉ gõ `exitCommand` + sentinel | — | — | — | — | — | — | — | absent |
| Structured contact | **không** | Work-level `ask`/`answer` (`/v1/work/{id}/ask`, MCP `ask_work`) là contact human ↔ *work item*, không phải human ↔ *agent đang chạy* | — | — | — | — | — | — | — | absent |
| Interrupt / cancel Run | **không** | `cancelSession` chỉ ghi status `cancelled` + `inFlightAssignmentIds`, **không kill process, không đóng pane** (session-engine.mjs:4695–4717); kill chỉ xảy ra khi timeout (`killChildTree`) | engine | lock | có (event) | có | — | process vẫn chạy | có (status) / không (kill) | native observed but incomplete — cancel là *ghi sổ*, không phải *effect* |
| Checkpoint | **không** | — | — | — | — | — | — | — | — | absent |
| Inspect current Run | một phần | `.fgos/assignments/<a>/runs/NN/run.json` ghi `status:"running"` trước spawn và **không bao giờ cập nhật**; `exit.json`/`result.json` ghi khi settle; `paneId` **không được persist**, `pid` không bao giờ ghi | `fgos coordination show` | — | có | — | — | crash giữa chừng → run.json kẹt "running", không có marker `pending-reconciliation` | có (settle path) | native observed but incomplete |
| Resume same interactive agent | **không** | herdr có `agent_session` (integration claude báo session id, `herdr agent list` trả `agent_session.value`) và native resume; fgOS không ghi lại | — | — | — | — | — | — | — | absent (herdr-side proven) |
| Reopen với context | **không** | mỗi dispatch = pane mới + `--new-project` | — | — | — | — | — | — | — | absent |
| Contact coordinator tách khỏi worker | **không** | — | — | — | — | — | — | — | — | absent |
```

### Full target shown text

```text
| Capability | Tồn tại? | Symbol / cửa | Caller | Authz | Provenance | Idempotent | Timeout | Failure | Test | Nhãn |
|---|---|---|---|---|---|---|---|---|---|---|
| Observe pane (người xem) | Có, gián tiếp | pane thật do `herdr pane split` tạo; người nhìn màn hình | human tại herdr UI | không | không | n/a | n/a | pane đóng ở **mọi** outcome (`closePaneBestEffort`, transport.mjs:641,663,785,958) | mocked | native observed but incomplete — không có forensics sau lỗi |
| Stream output (tail) | cli-spawn: có; herdr-spawn: **không** | `onChunk` → `appendWorkerLogChunk` (`.fgos/logs/<id>.log`, RUL39); herdr-spawn chỉ gọi `onChunk` **một lần** ở cuối với stdout best-effort (transport.mjs:954) | loop.mjs | không | không | — | — | — | cli-spawn: có; herdr: không | herdr-spawn: prototype-only |
| Fetch recent output | herdr có (`pane read`, `agent read`); fgOS không expose | — | — | — | — | — | — | — | — | unproven cho fgOS |
| Send input | **không** | cli-spawn: `stdin: 'ignore'`; herdr-spawn chỉ gõ `exitCommand` + sentinel | — | — | — | — | — | — | — | absent |
| Structured contact | **không** | Work-level `ask`/`answer` (`/v1/work/{id}/ask`, MCP `ask_work`) là contact human ↔ *work item*, không phải human ↔ *agent đang chạy* | — | — | — | — | — | — | — | absent |
| Interrupt / cancel Run | **không** | `cancelSession` chỉ ghi status `cancelled` + `inFlightAssignmentIds`, **không kill process, không đóng pane** (session-engine.mjs:4695–4717); kill chỉ xảy ra khi timeout (`killChildTree`) | engine | lock | có (event) | có | — | process vẫn chạy | có (status) / không (kill) | native observed but incomplete — cancel là *ghi sổ*, không phải *effect* |
| Checkpoint | **không** | — | — | — | — | — | — | — | — | absent |
| Inspect current Run | một phần | `.fgos/assignments/<a>/runs/NN/run.json` ghi `status:"running"` trước spawn và **không bao giờ cập nhật**; `exit.json`/`result.json` ghi khi settle; `paneId` **không được persist**, `pid` không bao giờ ghi | `fgos coordination show` | — | có | — | — | crash giữa chừng → run.json kẹt "running", không có marker `pending-reconciliation` | có (settle path) | native observed but incomplete |
| Resume same interactive agent | **không** | herdr có `agent_session` (integration claude báo session id, `herdr agent list` trả `agent_session.value`) và native resume; fgOS không ghi lại | — | — | — | — | — | — | — | absent (herdr-side proven) |
| Reopen với context | **không** | mỗi dispatch = pane mới + `--new-project` | — | — | — | — | — | — | — | absent |
| Contact coordinator tách khỏi worker | **không** | — | — | — | — | — | — | — | — | absent |
```

## claim_a9acf3ce40fec5128816eeba3371031b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-11, lines 67–67.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-14.
Source digest: 859b90b66fece8b4618366bddb99944f62e3fa76c5cc5fe43cc657302a1841b4
Target digest: 859b90b66fece8b4618366bddb99944f62e3fa76c5cc5fe43cc657302a1841b4
Shown source SHA256: 859b90b66fece8b4618366bddb99944f62e3fa76c5cc5fe43cc657302a1841b4
Shown target SHA256: 859b90b66fece8b4618366bddb99944f62e3fa76c5cc5fe43cc657302a1841b4

### Proposed decision

```json
{
  "claimId": "claim_a9acf3ce40fec5128816eeba3371031b",
  "sourceUnitDigest": "859b90b66fece8b4618366bddb99944f62e3fa76c5cc5fe43cc657302a1841b4",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "859b90b66fece8b4618366bddb99944f62e3fa76c5cc5fe43cc657302a1841b4",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "2. Current visibility/contact map của Dispatch & Execution"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-11 (lines 67–67) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-14 (lines 91–91); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Hai cửa contact *có sẵn nhưng ở tầng khác*: (a) Work-level `fgos ask`/`answer` (awaiting-human) — có audit, có lifecycle, nhưng nhắm vào work item; (b) herdr `agent prompt`/`send-keys`/`agent wait` — có transport, **không** authz, **không** audit, không biết Run.
```

### Full target shown text

```text
Hai cửa contact *có sẵn nhưng ở tầng khác*: (a) Work-level `fgos ask`/`answer` (awaiting-human) — có audit, có lifecycle, nhưng nhắm vào work item; (b) herdr `agent prompt`/`send-keys`/`agent wait` — có transport, **không** authz, **không** audit, không biết Run.
```

## claim_9c281cd0eda0213a8629cf7ef2729cd5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-12, lines 69–71.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-15.
Source digest: 29991c984051c376da36eab726308879a2cd01ad5799565733b48fda12596b8d
Target digest: 29991c984051c376da36eab726308879a2cd01ad5799565733b48fda12596b8d
Shown source SHA256: 29991c984051c376da36eab726308879a2cd01ad5799565733b48fda12596b8d
Shown target SHA256: 29991c984051c376da36eab726308879a2cd01ad5799565733b48fda12596b8d

### Proposed decision

```json
{
  "claimId": "claim_9c281cd0eda0213a8629cf7ef2729cd5",
  "sourceUnitDigest": "29991c984051c376da36eab726308879a2cd01ad5799565733b48fda12596b8d",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "29991c984051c376da36eab726308879a2cd01ad5799565733b48fda12596b8d",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "2. Current visibility/contact map của Dispatch & Execution"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-12 (lines 69–71) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-15 (lines 93–95); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Kết luận map:** hôm nay fgOS có *visibility thô* (pane thật) và *evidence collector* (run dir + git before/after), nhưng **không có** VisibilitySession, không có contact, không có interrupt-as-effect, không persist binding nào (paneId/pid/agent_session) để một process khác quan sát hay rebind.

---
```

### Full target shown text

```text
**Kết luận map:** hôm nay fgOS có *visibility thô* (pane thật) và *evidence collector* (run dir + git before/after), nhưng **không có** VisibilitySession, không có contact, không có interrupt-as-effect, không persist binding nào (paneId/pid/agent_session) để một process khác quan sát hay rebind.

---
```

## claim_6f1fc7f683a8ac6cd22038fe2517c18e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#3-evidence-về-herdr-spawn-hiện-tại-và-failure-modes, lines 73–73.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#3-evidence-về-herdr-spawn-hiện-tại-và-failure-modes.
Source digest: a5a623a565d1495145fb41923cd7eb4b93e71d5d40e5061315747db7aaafe5be
Target digest: a5a623a565d1495145fb41923cd7eb4b93e71d5d40e5061315747db7aaafe5be
Shown source SHA256: b72c0df578251b5add1b3196675d6afb75d33dea02d51f882b51a1056ea69220
Shown target SHA256: b72c0df578251b5add1b3196675d6afb75d33dea02d51f882b51a1056ea69220

### Proposed decision

```json
{
  "claimId": "claim_6f1fc7f683a8ac6cd22038fe2517c18e",
  "sourceUnitDigest": "a5a623a565d1495145fb41923cd7eb4b93e71d5d40e5061315747db7aaafe5be",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "3-evidence-về-herdr-spawn-hiện-tại-và-failure-modes",
  "targetUnitDigest": "a5a623a565d1495145fb41923cd7eb4b93e71d5d40e5061315747db7aaafe5be",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#3-evidence-về-herdr-spawn-hiện-tại-và-failure-modes (lines 73–73) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#3-evidence-về-herdr-spawn-hiện-tại-và-failure-modes (lines 97–97); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 3. Evidence về herdr-spawn hiện tại và failure modes
```

### Full target shown text

```text
## 3. Evidence về herdr-spawn hiện tại và failure modes
```

## claim_42d2fc94590d1b9788b67b8c3b759415

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#31-herdr-spawn-làm-gì-chính-xác-transportmjs549971, lines 75–75.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#31-herdr-spawn-làm-gì-chính-xác-transportmjs549971.
Source digest: 76658db058bd239d65b3a319a6c2957d39813912e484ae811c03fcd46070b354
Target digest: 76658db058bd239d65b3a319a6c2957d39813912e484ae811c03fcd46070b354
Shown source SHA256: e827eff7bfddc452673d247711960a4217bcbb94f356420ee1615f40c1a23e1c
Shown target SHA256: e827eff7bfddc452673d247711960a4217bcbb94f356420ee1615f40c1a23e1c

### Proposed decision

```json
{
  "claimId": "claim_42d2fc94590d1b9788b67b8c3b759415",
  "sourceUnitDigest": "76658db058bd239d65b3a319a6c2957d39813912e484ae811c03fcd46070b354",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "31-herdr-spawn-làm-gì-chính-xác-transportmjs549971",
  "targetUnitDigest": "76658db058bd239d65b3a319a6c2957d39813912e484ae811c03fcd46070b354",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "3. Evidence về herdr-spawn hiện tại và failure modes"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#31-herdr-spawn-làm-gì-chính-xác-transportmjs549971 (lines 75–75) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#31-herdr-spawn-làm-gì-chính-xác-transportmjs549971 (lines 99–99); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 3.1 herdr-spawn làm gì chính xác (transport.mjs:549–971)

1. `herdr pane split --direction right --no-focus [--cwd] [--env K=V]*` → parse `pane_id`.
2. `herdr pane run <pane> "<command> <args…>"` — **toàn bộ command line kể cả prompt** được `posixShellQuote` rồi *gõ vào pty như keystroke*.
3. Poll `herdr pane get <pane>` mỗi 500 ms, đọc `agent_status`; `idle` chỉ tin sau khi thấy `working` ≥ 1 lần (`sawWorking`), `done` không cần; cả hai cần 3 poll liên tiếp.
4. `pane run <pane> <exitCommand>` (`/exit`), rồi poll `pane get` tới khi trường `agent` biến mất (≤ 10 s, `Atomics.wait` sync).
5. `pane run <pane> 'echo "<sentinel>:$?"'`, rồi `pane wait-output --regex … --source recent-unwrapped --lines 500` (spawn detached, đọc stdout).
6. Cắt scrollback: bỏ echo command, bỏ echo `/exit`, lấy exit code từ sentinel; `stdout` **best-effort**; `closePaneBestEffort()`; resolve `{status, signal, stdout, stderr:'', tier, model, paneId}`.
7. `timeoutMs` (mặc định 15 phút, từ cli.mjs): kill observer group + đóng pane + reject `worker-timeout`.

Workspace/cwd/env: `cwd` từ opts; env = `process.env` **+** executor env + `FGOS_DISPATCH_DEPTH` (kế thừa toàn bộ môi trường host — đã ghi ở worker-provider-boundary). Process group: chỉ observer `wait-output` là con của fgOS; **agent process là con của herdr server**, fgOS không giữ pid, không giữ pgid → timeout không kill được agent, chỉ đóng pane.
```

### Full target shown text

```text
### 3.1 herdr-spawn làm gì chính xác (transport.mjs:549–971)

1. `herdr pane split --direction right --no-focus [--cwd] [--env K=V]*` → parse `pane_id`.
2. `herdr pane run <pane> "<command> <args…>"` — **toàn bộ command line kể cả prompt** được `posixShellQuote` rồi *gõ vào pty như keystroke*.
3. Poll `herdr pane get <pane>` mỗi 500 ms, đọc `agent_status`; `idle` chỉ tin sau khi thấy `working` ≥ 1 lần (`sawWorking`), `done` không cần; cả hai cần 3 poll liên tiếp.
4. `pane run <pane> <exitCommand>` (`/exit`), rồi poll `pane get` tới khi trường `agent` biến mất (≤ 10 s, `Atomics.wait` sync).
5. `pane run <pane> 'echo "<sentinel>:$?"'`, rồi `pane wait-output --regex … --source recent-unwrapped --lines 500` (spawn detached, đọc stdout).
6. Cắt scrollback: bỏ echo command, bỏ echo `/exit`, lấy exit code từ sentinel; `stdout` **best-effort**; `closePaneBestEffort()`; resolve `{status, signal, stdout, stderr:'', tier, model, paneId}`.
7. `timeoutMs` (mặc định 15 phút, từ cli.mjs): kill observer group + đóng pane + reject `worker-timeout`.

Workspace/cwd/env: `cwd` từ opts; env = `process.env` **+** executor env + `FGOS_DISPATCH_DEPTH` (kế thừa toàn bộ môi trường host — đã ghi ở worker-provider-boundary). Process group: chỉ observer `wait-output` là con của fgOS; **agent process là con của herdr server**, fgOS không giữ pid, không giữ pgid → timeout không kill được agent, chỉ đóng pane.
```

## claim_e4c7a1b2b738bf530e76583cd21b430d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-13, lines 77–83.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-16.
Source digest: 737e38574ec10195f8d8286a8906abdd76b7d7ddb4104957ada5a2701129e44e
Target digest: 737e38574ec10195f8d8286a8906abdd76b7d7ddb4104957ada5a2701129e44e
Shown source SHA256: 737e38574ec10195f8d8286a8906abdd76b7d7ddb4104957ada5a2701129e44e
Shown target SHA256: 737e38574ec10195f8d8286a8906abdd76b7d7ddb4104957ada5a2701129e44e

### Proposed decision

```json
{
  "claimId": "claim_e4c7a1b2b738bf530e76583cd21b430d",
  "sourceUnitDigest": "737e38574ec10195f8d8286a8906abdd76b7d7ddb4104957ada5a2701129e44e",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "737e38574ec10195f8d8286a8906abdd76b7d7ddb4104957ada5a2701129e44e",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "3. Evidence về herdr-spawn hiện tại và failure modes",
    "3.1 herdr-spawn làm gì chính xác (transport.mjs:549–971)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-13 (lines 77–83) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-16 (lines 101–107); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. `herdr pane split --direction right --no-focus [--cwd] [--env K=V]*` → parse `pane_id`.
2. `herdr pane run <pane> "<command> <args…>"` — **toàn bộ command line kể cả prompt** được `posixShellQuote` rồi *gõ vào pty như keystroke*.
3. Poll `herdr pane get <pane>` mỗi 500 ms, đọc `agent_status`; `idle` chỉ tin sau khi thấy `working` ≥ 1 lần (`sawWorking`), `done` không cần; cả hai cần 3 poll liên tiếp.
4. `pane run <pane> <exitCommand>` (`/exit`), rồi poll `pane get` tới khi trường `agent` biến mất (≤ 10 s, `Atomics.wait` sync).
5. `pane run <pane> 'echo "<sentinel>:$?"'`, rồi `pane wait-output --regex … --source recent-unwrapped --lines 500` (spawn detached, đọc stdout).
6. Cắt scrollback: bỏ echo command, bỏ echo `/exit`, lấy exit code từ sentinel; `stdout` **best-effort**; `closePaneBestEffort()`; resolve `{status, signal, stdout, stderr:'', tier, model, paneId}`.
7. `timeoutMs` (mặc định 15 phút, từ cli.mjs): kill observer group + đóng pane + reject `worker-timeout`.
```

### Full target shown text

```text
1. `herdr pane split --direction right --no-focus [--cwd] [--env K=V]*` → parse `pane_id`.
2. `herdr pane run <pane> "<command> <args…>"` — **toàn bộ command line kể cả prompt** được `posixShellQuote` rồi *gõ vào pty như keystroke*.
3. Poll `herdr pane get <pane>` mỗi 500 ms, đọc `agent_status`; `idle` chỉ tin sau khi thấy `working` ≥ 1 lần (`sawWorking`), `done` không cần; cả hai cần 3 poll liên tiếp.
4. `pane run <pane> <exitCommand>` (`/exit`), rồi poll `pane get` tới khi trường `agent` biến mất (≤ 10 s, `Atomics.wait` sync).
5. `pane run <pane> 'echo "<sentinel>:$?"'`, rồi `pane wait-output --regex … --source recent-unwrapped --lines 500` (spawn detached, đọc stdout).
6. Cắt scrollback: bỏ echo command, bỏ echo `/exit`, lấy exit code từ sentinel; `stdout` **best-effort**; `closePaneBestEffort()`; resolve `{status, signal, stdout, stderr:'', tier, model, paneId}`.
7. `timeoutMs` (mặc định 15 phút, từ cli.mjs): kill observer group + đóng pane + reject `worker-timeout`.
```

## claim_7a0233744db704e0e0e2956d71c71d94

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-14, lines 85–85.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-17.
Source digest: 22bcda127d0bed3e69e0dd1be043fea36800a957680e8a85730103e225724483
Target digest: 22bcda127d0bed3e69e0dd1be043fea36800a957680e8a85730103e225724483
Shown source SHA256: 22bcda127d0bed3e69e0dd1be043fea36800a957680e8a85730103e225724483
Shown target SHA256: 22bcda127d0bed3e69e0dd1be043fea36800a957680e8a85730103e225724483

### Proposed decision

```json
{
  "claimId": "claim_7a0233744db704e0e0e2956d71c71d94",
  "sourceUnitDigest": "22bcda127d0bed3e69e0dd1be043fea36800a957680e8a85730103e225724483",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "22bcda127d0bed3e69e0dd1be043fea36800a957680e8a85730103e225724483",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "3. Evidence về herdr-spawn hiện tại và failure modes",
    "3.1 herdr-spawn làm gì chính xác (transport.mjs:549–971)"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-14 (lines 85–85) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-17 (lines 109–109); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Workspace/cwd/env: `cwd` từ opts; env = `process.env` **+** executor env + `FGOS_DISPATCH_DEPTH` (kế thừa toàn bộ môi trường host — đã ghi ở worker-provider-boundary). Process group: chỉ observer `wait-output` là con của fgOS; **agent process là con của herdr server**, fgOS không giữ pid, không giữ pgid → timeout không kill được agent, chỉ đóng pane.
```

### Full target shown text

```text
Workspace/cwd/env: `cwd` từ opts; env = `process.env` **+** executor env + `FGOS_DISPATCH_DEPTH` (kế thừa toàn bộ môi trường host — đã ghi ở worker-provider-boundary). Process group: chỉ observer `wait-output` là con của fgOS; **agent process là con của herdr server**, fgOS không giữ pid, không giữ pgid → timeout không kill được agent, chỉ đóng pane.
```

## claim_92dc57e5de27836499802a0772bb963c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#32-failure-modes-bảng-evidence, lines 87–87.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#32-failure-modes-bảng-evidence.
Source digest: 128e0092b4e6b1f645a42c84897d7759326a362a0b455a29f475d82805ebd5b1
Target digest: 128e0092b4e6b1f645a42c84897d7759326a362a0b455a29f475d82805ebd5b1
Shown source SHA256: df5f89571e04bbf7dd5b087f0d617b830ac9571bee8190b75cc1ca9e563a96a5
Shown target SHA256: df5f89571e04bbf7dd5b087f0d617b830ac9571bee8190b75cc1ca9e563a96a5

### Proposed decision

```json
{
  "claimId": "claim_92dc57e5de27836499802a0772bb963c",
  "sourceUnitDigest": "128e0092b4e6b1f645a42c84897d7759326a362a0b455a29f475d82805ebd5b1",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "32-failure-modes-bảng-evidence",
  "targetUnitDigest": "128e0092b4e6b1f645a42c84897d7759326a362a0b455a29f475d82805ebd5b1",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "3. Evidence về herdr-spawn hiện tại và failure modes"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#32-failure-modes-bảng-evidence (lines 87–87) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#32-failure-modes-bảng-evidence (lines 111–111); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 3.2 Failure modes — bảng evidence

| # | Failure mode | Evidence | Nhãn |
|---|---|---|---|
| F1 | Startup race: `agent_status=idle` giả tại ~3.5 s trong khi banner còn nguyên, file chưa tồn tại; poll 500 ms từ sớm kích hoạt gần như mọi lần | `docs/history/agy-herdr-false-idle-polling-race/RESEARCH.md` Round 2 | unsafe (đã vá bằng sawWorking, vá là heuristic) |
| F2 | Mid-turn dip: giữa hai tool call `agent_status` rơi về idle 1 poll → `/exit` gửi giữa chừng, ~25% run, tệ hơn dưới load | cùng file Round 3; 3-poll debounce chỉ "0/4 fail", không phải chứng minh | native observed but incomplete |
| F3 | Multi-line prompt làm hỏng argv: `pane run` gõ newline trong `'…'` → agy nhận prompt rỗng và `--model` rỗng; **mọi** prompt thật của fgOS đều multi-line | `docs/history/agy-herdr-interactive-mode-multiline-prompt-corruption/RESEARCH.md` | unsafe (đường chính hiện tại **không dùng được** cho prompt thật; production đã revert prefer về `agy-cli`) |
| F4 | Sentinel bị nuốt như chat input: echo gửi ngay sau `/exit` khi agy chưa teardown (~1 s) | transport.mjs:793–804 | native proven (đã vá bằng poll `agent` biến mất, có deadline 10 s) |
| F5 | Alternate-screen redraw: `/exit` xoá màn hình → `recent-unwrapped` không giữ nội dung; herdr xác nhận rows rời alt-screen không vào host scrollback | transport.mjs:913–923; `herdr --skill` §Run | native proven là *mất* — stdout của interactive là opportunistic |
| F6 | Pane đóng ở mọi outcome, kể cả timeout/thất bại → mất forensics | transport.mjs:641–652 và 4 call site | native observed but incomplete |
| F7 | Không persist paneId/pid/agent_session → không observer nào khác tìm được pane; crash của process dispatch = mất binding | assignment-runner (run.json không có paneId), dispatch-runner scout | structural |
| F8 | `run.json` `status:"running"` không bao giờ cập nhật; không có reconciliation cho Run mồ côi | assignment-runner.mjs | structural |
| F9 | Cancel không phải effect: `cancelSession` không kill/đóng | session-engine.mjs:4695–4717 | structural |
| F10 | Timeout observer ≠ timeout execution: fgOS chỉ kill observer + đóng pane; agent process (con của herdr) có thể còn sống nếu đóng pane không SIGHUP được nó | transport.mjs:654–670; không có test | unproven |
| F11 | Env/credential/socket inheritance: `{...process.env, ...}` vào pane; HERDR socket, provider creds thừa kế | transport.mjs:565; worker-provider-boundary.md | structural |
| F12 | Depth cap là cooperative (env var), worker có thể xoá | transport.mjs:46–56 | structural |
| F13 | `done` không qua sawWorking; quyết định dựa trên "không tái hiện được done" trong một phiên bản agy/herdr | transport.mjs:729–741 | native observed but incomplete |
| F14 | Send ≠ submit; `idle` mơ hồ giết agent; trust-dialog đọc thành `idle` không phải `blocked` | distillery herdr-vs-tmux §3 (airemote); upstream beegog herding-prompt-stall D5 | unsafe (đo ở 2 dự án) |
| F15 | Herdr API trả OK nhưng hành động chưa xảy ra: `agent_prompt_stalled` (5 s) và client-timeout đua nhau; 5 s timeout thì fail, 20 s cùng pane thì working | upstream hps-11 | upstream-proven |
| F16 | Pane hẹp < 60 cột: submission stall trước khi agent xử lý; 5 spawn đồng thời đọc cùng root → split race | upstream herding-prompt-stall hps-12/13, split-serialize D1 | upstream-proven |
| F17 | Gateway restart / observer disconnect bị coi là worker chết | chưa có code nào phân biệt — vì không có observer identity | unproven (chưa có cơ chế để sai) |
| F18 | Interactive mode viết ngoài boundary: `--mode accept-edits` + full env; P00.1 đã đo agy/claude **mutate được** khi không có bwrap; bwrap ro-bind lại khiến CLI không khởi động private state | P00.1 Proof Matrix + Known Limitation | unsafe / unproven cho interactive |
```

### Full target shown text

```text
### 3.2 Failure modes — bảng evidence

| # | Failure mode | Evidence | Nhãn |
|---|---|---|---|
| F1 | Startup race: `agent_status=idle` giả tại ~3.5 s trong khi banner còn nguyên, file chưa tồn tại; poll 500 ms từ sớm kích hoạt gần như mọi lần | `docs/history/agy-herdr-false-idle-polling-race/RESEARCH.md` Round 2 | unsafe (đã vá bằng sawWorking, vá là heuristic) |
| F2 | Mid-turn dip: giữa hai tool call `agent_status` rơi về idle 1 poll → `/exit` gửi giữa chừng, ~25% run, tệ hơn dưới load | cùng file Round 3; 3-poll debounce chỉ "0/4 fail", không phải chứng minh | native observed but incomplete |
| F3 | Multi-line prompt làm hỏng argv: `pane run` gõ newline trong `'…'` → agy nhận prompt rỗng và `--model` rỗng; **mọi** prompt thật của fgOS đều multi-line | `docs/history/agy-herdr-interactive-mode-multiline-prompt-corruption/RESEARCH.md` | unsafe (đường chính hiện tại **không dùng được** cho prompt thật; production đã revert prefer về `agy-cli`) |
| F4 | Sentinel bị nuốt như chat input: echo gửi ngay sau `/exit` khi agy chưa teardown (~1 s) | transport.mjs:793–804 | native proven (đã vá bằng poll `agent` biến mất, có deadline 10 s) |
| F5 | Alternate-screen redraw: `/exit` xoá màn hình → `recent-unwrapped` không giữ nội dung; herdr xác nhận rows rời alt-screen không vào host scrollback | transport.mjs:913–923; `herdr --skill` §Run | native proven là *mất* — stdout của interactive là opportunistic |
| F6 | Pane đóng ở mọi outcome, kể cả timeout/thất bại → mất forensics | transport.mjs:641–652 và 4 call site | native observed but incomplete |
| F7 | Không persist paneId/pid/agent_session → không observer nào khác tìm được pane; crash của process dispatch = mất binding | assignment-runner (run.json không có paneId), dispatch-runner scout | structural |
| F8 | `run.json` `status:"running"` không bao giờ cập nhật; không có reconciliation cho Run mồ côi | assignment-runner.mjs | structural |
| F9 | Cancel không phải effect: `cancelSession` không kill/đóng | session-engine.mjs:4695–4717 | structural |
| F10 | Timeout observer ≠ timeout execution: fgOS chỉ kill observer + đóng pane; agent process (con của herdr) có thể còn sống nếu đóng pane không SIGHUP được nó | transport.mjs:654–670; không có test | unproven |
| F11 | Env/credential/socket inheritance: `{...process.env, ...}` vào pane; HERDR socket, provider creds thừa kế | transport.mjs:565; worker-provider-boundary.md | structural |
| F12 | Depth cap là cooperative (env var), worker có thể xoá | transport.mjs:46–56 | structural |
| F13 | `done` không qua sawWorking; quyết định dựa trên "không tái hiện được done" trong một phiên bản agy/herdr | transport.mjs:729–741 | native observed but incomplete |
| F14 | Send ≠ submit; `idle` mơ hồ giết agent; trust-dialog đọc thành `idle` không phải `blocked` | distillery herdr-vs-tmux §3 (airemote); upstream beegog herding-prompt-stall D5 | unsafe (đo ở 2 dự án) |
| F15 | Herdr API trả OK nhưng hành động chưa xảy ra: `agent_prompt_stalled` (5 s) và client-timeout đua nhau; 5 s timeout thì fail, 20 s cùng pane thì working | upstream hps-11 | upstream-proven |
| F16 | Pane hẹp < 60 cột: submission stall trước khi agent xử lý; 5 spawn đồng thời đọc cùng root → split race | upstream herding-prompt-stall hps-12/13, split-serialize D1 | upstream-proven |
| F17 | Gateway restart / observer disconnect bị coi là worker chết | chưa có code nào phân biệt — vì không có observer identity | unproven (chưa có cơ chế để sai) |
| F18 | Interactive mode viết ngoài boundary: `--mode accept-edits` + full env; P00.1 đã đo agy/claude **mutate được** khi không có bwrap; bwrap ro-bind lại khiến CLI không khởi động private state | P00.1 Proof Matrix + Known Limitation | unsafe / unproven cho interactive |
```

## claim_0efed4dc50542e35594336005aa3b57c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-15, lines 89–108.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-18.
Source digest: ad193bfbabcd44d37cdd54e254822ea9019a943588b9ed3eef3a31e92964b54b
Target digest: ad193bfbabcd44d37cdd54e254822ea9019a943588b9ed3eef3a31e92964b54b
Shown source SHA256: ad193bfbabcd44d37cdd54e254822ea9019a943588b9ed3eef3a31e92964b54b
Shown target SHA256: ad193bfbabcd44d37cdd54e254822ea9019a943588b9ed3eef3a31e92964b54b

### Proposed decision

```json
{
  "claimId": "claim_0efed4dc50542e35594336005aa3b57c",
  "sourceUnitDigest": "ad193bfbabcd44d37cdd54e254822ea9019a943588b9ed3eef3a31e92964b54b",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "ad193bfbabcd44d37cdd54e254822ea9019a943588b9ed3eef3a31e92964b54b",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "3. Evidence về herdr-spawn hiện tại và failure modes",
    "3.2 Failure modes — bảng evidence"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-15 (lines 89–108) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-18 (lines 113–132); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| # | Failure mode | Evidence | Nhãn |
|---|---|---|---|
| F1 | Startup race: `agent_status=idle` giả tại ~3.5 s trong khi banner còn nguyên, file chưa tồn tại; poll 500 ms từ sớm kích hoạt gần như mọi lần | `docs/history/agy-herdr-false-idle-polling-race/RESEARCH.md` Round 2 | unsafe (đã vá bằng sawWorking, vá là heuristic) |
| F2 | Mid-turn dip: giữa hai tool call `agent_status` rơi về idle 1 poll → `/exit` gửi giữa chừng, ~25% run, tệ hơn dưới load | cùng file Round 3; 3-poll debounce chỉ "0/4 fail", không phải chứng minh | native observed but incomplete |
| F3 | Multi-line prompt làm hỏng argv: `pane run` gõ newline trong `'…'` → agy nhận prompt rỗng và `--model` rỗng; **mọi** prompt thật của fgOS đều multi-line | `docs/history/agy-herdr-interactive-mode-multiline-prompt-corruption/RESEARCH.md` | unsafe (đường chính hiện tại **không dùng được** cho prompt thật; production đã revert prefer về `agy-cli`) |
| F4 | Sentinel bị nuốt như chat input: echo gửi ngay sau `/exit` khi agy chưa teardown (~1 s) | transport.mjs:793–804 | native proven (đã vá bằng poll `agent` biến mất, có deadline 10 s) |
| F5 | Alternate-screen redraw: `/exit` xoá màn hình → `recent-unwrapped` không giữ nội dung; herdr xác nhận rows rời alt-screen không vào host scrollback | transport.mjs:913–923; `herdr --skill` §Run | native proven là *mất* — stdout của interactive là opportunistic |
| F6 | Pane đóng ở mọi outcome, kể cả timeout/thất bại → mất forensics | transport.mjs:641–652 và 4 call site | native observed but incomplete |
| F7 | Không persist paneId/pid/agent_session → không observer nào khác tìm được pane; crash của process dispatch = mất binding | assignment-runner (run.json không có paneId), dispatch-runner scout | structural |
| F8 | `run.json` `status:"running"` không bao giờ cập nhật; không có reconciliation cho Run mồ côi | assignment-runner.mjs | structural |
| F9 | Cancel không phải effect: `cancelSession` không kill/đóng | session-engine.mjs:4695–4717 | structural |
| F10 | Timeout observer ≠ timeout execution: fgOS chỉ kill observer + đóng pane; agent process (con của herdr) có thể còn sống nếu đóng pane không SIGHUP được nó | transport.mjs:654–670; không có test | unproven |
| F11 | Env/credential/socket inheritance: `{...process.env, ...}` vào pane; HERDR socket, provider creds thừa kế | transport.mjs:565; worker-provider-boundary.md | structural |
| F12 | Depth cap là cooperative (env var), worker có thể xoá | transport.mjs:46–56 | structural |
| F13 | `done` không qua sawWorking; quyết định dựa trên "không tái hiện được done" trong một phiên bản agy/herdr | transport.mjs:729–741 | native observed but incomplete |
| F14 | Send ≠ submit; `idle` mơ hồ giết agent; trust-dialog đọc thành `idle` không phải `blocked` | distillery herdr-vs-tmux §3 (airemote); upstream beegog herding-prompt-stall D5 | unsafe (đo ở 2 dự án) |
| F15 | Herdr API trả OK nhưng hành động chưa xảy ra: `agent_prompt_stalled` (5 s) và client-timeout đua nhau; 5 s timeout thì fail, 20 s cùng pane thì working | upstream hps-11 | upstream-proven |
| F16 | Pane hẹp < 60 cột: submission stall trước khi agent xử lý; 5 spawn đồng thời đọc cùng root → split race | upstream herding-prompt-stall hps-12/13, split-serialize D1 | upstream-proven |
| F17 | Gateway restart / observer disconnect bị coi là worker chết | chưa có code nào phân biệt — vì không có observer identity | unproven (chưa có cơ chế để sai) |
| F18 | Interactive mode viết ngoài boundary: `--mode accept-edits` + full env; P00.1 đã đo agy/claude **mutate được** khi không có bwrap; bwrap ro-bind lại khiến CLI không khởi động private state | P00.1 Proof Matrix + Known Limitation | unsafe / unproven cho interactive |
```

### Full target shown text

```text
| # | Failure mode | Evidence | Nhãn |
|---|---|---|---|
| F1 | Startup race: `agent_status=idle` giả tại ~3.5 s trong khi banner còn nguyên, file chưa tồn tại; poll 500 ms từ sớm kích hoạt gần như mọi lần | `docs/history/agy-herdr-false-idle-polling-race/RESEARCH.md` Round 2 | unsafe (đã vá bằng sawWorking, vá là heuristic) |
| F2 | Mid-turn dip: giữa hai tool call `agent_status` rơi về idle 1 poll → `/exit` gửi giữa chừng, ~25% run, tệ hơn dưới load | cùng file Round 3; 3-poll debounce chỉ "0/4 fail", không phải chứng minh | native observed but incomplete |
| F3 | Multi-line prompt làm hỏng argv: `pane run` gõ newline trong `'…'` → agy nhận prompt rỗng và `--model` rỗng; **mọi** prompt thật của fgOS đều multi-line | `docs/history/agy-herdr-interactive-mode-multiline-prompt-corruption/RESEARCH.md` | unsafe (đường chính hiện tại **không dùng được** cho prompt thật; production đã revert prefer về `agy-cli`) |
| F4 | Sentinel bị nuốt như chat input: echo gửi ngay sau `/exit` khi agy chưa teardown (~1 s) | transport.mjs:793–804 | native proven (đã vá bằng poll `agent` biến mất, có deadline 10 s) |
| F5 | Alternate-screen redraw: `/exit` xoá màn hình → `recent-unwrapped` không giữ nội dung; herdr xác nhận rows rời alt-screen không vào host scrollback | transport.mjs:913–923; `herdr --skill` §Run | native proven là *mất* — stdout của interactive là opportunistic |
| F6 | Pane đóng ở mọi outcome, kể cả timeout/thất bại → mất forensics | transport.mjs:641–652 và 4 call site | native observed but incomplete |
| F7 | Không persist paneId/pid/agent_session → không observer nào khác tìm được pane; crash của process dispatch = mất binding | assignment-runner (run.json không có paneId), dispatch-runner scout | structural |
| F8 | `run.json` `status:"running"` không bao giờ cập nhật; không có reconciliation cho Run mồ côi | assignment-runner.mjs | structural |
| F9 | Cancel không phải effect: `cancelSession` không kill/đóng | session-engine.mjs:4695–4717 | structural |
| F10 | Timeout observer ≠ timeout execution: fgOS chỉ kill observer + đóng pane; agent process (con của herdr) có thể còn sống nếu đóng pane không SIGHUP được nó | transport.mjs:654–670; không có test | unproven |
| F11 | Env/credential/socket inheritance: `{...process.env, ...}` vào pane; HERDR socket, provider creds thừa kế | transport.mjs:565; worker-provider-boundary.md | structural |
| F12 | Depth cap là cooperative (env var), worker có thể xoá | transport.mjs:46–56 | structural |
| F13 | `done` không qua sawWorking; quyết định dựa trên "không tái hiện được done" trong một phiên bản agy/herdr | transport.mjs:729–741 | native observed but incomplete |
| F14 | Send ≠ submit; `idle` mơ hồ giết agent; trust-dialog đọc thành `idle` không phải `blocked` | distillery herdr-vs-tmux §3 (airemote); upstream beegog herding-prompt-stall D5 | unsafe (đo ở 2 dự án) |
| F15 | Herdr API trả OK nhưng hành động chưa xảy ra: `agent_prompt_stalled` (5 s) và client-timeout đua nhau; 5 s timeout thì fail, 20 s cùng pane thì working | upstream hps-11 | upstream-proven |
| F16 | Pane hẹp < 60 cột: submission stall trước khi agent xử lý; 5 spawn đồng thời đọc cùng root → split race | upstream herding-prompt-stall hps-12/13, split-serialize D1 | upstream-proven |
| F17 | Gateway restart / observer disconnect bị coi là worker chết | chưa có code nào phân biệt — vì không có observer identity | unproven (chưa có cơ chế để sai) |
| F18 | Interactive mode viết ngoài boundary: `--mode accept-edits` + full env; P00.1 đã đo agy/claude **mutate được** khi không có bwrap; bwrap ro-bind lại khiến CLI không khởi động private state | P00.1 Proof Matrix + Known Limitation | unsafe / unproven cho interactive |
```

## claim_cfd29b67260aa26bd2b94719c1a7f2ab

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#33-drift-giữa-tài-liệu-và-code, lines 110–110.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#33-drift-giữa-tài-liệu-và-code.
Source digest: 7bd2cb5ebf4e7bd9ebe3caae29751199406af337608be3d9db6859c69b6ffe4e
Target digest: 7bd2cb5ebf4e7bd9ebe3caae29751199406af337608be3d9db6859c69b6ffe4e
Shown source SHA256: cce6fca317cdda2ba627729962eedf5ecf436c4db2ccd15571b7f99f0c26e992
Shown target SHA256: cce6fca317cdda2ba627729962eedf5ecf436c4db2ccd15571b7f99f0c26e992

### Proposed decision

```json
{
  "claimId": "claim_cfd29b67260aa26bd2b94719c1a7f2ab",
  "sourceUnitDigest": "7bd2cb5ebf4e7bd9ebe3caae29751199406af337608be3d9db6859c69b6ffe4e",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "33-drift-giữa-tài-liệu-và-code",
  "targetUnitDigest": "7bd2cb5ebf4e7bd9ebe3caae29751199406af337608be3d9db6859c69b6ffe4e",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "3. Evidence về herdr-spawn hiện tại và failure modes"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#33-drift-giữa-tài-liệu-và-code (lines 110–110) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#33-drift-giữa-tài-liệu-và-code (lines 134–134); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 3.3 Drift giữa tài liệu và code

- `dispatch-control-plane-redesign.md` §12.2 mô tả adapter dùng *temporary script + runner-owned sentinel sau khi command exit*. `tsk-by0` đã **xoá** đường đó; đường còn lại là `interactiveMode` gõ `/exit`. Prose lỗi thời.
- `docs/specs/runner.md` RUL40 (luật cứng, D d3dbe7f5): "KHÔNG BAO GIỜ gọi `herdr agent start` hay đọc `agent_status` làm tín hiệu quyết định". `herdrSpawnInteractiveAdapter` **đọc `agent_status` làm tín hiệu quyết định duy nhất** để gửi `/exit`. Code đang vi phạm luật; luật lại cấm đúng công cụ mà upstream chứng minh dùng được *nếu* hạ cấp nó thành failure detector. **Đã re-scope 2026-09-06** (decision "RUL40 re-scope", scope `runner`, supersedes d3dbe7f5 — xem §14 H1): herdr không bao giờ là truth/receipt, nhưng agent API được dùng làm transport và failure detector.
- `visibility-and-herdr.md` ghi "Visibility adapters should consume canonical Run/RunResult state". Không adapter nào làm vậy (không có Run state để consume ngoài run.json kẹt "running").
- `herdr-scout` ghi nhận `pane rename` "không còn hỗ trợ" là **sai**: `herdr pane --help` 0.8.2 vẫn liệt kê `rename`; `/fgOS:terminal` dùng được. Không có drift ở đây.

---
```

### Full target shown text

```text
### 3.3 Drift giữa tài liệu và code

- `dispatch-control-plane-redesign.md` §12.2 mô tả adapter dùng *temporary script + runner-owned sentinel sau khi command exit*. `tsk-by0` đã **xoá** đường đó; đường còn lại là `interactiveMode` gõ `/exit`. Prose lỗi thời.
- `docs/specs/runner.md` RUL40 (luật cứng, D d3dbe7f5): "KHÔNG BAO GIỜ gọi `herdr agent start` hay đọc `agent_status` làm tín hiệu quyết định". `herdrSpawnInteractiveAdapter` **đọc `agent_status` làm tín hiệu quyết định duy nhất** để gửi `/exit`. Code đang vi phạm luật; luật lại cấm đúng công cụ mà upstream chứng minh dùng được *nếu* hạ cấp nó thành failure detector. **Đã re-scope 2026-09-06** (decision "RUL40 re-scope", scope `runner`, supersedes d3dbe7f5 — xem §14 H1): herdr không bao giờ là truth/receipt, nhưng agent API được dùng làm transport và failure detector.
- `visibility-and-herdr.md` ghi "Visibility adapters should consume canonical Run/RunResult state". Không adapter nào làm vậy (không có Run state để consume ngoài run.json kẹt "running").
- `herdr-scout` ghi nhận `pane rename` "không còn hỗ trợ" là **sai**: `herdr pane --help` 0.8.2 vẫn liệt kê `rename`; `/fgOS:terminal` dùng được. Không có drift ở đây.

---
```

## claim_af0aeda58062b271243762cf11fe2a46

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-16, lines 112–117.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-19.
Source digest: 9939caf4165d14623d18007574a4b0ec80a347bc1fd429c28ca4ef22f3186fa9
Target digest: 9939caf4165d14623d18007574a4b0ec80a347bc1fd429c28ca4ef22f3186fa9
Shown source SHA256: 9939caf4165d14623d18007574a4b0ec80a347bc1fd429c28ca4ef22f3186fa9
Shown target SHA256: 9939caf4165d14623d18007574a4b0ec80a347bc1fd429c28ca4ef22f3186fa9

### Proposed decision

```json
{
  "claimId": "claim_af0aeda58062b271243762cf11fe2a46",
  "sourceUnitDigest": "9939caf4165d14623d18007574a4b0ec80a347bc1fd429c28ca4ef22f3186fa9",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "9939caf4165d14623d18007574a4b0ec80a347bc1fd429c28ca4ef22f3186fa9",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "3. Evidence về herdr-spawn hiện tại và failure modes",
    "3.3 Drift giữa tài liệu và code"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-16 (lines 112–117) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-19 (lines 136–141); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- `dispatch-control-plane-redesign.md` §12.2 mô tả adapter dùng *temporary script + runner-owned sentinel sau khi command exit*. `tsk-by0` đã **xoá** đường đó; đường còn lại là `interactiveMode` gõ `/exit`. Prose lỗi thời.
- `docs/specs/runner.md` RUL40 (luật cứng, D d3dbe7f5): "KHÔNG BAO GIỜ gọi `herdr agent start` hay đọc `agent_status` làm tín hiệu quyết định". `herdrSpawnInteractiveAdapter` **đọc `agent_status` làm tín hiệu quyết định duy nhất** để gửi `/exit`. Code đang vi phạm luật; luật lại cấm đúng công cụ mà upstream chứng minh dùng được *nếu* hạ cấp nó thành failure detector. **Đã re-scope 2026-09-06** (decision "RUL40 re-scope", scope `runner`, supersedes d3dbe7f5 — xem §14 H1): herdr không bao giờ là truth/receipt, nhưng agent API được dùng làm transport và failure detector.
- `visibility-and-herdr.md` ghi "Visibility adapters should consume canonical Run/RunResult state". Không adapter nào làm vậy (không có Run state để consume ngoài run.json kẹt "running").
- `herdr-scout` ghi nhận `pane rename` "không còn hỗ trợ" là **sai**: `herdr pane --help` 0.8.2 vẫn liệt kê `rename`; `/fgOS:terminal` dùng được. Không có drift ở đây.

---
```

### Full target shown text

```text
- `dispatch-control-plane-redesign.md` §12.2 mô tả adapter dùng *temporary script + runner-owned sentinel sau khi command exit*. `tsk-by0` đã **xoá** đường đó; đường còn lại là `interactiveMode` gõ `/exit`. Prose lỗi thời.
- `docs/specs/runner.md` RUL40 (luật cứng, D d3dbe7f5): "KHÔNG BAO GIỜ gọi `herdr agent start` hay đọc `agent_status` làm tín hiệu quyết định". `herdrSpawnInteractiveAdapter` **đọc `agent_status` làm tín hiệu quyết định duy nhất** để gửi `/exit`. Code đang vi phạm luật; luật lại cấm đúng công cụ mà upstream chứng minh dùng được *nếu* hạ cấp nó thành failure detector. **Đã re-scope 2026-09-06** (decision "RUL40 re-scope", scope `runner`, supersedes d3dbe7f5 — xem §14 H1): herdr không bao giờ là truth/receipt, nhưng agent API được dùng làm transport và failure detector.
- `visibility-and-herdr.md` ghi "Visibility adapters should consume canonical Run/RunResult state". Không adapter nào làm vậy (không có Run state để consume ngoài run.json kẹt "running").
- `herdr-scout` ghi nhận `pane rename` "không còn hỗ trợ" là **sai**: `herdr pane --help` 0.8.2 vẫn liệt kê `rename`; `/fgOS:terminal` dùng được. Không có drift ở đây.

---
```

## claim_1b83e410be59c5885544dd4329aeb25c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#4-những-gì-đã-có-chỉ-là-prose-chưa-chứng-minh, lines 119–119.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#4-những-gì-đã-có-chỉ-là-prose-chưa-chứng-minh.
Source digest: 468102c93f84e7669b26527884099c4c604f3f7e2467c308510d35303fb9b5a1
Target digest: 468102c93f84e7669b26527884099c4c604f3f7e2467c308510d35303fb9b5a1
Shown source SHA256: d613cd9f1ad62286bebfb0afbcc1d2140e49253de7cbd6e37986067bd5ad98a7
Shown target SHA256: d613cd9f1ad62286bebfb0afbcc1d2140e49253de7cbd6e37986067bd5ad98a7

### Proposed decision

```json
{
  "claimId": "claim_1b83e410be59c5885544dd4329aeb25c",
  "sourceUnitDigest": "468102c93f84e7669b26527884099c4c604f3f7e2467c308510d35303fb9b5a1",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "4-những-gì-đã-có-chỉ-là-prose-chưa-chứng-minh",
  "targetUnitDigest": "468102c93f84e7669b26527884099c4c604f3f7e2467c308510d35303fb9b5a1",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#4-những-gì-đã-có-chỉ-là-prose-chưa-chứng-minh (lines 119–119) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#4-những-gì-đã-có-chỉ-là-prose-chưa-chứng-minh (lines 143–143); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 4. Những gì đã có / chỉ là prose / chưa chứng minh

**Native proven**
- Fresh pane mỗi dispatch, không reuse (`tsk-1nih` hard constraint) — giữ.
- Sentinel exit-code sau `/exit`, poll `agent` biến mất trước echo.
- Process-group kill + settle-immediately cho cli-spawn (không áp dụng cho agent trong pane herdr).
- Run dir + `evidence.json` (git before/after, changed files) + `agent-result.json` hash-bound — evidence collector tách khỏi màn hình.
- Live tee `.fgos/logs/<id>.log` cho cli-spawn.
- Mutation posture check tại dispatch (`resolveMutatingCwdPosture`, stamp không giả mạo được).

**Native observed but incomplete**
- `sawWorking` + 3-poll debounce (heuristic trên tín hiệu ngoài, load-sensitive; tác giả tự ghi "not proof of never").
- `run.json` status, cancelSession, closePane — có code, sai ngữ nghĩa.

**Prose only / unproven**
- "Herdr shows the Run" — chưa có Run ↔ pane mapping nào để show.
- Capability parity interactive/headless (ADR-010) — chưa có headless herdr.
- Reconnect/observer identity, resume, checkpoint, contact — không có dòng code nào.

**Unsafe (đã đo)**
- Prompt trong argv của `pane run` (F3). `idle`-là-ready (F1, F14). Interactive không confinement (F18).

**Upstream-proven, chưa có trong fgOS** (beegog v2.33.2 @ `thanhsmind/beegog` main 2026-09-05; snapshot local `upstreams/beehive` **stale từ 2026-07-23** — mọi trích dẫn dưới đây lấy từ upstream live, không từ snapshot)
- Brief đi bằng **file** + **pointer một dòng** qua `herdr agent prompt --wait` (herding-brief-file D1, herding-prompt-stall D1).
- Receipt = **file ack worker tự ghi**, không phải lifecycle transition (herding-prompt-stall D4). "any confirmation an actor can produce BY ITSELF … is not evidence the other side received anything."
- Ready gate = `idle` **hoặc** `done` (`done` là trạng thái nghỉ bình thường của pane `--no-focus` vì CLI read không "mark seen") (herding-prompt-stall D2).
- Signal ladder: result file › agent liveness (`pane process-info` foreground pid ≠ shell pid) › progress (log mtime / `working` / `activity.json`) › classification chỉ khi stale (herding-liveness-signals D1–D6); liveness read fail **open**, death phải **consecutive** (3 lần), `unknown` reset đếm.
- Hook activity: worker's own hook ghi `activity.json` `{state, event, at, job_id, round}` tmp-then-rename; đọc trước screen classifier; fence theo round + 120 s freshness (herding-activity-hook D1–D3).
- Pane lifecycle theo kết quả, không theo đồng hồ: result hợp lệ → đóng; timeout/died/blocked → **để mở làm forensics**; `paused_limit` không bao giờ đóng (herding-executor D6, limit-pause D1–D4).
- Split lock cross-process (`.bee/locks/herding-pane-split.lock`, pid+token, stale takeover) và floor 60 cột.
- Contact với session đang chạy = **intervention mailbox record đọc tại next turn boundary qua prompt hook**, không bao giờ inject giữa turn; frequency cap "cùng điểm hai lần = escalate, không lặp"; danger-class notify ngay, fail-open (c80debd7, supervisor-observer).
- `awaiting-human`: waiting mark được clear bởi `UserPromptSubmit` hook / agent / stale-heartbeat expiry (D2).
- Hang detection: **parked** — CPU và output counter đều fail vì spinner/event loop; cần calibration trace.
- Socket event stream **bị từ chối** làm nguồn quyết định (herding-liveness-signals D5): edge-triggered, im lặng không phân biệt được với `working`, không nói gì về result file; poll 200 ms level-triggered giữ lại.
- Job id `job-<epoch-millis>` không check trùng (latent); wave không xác nhận được "finish" vì tín hiệu duy nhất là pane attention — chính lý do file receipt là bắt buộc.
- Dissent/options/leaning đi **như data trên result file**, không phải lệnh; parse lenient.

Điều upstream **không** có: inbox/message bus mà agent phải "thường xuyên check". Không có polling từ phía agent. Hai kênh của họ là (1) job mailbox (file, một chiều mỗi round, ack/result) và (2) intervention mailbox (file, delivered bởi hook tại turn boundary). Từ khoá "inbox" duy nhất là `--inbox-session` pointer marker cho caller detached (pi-result-mailbox D6).

---
```

### Full target shown text

```text
## 4. Những gì đã có / chỉ là prose / chưa chứng minh

**Native proven**
- Fresh pane mỗi dispatch, không reuse (`tsk-1nih` hard constraint) — giữ.
- Sentinel exit-code sau `/exit`, poll `agent` biến mất trước echo.
- Process-group kill + settle-immediately cho cli-spawn (không áp dụng cho agent trong pane herdr).
- Run dir + `evidence.json` (git before/after, changed files) + `agent-result.json` hash-bound — evidence collector tách khỏi màn hình.
- Live tee `.fgos/logs/<id>.log` cho cli-spawn.
- Mutation posture check tại dispatch (`resolveMutatingCwdPosture`, stamp không giả mạo được).

**Native observed but incomplete**
- `sawWorking` + 3-poll debounce (heuristic trên tín hiệu ngoài, load-sensitive; tác giả tự ghi "not proof of never").
- `run.json` status, cancelSession, closePane — có code, sai ngữ nghĩa.

**Prose only / unproven**
- "Herdr shows the Run" — chưa có Run ↔ pane mapping nào để show.
- Capability parity interactive/headless (ADR-010) — chưa có headless herdr.
- Reconnect/observer identity, resume, checkpoint, contact — không có dòng code nào.

**Unsafe (đã đo)**
- Prompt trong argv của `pane run` (F3). `idle`-là-ready (F1, F14). Interactive không confinement (F18).

**Upstream-proven, chưa có trong fgOS** (beegog v2.33.2 @ `thanhsmind/beegog` main 2026-09-05; snapshot local `upstreams/beehive` **stale từ 2026-07-23** — mọi trích dẫn dưới đây lấy từ upstream live, không từ snapshot)
- Brief đi bằng **file** + **pointer một dòng** qua `herdr agent prompt --wait` (herding-brief-file D1, herding-prompt-stall D1).
- Receipt = **file ack worker tự ghi**, không phải lifecycle transition (herding-prompt-stall D4). "any confirmation an actor can produce BY ITSELF … is not evidence the other side received anything."
- Ready gate = `idle` **hoặc** `done` (`done` là trạng thái nghỉ bình thường của pane `--no-focus` vì CLI read không "mark seen") (herding-prompt-stall D2).
- Signal ladder: result file › agent liveness (`pane process-info` foreground pid ≠ shell pid) › progress (log mtime / `working` / `activity.json`) › classification chỉ khi stale (herding-liveness-signals D1–D6); liveness read fail **open**, death phải **consecutive** (3 lần), `unknown` reset đếm.
- Hook activity: worker's own hook ghi `activity.json` `{state, event, at, job_id, round}` tmp-then-rename; đọc trước screen classifier; fence theo round + 120 s freshness (herding-activity-hook D1–D3).
- Pane lifecycle theo kết quả, không theo đồng hồ: result hợp lệ → đóng; timeout/died/blocked → **để mở làm forensics**; `paused_limit` không bao giờ đóng (herding-executor D6, limit-pause D1–D4).
- Split lock cross-process (`.bee/locks/herding-pane-split.lock`, pid+token, stale takeover) và floor 60 cột.
- Contact với session đang chạy = **intervention mailbox record đọc tại next turn boundary qua prompt hook**, không bao giờ inject giữa turn; frequency cap "cùng điểm hai lần = escalate, không lặp"; danger-class notify ngay, fail-open (c80debd7, supervisor-observer).
- `awaiting-human`: waiting mark được clear bởi `UserPromptSubmit` hook / agent / stale-heartbeat expiry (D2).
- Hang detection: **parked** — CPU và output counter đều fail vì spinner/event loop; cần calibration trace.
- Socket event stream **bị từ chối** làm nguồn quyết định (herding-liveness-signals D5): edge-triggered, im lặng không phân biệt được với `working`, không nói gì về result file; poll 200 ms level-triggered giữ lại.
- Job id `job-<epoch-millis>` không check trùng (latent); wave không xác nhận được "finish" vì tín hiệu duy nhất là pane attention — chính lý do file receipt là bắt buộc.
- Dissent/options/leaning đi **như data trên result file**, không phải lệnh; parse lenient.

Điều upstream **không** có: inbox/message bus mà agent phải "thường xuyên check". Không có polling từ phía agent. Hai kênh của họ là (1) job mailbox (file, một chiều mỗi round, ack/result) và (2) intervention mailbox (file, delivered bởi hook tại turn boundary). Từ khoá "inbox" duy nhất là `--inbox-session` pointer marker cho caller detached (pi-result-mailbox D6).

---
```

## claim_ff1488245a4aed446dcffc8799537dc8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-17, lines 121–127.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-20.
Source digest: 144f474e1c646f887994f564e6a2dade141748031bcc40c50c7a36da78acf19d
Target digest: 144f474e1c646f887994f564e6a2dade141748031bcc40c50c7a36da78acf19d
Shown source SHA256: 144f474e1c646f887994f564e6a2dade141748031bcc40c50c7a36da78acf19d
Shown target SHA256: 144f474e1c646f887994f564e6a2dade141748031bcc40c50c7a36da78acf19d

### Proposed decision

```json
{
  "claimId": "claim_ff1488245a4aed446dcffc8799537dc8",
  "sourceUnitDigest": "144f474e1c646f887994f564e6a2dade141748031bcc40c50c7a36da78acf19d",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "144f474e1c646f887994f564e6a2dade141748031bcc40c50c7a36da78acf19d",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "4. Những gì đã có / chỉ là prose / chưa chứng minh"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-17 (lines 121–127) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-20 (lines 145–151); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Native proven**
- Fresh pane mỗi dispatch, không reuse (`tsk-1nih` hard constraint) — giữ.
- Sentinel exit-code sau `/exit`, poll `agent` biến mất trước echo.
- Process-group kill + settle-immediately cho cli-spawn (không áp dụng cho agent trong pane herdr).
- Run dir + `evidence.json` (git before/after, changed files) + `agent-result.json` hash-bound — evidence collector tách khỏi màn hình.
- Live tee `.fgos/logs/<id>.log` cho cli-spawn.
- Mutation posture check tại dispatch (`resolveMutatingCwdPosture`, stamp không giả mạo được).
```

### Full target shown text

```text
**Native proven**
- Fresh pane mỗi dispatch, không reuse (`tsk-1nih` hard constraint) — giữ.
- Sentinel exit-code sau `/exit`, poll `agent` biến mất trước echo.
- Process-group kill + settle-immediately cho cli-spawn (không áp dụng cho agent trong pane herdr).
- Run dir + `evidence.json` (git before/after, changed files) + `agent-result.json` hash-bound — evidence collector tách khỏi màn hình.
- Live tee `.fgos/logs/<id>.log` cho cli-spawn.
- Mutation posture check tại dispatch (`resolveMutatingCwdPosture`, stamp không giả mạo được).
```

## claim_4b610334499321363a29e71a667b443b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-18, lines 129–131.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-21.
Source digest: 1f1b3861a0e88119a51f0094f32d00764a313eea295766e0e0a8ece8a9495681
Target digest: 1f1b3861a0e88119a51f0094f32d00764a313eea295766e0e0a8ece8a9495681
Shown source SHA256: 1f1b3861a0e88119a51f0094f32d00764a313eea295766e0e0a8ece8a9495681
Shown target SHA256: 1f1b3861a0e88119a51f0094f32d00764a313eea295766e0e0a8ece8a9495681

### Proposed decision

```json
{
  "claimId": "claim_4b610334499321363a29e71a667b443b",
  "sourceUnitDigest": "1f1b3861a0e88119a51f0094f32d00764a313eea295766e0e0a8ece8a9495681",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "1f1b3861a0e88119a51f0094f32d00764a313eea295766e0e0a8ece8a9495681",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "4. Những gì đã có / chỉ là prose / chưa chứng minh"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-18 (lines 129–131) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-21 (lines 153–155); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Native observed but incomplete**
- `sawWorking` + 3-poll debounce (heuristic trên tín hiệu ngoài, load-sensitive; tác giả tự ghi "not proof of never").
- `run.json` status, cancelSession, closePane — có code, sai ngữ nghĩa.
```

### Full target shown text

```text
**Native observed but incomplete**
- `sawWorking` + 3-poll debounce (heuristic trên tín hiệu ngoài, load-sensitive; tác giả tự ghi "not proof of never").
- `run.json` status, cancelSession, closePane — có code, sai ngữ nghĩa.
```

## claim_6c10496716b2305e6eff74392e1ac40f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-19, lines 133–136.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-22.
Source digest: 90dfc466af8cb9743ddb3e2438afe092919972bbb441f78e7ea93554250d9e45
Target digest: 90dfc466af8cb9743ddb3e2438afe092919972bbb441f78e7ea93554250d9e45
Shown source SHA256: 90dfc466af8cb9743ddb3e2438afe092919972bbb441f78e7ea93554250d9e45
Shown target SHA256: 90dfc466af8cb9743ddb3e2438afe092919972bbb441f78e7ea93554250d9e45

### Proposed decision

```json
{
  "claimId": "claim_6c10496716b2305e6eff74392e1ac40f",
  "sourceUnitDigest": "90dfc466af8cb9743ddb3e2438afe092919972bbb441f78e7ea93554250d9e45",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "90dfc466af8cb9743ddb3e2438afe092919972bbb441f78e7ea93554250d9e45",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "4. Những gì đã có / chỉ là prose / chưa chứng minh"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-19 (lines 133–136) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-22 (lines 157–160); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Prose only / unproven**
- "Herdr shows the Run" — chưa có Run ↔ pane mapping nào để show.
- Capability parity interactive/headless (ADR-010) — chưa có headless herdr.
- Reconnect/observer identity, resume, checkpoint, contact — không có dòng code nào.
```

### Full target shown text

```text
**Prose only / unproven**
- "Herdr shows the Run" — chưa có Run ↔ pane mapping nào để show.
- Capability parity interactive/headless (ADR-010) — chưa có headless herdr.
- Reconnect/observer identity, resume, checkpoint, contact — không có dòng code nào.
```

## claim_6d2a28f9dc8ac1af95c2388dd4aad82c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-20, lines 138–139.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-23.
Source digest: 13d978f3b811bf13b60c88c64a61a0725861d2e85680cf73fdbb01a0ecc56e91
Target digest: 13d978f3b811bf13b60c88c64a61a0725861d2e85680cf73fdbb01a0ecc56e91
Shown source SHA256: 13d978f3b811bf13b60c88c64a61a0725861d2e85680cf73fdbb01a0ecc56e91
Shown target SHA256: 13d978f3b811bf13b60c88c64a61a0725861d2e85680cf73fdbb01a0ecc56e91

### Proposed decision

```json
{
  "claimId": "claim_6d2a28f9dc8ac1af95c2388dd4aad82c",
  "sourceUnitDigest": "13d978f3b811bf13b60c88c64a61a0725861d2e85680cf73fdbb01a0ecc56e91",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "13d978f3b811bf13b60c88c64a61a0725861d2e85680cf73fdbb01a0ecc56e91",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "4. Những gì đã có / chỉ là prose / chưa chứng minh"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-20 (lines 138–139) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-23 (lines 162–163); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Unsafe (đã đo)**
- Prompt trong argv của `pane run` (F3). `idle`-là-ready (F1, F14). Interactive không confinement (F18).
```

### Full target shown text

```text
**Unsafe (đã đo)**
- Prompt trong argv của `pane run` (F3). `idle`-là-ready (F1, F14). Interactive không confinement (F18).
```

## claim_9e90d20805e634efd07af117782d4b90

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-21, lines 141–154.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-24.
Source digest: 409b2c2f1506aaa10dba63568c85a2df14370f77befc22af99184c72fd728be2
Target digest: 409b2c2f1506aaa10dba63568c85a2df14370f77befc22af99184c72fd728be2
Shown source SHA256: 409b2c2f1506aaa10dba63568c85a2df14370f77befc22af99184c72fd728be2
Shown target SHA256: 409b2c2f1506aaa10dba63568c85a2df14370f77befc22af99184c72fd728be2

### Proposed decision

```json
{
  "claimId": "claim_9e90d20805e634efd07af117782d4b90",
  "sourceUnitDigest": "409b2c2f1506aaa10dba63568c85a2df14370f77befc22af99184c72fd728be2",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "409b2c2f1506aaa10dba63568c85a2df14370f77befc22af99184c72fd728be2",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "4. Những gì đã có / chỉ là prose / chưa chứng minh"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-21 (lines 141–154) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-24 (lines 165–178); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Upstream-proven, chưa có trong fgOS** (beegog v2.33.2 @ `thanhsmind/beegog` main 2026-09-05; snapshot local `upstreams/beehive` **stale từ 2026-07-23** — mọi trích dẫn dưới đây lấy từ upstream live, không từ snapshot)
- Brief đi bằng **file** + **pointer một dòng** qua `herdr agent prompt --wait` (herding-brief-file D1, herding-prompt-stall D1).
- Receipt = **file ack worker tự ghi**, không phải lifecycle transition (herding-prompt-stall D4). "any confirmation an actor can produce BY ITSELF … is not evidence the other side received anything."
- Ready gate = `idle` **hoặc** `done` (`done` là trạng thái nghỉ bình thường của pane `--no-focus` vì CLI read không "mark seen") (herding-prompt-stall D2).
- Signal ladder: result file › agent liveness (`pane process-info` foreground pid ≠ shell pid) › progress (log mtime / `working` / `activity.json`) › classification chỉ khi stale (herding-liveness-signals D1–D6); liveness read fail **open**, death phải **consecutive** (3 lần), `unknown` reset đếm.
- Hook activity: worker's own hook ghi `activity.json` `{state, event, at, job_id, round}` tmp-then-rename; đọc trước screen classifier; fence theo round + 120 s freshness (herding-activity-hook D1–D3).
- Pane lifecycle theo kết quả, không theo đồng hồ: result hợp lệ → đóng; timeout/died/blocked → **để mở làm forensics**; `paused_limit` không bao giờ đóng (herding-executor D6, limit-pause D1–D4).
- Split lock cross-process (`.bee/locks/herding-pane-split.lock`, pid+token, stale takeover) và floor 60 cột.
- Contact với session đang chạy = **intervention mailbox record đọc tại next turn boundary qua prompt hook**, không bao giờ inject giữa turn; frequency cap "cùng điểm hai lần = escalate, không lặp"; danger-class notify ngay, fail-open (c80debd7, supervisor-observer).
- `awaiting-human`: waiting mark được clear bởi `UserPromptSubmit` hook / agent / stale-heartbeat expiry (D2).
- Hang detection: **parked** — CPU và output counter đều fail vì spinner/event loop; cần calibration trace.
- Socket event stream **bị từ chối** làm nguồn quyết định (herding-liveness-signals D5): edge-triggered, im lặng không phân biệt được với `working`, không nói gì về result file; poll 200 ms level-triggered giữ lại.
- Job id `job-<epoch-millis>` không check trùng (latent); wave không xác nhận được "finish" vì tín hiệu duy nhất là pane attention — chính lý do file receipt là bắt buộc.
- Dissent/options/leaning đi **như data trên result file**, không phải lệnh; parse lenient.
```

### Full target shown text

```text
**Upstream-proven, chưa có trong fgOS** (beegog v2.33.2 @ `thanhsmind/beegog` main 2026-09-05; snapshot local `upstreams/beehive` **stale từ 2026-07-23** — mọi trích dẫn dưới đây lấy từ upstream live, không từ snapshot)
- Brief đi bằng **file** + **pointer một dòng** qua `herdr agent prompt --wait` (herding-brief-file D1, herding-prompt-stall D1).
- Receipt = **file ack worker tự ghi**, không phải lifecycle transition (herding-prompt-stall D4). "any confirmation an actor can produce BY ITSELF … is not evidence the other side received anything."
- Ready gate = `idle` **hoặc** `done` (`done` là trạng thái nghỉ bình thường của pane `--no-focus` vì CLI read không "mark seen") (herding-prompt-stall D2).
- Signal ladder: result file › agent liveness (`pane process-info` foreground pid ≠ shell pid) › progress (log mtime / `working` / `activity.json`) › classification chỉ khi stale (herding-liveness-signals D1–D6); liveness read fail **open**, death phải **consecutive** (3 lần), `unknown` reset đếm.
- Hook activity: worker's own hook ghi `activity.json` `{state, event, at, job_id, round}` tmp-then-rename; đọc trước screen classifier; fence theo round + 120 s freshness (herding-activity-hook D1–D3).
- Pane lifecycle theo kết quả, không theo đồng hồ: result hợp lệ → đóng; timeout/died/blocked → **để mở làm forensics**; `paused_limit` không bao giờ đóng (herding-executor D6, limit-pause D1–D4).
- Split lock cross-process (`.bee/locks/herding-pane-split.lock`, pid+token, stale takeover) và floor 60 cột.
- Contact với session đang chạy = **intervention mailbox record đọc tại next turn boundary qua prompt hook**, không bao giờ inject giữa turn; frequency cap "cùng điểm hai lần = escalate, không lặp"; danger-class notify ngay, fail-open (c80debd7, supervisor-observer).
- `awaiting-human`: waiting mark được clear bởi `UserPromptSubmit` hook / agent / stale-heartbeat expiry (D2).
- Hang detection: **parked** — CPU và output counter đều fail vì spinner/event loop; cần calibration trace.
- Socket event stream **bị từ chối** làm nguồn quyết định (herding-liveness-signals D5): edge-triggered, im lặng không phân biệt được với `working`, không nói gì về result file; poll 200 ms level-triggered giữ lại.
- Job id `job-<epoch-millis>` không check trùng (latent); wave không xác nhận được "finish" vì tín hiệu duy nhất là pane attention — chính lý do file receipt là bắt buộc.
- Dissent/options/leaning đi **như data trên result file**, không phải lệnh; parse lenient.
```

## claim_e64748d80fb20731418ef7ccc29f92a0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-22, lines 156–158.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-25.
Source digest: a07620fd63d777ae88667f20a10ea87494ca6bf2eeb28bdb73757393f9471c32
Target digest: a07620fd63d777ae88667f20a10ea87494ca6bf2eeb28bdb73757393f9471c32
Shown source SHA256: a07620fd63d777ae88667f20a10ea87494ca6bf2eeb28bdb73757393f9471c32
Shown target SHA256: a07620fd63d777ae88667f20a10ea87494ca6bf2eeb28bdb73757393f9471c32

### Proposed decision

```json
{
  "claimId": "claim_e64748d80fb20731418ef7ccc29f92a0",
  "sourceUnitDigest": "a07620fd63d777ae88667f20a10ea87494ca6bf2eeb28bdb73757393f9471c32",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "a07620fd63d777ae88667f20a10ea87494ca6bf2eeb28bdb73757393f9471c32",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "4. Những gì đã có / chỉ là prose / chưa chứng minh"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-22 (lines 156–158) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-25 (lines 180–182); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Điều upstream **không** có: inbox/message bus mà agent phải "thường xuyên check". Không có polling từ phía agent. Hai kênh của họ là (1) job mailbox (file, một chiều mỗi round, ack/result) và (2) intervention mailbox (file, delivered bởi hook tại turn boundary). Từ khoá "inbox" duy nhất là `--inbox-session` pointer marker cho caller detached (pi-result-mailbox D6).

---
```

### Full target shown text

```text
Điều upstream **không** có: inbox/message bus mà agent phải "thường xuyên check". Không có polling từ phía agent. Hai kênh của họ là (1) job mailbox (file, một chiều mỗi round, ack/result) và (2) intervention mailbox (file, delivered bởi hook tại turn boundary). Từ khoá "inbox" duy nhất là `--inbox-session` pointer marker cho caller detached (pi-result-mailbox D6).

---
```

## claim_11c766baa23cd6b8e0847aafe3ab2bba

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#5-hard-soft-boundary-cho-visibility-và-contact, lines 160–160.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#5-hard-soft-boundary-cho-visibility-và-contact.
Source digest: c4d7fd8426ff8d5d39162a47a1a4471445068159e0e10cc3b3fd12506166a8d0
Target digest: c4d7fd8426ff8d5d39162a47a1a4471445068159e0e10cc3b3fd12506166a8d0
Shown source SHA256: 3b8fe5a7dd7c1dfbea67076e2a085e9f3c3ac4ec24db612defef74d67730b208
Shown target SHA256: 3b8fe5a7dd7c1dfbea67076e2a085e9f3c3ac4ec24db612defef74d67730b208

### Proposed decision

```json
{
  "claimId": "claim_11c766baa23cd6b8e0847aafe3ab2bba",
  "sourceUnitDigest": "c4d7fd8426ff8d5d39162a47a1a4471445068159e0e10cc3b3fd12506166a8d0",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "5-hard-soft-boundary-cho-visibility-và-contact",
  "targetUnitDigest": "c4d7fd8426ff8d5d39162a47a1a4471445068159e0e10cc3b3fd12506166a8d0",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#5-hard-soft-boundary-cho-visibility-và-contact (lines 160–160) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#5-hard-soft-boundary-cho-visibility-và-contact (lines 184–184); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 5. Hard / soft boundary cho visibility và contact

**Hard (contract, runtime kiểm)**

| Boundary | Quy tắc |
|---|---|
| Lifecycle truth | Run state chỉ đổi qua Dispatch (`run.json`/event). Pane, pid, agent_session, observer là *binding* trong `VisibilitySession`, mất được, rebind được. |
| Evidence | Chỉ collector đọc từ outbox/run dir + git snapshot. Scrollback, `agent_status`, `agent prompt` reply, human's eyes **không** là evidence. |
| Contact là action có cấu trúc | `{runId, channel, kind, seq, idempotencyKey, payloadRef, authorization}`; ghi event trước khi transport; ack là event thứ hai. Không action nào của contact mở rộng grant, đổi provider/model, tạo specialist, xác nhận human decision. |
| Capability refusal | Mechanism không hỗ trợ capability → `refused:{capability, reason}` có type; không fallback im lặng sang gõ text. |
| Interrupt là effect | Cần grant riêng; đi qua Dispatch; reconcile outcome thành `cancelled | unknown | completed-before-cancel`. |
| Observer ≠ actor | N observer read-only; đúng 1 actor (Dispatch process giữ lease). Observer reconnect không tạo contact. |
| Binding lifecycle | Gateway/observer mất ≠ worker chết. Worker chết chỉ kết luận từ liveness ladder (process/pane/receipt), sau N đọc liên tiếp, không phải từ một kết nối rớt. |

**Soft (doctrine, prose, adapter tự do)**

- Cách adapter phát hiện ready (agent API, screen classifier, hook) — miễn không đưa lên làm truth.
- Layout pane, focus, label, cockpit — chrome.
- Nội dung human contact (hỏi gì, bằng ngôn ngữ nào).
- Provider-specific startup (trust store pre-seed, `--new-project`, `--mode`).

**Ranh giới contact (trả lời câu hỏi §4 của brief)**

- Ai được contact worker: human tại cockpit (channel `human`), coordinator giữ epoch của session (channel `coordinator`), Dispatch tự thân (channel `system`: readiness pointer, exit, cancel).
- Contact **là** Dispatch action (một verb `fgos dispatch contact`/port `contactRun`), Run-scoped grant, audit event.
- Contact chỉ truyền thông tin/yêu cầu; **không** đổi task/authority. Muốn đổi task → Assignment mới qua Coordination door.
- Worker reply **không** là evidence; nó là "claim" đi vào outbox như mọi claim khác, collector ghi nhận, coordinator diễn giải.
- Worker không thể tự cấp quyền qua contact: transport (herdr) không có authz; runtime mới có; mọi thứ worker gõ ngược lại là data.

---
```

### Full target shown text

```text
## 5. Hard / soft boundary cho visibility và contact

**Hard (contract, runtime kiểm)**

| Boundary | Quy tắc |
|---|---|
| Lifecycle truth | Run state chỉ đổi qua Dispatch (`run.json`/event). Pane, pid, agent_session, observer là *binding* trong `VisibilitySession`, mất được, rebind được. |
| Evidence | Chỉ collector đọc từ outbox/run dir + git snapshot. Scrollback, `agent_status`, `agent prompt` reply, human's eyes **không** là evidence. |
| Contact là action có cấu trúc | `{runId, channel, kind, seq, idempotencyKey, payloadRef, authorization}`; ghi event trước khi transport; ack là event thứ hai. Không action nào của contact mở rộng grant, đổi provider/model, tạo specialist, xác nhận human decision. |
| Capability refusal | Mechanism không hỗ trợ capability → `refused:{capability, reason}` có type; không fallback im lặng sang gõ text. |
| Interrupt là effect | Cần grant riêng; đi qua Dispatch; reconcile outcome thành `cancelled | unknown | completed-before-cancel`. |
| Observer ≠ actor | N observer read-only; đúng 1 actor (Dispatch process giữ lease). Observer reconnect không tạo contact. |
| Binding lifecycle | Gateway/observer mất ≠ worker chết. Worker chết chỉ kết luận từ liveness ladder (process/pane/receipt), sau N đọc liên tiếp, không phải từ một kết nối rớt. |

**Soft (doctrine, prose, adapter tự do)**

- Cách adapter phát hiện ready (agent API, screen classifier, hook) — miễn không đưa lên làm truth.
- Layout pane, focus, label, cockpit — chrome.
- Nội dung human contact (hỏi gì, bằng ngôn ngữ nào).
- Provider-specific startup (trust store pre-seed, `--new-project`, `--mode`).

**Ranh giới contact (trả lời câu hỏi §4 của brief)**

- Ai được contact worker: human tại cockpit (channel `human`), coordinator giữ epoch của session (channel `coordinator`), Dispatch tự thân (channel `system`: readiness pointer, exit, cancel).
- Contact **là** Dispatch action (một verb `fgos dispatch contact`/port `contactRun`), Run-scoped grant, audit event.
- Contact chỉ truyền thông tin/yêu cầu; **không** đổi task/authority. Muốn đổi task → Assignment mới qua Coordination door.
- Worker reply **không** là evidence; nó là "claim" đi vào outbox như mọi claim khác, collector ghi nhận, coordinator diễn giải.
- Worker không thể tự cấp quyền qua contact: transport (herdr) không có authz; runtime mới có; mọi thứ worker gõ ngược lại là data.

---
```

## claim_e1289d8772f20c7d889d919e401efc55

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-23, lines 162–162.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-26.
Source digest: fc9e99e9e185deb4186add6db521f4a37149ea407821b8b6bc16ccbc092b0e53
Target digest: fc9e99e9e185deb4186add6db521f4a37149ea407821b8b6bc16ccbc092b0e53
Shown source SHA256: fc9e99e9e185deb4186add6db521f4a37149ea407821b8b6bc16ccbc092b0e53
Shown target SHA256: fc9e99e9e185deb4186add6db521f4a37149ea407821b8b6bc16ccbc092b0e53

### Proposed decision

```json
{
  "claimId": "claim_e1289d8772f20c7d889d919e401efc55",
  "sourceUnitDigest": "fc9e99e9e185deb4186add6db521f4a37149ea407821b8b6bc16ccbc092b0e53",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "fc9e99e9e185deb4186add6db521f4a37149ea407821b8b6bc16ccbc092b0e53",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "5. Hard / soft boundary cho visibility và contact"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-23 (lines 162–162) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-26 (lines 186–186); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Hard (contract, runtime kiểm)**
```

### Full target shown text

```text
**Hard (contract, runtime kiểm)**
```

## claim_9455141ce16a7a1324640919872b7c3a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-24, lines 164–172.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-27.
Source digest: 9617da1899850b6893b7d88666595de25f92c1cd6ef7db495644c7fe2b0956d6
Target digest: 9617da1899850b6893b7d88666595de25f92c1cd6ef7db495644c7fe2b0956d6
Shown source SHA256: 9617da1899850b6893b7d88666595de25f92c1cd6ef7db495644c7fe2b0956d6
Shown target SHA256: 9617da1899850b6893b7d88666595de25f92c1cd6ef7db495644c7fe2b0956d6

### Proposed decision

```json
{
  "claimId": "claim_9455141ce16a7a1324640919872b7c3a",
  "sourceUnitDigest": "9617da1899850b6893b7d88666595de25f92c1cd6ef7db495644c7fe2b0956d6",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "9617da1899850b6893b7d88666595de25f92c1cd6ef7db495644c7fe2b0956d6",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "5. Hard / soft boundary cho visibility và contact"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-24 (lines 164–172) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-27 (lines 188–196); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Boundary | Quy tắc |
|---|---|
| Lifecycle truth | Run state chỉ đổi qua Dispatch (`run.json`/event). Pane, pid, agent_session, observer là *binding* trong `VisibilitySession`, mất được, rebind được. |
| Evidence | Chỉ collector đọc từ outbox/run dir + git snapshot. Scrollback, `agent_status`, `agent prompt` reply, human's eyes **không** là evidence. |
| Contact là action có cấu trúc | `{runId, channel, kind, seq, idempotencyKey, payloadRef, authorization}`; ghi event trước khi transport; ack là event thứ hai. Không action nào của contact mở rộng grant, đổi provider/model, tạo specialist, xác nhận human decision. |
| Capability refusal | Mechanism không hỗ trợ capability → `refused:{capability, reason}` có type; không fallback im lặng sang gõ text. |
| Interrupt là effect | Cần grant riêng; đi qua Dispatch; reconcile outcome thành `cancelled | unknown | completed-before-cancel`. |
| Observer ≠ actor | N observer read-only; đúng 1 actor (Dispatch process giữ lease). Observer reconnect không tạo contact. |
| Binding lifecycle | Gateway/observer mất ≠ worker chết. Worker chết chỉ kết luận từ liveness ladder (process/pane/receipt), sau N đọc liên tiếp, không phải từ một kết nối rớt. |
```

### Full target shown text

```text
| Boundary | Quy tắc |
|---|---|
| Lifecycle truth | Run state chỉ đổi qua Dispatch (`run.json`/event). Pane, pid, agent_session, observer là *binding* trong `VisibilitySession`, mất được, rebind được. |
| Evidence | Chỉ collector đọc từ outbox/run dir + git snapshot. Scrollback, `agent_status`, `agent prompt` reply, human's eyes **không** là evidence. |
| Contact là action có cấu trúc | `{runId, channel, kind, seq, idempotencyKey, payloadRef, authorization}`; ghi event trước khi transport; ack là event thứ hai. Không action nào của contact mở rộng grant, đổi provider/model, tạo specialist, xác nhận human decision. |
| Capability refusal | Mechanism không hỗ trợ capability → `refused:{capability, reason}` có type; không fallback im lặng sang gõ text. |
| Interrupt là effect | Cần grant riêng; đi qua Dispatch; reconcile outcome thành `cancelled | unknown | completed-before-cancel`. |
| Observer ≠ actor | N observer read-only; đúng 1 actor (Dispatch process giữ lease). Observer reconnect không tạo contact. |
| Binding lifecycle | Gateway/observer mất ≠ worker chết. Worker chết chỉ kết luận từ liveness ladder (process/pane/receipt), sau N đọc liên tiếp, không phải từ một kết nối rớt. |
```

## claim_71aac81e6206ec22d9358b7d153ec23f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-25, lines 174–174.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-28.
Source digest: 793c89679f6bee339c454d491e888daf7038359e628b540c1517a39f5d6afcb4
Target digest: 793c89679f6bee339c454d491e888daf7038359e628b540c1517a39f5d6afcb4
Shown source SHA256: 793c89679f6bee339c454d491e888daf7038359e628b540c1517a39f5d6afcb4
Shown target SHA256: 793c89679f6bee339c454d491e888daf7038359e628b540c1517a39f5d6afcb4

### Proposed decision

```json
{
  "claimId": "claim_71aac81e6206ec22d9358b7d153ec23f",
  "sourceUnitDigest": "793c89679f6bee339c454d491e888daf7038359e628b540c1517a39f5d6afcb4",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "793c89679f6bee339c454d491e888daf7038359e628b540c1517a39f5d6afcb4",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "5. Hard / soft boundary cho visibility và contact"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-25 (lines 174–174) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-28 (lines 198–198); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Soft (doctrine, prose, adapter tự do)**
```

### Full target shown text

```text
**Soft (doctrine, prose, adapter tự do)**
```

## claim_9fc2d09cf593f63e6dda1674d0999eb4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-26, lines 176–179.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-29.
Source digest: 35023e9e80458b1e04777caf721dcf18ea47f323fda393ce8cf9a9f13001ba3a
Target digest: 35023e9e80458b1e04777caf721dcf18ea47f323fda393ce8cf9a9f13001ba3a
Shown source SHA256: 35023e9e80458b1e04777caf721dcf18ea47f323fda393ce8cf9a9f13001ba3a
Shown target SHA256: 35023e9e80458b1e04777caf721dcf18ea47f323fda393ce8cf9a9f13001ba3a

### Proposed decision

```json
{
  "claimId": "claim_9fc2d09cf593f63e6dda1674d0999eb4",
  "sourceUnitDigest": "35023e9e80458b1e04777caf721dcf18ea47f323fda393ce8cf9a9f13001ba3a",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "35023e9e80458b1e04777caf721dcf18ea47f323fda393ce8cf9a9f13001ba3a",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "5. Hard / soft boundary cho visibility và contact"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-26 (lines 176–179) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-29 (lines 200–203); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Cách adapter phát hiện ready (agent API, screen classifier, hook) — miễn không đưa lên làm truth.
- Layout pane, focus, label, cockpit — chrome.
- Nội dung human contact (hỏi gì, bằng ngôn ngữ nào).
- Provider-specific startup (trust store pre-seed, `--new-project`, `--mode`).
```

### Full target shown text

```text
- Cách adapter phát hiện ready (agent API, screen classifier, hook) — miễn không đưa lên làm truth.
- Layout pane, focus, label, cockpit — chrome.
- Nội dung human contact (hỏi gì, bằng ngôn ngữ nào).
- Provider-specific startup (trust store pre-seed, `--new-project`, `--mode`).
```

## claim_c898a95904d22f04ec9c9b19b6685e3a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-27, lines 181–181.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-30.
Source digest: 675b167eead3e21c3f555ef1dc8d309830bf296106f539c9d664e04447e5d770
Target digest: 675b167eead3e21c3f555ef1dc8d309830bf296106f539c9d664e04447e5d770
Shown source SHA256: 675b167eead3e21c3f555ef1dc8d309830bf296106f539c9d664e04447e5d770
Shown target SHA256: 675b167eead3e21c3f555ef1dc8d309830bf296106f539c9d664e04447e5d770

### Proposed decision

```json
{
  "claimId": "claim_c898a95904d22f04ec9c9b19b6685e3a",
  "sourceUnitDigest": "675b167eead3e21c3f555ef1dc8d309830bf296106f539c9d664e04447e5d770",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "675b167eead3e21c3f555ef1dc8d309830bf296106f539c9d664e04447e5d770",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "5. Hard / soft boundary cho visibility và contact"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-27 (lines 181–181) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-30 (lines 205–205); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**Ranh giới contact (trả lời câu hỏi §4 của brief)**
```

### Full target shown text

```text
**Ranh giới contact (trả lời câu hỏi §4 của brief)**
```

## claim_5075a010993351f470ffc12e3814d4c6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-28, lines 183–189.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-31.
Source digest: 063e2a9ca976d3ffbf9a1ecbd33a9322f8cd50a5678c83a88a48cf812bdf308f
Target digest: 063e2a9ca976d3ffbf9a1ecbd33a9322f8cd50a5678c83a88a48cf812bdf308f
Shown source SHA256: 063e2a9ca976d3ffbf9a1ecbd33a9322f8cd50a5678c83a88a48cf812bdf308f
Shown target SHA256: 063e2a9ca976d3ffbf9a1ecbd33a9322f8cd50a5678c83a88a48cf812bdf308f

### Proposed decision

```json
{
  "claimId": "claim_5075a010993351f470ffc12e3814d4c6",
  "sourceUnitDigest": "063e2a9ca976d3ffbf9a1ecbd33a9322f8cd50a5678c83a88a48cf812bdf308f",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "063e2a9ca976d3ffbf9a1ecbd33a9322f8cd50a5678c83a88a48cf812bdf308f",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "5. Hard / soft boundary cho visibility và contact"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-28 (lines 183–189) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-31 (lines 207–213); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Ai được contact worker: human tại cockpit (channel `human`), coordinator giữ epoch của session (channel `coordinator`), Dispatch tự thân (channel `system`: readiness pointer, exit, cancel).
- Contact **là** Dispatch action (một verb `fgos dispatch contact`/port `contactRun`), Run-scoped grant, audit event.
- Contact chỉ truyền thông tin/yêu cầu; **không** đổi task/authority. Muốn đổi task → Assignment mới qua Coordination door.
- Worker reply **không** là evidence; nó là "claim" đi vào outbox như mọi claim khác, collector ghi nhận, coordinator diễn giải.
- Worker không thể tự cấp quyền qua contact: transport (herdr) không có authz; runtime mới có; mọi thứ worker gõ ngược lại là data.

---
```

### Full target shown text

```text
- Ai được contact worker: human tại cockpit (channel `human`), coordinator giữ epoch của session (channel `coordinator`), Dispatch tự thân (channel `system`: readiness pointer, exit, cancel).
- Contact **là** Dispatch action (một verb `fgos dispatch contact`/port `contactRun`), Run-scoped grant, audit event.
- Contact chỉ truyền thông tin/yêu cầu; **không** đổi task/authority. Muốn đổi task → Assignment mới qua Coordination door.
- Worker reply **không** là evidence; nó là "claim" đi vào outbox như mọi claim khác, collector ghi nhận, coordinator diễn giải.
- Worker không thể tự cấp quyền qua contact: transport (herdr) không có authz; runtime mới có; mọi thứ worker gõ ngược lại là data.

---
```

## claim_d3d8be0df78354009e76700e24e5d084

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#6-ba-1-architecture-families, lines 191–191.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#6-ba-1-architecture-families.
Source digest: 55d17df84d266a3d4f0d4e18f80ed1265e3ba5d361878eb88997188a9531ee8b
Target digest: 55d17df84d266a3d4f0d4e18f80ed1265e3ba5d361878eb88997188a9531ee8b
Shown source SHA256: 6510133fb5a6bc3479d71c8874b4fae2c8efb3a4a7aa0d5d65fbbbf6370a3a7e
Shown target SHA256: 6510133fb5a6bc3479d71c8874b4fae2c8efb3a4a7aa0d5d65fbbbf6370a3a7e

### Proposed decision

```json
{
  "claimId": "claim_d3d8be0df78354009e76700e24e5d084",
  "sourceUnitDigest": "55d17df84d266a3d4f0d4e18f80ed1265e3ba5d361878eb88997188a9531ee8b",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "6-ba-1-architecture-families",
  "targetUnitDigest": "55d17df84d266a3d4f0d4e18f80ed1265e3ba5d361878eb88997188a9531ee8b",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#6-ba-1-architecture-families (lines 191–191) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#6-ba-1-architecture-families (lines 215–215); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 6. Ba (+1) architecture families
```

### Full target shown text

```text
## 6. Ba (+1) architecture families
```

## claim_8c4b9c9623ae61b18b200be5c4efbfdd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-a-pane-as-process-hiện-tại, lines 193–193.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-a-pane-as-process-hiện-tại.
Source digest: e4b1c38ad751c7e10c5efaea4d80b3915849180bee42d9088028dd294e27ac91
Target digest: e4b1c38ad751c7e10c5efaea4d80b3915849180bee42d9088028dd294e27ac91
Shown source SHA256: 9055c0eddc1630dd773511c06d087041637edd317116dedb142b685f6fadf823
Shown target SHA256: 9055c0eddc1630dd773511c06d087041637edd317116dedb142b685f6fadf823

### Proposed decision

```json
{
  "claimId": "claim_8c4b9c9623ae61b18b200be5c4efbfdd",
  "sourceUnitDigest": "e4b1c38ad751c7e10c5efaea4d80b3915849180bee42d9088028dd294e27ac91",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "family-a-pane-as-process-hiện-tại",
  "targetUnitDigest": "e4b1c38ad751c7e10c5efaea4d80b3915849180bee42d9088028dd294e27ac91",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "6. Ba (+1) architecture families"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-a-pane-as-process-hiện-tại (lines 193–193) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-a-pane-as-process-hiện-tại (lines 217–217); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Family A — Pane-as-process (hiện tại)
Herdr pane là process/session owner; adapter quan sát `agent_status`; contact qua gõ text; Run giữ truth *sau khi* pane trả kết quả.
- Readiness: heuristic (sawWorking). Contact: gõ vào pty. Output: scrollback. Evidence: git delta + sentinel. Restart: mất (không persist). Crash: unknown, pane bị đóng. Process-group: không sở hữu. Provider: chỉ agy đã thử. Ergonomics: người xem được nhưng không can thiệp được. Coordinator: không. Cost: đã trả. Rigid-harness risk: thấp nhưng **không ổn định được về nguyên lý** — mọi tín hiệu đều do chính actor tự sinh (echo, boot flap).
```

### Full target shown text

```text
### Family A — Pane-as-process (hiện tại)
Herdr pane là process/session owner; adapter quan sát `agent_status`; contact qua gõ text; Run giữ truth *sau khi* pane trả kết quả.
- Readiness: heuristic (sawWorking). Contact: gõ vào pty. Output: scrollback. Evidence: git delta + sentinel. Restart: mất (không persist). Crash: unknown, pane bị đóng. Process-group: không sở hữu. Provider: chỉ agy đã thử. Ergonomics: người xem được nhưng không can thiệp được. Coordinator: không. Cost: đã trả. Rigid-harness risk: thấp nhưng **không ổn định được về nguyên lý** — mọi tín hiệu đều do chính actor tự sinh (echo, boot flap).
```

## claim_48320810220bb3e8ee73ac2a40da906d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-29, lines 194–195.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-32.
Source digest: b5f41d35b563c04064742319d7cacd5f575a5fc941834f7e8228319dcc0d1dba
Target digest: b5f41d35b563c04064742319d7cacd5f575a5fc941834f7e8228319dcc0d1dba
Shown source SHA256: b5f41d35b563c04064742319d7cacd5f575a5fc941834f7e8228319dcc0d1dba
Shown target SHA256: b5f41d35b563c04064742319d7cacd5f575a5fc941834f7e8228319dcc0d1dba

### Proposed decision

```json
{
  "claimId": "claim_48320810220bb3e8ee73ac2a40da906d",
  "sourceUnitDigest": "b5f41d35b563c04064742319d7cacd5f575a5fc941834f7e8228319dcc0d1dba",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "b5f41d35b563c04064742319d7cacd5f575a5fc941834f7e8228319dcc0d1dba",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "6. Ba (+1) architecture families",
    "Family A — Pane-as-process (hiện tại)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-29 (lines 194–195) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-32 (lines 218–219); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Herdr pane là process/session owner; adapter quan sát `agent_status`; contact qua gõ text; Run giữ truth *sau khi* pane trả kết quả.
- Readiness: heuristic (sawWorking). Contact: gõ vào pty. Output: scrollback. Evidence: git delta + sentinel. Restart: mất (không persist). Crash: unknown, pane bị đóng. Process-group: không sở hữu. Provider: chỉ agy đã thử. Ergonomics: người xem được nhưng không can thiệp được. Coordinator: không. Cost: đã trả. Rigid-harness risk: thấp nhưng **không ổn định được về nguyên lý** — mọi tín hiệu đều do chính actor tự sinh (echo, boot flap).
```

### Full target shown text

```text
Herdr pane là process/session owner; adapter quan sát `agent_status`; contact qua gõ text; Run giữ truth *sau khi* pane trả kết quả.
- Readiness: heuristic (sawWorking). Contact: gõ vào pty. Output: scrollback. Evidence: git delta + sentinel. Restart: mất (không persist). Crash: unknown, pane bị đóng. Process-group: không sở hữu. Provider: chỉ agy đã thử. Ergonomics: người xem được nhưng không can thiệp được. Coordinator: không. Cost: đã trả. Rigid-harness risk: thấp nhưng **không ổn định được về nguyên lý** — mọi tín hiệu đều do chính actor tự sinh (echo, boot flap).
```

## claim_3ab601d61757e1bac72d752c9c04a6d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-b-dispatch-owned-interactive-session-file-receipt-contract-đề-xuất, lines 197–197.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-b-dispatch-owned-interactive-session-file-receipt-contract-đề-xuất.
Source digest: c3c3a39e0238ed82d751aa5dc7fc7b730bbd51b7d8d8bc9d0b367cec961ee36c
Target digest: c3c3a39e0238ed82d751aa5dc7fc7b730bbd51b7d8d8bc9d0b367cec961ee36c
Shown source SHA256: 8266cce908765bda8737796b46171de3b25e1504a9c97d9a1199bbc7e9529f09
Shown target SHA256: 8266cce908765bda8737796b46171de3b25e1504a9c97d9a1199bbc7e9529f09

### Proposed decision

```json
{
  "claimId": "claim_3ab601d61757e1bac72d752c9c04a6d9",
  "sourceUnitDigest": "c3c3a39e0238ed82d751aa5dc7fc7b730bbd51b7d8d8bc9d0b367cec961ee36c",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "family-b-dispatch-owned-interactive-session-file-receipt-contract-đề-xuất",
  "targetUnitDigest": "c3c3a39e0238ed82d751aa5dc7fc7b730bbd51b7d8d8bc9d0b367cec961ee36c",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "6. Ba (+1) architecture families"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-b-dispatch-owned-interactive-session-file-receipt-contract-đề-xuất (lines 197–197) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-b-dispatch-owned-interactive-session-file-receipt-contract-đề-xuất (lines 221–221); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Family B — Dispatch-owned interactive session + file-receipt contract (đề xuất)
Dispatch tạo `VisibilitySession` (Run-scoped) trước khi split pane; brief đi bằng **file** trong run dir; pointer một dòng qua `herdr agent prompt --wait`; worker ghi `ack`/`result`/`report` vào **outbox** (tmp-then-rename); poll theo ladder (result › liveness › progress › classify); herdr chỉ là transport + failure detector; gateway reconnect = reattach observer.
- Readiness: `agent start` trả về khi ready (herdr hứa 30 s, `agent_not_ready`) + gate `idle|done` + receipt = ack file. Contact: `contact` action → event → pointer chỉ khi `idle|done` (system channel) hoặc turn-boundary hook (nếu provider có hook). Output: live `agent read` cho observer + outbox cho evidence. Evidence: outbox + git. Restart: `VisibilitySession` persist paneId/agent_session/terminal_id → rebind bằng `agent list`. Crash: reconcile qua liveness ladder, Run → `unknown|failed|reconnectable`. Process-group: vẫn không sở hữu pid — chấp nhận, bù bằng `pane process-info` + `pane close` + `agent send-keys ctrl+c`. Provider: bất kỳ CLI nào đọc được file (đã đo với agy/claude ở upstream). Ergonomics: người thấy pane, thấy cùng file. Coordinator: contact qua cùng door. Cost: trung bình (adapter viết lại ~1 file + VisibilitySession record + 2 verb). Rigid risk: trung bình — phải kỷ luật không đưa cognition vào contact kind.
```

### Full target shown text

```text
### Family B — Dispatch-owned interactive session + file-receipt contract (đề xuất)
Dispatch tạo `VisibilitySession` (Run-scoped) trước khi split pane; brief đi bằng **file** trong run dir; pointer một dòng qua `herdr agent prompt --wait`; worker ghi `ack`/`result`/`report` vào **outbox** (tmp-then-rename); poll theo ladder (result › liveness › progress › classify); herdr chỉ là transport + failure detector; gateway reconnect = reattach observer.
- Readiness: `agent start` trả về khi ready (herdr hứa 30 s, `agent_not_ready`) + gate `idle|done` + receipt = ack file. Contact: `contact` action → event → pointer chỉ khi `idle|done` (system channel) hoặc turn-boundary hook (nếu provider có hook). Output: live `agent read` cho observer + outbox cho evidence. Evidence: outbox + git. Restart: `VisibilitySession` persist paneId/agent_session/terminal_id → rebind bằng `agent list`. Crash: reconcile qua liveness ladder, Run → `unknown|failed|reconnectable`. Process-group: vẫn không sở hữu pid — chấp nhận, bù bằng `pane process-info` + `pane close` + `agent send-keys ctrl+c`. Provider: bất kỳ CLI nào đọc được file (đã đo với agy/claude ở upstream). Ergonomics: người thấy pane, thấy cùng file. Coordinator: contact qua cùng door. Cost: trung bình (adapter viết lại ~1 file + VisibilitySession record + 2 verb). Rigid risk: trung bình — phải kỷ luật không đưa cognition vào contact kind.
```

## claim_d046cb628a42b3436ae9d80edcd14df3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-30, lines 198–199.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-33.
Source digest: c26cdfbb691af730e70e10f5aa702f345b2abc24ba4cc87fecb80561446a2717
Target digest: c26cdfbb691af730e70e10f5aa702f345b2abc24ba4cc87fecb80561446a2717
Shown source SHA256: c26cdfbb691af730e70e10f5aa702f345b2abc24ba4cc87fecb80561446a2717
Shown target SHA256: c26cdfbb691af730e70e10f5aa702f345b2abc24ba4cc87fecb80561446a2717

### Proposed decision

```json
{
  "claimId": "claim_d046cb628a42b3436ae9d80edcd14df3",
  "sourceUnitDigest": "c26cdfbb691af730e70e10f5aa702f345b2abc24ba4cc87fecb80561446a2717",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "c26cdfbb691af730e70e10f5aa702f345b2abc24ba4cc87fecb80561446a2717",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "6. Ba (+1) architecture families",
    "Family B — Dispatch-owned interactive session + file-receipt contract (đề xuất)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-30 (lines 198–199) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-33 (lines 222–223); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Dispatch tạo `VisibilitySession` (Run-scoped) trước khi split pane; brief đi bằng **file** trong run dir; pointer một dòng qua `herdr agent prompt --wait`; worker ghi `ack`/`result`/`report` vào **outbox** (tmp-then-rename); poll theo ladder (result › liveness › progress › classify); herdr chỉ là transport + failure detector; gateway reconnect = reattach observer.
- Readiness: `agent start` trả về khi ready (herdr hứa 30 s, `agent_not_ready`) + gate `idle|done` + receipt = ack file. Contact: `contact` action → event → pointer chỉ khi `idle|done` (system channel) hoặc turn-boundary hook (nếu provider có hook). Output: live `agent read` cho observer + outbox cho evidence. Evidence: outbox + git. Restart: `VisibilitySession` persist paneId/agent_session/terminal_id → rebind bằng `agent list`. Crash: reconcile qua liveness ladder, Run → `unknown|failed|reconnectable`. Process-group: vẫn không sở hữu pid — chấp nhận, bù bằng `pane process-info` + `pane close` + `agent send-keys ctrl+c`. Provider: bất kỳ CLI nào đọc được file (đã đo với agy/claude ở upstream). Ergonomics: người thấy pane, thấy cùng file. Coordinator: contact qua cùng door. Cost: trung bình (adapter viết lại ~1 file + VisibilitySession record + 2 verb). Rigid risk: trung bình — phải kỷ luật không đưa cognition vào contact kind.
```

### Full target shown text

```text
Dispatch tạo `VisibilitySession` (Run-scoped) trước khi split pane; brief đi bằng **file** trong run dir; pointer một dòng qua `herdr agent prompt --wait`; worker ghi `ack`/`result`/`report` vào **outbox** (tmp-then-rename); poll theo ladder (result › liveness › progress › classify); herdr chỉ là transport + failure detector; gateway reconnect = reattach observer.
- Readiness: `agent start` trả về khi ready (herdr hứa 30 s, `agent_not_ready`) + gate `idle|done` + receipt = ack file. Contact: `contact` action → event → pointer chỉ khi `idle|done` (system channel) hoặc turn-boundary hook (nếu provider có hook). Output: live `agent read` cho observer + outbox cho evidence. Evidence: outbox + git. Restart: `VisibilitySession` persist paneId/agent_session/terminal_id → rebind bằng `agent list`. Crash: reconcile qua liveness ladder, Run → `unknown|failed|reconnectable`. Process-group: vẫn không sở hữu pid — chấp nhận, bù bằng `pane process-info` + `pane close` + `agent send-keys ctrl+c`. Provider: bất kỳ CLI nào đọc được file (đã đo với agy/claude ở upstream). Ergonomics: người thấy pane, thấy cùng file. Coordinator: contact qua cùng door. Cost: trung bình (adapter viết lại ~1 file + VisibilitySession record + 2 verb). Rigid risk: trung bình — phải kỷ luật không đưa cognition vào contact kind.
```

## claim_a85ebc39e7b48342aeb5c4b47eed04b9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-c-agent-host-control-channel, lines 201–201.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-c-agent-host-control-channel.
Source digest: b22eb2c7c980c56791cb17b0062044ee57eeff9a2a7e0d33a482927f32d52249
Target digest: b22eb2c7c980c56791cb17b0062044ee57eeff9a2a7e0d33a482927f32d52249
Shown source SHA256: 45cc28cdf29953a580af65010dc6f6ec0ad2db75a656f066d08a25f35a341137
Shown target SHA256: 45cc28cdf29953a580af65010dc6f6ec0ad2db75a656f066d08a25f35a341137

### Proposed decision

```json
{
  "claimId": "claim_a85ebc39e7b48342aeb5c4b47eed04b9",
  "sourceUnitDigest": "b22eb2c7c980c56791cb17b0062044ee57eeff9a2a7e0d33a482927f32d52249",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "family-c-agent-host-control-channel",
  "targetUnitDigest": "b22eb2c7c980c56791cb17b0062044ee57eeff9a2a7e0d33a482927f32d52249",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "6. Ba (+1) architecture families"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-c-agent-host-control-channel (lines 201–201) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-c-agent-host-control-channel (lines 225–225); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Family C — Agent host / control channel
Agent host (hook hoặc integration của herdr: `pane report-agent`, `report-agent-session`, `activity.json`) có kênh riêng cho readiness/contact/checkpoint/stop; herdr chỉ projection; terminal không còn là source lifecycle.
- Readiness/liveness: chính xác (hook `PermissionRequest` biết blocked nơi screen đoán sai). Contact: hook `UserPromptSubmit`/`Stop` nhận pending message tại turn boundary. Checkpoint: có thể (hook Stop ghi state). Restart: agent_session bền. Provider: **chỉ** provider có hook (claude, pi, codex một phần; agy: unverified). Cost: cao hơn, phụ thuộc provider. Rigid risk: cao nếu bắt mọi executor phải có host.
```

### Full target shown text

```text
### Family C — Agent host / control channel
Agent host (hook hoặc integration của herdr: `pane report-agent`, `report-agent-session`, `activity.json`) có kênh riêng cho readiness/contact/checkpoint/stop; herdr chỉ projection; terminal không còn là source lifecycle.
- Readiness/liveness: chính xác (hook `PermissionRequest` biết blocked nơi screen đoán sai). Contact: hook `UserPromptSubmit`/`Stop` nhận pending message tại turn boundary. Checkpoint: có thể (hook Stop ghi state). Restart: agent_session bền. Provider: **chỉ** provider có hook (claude, pi, codex một phần; agy: unverified). Cost: cao hơn, phụ thuộc provider. Rigid risk: cao nếu bắt mọi executor phải có host.
```

## claim_4230ee18e3bbaa91dae1f2fd88748820

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-31, lines 202–203.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-34.
Source digest: 4b7fb6115cbec1dff1b2b6d7a1142bff0b6fb89c45e0959d4e2d9c3d8c795aaa
Target digest: 4b7fb6115cbec1dff1b2b6d7a1142bff0b6fb89c45e0959d4e2d9c3d8c795aaa
Shown source SHA256: 4b7fb6115cbec1dff1b2b6d7a1142bff0b6fb89c45e0959d4e2d9c3d8c795aaa
Shown target SHA256: 4b7fb6115cbec1dff1b2b6d7a1142bff0b6fb89c45e0959d4e2d9c3d8c795aaa

### Proposed decision

```json
{
  "claimId": "claim_4230ee18e3bbaa91dae1f2fd88748820",
  "sourceUnitDigest": "4b7fb6115cbec1dff1b2b6d7a1142bff0b6fb89c45e0959d4e2d9c3d8c795aaa",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "4b7fb6115cbec1dff1b2b6d7a1142bff0b6fb89c45e0959d4e2d9c3d8c795aaa",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "6. Ba (+1) architecture families",
    "Family C — Agent host / control channel"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-31 (lines 202–203) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-34 (lines 226–227); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Agent host (hook hoặc integration của herdr: `pane report-agent`, `report-agent-session`, `activity.json`) có kênh riêng cho readiness/contact/checkpoint/stop; herdr chỉ projection; terminal không còn là source lifecycle.
- Readiness/liveness: chính xác (hook `PermissionRequest` biết blocked nơi screen đoán sai). Contact: hook `UserPromptSubmit`/`Stop` nhận pending message tại turn boundary. Checkpoint: có thể (hook Stop ghi state). Restart: agent_session bền. Provider: **chỉ** provider có hook (claude, pi, codex một phần; agy: unverified). Cost: cao hơn, phụ thuộc provider. Rigid risk: cao nếu bắt mọi executor phải có host.
```

### Full target shown text

```text
Agent host (hook hoặc integration của herdr: `pane report-agent`, `report-agent-session`, `activity.json`) có kênh riêng cho readiness/contact/checkpoint/stop; herdr chỉ projection; terminal không còn là source lifecycle.
- Readiness/liveness: chính xác (hook `PermissionRequest` biết blocked nơi screen đoán sai). Contact: hook `UserPromptSubmit`/`Stop` nhận pending message tại turn boundary. Checkpoint: có thể (hook Stop ghi state). Restart: agent_session bền. Provider: **chỉ** provider có hook (claude, pi, codex một phần; agy: unverified). Cost: cao hơn, phụ thuộc provider. Rigid risk: cao nếu bắt mọi executor phải có host.
```

## claim_827eecb6109ec556991a254eccdfea24

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-d-phụ-headless-in-pane-agy--p-trong-pane-herdr, lines 205–205.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-d-phụ-headless-in-pane-agy--p-trong-pane-herdr.
Source digest: 02ddacf3fa1b7d8cd2f110107aa8f4108bc61889dbadcc8fb174b8258b7d8651
Target digest: 02ddacf3fa1b7d8cd2f110107aa8f4108bc61889dbadcc8fb174b8258b7d8651
Shown source SHA256: 284a663eb40f8f272427446bfd05a29dc9301e126cfa9e155faab34a47bfa90b
Shown target SHA256: 284a663eb40f8f272427446bfd05a29dc9301e126cfa9e155faab34a47bfa90b

### Proposed decision

```json
{
  "claimId": "claim_827eecb6109ec556991a254eccdfea24",
  "sourceUnitDigest": "02ddacf3fa1b7d8cd2f110107aa8f4108bc61889dbadcc8fb174b8258b7d8651",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "family-d-phụ-headless-in-pane-agy--p-trong-pane-herdr",
  "targetUnitDigest": "02ddacf3fa1b7d8cd2f110107aa8f4108bc61889dbadcc8fb174b8258b7d8651",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "6. Ba (+1) architecture families"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-d-phụ-headless-in-pane-agy--p-trong-pane-herdr (lines 205–205) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#family-d-phụ-headless-in-pane-agy--p-trong-pane-herdr (lines 229–229); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### Family D (phụ) — Headless-in-pane (`agy -p` trong pane herdr)
Truth = exit code + stdout; pane chỉ để nhìn. Đã bị người dùng loại (tsk-by0: "herdr's only job is real TTY visibility"; brief: không dùng `-p` làm đường chính). Ghi lại như reversal condition, không đề xuất.

---
```

### Full target shown text

```text
### Family D (phụ) — Headless-in-pane (`agy -p` trong pane herdr)
Truth = exit code + stdout; pane chỉ để nhìn. Đã bị người dùng loại (tsk-by0: "herdr's only job is real TTY visibility"; brief: không dùng `-p` làm đường chính). Ghi lại như reversal condition, không đề xuất.

---
```

## claim_29a51c8f2ef021cbbbe5c5c0a09e7909

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-32, lines 206–208.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-35.
Source digest: b469e107d9c008cc6297f27bb76d934ca0b487109c4e0e5dbfa43d7eee03deb1
Target digest: b469e107d9c008cc6297f27bb76d934ca0b487109c4e0e5dbfa43d7eee03deb1
Shown source SHA256: b469e107d9c008cc6297f27bb76d934ca0b487109c4e0e5dbfa43d7eee03deb1
Shown target SHA256: b469e107d9c008cc6297f27bb76d934ca0b487109c4e0e5dbfa43d7eee03deb1

### Proposed decision

```json
{
  "claimId": "claim_29a51c8f2ef021cbbbe5c5c0a09e7909",
  "sourceUnitDigest": "b469e107d9c008cc6297f27bb76d934ca0b487109c4e0e5dbfa43d7eee03deb1",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "b469e107d9c008cc6297f27bb76d934ca0b487109c4e0e5dbfa43d7eee03deb1",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "6. Ba (+1) architecture families",
    "Family D (phụ) — Headless-in-pane (`agy -p` trong pane herdr)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-32 (lines 206–208) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-35 (lines 230–232); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Truth = exit code + stdout; pane chỉ để nhìn. Đã bị người dùng loại (tsk-by0: "herdr's only job is real TTY visibility"; brief: không dùng `-p` làm đường chính). Ghi lại như reversal condition, không đề xuất.

---
```

### Full target shown text

```text
Truth = exit code + stdout; pane chỉ để nhìn. Đã bị người dùng loại (tsk-by0: "herdr's only job is real TTY visibility"; brief: không dùng `-p` làm đường chính). Ghi lại như reversal condition, không đề xuất.

---
```

## claim_58a951a2956b14db5858932c82644f50

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#7-walkthrough-ah-dưới-family-b-ghi-rõ-chỗ-hôm-nay-gãy, lines 210–210.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#7-walkthrough-ah-dưới-family-b-ghi-rõ-chỗ-hôm-nay-gãy.
Source digest: dedad7adbc49d3415d3bfafb595de48678d1c1774cebab4366979f31b1b6d2e0
Target digest: dedad7adbc49d3415d3bfafb595de48678d1c1774cebab4366979f31b1b6d2e0
Shown source SHA256: cc9378b68f86bf15f73aa726f33895664529dc4e9c048a000bfc6f3c3222d25f
Shown target SHA256: cc9378b68f86bf15f73aa726f33895664529dc4e9c048a000bfc6f3c3222d25f

### Proposed decision

```json
{
  "claimId": "claim_58a951a2956b14db5858932c82644f50",
  "sourceUnitDigest": "dedad7adbc49d3415d3bfafb595de48678d1c1774cebab4366979f31b1b6d2e0",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "7-walkthrough-ah-dưới-family-b-ghi-rõ-chỗ-hôm-nay-gãy",
  "targetUnitDigest": "dedad7adbc49d3415d3bfafb595de48678d1c1774cebab4366979f31b1b6d2e0",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#7-walkthrough-ah-dưới-family-b-ghi-rõ-chỗ-hôm-nay-gãy (lines 210–210) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#7-walkthrough-ah-dưới-family-b-ghi-rõ-chỗ-hôm-nay-gãy (lines 234–234); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)

**A. Happy path.** Coordinator → Assignment → Dispatch resolve `agy-herdr` → tạo run dir + `visibility.json {paneId:null, status:'requested'}` → split lock → `pane split --no-focus` (≥ 60 cột) → persist paneId → `agent start <runId> --kind antigravity-cli --pane …` (ready hoặc `agent_not_ready`) → ghi `brief-1.md` → `agent prompt <runId> "Read <abs path> and follow it" --wait --timeout 20000` → chờ `ack-1.json` (hoặc `result-1.json` nếu quá nhanh) → status `working` → người xem pane/`agent read` → worker ghi `report-1.md` rồi `result-1.json` → collector đọc, snapshot git → RunResult → pane đóng (result hợp lệ) hoặc giữ theo policy. *Hôm nay gãy ở:* prompt argv (F3), receipt = agent_status (F1/F2), không persist paneId (F7).

**B. Human contact giữa chừng.** Người gõ vào pane trực tiếp là *ngoài hệ thống* (herdr cho phép, không cấm được) — ghi nhận là **untracked human input**; RunResult mang cờ `humanInputObserved` nếu `agent_status` chuyển mà không có contact event tương ứng (best-effort). Đường có audit: `fgos dispatch contact <runId> --channel human --kind question --text …` → event → pointer khi `idle|done`. Agent trả lời trong pane; câu trả lời **không** vào evidence trừ khi worker ghi vào outbox. Grants không đổi.

**C. Coordinator contact.** Coordinator giữ epoch → `contact --channel coordinator --kind checkpoint` → event có lineage (assignmentId, sessionId, seq) → worker ghi `checkpoint-N.json` vào outbox (nếu executor khai `checkpoint:true`; agy-herdr: `false` → refused có type) → coordinator đọc từ outbox, không từ màn hình.

**D. Gateway restart.** herdr server restart: pane id bền (herdr: "Closed tab and pane IDs are not reused"; UNVERIFIED liệu pane sống qua server restart — probe P3). Dispatch: observer mất → `visibility.status='detached'`, Run **không** đổi; reattach: `agent list` tìm theo `pane_id` hoặc `agent_session.value` đã persist; không gửi pointer lại vì `ack-N` đã có (idempotent theo round). Nếu pane mất: liveness ladder → `reconnectable` (agent_session còn, provider hỗ trợ resume) hoặc `unknown`.

**E. Agent crash.** `pane process-info` foreground = shell only, 3 lần liên tiếp, không `result-N` → `died`; pane **giữ mở**; Run → `failed` với `evidence.json` + tail màn hình làm diagnostic (không phải evidence); retry = round mới hoặc Run mới có `parentRunRef`; mutation không duplicate vì mutating chỉ trong worktree riêng + CAS khi integrate (đã có trong dispatch contract).

**F. Startup race.** `agent start` chưa ready → không gửi pointer; `agent_not_ready` → chờ `agent wait --until idle --until done` có timeout; pointer chỉ gửi từ ready; `agent_prompt_stalled` → retry bounded (đếm + budget), chỉ khi agent về ready mà vẫn không ack; `blocked` (trust dialog) → dừng, pane giữ, người trả lời. Input không bao giờ bị nuốt vì pointer idempotent và brief ở file.

**G. Long run.** Output lớn/alt-screen: observer dùng `agent read --lines`, chấp nhận mất; evidence là `report-N.md` worker viết (herdr's own fallback rule). Heartbeat = `log`/`activity.json`/`working`; idle-timeout 15 phút + ceiling 6 giờ (số của upstream, fgOS tự chọn). Observer reconnect chỉ đọc.

**H. Malicious worker.** Env: **hôm nay thừa kế toàn bộ** — phải allowlist (worker-provider-boundary). Provider credential: ngoài scope adapter, ghi là gap. Gọi herdr API: worker trong pane herdr **có socket** (`HERDR_*` env, socket path) → có thể `pane run` vào pane khác, kể cả pane người. Cần: không inject `HERDR_*` vào worker pane hoặc herdr session riêng (`--session`) cho worker; ghi là **open risk**. Giả contact: contact event chỉ do fgOS process ghi vào `.fgos/`; worker không có quyền ghi `.fgos/` (ADR0020 + write guard) → giả mạo chỉ có thể là *text trong pane*, không phải event. Sửa Run/evidence: collector ghi ngoài namespace worker; outbox riêng. Spawn child: depth env cooperative (F12) — ghi gap. Sentinel giả: sentinel không còn là truth (result file + liveness mới là).

---
```

### Full target shown text

```text
## 7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)

**A. Happy path.** Coordinator → Assignment → Dispatch resolve `agy-herdr` → tạo run dir + `visibility.json {paneId:null, status:'requested'}` → split lock → `pane split --no-focus` (≥ 60 cột) → persist paneId → `agent start <runId> --kind antigravity-cli --pane …` (ready hoặc `agent_not_ready`) → ghi `brief-1.md` → `agent prompt <runId> "Read <abs path> and follow it" --wait --timeout 20000` → chờ `ack-1.json` (hoặc `result-1.json` nếu quá nhanh) → status `working` → người xem pane/`agent read` → worker ghi `report-1.md` rồi `result-1.json` → collector đọc, snapshot git → RunResult → pane đóng (result hợp lệ) hoặc giữ theo policy. *Hôm nay gãy ở:* prompt argv (F3), receipt = agent_status (F1/F2), không persist paneId (F7).

**B. Human contact giữa chừng.** Người gõ vào pane trực tiếp là *ngoài hệ thống* (herdr cho phép, không cấm được) — ghi nhận là **untracked human input**; RunResult mang cờ `humanInputObserved` nếu `agent_status` chuyển mà không có contact event tương ứng (best-effort). Đường có audit: `fgos dispatch contact <runId> --channel human --kind question --text …` → event → pointer khi `idle|done`. Agent trả lời trong pane; câu trả lời **không** vào evidence trừ khi worker ghi vào outbox. Grants không đổi.

**C. Coordinator contact.** Coordinator giữ epoch → `contact --channel coordinator --kind checkpoint` → event có lineage (assignmentId, sessionId, seq) → worker ghi `checkpoint-N.json` vào outbox (nếu executor khai `checkpoint:true`; agy-herdr: `false` → refused có type) → coordinator đọc từ outbox, không từ màn hình.

**D. Gateway restart.** herdr server restart: pane id bền (herdr: "Closed tab and pane IDs are not reused"; UNVERIFIED liệu pane sống qua server restart — probe P3). Dispatch: observer mất → `visibility.status='detached'`, Run **không** đổi; reattach: `agent list` tìm theo `pane_id` hoặc `agent_session.value` đã persist; không gửi pointer lại vì `ack-N` đã có (idempotent theo round). Nếu pane mất: liveness ladder → `reconnectable` (agent_session còn, provider hỗ trợ resume) hoặc `unknown`.

**E. Agent crash.** `pane process-info` foreground = shell only, 3 lần liên tiếp, không `result-N` → `died`; pane **giữ mở**; Run → `failed` với `evidence.json` + tail màn hình làm diagnostic (không phải evidence); retry = round mới hoặc Run mới có `parentRunRef`; mutation không duplicate vì mutating chỉ trong worktree riêng + CAS khi integrate (đã có trong dispatch contract).

**F. Startup race.** `agent start` chưa ready → không gửi pointer; `agent_not_ready` → chờ `agent wait --until idle --until done` có timeout; pointer chỉ gửi từ ready; `agent_prompt_stalled` → retry bounded (đếm + budget), chỉ khi agent về ready mà vẫn không ack; `blocked` (trust dialog) → dừng, pane giữ, người trả lời. Input không bao giờ bị nuốt vì pointer idempotent và brief ở file.

**G. Long run.** Output lớn/alt-screen: observer dùng `agent read --lines`, chấp nhận mất; evidence là `report-N.md` worker viết (herdr's own fallback rule). Heartbeat = `log`/`activity.json`/`working`; idle-timeout 15 phút + ceiling 6 giờ (số của upstream, fgOS tự chọn). Observer reconnect chỉ đọc.

**H. Malicious worker.** Env: **hôm nay thừa kế toàn bộ** — phải allowlist (worker-provider-boundary). Provider credential: ngoài scope adapter, ghi là gap. Gọi herdr API: worker trong pane herdr **có socket** (`HERDR_*` env, socket path) → có thể `pane run` vào pane khác, kể cả pane người. Cần: không inject `HERDR_*` vào worker pane hoặc herdr session riêng (`--session`) cho worker; ghi là **open risk**. Giả contact: contact event chỉ do fgOS process ghi vào `.fgos/`; worker không có quyền ghi `.fgos/` (ADR0020 + write guard) → giả mạo chỉ có thể là *text trong pane*, không phải event. Sửa Run/evidence: collector ghi ngoài namespace worker; outbox riêng. Spawn child: depth env cooperative (F12) — ghi gap. Sentinel giả: sentinel không còn là truth (result file + liveness mới là).

---
```

## claim_070d1335f7968a42f345ed6cfe58f9c1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-33, lines 212–212.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-36.
Source digest: 291c3718b863fbb86ab8f0ecba9710635b3d7943961eaf181ecdeeda1086adfe
Target digest: 291c3718b863fbb86ab8f0ecba9710635b3d7943961eaf181ecdeeda1086adfe
Shown source SHA256: 291c3718b863fbb86ab8f0ecba9710635b3d7943961eaf181ecdeeda1086adfe
Shown target SHA256: 291c3718b863fbb86ab8f0ecba9710635b3d7943961eaf181ecdeeda1086adfe

### Proposed decision

```json
{
  "claimId": "claim_070d1335f7968a42f345ed6cfe58f9c1",
  "sourceUnitDigest": "291c3718b863fbb86ab8f0ecba9710635b3d7943961eaf181ecdeeda1086adfe",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "291c3718b863fbb86ab8f0ecba9710635b3d7943961eaf181ecdeeda1086adfe",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-33 (lines 212–212) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-36 (lines 236–236); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**A. Happy path.** Coordinator → Assignment → Dispatch resolve `agy-herdr` → tạo run dir + `visibility.json {paneId:null, status:'requested'}` → split lock → `pane split --no-focus` (≥ 60 cột) → persist paneId → `agent start <runId> --kind antigravity-cli --pane …` (ready hoặc `agent_not_ready`) → ghi `brief-1.md` → `agent prompt <runId> "Read <abs path> and follow it" --wait --timeout 20000` → chờ `ack-1.json` (hoặc `result-1.json` nếu quá nhanh) → status `working` → người xem pane/`agent read` → worker ghi `report-1.md` rồi `result-1.json` → collector đọc, snapshot git → RunResult → pane đóng (result hợp lệ) hoặc giữ theo policy. *Hôm nay gãy ở:* prompt argv (F3), receipt = agent_status (F1/F2), không persist paneId (F7).
```

### Full target shown text

```text
**A. Happy path.** Coordinator → Assignment → Dispatch resolve `agy-herdr` → tạo run dir + `visibility.json {paneId:null, status:'requested'}` → split lock → `pane split --no-focus` (≥ 60 cột) → persist paneId → `agent start <runId> --kind antigravity-cli --pane …` (ready hoặc `agent_not_ready`) → ghi `brief-1.md` → `agent prompt <runId> "Read <abs path> and follow it" --wait --timeout 20000` → chờ `ack-1.json` (hoặc `result-1.json` nếu quá nhanh) → status `working` → người xem pane/`agent read` → worker ghi `report-1.md` rồi `result-1.json` → collector đọc, snapshot git → RunResult → pane đóng (result hợp lệ) hoặc giữ theo policy. *Hôm nay gãy ở:* prompt argv (F3), receipt = agent_status (F1/F2), không persist paneId (F7).
```

## claim_86dd123aada54449b7037c68aad00992

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-34, lines 214–214.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-37.
Source digest: 4143cb8a9820eaae9fb631b3e3bd6d9373327accabd1bbd655bd86de8be0418b
Target digest: 4143cb8a9820eaae9fb631b3e3bd6d9373327accabd1bbd655bd86de8be0418b
Shown source SHA256: 4143cb8a9820eaae9fb631b3e3bd6d9373327accabd1bbd655bd86de8be0418b
Shown target SHA256: 4143cb8a9820eaae9fb631b3e3bd6d9373327accabd1bbd655bd86de8be0418b

### Proposed decision

```json
{
  "claimId": "claim_86dd123aada54449b7037c68aad00992",
  "sourceUnitDigest": "4143cb8a9820eaae9fb631b3e3bd6d9373327accabd1bbd655bd86de8be0418b",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "4143cb8a9820eaae9fb631b3e3bd6d9373327accabd1bbd655bd86de8be0418b",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-34 (lines 214–214) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-37 (lines 238–238); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**B. Human contact giữa chừng.** Người gõ vào pane trực tiếp là *ngoài hệ thống* (herdr cho phép, không cấm được) — ghi nhận là **untracked human input**; RunResult mang cờ `humanInputObserved` nếu `agent_status` chuyển mà không có contact event tương ứng (best-effort). Đường có audit: `fgos dispatch contact <runId> --channel human --kind question --text …` → event → pointer khi `idle|done`. Agent trả lời trong pane; câu trả lời **không** vào evidence trừ khi worker ghi vào outbox. Grants không đổi.
```

### Full target shown text

```text
**B. Human contact giữa chừng.** Người gõ vào pane trực tiếp là *ngoài hệ thống* (herdr cho phép, không cấm được) — ghi nhận là **untracked human input**; RunResult mang cờ `humanInputObserved` nếu `agent_status` chuyển mà không có contact event tương ứng (best-effort). Đường có audit: `fgos dispatch contact <runId> --channel human --kind question --text …` → event → pointer khi `idle|done`. Agent trả lời trong pane; câu trả lời **không** vào evidence trừ khi worker ghi vào outbox. Grants không đổi.
```

## claim_a96df963f993c47f6a297036d88caa11

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-35, lines 216–216.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-38.
Source digest: e58429086d727aebbfbdceb4224b5ec0eefbea7e4153ac4462b5680ec68c4b05
Target digest: e58429086d727aebbfbdceb4224b5ec0eefbea7e4153ac4462b5680ec68c4b05
Shown source SHA256: e58429086d727aebbfbdceb4224b5ec0eefbea7e4153ac4462b5680ec68c4b05
Shown target SHA256: e58429086d727aebbfbdceb4224b5ec0eefbea7e4153ac4462b5680ec68c4b05

### Proposed decision

```json
{
  "claimId": "claim_a96df963f993c47f6a297036d88caa11",
  "sourceUnitDigest": "e58429086d727aebbfbdceb4224b5ec0eefbea7e4153ac4462b5680ec68c4b05",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "e58429086d727aebbfbdceb4224b5ec0eefbea7e4153ac4462b5680ec68c4b05",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-35 (lines 216–216) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-38 (lines 240–240); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**C. Coordinator contact.** Coordinator giữ epoch → `contact --channel coordinator --kind checkpoint` → event có lineage (assignmentId, sessionId, seq) → worker ghi `checkpoint-N.json` vào outbox (nếu executor khai `checkpoint:true`; agy-herdr: `false` → refused có type) → coordinator đọc từ outbox, không từ màn hình.
```

### Full target shown text

```text
**C. Coordinator contact.** Coordinator giữ epoch → `contact --channel coordinator --kind checkpoint` → event có lineage (assignmentId, sessionId, seq) → worker ghi `checkpoint-N.json` vào outbox (nếu executor khai `checkpoint:true`; agy-herdr: `false` → refused có type) → coordinator đọc từ outbox, không từ màn hình.
```

## claim_524cd716fcdfef7cc665b7f6758c7628

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-36, lines 218–218.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-39.
Source digest: 8442487393d2a2adbc17c2538a4f9d802d3ce9b0faa09911d743c3ca3116b45a
Target digest: 8442487393d2a2adbc17c2538a4f9d802d3ce9b0faa09911d743c3ca3116b45a
Shown source SHA256: 8442487393d2a2adbc17c2538a4f9d802d3ce9b0faa09911d743c3ca3116b45a
Shown target SHA256: 8442487393d2a2adbc17c2538a4f9d802d3ce9b0faa09911d743c3ca3116b45a

### Proposed decision

```json
{
  "claimId": "claim_524cd716fcdfef7cc665b7f6758c7628",
  "sourceUnitDigest": "8442487393d2a2adbc17c2538a4f9d802d3ce9b0faa09911d743c3ca3116b45a",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "8442487393d2a2adbc17c2538a4f9d802d3ce9b0faa09911d743c3ca3116b45a",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-36 (lines 218–218) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-39 (lines 242–242); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**D. Gateway restart.** herdr server restart: pane id bền (herdr: "Closed tab and pane IDs are not reused"; UNVERIFIED liệu pane sống qua server restart — probe P3). Dispatch: observer mất → `visibility.status='detached'`, Run **không** đổi; reattach: `agent list` tìm theo `pane_id` hoặc `agent_session.value` đã persist; không gửi pointer lại vì `ack-N` đã có (idempotent theo round). Nếu pane mất: liveness ladder → `reconnectable` (agent_session còn, provider hỗ trợ resume) hoặc `unknown`.
```

### Full target shown text

```text
**D. Gateway restart.** herdr server restart: pane id bền (herdr: "Closed tab and pane IDs are not reused"; UNVERIFIED liệu pane sống qua server restart — probe P3). Dispatch: observer mất → `visibility.status='detached'`, Run **không** đổi; reattach: `agent list` tìm theo `pane_id` hoặc `agent_session.value` đã persist; không gửi pointer lại vì `ack-N` đã có (idempotent theo round). Nếu pane mất: liveness ladder → `reconnectable` (agent_session còn, provider hỗ trợ resume) hoặc `unknown`.
```

## claim_c2c4ae15323f919836f21781393b914f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-37, lines 220–220.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-40.
Source digest: f99a3cb45fb0ebc4d3bcefb9918ae5d601c87323c97d8d1822631a585484d593
Target digest: f99a3cb45fb0ebc4d3bcefb9918ae5d601c87323c97d8d1822631a585484d593
Shown source SHA256: f99a3cb45fb0ebc4d3bcefb9918ae5d601c87323c97d8d1822631a585484d593
Shown target SHA256: f99a3cb45fb0ebc4d3bcefb9918ae5d601c87323c97d8d1822631a585484d593

### Proposed decision

```json
{
  "claimId": "claim_c2c4ae15323f919836f21781393b914f",
  "sourceUnitDigest": "f99a3cb45fb0ebc4d3bcefb9918ae5d601c87323c97d8d1822631a585484d593",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "f99a3cb45fb0ebc4d3bcefb9918ae5d601c87323c97d8d1822631a585484d593",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-37 (lines 220–220) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-40 (lines 244–244); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**E. Agent crash.** `pane process-info` foreground = shell only, 3 lần liên tiếp, không `result-N` → `died`; pane **giữ mở**; Run → `failed` với `evidence.json` + tail màn hình làm diagnostic (không phải evidence); retry = round mới hoặc Run mới có `parentRunRef`; mutation không duplicate vì mutating chỉ trong worktree riêng + CAS khi integrate (đã có trong dispatch contract).
```

### Full target shown text

```text
**E. Agent crash.** `pane process-info` foreground = shell only, 3 lần liên tiếp, không `result-N` → `died`; pane **giữ mở**; Run → `failed` với `evidence.json` + tail màn hình làm diagnostic (không phải evidence); retry = round mới hoặc Run mới có `parentRunRef`; mutation không duplicate vì mutating chỉ trong worktree riêng + CAS khi integrate (đã có trong dispatch contract).
```

## claim_e9bdf9961efaf21f0d6e098ff6ffff61

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-38, lines 222–222.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-41.
Source digest: 28e38a9e95a15199fa727cb5658480ee217736f0d096a32bbb2a48b275481c9a
Target digest: 28e38a9e95a15199fa727cb5658480ee217736f0d096a32bbb2a48b275481c9a
Shown source SHA256: 28e38a9e95a15199fa727cb5658480ee217736f0d096a32bbb2a48b275481c9a
Shown target SHA256: 28e38a9e95a15199fa727cb5658480ee217736f0d096a32bbb2a48b275481c9a

### Proposed decision

```json
{
  "claimId": "claim_e9bdf9961efaf21f0d6e098ff6ffff61",
  "sourceUnitDigest": "28e38a9e95a15199fa727cb5658480ee217736f0d096a32bbb2a48b275481c9a",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "28e38a9e95a15199fa727cb5658480ee217736f0d096a32bbb2a48b275481c9a",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-38 (lines 222–222) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-41 (lines 246–246); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**F. Startup race.** `agent start` chưa ready → không gửi pointer; `agent_not_ready` → chờ `agent wait --until idle --until done` có timeout; pointer chỉ gửi từ ready; `agent_prompt_stalled` → retry bounded (đếm + budget), chỉ khi agent về ready mà vẫn không ack; `blocked` (trust dialog) → dừng, pane giữ, người trả lời. Input không bao giờ bị nuốt vì pointer idempotent và brief ở file.
```

### Full target shown text

```text
**F. Startup race.** `agent start` chưa ready → không gửi pointer; `agent_not_ready` → chờ `agent wait --until idle --until done` có timeout; pointer chỉ gửi từ ready; `agent_prompt_stalled` → retry bounded (đếm + budget), chỉ khi agent về ready mà vẫn không ack; `blocked` (trust dialog) → dừng, pane giữ, người trả lời. Input không bao giờ bị nuốt vì pointer idempotent và brief ở file.
```

## claim_9db2e7dac3b48d1a70fafd69c6368a07

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-39, lines 224–224.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-42.
Source digest: 8e5515cdcb38e4adb0430d26415430330f6ad306a7a4674972098fb250686cb1
Target digest: 8e5515cdcb38e4adb0430d26415430330f6ad306a7a4674972098fb250686cb1
Shown source SHA256: 8e5515cdcb38e4adb0430d26415430330f6ad306a7a4674972098fb250686cb1
Shown target SHA256: 8e5515cdcb38e4adb0430d26415430330f6ad306a7a4674972098fb250686cb1

### Proposed decision

```json
{
  "claimId": "claim_9db2e7dac3b48d1a70fafd69c6368a07",
  "sourceUnitDigest": "8e5515cdcb38e4adb0430d26415430330f6ad306a7a4674972098fb250686cb1",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "8e5515cdcb38e4adb0430d26415430330f6ad306a7a4674972098fb250686cb1",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-39 (lines 224–224) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-42 (lines 248–248); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**G. Long run.** Output lớn/alt-screen: observer dùng `agent read --lines`, chấp nhận mất; evidence là `report-N.md` worker viết (herdr's own fallback rule). Heartbeat = `log`/`activity.json`/`working`; idle-timeout 15 phút + ceiling 6 giờ (số của upstream, fgOS tự chọn). Observer reconnect chỉ đọc.
```

### Full target shown text

```text
**G. Long run.** Output lớn/alt-screen: observer dùng `agent read --lines`, chấp nhận mất; evidence là `report-N.md` worker viết (herdr's own fallback rule). Heartbeat = `log`/`activity.json`/`working`; idle-timeout 15 phút + ceiling 6 giờ (số của upstream, fgOS tự chọn). Observer reconnect chỉ đọc.
```

## claim_916cec3bbbdba51343e26f07f781a907

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-40, lines 226–228.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-43.
Source digest: f26246948ded4dc8b3cfba72e794703fb692ba46a8318149c7c9c97d24f0cfa2
Target digest: f26246948ded4dc8b3cfba72e794703fb692ba46a8318149c7c9c97d24f0cfa2
Shown source SHA256: f26246948ded4dc8b3cfba72e794703fb692ba46a8318149c7c9c97d24f0cfa2
Shown target SHA256: f26246948ded4dc8b3cfba72e794703fb692ba46a8318149c7c9c97d24f0cfa2

### Proposed decision

```json
{
  "claimId": "claim_916cec3bbbdba51343e26f07f781a907",
  "sourceUnitDigest": "f26246948ded4dc8b3cfba72e794703fb692ba46a8318149c7c9c97d24f0cfa2",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "f26246948ded4dc8b3cfba72e794703fb692ba46a8318149c7c9c97d24f0cfa2",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "7. Walkthrough A–H (dưới Family B, ghi rõ chỗ hôm nay gãy)"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-40 (lines 226–228) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-43 (lines 250–252); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
**H. Malicious worker.** Env: **hôm nay thừa kế toàn bộ** — phải allowlist (worker-provider-boundary). Provider credential: ngoài scope adapter, ghi là gap. Gọi herdr API: worker trong pane herdr **có socket** (`HERDR_*` env, socket path) → có thể `pane run` vào pane khác, kể cả pane người. Cần: không inject `HERDR_*` vào worker pane hoặc herdr session riêng (`--session`) cho worker; ghi là **open risk**. Giả contact: contact event chỉ do fgOS process ghi vào `.fgos/`; worker không có quyền ghi `.fgos/` (ADR0020 + write guard) → giả mạo chỉ có thể là *text trong pane*, không phải event. Sửa Run/evidence: collector ghi ngoài namespace worker; outbox riêng. Spawn child: depth env cooperative (F12) — ghi gap. Sentinel giả: sentinel không còn là truth (result file + liveness mới là).

---
```

### Full target shown text

```text
**H. Malicious worker.** Env: **hôm nay thừa kế toàn bộ** — phải allowlist (worker-provider-boundary). Provider credential: ngoài scope adapter, ghi là gap. Gọi herdr API: worker trong pane herdr **có socket** (`HERDR_*` env, socket path) → có thể `pane run` vào pane khác, kể cả pane người. Cần: không inject `HERDR_*` vào worker pane hoặc herdr session riêng (`--session`) cho worker; ghi là **open risk**. Giả contact: contact event chỉ do fgOS process ghi vào `.fgos/`; worker không có quyền ghi `.fgos/` (ADR0020 + write guard) → giả mạo chỉ có thể là *text trong pane*, không phải event. Sửa Run/evidence: collector ghi ngoài namespace worker; outbox riêng. Spawn child: depth env cooperative (F12) — ghi gap. Sentinel giả: sentinel không còn là truth (result file + liveness mới là).

---
```

## claim_861a9ef187cf1bbc3d343e3a9b141968

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#8-brainstorm-ổn-định-hoá-herdr-spawn-theo-lớp, lines 230–230.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#8-brainstorm-ổn-định-hoá-herdr-spawn-theo-lớp.
Source digest: f46afb3d261aeef1977f42b328f19ddfbb7371c9fe7377936c7d95101e6d0e6b
Target digest: f46afb3d261aeef1977f42b328f19ddfbb7371c9fe7377936c7d95101e6d0e6b
Shown source SHA256: 16b438d6a9475dc34c188fb960372dd61d9cbc895bb269a95eceaf2ccd260757
Shown target SHA256: 16b438d6a9475dc34c188fb960372dd61d9cbc895bb269a95eceaf2ccd260757

### Proposed decision

```json
{
  "claimId": "claim_861a9ef187cf1bbc3d343e3a9b141968",
  "sourceUnitDigest": "f46afb3d261aeef1977f42b328f19ddfbb7371c9fe7377936c7d95101e6d0e6b",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "8-brainstorm-ổn-định-hoá-herdr-spawn-theo-lớp",
  "targetUnitDigest": "f46afb3d261aeef1977f42b328f19ddfbb7371c9fe7377936c7d95101e6d0e6b",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#8-brainstorm-ổn-định-hoá-herdr-spawn-theo-lớp (lines 230–230) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#8-brainstorm-ổn-định-hoá-herdr-spawn-theo-lớp (lines 254–254); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 8. Brainstorm ổn định hoá herdr-spawn theo lớp
```

### Full target shown text

```text
## 8. Brainstorm ổn định hoá herdr-spawn theo lớp
```

## claim_1b72482d61381b311c99bc07fb8b8d96

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#81-lifecycle-state-machine-dispatch-sở-hữu-persist-trong-visibilityjson-run-event, lines 232–232.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#81-lifecycle-state-machine-dispatch-sở-hữu-persist-trong-visibilityjson-run-event.
Source digest: ecd7bb6af012c1ce6d437748aae094e83578ea5f32d8d2c447a6d7d89576d5a5
Target digest: ecd7bb6af012c1ce6d437748aae094e83578ea5f32d8d2c447a6d7d89576d5a5
Shown source SHA256: aca90340b2ef547f7efc39a6bbf51826a96f50656cebc3b9ef375d08941f6776
Shown target SHA256: aca90340b2ef547f7efc39a6bbf51826a96f50656cebc3b9ef375d08941f6776

### Proposed decision

```json
{
  "claimId": "claim_1b72482d61381b311c99bc07fb8b8d96",
  "sourceUnitDigest": "ecd7bb6af012c1ce6d437748aae094e83578ea5f32d8d2c447a6d7d89576d5a5",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "81-lifecycle-state-machine-dispatch-sở-hữu-persist-trong-visibilityjson-run-event",
  "targetUnitDigest": "ecd7bb6af012c1ce6d437748aae094e83578ea5f32d8d2c447a6d7d89576d5a5",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#81-lifecycle-state-machine-dispatch-sở-hữu-persist-trong-visibilityjson-run-event (lines 232–232) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#81-lifecycle-state-machine-dispatch-sở-hữu-persist-trong-visibilityjson-run-event (lines 256–256); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
### 8.1 Lifecycle state machine (Dispatch sở hữu, persist trong `visibility.json` + Run event)

```txt
requested → pane-created → agent-starting → agent-ready → briefed(ack) → working
        ↘ start-failed (pane đóng)          ↘ blocked (pane giữ, chờ người)
working → settling(result file xuất hiện) → exited(agent gone) → reconciled(RunResult)
working → detached(observer mất, Run không đổi) → reattached
working → died(3× absent) | timed-out-idle | timed-out-ceiling | paused-limit  (pane giữ)
```
Tách bạch: pane exists (`pane list`), process exists (`process-info`), shell foreground (`foreground_processes==[]`), agent ready (`agent start` return / `idle|done`), agent working (`working` | activity | log mtime), agent exited (foreground = shell), observer disconnected (client-side).
````

### Full target shown text

````text
### 8.1 Lifecycle state machine (Dispatch sở hữu, persist trong `visibility.json` + Run event)

```txt
requested → pane-created → agent-starting → agent-ready → briefed(ack) → working
        ↘ start-failed (pane đóng)          ↘ blocked (pane giữ, chờ người)
working → settling(result file xuất hiện) → exited(agent gone) → reconciled(RunResult)
working → detached(observer mất, Run không đổi) → reattached
working → died(3× absent) | timed-out-idle | timed-out-ceiling | paused-limit  (pane giữ)
```
Tách bạch: pane exists (`pane list`), process exists (`process-info`), shell foreground (`foreground_processes==[]`), agent ready (`agent start` return / `idle|done`), agent working (`working` | activity | log mtime), agent exited (foreground = shell), observer disconnected (client-side).
````

## claim_853a8af5b9110fd5cc8f061d214b30f4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-41, lines 234–241.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-44.
Source digest: 05faa25a7004b277cb2018d569883b2f791070d98df6a7723bc75c5238064107
Target digest: 05faa25a7004b277cb2018d569883b2f791070d98df6a7723bc75c5238064107
Shown source SHA256: 05faa25a7004b277cb2018d569883b2f791070d98df6a7723bc75c5238064107
Shown target SHA256: 05faa25a7004b277cb2018d569883b2f791070d98df6a7723bc75c5238064107

### Proposed decision

```json
{
  "claimId": "claim_853a8af5b9110fd5cc8f061d214b30f4",
  "sourceUnitDigest": "05faa25a7004b277cb2018d569883b2f791070d98df6a7723bc75c5238064107",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "05faa25a7004b277cb2018d569883b2f791070d98df6a7723bc75c5238064107",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.1 Lifecycle state machine (Dispatch sở hữu, persist trong `visibility.json` + Run event)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-41 (lines 234–241) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-44 (lines 258–265); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
requested → pane-created → agent-starting → agent-ready → briefed(ack) → working
        ↘ start-failed (pane đóng)          ↘ blocked (pane giữ, chờ người)
working → settling(result file xuất hiện) → exited(agent gone) → reconciled(RunResult)
working → detached(observer mất, Run không đổi) → reattached
working → died(3× absent) | timed-out-idle | timed-out-ceiling | paused-limit  (pane giữ)
```
Tách bạch: pane exists (`pane list`), process exists (`process-info`), shell foreground (`foreground_processes==[]`), agent ready (`agent start` return / `idle|done`), agent working (`working` | activity | log mtime), agent exited (foreground = shell), observer disconnected (client-side).
````

### Full target shown text

````text
```txt
requested → pane-created → agent-starting → agent-ready → briefed(ack) → working
        ↘ start-failed (pane đóng)          ↘ blocked (pane giữ, chờ người)
working → settling(result file xuất hiện) → exited(agent gone) → reconciled(RunResult)
working → detached(observer mất, Run không đổi) → reattached
working → died(3× absent) | timed-out-idle | timed-out-ceiling | paused-limit  (pane giữ)
```
Tách bạch: pane exists (`pane list`), process exists (`process-info`), shell foreground (`foreground_processes==[]`), agent ready (`agent start` return / `idle|done`), agent working (`working` | activity | log mtime), agent exited (foreground = shell), observer disconnected (client-side).
````

## claim_663164526820862d0491d27fb0c9ccab

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#82-readiness-handshake, lines 243–243.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#82-readiness-handshake.
Source digest: ef38fe4a0a68f7ddb4723bfc12351647d65aeaa5d207845a243a5035635ef498
Target digest: ef38fe4a0a68f7ddb4723bfc12351647d65aeaa5d207845a243a5035635ef498
Shown source SHA256: dfcf310f161edb1e0cca88b3b7e552884e7fd2b59e3647ace784bc0c64374e97
Shown target SHA256: dfcf310f161edb1e0cca88b3b7e552884e7fd2b59e3647ace784bc0c64374e97

### Proposed decision

```json
{
  "claimId": "claim_663164526820862d0491d27fb0c9ccab",
  "sourceUnitDigest": "ef38fe4a0a68f7ddb4723bfc12351647d65aeaa5d207845a243a5035635ef498",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "82-readiness-handshake",
  "targetUnitDigest": "ef38fe4a0a68f7ddb4723bfc12351647d65aeaa5d207845a243a5035635ef498",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#82-readiness-handshake (lines 243–243) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#82-readiness-handshake (lines 267–267); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 8.2 Readiness handshake
- Không dùng `idle` một mình. Dùng `herdr agent start <runId> --kind <k> --pane <p> --timeout <ms> [-- <agent args>]` — **đã đo trực tiếp 2026-09-06** (§12b): nó tự chờ shell prompt (hấp thụ boot race, không cần fgOS tự làm gate), tự gõ lệnh đúng, và trả về ready hoặc `agent_not_ready`/`blocked` có lý do trong vài giây. Sau đó mới gate `idle|done`. **Không dùng `pane run` để khởi động agent nữa.**
- Handshake thật = worker ghi `ack-N.json` (tên, runId, round, agent, received_at). Không có ack trong budget → `never-acked` (khác `never-delivered` = stalled).
- Timeout có lý do: `agent_not_ready`, `agent_prompt_stalled`, `blocked:<matched line>`, `never-acked`.
```

### Full target shown text

```text
### 8.2 Readiness handshake
- Không dùng `idle` một mình. Dùng `herdr agent start <runId> --kind <k> --pane <p> --timeout <ms> [-- <agent args>]` — **đã đo trực tiếp 2026-09-06** (§12b): nó tự chờ shell prompt (hấp thụ boot race, không cần fgOS tự làm gate), tự gõ lệnh đúng, và trả về ready hoặc `agent_not_ready`/`blocked` có lý do trong vài giây. Sau đó mới gate `idle|done`. **Không dùng `pane run` để khởi động agent nữa.**
- Handshake thật = worker ghi `ack-N.json` (tên, runId, round, agent, received_at). Không có ack trong budget → `never-acked` (khác `never-delivered` = stalled).
- Timeout có lý do: `agent_not_ready`, `agent_prompt_stalled`, `blocked:<matched line>`, `never-acked`.
```

## claim_86e0aeafc5373327c0f1292db1ee4499

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-42, lines 244–246.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-45.
Source digest: ecd35c332a6e6a3ef7fc3d739ba0144fd38da5385686b1d39ace20bc675c2c84
Target digest: ecd35c332a6e6a3ef7fc3d739ba0144fd38da5385686b1d39ace20bc675c2c84
Shown source SHA256: ecd35c332a6e6a3ef7fc3d739ba0144fd38da5385686b1d39ace20bc675c2c84
Shown target SHA256: ecd35c332a6e6a3ef7fc3d739ba0144fd38da5385686b1d39ace20bc675c2c84

### Proposed decision

```json
{
  "claimId": "claim_86e0aeafc5373327c0f1292db1ee4499",
  "sourceUnitDigest": "ecd35c332a6e6a3ef7fc3d739ba0144fd38da5385686b1d39ace20bc675c2c84",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "ecd35c332a6e6a3ef7fc3d739ba0144fd38da5385686b1d39ace20bc675c2c84",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.2 Readiness handshake"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-42 (lines 244–246) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-45 (lines 268–270); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Không dùng `idle` một mình. Dùng `herdr agent start <runId> --kind <k> --pane <p> --timeout <ms> [-- <agent args>]` — **đã đo trực tiếp 2026-09-06** (§12b): nó tự chờ shell prompt (hấp thụ boot race, không cần fgOS tự làm gate), tự gõ lệnh đúng, và trả về ready hoặc `agent_not_ready`/`blocked` có lý do trong vài giây. Sau đó mới gate `idle|done`. **Không dùng `pane run` để khởi động agent nữa.**
- Handshake thật = worker ghi `ack-N.json` (tên, runId, round, agent, received_at). Không có ack trong budget → `never-acked` (khác `never-delivered` = stalled).
- Timeout có lý do: `agent_not_ready`, `agent_prompt_stalled`, `blocked:<matched line>`, `never-acked`.
```

### Full target shown text

```text
- Không dùng `idle` một mình. Dùng `herdr agent start <runId> --kind <k> --pane <p> --timeout <ms> [-- <agent args>]` — **đã đo trực tiếp 2026-09-06** (§12b): nó tự chờ shell prompt (hấp thụ boot race, không cần fgOS tự làm gate), tự gõ lệnh đúng, và trả về ready hoặc `agent_not_ready`/`blocked` có lý do trong vài giây. Sau đó mới gate `idle|done`. **Không dùng `pane run` để khởi động agent nữa.**
- Handshake thật = worker ghi `ack-N.json` (tên, runId, round, agent, received_at). Không có ack trong budget → `never-acked` (khác `never-delivered` = stalled).
- Timeout có lý do: `agent_not_ready`, `agent_prompt_stalled`, `blocked:<matched line>`, `never-acked`.
```

## claim_046578bb18b04a781cef4a30c0202f67

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#83-contact-protocol-defer-được-nhưng-thiết-kế-shape-ngay-để-mailbox-ackresult-không-phải-làm-lại, lines 248–248.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#83-contact-protocol-defer-được-nhưng-thiết-kế-shape-ngay-để-mailbox-ackresult-không-phải-làm-lại.
Source digest: 6b99818bb16f69d9e75cc8df2dab82a0b66030630da51e3d178bce3746ff846d
Target digest: 6b99818bb16f69d9e75cc8df2dab82a0b66030630da51e3d178bce3746ff846d
Shown source SHA256: dcd9690fb5514b752ec17615ee724d57f7e64df2f0964274da950fbc41c7da8c
Shown target SHA256: dcd9690fb5514b752ec17615ee724d57f7e64df2f0964274da950fbc41c7da8c

### Proposed decision

```json
{
  "claimId": "claim_046578bb18b04a781cef4a30c0202f67",
  "sourceUnitDigest": "6b99818bb16f69d9e75cc8df2dab82a0b66030630da51e3d178bce3746ff846d",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "83-contact-protocol-defer-được-nhưng-thiết-kế-shape-ngay-để-mailbox-ackresult-không-phải-làm-lại",
  "targetUnitDigest": "6b99818bb16f69d9e75cc8df2dab82a0b66030630da51e3d178bce3746ff846d",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#83-contact-protocol-defer-được-nhưng-thiết-kế-shape-ngay-để-mailbox-ackresult-không-phải-làm-lại (lines 248–248) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#83-contact-protocol-defer-được-nhưng-thiết-kế-shape-ngay-để-mailbox-ackresult-không-phải-làm-lại (lines 272–272); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
### 8.3 Contact protocol (defer được, nhưng thiết kế shape ngay để mailbox ack/result không phải làm lại)

```yaml
contact:               # ghi vào .fgos/assignments/<a>/runs/NN/contact/<seq>.json TRƯỚC khi transport
  runId: …
  seq: 7               # đơn điệu tăng per Run
  channel: human | coordinator | system
  kind: question | checkpoint | interrupt | cancel | exit | resume-pointer
  idempotencyKey: …
  payloadRef: contact/7.md   # nội dung ở file, pointer một dòng qua transport
  authorization: {grantRef, epoch}
delivery:              # ack là event thứ hai
  attempts: [{at, method: agent-prompt|hook, result: submitted|stalled|blocked|refused}]
  ackRef: outbox/ack-contact-7.json | null
```
Quy tắc: user message/coordinator request chỉ gửi khi `idle|done`; `interrupt` = `agent send-keys esc|ctrl+c` (cần grant); `cancel` = interrupt + `exit` + reconcile; `exit` = `exitCommand` như hôm nay nhưng chỉ sau `result-N` hoặc cancel. Replay: đọc lại contact dir, gửi lại cái chưa có ack và agent đang ready. Không có timer resend khi `working`.

Trả lời trực tiếp câu hỏi "làm sao agent thường xuyên check message": **agent không check**. Hai cơ chế push: (1) transport push — Dispatch gõ pointer khi agent ready (mọi provider); (2) hook push — provider có `UserPromptSubmit`/`Stop` hook thì hook đọc pending contact và append vào turn kế (claude/pi), là upgrade không phải yêu cầu. Cả hai đều không inject giữa turn.
````

### Full target shown text

````text
### 8.3 Contact protocol (defer được, nhưng thiết kế shape ngay để mailbox ack/result không phải làm lại)

```yaml
contact:               # ghi vào .fgos/assignments/<a>/runs/NN/contact/<seq>.json TRƯỚC khi transport
  runId: …
  seq: 7               # đơn điệu tăng per Run
  channel: human | coordinator | system
  kind: question | checkpoint | interrupt | cancel | exit | resume-pointer
  idempotencyKey: …
  payloadRef: contact/7.md   # nội dung ở file, pointer một dòng qua transport
  authorization: {grantRef, epoch}
delivery:              # ack là event thứ hai
  attempts: [{at, method: agent-prompt|hook, result: submitted|stalled|blocked|refused}]
  ackRef: outbox/ack-contact-7.json | null
```
Quy tắc: user message/coordinator request chỉ gửi khi `idle|done`; `interrupt` = `agent send-keys esc|ctrl+c` (cần grant); `cancel` = interrupt + `exit` + reconcile; `exit` = `exitCommand` như hôm nay nhưng chỉ sau `result-N` hoặc cancel. Replay: đọc lại contact dir, gửi lại cái chưa có ack và agent đang ready. Không có timer resend khi `working`.

Trả lời trực tiếp câu hỏi "làm sao agent thường xuyên check message": **agent không check**. Hai cơ chế push: (1) transport push — Dispatch gõ pointer khi agent ready (mọi provider); (2) hook push — provider có `UserPromptSubmit`/`Stop` hook thì hook đọc pending contact và append vào turn kế (claude/pi), là upgrade không phải yêu cầu. Cả hai đều không inject giữa turn.
````

## claim_a5cd26b0582465f31189d227e4b941fd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-43, lines 250–263.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-46.
Source digest: 68fad0fe954cec264c14e55cdc6817e8a7538c81130c5a03fdf41c3b2c612276
Target digest: 68fad0fe954cec264c14e55cdc6817e8a7538c81130c5a03fdf41c3b2c612276
Shown source SHA256: 68fad0fe954cec264c14e55cdc6817e8a7538c81130c5a03fdf41c3b2c612276
Shown target SHA256: 68fad0fe954cec264c14e55cdc6817e8a7538c81130c5a03fdf41c3b2c612276

### Proposed decision

```json
{
  "claimId": "claim_a5cd26b0582465f31189d227e4b941fd",
  "sourceUnitDigest": "68fad0fe954cec264c14e55cdc6817e8a7538c81130c5a03fdf41c3b2c612276",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "68fad0fe954cec264c14e55cdc6817e8a7538c81130c5a03fdf41c3b2c612276",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.3 Contact protocol (defer được, nhưng thiết kế shape ngay để mailbox ack/result không phải làm lại)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-43 (lines 250–263) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-46 (lines 274–287); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```yaml
contact:               # ghi vào .fgos/assignments/<a>/runs/NN/contact/<seq>.json TRƯỚC khi transport
  runId: …
  seq: 7               # đơn điệu tăng per Run
  channel: human | coordinator | system
  kind: question | checkpoint | interrupt | cancel | exit | resume-pointer
  idempotencyKey: …
  payloadRef: contact/7.md   # nội dung ở file, pointer một dòng qua transport
  authorization: {grantRef, epoch}
delivery:              # ack là event thứ hai
  attempts: [{at, method: agent-prompt|hook, result: submitted|stalled|blocked|refused}]
  ackRef: outbox/ack-contact-7.json | null
```
Quy tắc: user message/coordinator request chỉ gửi khi `idle|done`; `interrupt` = `agent send-keys esc|ctrl+c` (cần grant); `cancel` = interrupt + `exit` + reconcile; `exit` = `exitCommand` như hôm nay nhưng chỉ sau `result-N` hoặc cancel. Replay: đọc lại contact dir, gửi lại cái chưa có ack và agent đang ready. Không có timer resend khi `working`.
````

### Full target shown text

````text
```yaml
contact:               # ghi vào .fgos/assignments/<a>/runs/NN/contact/<seq>.json TRƯỚC khi transport
  runId: …
  seq: 7               # đơn điệu tăng per Run
  channel: human | coordinator | system
  kind: question | checkpoint | interrupt | cancel | exit | resume-pointer
  idempotencyKey: …
  payloadRef: contact/7.md   # nội dung ở file, pointer một dòng qua transport
  authorization: {grantRef, epoch}
delivery:              # ack là event thứ hai
  attempts: [{at, method: agent-prompt|hook, result: submitted|stalled|blocked|refused}]
  ackRef: outbox/ack-contact-7.json | null
```
Quy tắc: user message/coordinator request chỉ gửi khi `idle|done`; `interrupt` = `agent send-keys esc|ctrl+c` (cần grant); `cancel` = interrupt + `exit` + reconcile; `exit` = `exitCommand` như hôm nay nhưng chỉ sau `result-N` hoặc cancel. Replay: đọc lại contact dir, gửi lại cái chưa có ack và agent đang ready. Không có timer resend khi `working`.
````

## claim_6d6601e9d6e11b169ae0fab1a04b03f0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-44, lines 265–265.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-47.
Source digest: 3fb02719d259d1792f0b502f7626d2a14b1b20b963146f4d57fbce01bc41b28a
Target digest: 3fb02719d259d1792f0b502f7626d2a14b1b20b963146f4d57fbce01bc41b28a
Shown source SHA256: 3fb02719d259d1792f0b502f7626d2a14b1b20b963146f4d57fbce01bc41b28a
Shown target SHA256: 3fb02719d259d1792f0b502f7626d2a14b1b20b963146f4d57fbce01bc41b28a

### Proposed decision

```json
{
  "claimId": "claim_6d6601e9d6e11b169ae0fab1a04b03f0",
  "sourceUnitDigest": "3fb02719d259d1792f0b502f7626d2a14b1b20b963146f4d57fbce01bc41b28a",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "3fb02719d259d1792f0b502f7626d2a14b1b20b963146f4d57fbce01bc41b28a",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.3 Contact protocol (defer được, nhưng thiết kế shape ngay để mailbox ack/result không phải làm lại)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-44 (lines 265–265) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-47 (lines 289–289); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Trả lời trực tiếp câu hỏi "làm sao agent thường xuyên check message": **agent không check**. Hai cơ chế push: (1) transport push — Dispatch gõ pointer khi agent ready (mọi provider); (2) hook push — provider có `UserPromptSubmit`/`Stop` hook thì hook đọc pending contact và append vào turn kế (claude/pi), là upgrade không phải yêu cầu. Cả hai đều không inject giữa turn.
```

### Full target shown text

```text
Trả lời trực tiếp câu hỏi "làm sao agent thường xuyên check message": **agent không check**. Hai cơ chế push: (1) transport push — Dispatch gõ pointer khi agent ready (mọi provider); (2) hook push — provider có `UserPromptSubmit`/`Stop` hook thì hook đọc pending contact và append vào turn kế (claude/pi), là upgrade không phải yêu cầu. Cả hai đều không inject giữa turn.
```

## claim_2deaab50c67876ca33bbf53e2e6f9b57

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#84-observer-actor, lines 267–267.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#84-observer-actor.
Source digest: 95f728cec3aeb660438c14ddddd6c9583e0b5c94e9496f0d8f58720fc3307c77
Target digest: 95f728cec3aeb660438c14ddddd6c9583e0b5c94e9496f0d8f58720fc3307c77
Shown source SHA256: d89de17d88c190ce80ab20996a69930069f7df01d24be7f9b1268bbe544adee1
Shown target SHA256: d89de17d88c190ce80ab20996a69930069f7df01d24be7f9b1268bbe544adee1

### Proposed decision

```json
{
  "claimId": "claim_2deaab50c67876ca33bbf53e2e6f9b57",
  "sourceUnitDigest": "95f728cec3aeb660438c14ddddd6c9583e0b5c94e9496f0d8f58720fc3307c77",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "84-observer-actor",
  "targetUnitDigest": "95f728cec3aeb660438c14ddddd6c9583e0b5c94e9496f0d8f58720fc3307c77",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#84-observer-actor (lines 267–267) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#84-observer-actor (lines 291–291); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 8.4 Observer / actor
- Actor = process Dispatch giữ `lease` trong `visibility.json {actorPid, actorHost, leaseUntil}`; hết lease → process khác được takeover (như split-lock của upstream: pid + token).
- Observer: `fgos dispatch watch <runId>` chỉ `agent read`/`pane read`, không bao giờ `prompt`. Quyền observe ≠ contact.
```

### Full target shown text

```text
### 8.4 Observer / actor
- Actor = process Dispatch giữ `lease` trong `visibility.json {actorPid, actorHost, leaseUntil}`; hết lease → process khác được takeover (như split-lock của upstream: pid + token).
- Observer: `fgos dispatch watch <runId>` chỉ `agent read`/`pane read`, không bao giờ `prompt`. Quyền observe ≠ contact.
```

## claim_8b23c4bfef2c6907230783db0d60b63b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-45, lines 268–269.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-48.
Source digest: 6e8a6275dcfee22da7a8e05169b0addb15f6e74addd7ca7a31ccb646797b2d5f
Target digest: 6e8a6275dcfee22da7a8e05169b0addb15f6e74addd7ca7a31ccb646797b2d5f
Shown source SHA256: 6e8a6275dcfee22da7a8e05169b0addb15f6e74addd7ca7a31ccb646797b2d5f
Shown target SHA256: 6e8a6275dcfee22da7a8e05169b0addb15f6e74addd7ca7a31ccb646797b2d5f

### Proposed decision

```json
{
  "claimId": "claim_8b23c4bfef2c6907230783db0d60b63b",
  "sourceUnitDigest": "6e8a6275dcfee22da7a8e05169b0addb15f6e74addd7ca7a31ccb646797b2d5f",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "6e8a6275dcfee22da7a8e05169b0addb15f6e74addd7ca7a31ccb646797b2d5f",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.4 Observer / actor"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-45 (lines 268–269) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-48 (lines 292–293); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Actor = process Dispatch giữ `lease` trong `visibility.json {actorPid, actorHost, leaseUntil}`; hết lease → process khác được takeover (như split-lock của upstream: pid + token).
- Observer: `fgos dispatch watch <runId>` chỉ `agent read`/`pane read`, không bao giờ `prompt`. Quyền observe ≠ contact.
```

### Full target shown text

```text
- Actor = process Dispatch giữ `lease` trong `visibility.json {actorPid, actorHost, leaseUntil}`; hết lease → process khác được takeover (như split-lock của upstream: pid + token).
- Observer: `fgos dispatch watch <runId>` chỉ `agent read`/`pane read`, không bao giờ `prompt`. Quyền observe ≠ contact.
```

## claim_f3bae77a59b47b7e1178f3918d394e43

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#85-output-channels, lines 271–271.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#85-output-channels.
Source digest: ec4a179bbf5fe1496e4d516de7b749c8e38ecef99b407d6b402c73fd147243db
Target digest: ec4a179bbf5fe1496e4d516de7b749c8e38ecef99b407d6b402c73fd147243db
Shown source SHA256: 1ac6184e15a73b60d76f07f54b4ca3a2502612f438f9eaf7d377a5aad5c3cac1
Shown target SHA256: 1ac6184e15a73b60d76f07f54b4ca3a2502612f438f9eaf7d377a5aad5c3cac1

### Proposed decision

```json
{
  "claimId": "claim_f3bae77a59b47b7e1178f3918d394e43",
  "sourceUnitDigest": "ec4a179bbf5fe1496e4d516de7b749c8e38ecef99b407d6b402c73fd147243db",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "85-output-channels",
  "targetUnitDigest": "ec4a179bbf5fe1496e4d516de7b749c8e38ecef99b407d6b402c73fd147243db",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#85-output-channels (lines 271–271) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#85-output-channels (lines 295–295); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 8.5 Output channels
| Kênh | Nguồn | Vai trò |
|---|---|---|
| live display | pane thật / `agent read` | người xem |
| control events | `contact/`, `visibility.json`, Run events | lifecycle |
| canonical result | outbox `result-N.json`, `report-N.md`, `evidence.json` | truth |
| diagnostic | tail màn hình khi wait give-up, `stderr` của herdr CLI | giải thích, không quyết định |
```

### Full target shown text

```text
### 8.5 Output channels
| Kênh | Nguồn | Vai trò |
|---|---|---|
| live display | pane thật / `agent read` | người xem |
| control events | `contact/`, `visibility.json`, Run events | lifecycle |
| canonical result | outbox `result-N.json`, `report-N.md`, `evidence.json` | truth |
| diagnostic | tail màn hình khi wait give-up, `stderr` của herdr CLI | giải thích, không quyết định |
```

## claim_106e7c14d65f1b532409b75139065136

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-46, lines 272–277.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-49.
Source digest: 7458f859c3caccfe568224183c007dccf9d04b0da4a30c9531786fb69f1d200f
Target digest: 7458f859c3caccfe568224183c007dccf9d04b0da4a30c9531786fb69f1d200f
Shown source SHA256: 7458f859c3caccfe568224183c007dccf9d04b0da4a30c9531786fb69f1d200f
Shown target SHA256: 7458f859c3caccfe568224183c007dccf9d04b0da4a30c9531786fb69f1d200f

### Proposed decision

```json
{
  "claimId": "claim_106e7c14d65f1b532409b75139065136",
  "sourceUnitDigest": "7458f859c3caccfe568224183c007dccf9d04b0da4a30c9531786fb69f1d200f",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "7458f859c3caccfe568224183c007dccf9d04b0da4a30c9531786fb69f1d200f",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.5 Output channels"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-46 (lines 272–277) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-49 (lines 296–301); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Kênh | Nguồn | Vai trò |
|---|---|---|
| live display | pane thật / `agent read` | người xem |
| control events | `contact/`, `visibility.json`, Run events | lifecycle |
| canonical result | outbox `result-N.json`, `report-N.md`, `evidence.json` | truth |
| diagnostic | tail màn hình khi wait give-up, `stderr` của herdr CLI | giải thích, không quyết định |
```

### Full target shown text

```text
| Kênh | Nguồn | Vai trò |
|---|---|---|
| live display | pane thật / `agent read` | người xem |
| control events | `contact/`, `visibility.json`, Run events | lifecycle |
| canonical result | outbox `result-N.json`, `report-N.md`, `evidence.json` | truth |
| diagnostic | tail màn hình khi wait give-up, `stderr` của herdr CLI | giải thích, không quyết định |
```

## claim_9d6436f077a34d81f0348c4de405204b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#86-gateway-resilience, lines 279–279.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#86-gateway-resilience.
Source digest: 0d9f615619280e66fdc7b026c656fd09876553abf591a4e5eca21a7f78f388da
Target digest: 0d9f615619280e66fdc7b026c656fd09876553abf591a4e5eca21a7f78f388da
Shown source SHA256: 18478db237b2714c5ca218b145f962544c89dac14fa322537cebdd82cb82bc8d
Shown target SHA256: 18478db237b2714c5ca218b145f962544c89dac14fa322537cebdd82cb82bc8d

### Proposed decision

```json
{
  "claimId": "claim_9d6436f077a34d81f0348c4de405204b",
  "sourceUnitDigest": "0d9f615619280e66fdc7b026c656fd09876553abf591a4e5eca21a7f78f388da",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "86-gateway-resilience",
  "targetUnitDigest": "0d9f615619280e66fdc7b026c656fd09876553abf591a4e5eca21a7f78f388da",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#86-gateway-resilience (lines 279–279) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#86-gateway-resilience (lines 303–303); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 8.6 Gateway resilience
- `visibility.json` persist: `paneId, terminalId, agentName(=runId), agentSession{kind,value,source}, startedAt, actor lease`.
- Reattach: `agent list` → match `pane_id` rồi `agent_session.value`; `state_change_seq` để phát hiện đổi trạng thái khi vắng mặt.
- Stale handle: pane id không tái sử dụng (herdr) → stale = "không còn trong list", không bao giờ trỏ nhầm pane khác.
- Không relaunch khi reattach; relaunch chỉ là Run/round mới có lineage.
- `pane.agent_status_changed` (socket `SubscriptionEventKind`) chỉ được dùng làm **gợi ý độ trễ** để rút ngắn chu kỳ poll, **không** thay poll: upstream đã thử và từ chối event stream làm nguồn quyết định (edge-triggered — bỏ lỡ một edge là sai mãi; im lặng không phân biệt được với `working`; không nói gì về result file). Poll là level-triggered, tự sửa. Probe P4 đo độ trễ, không đo tính đúng.
- Start retry: `agent start` gặp `agent_pane_busy` (shell chưa boot) → retry bounded (~10 lần, ~1 s) — upstream herding-start-retry D1.
- Liveness read mỗi ~10 tick, died sau 3 lần absent liên tiếp, một lần `unknown` reset đếm.
```

### Full target shown text

```text
### 8.6 Gateway resilience
- `visibility.json` persist: `paneId, terminalId, agentName(=runId), agentSession{kind,value,source}, startedAt, actor lease`.
- Reattach: `agent list` → match `pane_id` rồi `agent_session.value`; `state_change_seq` để phát hiện đổi trạng thái khi vắng mặt.
- Stale handle: pane id không tái sử dụng (herdr) → stale = "không còn trong list", không bao giờ trỏ nhầm pane khác.
- Không relaunch khi reattach; relaunch chỉ là Run/round mới có lineage.
- `pane.agent_status_changed` (socket `SubscriptionEventKind`) chỉ được dùng làm **gợi ý độ trễ** để rút ngắn chu kỳ poll, **không** thay poll: upstream đã thử và từ chối event stream làm nguồn quyết định (edge-triggered — bỏ lỡ một edge là sai mãi; im lặng không phân biệt được với `working`; không nói gì về result file). Poll là level-triggered, tự sửa. Probe P4 đo độ trễ, không đo tính đúng.
- Start retry: `agent start` gặp `agent_pane_busy` (shell chưa boot) → retry bounded (~10 lần, ~1 s) — upstream herding-start-retry D1.
- Liveness read mỗi ~10 tick, died sau 3 lần absent liên tiếp, một lần `unknown` reset đếm.
```

## claim_feffaa7d3eee029b49f5a7568ddd7fd6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-47, lines 280–286.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-50.
Source digest: b801745eb96ff8aa1107e5263a282a2438e21cc5742a5f94ce596d2b14b8d775
Target digest: b801745eb96ff8aa1107e5263a282a2438e21cc5742a5f94ce596d2b14b8d775
Shown source SHA256: b801745eb96ff8aa1107e5263a282a2438e21cc5742a5f94ce596d2b14b8d775
Shown target SHA256: b801745eb96ff8aa1107e5263a282a2438e21cc5742a5f94ce596d2b14b8d775

### Proposed decision

```json
{
  "claimId": "claim_feffaa7d3eee029b49f5a7568ddd7fd6",
  "sourceUnitDigest": "b801745eb96ff8aa1107e5263a282a2438e21cc5742a5f94ce596d2b14b8d775",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "b801745eb96ff8aa1107e5263a282a2438e21cc5742a5f94ce596d2b14b8d775",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.6 Gateway resilience"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-47 (lines 280–286) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-50 (lines 304–310); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- `visibility.json` persist: `paneId, terminalId, agentName(=runId), agentSession{kind,value,source}, startedAt, actor lease`.
- Reattach: `agent list` → match `pane_id` rồi `agent_session.value`; `state_change_seq` để phát hiện đổi trạng thái khi vắng mặt.
- Stale handle: pane id không tái sử dụng (herdr) → stale = "không còn trong list", không bao giờ trỏ nhầm pane khác.
- Không relaunch khi reattach; relaunch chỉ là Run/round mới có lineage.
- `pane.agent_status_changed` (socket `SubscriptionEventKind`) chỉ được dùng làm **gợi ý độ trễ** để rút ngắn chu kỳ poll, **không** thay poll: upstream đã thử và từ chối event stream làm nguồn quyết định (edge-triggered — bỏ lỡ một edge là sai mãi; im lặng không phân biệt được với `working`; không nói gì về result file). Poll là level-triggered, tự sửa. Probe P4 đo độ trễ, không đo tính đúng.
- Start retry: `agent start` gặp `agent_pane_busy` (shell chưa boot) → retry bounded (~10 lần, ~1 s) — upstream herding-start-retry D1.
- Liveness read mỗi ~10 tick, died sau 3 lần absent liên tiếp, một lần `unknown` reset đếm.
```

### Full target shown text

```text
- `visibility.json` persist: `paneId, terminalId, agentName(=runId), agentSession{kind,value,source}, startedAt, actor lease`.
- Reattach: `agent list` → match `pane_id` rồi `agent_session.value`; `state_change_seq` để phát hiện đổi trạng thái khi vắng mặt.
- Stale handle: pane id không tái sử dụng (herdr) → stale = "không còn trong list", không bao giờ trỏ nhầm pane khác.
- Không relaunch khi reattach; relaunch chỉ là Run/round mới có lineage.
- `pane.agent_status_changed` (socket `SubscriptionEventKind`) chỉ được dùng làm **gợi ý độ trễ** để rút ngắn chu kỳ poll, **không** thay poll: upstream đã thử và từ chối event stream làm nguồn quyết định (edge-triggered — bỏ lỡ một edge là sai mãi; im lặng không phân biệt được với `working`; không nói gì về result file). Poll là level-triggered, tự sửa. Probe P4 đo độ trễ, không đo tính đúng.
- Start retry: `agent start` gặp `agent_pane_busy` (shell chưa boot) → retry bounded (~10 lần, ~1 s) — upstream herding-start-retry D1.
- Liveness read mỗi ~10 tick, died sau 3 lần absent liên tiếp, một lần `unknown` reset đếm.
```

## claim_00c9fe0ecb4e617994b8b9885694971c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#87-process-ownership, lines 288–288.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#87-process-ownership.
Source digest: 6751f009c2f0b4343dc00eee24543921bae6a4100ab585c04a81cbab3bda54b1
Target digest: 6751f009c2f0b4343dc00eee24543921bae6a4100ab585c04a81cbab3bda54b1
Shown source SHA256: 1c7a07a443cf660cbd390ea9d5ecf52afe5ec4b8fdcabdb8980cd9edbad32a83
Shown target SHA256: 1c7a07a443cf660cbd390ea9d5ecf52afe5ec4b8fdcabdb8980cd9edbad32a83

### Proposed decision

```json
{
  "claimId": "claim_00c9fe0ecb4e617994b8b9885694971c",
  "sourceUnitDigest": "6751f009c2f0b4343dc00eee24543921bae6a4100ab585c04a81cbab3bda54b1",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "87-process-ownership",
  "targetUnitDigest": "6751f009c2f0b4343dc00eee24543921bae6a4100ab585c04a81cbab3bda54b1",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#87-process-ownership (lines 288–288) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#87-process-ownership (lines 312–312); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 8.7 Process ownership
- Chấp nhận: agent là con của herdr server. Bù: liveness qua `process-info`; cancel = `send-keys ctrl+c` → chờ → `pane close`; orphan detection = pane còn mà Run đã reconciled → sweep có báo cáo; unknown outcome → `pending-reconciliation` trên RunResult (đã có trong dispatch contract), không retry mù.
- Nếu cần kill cứng: worker pane chạy trong herdr `--session fgos-worker-<runId>` riêng để `session` có thể bị stop độc lập — probe P5.
```

### Full target shown text

```text
### 8.7 Process ownership
- Chấp nhận: agent là con của herdr server. Bù: liveness qua `process-info`; cancel = `send-keys ctrl+c` → chờ → `pane close`; orphan detection = pane còn mà Run đã reconciled → sweep có báo cáo; unknown outcome → `pending-reconciliation` trên RunResult (đã có trong dispatch contract), không retry mù.
- Nếu cần kill cứng: worker pane chạy trong herdr `--session fgos-worker-<runId>` riêng để `session` có thể bị stop độc lập — probe P5.
```

## claim_11b6275af8a6fc07a05c666583441928

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-48, lines 289–290.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-51.
Source digest: 5b073bae99374c4cc89789fac310303b93fddab8da679a6e375844fd51e5f537
Target digest: 5b073bae99374c4cc89789fac310303b93fddab8da679a6e375844fd51e5f537
Shown source SHA256: 5b073bae99374c4cc89789fac310303b93fddab8da679a6e375844fd51e5f537
Shown target SHA256: 5b073bae99374c4cc89789fac310303b93fddab8da679a6e375844fd51e5f537

### Proposed decision

```json
{
  "claimId": "claim_11b6275af8a6fc07a05c666583441928",
  "sourceUnitDigest": "5b073bae99374c4cc89789fac310303b93fddab8da679a6e375844fd51e5f537",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "5b073bae99374c4cc89789fac310303b93fddab8da679a6e375844fd51e5f537",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.7 Process ownership"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-48 (lines 289–290) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-51 (lines 313–314); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Chấp nhận: agent là con của herdr server. Bù: liveness qua `process-info`; cancel = `send-keys ctrl+c` → chờ → `pane close`; orphan detection = pane còn mà Run đã reconciled → sweep có báo cáo; unknown outcome → `pending-reconciliation` trên RunResult (đã có trong dispatch contract), không retry mù.
- Nếu cần kill cứng: worker pane chạy trong herdr `--session fgos-worker-<runId>` riêng để `session` có thể bị stop độc lập — probe P5.
```

### Full target shown text

```text
- Chấp nhận: agent là con của herdr server. Bù: liveness qua `process-info`; cancel = `send-keys ctrl+c` → chờ → `pane close`; orphan detection = pane còn mà Run đã reconciled → sweep có báo cáo; unknown outcome → `pending-reconciliation` trên RunResult (đã có trong dispatch contract), không retry mù.
- Nếu cần kill cứng: worker pane chạy trong herdr `--session fgos-worker-<runId>` riêng để `session` có thể bị stop độc lập — probe P5.
```

## claim_eb95cee159804cf2b74be0fb79b018df

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#88-interactive-cli-constraints, lines 292–292.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#88-interactive-cli-constraints.
Source digest: 7d8ce6b7026eb6e0e39c5e8e3d8803fe79491b5f351f76da1a97d1755493404c
Target digest: 7d8ce6b7026eb6e0e39c5e8e3d8803fe79491b5f351f76da1a97d1755493404c
Shown source SHA256: fdceec23b549e320d167137d1918ce8e4b45f3973f9101342d31c88ed86bd2af
Shown target SHA256: fdceec23b549e320d167137d1918ce8e4b45f3973f9101342d31c88ed86bd2af

### Proposed decision

```json
{
  "claimId": "claim_eb95cee159804cf2b74be0fb79b018df",
  "sourceUnitDigest": "7d8ce6b7026eb6e0e39c5e8e3d8803fe79491b5f351f76da1a97d1755493404c",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "88-interactive-cli-constraints",
  "targetUnitDigest": "7d8ce6b7026eb6e0e39c5e8e3d8803fe79491b5f351f76da1a97d1755493404c",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#88-interactive-cli-constraints (lines 292–292) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#88-interactive-cli-constraints (lines 316–316); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 8.8 Interactive CLI constraints
- Private state: bind scratch riêng (P00.1 Known Limitation), không HOME thật.
- Alt-screen: chấp nhận mất, evidence ở file.
- Kích thước: floor 60 cột, split DOWN trong cột worker, không ăn pane người (upstream đo).
- stdin: không dùng `pane run` cho prompt; chỉ `agent prompt` pointer một dòng.
- Prompt echo: không dùng echo làm receipt.
- Shell foreground: `exit` chỉ sau khi `foreground == shell` (đã có).
- Provider startup: `--kind` theo integration (herdr có `antigravity-cli`), trust store pre-seed.
- Env: allowlist; **không** inject `HERDR_*` của cockpit vào worker (ngăn worker điều khiển pane người).
```

### Full target shown text

```text
### 8.8 Interactive CLI constraints
- Private state: bind scratch riêng (P00.1 Known Limitation), không HOME thật.
- Alt-screen: chấp nhận mất, evidence ở file.
- Kích thước: floor 60 cột, split DOWN trong cột worker, không ăn pane người (upstream đo).
- stdin: không dùng `pane run` cho prompt; chỉ `agent prompt` pointer một dòng.
- Prompt echo: không dùng echo làm receipt.
- Shell foreground: `exit` chỉ sau khi `foreground == shell` (đã có).
- Provider startup: `--kind` theo integration (herdr có `antigravity-cli`), trust store pre-seed.
- Env: allowlist; **không** inject `HERDR_*` của cockpit vào worker (ngăn worker điều khiển pane người).
```

## claim_8f42e77201afa646a72da96a959a745f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-49, lines 293–300.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-52.
Source digest: b88464a15d970b7ebc650676b819a07a6d19d48c56bd962d609700a653dddb5f
Target digest: b88464a15d970b7ebc650676b819a07a6d19d48c56bd962d609700a653dddb5f
Shown source SHA256: b88464a15d970b7ebc650676b819a07a6d19d48c56bd962d609700a653dddb5f
Shown target SHA256: b88464a15d970b7ebc650676b819a07a6d19d48c56bd962d609700a653dddb5f

### Proposed decision

```json
{
  "claimId": "claim_8f42e77201afa646a72da96a959a745f",
  "sourceUnitDigest": "b88464a15d970b7ebc650676b819a07a6d19d48c56bd962d609700a653dddb5f",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "b88464a15d970b7ebc650676b819a07a6d19d48c56bd962d609700a653dddb5f",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.8 Interactive CLI constraints"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-49 (lines 293–300) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-52 (lines 317–324); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
- Private state: bind scratch riêng (P00.1 Known Limitation), không HOME thật.
- Alt-screen: chấp nhận mất, evidence ở file.
- Kích thước: floor 60 cột, split DOWN trong cột worker, không ăn pane người (upstream đo).
- stdin: không dùng `pane run` cho prompt; chỉ `agent prompt` pointer một dòng.
- Prompt echo: không dùng echo làm receipt.
- Shell foreground: `exit` chỉ sau khi `foreground == shell` (đã có).
- Provider startup: `--kind` theo integration (herdr có `antigravity-cli`), trust store pre-seed.
- Env: allowlist; **không** inject `HERDR_*` của cockpit vào worker (ngăn worker điều khiển pane người).
```

### Full target shown text

```text
- Private state: bind scratch riêng (P00.1 Known Limitation), không HOME thật.
- Alt-screen: chấp nhận mất, evidence ở file.
- Kích thước: floor 60 cột, split DOWN trong cột worker, không ăn pane người (upstream đo).
- stdin: không dùng `pane run` cho prompt; chỉ `agent prompt` pointer một dòng.
- Prompt echo: không dùng echo làm receipt.
- Shell foreground: `exit` chỉ sau khi `foreground == shell` (đã có).
- Provider startup: `--kind` theo integration (herdr có `antigravity-cli`), trust store pre-seed.
- Env: allowlist; **không** inject `HERDR_*` của cockpit vào worker (ngăn worker điều khiển pane người).
```

## claim_28d697c4e02b0b36efbf68848027f200

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#89-testproof-matrix, lines 302–302.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#89-testproof-matrix.
Source digest: 38c5b0ed3e1adc5c710a99291e0ca1dcf14afea567478cd14b076df6a1107be9
Target digest: 38c5b0ed3e1adc5c710a99291e0ca1dcf14afea567478cd14b076df6a1107be9
Shown source SHA256: be91c908c2beccb888bb4d1c0ea11687026a871fc8fcb168e8cce0c20cf98350
Shown target SHA256: be91c908c2beccb888bb4d1c0ea11687026a871fc8fcb168e8cce0c20cf98350

### Proposed decision

```json
{
  "claimId": "claim_28d697c4e02b0b36efbf68848027f200",
  "sourceUnitDigest": "38c5b0ed3e1adc5c710a99291e0ca1dcf14afea567478cd14b076df6a1107be9",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "89-testproof-matrix",
  "targetUnitDigest": "38c5b0ed3e1adc5c710a99291e0ca1dcf14afea567478cd14b076df6a1107be9",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#89-testproof-matrix (lines 302–302) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#89-testproof-matrix (lines 326–326); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 8.9 Test/proof matrix

| Case | Fake herdr | Live |
|---|---|---|
| startup race (idle trước ready) | seq `unknown,idle,working,…` + ack muộn | agy, claude |
| delayed readiness / `agent_not_ready` | | trust dialog cố ý |
| output redraw | | alt-screen, đọc report file |
| gateway restart / reattach | `agent list` đổi seq | herdr `server stop` + start |
| duplicate contact / lost ack | seq trùng, ack thiếu | |
| pane id reuse | id mới sau close | |
| process descendant còn sống | process-info fake | `sleep` con |
| crash trước/sau RunResult | kill dispatch process | |
| resume same session | agent_session persist | `claude --resume` |
| observer-only reconnect | không tạo contact event | |
| malicious contact/control | worker gõ "ack" giả vào pane | worker gọi `herdr pane run` sang pane khác |

---
```

### Full target shown text

```text
### 8.9 Test/proof matrix

| Case | Fake herdr | Live |
|---|---|---|
| startup race (idle trước ready) | seq `unknown,idle,working,…` + ack muộn | agy, claude |
| delayed readiness / `agent_not_ready` | | trust dialog cố ý |
| output redraw | | alt-screen, đọc report file |
| gateway restart / reattach | `agent list` đổi seq | herdr `server stop` + start |
| duplicate contact / lost ack | seq trùng, ack thiếu | |
| pane id reuse | id mới sau close | |
| process descendant còn sống | process-info fake | `sleep` con |
| crash trước/sau RunResult | kill dispatch process | |
| resume same session | agent_session persist | `claude --resume` |
| observer-only reconnect | không tạo contact event | |
| malicious contact/control | worker gõ "ack" giả vào pane | worker gọi `herdr pane run` sang pane khác |

---
```

## claim_1ea576a5c63077c51b878a10bfe51a5a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-50, lines 304–318.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-53.
Source digest: 246fa77c5084684015a20e852dcea9ba151dc653ea05dbce04d5f4e1cb9fea39
Target digest: 246fa77c5084684015a20e852dcea9ba151dc653ea05dbce04d5f4e1cb9fea39
Shown source SHA256: 246fa77c5084684015a20e852dcea9ba151dc653ea05dbce04d5f4e1cb9fea39
Shown target SHA256: 246fa77c5084684015a20e852dcea9ba151dc653ea05dbce04d5f4e1cb9fea39

### Proposed decision

```json
{
  "claimId": "claim_1ea576a5c63077c51b878a10bfe51a5a",
  "sourceUnitDigest": "246fa77c5084684015a20e852dcea9ba151dc653ea05dbce04d5f4e1cb9fea39",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "246fa77c5084684015a20e852dcea9ba151dc653ea05dbce04d5f4e1cb9fea39",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8. Brainstorm ổn định hoá herdr-spawn theo lớp",
    "8.9 Test/proof matrix"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-50 (lines 304–318) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-53 (lines 328–342); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Case | Fake herdr | Live |
|---|---|---|
| startup race (idle trước ready) | seq `unknown,idle,working,…` + ack muộn | agy, claude |
| delayed readiness / `agent_not_ready` | | trust dialog cố ý |
| output redraw | | alt-screen, đọc report file |
| gateway restart / reattach | `agent list` đổi seq | herdr `server stop` + start |
| duplicate contact / lost ack | seq trùng, ack thiếu | |
| pane id reuse | id mới sau close | |
| process descendant còn sống | process-info fake | `sleep` con |
| crash trước/sau RunResult | kill dispatch process | |
| resume same session | agent_session persist | `claude --resume` |
| observer-only reconnect | không tạo contact event | |
| malicious contact/control | worker gõ "ack" giả vào pane | worker gọi `herdr pane run` sang pane khác |

---
```

### Full target shown text

```text
| Case | Fake herdr | Live |
|---|---|---|
| startup race (idle trước ready) | seq `unknown,idle,working,…` + ack muộn | agy, claude |
| delayed readiness / `agent_not_ready` | | trust dialog cố ý |
| output redraw | | alt-screen, đọc report file |
| gateway restart / reattach | `agent list` đổi seq | herdr `server stop` + start |
| duplicate contact / lost ack | seq trùng, ack thiếu | |
| pane id reuse | id mới sau close | |
| process descendant còn sống | process-info fake | `sleep` con |
| crash trước/sau RunResult | kill dispatch process | |
| resume same session | agent_session persist | `claude --resume` |
| observer-only reconnect | không tạo contact event | |
| malicious contact/control | worker gõ "ack" giả vào pane | worker gọi `herdr pane run` sang pane khác |

---
```

## claim_a7595c1d204d4b8ebf69c1c107a0782a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b-giải-pháp-cụ-thể-đề-xuất-brainstorm-thành-thiết-kế-chạy-được, lines 320–320.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b-giải-pháp-cụ-thể-đề-xuất-brainstorm-thành-thiết-kế-chạy-được.
Source digest: 0bd741a3af151e22457e91e9e7eb9a19c33267d2928c1b4b7f613251f08d989c
Target digest: 0bd741a3af151e22457e91e9e7eb9a19c33267d2928c1b4b7f613251f08d989c
Shown source SHA256: 2b46e19bbd2bb5b36ac1dcef33a51604ee1c55798110cdcf8478d4b22bbad88f
Shown target SHA256: 2b46e19bbd2bb5b36ac1dcef33a51604ee1c55798110cdcf8478d4b22bbad88f

### Proposed decision

```json
{
  "claimId": "claim_a7595c1d204d4b8ebf69c1c107a0782a",
  "sourceUnitDigest": "0bd741a3af151e22457e91e9e7eb9a19c33267d2928c1b4b7f613251f08d989c",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "8b-giải-pháp-cụ-thể-đề-xuất-brainstorm-thành-thiết-kế-chạy-được",
  "targetUnitDigest": "0bd741a3af151e22457e91e9e7eb9a19c33267d2928c1b4b7f613251f08d989c",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b-giải-pháp-cụ-thể-đề-xuất-brainstorm-thành-thiết-kế-chạy-được (lines 320–320) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b-giải-pháp-cụ-thể-đề-xuất-brainstorm-thành-thiết-kế-chạy-được (lines 344–344); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 8b. Giải pháp cụ thể đề xuất (brainstorm thành thiết kế chạy được)

Nguyên tắc chọn: **simple** (một run dir, file thường, không daemon, không bus), **flexible** (mechanism khai capability, provider hook là upgrade), **ổn định** (mọi receipt do receiver ghi; mọi timeout có lý do; forensics giữ lại).
```

### Full target shown text

```text
## 8b. Giải pháp cụ thể đề xuất (brainstorm thành thiết kế chạy được)

Nguyên tắc chọn: **simple** (một run dir, file thường, không daemon, không bus), **flexible** (mechanism khai capability, provider hook là upgrade), **ổn định** (mọi receipt do receiver ghi; mọi timeout có lý do; forensics giữ lại).
```

## claim_dfafc53bbaa8f93a167dd5cbf1a2a637

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-51, lines 322–322.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-54.
Source digest: 541a997abe4ee5b37f0d0507e229ea94c2157dbc2c207a4ee4e02736e1e40bd6
Target digest: 541a997abe4ee5b37f0d0507e229ea94c2157dbc2c207a4ee4e02736e1e40bd6
Shown source SHA256: 541a997abe4ee5b37f0d0507e229ea94c2157dbc2c207a4ee4e02736e1e40bd6
Shown target SHA256: 541a997abe4ee5b37f0d0507e229ea94c2157dbc2c207a4ee4e02736e1e40bd6

### Proposed decision

```json
{
  "claimId": "claim_dfafc53bbaa8f93a167dd5cbf1a2a637",
  "sourceUnitDigest": "541a997abe4ee5b37f0d0507e229ea94c2157dbc2c207a4ee4e02736e1e40bd6",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "541a997abe4ee5b37f0d0507e229ea94c2157dbc2c207a4ee4e02736e1e40bd6",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8b. Giải pháp cụ thể đề xuất (brainstorm thành thiết kế chạy được)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-51 (lines 322–322) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-54 (lines 346–346); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Nguyên tắc chọn: **simple** (một run dir, file thường, không daemon, không bus), **flexible** (mechanism khai capability, provider hook là upgrade), **ổn định** (mọi receipt do receiver ghi; mọi timeout có lý do; forensics giữ lại).
```

### Full target shown text

```text
Nguyên tắc chọn: **simple** (một run dir, file thường, không daemon, không bus), **flexible** (mechanism khai capability, provider hook là upgrade), **ổn định** (mọi receipt do receiver ghi; mọi timeout có lý do; forensics giữ lại).
```

## claim_c6257d746818bfabb5ca7fb375177883

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b1-ba-mức-mỗi-mức-tự-đứng-được, lines 324–324.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b1-ba-mức-mỗi-mức-tự-đứng-được.
Source digest: 2fe27a1642b3e62f6acb5c83bba7988c25ae946d846e852a69760980aad41675
Target digest: 2fe27a1642b3e62f6acb5c83bba7988c25ae946d846e852a69760980aad41675
Shown source SHA256: 3bfa7fa7fb9e80e2d2406048db756c56349b13ffc09a3cb91e28b67b8d66fab7
Shown target SHA256: 3bfa7fa7fb9e80e2d2406048db756c56349b13ffc09a3cb91e28b67b8d66fab7

### Proposed decision

```json
{
  "claimId": "claim_c6257d746818bfabb5ca7fb375177883",
  "sourceUnitDigest": "2fe27a1642b3e62f6acb5c83bba7988c25ae946d846e852a69760980aad41675",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "8b1-ba-mức-mỗi-mức-tự-đứng-được",
  "targetUnitDigest": "2fe27a1642b3e62f6acb5c83bba7988c25ae946d846e852a69760980aad41675",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8b. Giải pháp cụ thể đề xuất (brainstorm thành thiết kế chạy được)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b1-ba-mức-mỗi-mức-tự-đứng-được (lines 324–324) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b1-ba-mức-mỗi-mức-tự-đứng-được (lines 348–348); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
### 8b.1 Ba mức, mỗi mức tự đứng được

| Mức | Có gì | Cần code ở đâu | Trả lời câu hỏi nào |
|---|---|---|---|
| **V0 — visibility không cần contact** | `visibility.json` persist binding; brief-as-file + pointer; ack/result file receipt; ladder poll; pane forensics; `fgos dispatch show-run <runId>` + `watch` (read-only) | `transport.mjs` (viết lại `herdrSpawnInteractiveAdapter`), `assignment-runner.mjs` (ghi visibility.json, cập nhật run.json status), 2 verb read-only | "Có làm visibility mà không cần contact không?" — **Có, đây là V0.** |
| **V1 — contact tối thiểu** | `contact/<seq>.json` + verb `fgos dispatch contact <runId> --kind question|exit|interrupt`; delivery = pointer khi `idle|done`; ack = `outbox/ack-contact-<seq>.json` | thêm 1 verb + 1 hàm delivery dùng lại pointer path của V0 | "Contact có phát sinh nhiều vấn đề không?" — ít, vì V1 chỉ dùng lại đúng đường pointer của V0 |
| **V2 — hook-based (per executor)** | hook `UserPromptSubmit`/`Stop` của provider đọc `contact/` pending, append vào turn kế, ghi `activity.json` | hook script trong plugin fgOS (claude), integration của herdr (pi); agy: không | "Làm sao agent thường xuyên check message?" — **agent không check; hook đưa vào turn boundary** |
```

### Full target shown text

```text
### 8b.1 Ba mức, mỗi mức tự đứng được

| Mức | Có gì | Cần code ở đâu | Trả lời câu hỏi nào |
|---|---|---|---|
| **V0 — visibility không cần contact** | `visibility.json` persist binding; brief-as-file + pointer; ack/result file receipt; ladder poll; pane forensics; `fgos dispatch show-run <runId>` + `watch` (read-only) | `transport.mjs` (viết lại `herdrSpawnInteractiveAdapter`), `assignment-runner.mjs` (ghi visibility.json, cập nhật run.json status), 2 verb read-only | "Có làm visibility mà không cần contact không?" — **Có, đây là V0.** |
| **V1 — contact tối thiểu** | `contact/<seq>.json` + verb `fgos dispatch contact <runId> --kind question|exit|interrupt`; delivery = pointer khi `idle|done`; ack = `outbox/ack-contact-<seq>.json` | thêm 1 verb + 1 hàm delivery dùng lại pointer path của V0 | "Contact có phát sinh nhiều vấn đề không?" — ít, vì V1 chỉ dùng lại đúng đường pointer của V0 |
| **V2 — hook-based (per executor)** | hook `UserPromptSubmit`/`Stop` của provider đọc `contact/` pending, append vào turn kế, ghi `activity.json` | hook script trong plugin fgOS (claude), integration của herdr (pi); agy: không | "Làm sao agent thường xuyên check message?" — **agent không check; hook đưa vào turn boundary** |
```

## claim_fe3c334de86e2f51a2441cc5dc76bd75

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-52, lines 326–330.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-55.
Source digest: 5d48fb6e7189d441134fb4c9aa71671f48482c0d6a1c58ed8038ef447add7b1e
Target digest: 5d48fb6e7189d441134fb4c9aa71671f48482c0d6a1c58ed8038ef447add7b1e
Shown source SHA256: 5d48fb6e7189d441134fb4c9aa71671f48482c0d6a1c58ed8038ef447add7b1e
Shown target SHA256: 5d48fb6e7189d441134fb4c9aa71671f48482c0d6a1c58ed8038ef447add7b1e

### Proposed decision

```json
{
  "claimId": "claim_fe3c334de86e2f51a2441cc5dc76bd75",
  "sourceUnitDigest": "5d48fb6e7189d441134fb4c9aa71671f48482c0d6a1c58ed8038ef447add7b1e",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "5d48fb6e7189d441134fb4c9aa71671f48482c0d6a1c58ed8038ef447add7b1e",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8b. Giải pháp cụ thể đề xuất (brainstorm thành thiết kế chạy được)",
    "8b.1 Ba mức, mỗi mức tự đứng được"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source unheaded-block docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-52 (lines 326–330) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#unheaded-block-55 (lines 350–354); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Mức | Có gì | Cần code ở đâu | Trả lời câu hỏi nào |
|---|---|---|---|
| **V0 — visibility không cần contact** | `visibility.json` persist binding; brief-as-file + pointer; ack/result file receipt; ladder poll; pane forensics; `fgos dispatch show-run <runId>` + `watch` (read-only) | `transport.mjs` (viết lại `herdrSpawnInteractiveAdapter`), `assignment-runner.mjs` (ghi visibility.json, cập nhật run.json status), 2 verb read-only | "Có làm visibility mà không cần contact không?" — **Có, đây là V0.** |
| **V1 — contact tối thiểu** | `contact/<seq>.json` + verb `fgos dispatch contact <runId> --kind question|exit|interrupt`; delivery = pointer khi `idle|done`; ack = `outbox/ack-contact-<seq>.json` | thêm 1 verb + 1 hàm delivery dùng lại pointer path của V0 | "Contact có phát sinh nhiều vấn đề không?" — ít, vì V1 chỉ dùng lại đúng đường pointer của V0 |
| **V2 — hook-based (per executor)** | hook `UserPromptSubmit`/`Stop` của provider đọc `contact/` pending, append vào turn kế, ghi `activity.json` | hook script trong plugin fgOS (claude), integration của herdr (pi); agy: không | "Làm sao agent thường xuyên check message?" — **agent không check; hook đưa vào turn boundary** |
```

### Full target shown text

```text
| Mức | Có gì | Cần code ở đâu | Trả lời câu hỏi nào |
|---|---|---|---|
| **V0 — visibility không cần contact** | `visibility.json` persist binding; brief-as-file + pointer; ack/result file receipt; ladder poll; pane forensics; `fgos dispatch show-run <runId>` + `watch` (read-only) | `transport.mjs` (viết lại `herdrSpawnInteractiveAdapter`), `assignment-runner.mjs` (ghi visibility.json, cập nhật run.json status), 2 verb read-only | "Có làm visibility mà không cần contact không?" — **Có, đây là V0.** |
| **V1 — contact tối thiểu** | `contact/<seq>.json` + verb `fgos dispatch contact <runId> --kind question|exit|interrupt`; delivery = pointer khi `idle|done`; ack = `outbox/ack-contact-<seq>.json` | thêm 1 verb + 1 hàm delivery dùng lại pointer path của V0 | "Contact có phát sinh nhiều vấn đề không?" — ít, vì V1 chỉ dùng lại đúng đường pointer của V0 |
| **V2 — hook-based (per executor)** | hook `UserPromptSubmit`/`Stop` của provider đọc `contact/` pending, append vào turn kế, ghi `activity.json` | hook script trong plugin fgOS (claude), integration của herdr (pi); agy: không | "Làm sao agent thường xuyên check message?" — **agent không check; hook đưa vào turn boundary** |
```

## claim_5536dc2e661658d3afa57f65c3772055

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b2-layout-file-trong-run-dir-không-entity-mới-tuân-v-011, lines 332–332.
Target: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b2-layout-file-trong-run-dir-không-entity-mới-tuân-v-011.
Source digest: c8b75abef922d11462baeae00f6e6ff743ebc1394ef16e0dea4cc401ae41b623
Target digest: c8b75abef922d11462baeae00f6e6ff743ebc1394ef16e0dea4cc401ae41b623
Shown source SHA256: 5f71812829a21ff10b84e2f95e3cec1a667e2e7ce00160cd5b56660904a659f9
Shown target SHA256: 5f71812829a21ff10b84e2f95e3cec1a667e2e7ce00160cd5b56660904a659f9

### Proposed decision

```json
{
  "claimId": "claim_5536dc2e661658d3afa57f65c3772055",
  "sourceUnitDigest": "c8b75abef922d11462baeae00f6e6ff743ebc1394ef16e0dea4cc401ae41b623",
  "targetOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "targetAnchor": "8b2-layout-file-trong-run-dir-không-entity-mới-tuân-v-011",
  "targetUnitDigest": "c8b75abef922d11462baeae00f6e6ff743ebc1394ef16e0dea4cc401ae41b623",
  "targetAncestry": [
    "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "8b. Giải pháp cụ thể đề xuất (brainstorm thành thiết kế chạy được)"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Reject input report’s no-direct-ref finding: RUL40 is a live spec citation. Keep map proposal as design evidence; dated transport line numbers and unbuilt recommendations stay verbatim. Evidence: docs/specs/runner.md:999 RUL40 directly cites this exact proposal sections 3.3,4,14 H1. src/runner/dispatch/herdr-agent.mjs, herdr-round.mjs, herdr-reconcile.mjs and herdr-diagnosis.mjs implement current transport/outcome machinery. Complete source heading docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b2-layout-file-trong-run-dir-không-entity-mới-tuân-v-011 (lines 332–332) is carried at docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md#8b2-layout-file-trong-run-dir-không-entity-mới-tuân-v-011 (lines 356–356); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
### 8b.2 Layout file trong run dir (không entity mới, tuân V-011)

```txt
.fgos/assignments/<assignmentId>/runs/NN/
  dispatch-plan.json, run.json          # đã có; run.json.status nay cập nhật: running→settled|failed|unknown
  visibility.json                       # MỚI: {status, paneId, terminalId, agentName, agentSession, actor{pid,token,leaseUntil}, stateChangeSeq, lastSeenAt}
  brief-1.md                            # MỚI: prompt thật (multi-line) — worker đọc qua pointer
  contact/000001.json …                 # V1: contact action, ghi TRƯỚC khi transport
  outbox/                               # worker CHỈ được ghi ở đây (tmp-then-rename)
    ack-1.json  report-1.md  result-1.json  activity.json  ack-contact-000001.json
  evidence.json, result.json            # collector ghi, ngoài quyền worker (đã có)
```

`agent-result.json` hiện tại = `outbox/result-N.json` sau khi đổi tên; schema giữ nguyên `{status, summary, findings, evidenceRefs}` cộng optional `report_path`, `options[]`, `leaning`, `dissent{claim,alternative,severity}` (parse lenient như upstream — không bao giờ làm hỏng một round vì thiếu field).
````

### Full target shown text

````text
### 8b.2 Layout file trong run dir (không entity mới, tuân V-011)

```txt
.fgos/assignments/<assignmentId>/runs/NN/
  dispatch-plan.json, run.json          # đã có; run.json.status nay cập nhật: running→settled|failed|unknown
  visibility.json                       # MỚI: {status, paneId, terminalId, agentName, agentSession, actor{pid,token,leaseUntil}, stateChangeSeq, lastSeenAt}
  brief-1.md                            # MỚI: prompt thật (multi-line) — worker đọc qua pointer
  contact/000001.json …                 # V1: contact action, ghi TRƯỚC khi transport
  outbox/                               # worker CHỈ được ghi ở đây (tmp-then-rename)
    ack-1.json  report-1.md  result-1.json  activity.json  ack-contact-000001.json
  evidence.json, result.json            # collector ghi, ngoài quyền worker (đã có)
```

`agent-result.json` hiện tại = `outbox/result-N.json` sau khi đổi tên; schema giữ nguyên `{status, summary, findings, evidenceRefs}` cộng optional `report_path`, `options[]`, `leaning`, `dissent{claim,alternative,severity}` (parse lenient như upstream — không bao giờ làm hỏng một round vì thiếu field).
````
