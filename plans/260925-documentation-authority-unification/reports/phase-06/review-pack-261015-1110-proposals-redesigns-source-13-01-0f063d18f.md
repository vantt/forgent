# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-13-coordination-worker-provider-boundary.json
Original shard SHA256: 7c78a5baf0559d0486938e27f183a2584c8523e9bdf38533fa85dd812a0b8960
Source file: docs/architect/proposals/coordination-worker-provider-boundary.md
Part 1/1; entries: **37**. Source-file group 13/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (6): `claim_b14ddf97149f92e5affb869808ca149a`, `claim_0f93665c6afb3f743c01e1202e1818af`, `claim_af86398e2f1675cee4c1d79bcc7024b9`, `claim_e44d052c8d8bf3a682a81ae9eee0344b`, `claim_8dc6683dbb0a864d34d8649af015ce4a`, `claim_339a0cb071824020b79d4945db284748`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (2): `claim_af86398e2f1675cee4c1d79bcc7024b9`, `claim_e44d052c8d8bf3a682a81ae9eee0344b`.

Weak-exact/Judgment population: 10; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_b14ddf97149f92e5affb869808ca149a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#coordination-envelope-worker-provider-and-control-boundary, lines 1–1.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#coordination-envelope-worker-provider-and-control-boundary.
Source digest: 024edf570bf63f77e5d5ae17ff9740b8dcef0913d2f886e3f90fbaf931b4e0fd
Target digest: ce7fe142a4b45d0d76d62cd125c25dbca79c22e19987cf43774054d17a8f96c5
Shown source SHA256: da67b5abeaf9f7c076be4d0753992ea9145f1053c1e47579dc23b40346b5cf43
Shown target SHA256: 899c325998e648958afa826831a95bc691c0938ddebc95358e4880bf640fd426

### Proposed decision

```json
{
  "claimId": "claim_b14ddf97149f92e5affb869808ca149a",
  "sourceUnitDigest": "024edf570bf63f77e5d5ae17ff9740b8dcef0913d2f886e3f90fbaf931b4e0fd",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "coordination-envelope-worker-provider-and-control-boundary",
  "targetUnitDigest": "ce7fe142a4b45d0d76d62cd125c25dbca79c22e19987cf43774054d17a8f96c5",
  "targetAncestry": [],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#coordination-envelope-worker-provider-and-control-boundary (lines 1–1) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#coordination-envelope-worker-provider-and-control-boundary (lines 1–1); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
# Coordination Envelope — Worker, Provider, and Control Boundary

Document type: Proposal
Design status: Discussion
Implementation: Not started; supporting OS-only probes exist
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; minimum boundary sketch before a live probe
State class: State

Related: [Conceptual architecture](coordination-capability-envelope.md),
[Probe contract](coordination-envelope-probe-contract.md),
[Progress](coordination-envelope-progress.md),
[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),
[Dispatch control plane](../agent-coordination/architecture/dispatch-control-plane.md).
```

### Full target shown text

````text
# Coordination Envelope — Worker, Provider, and Control Boundary

```txt
Document type: Proposal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/coordination-worker-provider-boundary.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob fae58710ab56c7e418f472c6cd318d27eb8e2258
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/coordination-worker-provider-boundary.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/coordination-worker-provider-boundary.md).


Document type: Proposal
Design status: Discussion
Implementation: Not started; supporting OS-only probes exist
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; minimum boundary sketch before a live probe
State class: State

Related: [Conceptual architecture](../../architect/proposals/coordination-capability-envelope.md),
[Probe contract](../../architect/proposals/coordination-envelope-probe-contract.md),
[Progress](../../architect/proposals/coordination-envelope-progress.md),
[Capability audit](../../architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),
[Dispatch control plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md).
````

## claim_00315f842705c7b0e5178482431f9ba4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-1, lines 3–8.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-4.
Source digest: bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1
Target digest: bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1
Shown source SHA256: bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1
Shown target SHA256: bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1

### Proposed decision

```json
{
  "claimId": "claim_00315f842705c7b0e5178482431f9ba4",
  "sourceUnitDigest": "bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-1 (lines 3–8) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-4 (lines 27–32); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Document type: Proposal
Design status: Discussion
Implementation: Not started; supporting OS-only probes exist
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; minimum boundary sketch before a live probe
State class: State
```

### Full target shown text

```text
Document type: Proposal
Design status: Discussion
Implementation: Not started; supporting OS-only probes exist
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; minimum boundary sketch before a live probe
State class: State
```

## claim_0f93665c6afb3f743c01e1202e1818af

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-2, lines 10–14.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-5.
Source digest: bd6a375e51935ceb9292986c147a6c32eeee8ba25c914b4e2dfff532dca6d2f3
Target digest: 4f2d8d7b088378a76495b80a3ee3a90a30d362dbd203a70b2885b672e034636f
Shown source SHA256: bd6a375e51935ceb9292986c147a6c32eeee8ba25c914b4e2dfff532dca6d2f3
Shown target SHA256: 4f2d8d7b088378a76495b80a3ee3a90a30d362dbd203a70b2885b672e034636f

### Proposed decision

```json
{
  "claimId": "claim_0f93665c6afb3f743c01e1202e1818af",
  "sourceUnitDigest": "bd6a375e51935ceb9292986c147a6c32eeee8ba25c914b4e2dfff532dca6d2f3",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "4f2d8d7b088378a76495b80a3ee3a90a30d362dbd203a70b2885b672e034636f",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-2 (lines 10–14) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-5 (lines 34–38); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Related: [Conceptual architecture](coordination-capability-envelope.md),
[Probe contract](coordination-envelope-probe-contract.md),
[Progress](coordination-envelope-progress.md),
[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),
[Dispatch control plane](../agent-coordination/architecture/dispatch-control-plane.md).
```

### Full target shown text

```text
Related: [Conceptual architecture](../../architect/proposals/coordination-capability-envelope.md),
[Probe contract](../../architect/proposals/coordination-envelope-probe-contract.md),
[Progress](../../architect/proposals/coordination-envelope-progress.md),
[Capability audit](../../architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),
[Dispatch control plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md).
```

## claim_af86398e2f1675cee4c1d79bcc7024b9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#decision-proposed, lines 16–16.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#decision-proposed.
Source digest: c291e7aed9e1f0c5311835f5621af5e5167792f70834bf18993cfc5cce3597ad
Target digest: 76f745dee6472d327d95766bc195c770277b33104b7a7f31e2efefc195302984
Shown source SHA256: 75e46e109cc9df89f4a41c9985792e0072bf1d076c47b773614c0a32df8a116a
Shown target SHA256: 62c7108c4cb51922dd72fd6a94b6096774102b48ee494c747a7bc86e5902c9c9

### Proposed decision

```json
{
  "claimId": "claim_af86398e2f1675cee4c1d79bcc7024b9",
  "sourceUnitDigest": "c291e7aed9e1f0c5311835f5621af5e5167792f70834bf18993cfc5cce3597ad",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "decision-proposed",
  "targetUnitDigest": "76f745dee6472d327d95766bc195c770277b33104b7a7f31e2efefc195302984",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "decision",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: authorized correction changes target digest; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#decision-proposed (lines 16–16) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#decision-proposed (lines 40–40); Frozen map target and kind retained. Target digest differs; the full unit requires A36 deep read against its source and the recorded correction. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Decision proposed

This boundary is subordinate to the existing [Dispatch & Execution control
plane](../agent-coordination/architecture/dispatch-control-plane.md). It does
not introduce a parallel provider or coordination runtime. The coordinator
requests a semantic Assignment; Dispatch resolves the mechanism, including
`in-process`, and the boundary applies to that selected mechanism.

Keep provider account credentials and coordination authority outside the worker's
execution boundary. Give each worker only its materialized context, private
scratch, bounded output submission, and a Run-scoped inference capability. Do not
mount the real home, runtime ledger, shared provider cache, or complete Run
metadata directory into a worker to make its CLI start.

This is a proposed capability boundary, not a new general conversation engine or
an accepted implementation. An inference relay below means a transport adapter
capability; it does not choose cognitive steps or execute arbitrary worker tools.
```

### Full target shown text

```text
## Decision proposed

This boundary is subordinate to the existing [Dispatch & Execution control
plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md). It does
not introduce a parallel provider or coordination runtime. The coordinator
requests a semantic Assignment; Dispatch resolves the mechanism, including
`in-process`, and the boundary applies to that selected mechanism.

Keep provider account credentials and coordination authority outside the worker's
execution boundary. Give each worker only its materialized context, private
scratch, bounded output submission, and a Run-scoped inference capability. Do not
mount the real home, runtime ledger, shared provider cache, or complete Run
metadata directory into a worker to make its CLI start.

This is a proposed capability boundary, not a new general conversation engine or
an accepted implementation. An inference relay below means a transport adapter
capability; it does not choose cognitive steps or execute arbitrary worker tools.
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_af86398e2f1675cee4c1d79bcc7024b9",
  "source": "docs/architect/proposals/coordination-worker-provider-boundary.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-13-coordination-worker-provider-boundary.json",
  "reasons": [
    "R7-3 wrapped-label link rebase and extracted-unit consequence",
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_af86398e2f1675cee4c1d79bcc7024b9",
    "sourceUnitDigest": "c291e7aed9e1f0c5311835f5621af5e5167792f70834bf18993cfc5cce3597ad",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "decision-proposed",
    "targetUnitDigest": "c291e7aed9e1f0c5311835f5621af5e5167792f70834bf18993cfc5cce3597ad",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary"
    ],
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#decision-proposed (lines 16–16) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#decision-proposed (lines 40–40); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  },
  "after": {
    "claimId": "claim_af86398e2f1675cee4c1d79bcc7024b9",
    "sourceUnitDigest": "c291e7aed9e1f0c5311835f5621af5e5167792f70834bf18993cfc5cce3597ad",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "decision-proposed",
    "targetUnitDigest": "76f745dee6472d327d95766bc195c770277b33104b7a7f31e2efefc195302984",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary"
    ],
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: authorized correction changes target digest; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#decision-proposed (lines 16–16) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#decision-proposed (lines 40–40); Frozen map target and kind retained. Target digest differs; the full unit requires A36 deep read against its source and the recorded correction. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  }
}
```

## claim_e44d052c8d8bf3a682a81ae9eee0344b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-3, lines 18–22.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-6.
Source digest: 9b028155e909cdb7306c3ad94330b573fb28acf32d599af019c04784201efbb8
Target digest: 068d5ba8a9141f442f0fb4176ba27c6c3522623b322b5765e83afd20eab98d15
Shown source SHA256: 9b028155e909cdb7306c3ad94330b573fb28acf32d599af019c04784201efbb8
Shown target SHA256: 068d5ba8a9141f442f0fb4176ba27c6c3522623b322b5765e83afd20eab98d15

### Proposed decision

```json
{
  "claimId": "claim_e44d052c8d8bf3a682a81ae9eee0344b",
  "sourceUnitDigest": "9b028155e909cdb7306c3ad94330b573fb28acf32d599af019c04784201efbb8",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "068d5ba8a9141f442f0fb4176ba27c6c3522623b322b5765e83afd20eab98d15",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Decision proposed"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: authorized correction changes target digest; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-3 (lines 18–22) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-6 (lines 42–46); Frozen map target and kind retained. Target digest differs; the full unit requires A36 deep read against its source and the recorded correction. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This boundary is subordinate to the existing [Dispatch & Execution control
plane](../agent-coordination/architecture/dispatch-control-plane.md). It does
not introduce a parallel provider or coordination runtime. The coordinator
requests a semantic Assignment; Dispatch resolves the mechanism, including
`in-process`, and the boundary applies to that selected mechanism.
```

### Full target shown text

```text
This boundary is subordinate to the existing [Dispatch & Execution control
plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md). It does
not introduce a parallel provider or coordination runtime. The coordinator
requests a semantic Assignment; Dispatch resolves the mechanism, including
`in-process`, and the boundary applies to that selected mechanism.
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_e44d052c8d8bf3a682a81ae9eee0344b",
  "source": "docs/architect/proposals/coordination-worker-provider-boundary.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-13-coordination-worker-provider-boundary.json",
  "reasons": [
    "R7-3 wrapped-label link rebase and extracted-unit consequence",
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_e44d052c8d8bf3a682a81ae9eee0344b",
    "sourceUnitDigest": "9b028155e909cdb7306c3ad94330b573fb28acf32d599af019c04784201efbb8",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "unheaded-block-6",
    "targetUnitDigest": "9b028155e909cdb7306c3ad94330b573fb28acf32d599af019c04784201efbb8",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary",
      "Decision proposed"
    ],
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-3 (lines 18–22) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-6 (lines 42–46); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  },
  "after": {
    "claimId": "claim_e44d052c8d8bf3a682a81ae9eee0344b",
    "sourceUnitDigest": "9b028155e909cdb7306c3ad94330b573fb28acf32d599af019c04784201efbb8",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "unheaded-block-6",
    "targetUnitDigest": "068d5ba8a9141f442f0fb4176ba27c6c3522623b322b5765e83afd20eab98d15",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary",
      "Decision proposed"
    ],
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: authorized correction changes target digest; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-3 (lines 18–22) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-6 (lines 42–46); Frozen map target and kind retained. Target digest differs; the full unit requires A36 deep read against its source and the recorded correction. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
  }
}
```

## claim_72f2d77d548d91ccefbe50ed5179a5a6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-4, lines 24–28.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-7.
Source digest: a92f65f5b98b6bf867f6c1133288abf668aa0c5ca0731d57ca9ddf9e0e47ddff
Target digest: a92f65f5b98b6bf867f6c1133288abf668aa0c5ca0731d57ca9ddf9e0e47ddff
Shown source SHA256: a92f65f5b98b6bf867f6c1133288abf668aa0c5ca0731d57ca9ddf9e0e47ddff
Shown target SHA256: a92f65f5b98b6bf867f6c1133288abf668aa0c5ca0731d57ca9ddf9e0e47ddff

### Proposed decision

```json
{
  "claimId": "claim_72f2d77d548d91ccefbe50ed5179a5a6",
  "sourceUnitDigest": "a92f65f5b98b6bf867f6c1133288abf668aa0c5ca0731d57ca9ddf9e0e47ddff",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "a92f65f5b98b6bf867f6c1133288abf668aa0c5ca0731d57ca9ddf9e0e47ddff",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Decision proposed"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-4 (lines 24–28) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-7 (lines 48–52); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Keep provider account credentials and coordination authority outside the worker's
execution boundary. Give each worker only its materialized context, private
scratch, bounded output submission, and a Run-scoped inference capability. Do not
mount the real home, runtime ledger, shared provider cache, or complete Run
metadata directory into a worker to make its CLI start.
```

### Full target shown text

```text
Keep provider account credentials and coordination authority outside the worker's
execution boundary. Give each worker only its materialized context, private
scratch, bounded output submission, and a Run-scoped inference capability. Do not
mount the real home, runtime ledger, shared provider cache, or complete Run
metadata directory into a worker to make its CLI start.
```

## claim_59817e65765132931ec63b4a56564570

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-5, lines 30–32.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-8.
Source digest: 211ba8c693ca3581602dd7d4dc52853acf517bff38ac0c867b55836e6f3b7264
Target digest: 211ba8c693ca3581602dd7d4dc52853acf517bff38ac0c867b55836e6f3b7264
Shown source SHA256: 211ba8c693ca3581602dd7d4dc52853acf517bff38ac0c867b55836e6f3b7264
Shown target SHA256: 211ba8c693ca3581602dd7d4dc52853acf517bff38ac0c867b55836e6f3b7264

### Proposed decision

```json
{
  "claimId": "claim_59817e65765132931ec63b4a56564570",
  "sourceUnitDigest": "211ba8c693ca3581602dd7d4dc52853acf517bff38ac0c867b55836e6f3b7264",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "211ba8c693ca3581602dd7d4dc52853acf517bff38ac0c867b55836e6f3b7264",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Decision proposed"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-5 (lines 30–32) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-8 (lines 54–56); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This is a proposed capability boundary, not a new general conversation engine or
an accepted implementation. An inference relay below means a transport adapter
capability; it does not choose cognitive steps or execute arbitrary worker tools.
```

### Full target shown text

```text
This is a proposed capability boundary, not a new general conversation engine or
an accepted implementation. An inference relay below means a transport adapter
capability; it does not choose cognitive steps or execute arbitrary worker tools.
```

## claim_8dc6683dbb0a864d34d8649af015ce4a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit, lines 34–34.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit.
Source digest: ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301
Target digest: e2ebf08ea337ebdd80d8b52f033f0820b4659aac6b300a630c8611f134eb945d
Shown source SHA256: 449e7edb1eb02d10da46110e8ab8536102218058123602da8773b4259f748cb7
Shown target SHA256: 7e11daf31c4f5bb3297e395309bb1aa03bc69ba7baf9754589658071c0c32f10

### Proposed decision

```json
{
  "claimId": "claim_8dc6683dbb0a864d34d8649af015ce4a",
  "sourceUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "new-evidence-since-the-first-capability-audit",
  "targetUnitDigest": "e2ebf08ea337ebdd80d8b52f033f0820b4659aac6b300a630c8611f134eb945d",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 34–34) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 58–58); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## New evidence since the first capability audit

[Transport](../../../src/runner/dispatch/transport.mjs), cliSpawnAdapter, launches
with `{ ...process.env, ...resolvedEnv, FGOS_DISPATCH_DEPTH: ... }`. The herdr path
also constructs a merged fullEnv. Environment overrides therefore do not form an
allowlist. This is static evidence of inheritance, not a claim that a real secret
was leaked. An environment depth counter is a cooperative limit; a hostile child
can change its own environment, so it cannot own authoritative budget accounting.

[Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) renders an
absolute runDir for worker report/result submission. That directory also contains
runtime-authored dispatch-plan.json, run.json, and subsequent evidence/result
files. A writable bind of the entire directory would grant more than submission
rights. This is a proposed-isolation integration hazard, not a newly reproduced
metadata-forgery exploit.

A fixed Python process inside the narrow mount inherited a synthetic parent
canary. Adding `--clearenv` removed it. No actual host environment values or
credentials were read. See [raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)
and [reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).
Run the script from repo root; it calls no provider or fgOS dispatch adapter.
```

### Full target shown text

```text
## New evidence since the first capability audit

[Transport](../../../src/runner/dispatch/transport.mjs), cliSpawnAdapter, launches
with `{ ...process.env, ...resolvedEnv, FGOS_DISPATCH_DEPTH: ... }`. The herdr path
also constructs a merged fullEnv. Environment overrides therefore do not form an
allowlist. This is static evidence of inheritance, not a claim that a real secret
was leaked. An environment depth counter is a cooperative limit; a hostile child
can change its own environment, so it cannot own authoritative budget accounting.

[Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) renders an
absolute runDir for worker report/result submission. That directory also contains
runtime-authored dispatch-plan.json, run.json, and subsequent evidence/result
files. A writable bind of the entire directory would grant more than submission
rights. This is a proposed-isolation integration hazard, not a newly reproduced
metadata-forgery exploit.

A fixed Python process inside the narrow mount inherited a synthetic parent
canary. Adding `--clearenv` removed it. No actual host environment values or
credentials were read. See [raw result](../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)
and [reproduction script](../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).
Run the script from repo root; it calls no provider or fgOS dispatch adapter.
```

## claim_4bd75d27758a44171b95ec07322056e3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-6, lines 36–41.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-9.
Source digest: 36a7c61d3234271b56c56913c31b1d2e24c5f1c88169d21f6ec14efb771515d6
Target digest: 36a7c61d3234271b56c56913c31b1d2e24c5f1c88169d21f6ec14efb771515d6
Shown source SHA256: 36a7c61d3234271b56c56913c31b1d2e24c5f1c88169d21f6ec14efb771515d6
Shown target SHA256: 36a7c61d3234271b56c56913c31b1d2e24c5f1c88169d21f6ec14efb771515d6

### Proposed decision

```json
{
  "claimId": "claim_4bd75d27758a44171b95ec07322056e3",
  "sourceUnitDigest": "36a7c61d3234271b56c56913c31b1d2e24c5f1c88169d21f6ec14efb771515d6",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "36a7c61d3234271b56c56913c31b1d2e24c5f1c88169d21f6ec14efb771515d6",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "New evidence since the first capability audit"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-6 (lines 36–41) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-9 (lines 60–65); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
[Transport](../../../src/runner/dispatch/transport.mjs), cliSpawnAdapter, launches
with `{ ...process.env, ...resolvedEnv, FGOS_DISPATCH_DEPTH: ... }`. The herdr path
also constructs a merged fullEnv. Environment overrides therefore do not form an
allowlist. This is static evidence of inheritance, not a claim that a real secret
was leaked. An environment depth counter is a cooperative limit; a hostile child
can change its own environment, so it cannot own authoritative budget accounting.
```

### Full target shown text

```text
[Transport](../../../src/runner/dispatch/transport.mjs), cliSpawnAdapter, launches
with `{ ...process.env, ...resolvedEnv, FGOS_DISPATCH_DEPTH: ... }`. The herdr path
also constructs a merged fullEnv. Environment overrides therefore do not form an
allowlist. This is static evidence of inheritance, not a claim that a real secret
was leaked. An environment depth counter is a cooperative limit; a hostile child
can change its own environment, so it cannot own authoritative budget accounting.
```

## claim_37c6761222d0d121533c8b494070bf5e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-7, lines 43–48.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-10.
Source digest: 96c790df2b5f7305ab1b023f00efdb1d10ab9457f751280a34cc3cf0d181fcdc
Target digest: 96c790df2b5f7305ab1b023f00efdb1d10ab9457f751280a34cc3cf0d181fcdc
Shown source SHA256: 96c790df2b5f7305ab1b023f00efdb1d10ab9457f751280a34cc3cf0d181fcdc
Shown target SHA256: 96c790df2b5f7305ab1b023f00efdb1d10ab9457f751280a34cc3cf0d181fcdc

### Proposed decision

```json
{
  "claimId": "claim_37c6761222d0d121533c8b494070bf5e",
  "sourceUnitDigest": "96c790df2b5f7305ab1b023f00efdb1d10ab9457f751280a34cc3cf0d181fcdc",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "96c790df2b5f7305ab1b023f00efdb1d10ab9457f751280a34cc3cf0d181fcdc",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "New evidence since the first capability audit"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-7 (lines 43–48) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-10 (lines 67–72); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
[Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) renders an
absolute runDir for worker report/result submission. That directory also contains
runtime-authored dispatch-plan.json, run.json, and subsequent evidence/result
files. A writable bind of the entire directory would grant more than submission
rights. This is a proposed-isolation integration hazard, not a newly reproduced
metadata-forgery exploit.
```

### Full target shown text

```text
[Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) renders an
absolute runDir for worker report/result submission. That directory also contains
runtime-authored dispatch-plan.json, run.json, and subsequent evidence/result
files. A writable bind of the entire directory would grant more than submission
rights. This is a proposed-isolation integration hazard, not a newly reproduced
metadata-forgery exploit.
```

## claim_339a0cb071824020b79d4945db284748

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Judgment.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-8, lines 50–54.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-11.
Source digest: 87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c
Target digest: 7f084e6c082bbe0577d250710ee60eeaaa81f73371d2c467ec73b44bc20b43bf
Shown source SHA256: 87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c
Shown target SHA256: 7f084e6c082bbe0577d250710ee60eeaaa81f73371d2c467ec73b44bc20b43bf

### Proposed decision

```json
{
  "claimId": "claim_339a0cb071824020b79d4945db284748",
  "sourceUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "7f084e6c082bbe0577d250710ee60eeaaa81f73371d2c467ec73b44bc20b43bf",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "New evidence since the first capability audit"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-8 (lines 50–54) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-11 (lines 74–78); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A fixed Python process inside the narrow mount inherited a synthetic parent
canary. Adding `--clearenv` removed it. No actual host environment values or
credentials were read. See [raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)
and [reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).
Run the script from repo root; it calls no provider or fgOS dispatch adapter.
```

### Full target shown text

```text
A fixed Python process inside the narrow mount inherited a synthetic parent
canary. Adding `--clearenv` removed it. No actual host environment values or
credentials were read. See [raw result](../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)
and [reproduction script](../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).
Run the script from repo root; it calls no provider or fgOS dispatch adapter.
```

## claim_74de88f31f31c6000939ff1c46cfe87a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#principals-and-resources, lines 56–56.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#principals-and-resources.
Source digest: 5e78cfc2d7a84cc26272d547800d931dd4f5b723128be8a0a57167527dfff051
Target digest: 5e78cfc2d7a84cc26272d547800d931dd4f5b723128be8a0a57167527dfff051
Shown source SHA256: 2d2b00e8fac7ccbf6f3406a9f717c9735265876d0c4c02e8cea68c0cfcfd5a34
Shown target SHA256: 2d2b00e8fac7ccbf6f3406a9f717c9735265876d0c4c02e8cea68c0cfcfd5a34

### Proposed decision

```json
{
  "claimId": "claim_74de88f31f31c6000939ff1c46cfe87a",
  "sourceUnitDigest": "5e78cfc2d7a84cc26272d547800d931dd4f5b723128be8a0a57167527dfff051",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "principals-and-resources",
  "targetUnitDigest": "5e78cfc2d7a84cc26272d547800d931dd4f5b723128be8a0a57167527dfff051",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#principals-and-resources (lines 56–56) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#principals-and-resources (lines 80–80); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Principals and resources

| Principal | Owns / may do | Must not inherit |
|---|---|---|
| Human or delegated authority owner | Objective, envelope, product decisions, explicit grant expansion | Worker assertions must not impersonate this principal |
| Coordinator agent | Propose Assignments, attenuate grants, select method, assess evidence, request close | Direct ledger/config mutation or unbounded provider credentials |
| Trusted control service | Authenticate callers, reserve bounds, issue/revoke grants, create Runs, seal receipts | It must not interpret worker text as authority |
| Trusted provider adapter | Fixed provider transport, service credential custody, per-Run accounting | No worker-directed arbitrary host commands, files, or destinations |
| Worker execution | Think, use allowed tools, read packet, produce candidate/report, request bounded inference | Other worker contexts, driver credentials, host home, runtime metadata |
| Artifact/effect owner | Safely ingest submissions; validate/integrate candidate with CAS and evidence | Worker completion cannot grant approval/merge/Work lifecycle authority |

A coordinator is not trusted simply because it is called coordinator. Its own
model/tool execution needs a scoped control channel; the service that validates
its requests is outside that context's writable resources. Existing same-user
CLI behavior remains a legacy trust profile until this separation is established.
```

### Full target shown text

```text
## Principals and resources

| Principal | Owns / may do | Must not inherit |
|---|---|---|
| Human or delegated authority owner | Objective, envelope, product decisions, explicit grant expansion | Worker assertions must not impersonate this principal |
| Coordinator agent | Propose Assignments, attenuate grants, select method, assess evidence, request close | Direct ledger/config mutation or unbounded provider credentials |
| Trusted control service | Authenticate callers, reserve bounds, issue/revoke grants, create Runs, seal receipts | It must not interpret worker text as authority |
| Trusted provider adapter | Fixed provider transport, service credential custody, per-Run accounting | No worker-directed arbitrary host commands, files, or destinations |
| Worker execution | Think, use allowed tools, read packet, produce candidate/report, request bounded inference | Other worker contexts, driver credentials, host home, runtime metadata |
| Artifact/effect owner | Safely ingest submissions; validate/integrate candidate with CAS and evidence | Worker completion cannot grant approval/merge/Work lifecycle authority |

A coordinator is not trusted simply because it is called coordinator. Its own
model/tool execution needs a scoped control channel; the service that validates
its requests is outside that context's writable resources. Existing same-user
CLI behavior remains a legacy trust profile until this separation is established.
```

## claim_ab7d70ce6d76decfc815ff52947ea71e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-9, lines 58–65.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-12.
Source digest: 4c71f044263b164e7891f405628e09c688e33aee0a3c4b9079efa8e42d624283
Target digest: 4c71f044263b164e7891f405628e09c688e33aee0a3c4b9079efa8e42d624283
Shown source SHA256: 4c71f044263b164e7891f405628e09c688e33aee0a3c4b9079efa8e42d624283
Shown target SHA256: 4c71f044263b164e7891f405628e09c688e33aee0a3c4b9079efa8e42d624283

### Proposed decision

```json
{
  "claimId": "claim_ab7d70ce6d76decfc815ff52947ea71e",
  "sourceUnitDigest": "4c71f044263b164e7891f405628e09c688e33aee0a3c4b9079efa8e42d624283",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "4c71f044263b164e7891f405628e09c688e33aee0a3c4b9079efa8e42d624283",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Principals and resources"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-9 (lines 58–65) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-12 (lines 82–89); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Principal | Owns / may do | Must not inherit |
|---|---|---|
| Human or delegated authority owner | Objective, envelope, product decisions, explicit grant expansion | Worker assertions must not impersonate this principal |
| Coordinator agent | Propose Assignments, attenuate grants, select method, assess evidence, request close | Direct ledger/config mutation or unbounded provider credentials |
| Trusted control service | Authenticate callers, reserve bounds, issue/revoke grants, create Runs, seal receipts | It must not interpret worker text as authority |
| Trusted provider adapter | Fixed provider transport, service credential custody, per-Run accounting | No worker-directed arbitrary host commands, files, or destinations |
| Worker execution | Think, use allowed tools, read packet, produce candidate/report, request bounded inference | Other worker contexts, driver credentials, host home, runtime metadata |
| Artifact/effect owner | Safely ingest submissions; validate/integrate candidate with CAS and evidence | Worker completion cannot grant approval/merge/Work lifecycle authority |
```

### Full target shown text

```text
| Principal | Owns / may do | Must not inherit |
|---|---|---|
| Human or delegated authority owner | Objective, envelope, product decisions, explicit grant expansion | Worker assertions must not impersonate this principal |
| Coordinator agent | Propose Assignments, attenuate grants, select method, assess evidence, request close | Direct ledger/config mutation or unbounded provider credentials |
| Trusted control service | Authenticate callers, reserve bounds, issue/revoke grants, create Runs, seal receipts | It must not interpret worker text as authority |
| Trusted provider adapter | Fixed provider transport, service credential custody, per-Run accounting | No worker-directed arbitrary host commands, files, or destinations |
| Worker execution | Think, use allowed tools, read packet, produce candidate/report, request bounded inference | Other worker contexts, driver credentials, host home, runtime metadata |
| Artifact/effect owner | Safely ingest submissions; validate/integrate candidate with CAS and evidence | Worker completion cannot grant approval/merge/Work lifecycle authority |
```

## claim_57dbba96538663a2e8026e23733a25fd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-10, lines 67–70.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-13.
Source digest: 958b4db4fcf47a9a42c9f3fd33e41de2f72363a15d1b27f4cdef7d2125106412
Target digest: 958b4db4fcf47a9a42c9f3fd33e41de2f72363a15d1b27f4cdef7d2125106412
Shown source SHA256: 958b4db4fcf47a9a42c9f3fd33e41de2f72363a15d1b27f4cdef7d2125106412
Shown target SHA256: 958b4db4fcf47a9a42c9f3fd33e41de2f72363a15d1b27f4cdef7d2125106412

### Proposed decision

```json
{
  "claimId": "claim_57dbba96538663a2e8026e23733a25fd",
  "sourceUnitDigest": "958b4db4fcf47a9a42c9f3fd33e41de2f72363a15d1b27f4cdef7d2125106412",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "958b4db4fcf47a9a42c9f3fd33e41de2f72363a15d1b27f4cdef7d2125106412",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Principals and resources"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-10 (lines 67–70) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-13 (lines 91–94); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A coordinator is not trusted simply because it is called coordinator. Its own
model/tool execution needs a scoped control channel; the service that validates
its requests is outside that context's writable resources. Existing same-user
CLI behavior remains a legacy trust profile until this separation is established.
```

### Full target shown text

```text
A coordinator is not trusted simply because it is called coordinator. Its own
model/tool execution needs a scoped control channel; the service that validates
its requests is outside that context's writable resources. Existing same-user
CLI behavior remains a legacy trust profile until this separation is established.
```

## claim_e64076c516b88a74d4758a2170a4919e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#worker-filesystem-and-process-envelope, lines 72–72.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#worker-filesystem-and-process-envelope.
Source digest: 401346e24e2aa1b3c3fb0e5ac0b8c9c50a560f38c9e7a8270486d74c394b1111
Target digest: 401346e24e2aa1b3c3fb0e5ac0b8c9c50a560f38c9e7a8270486d74c394b1111
Shown source SHA256: e67bbd8a9b1095c963b74b90ace4a661d0282ad7c51d8609db6a2d29d36683c2
Shown target SHA256: e67bbd8a9b1095c963b74b90ace4a661d0282ad7c51d8609db6a2d29d36683c2

### Proposed decision

```json
{
  "claimId": "claim_e64076c516b88a74d4758a2170a4919e",
  "sourceUnitDigest": "401346e24e2aa1b3c3fb0e5ac0b8c9c50a560f38c9e7a8270486d74c394b1111",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "worker-filesystem-and-process-envelope",
  "targetUnitDigest": "401346e24e2aa1b3c3fb0e5ac0b8c9c50a560f38c9e7a8270486d74c394b1111",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#worker-filesystem-and-process-envelope (lines 72–72) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#worker-filesystem-and-process-envelope (lines 96–96); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Worker filesystem and process envelope

| Resource | Proposed treatment |
|---|---|
| Runtime libraries/binaries | Pin required closure and mount read-only; the probe's broad /usr is only an OS experiment |
| Public requirements and sealed candidate | Materialize exact allowed snapshot under stable worker-visible paths |
| Private provider state / scratch | Fresh per-Run writable directory; no shared auth/history cache |
| Worker report submission | Dedicated bounded outbox, separate from canonical Run storage |
| Mutable candidate | Disposable granted workspace only; no shared .git pointer into the host repository |
| Runtime truth, config, sibling output | Not mounted; no endpoint access unless separately granted |
| Environment | Empty baseline plus explicit necessary values; no inherited auth/proxy/socket settings |
| Processes/descriptors | Separate process namespace; close unintended descriptors; no host process visibility or ptrace access |
| Network / sockets | Deny general egress and host sockets; only specifically mediated services |

Writable private scratch may be mapped to provider-required locations inside the
sandbox. It must not reuse host HOME/CODEX_HOME or a sibling's session history.
Provider executables and startup instructions are part of the pinned closure;
plugins, repository instructions, or test code remain untrusted inputs for effects.

Revealed knowledge cannot be revoked. A fresh independent assessment uses a new
worker context. A replaced worker does not inherit prior draft access by accident.
```

### Full target shown text

```text
## Worker filesystem and process envelope

| Resource | Proposed treatment |
|---|---|
| Runtime libraries/binaries | Pin required closure and mount read-only; the probe's broad /usr is only an OS experiment |
| Public requirements and sealed candidate | Materialize exact allowed snapshot under stable worker-visible paths |
| Private provider state / scratch | Fresh per-Run writable directory; no shared auth/history cache |
| Worker report submission | Dedicated bounded outbox, separate from canonical Run storage |
| Mutable candidate | Disposable granted workspace only; no shared .git pointer into the host repository |
| Runtime truth, config, sibling output | Not mounted; no endpoint access unless separately granted |
| Environment | Empty baseline plus explicit necessary values; no inherited auth/proxy/socket settings |
| Processes/descriptors | Separate process namespace; close unintended descriptors; no host process visibility or ptrace access |
| Network / sockets | Deny general egress and host sockets; only specifically mediated services |

Writable private scratch may be mapped to provider-required locations inside the
sandbox. It must not reuse host HOME/CODEX_HOME or a sibling's session history.
Provider executables and startup instructions are part of the pinned closure;
plugins, repository instructions, or test code remain untrusted inputs for effects.

Revealed knowledge cannot be revoked. A fresh independent assessment uses a new
worker context. A replaced worker does not inherit prior draft access by accident.
```

## claim_a4074989c4e8fc187b0ec06e68cb51a6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-11, lines 74–84.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-14.
Source digest: 5f225d572bc610a5e35278901a53e79800587bf0b59e7bdc8f62c1468bbcf575
Target digest: 5f225d572bc610a5e35278901a53e79800587bf0b59e7bdc8f62c1468bbcf575
Shown source SHA256: 5f225d572bc610a5e35278901a53e79800587bf0b59e7bdc8f62c1468bbcf575
Shown target SHA256: 5f225d572bc610a5e35278901a53e79800587bf0b59e7bdc8f62c1468bbcf575

### Proposed decision

```json
{
  "claimId": "claim_a4074989c4e8fc187b0ec06e68cb51a6",
  "sourceUnitDigest": "5f225d572bc610a5e35278901a53e79800587bf0b59e7bdc8f62c1468bbcf575",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "5f225d572bc610a5e35278901a53e79800587bf0b59e7bdc8f62c1468bbcf575",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Worker filesystem and process envelope"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-11 (lines 74–84) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-14 (lines 98–108); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Resource | Proposed treatment |
|---|---|
| Runtime libraries/binaries | Pin required closure and mount read-only; the probe's broad /usr is only an OS experiment |
| Public requirements and sealed candidate | Materialize exact allowed snapshot under stable worker-visible paths |
| Private provider state / scratch | Fresh per-Run writable directory; no shared auth/history cache |
| Worker report submission | Dedicated bounded outbox, separate from canonical Run storage |
| Mutable candidate | Disposable granted workspace only; no shared .git pointer into the host repository |
| Runtime truth, config, sibling output | Not mounted; no endpoint access unless separately granted |
| Environment | Empty baseline plus explicit necessary values; no inherited auth/proxy/socket settings |
| Processes/descriptors | Separate process namespace; close unintended descriptors; no host process visibility or ptrace access |
| Network / sockets | Deny general egress and host sockets; only specifically mediated services |
```

### Full target shown text

```text
| Resource | Proposed treatment |
|---|---|
| Runtime libraries/binaries | Pin required closure and mount read-only; the probe's broad /usr is only an OS experiment |
| Public requirements and sealed candidate | Materialize exact allowed snapshot under stable worker-visible paths |
| Private provider state / scratch | Fresh per-Run writable directory; no shared auth/history cache |
| Worker report submission | Dedicated bounded outbox, separate from canonical Run storage |
| Mutable candidate | Disposable granted workspace only; no shared .git pointer into the host repository |
| Runtime truth, config, sibling output | Not mounted; no endpoint access unless separately granted |
| Environment | Empty baseline plus explicit necessary values; no inherited auth/proxy/socket settings |
| Processes/descriptors | Separate process namespace; close unintended descriptors; no host process visibility or ptrace access |
| Network / sockets | Deny general egress and host sockets; only specifically mediated services |
```

## claim_14d63ca1b47f00ff0a581477ce953ecd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-12, lines 86–89.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-15.
Source digest: 9346860bf27ee1b0cdfa3aac35c967a12b4ce9a899befdea045b515ca45c248b
Target digest: 9346860bf27ee1b0cdfa3aac35c967a12b4ce9a899befdea045b515ca45c248b
Shown source SHA256: 9346860bf27ee1b0cdfa3aac35c967a12b4ce9a899befdea045b515ca45c248b
Shown target SHA256: 9346860bf27ee1b0cdfa3aac35c967a12b4ce9a899befdea045b515ca45c248b

### Proposed decision

```json
{
  "claimId": "claim_14d63ca1b47f00ff0a581477ce953ecd",
  "sourceUnitDigest": "9346860bf27ee1b0cdfa3aac35c967a12b4ce9a899befdea045b515ca45c248b",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "9346860bf27ee1b0cdfa3aac35c967a12b4ce9a899befdea045b515ca45c248b",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Worker filesystem and process envelope"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-12 (lines 86–89) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-15 (lines 110–113); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Writable private scratch may be mapped to provider-required locations inside the
sandbox. It must not reuse host HOME/CODEX_HOME or a sibling's session history.
Provider executables and startup instructions are part of the pinned closure;
plugins, repository instructions, or test code remain untrusted inputs for effects.
```

### Full target shown text

```text
Writable private scratch may be mapped to provider-required locations inside the
sandbox. It must not reuse host HOME/CODEX_HOME or a sibling's session history.
Provider executables and startup instructions are part of the pinned closure;
plugins, repository instructions, or test code remain untrusted inputs for effects.
```

## claim_b6b9275fc5066b25d7ad557407914d1f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-13, lines 91–92.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-16.
Source digest: 86e2ed6bdcf21aa6d32ce7f495fedb77704421d1bda8d9fa65f725830711bd59
Target digest: 86e2ed6bdcf21aa6d32ce7f495fedb77704421d1bda8d9fa65f725830711bd59
Shown source SHA256: 86e2ed6bdcf21aa6d32ce7f495fedb77704421d1bda8d9fa65f725830711bd59
Shown target SHA256: 86e2ed6bdcf21aa6d32ce7f495fedb77704421d1bda8d9fa65f725830711bd59

### Proposed decision

```json
{
  "claimId": "claim_b6b9275fc5066b25d7ad557407914d1f",
  "sourceUnitDigest": "86e2ed6bdcf21aa6d32ce7f495fedb77704421d1bda8d9fa65f725830711bd59",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "86e2ed6bdcf21aa6d32ce7f495fedb77704421d1bda8d9fa65f725830711bd59",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Worker filesystem and process envelope"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-13 (lines 91–92) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-16 (lines 115–116); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Revealed knowledge cannot be revoked. A fresh independent assessment uses a new
worker context. A replaced worker does not inherit prior draft access by accident.
```

### Full target shown text

```text
Revealed knowledge cannot be revoked. A fresh independent assessment uses a new
worker context. A replaced worker does not inherit prior draft access by accident.
```

## claim_fcb4b54db2c808ede200d8930a05638a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#provider-transport-alternatives, lines 94–94.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#provider-transport-alternatives.
Source digest: 3b5e3e234e585e0d4d6ca78d34e9658a9dfe771d555da3e9f3aaa2c9701b0888
Target digest: 3b5e3e234e585e0d4d6ca78d34e9658a9dfe771d555da3e9f3aaa2c9701b0888
Shown source SHA256: 33880ba9a6339b77e6efe404fa15b50890044aa8d84661b466d0151c1dc74190
Shown target SHA256: 33880ba9a6339b77e6efe404fa15b50890044aa8d84661b466d0151c1dc74190

### Proposed decision

```json
{
  "claimId": "claim_fcb4b54db2c808ede200d8930a05638a",
  "sourceUnitDigest": "3b5e3e234e585e0d4d6ca78d34e9658a9dfe771d555da3e9f3aaa2c9701b0888",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "provider-transport-alternatives",
  "targetUnitDigest": "3b5e3e234e585e0d4d6ca78d34e9658a9dfe771d555da3e9f3aaa2c9701b0888",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#provider-transport-alternatives (lines 94–94) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#provider-transport-alternatives (lines 118–118); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Provider transport alternatives

| Alternative | Benefit | Cost / failure mode | Assessment |
|---|---|---|---|
| Full host home/auth bind plus network | Existing CLIs likely need less adaptation | Exposes account credentials, shared history, and unrelated data; unbounded direct calls | Reject for this threat model |
| Narrow mounts plus direct scoped provider credential | Smaller setup where backend issues enforceable per-run credentials | Credential is visible to worker; quota/expiry/endpoint restrictions must exist and be proved | Conditional option, no backend support assumed |
| Narrow mounts plus credential-holding inference relay | Worker never receives service account secret; relay can reserve per-run budget | CLI compatibility, streaming, cancellation, auth protocol and transport need proof | Preferred candidate to evaluate |
| Trusted model client with only sandboxed tool execution | Keeps credentials outside shell by construction | Requires a host whose tool routing cannot bypass the sandbox; may replace CLI experience | Fallback candidate, no new agent loop chosen yet |

The relay must authenticate a Run-scoped endpoint, pin provider/model selection,
reject arbitrary destinations/credential forwarding, reserve usage before calls,
limit requests/bytes/output, and revoke on Run end. It is not a general HTTP proxy
or a host-tool MCP endpoint. Worker possession of its inference capability is
expected; using it must not open coordinator methods or another Run's budget.

For a CLI that hardcodes its own login/transport and cannot use a constrained
endpoint or enforceable scoped credential, record incompatibility. Do not mount
the real credential store as an automatic fallback. No claim about current
provider proxy compatibility has been verified in this document; verify the exact
installed CLI and authoritative provider documentation before choosing one.

A provider necessarily sees authorized prompt data. Local isolation does not
prove remote confidentiality or a provider's claimed model identity. Keep
requested/configured/observed provenance distinct. An application that allows
research network access needs a separate egress capability, not unrestricted
network inherited from inference access.
```

### Full target shown text

```text
## Provider transport alternatives

| Alternative | Benefit | Cost / failure mode | Assessment |
|---|---|---|---|
| Full host home/auth bind plus network | Existing CLIs likely need less adaptation | Exposes account credentials, shared history, and unrelated data; unbounded direct calls | Reject for this threat model |
| Narrow mounts plus direct scoped provider credential | Smaller setup where backend issues enforceable per-run credentials | Credential is visible to worker; quota/expiry/endpoint restrictions must exist and be proved | Conditional option, no backend support assumed |
| Narrow mounts plus credential-holding inference relay | Worker never receives service account secret; relay can reserve per-run budget | CLI compatibility, streaming, cancellation, auth protocol and transport need proof | Preferred candidate to evaluate |
| Trusted model client with only sandboxed tool execution | Keeps credentials outside shell by construction | Requires a host whose tool routing cannot bypass the sandbox; may replace CLI experience | Fallback candidate, no new agent loop chosen yet |

The relay must authenticate a Run-scoped endpoint, pin provider/model selection,
reject arbitrary destinations/credential forwarding, reserve usage before calls,
limit requests/bytes/output, and revoke on Run end. It is not a general HTTP proxy
or a host-tool MCP endpoint. Worker possession of its inference capability is
expected; using it must not open coordinator methods or another Run's budget.

For a CLI that hardcodes its own login/transport and cannot use a constrained
endpoint or enforceable scoped credential, record incompatibility. Do not mount
the real credential store as an automatic fallback. No claim about current
provider proxy compatibility has been verified in this document; verify the exact
installed CLI and authoritative provider documentation before choosing one.

A provider necessarily sees authorized prompt data. Local isolation does not
prove remote confidentiality or a provider's claimed model identity. Keep
requested/configured/observed provenance distinct. An application that allows
research network access needs a separate egress capability, not unrestricted
network inherited from inference access.
```

## claim_7453f71931843b2ae45b610903613c1e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-14, lines 96–101.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-17.
Source digest: ae3c720b05cc7c0172c22b03e63bda611f524a04b150eb4f609c287a0bcbeb3c
Target digest: ae3c720b05cc7c0172c22b03e63bda611f524a04b150eb4f609c287a0bcbeb3c
Shown source SHA256: ae3c720b05cc7c0172c22b03e63bda611f524a04b150eb4f609c287a0bcbeb3c
Shown target SHA256: ae3c720b05cc7c0172c22b03e63bda611f524a04b150eb4f609c287a0bcbeb3c

### Proposed decision

```json
{
  "claimId": "claim_7453f71931843b2ae45b610903613c1e",
  "sourceUnitDigest": "ae3c720b05cc7c0172c22b03e63bda611f524a04b150eb4f609c287a0bcbeb3c",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "ae3c720b05cc7c0172c22b03e63bda611f524a04b150eb4f609c287a0bcbeb3c",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Provider transport alternatives"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-14 (lines 96–101) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-17 (lines 120–125); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Alternative | Benefit | Cost / failure mode | Assessment |
|---|---|---|---|
| Full host home/auth bind plus network | Existing CLIs likely need less adaptation | Exposes account credentials, shared history, and unrelated data; unbounded direct calls | Reject for this threat model |
| Narrow mounts plus direct scoped provider credential | Smaller setup where backend issues enforceable per-run credentials | Credential is visible to worker; quota/expiry/endpoint restrictions must exist and be proved | Conditional option, no backend support assumed |
| Narrow mounts plus credential-holding inference relay | Worker never receives service account secret; relay can reserve per-run budget | CLI compatibility, streaming, cancellation, auth protocol and transport need proof | Preferred candidate to evaluate |
| Trusted model client with only sandboxed tool execution | Keeps credentials outside shell by construction | Requires a host whose tool routing cannot bypass the sandbox; may replace CLI experience | Fallback candidate, no new agent loop chosen yet |
```

### Full target shown text

```text
| Alternative | Benefit | Cost / failure mode | Assessment |
|---|---|---|---|
| Full host home/auth bind plus network | Existing CLIs likely need less adaptation | Exposes account credentials, shared history, and unrelated data; unbounded direct calls | Reject for this threat model |
| Narrow mounts plus direct scoped provider credential | Smaller setup where backend issues enforceable per-run credentials | Credential is visible to worker; quota/expiry/endpoint restrictions must exist and be proved | Conditional option, no backend support assumed |
| Narrow mounts plus credential-holding inference relay | Worker never receives service account secret; relay can reserve per-run budget | CLI compatibility, streaming, cancellation, auth protocol and transport need proof | Preferred candidate to evaluate |
| Trusted model client with only sandboxed tool execution | Keeps credentials outside shell by construction | Requires a host whose tool routing cannot bypass the sandbox; may replace CLI experience | Fallback candidate, no new agent loop chosen yet |
```

## claim_7815a9867a975102427ae40bc81fb7e8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-15, lines 103–107.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-18.
Source digest: 466131e33d0d33bd9c0eb708886d8b25aa2fae1429f0a9c1f6cdbd8afff23da6
Target digest: 466131e33d0d33bd9c0eb708886d8b25aa2fae1429f0a9c1f6cdbd8afff23da6
Shown source SHA256: 466131e33d0d33bd9c0eb708886d8b25aa2fae1429f0a9c1f6cdbd8afff23da6
Shown target SHA256: 466131e33d0d33bd9c0eb708886d8b25aa2fae1429f0a9c1f6cdbd8afff23da6

### Proposed decision

```json
{
  "claimId": "claim_7815a9867a975102427ae40bc81fb7e8",
  "sourceUnitDigest": "466131e33d0d33bd9c0eb708886d8b25aa2fae1429f0a9c1f6cdbd8afff23da6",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "466131e33d0d33bd9c0eb708886d8b25aa2fae1429f0a9c1f6cdbd8afff23da6",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Provider transport alternatives"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-15 (lines 103–107) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-18 (lines 127–131); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The relay must authenticate a Run-scoped endpoint, pin provider/model selection,
reject arbitrary destinations/credential forwarding, reserve usage before calls,
limit requests/bytes/output, and revoke on Run end. It is not a general HTTP proxy
or a host-tool MCP endpoint. Worker possession of its inference capability is
expected; using it must not open coordinator methods or another Run's budget.
```

### Full target shown text

```text
The relay must authenticate a Run-scoped endpoint, pin provider/model selection,
reject arbitrary destinations/credential forwarding, reserve usage before calls,
limit requests/bytes/output, and revoke on Run end. It is not a general HTTP proxy
or a host-tool MCP endpoint. Worker possession of its inference capability is
expected; using it must not open coordinator methods or another Run's budget.
```

## claim_f869376e0be36aed8b705875839fb6d8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-16, lines 109–113.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-19.
Source digest: 28602bbf633c0e5586dad560644d760b0851edae0a5bad18624d1613c526f14c
Target digest: 28602bbf633c0e5586dad560644d760b0851edae0a5bad18624d1613c526f14c
Shown source SHA256: 28602bbf633c0e5586dad560644d760b0851edae0a5bad18624d1613c526f14c
Shown target SHA256: 28602bbf633c0e5586dad560644d760b0851edae0a5bad18624d1613c526f14c

### Proposed decision

```json
{
  "claimId": "claim_f869376e0be36aed8b705875839fb6d8",
  "sourceUnitDigest": "28602bbf633c0e5586dad560644d760b0851edae0a5bad18624d1613c526f14c",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "28602bbf633c0e5586dad560644d760b0851edae0a5bad18624d1613c526f14c",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Provider transport alternatives"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-16 (lines 109–113) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-19 (lines 133–137); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
For a CLI that hardcodes its own login/transport and cannot use a constrained
endpoint or enforceable scoped credential, record incompatibility. Do not mount
the real credential store as an automatic fallback. No claim about current
provider proxy compatibility has been verified in this document; verify the exact
installed CLI and authoritative provider documentation before choosing one.
```

### Full target shown text

```text
For a CLI that hardcodes its own login/transport and cannot use a constrained
endpoint or enforceable scoped credential, record incompatibility. Do not mount
the real credential store as an automatic fallback. No claim about current
provider proxy compatibility has been verified in this document; verify the exact
installed CLI and authoritative provider documentation before choosing one.
```

## claim_1b4b61f33b451a48c44b733887f07338

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-17, lines 115–119.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-20.
Source digest: 173eeca0c737209c65cd398b5ab150ae1a63c75990dad49884cc6944199ae62b
Target digest: 173eeca0c737209c65cd398b5ab150ae1a63c75990dad49884cc6944199ae62b
Shown source SHA256: 173eeca0c737209c65cd398b5ab150ae1a63c75990dad49884cc6944199ae62b
Shown target SHA256: 173eeca0c737209c65cd398b5ab150ae1a63c75990dad49884cc6944199ae62b

### Proposed decision

```json
{
  "claimId": "claim_1b4b61f33b451a48c44b733887f07338",
  "sourceUnitDigest": "173eeca0c737209c65cd398b5ab150ae1a63c75990dad49884cc6944199ae62b",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "173eeca0c737209c65cd398b5ab150ae1a63c75990dad49884cc6944199ae62b",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Provider transport alternatives"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-17 (lines 115–119) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-20 (lines 139–143); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A provider necessarily sees authorized prompt data. Local isolation does not
prove remote confidentiality or a provider's claimed model identity. Keep
requested/configured/observed provenance distinct. An application that allows
research network access needs a separate egress capability, not unrestricted
network inherited from inference access.
```

### Full target shown text

```text
A provider necessarily sees authorized prompt data. Local isolation does not
prove remote confidentiality or a provider's claimed model identity. Keep
requested/configured/observed provenance distinct. An application that allows
research network access needs a separate egress capability, not unrestricted
network inherited from inference access.
```

## claim_408a865dc7046c8a82e3ccccb2444d66

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#control-authentication-and-bounded-recruitment, lines 121–121.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#control-authentication-and-bounded-recruitment.
Source digest: f941c738409900d32d4e2355ae7296248275e6f4fa7b2a8a261f654f6999680b
Target digest: f941c738409900d32d4e2355ae7296248275e6f4fa7b2a8a261f654f6999680b
Shown source SHA256: dfb0954f8b879d2718517233aee0ed8753a4a897d7e935e9e37dbe5e6d85937e
Shown target SHA256: dfb0954f8b879d2718517233aee0ed8753a4a897d7e935e9e37dbe5e6d85937e

### Proposed decision

```json
{
  "claimId": "claim_408a865dc7046c8a82e3ccccb2444d66",
  "sourceUnitDigest": "f941c738409900d32d4e2355ae7296248275e6f4fa7b2a8a261f654f6999680b",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "control-authentication-and-bounded-recruitment",
  "targetUnitDigest": "f941c738409900d32d4e2355ae7296248275e6f4fa7b2a8a261f654f6999680b",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#control-authentication-and-bounded-recruitment (lines 121–121) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#control-authentication-and-bounded-recruitment (lines 145–145); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Control authentication and bounded recruitment

The coordinator receives an authenticated, session-scoped process capability.
Worker credentials permit only their Run's input/output and inference services.
Human input is authenticated on a separate channel. IDs and hashes are references,
not credentials. Peer credentials alone are insufficient if all processes remain
indistinguishable under the same user; isolation and endpoint scoping must provide
the actual separation.

A specialist request is prose plus a proposed execution contract. Runtime checks
resource scope, context subset, capability, remaining aggregate budget, and
membership; the coordinator chooses the specialty and task. No new role enum or
predeclared graph node is needed for that choice. Direct child spawning must be
unavailable or accounted for at the boundary, not merely discouraged by a depth
environment variable. A worker may ask the coordinator to recruit; it cannot mint
an independent budget or credential itself.

Cancellation revokes service capabilities as well as terminating process groups.
Resume does not revive old credentials automatically. Coordinator lease/epoch
fences stale controllers; reservations and idempotency keys belong to durable
control state. A timed-out external inference may still be billable: reserve its
maximum liability until reconciled rather than refunding on local disconnect.
```

### Full target shown text

```text
## Control authentication and bounded recruitment

The coordinator receives an authenticated, session-scoped process capability.
Worker credentials permit only their Run's input/output and inference services.
Human input is authenticated on a separate channel. IDs and hashes are references,
not credentials. Peer credentials alone are insufficient if all processes remain
indistinguishable under the same user; isolation and endpoint scoping must provide
the actual separation.

A specialist request is prose plus a proposed execution contract. Runtime checks
resource scope, context subset, capability, remaining aggregate budget, and
membership; the coordinator chooses the specialty and task. No new role enum or
predeclared graph node is needed for that choice. Direct child spawning must be
unavailable or accounted for at the boundary, not merely discouraged by a depth
environment variable. A worker may ask the coordinator to recruit; it cannot mint
an independent budget or credential itself.

Cancellation revokes service capabilities as well as terminating process groups.
Resume does not revive old credentials automatically. Coordinator lease/epoch
fences stale controllers; reservations and idempotency keys belong to durable
control state. A timed-out external inference may still be billable: reserve its
maximum liability until reconciled rather than refunding on local disconnect.
```

## claim_ae6a17ae416f56962d19e8901f927ff6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-18, lines 123–128.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-21.
Source digest: 450f06bf9bc418b79a276066519f54f59141a62f293f022cb82138044be0f794
Target digest: 450f06bf9bc418b79a276066519f54f59141a62f293f022cb82138044be0f794
Shown source SHA256: 450f06bf9bc418b79a276066519f54f59141a62f293f022cb82138044be0f794
Shown target SHA256: 450f06bf9bc418b79a276066519f54f59141a62f293f022cb82138044be0f794

### Proposed decision

```json
{
  "claimId": "claim_ae6a17ae416f56962d19e8901f927ff6",
  "sourceUnitDigest": "450f06bf9bc418b79a276066519f54f59141a62f293f022cb82138044be0f794",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "450f06bf9bc418b79a276066519f54f59141a62f293f022cb82138044be0f794",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Control authentication and bounded recruitment"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-18 (lines 123–128) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-21 (lines 147–152); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The coordinator receives an authenticated, session-scoped process capability.
Worker credentials permit only their Run's input/output and inference services.
Human input is authenticated on a separate channel. IDs and hashes are references,
not credentials. Peer credentials alone are insufficient if all processes remain
indistinguishable under the same user; isolation and endpoint scoping must provide
the actual separation.
```

### Full target shown text

```text
The coordinator receives an authenticated, session-scoped process capability.
Worker credentials permit only their Run's input/output and inference services.
Human input is authenticated on a separate channel. IDs and hashes are references,
not credentials. Peer credentials alone are insufficient if all processes remain
indistinguishable under the same user; isolation and endpoint scoping must provide
the actual separation.
```

## claim_1da5178ca2b9a6220595560fd562c688

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-19, lines 130–136.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-22.
Source digest: d2c5653dde3b78b4ba7f1a42ce1e3a27abd1d821e426cd1c4106196c0ef50342
Target digest: d2c5653dde3b78b4ba7f1a42ce1e3a27abd1d821e426cd1c4106196c0ef50342
Shown source SHA256: d2c5653dde3b78b4ba7f1a42ce1e3a27abd1d821e426cd1c4106196c0ef50342
Shown target SHA256: d2c5653dde3b78b4ba7f1a42ce1e3a27abd1d821e426cd1c4106196c0ef50342

### Proposed decision

```json
{
  "claimId": "claim_1da5178ca2b9a6220595560fd562c688",
  "sourceUnitDigest": "d2c5653dde3b78b4ba7f1a42ce1e3a27abd1d821e426cd1c4106196c0ef50342",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "d2c5653dde3b78b4ba7f1a42ce1e3a27abd1d821e426cd1c4106196c0ef50342",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Control authentication and bounded recruitment"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-19 (lines 130–136) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-22 (lines 154–160); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A specialist request is prose plus a proposed execution contract. Runtime checks
resource scope, context subset, capability, remaining aggregate budget, and
membership; the coordinator chooses the specialty and task. No new role enum or
predeclared graph node is needed for that choice. Direct child spawning must be
unavailable or accounted for at the boundary, not merely discouraged by a depth
environment variable. A worker may ask the coordinator to recruit; it cannot mint
an independent budget or credential itself.
```

### Full target shown text

```text
A specialist request is prose plus a proposed execution contract. Runtime checks
resource scope, context subset, capability, remaining aggregate budget, and
membership; the coordinator chooses the specialty and task. No new role enum or
predeclared graph node is needed for that choice. Direct child spawning must be
unavailable or accounted for at the boundary, not merely discouraged by a depth
environment variable. A worker may ask the coordinator to recruit; it cannot mint
an independent budget or credential itself.
```

## claim_b529507c0ed2d580a019de930c822b43

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-20, lines 138–142.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-23.
Source digest: c3ac65f228fcb392cac7ce203714efae107aca0e85d1b65fc590c02363b89cd4
Target digest: c3ac65f228fcb392cac7ce203714efae107aca0e85d1b65fc590c02363b89cd4
Shown source SHA256: c3ac65f228fcb392cac7ce203714efae107aca0e85d1b65fc590c02363b89cd4
Shown target SHA256: c3ac65f228fcb392cac7ce203714efae107aca0e85d1b65fc590c02363b89cd4

### Proposed decision

```json
{
  "claimId": "claim_b529507c0ed2d580a019de930c822b43",
  "sourceUnitDigest": "c3ac65f228fcb392cac7ce203714efae107aca0e85d1b65fc590c02363b89cd4",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "c3ac65f228fcb392cac7ce203714efae107aca0e85d1b65fc590c02363b89cd4",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Control authentication and bounded recruitment"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-20 (lines 138–142) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-23 (lines 162–166); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Cancellation revokes service capabilities as well as terminating process groups.
Resume does not revive old credentials automatically. Coordinator lease/epoch
fences stale controllers; reservations and idempotency keys belong to durable
control state. A timed-out external inference may still be billable: reserve its
maximum liability until reconciled rather than refunding on local disconnect.
```

### Full target shown text

```text
Cancellation revokes service capabilities as well as terminating process groups.
Resume does not revive old credentials automatically. Coordinator lease/epoch
fences stale controllers; reservations and idempotency keys belong to durable
control state. A timed-out external inference may still be billable: reserve its
maximum liability until reconciled rather than refunding on local disconnect.
```

## claim_bfc686ebd4af4abcfaa4bcd93d310c9c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#output-ingestion-and-mutation, lines 144–144.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#output-ingestion-and-mutation.
Source digest: 49c961053f97044e466a63410bb4364f93329e35873573dc7ef4a7793fc7f1d3
Target digest: 49c961053f97044e466a63410bb4364f93329e35873573dc7ef4a7793fc7f1d3
Shown source SHA256: 96038dd50660ac21a8780aa0b5b358a03fb7e6d24fc8dda430eef621f2ea7585
Shown target SHA256: 96038dd50660ac21a8780aa0b5b358a03fb7e6d24fc8dda430eef621f2ea7585

### Proposed decision

```json
{
  "claimId": "claim_bfc686ebd4af4abcfaa4bcd93d310c9c",
  "sourceUnitDigest": "49c961053f97044e466a63410bb4364f93329e35873573dc7ef4a7793fc7f1d3",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "output-ingestion-and-mutation",
  "targetUnitDigest": "49c961053f97044e466a63410bb4364f93329e35873573dc7ef4a7793fc7f1d3",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#output-ingestion-and-mutation (lines 144–144) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#output-ingestion-and-mutation (lines 168–168); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Output ingestion and mutation

The worker writes only to its outbox. The trusted collector accepts bounded regular
files, rejects symlinks/path traversal/special files, and binds collected bytes to
the actual Run. Freeze the outbox or stop all writers before collecting; merely
hashing a still-mutable path invites a race. Canonical evidence and result files
are written by the collector outside the worker namespace.

A worker result is a claim, not an attestation of execution policy or success.
The collector supplies observed exit/routing/provenance and validators supply
candidate-specific evidence. Test commands execute untrusted candidate code and
need their own bounded execution rights. Integration belongs to the resource
owner, uses expected revision/CAS, and is separate from coordination close.
```

### Full target shown text

```text
## Output ingestion and mutation

The worker writes only to its outbox. The trusted collector accepts bounded regular
files, rejects symlinks/path traversal/special files, and binds collected bytes to
the actual Run. Freeze the outbox or stop all writers before collecting; merely
hashing a still-mutable path invites a race. Canonical evidence and result files
are written by the collector outside the worker namespace.

A worker result is a claim, not an attestation of execution policy or success.
The collector supplies observed exit/routing/provenance and validators supply
candidate-specific evidence. Test commands execute untrusted candidate code and
need their own bounded execution rights. Integration belongs to the resource
owner, uses expected revision/CAS, and is separate from coordination close.
```

## claim_7bbd1a704be07e51569c5a30224eb41c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-21, lines 146–150.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-24.
Source digest: 8b89c74975dca94f586826232effe862f2a70c503667f02271c5d50a306760b0
Target digest: 8b89c74975dca94f586826232effe862f2a70c503667f02271c5d50a306760b0
Shown source SHA256: 8b89c74975dca94f586826232effe862f2a70c503667f02271c5d50a306760b0
Shown target SHA256: 8b89c74975dca94f586826232effe862f2a70c503667f02271c5d50a306760b0

### Proposed decision

```json
{
  "claimId": "claim_7bbd1a704be07e51569c5a30224eb41c",
  "sourceUnitDigest": "8b89c74975dca94f586826232effe862f2a70c503667f02271c5d50a306760b0",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "8b89c74975dca94f586826232effe862f2a70c503667f02271c5d50a306760b0",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Output ingestion and mutation"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-21 (lines 146–150) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-24 (lines 170–174); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The worker writes only to its outbox. The trusted collector accepts bounded regular
files, rejects symlinks/path traversal/special files, and binds collected bytes to
the actual Run. Freeze the outbox or stop all writers before collecting; merely
hashing a still-mutable path invites a race. Canonical evidence and result files
are written by the collector outside the worker namespace.
```

### Full target shown text

```text
The worker writes only to its outbox. The trusted collector accepts bounded regular
files, rejects symlinks/path traversal/special files, and binds collected bytes to
the actual Run. Freeze the outbox or stop all writers before collecting; merely
hashing a still-mutable path invites a race. Canonical evidence and result files
are written by the collector outside the worker namespace.
```

## claim_670134056ffe65d60b71b3cac8132a8b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-22, lines 152–156.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-25.
Source digest: db035c2f117a283999718c63a5f7592a625507b289406126d64285a8e8a57fe2
Target digest: db035c2f117a283999718c63a5f7592a625507b289406126d64285a8e8a57fe2
Shown source SHA256: db035c2f117a283999718c63a5f7592a625507b289406126d64285a8e8a57fe2
Shown target SHA256: db035c2f117a283999718c63a5f7592a625507b289406126d64285a8e8a57fe2

### Proposed decision

```json
{
  "claimId": "claim_670134056ffe65d60b71b3cac8132a8b",
  "sourceUnitDigest": "db035c2f117a283999718c63a5f7592a625507b289406126d64285a8e8a57fe2",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "db035c2f117a283999718c63a5f7592a625507b289406126d64285a8e8a57fe2",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Output ingestion and mutation"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-22 (lines 152–156) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-25 (lines 176–180); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
A worker result is a claim, not an attestation of execution policy or success.
The collector supplies observed exit/routing/provenance and validators supply
candidate-specific evidence. Test commands execute untrusted candidate code and
need their own bounded execution rights. Integration belongs to the resource
owner, uses expected revision/CAS, and is separate from coordination close.
```

### Full target shown text

```text
A worker result is a claim, not an attestation of execution policy or success.
The collector supplies observed exit/routing/provenance and validators supply
candidate-specific evidence. Test commands execute untrusted candidate code and
need their own bounded execution rights. Integration belongs to the resource
owner, uses expected revision/CAS, and is separate from coordination close.
```

## claim_93f801f0a48ef232ba52aca52eea2adf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#minimum-public-action-gaps-and-ownership, lines 158–158.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#minimum-public-action-gaps-and-ownership.
Source digest: 5fbeaacc0ec9d6d972804a36feac5b005f9dcf2c6125b0ff0d59eb264ceaaf9b
Target digest: 5fbeaacc0ec9d6d972804a36feac5b005f9dcf2c6125b0ff0d59eb264ceaaf9b
Shown source SHA256: a886ebb30df5a298e93e696579b36d14da12691081656ce0d1098919d7ecdbd0
Shown target SHA256: a886ebb30df5a298e93e696579b36d14da12691081656ce0d1098919d7ecdbd0

### Proposed decision

```json
{
  "claimId": "claim_93f801f0a48ef232ba52aca52eea2adf",
  "sourceUnitDigest": "5fbeaacc0ec9d6d972804a36feac5b005f9dcf2c6125b0ff0d59eb264ceaaf9b",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "minimum-public-action-gaps-and-ownership",
  "targetUnitDigest": "5fbeaacc0ec9d6d972804a36feac5b005f9dcf2c6125b0ff0d59eb264ceaaf9b",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#minimum-public-action-gaps-and-ownership (lines 158–158) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#minimum-public-action-gaps-and-ownership (lines 182–182); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Minimum public-action gaps and ownership

| Gap | Existing owner / useful capability | Smallest boundary addition to investigate |
|---|---|---|
| Dynamic recruitment | Coordination engine consult/slot machinery | Authenticated bounded Assignment creation independent of graph bindings |
| Retry, replace, cancel | Engine exports already exist | Public commands lowering to those owners, with scoped authority and shared counters |
| Context disclosure | Windows/grants and artifact lineage | Exact materialized reads; grant validation before disclosure, not only contribution linkage |
| Role/policy delivery | Assignment policy, renderer, dispatch resolver | Open doctrine refs and full resolved packet; consistent per-assignment binding |
| Safe output submission | Assignment runner/result ladder | Outbox-to-canonical ingestion boundary, preserving RunResult format where possible |
| Explicit close | Session engine/quorum | Authorized close request with applicable candidate obligations; no unconditional auto-close |
| Cold resume | Store/replay/chain | Pinned checkpoint refs, pending obligations, exposure history, controller fencing |
| Provider credential boundary | Dispatch transport/adapter | Environment allowlist and proven restricted service access; never a separate cognitive planner |

These are seams, not permission to edit listed modules. Shared source/config,
contracts, setup/doctor registration, and tests need a concrete reviewed scope
coordinated with Advisory P02/P03. No such production changes were made here.
```

### Full target shown text

```text
## Minimum public-action gaps and ownership

| Gap | Existing owner / useful capability | Smallest boundary addition to investigate |
|---|---|---|
| Dynamic recruitment | Coordination engine consult/slot machinery | Authenticated bounded Assignment creation independent of graph bindings |
| Retry, replace, cancel | Engine exports already exist | Public commands lowering to those owners, with scoped authority and shared counters |
| Context disclosure | Windows/grants and artifact lineage | Exact materialized reads; grant validation before disclosure, not only contribution linkage |
| Role/policy delivery | Assignment policy, renderer, dispatch resolver | Open doctrine refs and full resolved packet; consistent per-assignment binding |
| Safe output submission | Assignment runner/result ladder | Outbox-to-canonical ingestion boundary, preserving RunResult format where possible |
| Explicit close | Session engine/quorum | Authorized close request with applicable candidate obligations; no unconditional auto-close |
| Cold resume | Store/replay/chain | Pinned checkpoint refs, pending obligations, exposure history, controller fencing |
| Provider credential boundary | Dispatch transport/adapter | Environment allowlist and proven restricted service access; never a separate cognitive planner |

These are seams, not permission to edit listed modules. Shared source/config,
contracts, setup/doctor registration, and tests need a concrete reviewed scope
coordinated with Advisory P02/P03. No such production changes were made here.
```

## claim_8ba300aa00fe51388617d26b8de8e396

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-23, lines 160–169.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-26.
Source digest: 4bb950410ff77952b6508680070bb88a25120f9b1db932f78c10ba406c50c618
Target digest: 4bb950410ff77952b6508680070bb88a25120f9b1db932f78c10ba406c50c618
Shown source SHA256: 4bb950410ff77952b6508680070bb88a25120f9b1db932f78c10ba406c50c618
Shown target SHA256: 4bb950410ff77952b6508680070bb88a25120f9b1db932f78c10ba406c50c618

### Proposed decision

```json
{
  "claimId": "claim_8ba300aa00fe51388617d26b8de8e396",
  "sourceUnitDigest": "4bb950410ff77952b6508680070bb88a25120f9b1db932f78c10ba406c50c618",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "4bb950410ff77952b6508680070bb88a25120f9b1db932f78c10ba406c50c618",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Minimum public-action gaps and ownership"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-23 (lines 160–169) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-26 (lines 184–193); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Gap | Existing owner / useful capability | Smallest boundary addition to investigate |
|---|---|---|
| Dynamic recruitment | Coordination engine consult/slot machinery | Authenticated bounded Assignment creation independent of graph bindings |
| Retry, replace, cancel | Engine exports already exist | Public commands lowering to those owners, with scoped authority and shared counters |
| Context disclosure | Windows/grants and artifact lineage | Exact materialized reads; grant validation before disclosure, not only contribution linkage |
| Role/policy delivery | Assignment policy, renderer, dispatch resolver | Open doctrine refs and full resolved packet; consistent per-assignment binding |
| Safe output submission | Assignment runner/result ladder | Outbox-to-canonical ingestion boundary, preserving RunResult format where possible |
| Explicit close | Session engine/quorum | Authorized close request with applicable candidate obligations; no unconditional auto-close |
| Cold resume | Store/replay/chain | Pinned checkpoint refs, pending obligations, exposure history, controller fencing |
| Provider credential boundary | Dispatch transport/adapter | Environment allowlist and proven restricted service access; never a separate cognitive planner |
```

### Full target shown text

```text
| Gap | Existing owner / useful capability | Smallest boundary addition to investigate |
|---|---|---|
| Dynamic recruitment | Coordination engine consult/slot machinery | Authenticated bounded Assignment creation independent of graph bindings |
| Retry, replace, cancel | Engine exports already exist | Public commands lowering to those owners, with scoped authority and shared counters |
| Context disclosure | Windows/grants and artifact lineage | Exact materialized reads; grant validation before disclosure, not only contribution linkage |
| Role/policy delivery | Assignment policy, renderer, dispatch resolver | Open doctrine refs and full resolved packet; consistent per-assignment binding |
| Safe output submission | Assignment runner/result ladder | Outbox-to-canonical ingestion boundary, preserving RunResult format where possible |
| Explicit close | Session engine/quorum | Authorized close request with applicable candidate obligations; no unconditional auto-close |
| Cold resume | Store/replay/chain | Pinned checkpoint refs, pending obligations, exposure history, controller fencing |
| Provider credential boundary | Dispatch transport/adapter | Environment allowlist and proven restricted service access; never a separate cognitive planner |
```

## claim_92c3c3b2a0b5991999883dba598126bb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-24, lines 171–173.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-27.
Source digest: 2efe36e107f1af870343b145a8ee661b91db753e078fe1e3b223515351cda125
Target digest: 2efe36e107f1af870343b145a8ee661b91db753e078fe1e3b223515351cda125
Shown source SHA256: 2efe36e107f1af870343b145a8ee661b91db753e078fe1e3b223515351cda125
Shown target SHA256: 2efe36e107f1af870343b145a8ee661b91db753e078fe1e3b223515351cda125

### Proposed decision

```json
{
  "claimId": "claim_92c3c3b2a0b5991999883dba598126bb",
  "sourceUnitDigest": "2efe36e107f1af870343b145a8ee661b91db753e078fe1e3b223515351cda125",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "2efe36e107f1af870343b145a8ee661b91db753e078fe1e3b223515351cda125",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Minimum public-action gaps and ownership"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-24 (lines 171–173) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-27 (lines 195–197); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
These are seams, not permission to edit listed modules. Shared source/config,
contracts, setup/doctor registration, and tests need a concrete reviewed scope
coordinated with Advisory P02/P03. No such production changes were made here.
```

### Full target shown text

```text
These are seams, not permission to edit listed modules. Shared source/config,
contracts, setup/doctor registration, and tests need a concrete reviewed scope
coordinated with Advisory P02/P03. No such production changes were made here.
```

## claim_1ff50f0e3084f64e3c574a0d453155f4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#readiness-and-next-experiments, lines 175–175.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#readiness-and-next-experiments.
Source digest: 580d8dd940286c38d51a86162d68f8f5b8c576c46d27bb86a8f1fe947e31ec5f
Target digest: 580d8dd940286c38d51a86162d68f8f5b8c576c46d27bb86a8f1fe947e31ec5f
Shown source SHA256: 735a20ed7ef22dcac6011758e63b23f458f3f470b57734159cc8338d046f56b1
Shown target SHA256: 735a20ed7ef22dcac6011758e63b23f458f3f470b57734159cc8338d046f56b1

### Proposed decision

```json
{
  "claimId": "claim_1ff50f0e3084f64e3c574a0d453155f4",
  "sourceUnitDigest": "580d8dd940286c38d51a86162d68f8f5b8c576c46d27bb86a8f1fe947e31ec5f",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "readiness-and-next-experiments",
  "targetUnitDigest": "580d8dd940286c38d51a86162d68f8f5b8c576c46d27bb86a8f1fe947e31ec5f",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#readiness-and-next-experiments (lines 175–175) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#readiness-and-next-experiments (lines 199–199); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## Readiness and next experiments

Completed: static transport/outbox audit plus two synthetic environment cases.
Full provider execution remains unready. The next independent checks can use a
synthetic broker without provider credentials to demonstrate that a worker cannot
call coordinator methods, reuse a sibling's grant, spend a revoked capability, or
submit files racing ingestion. Such results must be labeled prototype-only.

Before a real provider run, freeze one exact adapter candidate, its runtime closure,
private scratch, supported transport, scoped authentication, usage cap, and kill/
resume behavior. Test startup and useful tool execution, not just absence of
writes. Do not infer provider usability from an OS-only mount pass. If none of the
installed adapters can satisfy this, report the gap instead of silently relaxing
rights or launching outside governed dispatch.

Acceptance of this boundary sketch and a shared implementation lease are separate
from the person's authorization to investigate. A later implementation must follow
existing distribution/setup/doctor and impact-analysis requirements. No new
gateway, network listener, provider client, or production dependency was installed
or started in this work.
```

### Full target shown text

```text
## Readiness and next experiments

Completed: static transport/outbox audit plus two synthetic environment cases.
Full provider execution remains unready. The next independent checks can use a
synthetic broker without provider credentials to demonstrate that a worker cannot
call coordinator methods, reuse a sibling's grant, spend a revoked capability, or
submit files racing ingestion. Such results must be labeled prototype-only.

Before a real provider run, freeze one exact adapter candidate, its runtime closure,
private scratch, supported transport, scoped authentication, usage cap, and kill/
resume behavior. Test startup and useful tool execution, not just absence of
writes. Do not infer provider usability from an OS-only mount pass. If none of the
installed adapters can satisfy this, report the gap instead of silently relaxing
rights or launching outside governed dispatch.

Acceptance of this boundary sketch and a shared implementation lease are separate
from the person's authorization to investigate. A later implementation must follow
existing distribution/setup/doctor and impact-analysis requirements. No new
gateway, network listener, provider client, or production dependency was installed
or started in this work.
```

## claim_7287c6a35c232ffd65407823e20e06cd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-25, lines 177–181.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-28.
Source digest: 6ab7397d8c58420efae0a1efc669f12ef90762649ead6af2ca5bfe1ee69752bb
Target digest: 6ab7397d8c58420efae0a1efc669f12ef90762649ead6af2ca5bfe1ee69752bb
Shown source SHA256: 6ab7397d8c58420efae0a1efc669f12ef90762649ead6af2ca5bfe1ee69752bb
Shown target SHA256: 6ab7397d8c58420efae0a1efc669f12ef90762649ead6af2ca5bfe1ee69752bb

### Proposed decision

```json
{
  "claimId": "claim_7287c6a35c232ffd65407823e20e06cd",
  "sourceUnitDigest": "6ab7397d8c58420efae0a1efc669f12ef90762649ead6af2ca5bfe1ee69752bb",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "6ab7397d8c58420efae0a1efc669f12ef90762649ead6af2ca5bfe1ee69752bb",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Readiness and next experiments"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-25 (lines 177–181) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-28 (lines 201–205); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Completed: static transport/outbox audit plus two synthetic environment cases.
Full provider execution remains unready. The next independent checks can use a
synthetic broker without provider credentials to demonstrate that a worker cannot
call coordinator methods, reuse a sibling's grant, spend a revoked capability, or
submit files racing ingestion. Such results must be labeled prototype-only.
```

### Full target shown text

```text
Completed: static transport/outbox audit plus two synthetic environment cases.
Full provider execution remains unready. The next independent checks can use a
synthetic broker without provider credentials to demonstrate that a worker cannot
call coordinator methods, reuse a sibling's grant, spend a revoked capability, or
submit files racing ingestion. Such results must be labeled prototype-only.
```

## claim_b060d9bd91a001ab34542dac1cb66912

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-26, lines 183–188.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-29.
Source digest: 1955a9f1a6b8de1c20d157e8029011025dfaa4f5393c7216e41f6db8938af46f
Target digest: 1955a9f1a6b8de1c20d157e8029011025dfaa4f5393c7216e41f6db8938af46f
Shown source SHA256: 1955a9f1a6b8de1c20d157e8029011025dfaa4f5393c7216e41f6db8938af46f
Shown target SHA256: 1955a9f1a6b8de1c20d157e8029011025dfaa4f5393c7216e41f6db8938af46f

### Proposed decision

```json
{
  "claimId": "claim_b060d9bd91a001ab34542dac1cb66912",
  "sourceUnitDigest": "1955a9f1a6b8de1c20d157e8029011025dfaa4f5393c7216e41f6db8938af46f",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "1955a9f1a6b8de1c20d157e8029011025dfaa4f5393c7216e41f6db8938af46f",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Readiness and next experiments"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-26 (lines 183–188) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-29 (lines 207–212); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Before a real provider run, freeze one exact adapter candidate, its runtime closure,
private scratch, supported transport, scoped authentication, usage cap, and kill/
resume behavior. Test startup and useful tool execution, not just absence of
writes. Do not infer provider usability from an OS-only mount pass. If none of the
installed adapters can satisfy this, report the gap instead of silently relaxing
rights or launching outside governed dispatch.
```

### Full target shown text

```text
Before a real provider run, freeze one exact adapter candidate, its runtime closure,
private scratch, supported transport, scoped authentication, usage cap, and kill/
resume behavior. Test startup and useful tool execution, not just absence of
writes. Do not infer provider usability from an OS-only mount pass. If none of the
installed adapters can satisfy this, report the gap instead of silently relaxing
rights or launching outside governed dispatch.
```

## claim_4d702208dbc1e8fbba573a3c6e364eb8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-27, lines 190–194.
Target: docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-30.
Source digest: dd63e14cbec5e4c43f88537a8357a96d443716e699bd14d1f7d7aa6ad6cb40dc
Target digest: dd63e14cbec5e4c43f88537a8357a96d443716e699bd14d1f7d7aa6ad6cb40dc
Shown source SHA256: dd63e14cbec5e4c43f88537a8357a96d443716e699bd14d1f7d7aa6ad6cb40dc
Shown target SHA256: dd63e14cbec5e4c43f88537a8357a96d443716e699bd14d1f7d7aa6ad6cb40dc

### Proposed decision

```json
{
  "claimId": "claim_4d702208dbc1e8fbba573a3c6e364eb8",
  "sourceUnitDigest": "dd63e14cbec5e4c43f88537a8357a96d443716e699bd14d1f7d7aa6ad6cb40dc",
  "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "dd63e14cbec5e4c43f88537a8357a96d443716e699bd14d1f7d7aa6ad6cb40dc",
  "targetAncestry": [
    "Coordination Envelope — Worker, Provider, and Control Boundary",
    "Readiness and next experiments"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-27 (lines 190–194) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-30 (lines 214–218); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Acceptance of this boundary sketch and a shared implementation lease are separate
from the person's authorization to investigate. A later implementation must follow
existing distribution/setup/doctor and impact-analysis requirements. No new
gateway, network listener, provider client, or production dependency was installed
or started in this work.
```

### Full target shown text

```text
Acceptance of this boundary sketch and a shared implementation lease are separate
from the person's authorization to investigate. A later implementation must follow
existing distribution/setup/doctor and impact-analysis requirements. No new
gateway, network listener, provider client, or production dependency was installed
or started in this work.
```
